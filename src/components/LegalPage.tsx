import React from 'react';
import { Shield, FileText, Lock, CheckCircle2, ArrowLeft, ExternalLink, Building2 } from 'lucide-react';

interface LegalPageProps {
  type: 'terms' | 'privacy' | 'safety';
  setCurrentTab: (tab: string) => void;
}

export default function LegalPage({ type, setCurrentTab }: LegalPageProps) {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Navigation Breadcrumb */}
      <div className="mb-8 flex items-center justify-between">
        <button
          onClick={() => setCurrentTab('home')}
          className="inline-flex items-center gap-2 text-xs font-mono tracking-wider uppercase text-amber-500 hover:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 px-4 py-2 rounded-lg border border-amber-500/30 transition-all cursor-pointer"
          id="legal-back-to-home-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </button>
        <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
          <Building2 className="w-3.5 h-3.5 text-amber-500" />
          <span>MADECC GROUP COMPLIANCE</span>
        </div>
      </div>

      {/* Main Document Container */}
      <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header Banner */}
        <div className="p-8 border-b border-slate-800 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
              {type === 'terms' && <FileText className="w-6 h-6" />}
              {type === 'privacy' && <Lock className="w-6 h-6" />}
              {type === 'safety' && <Shield className="w-6 h-6" />}
            </div>
            <div>
              <span className="text-[11px] font-mono tracking-widest uppercase text-amber-400 font-semibold">
                Official Corporate Governance
              </span>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                {type === 'terms' && 'Terms of Service & Usage Agreements'}
                {type === 'privacy' && 'Privacy Policy & Cookie Statement'}
                {type === 'safety' && 'Quality, Health, Safety & Environment (QHSE)'}
              </h1>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-4 pt-4 border-t border-slate-800/80 font-mono">
            <span>Jurisdiction: Republic of Cameroon</span>
            <span>•</span>
            <span>Effective Date: February 2026</span>
            <span>•</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> ISO 9001 / FIDIC Compliant
            </span>
          </div>
        </div>

        {/* Document Body */}
        <div className="p-8 sm:p-10 space-y-8 text-slate-300 text-sm leading-relaxed">
          {type === 'privacy' && (
            <>
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300">
                <strong>Data Privacy Commitment:</strong> MADECC GROUP ("we", "our", or "us") adheres strictly to global data protection principles and the Cameroon Law No. 2010/012 of 21 December 2010 on Cybersecurity and Cybercriminality.
              </div>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-500">01.</span> Scope and Application
                </h2>
                <p>
                  This Privacy Policy applies to all users, clients, subcontractors, and enterprise partners accessing our digital portal (<a href="https://madeccgroup.online" className="text-amber-400 hover:underline">https://madeccgroup.online</a>), Request-a-Quote services, consultation bookings, and associated enterprise project takeoff tools.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-500">02.</span> Information We Collect
                </h2>
                <ul className="list-disc pl-5 space-y-2 text-slate-300">
                  <li><strong>Personal Contact Information:</strong> Full name, professional email address, telephone/WhatsApp contact numbers, and company affiliation submitted during inquiries.</li>
                  <li><strong>Project & Structural Specifications:</strong> Architectural drawings, CAD blueprints, BoQ requests, site locations (GPS/cadastral coordinates in Cameroon), and valuation parameters.</li>
                  <li><strong>Technical Telemetry:</strong> IP address, device type, browser metadata, and authentication timestamps collected strictly for operational security and CSRF mitigation.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-500">03.</span> Purpose of Data Processing
                </h2>
                <p>
                  We collect and process your information solely for:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li>Preparing technical engineering proposals, feasibility studies, and accurate Bills of Quantities (BoQ).</li>
                  <li>Scheduling on-site structural inspections and geotechnical testing.</li>
                  <li>Distributing corporate notices, compliance certifications, and tender updates.</li>
                  <li>Maintaining statutory safety logs required by civil engineering regulatory authorities.</li>
                </ul>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-500">04.</span> Third-Party Services & Cookies
                </h2>
                <p>
                  We utilize secure cloud services (including Supabase Cloud, Cloudinary CDN, and Google APIs) for file persistence and intelligence services. Third-party advertising vendors, including Google, may use cookies to serve relevant architectural notices based on prior visits. You may manage or opt-out of cookie tracking via your browser preferences.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-500">05.</span> Contact & Data Protection Officer
                </h2>
                <p>
                  For inquiries regarding your personal data, rights to rectification, or data deletion requests, submit an automated request via our <button onClick={() => setCurrentTab('data-deletion')} className="text-amber-400 font-bold hover:underline cursor-pointer">Official Data Deletion Portal (/data-deletion)</button> or contact our Compliance Office:
                </p>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-400 space-y-1">
                  <p><strong>Entity:</strong> MADECC GROUP Compliance & Legal Department</p>
                  <p><strong>Headquarters:</strong> Yaoundé Mbankolo, Republic of Cameroon (Operating Nationwide &amp; Pan-Africa)</p>
                  <p><strong>Official Email:</strong> <a href="mailto:kreboya603@gmail.com" className="text-amber-400">kreboya603@gmail.com</a> / <a href="mailto:madecccons@gmail.com" className="text-amber-400">madecccons@gmail.com</a></p>
                </div>
              </section>
            </>
          )}

          {type === 'terms' && (
            <>
              <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-300">
                <strong>Binding Agreement:</strong> By accessing or using the MADECC GROUP digital platform (<a href="https://madeccgroup.online" className="text-amber-400 hover:underline">https://madeccgroup.online</a>), you agree to be bound by these Terms of Service and all applicable laws in Cameroon.
              </div>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-500">01.</span> Intellectual Property & Technical Assets
                </h2>
                <p>
                  All structural algorithms, engineering drawings, custom takeoff estimators, architectural models, and corporate publications displayed on this website are the proprietary property of MADECC GROUP. Users are granted a limited, revocable license for non-commercial viewing.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-500">02.</span> Project Estimates & Quotations Disclaimer
                </h2>
                <p>
                  Interactive cost estimates, budgetary calculators, and price indicators (e.g. in FCFA) provided on this portal are for preliminary feasibility guidance only. Binding contractual agreements require formal engineering site surveys, geotechnical validation, and signed contract instruments executed by authorized MADECC GROUP directors.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-500">03.</span> Contractual Standards & Governing Law
                </h2>
                <p>
                  All formal construction contracts, procurement orders, and joint venture partnerships executed by MADECC GROUP are governed under FIDIC (International Federation of Consulting Engineers) contract conditions and the exclusive jurisdiction of the Commercial Court of Douala / Republic of Cameroon.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-500">04.</span> Social Media & API Integrations
                </h2>
                <p>
                  Our platform connects to official social networks (YouTube, Meta/Facebook, Instagram, WhatsApp, TikTok) for verified broadcast communications and client project spotlights in accordance with provider developer policies and OAuth 2.0 security frameworks.
                </p>
              </section>
            </>
          )}

          {type === 'safety' && (
            <>
              <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 text-xs text-emerald-300">
                <strong>Zero-Harm Policy:</strong> Safety is the cornerstone of every MADECC GROUP project. We enforce zero-tolerance for unsafe construction practices across all operational sites in Central Africa.
              </div>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-500">01.</span> Mandatory Site PPE Protocols
                </h2>
                <p>
                  Strict compliance with Personal Protective Equipment (PPE) standards is enforced 24/7 across every site: EN 397 certified safety helmets, EN ISO 20345 steel-toe puncture-resistant boots, high-visibility reflective apparel, and dual-lanyard fall arrest harnesses for elevation works exceeding 2 meters.
                </p>
              </section>

              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-500">02.</span> Environmental Impact Assessment (EIA)
                </h2>
                <p>
                  MADECC GROUP designs and executes all projects in harmony with the Ministry of Environment, Protection of Nature and Sustainable Development (MINEPDED) guidelines, incorporating sustainable drainage, low-clinker cement formulations, and comprehensive construction waste recycling programs.
                </p>
              </section>
            </>
          )}
        </div>

        {/* Footer info bar */}
        <div className="p-6 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <span>Official Domain: <a href="https://madeccgroup.online" className="text-amber-400 hover:underline">https://madeccgroup.online</a></span>
          <div className="flex gap-4">
            <button onClick={() => setCurrentTab('terms')} className="hover:text-amber-400 transition-colors">Terms of Service</button>
            <span>•</span>
            <button onClick={() => setCurrentTab('privacy')} className="hover:text-amber-400 transition-colors">Privacy Policy</button>
            <span>•</span>
            <button onClick={() => setCurrentTab('safety')} className="hover:text-amber-400 transition-colors">Safety Directive</button>
          </div>
        </div>
      </div>
    </div>
  );
}
