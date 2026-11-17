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
  { value: 'UNDER_FEASIBILITY', label: 'Under feasibility assessment' },
  { value: 'SEEKING_INVESTMENT', label: 'Seeking investment' },
  { value: 'PARTNERSHIP_DISCUSSIONS', label: 'Partnership discussions' },
  { value: 'AWAITING_REGULATORY_APPROVAL', label: 'Awaiting regulatory approval' },
  { value: 'APPROVED_FOR_OPERATION', label: 'Approved for operation' },
  { value: 'OPERATIONAL', label: 'Operational' },
  { value: 'TEMPORARILY_INACTIVE', label: 'Temporarily inactive' },
  { value: 'ARCHIVED', label: 'Archived' },
];

const PUBLISH_STATUSES = ['DRAFT', 'IN_REVIEW', 'PUBLISHED', 'UNPUBLISHED', 'ARCHIVED'];

export const BusinessDivisionsHub: React.FC = () => {
  const { showToast } = useToast();
  const [divisions, setDivisions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [includeArchived, setIncludeArchived] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  const [newDivModal, setNewDivModal] = useState(false);
  const [newDiv, setNewDiv] = useState({
    code: '',
    name: '',
    category: '',
    summary: '',
    country: 'Cameroon',
    currency: 'XAF',
    regulatoryBody: '',
    licenceRequired: false,
  });

  const [newServiceForm, setNewServiceForm] = useState({ name: '', shortDescription: '', pricingModel: '' });
  const [versions, setVersions] = useState<any[] | null>(null);

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
    } catch (err: any) {
      showToast(err.message || 'Failed to load business divisions', 'error');
    } finally {
      setLoading(false);
    }
  }, [includeArchived, selectedId, showToast]);

  useEffect(() => {
    loadDivisions();
  }, [loadDivisions]);

  const handleSelect = (div: any) => {
    setSelectedId(div.id);
    setEditForm({ ...div });
  };

  const handleSaveDivision = async (overridePublishStatus?: string) => {
    if (!editForm) return;
    setSaving(true);
    try {
      const payload = {
        ...editForm,
        publishStatus: overridePublishStatus || editForm.publishStatus,
        operatingCountries:
          typeof editForm.operatingCountries === 'string'
            ? editForm.operatingCountries.split(',').map((s: string) => s.trim()).filter(Boolean)
            : editForm.operatingCountries,
      };
      const res = await corporateFetch(`/api/corporate/divisions/${editForm.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      showToast(`Saved ${res.division.name}`, 'success');
      await loadDivisions();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
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
      setNewDiv({ code: '', name: '', category: '', summary: '', country: 'Cameroon', currency: 'XAF', regulatoryBody: '', licenceRequired: false });
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
          operationalStatus: editForm.operationalStatus,
          currency: editForm.currency,
        }),
      });
      showToast('Added sub-service to division', 'success');
      setNewServiceForm({ name: '', shortDescription: '', pricingModel: '' });
      await loadDivisions();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const openVersions = async () => {
    if (!editForm) return;
    try {
      const res = await corporateFetch(`/api/corporate/versions/DIVISION/${editForm.id}`);
      setVersions(res.versions || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const restoreVersion = async (versionId: number) => {
    try {
      await corporateFetch(`/api/corporate/versions/${versionId}/restore`, { method: 'POST' });
      showToast('Division version restored non-destructively', 'success');
      setVersions(null);
      await loadDivisions();
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
      d.summary.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-amber-500 uppercase font-bold">Multi-Sector Architecture</div>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5">Business Divisions &amp; Services (All 9 Divisions)</h2>
          <p className="text-xs text-slate-400 mt-1">
            Manage operational readiness, regulatory licensing gates (e.g., MINSANTE/DPML), multi-country currencies, and CMS publication states.
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
                'Business Divisions Directory',
                `All Active MADECC Group Business Divisions (${divisions.length})`,
                divisions.map((d) => ({
                  heading: `${d.code} — ${d.name}`,
                  rows: [
                    ['Category', d.category],
                    ['Operational Status', d.operationalStatus],
                    ['Publish Status', d.publishStatus],
                    ['Country / Currency', `${d.country} (${d.currency})`],
                    ['Regulatory Body', d.regulatoryBody || 'Not provided'],
                    ['Licence Status', d.licenceStatus],
                    ['Summary', d.summary],
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
            onClick={() =>
              exportCorporateXlsx(
                'Divisions',
                'madecc-business-divisions',
                ['Code', 'Name', 'Operational Status', 'Publish Status', 'Country', 'Currency', 'Regulatory Body', 'Licence Status'],
                divisions.map((d) => [d.code, d.name, d.operationalStatus, d.publishStatus, d.country, d.currency, d.regulatoryBody || 'Not provided', d.licenceStatus])
              )
            }
            className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-200 hover:border-amber-500/50 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> XLSX
          </button>
          <button
            type="button"
            onClick={() => downloadCorporateServerExport('divisions', 'csv')}
            className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-200 hover:border-amber-500/50 cursor-pointer"
          >
            CSV
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

      {/* Main Split Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        {/* Left List */}
        <div className="xl:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filter divisions by name, code, or sector..."
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
            <div className="space-y-2 max-h-[680px] overflow-y-auto pr-1">
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
                      {div.operationalStatus} · {div.country} · {div.services?.length || 0} service(s)
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Detail Editor */}
        <div className="xl:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5">
          {!editForm ? (
            <div className="text-xs text-slate-500 p-8 text-center">Select a division from the left list to edit.</div>
          ) : (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
                <div>
                  <div className="text-xs font-mono text-slate-400">
                    {editForm.code} · v{editForm.version}
                  </div>
                  <h3 className="text-lg font-bold text-white">{editForm.name}</h3>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={openVersions}
                    className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-300 hover:border-amber-500/50 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <History className="w-3.5 h-3.5 text-amber-400" /> Versions
                  </button>
                  <button
                    type="button"
                    onClick={() => handleArchiveDivision(editForm, !editForm.archivedAt)}
                    className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-300 hover:border-rose-500/50 inline-flex items-center gap-1 cursor-pointer"
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
                  <button
                    type="button"
                    onClick={() => handleSaveDivision('PUBLISHED')}
                    disabled={saving}
                    className="px-3.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Globe className="w-3.5 h-3.5" /> Publish Live
                  </button>
                </div>
              </div>

              {editForm.licenceRequired && editForm.licenceStatus !== 'APPROVED' && (
                <div className="p-3 rounded-xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
                  <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-white">Regulated Sector Gate:</strong> This division requires licensing from{' '}
                    <span className="font-mono">{editForm.regulatoryBody || 'statutory regulators'}</span>. Operational status cannot be switched to{' '}
                    <span className="font-mono">OPERATIONAL</span> until licence status is <span className="font-mono">APPROVED</span> with an official licence number.
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <label className="space-y-1 sm:col-span-2">
                  <span className="text-slate-400">Division Name</span>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, name: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-slate-400">Operational Readiness Status</span>
                  <select
                    value={editForm.operationalStatus || 'PROPOSED'}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, operationalStatus: e.target.value }))}
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
                  <span className="text-slate-400">Website Publish Status</span>
                  <select
                    value={editForm.publishStatus || 'PUBLISHED'}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, publishStatus: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  >
                    {PUBLISH_STATUSES.map((ps) => (
                      <option key={ps} value={ps}>
                        {ps}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-slate-400">Primary Country</span>
                  <input
                    type="text"
                    value={editForm.country || 'Cameroon'}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, country: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-slate-400">Currency</span>
                  <input
                    type="text"
                    value={editForm.currency || 'XAF'}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, currency: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </label>

                <label className="space-y-1 sm:col-span-2">
                  <span className="text-slate-400">Regulatory Authority / Body</span>
                  <input
                    type="text"
                    value={editForm.regulatoryBody || ''}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, regulatoryBody: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-slate-400">Statutory Licence Status</span>
                  <select
                    value={editForm.licenceStatus || 'NOT_APPLIED'}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, licenceStatus: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  >
                    <option value="NOT_APPLIED">Not applied</option>
                    <option value="PENDING_APPROVAL">Application submitted / pending</option>
                    <option value="APPROVED">Approved &amp; verified</option>
                    <option value="NOT_REQUIRED">Not required</option>
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-slate-400">Official Licence Number (Blank if unissued)</span>
                  <input
                    type="text"
                    value={editForm.licenceNumber || ''}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, licenceNumber: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </label>

                <label className="space-y-1 sm:col-span-2">
                  <span className="text-slate-400">Public Summary</span>
                  <textarea
                    rows={2}
                    value={editForm.summary || ''}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, summary: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </label>

                <label className="space-y-1 sm:col-span-2">
                  <span className="text-slate-400">Full Scope Description</span>
                  <textarea
                    rows={3}
                    value={editForm.fullDescription || ''}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, fullDescription: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editForm.visibilityPublic)}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, visibilityPublic: e.target.checked }))}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span>Visible on Public Website Directory</span>
                </label>

                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editForm.licenceRequired)}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, licenceRequired: e.target.checked }))}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span>Enforce Statutory Licensing Before Operational Status</span>
                </label>
              </div>

              {/* Division Sub-Services */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-3.5 h-3.5" /> Division Sub-Services ({editForm.services?.length || 0})
                </h4>

                <div className="space-y-2">
                  {(editForm.services || []).map((svc: any) => (
                    <div key={svc.id} className="p-3 rounded-xl bg-slate-900/70 border border-slate-800 text-xs flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" /> {svc.name}
                        </div>
                        <p className="text-slate-400 mt-0.5">{svc.shortDescription}</p>
                        <div className="text-[11px] text-slate-500 mt-1 font-mono">
                          {svc.operationalStatus} · {svc.currency} · {svc.pricingModel}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handleAddService} className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
                  <input
                    type="text"
                    required
                    placeholder="New sub-service title"
                    value={newServiceForm.name}
                    onChange={(e) => setNewServiceForm((p) => ({ ...p, name: e.target.value }))}
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
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white inline-flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-amber-400" /> Add Service
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create New Division Modal */}
      {newDivModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <form onSubmit={handleCreateDivision} className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 text-xs">
            <h3 className="text-base font-bold text-white">Create Business Division</h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                required
                placeholder="Code (e.g. DIV-10)"
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
              placeholder="Truthful public summary (will default to PROPOSED / DRAFT)"
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
      {versions && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-3 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-sm font-bold text-white">Division Version History</h3>
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
