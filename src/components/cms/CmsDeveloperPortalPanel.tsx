import React, { useEffect, useState } from 'react';
import {
  Code,
  Save,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  ExternalLink,
  Key,
} from 'lucide-react';
import { cmsFetch } from './cmsClient.ts';

interface CmsDeveloperPortalPanelProps {
  onOpenApiPlatformConsole?: () => void;
}

export default function CmsDeveloperPortalPanel({ onOpenApiPlatformConsole }: CmsDeveloperPortalPanelProps) {
  const [form, setForm] = useState<any>({
    heroTitle: '',
    heroSubtitle: '',
    documentationOverview: '',
    accessInstructions: '',
    apiTermsSummary: '',
    categories: [],
    features: [],
    sampleCurlSnippet: '',
    sampleJsSnippet: '',
    supportEmail: 'kreboya603@gmail.com',
    supportPhone: '+237 683 31 64 86',
    announcementNotice: '',
    faqs: [],
    guides: [],
  });
  const [liveSummary, setLiveSummary] = useState<any>(null);
  const [categoriesText, setCategoriesText] = useState('');
  const [featuresText, setFeaturesText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await cmsFetch('/api/cms/developer-portal');
      const pc = res.portalContent || {};
      setForm(pc);
      setLiveSummary(res.liveCatalogSummary || null);
      setCategoriesText(Array.isArray(pc.categories) ? pc.categories.join('\n') : '');
      setFeaturesText(Array.isArray(pc.features) ? pc.features.join('\n') : '');
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to load Developer Portal CMS' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    try {
      const payload = {
        ...form,
        categories: categoriesText.split('\n').map((s) => s.trim()).filter(Boolean),
        features: featuresText.split('\n').map((s) => s.trim()).filter(Boolean),
      };
      const res = await cmsFetch('/api/cms/developer-portal', {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      setForm(res.portalContent);
      setMsg({ type: 'success', text: 'Developer & Paid API Portal public content saved to Neon DB (secret-redacted).' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Save failed' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-200" id="cms-developer-portal-panel">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <Code className="w-5 h-5 text-amber-500" />
            Developer & Paid API Platform Public Portal Manager
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage public developer portal copy, documentation overview, API access onboarding guides, FAQs, and sanitized sample code snippets.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onOpenApiPlatformConsole && (
            <button
              onClick={onOpenApiPlatformConsole}
              className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-amber-400 text-xs font-bold flex items-center gap-1.5"
            >
              <Key className="w-3.5 h-3.5" /> Manage API Keys & Plans <ExternalLink className="w-3 h-3" />
            </button>
          )}
          <button
            onClick={loadData}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-200 text-xs flex items-start gap-2.5">
        <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
        <span>
          <strong>Secret Protection Policy:</strong> Never enter real production API keys, private tokens, or database secrets in documentation examples. Backend sanitization automatically redacts token-like strings (`madecc_live_...`, `sk_...`, `pk_...`).
        </span>
      </div>

      {/* Live API Catalog Telemetry */}
      {liveSummary && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="text-slate-400 font-mono">API Products</div>
            <div className="text-xl font-black text-white mt-1">{liveSummary.activeProductsCount} / {liveSummary.productsCount} Active</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="text-slate-400 font-mono">Subscription Plans</div>
            <div className="text-xl font-black text-white mt-1">{liveSummary.activePlansCount} / {liveSummary.plansCount} Active</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="text-slate-400 font-mono">Pending Verifications</div>
            <div className="text-xl font-black text-amber-400 mt-1">{liveSummary.pendingPaymentsCount}</div>
          </div>
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
            <div className="text-slate-400 font-mono">Checkout Mode</div>
            <div className="text-xs font-bold text-emerald-300 mt-1">{liveSummary.paymentGatewayMode}</div>
          </div>
        </div>
      )}

      {msg && (
        <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'}`}>
          <CheckCircle2 className="w-4 h-4" /> {msg.text}
        </div>
      )}

      <form onSubmit={handleSave} className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5 text-xs">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Portal Hero Headline</label>
            <input
              type="text"
              value={form.heroTitle || ''}
              onChange={(e) => setForm({ ...form, heroTitle: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Portal Notice Banner (Optional)</label>
            <input
              type="text"
              value={form.announcementNotice || ''}
              onChange={(e) => setForm({ ...form, announcementNotice: e.target.value })}
              placeholder="e.g., Sandbox environment uses manual key approval via MoMo verification."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-300 mb-1">Hero Subtitle / Overview</label>
          <textarea
            rows={2}
            value={form.heroSubtitle || ''}
            onChange={(e) => setForm({ ...form, heroSubtitle: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
          />
        </div>

        <div>
          <label className="block font-semibold text-slate-300 mb-1">Documentation Overview</label>
          <textarea
            rows={3}
            value={form.documentationOverview || ''}
            onChange={(e) => setForm({ ...form, documentationOverview: e.target.value })}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">API Access Instructions</label>
            <textarea
              rows={3}
              value={form.accessInstructions || ''}
              onChange={(e) => setForm({ ...form, accessInstructions: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">API Usage & Rate-Limit Terms Summary</label>
            <textarea
              rows={3}
              value={form.apiTermsSummary || ''}
              onChange={(e) => setForm({ ...form, apiTermsSummary: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">API Categories (one per line)</label>
            <textarea
              rows={4}
              value={categoriesText}
              onChange={(e) => setCategoriesText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Key Developer Features (one per line)</label>
            <textarea
              rows={4}
              value={featuresText}
              onChange={(e) => setFeaturesText(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Sanitized Sample cURL Snippet (No Real Keys)</label>
            <textarea
              rows={5}
              value={form.sampleCurlSnippet || ''}
              onChange={(e) => setForm({ ...form, sampleCurlSnippet: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-emerald-300 font-mono"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Sanitized Sample JavaScript Snippet (No Real Keys)</label>
            <textarea
              rows={5}
              value={form.sampleJsSnippet || ''}
              onChange={(e) => setForm({ ...form, sampleJsSnippet: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-amber-300 font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Developer Support Email</label>
            <input
              type="email"
              value={form.supportEmail || ''}
              onChange={(e) => setForm({ ...form, supportEmail: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Developer Support Hotline</label>
            <input
              type="text"
              value={form.supportPhone || ''}
              onChange={(e) => setForm({ ...form, supportPhone: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
            />
          </div>
        </div>

        <div className="flex justify-end pt-3 border-t border-slate-800">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black flex items-center gap-2"
          >
            <Save className="w-4 h-4" /> {saving ? 'Saving...' : 'Save & Update Public Developer Portal'}
          </button>
        </div>
      </form>
    </div>
  );
}
