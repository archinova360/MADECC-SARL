import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  RefreshCw, 
  Phone, 
  Mail, 
  MapPin, 
  Globe, 
  ShieldAlert, 
  CheckCircle2, 
  Share2,
  Navigation,
  Sliders,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { SiteSettings } from '../types.ts';
import { getCsrfHeaders } from '../lib/csrf.ts';

export default function CmsSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'contacts' | 'navigation' | 'footer' | 'emergency'>('general');

  const fetchSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/cms/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings(data.settings);
        }
      }
    } catch (err) {
      console.error('Failed to load site settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

    setSaving(true);
    setErrorMsg('');
    setSaveSuccess(false);

    try {
      const csrf = await getCsrfHeaders();
      const res = await fetch('/api/cms/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...csrf
        },
        body: JSON.stringify(settings)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update settings');
      }

      const resData = await res.json();
      if (resData.success) {
        setSettings(resData.settings);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Error updating settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading || !settings) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin mx-auto text-amber-500 mb-3" />
        <p className="text-xs font-mono uppercase tracking-widest">Loading Global Site Settings...</p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl text-slate-200" id="cms-site-settings">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-amber-500" /> Global Website Configuration & Branding
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage official business details, physical headquarters, emergency contact dispatchers, and global SEO.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-lg text-sm transition-all shadow-md shadow-amber-500/10 disabled:opacity-50"
          id="save-cms-settings-btn"
        >
          {saving ? (
            <><RefreshCw className="w-4 h-4 animate-spin" /> Saving Changes...</>
          ) : saveSuccess ? (
            <><CheckCircle2 className="w-4 h-4 text-emerald-950" /> Saved Successfully!</>
          ) : (
            <><Save className="w-4 h-4" /> Save Global Settings</>
          )}
        </button>
      </div>

      {errorMsg && (
        <div className="mt-4 p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-400" /> {errorMsg}
        </div>
      )}

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 pt-6 border-b border-slate-800">
        {[
          { id: 'general', label: 'Company Identity', icon: Globe },
          { id: 'contacts', label: 'Offices & Helplines', icon: Phone },
          { id: 'navigation', label: 'Header Navigation', icon: Navigation },
          { id: 'footer', label: 'Footer & Certifications', icon: Sliders },
          { id: 'emergency', label: 'Emergency Banner', icon: ShieldAlert }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeSubTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveSubTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-bold transition-colors border-b-2 ${
                isActive
                  ? 'border-amber-500 text-amber-400 bg-slate-950'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Form Content */}
      <form onSubmit={handleSave} className="py-6 space-y-6 text-sm">
        {/* 1. General Branding */}
        {activeSubTab === 'general' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Official Company Name</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={e => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Corporate Tagline / Slogan</label>
                <input
                  type="text"
                  value={settings.tagline || ''}
                  onChange={e => setSettings({ ...settings, tagline: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Global SEO Title Template</label>
                <input
                  type="text"
                  value={settings.globalSeo?.seoTitle || ''}
                  onChange={e => setSettings({
                    ...settings,
                    globalSeo: { ...settings.globalSeo, seoTitle: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Global Canonical Domain</label>
                <input
                  type="url"
                  value={settings.globalSeo?.canonicalUrl || ''}
                  onChange={e => setSettings({
                    ...settings,
                    globalSeo: { ...settings.globalSeo, canonicalUrl: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Default Meta Description</label>
              <textarea
                rows={3}
                value={settings.globalSeo?.metaDescription || ''}
                onChange={e => setSettings({
                  ...settings,
                  globalSeo: { ...settings.globalSeo, metaDescription: e.target.value }
                })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        )}

        {/* 2. Contacts & Locations */}
        {activeSubTab === 'contacts' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Main Office Telephone</label>
                <input
                  type="text"
                  value={settings.phone || ''}
                  onChange={e => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">24/7 Rapid Emergency Hotline</label>
                <input
                  type="text"
                  value={settings.emergencyPhone || ''}
                  onChange={e => setSettings({ ...settings, emergencyPhone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">WhatsApp Direct Line</label>
                <input
                  type="text"
                  value={settings.whatsappNumber || ''}
                  onChange={e => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Official Corporate Email</label>
                <input
                  type="email"
                  value={settings.email || ''}
                  onChange={e => setSettings({ ...settings, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Business & Operating Hours</label>
                <input
                  type="text"
                  value={settings.businessHours || ''}
                  onChange={e => setSettings({ ...settings, businessHours: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Yaoundé Headquarters Physical Address
                </label>
                <input
                  type="text"
                  value={settings.officeAddressYaounde || ''}
                  onChange={e => setSettings({ ...settings, officeAddressYaounde: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Douala Regional Branch Physical Address
                </label>
                <input
                  type="text"
                  value={settings.officeAddressDouala || ''}
                  onChange={e => setSettings({ ...settings, officeAddressDouala: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-800">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Social Media Direct Handles</h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">LinkedIn</label>
                  <input
                    type="url"
                    value={settings.linkedinUrl || ''}
                    onChange={e => setSettings({ ...settings, linkedinUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Facebook</label>
                  <input
                    type="url"
                    value={settings.facebookUrl || ''}
                    onChange={e => setSettings({ ...settings, facebookUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">YouTube</label>
                  <input
                    type="url"
                    value={settings.youtubeUrl || ''}
                    onChange={e => setSettings({ ...settings, youtubeUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Navigation Links */}
        {activeSubTab === 'navigation' && (
          <div className="space-y-4">
            <p className="text-xs text-slate-400">
              Manage header menu items, reorder, or toggle active tabs on the public website.
            </p>

            <div className="space-y-2">
              {Array.isArray(settings.navigationLinks) && settings.navigationLinks.map((link, idx) => (
                <div key={link.id || idx} className="flex items-center justify-between p-3 bg-slate-950 border border-slate-800 rounded-lg">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-mono text-amber-500">
                      {idx + 1}
                    </span>
                    <input
                      type="text"
                      value={link.label}
                      onChange={e => {
                        const newLinks = [...(settings.navigationLinks || [])];
                        newLinks[idx].label = e.target.value;
                        setSettings({ ...settings, navigationLinks: newLinks });
                      }}
                      className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-medium"
                    />
                    <span className="text-xs text-slate-500 font-mono">→ #{link.href}</span>
                  </div>

                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                    <input
                      type="checkbox"
                      checked={link.isEnabled !== false}
                      onChange={e => {
                        const newLinks = [...(settings.navigationLinks || [])];
                        newLinks[idx].isEnabled = e.target.checked;
                        setSettings({ ...settings, navigationLinks: newLinks });
                      }}
                      className="rounded border-slate-700 text-amber-500 focus:ring-amber-500/20"
                    />
                    Visible
                  </label>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 4. Footer & Accreditations */}
        {activeSubTab === 'footer' && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Footer Mission Statement</label>
              <textarea
                rows={3}
                value={settings.footerContent?.aboutText || ''}
                onChange={e => setSettings({
                  ...settings,
                  footerContent: { ...settings.footerContent, aboutText: e.target.value }
                })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Copyright Notice</label>
              <input
                type="text"
                value={settings.footerContent?.copyrightText || ''}
                onChange={e => setSettings({
                  ...settings,
                  footerContent: { ...settings.footerContent, copyrightText: e.target.value }
                })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>
        )}

        {/* 5. Emergency Banner */}
        {activeSubTab === 'emergency' && (
          <div className="space-y-4">
            <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={Boolean(settings.emergencyBanner?.enabled)}
                  onChange={e => setSettings({
                    ...settings,
                    emergencyBanner: {
                      ...settings.emergencyBanner,
                      enabled: e.target.checked
                    }
                  })}
                  className="w-4 h-4 rounded text-amber-500"
                />
                <span className="font-bold text-sm text-white">Enable Site-Wide Top Announcement / Emergency Banner</span>
              </label>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Banner Announcement Text</label>
                <input
                  type="text"
                  value={settings.emergencyBanner?.message || ''}
                  onChange={e => setSettings({
                    ...settings,
                    emergencyBanner: {
                      ...settings.emergencyBanner,
                      message: e.target.value
                    }
                  })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  placeholder="e.g. 24/7 Rapid Emergency Civil & Structural Response Team available in Yaoundé & Douala."
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Button / Link Text</label>
                  <input
                    type="text"
                    value={settings.emergencyBanner?.linkText || ''}
                    onChange={e => setSettings({
                      ...settings,
                      emergencyBanner: {
                        ...settings.emergencyBanner,
                        linkText: e.target.value
                      }
                    })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    placeholder="Call Emergency Desk"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Target Action / URL</label>
                  <input
                    type="text"
                    value={settings.emergencyBanner?.linkUrl || ''}
                    onChange={e => setSettings({
                      ...settings,
                      emergencyBanner: {
                        ...settings.emergencyBanner,
                        linkUrl: e.target.value
                      }
                    })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    placeholder="tel:+237690000000"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
