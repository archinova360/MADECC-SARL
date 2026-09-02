import React, { useState } from 'react';
import { 
  X, Check, Shield, Zap, CreditCard, Phone, 
  Send, AlertCircle, Sparkles, Building2, HardDrive, 
  Layers, Users, ArrowUpRight, Copy, CheckCircle2, Clock
} from 'lucide-react';
import { Tenant, SaaSPlan, PlanCode, PaymentMethodCode } from '../types.ts';
import { SubscriptionService, DIRECT_PAYMENT_CONFIG } from '../services/subscriptionService.ts';

interface TenantBillingModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant;
  onPaymentSubmitted?: (details: any) => void;
  onShowThankYou?: (planCode: string) => void;
}

export const TenantBillingModal: React.FC<TenantBillingModalProps> = ({
  isOpen,
  onClose,
  tenant,
  onPaymentSubmitted,
  onShowThankYou
}) => {
  const plans = SubscriptionService.getPlans();
  const currentPlan = SubscriptionService.getPlanByCode(tenant.planCode);

  const [selectedPlanCode, setSelectedPlanCode] = useState<PlanCode>(tenant.planCode);
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethodCode>('MTN_MOMO');
  const [senderPhone, setSenderPhone] = useState('');
  const [transactionRef, setTransactionRef] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedStatus, setSubmittedStatus] = useState<boolean>(false);
  const [copiedNumber, setCopiedNumber] = useState<string | null>(null);

  if (!isOpen) return null;

  const selectedPlan = SubscriptionService.getPlanByCode(selectedPlanCode);
  const priceToPay = billingCycle === 'MONTHLY' ? selectedPlan.monthlyPrice : selectedPlan.annualPrice;

  const handleCopy = (num: string) => {
    navigator.clipboard.writeText(num);
    setCopiedNumber(num);
    setTimeout(() => setCopiedNumber(null), 2500);
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!senderPhone.trim() || !transactionRef.trim()) {
      alert('Please enter your sender phone number and transaction reference ID.');
      return;
    }

    setIsSubmitting(true);
    try {
      await SubscriptionService.submitPayment({
        tenantId: tenant.id,
        planCode: selectedPlanCode,
        billingCycle,
        amount: priceToPay,
        currency: 'XAF',
        paymentMethod,
        paymentReference: transactionRef,
        senderPhone,
        notes
      });

      setIsSubmitting(false);
      setSubmittedStatus(true);
      if (onPaymentSubmitted) {
        onPaymentSubmitted({
          tenantId: tenant.id,
          tenantName: tenant.name,
          planCode: selectedPlanCode,
          billingCycle,
          amount: priceToPay,
          currency: 'XAF',
          paymentMethod,
          senderPhone,
          transactionRef,
          notes,
          submittedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      setIsSubmitting(false);
      setSubmittedStatus(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Top Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-6 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                Subscription & Direct Billing
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-slate-800 text-amber-400 border border-amber-500/30 font-medium">
                  {tenant.name}
                </span>
              </h2>
              <p className="text-slate-400 text-xs mt-0.5">
                Manage your construction cloud tier, view real-time resource meters, and submit manual direct payments.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800 hover:bg-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8 max-h-[80vh] overflow-y-auto">
          {/* Current Resource Usage Meters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-blue-400" /> Team Seats</span>
                <span className="text-slate-200 font-medium">{currentPlan.maxUsers === -1 ? 'Unlimited' : `3 / ${currentPlan.maxUsers}`}</span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: currentPlan.maxUsers === -1 ? '20%' : `${(3 / currentPlan.maxUsers) * 100}%` }} />
              </div>
            </div>

            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-emerald-400" /> Active Projects</span>
                <span className="text-slate-200 font-medium">{currentPlan.maxProjects === -1 ? 'Unlimited' : `5 / ${currentPlan.maxProjects}`}</span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: currentPlan.maxProjects === -1 ? '25%' : `${(5 / currentPlan.maxProjects) * 100}%` }} />
              </div>
            </div>

            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="flex items-center gap-1.5"><HardDrive className="w-3.5 h-3.5 text-purple-400" /> Cloud Storage</span>
                <span className="text-slate-200 font-medium">3.2 GB / {currentPlan.maxStorageGb} GB</span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                <div className="bg-purple-500 h-1.5 rounded-full" style={{ width: `${(3.2 / currentPlan.maxStorageGb) * 100}%` }} />
              </div>
            </div>

            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/60 space-y-1.5">
              <div className="flex items-center justify-between text-slate-400 text-xs">
                <span className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-400" /> AI Takeoff Credits</span>
                <span className="text-slate-200 font-medium">380 / {currentPlan.aiCreditsMonthly}</span>
              </div>
              <div className="w-full bg-slate-700/50 rounded-full h-1.5 overflow-hidden">
                <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${(380 / currentPlan.aiCreditsMonthly) * 100}%` }} />
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
                  onClick={() => setSelectedPlanCode(p.code)}
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
                        {SubscriptionService.formatPrice(price)}
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

          {/* Payment Instructions & Submission Section */}
          <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-amber-400" />
                  Direct Payment Instructions (No Integration Required)
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Send the subscription amount directly to any of our official verified payment accounts below:
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Total Due:</span>
                <span className="text-lg font-bold text-amber-400 font-mono">
                  {SubscriptionService.formatPrice(priceToPay)}
                </span>
              </div>
            </div>

            {/* Official Numbers Grid */}
            <div className="grid md:grid-cols-3 gap-4">
              {/* MTN MoMo */}
              <div className="bg-slate-900/90 border border-amber-500/30 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 uppercase tracking-wider">1. MTN Mobile Money</span>
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">MoMo</span>
                </div>
                {DIRECT_PAYMENT_CONFIG.momoNumbers.map((num, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800">
                    <span className="font-mono text-sm font-semibold text-white">{num}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(num)}
                      className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                    >
                      {copiedNumber === num ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>

              {/* Orange Money */}
              <div className="bg-slate-900/90 border border-orange-500/30 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-orange-400 uppercase tracking-wider">2. Orange Money</span>
                  <span className="text-[10px] bg-orange-500/20 text-orange-300 px-1.5 py-0.5 rounded">OM</span>
                </div>
                {DIRECT_PAYMENT_CONFIG.orangeMoneyNumbers.map((num, i) => (
                  <div key={i} className="flex items-center justify-between bg-slate-950 px-2.5 py-1.5 rounded border border-slate-800">
                    <span className="font-mono text-sm font-semibold text-white">{num}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(num)}
                      className="text-xs text-orange-400 hover:text-orange-300 flex items-center gap-1"
                    >
                      {copiedNumber === num ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                ))}
              </div>

              {/* Visa & Bank Wire */}
              <div className="bg-slate-900/90 border border-blue-500/30 p-4 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">3. Visa / Bank Wire</span>
                  <span className="text-[10px] bg-blue-500/20 text-blue-300 px-1.5 py-0.5 rounded">Bank</span>
                </div>
                <div className="bg-slate-950 p-2.5 rounded border border-slate-800 text-[11px] text-slate-300 space-y-1">
                  <div><strong>Account:</strong> {DIRECT_PAYMENT_CONFIG.bankAccount.accountName}</div>
                  <div><strong>Bank:</strong> {DIRECT_PAYMENT_CONFIG.bankAccount.bankName}</div>
                  <div className="font-mono text-white text-[10px]">{DIRECT_PAYMENT_CONFIG.bankAccount.accountNumber}</div>
                </div>
              </div>
            </div>

            {/* Submission Form */}
            {submittedStatus ? (
              <div className="bg-emerald-950/40 border border-emerald-500/40 p-5 rounded-xl text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                  <Clock className="w-6 h-6 animate-pulse" />
                </div>
                <h5 className="text-base font-bold text-white">Payment Submission Received!</h5>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  Your reference <strong className="text-amber-400 font-mono">{transactionRef}</strong> has been transmitted to the Super Admin. As soon as payment is confirmed, your service will automatically activate with the Thank You confirmation.
                </p>
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (onShowThankYou) onShowThankYou(selectedPlanCode);
                    }}
                    className="text-xs text-amber-400 hover:text-amber-300 underline font-medium"
                  >
                    (Simulate Instant Super Admin OK / Confirmation)
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmitPayment} className="space-y-4 pt-2">
                <div className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Step 2: Submit Your Payment Proof for Activation
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Payment Method Used</label>
                    <select
                      value={paymentMethod}
                      onChange={(e) => setPaymentMethod(e.target.value as PaymentMethodCode)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500"
                    >
                      <option value="MTN_MOMO">MTN Mobile Money</option>
                      <option value="ORANGE_MONEY">Orange Money</option>
                      <option value="VISA_CARD">Visa / Bank Card</option>
                      <option value="BANK_WIRE">Bank Wire Transfer</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Sender Phone Number / Account</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. +237 6XX XXX XXX"
                      value={senderPhone}
                      onChange={(e) => setSenderPhone(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Transaction Ref / TXID</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. MP240828.1234.A5678"
                      value={transactionRef}
                      onChange={(e) => setTransactionRef(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Additional Notes (Optional)</label>
                  <input
                    type="text"
                    placeholder="e.g. Subscription for Bamenda Headquarters"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 text-white rounded-lg px-3 py-2 text-xs focus:ring-1 focus:ring-amber-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    {isSubmitting ? 'Submitting Details...' : 'Submit Payment & Request Activation'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
