import React, { useState, useEffect, lazy, Suspense } from 'react';
import { User, Tenant, PlanCode } from './types.ts';

// Layout & Core Global Components (Critical path for instant paint)
import Navbar from './components/Navbar.tsx';
import Footer from './components/Footer.tsx';
import SEOHandler from './components/SEOHandler.tsx';
import LiveTickerMarquee from './components/LiveTickerMarquee.tsx';
import Home from './components/Home.tsx';

// Robust dynamic import with automatic retry on chunk loading glitch
function lazyRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T } | any>,
  retries = 3,
  interval = 800
): React.LazyExoticComponent<T> {
  return lazy(() =>
    new Promise<{ default: T }>((resolve, reject) => {
      const attempt = (remaining: number) => {
        factory()
          .then((mod) => {
            if (mod && mod.default) {
              resolve(mod);
            } else if (mod) {
              resolve({ default: mod });
            } else {
              resolve(mod);
            }
          })
          .catch((error) => {
            if (remaining > 0) {
              setTimeout(() => attempt(remaining - 1), interval);
            } else {
              console.warn('[LAZY_RETRY] Failed to load module after retries, retrying once more:', error);
              factory().then((mod) => resolve(mod && mod.default ? mod : { default: mod })).catch(reject);
            }
          });
      };
      attempt(retries);
    })
  );
}

// Code-Split Dynamic Route Screens
const About = lazyRetry(() => import('./components/About.tsx'));
const Projects = lazyRetry(() => import('./components/Projects.tsx'));
const Blog = lazyRetry(() => import('./components/Blog.tsx'));
const Contact = lazyRetry(() => import('./components/Contact.tsx'));
const Booking = lazyRetry(() => import('./components/Booking.tsx'));
const Admin = lazyRetry(() => import('./components/Admin.tsx'));
const VerifyContract = lazyRetry(() => import('./components/VerifyContract.tsx'));
const ProjectBudgetCalculator = lazyRetry(() => import('./components/ProjectBudgetCalculator.tsx').then(m => ({ default: m.ProjectBudgetCalculator })));
const ConstructionCostGuide = lazyRetry(() => import('./components/ConstructionCostGuide.tsx').then(m => ({ default: m.ConstructionCostGuide })));
const Services = lazyRetry(() => import('./components/Services.tsx').then(m => ({ default: m.Services })));
const WebsiteDevelopmentServices = lazyRetry(() => import('./components/WebsiteDevelopmentServices.tsx').then(m => ({ default: m.WebsiteDevelopmentServices })));
const RequestQuote = lazyRetry(() => import('./components/RequestQuote.tsx').then(m => ({ default: m.RequestQuote })));
const ScheduleConsultation = lazyRetry(() => import('./components/ScheduleConsultation.tsx').then(m => ({ default: m.ScheduleConsultation })));
const LegalPage = lazyRetry(() => import('./components/LegalPage.tsx'));
const DataDeletion = lazyRetry(() => import('./components/DataDeletion.tsx'));
const FAQ = lazyRetry(() => import('./components/FAQ.tsx'));
const Tenders = lazyRetry(() => import('./components/Tenders.tsx').then(m => ({ default: m.Tenders })));
const DeveloperPortal = lazyRetry(() => import('./components/DeveloperPortal.tsx'));
const VisitorWalkthroughGuide = lazyRetry(() => import('./components/VisitorWalkthroughGuide.tsx').then(m => ({ default: m.VisitorWalkthroughGuide })));
const NavigationManualPage = lazyRetry(() => import('./components/NavigationManualPage.tsx').then(m => ({ default: m.NavigationManualPage })));
const BuyerHandoverManualPage = lazyRetry(() => import('./components/BuyerHandoverManualPage.tsx').then(m => ({ default: m.BuyerHandoverManualPage })));
const KrrSalesStore = lazyRetry(() => import('./components/KrrSalesStore.tsx').then(m => ({ default: m.KrrSalesStore })));
const KrrOrderTracking = lazyRetry(() => import('./components/KrrOrderTracking.tsx').then(m => ({ default: m.KrrOrderTracking })));
const SiteMap = lazyRetry(() => import('./components/SiteMap.tsx'));
const ClientPortal = lazyRetry(() => import('./components/ClientPortal.tsx'));
const Sustainability = lazyRetry(() => import('./components/Sustainability.tsx').then(m => ({ default: m.Sustainability })));
const SharedDocumentViewer = lazyRetry(() => import('./components/SharedDocumentViewer.tsx').then(m => ({ default: m.SharedDocumentViewer })));

// Code-Split Dynamic SaaS Multi-Tenant & Heavy Modules
const SuperAdmin = lazyRetry(() => import('./components/SuperAdmin.tsx').then(m => ({ default: m.SuperAdmin })));
const PublicSaaSMarketing = lazyRetry(() => import('./components/PublicSaaSMarketing.tsx').then(m => ({ default: m.PublicSaaSMarketing })));
const TenantBillingModal = lazyRetry(() => import('./components/TenantBillingModal.tsx').then(m => ({ default: m.TenantBillingModal })));
const TenantThankYouModal = lazyRetry(() => import('./components/TenantThankYouModal.tsx').then(m => ({ default: m.TenantThankYouModal })));
const TenantOnboardingModal = lazyRetry(() => import('./components/TenantOnboardingModal.tsx').then(m => ({ default: m.TenantOnboardingModal })));
const FloatingVoiceAssistant = lazyRetry(() => import('./components/FloatingVoiceAssistant.tsx'));
const FloatingContactHub = lazyRetry(() => import('./components/FloatingContactHub.tsx'));
const FollowUsModal = lazyRetry(() => import('./components/FollowUsModal.tsx'));
const ReceiptPaymentGateModal = lazyRetry(() => import('./components/ReceiptPaymentGateModal.tsx').then(m => ({ default: m.ReceiptPaymentGateModal })));
const VisitorMaintenanceNotice = lazyRetry(() => import('./components/VisitorMaintenanceNotice.tsx').then(m => ({ default: m.VisitorMaintenanceNotice })));
const VisitorAnnouncementBanner = lazyRetry(() => import('./components/VisitorAnnouncementBanner.tsx'));
const CookieConsentBanner = lazyRetry(() => import('./components/CookieConsentBanner.tsx'));


