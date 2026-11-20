import React, { useEffect, useState } from 'react';
import {
  ShieldCheck,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  BookOpen,
  FileWarning,
  Info,
} from 'lucide-react';
import { cmsFetch, formatDateTimeInTz, getStatusBadgeClass } from './cmsClient.ts';
import { CmsContentReviewReport, HumanReviewStatus } from '../../types.ts';

interface CmsHumanReviewPanelProps {
  initialSlug?: string;
}

export default function CmsHumanReviewPanel({ initialSlug = 'home' }: CmsHumanReviewPanelProps) {
  const [targetType, setTargetType] = useState<'page' | 'legal'>('page');
  const [targetSlug, setTargetSlug] = useState<string>(initialSlug);
  const [pages, setPages] = useState<any[]>([]);
  const [legalDocs, setLegalDocs] = useState<any[]>([]);
  const [reviews, setReviews] = useState<CmsContentReviewReport[]>([]);
  const [activeReport, setActiveReport] = useState<CmsContentReviewReport | null>(null);
  const [customContentText, setCustomContentText] = useState('');
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const loadAll = async () => {
    try {
      const [pRes, lRes, rRes] = await Promise.all([
        cmsFetch('/api/cms/pages/manage'),
        cmsFetch('/api/cms/legal'),
        cmsFetch('/api/cms/reviews'),
      ]);
      setPages(pRes.pages || []);
      setLegalDocs(lRes.documents || []);
      const revList: CmsContentReviewReport[] = rRes.reviews || [];
      setReviews(revList);
      const match = revList.find((r) => r.targetType === targetType && r.targetSlug === targetSlug);
      if (match) {
        setActiveReport(match);
        setReviewerNotes(match.reviewerNotes || '');
      }
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Failed to load review records' });
    }
  };

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (initialSlug) {
      setTargetType('page');
      setTargetSlug(initialSlug);
    }
  }, [initialSlug]);

  useEffect(() => {
    const match = reviews.find((r) => r.targetType === targetType && r.targetSlug === targetSlug);
    setActiveReport(match || null);
    setReviewerNotes(match?.reviewerNotes || '');
  }, [targetType, targetSlug, reviews]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    setMsg(null);
    try {
      const res = await cmsFetch<{ success: boolean; review: CmsContentReviewReport }>('/api/cms/review/analyze', {
        method: 'POST',
        body: JSON.stringify({
          targetType,
          targetSlug,
          contentText: customContentText.trim() || undefined,
        }),
      });
      setActiveReport(res.review);
      setMsg({ type: 'success', text: `Editorial & corporate fact check completed for ${targetType}/${targetSlug}.` });
      loadAll();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Analysis failed' });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleSetDecision = async (status: HumanReviewStatus) => {
    setUpdatingStatus(true);
    setMsg(null);
    try {
      const res = await cmsFetch<{ success: boolean; review: CmsContentReviewReport }>(
        `/api/cms/review/${targetType}/${targetSlug}/status`,
        {
          method: 'PUT',
          body: JSON.stringify({
            reviewStatus: status,
            reviewerNotes,
          }),
        }
      );
      setActiveReport(res.review);
      setMsg({ type: 'success', text: `Review status updated to ${status}.` });
      loadAll();
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Status update failed' });
    } finally {
      setUpdatingStatus(false);
    }
  };

  const targets = targetType === 'page' ? pages : legalDocs;

  return (
    <div className="space-y-6 text-slate-200" id="cms-human-review-panel">
      {/* Header & Mandatory Disclaimer */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-white flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-amber-500" />
              Human Content Review & Corporate Fact Checker
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Deterministic editorial check for readability, repetition, hype claims, and corporate consistency against verified Neon DB facts.
            </p>
          </div>
          <button
            onClick={handleAnalyze}
            disabled={analyzing}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shrink-0"
          >
            {analyzing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            Run Editorial & Fact Check
          </button>
        </div>

        <div className="p-3 rounded-lg bg-sky-500/10 border border-sky-500/30 text-sky-200 text-xs flex items-start gap-2">
          <Info className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <span>
            <strong>Editorial Assistance Notice:</strong> This analyzer provides objective readability, repetition, style, and corporate fact-verification checks against verified database values (NIU P030217852934P, Yaoundé Mbankolo HQ, pending registration status). It does not certify human authorship or guarantee search rankings. Final approval always rests with the Administrator.
          </span>
        </div>

        {msg && (
          <div className={`p-3 rounded-lg text-xs font-bold ${msg.type === 'success' ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'}`}>
            {msg.text}
          </div>
        )}

        {/* Target Selector */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
          <div>
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Content Type</label>
            <select
              value={targetType}
              onChange={(e) => {
                const t = e.target.value as 'page' | 'legal';
                setTargetType(t);
                const first = t === 'page' ? pages[0]?.slug || 'home' : legalDocs[0]?.slug || 'privacy';
                setTargetSlug(first);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
            >
              <option value="page">Public Website Page</option>
              <option value="legal">Legal Compliance Document</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-[11px] font-mono text-slate-400 mb-1">Select Page / Document to Inspect</label>
            <select
              value={targetSlug}
              onChange={(e) => setTargetSlug(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
            >
              {targets.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.title} (/{item.slug}) — Review: {item.reviewStatus || 'NOT_REVIEWED'}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-[11px] font-mono text-slate-400 mb-1">
            Optional Draft Text Override (leave blank to inspect the saved Neon DB draft for /{targetSlug})
          </label>
          <textarea
            rows={3}
            value={customContentText}
            onChange={(e) => setCustomContentText(e.target.value)}
            placeholder="Paste specific copy to pre-check before saving, or leave empty to scan the saved page/document..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
          />
        </div>
      </div>

      {/* Analysis Results */}
      {activeReport ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-amber-500" />
                <h3 className="text-sm font-bold text-white">Editorial Report: {activeReport.targetType}/{activeReport.targetSlug}</h3>
              </div>
              <span className={`px-2.5 py-0.5 rounded font-mono text-[10px] font-bold ${getStatusBadgeClass(activeReport.reviewStatus)}`}>
                {activeReport.reviewStatus}
              </span>
            </div>

            {/* Summary KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-lg font-black text-white">{activeReport.readabilityScore}/100</div>
                <div className="text-[10px] font-mono text-slate-400">{activeReport.reportJson?.readingEaseLabel || 'Readability'}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-lg font-black text-white">{activeReport.grammarIssuesCount}</div>
                <div className="text-[10px] font-mono text-slate-400">Style / Grammar Flags</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-lg font-black text-white">{activeReport.repeatedPhrasesCount}</div>
                <div className="text-[10px] font-mono text-slate-400">Repeated Phrases</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800">
                <div className="text-lg font-black text-white">{activeReport.hypeFlagsCount}</div>
                <div className="text-[10px] font-mono text-slate-400">Hype / Cliché Flags</div>
              </div>
            </div>

            {/* Fact-Check Verification Issues */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                <FileWarning className="w-4 h-4" /> Verified Corporate Fact-Check Findings ({activeReport.factCheckIssues?.length || 0})
              </h4>
              {(!activeReport.factCheckIssues || activeReport.factCheckIssues.length === 0) ? (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> No corporate fact discrepancies detected against NIU P030217852934P, location, or registration status.
                </div>
              ) : (
                <div className="space-y-2">
                  {activeReport.factCheckIssues.map((f, idx) => (
                    <div key={idx} className="p-3 rounded-lg bg-rose-500/10 border border-rose-500/30 text-xs space-y-1">
                      <div className="font-bold text-rose-300">[{f.severity}] {f.field}: {f.message}</div>
                      <div className="text-slate-300 font-mono text-[11px]">Verified Record: {f.verifiedFact}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Recommendations & Style Notes */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-white">Recommendations</div>
                <ul className="list-disc pl-4 space-y-1 text-slate-300">
                  {(activeReport.reportJson?.recommendations || []).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                <div className="font-bold text-white">Style, Repetition & Hype Notes</div>
                {(activeReport.reportJson?.grammarNotes || []).map((g, i) => (
                  <p key={i} className="text-amber-300">• {g}</p>
                ))}
                {(activeReport.reportJson?.hypeMatches || []).length > 0 && (
                  <p className="text-rose-300">Flagged hype phrases: {activeReport.reportJson.hypeMatches.join(', ')}</p>
                )}
                {(activeReport.reportJson?.repeatedPhrases || []).length > 0 && (
                  <p className="text-slate-400">
                    Repeated 3-word phrases: {activeReport.reportJson.repeatedPhrases.map((p) => `"${p.phrase}" (${p.count}x)`).join(', ')}
                  </p>
                )}
                {!activeReport.reportJson?.grammarNotes?.length && !activeReport.reportJson?.hypeMatches?.length && (
                  <p className="text-emerald-400">Clean editorial tone detected.</p>
                )}
              </div>
            </div>
          </div>

          {/* Admin Approval Panel */}
          <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white">Administrator Review Decision</h3>
            <p className="text-xs text-slate-400">
              Last scanned: {formatDateTimeInTz(activeReport.reviewedAt)} by {activeReport.reviewedBy || 'Admin'}
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Reviewer Notes</label>
              <textarea
                rows={4}
                value={reviewerNotes}
                onChange={(e) => setReviewerNotes(e.target.value)}
                placeholder="Document specific edits requested or approval confirmation..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>

            <div className="space-y-2 text-xs font-bold">
              <button
                onClick={() => handleSetDecision('APPROVED_BY_ADMIN')}
                disabled={updatingStatus}
                className="w-full py-2.5 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black"
              >
                Approve Content (APPROVED_BY_ADMIN)
              </button>
              <button
                onClick={() => handleSetDecision('CHANGES_RECOMMENDED')}
                disabled={updatingStatus}
                className="w-full py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300"
              >
                Request Revisions (CHANGES_RECOMMENDED)
              </button>
              <button
                onClick={() => handleSetDecision('REVIEW_REQUIRED')}
                disabled={updatingStatus}
                className="w-full py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200"
              >
                Flag Review Required (REVIEW_REQUIRED)
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-slate-900 border border-dashed border-slate-800 rounded-xl p-10 text-center space-y-3">
          <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto" />
          <p className="text-sm font-bold text-white">No saved review report for {targetType}/{targetSlug} yet.</p>
          <p className="text-xs text-slate-400">Click "Run Editorial & Fact Check" above to scan the content against readability rules and Neon DB corporate facts.</p>
        </div>
      )}
    </div>
  );
}
