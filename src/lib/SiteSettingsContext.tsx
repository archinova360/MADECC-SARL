import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SiteSettings } from '../types.ts';
import { getCsrfHeaders } from './csrf.ts';

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
  developerName: 'MADECC GROUP PLC',
  phone: '+237 683 316 486',
  phoneSecondary: '+237 671 063 511',
  phoneTertiary: '+237 640 194 505',
  emergencyPhone: '+237 671 063 511',
  email: 'Infomadeccconstruction@gmail.com',
  secondaryEmail: 'madecccons@gmail.com',
  officeAddressYaounde: 'Mbankolo, Yaoundé, Cameroon',
  officeAddressDouala: 'Akwa Boulevard de la Liberté, Douala, Littoral Region, Cameroon',
  businessHours: 'Mon - Fri: 08:00 - 18:00 | Sat: 08:30 - 13:00 (WAT)',
  whatsappNumber: '+237 683 316 486',
  whatsappSecondary: '+237 671 063 511',
  paymentMtnNumbers: '+237 683 316 486 (KREBOYA GILLES)',
  paymentOrangeNumbers: '+237 690 000 000 (MADECC GROUP SARL)',
  paymentInstructions: 'Include your Project ID or Order Reference in the Mobile Money transaction memo for instant automated clearance.',
  facebookUrl: 'https://facebook.com/madeccgroup',
  linkedinUrl: 'https://linkedin.com/company/madeccgroup',
  instagramUrl: 'https://instagram.com/madeccgroup',
  youtubeUrl: 'https://youtube.com/@madeccgroup',
  twitterUrl: 'https://x.com/madeccgroup',
  tiktokUrl: 'https://tiktok.com/@madeccgroup',
  pinterestUrl: 'https://pinterest.com/madeccgroup',
  rccmNumber: 'RC/YAO/2021/B/1429',
  niuTaxId: 'M052114299876K',
  legalStatus: 'Société à Responsabilité Limitée (SARL)',
  shareHeadline: 'MADECC GROUP — Premier Construction & Civil Engineering in Central Africa',
  shareDescription: 'Explore certified civil engineering, structural calculations, digital BOQs, and heavy construction services across Cameroon with MADECC GROUP.',
  logoUrl: '/logo.png',
  faviconUrl: '/favicon.ico',
  themeSettings: {
    primaryColor: '#f59e0b',
    accentColor: '#d97706',
    borderRadius: '0.75rem',
    containerWidth: '1280px'
  },
  globalSeo: {
    seoTitle: 'MADECC GROUP | Civil Engineering & Construction Cameroon',
    metaDescription: 'Certified general contractor and civil engineering firm specializing in commercial complexes, road infrastructure, and turnkey buildings in Cameroon.',
    keywords: 'construction cameroon, yaounde builder, civil engineering, madecc group, building contractor douala',
    robotsIndex: true
  },
  navigationLinks: [
    { id: 'home', label: 'Home', href: '/', order: 1, isEnabled: true },
    { id: 'services', label: 'Services', href: '/services', order: 2, isEnabled: true },
    { id: 'projects', label: 'Projects', href: '/projects', order: 3, isEnabled: true },
    { id: 'sustainability', label: 'Sustainability', href: '/sustainability', order: 4, isEnabled: true },
    { id: 'tenders', label: 'Tenders', href: '/tenders', order: 5, isEnabled: true },
    { id: 'developers', label: 'Developer APIs', href: '/developers', order: 6, isEnabled: true },
    { id: 'contact', label: 'Contact', href: '/contact', order: 7, isEnabled: true }
  ],
  footerContent: {
    aboutText: 'MADECC GROUP is a premier multi-disciplinary construction, design-build, and civil engineering firm. We construct landmarks of absolute structural integrity, sustainability, and architectural excellence.',
    copyrightText: '© 2026 MADECC GROUP. All rights reserved.',
    accreditationBadges: ['ISO 9001:2015 Certified', 'Eurocode Compliance', 'MINTP Registered Contractor']
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

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch('/api/cms/settings');
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings(prev => ({
            ...prev,
            ...data.settings,
            // Ensure nested objects merge gracefully
            themeSettings: {
              ...prev.themeSettings,
              ...(data.settings.themeSettings || {})
            },
            footerContent: {
              ...prev.footerContent,
              ...(data.settings.footerContent || {})
            },
            emergencyBanner: {
              ...prev.emergencyBanner,
              ...(data.settings.emergencyBanner || {})
            }
          }));
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

  // Apply CSS custom properties for dynamic custom brand themes
  useEffect(() => {
    if (settings?.themeSettings) {
      const root = document.documentElement;
      if (settings.themeSettings.primaryColor) {
        root.style.setProperty('--brand-primary', settings.themeSettings.primaryColor);
      }
      if (settings.themeSettings.accentColor) {
        root.style.setProperty('--brand-accent', settings.themeSettings.accentColor);
      }
      if (settings.themeSettings.borderRadius) {
        root.style.setProperty('--brand-radius', settings.themeSettings.borderRadius);
      }
    }
  }, [settings?.themeSettings]);

  const updateSettings = async (newSettings: Partial<SiteSettings>): Promise<boolean> => {
    try {
      const csrf = await getCsrfHeaders();
      const res = await fetch('/api/cms/settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...csrf
        },
        body: JSON.stringify(newSettings)
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success && data.settings) {
          setSettings(data.settings);
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
