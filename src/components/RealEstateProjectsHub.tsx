import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2,
  Plus,
  Save,
  Globe,
  Archive,
  RefreshCw,
  Upload,
  History,
  Download,
  FileSpreadsheet,
  Share2,
  Copy,
  Undo2,
  Redo2,
  AlertTriangle,
  MapPin,
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

const DEVELOPMENT_STAGES = [
  { value: 'PROPOSED', label: 'Proposed' },
  { value: 'FEASIBILITY_ASSESSMENT', label: 'Feasibility assessment' },
  { value: 'LAND_DUE_DILIGENCE', label: 'Land due diligence' },
  { value: 'PLANNING_DESIGN', label: 'Planning and design' },
  { value: 'SEEKING_FINANCING', label: 'Seeking financing' },
  { value: 'AWAITING_APPROVALS', label: 'Awaiting approvals' },
  { value: 'APPROVED', label: 'Approved' },
  { value: 'UNDER_DEVELOPMENT', label: 'Under development' },
  { value: 'UNDER_CONSTRUCTION', label: 'Under construction' },
  { value: 'COMPLETED', label: 'Completed' },
];

const PUBLISH_STATUSES = [
  { value: 'DRAFT', label: 'Draft' },
  { value: 'IN_REVIEW', label: 'Pending approval' },
  { value: 'PUBLISHED', label: 'Published' },
  { value: 'UNPUBLISHED', label: 'Unpublished' },
  { value: 'ARCHIVED', label: 'Archived' },
];

