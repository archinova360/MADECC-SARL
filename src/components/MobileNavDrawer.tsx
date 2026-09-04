import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Home, 
  Briefcase, 
  FolderKanban, 
  Calendar, 
  BookOpen, 
  Calculator, 
  FileText, 
  Sparkles, 
  Key, 
  Building2, 
  HelpCircle, 
  Phone, 
  Radio, 
  ShieldCheck, 
  Megaphone, 
  Moon, 
  Sun, 
  LogOut, 
  Download, 
  ChevronRight,
  Layers,
  Wrench,
  Compass
} from 'lucide-react';
import { User, Tenant } from '../types.ts';
import { TenantSwitcher } from './TenantSwitcher.tsx';
// @ts-ignore
import logoImg from '../assets/images/app_logo_1788030845756.jpg';

export interface MobileNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  language: 'en' | 'fr';
  setLanguage: (lang: 'en' | 'fr') => void;
  t: (key: string) => string;
  currentTenant: Tenant;
  onTenantChange?: (tenant: Tenant) => void;
  onOpenBilling?: () => void;
  onOpenOnboarding?: () => void;
  onOpenSuperAdmin?: () => void;
  dbUser: User | null;
  handleLogout: () => void;
  openLoginModal: () => void;
  openFollowModal: () => void;
  handleDownloadNavigationGuide: () => void;
  triggerRef?: React.RefObject<HTMLButtonElement | null>;
}

