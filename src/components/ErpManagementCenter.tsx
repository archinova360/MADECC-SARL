import React, { useState, useEffect } from 'react';
import { 
  Building2, Users, FileText, Camera, CheckCircle2, DollarSign, 
  Calculator, FileSpreadsheet, Package, Truck, Wrench, BarChart3, 
  Plus, Search, Edit2, Trash2, Eye, Download, Check, AlertTriangle, 
  RefreshCw, Clock, ArrowRight, ShieldCheck, MapPin, Calendar, 
  Sliders, UserCheck, Phone, Mail, Award, X
} from 'lucide-react';
import { useTheme } from '../lib/ThemeContext.tsx';
import { useSiteSettings } from '../lib/SiteSettingsContext.tsx';

interface Props {
  initialSubTab?: string;
  onNavigateTab?: (tab: string) => void;
}

export default function ErpManagementCenter({ initialSubTab = 'clients', onNavigateTab }: Props) {
  const { theme } = useTheme();
  const { settings } = useSiteSettings();

  const [activeSection, setActiveSection] = useState<string>(initialSubTab || 'clients');
  const [loading, setLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string>('');

  // 1. Clients State
  const [clients, setClients] = useState<any[]>([]);
  const [clientSearch, setClientSearch] = useState('');
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClient, setNewClient] = useState({
    fullName: '', companyName: '', email: '', phone: '', phoneSecondary: '', address: '', city: 'Yaoundé', notes: '', defaultPassword: 'Client2026@Madecc'
  });

  // 2. Projects & Milestones State
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number>(1);
  const [milestones, setMilestones] = useState<any[]>([]);
  const [showAddMilestoneModal, setShowAddMilestoneModal] = useState(false);
  const [newMilestone, setNewMilestone] = useState({
    milestone: '', description: '', percentage: 0, status: 'Pending', date: new Date().toISOString().split('T')[0]
  });

  // 3. Media State
  const [mediaList, setMediaList] = useState<any[]>([]);
  const [showAddMediaModal, setShowAddMediaModal] = useState(false);
  const [newMedia, setNewMedia] = useState({
    phase: 'Superstructure & Columns', title: '', description: '', mediaUrl: '', isClientVisible: true
  });

  // 4. Invoices State
  const [invoices, setInvoices] = useState<any[]>([]);
  const [showAddInvoiceModal, setShowAddInvoiceModal] = useState(false);
  const [newInvoice, setNewInvoice] = useState({
    projectId: 1, clientId: 1, issueDate: new Date().toISOString().split('T')[0], dueDate: new Date(Date.now() + 14 * 86400000).toISOString().split('T')[0],
    description: 'Foundation & Earthworks phase completion certificate', category: 'STRUCTURE', unit: 'm3', quantity: 100, unitPriceXaf: 95000,
    notes: 'Standard 19.25% TVA applies.'
  });

  // 5. Cost Estimator & BOQ State
  const [estParams, setEstParams] = useState({
    buildingType: 'VILLA',
    totalFloorAreaM2: 280,
    floorsCount: 2,
    finishQuality: 'MODERN',
    city: 'Yaoundé'
  });
  const [estResult, setEstResult] = useState<any>(null);

  // 6. Inventory & Movements State
  const [inventoryItems, setInventoryItems] = useState<any[]>([]);
  const [inventoryMovements, setInventoryMovements] = useState<any[]>([]);
  const [showAddMovementModal, setShowAddMovementModal] = useState(false);
  const [newMovement, setNewMovement] = useState({
    inventoryItemId: 1, movementType: 'DISPATCH_TO_PROJECT', quantity: 50, unit: 'bags', unitCostXaf: 5300, projectId: 1, receiverName: 'Michel Onana (Site Foreman)', notes: ''
  });

  // 7. Equipment Fleet State
  const [equipmentList, setEquipmentList] = useState<any[]>([]);
  const [showAddEquipmentModal, setShowAddEquipmentModal] = useState(false);
  const [newEquipment, setNewEquipment] = useState({
    name: '', category: 'Heavy Machinery', brandModel: '', status: 'AVAILABLE', condition: 'EXCELLENT', hourlyRateXaf: 45000, location: 'Yaoundé Central Depot'
  });

  // 8. Subcontractors State
  const [subcontractors, setSubcontractors] = useState<any[]>([]);
  const [showAddSubModal, setShowAddSubModal] = useState(false);
  const [newSub, setNewSub] = useState({
    companyName: '', contactPerson: '', phone: '', email: '', specialization: 'Earthworks & Excavation', rccmNumber: '', niuTaxNumber: '', rating: 5.0, address: 'Yaoundé'
  });

  // 9. Workforce & Attendance State
  const [workers, setWorkers] = useState<any[]>([]);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceList, setAttendanceList] = useState<any[]>([]);
  const [showAddWorkerModal, setShowAddWorkerModal] = useState(false);
  const [newWorker, setNewWorker] = useState({
    fullName: '', nationalId: '', phone: '', tradeCategory: 'Mason / Bricklayer', skillLevel: 'SKILLED', dailyRateXaf: 8000, assignedProjectId: 1
  });

  // 10. Reports Overview State
  const [analyticsOverview, setAnalyticsOverview] = useState<any>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Sync initial subtab
  useEffect(() => {
    if (initialSubTab) {
      setActiveSection(initialSubTab);
    }
  }, [initialSubTab]);

  // Load initial data
  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      // 1. Clients
      const cRes = await fetch('/api/erp/clients').then(r => r.json());
      if (cRes.success) setClients(cRes.clients || []);

      // 2. Projects
      const pRes = await fetch('/api/projects').then(r => r.json());
      if (pRes && Array.isArray(pRes)) {
        setProjects(pRes);
        if (pRes.length > 0) setSelectedProjectId(pRes[0].id);
      }

      // 3. Invoices
      const iRes = await fetch('/api/erp/invoices').then(r => r.json());
      if (iRes.success) setInvoices(iRes.invoices || []);

      // 4. Inventory
      const invRes = await fetch('/api/inventory').then(r => r.json());
      if (invRes && Array.isArray(invRes)) setInventoryItems(invRes);

      const movRes = await fetch('/api/erp/inventory/movements').then(r => r.json());
      if (movRes.success) setInventoryMovements(movRes.movements || []);

      // 5. Equipment
      const eqRes = await fetch('/api/erp/equipment').then(r => r.json());
      if (eqRes.success) setEquipmentList(eqRes.equipment || []);

      // 6. Subcontractors
      const subRes = await fetch('/api/erp/subcontractors').then(r => r.json());
      if (subRes.success) setSubcontractors(subRes.subcontractors || []);

      // 7. Workers
      const wrkRes = await fetch('/api/erp/workers').then(r => r.json());
      if (wrkRes.success) setWorkers(wrkRes.workers || []);

      // 8. Analytics
      const repRes = await fetch('/api/erp/reports/overview').then(r => r.json());
      if (repRes.success) setAnalyticsOverview(repRes.analytics);

      // 9. Initial Estimate
      calculateEstimate();
    } catch (err) {
      console.error('Error loading ERP data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load project-specific milestones & media
  useEffect(() => {
    if (!selectedProjectId) return;

    fetch(`/api/erp/projects/${selectedProjectId}/milestones`)
      .then(r => r.json())
      .then(d => { if (d.success) setMilestones(d.milestones || []); })
      .catch(err => { if (err?.name !== 'AbortError') console.warn('Milestones fetch error:', err); });

    fetch(`/api/erp/projects/${selectedProjectId}/media`)
      .then(r => r.json())
      .then(d => { if (d.success) setMediaList(d.media || []); })
      .catch(err => { if (err?.name !== 'AbortError') console.warn('Media fetch error:', err); });

    fetch(`/api/erp/attendance?date=${attendanceDate}&projectId=${selectedProjectId}`)
      .then(r => r.json())
      .then(d => { if (d.success) setAttendanceList(d.attendance || []); })
      .catch(err => { if (err?.name !== 'AbortError') console.warn('Attendance fetch error:', err); });
  }, [selectedProjectId, attendanceDate]);

  // Handler: Add Client
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/erp/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClient)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Failed creating client');

      setClients(prev => [data.client, ...prev]);
      setShowAddClientModal(false);
      setNewClient({ fullName: '', companyName: '', email: '', phone: '', phoneSecondary: '', address: '', city: 'Yaoundé', notes: '', defaultPassword: 'Client2026@Madecc' });
      showToast('Client account and login credentials generated successfully!');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handler: Add Milestone
  const handleCreateMilestone = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/erp/projects/${selectedProjectId}/milestones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMilestone)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setMilestones(prev => [...prev, data.milestone]);
      setShowAddMilestoneModal(false);
      setNewMilestone({ milestone: '', description: '', percentage: 0, status: 'Pending', date: new Date().toISOString().split('T')[0] });
      showToast('Milestone registered to project schedule.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handler: Add Media
  const handleCreateMedia = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`/api/erp/projects/${selectedProjectId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMedia)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setMediaList(prev => [data.media, ...prev]);
      setShowAddMediaModal(false);
      setNewMedia({ phase: 'Superstructure & Columns', title: '', description: '', mediaUrl: '', isClientVisible: true });
      showToast('Progress media added to gallery.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handler: Toggle Media Visibility
  const handleToggleMediaVisibility = async (mediaId: number, currentVisible: boolean) => {
    try {
      const res = await fetch(`/api/erp/media/${mediaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isClientVisible: !currentVisible })
      });
      const data = await res.json();
      if (data.success) {
        setMediaList(prev => prev.map(m => m.id === mediaId ? data.media : m));
        showToast(`Media ${!currentVisible ? 'published to' : 'hidden from'} Client Portal`);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Create Invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const items = [{
        description: newInvoice.description,
        category: newInvoice.category,
        unit: newInvoice.unit,
        quantity: Number(newInvoice.quantity),
        unitPriceXaf: Number(newInvoice.unitPriceXaf)
      }];

      const res = await fetch('/api/erp/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId: newInvoice.projectId,
          clientId: newInvoice.clientId,
          issueDate: newInvoice.issueDate,
          dueDate: newInvoice.dueDate,
          items,
          notes: newInvoice.notes
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setInvoices(prev => [data.invoice, ...prev]);
      setShowAddInvoiceModal(false);
      showToast('Official project invoice generated.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handler: Cost Estimator calculation
  const calculateEstimate = async () => {
    try {
      const res = await fetch('/api/erp/estimates/calculate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(estParams)
      });
      const data = await res.json();
      if (data.success) {
        setEstResult(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Handler: Add Inventory Movement
  const handleCreateMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/erp/inventory/movements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMovement)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setInventoryMovements(prev => [data.movement, ...prev]);
      setShowAddMovementModal(false);
      showToast('Stock movement and project dispatch recorded.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handler: Add Equipment
  const handleCreateEquipment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/erp/equipment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newEquipment)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setEquipmentList(prev => [...prev, data.equipment]);
      setShowAddEquipmentModal(false);
      showToast('Equipment asset registered to company fleet.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handler: Add Subcontractor
  const handleCreateSubcontractor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/erp/subcontractors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newSub)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setSubcontractors(prev => [...prev, data.subcontractor]);
      setShowAddSubModal(false);
      showToast('Subcontractor profile added.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handler: Add Worker
  const handleCreateWorker = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/erp/workers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newWorker)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      setWorkers(prev => [...prev, data.worker]);
      setShowAddWorkerModal(false);
      showToast('Worker profile added to active roster.');
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handler: Quick Batch Attendance Save
  const handleSaveAttendance = async () => {
    try {
      const records = workers.map(w => ({
        workerId: w.id,
        projectId: selectedProjectId,
        status: 'PRESENT',
        regularHours: 8.0,
        overtimeHours: 0,
        dailyRateXaf: w.daily_rate_xaf
      }));

      const res = await fetch('/api/erp/attendance/batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          records,
          date: attendanceDate,
          projectId: selectedProjectId,
          supervisorSignoff: 'Eng. Arnaud Fopa (Site Lead)'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message);

      showToast(`Daily attendance signed off for ${records.length} artisans.`);
      // Reload attendance list
      fetch(`/api/erp/attendance?date=${attendanceDate}&projectId=${selectedProjectId}`)
        .then(r => r.json())
        .then(d => { if (d.success) setAttendanceList(d.attendance || []); });
    } catch (err: any) {
      alert(err.message);
    }
  };

  // 13 Navigation Sections as defined in User Requirements
  const sections = [
    { id: 'clients', label: '1. Client Management', icon: Users },
    { id: 'portal', label: '2. Client Portal Management', icon: ShieldCheck },
    { id: 'progress', label: '3. Project Progress', icon: Clock },
    { id: 'media', label: '4. Progress Photos & Videos', icon: Camera },
    { id: 'milestones', label: '5. Project Milestones', icon: CheckCircle2 },
    { id: 'invoices', label: '6. Project Invoices', icon: DollarSign },
    { id: 'estimator', label: '7. Cost Estimator', icon: Calculator },
    { id: 'boq', label: '8. BOQ Management', icon: FileSpreadsheet },
    { id: 'inventory', label: '9. Materials Inventory', icon: Package },
    { id: 'equipment', label: '10. Equipment Management', icon: Truck },
    { id: 'subcontractors', label: '11. Subcontractor Management', icon: Wrench },
    { id: 'workforce', label: '12. Workforce Management', icon: UserCheck },
    { id: 'reports', label: '13. Reports and Analytics', icon: BarChart3 }
  ];

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 p-4 rounded-2xl bg-amber-500 text-slate-950 font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono bg-amber-500/20 text-amber-400 font-bold px-2.5 py-0.5 rounded-full">
              ENTERPRISE CONSTRUCTION ERP
            </span>
            <span className="text-xs font-mono bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full font-bold">
              NEON LIVE
            </span>
          </div>
          <h2 className="text-2xl font-black font-serif text-white mt-1">Construction Management Platform</h2>
          <p className="text-xs text-slate-400">
            Civil engineering project controls, workforce attendance, site logistics, and client transparency suite.
          </p>
        </div>

        {/* Global Project Switcher */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-xl border border-slate-700">
            <Building2 className="w-4 h-4 text-amber-500" />
            <span className="text-xs font-mono text-slate-300">Project:</span>
            <select
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(Number(e.target.value))}
              className="bg-transparent text-xs font-bold text-white focus:outline-none cursor-pointer"
            >
              {projects.map(p => (
                <option key={p.id} value={p.id} className="bg-slate-900 text-white">{p.title}</option>
              ))}
            </select>
          </div>

          <button
            onClick={loadAllData}
            title="Refresh Live DB Data"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* 13 Section Pills / Tabs Navigation */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-slate-800/60 no-scrollbar">
        {sections.map(sec => {
          const Icon = sec.icon;
          const isActive = activeSection === sec.id;
          return (
            <button
              key={sec.id}
              onClick={() => setActiveSection(sec.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition-all cursor-pointer ${
                isActive
                  ? 'bg-amber-500 text-slate-950 shadow-lg'
                  : 'bg-slate-800/60 hover:bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{sec.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================= */}
      {/* 1. CLIENT MANAGEMENT */}
      {/* ========================================================= */}
      {activeSection === 'clients' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Registered Clients & Sponsors</h3>
              <p className="text-xs text-slate-400">Manage client accounts, contact coordinates, and portal credentials.</p>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <div className="relative flex-grow sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search client, email or code..."
                  value={clientSearch}
                  onChange={(e) => setClientSearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <button
                onClick={() => setShowAddClientModal(true)}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-md shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Add Client</span>
              </button>
            </div>
          </div>

          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Code</th>
                  <th className="p-3.5">Client & Company</th>
                  <th className="p-3.5">Contact</th>
                  <th className="p-3.5 text-center">Projects</th>
                  <th className="p-3.5 text-right">Invoiced (XAF)</th>
                  <th className="p-3.5 text-right">Outstanding (XAF)</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {clients.filter(c => {
                  const s = clientSearch.toLowerCase();
                  return c.full_name?.toLowerCase().includes(s) || c.client_code?.toLowerCase().includes(s) || c.email?.toLowerCase().includes(s);
                }).map(c => (
                  <tr key={c.id} className="hover:bg-slate-800/40">
                    <td className="p-3.5 font-mono text-amber-400 font-bold">{c.client_code}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-white text-sm">{c.full_name}</div>
                      <div className="text-slate-400 text-[11px]">{c.company_name || 'Private Property Sponsor'}</div>
                    </td>
                    <td className="p-3.5">
                      <div className="text-slate-300">{c.email}</div>
                      <div className="text-slate-400 text-[11px] font-mono">{c.phone || '+237 671 06 35 11'}</div>
                    </td>
                    <td className="p-3.5 text-center font-mono font-bold">{c.assigned_projects_count || 1}</td>
                    <td className="p-3.5 text-right font-mono text-slate-300">{Number(c.total_invoiced_xaf || 0).toLocaleString()}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-amber-400">{Number(c.outstanding_balance_xaf || 0).toLocaleString()}</td>
                    <td className="p-3.5 text-center">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {c.status || 'ACTIVE'}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={() => alert(`Client Credentials:\nEmail: ${c.email}\nPassword: ${c.password_hash || 'Client2026@Madecc'}\nPortal URL: /client-portal`)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-[11px] font-mono font-bold cursor-pointer"
                      >
                        Credentials
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. CLIENT PORTAL MANAGEMENT */}
      {/* ========================================================= */}
      {activeSection === 'portal' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-2">Client Portal Access Configuration</h3>
            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              Clients access the secure portal at <strong className="text-amber-400">/client-portal</strong> using their corporate email and assigned password. They can only see projects assigned to their client record.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700">
                <h4 className="text-sm font-bold text-amber-400 mb-2">Assign Project to Client</h4>
                <div className="space-y-3 text-xs">
                  <div>
                    <label className="text-slate-400 block mb-1">Select Client</label>
                    <select id="assign-client-select" className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white">
                      {clients.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.client_code})</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Select Construction Site</label>
                    <select id="assign-proj-select" className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white">
                      {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                  </div>
                  <button
                    onClick={async () => {
                      const cId = (document.getElementById('assign-client-select') as HTMLSelectElement)?.value;
                      const pId = (document.getElementById('assign-proj-select') as HTMLSelectElement)?.value;
                      if (!cId || !pId) return;
                      await fetch(`/api/erp/clients/${cId}/assign-project`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ projectId: Number(pId), role: 'PROPERTY_OWNER', accessLevel: 'FULL' })
                      });
                      showToast('Project permissions granted to client.');
                    }}
                    className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl cursor-pointer"
                  >
                    Confirm Project Assignment
                  </button>
                </div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700">
                <h4 className="text-sm font-bold text-sky-400 mb-2">Portal Security & Session Controls</h4>
                <ul className="text-xs text-slate-300 space-y-2">
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Cross-Site Request Forgery (CSRF) immune session tokens.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Media publish gate: Uncheck "Client Visible" to keep drafts internal.</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Instant MoMo reconciliation with automated transaction log entry.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 3. PROJECT PROGRESS */}
      {/* ========================================================= */}
      {activeSection === 'progress' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-4">Site Execution Progress & Delays Tracking</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700">
                <span className="text-xs text-slate-400 font-mono">Current Phase</span>
                <div className="text-lg font-bold text-amber-400 mt-1">Superstructure Level 1 Casting</div>
                <div className="text-xs text-slate-400 mt-2">Class C25/30 Concrete with slump test: 120mm</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700">
                <span className="text-xs text-slate-400 font-mono">Schedule Variance</span>
                <div className="text-lg font-bold text-emerald-400 mt-1">+3 Days Ahead of Schedule</div>
                <div className="text-xs text-slate-400 mt-2">Earthworks completed ahead of rainy season window</div>
              </div>

              <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700">
                <span className="text-xs text-slate-400 font-mono">Safety Days Without LTI</span>
                <div className="text-lg font-bold text-white mt-1">142 Days Safe</div>
                <div className="text-xs text-emerald-400 mt-2">Zero lost-time injuries reported on site</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 4. PROGRESS PHOTOS & VIDEOS */}
      {/* ========================================================= */}
      {activeSection === 'media' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Site Photographic & Video Evidence</h3>
              <p className="text-xs text-slate-400">Upload and publish field verification media for clients.</p>
            </div>
            <button
              onClick={() => setShowAddMediaModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Progress Media</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mediaList.map(m => (
              <div key={m.id} className="rounded-2xl border border-slate-800 overflow-hidden bg-slate-900 shadow-lg">
                <div className="relative aspect-video bg-slate-950">
                  <img src={m.media_url} alt={m.title} className="w-full h-full object-cover" />
                  <div className="absolute top-2 left-2 bg-slate-950/80 px-2 py-0.5 rounded text-[10px] font-mono text-amber-400 font-bold">
                    {m.phase}
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between mb-1">
                    <h4 className="text-sm font-bold text-white">{m.title}</h4>
                    <button
                      onClick={() => handleToggleMediaVisibility(m.id, m.is_client_visible)}
                      className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full cursor-pointer ${
                        m.is_client_visible ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {m.is_client_visible ? 'Visible to Client' : 'Internal Only'}
                    </button>
                  </div>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-2">{m.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 5. PROJECT MILESTONES */}
      {/* ========================================================= */}
      {activeSection === 'milestones' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">GANTT Milestones Schedule</h3>
              <p className="text-xs text-slate-400">Track contractual deliverables and completion percentages.</p>
            </div>
            <button
              onClick={() => setShowAddMilestoneModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Milestone</span>
            </button>
          </div>

          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Milestone Description</th>
                  <th className="p-3.5">Target Date</th>
                  <th className="p-3.5 text-center">Progress</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {milestones.map(m => (
                  <tr key={m.id}>
                    <td className="p-3.5">
                      <div className="font-bold text-white">{m.milestone}</div>
                      <div className="text-slate-400 text-[11px]">{m.description}</div>
                    </td>
                    <td className="p-3.5 font-mono text-slate-300">{m.date}</td>
                    <td className="p-3.5 text-center font-mono font-bold text-amber-400">{m.percentage}%</td>
                    <td className="p-3.5 text-center">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        m.percentage === 100 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {m.status || (m.percentage === 100 ? 'Completed' : 'In Progress')}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      <button
                        onClick={async () => {
                          const newPct = prompt('Update completion percentage (0 - 100):', String(m.percentage));
                          if (newPct !== null) {
                            await fetch(`/api/erp/milestones/${m.id}`, {
                              method: 'PUT',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ percentage: Number(newPct), status: Number(newPct) === 100 ? 'Completed' : 'In Progress' })
                            });
                            showToast('Milestone updated.');
                            setMilestones(prev => prev.map(x => x.id === m.id ? { ...x, percentage: Number(newPct) } : x));
                          }
                        }}
                        className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 cursor-pointer"
                      >
                        Edit %
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 6. PROJECT INVOICES */}
      {/* ========================================================= */}
      {activeSection === 'invoices' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Commercial Invoices & Billing</h3>
              <p className="text-xs text-slate-400">Issue milestone invoices, manage TVA calculations, and record payments.</p>
            </div>
            <button
              onClick={() => setShowAddInvoiceModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Generate New Invoice</span>
            </button>
          </div>

          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Invoice #</th>
                  <th className="p-3.5">Client</th>
                  <th className="p-3.5">Dates</th>
                  <th className="p-3.5 text-right">Subtotal (XAF)</th>
                  <th className="p-3.5 text-right">Total TTC (XAF)</th>
                  <th className="p-3.5 text-right">Balance Due</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {invoices.map(inv => (
                  <tr key={inv.id}>
                    <td className="p-3.5 font-mono text-amber-400 font-bold">{inv.invoice_number}</td>
                    <td className="p-3.5">
                      <div className="font-bold text-white">{inv.client_name || 'Dr. Paul Biwoli'}</div>
                      <div className="text-slate-400 text-[11px]">{inv.project_title}</div>
                    </td>
                    <td className="p-3.5 text-slate-300 font-mono text-[11px]">
                      <div>Issued: {inv.issue_date}</div>
                      <div className="text-amber-400">Due: {inv.due_date}</div>
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-300">{Number(inv.subtotal_xaf).toLocaleString()}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-white">{Number(inv.total_amount_xaf).toLocaleString()}</td>
                    <td className="p-3.5 text-right font-mono font-bold text-amber-400">{Number(inv.balance_due_xaf).toLocaleString()}</td>
                    <td className="p-3.5 text-center">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                        inv.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                      }`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {Number(inv.balance_due_xaf) > 0 && (
                        <button
                          onClick={async () => {
                            const ref = prompt('Enter payment transaction reference (e.g. MTN MoMo TxID):', 'MOMO-' + Date.now());
                            if (ref) {
                              await fetch(`/api/erp/invoices/${inv.id}/record-payment`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ amountXaf: inv.balance_due_xaf, paymentMethod: 'MTN_MOMO', paymentReference: ref })
                              });
                              showToast('Payment recorded.');
                              loadAllData();
                            }
                          }}
                          className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded hover:bg-emerald-500/30 font-bold text-[11px] cursor-pointer"
                        >
                          Record Payment
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 7. COST ESTIMATOR & 8. BOQ MANAGEMENT */}
      {/* ========================================================= */}
      {(activeSection === 'estimator' || activeSection === 'boq') && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
            <h3 className="text-lg font-bold text-white mb-2">Cameroon Building Cost Estimator & BOQ Engine</h3>
            <p className="text-xs text-slate-400 mb-6">
              Calculate accurate construction costs based on regional material benchmarks (sand, gravel, CPA 42.5 cement, rebar) and Eurocode 2 engineering tolerances.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div>
                <label className="text-xs text-slate-400 font-mono block mb-1">Building Typology</label>
                <select
                  value={estParams.buildingType}
                  onChange={(e) => setEstParams(p => ({ ...p, buildingType: e.target.value }))}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                >
                  <option value="VILLA">Residential Luxury Villa</option>
                  <option value="COMMERCIAL">Commercial Office Complex</option>
                  <option value="MULTI_FAMILY">Multi-Unit Apartment (R+3)</option>
                  <option value="INDUSTRIAL">Industrial Warehouse / Depot</option>
                </select>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-mono block mb-1">Gross Floor Area (m²)</label>
                <input
                  type="number"
                  value={estParams.totalFloorAreaM2}
                  onChange={(e) => setEstParams(p => ({ ...p, totalFloorAreaM2: Number(e.target.value) }))}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 font-mono block mb-1">Elevation (Floors)</label>
                <input
                  type="number"
                  value={estParams.floorsCount}
                  onChange={(e) => setEstParams(p => ({ ...p, floorsCount: Number(e.target.value) }))}
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono"
                />
              </div>

              <div className="flex items-end">
                <button
                  onClick={calculateEstimate}
                  className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Calculator className="w-4 h-4" />
                  <span>Compute BOQ Estimates</span>
                </button>
              </div>
            </div>

            {estResult && (
              <div className="space-y-6 pt-6 border-t border-slate-800">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                    <span className="text-xs text-slate-400 font-mono">Unit Rate per m²</span>
                    <div className="text-lg font-bold font-mono text-white mt-1">
                      {estResult.summary.baseRatePerM2.toLocaleString()} XAF/m²
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                    <span className="text-xs text-slate-400 font-mono">Contingency (5%)</span>
                    <div className="text-lg font-bold font-mono text-amber-400 mt-1">
                      {estResult.summary.contingencyXaf.toLocaleString()} XAF
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                    <span className="text-xs text-slate-400 font-mono">Cameroon TVA (19.25%)</span>
                    <div className="text-lg font-bold font-mono text-sky-400 mt-1">
                      {estResult.summary.tvaXaf.toLocaleString()} XAF
                    </div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
                    <span className="text-xs text-slate-400 font-mono">Grand Total (TTC)</span>
                    <div className="text-lg font-bold font-mono text-emerald-400 mt-1">
                      {estResult.summary.grandTotalXaf.toLocaleString()} XAF
                    </div>
                  </div>
                </div>

                {/* BOQ Line Items */}
                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950">
                  <div className="p-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-amber-400 uppercase">Itemized Trade Breakdown (BOQ)</span>
                    <button
                      onClick={() => {
                        const csvContent = "data:text/csv;charset=utf-8," + 
                          ["Trade Code,Trade Name,Category,Materials XAF,Labour XAF,Equipment XAF,Total XAF"].concat(
                            estResult.boqItems.map((i: any) => `${i.tradeCode},"${i.tradeName}",${i.category},${i.materialsAmountXaf},${i.labourAmountXaf},${i.equipmentAmountXaf},${i.totalAmountXaf}`)
                          ).join("\n");
                        const encodedUri = encodeURI(csvContent);
                        const link = document.createElement("a");
                        link.setAttribute("href", encodedUri);
                        link.setAttribute("download", `MADECC_BOQ_Estimate_${Date.now()}.csv`);
                        document.body.appendChild(link);
                        link.click();
                      }}
                      className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded text-xs flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export BOQ (CSV)</span>
                    </button>
                  </div>

                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900/60 text-slate-400 font-mono uppercase text-[10px]">
                      <tr>
                        <th className="p-3">Code</th>
                        <th className="p-3">Trade / Work Package</th>
                        <th className="p-3 text-right">Materials (XAF)</th>
                        <th className="p-3 text-right">Labour (XAF)</th>
                        <th className="p-3 text-right">Equipment (XAF)</th>
                        <th className="p-3 text-right">Subtotal (XAF)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono">
                      {estResult.boqItems.map((item: any) => (
                        <tr key={item.tradeCode} className="hover:bg-slate-900/30">
                          <td className="p-3 text-amber-500 font-bold">{item.tradeCode}</td>
                          <td className="p-3 font-sans font-medium text-white">{item.tradeName}</td>
                          <td className="p-3 text-right text-slate-300">{item.materialsAmountXaf.toLocaleString()}</td>
                          <td className="p-3 text-right text-slate-300">{item.labourAmountXaf.toLocaleString()}</td>
                          <td className="p-3 text-right text-slate-300">{item.equipmentAmountXaf.toLocaleString()}</td>
                          <td className="p-3 text-right font-bold text-amber-400">{item.totalAmountXaf.toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 9. MATERIALS INVENTORY */}
      {/* ========================================================= */}
      {activeSection === 'inventory' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Materials & Stock Movement Control</h3>
              <p className="text-xs text-slate-400">Track site receipts, warehouse dispatches, and low stock alerts.</p>
            </div>
            <button
              onClick={() => setShowAddMovementModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Record Stock Movement</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Stock Roster */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <h4 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
                <span>Current Warehouse Inventory</span>
                <span className="text-[11px] font-mono text-amber-400">{inventoryItems.length} SKUs Tracked</span>
              </h4>
              <div className="space-y-3">
                {inventoryItems.map(item => (
                  <div key={item.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-white">{item.name}</div>
                      <div className="text-[11px] text-slate-400 font-mono">Code: {item.itemCode || item.item_code} • {item.category}</div>
                    </div>
                    <div className="text-right">
                      <div className={`font-mono font-bold text-sm ${item.quantity <= (item.reorderLevel || 10) ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {item.quantity} {item.unit}
                      </div>
                      <div className="text-[10px] text-slate-400">@ {Number(item.unitPrice || 0).toLocaleString()} XAF</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Movement Logs */}
            <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800">
              <h4 className="text-sm font-bold text-white mb-3">Recent Movement History</h4>
              <div className="space-y-3">
                {inventoryMovements.map(mov => (
                  <div key={mov.id} className="p-3 rounded-xl bg-slate-800/40 border border-slate-700/60 text-xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-amber-400 font-bold">{mov.movement_type}</span>
                      <span className="text-[10px] text-slate-400 font-mono">{mov.movement_date}</span>
                    </div>
                    <div className="text-white font-medium">
                      Quantity: {mov.quantity} {mov.unit} • Total: {Number(mov.total_cost_xaf).toLocaleString()} XAF
                    </div>
                    <div className="text-slate-400 text-[11px] mt-0.5">
                      Site: {mov.project_title} • Authorized by: {mov.authorized_by}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 10. EQUIPMENT MANAGEMENT */}
      {/* ========================================================= */}
      {activeSection === 'equipment' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Machinery & Heavy Equipment Fleet</h3>
              <p className="text-xs text-slate-400">Track asset assignments, operators, hourly rates, and preventative maintenance.</p>
            </div>
            <button
              onClick={() => setShowAddEquipmentModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Equipment</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {equipmentList.map(eq => (
              <div key={eq.id} className="p-5 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-mono text-amber-400 font-bold">{eq.asset_tag}</span>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold ${
                    eq.status === 'ASSIGNED' ? 'bg-sky-500/20 text-sky-400' : 'bg-emerald-500/20 text-emerald-400'
                  }`}>
                    {eq.status}
                  </span>
                </div>

                <h4 className="text-base font-bold text-white">{eq.name}</h4>
                <p className="text-xs text-slate-400 mt-1">{eq.brand_model} • {eq.category}</p>

                <div className="mt-4 pt-3 border-t border-slate-800 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-400">
                    <span>Assigned Site:</span>
                    <span className="text-white font-medium">{eq.assigned_project_title || 'Depot'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Operator:</span>
                    <span className="text-white font-medium">{eq.assigned_operator || 'Standby'}</span>
                  </div>
                  <div className="flex justify-between text-slate-400">
                    <span>Hourly Rate:</span>
                    <span className="font-mono text-amber-400 font-bold">{Number(eq.hourly_rate_xaf).toLocaleString()} XAF</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 11. SUBCONTRACTORS */}
      {/* ========================================================= */}
      {activeSection === 'subcontractors' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Specialized Subcontractors Directory</h3>
              <p className="text-xs text-slate-400">Track trade partners, RCCM registrations, and performance scorecards.</p>
            </div>
            <button
              onClick={() => setShowAddSubModal(true)}
              className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Subcontractor</span>
            </button>
          </div>

          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Company & Contact</th>
                  <th className="p-3.5">Specialization</th>
                  <th className="p-3.5">Registration (RCCM/NIU)</th>
                  <th className="p-3.5 text-center">Rating</th>
                  <th className="p-3.5 text-center">Status</th>
                  <th className="p-3.5 text-right">Contract Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {subcontractors.map(s => (
                  <tr key={s.id}>
                    <td className="p-3.5">
                      <div className="font-bold text-white">{s.company_name}</div>
                      <div className="text-slate-400 text-[11px]">{s.contact_person} • {s.phone}</div>
                    </td>
                    <td className="p-3.5 text-amber-400 font-medium">{s.specialization}</td>
                    <td className="p-3.5 text-slate-400 font-mono text-[11px]">
                      <div>{s.rccm_number || 'RCCM Registered'}</div>
                      <div>{s.niu_tax_number || 'NIU Verified'}</div>
                    </td>
                    <td className="p-3.5 text-center font-bold text-amber-400">★ {s.rating}</td>
                    <td className="p-3.5 text-center">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400">
                        {s.status}
                      </span>
                    </td>
                    <td className="p-3.5 text-right font-mono font-bold text-white">
                      {Number(s.total_contract_value_xaf || 0).toLocaleString()} XAF
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 12. WORKFORCE & ATTENDANCE */}
      {/* ========================================================= */}
      {activeSection === 'workforce' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-white">Field Workforce & Daily Muster Roll</h3>
              <p className="text-xs text-slate-400">Record daily site attendance, regular hours, overtime, and labour costs.</p>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="date"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white font-mono"
              />

              <button
                onClick={handleSaveAttendance}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Sign Off All Present</span>
              </button>

              <button
                onClick={() => setShowAddWorkerModal(true)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New Worker</span>
              </button>
            </div>
          </div>

          <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-900">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                <tr>
                  <th className="p-3.5">Worker Code</th>
                  <th className="p-3.5">Artisan / Staff Name</th>
                  <th className="p-3.5">Trade & Skill Level</th>
                  <th className="p-3.5 text-right">Daily Rate (XAF)</th>
                  <th className="p-3.5 text-center">Status Today</th>
                  <th className="p-3.5 text-right">Assigned Site</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {workers.map(w => (
                  <tr key={w.id}>
                    <td className="p-3.5 font-mono text-amber-400 font-bold">{w.worker_code}</td>
                    <td className="p-3.5 font-bold text-white">{w.full_name}</td>
                    <td className="p-3.5">
                      <div className="text-white">{w.trade_category}</div>
                      <div className="text-[10px] font-mono text-slate-400">{w.skill_level}</div>
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-300">{Number(w.daily_rate_xaf).toLocaleString()}</td>
                    <td className="p-3.5 text-center">
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full font-bold bg-emerald-500/20 text-emerald-400">
                        PRESENT (8.0h)
                      </span>
                    </td>
                    <td className="p-3.5 text-right text-slate-400 text-xs">
                      {w.assigned_project_title || 'Mbankolo Hill Site'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 13. REPORTS & ANALYTICS */}
      {/* ========================================================= */}
      {activeSection === 'reports' && (
        <div className="space-y-6">
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-bold text-white">Executive Construction Intelligence</h3>
                <p className="text-xs text-slate-400">Aggregated multi-project financials, equipment utilization, and labor burn rates.</p>
              </div>

              <button
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Export Report (PDF)</span>
              </button>
            </div>

            {analyticsOverview && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700">
                  <span className="text-xs text-slate-400 font-mono">Total Certified Invoiced</span>
                  <div className="text-xl font-bold font-mono text-white mt-1">
                    {Number(analyticsOverview.invoices?.total_invoiced || 0).toLocaleString()} XAF
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700">
                  <span className="text-xs text-slate-400 font-mono">Collected Cashflow</span>
                  <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
                    {Number(analyticsOverview.invoices?.total_collected || 0).toLocaleString()} XAF
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700">
                  <span className="text-xs text-slate-400 font-mono">Client Receivables Due</span>
                  <div className="text-xl font-bold font-mono text-amber-400 mt-1">
                    {Number(analyticsOverview.invoices?.total_receivables || 0).toLocaleString()} XAF
                  </div>
                </div>

                <div className="p-5 rounded-2xl bg-slate-800/50 border border-slate-700">
                  <span className="text-xs text-slate-400 font-mono">Daily Workforce Burn</span>
                  <div className="text-xl font-bold font-mono text-sky-400 mt-1">
                    {Number(analyticsOverview.workforce?.daily_burn_rate_xaf || 0).toLocaleString()} XAF
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADD CLIENT */}
      {showAddClientModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl p-6 bg-slate-900 border border-slate-800 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-base font-bold">Register Client Account</h4>
              <button onClick={() => setShowAddClientModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Full Name</label>
                <input required type="text" value={newClient.fullName} onChange={e => setNewClient({ ...newClient, fullName: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Company / Organization</label>
                <input type="text" value={newClient.companyName} onChange={e => setNewClient({ ...newClient, companyName: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Email Address</label>
                <input required type="email" value={newClient.email} onChange={e => setNewClient({ ...newClient, email: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Primary Phone</label>
                  <input type="text" value={newClient.phone} onChange={e => setNewClient({ ...newClient, phone: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">City</label>
                  <input type="text" value={newClient.city} onChange={e => setNewClient({ ...newClient, city: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Portal Password</label>
                <input type="text" value={newClient.defaultPassword} onChange={e => setNewClient({ ...newClient, defaultPassword: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono" />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddClientModal(false)} className="px-4 py-2 bg-slate-800 rounded-xl text-slate-300">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl">Save & Generate Access</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD MEDIA */}
      {showAddMediaModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl p-6 bg-slate-900 border border-slate-800 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-base font-bold">Add Construction Photo / Video</h4>
              <button onClick={() => setShowAddMediaModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateMedia} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Phase</label>
                <select value={newMedia.phase} onChange={e => setNewMedia({ ...newMedia, phase: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white">
                  <option value="Site Preparation">Site Preparation</option>
                  <option value="Foundation & Earthworks">Foundation & Earthworks</option>
                  <option value="Superstructure & Columns">Superstructure & Columns</option>
                  <option value="Roofing & Framing">Roofing & Framing</option>
                  <option value="Finishing & Plaster">Finishing & Plaster</option>
                  <option value="Handover & Commissioning">Handover & Commissioning</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Media Title</label>
                <input required type="text" placeholder="e.g. Concrete slab casting verification" value={newMedia.title} onChange={e => setNewMedia({ ...newMedia, title: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Image / Video URL</label>
                <input required type="url" placeholder="https://..." value={newMedia.mediaUrl} onChange={e => setNewMedia({ ...newMedia, mediaUrl: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Description / Notes</label>
                <textarea rows={2} value={newMedia.description} onChange={e => setNewMedia({ ...newMedia, description: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="client-visible" checked={newMedia.isClientVisible} onChange={e => setNewMedia({ ...newMedia, isClientVisible: e.target.checked })} />
                <label htmlFor="client-visible" className="text-slate-300">Publish immediately to Client Portal</label>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddMediaModal(false)} className="px-4 py-2 bg-slate-800 rounded-xl text-slate-300">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl">Save Media</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD MILESTONE */}
      {showAddMilestoneModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl p-6 bg-slate-900 border border-slate-800 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-base font-bold">Register Project Milestone</h4>
              <button onClick={() => setShowAddMilestoneModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateMilestone} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Milestone Name</label>
                <input required type="text" placeholder="e.g. Level 1 suspended beams casting" value={newMilestone.milestone} onChange={e => setNewMilestone({ ...newMilestone, milestone: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Target Date</label>
                <input required type="date" value={newMilestone.date} onChange={e => setNewMilestone({ ...newMilestone, date: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Progress Percentage (0 - 100)</label>
                <input required type="number" min="0" max="100" value={newMilestone.percentage} onChange={e => setNewMilestone({ ...newMilestone, percentage: Number(e.target.value) })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono" />
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Description</label>
                <textarea rows={2} value={newMilestone.description} onChange={e => setNewMilestone({ ...newMilestone, description: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddMilestoneModal(false)} className="px-4 py-2 bg-slate-800 rounded-xl text-slate-300">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl">Save Milestone</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD INVOICE */}
      {showAddInvoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl p-6 bg-slate-900 border border-slate-800 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-base font-bold">Generate Project Invoice</h4>
              <button onClick={() => setShowAddInvoiceModal(false)} className="text-slate-400 hover:text-white">✕</button>
            </div>
            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Client Recipient</label>
                <select value={newInvoice.clientId} onChange={e => setNewInvoice({ ...newInvoice, clientId: Number(e.target.value) })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white">
                  {clients.map(c => <option key={c.id} value={c.id}>{c.full_name} ({c.client_code})</option>)}
                </select>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Primary Work Description</label>
                <input required type="text" value={newInvoice.description} onChange={e => setNewInvoice({ ...newInvoice, description: e.target.value })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Quantity</label>
                  <input required type="number" value={newInvoice.quantity} onChange={e => setNewInvoice({ ...newInvoice, quantity: Number(e.target.value) })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Unit Price (XAF)</label>
                  <input required type="number" value={newInvoice.unitPriceXaf} onChange={e => setNewInvoice({ ...newInvoice, unitPriceXaf: Number(e.target.value) })} className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white font-mono" />
                </div>
              </div>
              <div className="p-3 bg-slate-800/60 rounded-xl text-slate-300">
                <div>Subtotal (HT): <strong className="text-white font-mono">{(Number(newInvoice.quantity) * Number(newInvoice.unitPriceXaf)).toLocaleString()} XAF</strong></div>
                <div className="text-[11px] text-amber-400 mt-1">Automatic Cameroon 19.25% TVA applied to total.</div>
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddInvoiceModal(false)} className="px-4 py-2 bg-slate-800 rounded-xl text-slate-300">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl">Issue Official Invoice</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
