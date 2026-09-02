import React, { useState, useEffect } from 'react';
import { 
  Key, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Search, 
  RefreshCw, 
  DollarSign, 
  ShieldAlert, 
  FileText, 
  ExternalLink, 
  Layers, 
  BarChart3, 
  Activity, 
  AlertTriangle,
  Copy,
  Eye,
  Lock,
  Smartphone,
  CreditCard,
  UserCheck,
  TrendingUp,
  Database,
  Filter,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { useToast } from './Toast.tsx';
import { getAuthToken } from '../lib/firebase.ts';

interface AdminApiPlatformProps {
  onBackToDashboard?: () => void;
}

export default function AdminApiPlatform({ onBackToDashboard }: AdminApiPlatformProps) {
  const { showToast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'requests' | 'products' | 'keys' | 'usage' | 'audit'>('overview');
  const [loading, setLoading] = useState(false);

  // Data states
  const [overviewData, setOverviewData] = useState<any>({
    totalCustomers: 0,
    pendingRequests: 0,
    activeKeys: 0,
    totalRequests24h: 0,
    recentRequests: [],
    recentTransactions: [],
    topEndpoints: []
  });
  const [requests, setRequests] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [plans, setPlans] = useState<any[]>([]);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [usageLogs, setUsageLogs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Review Modal State
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [reviewAction, setReviewAction] = useState<'APPROVED' | 'REJECTED'>('APPROVED');
  const [reviewNotes, setReviewNotes] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  // Helper for auth headers
  const getHeaders = async () => {
    const token = await getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token || ''}`
    };
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const headers = await getHeaders();

      // Parallel fetching for dashboard & subtabs
      const [ovRes, reqRes, prodRes, planRes, keyRes, useRes, audRes] = await Promise.all([
        fetch('/api/v1/admin/overview', { headers }).then(r => r.ok ? r.json() : null).catch(() => null),
        fetch('/api/v1/admin/requests', { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/v1/products').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/v1/plans').then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/v1/admin/keys', { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/v1/admin/usage', { headers }).then(r => r.ok ? r.json() : []).catch(() => []),
        fetch('/api/v1/admin/audit-logs', { headers }).then(r => r.ok ? r.json() : []).catch(() => [])
      ]);

      if (ovRes) setOverviewData(ovRes);
      if (reqRes) setRequests(reqRes);
      if (prodRes) setProducts(prodRes);
      if (planRes) setPlans(planRes);
      if (keyRes) setApiKeys(keyRes);
      if (useRes) setUsageLogs(useRes);
      if (audRes) setAuditLogs(audRes);
    } catch (err: any) {
      console.error('Error fetching API Platform data:', err);
      showToast('Could not load some API platform metrics', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReviewSubmit = async () => {
    if (!selectedRequest) return;
    setIsSubmittingReview(true);
    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/v1/admin/requests/${selectedRequest.id}/review`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          status: reviewAction,
          notes: reviewNotes
        })
      });

      if (res.ok) {
        showToast(`Request marked as ${reviewAction} successfully!`, 'success');
        setSelectedRequest(null);
        setReviewNotes('');
        loadData();
      } else {
        const data = await res.json();
        showToast(data.error || 'Failed to review request', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating request', 'error');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleToggleKeyStatus = async (keyId: number, currentStatus: string) => {
    const nextStatus = currentStatus === 'ACTIVE' ? 'REVOKED' : 'ACTIVE';
    try {
      const headers = await getHeaders();
      const res = await fetch(`/api/v1/admin/keys/${keyId}/toggle`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ status: nextStatus })
      });

      if (res.ok) {
        showToast(`API Key marked as ${nextStatus}`, 'success');
        loadData();
      } else {
        showToast('Failed to change key status', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error updating key', 'error');
    }
  };

  const filteredRequests = requests.filter(r => {
    const matchesSearch = 
      (r.customerName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.customerEmail || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.txReference || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.planCode || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || r.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6" id="admin-api-platform-root">
      {/* Top Header Card */}
      <div className="bg-slate-800/90 border border-slate-700/80 rounded-xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 text-amber-400 font-mono text-xs uppercase tracking-wider mb-1">
              <Key className="w-4 h-4" />
              <span>MADECC Cloud Enterprise API Gateway</span>
            </div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              API Platform & Monetization Management
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                Live Neon DB + MoMo Engine
              </span>
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Govern external developer access, verify MTN/Orange Mobile Money payments, manage API keys, and monitor real-time calculation endpoints.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg text-sm transition-all border border-slate-600"
              title="Refresh API Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <a
              href="#/developers"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-semibold rounded-lg text-sm transition-all shadow-md"
            >
              <ExternalLink className="w-4 h-4" />
              <span>Public Dev Portal</span>
            </a>
          </div>
        </div>

        {/* Sub Navigation Tabs */}
        <div className="flex items-center gap-2 mt-6 border-b border-slate-700/80 pb-3 overflow-x-auto text-sm">
          {[
            { id: 'overview', label: 'Dashboard Overview', icon: LayoutDashboardIcon },
            { id: 'requests', label: 'Access Requests & MoMo Proofs', icon: CreditCard, count: requests.filter(r => r.status === 'PENDING').length },
            { id: 'products', label: 'API Products & Plans', icon: Layers },
            { id: 'keys', label: 'Active API Keys', icon: Key, count: apiKeys.filter(k => k.status === 'ACTIVE').length },
            { id: 'usage', label: 'Telemetry & Request Logs', icon: Activity },
            { id: 'audit', label: 'Platform Audit Trail', icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeSubTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-700/50'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* SUB-VIEW 1: OVERVIEW */}
      {activeSubTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metrics Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Pending Approvals</span>
                <Clock className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-3xl font-bold text-white">
                {overviewData.pendingRequests || requests.filter(r => r.status === 'PENDING').length}
              </div>
              <p className="text-xs text-amber-400/90 mt-1 flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" /> Requires admin verification
              </p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>Active API Keys</span>
                <Key className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-3xl font-bold text-white">
                {overviewData.activeKeys || apiKeys.filter(k => k.status === 'ACTIVE').length}
              </div>
              <p className="text-xs text-emerald-400 mt-1">Cryptographically hashed</p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>24h API Volume</span>
                <Activity className="w-4 h-4 text-cyan-400" />
              </div>
              <div className="text-3xl font-bold text-white">
                {overviewData.totalRequests24h || usageLogs.length}
              </div>
              <p className="text-xs text-cyan-400 mt-1">Calculations executed</p>
            </div>

            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between text-slate-400 text-xs font-semibold uppercase tracking-wider mb-2">
                <span>API Products</span>
                <Layers className="w-4 h-4 text-purple-400" />
              </div>
              <div className="text-3xl font-bold text-white">
                {products.length || 5}
              </div>
              <p className="text-xs text-slate-400 mt-1">BOQ, Concrete, Rebar, Costs, Eurocode</p>
            </div>
          </div>

          {/* Quick Action & Payment Config Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Payment Coordinates Box */}
            <div className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 shadow-sm space-y-3">
              <h3 className="text-base font-semibold text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-amber-400" />
                Live Payment Collection Channels
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Customers transmit funds to these accounts when purchasing access. Verify incoming SMS reference before approving:
              </p>
              
              <div className="space-y-2 text-xs">
                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700">
                  <span className="text-amber-400 font-bold block mb-1">MTN Mobile Money (Cameroon)</span>
                  <div className="font-mono text-slate-300 space-y-0.5">
                    <div>• 671 063 511 (Kasah Rodrick Reboya)</div>
                    <div>• 683 316 486</div>
                    <div>• 671 289 643</div>
                  </div>
                </div>

                <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700">
                  <span className="text-orange-400 font-bold block mb-1">Orange Money (Cameroon)</span>
                  <div className="font-mono text-slate-300 space-y-0.5">
                    <div>• 689 115 595</div>
                    <div>• 640 194 505</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Pending Requests Preview Box */}
            <div className="lg:col-span-2 bg-slate-800/80 border border-slate-700 rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-semibold text-white flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  Recent Pending Verification Requests
                </h3>
                <button
                  onClick={() => setActiveSubTab('requests')}
                  className="text-xs text-amber-400 hover:text-amber-300 font-medium"
                >
                  View All ({requests.length})
                </button>
              </div>

              {requests.filter(r => r.status === 'PENDING').length === 0 ? (
                <div className="text-center py-8 text-slate-500 text-sm">
                  <CheckCircle className="w-8 h-8 text-emerald-500/40 mx-auto mb-2" />
                  No pending access requests waiting for review!
                </div>
              ) : (
                <div className="space-y-2">
                  {requests.filter(r => r.status === 'PENDING').slice(0, 4).map(req => (
                    <div key={req.id} className="bg-slate-900/60 border border-slate-700/60 p-3 rounded-lg flex items-center justify-between gap-3 text-xs">
                      <div>
                        <div className="font-semibold text-white flex items-center gap-2">
                          <span>{req.customerName || req.customerEmail}</span>
                          <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px]">
                            {req.planCode}
                          </span>
                        </div>
                        <div className="text-slate-400 font-mono mt-0.5">
                          Ref: {req.txReference || 'N/A'} • {req.paymentMethod || 'MOMO'} • {req.amount ? `${req.amount.toLocaleString()} XAF` : 'Custom'}
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedRequest(req);
                          setActiveSubTab('requests');
                        }}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-md transition-all"
                      >
                        Verify & Review
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 2: ACCESS REQUESTS & MOMO PROOFS */}
      {activeSubTab === 'requests' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="bg-slate-800/80 border border-slate-700 p-4 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search by customer name, email, transaction ref..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-900 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full md:w-auto">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="PENDING">Pending Review</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
              </select>
            </div>
          </div>

          {/* Table */}
          <div className="bg-slate-800/90 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Customer & Org</th>
                    <th className="px-4 py-3">Plan / Product</th>
                    <th className="px-4 py-3">Payment Info</th>
                    <th className="px-4 py-3">Tx Reference</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Submitted</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 font-mono text-xs">
                  {filteredRequests.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-sans text-sm">
                        No access requests found matching your filter criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredRequests.map(req => (
                      <tr key={req.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3 font-sans">
                          <div className="font-semibold text-white">{req.customerName || 'Developer'}</div>
                          <div className="text-slate-400 text-xs">{req.customerEmail}</div>
                          {req.organization && <div className="text-slate-500 text-[11px]">{req.organization}</div>}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                            {req.planCode}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div>{req.paymentMethod || 'MOMO'}</div>
                          <div className="text-slate-400">{req.amount ? `${req.amount.toLocaleString()} XAF` : '-'}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {req.txReference || '<None>'}
                        </td>
                        <td className="px-4 py-3">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-sans font-semibold ${
                            req.status === 'APPROVED' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            req.status === 'REJECTED' ? 'bg-red-500/20 text-red-400 border border-red-500/30' :
                            'bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse'
                          }`}>
                            {req.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {req.createdAt ? new Date(req.createdAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-right font-sans">
                          <button
                            onClick={() => setSelectedRequest(req)}
                            className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-slate-200 hover:text-white rounded-md transition-all text-xs font-medium"
                          >
                            Review Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 3: PRODUCTS & PLANS */}
      {activeSubTab === 'products' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {products.map(prod => (
              <div key={prod.id} className="bg-slate-800/80 border border-slate-700 rounded-xl p-5 shadow-sm space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-5 h-5 text-amber-400" />
                    <h3 className="font-bold text-white text-base">{prod.name}</h3>
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-mono">
                    v1.0
                  </span>
                </div>
                <p className="text-xs text-slate-400 line-clamp-2">
                  {prod.description}
                </p>
                <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-mono">Scope: {prod.slug}</span>
                  <span className="text-emerald-400 font-semibold">{prod.basePrice ? `${prod.basePrice.toLocaleString()} XAF/mo` : 'Included in Plan'}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Plans Grid */}
          <div className="mt-8">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-amber-400" />
              Published Subscription Tiers
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {plans.map(pl => (
                <div key={pl.id} className="bg-slate-800/90 border border-slate-700 rounded-xl p-5 shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="text-xs font-mono uppercase text-amber-400 font-semibold">{pl.code}</div>
                    <h4 className="text-xl font-bold text-white mt-1">{pl.name}</h4>
                    <div className="text-2xl font-black text-amber-400 mt-2">
                      {pl.priceXaf === 0 ? 'Free Sandbox' : `${pl.priceXaf?.toLocaleString()} XAF`}
                      <span className="text-xs font-normal text-slate-400">/mo</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-2">{pl.description}</p>
                    
                    <div className="mt-4 pt-3 border-t border-slate-700/60 text-xs space-y-1.5 text-slate-300 font-mono">
                      <div>• Rate Limit: {pl.rateLimitRpm} req/min</div>
                      <div>• Monthly Quota: {pl.monthlyQuota?.toLocaleString() || 'Unlimited'}</div>
                      <div>• Max Keys: {pl.maxKeys || 1}</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 4: ACTIVE KEYS */}
      {activeSubTab === 'keys' && (
        <div className="space-y-4">
          <div className="bg-slate-800/90 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Key ID / Prefix</th>
                    <th className="px-4 py-3">Owner / Email</th>
                    <th className="px-4 py-3">Plan Entitlement</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Created</th>
                    <th className="px-4 py-3">Last Used</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 font-mono text-xs">
                  {apiKeys.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-slate-500 font-sans text-sm">
                        No active developer credentials issued yet.
                      </td>
                    </tr>
                  ) : (
                    apiKeys.map(k => (
                      <tr key={k.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-bold text-amber-400">{k.keyPrefix}...</div>
                          <div className="text-[10px] text-slate-500">{k.name || 'Default Key'}</div>
                        </td>
                        <td className="px-4 py-3 font-sans">
                          <div className="text-white">{k.customerEmail || 'Unknown'}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-0.5 rounded bg-slate-900 text-slate-300 border border-slate-700">
                            {k.planCode || 'DEVELOPER'}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-sans">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            k.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' :
                            'bg-red-500/20 text-red-400 border border-red-500/30'
                          }`}>
                            {k.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {k.createdAt ? new Date(k.createdAt).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-4 py-3 text-slate-400">
                          {k.lastUsedAt ? new Date(k.lastUsedAt).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-4 py-3 text-right font-sans">
                          <button
                            onClick={() => handleToggleKeyStatus(k.id, k.status)}
                            className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                              k.status === 'ACTIVE'
                                ? 'bg-red-600/80 hover:bg-red-600 text-white'
                                : 'bg-emerald-600/80 hover:bg-emerald-600 text-white'
                            }`}
                          >
                            {k.status === 'ACTIVE' ? 'Revoke Key' : 'Reactivate'}
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 5: USAGE & TELEMETRY */}
      {activeSubTab === 'usage' && (
        <div className="space-y-4">
          <div className="bg-slate-800/90 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-700 bg-slate-900/60 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-cyan-400" />
                Live API Invocation Stream
              </h3>
              <span className="text-xs text-slate-400">Showing last 50 requests</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-700 font-sans">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Method & Endpoint</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Latency</th>
                    <th className="px-4 py-3">Client Key</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 font-mono text-xs">
                  {usageLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500 font-sans text-sm">
                        No external API requests logged yet.
                      </td>
                    </tr>
                  ) : (
                    usageLogs.map(log => (
                      <tr key={log.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-2.5 text-slate-400">
                          {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : '-'}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="text-amber-400 font-bold mr-2">{log.httpMethod || 'POST'}</span>
                          <span className="text-slate-200">{log.endpoint}</span>
                        </td>
                        <td className="px-4 py-2.5 font-sans">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            log.statusCode >= 200 && log.statusCode < 300 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                          }`}>
                            {log.statusCode}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-slate-300">
                          {log.latencyMs ? `${log.latencyMs} ms` : '-'}
                        </td>
                        <td className="px-4 py-2.5 text-slate-400">
                          {log.keyPrefix ? `${log.keyPrefix}...` : 'Internal'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SUB-VIEW 6: AUDIT LOGS */}
      {activeSubTab === 'audit' && (
        <div className="space-y-4">
          <div className="bg-slate-800/90 border border-slate-700 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-700 bg-slate-900/60">
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-purple-400" />
                Administrative Platform Action Log
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-slate-900/80 text-xs font-semibold uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="px-4 py-3">Timestamp</th>
                    <th className="px-4 py-3">Action</th>
                    <th className="px-4 py-3">Performed By</th>
                    <th className="px-4 py-3">Resource</th>
                    <th className="px-4 py-3">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 font-mono text-xs">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-slate-500 font-sans text-sm">
                        No admin audit records recorded yet.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map(a => (
                      <tr key={a.id} className="hover:bg-slate-700/30 transition-colors">
                        <td className="px-4 py-3 text-slate-400">
                          {a.createdAt ? new Date(a.createdAt).toLocaleString() : '-'}
                        </td>
                        <td className="px-4 py-3 font-bold text-amber-400">
                          {a.action}
                        </td>
                        <td className="px-4 py-3 text-white font-sans">
                          {a.adminEmail || 'System'}
                        </td>
                        <td className="px-4 py-3 text-slate-300">
                          {a.resourceType || 'API'}
                        </td>
                        <td className="px-4 py-3 text-slate-400 font-sans text-xs">
                          {a.details || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* REVIEW & APPROVAL MODAL */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-amber-400" />
                Review API Access & Payment Proof
              </h3>
              <button
                onClick={() => setSelectedRequest(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="bg-slate-900/80 p-3.5 rounded-lg border border-slate-700 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Applicant:</span>
                  <span className="text-white font-semibold">{selectedRequest.customerName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Email:</span>
                  <span className="text-slate-300 font-mono">{selectedRequest.customerEmail}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Selected Plan:</span>
                  <span className="text-amber-400 font-bold">{selectedRequest.planCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Payment Channel:</span>
                  <span className="text-slate-200">{selectedRequest.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Tx Reference:</span>
                  <span className="text-emerald-400 font-mono font-bold">{selectedRequest.txReference || 'None'}</span>
                </div>
              </div>

              {/* Receipt File / Image Preview */}
              {selectedRequest.receiptUrl && (
                <div className="space-y-1">
                  <label className="text-xs text-slate-400 block font-medium">Payment Proof / Receipt Document:</label>
                  <a
                    href={selectedRequest.receiptUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-2 p-2 bg-slate-900 rounded-lg border border-slate-700 text-xs text-amber-400 hover:underline"
                  >
                    <FileText className="w-4 h-4" />
                    <span>View Full Uploaded Receipt / Transaction Document</span>
                    <ArrowUpRight className="w-3.5 h-3.5 ml-auto" />
                  </a>
                </div>
              )}

              {/* Action Selector */}
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-medium">Review Decision:</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setReviewAction('APPROVED')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                      reviewAction === 'APPROVED'
                        ? 'bg-emerald-600 border-emerald-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    ✓ Approve Access & Issue Entitlement
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewAction('REJECTED')}
                    className={`py-2 px-3 rounded-lg text-xs font-bold border transition-all ${
                      reviewAction === 'REJECTED'
                        ? 'bg-red-600 border-red-500 text-white shadow-md'
                        : 'bg-slate-900 border-slate-700 text-slate-400 hover:text-white'
                    }`}
                  >
                    ✕ Reject / Request More Proof
                  </button>
                </div>
              </div>

              {/* Notes */}
              <div className="space-y-1">
                <label className="text-xs text-slate-400 font-medium">Administrator Notes / Reason:</label>
                <textarea
                  value={reviewNotes}
                  onChange={e => setReviewNotes(e.target.value)}
                  placeholder="e.g. Verified MTN MoMo SMS transaction ref 671063511 on 2026-09-02."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 h-20"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-700">
              <button
                type="button"
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-300 rounded-lg text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingReview}
                onClick={handleReviewSubmit}
                className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold rounded-lg text-xs transition-all shadow-md flex items-center gap-2"
              >
                {isSubmittingReview && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Confirm & Submit Decision</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function LayoutDashboardIcon(props: any) {
  return (
    <svg {...props} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="7" height="9" x="3" y="3" rx="1" />
      <rect width="7" height="5" x="14" y="3" rx="1" />
      <rect width="7" height="9" x="14" y="12" rx="1" />
      <rect width="7" height="5" x="3" y="16" rx="1" />
    </svg>
  );
}
