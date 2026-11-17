import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  ShieldCheck,
  AlertTriangle,
  Upload,
  FileCheck2,
  Eye,
  EyeOff,
  Save,
  Globe,
  History,
  Undo2,
  Redo2,
  Share2,
  Download,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Lock,
  Archive,
  GitBranch,
  Copy,
  FileSpreadsheet,
} from 'lucide-react';
import {
  corporateFetch,
  downloadCorporateServerExport,
  exportCorporatePdf,
  exportCorporateXlsx,
} from '../lib/corporateApi.ts';
import { useToast } from './Toast.tsx';

interface CorporateProfileRegistrationHubProps {
  onNavigatePublicPreview?: () => void;
}

export const CorporateProfileRegistrationHub: React.FC<CorporateProfileRegistrationHubProps> = ({
  onNavigatePublicPreview,
}) => {
  const { showToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [profile, setProfile] = useState<any>(null);
  const [form, setForm] = useState<any>(null);
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);
  const [isDirty, setIsDirty] = useState(false);

  const [verifiedDocsCount, setVerifiedDocsCount] = useState(0);
  const [statusLabels, setStatusLabels] = useState<Record<string, string>>({});
  const [legalLabels, setLegalLabels] = useState<Record<string, string>>({});
  const [legalEntities, setLegalEntities] = useState<any[]>([]);
  const [documents, setDocuments] = useState<any[]>([]);
  const [capabilities, setCapabilities] = useState<any>({});

  // Sub-modals
  const [showVersions, setShowVersions] = useState(false);
  const [versions, setVersions] = useState<any[]>([]);
  const [compareVersion, setCompareVersion] = useState<any>(null);
  const [showTransitionModal, setShowTransitionModal] = useState(false);
  const [transitionForm, setTransitionForm] = useState({
    entityName: 'MADECC GROUP SARL',
    targetLegalForm: 'SARL',
    jurisdiction: 'Cameroon',
    transitionNotes: 'Planned transition from sole proprietorship / individual establishment to SARL upon OHADA registration.',
  });

  // Upload doc state
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docForm, setDocForm] = useState({
    title: '',
    category: 'REGISTRATION',
    docType: 'RCCM / Business Registration Filing',
    issuer: 'CFCE / Ministry of Commerce (Cameroon)',
    referenceNumber: '',
    expiresAt: '',
    file: null as File | null,
  });

  // Share link modal
  const [shareModal, setShareModal] = useState(false);
  const [shareResult, setShareResult] = useState<{ token: string; path: string } | null>(null);
  const [shareExpiresDays, setShareExpiresDays] = useState(14);
  const [shareRecipient, setShareRecipient] = useState('');

  // Public preview drawer
  const [publicPreviewData, setPublicPreviewData] = useState<any>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [profData, roleData] = await Promise.all([
        corporateFetch('/api/corporate/profile'),
        corporateFetch('/api/corporate/me-role'),
      ]);
      setProfile(profData.profile);
      setForm(profData.profile);
      setUndoStack([]);
      setRedoStack([]);
      setIsDirty(false);
      setVerifiedDocsCount(profData.verifiedDocsCount || 0);
      setStatusLabels(profData.registrationStatusLabels || {});
      setLegalLabels(profData.legalStructureLabels || {});
      setLegalEntities(profData.legalEntities || []);
      setDocuments(profData.documents || []);
      setCapabilities(roleData.capabilities || {});
    } catch (err: any) {
      showToast(err.message || 'Failed to load corporate profile', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Warn user on browser unload if unsaved changes exist
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  const updateField = (key: string, value: any) => {
    setUndoStack((prev) => [...prev.slice(-24), form]);
    setRedoStack([]);
    setForm((prev: any) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const handleUndo = () => {
    if (undoStack.length === 0) return;
    const prevSnapshot = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, form]);
    setUndoStack((u) => u.slice(0, -1));
    setForm(prevSnapshot);
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    const nextSnapshot = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, form]);
    setRedoStack((r) => r.slice(0, -1));
    setForm(nextSnapshot);
  };

  const handleSave = async (action: 'SAVE_DRAFT' | 'PUBLISH' | 'UNPUBLISH') => {
    setSaving(true);
    try {
      const res = await corporateFetch('/api/corporate/profile', {
        method: 'PUT',
        body: JSON.stringify({
          ...form,
          action,
          expectedVersion: profile?.version,
          changeSummary:
            action === 'SAVE_DRAFT'
              ? 'Saved corporate profile draft'
              : action === 'UNPUBLISH'
              ? 'Unpublished corporate disclosure from public website'
              : 'Published corporate profile updates',
        }),
      });
      setProfile(res.profile);
      setForm(res.profile);
      setIsDirty(false);
      setUndoStack([]);
      setRedoStack([]);
      showToast(
        action === 'SAVE_DRAFT'
          ? 'Draft saved to Neon PostgreSQL'
          : action === 'UNPUBLISH'
          ? 'Profile disclosure unpublished from public website'
          : 'Corporate profile published and synced!',
        'success'
      );
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docForm.file) {
      showToast('Select a registration document file (PDF, JPG, PNG) first', 'error');
      return;
    }
    setUploadingDoc(true);
    try {
      const fd = new FormData();
      fd.append('file', docForm.file);
      fd.append('title', docForm.title || docForm.file.name);
      fd.append('category', docForm.category);
      fd.append('docType', docForm.docType);
      fd.append('issuer', docForm.issuer);
      fd.append('referenceNumber', docForm.referenceNumber);
      if (docForm.expiresAt) fd.append('expiresAt', docForm.expiresAt);
      fd.append('isConfidential', 'true');

      await corporateFetch('/api/corporate/registration-documents', {
        method: 'POST',
        body: fd,
      });
      showToast('Confidential registration document uploaded and hashed (SHA-256). Pending review.', 'success');
      setDocForm({
        title: '',
        category: 'REGISTRATION',
        docType: 'RCCM / Business Registration Filing',
        issuer: 'CFCE / Ministry of Commerce (Cameroon)',
        referenceNumber: '',
        expiresAt: '',
        file: null,
      });
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleReviewDoc = async (docId: number, status: 'VERIFIED' | 'REJECTED' | 'PENDING_REVIEW') => {
    try {
      const notes =
        status === 'VERIFIED'
          ? 'Manually inspected and verified by compliance reviewer.'
          : status === 'REJECTED'
          ? 'Document rejected — incomplete or illegible statutory stamp.'
          : 'Returned to review queue.';
      await corporateFetch(`/api/corporate/registration-documents/${docId}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ status, reviewNotes: notes }),
      });
      showToast(`Document marked ${status}`, 'success');
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleDownloadConfidentialDoc = async (docId: number) => {
    try {
      const data = await corporateFetch(`/api/corporate/documents/registration/${docId}/download`);
      if (data.fileUrl) {
        window.open(data.fileUrl, '_blank', 'noopener,noreferrer');
      }
      showToast('Authorized access logged to audit trail.', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleLegalTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await corporateFetch('/api/corporate/legal-entities/transition', {
        method: 'POST',
        body: JSON.stringify(transitionForm),
      });
      showToast('Historical legal structure preserved and transition entity created!', 'success');
      setShowTransitionModal(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const openVersionHistory = async () => {
    if (!profile?.id) return;
    try {
      const res = await corporateFetch(`/api/corporate/versions/BUSINESS_PROFILE/${profile.id}`);
      setVersions(res.versions || []);
      setCompareVersion(res.versions?.[1] || null);
      setShowVersions(true);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleRestoreVersion = async (versionId: number) => {
    try {
      await corporateFetch(`/api/corporate/versions/${versionId}/restore`, { method: 'POST' });
      showToast('Version restored non-destructively (new version snapshot created).', 'success');
      setShowVersions(false);
      await loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateShare = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await corporateFetch('/api/corporate/shares', {
        method: 'POST',
        body: JSON.stringify({
          entityType: 'BUSINESS_PROFILE',
          entityId: profile.id,
          title: `${form.companyName} — Public Registration & Governance Brief`,
          allowPublic: true,
          expiresInDays: shareExpiresDays,
          recipientEmail: shareRecipient || undefined,
        }),
      });
      setShareResult({ token: res.rawToken, path: `${window.location.origin}${res.sharePath}` });
      showToast('Read-only share token created (confidential documents excluded).', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handlePreviewPublic = async () => {
    try {
      const res = await fetch('/api/public/corporate-profile');
      const data = await res.json();
      setPublicPreviewData(data.profile);
    } catch (err: any) {
      showToast('Failed to load public preview', 'error');
    }
  };

  if (loading || !form) {
    return (
      <div className="p-8 bg-slate-950 border border-slate-800 rounded-2xl text-slate-400 text-sm flex items-center gap-3">
        <RefreshCw className="w-4 h-4 animate-spin text-amber-500" /> Loading corporate profile and registration verification records...
      </div>
    );
  }

  const isVerified = profile.registrationStatus === 'REGISTERED_VERIFIED' && verifiedDocsCount > 0;

  return (
    <div className="space-y-6">
      {/* Header & Action Bar */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
            <span className="text-amber-500 font-bold uppercase">Corporate Governance</span>
            <span>·</span>
            <span>v{profile.version}</span>
            <span>·</span>
            <span className={profile.publishStatus === 'PUBLISHED' ? 'text-emerald-400' : 'text-amber-400'}>
              {profile.publishStatus}
            </span>
            {isDirty && (
              <>
                <span>·</span>
                <span className="text-rose-400 font-semibold">Unsaved changes</span>
              </>
            )}
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Business Profile &amp; Legal Registration</h2>
          <p className="text-xs text-slate-400">
            Authoritative corporate identity, statutory documentary verification, privacy visibility gates, and OHADA transition history.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleUndo}
            disabled={undoStack.length === 0}
            className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-300 hover:border-slate-700 disabled:opacity-40 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            title="Undo field edit"
          >
            <Undo2 className="w-3.5 h-3.5" /> Undo
          </button>
          <button
            type="button"
            onClick={handleRedo}
            disabled={redoStack.length === 0}
            className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-300 hover:border-slate-700 disabled:opacity-40 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            title="Redo field edit"
          >
            <Redo2 className="w-3.5 h-3.5" /> Redo
          </button>
          <button
            type="button"
            onClick={openVersionHistory}
            className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-300 hover:border-amber-500/50 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <History className="w-3.5 h-3.5 text-amber-500" /> Versions
          </button>
          <button
            type="button"
            onClick={handlePreviewPublic}
            className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-300 hover:border-amber-500/50 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-sky-400" /> Public Preview
          </button>
          <button
            type="button"
            onClick={() => setShareModal(true)}
            className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-300 hover:border-amber-500/50 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Share2 className="w-3.5 h-3.5 text-emerald-400" /> Share Brief
          </button>
          <button
            type="button"
            onClick={() => handleSave('SAVE_DRAFT')}
            disabled={saving}
            className="px-3.5 py-2 rounded-lg border border-slate-700 bg-slate-900 text-xs font-semibold text-white hover:bg-slate-800 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Save className="w-3.5 h-3.5" /> Save Draft
          </button>
          <button
            type="button"
            onClick={() => handleSave('PUBLISH')}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Globe className="w-3.5 h-3.5" /> {saving ? 'Publishing...' : 'Publish Live'}
          </button>
          {profile.publishStatus === 'PUBLISHED' && (
            <button
              type="button"
              onClick={() => handleSave('UNPUBLISH')}
              disabled={saving}
              className="px-3 py-2 rounded-lg border border-rose-500/30 bg-rose-500/10 text-xs text-rose-300 hover:bg-rose-500/20 inline-flex items-center gap-1.5 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Unpublish
            </button>
          )}
        </div>
      </div>

      {/* Truthful Verification Status Banner */}
      <div
        className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
          isVerified
            ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-200'
            : 'bg-amber-950/20 border-amber-500/30 text-amber-200'
        }`}
      >
        <div className="flex items-start gap-3">
          {isVerified ? (
            <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          )}
          <div className="space-y-0.5 text-xs">
            <div className="font-bold text-sm text-white">
              {statusLabels[profile.registrationStatus] || profile.registrationStatus}
            </div>
            <p className="text-slate-300">
              {isVerified
                ? `Documentary verification complete (${verifiedDocsCount} verified document(s) on file). Official numbers respect public visibility toggles.`
                : 'Documentary verification gate active: "Registered – verified" cannot be enabled until at least one official registration document is uploaded and marked VERIFIED by a Legal Reviewer or Super Admin.'}
            </p>
          </div>
        </div>
        <div className="text-xs font-mono text-slate-400 shrink-0 tabular-nums">
          Verified Docs: <span className="text-white font-bold">{verifiedDocsCount}</span>
        </div>
      </div>

      {/* Main Grid: Corporate Identity Form + Visibility & Verification */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left: Core Profile & Registration Fields */}
        <div className="xl:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-500" /> Corporate Identity &amp; Ownership
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="space-y-1.5 text-xs">
              <span className="text-slate-400 font-medium">Registered / Working Company Name</span>
              <input
                type="text"
                value={form.companyName || ''}
                onChange={(e) => updateField('companyName', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-amber-500 focus:outline-none"
              />
            </label>
            <label className="space-y-1.5 text-xs">
              <span className="text-slate-400 font-medium">Public Trade Brand</span>
              <input
                type="text"
                value={form.tradeName || ''}
                onChange={(e) => updateField('tradeName', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-amber-500 focus:outline-none"
              />
            </label>
            <label className="space-y-1.5 text-xs">
              <span className="text-slate-400 font-medium">Founder &amp; Beneficial Owner</span>
              <input
                type="text"
                value={form.founderName || ''}
                onChange={(e) => updateField('founderName', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-amber-500 focus:outline-none"
              />
            </label>
            <label className="space-y-1.5 text-xs">
              <span className="text-slate-400 font-medium">Ownership Percentage (%)</span>
              <input
                type="number"
                min={0}
                max={100}
                value={form.ownershipPercentage ?? 100}
                onChange={(e) => updateField('ownershipPercentage', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white tabular-nums focus:border-amber-500 focus:outline-none"
              />
            </label>
            <label className="space-y-1.5 text-xs sm:col-span-2">
              <span className="text-slate-400 font-medium">Corporate Motto</span>
              <input
                type="text"
                value={form.motto || ''}
                onChange={(e) => updateField('motto', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-amber-500 focus:outline-none"
              />
            </label>
            <label className="space-y-1.5 text-xs">
              <span className="text-slate-400 font-medium">Country</span>
              <input
                type="text"
                value={form.country || ''}
                onChange={(e) => updateField('country', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-amber-500 focus:outline-none"
              />
            </label>
            <label className="space-y-1.5 text-xs">
              <span className="text-slate-400 font-medium">Headquarters City</span>
              <input
                type="text"
                value={form.city || ''}
                onChange={(e) => updateField('city', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-amber-500 focus:outline-none"
              />
            </label>
            <label className="space-y-1.5 text-xs sm:col-span-2">
              <span className="text-slate-400 font-medium flex items-center justify-between">
                <span>Private Street / Quarter Address (Confidential unless enabled)</span>
                <span className="text-[11px] font-mono text-amber-400">
                  {form.isStreetAddressPublic ? 'Publicly Visible' : 'Hidden from Public Site'}
                </span>
              </span>
              <input
                type="text"
                value={form.streetAddress || ''}
                onChange={(e) => updateField('streetAddress', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-amber-500 focus:outline-none"
              />
            </label>
            <label className="space-y-1.5 text-xs">
              <span className="text-slate-400 font-medium">Actual Salaried Employee Count</span>
              <input
                type="number"
                min={0}
                value={form.employeeCount ?? 0}
                onChange={(e) => updateField('employeeCount', Number(e.target.value))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white tabular-nums focus:border-amber-500 focus:outline-none"
              />
            </label>
            <label className="space-y-1.5 text-xs">
              <span className="text-slate-400 font-medium">Headcount Disclosure Note</span>
              <input
                type="text"
                value={form.employeeCountNote || ''}
                onChange={(e) => updateField('employeeCountNote', e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-amber-500 focus:outline-none"
              />
            </label>
          </div>

          {/* Legal Structure & Registration Workflow */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider">Legal Form &amp; Statutory Workflow</h4>
              <button
                type="button"
                onClick={() => setShowTransitionModal(true)}
                className="text-xs text-sky-400 hover:text-sky-300 inline-flex items-center gap-1 cursor-pointer"
              >
                <GitBranch className="w-3.5 h-3.5" /> Initiate Legal Structure Transition (SARL)
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <label className="space-y-1.5 text-xs">
                <span className="text-slate-400 font-medium">Current Legal Structure</span>
                <select
                  value={form.legalStructure || 'INDIVIDUAL_ESTABLISHMENT_PLANNED'}
                  onChange={(e) => updateField('legalStructure', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-amber-500 focus:outline-none"
                >
                  {Object.entries(legalLabels).map(([k, lbl]) => (
                    <option key={k} value={k}>
                      {lbl}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5 text-xs">
                <span className="text-slate-400 font-medium">Registration Workflow Status</span>
                <select
                  value={form.registrationStatus || 'UNREGISTERED'}
                  onChange={(e) => updateField('registrationStatus', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white focus:border-amber-500 focus:outline-none"
                >
                  {Object.entries(statusLabels).map(([k, lbl]) => (
                    <option
                      key={k}
                      value={k}
                      disabled={k === 'REGISTERED_VERIFIED' && verifiedDocsCount === 0}
                    >
                      {lbl}
                      {k === 'REGISTERED_VERIFIED' && verifiedDocsCount === 0 ? ' (Requires verified doc)' : ''}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1.5 text-xs">
                <span className="text-slate-400 font-medium">RCCM / Registration Number (Empty until issued)</span>
                <input
                  type="text"
                  placeholder="Pending formal registration"
                  value={form.registrationNumber || ''}
                  onChange={(e) => updateField('registrationNumber', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </label>

              <label className="space-y-1.5 text-xs">
                <span className="text-slate-400 font-medium">Taxpayer ID / NIU (Cameroon DGI Identifier)</span>
                <input
                  type="text"
                  placeholder="e.g. P030217852934P"
                  value={form.taxpayerNumber || ''}
                  onChange={(e) => updateField('taxpayerNumber', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono focus:border-amber-500 focus:outline-none"
                />
              </label>
            </div>
          </div>
        </div>

        {/* Right: Public Visibility Controls & Exports */}
        <div className="xl:col-span-5 space-y-6">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <EyeOff className="w-4 h-4 text-sky-400" /> Public Disclosure Visibility Controls
            </h3>
            <p className="text-xs text-slate-400">
              Control what appears on the public website and read-only shared briefs. RCCM registration numbers remain suppressed until verified; your active DGI Taxpayer NIU follows your public visibility toggle.
            </p>

            <div className="space-y-2.5">
              {[
                { key: 'isStreetAddressPublic', label: 'Expose Street / Quarter Address (Mbankolo) publicly' },
                { key: 'isRegNumberPublic', label: 'Expose Official Registration Number (RCCM) publicly (once verified)' },
                { key: 'isTaxIdPublic', label: 'Expose Taxpayer ID / NIU publicly' },
                { key: 'isFounderPublic', label: 'Display Founder Name & 100% Ownership Disclosure' },
                { key: 'isEmployeeCountPublic', label: 'Display Verified Employee Headcount Note' },
              ].map((toggle) => (
                <label
                  key={toggle.key}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/70 border border-slate-800 cursor-pointer hover:border-slate-700"
                >
                  <span className="text-xs text-slate-200">{toggle.label}</span>
                  <input
                    type="checkbox"
                    checked={Boolean(form[toggle.key])}
                    onChange={(e) => updateField(toggle.key, e.target.checked)}
                    className="w-4 h-4 accent-amber-500 rounded"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Real Exports Panel */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Download className="w-4 h-4 text-emerald-400" /> Export Corporate Profile
            </h3>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() =>
                  exportCorporatePdf('Business Profile & Legal Status', form.companyName, [
                    {
                      heading: 'Corporate Identity',
                      rows: [
                        ['Company Name', form.companyName || 'Not provided'],
                        ['Founder', form.founderName || 'Not provided'],
                        ['Ownership', `${form.ownershipPercentage ?? 100}%`],
                        ['Motto', form.motto || 'Not provided'],
                        ['Jurisdiction', `${form.city}, ${form.country}`],
                        ['Street Address (Internal)', form.streetAddress || 'Not provided'],
                        ['Salaried Employees', String(form.employeeCount ?? 0)],
                      ],
                    },
                    {
                      heading: 'Registration & Verification',
                      rows: [
                        ['Legal Structure', legalLabels[form.legalStructure] || form.legalStructure],
                        ['Registration Status', statusLabels[form.registrationStatus] || form.registrationStatus],
                        ['RCCM / Reg No.', form.registrationNumber || 'Not provided'],
                        ['Taxpayer ID (NIU)', form.taxpayerNumber || 'Not provided'],
                        ['Verified Docs Count', String(verifiedDocsCount)],
                      ],
                    },
                  ])
                }
                className="px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-xs text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-rose-400" /> Export PDF
              </button>
              <button
                type="button"
                onClick={() =>
                  exportCorporateXlsx(
                    'Business Profile',
                    'madecc-corporate-profile',
                    ['Field', 'Value'],
                    [
                      ['Company Name', form.companyName],
                      ['Founder', form.founderName],
                      ['Ownership %', `${form.ownershipPercentage}%`],
                      ['Legal Structure', legalLabels[form.legalStructure] || form.legalStructure],
                      ['Registration Status', statusLabels[form.registrationStatus] || form.registrationStatus],
                      ['Registration Number', form.registrationNumber || 'Not provided'],
                      ['Taxpayer ID', form.taxpayerNumber || 'Not provided'],
                      ['Country / City', `${form.city}, ${form.country}`],
                      ['Employee Count', String(form.employeeCount ?? 0)],
                    ]
                  )
                }
                className="px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-xs text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> Export Excel (XLSX)
              </button>
              <button
                type="button"
                onClick={() => downloadCorporateServerExport('profile', 'csv')}
                className="px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-xs text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-sky-400" /> Export CSV
              </button>
              <button
                type="button"
                onClick={() => downloadCorporateServerExport('profile', 'json')}
                className="px-3 py-2.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-xs text-slate-200 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" /> Export JSON
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Confidential Registration Documents Upload & Manual Verification Queue */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500" /> Confidential Registration &amp; Compliance Dossier
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Uploaded files are SHA-256 hashed, stored in confidential cloud folders, and strictly hidden from public APIs.
            </p>
          </div>
        </div>

        <form onSubmit={handleUploadDoc} className="grid grid-cols-1 md:grid-cols-6 gap-3 bg-slate-900/60 border border-slate-800 p-4 rounded-xl">
          <input
            type="text"
            placeholder="Document Title (e.g., CFCE Receipt)"
            value={docForm.title}
            onChange={(e) => setDocForm((p) => ({ ...p, title: e.target.value }))}
            className="md:col-span-2 px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-amber-500 focus:outline-none"
          />
          <select
            value={docForm.category}
            onChange={(e) => setDocForm((p) => ({ ...p, category: e.target.value }))}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white focus:border-amber-500 focus:outline-none"
          >
            <option value="REGISTRATION">Registration Certificate</option>
            <option value="TAX">Taxpayer NIU / Attestation</option>
            <option value="FOUNDER_ID">Founder National ID / Passport</option>
            <option value="LICENCE">Sector Licence / Permit</option>
            <option value="COMPLIANCE">Statutory Compliance</option>
          </select>
          <input
            type="text"
            placeholder="Reference / Filing No."
            value={docForm.referenceNumber}
            onChange={(e) => setDocForm((p) => ({ ...p, referenceNumber: e.target.value }))}
            className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-xs text-white font-mono focus:border-amber-500 focus:outline-none"
          />
          <input
            type="file"
            onChange={(e) => setDocForm((p) => ({ ...p, file: e.target.files?.[0] || null }))}
            className="px-2 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300"
          />
          <button
            type="submit"
            disabled={uploadingDoc}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" /> {uploadingDoc ? 'Uploading...' : 'Upload Doc'}
          </button>
        </form>

        {documents.length === 0 ? (
          <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl">
            No registration documents uploaded yet. Upload official registration filings above when obtained.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase font-mono">
                  <th className="py-2.5 px-3">Document</th>
                  <th className="py-2.5 px-3">Category · Ref</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">SHA-256 · Storage</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-900/40">
                    <td className="py-3 px-3 text-white font-medium">{doc.title}</td>
                    <td className="py-3 px-3 text-slate-400">
                      {doc.category} · <span className="font-mono">{doc.referenceNumber || 'Not provided'}</span>
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`font-mono font-bold ${
                          doc.status === 'VERIFIED'
                            ? 'text-emerald-400'
                            : doc.status === 'REJECTED'
                            ? 'text-rose-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {doc.status}
                      </span>
                      {doc.reviewedBy && (
                        <div className="text-[11px] text-slate-500">by {doc.reviewedBy}</div>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono text-[11px] text-slate-500 tabular-nums">
                      {doc.sha256Checksum ? `${doc.sha256Checksum.slice(0, 12)}...` : 'N/A'} · {doc.storageProvider}
                    </td>
                    <td className="py-3 px-3 text-right space-x-2 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleDownloadConfidentialDoc(doc.id)}
                        className="px-2.5 py-1 rounded border border-slate-700 text-slate-200 hover:border-sky-500 cursor-pointer"
                      >
                        View File
                      </button>
                      {capabilities.canVerifyLegal && doc.status !== 'VERIFIED' && (
                        <button
                          type="button"
                          onClick={() => handleReviewDoc(doc.id, 'VERIFIED')}
                          className="px-2.5 py-1 rounded bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Verify
                        </button>
                      )}
                      {capabilities.canVerifyLegal && doc.status !== 'REJECTED' && (
                        <button
                          type="button"
                          onClick={() => handleReviewDoc(doc.id, 'REJECTED')}
                          className="px-2.5 py-1 rounded bg-rose-500/15 border border-rose-500/40 text-rose-300 hover:bg-rose-500/25 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Historical Legal Entities Timeline */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <FileCheck2 className="w-4 h-4 text-amber-500" /> Historical Legal Entities &amp; Transitions (Non-Destructive)
          </h3>
          {onNavigatePublicPreview && (
            <button
              type="button"
              onClick={onNavigatePublicPreview}
              className="text-xs text-amber-400 hover:underline cursor-pointer"
            >
              Open Live Website View
            </button>
          )}
        </div>
        <div className="space-y-2.5">
          {legalEntities.map((ent) => (
            <div
              key={ent.id}
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${
                ent.isCurrent ? 'bg-slate-900 border-amber-500/40' : 'bg-slate-900/40 border-slate-800 opacity-75'
              }`}
            >
              <div className="space-y-1">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <span>{ent.entityName}</span>
                  <span className="font-mono text-amber-400">
                    {ent.isCurrent ? 'CURRENT ENTITY' : 'HISTORICAL / SUPERSEDED'}
                  </span>
                </div>
                <div className="text-xs text-slate-400">
                  {legalLabels[ent.legalForm] || ent.legalForm} · Jurisdiction: {ent.jurisdiction} · Status: {ent.status}
                </div>
                {ent.transitionNotes && <div className="text-[11px] text-slate-500">{ent.transitionNotes}</div>}
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                Created: {new Date(ent.createdAt).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Public Preview Drawer / Modal */}
      {publicPreviewData && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Public Sanitized Disclosure Preview</h3>
              <button type="button" onClick={() => setPublicPreviewData(null)} className="text-xs text-slate-400 hover:text-white cursor-pointer">
                Close
              </button>
            </div>
            <div className="space-y-2 text-xs text-slate-300">
              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-200 font-semibold">
                {publicPreviewData.statusHeadline}
              </div>
              <div>Company: <span className="text-white font-semibold">{publicPreviewData.companyName}</span></div>
              <div>Public Location: <span className="text-white">{publicPreviewData.displayLocation}</span></div>
              <div>Street Address Exposed: <span className="font-mono text-white">{publicPreviewData.streetAddress || 'Hidden (Private)'}</span></div>
              <div>Founder: <span className="text-white">{publicPreviewData.founderName || 'Hidden'}</span> ({publicPreviewData.ownershipPercentage ?? 100}%)</div>
              <div>RCCM Public: <span className="font-mono text-white">{publicPreviewData.registrationNumber || 'Suppressed until verified'}</span></div>
              <div>NIU Public: <span className="font-mono text-white">{publicPreviewData.taxpayerNumber || 'Hidden (Private)'}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* Version History & Diff Modal */}
      {showVersions && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white">Version History &amp; Non-Destructive Restore</h3>
              <button type="button" onClick={() => setShowVersions(false)} className="text-xs text-slate-400 hover:text-white cursor-pointer">
                Close
              </button>
            </div>
            <div className="space-y-3">
              {versions.map((v) => (
                <div key={v.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
                  <div className="space-y-1 text-xs">
                    <div className="text-white font-bold font-mono">
                      v{v.versionNumber} · {v.changeSummary}
                    </div>
                    <div className="text-slate-400">
                      By {v.createdBy} on {new Date(v.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => setCompareVersion(v)}
                      className="px-2.5 py-1 rounded border border-slate-700 text-xs text-slate-300 hover:border-amber-500 cursor-pointer"
                    >
                      Inspect JSON
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRestoreVersion(v.id)}
                      className="px-2.5 py-1 rounded bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
                    >
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {compareVersion && (
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                <div className="text-amber-400 font-bold mb-1">Snapshot v{compareVersion.versionNumber}</div>
                <pre>{JSON.stringify(compareVersion.snapshotJson, null, 2)}</pre>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legal Structure Transition Modal */}
      {showTransitionModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <form onSubmit={handleLegalTransition} className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-base font-bold text-white">Transition Legal Structure (Historical Record Preserved)</h3>
            <p className="text-xs text-slate-400">
              Existing Individual Establishment records remain intact with an end timestamp while initiating the new legal structure.
            </p>
            <label className="block space-y-1 text-xs">
              <span className="text-slate-400">Target Entity Name</span>
              <input
                type="text"
                required
                value={transitionForm.entityName}
                onChange={(e) => setTransitionForm((p) => ({ ...p, entityName: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
              />
            </label>
            <label className="block space-y-1 text-xs">
              <span className="text-slate-400">Target Legal Structure</span>
              <select
                value={transitionForm.targetLegalForm}
                onChange={(e) => setTransitionForm((p) => ({ ...p, targetLegalForm: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
              >
                <option value="SARL">MADECC GROUP SARL (OHADA Limited Liability)</option>
                <option value="SUARL">SUARL (Single-Shareholder LLC)</option>
                <option value="SA">Société Anonyme (SA)</option>
              </select>
            </label>
            <label className="block space-y-1 text-xs">
              <span className="text-slate-400">Transition Notes</span>
              <textarea
                rows={3}
                value={transitionForm.transitionNotes}
                onChange={(e) => setTransitionForm((p) => ({ ...p, transitionNotes: e.target.value }))}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
              />
            </label>
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setShowTransitionModal(false)} className="px-3 py-2 text-xs text-slate-400 cursor-pointer">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer">
                Create Transition Record
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Controlled Share Modal */}
      {shareModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Create Controlled Share Link</h3>
              <button type="button" onClick={() => { setShareModal(false); setShareResult(null); }} className="text-xs text-slate-400 cursor-pointer">
                Close
              </button>
            </div>
            <p className="text-xs text-slate-400">
              Confidential documents, unverified registration numbers, and Mbankolo street address are automatically excluded from external shares.
            </p>
            <form onSubmit={handleCreateShare} className="space-y-3 text-xs">
              <label className="block space-y-1">
                <span className="text-slate-400">Expires In (Days)</span>
                <input
                  type="number"
                  min={1}
                  max={365}
                  value={shareExpiresDays}
                  onChange={(e) => setShareExpiresDays(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white tabular-nums"
                />
              </label>
              <label className="block space-y-1">
                <span className="text-slate-400">Recipient Email (Optional tracking)</span>
                <input
                  type="email"
                  value={shareRecipient}
                  onChange={(e) => setShareRecipient(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                />
              </label>
              <button type="submit" className="w-full py-2.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer">
                Generate Expiring Read-Only Link
              </button>
            </form>
            {shareResult && (
              <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 space-y-2 text-xs">
                <div className="text-emerald-300 font-semibold">Share Link Generated</div>
                <div className="font-mono text-[11px] break-all text-white">{shareResult.path}</div>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard?.writeText(shareResult.path);
                    showToast('Share URL copied to clipboard', 'success');
                  }}
                  className="inline-flex items-center gap-1 text-amber-400 hover:underline cursor-pointer"
                >
                  <Copy className="w-3.5 h-3.5" /> Copy URL
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
