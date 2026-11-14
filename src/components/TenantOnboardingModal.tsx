import React, { useState, useEffect } from 'react';
import {
  Building2, ArrowRight, X, Sparkles, CheckCircle2, Clock,
  UploadCloud, AlertCircle, Download, Copy, Check
} from 'lucide-react';
import { Tenant, PlanCode, PaymentMethodCode, SaaSPlan, DirectPaymentConfig } from '../types.ts';
import { SubscriptionService, DIRECT_PAYMENT_CONFIG, DEFAULT_PLANS } from '../services/subscriptionService.ts';
import { TenantService, uploadSaasAssetFile } from '../services/tenantService.ts';

interface TenantOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTenantCreated: (newTenant: Tenant) => void;
  initialPlanCode?: PlanCode;
  initialBillingCycle?: 'MONTHLY' | 'ANNUAL';
}

export const TenantOnboardingModal: React.FC<TenantOnboardingModalProps> = ({
  isOpen,
  onClose,
  onTenantCreated,
  initialPlanCode = 'PROFESSIONAL',
  initialBillingCycle = 'MONTHLY'
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [companyName, setCompanyName] = useState('');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Douala');
  const [logoUrl, setLogoUrl] = useState('');
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const [plans, setPlans] = useState<SaaSPlan[]>(DEFAULT_PLANS);
  const [paymentConfig, setPaymentConfig] = useState<DirectPaymentConfig>(DIRECT_PAYMENT_CONFIG);
  const [selectedPlanCode, setSelectedPlanCode] = useState<PlanCode>(initialPlanCode);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>(initialBillingCycle);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodCode>('MTN_MOMO');
  const [senderPhone, setSenderPhone] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [proofUrl, setProofUrl] = useState('');
  const [uploadingProof, setUploadingProof] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedTenant, setSubmittedTenant] = useState<Tenant | null>(null);
  const [copiedSlug, setCopiedSlug] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setSelectedPlanCode(initialPlanCode);
    setBillingCycle(initialBillingCycle);
    setSubmitError(null);
    Promise.all([
      SubscriptionService.fetchPlansFromApi({ includeUnpublished: false }),
      SubscriptionService.fetchPaymentConfigFromApi()
    ])
      .then(([livePlans, liveCfg]) => {
        if (Array.isArray(livePlans) && livePlans.length > 0) setPlans(livePlans);
        if (liveCfg) setPaymentConfig(liveCfg);
      })
      .catch(() => {});
  }, [isOpen, initialPlanCode, initialBillingCycle]);

  if (!isOpen) return null;

  const selectedPlan = plans.find(p => p.code.toUpperCase() === selectedPlanCode.toUpperCase()) || plans[0] || DEFAULT_PLANS[0];
  const amountDue = billingCycle === 'MONTHLY' ? selectedPlan.monthlyPrice : selectedPlan.annualPrice;

  const handleNameChange = (val: string) => {
    setCompanyName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, ''));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingLogo(true);
    setSubmitError(null);
    try {
      const url = await uploadSaasAssetFile(file);
      setLogoUrl(url);
    } catch (err: any) {
      setSubmitError(`Logo upload failed: ${err.message}`);
    } finally {
      setUploadingLogo(false);
    }
  };

  const handleProofUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingProof(true);
    setSubmitError(null);
    try {
      const url = await uploadSaasAssetFile(file);
      setProofUrl(url);
    } catch (err: any) {
      setSubmitError(`Receipt upload failed: ${err.message}`);
    } finally {
      setUploadingProof(false);
    }
  };

  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // 1. Register real Tenant Workspace in Neon PostgreSQL (pending payment approval)
      const createdTenant = await TenantService.registerTenant({
        name: companyName.trim(),
        slug: slug || `company-${Date.now()}`,
        legalName: `${companyName.trim()} Construction SARL`,
        logoUrl: logoUrl || '/logo.png',
        planCode: selectedPlanCode,
        currency: selectedPlan.currency || 'XAF',
        phone: phone.trim(),
        email: email.trim(),
        address: `${city}, Cameroon`,
        country: 'Cameroon',
        status: 'PENDING_APPROVAL',
        publishStatus: 'DRAFT',
        sendWelcomeEmail: true
      });

      // 2. Submit real subscription payment proof + dispatch SMTP confirmation alerts via kreboya603@gmail.com
      await SubscriptionService.submitPayment({
        tenantId: createdTenant.id,
        planCode: selectedPlanCode,
        billingCycle,
        amount: amountDue,
        currency: selectedPlan.currency || 'XAF',
        paymentMethod,
        paymentReference: transactionRef.trim(),
        senderPhone: senderPhone.trim(),
        proofUrl: proofUrl || undefined,
        notes: `New tenant self-service onboarding (${city})`
      });

      setSubmittedTenant(createdTenant);
      setIsSubmitted(true);
    } catch (err: any) {
      setSubmitError(err?.message || 'Unable to provision workspace in database. Please verify connection and retry.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadSummary = () => {
    if (!submittedTenant) return;
    const bundle = {
      platform: 'MADECC Construction Cloud',
      submittedAt: new Date().toISOString(),
      tenant: submittedTenant,
      subscription: {
        planCode: selectedPlanCode,
        billingCycle,
        amount: amountDue,
        currency: selectedPlan.currency || 'XAF',
        paymentMethod,
        senderPhone,
        transactionRef,
        proofUrl: proofUrl || null,
        status: 'PENDING_CONFIRMATION'
      }
    };
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${submittedTenant.slug}-onboarding-receipt.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Register Construction Company</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                {isSubmitted
                  ? 'Provisioned in Neon Database & Transmitted via SMTP'
                  : `Step ${step} of 3 — Launch your dedicated workspace on MADECC Construction Cloud`}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {submitError && (
            <div className="mb-4 bg-rose-500/10 border border-rose-500/40 text-rose-200 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {isSubmitted && submittedTenant ? (
            <div className="text-center py-4 px-2 space-y-5">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
                <Clock className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  Workspace Created &bull; Payment Pending Super Admin Confirmation
                </span>
                <h3 className="text-xl font-extrabold text-white">{submittedTenant.name}</h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Your organization record and payment submission have been saved in Neon PostgreSQL and dispatched to the Super Admin via {paymentConfig.contactEmail}.
                </p>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 max-w-md mx-auto text-left text-xs space-y-2.5 font-mono">
                <div className="flex justify-between items-center border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400 font-sans">Workspace URL:</span>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(submittedTenant.primaryDomain || '');
                      setCopiedSlug(true);
                      setTimeout(() => setCopiedSlug(false), 2000);
                    }}
                    className="text-amber-400 font-bold flex items-center gap-1"
                  >
                    {submittedTenant.primaryDomain}
                    {copiedSlug ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400 font-sans">Plan & Cycle:</span>
                  <span className="text-white font-bold">{selectedPlanCode} ({billingCycle})</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400 font-sans">Amount Submitted:</span>
                  <span className="text-emerald-400 font-bold">{SubscriptionService.formatPrice(amountDue, selectedPlan.currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Transaction Ref:</span>
                  <span className="text-white font-bold">{transactionRef}</span>
                </div>
              </div>

              <div className="pt-2 flex flex-wrap justify-center gap-3">
                <button
                  type="button"
                  onClick={handleDownloadSummary}
                  className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-xl text-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5 text-emerald-400" />
                  Download Summary JSON
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onTenantCreated(submittedTenant);
                    onClose();
                  }}
                  className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5"
                >
                  Open Workspace Preview <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {step === 1 && (
                <div className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                    1. Organization Information & Brand Logo
                  </h3>

                  <div className="grid sm:grid-cols-3 gap-4 items-center">
                    <div className="sm:col-span-2">
                      <label className="block text-xs text-slate-400 mb-1">Company / Contractor Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Apex Civil Engineering Ltd"
                        value={companyName}
                        onChange={(e) => handleNameChange(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Upload Company Logo</label>
                      <label className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs text-amber-400 font-semibold cursor-pointer">
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{uploadingLogo ? 'Uploading...' : logoUrl ? 'Uploaded ✓' : 'Choose Image'}</span>
                        <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
                      </label>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Workspace Subdomain</label>
                      <div className="flex items-center">
                        <input
                          type="text"
                          placeholder="apex-civil"
                          value={slug}
                          onChange={(e) => setSlug(e.target.value)}
                          className="w-full bg-slate-950 border border-slate-700 text-white rounded-l-lg px-3 py-2 text-xs font-mono"
                        />
                        <span className="bg-slate-800 text-slate-400 border border-l-0 border-slate-700 px-2 py-2 rounded-r-lg text-xs font-mono">
                          .madecccloud.com
                        </span>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Headquarters City</label>
                      <select
                        value={city}
                        onChange={(e) => setCity(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                      >
                        <option value="Douala">Douala, Cameroon</option>
                        <option value="Yaoundé">Yaoundé, Cameroon</option>
                        <option value="Bamenda">Bamenda, Cameroon</option>
                        <option value="Bafoussam">Bafoussam, Cameroon</option>
                        <option value="Limbe">Limbe / Buea, Cameroon</option>
                        <option value="Garoua">Garoua / Maroua, Cameroon</option>
                        <option value="Other">International / Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Official Email *</label>
                      <input
                        type="email"
                        required
                        placeholder="contact@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Official WhatsApp / Phone *</label>
                      <input
                        type="text"
                        required
                        placeholder="+237 6XX XXX XXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex justify-end">
                    <button
                      type="button"
                      disabled={!companyName.trim() || !email.trim()}
                      onClick={() => setStep(2)}
                      className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-2 shadow-lg disabled:opacity-40"
                    >
                      Continue to Plan Selection <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                      2. Choose Your Cloud Tier
                    </h3>
                    <div className="inline-flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs">
                      <button
                        type="button"
                        onClick={() => setBillingCycle('MONTHLY')}
                        className={`px-3 py-1 rounded-md font-bold ${billingCycle === 'MONTHLY' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
                      >
                        Monthly
                      </button>
                      <button
                        type="button"
                        onClick={() => setBillingCycle('ANNUAL')}
                        className={`px-3 py-1 rounded-md font-bold ${billingCycle === 'ANNUAL' ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
                      >
                        Annual (2 Mos Free)
                      </button>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    {plans.map((p) => {
                      const isSelected = selectedPlanCode === p.code;
                      const price = billingCycle === 'MONTHLY' ? p.monthlyPrice : p.annualPrice;
                      return (
                        <div
                          key={p.code}
                          onClick={() => setSelectedPlanCode(p.code as PlanCode)}
                          className={`cursor-pointer p-4 rounded-xl border transition-all text-left ${
                            isSelected
                              ? 'bg-slate-800/90 border-amber-500 ring-1 ring-amber-500 shadow-md'
                              : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                          }`}
                        >
                          <h4 className="font-bold text-white text-sm">{p.name}</h4>
                          <div className="text-lg font-black text-amber-400 font-mono my-1">
                            {SubscriptionService.formatPrice(price, p.currency || 'XAF')}
                          </div>
                          <p className="text-[11px] text-slate-400 leading-snug">{p.description}</p>
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-2"
                    >
                      Payment & Activation <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {step === 3 && (
                <form onSubmit={handleCompleteOnboarding} className="space-y-4">
                  <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                    3. Direct Payment Verification
                  </h3>

                  <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30 text-xs space-y-2">
                    <div className="flex justify-between font-bold text-white">
                      <span>Selected Tier: {selectedPlan.name} ({billingCycle})</span>
                      <span className="text-amber-400 font-mono">
                        {SubscriptionService.formatPrice(amountDue, selectedPlan.currency || 'XAF')}
                      </span>
                    </div>
                    <p className="text-slate-400">
                      MTN MoMo: <strong className="text-white">{(paymentConfig.momoNumbers || []).join(' / ')}</strong> &bull;
                      Orange Money: <strong className="text-white">{(paymentConfig.orangeMoneyNumbers || []).join(' / ')}</strong>
                    </p>
                    <p className="text-slate-400">
                      Bank Wire: <strong className="text-white">{paymentConfig.bankAccount?.bankName}</strong> ({paymentConfig.bankAccount?.accountNumber})
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Payment Method</label>
                      <select
                        value={paymentMethod}
                        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodCode)}
                        className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                      >
                        <option value="MTN_MOMO">MTN Mobile Money</option>
                        <option value="ORANGE_MONEY">Orange Money</option>
                        <option value="VISA_CARD">Visa / Bank Card</option>
                        <option value="BANK_WIRE">Bank Wire Transfer</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Your Sender Phone *</label>
                      <input
                        type="text"
                        required
                        placeholder="+237 6XX XXX XXX"
                        value={senderPhone}
                        onChange={(e) => setSenderPhone(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Transaction Ref / TXID *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. MP260113.TXID"
                        value={transactionRef}
                        onChange={(e) => setTransactionRef(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs font-mono"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Upload Payment Receipt Screenshot / PDF (Optional)</label>
                    <label className="flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-950 hover:bg-slate-800 border border-dashed border-slate-700 rounded-xl text-xs text-slate-300 cursor-pointer">
                      <UploadCloud className="w-4 h-4 text-amber-400" />
                      <span>
                        {uploadingProof
                          ? 'Uploading receipt to Cloud Storage...'
                          : proofUrl
                          ? 'Receipt proof uploaded cleanly ✓'
                          : 'Attach MoMo / Bank Transfer Slip'}
                      </span>
                      <input type="file" accept="image/*,.pdf" onChange={handleProofUpload} className="hidden" />
                    </label>
                  </div>

                  <div className="pt-4 flex justify-between">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="px-4 py-2 bg-slate-800 text-slate-300 rounded-lg text-xs"
                    >
                      Back
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting || uploadingLogo || uploadingProof}
                      className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20 disabled:opacity-50"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      {isSubmitting ? 'Saving Workspace in Neon...' : 'Launch Construction Portal'}
                    </button>
                  </div>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};
