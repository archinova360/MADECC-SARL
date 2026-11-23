import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Building2,
  Calculator,
  Check,
  Compass,
  Copy,
  CreditCard,
  Download,
  ExternalLink,
  FileText,
  Globe,
  HardHat,
  Key,
  Layers,
  Lock,
  Mail,
  Phone,
  QrCode,
  Scale,
  Search,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Unlock,
  UploadCloud
} from 'lucide-react';
import { downloadWebsiteNavigationGuidePdf } from '../utils/navigationGuidePdf.ts';
import {
  ADMIN_SMTP_USER_EMAIL,
  MANUAL_DOWNLOAD_FEE_XAF,
  NAVIGATION_MANUAL_RECEIPT_NO,
  OFFICIAL_PAYMENT_CONFIG,
  STANDARD_RECEIPT_FEE_XAF,
  isCurrentUserAdmin,
  isReceiptPaid
} from '../utils/paymentDomain.ts';
import { useSiteSettings } from '../lib/SiteSettingsContext.tsx';
import { useTheme } from '../lib/ThemeContext.tsx';

interface NavigationManualPageProps {
  onNavigateToTab: (tab: string, extraState?: any) => void;
}

type ChapterKey = 'overview' | 'public-map' | 'admin-map' | 'studios-uploads' | 'payments-review';

