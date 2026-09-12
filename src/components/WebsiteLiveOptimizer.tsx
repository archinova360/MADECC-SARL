import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Sparkles, 
  Database, 
  Mail, 
  Cloud, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Send, 
  Download, 
  Eye, 
  Save, 
  Globe, 
  Phone, 
  MapPin, 
  Clock, 
  Share2, 
  Layers, 
  Cpu, 
  Server, 
  Activity, 
  ArrowRight, 
  Lock, 
  Key, 
  Copy, 
  Check, 
  ExternalLink, 
  Zap,
  Palette,
  FileText,
  Search,
  CheckCheck,
  Building,
  DollarSign,
  Radio,
  SlidersHorizontal,
  Flame,
  UserCheck
} from 'lucide-react';

interface WebsiteLiveOptimizerProps {
  currentUser?: any;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface OptimizerStatus {
  database: {
    provider: string;
    connected: boolean;
    latencyMs: number;
    activeDatabaseSessions: number;
    tableCounts: Record<string, number>;
    sessionAuthority: string;
  };
  smtp: {
    provider: string;
    canonicalUser: string;
    activeUser: string;
    host: string;
    port: number;
    isConfigured: boolean;
    isReady: boolean;
    authMode: string;
  };
  cloudinary: {
    provider: string;
    cloudName: string;
    isConfigured: boolean;
    hasApiSecret: boolean;
    features: string[];
  };
  supabase: {
    provider: string;
    urlConfigured: boolean;
    bucket: string;
    isConfigured: boolean;
  };
}

interface AuditLogItem {
  id: number;
  userId?: string;
  userEmail?: string;
  action: string;
  details: string;
  timestamp: string;
}

export const WebsiteLiveOptimizer: React.FC<WebsiteLiveOptimizerProps> = ({ currentUser, showToast }) => {
  const [activeSubTab, setActiveSubTab] = useState<'content' | 'theme' | 'seo' | 'infrastructure' | 'audit'>('content');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [refreshingStatus, setRefreshingStatus] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // System Diagnostics State
  const [status, setStatus] = useState<OptimizerStatus | null>(null);

  // Live Website Settings Form (Stored in Neon DB site_settings)
  const [settings, setSettings] = useState({
    siteName: 'MADECC GROUP',
    tagline: 'Premier Engineering, Construction & Project Management in Cameroon',
    developerName: 'Kasah Rodrick Reboya',
    phone: '+237 683 31 64 86',
    phoneSecondary: '+237 671 063 511',
    emergencyPhone: '+237 683 31 64 86',
    email: 'kreboya603@gmail.com',
    secondaryEmail: 'Infomadeccconstruction@gmail.com',
    officeAddressYaounde: 'Mbankolo, Yaoundé, Centre Region, Cameroon',
    officeAddressDouala: 'Akwa, Douala, Littoral Region, Cameroon',
    businessHours: 'Mon - Fri: 08:00 - 18:00 | Sat: 08:30 - 14:00 (GMT+1)',
    whatsappNumber: '+237 683 31 64 86',
    paymentMtnNumbers: '671063511, 683316486, 671289643',
    paymentOrangeNumbers: '689115595, 640194505',
    facebookUrl: 'https://facebook.com/madeccgroup',
    linkedinUrl: 'https://linkedin.com/company/madecc-group',
    instagramUrl: 'https://instagram.com/madeccgroup',
    youtubeUrl: 'https://youtube.com/@madeccgroup',
    twitterUrl: 'https://x.com/madeccgroup',
    tiktokUrl: 'https://tiktok.com/@madeccgroup',
    logoUrl: '',
    emergencyBanner: {
      enabled: false,
      message: 'Notice: Rapid response geotechnical survey booking is open for Q3 Cameroon projects.',
      linkText: 'Contact Office',
      linkUrl: '#contact',
      badgeType: 'NOTICE'
    },
    themeSettings: {
      accentColor: 'amber',
      borderRadius: 'rounded-xl',
      navigationStyle: 'solid',
      darkModeDefault: true
    },
    globalSeo: {
      seoTitle: 'MADECC GROUP — Premier Construction, Civil Engineering & Project Management in Cameroon',
      metaDescription: 'Certified Cameroonian construction, Eurocode standard concrete batching, turnkey architectural design, and infrastructure project management.',
      ogImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb18615f8?auto=format&fit=crop&w=1200&q=80'
    }
  });

  // SMTP Test Dispatch State
  const [smtpRecipient, setSmtpRecipient] = useState('kreboya603@gmail.com');
  const [smtpSubject, setSmtpSubject] = useState('[LIVE TEST] MADECC Executive Email Dispatch');
  const [smtpMessage, setSmtpMessage] = useState('This is a verified live system test dispatched through the authenticated SMTP service kreboya603@gmail.com.');
  const [sendingSmtpTest, setSendingSmtpTest] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean; message: string; latencyMs?: number; timestamp?: string } | null>(null);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [auditSearch, setAuditSearch] = useState('');
  const [auditActionFilter, setAuditActionFilter] = useState('ALL');
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Cloudinary Optimizer Tool
  const [rawImageUrl, setRawImageUrl] = useState('');
  const [optimizedUrl, setOptimizedUrl] = useState('');

