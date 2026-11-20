import express from 'express';
import { db } from '../../db/index.ts';
import {
  securityEvents,
  securityVisitorLogs,
  securityIpIntelligence,
  securityBlockedIps,
  securityAlerts,
  securityIncidents,
  securityTrafficStatsHourly,
  securityAlertPolicies,
  securityAuditTrail,
  securityAdminPreferences,
} from '../../db/schema.ts';
import { and, desc, eq, gte, lte, sql } from 'drizzle-orm';
import { requireAdmin, requireStaffOrAdmin, type AuthRequest } from '../../middleware/auth.ts';
import {
  extractClientIp,
  isPrivateOrLoopbackIp,
  sanitizeTelemetryString,
  recordVisitorPageView,
  enrichIpIntelligence,
  recordSecurityAudit,
  invalidateSecurityCaches,
  getAllowlistedIps,
} from '../securityMonitorService.ts';

function setNoStore(res: express.Response) {
  res.setHeader('Cache-Control', 'no-store, private, max-age=0');
  res.setHeader('Pragma', 'no-cache');
}

function resolveDateRange(windowParam?: string, fromParam?: string, toParam?: string): {
  from: Date;
  to: Date;
  windowKey: string;
} {
  const now = new Date();
  const key = (windowParam || '7d').toLowerCase();

  if (key === 'custom' && fromParam) {
    const parsedFrom = new Date(fromParam);
    const parsedTo = toParam ? new Date(toParam) : now;
    if (!Number.isNaN(parsedFrom.getTime())) {
      return {
        from: parsedFrom,
        to: !Number.isNaN(parsedTo.getTime()) ? parsedTo : now,
        windowKey: 'custom',
      };
    }
  }

  if (key === 'today' || key === '24h') {
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return { from: start, to: now, windowKey: key };
  }
  if (key === '30d') {
    return { from: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000), to: now, windowKey: '30d' };
  }
  return { from: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), to: now, windowKey: '7d' };
}

function escapeCsvCell(value: unknown): string {
  const raw = String(value ?? '');
  const formulaSafe = /^[=+\-@\t\r]/.test(raw) ? `'${raw}` : raw;
  const escaped = formulaSafe.replace(/"/g, '""');
  return `"${escaped}"`;
}

export function setupSecurityRoutes(app: express.Express) {
  // 1. Privacy-Conscious Visitor Telemetry Beacon (Public SPA navigation event)
  app.post('/api/security/beacon', async (req: AuthRequest, res) => {
    try {
      await recordVisitorPageView(req, {
        path: req.body?.path,
        tab: req.body?.tab,
        referrer: req.body?.referrer,
        sessionId: req.body?.sessionId,
        userEmail: req.dbUser?.email,
      });
      res.status(204).end();
    } catch {
      res.status(204).end();
    }
  });

  // 2. Enterprise SOC Summary Dashboard & Live KPIs
  app.get('/api/admin/security/summary', requireStaffOrAdmin, async (req: AuthRequest, res) => {
    setNoStore(res);
    try {
      const { from, to, windowKey } = resolveDateRange(
        req.query.window as string,
        req.query.from as string,
        req.query.to as string
      );
      const activeCutoff = new Date(Date.now() - 15 * 60 * 1000);

      if (!db) {
        return res.json({
          success: true,
          window: windowKey,
          from: from.toISOString(),
          to: to.toISOString(),
          callerIp: extractClientIp(req),
          metrics: {
            totalVisits: 0,
            uniqueVisitors: 0,
            activeVisitors: 0,
            totalRequests: 0,
            blockedRequests: 0,
            authFailures: 0,
            rbacDenied: 0,
            rateLimitHits: 0,
            uploadRejections: 0,
            openAlerts: 0,
            openIncidents: 0,
            activeBlockedIps: 0,
            suspiciousIpsCount: 0,
          },
          hourlyTraffic: [],
          categoryBreakdown: [],
          topTargetedPaths: [],
          lastEventAt: null,
        });
      }

      const [
        visitorStatsRes,
        uniqueVisitorsRes,
        activeVisitorsRes,
        eventsCategoryRes,
        hourlyStatsRes,
        topPathsRes,
        openAlertsRes,
        openIncidentsRes,
        activeBlocksRes,
        suspiciousIpsRes,
        lastEventRes,
      ] = await Promise.all([
        db
          .select({ count: sql<number>`count(*)` })
          .from(securityVisitorLogs)
          .where(and(gte(securityVisitorLogs.createdAt, from), lte(securityVisitorLogs.createdAt, to))),
        db
          .select({
            count: sql<number>`count(distinct coalesce(nullif(${securityVisitorLogs.sessionId}, ''), ${securityVisitorLogs.ipAddress}))`,
          })
          .from(securityVisitorLogs)
          .where(and(gte(securityVisitorLogs.createdAt, from), lte(securityVisitorLogs.createdAt, to))),
        db
          .select({
            count: sql<number>`count(distinct coalesce(nullif(${securityVisitorLogs.sessionId}, ''), ${securityVisitorLogs.ipAddress}))`,
          })
          .from(securityVisitorLogs)
          .where(gte(securityVisitorLogs.createdAt, activeCutoff)),
        db
          .select({
            category: securityEvents.eventCategory,
            count: sql<number>`count(*)`,
            blockedCount: sql<number>`sum(case when ${securityEvents.blocked} then 1 else 0 end)`,
          })
          .from(securityEvents)
          .where(and(gte(securityEvents.createdAt, from), lte(securityEvents.createdAt, to)))
          .groupBy(securityEvents.eventCategory),
        db
          .select()
          .from(securityTrafficStatsHourly)
          .where(gte(securityTrafficStatsHourly.bucketHour, `${from.toISOString().slice(0, 13)}:00:00Z`))
          .orderBy(securityTrafficStatsHourly.bucketHour)
          .limit(168),
        db
          .select({
            path: securityEvents.path,
            count: sql<number>`count(*)`,
          })
          .from(securityEvents)
          .where(and(gte(securityEvents.createdAt, from), lte(securityEvents.createdAt, to)))
          .groupBy(securityEvents.path)
          .orderBy(desc(sql`count(*)`))
          .limit(8),
        db
          .select({ count: sql<number>`count(*)` })
          .from(securityAlerts)
          .where(eq(securityAlerts.status, 'OPEN')),
        db
          .select({ count: sql<number>`count(*)` })
          .from(securityIncidents)
          .where(sql`${securityIncidents.status} != 'CLOSED'`),
        db
          .select({ count: sql<number>`count(*)` })
          .from(securityBlockedIps)
          .where(eq(securityBlockedIps.isActive, true)),
        db
          .select({ count: sql<number>`count(*)` })
          .from(securityIpIntelligence)
          .where(sql`${securityIpIntelligence.threatHits} > 0`),
        db
          .select({ createdAt: securityEvents.createdAt })
          .from(securityEvents)
          .orderBy(desc(securityEvents.createdAt))
          .limit(1),
      ]);

      const categoryMap: Record<string, number> = {};
      let eventBlockedTotal = 0;
      for (const row of eventsCategoryRes) {
        categoryMap[row.category] = Number(row.count || 0);
        eventBlockedTotal += Number(row.blockedCount || 0);
      }

      const hourlyRequestSum = hourlyStatsRes.reduce((sum, h) => sum + Number(h.totalRequests || 0), 0);
      const hourlyBlockedSum = hourlyStatsRes.reduce((sum, h) => sum + Number(h.blockedRequests || 0), 0);

      res.json({
        success: true,
        window: windowKey,
        from: from.toISOString(),
        to: to.toISOString(),
        callerIp: extractClientIp(req),
        metrics: {
          totalVisits: Number(visitorStatsRes[0]?.count || 0),
          uniqueVisitors: Number(uniqueVisitorsRes[0]?.count || 0),
          activeVisitors: Number(activeVisitorsRes[0]?.count || 0),
          totalRequests: Math.max(hourlyRequestSum, Number(visitorStatsRes[0]?.count || 0)),
          blockedRequests: Math.max(hourlyBlockedSum, eventBlockedTotal),
          authFailures: categoryMap.AUTH_FAILURE || 0,
          rbacDenied: categoryMap.RBAC_DENIED || 0,
          rateLimitHits: categoryMap.RATE_LIMIT || 0,
          uploadRejections: categoryMap.UPLOAD_REJECTION || 0,
          attackProbes: (categoryMap.ATTACK_PROBE || 0) + (categoryMap.BOT_SCANNER || 0),
          openAlerts: Number(openAlertsRes[0]?.count || 0),
          openIncidents: Number(openIncidentsRes[0]?.count || 0),
          activeBlockedIps: Number(activeBlocksRes[0]?.count || 0),
          suspiciousIpsCount: Number(suspiciousIpsRes[0]?.count || 0),
        },
        hourlyTraffic: hourlyStatsRes,
        categoryBreakdown: eventsCategoryRes.map((c) => ({
          category: c.category,
          count: Number(c.count || 0),
        })),
        topTargetedPaths: topPathsRes.map((p) => ({
          path: p.path,
          count: Number(p.count || 0),
        })),
        lastEventAt: lastEventRes[0]?.createdAt || null,
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to load security summary' });
    }
  });

  // 3. Live Visitor Activity & Device Analytics (Real Database Sessions Only)
  app.get('/api/admin/security/visitors', requireStaffOrAdmin, async (req, res) => {
    setNoStore(res);
    try {
      const { from, to } = resolveDateRange(
        req.query.window as string,
        req.query.from as string,
        req.query.to as string
      );
      const search = sanitizeTelemetryString(req.query.search || '', 80).toLowerCase();
      const limit = Math.min(200, Math.max(10, Number(req.query.limit || 80)));

      if (!db) return res.json({ success: true, visitors: [], sessions: [], deviceBreakdown: [] });

      const rows = await db
        .select()
        .from(securityVisitorLogs)
        .where(and(gte(securityVisitorLogs.createdAt, from), lte(securityVisitorLogs.createdAt, to)))
        .orderBy(desc(securityVisitorLogs.createdAt))
        .limit(limit);

      const filtered = search
        ? rows.filter(
            (v) =>
              v.ipAddress.toLowerCase().includes(search) ||
              (v.path || '').toLowerCase().includes(search) ||
              (v.browser || '').toLowerCase().includes(search) ||
              (v.tab || '').toLowerCase().includes(search)
          )
        : rows;

      // Group active/recent sessions honestly from observed records
      const sessionMap = new Map<string, any>();
      const deviceCounts: Record<string, number> = {};
      const activeCutoffMs = Date.now() - 15 * 60 * 1000;

      for (const row of filtered) {
        const dt = row.deviceType || 'desktop';
        deviceCounts[dt] = (deviceCounts[dt] || 0) + 1;

        const key = row.sessionId || `ip:${row.ipAddress}`;
        const ts = new Date(row.createdAt).getTime();
        const existing = sessionMap.get(key);
        if (!existing) {
          sessionMap.set(key, {
            sessionKey: key,
            ipAddress: row.ipAddress,
            classification: row.isBot ? 'BOT_OR_CRAWLER' : row.userEmail ? 'AUTHENTICATED' : 'HUMAN_SESSION',
            deviceType: dt,
            browser: row.browser,
            os: row.os,
            countryCode: row.countryCode,
            pageViews: 1,
            lastPath: row.path,
            lastTab: row.tab,
            firstSeenAt: row.createdAt,
            lastSeenAt: row.createdAt,
            isActiveNow: ts >= activeCutoffMs,
            botName: row.botName,
          });
        } else {
          existing.pageViews += 1;
          if (ts < new Date(existing.firstSeenAt).getTime()) existing.firstSeenAt = row.createdAt;
          if (ts > new Date(existing.lastSeenAt).getTime()) {
            existing.lastSeenAt = row.createdAt;
            existing.lastPath = row.path;
            existing.lastTab = row.tab;
            existing.isActiveNow = ts >= activeCutoffMs;
          }
        }
      }

      res.json({
        success: true,
        visitors: filtered,
        sessions: Array.from(sessionMap.values()),
        deviceBreakdown: Object.entries(deviceCounts).map(([deviceType, count]) => ({ deviceType, count })),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to load visitors' });
    }
  });

  // 4. Threat Events Stream & Event Resolution
  app.get('/api/admin/security/events', requireStaffOrAdmin, async (req, res) => {
    setNoStore(res);
    try {
      const { from, to } = resolveDateRange(
        req.query.window as string,
        req.query.from as string,
        req.query.to as string
      );
      const category = sanitizeTelemetryString(req.query.category || '', 60);
      const search = sanitizeTelemetryString(req.query.search || '', 80).toLowerCase();
      const limit = Math.min(200, Math.max(10, Number(req.query.limit || 100)));

      if (!db) return res.json({ success: true, events: [] });

      const conditions = [gte(securityEvents.createdAt, from), lte(securityEvents.createdAt, to)];
      if (category && category !== 'ALL') {
        conditions.push(eq(securityEvents.eventCategory, category));
      }

      const rows = await db
        .select()
        .from(securityEvents)
        .where(and(...conditions))
        .orderBy(desc(securityEvents.createdAt))
        .limit(limit);

      const filtered = search
        ? rows.filter(
            (e) =>
              e.ipAddress.toLowerCase().includes(search) ||
              e.path.toLowerCase().includes(search) ||
              e.threatType.toLowerCase().includes(search) ||
              (e.actorEmail || '').toLowerCase().includes(search)
          )
        : rows;

      res.json({ success: true, events: filtered });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to load threat events' });
    }
  });

  app.patch('/api/admin/security/events/:id/resolve', requireAdmin, async (req: AuthRequest, res) => {
    setNoStore(res);
    try {
      if (!db) return res.status(500).json({ error: 'Database unavailable' });
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid event ID' });

      const resolved = req.body?.resolved !== false;
      const [updated] = await db
        .update(securityEvents)
        .set({
          resolved,
          resolvedAt: resolved ? new Date() : null,
          resolvedBy: resolved ? req.dbUser?.email || 'admin' : null,
        })
        .where(eq(securityEvents.id, id))
        .returning();

      if (!updated) return res.status(404).json({ error: 'Event not found' });

      await recordSecurityAudit({
        actorEmail: req.dbUser?.email,
        actorRole: req.dbUser?.role,
        action: resolved ? 'RESOLVE_SECURITY_EVENT' : 'REOPEN_SECURITY_EVENT',
        targetType: 'security_event',
        targetId: String(id),
        ipAddress: extractClientIp(req),
      });

      res.json({ success: true, event: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to update event' });
    }
  });

  // 5. Security Alerts Workflow
  app.get('/api/admin/security/alerts', requireStaffOrAdmin, async (_req, res) => {
    setNoStore(res);
    try {
      if (!db) return res.json({ success: true, alerts: [] });
      const alerts = await db.select().from(securityAlerts).orderBy(desc(securityAlerts.createdAt)).limit(100);
      res.json({ success: true, alerts });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to load alerts' });
    }
  });

  app.patch('/api/admin/security/alerts/:id', requireAdmin, async (req: AuthRequest, res) => {
    setNoStore(res);
    try {
      if (!db) return res.status(500).json({ error: 'Database unavailable' });
      const id = Number(req.params.id);
      const status = String(req.body?.status || '').toUpperCase();
      if (!['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'DISMISSED'].includes(status)) {
        return res.status(400).json({ error: 'Invalid status. Use OPEN, ACKNOWLEDGED, RESOLVED, or DISMISSED.' });
      }

      const now = new Date();
      const [updated] = await db
        .update(securityAlerts)
        .set({
          status,
          ...(status === 'ACKNOWLEDGED' ? { acknowledgedBy: req.dbUser?.email || 'admin', acknowledgedAt: now } : {}),
          ...(status === 'RESOLVED' || status === 'DISMISSED'
            ? { resolvedBy: req.dbUser?.email || 'admin', resolvedAt: now }
            : {}),
        })
        .where(eq(securityAlerts.id, id))
        .returning();

      if (!updated) return res.status(404).json({ error: 'Alert not found' });

      await recordSecurityAudit({
        actorEmail: req.dbUser?.email,
        actorRole: req.dbUser?.role,
        action: `ALERT_${status}`,
        targetType: 'security_alert',
        targetId: String(id),
        ipAddress: extractClientIp(req),
      });

      res.json({ success: true, alert: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to update alert' });
    }
  });

  // 6. IP & Network Intelligence (RDAP Live Registry Lookup + Historical Supporting Evidence)
  app.get('/api/admin/security/ip-intelligence', requireStaffOrAdmin, async (_req, res) => {
    setNoStore(res);
    try {
      if (!db) return res.json({ success: true, records: [] });
      const records = await db
        .select()
        .from(securityIpIntelligence)
        .orderBy(desc(securityIpIntelligence.threatHits), desc(securityIpIntelligence.lastSeenAt))
        .limit(100);
      res.json({ success: true, records });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to load IP intelligence' });
    }
  });

  app.post('/api/admin/security/ip-intelligence/lookup', requireStaffOrAdmin, async (req: AuthRequest, res) => {
    setNoStore(res);
    try {
      const ipAddress = sanitizeTelemetryString(req.body?.ipAddress || req.body?.ip || '', 64);
      if (!ipAddress) return res.status(400).json({ error: 'ipAddress is required' });

      const intel = await enrichIpIntelligence(ipAddress, Boolean(req.body?.forceRefresh));
      const supportingEvents = db
        ? await db
            .select()
            .from(securityEvents)
            .where(eq(securityEvents.ipAddress, ipAddress))
            .orderBy(desc(securityEvents.createdAt))
            .limit(20)
        : [];

      await recordSecurityAudit({
        actorEmail: req.dbUser?.email,
        actorRole: req.dbUser?.role,
        action: 'IP_INTELLIGENCE_LOOKUP',
        targetType: 'ip_address',
        targetId: ipAddress,
        ipAddress: extractClientIp(req),
      });

      res.json({ success: true, intelligence: intel, supportingEvents });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'IP inspection failed' });
    }
  });

  // 7. IP Blocking & Unblocking (With Self-Lockout Protection & Expiration Support)
  app.get('/api/admin/security/blocked-ips', requireStaffOrAdmin, async (_req, res) => {
    setNoStore(res);
    try {
      if (!db) return res.json({ success: true, blockedIps: [] });
      const blockedIps = await db
        .select()
        .from(securityBlockedIps)
        .orderBy(desc(securityBlockedIps.isActive), desc(securityBlockedIps.createdAt))
        .limit(100);
      res.json({ success: true, blockedIps });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to fetch blocklist' });
    }
  });

  app.post('/api/admin/security/block-ip', requireAdmin, async (req: AuthRequest, res) => {
    setNoStore(res);
    try {
      if (!db) return res.status(500).json({ error: 'Database unavailable' });
      const ipAddress = sanitizeTelemetryString(req.body?.ipAddress || req.body?.ip || '', 64);
      const reason = sanitizeTelemetryString(req.body?.reason || 'Manual administrative block', 260);
      const severity = sanitizeTelemetryString(req.body?.severity || 'HIGH', 16).toUpperCase();
      const expiresInMinutes = req.body?.expiresInMinutes ? Number(req.body.expiresInMinutes) : null;

      if (!ipAddress) return res.status(400).json({ error: 'IP address is required' });

      const callerIp = extractClientIp(req);
      if (ipAddress === callerIp || isPrivateOrLoopbackIp(ipAddress) || getAllowlistedIps().includes(ipAddress)) {
        return res.status(400).json({
          success: false,
          error:
            'Self-lockout protection: Loopback, private network, allowlisted, or your own active administrator IP cannot be blocked.',
        });
      }

      const expiresAt =
        expiresInMinutes && Number.isFinite(expiresInMinutes) && expiresInMinutes > 0
          ? new Date(Date.now() + expiresInMinutes * 60_000)
          : null;

      const [record] = await db
        .insert(securityBlockedIps)
        .values({
          ipAddress,
          reason,
          severity,
          source: 'MANUAL',
          blockedBy: req.dbUser?.email || 'admin',
          expiresAt,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: securityBlockedIps.ipAddress,
          set: {
            reason,
            severity,
            source: 'MANUAL',
            blockedBy: req.dbUser?.email || 'admin',
            expiresAt,
            isActive: true,
            unblockedAt: null,
            unblockedBy: null,
          },
        })
        .returning();

      invalidateSecurityCaches();

      await recordSecurityAudit({
        actorEmail: req.dbUser?.email,
        actorRole: req.dbUser?.role,
        action: 'BLOCK_IP_ADDRESS',
        targetType: 'blocked_ip',
        targetId: ipAddress,
        ipAddress: callerIp,
        details: { reason, expiresAt },
      });

      res.json({ success: true, blockedIp: record });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to block IP' });
    }
  });

  app.post('/api/admin/security/unblock-ip/:id', requireAdmin, async (req: AuthRequest, res) => {
    setNoStore(res);
    try {
      if (!db) return res.status(500).json({ error: 'Database unavailable' });
      const id = Number(req.params.id);
      if (!Number.isFinite(id)) return res.status(400).json({ error: 'Invalid ID' });

      const [updated] = await db
        .update(securityBlockedIps)
        .set({
          isActive: false,
          unblockedAt: new Date(),
          unblockedBy: req.dbUser?.email || 'admin',
        })
        .where(eq(securityBlockedIps.id, id))
        .returning();

      if (!updated) return res.status(404).json({ error: 'Blocked IP entry not found' });

      invalidateSecurityCaches();

      await recordSecurityAudit({
        actorEmail: req.dbUser?.email,
        actorRole: req.dbUser?.role,
        action: 'UNBLOCK_IP_ADDRESS',
        targetType: 'blocked_ip',
        targetId: updated.ipAddress,
        ipAddress: extractClientIp(req),
      });

      res.json({ success: true, unblockedIp: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to unblock IP' });
    }
  });

  // 8. Incident Response & Forensic Export (JSON / CSV)
  app.get('/api/admin/security/incidents', requireStaffOrAdmin, async (_req, res) => {
    setNoStore(res);
    try {
      if (!db) return res.json({ success: true, incidents: [] });
      const incidents = await db.select().from(securityIncidents).orderBy(desc(securityIncidents.createdAt)).limit(100);
      res.json({ success: true, incidents });
    } catch (err: any) {
      const detail = err?.cause?.message || err?.message || 'Failed to fetch incidents';
      console.error('[SECURITY_INCIDENTS_GET_ERROR]', detail);
      res.status(500).json({ success: false, error: detail });
    }
  });

  app.post('/api/admin/security/incidents', requireAdmin, async (req: AuthRequest, res) => {
    setNoStore(res);
    try {
      if (!db) return res.status(500).json({ error: 'Database unavailable' });
      const title = sanitizeTelemetryString(req.body?.title || '', 180);
      const category = sanitizeTelemetryString(req.body?.category || 'INVESTIGATION', 60);
      const severity = sanitizeTelemetryString(req.body?.severity || 'HIGH', 20).toUpperCase();
      if (!title) return res.status(400).json({ error: 'Incident title is required' });

      const incidentCode = `INC-${new Date().getFullYear()}-${String(Date.now()).slice(-6)}`;
      const timelineEntry = {
        at: new Date().toISOString(),
        by: req.dbUser?.email || 'admin',
        action: 'INCIDENT_CREATED',
        note: sanitizeTelemetryString(req.body?.rootCause || 'Incident logged from Security Operations Center.', 300),
      };

      const [created] = await db
        .insert(securityIncidents)
        .values({
          incidentCode,
          title,
          severity,
          status: 'INVESTIGATING',
          category,
          affectedIp: req.body?.affectedIp ? sanitizeTelemetryString(req.body.affectedIp, 64) : null,
          affectedUserEmail: req.body?.affectedUserEmail ? sanitizeTelemetryString(req.body.affectedUserEmail, 120) : null,
          rootCause: req.body?.rootCause ? sanitizeTelemetryString(req.body.rootCause, 500) : null,
          containmentActions: req.body?.containmentActions ? sanitizeTelemetryString(req.body.containmentActions, 500) : null,
          timelineJson: [timelineEntry],
          createdBy: req.dbUser?.email || 'admin',
        })
        .returning();

      await recordSecurityAudit({
        actorEmail: req.dbUser?.email,
        actorRole: req.dbUser?.role,
        action: 'CREATE_INCIDENT',
        targetType: 'security_incident',
        targetId: incidentCode,
        ipAddress: extractClientIp(req),
      });

      res.status(201).json({ success: true, incident: created });
    } catch (err: any) {
      const detail = err?.cause?.message || err?.message || 'Failed to create incident';
      console.error('[SECURITY_INCIDENTS_POST_ERROR]', detail);
      res.status(500).json({ success: false, error: detail });
    }
  });

  app.patch('/api/admin/security/incidents/:id', requireAdmin, async (req: AuthRequest, res) => {
    setNoStore(res);
    try {
      if (!db) return res.status(500).json({ error: 'Database unavailable' });
      const id = Number(req.params.id);
      const existingRows = await db.select().from(securityIncidents).where(eq(securityIncidents.id, id)).limit(1);
      if (!existingRows[0]) return res.status(404).json({ error: 'Incident not found' });

      const existing = existingRows[0];
      const nextStatus = req.body?.status ? String(req.body.status).toUpperCase() : existing.status;
      if (!['INVESTIGATING', 'CONTAINED', 'MITIGATED', 'CLOSED'].includes(nextStatus)) {
        return res.status(400).json({ error: 'Invalid incident status' });
      }

      const prevTimeline = Array.isArray(existing.timelineJson) ? existing.timelineJson : [];
      const newNote = sanitizeTelemetryString(req.body?.note || `Updated status to ${nextStatus}`, 300);
      const nextTimeline = [
        ...prevTimeline,
        {
          at: new Date().toISOString(),
          by: req.dbUser?.email || 'admin',
          action: `STATUS_${nextStatus}`,
          note: newNote,
        },
      ];

      const [updated] = await db
        .update(securityIncidents)
        .set({
          status: nextStatus,
          rootCause:
            req.body?.rootCause !== undefined
              ? sanitizeTelemetryString(req.body.rootCause, 600)
              : existing.rootCause,
          containmentActions:
            req.body?.containmentActions !== undefined
              ? sanitizeTelemetryString(req.body.containmentActions, 600)
              : existing.containmentActions,
          timelineJson: nextTimeline,
          closedAt: nextStatus === 'CLOSED' ? new Date() : existing.closedAt,
          updatedAt: new Date(),
        })
        .where(eq(securityIncidents.id, id))
        .returning();

      await recordSecurityAudit({
        actorEmail: req.dbUser?.email,
        actorRole: req.dbUser?.role,
        action: 'UPDATE_INCIDENT',
        targetType: 'security_incident',
        targetId: updated.incidentCode,
        ipAddress: extractClientIp(req),
        details: { status: nextStatus },
      });

      res.json({ success: true, incident: updated });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to update incident' });
    }
  });

  app.get('/api/admin/security/incidents/:id/export', requireStaffOrAdmin, async (req: AuthRequest, res) => {
    setNoStore(res);
    try {
      if (!db) return res.status(500).json({ error: 'Database unavailable' });
      const id = Number(req.params.id);
      const format = String(req.query.format || 'json').toLowerCase();
      const rows = await db.select().from(securityIncidents).where(eq(securityIncidents.id, id)).limit(1);
      if (!rows[0]) return res.status(404).json({ error: 'Incident not found' });

      const inc = rows[0];
      const relatedEvents = inc.affectedIp
        ? await db
            .select()
            .from(securityEvents)
            .where(eq(securityEvents.ipAddress, inc.affectedIp))
            .orderBy(desc(securityEvents.createdAt))
            .limit(50)
        : [];

      await recordSecurityAudit({
        actorEmail: req.dbUser?.email,
        actorRole: req.dbUser?.role,
        action: `EXPORT_INCIDENT_${format.toUpperCase()}`,
        targetType: 'security_incident',
        targetId: inc.incidentCode,
        ipAddress: extractClientIp(req),
      });

      if (format === 'csv') {
        const headers = ['IncidentCode', 'Title', 'Severity', 'Status', 'Category', 'AffectedIP', 'RootCause', 'ContainmentActions', 'CreatedAt'];
        const row = [
          inc.incidentCode,
          inc.title,
          inc.severity,
          inc.status,
          inc.category,
          inc.affectedIp || '',
          inc.rootCause || '',
          inc.containmentActions || '',
          new Date(inc.createdAt).toISOString(),
        ];
        const csvLines = [headers.map(escapeCsvCell).join(','), row.map(escapeCsvCell).join(',')];
        if (relatedEvents.length > 0) {
          csvLines.push('');
          csvLines.push(['EventID', 'Category', 'ThreatType', 'Method', 'Path', 'HttpStatus', 'Timestamp'].map(escapeCsvCell).join(','));
          for (const ev of relatedEvents) {
            csvLines.push(
              [ev.id, ev.eventCategory, ev.threatType, ev.method, ev.path, ev.httpStatus, new Date(ev.createdAt).toISOString()]
                .map(escapeCsvCell)
                .join(',')
            );
          }
        }
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${inc.incidentCode}.csv"`);
        return res.send(csvLines.join('\n'));
      }

      res.setHeader('Content-Type', 'application/json; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename="${inc.incidentCode}.json"`);
      return res.json({ exportedAt: new Date().toISOString(), incident: inc, relatedEvents });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to export incident' });
    }
  });

  // 9. SOC Audit Trail
  app.get('/api/admin/security/audit-trail', requireStaffOrAdmin, async (_req, res) => {
    setNoStore(res);
    try {
      if (!db) return res.json({ success: true, logs: [] });
      const logs = await db.select().from(securityAuditTrail).orderBy(desc(securityAuditTrail.createdAt)).limit(150);
      res.json({ success: true, logs });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to load audit trail' });
    }
  });

  // 10. Policies & Admin Preferences Configuration
  app.get('/api/admin/security/config', requireStaffOrAdmin, async (req: AuthRequest, res) => {
    setNoStore(res);
    try {
      if (!db) return res.json({ success: true, policies: [], preferences: null });
      const email = req.dbUser?.email || 'kreboya603@gmail.com';
      const [policies, prefs] = await Promise.all([
        db.select().from(securityAlertPolicies).orderBy(securityAlertPolicies.id),
        db.select().from(securityAdminPreferences).where(eq(securityAdminPreferences.adminEmail, email)).limit(1),
      ]);
      res.json({
        success: true,
        policies,
        preferences: prefs[0] || {
          adminEmail: email,
          defaultTimeWindow: '7d',
          autoRefreshSeconds: 30,
          emailNotificationsEnabled: true,
          alertRecipientEmail: 'kreboya603@gmail.com',
          soundAlertEnabled: false,
          preferencesJson: { allowlistedIps: ['127.0.0.1', '::1'] },
        },
        callerIp: extractClientIp(req),
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to load security config' });
    }
  });

  app.put('/api/admin/security/config', requireAdmin, async (req: AuthRequest, res) => {
    setNoStore(res);
    try {
      if (!db) return res.status(500).json({ error: 'Database unavailable' });
      const adminEmail = req.dbUser?.email || 'kreboya603@gmail.com';

      if (Array.isArray(req.body?.policies)) {
        for (const p of req.body.policies) {
          if (!p?.policyKey) continue;
          await db
            .update(securityAlertPolicies)
            .set({
              enabled: Boolean(p.enabled),
              thresholdCount: Math.max(1, Math.min(2000, Number(p.thresholdCount || 5))),
              windowSeconds: Math.max(10, Math.min(86400, Number(p.windowSeconds || 300))),
              autoBlockIp: Boolean(p.autoBlockIp),
              autoBlockMinutes: Math.max(5, Math.min(10080, Number(p.autoBlockMinutes || 60))),
              notifyEmail: Boolean(p.notifyEmail),
              updatedBy: adminEmail,
              updatedAt: new Date(),
            })
            .where(eq(securityAlertPolicies.policyKey, String(p.policyKey)));
        }
      }

      if (req.body?.preferences) {
        const pref = req.body.preferences;
        const rawAllowlist = Array.isArray(pref.allowlistedIps)
          ? pref.allowlistedIps.map((x: any) => sanitizeTelemetryString(x, 64)).filter(Boolean)
          : ['127.0.0.1', '::1'];
        await db
          .insert(securityAdminPreferences)
          .values({
            adminEmail,
            defaultTimeWindow: sanitizeTelemetryString(pref.defaultTimeWindow || '7d', 16),
            autoRefreshSeconds: Math.max(10, Math.min(300, Number(pref.autoRefreshSeconds || 30))),
            emailNotificationsEnabled: Boolean(pref.emailNotificationsEnabled),
            alertRecipientEmail: sanitizeTelemetryString(pref.alertRecipientEmail || 'kreboya603@gmail.com', 120),
            soundAlertEnabled: Boolean(pref.soundAlertEnabled),
            preferencesJson: { allowlistedIps: Array.from(new Set(['127.0.0.1', '::1', ...rawAllowlist])) },
            updatedAt: new Date(),
          })
          .onConflictDoUpdate({
            target: securityAdminPreferences.adminEmail,
            set: {
              defaultTimeWindow: sanitizeTelemetryString(pref.defaultTimeWindow || '7d', 16),
              autoRefreshSeconds: Math.max(10, Math.min(300, Number(pref.autoRefreshSeconds || 30))),
              emailNotificationsEnabled: Boolean(pref.emailNotificationsEnabled),
              alertRecipientEmail: sanitizeTelemetryString(pref.alertRecipientEmail || 'kreboya603@gmail.com', 120),
              soundAlertEnabled: Boolean(pref.soundAlertEnabled),
              preferencesJson: { allowlistedIps: Array.from(new Set(['127.0.0.1', '::1', ...rawAllowlist])) },
              updatedAt: new Date(),
            },
          });
      }

      invalidateSecurityCaches();

      await recordSecurityAudit({
        actorEmail: adminEmail,
        actorRole: req.dbUser?.role,
        action: 'UPDATE_SECURITY_CONFIGURATION',
        targetType: 'security_config',
        targetId: adminEmail,
        ipAddress: extractClientIp(req),
      });

      res.json({ success: true, message: 'Security configuration updated in Neon PostgreSQL.' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to update configuration' });
    }
  });
}
