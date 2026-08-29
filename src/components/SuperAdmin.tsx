import React, { useState } from 'react';
import { 
  Shield, Building2, Users, CreditCard, Activity, 
  Layers, HardDrive, Zap, CheckCircle2, AlertTriangle, 
  Clock, Plus, Search, Filter, RefreshCw, Check, X, 
  ArrowRight, ExternalLink, Sparkles, Sliders, FileText, Globe
} from 'lucide-react';
import { Tenant, SaaSPlan, PlanCode, PaymentMethodCode } from '../types.ts';
import { TenantService, INITIAL_PILOT_TENANTS } from '../services/tenantService.ts';
import { SubscriptionService, DEFAULT_PLANS, DIRECT_PAYMENT_CONFIG } from '../services/subscriptionService.ts';

interface PaymentSubmission {
  id: string;
  tenantId: number;
  tenantName: string;
  planCode: PlanCode;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethodCode;
  senderPhone: string;
  transactionRef: string;
  submittedAt: string;
  status: 'PENDING' | 'CONFIRMED' | 'REJECTED';
  notes?: string;
}

interface SuperAdminProps {
  onBackToApp: () => void;
  onImpersonateTenant: (tenant: Tenant) => void;
  onTriggerThankYou?: (tenant: Tenant, planCode: string, txRef: string) => void;
}