import { TenantService } from './services/tenantService.ts';
import { ThemeProvider, useTheme } from './lib/ThemeContext.tsx';
import { LanguageProvider } from './lib/LanguageContext.tsx';
import { SiteSettingsProvider, useSiteSettings } from './lib/SiteSettingsContext.tsx';
import { useCmsPage, useCmsPagesRegistry } from './lib/useCmsPage.ts';
import HeroVideoPlayer from './components/HeroVideoPlayer.tsx';
import { CmsCustomSections } from './components/cms/CmsCustomSections.tsx';
import { OfflineIndicator } from './components/OfflineIndicator.tsx';
import {
  parsePaymentUrlParams,
  PaymentLinkParams,
  MANUAL_DOWNLOAD_FEE_XAF,
  NAVIGATION_MANUAL_RECEIPT_NO,
  BUYER_HANDOVER_MANUAL_RECEIPT_NO
} from './utils/paymentDomain.ts';

function RouteLoadingFallback() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3" role="status" aria-live="polite">
      <div className="w-10 h-10 border-4 border-slate-700 border-t-amber-500 rounded-full animate-spin" />
      <span className="text-xs font-mono uppercase tracking-widest text-slate-400">Loading module...</span>
    </div>
  );
}

function DynamicCmsPageView({
  slug,
  onNavigateToTab,
  setSelectedProjectId,
  currentTenant
}: {
  slug: string;
  onNavigateToTab: (tab: string) => void;
  setSelectedProjectId: (id: number | null) => void;
  currentTenant: Tenant;
}) {
  const { page, hero, orderedSections, isUnpublished, loading } = useCmsPage(slug);
  if (loading) return <RouteLoadingFallback />;
  if (isUnpublished || !page) {
    return <Home setCurrentTab={onNavigateToTab} setSelectedProjectId={setSelectedProjectId} currentTenant={currentTenant} />;
  }
  return (
    <div className="min-h-screen">
      {hero.showHero !== false && (
        <HeroVideoPlayer config={hero}>
          <div className="max-w-3xl text-white space-y-4">
            {hero.eyebrow && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-amber-500/30 bg-amber-500/10 text-xs font-mono font-bold uppercase tracking-widest text-amber-400 rounded-md">
                {hero.eyebrow}
              </span>
            )}
            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight leading-tight">
              {hero.title || page.title}
            </h1>
            {hero.subtitle && (
              <p className="text-sm sm:text-lg text-slate-300 leading-relaxed max-w-2xl">
                {hero.subtitle}
              </p>
            )}
            <div className="flex flex-wrap gap-3 pt-2">
              {hero.primaryCta?.visible !== false && hero.primaryCta?.text && (
                <button
                  type="button"
                  onClick={() => onNavigateToTab((hero.primaryCta?.link || '/request-a-quote').replace(/^\//, '') || 'request-a-quote')}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-6 py-3 rounded-xl text-sm shadow-lg transition-all cursor-pointer"
                >
                  {hero.primaryCta.text}
                </button>
              )}
              {hero.secondaryCta?.visible !== false && hero.secondaryCta?.text && (
                <button
                  type="button"
                  onClick={() => onNavigateToTab((hero.secondaryCta?.link || '/contact').replace(/^\//, '') || 'contact')}
                  className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-6 py-3 rounded-xl text-sm border border-slate-700 transition-all cursor-pointer"
                >
                  {hero.secondaryCta.text}
                </button>
              )}
            </div>
          </div>
        </HeroVideoPlayer>
      )}
      <CmsCustomSections sections={orderedSections} onNavigateToTab={onNavigateToTab} />
    </div>
  );
}

function AppContent({
  currentTab,
  setCurrentTab,
  selectedProjectId,
  setSelectedProjectId,
  dbUser,
  setDbUser,
  loadingAuth,
  verificationToken,
  setVerificationToken,
  currentTenant,
  setCurrentTenant,
  isBillingOpen,
  setIsBillingOpen,
  isOnboardingOpen,
  setIsOnboardingOpen,
  thankYouModalState,
  setThankYouModalState
}: {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  selectedProjectId: number | null;
  setSelectedProjectId: (id: number | null) => void;
  dbUser: User | null;
  setDbUser: React.Dispatch<React.SetStateAction<User | null>>;
  loadingAuth: boolean;
  verificationToken: string;
  setVerificationToken: (t: string) => void;
  currentTenant: Tenant;
  setCurrentTenant: (t: Tenant) => void;
  isBillingOpen: boolean;
  setIsBillingOpen: (b: boolean) => void;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (b: boolean) => void;
  thankYouModalState: { isOpen: boolean; tenant: Tenant | null; planCode: string; confirmedBy?: string; transactionRef?: string };
  setThankYouModalState: (s: any) => void;
}) {
  const { theme } = useTheme();
  const { settings, isFollowModalOpen, closeFollowModal } = useSiteSettings();
  const { isSlugHidden } = useCmsPagesRegistry();
  const [preselectedService, setPreselectedService] = useState<string>('');
  const [onboardingPrefill, setOnboardingPrefill] = useState<{
    planCode?: PlanCode;
    billingCycle?: 'MONTHLY' | 'ANNUAL';
  }>({});
  const [clientPaymentRequest, setClientPaymentRequest] = useState<PaymentLinkParams | null>(() => parsePaymentUrlParams());
  const [manualPaymentGate, setManualPaymentGate] = useState<{
    manualType: 'navigation_manual' | 'buyer_handover_manual';
    options?: any;
  } | null>(null);
  const [activeDocShareToken, setActiveDocShareToken] = useState<string | null>(() => {
    const p = new URLSearchParams(window.location.search);
    if (p.get('docShare')) return p.get('docShare');
    const pathMatch = window.location.pathname.match(/^\/doc-share\/([^/]+)/i);
    return pathMatch ? decodeURIComponent(pathMatch[1]) : null;
  });

  useEffect(() => {
    const onOpenSharedDoc = (e: Event) => {
      const tok = (e as CustomEvent<string>).detail;
      if (tok) setActiveDocShareToken(tok);
    };
    window.addEventListener('madecc:open-shared-doc', onOpenSharedDoc);
    return () => window.removeEventListener('madecc:open-shared-doc', onOpenSharedDoc);
  }, []);

  const [showFloatingWidgets, setShowFloatingWidgets] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const enable = () => {
      if (!cancelled) setShowFloatingWidgets(true);
    };
    const w = window as any;
    if (typeof w.requestIdleCallback === 'function') {
      const id = w.requestIdleCallback(enable, { timeout: 2200 });
      return () => {
        cancelled = true;
        w.cancelIdleCallback?.(id);
      };
    }
    const timer = setTimeout(enable, 1800);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  useEffect(() => {
    const payParams = parsePaymentUrlParams();
    if (payParams) {
      setClientPaymentRequest(payParams);
    }
  }, []);

  useEffect(() => {
    const handleOpenManualPaymentGate = (e: Event) => {
      const customEvent = e as CustomEvent<{
        manualType: 'navigation_manual' | 'buyer_handover_manual';
        options?: any;
      }>;
      const detail = customEvent.detail;
      if (!detail?.manualType) return;

      setManualPaymentGate({
        manualType: detail.manualType,
        options: detail.options || {}
      });
    };

    window.addEventListener('madecc:open-manual-payment-gate', handleOpenManualPaymentGate);
    return () => {
      window.removeEventListener('madecc:open-manual-payment-gate', handleOpenManualPaymentGate);
    };
  }, [dbUser]);

  const handleNavigateWithState = (tab: string, extraState?: any) => {
    if (extraState?.selectedService) {
      setPreselectedService(extraState.selectedService);
    }
    setCurrentTab(tab);
  };

  const handleTenantSwitch = (tenant: Tenant) => {
    TenantService.setActiveTenant(tenant);
    setCurrentTenant(tenant);
  };

  // Special Full-Screen Views (Super Admin & SaaS Marketing Showcase)
  if (currentTab === 'super-admin') {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <SuperAdmin
          onBackToApp={() => setCurrentTab('home')}
          onImpersonateTenant={(t) => {
            handleTenantSwitch(t);
            setCurrentTab('admin');
          }}
          onTriggerThankYou={(t, planCode, txRef) => {
            setThankYouModalState({
              isOpen: true,
              tenant: t,
              planCode: planCode,
              confirmedBy: 'Super Admin (Verified in Neon)',
              transactionRef: txRef
            });
          }}
        />
        {thankYouModalState.isOpen && thankYouModalState.tenant && (
          <TenantThankYouModal
            isOpen={thankYouModalState.isOpen}
            onClose={() => setThankYouModalState({ isOpen: false, tenant: null, planCode: '' })}
            tenant={thankYouModalState.tenant}
            planCode={thankYouModalState.planCode}
            confirmedBy={thankYouModalState.confirmedBy}
            transactionRef={thankYouModalState.transactionRef}
            onGoToDashboard={() => {
              setThankYouModalState({ isOpen: false, tenant: null, planCode: '' });
              setCurrentTab('admin');
            }}
          />
        )}
      </Suspense>
    );
  }

  if (activeDocShareToken) {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <SharedDocumentViewer
          token={activeDocShareToken}
          onBackToHome={() => {
            setActiveDocShareToken(null);
            if (window.history && window.history.replaceState) {
              const url = new URL(window.location.href);
              url.searchParams.delete('docShare');
              if (url.pathname.toLowerCase().startsWith('/doc-share/')) {
                url.pathname = '/';
              }
              window.history.replaceState({}, '', url.toString());
            }
          }}
        />
      </Suspense>
    );
  }

  if (currentTab === 'saas-cloud') {
    return (
      <Suspense fallback={<RouteLoadingFallback />}>
        <PublicSaaSMarketing
          onEnterFlagshipTenant={() => {
            const flagship = TenantService.getTenantById(1) || currentTenant;
            handleTenantSwitch(flagship);
            setCurrentTab('home');
          }}
          onEnterTenant={(t) => {
            handleTenantSwitch(t);
            setCurrentTab('home');
          }}
          onOpenOnboarding={(planCode, billingCycle) => {
            setOnboardingPrefill({ planCode, billingCycle });
            setIsOnboardingOpen(true);
          }}
          onOpenSuperAdmin={() => setCurrentTab('super-admin')}
          onBackToHome={() => setCurrentTab('home')}
        />
        <TenantOnboardingModal
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
          initialPlanCode={onboardingPrefill.planCode}
          initialBillingCycle={onboardingPrefill.billingCycle}
          onTenantCreated={(newTenant) => {
            handleTenantSwitch(newTenant);
            setCurrentTab('admin');
          }}
        />
      </Suspense>
    );
  }

  const renderActiveScreen = () => {
    switch (currentTab) {
      case 'home':
        return (
          <Home 
            setCurrentTab={setCurrentTab} 
            setSelectedProjectId={setSelectedProjectId} 
            currentTenant={currentTenant}
          />
        );
      case 'services':
        return (
          <Services 
            onNavigateToTab={handleNavigateWithState}
          />
        );
      case 'website-development':
        return (
          <WebsiteDevelopmentServices 
            onNavigateToTab={handleNavigateWithState}
          />
        );
      case 'request-a-quote':
        return (
          <RequestQuote 
            onNavigateToTab={handleNavigateWithState}
            preselectedService={preselectedService}
          />
        );
      case 'schedule-consultation':
        return (
          <ScheduleConsultation 
            onNavigateToTab={handleNavigateWithState}
          />
        );
      case 'about':
        return <About />;
      case 'projects':
        return (
          <Projects 
            selectedProjectId={selectedProjectId} 
            setSelectedProjectId={setSelectedProjectId} 
          />
        );
      case 'blog':
        return <Blog />;
      case 'contact':
        return <Contact />;
      case 'booking':
        return (
          <ScheduleConsultation 
            onNavigateToTab={handleNavigateWithState}
          />
        );
      case 'budget-calculator':
        return (
          <ProjectBudgetCalculator 
            onNavigateToTab={handleNavigateWithState}
          />
        );
      case 'construction-cost-guide':
        return (
          <ConstructionCostGuide 
            onNavigateToTab={handleNavigateWithState}
          />
        );
      case 'walkthrough-guide':
      case 'visitor-guide':
        return (
          <VisitorWalkthroughGuide 
            onNavigateToTab={handleNavigateWithState}
          />
        );
      case 'navigation-manual':
      case 'navigation-guide':
        return (
          <NavigationManualPage
            onNavigateToTab={handleNavigateWithState}
          />
        );
      case 'buyer-handover-manual':
      case 'handover-manual':
        return (
          <BuyerHandoverManualPage
            onNavigateToTab={handleNavigateWithState}
          />
        );
      case 'terms':
      case 'privacy':
      case 'safety':
      case 'cookies':
      case 'disclaimer':
      case 'copyright':
      case 'acceptable-use':
      case 'data-protection':
      case 'api-terms':
      case 'investor-disclaimer':
      case 'legal':
        return <LegalPage type={currentTab === 'legal' ? 'privacy' : (currentTab as any)} setCurrentTab={setCurrentTab} />;
      case 'data-deletion':
        return <DataDeletion onNavigateToTab={handleNavigateWithState} setCurrentTab={setCurrentTab} />;
      case 'faq':
        return <FAQ onNavigateToTab={handleNavigateWithState} />;
      case 'developers':
      case 'api-platform':
        return <DeveloperPortal onNavigateToTab={handleNavigateWithState} />;
      case 'sustainability':
        return <Sustainability onNavigateToTab={handleNavigateWithState} />;
      case 'tenders':
        return <Tenders onNavigateToTab={handleNavigateWithState} />;
      case 'verify':
        return (
          <VerifyContract 
            token={verificationToken} 
            onBackToHome={() => {
              const url = new URL(window.location.href);
              url.searchParams.delete('verify');
              url.searchParams.delete('verifyToken');
              window.history.pushState({}, '', url.toString());
              setCurrentTab('home');
              setVerificationToken('');
            }} 
          />
        );
      case 'store':
      case 'bookstore':
      case 'textbooks':
      case 'shop':
        return (
          <Suspense fallback={<RouteLoadingFallback />}>
            <KrrSalesStore onNavigateToTab={handleNavigateWithState} />
          </Suspense>
        );
      case 'order-tracking':
      case 'track-order':
      case 'tracking':
        return (
          <Suspense fallback={<RouteLoadingFallback />}>
            <KrrOrderTracking onNavigateToTab={handleNavigateWithState} />
          </Suspense>
        );
      case 'sitemap':
      case 'site-map':
        return (
          <Suspense fallback={<RouteLoadingFallback />}>
            <SiteMap onNavigateToTab={handleNavigateWithState} />
          </Suspense>
        );
      case 'client-portal':
      case 'portal':
        return (
          <Suspense fallback={<RouteLoadingFallback />}>
            <ClientPortal onNavigateToTab={handleNavigateWithState} />
          </Suspense>
        );
      case 'admin':
        return (
          <Admin 
            dbUser={dbUser} 
            setDbUser={setDbUser} 
            setCurrentTab={setCurrentTab} 
            setVerificationToken={setVerificationToken}
          />
        );
      default:
        return (
          <DynamicCmsPageView
            slug={currentTab}
            onNavigateToTab={handleNavigateWithState}
            setSelectedProjectId={setSelectedProjectId}
            currentTenant={currentTenant}
          />
        );
    }
  };

  const isAdminOrStaff = Boolean(dbUser && (dbUser.role === 'admin' || dbUser.role === 'staff'));
  const isRouteUnpublished =
    currentTab !== 'home' &&
    currentTab !== 'admin' &&
    currentTab !== 'super-admin' &&
    currentTab !== 'verify' &&
    isSlugHidden(currentTab);

  return (
    <div
      data-btn-style={settings?.themeSettings?.buttonStyle || 'rounded'}
      data-layout={settings?.themeSettings?.homepageLayout || 'standard'}
      data-mobile-compact={settings?.themeSettings?.mobileCompactSpacing ? 'true' : 'false'}
      className={`flex flex-col min-h-screen w-full max-w-full overflow-x-hidden font-sans transition-colors duration-300 ${
      theme === 'light'
        ? 'bg-slate-50 text-slate-800 selection:bg-amber-200 selection:text-slate-900'
        : 'bg-[#0A0A0B] text-slate-200 selection:bg-amber-500 selection:text-slate-950'
    }`}>
      {/* Accessible Skip to Main Content Link */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2.5 focus:bg-amber-500 focus:text-slate-950 focus:font-bold focus:rounded-lg focus:shadow-2xl focus:outline-none"
      >
        Skip to main content
      </a>

      {/* Emergency / Site-Wide Broadcast Banner */}
      {settings?.emergencyBanner?.enabled && settings.emergencyBanner.message && (
        <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-slate-950 px-4 py-2 text-xs font-bold flex items-center justify-between gap-3 shadow-md z-40">
          <div className="flex items-center gap-2 max-w-5xl mx-auto flex-grow justify-center text-center">
            <span className="bg-slate-950 text-amber-400 text-[10px] uppercase font-mono px-2 py-0.5 rounded tracking-wider font-extrabold">
              {settings.emergencyBanner.badgeType === 'urgent' ? 'URGENT DISPATCH' : 'ANNOUNCEMENT'}
            </span>
            <span>{settings.emergencyBanner.message}</span>
            {settings.emergencyBanner.linkText && settings.emergencyBanner.linkUrl && (
              <a 
                href={settings.emergencyBanner.linkUrl}
                className="underline hover:text-white font-extrabold ml-2 inline-flex items-center gap-0.5"
              >
                {settings.emergencyBanner.linkText} &rarr;
              </a>
            )}
          </div>
        </div>
      )}

      <SEOHandler currentTab={currentTab} selectedProjectId={selectedProjectId} currentTenant={currentTenant} />

      {/* Non-Intrusive Website Maintenance Notification & Visitor Announcements */}
      <Suspense fallback={null}>
        <VisitorMaintenanceNotice />
        <VisitorAnnouncementBanner currentTab={currentTab} onNavigate={(tab) => setCurrentTab(tab)} />
      </Suspense>
      
      {/* Header Navigation Section */}
      <Navbar 
        currentTab={currentTab} 
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'projects') setSelectedProjectId(null); // Reset selection
        }} 
        dbUser={dbUser} 
        setDbUser={setDbUser} 
        loadingAuth={loadingAuth}
        currentTenant={currentTenant}
        onTenantChange={handleTenantSwitch}
        onOpenBilling={() => setIsBillingOpen(true)}
        onOpenOnboarding={() => setIsOnboardingOpen(true)}
        onOpenSuperAdmin={() => setCurrentTab('super-admin')}
      />

      {/* Dynamic Moving Text Ticker Bar */}
      <LiveTickerMarquee 
        onNavigateToTab={(tab) => {
          setCurrentTab(tab);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Main Content View with transition wrapper */}
      <main id="main-content" className="flex-grow">
        {loadingAuth && currentTab === 'admin' ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <div className={`w-10 h-10 border-4 rounded-full animate-spin ${theme === 'light' ? 'border-slate-300 border-t-amber-500' : 'border-slate-800 border-t-amber-500'}`} />
            <span className={`text-xs font-mono uppercase tracking-widest ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'}`}>Verifying secure profile...</span>
          </div>
        ) : isRouteUnpublished && !isAdminOrStaff ? (
          <div className="max-w-2xl mx-auto px-4 py-24 text-center space-y-5">
            <span className="inline-block px-3 py-1 rounded-md bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold uppercase tracking-wider">
              Page Temporarily Unpublished
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight">This section is currently offline for updates</h1>
            <p className="text-sm text-slate-400">
              Our editorial team has temporarily unpublished this page. Please return to the homepage or browse our active services and projects.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setCurrentTab('home')}
                className="px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-sm transition-colors cursor-pointer"
              >
                Return to Homepage
              </button>
            </div>
          </div>
        ) : (
          <Suspense fallback={<RouteLoadingFallback />}>
            {isRouteUnpublished && isAdminOrStaff && (
              <div className="bg-amber-500/15 border-b border-amber-500/30 px-4 py-2 text-center text-xs font-mono text-amber-300">
                Admin Preview: This page is currently <strong>UNPUBLISHED</strong> to public visitors.
              </div>
            )}
            {renderActiveScreen()}
          </Suspense>
        )}
      </main>

      {/* Footer Navigation section */}
      <Footer 
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'projects') setSelectedProjectId(null); // Reset selection
        }} 
      />

      {/* Floating Interactive Live Hub widget & AI Voice Assistant (deferred past initial paint) */}
      {showFloatingWidgets && (
        <Suspense fallback={null}>
          <FloatingContactHub />
          <FloatingVoiceAssistant />
        </Suspense>
      )}

      {/* Multi-Tenant SaaS Modals */}
      <Suspense fallback={null}>
        <TenantBillingModal
          isOpen={isBillingOpen}
          onClose={() => setIsBillingOpen(false)}
          tenant={currentTenant}
          onPaymentSubmitted={(details: any) => {
            setIsBillingOpen(false);
            // Show celebration / pending verification modal
            setThankYouModalState({
              isOpen: true,
              tenant: currentTenant,
              planCode: typeof details === 'string' ? details : (details?.planCode || 'ENTERPRISE'),
              transactionRef: details?.transactionRef || details?.ref || 'TXN-DIRECT',
              confirmedBy: 'Pending Super Admin Verification'
            });
          }}
        />

        <TenantOnboardingModal
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
          initialPlanCode={onboardingPrefill.planCode}
          initialBillingCycle={onboardingPrefill.billingCycle}
          onTenantCreated={(newTenant) => {
            handleTenantSwitch(newTenant);
            setCurrentTab('admin');
          }}
        />

        {thankYouModalState.isOpen && thankYouModalState.tenant && (
          <TenantThankYouModal
            isOpen={thankYouModalState.isOpen}
            onClose={() => setThankYouModalState({ isOpen: false, tenant: null, planCode: '' })}
            tenant={thankYouModalState.tenant}
            planCode={thankYouModalState.planCode}
            confirmedBy={thankYouModalState.confirmedBy}
            transactionRef={thankYouModalState.transactionRef}
            onGoToDashboard={() => {
              setThankYouModalState({ isOpen: false, tenant: null, planCode: '' });
              setCurrentTab('admin');
            }}
          />
        )}
      </Suspense>

      {/* Global Follow Us & Pay-Before-Download Modals (Code-Split) */}
      <Suspense fallback={null}>
        {isFollowModalOpen && (
          <FollowUsModal 
            isOpen={isFollowModalOpen} 
            onClose={closeFollowModal}
            isAdmin={Boolean(dbUser && (dbUser.role === 'admin' || dbUser.role === 'staff'))}
            onNavigateToAdminCms={() => setCurrentTab('admin')}
          />
        )}

        {clientPaymentRequest && (
          <ReceiptPaymentGateModal
            isOpen={Boolean(clientPaymentRequest)}
            isAdmin={Boolean(dbUser && (dbUser.role === 'admin' || dbUser.role === 'staff'))}
            onClose={() => {
              setClientPaymentRequest(null);
              if (window.history && window.history.replaceState) {
                const url = new URL(window.location.href);
                url.searchParams.delete('pay');
                url.searchParams.delete('checkout');
                url.searchParams.delete('receipt');
                window.history.replaceState({}, '', url.toString());
              }
            }}
            receiptDetails={{
              receiptNo: clientPaymentRequest.receiptNo,
              projectName: clientPaymentRequest.projectName || 'Tender & Infrastructure Project',
              clientName: clientPaymentRequest.clientName || 'Valued Client',
              totalAmount: Number(clientPaymentRequest.amount) || 2199,
              customFeeAmount: 2199,
              currency: clientPaymentRequest.currency || 'XAF',
              docType: clientPaymentRequest.docType || 'boq_receipt',
              language: 'en'
            }}
          />
        )}

        {manualPaymentGate && (
          <ReceiptPaymentGateModal
            isOpen={Boolean(manualPaymentGate)}
            isAdmin={Boolean(dbUser && (dbUser.role === 'admin' || dbUser.role === 'staff'))}
            onClose={() => setManualPaymentGate(null)}
            receiptDetails={{
              receiptNo:
                manualPaymentGate.manualType === 'navigation_manual'
                  ? NAVIGATION_MANUAL_RECEIPT_NO
                  : BUYER_HANDOVER_MANUAL_RECEIPT_NO,
              projectName:
                manualPaymentGate.manualType === 'navigation_manual'
                  ? 'Navigation Manual (A4 PDF)'
                  : 'Buyer Brand Handover Manual (PDF)',
              clientName: dbUser?.name || 'Website Visitor / Client',
              clientEmail: dbUser?.email || '',
              totalAmount: MANUAL_DOWNLOAD_FEE_XAF,
              customFeeAmount: MANUAL_DOWNLOAD_FEE_XAF,
              currency: 'XAF',
              docType:
                manualPaymentGate.manualType === 'navigation_manual'
                  ? 'navigation_manual_pdf'
                  : 'buyer_handover_pdf',
              language: 'en'
            }}
            customDownloadLabel={
              manualPaymentGate.manualType === 'navigation_manual'
                ? 'Download Navigation Manual (A4 PDF)'
                : 'Download Buyer Brand Handover Manual (PDF)'
            }
            onUnlockCustomDownload={async () => {
              const { verifyServerReceiptDownloadAllowed } = await import('./utils/paymentDomain.ts');
              const receiptCode =
                manualPaymentGate.manualType === 'navigation_manual'
                  ? NAVIGATION_MANUAL_RECEIPT_NO
                  : BUYER_HANDOVER_MANUAL_RECEIPT_NO;
              const check = await verifyServerReceiptDownloadAllowed(receiptCode);
              if (!check.allowed) return;
              if (manualPaymentGate.manualType === 'navigation_manual') {
                const m = await import('./utils/navigationGuidePdf.ts');
                m.forceDownloadWebsiteNavigationGuidePdf(manualPaymentGate.options || {});
              } else {
                const m = await import('./utils/buyerHandoverPdf.ts');
                m.forceDownloadBuyerHandoverManualPdf(manualPaymentGate.options || {});
              }
            }}
          />
        )}
      </Suspense>

      {/* PWA Network Connectivity Indicator */}
      <OfflineIndicator />

      {/* Global GDPR & Google AdSense Compliant Cookie Consent Banner (deferred past initial paint) */}
      {showFloatingWidgets && (
        <Suspense fallback={null}>
          <CookieConsentBanner onOpenPrivacyPolicy={() => setCurrentTab('privacy')} />
        </Suspense>
      )}
    </div>
  );
}

