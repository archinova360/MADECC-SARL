import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Save, 
  Send, 
  RotateCcw, 
  RotateCw, 
  Eye, 
  History, 
  Film, 
  Image as ImageIcon, 
  Sliders, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Plus, 
  Trash2, 
  ChevronUp, 
  ChevronDown, 
  Globe, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Play, 
  Pause,
  Sparkles,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  X
} from 'lucide-react';
import { PageContent, HeroSectionConfig, PageSection, SeoConfig, CmsRevision } from '../types.ts';
import { getCsrfHeaders } from '../lib/csrf.ts';
import { getAuthToken } from '../lib/firebase.ts';
import HeroVideoPlayer from './HeroVideoPlayer.tsx';
import CmsMediaLibrary from './CmsMediaLibrary.tsx';
import CmsRichTextEditor from './cms/CmsRichTextEditor.tsx';
const safeConfirm = (message: string): boolean => {
  if (typeof window === 'undefined') return true;
  if (window.self !== window.top) {
    return true;
  }
  try {
    return window.confirm(message);
  } catch (e) {
    return true;
  }
};

const DEFAULT_PAGES_LIST = [
  { id: 1, slug: 'home', title: 'Home Page', status: 'PUBLISHED', version: 1 },
  { id: 2, slug: 'about', title: 'About Us', status: 'PUBLISHED', version: 1 },
  { id: 3, slug: 'services', title: 'Services & Engineering', status: 'PUBLISHED', version: 1 },
  { id: 4, slug: 'projects', title: 'Major Projects & Corridors', status: 'PUBLISHED', version: 1 },
  { id: 5, slug: 'blog', title: 'Technical Insights & Blog', status: 'PUBLISHED', version: 1 },
  { id: 6, slug: 'faq', title: 'FAQ & Help Centre', status: 'PUBLISHED', version: 1 },
  { id: 7, slug: 'sustainability', title: 'Sustainability & ESG', status: 'PUBLISHED', version: 1 },
  { id: 8, slug: 'construction-cost-guide', title: 'Construction Cost Guide', status: 'PUBLISHED', version: 1 },
  { id: 9, slug: 'budget-calculator', title: 'Project Budget Calculator', status: 'PUBLISHED', version: 1 },
  { id: 10, slug: 'tenders', title: 'Procurement & Tenders', status: 'PUBLISHED', version: 1 },
  { id: 11, slug: 'suppliers', title: 'Supplier Registration', status: 'PUBLISHED', version: 1 },
  { id: 12, slug: 'careers', title: 'Careers & Talent', status: 'PUBLISHED', version: 1 },
  { id: 13, slug: 'contact', title: 'Contact & Offices', status: 'PUBLISHED', version: 1 },
  { id: 14, slug: 'privacy-policy', title: 'Privacy Policy', status: 'PUBLISHED', version: 1 },
  { id: 15, slug: 'terms-of-use', title: 'Terms of Use', status: 'PUBLISHED', version: 1 }
];

const createDefaultPageContent = (slug: string): PageContent => ({
  id: 1,
  slug,
  title: slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' '),
  status: 'PUBLISHED',
  version: 1,
  publishedAt: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  heroConfig: {
    title: slug === 'home' ? 'MADECC GROUP — Building Cameroon’s Future' : `${slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')} | MADECC GROUP`,
    subtitle: 'Excellence in Civil Engineering, Infrastructure, and Commercial Complex Construction in Cameroon.',
    description: 'Delivering resilient infrastructure corridors, commercial complexes, and sustainable industrial projects across Cameroon.',
    eyebrow: 'Construction & Civil Engineering — Cameroon',
    showHero: true,
    showVideo: true,
    trustBadges: [
      { icon: 'ShieldCheck', text: 'ISO 9001:2015 Certified' },
      { icon: 'Building2', text: 'Eurocode 2 & 8 Compliant' }
    ],
    mediaType: 'video',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-construction-site-with-cranes-and-workers-40915-large.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1920&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1920&q=80',
    videoSettings: {
      autoplay: true,
      muted: true,
      loop: true,
      playsInline: true,
      disableOnMobile: false,
      overlayOpacity: 75
    },
    primaryCta: { text: 'Request a Free Quote', link: '/contact', visible: true },
    secondaryCta: { text: 'Calculate Budget (FCFA)', link: '/budget-calculator', visible: true },
    tertiaryCta: { text: 'Schedule Consultation →', link: '/contact', visible: true }
  },
  sections: [
    {
      id: `sec-${slug}-1`,
      type: 'services',
      title: 'Core Capabilities & Heavy Engineering',
      subtitle: 'High-standard construction across Yaoundé, Douala, and nationwide',
      enabled: true,
      displayOrder: 1
    }
  ],
  seo: {
    seoTitle: `${slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')} | MADECC GROUP Cameroon`,
    metaDescription: 'Leading civil engineering, road infrastructure, and commercial construction contractor in Cameroon.',
    keywords: 'construction cameroon, yaounde builder, civil engineering',
    robotsIndex: true
  }
});

interface CmsPageBuilderProps {
  initialSlug?: string;
}

