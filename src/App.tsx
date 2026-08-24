import React, { useState, useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './lib/firebase.ts';
import { User } from './types.ts';

// Layout & Core Global Components
import Navbar from './components/Navbar.tsx';
import Footer from './components/Footer.tsx';
import FloatingContactHub from './components/FloatingContactHub.tsx';
import FloatingVoiceAssistant from './components/FloatingVoiceAssistant.tsx';
import SEOHandler from './components/SEOHandler.tsx';

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

import { ThemeProvider, useTheme } from './lib/ThemeContext.tsx';
import { LanguageProvider } from './lib/LanguageContext.tsx';

function AppContent({
  currentTab,
  setCurrentTab,
  selectedProjectId,
  setSelectedProjectId,
  dbUser,
  setDbUser,
  loadingAuth,
  verificationToken,
  setVerificationToken
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
}) {
  const { theme } = useTheme();
  const [preselectedService, setPreselectedService] = useState<string>('');

  const handleNavigateWithState = (tab: string, extraState?: any) => {
    if (extraState?.selectedService) {
      setPreselectedService(extraState.selectedService);
    }
    setCurrentTab(tab);
  };

  const renderActiveScreen = () => {
    switch (currentTab) {
      case 'home':
        return (
          <Home 
            setCurrentTab={setCurrentTab} 
            setSelectedProjectId={setSelectedProjectId} 
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
      <SEOHandler currentTab={currentTab} selectedProjectId={selectedProjectId} />
      
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
      />

      {/* Main Content View with transition wrapper */}
      <main className="flex-grow">
        {loadingAuth ? (
          <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
            <div className={`w-10 h-10 border-4 rounded-full animate-spin ${theme === 'light' ? 'border-slate-300 border-t-amber-500' : 'border-slate-800 border-t-amber-500'}`} />
            <span className={`text-xs font-mono uppercase tracking-widest ${theme === 'light' ? 'text-slate-400' : 'text-slate-500'}`}>Verifying secure profile...</span>
          </div>
        ) : (
          renderActiveScreen()
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

    </div>
  );
}

export default function App() {
  const [currentTab, setCurrentTab] = useState<string>(() => {
    const path = window.location.pathname.toLowerCase();
    const params = new URLSearchParams(window.location.search);
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
    const reviewerToken = sessionStorage.getItem('reviewer_token');
    if (reviewerToken) {
      setLoadingAuth(true);
      fetch('/api/auth/me', {
        headers: { 'Authorization': `Bearer ${reviewerToken}` }
      })
        .then(res => {
          if (res.ok) return res.json();
          throw new Error('Reviewer verification failed');
        })
        .then(data => {
          if (data.user) {
            setDbUser(data.user);
          }
          setLoadingAuth(false);
        })
        .catch(err => {
          console.error('Reviewer login restore failed:', err);
          sessionStorage.removeItem('reviewer_token');
          setDbUser(null);
          setLoadingAuth(false);
        });
      return;
    }

    const bypassToken = sessionStorage.getItem('admin_token');
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
          // Only remove token if it was a definitive verification rejection, not a temporary network failure
          if (err.message === 'Verification failed' || err.message.includes('Unauthorized')) {
            sessionStorage.removeItem('admin_token');
          }
          setDbUser(null);
          setLoadingAuth(false);
        });
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoadingAuth(true);
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
          console.error('Error synchronizing authenticated profile:', error);
        }
      } else {
        setDbUser(null);
        (window as any).firebaseUserToken = undefined;
      }
      setLoadingAuth(false);
    });

    return () => unsubscribe();
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

  // Handle instant redirect if admin/staff/reviewer role is revoked during sandbox toggling
  useEffect(() => {
    if (currentTab === 'admin') {
      if (!dbUser || (dbUser.role !== 'admin' && dbUser.role !== 'staff' && dbUser.role !== 'social_media_reviewer')) {
        setCurrentTab('home');
      }
    }
  }, [dbUser, currentTab]);

  return (
    <LanguageProvider>
      <ThemeProvider dbUser={dbUser}>
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
        />
      </ThemeProvider>
    </LanguageProvider>
  );
}
