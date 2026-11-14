import express from 'express';
import { pool, getOrInitPool } from '../../db/index.ts';
import { ensureErpTables } from '../../db/ensureErpTables.ts';
import {
  sendEmail,
  sendNotificationEmail,
  buildBrandedHtmlTemplate,
  SMTP_CANONICAL_USER
} from '../mailService.ts';

function inferMediaType(url: string, explicitType?: string): 'PHOTO' | 'VIDEO' {
  if (explicitType && explicitType.toUpperCase() === 'VIDEO') return 'VIDEO';
  if (explicitType && explicitType.toUpperCase() === 'PHOTO') return 'PHOTO';
  const lower = (url || '').toLowerCase();
  if (
    lower.includes('/video/upload/') ||
    /\.(mp4|mov|webm|mkv|avi|m4v)(\?.*)?$/.test(lower)
  ) {
    return 'VIDEO';
  }
  return 'PHOTO';
}

function formatClientRow(r: any) {
  return {
    id: r.id,
    clientCode: r.client_code,
    fullName: r.full_name,
    companyName: r.company_name,
    email: r.email,
    phone: r.phone,
    phoneSecondary: r.phone_secondary,
    address: r.address,
    city: r.city,
    country: r.country,
    status: r.status,
    lastLogin: r.last_login
  };
}

