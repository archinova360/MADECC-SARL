import React, { useState, useEffect, useCallback } from 'react';
import {
  Layers,
  Plus,
  Save,
  Globe,
  Archive,
  RefreshCw,
  ShieldAlert,
  CheckCircle2,
  History,
  Download,
  FileSpreadsheet,
  Search,
  ChevronDown,
  ChevronRight,
  Undo2,
  Redo2,
  Eye,
  Upload,
  Trash2,
  Edit3,
  Share2,
  Copy,
  ArrowUp,
  ArrowDown,
  FileText,
  X,
} from 'lucide-react';
import {
  corporateFetch,
  downloadCorporateServerExport,
  exportCorporatePdf,
  exportCorporateXlsx,
} from '../lib/corporateApi.ts';
import { useToast } from './Toast.tsx';

const OPERATIONAL_STATUSES = [
  { value: 'PROPOSED', label: 'Proposed' },
  { value: 'UNDER_DEVELOPMENT', label: 'Under development' },
  { value: 'UNDER_FEASIBILITY', label: 'Under feasibility assessment' },
  { value: 'SEEKING_INVESTMENT', label: 'Seeking investment' },
  { value: 'PARTNERSHIP_DISCUSSIONS', label: 'Partnership discussions' },
  { value: 'AWAITING_REGULATORY_APPROVAL', label: 'Awaiting regulatory approval' },
  { value: 'APPROVED_FOR_OPERATION', label: 'Approved for operation' },
  { value: 'OPERATIONAL', label: 'Operational' },
  { value: 'TEMPORARILY_INACTIVE', label: 'Temporarily inactive' },
];

