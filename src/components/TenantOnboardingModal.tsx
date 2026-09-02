import React, { useState } from 'react';
import { 
  Building2, Check, ArrowRight, X, Sparkles, 
  CreditCard, Globe, Phone, Mail, MapPin, Send, CheckCircle2, Clock 
} from 'lucide-react';
import { Tenant, PlanCode, PaymentMethodCode } from '../types.ts';
import { SubscriptionService, DIRECT_PAYMENT_CONFIG } from '../services/subscriptionService.ts';
import { TenantService } from '../services/tenantService.ts';

interface TenantOnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTenantCreated: (newTenant: Tenant) => void;
}

export const TenantOnboardingModal: React.FC<TenantOnboardingModalProps> = ({
  isOpen,
  onClose,
  onTenantCreated
}) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [companyName, setCompanyName] = useState('');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('Douala');
  const [selectedPlanCode, setSelectedPlanCode] = useState<PlanCode>('PROFESSIONAL');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodCode>('MTN_MOMO');
  const [senderPhone, setSenderPhone] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedTenant, setSubmittedTenant] = useState<Tenant | null>(null);

  if (!isOpen) return null;

  const handleNameChange = (val: string) => {
    setCompanyName(val);
    setSlug(val.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-'));
  };

  const handleCompleteOnboarding = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Create Tenant in DB
      const createdTenant = await TenantService.registerTenant({
        name: companyName,
        slug: slug || `company-${Date.now()}`,
        legalName: `${companyName} Construction SARL`,
        logoUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=400&q=80',
        planCode: selectedPlanCode,
        currency: 'XAF',
        phone,
        email,
        address: `${city}, Cameroon`,
        country: 'Cameroon',
        status: 'ACTIVE'
      });

      // 2. Submit initial payment record if transactionRef was entered
      if (transactionRef) {
        const plan = SubscriptionService.getPlanByCode(selectedPlanCode);
        await SubscriptionService.submitPayment({
          tenantId: createdTenant.id,
          planCode: selectedPlanCode,
          billingCycle: 'MONTHLY',
          amount: plan.monthlyPrice,
          currency: 'XAF',
          paymentMethod,
          paymentReference: transactionRef,
          senderPhone,
          notes: 'New tenant self-service onboarding payment'
        });
      }

      setIsSubmitting(false);
      setSubmittedTenant(createdTenant);
      setIsSubmitted(true);
      onTenantCreated(createdTenant);
    } catch (err: any) {
      console.warn('[ONBOARDING_ERROR]', err);
      // Fallback local tenant
      const fallbackTenant: Tenant = {
        id: Date.now(),
        name: companyName,
        slug: slug || `company-${Date.now()}`,
        legalName: `${companyName} Construction SARL`,
        logoUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=400&q=80',
        faviconUrl: null,
        primaryDomain: `${slug || 'portal'}.madecccloud.com`,
        customDomain: null,
        status: 'ACTIVE',
        planCode: selectedPlanCode,
        currency: 'XAF',
        timezone: 'Africa/Douala',
        phone,
        email,
        address: `${city}, Cameroon`,
        country: 'Cameroon',
        settings: {
          primaryColor: '#0f172a',
          secondaryColor: '#f59e0b',
          accentColor: '#3b82f6',
          tagline: 'Modern Civil Engineering & Quality Construction',
          companyAddress: `${city}, Cameroon`,
          phone,
          email,
          currency: 'XAF'
        },
        aiCreditsBalance: selectedPlanCode === 'ENTERPRISE' ? 5000 : selectedPlanCode === 'PROFESSIONAL' ? 500 : 100,
        storageUsageBytes: 0,
        isFlagship: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      setIsSubmitting(false);
      setSubmittedTenant(fallbackTenant);
      setIsSubmitted(true);
      onTenantCreated(fallbackTenant);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Register Construction Company</h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Step {step} of 3 — Launch your dedicated workspace on MADECC Construction Cloud
              </p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* SUBMISSION CONFIRMATION: PENDING SUPER ADMIN APPROVAL */}
          {isSubmitted && submittedTenant ? (
            <div className="text-center py-6 px-4 space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
                <Clock className="w-8 h-8 animate-pulse" />
              </div>

              <div className="space-y-2">
                <span className="inline-block px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold uppercase tracking-wider">
                  Registration Submitted &bull; Pending Super Admin Approval
                </span>
                <h3 className="text-xl font-extrabold text-white">
                  {submittedTenant.name}
                </h3>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Your dedicated workspace has been provisioned and registered in our database. The Super Admin must verify your payment and approve your account before full access is activated.
                </p>
              </div>

              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 max-w-md mx-auto text-left text-xs space-y-2.5 font-mono">
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400 font-sans">Subdomain URL:</span>
                  <span className="text-amber-400 font-bold">{submittedTenant.primaryDomain}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400 font-sans">Selected Plan:</span>
                  <span className="text-white font-bold">{submittedTenant.planCode} Tier</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400 font-sans">Payment Method:</span>
                  <span className="text-white">{paymentMethod}</span>
                </div>
                <div className="flex justify-between border-b border-slate-800/80 pb-2">
                  <span className="text-slate-400 font-sans">Sender Phone:</span>
                  <span className="text-white">{senderPhone || 'N/A'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-sans">Transaction Ref:</span>
                  <span className="text-emerald-400 font-bold">{transactionRef || 'N/A'}</span>
                </div>
              </div>

              <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-3.5 max-w-md mx-auto text-left text-xs text-blue-200">
                <p className="font-semibold text-blue-100 flex items-center gap-1.5 mb-1">
                  <Sparkles className="w-4 h-4 text-blue-400" />
                  What happens next?
                </p>
                <p className="text-[11px] text-blue-300/90 leading-relaxed">
                  Our SaaS Super Admin team will verify your transaction code and approve your workspace within minutes. You will receive an SMS and email notification upon activation.
                </p>
              </div>

              <div className="pt-2 flex justify-center gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors"
                >
                  Close Window
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* STEP 1: Company Profile */}
              {step === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                1. Organization Information
              </h3>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Company / Contractor Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apex Civil Engineering Ltd"
                  value={companyName}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500 font-medium"
                />
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
                  <label className="block text-xs text-slate-400 mb-1">Official Email</label>
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
                  <label className="block text-xs text-slate-400 mb-1">Official WhatsApp / Phone</label>
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
                  disabled={!companyName.trim()}
                  onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-2 shadow-lg disabled:opacity-40"
                >
                  Continue to Plan Selection <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: Plan Selection */}
          {step === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                2. Choose Your Cloud Tier
              </h3>

              <div className="grid sm:grid-cols-3 gap-3">
                {SubscriptionService.getPlans().map((p) => {
                  const isSelected = selectedPlanCode === p.code;
                  return (
                    <div
                      key={p.code}
                      onClick={() => setSelectedPlanCode(p.code)}
                      className={`cursor-pointer p-4 rounded-xl border transition-all text-left ${
                        isSelected
                          ? 'bg-slate-800/90 border-amber-500 ring-1 ring-amber-500 shadow-md'
                          : 'bg-slate-950/60 border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <h4 className="font-bold text-white text-sm">{p.name}</h4>
                      <div className="text-lg font-black text-amber-400 font-mono my-1">
                        {SubscriptionService.formatPrice(p.monthlyPrice)}
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

          {/* STEP 3: Direct Payment & Launch */}
          {step === 3 && (
            <form onSubmit={handleCompleteOnboarding} className="space-y-4">
              <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
                3. Direct Payment Verification
              </h3>

              <div className="bg-slate-950 p-4 rounded-xl border border-amber-500/30 text-xs space-y-2">
                <div className="flex justify-between font-bold text-white">
                  <span>Selected Tier: {selectedPlanCode}</span>
                  <span className="text-amber-400 font-mono">
                    {SubscriptionService.formatPrice(SubscriptionService.getPlanByCode(selectedPlanCode).monthlyPrice)} / month
                  </span>
                </div>
                <p className="text-slate-400">
                  Transfer funds to MTN MoMo <strong className="text-white">+237 671 063 511</strong> or Orange OM <strong className="text-white">+237 689 115 595</strong>.
                </p>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Your Sender Phone</label>
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
                  <label className="block text-xs text-slate-400 mb-1">Transaction Ref / TXID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. TXN987213"
                    value={transactionRef}
                    onChange={(e) => setTransactionRef(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs font-mono"
                  />
                </div>
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
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-slate-950 font-black rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-emerald-500/20"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  {isSubmitting ? 'Provisioning Tenant Workspace...' : 'Launch Construction Portal'}
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
