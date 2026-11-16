import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  LayoutDashboard,
  FilePlus2,
  Files,
  FileEdit,
  Globe,
  Share2,
  Archive,
  LayoutTemplate,
  Settings as SettingsIcon,
  Save,
  Download,
  CloudUpload,
  History,
  Sliders,
  Lock,
  Unlock,
  Trash2,
  Copy,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  RotateCcw,
  Send,
  ShieldCheck,
  X,
  Search,
  ExternalLink,
  PenTool,
  RefreshCw,
} from 'lucide-react';
import { User } from '../types.ts';
import {
  ProDocDashboardStats,
  ProDocument,
  ProDocumentExportRecord,
  ProDocumentOrientation,
  ProDocumentSettings,
  ProDocumentShare,
  ProDocumentShareAccess,
  ProDocumentSignatureBlock,
  ProDocumentStatus,
  ProDocumentTemplate,
  ProDocumentVersion,
  ProDocumentVisibility,
} from '../types/proDocumentTypes.ts';
import {
  proDocStudioService,
  VerifiedCompanyInfo,
  VersionConflictError,
} from '../services/proDocStudioService.ts';
import { generateProDocumentDocx, generateProDocumentPdf, triggerBlobDownload } from '../utils/proDocExport.ts';
import { ProDocRichEditor } from './ProDocRichEditor.tsx';

type StudioSection =
  | 'dashboard'
  | 'create'
  | 'all'
  | 'drafts'
  | 'published'
  | 'shared'
  | 'archived'
  | 'templates'
  | 'settings';

interface ProDocumentStudioProps {
  currentUser: User | null;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
  onOpenSharedLink?: (token: string) => void;
}

const DOCUMENT_CATEGORIES = [
  'Strategic Proposal',
  'Construction Contract',
  'Subcontractor Agreement',
  'Commercial Proposal',
  'Executive Memorandum',
  'NDA & Confidentiality',
  'Site Safety & Compliance',
  'Handover & Completion',
  'Corporate Governance',
  'Procurement & Tender',
  'General',
];

const DEFAULT_SIGNATURE_BLOCK: ProDocumentSignatureBlock = {
  enabled: true,
  leftHeading: 'Prepared & Endorsed By',
  leftSignerName: '',
  leftSignerRole: 'Authorized Representative',
  leftSignedDate: '',
  rightHeading: 'Acknowledged / Counterparty',
  rightSignerName: '',
  rightSignerRole: 'Authorized Signatory',
  rightSignedDate: '',
  includeCompanyStamp: true,
};

function formatDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function StatusTag({ status }: { status: ProDocumentStatus }) {
  const styles: Record<ProDocumentStatus, string> = {
    DRAFT: 'bg-slate-100 text-slate-700 border-slate-300',
    UNDER_REVIEW: 'bg-amber-50 text-amber-800 border-amber-300',
    APPROVED: 'bg-sky-50 text-sky-800 border-sky-300',
    PUBLISHED: 'bg-emerald-50 text-emerald-800 border-emerald-300',
    ARCHIVED: 'bg-zinc-100 text-zinc-600 border-zinc-300',
  };
  return (
    <span className={`inline-block px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide border rounded ${styles[status] || styles.DRAFT}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export const ProDocumentStudio: React.FC<ProDocumentStudioProps> = ({
  currentUser,
  showToast,
  onOpenSharedLink,
}) => {
  const isAdmin = currentUser?.role === 'admin';

  const [section, setSection] = useState<StudioSection>('dashboard');
  const [loading, setLoading] = useState(true);

  const [dashboard, setDashboard] = useState<ProDocDashboardStats | null>(null);
  const [documents, setDocuments] = useState<ProDocument[]>([]);
  const [templates, setTemplates] = useState<ProDocumentTemplate[]>([]);
  const [settings, setSettings] = useState<ProDocumentSettings | null>(null);
  const [verifiedCompany, setVerifiedCompany] = useState<VerifiedCompanyInfo | null>(null);

  // Filters
  const [searchQ, setSearchQ] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState<ProDocumentStatus | 'ALL'>('ALL');
  const [sortBy, setSortBy] = useState<'updated_desc' | 'updated_asc' | 'title_asc' | 'created_desc'>('updated_desc');

  // Create Document Form State
  const [selectedTemplateId, setSelectedTemplateId] = useState<number | null>(null);
  const [createTitle, setCreateTitle] = useState('');
  const [createCategory, setCreateCategory] = useState('Strategic Proposal');
  const [createDesc, setCreateDesc] = useState('');
  const [createOrientation, setCreateOrientation] = useState<ProDocumentOrientation>('portrait');
  const [createConfidential, setCreateConfidential] = useState(true);
  const [creatingDoc, setCreatingDoc] = useState(false);

  // Active Document Editor State
  const [activeDoc, setActiveDoc] = useState<ProDocument | null>(null);
  const [docVersions, setDocVersions] = useState<ProDocumentVersion[]>([]);
  const [docShares, setDocShares] = useState<ProDocumentShare[]>([]);
  const [docExports, setDocExports] = useState<ProDocumentExportRecord[]>([]);
  const [editorKeySuffix, setEditorKeySuffix] = useState(0);

  const [isDirty, setIsDirty] = useState(false);
  const [saveState, setSaveState] = useState<'idle' | 'saving' | 'saved' | 'error' | 'conflict'>('idle');
  const [lastSavedAt, setLastSavedAt] = useState<string>('');
  const [conflictInfo, setConflictInfo] = useState<{ serverVersion: number; serverDocument?: ProDocument } | null>(null);
  const [exportingFormat, setExportingFormat] = useState<'PDF' | 'DOCX' | 'STORE_PDF' | 'STORE_DOCX' | null>(null);

  // Editor Drawers / Modals
  const [showPropertiesModal, setShowPropertiesModal] = useState(false);
  const [showVersionsModal, setShowVersionsModal] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [pendingNavAction, setPendingNavAction] = useState<(() => void) | null>(null);

  // Share Creation Form
  const [shareAccess, setShareAccess] = useState<ProDocumentShareAccess>('VIEW_ONLY');
  const [shareRecipientName, setShareRecipientName] = useState('');
  const [shareRecipientEmail, setShareRecipientEmail] = useState('');
  const [shareExpiresDays, setShareExpiresDays] = useState<number>(14);
  const [shareNeverExpires, setShareNeverExpires] = useState(false);
  const [shareSendEmail, setShareSendEmail] = useState(false);
  const [creatingShare, setCreatingShare] = useState(false);
  const [latestGeneratedShareUrl, setLatestGeneratedShareUrl] = useState<string | null>(null);

  // Template Editor State
  const [editingTemplate, setEditingTemplate] = useState<ProDocumentTemplate | null>(null);
  const [isNewTemplateModal, setIsNewTemplateModal] = useState(false);
  const [newTplName, setNewTplName] = useState('');
  const [newTplCategory, setNewTplCategory] = useState('Strategic Proposal');
  const [newTplDesc, setNewTplDesc] = useState('');
  const [savingTemplate, setSavingTemplate] = useState(false);

  // Delete Confirmation Modal State (no window.confirm)
  const [confirmDeleteTarget, setConfirmDeleteTarget] = useState<{
    kind: 'document' | 'template';
    id: number;
    label: string;
  } | null>(null);

  // Signature Pad Drawing State inside Properties Modal
  const sigCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [drawingSigSide, setDrawingSigSide] = useState<'left' | 'right' | null>(null);
  const isDrawingRef = useRef(false);

  // Concurrency & latest document refs for debounced autosave
  const saveInFlightRef = useRef(false);
  const activeDocRef = useRef<ProDocument | null>(null);
  const isDirtyRef = useRef(false);
  activeDocRef.current = activeDoc;
  isDirtyRef.current = isDirty;

  // Settings Editable Draft
  const [settingsForm, setSettingsForm] = useState<ProDocumentSettings | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);

  const loadCoreData = useCallback(async () => {
    setLoading(true);
    try {
      const [dash, tpls, cfg, docs] = await Promise.all([
        proDocStudioService.getDashboard(),
        proDocStudioService.listTemplates(),
        proDocStudioService.getSettings(),
        proDocStudioService.listDocuments({ sort: 'updated_desc' }),
      ]);
      setDashboard(dash);
      setTemplates(tpls);
      setSettings(cfg.settings);
      setSettingsForm(cfg.settings);
      setVerifiedCompany(cfg.verifiedCompany);
      setDocuments(docs);
    } catch (err: any) {
      showToast(err?.message || 'Failed to initialize Document Studio.', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadCoreData();
  }, [loadCoreData]);

  // Reload document list when filters or section change
  const refreshDocumentList = useCallback(async () => {
    try {
      let statusParam: ProDocumentStatus | 'ALL' = 'ALL';
      let sharedOnly = false;
      if (section === 'all') statusParam = filterStatus;
      else if (section === 'published') statusParam = 'PUBLISHED';
      else if (section === 'archived') statusParam = 'ARCHIVED';
      else if (section === 'shared') sharedOnly = true;

      const list = await proDocStudioService.listDocuments({
        q: searchQ,
        category: filterCategory,
        status: statusParam,
        sharedOnly,
        sort: sortBy,
      });

      if (section === 'drafts') {
        setDocuments(list.filter((d) => d.status === 'DRAFT' || d.status === 'UNDER_REVIEW'));
      } else if (section === 'published') {
        setDocuments(list);
      } else {
        setDocuments(list);
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to load documents.', 'error');
    }
  }, [section, filterStatus, filterCategory, searchQ, sortBy, showToast]);

  useEffect(() => {
    if (!activeDoc && ['all', 'drafts', 'published', 'shared', 'archived'].includes(section)) {
      refreshDocumentList();
    }
  }, [section, filterStatus, filterCategory, searchQ, sortBy, activeDoc, refreshDocumentList]);

  // Warn user on browser close/refresh if unsaved changes exist
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current && activeDocRef.current) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  const guardUnsaved = (action: () => void) => {
    if (isDirty && activeDoc) {
      setPendingNavAction(() => action);
    } else {
      action();
    }
  };

  const openDocumentEditor = async (docId: number) => {
    try {
      const detail = await proDocStudioService.getDocument(docId);
      setActiveDoc(detail.document);
      setDocVersions(detail.versions);
      setDocShares(detail.shares);
      setDocExports(detail.exports);
      setIsDirty(false);
      setSaveState('saved');
      setConflictInfo(null);
      setLastSavedAt(formatDateTime(detail.document.updatedAt));
      setEditorKeySuffix((k) => k + 1);
      setLatestGeneratedShareUrl(null);
    } catch (err: any) {
      showToast(err?.message || 'Failed to open document.', 'error');
    }
  };

  const performSaveDocument = useCallback(
    async (opts?: { isAutoSave?: boolean; forceOverwrite?: boolean; saveSnapshot?: boolean; summary?: string }): Promise<boolean> => {
      const cur = activeDocRef.current;
      if (!cur || saveInFlightRef.current) return false;
      saveInFlightRef.current = true;
      setSaveState('saving');

      try {
        const res = await proDocStudioService.updateDocument(cur.id, {
          title: cur.title,
          category: cur.category,
          description: cur.description,
          contentJson: cur.contentJson,
          contentHtml: cur.contentHtml,
          visibility: cur.visibility,
          isConfidential: cur.isConfidential,
          orientation: cur.orientation,
          marginMm: cur.marginMm,
          headerText: cur.headerText,
          footerText: cur.footerText,
          showPageNumbers: cur.showPageNumbers,
          showConfidentialityFooter: cur.showConfidentialityFooter,
          signatureBlock: cur.signatureBlock,
          metadata: cur.metadata,
          expectedVersion: opts?.forceOverwrite ? undefined : cur.version,
          forceOverwrite: Boolean(opts?.forceOverwrite),
          isAutoSave: Boolean(opts?.isAutoSave),
          saveVersionSnapshot: Boolean(opts?.saveSnapshot),
          changeSummary: opts?.summary,
        });

        setActiveDoc((prev) =>
          prev && prev.id === res.document.id
            ? {
                ...res.document,
                // Preserve latest user keystrokes if edits occurred mid-request
                contentJson: isDirtyRef.current && prev.contentJson !== cur.contentJson ? prev.contentJson : res.document.contentJson,
                contentHtml: isDirtyRef.current && prev.contentHtml !== cur.contentHtml ? prev.contentHtml : res.document.contentHtml,
              }
            : res.document
        );
        setIsDirty(false);
        setSaveState('saved');
        setConflictInfo(null);
        setLastSavedAt(new Date().toLocaleTimeString());

        if (!opts?.isAutoSave) {
          const versions = await proDocStudioService.listVersions(cur.id);
          setDocVersions(versions);
          showToast(`Saved ${res.document.documentNumber} (v${res.document.version})`, 'success');
        }
        return true;
      } catch (err: any) {
        if (err instanceof VersionConflictError) {
          setSaveState('conflict');
          setConflictInfo({ serverVersion: err.serverVersion, serverDocument: err.serverDocument });
          showToast(`Version conflict: server is at v${err.serverVersion}.`, 'error');
        } else {
          setSaveState('error');
          if (!opts?.isAutoSave) {
            showToast(err?.message || 'Failed to save document.', 'error');
          }
        }
        return false;
      } finally {
        saveInFlightRef.current = false;
      }
    },
    [showToast]
  );

  // Configurable Auto-Save Timer
  useEffect(() => {
    if (!activeDoc || !isDirty || saveState === 'conflict') return;
    const intervalMs = Math.max(5, Number(settings?.autoSaveIntervalSec ?? 15)) * 1000;
    const timer = setTimeout(() => {
      performSaveDocument({ isAutoSave: true });
    }, intervalMs);
    return () => clearTimeout(timer);
  }, [activeDoc, isDirty, saveState, settings?.autoSaveIntervalSec, performSaveDocument]);

  const handleInstantiateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createTitle.trim()) {
      showToast('Please enter a document title.', 'error');
      return;
    }
    setCreatingDoc(true);
    try {
      const created = await proDocStudioService.createDocument({
        title: createTitle.trim(),
        category: createCategory,
        description: createDesc.trim() || undefined,
        templateId: selectedTemplateId,
        orientation: createOrientation,
        isConfidential: createConfidential,
        visibility: createConfidential ? 'PRIVATE' : 'INTERNAL',
      });
      setCreateTitle('');
      setCreateDesc('');
      showToast(`Created ${created.documentNumber}`, 'success');
      await loadCoreData();
      await openDocumentEditor(created.id);
    } catch (err: any) {
      showToast(err?.message || 'Failed to create document.', 'error');
    } finally {
      setCreatingDoc(false);
    }
  };

  const handleSelectTemplateForCreate = (tpl: ProDocumentTemplate | null) => {
    if (!tpl) {
      setSelectedTemplateId(null);
      setCreateTitle('');
      setCreateCategory('General');
      setCreateDesc('');
      setCreateOrientation(settings?.defaultOrientation || 'portrait');
      setCreateConfidential(true);
      return;
    }
    setSelectedTemplateId(tpl.id);
    setCreateTitle(tpl.name);
    setCreateCategory(tpl.category);
    setCreateDesc(tpl.description || '');
    setCreateOrientation(tpl.defaultOrientation || 'portrait');
    setCreateConfidential(tpl.isConfidential);
  };

  const handleTransitionStatus = async (docId: number, status: ProDocumentStatus) => {
    try {
      if (activeDoc && activeDoc.id === docId && isDirty) {
        await performSaveDocument({ isAutoSave: false, summary: `Saved before status transition to ${status}` });
      }
      const res = await proDocStudioService.transitionStatus(docId, status);
      if (activeDoc?.id === docId) {
        setActiveDoc(res.document);
        const vers = await proDocStudioService.listVersions(docId);
        setDocVersions(vers);
      }
      await loadCoreData();
      showToast(`Document status updated to ${status.replace('_', ' ')}`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Status transition denied or failed.', 'error');
    }
  };

  const handleDuplicateDoc = async (docId: number) => {
    try {
      const clone = await proDocStudioService.duplicateDocument(docId);
      await loadCoreData();
      showToast(`Duplicated as ${clone.documentNumber}`, 'success');
      await openDocumentEditor(clone.id);
    } catch (err: any) {
      showToast(err?.message || 'Failed to duplicate document.', 'error');
    }
  };

  const handleConfirmDelete = async () => {
    if (!confirmDeleteTarget) return;
    try {
      if (confirmDeleteTarget.kind === 'document') {
        await proDocStudioService.deleteDocument(confirmDeleteTarget.id);
        if (activeDoc?.id === confirmDeleteTarget.id) {
          setActiveDoc(null);
          setIsDirty(false);
        }
        showToast('Document permanently deleted.', 'success');
      } else {
        await proDocStudioService.deleteTemplate(confirmDeleteTarget.id);
        if (editingTemplate?.id === confirmDeleteTarget.id) {
          setEditingTemplate(null);
        }
        showToast('Template deleted.', 'success');
      }
      setConfirmDeleteTarget(null);
      await loadCoreData();
    } catch (err: any) {
      showToast(err?.message || 'Delete operation failed.', 'error');
    }
  };

  const handleExportPdf = async (storeToCloud: boolean) => {
    if (!activeDoc) return;
    setExportingFormat(storeToCloud ? 'STORE_PDF' : 'PDF');
    try {
      const { blob, filename } = await generateProDocumentPdf(activeDoc, verifiedCompany);
      triggerBlobDownload(blob, filename);
      if (storeToCloud) {
        const stored = await proDocStudioService.storeExport(activeDoc.id, blob, filename, 'PDF', activeDoc.orientation);
        setDocExports((prev) => [stored.exportRecord, ...prev]);
        showToast(`Vector PDF stored in ${stored.exportRecord.storageProvider.toUpperCase()} storage.`, 'success');
      } else {
        showToast(`Exported vector A4 PDF: ${filename}`, 'success');
      }
    } catch (err: any) {
      showToast(err?.message || 'PDF generation failed.', 'error');
    } finally {
      setExportingFormat(null);
    }
  };

  const handleExportDocx = async (storeToCloud: boolean) => {
    if (!activeDoc) return;
    setExportingFormat(storeToCloud ? 'STORE_DOCX' : 'DOCX');
    try {
      const { blob, filename } = await generateProDocumentDocx(activeDoc, verifiedCompany);
      triggerBlobDownload(blob, filename);
      if (storeToCloud) {
        const stored = await proDocStudioService.storeExport(activeDoc.id, blob, filename, 'DOCX', activeDoc.orientation);
        setDocExports((prev) => [stored.exportRecord, ...prev]);
        showToast(`Editable Word .docx stored in ${stored.exportRecord.storageProvider.toUpperCase()} storage.`, 'success');
      } else {
        showToast(`Exported editable Microsoft Word file: ${filename}`, 'success');
      }
    } catch (err: any) {
      showToast(err?.message || 'Word export failed.', 'error');
    } finally {
      setExportingFormat(null);
    }
  };

  const handleCreateShareLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDoc) return;
    setCreatingShare(true);
    try {
      const res = await proDocStudioService.createShare(activeDoc.id, {
        accessType: shareAccess,
        recipientName: shareRecipientName.trim() || undefined,
        recipientEmail: shareRecipientEmail.trim() || undefined,
        expiresInDays: shareNeverExpires ? null : shareExpiresDays,
        neverExpires: shareNeverExpires,
        sendEmail: shareSendEmail,
      });
      setDocShares((prev) => [res.share, ...prev]);
      setLatestGeneratedShareUrl(res.share.shareUrl);
      if (res.emailSent) {
        showToast('Share link created & emailed via SMTP!', 'success');
      } else {
        showToast('Secure share link created.', 'success');
      }
    } catch (err: any) {
      showToast(err?.message || 'Failed to create share link.', 'error');
    } finally {
      setCreatingShare(false);
    }
  };

  const handleRevokeShare = async (shareId: number) => {
    try {
      const res = await proDocStudioService.revokeShare(shareId);
      setDocShares((prev) => prev.map((s) => (s.id === shareId ? res.share : s)));
      showToast('Share link revoked immediately.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to revoke share link.', 'error');
    }
  };

  const handleRestoreVersion = async (versionId: number, versionNumber: number) => {
    if (!activeDoc) return;
    try {
      const res = await proDocStudioService.restoreVersion(activeDoc.id, versionId);
      setActiveDoc(res.document);
      setIsDirty(false);
      setSaveState('saved');
      setEditorKeySuffix((k) => k + 1);
      const vers = await proDocStudioService.listVersions(activeDoc.id);
      setDocVersions(vers);
      setShowVersionsModal(false);
      showToast(`Restored snapshot v${versionNumber} as new v${res.document.version}`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to restore version.', 'error');
    }
  };

  const handleSaveTemplateEdits = async () => {
    if (!editingTemplate) return;
    setSavingTemplate(true);
    try {
      const updated = await proDocStudioService.updateTemplate(editingTemplate.id, editingTemplate);
      setEditingTemplate(updated);
      await loadCoreData();
      showToast(`Saved template v${updated.version}`, 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to save template.', 'error');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleCreateTemplateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTplName.trim()) return;
    setSavingTemplate(true);
    try {
      const created = await proDocStudioService.createTemplate({
        name: newTplName.trim(),
        category: newTplCategory,
        description: newTplDesc.trim() || undefined,
      });
      setIsNewTemplateModal(false);
      setNewTplName('');
      setNewTplDesc('');
      await loadCoreData();
      setEditingTemplate(created);
      showToast('Custom template created. You can now edit its structure in Tiptap.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to create template.', 'error');
    } finally {
      setSavingTemplate(false);
    }
  };

  const handleSaveGlobalSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settingsForm) return;
    setSavingSettings(true);
    try {
      const res = await proDocStudioService.updateSettings(settingsForm);
      setSettings(res.settings);
      setSettingsForm(res.settings);
      showToast('Document Studio settings persisted to Neon PostgreSQL.', 'success');
    } catch (err: any) {
      showToast(err?.message || 'Failed to save settings.', 'error');
    } finally {
      setSavingSettings(false);
    }
  };

  // Signature Pad Drawing Handlers
  const startDrawSig = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    isDrawingRef.current = true;
    ctx.strokeStyle = '#0F172A';
    ctx.lineWidth = 2.2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const moveDrawSig = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawingRef.current || !sigCanvasRef.current) return;
    const canvas = sigCanvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawSig = () => {
    isDrawingRef.current = false;
  };

  const applyDrawnSignature = () => {
    if (!sigCanvasRef.current || !activeDoc || !drawingSigSide) return;
    const dataUrl = sigCanvasRef.current.toDataURL('image/png');
    setActiveDoc((prev) =>
      prev
        ? {
            ...prev,
            signatureBlock: {
              ...(prev.signatureBlock || DEFAULT_SIGNATURE_BLOCK),
              enabled: true,
              ...(drawingSigSide === 'left'
                ? { leftSignatureDataUrl: dataUrl }
                : { rightSignatureDataUrl: dataUrl }),
            },
          }
        : prev
    );
    setIsDirty(true);
    setDrawingSigSide(null);
    showToast('Signature applied to endorsement block.', 'success');
  };

  const navItems: { id: StudioSection; label: string; icon: React.ComponentType<any>; count?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'create', label: 'Create New Document', icon: FilePlus2 },
    { id: 'all', label: 'All Documents', icon: Files, count: dashboard?.totalDocuments },
    {
      id: 'drafts',
      label: 'Draft Documents',
      icon: FileEdit,
      count: (dashboard?.draftCount || 0) + (dashboard?.underReviewCount || 0),
    },
    { id: 'published', label: 'Published Documents', icon: Globe, count: dashboard?.publishedCount },
    { id: 'shared', label: 'Shared Documents', icon: Share2, count: dashboard?.sharedCount },
    { id: 'archived', label: 'Archived Documents', icon: Archive, count: dashboard?.archivedCount },
    { id: 'templates', label: 'Document Templates', icon: LayoutTemplate, count: templates.length },
    { id: 'settings', label: 'Document Settings', icon: SettingsIcon },
  ];

  const categoriesAvailable = useMemo(() => {
    const set = new Set<string>(DOCUMENT_CATEGORIES);
    documents.forEach((d) => d.category && set.add(d.category));
    templates.forEach((t) => t.category && set.add(t.category));
    return Array.from(set);
  }, [documents, templates]);

  // =========================================================================
  // RENDER: ACTIVE DOCUMENT EDITOR VIEW
  // =========================================================================
  if (activeDoc) {
    return (
      <div className="space-y-4">
        {/* Sticky Executive Editor Header */}
        <div className="bg-slate-950 text-white rounded-xl p-4 border border-slate-800 shadow-sm space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <button
                type="button"
                onClick={() =>
                  guardUnsaved(() => {
                    setActiveDoc(null);
                    setIsDirty(false);
                    loadCoreData();
                  })
                }
                className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 shrink-0"
                title="Back to Document Studio"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 tabular-nums">
                  <span className="font-mono font-bold text-amber-400">{activeDoc.documentNumber}</span>
                  <span>·</span>
                  <span>v{activeDoc.version}</span>
                  <span>·</span>
                  <StatusTag status={activeDoc.status} />
                  <span>·</span>
                  <span className="inline-flex items-center gap-1 text-slate-300">
                    {activeDoc.isConfidential ? <Lock className="w-3 h-3 text-amber-400" /> : <Unlock className="w-3 h-3" />}
                    {activeDoc.visibility}
                  </span>
                  <span>·</span>
                  <span className="text-slate-300">
                    {saveState === 'saving'
                      ? 'Saving to Neon...'
                      : saveState === 'conflict'
                      ? 'Version Conflict'
                      : isDirty
                      ? 'Unsaved edits (auto-save armed)'
                      : lastSavedAt
                      ? `Saved at ${lastSavedAt}`
                      : 'Synced'}
                  </span>
                </div>
                <input
                  type="text"
                  value={activeDoc.title}
                  onChange={(e) => {
                    setActiveDoc({ ...activeDoc, title: e.target.value });
                    setIsDirty(true);
                  }}
                  aria-label="Document Title"
                  className="mt-1 w-full bg-transparent text-base sm:text-lg font-bold text-white border-b border-transparent hover:border-slate-700 focus:border-amber-500 focus:outline-none py-0.5"
                />
              </div>
            </div>

            {/* Action Cluster */}
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={saveState === 'saving'}
                onClick={() => performSaveDocument({ isAutoSave: false, saveSnapshot: true })}
                className={`px-3.5 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors ${
                  isDirty
                    ? 'bg-amber-600 hover:bg-amber-700 text-white'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                }`}
              >
                <Save className="w-3.5 h-3.5" /> {saveState === 'saving' ? 'Saving...' : isDirty ? 'Save Changes' : 'Save Snapshot'}
              </button>

              <button
                type="button"
                disabled={exportingFormat !== null}
                onClick={() => handleExportPdf(false)}
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-white text-slate-900 hover:bg-slate-100 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-red-700" /> {exportingFormat === 'PDF' ? 'Generating...' : 'PDF'}
              </button>

              <button
                type="button"
                disabled={exportingFormat !== null}
                onClick={() => handleExportDocx(false)}
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 text-white hover:bg-slate-700 border border-slate-700 flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" /> {exportingFormat === 'DOCX' ? 'Generating...' : 'Word (.docx)'}
              </button>

              <button
                type="button"
                disabled={exportingFormat !== null}
                onClick={() => handleExportPdf(true)}
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-amber-300 hover:bg-slate-800 border border-amber-500/40 flex items-center gap-1.5"
                title="Generate & persist official PDF export in Supabase/Cloudinary Storage"
              >
                <CloudUpload className="w-3.5 h-3.5" /> {exportingFormat === 'STORE_PDF' ? 'Storing...' : 'Store PDF'}
              </button>

              <button
                type="button"
                disabled={exportingFormat !== null}
                onClick={() => handleExportDocx(true)}
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-900 text-sky-300 hover:bg-slate-800 border border-sky-500/40 flex items-center gap-1.5"
                title="Generate & persist editable Word .docx export in Supabase/Cloudinary Storage"
              >
                <CloudUpload className="w-3.5 h-3.5" /> {exportingFormat === 'STORE_DOCX' ? 'Storing...' : 'Store .DOCX'}
              </button>

              <button
                type="button"
                onClick={() => setShowShareModal(true)}
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-emerald-700 hover:bg-emerald-600 text-white flex items-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" /> Share ({docShares.filter((s) => !s.revokedAt).length})
              </button>

              <button
                type="button"
                onClick={() => setShowVersionsModal(true)}
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5"
              >
                <History className="w-3.5 h-3.5" /> History ({docVersions.length})
              </button>

              <button
                type="button"
                onClick={() => setShowPropertiesModal(true)}
                className="px-3 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-1.5"
              >
                <Sliders className="w-3.5 h-3.5" /> Layout & Signatures
              </button>
            </div>
          </div>

          {/* Workflow Publishing Strip */}
          <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2 text-slate-300">
              <span>Orientation: <strong className="text-white uppercase">{activeDoc.orientation}</strong></span>
              <span>·</span>
              <span className="tabular-nums">Margins: <strong className="text-white">{activeDoc.marginMm}mm</strong></span>
              <span>·</span>
              <span>Category: <strong className="text-white">{activeDoc.category}</strong></span>
              {docExports.length > 0 && (
                <>
                  <span>·</span>
                  <button
                    type="button"
                    onClick={() =>
                      proDocStudioService
                        .downloadAuthorizedExport(docExports[0].id, docExports[0].fileName)
                        .catch((e) => showToast(e.message, 'error'))
                    }
                    className="text-amber-400 hover:text-amber-300 underline"
                  >
                    Latest Stored {docExports[0].format} ({docExports[0].storageProvider})
                  </button>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {activeDoc.status === 'DRAFT' && (
                <button
                  type="button"
                  onClick={() => handleTransitionStatus(activeDoc.id, 'UNDER_REVIEW')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-semibold"
                >
                  Submit for Review
                </button>
              )}
              {isAdmin && (activeDoc.status === 'DRAFT' || activeDoc.status === 'UNDER_REVIEW') && (
                <button
                  type="button"
                  onClick={() => handleTransitionStatus(activeDoc.id, 'APPROVED')}
                  className="px-2.5 py-1 rounded bg-sky-700 hover:bg-sky-600 text-white font-semibold"
                >
                  Approve
                </button>
              )}
              {isAdmin && activeDoc.status !== 'PUBLISHED' && (
                <button
                  type="button"
                  onClick={() => handleTransitionStatus(activeDoc.id, 'PUBLISHED')}
                  className="px-2.5 py-1 rounded bg-emerald-700 hover:bg-emerald-600 text-white font-semibold flex items-center gap-1"
                >
                  <Globe className="w-3 h-3" /> Publish
                </button>
              )}
              {isAdmin && activeDoc.status === 'PUBLISHED' && (
                <button
                  type="button"
                  onClick={() => handleTransitionStatus(activeDoc.id, 'DRAFT')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 border border-slate-700 font-semibold"
                >
                  Unpublish to Draft
                </button>
              )}
              {isAdmin && activeDoc.status !== 'ARCHIVED' && (
                <button
                  type="button"
                  onClick={() => handleTransitionStatus(activeDoc.id, 'ARCHIVED')}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold"
                >
                  Archive
                </button>
              )}
              <button
                type="button"
                onClick={() => handleDuplicateDoc(activeDoc.id)}
                className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold"
              >
                Duplicate
              </button>
            </div>
          </div>
        </div>

        {/* Version Conflict Resolution Banner */}
        {conflictInfo && (
          <div className="bg-red-50 border border-red-300 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start gap-2.5 text-xs text-red-900">
              <AlertTriangle className="w-5 h-5 text-red-700 shrink-0" />
              <div>
                <div className="font-bold text-sm">Optimistic Concurrency Conflict Detected</div>
                <p>
                  Another session updated this document on the server (server version is now v{conflictInfo.serverVersion}). Auto-save is paused to prevent silent overwrites.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => openDocumentEditor(activeDoc.id)}
                className="px-3 py-1.5 bg-white border border-red-300 text-red-900 rounded-lg text-xs font-bold hover:bg-red-100"
              >
                Reload Server Version (v{conflictInfo.serverVersion})
              </button>
              <button
                type="button"
                onClick={() => performSaveDocument({ isAutoSave: false, forceOverwrite: true, summary: 'Forced overwrite conflict resolution' })}
                className="px-3 py-1.5 bg-red-700 text-white rounded-lg text-xs font-bold hover:bg-red-800"
              >
                Force Overwrite Server
              </button>
            </div>
          </div>
        )}

        {/* Rich Text A4 Editor */}
        <ProDocRichEditor
          docKey={`${activeDoc.id}-${editorKeySuffix}`}
          initialContentJson={activeDoc.contentJson}
          initialContentHtml={activeDoc.contentHtml}
          editable={true}
          orientation={activeDoc.orientation}
          marginMm={activeDoc.marginMm}
          headerText={activeDoc.headerText}
          footerText={activeDoc.footerText}
          documentNumber={activeDoc.documentNumber}
          version={activeDoc.version}
          status={activeDoc.status}
          showPageNumbers={activeDoc.showPageNumbers}
          showConfidentialityFooter={activeDoc.showConfidentialityFooter}
          signatureBlock={activeDoc.signatureBlock}
          verifiedCompany={verifiedCompany}
          onChange={({ json, html }) => {
            setActiveDoc((prev) => (prev ? { ...prev, contentJson: json, contentHtml: html } : prev));
            setIsDirty(true);
            setSaveState('idle');
          }}
          onNotify={(m, t) => showToast(m, t || 'info')}
        />

        {/* Properties, Layout, Header/Footer & Signatures Modal */}
        {showPropertiesModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
              <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between sticky top-0 z-10">
                <h3 className="text-sm font-bold uppercase tracking-wider">Page Layout, Headers, Metadata & Signatures</h3>
                <button type="button" onClick={() => setShowPropertiesModal(false)} className="text-slate-300 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-6 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Category</label>
                    <select
                      value={activeDoc.category}
                      onChange={(e) => {
                        setActiveDoc({ ...activeDoc, category: e.target.value });
                        setIsDirty(true);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      {categoriesAvailable.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Page Orientation (A4)</label>
                    <select
                      value={activeDoc.orientation}
                      onChange={(e) => {
                        setActiveDoc({ ...activeDoc, orientation: e.target.value as ProDocumentOrientation });
                        setIsDirty(true);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    >
                      <option value="portrait">A4 Portrait (210 × 297 mm)</option>
                      <option value="landscape">A4 Landscape (297 × 210 mm)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Page Margins (mm)</label>
                    <input
                      type="number"
                      min={10}
                      max={40}
                      value={activeDoc.marginMm}
                      onChange={(e) => {
                        setActiveDoc({ ...activeDoc, marginMm: Number(e.target.value) || 20 });
                        setIsDirty(true);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg tabular-nums"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Visibility & Confidentiality</label>
                    <div className="flex items-center gap-3 pt-1">
                      <label className="flex items-center gap-1.5 font-semibold text-slate-800 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={activeDoc.isConfidential}
                          onChange={(e) => {
                            const conf = e.target.checked;
                            setActiveDoc({
                              ...activeDoc,
                              isConfidential: conf,
                              visibility: conf && activeDoc.visibility === 'PUBLIC' ? 'PRIVATE' : activeDoc.visibility,
                            });
                            setIsDirty(true);
                          }}
                        />
                        Confidential
                      </label>
                      <select
                        value={activeDoc.visibility}
                        disabled={activeDoc.isConfidential}
                        onChange={(e) => {
                          setActiveDoc({ ...activeDoc, visibility: e.target.value as ProDocumentVisibility });
                          setIsDirty(true);
                        }}
                        className="px-2.5 py-1.5 border border-slate-300 rounded-lg disabled:bg-slate-100"
                      >
                        <option value="PRIVATE">PRIVATE</option>
                        <option value="INTERNAL">INTERNAL</option>
                        {!activeDoc.isConfidential && <option value="PUBLIC">PUBLIC</option>}
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 pt-3 border-t border-slate-200">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Running Page Header Text</label>
                    <input
                      type="text"
                      value={activeDoc.headerText || ''}
                      onChange={(e) => {
                        setActiveDoc({ ...activeDoc, headerText: e.target.value });
                        setIsDirty(true);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Running Page Footer Text</label>
                    <input
                      type="text"
                      value={activeDoc.footerText || ''}
                      onChange={(e) => {
                        setActiveDoc({ ...activeDoc, footerText: e.target.value });
                        setIsDirty(true);
                      }}
                      className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                    />
                  </div>
                  <div className="flex flex-wrap gap-6 pt-1">
                    <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeDoc.showPageNumbers}
                        onChange={(e) => {
                          setActiveDoc({ ...activeDoc, showPageNumbers: e.target.checked });
                          setIsDirty(true);
                        }}
                      />
                      Show automatic Page X of Y numbering
                    </label>
                    <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={activeDoc.showConfidentialityFooter}
                        onChange={(e) => {
                          setActiveDoc({ ...activeDoc, showConfidentialityFooter: e.target.checked });
                          setIsDirty(true);
                        }}
                      />
                      Include confidentiality footer notice
                    </label>
                  </div>
                </div>

                {/* Signatures Configuration + Interactive Signature Pad */}
                <div className="space-y-4 pt-3 border-t border-slate-200">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-slate-900">Formal Dual-Party Signature Endorsement Block</h4>
                    <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(activeDoc.signatureBlock?.enabled)}
                        onChange={(e) => {
                          setActiveDoc({
                            ...activeDoc,
                            signatureBlock: {
                              ...(activeDoc.signatureBlock || DEFAULT_SIGNATURE_BLOCK),
                              enabled: e.target.checked,
                            },
                          });
                          setIsDirty(true);
                        }}
                      />
                      Enable Signature Block
                    </label>
                  </div>

                  {activeDoc.signatureBlock?.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {(['left', 'right'] as const).map((side) => {
                        const sb = activeDoc.signatureBlock || DEFAULT_SIGNATURE_BLOCK;
                        const headingVal = side === 'left' ? sb.leftHeading : sb.rightHeading;
                        const nameVal = side === 'left' ? sb.leftSignerName : sb.rightSignerName;
                        const roleVal = side === 'left' ? sb.leftSignerRole : sb.rightSignerRole;
                        const dateVal = side === 'left' ? sb.leftSignedDate : sb.rightSignedDate;
                        const sigUrl = side === 'left' ? sb.leftSignatureDataUrl : sb.rightSignatureDataUrl;
                        return (
                          <div key={side} className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
                            <div className="font-bold uppercase text-[11px] text-amber-800">
                              {side === 'left' ? 'Primary Signatory (MADECC GROUP)' : 'Counterparty / Client Signatory'}
                            </div>
                            <input
                              type="text"
                              placeholder="Heading"
                              value={headingVal || ''}
                              onChange={(e) => {
                                setActiveDoc({
                                  ...activeDoc,
                                  signatureBlock: { ...sb, [side === 'left' ? 'leftHeading' : 'rightHeading']: e.target.value },
                                });
                                setIsDirty(true);
                              }}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                            />
                            <input
                              type="text"
                              placeholder="Signatory Name"
                              value={nameVal || ''}
                              onChange={(e) => {
                                setActiveDoc({
                                  ...activeDoc,
                                  signatureBlock: { ...sb, [side === 'left' ? 'leftSignerName' : 'rightSignerName']: e.target.value },
                                });
                                setIsDirty(true);
                              }}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                            />
                            <input
                              type="text"
                              placeholder="Title / Capacity"
                              value={roleVal || ''}
                              onChange={(e) => {
                                setActiveDoc({
                                  ...activeDoc,
                                  signatureBlock: { ...sb, [side === 'left' ? 'leftSignerRole' : 'rightSignerRole']: e.target.value },
                                });
                                setIsDirty(true);
                              }}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                            />
                            <input
                              type="date"
                              value={dateVal || ''}
                              onChange={(e) => {
                                setActiveDoc({
                                  ...activeDoc,
                                  signatureBlock: { ...sb, [side === 'left' ? 'leftSignedDate' : 'rightSignedDate']: e.target.value },
                                });
                                setIsDirty(true);
                              }}
                              className="w-full px-2.5 py-1.5 border border-slate-300 rounded bg-white"
                            />
                            <div className="flex items-center justify-between pt-1">
                              <button
                                type="button"
                                onClick={() => setDrawingSigSide(side)}
                                className="px-2.5 py-1 bg-slate-900 text-white rounded font-semibold flex items-center gap-1"
                              >
                                <PenTool className="w-3 h-3 text-amber-400" /> Draw Signature
                              </button>
                              {sigUrl && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setActiveDoc({
                                      ...activeDoc,
                                      signatureBlock: {
                                        ...sb,
                                        [side === 'left' ? 'leftSignatureDataUrl' : 'rightSignatureDataUrl']: undefined,
                                      },
                                    });
                                    setIsDirty(true);
                                  }}
                                  className="text-red-700 hover:underline font-medium"
                                >
                                  Clear Signature
                                </button>
                              )}
                            </div>
                            {sigUrl && <img src={sigUrl} alt="Captured signature" className="h-12 bg-white border border-slate-200 p-1 rounded object-contain" />}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {drawingSigSide && (
                    <div className="p-4 bg-amber-50 border border-amber-300 rounded-lg space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-amber-900">
                          Draw {drawingSigSide === 'left' ? 'Primary' : 'Counterparty'} Electronic Signature
                        </span>
                        <button type="button" onClick={() => setDrawingSigSide(null)} className="text-slate-600">
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      <canvas
                        ref={sigCanvasRef}
                        width={460}
                        height={130}
                        onMouseDown={startDrawSig}
                        onMouseMove={moveDrawSig}
                        onMouseUp={stopDrawSig}
                        onMouseLeave={stopDrawSig}
                        className="bg-white border border-slate-300 rounded cursor-crosshair w-full max-w-[460px]"
                      />
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            const ctx = sigCanvasRef.current?.getContext('2d');
                            if (ctx && sigCanvasRef.current) ctx.clearRect(0, 0, sigCanvasRef.current.width, sigCanvasRef.current.height);
                          }}
                          className="px-3 py-1 bg-white border border-slate-300 rounded font-semibold"
                        >
                          Reset Ink
                        </button>
                        <button
                          type="button"
                          onClick={applyDrawnSignature}
                          className="px-3 py-1 bg-slate-900 text-white rounded font-semibold"
                        >
                          Apply Signature to Document
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={async () => {
                      await performSaveDocument({ isAutoSave: false, saveSnapshot: true, summary: 'Updated layout & endorsement settings' });
                      setShowPropertiesModal(false);
                    }}
                    className="px-4 py-2 bg-slate-950 text-white font-bold rounded-lg hover:bg-slate-800"
                  >
                    Save & Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Version History Drawer / Modal */}
        {showVersionsModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200">
              <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider">Version History · {activeDoc.documentNumber}</h3>
                <button type="button" onClick={() => setShowVersionsModal(false)} className="text-slate-300 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 divide-y divide-slate-200">
                {docVersions.map((ver) => (
                  <div key={ver.id} className="py-3 flex items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-900 tabular-nums">
                        <span>Version v{ver.versionNumber}</span>
                        <span>·</span>
                        <StatusTag status={ver.status} />
                        <span className="text-slate-500 font-normal">{formatDateTime(ver.createdAt)}</span>
                      </div>
                      <div className="text-xs text-slate-700 mt-1">{ver.changeSummary || 'Saved revision'}</div>
                      <div className="text-[11px] text-slate-500">By {ver.createdBy || 'staff'}</div>
                    </div>
                    {ver.versionNumber !== activeDoc.version ? (
                      <button
                        type="button"
                        onClick={() => handleRestoreVersion(ver.id, ver.versionNumber)}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold flex items-center gap-1.5 shrink-0"
                      >
                        <RotateCcw className="w-3.5 h-3.5" /> Restore
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-emerald-700 shrink-0">Active Version</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Secure Cryptographic Sharing Modal */}
        {showShareModal && (
          <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
              <div className="px-6 py-4 bg-slate-950 text-white flex items-center justify-between">
                <h3 className="text-sm font-bold uppercase tracking-wider">Secure Document Sharing · {activeDoc.documentNumber}</h3>
                <button type="button" onClick={() => setShowShareModal(false)} className="text-slate-300 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-6 space-y-5 text-xs">
                <form onSubmit={handleCreateShareLink} className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                  <div className="font-bold text-slate-900 text-sm">Issue Cryptographic Share Link</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Access Permission</label>
                      <select
                        value={shareAccess}
                        onChange={(e) => setShareAccess(e.target.value as ProDocumentShareAccess)}
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                      >
                        <option value="VIEW_ONLY">View-Only & Export (PDF / Word)</option>
                        <option value="EDIT" disabled={activeDoc.isConfidential && !isAdmin}>
                          Collaborator Edit Mode {activeDoc.isConfidential && !isAdmin ? '(Admin Only)' : ''}
                        </option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Link Expiration</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          min={1}
                          max={365}
                          disabled={shareNeverExpires}
                          value={shareExpiresDays}
                          onChange={(e) => setShareExpiresDays(Number(e.target.value) || 14)}
                          className="w-24 px-3 py-2 bg-white border border-slate-300 rounded-lg disabled:bg-slate-100 tabular-nums"
                        />
                        <span className="text-slate-600">days</span>
                        <label className="flex items-center gap-1 ml-2 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={shareNeverExpires}
                            onChange={(e) => setShareNeverExpires(e.target.checked)}
                          />
                          No expiry
                        </label>
                      </div>
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Recipient Name (Optional)</label>
                      <input
                        type="text"
                        value={shareRecipientName}
                        onChange={(e) => setShareRecipientName(e.target.value)}
                        placeholder="Partner / Investor / Legal Counsel"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Recipient Email (Optional)</label>
                      <input
                        type="email"
                        value={shareRecipientEmail}
                        onChange={(e) => setShareRecipientEmail(e.target.value)}
                        placeholder="partner@organization.com"
                        className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg"
                      />
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                    <label className="flex items-center gap-2 font-medium text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        disabled={!shareRecipientEmail.includes('@')}
                        checked={shareSendEmail}
                        onChange={(e) => setShareSendEmail(e.target.checked)}
                      />
                      Send link via MADECC SMTP email upon creation
                    </label>
                    <button
                      type="submit"
                      disabled={creatingShare}
                      className="px-4 py-2 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-lg flex items-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5 text-amber-400" /> {creatingShare ? 'Issuing Token...' : 'Generate Secure Link'}
                    </button>
                  </div>
                </form>

                {latestGeneratedShareUrl && (
                  <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-4 space-y-2">
                    <div className="font-bold text-emerald-900">Active Tokenized Share URL (copy now — raw token is hashed in Neon):</div>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={latestGeneratedShareUrl}
                        className="flex-1 px-3 py-2 bg-white border border-emerald-300 rounded font-mono text-[11px]"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(latestGeneratedShareUrl);
                          showToast('Share URL copied to clipboard.', 'success');
                        }}
                        className="px-3 py-2 bg-slate-900 text-white rounded font-bold flex items-center gap-1"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copy
                      </button>
                      {typeof navigator !== 'undefined' && typeof (navigator as any).share === 'function' && (
                        <button
                          type="button"
                          onClick={() => {
                            (navigator as any)
                              .share({ title: activeDoc.title, url: latestGeneratedShareUrl })
                              .catch(() => {});
                          }}
                          className="px-3 py-2 bg-amber-600 text-white rounded font-bold"
                        >
                          Device Share
                        </button>
                      )}
                      {onOpenSharedLink && (
                        <button
                          type="button"
                          onClick={() => {
                            const url = new URL(latestGeneratedShareUrl);
                            const tok = url.searchParams.get('docShare');
                            if (tok) {
                              setShowShareModal(false);
                              onOpenSharedLink(tok);
                            }
                          }}
                          className="px-3 py-2 bg-emerald-700 text-white rounded font-bold flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Test Link
                        </button>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-bold text-slate-900 mb-2">Issued Share Links Audit Trail</h4>
                  {docShares.length === 0 ? (
                    <p className="text-slate-500">No share links created for this document yet.</p>
                  ) : (
                    <div className="divide-y divide-slate-200 border border-slate-200 rounded-lg">
                      {docShares.map((s) => {
                        const isRevoked = Boolean(s.revokedAt);
                        const isExpired = Boolean(s.expiresAt && new Date(s.expiresAt) <= new Date());
                        return (
                          <div key={s.id} className="p-3 flex flex-wrap items-center justify-between gap-3">
                            <div>
                              <div className="flex items-center gap-2 font-bold text-slate-900 tabular-nums">
                                <span className="font-mono">{s.tokenPrefix}••••</span>
                                <span>·</span>
                                <span>{s.accessType}</span>
                                <span>·</span>
                                <span className={isRevoked ? 'text-red-700' : isExpired ? 'text-amber-700' : 'text-emerald-700'}>
                                  {isRevoked ? 'Revoked' : isExpired ? 'Expired' : 'Active'}
                                </span>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
                                {s.recipientName || s.recipientEmail || 'General Recipient'} · Views: {s.accessCount} · Created {formatDateTime(s.createdAt)}
                              </div>
                            </div>
                            {!isRevoked && (
                              <button
                                type="button"
                                onClick={() => handleRevokeShare(s.id)}
                                className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-800 border border-red-200 rounded font-bold"
                              >
                                Revoke Access
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Unsaved Changes Leave Confirmation Modal */}
        {pendingNavAction && (
          <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
              <div className="flex items-center gap-2.5 text-amber-800">
                <AlertTriangle className="w-5 h-5" />
                <h3 className="text-base font-bold text-slate-900">Unsaved Changes in Editor</h3>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Save your latest edits to Neon PostgreSQL before closing, or discard local changes.
              </p>
              <div className="flex flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setPendingNavAction(null)}
                  className="px-3 py-2 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                >
                  Stay in Editor
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const act = pendingNavAction;
                    setPendingNavAction(null);
                    setIsDirty(false);
                    act();
                  }}
                  className="px-3 py-2 bg-red-50 text-red-800 border border-red-200 rounded-lg text-xs font-semibold"
                >
                  Discard & Leave
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    const act = pendingNavAction;
                    const ok = await performSaveDocument({ isAutoSave: false, saveSnapshot: true });
                    if (ok) {
                      setPendingNavAction(null);
                      act();
                    }
                  }}
                  className="px-4 py-2 bg-slate-950 text-white rounded-lg text-xs font-bold"
                >
                  Save & Leave
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // RENDER: ACTIVE TEMPLATE EDITOR VIEW
  // =========================================================================
  if (editingTemplate) {
    return (
      <div className="space-y-4">
        <div className="bg-slate-950 text-white rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setEditingTemplate(null)}
              className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div className="min-w-0 flex-1">
              <div className="text-xs text-amber-400 font-semibold">
                Template Editor · {editingTemplate.slug} · v{editingTemplate.version}
              </div>
              <input
                type="text"
                value={editingTemplate.name}
                onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                className="w-full bg-transparent text-base font-bold text-white border-b border-transparent focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={savingTemplate}
              onClick={handleSaveTemplateEdits}
              className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" /> {savingTemplate ? 'Saving Template...' : 'Save Template'}
            </button>
          </div>
        </div>

        <ProDocRichEditor
          docKey={`tpl-${editingTemplate.id}-${editingTemplate.version}`}
          initialContentJson={editingTemplate.contentJson}
          initialContentHtml={editingTemplate.contentHtml}
          editable={isAdmin}
          orientation={editingTemplate.defaultOrientation}
          marginMm={settings?.defaultMarginMm ?? 20}
          headerText={editingTemplate.defaultHeaderText}
          footerText={editingTemplate.defaultFooterText}
          documentNumber={`TEMPLATE · ${editingTemplate.slug}`}
          version={editingTemplate.version}
          status={editingTemplate.isSystem ? 'SYSTEM' : 'CUSTOM'}
          verifiedCompany={verifiedCompany}
          onChange={({ json, html }) => {
            setEditingTemplate((prev) => (prev ? { ...prev, contentJson: json, contentHtml: html } : prev));
          }}
          onNotify={(m, t) => showToast(m, t || 'info')}
        />
      </div>
    );
  }

  // =========================================================================
  // RENDER: STUDIO SHELL WITH 9 REQUIRED SECTIONS
  // =========================================================================
  return (
    <div className="space-y-5">
      {/* Studio Top Bar */}
      <div className="bg-slate-950 text-white rounded-xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-amber-400">
            MADECC GROUP · Executive Governance & Proposal Authoring
          </div>
          <h2 className="text-xl font-bold tracking-tight text-white mt-0.5">Professional Document Studio</h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Tiptap A4 authoring · Neon versioning · Vector PDF & editable Word (.docx) · Cryptographic external sharing
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={loadCoreData}
            className="px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Sync DB
          </button>
          <button
            type="button"
            onClick={() => {
              const strategic = templates.find((t) => t.slug === 'strategic-investment-partnership-proposal') || templates[0] || null;
              handleSelectTemplateForCreate(strategic);
              setSection('create');
            }}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5"
          >
            <FilePlus2 className="w-4 h-4" /> New Document
          </button>
        </div>
      </div>

      {/* Horizontal / Sidebar Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-5 items-start">
        {/* 9 Required Sections Navigation */}
        <nav className="bg-white border border-slate-200 rounded-xl p-2 space-y-0.5 shadow-sm" aria-label="Document Studio Sections">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => guardUnsaved(() => setSection(item.id))}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors ${
                  active
                    ? 'bg-slate-950 text-white'
                    : 'text-slate-700 hover:bg-slate-100 hover:text-slate-950'
                }`}
              >
                <span className="flex items-center gap-2.5 truncate">
                  <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-amber-400' : 'text-slate-500'}`} />
                  <span className="truncate">{item.label}</span>
                </span>
                {item.count !== undefined && (
                  <span className={`tabular-nums text-[11px] font-bold ${active ? 'text-amber-400' : 'text-slate-400'}`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Active Section Body */}
        <div className="min-w-0">
          {loading ? (
            <div className="bg-white border border-slate-200 rounded-xl p-10 text-center text-xs text-slate-500">
              Loading Document Studio records from Neon PostgreSQL...
            </div>
          ) : (
            <>
              {/* 1. DASHBOARD */}
              {section === 'dashboard' && (
                <div className="space-y-5">
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
                    {[
                      { label: 'Total Docs', val: dashboard?.totalDocuments ?? 0, target: 'all' as StudioSection },
                      { label: 'Drafts & Review', val: (dashboard?.draftCount ?? 0) + (dashboard?.underReviewCount ?? 0), target: 'drafts' as StudioSection },
                      { label: 'Published', val: dashboard?.publishedCount ?? 0, target: 'published' as StudioSection },
                      { label: 'Active Shares', val: dashboard?.sharedCount ?? 0, target: 'shared' as StudioSection },
                      { label: 'Templates', val: dashboard?.templatesCount ?? templates.length, target: 'templates' as StudioSection },
                      { label: 'Cloud Exports', val: dashboard?.exportsCount ?? 0, target: 'all' as StudioSection },
                    ].map((kpi) => (
                      <button
                        key={kpi.label}
                        type="button"
                        onClick={() => setSection(kpi.target)}
                        className="bg-white border border-slate-200 hover:border-amber-400 rounded-xl p-4 text-left transition-colors"
                      >
                        <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wide">{kpi.label}</div>
                        <div className="text-2xl font-extrabold text-slate-950 tabular-nums mt-1">{kpi.val}</div>
                      </button>
                    ))}
                  </div>

                  {/* Quick-Launch Flagship Proposal Card */}
                  <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 flex flex-wrap items-center justify-between gap-4">
                    <div className="max-w-2xl space-y-1">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-amber-400">Flagship Executive Template</div>
                      <h3 className="text-base font-bold">Strategic Investment Partnership Proposal (14 Structured Sections)</h3>
                      <p className="text-xs text-slate-300 leading-relaxed">
                        Pre-hydrated with verified {verifiedCompany?.companyName || 'MADECC GROUP'} corporate identity from Site Settings, non-binding disclosures, investment tracks, and formal endorsement signatures.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        const t = templates.find((x) => x.slug === 'strategic-investment-partnership-proposal');
                        handleSelectTemplateForCreate(t || null);
                        setSection('create');
                      }}
                      className="px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold rounded-lg shrink-0"
                    >
                      Launch Investment Proposal
                    </button>
                  </div>

                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
                    {/* Recent Documents */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-slate-900">Recent Documents</h3>
                        <button type="button" onClick={() => setSection('all')} className="text-xs font-semibold text-amber-700 hover:underline">
                          View All
                        </button>
                      </div>
                      {!dashboard?.recentDocuments?.length ? (
                        <div className="py-8 text-center text-xs text-slate-500">
                          No documents created yet. Click <strong>Create New Document</strong> to draft your first proposal.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {dashboard.recentDocuments.map((d) => (
                            <div key={d.id} className="py-2.5 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <button
                                  type="button"
                                  onClick={() => openDocumentEditor(d.id)}
                                  className="text-xs font-bold text-slate-900 hover:text-amber-700 text-left truncate block max-w-full"
                                >
                                  {d.title}
                                </button>
                                <div className="text-[11px] text-slate-500 tabular-nums mt-0.5">
                                  {d.documentNumber} · v{d.version} · {d.category} · {formatDateTime(d.updatedAt)}
                                </div>
                              </div>
                              <StatusTag status={d.status} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Recent Cloud Exports */}
                    <div className="bg-white border border-slate-200 rounded-xl p-4">
                      <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100">
                        <h3 className="text-sm font-bold text-slate-900">Recent Stored Exports (PDF / Word)</h3>
                      </div>
                      {!dashboard?.recentExports?.length ? (
                        <div className="py-8 text-center text-xs text-slate-500">
                          No cloud-stored exports yet. Open any document and click <strong>Store PDF</strong> or <strong>Store .DOCX</strong>.
                        </div>
                      ) : (
                        <div className="divide-y divide-slate-100">
                          {dashboard.recentExports.map((exp) => (
                            <div key={exp.id} className="py-2.5 flex items-center justify-between gap-3">
                              <div className="min-w-0">
                                <div className="text-xs font-semibold text-slate-900 truncate">{exp.fileName}</div>
                                <div className="text-[11px] text-slate-500 tabular-nums">
                                  {exp.format} · {exp.storageProvider.toUpperCase()} · v{exp.versionAtExport} · {Math.max(1, Math.round(exp.fileSizeBytes / 1024))} KB
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() =>
                                  proDocStudioService
                                    .downloadAuthorizedExport(exp.id, exp.fileName)
                                    .catch((e) => showToast(e.message, 'error'))
                                }
                                className="px-2.5 py-1 bg-slate-100 hover:bg-amber-50 text-slate-800 border border-slate-200 rounded text-[11px] font-bold flex items-center gap-1 shrink-0"
                              >
                                <Download className="w-3 h-3 text-amber-700" /> Download
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 2. CREATE NEW DOCUMENT */}
              {section === 'create' && (
                <div className="grid grid-cols-1 xl:grid-cols-[1.2fr_1fr] gap-5">
                  <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                    <div>
                      <h3 className="text-base font-bold text-slate-950">Select Starting Blueprint</h3>
                      <p className="text-xs text-slate-500">Choose a blank corporate sheet or one of {templates.length} structured templates.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[540px] overflow-y-auto pr-1">
                      <button
                        type="button"
                        onClick={() => handleSelectTemplateForCreate(null)}
                        className={`p-3.5 rounded-xl border text-left transition-colors ${
                          selectedTemplateId === null
                            ? 'border-amber-600 bg-amber-50/70'
                            : 'border-slate-200 hover:border-slate-400 bg-white'
                        }`}
                      >
                        <div className="text-xs font-bold text-slate-950">Blank Corporate A4 Document</div>
                        <div className="text-[11px] text-slate-500 mt-1">Clean letterhead canvas ready for freeform authoring.</div>
                      </button>

                      {templates.map((tpl) => {
                        const selected = selectedTemplateId === tpl.id;
                        return (
                          <button
                            key={tpl.id}
                            type="button"
                            onClick={() => handleSelectTemplateForCreate(tpl)}
                            className={`p-3.5 rounded-xl border text-left transition-colors ${
                              selected
                                ? 'border-amber-600 bg-amber-50/70'
                                : 'border-slate-200 hover:border-slate-400 bg-white'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[10px] font-bold uppercase tracking-wide text-amber-800">{tpl.category}</span>
                              <span className="text-[10px] font-semibold text-slate-400 uppercase">{tpl.defaultOrientation}</span>
                            </div>
                            <div className="text-xs font-bold text-slate-950 mt-1">{tpl.name}</div>
                            {tpl.description && (
                              <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">{tpl.description}</div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <form onSubmit={handleInstantiateTemplate} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                    <h3 className="text-base font-bold text-slate-950">Document Details</h3>
                    <div className="space-y-3 text-xs">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Document Title *</label>
                        <input
                          type="text"
                          required
                          value={createTitle}
                          onChange={(e) => setCreateTitle(e.target.value)}
                          placeholder="e.g. Strategic Investment Partnership Proposal — Infrastructure Track"
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:border-amber-600"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Category</label>
                        <select
                          value={createCategory}
                          onChange={(e) => setCreateCategory(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        >
                          {categoriesAvailable.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Executive Summary / Notes</label>
                        <textarea
                          rows={3}
                          value={createDesc}
                          onChange={(e) => setCreateDesc(e.target.value)}
                          placeholder="Optional internal summary or project scope reference..."
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block font-bold text-slate-700 mb-1">Page Orientation</label>
                          <select
                            value={createOrientation}
                            onChange={(e) => setCreateOrientation(e.target.value as ProDocumentOrientation)}
                            className="w-full px-3 py-2 border border-slate-300 rounded-lg"
                          >
                            <option value="portrait">A4 Portrait</option>
                            <option value="landscape">A4 Landscape</option>
                          </select>
                        </div>
                        <div className="flex items-end pb-2">
                          <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={createConfidential}
                              onChange={(e) => setCreateConfidential(e.target.checked)}
                            />
                            Confidential (Private Default)
                          </label>
                        </div>
                      </div>
                    </div>
                    <button
                      type="submit"
                      disabled={creatingDoc}
                      className="w-full py-2.5 px-4 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center justify-center gap-2"
                    >
                      <FilePlus2 className="w-4 h-4 text-amber-400" />
                      {creatingDoc ? 'Creating Record in Neon...' : 'Create & Open Rich Document Editor'}
                    </button>
                  </form>
                </div>
              )}

              {/* 3, 4, 5, 6, 7: DOCUMENT LISTING SECTIONS */}
              {['all', 'drafts', 'published', 'shared', 'archived'].includes(section) && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <h3 className="text-base font-bold text-slate-950">
                      {section === 'all' && 'All Documents'}
                      {section === 'drafts' && 'Draft & Under-Review Documents'}
                      {section === 'published' && 'Published & Approved Documents'}
                      {section === 'shared' && 'Shared Documents (Active Token Links)'}
                      {section === 'archived' && 'Archived Documents'}
                    </h3>
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                        <input
                          type="text"
                          value={searchQ}
                          onChange={(e) => setSearchQ(e.target.value)}
                          placeholder="Search title or doc number..."
                          className="pl-8 pr-3 py-1.5 border border-slate-300 rounded-lg w-52 focus:outline-none focus:border-amber-500"
                        />
                      </div>
                      <select
                        value={filterCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="px-2.5 py-1.5 border border-slate-300 rounded-lg"
                      >
                        <option value="ALL">All Categories</option>
                        {categoriesAvailable.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                      {section === 'all' && (
                        <select
                          value={filterStatus}
                          onChange={(e) => setFilterStatus(e.target.value as any)}
                          className="px-2.5 py-1.5 border border-slate-300 rounded-lg"
                        >
                          <option value="ALL">All Statuses</option>
                          <option value="DRAFT">Draft</option>
                          <option value="UNDER_REVIEW">Under Review</option>
                          <option value="APPROVED">Approved</option>
                          <option value="PUBLISHED">Published</option>
                          <option value="ARCHIVED">Archived</option>
                        </select>
                      )}
                      <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value as any)}
                        className="px-2.5 py-1.5 border border-slate-300 rounded-lg"
                      >
                        <option value="updated_desc">Recently Updated</option>
                        <option value="created_desc">Newest Created</option>
                        <option value="title_asc">Title A–Z</option>
                        <option value="updated_asc">Oldest Updated</option>
                      </select>
                    </div>
                  </div>

                  {documents.length === 0 ? (
                    <div className="py-12 text-center text-xs text-slate-500">
                      No matching documents found in this view.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse text-xs">
                        <thead>
                          <tr className="border-b border-slate-200 text-slate-500 uppercase text-[11px]">
                            <th className="py-2.5 pr-3 font-bold">Document / Ref</th>
                            <th className="py-2.5 px-3 font-bold">Category</th>
                            <th className="py-2.5 px-3 font-bold">Status</th>
                            <th className="py-2.5 px-3 font-bold">Version</th>
                            <th className="py-2.5 px-3 font-bold">Updated</th>
                            <th className="py-2.5 pl-3 font-bold text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {documents.map((doc) => (
                            <tr key={doc.id} className="hover:bg-slate-50/70">
                              <td className="py-3 pr-3">
                                <button
                                  type="button"
                                  onClick={() => openDocumentEditor(doc.id)}
                                  className="font-bold text-slate-950 hover:text-amber-700 text-left"
                                >
                                  {doc.title}
                                </button>
                                <div className="text-[11px] text-slate-500 font-mono tabular-nums mt-0.5 flex items-center gap-1.5">
                                  <span>{doc.documentNumber}</span>
                                  <span>·</span>
                                  <span>{doc.visibility}</span>
                                  {(doc.activeSharesCount || 0) > 0 && (
                                    <>
                                      <span>·</span>
                                      <span className="text-emerald-700 font-sans font-semibold">{doc.activeSharesCount} share(s)</span>
                                    </>
                                  )}
                                </div>
                              </td>
                              <td className="py-3 px-3 text-slate-700">{doc.category}</td>
                              <td className="py-3 px-3"><StatusTag status={doc.status} /></td>
                              <td className="py-3 px-3 tabular-nums text-slate-700 font-semibold">v{doc.version}</td>
                              <td className="py-3 px-3 tabular-nums text-slate-500">{formatDateTime(doc.updatedAt)}</td>
                              <td className="py-3 pl-3">
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => openDocumentEditor(doc.id)}
                                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded font-semibold"
                                  >
                                    Open Editor
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleDuplicateDoc(doc.id)}
                                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded"
                                    title="Duplicate Document"
                                  >
                                    <Copy className="w-3.5 h-3.5" />
                                  </button>
                                  {isAdmin && doc.status === 'ARCHIVED' && (
                                    <button
                                      type="button"
                                      onClick={() => handleTransitionStatus(doc.id, 'DRAFT')}
                                      className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded font-semibold"
                                    >
                                      Restore
                                    </button>
                                  )}
                                  {isAdmin && (
                                    <button
                                      type="button"
                                      onClick={() =>
                                        setConfirmDeleteTarget({ kind: 'document', id: doc.id, label: doc.title })
                                      }
                                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded"
                                      title="Delete Document"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  )}
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* 8. DOCUMENT TEMPLATES */}
              {section === 'templates' && (
                <div className="bg-white border border-slate-200 rounded-xl p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
                    <div>
                      <h3 className="text-base font-bold text-slate-950">Document Templates Library ({templates.length})</h3>
                      <p className="text-xs text-slate-500">All 10 corporate templates are editable, versioned, and stored in Neon PostgreSQL.</p>
                    </div>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => setIsNewTemplateModal(true)}
                        className="px-3.5 py-2 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5"
                      >
                        <FilePlus2 className="w-4 h-4 text-amber-400" /> New Custom Template
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map((tpl) => (
                      <div key={tpl.id} className="border border-slate-200 rounded-xl p-4 flex flex-col justify-between gap-3 hover:border-amber-400 transition-colors">
                        <div>
                          <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold">
                            <span className="text-amber-800 uppercase">{tpl.category}</span>
                            <span className="tabular-nums">{tpl.isSystem ? 'System' : 'Custom'} · v{tpl.version}</span>
                          </div>
                          <h4 className="text-sm font-bold text-slate-950 mt-1">{tpl.name}</h4>
                          {tpl.description && <p className="text-xs text-slate-600 mt-1 line-clamp-2">{tpl.description}</p>}
                        </div>
                        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
                          <button
                            type="button"
                            onClick={() => {
                              handleSelectTemplateForCreate(tpl);
                              setSection('create');
                            }}
                            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg"
                          >
                            Use Template
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                type="button"
                                onClick={() => setEditingTemplate(tpl)}
                                className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg"
                              >
                                Edit Structure
                              </button>
                              <button
                                type="button"
                                onClick={async () => {
                                  const dup = await proDocStudioService.duplicateTemplate(tpl.id);
                                  await loadCoreData();
                                  showToast(`Duplicated template "${dup.name}"`, 'success');
                                }}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg"
                                title="Duplicate Template"
                              >
                                <Copy className="w-3.5 h-3.5" />
                              </button>
                              {!tpl.isSystem && (
                                <button
                                  type="button"
                                  onClick={() => setConfirmDeleteTarget({ kind: 'template', id: tpl.id, label: tpl.name })}
                                  className="p-1.5 bg-red-50 hover:bg-red-100 text-red-700 rounded-lg"
                                  title="Delete Template"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 9. DOCUMENT SETTINGS */}
              {section === 'settings' && settingsForm && (
                <div className="grid grid-cols-1 xl:grid-cols-[1.4fr_1fr] gap-5">
                  <form onSubmit={handleSaveGlobalSettings} className="bg-white border border-slate-200 rounded-xl p-5 space-y-4 text-xs">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                      <div>
                        <h3 className="text-base font-bold text-slate-950">Document Studio Global Defaults</h3>
                        <p className="text-slate-500">Persisted in Neon PostgreSQL (`pro_document_settings`).</p>
                      </div>
                      {!isAdmin && (
                        <span className="text-amber-800 font-semibold flex items-center gap-1">
                          <ShieldCheck className="w-4 h-4" /> Admin Write Only
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Default Paper Size</label>
                        <select
                          disabled={!isAdmin}
                          value={settingsForm.defaultPageSize}
                          onChange={(e) => setSettingsForm({ ...settingsForm, defaultPageSize: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
                        >
                          <option value="A4">A4 (ISO 216)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Default Orientation</label>
                        <select
                          disabled={!isAdmin}
                          value={settingsForm.defaultOrientation}
                          onChange={(e) =>
                            setSettingsForm({ ...settingsForm, defaultOrientation: e.target.value as ProDocumentOrientation })
                          }
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
                        >
                          <option value="portrait">Portrait</option>
                          <option value="landscape">Landscape</option>
                        </select>
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Default Margin (mm)</label>
                        <input
                          type="number"
                          min={10}
                          max={40}
                          disabled={!isAdmin}
                          value={settingsForm.defaultMarginMm}
                          onChange={(e) => setSettingsForm({ ...settingsForm, defaultMarginMm: Number(e.target.value) || 20 })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg tabular-nums disabled:bg-slate-50"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">Auto-Save Interval (seconds)</label>
                        <input
                          type="number"
                          min={5}
                          max={120}
                          disabled={!isAdmin}
                          value={settingsForm.autoSaveIntervalSec}
                          onChange={(e) => setSettingsForm({ ...settingsForm, autoSaveIntervalSec: Number(e.target.value) || 15 })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg tabular-nums disabled:bg-slate-50"
                        />
                      </div>
                      <div className="flex flex-col justify-end gap-2 pb-1">
                        <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                          <input
                            type="checkbox"
                            disabled={!isAdmin}
                            checked={settingsForm.requireApprovalBeforePublish}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, requireApprovalBeforePublish: e.target.checked })
                            }
                          />
                          Require Admin Approval before Publishing
                        </label>
                        <label className="flex items-center gap-2 font-semibold text-slate-800 cursor-pointer">
                          <input
                            type="checkbox"
                            disabled={!isAdmin}
                            checked={settingsForm.defaultConfidentialSharingPrivate}
                            onChange={(e) =>
                              setSettingsForm({ ...settingsForm, defaultConfidentialSharingPrivate: e.target.checked })
                            }
                          />
                          Keep Confidential Documents Private on Publish
                        </label>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Default Corporate Header Text</label>
                      <input
                        type="text"
                        disabled={!isAdmin}
                        value={settingsForm.defaultHeaderText}
                        onChange={(e) => setSettingsForm({ ...settingsForm, defaultHeaderText: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Default Corporate Footer Text</label>
                      <input
                        type="text"
                        disabled={!isAdmin}
                        value={settingsForm.defaultFooterText}
                        onChange={(e) => setSettingsForm({ ...settingsForm, defaultFooterText: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
                      />
                    </div>
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">Standard Confidentiality Notice</label>
                      <textarea
                        rows={3}
                        disabled={!isAdmin}
                        value={settingsForm.confidentialityNotice}
                        onChange={(e) => setSettingsForm({ ...settingsForm, confidentialityNotice: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-lg disabled:bg-slate-50"
                      />
                    </div>

                    {isAdmin && (
                      <button
                        type="submit"
                        disabled={savingSettings}
                        className="px-5 py-2.5 bg-slate-950 hover:bg-slate-800 text-white font-bold rounded-lg flex items-center gap-2"
                      >
                        <Save className="w-4 h-4 text-amber-400" /> {savingSettings ? 'Saving Settings...' : 'Save Studio Settings'}
                      </button>
                    )}
                  </form>

                  {/* Verified Company Identity from site_settings */}
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 space-y-3 text-xs">
                    <div className="font-bold text-sm text-slate-950">Verified Company Profile (Site Settings)</div>
                    <p className="text-slate-600 leading-relaxed">
                      Templates and letterhead headers pull exclusively from verified records in <code>site_settings</code> — never fabricated details.
                    </p>
                    {verifiedCompany && (
                      <div className="space-y-2 pt-2 border-t border-slate-200 text-slate-700">
                        <div><strong>Entity:</strong> {verifiedCompany.companyName}</div>
                        {verifiedCompany.legalStatus && <div><strong>Legal Status:</strong> {verifiedCompany.legalStatus}</div>}
                        {verifiedCompany.rccmNumber && <div><strong>RCCM:</strong> {verifiedCompany.rccmNumber}</div>}
                        {verifiedCompany.niuTaxId && <div><strong>NIU Tax ID:</strong> {verifiedCompany.niuTaxId}</div>}
                        {verifiedCompany.website && <div><strong>Website:</strong> {verifiedCompany.website}</div>}
                        {verifiedCompany.email && <div><strong>Email:</strong> {verifiedCompany.email}</div>}
                        {verifiedCompany.phone && <div><strong>Phone:</strong> {verifiedCompany.phone}</div>}
                        {verifiedCompany.officeYaounde && <div><strong>Yaoundé Office:</strong> {verifiedCompany.officeYaounde}</div>}
                        {verifiedCompany.officeDouala && <div><strong>Douala Office:</strong> {verifiedCompany.officeDouala}</div>}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Create New Custom Template Modal */}
      {isNewTemplateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4">
          <form onSubmit={handleCreateTemplateSubmit} className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-950">Create Custom Document Template</h3>
              <button type="button" onClick={() => setIsNewTemplateModal(false)}><X className="w-4 h-4 text-slate-500" /></button>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Template Name *</label>
              <input
                type="text"
                required
                value={newTplName}
                onChange={(e) => setNewTplName(e.target.value)}
                placeholder="e.g. Borehole & Foundation Engineering Contract"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Category</label>
              <select
                value={newTplCategory}
                onChange={(e) => setNewTplCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              >
                {categoriesAvailable.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Description</label>
              <textarea
                rows={2}
                value={newTplDesc}
                onChange={(e) => setNewTplDesc(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setIsNewTemplateModal(false)} className="px-3 py-2 border border-slate-300 rounded-lg">Cancel</button>
              <button type="submit" disabled={savingTemplate} className="px-4 py-2 bg-slate-950 text-white font-bold rounded-lg">
                {savingTemplate ? 'Creating...' : 'Create & Open Tiptap Editor'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Permanent Delete Confirmation Modal (No window.confirm) */}
      {confirmDeleteTarget && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl border border-red-200 space-y-4 text-xs">
            <div className="flex items-center gap-2 text-red-700 font-bold text-sm">
              <Trash2 className="w-5 h-5" /> Confirm Permanent Deletion
            </div>
            <p className="text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete <strong>{confirmDeleteTarget.label}</strong>? Associated version snapshots, shares, and export logs will be removed from PostgreSQL.
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setConfirmDeleteTarget(null)}
                className="px-3 py-2 border border-slate-300 rounded-lg font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-700 hover:bg-red-800 text-white rounded-lg font-bold"
              >
                Delete Permanently
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
