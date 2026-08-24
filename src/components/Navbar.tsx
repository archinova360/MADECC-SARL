import React, { useState } from 'react';
// @ts-ignore
import logoImg from '../assets/images/madecc_logo_1783370981722.jpg';
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
  Megaphone
} from 'lucide-react';
import { User } from '../types.ts';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  dbUser: User | null;
  setDbUser: (user: User | null) => void;
  loadingAuth: boolean;
}

export default function Navbar({ 
  currentTab, 
  setCurrentTab, 
  dbUser, 
  setDbUser, 
  loadingAuth 
}: NavbarProps) {
  const { theme, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const [loginTab, setLoginTab] = useState<'admin_key' | 'email_login'>('email_login');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [signingIn, setSigningIn] = useState(false);
  const [adminSecretKey, setAdminSecretKey] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');

  const handleAdminSecretLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const key = adminSecretKey.trim();
    if (key !== 'Adminmadeccgroup' && key !== 'MADECC Group admin') {
      setLoginError('Invalid Admin Secret Key. Access denied.');
      return;
    }

    setSigningIn(true);
    setLoginError(null);
    try {
      sessionStorage.setItem('admin_token', key);
      
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${key}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to retrieve administrator profile from database.');
      }
      const data = await response.json();
      if (data.user) {
        setDbUser(data.user);
        setLoginModalOpen(false);
        setAdminSecretKey('');
        setCurrentTab('admin');
      } else {
        throw new Error('No user data returned.');
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

    // Dedicated Non-Firebase Reviewer Route Check
    const normalizedEmail = email.toLowerCase();
    if (normalizedEmail === 'meta-reviewer@madeccgroup.online' || normalizedEmail.includes('reviewer')) {
      try {
        const response = await fetch('/api/auth/reviewer-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const data = await response.json();
        if (response.ok && data.success && data.token) {
          sessionStorage.setItem('reviewer_token', data.token);
          setDbUser(data.user);
          setLoginModalOpen(false);
          setEmailInput('');
          setPasswordInput('');
          setCurrentTab('admin');
          return;
        } else {
          throw new Error(data.error || 'Invalid reviewer credentials');
        }
      } catch (revErr: any) {
        console.error('Reviewer direct login failed:', revErr);
        setLoginError(revErr.message || 'Invalid reviewer email or password');
        return;
      } finally {
        setSigningIn(false);
      }
    }

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
      
      // Fallback: If Firebase failed with auth/operation-not-allowed or user-not-found, try reviewer-login endpoint as secondary check
      try {
        const revRes = await fetch('/api/auth/reviewer-login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const revData = await revRes.json();
        if (revRes.ok && revData.success && revData.token) {
          sessionStorage.setItem('reviewer_token', revData.token);
          setDbUser(revData.user);
          setLoginModalOpen(false);
          setEmailInput('');
          setPasswordInput('');
          setCurrentTab('admin');
          return;
        }
      } catch (_) {}

      let errMsg = error?.message || 'Authentication failed.';
      if (error?.code === 'auth/invalid-credential' || error?.code === 'auth/wrong-password' || error?.code === 'auth/user-not-found') {
        errMsg = 'Invalid email address or password. Please verify your credentials or contact administrator.';
      } else if (error?.code === 'auth/user-disabled') {
        errMsg = 'This account has been disabled by the administrator.';
      } else if (error?.code === 'auth/operation-not-allowed') {
        errMsg = 'Authentication provider is not enabled in Firebase. Please use Administrator Secret Key or Reviewer Login.';
      }
      setLoginError(errMsg);
    } finally {
      setSigningIn(false);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      sessionStorage.removeItem('admin_token');
      sessionStorage.removeItem('reviewer_token');
      setDbUser(null);
      setUserDropdownOpen(false);
      setCurrentTab('home');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const menuItems = [
    { id: 'home', label: t('nav_home') },
    { id: 'services', label: 'Services' },
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
          
          {/* Logo Branding */}
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => setCurrentTab('home')}
            id="nav-logo"
          >
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center overflow-hidden border shadow-inner ${
              theme === 'light' ? 'bg-slate-100 border-slate-200' : 'bg-slate-950 border-slate-800/80'
            }`}>
              <img 
                src={logoImg} 
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (target.src !== '/logo.png') {
                    target.src = '/logo.png';
                  }
                }}
                alt="MADECC Group Logo" 
                className="h-full w-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <span className={`font-sans font-extrabold text-xl tracking-tight block ${
                theme === 'light' ? 'text-slate-900' : 'text-white'
              }`}>
                MADECC<span className="text-amber-500">GROUP</span>
              </span>
              <span className={`text-[10px] font-mono tracking-widest block -mt-1 ${
                theme === 'light' ? 'text-slate-500' : 'text-slate-400'
              }`}>
                CONSTRUCTION & ENG
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            <div className="flex items-center gap-1">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMenuOpen(false);
                  }}
                  className={`px-4 py-2 rounded-md font-sans text-sm font-medium transition-colors ${
                    currentTab === item.id 
                      ? 'text-amber-400 bg-slate-800/60' 
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/40'
                  }`}
                  id={`nav-link-${item.id}`}
                >
                  {item.label}
                </button>
              ))}

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
            >
              {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Navigation Panel */}
      {menuOpen && (
        <div className="md:hidden bg-slate-950 border-t border-slate-800 py-4 px-2 space-y-2 animate-in fade-in duration-100">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setCurrentTab(item.id);
                setMenuOpen(false);
              }}
              className={`w-full text-left px-4 py-3 rounded-md font-sans text-base font-medium block ${
                currentTab === item.id 
                  ? 'text-amber-400 bg-slate-900 border-l-4 border-amber-500' 
                  : 'text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
            >
              {item.label}
            </button>
          ))}

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
        </div>
      )}

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
              <h3 className="text-xl font-extrabold tracking-tight text-white font-sans">MADECC Group Portal</h3>
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
              <form onSubmit={handleEmailPasswordLogin} className="space-y-3.5 text-left">
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
                      placeholder="Enter account password"
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
                  Sign In to Dashboard
                </button>
              </form>
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