export const NavigationManualPage: React.FC<NavigationManualPageProps> = ({ onNavigateToTab }) => {
  const { settings } = useSiteSettings();
  const { theme } = useTheme();
  const isLight = theme === 'light';

  const [activeChapter, setActiveChapter] = useState<ChapterKey>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  const isAdminUser = isCurrentUserAdmin();
  const isUnlocked = isAdminUser || isReceiptPaid(NAVIGATION_MANUAL_RECEIPT_NO);

  const mtnMomoNumbers = OFFICIAL_PAYMENT_CONFIG?.mtnMomoNumbers || ['671063511', '683316486'];
  const orangeMoneyNumbers = OFFICIAL_PAYMENT_CONFIG?.orangeMoneyNumbers || ['689115595', '640194505'];

  const handleCopyNumber = (num: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(num).catch(() => {});
    }
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  const publicPortals = useMemo(
    () => [
      { id: 'home', title: 'Home & Quick Estimator', category: 'Core', access: 'Public', desc: 'Corporate overview, 10 business divisions showcase, and live m² cost preview.', icon: Building2 },
      { id: 'services', title: 'Engineering & Group Services', category: 'Core', access: 'Public', desc: '10 specialized civil engineering, real estate, pharma, agro-industry, and energy divisions.', icon: Layers },
      { id: 'website-development', title: 'Website Development Services', category: 'Digital', access: 'Public', desc: 'Corporate websites, client portals, MTN MoMo / OM stores, and technical SEO.', icon: Globe },
      { id: 'projects', title: 'Projects Portfolio & Blueprints', category: 'Engineering', access: 'Public', desc: 'Filter completed and active Cameroon projects with 2D CAD specs and milestones.', icon: HardHat },
      { id: 'budget-calculator', title: 'Project Budget Calculator', category: 'Estimators', access: 'Public', desc: '5-Step Quick Wizard and Full Engineering estimator across all 10 regions.', icon: Calculator },
      { id: 'construction-cost-guide', title: 'Construction Cost Guide 2026', category: 'Estimators', access: 'Public', desc: 'Live regional unit prices for cement, steel rebar, sand, gravel, and labour.', icon: FileText },
      { id: 'request-a-quote', title: 'Request a Custom Quote', category: 'Commercial', access: 'Public', desc: 'Upload blueprints and specifications for a fixed-price Bill of Quantities proposal.', icon: Scale },
      { id: 'schedule-consultation', title: 'Schedule Engineering Consultation', category: 'Commercial', access: 'Public', desc: 'Book an office or online session with Senior Civil Engineers at Yaoundé HQ.', icon: Compass },
      { id: 'store', title: 'KRR Bookstore & Textbooks', category: 'Commerce', access: 'Public', desc: 'Eurocode textbooks and civil engineering manuals payable via MoMo/OM in XAF.', icon: ShoppingBag },
      { id: 'order-tracking', title: 'Order Tracking & Digital Unlock', category: 'Commerce', access: 'Public', desc: 'Track Mobile Money payments and download approved digital books.', icon: CreditCard },
      { id: 'tenders', title: 'Tenders & Procurement Bidding', category: 'Commercial', access: 'Public', desc: 'Browse open tenders, download packages, and submit subcontractor bids.', icon: Layers },
      { id: 'client-portal', title: 'Authenticated Client Portal', category: 'Portal', access: 'Client Login', desc: 'Track project site photos, milestone percentages, and pay client invoices.', icon: ShieldCheck },
      { id: 'verify', title: 'Verify Receipt or Contract', category: 'Trust', access: 'Public', desc: 'Validate cryptographic QR codes, RCP- receipt numbers, and CNT- contracts.', icon: QrCode },
      { id: 'developers', title: 'Developer REST API Platform', category: 'Platform', access: 'Public / Key', desc: 'Explore endpoints, rate cards, webhooks, and enterprise API key subscriptions.', icon: Key },
      { id: 'saas-cloud', title: 'Cloud SaaS Multi-Tenant Suite', category: 'Platform', access: 'Public / SaaS', desc: 'Isolated construction company workspaces with custom branding and billing.', icon: Globe },
      { id: 'walkthrough-guide', title: 'Visitor Walkthrough & FAQ', category: 'Guides', access: 'Public', desc: '6-phase interactive platform walkthrough, demo checklists, and FAQ center.', icon: BookOpen },
      { id: 'navigation-manual', title: 'Navigation Manual (A4 PDF)', category: 'Manual', access: `${MANUAL_DOWNLOAD_FEE_XAF} XAF`, desc: '4-page A4 manual and searchable portal reference (Admin downloads free).', icon: Download },
      { id: 'buyer-handover-manual', title: 'Buyer Brand Handover Manual (PDF)', category: 'Manual', access: `${MANUAL_DOWNLOAD_FEE_XAF} XAF`, desc: 'White-label ownership transfer certificate and domain cutover guide.', icon: ShieldCheck }
    ],
    []
  );

  const adminCategories = useMemo(
    () => [
      { code: '01', name: 'Overview & Intelligence', modules: 'Command Center Overview, Executive Analytics & KPIs, AI Construction Intelligence' },
      { code: '02', name: 'Corporate & Governance', modules: 'Business Profile & Legal Registration, 10 Divisions, Real Estate Hub, Pharma Compliance, Investors (Ghana/CM), Governance & Audit Trail' },
      { code: '03', name: 'Construction ERP & Operations', modules: 'Projects Portfolio, Client Directory, Client Portal Access, Site Progress, Photos & Videos, Milestones, Materials Inventory, Equipment Fleet, Subcontractors, Workforce Roster, ERP Analytics' },
      { code: '04', name: 'Engineering & Quantity Surveying', modules: 'Enterprise QS & BOQ Studio, Quantity Take-Off (CAD Studio), Structural Loads & Weights, Labour & Crew Calculator, ERP Estimator, ERP BOQ Manager' },
      { code: '05', name: 'Commerce, CRM & Engagement', modules: 'KRR Bookstore Orders & Verification, Quote Requests & Leads, Consultations Queue, Client Inquiries, Tenders CMS, Suppliers CMS' },
      { code: '06', name: 'Finance, Billing & Payments', modules: 'Payment Confirmations (999 / 2,199 XAF OK Queue), Client Project Invoices, Official Receipt Generator, Receipt & Contract Ledger, ERP Financial Statements' },
      { code: '07', name: 'Documents, Legal & Manuals', modules: 'Pro Document Studio, Commercial Proposal Manager, OHADA Contract Generator, Policy Documents, Manuals & Handover Guides (A4 PDF), CV Builder, Application Letters' },
      { code: '08', name: 'Website CMS & Publishing', modules: 'Website Overview, Page Builder & Hero Studio, Section Editor, Publishing & Staging, Human Review, Revision History, 10 GB Media & Video Libraries, Sliders, Gallery, Services/ESG/FAQ/Blog/Reviews CMS, Legal Pages, Technical SEO, Sitemap, Announcements, Live Optimizer, Global Site Branding' },
      { code: '09', name: 'Marketing & Social Media', modules: 'SEO & Social Media Publisher (Role-isolated workspace for Meta App Review testers)' },
      { code: '10', name: 'People, HR & Education', modules: 'Staff Access & Role Permissions, Leadership Directory, MINESEC Lesson Prep, Syllabus Manager, Extended Lesson Architect' },
      { code: '11', name: 'Platform, Security & Infrastructure', modules: 'SaaS Control Plane, API Platform & MoMo Verification, Developer API Portal CMS, Maintenance Mode & Handover, Play Store (TWA) & cPanel Hosting, Maintenance Scheduler, Security & Threat Monitoring, Database Audit Logs, Publishing Logs, DB & API Docs' }
    ],
    []
  );

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredPortals = publicPortals.filter(
    (p) =>
      !normalizedQuery ||
      p.title.toLowerCase().includes(normalizedQuery) ||
      p.category.toLowerCase().includes(normalizedQuery) ||
      p.desc.toLowerCase().includes(normalizedQuery) ||
      p.id.toLowerCase().includes(normalizedQuery)
  );

  const filteredAdminCategories = adminCategories.filter(
    (c) =>
      !normalizedQuery ||
      c.name.toLowerCase().includes(normalizedQuery) ||
      c.modules.toLowerCase().includes(normalizedQuery) ||
      c.code.includes(normalizedQuery)
  );

  const chapters: { id: ChapterKey; label: string }[] = [
    { id: 'overview', label: 'All Chapters' },
    { id: 'public-map', label: '1. Public Portals (18)' },
    { id: 'admin-map', label: '2. Admin 11 Categories' },
    { id: 'studios-uploads', label: '3. Studios & 10 GB Uploads' },
    { id: 'payments-review', label: '4. Payments & Meta Review' }
  ];

  const pageSurface = isLight ? 'bg-slate-50 text-slate-900' : 'bg-[#0A0A0B] text-slate-100';
  const cardSurface = isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-slate-900/90 border-slate-800 shadow-xl';
  const subSurface = isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950/90 border-slate-800';
  const mutedText = isLight ? 'text-slate-600' : 'text-slate-400';

  return (
    <div className={`min-h-screen py-10 px-4 sm:px-6 lg:px-8 ${pageSurface}`} id="navigation-manual-page">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Breadcrumb Bar */}
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
              onClick={() => onNavigateToTab('walkthrough-guide')}
              className={`font-semibold hover:text-amber-500 cursor-pointer ${mutedText}`}
            >
              Guides &amp; Documentation
            </button>
            <span className={mutedText}>/</span>
            <span className="font-bold text-amber-500">Navigation Manual (A4 PDF)</span>
          </div>

          <button
            type="button"
            onClick={() => onNavigateToTab('buyer-handover-manual')}
            className="inline-flex items-center gap-1.5 font-bold text-emerald-500 hover:text-emerald-400 cursor-pointer"
          >
            <span>Open Buyer Brand Handover Manual (PDF)</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Executive Header Banner */}
        <div className={`rounded-3xl border p-6 sm:p-8 ${cardSurface}`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 max-w-3xl">
              <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-wider">
                <span className="px-2.5 py-1 rounded bg-amber-500/15 text-amber-500 border border-amber-500/30">
                  Version 4.0 • 4-Page A4 PDF
                </span>
                <span className="px-2.5 py-1 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  ISO 9001 &amp; OHADA Operational Reference
                </span>
                <span
                  className={`px-2.5 py-1 rounded inline-flex items-center gap-1 border ${
                    isUnlocked
                      ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
                      : 'bg-slate-800/80 text-slate-300 border-slate-700'
                  }`}
                >
                  {isUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                  {isAdminUser ? 'Admin Free Access' : isUnlocked ? 'Unlocked' : `${MANUAL_DOWNLOAD_FEE_XAF} XAF PDF Unlock`}
                </span>
              </div>

              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
                Navigation Manual (A4 PDF) —{' '}
                <span className="text-amber-500 font-mono tabular-nums">{MANUAL_DOWNLOAD_FEE_XAF} XAF</span>
              </h1>
              <p className={`text-sm leading-relaxed ${mutedText}`}>
                Complete architectural and operational guide to the{' '}
                <strong className={isLight ? 'text-slate-900' : 'text-white'}>{settings?.siteName || 'MADECC GROUP'}</strong>{' '}
                ecosystem: all 18 public portals, the reorganized 11-category Administrative Dashboard, 10 GB direct chunked media uploads,
                payment confirmation via MTN MoMo / Orange Money, and Meta App Review isolation.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => downloadWebsiteNavigationGuidePdf({ generatedBy: 'Navigation Manual Portal' })}
                  className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm inline-flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  id="navigation-manual-download-btn"
                >
                  <Download className="w-4 h-4" />
                  <span>
                    {isUnlocked
                      ? 'Download Navigation Manual (A4 PDF)'
                      : `Pay ${MANUAL_DOWNLOAD_FEE_XAF} XAF & Download A4 PDF`}
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => onNavigateToTab('sitemap')}
                  className={`px-4 py-3 rounded-xl border text-xs sm:text-sm font-bold inline-flex items-center gap-2 transition-colors cursor-pointer ${subSurface}`}
                >
                  <Compass className="w-4 h-4 text-amber-500" />
                  <span>Open Visual Site Map</span>
                </button>
              </div>
            </div>

            {/* A4 Document Specifications Summary Box */}
            <div className={`rounded-2xl border p-5 lg:w-80 shrink-0 space-y-3 text-xs ${subSurface}`}>
              <div className="font-mono text-[11px] font-bold uppercase tracking-wider text-amber-500">
                A4 PDF Dossier Specifications
              </div>
              <div className="space-y-2">
                <div className="flex justify-between gap-3">
                  <span className={mutedText}>Reference Code:</span>
                  <span className="font-mono font-bold">{NAVIGATION_MANUAL_RECEIPT_NO}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className={mutedText}>Paper &amp; Length:</span>
                  <span className="font-mono font-bold tabular-nums">A4 Portrait • 4 Pages</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className={mutedText}>Client Fee:</span>
                  <span className="font-mono font-bold text-amber-500 tabular-nums">{MANUAL_DOWNLOAD_FEE_XAF} XAF</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className={mutedText}>Admin / Staff Fee:</span>
                  <span className="font-mono font-bold text-emerald-500">0 XAF (Instant Free)</span>
                </div>
                <div className="flex justify-between gap-3 pt-2 border-t border-slate-800/50">
                  <span className={mutedText}>SMTP Unlock Desk:</span>
                  <span className="font-mono text-[11px] truncate">{ADMIN_SMTP_USER_EMAIL}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Chapter Filter & Live Search Toolbar */}
        <div className={`rounded-2xl border p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${cardSurface}`}>
          <div className="flex flex-wrap gap-2">
            {chapters.map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => setActiveChapter(ch.id)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                  activeChapter === ch.id
                    ? 'bg-amber-500 text-slate-950 font-black'
                    : isLight
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      : 'bg-slate-950 hover:bg-slate-800 text-slate-300 border border-slate-800'
                }`}
              >
                {ch.label}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-80">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search portals, Admin categories, studios..."
              className={`w-full pl-10 pr-4 py-2 rounded-xl border text-xs focus:outline-none focus:border-amber-500 ${subSurface}`}
            />
          </div>
        </div>

        {/* CHAPTER 1: 18 PUBLIC PORTALS */}
        {(activeChapter === 'overview' || activeChapter === 'public-map') && (
          <section className={`rounded-3xl border p-6 sm:p-8 space-y-5 ${cardSurface}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/40 pb-4">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase text-amber-500">Chapter 01</span>
                <h2 className="text-xl sm:text-2xl font-extrabold mt-0.5">Public Website Portals &amp; 1-Click Launchers</h2>
                <p className={`text-xs mt-1 ${mutedText}`}>
                  Direct navigation directory for visitors, homeowners, corporate buyers, and partner engineering firms.
                </p>
              </div>
              <span className="font-mono text-xs font-bold text-amber-500 tabular-nums">
                {filteredPortals.length} / {publicPortals.length} Portals
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredPortals.map((portal) => {
                const IconComp = portal.icon;
                return (
                  <button
                    key={portal.id}
                    type="button"
                    onClick={() => onNavigateToTab(portal.id)}
                    className={`p-4 rounded-2xl border text-left transition-all hover:border-amber-500/60 flex flex-col justify-between gap-3 cursor-pointer ${subSurface}`}
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-500 flex items-center justify-center shrink-0">
                          <IconComp className="w-4 h-4" />
                        </div>
                        <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800/70 text-slate-300">
                          #{portal.id} • {portal.access}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold">{portal.title}</h3>
                      <p className={`text-xs leading-relaxed ${mutedText}`}>{portal.desc}</p>
                    </div>
                    <span className="text-[11px] font-mono font-bold text-amber-500 inline-flex items-center gap-1">
                      <span>Open Portal</span>
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* CHAPTER 2: 11-CATEGORY ADMIN DASHBOARD ARCHITECTURE */}
        {(activeChapter === 'overview' || activeChapter === 'admin-map') && (
          <section className={`rounded-3xl border p-6 sm:p-8 space-y-5 ${cardSurface}`}>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/40 pb-4">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase text-sky-400">Chapter 02</span>
                <h2 className="text-xl sm:text-2xl font-extrabold mt-0.5">
                  Administrative Dashboard Architecture (11 Functional Categories)
                </h2>
                <p className={`text-xs mt-1 ${mutedText}`}>
                  Cleanly grouped navigation with zero duplicate links, live sidebar search filtering, and Cmd/Ctrl+K quick jump.
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNavigateToTab('admin')}
                className="px-4 py-2 rounded-xl bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-500 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer self-start sm:self-auto"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Open Admin Portal</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredAdminCategories.map((cat) => (
                <div key={cat.code} className={`p-4 rounded-2xl border space-y-1.5 ${subSurface}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-mono font-bold text-amber-500 tabular-nums">CATEGORY {cat.code}</span>
                    <span className="text-[10px] font-mono text-emerald-400">Zero Duplicates</span>
                  </div>
                  <h3 className="text-sm font-extrabold">{cat.name}</h3>
                  <p className={`text-xs leading-relaxed ${mutedText}`}>{cat.modules}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* CHAPTER 3: SPECIALIZED STUDIOS & 10 GB MEDIA UPLOAD ARCHITECTURE */}
        {(activeChapter === 'overview' || activeChapter === 'studios-uploads') && (
          <section className={`rounded-3xl border p-6 sm:p-8 space-y-5 ${cardSurface}`}>
            <div className="border-b border-slate-800/40 pb-4">
              <span className="text-[11px] font-mono font-bold uppercase text-emerald-400">Chapter 03</span>
              <h2 className="text-xl sm:text-2xl font-extrabold mt-0.5">
                Engineering Studios &amp; 10 GB Chunked Media Upload Pipeline
              </h2>
              <p className={`text-xs mt-1 ${mutedText}`}>
                How technical studios export verified documents and how large project videos, CAD archives, and brochures upload up to 10 GB without HTTP 413 errors.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`p-5 rounded-2xl border space-y-2 ${subSurface}`}>
                <Calculator className="w-5 h-5 text-amber-500" />
                <h3 className="text-sm font-bold">QS, BOQ &amp; Eurocode 2 Studios</h3>
                <p className={`text-xs leading-relaxed ${mutedText}`}>
                  Nested Work Breakdown Structures, structural beam/slab/column dimensioning, and regional Cameroon labour costing with A4 PDF &amp; XLSX exports.
                </p>
              </div>
              <div className={`p-5 rounded-2xl border space-y-2 ${subSurface}`}>
                <FileText className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold">OHADA Contracts, Proposals &amp; Receipts</h3>
                <p className={`text-xs leading-relaxed ${mutedText}`}>
                  QR-signed fiscal receipts, FIDIC/OHADA contracts, Pro Document Studio, and MINESEC pedagogical lesson builders.
                </p>
              </div>
              <div className={`p-5 rounded-2xl border space-y-2 ${subSurface}`}>
                <UploadCloud className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold">Direct 10 GB Chunked Media Upload</h3>
                <p className={`text-xs leading-relaxed ${mutedText}`}>
                  Media uploads bypass the 2 MB serverless proxy using signed direct Cloudinary chunked uploads and Supabase Storage TUS resumable transfers up to 10 GB.
                </p>
              </div>
            </div>
          </section>
        )}

        {/* CHAPTER 4: PAYMENT UNLOCK PROTOCOL & SUPPORT */}
        {(activeChapter === 'overview' || activeChapter === 'payments-review') && (
          <section className={`rounded-3xl border p-6 sm:p-8 space-y-6 ${cardSurface}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/40 pb-4">
              <div>
                <span className="text-[11px] font-mono font-bold uppercase text-amber-500">Chapter 04</span>
                <h2 className="text-xl sm:text-2xl font-extrabold mt-0.5">
                  Mobile Money / Orange Money Unlock &amp; Support Contacts
                </h2>
                <p className={`text-xs mt-1 ${mutedText}`}>
                  How 999 XAF manual downloads and 2,199 XAF certified BOQ/Receipt exports are verified via Admin OK + SMTP.
                </p>
              </div>
              <button
                type="button"
                onClick={() => downloadWebsiteNavigationGuidePdf({ generatedBy: 'Navigation Manual Page Payment Box' })}
                className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs inline-flex items-center gap-2 cursor-pointer whitespace-nowrap shrink-0"
              >
                <Download className="w-4 h-4" />
                <span>Download Manual ({MANUAL_DOWNLOAD_FEE_XAF} XAF)</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
              {[
                {
                  step: '01',
                  title: `Transfer ${MANUAL_DOWNLOAD_FEE_XAF} / ${STANDARD_RECEIPT_FEE_XAF} XAF`,
                  body: `Send ${MANUAL_DOWNLOAD_FEE_XAF} XAF for PDF Manuals (or ${STANDARD_RECEIPT_FEE_XAF.toLocaleString()} XAF for Certified Receipts) via MTN MoMo or Orange Money.`
                },
                {
                  step: '02',
                  title: 'Submit in Payment Gate',
                  body: 'Enter sender phone number and transaction reference. Status enters PENDING_ADMIN_CONFIRMATION.'
                },
                {
                  step: '03',
                  title: 'Admin Confirm & Press OK',
                  body: `Admin verifies inside 06. Finance > Payment Confirmations and clicks OK, emailing ${ADMIN_SMTP_USER_EMAIL}.`
                },
                {
                  step: '04',
                  title: 'Instant PDF / Office Unlock',
                  body: 'Download links unlock immediately. Signed-in Admins always download free without payment.'
                }
              ].map((item) => (
                <div key={item.step} className={`p-4 rounded-xl border space-y-2 ${subSurface}`}>
                  <span className="font-mono font-bold text-amber-500 tabular-nums">Step {item.step}</span>
                  <h3 className="font-bold text-sm">{item.title}</h3>
                  <p className={`leading-relaxed ${mutedText}`}>{item.body}</p>
                </div>
              ))}
            </div>

            {/* Copyable Mobile Money Numbers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${subSurface}`}>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-amber-500 uppercase">
                    <Smartphone className="w-4 h-4" />
                    <span>MTN Mobile Money (MoMo)</span>
                  </div>
                  <p className={`text-xs ${mutedText}`}>Click any number to copy for manual transfer</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {mtnMomoNumbers.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleCopyNumber(num)}
                      className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                        isLight ? 'bg-white border-amber-500/40 text-amber-700' : 'bg-slate-900 border-amber-500/40 text-amber-300'
                      }`}
                    >
                      <span className="tabular-nums">{num}</span>
                      {copiedNumber === num ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 opacity-70" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${subSurface}`}>
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-500 uppercase">
                    <Smartphone className="w-4 h-4" />
                    <span>Orange Money (OM)</span>
                  </div>
                  <p className={`text-xs ${mutedText}`}>Click any number to copy for manual transfer</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {orangeMoneyNumbers.map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => handleCopyNumber(num)}
                      className={`px-3 py-1.5 rounded-lg border font-mono text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer ${
                        isLight ? 'bg-white border-orange-500/40 text-orange-700' : 'bg-slate-900 border-orange-500/40 text-orange-300'
                      }`}
                    >
                      <span className="tabular-nums">{num}</span>
                      {copiedNumber === num ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5 opacity-70" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Support Bar */}
            <div className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 ${subSurface}`}>
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <span className="inline-flex items-center gap-1.5 font-semibold">
                  <Mail className="w-4 h-4 text-amber-500" />
                  <span>{ADMIN_SMTP_USER_EMAIL}</span>
                </span>
                <span className="inline-flex items-center gap-1.5 font-mono tabular-nums">
                  <Phone className="w-4 h-4 text-emerald-500" />
                  <span>+237 671 063 511 / +237 640 194 505</span>
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <QrCode className="w-4 h-4 text-sky-500" />
                  <button
                    type="button"
                    onClick={() => onNavigateToTab('verify')}
                    className="underline hover:text-amber-500 cursor-pointer font-semibold"
                  >
                    Verify Receipt or Contract Token
                  </button>
                </span>
              </div>

              <button
                type="button"
                onClick={() => onNavigateToTab('buyer-handover-manual')}
                className="px-4 py-2 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-500 text-xs font-bold inline-flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>View Buyer Brand Handover Manual</span>
              </button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
};

export default NavigationManualPage;
