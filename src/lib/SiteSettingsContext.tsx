import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SiteSettings } from '../types.ts';
import { getCsrfHeaders } from './csrf.ts';
import { getAuthToken } from './firebase.ts';

interface SiteSettingsContextType {
  settings: SiteSettings | null;
  loading: boolean;
  isFollowModalOpen: boolean;
  openFollowModal: () => void;
  closeFollowModal: () => void;
  refreshSettings: () => Promise<void>;
  updateSettings: (newSettings: Partial<SiteSettings>) => Promise<boolean>;
}

const defaultSettings: SiteSettings = {
  id: 1,
  siteName: 'MADECC GROUP',
  tagline: 'Leading Civil Engineering, Infrastructure & Turnkey Construction in Cameroon',
  developerName: 'Kasah Rodrick Reboya',
  phone: '+237 683 316 486',
  phoneSecondary: '+237 671 063 511',
  phoneTertiary: '+237 640 194 505',
  emergencyPhone: '+237 671 063 511',
  email: 'kreboya603@gmail.com',
  secondaryEmail: 'Infomadeccconstruction@gmail.com',
  officeAddressYaounde: 'Yaoundé, Cameroon',
  officeAddressDouala: 'Douala, Littoral Region, Cameroon',
  businessHours: 'Mon - Fri: 08:00 - 18:00 | Sat: 08:30 - 13:00 (WAT)',
  whatsappNumber: '+237 683 316 486',
  whatsappSecondary: '+237 671 063 511',
  paymentMtnNumbers: '+237 683 316 486 (KREBOYA GILLES)',
  paymentOrangeNumbers: '+237 690 000 000 (MADECC GROUP)',
  paymentInstructions: 'Include your Project ID or Order Reference in the Mobile Money transaction memo for instant automated clearance.',
  facebookUrl: 'https://facebook.com/madeccgroup',
  linkedinUrl: 'https://linkedin.com/company/madeccgroup',
  instagramUrl: 'https://instagram.com/madeccgroup',
  youtubeUrl: 'https://youtube.com/@madeccgroup',
  twitterUrl: 'https://x.com/madeccgroup',
  tiktokUrl: 'https://tiktok.com/@madeccgroup',
  pinterestUrl: 'https://pinterest.com/madeccgroup',
  rccmNumber: '',
  niuTaxId: 'P030217852934P',
  legalStatus: 'Individual establishment registration pending',
  shareHeadline: 'MADECC GROUP — Premier Construction & Civil Engineering in Central Africa',
  shareDescription: 'Explore certified civil engineering, structural calculations, digital BOQs, and heavy construction services across Cameroon with MADECC GROUP.',
  logoUrl: '/logo.webp',
  faviconUrl: '/favicon.ico',
  themeSettings: {
    primaryColor: '#f59e0b',
    secondaryColor: '#0f172a',
    accentColor: '#d97706',
    fontHeading: 'Inter',
    fontBody: 'Inter',
    borderRadius: '0.75rem',
    buttonStyle: 'rounded',
    headerStyle: 'sticky',
    footerStyle: 'standard',
    homepageLayout: 'standard',
    mobileCompactSpacing: false,
    mobileDisableHeroVideo: false,
    containerWidth: '1280px'
  },
  globalSeo: {
    seoTitle: 'MADECC GROUP | Civil Engineering & Construction Cameroon',
    metaDescription: 'Certified general contractor and civil engineering firm specializing in commercial complexes, road infrastructure, and turnkey buildings in Cameroon.',
    keywords: 'construction cameroon, yaounde builder, civil engineering, madecc group, building contractor douala',
    canonicalUrl: 'https://madeccgroup.online',
    robotsIndex: true
  },
  navigationLinks: [
    { id: 'home', label: 'Home', href: '/', order: 1, isEnabled: true },
    { id: 'store', label: 'Bookstore', href: '/store', order: 2, isEnabled: true },
    { id: 'services', label: 'Services', href: '/services', order: 3, isEnabled: true },
    { id: 'projects', label: 'Projects', href: '/projects', order: 4, isEnabled: true },
    { id: 'schedule-consultation', label: 'Consultation', href: '/schedule-consultation', order: 5, isEnabled: true },
    { id: 'blog', label: 'Insights', href: '/blog', order: 6, isEnabled: true }
  ],
  footerContent: {
    aboutText: 'MADECC GROUP is a premier multi-disciplinary construction, design-build, and civil engineering firm. We construct landmarks of absolute structural integrity, sustainability, and architectural excellence.',
    copyrightText: '© 2026 MADECC GROUP. All rights reserved.',
    accreditationBadges: ['Eurocode 2 Design Reference', 'Formal Registration Pending'],
    quickLinks: [
      { label: 'Home Page', href: '/home' },
      { label: 'Client Portal (Live Progress & Invoices)', href: '/client-portal' },
      { label: 'KRR Bookstore & Textbooks', href: '/store' },
      { label: 'Track Order & Downloads', href: '/order-tracking' },
      { label: 'Visitor & Client Walkthrough Guide', href: '/walkthrough-guide' },
      { label: 'Our Services', href: '/services' },
      { label: 'Website Development Services', href: '/website-development' },
      { label: 'Sustainability & ESG', href: '/sustainability' },
      { label: 'Tenders & Procurement', href: '/tenders' },
      { label: 'FAQ / Help Centre', href: '/faq' },
      { label: 'Projects Portfolio', href: '/projects' },
      { label: 'Project Budget Calculator', href: '/budget-calculator' },
      { label: 'Schedule Consultation', href: '/schedule-consultation' },
      { label: 'Construction Cost Guide', href: '/construction-cost-guide' },
      { label: 'Developer & Paid API Platform', href: '/developers' },
      { label: 'Request a Quote', href: '/request-a-quote' },
      { label: 'About MADECC', href: '/about' },
      { label: 'Contact Office', href: '/contact' },
      { label: 'Site Map & Architecture Index', href: '/sitemap' },
      { label: 'Data Deletion & Privacy', href: '/data-deletion' }
    ]
  },
  emergencyBanner: {
    enabled: false,
    message: 'Active emergency dispatch and rapid structural rescue teams are on standby nationwide.',
    linkText: 'Contact Emergency Dispatch',
    linkUrl: 'tel:237671063511',
    badgeType: 'urgent'
  },
  updatedAt: new Date().toISOString()
};

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: defaultSettings,
  loading: false,
  isFollowModalOpen: false,
  openFollowModal: () => {},
  closeFollowModal: () => {},
  refreshSettings: async () => {},
  updateSettings: async () => false
});

