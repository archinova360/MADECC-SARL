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
import HeroVideoPlayer from './HeroVideoPlayer.tsx';
import CmsMediaLibrary from './CmsMediaLibrary.tsx';

const DEFAULT_PAGES_LIST = [
  { id: 1, slug: 'home', title: 'Home Page', status: 'PUBLISHED', version: 1 },
  { id: 2, slug: 'about', title: 'About Us', status: 'PUBLISHED', version: 1 },
  { id: 3, slug: 'services', title: 'Services & Engineering', status: 'PUBLISHED', version: 1 },
  { id: 4, slug: 'projects', title: 'Major Projects & Corridors', status: 'PUBLISHED', version: 1 },
  { id: 5, slug: 'sustainability', title: 'Sustainability & ESG', status: 'PUBLISHED', version: 1 },
  { id: 6, slug: 'tenders', title: 'Procurement & Tenders', status: 'PUBLISHED', version: 1 },
  { id: 7, slug: 'suppliers', title: 'Supplier Registration', status: 'PUBLISHED', version: 1 },
  { id: 8, slug: 'careers', title: 'Careers & Talent', status: 'PUBLISHED', version: 1 },
  { id: 9, slug: 'contact', title: 'Contact & Offices', status: 'PUBLISHED', version: 1 }
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
    title: slug === 'home' ? 'MADECC Group — Building Cameroon’s Future' : `${slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')} | MADECC Group`,
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
    posterUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1920&q=80',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1920&q=80',
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
    seoTitle: `${slug.charAt(0).toUpperCase() + slug.slice(1).replace(/-/g, ' ')} | MADECC Group Cameroon`,
    metaDescription: 'Leading civil engineering, road infrastructure, and commercial construction contractor in Cameroon.',
    keywords: 'construction cameroon, yaounde builder, civil engineering',
    robotsIndex: true
  }
});

