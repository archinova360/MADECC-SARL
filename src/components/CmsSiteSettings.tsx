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
  AlertCircle,
  CreditCard,
  Palette
} from 'lucide-react';
import { SiteSettings } from '../types.ts';
import { getCsrfHeaders } from '../lib/csrf.ts';

export default function CmsSiteSettings() {
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'general' | 'contacts' | 'payments' | 'appearance' | 'social_share' | 'navigation' | 'footer' | 'emergency'>('general');

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
          { id: 'general', label: 'Company Identity & Registration', icon: Globe },
          { id: 'contacts', label: 'Offices & Helplines', icon: Phone },
          { id: 'payments', label: 'Payment Channels & MoMo', icon: CreditCard },
          { id: 'appearance', label: 'Brand Theme & Styling', icon: Palette },
          { id: 'social_share', label: 'Social & Share Links', icon: Share2 },
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
        {/* 1. General Branding & Legal Registration */}
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

            {/* Legal Entity & Official Registration Data */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-amber-500" />
                Official Corporate Registration & Trust Signals (Editable in Admin)
              </h4>
              <p className="text-[11px] text-slate-400 leading-normal">
                These official accreditation records are published across project invoices, contract verification certificates, and the footer to establish enterprise trust and compliance.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">Legal Status / Entity</label>
                  <input
                    type="text"
                    value={settings.legalStatus || 'SARL (Société à Responsabilité Limitée)'}
                    onChange={e => setSettings({ ...settings, legalStatus: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-750 rounded px-2.5 py-1.5 text-xs text-white focus:border-amber-500"
                    placeholder="e.g. SARL"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">RCCM Registration No.</label>
                  <input
                    type="text"
                    value={settings.rccmNumber || ''}
                    onChange={e => setSettings({ ...settings, rccmNumber: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-750 rounded px-2.5 py-1.5 text-xs text-white focus:border-amber-500"
                    placeholder="e.g. RC/YAO/202X/B/XXX"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 mb-1">NIU / Taxpayer ID Number</label>
                  <input
                    type="text"
                    value={settings.niuTaxId || ''}
                    onChange={e => setSettings({ ...settings, niuTaxId: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-750 rounded px-2.5 py-1.5 text-xs text-white focus:border-amber-500"
                    placeholder="e.g. M0XXXXXXXXXXXX"
                  />
                </div>
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
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Phone className="w-4 h-4 text-amber-500" />
                Executive Leadership & Corporate Contacts
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Lead Structural Engineer / Developer</label>
                  <input
                    type="text"
                    value={settings.developerName || ''}
                    onChange={e => setSettings({ ...settings, developerName: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    placeholder="e.g. Kasah Rodrick Reboya"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Business & Operating Hours</label>
                  <input
                    type="text"
                    value={settings.businessHours || ''}
                    onChange={e => setSettings({ ...settings, businessHours: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    placeholder="Mon - Sat: 08:00 - 18:00 (GMT+1)"
                  />
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-3">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                Telephone & Hotline Channels
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Primary Office Telephone</label>
                  <input
                    type="text"
                    value={settings.phone || ''}
                    onChange={e => setSettings({ ...settings, phone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    placeholder="+237 671 063 511"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Secondary Telephone Line</label>
                  <input
                    type="text"
                    value={settings.phoneSecondary || ''}
                    onChange={e => setSettings({ ...settings, phoneSecondary: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    placeholder="+237 683 316 486"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Tertiary Telephone Line</label>
                  <input
                    type="text"
                    value={settings.phoneTertiary || ''}
                    onChange={e => setSettings({ ...settings, phoneTertiary: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    placeholder="+237 640 194 505"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">24/7 Rapid Emergency Hotline</label>
                  <input
                    type="text"
                    value={settings.emergencyPhone || ''}
                    onChange={e => setSettings({ ...settings, emergencyPhone: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    placeholder="+237 671 063 511"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Primary WhatsApp Line</label>
                  <input
                    type="text"
                    value={settings.whatsappNumber || ''}
                    onChange={e => setSettings({ ...settings, whatsappNumber: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    placeholder="+237 683 316 486"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Secondary WhatsApp Line</label>
                  <input
                    type="text"
                    value={settings.whatsappSecondary || ''}
                    onChange={e => setSettings({ ...settings, whatsappSecondary: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    placeholder="+237 671 063 511"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Primary Corporate Email</label>
                <input
                  type="email"
                  value={settings.email || ''}
                  onChange={e => setSettings({ ...settings, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="madecccons@gmail.com"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Secondary Commercial Email</label>
                <input
                  type="email"
                  value={settings.secondaryEmail || ''}
                  onChange={e => setSettings({ ...settings, secondaryEmail: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="Infomadeccconstruction@gmail.com"
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
                  placeholder="BP 14520, Yaoundé, Centre Region, Cameroon"
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
                  placeholder="Akwa Boulevard de la Liberté, Douala, Littoral Region, Cameroon"
                />
              </div>
            </div>
          </div>
        )}

        {/* 2b. Payment Channels & MoMo Numbers */}
        {activeSubTab === 'payments' && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-4">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-amber-500" />
                Mobile Money & Direct Financial Payment Channels
              </h4>
              <p className="text-[11px] text-slate-400">
                Configure the official MTN Mobile Money and Orange Money numbers published to clients for consultation fees, project retainers, and API platform subscriptions.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-amber-400 mb-1.5">MTN Mobile Money Numbers (Comma Separated)</label>
                  <input
                    type="text"
                    value={settings.paymentMtnNumbers || ''}
                    onChange={e => setSettings({ ...settings, paymentMtnNumbers: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    placeholder="671063511, 683316486, 671289643"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Displayed in checkout drawers and invoice payment slips.</p>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-orange-400 mb-1.5">Orange Money Numbers (Comma Separated)</label>
                  <input
                    type="text"
                    value={settings.paymentOrangeNumbers || ''}
                    onChange={e => setSettings({ ...settings, paymentOrangeNumbers: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    placeholder="689115595, 640194505"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">Clients can transfer directly to these registered commercial lines.</p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Payment Instructions & Wire Guidelines</label>
                <textarea
                  rows={4}
                  value={settings.paymentInstructions || ''}
                  onChange={e => setSettings({ ...settings, paymentInstructions: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  placeholder="1. Initiate transfer to any listed MTN MoMo or Orange Money line.&#10;2. Input your Transaction Reference ID at checkout or WhatsApp +237 683 316 486 with your receipt screenshot.&#10;3. Automated confirmation and service unlocking will occur upon verification."
                />
              </div>
            </div>
          </div>
        )}

        {/* 2c. Brand Appearance & Theme Customizer */}
        {activeSubTab === 'appearance' && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-4">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                <Palette className="w-4 h-4 text-amber-500" />
                Live Brand Theme & Visual Customizer
              </h4>
              <p className="text-[11px] text-slate-400">
                Adjust the primary brand color accents, typography families, and interface styling without touching CSS code.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Primary Brand Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.themeSettings?.primaryColor || '#f59e0b'}
                      onChange={e => setSettings({
                        ...settings,
                        themeSettings: { ...settings.themeSettings, primaryColor: e.target.value }
                      })}
                      className="w-9 h-9 rounded bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.themeSettings?.primaryColor || '#f59e0b'}
                      onChange={e => setSettings({
                        ...settings,
                        themeSettings: { ...settings.themeSettings, primaryColor: e.target.value }
                      })}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Secondary Accent Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={settings.themeSettings?.accentColor || '#d97706'}
                      onChange={e => setSettings({
                        ...settings,
                        themeSettings: { ...settings.themeSettings, accentColor: e.target.value }
                      })}
                      className="w-9 h-9 rounded bg-transparent border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={settings.themeSettings?.accentColor || '#d97706'}
                      onChange={e => setSettings({
                        ...settings,
                        themeSettings: { ...settings.themeSettings, accentColor: e.target.value }
                      })}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">Corner Border Radius</label>
                  <select
                    value={settings.themeSettings?.borderRadius || '0.75rem'}
                    onChange={e => setSettings({
                      ...settings,
                      themeSettings: { ...settings.themeSettings, borderRadius: e.target.value }
                    })}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:border-amber-500"
                  >
                    <option value="0.25rem">Subtle (4px)</option>
                    <option value="0.5rem">Medium (8px)</option>
                    <option value="0.75rem">Modern Rounded (12px)</option>
                    <option value="1rem">High Curve (16px)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. Social Media Handles & Visitor Sharing Controls */}
        {activeSubTab === 'social_share' && (
          <div className="space-y-6">
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-4">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                  <Globe className="w-4 h-4 text-amber-500" />
                  Official Social Media Channels (Recommended for Construction Companies)
                </h4>
                <p className="text-xs text-slate-400">
                  Configure active profiles for project broadcasts, client engagement, and company branding.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-300 font-semibold mb-1">LinkedIn (Corporate / B2B)</label>
                  <input
                    type="url"
                    value={settings.linkedinUrl || ''}
                    onChange={e => setSettings({ ...settings, linkedinUrl: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-750 rounded px-2.5 py-1.5 text-xs text-white focus:border-amber-500"
                    placeholder="https://linkedin.com/company/madeccgroup"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 font-semibold mb-1">Facebook (Community / Updates)</label>
                  <input
                    type="url"
                    value={settings.facebookUrl || ''}
                    onChange={e => setSettings({ ...settings, facebookUrl: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-750 rounded px-2.5 py-1.5 text-xs text-white focus:border-amber-500"
                    placeholder="https://facebook.com/madeccgroup"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 font-semibold mb-1">YouTube (Project Site Videos)</label>
                  <input
                    type="url"
                    value={settings.youtubeUrl || ''}
                    onChange={e => setSettings({ ...settings, youtubeUrl: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-750 rounded px-2.5 py-1.5 text-xs text-white focus:border-amber-500"
                    placeholder="https://youtube.com/@madeccgroup"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 font-semibold mb-1">X / Twitter (Press & Tenders)</label>
                  <input
                    type="url"
                    value={settings.twitterUrl || ''}
                    onChange={e => setSettings({ ...settings, twitterUrl: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-750 rounded px-2.5 py-1.5 text-xs text-white focus:border-amber-500"
                    placeholder="https://x.com/madeccgroup"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 font-semibold mb-1">Instagram (Architectural Visuals)</label>
                  <input
                    type="url"
                    value={settings.instagramUrl || ''}
                    onChange={e => setSettings({ ...settings, instagramUrl: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-750 rounded px-2.5 py-1.5 text-xs text-white focus:border-amber-500"
                    placeholder="https://instagram.com/madeccgroup"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 font-semibold mb-1">TikTok (Short Site Videos)</label>
                  <input
                    type="url"
                    value={settings.tiktokUrl || ''}
                    onChange={e => setSettings({ ...settings, tiktokUrl: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-750 rounded px-2.5 py-1.5 text-xs text-white focus:border-amber-500"
                    placeholder="https://tiktok.com/@madeccgroup"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 font-semibold mb-1">Pinterest (Design Portfolio)</label>
                  <input
                    type="url"
                    value={settings.pinterestUrl || ''}
                    onChange={e => setSettings({ ...settings, pinterestUrl: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-750 rounded px-2.5 py-1.5 text-xs text-white focus:border-amber-500"
                    placeholder="https://pinterest.com/madeccgroup"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 font-semibold mb-1">WhatsApp Business Desk</label>
                  <input
                    type="text"
                    value={settings.whatsappNumber || ''}
                    onChange={e => setSettings({ ...settings, whatsappNumber: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-750 rounded px-2.5 py-1.5 text-xs text-white focus:border-amber-500"
                    placeholder="+237671063511"
                  />
                </div>
              </div>
            </div>

            {/* Visitor Website Sharing Settings */}
            <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-xl space-y-4">
              <div>
                <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-1 flex items-center gap-2">
                  <Share2 className="w-4 h-4 text-amber-500" />
                  Website Sharing Links for Visitors & Clients (Editable in Admin)
                </h4>
                <p className="text-xs text-slate-400">
                  Customize the pre-filled message and title when clients or visitors share MADECC Group to their colleagues and partners.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-slate-300 font-semibold mb-1">Default Share Headline</label>
                  <input
                    type="text"
                    value={settings.shareHeadline || 'MADECC Group — Leading Civil Engineering & Construction Firm'}
                    onChange={e => setSettings({ ...settings, shareHeadline: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-750 rounded px-2.5 py-1.5 text-xs text-white focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-300 font-semibold mb-1">Default Share Message / Brief</label>
                  <input
                    type="text"
                    value={settings.shareDescription || 'Check out MADECC Group for certified civil engineering, structural design, cost calculators, and turnkey construction.'}
                    onChange={e => setSettings({ ...settings, shareDescription: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-750 rounded px-2.5 py-1.5 text-xs text-white focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-850">
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wide block mb-2">
                  Active Direct Share Dispatch Channels Enabled:
                </span>
                <div className="flex flex-wrap gap-2 text-xs font-mono">
                  <span className="bg-emerald-950/60 border border-emerald-800/60 text-emerald-300 px-2.5 py-1 rounded-md">WhatsApp Direct</span>
                  <span className="bg-blue-950/60 border border-blue-800/60 text-blue-300 px-2.5 py-1 rounded-md">LinkedIn Feed</span>
                  <span className="bg-sky-950/60 border border-sky-800/60 text-sky-300 px-2.5 py-1 rounded-md">Facebook Share</span>
                  <span className="bg-slate-900 border border-slate-750 text-slate-300 px-2.5 py-1 rounded-md">X / Twitter</span>
                  <span className="bg-amber-950/60 border border-amber-800/60 text-amber-300 px-2.5 py-1 rounded-md">Email Referral</span>
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
