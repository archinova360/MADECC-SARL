import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  HardHat, 
  Search, 
  Filter, 
  Eye, 
  FileText, 
  Download, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  ShieldCheck, 
  UserCheck, 
  Save, 
  X,
  Building2,
  Lock,
  History
} from 'lucide-react';
import { exportSupplierDossierPDF } from '../lib/exportEngine.ts';

interface SupplierApp {
  id: number;
  applicationNumber: string;
  companyName: string;
  registrationNumber: string;
  companyType: string;
  region: string;
  city: string;
  address: string;
  contactPerson: string;
  position: string;
  email: string;
  phone: string;
  whatsapp?: string;
  supplierCategory: string;
  products: string;
  yearsInBusiness: number;
  capacity?: string;
  previousProjects?: string;
  complianceDocuments?: { title: string; docType: string; fileUrl: string }[];
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'DOCUMENT_VERIFICATION' | 'APPROVED' | 'REJECTED' | 'NEEDS_INFORMATION' | 'SUSPENDED';
  reviewerNotes?: string;
  assignedReviewer?: string;
  createdAt: string;
}

interface SubcontractorApp {
  id: number;
  applicationNumber: string;
  companyName: string;
  trade: string;
  yearsInBusiness: number;
  workforceSize: number;
  equipmentOwned?: string;
  previousProjects?: string;
  region: string;
  city: string;
  contactPerson: string;
  email: string;
  phone: string;
  status: 'SUBMITTED' | 'UNDER_REVIEW' | 'DOCUMENT_VERIFICATION' | 'APPROVED' | 'REJECTED' | 'NEEDS_INFORMATION' | 'SUSPENDED';
  reviewerNotes?: string;
  assignedReviewer?: string;
  createdAt: string;
}

