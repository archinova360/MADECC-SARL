import React, { useState } from 'react';
import { getCsrfHeaders } from '../lib/csrf.ts';
import { downloadWebsiteNavigationGuidePdf } from '../utils/navigationGuidePdf.ts';
import { 
  HardHat, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  X,
  FileDown,
  Share2,
  Globe,
  Copy,
  Check,
  Users,
  Radio
} from 'lucide-react';
import { useSiteSettings } from '../lib/SiteSettingsContext.tsx';

interface FooterProps {
  setCurrentTab: (tab: string) => void;
}

export default function Footer({ setCurrentTab }: FooterProps) {
  const { settings, openFollowModal } = useSiteSettings();
  const [email, setEmail] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaError, setCaptchaError] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const [modalType, setModalType] = useState<'privacy' | 'terms' | 'safety' | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  const websiteUrl = 'https://madeccgroup.online';
  const shareText = 'MADECC GROUP — Premier Civil Engineering, Structural Design & Construction Firm in Cameroon.';

  const handleCopyLink = () => {
    navigator.clipboard.writeText(websiteUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    if (captcha.trim() !== '5') {
      setCaptchaError(true);
      setStatus('error');
      setMsg('Incorrect verification answer.');
      return;
    }

    setCaptchaError(false);
    setStatus('loading');
    try {
      const csrfHeaders = await getCsrfHeaders();
      const response = await fetch('/api/subscribers', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...csrfHeaders
        },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      if (response.ok) {
        // Submit to Netlify forms also
        try {
          await fetch('/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              'form-name': 'newsletter',
              'email': email
            }).toString()
          });
        } catch (netlifyErr) {
          console.warn('Netlify newsletter form submission failed:', netlifyErr);
        }

        setStatus('success');
        setMsg('Successfully subscribed to newsletter!');
        setEmail('');
        setCaptcha('');
      } else {
        setStatus('error');
        setMsg(data.error || 'Failed to subscribe.');
      }
    } catch (err) {
      console.error(err);
      setStatus('error');
      setMsg('Connection error.');
    }
  };

  return (
    <footer className="bg-slate-950 border-t border-slate-800 text-slate-400 font-sans pt-16 pb-8" id="site-footer">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Footer grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          
          {/* Column 1: Brand & Bio */}
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg overflow-hidden bg-slate-900 border border-slate-800 flex items-center justify-center shrink-0">
                <img 
                  src={settings?.logoUrl || "/logo.png"} 
                  alt={`${settings?.siteName || 'MADECC GROUP'} Logo`} 
                  className="h-full w-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <span className="font-sans font-extrabold text-lg tracking-tight text-white">
                {settings?.siteName ? (
                  settings.siteName
                ) : (
                  <>MADECC<span className="text-amber-500">GROUP</span></>
                )}
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              {settings?.footerContent?.aboutText || 
                "MADECC GROUP is a premier multi-disciplinary construction, design-build, and civil engineering firm. We construct landmarks of absolute structural integrity, sustainability, and architectural excellence."}
            </p>
            <div className="flex items-center gap-2 pt-1 text-xs font-mono text-slate-500">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>{settings?.businessHours || "Mon - Fri: 08:00 - 18:00"}</span>
            </div>

            {/* Social Media Channels & Follow Us Central Launch */}
            <div className="pt-2 border-t border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">Connect With Us</span>
                <button
                  type="button"
                  onClick={openFollowModal}
                  className="flex items-center gap-1 text-[11px] font-bold text-amber-400 hover:text-amber-300 transition-colors cursor-pointer"
                  id="footer-open-follow-modal-btn"
                >
                  <Users className="w-3 h-3" />
                  <span>Follow Us Hub</span>
                </button>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {settings?.linkedinUrl && (
                  <a
                    href={settings.linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="MADECC LinkedIn Profile"
                    className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-[#0077B5] hover:text-white text-slate-400 border border-slate-800 transition-all flex items-center justify-center text-xs font-bold font-mono"
                    title="LinkedIn"
                  >
                    in
                  </a>
                )}
                {settings?.facebookUrl && (
                  <a
                    href={settings.facebookUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="MADECC Facebook Profile"
                    className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-[#1877F2] hover:text-white text-slate-400 border border-slate-800 transition-all flex items-center justify-center text-xs font-bold font-mono"
                    title="Facebook"
                  >
                    fb
                  </a>
                )}
                {settings?.youtubeUrl && (
                  <a
                    href={settings.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="MADECC YouTube Channel"
                    className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-[#FF0000] hover:text-white text-slate-400 border border-slate-800 transition-all flex items-center justify-center text-xs font-bold font-mono"
                    title="YouTube"
                  >
                    yt
                  </a>
                )}
                {settings?.twitterUrl && (
                  <a
                    href={settings.twitterUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="MADECC Twitter Profile"
                    className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-white hover:text-black text-slate-400 border border-slate-800 transition-all flex items-center justify-center text-xs font-bold font-mono"
                    title="X (Twitter)"
                  >
                    𝕏
                  </a>
                )}
                {settings?.instagramUrl && (
                  <a
                    href={settings.instagramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="MADECC Instagram Profile"
                    className="w-8 h-8 rounded-lg bg-slate-900 hover:bg-gradient-to-tr hover:from-amber-500 hover:to-pink-500 hover:text-white text-slate-400 border border-slate-800 transition-all flex items-center justify-center text-xs font-bold font-mono"
                    title="Instagram"
                  >
                    ig
                  </a>
                )}
                {settings?.whatsappNumber && (
                  <a
                    href={`https://wa.me/${settings.whatsappNumber.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="MADECC WhatsApp Desk"
                    className="w-8 h-8 rounded-lg bg-emerald-950/60 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400 border border-emerald-800/60 transition-all flex items-center justify-center text-xs font-bold font-mono"
                    title="WhatsApp"
                  >
                    wa
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => setShowShareModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500 text-amber-400 hover:text-slate-950 border border-amber-500/30 transition-all text-xs font-bold cursor-pointer"
                  id="footer-share-website-btn"
                  title="Share MADECC Website"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>
              </div>

              {/* Follow Us Button with Visual Beacon */}
              <button
                type="button"
                onClick={openFollowModal}
                className="w-full mt-2 py-2 px-3 rounded-lg bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/20 border border-amber-500/40 text-amber-300 hover:bg-amber-500/30 hover:border-amber-500 transition-all text-xs font-bold flex items-center justify-center gap-2 shadow-sm"
                id="footer-follow-us-cta-btn"
              >
                <Radio className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                <span>Follow Us on Social Media</span>
                <span className="text-[10px] bg-amber-500 text-slate-950 font-black px-1.5 py-0.2 rounded font-mono">
                  LIVE
                </span>
              </button>
            </div>
          </div>

          {/* Column 2: Quick Links */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-6 border-b border-slate-800 pb-2">Quick Links</h3>
            <ul className="space-y-3.5 text-sm">
              {[
                { label: 'Home Page', id: 'home' },
                { label: 'Our Services', id: 'services' },
                { label: 'Tenders & Procurement', id: 'tenders' },
                { label: 'FAQ / Help Centre', id: 'faq' },
                { label: 'Projects Portfolio', id: 'projects' },
                { label: 'Project Budget Calculator', id: 'budget-calculator' },
                { label: 'Schedule Consultation', id: 'schedule-consultation' },
                { label: 'Construction Cost Guide', id: 'construction-cost-guide' },
                { label: 'Developer & Paid API Platform', id: 'developers' },
                { label: 'Request a Quote', id: 'request-a-quote' },
                { label: 'About MADECC', id: 'about' },
                { label: 'Contact Office', id: 'contact' },
                { label: 'Data Deletion & Privacy', id: 'data-deletion' },
              ].map((link) => (
                <li key={link.id}>
                  <button
                    onClick={() => setCurrentTab(link.id)}
                    className="hover:text-amber-400 transition-colors text-left"
                    id={`footer-link-${link.id}`}
                  >
                    {link.label}
                  </button>
                </li>
              ))}
              <li>
                <button
                  onClick={() => downloadWebsiteNavigationGuidePdf()}
                  className="text-amber-400 hover:text-amber-300 transition-colors text-left font-bold flex items-center gap-1.5"
                  id="footer-download-navigation-guide"
                >
                  <FileDown className="w-3.5 h-3.5 text-amber-500" />
                  Navigation Manual (A4 PDF)
                </button>
              </li>
            </ul>
          </div>

          {/* Column 3: Contact Details */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-6 border-b border-slate-800 pb-2">Contact Details</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  {settings?.officeAddressYaounde || "Mbankolo, Yaoundé, Cameroon"}
                  <br />
                  <span className="text-xs text-amber-400 font-mono">Operating Nationwide in Cameroon &amp; Across Africa</span>
                </span>
              </li>
              <li className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-amber-500 shrink-0" />
                  <div className="flex flex-col gap-0.5">
                    <a href={`tel:${(settings?.phone || '+237 683 316 486').replace(/\s+/g, '')}`} className="hover:text-amber-400 transition-colors font-mono font-bold">
                      {settings?.phone || '+237 683 316 486'}
                    </a>
                    {settings?.phoneSecondary && (
                      <a href={`tel:${settings.phoneSecondary.replace(/\s+/g, '')}`} className="hover:text-amber-400 transition-colors font-mono text-xs text-slate-400">
                        {settings.phoneSecondary}
                      </a>
                    )}
                    {settings?.phoneTertiary && (
                      <a href={`tel:${settings.phoneTertiary.replace(/\s+/g, '')}`} className="hover:text-amber-400 transition-colors font-mono text-xs text-slate-400">
                        {settings.phoneTertiary}
                      </a>
                    )}
                  </div>
                </div>
                <div className="pl-8 text-xs text-slate-500 font-mono">
                  General, Engineering & MoMo/OM Desk
                </div>
              </li>
              <li className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-amber-500 shrink-0" />
                  <a href={`mailto:${settings?.email || 'Infomadeccconstruction@gmail.com'}`} className="hover:text-amber-400 transition-colors font-mono">
                    {settings?.email || 'Infomadeccconstruction@gmail.com'}
                  </a>
                </div>
                {settings?.secondaryEmail && (
                  <div className="flex items-center gap-3 pl-8">
                    <a href={`mailto:${settings.secondaryEmail}`} className="hover:text-amber-400 transition-colors font-mono">
                      {settings.secondaryEmail}
                    </a>
                  </div>
                )}
              </li>
            </ul>
          </div>

          {/* Column 4: Newsletter Subscriber */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-6 border-b border-slate-800 pb-2">Newsletter</h3>
            <p className="text-sm text-slate-400 mb-4 leading-relaxed">
              Subscribe to recieve latest construction insights, green building research, and project case studies.
            </p>

            <form onSubmit={handleSubscribe} className="space-y-3">
              <div className="relative">
                <input
                  type="email"
                  placeholder="Enter email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg py-2.5 pl-3 pr-10 text-sm text-white placeholder-slate-500 outline-none transition-all"
                  required
                />
              </div>

              {/* Anti-Bot Verification */}
              <div className="bg-slate-900/60 border border-slate-800/80 p-3 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-slate-300 uppercase tracking-wide">
                    Human Verification
                  </span>
                  <span className="text-[9px] font-mono text-amber-500 font-bold">
                    Anti-Bot
                  </span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Solve: <span className="text-white font-mono font-bold bg-slate-950 px-1.5 py-0.5 rounded">15x + 5x - 10 = 90</span>. What is x?
                </p>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Value of x"
                    value={captcha}
                    onChange={(e) => {
                      setCaptcha(e.target.value);
                      setCaptchaError(false);
                    }}
                    className={`w-full bg-slate-950 border ${captchaError ? 'border-red-500' : 'border-slate-800'} focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-lg py-2 pl-3 pr-10 text-xs text-white placeholder-slate-600 outline-none transition-all`}
                    required
                  />
                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="absolute right-1.5 top-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 p-1 rounded transition-colors disabled:opacity-50"
                    id="footer-subscribe-btn"
                    title="Subscribe"
                  >
                    <Send className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {status === 'success' && (
                <div className="flex items-center gap-1.5 text-xs text-emerald-400 mt-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{msg}</span>
                </div>
              )}
              {status === 'error' && (
                <div className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>{msg}</span>
                </div>
              )}
            </form>
          </div>

        </div>

        {/* Bottom copyright line */}
        <div className="border-t border-slate-800/60 pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4" id="footer-bottom-nav">
          <div className="space-y-1 text-center sm:text-left">
            <p>
              {settings?.footerContent?.copyrightText || `© ${new Date().getFullYear()} MADECC GROUP. All rights reserved.`}
            </p>
            {(settings?.rccmNumber || settings?.niuTaxId) && (
              <p className="text-[10px] font-mono text-slate-600">
                {settings.rccmNumber && <span>RCCM: {settings.rccmNumber} </span>}
                {settings.niuTaxId && <span>• NIU: {settings.niuTaxId} </span>}
                {settings.legalStatus && <span>• {settings.legalStatus}</span>}
              </p>
            )}
          </div>
          <div className="flex gap-6">
            <button 
              onClick={() => setModalType('privacy')} 
              className="hover:text-amber-500 cursor-pointer transition-colors focus:outline-none"
              id="footer-privacy-btn"
            >
              Privacy Policy
            </button>
            <button 
              onClick={() => setModalType('terms')} 
              className="hover:text-amber-500 cursor-pointer transition-colors focus:outline-none"
              id="footer-terms-btn"
            >
              Terms of Service
            </button>
            <button 
              onClick={() => setModalType('safety')} 
              className="hover:text-amber-500 cursor-pointer transition-colors focus:outline-none"
              id="footer-safety-btn"
            >
              Health & Safety Statement
            </button>
            <button 
              onClick={() => setCurrentTab('data-deletion')} 
              className="text-amber-500/90 hover:text-amber-400 font-semibold cursor-pointer transition-colors focus:outline-none"
              id="footer-data-deletion-btn"
            >
              Data Deletion
            </button>
          </div>
        </div>

      </div>

      {/* Legal Modal Overlay */}
      {modalType && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" id="legal-modal-overlay">
          <div className="bg-[#0E0E12] border border-slate-800 rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-250">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-850 flex items-center justify-between bg-slate-900/30">
              <h3 className="text-sm font-bold uppercase tracking-wider text-white font-mono">
                {modalType === 'privacy' && 'Privacy Policy & Cookie Statement'}
                {modalType === 'terms' && 'Terms of Service & AdSense Disclosures'}
                {modalType === 'safety' && 'MADECC Quality, Health, Safety & Environment (QHSE)'}
              </h3>
              <button 
                onClick={() => setModalType(null)}
                className="text-slate-400 hover:text-white bg-slate-850 hover:bg-slate-800 p-1.5 rounded-lg transition-all"
                id="close-legal-modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body (Scrollable content) */}
            <div className="p-6 overflow-y-auto text-xs text-slate-300 space-y-4 leading-relaxed font-sans">
              {modalType === 'privacy' && (
                <>
                  <p className="font-semibold text-amber-500 text-sm">Last Updated: February 2026</p>
                  <p>MADECC GROUP ("we", "our", or "us") is dedicated to protecting your privacy in compliance with standard global rules and the Cameroon Law No. 2010/012 on Cybersecurity and Cybercriminality. This Policy explains how we collect, store, and process your data when you visit our portal.</p>
                  
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-wider font-mono">1. Information We Collect</h4>
                  <p>We only collect personal information that you voluntarily submit to us via our contact form, newsletter subscriptions, custom consultation appointments, and feedback reviews. This includes your Name, Email address, phone number, project details, and any attachments or files you share.</p>
                  
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-wider font-mono">2. How We Use Your Data</h4>
                  <p>Your data is processed solely to handle your construction inquiries, schedule secure on-site evaluations, distribute corporate newsletters, publish authorized client testimonials, and comply with safety inspection logs. We do not sell or trade your information to third-party marketing companies.</p>

                  <h4 className="font-bold text-white uppercase text-[10px] tracking-wider font-mono">3. Cookies and Google AdSense</h4>
                  <p>We utilize essential cookies to keep your authentication session active and save regional UI choices. In addition, third-party vendors, including Google, use cookies to serve ads based on your prior visits to our website. Google's use of advertising cookies enables it and its partners to serve ads based on your visit to our sites and/or other sites on the Internet. You may opt out of personalized advertising by visiting Ads Settings.</p>
                </>
              )}

              {modalType === 'terms' && (
                <>
                  <p className="font-semibold text-amber-500 text-sm">Last Updated: February 2026</p>
                  <p>By accessing or using the MADECC GROUP portal, you agree to be bound by these Terms of Service, all applicable laws and regulations in Cameroon, and agree that you are responsible for compliance with any local structural building permits.</p>
                  
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-wider font-mono">1. Use License & Intellectual Property</h4>
                  <p>Permission is granted to temporarily download one copy of materials (architectural briefs, project documents, or media) on our website for personal, non-commercial transitory viewing only. All technical designs, renderings, codebases, and structural blueprints are the exclusive intellectual property of MADECC GROUP and cannot be copied or redistributed without written consent.</p>
                  
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-wider font-mono">2. Accuracy of Project Estimates</h4>
                  <p>The pricing metrics, service price ranges (e.g., in FCFA), and structural valuations presented on our site are provided for preliminary estimation and information purposes only. Formal legally binding quotes are only established through finalized engineering contracts signed by authorized directors at our Douala offices.</p>

                  <h4 className="font-bold text-white uppercase text-[10px] tracking-wider font-mono">3. External Links & AdSense Disclosures</h4>
                  <p>MADECC GROUP has not fully reviewed all third-party sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link or banner advertisement does not imply endorsement by MADECC GROUP. Use of any such linked website is at the user's own risk.</p>
                </>
              )}

              {modalType === 'safety' && (
                <>
                  <p className="font-semibold text-amber-500 text-sm">MADECC Zero-Harm Corporate Directive</p>
                  <p>At MADECC GROUP Cameroon, safety is not merely a policy—it is our absolute operational baseline. We are committed to achieving a Zero-Harm workforce environment across all infrastructure, commercial, and residential developments.</p>
                  
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-wider font-mono">1. Protective Gear & Safety Protocols</h4>
                  <p>Every single construction site we operate in Douala, Kribi, and other regions enforces mandatory personal protective equipment (PPE) protocols, including high-visibility vests, impact-certified hard hats, steel-toed boots, and harness guidelines for height work. Structural frames are certified weekly by certified safety officers.</p>
                  
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-wider font-mono">2. Environmental Stewardship</h4>
                  <p>We conform strictly to Cameroon’s Ministry of Environment and Protection of Nature guidelines. This includes proper handling and safe disposal of materials, minimizing chemical runoff, and ensuring that our green and sustainable projects maintain active environmental impact assessments (EIA).</p>

                  <h4 className="font-bold text-white uppercase text-[10px] tracking-wider font-mono">3. Training and Certifications</h4>
                  <p>All on-site welders, heavy machinery operators, masons, and project managers receive mandatory quarterly safety training. This thorough training ensures immediate response capabilities, proper emergency fire drills, and compliance with general ISO 45001 standards.</p>
                </>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-850 bg-[#0A0A0C] flex justify-end">
              <button 
                onClick={() => setModalType(null)}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2 rounded-xl text-xs font-bold transition-all"
                id="close-legal-modal-footer"
              >
                Acknowledge & Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Website Modal Overlay */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4" id="share-modal-overlay">
          <div className="bg-[#0E0E12] border border-slate-800 rounded-2xl max-w-md w-full overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-250">
            {/* Header */}
            <div className="p-5 border-b border-slate-850 flex items-center justify-between bg-slate-900/40">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">Share MADECC GROUP</h3>
                  <p className="text-[11px] text-slate-400">Recommend our engineering & construction firm</p>
                </div>
              </div>
              <button 
                onClick={() => setShowShareModal(false)}
                className="text-slate-400 hover:text-white bg-slate-850 hover:bg-slate-800 p-1.5 rounded-lg transition-all"
                id="close-share-modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Social Share Grid */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-2.5">
                {/* WhatsApp */}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareText + ' ' + websiteUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-emerald-950/40 border border-emerald-800/40 text-emerald-300 hover:bg-emerald-900/60 transition-all text-xs font-semibold"
                >
                  <span className="w-7 h-7 rounded-lg bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-xs font-mono">WA</span>
                  <span>WhatsApp</span>
                </a>

                {/* LinkedIn */}
                <a
                  href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(websiteUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-blue-950/40 border border-blue-800/40 text-blue-300 hover:bg-blue-900/60 transition-all text-xs font-semibold"
                >
                  <span className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs font-mono">in</span>
                  <span>LinkedIn</span>
                </a>

                {/* Facebook */}
                <a
                  href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(websiteUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-sky-950/40 border border-sky-800/40 text-sky-300 hover:bg-sky-900/60 transition-all text-xs font-semibold"
                >
                  <span className="w-7 h-7 rounded-lg bg-sky-600 text-white flex items-center justify-center font-bold text-xs font-mono">fb</span>
                  <span>Facebook</span>
                </a>

                {/* X / Twitter */}
                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(websiteUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-900 border border-slate-750 text-slate-200 hover:bg-slate-800 transition-all text-xs font-semibold"
                >
                  <span className="w-7 h-7 rounded-lg bg-slate-700 text-white flex items-center justify-center font-bold text-xs font-mono">𝕏</span>
                  <span>X / Twitter</span>
                </a>
              </div>

              {/* Email Referral */}
              <a
                href={`mailto:?subject=${encodeURIComponent('MADECC GROUP — Premier Construction & Engineering Firm')}&body=${encodeURIComponent(shareText + '\n\nVisit: ' + websiteUrl)}`}
                className="flex items-center justify-center gap-2 w-full p-2.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-xs font-semibold transition-all"
              >
                <Mail className="w-4 h-4 text-amber-500" />
                <span>Share via Email</span>
              </a>

              {/* Copy URL Link Bar */}
              <div className="pt-2 border-t border-slate-850 space-y-1.5">
                <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block">Official Canonical Link</label>
                <div className="flex items-center gap-2 bg-slate-950 border border-slate-800 rounded-xl p-1.5 pl-3">
                  <span className="text-xs text-slate-300 font-mono truncate flex-1">{websiteUrl}</span>
                  <button
                    onClick={handleCopyLink}
                    className="flex items-center gap-1 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-3 border-t border-slate-850 bg-[#0A0A0C] flex justify-end">
              <button 
                onClick={() => setShowShareModal(false)}
                className="bg-slate-850 hover:bg-slate-800 text-slate-300 px-4 py-1.5 rounded-lg text-xs font-semibold transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </footer>
  );
}
