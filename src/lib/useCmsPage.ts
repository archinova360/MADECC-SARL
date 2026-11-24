import { useState, useEffect, useCallback, useMemo } from 'react';
import { HeroSectionConfig, PageContent, PageSection, SeoConfig } from '../types.ts';

export interface UseCmsPageResult {
  page: PageContent | null;
  hero: HeroSectionConfig;
  sections: PageSection[];
  orderedSections: PageSection[];
  seo: SeoConfig | null;
  isUnpublished: boolean;
  loading: boolean;
  refresh: () => Promise<void>;
  getSection: (key: string) => PageSection | undefined;
  isSectionEnabled: (key: string, defaultValue?: boolean) => boolean;
  getCustomSections: (knownTypes?: string[]) => PageSection[];
}

export function useCmsPage(
  slug: string,
  fallbackHero?: Partial<HeroSectionConfig>
): UseCmsPageResult {
  const [page, setPage] = useState<PageContent | null>(null);
  const [isUnpublished, setIsUnpublished] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchPage = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/cms/pages/${encodeURIComponent(slug)}?mode=live`, {
        credentials: 'include'
      });
      const data = await res.json().catch(() => null);
      if (res.status === 404 && data?.unpublished) {
        setIsUnpublished(true);
        setPage(null);
      } else if (res.ok && data?.success) {
        setIsUnpublished(false);
        setPage(data as PageContent);
      } else {
        setIsUnpublished(false);
      }
    } catch {
      // Non-blocking fallback keeps built-in page content working
      setIsUnpublished(false);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage]);

  const hero = useMemo<HeroSectionConfig>(() => {
    const base: HeroSectionConfig = {
      title: fallbackHero?.title || '',
      subtitle: fallbackHero?.subtitle || '',
      description: fallbackHero?.description || '',
      eyebrow: fallbackHero?.eyebrow || '',
      mediaType: fallbackHero?.mediaType || 'video',
      videoUrl: fallbackHero?.videoUrl ?? null,
      posterUrl: fallbackHero?.posterUrl ?? null,
      imageUrl: fallbackHero?.imageUrl ?? null,
      imageAlt: fallbackHero?.imageAlt ?? null,
      showHero: fallbackHero?.showHero !== false,
      showVideo: fallbackHero?.showVideo !== false,
      trustBadges: fallbackHero?.trustBadges,
      videoSettings: fallbackHero?.videoSettings,
      primaryCta: fallbackHero?.primaryCta,
      secondaryCta: fallbackHero?.secondaryCta,
      tertiaryCta: fallbackHero?.tertiaryCta
    };
    if (!page?.heroConfig) return base;
    const h = page.heroConfig;
    return {
      ...base,
      ...h,
      title: h.title || base.title,
      subtitle: h.subtitle || base.subtitle,
      description: h.description || base.description,
      eyebrow: h.eyebrow !== undefined ? h.eyebrow : base.eyebrow,
      primaryCta: h.primaryCta ? { ...base.primaryCta, ...h.primaryCta } : base.primaryCta,
      secondaryCta: h.secondaryCta ? { ...base.secondaryCta, ...h.secondaryCta } : base.secondaryCta,
      tertiaryCta: h.tertiaryCta ? { ...base.tertiaryCta, ...h.tertiaryCta } : base.tertiaryCta,
      videoSettings: h.videoSettings ? { ...base.videoSettings, ...h.videoSettings } : base.videoSettings,
      trustBadges: Array.isArray(h.trustBadges) && h.trustBadges.length > 0 ? h.trustBadges : base.trustBadges
    };
  }, [page?.heroConfig, fallbackHero]);

  const sections = useMemo<PageSection[]>(() => {
    return Array.isArray(page?.sections) ? page.sections : [];
  }, [page?.sections]);

  const orderedSections = useMemo<PageSection[]>(() => {
    return [...sections]
      .filter((s) => s && s.enabled !== false)
      .sort((a, b) => (a.displayOrder ?? 999) - (b.displayOrder ?? 999));
  }, [sections]);

  const getSection = useCallback(
    (key: string): PageSection | undefined => {
      const normalized = key.toLowerCase();
      return sections.find(
        (s) =>
          (s.id || '').toLowerCase() === normalized ||
          (s.type || '').toLowerCase() === normalized ||
          (s.id || '').toLowerCase().includes(normalized)
      );
    },
    [sections]
  );

  const isSectionEnabled = useCallback(
    (key: string, defaultValue = true): boolean => {
      const sec = getSection(key);
      if (!sec) return defaultValue;
      return sec.enabled !== false;
    },
    [getSection]
  );

  const getCustomSections = useCallback(
    (knownTypes: string[] = []): PageSection[] => {
      const known = new Set(knownTypes.map((k) => k.toLowerCase()));
      return orderedSections.filter((s) => {
        const t = (s.type || '').toLowerCase();
        const id = (s.id || '').toLowerCase();
        if (t === 'custom' || t === 'rich_text' || t === 'media_showcase') return true;
        if (known.size > 0 && !known.has(t) && !known.has(id)) return true;
        return false;
      });
    },
    [orderedSections]
  );

  return {
    page,
    hero,
    sections,
    orderedSections,
    seo: page?.seo || null,
    isUnpublished,
    loading,
    refresh: fetchPage,
    getSection,
    isSectionEnabled,
    getCustomSections
  };
}

export interface PublishedPageSummary {
  slug: string;
  title: string;
  status: string;
}

export function useCmsPagesRegistry() {
  const [pages, setPages] = useState<PublishedPageSummary[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPages = useCallback(async () => {
    try {
      const res = await fetch('/api/cms/pages', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data?.success && Array.isArray(data.pages)) {
          setPages(data.pages);
        }
      }
    } catch {
      // Graceful fallback
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPages();
  }, [fetchPages]);

  const unpublishedSlugs = useMemo(() => {
    const set = new Set<string>();
    for (const p of pages) {
      if (p.status === 'UNPUBLISHED' || p.status === 'ARCHIVED') {
        set.add((p.slug || '').toLowerCase());
      }
    }
    return set;
  }, [pages]);

  const publishedPages = useMemo(
    () => pages.filter((p) => p.status !== 'UNPUBLISHED' && p.status !== 'ARCHIVED'),
    [pages]
  );

  const isSlugHidden = useCallback(
    (slug: string) => unpublishedSlugs.has((slug || '').replace(/^\//, '').toLowerCase()),
    [unpublishedSlugs]
  );

  return {
    pages,
    publishedPages,
    unpublishedSlugs,
    isSlugHidden,
    loading,
    refresh: fetchPages
  };
}
