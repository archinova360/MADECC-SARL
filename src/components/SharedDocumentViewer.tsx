import React, { useEffect, useState } from 'react';
import {
  FileText,
  Download,
  Lock,
  Edit3,
  Eye,
  Save,
  Printer,
  ArrowLeft,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { ProDocument, ProDocumentExportRecord, ProDocumentShareAccess } from '../types/proDocumentTypes.ts';
import { proDocStudioService } from '../services/proDocStudioService.ts';
import { generateProDocumentDocx, generateProDocumentPdf, triggerBlobDownload } from '../utils/proDocExport.ts';
import { ProDocRichEditor } from './ProDocRichEditor.tsx';

interface SharedDocumentViewerProps {
  token: string;
  onBackToHome: () => void;
}

export const SharedDocumentViewer: React.FC<SharedDocumentViewerProps> = ({ token, onBackToHome }) => {
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [doc, setDoc] = useState<ProDocument | null>(null);
  const [accessType, setAccessType] = useState<ProDocumentShareAccess>('VIEW_ONLY');
  const [recipientName, setRecipientName] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [exportsList, setExportsList] = useState<(ProDocumentExportRecord & { downloadUrl: string })[]>([]);

  const [isEditing, setIsEditing] = useState(false);
  const [draftJson, setDraftJson] = useState<any>(null);
  const [draftHtml, setDraftHtml] = useState<string>('');
  const [draftTitle, setDraftTitle] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState<'PDF' | 'DOCX' | null>(null);
  const [toast, setToast] = useState<{ msg: string; kind: 'ok' | 'err' } | null>(null);

  const notify = (msg: string, kind: 'ok' | 'err' = 'ok') => {
    setToast({ msg, kind });
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    let active = true;
    setLoading(true);
    setErrorMsg(null);
    proDocStudioService
      .getSharedDocument(token)
      .then((res) => {
        if (!active) return;
        setDoc(res.document);
        setAccessType(res.accessType);
        setRecipientName(res.recipientName || null);
        setExpiresAt(res.expiresAt || null);
        setExportsList(res.exports || []);
        setDraftTitle(res.document.title);
        setDraftJson(res.document.contentJson);
        setDraftHtml(res.document.contentHtml);
      })
      .catch((err: any) => {
        if (!active) return;
        setErrorMsg(err?.message || 'Unable to verify document share link.');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [token]);

  const handleSaveCollaborativeEdit = async () => {
    if (!doc || accessType !== 'EDIT') return;
    setSaving(true);
    try {
      const res = await proDocStudioService.saveSharedDocument(token, {
        title: draftTitle,
        contentJson: draftJson,
        contentHtml: draftHtml,
        expectedVersion: doc.version,
      });
      setDoc(res.document);
      setIsEditing(false);
      notify(`Saved collaborative updates (now v${res.document.version}).`, 'ok');
    } catch (err: any) {
      notify(err?.message || 'Failed to save shared edits.', 'err');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadVectorPdf = async () => {
    if (!doc) return;
    setExporting('PDF');
    try {
      const targetDoc = isEditing ? { ...doc, title: draftTitle, contentJson: draftJson, contentHtml: draftHtml } : doc;
      const { blob, filename } = await generateProDocumentPdf(targetDoc);
      triggerBlobDownload(blob, filename);
      notify(`Downloaded vector A4 PDF: ${filename}`, 'ok');
    } catch (err: any) {
      notify(err?.message || 'Failed to generate PDF.', 'err');
    } finally {
      setExporting(null);
    }
  };

  const handleDownloadWordDocx = async () => {
    if (!doc) return;
    setExporting('DOCX');
    try {
      const targetDoc = isEditing ? { ...doc, title: draftTitle, contentJson: draftJson, contentHtml: draftHtml } : doc;
      const { blob, filename } = await generateProDocumentDocx(targetDoc);
      triggerBlobDownload(blob, filename);
      notify(`Downloaded editable Word document: ${filename}`, 'ok');
    } catch (err: any) {
      notify(err?.message || 'Failed to generate Word file.', 'err');
    } finally {
      setExporting(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="bg-white border border-slate-200 rounded-xl px-8 py-6 shadow-sm flex items-center gap-3 text-slate-700 text-sm">
          <div className="w-5 h-5 border-2 border-slate-300 border-t-amber-600 rounded-full animate-spin" />
          Verifying cryptographic share token...
        </div>
      </div>
    );
  }

  if (errorMsg || !doc) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-red-200 rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-center gap-3 text-red-700">
            <ShieldAlert className="w-6 h-6 shrink-0" />
            <h1 className="text-lg font-bold">Shared Link Unavailable</h1>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">{errorMsg || 'This secure document link is invalid or expired.'}</p>
          <button
            type="button"
            onClick={onBackToHome}
            className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold rounded-lg flex items-center justify-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" /> Return to MADECC GROUP Portal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {toast && (
        <div
          className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-lg shadow-lg text-xs font-semibold flex items-center gap-2 ${
            toast.kind === 'ok' ? 'bg-slate-900 text-white border border-amber-500' : 'bg-red-700 text-white'
          }`}
        >
          {toast.kind === 'ok' ? <CheckCircle2 className="w-4 h-4 text-amber-400" /> : <AlertTriangle className="w-4 h-4" />}
          {toast.msg}
        </div>
      )}

      {/* Top Shared Workspace Bar */}
      <header className="bg-slate-950 text-white border-b border-slate-800 px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <button
            type="button"
            onClick={onBackToHome}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800"
            title="Return to Main Website"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-xs text-amber-400 font-semibold">
              <FileText className="w-3.5 h-3.5" />
              <span className="tabular-nums">{doc.documentNumber}</span>
              <span>·</span>
              <span className="tabular-nums">v{doc.version}</span>
              <span>·</span>
              <span>{accessType === 'EDIT' ? 'Authorized Collaborator Edit' : 'Authorized View-Only'}</span>
            </div>
            <h1 className="text-sm sm:text-base font-bold text-white truncate">{doc.title}</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {recipientName && (
            <span className="text-xs text-slate-300 hidden md:inline">
              Recipient: <strong className="text-white">{recipientName}</strong>
            </span>
          )}
          {expiresAt && (
            <span className="text-xs text-slate-400 hidden lg:inline-flex items-center gap-1 tabular-nums">
              <Clock className="w-3.5 h-3.5" /> Expires {new Date(expiresAt).toLocaleDateString()}
            </span>
          )}
          {doc.isConfidential && (
            <span className="text-xs text-amber-400 inline-flex items-center gap-1 font-medium px-2 py-1 border border-amber-500/30 rounded bg-amber-500/10">
              <Lock className="w-3 h-3" /> Confidential
            </span>
          )}

          {accessType === 'EDIT' && (
            <>
              <button
                type="button"
                onClick={() => setIsEditing((v) => !v)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border ${
                  isEditing
                    ? 'bg-slate-800 border-slate-700 text-slate-200'
                    : 'bg-amber-600 border-amber-500 text-white hover:bg-amber-700'
                }`}
              >
                {isEditing ? <Eye className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
                {isEditing ? 'Switch to View Mode' : 'Edit Document'}
              </button>
              {isEditing && (
                <button
                  type="button"
                  disabled={saving}
                  onClick={handleSaveCollaborativeEdit}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white flex items-center gap-1.5 disabled:opacity-60"
                >
                  <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </>
          )}

          <button
            type="button"
            disabled={exporting === 'PDF'}
            onClick={handleDownloadVectorPdf}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white text-slate-900 hover:bg-slate-100 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-red-700" /> {exporting === 'PDF' ? 'Generating PDF...' : 'Download PDF'}
          </button>
          <button
            type="button"
            disabled={exporting === 'DOCX'}
            onClick={handleDownloadWordDocx}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 text-white border border-slate-700 hover:bg-slate-700 flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" /> {exporting === 'DOCX' ? 'Generating Word...' : 'Download .DOCX'}
          </button>
          <button
            type="button"
            onClick={() => window.print()}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700"
            title="Print"
          >
            <Printer className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Main Viewer / Collaborator Workspace */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-5">
        {isEditing && accessType === 'EDIT' && (
          <div className="bg-white border border-slate-200 rounded-lg p-3 flex flex-wrap items-center gap-3">
            <label className="text-xs font-semibold text-slate-700">Document Title:</label>
            <input
              type="text"
              value={draftTitle}
              onChange={(e) => setDraftTitle(e.target.value)}
              className="flex-1 min-w-[240px] px-3 py-1.5 text-sm border border-slate-300 rounded focus:outline-none focus:border-amber-500"
            />
          </div>
        )}

        <ProDocRichEditor
          docKey={`shared-${doc.id}-${doc.version}-${isEditing ? 'edit' : 'view'}`}
          initialContentJson={isEditing ? draftJson : doc.contentJson}
          initialContentHtml={isEditing ? draftHtml : doc.contentHtml}
          editable={isEditing && accessType === 'EDIT'}
          orientation={doc.orientation}
          marginMm={doc.marginMm}
          headerText={doc.headerText}
          footerText={doc.footerText}
          documentNumber={doc.documentNumber}
          version={doc.version}
          status={doc.status}
          showPageNumbers={doc.showPageNumbers}
          showConfidentialityFooter={doc.showConfidentialityFooter}
          signatureBlock={doc.signatureBlock}
          onChange={({ json, html }) => {
            setDraftJson(json);
            setDraftHtml(html);
          }}
          onNotify={(m, t) => notify(m, t === 'error' ? 'err' : 'ok')}
        />

        {/* Authorized Cloud-Stored Exports */}
        {exportsList.length > 0 && (
          <section className="bg-white border border-slate-200 rounded-xl p-4">
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700 mb-3">
              Official Stored Export Snapshots
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
              {exportsList.map((exp) => (
                <button
                  key={exp.id}
                  type="button"
                  onClick={() =>
                    proDocStudioService
                      .downloadAuthorizedExport(exp.id, exp.fileName, token)
                      .catch((e) => notify(e.message, 'err'))
                  }
                  className="flex items-center justify-between px-3 py-2 bg-slate-50 hover:bg-amber-50 border border-slate-200 hover:border-amber-300 rounded-lg text-left transition-colors"
                >
                  <div className="min-w-0 pr-2">
                    <div className="text-xs font-semibold text-slate-900 truncate">{exp.fileName}</div>
                    <div className="text-[11px] text-slate-500 tabular-nums">
                      {exp.format} · v{exp.versionAtExport} · {Math.max(1, Math.round(exp.fileSizeBytes / 1024))} KB
                    </div>
                  </div>
                  <Download className="w-4 h-4 text-amber-600 shrink-0" />
                </button>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
};
