import React, { useState, useEffect } from 'react';
import {
  X, Check, Zap, CreditCard, Send, HardDrive, Layers, Users,
  Copy, CheckCircle2, Clock, UploadCloud, RefreshCw, Download,
  Share2, Printer, AlertCircle
} from 'lucide-react';
import { Tenant, SaaSPlan, PlanCode, PaymentMethodCode, DirectPaymentConfig } from '../types.ts';
import { SubscriptionService, DIRECT_PAYMENT_CONFIG, DEFAULT_PLANS } from '../services/subscriptionService.ts';
import { TenantService, uploadSaasAssetFile } from '../services/tenantService.ts';

interface TenantBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant;
  onPaymentSubmitted?: (details: any) => void;
}

export const TenantBillingModal: React.FC<TenantBillingModalProps> = ({
  isOpen,
  onClose,
  tenant,
  onPaymentSubmitted
}) => {
  const [plans, setPlans] = useState<SaaSPlan[]>(DEFAULT_PLANS);
  const [paymentConfig, setPaymentConfig] = useState<DirectPaymentConfig>(DIRECT_PAYMENT_CONFIG);
  const [usageStats, setUsageStats] = useState<any>(null);
  const [tenantSubscriptions, setTenantSubscriptions] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [selectedPlanCode, setSelectedPlanCode] = useState<PlanCode>(tenant.planCode);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodCode>('MTN_MOMO');
  const [senderPhone, setSenderPhone] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);
  const [notes, setNotes] = useState('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedRecord, setSubmittedRecord] = useState<any | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);
  const [shareEmailForSub, setShareEmailForSub] = useState<Record<number, string>>({});
  const [noticeText, setNoticeText] = useState<string | null>(null);

  const loadLiveBilling = async () => {
    setLoadingData(true);
    try {
      const [livePlans, liveCfg, liveUsage, subsRes] = await Promise.all([
        SubscriptionService.fetchPlansFromApi({ includeUnpublished: false }),
        SubscriptionService.fetchPaymentConfigFromApi(),
        TenantService.fetchTenantUsage(tenant.id).catch(() => null),
        fetch(`/api/saas/subscriptions?tenantId=${tenant.id}`).then(r => r.json()).catch(() => [])
      ]);
      if (Array.isArray(livePlans) && livePlans.length > 0) setPlans(livePlans);
      if (liveCfg) setPaymentConfig(liveCfg);
      if (liveUsage) setUsageStats(liveUsage);
      if (Array.isArray(subsRes)) setTenantSubscriptions(subsRes);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (!isOpen) return;
    setSelectedPlanCode(tenant.planCode);
    setSubmittedRecord(null);
    setErrorMsg(null);
    loadLiveBilling();
  }, [isOpen, tenant.id]);

  if (!isOpen) return null;

  const currentPlan = plans.find(p => p.code.toUpperCase() === tenant.planCode.toUpperCase()) || plans[0] || DEFAULT_PLANS[0];
  const selectedPlan = plans.find(p => p.code.toUpperCase() === selectedPlanCode.toUpperCase()) || currentPlan;
  const priceToPay = billingCycle === 'MONTHLY' ? selectedPlan.monthlyPrice : selectedPlan.annualPrice;

  const handleCopy = (num: string) => {
    navigator.clipboard?.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2000);
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProof(true);
    setErrorMsg(null);
    try {
      const url = await uploadSaasAssetFile(file);
      setProofUrl(url);
    } catch (err: any) {
      setErrorMsg(`Receipt upload failed: ${err.message}`);
    } finally {
      setUploadingProof(false);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderPhone.trim() || !transactionRef.trim()) {
      setErrorMsg('Please enter both your sender phone number and transaction reference TXID.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const created = await SubscriptionService.submitPayment({
        tenantId: tenant.id,
        planCode: selectedPlanCode,
        billingCycle,
        amount: priceToPay,
        currency: selectedPlan.currency || 'XAF',
        paymentMethod,
        paymentReference: transactionRef.trim(),
        senderPhone: senderPhone.trim(),
        proofUrl: proofUrl || undefined,
        notes: notes.trim()
      });
      setSubmittedRecord(created);
      await loadLiveBilling();
      onPaymentSubmitted?.({
        ...created,
        tenantName: tenant.name,
        transactionRef: transactionRef.trim()
      });
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to submit payment to database.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleExportBillingCsv = () => {
    const headers = ['ID', 'Plan', 'Cycle', 'Amount', 'Currency', 'Method', 'Reference', 'Sender', 'Status', 'Created At'];
    const rows = tenantSubscriptions.map(s => [
      s.id, s.planCode, s.billingCycle, s.amount, s.currency, s.paymentMethod,
      s.paymentReference, s.senderPhone, s.status, s.createdAt
    ]);
    const csv = [
      headers.map(h => `"${h}"`).join(','),
      ...rows.map(r => r.map(c => `"${String(c ?? '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tenant.slug}-billing-ledger.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleShareSubscriptionReceipt = async (subId: number) => {
    const recipient = shareEmailForSub[subId] || tenant.email || '';
    if (!recipient.trim()) {
      setErrorMsg('Enter a valid email address to share receipt via SMTP.');
      return;
    }
    try {
      await SubscriptionService.shareReceipt(subId, recipient.trim());
      setNoticeText(`Receipt dispatched to ${recipient} via kreboya603@gmail.com`);
      setTimeout(() => setNoticeText(null), 3500);
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const seatsUsed = usageStats?.seatsUsed ?? 1;
  const activeProjects = usageStats?.activeProjects ?? 0;
  const storageUsedGb = usageStats?.storageUsedGb ?? Number(((tenant.storageUsageBytes || 0) / (1024 * 1024 * 1024)).toFixed(2));
  const aiCreditsBalance = usageStats?.aiCreditsBalance ?? tenant.aiCreditsBalance;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 border-b border-slate-800 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex flex-wrap items-center gap-2">
                Subscription & Direct Billing
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-amber-500/30 font-medium">
                  {tenant.name}
                </span>
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Live Neon usage telemetry, subscription renewal, and payment verification history.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadLiveBilling}
              disabled={loadingData}
              className="p-2 text-slate-300 hover:text-white bg-slate-800 rounded-lg"
              title="Refresh live billing & usage"
            >
              <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-8 max-h-[80vh] overflow-y-auto">
          {errorMsg && (
            <div className="bg-rose-500/10 border border-rose-500/40 text-rose-200 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {noticeText && (
            <div className="bg-emerald-500/10 border border-emerald-500/40 text-emerald-200 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{noticeText}</span>
            </div>
          )}

          {/* Real Live Resource Usage Meters from Neon PostgreSQL */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-blue-400" /> Team Seats</span>
                <span className="text-slate-200 font-medium">
                  {currentPlan.maxUsers === -1 ? `${seatsUsed} / Unlim.` : `${seatsUsed} / ${currentPlan.maxUsers}`}
                </span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-blue-500 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, currentPlan.maxUsers === -1 ? 25 : (seatsUsed / currentPlan.maxUsers) * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-emerald-400" /> Projects</span>
                <span className="text-slate-200 font-medium">
                  {currentPlan.maxProjects === -1 ? `${activeProjects} / Unlim.` : `${activeProjects} / ${currentPlan.maxProjects}`}
                </span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-emerald-500 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, currentPlan.maxProjects === -1 ? 35 : (activeProjects / currentPlan.maxProjects) * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5 text-purple-400" /> Storage</span>
                <span className="text-slate-200 font-medium">{storageUsedGb} / {currentPlan.maxStorageGb} GB</span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-purple-500 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, (storageUsedGb / Math.max(1, currentPlan.maxStorageGb)) * 100)}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-400" /> AI Credits</span>
                <span className="text-slate-200 font-medium">{aiCreditsBalance} left</span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-amber-500 h-1.5 rounded-full"
                  style={{ width: `${Math.min(100, (aiCreditsBalance / Math.max(1, currentPlan.aiCreditsMonthly)) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Billing Cycle Toggle */}
          <div className="flex items-center justify-between bg-slate-800/40 p-3 rounded-xl border border-slate-700/60">
            <span className="text-sm text-slate-300 font-medium">Select Subscription Tier</span>
            <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setBillingCycle('MONTHLY')}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${billingCycle === 'MONTHLY' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Monthly
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('ANNUAL')}
                className={`px-3 py-1.5 rounded-md font-medium flex items-center gap-1 transition-colors ${billingCycle === 'ANNUAL' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                Annual
                <span className="text-[10px] px-1 py-0.2 bg-emerald-500 text-slate-950 font-bold rounded">2 Mos Free</span>
              </button>
            </div>
          </div>

          {/* Tier Cards */}
          <div className="grid md:grid-cols-3 gap-4">
            {plans.map((p) => {
              const isSelected = selectedPlanCode === p.code;
              const isCurrent = tenant.planCode === p.code;
              const price = billingCycle === 'MONTHLY' ? p.monthlyPrice : p.annualPrice;

              return (
                <div
                  key={p.code}
                  onClick={() => setSelectedPlanCode(p.code as PlanCode)}
                  className={`cursor-pointer rounded-xl p-5 transition-all border relative flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800/90 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
                      : 'bg-slate-800/40 border-slate-700/70 hover:border-slate-600 hover:bg-slate-800/60'
                  }`}
                >
                  {p.isPopular && (
                    <span className="absolute -top-2.5 right-4 px-2.5 py-0.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-[10px] font-bold rounded-full uppercase tracking-wider">
                      Most Popular
                    </span>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-white text-base">{p.name}</h3>
                      {isCurrent && (
                        <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                          Current
                        </span>
                      )}
                    </div>
                    <div>
                      <div className="text-2xl font-extrabold text-white font-mono">
                        {SubscriptionService.formatPrice(price, p.currency || 'XAF')}
                      </div>
                      <div className="text-slate-400 text-xs">
                        per {billingCycle === 'MONTHLY' ? 'month' : 'year'}
                      </div>
                    </div>
                    <p className="text-slate-300 text-xs leading-relaxed">{p.description}</p>
                    <div className="pt-2 border-t border-slate-700/50 space-y-1.5">
                      {p.features?.slice(0, 4).map((f, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                          <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                          <span>{f}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-700/50 text-center">
                    <span className={`inline-block w-full py-1.5 text-xs font-semibold rounded-lg ${
                      isSelected ? 'bg-amber-500 text-slate-950' : 'bg-slate-700/50 text-slate-300'
                    }`}>
                      {isSelected ? 'Selected' : 'Select Plan'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Live Payment Instructions & Submission */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-6 space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  Direct Payment Receiving Accounts (Live Config)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Transfer your subscription fee directly using any verified account below, then submit your TXID.
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Total Due:</span>
                <span className="text-lg font-bold text-amber-400 font-mono">
                  {SubscriptionService.formatPrice(priceToPay, selectedPlan.currency || 'XAF')}
                </span>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="bg-slate-900/90 border border-amber-500/30 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">1. MTN MoMo</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">MoMo</span>
                </div>
                {(paymentConfig.momoNumbers || []).map((num, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800">
                    <span className="font-mono text-sm font-semibold text-white">{num}</span>
                    <button type="button" onClick={() => handleCopy(num)} className="text-xs text-amber-400">
                      {copiedNumber === num ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-slate-900/90 border border-orange-500/30 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">2. Orange Money</span>
                  <span className="text-[10px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded">OM</span>
                </div>
                {(paymentConfig.orangeMoneyNumbers || []).map((num, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800">
                    <span className="font-mono text-sm font-semibold text-white">{num}</span>
                    <button type="button" onClick={() => handleCopy(num)} className="text-xs text-orange-400">
                      {copiedNumber === num ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>

              <div className="bg-slate-900/90 border border-blue-500/30 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">3. Visa / Bank Wire</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">Bank</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <div><strong>Account:</strong> {paymentConfig.bankAccount?.accountName}</div>
                  <div><strong>Bank:</strong> {paymentConfig.bankAccount?.bankName}</div>
                  <div className="font-mono text-white text-[10px]">{paymentConfig.bankAccount?.accountNumber}</div>
                </div>
              </div>
            </div>

            {submittedRecord ? (
              <div className="bg-emerald-950/40 border border-emerald-500/40 p-5 rounded-xl text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <Clock className="w-6 h-6" />
                </div>
                <h5 className="text-base font-bold text-white">Payment Submission Saved in Neon & Transmitted via SMTP</h5>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Reference <strong className="text-amber-400 font-mono">{submittedRecord.paymentReference}</strong> has been queued for Super Admin approval. Confirmation emails will dispatch via {paymentConfig.contactEmail}.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setSubmittedRecord(null)}
                    className="px-4 py-2 bg-slate-800 text-slate-200 rounded-lg text-xs font-semibold"
                  >
                    Submit Another Payment
                  </button>
                  <button
                    type="button"
                    onClick={loadLiveBilling}
                    className="px-4 py-2 bg-amber-500 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Check Approval Status
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitPayment} className="space-y-4 pt-2">
                <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Submit Your Payment Proof for Super Admin Verification
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Payment Method Used</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodCode)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                    >
                      <option value="MTN_MOMO">MTN Mobile Money</option>
                      <option value="ORANGE_MONEY">Orange Money</option>
                      <option value="VISA_CARD">Visa / Bank Card</option>
                      <option value="BANK_WIRE">Bank Wire Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Sender Phone Number / Account *</label>
                    <input
                      type="text"
                      required
                      placeholder="+237 6XX XXX XXX"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Transaction Ref / TXID *</label>
                    <input
                      type="text"
                      required
                      placeholder="MP260113.1234.A5678"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs font-mono"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Attach Transfer Proof / Screenshot</label>
                    <label className="flex items-center justify-center gap-2 px-3 py-2 bg-slate-900 hover:bg-slate-800 border border-dashed border-slate-700 rounded-lg text-xs text-slate-300 cursor-pointer">
                      <UploadCloud className="w-4 h-4 text-amber-400" />
                      <span>{uploadingProof ? 'Uploading...' : proofUrl ? 'Receipt Uploaded ✓' : 'Upload Image or PDF'}</span>
                      <input type="file" accept="image/*,.pdf" onChange={handleProofUpload} className="hidden" />
                    </label>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Additional Notes</label>
                    <input
                      type="text"
                      placeholder="e.g. Subscription renewal"
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                    />
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting || uploadingProof}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSubmitting ? 'Submitting to Neon...' : 'Submit Payment & Request Activation'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Live Subscription & Billing Ledger */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-sm font-bold text-white">Workspace Billing History ({tenantSubscriptions.length})</h4>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportBillingCsv}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" /> Export CSV
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5 text-amber-400" /> Print Ledger
                </button>
              </div>
            </div>

            {tenantSubscriptions.length === 0 ? (
              <p className="text-xs text-slate-400">No subscription transactions submitted for this workspace yet.</p>
            ) : (
              <div className="space-y-2">
                {tenantSubscriptions.map((s) => (
                  <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
                    <div>
                      <div className="font-bold text-white flex items-center gap-2">
                        <span>{s.planCode} ({s.billingCycle})</span>
                        <span className="font-mono text-amber-400">{s.paymentReference}</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          s.status === 'ACTIVE' ? 'bg-emerald-500/20 text-emerald-300' :
                          s.status === 'PENDING_CONFIRMATION' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-rose-500/20 text-rose-300'
                        }`}>
                          {s.status}
                        </span>
                      </div>
                      <div className="text-slate-400 mt-0.5">
                        {SubscriptionService.formatPrice(s.amount, s.currency)} via {s.paymentMethod} &bull; {new Date(s.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="email"
                        placeholder={tenant.email || 'Email receipt...'}
                        value={shareEmailForSub[s.id] ?? ''}
                        onChange={(e) => setShareEmailForSub(prev => ({ ...prev, [s.id]: e.target.value }))}
                        className="bg-slate-950 border border-slate-700 text-white rounded-lg px-2.5 py-1 text-xs w-40"
                      />
                      <button
                        type="button"
                        onClick={() => handleShareSubscriptionReceipt(s.id)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-amber-400 rounded-lg font-semibold flex items-center gap-1"
                      >
                        <Share2 className="w-3 h-3" /> Email Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
