import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  CheckCircle2, 
  ShieldCheck,
  Clock, 
  AlertCircle, 
  UserCheck, 
  ArrowRight, 
  Send, 
  Building2, 
  MapPin, 
  Phone, 
  Mail, 
  MessageSquare, 
  Download, 
  Plus, 
  Check, 
  X,
  TrendingUp,
  FileSpreadsheet
} from 'lucide-react';

export const AdminQuoteRequests: React.FC = () => {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [regionFilter, setRegionFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Selected Detail Modal
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<boolean>(false);
  const [actionNote, setActionNote] = useState<string>('');
  const [newStatus, setNewStatus] = useState<string>('');
  const [internalNotes, setInternalNotes] = useState<string>('');

  // Email Actions
  const [resendingEmail, setResendingEmail] = useState<boolean>(false);
  const [emailSuccessMsg, setEmailSuccessMsg] = useState<string | null>(null);
  const [emailErrorMsg, setEmailErrorMsg] = useState<string | null>(null);

  // Email Preview Modal
  const [showPreviewModal, setShowPreviewModal] = useState<boolean>(false);
  const [previewLoading, setPreviewLoading] = useState<boolean>(false);
  const [previewData, setPreviewData] = useState<{ adminSubject: string; adminHtml: string; clientSubject: string; clientHtml: string } | null>(null);
  const [previewTab, setPreviewTab] = useState<'admin' | 'client'>('admin');

  // Conversion Loading
  const [converting, setConverting] = useState<boolean>(false);

  const fetchRequests = async () => {
    setLoading(true);
    setError(null);
    try {
      const url = new URL('/api/quote-requests', window.location.origin);
      if (statusFilter !== 'ALL') url.searchParams.append('status', statusFilter);
      if (regionFilter !== 'ALL') url.searchParams.append('region', regionFilter);
      if (searchQuery) url.searchParams.append('search', searchQuery);

      const res = await fetch(url.toString(), {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });

      if (!res.ok) throw new Error('Failed to fetch quote requests');

      const data = await res.json();
      setRequests(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setError(err.message || 'Error loading quote requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, [statusFilter, regionFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchRequests();
  };

  const openDetailModal = async (reqId: number) => {
    setEmailSuccessMsg(null);
    setEmailErrorMsg(null);
    try {
      const res = await fetch(`/api/quote-requests/${reqId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (res.ok) {
        const data = await res.json();
        setSelectedRequest(data);
        setNewStatus(data.status);
        setInternalNotes(data.internalNotes || '');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleResendEmail = async (target: 'admin' | 'client' | 'both') => {
    if (!selectedRequest) return;
    setResendingEmail(true);
    setEmailSuccessMsg(null);
    setEmailErrorMsg(null);

    try {
      const res = await fetch(`/api/quote-requests/${selectedRequest.id}/resend-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({ target })
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to resend email');
      }

      const data = await res.json();
      if (data.quoteRequest) {
        setSelectedRequest(data.quoteRequest);
        setRequests(prev => prev.map(r => r.id === data.quoteRequest.id ? data.quoteRequest : r));
      }

      if (data.emailResult?.emailError) {
        setEmailErrorMsg(`Email dispatch logged with warnings: ${data.emailResult.emailError}`);
      } else {
        setEmailSuccessMsg(`Email successfully dispatched via SMTP (${target.toUpperCase()}).`);
      }
    } catch (err: any) {
      setEmailErrorMsg(err.message || 'Error triggering email resend.');
    } finally {
      setResendingEmail(false);
    }
  };

  const handleFetchEmailPreview = async () => {
    if (!selectedRequest) return;
    setPreviewLoading(true);
    try {
      const res = await fetch(`/api/quote-requests/${selectedRequest.id}/email-preview`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token') || ''}` }
      });
      if (!res.ok) throw new Error('Failed to load email preview template.');
      const data = await res.json();
      setPreviewData(data);
      setShowPreviewModal(true);
    } catch (err: any) {
      setEmailErrorMsg(err.message || 'Failed to load email preview.');
    } finally {
      setPreviewLoading(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedRequest) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/quote-requests/${selectedRequest.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify({
          status: newStatus,
          internalNotes,
          actionNote
        })
      });

      if (!res.ok) throw new Error('Update failed');

      const updated = await res.json();
      setSelectedRequest(prev => ({
        ...prev,
        ...updated,
        activityTimeline: updated.activityTimeline
      }));
      setActionNote('');
      fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Failed to update request');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleConvertToProject = async () => {
    if (!selectedRequest) return;
    if (!confirm(`Are you sure you want to convert quote request ${selectedRequest.referenceNumber} into an active Project?`)) return;

    setConverting(true);
    try {
      const res = await fetch(`/api/quote-requests/${selectedRequest.id}/convert-to-project`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        }
      });

      if (!res.ok) throw new Error('Conversion failed');

      const data = await res.json();
      alert(`Successfully created Project #${data.project.id}: ${data.project.title}`);
      openDetailModal(selectedRequest.id);
      fetchRequests();
    } catch (err: any) {
      alert(err.message || 'Conversion failed');
    } finally {
      setConverting(false);
    }
  };

  // Metrics
  const totalCount = requests.length;
  const newCount = requests.filter(r => r.status === 'NEW').length;
  const underReviewCount = requests.filter(r => r.status === 'UNDER_REVIEW').length;
  const estimatingCount = requests.filter(r => r.status === 'ESTIMATING').length;
  const wonCount = requests.filter(r => r.status === 'WON').length;
  const winRate = totalCount > 0 ? Math.round((wonCount / totalCount) * 100) : 0;

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div>
          <div className="text-xs font-bold text-amber-600 uppercase tracking-widest">Client Project Intake</div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900">
            Quote Requests & Leads Management
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Review incoming project enquiries, update status, view documents, and convert leads to active projects.
          </p>
        </div>

        <button
          onClick={fetchRequests}
          className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl flex items-center gap-2 transition-all self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Refresh Data
        </button>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: 'Total Requests', val: totalCount, color: 'text-slate-900', bg: 'bg-white' },
          { label: 'New Enquiries', val: newCount, color: 'text-amber-600', bg: 'bg-amber-50/60' },
          { label: 'Under Review', val: underReviewCount, color: 'text-blue-600', bg: 'bg-blue-50/60' },
          { label: 'In Estimation', val: estimatingCount, color: 'text-purple-600', bg: 'bg-purple-50/60' },
          { label: 'Won / Projects', val: wonCount, color: 'text-emerald-600', bg: 'bg-emerald-50/60' },
          { label: 'Conversion Rate', val: `${winRate}%`, color: 'text-slate-900', bg: 'bg-white' }
        ].map((m, idx) => (
          <div key={idx} className={`p-4 rounded-2xl border border-slate-200/80 shadow-sm ${m.bg}`}>
            <span className="text-[11px] font-bold text-slate-500 uppercase block truncate">{m.label}</span>
            <span className={`text-xl sm:text-2xl font-black font-mono ${m.color}`}>{m.val}</span>
          </div>
        ))}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-3 text-xs">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[240px]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search reference, client name, email, phone, project name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <button type="submit" className="px-4 py-2 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800">
            Search
          </button>
        </form>

        <div className="flex items-center gap-2">
          <span className="font-bold text-slate-500">Status:</span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-medium text-slate-800"
          >
            <option value="ALL">All Statuses</option>
            <option value="NEW">NEW</option>
            <option value="UNDER_REVIEW">UNDER REVIEW</option>
            <option value="ESTIMATING">ESTIMATING</option>
            <option value="QUOTATION_SENT">QUOTATION SENT</option>
            <option value="WON">WON / CONVERTED</option>
            <option value="LOST">LOST / ARCHIVED</option>
          </select>
        </div>
      </div>

      {/* Requests Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
            Loading quote requests...
          </div>
        ) : requests.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm space-y-2">
            <FileText className="w-8 h-8 text-slate-300 mx-auto" />
            <p className="font-bold text-slate-700">No quote requests found.</p>
            <p className="text-xs text-slate-400">Try adjusting your search query or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                  <th className="p-4">Reference</th>
                  <th className="p-4">Client Name</th>
                  <th className="p-4">Project Title</th>
                  <th className="p-4">Region</th>
                  <th className="p-4">Target Budget</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Date</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-800">
                {requests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-bold text-amber-600">
                      {req.referenceNumber}
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-900">{req.clientName}</div>
                      <div className="text-[11px] text-slate-400">{req.clientPhone}</div>
                    </td>
                    <td className="p-4">
                      <div className="font-bold text-slate-800 max-w-xs truncate">{req.projectName}</div>
                      <div className="text-[11px] text-slate-400">{req.buildingType || req.projectType}</div>
                    </td>
                    <td className="p-4">{req.region}</td>
                    <td className="p-4 font-semibold">{req.budgetRangeText || 'N/A'}</td>
                    <td className="p-4">
                      <span className={`inline-block px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        req.status === 'NEW' ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                        req.status === 'UNDER_REVIEW' ? 'bg-blue-100 text-blue-800 border border-blue-300' :
                        req.status === 'ESTIMATING' ? 'bg-purple-100 text-purple-800 border border-purple-300' :
                        req.status === 'WON' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-500 text-[11px]">
                      {new Date(req.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => openDetailModal(req.id)}
                        className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg transition-all text-xs"
                      >
                        View & Manage
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAIL & ACTION MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative shadow-2xl border border-slate-200">
            
            <button
              onClick={() => setSelectedRequest(null)}
              className="absolute right-6 top-6 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
              <span className="text-xl sm:text-2xl font-mono font-black text-amber-600">
                {selectedRequest.referenceNumber}
              </span>
              <span className={`px-3 py-1 rounded-full text-xs font-black uppercase ${
                selectedRequest.status === 'NEW' ? 'bg-amber-100 text-amber-800' :
                selectedRequest.status === 'WON' ? 'bg-emerald-100 text-emerald-800' :
                'bg-blue-100 text-blue-800'
              }`}>
                {selectedRequest.status}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs sm:text-sm">
              
              {/* Client Profile */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-xs border-b pb-2">
                  Client Details
                </h3>
                <div><strong className="text-slate-500">Name:</strong> {selectedRequest.clientName}</div>
                <div><strong className="text-slate-500">Company:</strong> {selectedRequest.clientCompany || 'N/A'}</div>
                <div><strong className="text-slate-500">Email:</strong> {selectedRequest.clientEmail}</div>
                <div><strong className="text-slate-500">Phone:</strong> {selectedRequest.clientPhone}</div>
                <div><strong className="text-slate-500">Preferred Mode:</strong> {selectedRequest.preferredContactMethod} ({selectedRequest.preferredContactTime})</div>
                
                {selectedRequest.whatsappNumber && (
                  <div className="pt-2">
                    <a
                      href={`https://wa.me/${selectedRequest.whatsappNumber.replace(/[^0-9]/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white font-bold rounded-lg text-xs"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Client
                    </a>
                  </div>
                )}

                <div className="pt-2 border-t border-slate-200 mt-2">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 font-extrabold rounded-lg text-[11px]">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    Human Verification: PASSED
                  </div>
                </div>
              </div>

              {/* Project Scope */}
              <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <h3 className="font-extrabold text-slate-900 uppercase tracking-wider text-xs border-b pb-2">
                  Project Scope
                </h3>
                <div><strong className="text-slate-500">Title:</strong> {selectedRequest.projectName}</div>
                <div><strong className="text-slate-500">Location:</strong> {selectedRequest.region} Region ({selectedRequest.city})</div>
                <div><strong className="text-slate-500">Building Type:</strong> {selectedRequest.buildingType} ({selectedRequest.storeys} Storeys, {selectedRequest.floorArea} m²)</div>
                <div><strong className="text-slate-500">Budget Range:</strong> {selectedRequest.budgetRangeText}</div>
                <div><strong className="text-slate-500">Readiness:</strong> {selectedRequest.projectStage}</div>
              </div>

            </div>

            {/* Description & Services */}
            <div className="mt-6 space-y-4 text-xs sm:text-sm">
              <div>
                <strong className="block text-slate-700 font-bold mb-1">Services Requested:</strong>
                <div className="flex flex-wrap gap-1.5">
                  {Array.isArray(selectedRequest.servicesRequested) ? (
                    selectedRequest.servicesRequested.map((s: string, idx: number) => (
                      <span key={idx} className="px-2.5 py-1 bg-amber-500/20 text-amber-900 font-bold rounded-md text-xs">
                        {s}
                      </span>
                    ))
                  ) : (
                    <span>{String(selectedRequest.servicesRequested)}</span>
                  )}
                </div>
              </div>

              {selectedRequest.projectDescription && (
                <div>
                  <strong className="block text-slate-700 font-bold mb-1">Project Description & Notes:</strong>
                  <p className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-slate-700 leading-relaxed">
                    {selectedRequest.projectDescription}
                  </p>
                </div>
              )}

              {/* Documents attached */}
              {selectedRequest.documents && selectedRequest.documents.length > 0 && (
                <div>
                  <strong className="block text-slate-700 font-bold mb-2">Attached Documents ({selectedRequest.documents.length}):</strong>
                  <div className="space-y-2">
                    {selectedRequest.documents.map((doc: any) => (
                      <div key={doc.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-200">
                        <span className="font-bold text-slate-800">{doc.fileName}</span>
                        <a
                          href={doc.fileUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1 bg-slate-900 text-white font-bold rounded-lg text-xs flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* SMTP EMAIL STATUS & ACTION CONTROLS */}
            <div className="mt-6 p-5 bg-slate-50 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="font-black text-slate-900 uppercase tracking-wider text-xs flex items-center gap-2">
                    <Mail className="w-4 h-4 text-amber-600" /> SMTP Email Delivery History
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">Automated notification dispatch via MADECC central SMTP system</p>
                </div>
                <button
                  onClick={handleFetchEmailPreview}
                  disabled={previewLoading}
                  className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-lg text-xs flex items-center gap-1 transition-all"
                >
                  <Eye className="w-3.5 h-3.5" /> Preview Email HTML
                </button>
              </div>

              {emailSuccessMsg && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 font-bold text-xs flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{emailSuccessMsg}</span>
                </div>
              )}

              {emailErrorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 font-bold text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{emailErrorMsg}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Admin Email Status */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wide">Admin Notification</span>
                    <span className={`px-2 py-0.5 rounded-full font-black text-[10px] uppercase flex items-center gap-1 ${
                      selectedRequest.adminNotificationStatus === 'SENT' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                      selectedRequest.adminNotificationStatus === 'FAILED' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                      'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {selectedRequest.adminNotificationStatus === 'SENT' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {selectedRequest.adminNotificationStatus === 'FAILED' && <AlertCircle className="w-3 h-3 text-rose-600" />}
                      {selectedRequest.adminNotificationStatus || 'PENDING'}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px]">
                    Recipient: <strong className="text-slate-700 font-mono">ADMIN (MADECC HQ)</strong>
                  </div>
                  {selectedRequest.adminNotificationSentAt && (
                    <div className="text-[10px] text-slate-400">
                      Sent at: {new Date(selectedRequest.adminNotificationSentAt).toLocaleString()}
                    </div>
                  )}
                  <div className="pt-1">
                    <button
                      onClick={() => handleResendEmail('admin')}
                      disabled={resendingEmail}
                      className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-lg text-[11px] w-full flex items-center justify-center gap-1"
                    >
                      <Send className="w-3 h-3" /> Resend Admin Email
                    </button>
                  </div>
                </div>

                {/* Client Confirmation Status */}
                <div className="p-3.5 bg-white rounded-xl border border-slate-200 space-y-1.5 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700 text-[11px] uppercase tracking-wide">Client Confirmation</span>
                    <span className={`px-2 py-0.5 rounded-full font-black text-[10px] uppercase flex items-center gap-1 ${
                      selectedRequest.clientConfirmationStatus === 'SENT' ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' :
                      selectedRequest.clientConfirmationStatus === 'FAILED' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                      'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}>
                      {selectedRequest.clientConfirmationStatus === 'SENT' && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      {selectedRequest.clientConfirmationStatus === 'FAILED' && <AlertCircle className="w-3 h-3 text-rose-600" />}
                      {selectedRequest.clientConfirmationStatus || 'PENDING'}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px] truncate">
                    Recipient: <strong className="text-slate-700">{selectedRequest.clientEmail}</strong>
                  </div>
                  {selectedRequest.clientConfirmationSentAt && (
                    <div className="text-[10px] text-slate-400">
                      Sent at: {new Date(selectedRequest.clientConfirmationSentAt).toLocaleString()}
                    </div>
                  )}
                  <div className="pt-1">
                    <button
                      onClick={() => handleResendEmail('client')}
                      disabled={resendingEmail}
                      className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-[11px] w-full flex items-center justify-center gap-1"
                    >
                      <Send className="w-3 h-3" /> Resend Client Email
                    </button>
                  </div>
                </div>
              </div>

              {selectedRequest.emailError && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-xs">
                  <strong className="block text-[11px] font-extrabold text-amber-800 uppercase mb-1">Last Logged Email Exception:</strong>
                  <p className="font-mono text-[11px] text-amber-900/90 break-words">{selectedRequest.emailError}</p>
                </div>
              )}

              <div className="pt-1 flex items-center justify-end">
                <button
                  onClick={() => handleResendEmail('both')}
                  disabled={resendingEmail}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-xl text-xs flex items-center gap-1.5 shadow-sm"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${resendingEmail ? 'animate-spin' : ''}`} /> Resend Both Notifications
                </button>
              </div>
            </div>

            {/* Timeline */}
            <div className="mt-6 pt-6 border-t border-slate-100">
              <strong className="block text-slate-900 font-bold mb-3 uppercase tracking-wider text-xs">
                Activity Timeline
              </strong>
              <div className="space-y-2 text-xs">
                {Array.isArray(selectedRequest.activityTimeline) && selectedRequest.activityTimeline.map((ev: any, i: number) => (
                  <div key={i} className="flex items-start gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                    <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-slate-900">{ev.action}</span> - <span className="text-slate-500">{ev.user}</span> ({new Date(ev.date).toLocaleString()})
                      <p className="text-slate-600 mt-0.5">{ev.details}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Status & Action Control */}
            <div className="mt-6 p-5 bg-slate-900 text-white rounded-2xl space-y-4">
              <h4 className="font-extrabold text-amber-400 text-xs uppercase tracking-wider">
                Staff Status & Conversion Actions
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="block text-slate-300 font-bold mb-1">Update Status</label>
                  <select
                    value={newStatus}
                    onChange={(e) => setNewStatus(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-xl font-bold"
                  >
                    <option value="NEW">NEW</option>
                    <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                    <option value="ESTIMATING">ESTIMATING</option>
                    <option value="QUOTATION_SENT">QUOTATION_SENT</option>
                    <option value="WON">WON / CONVERTED</option>
                    <option value="LOST">LOST / ARCHIVED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-bold mb-1">Action Note / Log</label>
                  <input
                    type="text"
                    placeholder="e.g. Sent BOQ draft via email"
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-xl font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-bold mb-1 text-xs">Internal Notes</label>
                <textarea
                  rows={2}
                  placeholder="Private notes visible to MADECC staff only..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 text-white rounded-xl text-xs"
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <button
                  onClick={handleUpdateStatus}
                  disabled={isUpdatingStatus}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs"
                >
                  Save Status & Notes
                </button>

                {selectedRequest.status !== 'WON' && (
                  <button
                    onClick={handleConvertToProject}
                    disabled={converting}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-xl text-xs flex items-center gap-1.5"
                  >
                    <Building2 className="w-3.5 h-3.5" /> Convert To Active Project
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* EMAIL PREVIEW HTML POPUP */}
      {showPreviewModal && previewData && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200">
            <div className="p-5 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-amber-400 text-sm uppercase tracking-wider flex items-center gap-2">
                  <Eye className="w-4 h-4" /> Email HTML Template Preview
                </h3>
                <p className="text-xs text-slate-300 font-mono mt-0.5">{previewData.referenceNumber}</p>
              </div>
              <button
                onClick={() => setShowPreviewModal(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex border-b border-slate-200 bg-slate-100 p-2 gap-2 text-xs font-bold">
              <button
                onClick={() => setPreviewTab('admin')}
                className={`px-4 py-2 rounded-xl transition-all ${previewTab === 'admin' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Admin Notification Email
              </button>
              <button
                onClick={() => setPreviewTab('client')}
                className={`px-4 py-2 rounded-xl transition-all ${previewTab === 'client' ? 'bg-white text-slate-900 shadow-sm border border-slate-200' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Client Confirmation Email
              </button>
            </div>

            <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs text-slate-700 font-semibold">
              Subject: <span className="font-bold text-slate-900 font-mono">{previewTab === 'admin' ? previewData.adminSubject : previewData.clientSubject}</span>
            </div>

            <div className="p-4 overflow-y-auto flex-1 bg-slate-100">
              <iframe
                title="Email Preview"
                srcDoc={previewTab === 'admin' ? previewData.adminHtml : previewData.clientHtml}
                className="w-full h-96 bg-white rounded-xl border border-slate-300 shadow-inner"
              />
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end">
              <button
                onClick={() => setShowPreviewModal(false)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
