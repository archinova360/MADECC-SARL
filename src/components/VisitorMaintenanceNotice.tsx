import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Clock,
  CheckCircle2,
  Mail,
  Bell,
  X,
  ChevronDown,
  ChevronUp,
  Send,
  ShieldCheck,
  Sparkles
} from 'lucide-react';
import { ADMIN_SMTP_USER_EMAIL } from '../utils/paymentDomain.ts';

export interface MaintenanceStatusData {
  enabled: boolean;
  mode: 'non_intrusive_banner' | 'soft_dismissible_modal';
  title: string;
  message: string;
  estimatedCompletion: string;
  affectedModules: string;
  allowFullBrowsing: boolean;
  smtpUser: string;
  lastTriggeredAt: string;
  lastSmtpDispatchAt?: string;
  subscribers?: Array<{
    email: string;
    name?: string;
    phone?: string;
    note?: string;
    subscribedAt: string;
  }>;
}

export const VisitorMaintenanceNotice: React.FC = () => {
  const [maintenance, setMaintenance] = useState<MaintenanceStatusData | null>(null);
  const [isBannerMinimized, setIsBannerMinimized] = useState(false);
  const [showSubscribeDrawer, setShowSubscribeDrawer] = useState(false);
  const [softModalDismissed, setSoftModalDismissed] = useState(false);

  const [visitorName, setVisitorName] = useState('');
  const [visitorEmail, setVisitorEmail] = useState('');
  const [visitorPhone, setVisitorPhone] = useState('');
  const [visitorNote, setVisitorNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const fetchMaintenanceStatus = async () => {
    try {
      const res = await fetch('/api/maintenance/status');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.maintenance) {
          setMaintenance(data.maintenance);
          localStorage.setItem('madecc_maintenance_state', JSON.stringify(data.maintenance));
          return;
        }
      }
    } catch {
      // Fallback to localStorage if offline
    }
    try {
      const cached = localStorage.getItem('madecc_maintenance_state');
      if (cached) {
        setMaintenance(JSON.parse(cached));
      }
    } catch {
      // Ignore
    }
  };

  useEffect(() => {
    fetchMaintenanceStatus();
    const interval = setInterval(fetchMaintenanceStatus, 10000);
    const handleCustomEvent = () => {
      fetchMaintenanceStatus();
      setSoftModalDismissed(false);
      setIsBannerMinimized(false);
    };
    window.addEventListener('madecc-maintenance-updated', handleCustomEvent);
    return () => {
      clearInterval(interval);
      window.removeEventListener('madecc-maintenance-updated', handleCustomEvent);
    };
  }, []);

  if (!maintenance || !maintenance.enabled) {
    return null;
  }

  const handleVisitorSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorEmail.trim() || !visitorEmail.includes('@')) {
      setSubmitError('Please enter a valid email address.');
      return;
    }
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(null);
    try {
      const res = await fetch('/api/maintenance/visitor-subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: visitorName.trim() || 'Valued Visitor',
          email: visitorEmail.trim(),
          phone: visitorPhone.trim(),
          note: visitorNote.trim()
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setSubmitSuccess(
          data.message ||
            `Confirmed! You will receive an SMTP update from ${ADMIN_SMTP_USER_EMAIL} as soon as maintenance completes.`
        );
        setVisitorEmail('');
        setVisitorNote('');
      } else {
        setSubmitError(data.error || 'Could not register email. Please try again.');
      }
    } catch {
      setSubmitError('Network error while connecting to SMTP server.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* 1. Non-Intrusive Top Maintenance Advisory Bar (Always allows 100% website browsing) */}
      <div
        className="relative z-40 bg-gradient-to-r from-slate-950 via-amber-950/90 to-slate-950 border-b border-amber-500/40 text-slate-100 shadow-lg"
        role="region"
        aria-label="Scheduled Maintenance Notification"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5">
          {isBannerMinimized ? (
            <div className="flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2 truncate">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 font-mono text-[10px] font-bold">
                  <Wrench className="w-3 h-3 animate-spin" style={{ animationDuration: '8s' }} />
                  MAINTENANCE IN PROGRESS
                </span>
                <span className="font-semibold text-amber-200 truncate">{maintenance.title}</span>
                <span className="hidden md:inline text-emerald-400 font-mono text-[11px]">
                  • Website &amp; Calculators 100% Open for Browsing
                </span>
              </div>
              <button
                onClick={() => setIsBannerMinimized(false)}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-amber-300 text-[11px] font-bold flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <span>Show Details</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
                    <Wrench className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-amber-500 text-slate-950 font-mono text-[10px] font-black uppercase tracking-wider">
                        Scheduled Maintenance Advisory
                      </span>
                      <span className="text-xs sm:text-sm font-extrabold text-white">
                        {maintenance.title}
                      </span>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[10px] font-bold">
                        <CheckCircle2 className="w-3 h-3" /> Zero Interruption — Browse Freely
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      {maintenance.message}
                    </p>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-amber-300/90 font-mono pt-0.5">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-amber-400" />
                        Est. Completion: <strong>{maintenance.estimatedCompletion}</strong>
                      </span>
                      <span>• Scope: {maintenance.affectedModules}</span>
                      <span>• SMTP Desk: {maintenance.smtpUser || ADMIN_SMTP_USER_EMAIL}</span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  <button
                    onClick={() => setShowSubscribeDrawer(!showSubscribeDrawer)}
                    className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                  >
                    <Bell className="w-3.5 h-3.5" />
                    <span>{showSubscribeDrawer ? 'Hide Email Alert Form' : 'Notify Me via Email'}</span>
                  </button>
                  <button
                    onClick={() => setIsBannerMinimized(true)}
                    className="px-2.5 py-2 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1 cursor-pointer"
                    title="Minimize banner while you browse"
                  >
                    <span>Minimize</span>
                    <ChevronUp className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Optional Expandable Drawer to Receive SMTP Update from kreboya603@gmail.com */}
              {showSubscribeDrawer && (
                <div className="pt-2.5 border-t border-amber-500/20">
                  <form
                    onSubmit={handleVisitorSubscribe}
                    className="bg-slate-950/90 border border-slate-800 rounded-2xl p-3.5 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3"
                  >
                    <div className="space-y-0.5 lg:max-w-xs">
                      <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                        <Mail className="w-3.5 h-3.5" />
                        Get Instant SMTP Completion Notice
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Dispatched automatically via <span className="font-mono text-slate-300">{ADMIN_SMTP_USER_EMAIL}</span> when maintenance finishes.
                      </p>
                    </div>

                    <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <input
                        type="text"
                        value={visitorName}
                        onChange={(e) => setVisitorName(e.target.value)}
                        placeholder="Your Name (optional)"
                        className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                      <input
                        type="email"
                        required
                        value={visitorEmail}
                        onChange={(e) => setVisitorEmail(e.target.value)}
                        placeholder="Your Email Address *"
                        className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                      <input
                        type="text"
                        value={visitorNote}
                        onChange={(e) => setVisitorNote(e.target.value)}
                        placeholder="Optional inquiry / note"
                        className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{submitting ? 'Sending...' : 'Notify Me'}</span>
                    </button>
                  </form>

                  {submitSuccess && (
                    <div className="mt-2 px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs flex items-center justify-between">
                      <span>✓ {submitSuccess}</span>
                      <button onClick={() => setSubmitSuccess(null)} className="text-emerald-300 hover:text-white">
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}

                  {submitError && (
                    <div className="mt-2 px-3 py-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
                      {submitError}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 2. Optional Polite Dismissible Welcome Card (Only if Admin selects 'soft_dismissible_modal' mode — never blocks the user!) */}
      {maintenance.mode === 'soft_dismissible_modal' && !softModalDismissed && (
        <div className="fixed bottom-5 left-5 z-50 max-w-md w-[calc(100vw-2.5rem)] bg-slate-900/95 backdrop-blur-md border-2 border-amber-500/50 rounded-2xl p-5 shadow-2xl text-slate-100 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold block">
                  Polite Visitor Notice • No Interruption
                </span>
                <h4 className="text-sm font-extrabold text-white">{maintenance.title}</h4>
              </div>
            </div>
            <button
              onClick={() => setSoftModalDismissed(true)}
              className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer"
              title="Dismiss notice and continue browsing"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mt-3">
            {maintenance.message}
          </p>

          <div className="mt-3 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-[11px] space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Estimated Completion:</span>
              <span className="font-mono font-bold text-amber-400">{maintenance.estimatedCompletion}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Website Access:</span>
              <span className="font-bold text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% Open &amp; Usable
              </span>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2">
            <button
              onClick={() => setSoftModalDismissed(true)}
              className="flex-1 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs text-center transition-all cursor-pointer"
            >
              Continue Browsing Website Freely
            </button>
            <button
              onClick={() => {
                setSoftModalDismissed(true);
                setIsBannerMinimized(false);
                setShowSubscribeDrawer(true);
              }}
              className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-xs border border-slate-700 cursor-pointer"
            >
              Email Alert
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default VisitorMaintenanceNotice;
