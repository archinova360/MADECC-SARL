import React, { useState } from 'react';
import { 
  Building2, ChevronDown, Check, Plus, ShieldCheck, 
  CreditCard, Sparkles, ExternalLink, Globe 
} from 'lucide-react';
import { Tenant } from '../types.ts';
import { TenantService } from '../services/tenantService.ts';

interface TenantSwitcherProps {
  currentTenant: Tenant;
  onTenantChange: (tenant: Tenant) => void;
  onOpenBilling: () => void;
  onOpenOnboarding: () => void;
  onOpenSuperAdmin: () => void;
  isSuperAdmin?: boolean;
}

export const TenantSwitcher: React.FC<TenantSwitcherProps> = ({
  currentTenant,
  onTenantChange,
  onOpenBilling,
  onOpenOnboarding,
  onOpenSuperAdmin,
  isSuperAdmin = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const tenants = TenantService.getAllTenants();

  const handleSelect = (tenant: Tenant) => {
    TenantService.setActiveTenant(tenant.id);
    onTenantChange(tenant);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-800 border border-slate-700/80 text-white text-xs transition-all shadow-sm group"
        title="Switch Company Workspace"
      >
        <div className="w-5 h-5 rounded-md bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-bold text-[10px] shrink-0 overflow-hidden">
          {currentTenant.logoUrl ? (
            <img src={currentTenant.logoUrl} alt={currentTenant.name} className="w-full h-full object-cover" />
          ) : (
            <Building2 className="w-3 h-3" />
          )}
        </div>
        
        <div className="flex flex-col text-left max-w-[130px] sm:max-w-[160px] truncate">
          <span className="font-semibold text-slate-100 truncate leading-tight flex items-center gap-1">
            {currentTenant.name}
            {currentTenant.isFlagship && (
              <span className="text-[9px] px-1 py-0.2 bg-amber-500/20 text-amber-300 rounded font-mono font-bold">
                #001
              </span>
            )}
          </span>
          <span className="text-[10px] text-slate-400 truncate leading-tight">
            {currentTenant.planCode} Plan
          </span>
        </div>

        <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-transform duration-200" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute right-0 mt-2 w-72 bg-slate-900 border border-slate-700/90 rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-3 bg-slate-950/60 border-b border-slate-800 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-300 uppercase tracking-wider text-[10px]">
                  Organization Workspaces
                </span>
                <span className="text-[10px] text-amber-400 font-mono">Multi-Tenant</span>
              </div>
            </div>

            {/* Tenant List */}
            <div className="p-1.5 max-h-60 overflow-y-auto space-y-1">
              {tenants.map((t) => {
                const isSelected = t.id === currentTenant.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => handleSelect(t)}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left text-xs transition-colors ${
                      isSelected
                        ? 'bg-amber-500/10 border border-amber-500/30 text-amber-300'
                        : 'hover:bg-slate-800 text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <div className="w-7 h-7 rounded-lg bg-slate-800 border border-slate-700 flex items-center justify-center shrink-0 overflow-hidden">
                        {t.logoUrl ? (
                          <img src={t.logoUrl} alt={t.name} className="w-full h-full object-cover" />
                        ) : (
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        )}
                      </div>
                      <div className="truncate">
                        <div className="font-semibold text-white truncate flex items-center gap-1.5">
                          {t.name}
                          {t.isFlagship && (
                            <span className="text-[9px] px-1 bg-amber-500/20 text-amber-400 rounded">
                              Flagship
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 flex items-center gap-1">
                          <Globe className="w-2.5 h-2.5" />
                          {t.primaryDomain || t.slug}
                        </div>
                      </div>
                    </div>

                    {isSelected && <Check className="w-4 h-4 text-amber-400 shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Actions Footer */}
            <div className="p-2 bg-slate-950/80 border-t border-slate-800 space-y-1 text-xs">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenBilling();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
              >
                <CreditCard className="w-3.5 h-3.5 text-amber-400" />
                <span>Subscription & Direct Billing</span>
              </button>

              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenOnboarding();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>Register New Construction Company</span>
              </button>

              {isSuperAdmin && (
                <button
                  onClick={() => {
                    setIsOpen(false);
                    onOpenSuperAdmin();
                  }}
                  className="w-full flex items-center justify-between px-3 py-2 bg-gradient-to-r from-amber-500/10 to-amber-600/10 hover:from-amber-500/20 hover:to-amber-600/20 border border-amber-500/30 text-amber-400 font-semibold rounded-lg transition-colors mt-1"
                >
                  <span className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    SaaS Super Admin Hub
                  </span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
