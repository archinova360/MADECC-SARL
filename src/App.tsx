import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase.ts';
import { User, Tenant } from './types.ts';
import { AnimatePresence } from 'motion/react';
import { PageTransition } from './components/MotionReveal.tsx';

// Layout & Core Global Components
import Navbar from './components/Navbar.tsx';
import Footer from './components/Footer.tsx';
import FloatingContactHub from './components/FloatingContactHub.tsx';
import FloatingVoiceAssistant from './components/FloatingVoiceAssistant.tsx';
import SEOHandler from './components/SEOHandler.tsx';
import LiveTickerMarquee from './components/LiveTickerMarquee.tsx';

// Tab Screens
import Home from './components/Home.tsx';
import About from './components/About.tsx';
import Projects from './components/Projects.tsx';
import Blog from './components/Blog.tsx';
import Contact from './components/Contact.tsx';
import Booking from './components/Booking.tsx';
import Admin from './components/Admin.tsx';
import VerifyContract from './components/VerifyContract.tsx';
import { ProjectBudgetCalculator } from './components/ProjectBudgetCalculator.tsx';
import { ConstructionCostGuide } from './components/ConstructionCostGuide.tsx';
import { Services } from './components/Services.tsx';
import { RequestQuote } from './components/RequestQuote.tsx';
import { ScheduleConsultation } from './components/ScheduleConsultation.tsx';
import LegalPage from './components/LegalPage.tsx';
import DataDeletion from './components/DataDeletion.tsx';
import FAQ from './components/FAQ.tsx';
import { Tenders } from './components/Tenders.tsx';
import DeveloperPortal from './components/DeveloperPortal.tsx';

// SaaS Multi-Tenant Modules
import { SuperAdmin } from './components/SuperAdmin.tsx';
import { PublicSaaSMarketing } from './components/PublicSaaSMarketing.tsx';
import { TenantBillingModal } from './components/TenantBillingModal.tsx';
import { TenantThankYouModal } from './components/TenantThankYouModal.tsx';
import { TenantOnboardingModal } from './components/TenantOnboardingModal.tsx';
import { TenantService } from './services/tenantService.ts';

