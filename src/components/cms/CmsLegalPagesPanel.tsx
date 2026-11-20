import React, { useEffect, useState } from 'react';
import {
  Scale,
  Save,
  Send,
  AlertTriangle,
  Eye,
  Clock,
  Archive,
  RotateCcw,
  EyeOff,
  History,
  RefreshCw,
  X,
} from 'lucide-react';
import { cmsFetch, formatDateTimeInTz, getStatusBadgeClass } from './cmsClient.ts';
import CmsRichTextEditor from './CmsRichTextEditor.tsx';
import { sanitizeCmsHtml } from '../../lib/sanitizeHtml.ts';
import { CmsLegalDocument } from '../../types.ts';

export default function CmsLegalPagesPanel() {
  const [docs, setDocs] = useState<CmsLegalDocument[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>('privacy');
  const [form, setForm] = useState<Partial<CmsLegalDocument>>({});
  const [revisions, setRevisions] = useState<any[]>([]);
  const [scheduleAt, setScheduleAt] = useState('');
  const [changeSummary, setChangeSummary] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadDocs = async () => {
    setLoading(true);
    try {
      const res = await cmsFetch('/api/cms/legal');
      const list: CmsLegalDocument[] = res.documents || [];
      setDocs(list);
      const current = list.find((d) => d.slug === selectedSlug) || list[0];
      if (current) {
        setSelectedSlug(current.slug);
        setForm({ ...current });
        loadRevisions(current.slug);
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to load legal documents' });
    } finally {
      setLoading(false);
    }
  };

  const loadRevisions = async (slug: string) => {
    try {
      const res = await cmsFetch(`/api/cms/legal/${slug}/revisions`);
      setRevisions(res.revisions || []);
    } catch {
      setRevisions([]);
    }
  };

  useEffect(() => {
    loadDocs();
  }, []);

  const handleSelectDoc = (doc: CmsLegalDocument) => {
    setSelectedSlug(doc.slug);
    setForm({ ...doc });
    loadRevisions(doc.slug);
  };

  const handleSaveDraft = async () => {
    setBusy(true);
    setMsg(null);
    try {
      const res = await cmsFetch(`/api/cms/legal/${selectedSlug}/draft`, {
        method: 'PUT',
        body: JSON.stringify({
          title: form.title,
          docType: form.docType,
          summary: form.summary,
          contentHtml: form.contentHtml,
          effectiveDate: form.effectiveDate,
          lastUpdatedDate: form.lastUpdatedDate,
          legalReviewWarning: form.legalReviewWarning,
          requiresProfessionalReview: form.requiresProfessionalReview,
        }),
      });
      setForm(res.document);
      setMsg({ type: 'success', text: `Saved legal draft for "${form.title}".` });
      loadDocs();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Save draft failed' });
    } finally {
      setBusy(false);
    }
  };

  const handleWorkflowAction = async (action: 'publish' | 'schedule' | 'unpublish' | 'archive' | 'restore') => {
    setBusy(true);
    setMsg(null);
    try {
      // Save draft first on publish/schedule so latest edits are included
      if (action === 'publish' || action === 'schedule') {
        await cmsFetch(`/api/cms/legal/${selectedSlug}/draft`, {
          method: 'PUT',
          body: JSON.stringify({
            title: form.title,
            docType: form.docType,
            summary: form.summary,
            contentHtml: form.contentHtml,
            effectiveDate: form.effectiveDate,
            lastUpdatedDate: form.lastUpdatedDate,
            legalReviewWarning: form.legalReviewWarning,
            requiresProfessionalReview: form.requiresProfessionalReview,
          }),
        });
      }

      const res = await cmsFetch(`/api/cms/legal/${selectedSlug}/publish`, {
        method: 'POST',
        body: JSON.stringify({
          action,
          changeSummary: changeSummary.trim() || undefined,
          scheduledPublishAt: action === 'schedule' && scheduleAt ? new Date(scheduleAt).toISOString() : undefined,
        }),
      });
      setForm(res.document);
      setChangeSummary('');
      setMsg({ type: 'success', text: `Legal action "${action}" applied to /${selectedSlug}.` });
      await loadDocs();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Action failed' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 text-slate-200" id="cms-legal-manager-panel">
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-black text-white flex items-center gap-2.5">
            <Scale className="w-5 h-5 text-amber-500" />
            Legal Pages & Governance Document Manager (10 Types)
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage Privacy, Terms, Cookies, Disclaimer, Copyright, Acceptable Use, Data Protection, API Terms, Investor Disclaimer, and QHSE Safety policies.
          </p>
        </div>
        <button
          onClick={loadDocs}
          className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-xs font-bold flex items-center gap-1.5 self-start lg:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} /> Refresh
        </button>
      </div>

      {msg && (
        <div className={`p-3 rounded-xl text-xs font-bold ${msg.type === 'success' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'}`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* 10 Legal Document List */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl divide-y divide-slate-800 max-h-[720px] overflow-y-auto">
          {docs.map((d) => (
            <button
              key={d.slug}
              onClick={() => handleSelectDoc(d)}
              className={`w-full text-left p-4 transition-colors ${d.slug === selectedSlug ? 'bg-amber-500/10 border-l-4 border-amber-500' : 'hover:bg-slate-800/40'}`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-bold text-sm text-white truncate">{d.title}</span>
                <span className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold shrink-0 ${getStatusBadgeClass(d.status)}`}>
                  {d.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-1">
                <span>/{d.slug}</span>
                <span>v{d.version || 1}</span>
              </div>
              {d.requiresProfessionalReview && (
                <div className="mt-1.5 text-[10px] text-amber-400 font-semibold flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Pending Professional Legal Review
                </div>
              )}
            </button>
          ))}
        </div>

        {/* Legal Editor */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
          {form.slug ? (
            <>
              <div className="p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 text-xs flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Mandatory Legal Verification Notice:</strong> Draft legal templates are provided for structural governance only and do not constitute formal legal advice under Cameroonian / OHADA law until verified by an authorized legal practitioner or administrator.
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Document Title</label>
                  <input
                    type="text"
                    value={form.title || ''}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Effective Date</label>
                    <input
                      type="date"
                      value={form.effectiveDate || ''}
                      onChange={(e) => setForm({ ...form, effectiveDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                  <div>
                    <label className="block font-semibold text-slate-300 mb-1">Last Updated</label>
                    <input
                      type="date"
                      value={form.lastUpdatedDate || ''}
                      onChange={(e) => setForm({ ...form, lastUpdatedDate: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                    />
                  </div>
                </div>
              </div>

              <div className="text-xs">
                <label className="block font-semibold text-slate-300 mb-1">Executive Summary</label>
                <input
                  type="text"
                  value={form.summary || ''}
                  onChange={(e) => setForm({ ...form, summary: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Legal Document Body (Sanitized Rich Text HTML)
                </label>
                <CmsRichTextEditor
                  value={form.contentHtml || ''}
                  onChange={(html) => setForm({ ...form, contentHtml: html })}
                  minHeight="280px"
                />
              </div>

              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.requiresProfessionalReview === false}
                  onChange={(e) => setForm({ ...form, requiresProfessionalReview: !e.target.checked })}
                />
                <span>Administrator confirms this legal wording has been reviewed and approved for public display</span>
              </label>

              {/* Actions */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-800 text-xs font-bold">
                <button
                  onClick={() => setShowPreview(true)}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center gap-1.5"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview
                </button>
                <button
                  onClick={handleSaveDraft}
                  disabled={busy}
                  className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white flex items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5" /> Save Draft
                </button>
                <button
                  onClick={() => handleWorkflowAction('publish')}
                  disabled={busy}
                  className="px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black flex items-center gap-1.5"
                >
                  <Send className="w-3.5 h-3.5" /> {form.status === 'PUBLISHED' ? 'Republish Live' : 'Publish Live'}
                </button>
                <button
                  onClick={() => handleWorkflowAction('unpublish')}
                  disabled={busy}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1"
                >
                  <EyeOff className="w-3.5 h-3.5" /> Unpublish
                </button>
                <button
                  onClick={() => handleWorkflowAction('archive')}
                  disabled={busy}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center gap-1"
                >
                  <Archive className="w-3.5 h-3.5" /> Archive
                </button>
                <button
                  onClick={() => handleWorkflowAction('restore')}
                  disabled={busy}
                  className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> Restore Draft
                </button>
              </div>

              {/* Schedule */}
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 text-xs">
                <Clock className="w-4 h-4 text-sky-400 shrink-0" />
                <input
                  type="text"
                  value={changeSummary}
                  onChange={(e) => setChangeSummary(e.target.value)}
                  placeholder="Revision note..."
                  className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                />
                <input
                  type="datetime-local"
                  value={scheduleAt}
                  onChange={(e) => setScheduleAt(e.target.value)}
                  className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                />
                <button
                  onClick={() => handleWorkflowAction('schedule')}
                  disabled={busy || !scheduleAt}
                  className="px-3.5 py-1.5 rounded bg-sky-500 hover:bg-sky-400 disabled:opacity-50 text-slate-950 font-black"
                >
                  Schedule
                </button>
              </div>

              {/* Revisions */}
              <div className="space-y-1.5 pt-2">
                <div className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1.5">
                  <History className="w-3.5 h-3.5 text-amber-500" /> Legal Revision Log ({revisions.length})
                </div>
                {revisions.slice(0, 4).map((r) => (
                  <div key={r.id} className="text-[11px] text-slate-400 bg-slate-950 px-3 py-2 rounded border border-slate-800 flex justify-between">
                    <span>v{r.version} — {r.changeSummary || r.title} ({r.author})</span>
                    <span className="font-mono">{formatDateTimeInTz(r.createdAt)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : null}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Public Legal Document Preview — {form.title}</h3>
              <button onClick={() => setShowPreview(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div
              className="p-6 overflow-y-auto prose prose-invert prose-sm max-w-none text-slate-200"
              dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(form.contentHtml || '') }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