export const SuperAdmin: React.FC<SuperAdminProps> = ({
  onBackToApp,
  onImpersonateTenant,
  onTriggerThankYou
}) => {
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'TENANTS' | 'PAYMENTS' | 'PLANS' | 'AI_USAGE' | 'AUDIT'>('OVERVIEW');
  const [tenantsList, setTenantsList] = useState<Tenant[]>(INITIAL_PILOT_TENANTS);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Pending payment requests state
  const [pendingPayments, setPendingPayments] = useState<PaymentSubmission[]>([
    {
      id: 'PAY-2024-001',
      tenantId: 2,
      tenantName: 'BuildPro Engineering Ltd',
      planCode: 'PROFESSIONAL',
      amount: 100000,
      currency: 'XAF',
      paymentMethod: 'MTN_MOMO',
      senderPhone: '+237 671 063 511',
      transactionRef: 'MTN.240828.9812A',
      submittedAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(), // 45 mins ago
      status: 'PENDING',
      notes: 'Monthly renewal for Douala headquarters.'
    },
    {
      id: 'PAY-2024-002',
      tenantId: 3,
      tenantName: 'Alpha Civil & Infra Group',
      planCode: 'STARTER',
      amount: 50000,
      currency: 'XAF',
      paymentMethod: 'ORANGE_MONEY',
      senderPhone: '+237 689 115 595',
      transactionRef: 'OM.240828.4311B',
      submittedAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(), // 2 hours ago
      status: 'PENDING',
      notes: 'Initial subscription payment via Orange OM.'
    }
  ]);

  // Plans state (editable)
  const [plans, setPlans] = useState<SaaSPlan[]>(DEFAULT_PLANS);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  const showNotification = (msg: string) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  // 1. Confirm Payment Action (The Core "Payment Received Successfully / OK" workflow)
  const handleConfirmPayment = (payment: PaymentSubmission) => {
    // 1. Update Payment Status in list
    setPendingPayments(prev => prev.map(p => p.id === payment.id ? { ...p, status: 'CONFIRMED' } : p));
    
    // 2. Update the Tenant's Plan to Active & Updated
    setTenantsList(prev => prev.map(t => {
      if (t.id === payment.tenantId) {
        return {
          ...t,
          status: 'ACTIVE',
          planCode: payment.planCode,
          updatedAt: new Date().toISOString()
        };
      }
      return t;
    }));

    showNotification(`Payment for ${payment.tenantName} confirmed successfully! Workspace activated.`);

    // 3. Trigger the Tenant's Thank You celebration screen
    const targetTenant = tenantsList.find(t => t.id === payment.tenantId) || INITIAL_PILOT_TENANTS[0];
    if (onTriggerThankYou) {
      onTriggerThankYou(targetTenant, payment.planCode, payment.transactionRef);
    }
  };

  // 2. Toggle Tenant Status (Active / Suspended)
  const handleToggleTenantStatus = (tenantId: number) => {
    setTenantsList(prev => prev.map(t => {
      if (t.id === tenantId) {
        const nextStatus = t.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
        showNotification(`Tenant ${t.name} is now ${nextStatus}.`);
        return { ...t, status: nextStatus };
      }
      return t;
    }));
  };

  // 3. Update Plan price dynamically in Super Admin
  const handleUpdatePlanPrice = (code: PlanCode, newPrice: number) => {
    setPlans(prev => prev.map(p => p.code === code ? { ...p, monthlyPrice: newPrice } : p));
    showNotification(`Plan ${code} monthly price updated to ${SubscriptionService.formatPrice(newPrice)}`);
  };

  // Filtered tenants
  const filteredTenants = tenantsList.filter(t => 
    t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.slug.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (t.primaryDomain && t.primaryDomain.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const totalMRR = tenantsList.reduce((acc, t) => {
    if (t.status !== 'ACTIVE') return acc;
    const plan = plans.find(p => p.code === t.planCode);
    return acc + (plan?.monthlyPrice || 0);
  }, 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Super Admin Top Banner */}
      <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 px-6 py-4 flex items-center justify-between shadow-xl">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 text-slate-950 font-bold shadow-lg shadow-amber-500/20">
            <Shield className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-white tracking-tight">
                MADECC SaaS Control Plane
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-mono font-bold uppercase">
                Super Admin
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Platform-wide multi-tenant management, manual direct billing approvals, and resource metering.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {pendingPayments.filter(p => p.status === 'PENDING').length > 0 && (
            <button
              onClick={() => setActiveTab('PAYMENTS')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/40 text-amber-400 text-xs font-semibold animate-pulse"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>{pendingPayments.filter(p => p.status === 'PENDING').length} Pending Payments</span>
            </button>
          )}

          <button
            onClick={onBackToApp}
            className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Return to App
          </button>
        </div>
      </header>

      {/* Notification Toast */}
      {notificationMsg && (
        <div className="fixed top-20 right-6 z-50 bg-emerald-900/90 border border-emerald-500 text-emerald-200 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-slate-900/60 border-b border-slate-800 px-6 flex gap-2 overflow-x-auto text-xs font-semibold">
        <button
          onClick={() => setActiveTab('OVERVIEW')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'OVERVIEW'
              ? 'border-amber-500 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          Overview KPI
        </button>

        <button
          onClick={() => setActiveTab('TENANTS')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'TENANTS'
              ? 'border-amber-500 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Building2 className="w-4 h-4" />
          Tenants Directory ({tenantsList.length})
        </button>

        <button
          onClick={() => setActiveTab('PAYMENTS')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 relative ${
            activeTab === 'PAYMENTS'
              ? 'border-amber-500 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Payment Approvals
          {pendingPayments.filter(p => p.status === 'PENDING').length > 0 && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping ml-1" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('PLANS')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'PLANS'
              ? 'border-amber-500 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Sliders className="w-4 h-4" />
          Plans & Pricing
        </button>

        <button
          onClick={() => setActiveTab('AI_USAGE')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'AI_USAGE'
              ? 'border-amber-500 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Zap className="w-4 h-4" />
          AI & Platform Metering
        </button>

        <button
          onClick={() => setActiveTab('AUDIT')}
          className={`py-3 px-4 border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === 'AUDIT'
              ? 'border-amber-500 text-amber-400 bg-amber-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Audit Logs
        </button>
      </div>

      {/* Main Content Body */}
      <main className="flex-1 p-6 max-w-7xl w-full mx-auto space-y-6">
        {/* ========================================================================= */}
        {/* TAB 1: OVERVIEW KPI */}
        {/* ========================================================================= */}
        {activeTab === 'OVERVIEW' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Total Active Tenants</span>
                  <Building2 className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-3xl font-extrabold text-white font-mono">
                  {tenantsList.filter(t => t.status === 'ACTIVE').length}
                </div>
                <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> MADECC Group is Flagship #001
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Monthly Recurring Revenue</span>
                  <CreditCard className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-extrabold text-white font-mono">
                  {SubscriptionService.formatPrice(totalMRR)}
                </div>
                <p className="text-[11px] text-slate-400">
                  Across Starter, Pro & Enterprise tiers
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>AI Takeoff Requests (30d)</span>
                  <Zap className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-3xl font-extrabold text-white font-mono">
                  1,482
                </div>
                <p className="text-[11px] text-slate-400">
                  CAD Analysis, BOQ & Eurocode calcs
                </p>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
                <div className="flex items-center justify-between text-slate-400 text-xs">
                  <span>Cloud Object Storage</span>
                  <HardDrive className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-3xl font-extrabold text-white font-mono">
                  8.5 GB
                </div>
                <p className="text-[11px] text-slate-400">
                  Supabase / Cloudinary drawing partitions
                </p>
              </div>
            </div>

            {/* Direct Payment Channels Reference Box */}
            <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 border border-amber-500/30 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/30">
                    <CreditCard className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-bold text-white text-base">Direct Payment Accounts for Customer Subscriptions</h3>
                    <p className="text-xs text-slate-400">Official phone numbers & bank account displayed to tenants at checkout</p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('PAYMENTS')}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                >
                  Review Pending Payments ({pendingPayments.filter(p => p.status === 'PENDING').length})
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="grid md:grid-cols-3 gap-4 text-xs">
                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-amber-400 font-bold block mb-1">MTN Mobile Money (MoMo)</span>
                  <div className="space-y-1 font-mono text-slate-200">
                    {DIRECT_PAYMENT_CONFIG.momoNumbers.map((n, i) => (
                      <div key={i} className="bg-slate-900 px-2 py-1 rounded">{n}</div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-orange-400 font-bold block mb-1">Orange Money (OM)</span>
                  <div className="space-y-1 font-mono text-slate-200">
                    {DIRECT_PAYMENT_CONFIG.orangeMoneyNumbers.map((n, i) => (
                      <div key={i} className="bg-slate-900 px-2 py-1 rounded">{n}</div>
                    ))}
                  </div>
                </div>

                <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800">
                  <span className="text-blue-400 font-bold block mb-1">Visa / Bank Wire</span>
                  <div className="text-[11px] text-slate-300 space-y-0.5">
                    <div>{DIRECT_PAYMENT_CONFIG.bankAccount.accountName}</div>
                    <div className="font-mono text-white text-[10px]">{DIRECT_PAYMENT_CONFIG.bankAccount.accountNumber}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Tenant Directory Table Preview */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-800 flex items-center justify-between">
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-amber-400" />
                  Registered Companies & Tenants
                </h3>
                <button
                  onClick={() => setActiveTab('TENANTS')}
                  className="text-xs text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1"
                >
                  View Full Directory <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="p-4">Company</th>
                      <th className="p-4">Domain / Slug</th>
                      <th className="p-4">Plan Tier</th>
                      <th className="p-4">Status</th>
                      <th className="p-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {tenantsList.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-4">
                          <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                              {t.logoUrl ? (
                                <img src={t.logoUrl} alt={t.name} className="w-full h-full object-cover" />
                              ) : (
                                <Building2 className="w-3.5 h-3.5 text-slate-400" />
                              )}
                            </div>
                            <div>
                              <div className="font-bold text-white flex items-center gap-1.5">
                                {t.name}
                                {t.isFlagship && (
                                  <span className="text-[9px] px-1 bg-amber-500/20 text-amber-400 rounded font-mono">
                                    Flagship #001
                                  </span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400">{t.legalName || 'Registered Entity'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 font-mono text-slate-300">
                          {t.primaryDomain || `${t.slug}.madecccloud.com`}
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.planCode === 'ENTERPRISE'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                              : t.planCode === 'PROFESSIONAL'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          }`}>
                            {t.planCode}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            t.status === 'ACTIVE'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => onImpersonateTenant(t)}
                            className="px-3 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 hover:text-amber-300 font-semibold rounded-lg border border-slate-700 text-xs transition-colors"
                          >
                            Inspect Workspace
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

        {/* ========================================================================= */}
        {/* TAB 2: TENANTS DIRECTORY */}
        {/* ========================================================================= */}
        {activeTab === 'TENANTS' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search tenants by name, slug or domain..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-9 pr-4 py-2 text-xs focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400">Total: {filteredTenants.length}</span>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTenants.map((t) => (
                <div
                  key={t.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 relative flex flex-col justify-between hover:border-slate-700 transition-colors"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                          {t.logoUrl ? (
                            <img src={t.logoUrl} alt={t.name} className="w-full h-full object-cover" />
                          ) : (
                            <Building2 className="w-5 h-5 text-slate-400" />
                          )}
                        </div>
                        <div>
                          <h4 className="font-bold text-white text-sm flex items-center gap-1.5">
                            {t.name}
                            {t.isFlagship && (
                              <span className="text-[9px] px-1.5 py-0.2 bg-amber-500/20 text-amber-400 rounded font-mono font-bold">
                                #001 Flagship
                              </span>
                            )}
                          </h4>
                          <span className="text-xs text-slate-400 flex items-center gap-1">
                            <Globe className="w-3 h-3" />
                            {t.primaryDomain || t.slug}
                          </span>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        t.status === 'ACTIVE'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}>
                        {t.status}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed line-clamp-2">
                      {t.settings?.tagline || t.legalName || 'Commercial construction & civil engineering operations.'}
                    </p>

                    <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Plan Tier</span>
                        <span className="text-amber-400 font-semibold">{t.planCode}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Currency</span>
                        <span className="text-slate-200 font-mono">{t.currency}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">AI Balance</span>
                        <span className="text-slate-200 font-mono">{t.aiCreditsBalance} credits</span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Contact</span>
                        <span className="text-slate-200 truncate block">{t.phone || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleToggleTenantStatus(t.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors ${
                        t.status === 'ACTIVE'
                          ? 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border-rose-500/30'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                      }`}
                    >
                      {t.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                    </button>

                    <button
                      onClick={() => onImpersonateTenant(t)}
                      className="px-4 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-md transition-all"
                    >
                      Inspect Portal <ExternalLink className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 3: PAYMENT APPROVALS INBOX (ONE-CLICK "OK / CONFIRM PAYMENT") */}
        {/* ========================================================================= */}
        {activeTab === 'PAYMENTS' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    <CreditCard className="w-5 h-5 text-amber-400" />
                    Subscription Payment Approvals Inbox
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    When customers pay via MTN MoMo, Orange OM, or Visa and submit their details, confirm receipt here with one click.
                  </p>
                </div>
                <span className="text-xs px-3 py-1 rounded-full bg-slate-800 text-amber-400 border border-amber-500/30 font-medium">
                  {pendingPayments.filter(p => p.status === 'PENDING').length} Actionable Requests
                </span>
              </div>

              {pendingPayments.length === 0 ? (
                <div className="text-center py-12 text-slate-400 space-y-2">
                  <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto" />
                  <p className="text-sm">All payments are confirmed and up to date!</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingPayments.map((payment) => (
                    <div
                      key={payment.id}
                      className={`p-5 rounded-xl border transition-all ${
                        payment.status === 'PENDING'
                          ? 'bg-slate-900/90 border-amber-500/50 shadow-lg shadow-amber-500/5 ring-1 ring-amber-500/20'
                          : 'bg-slate-950/60 border-slate-800 opacity-75'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-base">{payment.tenantName}</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-bold">
                              {payment.planCode} PLAN
                            </span>
                            <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                              payment.status === 'PENDING' ? 'bg-amber-500/20 text-amber-300' : 'bg-emerald-500/20 text-emerald-300'
                            }`}>
                              {payment.status}
                            </span>
                          </div>

                          <div className="grid sm:grid-cols-3 gap-3 text-xs text-slate-300">
                            <div>
                              <span className="text-slate-400 block text-[10px]">Payment Method</span>
                              <strong className="text-white flex items-center gap-1 mt-0.5">
                                {payment.paymentMethod === 'MTN_MOMO' && 'MTN Mobile Money'}
                                {payment.paymentMethod === 'ORANGE_MONEY' && 'Orange Money'}
                                {payment.paymentMethod === 'VISA_CARD' && 'Visa / Bank Card'}
                              </strong>
                            </div>

                            <div>
                              <span className="text-slate-400 block text-[10px]">Sender Phone / Account</span>
                              <strong className="text-amber-400 font-mono mt-0.5 block">{payment.senderPhone}</strong>
                            </div>

                            <div>
                              <span className="text-slate-400 block text-[10px]">Transaction TXID / Reference</span>
                              <strong className="text-white font-mono mt-0.5 block">{payment.transactionRef}</strong>
                            </div>
                          </div>

                          {payment.notes && (
                            <p className="text-xs text-slate-400 italic">"{payment.notes}"</p>
                          )}
                        </div>

                        {/* Right: Amount & Action Button */}
                        <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-3 shrink-0">
                          <div className="text-right">
                            <span className="text-xs text-slate-400 block">Amount Transferred</span>
                            <span className="text-xl font-black text-white font-mono">
                              {SubscriptionService.formatPrice(payment.amount, payment.currency)}
                            </span>
                          </div>

                          {payment.status === 'PENDING' ? (
                            <button
                              onClick={() => handleConfirmPayment(payment)}
                              className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all transform hover:scale-105"
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                              Payment Received Successfully (OK)
                            </button>
                          ) : (
                            <div className="text-emerald-400 font-semibold text-xs flex items-center gap-1.5 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/30">
                              <CheckCircle2 className="w-4 h-4" />
                              Confirmed & Service Enabled
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 4: PLANS & PRICING MANAGER */}
        {/* ========================================================================= */}
        {activeTab === 'PLANS' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-amber-400" />
                  SaaS Subscription Plans & Feature Matrix
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Adjust default pricing and resource quotas dynamically without code changes.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {plans.map((p) => (
                <div key={p.code} className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-white text-base">{p.name}</h4>
                    <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 font-mono font-bold">
                      {p.code}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">{p.description}</p>

                  <div className="space-y-2 pt-2 border-t border-slate-800">
                    <label className="block text-xs text-slate-400">Monthly Price (FCFA)</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={p.monthlyPrice}
                        onChange={(e) => handleUpdatePlanPrice(p.code, parseInt(e.target.value, 10) || 0)}
                        className="bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-1.5 text-xs font-mono font-bold w-full"
                      />
                      <span className="text-xs text-slate-400 font-mono">XAF</span>
                    </div>
                  </div>

                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-400">
                      <span>Max Users:</span>
                      <strong className="text-slate-200">{p.maxUsers === -1 ? 'Unlimited' : p.maxUsers}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Max Projects:</span>
                      <strong className="text-slate-200">{p.maxProjects === -1 ? 'Unlimited' : p.maxProjects}</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Storage Quota:</span>
                      <strong className="text-slate-200">{p.maxStorageGb} GB</strong>
                    </div>
                    <div className="flex justify-between text-slate-400">
                      <span>Monthly AI Credits:</span>
                      <strong className="text-amber-400 font-mono">{p.aiCreditsMonthly}</strong>
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2">
                    <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Features Included:</span>
                    {p.features?.map((f, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                        <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 5: AI & PLATFORM METERING */}
        {/* ========================================================================= */}
        {activeTab === 'AI_USAGE' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-6">
              <div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <Zap className="w-5 h-5 text-amber-400" />
                  Real-Time AI & Construction Takeoff Usage
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Server-side Gemini proxy metering and token consumption tracking per tenant.
                </p>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-xs block">AI Drawing Takeoffs (CAD/PDF)</span>
                  <span className="text-2xl font-bold text-white font-mono">842 runs</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-xs block">Eurocode Structural Calcs</span>
                  <span className="text-2xl font-bold text-emerald-400 font-mono">415 runs</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-xs block">Estimated Gemini Token Cost</span>
                  <span className="text-2xl font-bold text-amber-400 font-mono">14,200 FCFA</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* TAB 6: AUDIT LOGS */}
        {/* ========================================================================= */}
        {activeTab === 'AUDIT' && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-amber-400" />
                Platform Security & Operational Audit Logs
              </h3>

              <div className="divide-y divide-slate-800 text-xs font-mono">
                <div className="py-2.5 flex items-center justify-between text-slate-300">
                  <span className="text-emerald-400">[SUBSCRIPTION_CONFIRMED]</span>
                  <span>Payment verified for BuildPro Engineering Ltd (PROFESSIONAL Plan)</span>
                  <span className="text-slate-500">Just now</span>
                </div>
                <div className="py-2.5 flex items-center justify-between text-slate-300">
                  <span className="text-blue-400">[TENANT_CREATED]</span>
                  <span>Alpha Civil & Infra Group provisioned as Tenant #003</span>
                  <span className="text-slate-500">2 hours ago</span>
                </div>
                <div className="py-2.5 flex items-center justify-between text-slate-300">
                  <span className="text-amber-400">[AI_TAKEOFF_EXECUTED]</span>
                  <span>MADECC Group executed 12-stage CAD analysis (Drawing: FloorPlan_v2.dwg)</span>
                  <span className="text-slate-500">4 hours ago</span>
                </div>
                <div className="py-2.5 flex items-center justify-between text-slate-300">
                  <span className="text-purple-400">[SUPER_ADMIN_LOGIN]</span>
                  <span>Executive session authenticated from IP 154.72.164.88</span>
                  <span className="text-slate-500">6 hours ago</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
