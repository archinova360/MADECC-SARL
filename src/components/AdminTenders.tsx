import React, { useState, useEffect } from 'react';
import { 
  Briefcase, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Copy, 
  Search, 
  Filter, 
  Download, 
  FileText, 
  Save, 
  X, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  History,
  Building2,
  Calendar,
  MapPin,
  Upload,
  CheckCircle,
  XCircle,
  ExternalLink,
  Mail,
  Loader2,
  FileSpreadsheet,
  FileDown
} from 'lucide-react';
import { 
  exportTenderNoticePDF, 
  exportTenderNoticeDOCX, 
  exportEoiDossierPDF, 
  exportAllTendersPDF, 
  exportAllEoisPDF 
} from '../lib/exportEngine.ts';

interface Tender {
  id: number;
  tenderNumber: string;
  title: string;
  slug: string;
  categoryName: string;
  clientProject: string;
  location: string;
  description: string;
  scopeOfWork: string;
  eligibility: string;
  requiredExperience?: string;
  requiredDocuments?: string;
  submissionMethod?: string;
  openingDate: string;
  closingDate: string;
  status: 'DRAFT' | 'PENDING_REVIEW' | 'APPROVED' | 'OPEN' | 'CLOSING_SOON' | 'CLOSED' | 'AWARDED' | 'CANCELLED' | 'ARCHIVED';
  contactInstructions?: string;
  attachments?: any[];
}

interface EoiSubmission {
  id: number;
  submissionNumber: string;
  tenderId: number;
  tenderReference: string;
  companyName: string;
  contactPerson: string;
  email: string;
  phone: string;
  expressionOfInterest: string;
  supportingDocuments?: any[];
  status: string;
  internalEvaluationNotes?: string;
  reviewNotes?: string;
  evaluatedBy?: string;
  createdAt: string;
}