export default function CmsPageBuilder() {
  const [pages, setPages] = useState<Array<{ id: number; slug: string; title: string; status: string; version: number }>>(DEFAULT_PAGES_LIST);
  const [selectedSlug, setSelectedSlug] = useState('home');
  const [pageData, setPageData] = useState<PageContent>(() => createDefaultPageContent('home'));
  const [loading, setLoading] = useState(false);
  const [savingDraft, setSavingDraft] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Active builder tab: 'hero' | 'sections' | 'seo' | 'history'
  const [activeTab, setActiveTab] = useState<'hero' | 'sections' | 'seo' | 'history'>('hero');

  // Preview Mode
  const [showPreview, setShowPreview] = useState(false);
  const [previewDevice, setPreviewDevice] = useState<'desktop' | 'tablet' | 'mobile'>('desktop');

  // Revisions & History
  const [revisions, setRevisions] = useState<CmsRevision[]>([]);
  const [loadingRevisions, setLoadingRevisions] = useState(false);

  // Media picker modal state for Hero video/poster
  const [showMediaPicker, setShowMediaPicker] = useState<null | 'video' | 'poster' | 'image'>(null);

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
    try {
      const res = await fetch(`/api/cms/pages/${slug}?mode=draft`);
      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setPageData(data);
        } else {
          setPageData(prev => prev.slug === slug ? prev : createDefaultPageContent(slug));
        }
      } else {
        setPageData(prev => prev.slug === slug ? prev : createDefaultPageContent(slug));
      }
    } catch (err) {
      console.error('Failed to fetch page data:', err);
      setPageData(prev => prev.slug === slug ? prev : createDefaultPageContent(slug));
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
      const res = await fetch(`/api/cms/pages/${selectedSlug}/draft`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...csrf
        },
        body: JSON.stringify({
          heroConfig: pageData.heroConfig,
          sections: pageData.sections,
          seo: pageData.seo,
          title: pageData.title
        })
      });

      if (!res.ok) throw new Error('Failed to save draft');
      const data = await res.json();
      if (data.success) {
        setPageData(prev => prev ? { ...prev, status: 'DRAFT', draftData: data.page.draftData } : null);
        showToast('success', 'Draft saved safely without modifying live site.');
        fetchPages();
      }
    } catch (err: any) {
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
      const res = await fetch(`/api/cms/pages/${selectedSlug}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...csrf
        },
        body: JSON.stringify({
          heroConfig: pageData.heroConfig,
          sections: pageData.sections,
          seo: pageData.seo,
          changeSummary: `Published version by CMS Admin on ${new Date().toLocaleTimeString()}`
        })
      });

      if (!res.ok) throw new Error('Failed to publish changes');
      const data = await res.json();
      if (data.success) {
        setPageData(prev => prev ? { 
          ...prev, 
          status: 'PUBLISHED', 
          version: data.version, 
          publishedAt: new Date().toISOString() 
        } : null);
        showToast('success', `Version ${data.version} is now LIVE on the public website!`);
        fetchPages();
        fetchRevisions(selectedSlug);
      }
    } catch (err: any) {
      showToast('error', err.message || 'Error publishing page');
    } finally {
      setPublishing(false);
    }
  };

  // Restore Revision Handler
  const handleRestoreRevision = async (revId: number) => {
    if (!window.confirm('Restore this snapshot into your current draft? You can preview before publishing.')) {
      return;
    }

    try {
      const csrf = await getCsrfHeaders();
      const res = await fetch(`/api/cms/pages/${selectedSlug}/restore/${revId}`, {
        method: 'POST',
        headers: csrf
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
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Layout className="w-5 h-5 text-amber-500" /> Full-Stack CMS & Frontend Page Studio
            </h2>

            {/* Status Pill */}
            <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold tracking-wider uppercase ${
              pageData.status === 'PUBLISHED' 
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            }`}>
              {pageData.status} (v{pageData.version})
            </span>
          </div>

          <p className="text-xs text-slate-400 mt-1">
            Edit text, high-definition background video reels, layouts, and SEO for all public pages in real time.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Page Picker */}
          <select
            value={selectedSlug}
            onChange={e => setSelectedSlug(e.target.value)}
            className="bg-slate-950 border border-slate-700 text-slate-200 text-xs font-bold rounded-lg px-3 py-2 focus:outline-none focus:border-amber-500"
          >
            {pages.map(p => (
              <option key={p.slug} value={p.slug}>
                {p.title} ({p.slug})
              </option>
            ))}
          </select>

          {/* Real-time Preview Toggle */}
          <button
            onClick={() => setShowPreview(!showPreview)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition-colors border ${
              showPreview 
                ? 'bg-amber-500 text-slate-950 border-amber-400' 
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            {showPreview ? 'Close Preview' : 'Interactive Preview'}
          </button>

          {/* Save Draft */}
          <button
            onClick={handleSaveDraft}
            disabled={savingDraft}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold px-3.5 py-2 rounded-lg text-xs border border-slate-700 transition-colors disabled:opacity-50"
            id="cms-save-draft-btn"
          >
            {savingDraft ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save Draft
          </button>

          {/* Publish Live */}
          <button
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
                    onClick={() => setShowMediaPicker('video')}
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
                  Fallback Poster & Instant Frame (High-Res Image)
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
                    onClick={() => setShowMediaPicker('poster')}
                    className="px-3 bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold text-xs rounded-lg border border-slate-700 flex items-center gap-1 shrink-0"
                  >
                    <ImageIcon className="w-3.5 h-3.5" /> Library
                  </button>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Displays immediately before video streams or if user disables background video.
                </p>
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
              Hero Copywriting & Headings
            </h3>

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
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Hero Subtitle & Scope</label>
              <textarea
                rows={3}
                value={heroConfig.subtitle || ''}
                onChange={e => updateHero('subtitle', e.target.value)}
                placeholder="e.g. From major infrastructure corridors to high-grade commercial and residential complexes in Yaoundé, Douala, and nationwide."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            {/* CTAs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Primary Button CTA</label>
                <input
                  type="text"
                  value={heroConfig.primaryCta?.text || ''}
                  onChange={e => updateHero('primaryCta', { ...heroConfig.primaryCta, text: e.target.value })}
                  placeholder="Request a Free Quote"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Secondary Button CTA</label>
                <input
                  type="text"
                  value={heroConfig.secondaryCta?.text || ''}
                  onChange={e => updateHero('secondaryCta', { ...heroConfig.secondaryCta, text: e.target.value })}
                  placeholder="Calculate Budget (FCFA)"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Tertiary Link CTA</label>
                <input
                  type="text"
                  value={heroConfig.tertiaryCta?.text || ''}
                  onChange={e => updateHero('tertiaryCta', { ...heroConfig.tertiaryCta, text: e.target.value })}
                  placeholder="Schedule Consultation →"
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. Sections Manager Tab */}
      {activeTab === 'sections' && (
        <div className="py-6 space-y-4 text-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs text-slate-400">
              Organize, toggle visibility, and customize section titles across this page.
            </p>
            <button
              onClick={() => {
                const newSections = [...(pageData.sections || [])];
                newSections.push({
                  id: `sec-${Date.now()}`,
                  type: 'custom',
                  title: 'New Content Section',
                  subtitle: 'Custom section description',
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

          <div className="space-y-3">
            {Array.isArray(pageData.sections) && pageData.sections.map((sec, idx) => (
              <div key={sec.id || idx} className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-xs font-mono text-amber-500">
                      {idx + 1}
                    </span>
                    <span className="font-mono text-xs text-amber-400 uppercase font-bold">[{sec.type}]</span>
                    <input
                      type="text"
                      value={sec.title || ''}
                      onChange={e => {
                        const updated = [...(pageData.sections || [])];
                        updated[idx].title = e.target.value;
                        setPageData({ ...pageData, sections: updated });
                      }}
                      className="bg-slate-900 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-bold"
                    />
                  </div>

                  <div className="flex items-center gap-3">
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
                      Active
                    </label>

                    <button
                      onClick={() => {
                        const updated = pageData.sections?.filter((_, i) => i !== idx) || [];
                        setPageData({ ...pageData, sections: updated });
                      }}
                      className="p-1 text-slate-500 hover:text-rose-400"
                      title="Remove section"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

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
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-300"
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

          <div className="pt-2">
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
              Allow Google & Search Engines to Index this Page (Recommended for AdSense approval)
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

      {/* Media Library Picker Modal */}
      {showMediaPicker && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-slate-800">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Film className="w-4 h-4 text-amber-500" /> Select Media Asset from Library
              </h3>
              <button
                onClick={() => setShowMediaPicker(null)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              <CmsMediaLibrary
                isPickerMode={true}
                filterType={showMediaPicker === 'video' ? 'video' : 'image'}
                onSelectMedia={media => {
                  if (showMediaPicker === 'video') {
                    updateHero('videoUrl', media.fileUrl);
                    if (media.caption) updateHero('title', media.caption);
                  } else if (showMediaPicker === 'poster') {
                    updateHero('posterUrl', media.fileUrl);
                  } else if (showMediaPicker === 'image') {
                    updateHero('imageUrl', media.fileUrl);
                  }
                  setShowMediaPicker(null);
                  showToast('success', `Linked "${media.title}" to Hero configuration.`);
                }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
