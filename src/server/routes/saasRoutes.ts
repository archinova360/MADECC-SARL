import express, { Request, Response } from 'express';
import { pool, getOrInitPool } from '../../db/index.ts';
import { ensureSaasTables, DEFAULT_SAAS_PAYMENT_CONFIG } from '../../db/ensureSaasTables.ts';
import { logAudit } from '../../lib/audit.ts';
import {
  sendEmail,
  sendNotificationEmail,
  buildBrandedHtmlTemplate,
  SMTP_CANONICAL_USER
} from '../mailService.ts';

function formatTenantRow(r: any) {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    legalName: r.legal_name,
    logoUrl: r.logo_url,
    faviconUrl: r.favicon_url,
    brandCoverUrl: r.brand_cover_url,
    primaryDomain: r.primary_domain,
    customDomain: r.custom_domain,
    status: r.status,
    publishStatus: r.publish_status || 'PUBLISHED',
    publishedVersion: Number(r.published_version ?? 1),
    publishedAt: r.published_at,
    lastRepublishedAt: r.last_republished_at,
    planCode: r.plan_code,
    currency: r.currency,
    timezone: r.timezone,
    phone: r.phone,
    email: r.email,
    address: r.address,
    country: r.country,
    settings: r.settings || {},
    aiCreditsBalance: Number(r.ai_credits_balance ?? 0),
    storageUsageBytes: Number(r.storage_usage_bytes ?? 0),
    isFlagship: Boolean(r.is_flagship),
    versionsCount: r.versions_count !== undefined ? Number(r.versions_count) : undefined,
    membersCount: r.members_count !== undefined ? Number(r.members_count) : undefined,
    latestSubscriptionStatus: r.latest_subscription_status || null,
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

function formatPlanRow(r: any) {
  return {
    id: r.id,
    code: r.code,
    name: r.name,
    description: r.description,
    monthlyPrice: Number(r.monthly_price ?? 0),
    annualPrice: Number(r.annual_price ?? 0),
    currency: r.currency || 'XAF',
    maxUsers: Number(r.max_users ?? 3),
    maxProjects: Number(r.max_projects ?? 5),
    maxStorageGb: Number(r.max_storage_gb ?? 5),
    aiCreditsMonthly: Number(r.ai_credits_monthly ?? 100),
    features: Array.isArray(r.features) ? r.features : [],
    isPopular: Boolean(r.is_popular),
    status: r.status || 'ACTIVE',
    publishStatus: r.publish_status || 'PUBLISHED',
    version: Number(r.version ?? 1),
    publishedAt: r.published_at,
    displayOrder: Number(r.display_order ?? 1),
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

function formatSubscriptionRow(r: any) {
  return {
    id: r.id,
    tenantId: r.tenant_id,
    tenantName: r.tenant_name || undefined,
    tenantEmail: r.tenant_email || undefined,
    planCode: r.plan_code,
    billingCycle: r.billing_cycle || 'MONTHLY',
    amount: Number(r.amount ?? 0),
    currency: r.currency || 'XAF',
    status: r.status,
    paymentMethod: r.payment_method,
    paymentReference: r.payment_reference,
    senderPhone: r.sender_phone,
    proofUrl: r.proof_url,
    notes: r.notes,
    startDate: r.start_date,
    renewalDate: r.renewal_date,
    confirmedAt: r.confirmed_at,
    confirmedBy: r.confirmed_by,
    thankYouShown: Boolean(r.thank_you_shown),
    createdAt: r.created_at,
    updatedAt: r.updated_at
  };
}

export function setupSaasRoutes(app: express.Express) {
  const siteBaseUrl = process.env.URL || process.env.DEPLOY_PRIME_URL || 'https://madeccgroup.online';

  const getDbClient = async () => {
    const activePool = pool || getOrInitPool();
    if (!activePool) {
      throw new Error('Neon PostgreSQL connection pool is unavailable');
    }
    return await activePool.connect();
  };

  const recordPlatformAudit = async (
    client: any,
    params: {
      tenantId?: number | null;
      userId?: string | null;
      userEmail?: string | null;
      action: string;
      resourceType: string;
      resourceId?: string | null;
      ipAddress?: string | null;
      metadata?: any;
    }
  ) => {
    try {
      await client.query(
        `INSERT INTO platform_audit_logs (tenant_id, user_id, user_email, action, resource_type, resource_id, ip_address, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)`,
        [
          params.tenantId ?? null,
          params.userId ?? 'admin',
          params.userEmail ?? SMTP_CANONICAL_USER,
          params.action,
          params.resourceType,
          params.resourceId ?? null,
          params.ipAddress ?? null,
          JSON.stringify(params.metadata || {})
        ]
      );
      logAudit(
        params.userId ?? 'system',
        params.userEmail ?? SMTP_CANONICAL_USER,
        params.action,
        `${params.resourceType} #${params.resourceId || '-'}: ${params.metadata?.summary || ''}`,
        params.ipAddress ?? null
      ).catch(() => {});
    } catch (err) {
      console.warn('[SAAS_AUDIT_WARN]', err);
    }
  };

  const getPersistedPaymentConfig = async (client: any) => {
    try {
      const res = await client.query(`SELECT value FROM saas_platform_settings WHERE key = 'saas_payment_config' LIMIT 1`);
      if (res.rows[0]?.value) {
        return { ...DEFAULT_SAAS_PAYMENT_CONFIG, ...res.rows[0].value };
      }
    } catch (err) {
      console.warn('[SAAS_PAYMENT_CONFIG_READ_WARN]', err);
    }
    return DEFAULT_SAAS_PAYMENT_CONFIG;
  };

  // Cold-start defense for every /api/saas route
  app.use('/api/saas', async (_req, _res, next) => {
    try {
      await ensureSaasTables();
    } catch (err) {
      console.warn('[SAAS_ENSURE_WARN]', err);
    }
    next();
  });

  // =========================================================================
  // 1. SAAS SUBSCRIPTION PLANS (CREATE, SAVE, PUBLISH, REPUBLISH, UNPUBLISH, DUPLICATE, VERSIONING)
  // =========================================================================
  app.get('/api/saas/plans', async (req: Request, res: Response) => {
    const includeUnpublished = req.query.includeUnpublished === 'true';
    let client;
    try {
      client = await getDbClient();
      const query = includeUnpublished
        ? `SELECT * FROM plans ORDER BY display_order ASC, id ASC`
        : `SELECT * FROM plans WHERE status = 'ACTIVE' AND COALESCE(publish_status, 'PUBLISHED') = 'PUBLISHED' ORDER BY display_order ASC, id ASC`;
      const result = await client.query(query);
      return res.json(result.rows.map(formatPlanRow));
    } catch (err: any) {
      console.error('[GET_SAAS_PLANS_ERROR]', err);
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.post('/api/saas/plans', async (req: Request, res: Response) => {
    const {
      code, name, description, monthlyPrice, annualPrice, currency,
      maxUsers, maxProjects, maxStorageGb, aiCreditsMonthly,
      features, isPopular, status, publishStatus, displayOrder, actorEmail
    } = req.body;

    if (!code || !name) {
      return res.status(400).json({ error: 'Plan code and name are required.' });
    }

    let client;
    try {
      client = await getDbClient();
      const cleanCode = String(code).trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
      const result = await client.query(
        `INSERT INTO plans (code, name, description, monthly_price, annual_price, currency, max_users, max_projects, max_storage_gb, ai_credits_monthly, features, is_popular, status, publish_status, version, published_at, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $13, $14, 1, NOW(), $15)
         RETURNING *`,
        [
          cleanCode,
          name,
          description || '',
          Number(monthlyPrice) || 50000,
          Number(annualPrice) || (Number(monthlyPrice) || 50000) * 10,
          currency || 'XAF',
          maxUsers !== undefined ? Number(maxUsers) : 3,
          maxProjects !== undefined ? Number(maxProjects) : 5,
          maxStorageGb !== undefined ? Number(maxStorageGb) : 5,
          aiCreditsMonthly !== undefined ? Number(aiCreditsMonthly) : 100,
          JSON.stringify(Array.isArray(features) ? features : []),
          Boolean(isPopular),
          status || 'ACTIVE',
          publishStatus || 'PUBLISHED',
          Number(displayOrder) || 10
        ]
      );
      const created = formatPlanRow(result.rows[0]);

      await client.query(
        `INSERT INTO saas_plan_versions (plan_id, plan_code, version_number, changelog, snapshot, created_by)
         VALUES ($1, $2, 1, 'Initial plan version created', $3::jsonb, $4)`,
        [created.id, created.code, JSON.stringify(created), actorEmail || SMTP_CANONICAL_USER]
      );

      await recordPlatformAudit(client, {
        userEmail: actorEmail || SMTP_CANONICAL_USER,
        action: 'SAAS_PLAN_CREATED',
        resourceType: 'SAAS_PLAN',
        resourceId: String(created.id),
        ipAddress: req.ip,
        metadata: { code: created.code, name: created.name, summary: `Created plan ${created.name}` }
      });

      return res.status(201).json(created);
    } catch (err: any) {
      console.error('[CREATE_SAAS_PLAN_ERROR]', err);
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.put('/api/saas/plans/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid plan ID' });

    const {
      name, description, monthlyPrice, annualPrice, currency,
      maxUsers, maxProjects, maxStorageGb, aiCreditsMonthly,
      features, isPopular, status, publishStatus, displayOrder, changelog, actorEmail
    } = req.body;

    let client;
    try {
      client = await getDbClient();
      const existing = await client.query(`SELECT * FROM plans WHERE id = $1`, [id]);
      if (existing.rows.length === 0) return res.status(404).json({ error: 'Plan not found' });

      const nextVersion = Number(existing.rows[0].version || 1) + 1;
      const result = await client.query(
        `UPDATE plans
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             monthly_price = COALESCE($3, monthly_price),
             annual_price = COALESCE($4, annual_price),
             currency = COALESCE($5, currency),
             max_users = COALESCE($6, max_users),
             max_projects = COALESCE($7, max_projects),
             max_storage_gb = COALESCE($8, max_storage_gb),
             ai_credits_monthly = COALESCE($9, ai_credits_monthly),
             features = COALESCE($10::jsonb, features),
             is_popular = COALESCE($11, is_popular),
             status = COALESCE($12, status),
             publish_status = COALESCE($13, publish_status),
             display_order = COALESCE($14, display_order),
             version = $15,
             updated_at = NOW()
         WHERE id = $16
         RETURNING *`,
        [
          name ?? null,
          description ?? null,
          monthlyPrice !== undefined ? Number(monthlyPrice) : null,
          annualPrice !== undefined ? Number(annualPrice) : null,
          currency ?? null,
          maxUsers !== undefined ? Number(maxUsers) : null,
          maxProjects !== undefined ? Number(maxProjects) : null,
          maxStorageGb !== undefined ? Number(maxStorageGb) : null,
          aiCreditsMonthly !== undefined ? Number(aiCreditsMonthly) : null,
          features !== undefined ? JSON.stringify(features) : null,
          isPopular !== undefined ? Boolean(isPopular) : null,
          status ?? null,
          publishStatus ?? null,
          displayOrder !== undefined ? Number(displayOrder) : null,
          nextVersion,
          id
        ]
      );
      const updated = formatPlanRow(result.rows[0]);

      await client.query(
        `INSERT INTO saas_plan_versions (plan_id, plan_code, version_number, changelog, snapshot, created_by)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
        [
          updated.id,
          updated.code,
          nextVersion,
          changelog || `Saved pricing & quota changes (v${nextVersion})`,
          JSON.stringify(updated),
          actorEmail || SMTP_CANONICAL_USER
        ]
      );

      await recordPlatformAudit(client, {
        userEmail: actorEmail || SMTP_CANONICAL_USER,
        action: 'SAAS_PLAN_UPDATED',
        resourceType: 'SAAS_PLAN',
        resourceId: String(id),
        ipAddress: req.ip,
        metadata: { version: nextVersion, monthlyPrice: updated.monthlyPrice, summary: `Updated plan ${updated.name} (v${nextVersion})` }
      });

      return res.json(updated);
    } catch (err: any) {
      console.error('[UPDATE_SAAS_PLAN_ERROR]', err);
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.post('/api/saas/plans/:id/publish', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid plan ID' });
    let client;
    try {
      client = await getDbClient();
      const result = await client.query(
        `UPDATE plans
         SET status = 'ACTIVE', publish_status = 'PUBLISHED', published_at = NOW(), updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Plan not found' });
      const plan = formatPlanRow(result.rows[0]);
      await recordPlatformAudit(client, {
        userEmail: req.body?.actorEmail || SMTP_CANONICAL_USER,
        action: 'SAAS_PLAN_PUBLISHED',
        resourceType: 'SAAS_PLAN',
        resourceId: String(id),
        ipAddress: req.ip,
        metadata: { summary: `Published plan ${plan.name} to client pricing catalog` }
      });
      return res.json({ success: true, plan });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.post('/api/saas/plans/:id/republish', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid plan ID' });
    let client;
    try {
      client = await getDbClient();
      const existing = await client.query(`SELECT * FROM plans WHERE id = $1`, [id]);
      if (existing.rows.length === 0) return res.status(404).json({ error: 'Plan not found' });
      const nextVersion = Number(existing.rows[0].version || 1) + 1;
      const result = await client.query(
        `UPDATE plans
         SET status = 'ACTIVE', publish_status = 'PUBLISHED', version = $1, published_at = NOW(), updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [nextVersion, id]
      );
      const plan = formatPlanRow(result.rows[0]);
      await client.query(
        `INSERT INTO saas_plan_versions (plan_id, plan_code, version_number, changelog, snapshot, created_by)
         VALUES ($1, $2, $3, 'Republished live to SaaS pricing page', $4::jsonb, $5)`,
        [plan.id, plan.code, nextVersion, JSON.stringify(plan), req.body?.actorEmail || SMTP_CANONICAL_USER]
      );
      await recordPlatformAudit(client, {
        userEmail: req.body?.actorEmail || SMTP_CANONICAL_USER,
        action: 'SAAS_PLAN_REPUBLISHED',
        resourceType: 'SAAS_PLAN',
        resourceId: String(id),
        ipAddress: req.ip,
        metadata: { version: nextVersion, summary: `Republished plan ${plan.name} (v${nextVersion})` }
      });
      return res.json({ success: true, plan });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.post('/api/saas/plans/:id/unpublish', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid plan ID' });
    let client;
    try {
      client = await getDbClient();
      const result = await client.query(
        `UPDATE plans
         SET publish_status = 'UNPUBLISHED', updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Plan not found' });
      const plan = formatPlanRow(result.rows[0]);
      await recordPlatformAudit(client, {
        userEmail: req.body?.actorEmail || SMTP_CANONICAL_USER,
        action: 'SAAS_PLAN_UNPUBLISHED',
        resourceType: 'SAAS_PLAN',
        resourceId: String(id),
        ipAddress: req.ip,
        metadata: { summary: `Unpublished plan ${plan.name} from public SaaS storefront` }
      });
      return res.json({ success: true, plan });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.post('/api/saas/plans/:id/duplicate', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid plan ID' });
    let client;
    try {
      client = await getDbClient();
      const src = await client.query(`SELECT * FROM plans WHERE id = $1`, [id]);
      if (src.rows.length === 0) return res.status(404).json({ error: 'Source plan not found' });
      const s = src.rows[0];
      const suffix = Math.floor(100 + Math.random() * 900);
      const newCode = `${s.code}_COPY_${suffix}`;
      const newName = `${s.name} (Copy)`;
      const inserted = await client.query(
        `INSERT INTO plans (code, name, description, monthly_price, annual_price, currency, max_users, max_projects, max_storage_gb, ai_credits_monthly, features, is_popular, status, publish_status, version, display_order)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, false, 'ACTIVE', 'DRAFT', 1, $12)
         RETURNING *`,
        [
          newCode, newName, s.description, s.monthly_price, s.annual_price, s.currency,
          s.max_users, s.max_projects, s.max_storage_gb, s.ai_credits_monthly,
          JSON.stringify(s.features || []), Number(s.display_order || 1) + 1
        ]
      );
      const created = formatPlanRow(inserted.rows[0]);
      await recordPlatformAudit(client, {
        userEmail: req.body?.actorEmail || SMTP_CANONICAL_USER,
        action: 'SAAS_PLAN_DUPLICATED',
        resourceType: 'SAAS_PLAN',
        resourceId: String(created.id),
        ipAddress: req.ip,
        metadata: { sourcePlanId: id, summary: `Duplicated plan ${s.name} -> ${newName}` }
      });
      return res.status(201).json({ success: true, plan: created });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.get('/api/saas/plans/:id/versions', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid plan ID' });
    let client;
    try {
      client = await getDbClient();
      const result = await client.query(
        `SELECT * FROM saas_plan_versions WHERE plan_id = $1 ORDER BY version_number DESC, id DESC`,
        [id]
      );
      return res.json({ success: true, versions: result.rows });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.post('/api/saas/plans/:id/versions/:versionId/restore', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const versionId = parseInt(req.params.versionId, 10);
    if (isNaN(id) || isNaN(versionId)) return res.status(400).json({ error: 'Invalid IDs' });
    let client;
    try {
      client = await getDbClient();
      const verRes = await client.query(`SELECT * FROM saas_plan_versions WHERE id = $1 AND plan_id = $2`, [versionId, id]);
      if (verRes.rows.length === 0) return res.status(404).json({ error: 'Version snapshot not found' });
      const snap = verRes.rows[0].snapshot || {};
      const nextVer = Number(snap.version || verRes.rows[0].version_number || 1) + 1;
      const upd = await client.query(
        `UPDATE plans
         SET name = COALESCE($1, name),
             description = COALESCE($2, description),
             monthly_price = COALESCE($3, monthly_price),
             annual_price = COALESCE($4, annual_price),
             max_users = COALESCE($5, max_users),
             max_projects = COALESCE($6, max_projects),
             max_storage_gb = COALESCE($7, max_storage_gb),
             ai_credits_monthly = COALESCE($8, ai_credits_monthly),
             features = COALESCE($9::jsonb, features),
             version = $10,
             updated_at = NOW()
         WHERE id = $11
         RETURNING *`,
        [
          snap.name, snap.description, snap.monthlyPrice, snap.annualPrice,
          snap.maxUsers, snap.maxProjects, snap.maxStorageGb, snap.aiCreditsMonthly,
          JSON.stringify(snap.features || []), nextVer, id
        ]
      );
      const restored = formatPlanRow(upd.rows[0]);
      await recordPlatformAudit(client, {
        userEmail: req.body?.actorEmail || SMTP_CANONICAL_USER,
        action: 'SAAS_PLAN_VERSION_RESTORED',
        resourceType: 'SAAS_PLAN',
        resourceId: String(id),
        ipAddress: req.ip,
        metadata: { restoredFromVersion: verRes.rows[0].version_number, summary: `Restored ${restored.name} from v${verRes.rows[0].version_number}` }
      });
      return res.json({ success: true, plan: restored });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.delete('/api/saas/plans/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid plan ID' });
    let client;
    try {
      client = await getDbClient();
      const target = await client.query(`SELECT code, name FROM plans WHERE id = $1`, [id]);
      if (target.rows.length === 0) return res.status(404).json({ error: 'Plan not found' });
      if (['STARTER', 'PROFESSIONAL', 'ENTERPRISE'].includes(target.rows[0].code)) {
        return res.status(400).json({ error: 'Core tier plans cannot be deleted — use Unpublish to hide them from storefront.' });
      }
      await client.query(`DELETE FROM saas_plan_versions WHERE plan_id = $1`, [id]);
      await client.query(`DELETE FROM plans WHERE id = $1`, [id]);
      await recordPlatformAudit(client, {
        userEmail: SMTP_CANONICAL_USER,
        action: 'SAAS_PLAN_DELETED',
        resourceType: 'SAAS_PLAN',
        resourceId: String(id),
        ipAddress: req.ip,
        metadata: { summary: `Deleted custom plan ${target.rows[0].name}` }
      });
      return res.json({ success: true });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // =========================================================================
  // 2. TENANTS & WORKSPACES LIFECYCLE
  //    (CREATE, UPLOAD, SAVE, PUBLISH, REPUBLISH, UNPUBLISH, VERSIONING, DUPLICATE, SHARE, EXPORT)
  // =========================================================================
  app.get('/api/saas/tenants', async (req: Request, res: Response) => {
    const publishedOnly = req.query.publishedOnly === 'true';
    let client;
    try {
      client = await getDbClient();
      const whereClause = publishedOnly
        ? `WHERE t.status = 'ACTIVE' AND COALESCE(t.publish_status, 'PUBLISHED') = 'PUBLISHED'`
        : '';
      const result = await client.query(`
        SELECT
          t.*,
          (SELECT COUNT(*)::int FROM saas_workspace_versions v WHERE v.tenant_id = t.id) as versions_count,
          (SELECT COUNT(*)::int FROM tenant_memberships m WHERE m.tenant_id = t.id) as members_count,
          (SELECT s.status FROM subscriptions s WHERE s.tenant_id = t.id ORDER BY s.id DESC LIMIT 1) as latest_subscription_status
        FROM tenants t
        ${whereClause}
        ORDER BY t.is_flagship DESC, t.id ASC
      `);
      return res.json(result.rows.map(formatTenantRow));
    } catch (err: any) {
      console.error('[GET_SAAS_TENANTS_ERROR]', err);
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.get('/api/saas/tenants/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid tenant ID' });
    let client;
    try {
      client = await getDbClient();
      const result = await client.query(
        `SELECT
           t.*,
           (SELECT COUNT(*)::int FROM saas_workspace_versions v WHERE v.tenant_id = t.id) as versions_count,
           (SELECT COUNT(*)::int FROM tenant_memberships m WHERE m.tenant_id = t.id) as members_count
         FROM tenants t WHERE t.id = $1`,
        [id]
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Tenant not found' });
      return res.json(formatTenantRow(result.rows[0]));
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.post('/api/saas/tenants', async (req: Request, res: Response) => {
    const {
      name, slug, legalName, logoUrl, faviconUrl, brandCoverUrl,
      planCode, currency, phone, email, address, country, customDomain,
      status, publishStatus, settings, sendWelcomeEmail, actorEmail
    } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Company/Tenant name is required.' });
    }

    let client;
    try {
      client = await getDbClient();
      let baseSlug = (slug || name)
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '') || `tenant-${Date.now()}`;

      const existingSlug = await client.query(`SELECT id FROM tenants WHERE slug = $1`, [baseSlug]);
      if (existingSlug.rows.length > 0) {
        baseSlug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;
      }

      const resolvedPlan = (planCode || 'PROFESSIONAL').toUpperCase();
      const planCredits = resolvedPlan === 'ENTERPRISE' ? 5000 : resolvedPlan === 'PROFESSIONAL' ? 500 : 100;
      const mergedSettings = {
        primaryColor: '#0f172a',
        secondaryColor: '#f59e0b',
        accentColor: '#3b82f6',
        fontFamily: 'Plus Jakarta Sans',
        tagline: `${name} — Powered by MADECC Construction Cloud`,
        phone: phone || '',
        email: email || '',
        companyAddress: address || '',
        currency: currency || 'XAF',
        ...(settings || {})
      };

      const resolvedStatus = status || 'ACTIVE';
      const resolvedPublishStatus = publishStatus || (resolvedStatus === 'ACTIVE' ? 'PUBLISHED' : 'DRAFT');

      const inserted = await client.query(
        `INSERT INTO tenants (
           name, slug, legal_name, logo_url, favicon_url, brand_cover_url,
           primary_domain, custom_domain, status, publish_status, published_version, published_at,
           plan_code, currency, timezone, phone, email, address, country, settings,
           ai_credits_balance, storage_usage_bytes, is_flagship
         )
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,1,CASE WHEN $10='PUBLISHED' THEN NOW() ELSE NULL END,$11,$12,'Africa/Douala',$13,$14,$15,$16,$17::jsonb,$18,0,false)
         RETURNING *`,
        [
          name.trim(),
          baseSlug,
          legalName || `${name.trim()} SARL`,
          logoUrl || '/logo.png',
          faviconUrl || null,
          brandCoverUrl || null,
          `${baseSlug}.madecccloud.com`,
          customDomain || null,
          resolvedStatus,
          resolvedPublishStatus,
          resolvedPlan,
          currency || 'XAF',
          phone || null,
          email || null,
          address || null,
          country || 'Cameroon',
          JSON.stringify(mergedSettings),
          planCredits
        ]
      );

      const created = formatTenantRow(inserted.rows[0]);

      // Create v1.0 baseline snapshot in saas_workspace_versions
      await client.query(
        `INSERT INTO saas_workspace_versions (tenant_id, version_number, version_label, changelog, snapshot, publish_status, created_by)
         VALUES ($1, 1, 'v1.0', 'Initial workspace creation snapshot', $2::jsonb, $3, $4)`,
        [created.id, JSON.stringify(created), resolvedPublishStatus, actorEmail || email || SMTP_CANONICAL_USER]
      );

      // Register primary subdomain in tenant_domains
      await client.query(
        `INSERT INTO tenant_domains (tenant_id, domain, domain_type, status, ssl_status)
         VALUES ($1, $2, 'SUBDOMAIN', 'ACTIVE', 'PROVISIONED')
         ON CONFLICT (domain) DO NOTHING`,
        [created.id, created.primaryDomain]
      );

      // Provision owner membership record if email supplied
      if (email) {
        await client.query(
          `INSERT INTO tenant_memberships (tenant_id, user_id, email, full_name, role, status, invited_by)
           VALUES ($1, $2, $3, $4, 'OWNER', 'ACTIVE', $5)`,
          [created.id, `owner_${created.id}`, email, created.name, actorEmail || SMTP_CANONICAL_USER]
        );
      }

      await recordPlatformAudit(client, {
        tenantId: created.id,
        userEmail: actorEmail || email || SMTP_CANONICAL_USER,
        action: 'TENANT_CREATED',
        resourceType: 'SAAS_TENANT',
        resourceId: String(created.id),
        ipAddress: req.ip,
        metadata: { slug: created.slug, planCode: created.planCode, summary: `Provisioned workspace ${created.name} (${created.primaryDomain})` }
      });

      // Dispatch real SMTP welcome & admin notice via kreboya603@gmail.com
      if (sendWelcomeEmail !== false) {
        try {
          const portalUrl = `${siteBaseUrl}/?tenant=${encodeURIComponent(created.slug)}`;
          if (email) {
            const clientHtml = buildBrandedHtmlTemplate({
              title: `Workspace Provisioned: ${created.name}`,
              badge: `MADECC CONSTRUCTION CLOUD • ${created.planCode}`,
              recipientName: created.name,
              leadParagraph: `Your dedicated multi-tenant Construction Cloud workspace (${created.primaryDomain}) has been provisioned in Neon PostgreSQL.`,
              sectionsHtml: `
                <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin:14px 0;">
                  <p style="margin:0 0 6px 0;font-size:13px;"><strong>Workspace Slug:</strong> ${created.slug}</p>
                  <p style="margin:0 0 6px 0;font-size:13px;"><strong>Plan Tier:</strong> ${created.planCode} (${created.aiCreditsBalance} AI Credits)</p>
                  <p style="margin:0 0 6px 0;font-size:13px;"><strong>Portal Status:</strong> ${created.status} / ${created.publishStatus}</p>
                  <p style="margin:0;font-size:13px;"><strong>Direct URL:</strong> ${portalUrl}</p>
                </div>
              `,
              actionButton: { label: 'Open Company Workspace', url: portalUrl }
            });
            await sendEmail(email, `MADECC Cloud Workspace Provisioned: ${created.name}`, `Workspace: ${created.primaryDomain}\nPlan: ${created.planCode}\nOpen: ${portalUrl}`, clientHtml);
          }

          await sendNotificationEmail(
            `[MADECC SaaS] New Tenant Created: ${created.name} (${created.planCode})`,
            `New tenant ${created.name} (${created.slug}) created. Plan: ${created.planCode}. Email: ${email || 'N/A'}. Phone: ${phone || 'N/A'}.`,
            buildBrandedHtmlTemplate({
              title: `New SaaS Tenant Provisioned: ${created.name}`,
              badge: 'SAAS SUPER ADMIN ALERT',
              recipientName: 'MADECC Super Admin',
              leadParagraph: `A new construction tenant workspace was registered in the SaaS platform.`,
              sectionsHtml: `<p style="font-size:13px;color:#334155;"><strong>Company:</strong> ${created.name}<br/><strong>Plan:</strong> ${created.planCode}<br/><strong>Status:</strong> ${created.status}<br/><strong>Email:</strong> ${email || 'N/A'}<br/><strong>Phone:</strong> ${phone || 'N/A'}</p>`,
              actionButton: { label: 'Open SaaS Super Admin', url: `${siteBaseUrl}/?tab=super-admin` }
            })
          );
        } catch (mailErr) {
          console.warn('[TENANT_CREATE_SMTP_WARN]', mailErr);
        }
      }

      return res.status(201).json(created);
    } catch (err: any) {
      console.error('[CREATE_SAAS_TENANT_ERROR]', err);
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.put('/api/saas/tenants/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid tenant ID' });

    const {
      name, legalName, logoUrl, faviconUrl, brandCoverUrl, customDomain,
      status, publishStatus, planCode, currency, phone, email, address, country,
      settings, aiCreditsBalance, changelog, createVersionSnapshot, actorEmail
    } = req.body;

    let client;
    try {
      client = await getDbClient();
      const existingRes = await client.query(`SELECT * FROM tenants WHERE id = $1`, [id]);
      if (existingRes.rows.length === 0) return res.status(404).json({ error: 'Tenant not found' });
      const existing = existingRes.rows[0];

      const nextSettings = settings !== undefined
        ? { ...(existing.settings || {}), ...settings }
        : existing.settings;

      const updatedRes = await client.query(
        `UPDATE tenants
         SET name = COALESCE($1, name),
             legal_name = COALESCE($2, legal_name),
             logo_url = COALESCE($3, logo_url),
             favicon_url = COALESCE($4, favicon_url),
             brand_cover_url = COALESCE($5, brand_cover_url),
             custom_domain = COALESCE($6, custom_domain),
             status = COALESCE($7, status),
             publish_status = COALESCE($8, publish_status),
             plan_code = COALESCE($9, plan_code),
             currency = COALESCE($10, currency),
             phone = COALESCE($11, phone),
             email = COALESCE($12, email),
             address = COALESCE($13, address),
             country = COALESCE($14, country),
             settings = $15::jsonb,
             ai_credits_balance = COALESCE($16, ai_credits_balance),
             updated_at = NOW()
         WHERE id = $17
         RETURNING *`,
        [
          name ?? null,
          legalName ?? null,
          logoUrl ?? null,
          faviconUrl ?? null,
          brandCoverUrl ?? null,
          customDomain ?? null,
          status ?? null,
          publishStatus ?? null,
          planCode ?? null,
          currency ?? null,
          phone ?? null,
          email ?? null,
          address ?? null,
          country ?? null,
          JSON.stringify(nextSettings || {}),
          aiCreditsBalance !== undefined ? Number(aiCreditsBalance) : null,
          id
        ]
      );

      const updated = formatTenantRow(updatedRes.rows[0]);

      if (createVersionSnapshot) {
        const verCount = await client.query(
          `SELECT COALESCE(MAX(version_number), 0)::int AS max_ver FROM saas_workspace_versions WHERE tenant_id = $1`,
          [id]
        );
        const nextVerNum = (verCount.rows[0]?.max_ver || 0) + 1;
        await client.query(
          `INSERT INTO saas_workspace_versions (tenant_id, version_number, version_label, changelog, snapshot, publish_status, created_by)
           VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)`,
          [
            id,
            nextVerNum,
            `v${nextVerNum}.0`,
            changelog || 'Saved configuration & white-label branding changes',
            JSON.stringify(updated),
            updated.publishStatus || 'DRAFT',
            actorEmail || SMTP_CANONICAL_USER
          ]
        );
      }

      await recordPlatformAudit(client, {
        tenantId: id,
        userEmail: actorEmail || SMTP_CANONICAL_USER,
        action: 'TENANT_SAVED',
        resourceType: 'SAAS_TENANT',
        resourceId: String(id),
        ipAddress: req.ip,
        metadata: { name: updated.name, summary: changelog || `Saved workspace settings for ${updated.name}` }
      });

      return res.json(updated);
    } catch (err: any) {
      console.error('[UPDATE_SAAS_TENANT_ERROR]', err);
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // Publish Tenant Workspace
  app.post('/api/saas/tenants/:id/publish', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid tenant ID' });
    const { changelog, notifyTenant, actorEmail } = req.body || {};

    let client;
    try {
      client = await getDbClient();
      const upd = await client.query(
        `UPDATE tenants
         SET status = 'ACTIVE',
             publish_status = 'PUBLISHED',
             published_at = COALESCE(published_at, NOW()),
             last_republished_at = NOW(),
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id]
      );
      if (upd.rows.length === 0) return res.status(404).json({ error: 'Tenant not found' });
      const tenant = formatTenantRow(upd.rows[0]);

      await client.query(
        `INSERT INTO saas_workspace_versions (tenant_id, version_number, version_label, changelog, snapshot, publish_status, created_by)
         VALUES ($1, $2, $3, $4, $5::jsonb, 'PUBLISHED', $6)`,
        [
          id,
          tenant.publishedVersion || 1,
          `v${tenant.publishedVersion || 1}.0`,
          changelog || 'Published workspace live to client storefront',
          JSON.stringify(tenant),
          actorEmail || SMTP_CANONICAL_USER
        ]
      );

      await recordPlatformAudit(client, {
        tenantId: id,
        userEmail: actorEmail || SMTP_CANONICAL_USER,
        action: 'TENANT_PUBLISHED',
        resourceType: 'SAAS_TENANT',
        resourceId: String(id),
        ipAddress: req.ip,
        metadata: { summary: `Published ${tenant.name} live (v${tenant.publishedVersion})` }
      });

      if (notifyTenant && tenant.email) {
        try {
          const url = `${siteBaseUrl}/?tenant=${encodeURIComponent(tenant.slug)}`;
          await sendEmail(
            tenant.email,
            `${tenant.name} Portal Published Live on MADECC Cloud`,
            `Your company portal ${tenant.name} is now live at ${url}.`,
            buildBrandedHtmlTemplate({
              title: `${tenant.name} Is Now Published Live`,
              badge: `VERSION v${tenant.publishedVersion}`,
              recipientName: tenant.name,
              leadParagraph: `Your white-labeled construction portal and engineering workspace are live and publicly accessible.`,
              sectionsHtml: `<p style="font-size:13px;color:#334155;">Domain: <strong>${tenant.primaryDomain}</strong><br/>Live Version: <strong>v${tenant.publishedVersion}.0</strong></p>`,
              actionButton: { label: 'Visit Live Portal', url }
            })
          );
        } catch (mailErr) {
          console.warn('[TENANT_PUBLISH_SMTP_WARN]', mailErr);
        }
      }

      return res.json({ success: true, tenant });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // Republish Tenant Workspace (increments published_version & snapshots live release)
  app.post('/api/saas/tenants/:id/republish', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid tenant ID' });
    const { changelog, notifyTenant, actorEmail } = req.body || {};

    let client;
    try {
      client = await getDbClient();
      const cur = await client.query(`SELECT published_version FROM tenants WHERE id = $1`, [id]);
      if (cur.rows.length === 0) return res.status(404).json({ error: 'Tenant not found' });
      const verCount = await client.query(
        `SELECT COALESCE(MAX(version_number), 0)::int AS max_ver FROM saas_workspace_versions WHERE tenant_id = $1`,
        [id]
      );
      const nextVer = Math.max(Number(cur.rows[0].published_version || 1), Number(verCount.rows[0]?.max_ver || 0)) + 1;

      const upd = await client.query(
        `UPDATE tenants
         SET status = 'ACTIVE',
             publish_status = 'PUBLISHED',
             published_version = $1,
             published_at = COALESCE(published_at, NOW()),
             last_republished_at = NOW(),
             updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [nextVer, id]
      );
      const tenant = formatTenantRow(upd.rows[0]);

      await client.query(
        `INSERT INTO saas_workspace_versions (tenant_id, version_number, version_label, changelog, snapshot, publish_status, created_by)
         VALUES ($1, $2, $3, $4, $5::jsonb, 'PUBLISHED', $6)`,
        [
          id,
          nextVer,
          `v${nextVer}.0`,
          changelog || `Republished live production release v${nextVer}.0`,
          JSON.stringify(tenant),
          actorEmail || SMTP_CANONICAL_USER
        ]
      );

      await recordPlatformAudit(client, {
        tenantId: id,
        userEmail: actorEmail || SMTP_CANONICAL_USER,
        action: 'TENANT_REPUBLISHED',
        resourceType: 'SAAS_TENANT',
        resourceId: String(id),
        ipAddress: req.ip,
        metadata: { version: nextVer, summary: `Republished ${tenant.name} to live release v${nextVer}.0` }
      });

      if (notifyTenant && tenant.email) {
        try {
          const url = `${siteBaseUrl}/?tenant=${encodeURIComponent(tenant.slug)}`;
          await sendEmail(
            tenant.email,
            `${tenant.name} Republished (Release v${nextVer}.0)`,
            `Your portal updates have been republished (Release v${nextVer}.0) at ${url}.`,
            buildBrandedHtmlTemplate({
              title: `${tenant.name} Republished Successfully`,
              badge: `RELEASE v${nextVer}.0`,
              recipientName: tenant.name,
              leadParagraph: `Your latest branding, pricing, and portal changes have been republished live.`,
              sectionsHtml: `<p style="font-size:13px;color:#334155;">Release Notes: ${changelog || 'Production sync & white-label update'}</p>`,
              actionButton: { label: 'Open Live Workspace', url }
            })
          );
        } catch (mailErr) {
          console.warn('[TENANT_REPUBLISH_SMTP_WARN]', mailErr);
        }
      }

      return res.json({ success: true, tenant });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // Unpublish Tenant Workspace (takes public storefront offline without deleting tenant data)
  app.post('/api/saas/tenants/:id/unpublish', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid tenant ID' });
    const { actorEmail, reason } = req.body || {};

    let client;
    try {
      client = await getDbClient();
      const upd = await client.query(
        `UPDATE tenants
         SET publish_status = 'UNPUBLISHED',
             updated_at = NOW()
         WHERE id = $1
         RETURNING *`,
        [id]
      );
      if (upd.rows.length === 0) return res.status(404).json({ error: 'Tenant not found' });
      const tenant = formatTenantRow(upd.rows[0]);

      await recordPlatformAudit(client, {
        tenantId: id,
        userEmail: actorEmail || SMTP_CANONICAL_USER,
        action: 'TENANT_UNPUBLISHED',
        resourceType: 'SAAS_TENANT',
        resourceId: String(id),
        ipAddress: req.ip,
        metadata: { reason, summary: `Unpublished ${tenant.name} from public SaaS directory` }
      });

      return res.json({ success: true, tenant });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // Duplicate Tenant Workspace
  app.post('/api/saas/tenants/:id/duplicate', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid tenant ID' });
    const { newName, actorEmail } = req.body || {};

    let client;
    try {
      client = await getDbClient();
      const srcRes = await client.query(`SELECT * FROM tenants WHERE id = $1`, [id]);
      if (srcRes.rows.length === 0) return res.status(404).json({ error: 'Source tenant not found' });
      const src = srcRes.rows[0];

      const suffix = Math.floor(100 + Math.random() * 900);
      const cloneName = newName?.trim() || `${src.name} (Clone #${suffix})`;
      const cloneSlug = `${src.slug}-copy-${suffix}`;
      const cloneDomain = `${cloneSlug}.madecccloud.com`;

      const ins = await client.query(
        `INSERT INTO tenants (
           name, slug, legal_name, logo_url, favicon_url, brand_cover_url,
           primary_domain, custom_domain, status, publish_status, published_version,
           plan_code, currency, timezone, phone, email, address, country, settings,
           ai_credits_balance, storage_usage_bytes, is_flagship
         )
         VALUES ($1,$2,$3,$4,$5,$6,$7,NULL,'ACTIVE','DRAFT',1,$8,$9,$10,$11,$12,$13,$14,$15::jsonb,$16,0,false)
         RETURNING *`,
        [
          cloneName,
          cloneSlug,
          src.legal_name,
          src.logo_url,
          src.favicon_url,
          src.brand_cover_url,
          cloneDomain,
          src.plan_code,
          src.currency,
          src.timezone,
          src.phone,
          src.email,
          src.address,
          src.country,
          JSON.stringify(src.settings || {}),
          src.ai_credits_balance
        ]
      );
      const cloned = formatTenantRow(ins.rows[0]);

      await client.query(
        `INSERT INTO saas_workspace_versions (tenant_id, version_number, version_label, changelog, snapshot, publish_status, created_by)
         VALUES ($1, 1, 'v1.0', $2, $3::jsonb, 'DRAFT', $4)`,
        [cloned.id, `Duplicated from ${src.name} (#${src.id})`, JSON.stringify(cloned), actorEmail || SMTP_CANONICAL_USER]
      );

      await client.query(
        `INSERT INTO tenant_domains (tenant_id, domain, domain_type, status, ssl_status)
         VALUES ($1, $2, 'SUBDOMAIN', 'ACTIVE', 'PROVISIONED')
         ON CONFLICT (domain) DO NOTHING`,
        [cloned.id, cloneDomain]
      );

      await recordPlatformAudit(client, {
        tenantId: cloned.id,
        userEmail: actorEmail || SMTP_CANONICAL_USER,
        action: 'TENANT_DUPLICATED',
        resourceType: 'SAAS_TENANT',
        resourceId: String(cloned.id),
        ipAddress: req.ip,
        metadata: { sourceTenantId: id, summary: `Duplicated ${src.name} -> ${cloned.name}` }
      });

      return res.status(201).json({ success: true, tenant: cloned });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // Versioning History & Manual Snapshot & Rollback/Restore
  app.get('/api/saas/tenants/:id/versions', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid tenant ID' });
    let client;
    try {
      client = await getDbClient();
      const result = await client.query(
        `SELECT id, tenant_id, version_number, version_label, changelog, snapshot, publish_status, created_by, created_at
         FROM saas_workspace_versions
         WHERE tenant_id = $1
         ORDER BY version_number DESC, id DESC`,
        [id]
      );
      return res.json({
        success: true,
        versions: result.rows.map(v => ({
          id: v.id,
          tenantId: v.tenant_id,
          versionNumber: v.version_number,
          versionLabel: v.version_label,
          changelog: v.changelog,
          snapshot: v.snapshot,
          publishStatus: v.publish_status,
          createdBy: v.created_by,
          createdAt: v.created_at
        }))
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.post('/api/saas/tenants/:id/versions', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid tenant ID' });
    const { changelog, versionLabel, actorEmail } = req.body || {};
    let client;
    try {
      client = await getDbClient();
      const cur = await client.query(`SELECT * FROM tenants WHERE id = $1`, [id]);
      if (cur.rows.length === 0) return res.status(404).json({ error: 'Tenant not found' });
      const t = formatTenantRow(cur.rows[0]);

      const verRes = await client.query(
        `SELECT COALESCE(MAX(version_number), 0)::int AS max_ver FROM saas_workspace_versions WHERE tenant_id = $1`,
        [id]
      );
      const nextNum = (verRes.rows[0]?.max_ver || 0) + 1;
      const label = versionLabel || `v${nextNum}.0`;

      const ins = await client.query(
        `INSERT INTO saas_workspace_versions (tenant_id, version_number, version_label, changelog, snapshot, publish_status, created_by)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
         RETURNING *`,
        [id, nextNum, label, changelog || `Saved manual checkpoint ${label}`, JSON.stringify(t), t.publishStatus || 'PUBLISHED', actorEmail || SMTP_CANONICAL_USER]
      );

      await recordPlatformAudit(client, {
        tenantId: id,
        userEmail: actorEmail || SMTP_CANONICAL_USER,
        action: 'TENANT_VERSION_SAVED',
        resourceType: 'SAAS_WORKSPACE_VERSION',
        resourceId: String(ins.rows[0].id),
        ipAddress: req.ip,
        metadata: { versionLabel: label, summary: `Saved workspace snapshot ${label} for ${t.name}` }
      });

      return res.status(201).json({
        success: true,
        version: {
          id: ins.rows[0].id,
          tenantId: ins.rows[0].tenant_id,
          versionNumber: ins.rows[0].version_number,
          versionLabel: ins.rows[0].version_label,
          changelog: ins.rows[0].changelog,
          snapshot: ins.rows[0].snapshot,
          publishStatus: ins.rows[0].publish_status,
          createdBy: ins.rows[0].created_by,
          createdAt: ins.rows[0].created_at
        }
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.post('/api/saas/tenants/:id/versions/:versionId/restore', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const versionId = parseInt(req.params.versionId, 10);
    if (isNaN(id) || isNaN(versionId)) return res.status(400).json({ error: 'Invalid IDs' });
    const { republishImmediately, actorEmail } = req.body || {};

    let client;
    try {
      client = await getDbClient();
      const verRes = await client.query(
        `SELECT * FROM saas_workspace_versions WHERE id = $1 AND tenant_id = $2`,
        [versionId, id]
      );
      if (verRes.rows.length === 0) return res.status(404).json({ error: 'Version snapshot not found' });

      const snap = verRes.rows[0].snapshot || {};
      const maxRes = await client.query(
        `SELECT COALESCE(MAX(version_number), 0)::int AS max_ver FROM saas_workspace_versions WHERE tenant_id = $1`,
        [id]
      );
      const nextPublishedVersion = (maxRes.rows[0]?.max_ver || 1) + 1;

      const upd = await client.query(
        `UPDATE tenants
         SET name = COALESCE($1, name),
             legal_name = COALESCE($2, legal_name),
             logo_url = COALESCE($3, logo_url),
             brand_cover_url = COALESCE($4, brand_cover_url),
             custom_domain = COALESCE($5, custom_domain),
             plan_code = COALESCE($6, plan_code),
             currency = COALESCE($7, currency),
             phone = COALESCE($8, phone),
             email = COALESCE($9, email),
             address = COALESCE($10, address),
             settings = COALESCE($11::jsonb, settings),
             publish_status = CASE WHEN $12 THEN 'PUBLISHED' ELSE publish_status END,
             published_version = CASE WHEN $12 THEN $13 ELSE published_version END,
             last_republished_at = CASE WHEN $12 THEN NOW() ELSE last_republished_at END,
             updated_at = NOW()
         WHERE id = $14
         RETURNING *`,
        [
          snap.name ?? null,
          snap.legalName ?? snap.legal_name ?? null,
          snap.logoUrl ?? snap.logo_url ?? null,
          snap.brandCoverUrl ?? snap.brand_cover_url ?? null,
          snap.customDomain ?? snap.custom_domain ?? null,
          snap.planCode ?? snap.plan_code ?? null,
          snap.currency ?? null,
          snap.phone ?? null,
          snap.email ?? null,
          snap.address ?? null,
          snap.settings ? JSON.stringify(snap.settings) : null,
          Boolean(republishImmediately),
          nextPublishedVersion,
          id
        ]
      );
      const restored = formatTenantRow(upd.rows[0]);

      await client.query(
        `INSERT INTO saas_workspace_versions (tenant_id, version_number, version_label, changelog, snapshot, publish_status, created_by)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)`,
        [
          id,
          nextPublishedVersion,
          `v${nextPublishedVersion}.0`,
          `Restored from ${verRes.rows[0].version_label}${republishImmediately ? ' & republished live' : ''}`,
          JSON.stringify(restored),
          restored.publishStatus || 'PUBLISHED',
          actorEmail || SMTP_CANONICAL_USER
        ]
      );

      await recordPlatformAudit(client, {
        tenantId: id,
        userEmail: actorEmail || SMTP_CANONICAL_USER,
        action: 'TENANT_VERSION_RESTORED',
        resourceType: 'SAAS_TENANT',
        resourceId: String(id),
        ipAddress: req.ip,
        metadata: { fromVersion: verRes.rows[0].version_label, summary: `Restored ${restored.name} from ${verRes.rows[0].version_label}` }
      });

      return res.json({ success: true, tenant: restored });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // Share Tenant Portal / Credentials via SMTP (kreboya603@gmail.com)
  app.post('/api/saas/tenants/:id/share', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid tenant ID' });
    const { recipientEmail, message, actorEmail } = req.body || {};
    if (!recipientEmail || !String(recipientEmail).includes('@')) {
      return res.status(400).json({ error: 'A valid recipient email address is required.' });
    }

    let client;
    try {
      client = await getDbClient();
      const tRes = await client.query(`SELECT * FROM tenants WHERE id = $1`, [id]);
      if (tRes.rows.length === 0) return res.status(404).json({ error: 'Tenant not found' });
      const tenant = formatTenantRow(tRes.rows[0]);
      const portalUrl = `${siteBaseUrl}/?tenant=${encodeURIComponent(tenant.slug)}`;

      const html = buildBrandedHtmlTemplate({
        title: `Company Portal Shared: ${tenant.name}`,
        badge: `MADECC CONSTRUCTION CLOUD • ${tenant.planCode}`,
        recipientName: recipientEmail,
        leadParagraph: `${tenant.name} has shared their Construction Cloud Workspace access details with you via ${SMTP_CANONICAL_USER}.`,
        sectionsHtml: `
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin:14px 0;">
            <p style="margin:0 0 6px 0;font-size:13px;"><strong>Organization:</strong> ${tenant.legalName || tenant.name}</p>
            <p style="margin:0 0 6px 0;font-size:13px;"><strong>Primary Domain:</strong> ${tenant.primaryDomain}</p>
            ${tenant.customDomain ? `<p style="margin:0 0 6px 0;font-size:13px;"><strong>Custom Domain:</strong> ${tenant.customDomain}</p>` : ''}
            <p style="margin:0 0 6px 0;font-size:13px;"><strong>Plan Tier:</strong> ${tenant.planCode} (v${tenant.publishedVersion || 1}.0)</p>
            <p style="margin:0;font-size:13px;"><strong>Portal Link:</strong> <a href="${portalUrl}">${portalUrl}</a></p>
          </div>
          ${message ? `<p style="font-size:13px;color:#334155;"><em>Note:</em> ${message}</p>` : ''}
        `,
        actionButton: { label: 'Launch Tenant Portal', url: portalUrl }
      });

      const mailInfo = await sendEmail(
        recipientEmail.trim(),
        `MADECC Cloud Workspace Shared: ${tenant.name}`,
        `${tenant.name} (${tenant.primaryDomain})\nOpen portal: ${portalUrl}\n${message || ''}`,
        html
      );

      await recordPlatformAudit(client, {
        tenantId: id,
        userEmail: actorEmail || SMTP_CANONICAL_USER,
        action: 'TENANT_PORTAL_SHARED',
        resourceType: 'SAAS_TENANT',
        resourceId: String(id),
        ipAddress: req.ip,
        metadata: { recipientEmail, summary: `Shared ${tenant.name} portal via SMTP to ${recipientEmail}` }
      });

      return res.json({
        success: true,
        shareUrl: portalUrl,
        simulated: Boolean((mailInfo as any)?.simulated),
        message: `Workspace details dispatched to ${recipientEmail} via ${SMTP_CANONICAL_USER}.`
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // Export Complete Tenant Bundle (JSON Download)
  app.get('/api/saas/tenants/:id/export', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid tenant ID' });
    let client;
    try {
      client = await getDbClient();
      const tRes = await client.query(`SELECT * FROM tenants WHERE id = $1`, [id]);
      if (tRes.rows.length === 0) return res.status(404).json({ error: 'Tenant not found' });
      const tenant = formatTenantRow(tRes.rows[0]);

      const [vers, subs, doms, mems, usages] = await Promise.all([
        client.query(`SELECT * FROM saas_workspace_versions WHERE tenant_id = $1 ORDER BY version_number DESC`, [id]),
        client.query(`SELECT * FROM subscriptions WHERE tenant_id = $1 ORDER BY id DESC`, [id]),
        client.query(`SELECT * FROM tenant_domains WHERE tenant_id = $1 ORDER BY id DESC`, [id]),
        client.query(`SELECT * FROM tenant_memberships WHERE tenant_id = $1 ORDER BY id DESC`, [id]),
        client.query(`SELECT * FROM usage_events WHERE tenant_id = $1 ORDER BY id DESC LIMIT 100`, [id])
      ]);

      await recordPlatformAudit(client, {
        tenantId: id,
        userEmail: SMTP_CANONICAL_USER,
        action: 'TENANT_EXPORTED',
        resourceType: 'SAAS_TENANT',
        resourceId: String(id),
        ipAddress: req.ip,
        metadata: { summary: `Exported complete workspace bundle for ${tenant.name}` }
      });

      return res.json({
        exportedAt: new Date().toISOString(),
        platform: 'MADECC Construction Cloud',
        tenant,
        versions: vers.rows,
        subscriptions: subs.rows.map(formatSubscriptionRow),
        domains: doms.rows,
        memberships: mems.rows,
        recentUsageEvents: usages.rows
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // Real Tenant Usage Telemetry (Replaces hardcoded bars in TenantBillingModal)
  app.get('/api/saas/tenants/:id/usage', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid tenant ID' });
    let client;
    try {
      client = await getDbClient();
      const tRes = await client.query(`SELECT * FROM tenants WHERE id = $1`, [id]);
      if (tRes.rows.length === 0) return res.status(404).json({ error: 'Tenant not found' });
      const tenant = formatTenantRow(tRes.rows[0]);

      const planRes = await client.query(`SELECT * FROM plans WHERE UPPER(code) = UPPER($1) LIMIT 1`, [tenant.planCode]);
      const plan = planRes.rows[0] ? formatPlanRow(planRes.rows[0]) : null;

      const [membersRes, projectsRes, usageAgg, recentRes] = await Promise.all([
        client.query(`SELECT COUNT(*)::int AS cnt FROM tenant_memberships WHERE tenant_id = $1 AND status = 'ACTIVE'`, [id]),
        client.query(`SELECT COUNT(*)::int AS cnt FROM projects`),
        client.query(
          `SELECT COALESCE(SUM(quantity), 0)::int AS total_credits_used, COUNT(*)::int AS total_runs
           FROM usage_events WHERE tenant_id = $1`,
          [id]
        ),
        client.query(
          `SELECT * FROM usage_events WHERE tenant_id = $1 ORDER BY created_at DESC LIMIT 20`,
          [id]
        )
      ]);

      const seatsUsed = Math.max(1, Number(membersRes.rows[0]?.cnt || 0));
      const projectsCount = Number(projectsRes.rows[0]?.cnt || 0);
      const storageUsedGb = Number((tenant.storageUsageBytes / (1024 * 1024 * 1024)).toFixed(2));
      const aiCreditsUsed = Number(usageAgg.rows[0]?.total_credits_used || 0);

      return res.json({
        success: true,
        tenantId: id,
        planCode: tenant.planCode,
        seatsUsed,
        maxUsers: plan?.maxUsers ?? 10,
        activeProjects: projectsCount,
        maxProjects: plan?.maxProjects ?? 25,
        storageUsedGb,
        maxStorageGb: plan?.maxStorageGb ?? 25,
        aiCreditsUsed,
        aiCreditsBalance: tenant.aiCreditsBalance,
        aiCreditsMonthly: plan?.aiCreditsMonthly ?? 500,
        totalRuns: Number(usageAgg.rows[0]?.total_runs || 0),
        recentEvents: recentRes.rows
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.delete('/api/saas/tenants/:id', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid tenant ID' });
    let client;
    try {
      client = await getDbClient();
      const cur = await client.query(`SELECT name, is_flagship FROM tenants WHERE id = $1`, [id]);
      if (cur.rows.length === 0) return res.status(404).json({ error: 'Tenant not found' });
      if (cur.rows[0].is_flagship) {
        return res.status(400).json({ error: 'Flagship tenant #001 cannot be deleted.' });
      }
      await client.query(`DELETE FROM saas_workspace_versions WHERE tenant_id = $1`, [id]);
      await client.query(`DELETE FROM tenant_domains WHERE tenant_id = $1`, [id]);
      await client.query(`DELETE FROM tenant_memberships WHERE tenant_id = $1`, [id]);
      await client.query(`DELETE FROM tenants WHERE id = $1`, [id]);
      await recordPlatformAudit(client, {
        tenantId: id,
        userEmail: SMTP_CANONICAL_USER,
        action: 'TENANT_DELETED',
        resourceType: 'SAAS_TENANT',
        resourceId: String(id),
        ipAddress: req.ip,
        metadata: { summary: `Deleted tenant workspace ${cur.rows[0].name} (#${id})` }
      });
      return res.json({ success: true, message: `Tenant #${id} deleted cleanly.` });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // =========================================================================
  // 3. SUBSCRIPTION PAYMENTS & REAL DIRECT CONFIRMATION FLOW + SMTP
  // =========================================================================
  app.get('/api/saas/subscriptions', async (req: Request, res: Response) => {
    const tenantId = req.query.tenantId ? Number(req.query.tenantId) : null;
    let client;
    try {
      client = await getDbClient();
      const query = tenantId
        ? `SELECT s.*, t.name AS tenant_name, t.email AS tenant_email
           FROM subscriptions s
           LEFT JOIN tenants t ON t.id = s.tenant_id
           WHERE s.tenant_id = $1
           ORDER BY s.id DESC`
        : `SELECT s.*, t.name AS tenant_name, t.email AS tenant_email
           FROM subscriptions s
           LEFT JOIN tenants t ON t.id = s.tenant_id
           ORDER BY s.id DESC`;
      const result = tenantId ? await client.query(query, [tenantId]) : await client.query(query);
      return res.json(result.rows.map(formatSubscriptionRow));
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.post('/api/saas/subscriptions', async (req: Request, res: Response) => {
    const {
      tenantId, planCode, billingCycle, amount, currency,
      paymentMethod, paymentReference, senderPhone, proofUrl, notes
    } = req.body;

    if (!tenantId || !planCode || !amount) {
      return res.status(400).json({ error: 'tenantId, planCode, and amount are required.' });
    }

    let client;
    try {
      client = await getDbClient();
      const numTenantId = Number(tenantId);
      const numAmount = parseInt(String(amount), 10) || 50000;
      const cycle = (billingCycle || 'MONTHLY').toUpperCase();
      const renewalDays = cycle === 'ANNUAL' ? 365 : 30;
      const renewalDate = new Date(Date.now() + renewalDays * 86400000);
      const txRef = paymentReference || `TXID-${Date.now()}`;

      const ins = await client.query(
        `INSERT INTO subscriptions (
           tenant_id, plan_code, billing_cycle, amount, currency, status,
           payment_method, payment_reference, sender_phone, proof_url, notes,
           start_date, renewal_date, thank_you_shown
         )
         VALUES ($1,$2,$3,$4,$5,'PENDING_CONFIRMATION',$6,$7,$8,$9,$10,NOW(),$11,false)
         RETURNING *`,
        [
          numTenantId,
          String(planCode).toUpperCase(),
          cycle,
          numAmount,
          currency || 'XAF',
          paymentMethod || 'MTN_MOMO',
          txRef,
          senderPhone || null,
          proofUrl || null,
          notes || null,
          renewalDate
        ]
      );
      const created = formatSubscriptionRow(ins.rows[0]);

      const tRes = await client.query(`SELECT * FROM tenants WHERE id = $1`, [numTenantId]);
      const tenant = tRes.rows[0];

      await recordPlatformAudit(client, {
        tenantId: numTenantId,
        userEmail: tenant?.email || SMTP_CANONICAL_USER,
        action: 'SUBSCRIPTION_PAYMENT_SUBMITTED',
        resourceType: 'SAAS_SUBSCRIPTION',
        resourceId: String(created.id),
        ipAddress: req.ip,
        metadata: { txRef, amount: numAmount, planCode, summary: `Payment proof submitted: ${txRef} (${numAmount} ${currency || 'XAF'})` }
      });

      // Dispatch real SMTP notices to Super Admin (kreboya603@gmail.com) and Tenant
      try {
        await sendNotificationEmail(
          `[MADECC SaaS Billing] Payment Proof Submitted: ${tenant?.name || `Tenant #${numTenantId}`} (${txRef})`,
          `Tenant: ${tenant?.name || numTenantId}\nPlan: ${planCode} (${cycle})\nAmount: ${numAmount} XAF\nMethod: ${paymentMethod}\nSender: ${senderPhone}\nTXID: ${txRef}`,
          buildBrandedHtmlTemplate({
            title: 'New SaaS Subscription Payment Awaiting Verification',
            badge: `${planCode} • ${cycle}`,
            recipientName: 'MADECC Super Admin',
            leadParagraph: `A subscriber has submitted direct payment proof for verification in Super Admin.`,
            sectionsHtml: `
              <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin:12px 0;">
                <p style="margin:0 0 6px 0;font-size:13px;"><strong>Company:</strong> ${tenant?.name || `Tenant #${numTenantId}`}</p>
                <p style="margin:0 0 6px 0;font-size:13px;"><strong>Plan & Cycle:</strong> ${planCode} (${cycle})</p>
                <p style="margin:0 0 6px 0;font-size:13px;"><strong>Amount:</strong> ${numAmount.toLocaleString('fr-FR')} ${currency || 'XAF'}</p>
                <p style="margin:0 0 6px 0;font-size:13px;"><strong>Method / Sender:</strong> ${paymentMethod} • ${senderPhone || 'N/A'}</p>
                <p style="margin:0;font-size:13px;"><strong>Transaction Ref:</strong> <code>${txRef}</code></p>
                ${proofUrl ? `<p style="margin:8px 0 0 0;font-size:13px;"><strong>Proof Attachment:</strong> <a href="${proofUrl}">${proofUrl}</a></p>` : ''}
              </div>
            `,
            actionButton: { label: 'Verify Payment in Super Admin', url: `${siteBaseUrl}/?tab=super-admin` }
          })
        );

        if (tenant?.email) {
          await sendEmail(
            tenant.email,
            `MADECC Cloud Payment Received (${txRef}) — Pending Verification`,
            `We received your payment reference ${txRef} for ${planCode}. Verification completes shortly.`,
            buildBrandedHtmlTemplate({
              title: 'Subscription Payment Proof Received',
              badge: 'VERIFICATION IN PROGRESS',
              recipientName: tenant.name,
              leadParagraph: `Thank you! We received your ${paymentMethod} payment submission (${txRef}) for ${planCode}.`,
              sectionsHtml: `<p style="font-size:13px;color:#334155;">Amount: <strong>${numAmount.toLocaleString('fr-FR')} ${currency || 'XAF'}</strong><br/>Status: <strong>Pending Super Admin Confirmation</strong></p>`,
              actionButton: { label: 'Open MADECC Cloud Portal', url: `${siteBaseUrl}/?tenant=${encodeURIComponent(tenant.slug)}` }
            })
          );
        }
      } catch (mailErr) {
        console.warn('[SAAS_PAYMENT_SUBMIT_SMTP_WARN]', mailErr);
      }

      return res.status(201).json(created);
    } catch (err: any) {
      console.error('[SUBMIT_SUBSCRIPTION_ERROR]', err);
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.post('/api/saas/subscriptions/:id/confirm', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid subscription ID' });

    let client;
    try {
      client = await getDbClient();
      const subRes = await client.query(`SELECT * FROM subscriptions WHERE id = $1`, [id]);
      if (subRes.rows.length === 0) return res.status(404).json({ error: 'Subscription record not found' });
      const sub = subRes.rows[0];

      const planRes = await client.query(`SELECT * FROM plans WHERE UPPER(code) = UPPER($1) LIMIT 1`, [sub.plan_code]);
      const planCredits = Number(planRes.rows[0]?.ai_credits_monthly || (sub.plan_code === 'ENTERPRISE' ? 5000 : sub.plan_code === 'PROFESSIONAL' ? 500 : 100));

      const updatedSubRes = await client.query(
        `UPDATE subscriptions
         SET status = 'ACTIVE', confirmed_at = NOW(), confirmed_by = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [req.body?.confirmedBy || SMTP_CANONICAL_USER, id]
      );

      const updatedTenantRes = await client.query(
        `UPDATE tenants
         SET status = 'ACTIVE',
             publish_status = 'PUBLISHED',
             published_at = COALESCE(published_at, NOW()),
             last_republished_at = NOW(),
             plan_code = $1,
             ai_credits_balance = GREATEST(ai_credits_balance, $2),
             updated_at = NOW()
         WHERE id = $3
         RETURNING *`,
        [sub.plan_code, planCredits, sub.tenant_id]
      );

      const tenant = updatedTenantRes.rows[0] ? formatTenantRow(updatedTenantRes.rows[0]) : null;
      const updatedSub = formatSubscriptionRow(updatedSubRes.rows[0]);

      await recordPlatformAudit(client, {
        tenantId: sub.tenant_id,
        userEmail: req.body?.confirmedBy || SMTP_CANONICAL_USER,
        action: 'PAYMENT_CONFIRMED_AND_ACTIVATED',
        resourceType: 'SAAS_SUBSCRIPTION',
        resourceId: String(id),
        ipAddress: req.ip,
        metadata: { planCode: sub.plan_code, txRef: sub.payment_reference, summary: `Confirmed payment & activated ${tenant?.name || `Tenant #${sub.tenant_id}`} on ${sub.plan_code}` }
      });

      if (tenant?.email) {
        try {
          const portalUrl = `${siteBaseUrl}/?tenant=${encodeURIComponent(tenant.slug)}`;
          await sendEmail(
            tenant.email,
            `Official Activation Receipt: ${tenant.name} — ${sub.plan_code} Plan`,
            `Your MADECC Cloud workspace ${tenant.name} is now ACTIVE on ${sub.plan_code}. Transaction Ref: ${sub.payment_reference}.`,
            buildBrandedHtmlTemplate({
              title: 'Subscription Confirmed & Workspace Activated',
              badge: `OFFICIAL RECEIPT • ${sub.plan_code}`,
              recipientName: tenant.name,
              leadParagraph: `Your payment (${sub.payment_reference}) of ${Number(sub.amount).toLocaleString('fr-FR')} ${sub.currency} has been verified. Your construction portal is live.`,
              sectionsHtml: `
                <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;margin:12px 0;">
                  <p style="margin:0 0 6px 0;font-size:13px;"><strong>Workspace Domain:</strong> ${tenant.primaryDomain}</p>
                  <p style="margin:0 0 6px 0;font-size:13px;"><strong>Activated Tier:</strong> ${sub.plan_code} (${sub.billing_cycle})</p>
                  <p style="margin:0 0 6px 0;font-size:13px;"><strong>AI Credits Unlocked:</strong> ${tenant.aiCreditsBalance}</p>
                  <p style="margin:0;font-size:13px;"><strong>Confirmed By:</strong> ${updatedSub.confirmedBy}</p>
                </div>
              `,
              actionButton: { label: 'Launch Activated Workspace', url: portalUrl }
            })
          );
        } catch (mailErr) {
          console.warn('[SAAS_CONFIRM_SMTP_WARN]', mailErr);
        }
      }

      return res.json({ success: true, subscription: updatedSub, tenant });
    } catch (err: any) {
      console.error('[CONFIRM_SUBSCRIPTION_ERROR]', err);
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.post('/api/saas/subscriptions/:id/reject', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid subscription ID' });
    const reason = req.body?.reason || 'Payment reference not verified in statement';

    let client;
    try {
      client = await getDbClient();
      const upd = await client.query(
        `UPDATE subscriptions
         SET status = 'CANCELLED', notes = $1, updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [`REJECTED: ${reason}`, id]
      );
      if (upd.rows.length === 0) return res.status(404).json({ error: 'Subscription not found' });
      const sub = formatSubscriptionRow(upd.rows[0]);

      const tRes = await client.query(`SELECT name, email FROM tenants WHERE id = $1`, [sub.tenantId]);
      const tenant = tRes.rows[0];

      await recordPlatformAudit(client, {
        tenantId: sub.tenantId,
        userEmail: SMTP_CANONICAL_USER,
        action: 'PAYMENT_REJECTED',
        resourceType: 'SAAS_SUBSCRIPTION',
        resourceId: String(id),
        ipAddress: req.ip,
        metadata: { reason, summary: `Rejected payment ${sub.paymentReference}: ${reason}` }
      });

      if (tenant?.email) {
        try {
          await sendEmail(
            tenant.email,
            `Subscription Payment Update (${sub.paymentReference})`,
            `Your payment submission ${sub.paymentReference} could not be verified: ${reason}.`,
            buildBrandedHtmlTemplate({
              title: 'Payment Verification Requires Attention',
              badge: 'BILLING NOTICE',
              recipientName: tenant.name,
              leadParagraph: `We could not verify transaction reference ${sub.paymentReference}. Reason: ${reason}.`,
              sectionsHtml: `<p style="font-size:13px;color:#334155;">Please reply to this email or submit an updated transaction reference inside Billing & Invoices.</p>`,
              actionButton: { label: 'Open Billing Center', url: `${siteBaseUrl}/?tab=saas` }
            })
          );
        } catch (mailErr) {
          console.warn('[SAAS_REJECT_SMTP_WARN]', mailErr);
        }
      }

      return res.json({ success: true, subscription: sub });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.post('/api/saas/subscriptions/:id/share-receipt', async (req: Request, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const { recipientEmail } = req.body || {};
    if (isNaN(id) || !recipientEmail) {
      return res.status(400).json({ error: 'Valid subscription ID and recipientEmail are required.' });
    }

    let client;
    try {
      client = await getDbClient();
      const subRes = await client.query(
        `SELECT s.*, t.name AS tenant_name, t.primary_domain FROM subscriptions s LEFT JOIN tenants t ON t.id = s.tenant_id WHERE s.id = $1`,
        [id]
      );
      if (subRes.rows.length === 0) return res.status(404).json({ error: 'Subscription not found' });
      const r = subRes.rows[0];

      const html = buildBrandedHtmlTemplate({
        title: `MADECC Cloud Subscription Receipt — ${r.payment_reference}`,
        badge: `${r.plan_code} • ${r.status}`,
        recipientName: recipientEmail,
        leadParagraph: `Official MADECC Construction Cloud billing receipt for ${r.tenant_name || `Tenant #${r.tenant_id}`}.`,
        sectionsHtml: `
          <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px;margin:12px 0;">
            <p style="margin:0 0 6px 0;font-size:13px;"><strong>Transaction Ref:</strong> ${r.payment_reference}</p>
            <p style="margin:0 0 6px 0;font-size:13px;"><strong>Plan Tier:</strong> ${r.plan_code} (${r.billing_cycle})</p>
            <p style="margin:0 0 6px 0;font-size:13px;"><strong>Amount:</strong> ${Number(r.amount).toLocaleString('fr-FR')} ${r.currency}</p>
            <p style="margin:0 0 6px 0;font-size:13px;"><strong>Method:</strong> ${r.payment_method}</p>
            <p style="margin:0;font-size:13px;"><strong>Status:</strong> ${r.status}</p>
          </div>
        `,
        actionButton: { label: 'Open MADECC Cloud', url: `${siteBaseUrl}/?tab=saas` }
      });

      const mailInfo = await sendEmail(
        recipientEmail.trim(),
        `MADECC Cloud Receipt: ${r.payment_reference} (${r.plan_code})`,
        `Receipt ${r.payment_reference}: ${r.amount} ${r.currency} for ${r.tenant_name || 'Tenant'} (${r.status})`,
        html
      );

      await recordPlatformAudit(client, {
        tenantId: r.tenant_id,
        userEmail: SMTP_CANONICAL_USER,
        action: 'RECEIPT_SHARED_VIA_SMTP',
        resourceType: 'SAAS_SUBSCRIPTION',
        resourceId: String(id),
        ipAddress: req.ip,
        metadata: { recipientEmail, summary: `Shared subscription receipt ${r.payment_reference} via SMTP` }
      });

      return res.json({ success: true, simulated: Boolean((mailInfo as any)?.simulated) });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // =========================================================================
  // 4. DIRECT PAYMENT CONFIG (PERSISTED IN NEON site_settings)
  // =========================================================================
  app.get('/api/saas/payment-config', async (_req: Request, res: Response) => {
    let client;
    try {
      client = await getDbClient();
      const cfg = await getPersistedPaymentConfig(client);
      return res.json(cfg);
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.put('/api/saas/payment-config', async (req: Request, res: Response) => {
    let client;
    try {
      client = await getDbClient();
      const current = await getPersistedPaymentConfig(client);
      const updated = {
        ...current,
        ...(req.body.momoNumbers !== undefined ? { momoNumbers: req.body.momoNumbers } : {}),
        ...(req.body.orangeMoneyNumbers !== undefined ? { orangeMoneyNumbers: req.body.orangeMoneyNumbers } : {}),
        ...(req.body.bankAccount !== undefined ? { bankAccount: req.body.bankAccount } : {}),
        ...(req.body.contactWhatsApp !== undefined ? { contactWhatsApp: req.body.contactWhatsApp } : {}),
        ...(req.body.contactEmail !== undefined ? { contactEmail: req.body.contactEmail } : {}),
        ...(req.body.stripeEnabled !== undefined ? { stripeEnabled: Boolean(req.body.stripeEnabled) } : {}),
        ...(req.body.promoNote !== undefined ? { promoNote: req.body.promoNote } : {})
      };

      await client.query(
        `INSERT INTO saas_platform_settings (key, value, category, description, updated_at, updated_by)
         VALUES ('saas_payment_config', $1::jsonb, 'saas', 'MADECC Cloud Direct Payment Receiving Accounts', NOW(), $2)
         ON CONFLICT (key)
         DO UPDATE SET value = $1::jsonb, updated_at = NOW(), updated_by = $2`,
        [JSON.stringify(updated), SMTP_CANONICAL_USER]
      );

      await recordPlatformAudit(client, {
        userEmail: SMTP_CANONICAL_USER,
        action: 'PAYMENT_CONFIG_SAVED',
        resourceType: 'SAAS_PAYMENT_CONFIG',
        resourceId: 'GLOBAL',
        ipAddress: req.ip,
        metadata: { summary: 'Saved direct MoMo, Orange Money & Bank payout configuration in Neon' }
      });

      return res.json({ success: true, config: updated });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // =========================================================================
  // 5. USAGE METERING, AUDIT LOGS, PLATFORM SHARE & REAL NEON ANALYTICS
  // =========================================================================
  app.get('/api/saas/usage-events', async (req: Request, res: Response) => {
    const tenantId = req.query.tenantId ? Number(req.query.tenantId) : null;
    let client;
    try {
      client = await getDbClient();
      const query = tenantId
        ? `SELECT u.*, t.name AS tenant_name FROM usage_events u LEFT JOIN tenants t ON t.id = u.tenant_id WHERE u.tenant_id = $1 ORDER BY u.id DESC LIMIT 100`
        : `SELECT u.*, t.name AS tenant_name FROM usage_events u LEFT JOIN tenants t ON t.id = u.tenant_id ORDER BY u.id DESC LIMIT 100`;
      const result = tenantId ? await client.query(query, [tenantId]) : await client.query(query);
      return res.json({ success: true, events: result.rows });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.post('/api/saas/usage', async (req: Request, res: Response) => {
    const { tenantId, userId, eventType, quantity, unit, estimatedCost, metadata } = req.body || {};
    if (!tenantId || !eventType) {
      return res.status(400).json({ error: 'tenantId and eventType are required.' });
    }
    const qty = Number(quantity ?? 1);

    let client;
    try {
      client = await getDbClient();
      const ins = await client.query(
        `INSERT INTO usage_events (tenant_id, user_id, event_type, quantity, unit, estimated_cost, metadata)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb)
         RETURNING *`,
        [
          Number(tenantId),
          userId || 'system',
          eventType,
          qty,
          unit || 'credit',
          Number(estimatedCost || 0),
          JSON.stringify(metadata || {})
        ]
      );

      if ((unit || 'credit') === 'credit') {
        await client.query(
          `UPDATE tenants SET ai_credits_balance = GREATEST(0, ai_credits_balance - $1), updated_at = NOW() WHERE id = $2`,
          [qty, Number(tenantId)]
        );
      }

      return res.status(201).json({ success: true, event: ins.rows[0] });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.get('/api/saas/audit-logs', async (req: Request, res: Response) => {
    const tenantId = req.query.tenantId ? Number(req.query.tenantId) : null;
    let client;
    try {
      client = await getDbClient();
      const query = tenantId
        ? `SELECT a.*, t.name AS tenant_name FROM platform_audit_logs a LEFT JOIN tenants t ON t.id = a.tenant_id WHERE a.tenant_id = $1 ORDER BY a.id DESC LIMIT 150`
        : `SELECT a.*, t.name AS tenant_name FROM platform_audit_logs a LEFT JOIN tenants t ON t.id = a.tenant_id ORDER BY a.id DESC LIMIT 150`;
      const result = tenantId ? await client.query(query, [tenantId]) : await client.query(query);
      return res.json({ success: true, logs: result.rows });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.post('/api/saas/share-overview', async (req: Request, res: Response) => {
    const { recipientEmail, message } = req.body || {};
    if (!recipientEmail || !String(recipientEmail).includes('@')) {
      return res.status(400).json({ error: 'Valid recipientEmail is required.' });
    }
    let client;
    try {
      client = await getDbClient();
      const plansRes = await client.query(
        `SELECT name, code, monthly_price, annual_price, currency FROM plans WHERE status = 'ACTIVE' AND COALESCE(publish_status, 'PUBLISHED') = 'PUBLISHED' ORDER BY display_order ASC`
      );
      const rowsHtml = plansRes.rows
        .map(p => `<li><strong>${p.name} (${p.code})</strong>: ${Number(p.monthly_price).toLocaleString('fr-FR')} ${p.currency}/mo</li>`)
        .join('');

      const html = buildBrandedHtmlTemplate({
        title: 'MADECC Construction Cloud — SaaS Pricing & Overview',
        badge: 'MULTI-TENANT CIVIL ENGINEERING ERP',
        recipientName: recipientEmail,
        leadParagraph: 'Explore MADECC Construction Cloud: 12-stage AI CAD Takeoff, Eurocode 2 Structural Studio, BOQ Revision Tree, and White-Label Construction Portals.',
        sectionsHtml: `
          <ul style="font-size:13px;color:#334155;line-height:1.8;">${rowsHtml}</ul>
          ${message ? `<p style="font-size:13px;color:#475569;"><em>Message:</em> ${message}</p>` : ''}
        `,
        actionButton: { label: 'Launch Company Portal', url: `${siteBaseUrl}/?tab=saas` }
      });

      const mailInfo = await sendEmail(
        recipientEmail.trim(),
        'MADECC Construction Cloud — Enterprise SaaS Tiers & Overview',
        `Explore MADECC Construction Cloud at ${siteBaseUrl}/?tab=saas`,
        html
      );

      await recordPlatformAudit(client, {
        userEmail: SMTP_CANONICAL_USER,
        action: 'SAAS_BROCHURE_SHARED',
        resourceType: 'SAAS_PLATFORM',
        resourceId: 'OVERVIEW',
        ipAddress: req.ip,
        metadata: { recipientEmail, summary: `Shared MADECC Construction Cloud brochure to ${recipientEmail}` }
      });

      return res.json({
        success: true,
        simulated: Boolean((mailInfo as any)?.simulated),
        message: `SaaS overview sent to ${recipientEmail} via ${SMTP_CANONICAL_USER}.`
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.get('/api/saas/analytics', async (_req: Request, res: Response) => {
    let client;
    try {
      client = await getDbClient();
      const [tenantsRes, plansRes, subsRes, usageRes, versionsRes, auditsRes] = await Promise.all([
        client.query(`SELECT id, status, publish_status, plan_code, ai_credits_balance, storage_usage_bytes FROM tenants`),
        client.query(`SELECT code, monthly_price, annual_price FROM plans`),
        client.query(`SELECT status, billing_cycle, amount FROM subscriptions`),
        client.query(`SELECT event_type, COUNT(*)::int AS runs, COALESCE(SUM(quantity), 0)::int AS qty, COALESCE(SUM(estimated_cost), 0)::int AS cost FROM usage_events GROUP BY event_type`),
        client.query(`SELECT COUNT(*)::int AS cnt FROM saas_workspace_versions`),
        client.query(`SELECT COUNT(*)::int AS cnt FROM platform_audit_logs`)
      ]);

      const planPriceMap: Record<string, number> = {};
      for (const p of plansRes.rows) {
        planPriceMap[String(p.code).toUpperCase()] = Number(p.monthly_price || 0);
      }

      let activeSubscriptionsMrr = 0;
      let totalCollected = 0;
      let pendingCash = 0;
      let pendingApprovalCount = 0;

      for (const s of subsRes.rows) {
        if (s.status === 'ACTIVE') {
          totalCollected += Number(s.amount || 0);
          activeSubscriptionsMrr += s.billing_cycle === 'ANNUAL'
            ? Math.round(Number(s.amount || 0) / 12)
            : Number(s.amount || 0);
        } else if (s.status === 'PENDING_CONFIRMATION') {
          pendingCash += Number(s.amount || 0);
          pendingApprovalCount += 1;
        }
      }

      const activePlanMrr = tenantsRes.rows
        .filter(t => t.status === 'ACTIVE')
        .reduce((acc, t) => acc + (planPriceMap[String(t.plan_code).toUpperCase()] || 0), 0);

      const mrr = activeSubscriptionsMrr > 0 ? activeSubscriptionsMrr : activePlanMrr;
      const arr = mrr * 12;

      const usageSummary = {
        totalRuns: usageRes.rows.reduce((a, r) => a + Number(r.runs || 0), 0),
        totalCreditsUsed: usageRes.rows.reduce((a, r) => a + Number(r.qty || 0), 0),
        totalEstimatedCostXaf: usageRes.rows.reduce((a, r) => a + Number(r.cost || 0), 0),
        byType: usageRes.rows
      };

      const totalStorageBytes = tenantsRes.rows.reduce((a, t) => a + Number(t.storage_usage_bytes || 0), 0);

      return res.json({
        mrr,
        arr,
        totalCollected,
        pendingCash,
        activeTenantsCount: tenantsRes.rows.filter(t => t.status === 'ACTIVE').length,
        publishedTenantsCount: tenantsRes.rows.filter(t => (t.publish_status || 'PUBLISHED') === 'PUBLISHED').length,
        totalTenantsCount: tenantsRes.rows.length,
        pendingApprovalCount,
        totalVersionsCount: Number(versionsRes.rows[0]?.cnt || 0),
        totalAuditLogsCount: Number(auditsRes.rows[0]?.cnt || 0),
        totalStorageGb: Number((totalStorageBytes / (1024 * 1024 * 1024)).toFixed(2)),
        usageSummary,
        currency: 'XAF'
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });
}
