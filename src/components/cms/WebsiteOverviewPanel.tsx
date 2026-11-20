import React, { useEffect, useState } from 'react';
import {
  Globe,
  FileText,
  Film,
  Scale,
  Wrench,
  Megaphone,
  SearchCheck,
  AlertTriangle,
  RefreshCw,
  ArrowRight,
  Clock,
  CheckCircle2,
  Mail,
  Activity,
  Info,
} from 'lucide-react';
import { cmsFetch, formatDateTimeInTz, getStatusBadgeClass } from './cmsClient.ts';
import { CmsPublicationHistoryEntry } from '../../types.ts';

interface WebsiteOverviewPanelProps {
  onNavigateCmsTab: (tabId: string) => void;
}

export default function WebsiteOverviewPanel({ onNavigateCmsTab }: WebsiteOverviewPanelProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);

  const loadOverview = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await cmsFetch('/api/cms/overview');
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load website overview');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  if (loading && !data) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-12 text-center text-slate-400">
        <RefreshCw className="w-7 h-7 animate-spin mx-auto text-amber-500 mb-3" />
        <p className="text-xs font-mono uppercase tracking-widest">Loading Verified Neon DB Website Metrics...</p>
      </div>
    );
  }

  const m = data?.metrics || {};
  const ext = data?.externalAnalytics || {};
  const tz = data?.timezone || 'Africa/Douala';
  const history: CmsPublicationHistoryEntry[] = data?.recentPublicationHistory || [];

  const cards = [
    { label: 'Published Pages', value: m.pagesPublished ?? 0, sub: `${m.pagesTotal ?? 0} total`, tab: 'cms-publishing', icon: Globe, tone: 'text-emerald-400' },
    { label: 'Drafts & Review', value: m.pagesDraft ?? 0, sub: `${m.pagesScheduled ?? 0} scheduled`, tab: 'cms-publishing', icon: Clock, tone: 'text-amber-400' },
    { label: 'Media Assets', value: m.mediaTotal ?? 0, sub: `${m.videosTotal ?? 0} video(s)`, tab: 'cms-media', icon: Film, tone: 'text-sky-400' },
    { label: 'Legal Documents', value: `${m.legalPublished ?? 0}/${m.legalTotal ?? 0}`, sub: 'Published vs Total', tab: 'cms-legal', icon: Scale, tone: 'text-indigo-400' },
    { label: 'Sitemap URLs', value: m.sitemapIncludedUrls ?? 0, sub: 'Indexable routes', tab: 'cms-sitemap', icon: FileText, tone: 'text-cyan-400' },
    { label: 'Pending Reviews', value: m.pendingHumanReviewCount ?? 0, sub: 'Human content checks', tab: 'cms-human-review', icon: CheckCircle2, tone: 'text-amber-400' },
    { label: 'SEO Metadata Gaps', value: m.missingSeoMetadataCount ?? 0, sub: 'Missing title or desc', tab: 'cms-seo', icon: SearchCheck, tone: 'text-rose-400' },
    { label: 'Active Notices', value: (m.activeAnnouncementsCount ?? 0) + (m.activeMaintenanceCount ?? 0), sub: `${m.scheduledMaintenanceCount ?? 0} scheduled maint.`, tab: 'cms-announcements', icon: Megaphone, tone: 'text-emerald-400' },
  ];

  return (
    <div className="space-y-6 text-slate-200" id="cms-overview-panel">
      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-mono uppercase tracking-widest text-amber-400 font-bold">
            Website Management Command Centre
          </span>
          <h2 className="text-xl font-black text-white mt-0.5 flex items-center gap-2">
            <Globe className="w-5 h-5 text-amber-500" />
            Website Overview & Live Publishing Health
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            All numbers below are live counts queried directly from Neon PostgreSQL. Platform timezone: <strong className="text-slate-200 font-mono">{tz}</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={loadOverview}
            disabled={loading}
            className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            Refresh Metrics
          </button>
          <button
            onClick={() => onNavigateCmsTab('cms-editor')}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-black flex items-center gap-1.5"
          >
            Open Content Editor <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {cards.map((c) => {
          const Icon = c.icon;
          return (
            <button
              key={c.label}
              onClick={() => onNavigateCmsTab(c.tab)}
              className="text-left p-4 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/50 transition-all group"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-mono uppercase text-slate-400">{c.label}</span>
                <Icon className={`w-4 h-4 ${c.tone}`} />
              </div>
              <div className="text-2xl font-black text-white">{c.value}</div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>{c.sub}</span>
                <ArrowRight className="w-3 h-3 opacity-0 group-hover:opacity-100 text-amber-400 transition-opacity" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Truthful External Data Source Notice + SMTP Desk Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Info className="w-4 h-4 text-slate-400" /> Google Search Console
          </div>
          <p className="text-xs text-amber-300/90 font-mono">
            {ext.googleSearchConsole?.message || 'Not available — no verified data source configured.'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Info className="w-4 h-4 text-slate-400" /> Google Analytics (GA4)
          </div>
          <p className="text-xs text-amber-300/90 font-mono">
            {ext.googleAnalytics4?.message || 'Not available — no verified data source configured.'}
          </p>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200">
            <Mail className="w-4 h-4 text-emerald-400" /> SMTP Communications Desk
          </div>
          <p className="text-xs text-slate-300 font-mono">
            Sender: <span className="text-amber-400">{ext.smtpMailer?.senderAddress || 'kreboya603@gmail.com'}</span>
          </p>
          <p className="text-[11px] text-slate-400">
            {ext.smtpMailer?.configured ? 'Configured in backend environment' : 'Requires SMTP credentials for outbound delivery'}
          </p>
        </div>
      </div>

      {/* Quick Action Bar + Recent Publication History */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <h3 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Wrench className="w-4 h-4" /> Quick Publishing Actions
          </h3>
          <div className="space-y-2 text-xs">
            {[
              { label: 'Page Management & Workflow', tab: 'cms-publishing' },
              { label: 'Visual Rich-Text & Section Editor', tab: 'cms-editor' },
              { label: 'Media & Video Asset Library', tab: 'cms-media' },
              { label: 'Run Human Content & Fact Review', tab: 'cms-human-review' },
              { label: 'Audit SEO & Regenerate Sitemap', tab: 'cms-seo' },
              { label: 'Edit 10 Legal Compliance Pages', tab: 'cms-legal' },
              { label: 'Developer & Paid API Portal Copy', tab: 'cms-developer-api' },
              { label: 'Schedule Maintenance / Banners', tab: 'cms-maintenance' },
            ].map((item) => (
              <button
                key={item.tab}
                onClick={() => onNavigateCmsTab(item.tab)}
                className="w-full px-3 py-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-slate-200 font-semibold flex items-center justify-between transition-colors"
              >
                <span>{item.label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-amber-400" />
              </button>
            ))}
          </div>
        </div>

        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-500" /> Recent Publication & Schedule Activity
            </h3>
            <button
              onClick={() => onNavigateCmsTab('cms-logs')}
              className="text-xs text-amber-400 hover:underline font-semibold"
            >
              View All Logs
            </button>
          </div>

          {history.length === 0 ? (
            <div className="py-10 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-lg">
              No publication events recorded yet. Actions in Publishing Centre appear here immediately.
            </div>
          ) : (
            <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto">
              {history.map((h) => (
                <div key={h.id} className="py-2.5 flex items-start justify-between gap-3 text-xs">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${getStatusBadgeClass(h.success ? h.toStatus || h.action : 'FAIL')}`}>
                        {h.action}
                      </span>
                      <span className="font-bold text-white">{h.targetTitle || h.targetSlug}</span>
                      <span className="text-[11px] font-mono text-slate-500">[{h.targetType}]</span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      {h.errorMessage || h.details || `Status: ${h.fromStatus || '—'} → ${h.toStatus || '—'}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0 text-[10px] font-mono text-slate-500">
                    <div>{h.performedBy || 'Admin'}</div>
                    <div>{formatDateTimeInTz(h.createdAt, tz)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
