import React, { useState, useEffect, useCallback } from 'react';
import {
  Handshake,
  Plus,
  Save,
  Upload,
  CheckCircle2,
  XCircle,
  MessageSquarePlus,
  Download,
  FileSpreadsheet,
  Archive,
  ShieldAlert,
  Share2,
  Copy,
  RefreshCw,
} from 'lucide-react';
import {
  corporateFetch,
  downloadCorporateServerExport,
  exportCorporatePdf,
  exportCorporateXlsx,
} from '../lib/corporateApi.ts';
import { useToast } from './Toast.tsx';

const ENQUIRY_STATUSES = ['NEW', 'IN_REVIEW', 'RESPONDED', 'QUALIFIED', 'ARCHIVED'];

export const InvestorPartnershipHub: React.FC = () => {
  const { showToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'pipeline' | 'enquiries'>('pipeline');
  const [investors, setInvestors] = useState<any[]>([]);
  const [stages, setStages] = useState<{ code: string; label: string }[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [editForm, setEditForm] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Enquiries Inbox state
  const [enquiries, setEnquiries] = useState<any[]>([]);
  const [enquiryFilter, setEnquiryFilter] = useState<string>('ALL');
  const [selectedEnq, setSelectedEnq] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [sendReplyEmail, setSendReplyEmail] = useState(true);
  const [savingEnq, setSavingEnq] = useState(false);

  const [newInvModal, setNewInvModal] = useState(false);
  const [newInv, setNewInv] = useState({
    investorName: '',
    organization: '',
    investorCountry: 'Ghana',
    targetCountry: 'Cameroon',
    registrationJurisdiction: 'Cameroon',
    sectorFocus: 'Real Estate & Property Development, Pharmaceuticals & Healthcare Business',
    stage: 'POTENTIAL_INVESTOR',
    summary: '',
  });

  const [interactionForm, setInteractionForm] = useState({
    interactionType: 'MEETING',
    subject: '',
    summary: '',
    nextSteps: '',
  });

  const [docForm, setDocForm] = useState({ title: '', docType: 'FEASIBILITY_STUDY', file: null as File | null });
  const [shareOutput, setShareOutput] = useState<string | null>(null);

  const loadInvestors = useCallback(async () => {
    setLoading(true);
    try {
      const [res, enqRes] = await Promise.all([
        corporateFetch('/api/corporate/investors'),
        corporateFetch('/api/corporate/enquiries').catch(() => ({ enquiries: [] })),
      ]);
      const list = res.investors || [];
      setInvestors(list);
      setStages(res.stages || []);
      setEnquiries(enqRes.enquiries || []);
      if (list.length > 0 && (!selectedId || !list.some((i: any) => i.id === selectedId))) {
        setSelectedId(list[0].id);
        setEditForm(list[0]);
      } else if (selectedId) {
        const match = list.find((i: any) => i.id === selectedId);
        if (match) setEditForm(match);
      }
    } catch (err: any) {
      showToast(err.message || 'Failed to load investor records', 'error');
    } finally {
      setLoading(false);
    }
  }, [selectedId, showToast]);

  const handleSaveEnquiry = async (nextStatus?: string) => {
    if (!selectedEnq) return;
    setSavingEnq(true);
    try {
      const res = await corporateFetch(`/api/corporate/enquiries/${selectedEnq.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: nextStatus || selectedEnq.status,
          adminResponse: replyText || selectedEnq.adminResponse,
          sendEmailReply: Boolean(sendReplyEmail && replyText.trim()),
        }),
      });
      setSelectedEnq(res.enquiry);
      showToast(
        sendReplyEmail && replyText.trim()
          ? `Enquiry updated & SMTP reply dispatched to ${selectedEnq.email}`
          : 'Enquiry status updated',
        'success'
      );
      setReplyText('');
      await loadInvestors();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSavingEnq(false);
    }
  };

  useEffect(() => {
    loadInvestors();
  }, [loadInvestors]);

  const handleSaveInvestor = async () => {
    if (!editForm) return;
    setSaving(true);
    try {
      const payload = {
        ...editForm,
        sectorFocus:
          typeof editForm.sectorFocus === 'string'
            ? editForm.sectorFocus.split(',').map((s: string) => s.trim()).filter(Boolean)
            : editForm.sectorFocus,
      };
      await corporateFetch(`/api/corporate/investors/${editForm.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload),
      });
      showToast('Investor pipeline record updated', 'success');
      await loadInvestors();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateInvestor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await corporateFetch('/api/corporate/investors', {
        method: 'POST',
        body: JSON.stringify({
          ...newInv,
          sectorFocus: newInv.sectorFocus.split(',').map((s) => s.trim()).filter(Boolean),
        }),
      });
      showToast('Added investor prospect record', 'success');
      setNewInvModal(false);
      setSelectedId(res.investor.id);
      await loadInvestors();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleAddInteraction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm) return;
    try {
      await corporateFetch(`/api/corporate/investors/${editForm.id}/interactions`, {
        method: 'POST',
        body: JSON.stringify(interactionForm),
      });
      showToast('Communication & meeting log recorded', 'success');
      setInteractionForm({ interactionType: 'MEETING', subject: '', summary: '', nextSteps: '' });
      await loadInvestors();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleUploadDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editForm || !docForm.file) return;
    try {
      const fd = new FormData();
      fd.append('file', docForm.file);
      fd.append('title', docForm.title || docForm.file.name);
      fd.append('docType', docForm.docType);
      await corporateFetch(`/api/corporate/investors/${editForm.id}/documents`, {
        method: 'POST',
        body: fd,
      });
      showToast('Confidential investor document uploaded & SHA-256 hashed', 'success');
      setDocForm({ title: '', docType: 'FEASIBILITY_STUDY', file: null });
      await loadInvestors();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleReviewDoc = async (docId: number, status: 'VERIFIED' | 'REJECTED') => {
    try {
      await corporateFetch(`/api/corporate/investor-documents/${docId}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      });
      showToast(`Investor document marked ${status}`, 'success');
      await loadInvestors();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleShareOpportunity = async () => {
    if (!editForm) return;
    try {
      const res = await corporateFetch('/api/corporate/shares', {
        method: 'POST',
        body: JSON.stringify({
          entityType: 'INVESTOR_OPPORTUNITY',
          entityId: editForm.id,
          title: editForm.opportunityTitle || 'Cameroon Cross-Border Partnership Opportunity',
          allowPublic: true,
          expiresInDays: 14,
        }),
      });
      setShareOutput(`${window.location.origin}${res.sharePath}`);
      showToast('Sanitized opportunity share link created (confidential notes & personal contacts excluded)', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-mono text-amber-500 uppercase font-bold">Cross-Border Capital &amp; Ventures</div>
          <h2 className="text-2xl font-bold text-white tracking-tight mt-0.5">Investor &amp; Partnership Management</h2>
          <p className="text-xs text-slate-400 mt-1">
            Track prospective Ghanaian &amp; international investors across 14 controlled stages while maintaining zero implication of unverified agreements.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-lg border border-slate-800 bg-slate-900 p-0.5 mr-2">
            <button
              type="button"
              onClick={() => setActiveSubTab('pipeline')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer ${
                activeSubTab === 'pipeline' ? 'bg-amber-500 text-slate-950' : 'text-slate-300'
              }`}
            >
              Investor Pipeline ({investors.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('enquiries')}
              className={`px-3 py-1.5 rounded-md text-xs font-bold cursor-pointer ${
                activeSubTab === 'enquiries' ? 'bg-amber-500 text-slate-950' : 'text-slate-300'
              }`}
            >
              Enquiries Inbox ({enquiries.length})
            </button>
          </div>
          <button
            type="button"
            onClick={() =>
              exportCorporatePdf(
                'Investor & Partnership Pipeline',
                'Truthful Cross-Border Pipeline Record (Ghana -> Cameroon)',
                investors.map((inv) => ({
                  heading: inv.investorName,
                  rows: [
                    ['Origin Country', inv.investorCountry],
                    ['Target Investment Country', inv.targetCountry],
                    ['Registration Jurisdiction', inv.registrationJurisdiction],
                    ['Pipeline Stage', inv.stageLabel || inv.stage],
                    ['Sectors', Array.isArray(inv.sectorFocus) ? inv.sectorFocus.join(', ') : String(inv.sectorFocus || '')],
                    ['Compliance Status', inv.complianceStatus],
                    ['Disclaimer', inv.ownershipImplicationNote],
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
                'Investors',
                'madecc-investors-pipeline',
                ['Name', 'Origin', 'Target', 'Jurisdiction', 'Stage', 'Compliance', 'Public Opportunity'],
                investors.map((i) => [i.investorName, i.investorCountry, i.targetCountry, i.registrationJurisdiction, i.stageLabel, i.complianceStatus, i.publishAsOpportunity ? 'Yes' : 'No'])
              )
            }
            className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-200 hover:border-amber-500/50 inline-flex items-center gap-1.5 cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" /> XLSX
          </button>
          <button
            type="button"
            onClick={() => downloadCorporateServerExport(activeSubTab === 'enquiries' ? 'enquiries' : 'investors', 'csv')}
            className="px-3 py-2 rounded-lg border border-slate-800 bg-slate-900 text-xs text-slate-200 hover:border-amber-500/50 cursor-pointer"
          >
            CSV
          </button>
          <button
            type="button"
            onClick={() => setNewInvModal(true)}
            className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" /> Add Investor Prospect
          </button>
        </div>
      </div>

      {activeSubTab === 'enquiries' ? (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-5 bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-3">
            <select
              value={enquiryFilter}
              onChange={(e) => setEnquiryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
            >
              <option value="ALL">All Enquiry Categories ({enquiries.length})</option>
              {[
                'Real estate investment',
                'Pharmaceutical partnerships',
                'Construction project financing',
                'Agricultural investments',
                'Manufacturing investments',
                'Infrastructure partnerships',
                'International business collaboration',
              ].map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {enquiries
                .filter((e) => enquiryFilter === 'ALL' || e.enquiryType === enquiryFilter)
                .map((enq) => (
                  <button
                    key={enq.id}
                    type="button"
                    onClick={() => {
                      setSelectedEnq(enq);
                      setReplyText(enq.adminResponse || '');
                    }}
                    className={`w-full text-left p-3.5 rounded-xl border transition-colors cursor-pointer ${
                      selectedEnq?.id === enq.id ? 'bg-slate-900 border-amber-500' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-amber-400 font-bold">{enq.enquiryReference}</span>
                      <span className={enq.status === 'RESPONDED' ? 'text-emerald-400' : 'text-sky-300'}>{enq.status}</span>
                    </div>
                    <div className="text-xs font-bold text-white mt-1">{enq.fullName} · {enq.organization || 'Individual'}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{enq.enquiryType} · {enq.country}</div>
                  </button>
                ))}
              {enquiries.length === 0 && (
                <div className="p-6 text-center text-xs text-slate-500">No investor/partnership enquiries submitted yet.</div>
              )}
            </div>
          </div>

          <div className="xl:col-span-7 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-4">
            {!selectedEnq ? (
              <div className="p-8 text-center text-xs text-slate-500">Select an enquiry on the left to review details or send an SMTP email reply.</div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div>
                    <div className="text-xs font-mono text-amber-400">{selectedEnq.enquiryReference} · {selectedEnq.enquiryType}</div>
                    <h3 className="text-lg font-bold text-white">{selectedEnq.fullName}</h3>
                  </div>
                  <select
                    value={selectedEnq.status}
                    onChange={(e) => handleSaveEnquiry(e.target.value)}
                    className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                  >
                    {ENQUIRY_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs text-slate-300">
                  <div>Email: <span className="text-white">{selectedEnq.email}</span></div>
                  <div>Phone: <span className="text-white">{selectedEnq.phone || 'Not provided'}</span></div>
                  <div>Organization: <span className="text-white">{selectedEnq.organization || 'Individual'}</span></div>
                  <div>Country: <span className="text-white">{selectedEnq.country}</span></div>
                  <div>Indicative Budget: <span className="text-white">{selectedEnq.proposedBudget || 'Not specified'} {selectedEnq.currency}</span></div>
                  <div>Submitted: <span className="text-white">{new Date(selectedEnq.createdAt).toLocaleString()}</span></div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 whitespace-pre-wrap">
                  {selectedEnq.message}
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-800">
                  <label className="block space-y-1 text-xs">
                    <span className="text-slate-400 font-medium">Executive Response / Follow-up Message</span>
                    <textarea
                      rows={4}
                      placeholder="Write your official response to this enquiry..."
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                    />
                  </label>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sendReplyEmail}
                        onChange={(e) => setSendReplyEmail(e.target.checked)}
                        className="w-4 h-4 accent-amber-500"
                      />
                      <span>Send SMTP email reply to {selectedEnq.email}</span>
                    </label>
                    <button
                      type="button"
                      disabled={savingEnq}
                      onClick={() => handleSaveEnquiry('RESPONDED')}
                      className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs cursor-pointer"
                    >
                      {savingEnq ? 'Saving...' : 'Save & Send Reply'}
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      ) : (
      /* Main Layout */
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        <div className="xl:col-span-4 bg-slate-950 border border-slate-800 rounded-2xl p-4 space-y-2.5">
          {loading ? (
            <div className="p-6 text-xs text-slate-400 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-500" /> Loading investors...
            </div>
          ) : (
            investors.map((inv) => (
              <button
                key={inv.id}
                type="button"
                onClick={() => {
                  setSelectedId(inv.id);
                  setEditForm({
                    ...inv,
                    sectorFocus: Array.isArray(inv.sectorFocus) ? inv.sectorFocus.join(', ') : inv.sectorFocus || '',
                  });
                }}
                className={`w-full text-left p-3.5 rounded-xl border transition-colors cursor-pointer ${
                  selectedId === inv.id ? 'bg-slate-900 border-amber-500' : 'bg-slate-900/40 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-[11px] font-mono text-amber-400">
                  {inv.investorCountry} → {inv.targetCountry} · {inv.stageLabel}
                </div>
                <div className="text-xs font-bold text-white mt-1">{inv.investorName}</div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Jurisdiction: {inv.registrationJurisdiction} · {inv.complianceStatus}
                </div>
              </button>
            ))
          )}
        </div>

        <div className="xl:col-span-8 bg-slate-950 border border-slate-800 rounded-2xl p-6 space-y-5">
          {!editForm ? (
            <div className="text-xs text-slate-500 p-8 text-center">Select an investor profile to manage workflow and documents.</div>
          ) : (
            <>
              <div className="p-3 rounded-xl bg-amber-950/20 border border-amber-500/30 text-xs text-amber-200 flex items-start gap-2.5">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <strong>Compliance Notice:</strong> {editForm.ownershipImplicationNote} Advancing to{' '}
                  <span className="font-mono">Agreement signed</span> or <span className="font-mono">Funding received and verified</span> requires at least one verified investor document.
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-3">
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Handshake className="w-4 h-4 text-amber-500" /> {editForm.investorName}
                </h3>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleShareOpportunity}
                    className="px-3 py-1.5 rounded-lg border border-slate-800 bg-slate-900 text-xs text-emerald-300 hover:border-emerald-500/50 inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share Public Brief
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveInvestor}
                    disabled={saving}
                    className="px-4 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Save className="w-3.5 h-3.5" /> {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>

              {shareOutput && (
                <div className="p-3 rounded-xl bg-emerald-950/30 border border-emerald-500/30 text-xs flex items-center justify-between gap-2">
                  <span className="font-mono text-emerald-200 break-all">{shareOutput}</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(shareOutput);
                      showToast('Copied public opportunity share link', 'success');
                    }}
                    className="text-amber-400 inline-flex items-center gap-1 shrink-0 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" /> Copy
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <label className="space-y-1">
                  <span className="text-slate-400">Investor Origin Country</span>
                  <input
                    type="text"
                    value={editForm.investorCountry || ''}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, investorCountry: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-slate-400">Proposed Investment Country</span>
                  <input
                    type="text"
                    value={editForm.targetCountry || ''}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, targetCountry: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </label>
                <label className="space-y-1">
                  <span className="text-slate-400">Registration Jurisdiction</span>
                  <input
                    type="text"
                    value={editForm.registrationJurisdiction || ''}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, registrationJurisdiction: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </label>

                <label className="space-y-1 sm:col-span-2">
                  <span className="text-slate-400">Workflow Stage (14 Controlled Stages)</span>
                  <select
                    value={editForm.stage || 'POTENTIAL_INVESTOR'}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, stage: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  >
                    {stages.map((st) => (
                      <option key={st.code} value={st.code}>
                        {st.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-1">
                  <span className="text-slate-400">Compliance / KYC</span>
                  <select
                    value={editForm.complianceStatus || 'KYC_PENDING'}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, complianceStatus: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  >
                    <option value="KYC_PENDING">KYC Pending</option>
                    <option value="KYC_IN_REVIEW">KYC In Review</option>
                    <option value="KYC_VERIFIED">KYC Verified</option>
                    <option value="ON_HOLD">On Hold</option>
                  </select>
                </label>

                <label className="space-y-1 sm:col-span-3">
                  <span className="text-slate-400">Target Sectors (comma separated)</span>
                  <input
                    type="text"
                    value={Array.isArray(editForm.sectorFocus) ? editForm.sectorFocus.join(', ') : editForm.sectorFocus || ''}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, sectorFocus: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </label>

                <label className="space-y-1 sm:col-span-3">
                  <span className="text-slate-400">Confidential Internal Notes (Never Public)</span>
                  <textarea
                    rows={2}
                    value={editForm.confidentialNotes || ''}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, confidentialNotes: e.target.value }))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
                  />
                </label>

                <label className="flex items-center gap-2 sm:col-span-3 text-xs text-slate-200 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editForm.publishAsOpportunity)}
                    onChange={(e) => setEditForm((p: any) => ({ ...p, publishAsOpportunity: e.target.checked }))}
                    className="w-4 h-4 accent-amber-500"
                  />
                  <span>Publish Sanitized Opportunity Desk Overview on Public Website (strips confidential notes &amp; personal data)</span>
                </label>
              </div>

              {/* Documents */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider">Confidential Feasibility, NDA &amp; MOU Dossier</h4>
                <form onSubmit={handleUploadDoc} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="Document title"
                    value={docForm.title}
                    onChange={(e) => setDocForm((p) => ({ ...p, title: e.target.value }))}
                    className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                  />
                  <select
                    value={docForm.docType}
                    onChange={(e) => setDocForm((p) => ({ ...p, docType: e.target.value }))}
                    className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                  >
                    <option value="FEASIBILITY_STUDY">Feasibility Study</option>
                    <option value="PROJECT_PROPOSAL">Project Proposal</option>
                    <option value="NDA">NDA (Proposed/Signed)</option>
                    <option value="MOU_DRAFT">MOU Draft</option>
                    <option value="KYC_DOSSIER">KYC / Source of Funds</option>
                  </select>
                  <input
                    type="file"
                    onChange={(e) => setDocForm((p) => ({ ...p, file: e.target.files?.[0] || null }))}
                    className="px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white inline-flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-amber-400" /> Upload Doc
                  </button>
                </form>

                {(editForm.documents || []).map((doc: any) => (
                  <div key={doc.id} className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs flex items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-white">{doc.title}</div>
                      <div className="text-[11px] font-mono text-slate-400">
                        {doc.docType} · {doc.status} · Confidential
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {doc.status !== 'VERIFIED' && (
                        <button
                          type="button"
                          onClick={() => handleReviewDoc(doc.id, 'VERIFIED')}
                          className="px-2 py-1 rounded bg-emerald-500/20 text-emerald-300 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <CheckCircle2 className="w-3 h-3" /> Verify
                        </button>
                      )}
                      {doc.status !== 'REJECTED' && (
                        <button
                          type="button"
                          onClick={() => handleReviewDoc(doc.id, 'REJECTED')}
                          className="px-2 py-1 rounded bg-rose-500/20 text-rose-300 inline-flex items-center gap-1 cursor-pointer"
                        >
                          <XCircle className="w-3 h-3" /> Reject
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Interactions */}
              <div className="pt-4 border-t border-slate-800 space-y-3">
                <h4 className="text-xs font-bold text-amber-500 uppercase tracking-wider">Meetings &amp; Communication Timeline</h4>
                <form onSubmit={handleAddInteraction} className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Meeting / Call Subject"
                    value={interactionForm.subject}
                    onChange={(e) => setInteractionForm((p) => ({ ...p, subject: e.target.value }))}
                    className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                  />
                  <input
                    type="text"
                    required
                    placeholder="Summary of discussion"
                    value={interactionForm.summary}
                    onChange={(e) => setInteractionForm((p) => ({ ...p, summary: e.target.value }))}
                    className="sm:col-span-2 px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                  />
                  <button
                    type="submit"
                    className="px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white inline-flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <MessageSquarePlus className="w-3.5 h-3.5 text-amber-400" /> Log Note
                  </button>
                </form>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {(editForm.interactions || []).map((item: any) => (
                    <div key={item.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs">
                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                        <span className="text-amber-400">{item.interactionType}</span>
                        <span>{new Date(item.interactionDate).toLocaleString()}</span>
                      </div>
                      <div className="font-bold text-white mt-0.5">{item.subject}</div>
                      <p className="text-slate-300 mt-0.5">{item.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      )}

      {/* Add Prospect Modal */}
      {newInvModal && (
        <div className="fixed inset-0 z-50 bg-black/75 flex items-center justify-center p-4">
          <form onSubmit={handleCreateInvestor} className="bg-slate-950 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-3 text-xs">
            <h3 className="text-base font-bold text-white">Register Prospective Investor / Partner</h3>
            <input
              type="text"
              required
              placeholder="Investor Name or Entity"
              value={newInv.investorName}
              onChange={(e) => setNewInv((p) => ({ ...p, investorName: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
            />
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Origin Country (e.g. Ghana)"
                value={newInv.investorCountry}
                onChange={(e) => setNewInv((p) => ({ ...p, investorCountry: e.target.value }))}
                className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
              />
              <input
                type="text"
                placeholder="Target Country (e.g. Cameroon)"
                value={newInv.targetCountry}
                onChange={(e) => setNewInv((p) => ({ ...p, targetCountry: e.target.value }))}
                className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
              />
            </div>
            <textarea
              rows={2}
              placeholder="Summary of exploratory discussions"
              value={newInv.summary}
              onChange={(e) => setNewInv((p) => ({ ...p, summary: e.target.value }))}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-white"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button type="button" onClick={() => setNewInvModal(false)} className="px-3 py-2 text-slate-400 cursor-pointer">
                Cancel
              </button>
              <button type="submit" className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold cursor-pointer">
                Create Prospect
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