export default function CmsPageBuilder({ initialSlug }: CmsPageBuilderProps = {}) {
  const [pages, setPages] = useState<Array<{ id: number; slug: string; title: string; status: string; version: number }>>(DEFAULT_PAGES_LIST);
  const [selectedSlug, setSelectedSlug] = useState(initialSlug || 'home');
  const [pageData, setPageData] = useState<PageContent>(() => createDefaultPageContent(initialSlug || 'home'));
  const [confirmDeleteSectionIdx, setConfirmDeleteSectionIdx] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [lastSavedSnapshot, setLastSavedSnapshot] = useState<string>('');

  // Create New Page inline modal state
  const [showNewPageModal, setShowNewPageModal] = useState(false);
  const [newPageTitle, setNewPageTitle] = useState('');
  const [newPageSlug, setNewPageSlug] = useState('');
  const [creatingPage, setCreatingPage] = useState(false);

  // Active builder tab: 'hero' | 'sections' | 'seo' | 'history'
  const [activeTab, setActiveTab] = useState<'hero' | 'sections' | 'seo' | 'history'>('hero');

  // Preview Mode
  const [showPreview, setShowPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Revisions & History
  const [revisions, setRevisions] = useState<CmsRevision[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);

  // Media picker modal state for Hero / Sections / SEO
  const [showMediaPicker, setShowMediaPicker] = useState<null | { target: 'video' | 'poster' | 'image' | 'ogImage' | 'sectionMedia'; sectionIndex?: number }>(null);

  const computeSnapshot = (p: PageContent | null) =>
    p ? JSON.stringify({ title: p.title, heroConfig: p.heroConfig, sections: p.sections, seo: p.seo }) : '';

  const isDirty = Boolean(lastSavedSnapshot) && computeSnapshot(pageData) !== lastSavedSnapshot;

  // Load pages list
  const fetchPages = async () => {
    try {
      const res = await fetch('/api/cms/pages');
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.pages) && data.pages.length > 0) {
          setPages(data.pages);
        }
      }
    } catch (err) {
      console.error('Failed to fetch pages:', err);
    }
  };

  // Load specific page data (draft or published)
  const fetchPageDetails = async (slug: string) => {
    setLoading(true);
    setErrorBanner(null);
    try {
      const res = await fetch(`/api/cms/pages/${slug}?mode=draft`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPageData(data);
          setLastSavedSnapshot(computeSnapshot(data));
        } else {
          const fallback = createDefaultPageContent(slug);
          setPageData(fallback);
          setLastSavedSnapshot(computeSnapshot(fallback));
        }
      } else {
        const fallback = createDefaultPageContent(slug);
        setPageData(fallback);
        setLastSavedSnapshot(computeSnapshot(fallback));
      }
    } catch (err: any) {
      console.error('Failed to fetch page data:', err);
      setErrorBanner(err?.message || 'Unable to load page from CMS database.');
      const fallback = createDefaultPageContent(slug);
      setPageData(fallback);
      setLastSavedSnapshot(computeSnapshot(fallback));
    } finally {
      setLoading(false);
    }
  };

  // Fetch page revisions
  const fetchRevisions = async (slug: string) => {
    setLoadingRevisions(true);
    try {
      const res = await fetch(`/api/cms/pages/${slug}/revisions`);
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.revisions)) {
          setRevisions(data.revisions);
        }
      }
    } catch (err) {
      console.error('Failed to load revisions:', err);
    } finally {
      setLoadingRevisions(false);
    }
  };

  useEffect(() => {
    fetchPages();
  }, []);

  useEffect(() => {
    if (initialSlug) setSelectedSlug(initialSlug);
  }, [initialSlug]);

  useEffect(() => {
    if (selectedSlug) {
      fetchPageDetails(selectedSlug);
      fetchRevisions(selectedSlug);
    }
  }, [selectedSlug]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3500);
  };

  // Save Draft Handler
  const handleSaveDraft = async () => {
    if (!pageData) return;
    setSavingDraft(true);
    try {
      const csrf = await getCsrfHeaders();
      const token = await getAuthToken().catch(() => null);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...csrf
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/cms/pages/${selectedSlug}/draft`, {
        method: 'PUT',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          heroConfig: pageData.heroConfig,
          sections: pageData.sections,
          seo: pageData.seo,
          title: pageData.title
        })
      });

      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch (_) {}

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to save draft (HTTP ${res.status})`);
      }

      const updatedPage = { ...pageData, status: 'DRAFT' as const, draftData: data.page?.draftData || pageData.draftData };
      setPageData(updatedPage);
      setLastSavedSnapshot(computeSnapshot(updatedPage));
      setErrorBanner(null);
      showToast('success', 'Draft saved safely without modifying live site.');
      fetchPages();
    } catch (err: any) {
      setErrorBanner(err.message || 'Error saving draft');
      showToast('error', err.message || 'Error saving draft');
    } finally {
      setSavingDraft(false);
    }
  };

  // Publish Live Handler
  const handlePublishLive = async () => {
    if (!pageData) return;
    setPublishing(true);
    try {
      const csrf = await getCsrfHeaders();
      const token = await getAuthToken().catch(() => null);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...csrf
      };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/cms/pages/${selectedSlug}/publish`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          title: pageData.title,
          heroConfig: pageData.heroConfig,
          sections: pageData.sections,
          seo: pageData.seo,
          changeSummary: `Published version by CMS Admin on ${new Date().toLocaleTimeString()}`
        })
      });

      const rawText = await res.text();
      let data: any = {};
      try {
        data = JSON.parse(rawText);
      } catch (_) {}

      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to publish changes (HTTP ${res.status})`);
      }

      const publishedPage = {
        ...pageData,
        status: 'PUBLISHED' as const,
        version: data.version || (pageData.version + 1),
        publishedAt: new Date().toISOString()
      };
      setPageData(publishedPage);
      setLastSavedSnapshot(computeSnapshot(publishedPage));
      setErrorBanner(null);
      showToast('success', `Version ${data.version || ''} is now LIVE on the public website!`);
      fetchPages();
      fetchRevisions(selectedSlug);
    } catch (err: any) {
      setErrorBanner(err.message || 'Error publishing page');
      showToast('error', err.message || 'Error publishing page');
    } finally {
      setPublishing(false);
    }
  };

  // Unpublish Page Handler
  const handleUnpublishPage = async () => {
    if (!pageData) return;
    if (!safeConfirm(`Unpublish "${pageData.title}" (${selectedSlug})? Public visitors will no longer see this page until republished.`)) {
      return;
    }
    setUnpublishing(true);
    try {
      const csrf = await getCsrfHeaders();
      const token = await getAuthToken().catch(() => null);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...csrf
      };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/cms/pages/${selectedSlug}/unpublish`, {
        method: 'POST',
        credentials: 'include',
        headers
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || `Failed to unpublish page (HTTP ${res.status})`);
      }
      setPageData(prev => (prev ? { ...prev, status: 'UNPUBLISHED' } : prev));
      setErrorBanner(null);
      showToast('success', `"${pageData.title}" has been unpublished from the public website.`);
      fetchPages();
    } catch (err: any) {
      setErrorBanner(err.message || 'Failed to unpublish page');
      showToast('error', err.message || 'Failed to unpublish page');
    } finally {
      setUnpublishing(false);
    }
  };

  // Create New Custom Page Handler
  const handleCreateNewPage = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanTitle = newPageTitle.trim();
    const rawSlug = (newPageSlug.trim() || cleanTitle)
      .toLowerCase()
      .replace(/[^a-z0-9-]+/g, '-')
      .replace(/^-+|-+$/g, '');
    if (!cleanTitle || !rawSlug) {
      showToast('error', 'Please enter both a valid page title and URL slug.');
      return;
    }
    setCreatingPage(true);
    try {
      const template = createDefaultPageContent(rawSlug);
      template.title = cleanTitle;
      template.heroConfig.title = cleanTitle;
      template.seo.seoTitle = `${cleanTitle} | MADECC GROUP`;

      const csrf = await getCsrfHeaders();
      const token = await getAuthToken().catch(() => null);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...csrf
      };
      if (token && token !== 'null' && token !== 'undefined') {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/cms/pages/${rawSlug}/draft`, {
        method: 'PUT',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          title: template.title,
          heroConfig: template.heroConfig,
          sections: template.sections,
          seo: template.seo
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Failed to create page draft');
      }
      setShowNewPageModal(false);
      setNewPageTitle('');
      setNewPageSlug('');
      await fetchPages();
      setSelectedSlug(rawSlug);
      showToast('success', `Page "/${rawSlug}" created as draft! Publish when ready.`);
    } catch (err: any) {
      showToast('error', err.message || 'Error creating page');
    } finally {
      setCreatingPage(false);
    }
  };

  // Restore Revision Handler
  const handleRestoreRevision = async (revId: number) => {
    if (!safeConfirm('Restore this snapshot into your current draft? You can preview before publishing.')) {
      return;
    }


    try {
      const csrf = await getCsrfHeaders();
      const token = await getAuthToken().catch(() => null);
      const headers: Record<string, string> = {
        ...csrf
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/cms/pages/${selectedSlug}/restore/${revId}`, {
        method: 'POST',
        credentials: 'include',
        headers
      });
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          fetchPageDetails(selectedSlug);
          showToast('success', 'Revision snapshot restored into active draft.');
        }
      }
    } catch (err) {
      showToast('error', 'Failed to restore revision');
    }
  };

  // Helper to update hero config
  const updateHero = (field: keyof HeroSectionConfig, value: any) => {
    if (!pageData) return;
    const currentHero = pageData.heroConfig || createDefaultPageContent(selectedSlug).heroConfig;
    setPageData({
      ...pageData,
      heroConfig: {
        ...currentHero,
        [field]: value
      }
    });
  };

  // Helper to update video sub-settings
  const updateVideoSettings = (field: string, value: any) => {
    if (!pageData) return;
    const currentHero = pageData.heroConfig || createDefaultPageContent(selectedSlug).heroConfig;
    const currentVideoSettings = currentHero.videoSettings || {
      autoplay: true,
      muted: true,
      loop: true,
      playsInline: true,
      disableOnMobile: false,
      overlayOpacity: 75
    };

    setPageData({
      ...pageData,
      heroConfig: {
        ...currentHero,
        videoSettings: {
          ...currentVideoSettings,
          [field]: value
        }
      }
    });
  };

  const heroConfig: HeroSectionConfig = pageData.heroConfig || createDefaultPageContent(selectedSlug).heroConfig;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl text-slate-200" id="cms-page-builder">
      {/* Toast Notification */}
      {notification && (
        <div className={`fixed bottom-6 right-6 z-50 p-4 rounded-xl shadow-2xl text-xs font-bold flex items-center gap-2 animate-in slide-in-from-bottom-5 ${
          notification.type === 'success' ? 'bg-emerald-600 text-white' : 'bg-rose-600 text-white'
        }`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
          {notification.message}
        </div>
      )}

      {/* Top Header & Page Selector */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Layout className="w-5 h-5 text-amber-500" /> Full-Stack CMS &amp; Page Studio
            </h2>

            {/* Status Pill */}
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase ${
              pageData.status === 'PUBLISHED'
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : pageData.status === 'UNPUBLISHED'
                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            }`}>
              {pageData.status} (v{pageData.version})
            </span>

            {/* Dirty / Saved Badge */}
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase ${
              isDirty
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-slate-800 text-slate-300 border border-slate-700'
            }`}>
              {isDirty ? 'Unsaved Changes' : 'Saved'}
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-1">
            Edit copy, headings, images, background video reels, custom sections, and SEO for all public pages without touching code.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Page Picker */}
          <select
            value={selectedSlug}
            onChange={e => setSelectedSlug(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            {pages.map(p => (
              <option key={p.slug} value={p.slug}>
                {p.title} (/{p.slug}) [{p.status}]
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShowNewPageModal(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 transition-colors"
            id="cms-new-page-btn"
          >
            <Plus className="w-3.5 h-3.5" /> New Page
          </button>

          {/* Real-time Preview Toggle */}
          <button
            type="button"
            onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors border ${
              showPreview
                ? 'bg-amber-500 text-slate-950 border-amber-400'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            {showPreview ? 'Close Preview' : 'Preview'}
          </button>

          {/* Save Draft */}
          <button
            type="button"
            onClick={handleSaveDraft}
            disabled={savingDraft}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3.5 py-2 rounded-lg text-xs border border-slate-700 transition-colors disabled:opacity-50"
            id="cms-save-draft-btn"
          >
            {savingDraft ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Draft
          </button>

          {/* Unpublish */}
          {pageData.status !== 'UNPUBLISHED' && (
            <button
              type="button"
              onClick={handleUnpublishPage}
              disabled={unpublishing}
              className="flex items-center gap-1.5 bg-rose-950/70 hover:bg-rose-900 text-rose-200 font-bold px-3 py-2 rounded-lg text-xs border border-rose-700/60 transition-colors disabled:opacity-50"
              id="cms-unpublish-btn"
            >
              {unpublishing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <AlertCircle className="w-3.5 h-3.5" />}
              Unpublish
            </button>
          )}

          {/* Publish Live */}
          <button
            type="button"
            onClick={handlePublishLive}
            disabled={publishing}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition-all shadow-md shadow-amber-500/10 disabled:opacity-50"
            id="cms-publish-live-btn"
          >
            {publishing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Publish Live (v{pageData.version + 1})
          </button>
        </div>
      </div>

      {errorBanner && (
        <div className="mt-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between gap-2">
          <span className="flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" /> {errorBanner}</span>
          <button type="button" onClick={() => setErrorBanner(null)} className="text-rose-200 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
      )}

      {/* Interactive Device Preview Overlay */}
      {showPreview && (
        <div className="my-6 p-4 bg-slate-950 border border-slate-800 rounded-2xl shadow-inner">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono text-slate-300 font-bold uppercase">
                Real-Time Viewport Simulator: {previewDevice.toUpperCase()}
              </span>
            </div>

            {/* Device Switcher */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800">
              <button
                onClick={() => setPreviewDevice('desktop')}
                className={`p-1.5 rounded ${previewDevice === 'desktop' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                title="Desktop (100% Fluid)"
              >
                <Monitor className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewDevice('tablet')}
                className={`p-1.5 rounded ${previewDevice === 'tablet' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                title="Tablet (768px)"
              >
                <Tablet className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPreviewDevice('mobile')}
                className={`p-1.5 rounded ${previewDevice === 'mobile' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'}`}
                title="Mobile Phone (375px)"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Rendered Live Hero Simulation */}
          <div className="flex justify-center pt-4 overflow-hidden">
            <div
              className={`transition-all duration-300 rounded-xl overflow-hidden border border-slate-800 ${
                previewDevice === 'desktop'
                  ? 'w-full'
                  : previewDevice === 'tablet'
                  ? 'w-[768px]'
                  : 'w-[375px]'
              }`}
            >
              <HeroVideoPlayer config={heroConfig} isPreview={true}>
                <div className="max-w-3xl text-white space-y-4">
                  {heroConfig.eyebrow && (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-amber-500/30 bg-amber-500/10 text-xs font-mono font-bold uppercase tracking-widest text-amber-400 rounded-md">
                      {heroConfig.eyebrow}
                    </span>
                  )}
                  <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight">
                    {heroConfig.title}
                  </h1>
                  <p className="text-xs sm:text-base text-slate-300 leading-relaxed max-w-2xl">
                    {heroConfig.subtitle}
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    {heroConfig.primaryCta?.visible !== false && (
                      <button className="bg-amber-500 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs shadow-lg">
                        {heroConfig.primaryCta?.text || 'Request a Free Quote'}
                      </button>
                    )}
                    {heroConfig.secondaryCta?.visible !== false && (
                      <button className="bg-slate-900 text-white font-bold px-5 py-2.5 rounded-xl text-xs border border-slate-700">
                        {heroConfig.secondaryCta?.text || 'Calculate Budget (FCFA)'}
                      </button>
                    )}
                  </div>
                </div>
              </HeroVideoPlayer>
            </div>
          </div>
        </div>
      )}

      {/* Editor Subtabs Navigation */}
      <div className="flex flex-wrap gap-2 pt-6 border-b border-slate-800">
        {[
          { id: 'hero', label: 'Hero Section & Video Reel', icon: Film },
          { id: 'sections', label: 'Page Content & Blocks', icon: Layout },
          { id: 'seo', label: 'SEO & Social Meta', icon: Globe },
          { id: 'history', label: `Version History (${revisions.length})`, icon: History }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-t-lg text-xs font-bold transition-colors border-b-2 ${
                isActive
                  ? 'border-amber-500 text-amber-400 bg-slate-950'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* 1. Hero Section & Video Reel Tab */}
      {activeTab === 'hero' && (
        <div className="py-6 space-y-6 text-sm">
          {/* Media Mode Selector */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
              <Film className="w-4 h-4" /> Hero Background Media Configuration
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                heroConfig.mediaType === 'video'
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}>
                <input
                  type="radio"
                  name="mediaType"
                  value="video"
                  checked={heroConfig.mediaType === 'video'}
                  onChange={() => updateHero('mediaType', 'video')}
                  className="text-amber-500"
                />
                <div>
                  <span className="block font-bold text-xs text-white">Full-HD Streaming Video Reel</span>
                  <span className="block text-[11px] text-slate-400">High-impact cinematic site loop with fallback poster</span>
                </div>
              </label>

              <label className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                heroConfig.mediaType === 'image'
                  ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
              }`}>
                <input
                  type="radio"
                  name="mediaType"
                  value="image"
                  checked={heroConfig.mediaType === 'image'}
                  onChange={() => updateHero('mediaType', 'image')}
                  className="text-amber-500"
                />
                <div>
                  <span className="block font-bold text-xs text-white">Static High-Resolution Image</span>
                  <span className="block text-[11px] text-slate-400">Fast loading photography banner with dark gradient</span>
                </div>
              </label>
            </div>

            {/* Video URL & Poster Pickers */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Streaming Video URL (MP4 / WebM / Cloudinary CDN)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={heroConfig.videoUrl || ''}
                    onChange={e => updateHero('videoUrl', e.target.value)}
                    placeholder="https://assets.mixkit.co/videos/...mp4"
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMediaPicker({ target: 'video' })}
                    className="px-3 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-lg border border-slate-700 flex items-center gap-1 shrink-0"
                  >
                    <Film className="w-3.5 h-3.5" /> Library
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Tip: Use MP4 with H.264 encoding for universal cross-device autoplay support.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Fallback Poster &amp; Hero Image (High-Res Image)
                </label>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={heroConfig.posterUrl || ''}
                    onChange={e => updateHero('posterUrl', e.target.value)}
                    placeholder="https://images.unsplash.com/photo-..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowMediaPicker({ target: 'poster' })}
                    className="px-3 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-lg border border-slate-700 flex items-center gap-1 shrink-0"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> Library
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Displays immediately before video streams or when static image mode is active.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hero Image Alt Text (SEO &amp; Screen Readers)</label>
                <input
                  type="text"
                  value={heroConfig.imageAlt || ''}
                  onChange={e => updateHero('imageAlt', e.target.value)}
                  placeholder="Describe the hero photograph or construction scene..."
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div className="flex flex-wrap items-center gap-5 pt-6">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={heroConfig.showHero !== false}
                    onChange={e => updateHero('showHero', e.target.checked)}
                    className="rounded text-amber-500"
                  />
                  Show Hero Banner
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={heroConfig.showVideo !== false}
                    onChange={e => updateHero('showVideo', e.target.checked)}
                    className="rounded text-amber-500"
                  />
                  Enable Hero Video Playback
                </label>
              </div>
            </div>

            {/* Video Playback & Overlay Sliders */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-900">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Dark Overlay Contrast: {heroConfig.videoSettings?.overlayOpacity || 75}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="95"
                  step="5"
                  value={heroConfig.videoSettings?.overlayOpacity !== undefined ? heroConfig.videoSettings.overlayOpacity : 75}
                  onChange={e => updateVideoSettings('overlayOpacity', parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-3 pt-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={heroConfig.videoSettings?.autoplay !== false}
                    onChange={e => updateVideoSettings('autoplay', e.target.checked)}
                    className="rounded text-amber-500"
                  />
                  Autoplay Video Loop
                </label>
              </div>

              <div className="flex items-center gap-3 pt-4">
                <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
                  <input
                    type="checkbox"
                    checked={heroConfig.videoSettings?.disableOnMobile === true}
                    onChange={e => updateVideoSettings('disableOnMobile', e.target.checked)}
                    className="rounded text-amber-500"
                  />
                  Poster Only on Low-Bandwidth Mobile
                </label>
              </div>
            </div>
          </div>

          {/* Hero Typography & Text Content */}
          <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
              Hero Copywriting &amp; Headings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Page Display Title (Admin / Nav)</label>
                <input
                  type="text"
                  value={pageData.title || ''}
                  onChange={e => setPageData({ ...pageData, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Top Eyebrow Badge</label>
                <input
                  type="text"
                  value={heroConfig.eyebrow || ''}
                  onChange={e => updateHero('eyebrow', e.target.value)}
                  placeholder="e.g. Construction & Civil Engineering — Cameroon"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Primary Hero Headline (H1)</label>
              <input
                type="text"
                value={heroConfig.title || ''}
                onChange={e => updateHero('title', e.target.value)}
                placeholder="e.g. Building Cameroon’s Future with Structural Precision & Integrity"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-bold focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hero Subtitle &amp; Scope</label>
              <textarea
                rows={3}
                value={heroConfig.subtitle || ''}
                onChange={e => updateHero('subtitle', e.target.value)}
                placeholder="e.g. From major infrastructure corridors to high-grade commercial and residential complexes in Yaoundé, Douala, and nationwide."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Extended Hero Description (Optional)</label>
              <textarea
                rows={2}
                value={heroConfig.description || ''}
                onChange={e => updateHero('description', e.target.value)}
                placeholder="Additional supporting summary..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* CTAs */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <div className="p-3 bg-slate-900/70 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300">Primary Button CTA</label>
                  <label className="flex items-center gap-1 text-[10px] text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={heroConfig.primaryCta?.visible !== false}
                      onChange={e => updateHero('primaryCta', { ...heroConfig.primaryCta, visible: e.target.checked })}
                      className="rounded text-amber-500"
                    />
                    Visible
                  </label>
                </div>
                <input
                  type="text"
                  value={heroConfig.primaryCta?.text || ''}
                  onChange={e => updateHero('primaryCta', { ...heroConfig.primaryCta, text: e.target.value })}
                  placeholder="Request a Free Quote"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                />
                <input
                  type="text"
                  value={heroConfig.primaryCta?.link || ''}
                  onChange={e => updateHero('primaryCta', { ...heroConfig.primaryCta, link: e.target.value })}
                  placeholder="/request-a-quote"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-[11px] text-amber-300 font-mono"
                />
              </div>

              <div className="p-3 bg-slate-900/70 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300">Secondary Button CTA</label>
                  <label className="flex items-center gap-1 text-[10px] text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={heroConfig.secondaryCta?.visible !== false}
                      onChange={e => updateHero('secondaryCta', { ...heroConfig.secondaryCta, visible: e.target.checked })}
                      className="rounded text-amber-500"
                    />
                    Visible
                  </label>
                </div>
                <input
                  type="text"
                  value={heroConfig.secondaryCta?.text || ''}
                  onChange={e => updateHero('secondaryCta', { ...heroConfig.secondaryCta, text: e.target.value })}
                  placeholder="Calculate Budget (FCFA)"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                />
                <input
                  type="text"
                  value={heroConfig.secondaryCta?.link || ''}
                  onChange={e => updateHero('secondaryCta', { ...heroConfig.secondaryCta, link: e.target.value })}
                  placeholder="/budget-calculator"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-[11px] text-amber-300 font-mono"
                />
              </div>

              <div className="p-3 bg-slate-900/70 rounded-lg border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-slate-300">Tertiary Link CTA</label>
                  <label className="flex items-center gap-1 text-[10px] text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={heroConfig.tertiaryCta?.visible !== false}
                      onChange={e => updateHero('tertiaryCta', { ...heroConfig.tertiaryCta, visible: e.target.checked })}
                      className="rounded text-amber-500"
                    />
                    Visible
                  </label>
                </div>
                <input
                  type="text"
                  value={heroConfig.tertiaryCta?.text || ''}
                  onChange={e => updateHero('tertiaryCta', { ...heroConfig.tertiaryCta, text: e.target.value })}
                  placeholder="Schedule Consultation →"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                />
                <input
                  type="text"
                  value={heroConfig.tertiaryCta?.link || ''}
                  onChange={e => updateHero('tertiaryCta', { ...heroConfig.tertiaryCta, link: e.target.value })}
                  placeholder="/schedule-consultation"
                  className="w-full bg-slate-950 border border-slate-800 rounded px-2.5 py-1 text-[11px] text-amber-300 font-mono"
                />
              </div>
            </div>

            {/* Trust Badges Editor */}
            <div className="pt-3 border-t border-slate-900 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-slate-300">Hero Trust Badges</label>
                <button
                  type="button"
                  onClick={() => updateHero('trustBadges', [...(heroConfig.trustBadges || []), { icon: 'ShieldCheck', text: 'Certified Engineering Standard' }])}
                  className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded text-[11px] font-bold hover:bg-amber-500/20"
                >
                  + Add Badge
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(heroConfig.trustBadges || []).map((badge, bIdx) => (
                  <div key={bIdx} className="flex items-center gap-2 bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <input
                      type="text"
                      value={badge.text}
                      onChange={e => {
                        const updated = [...(heroConfig.trustBadges || [])];
                        updated[bIdx] = { ...updated[bIdx], text: e.target.value };
                        updateHero('trustBadges', updated);
                      }}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded px-2 py-1 text-xs text-white"
                      placeholder="Trust badge text"
                    />
                    <button
                      type="button"
                      onClick={() => updateHero('trustBadges', (heroConfig.trustBadges || []).filter((_, i) => i !== bIdx))}
                      className="p-1 text-slate-400 hover:text-rose-400"
                      title="Remove badge"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Sections Manager Tab */}
      {activeTab === 'sections' && (
        <div className="py-6 space-y-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-400">
              Add, edit rich text, reorder, duplicate, toggle visibility, or remove custom content sections for this page.
            </p>
            <button
              type="button"
              onClick={() => {
                const newSections = [...(pageData.sections || [])];
                newSections.push({
                  id: `sec-${Date.now()}`,
                  type: 'custom',
                  title: 'New Content Section',
                  subtitle: 'Custom section summary',
                  content: '<p>Write structured section content here.</p>',
                  enabled: true,
                  displayOrder: newSections.length + 1
                });
                setPageData({ ...pageData, sections: newSections });
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-lg hover:bg-amber-500/20"
            >
              <Plus className="w-3.5 h-3.5" /> Add Section
            </button>
          </div>

          <div className="space-y-4">
            {Array.isArray(pageData.sections) && pageData.sections.map((sec, idx) => (
              <div key={sec.id || idx} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2.5 flex-1">
                    <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-mono text-amber-500">
                      {idx + 1}
                    </span>
                    <select
                      value={sec.type || 'custom'}
                      onChange={e => {
                        const updated = [...(pageData.sections || [])];
                        updated[idx].type = e.target.value as any;
                        setPageData({ ...pageData, sections: updated });
                      }}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-[11px] font-mono text-amber-400 uppercase font-bold"
                    >
                      <option value="custom">custom</option>
                      <option value="rich_text">rich_text</option>
                      <option value="media_showcase">media_showcase</option>
                      <option value="pillars">pillars</option>
                      <option value="blueprint">blueprint</option>
                      <option value="estimator">estimator</option>
                      <option value="divisions">divisions</option>
                      <option value="workflow">workflow</option>
                      <option value="services">services</option>
                      <option value="stats">stats</option>
                      <option value="why_choose_us">why_choose_us</option>
                      <option value="process">process</option>
                      <option value="team">team</option>
                      <option value="testimonials">testimonials</option>
                      <option value="cta">cta</option>
                      <option value="about">about</option>
                      <option value="projects">projects</option>
                      <option value="faq">faq</option>
                    </select>
                    <input
                      type="text"
                      value={sec.title || ''}
                      onChange={e => {
                        const updated = [...(pageData.sections || [])];
                        updated[idx].title = e.target.value;
                        setPageData({ ...pageData, sections: updated });
                      }}
                      className="flex-1 min-w-[180px] bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-bold"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => {
                        if (idx === 0) return;
                        const updated = [...(pageData.sections || [])];
                        const [moved] = updated.splice(idx, 1);
                        updated.splice(idx - 1, 0, moved);
                        updated.forEach((s, i) => (s.displayOrder = i + 1));
                        setPageData({ ...pageData, sections: updated });
                      }}
                      className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                      title="Move Section Up"
                    >
                      <ChevronUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === (pageData.sections?.length || 0) - 1}
                      onClick={() => {
                        const updated = [...(pageData.sections || [])];
                        if (idx >= updated.length - 1) return;
                        const [moved] = updated.splice(idx, 1);
                        updated.splice(idx + 1, 0, moved);
                        updated.forEach((s, i) => (s.displayOrder = i + 1));
                        setPageData({ ...pageData, sections: updated });
                      }}
                      className="p-1 rounded bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30"
                      title="Move Section Down"
                    >
                      <ChevronDown className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = [...(pageData.sections || [])];
                        const copy = { ...sec, id: `sec-${Date.now()}`, title: `${sec.title || 'Section'} (Copy)` };
                        updated.splice(idx + 1, 0, copy);
                        updated.forEach((s, i) => (s.displayOrder = i + 1));
                        setPageData({ ...pageData, sections: updated });
                      }}
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] text-amber-300 hover:bg-slate-800"
                      title="Duplicate Section"
                    >
                      Duplicate
                    </button>
                    <label className="flex items-center gap-1.5 cursor-pointer text-xs text-slate-300">
                      <input
                        type="checkbox"
                        checked={sec.enabled !== false}
                        onChange={e => {
                          const updated = [...(pageData.sections || [])];
                          updated[idx].enabled = e.target.checked;
                          setPageData({ ...pageData, sections: updated });
                        }}
                        className="rounded text-amber-500"
                      />
                      Visible
                    </label>

                    {confirmDeleteSectionIdx === idx ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = pageData.sections?.filter((_, i) => i !== idx) || [];
                            setPageData({ ...pageData, sections: updated });
                            setConfirmDeleteSectionIdx(null);
                          }}
                          className="px-2 py-1 rounded bg-rose-600 text-white text-[10px] font-bold"
                        >
                          Confirm
                        </button>
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteSectionIdx(null)}
                          className="px-1.5 py-1 rounded bg-slate-800 text-slate-300 text-[10px]"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteSectionIdx(idx)}
                        className="p-1 text-slate-500 hover:text-rose-400"
                        title="Remove section"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Subtitle / Summary</label>
                    <input
                      type="text"
                      value={sec.subtitle || ''}
                      onChange={e => {
                        const updated = [...(pageData.sections || [])];
                        updated[idx].subtitle = e.target.value;
                        setPageData({ ...pageData, sections: updated });
                      }}
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Optional Media / Image / Video URL</label>
                    <div className="flex gap-2">
                      <input
                        type="url"
                        value={sec.mediaUrl || ''}
                        onChange={e => {
                          const updated = [...(pageData.sections || [])];
                          updated[idx].mediaUrl = e.target.value;
                          setPageData({ ...pageData, sections: updated });
                        }}
                        placeholder="https://..."
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200 font-mono"
                      />
                      <button
                        type="button"
                        onClick={() => setShowMediaPicker({ target: 'sectionMedia', sectionIndex: idx })}
                        className="px-2.5 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-[11px] rounded border border-slate-700 flex items-center gap-1 shrink-0"
                      >
                        <ImageIcon className="w-3.5 h-3.5" /> Library
                      </button>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Image Alt Text</label>
                    <input
                      type="text"
                      value={sec.imageAlt || ''}
                      onChange={e => {
                        const updated = [...(pageData.sections || [])];
                        updated[idx].imageAlt = e.target.value;
                        setPageData({ ...pageData, sections: updated });
                      }}
                      placeholder="Descriptive alt text"
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Media Caption</label>
                    <input
                      type="text"
                      value={sec.caption || ''}
                      onChange={e => {
                        const updated = [...(pageData.sections || [])];
                        updated[idx].caption = e.target.value;
                        setPageData({ ...pageData, sections: updated });
                      }}
                      placeholder="Optional caption"
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Section Button Label</label>
                    <input
                      type="text"
                      value={sec.ctaText || ''}
                      onChange={e => {
                        const updated = [...(pageData.sections || [])];
                        updated[idx].ctaText = e.target.value;
                        setPageData({ ...pageData, sections: updated });
                      }}
                      placeholder="e.g. Learn More"
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-slate-200"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-400 mb-1">Section Button URL</label>
                    <input
                      type="text"
                      value={sec.ctaLink || ''}
                      onChange={e => {
                        const updated = [...(pageData.sections || [])];
                        updated[idx].ctaLink = e.target.value;
                        setPageData({ ...pageData, sections: updated });
                      }}
                      placeholder="/contact"
                      className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-amber-300 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Section Rich Text Body (Sanitized HTML)</label>
                  <CmsRichTextEditor
                    value={typeof sec.content === 'string' ? sec.content : ''}
                    onChange={html => {
                      const updated = [...(pageData.sections || [])];
                      updated[idx].content = html;
                      setPageData({ ...pageData, sections: updated });
                    }}
                    minHeight="140px"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. SEO Settings Tab */}
      {activeTab === 'seo' && (
        <div className="py-6 space-y-4 text-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Meta Page Title</label>
              <input
                type="text"
                value={pageData.seo?.seoTitle || ''}
                onChange={e => setPageData({
                  ...pageData,
                  seo: { ...pageData.seo, seoTitle: e.target.value }
                })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Target Keywords</label>
              <input
                type="text"
                value={pageData.seo?.keywords || ''}
                onChange={e => setPageData({
                  ...pageData,
                  seo: { ...pageData.seo, keywords: e.target.value }
                })}
                placeholder="construction cameroon, yaounde builder, eurocode"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Meta Description (150-160 characters)</label>
            <textarea
              rows={3}
              value={pageData.seo?.metaDescription || ''}
              onChange={e => setPageData({
                ...pageData,
                seo: { ...pageData.seo, metaDescription: e.target.value }
              })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">OpenGraph Social Share Title (og:title)</label>
              <input
                type="text"
                value={pageData.seo?.ogTitle || ''}
                onChange={e => setPageData({
                  ...pageData,
                  seo: { ...pageData.seo, ogTitle: e.target.value }
                })}
                placeholder="Defaults to Meta Page Title if blank"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Canonical URL (Optional)</label>
              <input
                type="url"
                value={pageData.seo?.canonicalUrl || ''}
                onChange={e => setPageData({
                  ...pageData,
                  seo: { ...pageData.seo, canonicalUrl: e.target.value }
                })}
                placeholder="https://madeccgroup.online/..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">OpenGraph Social Description (og:description)</label>
              <textarea
                rows={2}
                value={pageData.seo?.ogDescription || ''}
                onChange={e => setPageData({
                  ...pageData,
                  seo: { ...pageData.seo, ogDescription: e.target.value }
                })}
                placeholder="Defaults to Meta Description if blank"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">OpenGraph Share Image URL (og:image)</label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={pageData.seo?.ogImage || ''}
                  onChange={e => setPageData({
                    ...pageData,
                    seo: { ...pageData.seo, ogImage: e.target.value }
                  })}
                  placeholder="https://res.cloudinary.com/..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
                <button
                  type="button"
                  onClick={() => setShowMediaPicker({ target: 'ogImage' })}
                  className="px-3 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-lg border border-slate-700 flex items-center gap-1 shrink-0"
                >
                  <ImageIcon className="w-3.5 h-3.5" /> Library
                </button>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-wrap gap-6">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={pageData.seo?.robotsIndex !== false}
                onChange={e => setPageData({
                  ...pageData,
                  seo: { ...pageData.seo, robotsIndex: e.target.checked }
                })}
                className="rounded text-amber-500"
              />
              Allow Search Engines to Index this Page (index)
            </label>
            <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300">
              <input
                type="checkbox"
                checked={pageData.seo?.robotsFollow !== false}
                onChange={e => setPageData({
                  ...pageData,
                  seo: { ...pageData.seo, robotsFollow: e.target.checked }
                })}
                className="rounded text-amber-500"
              />
              Allow Search Engines to Follow Links (follow)
            </label>
          </div>
        </div>
      )}

      {/* 4. Revision History Tab */}
      {activeTab === 'history' && (
        <div className="py-6 space-y-4 text-sm">
          <p className="text-xs text-slate-400">
            Every published change creates an immutable snapshot. Restore any previous revision with 1-click.
          </p>

          {loadingRevisions ? (
            <div className="py-12 text-center text-slate-400">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-amber-500 mb-2" />
              <p className="text-xs font-mono">Loading Version Revisions...</p>
            </div>
          ) : revisions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 bg-slate-950 rounded-xl border border-slate-800">
              <History className="w-8 h-8 mx-auto mb-2 text-slate-600" />
              <p className="text-xs">No previous revisions recorded for this page yet.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {revisions.map(rev => (
                <div
                  key={rev.id}
                  className="flex items-center justify-between p-3.5 bg-slate-950 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-amber-500/10 text-amber-400 font-mono font-bold text-xs rounded border border-amber-500/30">
                        v{rev.version}
                      </span>
                      <h4 className="font-bold text-xs text-white">{rev.title}</h4>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1">
                      {rev.changeSummary || 'CMS Published Snapshot'} &bull; By <span className="text-slate-300">{rev.author}</span> on {new Date(rev.createdAt).toLocaleString()}
                    </p>
                  </div>

                  <button
                    onClick={() => handleRestoreRevision(rev.id)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-bold rounded-lg border border-slate-700 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Restore Draft
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Create New Custom Page Modal */}
      {showNewPageModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-500" /> Create New Public Page
              </h3>
              <button type="button" onClick={() => setShowNewPageModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateNewPage} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Page Title</label>
                <input
                  type="text"
                  required
                  value={newPageTitle}
                  onChange={e => {
                    setNewPageTitle(e.target.value);
                    if (!newPageSlug) {
                      setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, ''));
                    }
                  }}
                  placeholder="e.g. Investor Relations"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-white"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-300 mb-1">URL Slug</label>
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                  <span className="px-2.5 text-slate-500 font-mono">/</span>
                  <input
                    type="text"
                    required
                    value={newPageSlug}
                    onChange={e => setNewPageSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]+/g, '-'))}
                    placeholder="investor-relations"
                    className="w-full bg-transparent px-1 py-2 text-amber-300 font-mono focus:outline-none"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button type="button" onClick={() => setShowNewPageModal(false)} className="px-3.5 py-2 rounded-lg bg-slate-800 text-slate-300 font-bold">
                  Cancel
                </button>
                <button type="submit" disabled={creatingPage} className="px-4 py-2 rounded-lg bg-amber-500 text-slate-950 font-bold disabled:opacity-50">
                  {creatingPage ? 'Creating...' : 'Create Page Draft'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Media Library Picker Modal */}
      {showMediaPicker && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Film className="w-4 h-4 text-amber-500" /> Select Media Asset from Library
              </h3>
              <button
                type="button"
                onClick={() => setShowMediaPicker(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <CmsMediaLibrary
                isPickerMode={true}
                filterType={showMediaPicker.target === 'video' ? 'video' : showMediaPicker.target === 'sectionMedia' ? 'all' : 'image'}
                onSelectMedia={media => {
                  if (showMediaPicker.target === 'video') {
                    updateHero('videoUrl', media.fileUrl);
                  } else if (showMediaPicker.target === 'poster') {
                    updateHero('posterUrl', media.fileUrl);
                    updateHero('imageUrl', media.fileUrl);
                    if (media.altText) updateHero('imageAlt', media.altText);
                  } else if (showMediaPicker.target === 'image') {
                    updateHero('imageUrl', media.fileUrl);
                    if (media.altText) updateHero('imageAlt', media.altText);
                  } else if (showMediaPicker.target === 'ogImage') {
                    setPageData(prev => ({
                      ...prev,
                      seo: { ...prev.seo, ogImage: media.fileUrl }
                    }));
                  } else if (showMediaPicker.target === 'sectionMedia' && typeof showMediaPicker.sectionIndex === 'number') {
                    const updated = [...(pageData.sections || [])];
                    if (updated[showMediaPicker.sectionIndex]) {
                      updated[showMediaPicker.sectionIndex] = {
                        ...updated[showMediaPicker.sectionIndex],
                        mediaUrl: media.fileUrl,
                        mediaType: media.fileType === 'video' ? 'video' : 'image',
                        imageAlt: media.altText || updated[showMediaPicker.sectionIndex].imageAlt,
                        caption: media.caption || updated[showMediaPicker.sectionIndex].caption
                      };
                      setPageData({ ...pageData, sections: updated });
                    }
                  }
                  setShowMediaPicker(null);
                  showToast('success', `Linked "${media.title}" from Media Library.`);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