function getTabFromPath(pathname: string, searchStr: string): string {
  const path = pathname.toLowerCase();
  const params = new URLSearchParams(searchStr);
  if (path.includes('super-admin') || params.get('tab') === 'super-admin') return 'super-admin';
  if (path.includes('saas') || path.includes('cloud') || params.get('tab') === 'saas') return 'saas-cloud';
  if (path.includes('data-deletion') || path.includes('data_deletion') || params.get('tab') === 'data-deletion' || params.get('tracking')) return 'data-deletion';
  if (path.includes('store') || path.includes('bookstore') || path.includes('textbook') || path.includes('shop') || params.get('tab') === 'store') return 'store';
  if (path.includes('order-tracking') || path.includes('track-order') || (path.includes('order') && !path.includes('onboarding')) || params.get('tab') === 'order-tracking') return 'order-tracking';
  if ((path.includes('terms') && !path.includes('api-terms')) || params.get('tab') === 'terms') return 'terms';
  if (path.includes('api-terms') || params.get('tab') === 'api-terms') return 'api-terms';
  if (path.includes('cookies') || params.get('tab') === 'cookies') return 'cookies';
  if (path.includes('investor-disclaimer') || params.get('tab') === 'investor-disclaimer') return 'investor-disclaimer';
  if (path.includes('disclaimer') || params.get('tab') === 'disclaimer') return 'disclaimer';
  if (path.includes('copyright') || params.get('tab') === 'copyright') return 'copyright';
  if (path.includes('acceptable-use') || params.get('tab') === 'acceptable-use') return 'acceptable-use';
  if (path.includes('data-protection') || params.get('tab') === 'data-protection') return 'data-protection';
  if (path.includes('privacy') || path === '/legal' || params.get('tab') === 'privacy' || params.get('tab') === 'legal') return 'privacy';
  if (path.includes('safety') || path.includes('health') || path.includes('qhse') || params.get('tab') === 'safety') return 'safety';
  if (path.includes('website-development') || path.includes('web-development') || params.get('tab') === 'website-development') return 'website-development';
  if (path.includes('services')) return 'services';
  if (path.includes('request-a-quote') || path.includes('request-quote')) return 'request-a-quote';
  if (path.includes('schedule-consultation') || path.includes('consultation')) return 'schedule-consultation';
  if (path.includes('construction-cost-guide')) return 'construction-cost-guide';
  if (path.includes('budget-calculator') || path.includes('calculator')) return 'budget-calculator';
  if (path.includes('navigation-manual') || path.includes('navigation-guide') || params.get('tab') === 'navigation-manual') return 'navigation-manual';
  if (path.includes('buyer-handover-manual') || path.includes('handover-manual') || params.get('tab') === 'buyer-handover-manual') return 'buyer-handover-manual';
  if (path.includes('walkthrough-guide') || path.includes('visitor-guide') || params.get('tab') === 'walkthrough-guide') return 'walkthrough-guide';
  if (path.includes('faq') || path.includes('help')) return 'faq';
  if (path.includes('tender') || path.includes('procurement')) return 'tenders';
  if (path.includes('about')) return 'about';
  if (path.includes('projects')) return 'projects';
  if (path.includes('blog')) return 'blog';
  if (path.includes('contact')) return 'contact';
  if (path.includes('booking')) return 'booking';
  if (path.includes('client-portal') || path === '/portal' || path.startsWith('/client/') || params.get('tab') === 'client-portal') return 'client-portal';
  if (path.includes('sitemap') || path.includes('site-map') || params.get('tab') === 'sitemap') return 'sitemap';
  if (path.includes('sustainability') || params.get('tab') === 'sustainability') return 'sustainability';
  if (path.includes('developers') || path.includes('api-platform')) return 'developers';
  if (path.includes('admin')) return 'admin';
  const cleanSlug = path.replace(/^\/+|\/+$/g, '');
  if (cleanSlug && /^[a-z0-9-]+$/.test(cleanSlug)) return cleanSlug;
  return 'home';
}

