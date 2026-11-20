import React, { useEffect, useState } from 'react';
import {
  Send,
  Clock,
  CheckCircle2,
  Archive,
  RotateCcw,
  Plus,
  RefreshCw,
  FileText,
  History,
  GitCompare,
  AlertCircle,
  EyeOff,
  Edit3,
  ShieldCheck,
} from 'lucide-react';
import { cmsFetch, formatDateTimeInTz, getStatusBadgeClass, PAGE_GROUP_OPTIONS } from './cmsClient.ts';
import { CmsPublicationHistoryEntry } from '../../types.ts';

interface CmsPublishingRevisionsPanelProps {
  initialMode?: 'publishing' | 'revisions';
  onOpenEditor?: (slug: string) => void;
  onOpenReview?: (slug: string) => void;
}

export default function CmsPublishingRevisionsPanel({
  initialMode = 'publishing',
  onOpenEditor,
  onOpenReview,
}: CmsPublishingRevisionsPanelProps) {
  const [pages, setPages] = useState<any[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>('home');
  const [groupFilter, setGroupFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [loading, setLoading] = useState(true);
  const [busyAction, setBusyAction] = useState<string | null>(null);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);

  // Create Page modal
  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newGroup, setNewGroup] = useState('custom');

  // Schedule & Notes controls
  const [scheduleDatetime, setScheduleDatetime] = useState('');
  const [changeSummary, setChangeSummary] = useState('');

  // Revisions & Diff
  const [viewMode, setViewMode] = useState<'publishing' | 'revisions'>(initialMode);
  const [revisions, setRevisions] = useState<any[]>([]);
  const [history, setHistory] = useState<CmsPublicationHistoryEntry[]>([]);
  const [diffLeftId, setDiffLeftId] = useState<number | null>(null);
  const [diffRightId, setDiffRightId] = useState<number | null>(null);

  const notify = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [pagesRes, histRes] = await Promise.all([
        cmsFetch('/api/cms/pages/manage'),
        cmsFetch('/api/cms/publication-history?limit=60'),
      ]);
      const list = pagesRes.pages || [];
      setPages(list);
      setHistory(histRes.history || []);
      if (list.length > 0 && !list.some((p: any) => p.slug === selectedSlug)) {
        setSelectedSlug(list[0].slug);
      }
    } catch (err: any) {
      notify('error', err.message || 'Failed to load pages');
    } finally {
      setLoading(false);
    }
  };

  const loadRevisions = async (slug: string) => {
    try {
      const res = await cmsFetch(`/api/cms/pages/${slug}/revisions`);
      const list = res.revisions || [];
      setRevisions(list);
      if (list.length >= 2) {
        setDiffLeftId(list[1].id);
        setDiffRightId(list[0].id);
      } else if (list.length === 1) {
        setDiffLeftId(list[0].id);
        setDiffRightId(list[0].id);
      } else {
        setDiffLeftId(null);
        setDiffRightId(null);
      }
    } catch {
      setRevisions([]);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (selectedSlug) loadRevisions(selectedSlug);
  }, [selectedSlug]);

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusyAction('create');
    try {
      const res = await cmsFetch('/api/cms/pages', {
        method: 'POST',
        body: JSON.stringify({
          title: newTitle,
          slug: newSlug || newTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
          pageGroup: newGroup,
        }),
      });
      notify('success', `Created draft page /${res.page.slug}`);
      setShowCreate(false);
      setNewTitle('');
      setNewSlug('');
      await loadData();
      setSelectedSlug(res.page.slug);
    } catch (err: any) {
      notify('error', err.message || 'Could not create page');
    } finally {
      setBusyAction(null);
    }
  };

  const runWorkflow = async (
    slug: string,
    action: 'submit-review' | 'approve' | 'publish' | 'republish' | 'schedule' | 'unpublish' | 'archive' | 'restore'
  ) => {
    if (action === 'schedule' && !scheduleDatetime) {
      notify('error', 'Select a future schedule date & time first.');
      return;
    }
    setBusyAction(`${slug}:${action}`);
    try {
      await cmsFetch(`/api/cms/pages/${slug}/workflow`, {
        method: 'POST',
        body: JSON.stringify({
          action,
          scheduledPublishAt: action === 'schedule' ? new Date(scheduleDatetime).toISOString() : undefined,
          changeSummary: changeSummary.trim() || undefined,
        }),
      });
      notify('success', `Action "${action}" executed for /${slug}.`);
      setChangeSummary('');
      await Promise.all([loadData(), loadRevisions(slug)]);
    } catch (err: any) {
      notify('error', err.message || `Failed to run ${action}`);
    } finally {
      setBusyAction(null);
    }
  };

  const restoreRevision = async (revId: number) => {
    setBusyAction(`restore:${revId}`);
    try {
      await cmsFetch(`/api/cms/pages/${selectedSlug}/restore/${revId}`, { method: 'POST' });
      notify('success', `Snapshot #${revId} restored into draft for /${selectedSlug}.`);
      await Promise.all([loadData(), loadRevisions(selectedSlug)]);
    } catch (err: any) {
      notify('error', err.message || 'Restore failed');
    } finally {
      setBusyAction(null);
    }
  };

  const filteredPages = pages.filter((p) => {
    const grp = (p.pageGroup || 'custom').toLowerCase();
    if (groupFilter !== 'all' && grp !== groupFilter) return false;
    if (statusFilter !== 'ALL' && (p.status || '').toUpperCase() !== statusFilter) return false;
    return true;
  });

  const selectedPage = pages.find((p) => p.slug === selectedSlug) || filteredPages[0];
  const leftRev = revisions.find((r) => r.id === diffLeftId);
  const rightRev = revisions.find((r) => r.id === diffRightId);

  return (
    <div className="space-y-6 text-slate-200" id="cms-publishing-panel">
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 px-4 py-3 rounded-xl text-xs font-bold shadow-2xl flex items-center gap-2 ${
            toast.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Header */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <Send className="w-5 h-5 text-amber-500" />
            Page Management, Publishing Centre & Revisions
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage all public pages, editorial approvals, scheduled publishing, unpublish/archive states, and full version diffs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('publishing')}
              className={`px-3 py-1.5 rounded font-bold ${viewMode === 'publishing' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              Pages & Publishing
            </button>
            <button
              onClick={() => setViewMode('revisions')}
              className={`px-3 py-1.5 rounded font-bold ${viewMode === 'revisions' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
            >
              Revision Diff & Logs
            </button>
          </div>

          <button
            onClick={() => setShowCreate(true)}
            className="px-3.5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> New Page
          </button>

          <button
            onClick={loadData}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300"
            title="Reload"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={groupFilter}
          onChange={(e) => setGroupFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
        >
          {PAGE_GROUP_OPTIONS.map((g) => (
            <option key={g.id} value={g.id}>
              {g.label}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
        >
          <option value="ALL">All Workflow Statuses</option>
          {['DRAFT', 'PENDING_REVIEW', 'APPROVED', 'SCHEDULED', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'].map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>

        <span className="text-xs font-mono text-slate-400 ml-auto">
          Showing {filteredPages.length} of {pages.length} managed pages
        </span>
      </div>

      {viewMode === 'publishing' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Pages List */}
          <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800 max-h-[620px] overflow-y-auto">
            {filteredPages.map((p) => {
              const active = selectedPage?.slug === p.slug;
              return (
                <button
                  key={p.slug}
                  onClick={() => setSelectedSlug(p.slug)}
                  className={`w-full text-left p-4 transition-colors ${active ? 'bg-amber-500/10 border-l-4 border-amber-500' : 'hover:bg-slate-800/40'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="font-bold text-sm text-white truncate">{p.title}</div>
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold shrink-0 ${getStatusBadgeClass(p.status)}`}>
                      {p.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5 font-mono">
                    <span>/{p.slug} • Group: {p.pageGroup || 'custom'}</span>
                    <span>v{p.version || 1}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${getStatusBadgeClass(p.reviewStatus)}`}>
                      Review: {p.reviewStatus || 'NOT_REVIEWED'}
                    </span>
                    {p.scheduledPublishAt && (
                      <span className="text-[10px] text-sky-400 font-mono">
                        Due: {formatDateTimeInTz(p.scheduledPublishAt)}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Workflow Controls */}
          <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
            {selectedPage ? (
              <>
                <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-lg font-extrabold text-white">{selectedPage.title}</h3>
                      <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${getStatusBadgeClass(selectedPage.status)}`}>
                        {selectedPage.status} (v{selectedPage.version || 1})
                      </span>
                    </div>
                    <p className="text-xs font-mono text-slate-400 mt-1">
                      Route: /{selectedPage.slug} • Updated: {formatDateTimeInTz(selectedPage.updatedAt)}
                    </p>
                    {selectedPage.lastPublishError && (
                      <div className="mt-2 p-2 rounded bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                        Last Error: {selectedPage.lastPublishError}
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {onOpenEditor && (
                      <button
                        onClick={() => onOpenEditor(selectedPage.slug)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-bold flex items-center gap-1.5 border border-slate-700"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit Sections & Rich Text
                      </button>
                    )}
                    {onOpenReview && (
                      <button
                        onClick={() => onOpenReview(selectedPage.slug)}
                        className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-sky-400 text-xs font-bold flex items-center gap-1.5 border border-slate-700"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" /> Editorial Review
                      </button>
                    )}
                  </div>
                </div>

                {/* Summary note & Workflow actions */}
                <div className="space-y-3">
                  <label className="block text-xs font-semibold text-slate-300">
                    Revision / Approval Note (stored in Neon DB history)
                  </label>
                  <input
                    type="text"
                    value={changeSummary}
                    onChange={(e) => setChangeSummary(e.target.value)}
                    placeholder="e.g., Updated Yaoundé commercial capabilities & verified NIU disclosure"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2 text-xs font-bold">
                    <button
                      onClick={() => runWorkflow(selectedPage.slug, 'submit-review')}
                      disabled={Boolean(busyAction)}
                      className="px-3 py-2.5 rounded-lg bg-amber-500/15 hover:bg-amber-500/25 border border-amber-500/30 text-amber-300 flex items-center justify-center gap-1.5"
                    >
                      <FileText className="w-3.5 h-3.5" /> Submit for Review
                    </button>
                    <button
                      onClick={() => runWorkflow(selectedPage.slug, 'approve')}
                      disabled={Boolean(busyAction)}
                      className="px-3 py-2.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Approve Content
                    </button>
                    <button
                      onClick={() => runWorkflow(selectedPage.slug, selectedPage.status === 'PUBLISHED' ? 'republish' : 'publish')}
                      disabled={Boolean(busyAction)}
                      className="px-3 py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" /> {selectedPage.status === 'PUBLISHED' ? 'Republish Live' : 'Publish Live'}
                    </button>
                    <button
                      onClick={() => runWorkflow(selectedPage.slug, 'unpublish')}
                      disabled={Boolean(busyAction)}
                      className="px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center justify-center gap-1.5"
                    >
                      <EyeOff className="w-3.5 h-3.5" /> Unpublish
                    </button>
                    <button
                      onClick={() => runWorkflow(selectedPage.slug, 'archive')}
                      disabled={Boolean(busyAction)}
                      className="px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 flex items-center justify-center gap-1.5"
                    >
                      <Archive className="w-3.5 h-3.5" /> Archive
                    </button>
                    <button
                      onClick={() => runWorkflow(selectedPage.slug, 'restore')}
                      disabled={Boolean(busyAction)}
                      className="px-3 py-2.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-emerald-300 flex items-center justify-center gap-1.5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" /> Restore to Draft
                    </button>
                  </div>
                </div>

                {/* Scheduled Publishing Box */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                  <div className="text-xs font-bold text-sky-400 flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Schedule Future Publication
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="datetime-local"
                      value={scheduleDatetime}
                      onChange={(e) => setScheduleDatetime(e.target.value)}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    />
                    <button
                      onClick={() => runWorkflow(selectedPage.slug, 'schedule')}
                      disabled={Boolean(busyAction)}
                      className="px-4 py-2 rounded-lg bg-sky-500 hover:bg-sky-400 text-slate-950 font-black text-xs"
                    >
                      Schedule Publish
                    </button>
                  </div>
                </div>

                {/* Recent Revisions Quick List */}
                <div className="space-y-2 pt-2">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
                    <History className="w-3.5 h-3.5 text-amber-500" /> Page Version Snapshots ({revisions.length})
                  </h4>
                  {revisions.length === 0 ? (
                    <p className="text-xs text-slate-500">No snapshots recorded for /{selectedPage.slug} yet.</p>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {revisions.slice(0, 6).map((rev) => (
                        <div key={rev.id} className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                          <div>
                            <div className="font-bold text-white flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-400 font-mono text-[10px]">
                                v{rev.version}
                              </span>
                              <span>{rev.title}</span>
                            </div>
                            <div className="text-[11px] text-slate-400 mt-0.5">
                              {rev.changeSummary || 'Published snapshot'} • {rev.author} • {formatDateTimeInTz(rev.createdAt)}
                            </div>
                          </div>
                          <button
                            onClick={() => restoreRevision(rev.id)}
                            disabled={Boolean(busyAction)}
                            className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold flex items-center gap-1 shrink-0"
                          >
                            <RotateCcw className="w-3 h-3" /> Restore
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="py-12 text-center text-xs text-slate-500">Select a page to manage its workflow.</div>
            )}
          </div>
        </div>
      ) : (
        /* Revision Diff & Publication History View */
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-amber-500" /> Version Snapshot Comparison — /{selectedSlug}
              </h3>
              <select
                value={selectedSlug}
                onChange={(e) => setSelectedSlug(e.target.value)}
                className="bg-slate-950 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white"
              >
                {pages.map((p) => (
                  <option key={p.slug} value={p.slug}>
                    {p.title} (/{p.slug})
                  </option>
                ))}
              </select>
            </div>

            {revisions.length === 0 ? (
              <p className="text-xs text-slate-500 py-6 text-center">No revisions exist yet for /{selectedSlug}. Publish the page to create version snapshots.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">Baseline Version (Left)</label>
                    <select
                      value={diffLeftId ?? ''}
                      onChange={(e) => setDiffLeftId(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      {revisions.map((r) => (
                        <option key={r.id} value={r.id}>
                          v{r.version} — {r.title} ({new Date(r.createdAt).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-mono text-slate-400 mb-1">Target Version (Right)</label>
                    <select
                      value={diffRightId ?? ''}
                      onChange={(e) => setDiffRightId(Number(e.target.value))}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    >
                      {revisions.map((r) => (
                        <option key={r.id} value={r.id}>
                          v{r.version} — {r.title} ({new Date(r.createdAt).toLocaleString()})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 max-h-80 overflow-auto whitespace-pre-wrap">
                    {leftRev ? JSON.stringify(leftRev.snapshotData, null, 2) : '—'}
                  </pre>
                  <pre className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px] font-mono text-amber-200 max-h-80 overflow-auto whitespace-pre-wrap">
                    {rightRev ? JSON.stringify(rightRev.snapshotData, null, 2) : '—'}
                  </pre>
                </div>
              </>
            )}
          </div>

          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-amber-500" /> Publication & Failure Audit Log
            </h3>
            <div className="divide-y divide-slate-800 max-h-80 overflow-y-auto">
              {history.map((h) => (
                <div key={h.id} className="py-2.5 flex items-center justify-between gap-4 text-xs">
                  <div>
                    <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold mr-2 ${getStatusBadgeClass(h.success ? h.toStatus : 'FAIL')}`}>
                      {h.action}
                    </span>
                    <span className="font-bold text-white">{h.targetTitle || h.targetSlug}</span>
                    <p className="text-[11px] text-slate-400 mt-0.5">{h.errorMessage || h.details}</p>
                  </div>
                  <div className="text-right text-[10px] font-mono text-slate-500 shrink-0">
                    <div>{h.performedBy}</div>
                    <div>{formatDateTimeInTz(h.createdAt)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Create New Page Modal */}
      {showCreate && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form onSubmit={handleCreatePage} className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white">Create New Managed CMS Page</h3>
            <div>
              <label className="block text-xs text-slate-300 font-semibold mb-1">Page Title *</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="e.g., Real Estate Advisory"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 font-semibold mb-1">URL Slug *</label>
              <input
                type="text"
                value={newSlug}
                onChange={(e) => setNewSlug(e.target.value)}
                placeholder="e.g., real-estate-advisory"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-xs text-slate-300 font-semibold mb-1">Page Group</label>
              <select
                value={newGroup}
                onChange={(e) => setNewGroup(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              >
                {PAGE_GROUP_OPTIONS.filter((g) => g.id !== 'all').map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button type="button" onClick={() => setShowCreate(false)} className="px-4 py-2 rounded-lg bg-slate-800 text-xs text-slate-300">
                Cancel
              </button>
              <button type="submit" disabled={Boolean(busyAction)} className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-black text-xs">
                Create Draft Page
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