export const AdminSuppliers: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'suppliers' | 'subcontractors' | 'audit'>('suppliers');
  
  const [suppliers, setSuppliers] = useState<SupplierApp[]>([]);
  const [subcontractors, setSubcontractors] = useState<SubcontractorApp[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Drawer Detail State
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierApp | null>(null);
  const [selectedSubcontractor, setSelectedSubcontractor] = useState<SubcontractorApp | null>(null);

  // Reviewer Form State
  const [reviewerNotes, setReviewerNotes] = useState('');
  const [assignedReviewer, setAssignedReviewer] = useState('');
  const [appStatus, setAppStatus] = useState<string>('SUBMITTED');
  const [savingReview, setSavingReview] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    fetch('/api/admin/suppliers')
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          if (data.suppliers) setSuppliers(data.suppliers);
          if (data.subcontractors) setSubcontractors(data.subcontractors);
          if (data.auditLogs) setAuditLogs(data.auditLogs);
        }
      })
      .catch(err => console.error('Failed to load admin suppliers:', err));
  };

  const handleOpenSupplierDrawer = (sup: SupplierApp) => {
    setSelectedSupplier(sup);
    setReviewerNotes(sup.reviewerNotes || '');
    setAssignedReviewer(sup.assignedReviewer || 'Procurement Committee');
    setAppStatus(sup.status);
  };

  const handleSaveSupplierReview = async () => {
    if (!selectedSupplier) return;
    setSavingReview(true);

    try {
      const res = await fetch(`/api/admin/suppliers/${selectedSupplier.id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: appStatus,
          reviewerNotes,
          assignedReviewer
        })
      });

      const data = await res.json();
      if (data.success) {
        setSelectedSupplier(null);
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingReview(false);
    }
  };

  const handleOpenSubcontractorDrawer = (sub: SubcontractorApp) => {
    setSelectedSubcontractor(sub);
    setReviewerNotes(sub.reviewerNotes || '');
    setAssignedReviewer(sub.assignedReviewer || 'Engineering Operations Desk');
    setAppStatus(sub.status);
  };

  const handleSaveSubcontractorReview = async () => {
    if (!selectedSubcontractor) return;
    setSavingReview(true);

    try {
      const res = await fetch(`/api/admin/subcontractors/${selectedSubcontractor.id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: appStatus,
          reviewerNotes,
          assignedReviewer
        })
      });

      const data = await res.json();
      if (data.success) {
        setSelectedSubcontractor(null);
        loadData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingReview(false);
    }
  };

  const filteredSuppliers = suppliers.filter(s => {
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQ = !q || s.companyName.toLowerCase().includes(q) || s.supplierCategory.toLowerCase().includes(q) || s.applicationNumber.toLowerCase().includes(q);
    return matchesStatus && matchesQ;
  });

  const filteredSubcontractors = subcontractors.filter(s => {
    const matchesStatus = statusFilter === 'ALL' || s.status === statusFilter;
    const q = searchQuery.toLowerCase().trim();
    const matchesQ = !q || s.companyName.toLowerCase().includes(q) || s.trade.toLowerCase().includes(q) || s.applicationNumber.toLowerCase().includes(q);
    return matchesStatus && matchesQ;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return <span className="px-2.5 py-1 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-400 font-bold border border-emerald-500/30">APPROVED</span>;
      case 'UNDER_REVIEW':
        return <span className="px-2.5 py-1 rounded text-[10px] font-mono bg-amber-500/10 text-amber-400 font-bold border border-amber-500/30">UNDER REVIEW</span>;
      case 'DOCUMENT_VERIFICATION':
        return <span className="px-2.5 py-1 rounded text-[10px] font-mono bg-blue-500/10 text-blue-400 font-bold border border-blue-500/30">DOC VERIFICATION</span>;
      case 'REJECTED':
        return <span className="px-2.5 py-1 rounded text-[10px] font-mono bg-red-500/10 text-red-400 font-bold border border-red-500/30">REJECTED</span>;
      default:
        return <span className="px-2.5 py-1 rounded text-[10px] font-mono bg-slate-800 text-slate-300">{status}</span>;
    }
  };

  return (
    <div className="p-6 bg-slate-900 text-slate-100 rounded-2xl border border-slate-800">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-amber-400 uppercase tracking-widest mb-1">
            <Truck className="w-4 h-4" />
            <span>MADECC CMS • Procurement & Vendor Prequalification</span>
          </div>
          <h2 className="text-2xl font-bold text-white">Suppliers & Subcontractors Management</h2>
        </div>

        <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
          <Lock className="w-4 h-4 text-emerald-400" />
          <span>Confidential Prequalification Vault</span>
        </div>
      </div>

      {/* TABS & FILTERS BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-4 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer ${
              activeTab === 'suppliers'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            Material Suppliers ({suppliers.length})
          </button>

          <button
            onClick={() => setActiveTab('subcontractors')}
            className={`px-4 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer ${
              activeTab === 'subcontractors'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            Subcontractors ({subcontractors.length})
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-xl text-xs font-mono transition-all cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-amber-500 text-slate-950 font-bold'
                : 'bg-slate-950 text-slate-400 border border-slate-800 hover:text-white'
            }`}
          >
            Audit Logs
          </button>
        </div>

        {activeTab !== 'audit' && (
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input 
                type="text" 
                placeholder="Search vendor or category..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs focus:border-amber-500 focus:outline-none"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">SUBMITTED</option>
              <option value="UNDER_REVIEW">UNDER REVIEW</option>
              <option value="DOCUMENT_VERIFICATION">DOC VERIFICATION</option>
              <option value="APPROVED">APPROVED</option>
              <option value="REJECTED">REJECTED</option>
            </select>
          </div>
        )}

      </div>

      {/* TAB 1: SUPPLIERS */}
      {activeTab === 'suppliers' && (
        <div className="space-y-3">
          {filteredSuppliers.map((sup) => (
            <div key={sup.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-amber-400">{sup.applicationNumber}</span>
                  <span className="text-sm font-bold text-white">{sup.companyName}</span>
                  {getStatusBadge(sup.status)}
                </div>
                <p className="text-xs text-slate-400">
                  Category: <strong className="text-slate-200">{sup.supplierCategory}</strong> • Region: {sup.region} • Contact: {sup.contactPerson} ({sup.email})
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => exportSupplierDossierPDF(sup)}
                  className="p-2 text-slate-400 hover:text-amber-400"
                  title="Export Dossier PDF"
                >
                  <Download className="w-4 h-4" />
                </button>

                <button
                  onClick={() => handleOpenSupplierDrawer(sup)}
                  className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Review Dossier</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 2: SUBCONTRACTORS */}
      {activeTab === 'subcontractors' && (
        <div className="space-y-3">
          {filteredSubcontractors.map((sub) => (
            <div key={sub.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-mono text-xs font-bold text-amber-400">{sub.applicationNumber}</span>
                  <span className="text-sm font-bold text-white">{sub.companyName}</span>
                  {getStatusBadge(sub.status)}
                </div>
                <p className="text-xs text-slate-400">
                  Trade: <strong className="text-slate-200">{sub.trade}</strong> • Workforce: {sub.workforceSize} Skilled • Contact: {sub.contactPerson} ({sub.email})
                </p>
              </div>

              <button
                onClick={() => handleOpenSubcontractorDrawer(sub)}
                className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Review Application</span>
              </button>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="space-y-2">
          {auditLogs.map((log, i) => (
            <div key={i} className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono flex items-center justify-between">
              <span className="text-amber-400">{log.action}</span>
              <span className="text-slate-300">{log.recordTitle}</span>
              <span className="text-slate-500">{log.performedBy}</span>
              <span className="text-slate-500">{new Date(log.timestamp).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}

      {/* SUPPLIER DOSSIER REVIEW DRAWER */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-end p-0">
          <div className="bg-slate-900 border-l border-slate-800 max-w-xl w-full h-full p-6 relative overflow-y-auto shadow-2xl flex flex-col justify-between">
            
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div>
                  <span className="font-mono text-xs text-amber-400 font-bold block">{selectedSupplier.applicationNumber}</span>
                  <h3 className="text-xl font-bold text-white">{selectedSupplier.companyName}</h3>
                </div>
                <button onClick={() => setSelectedSupplier(null)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 text-xs text-slate-300">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono">
                  <div><span className="text-slate-500">Category:</span> {selectedSupplier.supplierCategory}</div>
                  <div><span className="text-slate-500">Reg No:</span> {selectedSupplier.registrationNumber} ({selectedSupplier.companyType})</div>
                  <div><span className="text-slate-500">Location:</span> {selectedSupplier.city}, {selectedSupplier.region}</div>
                  <div><span className="text-slate-500">Contact:</span> {selectedSupplier.contactPerson} ({selectedSupplier.position})</div>
                  <div><span className="text-slate-500">Email:</span> {selectedSupplier.email} | Phone: {selectedSupplier.phone}</div>
                </div>

                <div>
                  <h4 className="font-bold text-white mb-1">Products & Materials Supplied:</h4>
                  <p className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-slate-300">{selectedSupplier.products}</p>
                </div>

                {/* REVIEWER WORKFLOW FORM */}
                <div className="pt-4 border-t border-slate-800 space-y-4">
                  <h4 className="font-bold text-amber-400 uppercase tracking-wider text-xs font-mono">Prequalification Evaluation</h4>

                  <div>
                    <label className="block font-mono text-slate-400 mb-1">Application Pipeline Status</label>
                    <select
                      value={appStatus}
                      onChange={(e) => setAppStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono"
                    >
                      <option value="SUBMITTED">SUBMITTED</option>
                      <option value="UNDER_REVIEW">UNDER REVIEW</option>
                      <option value="DOCUMENT_VERIFICATION">DOCUMENT VERIFICATION</option>
                      <option value="APPROVED">APPROVED (PREQUALIFIED)</option>
                      <option value="NEEDS_INFORMATION">NEEDS INFORMATION</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-slate-400 mb-1">Assigned Evaluator</label>
                    <input 
                      type="text"
                      value={assignedReviewer}
                      onChange={(e) => setAssignedReviewer(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                    />
                  </div>

                  <div>
                    <label className="block font-mono text-slate-400 mb-1">Confidential Internal Notes</label>
                    <textarea
                      rows={4}
                      value={reviewerNotes}
                      onChange={(e) => setReviewerNotes(e.target.value)}
                      placeholder="Enter internal committee remarks, quality assessment, or missing tax clearances..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 flex items-center justify-between">
              <button
                onClick={() => exportSupplierDossierPDF(selectedSupplier)}
                className="px-4 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs font-medium flex items-center gap-1.5"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Export Dossier</span>
              </button>

              <button
                onClick={handleSaveSupplierReview}
                disabled={savingReview}
                className="px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg"
              >
                <Save className="w-4 h-4" />
                <span>Save Review</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SUBCONTRACTOR REVIEW DRAWER */}
      {selectedSubcontractor && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-end p-0">
          <div className="bg-slate-900 border-l border-slate-800 max-w-xl w-full h-full p-6 relative overflow-y-auto shadow-2xl flex flex-col justify-between">
            
            <div>
              <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-6">
                <div>
                  <span className="font-mono text-xs text-amber-400 font-bold block">{selectedSubcontractor.applicationNumber}</span>
                  <h3 className="text-xl font-bold text-white">{selectedSubcontractor.companyName}</h3>
                </div>
                <button onClick={() => setSelectedSubcontractor(null)} className="text-slate-400 hover:text-white p-1">
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-4 text-xs text-slate-300">
                <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2 font-mono">
                  <div><span className="text-slate-500">Trade Specialty:</span> {selectedSubcontractor.trade}</div>
                  <div><span className="text-slate-500">Skilled Workforce:</span> {selectedSubcontractor.workforceSize} Tradespeople</div>
                  <div><span className="text-slate-500">Location:</span> {selectedSubcontractor.city}, {selectedSubcontractor.region}</div>
                  <div><span className="text-slate-500">Contact Person:</span> {selectedSubcontractor.contactPerson}</div>
                  <div><span className="text-slate-500">Email:</span> {selectedSubcontractor.email} | Phone: {selectedSubcontractor.phone}</div>
                </div>

                <div className="pt-4 border-t border-slate-800 space-y-4">
                  <h4 className="font-bold text-amber-400 uppercase tracking-wider text-xs font-mono">Subcontractor Evaluation</h4>

                  <div>
                    <label className="block font-mono text-slate-400 mb-1">Status</label>
                    <select
                      value={appStatus}
                      onChange={(e) => setAppStatus(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs font-mono"
                    >
                      <option value="SUBMITTED">SUBMITTED</option>
                      <option value="UNDER_REVIEW">UNDER REVIEW</option>
                      <option value="APPROVED">APPROVED (PREQUALIFIED)</option>
                      <option value="REJECTED">REJECTED</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-mono text-slate-400 mb-1">Confidential Review Remarks</label>
                    <textarea
                      rows={4}
                      value={reviewerNotes}
                      onChange={(e) => setReviewerNotes(e.target.value)}
                      placeholder="Add trade qualification evaluation remarks..."
                      className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white text-xs"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-800 flex items-center justify-end">
              <button
                onClick={handleSaveSubcontractorReview}
                disabled={savingReview}
                className="px-6 py-2.5 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg"
              >
                <Save className="w-4 h-4" />
                <span>Save Review</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