export function setupErpPlatformRoutes(app: express.Express) {
  const router = express.Router();
  const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.NETLIFY);
  const siteBaseUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || 'https://madeccgroup.online';

  // Ensure tables on first ERP/Client request (no-op after first pass)
  router.use(async (_req, _res, next) => {
    try {
      await ensureErpTables();
    } catch (err) {
      console.warn('[ERP_ROUTE_ENSURE_WARN]', err);
    }
    next();
  });

  const getDbClient = async () => {
    const activePool = pool || getOrInitPool();
    if (!activePool) {
      throw new Error('Database pool not available');
    }
    return await activePool.connect();
  };

  // ==========================================
  // 1. CLIENT PORTAL AUTHENTICATION & ACCESS
  // ==========================================

  // Client Login (supports email or client code)
  router.post('/client/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email/Client Code and password are required' });
    }

    let client;
    try {
      client = await getDbClient();
      const identifier = String(email).trim();
      const result = await client.query(
        'SELECT * FROM clients WHERE (LOWER(email) = LOWER($1) OR LOWER(client_code) = LOWER($1))',
        [identifier]
      );

      if (result.rows.length === 0) {
        return res.status(401).json({ success: false, message: 'No client account found matching that email or client code.' });
      }

      const clientRecord = result.rows[0];
      if (clientRecord.status !== 'ACTIVE') {
        return res.status(403).json({ success: false, message: 'This client portal account is currently suspended. Please contact MADECC administration.' });
      }

      const validPassword =
        !clientRecord.password_hash ||
        clientRecord.password_hash === password;

      if (!validPassword) {
        return res.status(401).json({ success: false, message: 'Invalid password provided. Use Forgot Password if you need a reset.' });
      }

      await client.query('UPDATE clients SET last_login = now() WHERE id = $1', [clientRecord.id]);

      res.cookie('madecc_client_token', `clt_${clientRecord.id}_${Date.now()}`, {
        httpOnly: true,
        secure: isProd,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        sameSite: 'lax',
        path: '/'
      });

      return res.json({
        success: true,
        message: 'Client authentication successful',
        client: formatClientRow(clientRecord)
      });
    } catch (err: any) {
      console.error('[CLIENT_LOGIN_ERROR]', err);
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // Client Logout
  router.post('/client/logout', (_req, res) => {
    res.clearCookie('madecc_client_token', {
      httpOnly: true,
      secure: isProd,
      sameSite: 'lax',
      path: '/'
    });
    return res.json({ success: true, message: 'Signed out cleanly' });
  });

  // Current Authenticated Client Session Check
  router.get('/client/me', async (req, res) => {
    const token = req.cookies?.madecc_client_token;
    const queryId = req.query.clientId ? Number(req.query.clientId) : null;

    let targetId: number | null = null;
    if (token && typeof token === 'string' && token.startsWith('clt_')) {
      const parts = token.split('_');
      const parsed = Number(parts[1]);
      if (Number.isFinite(parsed) && parsed > 0) targetId = parsed;
    } else if (queryId && Number.isFinite(queryId)) {
      targetId = queryId;
    }

    if (!targetId) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    let client;
    try {
      client = await getDbClient();
      const result = await client.query('SELECT * FROM clients WHERE id = $1 AND status = $2', [targetId, 'ACTIVE']);
      if (result.rows.length === 0) {
        return res.status(401).json({ success: false, message: 'Client session expired or suspended' });
      }
      return res.json({ success: true, client: formatClientRow(result.rows[0]) });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // Forgot Password -> Generates temporary password & sends via configured SMTP (kreboya603@gmail.com)
  router.post('/client/forgot-password', async (req, res) => {
    const { email } = req.body;
    if (!email || !String(email).trim()) {
      return res.status(400).json({ success: false, message: 'Please enter your registered email or client code.' });
    }

    let client;
    try {
      client = await getDbClient();
      const result = await client.query(
        'SELECT * FROM clients WHERE LOWER(email) = LOWER($1) OR LOWER(client_code) = LOWER($1)',
        [String(email).trim()]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'No active client account found with that email or code.' });
      }

      const rec = result.rows[0];
      const tempPassword = `Madecc-${Math.floor(100000 + Math.random() * 900000)}`;
      await client.query('UPDATE clients SET password_hash = $1, updated_at = now() WHERE id = $2', [tempPassword, rec.id]);

      const html = buildBrandedHtmlTemplate({
        title: 'Client Portal Password Reset',
        badge: 'SECURITY & PORTAL ACCESS',
        recipientName: rec.full_name,
        leadParagraph: 'A password reset was requested for your MADECC GROUP Client Construction Portal account.',
        sectionsHtml: `
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px;margin:16px 0;">
            <p style="margin:0 0 8px 0;font-size:13px;color:#475569;"><strong>Client Code:</strong> ${rec.client_code}</p>
            <p style="margin:0 0 8px 0;font-size:13px;color:#475569;"><strong>Login Email:</strong> ${rec.email}</p>
            <p style="margin:0;font-size:15px;color:#0f172a;"><strong>Temporary Password:</strong> <code style="background:#fef3c7;padding:3px 8px;border-radius:6px;color:#b45309;font-weight:700;">${tempPassword}</code></p>
          </div>
          <p style="font-size:13px;color:#64748b;">Please sign in and update your password inside the Profile tab for ongoing security.</p>
        `,
        actionButton: { label: 'Open Client Portal', url: `${siteBaseUrl}/client-portal` }
      });

      await sendEmail(
        rec.email,
        `MADECC GROUP Client Portal - Password Reset (${rec.client_code})`,
        `Hello ${rec.full_name},\n\nYour temporary Client Portal password is: ${tempPassword}\nSign in at: ${siteBaseUrl}/client-portal\n`,
        html
      );

      return res.json({
        success: true,
        message: `A temporary password has been dispatched to ${rec.email} via ${SMTP_CANONICAL_USER}.`
      });
    } catch (err: any) {
      console.error('[CLIENT_FORGOT_PWD_ERROR]', err);
      return res.status(500).json({ success: false, message: err.message || 'Password reset failed' });
    } finally {
      if (client) client.release();
    }
  });

  // Client Profile Read
  router.get('/client/profile/:id', async (req, res) => {
    let client;
    try {
      client = await getDbClient();
      const result = await client.query(
        'SELECT id, client_code, full_name, company_name, email, phone, phone_secondary, address, city, country, status, created_at, last_login FROM clients WHERE id = $1',
        [req.params.id]
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Client not found' });
      }
      return res.json({ success: true, client: formatClientRow(result.rows[0]) });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // Client Profile & Password Update
  router.put('/client/profile/:id', async (req, res) => {
    const {
      fullName,
      companyName,
      phone,
      phoneSecondary,
      address,
      city,
      country,
      currentPassword,
      newPassword
    } = req.body;

    let client;
    try {
      client = await getDbClient();
      const existing = await client.query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
      if (existing.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Client account not found' });
      }
      const rec = existing.rows[0];

      let updatedPassword = rec.password_hash;
      if (newPassword && String(newPassword).trim().length > 0) {
        if (String(newPassword).trim().length < 6) {
          return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
        }
        if (rec.password_hash && currentPassword !== rec.password_hash) {
          return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
        }
        updatedPassword = String(newPassword).trim();
      }

      const updateRes = await client.query(
        `UPDATE clients
         SET full_name = COALESCE($1, full_name),
             company_name = COALESCE($2, company_name),
             phone = COALESCE($3, phone),
             phone_secondary = COALESCE($4, phone_secondary),
             address = COALESCE($5, address),
             city = COALESCE($6, city),
             country = COALESCE($7, country),
             password_hash = $8,
             updated_at = now()
         WHERE id = $9
         RETURNING *`,
        [fullName, companyName, phone, phoneSecondary, address, city, country, updatedPassword, req.params.id]
      );

      return res.json({
        success: true,
        message: newPassword ? 'Profile and password updated in Neon PostgreSQL' : 'Client profile saved to Neon PostgreSQL',
        client: formatClientRow(updateRes.rows[0])
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // Client Assigned Projects (Enriched with Live Admin Updates, Milestones & Media Counts)
  router.get('/client/:id/projects', async (req, res) => {
    let client;
    try {
      client = await getDbClient();
      const query = `
        SELECT 
          p.id,
          COALESCE(p.title, 'MADECC Construction Project') as title,
          p.description,
          COALESCE(cat.name, 'Civil Construction') as category,
          p.location,
          p.budget,
          p.status,
          p.image,
          p.video_url,
          TO_CHAR(p.start_date, 'YYYY-MM-DD') as start_date,
          TO_CHAR(p.end_date, 'YYYY-MM-DD') as end_date,
          cp.role as client_role,
          cp.access_level,
          lu.phase as current_phase,
          lu.title as latest_update_title,
          lu.summary as latest_update_summary,
          lu.status_badge as schedule_status,
          lu.schedule_variance,
          lu.delay_explanation,
          lu.supervisor_name,
          lu.supervisor_phone,
          lu.workforce_on_site,
          TO_CHAR(lu.update_date, 'YYYY-MM-DD') as last_update_date,
          COALESCE(
            lu.completion_percentage,
            (SELECT ROUND(AVG(percentage))::int FROM project_progress WHERE project_id = p.id),
            CASE WHEN LOWER(p.status) = 'completed' THEN 100 ELSE 35 END
          ) as completion_percentage,
          (SELECT COUNT(*)::int FROM project_progress WHERE project_id = p.id) as milestones_count,
          (SELECT COUNT(*)::int FROM project_media WHERE project_id = p.id AND is_client_visible = true) as media_count
        FROM client_projects cp
        JOIN projects p ON p.id = cp.project_id
        LEFT JOIN categories cat ON cat.id = p.category_id
        LEFT JOIN LATERAL (
          SELECT * FROM project_updates u
          WHERE u.project_id = p.id AND u.is_client_visible = true
          ORDER BY u.update_date DESC, u.id DESC
          LIMIT 1
        ) lu ON TRUE
        WHERE cp.client_id = $1
        ORDER BY p.id DESC
      `;
      let result = await client.query(query, [req.params.id]);

      if (result.rows.length === 0) {
        const fallback = await client.query(`
          SELECT 
            p.id,
            COALESCE(p.title, 'MADECC Construction Project') as title,
            p.description,
            COALESCE(cat.name, 'Civil Construction') as category,
            p.location,
            p.budget,
            p.status,
            p.image,
            p.video_url,
            TO_CHAR(p.start_date, 'YYYY-MM-DD') as start_date,
            TO_CHAR(p.end_date, 'YYYY-MM-DD') as end_date,
            'PROJECT_SPONSOR' as client_role,
            'FULL' as access_level,
            lu.phase as current_phase,
            lu.title as latest_update_title,
            lu.summary as latest_update_summary,
            lu.status_badge as schedule_status,
            lu.schedule_variance,
            lu.delay_explanation,
            lu.supervisor_name,
            lu.supervisor_phone,
            lu.workforce_on_site,
            TO_CHAR(lu.update_date, 'YYYY-MM-DD') as last_update_date,
            COALESCE(
              lu.completion_percentage,
              (SELECT ROUND(AVG(percentage))::int FROM project_progress WHERE project_id = p.id),
              CASE WHEN LOWER(p.status) = 'completed' THEN 100 ELSE 35 END
            ) as completion_percentage,
            (SELECT COUNT(*)::int FROM project_progress WHERE project_id = p.id) as milestones_count,
            (SELECT COUNT(*)::int FROM project_media WHERE project_id = p.id AND is_client_visible = true) as media_count
          FROM projects p
          LEFT JOIN categories cat ON cat.id = p.category_id
          LEFT JOIN LATERAL (
            SELECT * FROM project_updates u
            WHERE u.project_id = p.id AND u.is_client_visible = true
            ORDER BY u.update_date DESC, u.id DESC
            LIMIT 1
          ) lu ON TRUE
          ORDER BY p.id ASC
          LIMIT 2
        `);
        result = fallback;
      }

      return res.json({ success: true, projects: result.rows });
    } catch (err: any) {
      console.error('[CLIENT_PROJECTS_ERROR]', err);
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // Client Project Live Updates (Published & Visible Only)
  router.get('/client/projects/:projectId/updates', async (req, res) => {
    let client;
    try {
      client = await getDbClient();
      const result = await client.query(
        `SELECT 
           id, project_id, phase, title, summary, completion_percentage, status_badge,
           schedule_variance, delay_explanation, supervisor_name, supervisor_phone,
           workforce_on_site, weather, attachment_url, attachment_type,
           is_client_visible, published_by,
           TO_CHAR(update_date, 'YYYY-MM-DD') as update_date,
           created_at
         FROM project_updates
         WHERE project_id = $1 AND is_client_visible = true
         ORDER BY update_date DESC, id DESC`,
        [req.params.projectId]
      );
      return res.json({ success: true, updates: result.rows });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // Client Project Media (Published only)
  router.get('/client/projects/:projectId/media', async (req, res) => {
    let client;
    try {
      client = await getDbClient();
      const result = await client.query(
        `SELECT id, project_id, phase, media_type, title, description, media_url, thumbnail_url,
                TO_CHAR(upload_date, 'YYYY-MM-DD') as upload_date, is_client_visible, uploaded_by, file_size_mb
         FROM project_media
         WHERE project_id = $1 AND is_client_visible = true
         ORDER BY upload_date DESC, id DESC`,
        [req.params.projectId]
      );
      return res.json({ success: true, media: result.rows });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // Client Invoices
  router.get('/client/:id/invoices', async (req, res) => {
    let client;
    try {
      client = await getDbClient();
      const invQuery = `
        SELECT 
          i.*,
          TO_CHAR(i.issue_date, 'YYYY-MM-DD') as issue_date,
          TO_CHAR(i.due_date, 'YYYY-MM-DD') as due_date,
          COALESCE(p.title, 'Project #' || i.project_id) as project_title
        FROM project_invoices i
        LEFT JOIN projects p ON p.id = i.project_id
        WHERE i.client_id = $1 OR i.client_id IS NULL
        ORDER BY i.id DESC
      `;
      const invoices = await client.query(invQuery, [req.params.id]);

      const invoiceIds = invoices.rows.map(r => r.id);
      const itemsMap: Record<number, any[]> = {};
      if (invoiceIds.length > 0) {
        const items = await client.query(
          'SELECT * FROM project_invoice_items WHERE invoice_id = ANY($1::int[]) ORDER BY item_number ASC',
          [invoiceIds]
        );
        for (const item of items.rows) {
          if (!itemsMap[item.invoice_id]) itemsMap[item.invoice_id] = [];
          itemsMap[item.invoice_id].push(item);
        }
      }

      const formatted = invoices.rows.map(inv => ({
        ...inv,
        items: itemsMap[inv.id] || []
      }));

      return res.json({ success: true, invoices: formatted });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // ==========================================
  // 2. ADMIN ERP: CLIENT MANAGEMENT
  // ==========================================

  router.get('/erp/clients', async (_req, res) => {
    let client;
    try {
      client = await getDbClient();
      const query = `
        SELECT 
          c.*,
          COUNT(DISTINCT cp.project_id) as assigned_projects_count,
          COALESCE(SUM(i.total_amount_xaf), 0) as total_invoiced_xaf,
          COALESCE(SUM(i.paid_amount_xaf), 0) as total_paid_xaf,
          COALESCE(SUM(i.balance_due_xaf), 0) as outstanding_balance_xaf
        FROM clients c
        LEFT JOIN client_projects cp ON cp.client_id = c.id
        LEFT JOIN project_invoices i ON i.client_id = c.id
        GROUP BY c.id
        ORDER BY c.id DESC
      `;
      const result = await client.query(query);
      return res.json({ success: true, clients: result.rows });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.post('/erp/clients', async (req, res) => {
    const {
      fullName, companyName, email, phone, phoneSecondary,
      address, city, notes, defaultPassword, projectId, sendEmailInvite
    } = req.body;
    if (!fullName || !email) {
      return res.status(400).json({ success: false, message: 'Full name and email are required' });
    }

    let client;
    try {
      client = await getDbClient();
      const code = `CLT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;
      const pwd = defaultPassword || 'Client2026@Madecc';

      const result = await client.query(
        `INSERT INTO clients (client_code, full_name, company_name, email, password_hash, phone, phone_secondary, address, city, notes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'ACTIVE')
         RETURNING *`,
        [code, fullName, companyName || '', email.trim(), pwd, phone || '', phoneSecondary || '', address || '', city || 'Yaoundé', notes || '']
      );

      const createdClient = result.rows[0];

      if (projectId) {
        await client.query(
          `INSERT INTO client_projects (client_id, project_id, role, access_level)
           VALUES ($1, $2, 'OWNER', 'FULL')
           ON CONFLICT DO NOTHING`,
          [createdClient.id, Number(projectId)]
        );
      }

      if (sendEmailInvite !== false) {
        try {
          const html = buildBrandedHtmlTemplate({
            title: 'Your MADECC GROUP Client Portal Access Is Ready',
            badge: 'CLIENT PORTAL INVITATION',
            recipientName: createdClient.full_name,
            leadParagraph: 'Your dedicated Client Construction Monitoring Portal has been provisioned. Track real-time engineering updates, site photos/videos, milestones, and invoices securely.',
            sectionsHtml: `
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px;margin:16px 0;">
                <p style="margin:0 0 8px 0;font-size:13px;"><strong>Client Reference Code:</strong> ${createdClient.client_code}</p>
                <p style="margin:0 0 8px 0;font-size:13px;"><strong>Login Email:</strong> ${createdClient.email}</p>
                <p style="margin:0;font-size:14px;"><strong>Temporary Password:</strong> <code style="background:#fef3c7;padding:2px 8px;border-radius:4px;color:#b45309;font-weight:700;">${pwd}</code></p>
              </div>
            `,
            actionButton: { label: 'Sign In to Client Portal', url: `${siteBaseUrl}/client-portal` }
          });
          await sendEmail(
            createdClient.email,
            `Welcome to MADECC GROUP Client Portal (${createdClient.client_code})`,
            `Welcome ${createdClient.full_name},\nLogin: ${createdClient.email}\nPassword: ${pwd}\nPortal: ${siteBaseUrl}/client-portal`,
            html
          );
        } catch (mailErr) {
          console.warn('[CLIENT_INVITE_EMAIL_WARN]', mailErr);
        }
      }

      return res.status(201).json({
        success: true,
        client: createdClient,
        message: 'Client created and portal credentials dispatched via SMTP'
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.put('/erp/clients/:id', async (req, res) => {
    const { fullName, companyName, email, phone, phoneSecondary, address, city, status, notes, passwordHash } = req.body;
    let client;
    try {
      client = await getDbClient();
      const result = await client.query(
        `UPDATE clients 
         SET full_name = COALESCE($1, full_name),
             company_name = COALESCE($2, company_name),
             email = COALESCE($3, email),
             phone = COALESCE($4, phone),
             phone_secondary = COALESCE($5, phone_secondary),
             address = COALESCE($6, address),
             city = COALESCE($7, city),
             status = COALESCE($8, status),
             notes = COALESCE($9, notes),
             password_hash = COALESCE($10, password_hash),
             updated_at = now()
         WHERE id = $11
         RETURNING *`,
        [fullName, companyName, email, phone, phoneSecondary, address, city, status, notes, passwordHash, req.params.id]
      );
      return res.json({ success: true, client: result.rows[0] });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.delete('/erp/clients/:id', async (req, res) => {
    let client;
    try {
      client = await getDbClient();
      await client.query('DELETE FROM clients WHERE id = $1', [req.params.id]);
      return res.json({ success: true, message: 'Client account deleted' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.post('/erp/clients/:id/send-credentials', async (req, res) => {
    let client;
    try {
      client = await getDbClient();
      const result = await client.query('SELECT * FROM clients WHERE id = $1', [req.params.id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ success: false, message: 'Client not found' });
      }
      const c = result.rows[0];
      const pwd = c.password_hash || 'Client2026@Madecc';

      const html = buildBrandedHtmlTemplate({
        title: 'Client Portal Login Credentials',
        badge: 'ACCOUNT ACCESS CREDENTIALS',
        recipientName: c.full_name,
        leadParagraph: 'Here are your active login credentials for the MADECC GROUP Construction Monitoring Client Portal.',
        sectionsHtml: `
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px;margin:16px 0;">
            <p style="margin:0 0 8px 0;font-size:13px;"><strong>Client Code:</strong> ${c.client_code}</p>
            <p style="margin:0 0 8px 0;font-size:13px;"><strong>Email:</strong> ${c.email}</p>
            <p style="margin:0;font-size:14px;"><strong>Password:</strong> <code style="background:#fef3c7;padding:2px 8px;border-radius:4px;color:#b45309;font-weight:700;">${pwd}</code></p>
          </div>
        `,
        actionButton: { label: 'Access Client Portal', url: `${siteBaseUrl}/client-portal` }
      });

      await sendEmail(
        c.email,
        `MADECC GROUP Client Portal Access - ${c.client_code}`,
        `Hello ${c.full_name},\n\nPortal URL: ${siteBaseUrl}/client-portal\nEmail: ${c.email}\nClient Code: ${c.client_code}\nPassword: ${pwd}`,
        html
      );

      return res.json({ success: true, message: `Credentials emailed to ${c.email} from ${SMTP_CANONICAL_USER}` });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.get('/erp/clients/:id/projects', async (req, res) => {
    let client;
    try {
      client = await getDbClient();
      const result = await client.query(
        `SELECT cp.*, p.title, p.location, p.status
         FROM client_projects cp
         JOIN projects p ON p.id = cp.project_id
         WHERE cp.client_id = $1
         ORDER BY p.id DESC`,
        [req.params.id]
      );
      return res.json({ success: true, projects: result.rows });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.post('/erp/clients/:id/assign-project', async (req, res) => {
    const { projectId, role, accessLevel } = req.body;
    let client;
    try {
      client = await getDbClient();
      await client.query(
        `INSERT INTO client_projects (client_id, project_id, role, access_level)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (client_id, project_id) DO UPDATE SET role = EXCLUDED.role, access_level = EXCLUDED.access_level`,
        [req.params.id, projectId, role || 'OWNER', accessLevel || 'FULL']
      );
      return res.json({ success: true, message: 'Project assigned to client successfully' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.delete('/erp/clients/:id/projects/:projectId', async (req, res) => {
    let client;
    try {
      client = await getDbClient();
      await client.query('DELETE FROM client_projects WHERE client_id = $1 AND project_id = $2', [
        req.params.id,
        req.params.projectId
      ]);
      return res.json({ success: true, message: 'Project unassigned from client' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // ==========================================
  // 2B. LIVE PROJECT PROGRESS UPDATES (ADMIN <-> CLIENT SYNC)
  // ==========================================

  router.get('/erp/projects/:id/updates', async (req, res) => {
    let client;
    try {
      client = await getDbClient();
      const result = await client.query(
        `SELECT 
           id, project_id, phase, title, summary, completion_percentage, status_badge,
           schedule_variance, delay_explanation, supervisor_name, supervisor_phone,
           workforce_on_site, weather, attachment_url, attachment_type,
           is_client_visible, published_by,
           TO_CHAR(update_date, 'YYYY-MM-DD') as update_date,
           created_at
         FROM project_updates
         WHERE project_id = $1
         ORDER BY update_date DESC, id DESC`,
        [req.params.id]
      );
      return res.json({ success: true, updates: result.rows });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.post('/erp/projects/:id/updates', async (req, res) => {
    const projectId = Number(req.params.id);
    const {
      phase,
      title,
      summary,
      completionPercentage,
      statusBadge,
      scheduleVariance,
      delayExplanation,
      supervisorName,
      supervisorPhone,
      workforceOnSite,
      weather,
      attachmentUrl,
      attachmentType,
      isClientVisible,
      publishedBy,
      updateDate,
      projectStatus,
      notifyClient
    } = req.body;

    if (!title || !summary) {
      return res.status(400).json({ success: false, message: 'Update title and engineering summary are required' });
    }

    let client;
    try {
      client = await getDbClient();
      const inferredAttachType = attachmentUrl ? inferMediaType(attachmentUrl, attachmentType) : 'PHOTO';

      const result = await client.query(
        `INSERT INTO project_updates (
           project_id, phase, title, summary, completion_percentage, status_badge,
           schedule_variance, delay_explanation, supervisor_name, supervisor_phone,
           workforce_on_site, weather, attachment_url, attachment_type,
           is_client_visible, published_by, update_date
         ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
         RETURNING *, TO_CHAR(update_date, 'YYYY-MM-DD') as update_date`,
        [
          projectId,
          phase || 'Superstructure & Columns',
          title,
          summary,
          Number(completionPercentage ?? 0),
          statusBadge || 'ON_SCHEDULE',
          scheduleVariance || 'On Schedule per Master GANTT',
          delayExplanation || '',
          supervisorName || 'Ing. Arnaud Fopa (ONIGC Registered)',
          supervisorPhone || '+237 671 06 35 11',
          Number(workforceOnSite ?? 14),
          weather || 'Clear / Dry',
          attachmentUrl || null,
          inferredAttachType,
          isClientVisible !== false,
          publishedBy || 'Adminmadeccgroup',
          updateDate || new Date().toISOString().split('T')[0]
        ]
      );

      // Sync project status if Admin passed an updated contract status
      if (projectStatus) {
        await client.query('UPDATE projects SET status = $1 WHERE id = $2', [projectStatus, projectId]);
      }

      // Optionally notify assigned client(s) via configured SMTP (kreboya603@gmail.com)
      let emailedCount = 0;
      if (notifyClient && isClientVisible !== false) {
        try {
          const projRes = await client.query('SELECT title, location FROM projects WHERE id = $1', [projectId]);
          const projTitle = projRes.rows[0]?.title || `Project #${projectId}`;
          const clientRows = await client.query(
            `SELECT c.email, c.full_name
             FROM client_projects cp
             JOIN clients c ON c.id = cp.client_id
             WHERE cp.project_id = $1 AND c.status = 'ACTIVE'`,
            [projectId]
          );

          for (const c of clientRows.rows) {
            const html = buildBrandedHtmlTemplate({
              title: `Live Site Progress Update: ${projTitle}`,
              badge: `SITE REPORT • ${phase || 'EXECUTION'}`,
              recipientName: c.full_name,
              leadParagraph: `New engineering progress has been published for <strong>${projTitle}</strong>.`,
              sectionsHtml: `
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px;margin:16px 0;">
                  <p style="margin:0 0 8px 0;font-size:15px;font-weight:700;color:#0f172a;">${title}</p>
                  <p style="margin:0 0 12px 0;font-size:13px;color:#334155;line-height:1.6;">${summary}</p>
                  <p style="margin:0 0 6px 0;font-size:12px;color:#475569;"><strong>Overall Completion:</strong> ${Number(completionPercentage ?? 0)}%</p>
                  <p style="margin:0 0 6px 0;font-size:12px;color:#475569;"><strong>Schedule Status:</strong> ${scheduleVariance || statusBadge || 'On Schedule'}</p>
                  ${delayExplanation ? `<p style="margin:0 0 6px 0;font-size:12px;color:#b45309;"><strong>Site Delay Note:</strong> ${delayExplanation}</p>` : ''}
                  <p style="margin:0;font-size:12px;color:#475569;"><strong>Supervising Engineer:</strong> ${supervisorName || 'Ing. Arnaud Fopa'}</p>
                </div>
              `,
              actionButton: { label: 'View Live Site Progress in Client Portal', url: `${siteBaseUrl}/client-portal` }
            });
            await sendEmail(
              c.email,
              `Site Update (${Number(completionPercentage ?? 0)}%): ${title} - ${projTitle}`,
              `${title}\n\n${summary}\nCompletion: ${Number(completionPercentage ?? 0)}%\nView in Client Portal: ${siteBaseUrl}/client-portal`,
              html
            );
            emailedCount++;
          }
        } catch (mailErr) {
          console.warn('[PROGRESS_UPDATE_EMAIL_WARN]', mailErr);
        }
      }

      return res.status(201).json({
        success: true,
        update: result.rows[0],
        emailedCount,
        message: emailedCount > 0
          ? `Site update published and emailed to ${emailedCount} assigned client(s)`
          : 'Live site progress update saved to Neon PostgreSQL'
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.put('/erp/updates/:id', async (req, res) => {
    const {
      phase,
      title,
      summary,
      completionPercentage,
      statusBadge,
      scheduleVariance,
      delayExplanation,
      supervisorName,
      supervisorPhone,
      workforceOnSite,
      weather,
      attachmentUrl,
      attachmentType,
      isClientVisible,
      updateDate
    } = req.body;

    let client;
    try {
      client = await getDbClient();
      const result = await client.query(
        `UPDATE project_updates
         SET phase = COALESCE($1, phase),
             title = COALESCE($2, title),
             summary = COALESCE($3, summary),
             completion_percentage = COALESCE($4, completion_percentage),
             status_badge = COALESCE($5, status_badge),
             schedule_variance = COALESCE($6, schedule_variance),
             delay_explanation = COALESCE($7, delay_explanation),
             supervisor_name = COALESCE($8, supervisor_name),
             supervisor_phone = COALESCE($9, supervisor_phone),
             workforce_on_site = COALESCE($10, workforce_on_site),
             weather = COALESCE($11, weather),
             attachment_url = COALESCE($12, attachment_url),
             attachment_type = COALESCE($13, attachment_type),
             is_client_visible = COALESCE($14, is_client_visible),
             update_date = COALESCE($15, update_date)
         WHERE id = $16
         RETURNING *, TO_CHAR(update_date, 'YYYY-MM-DD') as update_date`,
        [
          phase, title, summary, completionPercentage, statusBadge, scheduleVariance,
          delayExplanation, supervisorName, supervisorPhone, workforceOnSite, weather,
          attachmentUrl, attachmentType, isClientVisible, updateDate, req.params.id
        ]
      );
      return res.json({ success: true, update: result.rows[0] });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.delete('/erp/updates/:id', async (req, res) => {
    let client;
    try {
      client = await getDbClient();
      await client.query('DELETE FROM project_updates WHERE id = $1', [req.params.id]);
      return res.json({ success: true, message: 'Site progress update deleted' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // ==========================================
  // 3. PROJECT MEDIA (PHOTOS & VIDEOS)
  // ==========================================

  router.get('/erp/projects/:id/media', async (req, res) => {
    let client;
    try {
      client = await getDbClient();
      const result = await client.query(
        `SELECT id, project_id, phase, media_type, title, description, media_url, thumbnail_url,
                TO_CHAR(upload_date, 'YYYY-MM-DD') as upload_date, is_client_visible, uploaded_by, file_size_mb
         FROM project_media
         WHERE project_id = $1
         ORDER BY upload_date DESC, id DESC`,
        [req.params.id]
      );
      return res.json({ success: true, media: result.rows });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.post('/erp/projects/:id/media', async (req, res) => {
    const { phase, mediaType, title, description, mediaUrl, isClientVisible, uploadedBy, notifyClient } = req.body;
    if (!title || !mediaUrl) {
      return res.status(400).json({ success: false, message: 'Title and media URL are required' });
    }

    const detectedType = inferMediaType(mediaUrl, mediaType);

    let client;
    try {
      client = await getDbClient();
      const result = await client.query(
        `INSERT INTO project_media (project_id, phase, media_type, title, description, media_url, is_client_visible, uploaded_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *, TO_CHAR(upload_date, 'YYYY-MM-DD') as upload_date`,
        [
          req.params.id,
          phase || 'Superstructure & Columns',
          detectedType,
          title,
          description || '',
          mediaUrl,
          isClientVisible !== false,
          uploadedBy || 'Project Manager'
        ]
      );

      if (notifyClient && isClientVisible !== false) {
        try {
          const clientRows = await client.query(
            `SELECT c.email, c.full_name
             FROM client_projects cp
             JOIN clients c ON c.id = cp.client_id
             WHERE cp.project_id = $1 AND c.status = 'ACTIVE'`,
            [req.params.id]
          );
          for (const c of clientRows.rows) {
            const html = buildBrandedHtmlTemplate({
              title: `New Site ${detectedType === 'VIDEO' ? 'Video' : 'Photo'} Uploaded`,
              badge: phase || 'PROGRESS GALLERY',
              recipientName: c.full_name,
              leadParagraph: `A new ${detectedType.toLowerCase()} titled <strong>${title}</strong> has been published to your Client Portal gallery.`,
              sectionsHtml: `<p style="font-size:13px;color:#334155;">${description || 'Uploaded directly from the construction site by the supervising team.'}</p>`,
              actionButton: { label: 'Open Photos & Videos Gallery', url: `${siteBaseUrl}/client-portal` }
            });
            await sendEmail(c.email, `New Site ${detectedType}: ${title}`, `${title}\n${description || ''}\n${mediaUrl}`, html);
          }
        } catch (mailErr) {
          console.warn('[MEDIA_NOTIFY_WARN]', mailErr);
        }
      }

      return res.status(201).json({ success: true, media: result.rows[0] });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.put('/erp/media/:id', async (req, res) => {
    const { isClientVisible, title, description, phase, mediaType } = req.body;
    let client;
    try {
      client = await getDbClient();
      const result = await client.query(
        `UPDATE project_media 
         SET is_client_visible = COALESCE($1, is_client_visible),
             title = COALESCE($2, title),
             description = COALESCE($3, description),
             phase = COALESCE($4, phase),
             media_type = COALESCE($5, media_type)
         WHERE id = $6
         RETURNING *, TO_CHAR(upload_date, 'YYYY-MM-DD') as upload_date`,
        [isClientVisible, title, description, phase, mediaType, req.params.id]
      );
      return res.json({ success: true, media: result.rows[0] });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.delete('/erp/media/:id', async (req, res) => {
    let client;
    try {
      client = await getDbClient();
      await client.query('DELETE FROM project_media WHERE id = $1', [req.params.id]);
      return res.json({ success: true, message: 'Media record deleted' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // ==========================================
  // 4. PROJECT MILESTONES (CRUD on project_progress.milestone_name)
  // ==========================================

  router.get('/erp/projects/:id/milestones', async (req, res) => {
    let client;
    try {
      client = await getDbClient();
      const result = await client.query(
        `SELECT 
           id,
           project_id,
           milestone_name,
           milestone_name as milestone,
           description,
           percentage,
           status,
           TO_CHAR(date, 'YYYY-MM-DD') as date
         FROM project_progress
         WHERE project_id = $1
         ORDER BY date ASC, id ASC`,
        [req.params.id]
      );
      return res.json({ success: true, milestones: result.rows });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.post('/erp/projects/:id/milestones', async (req, res) => {
    const { milestone, milestoneName, description, percentage, status, date } = req.body;
    const finalName = milestoneName || milestone;
    if (!finalName) {
      return res.status(400).json({ success: false, message: 'Milestone name is required' });
    }

    let client;
    try {
      client = await getDbClient();
      const pct = Number(percentage ?? 0);
      const resolvedStatus = status || (pct >= 100 ? 'Completed' : pct > 0 ? 'In Progress' : 'Pending');
      const result = await client.query(
        `INSERT INTO project_progress (project_id, milestone_name, description, percentage, status, date)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, project_id, milestone_name, milestone_name as milestone, description, percentage, status, TO_CHAR(date, 'YYYY-MM-DD') as date`,
        [req.params.id, finalName, description || '', pct, resolvedStatus, date || new Date().toISOString().split('T')[0]]
      );
      return res.status(201).json({ success: true, milestone: result.rows[0] });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.put('/erp/milestones/:id', async (req, res) => {
    const { milestone, milestoneName, description, percentage, status, date } = req.body;
    const finalName = milestoneName ?? milestone ?? null;
    let client;
    try {
      client = await getDbClient();
      const result = await client.query(
        `UPDATE project_progress 
         SET milestone_name = COALESCE($1, milestone_name),
             description = COALESCE($2, description),
             percentage = COALESCE($3, percentage),
             status = COALESCE($4, status),
             date = COALESCE($5, date)
         WHERE id = $6
         RETURNING id, project_id, milestone_name, milestone_name as milestone, description, percentage, status, TO_CHAR(date, 'YYYY-MM-DD') as date`,
        [finalName, description, percentage, status, date, req.params.id]
      );
      return res.json({ success: true, milestone: result.rows[0] });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.delete('/erp/milestones/:id', async (req, res) => {
    let client;
    try {
      client = await getDbClient();
      await client.query('DELETE FROM project_progress WHERE id = $1', [req.params.id]);
      return res.json({ success: true, message: 'Milestone removed' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // ==========================================
  // 5. INVOICES & PAYMENTS
  // ==========================================

  router.get('/erp/invoices', async (_req, res) => {
    let client;
    try {
      client = await getDbClient();
      const query = `
        SELECT 
          i.*,
          TO_CHAR(i.issue_date, 'YYYY-MM-DD') as issue_date,
          TO_CHAR(i.due_date, 'YYYY-MM-DD') as due_date,
          COALESCE(c.full_name, 'Direct Client') as client_name,
          c.company_name as client_company,
          c.email as client_email,
          c.phone as client_phone,
          COALESCE(p.title, 'Project #' || i.project_id) as project_title
        FROM project_invoices i
        LEFT JOIN clients c ON c.id = i.client_id
        LEFT JOIN projects p ON p.id = i.project_id
        ORDER BY i.id DESC
      `;
      const invoices = await client.query(query);

      const ids = invoices.rows.map(r => r.id);
      const itemsMap: Record<number, any[]> = {};
      if (ids.length > 0) {
        const items = await client.query(
          'SELECT * FROM project_invoice_items WHERE invoice_id = ANY($1::int[]) ORDER BY item_number ASC',
          [ids]
        );
        for (const item of items.rows) {
          if (!itemsMap[item.invoice_id]) itemsMap[item.invoice_id] = [];
          itemsMap[item.invoice_id].push(item);
        }
      }

      const result = invoices.rows.map(inv => ({
        ...inv,
        items: itemsMap[inv.id] || []
      }));

      return res.json({ success: true, invoices: result });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.post('/erp/invoices', async (req, res) => {
    const { projectId, clientId, issueDate, dueDate, items, taxRatePercent, discountXaf, notes, status, notifyClient } = req.body;
    let client;
    try {
      client = await getDbClient();
      await client.query('BEGIN');

      const invoiceNum = `INV-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
      const subtotal = (items || []).reduce((acc: number, item: any) => acc + (Number(item.quantity || 1) * Number(item.unitPriceXaf || 0)), 0);
      const taxRate = taxRatePercent !== undefined ? Number(taxRatePercent) : 19.25;
      const taxAmount = Math.round(subtotal * (taxRate / 100));
      const discount = Number(discountXaf || 0);
      const totalAmount = subtotal + taxAmount - discount;
      const balanceDue = totalAmount;

      const invRes = await client.query(
        `INSERT INTO project_invoices (invoice_number, project_id, client_id, issue_date, due_date, subtotal_xaf, tax_rate_percent, tax_amount_xaf, discount_xaf, total_amount_xaf, paid_amount_xaf, balance_due_xaf, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 0, $11, $12, $13)
         RETURNING *, TO_CHAR(issue_date, 'YYYY-MM-DD') as issue_date, TO_CHAR(due_date, 'YYYY-MM-DD') as due_date`,
        [
          invoiceNum,
          projectId || 1,
          clientId || null,
          issueDate || new Date().toISOString().split('T')[0],
          dueDate || new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
          subtotal,
          taxRate,
          taxAmount,
          discount,
          totalAmount,
          balanceDue,
          status || 'ISSUED',
          notes || ''
        ]
      );

      const invoiceId = invRes.rows[0].id;
      const insertedItems: any[] = [];

      if (items && Array.isArray(items)) {
        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          const lineTotal = Number(item.quantity || 1) * Number(item.unitPriceXaf || 0);
          const itemRes = await client.query(
            `INSERT INTO project_invoice_items (invoice_id, item_number, description, category, unit, quantity, unit_price_xaf, total_price_xaf)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
             RETURNING *`,
            [
              invoiceId,
              i + 1,
              item.description || 'Works Execution',
              item.category || 'MATERIALS',
              item.unit || 'LS',
              item.quantity || 1,
              item.unitPriceXaf || 0,
              lineTotal
            ]
          );
          insertedItems.push(itemRes.rows[0]);
        }
      }

      await client.query('COMMIT');

      if (notifyClient !== false && clientId) {
        try {
          const cRes = await client.query('SELECT full_name, email FROM clients WHERE id = $1', [clientId]);
          if (cRes.rows.length > 0 && cRes.rows[0].email) {
            const rec = cRes.rows[0];
            const html = buildBrandedHtmlTemplate({
              title: `Official Project Invoice Issued: ${invoiceNum}`,
              badge: 'BILLING & ACCOUNTS RECEIVABLE',
              recipientName: rec.full_name,
              leadParagraph: `Invoice <strong>${invoiceNum}</strong> has been issued to your MADECC GROUP Client Portal.`,
              sectionsHtml: `
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:18px;margin:16px 0;">
                  <p style="margin:0 0 6px 0;font-size:13px;"><strong>Invoice Number:</strong> ${invoiceNum}</p>
                  <p style="margin:0 0 6px 0;font-size:13px;"><strong>Subtotal (HT):</strong> ${subtotal.toLocaleString()} XAF</p>
                  <p style="margin:0 0 6px 0;font-size:13px;"><strong>TVA (${taxRate}%):</strong> ${taxAmount.toLocaleString()} XAF</p>
                  <p style="margin:0 0 6px 0;font-size:15px;color:#b45309;"><strong>Total Due (TTC):</strong> ${totalAmount.toLocaleString()} XAF</p>
                  <p style="margin:0;font-size:12px;color:#64748b;"><strong>Due Date:</strong> ${dueDate || '14 Days'}</p>
                </div>
              `,
              actionButton: { label: 'View & Pay Invoice in Client Portal', url: `${siteBaseUrl}/client-portal` }
            });
            await sendEmail(
              rec.email,
              `MADECC GROUP Invoice ${invoiceNum} (${totalAmount.toLocaleString()} XAF)`,
              `Invoice ${invoiceNum} issued for ${totalAmount.toLocaleString()} XAF. View at ${siteBaseUrl}/client-portal`,
              html
            );
          }
        } catch (mailErr) {
          console.warn('[INVOICE_EMAIL_WARN]', mailErr);
        }
      }

      return res.status(201).json({ success: true, invoice: { ...invRes.rows[0], items: insertedItems } });
    } catch (err: any) {
      if (client) await client.query('ROLLBACK');
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.delete('/erp/invoices/:id', async (req, res) => {
    let client;
    try {
      client = await getDbClient();
      await client.query('DELETE FROM project_invoices WHERE id = $1', [req.params.id]);
      return res.json({ success: true, message: 'Invoice deleted' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.post('/erp/invoices/:id/record-payment', async (req, res) => {
    const { amountXaf, paymentMethod, paymentReference, notes } = req.body;
    let client;
    try {
      client = await getDbClient();
      await client.query('BEGIN');

      const invCheck = await client.query('SELECT * FROM project_invoices WHERE id = $1', [req.params.id]);
      if (invCheck.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ success: false, message: 'Invoice not found' });
      }

      const inv = invCheck.rows[0];
      const paidAmt = Number(amountXaf || 0);
      const newPaid = Number(inv.paid_amount_xaf) + paidAmt;
      const newBalance = Math.max(0, Number(inv.total_amount_xaf) - newPaid);
      const newStatus = newBalance <= 0 ? 'PAID' : 'PARTIALLY_PAID';

      const updateRes = await client.query(
        `UPDATE project_invoices 
         SET paid_amount_xaf = $1,
             balance_due_xaf = $2,
             status = $3,
             payment_method = COALESCE($4, payment_method),
             payment_reference = COALESCE($5, payment_reference),
             notes = CASE WHEN $6 != '' THEN COALESCE(notes, '') || E'\n' || $6 ELSE notes END,
             updated_at = now()
         WHERE id = $7
         RETURNING *, TO_CHAR(issue_date, 'YYYY-MM-DD') as issue_date, TO_CHAR(due_date, 'YYYY-MM-DD') as due_date`,
        [newPaid, newBalance, newStatus, paymentMethod || 'MTN_MOMO', paymentReference || '', notes || '', req.params.id]
      );

      await client.query('COMMIT');

      const updatedInv = updateRes.rows[0];

      // Notify Admin (kreboya603@gmail.com) and Client via SMTP
      try {
        let clientEmail = '';
        let clientName = 'Client';
        if (updatedInv.client_id) {
          const cRes = await client.query('SELECT full_name, email FROM clients WHERE id = $1', [updatedInv.client_id]);
          if (cRes.rows[0]) {
            clientEmail = cRes.rows[0].email;
            clientName = cRes.rows[0].full_name;
          }
        }

        const adminHtml = buildBrandedHtmlTemplate({
          title: `Payment Recorded on Invoice ${updatedInv.invoice_number}`,
          badge: 'FINANCE & RECONCILIATION',
          leadParagraph: `A payment of <strong>${paidAmt.toLocaleString()} XAF</strong> via <strong>${paymentMethod || 'MTN_MOMO'}</strong> has been logged for invoice ${updatedInv.invoice_number}.`,
          sectionsHtml: `
            <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;">
              <p style="margin:0 0 6px 0;font-size:13px;"><strong>Client:</strong> ${clientName} (${clientEmail || 'N/A'})</p>
              <p style="margin:0 0 6px 0;font-size:13px;"><strong>Reference:</strong> ${paymentReference || 'N/A'}</p>
              <p style="margin:0 0 6px 0;font-size:13px;"><strong>Status:</strong> ${updatedInv.status}</p>
              <p style="margin:0;font-size:13px;"><strong>Remaining Balance:</strong> ${Number(updatedInv.balance_due_xaf).toLocaleString()} XAF</p>
            </div>
          `
        });

        await sendNotificationEmail(
          `Payment Logged: ${updatedInv.invoice_number} (${paidAmt.toLocaleString()} XAF)`,
          `Invoice ${updatedInv.invoice_number} payment of ${paidAmt} XAF logged. Ref: ${paymentReference}`,
          adminHtml
        );

        if (clientEmail) {
          await sendEmail(
            clientEmail,
            `Payment Receipt Confirmation - ${updatedInv.invoice_number}`,
            `Dear ${clientName},\nWe have received payment notification of ${paidAmt.toLocaleString()} XAF (Ref: ${paymentReference}) on invoice ${updatedInv.invoice_number}.\nRemaining balance: ${Number(updatedInv.balance_due_xaf).toLocaleString()} XAF.`,
            adminHtml
          );
        }
      } catch (mailErr) {
        console.warn('[PAYMENT_EMAIL_WARN]', mailErr);
      }

      return res.json({ success: true, invoice: updatedInv, message: 'Payment recorded & receipt dispatched via SMTP' });
    } catch (err: any) {
      if (client) await client.query('ROLLBACK');
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // ==========================================
  // 5B. REAL SMTP SHARING ENDPOINT (kreboya603@gmail.com)
  // ==========================================

  router.post('/erp/share-email', async (req, res) => {
    const { recipientEmail, subject, title, summary, detailsHtml, actionLabel, actionUrl, senderName } = req.body;
    if (!recipientEmail || !String(recipientEmail).includes('@')) {
      return res.status(400).json({ success: false, message: 'Valid recipient email address is required' });
    }

    try {
      const html = buildBrandedHtmlTemplate({
        title: title || subject || 'MADECC GROUP Construction Report',
        badge: 'SHARED CONSTRUCTION INTELLIGENCE',
        leadParagraph: summary || `Shared by ${senderName || 'MADECC GROUP Portal'}.`,
        sectionsHtml: detailsHtml || '',
        actionButton: actionUrl ? { label: actionLabel || 'Open Portal', url: actionUrl } : undefined
      });

      await sendEmail(
        String(recipientEmail).trim(),
        subject || title || 'MADECC GROUP Shared Document',
        `${title || ''}\n\n${summary || ''}\n${actionUrl || siteBaseUrl}`,
        html
      );

      return res.json({
        success: true,
        message: `Email dispatched via ${SMTP_CANONICAL_USER} to ${recipientEmail}`
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message || 'SMTP dispatch failed' });
    }
  });

  // ==========================================
  // 6. MATERIALS & INVENTORY MOVEMENTS
  // ==========================================

  router.get('/erp/inventory/movements', async (_req, res) => {
    let client;
    try {
      client = await getDbClient();
      const result = await client.query(
        `SELECT m.*, TO_CHAR(m.movement_date, 'YYYY-MM-DD') as movement_date, COALESCE(p.title, 'General Site') as project_title 
         FROM inventory_movements m 
         LEFT JOIN projects p ON p.id = m.project_id 
         ORDER BY m.movement_date DESC, m.id DESC LIMIT 100`
      );
      return res.json({ success: true, movements: result.rows });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.post('/erp/inventory/movements', async (req, res) => {
    const { inventoryItemId, movementType, quantity, unit, unitCostXaf, projectId, receiverName, notes } = req.body;
    let client;
    try {
      client = await getDbClient();
      await client.query('BEGIN');

      const qty = Number(quantity || 0);
      const cost = Number(unitCostXaf || 0);
      const totalCost = qty * cost;

      const movRes = await client.query(
        `INSERT INTO inventory_movements (inventory_item_id, movement_type, quantity, unit, unit_cost_xaf, total_cost_xaf, project_id, receiver_name, notes)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *, TO_CHAR(movement_date, 'YYYY-MM-DD') as movement_date`,
        [inventoryItemId || null, movementType, qty, unit || 'units', cost, totalCost, projectId || null, receiverName || '', notes || '']
      );

      if (inventoryItemId) {
        if (movementType === 'RECEIPT_STOCK_IN' || movementType === 'PURCHASE_RECEIPT' || movementType === 'RETURN_FROM_PROJECT' || movementType === 'SITE_RETURN') {
          await client.query('UPDATE inventory_items SET quantity_in_stock = (COALESCE(CAST(quantity_in_stock AS NUMERIC), 0) + $1)::text WHERE id = $2', [qty, inventoryItemId]);
        } else if (movementType === 'DISPATCH_TO_PROJECT' || movementType === 'WRITE_OFF') {
          await client.query('UPDATE inventory_items SET quantity_in_stock = GREATEST(0, (COALESCE(CAST(quantity_in_stock AS NUMERIC), 0) - $1))::text WHERE id = $2', [qty, inventoryItemId]);
        }
      }

      await client.query('COMMIT');
      return res.status(201).json({ success: true, movement: movRes.rows[0] });
    } catch (err: any) {
      if (client) await client.query('ROLLBACK');
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // ==========================================
  // 7. EQUIPMENT & MAINTENANCE
  // ==========================================

  router.get('/erp/equipment', async (_req, res) => {
    let client;
    try {
      client = await getDbClient();
      const query = `
        SELECT 
          e.*,
          COALESCE(p.title, 'Yaoundé Central Yard') as assigned_project_title,
          COUNT(m.id) as maintenance_records_count,
          COALESCE(SUM(m.cost_xaf), 0) as total_maintenance_cost_xaf
        FROM equipment e
        LEFT JOIN projects p ON p.id = e.assigned_project_id
        LEFT JOIN equipment_maintenance m ON m.equipment_id = e.id
        GROUP BY e.id, p.title
        ORDER BY e.id ASC
      `;
      const result = await client.query(query);
      return res.json({ success: true, equipment: result.rows });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.post('/erp/equipment', async (req, res) => {
    const { name, category, brandModel, status, condition, assignedProjectId, assignedOperator, hourlyRateXaf, location } = req.body;
    let client;
    try {
      client = await getDbClient();
      const tag = `EQP-${(category || 'GEN').slice(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
      const result = await client.query(
        `INSERT INTO equipment (asset_tag, name, category, brand_model, status, condition, assigned_project_id, assigned_operator, hourly_rate_xaf, location)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [
          tag,
          name,
          category || 'Light Machinery',
          brandModel || '',
          status || 'AVAILABLE',
          condition || 'EXCELLENT',
          assignedProjectId || null,
          assignedOperator || '',
          hourlyRateXaf || 0,
          location || 'Yaoundé Central Yard'
        ]
      );
      return res.status(201).json({ success: true, equipment: result.rows[0] });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.put('/erp/equipment/:id', async (req, res) => {
    const { status, condition, assignedProjectId, assignedOperator, location, notes } = req.body;
    let client;
    try {
      client = await getDbClient();
      const result = await client.query(
        `UPDATE equipment 
         SET status = COALESCE($1, status),
             condition = COALESCE($2, condition),
             assigned_project_id = $3,
             assigned_operator = COALESCE($4, assigned_operator),
             location = COALESCE($5, location),
             notes = COALESCE($6, notes)
         WHERE id = $7
         RETURNING *`,
        [status, condition, assignedProjectId !== undefined ? assignedProjectId : null, assignedOperator, location, notes, req.params.id]
      );
      return res.json({ success: true, equipment: result.rows[0] });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.delete('/erp/equipment/:id', async (req, res) => {
    let client;
    try {
      client = await getDbClient();
      await client.query('DELETE FROM equipment WHERE id = $1', [req.params.id]);
      return res.json({ success: true, message: 'Equipment removed' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.post('/erp/equipment/:id/maintenance', async (req, res) => {
    const { maintenanceType, description, partsReplaced, technicianName, costXaf } = req.body;
    let client;
    try {
      client = await getDbClient();
      const result = await client.query(
        `INSERT INTO equipment_maintenance (equipment_id, maintenance_type, description, parts_replaced, technician_name, cost_xaf)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [req.params.id, maintenanceType || 'PREVENTATIVE', description, partsReplaced || '', technicianName || 'Mechanical Workshop', costXaf || 0]
      );

      await client.query('UPDATE equipment SET last_maintenance_date = CURRENT_DATE WHERE id = $1', [req.params.id]);
      return res.status(201).json({ success: true, maintenance: result.rows[0] });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // ==========================================
  // 8. SUBCONTRACTORS
  // ==========================================

  router.get('/erp/subcontractors', async (_req, res) => {
    let client;
    try {
      client = await getDbClient();
      const result = await client.query('SELECT * FROM subcontractors ORDER BY rating DESC, id ASC');
      return res.json({ success: true, subcontractors: result.rows });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.post('/erp/subcontractors', async (req, res) => {
    const { companyName, contactPerson, phone, email, specialization, rccmNumber, niuTaxNumber, rating, address } = req.body;
    let client;
    try {
      client = await getDbClient();
      const result = await client.query(
        `INSERT INTO subcontractors (company_name, contact_person, phone, email, specialization, rccm_number, niu_tax_number, rating, address)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          companyName,
          contactPerson,
          phone,
          email || '',
          specialization || 'General Works',
          rccmNumber || '',
          niuTaxNumber || '',
          rating || 5.0,
          address || 'Yaoundé'
        ]
      );
      return res.status(201).json({ success: true, subcontractor: result.rows[0] });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.put('/erp/subcontractors/:id', async (req, res) => {
    const { status, rating, totalContractValueXaf } = req.body;
    let client;
    try {
      client = await getDbClient();
      const result = await client.query(
        `UPDATE subcontractors
         SET status = COALESCE($1, status),
             rating = COALESCE($2, rating),
             total_contract_value_xaf = COALESCE($3, total_contract_value_xaf)
         WHERE id = $4
         RETURNING *`,
        [status, rating, totalContractValueXaf, req.params.id]
      );
      return res.json({ success: true, subcontractor: result.rows[0] });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.delete('/erp/subcontractors/:id', async (req, res) => {
    let client;
    try {
      client = await getDbClient();
      await client.query('DELETE FROM subcontractors WHERE id = $1', [req.params.id]);
      return res.json({ success: true, message: 'Subcontractor deleted' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // ==========================================
  // 9. WORKFORCE & ATTENDANCE
  // ==========================================

  router.get('/erp/workers', async (_req, res) => {
    let client;
    try {
      client = await getDbClient();
      const query = `
        SELECT 
          w.*,
          COALESCE(p.title, 'Not Assigned') as assigned_project_title
        FROM worker_roster w
        LEFT JOIN projects p ON p.id = w.assigned_project_id
        ORDER BY w.id ASC
      `;
      const result = await client.query(query);
      return res.json({ success: true, workers: result.rows });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.post('/erp/workers', async (req, res) => {
    const { fullName, nationalId, phone, tradeCategory, skillLevel, dailyRateXaf, assignedProjectId, emergencyContact } = req.body;
    let client;
    try {
      client = await getDbClient();
      const code = `WRK-${Math.floor(100 + Math.random() * 900)}`;
      const result = await client.query(
        `INSERT INTO worker_roster (worker_code, full_name, national_id, phone, trade_category, skill_level, daily_rate_xaf, assigned_project_id, emergency_contact)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING *`,
        [
          code,
          fullName,
          nationalId || '',
          phone || '',
          tradeCategory || 'Mason / Bricklayer',
          skillLevel || 'SKILLED',
          dailyRateXaf || 7500,
          assignedProjectId || null,
          emergencyContact || ''
        ]
      );
      return res.status(201).json({ success: true, worker: result.rows[0] });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.delete('/erp/workers/:id', async (req, res) => {
    let client;
    try {
      client = await getDbClient();
      await client.query('DELETE FROM worker_roster WHERE id = $1', [req.params.id]);
      return res.json({ success: true, message: 'Worker removed from roster' });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.get('/erp/attendance', async (req, res) => {
    const { date } = req.query;
    let client;
    try {
      client = await getDbClient();
      const targetDate = (date as string) || new Date().toISOString().split('T')[0];
      const query = `
        SELECT 
          a.*,
          TO_CHAR(a.attendance_date, 'YYYY-MM-DD') as attendance_date,
          w.full_name as worker_name,
          w.trade_category,
          w.daily_rate_xaf,
          COALESCE(p.title, 'Site #' || a.project_id) as project_title
        FROM worker_attendance a
        JOIN worker_roster w ON w.id = a.worker_id
        LEFT JOIN projects p ON p.id = a.project_id
        WHERE a.attendance_date = $1
        ORDER BY w.id ASC
      `;
      const result = await client.query(query, [targetDate]);
      return res.json({ success: true, attendance: result.rows });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  router.post('/erp/attendance/batch', async (req, res) => {
    const { records, date, projectId, supervisorSignoff } = req.body;
    if (!records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Invalid records array' });
    }

    let client;
    try {
      client = await getDbClient();
      await client.query('BEGIN');

      const attendanceDate = date || new Date().toISOString().split('T')[0];

      for (const rec of records) {
        const rate = Number(rec.dailyRateXaf || 7500);
        const regularHrs = Number(rec.regularHours || 8.0);
        const otHrs = Number(rec.overtimeHours || 0);
        const hourlyRate = rate / 8.0;
        const dailyCost = Math.round(
          (rec.status === 'PRESENT' ? rate : (rec.status === 'HALF_DAY' ? rate * 0.5 : 0)) +
          (otHrs * hourlyRate * 1.5)
        );

        await client.query(
          `INSERT INTO worker_attendance (worker_id, project_id, attendance_date, status, regular_hours, overtime_hours, daily_cost_xaf, supervisor_signoff, remarks)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
           ON CONFLICT (worker_id, attendance_date) DO UPDATE 
           SET status = EXCLUDED.status,
               regular_hours = EXCLUDED.regular_hours,
               overtime_hours = EXCLUDED.overtime_hours,
               daily_cost_xaf = EXCLUDED.daily_cost_xaf,
               supervisor_signoff = EXCLUDED.supervisor_signoff,
               remarks = EXCLUDED.remarks`,
          [
            rec.workerId,
            projectId || rec.projectId || 1,
            attendanceDate,
            rec.status || 'PRESENT',
            regularHrs,
            otHrs,
            dailyCost,
            supervisorSignoff || 'Site Engineer',
            rec.remarks || ''
          ]
        );
      }

      await client.query('COMMIT');
      return res.json({ success: true, message: `Saved attendance for ${records.length} site crew members` });
    } catch (err: any) {
      if (client) await client.query('ROLLBACK');
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // ==========================================
  // 10. COST ESTIMATOR & BOQ CALCULATOR
  // ==========================================

  router.post('/erp/estimates/calculate', async (req, res) => {
    const { buildingType, totalFloorAreaM2, floorsCount, finishQuality, city } = req.body;

    const area = Number(totalFloorAreaM2 || 250);
    const floors = Number(floorsCount || 1);
    const quality = finishQuality || 'STANDARD';

    let baseRatePerM2 = 185000;
    if (buildingType === 'COMMERCIAL') baseRatePerM2 = 240000;
    if (buildingType === 'INDUSTRIAL') baseRatePerM2 = 195000;
    if (buildingType === 'MULTI_FAMILY') baseRatePerM2 = 220000;

    if (quality === 'MODERN') baseRatePerM2 *= 1.35;
    if (quality === 'LUXURY') baseRatePerM2 *= 1.75;
    if (floors > 2) baseRatePerM2 *= (1 + (floors - 2) * 0.08);

    const subtotal = Math.round(area * baseRatePerM2);

    const trades = [
      { code: '01', name: 'Site Installation & Bulk Earthworks', pct: 0.08, category: 'EARTHWORKS' },
      { code: '02', name: 'Substructure & Reinforced Concrete Footings', pct: 0.18, category: 'STRUCTURE' },
      { code: '03', name: 'Superstructure (Columns, Beams & Slabs)', pct: 0.28, category: 'STRUCTURE' },
      { code: '04', name: 'Masonry & Blockwork (CPA 42.5 & Aggregates)', pct: 0.12, category: 'MASONRY' },
      { code: '05', name: 'Roof Framing & Covering (Aluzinc / Tiles)', pct: 0.10, category: 'ROOFING' },
      { code: '06', name: 'Plumbing & Drainage Installations', pct: 0.07, category: 'MEP' },
      { code: '07', name: 'Electrical Works & High/Low Voltage', pct: 0.06, category: 'MEP' },
      { code: '08', name: 'Finishing Works (Tiling, Plaster, Paint, Joinery)', pct: 0.11, category: 'FINISHES' }
    ];

    const boqItems = trades.map(t => {
      const tradeAmount = Math.round(subtotal * t.pct);
      return {
        tradeCode: t.code,
        tradeName: t.name,
        category: t.category,
        materialsAmountXaf: Math.round(tradeAmount * 0.65),
        labourAmountXaf: Math.round(tradeAmount * 0.25),
        equipmentAmountXaf: Math.round(tradeAmount * 0.10),
        totalAmountXaf: tradeAmount
      };
    });

    const contingency = Math.round(subtotal * 0.05);
    const contractorMargin = Math.round(subtotal * 0.10);
    const preTaxTotal = subtotal + contingency + contractorMargin;
    const tva = Math.round(preTaxTotal * 0.1925);
    const grandTotal = preTaxTotal + tva;

    return res.json({
      success: true,
      parameters: { buildingType, totalFloorAreaM2: area, floorsCount: floors, finishQuality: quality, city: city || 'Yaoundé' },
      summary: {
        baseRatePerM2: Math.round(subtotal / area),
        subtotalXaf: subtotal,
        contingencyXaf: contingency,
        contractorMarginXaf: contractorMargin,
        preTaxTotalXaf: preTaxTotal,
        tvaXaf: tva,
        grandTotalXaf: grandTotal
      },
      boqItems
    });
  });

  // ==========================================
  // 11. REPORTS & OVERVIEW ANALYTICS
  // ==========================================

  router.get('/erp/reports/overview', async (_req, res) => {
    let client;
    try {
      client = await getDbClient();

      const [projectsRes, invoicesRes, equipmentRes, inventoryRes, workersRes, subcontractsRes, updatesRes] = await Promise.all([
        client.query(`
          SELECT 
            COUNT(*) as total_projects,
            COUNT(*) FILTER (WHERE status = 'ongoing' OR status = 'in_progress' OR status = 'in-progress') as active_projects,
            COUNT(*) FILTER (WHERE status = 'completed') as completed_projects,
            COALESCE(SUM(CAST(NULLIF(regexp_replace(budget::text, '[^0-9]', '', 'g'), '') AS NUMERIC)), 0) as total_budget_xaf
          FROM projects
        `),
        client.query(`
          SELECT 
            COALESCE(SUM(total_amount_xaf), 0) as total_invoiced,
            COALESCE(SUM(paid_amount_xaf), 0) as total_collected,
            COALESCE(SUM(balance_due_xaf), 0) as total_receivables,
            COUNT(*) as total_invoices_count,
            COUNT(*) FILTER (WHERE status = 'PAID') as paid_count,
            COUNT(*) FILTER (WHERE status = 'PARTIALLY_PAID' OR status = 'ISSUED') as pending_count
          FROM project_invoices
        `),
        client.query(`
          SELECT 
            COUNT(*) as total_assets,
            COUNT(*) FILTER (WHERE status = 'ASSIGNED') as assigned_assets,
            COUNT(*) FILTER (WHERE status = 'AVAILABLE') as available_assets,
            COUNT(*) FILTER (WHERE status = 'UNDER_MAINTENANCE') as maintenance_assets
          FROM equipment
        `),
        client.query(`
          SELECT 
            COUNT(*) as total_materials,
            COALESCE(COUNT(*) FILTER (WHERE CAST(COALESCE(quantity_in_stock, '0') AS NUMERIC) <= CAST(COALESCE(min_stock, '100') AS NUMERIC)), 0) as low_stock_alerts,
            COALESCE(SUM(CAST(COALESCE(quantity_in_stock, '0') AS NUMERIC) * 5500), 0) as inventory_valuation_xaf
          FROM inventory_items
        `),
        client.query(`
          SELECT 
            COUNT(*) as total_workers,
            COUNT(*) FILTER (WHERE status = 'ACTIVE') as active_workers,
            COALESCE(SUM(daily_rate_xaf), 0) as daily_burn_rate_xaf
          FROM worker_roster
        `),
        client.query(`
          SELECT 
            COUNT(*) as total_subcontractors,
            COALESCE(SUM(total_contract_value_xaf), 0) as total_subcontract_value_xaf
          FROM subcontractors
        `),
        client.query(`
          SELECT COUNT(*) as total_updates,
                 COUNT(*) FILTER (WHERE is_client_visible = true) as client_visible_updates
          FROM project_updates
        `)
      ]);

      return res.json({
        success: true,
        analytics: {
          projects: projectsRes.rows[0],
          invoices: invoicesRes.rows[0],
          equipment: equipmentRes.rows[0],
          inventory: inventoryRes.rows[0],
          workforce: workersRes.rows[0],
          subcontracts: subcontractsRes.rows[0],
          updates: updatesRes.rows[0]
        }
      });
    } catch (err: any) {
      return res.status(500).json({ success: false, message: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.use('/api', router);
  app.use(router);
}
