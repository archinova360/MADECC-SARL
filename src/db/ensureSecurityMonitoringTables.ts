import { db } from './index.ts';
import { sql } from 'drizzle-orm';

let securityTablesInitialized = false;

export async function ensureSecurityMonitoringTables(): Promise<void> {
  if (securityTablesInitialized || !db) return;

  try {
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS security_events (
        id SERIAL PRIMARY KEY,
        event_category TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'MEDIUM',
        threat_type TEXT NOT NULL,
        ip_address TEXT NOT NULL,
        user_agent TEXT,
        method TEXT NOT NULL,
        path TEXT NOT NULL,
        query_summary TEXT,
        country_code TEXT,
        country_name TEXT,
        region_name TEXT,
        city TEXT,
        asn_org TEXT,
        http_status INTEGER DEFAULT 403,
        blocked BOOLEAN NOT NULL DEFAULT FALSE,
        actor_user_id TEXT,
        actor_email TEXT,
        details_json JSON,
        resolved BOOLEAN NOT NULL DEFAULT FALSE,
        resolved_at TIMESTAMP,
        resolved_by TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS security_visitor_logs (
        id SERIAL PRIMARY KEY,
        session_id TEXT,
        ip_address TEXT NOT NULL,
        user_agent TEXT,
        device_type TEXT DEFAULT 'desktop',
        browser TEXT DEFAULT 'Unknown',
        os TEXT DEFAULT 'Unknown',
        country_code TEXT,
        country_name TEXT,
        region_name TEXT,
        city TEXT,
        asn_org TEXT,
        path TEXT NOT NULL,
        tab TEXT,
        referrer TEXT,
        is_bot BOOLEAN NOT NULL DEFAULT FALSE,
        bot_name TEXT,
        user_email TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS security_ip_intelligence (
        id SERIAL PRIMARY KEY,
        ip_address TEXT NOT NULL UNIQUE,
        rdap_status TEXT NOT NULL DEFAULT 'PENDING',
        network_name TEXT,
        cidr TEXT,
        country_code TEXT,
        asn TEXT,
        asn_org TEXT,
        abuse_email TEXT,
        abuse_phone TEXT,
        whois_summary_json JSON,
        total_requests INTEGER NOT NULL DEFAULT 0,
        threat_hits INTEGER NOT NULL DEFAULT 0,
        last_seen_at TIMESTAMP NOT NULL DEFAULT NOW(),
        last_enriched_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS security_blocked_ips (
        id SERIAL PRIMARY KEY,
        ip_address TEXT NOT NULL UNIQUE,
        cidr TEXT,
        reason TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'HIGH',
        source TEXT NOT NULL DEFAULT 'MANUAL',
        blocked_by TEXT,
        expires_at TIMESTAMP,
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        hit_count INTEGER NOT NULL DEFAULT 0,
        last_blocked_at TIMESTAMP,
        unblocked_at TIMESTAMP,
        unblocked_by TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS security_alerts (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        alert_type TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'HIGH',
        status TEXT NOT NULL DEFAULT 'OPEN',
        ip_address TEXT,
        path TEXT,
        event_count INTEGER NOT NULL DEFAULT 1,
        summary TEXT NOT NULL,
        evidence_json JSON,
        acknowledged_by TEXT,
        acknowledged_at TIMESTAMP,
        resolved_by TEXT,
        resolved_at TIMESTAMP,
        email_notified BOOLEAN NOT NULL DEFAULT FALSE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS security_incidents (
        id SERIAL PRIMARY KEY,
        incident_code TEXT NOT NULL UNIQUE,
        title TEXT NOT NULL,
        severity TEXT NOT NULL DEFAULT 'HIGH',
        status TEXT NOT NULL DEFAULT 'INVESTIGATING',
        category TEXT NOT NULL,
        affected_ip TEXT,
        affected_user_email TEXT,
        root_cause TEXT,
        containment_actions TEXT,
        timeline_json JSON,
        created_by TEXT,
        closed_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS security_traffic_stats_hourly (
        id SERIAL PRIMARY KEY,
        bucket_hour TEXT NOT NULL UNIQUE,
        total_requests INTEGER NOT NULL DEFAULT 0,
        visitor_views INTEGER NOT NULL DEFAULT 0,
        bot_requests INTEGER NOT NULL DEFAULT 0,
        blocked_requests INTEGER NOT NULL DEFAULT 0,
        auth_failures INTEGER NOT NULL DEFAULT 0,
        threat_events INTEGER NOT NULL DEFAULT 0,
        unique_ips INTEGER NOT NULL DEFAULT 0,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS security_alert_policies (
        id SERIAL PRIMARY KEY,
        policy_key TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        description TEXT NOT NULL,
        enabled BOOLEAN NOT NULL DEFAULT TRUE,
        threshold_count INTEGER NOT NULL DEFAULT 5,
        window_seconds INTEGER NOT NULL DEFAULT 300,
        auto_block_ip BOOLEAN NOT NULL DEFAULT FALSE,
        auto_block_minutes INTEGER NOT NULL DEFAULT 60,
        notify_email BOOLEAN NOT NULL DEFAULT TRUE,
        updated_by TEXT,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS security_audit_trail (
        id SERIAL PRIMARY KEY,
        actor_email TEXT,
        actor_role TEXT,
        action TEXT NOT NULL,
        target_type TEXT NOT NULL,
        target_id TEXT,
        ip_address TEXT,
        details_json JSON,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS security_admin_preferences (
        id SERIAL PRIMARY KEY,
        admin_email TEXT NOT NULL UNIQUE,
        default_time_window TEXT NOT NULL DEFAULT '7d',
        auto_refresh_seconds INTEGER NOT NULL DEFAULT 30,
        email_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE,
        alert_recipient_email TEXT NOT NULL DEFAULT 'kreboya603@gmail.com',
        sound_alert_enabled BOOLEAN NOT NULL DEFAULT FALSE,
        preferences_json JSON,
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON security_events (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_security_events_ip ON security_events (ip_address);
      CREATE INDEX IF NOT EXISTS idx_security_events_category ON security_events (event_category);
      CREATE INDEX IF NOT EXISTS idx_security_visitor_logs_created_at ON security_visitor_logs (created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_security_visitor_logs_session ON security_visitor_logs (session_id);
      CREATE INDEX IF NOT EXISTS idx_security_alerts_status ON security_alerts (status);
      CREATE INDEX IF NOT EXISTS idx_security_blocked_ips_active ON security_blocked_ips (is_active);
    `);

    // Reconcile pre-existing security_* tables from earlier deployments (CREATE TABLE IF NOT EXISTS skips missing columns)
    await db.execute(sql`
      -- security_events
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS event_category TEXT NOT NULL DEFAULT 'ATTACK_PROBE';
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'MEDIUM';
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS threat_type TEXT NOT NULL DEFAULT 'UNKNOWN';
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS ip_address TEXT NOT NULL DEFAULT 'unknown';
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS user_agent TEXT;
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS method TEXT NOT NULL DEFAULT 'GET';
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS path TEXT NOT NULL DEFAULT '/';
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS query_summary TEXT;
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS country_code TEXT;
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS country_name TEXT;
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS region_name TEXT;
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS city TEXT;
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS asn_org TEXT;
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS http_status INTEGER DEFAULT 403;
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS blocked BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS actor_user_id TEXT;
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS actor_email TEXT;
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS details_json JSON;
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS resolved BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS resolved_by TEXT;
      ALTER TABLE security_events ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();

      -- security_visitor_logs
      ALTER TABLE security_visitor_logs ADD COLUMN IF NOT EXISTS session_id TEXT;
      ALTER TABLE security_visitor_logs ADD COLUMN IF NOT EXISTS ip_address TEXT NOT NULL DEFAULT 'unknown';
      ALTER TABLE security_visitor_logs ADD COLUMN IF NOT EXISTS user_agent TEXT;
      ALTER TABLE security_visitor_logs ADD COLUMN IF NOT EXISTS device_type TEXT DEFAULT 'desktop';
      ALTER TABLE security_visitor_logs ADD COLUMN IF NOT EXISTS browser TEXT DEFAULT 'Unknown';
      ALTER TABLE security_visitor_logs ADD COLUMN IF NOT EXISTS os TEXT DEFAULT 'Unknown';
      ALTER TABLE security_visitor_logs ADD COLUMN IF NOT EXISTS country_code TEXT;
      ALTER TABLE security_visitor_logs ADD COLUMN IF NOT EXISTS country_name TEXT;
      ALTER TABLE security_visitor_logs ADD COLUMN IF NOT EXISTS region_name TEXT;
      ALTER TABLE security_visitor_logs ADD COLUMN IF NOT EXISTS city TEXT;
      ALTER TABLE security_visitor_logs ADD COLUMN IF NOT EXISTS asn_org TEXT;
      ALTER TABLE security_visitor_logs ADD COLUMN IF NOT EXISTS path TEXT NOT NULL DEFAULT '/';
      ALTER TABLE security_visitor_logs ADD COLUMN IF NOT EXISTS tab TEXT;
      ALTER TABLE security_visitor_logs ADD COLUMN IF NOT EXISTS referrer TEXT;
      ALTER TABLE security_visitor_logs ADD COLUMN IF NOT EXISTS is_bot BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE security_visitor_logs ADD COLUMN IF NOT EXISTS bot_name TEXT;
      ALTER TABLE security_visitor_logs ADD COLUMN IF NOT EXISTS user_email TEXT;
      ALTER TABLE security_visitor_logs ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();

      -- security_ip_intelligence
      ALTER TABLE security_ip_intelligence ADD COLUMN IF NOT EXISTS rdap_status TEXT NOT NULL DEFAULT 'PENDING';
      ALTER TABLE security_ip_intelligence ADD COLUMN IF NOT EXISTS network_name TEXT;
      ALTER TABLE security_ip_intelligence ADD COLUMN IF NOT EXISTS cidr TEXT;
      ALTER TABLE security_ip_intelligence ADD COLUMN IF NOT EXISTS country_code TEXT;
      ALTER TABLE security_ip_intelligence ADD COLUMN IF NOT EXISTS asn TEXT;
      ALTER TABLE security_ip_intelligence ADD COLUMN IF NOT EXISTS asn_org TEXT;
      ALTER TABLE security_ip_intelligence ADD COLUMN IF NOT EXISTS abuse_email TEXT;
      ALTER TABLE security_ip_intelligence ADD COLUMN IF NOT EXISTS abuse_phone TEXT;
      ALTER TABLE security_ip_intelligence ADD COLUMN IF NOT EXISTS whois_summary_json JSON;
      ALTER TABLE security_ip_intelligence ADD COLUMN IF NOT EXISTS total_requests INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE security_ip_intelligence ADD COLUMN IF NOT EXISTS threat_hits INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE security_ip_intelligence ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMP NOT NULL DEFAULT NOW();
      ALTER TABLE security_ip_intelligence ADD COLUMN IF NOT EXISTS last_enriched_at TIMESTAMP;
      ALTER TABLE security_ip_intelligence ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();

      -- security_blocked_ips
      ALTER TABLE security_blocked_ips ADD COLUMN IF NOT EXISTS cidr TEXT;
      ALTER TABLE security_blocked_ips ADD COLUMN IF NOT EXISTS reason TEXT NOT NULL DEFAULT 'Manual block';
      ALTER TABLE security_blocked_ips ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'HIGH';
      ALTER TABLE security_blocked_ips ADD COLUMN IF NOT EXISTS source TEXT NOT NULL DEFAULT 'MANUAL';
      ALTER TABLE security_blocked_ips ADD COLUMN IF NOT EXISTS blocked_by TEXT;
      ALTER TABLE security_blocked_ips ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP;
      ALTER TABLE security_blocked_ips ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;
      ALTER TABLE security_blocked_ips ADD COLUMN IF NOT EXISTS hit_count INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE security_blocked_ips ADD COLUMN IF NOT EXISTS last_blocked_at TIMESTAMP;
      ALTER TABLE security_blocked_ips ADD COLUMN IF NOT EXISTS unblocked_at TIMESTAMP;
      ALTER TABLE security_blocked_ips ADD COLUMN IF NOT EXISTS unblocked_by TEXT;
      ALTER TABLE security_blocked_ips ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();

      -- security_alerts
      ALTER TABLE security_alerts ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Security Alert';
      ALTER TABLE security_alerts ADD COLUMN IF NOT EXISTS alert_type TEXT NOT NULL DEFAULT 'THREAT_ALERT';
      ALTER TABLE security_alerts ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'HIGH';
      ALTER TABLE security_alerts ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'OPEN';
      ALTER TABLE security_alerts ADD COLUMN IF NOT EXISTS ip_address TEXT;
      ALTER TABLE security_alerts ADD COLUMN IF NOT EXISTS path TEXT;
      ALTER TABLE security_alerts ADD COLUMN IF NOT EXISTS event_count INTEGER NOT NULL DEFAULT 1;
      ALTER TABLE security_alerts ADD COLUMN IF NOT EXISTS summary TEXT NOT NULL DEFAULT '';
      ALTER TABLE security_alerts ADD COLUMN IF NOT EXISTS evidence_json JSON;
      ALTER TABLE security_alerts ADD COLUMN IF NOT EXISTS acknowledged_by TEXT;
      ALTER TABLE security_alerts ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMP;
      ALTER TABLE security_alerts ADD COLUMN IF NOT EXISTS resolved_by TEXT;
      ALTER TABLE security_alerts ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMP;
      ALTER TABLE security_alerts ADD COLUMN IF NOT EXISTS email_notified BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE security_alerts ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();

      -- security_incidents
      ALTER TABLE security_incidents ADD COLUMN IF NOT EXISTS incident_code TEXT;
      ALTER TABLE security_incidents ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT 'Security Incident';
      ALTER TABLE security_incidents ADD COLUMN IF NOT EXISTS severity TEXT NOT NULL DEFAULT 'HIGH';
      ALTER TABLE security_incidents ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'INVESTIGATING';
      ALTER TABLE security_incidents ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'INVESTIGATION';
      ALTER TABLE security_incidents ADD COLUMN IF NOT EXISTS affected_ip TEXT;
      ALTER TABLE security_incidents ADD COLUMN IF NOT EXISTS affected_user_email TEXT;
      ALTER TABLE security_incidents ADD COLUMN IF NOT EXISTS root_cause TEXT;
      ALTER TABLE security_incidents ADD COLUMN IF NOT EXISTS containment_actions TEXT;
      ALTER TABLE security_incidents ADD COLUMN IF NOT EXISTS timeline_json JSON;
      ALTER TABLE security_incidents ADD COLUMN IF NOT EXISTS created_by TEXT;
      ALTER TABLE security_incidents ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP;
      ALTER TABLE security_incidents ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();
      ALTER TABLE security_incidents ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();
      UPDATE security_incidents SET incident_code = 'INC-LEGACY-' || id WHERE incident_code IS NULL OR incident_code = '';
      ALTER TABLE security_incidents ALTER COLUMN incident_code SET NOT NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS idx_security_incidents_code ON security_incidents (incident_code);

      -- security_traffic_stats_hourly
      ALTER TABLE security_traffic_stats_hourly ADD COLUMN IF NOT EXISTS total_requests INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE security_traffic_stats_hourly ADD COLUMN IF NOT EXISTS visitor_views INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE security_traffic_stats_hourly ADD COLUMN IF NOT EXISTS bot_requests INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE security_traffic_stats_hourly ADD COLUMN IF NOT EXISTS blocked_requests INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE security_traffic_stats_hourly ADD COLUMN IF NOT EXISTS auth_failures INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE security_traffic_stats_hourly ADD COLUMN IF NOT EXISTS threat_events INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE security_traffic_stats_hourly ADD COLUMN IF NOT EXISTS unique_ips INTEGER NOT NULL DEFAULT 0;
      ALTER TABLE security_traffic_stats_hourly ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

      -- security_alert_policies
      ALTER TABLE security_alert_policies ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT 'Policy';
      ALTER TABLE security_alert_policies ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
      ALTER TABLE security_alert_policies ADD COLUMN IF NOT EXISTS enabled BOOLEAN NOT NULL DEFAULT TRUE;
      ALTER TABLE security_alert_policies ADD COLUMN IF NOT EXISTS threshold_count INTEGER NOT NULL DEFAULT 5;
      ALTER TABLE security_alert_policies ADD COLUMN IF NOT EXISTS window_seconds INTEGER NOT NULL DEFAULT 300;
      ALTER TABLE security_alert_policies ADD COLUMN IF NOT EXISTS auto_block_ip BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE security_alert_policies ADD COLUMN IF NOT EXISTS auto_block_minutes INTEGER NOT NULL DEFAULT 60;
      ALTER TABLE security_alert_policies ADD COLUMN IF NOT EXISTS notify_email BOOLEAN NOT NULL DEFAULT TRUE;
      ALTER TABLE security_alert_policies ADD COLUMN IF NOT EXISTS updated_by TEXT;
      ALTER TABLE security_alert_policies ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();

      -- security_audit_trail
      ALTER TABLE security_audit_trail ADD COLUMN IF NOT EXISTS actor_email TEXT;
      ALTER TABLE security_audit_trail ADD COLUMN IF NOT EXISTS actor_role TEXT;
      ALTER TABLE security_audit_trail ADD COLUMN IF NOT EXISTS action TEXT NOT NULL DEFAULT 'SECURITY_ACTION';
      ALTER TABLE security_audit_trail ADD COLUMN IF NOT EXISTS target_type TEXT NOT NULL DEFAULT 'system';
      ALTER TABLE security_audit_trail ADD COLUMN IF NOT EXISTS target_id TEXT;
      ALTER TABLE security_audit_trail ADD COLUMN IF NOT EXISTS ip_address TEXT;
      ALTER TABLE security_audit_trail ADD COLUMN IF NOT EXISTS details_json JSON;
      ALTER TABLE security_audit_trail ADD COLUMN IF NOT EXISTS created_at TIMESTAMP NOT NULL DEFAULT NOW();

      -- security_admin_preferences
      ALTER TABLE security_admin_preferences ADD COLUMN IF NOT EXISTS default_time_window TEXT NOT NULL DEFAULT '7d';
      ALTER TABLE security_admin_preferences ADD COLUMN IF NOT EXISTS auto_refresh_seconds INTEGER NOT NULL DEFAULT 30;
      ALTER TABLE security_admin_preferences ADD COLUMN IF NOT EXISTS email_notifications_enabled BOOLEAN NOT NULL DEFAULT TRUE;
      ALTER TABLE security_admin_preferences ADD COLUMN IF NOT EXISTS alert_recipient_email TEXT NOT NULL DEFAULT 'kreboya603@gmail.com';
      ALTER TABLE security_admin_preferences ADD COLUMN IF NOT EXISTS sound_alert_enabled BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE security_admin_preferences ADD COLUMN IF NOT EXISTS preferences_json JSON;
      ALTER TABLE security_admin_preferences ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP NOT NULL DEFAULT NOW();
    `);

    // Drop any conflicting legacy NOT NULL constraint (without default) on columns absent from schema.ts
    const expectedColumns: Record<string, Set<string>> = {
      security_events: new Set([
        'id', 'event_category', 'severity', 'threat_type', 'ip_address', 'user_agent', 'method', 'path',
        'query_summary', 'country_code', 'country_name', 'region_name', 'city', 'asn_org', 'http_status',
        'blocked', 'actor_user_id', 'actor_email', 'details_json', 'resolved', 'resolved_at', 'resolved_by', 'created_at',
      ]),
      security_visitor_logs: new Set([
        'id', 'session_id', 'ip_address', 'user_agent', 'device_type', 'browser', 'os', 'country_code',
        'country_name', 'region_name', 'city', 'asn_org', 'path', 'tab', 'referrer', 'is_bot', 'bot_name',
        'user_email', 'created_at',
      ]),
      security_ip_intelligence: new Set([
        'id', 'ip_address', 'rdap_status', 'network_name', 'cidr', 'country_code', 'asn', 'asn_org',
        'abuse_email', 'abuse_phone', 'whois_summary_json', 'total_requests', 'threat_hits',
        'last_seen_at', 'last_enriched_at', 'created_at',
      ]),
      security_blocked_ips: new Set([
        'id', 'ip_address', 'cidr', 'reason', 'severity', 'source', 'blocked_by', 'expires_at',
        'is_active', 'hit_count', 'last_blocked_at', 'unblocked_at', 'unblocked_by', 'created_at',
      ]),
      security_alerts: new Set([
        'id', 'title', 'alert_type', 'severity', 'status', 'ip_address', 'path', 'event_count',
        'summary', 'evidence_json', 'acknowledged_by', 'acknowledged_at', 'resolved_by', 'resolved_at',
        'email_notified', 'created_at',
      ]),
      security_incidents: new Set([
        'id', 'incident_code', 'title', 'severity', 'status', 'category', 'affected_ip', 'affected_user_email',
        'root_cause', 'containment_actions', 'timeline_json', 'created_by', 'closed_at', 'created_at', 'updated_at',
      ]),
      security_traffic_stats_hourly: new Set([
        'id', 'bucket_hour', 'total_requests', 'visitor_views', 'bot_requests', 'blocked_requests',
        'auth_failures', 'threat_events', 'unique_ips', 'updated_at',
      ]),
      security_alert_policies: new Set([
        'id', 'policy_key', 'name', 'description', 'enabled', 'threshold_count', 'window_seconds',
        'auto_block_ip', 'auto_block_minutes', 'notify_email', 'updated_by', 'updated_at',
      ]),
      security_audit_trail: new Set([
        'id', 'actor_email', 'actor_role', 'action', 'target_type', 'target_id', 'ip_address', 'details_json', 'created_at',
      ]),
      security_admin_preferences: new Set([
        'id', 'admin_email', 'default_time_window', 'auto_refresh_seconds', 'email_notifications_enabled',
        'alert_recipient_email', 'sound_alert_enabled', 'preferences_json', 'updated_at',
      ]),
    };

    const legacyColsRes: any = await db.execute(sql`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name LIKE 'security_%'
        AND is_nullable = 'NO'
        AND column_default IS NULL
        AND column_name <> 'id'
    `);
    const rows: Array<{ table_name: string; column_name: string }> = Array.isArray(legacyColsRes)
      ? legacyColsRes
      : Array.isArray(legacyColsRes?.rows)
      ? legacyColsRes.rows
      : [];
    for (const r of rows) {
      const allowed = expectedColumns[r.table_name];
      if (
        allowed &&
        !allowed.has(r.column_name) &&
        /^[a-z0-9_]+$/.test(r.table_name) &&
        /^[a-z0-9_]+$/.test(r.column_name)
      ) {
        await db.execute(sql.raw(`ALTER TABLE "${r.table_name}" ALTER COLUMN "${r.column_name}" DROP NOT NULL`));
      }
    }

    // Seed baseline configurable policies idempotently (never overwrite existing admin config)
    await db.execute(sql`
      INSERT INTO security_alert_policies (policy_key, name, description, enabled, threshold_count, window_seconds, auto_block_ip, auto_block_minutes, notify_email)
      VALUES
        ('AUTH_BRUTE_FORCE', 'Repeated Login Failures', 'Alert when repeated invalid admin, reviewer, or bearer token attempts originate from a single IP.', TRUE, 5, 300, FALSE, 60, TRUE),
        ('ATTACK_PROBE_BURST', 'Exploit / Injection Probing', 'Alert immediately when SQLi, XSS, path traversal, or hidden config probes (.env/.git) are detected.', TRUE, 2, 300, FALSE, 120, TRUE),
        ('API_RATE_LIMIT', 'API Request Burst Protection', 'Enforce per-IP API rate limits per minute and raise alerts on sustained automated scraping.', TRUE, 120, 60, FALSE, 30, FALSE),
        ('RBAC_ABUSE', 'Unauthorized Privilege Probing', 'Alert when repeated 403 RBAC denials target admin or internal management routes.', TRUE, 5, 600, FALSE, 60, TRUE)
      ON CONFLICT (policy_key) DO NOTHING;

      INSERT INTO security_admin_preferences (admin_email, default_time_window, auto_refresh_seconds, email_notifications_enabled, alert_recipient_email, sound_alert_enabled, preferences_json)
      VALUES (
        'kreboya603@gmail.com',
        '7d',
        30,
        TRUE,
        'kreboya603@gmail.com',
        FALSE,
        '{"allowlistedIps": ["127.0.0.1", "::1"], "activeSessionWindowMinutes": 15}'::json
      )
      ON CONFLICT (admin_email) DO NOTHING;
    `);

    securityTablesInitialized = true;
  } catch (err: any) {
    console.error('[ENSURE_SECURITY_TABLES_ERROR]', err?.cause?.message || err?.message || err);
  }
}