export const AdminTenders: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'tenders' | 'eois' | 'audit'>('tenders');
  
  const [tenders, setTenders] = useState<Tender[]>([]);
  const [eois, setEois] = useState<EoiSubmission[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Tender Modal
  const [tenderModalOpen, setTenderModalOpen] = useState(false);
  const [editingTender, setEditingTender] = useState<Partial<Tender> | null>(null);
  const [savingTender, setSavingTender] = useState(false);

  // EOI Detail Modal
  const [selectedEoi, setSelectedEoi] = useState<EoiSubmission | null>(null);
  const [eoiReviewNotes, setEoiReviewNotes] = useState('');
  const [eoiStatus, setEoiStatus] = useState('SUBMITTED');
  const [notifyCandidate, setNotifyCandidate] = useState(true);
  const [savingEoiReview, setSavingEoiReview] = useState(false);

  const [msg, setMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setLoading(true);
    fetch('/api/admin/tenders')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.tenders) setTenders(data.tenders);
          if (data.eois) setEois(data.eois);
          if (data.auditLogs) setAuditLogs(data.auditLogs);
        }
      })
      .catch(err => console.error('Failed to load admin tenders:', err))
      .finally(() => setLoading(false));
  };

  const handleSaveTender = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTender?.title || !editingTender?.tenderNumber) return;

    setSavingTender(true);
    try {
      const res = await fetch('/api/admin/tenders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingTender)
      });
      const data = await res.json();
      if (data.success) {
        setTenderModalOpen(false);
        setEditingTender(null);
        setMsg({ text: 'Tender notice saved and updated in database successfully!', type: 'success' });
        loadData();
      } else {
        throw new Error(data.error || 'Failed to save tender notice');
      }
    } catch (err: any) {
      setMsg({ text: err.message || 'Save failed', type: 'error' });
    } finally {
      setSavingTender(false);
    }
  };

  const handleStatusChange = async (tender: Tender, newStatus: string) => {
    try {
      const res = await fetch(`/api/admin/tenders/${tender.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ text: `Tender ${tender.tenderNumber} status updated to ${newStatus}`, type: 'success' });
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteTender = async (id: number) => {
    if (!confirm('Are you sure you want to delete this tender notice?')) return;
    try {
      const res = await fetch(`/api/admin/tenders/${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setMsg({ text: 'Tender notice removed from active records.', type: 'success' });
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDuplicateTender = async (tender: Tender) => {
    try {
      const copyNum = `${tender.tenderNumber}-CPY${Math.floor(10 + Math.random() * 90)}`;
      const res = await fetch('/api/admin/tenders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...tender,
          id: undefined,
          tenderNumber: copyNum,
          title: `${tender.title} (Duplicate)`,
          status: 'DRAFT'
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ text: `Duplicated tender as ${copyNum} in DRAFT status.`, type: 'success' });
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveEoiReview = async () => {
    if (!selectedEoi) return;
    setSavingEoiReview(true);
    try {
      const res = await fetch(`/api/admin/tenders/eois/${selectedEoi.id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: eoiStatus,
          reviewNotes: eoiReviewNotes,
          notifyCandidate
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ text: `EOI ${selectedEoi.submissionNumber} review saved (${eoiStatus}). ${notifyCandidate ? 'Candidate notified via email.' : ''}`, type: 'success' });
        setSelectedEoi(null);
        loadData();
      }
    } catch (err: any) {
      setMsg({ text: err.message || 'Failed to save review', type: 'error' });
    } finally {
      setSavingEoiReview(false);
    }
  };

  const handleQuickEoiAction = async (eoi: EoiSubmission, status: string) => {
    try {
      const res = await fetch(`/api/admin/tenders/eois/${eoi.id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          reviewNotes: `Quick approved by Procurement Admin on ${new Date().toLocaleDateString()}`,
          notifyCandidate: true
        })
      });
      const data = await res.json();
      if (data.success) {
        setMsg({ text: `EOI ${eoi.submissionNumber} marked as ${status} & candidate notified.`, type: 'success' });
        loadData();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const filteredTenders = tenders.filter(t => {
    const matchesStatus = statusFilter === 'ALL' || t.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQ = !q || t.title?.toLowerCase().includes(q) || t.tenderNumber?.toLowerCase().includes(q) || t.location?.toLowerCase().includes(q);
    return matchesStatus && matchesQ;
  });

  const filteredEois = eois.filter(e => {
    const q = searchQuery.toLowerCase().trim();
    return !q || e.companyName?.toLowerCase().includes(q) || e.submissionNumber?.toLowerCase().includes(q) || e.tenderReference?.toLowerCase().includes(q) || e.contactPerson?.toLowerCase().includes(q);
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'OPEN':
      case 'APPROVED':
      case 'SHORTLISTED':
      case 'ACCEPTED':
      case 'PREQUALIFIED':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30">{status}</span>;
      case 'CLOSING_SOON':
      case 'UNDER_REVIEW':
      case 'RECEIVED':
      case 'SUBMITTED':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 font-bold border border-amber-500/30">{status}</span>;
      case 'CLOSED':
      case 'REJECTED':
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-red-500/10 text-red-400 font-bold border border-red-500/30">{status}</span>;
      case 'DRAFT':
      default:
        return <span className="px-2.5 py-0.5 rounded text-[10px] font-mono bg-slate-800 text-slate-300">{status}</span>;
    }
  };

  return (
    <div className="p-6 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-widest mb-1">
            <Briefcase className="w-4 h-4" />
            <span>MADECC CMS • Procurement & Tenders</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Tenders & Expressions of Interest (EOI) Management</h2>
          <p className="text-xs text-slate-400 mt-1">
            Publish tender notices, review and approve contractor submissions, and export official A4 PDF dossiers.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => exportAllTendersPDF(tenders)}
            className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Download full tenders catalog as A4 PDF"
          >
            <Download className="w-3.5 h-3.5 text-amber-400" />
            <span>Export Tenders (A4 PDF)</span>
          </button>

          <button
            onClick={() => exportAllEoisPDF(eois)}
            className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow-sm"
            title="Download full EOI candidates register as A4 PDF"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export EOIs (A4 PDF)</span>
          </button>

          <button
            onClick={() => {
              setEditingTender({ 
                categoryName: 'Structural Works', 
                status: 'OPEN', 
                tenderNumber: `TND-2026-MDCC-${Math.floor(100 + Math.random() * 900)}`,
                title: 'Subcontract Supply & Erection of Structural Steel Framing for Commercial Complex',
                clientProject: 'Douala Commercial Hub Phase II',
                location: 'Douala, Littoral Region',
                description: 'MADECC is calling for Expressions of Interest (EOI) from certified structural steel fabrication subcontractors for the supply, galvanization, transport, and site erection of 350 Metric Tons of structural steel framework.',
                scopeOfWork: 'Detailed workshop fabrication drawings, precision CNC steel cutting and welding, anti-corrosion shop primer coating, transport to project site, crane hoisting, and high-strength bolted assembly.',
                eligibility: 'Subcontractors must possess proven technical capacity with minimum 5 years in heavy structural steel works in CEMAC, valid tax compliance certificate, and ISO/HSE safety qualification.',
                requiredDocuments: 'Company Registration, Tax Clearance, Past Contract Certificates, Key Staff CVs, HSE Policy, Audited Financial Statements.',
                submissionMethod: 'Online EOI Dossier Submission via MADECC Portal or physical submission at MADECC Head Office.',
                openingDate: '2026-08-11',
                closingDate: '2026-09-10'
              });
              setTenderModalOpen(true);
            }}
            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-md"
          >
            <Plus className="w-4 h-4" />
            <span>Publish New Tender</span>
          </button>
        </div>
      </div>

      {msg && (
        <div className={`mb-6 p-4 rounded-xl text-xs flex items-center justify-between ${msg.type === 'success' ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border border-red-500/30 text-red-400'}`}>
          <span>{msg.text}</span>
          <button onClick={() => setMsg(null)} className="p-1 hover:opacity-80"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* TABS & FILTERS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('tenders')}
            className={`px-4 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer ${
              activeTab === 'tenders'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            Tender Notices ({tenders.length})
          </button>

          <button
            onClick={() => setActiveTab('eois')}
            className={`px-4 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer ${
              activeTab === 'eois'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            Candidate EOIs ({eois.length})
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            Audit History
          </button>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input 
              type="text" 
              placeholder={activeTab === 'tenders' ? "Search tender or location..." : "Search candidate company, ref..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
            />
          </div>

          {activeTab === 'tenders' && (
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none font-mono"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">OPEN</option>
              <option value="CLOSING_SOON">CLOSING SOON</option>
              <option value="CLOSED">CLOSED</option>
              <option value="DRAFT">DRAFT</option>
            </select>
          )}
        </div>
      </div>

      {/* TAB 1: TENDERS TABLE */}
      {activeTab === 'tenders' && (
        <div className="space-y-3">
          {filteredTenders.length === 0 ? (
            <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-400 text-xs">
              No tenders found matching criteria.
            </div>
          ) : (
            filteredTenders.map((tender) => (
              <div key={tender.id} className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-slate-700 transition-colors">
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">{tender.tenderNumber}</span>
                    <span className="text-sm font-bold text-white">{tender.title}</span>
                    {getStatusBadge(tender.status)}
                  </div>
                  <p className="text-xs text-slate-400">
                    Client/Project: <strong className="text-slate-200">{tender.clientProject}</strong> • Location: <strong className="text-slate-200">{tender.location}</strong> • Category: <span className="text-amber-400">{tender.categoryName}</span>
                  </p>
                  <p className="text-[11px] text-slate-500 font-mono">
                    Opening: {tender.openingDate ? new Date(tender.openingDate).toLocaleDateString() : 'Immediate'} | Closing: {tender.closingDate ? new Date(tender.closingDate).toLocaleDateString() : 'Open'}
                  </p>
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                  {/* Status Dropdown / Fast Publish */}
                  <select
                    value={tender.status}
                    onChange={(e) => handleStatusChange(tender, e.target.value)}
                    className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 text-xs font-mono focus:outline-none focus:border-amber-500"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="OPEN">OPEN (Published)</option>
                    <option value="CLOSING_SOON">CLOSING SOON</option>
                    <option value="CLOSED">CLOSED</option>
                    <option value="AWARDED">AWARDED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>

                  {/* A4 PDF Export */}
                  <button
                    onClick={() => exportTenderNoticePDF(tender)}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 transition-colors"
                    title="Download Official Notice as A4 PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {/* DOCX Export */}
                  <button
                    onClick={() => exportTenderNoticeDOCX(tender)}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-sky-400 border border-slate-800 transition-colors"
                    title="Download Notice as Word (.docx)"
                  >
                    <FileText className="w-4 h-4" />
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => {
                      setEditingTender({
                        ...tender,
                        openingDate: tender.openingDate ? new Date(tender.openingDate).toISOString().split('T')[0] : '',
                        closingDate: tender.closingDate ? new Date(tender.closingDate).toISOString().split('T')[0] : ''
                      });
                      setTenderModalOpen(true);
                    }}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors"
                    title="Edit Tender Notice"
                  >
                    <Edit className="w-4 h-4" />
                  </button>

                  {/* Duplicate */}
                  <button
                    onClick={() => handleDuplicateTender(tender)}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-emerald-400 border border-slate-800 transition-colors"
                    title="Duplicate Tender Notice"
                  >
                    <Copy className="w-4 h-4" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => handleDeleteTender(tender.id)}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-red-400 border border-slate-800 transition-colors"
                    title="Delete Tender Notice"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 2: EOIS */}
      {activeTab === 'eois' && (
        <div className="space-y-3">
          {filteredEois.length === 0 ? (
            <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-400 text-xs">
              No Expression of Interest submissions recorded yet.
            </div>
          ) : (
            filteredEois.map((eoi) => (
              <div key={eoi.id} className="p-5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 hover:border-slate-700 transition-colors">
                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">{eoi.submissionNumber}</span>
                    <span className="text-sm font-bold text-white">{eoi.companyName}</span>
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">Ref: {eoi.tenderReference}</span>
                    {getStatusBadge(eoi.status)}
                  </div>
                  <p className="text-xs text-slate-300">
                    Contact: <strong className="text-white">{eoi.contactPerson}</strong> • Email: <a href={`mailto:${eoi.email}`} className="text-sky-400 hover:underline">{eoi.email}</a> • Phone/WA: <strong className="text-slate-200">{eoi.phone}</strong>
                  </p>
                  <p className="text-[11px] text-slate-400 line-clamp-1 italic">
                    "{eoi.expressionOfInterest}"
                  </p>
                  {Array.isArray(eoi.supportingDocuments) && eoi.supportingDocuments.length > 0 && (
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {eoi.supportingDocuments.map((doc, idx) => (
                        <a 
                          key={idx}
                          href={doc.fileUrl || doc.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] font-mono bg-slate-900 text-emerald-400 px-2 py-0.5 rounded border border-slate-800 hover:border-emerald-500/50"
                        >
                          <FileText className="w-3 h-3 text-amber-400" />
                          <span>{doc.title || doc.fileName || `Attachment ${idx + 1}`}</span>
                          <ExternalLink className="w-2.5 h-2.5 ml-0.5 text-slate-400" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800">
                  {/* Quick Shortlist / Approve */}
                  {eoi.status !== 'SHORTLISTED' && eoi.status !== 'APPROVED' && (
                    <button
                      onClick={() => handleQuickEoiAction(eoi, 'SHORTLISTED')}
                      className="px-2.5 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-medium flex items-center gap-1 cursor-pointer"
                      title="Quick Shortlist and Notify Candidate"
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Shortlist</span>
                    </button>
                  )}

                  {/* Export Dossier as A4 PDF */}
                  <button
                    onClick={() => {
                      const matchedTender = tenders.find(t => t.tenderNumber === eoi.tenderReference || t.id === eoi.tenderId);
                      exportEoiDossierPDF(eoi, matchedTender);
                    }}
                    className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-amber-400 border border-slate-800 transition-colors"
                    title="Export Candidate Evaluation Dossier as A4 PDF"
                  >
                    <Download className="w-4 h-4" />
                  </button>

                  {/* Open Detailed Review Modal */}
                  <button
                    onClick={() => {
                      setSelectedEoi(eoi);
                      setEoiReviewNotes(eoi.internalEvaluationNotes || eoi.reviewNotes || '');
                      setEoiStatus(eoi.status || 'RECEIVED');
                      setNotifyCandidate(true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 cursor-pointer shadow-sm"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Review & Evaluate</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: AUDIT HISTORY */}
      {activeTab === 'audit' && (
        <div className="space-y-2">
          {auditLogs.length === 0 ? (
            <div className="p-8 text-center bg-slate-950 rounded-2xl border border-slate-800 text-slate-400 text-xs">
              No audit logs recorded yet.
            </div>
          ) : (
            auditLogs.map((log, i) => (
              <div key={i} className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">{log.action}</span>
                  <span className="text-white font-sans font-medium">{log.recordTitle}</span>
                </div>
                <div className="flex items-center gap-4 text-slate-400 text-[11px]">
                  <span>By: {log.changedBy || log.performedBy || 'System'}</span>
                  <span>{new Date(log.createdAt || log.timestamp).toLocaleString()}</span>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* EDIT / CREATE TENDER MODAL */}
      {tenderModalOpen && editingTender && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto shadow-2xl">
            <button 
              onClick={() => setTenderModalOpen(false)}
              className="absolute top-6 right-6 text-slate-400 hover:text-white p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
              <Briefcase className="w-5 h-5 text-amber-500" />
              <span>{editingTender.id ? 'Edit Tender Opportunity Notice' : 'Publish New Tender Opportunity Notice'}</span>
            </h3>
            <p className="text-xs font-mono text-slate-400 mb-6">
              Saved notices are persisted directly to the live Neon PostgreSQL database and rendered live in the procurement portal.
            </p>

            <form onSubmit={handleSaveTender} className="space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Tender Reference No *</label>
                  <input 
                    type="text" 
                    required
                    value={editingTender.tenderNumber || ''}
                    onChange={(e) => setEditingTender({ ...editingTender, tenderNumber: e.target.value })}
                    placeholder="e.g. TND-2026-MDCC-001"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Category *</label>
                  <input 
                    type="text" 
                    required
                    value={editingTender.categoryName || ''}
                    onChange={(e) => setEditingTender({ ...editingTender, categoryName: e.target.value })}
                    placeholder="e.g. Structural Works"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Tender Title *</label>
                <input 
                  type="text" 
                  required
                  value={editingTender.title || ''}
                  onChange={(e) => setEditingTender({ ...editingTender, title: e.target.value })}
                  placeholder="e.g. Subcontract Supply & Erection of Structural Steel Framing for Commercial Complex"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-medium focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Client / Project</label>
                  <input 
                    type="text" 
                    value={editingTender.clientProject || ''}
                    onChange={(e) => setEditingTender({ ...editingTender, clientProject: e.target.value })}
                    placeholder="e.g. Douala Commercial Hub Phase II"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Location</label>
                  <input 
                    type="text" 
                    value={editingTender.location || ''}
                    onChange={(e) => setEditingTender({ ...editingTender, location: e.target.value })}
                    placeholder="e.g. Douala, Littoral Region"
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">1. Overview & Project Context</label>
                <textarea
                  rows={3}
                  value={editingTender.description || ''}
                  onChange={(e) => setEditingTender({ ...editingTender, description: e.target.value })}
                  placeholder="MADECC is calling for Expressions of Interest (EOI) from certified structural steel fabrication subcontractors for the supply, galvanization, transport, and site erection of 350 Metric Tons of structural steel framework."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs leading-relaxed focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">2. Detailed Scope of Work</label>
                <textarea
                  rows={3}
                  value={editingTender.scopeOfWork || ''}
                  onChange={(e) => setEditingTender({ ...editingTender, scopeOfWork: e.target.value })}
                  placeholder="Detailed workshop fabrication drawings, precision CNC steel cutting and welding, anti-corrosion shop primer coating, transport to project site, crane hoisting, and high-strength bolted assembly."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs leading-relaxed focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">3. Eligibility & Technical Prequalification</label>
                <textarea
                  rows={2}
                  value={editingTender.eligibility || ''}
                  onChange={(e) => setEditingTender({ ...editingTender, eligibility: e.target.value })}
                  placeholder="Subcontractors must possess proven technical capacity with minimum 5 years in heavy structural steel works in CEMAC, valid tax compliance certificate, and ISO/HSE safety qualification."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs leading-relaxed focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">4. Mandatory Supporting Documents</label>
                <textarea
                  rows={2}
                  value={editingTender.requiredDocuments || ''}
                  onChange={(e) => setEditingTender({ ...editingTender, requiredDocuments: e.target.value })}
                  placeholder="Company Registration, Tax Clearance, Past Contract Certificates, Key Staff CVs, HSE Policy, Audited Financial Statements."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs leading-relaxed focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Notice Opening Date</label>
                  <input 
                    type="date" 
                    value={editingTender.openingDate || ''}
                    onChange={(e) => setEditingTender({ ...editingTender, openingDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Submission Deadline</label>
                  <input 
                    type="date" 
                    value={editingTender.closingDate || ''}
                    onChange={(e) => setEditingTender({ ...editingTender, closingDate: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-300 mb-1">Status</label>
                  <select
                    value={editingTender.status || 'OPEN'}
                    onChange={(e) => setEditingTender({ ...editingTender, status: e.target.value as any })}
                    className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                  >
                    <option value="DRAFT">DRAFT</option>
                    <option value="OPEN">OPEN (Published)</option>
                    <option value="CLOSING_SOON">CLOSING SOON</option>
                    <option value="CLOSED">CLOSED</option>
                    <option value="AWARDED">AWARDED</option>
                    <option value="CANCELLED">CANCELLED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-300 mb-1">Submission & Contact Instructions</label>
                <input 
                  type="text" 
                  value={editingTender.contactInstructions || ''}
                  onChange={(e) => setEditingTender({ ...editingTender, contactInstructions: e.target.value })}
                  placeholder="For tender clarifications, contact procurement@madeccgroup.com or call +237 683 316 486."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setTenderModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingTender}
                  className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
                >
                  {savingTender ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Saving Tender...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      <span>Save Tender Notice</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* REVIEW EOI MODAL */}
      {selectedEoi && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 relative shadow-2xl">
            
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-slate-800">
              <div>
                <span className="font-mono text-xs text-amber-400 font-bold block">{selectedEoi.submissionNumber}</span>
                <h3 className="text-lg font-bold text-white">{selectedEoi.companyName}</h3>
              </div>
              <button onClick={() => setSelectedEoi(null)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs text-slate-300">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Tender Reference:</span>
                  <span className="text-amber-400 font-bold">{selectedEoi.tenderReference}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Contact Representative:</span>
                  <span className="text-white">{selectedEoi.contactPerson}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Email Address:</span>
                  <a href={`mailto:${selectedEoi.email}`} className="text-sky-400">{selectedEoi.email}</a>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Phone / WhatsApp:</span>
                  <span className="text-white">{selectedEoi.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Submitted On:</span>
                  <span className="text-slate-400">{new Date(selectedEoi.createdAt).toLocaleString()}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-white font-mono text-xs uppercase mb-1 text-amber-400">Technical Capacity & Machinery Statement:</h4>
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 whitespace-pre-wrap max-h-36 overflow-y-auto leading-relaxed">
                  {selectedEoi.expressionOfInterest || 'No text statement provided.'}
                </div>
              </div>

              {Array.isArray(selectedEoi.supportingDocuments) && selectedEoi.supportingDocuments.length > 0 && (
                <div>
                  <h4 className="font-bold text-white font-mono text-xs uppercase mb-1 text-amber-400">Attached Technical Dossiers:</h4>
                  <div className="space-y-1.5">
                    {selectedEoi.supportingDocuments.map((doc, idx) => (
                      <a 
                        key={idx}
                        href={doc.fileUrl || doc.url}
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-emerald-400 hover:border-emerald-500/50"
                      >
                        <div className="flex items-center gap-2 truncate">
                          <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                          <span className="truncate">{doc.title || doc.fileName || `Technical Dossier File ${idx + 1}`}</span>
                        </div>
                        <ExternalLink className="w-3.5 h-3.5 text-slate-400 shrink-0 ml-2" />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block font-mono text-slate-400 mb-1">Evaluation & Prequalification Status *</label>
                <select
                  value={eoiStatus}
                  onChange={(e) => setEoiStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono focus:border-amber-500 focus:outline-none"
                >
                  <option value="SUBMITTED">SUBMITTED (Pending Review)</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW</option>
                  <option value="PREQUALIFIED">PREQUALIFIED FOR BIDDING</option>
                  <option value="SHORTLISTED">SHORTLISTED</option>
                  <option value="ACCEPTED">ACCEPTED / AWARDED</option>
                  <option value="REJECTED">REJECTED / NON-COMPLIANT</option>
                </select>
              </div>

              <div>
                <label className="block font-mono text-slate-400 mb-1">Internal Evaluation Remarks / Notes</label>
                <textarea
                  rows={3}
                  value={eoiReviewNotes}
                  onChange={(e) => setEoiReviewNotes(e.target.value)}
                  placeholder="e.g. Verified RCCM, valid tax clearance, and proven capacity in heavy steel framing. Approved for shortlist."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
                />
              </div>

              <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer pt-1">
                <input 
                  type="checkbox" 
                  checked={notifyCandidate} 
                  onChange={(e) => setNotifyCandidate(e.target.checked)}
                  className="w-4 h-4 rounded text-amber-500 bg-slate-950 border-slate-800 focus:ring-amber-500"
                />
                <span>Send status update notification email to <strong>{selectedEoi.email}</strong> via SMTP</span>
              </label>

              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    const matchedTender = tenders.find(t => t.tenderNumber === selectedEoi.tenderReference || t.id === selectedEoi.tenderId);
                    exportEoiDossierPDF(selectedEoi, matchedTender);
                  }}
                  className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 text-amber-400 text-xs font-mono flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Dossier A4 PDF</span>
                </button>

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedEoi(null)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveEoiReview}
                    disabled={savingEoiReview}
                    className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-2 cursor-pointer shadow-md"
                  >
                    {savingEoiReview ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Evaluation</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
