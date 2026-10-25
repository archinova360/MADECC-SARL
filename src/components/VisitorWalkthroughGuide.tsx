import React, { useState } from 'react';
import {
  Compass,
  BookOpen,
  Calculator,
  FileText,
  Building2,
  Briefcase,
  Calendar,
  ShieldCheck,
  CreditCard,
  Smartphone,
  CheckCircle2,
  ArrowRight,
  Download,
  Copy,
  Check,
  Search,
  Sparkles,
  Layers,
  HelpCircle,
  Phone,
  Mail,
  MapPin,
  Lock,
  Unlock,
  QrCode,
  FileCheck2,
  HardHat,
  Key,
  ChevronDown,
  ChevronUp,
  Play,
  ExternalLink,
  Award
} from 'lucide-react';
import { motion } from 'motion/react';
import { downloadWebsiteNavigationGuidePdf } from '../utils/navigationGuidePdf.ts';
import { downloadBuyerHandoverManualPdf } from '../utils/buyerHandoverPdf.ts';
import {
  OFFICIAL_PAYMENT_CONFIG,
  STANDARD_RECEIPT_FEE_XAF,
  ADMIN_SMTP_USER_EMAIL
} from '../utils/paymentDomain.ts';
import { useSiteSettings } from '../lib/SiteSettingsContext.tsx';

interface VisitorWalkthroughGuideProps {
  onNavigateToTab: (tab: string, extraState?: any) => void;
}

type PersonaType = 'all' | 'homeowners' | 'corporate' | 'payments' | 'enterprise';

interface WalkthroughStep {
  id: string;
  stepNumber: number;
  title: string;
  subtitle: string;
  badge: string;
  personas: PersonaType[];
  icon: React.ElementType;
  accentColor: string;
  description: string;
  howToSteps: string[];
  proTip: string;
  primaryAction: {
    label: string;
    targetTab: string;
  };
  secondaryAction?: {
    label: string;
    targetTab: string;
  };
}

