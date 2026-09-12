import express from 'express';
import { requireAuth, requireStaffOrAdmin } from '../../middleware/auth.ts';
import { db } from '../../db/index.ts';
import { 
  siteSettings, 
  users, 
  projects, 
  services, 
  blogPosts, 
  auditLogs, 
  authSessions, 
  signedContracts,
  cmsActivityLogs 
} from '../../db/schema.ts';
import { eq, desc, and, sql, or, like } from 'drizzle-orm';
import { logAudit } from '../../lib/audit.ts';
import { getTransporter, SMTP_CANONICAL_USER, sendNotificationEmail } from '../mailService.ts';

export function setupOptimizerRoutes(app: express.Express) {
  // 1. LIVE SYSTEM & INFRASTRUCTURE STATUS INSPECTION
  app.get('/api/optimizer/status', async (req, res) => {
    try {
      // 1.1 Neon Database Health Check
      const dbStartTime = Date.now();
      let dbConnected = false;
      let dbLatencyMs = 0;
      let tableCounts: Record<string, number> = {};
      let activeSessionsCount = 0;

      if (db) {
        try {
          const testQuery = await db.select().from(siteSettings).limit(1);
          dbLatencyMs = Date.now() - dbStartTime;
          dbConnected = true;

          // Gather table statistics safely
          const [
            usersCountRes,
            projectsCountRes,
            servicesCountRes,
            blogsCountRes,
            auditLogsCountRes,
            activeSessionsRes,
            signedContractsRes
          ] = await Promise.allSettled([
            db.select({ count: sql<number>`count(*)` }).from(users),
            db.select({ count: sql<number>`count(*)` }).from(projects),
            db.select({ count: sql<number>`count(*)` }).from(services),
            db.select({ count: sql<number>`count(*)` }).from(blogPosts),
            db.select({ count: sql<number>`count(*)` }).from(auditLogs),
            db.select({ count: sql<number>`count(*)` }).from(authSessions).where(eq(authSessions.isActive, true)),
            db.select({ count: sql<number>`count(*)` }).from(signedContracts)
          ]);

          tableCounts = {
            users: usersCountRes.status === 'fulfilled' ? Number(usersCountRes.value[0]?.count || 0) : 0,
            projects: projectsCountRes.status === 'fulfilled' ? Number(projectsCountRes.value[0]?.count || 0) : 0,
            services: servicesCountRes.status === 'fulfilled' ? Number(servicesCountRes.value[0]?.count || 0) : 0,
            blogs: blogsCountRes.status === 'fulfilled' ? Number(blogsCountRes.value[0]?.count || 0) : 0,
            auditLogs: auditLogsCountRes.status === 'fulfilled' ? Number(auditLogsCountRes.value[0]?.count || 0) : 0,
            signedContracts: signedContractsRes.status === 'fulfilled' ? Number(signedContractsRes.value[0]?.count || 0) : 0
          };

          activeSessionsCount = activeSessionsRes.status === 'fulfilled' ? Number(activeSessionsRes.value[0]?.count || 0) : 0;
        } catch (dbErr: any) {
          console.warn('[OPTIMIZER_DB_HEALTH_WARN]', dbErr.message);
          dbConnected = false;
        }
      }

      // 1.2 SMTP Engine Configuration & Status
      const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
      const smtpPort = parseInt(process.env.SMTP_PORT || '587');
      const smtpUser = process.env.SMTP_USER || SMTP_CANONICAL_USER;
      const hasSmtpPassword = Boolean(process.env.SMTP_PASS || process.env.SMTP_PASSWORD);
      const transporter = getTransporter();
      const smtpReady = Boolean(transporter && hasSmtpPassword);

      // 1.3 Cloudinary CDN Engine Status
      const cloudinaryCloud = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || '';
      const hasCloudinaryKey = Boolean(process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY);
      const hasCloudinarySecret = Boolean(process.env.CLOUDINARY_API_SECRET);
      const cloudinaryReady = Boolean(cloudinaryCloud && hasCloudinaryKey);

      // 1.4 Supabase Storage Engine Status
      const supabaseUrl = process.env.SUPABASE_URL || '';
      const hasSupabaseKey = Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);
      const supabaseBucket = process.env.SUPABASE_BUCKET || 'madecc-assets';
      const supabaseReady = Boolean(supabaseUrl && hasSupabaseKey);

      return res.json({
        success: true,
        timestamp: new Date().toISOString(),
        database: {
          provider: 'Neon Serverless PostgreSQL',
          connected: dbConnected,
          latencyMs: dbLatencyMs,
          activeDatabaseSessions: activeSessionsCount,
          tableCounts,
          sessionAuthority: 'auth_sessions table (Zero temporal storage)'
        },
        smtp: {
          provider: 'Authenticated Google SMTP Service',
          canonicalUser: SMTP_CANONICAL_USER,
          activeUser: smtpUser,
          host: smtpHost,
          port: smtpPort,
          isConfigured: hasSmtpPassword,
          isReady: smtpReady,
          authMode: 'TLS / SSL Port ' + smtpPort
        },
        cloudinary: {
          provider: 'Cloudinary Global Media CDN',
          cloudName: cloudinaryCloud || 'madecc-cloud',
          isConfigured: cloudinaryReady,
          hasApiSecret: hasCloudinarySecret,
          features: ['f_auto', 'q_auto', 'Responsive Breakpoints', 'WebP/AVIF Delivery']
        },
        supabase: {
          provider: 'Supabase Object Storage',
          urlConfigured: Boolean(supabaseUrl),
          bucket: supabaseBucket,
          isConfigured: supabaseReady
        }
      });
    } catch (err: any) {
      console.error('[OPTIMIZER_STATUS_ERROR]', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 2. LIVE SMTP TEST DISPATCH ENGINE VIA kreboya603@gmail.com
  app.post('/api/optimizer/test-smtp', requireStaffOrAdmin, async (req: any, res) => {
    try {
      const { recipient, customSubject, customMessage } = req.body;
      const targetRecipient = (recipient || SMTP_CANONICAL_USER).trim();
      const subject = customSubject || `[MADECC LIVE SYSTEM AUDIT] SMTP Verification - ${new Date().toLocaleTimeString()}`;
      const userDisplayName = req.dbUser?.displayName || req.dbUser?.name || 'Administrator';
      const userEmail = req.dbUser?.email || SMTP_CANONICAL_USER;

      const messageContent = customMessage || 
        `This is a verified live system dispatch from the MADECC GROUP Executive Admin Portal.\n\n` +
        `Infrastructure Diagnostics:\n` +
        `- SMTP Gateway: Authenticated via ${SMTP_CANONICAL_USER}\n` +
        `- Database Backend: Neon Serverless PostgreSQL\n` +
        `- Operator: ${userDisplayName} (${userEmail})\n` +
        `- Timestamp: ${new Date().toUTCString()}\n` +
        `- Delivery Mode: Production Node.js Transporter\n\n` +
        `All systems operating within normal parameters.`;

      const brandedHtml = `
        <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #0f172a; color: #f8fafc; border-radius: 16px; overflow: hidden; border: 1px solid #334155;">
          <div style="background: linear-gradient(135deg, #d97706, #f59e0b); padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px; font-weight: 800; letter-spacing: 1px;">MADECC GROUP</h1>
            <p style="color: #fef3c7; margin: 4px 0 0; font-size: 13px; font-weight: 600;">Executive Infrastructure & Live SMTP Test</p>
          </div>
          <div style="padding: 28px; background: #1e293b;">
            <div style="background: rgba(245, 158, 11, 0.1); border-left: 4px solid #f59e0b; padding: 14px 18px; border-radius: 8px; margin-bottom: 20px;">
              <span style="font-size: 11px; font-weight: 700; color: #f59e0b; text-transform: uppercase; letter-spacing: 0.5px;">Live Verification Passed</span>
              <p style="color: #e2e8f0; margin: 6px 0 0; font-size: 14px; font-weight: 500;">
                SMTP Email Engine is operational and authenticated using <strong>${SMTP_CANONICAL_USER}</strong>.
              </p>
            </div>
            
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6; white-space: pre-line;">
              ${messageContent}
            </p>

            <table style="width: 100%; margin-top: 24px; border-collapse: collapse; font-size: 13px;">
              <tr style="border-bottom: 1px solid #334155;">
                <td style="padding: 8px 0; color: #94a3b8;">Triggered By:</td>
                <td style="padding: 8px 0; color: #f8fafc; font-weight: 600; text-align: right;">${userDisplayName} (${userEmail})</td>
              </tr>
              <tr style="border-bottom: 1px solid #334155;">
                <td style="padding: 8px 0; color: #94a3b8;">Target Recipient:</td>
                <td style="padding: 8px 0; color: #f8fafc; font-weight: 600; text-align: right;">${targetRecipient}</td>
              </tr>
              <tr style="border-bottom: 1px solid #334155;">
                <td style="padding: 8px 0; color: #94a3b8;">Database Session:</td>
                <td style="padding: 8px 0; color: #10b981; font-weight: 600; text-align: right;">Neon DB Live Authority</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #94a3b8;">Server Time:</td>
                <td style="padding: 8px 0; color: #f8fafc; font-weight: 600; text-align: right;">${new Date().toISOString()}</td>
              </tr>
            </table>
          </div>
          <div style="background: #0f172a; padding: 16px; text-align: center; border-top: 1px solid #334155; font-size: 11px; color: #64748b;">
            MADECC GROUP SARL • Akwa, Douala & Mbankolo, Yaoundé, Cameroon • Tel: +237 683 31 64 86
          </div>
        </div>
      `;

      const startTime = Date.now();
      await sendNotificationEmail(subject, messageContent, brandedHtml, {
        to: targetRecipient
      });
      const latencyMs = Date.now() - startTime;

      // Authoritative audit logging in Neon DB
      try {
        await logAudit(
          req.dbUser?.uid || 'admin-madecc-uid',
          req.dbUser?.email || SMTP_CANONICAL_USER,
          'OPTIMIZER_SMTP_TEST',
          `Dispatched live verification email to ${targetRecipient} via ${SMTP_CANONICAL_USER} (${latencyMs}ms)`
        );
      } catch (auditErr) {
        console.warn('[AUDIT_LOG_WARN]', auditErr);
      }

      return res.json({
        success: true,
        message: `Live test email dispatched successfully to ${targetRecipient} via ${SMTP_CANONICAL_USER}`,
        recipient: targetRecipient,
        sender: SMTP_CANONICAL_USER,
        latencyMs,
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      console.error('[OPTIMIZER_SMTP_ERROR]', err);
      return res.status(500).json({ 
        success: false, 
        error: err.message || 'Failed to dispatch email test through SMTP transporter' 
      });
    }
  });

  // 3. LIVE COMPREHENSIVE AUDIT TRAIL
  app.get('/api/optimizer/audit-trail', requireStaffOrAdmin, async (req, res) => {
    try {
      const limit = Math.min(parseInt((req.query.limit as string) || '50'), 200);
      const search = ((req.query.search as string) || '').trim().toLowerCase();
      const actionFilter = ((req.query.action as string) || '').trim();

      if (!db) {
        return res.json({ success: true, logs: [] });
      }

      let query = db.select().from(auditLogs).orderBy(desc(auditLogs.timestamp)).limit(limit);

      const logs = await query;

      let filtered = logs;
      if (search) {
        filtered = filtered.filter(l => 
          (l.details && l.details.toLowerCase().includes(search)) ||
          (l.userEmail && l.userEmail.toLowerCase().includes(search)) ||
          (l.action && l.action.toLowerCase().includes(search))
        );
      }

      if (actionFilter && actionFilter !== 'ALL') {
        filtered = filtered.filter(l => l.action === actionFilter);
      }

      return res.json({
        success: true,
        total: filtered.length,
        logs: filtered
      });
    } catch (err: any) {
      console.error('[OPTIMIZER_AUDIT_ERROR]', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 4. REVOKE STALE OR INACTIVE DATABASE SESSIONS
  app.post('/api/optimizer/clean-sessions', requireStaffOrAdmin, async (req: any, res) => {
    try {
      if (!db) {
        return res.status(500).json({ success: false, error: 'Database unavailable' });
      }

      const now = new Date();
      // Revoke all sessions that are either marked inactive or whose expiresAt is past
      const updated = await db
        .update(authSessions)
        .set({ isActive: false, revokedAt: now })
        .where(
          or(
            sql`${authSessions.expiresAt} < ${now}`,
            eq(authSessions.isActive, false)
          )
        )
        .returning();

      await logAudit(
        req.dbUser?.uid || 'admin-madecc-uid',
        req.dbUser?.email || SMTP_CANONICAL_USER,
        'CLEAN_STALE_SESSIONS',
        `Cleaned ${updated.length} expired or inactive database sessions in Neon PostgreSQL.`
      );

      return res.json({
        success: true,
        message: `Successfully cleaned ${updated.length} expired or inactive sessions from live database.`,
        cleanedCount: updated.length
      });
    } catch (err: any) {
      console.error('[CLEAN_SESSIONS_ERROR]', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });

  // 5. QUICK LIVE OPTIMIZATION SETTINGS UPDATE
  app.post('/api/optimizer/quick-settings', requireStaffOrAdmin, async (req: any, res) => {
    try {
      if (!db) {
        return res.status(500).json({ success: false, error: 'Database unavailable' });
      }

      const { 
        siteName,
        tagline,
        phone,
        phoneSecondary,
        emergencyPhone,
        email,
        businessHours,
        whatsappNumber,
        emergencyBanner,
        themeSettings
      } = req.body;

      const existing = await db.select().from(siteSettings).limit(1);
      let updatedRecord;

      if (existing.length > 0) {
        const result = await db.update(siteSettings)
          .set({
            ...(siteName !== undefined ? { siteName } : {}),
            ...(tagline !== undefined ? { tagline } : {}),
            ...(phone !== undefined ? { phone } : {}),
            ...(phoneSecondary !== undefined ? { phoneSecondary } : {}),
            ...(emergencyPhone !== undefined ? { emergencyPhone } : {}),
            ...(email !== undefined ? { email } : {}),
            ...(businessHours !== undefined ? { businessHours } : {}),
            ...(whatsappNumber !== undefined ? { whatsappNumber } : {}),
            ...(emergencyBanner !== undefined ? { emergencyBanner } : {}),
            ...(themeSettings !== undefined ? { themeSettings } : {}),
            updatedBy: req.dbUser?.displayName || req.dbUser?.email || 'Administrator',
            updatedAt: new Date()
          })
          .where(eq(siteSettings.id, existing[0].id))
          .returning();
        updatedRecord = result[0];
      } else {
        const result = await db.insert(siteSettings).values({
          siteName: siteName || 'MADECC GROUP',
          tagline: tagline || 'Premier Engineering, Construction & Project Management in Cameroon',
          phone: phone || '+237 683 31 64 86',
          phoneSecondary: phoneSecondary || '+237 671 063 511',
          emergencyPhone: emergencyPhone || '+237 683 31 64 86',
          email: email || SMTP_CANONICAL_USER,
          businessHours: businessHours || 'Mon - Fri: 08:00 - 18:00 | Sat: 08:30 - 14:00 (GMT+1)',
          whatsappNumber: whatsappNumber || '+237 683 31 64 86',
          emergencyBanner: emergencyBanner || null,
          themeSettings: themeSettings || null,
          updatedBy: req.dbUser?.displayName || req.dbUser?.email || 'Administrator'
        }).returning();
        updatedRecord = result[0];
      }

      await logAudit(
        req.dbUser?.uid || 'admin-madecc-uid',
        req.dbUser?.email || SMTP_CANONICAL_USER,
        'LIVE_SETTINGS_OPTIMIZED',
        `Live site parameters customized and saved directly to Neon DB.`
      );

      return res.json({
        success: true,
        message: 'Live website parameters updated and persisted to Neon PostgreSQL successfully.',
        settings: updatedRecord
      });
    } catch (err: any) {
      console.error('[OPTIMIZER_QUICK_SETTINGS_ERROR]', err);
      return res.status(500).json({ success: false, error: err.message });
    }
  });
}
