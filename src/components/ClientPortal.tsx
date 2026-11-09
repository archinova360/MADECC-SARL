import React, { useState, useEffect } from 'react';
import { 
  Building2, ShieldCheck, Lock, Mail, User, Phone, MapPin, 
  Calendar, CheckCircle2, Clock, AlertTriangle, ArrowRight, 
  Download, Eye, DollarSign, CreditCard, ChevronRight, RefreshCw, 
  LogOut, FileText, Camera, Video, Layers, ChevronDown, Check, 
  ExternalLink, Sparkles, Filter, Info
} from 'lucide-react';
import { useTheme } from '../lib/ThemeContext.tsx';
import { useSiteSettings } from '../lib/SiteSettingsContext.tsx';

interface ClientUser {
  id: number;
  clientCode: string;
  fullName: string;
  companyName?: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
}

interface AssignedProject {
  id: number;
  title: string;
  description: string;
  category: string;
  location: string;
  budget: string;
  status: string;
  image: string;
  video_url?: string;
  start_date?: string;
  end_date?: string;
  client_role?: string;
  access_level?: string;
  completion_percentage?: number;
}

interface ProjectMedia {
  id: number;
  project_id: number;
  phase: string;
  media_type: string;
  title: string;
  description: string;
  media_url: string;
  upload_date: string;
  uploaded_by: string;
}

interface InvoiceItem {
  id: number;
  item_number: number;
  description: string;
  category: string;
  unit: string;
  quantity: number;
  unit_price_xaf: number;
  total_price_xaf: number;
}

interface Invoice {
  id: number;
  invoice_number: string;
  project_id: number;
  project_title?: string;
  issue_date: string;
  due_date: string;
  subtotal_xaf: number;
  tax_rate_percent: number;
  tax_amount_xaf: number;
  discount_xaf: number;
  total_amount_xaf: number;
  paid_amount_xaf: number;
  balance_due_xaf: number;
  status: string;
  notes?: string;
  items?: InvoiceItem[];
}

interface Milestone {
  id: number;
  milestone: string;
  description: string;
  percentage: number;
  status: string;
  date: string;
}

export default function ClientPortal({ onNavigateToTab }: { onNavigateToTab?: (tab: string) => void }) {
  const { theme } = useTheme();
  const { settings } = useSiteSettings();

  const [client, setClient] = useState<ClientUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'media' | 'milestones' | 'invoices' | 'profile'>('overview');

  // Auth form states
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  // Data states
  const [projects, setProjects] = useState<AssignedProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [mediaList, setMediaList] = useState<ProjectMedia[]>([]);
  const [selectedPhase, setSelectedPhase] = useState<string>('ALL');
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentRefInput, setPaymentRefInput] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');

  // Check stored session
  useEffect(() => {
    try {
      const savedClient = localStorage.getItem('madecc_client_profile');
      if (savedClient) {
        setClient(JSON.parse(savedClient));
      }
    } catch (e) {
      console.warn('Failed parsing saved client session');
    }
    setLoading(false);
  }, []);

  // Fetch client data when authenticated
  useEffect(() => {
    if (!client) return;

    // Fetch projects
    fetch(`/api/client/${client.id}/projects`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.projects) {
          setProjects(data.projects);
          if (data.projects.length > 0 && !selectedProjectId) {
            setSelectedProjectId(data.projects[0].id);
          }
        }
      })
      .catch(err => { if (err?.name !== 'AbortError') console.warn('Error fetching client projects:', err); });

    // Fetch invoices
    fetch(`/api/client/${client.id}/invoices`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.invoices) {
          setInvoices(data.invoices);
        }
      })
      .catch(err => { if (err?.name !== 'AbortError') console.warn('Error fetching invoices:', err); });
  }, [client]);

  // Fetch project media & milestones when project is selected
  useEffect(() => {
    if (!selectedProjectId) return;

    fetch(`/api/client/projects/${selectedProjectId}/media`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.media) {
          setMediaList(data.media);
        }
      })
      .catch(err => { if (err?.name !== 'AbortError') console.warn('Error fetching media:', err); });

    fetch(`/api/erp/projects/${selectedProjectId}/milestones`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.milestones) {
          setMilestones(data.milestones);
        }
      })
      .catch(err => { if (err?.name !== 'AbortError') console.warn('Error fetching milestones:', err); });
  }, [selectedProjectId]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthLoading(true);

    try {
      const res = await fetch('/api/client/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Authentication failed. Please verify your credentials.');
      }

      setClient(data.client);
      localStorage.setItem('madecc_client_profile', JSON.stringify(data.client));
    } catch (err: any) {
      setAuthError(err.message || 'Login error occurred');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('madecc_client_profile');
    setClient(null);
    setProjects([]);
    setInvoices([]);
    setMediaList([]);
  };

  const handleRecordPayment = async (invoiceId: number) => {
    if (!paymentRefInput.trim()) return;
    setPaymentSubmitting(true);
    setPaymentSuccessMsg('');

    try {
      const res = await fetch(`/api/erp/invoices/${invoiceId}/record-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amountXaf: selectedInvoice?.balance_due_xaf || 0,
          paymentMethod: 'MTN_MOMO',
          paymentReference: paymentRefInput,
          notes: `Client self-declared transaction verification: ${paymentRefInput}`
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Could not verify payment');
      }

      setPaymentSuccessMsg('Payment confirmation reference submitted successfully. Our accounting unit will reconcile this receipt within 2 hours.');
      setInvoices(prev => prev.map(inv => inv.id === invoiceId ? data.invoice : inv));
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice(data.invoice);
      }
      setTimeout(() => {
        setShowPaymentModal(false);
        setPaymentRefInput('');
        setPaymentSuccessMsg('');
      }, 2500);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setPaymentSubmitting(false);
    }
  };

  // Calculations for dashboard
  const activeProjectsCount = projects.filter(p => p.status === 'ongoing' || p.status === 'in_progress').length;
  const completedProjectsCount = projects.filter(p => p.status === 'completed').length;
  const totalInvoiced = invoices.reduce((acc, inv) => acc + Number(inv.total_amount_xaf || 0), 0);
  const totalPaid = invoices.reduce((acc, inv) => acc + Number(inv.paid_amount_xaf || 0), 0);
  const totalBalanceDue = invoices.reduce((acc, inv) => acc + Number(inv.balance_due_xaf || 0), 0);
  const avgCompletion = projects.length > 0 
    ? Math.round(projects.reduce((acc, p) => acc + Number(p.completion_percentage || 0), 0) / projects.length)
    : 0;

  const currentProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  // Construction phases for media filtering
  const phases = [
    'ALL',
    'Site Preparation',
    'Foundation & Earthworks',
    'Superstructure & Columns',
    'Roofing & Framing',
    'Finishing & Plaster',
    'Handover & Commissioning'
  ];

  const filteredMedia = selectedPhase === 'ALL'
    ? mediaList
    : mediaList.filter(m => m.phase.toLowerCase().includes(selectedPhase.toLowerCase()));

  // 1. LOGIN SCREEN IF NOT AUTHENTICATED
  if (!client) {
    return (
      <div className={`min-h-screen py-16 px-4 flex items-center justify-center ${
        theme === 'light' ? 'bg-slate-100' : 'bg-slate-950'
      }`}>
        <div className={`w-full max-w-md p-8 rounded-2xl shadow-2xl border transition-all ${
          theme === 'light' 
            ? 'bg-white border-slate-200 text-slate-800' 
            : 'bg-slate-900 border-slate-800 text-slate-100'
        }`}>
          <div className="text-center mb-8">
            <div className="w-14 h-14 bg-amber-500/20 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-500/30">
              <Building2 className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black tracking-tight font-serif">Client Portal</h1>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-mono">
              MADECC GROUP Construction Operations
            </p>
          </div>

          {authError && (
            <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{authError}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                Client Corporate Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  placeholder="e.g. client@madeccgroup.online"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    theme === 'light' 
                      ? 'bg-slate-50 border-slate-300 text-slate-900' 
                      : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                  Access Password
                </label>
                <span className="text-[11px] text-amber-500 font-medium">Default: Client2026@Madecc</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    theme === 'light' 
                      ? 'bg-slate-50 border-slate-300 text-slate-900' 
                      : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={authLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-6"
            >
              {authLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Access Construction Dashboard</span>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-800 text-center text-xs text-slate-400">
            <p>Need access or invited by project management?</p>
            <p className="mt-1 font-mono text-[11px] text-amber-400">
              Hotline: {settings?.phone || '+237 671 06 35 11'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 2. AUTHENTICATED CLIENT DASHBOARD
  return (
    <div className={`min-h-screen ${theme === 'light' ? 'bg-slate-50 text-slate-900' : 'bg-slate-950 text-slate-100'}`}>
      {/* Top Banner / Client Context */}
      <div className={`border-b sticky top-0 z-30 shadow-md ${
        theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
      }`}>
        <div className="max-w-7xl mx-auto px-4 py-3.5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold font-serif text-lg border border-amber-500/30">
              {client.fullName.charAt(0)}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold">{client.fullName}</h2>
                <span className="text-[10px] bg-amber-500/20 text-amber-400 font-mono px-2 py-0.5 rounded-full font-bold">
                  {client.clientCode}
                </span>
              </div>
              <p className="text-xs text-slate-400 font-sans">
                {client.companyName || 'Private Client Property'} • {client.city || 'Yaoundé'}
              </p>
            </div>
          </div>

          {/* Quick Tab Selector */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'overview', label: 'Overview', icon: Building2 },
              { id: 'projects', label: 'Projects & Progress', icon: Layers },
              { id: 'media', label: 'Photos & Videos', icon: Camera },
              { id: 'milestones', label: 'Milestones', icon: CheckCircle2 },
              { id: 'invoices', label: 'Invoices & Billing', icon: DollarSign },
              { id: 'profile', label: 'Profile', icon: User }
            ].map(tab => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                    isActive
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : theme === 'light'
                        ? 'text-slate-600 hover:bg-slate-100'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}

            <button
              onClick={handleLogout}
              title="Sign Out"
              className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ml-2 ${
                theme === 'light' ? 'text-rose-600 hover:bg-rose-50' : 'text-rose-400 hover:bg-rose-950/40'
              }`}
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW DASHBOARD */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Welcome Jumbotron */}
            <div className={`p-6 sm:p-8 rounded-3xl border relative overflow-hidden shadow-xl ${
              theme === 'light'
                ? 'bg-gradient-to-br from-amber-50 via-white to-amber-100/30 border-amber-200/60'
                : 'bg-gradient-to-br from-slate-900 via-slate-900/90 to-amber-950/20 border-slate-800'
            }`}>
              <div className="max-w-3xl">
                <span className="text-[11px] font-mono uppercase tracking-widest text-amber-500 font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                  Real-Time Construction Monitoring
                </span>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-3 font-serif">
                  Welcome to Your Construction Command Portal
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                  Track site activities, inspect daily photographic milestones, view structural engineer certificates, and manage progress invoices with absolute transparency.
                </p>
              </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-5 rounded-2xl border ${
                theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-mono uppercase tracking-wider">Assigned Projects</span>
                  <Building2 className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black">{projects.length}</div>
                <div className="text-[11px] text-emerald-400 mt-1 flex items-center gap-1">
                  <span>{activeProjectsCount} Active Construction Sites</span>
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${
                theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-mono uppercase tracking-wider">Completion Average</span>
                  <Clock className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-2xl font-black">{avgCompletion}%</div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div 
                    className="bg-amber-500 h-full rounded-full transition-all duration-700"
                    style={{ width: `${avgCompletion}%` }}
                  />
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${
                theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-mono uppercase tracking-wider">Total Certified</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-black font-mono">
                  {totalPaid.toLocaleString()} <span className="text-xs font-sans text-amber-500">XAF</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Paid to date</div>
              </div>

              <div className={`p-5 rounded-2xl border ${
                theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-mono uppercase tracking-wider">Pending Invoices</span>
                  <DollarSign className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl font-black font-mono text-amber-400">
                  {totalBalanceDue.toLocaleString()} <span className="text-xs font-sans text-slate-400">XAF</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {invoices.filter(i => i.balance_due_xaf > 0).length} invoice(s) awaiting payment
                </div>
              </div>
            </div>

            {/* Quick Project Showcase */}
            {currentProject && (
              <div className={`p-6 rounded-3xl border shadow-lg ${
                theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <span className="text-xs font-mono uppercase text-amber-500 font-bold">Featured Construction Site</span>
                    <h3 className="text-xl font-bold font-serif mt-0.5">{currentProject.title}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      <span>{currentProject.location}</span>
                      <span>•</span>
                      <span>Category: {currentProject.category}</span>
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab('projects')}
                    className="px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Full Site Inspection</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-2 relative rounded-2xl overflow-hidden aspect-video border border-slate-800">
                    <img 
                      src={currentProject.image || 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1200&q=80'} 
                      alt={currentProject.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent flex items-end p-4">
                      <div className="text-white">
                        <div className="text-xs font-mono text-amber-400 font-bold uppercase">Current Phase</div>
                        <div className="text-sm font-bold">Level 1 Slab & Reinforced Concrete Casting</div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                      <div className="text-xs text-slate-400 mb-1">Contract Execution Status</div>
                      <div className="text-base font-bold text-amber-400 capitalize">{currentProject.status || 'Active Site'}</div>
                      <div className="text-[11px] text-slate-400 mt-1">Contract Role: {currentProject.client_role || 'Property Owner'}</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                      <div className="text-xs text-slate-400 mb-1">Assigned Supervising Engineer</div>
                      <div className="text-sm font-bold">Ing. Arnaud Fopa (ONIGC Registered)</div>
                      <div className="text-[11px] text-slate-400 mt-1">Direct Field Phone: +237 671 06 35 11</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                      <div className="text-xs text-slate-400 mb-1">Estimated Completion Target</div>
                      <div className="text-sm font-bold">{currentProject.end_date || 'December 2026'}</div>
                      <div className="text-[11px] text-emerald-400 mt-1">On schedule according to GANTT milestones</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: PROJECTS & PROGRESS */}
        {/* ========================================================= */}
        {activeTab === 'projects' && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold font-serif">Assigned Construction Sites</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Monitor detailed timelines, structural phase execution, and engineering deliverables.
                </p>
              </div>

              {projects.length > 1 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-slate-400">Select Project:</span>
                  <select
                    value={selectedProjectId || ''}
                    onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      theme === 'light' ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    {projects.map(p => (
                      <option key={p.id} value={p.id}>{p.title}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>

            {projects.map(project => {
              const isSelected = project.id === selectedProjectId;
              return (
                <div 
                  key={project.id}
                  className={`p-6 sm:p-8 rounded-3xl border transition-all ${
                    isSelected 
                      ? 'ring-2 ring-amber-500/40 border-amber-500/50 shadow-xl' 
                      : 'border-slate-800 opacity-90'
                  } ${theme === 'light' ? 'bg-white' : 'bg-slate-900'}`}
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono bg-amber-500/20 text-amber-400 font-bold px-2.5 py-0.5 rounded-full">
                          Site Ref: MAD-PRJ-{project.id}
                        </span>
                        <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full">
                          {project.category}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black font-serif mt-2">{project.title}</h3>
                      <p className="text-xs text-slate-400 flex items-center gap-2 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-500" />
                        <span>{project.location}</span>
                        <span>•</span>
                        <span>Start: {project.start_date || 'January 2026'}</span>
                        <span>•</span>
                        <span>Expected Delivery: {project.end_date || 'November 2026'}</span>
                      </p>
                    </div>

                    <div className="w-full lg:w-64 bg-slate-800/50 p-4 rounded-2xl border border-slate-800">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-400 font-mono">Completion</span>
                        <span className="font-bold text-amber-400">{project.completion_percentage || 45}%</span>
                      </div>
                      <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div 
                          className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full"
                          style={{ width: `${project.completion_percentage || 45}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 mt-4 leading-relaxed">
                    {project.description}
                  </p>

                  {/* Project Details Checklist */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                      <div className="text-xs font-mono uppercase text-slate-400 mb-1">Client Authority</div>
                      <div className="text-sm font-bold text-white">{project.client_role || 'Property Owner'}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Access Rights: {project.access_level || 'Full Verification'}</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                      <div className="text-xs font-mono uppercase text-slate-400 mb-1">Civil Engineer Lead</div>
                      <div className="text-sm font-bold text-white">Eng. Arnaud Fopa</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Head of Field Operations</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                      <div className="text-xs font-mono uppercase text-slate-400 mb-1">Contract Budget</div>
                      <div className="text-sm font-bold text-amber-400 font-mono">{project.budget || '45,000,000 XAF'}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Fixed-Price Turnkey Execution</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: PHOTOS & VIDEOS */}
        {/* ========================================================= */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold font-serif">Construction Progress Gallery</h2>
                <p className="text-xs text-slate-400 mt-1">
                  High-definition field photographs, drone surveys, and concrete curing test verifications.
                </p>
              </div>

              {/* Phase Filter */}
              <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1">
                {phases.map(phase => (
                  <button
                    key={phase}
                    onClick={() => setSelectedPhase(phase)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all cursor-pointer ${
                      selectedPhase === phase
                        ? 'bg-amber-500 text-slate-950 font-bold'
                        : theme === 'light'
                          ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {phase}
                  </button>
                ))}
              </div>
            </div>

            {filteredMedia.length === 0 ? (
              <div className={`p-12 text-center rounded-3xl border ${
                theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
              }`}>
                <Camera className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
                <h3 className="text-base font-bold">No photographs found for this phase</h3>
                <p className="text-xs text-slate-400 mt-1">Field engineers upload photographic updates every Tuesday & Friday.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMedia.map(item => (
                  <div 
                    key={item.id}
                    className={`rounded-2xl border overflow-hidden shadow-lg transition-all hover:border-amber-500/50 ${
                      theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    <div className="relative aspect-video bg-slate-950 overflow-hidden group">
                      <img 
                        src={item.media_url} 
                        alt={item.title} 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute top-2.5 left-2.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono text-amber-400 font-bold">
                        {item.phase}
                      </div>
                      <div className="absolute top-2.5 right-2.5 bg-slate-950/80 backdrop-blur-md px-2 py-1 rounded-full text-[10px] text-slate-300 flex items-center gap-1 font-mono">
                        <Calendar className="w-3 h-3 text-amber-400" />
                        <span>{item.upload_date}</span>
                      </div>
                    </div>

                    <div className="p-5">
                      <h4 className="text-sm font-bold line-clamp-1">{item.title}</h4>
                      <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">
                        {item.description || 'Verified on-site structural works by MADECC project engineers.'}
                      </p>

                      <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                        <span className="text-[11px] text-slate-400">By: {item.uploaded_by}</span>
                        <a 
                          href={item.media_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1"
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>High-Res</span>
                        </a>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: MILESTONES */}
        {/* ========================================================= */}
        {activeTab === 'milestones' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-2xl font-bold font-serif">Project Milestones & Deliverables</h2>
              <p className="text-xs text-slate-400 mt-1">
                Contractual milestones approved by supervising civil engineers and chartered architects.
              </p>
            </div>

            <div className={`p-6 sm:p-8 rounded-3xl border ${
              theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="space-y-6">
                {(milestones.length > 0 ? milestones : [
                  { id: 1, milestone: 'Site Topography & Soil Geotechnical Testing', description: 'CBR tests, foundation bearing capacity validation & site beaconing', percentage: 100, status: 'Completed', date: '2026-01-20' },
                  { id: 2, milestone: 'Bulk Excavation & Substructure Strip Footings', description: 'Reinforced concrete Class C25/30 foundation pour with vibrated compaction', percentage: 100, status: 'Completed', date: '2026-02-15' },
                  { id: 3, milestone: 'Ground Floor Slab & Superstructure Columns', description: 'Level 0 solid slab casting and column elevation to 3.2m', percentage: 80, status: 'In Progress', date: '2026-03-30' },
                  { id: 4, milestone: 'Level 1 Beams, Floor Slab & Cantilevers', description: 'Doka formwork erection, high-yield FeE500 steel tying and casting', percentage: 25, status: 'In Progress', date: '2026-05-15' },
                  { id: 5, milestone: 'Roof Truss Framing & Aluzinc Weatherproofing', description: 'Treated pine timber trusses and 0.50mm prepainted aluminium sheeting', percentage: 0, status: 'Pending', date: '2026-07-20' },
                  { id: 6, milestone: 'Electrical & Plumbing Internal First Fix', description: 'PVC conduits, copper piping pressure tests and distribution board installation', percentage: 0, status: 'Pending', date: '2026-09-10' },
                  { id: 7, milestone: 'Final Finishes, Tiling, Glazing & Handover', description: 'Porcelain floor tiles, aluminium sliding joinery, sanitaryware and commissioning', percentage: 0, status: 'Pending', date: '2026-11-15' }
                ]).map((m, idx) => {
                  const isDone = m.percentage === 100 || m.status === 'Completed';
                  const inProg = m.percentage > 0 && m.percentage < 100;

                  return (
                    <div key={m.id || idx} className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                          isDone 
                            ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' 
                            : inProg 
                              ? 'bg-amber-500 text-slate-950 animate-pulse' 
                              : 'bg-slate-800 text-slate-500'
                        }`}>
                          {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                        </div>
                        {idx < 6 && <div className="w-0.5 h-16 bg-slate-800 my-1" />}
                      </div>

                      <div className="flex-grow pb-6">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                          <h4 className="text-sm font-bold text-white">{m.milestone}</h4>
                          <span className={`text-[11px] font-mono font-bold px-2.5 py-0.5 rounded-full w-fit ${
                            isDone 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                              : inProg 
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' 
                                : 'bg-slate-800 text-slate-400'
                          }`}>
                            {m.status || (isDone ? 'Completed' : inProg ? 'In Progress' : 'Pending')} ({m.percentage}%)
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 leading-relaxed">{m.description}</p>
                        <div className="text-[11px] font-mono text-slate-500 mt-1">Target Milestone Date: {m.date}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: INVOICES & BILLING */}
        {/* ========================================================= */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold font-serif">Project Invoices & Statements</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Download official tax invoices, check outstanding progress balances, and record payments.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div className="text-right">
                  <div className="text-xs text-slate-400 font-mono">Total Outstanding</div>
                  <div className="text-base font-bold text-amber-400 font-mono">
                    {totalBalanceDue.toLocaleString()} XAF
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {invoices.map(inv => (
                <div 
                  key={inv.id}
                  className={`p-6 rounded-2xl border transition-all ${
                    theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold font-mono text-amber-400">{inv.invoice_number}</span>
                        <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                          inv.status === 'PAID'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : inv.status === 'PARTIALLY_PAID'
                              ? 'bg-sky-500/10 text-sky-400 border border-sky-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}>
                          {inv.status}
                        </span>
                      </div>
                      <div className="text-xs text-slate-400 mt-1">
                        Issue Date: {inv.issue_date} • Due Date: {inv.due_date}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-4">
                      <div className="text-right">
                        <div className="text-xs text-slate-400">Total Invoice (Inc. TVA)</div>
                        <div className="text-base font-bold font-mono text-white">
                          {Number(inv.total_amount_xaf).toLocaleString()} XAF
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs text-slate-400">Balance Due</div>
                        <div className={`text-base font-bold font-mono ${
                          Number(inv.balance_due_xaf) > 0 ? 'text-amber-400' : 'text-emerald-400'
                        }`}>
                          {Number(inv.balance_due_xaf).toLocaleString()} XAF
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedInvoice(inv)}
                          className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5 text-amber-400" />
                          <span>Inspect</span>
                        </button>

                        {Number(inv.balance_due_xaf) > 0 && (
                          <button
                            onClick={() => {
                              setSelectedInvoice(inv);
                              setShowPaymentModal(true);
                            }}
                            className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-md"
                          >
                            <CreditCard className="w-3.5 h-3.5" />
                            <span>Pay via MoMo</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {inv.notes && (
                    <div className="mt-3 text-xs text-slate-400 italic">
                      Note: {inv.notes}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Payment & Banking Coordinates */}
            <div className={`p-6 sm:p-8 rounded-3xl border ${
              theme === 'light' ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-900/60 border-slate-800'
            }`}>
              <h3 className="text-sm font-bold font-mono uppercase tracking-wider text-amber-500 mb-3 flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                <span>MADECC GROUP Official Bank & Mobile Money Coordinates</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <div className="font-bold text-amber-400 mb-1">MTN Mobile Money (MoMo)</div>
                  <div className="font-mono text-slate-200 text-sm font-bold">{settings?.paymentMtnNumbers || '+237 671 06 35 11'}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Merchant Name: MADECC GROUP SARL</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <div className="font-bold text-orange-400 mb-1">Orange Money Cameroon</div>
                  <div className="font-mono text-slate-200 text-sm font-bold">{settings?.paymentOrangeNumbers || '+237 699 82 41 05'}</div>
                  <div className="text-[11px] text-slate-400 mt-1">Code Marchand: 842109</div>
                </div>

                <div className="p-4 rounded-xl bg-slate-800/50 border border-slate-700/60">
                  <div className="font-bold text-sky-400 mb-1">Bank Wire (UBA / Afriland)</div>
                  <div className="font-mono text-slate-200 text-xs font-bold">10033 05214 14008291024 88</div>
                  <div className="text-[11px] text-slate-400 mt-1">SWIFT: UBAFCMCX, Yaoundé Main Branch</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: PROFILE */}
        {/* ========================================================= */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-6">
            <div className={`p-8 rounded-3xl border ${
              theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-800">
                <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-2xl font-serif border border-amber-500/30">
                  {client.fullName.charAt(0)}
                </div>
                <div>
                  <h3 className="text-xl font-bold font-serif">{client.fullName}</h3>
                  <p className="text-xs text-slate-400 font-mono">{client.clientCode}</p>
                </div>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="text-slate-400 font-mono uppercase tracking-wider block mb-1">Company / Organization</label>
                  <div className="p-3 rounded-xl bg-slate-800/50 text-white font-medium border border-slate-700">
                    {client.companyName || 'Individual Real Estate Sponsor'}
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 font-mono uppercase tracking-wider block mb-1">Email Address</label>
                  <div className="p-3 rounded-xl bg-slate-800/50 text-white font-medium border border-slate-700">
                    {client.email}
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 font-mono uppercase tracking-wider block mb-1">Phone Number</label>
                  <div className="p-3 rounded-xl bg-slate-800/50 text-white font-medium border border-slate-700">
                    {client.phone || '+237 671 06 35 11'}
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 font-mono uppercase tracking-wider block mb-1">Office / Billing Address</label>
                  <div className="p-3 rounded-xl bg-slate-800/50 text-white font-medium border border-slate-700">
                    {client.address || 'Quartier Bastos, Yaoundé, Cameroon'}
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-500">Need to update coordinates? Contact project manager.</span>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Log Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* INVOICE DETAILS MODAL */}
      {selectedInvoice && !showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 border shadow-2xl ${
            theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono text-amber-500 font-bold">OFFICIAL CONSTRUCTION INVOICE</span>
                <h3 className="text-xl font-bold font-serif">{selectedInvoice.invoice_number}</h3>
              </div>
              <button
                onClick={() => setSelectedInvoice(null)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 my-6 text-xs">
              <div>
                <span className="text-slate-400 block font-mono">Issued To:</span>
                <div className="font-bold text-sm text-white mt-0.5">{client.fullName}</div>
                <div className="text-slate-400">{client.companyName}</div>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block font-mono">Invoice Dates:</span>
                <div className="text-slate-300 mt-0.5">Issue: {selectedInvoice.issue_date}</div>
                <div className="text-amber-400 font-bold">Due: {selectedInvoice.due_date}</div>
              </div>
            </div>

            {/* Line Items Table */}
            <div className="border border-slate-800 rounded-xl overflow-hidden mb-6">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-800 text-slate-300 font-mono uppercase text-[10px]">
                  <tr>
                    <th className="p-3">#</th>
                    <th className="p-3">Description</th>
                    <th className="p-3 text-right">Qty</th>
                    <th className="p-3 text-right">Unit Price (XAF)</th>
                    <th className="p-3 text-right">Total (XAF)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-sans">
                  {(selectedInvoice.items && selectedInvoice.items.length > 0 ? selectedInvoice.items : [
                    { id: 1, item_number: 1, description: 'Turnkey Construction Works Phase Execution', unit: 'LS', quantity: 1, unit_price_xaf: selectedInvoice.subtotal_xaf, total_price_xaf: selectedInvoice.subtotal_xaf }
                  ]).map(item => (
                    <tr key={item.id}>
                      <td className="p-3 font-mono text-slate-500">{item.item_number}</td>
                      <td className="p-3 font-medium text-white">{item.description}</td>
                      <td className="p-3 text-right font-mono">{item.quantity} {item.unit}</td>
                      <td className="p-3 text-right font-mono">{Number(item.unit_price_xaf).toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold">{Number(item.total_price_xaf).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals Summary */}
            <div className="space-y-2 text-xs border-t border-slate-800 pt-4">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal (HT):</span>
                <span className="font-mono text-white">{Number(selectedInvoice.subtotal_xaf).toLocaleString()} XAF</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>TVA ({selectedInvoice.tax_rate_percent || 19.25}%):</span>
                <span className="font-mono text-white">{Number(selectedInvoice.tax_amount_xaf).toLocaleString()} XAF</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-800">
                <span className="text-white">Total Amount (TTC):</span>
                <span className="font-mono text-amber-400">{Number(selectedInvoice.total_amount_xaf).toLocaleString()} XAF</span>
              </div>
              <div className="flex justify-between text-emerald-400 font-bold">
                <span>Paid to Date:</span>
                <span className="font-mono">{Number(selectedInvoice.paid_amount_xaf).toLocaleString()} XAF</span>
              </div>
              <div className="flex justify-between text-amber-500 font-bold pt-1">
                <span>Balance Remaining:</span>
                <span className="font-mono">{Number(selectedInvoice.balance_due_xaf).toLocaleString()} XAF</span>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-3">
              <button
                onClick={() => window.print()}
                className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Print / Save PDF</span>
              </button>

              {Number(selectedInvoice.balance_due_xaf) > 0 && (
                <button
                  onClick={() => setShowPaymentModal(true)}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-lg"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Submit Payment Reference</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* PAYMENT MODAL */}
      {showPaymentModal && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className={`w-full max-w-md rounded-3xl p-6 sm:p-8 border shadow-2xl ${
            theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <span className="text-xs font-mono text-amber-500 font-bold">PAYMENT RECONCILIATION</span>
                <h3 className="text-lg font-bold font-serif">Invoice {selectedInvoice.invoice_number}</h3>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer text-xs"
              >
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4 text-xs">
              <div className="text-slate-400">Balance Due:</div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                {Number(selectedInvoice.balance_due_xaf).toLocaleString()} XAF
              </div>
              <p className="text-[11px] text-slate-300 mt-2">
                Send funds to MTN MoMo <strong className="text-white">{settings?.paymentMtnNumbers || '+237 671 06 35 11'}</strong> or Orange Money <strong className="text-white">{settings?.paymentOrangeNumbers || '+237 699 82 41 05'}</strong>, then paste the transaction ID below.
              </p>
            </div>

            {paymentSuccessMsg ? (
              <div className="p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 shrink-0" />
                <span>{paymentSuccessMsg}</span>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-mono uppercase text-slate-400 block mb-1.5">
                    Mobile Money / Wire Transaction Reference
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentRefInput}
                    onChange={(e) => setPaymentRefInput(e.target.value)}
                    placeholder="e.g. CI260324.1105.A10294 or Bank Ref"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white focus:outline-none focus:ring-2 focus:ring-amber-500 font-mono"
                  />
                </div>

                <button
                  onClick={() => handleRecordPayment(selectedInvoice.id)}
                  disabled={paymentSubmitting || !paymentRefInput.trim()}
                  className="w-full py-3 bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-slate-950 font-bold rounded-xl text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  {paymentSubmitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Submitting Reference...</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4" />
                      <span>Confirm & Reconcile Payment</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