export default function App() {
  const [currentTenant, setCurrentTenant] = useState<Tenant>(() => TenantService.getActiveTenant());
  const [isBillingOpen, setIsBillingOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [thankYouModalState, setThankYouModalState] = useState<{
    isOpen: boolean;
    tenant: Tenant | null;
    planCode: string;
    confirmedBy?: string;
    transactionRef?: string;
  }>({
    isOpen: false,
    tenant: null,
    planCode: ''
  });

  const [currentTab, setCurrentTab] = useState<string>(() => {
    return getTabFromPath(window.location.pathname, window.location.search);
  });

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [verificationToken, setVerificationToken] = useState<string>('');

  // Apply tenant branding on load and change
  useEffect(() => {
    TenantService.applyTenantBranding(currentTenant);
  }, [currentTenant]);

  // Sync currentTenant when switched from nested workspaces (e.g. Admin SaaS Control Plane)
  useEffect(() => {
    const onTenantSwitched = (e: Event) => {
      const detail = (e as CustomEvent<Tenant>).detail;
      if (detail?.id) {
        setCurrentTenant(detail);
      }
    };
    window.addEventListener('madecc:tenant-switched', onTenantSwitched);
    return () => window.removeEventListener('madecc:tenant-switched', onTenantSwitched);
  }, []);

  // Sync contract verification tokens from query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get('verify') || params.get('verifyToken');
    if (verifyToken) {
      setVerificationToken(verifyToken);
      setCurrentTab('verify');
    }
  }, []);

  // Sync backend session (via secure cookies) and optional Firebase authentication cleanly without 401 console errors
  useEffect(() => {
    let active = true;
    setLoadingAuth(true);

    // 1. Check backend session silently (/api/auth/session always returns 200 OK)
    let storedToken: string | null = null;
    let hasFirebaseHint = false;
    try {
      storedToken = localStorage.getItem('madecc_auth_token') || sessionStorage.getItem('madecc_auth_token');
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith('firebase:authUser:')) {
          hasFirebaseHint = true;
          break;
        }
      }
    } catch (_) {}

    fetch('/api/auth/session', {
      credentials: 'include',
      headers: storedToken ? { Authorization: `Bearer ${storedToken}` } : {}
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data?.user) {
          setDbUser(data.user);
        }
      })
      .catch((err) => {
        console.warn('Session check notice:', err);
      })
      .finally(() => {
        if (active) setLoadingAuth(false);
      });

    // Fallback safety timer: ensure loadingAuth resolves quickly even on slow connections
    const fallbackTimer = setTimeout(() => {
      if (active) setLoadingAuth(false);
    }, 1200);

    // 2. Only dynamically load Firebase Auth SDK if user has an existing Firebase login session
    let unsubscribe = () => {};
    if (hasFirebaseHint) {
      Promise.all([import('./lib/firebase.ts'), import('firebase/auth')])
        .then(async ([{ getFirebaseAuth }, { onAuthStateChanged }]) => {
          if (!active) return;
          const firebaseAuth = await getFirebaseAuth();
          if (!active) return;
          unsubscribe = onAuthStateChanged(
            firebaseAuth,
            async (firebaseUser) => {
              if (firebaseUser) {
                try {
                  const token = await firebaseUser.getIdToken();
                  const response = await fetch('/api/auth/me', {
                    credentials: 'include',
                    headers: { Authorization: `Bearer ${token}` }
                  });
                  if (response.ok) {
                    const data = await response.json();
                    if (active && data.user) {
                      setDbUser(data.user);
                    }
                  }
                } catch (error) {
                  console.warn('Error synchronizing authenticated profile:', error);
                }
              }
              if (active) setLoadingAuth(false);
              clearTimeout(fallbackTimer);
            },
            (error) => {
              console.warn('Firebase onAuthStateChanged network notice:', error?.message || error);
              if (active) setLoadingAuth(false);
              clearTimeout(fallbackTimer);
            }
          );
        })
        .catch(() => {
          if (active) setLoadingAuth(false);
        });
    }

    return () => {
      active = false;
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, []);

  // Scroll to top of page whenever tab transitions occur & sync URL path cleanly
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    // Synchronize browser address bar with current active view
    const targetPath = currentTab === 'home' ? '/' : `/${currentTab}`;
    const currentPath = window.location.pathname.toLowerCase();
    const isMatchingAlias =
      (currentTab === 'terms' && (currentPath === '/terms' || currentPath === '/terms-of-service')) ||
      (currentTab === 'privacy' && (currentPath === '/privacy' || currentPath === '/privacy-policy')) ||
      (currentTab === 'safety' && (currentPath === '/safety' || currentPath === '/health-and-safety' || currentPath === '/health-safety')) ||
      (currentTab === 'data-deletion' && (currentPath === '/data-deletion' || currentPath === '/data-deletion-instructions'));

    if (window.location.pathname !== targetPath && !isMatchingAlias) {
      window.history.pushState({ tab: currentTab }, '', targetPath + window.location.search);
    }

    // Non-blocking visitor page-view beacon for Security & Threat Monitoring telemetry
    try {
      let sessionKey = sessionStorage.getItem('madecc_visit_sid');
      if (!sessionKey) {
        sessionKey = typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `v-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
        sessionStorage.setItem('madecc_visit_sid', sessionKey);
      }
      const payload = JSON.stringify({
        path: `${targetPath}${selectedProjectId ? `#project-${selectedProjectId}` : ''}`,
        tab: currentTab,
        referrer: document.referrer || '',
        sessionId: sessionKey,
        screenWidth: window.innerWidth || 0
      });
      fetch('/api/security/beacon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: payload,
        keepalive: true,
        credentials: 'include'
      }).catch(() => {});
    } catch {
      // Non-fatal
    }
  }, [currentTab, selectedProjectId]);

  // Support browser Back/Forward navigation across all application routes
  useEffect(() => {
    const handlePopState = () => {
      const tab = getTabFromPath(window.location.pathname, window.location.search);
      setCurrentTab(tab);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  return (
    <LanguageProvider>
      <ThemeProvider dbUser={dbUser}>
        <SiteSettingsProvider>
          <AppContent
            currentTab={currentTab}
            setCurrentTab={setCurrentTab}
            selectedProjectId={selectedProjectId}
            setSelectedProjectId={setSelectedProjectId}
            dbUser={dbUser}
            setDbUser={setDbUser}
            loadingAuth={loadingAuth}
            verificationToken={verificationToken}
            setVerificationToken={setVerificationToken}
            currentTenant={currentTenant}
            setCurrentTenant={setCurrentTenant}
            isBillingOpen={isBillingOpen}
            setIsBillingOpen={setIsBillingOpen}
            isOnboardingOpen={isOnboardingOpen}
            setIsOnboardingOpen={setIsOnboardingOpen}
            thankYouModalState={thankYouModalState}
            setThankYouModalState={setThankYouModalState}
          />
        </SiteSettingsProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}
