import React, { useState, useEffect } from 'react';
import { Cookie, ShieldCheck, X, Check, ExternalLink } from 'lucide-react';

interface CookieConsentBannerProps {
  onOpenPrivacyPolicy: () => void;
}

export default function CookieConsentBanner({ onOpenPrivacyPolicy }: CookieConsentBannerProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [preferences, setPreferences] = useState({
    essential: true,
    analytics: true,
    advertising: true
  });

  useEffect(() => {
    try {
      const consent = localStorage.getItem('madecc_cookie_consent');
      if (!consent) {
        // Small delay so page renders smoothly first
        const timer = setTimeout(() => setIsVisible(true), 800);
        return () => clearTimeout(timer);
      }
    } catch (_) {
      // Storage unavailable fallback
    }
  }, []);

  const handleAcceptAll = () => {
    try {
      localStorage.setItem('madecc_cookie_consent', JSON.stringify({
        essential: true,
        analytics: true,
        advertising: true,
        timestamp: new Date().toISOString()
      }));
    } catch (_) {}
    setIsVisible(false);
  };

  const handleDeclineNonEssential = () => {
    try {
      localStorage.setItem('madecc_cookie_consent', JSON.stringify({
        essential: true,
        analytics: false,
        advertising: false,
        timestamp: new Date().toISOString()
      }));
    } catch (_) {}
    setIsVisible(false);
  };

  const handleSavePreferences = () => {
    try {
      localStorage.setItem('madecc_cookie_consent', JSON.stringify({
        ...preferences,
        essential: true,
        timestamp: new Date().toISOString()
      }));
    } catch (_) {}
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div
      role="region"
      aria-label="Cookie consent banner"
      id="cookie-consent-banner"
      className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6 bg-slate-950/95 backdrop-blur-md border-t border-slate-800 shadow-[0_-10px_35px_rgba(0,0,0,0.6)] animate-in slide-in-from-bottom duration-300"
    >
      <div className="max-w-6xl mx-auto">
        {!showSettings ? (
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
            <div className="space-y-1.5 flex-1 pr-2">
              <div className="flex items-center gap-2">
                <span className="p-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Cookie className="w-4 h-4" />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-white font-mono">
                  Cookie &amp; Advertising Compliance Notice
                </span>
                <span className="text-[10px] bg-slate-900 text-emerald-400 font-mono px-2 py-0.5 rounded border border-emerald-500/30 font-bold">
                  GDPR &amp; Google AdSense Ready
                </span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
                We use cookies and similar technologies (including Google AdSense and analytics) to guarantee website security, store regional preferences, analyze technical traffic, and serve contextual architectural ads. You can accept all, reject non-essential cookies, or customize your preferences. For more details, review our{' '}
                <button
                  type="button"
                  onClick={onOpenPrivacyPolicy}
                  className="text-amber-400 font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                >
                  Privacy &amp; Cookie Policy <ExternalLink className="w-3 h-3 ml-0.5 inline" />
                </button>.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5 shrink-0 w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setShowSettings(true)}
                className="px-3.5 py-2 text-xs font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-850 border border-slate-800 rounded-lg transition-all cursor-pointer"
                id="cookie-settings-btn"
              >
                Customize
              </button>
              <button
                type="button"
                onClick={handleDeclineNonEssential}
                className="px-3.5 py-2 text-xs font-semibold text-slate-400 hover:text-white bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 rounded-lg transition-all cursor-pointer"
                id="cookie-decline-btn"
              >
                Essential Only
              </button>
              <button
                type="button"
                onClick={handleAcceptAll}
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow transition-all cursor-pointer flex items-center gap-1.5"
                id="cookie-accept-all-btn"
              >
                <Check className="w-3.5 h-3.5 stroke-[3]" />
                Accept All
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <h3 className="text-xs font-bold text-white font-mono uppercase tracking-wider">
                  Privacy &amp; Cookie Preferences
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="text-slate-400 hover:text-white text-xs bg-slate-900 p-1 rounded-md"
                aria-label="Back to banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">Strictly Essential</span>
                    <span className="text-[10px] text-amber-500 font-mono font-bold">Always Active</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Necessary for user sessions, CSRF security tokens, and core database interactions.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">Analytics &amp; Performance</span>
                    <input
                      type="checkbox"
                      checked={preferences.analytics}
                      onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                      className="accent-amber-500 w-4 h-4 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Helps us understand traffic flow, page performance, and optimize technical calculators.
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-white">Google AdSense Advertising</span>
                    <input
                      type="checkbox"
                      checked={preferences.advertising}
                      onChange={(e) => setPreferences({ ...preferences, advertising: e.target.checked })}
                      className="accent-amber-500 w-4 h-4 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-400 leading-normal">
                    Allows Google and third-party vendors to serve relevant engineering ads based on visits.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSettings(false)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleSavePreferences}
                className="px-4 py-1.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow transition-all"
              >
                Save Preferences
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
