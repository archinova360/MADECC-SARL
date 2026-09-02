import React, { useState } from 'react';
import { 
  Building2, Shield, Zap, Sparkles, Check, ArrowRight, 
  Layers, HardDrive, Cpu, Globe, CreditCard, ChevronRight, 
  CheckCircle2, Compass, BarChart3, Users, FileCheck, Phone
} from 'lucide-react';
import { Tenant, SaaSPlan } from '../types.ts';
import { SubscriptionService, DEFAULT_PLANS, DIRECT_PAYMENT_CONFIG } from '../services/subscriptionService.ts';
import { TenantService } from '../services/tenantService.ts';

interface PublicSaaSMarketingProps {
  onEnterFlagshipTenant: () => void;
  onOpenOnboarding: () => void;
  onOpenSuperAdmin: () => void;
}

export const PublicSaaSMarketing: React.FC<PublicSaaSMarketingProps> = ({
  onEnterFlagshipTenant,
  onOpenOnboarding,
  onOpenSuperAdmin
}) => {
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'ANNUAL'>('MONTHLY');
  const plans = SubscriptionService.getPlans();
  const flagshipTenant = TenantService.getActiveTenant();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Announcement Bar */}
      <div className="bg-gradient-to-r from-amber-500/20 via-amber-500/10 to-amber-500/20 border-b border-amber-500/30 px-4 py-2 text-center text-xs text-amber-300 font-medium flex items-center justify-center gap-2">
        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
        <span>Announcing MADECC Construction Cloud — The Turnkey Multi-Tenant SaaS for Engineering & Contractors across Africa</span>
        <button
          onClick={onOpenOnboarding}
          className="underline font-bold text-white hover:text-amber-200 ml-2"
        >
          Create Portal &rarr;
        </button>
      </div>

      {/* Navigation */}
      <nav className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-4 flex items-center justify-between max-w-7xl w-full mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-600 flex items-center justify-center text-slate-950 font-black shadow-lg shadow-amber-500/20">
            <Building2 className="w-6 h-6" />
          </div>
          <div>
            <span className="text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
              MADECC <span className="text-amber-400">Cloud</span>
            </span>
            <span className="text-[10px] text-slate-400 block -mt-1">
              Multi-Tenant Construction Operating System
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onEnterFlagshipTenant}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-semibold border border-slate-700 transition-colors flex items-center gap-1.5"
          >
            <Globe className="w-3.5 h-3.5 text-amber-400" />
            <span>View Flagship (MADECC GROUP)</span>
          </button>

          <button
            onClick={onOpenOnboarding}
            className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-lg shadow-amber-500/20 transition-all transform hover:scale-105"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Launch Company Portal</span>
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="px-6 pt-16 pb-20 max-w-7xl w-full mx-auto text-center space-y-8 relative overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-[140px] pointer-events-none -z-10" />

        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-900 border border-amber-500/30 text-amber-400 text-xs font-semibold shadow-inner">
          <Zap className="w-3.5 h-3.5" />
          <span>Next-Generation Civil Engineering ERP & AI Takeoff</span>
        </div>

        <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight max-w-4xl mx-auto font-serif leading-[1.1]">
          Power Your Construction Enterprise with <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500">Intelligent SaaS</span>
        </h1>

        <p className="text-slate-300 text-base sm:text-lg max-w-2xl mx-auto leading-relaxed">
          From 12-stage CAD AI quantity takeoffs and Eurocode 2 structural calculations to automated BOQs and white-labeled client portals. Everything your contracting firm needs in one isolated cloud workspace.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={onOpenOnboarding}
            className="w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-extrabold rounded-2xl text-sm flex items-center justify-center gap-2 shadow-xl shadow-amber-500/25 transition-all transform hover:scale-105"
          >
            Start Construction Cloud Workspace
            <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={onEnterFlagshipTenant}
            className="w-full sm:w-auto px-8 py-4 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-2xl text-sm border border-slate-700/80 transition-all flex items-center justify-center gap-2"
          >
            <Building2 className="w-4 h-4 text-amber-400" />
            Explore Flagship Tenant #001
          </button>
        </div>

        {/* Live Flagship Tenant Showcase Badge */}
        <div className="pt-8 max-w-3xl mx-auto">
          <div className="bg-slate-900/80 border border-slate-800 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 text-left">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                <img
                  src={flagshipTenant.logoUrl || ''}
                  alt={flagshipTenant.name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold block">
                  Reference Flagship Tenant #001
                </span>
                <span className="text-sm font-bold text-white block">
                  {flagshipTenant.name} (Commercial Headquarters)
                </span>
                <span className="text-xs text-slate-400">
                  Fully operational with BOQ, AI Takeoffs, Eurocode Calcs, & Document Studio
                </span>
              </div>
            </div>

            <button
              onClick={onEnterFlagshipTenant}
              className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-bold rounded-xl border border-amber-500/30 transition-colors shrink-0"
            >
              Enter Live Demo &rarr;
            </button>
          </div>
        </div>
      </section>

      {/* Feature Pillar Grid */}
      <section className="px-6 py-16 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl w-full mx-auto space-y-12">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              Built for African & Global Civil Engineering
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto">
              Engineered specifically for contractors, quantity surveyors, structural engineers, and project developers.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="p-3 w-fit rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Cpu className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">AI CAD & Drawing Takeoff</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Upload CAD DWG or PDF plans. Our 12-stage AI pipeline detects structural elements, calculates dimensions, and exports instant quantities into BOQ items.
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="p-3 w-fit rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">Eurocode 2 Structural Hub</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Perform rigorous EN 1992 calculations for reinforced concrete beams, columns, slabs, and footings with automatic bending schedules.
              </p>
            </div>

            <div className="bg-slate-900/90 border border-slate-800 p-6 rounded-2xl space-y-3">
              <div className="p-3 w-fit rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Globe className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-white">White-Label Company Website</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Get a dedicated, high-converting construction company website with custom branding, portfolio showcases, quote intake forms, and tender applications.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Matrix with Direct Mobile Money & Visa Support */}
      <section className="px-6 py-20 max-w-7xl w-full mx-auto space-y-12">
        <div className="text-center space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/30">
            Transparent SaaS Pricing
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-white font-serif">
            Choose Your Growth Tier
          </h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Direct payment via MTN MoMo, Orange Money, or Visa. No credit card locks or opaque intermediary fees.
          </p>

          <div className="inline-flex items-center gap-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800 mt-4">
            <button
              onClick={() => setBillingCycle('MONTHLY')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                billingCycle === 'MONTHLY' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setBillingCycle('ANNUAL')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5 ${
                billingCycle === 'ANNUAL' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
              }`}
            >
              Annual Billing
              <span className="text-[10px] bg-emerald-500 text-slate-950 px-1.5 py-0.2 rounded font-black">
                2 Mos Free
              </span>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {plans.map((p) => {
            const price = billingCycle === 'MONTHLY' ? p.monthlyPrice : p.annualPrice;
            return (
              <div
                key={p.code}
                className={`bg-slate-900/90 border rounded-3xl p-8 flex flex-col justify-between relative transition-all ${
                  p.isPopular
                    ? 'border-amber-500 shadow-2xl shadow-amber-500/10 ring-1 ring-amber-500/50'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                {p.isPopular && (
                  <span className="absolute -top-3.5 right-8 px-3 py-1 bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 text-xs font-black rounded-full uppercase tracking-wider shadow-md">
                    Most Popular
                  </span>
                )}

                <div className="space-y-6">
                  <div>
                    <h3 className="text-xl font-bold text-white">{p.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{p.description}</p>
                  </div>

                  <div>
                    <div className="text-3xl sm:text-4xl font-extrabold text-white font-mono">
                      {SubscriptionService.formatPrice(price)}
                    </div>
                    <span className="text-xs text-slate-400">
                      per {billingCycle === 'MONTHLY' ? 'month' : 'year'}
                    </span>
                  </div>

                  <div className="space-y-2.5 pt-4 border-t border-slate-800 text-xs">
                    {p.features?.map((f, idx) => (
                      <div key={idx} className="flex items-start gap-2.5 text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-8">
                  <button
                    onClick={onOpenOnboarding}
                    className={`w-full py-3.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                      p.isPopular
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 shadow-lg shadow-amber-500/20'
                        : 'bg-slate-800 hover:bg-slate-700 text-white'
                    }`}
                  >
                    Select {p.name}
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-12 px-6 mt-auto">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-amber-400" />
            <span className="font-bold text-white">MADECC Construction Cloud</span>
            <span>&copy; {new Date().getFullYear()} MADECC GROUP SARL. All rights reserved.</span>
          </div>

          <div className="flex items-center gap-4">
            <button onClick={onOpenSuperAdmin} className="text-amber-400 hover:underline">
              SaaS Super Admin
            </button>
            <button onClick={onEnterFlagshipTenant} className="hover:text-white">
              Flagship Showcase
            </button>
            <button onClick={onOpenOnboarding} className="hover:text-white">
              Tenant Registration
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
