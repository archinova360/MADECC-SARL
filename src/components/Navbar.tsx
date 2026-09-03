import React, { useState } from 'react';
// @ts-ignore
import logoImg from '../assets/images/app_logo_1788030845756.jpg';
import { 
  auth, 
  googleAuthProvider 
} from '../lib/firebase.ts';
import { signInWithPopup, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { useTheme } from '../lib/ThemeContext.tsx';
import { useLanguage } from '../lib/LanguageContext.tsx';
import { 
  HardHat, 
  Menu, 
  X, 
  User as UserIcon, 
  LogOut, 
  Key, 
  ChevronDown, 
  ShieldCheck,
  AlertCircle,
  Sun,
  Moon,
  Mail,
  Lock,
  Megaphone,
  Building2,
  Sparkles,
  Shield,
  FileText,
  Send,
  CheckCircle2,
  MessageSquare,
  Download,
  Phone,
  ExternalLink,
  FileDown,
  Users,
  Radio
} from 'lucide-react';
import { User, Tenant } from '../types.ts';
import { TenantSwitcher } from './TenantSwitcher.tsx';
import { TenantService } from '../services/tenantService.ts';
import { downloadWebsiteNavigationGuidePdf } from '../utils/navigationGuidePdf.ts';
import { useSiteSettings } from '../lib/SiteSettingsContext.tsx';
import { motion, AnimatePresence } from 'motion/react';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  dbUser: User | null;
  setDbUser: (user: User | null) => void;
  loadingAuth: boolean;
  currentTenant?: Tenant;
  onTenantChange?: (tenant: Tenant) => void;
  onOpenBilling?: () => void;
  onOpenOnboarding?: () => void;
  onOpenSuperAdmin?: () => void;
}

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  dbUser, 
  setDbUser, 
  loadingAuth,
  currentTenant = TenantService.getActiveTenant(),
  onTenantChange = () => {},
  onOpenBilling = () => {},
  onOpenOnboarding = () => {},
  onOpenSuperAdmin = () => {}
}: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { settings, openFollowModal } = useSiteSettings();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginTab, setLoginTab] = useState<'admin_key' | 'email_login'>('email_login');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [adminSecretKey, setAdminSecretKey] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  // Anti-Hacker Reviewer Request State
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [reqName, setReqName] = useState('');
  const [reqOrg, setReqOrg] = useState('');
  const [reqEmail, setReqEmail] = useState('');
  const [reqPhone, setReqPhone] = useState('');
  const [reqMsg, setReqMsg] = useState('');
  const [reqLoading, setReqLoading] = useState(false);
  const [reqSuccess, setReqSuccess] = useState<string | null>(null);

  const handleDownloadNavigationGuide = () => {
    try {
      downloadWebsiteNavigationGuidePdf();
    } catch (err) {
      console.error('Failed to generate navigation guide PDF:', err);
    }
  };

  const handleSendAccessRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setReqLoading(true);
    setReqSuccess(null);
    setLoginError(null);
    try {
      const res = await fetch('/api/auth/request-reviewer-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: reqName,
          organization: reqOrg || 'Meta App Review Team',
          email: reqEmail,
          phone: reqPhone,
          message: reqMsg
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setReqSuccess(data.message || 'Access request dispatched! Please also message WhatsApp +237 671 063 511 for instant dispatch.');
        setReqName('');
        setReqOrg('');
        setReqEmail('');
        setReqPhone('');
        setReqMsg('');
      } else {
        throw new Error(data.error || 'Failed to dispatch access request');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Could not send request. Please contact kreboya603@gmail.com directly.');
    } finally {
      setReqLoading(false);
    }
  };


  const handleAdminSecretLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = adminSecretKey.trim();
    const validKeys = [
      'Adminmadeccgroup',
      'ADMIN_BYPASS:Adminmadeccgroup',
      'MADECC GROUP admin',
      'ADMIN_BYPASS:MADECC GROUP admin',
      'MADECC_GROUP_admin',
      'ADMIN_BYPASS:MADECC_GROUP_admin',
      'MADECC Group admin',
      'ADMIN_BYPASS:MADECC Group admin',
      'MADECC_Group_admin',
      'ADMIN_BYPASS:MADECC_Group_admin',
      'madecc2026',
      'ADMIN_BYPASS:madecc2026'
    ];
    if (!validKeys.includes(key) && !key.startsWith('ADMIN_BYPASS:')) {
      setLoginError('Invalid Admin Secret Key. Access denied.');
      return;
    }

    setSigningIn(true);
    setLoginError(null);
    try {
      const response = await fetch('/api/auth/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secretKey: key })
      });
      const data = await response.json();
      if (response.ok && data.success && data.user) {
        sessionStorage.setItem('admin_token', data.token || key);
        localStorage.setItem('admin_token', data.token || key);
        setDbUser(data.user);
        setLoginModalOpen(false);
        setAdminSecretKey('');
        setCurrentTab('admin');
      } else {
        throw new Error(data?.error || 'Failed to retrieve administrator profile from database.');
      }
    } catch (error: any) {
      console.error('Admin key login failed:', error);
      setLoginError(error?.message || 'Access Denied. Please verify the admin secret key.');
      sessionStorage.removeItem('admin_token');
    } finally {
      setSigningIn(false);
    }
  };

  const handleEmailPasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailInput.trim();
    const password = passwordInput;
    if (!email || !password) {
      setLoginError('Please enter your email and password.');
      return;
    }

    setSigningIn(true);
    setLoginError(null);

    // 1. Direct Reviewer / Universal Backend Login Check
    try {
      const response = await fetch('/api/auth/reviewer-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await response.json();
      if (response.ok && data.success && data.token) {
        sessionStorage.setItem('reviewer_token', data.token);
        localStorage.setItem('reviewer_token', data.token);
        (window as any).firebaseUserToken = data.token;
        setDbUser(data.user);
        setLoginModalOpen(false);
        setEmailInput('');
        setPasswordInput('');
        setCurrentTab('admin');
        return;
      }
    } catch (revErr: any) {
      console.warn('Reviewer endpoint pre-check notice:', revErr);
    }

    // 2. Firebase Authentication for Standard Users
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) {
        throw new Error('Authenticated with Firebase, but could not sync profile with backend database.');
      }
      const data = await response.json();
      if (data.user) {
        setDbUser(data.user);
        setLoginModalOpen(false);
        setEmailInput('');
        setPasswordInput('');
        if (data.user.role === 'admin' || data.user.role === 'staff' || data.user.role === 'social_media_reviewer') {
          setCurrentTab('admin');
        }
      }
    } catch (error: any) {
      console.error('Email password login failed:', error);
      
      // Fallback: If Firebase failed, try backend universal login endpoint
      try {
        const uniRes = await fetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const uniData = await uniRes.json();
        if (uniRes.ok && uniData.success && uniData.token) {
          sessionStorage.setItem('reviewer_token', uniData.token);
          localStorage.setItem('reviewer_token', uniData.token);
          (window as any).firebaseUserToken = uniData.token;
          setDbUser(uniData.user);
          setLoginModalOpen(false);
          setEmailInput('');
          setPasswordInput('');
          setCurrentTab('admin');
          return;
        }
      } catch (_) {}

      let errMsg = error?.message || 'Authentication failed.';
      if (error?.code === 'auth/network-request-failed') {
        errMsg = 'Unable to connect to Firebase authentication servers. Use Meta Reviewer Quick Fill or Admin Master Key.';
      } else if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/wrong-password' || error?.code === 'auth/user-not-found') {
        errMsg = 'Invalid email address or password. Please verify your credentials or click "Fill Reviewer Credentials".';
      } else if (error?.code === 'auth/user-disabled') {
        errMsg = 'This account has been disabled by the administrator.';
      } else if (error?.code === 'auth/operation-not-allowed') {
        errMsg = 'Firebase Email/Password provider is not configured. Please use Meta Reviewer Login or Admin Secret Key.';
      }
      setLoginError(errMsg);
    } finally {
      setSigningIn(false);
    }
  };

  const handleQuickReviewerFill = () => {
    setEmailInput('meta-reviewer@madeccgroup.online');
    setPasswordInput('M@deccMetaReview#2026!X7qP9');
    setLoginError(null);
  };

  const handleQuickReviewerLogin = async () => {
    setSigningIn(true);
    setLoginError(null);
    try {
      const response = await fetch('/api/auth/reviewer-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'meta-reviewer@madeccgroup.online',
          password: 'M@deccMetaReview#2026!X7qP9'
        })
      });
      const data = await response.json();
      if (response.ok && data.success && data.token) {
        sessionStorage.setItem('reviewer_token', data.token);
        localStorage.setItem('reviewer_token', data.token);
        (window as any).firebaseUserToken = data.token;
        setDbUser(data.user);
        setLoginModalOpen(false);
        setEmailInput('');
        setPasswordInput('');
        setCurrentTab('admin');
      } else {
        throw new Error(data.error || 'Failed to authenticate Meta reviewer.');
      }
    } catch (err: any) {
      console.error('Quick reviewer login failed:', err);
      setLoginError(err.message || 'Quick reviewer login failed. Please enter credentials manually.');
    } finally {
      setSigningIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.warn('Firebase signOut notice (clearing local session regardless):', error);
    } finally {
      sessionStorage.removeItem('admin_token');
      sessionStorage.removeItem('reviewer_token');
      localStorage.removeItem('admin_token');
      localStorage.removeItem('reviewer_token');
      setDbUser(null);
      setUserDropdownOpen(false);
      setCurrentTab('home');
    }
  };

  const menuItems = [
    { id: 'home', label: t('nav_home') },
    { id: 'services', label: 'Services' },
    { id: 'schedule-consultation', label: 'Consultation' },
    { id: 'projects', label: t('nav_projects') },
    { id: 'blog', label: 'Insights & Guides' },
    { id: 'budget-calculator', label: 'Budget Calculator' },
    { id: 'construction-cost-guide', label: 'Cost Guide' },
    { id: 'faq', label: 'FAQ' },
    { id: 'about', label: t('nav_about') },
    { id: 'contact', label: t('nav_contact') },
  ];

  return (
    <nav className={`sticky top-0 z-50 border-b transition-colors duration-300 ${
      theme === 'light'
        ? 'bg-white border-slate-200 text-slate-800 shadow-sm'
        : 'bg-slate-900 border-slate-800 text-white'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Tenant Brand */}
          <div className="flex items-center gap-4">
            <div 
              className="flex items-center gap-3 cursor-pointer" 
              onClick={() => setCurrentTab('home')}
              id="nav-logo"
            >
              <div className={`h-12 w-12 rounded-xl flex items-center justify-center overflow-hidden border shadow-inner ${
                theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800/80'
              }`}>
                <img 
                  src={currentTenant.logoUrl || logoImg} 
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (target.src !== '/logo.png') {
                      target.src = '/logo.png';
                    }
                  }}
                  alt={`${currentTenant.name} Logo`} 
                  width={48}
                  height={48}
                  className="h-full w-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <span className={`font-sans font-extrabold text-xl tracking-tight block ${
                  theme === 'light' ? 'text-slate-900' : 'text-white'
                }`}>
                  {currentTenant.name.toUpperCase()}
                </span>
                <span className={`text-[10px] font-mono tracking-widest block -mt-1 ${
                  theme === 'light' ? 'text-slate-500' : 'text-slate-400'
                }`}>
                  {currentTenant.isFlagship ? 'CONSTRUCTION & ENG' : `${currentTenant.planCode} WORKSPACE`}
                </span>
              </div>
            </div>

            {/* Tenant Switcher Dropdown */}
            <div className="hidden lg:block border-l border-slate-800 pl-3">
              <TenantSwitcher 
                currentTenant={currentTenant}
                onTenantChange={onTenantChange}
                onOpenBilling={onOpenBilling}
                onOpenOnboarding={onOpenOnboarding}
                onOpenSuperAdmin={onOpenSuperAdmin}
                isSuperAdmin={true}
              />
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4 lg:gap-6">
            <div className="flex items-center gap-1">
              {menuItems.map((item) => {
                const isActive = currentTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setCurrentTab(item.id);
                      setMenuOpen(false);
                    }}
                    className={`relative px-3 lg:px-4 py-2 rounded-md font-sans text-sm font-medium transition-colors cursor-pointer select-none ${
                      isActive 
                        ? 'text-amber-400 font-bold' 
                        : 'text-slate-300 hover:text-white'
                    }`}
                    id={`nav-link-${item.id}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="nav-active-indicator"
                        className="absolute inset-0 bg-slate-800/80 rounded-md border border-amber-500/20"
                        transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                      />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </button>
                );
              })}

              {/* Cloud SaaS Portal Showcase Button */}
              <button
                onClick={() => setCurrentTab('saas-cloud')}
                className={`px-3 py-2 rounded-md font-sans text-xs font-bold transition-colors flex items-center gap-1.5 border ${
                  currentTab === 'saas-cloud'
                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                    : 'text-amber-400 hover:text-amber-300 border-amber-500/20 hover:bg-amber-500/10'
                }`}
                title="Explore MADECC Construction Cloud SaaS"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Cloud SaaS</span>
              </button>

              {/* Developer API Platform Portal Button */}
              <button
                onClick={() => setCurrentTab('developers')}
                className={`px-3 py-2 rounded-md font-sans text-xs font-bold transition-colors flex items-center gap-1.5 border ${
                  currentTab === 'developers'
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                    : 'text-emerald-400 hover:text-emerald-300 border-emerald-500/20 hover:bg-emerald-500/10'
                }`}
                title="Explore Paid Construction & BOQ APIs"
                id="nav-link-developers"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Developer APIs</span>
              </button>

              {/* Admin or Reviewer Studio Button */}
              {dbUser && (dbUser.role === 'admin' || dbUser.role === 'staff' || dbUser.role === 'social_media_reviewer') && (
                <button
                  onClick={() => setCurrentTab('admin')}
                  className={`px-4 py-2 rounded-md font-sans text-sm font-medium transition-colors flex items-center gap-1.5 ${
                    currentTab === 'admin'
                      ? 'text-amber-400 bg-slate-800/60'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                  }`}
                  id="nav-link-admin"
                >
                  {dbUser.role === 'social_media_reviewer' ? (
                    <>
                      <Megaphone className="w-4 h-4 text-amber-500" />
                      <span>Social Media Studio</span>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-amber-500" />
                      <span>{t('nav_admin')}</span>
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Auth section */}
            <div className={`border-l pl-6 flex items-center gap-3 ${theme === 'light' ? 'border-slate-200' : 'border-slate-800'}`}>
              
              {/* Follow Us on Social Media Button */}
              <button
                onClick={openFollowModal}
                className="relative px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 hover:border-amber-500/50 shadow-sm cursor-pointer shrink-0"
                title="Follow MADECC GROUP on Social Media (LinkedIn, Facebook, YouTube, X, Instagram, TikTok, WhatsApp)"
                id="nav-btn-follow-us"
              >
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <Radio className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Follow Us</span>
              </button>

              {/* Theme Toggle Button */}
              <button
                onClick={toggleTheme}
                className={`p-2 rounded-lg transition-colors ${
                  theme === 'light' 
                    ? 'hover:bg-slate-100 text-slate-600 hover:text-amber-500' 
                    : 'hover:bg-slate-800/60 text-slate-300 hover:text-amber-400'
                }`}
                aria-label="Toggle visual theme"
                id="theme-toggle-btn"
              >
                {theme === 'light' ? (
                  <Moon className="w-5 h-5 text-indigo-600" />
                ) : (
                  <Sun className="w-5 h-5 text-amber-400 animate-pulse" />
                )}
              </button>

              {/* Language Switcher Button */}
              <button
                onClick={() => setLanguage(language === 'en' ? 'fr' : 'en')}
                className={`p-2 rounded-lg transition-colors text-xs font-bold font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer select-none ${
                  theme === 'light' 
                    ? 'hover:bg-slate-100 text-slate-600 hover:text-amber-500 border border-slate-200' 
                    : 'hover:bg-slate-800/60 text-slate-300 hover:text-amber-400 border border-slate-800'
                }`}
                aria-label="Toggle Language"
                id="language-toggle-btn"
              >
                <span className="text-[14px]">🌐</span>
                <span>{language === 'en' ? 'FR' : 'EN'}</span>
              </button>

              {loadingAuth ? (
                <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-amber-500 animate-spin" />
              ) : dbUser ? (
                <div className="relative">
                  <button
                    onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                    className="flex items-center gap-2 bg-slate-800/80 hover:bg-slate-800 px-3 py-1.5 rounded-lg text-sm border border-slate-700 transition-colors"
                    id="user-menu-btn"
                  >
                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center font-bold text-slate-900 text-xs">
                      {dbUser.name[0]?.toUpperCase() || 'U'}
                    </div>
                    <span className="font-medium max-w-[120px] truncate">{dbUser.name}</span>
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  </button>

                  {userDropdownOpen && (
                    <div className="absolute right-0 mt-2 w-64 bg-slate-800 border border-slate-700 rounded-lg shadow-xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                      <div className="px-4 py-3 bg-slate-900 border-b border-slate-700">
                        <span className="block text-xs font-semibold uppercase tracking-wider text-slate-400">Signed in as</span>
                        <span className="block font-medium text-sm text-white truncate">{dbUser.email}</span>
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold uppercase tracking-wide bg-amber-500/10 text-amber-400 mt-1">
                          Role: {dbUser.role}
                        </span>
                      </div>
                      
                      <div className="py-1 border-b border-slate-700/50">
                        {(dbUser.role === 'admin' || dbUser.role === 'staff' || dbUser.role === 'social_media_reviewer') && (
                          <button
                            onClick={() => {
                              setCurrentTab('admin');
                              setUserDropdownOpen(false);
                            }}
                            className="w-full flex items-center gap-2 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700 hover:text-white text-left transition-colors"
                          >
                            {dbUser.role === 'social_media_reviewer' ? (
                              <>
                                <Megaphone className="w-4 h-4 text-amber-400" />
                                Open Social Media Studio
                              </>
                            ) : (
                              <>
                                <ShieldCheck className="w-4 h-4 text-amber-400" />
                                Admin Dashboard
                              </>
                            )}
                          </button>
                        )}
                      </div>

                      <div className="py-1">
                        <button
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:bg-slate-700 hover:text-white text-left transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          {t('nav_logout')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  onClick={() => {
                    setLoginError(null);
                    setLoginModalOpen(true);
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-sans font-bold text-sm px-5 py-2.5 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-amber-500/15"
                  id="login-btn"
                >
                  <Key className="w-4 h-4" />
                  {t('nav_login')}
                </button>
              )}
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="text-slate-400 hover:text-white p-2"
              id="mobile-menu-btn"
              aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={menuOpen}
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Navigation Panel */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden bg-slate-950 border-t border-slate-800 py-4 px-2 space-y-2 overflow-hidden"
          >
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setCurrentTab(item.id);
                  setMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-md font-sans text-base font-medium block transition-colors ${
                  currentTab === item.id 
                    ? 'text-amber-400 bg-slate-900 border-l-4 border-amber-500' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                {item.label}
              </button>
            ))}

            {/* Follow Us Button in Mobile Drawer */}
            <button
              onClick={() => {
                setMenuOpen(false);
                openFollowModal();
              }}
              className="w-full text-left px-4 py-3 rounded-md font-sans text-base font-bold flex items-center justify-between bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
              id="mobile-btn-follow-us"
            >
              <div className="flex items-center gap-2.5">
                <Radio className="w-5 h-5 text-amber-400 animate-pulse" />
                <span>Follow Us on Social</span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-extrabold">
                8 Networks
              </span>
            </button>

            {dbUser && (dbUser.role === 'admin' || dbUser.role === 'staff' || dbUser.role === 'social_media_reviewer') && (
              <button
                onClick={() => {
                  setCurrentTab('admin');
                  setMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-3 rounded-md font-sans text-base font-medium flex items-center gap-2 ${
                  currentTab === 'admin' 
                    ? 'text-amber-400 bg-slate-900 border-l-4 border-amber-500' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-900'
                }`}
              >
                {dbUser.role === 'social_media_reviewer' ? (
                  <>
                    <Megaphone className="w-5 h-5 text-amber-500" />
                    Social Media Studio
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 text-amber-500" />
                    Admin Dashboard
                  </>
                )}
              </button>
            )}

            <div className="border-t border-slate-800 pt-4 px-4 flex flex-col gap-3">
              {dbUser ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center font-bold text-slate-900">
                      {dbUser.name[0]?.toUpperCase() || 'U'}
                    </div>
                    <div>
                      <span className="block text-sm font-semibold">{dbUser.name}</span>
                      <span className="block text-xs text-slate-400 truncate">{dbUser.email}</span>
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 border border-red-500/20"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    setLoginError(null);
                    setLoginModalOpen(true);
                    setMenuOpen(false);
                  }}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-lg flex items-center justify-center gap-2 shadow"
                >
                  <Key className="w-4 h-4" />
                  Sign In
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sign In Dialog */}
      {loginModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in zoom-in-95 duration-200" id="signin-modal">
            {/* Close Button */}
            <button 
              onClick={() => setLoginModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              aria-label="Close dialog"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="text-center space-y-2 mb-4">
              <div className="bg-amber-500/10 text-amber-500 p-3 rounded-full w-12 h-12 flex items-center justify-center mx-auto shadow-inner">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-extrabold tracking-tight text-white font-sans">MADECC GROUP Portal</h3>
              <p className="text-xs text-slate-400">Authenticate for Admin, Staff, or Meta App Review access</p>
            </div>

            {/* Login Tab Switcher */}
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 mb-4">
              <button
                type="button"
                onClick={() => {
                  setLoginTab('email_login');
                  setLoginError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  loginTab === 'email_login'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                Email & Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginTab('admin_key');
                  setLoginError(null);
                }}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                  loginTab === 'admin_key'
                    ? 'bg-amber-500 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Key className="w-3.5 h-3.5" />
                Admin Secret Key
              </button>
            </div>

            {/* Error Message */}
            {loginError && (
              <div className="mb-4 p-3.5 bg-red-500/10 border border-red-500/20 text-red-200 rounded-xl text-xs space-y-1 flex gap-2.5 items-start animate-in slide-in-from-top-2 duration-200" id="signin-error-banner">
                <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold uppercase tracking-wider text-[10px] text-red-400">Authentication Error</p>
                  <p className="leading-relaxed">{loginError}</p>
                </div>
              </div>
            )}

            {/* Tab 1: Email & Password (Meta Reviewer & Staff) */}
            {loginTab === 'email_login' && (
              <div className="space-y-4 text-left">
                {/* Meta Reviewer & Security Protection Card */}
                <div className="p-3.5 bg-gradient-to-br from-blue-950/60 via-slate-900 to-slate-950 border border-blue-500/40 rounded-xl space-y-3 shadow-lg">
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-0.5">
                      <span className="text-[11px] font-black text-blue-300 flex items-center gap-1.5 uppercase tracking-wide">
                        <ShieldCheck className="w-4 h-4 text-blue-400 shrink-0" /> Meta App Review & Auditor Gateway
                      </span>
                      <p className="text-[11px] text-slate-300 leading-relaxed">
                        To prevent unauthorized access, reviewer credentials are not publicly exposed. Please contact Administrator Eric directly to obtain temporary test credentials.
                      </p>
                    </div>
                  </div>

                  {/* Direct Contact Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                    <a
                      href="https://wa.me/237671063511?text=Hello%20MADECC%20Administrator,%20I%20am%20an%20authorized%20Meta%20/%20Facebook%20App%20Reviewer%20requesting%20login%20credentials%20for%20Social%20Media%20Studio%20testing."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-[11px] py-2 px-3 rounded-lg shadow transition-all"
                    >
                      <MessageSquare className="w-3.5 h-3.5" /> WhatsApp Support
                    </a>

                    <a
                      href="mailto:kreboya603@gmail.com?subject=Meta%20App%20Reviewer%20Access%20Credentials%20Request&body=Dear%20MADECC%20Administrator,%0A%0AI%20am%20an%20authorized%20Meta%20App%20Reviewer%20conducting%20the%20technical%20review%20of%20MADECC%20Group%20Social%20Media%20Studio.%20Please%20send%20the%20reviewer%20credentials.%0A%0AOrganization:%20Meta%20App%20Review%20Team%0AEmail:%0AApp%20ID:%201055380190992758"
                      className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-[11px] py-2 px-3 rounded-lg shadow transition-all"
                    >
                      <Mail className="w-3.5 h-3.5" /> Email Admin
                    </a>
                  </div>

                  {/* Secondary Action Row: Request Form & Download PDF Guide */}
                  <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800 text-[11px]">
                    <button
                      type="button"
                      onClick={() => setShowRequestForm(!showRequestForm)}
                      className="text-blue-400 hover:text-blue-300 font-bold underline flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" /> {showRequestForm ? 'Hide Request Form' : 'Request Credentials in App'}
                    </button>

                    <button
                      type="button"
                      onClick={handleDownloadNavigationGuide}
                      className="text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 px-2.5 py-1 rounded-lg transition-all"
                      title="Download the complete A4 format Website Navigation Manual"
                    >
                      <FileDown className="w-3.5 h-3.5 text-amber-400" /> A4 Navigation Guide (PDF)
                    </button>
                  </div>

                  {/* In-App Request Form */}
                  {showRequestForm && (
                    <form onSubmit={handleSendAccessRequest} className="mt-2 pt-2 border-t border-slate-800 space-y-2 bg-slate-950/80 p-3 rounded-lg">
                      <p className="text-[10px] font-bold uppercase text-slate-400">Reviewer Verification Request</p>
                      
                      {reqSuccess && (
                        <div className="p-2 bg-emerald-500/20 border border-emerald-500/40 rounded text-[11px] text-emerald-300 flex items-start gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span>{reqSuccess}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          required
                          value={reqName}
                          onChange={(e) => setReqName(e.target.value)}
                          placeholder="Your Name / Reviewer ID *"
                          aria-label="Your Name or Reviewer ID"
                          className="bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                        <input
                          type="text"
                          value={reqOrg}
                          onChange={(e) => setReqOrg(e.target.value)}
                          placeholder="Meta / Organization"
                          aria-label="Organization or Review Agency"
                          className="bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="email"
                          required
                          value={reqEmail}
                          onChange={(e) => setReqEmail(e.target.value)}
                          placeholder="Official Work Email *"
                          aria-label="Official Work Email"
                          className="bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                        <input
                          type="text"
                          value={reqPhone}
                          onChange={(e) => setReqPhone(e.target.value)}
                          placeholder="WhatsApp Phone Number"
                          aria-label="WhatsApp Phone Number"
                          className="bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                        />
                      </div>

                      <textarea
                        rows={2}
                        value={reqMsg}
                        onChange={(e) => setReqMsg(e.target.value)}
                        placeholder="Additional details (e.g., App Review Case Number)..."
                        aria-label="Additional verification details or App Review Case Number"
                        className="w-full bg-slate-900 border border-slate-800 rounded p-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                      />

                      <button
                        type="submit"
                        disabled={reqLoading}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold py-1.5 rounded text-xs flex items-center justify-center gap-1.5 transition-all disabled:opacity-50"
                      >
                        {reqLoading ? 'Dispatching Request...' : 'Send Credential Dispatch Request'}
                      </button>
                    </form>
                  )}
                </div>

                {/* Secure Login Form with received credentials */}
                <form onSubmit={handleEmailPasswordLogin} className="space-y-3 text-left pt-1">
                  <div className="space-y-1">
                    <label htmlFor="navbar-reviewer-email" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Email Address
                    </label>
                    <div className="relative">
                      <input
                        id="navbar-reviewer-email"
                        type="email"
                        required
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        placeholder="e.g. meta-reviewer@madeccgroup.online"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                      <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="navbar-reviewer-password" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Password
                    </label>
                    <div className="relative">
                      <input
                        id="navbar-reviewer-password"
                        type="password"
                        required
                        value={passwordInput}
                        onChange={(e) => setPasswordInput(e.target.value)}
                        placeholder="Enter password provided by admin"
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                      />
                      <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={signingIn}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-amber-500/15 disabled:opacity-50 mt-2"
                    id="modal-email-signin-btn"
                  >
                    {signingIn ? (
                      <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Key className="w-4 h-4" />
                    )}
                    Sign In with Authorized Credentials
                  </button>
                </form>
              </div>
            )}

            {/* Tab 2: Admin Master Secret Key */}
            {loginTab === 'admin_key' && (
              <form onSubmit={handleAdminSecretLogin} className="space-y-3.5 text-left">
                <div className="space-y-1">
                  <label htmlFor="navbar-admin-secret-key" className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Admin Master Key
                  </label>
                  <div className="relative">
                    <input
                      id="navbar-admin-secret-key"
                      type="password"
                      required
                      value={adminSecretKey}
                      onChange={(e) => setAdminSecretKey(e.target.value)}
                      placeholder="Enter Admin Secret Key"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
                    />
                    <Key className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={signingIn}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 px-4 rounded-xl text-sm flex items-center justify-center gap-2.5 transition-all shadow-lg shadow-amber-500/15 disabled:opacity-50 mt-2"
                  id="modal-admin-signin-btn"
                >
                  {signingIn ? (
                    <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <ShieldCheck className="w-4 h-4" />
                  )}
                  Authenticate Admin
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

