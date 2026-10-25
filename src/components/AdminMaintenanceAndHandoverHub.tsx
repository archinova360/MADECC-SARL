import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Mail,
  Send,
  CheckCircle2,
  Download,
  FileText,
  ShieldCheck,
  Clock,
  Sparkles,
  Building2,
  CreditCard,
  Code2,
  Key,
  RefreshCw,
  Bell,
  ChevronDown,
  ChevronUp,
  Layers
} from 'lucide-react';
import { ADMIN_SMTP_USER_EMAIL, OFFICIAL_PAYMENT_CONFIG, STANDARD_RECEIPT_FEE_XAF } from '../utils/paymentDomain.ts';
import { downloadBuyerHandoverManualPdf } from '../utils/buyerHandoverPdf.ts';
import { MaintenanceStatusData } from './VisitorMaintenanceNotice.tsx';

export const AdminMaintenanceAndHandoverHub: React.FC = () => {
  const [maintenance, setMaintenance] = useState<MaintenanceStatusData>({
    enabled: false,
    mode: 'non_intrusive_banner',
    title: 'Scheduled Platform Enhancement & Maintenance in Progress',
    message:
      'We are currently performing background engineering database & server optimizations. You can continue browsing all pages, using calculators, and exploring the website without any interruption.',
    estimatedCompletion: 'Today at 18:00 WAT',
    affectedModules: 'Background Sync & Cloud Backup Only (All Public Pages & Calculators 100% Active)',
    allowFullBrowsing: true,
    smtpUser: ADMIN_SMTP_USER_EMAIL,
    lastTriggeredAt: new Date().toISOString(),
    subscribers: []
  });

  const [extraClientEmails, setExtraClientEmails] = useState('');
  const [isDispatching, setIsDispatching] = useState(false);
  const [dispatchFeedback, setDispatchFeedback] = useState<string | null>(null);

  // Buyer Handover Customizer State
  const [buyerCompany, setBuyerCompany] = useState('');
  const [showHandoverDetails, setShowHandoverDetails] = useState(true);

  const loadMaintenanceStatus = async () => {
    try {
      const res = await fetch('/api/maintenance/status');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.maintenance) {
          setMaintenance(data.maintenance);
        }
      }
    } catch {
      // Ignore offline error
    }
  };

  useEffect(() => {
    loadMaintenanceStatus();
  }, []);

  const handleTriggerMaintenanceAndSmtp = async (targetEnabledState: boolean) => {
    setIsDispatching(true);
    setDispatchFeedback(null);
    try {
      const res = await fetch('/api/maintenance/toggle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          enabled: targetEnabledState,
          mode: maintenance.mode,
          title: maintenance.title,
          message: maintenance.message,
          estimatedCompletion: maintenance.estimatedCompletion,
          affectedModules: maintenance.affectedModules,
          recipientEmails: extraClientEmails
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setMaintenance(data.maintenance);
        localStorage.setItem('madecc_maintenance_state', JSON.stringify(data.maintenance));
        window.dispatchEvent(new Event('madecc-maintenance-updated'));
        setDispatchFeedback(
          data.message ||
            `Maintenance Notice ${targetEnabledState ? 'ACTIVATED' : 'COMPLETED'} & SMTP dispatched via ${ADMIN_SMTP_USER_EMAIL}!`
        );
      } else {
        setDispatchFeedback(data.error || 'Could not update maintenance status.');
      }
    } catch {
      // Fallback local toggle if offline
      const updated = {
        ...maintenance,
        enabled: targetEnabledState,
        lastTriggeredAt: new Date().toISOString()
      };
      setMaintenance(updated);
      localStorage.setItem('madecc_maintenance_state', JSON.stringify(updated));
      window.dispatchEvent(new Event('madecc-maintenance-updated'));
      setDispatchFeedback(
        `Maintenance Notice ${targetEnabledState ? 'ACTIVATED' : 'DEACTIVATED'} locally & queued for SMTP user ${ADMIN_SMTP_USER_EMAIL}.`
      );
    } finally {
      setIsDispatching(false);
    }
  };

  const customizationSections = [
    {
      num: '01',
      title: 'No-Code Brand Identity, Logo, Colors & Contact Info',
      location: 'Admin Dashboard (#admin) → CMS & Site Settings',
      icon: Building2,
      items: [
        'Company Name (siteName), Tagline, Legal Status, RCCM & NIU Tax ID',
        'Logo URL, Favicon URL, Primary Brand Color & Accent Color (updates CSS variables automatically)',
        'Yaoundé / Douala Office Addresses, Primary/Secondary Phones & WhatsApp Numbers',
        '8 Social Media Profile Links (Facebook, Instagram, LinkedIn, YouTube, X, TikTok, Pinterest)',
        'Hero Video Reel URL, Rotating Hero Headlines, Services, Portfolio Projects & Tenders'
      ]
    },
    {
      num: '02',
      title: 'Mobile Money / Orange Money Numbers, Fees & Domain',
      location: 'File: src/utils/paymentDomain.ts (Lines 1–42)',
      icon: CreditCard,
      items: [
        `TARGET_OFFICIAL_DOMAIN: Replace "https://madeccgroup.online" with the buyer's domain name`,
        `STANDARD_RECEIPT_FEE_XAF: Currently set to ${STANDARD_RECEIPT_FEE_XAF} XAF — change to any custom download fee`,
        `ADMIN_SMTP_USER_EMAIL: Replace "${ADMIN_SMTP_USER_EMAIL}" with the buyer's admin email`,
        `mtnMomoNumbers: Replace [${(OFFICIAL_PAYMENT_CONFIG?.mtnMomoNumbers || ['671063511', '683316486']).join(', ')}] with buyer's MTN MoMo numbers`,
        `orangeMoneyNumbers: Replace [${(OFFICIAL_PAYMENT_CONFIG?.orangeMoneyNumbers || ['689115595', '640194505']).join(', ')}] with buyer's Orange Money numbers`,
        'bankAccount: Replace Bank Name, Account Name, IBAN/RIB, and SWIFT code'
      ]
    },
    {
      num: '03',
      title: 'SMTP Email Dispatch, Firebase Auth & .env Keys',
      location: 'Files: .env & src/server/mailService.ts & src/server/routes/documentRoutes.ts',
      icon: Mail,
      items: [
        'SMTP_HOST, SMTP_PORT, SMTP_USER & SMTP_PASS: Buyer sets their own Gmail App Password or business SMTP credentials',
        'ADMIN_EMAIL: Receives quote alerts, 2,199 XAF payment confirmations, and maintenance dispatches',
        'VITE_FIREBASE_API_KEY & VITE_FIREBASE_PROJECT_ID: Buyer connects their own Firebase Auth project',
        'Admin Role Whitelist: Update admin email in src/middleware/auth.ts and src/components/Admin.tsx'
      ]
    },
    {
      num: '04',
      title: 'Calculators, 2026 Cost Guide & 8 Engineering Studios Letterheads',
      location: 'Files: src/components/ProjectBudgetCalculator.tsx, ConstructionCostGuide.tsx, BoqStudio.tsx',
      icon: Code2,
      items: [
        'src/services/tenantContentService.ts: Flagship tenant profile, default services, and portfolio projects',
        'src/components/ProjectBudgetCalculator.tsx & ConstructionCostGuide.tsx: Regional m² rates & material prices',
        'src/components/BoqStudio.tsx, DocumentStudio.tsx & ProposalStudio.tsx: PDF/DOCX letterheads, stamps & clauses',
        'src/utils/navigationGuidePdf.ts: Downloadable Visitor Walkthrough PDF header & company contact block'
      ]
    }
  ];

  return (
    <div className="space-y-6 my-6">
      {/* =====================================================================
          PANEL 1: NON-INTRUSIVE WEBSITE MAINTENANCE MODE & SMTP DISPATCH
          ===================================================================== */}
      <div className="rounded-2xl bg-slate-900/95 border-2 border-amber-500/40 p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-mono font-bold uppercase">
                <Wrench className="w-3.5 h-3.5" /> Non-Intrusive Website Maintenance Trigger
              </span>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold ${
                  maintenance.enabled
                    ? 'bg-amber-500 text-slate-950 animate-pulse'
                    : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                }`}
              >
                {maintenance.enabled ? '● MAINTENANCE NOTICE ACTIVE ON WEBSITE' : '● NORMAL OPERATIONS (MAINTENANCE OFF)'}
              </span>
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white">
              Notify Website Visitors of Maintenance Without Inconveniencing Them
            </h3>
            <p className="text-xs text-slate-400">
              Trigger a polite, non-blocking maintenance banner across the website and dispatch official SMTP notifications through{' '}
              <strong className="text-amber-400 font-mono">{ADMIN_SMTP_USER_EMAIL}</strong> while keeping all pages and calculators 100% open for visitors.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              onClick={() => handleTriggerMaintenanceAndSmtp(true)}
              disabled={isDispatching}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 cursor-pointer"
              id="admin-activate-maintenance-btn"
            >
              <Bell className="w-4 h-4" />
              <span>
                {isDispatching
                  ? 'Dispatching SMTP...'
                  : maintenance.enabled
                  ? 'Update Notice & Re-Dispatch SMTP'
                  : 'Activate Maintenance Notice & Dispatch SMTP'}
              </span>
            </button>

            {maintenance.enabled && (
              <button
                onClick={() => handleTriggerMaintenanceAndSmtp(false)}
                disabled={isDispatching}
                className="px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-50 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-lg shadow-emerald-500/20 cursor-pointer"
                id="admin-complete-maintenance-btn"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>End Maintenance &amp; Notify via SMTP</span>
              </button>
            )}
          </div>
        </div>

        {/* Form Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Visitor Notification Style (Zero Blocking)
            </label>
            <select
              value={maintenance.mode}
              onChange={(e) =>
                setMaintenance({
                  ...maintenance,
                  mode: e.target.value as 'non_intrusive_banner' | 'soft_dismissible_modal'
                })
              }
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="non_intrusive_banner">
                Non-Intrusive Top Advisory Bar Only (Recommended)
              </option>
              <option value="soft_dismissible_modal">
                Top Bar + Polite 1-Click Dismissible Welcome Card
              </option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Maintenance Notice Headline
            </label>
            <input
              type="text"
              value={maintenance.title}
              onChange={(e) => setMaintenance({ ...maintenance, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Estimated Completion Time
            </label>
            <input
              type="text"
              value={maintenance.estimatedCompletion}
              onChange={(e) => setMaintenance({ ...maintenance, estimatedCompletion: e.target.value })}
              placeholder="e.g., Today at 18:00 WAT"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Polite Visitor Reassurance Message (Shown on Website &amp; in SMTP Emails)
            </label>
            <textarea
              rows={2}
              value={maintenance.message}
              onChange={(e) => setMaintenance({ ...maintenance, message: e.target.value })}
              className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-mono uppercase tracking-wider text-slate-400 mb-1.5">
              Optional Client Emails to Notify via {ADMIN_SMTP_USER_EMAIL}
            </label>
            <input
              type="text"
              value={extraClientEmails}
              onChange={(e) => setExtraClientEmails(e.target.value)}
              placeholder="client1@email.com, client2@email.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white focus:outline-none focus:border-amber-500"
            />
            <span className="block text-[10px] text-slate-500 mt-1">
              Always dispatches to <strong className="text-amber-400">{ADMIN_SMTP_USER_EMAIL}</strong> +{' '}
              {maintenance.subscribers?.length || 1} subscribed visitor(s).
            </span>
          </div>
        </div>

        {dispatchFeedback && (
          <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center justify-between">
            <span>✓ {dispatchFeedback}</span>
            <button onClick={() => setDispatchFeedback(null)} className="text-emerald-300 hover:text-white text-xs">
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* =====================================================================
          PANEL 2: WEBSITE BUYER HANDOVER & BRAND CUSTOMIZATION DOCUMENT CENTER
          ===================================================================== */}
      <div className="rounded-2xl bg-slate-900/95 border-2 border-emerald-500/40 p-5 sm:p-6 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 text-xs font-mono font-bold uppercase">
              <FileText className="w-3.5 h-3.5" /> Official Website Buyer Handover Document
            </div>
            <h3 className="text-lg sm:text-xl font-extrabold text-white">
              Buyer Brand Customization &amp; Ownership Handover Manual (A4 PDF)
            </h3>
            <p className="text-xs text-slate-400">
              Hand this complete document over to the person purchasing this website. It details every No-Code Admin section, payment file, SMTP variable, and studio template they will customize for their brand.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 shrink-0">
            <input
              type="text"
              value={buyerCompany}
              onChange={(e) => setBuyerCompany(e.target.value)}
              placeholder="Optional: Buyer's Brand Name"
              className="px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
            <button
              onClick={() =>
                downloadBuyerHandoverManualPdf({
                  buyerCompany: buyerCompany.trim() || undefined,
                  sellerEmail: ADMIN_SMTP_USER_EMAIL
                })
              }
              className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 cursor-pointer"
              id="download-buyer-handover-pdf-btn"
            >
              <Download className="w-4 h-4" />
              <span>Download Buyer Handover Manual (A4 PDF — Confirm Admin Key/Email)</span>
            </button>
            <button
              onClick={() => setShowHandoverDetails(!showHandoverDetails)}
              className="px-3 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-1 cursor-pointer"
            >
              <span>{showHandoverDetails ? 'Hide Blueprint' : 'View Blueprint'}</span>
              {showHandoverDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {showHandoverDetails && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {customizationSections.map((sec) => {
              const SecIcon = sec.icon;
              return (
                <div
                  key={sec.num}
                  className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 font-mono text-xs font-bold">
                      Section {sec.num}
                    </span>
                    <span className="text-[11px] font-mono text-amber-400 truncate max-w-[240px]">
                      {sec.location}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <SecIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>{sec.title}</span>
                  </h4>
                  <ul className="space-y-1.5 text-xs text-slate-300">
                    {sec.items.map((item, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-emerald-400 font-bold">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminMaintenanceAndHandoverHub;
