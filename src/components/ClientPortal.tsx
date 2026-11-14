import React, { useState, useEffect, useCallback } from 'react';
import {
  Building2, ShieldCheck, Lock, Mail, User, Phone, MapPin,
  Calendar, CheckCircle2, Clock, AlertTriangle, ArrowRight,
  Download, Eye, DollarSign, CreditCard, RefreshCw,
  LogOut, FileText, Camera, Video, Layers, Check,
  Share2, Printer, Search, Send, Copy, X, KeyRound, Save
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
  phoneSecondary?: string;
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
  current_phase?: string;
  latest_update_title?: string;
  latest_update_summary?: string;
  schedule_status?: string;
  schedule_variance?: string;
  delay_explanation?: string;
  supervisor_name?: string;
  supervisor_phone?: string;
  workforce_on_site?: number;
  last_update_date?: string;
  milestones_count?: number;
  media_count?: number;
}

interface ProjectUpdate {
  id: number;
  project_id: number;
  phase: string;
  title: string;
  summary: string;
  completion_percentage: number;
  status_badge: string;
  schedule_variance: string;
  delay_explanation?: string;
  supervisor_name: string;
  supervisor_phone?: string;
  workforce_on_site?: number;
  weather?: string;
  attachment_url?: string;
  attachment_type?: string;
  update_date: string;
  published_by?: string;
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
  milestone?: string;
  milestone_name?: string;
  description: string;
  percentage: number;
  status: string;
  date: string;
}

function isVideoMedia(url: string, mediaType?: string): boolean {
  if (mediaType && mediaType.toUpperCase() === 'VIDEO') return true;
  const lower = (url || '').toLowerCase();
  return lower.includes('/video/upload/') || /\.(mp4|mov|webm|mkv|avi|m4v)(\?.*)?$/.test(lower);
}

function getDownloadHref(url: string): string {
  if (!url) return '#';
  if (url.includes('res.cloudinary.com') && url.includes('/upload/') && !url.includes('/fl_attachment')) {
    return url.replace('/upload/', '/upload/fl_attachment/');
  }
  return url;
}

function exportCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const esc = (v: string | number | null | undefined) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.setAttribute('download', filename);
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export default function ClientPortal({ onNavigateToTab: _onNavigateToTab }: { onNavigateToTab?: (tab: string) => void }) {
  const { theme } = useTheme();
  const { settings } = useSiteSettings();

  const [client, setClient] = useState<ClientUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [syncing, setSyncing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'media' | 'milestones' | 'invoices' | 'profile'>('overview');
  const [portalToast, setPortalToast] = useState<{ text: string; type?: 'success' | 'error' } | null>(null);

  // Auth form states
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');
  const [authNotice, setAuthNotice] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [forgotMode, setForgotMode] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');

  // Live Data states
  const [projects, setProjects] = useState<AssignedProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [siteUpdates, setSiteUpdates] = useState<ProjectUpdate[]>([]);
  const [mediaList, setMediaList] = useState<ProjectMedia[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);

  // Filters
  const [selectedPhase, setSelectedPhase] = useState<string>('ALL');
  const [mediaTypeFilter, setMediaTypeFilter] = useState<'ALL' | 'PHOTO' | 'VIDEO'>('ALL');
  const [mediaSearch, setMediaSearch] = useState('');
  const [milestoneStatusFilter, setMilestoneStatusFilter] = useState('ALL');
  const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('ALL');
  const [invoiceSearch, setInvoiceSearch] = useState('');
  const [updateSearch, setUpdateSearch] = useState('');

  // Modals
  const [lightboxMedia, setLightboxMedia] = useState<ProjectMedia | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState<boolean>(false);
  const [paymentMethodInput, setPaymentMethodInput] = useState<'MTN_MOMO' | 'ORANGE_MONEY' | 'BANK_WIRE'>('MTN_MOMO');
  const [paymentRefInput, setPaymentRefInput] = useState('');
  const [paymentSubmitting, setPaymentSubmitting] = useState(false);
  const [paymentSuccessMsg, setPaymentSuccessMsg] = useState('');

  // Share via SMTP Modal
  const [shareModal, setShareModal] = useState<{
    open: boolean;
    title: string;
    subject: string;
    summary: string;
    detailsHtml: string;
  }>({ open: false, title: '', subject: '', summary: '', detailsHtml: '' });
  const [shareRecipient, setShareRecipient] = useState('');
  const [sharingBusy, setSharingBusy] = useState(false);

  // Profile Edit State
  const [profileForm, setProfileForm] = useState({
    fullName: '',
    companyName: '',
    phone: '',
    phoneSecondary: '',
    address: '',
    city: ''
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [savingProfile, setSavingProfile] = useState(false);

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setPortalToast({ text, type });
    setTimeout(() => setPortalToast(null), 4000);
  };

  // Sync profile form when client loads
  useEffect(() => {
    if (client) {
      setProfileForm({
        fullName: client.fullName || '',
        companyName: client.companyName || '',
        phone: client.phone || '',
        phoneSecondary: client.phoneSecondary || '',
        address: client.address || '',
        city: client.city || ''
      });
    }
  }, [client]);

  // Initial session hydration from localStorage + Neon session validation
  useEffect(() => {
    let active = true;
    const initSession = async () => {
      try {
        const saved = localStorage.getItem('madecc_client_profile');
        let localUser: ClientUser | null = saved ? JSON.parse(saved) : null;
        if (localUser && active) {
          setClient(localUser);
        }

        const meUrl = localUser?.id ? `/api/client/me?clientId=${localUser.id}` : '/api/client/me';
        const res = await fetch(meUrl, { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.client && active) {
            setClient(data.client);
            localStorage.setItem('madecc_client_profile', JSON.stringify(data.client));
          }
        } else if (res.status === 401 && localUser) {
          // Session invalid/suspended on Neon
          localStorage.removeItem('madecc_client_profile');
          if (active) setClient(null);
        }
      } catch {
        // Offline / fallback cleanly to stored profile if present
      } finally {
        if (active) setLoading(false);
      }
    };
    initSession();
    return () => { active = false; };
  }, []);

  const fetchProjectDetails = useCallback(async (projectId: number) => {
    if (!projectId) return;
    try {
      const [uRes, mRes, msRes] = await Promise.all([
        fetch(`/api/client/projects/${projectId}/updates`).then(r => r.json()).catch(() => ({})),
        fetch(`/api/client/projects/${projectId}/media`).then(r => r.json()).catch(() => ({})),
        fetch(`/api/erp/projects/${projectId}/milestones`).then(r => r.json()).catch(() => ({}))
      ]);
      if (uRes?.success) setSiteUpdates(uRes.updates || []);
      if (mRes?.success) setMediaList(mRes.media || []);
      if (msRes?.success) setMilestones(msRes.milestones || []);
    } catch (err: any) {
      if (err?.name !== 'AbortError') console.warn('Project details fetch error:', err);
    }
  }, []);

  const syncAllClientData = useCallback(async (clientId: number, currentProjId?: number | null) => {
    setSyncing(true);
    try {
      const [pRes, iRes] = await Promise.all([
        fetch(`/api/client/${clientId}/projects`).then(r => r.json()).catch(() => ({})),
        fetch(`/api/client/${clientId}/invoices`).then(r => r.json()).catch(() => ({}))
      ]);

      let targetProjId = currentProjId;
      if (pRes?.success && Array.isArray(pRes.projects)) {
        setProjects(pRes.projects);
        if (pRes.projects.length > 0 && (!targetProjId || !pRes.projects.some((p: any) => p.id === targetProjId))) {
          targetProjId = pRes.projects[0].id;
          setSelectedProjectId(targetProjId);
        }
      }
      if (iRes?.success && Array.isArray(iRes.invoices)) {
        setInvoices(iRes.invoices);
      }
      if (targetProjId) {
        await fetchProjectDetails(targetProjId);
      }
    } finally {
      setSyncing(false);
    }
  }, [fetchProjectDetails]);

  useEffect(() => {
    if (!client) return;
    syncAllClientData(client.id, selectedProjectId);
  }, [client?.id]);

  useEffect(() => {
    if (selectedProjectId) {
      fetchProjectDetails(selectedProjectId);
    }
  }, [selectedProjectId, fetchProjectDetails]);

  // Auto-refresh live data on tab navigation
  useEffect(() => {
    if (client) {
      syncAllClientData(client.id, selectedProjectId);
    }
  }, [activeTab]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthNotice('');
    setAuthLoading(true);
    try {
      const res = await fetch('/api/client/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email: authEmail, password: authPassword })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Authentication failed. Please verify your credentials.');
      }
      setClient(data.client);
      localStorage.setItem('madecc_client_profile', JSON.stringify(data.client));
      setActiveTab('overview');
    } catch (err: any) {
      setAuthError(err.message || 'Login error occurred');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setAuthNotice('');
    setAuthLoading(true);
    try {
      const res = await fetch('/api/client/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Reset request failed');
      setAuthNotice(data.message);
      setForgotMode(false);
    } catch (err: any) {
      setAuthError(err.message || 'Failed to dispatch reset email');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/client/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore network issue during sign-out cleanup
    }
    localStorage.removeItem('madecc_client_profile');
    setClient(null);
    setProjects([]);
    setSelectedProjectId(null);
    setSiteUpdates([]);
    setInvoices([]);
    setMediaList([]);
    setMilestones([]);
    setActiveTab('overview');
    setAuthPassword('');
    setAuthNotice('You have been securely logged out.');
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
          paymentMethod: paymentMethodInput,
          paymentReference: paymentRefInput,
          notes: `Client portal payment declaration (${paymentMethodInput}): ${paymentRefInput}`
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Could not record payment');

      setPaymentSuccessMsg('Payment reference submitted! Confirmation email dispatched via kreboya603@gmail.com.');
      if (client) await syncAllClientData(client.id, selectedProjectId);
      if (selectedInvoice && selectedInvoice.id === invoiceId) {
        setSelectedInvoice(prev => prev ? { ...prev, ...data.invoice } : null);
      }
      setTimeout(() => {
        setShowPaymentModal(false);
        setPaymentRefInput('');
        setPaymentSuccessMsg('');
      }, 2200);
    } catch (err: any) {
      showToast(err.message || 'Failed to submit payment reference', 'error');
    } finally {
      setPaymentSubmitting(false);
    }
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    setSavingProfile(true);
    try {
      const res = await fetch(`/api/client/profile/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(profileForm)
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Could not update profile');
      setClient(data.client);
      localStorage.setItem('madecc_client_profile', JSON.stringify(data.client));
      showToast('Profile coordinates saved to Neon PostgreSQL!');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!client) return;
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      showToast('New password and confirmation do not match.', 'error');
      return;
    }
    setSavingProfile(true);
    try {
      const res = await fetch(`/api/client/profile/${client.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Password update failed');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      showToast('Portal password updated securely!');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleShareEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareRecipient.trim()) return;
    setSharingBusy(true);
    try {
      const res = await fetch('/api/erp/share-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipientEmail: shareRecipient.trim(),
          subject: shareModal.subject,
          title: shareModal.title,
          summary: shareModal.summary,
          detailsHtml: shareModal.detailsHtml,
          actionLabel: 'Open MADECC Client Portal',
          actionUrl: window.location.href,
          senderName: client?.fullName || 'MADECC Client'
        })
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || 'Email dispatch failed');
      showToast(data.message || 'Shared successfully via SMTP!');
      setShareModal({ open: false, title: '', subject: '', summary: '', detailsHtml: '' });
      setShareRecipient('');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSharingBusy(false);
    }
  };

  // Calculations for dashboard
  const activeProjectsCount = projects.filter(p => ['ongoing', 'in_progress', 'in-progress', 'active', 'planning'].includes((p.status || '').toLowerCase())).length;
  const completedProjectsCount = projects.filter(p => (p.status || '').toLowerCase() === 'completed').length;
  const totalPaid = invoices.reduce((acc, inv) => acc + Number(inv.paid_amount_xaf || 0), 0);
  const totalBalanceDue = invoices.reduce((acc, inv) => acc + Number(inv.balance_due_xaf || 0), 0);
  const avgCompletion = projects.length > 0
    ? Math.round(projects.reduce((acc, p) => acc + Number(p.completion_percentage || 0), 0) / projects.length)
    : 0;

  const currentProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const phases = [
    'ALL',
    'Site Preparation',
    'Foundation & Earthworks',
    'Superstructure & Columns',
    'Roofing & Framing',
    'MEP & Plumbing/Electrical',
    'Finishing & Plaster',
    'Handover & Commissioning'
  ];

  const filteredMedia = mediaList.filter(m => {
    const phaseOk = selectedPhase === 'ALL' || (m.phase || '').toLowerCase().includes(selectedPhase.toLowerCase());
    const isVid = isVideoMedia(m.media_url, m.media_type);
    const typeOk = mediaTypeFilter === 'ALL' || (mediaTypeFilter === 'VIDEO' ? isVid : !isVid);
    const q = mediaSearch.toLowerCase();
    const qOk = !q || m.title?.toLowerCase().includes(q) || m.description?.toLowerCase().includes(q);
    return phaseOk && typeOk && qOk;
  });

  const filteredMilestones = milestones.filter(m => {
    const st = (m.status || (Number(m.percentage) >= 100 ? 'Completed' : Number(m.percentage) > 0 ? 'In Progress' : 'Pending')).toLowerCase();
    return milestoneStatusFilter === 'ALL' || st === milestoneStatusFilter.toLowerCase();
  });

  const filteredInvoices = invoices.filter(inv => {
    const stOk = invoiceStatusFilter === 'ALL' || inv.status === invoiceStatusFilter;
    const q = invoiceSearch.toLowerCase();
    const qOk = !q || inv.invoice_number?.toLowerCase().includes(q) || inv.project_title?.toLowerCase().includes(q);
    return stOk && qOk;
  });

  const filteredUpdates = siteUpdates.filter(u => {
    const q = updateSearch.toLowerCase();
    return !q || u.title?.toLowerCase().includes(q) || u.summary?.toLowerCase().includes(q) || u.phase?.toLowerCase().includes(q);
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-amber-500">
        <RefreshCw className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  // 1. LOGIN & FORGOT PASSWORD SCREEN
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

          {authNotice && (
            <div className="mb-5 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-start gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{authNotice}</div>
            </div>
          )}

          {authError && (
            <div className="mb-5 p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>{authError}</div>
            </div>
          )}

          {forgotMode ? (
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <p className="text-xs text-slate-400">
                Enter your registered email address or Client Code. A temporary password will be dispatched from <span className="text-amber-400 font-mono">kreboya603@gmail.com</span>.
              </p>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                  Registered Email or Client Code
                </label>
                <input
                  type="text"
                  required
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="client@madeccgroup.online or CLT-2026-001"
                  className={`w-full px-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                    theme === 'light' ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                  }`}
                />
              </div>
              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 px-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl shadow-lg flex items-center justify-center gap-2 cursor-pointer"
              >
                {authLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>Send Temporary Password via Email</span>
              </button>
              <button
                type="button"
                onClick={() => { setForgotMode(false); setAuthError(''); }}
                className="w-full py-2 text-xs text-slate-400 hover:text-amber-400 cursor-pointer"
              >
                Back to Sign In
              </button>
            </form>
          ) : (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5 font-mono">
                  Client Email or Client Code
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="client@madeccgroup.online or CLT-2026-001"
                    className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      theme === 'light' ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">
                    Access Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setForgotMode(true); setAuthError(''); setAuthNotice(''); }}
                    className="text-[11px] text-amber-500 hover:underline font-medium cursor-pointer"
                  >
                    Forgot password?
                  </button>
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
                      theme === 'light' ? 'bg-slate-50 border-slate-300 text-slate-900' : 'bg-slate-800 border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-4"
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
          )}

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
      {portalToast && (
        <div className={`fixed bottom-6 right-6 z-50 px-5 py-3.5 rounded-2xl font-bold text-xs shadow-2xl flex items-center gap-2 ${
          portalToast.type === 'error' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-slate-950'
        }`}>
          {portalToast.type === 'error' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
          <span>{portalToast.text}</span>
        </div>
      )}

      {/* Top Sticky Context Header */}
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
              onClick={() => syncAllClientData(client.id, selectedProjectId)}
              title="Refresh Live Site Data"
              className={`p-2 rounded-lg text-xs transition-colors cursor-pointer ml-1 ${
                theme === 'light' ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin text-amber-400' : ''}`} />
            </button>

            <button
              onClick={handleLogout}
              aria-label="Log Out"
              className="px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition-colors cursor-pointer ml-1 whitespace-nowrap"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Log Out</span>
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
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="max-w-3xl">
                  <span className="text-[11px] font-mono uppercase tracking-widest text-amber-500 font-bold bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                    Real-Time Construction Monitoring
                  </span>
                  <h1 className="text-2xl sm:text-3xl font-black tracking-tight mt-3 font-serif">
                    Welcome Back, {client.fullName}
                  </h1>
                  <p className="text-xs sm:text-sm text-slate-400 mt-2 leading-relaxed">
                    All figures, site updates, photos, videos, milestones, and invoices below stream live from MADECC GROUP Engineering Operations.
                  </p>
                </div>
                <button
                  onClick={() => syncAllClientData(client.id, selectedProjectId)}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs flex items-center gap-2 shrink-0 cursor-pointer shadow-md"
                >
                  <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                  <span>Sync Live Updates</span>
                </button>
              </div>
            </div>

            {/* Core Metrics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className={`p-5 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-mono uppercase tracking-wider">Assigned Projects</span>
                  <Building2 className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-2xl font-black">{projects.length}</div>
                <div className="text-[11px] text-emerald-400 mt-1">
                  {activeProjectsCount} Active • {completedProjectsCount} Completed
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-mono uppercase tracking-wider">Overall Completion</span>
                  <Clock className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-2xl font-black">{avgCompletion}%</div>
                <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full transition-all duration-700" style={{ width: `${avgCompletion}%` }} />
                </div>
              </div>

              <div className={`p-5 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-mono uppercase tracking-wider">Total Paid</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-xl font-black font-mono">
                  {totalPaid.toLocaleString()} <span className="text-xs font-sans text-amber-500">XAF</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">Certified payments received</div>
              </div>

              <div className={`p-5 rounded-2xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs font-mono uppercase tracking-wider">Pending Balance</span>
                  <DollarSign className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-xl font-black font-mono text-amber-400">
                  {totalBalanceDue.toLocaleString()} <span className="text-xs font-sans text-slate-400">XAF</span>
                </div>
                <div className="text-[11px] text-slate-400 mt-1">
                  {invoices.filter(i => Number(i.balance_due_xaf) > 0).length} invoice(s) awaiting payment
                </div>
              </div>
            </div>

            {/* Featured Construction Site Showcase (100% Live DB Data) */}
            {currentProject && (
              <div className={`p-6 rounded-3xl border shadow-lg ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                  <div>
                    <span className="text-xs font-mono uppercase text-amber-500 font-bold">Featured Construction Site • MAD-PRJ-{currentProject.id}</span>
                    <h3 className="text-xl font-bold font-serif mt-0.5">{currentProject.title}</h3>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      <span>{currentProject.location}</span>
                      <span>•</span>
                      <span>{currentProject.category}</span>
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
                        <div className="text-xs font-mono text-amber-400 font-bold uppercase">
                          {currentProject.current_phase || siteUpdates[0]?.phase || 'Active Construction Phase'}
                        </div>
                        <div className="text-sm font-bold">
                          {currentProject.latest_update_title || siteUpdates[0]?.title || currentProject.title}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                      <div className="text-xs text-slate-400 mb-1">Execution Progress</div>
                      <div className="text-base font-bold text-amber-400 capitalize">
                        {currentProject.completion_percentage || 0}% • {currentProject.status || 'Active'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">Role: {currentProject.client_role || 'Property Owner'}</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                      <div className="text-xs text-slate-400 mb-1">Supervising Engineer</div>
                      <div className="text-sm font-bold">
                        {currentProject.supervisor_name || siteUpdates[0]?.supervisor_name || 'Ing. Arnaud Fopa (ONIGC)'}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Field Phone: {currentProject.supervisor_phone || siteUpdates[0]?.supervisor_phone || settings?.phone || '+237 671 06 35 11'}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                      <div className="text-xs text-slate-400 mb-1">Estimated Completion Target</div>
                      <div className="text-sm font-bold">{currentProject.end_date || 'Scheduled per Contract'}</div>
                      <div className={`text-[11px] mt-1 ${currentProject.schedule_status === 'DELAYED' ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {currentProject.schedule_variance || siteUpdates[0]?.schedule_variance || 'On schedule per master GANTT'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Updates + Upcoming Milestones + Recent Photos */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className={`p-6 rounded-3xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold font-serif">Recent Site Progress Updates</h3>
                  <button onClick={() => setActiveTab('projects')} className="text-xs text-amber-500 font-bold cursor-pointer">View All</button>
                </div>
                {siteUpdates.length === 0 ? (
                  <p className="text-xs text-slate-400">No field updates published yet for this project.</p>
                ) : (
                  <div className="space-y-3">
                    {siteUpdates.slice(0, 3).map(u => (
                      <div key={u.id} className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 text-xs">
                        <div className="flex items-center justify-between mb-1">
                          <span className="font-mono text-amber-400 font-bold">{u.phase}</span>
                          <span className="font-mono text-slate-400">{u.update_date}</span>
                        </div>
                        <div className="font-bold text-sm">{u.title}</div>
                        <p className="text-slate-400 mt-1 line-clamp-2">{u.summary}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className={`p-6 rounded-3xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold font-serif">Upcoming & Active Milestones</h3>
                  <button onClick={() => setActiveTab('milestones')} className="text-xs text-amber-500 font-bold cursor-pointer">Schedule</button>
                </div>
                {milestones.length === 0 ? (
                  <p className="text-xs text-slate-400">Milestones will appear once registered by the engineering team.</p>
                ) : (
                  <div className="space-y-3">
                    {milestones.slice(0, 4).map(m => (
                      <div key={m.id} className="p-3.5 rounded-2xl bg-slate-800/40 border border-slate-800 text-xs flex items-center justify-between gap-3">
                        <div>
                          <div className="font-bold">{m.milestone_name || m.milestone}</div>
                          <div className="text-slate-400 text-[11px] font-mono">Target: {m.date}</div>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 font-mono font-bold">
                          {m.percentage}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {mediaList.length > 0 && (
              <div className={`p-6 rounded-3xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-bold font-serif">Recent Site Photographs & Videos</h3>
                  <button onClick={() => setActiveTab('media')} className="text-xs text-amber-500 font-bold cursor-pointer">Open Gallery</button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {mediaList.slice(0, 4).map(item => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab('media')}
                      className="rounded-xl overflow-hidden aspect-video border border-slate-800 relative group cursor-pointer"
                    >
                      {isVideoMedia(item.media_url, item.media_type) ? (
                        <video src={item.media_url} className="w-full h-full object-cover" muted />
                      ) : (
                        <img src={item.media_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                      )}
                      <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-slate-950 text-left">
                        <div className="text-[10px] font-bold text-white line-clamp-1">{item.title}</div>
                      </div>
                    </button>
                  ))}
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
                  Monitor detailed timelines, structural phase execution, and engineering deliverables published from Admin Dashboard.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {projects.length > 0 && (
                  <select
                    value={selectedProjectId || ''}
                    onChange={(e) => setSelectedProjectId(Number(e.target.value))}
                    className={`px-3 py-2 rounded-xl text-xs font-bold border focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                      theme === 'light' ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-800'
                    }`}
                  >
                    {projects.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                  </select>
                )}

                <button
                  onClick={() => exportCsv(
                    `MADECC_Project_Updates_${selectedProjectId || 'all'}.csv`,
                    ['Date', 'Phase', 'Title', 'Completion %', 'Schedule Variance', 'Supervisor', 'Summary'],
                    siteUpdates.map(u => [u.update_date, u.phase, u.title, u.completion_percentage, u.schedule_variance, u.supervisor_name, u.summary])
                  )}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>

                <button
                  onClick={() => window.print()}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Report</span>
                </button>
              </div>
            </div>

            {projects.map(project => {
              const isSelected = project.id === selectedProjectId;
              return (
                <div
                  key={project.id}
                  onClick={() => setSelectedProjectId(project.id)}
                  className={`p-6 sm:p-8 rounded-3xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'ring-2 ring-amber-500/40 border-amber-500/50 shadow-xl'
                      : 'border-slate-800 opacity-90 hover:opacity-100'
                  } ${theme === 'light' ? 'bg-white' : 'bg-slate-900'}`}
                >
                  <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 pb-6 border-b border-slate-800">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono bg-amber-500/20 text-amber-400 font-bold px-2.5 py-0.5 rounded-full">
                          Ref: MAD-PRJ-{project.id}
                        </span>
                        <span className="text-xs font-mono bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full">
                          {project.category}
                        </span>
                        <span className="text-xs font-mono bg-emerald-500/15 text-emerald-400 px-2.5 py-0.5 rounded-full capitalize">
                          {project.status}
                        </span>
                      </div>
                      <h3 className="text-2xl font-black font-serif mt-2">{project.title}</h3>
                      <p className="text-xs text-slate-400 flex flex-wrap items-center gap-2 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-500" />
                        <span>{project.location}</span>
                        <span>•</span>
                        <span>Start: {project.start_date || 'Per Contract'}</span>
                        <span>•</span>
                        <span>Expected Delivery: {project.end_date || 'Scheduled'}</span>
                      </p>
                    </div>

                    <div className="w-full lg:w-64 bg-slate-800/50 p-4 rounded-2xl border border-slate-800">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-slate-400 font-mono">Overall Completion</span>
                        <span className="font-bold text-amber-400">{project.completion_percentage || 0}%</span>
                      </div>
                      <div className="w-full bg-slate-700 h-2 rounded-full overflow-hidden">
                        <div className="bg-gradient-to-r from-amber-500 to-amber-400 h-full rounded-full" style={{ width: `${project.completion_percentage || 0}%` }} />
                      </div>
                    </div>
                  </div>

                  <p className="text-xs sm:text-sm text-slate-300 mt-4 leading-relaxed">
                    {project.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                      <div className="text-xs font-mono uppercase text-slate-400 mb-1">Current Phase & Schedule</div>
                      <div className="text-sm font-bold text-amber-400">{project.current_phase || 'Site Execution'}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{project.schedule_variance || 'Active per GANTT'}</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                      <div className="text-xs font-mono uppercase text-slate-400 mb-1">Supervising Engineer</div>
                      <div className="text-sm font-bold">{project.supervisor_name || 'Ing. Arnaud Fopa'}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">{project.supervisor_phone || '+237 671 06 35 11'}</div>
                    </div>

                    <div className="p-4 rounded-xl bg-slate-800/40 border border-slate-800">
                      <div className="text-xs font-mono uppercase text-slate-400 mb-1">Contract Budget</div>
                      <div className="text-sm font-bold text-amber-400 font-mono">{project.budget || 'Contract Sum'}</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">Role: {project.client_role || 'Property Owner'}</div>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Live Engineering Updates Timeline for Selected Project */}
            {currentProject && (
              <div className={`p-6 sm:p-8 rounded-3xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                  <div>
                    <h3 className="text-lg font-bold font-serif">Live Field Progress Feed — {currentProject.title}</h3>
                    <p className="text-xs text-slate-400">Real-time engineering bulletins, completed activities, and site notices.</p>
                  </div>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      placeholder="Filter updates..."
                      value={updateSearch}
                      onChange={e => setUpdateSearch(e.target.value)}
                      className="pl-9 pr-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white"
                    />
                  </div>
                </div>

                {filteredUpdates.length === 0 ? (
                  <p className="text-xs text-slate-400">No engineering updates published yet for this site.</p>
                ) : (
                  <div className="space-y-4">
                    {filteredUpdates.map(upd => (
                      <div key={upd.id} className="p-5 rounded-2xl bg-slate-800/40 border border-slate-800 flex flex-col md:flex-row gap-5">
                        {upd.attachment_url && (
                          <div className="w-full md:w-52 aspect-video rounded-xl overflow-hidden bg-slate-950 shrink-0 border border-slate-800">
                            {isVideoMedia(upd.attachment_url, upd.attachment_type) ? (
                              <video src={upd.attachment_url} controls playsInline className="w-full h-full object-cover" />
                            ) : (
                              <img src={upd.attachment_url} alt={upd.title} className="w-full h-full object-cover" />
                            )}
                          </div>
                        )}
                        <div className="flex-grow space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono bg-amber-500/20 text-amber-400 px-2.5 py-0.5 rounded-full font-bold">{upd.phase}</span>
                              <span className="text-[10px] font-mono bg-emerald-500/20 text-emerald-400 px-2.5 py-0.5 rounded-full font-bold">{upd.completion_percentage}%</span>
                              <span className="text-[11px] font-mono text-slate-400">{upd.update_date}</span>
                            </div>
                            <button
                              onClick={() => setShareModal({
                                open: true,
                                title: `Project Progress: ${upd.title}`,
                                subject: `${currentProject.title} - Progress Update (${upd.completion_percentage}%)`,
                                summary: upd.summary,
                                detailsHtml: `<p><strong>Phase:</strong> ${upd.phase}</p><p><strong>Schedule:</strong> ${upd.schedule_variance}</p><p><strong>Engineer:</strong> ${upd.supervisor_name}</p>`
                              })}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-amber-400 text-[11px] font-bold flex items-center gap-1 cursor-pointer"
                            >
                              <Share2 className="w-3 h-3" />
                              <span>Share</span>
                            </button>
                          </div>
                          <h4 className="text-base font-bold">{upd.title}</h4>
                          <p className="text-xs text-slate-300 leading-relaxed">{upd.summary}</p>
                          {upd.delay_explanation && (
                            <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-[11px] text-rose-300">
                              <strong>Delay Explanation:</strong> {upd.delay_explanation}
                            </div>
                          )}
                          <div className="text-[11px] text-slate-400 flex flex-wrap gap-4">
                            <span>Supervisor: <strong className="text-slate-200">{upd.supervisor_name}</strong></span>
                            <span>Site Crew: <strong className="text-slate-200">{upd.workforce_on_site || 14}</strong></span>
                            <span>Status: <strong className="text-emerald-400">{upd.schedule_variance}</strong></span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: PHOTOS & VIDEOS */}
        {/* ========================================================= */}
        {activeTab === 'media' && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold font-serif">Construction Progress Gallery</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Field photographs, drone inspection videos, and concrete curing evidence uploaded via Cloudinary & Supabase.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Search gallery..."
                    value={mediaSearch}
                    onChange={e => setMediaSearch(e.target.value)}
                    className={`pl-9 pr-3 py-1.5 rounded-xl text-xs border ${
                      theme === 'light' ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-800 text-white'
                    }`}
                  />
                </div>
                {(['ALL', 'PHOTO', 'VIDEO'] as const).map(t => (
                  <button
                    key={t}
                    onClick={() => setMediaTypeFilter(t)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold cursor-pointer ${
                      mediaTypeFilter === t ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1">
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

            {filteredMedia.length === 0 ? (
              <div className={`p-12 text-center rounded-3xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
                <Camera className="w-12 h-12 text-slate-500 mx-auto mb-3 opacity-50" />
                <h3 className="text-base font-bold">No photos or videos match this filter</h3>
                <p className="text-xs text-slate-400 mt-1">Try switching phase or media type filter above.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMedia.map(item => {
                  const isVid = isVideoMedia(item.media_url, item.media_type);
                  return (
                    <div
                      key={item.id}
                      className={`rounded-2xl border overflow-hidden shadow-lg transition-all hover:border-amber-500/50 ${
                        theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'
                      }`}
                    >
                      <div className="relative aspect-video bg-slate-950 overflow-hidden group">
                        {isVid ? (
                          <video src={item.media_url} controls playsInline preload="metadata" className="w-full h-full object-cover" />
                        ) : (
                          <img
                            src={item.media_url}
                            alt={item.title}
                            onClick={() => setLightboxMedia(item)}
                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-pointer"
                          />
                        )}
                        <div className="absolute top-2.5 left-2.5 bg-slate-950/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-mono text-amber-400 font-bold flex items-center gap-1">
                          {isVid ? <Video className="w-3 h-3" /> : <Camera className="w-3 h-3" />}
                          <span>{item.phase}</span>
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
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setShareModal({
                                open: true,
                                title: `Site ${isVid ? 'Video' : 'Photo'}: ${item.title}`,
                                subject: `MADECC Progress Media - ${item.title}`,
                                summary: item.description || item.phase,
                                detailsHtml: `<p><strong>Media URL:</strong> <a href="${item.media_url}">${item.media_url}</a></p>`
                              })}
                              className="text-slate-400 hover:text-amber-400 cursor-pointer"
                              title="Share via Email"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                            <a
                              href={getDownloadHref(item.media_url)}
                              download
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-amber-500 hover:text-amber-400 font-bold flex items-center gap-1"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </a>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: MILESTONES */}
        {/* ========================================================= */}
        {activeTab === 'milestones' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold font-serif">Project Milestones & Deliverables</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Live engineering milestones synced from Admin Project Progress & ERP.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={milestoneStatusFilter}
                  onChange={e => setMilestoneStatusFilter(e.target.value)}
                  className={`px-3 py-2 rounded-xl text-xs border ${
                    theme === 'light' ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-800 text-white'
                  }`}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="Completed">Completed</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Pending">Pending</option>
                </select>
                <button
                  onClick={() => exportCsv(
                    `MADECC_Milestones_Project_${selectedProjectId || 1}.csv`,
                    ['Milestone', 'Description', 'Completion %', 'Status', 'Target Date'],
                    filteredMilestones.map(m => [m.milestone_name || m.milestone, m.description, m.percentage, m.status, m.date])
                  )}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export CSV</span>
                </button>
              </div>
            </div>

            <div className={`p-6 sm:p-8 rounded-3xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
              {filteredMilestones.length === 0 ? (
                <div className="text-center py-8 text-xs text-slate-400">
                  No milestones match this filter for the selected project.
                </div>
              ) : (
                <div className="space-y-6">
                  {filteredMilestones.map((m, idx) => {
                    const isDone = Number(m.percentage) >= 100 || (m.status || '').toLowerCase() === 'completed';
                    const inProg = Number(m.percentage) > 0 && Number(m.percentage) < 100;
                    const titleText = m.milestone_name || m.milestone || `Milestone #${idx + 1}`;

                    return (
                      <div key={m.id || idx} className="flex items-start gap-4">
                        <div className="flex flex-col items-center">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                            isDone
                              ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20'
                              : inProg
                                ? 'bg-amber-500 text-slate-950'
                                : 'bg-slate-800 text-slate-500'
                          }`}>
                            {isDone ? <Check className="w-4 h-4 stroke-[3]" /> : idx + 1}
                          </div>
                          {idx < filteredMilestones.length - 1 && <div className="w-0.5 h-16 bg-slate-800 my-1" />}
                        </div>

                        <div className="flex-grow pb-4">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                            <h4 className="text-sm font-bold">{titleText}</h4>
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
                          <div className="text-[11px] font-mono text-slate-500 mt-1">Target Date: {m.date}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: INVOICES & BILLING */}
        {/* ========================================================= */}
        {activeTab === 'invoices' && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-bold font-serif">Project Invoices & Statements</h2>
                <p className="text-xs text-slate-400 mt-1">
                  Inspect itemized tax invoices, download PDF/CSV statements, and submit MoMo or Bank payment references.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  placeholder="Search invoice #..."
                  value={invoiceSearch}
                  onChange={e => setInvoiceSearch(e.target.value)}
                  className={`px-3 py-2 rounded-xl text-xs border ${
                    theme === 'light' ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-800 text-white'
                  }`}
                />
                <select
                  value={invoiceStatusFilter}
                  onChange={e => setInvoiceStatusFilter(e.target.value)}
                  className={`px-3 py-2 rounded-xl text-xs border ${
                    theme === 'light' ? 'bg-white border-slate-300' : 'bg-slate-900 border-slate-800 text-white'
                  }`}
                >
                  <option value="ALL">All Statuses</option>
                  <option value="ISSUED">Issued</option>
                  <option value="PARTIALLY_PAID">Partially Paid</option>
                  <option value="PAID">Paid</option>
                </select>
                <button
                  onClick={() => exportCsv(
                    `MADECC_Client_Invoices_${client.clientCode}.csv`,
                    ['Invoice #', 'Project', 'Issue Date', 'Due Date', 'Total TTC XAF', 'Paid XAF', 'Balance Due XAF', 'Status'],
                    filteredInvoices.map(i => [i.invoice_number, i.project_title, i.issue_date, i.due_date, i.total_amount_xaf, i.paid_amount_xaf, i.balance_due_xaf, i.status])
                  )}
                  className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>CSV</span>
                </button>
                <div className="text-right pl-2">
                  <div className="text-[10px] text-slate-400 font-mono">Outstanding</div>
                  <div className="text-sm font-bold text-amber-400 font-mono">{totalBalanceDue.toLocaleString()} XAF</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {filteredInvoices.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-slate-900 border border-slate-800 text-xs text-slate-400">
                  No invoices found matching this filter.
                </div>
              ) : (
                filteredInvoices.map(inv => (
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
                          {inv.project_title} • Issued: {inv.issue_date} • Due: {inv.due_date}
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-4">
                        <div className="text-right">
                          <div className="text-xs text-slate-400">Total (TTC)</div>
                          <div className="text-base font-bold font-mono">{Number(inv.total_amount_xaf).toLocaleString()} XAF</div>
                        </div>

                        <div className="text-right">
                          <div className="text-xs text-slate-400">Balance Due</div>
                          <div className={`text-base font-bold font-mono ${Number(inv.balance_due_xaf) > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {Number(inv.balance_due_xaf).toLocaleString()} XAF
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setSelectedInvoice(inv)}
                            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-white flex items-center gap-1.5 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Inspect / PDF</span>
                          </button>
                          <button
                            onClick={() => setShareModal({
                              open: true,
                              title: `Invoice Statement ${inv.invoice_number}`,
                              subject: `MADECC Invoice ${inv.invoice_number} (${Number(inv.balance_due_xaf).toLocaleString()} XAF Due)`,
                              summary: `Shared statement for ${inv.project_title}.`,
                              detailsHtml: `<p><strong>Total (TTC):</strong> ${Number(inv.total_amount_xaf).toLocaleString()} XAF</p><p><strong>Balance Due:</strong> ${Number(inv.balance_due_xaf).toLocaleString()} XAF</p>`
                            })}
                            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 cursor-pointer"
                            title="Email Invoice Copy"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          {Number(inv.balance_due_xaf) > 0 && (
                            <button
                              onClick={() => {
                                setSelectedInvoice(inv);
                                setShowPaymentModal(true);
                              }}
                              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                            >
                              <CreditCard className="w-3.5 h-3.5" />
                              <span>Pay / Confirm</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    {inv.notes && (
                      <div className="mt-3 text-xs text-slate-400 italic">Note: {inv.notes}</div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Payment Coordinates */}
            <div className={`p-6 sm:p-8 rounded-3xl border ${theme === 'light' ? 'bg-amber-50/50 border-amber-200' : 'bg-slate-900/60 border-slate-800'}`}>
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
        {/* TAB 6: PROFILE & PASSWORD MANAGEMENT */}
        {/* ========================================================= */}
        {activeTab === 'profile' && (
          <div className="max-w-3xl mx-auto space-y-6">
            <div className={`p-8 rounded-3xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
              <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-slate-800">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-2xl font-serif border border-amber-500/30">
                    {client.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold font-serif">{client.fullName}</h3>
                    <p className="text-xs text-amber-400 font-mono">{client.clientCode} • {client.email}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-4 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-bold rounded-xl text-xs flex items-center gap-1.5 border border-rose-500/20 cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Log Out</span>
                </button>
              </div>

              <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 font-mono uppercase tracking-wider block mb-1">Full Name</label>
                    <input
                      required
                      type="text"
                      value={profileForm.fullName}
                      onChange={e => setProfileForm({ ...profileForm, fullName: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-800/60 text-white border border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-mono uppercase tracking-wider block mb-1">Company / Organization</label>
                    <input
                      type="text"
                      value={profileForm.companyName}
                      onChange={e => setProfileForm({ ...profileForm, companyName: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-800/60 text-white border border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-mono uppercase tracking-wider block mb-1">Primary Phone</label>
                    <input
                      type="text"
                      value={profileForm.phone}
                      onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-800/60 text-white border border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 font-mono uppercase tracking-wider block mb-1">City</label>
                    <input
                      type="text"
                      value={profileForm.city}
                      onChange={e => setProfileForm({ ...profileForm, city: e.target.value })}
                      className="w-full p-3 rounded-xl bg-slate-800/60 text-white border border-slate-700"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-slate-400 font-mono uppercase tracking-wider block mb-1">Office / Billing Address</label>
                  <input
                    type="text"
                    value={profileForm.address}
                    onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                    className="w-full p-3 rounded-xl bg-slate-800/60 text-white border border-slate-700"
                  />
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Save className="w-4 h-4" />
                    <span>Save Profile Changes</span>
                  </button>
                </div>
              </form>
            </div>

            {/* Password Security Form */}
            <div className={`p-8 rounded-3xl border ${theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
              <h4 className="text-base font-bold font-serif mb-4 flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-500" />
                <span>Update Portal Password</span>
              </h4>
              <form onSubmit={handleChangePassword} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="text-slate-400 block mb-1">Current Password</label>
                    <input
                      required
                      type="password"
                      value={passwordForm.currentPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-800/60 text-white border border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">New Password</label>
                    <input
                      required
                      minLength={6}
                      type="password"
                      value={passwordForm.newPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-800/60 text-white border border-slate-700"
                    />
                  </div>
                  <div>
                    <label className="text-slate-400 block mb-1">Confirm New Password</label>
                    <input
                      required
                      minLength={6}
                      type="password"
                      value={passwordForm.confirmPassword}
                      onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                      className="w-full p-2.5 rounded-xl bg-slate-800/60 text-white border border-slate-700"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={savingProfile}
                    className="px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold rounded-xl text-xs cursor-pointer"
                  >
                    Update Password
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* LIGHTBOX MODAL FOR PHOTO */}
      {lightboxMedia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-sm" onClick={() => setLightboxMedia(null)}>
          <div className="max-w-4xl w-full bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <div>
                <div className="text-xs font-mono text-amber-400">{lightboxMedia.phase} • {lightboxMedia.upload_date}</div>
                <h4 className="text-base font-bold text-white">{lightboxMedia.title}</h4>
              </div>
              <button onClick={() => setLightboxMedia(null)} className="p-2 rounded-xl bg-slate-800 text-white cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>
            <img src={lightboxMedia.media_url} alt={lightboxMedia.title} className="w-full max-h-[75vh] object-contain bg-black" />
          </div>
        </div>
      )}

      {/* SHARE VIA SMTP EMAIL MODAL */}
      {shareModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl p-6 bg-slate-900 border border-slate-800 shadow-2xl text-white">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-4">
              <h4 className="text-base font-bold flex items-center gap-2">
                <Mail className="w-4 h-4 text-amber-400" />
                <span>Share via Email (kreboya603@gmail.com)</span>
              </h4>
              <button onClick={() => setShareModal({ ...shareModal, open: false })} className="text-slate-400 hover:text-white cursor-pointer">✕</button>
            </div>
            <form onSubmit={handleShareEmail} className="space-y-4 text-xs">
              <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700">
                <div className="font-bold text-amber-400">{shareModal.title}</div>
                <div className="text-slate-300 mt-1">{shareModal.summary}</div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Recipient Email Address</label>
                <input
                  required
                  type="email"
                  value={shareRecipient}
                  onChange={e => setShareRecipient(e.target.value)}
                  placeholder="partner@company.com"
                  className="w-full p-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShareModal({ ...shareModal, open: false })} className="px-4 py-2 bg-slate-800 rounded-xl text-slate-300 cursor-pointer">Cancel</button>
                <button type="submit" disabled={sharingBusy} className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl flex items-center gap-1.5 cursor-pointer">
                  {sharingBusy ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  <span>Send Email</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* INVOICE DETAILS MODAL */}
      {selectedInvoice && !showPaymentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 border shadow-2xl ${
            theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <span className="text-xs font-mono text-amber-500 font-bold">OFFICIAL CONSTRUCTION INVOICE</span>
                <h3 className="text-xl font-bold font-serif">{selectedInvoice.invoice_number}</h3>
              </div>
              <button onClick={() => setSelectedInvoice(null)} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer text-xs">
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4 my-6 text-xs">
              <div>
                <span className="text-slate-400 block font-mono">Issued To:</span>
                <div className="font-bold text-sm mt-0.5">{client.fullName}</div>
                <div className="text-slate-400">{client.companyName}</div>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block font-mono">Invoice Dates:</span>
                <div className="text-slate-300 mt-0.5">Issue: {selectedInvoice.issue_date}</div>
                <div className="text-amber-400 font-bold">Due: {selectedInvoice.due_date}</div>
              </div>
            </div>

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
                      <td className="p-3 font-medium">{item.description}</td>
                      <td className="p-3 text-right font-mono">{item.quantity} {item.unit}</td>
                      <td className="p-3 text-right font-mono">{Number(item.unit_price_xaf).toLocaleString()}</td>
                      <td className="p-3 text-right font-mono font-bold">{Number(item.total_price_xaf).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2 text-xs border-t border-slate-800 pt-4">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal (HT):</span>
                <span className="font-mono">{Number(selectedInvoice.subtotal_xaf).toLocaleString()} XAF</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>TVA ({selectedInvoice.tax_rate_percent || 19.25}%):</span>
                <span className="font-mono">{Number(selectedInvoice.tax_amount_xaf).toLocaleString()} XAF</span>
              </div>
              <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-800">
                <span>Total Amount (TTC):</span>
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
                <Printer className="w-4 h-4" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className={`w-full max-w-md rounded-3xl p-6 sm:p-8 border shadow-2xl ${
            theme === 'light' ? 'bg-white border-slate-200 text-slate-900' : 'bg-slate-900 border-slate-800 text-slate-100'
          }`}>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <div>
                <span className="text-xs font-mono text-amber-500 font-bold">PAYMENT RECONCILIATION</span>
                <h3 className="text-lg font-bold font-serif">Invoice {selectedInvoice.invoice_number}</h3>
              </div>
              <button onClick={() => setShowPaymentModal(false)} className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white cursor-pointer text-xs">
                ✕
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 mb-4 text-xs">
              <div className="text-slate-400">Balance Due:</div>
              <div className="text-xl font-bold font-mono text-amber-400 mt-0.5">
                {Number(selectedInvoice.balance_due_xaf).toLocaleString()} XAF
              </div>
              <p className="text-[11px] text-slate-300 mt-2">
                Send funds to MTN MoMo <strong>{settings?.paymentMtnNumbers || '+237 671 06 35 11'}</strong> or Orange Money <strong>{settings?.paymentOrangeNumbers || '+237 699 82 41 05'}</strong>, then submit the transaction ID below.
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
                  <label className="text-xs font-mono uppercase text-slate-400 block mb-1.5">Payment Channel</label>
                  <select
                    value={paymentMethodInput}
                    onChange={(e) => setPaymentMethodInput(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-sm text-white"
                  >
                    <option value="MTN_MOMO">MTN Mobile Money</option>
                    <option value="ORANGE_MONEY">Orange Money</option>
                    <option value="BANK_WIRE">Bank Wire (UBA / Afriland)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-mono uppercase text-slate-400 block mb-1.5">Transaction Reference ID</label>
                  <input
                    type="text"
                    required
                    value={paymentRefInput}
                    onChange={(e) => setPaymentRefInput(e.target.value)}
                    placeholder="e.g. CI260324.1105.A10294"
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
                      <span>Confirm & Send Receipt</span>
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