export const MobileNavDrawer: React.FC<MobileNavDrawerProps> = ({
  isOpen,
  onClose,
  currentTab,
  setCurrentTab,
  theme,
  toggleTheme,
  language,
  setLanguage,
  t,
  currentTenant,
  onTenantChange,
  onOpenBilling,
  onOpenOnboarding,
  onOpenSuperAdmin,
  dbUser,
  handleLogout,
  openLoginModal,
  openFollowModal,
  handleDownloadNavigationGuide,
  triggerRef,
}) => {
  const drawerRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  // Focus trap and keyboard management
  useEffect(() => {
    if (!isOpen) return;

    // Lock body scroll
    const originalStyle = window.getComputedStyle(document.body).overflow;
    document.body.style.overflow = 'hidden';

    // Focus close button initially with a slight delay to allow entrance animation
    const timer = setTimeout(() => {
      closeButtonRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
        triggerRef?.current?.focus();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );

        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = originalStyle;
      document.removeEventListener('keydown', handleKeyDown);
      triggerRef?.current?.focus();
    };
  }, [isOpen, onClose, triggerRef]);

  const handleNavClick = (tabId: string) => {
    setCurrentTab(tabId);
    onClose();
  };

  const primaryLinks = [
    { id: 'home', label: t('nav_home'), icon: Home },
    { id: 'services', label: 'Services & Solutions', icon: Briefcase },
    { id: 'projects', label: t('nav_projects'), icon: FolderKanban },
    { id: 'schedule-consultation', label: 'Schedule Consultation', icon: Calendar },
    { id: 'blog', label: 'News & Insights', icon: BookOpen },
  ];

  const toolsLinks = [
    { 
      id: 'budget-calculator', 
      label: 'Budget Calculator', 
      desc: 'Instant estimation for villas, offices & residential projects',
      icon: Calculator,
      badge: 'Interactive'
    },
    { 
      id: 'construction-cost-guide', 
      label: 'Cost Guide 2026', 
      desc: 'Material benchmarks, cement rates & regional metrics',
      icon: FileText,
      badge: '2026 Data'
    },
    { 
      id: 'saas-cloud', 
      label: 'Cloud SaaS Platform', 
      desc: 'Multi-tenant construction workspace suite',
      icon: Sparkles,
      badge: 'PRO'
    },
    { 
      id: 'developers', 
      label: 'Developer APIs', 
      desc: 'REST endpoints, BOQ calculators & live webhooks',
      icon: Key,
      badge: 'REST'
    },
  ];

  const companyLinks = [
    { id: 'about', label: 'About Us', desc: 'Certifications, leadership & history', icon: Building2 },
    { id: 'faq', label: 'Frequently Asked Questions', desc: 'Contracts, warranties & timelines', icon: HelpCircle },
    { id: 'contact', label: 'Contact Us & HQ', desc: 'Yaoundé office & 24/7 client desk', icon: Phone },
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex justify-end"
          role="presentation"
        >
          {/* Backdrop Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm"
            onClick={onClose}
            aria-hidden="true"
          />

          {/* Slide-out Drawer Panel */}
          <motion.div
            ref={drawerRef}
            id="mobile-navigation-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="mobile-drawer-title"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 280, mass: 0.8 }}
            className={`relative z-10 w-full sm:w-[420px] max-w-[90vw] h-[100dvh] flex flex-col shadow-2xl border-l ${
              theme === 'light'
                ? 'bg-white border-slate-200 text-slate-900'
                : 'bg-slate-950 border-slate-800 text-slate-100'
            }`}
          >
            {/* Drawer Header */}
            <div className={`flex items-center justify-between px-5 py-4 border-b shrink-0 ${
              theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900/90 border-slate-800'
            }`}>
              <div className="flex items-center gap-3 min-w-0" id="mobile-drawer-title">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden border shrink-0 ${
                  theme === 'light' ? 'bg-white border-slate-200' : 'bg-slate-950 border-slate-800'
                }`}>
                  <img 
                    src={currentTenant.logoUrl || logoImg} 
                    alt="" 
                    className="w-full h-full object-contain"
                    aria-hidden="true"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <div className="min-w-0">
                  <span className="block font-sans font-extrabold text-sm tracking-tight truncate">
                    {currentTenant.name.toUpperCase()}
                  </span>
                  <span className={`text-[10px] font-mono tracking-wider block ${
                    theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                  }`}>
                    {currentTenant.isFlagship ? 'CONSTRUCTION & ENG' : `${currentTenant.planCode} WORKSPACE`}
                  </span>
                </div>
              </div>

              {/* Close Button with generous 48x48px hit target */}
              <button
                ref={closeButtonRef}
                onClick={onClose}
                className={`min-w-[48px] min-h-[48px] flex items-center justify-center rounded-xl transition-colors ${
                  theme === 'light'
                    ? 'text-slate-600 hover:text-slate-950 hover:bg-slate-200/80 active:bg-slate-300'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800 active:bg-slate-700'
                }`}
                aria-label="Close navigation menu"
                id="mobile-drawer-close-btn"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Drawer Body (Scrollable with touch-friendly spacing) */}
            <div 
              className="flex-1 overflow-y-auto overscroll-contain px-4 py-5 space-y-6"
              tabIndex={-1}
            >
              {/* Section 1: Main Pages */}
              <div>
                <div className="px-2 mb-2 flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  <Compass className="w-3.5 h-3.5 text-amber-500" />
                  <span>Main Menu</span>
                </div>
                <nav className="space-y-1" aria-label="Primary Mobile Navigation">
                  {primaryLinks.map((link) => {
                    const Icon = link.icon;
                    const isActive = currentTab === link.id;
                    return (
                      <button
                        key={link.id}
                        onClick={() => handleNavClick(link.id)}
                        className={`w-full min-h-[48px] px-3.5 py-3 rounded-xl font-sans text-sm font-semibold flex items-center justify-between transition-all select-none text-left ${
                          isActive
                            ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 font-bold'
                            : theme === 'light'
                              ? 'text-slate-700 hover:bg-slate-100 active:bg-slate-200'
                              : 'text-slate-300 hover:bg-slate-900 active:bg-slate-800'
                        }`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                          <span>{link.label}</span>
                        </div>
                        <ChevronRight className={`w-4 h-4 shrink-0 opacity-70 ${isActive ? 'text-slate-950' : 'text-slate-500'}`} />
                      </button>
                    );
                  })}
                </nav>
              </div>

              {/* Section 2: Tools, Estimators & Platforms */}
              <div>
                <div className="px-2 mb-2 flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  <Wrench className="w-3.5 h-3.5 text-amber-500" />
                  <span>Engineering Tools & SaaS</span>
                </div>
                <div className="space-y-1.5">
                  {toolsLinks.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full min-h-[52px] p-3 rounded-xl border text-left transition-all select-none flex items-start justify-between gap-2.5 ${
                          isActive
                            ? theme === 'light'
                              ? 'bg-amber-50 border-amber-400 shadow-sm'
                              : 'bg-amber-500/15 border-amber-500/50 shadow-sm'
                            : theme === 'light'
                              ? 'bg-white border-slate-200 hover:bg-slate-50'
                              : 'bg-slate-900/60 border-slate-800/90 hover:bg-slate-900'
                        }`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <div className="flex items-start gap-3 min-w-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                            item.id === 'saas-cloud' 
                              ? 'bg-amber-500/20 text-amber-400' 
                              : item.id === 'developers'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs font-bold font-sans truncate ${
                                isActive ? 'text-amber-500' : theme === 'light' ? 'text-slate-900' : 'text-white'
                              }`}>
                                {item.label}
                              </span>
                              {item.badge && (
                                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 font-bold shrink-0">
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                              {item.desc}
                            </p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-500 shrink-0 mt-2" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 3: Company & Information */}
              <div>
                <div className="px-2 mb-2 flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  <Building2 className="w-3.5 h-3.5 text-amber-500" />
                  <span>Company</span>
                </div>
                <div className="space-y-1">
                  {companyLinks.map((item) => {
                    const Icon = item.icon;
                    const isActive = currentTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleNavClick(item.id)}
                        className={`w-full min-h-[48px] px-3.5 py-2.5 rounded-xl text-left transition-all select-none flex items-center justify-between ${
                          isActive
                            ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                            : theme === 'light'
                              ? 'text-slate-700 hover:bg-slate-100'
                              : 'text-slate-300 hover:bg-slate-900'
                        }`}
                        aria-current={isActive ? 'page' : undefined}
                      >
                        <div className="flex items-center gap-3">
                          <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
                          <div>
                            <span className="text-xs font-semibold block">{item.label}</span>
                            <span className={`text-[10px] block ${isActive ? 'text-slate-900/80' : 'text-slate-400'}`}>
                              {item.desc}
                            </span>
                          </div>
                        </div>
                        <ChevronRight className={`w-4 h-4 shrink-0 ${isActive ? 'text-slate-950' : 'text-slate-500'}`} />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Section 4: Studio / Admin Dashboard (if authorized) */}
              {dbUser && (dbUser.role === 'admin' || dbUser.role === 'staff' || dbUser.role === 'social_media_reviewer') && (
                <div>
                  <div className="px-2 mb-2 flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                    <span>Authorized Studio</span>
                  </div>
                  <button
                    onClick={() => handleNavClick('admin')}
                    className={`w-full min-h-[48px] px-4 py-3 rounded-xl border flex items-center justify-between transition-all select-none ${
                      currentTab === 'admin'
                        ? 'bg-amber-500 text-slate-950 font-bold border-amber-500 shadow-md'
                        : 'bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20'
                    }`}
                    id="mobile-nav-admin-btn"
                  >
                    <div className="flex items-center gap-2.5">
                      {dbUser.role === 'social_media_reviewer' ? (
                        <>
                          <Megaphone className="w-4 h-4 shrink-0" />
                          <span className="text-sm font-bold">Social Media Studio</span>
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4 shrink-0" />
                          <span className="text-sm font-bold">Admin Management Hub</span>
                        </>
                      )}
                    </div>
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-black/20 font-bold">
                      {dbUser.role.replace('_', ' ')}
                    </span>
                  </button>
                </div>
              )}

              {/* Section 5: Connect & Resources */}
              <div className="space-y-2">
                <div className="px-2 mb-2 flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-400">
                  <Radio className="w-3.5 h-3.5 text-amber-500" />
                  <span>Media & Downloads</span>
                </div>

                {/* Follow Us Button */}
                <button
                  onClick={() => {
                    onClose();
                    openFollowModal();
                  }}
                  className="w-full min-h-[48px] px-4 py-3 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 flex items-center justify-between font-sans text-xs font-bold transition-colors select-none shadow-sm"
                  id="mobile-drawer-follow-btn"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                    </span>
                    <Radio className="w-4 h-4" />
                    <span>Follow MADECC on Social Media</span>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold">
                    8 Channels
                  </span>
                </button>

                {/* Download PDF Navigation Guide */}
                <button
                  onClick={handleDownloadNavigationGuide}
                  className={`w-full min-h-[48px] px-4 py-2.5 rounded-xl border flex items-center justify-between text-xs font-semibold transition-colors select-none ${
                    theme === 'light'
                      ? 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      : 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800'
                  }`}
                  id="mobile-drawer-download-guide"
                >
                  <div className="flex items-center gap-2.5">
                    <Download className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Website & Architecture Guide PDF</span>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 font-bold">PDF</span>
                </button>
              </div>

              {/* Section 6: Workspace Switcher & App Preferences */}
              <div className="space-y-3 pt-2 border-t border-slate-800/60">
                {/* Active Workspace */}
                <div className={`p-3 rounded-xl border flex items-center justify-between gap-2 ${
                  theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
                }`}>
                  <div className="min-w-0 flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center shrink-0">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block tracking-wider">Tenant Workspace</span>
                      <span className="text-xs font-bold truncate block">{currentTenant.name}</span>
                    </div>
                  </div>
                  {onTenantChange && (
                    <TenantSwitcher 
                      currentTenant={currentTenant}
                      onTenantChange={(t) => {
                        onTenantChange(t);
                        onClose();
                      }}
                      onOpenBilling={() => {
                        onOpenBilling?.();
                        onClose();
                      }}
                      onOpenOnboarding={() => {
                        onOpenOnboarding?.();
                        onClose();
                      }}
                      onOpenSuperAdmin={() => {
                        onOpenSuperAdmin?.();
                        onClose();
                      }}
                      isSuperAdmin={true}
                    />
                  )}
                </div>

                {/* Theme & Language Dual Controls with min-h-[48px] */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={toggleTheme}
                    className={`min-h-[48px] px-3 py-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold transition-all select-none ${
                      theme === 'light'
                        ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                        : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                    }`}
                    aria-label={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} theme`}
                    id="mobile-drawer-theme-toggle"
                  >
                    {theme === 'light' ? (
                      <>
                        <Moon className="w-4 h-4 text-indigo-600" />
                        <span>Dark Theme</span>
                      </>
                    ) : (
                      <>
                        <Sun className="w-4 h-4 text-amber-400 animate-pulse" />
                        <span>Light Theme</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
                    className={`min-h-[48px] px-3 py-2.5 rounded-xl border flex items-center justify-center gap-2 text-xs font-bold font-mono uppercase transition-all select-none ${
                      theme === 'light'
                        ? 'bg-slate-100 border-slate-300 text-slate-800 hover:bg-slate-200'
                        : 'bg-slate-900 border-slate-800 text-slate-200 hover:bg-slate-800'
                    }`}
                    aria-label={`Switch language to ${language === 'en' ? 'French' : 'English'}`}
                    id="mobile-drawer-language-toggle"
                  >
                    <span>🌐</span>
                    <span>{language === 'en' ? 'FR (Français)' : 'EN (English)'}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Drawer Footer: Account / Authentication Section */}
            <div className={`p-4 border-t shrink-0 ${
              theme === 'light' ? 'bg-slate-50 border-slate-200' : 'bg-slate-900 border-slate-800'
            }`}>
              {dbUser ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500 flex items-center justify-center font-bold text-slate-950 text-sm shadow-md shrink-0">
                      {dbUser.name[0]?.toUpperCase() || 'U'}
                    </div>
                    <div className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold truncate leading-tight">{dbUser.name}</span>
                      <span className="block text-xs text-slate-400 truncate mt-0.5">{dbUser.email}</span>
                      <span className="inline-block mt-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-400">
                        {dbUser.role}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      handleLogout();
                      onClose();
                    }}
                    className="w-full min-h-[48px] bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 border border-red-500/20 transition-colors select-none"
                    id="mobile-drawer-logout-btn"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>{t('nav_logout')}</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    onClose();
                    openLoginModal();
                  }}
                  className="w-full min-h-[48px] bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all text-sm select-none active:scale-[0.98]"
                  id="mobile-drawer-login-btn"
                >
                  <Key className="w-4 h-4" />
                  <span>{t('nav_login')} / HQ Access</span>
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