export const VisitorWalkthroughGuide: React.FC<VisitorWalkthroughGuideProps> = ({
  onNavigateToTab
}) => {
  const { settings } = useSiteSettings();
  const mtnMomoNumbers = OFFICIAL_PAYMENT_CONFIG?.mtnMomoNumbers || ['671063511', '683316486'];
  const orangeMoneyNumbers = OFFICIAL_PAYMENT_CONFIG?.orangeMoneyNumbers || ['689115595', '640194505'];
  const [selectedPersona, setSelectedPersona] = useState<PersonaType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [expandedFaq, setExpandedFaq] = useState<number | null>(0);

  const handleCopyNumber = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  const toggleStepComplete = (id: string) => {
    setCompletedSteps((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const walkthroughSteps: WalkthroughStep[] = [
    {
      id: 'explore-portfolio',
      stepNumber: 1,
      title: 'Explore Engineering Services & Live Project Portfolio',
      subtitle: 'Discover our Eurocode 2 / BAEL 91 civil engineering capabilities and inspect real construction projects across Cameroon.',
      badge: 'Phase 1 • Discovery',
      personas: ['all', 'homeowners', 'corporate'],
      icon: Building2,
      accentColor: 'amber',
      description:
        'Start your journey by exploring MADECC GROUP’s core disciplines—Structural Engineering, Residential Villas, Commercial Complexes, Road & Bridge Infrastructure, Geotechnical Studies, and Solar Energy Systems. Each project in our portfolio includes technical specifications, location data, and interactive 2D/3D CAD blueprint previews.',
      howToSteps: [
        'Click "Services" in the top navigation bar to browse specialized civil & structural packages and deliverables.',
        'Click on any service card to inspect included architectural drawings, soil tests, and structural calculations.',
        'Visit "Projects" to filter completed and ongoing builds by category (Residential, Commercial, Civil Works) and inspect interactive blueprints.'
      ],
      proTip:
        'Click directly on any service’s "Request Quote for this Service" button to pre-fill your project inquiry automatically.',
      primaryAction: {
        label: 'Explore Our Services',
        targetTab: 'services'
      },
      secondaryAction: {
        label: 'View Projects Portfolio',
        targetTab: 'projects'
      }
    },
    {
      id: 'instant-budgeting',
      stepNumber: 2,
      title: 'Calculate Your Project Budget & Check 2026 Material Rates',
      subtitle: 'Get instant, accurate FCFA cost estimates and regional building material prices before breaking ground.',
      badge: 'Phase 2 • Costing & Planning',
      personas: ['all', 'homeowners', 'corporate'],
      icon: Calculator,
      accentColor: 'emerald',
      description:
        'Use our interactive Project Budget Calculator (choose between the Quick 5-Step Guided Wizard or Full Engineering Mode) to estimate structural, finishing, and labour costs in FCFA. Pair this with our 2026 Cameroon Construction Cost Guide to compare live cement, rebar, sand, gravel, and daily artisan rates across all 10 regions.',
      howToSteps: [
        'Open "Tools > Budget Calculator" and select your building type (Duplex Villa, Apartment Block, Office Building, or Warehouse).',
        'Adjust your total floor area (m²), number of floors, soil/foundation condition, and finishing quality (Economic, Standard, or Luxury).',
        'Review your instant phase-by-phase breakdown (Substructure, Superstructure, Roofing, MEP, Finishes) and estimated material quantities.',
        'Open "Tools > Cost Guide 2026" to inspect regional price multipliers for Yaoundé, Douala, Kribi, Buea, Bafoussam, Bamenda, Garoua, and more.'
      ],
      proTip:
        'Use the 5-Step Guided Wizard in the Budget Calculator if you are a first-time homeowner—it explains every construction choice in plain language.',
      primaryAction: {
        label: 'Launch Budget Calculator',
        targetTab: 'budget-calculator'
      },
      secondaryAction: {
        label: 'Open 2026 Cost Guide',
        targetTab: 'construction-cost-guide'
      }
    },
    {
      id: 'quotes-consultations-tenders',
      stepNumber: 3,
      title: 'Request a Fixed-Price Quote, Book a Consultation, or Bid on Tenders',
      subtitle: 'Connect directly with our senior civil engineers in Yaoundé or submit proposals for active procurement tenders.',
      badge: 'Phase 3 • Engagement',
      personas: ['all', 'homeowners', 'corporate'],
      icon: Calendar,
      accentColor: 'blue',
      description:
        'Ready to move from estimation to execution? Submit your architectural plans or plot details via our Request a Quote form for an itemized Bill of Quantities (BoQ), book a 1-on-1 engineering consultation (in-person at Mbankolo, Yaoundé or via video call), or browse open construction tenders and contractor pre-qualification RFPs.',
      howToSteps: [
        'Click "Request a Quote" to send your project scope, target timeline, land location, and optional blueprint attachments.',
        'Click "Consultation" to pick a preferred date and time slot with our Managing Director & Lead Structural Engineers.',
        'Contractors & suppliers: visit "Tenders & Procurement" to review open bidding packages, BOQ requirements, and submission deadlines.'
      ],
      proTip:
        'Have an urgent site inquiry? Use the Floating Contact Hub in the bottom-right corner for instant WhatsApp or phone dispatch.',
      primaryAction: {
        label: 'Request a Free Quote',
        targetTab: 'request-a-quote'
      },
      secondaryAction: {
        label: 'Schedule Consultation',
        targetTab: 'schedule-consultation'
      }
    },
    {
      id: 'payment-unlock-workflow',
      stepNumber: 4,
      title: 'Pay 2,199 XAF & Unlock Official Receipts & Document Downloads',
      subtitle: 'How our secure Mobile Money / Orange Money payment and Admin Dashboard confirmation ("Confirm & Press OK") works.',
      badge: 'Phase 4 • Official Exports (2,199 XAF)',
      personas: ['all', 'homeowners', 'corporate', 'payments'],
      icon: CreditCard,
      accentColor: 'amber',
      description:
        `To protect document integrity and issue cryptographically certified engineering dossiers, client downloads of official PDF Receipts, Itemized BoQs, Cost Guides, and Contracts carry a flat processing fee of only ${STANDARD_RECEIPT_FEE_XAF.toLocaleString()} XAF (reduced from 15,000 XAF). Once paid, the Administrator confirms your payment in the Admin Dashboard and presses OK—dispatching an official SMTP confirmation to ${ADMIN_SMTP_USER_EMAIL} and unlocking all your download links immediately!`,
      howToSteps: [
        `Click any "Download PDF / Export Receipt" button on the platform to open the Official Payment Gate (${STANDARD_RECEIPT_FEE_XAF.toLocaleString()} XAF).`,
        `Send ${STANDARD_RECEIPT_FEE_XAF.toLocaleString()} XAF via MTN Mobile Money (${mtnMomoNumbers.join(' or ')}) or Orange Money (${orangeMoneyNumbers.join(' or ')}).`,
        'Enter your sender phone number and click "Submit 2,199 XAF Payment for Admin Confirmation". Your status becomes Pending Admin Confirmation.',
        `The Admin verifies the transaction in the Admin Dashboard and clicks "Confirm & Press OK", which dispatches an SMTP verification email to ${ADMIN_SMTP_USER_EMAIL}.`,
        'As soon as Admin presses OK, your Receipt PDF, Itemized BoQ, Word (DOCX), and Excel (XLSX) download buttons unlock automatically!'
      ],
      proTip:
        'Note for Administrators: When signed in as an Admin, you never have to pay before downloading or exporting—all Admin exports are 100% free and instant.',
      primaryAction: {
        label: 'Try Budget Calculator Export',
        targetTab: 'budget-calculator'
      },
      secondaryAction: {
        label: 'Open 2026 Cost Guide Export',
        targetTab: 'construction-cost-guide'
      }
    },
    {
      id: 'verify-contracts-receipts',
      stepNumber: 5,
      title: 'Verify Official Contracts, BoQs & Receipts via QR or Token',
      subtitle: 'Instant cryptographic authenticity check for clients, banks, landowners, and regulatory auditors.',
      badge: 'Phase 5 • Verification & Trust',
      personas: ['all', 'corporate', 'payments'],
      icon: ShieldCheck,
      accentColor: 'emerald',
      description:
        'Every official contract, Bill of Quantities, and fiscal receipt issued by MADECC GROUP includes a tamper-proof QR code and a unique verification reference (e.g., RCP-... or CNT-...). Clients, financial institutions, and project partners can verify any document’s status, payment clearance, and digital signatures in seconds.',
      howToSteps: [
        'Navigate to the "Verify Document" portal (#verify) or scan the QR code printed on your MADECC receipt or contract.',
        'Enter your Document Token or Receipt Number (or use your device camera to scan the QR code directly).',
        'Inspect the live verification certificate showing client details, project title, digital signatures, and payment confirmation status.',
        'Download your certified PDF copy once payment is confirmed by the Administrator.'
      ],
      proTip:
        'You can also digitally countersign contracts directly inside the Verification Portal using the interactive Signature Pad.',
      primaryAction: {
        label: 'Open Document Verification Portal',
        targetTab: 'verify'
      },
      secondaryAction: {
        label: 'View Active Tenders',
        targetTab: 'tenders'
      }
    },
    {
      id: 'enterprise-studios-api',
      stepNumber: 6,
      title: 'Enterprise Engineering Studios, Cloud SaaS & Developer APIs',
      subtitle: '8 specialized technical computing studios, multi-tenant construction workspaces, and REST API endpoints.',
      badge: 'Phase 6 • Enterprise & Admin',
      personas: ['all', 'enterprise'],
      icon: Layers,
      accentColor: 'purple',
      description:
        'For MADECC staff, administrators, partner engineering firms, and software developers, the platform features 8 specialized studios (BoQ Studio, Eurocode 2 Structural Calculator, Labour Estimator, 2D CAD Drawing Takeoff, Legal Contract Generator, Fiscal Receipt Studio, Proposal Architect, and Pedagogical Studio), plus a REST API Developer Portal.',
      howToSteps: [
        'Developers & Integrators: Open "Tools > Developer APIs" to inspect REST endpoints for regional material rates, automated BoQ generation, and webhooks.',
        'Engineering Firms: Visit "Tools > Cloud SaaS Platform" to explore multi-tenant workspace capabilities for construction companies.',
        'Administrators: Sign in to the Admin Command Center to manage quotes, approve 2,199 XAF client payments ("Confirm & Press OK"), and export from all 8 studios for free.'
      ],
      proTip:
        'Download the A4 PDF Walkthrough Manual below to keep a printable reference of all 8 engineering studios and Meta App Review protocols.',
      primaryAction: {
        label: 'Explore Developer APIs',
        targetTab: 'developers'
      },
      secondaryAction: {
        label: 'Explore Cloud SaaS Platform',
        targetTab: 'saas-cloud'
      }
    }
  ];

  const filteredSteps = walkthroughSteps.filter((step) => {
    const matchesPersona = selectedPersona === 'all' || step.personas.includes(selectedPersona);
    const matchesSearch =
      !searchQuery.trim() ||
      step.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      step.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      step.howToSteps.some((s) => s.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesPersona && matchesSearch;
  });

  const quickDirectory = [
    { id: 'home', label: 'Home & Quick Estimator', desc: 'Hero overview, live stats & quick m² calculator', icon: Building2 },
    { id: 'services', label: 'Engineering Services', desc: 'Civil works, structural design, roads & solar', icon: Briefcase },
    { id: 'projects', label: 'Projects Portfolio', desc: 'Completed & ongoing builds with CAD blueprints', icon: HardHat },
    { id: 'budget-calculator', label: 'Project Budget Calculator', desc: '5-Step Wizard & Full Engineering cost calculator', icon: Calculator },
    { id: 'construction-cost-guide', label: 'Cost Guide 2026', desc: 'Cameroon regional material & labour price index', icon: FileText },
    { id: 'request-a-quote', label: 'Request a Free Quote', desc: 'Submit architectural plans for a fixed-price BoQ', icon: FileCheck2 },
    { id: 'schedule-consultation', label: 'Schedule Consultation', desc: 'Book an office or video meeting with engineers', icon: Calendar },
    { id: 'tenders', label: 'Tenders & Procurement', desc: 'Open construction RFPs & contractor bidding', icon: Award },
    { id: 'verify', label: 'Verify Contract / Receipt', desc: 'Scan QR code or verify document authenticity', icon: QrCode },
    { id: 'faq', label: 'FAQ & Help Center', desc: 'Answers on timelines, warranties & payments', icon: HelpCircle },
    { id: 'developers', label: 'Developer REST API', desc: 'Construction cost & BoQ API documentation', icon: Key },
    { id: 'contact', label: 'Contact & Yaoundé HQ', desc: 'Direct phones, WhatsApp & office coordinates', icon: Phone }
  ];

  const walkthroughFaqs = [
    {
      q: 'How much do visitors and clients pay to download official receipts, BoQs, or PDF cost guides?',
      a: `Clients pay a flat fee of only ${STANDARD_RECEIPT_FEE_XAF.toLocaleString()} XAF (not 15,000 XAF) via MTN Mobile Money (${mtnMomoNumbers.join(', ')}) or Orange Money (${orangeMoneyNumbers.join(', ')}). Browsing the website, using the interactive calculators on-screen, and submitting quote inquiries are 100% free.`
    },
    {
      q: 'When do the receipt and document download links start working after I pay 2,199 XAF?',
      a: `After you submit your ${STANDARD_RECEIPT_FEE_XAF.toLocaleString()} XAF payment in the Payment Modal, your request is sent to the Admin Dashboard in "Pending Admin Confirmation" status. Once the Administrator verifies your transfer and clicks "Confirm & Press OK" in the Admin Dashboard, an automated confirmation message is dispatched via SMTP to ${ADMIN_SMTP_USER_EMAIL}, and all your receipt and document download links unlock immediately!`
    },
    {
      q: 'Does the Administrator need to pay before downloading or exporting documents?',
      a: 'No. When signed in as an Administrator, all downloads and exports (PDF, Word DOCX, Excel XLSX, CSV, and Official Receipts) across BoQ Studio, Document Studio, Proposal Studio, and Calculators are 100% free with zero payment required.'
    },
    {
      q: 'How can I get a custom Bill of Quantities (BoQ) for my specific land plot and architectural drawings?',
      a: 'Simply visit the "Request a Quote" page or "Schedule Consultation" page. Provide your plot location, building dimensions, and desired finish level, or message us directly on WhatsApp (+237 671 063 511 / +237 640 194 505) to send your architectural PDF/CAD plans.'
    },
    {
      q: 'Can I download this complete walkthrough guide as a printable A4 PDF?',
      a: 'Yes! Click any "Download Complete A4 Walkthrough Guide (PDF)" button on this page, in the top navigation bar, or in the website footer to save the full multi-page manual to your phone or computer.'
    }
  ];

  const completionPercentage = Math.round((completedSteps.length / walkthroughSteps.length) * 100);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-12">
        {/* ============================================================
            HERO HEADER & DOWNLOADABLE PDF MANUAL CTA
            ============================================================ */}
        <div className="relative rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900/95 to-amber-950/30 border border-amber-500/30 p-6 sm:p-10 lg:p-12 shadow-2xl overflow-hidden">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="max-w-3xl space-y-4">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono uppercase tracking-widest font-bold">
                <Compass className="w-4 h-4 animate-spin" style={{ animationDuration: '12s' }} />
                Official Visitor &amp; Client Interactive Walkthrough Guide
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                How to Navigate &amp; Use the{' '}
                <span className="text-amber-400">{settings?.siteName || 'MADECC GROUP'}</span> Platform
              </h1>
              <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                Welcome! Whether you are a homeowner estimating your dream villa, a corporate client requesting an itemized Bill of Quantities (BoQ), or a client unlocking certified receipts and engineering downloads for only{' '}
                <strong className="text-amber-400 font-mono">{STANDARD_RECEIPT_FEE_XAF.toLocaleString()} XAF</strong>, this complete step-by-step guide walks you through every tool on our website.
              </p>

              <div className="flex flex-wrap items-center gap-3 pt-2">
                <button
                  onClick={() => downloadWebsiteNavigationGuidePdf()}
                  className="px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs sm:text-sm flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                  id="walkthrough-download-pdf-hero"
                >
                  <Download className="w-4 h-4" />
                  Navigation Manual (A4 PDF) — 999 XAF
                </button>
                <button
                  onClick={() => downloadBuyerHandoverManualPdf({ sellerEmail: ADMIN_SMTP_USER_EMAIL })}
                  className="px-5 py-3.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer"
                  id="walkthrough-download-buyer-handover-pdf"
                >
                  <FileText className="w-4 h-4 text-emerald-400" />
                  Buyer Brand Handover Manual (PDF) — 999 XAF
                </button>
                <button
                  onClick={() => onNavigateToTab('budget-calculator')}
                  className="px-5 py-3.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs sm:text-sm border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Calculator className="w-4 h-4 text-amber-400" />
                  Try Budget Calculator
                </button>
                <button
                  onClick={() => onNavigateToTab('request-a-quote')}
                  className="px-5 py-3.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 font-bold text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer"
                >
                  Request a Free Quote <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Interactive Exploration Progress Card */}
            <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-5 sm:p-6 lg:w-80 shrink-0 space-y-4 shadow-xl">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                  Your Tour Progress
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-mono text-xs font-bold">
                  {completedSteps.length} / {walkthroughSteps.length} Steps
                </span>
              </div>
              <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-500"
                  style={{ width: `${Math.max(8, completionPercentage)}%` }}
                />
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Check off each phase below as you explore our calculators, cost guides, quote forms, and verification tools.
              </p>
              <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px] text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Standard Document Fee:</span>
                  <span className="font-mono font-bold text-emerald-400">{STANDARD_RECEIPT_FEE_XAF.toLocaleString()} XAF</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">MTN MoMo:</span>
                  <span className="font-mono text-amber-300">{mtnMomoNumbers.join(' / ')}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Orange Money:</span>
                  <span className="font-mono text-orange-300">{orangeMoneyNumbers.join(' / ')}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            HIGHLIGHTED WORKFLOW: 2,199 XAF PAYMENT & ADMIN OK UNLOCK
            ============================================================ */}
        <div className="rounded-3xl bg-slate-900/90 border-2 border-amber-500/30 p-6 sm:p-8 shadow-xl space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
            <div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-mono font-bold uppercase tracking-wider mb-2">
                <ShieldCheck className="w-3.5 h-3.5" /> Official Client Payment &amp; Download Unlock Guide
              </span>
              <h2 className="text-xl sm:text-2xl font-extrabold text-white">
                How Document &amp; Receipt Downloads Work ({STANDARD_RECEIPT_FEE_XAF.toLocaleString()} XAF Only)
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Follow these 4 simple steps whenever you want to download an official PDF Receipt, Itemized BoQ, Budget Report, or Contract.
              </p>
            </div>
            <div className="px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-right shrink-0">
              <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">Flat Client Rate</span>
              <span className="text-xl font-black font-mono text-amber-400">{STANDARD_RECEIPT_FEE_XAF.toLocaleString()} XAF</span>
              <span className="block text-[10px] text-emerald-400 font-semibold">Admin Downloads: 100% Free</span>
            </div>
          </div>

          {/* 4-Step Visual Pipeline */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">
                  1
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                  Mobile Transfer
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">Send 2,199 XAF via MoMo or OM</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Transfer <strong className="text-white">{STANDARD_RECEIPT_FEE_XAF.toLocaleString()} XAF</strong> to any of our official MTN Mobile Money or Orange Money numbers listed below.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-blue-500 text-white font-black text-xs flex items-center justify-center">
                  2
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-blue-400 font-bold">
                  Submit Request
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">Submit Payment in Modal</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Enter your sender phone number in the Payment Gate Modal and submit. Downloads stay locked in <span className="text-amber-300 font-mono">Pending Admin Confirmation</span>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-slate-950/90 border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-purple-500 text-white font-black text-xs flex items-center justify-center">
                  3
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-purple-400 font-bold">
                  Admin Presses OK
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">Admin Confirms &amp; Dispatches SMTP</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Admin verifies your payment in the Admin Dashboard and clicks <strong className="text-emerald-400">&ldquo;Confirm &amp; Press OK&rdquo;</strong>, dispatching SMTP notification to <span className="font-mono text-amber-300">{ADMIN_SMTP_USER_EMAIL}</span>.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-950/25 border border-emerald-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs flex items-center justify-center">
                  4
                </span>
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold flex items-center gap-1">
                  <Unlock className="w-3 h-3" /> Instant Unlock
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">Download Links Work Immediately</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Only after Admin presses OK and SMTP dispatches do your Receipt PDF, BoQ, Word, and Excel download links unlock!
              </p>
            </div>
          </div>

          {/* Interactive Copyable Payment Numbers Bar */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-amber-400 uppercase tracking-wider">
                  <Smartphone className="w-4 h-4" /> Official MTN Mobile Money (MoMo)
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">Click any number to copy for your 2,199 XAF transfer:</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {mtnMomoNumbers.map((num) => (
                  <button
                    key={num}
                    onClick={() => handleCopyNumber(num)}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-amber-500/40 text-amber-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>{num}</span>
                    {copiedNumber === num ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-wider">
                  <Smartphone className="w-4 h-4" /> Official Orange Money (OM)
                </div>
                <p className="text-[11px] text-slate-300 mt-0.5">Click any number to copy for your 2,199 XAF transfer:</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {orangeMoneyNumbers.map((num) => (
                  <button
                    key={num}
                    onClick={() => handleCopyNumber(num)}
                    className="px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-900 border border-orange-500/40 text-orange-300 font-mono text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <span>{num}</span>
                    {copiedNumber === num ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            PERSONA FILTER & SEARCH BAR
            ============================================================ */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-slate-900/70 border border-slate-800 p-4 rounded-2xl">
          <div className="flex flex-wrap items-center gap-2">
            {[
              { id: 'all', label: 'Complete Walkthrough (All 6 Phases)' },
              { id: 'homeowners', label: 'Homeowners & Private Builders' },
              { id: 'corporate', label: 'Corporate & Tenders' },
              { id: 'payments', label: '2,199 XAF Payment & Downloads' },
              { id: 'enterprise', label: 'Admin, Studios & APIs' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedPersona(tab.id as PersonaType)}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  selectedPersona === tab.id
                    ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950 text-slate-300 hover:text-white border border-slate-800'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search guide steps (e.g. BoQ, MoMo)..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
            />
          </div>
        </div>

        {/* ============================================================
            STEP-BY-STEP INTERACTIVE WALKTHROUGH CARDS
            ============================================================ */}
        <div className="space-y-6">
          {filteredSteps.map((step) => {
            const IconComponent = step.icon;
            const isDone = completedSteps.includes(step.id);

            return (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-3xl border p-6 sm:p-8 transition-all ${
                  isDone
                    ? 'bg-emerald-950/15 border-emerald-500/40'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                  <div className="space-y-4 flex-1">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 font-mono font-black text-sm flex items-center justify-center">
                        0{step.stepNumber}
                      </span>
                      <span className="px-3 py-1 rounded-full bg-slate-950 border border-slate-800 text-[11px] font-mono uppercase tracking-wider text-amber-400 font-bold">
                        {step.badge}
                      </span>
                      {isDone && (
                        <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Completed
                        </span>
                      )}
                    </div>

                    <div>
                      <h3 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2.5">
                        <IconComponent className="w-6 h-6 text-amber-400 shrink-0" />
                        <span>{step.title}</span>
                      </h3>
                      <p className="text-xs sm:text-sm text-amber-300/90 font-medium mt-1">
                        {step.subtitle}
                      </p>
                    </div>

                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                      {step.description}
                    </p>

                    {/* Numbered How-To Checklist */}
                    <div className="bg-slate-950/80 border border-slate-800/90 rounded-2xl p-4 sm:p-5 space-y-2.5">
                      <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
                        Step-by-Step Instructions for Visitors &amp; Clients:
                      </div>
                      <ul className="space-y-2">
                        {step.howToSteps.map((instruction, idx) => (
                          <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-200">
                            <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <span>{instruction}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Pro Tip Box */}
                    <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                      <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-amber-400">Visitor Pro Tip:</strong> {step.proTip}
                      </div>
                    </div>
                  </div>

                  {/* Action Panel */}
                  <div className="flex flex-col sm:flex-row lg:flex-col gap-3 lg:w-64 shrink-0 pt-2 lg:pt-0">
                    <button
                      onClick={() => onNavigateToTab(step.primaryAction.targetTab)}
                      className="w-full px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/15 transition-all cursor-pointer"
                    >
                      <Play className="w-3.5 h-3.5 fill-current" />
                      <span>{step.primaryAction.label}</span>
                    </button>

                    {step.secondaryAction && (
                      <button
                        onClick={() => onNavigateToTab(step.secondaryAction!.targetTab)}
                        className="w-full px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 font-bold text-xs border border-slate-700 flex items-center justify-center gap-2 transition-all cursor-pointer"
                      >
                        <span>{step.secondaryAction.label}</span>
                        <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
                      </button>
                    )}

                    <button
                      onClick={() => toggleStepComplete(step.id)}
                      className={`w-full px-4 py-2.5 rounded-xl font-bold text-xs border flex items-center justify-center gap-2 transition-all cursor-pointer ${
                        isDone
                          ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                          : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                      }`}
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{isDone ? 'Step Completed' : 'Mark Step as Read'}</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* ============================================================
            COMPLETE INTERACTIVE WEBSITE DIRECTORY (1-CLICK LAUNCHERS)
            ============================================================ */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest text-amber-400 font-bold">
                Quick-Jump Portal Map
              </span>
              <h2 className="text-2xl font-extrabold text-white mt-1">
                Complete Website Directory &amp; 1-Click Module Launchers
              </h2>
            </div>
            <button
              onClick={() => downloadWebsiteNavigationGuidePdf()}
              className="px-4 py-2.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-amber-500/40 text-amber-400 font-bold text-xs flex items-center gap-2 self-start sm:self-auto cursor-pointer"
            >
              <Download className="w-4 h-4" />
              Navigation Manual (A4 PDF) — 999 XAF
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {quickDirectory.map((item) => {
              const DirIcon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => onNavigateToTab(item.id)}
                  className="group p-4 rounded-2xl bg-slate-950/90 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-left transition-all flex flex-col justify-between gap-3 cursor-pointer"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                        <DirIcon className="w-4 h-4" />
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-500 group-hover:text-amber-400 transition-colors" />
                    </div>
                    <h3 className="text-sm font-bold text-white group-hover:text-amber-400 transition-colors">
                      {item.label}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                  </div>
                  <span className="text-[11px] font-mono text-amber-400 font-bold flex items-center gap-1">
                    Open Page <ArrowRight className="w-3 h-3" />
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* ============================================================
            VISITOR & CLIENT FREQUENTLY ASKED WALKTHROUGH QUESTIONS
            ============================================================ */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <div>
            <span className="text-xs font-mono uppercase tracking-widest text-emerald-400 font-bold">
              Visitor &amp; Client Support
            </span>
            <h2 className="text-2xl font-extrabold text-white mt-1">
              Frequently Asked Questions About Using This Website
            </h2>
          </div>

          <div className="space-y-3">
            {walkthroughFaqs.map((faq, index) => {
              const isOpen = expandedFaq === index;
              return (
                <div
                  key={index}
                  className="rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden"
                >
                  <button
                    onClick={() => setExpandedFaq(isOpen ? null : index)}
                    className="w-full px-5 py-4 text-left flex items-center justify-between gap-4 hover:bg-slate-900/60 transition-colors cursor-pointer"
                  >
                    <span className="text-sm font-bold text-white">{faq.q}</span>
                    {isOpen ? (
                      <ChevronUp className="w-4 h-4 text-amber-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400 shrink-0" />
                    )}
                  </button>
                  {isOpen && (
                    <div className="px-5 pb-4 pt-1 text-xs sm:text-sm text-slate-300 leading-relaxed border-t border-slate-900">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Direct Support Footer Banner */}
          <div className="p-5 rounded-2xl bg-gradient-to-r from-amber-500/10 via-slate-950 to-emerald-500/10 border border-amber-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400" />
                Need Personal Assistance From Our Engineering Desk?
              </h3>
              <p className="text-xs text-slate-300">
                Email <strong className="text-amber-400 font-mono">{ADMIN_SMTP_USER_EMAIL}</strong> or WhatsApp{' '}
                <strong className="text-emerald-400 font-mono">+237 671 063 511 / +237 640 194 505</strong> for immediate help with quotes, receipts, or site consultations.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2.5 shrink-0">
              <button
                onClick={() => onNavigateToTab('contact')}
                className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs cursor-pointer"
              >
                Contact Our Office
              </button>
              <button
                onClick={() => downloadWebsiteNavigationGuidePdf()}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs border border-slate-700 flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" />
                Navigation Manual (A4 PDF — 999 XAF)
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisitorWalkthroughGuide;
