import React, { useState } from 'react';
import { getCsrfHeaders } from '../lib/csrf.ts';
import { 
  HardHat, 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  CheckCircle2, 
  AlertCircle,
  X
} from 'lucide-react';

interface FooterProps {
  setCurrentTab: (tab: string) => void;
}

export default function Footer({ setCurrentTab }: FooterProps) {
  const [email, setEmail] = useState('');
  const [captcha, setCaptcha] = useState('');
  const [captchaError, setCaptchaError] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [msg, setMsg] = useState('');
  const [modalType, setModalType] = useState<'privacy' | 'terms' | 'safety' | null>(null);

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
                  src="/logo.png" 
                  alt="MADECC Group Logo" 
                  className="h-full w-full object-contain"
                  referrerPolicy="no-referrer"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              </div>
              <span className="font-sans font-extrabold text-lg tracking-tight text-white">
                MADECC<span className="text-amber-500">GROUP</span>
              </span>
            </div>
            <p className="text-sm text-slate-400 leading-relaxed">
              MADECC Group is a premier multi-disciplinary construction, design-build, and civil engineering firm. We construct landmarks of absolute structural integrity, sustainability, and architectural excellence.
            </p>
            <div className="flex items-center gap-2 pt-2 text-xs font-mono text-slate-500">
              <Clock className="w-4 h-4 text-amber-500" />
              <span>Mon - Fri: 08:00 - 18:00</span>
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
            </ul>
          </div>

          {/* Column 3: Contact Details */}
          <div>
            <h3 className="text-white font-semibold text-sm uppercase tracking-wider mb-6 border-b border-slate-800 pb-2">Contact Details</h3>
            <ul className="space-y-4 text-sm">
              <li className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <span>Yaoundé Mbankolo, Cameroon<br /><span className="text-xs text-amber-400 font-mono">Operating Nationwide in Cameroon &amp; Across Africa</span></span>
              </li>
              <li className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-amber-500 shrink-0" />
                  <a href="tel:237683316486" className="hover:text-amber-400 transition-colors font-mono font-bold">+237 683 316 486</a>
                </div>
                <div className="pl-8 text-xs text-slate-500 font-mono">
                  General & WhatsApp Support
                </div>
              </li>
              <li className="flex flex-col gap-1.5">
                <div className="flex items-center gap-3">
                  <Mail className="w-5 h-5 text-amber-500 shrink-0" />
                  <a href="mailto:kreboya603@gmail.com" className="hover:text-amber-400 transition-colors font-mono">kreboya603@gmail.com</a>
                </div>
                <div className="flex items-center gap-3 pl-8">
                  <a href="mailto:madecccons@gmail.com" className="hover:text-amber-400 transition-colors font-mono">madecccons@gmail.com</a>
                </div>
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
          <p>© {new Date().getFullYear()} MADECC Group. All rights reserved.</p>
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
                  <p>MADECC Group ("we", "our", or "us") is dedicated to protecting your privacy in compliance with standard global rules and the Cameroon Law No. 2010/012 on Cybersecurity and Cybercriminality. This Policy explains how we collect, store, and process your data when you visit our portal.</p>
                  
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
                  <p>By accessing or using the MADECC Group portal, you agree to be bound by these Terms of Service, all applicable laws and regulations in Cameroon, and agree that you are responsible for compliance with any local structural building permits.</p>
                  
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-wider font-mono">1. Use License & Intellectual Property</h4>
                  <p>Permission is granted to temporarily download one copy of materials (architectural briefs, project documents, or media) on our website for personal, non-commercial transitory viewing only. All technical designs, renderings, codebases, and structural blueprints are the exclusive intellectual property of MADECC Group and cannot be copied or redistributed without written consent.</p>
                  
                  <h4 className="font-bold text-white uppercase text-[10px] tracking-wider font-mono">2. Accuracy of Project Estimates</h4>
                  <p>The pricing metrics, service price ranges (e.g., in FCFA), and structural valuations presented on our site are provided for preliminary estimation and information purposes only. Formal legally binding quotes are only established through finalized engineering contracts signed by authorized directors at our Douala offices.</p>

                  <h4 className="font-bold text-white uppercase text-[10px] tracking-wider font-mono">3. External Links & AdSense Disclosures</h4>
                  <p>MADECC Group has not fully reviewed all third-party sites linked to its website and is not responsible for the contents of any such linked site. The inclusion of any link or banner advertisement does not imply endorsement by MADECC Group. Use of any such linked website is at the user's own risk.</p>
                </>
              )}

              {modalType === 'safety' && (
                <>
                  <p className="font-semibold text-amber-500 text-sm">MADECC Zero-Harm Corporate Directive</p>
                  <p>At MADECC Group Cameroon, safety is not merely a policy—it is our absolute operational baseline. We are committed to achieving a Zero-Harm workforce environment across all infrastructure, commercial, and residential developments.</p>
                  
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

    </footer>
  );
}
