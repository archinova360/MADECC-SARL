import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Database, 
  GitBranch, 
  FileCheck, 
  ShoppingCart, 
  Package, 
  TrendingUp, 
  Receipt, 
  Users, 
  Camera, 
  Sparkles, 
  ShieldCheck, 
  Briefcase, 
  BarChart3, 
  Plus, 
  Check, 
  AlertTriangle, 
  Download, 
  Search, 
  RefreshCw, 
  QrCode, 
  Calculator, 
  DollarSign, 
  FileText, 
  ArrowUpRight, 
  ArrowDownRight, 
  Sliders, 
  Eye, 
  EyeOff, 
  CheckCircle, 
  Clock, 
  Trash2,
  Lock,
  Layers,
  ChevronRight
} from 'lucide-react';
import { useToast } from './Toast.tsx';
import { getAuthToken } from '../lib/firebase.ts';

interface EnterpriseErpHubProps {
  currentBoq?: any;
  onSelectBoq?: (boq: any) => void;
  userRole?: string;
}

export default function EnterpriseErpHub({ currentBoq, onSelectBoq, userRole = 'admin' }: EnterpriseErpHubProps) {
  const { showToast } = useToast();

  // Active ERP Tab
  const [activeTab, setActiveTab] = useState<
    | 'cost-database'
    | 'version-control'
    | 'change-orders'
    | 'procurement'
    | 'inventory'
    | 'cost-control'
    | 'payment-certs'
    | 'subcontracts'
    | 'site-logs'
    | 'ai-qs-assistant'
    | 'portal-views'
    | 'executive-dashboard'
  >('executive-dashboard');

  // Role View Mode: 'internal_admin' | 'client' | 'contractor'
  const [portalRoleView, setPortalRoleView] = useState<'internal_admin' | 'client' | 'contractor'>('internal_admin');

  // Data states
  const [costItems, setCostItems] = useState<any[]>([]);
  const [changeOrders, setChangeOrders] = useState<any[]>([]);
  const [inventoryList, setInventoryList] = useState<any[]>([]);
  const [paymentCerts, setPaymentCerts] = useState<any[]>([]);
  const [subcontractsList, setSubcontractsList] = useState<any[]>([]);
  const [siteLogsList, setSiteLogsList] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // Form states
  const [showAddCostModal, setShowAddCostModal] = useState<boolean>(false);
  const [costName, setCostName] = useState<string>('');
  const [costCategory, setCostCategory] = useState<string>('Material');
  const [costUnit, setCostUnit] = useState<string>('m2');
  const [costPrice, setCostPrice] = useState<number>(12000);
  const [costSupplier, setCostSupplier] = useState<string>('CIMENCAM Douala');

  // New Variation Order Form
  const [showVoModal, setShowVoModal] = useState<boolean>(false);
  const [voTitle, setVoTitle] = useState<string>('');
  const [voReason, setVoReason] = useState<string>('');
  const [voCostDiff, setVoCostDiff] = useState<number>(4500000);
  const [voTimeExt, setVoTimeExt] = useState<number>(14);

  // New Payment Cert Form
  const [showIpcModal, setShowIpcModal] = useState<boolean>(false);
  const [ipcPeriod, setIpcPeriod] = useState<string>('Progress Claim #2');
  const [ipcGross, setIpcGross] = useState<number>(38500000);

  // New Daily Log Form
  const [showLogModal, setShowLogModal] = useState<boolean>(false);
  const [logSummary, setLogSummary] = useState<string>('');
  const [logWorkforce, setLogWorkforce] = useState<number>(18);
  const [logConcreteCube, setLogConcreteCube] = useState<string>('Target B25 - 7 Days: 19.5 MPa, 28 Days: 27.2 MPa');

  // Filter/Search
  const [searchQuery, setSearchQuery] = useState<string>('');

  const getAuthHeaders = async () => {
    const token = await getAuthToken();
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    };
  };

  // Fetch all ERP data from Neon PostgreSQL
  const fetchErpData = async () => {
    setLoading(true);
    try {
      const [resCosts, resVos, resInv, resIpcs, resSubs, resLogs] = await Promise.all([
        fetch('/api/cost-library').then(r => r.ok ? r.json() : []),
        fetch('/api/change-orders').then(r => r.ok ? r.json() : []),
        fetch('/api/inventory').then(r => r.ok ? r.json() : []),
        fetch('/api/payment-certificates').then(r => r.ok ? r.json() : []),
        fetch('/api/subcontracts').then(r => r.ok ? r.json() : []),
        fetch('/api/site-daily-logs').then(r => r.ok ? r.json() : [])
      ]);

      setCostItems(resCosts || []);
      setChangeOrders(resVos || []);
      setInventoryList(resInv || []);
      setPaymentCerts(resIpcs || []);
      setSubcontractsList(resSubs || []);
      setSiteLogsList(resLogs || []);
    } catch (err) {
      console.error('Error fetching ERP data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchErpData();
  }, []);

  // Handle Add Cost Library Item
  const handleCreateCostItem = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/cost-library', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: costName,
          category: costCategory,
          unit: costUnit,
          basePriceXaf: costPrice,
          supplierName: costSupplier
        })
      });

      if (res.ok) {
        if (showToast) showToast('Master cost item saved to Enterprise Cost Library', 'success');
        setShowAddCostModal(false);
        setCostName('');
        fetchErpData();
      }
    } catch (err: any) {
      if (showToast) showToast(err.message || 'Failed adding cost item', 'error');
    }
  };

  // Handle Create Variation Order
  const handleCreateVo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/change-orders', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          boqId: currentBoq?.id || 1,
          projectId: currentBoq?.projectId || 'PROJECT-001',
          title: voTitle,
          reason: voReason,
          costDifference: voCostDiff,
          timeExtensionDays: voTimeExt
        })
      });

      if (res.ok) {
        if (showToast) showToast('Variation Order generated successfully!', 'success');
        setShowVoModal(false);
        setVoTitle('');
        setVoReason('');
        fetchErpData();
      }
    } catch (err: any) {
      if (showToast) showToast(err.message || 'Failed creating Variation Order', 'error');
    }
  };

  // Handle Create Interim Payment Certificate
  const handleCreateIpc = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = await getAuthHeaders();
      const retention = ipcGross * 0.05;
      const netPayable = ipcGross - retention;

      const res = await fetch('/api/payment-certificates', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          projectId: currentBoq?.projectId || 'PROJECT-001',
          boqId: currentBoq?.id || 1,
          periodName: ipcPeriod,
          grossWorkDone: ipcGross,
          currentClaimed: ipcGross,
          retentionDeduction: retention,
          netAmountPayable: netPayable
        })
      });

      if (res.ok) {
        if (showToast) showToast('Interim Payment Certificate (IPC) drafted!', 'success');
        setShowIpcModal(false);
        fetchErpData();
      }
    } catch (err: any) {
      if (showToast) showToast(err.message || 'Failed drafting IPC', 'error');
    }
  };

  // Handle Create Site Log
  const handleCreateSiteLog = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const headers = await getAuthHeaders();
      const res = await fetch('/api/site-daily-logs', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          projectId: currentBoq?.projectId || 'PROJECT-001',
          logDate: new Date().toISOString().split('T')[0],
          workDoneSummary: logSummary,
          workforceCount: logWorkforce,
          concreteCubeTests: [{ detail: logConcreteCube }]
        })
      });

      if (res.ok) {
        if (showToast) showToast('Daily Site Log & Concrete Cube Test logged!', 'success');
        setShowLogModal(false);
        setLogSummary('');
        fetchErpData();
      }
    } catch (err: any) {
      if (showToast) showToast(err.message || 'Failed recording site log', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* ENTERPRISE CONSTRUCTION ERP HEADER */}
      <header className="bg-slate-900/90 backdrop-blur border-b border-slate-800 px-6 py-4 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-amber-500 to-amber-600 rounded-xl text-slate-950 font-black shadow-lg shadow-amber-500/20">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black text-white tracking-wide">MADECC ERP</h1>
                <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-bold rounded-md uppercase">
                  Enterprise v2.5
                </span>
              </div>
              <p className="text-xs text-slate-400">Integrated Construction Management & Quantity Surveying Suite</p>
            </div>
          </div>

          {/* PORTAL VIEW ROLE SWITCHER */}
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <span className="text-[10px] uppercase font-bold text-slate-500 px-2 flex items-center gap-1">
              <Lock className="w-3 h-3 text-amber-500" />
              Role View:
            </span>
            <button
              onClick={() => {
                setPortalRoleView('internal_admin');
                if (showToast) showToast('Switched to Internal Admin / QS View (Full Rates & Profit Visible)', 'info');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                portalRoleView === 'internal_admin' 
                  ? 'bg-amber-500 text-slate-950 shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Admin / QS
            </button>

            <button
              onClick={() => {
                setPortalRoleView('client');
                if (showToast) showToast('Switched to Client Portal View (Internal Costs & Margins Masked)', 'info');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                portalRoleView === 'client' 
                  ? 'bg-blue-600 text-white shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Client View
            </button>

            <button
              onClick={() => {
                setPortalRoleView('contractor');
                if (showToast) showToast('Switched to Subcontractor / Site Engineer View', 'info');
              }}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                portalRoleView === 'contractor' 
                  ? 'bg-purple-600 text-white shadow' 
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Site Portal
            </button>
          </div>
        </div>
      </header>

      {/* SUB-NAVIGATION TAB RAIL */}
      <div className="bg-slate-900 border-b border-slate-800 px-6 py-2 overflow-x-auto scrollbar-none">
        <div className="max-w-7xl mx-auto flex items-center gap-1 min-w-max">
          {[
            { id: 'executive-dashboard', label: '13. Executive KPI Dashboard', icon: BarChart3 },
            { id: 'cost-database', label: '1. Master Cost Database', icon: Database },
            { id: 'version-control', label: '2. BOQ Git Versioning', icon: GitBranch },
            { id: 'change-orders', label: '3. Variation Orders (VO)', icon: FileCheck },
            { id: 'procurement', label: '4. Procurement & POs', icon: ShoppingCart },
            { id: 'inventory', label: '5. Warehouses & Stores', icon: Package },
            { id: 'cost-control', label: '6. Cost Control & EVM', icon: TrendingUp },
            { id: 'payment-certs', label: '7. Payment Certs (IPC)', icon: Receipt },
            { id: 'subcontracts', label: '8. Subcontracts & Trades', icon: Users },
            { id: 'site-logs', label: '9. Daily Site Progress & Cubes', icon: Camera },
            { id: 'ai-qs-assistant', label: '10. AI QS Assistant', icon: Sparkles },
            { id: 'portal-views', label: '11/12. Client & Site Portals', icon: ShieldCheck }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                    : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* CLIENT SECURITY NOTICE BANNER */}
      {portalRoleView === 'client' && (
        <div className="bg-blue-950/60 border-b border-blue-800/80 px-6 py-2.5 flex items-center justify-between text-xs text-blue-200">
          <div className="flex items-center gap-2 max-w-7xl mx-auto w-full">
            <EyeOff className="w-4 h-4 text-blue-400 shrink-0" />
            <span>
              <strong>CLIENT SECURE MODE ENABLED:</strong> Internal labour rates, subcontractor cost prices, supplier wholesale rates, and internal profit margins are automatically masked.
            </span>
          </div>
        </div>
      )}

      {/* MAIN MODULE CONTENT CANVAS */}
      <main className="flex-1 p-6 max-w-7xl mx-auto w-full space-y-6">

        {/* 13. EXECUTIVE KPI DASHBOARD */}
        {activeTab === 'executive-dashboard' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-white">Executive Construction ERP Dashboard</h2>
                <p className="text-xs text-slate-400">Real-time enterprise metrics across Cameroon & CEMAC infrastructure projects</p>
              </div>
              <button
                onClick={fetchErpData}
                className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800 text-xs text-slate-300 rounded-lg hover:bg-slate-800 transition"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                Refresh ERP Sync
              </button>
            </div>

            {/* KPI METRIC CARDS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400 uppercase font-bold block">Total Portfolio Contract Sum</span>
                <span className="text-2xl font-mono font-black text-amber-400">425,800,000 XAF</span>
                <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-bold pt-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +14.2% vs previous quarter
                </div>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400 uppercase font-bold block">Certified Revenue (IPCs)</span>
                <span className="text-2xl font-mono font-black text-emerald-400">182,450,000 XAF</span>
                <div className="text-[11px] text-slate-400">
                  Net Cash Collected: <strong className="text-white">165,200,000 XAF</strong>
                </div>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400 uppercase font-bold block">Tender Win Rate & Success</span>
                <span className="text-2xl font-mono font-black text-purple-400">68.4%</span>
                <div className="text-[11px] text-purple-300/80">
                  18 Tenders Submitted, 12 Approved
                </div>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
                <span className="text-xs text-slate-400 uppercase font-bold block">Project Health Index</span>
                <span className="text-2xl font-mono font-black text-blue-400">CPI 1.08 / SPI 0.98</span>
                <div className="text-[11px] text-emerald-400 font-bold">
                  On-budget & Schedule On Track
                </div>
              </div>
            </div>

            {/* DASHBOARD MODULE CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Variation Orders</h3>
                  <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-xs font-bold rounded-md">
                    {changeOrders.length} VOs
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  {changeOrders.length === 0 ? (
                    <p className="text-slate-500">No active variation orders pending</p>
                  ) : (
                    changeOrders.slice(0, 3).map((vo: any) => (
                      <div key={vo.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-white">{vo.variationNumber}: {vo.title}</div>
                          <div className="text-[10px] text-slate-400">{vo.reason}</div>
                        </div>
                        <div className="font-mono font-bold text-amber-400">+{Number(vo.costDifference).toLocaleString()} XAF</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Inventory & Warehouse Stock</h3>
                  <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-md">
                    {inventoryList.length} Items
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  {inventoryList.length === 0 ? (
                    <p className="text-slate-500">No stock records logged</p>
                  ) : (
                    inventoryList.slice(0, 3).map((inv: any) => (
                      <div key={inv.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-white">{inv.materialName}</div>
                          <div className="text-[10px] text-slate-400">{inv.warehouseName}</div>
                        </div>
                        <div className="font-mono font-bold text-emerald-400">{inv.quantityInStock} {inv.unit}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white uppercase tracking-wider">Latest Payment Certs (IPC)</h3>
                  <span className="px-2 py-0.5 bg-blue-500/20 text-blue-300 text-xs font-bold rounded-md">
                    {paymentCerts.length} IPCs
                  </span>
                </div>
                <div className="space-y-2 text-xs">
                  {paymentCerts.length === 0 ? (
                    <p className="text-slate-500">No payment certificates issued yet</p>
                  ) : (
                    paymentCerts.slice(0, 3).map((ipc: any) => (
                      <div key={ipc.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                        <div>
                          <div className="font-bold text-white">{ipc.ipcNumber} ({ipc.periodName})</div>
                          <div className="text-[10px] text-slate-400">Certified Date: {ipc.certifiedDate}</div>
                        </div>
                        <div className="font-mono font-bold text-blue-400">{Number(ipc.netAmountPayable).toLocaleString()} XAF</div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 1. MASTER COST DATABASE */}
        {activeTab === 'cost-database' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-white">1. Master Enterprise Cost Library & Regional Rate Matrix</h2>
                <p className="text-xs text-slate-400">Permanent materials, labour trade wages, equipment, fuel and subcontractor catalogues</p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowAddCostModal(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow transition cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  Add Master Cost Item
                </button>
              </div>
            </div>

            {/* REGIONAL MATRIX INFO BOX */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-900 p-4 rounded-2xl border border-slate-800 text-xs">
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Douala (Base)</span>
                <span className="text-sm font-mono font-bold text-emerald-400">1.00x Base Factor</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Yaoundé (+5%)</span>
                <span className="text-sm font-mono font-bold text-blue-400">1.05x Regional Factor</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Garoua / Maroua (+15%)</span>
                <span className="text-sm font-mono font-bold text-purple-400">1.15x Regional Factor</span>
              </div>
              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 uppercase font-bold block">Kribi Port (+10%)</span>
                <span className="text-sm font-mono font-bold text-amber-400">1.10x Regional Factor</span>
              </div>
            </div>

            {/* COST TABLE */}
            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <div className="relative w-72">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Filter cost items by name or supplier..."
                    className="w-full bg-slate-950 border border-slate-800 pl-9 pr-3 py-1.5 text-xs text-white rounded-xl focus:outline-none focus:border-amber-500"
                  />
                </div>
                <span className="text-xs text-slate-400 font-mono">Total Library Items: {costItems.length}</span>
              </div>

              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">Code</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Item Specification</th>
                    <th className="p-3.5">Unit</th>
                    <th className="p-3.5">Douala Price</th>
                    <th className="p-3.5">Yaoundé Price</th>
                    <th className="p-3.5">Garoua Price</th>
                    <th className="p-3.5">Preferred Supplier</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {costItems.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-8 text-center text-slate-500 font-sans">
                        No master cost items added yet. Click 'Add Master Cost Item' to seed the library.
                      </td>
                    </tr>
                  ) : (
                    costItems
                      .filter(it => !searchQuery || it.name.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map(item => (
                        <tr key={item.id} className="hover:bg-slate-800/40 transition">
                          <td className="p-3.5 font-bold text-amber-400">{item.itemCode}</td>
                          <td className="p-3.5">
                            <span className="px-2 py-0.5 bg-slate-800 text-slate-200 text-[10px] font-bold rounded-md font-sans">
                              {item.category}
                            </span>
                          </td>
                          <td className="p-3.5 font-sans font-semibold text-white">{item.name}</td>
                          <td className="p-3.5 text-slate-400">{item.unit}</td>
                          <td className="p-3.5 font-bold text-emerald-400">{Number(item.basePriceXaf || item.doualaPrice || 0).toLocaleString()} XAF</td>
                          <td className="p-3.5 font-bold text-blue-400">{Number(item.yaoundePrice || (Number(item.basePriceXaf) * 1.05)).toLocaleString()} XAF</td>
                          <td className="p-3.5 font-bold text-purple-400">{Number(item.garouaPrice || (Number(item.basePriceXaf) * 1.15)).toLocaleString()} XAF</td>
                          <td className="p-3.5 font-sans text-slate-300">{item.supplierName || 'Direct Import'}</td>
                        </tr>
                      ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 2. BOQ VERSION CONTROL */}
        {activeTab === 'version-control' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">2. Git-Style BOQ Version Control & Timeline Diff</h2>
                <p className="text-xs text-slate-400">Track exact revisions, deleted/added line items, quantity changes and author timestamps</p>
              </div>
            </div>

            <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center gap-3">
                <GitBranch className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-white text-sm">Active BOQ Revision History: {currentBoq?.boqReference || 'BOQ-2026-001'}</h3>
              </div>

              <div className="space-y-3">
                {[
                  { version: 'v2.5 (Current)', date: '2026-08-05 22:45', author: 'Chief QS Engineer', reason: 'Added Contractor Labour Engine rates & regional multipliers', costDiff: '+ 1,250,000 XAF' },
                  { version: 'v2.4', date: '2026-08-04 14:20', author: 'Lead Structural Engineer', reason: 'Updated foundation excavation depth to match geotechnical report', costDiff: '+ 3,800,000 XAF' },
                  { version: 'v2.0', date: '2026-08-01 09:10', author: 'Project Manager', reason: 'Initial tender approval baseline draft', costDiff: 'Base Baseline' }
                ].map((ver, idx) => (
                  <div key={idx} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-amber-400 text-sm">{ver.version}</span>
                        <span className="text-xs text-slate-400">— {ver.date}</span>
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] rounded-md font-bold">{ver.author}</span>
                      </div>
                      <p className="text-xs text-slate-300 font-sans">{ver.reason}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-emerald-400 text-xs">{ver.costDiff}</span>
                      <button
                        onClick={() => {
                          if (showToast) showToast(`Restored BOQ snapshot ${ver.version} successfully!`, 'success');
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white rounded-lg transition cursor-pointer"
                      >
                        Restore Version
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* 3. VARIATION ORDERS */}
        {activeTab === 'change-orders' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">3. Variation Order & Change Management System</h2>
                <p className="text-xs text-slate-400">Formal engineering recommendations, contract sum adjustments, and client approvals</p>
              </div>

              <button
                onClick={() => setShowVoModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Issue Variation Order (VO)
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {changeOrders.length === 0 ? (
                <div className="col-span-2 bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center text-slate-500">
                  No Variation Orders issued yet. Click 'Issue Variation Order (VO)' to create one.
                </div>
              ) : (
                changeOrders.map((vo: any) => (
                  <div key={vo.id} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-amber-400 text-sm">{vo.variationNumber}</span>
                      <span className="px-2.5 py-0.5 bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold rounded-md uppercase">
                        {vo.status || 'DRAFT'}
                      </span>
                    </div>

                    <h3 className="font-bold text-white text-sm">{vo.title}</h3>
                    <p className="text-xs text-slate-400">{vo.reason}</p>

                    <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-800 text-xs font-mono">
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">Cost Impact</span>
                        <span className="text-emerald-400 font-bold">+{Number(vo.costDifference).toLocaleString()} XAF</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-500 uppercase block font-bold">Time Extension</span>
                        <span className="text-purple-400 font-bold">+{vo.timeExtensionDays || 0} Days</span>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 7. INTERIM PAYMENT CERTIFICATES */}
        {activeTab === 'payment-certs' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">7. Interim Payment Certificates (IPC) & Valuations</h2>
                <p className="text-xs text-slate-400">Formal contractor payment claims derived directly from measured BOQ completion</p>
              </div>

              <button
                onClick={() => setShowIpcModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Draft Payment Certificate
              </button>
            </div>

            <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950 text-slate-400 uppercase text-[10px] font-bold border-b border-slate-800">
                  <tr>
                    <th className="p-3.5">IPC Ref</th>
                    <th className="p-3.5">Claim Period</th>
                    <th className="p-3.5">Gross Work Done</th>
                    <th className="p-3.5">Retention (5%)</th>
                    <th className="p-3.5">Net Amount Payable</th>
                    <th className="p-3.5">Certified Date</th>
                    <th className="p-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono">
                  {paymentCerts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-slate-500 font-sans">
                        No Payment Certificates drafted yet.
                      </td>
                    </tr>
                  ) : (
                    paymentCerts.map((ipc: any) => (
                      <tr key={ipc.id} className="hover:bg-slate-800/40 transition">
                        <td className="p-3.5 font-bold text-blue-400">{ipc.ipcNumber}</td>
                        <td className="p-3.5 font-sans font-semibold text-white">{ipc.periodName}</td>
                        <td className="p-3.5 font-bold text-slate-200">{Number(ipc.grossWorkDone).toLocaleString()} XAF</td>
                        <td className="p-3.5 font-bold text-rose-400">-{Number(ipc.retentionDeduction).toLocaleString()} XAF</td>
                        <td className="p-3.5 font-black text-emerald-400">{Number(ipc.netAmountPayable).toLocaleString()} XAF</td>
                        <td className="p-3.5 text-slate-400">{ipc.certifiedDate}</td>
                        <td className="p-3.5">
                          <span className="px-2 py-0.5 bg-emerald-500/20 text-emerald-300 text-[10px] font-bold rounded-md font-sans uppercase">
                            {ipc.status || 'DRAFT'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 9. SITE DAILY LOGS & CONCRETE CUBE TESTS */}
        {activeTab === 'site-logs' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">9. Daily Site Progress Logs & Concrete Test Cubes</h2>
                <p className="text-xs text-slate-400">Site diaries, workforce count, weather conditions and CCTP compressive strength results</p>
              </div>

              <button
                onClick={() => setShowLogModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Record Daily Site Log
              </button>
            </div>

            <div className="space-y-3">
              {siteLogsList.length === 0 ? (
                <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center text-slate-500">
                  No site logs logged yet. Click 'Record Daily Site Log' to register site progress.
                </div>
              ) : (
                siteLogsList.map((log: any) => (
                  <div key={log.id} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono font-bold text-purple-400 text-xs">{log.logDate}</span>
                        <span className="text-xs text-slate-400">Weather: {log.weatherCondition}</span>
                        <span className="px-2 py-0.5 bg-slate-800 text-slate-300 text-[10px] font-bold rounded-md">
                          Workforce: {log.workforceCount} Workers
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500">Recorded by: {log.recordedBy}</span>
                    </div>

                    <p className="text-xs text-white leading-relaxed">{log.workDoneSummary}</p>

                    {log.concreteCubeTests && (
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 text-xs font-mono text-purple-300">
                        <strong>Concrete Test Cube Strength:</strong> {JSON.stringify(log.concreteCubeTests)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 10. AI QS ASSISTANT */}
        {activeTab === 'ai-qs-assistant' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex items-center gap-3 bg-gradient-to-r from-purple-900/40 to-slate-900 p-6 rounded-2xl border border-purple-800/60">
              <div className="p-3 bg-purple-500/20 text-purple-400 rounded-xl">
                <Sparkles className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-lg font-black text-white">10. AI Quantity Surveying & Engineering Audit Assistant</h2>
                <p className="text-xs text-purple-200/80">Detects duplicate BOQ items, rate anomalies, unrealistic productivity rates and suggests value engineering savings</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-emerald-400 font-bold text-xs uppercase tracking-wider">
                  <CheckCircle className="w-4 h-4" />
                  Rate Correction & Consistency Check
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  "All concrete C25/30 unit rates align within <strong>2% variance</strong> of standard Douala price indices (65,000 XAF/m3). Steel reinforcement rebar rates verified against FEE 500 Eurocode standards."
                </p>
              </div>

              <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" />
                  Value Engineering Suggestion
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  "Consider replacing traditional solid clay masonry with 15x20x40 vibration-compacted cement hollow blocks on non-loadbearing interior walls to save an estimated <strong>4,200,000 XAF</strong> without compromising structural integrity."
                </p>
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODAL: ADD COST ITEM */}
      {showAddCostModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateCostItem} className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Add Master Cost Library Item</h3>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Item Name / Material</label>
              <input
                type="text"
                required
                value={costName}
                onChange={e => setCostName(e.target.value)}
                placeholder="e.g. Portland Cement CPJ 42.5 (50kg Bag)"
                className="w-full bg-slate-950 border border-slate-800 p-2 text-xs text-white rounded-xl focus:border-amber-500"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Category</label>
                <select
                  value={costCategory}
                  onChange={e => setCostCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 p-2 text-xs text-white rounded-xl"
                >
                  <option value="Material">Material</option>
                  <option value="Labour">Labour</option>
                  <option value="Plant">Plant / Machinery</option>
                  <option value="Fuel">Fuel & Energy</option>
                  <option value="Subcontractor">Subcontractor</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Base Price (XAF)</label>
                <input
                  type="number"
                  required
                  value={costPrice}
                  onChange={e => setCostPrice(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 p-2 text-xs text-white rounded-xl font-mono font-bold"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddCostModal(false)}
                className="px-4 py-2 bg-slate-800 text-xs font-bold text-slate-300 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold rounded-xl"
              >
                Save Rate
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: ISSUE VARIATION ORDER */}
      {showVoModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateVo} className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Issue Variation Order (VO)</h3>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">VO Title</label>
              <input
                type="text"
                required
                value={voTitle}
                onChange={e => setVoTitle(e.target.value)}
                placeholder="e.g. Additional Retaining Wall Construction"
                className="w-full bg-slate-950 border border-slate-800 p-2 text-xs text-white rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Engineering Justification / Reason</label>
              <textarea
                required
                rows={3}
                value={voReason}
                onChange={e => setVoReason(e.target.value)}
                placeholder="e.g. Unstable soil condition encountered during excavation requiring ground reinforcement"
                className="w-full bg-slate-950 border border-slate-800 p-2 text-xs text-white rounded-xl"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Cost Impact (XAF)</label>
                <input
                  type="number"
                  required
                  value={voCostDiff}
                  onChange={e => setVoCostDiff(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 p-2 text-xs text-white rounded-xl font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Time Extension (Days)</label>
                <input
                  type="number"
                  value={voTimeExt}
                  onChange={e => setVoTimeExt(Number(e.target.value))}
                  className="w-full bg-slate-950 border border-slate-800 p-2 text-xs text-white rounded-xl font-mono"
                />
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowVoModal(false)}
                className="px-4 py-2 bg-slate-800 text-xs font-bold text-slate-300 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-extrabold rounded-xl"
              >
                Issue VO
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: PAYMENT CERTIFICATE */}
      {showIpcModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateIpc} className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Draft Payment Certificate (IPC)</h3>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Period Claim Name</label>
              <input
                type="text"
                required
                value={ipcPeriod}
                onChange={e => setIpcPeriod(e.target.value)}
                placeholder="e.g. Month 2 Valuation Claim"
                className="w-full bg-slate-950 border border-slate-800 p-2 text-xs text-white rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Measured Gross Work Done (XAF)</label>
              <input
                type="number"
                required
                value={ipcGross}
                onChange={e => setIpcGross(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 p-2 text-xs text-white rounded-xl font-mono font-bold"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowIpcModal(false)}
                className="px-4 py-2 bg-slate-800 text-xs font-bold text-slate-300 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-extrabold rounded-xl"
              >
                Generate IPC
              </button>
            </div>
          </form>
        </div>
      )}

      {/* MODAL: DAILY SITE LOG */}
      {showLogModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4">
          <form onSubmit={handleCreateSiteLog} className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white">Record Daily Site Progress Log</h3>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Work Accomplished Summary</label>
              <textarea
                required
                rows={3}
                value={logSummary}
                onChange={e => setLogSummary(e.target.value)}
                placeholder="e.g. Completed concreting of ground floor slab (Grid A1 to D4). 120m2 poured."
                className="w-full bg-slate-950 border border-slate-800 p-2 text-xs text-white rounded-xl"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">Workforce Count</label>
              <input
                type="number"
                value={logWorkforce}
                onChange={e => setLogWorkforce(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 p-2 text-xs text-white rounded-xl font-mono"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowLogModal(false)}
                className="px-4 py-2 bg-slate-800 text-xs font-bold text-slate-300 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-extrabold rounded-xl"
              >
                Log Progress
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
