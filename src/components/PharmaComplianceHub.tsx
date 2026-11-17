import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  Plus,
  Save,
  Upload,
  RefreshCw,
  Download,
  FileSpreadsheet,
  FileCheck2,
  X,
} from 'lucide-react';
import {
  corporateFetch,
  downloadCorporateServerExport,
  exportCorporatePdf,
  exportCorporateXlsx,
} from '../lib/corporateApi.ts';
import { useToast } from './Toast.tsx';

export const PharmaComplianceHub: React.FC = () => {
  const { showToast } = useToast();
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);

  const [newModal, setNewModal] = useState(false);
  const [newRec, setNewRec] = useState({
    country: 'Republic of Cameroon',
    regulatoryAuthority: 'MINSANTE / DPML Cameroon',
    licenceType: 'Retail Pharmacy Establishment Authorization',
    responsibleProfessional: '',
    professionalQualification: '',
    complianceNotes: '',
  });

  const loadRecords = useCallback(async () => {
    setLoading(true);
    try {
      const res = await corporateFetch('/api/corporate/pharma-compliance');
      const list = res.records || [];
      setRecords(list);
      if (list.length > 0 && (!selectedId || !list.some((r: any) => r.id === selectedId))) {
        setSelectedId(list[0].id);
        setEditForm(list[0]);
      } else if (selectedId) {
        const match = list.find((r: any) => r.id === selectedId);
        if (match) setEditForm(match);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load pharmaceutical compliance records', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedId, showToast]);

  useEffect(() => {
    loadRecords();
  }, [loadRecords]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await corporateFetch('/api/corporate/pharma-compliance', {
        method: 'POST',
        body: JSON.stringify(newRec),
      });
      showToast('Created pharmaceutical regulatory record (UNVERIFIED / NOT_APPLIED)', 'success');
      setNewModal(false);
      setSelectedId(res.record.id);
      await loadRecords();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleSave = async () => {
    if (!editForm) return;
    setSaving(true);
    try {
      await corporateFetch(`/api/corporate/pharma-compliance/${editForm.id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm),
      });
      showToast('Pharmaceutical compliance record updated', 'success');
      await loadRecords();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleUploadLicence = async (file: File | null) => {
    if (!file || !editForm) return;
    setUploadingDoc(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      await corporateFetch(`/api/corporate/pharma-compliance/${editForm.id}/upload-licence`, {
        method: 'POST',
        body: fd,
      });
      showToast('Official licence document uploaded and hashed (SHA-256). Status set to PENDING_VERIFICATION.', 'success');
      await loadRecords();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setUploadingDoc(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-amber-500 uppercase font-bold">Division DIV-04 · Statutory Compliance Gate</div>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5">Pharmaceutical &amp; Healthcare Regulatory Compliance</h2>
          <p className="text-xs text-slate-400 mt-1">
            Strictly enforces documentary verification and qualified pharmacist accountability. Unlicensed medicine sales or dispensing claims are blocked platform-wide.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              exportCorporatePdf(
                'Pharmaceutical Compliance Register',
                'Statutory Licensing & Qualified Professional Register',
                records.map((r) => ({
                  heading: `${r.country} — ${r.licenceType}`,
                  rows: [
                    ['Regulatory Authority', r.regulatoryAuthority],
                    ['Licence Number', r.licenceNumber || 'Unissued'],
                    ['Verification Status', r.verificationStatus],
                    ['Approval Status', r.approvalStatus],
                    ['Responsible Professional', r.responsibleProfessional || 'Pending appointment'],
                    ['Compliance Notes', r.complianceNotes || 'None'],
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
                'Pharma Compliance',
                'madecc-pharma-compliance',
                ['Country', 'Authority', 'Licence Type', 'Licence No', 'Verification', 'Approval', 'Responsible Professional'],
                records.map((r) => [r.country, r.regulatoryAuthority, r.licenceType, r.licenceNumber || 'Unissued', r.verificationStatus, r.approvalStatus, r.responsibleProfessional || 'Pending'])
              )
            }
            className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-200 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> XLSX
          </button>
          <button
            type="button"
            onClick={() => downloadCorporateServerExport('pharma', 'csv')}
            className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-200 cursor-pointer"
          >
            CSV
          </button>
          <button
            type="button"
            onClick={() => setNewModal(true)}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Regulatory Record
          </button>
        </div>
      </div>

      {/* Zero-Tolerance Compliance Banner */}
      <div className="p-4 rounded-xl bg-rose-950/25 border border-rose-500/35 text-xs text-rose-200 flex items-start gap-3">
        <ShieldAlert className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-bold text-white">Strict Legal Prohibition: Unlicensed Pharmacy / Pharmaceutical Claims Blocked</div>
          <p className="text-slate-300 leading-relaxed">
            MADECC Group must never state or imply that it is currently a licensed pharmacy or pharmaceutical distributor unless an official licence from MINSANTE / DPML (or applicable national regulator), licence number, uploaded statutory certificate, and qualified licensed pharmacist are verified by Legal Compliance or Super Admin.
          </p>
        </div>
      </div>

      {/* Workspace */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4 bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2.5">
          {loading ? (
            <div className="p-6 text-xs text-slate-400 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-500" /> Loading compliance records...
            </div>
          ) : (
            records.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => {
                  setSelectedId(r.id);
                  setEditForm({ ...r });
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-colors cursor-pointer ${
                  selectedId === r.id ? 'bg-slate-900 border-amber-500' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono">
                  <span className="text-amber-500 font-bold">{r.country}</span>
                  <span className={r.approvalStatus === 'APPROVED' ? 'text-emerald-400' : 'text-amber-300'}>
                    {r.approvalStatus}
                  </span>
                </div>
                <div className="text-xs font-bold text-white mt-1">{r.licenceType}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">{r.regulatoryAuthority}</div>
              </button>
            ))
          )}
        </div>

        <div className="xl:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5">
          {!editForm ? (
            <div className="p-8 text-center text-xs text-slate-500">Select a compliance record from the left to review or update.</div>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  {editForm.verificationStatus === 'VERIFIED' ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  ) : (
                    <ShieldAlert className="w-5 h-5 text-amber-400" />
                  )}
                  <div>
                    <h3 className="text-base font-bold text-white">{editForm.licenceType}</h3>
                    <div className="text-[11px] font-mono text-slate-400">{editForm.regulatoryAuthority}</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Compliance Record'}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <label className="space-y-1">
                  <span className="text-slate-400">Country</span>
                  <input
                    type="text"
                    value={editForm.country || ''}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, country: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-slate-400">Regulatory Authority</span>
                  <input
                    type="text"
                    value={editForm.regulatoryAuthority || ''}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, regulatoryAuthority: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-slate-400">Licence Type</span>
                  <input
                    type="text"
                    value={editForm.licenceType || ''}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, licenceType: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-slate-400">Official Licence Number (Leave blank if unissued)</span>
                  <input
                    type="text"
                    placeholder="Unissued"
                    value={editForm.licenceNumber || ''}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, licenceNumber: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white font-mono"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-slate-400">Responsible Qualified Professional</span>
                  <input
                    type="text"
                    placeholder="Licensed Pharmacist / Medical Director"
                    value={editForm.responsibleProfessional || ''}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, responsibleProfessional: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-slate-400">Professional Qualification / Registration</span>
                  <input
                    type="text"
                    placeholder="e.g. ONPC Registration No."
                    value={editForm.professionalQualification || ''}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, professionalQualification: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </label>

                <label className="space-y-1">
                  <span className="text-slate-400">Documentary Verification Status</span>
                  <select
                    value={editForm.verificationStatus || 'UNVERIFIED'}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, verificationStatus: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  >
                    <option value="UNVERIFIED">Unverified</option>
                    <option value="PENDING_VERIFICATION">Pending Verification</option>
                    <option value="VERIFIED">Verified (Requires uploaded doc &amp; licence no.)</option>
                    <option value="REJECTED">Rejected</option>
                  </select>
                </label>
                <label className="space-y-1">
                  <span className="text-slate-400">Statutory Approval Status</span>
                  <select
                    value={editForm.approvalStatus || 'NOT_APPLIED'}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, approvalStatus: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  >
                    <option value="NOT_APPLIED">Not Applied</option>
                    <option value="APPLICATION_PREPARATION">Application Preparation</option>
                    <option value="SUBMITTED">Submitted to Authority</option>
                    <option value="UNDER_INSPECTION">Under Authority Inspection</option>
                    <option value="APPROVED">Approved (Requires doc + professional + Super Admin/Legal)</option>
                    <option value="EXPIRED">Expired</option>
                  </select>
                </label>

                <label className="space-y-1 sm:col-span-2">
                  <span className="text-slate-400">Compliance Notes</span>
                  <textarea
                    rows={3}
                    value={editForm.complianceNotes || ''}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, complianceNotes: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </label>
              </div>

              {/* Licence Document Upload */}
              <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-white flex items-center gap-1.5">
                    <FileCheck2 className="w-4 h-4 text-amber-400" /> Official Statutory Licence Certificate
                  </div>
                  {editForm.licenceDocumentUrl ? (
                    <a
                      href={editForm.licenceDocumentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-400 hover:underline font-mono text-[11px] block"
                    >
                      {editForm.licenceDocumentName || 'View Uploaded Licence Document'} (SHA-256: {editForm.sha256Checksum?.slice(0, 12)}...)
                    </a>
                  ) : (
                    <div className="text-slate-400">No statutory licence certificate uploaded yet.</div>
                  )}
                </div>
                <label className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold inline-flex items-center gap-1.5 cursor-pointer shrink-0">
                  <Upload className="w-3.5 h-3.5" /> {uploadingDoc ? 'Uploading...' : 'Upload Licence Doc'}
                  <input
                    type="file"
                    className="hidden"
                    onChange={(e) => handleUploadLicence(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Add Modal */}
      {newModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <form onSubmit={handleCreate} className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-base font-bold text-white">Register Pharmaceutical / Healthcare Regulatory File</h3>
              <button type="button" onClick={() => setNewModal(false)} className="text-slate-400 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <input
              type="text"
              required
              placeholder="Country (e.g. Republic of Cameroon)"
              value={newRec.country}
              onChange={(e) => setNewRec((p) => ({ ...p, country: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
            />
            <input
              type="text"
              required
              placeholder="Regulatory Authority (e.g. MINSANTE / DPML)"
              value={newRec.regulatoryAuthority}
              onChange={(e) => setNewRec((p) => ({ ...p, regulatoryAuthority: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
            />
            <input
              type="text"
              required
              placeholder="Licence Type"
              value={newRec.licenceType}
              onChange={(e) => setNewRec((p) => ({ ...p, licenceType: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
            />
            <textarea
              rows={2}
              placeholder="Compliance notes (record always initializes as UNVERIFIED / NOT_APPLIED)"
              value={newRec.complianceNotes}
              onChange={(e) => setNewRec((p) => ({ ...p, complianceNotes: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setNewModal(false)} className="px-3 py-2 text-slate-400 cursor-pointer">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold cursor-pointer">
                Create Compliance Record
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
