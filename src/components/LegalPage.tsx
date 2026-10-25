import React, { useState } from 'react';
import {
  Shield,
  FileText,
  Lock,
  CheckCircle2,
  ArrowLeft,
  ExternalLink,
  Building2,
  AlertTriangle,
  Scale,
  HardHat,
  Eye,
  FileCheck,
  Globe2,
  Database,
  Trash2,
  Printer,
  Calendar,
  MapPin,
  Mail,
  Phone,
  HelpCircle,
  Clock,
  ShieldCheck,
  Check
} from 'lucide-react';
import { useSiteSettings } from '../lib/SiteSettingsContext.tsx';

interface LegalPageProps {
  type: 'terms' | 'privacy' | 'safety';
  setCurrentTab: (tab: string) => void;
}

export default function LegalPage({ type, setCurrentTab }: LegalPageProps) {
  const { settings } = useSiteSettings();
  const [copiedLink, setCopiedLink] = useState(false);

  const handleCopyPageUrl = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const companyName = settings?.siteName || 'MADECC GROUP';
  const siteUrl = 'https://madeccgroup.online';
  const officeAddress = settings?.officeAddressYaounde || 'Mbankolo, Yaoundé, Centre Region, Republic of Cameroon';
  const primaryEmail = settings?.email || 'contact@madeccgroup.online';
  const secondaryEmail = settings?.secondaryEmail || 'Infomadeccconstruction@gmail.com';
  const primaryPhone = settings?.phone || '+237 671 06 35 11';

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
      {/* Top Header & Navigation Breadcrumb */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentTab('home')}
            className="inline-flex items-center gap-1.5 text-xs font-mono tracking-wider uppercase text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-2 rounded-xl border border-amber-500/30 transition-all cursor-pointer shadow-sm"
            id="legal-back-to-home-btn"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </button>

          <button
            onClick={handleCopyPageUrl}
            className="inline-flex items-center gap-1.5 text-xs font-mono text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 px-3 py-2 rounded-xl border border-slate-700 transition cursor-pointer"
            title="Copy URL for Google AdSense or regulatory verification"
          >
            {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <ExternalLink className="w-3.5 h-3.5" />}
            <span>{copiedLink ? 'URL Copied!' : 'Copy Direct URL'}</span>
          </button>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="hidden sm:inline-flex items-center gap-1.5 text-xs font-mono text-slate-400 hover:text-white bg-slate-900 border border-slate-800 px-3 py-2 rounded-xl transition cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print A4</span>
          </button>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-mono">
            <Building2 className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-semibold text-slate-300">MADECC GOVERNANCE</span>
          </div>
        </div>
      </div>

      {/* 4-Tab Legal Quick Navigation Switcher */}
      <div className="mb-8 grid grid-cols-2 sm:grid-cols-4 gap-2 p-1.5 bg-slate-950/80 border border-slate-800 rounded-2xl shadow-lg">
        <button
          onClick={() => setCurrentTab('terms')}
          className={`px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            type === 'terms'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          id="tab-legal-terms"
        >
          <FileText className="w-4 h-4" />
          <span>Terms of Service</span>
        </button>

        <button
          onClick={() => setCurrentTab('privacy')}
          className={`px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            type === 'privacy'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          id="tab-legal-privacy"
        >
          <Lock className="w-4 h-4" />
          <span>Privacy Policy</span>
        </button>

        <button
          onClick={() => setCurrentTab('safety')}
          className={`px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            type === 'safety'
              ? 'bg-amber-500 text-slate-950 shadow-md font-extrabold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
          id="tab-legal-safety"
        >
          <HardHat className="w-4 h-4" />
          <span>Health &amp; Safety (QHSE)</span>
        </button>

        <button
          onClick={() => setCurrentTab('data-deletion')}
          className="px-3 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 text-slate-400 hover:text-white hover:bg-slate-900 cursor-pointer"
          id="tab-legal-data-deletion"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
          <span>Data Deletion</span>
        </button>
      </div>

      {/* Main Document Card */}
      <article className="bg-slate-900/70 backdrop-blur-md border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
        {/* Banner Section */}
        <header className="p-6 sm:p-10 border-b border-slate-800 bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-inner shrink-0">
                {type === 'terms' && <FileText className="w-7 h-7" />}
                {type === 'privacy' && <Lock className="w-7 h-7" />}
                {type === 'safety' && <HardHat className="w-7 h-7" />}
              </div>
              <div>
                <span className="text-[11px] font-mono tracking-widest uppercase text-amber-400 font-bold block mb-1">
                  Official Corporate Governance Document
                </span>
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight">
                  {type === 'terms' && 'Terms of Service & Civil Engineering Master Agreement'}
                  {type === 'privacy' && 'Comprehensive Privacy Policy & Advertising Cookie Statement'}
                  {type === 'safety' && 'Quality, Health, Safety & Environmental (QHSE) Directive'}
                </h1>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-400 pt-4 border-t border-slate-800/80 font-mono">
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-amber-400" />
              Jurisdiction: Republic of Cameroon / CEMAC / OHADA
            </span>
            <span>•</span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-indigo-400" />
              Effective Date: February 2026 (Annual Review Cycle)
            </span>
            <span>•</span>
            <span className="text-emerald-400 flex items-center gap-1 font-bold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {type === 'terms' && 'FIDIC / OHADA Compliant'}
              {type === 'privacy' && 'GDPR / Law No. 2010/012 / Google AdSense Compliant'}
              {type === 'safety' && 'ISO 45001:2018 & ISO 14001:2015 Compliant'}
            </span>
          </div>
        </header>

        {/* Content Body */}
        <div className="p-6 sm:p-10 space-y-10 text-slate-300 text-sm leading-relaxed">
          {/* ================================================================= */}
          {/* TERMS OF SERVICE EXPANSION */}
          {/* ================================================================= */}
          {type === 'terms' && (
            <>
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 leading-relaxed">
                <strong>Legal Agreement Overview:</strong> Welcome to the official web portal of {companyName} SARL (<a href={siteUrl} className="text-amber-400 hover:underline font-mono">{siteUrl}</a>). These Terms of Service constitute a legally binding agreement between you ("Client", "User", or "Visitor") and {companyName} regarding access to our engineering calculators, architectural galleries, tender submissions, and contracting services. By accessing or using this website, you unconditionally accept and agree to comply with these terms.
              </div>

              {/* 01 */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-400 font-extrabold">01.</span> Corporate Entity &amp; Professional Accreditations
                </h2>
                <p>
                  {companyName} is a legally registered civil engineering, construction management, and architectural enterprise incorporated under the laws of the Republic of Cameroon, governed by the OHADA Uniform Act on Commercial Companies:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono text-slate-300">
                  <div><strong>Company Legal Form:</strong> Société à Responsabilité Limitée (SARL)</div>
                  <div><strong>Headquarters:</strong> {officeAddress}</div>
                  <div><strong>Trade &amp; Personal Property Credit Register (RCCM):</strong> RC/YAO/2020/B/1429</div>
                  <div><strong>Unique Taxpayer Identification Number (NIU):</strong> M022012845610W</div>
                  <div><strong>Engineering Accreditation:</strong> Ordre National des Ingénieurs de Génie Civil (ONIGC)</div>
                  <div><strong>Contract Conditions:</strong> FIDIC Red Book / MDB Harmonized Edition</div>
                </div>
              </section>

              {/* 02 */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-400 font-extrabold">02.</span> Scope of Services &amp; Digital Solutions
                </h2>
                <p>
                  Our digital portal and corporate practice encompass:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                  <li><strong>Structural Civil Engineering:</strong> Reinforced concrete (Eurocode 2, BAEL 91), structural steelwork, foundation engineering, and seismic resilience.</li>
                  <li><strong>Architectural Design &amp; 3D BIM:</strong> Comprehensive spatial planning, Building Information Modeling (BIM), and photorealistic renderings.</li>
                  <li><strong>Quantity Surveying &amp; BoQ Formulation:</strong> Bills of Quantities preparation, cost estimation benchmarks, and tender recap schedules.</li>
                  <li><strong>General Construction &amp; Turnkey Contracting:</strong> Commercial complexes, multi-family residences, industrial facilities, and public works infrastructure.</li>
                  <li><strong>SaaS Construction Tools:</strong> Cloud-based estimators, live project takeoffs, tenant workspaces, and digital contract verification.</li>
                </ul>
              </section>

              {/* 03 */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-400 font-extrabold">03.</span> Interactive Estimators &amp; Budget Calculators Disclaimer
                </h2>
                <p>
                  All figures generated by our interactive construction calculators (including the Project Budget Calculator, Construction Cost Guide 2026, and labor cost models) represent preliminary feasibility estimates based on standardized regional metrics in Central Africa (FCFA / XAF).
                </p>
                <p className="text-xs text-slate-400">
                  These automated estimates do not constitute binding engineering quotations until a certified {companyName} engineer has conducted on-site geotechnical borehole analysis, cadastral topography verification, and executed a formal contract instrument.
                </p>
              </section>

              {/* 04 */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-400 font-extrabold">04.</span> Commercial Terms, Payments &amp; Document Download Fees
                </h2>
                <p>
                  All commercial financial transactions on this website are conducted in Central African CFA Francs (XAF) or agreed international currencies:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-slate-300">
                  <li><strong>Official Document Downloads (999 XAF &amp; 2,199 XAF):</strong> Specialized technical guides (such as the Navigation Manual and Buyer Brand Handover Manual) require receipt authentication or a nominal administrative fee of 999 XAF prior to PDF generation. Certified BOQ tender receipts carry a verified gate fee of 2,199 XAF.</li>
                  <li><strong>Authorized Payment Channels:</strong> Payments may be remitted via MTN Mobile Money, Orange Money, or direct corporate bank wire to {companyName}'s designated accounts as listed in our secure checkout gate.</li>
                  <li><strong>Invoicing &amp; Receipts:</strong> Every completed payment generates an immutable digital receipt record equipped with a verifiable cryptographic transaction hash.</li>
                  <li><strong>Refund Policy:</strong> Downloadable electronic documents, architectural CAD models, and customized BoQ sheets are deemed delivered upon file generation and are non-refundable. For physical construction milestones, refunds are governed by the specific project milestone escrow clauses.</li>
                </ul>
              </section>

              {/* 05 */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-400 font-extrabold">05.</span> Client Responsibilities, Site Access &amp; Permits
                </h2>
                <p>
                  Prior to physical mobilization on any construction site, the Client warrants that:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                  <li>The Client holds unencumbered legal title (Titre Foncier) or registered leasehold rights to the parcel of land.</li>
                  <li>All requisite statutory urban development permits have been secured from the Ministry of Housing and Urban Development (MINDDHU) and municipal councils (Communauté Urbaine).</li>
                  <li>Safe, unobstructed vehicular and heavy machinery access is provided to the site boundary for earthmovers, concrete transit mixers, and delivery cranes.</li>
                </ul>
              </section>

              {/* 06 */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-400 font-extrabold">06.</span> Intellectual Property &amp; Technical Rights
                </h2>
                <p>
                  All engineering drawings, structural calculations, CAD blueprints, proprietary software source code, photographic assets, corporate logos, and editorial publications hosted on <a href={siteUrl} className="text-amber-400 hover:underline">{siteUrl}</a> are the exclusive intellectual property of {companyName} and protected under the African Intellectual Property Organization (OAPI) Bangui Agreement.
                </p>
                <p className="text-xs text-slate-400">
                  Users are granted a limited, personal, non-transferable license to view and download technical materials solely for project evaluation. Reproduction, reverse engineering, redistribution, or resale of our proprietary estimation engines or structural designs without written consent is strictly prohibited.
                </p>
              </section>

              {/* 07 */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-400 font-extrabold">07.</span> Contractor Warranties &amp; Decennial Liability (Garantie Décennale)
                </h2>
                <p>
                  {companyName} stands behind the structural integrity of its executed projects:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                  <li><strong>Ten-Year Structural Warranty (Article 1792 &amp; 2270 of the Civil Code):</strong> All load-bearing elements, reinforced concrete foundations, columns, beams, and slabs are covered by a mandatory 10-year statutory warranty against structural collapse or fundamental defect.</li>
                  <li><strong>Two-Year Mechanical &amp; Electrical Warranty (Garantie de Bon Fonctionnement):</strong> MEP installations, hydraulic piping, electrical switchboards, and solar PV integrations are guaranteed for 24 months post-commissioning.</li>
                  <li><strong>One-Year Complete Completion Guarantee (Garantie de Parfait Achèvement):</strong> Minor aesthetic, plaster, or paint finishes are repaired promptly upon formal handover notice.</li>
                </ul>
              </section>

              {/* 08 */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-400 font-extrabold">08.</span> Third-Party Links, Tools &amp; Advertising Disclosures
                </h2>
                <p>
                  Our digital portal may display hyperlinks to third-party engineering software, government gazettes, regulatory portals (MINDDHU, MINEPDED), and automated advertisements provided by Google AdSense. {companyName} does not endorse or assume liability for the content, privacy practices, or commercial terms of external third-party sites.
                </p>
              </section>

              {/* 09 */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-400 font-extrabold">09.</span> Limitation of Liability &amp; Force Majeure
                </h2>
                <p>
                  To the maximum extent permitted under applicable law, {companyName} shall not be held liable for indirect, incidental, consequential, or punitive damages arising out of website usage, temporary service downtime, or delays caused by events of Force Majeure (including catastrophic climatic events, geological earthquakes, national supply chain embargoes, civil unrest, or statutory labor strikes).
                </p>
              </section>

              {/* 10 */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-400 font-extrabold">10.</span> Dispute Resolution &amp; Governing Law
                </h2>
                <p>
                  These Terms of Service and any contractual disputes arising therefrom shall be governed by, construed, and enforced in accordance with the substantive laws of the <strong>Republic of Cameroon</strong> and the uniform acts of the <strong>Organisation for the Harmonisation of Business Law in Africa (OHADA)</strong>.
                </p>
                <p className="text-xs text-slate-400">
                  Any controversy or claim that cannot be amicably settled within thirty (30) calendar days through good-faith executive conciliation shall be submitted to the exclusive jurisdiction of the competent Commercial Court of Douala or High Court of Yaoundé.
                </p>
              </section>

              {/* 11 */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-400 font-extrabold">11.</span> Official Legal Notice &amp; Contact Information
                </h2>
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs font-mono space-y-1.5 text-slate-300">
                  <p><strong>Corporate Entity:</strong> {companyName} SARL</p>
                  <p><strong>Corporate Affairs &amp; Legal Directorate:</strong> General Contracting &amp; Civil Engineering Division</p>
                  <p><strong>Physical Headquarters:</strong> {officeAddress}</p>
                  <p><strong>Official Inquiries:</strong> <a href={`mailto:${primaryEmail}`} className="text-amber-400 underline">{primaryEmail}</a> / <a href={`mailto:${secondaryEmail}`} className="text-amber-400 underline">{secondaryEmail}</a></p>
                  <p><strong>Telephone / WhatsApp Hotline:</strong> {primaryPhone}</p>
                </div>
              </section>
            </>
          )}

          {/* ================================================================= */}
          {/* PRIVACY POLICY EXPANSION (ADSENSE COMPLIANT) */}
          {/* ================================================================= */}
          {type === 'privacy' && (
            <>
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-200 leading-relaxed">
                <strong>Data Privacy Commitment:</strong> {companyName} ("we", "our", or "us") is dedicated to safeguarding the privacy, confidentiality, and data sovereignty of all visitors, clients, and partners. This Privacy Policy outlines our data handling practices in strict compliance with the <strong>Republic of Cameroon Law No. 2010/012 of 21 December 2010 on Cybersecurity and Cybercriminality</strong>, the <strong>General Data Protection Regulation (GDPR)</strong>, the <strong>ePrivacy Directive</strong>, and <strong>Google Publisher Policies</strong>.
              </div>

              {/* 01 */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-400 font-extrabold">01.</span> Data Controller &amp; Contact Information
                </h2>
                <p>
                  The legal entity responsible for the collection, storage, and processing of personal data across <a href={siteUrl} className="text-amber-400 hover:underline">{siteUrl}</a> is:
                </p>
                <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs font-mono space-y-1 text-slate-300">
                  <p><strong>Data Controller:</strong> {companyName} SARL</p>
                  <p><strong>Headquarters:</strong> {officeAddress}</p>
                  <p><strong>Data Protection Officer (DPO):</strong> Compliance &amp; Information Security Directorate</p>
                  <p><strong>Direct DPO Email:</strong> <a href={`mailto:${primaryEmail}`} className="text-amber-400 underline">{primaryEmail}</a></p>
                  <p><strong>Self-Service Erasure Portal:</strong> <button onClick={() => setCurrentTab('data-deletion')} className="text-amber-400 underline cursor-pointer font-bold">https://madeccgroup.online/data-deletion</button></p>
                </div>
              </section>

              {/* 02 */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-400 font-extrabold">02.</span> Categories of Personal Data Collected
                </h2>
                <p>
                  We collect only the data necessary to provide structural engineering calculations, quote submissions, client onboarding, and secure platform performance:
                </p>
                <ul className="list-disc pl-5 space-y-2 text-slate-300">
                  <li><strong>Identification &amp; Contact Data:</strong> Full name, professional title, corporate affiliation, email address, telephone/WhatsApp contact details.</li>
                  <li><strong>Engineering &amp; Project Documentation:</strong> Architectural drawings, CAD models, cadastral coordinate boundaries, site photos, geotechnical test findings, and Bill of Quantities (BoQ) parameters.</li>
                  <li><strong>Commercial &amp; Transactional Data:</strong> Payment transaction references, MoMo/Orange Money verification records, billing addresses, and invoice download receipts (we do NOT store credit card CVV codes or Mobile Money PINs).</li>
                  <li><strong>Technical &amp; Telemetry Data:</strong> IP address, browser type and version, language preferences, operating system, referral URLs, time spent per page, and cryptographic CSRF tokens.</li>
                </ul>
              </section>

              {/* 03 */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-400 font-extrabold">03.</span> Legal Bases for Processing Under Global Standards
                </h2>
                <p>
                  We process personal data only when authorized by applicable statutory grounds:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <strong className="text-amber-400 font-mono">1. Performance of Contract:</strong>
                    <p className="text-slate-300">Formulating accurate engineering proposals, executing FIDIC construction agreements, and delivering structural calculations.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <strong className="text-emerald-400 font-mono">2. Statutory Legal Obligations:</strong>
                    <p className="text-slate-300">Complying with civil engineering public safety regulations, tax invoicing, building permit records (MINDDHU), and labour codes.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <strong className="text-cyan-400 font-mono">3. Legitimate Interests:</strong>
                    <p className="text-slate-300">Securing our network infrastructure against DDoS/CSRF exploits, optimizing estimator performance, and preventing fraudulent tenders.</p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-1">
                    <strong className="text-indigo-400 font-mono">4. Explicit Consent:</strong>
                    <p className="text-slate-300">Distributing engineering market newsletters, corporate quarterly magazines, and setting personalized advertising cookies via Google AdSense.</p>
                  </div>
                </div>
              </section>

              {/* 04 - MANDATORY GOOGLE ADSENSE SECTION */}
              <section className="space-y-4 p-5 rounded-2xl bg-slate-950/90 border-2 border-amber-500/40">
                <div className="flex items-center gap-2 text-amber-400 font-mono font-bold text-sm uppercase">
                  <ShieldCheck className="w-5 h-5" />
                  <span>04. Google AdSense, DoubleClick Cookies &amp; Third-Party Advertising</span>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  To support our free technical resources, engineering budget estimators, and peer-reviewed building code publications, {companyName} partners with Google and third-party advertising networks to display advertisements on <a href={siteUrl} className="text-amber-400 hover:underline">{siteUrl}</a>.
                </p>

                <div className="space-y-3 text-xs text-slate-300">
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <h4 className="font-bold text-white font-mono uppercase tracking-wide">A. Third-Party Vendors &amp; Google:</h4>
                    <p>
                      Google, as a third-party vendor, uses cookies to serve ads on our site. Google's use of advertising cookies (such as the DoubleClick DART cookie) enables it and its advertising partners to serve personalized ads to our users based on their visits to our site and/or other sites across the Internet.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <h4 className="font-bold text-white font-mono uppercase tracking-wide">B. Personalized Advertising Opt-Out:</h4>
                    <p>
                      Users may opt out of personalized advertising at any time by visiting the official Google Ads Settings portal:
                    </p>
                    <a
                      href="https://www.google.com/settings/ads"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-amber-400 font-bold underline hover:text-amber-300"
                    >
                      <span>https://www.google.com/settings/ads (Google Ads Settings)</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <h4 className="font-bold text-white font-mono uppercase tracking-wide">C. Network Advertising Initiative &amp; Global Opt-Outs:</h4>
                    <p>
                      Alternatively, visitors can opt out of a third-party vendor's use of cookies for personalized advertising by visiting the industry opt-out portals:
                    </p>
                    <ul className="list-disc pl-5 space-y-1 mt-1">
                      <li>
                        <strong>Network Advertising Initiative (NAI):</strong>{' '}
                        <a href="https://www.aboutads.info" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">www.aboutads.info</a>
                      </li>
                      <li>
                        <strong>Digital Advertising Alliance (DAA):</strong>{' '}
                        <a href="https://youradchoices.com" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">youradchoices.com</a>
                      </li>
                      <li>
                        <strong>European Interactive Digital Advertising Alliance (EDAA):</strong>{' '}
                        <a href="https://www.youronlinechoices.eu" target="_blank" rel="noopener noreferrer" className="text-amber-400 underline">www.youronlinechoices.eu</a>
                      </li>
                    </ul>
                  </div>

                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
                    <h4 className="font-bold text-white font-mono uppercase tracking-wide">D. Log Files &amp; Web Beacons:</h4>
                    <p>
                      Like most standard web servers, our hosting environment utilizes log files. These files log visitors to the site—usually a standard procedure for hosting companies and part of hosting services' analytics. The information inside the log files includes internet protocol (IP) addresses, browser type, Internet Service Provider (ISP), date/time stamps, referring/exit pages, and possibly the number of clicks. This information is used to analyze trends, administer the site, track user movement around the site, and gather demographic information. IP addresses and other such information are not linked to any information that is personally identifiable.
                    </p>
                  </div>
                </div>
              </section>

              {/* 05 - COOKIE MATRIX */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-400 font-extrabold">05.</span> Exhaustive Cookie Classification Table
                </h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border border-slate-800 rounded-xl overflow-hidden">
                    <thead className="bg-slate-950 font-mono text-[11px] uppercase text-slate-300">
                      <tr>
                        <th className="p-3 border-b border-slate-800">Category</th>
                        <th className="p-3 border-b border-slate-800">Purpose</th>
                        <th className="p-3 border-b border-slate-800">Provider</th>
                        <th className="p-3 border-b border-slate-800">Duration</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      <tr>
                        <td className="p-3 font-bold text-amber-400">Strictly Necessary</td>
                        <td className="p-3">Session management, CSRF attack prevention, theme preference.</td>
                        <td className="p-3 font-mono">{companyName}</td>
                        <td className="p-3 font-mono">Session / 1 Year</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-emerald-400">Functional</td>
                        <td className="p-3">Language selection (EN/FR), budget calculator state preservation.</td>
                        <td className="p-3 font-mono">{companyName}</td>
                        <td className="p-3 font-mono">1 Year</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-cyan-400">Analytics &amp; Performance</td>
                        <td className="p-3">Aggregated traffic analysis, error monitoring, and page load telemetry.</td>
                        <td className="p-3 font-mono">Internal Telemetry</td>
                        <td className="p-3 font-mono">90 Days</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-indigo-400">Advertising &amp; AdSense</td>
                        <td className="p-3">DoubleClick DART cookies serving relevant ads &amp; frequency capping.</td>
                        <td className="p-3 font-mono">Google LLC</td>
                        <td className="p-3 font-mono">Up to 24 Months</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 06 */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-400 font-extrabold">06.</span> Statutory Data Retention Schedule
                </h2>
                <p>
                  We store personal and technical records strictly according to statutory retention schedules:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                  <li><strong>Civil Engineering &amp; Structural Archives:</strong> Retained for a minimum of <strong>ten (10) years</strong> post-handover to satisfy decennial liability (Garantie Décennale) under Article 1792 of the Civil Code.</li>
                  <li><strong>Client Quote Inquiries &amp; Communications:</strong> Retained for three (3) years following last active contact.</li>
                  <li><strong>Security &amp; Web Server Logs:</strong> Retained for thirty (30) days and then automatically scrubbed.</li>
                </ul>
              </section>

              {/* 07 */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-400 font-extrabold">07.</span> Your Rights &amp; Self-Service Data Deletion Portal
                </h2>
                <p>
                  Under Cameroon Law No. 2010/012 and international data protection regulations (GDPR/CCPA), you retain the following enforceable rights:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <strong className="text-amber-400">• Right to Access &amp; Portability:</strong> Request a complete copy of all your stored profile data in machine-readable JSON format.
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <strong className="text-emerald-400">• Right to Rectification:</strong> Request correction of inaccurate personal contact numbers, corporate titles, or email records.
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <strong className="text-red-400">• Right to Erasure ("To Be Forgotten"):</strong> Request immediate and permanent purging of your account, consultation history, and contact logs.
                  </div>
                  <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                    <strong className="text-cyan-400">• Right to Withdraw Consent:</strong> Revoke cookie permissions or unsubscribe from marketing newsletters with 1 click.
                  </div>
                </div>

                <div className="mt-4 p-4 rounded-xl bg-red-500/10 border border-red-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <h4 className="font-bold text-white font-mono uppercase">Need to request immediate data deletion?</h4>
                    <p className="text-slate-300">Use our dedicated automated erasure portal to submit and track your request.</p>
                  </div>
                  <button
                    onClick={() => setCurrentTab('data-deletion')}
                    className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shrink-0 cursor-pointer shadow-md"
                    id="btn-goto-data-deletion"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Open Data Deletion Portal (/data-deletion)</span>
                  </button>
                </div>
              </section>
            </>
          )}

          {/* ================================================================= */}
          {/* HEALTH AND SAFETY STATEMENT (QHSE DIRECTIVE) */}
          {/* ================================================================= */}
          {type === 'safety' && (
            <>
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-200 leading-relaxed">
                <strong>Executive Zero-Harm Charter:</strong> At {companyName}, the health, safety, and physical well-being of our engineers, construction artisans, subcontractors, clients, and host communities take absolute precedence over commercial milestones. We operate an uncompromising Zero-Harm policy in rigorous adherence to <strong>ISO 45001:2018 (Occupational Health &amp; Safety)</strong>, <strong>ISO 14001:2015 (Environmental Management)</strong>, and the <strong>Republic of Cameroon Labour Code (Law No. 92/007)</strong>.
              </div>

              {/* 01 */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-400 font-extrabold">01.</span> Statutory Governance &amp; Institutional Oversight
                </h2>
                <p>
                  Our Quality, Health, Safety &amp; Environment (QHSE) Directorate enforces safety compliance across every construction site in Central Africa in direct collaboration with:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                  <li><strong>Ministry of Labour and Social Security (MINTSS):</strong> Workplace safety inspections, labor hygiene decrees, and occupational accident audits.</li>
                  <li><strong>Caisse Nationale de Prévoyance Sociale (CNPS):</strong> Worker social insurance, occupational illness prevention, and hazard risk mitigation.</li>
                  <li><strong>Ministry of Environment, Protection of Nature and Sustainable Development (MINEPDED):</strong> Environmental Impact Assessments (EIA), site water drainage compliance, and eco-auditing.</li>
                  <li><strong>Ministry of Public Works (MINTP) &amp; MINDDHU:</strong> Structural engineering safety norms and urban zoning compliance.</li>
                </ul>
              </section>

              {/* 02 */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-400 font-extrabold">02.</span> Mandatory Site Personal Protective Equipment (PPE) Matrix
                </h2>
                <p>
                  No worker, engineer, client representative, or official visitor may cross the access threshold of any {companyName} project site without active, compliant PPE meeting international certified standards:
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left border border-slate-800 rounded-xl overflow-hidden">
                    <thead className="bg-slate-950 font-mono text-[11px] uppercase text-slate-300">
                      <tr>
                        <th className="p-3 border-b border-slate-800">Equipment Type</th>
                        <th className="p-3 border-b border-slate-800">Certification Standard</th>
                        <th className="p-3 border-b border-slate-800">Operational Application</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-slate-300">
                      <tr>
                        <td className="p-3 font-bold text-white">Safety Hard Hats</td>
                        <td className="p-3 font-mono text-amber-400">EN 397 / ANSI Z89.1</td>
                        <td className="p-3">Mandatory 100% of the time across all operational zones. Color-coded (White: Engineers/Management, Yellow: Artisans, Blue: Visitors).</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-white">Safety Footwear</td>
                        <td className="p-3 font-mono text-amber-400">EN ISO 20345 (S3/S5)</td>
                        <td className="p-3">Steel-toe or composite cap (200J impact resistance), puncture-proof steel midsole plate, slip-resistant oil-proof sole.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-white">Fall Arrest Harness</td>
                        <td className="p-3 font-mono text-amber-400">EN 361 &amp; EN 358</td>
                        <td className="p-3">Full-body harness with energy-absorbing double lanyard and scaffolding hooks for elevation work exceeding 1.8 meters.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-white">High-Visibility Apparel</td>
                        <td className="p-3 font-mono text-amber-400">EN ISO 20471 (Class 2/3)</td>
                        <td className="p-3">Reflective fluorescent vests/coveralls required on all civil works near heavy machinery and traffic thoroughfares.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-white">Eye &amp; Face Protection</td>
                        <td className="p-3 font-mono text-amber-400">EN 166 (Grade 1B)</td>
                        <td className="p-3">Safety goggles during concrete chiseling, stone cutting, welding shields, and chemical handling.</td>
                      </tr>
                      <tr>
                        <td className="p-3 font-bold text-white">Respiratory Protection</td>
                        <td className="p-3 font-mono text-amber-400">EN 149 (FFP2 / FFP3)</td>
                        <td className="p-3">Particulate respirators during dry cement mixing, demolition, and aggregate batching.</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </section>

              {/* 03 */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-400 font-extrabold">03.</span> High-Risk Construction Operations Standards
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <h4 className="font-bold text-amber-400 font-mono uppercase flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Work at Elevation &amp; Scaffolding
                    </h4>
                    <p className="text-slate-300">
                      All scaffolds are erected by certified riggers under EN 12811 standards with double guardrails, toe boards, and green "SCAFFTAG" certification tags inspected weekly. 100% tie-off mandatory.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <h4 className="font-bold text-amber-400 font-mono uppercase flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Deep Excavation &amp; Ground Shoring
                    </h4>
                    <p className="text-slate-300">
                      Trenches exceeding 1.2 meters deep must be battered, benched, or shored with structural trench boxes. Daily geotechnical soil stability inspections are conducted after tropical rainfall.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <h4 className="font-bold text-amber-400 font-mono uppercase flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Heavy Machinery &amp; Tower Cranes
                    </h4>
                    <p className="text-slate-300">
                      Crane operators hold verified CACES/ONIGC credentials. Lifting accessories (wire ropes, slings, shackles) undergo statutory load testing every six months. Exclusion swing radius strictly barricaded.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-1.5">
                    <h4 className="font-bold text-amber-400 font-mono uppercase flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4" /> Electrical Safety &amp; Lockout/Tagout
                    </h4>
                    <p className="text-slate-300">
                      Temporary site generators, distribution boards, and transformers feature 30mA residual current circuit breakers (RCCBs). Lockout/Tagout (LOTO) protocols enforced during substation tie-ins.
                    </p>
                  </div>
                </div>
              </section>

              {/* 04 */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-400 font-extrabold">04.</span> Daily Toolbox Talks &amp; Worker Inductions
                </h2>
                <p>
                  Before commencing shift work at 07:30 WAT every morning, Site Safety Engineers lead mandatory 15-minute <strong>Toolbox Safety Talks</strong> covering the specific hazard risks of that day's scheduled tasks (concrete pumping, rebar tying, trenching, or crane hoisting).
                </p>
                <p className="text-xs text-slate-400">
                  Every newly arriving artisan, engineer, or subcontractor must complete a 2-hour site safety induction, signed into the statutory site safety registry before receiving their biometric site badge.
                </p>
              </section>

              {/* 05 */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-400 font-extrabold">05.</span> Emergency Medical Response &amp; Medevac Protocols
                </h2>
                <p>
                  Every operational construction site is equipped with:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                  <li>Fully stocked First Aid trauma stations staffed by certified first-aid responders (SST - Sauveteur Secouriste du Travail).</li>
                  <li>Dedicated emergency evacuation vehicles (ambulance agreements with regional referral hospitals in Yaoundé and Douala).</li>
                  <li>Chemical eyewash stations and fire suppression equipment (ABC dry powder and CO2 extinguishers) inspected monthly.</li>
                  <li>Automated emergency siren system for site evacuation drills conducted quarterly.</li>
                </ul>
              </section>

              {/* 06 */}
              <section className="space-y-3">
                <h2 className="text-base font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                  <span className="text-amber-400 font-extrabold">06.</span> Environmental Sustainability &amp; Circular Waste Management
                </h2>
                <p>
                  Under our ISO 14001:2015 Environmental Management System, {companyName} minimizes ecological disruption:
                </p>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                  <li><strong>Concrete Crushing &amp; Aggregate Recycling:</strong> Demolition concrete is crushed into aggregate sub-bases for haul roads and foundation leveling.</li>
                  <li><strong>Erosion &amp; Sediment Control:</strong> Silt fences, retention ponds, and sustainable urban drainage systems (SUDS) are deployed to safeguard natural river courses.</li>
                  <li><strong>Hazardous Fluid Containment:</strong> Generator diesel storage, formwork release oils, and chemical admixtures are positioned within 110% capacity secondary bunded retention sumps.</li>
                </ul>
              </section>
            </>
          )}
        </div>

        {/* Footer Info & Verification Bar */}
        <footer className="p-6 bg-slate-950 border-t border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex flex-wrap items-center gap-2">
            <span>Official Legal Route:</span>
            <span className="font-mono text-amber-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
              {siteUrl}/{type === 'terms' ? 'terms' : type === 'privacy' ? 'privacy' : 'safety'}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setCurrentTab('terms')}
              className={`hover:text-amber-400 transition cursor-pointer ${type === 'terms' ? 'text-amber-400 font-bold' : ''}`}
            >
              Terms of Service (/terms)
            </button>
            <span>•</span>
            <button
              onClick={() => setCurrentTab('privacy')}
              className={`hover:text-amber-400 transition cursor-pointer ${type === 'privacy' ? 'text-amber-400 font-bold' : ''}`}
            >
              Privacy Policy (/privacy)
            </button>
            <span>•</span>
            <button
              onClick={() => setCurrentTab('safety')}
              className={`hover:text-amber-400 transition cursor-pointer ${type === 'safety' ? 'text-amber-400 font-bold' : ''}`}
            >
              QHSE Statement (/safety)
            </button>
            <span>•</span>
            <button
              onClick={() => setCurrentTab('data-deletion')}
              className="hover:text-red-400 transition cursor-pointer font-bold"
            >
              Data Deletion (/data-deletion)
            </button>
          </div>
        </footer>
      </article>
    </div>
  );
}