export const RealEstateProjectsHub: React.FC = () => {
  const { showToast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState(false);
  const [versions, setVersions] = useState<any[] | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const [newModal, setNewModal] = useState(false);
  const [newProj, setNewProj] = useState({
    name: '',
    location: 'Yaoundé, Republic of Cameroon',
    propertyType: 'Residential apartments',
    description: '',
    landArea: '',
    buildingArea: '',
    floors: 2,
    estimatedBudget: '',
    investmentRequirements: '',
  });

  const loadProjects = useCallback(async () => {
    setLoading(true);
    try {
      const res = await corporateFetch(`/api/corporate/real-estate?includeArchived=${includeArchived}`);
      const list = res.projects || [];
      setProjects(list);
      if (list.length > 0 && (!selectedId || !list.some((p: any) => p.id === selectedId))) {
        setSelectedId(list[0].id);
        setEditForm(list[0]);
      } else if (selectedId) {
        const match = list.find((p: any) => p.id === selectedId);
        if (match) setEditForm(match);
      }
      setUndoStack([]);
      setRedoStack([]);
    } catch (err: any) {
      showToast(err.message || 'Failed to load real estate projects', 'error');
    } finally {
      setLoading(false);
    }
  }, [includeArchived, selectedId, showToast]);

  useEffect(() => {
    loadProjects();
  }, [loadProjects]);

  const updateField = (key: string, val: any) => {
    if (!editForm) return;
    setUndoStack((p) => [...p.slice(-20), editForm]);
    setRedoStack([]);
    setEditForm((p: any) => ({ ...p, [key]: val }));
  };

  const handleSave = async (overridePublishStatus?: string) => {
    if (!editForm) return;
    setSaving(true);
    try {
      const nextPub = overridePublishStatus || editForm.publishStatus;
      const res = await corporateFetch(`/api/corporate/real-estate/${editForm.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          ...editForm,
          publishStatus: nextPub,
          visibilityPublic: nextPub === 'UNPUBLISHED' ? false : nextPub === 'PUBLISHED' ? true : editForm.visibilityPublic,
        }),
      });
      showToast(`Real estate project saved (${res.project.developmentStage} / ${res.project.publishStatus})`, 'success');
      await loadProjects();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await corporateFetch('/api/corporate/real-estate', {
        method: 'POST',
        body: JSON.stringify({ ...newProj, developmentStage: 'PROPOSED', publishStatus: 'DRAFT', isConceptual: true }),
      });
      showToast('Created proposed real estate project (Draft)', 'success');
      setNewModal(false);
      setNewProj({
        name: '',
        location: 'Yaoundé, Republic of Cameroon',
        propertyType: 'Residential apartments',
        description: '',
        landArea: '',
        buildingArea: '',
        floors: 2,
        estimatedBudget: '',
        investmentRequirements: '',
      });
      setSelectedId(res.project.id);
      await loadProjects();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAssetUpload = async (
    file: File | null,
    category: 'photographs' | 'drawings' | 'renders' | 'feasibility' | 'supporting'
  ) => {
    if (!file || !editForm) return;
    setUploadingAsset(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('category', category);
      fd.append('title', file.name);
      await corporateFetch(`/api/corporate/real-estate/${editForm.id}/upload-asset`, {
        method: 'POST',
        body: fd,
      });
      showToast(`Uploaded ${category} asset to cloud storage`, 'success');
      await loadProjects();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setUploadingAsset(false);
    }
  };

  const handleArchive = async (proj: any, archive: boolean) => {
    try {
      await corporateFetch(`/api/corporate/real-estate/${proj.id}/archive`, {
        method: 'PATCH',
        body: JSON.stringify({ archive }),
      });
      showToast(archive ? 'Archived project' : 'Restored project', 'success');
      await loadProjects();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const openVersions = async () => {
    if (!editForm) return;
    try {
      const res = await corporateFetch(`/api/corporate/versions/REAL_ESTATE/${editForm.id}`);
      setVersions(res.versions || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const restoreVersion = async (versionId: number) => {
    try {
      await corporateFetch(`/api/corporate/versions/${versionId}/restore`, { method: 'POST' });
      showToast('Project version restored', 'success');
      setVersions(null);
      await loadProjects();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleShare = async () => {
    if (!editForm) return;
    try {
      const res = await corporateFetch('/api/corporate/shares', {
        method: 'POST',
        body: JSON.stringify({
          entityType: 'REAL_ESTATE',
          entityId: editForm.id,
          title: `${editForm.name} — Property Development Brief`,
          allowPublic: true,
          expiresInDays: 14,
        }),
      });
      setShareUrl(`${window.location.origin}${res.sharePath}`);
      showToast('Created controlled read-only share link', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-amber-500 uppercase font-bold">Division DIV-03 · Property &amp; Land Pipeline</div>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5">Real Estate Development Projects</h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage 11 development stages, architectural drawings, feasibility reports, conceptual renders (truthfully badged), and cloud project photography.
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
                'Real Estate Development Pipeline',
                `MADECC Group Real Estate Projects (${projects.length})`,
                projects.map((p) => ({
                  heading: p.name,
                  rows: [
                    ['Location', p.location],
                    ['Property Type', p.propertyType],
                    ['Development Stage', p.developmentStage],
                    ['Publish Status', p.publishStatus],
                    ['Conceptual Flag', p.isConceptual ? 'Yes (Conceptual / Proposed)' : 'Verified Build'],
                    ['Estimated Budget', p.estimatedBudget ? `${p.estimatedBudget} ${p.budgetCurrency}` : 'Pending feasibility'],
                    ['Investment Requirements', p.investmentRequirements || 'Not specified'],
                  ],
                }))
              )
            }
            className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-rose-400" /> PDF
          </button>
          <button
            type="button"
            onClick={() =>
              exportCorporateXlsx(
                'Real Estate Projects',
                'madecc-real-estate-projects',
                ['Name', 'Location', 'Type', 'Stage', 'Publish Status', 'Floors', 'Estimated Budget'],
                projects.map((p) => [p.name, p.location, p.propertyType, p.developmentStage, p.publishStatus, p.floors, p.estimatedBudget || 'Pending feasibility'])
              )
            }
            className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> XLSX
          </button>
          <button
            type="button"
            onClick={() => downloadCorporateServerExport('real-estate', 'csv')}
            className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-200 cursor-pointer"
          >
            CSV
          </button>
          <button
            type="button"
            onClick={() => setNewModal(true)}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Real Estate Project
          </button>
        </div>
      </div>

      {shareUrl && (
        <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/40 text-xs flex items-center justify-between gap-2">
          <span className="font-mono text-emerald-200 break-all">{shareUrl}</span>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(shareUrl);
              showToast('Copied project share link', 'success');
            }}
            className="text-amber-400 inline-flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" /> Copy
          </button>
        </div>
      )}

      {/* Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4 bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2.5">
          {loading ? (
            <div className="p-6 text-xs text-slate-400 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-500" /> Loading real estate projects...
            </div>
          ) : projects.length === 0 ? (
            <div className="p-6 text-center text-xs text-slate-500 border border-dashed border-slate-800 rounded-xl space-y-2">
              <Building2 className="w-8 h-8 text-slate-600 mx-auto" />
              <div>No real estate projects registered yet.</div>
              <button
                type="button"
                onClick={() => setNewModal(true)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Create Proposed Project
              </button>
            </div>
          ) : (
            projects.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  setSelectedId(p.id);
                  setEditForm({ ...p });
                  setUndoStack([]);
                  setRedoStack([]);
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-colors cursor-pointer ${
                  selectedId === p.id ? 'bg-slate-900 border-amber-500' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-amber-500 font-bold">{p.propertyType}</span>
                  <span className={p.publishStatus === 'PUBLISHED' ? 'text-emerald-400' : 'text-slate-400'}>
                    {p.publishStatus}
                  </span>
                </div>
                <div className="text-xs font-bold text-white mt-1">{p.name}</div>
                <div className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-amber-500 shrink-0" /> {p.location} · {p.developmentStage}
                </div>
              </button>
            ))
          )}
        </div>

        <div className="xl:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5">
          {!editForm ? (
            <div className="p-10 text-center text-xs text-slate-500">
              Select a real estate project from the left panel or click "Add Real Estate Project" to create a new development concept.
            </div>
          ) : (
            <>
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <div>
                  <div className="text-[11px] font-mono text-slate-400">
                    v{editForm.version} · {editForm.developmentStage} · {editForm.publishStatus}
                  </div>
                  <h3 className="text-lg font-bold text-white">{editForm.name}</h3>
                </div>
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    disabled={undoStack.length === 0}
                    onClick={() => {
                      const prev = undoStack[undoStack.length - 1];
                      setRedoStack((r) => [...r, editForm]);
                      setUndoStack((u) => u.slice(0, -1));
                      setEditForm(prev);
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-300 disabled:opacity-40 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Undo2 className="w-3.5 h-3.5" /> Undo
                  </button>
                  <button
                    type="button"
                    disabled={redoStack.length === 0}
                    onClick={() => {
                      const nxt = redoStack[redoStack.length - 1];
                      setUndoStack((u) => [...u, editForm]);
                      setRedoStack((r) => r.slice(0, -1));
                      setEditForm(nxt);
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-300 disabled:opacity-40 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Redo2 className="w-3.5 h-3.5" /> Redo
                  </button>
                  <button
                    type="button"
                    onClick={handleShare}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-emerald-300 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </button>
                  <button
                    type="button"
                    onClick={openVersions}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-amber-300 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5" /> Versions
                  </button>
                  <button
                    type="button"
                    onClick={() => handleArchive(editForm, !editForm.archivedAt)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-300 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Archive className="w-3.5 h-3.5" /> {editForm.archivedAt ? 'Restore' : 'Archive'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSave('DRAFT')}
                    disabled={saving}
                    className="px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-900 text-xs text-white font-semibold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> Save Draft
                  </button>
                  {editForm.publishStatus === 'PUBLISHED' && (
                    <button
                      type="button"
                      onClick={() => handleSave('UNPUBLISHED')}
                      disabled={saving}
                      className="px-2.5 py-1.5 rounded-lg border border-rose-500/40 bg-rose-500/10 text-xs text-rose-300 cursor-pointer"
                    >
                      Unpublish
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleSave('PUBLISHED')}
                    disabled={saving}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5" /> Publish
                  </button>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Truthful Representation Guard:</strong> Projects cannot be marked <span className="font-mono">COMPLETED</span> without verified photographs of the completed structure. Conceptual architectural renders must remain labeled as conceptual studies.
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <label className="space-y-1">
                  <span className="text-slate-400">Project Name</span>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => updateField('name', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-slate-400">Location</span>
                  <input
                    type="text"
                    value={editForm.location || ''}
                    onChange={(e) => updateField('location', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-slate-400">Development Stage (11 Controlled Stages)</span>
                  <select
                    value={editForm.developmentStage || 'PROPOSED'}
                    onChange={(e) => updateField('developmentStage', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  >
                    {DEVELOPMENT_STAGES.map((st) => (
                      <option key={st.value} value={st.value}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-slate-400">Website Publication Status (Independent)</span>
                  <select
                    value={editForm.publishStatus || 'DRAFT'}
                    onChange={(e) => updateField('publishStatus', e.target.value)}
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
                  <span className="text-slate-400">Property Type</span>
                  <input
                    type="text"
                    value={editForm.propertyType || ''}
                    onChange={(e) => updateField('propertyType', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </label>

                <div className="grid grid-cols-3 gap-2">
                  <label className="space-y-1">
                    <span className="text-slate-400">Land Area</span>
                    <input
                      type="text"
                      placeholder="e.g. 1,200 m²"
                      value={editForm.landArea || ''}
                      onChange={(e) => updateField('landArea', e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-slate-400">Building Area</span>
                    <input
                      type="text"
                      placeholder="e.g. 640 m²"
                      value={editForm.buildingArea || ''}
                      onChange={(e) => updateField('buildingArea', e.target.value)}
                      className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                    />
                  </label>
                  <label className="space-y-1">
                    <span className="text-slate-400">Floors</span>
                    <input
                      type="number"
                      min={1}
                      value={editForm.floors ?? 1}
                      onChange={(e) => updateField('floors', Number(e.target.value))}
                      className="w-full px-2.5 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                    />
                  </label>
                </div>

                <label className="space-y-1">
                  <span className="text-slate-400">Estimated Budget ({editForm.budgetCurrency || 'XAF'})</span>
                  <input
                    type="text"
                    placeholder="Pending detailed feasibility"
                    value={editForm.estimatedBudget || ''}
                    onChange={(e) => updateField('estimatedBudget', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-slate-400">Investment Requirements / Partnership Terms</span>
                  <input
                    type="text"
                    placeholder="e.g. Joint venture equity / Landowner partnership"
                    value={editForm.investmentRequirements || ''}
                    onChange={(e) => updateField('investmentRequirements', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </label>

                <label className="space-y-1 sm:col-span-2">
                  <span className="text-slate-400">Project Description</span>
                  <textarea
                    rows={3}
                    value={editForm.description || ''}
                    onChange={(e) => updateField('description', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </label>

                <label className="space-y-1 sm:col-span-2">
                  <span className="text-slate-400">Public Disclaimer Note</span>
                  <input
                    type="text"
                    value={editForm.disclaimerNote || ''}
                    onChange={(e) => updateField('disclaimerNote', e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editForm.isConceptual)}
                    onChange={(e) => updateField('isConceptual', e.target.checked)}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span>Badge as Proposed / Conceptual Render (Not Completed Building)</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editForm.visibilityPublic)}
                    onChange={(e) => updateField('visibilityPublic', e.target.checked)}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span>Visible on Public Services / Website</span>
                </label>
              </div>

              {/* Cloud Assets Upload Grid */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <div className="text-xs font-bold text-amber-500 uppercase tracking-wider">
                  Project Media &amp; Documentary Dossier {uploadingAsset ? '(Uploading...)' : ''}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                  {(
                    [
                      { key: 'photographs', label: 'Photographs (Verified Build)', items: editForm.photographsJson },
                      { key: 'drawings', label: 'Architectural Drawings', items: editForm.architecturalDrawingsJson },
                      { key: 'renders', label: 'Conceptual Renders', items: editForm.rendersJson },
                      { key: 'feasibility', label: 'Feasibility Reports', items: editForm.feasibilityReportsJson },
                      { key: 'supporting', label: 'Supporting Documents', items: editForm.supportingDocsJson },
                    ] as const
                  ).map((bucket) => (
                    <div key={bucket.key} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white">{bucket.label}</span>
                        <span className="text-[11px] font-mono text-amber-400">{(bucket.items || []).length}</span>
                      </div>
                      <label className="block text-center py-1.5 px-2 rounded bg-slate-800 hover:bg-slate-700 text-amber-300 font-semibold cursor-pointer">
                        <Upload className="w-3 h-3 inline mr-1" /> Upload File
                        <input
                          type="file"
                          className="hidden"
                          onChange={(e) => handleAssetUpload(e.target.files?.[0] || null, bucket.key)}
                        />
                      </label>
                      {(bucket.items || []).map((a: any, i: number) => (
                        <a
                          key={a.id || i}
                          href={a.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block text-[11px] text-slate-300 hover:text-amber-400 truncate"
                        >
                          <FileText className="w-3 h-3 inline mr-1" />
                          {a.title || a.fileName}
                        </a>
                      ))}
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create Modal */}
      {newModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-base font-bold text-white">Create Real Estate Development Project</h3>
              <button type="button" onClick={() => setNewModal(false)} className="text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="Project Name (e.g. Mbankolo Conceptual Duplex Residence)"
              value={newProj.name}
              onChange={(e) => setNewProj((p) => ({ ...p, name: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Location"
                value={newProj.location}
                onChange={(e) => setNewProj((p) => ({ ...p, location: e.target.value }))}
                className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
              />
              <input
                type="text"
                required
                placeholder="Property Type"
                value={newProj.propertyType}
                onChange={(e) => setNewProj((p) => ({ ...p, propertyType: e.target.value }))}
                className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
              />
            </div>
            <textarea
              rows={3}
              required
              placeholder="Truthful project description (defaults to PROPOSED / DRAFT / Conceptual)"
              value={newProj.description}
              onChange={(e) => setNewProj((p) => ({ ...p, description: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setNewModal(false)} className="px-3 py-2 text-slate-400 cursor-pointer">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold cursor-pointer">
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Version History Modal */}
      {versions && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-3 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white">Real Estate Project Version History</h3>
              <button type="button" onClick={() => setVersions(null)} className="text-xs text-slate-400 cursor-pointer">
                Close
              </button>
            </div>
            {versions.map((v) => (
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
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
