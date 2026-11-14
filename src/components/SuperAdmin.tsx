import React, { useState, useEffect } from 'react';
import {
  Shield, Building2, CreditCard, Activity, Zap, CheckCircle2,
  Clock, Plus, Search, RefreshCw, Check, X, ExternalLink,
  Sparkles, Sliders, FileText, Globe, Phone, Mail, Landmark,
  DollarSign, Save, Trash2, Edit3, UploadCloud, Copy, Share2,
  Download, History, EyeOff, RotateCcw, Printer, Layers
} from 'lucide-react';
import { Tenant, SaaSPlan, PlanCode, DirectPaymentConfig, SaaSWorkspaceVersion } from '../types.ts';
import { TenantService, INITIAL_PILOT_TENANTS, uploadSaasAssetFile } from '../services/tenantService.ts';
import { SubscriptionService, DEFAULT_PLANS, DIRECT_PAYMENT_CONFIG } from '../services/subscriptionService.ts';

interface PaymentSubmission {
  id: number;
  tenantId: number;
  tenantName?: string;
  tenantEmail?: string;
  planCode: string;
  billingCycle?: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  senderPhone?: string;
  paymentReference?: string;
  proofUrl?: string | null;
  createdAt?: string;
  status: string;
  notes?: string;
  confirmedBy?: string;
}

interface SuperAdminProps {
  onBackToApp: () => void;
  onImpersonateTenant: (tenant: Tenant) => void;
  onTriggerThankYou?: (tenant: Tenant, planCode: string, txRef: string) => void;
  embedded?: boolean;
}

function downloadCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
  const csv = [headers.map(esc).join(','), ...rows.map(r => r.map(esc).join(','))].join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadJson(filename: string, data: any) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export const SuperAdmin: React.FC<SuperAdminProps> = ({
  onBackToApp,
  onImpersonateTenant,
  onTriggerThankYou,
  embedded = false
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TENANTS' | 'PAYMENTS' | 'PLANS' | 'PAYMENT_CONFIG' | 'AI_USAGE' | 'AUDIT'>('OVERVIEW');
  const [tenantsList, setTenantsList] = useState<Tenant[]>(INITIAL_PILOT_TENANTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [publishFilter, setPublishFilter] = useState<'ALL' | 'PUBLISHED' | 'UNPUBLISHED' | 'DRAFT'>('ALL');
  const [loading, setLoading] = useState(false);

  const [analytics, setAnalytics] = useState<any>(null);
  const [payments, setPayments] = useState<PaymentSubmission[]>([]);
  const [paymentFilter, setPaymentFilter] = useState<'ALL' | 'PENDING_CONFIRMATION' | 'ACTIVE' | 'CANCELLED'>('ALL');
  const [plans, setPlans] = useState<SaaSPlan[]>(DEFAULT_PLANS);
  const [usageEvents, setUsageEvents] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [auditSearch, setAuditSearch] = useState('');

  const [toast, setToast] = useState<{ text: string; isError?: boolean } | null>(null);
  const [uploadingStatus, setUploadingStatus] = useState<string | null>(null);

  // Payment Accounts Config
  const [momoInput, setMomoInput] = useState('');
  const [omInput, setOmInput] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankName, setBankName] = useState('');
  const [bankAccountNumber, setBankAccountNumber] = useState('');
  const [bankSwift, setBankSwift] = useState('');
  const [contactWhatsApp, setContactWhatsApp] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [promoNote, setPromoNote] = useState('');

  // Create Tenant Modal
  const [showAddTenantModal, setShowAddTenantModal] = useState(false);
  const [newTenantName, setNewTenantName] = useState('');
  const [newTenantSlug, setNewTenantSlug] = useState('');
  const [newTenantLegalName, setNewTenantLegalName] = useState('');
  const [newTenantPlan, setNewTenantPlan] = useState<PlanCode>('PROFESSIONAL');
  const [newTenantPhone, setNewTenantPhone] = useState('');
  const [newTenantEmail, setNewTenantEmail] = useState('');
  const [newTenantAddress, setNewTenantAddress] = useState('');
  const [newTenantLogoUrl, setNewTenantLogoUrl] = useState('');

  // Edit/Save Tenant Modal
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [editForm, setEditForm] = useState<any>({});

  // Versioning Drawer/Modal (Tenants)
  const [versionTenant, setVersionTenant] = useState<Tenant | null>(null);
  const [tenantVersions, setTenantVersions] = useState<SaaSWorkspaceVersion[]>([]);
  const [newVersionChangelog, setNewVersionChangelog] = useState('');

  // Share via SMTP Modal
  const [shareTenant, setShareTenant] = useState<Tenant | null>(null);
  const [shareRecipient, setShareRecipient] = useState('');
  const [shareMessage, setShareMessage] = useState('');
  const [sharingSmtp, setSharingSmtp] = useState(false);

  // Plan Modals (Create / Edit / Versions)
  const [showAddPlanModal, setShowAddPlanModal] = useState(false);
  const [newPlanForm, setNewPlanForm] = useState({
    code: '', name: '', description: '', monthlyPrice: 75000, annualPrice: 750000,
    maxUsers: 5, maxProjects: 15, maxStorageGb: 15, aiCreditsMonthly: 300, featuresText: ''
  });
  const [editingPlan, setEditingPlan] = useState<SaaSPlan | null>(null);
  const [planEditForm, setPlanEditForm] = useState<any>({});
  const [versionPlan, setVersionPlan] = useState<SaaSPlan | null>(null);
  const [planVersions, setPlanVersions] = useState<any[]>([]);

  // Inline Delete Confirmation (no window.confirm)
  const [confirmDeleteTenantId, setConfirmDeleteTenantId] = useState<number | null>(null);

  const notify = (text: string, isError = false) => {
    setToast({ text, isError });
    setTimeout(() => setToast(null), 4500);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [tenants, fetchedPlans, subsRes, cfg, analyticsRes, usageRes, auditRes] = await Promise.all([
        TenantService.fetchTenantsFromApi({ publishedOnly: false }),
        SubscriptionService.fetchPlansFromApi({ includeUnpublished: true }),
        fetch('/api/saas/subscriptions').then(r => r.json()).catch(() => []),
        SubscriptionService.fetchPaymentConfigFromApi(),
        fetch('/api/saas/analytics').then(r => r.json()).catch(() => null),
        fetch('/api/saas/usage-events').then(r => r.json()).catch(() => ({ events: [] })),
        fetch('/api/saas/audit-logs').then(r => r.json()).catch(() => ({ logs: [] }))
      ]);

      if (Array.isArray(tenants)) setTenantsList(tenants);
      if (Array.isArray(fetchedPlans)) setPlans(fetchedPlans);
      if (Array.isArray(subsRes)) setPayments(subsRes);
      if (analyticsRes && analyticsRes.currency) setAnalytics(analyticsRes);
      if (Array.isArray(usageRes?.events)) setUsageEvents(usageRes.events);
      if (Array.isArray(auditRes?.logs)) setAuditLogs(auditRes.logs);

      if (cfg) {
        setMomoInput((cfg.momoNumbers || []).join(', '));
        setOmInput((cfg.orangeMoneyNumbers || []).join(', '));
        setBankAccountName(cfg.bankAccount?.accountName || '');
        setBankName(cfg.bankAccount?.bankName || '');
        setBankAccountNumber(cfg.bankAccount?.accountNumber || '');
        setBankSwift(cfg.bankAccount?.ibanOrSwift || '');
        setContactWhatsApp(cfg.contactWhatsApp || '');
        setContactEmail(cfg.contactEmail || '');
        setPromoNote(cfg.promoNote || '');
      }
    } catch (err: any) {
      notify(`Sync error: ${err.message}`, true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Tenant Asset Upload
  const handleAssetUpload = async (file: File, onDone: (url: string) => void) => {
    setUploadingStatus('Preparing upload...');
    try {
      const url = await uploadSaasAssetFile(file, (msg) => setUploadingStatus(msg));
      onDone(url);
      notify('Asset uploaded to cloud storage cleanly.');
    } catch (err: any) {
      notify(`Upload failed: ${err.message}`, true);
    } finally {
      setUploadingStatus(null);
    }
  };

  // Tenant Lifecycle Handlers
  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName.trim()) return;
    try {
      const created = await TenantService.registerTenant({
        name: newTenantName.trim(),
        slug: newTenantSlug.trim() || newTenantName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        legalName: newTenantLegalName.trim() || `${newTenantName.trim()} SARL`,
        logoUrl: newTenantLogoUrl || '/logo.png',
        planCode: newTenantPlan,
        phone: newTenantPhone,
        email: newTenantEmail,
        address: newTenantAddress,
        status: 'ACTIVE',
        publishStatus: 'PUBLISHED',
        sendWelcomeEmail: true
      });
      setTenantsList(prev => [created, ...prev]);
      setShowAddTenantModal(false);
      setNewTenantName('');
      setNewTenantSlug('');
      setNewTenantLegalName('');
      setNewTenantPhone('');
      setNewTenantEmail('');
      setNewTenantAddress('');
      setNewTenantLogoUrl('');
      notify(`Workspace ${created.name} created in Neon & notified via SMTP.`);
      loadData();
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  const openEditTenantModal = (t: Tenant) => {
    setEditingTenant(t);
    setEditForm({
      name: t.name,
      legalName: t.legalName || '',
      logoUrl: t.logoUrl || '',
      brandCoverUrl: t.brandCoverUrl || '',
      customDomain: t.customDomain || '',
      planCode: t.planCode,
      currency: t.currency || 'XAF',
      phone: t.phone || '',
      email: t.email || '',
      address: t.address || '',
      aiCreditsBalance: t.aiCreditsBalance,
      primaryColor: t.settings?.primaryColor || '#0f172a',
      secondaryColor: t.settings?.secondaryColor || '#f59e0b',
      tagline: t.settings?.tagline || '',
      changelog: '',
      createVersionSnapshot: true
    });
  };

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTenant) return;
    try {
      const updated = await TenantService.updateTenant(editingTenant.id, {
        name: editForm.name,
        legalName: editForm.legalName,
        logoUrl: editForm.logoUrl,
        brandCoverUrl: editForm.brandCoverUrl,
        customDomain: editForm.customDomain || null,
        planCode: editForm.planCode,
        currency: editForm.currency,
        phone: editForm.phone,
        email: editForm.email,
        address: editForm.address,
        aiCreditsBalance: Number(editForm.aiCreditsBalance),
        settings: {
          ...(editingTenant.settings || {}),
          primaryColor: editForm.primaryColor,
          secondaryColor: editForm.secondaryColor,
          tagline: editForm.tagline
        },
        changelog: editForm.changelog || 'Updated white-label branding & workspace settings',
        createVersionSnapshot: Boolean(editForm.createVersionSnapshot)
      });
      setTenantsList(prev => prev.map(t => t.id === updated.id ? { ...t, ...updated } : t));
      setEditingTenant(null);
      notify(`Saved ${updated.name} in Neon PostgreSQL.`);
      loadData();
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  const handlePublishAction = async (t: Tenant, action: 'publish' | 'republish' | 'unpublish') => {
    try {
      const updated = action === 'publish'
        ? await TenantService.publishTenant(t.id, { notifyTenant: true })
        : action === 'republish'
        ? await TenantService.republishTenant(t.id, { notifyTenant: true })
        : await TenantService.unpublishTenant(t.id, 'Unpublished by Super Admin');
      setTenantsList(prev => prev.map(x => x.id === t.id ? { ...x, ...updated } : x));
      notify(`${t.name} ${action === 'unpublish' ? 'unpublished' : `${action}ed live (v${updated.publishedVersion || 1}.0)`}.`);
      loadData();
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  const handleDuplicateTenant = async (t: Tenant) => {
    try {
      const cloned = await TenantService.duplicateTenant(t.id);
      setTenantsList(prev => [cloned, ...prev]);
      notify(`Duplicated ${t.name} -> ${cloned.name} cleanly.`);
      loadData();
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  const openVersionsDrawer = async (t: Tenant) => {
    setVersionTenant(t);
    setNewVersionChangelog('');
    try {
      const vers = await TenantService.fetchTenantVersions(t.id);
      setTenantVersions(vers);
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  const handleSaveManualVersion = async () => {
    if (!versionTenant) return;
    try {
      const created = await TenantService.saveTenantVersion(
        versionTenant.id,
        newVersionChangelog.trim() || 'Manual checkpoint snapshot'
      );
      setTenantVersions(prev => [created, ...prev]);
      setNewVersionChangelog('');
      notify(`Saved snapshot ${created.versionLabel} for ${versionTenant.name}.`);
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  const handleRestoreTenantVersion = async (v: SaaSWorkspaceVersion, republish: boolean) => {
    if (!versionTenant) return;
    try {
      const restored = await TenantService.restoreTenantVersion(versionTenant.id, v.id, republish);
      setTenantsList(prev => prev.map(x => x.id === restored.id ? { ...x, ...restored } : x));
      const vers = await TenantService.fetchTenantVersions(versionTenant.id);
      setTenantVersions(vers);
      notify(`Restored ${restored.name} to ${v.versionLabel}${republish ? ' & republished live' : ''}.`);
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  const handleShareTenantViaSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shareTenant || !shareRecipient.trim()) return;
    setSharingSmtp(true);
    try {
      const res = await TenantService.shareTenantPortal(shareTenant.id, shareRecipient.trim(), shareMessage.trim());
      notify(res.message || `Shared ${shareTenant.name} via kreboya603@gmail.com`);
      setShareTenant(null);
      setShareRecipient('');
      setShareMessage('');
    } catch (err: any) {
      notify(err.message, true);
    } finally {
      setSharingSmtp(false);
    }
  };

  const handleExportTenantJson = async (t: Tenant) => {
    try {
      const bundle = await TenantService.exportTenantBundle(t.id);
      downloadJson(`${t.slug}-workspace-bundle.json`, bundle);
      notify(`Downloaded full Neon workspace bundle for ${t.name}.`);
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  const handleDeleteTenant = async (id: number) => {
    try {
      await TenantService.deleteTenant(id);
      setTenantsList(prev => prev.filter(t => t.id !== id));
      setConfirmDeleteTenantId(null);
      notify(`Tenant #${id} deleted from Neon PostgreSQL.`);
      loadData();
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  const handleToggleTenantStatus = async (t: Tenant) => {
    const nextStatus = t.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    try {
      const updated = await TenantService.updateTenant(t.id, { status: nextStatus });
      setTenantsList(prev => prev.map(x => x.id === t.id ? { ...x, ...updated } : x));
      notify(`${t.name} is now ${nextStatus}.`);
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  // Payment Approvals
  const handleConfirmPayment = async (payment: PaymentSubmission) => {
    try {
      const res = await SubscriptionService.confirmPayment(payment.id, 'MADECC Super Admin');
      setPayments(prev => prev.map(p => p.id === payment.id ? { ...p, status: 'ACTIVE' } : p));
      if (res.tenant) {
        setTenantsList(prev => prev.map(t => t.id === res.tenant.id ? { ...t, ...res.tenant } : t));
      }
      notify(`Payment ${payment.paymentReference} confirmed & ${payment.tenantName || 'Workspace'} activated via SMTP.`);
      const targetTenant = res.tenant || tenantsList.find(t => t.id === payment.tenantId) || INITIAL_PILOT_TENANTS[0];
      onTriggerThankYou?.(targetTenant, payment.planCode, payment.paymentReference || 'CONFIRMED');
      loadData();
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  const handleRejectPayment = async (payment: PaymentSubmission) => {
    try {
      await fetch(`/api/saas/subscriptions/${payment.id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Payment reference not verified in statement' })
      });
      setPayments(prev => prev.map(p => p.id === payment.id ? { ...p, status: 'CANCELLED' } : p));
      notify(`Payment ${payment.paymentReference} marked rejected & subscriber notified via SMTP.`);
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  // Payout Config
  const handleSavePaymentConfig = async () => {
    try {
      const updated: DirectPaymentConfig = {
        momoNumbers: momoInput.split(',').map(s => s.trim()).filter(Boolean),
        orangeMoneyNumbers: omInput.split(',').map(s => s.trim()).filter(Boolean),
        bankAccount: {
          accountName: bankAccountName,
          bankName,
          accountNumber: bankAccountNumber,
          ibanOrSwift: bankSwift
        },
        contactWhatsApp,
        contactEmail,
        promoNote
      };
      await SubscriptionService.savePaymentConfig(updated);
      notify('Receiving accounts saved permanently in Neon PostgreSQL.');
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  // Plan Management
  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const features = newPlanForm.featuresText.split('\n').map(s => s.trim()).filter(Boolean);
      const created = await SubscriptionService.createPlan({
        code: newPlanForm.code as PlanCode,
        name: newPlanForm.name,
        description: newPlanForm.description,
        monthlyPrice: Number(newPlanForm.monthlyPrice),
        annualPrice: Number(newPlanForm.annualPrice),
        maxUsers: Number(newPlanForm.maxUsers),
        maxProjects: Number(newPlanForm.maxProjects),
        maxStorageGb: Number(newPlanForm.maxStorageGb),
        aiCreditsMonthly: Number(newPlanForm.aiCreditsMonthly),
        features
      });
      setPlans(prev => [...prev, created]);
      setShowAddPlanModal(false);
      notify(`Plan ${created.name} created in Neon.`);
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  const openEditPlan = (p: SaaSPlan) => {
    setEditingPlan(p);
    setPlanEditForm({
      name: p.name,
      description: p.description || '',
      monthlyPrice: p.monthlyPrice,
      annualPrice: p.annualPrice,
      maxUsers: p.maxUsers,
      maxProjects: p.maxProjects,
      maxStorageGb: p.maxStorageGb,
      aiCreditsMonthly: p.aiCreditsMonthly,
      featuresText: (p.features || []).join('\n'),
      changelog: ''
    });
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    try {
      const updated = await SubscriptionService.updatePlan(editingPlan.id, {
        name: planEditForm.name,
        description: planEditForm.description,
        monthlyPrice: Number(planEditForm.monthlyPrice),
        annualPrice: Number(planEditForm.annualPrice),
        maxUsers: Number(planEditForm.maxUsers),
        maxProjects: Number(planEditForm.maxProjects),
        maxStorageGb: Number(planEditForm.maxStorageGb),
        aiCreditsMonthly: Number(planEditForm.aiCreditsMonthly),
        features: String(planEditForm.featuresText || '').split('\n').map(s => s.trim()).filter(Boolean),
        changelog: planEditForm.changelog || 'Updated pricing & feature matrix'
      });
      setPlans(prev => prev.map(p => p.id === updated.id ? updated : p));
      setEditingPlan(null);
      notify(`Saved ${updated.name} (v${updated.version || 1}) in Neon.`);
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  const handlePlanLifecycle = async (p: SaaSPlan, action: 'publish' | 'republish' | 'unpublish' | 'duplicate') => {
    try {
      const res = await SubscriptionService.publishPlanAction(p.id, action);
      if (action === 'duplicate' && res.plan) {
        setPlans(prev => [...prev, res.plan]);
      } else if (res.plan) {
        setPlans(prev => prev.map(x => x.id === p.id ? res.plan : x));
      }
      notify(`Plan ${p.name}: ${action} completed.`);
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  const openPlanVersions = async (p: SaaSPlan) => {
    setVersionPlan(p);
    try {
      const vers = await SubscriptionService.fetchPlanVersions(p.id);
      setPlanVersions(vers);
    } catch (err: any) {
      notify(err.message, true);
    }
  };

  // Derived Filtered Lists
  const filteredTenants = tenantsList.filter(t => {
    const matchText =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.primaryDomain || '').toLowerCase().includes(searchQuery.toLowerCase());
    const pub = t.publishStatus || 'PUBLISHED';
    const matchPub = publishFilter === 'ALL' || pub === publishFilter;
    return matchText && matchPub;
  });

  const pendingPaymentsCount = payments.filter(p => p.status === 'PENDING_CONFIRMATION').length;
  const filteredPayments = payments.filter(p => paymentFilter === 'ALL' || p.status === paymentFilter);
  const filteredAudits = auditLogs.filter(a =>
    !auditSearch.trim() ||
    `${a.action} ${a.resource_type} ${a.user_email} ${JSON.stringify(a.metadata || {})}`.toLowerCase().includes(auditSearch.toLowerCase())
  );

  const computedMRR = analytics?.mrr ?? tenantsList.reduce((acc, t) => {
    if (t.status !== 'ACTIVE') return acc;
    const plan = plans.find(p => p.code === t.planCode);
    return acc + (plan?.monthlyPrice || 0);
  }, 0);

  return (
    <div className={`${embedded ? 'rounded-2xl border border-slate-800 overflow-hidden' : 'min-h-screen'} bg-slate-950 text-slate-100 flex flex-col font-sans`}>
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 px-6 py-4 flex flex-wrap items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                MADECC SaaS Cloud Control Plane
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold uppercase">
                Live Neon + SMTP + Cloudinary
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Create, upload branding, publish, republish, version, duplicate, share &amp; export multi-tenant construction portals.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {uploadingStatus && (
            <span className="text-xs text-amber-400 font-mono px-2.5 py-1 bg-amber-500/10 rounded-lg border border-amber-500/30">
              {uploadingStatus}
            </span>
          )}
          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700"
            title="Sync all live SaaS tables from Neon"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={() => setShowAddTenantModal(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold shadow-md"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            New Workspace
          </button>

          {pendingPaymentsCount > 0 && (
            <button
              onClick={() => setActiveTab('PAYMENTS')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-400 text-xs font-semibold"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{pendingPaymentsCount} Pending Approvals</span>
            </button>
          )}

          {!embedded && (
            <button
              onClick={onBackToApp}
              className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold border border-slate-700"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Return to App
            </button>
          )}
        </div>
      </header>

      {toast && (
        <div className={`fixed top-20 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-medium border ${
          toast.isError
            ? 'bg-rose-950/95 border-rose-500 text-rose-200'
            : 'bg-emerald-950/95 border-emerald-500 text-emerald-200'
        }`}>
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toast.text}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-slate-900/60 border-b border-slate-800 px-6 flex gap-2 overflow-x-auto text-xs font-semibold">
        {[
          { id: 'OVERVIEW', label: 'Overview KPI', icon: Activity },
          { id: 'TENANTS', label: `Workspaces & Versioning (${tenantsList.length})`, icon: Building2 },
          { id: 'PAYMENTS', label: `Payment Approvals (${pendingPaymentsCount})`, icon: CreditCard },
          { id: 'PLANS', label: `Plans & Pricing (${plans.length})`, icon: Sliders },
          { id: 'PAYMENT_CONFIG', label: 'Payout Accounts', icon: DollarSign },
          { id: 'AI_USAGE', label: `AI & Storage Metering (${usageEvents.length})`, icon: Zap },
          { id: 'AUDIT', label: `Audit Logs (${auditLogs.length})`, icon: FileText }
        ].map((tab) => {
          const Icon = tab.icon;
          const isAct = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 shrink-0 ${
                isAct
                  ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* TAB 1: OVERVIEW KPI */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Active / Published Workspaces</span>
                  <Building2 className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-3xl font-extrabold text-white font-mono">
                  {analytics?.activeTenantsCount ?? tenantsList.filter(t => t.status === 'ACTIVE').length}
                  <span className="text-sm text-slate-400 font-normal"> / {tenantsList.length}</span>
                </div>
                <p className="text-[11px] text-emerald-400">
                  {analytics?.publishedTenantsCount ?? tenantsList.filter(t => (t.publishStatus || 'PUBLISHED') === 'PUBLISHED').length} published live portals
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Live Monthly Recurring Revenue</span>
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-extrabold text-white font-mono">
                  {SubscriptionService.formatPrice(computedMRR)}
                </div>
                <p className="text-[11px] text-slate-400">
                  Collected: <strong className="text-emerald-400">{SubscriptionService.formatPrice(analytics?.totalCollected || 0)}</strong>
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Pending Cash / MoMo Approvals</span>
                  <Clock className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-3xl font-extrabold text-amber-400 font-mono">
                  {pendingPaymentsCount}
                </div>
                <p className="text-[11px] text-slate-400">
                  Pending value: {SubscriptionService.formatPrice(analytics?.pendingCash || 0)}
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-1.5">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Saved Workspace Versions</span>
                  <History className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-3xl font-extrabold text-white font-mono">
                  {analytics?.totalVersionsCount ?? tenantsList.reduce((a, t) => a + (t.versionsCount || 1), 0)}
                </div>
                <p className="text-[11px] text-slate-400">
                  {analytics?.usageSummary?.totalRuns ?? usageEvents.length} metered AI/API events
                </p>
              </div>
            </div>

            {/* Workspaces Quick Matrix */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="font-bold text-white text-base">Tenant Workspaces Lifecycle</h3>
                  <p className="text-xs text-slate-400">Direct live state from Neon PostgreSQL.</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => downloadCsv(
                      'madecc-saas-tenants.csv',
                      ['ID', 'Name', 'Slug', 'Primary Domain', 'Plan', 'Status', 'Publish Status', 'Version', 'AI Credits', 'Email'],
                      tenantsList.map(t => [t.id, t.name, t.slug, t.primaryDomain, t.planCode, t.status, t.publishStatus || 'PUBLISHED', `v${t.publishedVersion || 1}.0`, t.aiCreditsBalance, t.email])
                    )}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
                  </button>
                  <button
                    onClick={() => setShowAddTenantModal(true)}
                    className="px-3 py-1.5 bg-amber-500 text-slate-950 rounded-xl text-xs font-bold flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" /> Create Workspace
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-3">Company</th>
                      <th className="p-3">Domain</th>
                      <th className="p-3">Plan</th>
                      <th className="p-3">Release</th>
                      <th className="p-3">Status</th>
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {tenantsList.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-800/40">
                        <td className="p-3 font-bold text-white flex items-center gap-2">
                          <img src={t.logoUrl || '/logo.png'} alt={t.name} className="w-6 h-6 rounded object-cover bg-slate-800" />
                          <span>{t.name}</span>
                        </td>
                        <td className="p-3 font-mono text-slate-300">{t.primaryDomain}</td>
                        <td className="p-3 text-amber-400 font-bold">{t.planCode}</td>
                        <td className="p-3 font-mono">
                          v{t.publishedVersion || 1}.0{' '}
                          <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                            (t.publishStatus || 'PUBLISHED') === 'PUBLISHED' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-slate-700 text-slate-300'
                          }`}>
                            {t.publishStatus || 'PUBLISHED'}
                          </span>
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                          }`}>{t.status}</span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => onImpersonateTenant(t)}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg text-xs font-semibold"
                          >
                            Open Portal
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: FULL WORKSPACES LIFECYCLE & VERSIONING */}
        {activeTab === 'TENANTS' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 flex-1">
                <div className="relative flex-1 min-w-[220px] max-w-md">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search workspaces by name, slug or domain..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-9 pr-4 py-2 text-xs"
                  />
                </div>
                <select
                  value={publishFilter}
                  onChange={(e) => setPublishFilter(e.target.value as any)}
                  className="bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
                >
                  <option value="ALL">All States</option>
                  <option value="PUBLISHED">Published Live</option>
                  <option value="DRAFT">Draft</option>
                  <option value="UNPUBLISHED">Unpublished</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadCsv(
                    'saas-workspaces-directory.csv',
                    ['ID', 'Name', 'Slug', 'Primary Domain', 'Custom Domain', 'Plan', 'Status', 'Publish Status', 'Version', 'AI Credits'],
                    filteredTenants.map(t => [t.id, t.name, t.slug, t.primaryDomain, t.customDomain, t.planCode, t.status, t.publishStatus || 'PUBLISHED', t.publishedVersion || 1, t.aiCreditsBalance])
                  )}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
                </button>
                <button
                  onClick={() => setShowAddTenantModal(true)}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Workspace
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTenants.map((t) => {
                const isPub = (t.publishStatus || 'PUBLISHED') === 'PUBLISHED';
                return (
                  <div key={t.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3 min-w-0">
                          <div className="w-11 h-11 rounded-xl bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                            {t.logoUrl ? (
                              <img src={t.logoUrl} alt={t.name} className="w-full h-full object-cover" />
                            ) : (
                              <Building2 className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h4 className="font-bold text-white text-sm truncate">{t.name}</h4>
                            <div className="text-[10px] text-slate-400 font-mono truncate">{t.primaryDomain}</div>
                          </div>
                        </div>

                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            isPub ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30' : 'bg-slate-800 text-slate-300 border border-slate-700'
                          }`}>
                            {t.publishStatus || 'PUBLISHED'} • v{t.publishedVersion || 1}.0
                          </span>
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            t.status === 'ACTIVE' ? 'bg-blue-500/15 text-blue-300' : 'bg-amber-500/15 text-amber-300'
                          }`}>
                            {t.status}
                          </span>
                        </div>
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-2">
                        {t.settings?.tagline || t.legalName || 'Civil engineering & construction workspace'}
                      </p>

                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[10px]">Plan Tier</span>
                          <span className="text-amber-400 font-bold">{t.planCode}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[10px]">AI Balance</span>
                          <span className="text-white font-mono">{t.aiCreditsBalance}</span>
                        </div>
                      </div>
                    </div>

                    {/* Full Lifecycle Controls */}
                    <div className="space-y-2 pt-3 border-t border-slate-800 text-[11px]">
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          onClick={() => openEditTenantModal(t)}
                          className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold flex items-center justify-center gap-1"
                        >
                          <Edit3 className="w-3 h-3 text-amber-400" /> Edit/Save
                        </button>
                        <button
                          onClick={() => openVersionsDrawer(t)}
                          className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold flex items-center justify-center gap-1"
                        >
                          <History className="w-3 h-3 text-purple-400" /> Versions ({t.versionsCount || 1})
                        </button>
                        <button
                          onClick={() => handleDuplicateTenant(t)}
                          className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold flex items-center justify-center gap-1"
                        >
                          <Copy className="w-3 h-3 text-sky-400" /> Duplicate
                        </button>
                      </div>

                      <div className="grid grid-cols-3 gap-1.5">
                        {isPub ? (
                          <>
                            <button
                              onClick={() => handlePublishAction(t, 'republish')}
                              className="px-2 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 rounded-lg font-semibold flex items-center justify-center gap-1"
                            >
                              <RefreshCw className="w-3 h-3" /> Republish
                            </button>
                            <button
                              onClick={() => handlePublishAction(t, 'unpublish')}
                              className="px-2 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg font-semibold flex items-center justify-center gap-1"
                            >
                              <EyeOff className="w-3 h-3" /> Unpublish
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handlePublishAction(t, 'publish')}
                            className="col-span-2 px-2 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-lg font-bold flex items-center justify-center gap-1"
                          >
                            <Globe className="w-3 h-3" /> Publish Live
                          </button>
                        )}
                        <button
                          onClick={() => {
                            setShareTenant(t);
                            setShareRecipient(t.email || '');
                          }}
                          className="px-2 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg font-semibold flex items-center justify-center gap-1"
                        >
                          <Share2 className="w-3 h-3" /> Share
                        </button>
                      </div>

                      <div className="flex items-center justify-between gap-1.5 pt-1">
                        <button
                          onClick={() => handleExportTenantJson(t)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold flex items-center gap-1"
                        >
                          <Download className="w-3 h-3 text-emerald-400" /> JSON
                        </button>
                        <button
                          onClick={() => handleToggleTenantStatus(t)}
                          className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                        >
                          {t.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                        </button>
                        {!t.isFlagship && (
                          confirmDeleteTenantId === t.id ? (
                            <button
                              onClick={() => handleDeleteTenant(t.id)}
                              className="px-2.5 py-1.5 bg-rose-600 text-white rounded-lg font-bold"
                            >
                              Confirm Delete
                            </button>
                          ) : (
                            <button
                              onClick={() => setConfirmDeleteTenantId(t.id)}
                              className="p-1.5 bg-slate-800 hover:bg-rose-900/50 text-rose-400 rounded-lg"
                              title="Delete workspace"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )
                        )}
                        <button
                          onClick={() => onImpersonateTenant(t)}
                          className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg flex items-center gap-1"
                        >
                          Launch <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 3: PAYMENT APPROVALS */}
        {activeTab === 'PAYMENTS' && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white text-lg">Subscription Payment Approvals Inbox</h3>
                <p className="text-xs text-slate-400">Verify MoMo / Orange Money / Bank Wire submissions in Neon &amp; dispatch receipts via SMTP.</p>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={paymentFilter}
                  onChange={(e) => setPaymentFilter(e.target.value as any)}
                  className="bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs"
                >
                  <option value="ALL">All Payments ({payments.length})</option>
                  <option value="PENDING_CONFIRMATION">Pending Confirmation ({pendingPaymentsCount})</option>
                  <option value="ACTIVE">Confirmed &amp; Active</option>
                  <option value="CANCELLED">Rejected / Cancelled</option>
                </select>
                <button
                  onClick={() => downloadCsv(
                    'saas-subscription-payments.csv',
                    ['ID', 'Tenant', 'Plan', 'Cycle', 'Amount', 'Currency', 'Method', 'Sender', 'TXID', 'Status', 'Created'],
                    filteredPayments.map(p => [p.id, p.tenantName, p.planCode, p.billingCycle, p.amount, p.currency, p.paymentMethod, p.senderPhone, p.paymentReference, p.status, p.createdAt])
                  )}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" /> Print Ledger
                </button>
              </div>
            </div>

            {filteredPayments.length === 0 ? (
              <div className="text-center py-10 text-slate-400 text-xs">No payment submissions match the selected filter.</div>
            ) : (
              <div className="space-y-3">
                {filteredPayments.map((payment) => (
                  <div key={payment.id} className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-white text-sm">{payment.tenantName || `Tenant #${payment.tenantId}`}</span>
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
                          {payment.planCode} ({payment.billingCycle})
                        </span>
                        <span className={`px-2 py-0.5 rounded font-bold ${
                          payment.status === 'PENDING_CONFIRMATION' ? 'bg-amber-500/20 text-amber-300' :
                          payment.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300' :
                          'bg-rose-500/20 text-rose-300'
                        }`}>
                          {payment.status}
                        </span>
                      </div>
                      <div className="text-slate-400">
                        Method: <strong className="text-slate-200">{payment.paymentMethod}</strong> &bull;
                        Sender: <strong className="text-amber-400 font-mono">{payment.senderPhone || 'N/A'}</strong> &bull;
                        TXID: <strong className="text-white font-mono">{payment.paymentReference}</strong>
                      </div>
                      {payment.proofUrl && (
                        <a
                          href={payment.proofUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-sky-400 hover:underline font-semibold"
                        >
                          <ExternalLink className="w-3 h-3" /> View Uploaded Receipt Proof
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <div className="text-lg font-black text-white font-mono">
                          {SubscriptionService.formatPrice(payment.amount, payment.currency)}
                        </div>
                        <div className="text-[10px] text-slate-500">{payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : ''}</div>
                      </div>

                      {payment.status === 'PENDING_CONFIRMATION' ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleConfirmPayment(payment)}
                            className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl flex items-center gap-1.5"
                          >
                            <Check className="w-4 h-4 stroke-[3]" /> Approve &amp; Activate
                          </button>
                          <button
                            onClick={() => handleRejectPayment(payment)}
                            className="p-2 bg-slate-800 hover:bg-rose-900/60 text-rose-400 rounded-xl"
                            title="Reject payment"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={async () => {
                            const email = payment.tenantEmail || contactEmail;
                            if (!email) return;
                            try {
                              await SubscriptionService.shareReceipt(payment.id, email);
                              notify(`Receipt emailed to ${email} via kreboya603@gmail.com`);
                            } catch (e: any) {
                              notify(e.message, true);
                            }
                          }}
                          className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg font-semibold flex items-center gap-1"
                        >
                          <Share2 className="w-3.5 h-3.5" /> Email Receipt
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: PLANS & PRICING LIFECYCLE */}
        {activeTab === 'PLANS' && (
          <div className="space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white text-lg">SaaS Subscription Plans & Versioning</h3>
                <p className="text-xs text-slate-400">Create, edit &amp; save, publish/unpublish/republish, duplicate, and export SaaS plans in Neon.</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => downloadCsv(
                    'saas-plans.csv',
                    ['ID', 'Code', 'Name', 'Monthly', 'Annual', 'MaxUsers', 'MaxProjects', 'StorageGB', 'Credits', 'PublishStatus', 'Version'],
                    plans.map(p => [p.id, p.code, p.name, p.monthlyPrice, p.annualPrice, p.maxUsers, p.maxProjects, p.maxStorageGb, p.aiCreditsMonthly, p.publishStatus || 'PUBLISHED', p.version || 1])
                  )}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
                </button>
                <button
                  onClick={() => setShowAddPlanModal(true)}
                  className="px-3.5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" /> Create Plan
                </button>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((p) => {
                const isPub = (p.publishStatus || 'PUBLISHED') === 'PUBLISHED';
                return (
                  <div key={p.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col justify-between gap-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="font-bold text-white text-base">{p.name}</h4>
                        <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono font-bold">
                          {p.code} • v{p.version || 1}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-xl font-black text-white font-mono">
                          {SubscriptionService.formatPrice(p.monthlyPrice, p.currency)}/mo
                        </span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          isPub ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-800 text-slate-300'
                        }`}>
                          {p.publishStatus || 'PUBLISHED'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">{p.description}</p>
                      <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1 text-xs">
                        <div className="flex justify-between"><span className="text-slate-400">Annual:</span><strong className="text-emerald-400 font-mono">{SubscriptionService.formatPrice(p.annualPrice, p.currency)}</strong></div>
                        <div className="flex justify-between"><span className="text-slate-400">Seats / Projects:</span><strong>{p.maxUsers === -1 ? 'Unlim.' : p.maxUsers} / {p.maxProjects === -1 ? 'Unlim.' : p.maxProjects}</strong></div>
                        <div className="flex justify-between"><span className="text-slate-400">Storage / AI Credits:</span><strong>{p.maxStorageGb} GB / {p.aiCreditsMonthly}</strong></div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-1.5 pt-3 border-t border-slate-800 text-xs">
                      <button
                        onClick={() => openEditPlan(p)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold flex items-center justify-center gap-1"
                      >
                        <Edit3 className="w-3 h-3 text-amber-400" /> Edit &amp; Save
                      </button>
                      <button
                        onClick={() => openPlanVersions(p)}
                        className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-semibold flex items-center justify-center gap-1"
                      >
                        <History className="w-3 h-3 text-purple-400" /> Versions
                      </button>
                      <button
                        onClick={() => handlePlanLifecycle(p, isPub ? 'republish' : 'publish')}
                        className="px-2.5 py-1.5 bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 rounded-lg font-semibold flex items-center justify-center gap-1"
                      >
                        <Globe className="w-3 h-3" /> {isPub ? 'Republish' : 'Publish'}
                      </button>
                      <button
                        onClick={() => handlePlanLifecycle(p, 'unpublish')}
                        className="px-2.5 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 rounded-lg font-semibold flex items-center justify-center gap-1"
                      >
                        <EyeOff className="w-3 h-3" /> Unpublish
                      </button>
                      <button
                        onClick={() => handlePlanLifecycle(p, 'duplicate')}
                        className="col-span-2 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-sky-300 rounded-lg font-semibold flex items-center justify-center gap-1"
                      >
                        <Copy className="w-3 h-3" /> Duplicate Plan Tier
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 5: PERSISTENT PAYOUT & RECEIVING ACCOUNTS */}
        {activeTab === 'PAYMENT_CONFIG' && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-emerald-400" />
                  Direct Payment Receiving Accounts (Persisted in Neon)
                </h3>
                <p className="text-xs text-slate-400">Saved permanently in Neon site_settings and reflected on all onboarding &amp; billing screens.</p>
              </div>
              <button
                onClick={handleSavePaymentConfig}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs"
              >
                <Save className="w-4 h-4" /> Save Configuration
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6 text-xs">
              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-4">
                <div className="font-bold text-amber-400 flex items-center gap-2"><Phone className="w-4 h-4" /> MTN Mobile Money Numbers</div>
                <input
                  type="text"
                  value={momoInput}
                  onChange={(e) => setMomoInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 font-mono"
                />
                <div className="font-bold text-orange-400 flex items-center gap-2 pt-2"><Phone className="w-4 h-4" /> Orange Money Numbers</div>
                <input
                  type="text"
                  value={omInput}
                  onChange={(e) => setOmInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 font-mono"
                />
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="font-bold text-blue-400 flex items-center gap-2"><Landmark className="w-4 h-4" /> Bank Account Wire Details</div>
                <input type="text" value={bankAccountName} onChange={(e) => setBankAccountName(e.target.value)} placeholder="Account Name" className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2" />
                <input type="text" value={bankName} onChange={(e) => setBankName(e.target.value)} placeholder="Bank Name" className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2" />
                <input type="text" value={bankAccountNumber} onChange={(e) => setBankAccountNumber(e.target.value)} placeholder="Account / RIB" className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 font-mono" />
                <input type="text" value={bankSwift} onChange={(e) => setBankSwift(e.target.value)} placeholder="SWIFT / BIC" className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 font-mono" />
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="font-bold text-emerald-400 flex items-center gap-2"><Mail className="w-4 h-4" /> Billing Email &amp; WhatsApp Concierge</div>
                <input type="text" value={contactWhatsApp} onChange={(e) => setContactWhatsApp(e.target.value)} placeholder="WhatsApp Number" className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2 font-mono" />
                <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} placeholder="kreboya603@gmail.com" className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl px-3 py-2" />
              </div>

              <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
                <div className="font-bold text-amber-400 flex items-center gap-2"><Sparkles className="w-4 h-4" /> Checkout Promotional Notice</div>
                <textarea rows={3} value={promoNote} onChange={(e) => setPromoNote(e.target.value)} className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl p-3" />
              </div>
            </div>
          </div>
        )}

        {/* TAB 6: REAL AI & STORAGE METERING */}
        {activeTab === 'AI_USAGE' && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-white text-lg">Live AI &amp; Platform Metering Events</h3>
                <p className="text-xs text-slate-400">Real telemetry stored in Neon usage_events table.</p>
              </div>
              <button
                onClick={() => downloadCsv(
                  'saas-usage-metering.csv',
                  ['ID', 'Tenant', 'Event Type', 'Quantity', 'Unit', 'Est Cost XAF', 'Created At'],
                  usageEvents.map(u => [u.id, u.tenant_name || u.tenant_id, u.event_type, u.quantity, u.unit, u.estimated_cost, u.created_at])
                )}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-emerald-400" /> Export Usage CSV
              </button>
            </div>

            <div className="grid sm:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-xs block">Total Metered Runs</span>
                <span className="text-2xl font-bold text-white font-mono">{analytics?.usageSummary?.totalRuns ?? usageEvents.length}</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-xs block">Total AI Credits Consumed</span>
                <span className="text-2xl font-bold text-emerald-400 font-mono">{analytics?.usageSummary?.totalCreditsUsed ?? 0}</span>
              </div>
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                <span className="text-slate-400 text-xs block">Total Cloud Storage Used</span>
                <span className="text-2xl font-bold text-amber-400 font-mono">{analytics?.totalStorageGb ?? 0} GB</span>
              </div>
            </div>

            {usageEvents.length === 0 ? (
              <p className="text-xs text-slate-400">No metered usage events recorded yet.</p>
            ) : (
              <div className="divide-y divide-slate-800 text-xs font-mono">
                {usageEvents.map((u) => (
                  <div key={u.id} className="py-2.5 flex flex-wrap items-center justify-between gap-2 text-slate-300">
                    <span>
                      <strong className="text-amber-400">[{u.event_type}]</strong> {u.tenant_name || `Tenant #${u.tenant_id}`}
                    </span>
                    <span>{u.quantity} {u.unit} &bull; {new Date(u.created_at).toLocaleString()}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 7: REAL NEON AUDIT LOGS */}
        {activeTab === 'AUDIT' && (
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-bold text-white text-lg">Live Neon Platform Audit Logs</h3>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="text"
                  value={auditSearch}
                  onChange={(e) => setAuditSearch(e.target.value)}
                  placeholder="Filter logs..."
                  className="bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-1.5 text-xs"
                />
                <button
                  onClick={() => downloadCsv(
                    'saas-platform-audit-logs.csv',
                    ['ID', 'Action', 'Resource Type', 'Resource ID', 'Tenant', 'Actor', 'Timestamp', 'Details'],
                    filteredAudits.map(a => [a.id, a.action, a.resource_type, a.resource_id, a.tenant_name || a.tenant_id, a.user_email, a.created_at, JSON.stringify(a.metadata || {})])
                  )}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
                </button>
              </div>
            </div>

            {filteredAudits.length === 0 ? (
              <p className="text-xs text-slate-400">No audit log entries match your filter.</p>
            ) : (
              <div className="divide-y divide-slate-800 text-xs font-mono max-h-[520px] overflow-y-auto">
                {filteredAudits.map((a) => (
                  <div key={a.id} className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-slate-300">
                    <div>
                      <span className="text-emerald-400 font-bold">[{a.action}]</span>{' '}
                      <span className="text-white">{a.metadata?.summary || `${a.resource_type} #${a.resource_id || '-'}`}</span>
                    </div>
                    <div className="text-slate-500 text-[11px] shrink-0">
                      {a.user_email} &bull; {new Date(a.created_at).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* MODAL: CREATE TENANT */}
      {showAddTenantModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-400" /> Provision New Tenant Workspace
              </h3>
              <button onClick={() => setShowAddTenantModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleCreateTenant} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Company / Workspace Name *</label>
                <input type="text" required value={newTenantName} onChange={(e) => setNewTenantName(e.target.value)} placeholder="e.g. Sahel Engineering Ltd" className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Slug</label>
                  <input type="text" value={newTenantSlug} onChange={(e) => setNewTenantSlug(e.target.value)} placeholder="sahel-engineering" className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 font-mono" />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Plan Tier</label>
                  <select value={newTenantPlan} onChange={(e) => setNewTenantPlan(e.target.value as PlanCode)} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2">
                    {plans.map(p => <option key={p.code} value={p.code}>{p.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Official Email</label>
                  <input type="email" value={newTenantEmail} onChange={(e) => setNewTenantEmail(e.target.value)} placeholder="admin@company.cm" className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2" />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1 font-semibold">Phone / WhatsApp</label>
                  <input type="text" value={newTenantPhone} onChange={(e) => setNewTenantPhone(e.target.value)} placeholder="+237 6XX XXX XXX" className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2" />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Upload Company Logo (Cloudinary / Supabase)</label>
                <label className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-950 border border-dashed border-slate-700 rounded-xl cursor-pointer text-amber-400">
                  <UploadCloud className="w-4 h-4" />
                  <span>{newTenantLogoUrl ? 'Logo Uploaded ✓' : 'Select Logo Image'}</span>
                  <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleAssetUpload(e.target.files[0], setNewTenantLogoUrl)} className="hidden" />
                </label>
              </div>

              <div>
                <label className="text-slate-300 block mb-1 font-semibold">Address</label>
                <input type="text" value={newTenantAddress} onChange={(e) => setNewTenantAddress(e.target.value)} placeholder="Douala / Yaoundé, Cameroon" className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2" />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowAddTenantModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl">Create &amp; Publish Workspace</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT / SAVE TENANT & UPLOAD LOGO/COVER */}
      {editingTenant && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" /> Edit &amp; Save Workspace: {editingTenant.name}
              </h3>
              <button onClick={() => setEditingTenant(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveTenant} className="space-y-3 text-xs">
              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Workspace Name</label>
                  <input type="text" required value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2" />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Legal Name</label>
                  <input type="text" value={editForm.legalName || ''} onChange={(e) => setEditForm({ ...editForm, legalName: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2" />
                </div>
              </div>

              <div className="grid sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Plan Tier</label>
                  <select value={editForm.planCode || 'PROFESSIONAL'} onChange={(e) => setEditForm({ ...editForm, planCode: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2">
                    {plans.map(p => <option key={p.code} value={p.code}>{p.code}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Custom Domain</label>
                  <input type="text" value={editForm.customDomain || ''} onChange={(e) => setEditForm({ ...editForm, customDomain: e.target.value })} placeholder="company.com" className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 font-mono" />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">AI Credits Balance</label>
                  <input type="number" value={editForm.aiCreditsBalance ?? 0} onChange={(e) => setEditForm({ ...editForm, aiCreditsBalance: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 font-mono" />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Upload New Logo</label>
                  <label className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-950 border border-dashed border-slate-700 rounded-xl cursor-pointer text-amber-400">
                    <UploadCloud className="w-4 h-4" />
                    <span>{editForm.logoUrl ? 'Replace Logo Image' : 'Upload Logo'}</span>
                    <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleAssetUpload(e.target.files[0], (url) => setEditForm((f: any) => ({ ...f, logoUrl: url })))} className="hidden" />
                  </label>
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Upload Brand Cover Banner</label>
                  <label className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-950 border border-dashed border-slate-700 rounded-xl cursor-pointer text-sky-400">
                    <UploadCloud className="w-4 h-4" />
                    <span>{editForm.brandCoverUrl ? 'Replace Cover Banner' : 'Upload Cover Banner'}</span>
                    <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && handleAssetUpload(e.target.files[0], (url) => setEditForm((f: any) => ({ ...f, brandCoverUrl: url })))} className="hidden" />
                  </label>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-300 block mb-1">Contact Email</label>
                  <input type="email" value={editForm.email || ''} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2" />
                </div>
                <div>
                  <label className="text-slate-300 block mb-1">Contact Phone</label>
                  <input type="text" value={editForm.phone || ''} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2" />
                </div>
              </div>

              <div>
                <label className="text-slate-300 block mb-1">White-Label Tagline</label>
                <input type="text" value={editForm.tagline || ''} onChange={(e) => setEditForm({ ...editForm, tagline: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2" />
              </div>

              <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-2">
                <label className="flex items-center gap-2 text-slate-200 font-semibold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(editForm.createVersionSnapshot)}
                    onChange={(e) => setEditForm({ ...editForm, createVersionSnapshot: e.target.checked })}
                  />
                  Create new version snapshot in Neon upon Save
                </label>
                <input
                  type="text"
                  value={editForm.changelog || ''}
                  onChange={(e) => setEditForm({ ...editForm, changelog: e.target.value })}
                  placeholder="Version changelog note (e.g. Updated domain & white-label palette)"
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-1.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setEditingTenant(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl flex items-center gap-1.5">
                  <Save className="w-3.5 h-3.5" /> Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: TENANT VERSIONING HISTORY & ROLLBACK */}
      {versionTenant && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-2xl w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-white font-bold text-base flex items-center gap-2">
                  <History className="w-5 h-5 text-purple-400" /> Workspace Version History — {versionTenant.name}
                </h3>
                <p className="text-xs text-slate-400">Live Version: v{versionTenant.publishedVersion || 1}.0 ({versionTenant.publishStatus || 'PUBLISHED'})</p>
              </div>
              <button onClick={() => setVersionTenant(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newVersionChangelog}
                onChange={(e) => setNewVersionChangelog(e.target.value)}
                placeholder="Snapshot changelog note (optional)..."
                className="flex-1 bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 text-xs"
              />
              <button
                onClick={handleSaveManualVersion}
                className="px-4 py-2 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl text-xs flex items-center gap-1.5"
              >
                <Layers className="w-3.5 h-3.5" /> Save Snapshot
              </button>
            </div>

            <div className="space-y-2 max-h-80 overflow-y-auto">
              {tenantVersions.map((v) => (
                <div key={v.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                  <div>
                    <div className="font-bold text-white flex items-center gap-2">
                      <span className="font-mono text-purple-300">{v.versionLabel}</span>
                      <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300">{v.publishStatus}</span>
                    </div>
                    <p className="text-slate-300 mt-0.5">{v.changelog}</p>
                    <p className="text-[10px] text-slate-500">{v.createdBy} &bull; {new Date(v.createdAt).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => downloadJson(`${versionTenant.slug}-${v.versionLabel}.json`, v)}
                      className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg font-semibold flex items-center gap-1"
                    >
                      <Download className="w-3 h-3" /> JSON
                    </button>
                    <button
                      onClick={() => handleRestoreTenantVersion(v, true)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-lg font-bold flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Restore &amp; Republish
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: SHARE WORKSPACE VIA SMTP */}
      {shareTenant && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-sm flex items-center gap-2">
                <Share2 className="w-4 h-4 text-amber-400" /> Share Portal via SMTP ({shareTenant.name})
              </h3>
              <button onClick={() => setShareTenant(null)} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleShareTenantViaSmtp} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Recipient Email *</label>
                <input type="email" required value={shareRecipient} onChange={(e) => setShareRecipient(e.target.value)} placeholder="client@company.cm" className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2" />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Optional Note</label>
                <textarea rows={2} value={shareMessage} onChange={(e) => setShareMessage(e.target.value)} placeholder="Your workspace portal is live..." className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-2.5" />
              </div>
              <button type="submit" disabled={sharingSmtp} className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl">
                {sharingSmtp ? 'Sending via kreboya603@gmail.com...' : 'Send Branded Portal Link via Email'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE PLAN */}
      {showAddPlanModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-base">Create Custom SaaS Plan</h3>
              <button onClick={() => setShowAddPlanModal(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleCreatePlan} className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <input type="text" required placeholder="Code (e.g. REGIONAL_PRO)" value={newPlanForm.code} onChange={(e) => setNewPlanForm({ ...newPlanForm, code: e.target.value })} className="bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 font-mono" />
                <input type="text" required placeholder="Plan Name" value={newPlanForm.name} onChange={(e) => setNewPlanForm({ ...newPlanForm, name: e.target.value })} className="bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2" />
              </div>
              <input type="text" placeholder="Description" value={newPlanForm.description} onChange={(e) => setNewPlanForm({ ...newPlanForm, description: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Monthly (XAF)</label>
                  <input type="number" value={newPlanForm.monthlyPrice} onChange={(e) => setNewPlanForm({ ...newPlanForm, monthlyPrice: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 font-mono" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Annual (XAF)</label>
                  <input type="number" value={newPlanForm.annualPrice} onChange={(e) => setNewPlanForm({ ...newPlanForm, annualPrice: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 font-mono" />
                </div>
              </div>
              <textarea rows={3} placeholder="Features (one per line)" value={newPlanForm.featuresText} onChange={(e) => setNewPlanForm({ ...newPlanForm, featuresText: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setShowAddPlanModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-amber-500 text-slate-950 font-bold rounded-xl">Create Plan</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: EDIT & SAVE PLAN */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl my-8">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-base">Edit Plan: {editingPlan.name}</h3>
              <button onClick={() => setEditingPlan(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSavePlan} className="space-y-3 text-xs">
              <input type="text" required value={planEditForm.name || ''} onChange={(e) => setPlanEditForm({ ...planEditForm, name: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2" />
              <input type="text" value={planEditForm.description || ''} onChange={(e) => setPlanEditForm({ ...planEditForm, description: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2" />
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">Monthly Price (XAF)</label>
                  <input type="number" value={planEditForm.monthlyPrice ?? 0} onChange={(e) => setPlanEditForm({ ...planEditForm, monthlyPrice: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 font-mono" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Annual Price (XAF)</label>
                  <input type="number" value={planEditForm.annualPrice ?? 0} onChange={(e) => setPlanEditForm({ ...planEditForm, annualPrice: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 font-mono" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Storage Quota (GB)</label>
                  <input type="number" value={planEditForm.maxStorageGb ?? 5} onChange={(e) => setPlanEditForm({ ...planEditForm, maxStorageGb: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 font-mono" />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">AI Credits / Mo</label>
                  <input type="number" value={planEditForm.aiCreditsMonthly ?? 100} onChange={(e) => setPlanEditForm({ ...planEditForm, aiCreditsMonthly: Number(e.target.value) })} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2 font-mono" />
                </div>
              </div>
              <div>
                <label className="text-slate-400 block mb-1">Features (one per line)</label>
                <textarea rows={4} value={planEditForm.featuresText || ''} onChange={(e) => setPlanEditForm({ ...planEditForm, featuresText: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl p-3" />
              </div>
              <input type="text" placeholder="Changelog note..." value={planEditForm.changelog || ''} onChange={(e) => setPlanEditForm({ ...planEditForm, changelog: e.target.value })} className="w-full bg-slate-950 border border-slate-700 text-white rounded-xl px-3 py-2" />
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setEditingPlan(null)} className="px-4 py-2 bg-slate-800 text-slate-300 rounded-xl">Cancel</button>
                <button type="submit" className="px-5 py-2 bg-emerald-500 text-slate-950 font-bold rounded-xl">Save &amp; Snapshot Version</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PLAN VERSIONS */}
      {versionPlan && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-white font-bold text-base">Plan Versions — {versionPlan.name}</h3>
              <button onClick={() => setVersionPlan(null)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto text-xs">
              {planVersions.length === 0 ? (
                <p className="text-slate-400">No historical snapshots saved yet. Save edits to create versions automatically.</p>
              ) : (
                planVersions.map(v => (
                  <div key={v.id} className="bg-slate-950 border border-slate-800 rounded-xl p-3 flex items-center justify-between gap-2">
                    <div>
                      <div className="font-bold text-white font-mono">v{v.version_number} &bull; {SubscriptionService.formatPrice(v.snapshot?.monthlyPrice || 0)}/mo</div>
                      <div className="text-slate-400">{v.changelog}</div>
                    </div>
                    <button
                      onClick={async () => {
                        const restored = await SubscriptionService.restorePlanVersion(versionPlan.id, v.id);
                        setPlans(prev => prev.map(x => x.id === restored.id ? restored : x));
                        setVersionPlan(null);
                        notify(`Restored ${restored.name} from v${v.version_number}`);
                      }}
                      className="px-3 py-1.5 bg-amber-500 text-slate-950 font-bold rounded-lg"
                    >
                      Restore
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
