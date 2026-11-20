import React, { useEffect, useState } from 'react';
import {
  Network,
  RefreshCw,
  Save,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileCode2,
} from 'lucide-react';
import { cmsFetch } from './cmsClient.ts';
import { CmsSiteRouteConfig } from '../../types.ts';

export default function CmsSitemapArchitecturePanel() {
  const [routes, setRoutes] = useState<CmsSiteRouteConfig[]>([]);
  const [discoveryConfig, setDiscoveryConfig] = useState<any>({
    llmsSummary: '',
    customRobotsDirectives: '',
  });
  const [previews, setPreviews] = useState<{ sitemapXml: string; robotsTxt: string; llmsTxt: string }>({
    sitemapXml: '',
    robotsTxt: '',
    llmsTxt: '',
  });
  const [activePreviewTab, setActivePreviewTab] = useState<'sitemap' | 'robots' | 'llms'>('sitemap');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [uRes, dRes] = await Promise.all([
        cmsFetch('/api/cms/sitemap/urls'),
        cmsFetch('/api/cms/discovery'),
      ]);
      setRoutes(uRes.urls || []);
      setDiscoveryConfig(dRes.discoveryConfig || {});
      setPreviews(dRes.previews || { sitemapXml: '', robotsTxt: '', llmsTxt: '' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to load sitemap architecture' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  const updateRoute = async (route: CmsSiteRouteConfig, patch: Partial<CmsSiteRouteConfig>) => {
    try {
      const res = await cmsFetch(`/api/cms/sitemap/urls/${route.id}`, {
        method: 'PUT',
        body: JSON.stringify(patch),
      });
      setRoutes((prev) => prev.map((r) => (r.id === route.id ? { ...r, ...res.route } : r)));
      setMsg({ type: 'success', text: `Updated indexing directives for ${route.path}` });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to update route' });
    }
  };

  const handleSaveDiscovery = async () => {
    setBusy(true);
    try {
      await cmsFetch('/api/cms/discovery', {
        method: 'PUT',
        body: JSON.stringify(discoveryConfig),
      });
      await handleRegenerateSitemap();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to save discovery config' });
    } finally {
      setBusy(false);
    }
  };

  const handleRegenerateSitemap = async () => {
    setBusy(true);
    try {
      const res = await cmsFetch('/api/cms/sitemap/refresh', { method: 'POST' });
      setPreviews({
        sitemapXml: res.xmlPreview || '',
        robotsTxt: res.robotsPreview || '',
        llmsTxt: res.llmsPreview || '',
      });
      setMsg({ type: 'success', text: 'Dynamically regenerated sitemap.xml, robots.txt, and /llms.txt from Neon DB.' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Regeneration failed' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-200" id="cms-sitemap-architecture-panel">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <Network className="w-5 h-5 text-amber-500" />
            Sitemap, Robots & AI Discovery Architecture Manager
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Inspect route indexing rules, regenerate XML Sitemap / robots.txt / llms.txt, and enforce strict exclusion of /admin and /api routes.
          </p>
        </div>

        <button
          onClick={handleRegenerateSitemap}
          disabled={busy || loading}
          className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shrink-0"
        >
          <RefreshCw className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`} />
          Regenerate Sitemap, Robots & LLMs.txt
        </button>
      </div>

      <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-200 text-xs flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          Security Enforcement Active: Private routes (<code>/admin</code>, <code>/api/</code>, <code>/login</code>) are permanently excluded from <code>sitemap.xml</code> and disallowed in <code>robots.txt</code>.
        </span>
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${msg.type === 'success' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'}`}>
          <CheckCircle2 className="w-4 h-4" /> {msg.text}
        </div>
      )}

      {/* Routes Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[11px] border-b border-slate-800">
              <tr>
                <th className="p-3">Route Path</th>
                <th className="p-3">Page Title</th>
                <th className="p-3">Sitemap</th>
                <th className="p-3">Index</th>
                <th className="p-3">Follow</th>
                <th className="p-3">Priority</th>
                <th className="p-3">Freq</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {routes.map((r) => {
                const locked = r.isSystemRoute || r.path.startsWith('/admin') || r.path.startsWith('/api');
                return (
                  <tr key={r.id} className="hover:bg-slate-800/30">
                    <td className="p-3 font-mono font-bold text-amber-400">
                      {r.path} {locked && <span className="text-[10px] text-rose-400 ml-1">(LOCKED)</span>}
                    </td>
                    <td className="p-3 text-white">{r.title}</td>
                    <td className="p-3">
                      <input
                        type="checkbox"
                        disabled={locked}
                        checked={r.includeInSitemap}
                        onChange={(e) => updateRoute(r, { includeInSitemap: e.target.checked })}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="checkbox"
                        disabled={locked}
                        checked={r.robotsIndex}
                        onChange={(e) => updateRoute(r, { robotsIndex: e.target.checked })}
                      />
                    </td>
                    <td className="p-3">
                      <input
                        type="checkbox"
                        disabled={locked}
                        checked={r.robotsFollow}
                        onChange={(e) => updateRoute(r, { robotsFollow: e.target.checked })}
                      />
                    </td>
                    <td className="p-3">
                      <select
                        disabled={locked}
                        value={r.priority}
                        onChange={(e) => updateRoute(r, { priority: e.target.value })}
                        className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
                      >
                        {['1.0', '0.9', '0.8', '0.7', '0.6', '0.5', '0.3'].map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </td>
                    <td className="p-3">
                      <select
                        disabled={locked}
                        value={r.changefreq}
                        onChange={(e) => updateRoute(r, { changefreq: e.target.value })}
                        className="bg-slate-950 border border-slate-800 rounded px-2 py-1 text-white"
                      >
                        {['daily', 'weekly', 'monthly', 'yearly'].map((f) => (
                          <option key={f} value={f}>{f}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Discovery Directives & Generated File Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <FileCode2 className="w-4 h-4 text-amber-500" /> AI & Robots Discovery Configuration
          </h3>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">/llms.txt Executive Summary</label>
            <textarea
              rows={3}
              value={discoveryConfig.llmsSummary || ''}
              onChange={(e) => setDiscoveryConfig({ ...discoveryConfig, llmsSummary: e.target.value })}
              placeholder="Factual corporate description exposed to AI indexing engines..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
            />
          </div>
          <div>
            <label className="block font-semibold text-slate-300 mb-1">Additional Robots Directives</label>
            <textarea
              rows={3}
              value={discoveryConfig.customRobotsDirectives || ''}
              onChange={(e) => setDiscoveryConfig({ ...discoveryConfig, customRobotsDirectives: e.target.value })}
              placeholder="# Optional crawl-delay or custom directives"
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
            />
          </div>
          <button
            onClick={handleSaveDiscovery}
            disabled={busy}
            className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" /> Save Discovery Settings & Sync Files
          </button>
        </div>

        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex gap-2 text-xs font-bold">
              {[
                { id: 'sitemap', label: 'sitemap.xml' },
                { id: 'robots', label: 'robots.txt' },
                { id: 'llms', label: 'llms.txt' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActivePreviewTab(t.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-mono ${activePreviewTab === t.id ? 'bg-amber-500 text-slate-950' : 'bg-slate-950 text-slate-400 hover:text-white'}`}
                >
                  {t.label}
                </button>
              ))}
            </div>
            {routes.some((r) => r.robotsIndex === false && !r.isSystemRoute) && (
              <span className="text-[11px] text-amber-400 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Some public routes marked noindex
              </span>
            )}
          </div>

          <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 max-h-72 overflow-auto whitespace-pre-wrap">
            {activePreviewTab === 'sitemap'
              ? previews.sitemapXml
              : activePreviewTab === 'robots'
              ? previews.robotsTxt
              : previews.llmsTxt}
          </pre>
        </div>
      </div>
    </div>
  );
}
