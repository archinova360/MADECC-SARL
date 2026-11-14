import React, { useState } from 'react';
import { 
  Compass, 
  FileText, 
  Download, 
  ExternalLink, 
  CheckCircle2, 
  Building2, 
  Calculator, 
  Briefcase, 
  BookOpen, 
  ShieldCheck, 
  ShoppingBag, 
  Search, 
  ArrowRight,
  Layers,
  Sparkles,
  Lock,
  Globe,
  Code
} from 'lucide-react';
import { downloadWebsiteNavigationGuidePdf } from '../utils/navigationGuidePdf.ts';
import { downloadBuyerHandoverManualPdf } from '../utils/buyerHandoverPdf.ts';

interface SiteMapProps {
  onNavigateToTab?: (tab: string, state?: any) => void;
}

export default function SiteMap({ onNavigateToTab }: SiteMapProps) {
  const [filterQuery, setFilterQuery] = useState('');

  const navigate = (tab: string) => {
    if (onNavigateToTab) {
      onNavigateToTab(tab);
    }
  };

  const sections = [
    {
      title: 'Commercial Portals & Client Services',
      description: 'Public operations, heavy civil engineering, and client quotation tools',
      icon: Building2,
      color: 'amber',
      links: [
        { name: 'Home Landing Page', tab: 'home', desc: 'Hero video loop, value propositions, and live corporate coordinates' },
        { name: 'Client Portal (Progress, Media & Invoices)', tab: 'client-portal', desc: 'Dedicated login for project clients to monitor phases, photos, milestones & pay invoices' },
        { name: 'Engineering Services', tab: 'services', desc: 'Civil engineering, structural design, MEP, turnkey construction' },
        { name: 'Projects Portfolio', tab: 'projects', desc: 'Active construction sites, milestones, and completed landmarks' },
        { name: 'Request a Quote', tab: 'request-a-quote', desc: 'Custom construction quotation with automated BOQ calculations' },
        { name: 'Schedule Consultation', tab: 'schedule-consultation', desc: 'Direct appointment booking with Senior Civil Engineers in Yaoundé & Douala' },
        { name: 'Tenders & Procurement', tab: 'tenders', desc: 'Active contractor tenders, bid submissions, and subcontractor applications' }
      ]
    },
    {
      title: 'Educational Bookstore & Publications Hub',
      description: 'Secured digital textbooks, eurocode engineering guides, and study materials',
      icon: BookOpen,
      color: 'emerald',
      links: [
        { name: 'KRR Bookstore & Textbooks', tab: 'store', desc: 'Cameroon Civil Engineering & Eurocode manuals, academic publications' },
        { name: 'Order Tracking & Digital Downloads', tab: 'order-tracking', desc: 'Real-time payment tracking, TXID review, and secured PDF activation' },
        { name: 'Visitor & Client Walkthrough Guide', tab: 'walkthrough-guide', desc: 'Interactive visual step-by-step tour through the MADECC platform' }
      ]
    },
    {
      title: 'Cost Estimation & Financial Engines',
      description: 'Live cost calculators, regional Cameroonian unit prices, and budget forecasting',
      icon: Calculator,
      color: 'blue',
      links: [
        { name: 'Project Budget Calculator', tab: 'budget-calculator', desc: 'Real-time FCFA estimation for foundations, framing, finishes, and MEP' },
        { name: 'Construction Cost Guide', tab: 'construction-cost-guide', desc: 'Current market rates for cement, gravel, sand, rebar, and labor across Cameroon' }
      ]
    },
    {
      title: 'Developer Platform & System Governance',
      description: 'REST API endpoints, integration specifications, and compliance policies',
      icon: Code,
      color: 'purple',
      links: [
        { name: 'Developer & Paid API Platform', tab: 'developers', desc: 'API key authentication, quota monitoring, and webhook triggers' },
        { name: 'Terms of Service', tab: 'terms', desc: 'OHADA compliant legal agreement, liabilities, and intellectual property' },
        { name: 'Privacy Policy', tab: 'privacy', desc: 'Data protection standards, SSL security, and user rights' },
        { name: 'Health & Safety Charter', tab: 'safety', desc: 'Zero-harm workplace protocol on active construction sites' },
        { name: 'Data Deletion Portal', tab: 'data-deletion', desc: 'GDPR & Cameroon digital rights data removal requests' }
      ]
    }
  ];

  const filteredSections = sections.map(section => ({
    ...section,
    links: section.links.filter(l => 
      l.name.toLowerCase().includes(filterQuery.toLowerCase()) || 
      l.desc.toLowerCase().includes(filterQuery.toLowerCase())
    )
  })).filter(section => section.links.length > 0 || filterQuery === '');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto space-y-10">
        
        {/* Header with Premium Logo Badge */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-slate-800">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-amber-500/40 p-2 shadow-2xl flex items-center justify-center shrink-0">
              <img 
                src="/logo.png" 
                alt="MADECC GROUP Logo" 
                className="w-full h-full object-contain rounded-xl"
              />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1.5">
                  <Compass className="w-3 h-3" /> Architecture &amp; Index
                </span>
                <span className="text-[11px] font-mono text-slate-500">v2026.11</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Official Platform Site Map
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-xl">
                Comprehensive directory of all public portals, educational publications, budget estimators, and official documentation for MADECC GROUP S.A.R.L.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <a
              href="/sitemap.xml"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 hover:text-white transition-all shadow-sm"
              title="View Standard XML Sitemap for Search Engines"
            >
              <Globe className="w-3.5 h-3.5 text-amber-500" />
              <span>XML Sitemap</span>
              <ExternalLink className="w-3 h-3 text-slate-500" />
            </a>
          </div>
        </div>

        {/* FEATURED: Official Downloadable Manuals (999 XAF) */}
        <div className="rounded-3xl bg-gradient-to-br from-amber-500/15 via-slate-900 to-slate-900 border border-amber-500/30 p-6 sm:p-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl pointer-events-none" />
          
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-6">
            <div>
              <div className="flex items-center gap-2 text-amber-400 text-xs font-bold uppercase tracking-widest mb-1">
                <Sparkles className="w-4 h-4" />
                <span>Executive Publications &amp; Technical Manuals</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white">
                Official Platform Documentation &amp; Handover Guides
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1">
                High-standard, printable PDF reference manuals for platform operators, clients, and technical auditors.
              </p>
            </div>

            <span className="text-[11px] font-mono text-amber-300/80 bg-amber-500/10 border border-amber-500/30 px-3 py-1.5 rounded-xl shrink-0 self-start lg:self-auto">
              Cameroon MoMo &amp; OM Instant Verification • 999 XAF
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            
            {/* 1. Navigation Manual (A4 PDF) — 999 XAF */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-amber-500/40 hover:border-amber-400 transition-all flex flex-col justify-between group shadow-lg">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center font-bold">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider block">Printable Guide</span>
                      <span className="text-[10px] font-mono text-slate-500">ISO 9001 Format</span>
                    </div>
                  </div>
                  <span className="text-base font-black font-mono text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20">
                    999 XAF
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-amber-400 transition-colors">
                  Navigation Manual (A4 PDF)
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Comprehensive multi-page operational manual detailing the full architecture of the MADECC GROUP ecosystem, budgeting tools, booking procedures, and contact points.
                </p>

                <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-mono text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">A4 Printable PDF</span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">English &amp; French</span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Instant Download</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-850 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => downloadWebsiteNavigationGuidePdf()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Navigation Manual (999 XAF)</span>
                </button>
              </div>
            </div>

            {/* 2. Buyer Brand Handover Manual (PDF) — 999 XAF */}
            <div className="p-5 rounded-2xl bg-slate-950/80 border border-emerald-500/40 hover:border-emerald-400 transition-all flex flex-col justify-between group shadow-lg">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase tracking-wider block">Transfer Protocol</span>
                      <span className="text-[10px] font-mono text-slate-500">Executive Technical Spec</span>
                    </div>
                  </div>
                  <span className="text-base font-black font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                    999 XAF
                  </span>
                </div>

                <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors">
                  Buyer Brand Handover Manual (PDF)
                </h3>
                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
                  Official Technical Handover and Brand Transfer Documentation. Details DNS authority, Neon PostgreSQL schemas, SMTP credentials, Cloudinary media CDN, and OHADA contract standards.
                </p>

                <div className="mt-4 flex flex-wrap gap-2 text-[10px] font-mono text-slate-400">
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Executive Handover</span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Infrastructure Records</span>
                  <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800">Secure Access</span>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-850 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => downloadBuyerHandoverManualPdf()}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-emerald-400 hover:from-emerald-400 hover:to-emerald-300 text-slate-950 font-black text-xs shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Handover Manual (999 XAF)</span>
                </button>
              </div>
            </div>

          </div>
        </div>

        {/* Search / Filter in Site Map */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={filterQuery}
              onChange={e => setFilterQuery(e.target.value)}
              placeholder="Search site map pages..."
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <span className="text-xs text-slate-500 font-mono">
            Direct navigation enabled • Click any page card below to visit
          </span>
        </div>

        {/* Hierarchical Site Map Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredSections.map((sec, idx) => {
            const Icon = sec.icon;
            return (
              <div key={idx} className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-white uppercase tracking-wider">{sec.title}</h2>
                      <p className="text-[11px] text-slate-400">{sec.description}</p>
                    </div>
                  </div>

                  <div className="mt-4 divide-y divide-slate-800/80">
                    {sec.links.map((link, lIdx) => (
                      <button
                        key={lIdx}
                        type="button"
                        onClick={() => navigate(link.tab)}
                        className="w-full py-3 text-left flex items-start justify-between gap-3 group hover:bg-slate-800/30 px-2 rounded-xl transition-colors cursor-pointer"
                      >
                        <div>
                          <div className="text-xs font-bold text-white group-hover:text-amber-400 transition-colors flex items-center gap-1.5">
                            <span>{link.name}</span>
                            <span className="text-[10px] font-mono text-slate-500 group-hover:text-amber-400/80">
                              /{link.tab}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                            {link.desc}
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-amber-400 group-hover:translate-x-1 transition-all shrink-0 mt-1" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Canonical Footnote & Contact Helpdesk */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div>
            <span className="font-bold text-white">MADECC GROUP S.A.R.L.</span> — Mbankolo, Yaoundé &amp; Akwa, Douala, Cameroon
            <p className="text-[11px] text-slate-500 mt-0.5">Official Inquiries: Infomadeccconstruction@gmail.com • Primary Phone: +237 683 31 64 86</p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => navigate('contact')}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all"
            >
              Contact Support
            </button>
            <button
              onClick={() => navigate('store')}
              className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition-all"
            >
              Visit Bookstore
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
