import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Code2,
  Copy,
  CreditCard,
  Database,
  Download,
  FileText,
  Globe,
  Key,
  Layers,
  Lock,
  Mail,
  Server,
  ShieldCheck,
  Smartphone,
  Unlock,
  Wrench
} from 'lucide-react';
import { downloadBuyerHandoverManualPdf } from '../utils/buyerHandoverPdf.ts';
import {
  ADMIN_SMTP_USER_EMAIL,
  BUYER_HANDOVER_MANUAL_RECEIPT_NO,
  MANUAL_DOWNLOAD_FEE_XAF,
  OFFICIAL_PAYMENT_CONFIG,
  STANDARD_RECEIPT_FEE_XAF,
  TARGET_OFFICIAL_DOMAIN,
  isReceiptPaid,
  syncReceiptStatusFromServer
} from '../utils/paymentDomain.ts';
import { useTheme } from '../lib/ThemeContext.tsx';

interface BuyerHandoverManualPageProps {
  onNavigateToTab: (tab: string, extraState?: any) => void;
}

type HandoverSection = 'all' | 'no-code' | 'payment-code' | 'infrastructure' | 'checklist';

export const BuyerHandoverManualPage: React.FC<BuyerHandoverManualPageProps> = ({ onNavigateToTab }) => {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [activeSection, setActiveSection] = useState<HandoverSection>('all');
  const [buyerName, setBuyerName] = useState('');
  const [buyerCompany, setBuyerCompany] = useState('');
  const [buyerDomain, setBuyerDomain] = useState('');
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [checkedSteps, setCheckedSteps] = useState<Record<number, boolean>>({});
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => isReceiptPaid(BUYER_HANDOVER_MANUAL_RECEIPT_NO));

  useEffect(() => {
    let active = true;
    const checkStatus = async () => {
      const rec = await syncReceiptStatusFromServer(BUYER_HANDOVER_MANUAL_RECEIPT_NO);
      if (active) {
        setIsUnlocked(
          Boolean(
            rec?.isPaid &&
              rec?.adminConfirmed &&
              rec?.status === 'ADMIN_CONFIRMED' &&
              Number(rec?.amount || 0) > 0
          ) || isReceiptPaid(BUYER_HANDOVER_MANUAL_RECEIPT_NO)
        );
      }
    };
    checkStatus();
    const interval = setInterval(checkStatus, 5000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  const openPaymentGate = () => {
    window.dispatchEvent(
      new CustomEvent('madecc:open-manual-payment-gate', {
        detail: {
          manualType: 'buyer_handover_manual',
          options: {
            buyerName: buyerName.trim() || undefined,
            buyerCompany: buyerCompany.trim() || undefined,
            buyerDomain: buyerDomain.trim() || undefined,
            sellerName: 'Eric Kreboya',
            sellerEmail: ADMIN_SMTP_USER_EMAIL
          }
        }
      })
    );
  };

  const mtnMomoNumbers = OFFICIAL_PAYMENT_CONFIG?.mtnMomoNumbers || ['671063511', '683316486'];
  const orangeMoneyNumbers = OFFICIAL_PAYMENT_CONFIG?.orangeMoneyNumbers || ['689115595', '640194505'];

  const handleCopyNumber = (num: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(num).catch(() => {});
    }
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  const toggleChecklistStep = (stepIdx: number) => {
    setCheckedSteps((prev) => ({ ...prev, [stepIdx]: !prev[stepIdx] }));
  };

  const triggerDownload = () => {
    downloadBuyerHandoverManualPdf({
      buyerName: buyerName.trim() || undefined,
      buyerCompany: buyerCompany.trim() || undefined,
      buyerDomain: buyerDomain.trim() || undefined,
      sellerName: 'Eric Kreboya',
      sellerEmail: ADMIN_SMTP_USER_EMAIL
    });
  };

  const pageSurface = isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#0A0A0B] text-slate-100';
  const cardSurface = isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800 shadow-xl';
  const subSurface = isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/90 border-slate-800';
  const mutedText = isLight ? 'text-slate-600' : 'text-slate-400';

  const noCodeItems = [
    {
      path: '08. Website CMS > Global Site Branding & Settings',
      title: 'Company Identity, RCCM / NIU, Logos & Theme Colors',
      desc: 'Replace Site Name, Tagline, Developer credit, RCCM & NIU Tax IDs, Logo/Favicon URLs, Primary/Accent colors, and HQ phone numbers without touching code.',
      icon: Building2
    },
    {
      path: '08. Website CMS > Page Builder & Home Hero Sliders',
      title: 'Hero Reels, Sliders, Pages & SEO Meta Tags',
      desc: 'Customize homepage headlines, hero background video URLs, CTA labels, carousel slides, and per-page SEO descriptions with live staging.',
      icon: Globe
    },
    {
      path: '02. Corporate & Governance + 08. Website CMS > Services / Legal',
      title: 'Business Divisions (10), Services, Legal & FAQ',
      desc: 'Edit all 10 business divisions, civil engineering service packages, OHADA legal pages, privacy/cookie policies, and FAQ items.',
      icon: Layers
    },
    {
      path: '09. Marketing & Social Media + 10. People, HR & Education',
      title: 'Social Channels, Staff Permissions & Client Portals',
      desc: 'Reconnect Facebook, Instagram, LinkedIn, YouTube, and WhatsApp OAuth channels under your brand and rotate administrator credentials.',
      icon: Key
    }
  ];

  const paymentConstants = [
    { key: 'TARGET_OFFICIAL_DOMAIN', current: TARGET_OFFICIAL_DOMAIN, action: `Update to ${buyerDomain.trim() || 'your new production domain'}` },
    { key: 'MANUAL_DOWNLOAD_FEE_XAF', current: `${MANUAL_DOWNLOAD_FEE_XAF} XAF`, action: 'Fee for Navigation & Buyer Brand Handover A4 PDFs' },
    { key: 'STANDARD_RECEIPT_FEE_XAF', current: `${STANDARD_RECEIPT_FEE_XAF} XAF`, action: 'Fee for Certified Receipts, BOQs, Cost Guides & Contracts' },
    { key: 'ADMIN_SMTP_USER_EMAIL', current: ADMIN_SMTP_USER_EMAIL, action: 'Replace with buyer primary admin notification email' },
    { key: 'OFFICIAL_PAYMENT_CONFIG.mtnMomoNumbers', current: mtnMomoNumbers.join(', '), action: 'Replace with buyer MTN Mobile Money receiver numbers' },
    { key: 'OFFICIAL_PAYMENT_CONFIG.orangeMoneyNumbers', current: orangeMoneyNumbers.join(', '), action: 'Replace with buyer Orange Money receiver numbers' }
  ];

  const infrastructureItems = [
    {
      title: 'Neon PostgreSQL + Drizzle ORM',
      env: 'DATABASE_URL',
      detail: 'Swap PostgreSQL connection string and run Drizzle schema push so all tables (users, projects, cms_*, receipts, contracts, audit_logs) initialize cleanly.',
      icon: Database
    },
    {
      title: 'Cloudinary & Supabase Storage (10 GB Direct TUS)',
      env: 'CLOUDINARY_* & SUPABASE_*',
      detail: 'Rotate cloud credentials in server environment so signed chunked uploads and 10 GB resumable TUS transfers route to the buyer media buckets.',
      icon: Server
    },
    {
      title: 'SMTP Mail, Firebase Auth & Play Store TWA',
      env: 'SMTP_* & VITE_FIREBASE_*',
      detail: 'Configure Gmail App Password or brand SMTP, connect buyer Firebase Auth project, and update Digital Asset Links under 11. Platform > Play Store & cPanel.',
      icon: Mail
    }
  ];

  const checklistSteps = [
    'Sign in to #admin > 08. Website CMS > Global Site Branding & Settings and update Company Name, Logo, Brand Colors, RCCM/NIU, and Phones.',
    'Edit src/utils/paymentDomain.ts to switch MTN MoMo, Orange Money, Bank IBAN, Official Domain, and ADMIN_SMTP_USER_EMAIL.',
    'Update .env secrets for DATABASE_URL (Neon), SMTP_USER/PASS, CLOUDINARY_*, SUPABASE_*, and JWT_SECRET on your host.',
    'Confirm a test 999 / 2,199 XAF transaction inside 06. Finance > Payment Confirmations and test a 10 GB media upload in 08. Website CMS > Media Library.',
    'Point your domain DNS (A/CNAME + SSL HTTPS) and configure Play Store TWA / cPanel files in 11. Platform > Play Store & cPanel Hosting.'
  ];

  return (
    <div className={`min-h-screen py-10 px-4 sm:px-6 lg:px-8 ${pageSurface}`} id="buyer-handover-manual-page">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Breadcrumbs */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onNavigateToTab('home')}
              className={`inline-flex items-center gap-1.5 font-semibold hover:text-amber-500 cursor-pointer ${mutedText}`}
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Home</span>
            </button>
            <span className={mutedText}>/</span>
            <button
              type="button"
              onClick={() => onNavigateToTab('navigation-manual')}
              className={`font-semibold hover:text-amber-500 cursor-pointer ${mutedText}`}
            >
              Manuals &amp; Handover
            </button>
            <span className={mutedText}>/</span>
            <span className="font-bold text-emerald-400">Buyer Brand Handover Manual (PDF)</span>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToTab('navigation-manual')}
            className="inline-flex items-center gap-1.5 font-bold text-amber-500 hover:text-amber-400 cursor-pointer"
          >
            <span>Open Navigation Manual (A4 PDF)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hero & Live Certificate Personalization Card */}
        <div className={`rounded-3xl border p-6 sm:p-8 ${cardSurface}`}>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            <div className="lg:col-span-7 space-y-3">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-wider">
                <span className="px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                  2026 Enterprise Release • 4-Page A4 PDF
                </span>
                <span className="px-2.5 py-1 rounded bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  {BUYER_HANDOVER_MANUAL_RECEIPT_NO}
                </span>
                <span
                  className={`px-2.5 py-1 rounded inline-flex items-center gap-1 border ${
                    isUnlocked
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700'
                  }`}
                >
                  {isUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  {isUnlocked ? 'Payment Verified — Unlocked' : `${MANUAL_DOWNLOAD_FEE_XAF} XAF Required Before Download`}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Buyer Brand Handover Manual (PDF) —{' '}
                <span className="text-emerald-400 font-mono tabular-nums">{MANUAL_DOWNLOAD_FEE_XAF} XAF</span>
              </h1>
              <p className={`text-sm leading-relaxed ${mutedText}`}>
                Turnkey brand transfer dossier for new platform owners: no-code rebranding across the 11 Admin Dashboard categories,
                <code className="px-1.5 py-0.5 rounded bg-slate-800/60 text-amber-400 font-mono text-xs mx-1">paymentDomain.ts</code>
                settlement transfer, Neon PostgreSQL + Drizzle + Cloudinary + Supabase 10 GB cutover, and a personalized Ownership Transfer Certificate.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  disabled={!isUnlocked}
                  onClick={triggerDownload}
                  className={`px-6 py-3 rounded-xl font-black text-xs sm:text-sm inline-flex items-center gap-2 transition-all ${
                    isUnlocked
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/20 cursor-pointer'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-70'
                  }`}
                  id="buyer-handover-download-btn"
                >
                  {isUnlocked ? <Download className="w-4 h-4" /> : <Lock className="w-4 h-4 text-emerald-400" />}
                  <span>
                    {isUnlocked
                      ? 'Download Handover Manual (A4 PDF)'
                      : 'Download Locked Until Payment Verified'}
                  </span>
                </button>
                {!isUnlocked && (
                  <button
                    type="button"
                    onClick={openPaymentGate}
                    className="px-6 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm inline-flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                    id="buyer-handover-pay-btn"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Pay {MANUAL_DOWNLOAD_FEE_XAF} XAF to Unlock PDF</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onNavigateToTab('admin')}
                  className={`px-4 py-3 rounded-xl border text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors cursor-pointer ${subSurface}`}
                >
                  <Wrench className="w-4 h-4 text-emerald-400" />
                  <span>Open Admin Handover Hub</span>
                </button>
              </div>
            </div>

            {/* Personalize Ownership Transfer Certificate Form */}
            <div className={`lg:col-span-5 rounded-2xl border p-5 space-y-3.5 ${subSurface}`}>
              <div className="flex items-center justify-between">
                <span className="font-mono text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Personalize PDF Certificate (Optional)
                </span>
                <span className="text-[11px] font-mono text-amber-500 tabular-nums">Page 4 of 4</span>
              </div>
              <p className={`text-xs ${mutedText}`}>
                Enter the buyer details below to stamp them directly onto Page 1 and the Ownership Transfer Certificate inside the generated A4 PDF.
              </p>
              <div className="space-y-2.5">
                <input
                  type="text"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  placeholder="Buyer Full Name (e.g. Jean-Paul Mbah)"
                  aria-label="Buyer Full Name"
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none focus:border-emerald-500 ${cardSurface}`}
                />
                <input
                  type="text"
                  value={buyerCompany}
                  onChange={(e) => setBuyerCompany(e.target.value)}
                  placeholder="New Brand / Company Name"
                  aria-label="New Brand or Company Name"
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs focus:outline-none focus:border-emerald-500 ${cardSurface}`}
                />
                <input
                  type="text"
                  value={buyerDomain}
                  onChange={(e) => setBuyerDomain(e.target.value)}
                  placeholder="Target Domain (e.g. https://acme-build.cm)"
                  aria-label="Target Production Domain"
                  className={`w-full px-3.5 py-2 rounded-xl border text-xs font-mono focus:outline-none focus:border-emerald-500 ${cardSurface}`}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Section Filter Bar */}
        <div className={`rounded-2xl border p-3 flex flex-wrap gap-2 ${cardSurface}`}>
          {(
            [
              { id: 'all', label: 'Complete Handover Dossier' },
              { id: 'no-code', label: '1. No-Code Admin Rebranding' },
              { id: 'payment-code', label: '2. Payment & Domain Code' },
              { id: 'infrastructure', label: '3. Neon, Storage & .env' },
              { id: 'checklist', label: '4. 15-Min Launch & MoMo' }
            ] as { id: HandoverSection; label: string }[]
          ).map((sec) => (
            <button
              key={sec.id}
              type="button"
              onClick={() => setActiveSection(sec.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                activeSection === sec.id
                  ? 'bg-emerald-500 text-slate-950 font-black'
                  : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
              }`}
            >
              {sec.label}
            </button>
          ))}
        </div>

        {/* SECTION 1: NO-CODE ADMIN REBRANDING */}
        {(activeSection === 'all' || activeSection === 'no-code') && (
          <section className={`rounded-3xl border p-6 sm:p-8 space-y-5 ${cardSurface}`}>
            <div className="border-b border-slate-800/40 pb-4">
              <span className="text-[11px] font-mono font-bold uppercase text-emerald-400">Section 01</span>
              <h2 className="text-xl sm:text-2xl font-extrabold mt-0.5">
                No-Code Brand Customization via the 11-Category Admin Dashboard
              </h2>
              <p className={`text-xs mt-1 ${mutedText}`}>
                Update visual branding, legal info, services, and public copy directly from the Admin interface.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {noCodeItems.map((item) => {
                const IconComp = item.icon;
                return (
                  <div key={item.title} className={`p-5 rounded-2xl border space-y-2 ${subSurface}`}>
                    <div className="flex items-center gap-2 text-emerald-400">
                      <IconComp className="w-4 h-4 shrink-0" />
                      <span className="font-mono text-[11px] font-bold">{item.path}</span>
                    </div>
                    <h3 className="text-sm font-extrabold">{item.title}</h3>
                    <p className={`text-xs leading-relaxed ${mutedText}`}>{item.desc}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 2: PAYMENT DOMAIN CONSTANTS */}
        {(activeSection === 'all' || activeSection === 'payment-code') && (
          <section className={`rounded-3xl border p-6 sm:p-8 space-y-5 ${cardSurface}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/40 pb-4">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase text-amber-500">Section 02</span>
                <h2 className="text-xl sm:text-2xl font-extrabold mt-0.5">
                  Payment Receiver, Pricing &amp; Domain Transfer (<span className="font-mono">src/utils/paymentDomain.ts</span>)
                </h2>
              </div>
              <Code2 className="w-5 h-5 text-amber-500 shrink-0" />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800/60 text-slate-400 font-mono">
                    <th className="py-2.5 pr-4">Constant / Key</th>
                    <th className="py-2.5 pr-4">Current Value</th>
                    <th className="py-2.5">Buyer Transfer Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40">
                  {paymentConstants.map((row) => (
                    <tr key={row.key}>
                      <td className="py-3 pr-4 font-mono font-bold text-amber-500">{row.key}</td>
                      <td className="py-3 pr-4 font-mono">{row.current}</td>
                      <td className={`py-3 ${mutedText}`}>{row.action}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* SECTION 3: INFRASTRUCTURE & STORAGE */}
        {(activeSection === 'all' || activeSection === 'infrastructure') && (
          <section className={`rounded-3xl border p-6 sm:p-8 space-y-5 ${cardSurface}`}>
            <div className="border-b border-slate-800/40 pb-4">
              <span className="text-[11px] font-mono font-bold uppercase text-sky-400">Section 03</span>
              <h2 className="text-xl sm:text-2xl font-extrabold mt-0.5">
                Database, 10 GB Media Storage &amp; Hosting Environment Cutover
              </h2>
              <p className={`text-xs mt-1 ${mutedText}`}>
                Preserve Neon PostgreSQL + Drizzle ORM, Cloudinary chunked upload, Supabase TUS (up to 10 GB), and SMTP mail dispatch during transfer.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {infrastructureItems.map((infra) => {
                const IconComp = infra.icon;
                return (
                  <div key={infra.title} className={`p-5 rounded-2xl border space-y-2.5 ${subSurface}`}>
                    <div className="flex items-center justify-between gap-2">
                      <IconComp className="w-5 h-5 text-sky-400" />
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20">
                        {infra.env}
                      </span>
                    </div>
                    <h3 className="text-sm font-extrabold">{infra.title}</h3>
                    <p className={`text-xs leading-relaxed ${mutedText}`}>{infra.detail}</p>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* SECTION 4: INTERACTIVE LAUNCH CHECKLIST & MOMO SUPPORT */}
        {(activeSection === 'all' || activeSection === 'checklist') && (
          <section className={`rounded-3xl border p-6 sm:p-8 space-y-6 ${cardSurface}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/40 pb-4">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase text-emerald-400">Section 04</span>
                <h2 className="text-xl sm:text-2xl font-extrabold mt-0.5">
                  Interactive 15-Minute Post-Handover Launch Checklist
                </h2>
              </div>
              <span className="font-mono text-xs font-bold text-emerald-400 tabular-nums">
                {Object.values(checkedSteps).filter(Boolean).length} / {checklistSteps.length} Completed
              </span>
            </div>

            <div className="space-y-2.5">
              {checklistSteps.map((step, idx) => {
                const isChecked = !!checkedSteps[idx];
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => toggleChecklistStep(idx)}
                    className={`w-full p-4 rounded-xl border text-left flex items-start gap-3 transition-colors cursor-pointer ${
                      isChecked
                        ? 'bg-emerald-500/10 border-emerald-500/40'
                        : `${subSurface} hover:border-emerald-500/40`
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded flex items-center justify-center shrink-0 mt-0.5 border ${
                        isChecked ? 'bg-emerald-500 border-emerald-400 text-slate-950' : 'border-slate-600'
                      }`}
                    >
                      {isChecked && <Check className="w-3.5 h-3.5" />}
                    </div>
                    <div className="text-xs leading-relaxed">
                      <span className="font-mono font-bold text-emerald-400 mr-2 tabular-nums">Step 0{idx + 1}:</span>
                      <span>{step}</span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Copyable MoMo & OM Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${subSurface}`}>
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase">
                    <Smartphone className="w-4 h-4" />
                    <span>MTN MoMo ({MANUAL_DOWNLOAD_FEE_XAF} XAF)</span>
                  </div>
                  <p className={`text-xs mt-0.5 ${mutedText}`}>Copy number for manual fee confirmation</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {mtnMomoNumbers.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleCopyNumber(num)}
                      className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${cardSurface}`}
                    >
                      <span className="tabular-nums">{num}</span>
                      {copiedNumber === num ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 opacity-70" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${subSurface}`}>
                <div>
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-500 uppercase">
                    <Smartphone className="w-4 h-4" />
                    <span>Orange Money ({MANUAL_DOWNLOAD_FEE_XAF} XAF)</span>
                  </div>
                  <p className={`text-xs mt-0.5 ${mutedText}`}>Admin confirmation email: {ADMIN_SMTP_USER_EMAIL}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {orangeMoneyNumbers.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleCopyNumber(num)}
                      className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${cardSurface}`}
                    >
                      <span className="tabular-nums">{num}</span>
                      {copiedNumber === num ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 opacity-70" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Ownership Certificate Summary Banner */}
            <div className={`p-5 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${subSurface}`}>
              <div className="space-y-1 text-xs">
                <div className="font-bold text-amber-500 uppercase font-mono">
                  Ownership Transfer Certificate Preview
                </div>
                <p>
                  <strong>Seller:</strong> Eric Kreboya ({ADMIN_SMTP_USER_EMAIL}) &nbsp;·&nbsp;{' '}
                  <strong>Buyer:</strong> {buyerName.trim() || '[Buyer Name]'} ({buyerCompany.trim() || '[Company Name]'}) &nbsp;·&nbsp;{' '}
                  <strong>Domain:</strong> <span className="font-mono">{buyerDomain.trim() || '[Target Domain]'}</span>
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                <button
                  type="button"
                  disabled={!isUnlocked}
                  onClick={triggerDownload}
                  className={`px-5 py-2.5 rounded-xl font-black text-xs inline-flex items-center gap-2 whitespace-nowrap shrink-0 ${
                    isUnlocked
                      ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 cursor-pointer'
                      : 'bg-slate-800 text-slate-400 border border-slate-700 cursor-not-allowed opacity-70'
                  }`}
                >
                  {isUnlocked ? <Download className="w-4 h-4" /> : <Lock className="w-4 h-4 text-emerald-400" />}
                  <span>{isUnlocked ? 'Download Personalized A4 PDF' : 'Locked (Unpaid)'}</span>
                </button>
                {!isUnlocked && (
                  <button
                    type="button"
                    onClick={openPaymentGate}
                    className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Pay {MANUAL_DOWNLOAD_FEE_XAF} XAF</span>
                  </button>
                )}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default BuyerHandoverManualPage;