import { ThemeProvider, useTheme } from './lib/ThemeContext.tsx';
import { LanguageProvider } from './lib/LanguageContext.tsx';
import { SiteSettingsProvider, useSiteSettings } from './lib/SiteSettingsContext.tsx';
import FollowUsModal from './components/FollowUsModal.tsx';

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
  const [preselectedService, setPreselectedService] = useState<string>('');

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
            confirmedBy: 'Super Admin (Manual Direct Verification)',
            transactionRef: txRef
          });
        }}
      />
    );
  }

  if (currentTab === 'saas-cloud') {
    return (
      <>
        <PublicSaaSMarketing
          onEnterFlagshipTenant={() => {
            const flagship = TenantService.getTenantById(1) || currentTenant;
            handleTenantSwitch(flagship);
            setCurrentTab('home');
          }}
          onOpenOnboarding={() => setIsOnboardingOpen(true)}
          onOpenSuperAdmin={() => setCurrentTab('super-admin')}
        />
        <TenantOnboardingModal
          isOpen={isOnboardingOpen}
          onClose={() => setIsOnboardingOpen(false)}
          onTenantCreated={(newTenant) => {
            handleTenantSwitch(newTenant);
            setCurrentTab('admin');
          }}
        />
      </>
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
      case 'terms':
        return <LegalPage type="terms" setCurrentTab={setCurrentTab} />;
      case 'privacy':
        return <LegalPage type="privacy" setCurrentTab={setCurrentTab} />;
      case 'safety':
        return <LegalPage type="safety" setCurrentTab={setCurrentTab} />;
      case 'data-deletion':
        return <DataDeletion onNavigateToTab={handleNavigateWithState} setCurrentTab={setCurrentTab} />;
      case 'faq':
        return <FAQ onNavigateToTab={handleNavigateWithState} />;
      case 'developers':
      case 'api-platform':
        return <DeveloperPortal onNavigateToTab={handleNavigateWithState} />;
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
          <Home 
            setCurrentTab={setCurrentTab} 
            setSelectedProjectId={setSelectedProjectId} 
          />
        );
    }
  };

  return (
    <div className={`flex flex-col min-h-screen font-sans transition-colors duration-300 ${
      theme === 'light'
        ? 'bg-slate-50 text-slate-800 selection:bg-amber-200 selection:text-slate-900'
        : 'bg-[#0A0A0B] text-slate-200 selection:bg-amber-500 selection:text-slate-950'
    }`}>
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
      <main className="flex-grow">
        {loadingAuth && currentTab === 'admin' ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <div className={`w-10 h-10 border-4 rounded-full animate-spin ${theme === 'light' ? 'border-slate-300 border-t-amber-500' : 'border-slate-800 border-t-amber-500'}`} />
            <span className={`text-xs font-mono uppercase tracking-widest ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'}`}>Verifying secure profile...</span>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <PageTransition key={currentTab}>
              {renderActiveScreen()}
            </PageTransition>
          </AnimatePresence>
        )}
      </main>

      {/* Footer Navigation section */}
      <Footer 
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab !== 'projects') setSelectedProjectId(null); // Reset selection
        }} 
      />

      {/* Floating Interactive Live Hub widget */}
      <FloatingContactHub />

      {/* Enterprise AI Voice Assistant Narrator */}
      <FloatingVoiceAssistant />

      {/* Multi-Tenant SaaS Modals */}
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

      {/* Global Follow Us on Social Media Modal */}
      <FollowUsModal 
        isOpen={isFollowModalOpen} 
        onClose={closeFollowModal}
        isAdmin={Boolean(dbUser && (dbUser.role === 'admin' || dbUser.role === 'staff'))}
        onNavigateToAdminCms={() => setCurrentTab('admin')}
      />
    </div>
  );
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
    const path = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);
    if (path.includes('super-admin') || params.get('tab') === 'super-admin') return 'super-admin';
    if (path.includes('saas') || path.includes('cloud') || params.get('tab') === 'saas') return 'saas-cloud';
    if (path.includes('data-deletion') || path.includes('data_deletion') || params.get('tab') === 'data-deletion' || params.get('tracking')) return 'data-deletion';
    if (path.includes('services')) return 'services';
    if (path.includes('request-a-quote') || path.includes('request-quote')) return 'request-a-quote';
    if (path.includes('schedule-consultation') || path.includes('consultation')) return 'schedule-consultation';
    if (path.includes('construction-cost-guide')) return 'construction-cost-guide';
    if (path.includes('budget-calculator')) return 'budget-calculator';
    if (path.includes('terms')) return 'terms';
    if (path.includes('privacy')) return 'privacy';
    if (path.includes('safety') || path.includes('qhse')) return 'safety';
    if (path.includes('faq') || path.includes('help')) return 'faq';
    if (path.includes('tender') || path.includes('procurement')) return 'tenders';
    if (path.includes('about')) return 'about';
    if (path.includes('projects')) return 'projects';
    if (path.includes('blog')) return 'blog';
    if (path.includes('contact')) return 'contact';
    if (path.includes('booking')) return 'booking';
    return 'home';
  });

  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [dbUser, setDbUser] = useState<User | null>(null);
  const [loadingAuth, setLoadingAuth] = useState(true);
  const [verificationToken, setVerificationToken] = useState<string>('');

  // Apply tenant branding on load and change
  useEffect(() => {
    TenantService.applyTenantBranding(currentTenant);
  }, [currentTenant]);

  // Sync contract verification tokens from query parameters
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const verifyToken = params.get('verify') || params.get('verifyToken');
    if (verifyToken) {
      setVerificationToken(verifyToken);
      setCurrentTab('verify');
    }
  }, []);

  // Sync Firebase authentication or Reviewer / Admin session tokens with our PostgreSQL user roles
  useEffect(() => {
    const reviewerToken = sessionStorage.getItem('reviewer_token') || localStorage.getItem('reviewer_token');
    if (reviewerToken) {
      setLoadingAuth(true);
      (window as any).firebaseUserToken = reviewerToken;

      const fetchReviewerWithRetry = (retries = 3, delay = 1000): Promise<any> => {
        return fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${reviewerToken}` }
        })
          .then(res => {
            if (res.ok) return res.json();
            if (res.status === 401 || res.status === 403) {
              throw new Error('Reviewer verification failed');
            }
            throw new Error(`Server returned ${res.status}`);
          })
          .catch(err => {
            if (retries > 0 && err.message !== 'Reviewer verification failed') {
              console.warn(`Reviewer verification fetch failed, retrying in ${delay}ms... (${retries} retries left)`);
              return new Promise(resolve => setTimeout(resolve, delay))
                .then(() => fetchReviewerWithRetry(retries - 1, delay * 1.5));
            }
            throw err;
          });
      };

      fetchReviewerWithRetry()
        .then(data => {
          if (data.user) {
            setDbUser(data.user);
          }
          setLoadingAuth(false);
        })
        .catch(err => {
          console.error('Reviewer login restore notice:', err);
          if (err.message === 'Reviewer verification failed') {
            sessionStorage.removeItem('reviewer_token');
            localStorage.removeItem('reviewer_token');
            setDbUser(null);
          }
          setLoadingAuth(false);
        });
      return;
    }

    const bypassToken = sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
    if (bypassToken === 'Adminmadeccgroup' || bypassToken === 'MADECC Group admin') {
      setLoadingAuth(true);

      const fetchWithRetry = (retries = 3, delay = 1000): Promise<any> => {
        return fetch('/api/auth/me', {
          headers: { 'Authorization': `Bearer ${bypassToken}` }
        })
          .then(res => {
            if (res.ok) return res.json();
            throw new Error('Verification failed');
          })
          .catch(err => {
            if (retries > 0 && err.message !== 'Verification failed') {
              console.warn(`Bypass login fetch failed, retrying in ${delay}ms... (${retries} retries left)`);
              return new Promise(resolve => setTimeout(resolve, delay))
                .then(() => fetchWithRetry(retries - 1, delay * 1.5));
            }
            throw err;
          });
      };

      fetchWithRetry()
        .then(data => {
          if (data.user) {
            setDbUser(data.user);
          }
          setLoadingAuth(false);
        })
        .catch(err => {
          console.error('Bypass login restore failed:', err);
          if (err.message === 'Verification failed' || err.message.includes('Unauthorized')) {
            sessionStorage.removeItem('admin_token');
          }
          setDbUser(null);
          setLoadingAuth(false);
        });
      return;
    }

    // Check for stored admin token or reviewer session on app initialization
    const storedAdminToken = sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
    const storedReviewerToken = sessionStorage.getItem('reviewer_token') || localStorage.getItem('reviewer_token');
    const initialToken = storedAdminToken || storedReviewerToken;

    if (initialToken) {
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${initialToken}` }
      })
        .then(res => res.json())
        .then(data => {
          if (data?.user) {
            setDbUser(data.user);
          }
        })
        .catch(err => {
          console.warn('Initial token validation error:', err);
        })
        .finally(() => {
          setLoadingAuth(false);
        });
    }

    // Fallback safety timer: ensure loadingAuth resolves within 1.5s even if Firebase is partitioned or slow in iframe
    const fallbackTimer = setTimeout(() => {
      setLoadingAuth(false);
    }, 1500);

    let unsubscribe = () => {};
    try {
      unsubscribe = onAuthStateChanged(
        auth,
        async (firebaseUser) => {
          if (firebaseUser) {
            try {
              const token = await firebaseUser.getIdToken();
              (window as any).firebaseUserToken = token;

              const response = await fetch('/api/auth/me', {
                headers: { 'Authorization': `Bearer ${token}` }
              });
              if (response.ok) {
                const data = await response.json();
                if (data.user) {
                  setDbUser(data.user);
                }
              }
            } catch (error) {
              console.warn('Error synchronizing authenticated profile:', error);
            }
          } else {
            // If no Firebase user, check if we have a valid admin or reviewer token before clearing
            const activeBypass = sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token') || sessionStorage.getItem('reviewer_token') || localStorage.getItem('reviewer_token');
            if (!activeBypass) {
              setDbUser(null);
              (window as any).firebaseUserToken = undefined;
            }
          }
          setLoadingAuth(false);
          clearTimeout(fallbackTimer);
        },
        (error) => {
          // Gracefully capture network request errors (e.g. auth/network-request-failed or offline iframe)
          console.warn('Firebase onAuthStateChanged network notice:', error?.message || error);
          setLoadingAuth(false);
          clearTimeout(fallbackTimer);
        }
      );
    } catch (err) {
      console.warn('Firebase auth initialization warning:', err);
      setLoadingAuth(false);
    }

    return () => {
      clearTimeout(fallbackTimer);
      unsubscribe();
    };
  }, []);

  // Scroll to top of page whenever tab transitions occur & sync URL path
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });

    if (currentTab === 'data-deletion') {
      if (window.location.pathname !== '/data-deletion') {
        window.history.pushState({ tab: 'data-deletion' }, '', '/data-deletion');
      }
    } else if (currentTab === 'home' && window.location.pathname === '/data-deletion') {
      window.history.pushState({}, '', '/');
    }
  }, [currentTab, selectedProjectId]);

  // Support browser Back/Forward navigation
  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname.toLowerCase();
      if (path.includes('data-deletion')) {
        setCurrentTab('data-deletion');
      }
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
