import type { Request, Response, NextFunction } from 'express';
import { db } from '../db/index.ts';
import {
  securityEvents,
  securityVisitorLogs,
  securityIpIntelligence,
  securityBlockedIps,
  securityAlerts,
  securityTrafficStatsHourly,
  securityAlertPolicies,
  securityAuditTrail,
  securityAdminPreferences,
} from '../db/schema.ts';
import { and, desc, eq, gte, sql } from 'drizzle-orm';
import { sendNotificationEmail, SMTP_CANONICAL_USER } from './mailService.ts';

const CONTROL_CHARS_RE = /[\u0000-\u001f\u007f]/g;
const SENSITIVE_PARAM_RE = /([?&](?:token|access_token|id_token|password|passwd|secret|api_key|apikey|key|auth|authorization|cookie)=)([^&\s]+)/gi;

export function sanitizeTelemetryString(input: unknown, maxLen = 400): string {
  if (input === null || input === undefined) return '';
  const cleaned = String(input)
    .replace(CONTROL_CHARS_RE, ' ')
    .replace(SENSITIVE_PARAM_RE, '$1[REDACTED]')
    .trim();
  return cleaned.length > maxLen ? `${cleaned.slice(0, maxLen)}…` : cleaned;
}

export function extractClientIp(req: Request): string {
  const candidates = [
    req.headers['x-nf-client-connection-ip'],
    req.headers['cf-connecting-ip'],
    typeof req.headers['x-forwarded-for'] === 'string'
      ? req.headers['x-forwarded-for'].split(',')[0]
      : undefined,
    req.headers['x-real-ip'],
    req.ip,
    req.socket?.remoteAddress,
  ];

  for (const raw of candidates) {
    if (typeof raw !== 'string') continue;
    let ip = raw.trim();
    if (!ip) continue;
    if (ip.startsWith('::ffff:')) ip = ip.slice(7);
    if (ip === '::1') return '::1';
    // Strip port if IPv4:port
    const ipv4PortMatch = ip.match(/^(\d{1,3}(?:\.\d{1,3}){3}):\d+$/);
    if (ipv4PortMatch) ip = ipv4PortMatch[1];
    return sanitizeTelemetryString(ip, 64) || 'unknown';
  }

  return 'unknown';
}

export function isPrivateOrLoopbackIp(ip: string): boolean {
  const val = (ip || '').trim().toLowerCase();
  if (!val || val === 'unknown' || val === 'localhost' || val === '::1' || val === '127.0.0.1') {
    return true;
  }
  if (val.startsWith('127.') || val.startsWith('10.') || val.startsWith('192.168.') || val.startsWith('0.')) {
    return true;
  }
  if (val.startsWith('172.')) {
    const second = Number(val.split('.')[1]);
    if (!Number.isNaN(second) && second >= 16 && second <= 31) return true;
  }
  if (val.startsWith('fc') || val.startsWith('fd') || val.startsWith('fe80:')) {
    return true;
  }
  return false;
}