const GOOGLE_FONT_URLS: Record<string, string> = {
  'Plus Jakarta Sans': 'Plus+Jakarta+Sans:wght@400;500;600;700;800',
  Montserrat: 'Montserrat:wght@400;500;600;700;800',
  'Playfair Display': 'Playfair+Display:wght@500;600;700;800',
  Roboto: 'Roboto:wght@400;500;700',
  'Space Grotesk': 'Space+Grotesk:wght@400;500;600;700'
};

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);

  const mergeWithDefaults = (incoming: any): SiteSettings => ({
    ...defaultSettings,
    ...incoming,
    themeSettings: {
      ...defaultSettings.themeSettings,
      ...(incoming?.themeSettings || {})
    },
    globalSeo: {
      ...defaultSettings.globalSeo,
      ...(incoming?.globalSeo || {})
    },
    footerContent: {
      ...defaultSettings.footerContent,
      ...(incoming?.footerContent || {}),
      quickLinks:
        Array.isArray(incoming?.footerContent?.quickLinks) && incoming.footerContent.quickLinks.length > 0
          ? incoming.footerContent.quickLinks
          : defaultSettings.footerContent?.quickLinks
    },
    emergencyBanner: {
      ...defaultSettings.emergencyBanner,
      ...(incoming?.emergencyBanner || {})
    }
  });

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/cms/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings(mergeWithDefaults(data.settings));
        }
      }
    } catch (err) {
      console.warn('[SiteSettings] Failed to fetch settings from API, using defaults:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Apply CSS custom properties, typography, and favicon dynamically
  useEffect(() => {
    const ts = settings?.themeSettings;
    if (ts) {
      const root = document.documentElement;
      if (ts.primaryColor) root.style.setProperty('--brand-primary', ts.primaryColor);
      if (ts.secondaryColor) root.style.setProperty('--brand-secondary', ts.secondaryColor);
      if (ts.accentColor) root.style.setProperty('--brand-accent', ts.accentColor);
      if (ts.borderRadius) root.style.setProperty('--brand-radius', ts.borderRadius);

      const btnRadius =
        ts.buttonStyle === 'pill' ? '9999px' : ts.buttonStyle === 'sharp' ? '0.25rem' : ts.borderRadius || '0.75rem';
      root.style.setProperty('--brand-btn-radius', btnRadius);

      if (ts.containerWidth) root.style.setProperty('--brand-container', ts.containerWidth);

      const headingFont = ts.fontHeading || 'Inter';
      const bodyFont = ts.fontBody || 'Inter';
      root.style.setProperty('--font-heading', `"${headingFont}", "Inter", system-ui, sans-serif`);
      root.style.setProperty('--font-body', `"${bodyFont}", "Inter", system-ui, sans-serif`);
      if (bodyFont && bodyFont !== 'Inter') {
        document.body.style.fontFamily = `"${bodyFont}", "Inter", system-ui, sans-serif`;
      } else {
        document.body.style.fontFamily = '';
      }

      // Dynamically load custom Google Fonts if selected
      const familiesToLoad = Array.from(new Set([headingFont, bodyFont]))
        .map((f) => GOOGLE_FONT_URLS[f])
        .filter(Boolean);
      if (familiesToLoad.length > 0) {
        let fontLink = document.getElementById('madecc-custom-google-fonts') as HTMLLinkElement | null;
        const href = `https://fonts.googleapis.com/css2?${familiesToLoad.map((f) => `family=${f}`).join('&')}&display=swap`;
        if (!fontLink) {
          fontLink = document.createElement('link');
          fontLink.id = 'madecc-custom-google-fonts';
          fontLink.rel = 'stylesheet';
          document.head.appendChild(fontLink);
        }
        if (fontLink.href !== href) {
          fontLink.href = href;
        }
      }
    }

    // Dynamic Favicon synchronization when custom favicon is uploaded/set
    if (settings?.faviconUrl && settings.faviconUrl.trim() && settings.faviconUrl !== '/favicon.ico') {
      const iconHref = settings.faviconUrl.trim();
      let shortcutLink = document.querySelector('link[rel="shortcut icon"]') as HTMLLinkElement | null;
      if (!shortcutLink) {
        shortcutLink = document.createElement('link');
        shortcutLink.rel = 'shortcut icon';
        document.head.appendChild(shortcutLink);
      }
      shortcutLink.href = iconHref;

      const iconLinks = document.querySelectorAll('link[rel="icon"]');
      iconLinks.forEach((lnk) => {
        (lnk as HTMLLinkElement).href = iconHref;
      });
    }
  }, [settings?.themeSettings, settings?.faviconUrl]);

  const updateSettings = async (newSettings: Partial<SiteSettings>): Promise<boolean> => {
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
      const res = await fetch('/api/cms/settings', {
        method: 'PUT',
        credentials: 'include',
        headers,
        body: JSON.stringify(newSettings)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings(mergeWithDefaults(data.settings));
          return true;
        }
      }
      return false;
    } catch (err) {
      console.error('[SiteSettings] Error updating settings:', err);
      return false;
    }
  };

  const openFollowModal = () => setIsFollowModalOpen(true);
  const closeFollowModal = () => setIsFollowModalOpen(false);

  return (
    <SiteSettingsContext.Provider
      value={{
        settings,
        loading,
        isFollowModalOpen,
        openFollowModal,
        closeFollowModal,
        refreshSettings: fetchSettings,
        updateSettings
      }}
    >
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
