import React, { useEffect, useState } from 'react';
import {
  Wrench,
  Clock,
  ShieldAlert,
  PowerOff,
  CheckCircle2,
  Plus,
  RefreshCw,
  AlertTriangle,
} from 'lucide-react';
import { cmsFetch, CMS_TIMEZONES, formatDateTimeInTz, getStatusBadgeClass } from './cmsClient.ts';
import { CmsMaintenanceSchedule } from '../../types.ts';

export default function CmsMaintenanceSchedulerPanel() {
  const [schedules, setSchedules] = useState<CmsMaintenanceSchedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const [title, setTitle] = useState('Scheduled Platform Maintenance');
  const [message, setMessage] = useState(
    'Scheduled database & infrastructure maintenance is underway. Admin Panel and core platform health endpoints remain operational.'
  );
  const [status, setStatus] = useState<'SCHEDULED' | 'ACTIVE' | 'EMERGENCY'>('SCHEDULED');
  const [mode, setMode] = useState<'non_intrusive_banner' | 'soft_dismissible_modal' | 'scoped_notice' | 'full_site_advisory'>('non_intrusive_banner');
  const [timezone, setTimezone] = useState('Africa/Douala');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [affectedScope, setAffectedScope] = useState('Public Portal Advisory (Admin & /api/health Always Accessible)');
  const [fullSiteAdvisory, setFullSiteAdvisory] = useState(false);
  const [manualConfirmPhrase, setManualConfirmPhrase] = useState('');
  const [notifySubscribersSmtp, setNotifySubscribersSmtp] = useState(false);

  const loadSchedules = async () => {
    setLoading(true);
    try {
      const res = await cmsFetch('/api/cms/maintenance');
      setSchedules(res.schedules || []);
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to load maintenance schedules' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchedules();
  }, []);

  const handleCreateSchedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setMsg(null);
    try {
      const res = await cmsFetch('/api/cms/maintenance', {
        method: 'POST',
        body: JSON.stringify({
          title,
          message,
          status,
          mode,
          timezone,
          startAt: startAt ? new Date(startAt).toISOString() : null,
          endAt: endAt ? new Date(endAt).toISOString() : null,
          affectedScope,
          allowAdminBypass: true,
          fullSiteAdvisory,
          manualConfirmPhrase: fullSiteAdvisory ? manualConfirmPhrase : undefined,
          notifySubscribersSmtp,
        }),
      });
      setMsg({
        type: 'success',
        text: `Maintenance window saved (${res.schedule.status}). SMTP status: ${res.smtpStatus}`,
      });
      setManualConfirmPhrase('');
      window.dispatchEvent(new Event('madecc-maintenance-updated'));
      await loadSchedules();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to save maintenance schedule' });
    } finally {
      setBusy(false);
    }
  };

  const handleEmergencyDisable = async () => {
    setBusy(true);
    try {
      const res = await cmsFetch('/api/cms/maintenance/emergency-disable', { method: 'POST' });
      setMsg({
        type: 'success',
        text: `1-Click Emergency Disable completed (${res.disabledCount} schedule(s) cancelled). Public site normal.`,
      });
      window.dispatchEvent(new Event('madecc-maintenance-updated'));
      await loadSchedules();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Emergency disable failed' });
    } finally {
      setBusy(false);
    }
  };

  const handleUpdateStatus = async (id: number, nextStatus: string) => {
    setBusy(true);
    try {
      await cmsFetch(`/api/cms/maintenance/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus, fullSiteAdvisory: false }),
      });
      setMsg({ type: 'success', text: `Schedule #${id} updated to ${nextStatus}.` });
      window.dispatchEvent(new Event('madecc-maintenance-updated'));
      await loadSchedules();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Status update failed' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-200" id="cms-maintenance-scheduler-panel">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <Wrench className="w-5 h-5 text-amber-500" />
            Timezone-Aware Website Maintenance Scheduler
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Schedule or trigger Neon DB-persisted maintenance windows. Login, Admin Dashboard, and <code>/api/health</code> always remain accessible.
          </p>
        </div>

        <button
          onClick={handleEmergencyDisable}
          disabled={busy}
          className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs flex items-center gap-2 shadow-lg shrink-0"
        >
          <PowerOff className="w-4 h-4" /> 1-Click Emergency Disable All Maintenance
        </button>
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'}`}>
          <CheckCircle2 className="w-4 h-4" /> {msg.text}
        </div>
      )}

      {/* Create Schedule Form */}
      <form onSubmit={handleCreateSchedule} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4 text-xs">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-amber-500" /> Create Maintenance Schedule or Immediate Notice
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Status Mode</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
            >
              <option value="SCHEDULED">SCHEDULED (Auto-starts at Start Time)</option>
              <option value="ACTIVE">ACTIVE (Immediate Public Notice)</option>
              <option value="EMERGENCY">EMERGENCY (Immediate High-Priority Notice)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Visitor Display Mode</label>
            <select
              value={mode}
              onChange={(e) => {
                const m = e.target.value as any;
                setMode(m);
                setFullSiteAdvisory(m === 'full_site_advisory');
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
            >
              <option value="non_intrusive_banner">Non-Intrusive Top Banner Only</option>
              <option value="soft_dismissible_modal">Banner + Soft Dismissible Card</option>
              <option value="scoped_notice">Scoped Section Notice</option>
              <option value="full_site_advisory">Full-Site Maintenance Advisory (Requires Confirmation)</option>
            </select>
          </div>

          <div>
            <label className="block font-semibold text-slate-300 mb-1">Timezone</label>
            <select
              value={timezone}
              onChange={(e) => setTimezone(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
            >
              {CMS_TIMEZONES.map((tz) => (
                <option key={tz} value={tz}>{tz}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Headline *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Start Date & Time</label>
            <input
              type="datetime-local"
              value={startAt}
              onChange={(e) => setStartAt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">End Date & Time</label>
            <input
              type="datetime-local"
              value={endAt}
              onChange={(e) => setEndAt(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Public Visitor Message *</label>
            <textarea
              rows={2}
              required
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Affected Scope Description</label>
            <textarea
              rows={2}
              value={affectedScope}
              onChange={(e) => setAffectedScope(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>

        {fullSiteAdvisory && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2">
            <div className="font-bold text-rose-300 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" /> Full-Site Advisory Mode Safeguard
            </div>
            <p className="text-slate-300">
              Type <code className="text-amber-300 font-mono">CONFIRM_FULL_SITE_MAINTENANCE</code> below to activate full-site advisory mode. Admin Login and <code>/api/health</code> always remain accessible.
            </p>
            <input
              type="text"
              value={manualConfirmPhrase}
              onChange={(e) => setManualConfirmPhrase(e.target.value)}
              placeholder="CONFIRM_FULL_SITE_MAINTENANCE"
              className="w-full sm:w-80 bg-slate-950 border border-rose-500/40 rounded-lg px-3 py-1.5 font-mono text-white"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <label className="flex items-center gap-2 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={notifySubscribersSmtp}
              onChange={(e) => setNotifySubscribersSmtp(e.target.checked)}
            />
            <span>Dispatch optional SMTP admin confirmation summary via kreboya603@gmail.com</span>
          </label>

          <button
            type="submit"
            disabled={busy}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-2"
          >
            <Plus className="w-4 h-4" /> Save Maintenance Schedule
          </button>
        </div>
      </form>

      {/* Persisted Schedules Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Persisted Maintenance Windows (Neon PostgreSQL)</h3>
          <button onClick={loadSchedules} className="text-xs text-slate-400 hover:text-white flex items-center gap-1">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </div>

        {schedules.length === 0 ? (
          <p className="text-xs text-slate-500 py-4">No maintenance schedules recorded.</p>
        ) : (
          <div className="space-y-2.5">
            {schedules.map((s) => (
              <div key={s.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${getStatusBadgeClass(s.status)}`}>
                      {s.status}
                    </span>
                    <span className="font-bold text-white">{s.title}</span>
                    {s.fullSiteAdvisory && (
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] flex items-center gap-1">
                        <AlertTriangle className="w-3 h-3" /> Full-Site Advisory
                      </span>
                    )}
                  </div>
                  <p className="text-slate-400">{s.message}</p>
                  <div className="text-[11px] font-mono text-slate-500">
                    Start: {formatDateTimeInTz(s.startAt, s.timezone)} • End: {formatDateTimeInTz(s.endAt, s.timezone)} • SMTP: {s.lastSmtpStatus || '—'}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {s.status !== 'ACTIVE' && (
                    <button
                      onClick={() => handleUpdateStatus(s.id, 'ACTIVE')}
                      className="px-3 py-1.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 font-bold"
                    >
                      Activate
                    </button>
                  )}
                  {s.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleUpdateStatus(s.id, 'COMPLETED')}
                      className="px-3 py-1.5 rounded bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold"
                    >
                      Complete
                    </button>
                  )}
                  {s.status !== 'CANCELLED' && (
                    <button
                      onClick={() => handleUpdateStatus(s.id, 'CANCELLED')}
                      className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