export function parseUserAgentDetails(userAgentRaw?: string | null): {
  deviceType: string;
  browser: string;
  os: string;
  isBot: boolean;
  botName: string | null;
} {
  const ua = sanitizeTelemetryString(userAgentRaw || '', 450);
  const lower = ua.toLowerCase();

  // Known security scanners & search crawlers (truthful detection only)
  const botSignatures: Array<[RegExp, string]> = [
    [/sqlmap/i, 'sqlmap (Scanner)'],
    [/nikto/i, 'Nikto (Scanner)'],
    [/nessus/i, 'Nessus (Scanner)'],
    [/acunetix/i, 'Acunetix (Scanner)'],
    [/nuclei/i, 'Nuclei (Scanner)'],
    [/wpscan/i, 'WPScan (Scanner)'],
    [/gobuster|dirbuster|masscan|zgrab|nmap/i, 'Automated Security Probe'],
    [/googlebot/i, 'Googlebot'],
    [/bingbot/i, 'Bingbot'],
    [/gptbot/i, 'GPTBot'],
    [/claudebot/i, 'ClaudeBot'],
    [/perplexitybot/i, 'PerplexityBot'],
    [/facebookexternalhit|meta-externalagent/i, 'Meta Crawler'],
    [/curl\//i, 'curl CLI'],
    [/python-requests|aiohttp|httpx/i, 'Python HTTP Client'],
    [/headlesschrome|lighthouse/i, 'Headless / Lighthouse'],
  ];

  let isBot = false;
  let botName: string | null = null;
  for (const [pattern, label] of botSignatures) {
    if (pattern.test(ua)) {
      isBot = true;
      botName = label;
      break;
    }
  }
  if (!isBot && /\bbot\b|\bcrawler\b|\bspider\b/i.test(lower)) {
    isBot = true;
    botName = 'Automated Crawler';
  }

  let deviceType = 'desktop';
  if (isBot) deviceType = 'bot';
  else if (/ipad|tablet|playbook|silk/i.test(ua)) deviceType = 'tablet';
  else if (/mobile|iphone|ipod|android.*mobile|blackberry|opera mini/i.test(lower)) deviceType = 'mobile';

  let browser = 'Unknown';
  if (botName) browser = botName;
  else if (/edg\//i.test(ua)) browser = 'Microsoft Edge';
  else if (/opr\//i.test(ua) || /opera/i.test(ua)) browser = 'Opera';
  else if (/chrome\//i.test(ua) && !/chromium/i.test(ua)) browser = 'Google Chrome';
  else if (/firefox\//i.test(ua)) browser = 'Mozilla Firefox';
  else if (/safari\//i.test(ua) && !/chrome/i.test(ua)) browser = 'Apple Safari';

  let os = 'Unknown';
  if (/windows nt/i.test(ua)) os = 'Windows';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/mac os x|macintosh/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  return { deviceType, browser, os, isBot, botName };
}

function currentUtcBucketHour(date = new Date()): string {
  const iso = date.toISOString();
  return `${iso.slice(0, 13)}:00:00Z`;
}

async function incrementHourlyStats(fields: {
  totalRequests?: number;
  visitorViews?: number;
  botRequests?: number;
  blockedRequests?: number;
  authFailures?: number;
  threatEvents?: number;
}): Promise<void> {
  if (!db) return;
  const bucketHour = currentUtcBucketHour();
  try {
    await db
      .insert(securityTrafficStatsHourly)
      .values({
        bucketHour,
        totalRequests: fields.totalRequests || 0,
        visitorViews: fields.visitorViews || 0,
        botRequests: fields.botRequests || 0,
        blockedRequests: fields.blockedRequests || 0,
        authFailures: fields.authFailures || 0,
        threatEvents: fields.threatEvents || 0,
        uniqueIps: 0,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: securityTrafficStatsHourly.bucketHour,
        set: {
          totalRequests: sql`${securityTrafficStatsHourly.totalRequests} + ${fields.totalRequests || 0}`,
          visitorViews: sql`${securityTrafficStatsHourly.visitorViews} + ${fields.visitorViews || 0}`,
          botRequests: sql`${securityTrafficStatsHourly.botRequests} + ${fields.botRequests || 0}`,
          blockedRequests: sql`${securityTrafficStatsHourly.blockedRequests} + ${fields.blockedRequests || 0}`,
          authFailures: sql`${securityTrafficStatsHourly.authFailures} + ${fields.authFailures || 0}`,
          threatEvents: sql`${securityTrafficStatsHourly.threatEvents} + ${fields.threatEvents || 0}`,
          updatedAt: new Date(),
        },
      });
  } catch {
    // Non-blocking telemetry
  }
}

async function upsertIpSeenStats(ipAddress: string, isThreat: boolean): Promise<void> {
  if (!db || !ipAddress || ipAddress === 'unknown') return;
  const rdapDefault = isPrivateOrLoopbackIp(ipAddress) ? 'PRIVATE_OR_LOOPBACK' : 'PENDING';
  try {
    await db
      .insert(securityIpIntelligence)
      .values({
        ipAddress,
        rdapStatus: rdapDefault,
        totalRequests: 1,
        threatHits: isThreat ? 1 : 0,
        lastSeenAt: new Date(),
      })
      .onConflictDoUpdate({
        target: securityIpIntelligence.ipAddress,
        set: {
          totalRequests: sql`${securityIpIntelligence.totalRequests} + 1`,
          threatHits: sql`${securityIpIntelligence.threatHits} + ${isThreat ? 1 : 0}`,
          lastSeenAt: new Date(),
        },
      });
  } catch {
    // Non-blocking
  }
}

export async function enrichIpIntelligence(ipAddress: string, forceRefresh = false): Promise<any> {
  const cleanIp = sanitizeTelemetryString(ipAddress, 64);
  if (!cleanIp || cleanIp === 'unknown') {
    throw new Error('Valid IP address is required for inspection.');
  }

  if (isPrivateOrLoopbackIp(cleanIp)) {
    const summary = {
      note: 'Private RFC1918 or Loopback address; external public RDAP lookup is not applicable.',
      scope: 'LOCAL_OR_PRIVATE',
    };
    if (db) {
      const [row] = await db
        .insert(securityIpIntelligence)
        .values({
          ipAddress: cleanIp,
          rdapStatus: 'PRIVATE_OR_LOOPBACK',
          networkName: cleanIp === '127.0.0.1' || cleanIp === '::1' ? 'Loopback Interface' : 'Private Network Range',
          whoisSummaryJson: summary,
          lastEnrichedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: securityIpIntelligence.ipAddress,
          set: {
            rdapStatus: 'PRIVATE_OR_LOOPBACK',
            networkName: cleanIp === '127.0.0.1' || cleanIp === '::1' ? 'Loopback Interface' : 'Private Network Range',
            whoisSummaryJson: summary,
            lastEnrichedAt: new Date(),
          },
        })
        .returning();
      return row;
    }
    return { ipAddress: cleanIp, rdapStatus: 'PRIVATE_OR_LOOPBACK', whoisSummaryJson: summary };
  }

  // Return cached resolved entry within 24 hours unless forceRefresh requested
  if (db && !forceRefresh) {
    const existing = await db
      .select()
      .from(securityIpIntelligence)
      .where(eq(securityIpIntelligence.ipAddress, cleanIp))
      .limit(1);
    if (
      existing[0] &&
      existing[0].rdapStatus === 'RESOLVED' &&
      existing[0].lastEnrichedAt &&
      Date.now() - new Date(existing[0].lastEnrichedAt).getTime() < 24 * 60 * 60 * 1000
    ) {
      return existing[0];
    }
  }

  // Query genuine public RDAP registry (rdap.org)
  let rdapStatus = 'FAILED';
  let networkName: string | null = null;
  let cidr: string | null = null;
  let countryCode: string | null = null;
  let asn: string | null = null;
  let asnOrg: string | null = null;
  let abuseEmail: string | null = null;
  let abusePhone: string | null = null;
  let whoisSummaryJson: any = { source: 'https://rdap.org/ip/' };

  try {
    const rdapHeaders = {
      Accept: 'application/rdap+json, application/json',
      'User-Agent': 'MADECC-Security-SOC/1.0 (+https://madeccgroup.online)',
    };
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    let sourceLabel = 'rdap.org';
    let resp = await fetch(`https://rdap.org/ip/${encodeURIComponent(cleanIp)}`, {
      headers: rdapHeaders,
      signal: controller.signal,
    });
    if (resp.status === 403) {
      sourceLabel = 'rdap.arin.net';
      resp = await fetch(`https://rdap.arin.net/registry/ip/${encodeURIComponent(cleanIp)}`, {
        headers: rdapHeaders,
        signal: controller.signal,
      });
    }
    clearTimeout(timeout);

    if (resp.ok) {
      const data: any = await resp.json();
      rdapStatus = 'RESOLVED';
      networkName = sanitizeTelemetryString(data.name || data.handle || '', 120) || null;
      countryCode = sanitizeTelemetryString(data.country || '', 10) || null;
      if (Array.isArray(data.cidr0_cidrs) && data.cidr0_cidrs[0]) {
        const c = data.cidr0_cidrs[0];
        const prefix = c.v4prefix || c.v6prefix;
        if (prefix && c.length !== undefined) cidr = `${prefix}/${c.length}`;
      } else if (data.startAddress && data.endAddress) {
        cidr = `${data.startAddress} - ${data.endAddress}`;
      }

      // Extract entity abuse/org contacts from RDAP entities
      const entities = Array.isArray(data.entities) ? data.entities : [];
      for (const ent of entities) {
        const vcard = Array.isArray(ent?.vcardArray?.[1]) ? ent.vcardArray[1] : [];
        for (const prop of vcard) {
          if (prop[0] === 'fn' && !asnOrg) asnOrg = sanitizeTelemetryString(prop[3], 150);
          if (prop[0] === 'email' && !abuseEmail) abuseEmail = sanitizeTelemetryString(prop[3], 150);
          if (prop[0] === 'tel' && !abusePhone) abusePhone = sanitizeTelemetryString(prop[3], 64);
        }
        if (!asn && typeof ent.handle === 'string' && /^AS\d+/i.test(ent.handle)) {
          asn = ent.handle.toUpperCase();
        }
      }

      whoisSummaryJson = {
        source: sourceLabel,
        handle: data.handle || null,
        name: data.name || null,
        type: data.type || null,
        country: data.country || null,
        startAddress: data.startAddress || null,
        endAddress: data.endAddress || null,
        fetchedAt: new Date().toISOString(),
      };
    } else {
      whoisSummaryJson = { source: sourceLabel, httpStatus: resp.status, fetchedAt: new Date().toISOString() };
    }
  } catch (err: any) {
    whoisSummaryJson = {
      source: 'rdap.org',
      error: sanitizeTelemetryString(err?.message || 'RDAP lookup timed out or unavailable', 200),
      fetchedAt: new Date().toISOString(),
    };
  }

  if (db) {
    const [saved] = await db
      .insert(securityIpIntelligence)
      .values({
        ipAddress: cleanIp,
        rdapStatus,
        networkName,
        cidr,
        countryCode,
        asn,
        asnOrg,
        abuseEmail,
        abusePhone,
        whoisSummaryJson,
        lastEnrichedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: securityIpIntelligence.ipAddress,
        set: {
          rdapStatus,
          networkName,
          cidr,
          countryCode,
          asn,
          asnOrg,
          abuseEmail,
          abusePhone,
          whoisSummaryJson,
          lastEnrichedAt: new Date(),
        },
      })
      .returning();
    return saved;
  }

  return {
    ipAddress: cleanIp,
    rdapStatus,
    networkName,
    cidr,
    countryCode,
    asn,
    asnOrg,
    abuseEmail,
    abusePhone,
    whoisSummaryJson,
  };
}

// =========================================================================
// IN-MEMORY CACHES FOR FAST LOW-OVERHEAD REQUEST TELEMETRY & PROTECTION
// =========================================================================
const requestRateWindows = new Map<string, number[]>();
const authRateWindows = new Map<string, number[]>();
let cachedBlockedSet = new Map<string, { expiresAt: number | null }>();
let blockedCacheRefreshedAt = 0;
let cachedAllowlistIps = new Set<string>(['127.0.0.1', '::1']);
let cachedPolicies = new Map<string, any>();
let policyCacheRefreshedAt = 0;
let cachedAdminPrefs: { emailNotificationsEnabled: boolean; alertRecipientEmail: string } = {
  emailNotificationsEnabled: true,
  alertRecipientEmail: SMTP_CANONICAL_USER,
};

async function refreshSecurityCachesIfNeeded(): Promise<void> {
  if (!db) return;
  const now = Date.now();

  if (now - blockedCacheRefreshedAt > 15_000) {
    blockedCacheRefreshedAt = now;
    try {
      const rows = await db
        .select({
          ipAddress: securityBlockedIps.ipAddress,
          expiresAt: securityBlockedIps.expiresAt,
        })
        .from(securityBlockedIps)
        .where(eq(securityBlockedIps.isActive, true));
      const nextMap = new Map<string, { expiresAt: number | null }>();
      for (const r of rows) {
        const expMs = r.expiresAt ? new Date(r.expiresAt).getTime() : null;
        if (!expMs || expMs > now) {
          nextMap.set(r.ipAddress, { expiresAt: expMs });
        }
      }
      cachedBlockedSet = nextMap;
    } catch {
      // Keep prior cache
    }
  }

  if (now - policyCacheRefreshedAt > 30_000) {
    policyCacheRefreshedAt = now;
    try {
      const [policies, prefs] = await Promise.all([
        db.select().from(securityAlertPolicies),
        db.select().from(securityAdminPreferences).limit(1),
      ]);
      const pMap = new Map<string, any>();
      for (const p of policies) pMap.set(p.policyKey, p);
      cachedPolicies = pMap;

      if (prefs[0]) {
        cachedAdminPrefs = {
          emailNotificationsEnabled: prefs[0].emailNotificationsEnabled !== false,
          alertRecipientEmail: prefs[0].alertRecipientEmail || SMTP_CANONICAL_USER,
        };
        const rawList = (prefs[0].preferencesJson as any)?.allowlistedIps;
        if (Array.isArray(rawList)) {
          cachedAllowlistIps = new Set(['127.0.0.1', '::1', ...rawList.map(String)]);
        }
      }
    } catch {
      // Keep prior cache
    }
  }
}

export function invalidateSecurityCaches(): void {
  blockedCacheRefreshedAt = 0;
  policyCacheRefreshedAt = 0;
}

export function getAllowlistedIps(): string[] {
  return Array.from(cachedAllowlistIps);
}

async function evaluateAndRaiseAlert(params: {
  policyKey: string;
  alertType: string;
  title: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  ipAddress: string;
  path: string;
  summary: string;
  evidence?: Record<string, any>;
}): Promise<void> {
  if (!db) return;
  try {
    const policy = cachedPolicies.get(params.policyKey);
    if (policy && policy.enabled === false) return;

    const threshold = Number(policy?.thresholdCount || 3);
    const windowSec = Number(policy?.windowSeconds || 300);
    const cutoff = new Date(Date.now() - windowSec * 1000);

    // Check existing open/acknowledged alert for duplicate suppression within active window
    const existingOpen = await db
      .select()
      .from(securityAlerts)
      .where(
        and(
          eq(securityAlerts.alertType, params.alertType),
          eq(securityAlerts.ipAddress, params.ipAddress),
          gte(securityAlerts.createdAt, cutoff)
        )
      )
      .orderBy(desc(securityAlerts.createdAt))
      .limit(1);

    if (existingOpen[0] && existingOpen[0].status !== 'RESOLVED' && existingOpen[0].status !== 'DISMISSED') {
      await db
        .update(securityAlerts)
        .set({
          eventCount: sql`${securityAlerts.eventCount} + 1`,
          path: sanitizeTelemetryString(params.path, 200),
          summary: sanitizeTelemetryString(params.summary, 400),
        })
        .where(eq(securityAlerts.id, existingOpen[0].id));
      return;
    }

    // Count matching recent events for this IP in window
    const recentCountRows = await db
      .select({ count: sql<number>`count(*)` })
      .from(securityEvents)
      .where(and(eq(securityEvents.ipAddress, params.ipAddress), gte(securityEvents.createdAt, cutoff)));

    const eventCount = Number(recentCountRows[0]?.count || 1);
    if (eventCount < threshold && params.severity !== 'CRITICAL') {
      return;
    }

    let emailNotified = false;
    const shouldNotifyEmail =
      Boolean(policy?.notifyEmail) &&
      cachedAdminPrefs.emailNotificationsEnabled &&
      (params.severity === 'HIGH' || params.severity === 'CRITICAL') &&
      Boolean(process.env.SMTP_PASS || process.env.SMTP_PASSWORD);

    if (shouldNotifyEmail) {
      try {
        const subject = `[MADECC SECURITY ALERT - ${params.severity}] ${params.title}`;
        const bodyText =
          `MADECC GROUP Security & Threat Monitoring Alert\n` +
          `Alert: ${params.title}\n` +
          `Severity: ${params.severity}\n` +
          `Source IP: ${params.ipAddress}\n` +
          `Target Path: ${params.path}\n` +
          `Events in Window: ${eventCount}\n` +
          `Summary: ${params.summary}\n` +
          `Timestamp: ${new Date().toISOString()}`;
        const mailResult = await sendNotificationEmail(subject, bodyText, undefined, {
          to: cachedAdminPrefs.alertRecipientEmail || SMTP_CANONICAL_USER,
        });
        emailNotified = Boolean(mailResult && !(mailResult as any).fallback);
      } catch {
        emailNotified = false;
      }
    }

    await db.insert(securityAlerts).values({
      title: sanitizeTelemetryString(params.title, 180),
      alertType: params.alertType,
      severity: params.severity,
      status: 'OPEN',
      ipAddress: params.ipAddress,
      path: sanitizeTelemetryString(params.path, 200),
      eventCount,
      summary: sanitizeTelemetryString(params.summary, 400),
      evidenceJson: params.evidence || null,
      emailNotified,
    });

    // Optional policy-driven temporary auto-block (strictly protects loopback & allowlist)
    if (
      policy?.autoBlockIp &&
      !isPrivateOrLoopbackIp(params.ipAddress) &&
      !cachedAllowlistIps.has(params.ipAddress)
    ) {
      const minutes = Math.max(5, Number(policy.autoBlockMinutes || 60));
      const expiresAt = new Date(Date.now() + minutes * 60_000);
      await db
        .insert(securityBlockedIps)
        .values({
          ipAddress: params.ipAddress,
          reason: `Auto-blocked by ${policy.name} (${eventCount} events in ${windowSec}s)`,
          severity: params.severity,
          source: 'AUTO_RULE',
          blockedBy: 'security-policy-engine',
          expiresAt,
          isActive: true,
        })
        .onConflictDoUpdate({
          target: securityBlockedIps.ipAddress,
          set: {
            isActive: true,
            expiresAt,
            reason: `Auto-blocked by ${policy.name} (${eventCount} events in ${windowSec}s)`,
            source: 'AUTO_RULE',
            unblockedAt: null,
            unblockedBy: null,
          },
        });
      invalidateSecurityCaches();
    }
  } catch (err) {
    console.warn('[SECURITY_ALERT_EVAL_NOTICE]', (err as any)?.message || err);
  }
}

export async function recordSecurityAudit(params: {
  actorEmail?: string | null;
  actorRole?: string | null;
  action: string;
  targetType: string;
  targetId?: string | null;
  ipAddress?: string | null;
  details?: Record<string, any> | null;
}): Promise<void> {
  if (!db) return;
  try {
    await db.insert(securityAuditTrail).values({
      actorEmail: sanitizeTelemetryString(params.actorEmail || 'system', 120),
      actorRole: sanitizeTelemetryString(params.actorRole || 'system', 60),
      action: sanitizeTelemetryString(params.action, 80),
      targetType: sanitizeTelemetryString(params.targetType, 60),
      targetId: params.targetId ? sanitizeTelemetryString(params.targetId, 120) : null,
      ipAddress: params.ipAddress ? sanitizeTelemetryString(params.ipAddress, 64) : null,
      detailsJson: params.details || null,
    });
  } catch {
    // Non-blocking
  }
}

export async function recordAuthSecurityEvent(
  req: Request,
  opts: {
    eventCategory: 'AUTH_FAILURE' | 'RBAC_DENIED' | 'ADMIN_ACTION';
    threatType: string;
    httpStatus: number;
    reason: string;
    actorEmail?: string | null;
    actorUserId?: string | null;
  }
): Promise<void> {
  if (!db) return;
  await refreshSecurityCachesIfNeeded();

  const ipAddress = extractClientIp(req);
  const userAgent = sanitizeTelemetryString(req.headers['user-agent'] || '', 300);
  const path = sanitizeTelemetryString(req.originalUrl || req.url || '/', 240);

  try {
    await db.insert(securityEvents).values({
      eventCategory: opts.eventCategory,
      severity: opts.eventCategory === 'RBAC_DENIED' ? 'MEDIUM' : 'HIGH',
      threatType: sanitizeTelemetryString(opts.threatType, 80),
      ipAddress,
      userAgent,
      method: sanitizeTelemetryString(req.method || 'POST', 16),
      path,
      httpStatus: opts.httpStatus,
      blocked: opts.httpStatus === 403 || opts.httpStatus === 429,
      actorEmail: opts.actorEmail ? sanitizeTelemetryString(opts.actorEmail, 120) : null,
      actorUserId: opts.actorUserId ? sanitizeTelemetryString(opts.actorUserId, 120) : null,
      detailsJson: { reason: sanitizeTelemetryString(opts.reason, 300) },
    });

    await Promise.all([
      upsertIpSeenStats(ipAddress, true),
      incrementHourlyStats({
        authFailures: opts.eventCategory === 'AUTH_FAILURE' ? 1 : 0,
        threatEvents: 1,
      }),
      evaluateAndRaiseAlert({
        policyKey: opts.eventCategory === 'RBAC_DENIED' ? 'RBAC_ABUSE' : 'AUTH_BRUTE_FORCE',
        alertType: opts.threatType,
        title:
          opts.eventCategory === 'RBAC_DENIED'
            ? `Unauthorized Access Probing (${opts.threatType})`
            : `Authentication Failure Burst (${opts.threatType})`,
        severity: 'HIGH',
        ipAddress,
        path,
        summary: opts.reason,
        evidence: { threatType: opts.threatType, httpStatus: opts.httpStatus },
      }),
    ]);
  } catch {
    // Never break auth flows on telemetry failure
  }
}

export async function recordUploadRejectionEvent(req: Request, err: any): Promise<void> {
  if (!db) return;
  const ipAddress = extractClientIp(req);
  const path = sanitizeTelemetryString(req.originalUrl || '/api/upload', 200);
  const reason = sanitizeTelemetryString(err?.message || 'File upload rejected by validation rules', 260);
  try {
    await db.insert(securityEvents).values({
      eventCategory: 'UPLOAD_REJECTION',
      severity: 'MEDIUM',
      threatType: 'UPLOAD_POLICY_REJECTION',
      ipAddress,
      userAgent: sanitizeTelemetryString(req.headers['user-agent'] || '', 300),
      method: sanitizeTelemetryString(req.method || 'POST', 16),
      path,
      httpStatus: 400,
      blocked: true,
      detailsJson: { reason },
    });
    await Promise.all([
      upsertIpSeenStats(ipAddress, true),
      incrementHourlyStats({ blockedRequests: 1, threatEvents: 1 }),
    ]);
  } catch {
    // Non-blocking
  }
}

export async function recordVisitorPageView(
  req: Request,
  body: {
    path?: string;
    tab?: string;
    referrer?: string;
    sessionId?: string;
    userEmail?: string;
  }
): Promise<void> {
  if (!db) return;
  const ipAddress = extractClientIp(req);
  const uaRaw = req.headers['user-agent'] || '';
  const parsedUa = parseUserAgentDetails(uaRaw);
  const cleanPath = sanitizeTelemetryString(body?.path || '/', 200) || '/';
  const cleanTab = sanitizeTelemetryString(body?.tab || 'home', 80) || 'home';
  const cleanReferrer = sanitizeTelemetryString(body?.referrer || '', 260) || null;
  const cleanSessionId = sanitizeTelemetryString(body?.sessionId || '', 80) || null;

  try {
    await db.insert(securityVisitorLogs).values({
      sessionId: cleanSessionId,
      ipAddress,
      userAgent: sanitizeTelemetryString(uaRaw, 350),
      deviceType: parsedUa.deviceType,
      browser: parsedUa.browser,
      os: parsedUa.os,
      path: cleanPath,
      tab: cleanTab,
      referrer: cleanReferrer,
      isBot: parsedUa.isBot,
      botName: parsedUa.botName,
      userEmail: body?.userEmail ? sanitizeTelemetryString(body.userEmail, 120) : null,
    });
    await Promise.all([
      upsertIpSeenStats(ipAddress, false),
      incrementHourlyStats({ visitorViews: 1, botRequests: parsedUa.isBot ? 1 : 0 }),
    ]);
  } catch {
    // Non-blocking
  }
}

// Suspicious request pattern signatures
const HIDDEN_PROBE_RE = /(\/\.env|\/\.git|\/wp-admin|\/wp-login\.php|\/xmlrpc\.php|\/phpmyadmin|\/\.aws\/|\/etc\/passwd|\/actuator\/env|\/cgi-bin\/)/i;
const SQLI_PROBE_RE = /((\%27|\')\s*(or|and)\s*[\d'\"]+=[\d'\"]+|union\s+(all\s+)?select|sleep\(\d+\)|benchmark\(|information_schema|waitfor\s+delay|;\s*drop\s+table)/i;
const XSS_PROBE_RE = /(<script\b|javascript:|onerror\s*=|onload\s*=|<svg\/onload)/i;
const TRAVERSAL_PROBE_RE = /(\.\.\/|\.\.\\|%2e%2e%2f|%2e%2e\/)/i;

function detectMaliciousRequestSignature(req: Request, parsedUa: ReturnType<typeof parseUserAgentDetails>): {
  category: 'ATTACK_PROBE' | 'BOT_SCANNER';
  threatType: string;
  severity: 'MEDIUM' | 'HIGH' | 'CRITICAL';
  reason: string;
} | null {
  const rawUrl = req.originalUrl || req.url || '/';
  let decodedUrl = rawUrl;
  try {
    decodedUrl = decodeURIComponent(rawUrl);
  } catch {
    // Keep raw
  }

  if (parsedUa.botName && parsedUa.botName.includes('Scanner')) {
    return {
      category: 'BOT_SCANNER',
      threatType: 'SECURITY_SCANNER_UA',
      severity: 'HIGH',
      reason: `Automated vulnerability scanner User-Agent detected: ${parsedUa.botName}`,
    };
  }
  if (HIDDEN_PROBE_RE.test(decodedUrl)) {
    return {
      category: 'ATTACK_PROBE',
      threatType: 'SENSITIVE_FILE_PROBE',
      severity: 'HIGH',
      reason: `Blocked unauthorized probe targeting sensitive configuration path: ${sanitizeTelemetryString(rawUrl, 120)}`,
    };
  }
  if (TRAVERSAL_PROBE_RE.test(rawUrl) || TRAVERSAL_PROBE_RE.test(decodedUrl)) {
    return {
      category: 'ATTACK_PROBE',
      threatType: 'PATH_TRAVERSAL_PROBE',
      severity: 'CRITICAL',
      reason: `Blocked directory traversal pattern in URI: ${sanitizeTelemetryString(rawUrl, 120)}`,
    };
  }
  if (SQLI_PROBE_RE.test(decodedUrl)) {
    return {
      category: 'ATTACK_PROBE',
      threatType: 'SQL_INJECTION_PROBE',
      severity: 'CRITICAL',
      reason: `Blocked SQL injection signature in query/path: ${sanitizeTelemetryString(rawUrl, 120)}`,
    };
  }
  if (XSS_PROBE_RE.test(decodedUrl)) {
    return {
      category: 'ATTACK_PROBE',
      threatType: 'XSS_INJECTION_PROBE',
      severity: 'HIGH',
      reason: `Blocked cross-site scripting signature in request URL: ${sanitizeTelemetryString(rawUrl, 120)}`,
    };
  }
  return null;
}

export function createSecurityGateMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    const path = req.path || req.url || '/';
    const isStaticAsset =
      /\.(js|css|webp|png|jpg|jpeg|svg|ico|woff2?|map|webmanifest|txt|xml)$/i.test(path) ||
      path.startsWith('/assets/') ||
      path === '/api/health';

    if (isStaticAsset) {
      return next();
    }

    const ipAddress = extractClientIp(req);
    const parsedUa = parseUserAgentDetails(req.headers['user-agent'] || '');

    // Refresh lightweight caches asynchronously
    void refreshSecurityCachesIfNeeded();

    // 1. Check active IP block (loopback & allowlisted IPs are protected against self-lockout)
    const blockEntry = cachedBlockedSet.get(ipAddress);
    if (
      blockEntry &&
      !isPrivateOrLoopbackIp(ipAddress) &&
      !cachedAllowlistIps.has(ipAddress) &&
      (!blockEntry.expiresAt || blockEntry.expiresAt > Date.now())
    ) {
      void Promise.allSettled([
        db
          ? db
              .update(securityBlockedIps)
              .set({
                hitCount: sql`${securityBlockedIps.hitCount} + 1`,
                lastBlockedAt: new Date(),
              })
              .where(eq(securityBlockedIps.ipAddress, ipAddress))
          : Promise.resolve(),
        incrementHourlyStats({ totalRequests: 1, blockedRequests: 1 }),
      ]);
      return res.status(403).json({
        success: false,
        error: 'ACCESS_BLOCKED',
        message: 'Access from this IP address has been temporarily suspended by security policy.',
      });
    }

    // 2. Inspect for exploit/injection/scanner signatures
    const signature = detectMaliciousRequestSignature(req, parsedUa);
    if (signature) {
      const cleanPath = sanitizeTelemetryString(req.originalUrl || path, 220);
      if (db) {
        void (async () => {
          try {
            await db.insert(securityEvents).values({
              eventCategory: signature.category,
              severity: signature.severity,
              threatType: signature.threatType,
              ipAddress,
              userAgent: sanitizeTelemetryString(req.headers['user-agent'] || '', 300),
              method: sanitizeTelemetryString(req.method || 'GET', 16),
              path: cleanPath,
              httpStatus: 403,
              blocked: true,
              detailsJson: { reason: signature.reason },
            });
            await Promise.all([
              upsertIpSeenStats(ipAddress, true),
              incrementHourlyStats({ totalRequests: 1, blockedRequests: 1, threatEvents: 1 }),
              evaluateAndRaiseAlert({
                policyKey: 'ATTACK_PROBE_BURST',
                alertType: signature.threatType,
                title: `${signature.threatType.replace(/_/g, ' ')} Detected`,
                severity: signature.severity,
                ipAddress,
                path: cleanPath,
                summary: signature.reason,
              }),
            ]);
          } catch {
            // Non-blocking
          }
        })();
      }
      return res.status(403).json({
        success: false,
        error: signature.threatType,
        message: 'Forbidden: Request blocked by MADECC Application Security Policy.',
      });
    }

    // 3. Sliding-window rate limiting on /api routes (excludes /api/security/beacon light throttle)
    if (path.startsWith('/api/') && !path.startsWith('/api/admin/security/')) {
      const now = Date.now();
      const isAuthWrite =
        req.method === 'POST' &&
        (path === '/api/auth/admin-login' ||
          path === '/api/auth/login' ||
          path === '/api/auth/reviewer-login');

      const ratePolicy = cachedPolicies.get('API_RATE_LIMIT');
      const maxApiPerMinute = Math.max(40, Number(ratePolicy?.thresholdCount || 120));
      const windowMs = Math.max(10_000, Number(ratePolicy?.windowSeconds || 60) * 1000);

      if (isAuthWrite) {
        const authTimestamps = (authRateWindows.get(ipAddress) || []).filter((ts) => now - ts < 60_000);
        authTimestamps.push(now);
        authRateWindows.set(ipAddress, authTimestamps);
        if (authTimestamps.length > 20) {
          void recordAuthSecurityEvent(req, {
            eventCategory: 'AUTH_FAILURE',
            threatType: 'AUTH_RATE_LIMIT',
            httpStatus: 429,
            reason: `Exceeded authentication request rate limit (${authTimestamps.length} requests/min)`,
          });
          res.setHeader('Retry-After', '60');
          return res.status(429).json({
            success: false,
            error: 'TOO_MANY_AUTH_REQUESTS',
            message: 'Too many authentication attempts. Please wait 60 seconds and try again.',
          });
        }
      } else if (ratePolicy?.enabled !== false && !cachedAllowlistIps.has(ipAddress)) {
        const hits = (requestRateWindows.get(ipAddress) || []).filter((ts) => now - ts < windowMs);
        hits.push(now);
        requestRateWindows.set(ipAddress, hits);
        if (hits.length > maxApiPerMinute) {
          if (db) {
            void db
              .insert(securityEvents)
              .values({
                eventCategory: 'RATE_LIMIT',
                severity: 'HIGH',
                threatType: 'API_BURST_RATE_LIMIT',
                ipAddress,
                userAgent: sanitizeTelemetryString(req.headers['user-agent'] || '', 300),
                method: req.method,
                path: sanitizeTelemetryString(req.originalUrl || path, 220),
                httpStatus: 429,
                blocked: true,
                detailsJson: { requestsInWindow: hits.length, limit: maxApiPerMinute },
              })
              .catch(() => {});
            void incrementHourlyStats({ totalRequests: 1, blockedRequests: 1, threatEvents: 1 });
          }
          res.setHeader('Retry-After', String(Math.ceil(windowMs / 1000)));
          return res.status(429).json({
            success: false,
            error: 'RATE_LIMIT_EXCEEDED',
            message: 'Too many requests from this IP. Please slow down.',
          });
        }
      }
    }

    // Record lightweight request counter asynchronously without delaying request lifecycle
    if (path.startsWith('/api/')) {
      void incrementHourlyStats({ totalRequests: 1, botRequests: parsedUa.isBot ? 1 : 0 });
    }

    next();
  };
}
