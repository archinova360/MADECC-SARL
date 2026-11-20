import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Activity,
  Users,
  Ban,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Download,
  Globe,
  Lock,
  Settings,
  FileWarning,
  Info,
  Clock,
  Terminal,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
} from 'recharts';
import { getAuthToken } from '../lib/firebase.ts';
import { getCsrfHeaders } from '../lib/csrf.ts';

type SocTab =
  | 'overview'
  | 'visitors'
  | 'events'
  | 'ip-intel'
  | 'incidents'
  | 'audit'
  | 'policies';

export default function SecurityThreatMonitoringHub() {
  const [activeTab, setActiveTab] = useState<SocTab>('overview');
  const [timeWindow, setTimeWindow] = useState<'today' | '7d' | '30d' | 'custom'>('7d');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [loading, setLoading] = useState(true);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [statusToast, setStatusToast] = useState<string | null>(null);

  const [summary, setSummary] = useState<any>(null);
  const [visitorsData, setVisitorsData] = useState<{ visitors: any[]; sessions: any[]; deviceBreakdown: any[] }>({
    visitors: [],
    sessions: [],
    deviceBreakdown: [],
  });
  const [events, setEvents] = useState<any[]>([]);
  const [eventFilter, setEventFilter] = useState<string>('ALL');
  const [eventSearch, setEventSearch] = useState('');
  const [alerts, setAlerts] = useState<any[]>([]);
  const [ipRecords, setIpRecords] = useState<any[]>([]);
  const [blockedIps, setBlockedIps] = useState<any[]>([]);
  const [incidents, setIncidents] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [policies, setPolicies] = useState<any[]>([]);
  const [prefs, setPrefs] = useState<any>(null);

  // Forms / Interactive Inspection State
  const [lookupIp, setLookupIp] = useState('');
  const [lookupResult, setLookupResult] = useState<any>(null);
  const [lookupEvents, setLookupEvents] = useState<any[]>([]);
  const [lookupLoading, setLookupLoading] = useState(false);

  const [blockIpInput, setBlockIpInput] = useState('');
  const [blockReason, setBlockReason] = useState('');
  const [blockMinutes, setBlockMinutes] = useState('60');

  const [newIncTitle, setNewIncTitle] = useState('');
  const [newIncCategory, setNewIncCategory] = useState('THREAT_INVESTIGATION');
  const [newIncSeverity, setNewIncSeverity] = useState('HIGH');
  const [newIncIp, setNewIncIp] = useState('');
  const [newIncRootCause, setNewIncRootCause] = useState('');

  const buildAuthHeaders = useCallback(async (includeCsrf = false): Promise<Record<string, string>> => {
    const token = await getAuthToken();
    const csrf = includeCsrf ? await getCsrfHeaders() : {};
    return {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...csrf,
    };
  }, []);

  const showToast = (msg: string) => {
    setStatusToast(msg);
    setTimeout(() => setStatusToast(null), 4500);
  };

  const queryParams = useCallback(() => {
    const p = new URLSearchParams({ window: timeWindow });
    if (timeWindow === 'custom' && customFrom) p.set('from', customFrom);
    if (timeWindow === 'custom' && customTo) p.set('to', customTo);
    return p.toString();
  }, [timeWindow, customFrom, customTo]);

  const fetchAllSocData = useCallback(async () => {
    setErrorBanner(null);
    try {
      const headers = await buildAuthHeaders(false);
      const qp = queryParams();

      const [sumRes, visRes, evRes, alRes, ipRes, blkRes, incRes, audRes, cfgRes] = await Promise.all([
        fetch(`/api/admin/security/summary?${qp}`, { headers, credentials: 'include' }),
        fetch(`/api/admin/security/visitors?${qp}`, { headers, credentials: 'include' }),
        fetch(`/api/admin/security/events?${qp}&category=${encodeURIComponent(eventFilter)}`, {
          headers,
          credentials: 'include',
        }),
        fetch('/api/admin/security/alerts', { headers, credentials: 'include' }),
        fetch('/api/admin/security/ip-intelligence', { headers, credentials: 'include' }),
        fetch('/api/admin/security/blocked-ips', { headers, credentials: 'include' }),
        fetch('/api/admin/security/incidents', { headers, credentials: 'include' }),
        fetch('/api/admin/security/audit-trail', { headers, credentials: 'include' }),
        fetch('/api/admin/security/config', { headers, credentials: 'include' }),
      ]);

      if (!sumRes.ok) {
        const errBody = await sumRes.json().catch(() => ({}));
        throw new Error(errBody?.error || `HTTP ${sumRes.status} loading security summary`);
      }

      const [sumJson, visJson, evJson, alJson, ipJson, blkJson, incJson, audJson, cfgJson] = await Promise.all([
        sumRes.json(),
        visRes.ok ? visRes.json() : { visitors: [], sessions: [], deviceBreakdown: [] },
        evRes.ok ? evRes.json() : { events: [] },
        alRes.ok ? alRes.json() : { alerts: [] },
        ipRes.ok ? ipRes.json() : { records: [] },
        blkRes.ok ? blkRes.json() : { blockedIps: [] },
        incRes.ok ? incRes.json() : { incidents: [] },
        audRes.ok ? audRes.json() : { logs: [] },
        cfgRes.ok ? cfgRes.json() : { policies: [], preferences: null },
      ]);

      setSummary(sumJson);
      setVisitorsData({
        visitors: visJson.visitors || [],
        sessions: visJson.sessions || [],
        deviceBreakdown: visJson.deviceBreakdown || [],
      });
      setEvents(evJson.events || []);
      setAlerts(alJson.alerts || []);
      setIpRecords(ipJson.records || []);
      setBlockedIps(blkJson.blockedIps || []);
      setIncidents(incJson.incidents || []);
      setAuditLogs(audJson.logs || []);
      setPolicies(cfgJson.policies || []);
      if (cfgJson.preferences) setPrefs(cfgJson.preferences);
      setLastSyncedAt(new Date().toISOString());
    } catch (err: any) {
      setErrorBanner(err?.message || 'Failed to load Security & Threat Monitoring telemetry.');
    } finally {
      setLoading(false);
    }
  }, [buildAuthHeaders, queryParams, eventFilter]);

  useEffect(() => {
    fetchAllSocData();
  }, [fetchAllSocData]);

  useEffect(() => {
    if (!autoRefresh) return;
    const ms = Math.max(15000, Number(prefs?.autoRefreshSeconds || 30) * 1000);
    const id = setInterval(fetchAllSocData, ms);
    return () => clearInterval(id);
  }, [autoRefresh, prefs?.autoRefreshSeconds, fetchAllSocData]);

  const handleIpLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookupIp.trim()) return;
    setLookupLoading(true);
    try {
      const headers = await buildAuthHeaders(true);
      const res = await fetch('/api/admin/security/ip-intelligence/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        credentials: 'include',
        body: JSON.stringify({ ipAddress: lookupIp.trim(), forceRefresh: true }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'RDAP lookup failed');
      setLookupResult(data.intelligence);
      setLookupEvents(data.supportingEvents || []);
      showToast(`RDAP inspection completed for ${lookupIp.trim()}`);
      fetchAllSocData();
    } catch (err: any) {
      setErrorBanner(err?.message || 'Failed to inspect IP address');
    } finally {
      setLookupLoading(false);
    }
  };

  const handleBlockIp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!blockIpInput.trim()) return;
    setErrorBanner(null);
    try {
      const headers = await buildAuthHeaders(true);
      const res = await fetch('/api/admin/security/block-ip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        credentials: 'include',
        body: JSON.stringify({
          ipAddress: blockIpInput.trim(),
          reason: blockReason.trim() || 'Blocked via Security Operations Center',
          severity: 'HIGH',
          expiresInMinutes: blockMinutes === '0' ? null : Number(blockMinutes),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to block IP');
      setBlockIpInput('');
      setBlockReason('');
      showToast(`Blocked IP ${data.blockedIp?.ipAddress}`);
      fetchAllSocData();
    } catch (err: any) {
      setErrorBanner(err?.message || 'Block request rejected');
    }
  };

  const handleUnblockIp = async (id: number) => {
    try {
      const headers = await buildAuthHeaders(true);
      const res = await fetch(`/api/admin/security/unblock-ip/${id}`, {
        method: 'POST',
        headers,
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Failed to unblock IP');
      showToast('IP removed from active blocklist');
      fetchAllSocData();
    } catch (err: any) {
      setErrorBanner(err?.message);
    }
  };

  const handleAlertStatus = async (id: number, status: 'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED') => {
    try {
      const headers = await buildAuthHeaders(true);
      const res = await fetch(`/api/admin/security/alerts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...headers },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update alert');
      showToast(`Alert #${id} marked ${status}`);
      fetchAllSocData();
    } catch (err: any) {
      setErrorBanner(err?.message);
    }
  };

  const handleCreateIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newIncTitle.trim()) return;
    try {
      const headers = await buildAuthHeaders(true);
      const res = await fetch('/api/admin/security/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        credentials: 'include',
        body: JSON.stringify({
          title: newIncTitle.trim(),
          category: newIncCategory,
          severity: newIncSeverity,
          affectedIp: newIncIp.trim() || null,
          rootCause: newIncRootCause.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to create incident');
      setNewIncTitle('');
      setNewIncIp('');
      setNewIncRootCause('');
      showToast(`Incident ${data.incident?.incidentCode} created`);
      fetchAllSocData();
    } catch (err: any) {
      setErrorBanner(err?.message);
    }
  };

  const handleIncidentStatus = async (id: number, status: string) => {
    try {
      const headers = await buildAuthHeaders(true);
      const res = await fetch(`/api/admin/security/incidents/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...headers },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error('Failed to update incident');
      showToast(`Incident updated to ${status}`);
      fetchAllSocData();
    } catch (err: any) {
      setErrorBanner(err?.message);
    }
  };

  const handleExportIncident = async (id: number, code: string, format: 'csv' | 'json') => {
    try {
      const headers = await buildAuthHeaders(false);
      const res = await fetch(`/api/admin/security/incidents/${id}/export?format=${format}`, {
        headers,
        credentials: 'include',
      });
      if (!res.ok) throw new Error('Export failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${code}.${format}`;
      a.click();
      URL.revokeObjectURL(url);
      showToast(`Exported ${code}.${format}`);
    } catch (err: any) {
      setErrorBanner(err?.message);
    }
  };

  const handleSavePolicies = async () => {
    try {
      const headers = await buildAuthHeaders(true);
      const res = await fetch('/api/admin/security/config', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...headers },
        credentials: 'include',
        body: JSON.stringify({ policies, preferences: prefs }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to save policies');
      showToast('Security policies and alert thresholds saved to Neon DB');
      fetchAllSocData();
    } catch (err: any) {
      setErrorBanner(err?.message);
    }
  };

  const m = summary?.metrics || {};
  const filteredEvents = eventSearch.trim()
    ? events.filter(
        (ev) =>
          (ev.ipAddress || '').toLowerCase().includes(eventSearch.toLowerCase()) ||
          (ev.path || '').toLowerCase().includes(eventSearch.toLowerCase()) ||
          (ev.threatType || '').toLowerCase().includes(eventSearch.toLowerCase())
      )
    : events;

  const kpiCards = [
    { label: 'Active Visitors (15m)', value: m.activeVisitors ?? 0, icon: Activity, tone: 'text-emerald-400' },
    { label: 'Page Visits', value: m.totalVisits ?? 0, icon: Users, tone: 'text-sky-400' },
    { label: 'Unique Sessions / IPs', value: m.uniqueVisitors ?? 0, icon: Globe, tone: 'text-amber-400' },
    { label: 'API Requests (Bucket)', value: m.totalRequests ?? 0, icon: Terminal, tone: 'text-slate-200' },
    { label: 'Blocked Requests', value: m.blockedRequests ?? 0, icon: Ban, tone: 'text-rose-400' },
    { label: 'Auth Failures', value: m.authFailures ?? 0, icon: Lock, tone: 'text-orange-400' },
    { label: 'RBAC Denials (403)', value: m.rbacDenied ?? 0, icon: ShieldAlert, tone: 'text-amber-400' },
    { label: 'Open Alerts', value: m.openAlerts ?? 0, icon: AlertTriangle, tone: 'text-rose-400' },
    { label: 'Active Blocked IPs', value: m.activeBlockedIps ?? 0, icon: ShieldCheck, tone: 'text-emerald-400' },
    { label: 'Open Incidents', value: m.openIncidents ?? 0, icon: FileWarning, tone: 'text-amber-300' },
  ];

  return (
    <div className="space-y-6 text-slate-200" id="security-threat-monitoring-hub">
      {/* Top Command Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-amber-400">
              Enterprise Security Operations
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              Neon PostgreSQL Telemetry
            </span>
          </div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Security &amp; Threat Monitoring Center
          </h1>
          <p className="text-xs text-slate-400">
            Real-time application telemetry, authentication/RBAC monitoring, RDAP network intelligence, IP blocking &amp; forensic incident response.
            {lastSyncedAt && (
              <span className="ml-2 font-mono text-slate-300">
                Last sync: {new Date(lastSyncedAt).toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>

        {/* Date Filter & Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {(['today', '7d', '30d', 'custom'] as const).map((win) => (
            <button
              key={win}
              type="button"
              onClick={() => setTimeWindow(win)}
              className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider border transition-colors cursor-pointer ${
                timeWindow === win
                  ? 'bg-amber-500 text-slate-950 border-amber-400'
                  : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              {win === 'today' ? '24h' : win}
            </button>
          ))}

          {timeWindow === 'custom' && (
            <div className="flex items-center gap-1.5">
              <input
                type="date"
                aria-label="Filter start date"
                value={customFrom}
                onChange={(e) => setCustomFrom(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200"
              />
              <input
                type="date"
                aria-label="Filter end date"
                value={customTo}
                onChange={(e) => setCustomTo(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-lg px-2 py-1.5 text-xs text-slate-200"
              />
            </div>
          )}

          <button
            type="button"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`min-h-[40px] px-3 py-1.5 rounded-lg text-xs font-mono border cursor-pointer ${
              autoRefresh
                ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400'
            }`}
          >
            Auto-Poll: {autoRefresh ? 'ON' : 'OFF'}
          </button>

          <button
            type="button"
            onClick={fetchAllSocData}
            className="min-h-[40px] px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-200 flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {statusToast && (
        <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-700 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{statusToast}</span>
        </div>
      )}

      {errorBanner && (
        <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-700 text-rose-200 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{errorBanner}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorBanner(null)}
            className="text-xs underline cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-800 pb-3">
        {[
          { id: 'overview', label: 'Overview & Telemetry', icon: Activity },
          { id: 'visitors', label: 'Visitors & Sessions', icon: Users },
          { id: 'events', label: 'Threats & Alerts', icon: ShieldAlert },
          { id: 'ip-intel', label: 'IP Intelligence & Blocking', icon: Ban },
          { id: 'incidents', label: 'Incidents & Forensics', icon: FileWarning },
          { id: 'audit', label: 'SOC Audit Logs', icon: Clock },
          { id: 'policies', label: 'Policies & Scope', icon: Settings },
        ].map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as SocTab)}
              className={`min-h-[42px] px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition-colors cursor-pointer ${
                active
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                  : 'bg-slate-900/70 text-slate-300 border-slate-800 hover:border-slate-700'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            {kpiCards.map((k) => {
              const Icon = k.icon;
              return (
                <div
                  key={k.label}
                  className="bg-slate-950 border border-slate-800 rounded-xl p-4 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span>{k.label}</span>
                    <Icon className={`w-4 h-4 ${k.tone}`} />
                  </div>
                  <div className="text-2xl font-black text-white tabular-nums">{k.value}</div>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Hourly Traffic & Threats Chart */}
            <div className="lg:col-span-2 bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-sm font-bold text-white">Hourly Traffic, Visits &amp; Blocked Events</h2>
                  <p className="text-xs text-slate-400">Aggregated directly from persisted Neon PostgreSQL hourly buckets</p>
                </div>
                {summary?.callerIp && (
                  <span className="text-[11px] font-mono text-slate-400">Your Admin IP: {summary.callerIp}</span>
                )}
              </div>

              {(summary?.hourlyTraffic || []).length === 0 ? (
                <div className="h-56 flex items-center justify-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-400">
                  No hourly telemetry buckets recorded yet in the selected time window.
                </div>
              ) : (
                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={summary.hourlyTraffic}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis
                        dataKey="bucketHour"
                        tick={{ fill: '#94a3b8', fontSize: 10 }}
                        tickFormatter={(v) => String(v).slice(11, 16)}
                      />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }}
                      />
                      <Area type="monotone" dataKey="totalRequests" stroke="#f59e0b" fill="#f59e0b33" name="API Requests" />
                      <Area type="monotone" dataKey="visitorViews" stroke="#38bdf8" fill="#38bdf822" name="Page Visits" />
                      <Area type="monotone" dataKey="blockedRequests" stroke="#f43f5e" fill="#f43f5e33" name="Blocked" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* Category Breakdown & Targeted Paths */}
            <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
              <h2 className="text-sm font-bold text-white">Security Event Breakdown</h2>
              {(summary?.categoryBreakdown || []).length === 0 ? (
                <div className="h-40 flex items-center justify-center border border-dashed border-slate-800 rounded-xl text-xs text-slate-400 text-center p-4">
                  Zero security threat events recorded in this time window.
                </div>
              ) : (
                <div className="h-48 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={summary.categoryBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                      <XAxis dataKey="category" tick={{ fill: '#94a3b8', fontSize: 9 }} />
                      <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', fontSize: '12px' }}
                      />
                      <Bar dataKey="count" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="pt-2 border-t border-slate-800 space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Most Targeted Endpoints</h3>
                {(summary?.topTargetedPaths || []).length === 0 ? (
                  <p className="text-xs text-slate-400">No targeted paths observed.</p>
                ) : (
                  <ul className="space-y-1.5 text-xs">
                    {summary.topTargetedPaths.map((tp: any) => (
                      <li key={tp.path} className="flex items-center justify-between gap-2 font-mono">
                        <span className="truncate text-slate-300">{tp.path}</span>
                        <span className="text-amber-400 font-bold shrink-0">{tp.count}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: VISITORS & SESSIONS */}
      {activeTab === 'visitors' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400">Active Sessions (15-min window)</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                {visitorsData.sessions.filter((s) => s.isActiveNow).length}
              </div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400">Total Observed Sessions</div>
              <div className="text-2xl font-black text-white mt-1">{visitorsData.sessions.length}</div>
            </div>
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <div className="text-xs text-slate-400">Device Distribution</div>
              <div className="flex flex-wrap gap-2 mt-2 text-xs font-mono">
                {visitorsData.deviceBreakdown.length === 0 ? (
                  <span className="text-slate-400">No device data yet</span>
                ) : (
                  visitorsData.deviceBreakdown.map((d) => (
                    <span key={d.deviceType} className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-200">
                      {d.deviceType}: {d.count}
                    </span>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Observed Visitor Sessions</h2>
              <span className="text-xs text-slate-400">Pseudonymous client session IDs &amp; IP classification</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-300 uppercase font-mono text-[11px]">
                  <tr>
                    <th className="p-3">Status</th>
                    <th className="p-3">IP Address</th>
                    <th className="p-3">Classification</th>
                    <th className="p-3">Device / Browser</th>
                    <th className="p-3">Last Path</th>
                    <th className="p-3">Views</th>
                    <th className="p-3">Last Seen</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {visitorsData.sessions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-400">
                        No visitor activity recorded in the selected window yet.
                      </td>
                    </tr>
                  ) : (
                    visitorsData.sessions.map((s) => (
                      <tr key={s.sessionKey} className="hover:bg-slate-900/50">
                        <td className="p-3">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              s.isActiveNow
                                ? 'bg-emerald-500/20 text-emerald-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {s.isActiveNow ? 'ACTIVE' : 'ENDED'}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-slate-200">{s.ipAddress}</td>
                        <td className="p-3 font-mono text-amber-300">{s.classification}</td>
                        <td className="p-3 text-slate-300">
                          {s.deviceType} · {s.browser} ({s.os})
                        </td>
                        <td className="p-3 font-mono text-slate-300">{s.lastPath}</td>
                        <td className="p-3 font-bold text-white tabular-nums">{s.pageViews}</td>
                        <td className="p-3 text-slate-400">{new Date(s.lastSeenAt).toLocaleString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: THREATS & ALERTS */}
      {activeTab === 'events' && (
        <div className="space-y-6">
          {/* Open & Recent Alerts */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-white">Security Alerts Queue</h2>
            {alerts.length === 0 ? (
              <p className="text-xs text-slate-400">No alerts have been raised yet.</p>
            ) : (
              <div className="space-y-2.5">
                {alerts.slice(0, 20).map((al) => (
                  <div
                    key={al.id}
                    className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                          {al.severity}
                        </span>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-200">
                          {al.status}
                        </span>
                        <span className="font-bold text-sm text-white">{al.title}</span>
                      </div>
                      <p className="text-xs text-slate-300">{al.summary}</p>
                      <div className="text-[11px] font-mono text-slate-400">
                        IP: {al.ipAddress || 'n/a'} · Path: {al.path || 'n/a'} · Count: {al.eventCount} ·{' '}
                        {new Date(al.createdAt).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {al.status === 'OPEN' && (
                        <button
                          type="button"
                          onClick={() => handleAlertStatus(al.id, 'ACKNOWLEDGED')}
                          className="px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-bold cursor-pointer"
                        >
                          Acknowledge
                        </button>
                      )}
                      {al.status !== 'RESOLVED' && (
                        <button
                          type="button"
                          onClick={() => handleAlertStatus(al.id, 'RESOLVED')}
                          className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                        >
                          Resolve
                        </button>
                      )}
                      {al.status !== 'DISMISSED' && (
                        <button
                          type="button"
                          onClick={() => handleAlertStatus(al.id, 'DISMISSED')}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                        >
                          False Positive
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detailed Security Events Stream */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2 className="text-sm font-bold text-white">Threat &amp; Access Telemetry Log</h2>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  aria-label="Filter threat event category"
                  value={eventFilter}
                  onChange={(e) => setEventFilter(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-200"
                >
                  <option value="ALL">All Categories</option>
                  <option value="ATTACK_PROBE">Attack Probes</option>
                  <option value="BOT_SCANNER">Scanner Bots</option>
                  <option value="AUTH_FAILURE">Auth Failures</option>
                  <option value="RBAC_DENIED">RBAC Denials</option>
                  <option value="RATE_LIMIT">Rate Limits</option>
                  <option value="UPLOAD_REJECTION">Upload Rejections</option>
                </select>
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                  <input
                    type="text"
                    placeholder="Filter IP, path, type…"
                    aria-label="Search security events"
                    value={eventSearch}
                    onChange={(e) => setEventSearch(e.target.value)}
                    className="bg-slate-900 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200"
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-900 text-slate-300 font-mono text-[11px] uppercase">
                  <tr>
                    <th className="p-3">Time</th>
                    <th className="p-3">Category</th>
                    <th className="p-3">Threat Type</th>
                    <th className="p-3">Source IP</th>
                    <th className="p-3">Method &amp; Path</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredEvents.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-6 text-center text-slate-400">
                        No matching threat events in this filter.
                      </td>
                    </tr>
                  ) : (
                    filteredEvents.map((ev) => (
                      <tr key={ev.id} className="hover:bg-slate-900/50">
                        <td className="p-3 text-slate-400 whitespace-nowrap">
                          {new Date(ev.createdAt).toLocaleString()}
                        </td>
                        <td className="p-3 font-mono text-amber-300">{ev.eventCategory}</td>
                        <td className="p-3 text-white font-semibold">{ev.threatType}</td>
                        <td className="p-3 font-mono text-slate-200">{ev.ipAddress}</td>
                        <td className="p-3 font-mono text-slate-300 max-w-xs truncate">
                          {ev.method} {ev.path}
                        </td>
                        <td className="p-3 font-mono">
                          <span className={ev.blocked ? 'text-rose-400 font-bold' : 'text-amber-300'}>
                            HTTP {ev.httpStatus}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: IP INTELLIGENCE & BLOCKING */}
      {activeTab === 'ip-intel' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* RDAP Live IP Lookup */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white">IP &amp; Network Intelligence (Live RDAP Registry)</h2>
            <p className="text-xs text-slate-400">
              Separates observed application events from live public RDAP registration metadata (`rdap.org`). No synthetic geolocation is fabricated.
            </p>
            <form onSubmit={handleIpLookup} className="flex gap-2">
              <input
                type="text"
                value={lookupIp}
                onChange={(e) => setLookupIp(e.target.value)}
                placeholder="Enter IPv4 or IPv6 address (e.g. 8.8.8.8)"
                aria-label="IP address to inspect"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
              <button
                type="submit"
                disabled={lookupLoading}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                {lookupLoading ? 'Querying RDAP…' : 'Inspect IP'}
              </button>
            </form>

            {lookupResult && (
              <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span className="text-slate-400">IP:</span>
                  <span className="text-white font-bold">{lookupResult.ipAddress}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">RDAP Status:</span>
                  <span className="text-amber-300">{lookupResult.rdapStatus}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Network / CIDR:</span>
                  <span className="text-slate-200">{lookupResult.networkName || '—'} ({lookupResult.cidr || '—'})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Organization / ASN:</span>
                  <span className="text-slate-200">{lookupResult.asnOrg || lookupResult.asn || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Country / Abuse:</span>
                  <span className="text-slate-200">{lookupResult.countryCode || '—'} · {lookupResult.abuseEmail || '—'}</span>
                </div>
                <div className="pt-2 border-t border-slate-800 text-slate-400">
                  Observed Events From This IP: {lookupEvents.length}
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h3 className="text-xs font-bold uppercase text-slate-400">Recently Seen IPs</h3>
              <div className="max-h-56 overflow-y-auto space-y-1.5 text-xs">
                {ipRecords.length === 0 ? (
                  <p className="text-slate-400">No IPs recorded yet.</p>
                ) : (
                  ipRecords.slice(0, 20).map((r) => (
                    <div
                      key={r.id}
                      className="flex items-center justify-between p-2 rounded-lg bg-slate-900/70 border border-slate-800/80"
                    >
                      <div>
                        <span className="font-mono text-white font-bold">{r.ipAddress}</span>
                        <span className="ml-2 text-slate-400">{r.rdapStatus}</span>
                      </div>
                      <div className="flex items-center gap-3 font-mono">
                        <span className="text-slate-300">Req: {r.totalRequests}</span>
                        <span className={r.threatHits > 0 ? 'text-rose-400 font-bold' : 'text-slate-400'}>
                          Threats: {r.threatHits}
                        </span>
                        <button
                          type="button"
                          onClick={() => setLookupIp(r.ipAddress)}
                          className="text-amber-400 hover:underline cursor-pointer"
                        >
                          Select
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* IP Blocklist with Self-Lockout Guard */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-white">IP Blocklist &amp; Containment</h2>
            <p className="text-xs text-slate-400">
              Your active session IP ({summary?.callerIp || 'current'}), loopback, and allowlisted IPs are automatically protected from self-lockout.
            </p>
            <form onSubmit={handleBlockIp} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={blockIpInput}
                  onChange={(e) => setBlockIpInput(e.target.value)}
                  placeholder="Target Public IPv4/IPv6"
                  aria-label="Target IP address to block"
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
                  required
                />
                <select
                  aria-label="Block duration"
                  value={blockMinutes}
                  onChange={(e) => setBlockMinutes(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                >
                  <option value="30">Temporary: 30 minutes</option>
                  <option value="60">Temporary: 1 hour</option>
                  <option value="1440">Temporary: 24 hours</option>
                  <option value="0">Manual Indefinite Block</option>
                </select>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={blockReason}
                  onChange={(e) => setBlockReason(e.target.value)}
                  placeholder="Justification / audit reason"
                  aria-label="Justification for IP block"
                  className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                  required
                />
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs cursor-pointer"
                >
                  Block IP
                </button>
              </div>
            </form>

            <div className="space-y-2 pt-2 border-t border-slate-800">
              <h3 className="text-xs font-bold uppercase text-slate-400">Blocked IP Records</h3>
              {blockedIps.length === 0 ? (
                <p className="text-xs text-slate-400">No IPs blocked.</p>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {blockedIps.map((b) => (
                    <div
                      key={b.id}
                      className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-2 text-xs"
                    >
                      <div className="space-y-0.5 min-w-0">
                        <div className="flex items-center gap-2 font-mono">
                          <span className="text-white font-bold">{b.ipAddress}</span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              b.isActive ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {b.isActive ? 'ACTIVE' : 'UNBLOCKED'}
                          </span>
                        </div>
                        <p className="text-slate-400 truncate">{b.reason}</p>
                        <div className="text-[11px] font-mono text-slate-400">
                          Hits blocked: {b.hitCount} · By: {b.blockedBy || 'system'}
                        </div>
                      </div>
                      {b.isActive && (
                        <button
                          type="button"
                          onClick={() => handleUnblockIp(b.id)}
                          className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-emerald-600 text-slate-200 hover:text-white font-bold shrink-0 cursor-pointer"
                        >
                          Unblock
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: INCIDENTS & FORENSICS */}
      {activeTab === 'incidents' && (
        <div className="space-y-6">
          <form
            onSubmit={handleCreateIncident}
            className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-3"
          >
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-amber-400" /> Open Security Incident Record
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                type="text"
                value={newIncTitle}
                onChange={(e) => setNewIncTitle(e.target.value)}
                placeholder="Incident title *"
                aria-label="Incident title"
                className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
                required
              />
              <select
                aria-label="Incident severity"
                value={newIncSeverity}
                onChange={(e) => setNewIncSeverity(e.target.value)}
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              >
                <option value="LOW">LOW</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="HIGH">HIGH</option>
                <option value="CRITICAL">CRITICAL</option>
              </select>
              <input
                type="text"
                value={newIncIp}
                onChange={(e) => setNewIncIp(e.target.value)}
                placeholder="Affected IP (optional)"
                aria-label="Affected IP"
                className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white font-mono"
              />
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                value={newIncRootCause}
                onChange={(e) => setNewIncRootCause(e.target.value)}
                placeholder="Initial triage notes / root cause hypothesis"
                aria-label="Incident root cause notes"
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white"
              />
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Create Incident
              </button>
            </div>
          </form>

          <div className="space-y-3">
            {incidents.length === 0 ? (
              <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-2xl text-xs text-slate-400">
                No security incidents opened yet.
              </div>
            ) : (
              incidents.map((inc) => (
                <div
                  key={inc.id}
                  className="bg-slate-950 border border-slate-800 rounded-2xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-amber-400">{inc.incidentCode}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300">
                        {inc.severity}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-200">
                        {inc.status}
                      </span>
                      <h3 className="text-sm font-bold text-white">{inc.title}</h3>
                    </div>
                    {inc.rootCause && <p className="text-xs text-slate-300">{inc.rootCause}</p>}
                    <div className="text-[11px] font-mono text-slate-400">
                      Affected IP: {inc.affectedIp || '—'} · Created by: {inc.createdBy || 'admin'} ·{' '}
                      {new Date(inc.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label={`Change status for ${inc.incidentCode}`}
                      value={inc.status}
                      onChange={(e) => handleIncidentStatus(inc.id, e.target.value)}
                      className="bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-white"
                    >
                      <option value="INVESTIGATING">INVESTIGATING</option>
                      <option value="CONTAINED">CONTAINED</option>
                      <option value="MITIGATED">MITIGATED</option>
                      <option value="CLOSED">CLOSED</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => handleExportIncident(inc.id, inc.incidentCode, 'csv')}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> CSV
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportIncident(inc.id, inc.incidentCode, 'json')}
                      className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-slate-200 flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" /> JSON
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 6: AUDIT TRAIL */}
      {activeTab === 'audit' && (
        <div className="bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white">SOC Administrative Action Audit Trail</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900 text-slate-300 font-mono text-[11px] uppercase">
                <tr>
                  <th className="p-3">Timestamp</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Action</th>
                  <th className="p-3">Target</th>
                  <th className="p-3">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-6 text-center text-slate-400">
                      No SOC administrative actions recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/50">
                      <td className="p-3 text-slate-400">{new Date(log.createdAt).toLocaleString()}</td>
                      <td className="p-3 font-mono text-slate-200">{log.actorEmail}</td>
                      <td className="p-3 font-mono text-amber-300 font-bold">{log.action}</td>
                      <td className="p-3 font-mono text-slate-300">
                        {log.targetType}: {log.targetId || '—'}
                      </td>
                      <td className="p-3 font-mono text-slate-400">{log.ipAddress || '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 7: POLICIES & MONITORING LIMITATIONS */}
      {activeTab === 'policies' && (
        <div className="space-y-6">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-white">Detection Rules, Thresholds &amp; Alert Policies</h2>
              <button
                type="button"
                onClick={handleSavePolicies}
                className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Save Policies
              </button>
            </div>

            <div className="space-y-3">
              {policies.map((p, idx) => (
                <div
                  key={p.policyKey}
                  className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 grid grid-cols-1 md:grid-cols-6 gap-3 items-center text-xs"
                >
                  <div className="md:col-span-2">
                    <div className="font-bold text-white">{p.name}</div>
                    <div className="text-slate-400">{p.description}</div>
                  </div>
                  <label className="flex items-center gap-2 text-slate-200">
                    <input
                      type="checkbox"
                      checked={Boolean(p.enabled)}
                      onChange={(e) => {
                        const copy = [...policies];
                        copy[idx] = { ...p, enabled: e.target.checked };
                        setPolicies(copy);
                      }}
                    />
                    Enabled
                  </label>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400">Threshold</label>
                    <input
                      type="number"
                      aria-label={`${p.name} threshold`}
                      value={p.thresholdCount}
                      onChange={(e) => {
                        const copy = [...policies];
                        copy[idx] = { ...p, thresholdCount: Number(e.target.value) };
                        setPolicies(copy);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono text-slate-400">Window (s)</label>
                    <input
                      type="number"
                      aria-label={`${p.name} window seconds`}
                      value={p.windowSeconds}
                      onChange={(e) => {
                        const copy = [...policies];
                        copy[idx] = { ...p, windowSeconds: Number(e.target.value) };
                        setPolicies(copy);
                      }}
                      className="w-full bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 text-slate-200">
                      <input
                        type="checkbox"
                        checked={Boolean(p.notifyEmail)}
                        onChange={(e) => {
                          const copy = [...policies];
                          copy[idx] = { ...p, notifyEmail: e.target.checked };
                          setPolicies(copy);
                        }}
                      />
                      Email Alert
                    </label>
                    <label className="flex items-center gap-2 text-slate-200">
                      <input
                        type="checkbox"
                        checked={Boolean(p.autoBlockIp)}
                        onChange={(e) => {
                          const copy = [...policies];
                          copy[idx] = { ...p, autoBlockIp: e.target.checked };
                          setPolicies(copy);
                        }}
                      />
                      Auto-Block IP
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transparent Architecture & Monitoring Scope Disclosure */}
          <div className="bg-slate-950 border border-amber-500/30 rounded-2xl p-5 space-y-2 text-xs text-slate-300">
            <h2 className="text-sm font-bold text-amber-300 flex items-center gap-2">
              <Info className="w-4 h-4" /> Application-Layer Monitoring Scope &amp; Honest Limitations
            </h2>
            <ul className="list-disc pl-5 space-y-1 text-slate-300">
              <li>
                <strong>What This Module Monitors:</strong> Express/Node.js API requests, Netlify Serverless function invocations, authentication failures, RBAC 403 denials, upload validation rejections, path/injection probes, and pseudonymous visitor navigation beacons persisted in Neon PostgreSQL.
              </li>
              <li>
                <strong>What Requires External Infrastructure Tooling:</strong> Network-edge volumetric DDoS absorption, raw router/L3-L4 packet inspection, operating-system kernel/SSH logs, and DNS-level WAF filtering belong to Cloudflare/Netlify Edge/cloud infrastructure rather than this application-layer telemetry table.
              </li>
              <li>
                <strong>IP &amp; Network Intelligence:</strong> Public network/CIDR/abuse metadata is retrieved live from <code>rdap.org</code> when queried. Private or loopback addresses are explicitly tagged <code>PRIVATE_OR_LOOPBACK</code> without fabricated city or ISP estimates.
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
