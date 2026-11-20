import React, { useEffect, useState } from 'react';
import {
  SearchCheck,
  Save,
  Send,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Info,
  Globe,
} from 'lucide-react';
import { cmsFetch, getStatusBadgeClass } from './cmsClient.ts';

export default function CmsSeoManagerPanel() {
  const [audits, setAudits] = useState<any[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>('home');
  const [seoForm, setSeoForm] = useState<any>({
    seoTitle: '',
    metaDescription: '',
    canonicalUrl: '',
    keywords: '',
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    robotsIndex: true,
    robotsFollow: true,
    schemaType: 'WebPage',
  });
  const [externalNote, setExternalNote] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  const loadAudit = async () => {
    setLoading(true);
    try {
      const res = await cmsFetch('/api/cms/seo/audit');
      const list = res.audits || [];
      setAudits(list);
      setExternalNote(res.externalRankingNote || '');
      const current = list.find((a: any) => a.slug === selectedSlug) || list[0];
      if (current) {
        setSelectedSlug(current.slug);
        syncFormFromAudit(current);
      }
    } catch (err: any) {
      setToast({ type: 'error', msg: err.message || 'Failed to load SEO audit' });
    } finally {
      setLoading(false);
    }
  };

  const syncFormFromAudit = (item: any) => {
    const s = item?.seo || {};
    setSeoForm({
      seoTitle: s.seoTitle || '',
      metaDescription: s.metaDescription || '',
      canonicalUrl: s.canonicalUrl || `https://madeccgroup.online/${item.slug === 'home' ? '' : item.slug}`,
      keywords: s.keywords || '',
      ogTitle: s.ogTitle || s.seoTitle || '',
      ogDescription: s.ogDescription || s.metaDescription || '',
      ogImage: s.ogImage || '',
      robotsIndex: s.robotsIndex !== false,
      robotsFollow: s.robotsFollow !== false,
      schemaType: s.schemaType || 'WebPage',
    });
  };

  useEffect(() => {
    loadAudit();
  }, []);

  const currentAudit = audits.find((a) => a.slug === selectedSlug);

  const handleSelectPage = (slug: string) => {
    setSelectedSlug(slug);
    const match = audits.find((a) => a.slug === slug);
    if (match) syncFormFromAudit(match);
  };

  const handleSaveSeo = async (publishNow: boolean) => {
    setSaving(true);
    setToast(null);
    try {
      const currentPage = await cmsFetch(`/api/cms/pages/${selectedSlug}?mode=draft`);
      const payload = {
        title: currentPage.title,
        heroConfig: currentPage.heroConfig,
        sections: currentPage.sections,
        seo: { ...(currentPage.seo || {}), ...seoForm },
      };

      if (publishNow) {
        await cmsFetch(`/api/cms/pages/${selectedSlug}/workflow`, {
          method: 'POST',
          body: JSON.stringify({
            action: 'publish',
            changeSummary: `SEO metadata updated and published for /${selectedSlug}`,
            payload,
          }),
        });
      } else {
        await cmsFetch(`/api/cms/pages/${selectedSlug}/draft`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        });
      }

      setToast({
        type: 'success',
        msg: publishNow ? `SEO metadata published live for /${selectedSlug}!` : `SEO draft saved for /${selectedSlug}.`,
      });
      await loadAudit();
    } catch (err: any) {
      setToast({ type: 'error', msg: err.message || 'Failed to save SEO settings' });
    } finally {
      setSaving(false);
    }
  };

  const sampleJsonLd = {
    '@context': 'https://schema.org',
    '@type': seoForm.schemaType || 'WebPage',
    name: seoForm.seoTitle || currentAudit?.title,
    description: seoForm.metaDescription,
    url: seoForm.canonicalUrl || `https://madeccgroup.online/${selectedSlug === 'home' ? '' : selectedSlug}`,
  };

  return (
    <div className="space-y-6 text-slate-200" id="cms-seo-manager-panel">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <SearchCheck className="w-5 h-5 text-amber-500" />
            SEO Manager & On-Page Metadata Audit
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure page titles, meta descriptions, canonical URLs, Open Graph tags, robots indexing directives, and Schema.org JSON-LD.
          </p>
        </div>
        <button
          onClick={loadAudit}
          disabled={loading}
          className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold flex items-center gap-1.5 self-start lg:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} /> Run Internal Audit
        </button>
      </div>

      {externalNote && (
        <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs text-amber-300/90 flex items-center gap-2 font-mono">
          <Info className="w-4 h-4 shrink-0" /> {externalNote}
        </div>
      )}

      {toast && (
        <div className={`p-3 rounded-xl text-xs font-bold ${toast.type === 'success' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'}`}>
          {toast.msg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Audit Score List */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800 max-h-[650px] overflow-y-auto">
          {audits.map((a) => (
            <button
              key={a.slug}
              onClick={() => handleSelectPage(a.slug)}
              className={`w-full text-left p-4 transition-colors ${a.slug === selectedSlug ? 'bg-amber-500/10 border-l-4 border-amber-500' : 'hover:bg-slate-800/40'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm text-white truncate">{a.title}</span>
                <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${a.score >= 75 ? 'bg-emerald-500/15 text-emerald-300' : 'bg-amber-500/15 text-amber-300'}`}>
                  {a.score}%
                </span>
              </div>
              <div className="text-[11px] font-mono text-slate-400 mt-1 flex items-center justify-between">
                <span>/{a.slug}</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] ${getStatusBadgeClass(a.status)}`}>{a.status}</span>
              </div>
            </button>
          ))}
        </div>

        {/* SEO Editor */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-amber-500" /> Editing SEO for /{selectedSlug}
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleSaveSeo(false)}
                disabled={saving}
                className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" /> Save SEO Draft
              </button>
              <button
                onClick={() => handleSaveSeo(true)}
                disabled={saving}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5"
              >
                <Send className="w-3.5 h-3.5" /> Publish SEO Live
              </button>
            </div>
          </div>

          {/* Live Checks */}
          {currentAudit?.checks && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
              {currentAudit.checks.map((ck: any) => (
                <div key={ck.key} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 flex items-start gap-2">
                  {ck.severity === 'ok' ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  ) : ck.severity === 'warn' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  ) : (
                    <XCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
                  )}
                  <div>
                    <div className="font-mono font-bold text-slate-200">{ck.key}</div>
                    <div className="text-[11px] text-slate-400">{ck.message}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                SEO Title ({seoForm.seoTitle.length}/65 chars recommended)
              </label>
              <input
                type="text"
                value={seoForm.seoTitle}
                onChange={(e) => setSeoForm({ ...seoForm, seoTitle: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Canonical URL</label>
              <input
                type="url"
                value={seoForm.canonicalUrl}
                onChange={(e) => setSeoForm({ ...seoForm, canonicalUrl: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="text-xs">
            <label className="block font-semibold text-slate-300 mb-1">
              Meta Description ({seoForm.metaDescription.length}/160 chars recommended)
            </label>
            <textarea
              rows={2}
              value={seoForm.metaDescription}
              onChange={(e) => setSeoForm({ ...seoForm, metaDescription: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Keywords (comma-separated)</label>
              <input
                type="text"
                value={seoForm.keywords}
                onChange={(e) => setSeoForm({ ...seoForm, keywords: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Schema.org Type</label>
              <select
                value={seoForm.schemaType}
                onChange={(e) => setSeoForm({ ...seoForm, schemaType: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
              >
                {['WebPage', 'Organization', 'GeneralContractor', 'Service', 'AboutPage', 'ContactPage', 'CollectionPage', 'FAQPage'].map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Open Graph Title</label>
              <input
                type="text"
                value={seoForm.ogTitle}
                onChange={(e) => setSeoForm({ ...seoForm, ogTitle: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Open Graph Image URL</label>
              <input
                type="url"
                value={seoForm.ogImage}
                onChange={(e) => setSeoForm({ ...seoForm, ogImage: e.target.value })}
                placeholder="https://madeccgroup.online/logo.webp"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white font-mono"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-6 text-xs pt-1">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={seoForm.robotsIndex}
                onChange={(e) => setSeoForm({ ...seoForm, robotsIndex: e.target.checked })}
              />
              <span>robots: index (Include in search results & XML sitemap)</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={seoForm.robotsFollow}
                onChange={(e) => setSeoForm({ ...seoForm, robotsFollow: e.target.checked })}
              />
              <span>robots: follow</span>
            </label>
          </div>

          <div>
            <div className="text-[11px] font-mono text-slate-400 mb-1">Generated Schema.org JSON-LD Preview</div>
            <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto">
              {JSON.stringify(sampleJsonLd, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