  // 1. Fetch live system status & site settings
  const fetchAllData = async () => {
    try {
      setLoading(true);
      // Status
      const statusRes = await fetch('/api/optimizer/status', { credentials: 'include' });
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        if (statusData.success) {
          setStatus(statusData);
        }
      }

      // Site Settings from Neon DB
      const settingsRes = await fetch('/api/cms/settings', { credentials: 'include' });
      if (settingsRes.ok) {
        const settingsData = await settingsRes.json();
        if (settingsData.success && settingsData.settings) {
          const s = settingsData.settings;
          setSettings(prev => ({
            ...prev,
            siteName: s.siteName || prev.siteName,
            tagline: s.tagline || prev.tagline,
            developerName: s.developerName || prev.developerName,
            phone: s.phone || prev.phone,
            phoneSecondary: s.phoneSecondary || prev.phoneSecondary,
            emergencyPhone: s.emergencyPhone || prev.emergencyPhone,
            email: s.email || prev.email,
            secondaryEmail: s.secondaryEmail || prev.secondaryEmail,
            officeAddressYaounde: s.officeAddressYaounde || prev.officeAddressYaounde,
            officeAddressDouala: s.officeAddressDouala || prev.officeAddressDouala,
            businessHours: s.businessHours || prev.businessHours,
            whatsappNumber: s.whatsappNumber || prev.whatsappNumber,
            paymentMtnNumbers: s.paymentMtnNumbers || prev.paymentMtnNumbers,
            paymentOrangeNumbers: s.paymentOrangeNumbers || prev.paymentOrangeNumbers,
            facebookUrl: s.facebookUrl || prev.facebookUrl,
            linkedinUrl: s.linkedinUrl || prev.linkedinUrl,
            instagramUrl: s.instagramUrl || prev.instagramUrl,
            youtubeUrl: s.youtubeUrl || prev.youtubeUrl,
            twitterUrl: s.twitterUrl || prev.twitterUrl,
            tiktokUrl: s.tiktokUrl || prev.tiktokUrl,
            logoUrl: s.logoUrl || prev.logoUrl,
            emergencyBanner: s.emergencyBanner || prev.emergencyBanner,
            themeSettings: s.themeSettings || prev.themeSettings,
            globalSeo: s.globalSeo || prev.globalSeo
          }));
        }
      }

      // Audit Trail
      await fetchAuditLogs();
    } catch (err) {
      console.warn('Failed to load initial optimizer data:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoadingAudit(true);
      const res = await fetch(`/api/optimizer/audit-trail?limit=60&action=${auditActionFilter}&search=${encodeURIComponent(auditSearch)}`, {
        credentials: 'include'
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setAuditLogs(data.logs || []);
        }
      }
    } catch (err) {
      console.warn('Failed to load audit logs:', err);
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  const refreshStatus = async () => {
    setRefreshingStatus(true);
    try {
      const statusRes = await fetch('/api/optimizer/status', { credentials: 'include' });
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        if (statusData.success) {
          setStatus(statusData);
          showToast('Live system diagnostics refreshed.', 'success');
        }
      }
    } catch {
      showToast('Error refreshing status.', 'error');
    } finally {
      setRefreshingStatus(false);
    }
  };

  // 2. Save Settings Live into Neon PostgreSQL
  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/cms/settings', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      if (data.success) {
        showToast('Website parameters updated & saved directly to Neon DB!', 'success');
        await fetchAuditLogs();
      } else {
        showToast(data.error || 'Failed to save settings.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error saving settings.', 'error');
    } finally {
      setSaving(false);
    }
  };

  // 3. Dispatch Live SMTP Test Email via kreboya603@gmail.com
  const handleSendSmtpTest = async (e: React.FormEvent) => {
    e.preventDefault();
    setSendingSmtpTest(true);
    setSmtpTestResult(null);
    try {
      const res = await fetch('/api/optimizer/test-smtp', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient: smtpRecipient,
          customSubject: smtpSubject,
          customMessage: smtpMessage
        })
      });
      const data = await res.json();
      if (data.success) {
        setSmtpTestResult({
          success: true,
          message: data.message,
          latencyMs: data.latencyMs,
          timestamp: data.timestamp
        });
        showToast(`Test email dispatched via kreboya603@gmail.com (${data.latencyMs}ms)`, 'success');
        await fetchAuditLogs();
      } else {
        setSmtpTestResult({
          success: false,
          message: data.error || 'Failed to dispatch SMTP email test.'
        });
        showToast(data.error || 'SMTP dispatch failed.', 'error');
      }
    } catch (err: any) {
      setSmtpTestResult({
        success: false,
        message: err.message || 'Network error during SMTP test.'
      });
      showToast('Network error during test dispatch.', 'error');
    } finally {
      setSendingSmtpTest(false);
    }
  };

  // 4. Clean Stale Sessions in Neon DB
  const handleCleanSessions = async () => {
    try {
      const res = await fetch('/api/optimizer/clean-sessions', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        await refreshStatus();
        await fetchAuditLogs();
      } else {
        showToast(data.error || 'Could not clean sessions.', 'error');
      }
    } catch (err: any) {
      showToast(err.message || 'Error cleaning sessions.', 'error');
    }
  };

  // 5. Cloudinary URL optimization helper
  const handleOptimizeCloudinaryUrl = (url: string) => {
    if (!url) return;
    setRawImageUrl(url);
    // If it's already a cloudinary URL, inject transforms
    if (url.includes('cloudinary.com') && url.includes('/upload/')) {
      const transformed = url.replace('/upload/', '/upload/f_auto,q_auto,w_1400/');
      setOptimizedUrl(transformed);
    } else {
      // Create Cloudinary CDN fetch URL
      const cloudName = status?.cloudinary?.cloudName || 'madecc-cloud';
      const cdnUrl = `https://res.cloudinary.com/${cloudName}/image/fetch/f_auto,q_auto,w_1400/${encodeURIComponent(url)}`;
      setOptimizedUrl(cdnUrl);
    }
    showToast('Cloudinary WebP/AVIF transform generated!', 'info');
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
    showToast('Copied to clipboard!', 'info');
  };

  // 6. Export Audit Trail to CSV
  const handleExportAuditCsv = () => {
    if (auditLogs.length === 0) {
      showToast('No audit records to export.', 'info');
      return;
    }
    const headers = ['ID', 'Action', 'User Email', 'Details', 'Timestamp'];
    const rows = auditLogs.map(l => [
      l.id,
      `"${(l.action || '').replace(/"/g, '""')}"`,
      `"${(l.userEmail || '').replace(/"/g, '""')}"`,
      `"${(l.details || '').replace(/"/g, '""')}"`,
      `"${l.timestamp}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `madecc-audit-trail-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Audit trail exported to CSV.', 'success');
  };

  if (loading && !status) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-400 space-y-4">
        <RefreshCw className="w-8 h-8 text-amber-500 animate-spin" />
        <p className="text-sm font-semibold">Connecting to live Neon PostgreSQL, SMTP & Cloudinary engines...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8" id="website-live-optimizer-container">
      {/* 1. TOP HEADER & TELEMETRY STRIP */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 via-emerald-500 to-sky-500" />
        
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                <Sparkles className="w-3.5 h-3.5" />
                Live Architecture Controller
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Radio className="w-3 h-3 animate-pulse text-emerald-400" />
                Real-Time Synchronized
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Website Live Optimizer & Master Customizer
            </h1>
            <p className="text-slate-400 text-xs sm:text-sm max-w-3xl leading-relaxed">
              Completely optimize, customize, audit, and update this entire website in real life. Directly wired to the live{' '}
              <strong className="text-white">Neon PostgreSQL database</strong>, authenticated SMTP gateway{' '}
              <span className="text-amber-400 font-mono font-semibold">kreboya603@gmail.com</span>, and Cloudinary media transforms.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={refreshStatus}
              disabled={refreshingStatus}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-2 transition-all shadow-sm disabled:opacity-50"
              title="Poll database & server diagnostics"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshingStatus ? 'animate-spin text-amber-400' : ''}`} />
              Refresh Diagnostics
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl text-xs font-extrabold flex items-center gap-2 transition-all shadow-md shadow-amber-500/15 disabled:opacity-50"
            >
              <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
              {saving ? 'Saving to Neon DB...' : 'Push Updates Live'}
            </button>
          </div>
        </div>

        {/* 2. REAL-LIFE TELEMETRY CHIPS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          {/* Neon Database */}
          <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl flex items-start gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg shrink-0 mt-0.5">
              <Database className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">Live Neon DB</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                {status?.database?.connected ? `Connected (${status.database.latencyMs}ms)` : 'Active'}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded">
                  {status?.database?.activeDatabaseSessions || 1} Active Session(s)
                </span>
                <span className="text-[10px] text-slate-500">Zero Local Storage</span>
              </div>
            </div>
          </div>

          {/* Canonical SMTP */}
          <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl flex items-start gap-3">
            <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg shrink-0 mt-0.5">
              <Mail className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">SMTP Email Gateway</span>
                <span className="text-[10px] bg-amber-500/20 text-amber-400 px-1.5 py-0.2 rounded font-bold">LIVE</span>
              </div>
              <p className="text-[11px] text-amber-300 font-mono mt-0.5 truncate" title="kreboya603@gmail.com">
                kreboya603@gmail.com
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Port {status?.smtp?.port || 587} • TLS Authenticated
              </p>
            </div>
          </div>

          {/* Cloudinary CDN */}
          <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl flex items-start gap-3">
            <div className="p-2 bg-sky-500/10 text-sky-400 rounded-lg shrink-0 mt-0.5">
              <Cloud className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">Cloudinary CDN</span>
                <span className="text-[10px] bg-sky-500/20 text-sky-400 px-1.5 py-0.2 rounded font-bold">READY</span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono mt-0.5 truncate">
                {status?.cloudinary?.cloudName || 'Configured'}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Auto-WebP / AVIF • Transform Engine
              </p>
            </div>
          </div>

          {/* Supabase Storage */}
          <div className="bg-slate-950/60 border border-slate-800 p-3.5 rounded-xl flex items-start gap-3">
            <div className="p-2 bg-indigo-500/10 text-indigo-400 rounded-lg shrink-0 mt-0.5">
              <Server className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">Supabase Engine</span>
                <span className="text-[10px] bg-indigo-500/20 text-indigo-400 px-1.5 py-0.2 rounded font-bold">SYNCED</span>
              </div>
              <p className="text-[11px] text-slate-300 font-mono mt-0.5 truncate">
                Bucket: {status?.supabase?.bucket || 'madecc-assets'}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                Object Storage • Fast Signed URLs
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* 3. NAVIGATION SUB-TABS */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveSubTab('content')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'content'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Building className="w-4 h-4" />
          Live Website Content & Info
        </button>

        <button
          onClick={() => setActiveSubTab('theme')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'theme'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Palette className="w-4 h-4" />
          Theme & Visual Customizer
        </button>

        <button
          onClick={() => setActiveSubTab('seo')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'seo'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Globe className="w-4 h-4" />
          SEO, Social & Cloudinary
        </button>

        <button
          onClick={() => setActiveSubTab('infrastructure')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'infrastructure'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Zap className="w-4 h-4" />
          Live SMTP & Database Tester
        </button>

        <button
          onClick={() => setActiveSubTab('audit')}
          className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSubTab === 'audit'
              ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FileText className="w-4 h-4" />
          Audit Trail & Revisions
          {auditLogs.length > 0 && (
            <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
              activeSubTab === 'audit' ? 'bg-slate-950 text-amber-400' : 'bg-slate-800 text-slate-300'
            }`}>
              {auditLogs.length}
            </span>
          )}
        </button>
      </div>

      {/* 4. SUB-TAB 1: LIVE WEBSITE CONTENT & BUSINESS INFO (EDITABLE & UPDATABLE) */}
      {activeSubTab === 'content' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Building className="w-5 h-5 text-amber-500" />
                Public Business Identity & Contact Coordinates
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Any changes saved here instantly update across the public homepage, navbar, footer, contact forms, and contracts via Neon DB.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Site Name */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Company / Enterprise Name</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={e => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Developer Credit */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Managing Director / Developer</label>
                <input
                  type="text"
                  value={settings.developerName}
                  onChange={e => setSettings({ ...settings, developerName: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Canonical Admin Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>Canonical Admin & SMTP Email</span>
                  <span className="text-[10px] text-amber-400 font-mono font-normal">Active SMTP User</span>
                </label>
                <input
                  type="email"
                  value={settings.email}
                  onChange={e => setSettings({ ...settings, email: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-amber-300 font-mono focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Secondary Inquiries Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Public Inquiries Email</label>
                <input
                  type="email"
                  value={settings.secondaryEmail}
                  onChange={e => setSettings({ ...settings, secondaryEmail: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Primary Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Official Primary Phone</label>
                <input
                  type="text"
                  value={settings.phone}
                  onChange={e => setSettings({ ...settings, phone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Secondary Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Secondary Commercial Phone</label>
                <input
                  type="text"
                  value={settings.phoneSecondary}
                  onChange={e => setSettings({ ...settings, phoneSecondary: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* 24/7 Emergency Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">24/7 Site Emergency Hotline</label>
                <input
                  type="text"
                  value={settings.emergencyPhone}
                  onChange={e => setSettings({ ...settings, emergencyPhone: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-red-300 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* WhatsApp Number */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">WhatsApp Instant Connect</label>
                <input
                  type="text"
                  value={settings.whatsappNumber}
                  onChange={e => setSettings({ ...settings, whatsappNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-emerald-300 focus:outline-none focus:border-amber-500"
                />
              </div>

              {/* Business Operating Hours */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Business Working Hours</label>
                <input
                  type="text"
                  value={settings.businessHours}
                  onChange={e => setSettings({ ...settings, businessHours: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Tagline */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Enterprise Tagline / Slogan</label>
              <input
                type="text"
                value={settings.tagline}
                onChange={e => setSettings({ ...settings, tagline: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* Addresses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  Headquarters Address (Yaoundé)
                </label>
                <input
                  type="text"
                  value={settings.officeAddressYaounde}
                  onChange={e => setSettings({ ...settings, officeAddressYaounde: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  Regional Commercial Office (Douala)
                </label>
                <input
                  type="text"
                  value={settings.officeAddressDouala}
                  onChange={e => setSettings({ ...settings, officeAddressDouala: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Mobile Money Official Accounts */}
            <div className="border-t border-slate-800 pt-6 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                Official Cameroon Mobile Money Merchant Numbers (MoMo & OM)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-amber-400">MTN Mobile Money Numbers (Comma Separated)</label>
                  <input
                    type="text"
                    value={settings.paymentMtnNumbers}
                    onChange={e => setSettings({ ...settings, paymentMtnNumbers: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-orange-400">Orange Money Numbers (Comma Separated)</label>
                  <input
                    type="text"
                    value={settings.paymentOrangeNumbers}
                    onChange={e => setSettings({ ...settings, paymentOrangeNumbers: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            </div>

            {/* Announcement Banner */}
            <div className="border-t border-slate-800 pt-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                    <Radio className="w-4 h-4 text-amber-500" />
                    Global Emergency & Announcement Banner
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">Displays a top-level alert across all public pages.</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={Boolean(settings.emergencyBanner?.enabled)}
                    onChange={e => setSettings({
                      ...settings,
                      emergencyBanner: {
                        ...settings.emergencyBanner,
                        enabled: e.target.checked
                      }
                    })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              {settings.emergencyBanner?.enabled && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="md:col-span-2 space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Banner Notice Text</label>
                    <input
                      type="text"
                      value={settings.emergencyBanner.message || ''}
                      onChange={e => setSettings({
                        ...settings,
                        emergencyBanner: {
                          ...settings.emergencyBanner,
                          message: e.target.value
                        }
                      })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-300">Action Link (e.g. #contact or URL)</label>
                    <input
                      type="text"
                      value={settings.emergencyBanner.linkUrl || ''}
                      onChange={e => setSettings({
                        ...settings,
                        emergencyBanner: {
                          ...settings.emergencyBanner,
                          linkUrl: e.target.value
                        }
                      })}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                {saving ? 'Saving to Neon Database...' : 'Save & Persist Live to Neon DB'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. SUB-TAB 2: THEME & VISUAL CUSTOMIZER */}
      {activeSubTab === 'theme' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Palette className="w-5 h-5 text-amber-500" />
                Theme & Visual Brand Customizer
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Customize brand accent colors, corner radii, and navigation layout styles across the entire application.
              </p>
            </div>

            {/* Accent Palette Selection */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-300">Primary Accent Palette</label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                {[
                  { id: 'amber', label: 'MADECC Amber Gold', color: 'bg-amber-500', border: 'border-amber-500' },
                  { id: 'emerald', label: 'Construction Emerald', color: 'bg-emerald-500', border: 'border-emerald-500' },
                  { id: 'indigo', label: 'Engineering Royal Indigo', color: 'bg-indigo-500', border: 'border-indigo-500' },
                  { id: 'sky', label: 'Corporate Sky Blue', color: 'bg-sky-500', border: 'border-sky-500' },
                  { id: 'rose', label: 'Terracotta Earth', color: 'bg-rose-500', border: 'border-rose-500' }
                ].map(palette => {
                  const isSelected = settings.themeSettings?.accentColor === palette.id;
                  return (
                    <button
                      key={palette.id}
                      type="button"
                      onClick={() => setSettings({
                        ...settings,
                        themeSettings: { ...settings.themeSettings, accentColor: palette.id }
                      })}
                      className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                        isSelected
                          ? `bg-slate-800 border-amber-500 shadow-md`
                          : 'bg-slate-950 border-slate-800 hover:bg-slate-900'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-full ${palette.color} shrink-0 shadow`} />
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-white block truncate">{palette.label}</span>
                        {isSelected && <span className="text-[10px] text-amber-400 font-semibold">Active</span>}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Corner Radius & Navigation Style */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Border Radius Geometry</label>
                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    { id: 'rounded-none', label: 'Sharp (0px)' },
                    { id: 'rounded-lg', label: 'Subtle (8px)' },
                    { id: 'rounded-2xl', label: 'Modern (16px)' }
                  ].map(radius => (
                    <button
                      key={radius.id}
                      type="button"
                      onClick={() => setSettings({
                        ...settings,
                        themeSettings: { ...settings.themeSettings, borderRadius: radius.id }
                      })}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center ${
                        settings.themeSettings?.borderRadius === radius.id
                          ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {radius.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Navigation Layout Architecture</label>
                <div className="grid grid-cols-2 gap-2.5">
                  {[
                    { id: 'solid', label: 'Enterprise Solid' },
                    { id: 'glass', label: 'Translucent Glass' }
                  ].map(nav => (
                    <button
                      key={nav.id}
                      type="button"
                      onClick={() => setSettings({
                        ...settings,
                        themeSettings: { ...settings.themeSettings, navigationStyle: nav.id }
                      })}
                      className={`py-2 px-3 rounded-lg border text-xs font-bold transition-all text-center ${
                        settings.themeSettings?.navigationStyle === nav.id
                          ? 'bg-amber-500/10 border-amber-500 text-amber-400'
                          : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                      }`}
                    >
                      {nav.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Live Interactive Preview Card */}
            <div className="border-t border-slate-800 pt-6 space-y-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="w-3.5 h-3.5 text-amber-500" />
                Real-Time Component Preview
              </span>
              <div className="bg-slate-950 border border-slate-800 p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-amber-500 flex items-center justify-center font-extrabold text-slate-950 text-xs">
                      MG
                    </div>
                    <div>
                      <h5 className="text-sm font-extrabold text-white">{settings.siteName}</h5>
                      <p className="text-[10px] text-slate-400">{settings.tagline}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 bg-amber-500 text-slate-950 font-bold rounded-lg text-xs">
                      Request Quote
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
                  <span>Hotline: <strong className="text-white">{settings.emergencyPhone}</strong></span>
                  <span>Direct: <strong className="text-amber-400 font-mono">{settings.email}</strong></span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                {saving ? 'Saving...' : 'Save Theme Settings Live'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 6. SUB-TAB 3: SEO, SOCIAL & CLOUDINARY MEDIA OPTIMIZER */}
      {activeSubTab === 'seo' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <Globe className="w-5 h-5 text-amber-500" />
                SEO, OpenGraph & Cloudinary Asset Optimizer
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Configure search engine visibility, social sharing metadata, and transform image URLs with Cloudinary.
              </p>
            </div>

            {/* Meta Title & Description */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Global Meta Title</label>
                <input
                  type="text"
                  value={settings.globalSeo?.seoTitle || ''}
                  onChange={e => setSettings({
                    ...settings,
                    globalSeo: { ...settings.globalSeo, seoTitle: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-300">Global Meta Description</label>
                  <span className="text-[10px] text-slate-400">
                    {(settings.globalSeo?.metaDescription || '').length}/160 characters
                  </span>
                </div>
                <textarea
                  rows={3}
                  value={settings.globalSeo?.metaDescription || ''}
                  onChange={e => setSettings({
                    ...settings,
                    globalSeo: { ...settings.globalSeo, metaDescription: e.target.value }
                  })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            {/* Social Share Image & Cloudinary Transformer */}
            <div className="border-t border-slate-800 pt-6 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Cloud className="w-4 h-4 text-sky-400" />
                Cloudinary Asset Optimizer & Social Sharing Image (OG:Image)
              </h4>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-300">Social Share Image URL</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={settings.globalSeo?.ogImage || ''}
                    onChange={e => setSettings({
                      ...settings,
                      globalSeo: { ...settings.globalSeo, ogImage: e.target.value }
                    })}
                    placeholder="https://..."
                    className="flex-1 bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                  />
                  <button
                    type="button"
                    onClick={() => handleOptimizeCloudinaryUrl(settings.globalSeo?.ogImage || '')}
                    className="px-4 py-2.5 bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 rounded-xl text-xs font-bold transition-all shrink-0"
                  >
                    Optimize via Cloudinary
                  </button>
                </div>
              </div>

              {/* Cloudinary Transform Result Preview */}
              {optimizedUrl && (
                <div className="bg-slate-950 border border-sky-500/30 p-4 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-400 flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> WebP/AVIF CDN URL Ready
                    </span>
                    <button
                      onClick={() => copyToClipboard(optimizedUrl, 'opt-url')}
                      className="text-[11px] text-slate-300 hover:text-white flex items-center gap-1"
                    >
                      {copiedKey === 'opt-url' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                      Copy Link
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono break-all bg-slate-900 p-2 rounded-lg border border-slate-800">
                    {optimizedUrl}
                  </p>
                </div>
              )}

              {settings.globalSeo?.ogImage && (
                <div className="rounded-xl overflow-hidden border border-slate-800 max-w-sm">
                  <img
                    src={settings.globalSeo.ogImage}
                    alt="Social Preview"
                    className="w-full h-40 object-cover"
                    referrerPolicy="no-referrer"
                    onError={(e: any) => { e.currentTarget.style.display = 'none'; }}
                  />
                  <div className="bg-slate-950 p-3 border-t border-slate-800">
                    <p className="text-xs font-bold text-white truncate">{settings.globalSeo?.seoTitle || settings.siteName}</p>
                    <p className="text-[10px] text-slate-400 line-clamp-2 mt-0.5">{settings.globalSeo?.metaDescription || settings.tagline}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Social Media Handles */}
            <div className="border-t border-slate-800 pt-6 space-y-4">
              <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Share2 className="w-4 h-4 text-amber-500" />
                Official Social Profiles & Deep Links
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">LinkedIn Profile URL</label>
                  <input
                    type="text"
                    value={settings.linkedinUrl}
                    onChange={e => setSettings({ ...settings, linkedinUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">Facebook Page URL</label>
                  <input
                    type="text"
                    value={settings.facebookUrl}
                    onChange={e => setSettings({ ...settings, facebookUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">Instagram Handle / URL</label>
                  <input
                    type="text"
                    value={settings.instagramUrl}
                    onChange={e => setSettings({ ...settings, instagramUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-400">YouTube Channel URL</label>
                  <input
                    type="text"
                    value={settings.youtubeUrl}
                    onChange={e => setSettings({ ...settings, youtubeUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={handleSaveSettings}
                disabled={saving}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
              >
                <Save className={`w-4 h-4 ${saving ? 'animate-spin' : ''}`} />
                {saving ? 'Saving...' : 'Save SEO & Social Settings'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. SUB-TAB 4: REAL-LIFE INFRASTRUCTURE & SMTP DISPATCH TESTER */}
      {activeSubTab === 'infrastructure' && (
        <div className="space-y-6">
          {/* SMTP Live Test Console */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Mail className="w-5 h-5 text-amber-500" />
                  Live SMTP Email Verification Console
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Dispatch a real, authenticated email directly through{' '}
                  <span className="text-amber-400 font-mono font-bold">kreboya603@gmail.com</span> to test live delivery.
                </p>
              </div>
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 shrink-0">
                Sender: kreboya603@gmail.com
              </span>
            </div>

            <form onSubmit={handleSendSmtpTest} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Recipient Email Address</label>
                  <input
                    type="email"
                    required
                    value={smtpRecipient}
                    onChange={e => setSmtpRecipient(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                    placeholder="kreboya603@gmail.com"
                  />
                  <p className="text-[10px] text-slate-500">Defaults to canonical administrator kreboya603@gmail.com.</p>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300">Test Email Subject</label>
                  <input
                    type="text"
                    required
                    value={smtpSubject}
                    onChange={e => setSmtpSubject(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300">Test Message Payload</label>
                <textarea
                  rows={3}
                  value={smtpMessage}
                  onChange={e => setSmtpMessage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-amber-500 font-mono"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Audit logged to Neon PostgreSQL with delivery timestamp.</span>
                </div>
                <button
                  type="submit"
                  disabled={sendingSmtpTest}
                  className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all disabled:opacity-50"
                >
                  <Send className={`w-4 h-4 ${sendingSmtpTest ? 'animate-spin' : ''}`} />
                  {sendingSmtpTest ? 'Sending via kreboya603@gmail.com...' : 'Dispatch Live Test Email'}
                </button>
              </div>
            </form>

            {/* Test Result Display */}
            {smtpTestResult && (
              <div className={`p-4 rounded-xl border ${
                smtpTestResult.success 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300' 
                  : 'bg-red-500/10 border-red-500/30 text-red-300'
              } space-y-2`}>
                <div className="flex items-center gap-2 font-bold text-xs">
                  {smtpTestResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-red-400" />}
                  <span>{smtpTestResult.success ? 'Live Dispatch Successful' : 'Dispatch Notification'}</span>
                </div>
                <p className="text-xs">{smtpTestResult.message}</p>
                {smtpTestResult.latencyMs && (
                  <p className="text-[11px] font-mono opacity-80">
                    Network Roundtrip: {smtpTestResult.latencyMs}ms • Timestamp: {smtpTestResult.timestamp}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Neon Database Table Inventory & Session Management */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                  <Database className="w-5 h-5 text-emerald-400" />
                  Neon Database Live Table Inventory & Session Authority
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Active records stored in live serverless PostgreSQL. Session tokens are authoritative in Neon DB with zero temporal storage.
                </p>
              </div>
              <button
                onClick={handleCleanSessions}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 rounded-xl text-xs font-bold transition-all"
              >
                Clean Expired Sessions
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: 'Users & Staff', key: 'users', count: status?.database?.tableCounts?.users ?? 0 },
                { label: 'Projects', key: 'projects', count: status?.database?.tableCounts?.projects ?? 0 },
                { label: 'Services', key: 'services', count: status?.database?.tableCounts?.services ?? 0 },
                { label: 'Blog Posts', key: 'blogs', count: status?.database?.tableCounts?.blogs ?? 0 },
                { label: 'Signed Contracts', key: 'contracts', count: status?.database?.tableCounts?.signedContracts ?? 0 },
                { label: 'Audit Records', key: 'audit', count: status?.database?.tableCounts?.auditLogs ?? 0 }
              ].map(tbl => (
                <div key={tbl.key} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 text-center">
                  <span className="text-2xl font-black text-white font-mono">{tbl.count}</span>
                  <span className="block text-[11px] text-slate-400 font-semibold mt-1 truncate">{tbl.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 8. SUB-TAB 5: AUDIT TRAIL & REVISIONS */}
      {activeSubTab === 'audit' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-6">
          <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                Live System Audit Trail & Compliance Journal
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Every administrative login, logout, setting optimization, and SMTP dispatch is logged directly to Neon PostgreSQL.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportAuditCsv}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
              >
                <Download className="w-3.5 h-3.5 text-amber-400" /> Export CSV
              </button>
              <button
                onClick={fetchAuditLogs}
                disabled={loadingAudit}
                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-bold transition-all"
                title="Refresh audit log stream"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingAudit ? 'animate-spin text-amber-400' : ''}`} />
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={auditSearch}
                onChange={e => setAuditSearch(e.target.value)}
                placeholder="Search audit actions, details, or user email..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <select
              value={auditActionFilter}
              onChange={e => setAuditActionFilter(e.target.value)}
              className="bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
            >
              <option value="ALL">All Actions</option>
              <option value="ADMIN_KEY_LOGIN">Admin Key Login</option>
              <option value="ADMIN_LOGOUT">Admin Logout</option>
              <option value="OPTIMIZER_SMTP_TEST">SMTP Test</option>
              <option value="LIVE_SETTINGS_OPTIMIZED">Settings Optimized</option>
              <option value="CLEAN_STALE_SESSIONS">Clean Sessions</option>
            </select>
          </div>

          {/* Logs List */}
          <div className="space-y-2 max-h-[500px] overflow-y-auto pr-1">
            {auditLogs.length === 0 ? (
              <div className="p-12 text-center text-slate-500 text-xs">
                No audit entries found matching the filter criteria.
              </div>
            ) : (
              auditLogs.map(log => (
                <div
                  key={log.id}
                  className="bg-slate-950 border border-slate-800/80 hover:border-slate-700 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition-colors"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        log.action.includes('LOGOUT') 
                          ? 'bg-red-500/10 text-red-400 border border-red-500/20'
                          : log.action.includes('LOGIN')
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : log.action.includes('SMTP')
                          ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          : 'bg-slate-800 text-slate-300'
                      }`}>
                        {log.action}
                      </span>
                      <span className="text-xs font-mono text-slate-400 truncate">
                        {log.userEmail || 'System'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-300 break-words">{log.details}</p>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 shrink-0">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};
