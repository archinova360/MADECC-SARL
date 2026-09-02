import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Trash2, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  FileText, 
  Lock, 
  Building2, 
  ArrowLeft, 
  Copy, 
  Check, 
  ExternalLink,
  Info,
  Mail,
  UserX,
  Database,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { useTheme } from '../lib/ThemeContext.tsx';

interface DataDeletionProps {
  onNavigateToTab?: (tab: string, extraState?: any) => void;
  setCurrentTab?: (tab: string) => void;
}

interface DeletionStatusResult {
  trackingCode: string;
  maskedEmail: string;
  maskedFullName: string;
  requestType: string;
  status: string;
  complianceNotes?: string;
  createdAt: string;
  processedAt?: string;
}

export default function DataDeletion({ onNavigateToTab, setCurrentTab }: DataDeletionProps) {
  const { theme } = useTheme();
  const isLight = theme === 'light';

  // Navigation helper
  const navigate = (tab: string) => {
    if (onNavigateToTab) onNavigateToTab(tab);
    else if (setCurrentTab) setCurrentTab(tab);
  };

  const [activeView, setActiveView] = useState<'submit' | 'track' | 'instructions'>('submit');

  // Form State
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [requestType, setRequestType] = useState<'all' | 'account' | 'newsletter' | 'inquiries' | 'cookies_adsense'>('all');
  const [details, setDetails] = useState('');
  const [consentConfirmed, setConsentConfirmed] = useState(false);

  // Security Math Captcha
  const [num1, setNum1] = useState(() => Math.floor(Math.random() * 8) + 2);
  const [num2, setNum2] = useState(() => Math.floor(Math.random() * 6) + 1);
  const [captchaInput, setCaptchaInput] = useState('');

  // Submission Status
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submittedResult, setSubmittedResult] = useState<{ trackingCode: string; estimatedHours: number } | null>(null);
  const [copiedCode, setCopiedCode] = useState(false);

  // Lookup / Tracking State
  const [lookupQuery, setLookupQuery] = useState('');
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState<DeletionStatusResult | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // URL query parameter parsing for auto-tracking
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const tracking = params.get('tracking') || params.get('code') || params.get('ref');
    if (tracking) {
      setLookupQuery(tracking);
      setActiveView('track');
      performLookup(tracking);
    }
  }, []);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2500);
  };

  const resetCaptcha = () => {
    setNum1(Math.floor(Math.random() * 8) + 2);
    setNum2(Math.floor(Math.random() * 6) + 1);
    setCaptchaInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);

    if (!email || !email.includes('@')) {
      setSubmitError('Please enter a valid email address.');
      return;
    }

    if (!fullName || fullName.trim().length < 2) {
      setSubmitError('Please enter your full legal name or account name.');
      return;
    }

    if (!consentConfirmed) {
      setSubmitError('You must confirm that you authorize the irreversible deletion of your data.');
      return;
    }

    if (parseInt(captchaInput.trim(), 10) !== num1 + num2) {
      setSubmitError('Incorrect security verification answer. Please calculate again.');
      resetCaptcha();
      return;
    }

    setSubmitting(true);

    try {
      const res = await fetch('/api/compliance/data-deletion', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim(),
          phone: phone.trim() || undefined,
          requestType,
          details: details.trim() || undefined,
          captchaExpected: num1 + num2,
          captchaAnswer: parseInt(captchaInput.trim(), 10)
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to submit data deletion request.');
      }

      setSubmittedResult({
        trackingCode: data.trackingCode,
        estimatedHours: data.estimatedHours || 24
      });
      // Clear form
      setFullName('');
      setEmail('');
      setPhone('');
      setDetails('');
      setConsentConfirmed(false);
      resetCaptcha();
    } catch (err: any) {
      console.error('Data deletion submission error:', err);
      setSubmitError(err.message || 'An unexpected error occurred while communicating with the compliance server.');
    } finally {
      setSubmitting(false);
    }
  };

  const performLookup = async (codeToLookup?: string) => {
    const q = (codeToLookup || lookupQuery).trim();
    if (!q) {
      setLookupError('Please enter a valid tracking reference code or email address.');
      return;
    }

    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);

    try {
      const res = await fetch(`/api/compliance/data-deletion/status/${encodeURIComponent(q)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'No record found matching the requested tracking reference.');
      }

      setLookupResult(data);
    } catch (err: any) {
      setLookupError(err.message || 'Unable to retrieve status from the compliance ledger.');
    } finally {
      setLookupLoading(false);
    }
  };

  return (
    <div className={`min-h-screen py-10 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto font-sans transition-colors duration-200 ${
      isLight ? 'text-slate-800' : 'text-slate-100'
    }`} id="data-deletion-page">
      
      {/* Top Header & Breadcrumb */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <button
          onClick={() => navigate('home')}
          className={`inline-flex items-center gap-2 text-xs font-mono tracking-wider uppercase px-4 py-2 rounded-lg border transition-all cursor-pointer ${
            isLight
              ? 'text-amber-800 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30'
              : 'text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30'
          }`}
          id="deletion-back-home-btn"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Main Portal
        </button>

        <div className="flex items-center gap-2 text-xs font-mono">
          <ShieldCheck className="w-4 h-4 text-emerald-500" />
          <span className={isLight ? 'text-slate-600' : 'text-slate-400'}>
            REGULATORY COMPLIANCE URL: <strong className={isLight ? 'text-slate-900' : 'text-slate-200'}>madeccgroup.online/data-deletion</strong>
          </span>
        </div>
      </div>

      {/* Main Container */}
      <div className={`rounded-2xl border shadow-2xl overflow-hidden backdrop-blur-md transition-colors ${
        isLight
          ? 'bg-white/90 border-slate-200 shadow-slate-200/50'
          : 'bg-slate-900/80 border-slate-800 shadow-black/60'
      }`}>
        
        {/* Banner Header */}
        <div className={`p-6 sm:p-8 border-b ${
          isLight
            ? 'bg-gradient-to-r from-amber-50 via-slate-50 to-amber-50 border-slate-200'
            : 'bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-slate-800'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start sm:items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 shrink-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-red-500/10 text-red-500 font-bold border border-red-500/20">
                    GDPR &amp; AdSense Compliant
                  </span>
                  <span className="text-[10px] font-mono tracking-widest uppercase px-2 py-0.5 rounded bg-blue-500/10 text-blue-500 font-bold border border-blue-500/20">
                    Meta Platform Verified
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight mt-1">
                  User Data Deletion &amp; Privacy Rights
                </h1>
              </div>
            </div>

            <div className="text-xs font-mono space-y-1 sm:text-right text-slate-500">
              <p>Law No. 2010/012 (Cameroon)</p>
              <p>OHADA &bull; ISO 27001 Data Standards</p>
            </div>
          </div>

          <p className={`text-sm mt-3 leading-relaxed max-w-3xl ${
            isLight ? 'text-slate-600' : 'text-slate-300'
          }`}>
            MADECC GROUP respects your fundamental right to digital privacy, anonymity, and data erasure. Use this official portal to initiate a formal data deletion request, revoke advertising personalization profiles, or track the live status of an existing request.
          </p>

          {/* Interactive Navigation Tabs */}
          <div className="flex flex-wrap items-center gap-2 mt-6 pt-4 border-t border-slate-200/60 dark:border-slate-800/80">
            <button
              onClick={() => setActiveView('submit')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-2 cursor-pointer ${
                activeView === 'submit'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
              }`}
              id="tab-submit-deletion"
            >
              <Trash2 className="w-3.5 h-3.5" />
              1. Submit Deletion Request
            </button>

            <button
              onClick={() => setActiveView('track')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-2 cursor-pointer ${
                activeView === 'track'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
              }`}
              id="tab-track-deletion"
            >
              <Search className="w-3.5 h-3.5" />
              2. Track Request Status
            </button>

            <button
              onClick={() => setActiveView('instructions')}
              className={`px-4 py-2 rounded-lg text-xs font-semibold tracking-wide transition-all flex items-center gap-2 cursor-pointer ${
                activeView === 'instructions'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20'
                  : isLight
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    : 'bg-slate-800 hover:bg-slate-750 text-slate-300'
              }`}
              id="tab-instructions-deletion"
            >
              <Info className="w-3.5 h-3.5" />
              3. Meta &amp; AdSense Guidelines
            </button>
          </div>
        </div>

        {/* View 1: Submit Form */}
        {activeView === 'submit' && (
          <div className="p-6 sm:p-10 space-y-8">
            
            {/* If successfully submitted */}
            {submittedResult ? (
              <div className={`p-8 rounded-2xl border text-center space-y-6 ${
                isLight ? 'bg-emerald-50/80 border-emerald-200' : 'bg-emerald-950/30 border-emerald-800/60'
              }`} id="submission-success-banner">
                <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-500 mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                    Data Deletion Request Successfully Registered
                  </h3>
                  <p className={`text-xs mt-2 max-w-md mx-auto ${isLight ? 'text-slate-600' : 'text-slate-300'}`}>
                    Your request has been logged in the MADECC Compliance Ledger. Our Data Protection Officer has been notified and will execute the permanent purge within <strong>{submittedResult.estimatedHours} business hours</strong>.
                  </p>
                </div>

                {/* Tracking Reference Box */}
                <div className={`max-w-md mx-auto p-4 rounded-xl border font-mono ${
                  isLight ? 'bg-white border-emerald-200' : 'bg-slate-950 border-emerald-900'
                }`}>
                  <span className="text-[10px] text-slate-500 uppercase tracking-widest block mb-1">
                    Your Official Compliance Tracking Code
                  </span>
                  <div className="flex items-center justify-center gap-3">
                    <span className="text-lg sm:text-xl font-black text-amber-500 tracking-wider">
                      {submittedResult.trackingCode}
                    </span>
                    <button
                      onClick={() => handleCopyCode(submittedResult.trackingCode)}
                      className={`p-2 rounded-lg border transition-all ${
                        isLight ? 'bg-slate-100 hover:bg-slate-200 border-slate-200' : 'bg-slate-800 hover:bg-slate-700 border-slate-700'
                      }`}
                      title="Copy Tracking Code"
                      id="copy-tracking-code-btn"
                    >
                      {copiedCode ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-slate-400" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
                  <button
                    onClick={() => {
                      setLookupQuery(submittedResult.trackingCode);
                      setActiveView('track');
                      performLookup(submittedResult.trackingCode);
                    }}
                    className="px-5 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg transition-all"
                  >
                    View Live Tracking Status &rarr;
                  </button>
                  <button
                    onClick={() => setSubmittedResult(null)}
                    className={`px-4 py-2.5 rounded-lg text-xs font-semibold border ${
                      isLight ? 'border-slate-300 hover:bg-slate-100' : 'border-slate-700 hover:bg-slate-800'
                    }`}
                  >
                    Submit Another Request
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6" id="data-deletion-form">
                
                {/* Information Callout */}
                <div className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
                  isLight ? 'bg-amber-50 border-amber-200 text-amber-900' : 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                }`}>
                  <Info className="w-5 h-5 shrink-0 mt-0.5 text-amber-500" />
                  <div>
                    <strong className="font-bold">Notice to Users &amp; AdSense Auditors:</strong> Upon submitting this form, all associated database records (including inquiries, appointment slots, newsletter emails, uploaded project documents, and personalized advertising identifiers) will be queued for automated eradication in compliance with Google AdSense, Meta Graph API, and GDPR standards.
                  </div>
                </div>

                {submitError && (
                  <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{submitError}</span>
                  </div>
                )}

                {/* Form Fields Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  {/* Full Name */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold flex items-center justify-between">
                      <span>Full Legal Name / Account Name <span className="text-red-500">*</span></span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Jean-Paul Mbarga or Corporate Entity"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-900'
                          : 'bg-slate-950 border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-white'
                      }`}
                      id="input-deletion-fullname"
                    />
                  </div>

                  {/* Registered Email */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold flex items-center justify-between">
                      <span>Registered Email Address <span className="text-red-500">*</span></span>
                    </label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. client@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-900'
                          : 'bg-slate-950 border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-white'
                      }`}
                      id="input-deletion-email"
                    />
                  </div>

                  {/* Phone Number (Optional) */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">
                      Telephone / WhatsApp Number (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +237 683 316 486"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-900'
                          : 'bg-slate-950 border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-white'
                      }`}
                      id="input-deletion-phone"
                    />
                  </div>

                  {/* Deletion Scope Selector */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold">
                      Scope of Deletion <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={requestType}
                      onChange={(e: any) => setRequestType(e.target.value)}
                      className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                        isLight
                          ? 'bg-slate-50 border-slate-300 focus:bg-white focus:border-amber-500 text-slate-900'
                          : 'bg-slate-950 border-slate-800 focus:border-amber-500 text-white'
                      }`}
                      id="select-deletion-scope"
                    >
                      <option value="all">Full Complete Purge (Account, Blueprints, Estimates &amp; Inquiries)</option>
                      <option value="account">User Account &amp; Auth Credentials Only</option>
                      <option value="newsletter">Newsletter Subscription &amp; Marketing Opt-Out</option>
                      <option value="inquiries">Specific Project Inquiries &amp; Contact History</option>
                      <option value="cookies_adsense">Google AdSense / Analytics Identifier Erasure</option>
                    </select>
                  </div>
                </div>

                {/* Additional Details Textarea */}
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold">
                    Specific Details / Notes (Optional)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide any specific project references, quote codes, or additional instructions for our Data Protection Officer..."
                    value={details}
                    onChange={(e) => setDetails(e.target.value)}
                    className={`w-full px-4 py-2.5 rounded-xl border text-sm outline-none transition-all ${
                      isLight
                        ? 'bg-slate-50 border-slate-300 focus:bg-white focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-slate-900'
                        : 'bg-slate-950 border-slate-800 focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 text-white'
                    }`}
                    id="input-deletion-details"
                  />
                </div>

                {/* Anti-Spam Math CAPTCHA */}
                <div className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                  isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <div className="flex items-center gap-3">
                    <Lock className="w-5 h-5 text-amber-500 shrink-0" />
                    <div>
                      <span className="text-xs font-semibold block">Security Verification Challenge</span>
                      <span className="text-xs text-slate-500 font-mono">Solve the arithmetic verification equation:</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono font-bold text-sm px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-500">
                      {num1} + {num2} = ?
                    </span>
                    <input
                      type="number"
                      required
                      placeholder="Answer"
                      value={captchaInput}
                      onChange={(e) => setCaptchaInput(e.target.value)}
                      className={`w-24 px-3 py-1.5 rounded-lg border text-sm text-center outline-none font-mono ${
                        isLight ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-700'
                      }`}
                      id="input-deletion-captcha"
                    />
                  </div>
                </div>

                {/* Legal Consent Checkbox */}
                <div className="flex items-start gap-3 pt-2">
                  <input
                    type="checkbox"
                    id="consent-checkbox"
                    checked={consentConfirmed}
                    onChange={(e) => setConsentConfirmed(e.target.checked)}
                    className="w-4 h-4 mt-1 rounded text-amber-500 focus:ring-amber-500 cursor-pointer"
                  />
                  <label htmlFor="consent-checkbox" className={`text-xs leading-relaxed cursor-pointer ${
                    isLight ? 'text-slate-600' : 'text-slate-300'
                  }`}>
                    I hereby certify that I am the authorized owner or legal representative of the email address provided above. I understand that once executed, this data erasure is irreversible and will permanently delete my project specifications, quote history, and saved preferences from MADECC GROUP's servers.
                  </label>
                </div>

                {/* Submit Action Button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-sm tracking-wide shadow-lg shadow-red-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    id="submit-deletion-btn"
                  >
                    {submitting ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing Compliance Request...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Submit Formal Data Deletion Request &rarr;
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}

          </div>
        )}

        {/* View 2: Live Status Lookup */}
        {activeView === 'track' && (
          <div className="p-6 sm:p-10 space-y-8" id="track-deletion-view">
            
            <div className="max-w-xl mx-auto space-y-4 text-center">
              <h2 className="text-xl font-bold">Look Up Live Deletion Request Status</h2>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                Enter your unique tracking code (e.g. <code>MADECC-DEL-2026-XXXX</code>) or your registered email address to query real-time audit ledger status.
              </p>

              <div className="flex gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Enter tracking code (MADECC-DEL-...) or email"
                  value={lookupQuery}
                  onChange={(e) => setLookupQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      performLookup();
                    }
                  }}
                  className={`flex-1 px-4 py-3 rounded-xl border text-sm font-mono outline-none ${
                    isLight
                      ? 'bg-slate-50 border-slate-300 focus:bg-white focus:border-amber-500'
                      : 'bg-slate-950 border-slate-800 focus:border-amber-500'
                  }`}
                  id="lookup-tracking-input"
                />
                <button
                  onClick={() => performLookup()}
                  disabled={lookupLoading}
                  className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm flex items-center gap-2 shrink-0 transition-all cursor-pointer disabled:opacity-50"
                  id="lookup-tracking-btn"
                >
                  {lookupLoading ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                  Search
                </button>
              </div>

              {lookupError && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-xs flex items-center gap-2 text-left">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{lookupError}</span>
                </div>
              )}
            </div>

            {/* Lookup Result Card */}
            {lookupResult && (
              <div className={`max-w-2xl mx-auto rounded-2xl border p-6 sm:p-8 space-y-6 animate-in fade-in zoom-in-95 duration-200 ${
                isLight ? 'bg-slate-50 border-slate-200' : 'bg-slate-950 border-slate-800'
              }`} id="lookup-result-card">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 pb-4">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-widest text-slate-500 block">
                      Tracking Reference
                    </span>
                    <span className="text-lg font-black font-mono text-amber-500">
                      {lookupResult.trackingCode}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    {lookupResult.status === 'completed' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold font-mono uppercase bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Erased &amp; Completed
                      </span>
                    ) : lookupResult.status === 'in_progress' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold font-mono uppercase bg-blue-500/10 text-blue-500 border border-blue-500/30 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 animate-spin" /> In Progress
                      </span>
                    ) : lookupResult.status === 'rejected' ? (
                      <span className="px-3 py-1 rounded-full text-xs font-bold font-mono uppercase bg-red-500/10 text-red-500 border border-red-500/30 flex items-center gap-1.5">
                        <AlertCircle className="w-3.5 h-3.5" /> Rejected
                      </span>
                    ) : (
                      <span className="px-3 py-1 rounded-full text-xs font-bold font-mono uppercase bg-amber-500/10 text-amber-500 border border-amber-500/30 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" /> Pending Verification
                      </span>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500 block">Applicant (Masked):</span>
                    <span className="font-semibold">{lookupResult.maskedFullName}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Email Identifier (Masked):</span>
                    <span className="font-semibold font-mono">{lookupResult.maskedEmail}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Scope of Deletion:</span>
                    <span className="font-semibold uppercase">{lookupResult.requestType}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block">Date Submitted:</span>
                    <span className="font-semibold font-mono">{new Date(lookupResult.createdAt).toLocaleString()}</span>
                  </div>
                  {lookupResult.processedAt && (
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 block">Execution Timestamp:</span>
                      <span className="font-semibold text-emerald-500 font-mono">{new Date(lookupResult.processedAt).toLocaleString()}</span>
                    </div>
                  )}
                </div>

                {lookupResult.complianceNotes && (
                  <div className={`p-4 rounded-xl border text-xs leading-relaxed ${
                    isLight ? 'bg-white border-slate-200 text-slate-700' : 'bg-slate-900 border-slate-850 text-slate-300'
                  }`}>
                    <span className="font-bold text-amber-500 block mb-1 font-mono uppercase text-[10px]">
                      Data Protection Officer Audit Log:
                    </span>
                    <p>{lookupResult.complianceNotes}</p>
                  </div>
                )}
              </div>
            )}

          </div>
        )}

        {/* View 3: Meta & AdSense Instructions */}
        {activeView === 'instructions' && (
          <div className="p-6 sm:p-10 space-y-8 text-sm leading-relaxed" id="instructions-view">
            
            <section className="space-y-3">
              <h3 className="text-base font-bold flex items-center gap-2 text-amber-500 font-mono uppercase tracking-wider">
                <ShieldCheck className="w-5 h-5" /> 1. Google AdSense &amp; Advertising Personalization Opt-Out
              </h3>
              <p className={isLight ? 'text-slate-600' : 'text-slate-300'}>
                MADECC GROUP complies fully with Google AdSense Publisher Policies and international digital advertising regulations:
              </p>
              <ul className="list-disc pl-5 space-y-2 text-xs text-slate-400">
                <li>
                  <strong>Google Advertising Settings:</strong> You can manage your personalized ad settings or opt-out directly at <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:underline inline-flex items-center gap-1 font-semibold">Google Ads Settings <ExternalLink className="w-3 h-3" /></a>.
                </li>
                <li>
                  <strong>Network Advertising Initiative (NAI):</strong> You may opt-out of third-party ad server cookies via the <a href="https://optout.networkadvertising.org" target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:underline inline-flex items-center gap-1 font-semibold">NAI Consumer Opt-Out Portal <ExternalLink className="w-3 h-3" /></a>.
                </li>
                <li>
                  <strong>Browser Cookie Controls:</strong> You may clear cookies or configure your browser to reject third-party tracking identifiers without affecting your core ability to browse MADECC engineering portfolios.
                </li>
              </ul>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold flex items-center gap-2 text-blue-500 font-mono uppercase tracking-wider">
                <Lock className="w-5 h-5" /> 2. Meta (Facebook &amp; Instagram) Data Deletion Instructions
              </h3>
              <p className={isLight ? 'text-slate-600' : 'text-slate-300'}>
                According to Meta Platform Rules for Facebook App Integration: If you logged into MADECC GROUP using Facebook or connected your Meta Account, you can remove your activities by following these steps:
              </p>
              <div className={`p-4 rounded-xl border text-xs space-y-2 font-mono ${
                isLight ? 'bg-slate-50 border-slate-200 text-slate-700' : 'bg-slate-950 border-slate-800 text-slate-300'
              }`}>
                <p>1. Go to your Facebook Account’s <strong>Settings &amp; Privacy &gt; Settings</strong>.</p>
                <p>2. Click on <strong>Apps and Websites</strong> to view all connected web applications.</p>
                <p>3. Search for <strong>MADECC GROUP S.A.</strong> or our associated client login.</p>
                <p>4. Click the <strong>Remove</strong> button to revoke all app permissions.</p>
                <p>5. Click on <strong>View Removed Apps and Websites</strong> and click <strong>Send Request</strong> to automatically trigger our automated callback.</p>
              </div>
              <p className="text-xs text-slate-500">
                Our server operates an automated data deletion callback endpoint at <code>https://madeccgroup.online/api/compliance/meta-data-deletion</code> which automatically generates an official tracking reference and erases cached session tokens.
              </p>
            </section>

            <section className="space-y-3">
              <h3 className="text-base font-bold flex items-center gap-2 text-emerald-500 font-mono uppercase tracking-wider">
                <FileText className="w-5 h-5" /> 3. Legal Retention Exceptions (OHADA Commercial Code)
              </h3>
              <p className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                In accordance with the <strong>OHADA Uniform Act on General Commercial Law</strong> and Cameroonian tax regulations, tax invoices, certified structural safety inspection certificates, and executed construction contracts must be retained in our archive for a statutory period of ten (10) years for fiscal and civil structural guarantee liability (Article 1792 of the Civil Code). All non-statutory personal data, marketing subscriptions, and telemetry identifiers will be permanently destroyed.
              </p>
            </section>

            {/* DPO Contact Card */}
            <div className={`p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
              isLight ? 'bg-amber-500/10 border-amber-500/30 text-slate-800' : 'bg-amber-500/5 border-amber-500/20 text-slate-200'
            }`}>
              <div className="flex items-center gap-3">
                <Building2 className="w-6 h-6 text-amber-500 shrink-0" />
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider block font-mono">
                    Direct Contact: Data Protection Officer
                  </span>
                  <span className="text-xs text-slate-500">
                    MADECC GROUP S.A. Legal &amp; Compliance Office, Yaoundé Mbankolo, Cameroon
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <a
                  href="mailto:madecccons@gmail.com?subject=Formal%20Data%20Deletion%20Inquiry"
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all"
                >
                  <Mail className="w-3.5 h-3.5" />
                  Email DPO Desk
                </a>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* Bottom Compliance Badge */}
      <div className="mt-8 text-center text-xs text-slate-500 font-mono space-y-1">
        <p>&copy; {new Date().getFullYear()} MADECC GROUP S.A. &bull; Official Digital Compliance Portal</p>
        <p>Accessible worldwide at <a href="https://madeccgroup.online/data-deletion" className="text-amber-500 hover:underline">https://madeccgroup.online/data-deletion</a></p>
      </div>

    </div>
  );
}