const PUBLISH_STATUSES = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'IN_REVIEW', label: 'Pending approval' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'UNPUBLISHED', label: 'Unpublished' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export const BusinessDivisionsHub: React.FC = () => {
  const { showToast } = useToast();
  const [divisions, setDivisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [serviceSearch, setServiceSearch] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const [newDivModal, setNewDivModal] = useState(false);
  const [newDiv, setNewDiv] = useState({
    code: '',
    name: '',
    category: '',
    summary: '',
    country: 'Republic of Cameroon',
    currency: 'XAF',
    regulatoryBody: '',
    licenceRequired: false,
  });

  const [newServiceForm, setNewServiceForm] = useState({
    name: '',
    categoryGroup: '',
    shortDescription: '',
    pricingModel: 'Custom quotation / milestone-based',
  });

  // Service Editor Modal state
  const [editingService, setEditingService] = useState<any>(null);
  const [svcUndo, setSvcUndo] = useState<any[]>([]);
  const [svcRedo, setSvcRedo] = useState<any[]>([]);
  const [savingService, setSavingService] = useState(false);

  // Version History Modal (DIVISION or SERVICE)
  const [versionsModal, setVersionsModal] = useState<{ entityType: string; title: string; list: any[] } | null>(null);

  // Preview Modal
  const [previewModal, setPreviewModal] = useState(false);

  // Share Modal
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const loadDivisions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await corporateFetch(`/api/corporate/divisions?includeArchived=${includeArchived}`);
      const list = res.divisions || [];
      setDivisions(list);
      if (list.length > 0 && (!selectedId || !list.some((d: any) => d.id === selectedId))) {
        setSelectedId(list[0].id);
        setEditForm(list[0]);
      } else if (selectedId) {
        const match = list.find((d: any) => d.id === selectedId);
        if (match) setEditForm(match);
      }
      setUndoStack([]);
      setRedoStack([]);
    } catch (err: any) {
      showToast(err.message || 'Failed to load business divisions', 'error');
    } finally {
      setLoading(false);
    }
  }, [includeArchived, selectedId, showToast]);

  useEffect(() => {
    loadDivisions();
  }, [loadDivisions]);

  const updateDivField = (key: string, value: any) => {
    if (!editForm) return;
    setUndoStack((prev) => [...prev.slice(-20), editForm]);
    setRedoStack([]);
    setEditForm((p: any) => ({ ...p, [key]: value }));
  };

  const handleDivUndo = () => {
    if (undoStack.length === 0) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, editForm]);
    setUndoStack((u) => u.slice(0, -1));
    setEditForm(prev);
  };

  const handleDivRedo = () => {
    if (redoStack.length === 0) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, editForm]);
    setRedoStack((r) => r.slice(0, -1));
    setEditForm(next);
  };

  const handleSelect = (div: any) => {
    setSelectedId(div.id);
    setEditForm({ ...div });
    setUndoStack([]);
    setRedoStack([]);
  };

  const handleSaveDivision = async (overridePublishStatus?: string) => {
    if (!editForm) return;
    setSaving(true);
    try {
      const payload = {
        ...editForm,
        publishStatus: overridePublishStatus || editForm.publishStatus,
        visibilityPublic:
          overridePublishStatus === 'UNPUBLISHED'
            ? false
            : overridePublishStatus === 'PUBLISHED'
            ? true
            : editForm.visibilityPublic,
        operatingCountries:
          typeof editForm.operatingCountries === 'string'
            ? editForm.operatingCountries.split(',').map((s: string) => s.trim()).filter(Boolean)
            : editForm.operatingCountries,
      };
      const res = await corporateFetch(`/api/corporate/divisions/${editForm.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      showToast(`Saved ${res.division.name} (${res.division.publishStatus})`, 'success');
      await loadDivisions();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDivisionMediaUpload = async (file: File | null, kind: 'image' | 'document') => {
    if (!file || !editForm) return;
    setUploadingMedia(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('kind', kind);
      fd.append('title', file.name);
      await corporateFetch(`/api/corporate/divisions/${editForm.id}/upload-media`, {
        method: 'POST',
        body: fd,
      });
      showToast(kind === 'image' ? 'Division image uploaded to cloud storage' : 'Supporting document uploaded', 'success');
      await loadDivisions();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleArchiveDivision = async (div: any, archive: boolean) => {
    try {
      await corporateFetch(`/api/corporate/divisions/${div.id}/archive`, {
        method: 'PATCH',
        body: JSON.stringify({ archive }),
      });
      showToast(archive ? `Archived ${div.name}` : `Restored ${div.name}`, 'success');
      await loadDivisions();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCreateDivision = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await corporateFetch('/api/corporate/divisions', {
        method: 'POST',
        body: JSON.stringify(newDiv),
      });
      showToast(`Created ${res.division.name}`, 'success');
      setNewDivModal(false);
      setNewDiv({
        code: '',
        name: '',
        category: '',
        summary: '',
        country: 'Republic of Cameroon',
        currency: 'XAF',
        regulatoryBody: '',
        licenceRequired: false,
      });
      setSelectedId(res.division.id);
      await loadDivisions();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAddService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    try {
      await corporateFetch(`/api/corporate/divisions/${editForm.id}/services`, {
        method: 'POST',
        body: JSON.stringify({
          ...newServiceForm,
          operationalStatus: editForm.operationalStatus || 'PROPOSED',
          publishStatus: 'DRAFT',
          currency: editForm.currency || 'XAF',
          displayOrder: (editForm.services?.length || 0) + 1,
        }),
      });
      showToast('Added new service as Draft', 'success');
      setNewServiceForm({ name: '', categoryGroup: '', shortDescription: '', pricingModel: 'Custom quotation / milestone-based' });
      await loadDivisions();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const updateEditingServiceField = (key: string, val: any) => {
    if (!editingService) return;
    setSvcUndo((p) => [...p.slice(-20), editingService]);
    setSvcRedo([]);
    setEditingService((p: any) => ({ ...p, [key]: val }));
  };

  const handleSaveService = async (overridePublishStatus?: string) => {
    if (!editingService) return;
    setSavingService(true);
    try {
      const nextPub = overridePublishStatus || editingService.publishStatus;
      const res = await corporateFetch(`/api/corporate/services/${editingService.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...editingService,
          publishStatus: nextPub,
          visibilityPublic: nextPub === 'UNPUBLISHED' ? false : nextPub === 'PUBLISHED' ? true : editingService.visibilityPublic,
        }),
      });
      showToast(`Service updated (${res.service.publishStatus})`, 'success');
      setEditingService(res.service);
      setSvcUndo([]);
      setSvcRedo([]);
      await loadDivisions();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSavingService(false);
    }
  };

  const handleServiceMediaUpload = async (file: File | null, kind: 'image' | 'document') => {
    if (!file || !editingService) return;
    setUploadingMedia(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('kind', kind);
      fd.append('title', file.name);
      const res = await corporateFetch(`/api/corporate/services/${editingService.id}/upload-media`, {
        method: 'POST',
        body: fd,
      });
      setEditingService(res.service);
      showToast(kind === 'image' ? 'Service image uploaded to cloud storage' : 'Service document uploaded', 'success');
      await loadDivisions();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleSafeDeleteService = async (svc: any) => {
    try {
      await corporateFetch(`/api/corporate/services/${svc.id}`, { method: 'DELETE' });
      showToast(`Archived / safely removed service "${svc.name}"`, 'success');
      setEditingService(null);
      await loadDivisions();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleReorderService = async (svc: any, delta: number) => {
    try {
      await corporateFetch(`/api/corporate/services/${svc.id}`, {
        method: 'PUT',
        body: JSON.stringify({ displayOrder: Math.max(1, Number(svc.displayOrder || 1) + delta), changeSummary: 'Adjusted display order' }),
      });
      await loadDivisions();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const openVersions = async (entityType: 'DIVISION' | 'SERVICE', entityId: number, title: string) => {
    try {
      const res = await corporateFetch(`/api/corporate/versions/${entityType}/${entityId}`);
      setVersionsModal({ entityType, title, list: res.versions || [] });
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const restoreVersion = async (versionId: number) => {
    try {
      await corporateFetch(`/api/corporate/versions/${versionId}/restore`, { method: 'POST' });
      showToast('Version restored non-destructively', 'success');
      setVersionsModal(null);
      setEditingService(null);
      await loadDivisions();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleShareEntity = async (entityType: 'DIVISION' | 'SERVICE', entityId: number, title: string) => {
    try {
      const res = await corporateFetch('/api/corporate/shares', {
        method: 'POST',
        body: JSON.stringify({ entityType, entityId, title, allowPublic: true, expiresInDays: 14 }),
      });
      setShareUrl(`${window.location.origin}${res.sharePath}`);
      showToast('Controlled read-only share link created', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filteredDivisions = divisions.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.name.toLowerCase().includes(q) ||
      d.code.toLowerCase().includes(q) ||
      d.category.toLowerCase().includes(q) ||
      d.summary.toLowerCase().includes(q) ||
      (d.services || []).some((s: any) => s.name.toLowerCase().includes(q))
    );
  });

  const filteredServices = (editForm?.services || []).filter((svc: any) => {
    if (!serviceSearch.trim()) return true;
    const q = serviceSearch.toLowerCase();
    return (
      svc.name.toLowerCase().includes(q) ||
      (svc.categoryGroup || '').toLowerCase().includes(q) ||
      (svc.shortDescription || '').toLowerCase().includes(q)
    );
  });

  const totalServicesCount = divisions.reduce((acc, d) => acc + (d.services?.length || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-amber-500 uppercase font-bold">
            Multi-Sector Architecture · {divisions.length} Divisions · {totalServicesCount} Services
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5">
            Manage Business Divisions &amp; Services
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Add/edit divisions &amp; itemized services, control independent Business &amp; Publication statuses, upload cloud images/docs, preview, share, and restore versions.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setIncludeArchived(!includeArchived)}
            className={`px-3 py-2 rounded-lg border text-xs cursor-pointer ${
              includeArchived ? 'border-amber-500 bg-amber-500/10 text-amber-300' : 'border-slate-800 bg-slate-900 text-slate-300'
            }`}
          >
            {includeArchived ? 'Showing Archived' : 'Show Archived'}
          </button>
          <button
            type="button"
            onClick={() =>
              exportCorporatePdf(
                'Business Divisions & Services Directory',
                `All MADECC Group Business Divisions (${divisions.length}) & Services (${totalServicesCount})`,
                divisions.map((d) => ({
                  heading: `${d.code} — ${d.name} (${d.services?.length || 0} services)`,
                  rows: [
                    ['Business Status', d.operationalStatus],
                    ['Publication Status', d.publishStatus],
                    ['Summary', d.summary],
                    ['Regulatory Body', d.regulatoryBody || 'Not provided'],
                    ['Services List', (d.services || []).map((s: any) => s.name).join('; ') || 'None'],
                  ],
                }))
              )
            }
            className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-200 hover:border-amber-500/50 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-rose-400" /> PDF
          </button>
          <button
            type="button"
            onClick={() => {
              const flatServices = divisions.flatMap((d) =>
                (d.services || []).map((s: any) => [d.code, d.name, s.categoryGroup || 'General', s.name, s.operationalStatus, s.publishStatus])
              );
              exportCorporateXlsx(
                'Divisions & Services',
                'madecc-divisions-services',
                ['Division Code', 'Division Name', 'Sub-Category', 'Service Name', 'Business Status', 'Publish Status'],
                flatServices
              );
            }}
            className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-200 hover:border-amber-500/50 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> XLSX
          </button>
          <button
            type="button"
            onClick={() => downloadCorporateServerExport('services', 'csv')}
            className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-200 hover:border-amber-500/50 cursor-pointer"
          >
            Services CSV
          </button>
          <button
            type="button"
            onClick={() => setNewDivModal(true)}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> New Division
          </button>
        </div>
      </div>

      {shareUrl && (
        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs flex items-center justify-between gap-3">
          <div className="font-mono text-emerald-200 break-all">Share URL: {shareUrl}</div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(shareUrl);
                showToast('Share URL copied', 'success');
              }}
              className="text-amber-400 inline-flex items-center gap-1 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" /> Copy
            </button>
            <button type="button" onClick={() => setShareUrl(null)} className="text-slate-400 hover:text-white cursor-pointer">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left List */}
        <div className="xl:col-span-4 bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search divisions or services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white focus:border-amber-500 focus:outline-none"
            />
          </div>

          {loading ? (
            <div className="p-6 text-xs text-slate-400 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-500" /> Loading divisions...
            </div>
          ) : (
            <div className="space-y-2 max-h-[820px] overflow-y-auto pr-1">
              {filteredDivisions.map((div) => {
                const active = selectedId === div.id;
                return (
                  <button
                    key={div.id}
                    type="button"
                    onClick={() => handleSelect(div)}
                    className={`w-full text-left p-3.5 rounded-xl border transition-colors cursor-pointer ${
                      active ? 'bg-slate-900 border-amber-500' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                      <span className="text-amber-500 font-bold">{div.code}</span>
                      <span className={div.publishStatus === 'PUBLISHED' ? 'text-emerald-400' : 'text-slate-400'}>
                        {div.publishStatus}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-white flex items-center justify-between gap-2">
                      <span>{div.name}</span>
                      {active ? <ChevronDown className="w-3.5 h-3.5 text-amber-400 shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500 shrink-0" />}
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1">
                      {div.operationalStatus} · {div.services?.length || 0} service(s)
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Detail Editor */}
        <div className="xl:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5">
          {!editForm ? (
            <div className="text-xs text-slate-500 p-8 text-center">Select a division from the left list to edit.</div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="text-xs font-mono text-slate-400">
                    {editForm.code} · v{editForm.version} · Publish: <span className="text-emerald-400">{editForm.publishStatus}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white">{editForm.name}</h3>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleDivUndo}
                    disabled={undoStack.length === 0}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-300 disabled:opacity-40 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Undo2 className="w-3.5 h-3.5" /> Undo
                  </button>
                  <button
                    type="button"
                    onClick={handleDivRedo}
                    disabled={redoStack.length === 0}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-300 disabled:opacity-40 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Redo2 className="w-3.5 h-3.5" /> Redo
                  </button>
                  <button
                    type="button"
                    onClick={() => setPreviewModal(true)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-sky-300 hover:border-sky-500/50 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" /> Preview
                  </button>
                  <button
                    type="button"
                    onClick={() => handleShareEntity('DIVISION', editForm.id, editForm.name)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-emerald-300 hover:border-emerald-500/50 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </button>
                  <button
                    type="button"
                    onClick={() => openVersions('DIVISION', editForm.id, editForm.name)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-300 hover:border-amber-500/50 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 text-amber-400" /> Versions
                  </button>
                  <button
                    type="button"
                    onClick={() => handleArchiveDivision(editForm, !editForm.archivedAt)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-300 hover:border-rose-500/50 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5" /> {editForm.archivedAt ? 'Restore' : 'Archive'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveDivision('DRAFT')}
                    disabled={saving}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Draft
                  </button>
                  {editForm.publishStatus === 'PUBLISHED' && (
                    <button
                      type="button"
                      onClick={() => handleSaveDivision('UNPUBLISHED')}
                      disabled={saving}
                      className="px-2.5 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 text-xs text-rose-300 cursor-pointer"
                    >
                      Unpublish
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSaveDivision('PUBLISHED')}
                    disabled={saving}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5" /> {editForm.publishStatus === 'UNPUBLISHED' ? 'Republish' : 'Publish'}
                  </button>
                </div>
              </div>

              {editForm.licenceRequired && editForm.licenceStatus !== 'APPROVED' && (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Regulated Sector Gate:</strong> This division requires licensing from{' '}
                    <span className="font-mono">{editForm.regulatoryBody || 'statutory regulators'}</span> before setting operational status to OPERATIONAL.
                  </div>
                </div>
              )}

              {/* Image + Core Fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-slate-400">Division Name</span>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => updateDivField('name', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-slate-400">Business Operational Status (Independent)</span>
                  <select
                    value={editForm.operationalStatus || 'PROPOSED'}
                    onChange={(e) => updateDivField('operationalStatus', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  >
                    {OPERATIONAL_STATUSES.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-slate-400">Publication Status (Independent)</span>
                  <select
                    value={editForm.publishStatus || 'PUBLISHED'}
                    onChange={(e) => updateDivField('publishStatus', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  >
                    {PUBLISH_STATUSES.map((ps) => (
                      <option key={ps.value} value={ps.value}>
                        {ps.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-slate-400">Category / Sector Tag</span>
                  <input
                    type="text"
                    value={editForm.category || ''}
                    onChange={(e) => updateDivField('category', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-slate-400">Display Order</span>
                  <input
                    type="number"
                    min={1}
                    value={editForm.displayOrder ?? 1}
                    onChange={(e) => updateDivField('displayOrder', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </label>

                <label className="space-y-1 sm:col-span-2">
                  <span className="text-slate-400 flex items-center justify-between">
                    <span>Professional Division Image URL</span>
                    <label className="text-amber-400 hover:underline cursor-pointer inline-flex items-center gap-1">
                      <Upload className="w-3 h-3" /> {uploadingMedia ? 'Uploading...' : 'Upload / Replace Image (Cloud)'}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleDivisionMediaUpload(e.target.files?.[0] || null, 'image')}
                      />
                    </label>
                  </span>
                  <div className="flex items-center gap-3">
                    {editForm.imageUrl && (
                      <img src={editForm.imageUrl} alt={editForm.name} className="w-16 h-10 object-cover rounded border border-slate-700 shrink-0" />
                    )}
                    <input
                      type="text"
                      value={editForm.imageUrl || ''}
                      onChange={(e) => updateDivField('imageUrl', e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white text-[11px]"
                    />
                  </div>
                </label>

                <label className="space-y-1 sm:col-span-2">
                  <span className="text-slate-400">Public Summary</span>
                  <textarea
                    rows={2}
                    value={editForm.summary || ''}
                    onChange={(e) => updateDivField('summary', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </label>

                <label className="space-y-1 sm:col-span-2">
                  <span className="text-slate-400">Full Scope Description</span>
                  <textarea
                    rows={3}
                    value={editForm.fullDescription || ''}
                    onChange={(e) => updateDivField('fullDescription', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </label>

                <label className="space-y-1 sm:col-span-2">
                  <span className="text-slate-400">Investment &amp; Partnership Opportunity Note</span>
                  <textarea
                    rows={2}
                    value={editForm.investmentInfo || ''}
                    onChange={(e) => updateDivField('investmentInfo', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </label>

                <label className="space-y-1 sm:col-span-2">
                  <span className="text-slate-400">Regulatory / Compliance Notice</span>
                  <textarea
                    rows={2}
                    value={editForm.complianceDisclaimer || ''}
                    onChange={(e) => updateDivField('complianceDisclaimer', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </label>

                {/* Supporting Documents */}
                <div className="sm:col-span-2 p-3 rounded-xl bg-slate-900/50 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-300 font-bold flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-400" /> Supporting Division Documents ({(editForm.documentsJson || []).length})
                    </span>
                    <label className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer">
                      <Upload className="w-3 h-3" /> Upload Supporting Doc
                      <input
                        type="file"
                        className="hidden"
                        onChange={(e) => handleDivisionMediaUpload(e.target.files?.[0] || null, 'document')}
                      />
                    </label>
                  </div>
                  {(editForm.documentsJson || []).length > 0 && (
                    <div className="space-y-1">
                      {(editForm.documentsJson || []).map((doc: any, i: number) => (
                        <div key={doc.id || i} className="flex items-center justify-between text-[11px] bg-slate-950 p-2 rounded border border-slate-800">
                          <span className="text-slate-200 truncate">{doc.title || doc.fileName}</span>
                          <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:underline inline-flex items-center gap-1 shrink-0">
                            <Download className="w-3 h-3" /> Download
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editForm.visibilityPublic)}
                    onChange={(e) => updateDivField('visibilityPublic', e.target.checked)}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span>Visible on Public Website</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editForm.licenceRequired)}
                    onChange={(e) => updateDivField('licenceRequired', e.target.checked)}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span>Require Statutory Licence Before Operational Status</span>
                </label>
              </div>

              {/* Division Sub-Services Full Management */}
              <div className="pt-5 border-t border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-2">
                    <Layers className="w-3.5 h-3.5" /> Itemized Division Services ({editForm.services?.length || 0})
                  </h4>
                  <input
                    type="text"
                    placeholder="Filter services in this division..."
                    value={serviceSearch}
                    onChange={(e) => setServiceSearch(e.target.value)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white sm:w-64"
                  />
                </div>

                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {filteredServices.map((svc: any) => (
                    <div key={svc.id} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                          <span className="truncate">{svc.name}</span>
                          {svc.categoryGroup && (
                            <span className="text-[10px] font-mono text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded shrink-0">
                              {svc.categoryGroup}
                            </span>
                          )}
                        </div>
                        <p className="text-slate-400 text-[11px] line-clamp-1">{svc.shortDescription}</p>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Order #{svc.displayOrder} · Business: {svc.operationalStatus} · Publish: <span className={svc.publishStatus === 'PUBLISHED' ? 'text-emerald-400' : 'text-amber-400'}>{svc.publishStatus}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => handleReorderService(svc, -1)}
                          title="Move Up"
                          className="p-1.5 rounded border border-slate-800 bg-slate-950 text-slate-400 hover:text-white cursor-pointer"
                        >
                          <ArrowUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleReorderService(svc, 1)}
                          title="Move Down"
                          className="p-1.5 rounded border border-slate-800 bg-slate-950 text-slate-400 hover:text-white cursor-pointer"
                        >
                          <ArrowDown className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingService({ ...svc });
                            setSvcUndo([]);
                            setSvcRedo([]);
                          }}
                          className="px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-white font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3 text-amber-400" /> Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => openVersions('SERVICE', svc.id, svc.name)}
                          title="Version History"
                          className="p-1.5 rounded border border-slate-800 bg-slate-950 text-slate-300 hover:text-amber-400 cursor-pointer"
                        >
                          <History className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSafeDeleteService(svc)}
                          title="Archive / Safe Delete Service"
                          className="p-1.5 rounded border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Service Form */}
                <form onSubmit={handleAddService} className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80">
                  <input
                    type="text"
                    required
                    placeholder="New service title"
                    value={newServiceForm.name}
                    onChange={(e) => setNewServiceForm((p) => ({ ...p, name: e.target.value }))}
                    className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="Sub-category (optional)"
                    value={newServiceForm.categoryGroup}
                    onChange={(e) => setNewServiceForm((p) => ({ ...p, categoryGroup: e.target.value }))}
                    className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Short truthful description"
                    value={newServiceForm.shortDescription}
                    onChange={(e) => setNewServiceForm((p) => ({ ...p, shortDescription: e.target.value }))}
                    className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-xs font-bold text-slate-950 inline-flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Service
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Edit Individual Service Modal */}
      {editingService && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 text-xs max-h-[90vh] overflow-y-auto">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
              <div>
                <div className="text-[11px] font-mono text-amber-500">SERVICE EDITOR · v{editingService.version || 1}</div>
                <h3 className="text-base font-bold text-white">{editingService.name}</h3>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  disabled={svcUndo.length === 0}
                  onClick={() => {
                    const prev = svcUndo[svcUndo.length - 1];
                    setSvcRedo((r) => [...r, editingService]);
                    setSvcUndo((u) => u.slice(0, -1));
                    setEditingService(prev);
                  }}
                  className="px-2 py-1 rounded border border-slate-800 text-slate-300 disabled:opacity-40 cursor-pointer"
                >
                  Undo
                </button>
                <button
                  type="button"
                  disabled={svcRedo.length === 0}
                  onClick={() => {
                    const nxt = svcRedo[svcRedo.length - 1];
                    setSvcUndo((u) => [...u, editingService]);
                    setSvcRedo((r) => r.slice(0, -1));
                    setEditingService(nxt);
                  }}
                  className="px-2 py-1 rounded border border-slate-800 text-slate-300 disabled:opacity-40 cursor-pointer"
                >
                  Redo
                </button>
                <button
                  type="button"
                  onClick={() => handleShareEntity('SERVICE', editingService.id, editingService.name)}
                  className="px-2.5 py-1 rounded border border-slate-800 text-emerald-300 cursor-pointer"
                >
                  Share
                </button>
                <button
                  type="button"
                  onClick={() => openVersions('SERVICE', editingService.id, editingService.name)}
                  className="px-2.5 py-1 rounded border border-slate-800 text-amber-300 cursor-pointer"
                >
                  Versions
                </button>
                <button type="button" onClick={() => setEditingService(null)} className="p-1 text-slate-400 hover:text-white cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="space-y-1 sm:col-span-2">
                <span className="text-slate-400">Service Name</span>
                <input
                  type="text"
                  value={editingService.name || ''}
                  onChange={(e) => updateEditingServiceField('name', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                />
              </label>

              <label className="space-y-1">
                <span className="text-slate-400">Sub-Category / Group</span>
                <input
                  type="text"
                  value={editingService.categoryGroup || ''}
                  onChange={(e) => updateEditingServiceField('categoryGroup', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                />
              </label>

              <label className="space-y-1">
                <span className="text-slate-400">Display Order</span>
                <input
                  type="number"
                  value={editingService.displayOrder ?? 1}
                  onChange={(e) => updateEditingServiceField('displayOrder', Number(e.target.value))}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                />
              </label>

              <label className="space-y-1">
                <span className="text-slate-400">Business Status (Independent)</span>
                <select
                  value={editingService.operationalStatus || 'PROPOSED'}
                  onChange={(e) => updateEditingServiceField('operationalStatus', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                >
                  {OPERATIONAL_STATUSES.map((st) => (
                    <option key={st.value} value={st.value}>
                      {st.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1">
                <span className="text-slate-400">Publication Status (Independent)</span>
                <select
                  value={editingService.publishStatus || 'DRAFT'}
                  onChange={(e) => updateEditingServiceField('publishStatus', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                >
                  {PUBLISH_STATUSES.map((ps) => (
                    <option key={ps.value} value={ps.value}>
                      {ps.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="text-slate-400">Short Description</span>
                <textarea
                  rows={2}
                  value={editingService.shortDescription || ''}
                  onChange={(e) => updateEditingServiceField('shortDescription', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="text-slate-400">Full Scope Description</span>
                <textarea
                  rows={3}
                  value={editingService.fullDescription || ''}
                  onChange={(e) => updateEditingServiceField('fullDescription', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                />
              </label>

              <label className="space-y-1 sm:col-span-2">
                <span className="text-slate-400">Investment / Partnership Opportunity Details</span>
                <input
                  type="text"
                  value={editingService.investmentInfo || ''}
                  onChange={(e) => updateEditingServiceField('investmentInfo', e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                />
              </label>

              <div className="sm:col-span-2 flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <label className="text-amber-400 hover:underline cursor-pointer inline-flex items-center gap-1">
                  <Upload className="w-3.5 h-3.5" /> Upload Service Image (Cloud)
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => handleServiceMediaUpload(e.target.files?.[0] || null, 'image')}
                  />
                </label>
                <label className="text-sky-400 hover:underline cursor-pointer inline-flex items-center gap-1">
                  <FileText className="w-3.5 h-3.5" /> Upload Service Spec / Doc
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleServiceMediaUpload(e.target.files?.[0] || null, 'document')}
                  />
                </label>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => handleSafeDeleteService(editingService)}
                className="px-3 py-2 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 font-semibold cursor-pointer"
              >
                Safe Delete / Archive
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={savingService}
                  onClick={() => handleSaveService('DRAFT')}
                  className="px-3 py-2 rounded-lg border border-slate-700 bg-slate-900 text-white font-semibold cursor-pointer"
                >
                  Save Draft
                </button>
                {editingService.publishStatus === 'PUBLISHED' && (
                  <button
                    type="button"
                    disabled={savingService}
                    onClick={() => handleSaveService('UNPUBLISHED')}
                    className="px-3 py-2 rounded-lg border border-rose-500/40 bg-rose-500/10 text-rose-300 cursor-pointer"
                  >
                    Unpublish
                  </button>
                )}
                <button
                  type="button"
                  disabled={savingService}
                  onClick={() => handleSaveService('PUBLISHED')}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold cursor-pointer"
                >
                  {editingService.publishStatus === 'UNPUBLISHED' ? 'Republish' : 'Publish Live'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewModal && editForm && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-mono text-amber-500">PUBLIC CARD PREVIEW</span>
              <button type="button" onClick={() => setPreviewModal(false)} className="text-xs text-slate-400 cursor-pointer">
                Close
              </button>
            </div>
            {editForm.imageUrl && <img src={editForm.imageUrl} alt={editForm.name} className="w-full h-40 object-cover rounded-xl" />}
            <div className="text-lg font-bold text-white">{editForm.name}</div>
            <p className="text-xs text-slate-300">{editForm.summary}</p>
            {editForm.complianceDisclaimer && (
              <div className="p-2.5 rounded-lg bg-amber-950/40 border border-amber-500/30 text-[11px] text-amber-200">
                {editForm.complianceDisclaimer}
              </div>
            )}
            <div className="text-xs text-slate-400 font-mono">
              Business: {editForm.operationalStatus} | Publish: {editForm.publishStatus} | Services: {editForm.services?.length || 0}
            </div>
          </div>
        </div>
      )}

      {/* Create New Division Modal */}
      {newDivModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <form onSubmit={handleCreateDivision} className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-white">Create Business Division</h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Code (e.g. DIV-11)"
                value={newDiv.code}
                onChange={(e) => setNewDiv((p) => ({ ...p, code: e.target.value }))}
                className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
              />
              <input
                type="text"
                required
                placeholder="Category"
                value={newDiv.category}
                onChange={(e) => setNewDiv((p) => ({ ...p, category: e.target.value }))}
                className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
              />
            </div>
            <input
              type="text"
              required
              placeholder="Division Name"
              value={newDiv.name}
              onChange={(e) => setNewDiv((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
            />
            <textarea
              rows={3}
              required
              placeholder="Truthful public summary (defaults to PROPOSED / DRAFT)"
              value={newDiv.summary}
              onChange={(e) => setNewDiv((p) => ({ ...p, summary: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
            />
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setNewDivModal(false)} className="px-3 py-2 text-slate-400 cursor-pointer">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold cursor-pointer">
                Create Division
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Version History Modal */}
      {versionsModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-3 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white">
                Version History ({versionsModal.entityType}) — {versionsModal.title}
              </h3>
              <button type="button" onClick={() => setVersionsModal(null)} className="text-xs text-slate-400 cursor-pointer">
                Close
              </button>
            </div>
            {versionsModal.list.length === 0 ? (
              <div className="text-xs text-slate-500 p-4 text-center">No historical snapshots recorded yet.</div>
            ) : (
              versionsModal.list.map((v) => (
                <div key={v.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-mono font-bold text-white">
                      v{v.versionNumber} · {v.changeSummary}
                    </div>
                    <div className="text-slate-400">{new Date(v.createdAt).toLocaleString()}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => restoreVersion(v.id)}
                    className="px-3 py-1 rounded bg-amber-500 text-slate-950 font-bold cursor-pointer"
                  >
                    Restore
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
