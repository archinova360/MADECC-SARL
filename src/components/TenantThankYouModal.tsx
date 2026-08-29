import React from 'react';
import { CheckCircle, Zap, Shield, Rocket, ArrowRight, X, Sparkles, Building2 } from 'lucide-react';
import { Tenant, SaaSPlan } from '../types.ts';
import { SubscriptionService } from '../services/subscriptionService.ts';

interface TenantThankYouModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenant: Tenant;
  planCode?: string;
  confirmedBy?: string;
  transactionRef?: string;
  onGoToDashboard?: () => void;
}

export const TenantThankYouModal: React.FC<TenantThankYouModalProps> = ({
  isOpen,
  onClose,
  tenant,
  planCode = 'PROFESSIONAL',
  confirmedBy = 'MADECC Super Admin',
  transactionRef,
  onGoToDashboard
}) => {
  if (!isOpen) return null;

  const plan: SaaSPlan = SubscriptionService.getPlanByCode(planCode);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border border-amber-500/40 rounded-2xl shadow-2xl shadow-amber-500/10 overflow-hidden">
        {/* Glow Header */}
        <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-amber-500 via-emerald-500 to-cyan-500" />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 text-center space-y-6">
          {/* Animated Success Badge */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-500/10 border-2 border-emerald-500/40 shadow-lg shadow-emerald-500/20 mb-2">
            <CheckCircle className="w-10 h-10 text-emerald-400 animate-bounce" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-semibold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              Payment Confirmed & Verified
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-white font-serif">
              Welcome to the Platform, {tenant.name}!
            </h2>
            <p className="text-slate-300 text-sm sm:text-base max-w-lg mx-auto">
              Your subscription for <strong className="text-amber-400 font-semibold">{plan.name}</strong> has been officially confirmed and your workspace is now fully activated.
            </p>
          </div>

          {/* Plan Receipt Card */}
          <div className="bg-slate-800/50 border border-slate-700/60 rounded-xl p-5 text-left grid sm:grid-cols-2 gap-4 text-xs sm:text-sm">
            <div>
              <span className="text-slate-400 block text-xs">Organization</span>
              <span className="text-white font-medium flex items-center gap-1.5 mt-0.5">
                <Building2 className="w-3.5 h-3.5 text-amber-400" />
                {tenant.name}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs">Plan Tier</span>
              <span className="text-emerald-400 font-semibold mt-0.5 block">
                {plan.name} ({SubscriptionService.formatPrice(plan.monthlyPrice)} / month)
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs">Verification Authority</span>
              <span className="text-slate-200 mt-0.5 block">{confirmedBy}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-xs">Transaction Reference</span>
              <span className="text-slate-200 font-mono mt-0.5 block">{transactionRef || 'TXN-DIRECT-VERIFIED'}</span>
            </div>
          </div>

          {/* Unlocked Entitlements */}
          <div className="text-left space-y-3">
            <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              Unlocked Workspace Features
            </h4>
            <div className="grid sm:grid-cols-2 gap-2 text-xs text-slate-300">
              {plan.features?.map((feature, i) => (
                <div key={i} className="flex items-center gap-2 bg-slate-900/60 p-2.5 rounded-lg border border-slate-800">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-4">
            <button
              onClick={onGoToDashboard || onClose}
              className="w-full py-3.5 px-6 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2 transition-all transform hover:scale-[1.01]"
            >
              <Rocket className="w-5 h-5" />
              Launch Construction Workspace
              <ArrowRight className="w-4 h-4 ml-1" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
