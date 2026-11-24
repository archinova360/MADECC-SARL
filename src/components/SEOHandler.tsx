import { useEffect } from 'react';
import { Tenant } from '../types.ts';
import { TenantContentService } from '../services/tenantContentService.ts';
import { useSiteSettings } from '../lib/SiteSettingsContext.tsx';

interface SEOHandlerProps {
  currentTab: string;
  selectedProjectId: number | null;
  currentTenant?: Tenant;
}

/**
 * High-fidelity Multi-Tenant SEO handler that dynamically updates document title,
 * meta tags, Open Graph properties, Twitter cards, and appends 
 * rich structured JSON-LD schemas as the user navigates, customized per tenant & CMS settings.
 */
export default function SEOHandler({ currentTab, selectedProjectId, currentTenant }: SEOHandlerProps) {
  const { settings } = useSiteSettings();
  const tenantId = currentTenant?.id || 1;
  const profile = TenantContentService.getProfile(tenantId);
  const tenant = currentTenant || profile.tenant;
  const isFlagship = tenant.isFlagship !== false;

  useEffect(() => {
    const brandName = (isFlagship && settings?.siteName) ? settings.siteName : tenant.name;
    const legalName = tenant.legalName || brandName;
    const country = tenant.country || 'Cameroon';
    const addressText = (isFlagship && settings?.officeAddressYaounde) ? settings.officeAddressYaounde : (tenant.address || 'Yaoundé, Cameroon');
    const city = addressText.includes('Douala') ? 'Douala' : addressText.includes('Yaoundé') ? 'Yaoundé' : 'Cameroon';

    const TAB_META: Record<string, { title: string; description: string; keywords: string; ogType?: string }> = {
      home: {
        title: (isFlagship && settings?.globalSeo?.seoTitle) || profile.seo.metaTitle || `${brandName} | Premier Civil Engineering & Construction Firm`,
        description: (isFlagship && settings?.globalSeo?.metaDescription) || profile.seo.metaDescription || `${brandName} delivers certified structural engineering, infrastructure development, and transparent cost estimates across ${country}.`,
        keywords: (isFlagship && settings?.globalSeo?.keywords) || profile.seo.keywords || `construction ${country}, civil engineering ${city}, building contractor, ${brandName}`,
        ogType: 'website'
      },
      about: {
        title: `About Us | ${brandName} Engineering & Leadership`,
        description: profile.about.story.substring(0, 160) || `Learn about ${brandName}'s history of precision engineering, certifications, and technical team driving infrastructure in ${country}.`,
        keywords: `about ${brandName}, civil engineers ${city}, construction standards, ${country} builders, engineering team`,
        ogType: 'profile'
      },
      projects: {
        title: `Contract Portfolio & Landmark Projects | ${brandName}`,
        description: `Explore our construction milestones and landmark projects delivered by ${brandName}. Real-time value budgets and completed works.`,
        keywords: `construction portfolio, infrastructure projects ${city}, commercial builds, ${brandName} projects`,
        ogType: 'website'
      },
      services: {
        title: `Civil Engineering & Construction Services | ${brandName}`,
        description: `Explore comprehensive engineering services from ${brandName}: structural design, general contracting, earthworks, and turnkey execution.`,
        keywords: `civil engineering services, structural design ${city}, EPC contractor ${country}, ${brandName} services`,
        ogType: 'website'
      },
      sustainability: {
        title: `Sustainability & Social Impact | ${brandName}`,
        description: `Low-carbon construction, local economic empowerment, and ISO-aligned QHSE practices by ${brandName} across ${country}.`,
        keywords: `sustainable construction ${country}, ESG, QHSE safety, green building, ${brandName}`,
        ogType: 'website'
      },
      blog: {
        title: `Insights & Technical Publications | ${brandName}`,
        description: `Read engineering whitepapers, regulatory updates, and structural construction guides published by ${brandName}.`,
        keywords: `construction insights, engineering blog ${country}, Eurocode articles, ${brandName}`,
        ogType: 'website'
      },
      'website-development': {
        title: `Website Development Services | ${brandName}`,
        description: `Custom corporate websites, full-stack client portals, MTN MoMo and Orange Money e-commerce, and technical SEO engineered by ${brandName}.`,
        keywords: `website development ${country}, web portal development ${city}, mobile money ecommerce, technical SEO, ${brandName}`,
        ogType: 'website'
      },
      'client-portal': {
        title: `Client Construction & Digital Portal | ${brandName}`,
        description: `Secure client dashboard to monitor live construction progress, site photos, milestones, invoices, and website requests with ${brandName}.`,
        keywords: `client portal, project tracking, construction invoices, website requests, ${brandName}`,
        ogType: 'website'
      },
      'request-a-quote': {
        title: `Request a Project Quote & Bill of Quantities | ${brandName}`,
        description: `Submit your architectural blueprints and project specifications to receive a verified, detailed engineering estimate from ${brandName}.`,
        keywords: `request construction quote, BOQ estimation, building cost ${country}, ${brandName}`,
        ogType: 'website'
      },
      'schedule-consultation': {
        title: `Schedule an Engineering Consultation | ${brandName}`,
        description: `Meet with senior structural engineers and quantity surveyors at ${brandName} for on-site analysis and architectural planning.`,
        keywords: `engineering consultation, structural analysis, site inspection ${city}, ${brandName}`,
        ogType: 'website'
      },
      contact: {
        title: `Contact Engineering Support & Offices | ${brandName}`,
        description: `Get in touch with ${brandName}. Schedule on-site inspections, coordinate with engineers, or request technical proposals.`,
        keywords: `contact construction company, civil engineering support, ${city} office, ${brandName} phone`,
        ogType: 'website'
      },
      'budget-calculator': {
        title: `Construction Cost & Budget Calculator | ${brandName}`,
        description: `Calculate preliminary structural, architectural, and MEP cost estimates in ${tenant.currency} for developments with ${brandName}.`,
        keywords: `construction cost calculator ${country}, building budget estimator, cost per square meter, ${brandName}`,
        ogType: 'website'
      },
      'construction-cost-guide': {
        title: `${country} Construction Cost Guide 2026 | ${brandName}`,
        description: `Official benchmarks for material prices, labor rates, and structural foundation costs across ${country} from ${brandName}.`,
        keywords: `construction cost guide ${country}, cement prices, steel rates, labor cost, ${brandName}`,
        ogType: 'article'
      },
      'walkthrough-guide': {
        title: `Complete Visitor & Client Walkthrough Guide | ${brandName}`,
        description: `Step-by-step interactive guide for visitors and clients using ${brandName}'s construction budget calculators, 2026 cost guides, quote requests, and 2,199 XAF certified document downloads.`,
        keywords: `visitor guide ${brandName}, how to use ${brandName}, construction calculator guide, 2199 XAF receipt download, ${country}`,
        ogType: 'article'
      },
      'navigation-manual': {
        title: `Navigation Manual (A4 PDF) — 999 XAF | ${brandName}`,
        description: `Official v4.0 Navigation Manual (A4 PDF) covering all 18 public portals, the 11-category Admin Dashboard, 10 GB media upload system, and 999 / 2,199 XAF unlock workflow for ${brandName}.`,
        keywords: `navigation manual A4 PDF, ${brandName} manual, 999 XAF PDF, admin dashboard guide, ${country}`,
        ogType: 'article'
      },
      'buyer-handover-manual': {
        title: `Buyer Brand Handover Manual (PDF) — 999 XAF | ${brandName}`,
        description: `Official Buyer Brand Handover Manual (PDF) with customizable Ownership Transfer Certificate, no-code CMS rebranding guide, paymentDomain.ts transfer, and infrastructure checklist for ${brandName}.`,
        keywords: `buyer brand handover manual, white-label transfer PDF, ${brandName} handover, 999 XAF PDF, ${country}`,
        ogType: 'article'
      },
      faq: {
        title: `Frequently Asked Questions & Technical Help | ${brandName}`,
        description: `Verified answers to technical questions about building permits, construction costs, soil testing, and project guarantees from ${brandName}.`,
        keywords: `construction FAQ ${country}, building permits, civil engineering questions, ${brandName}`,
        ogType: 'website'
      },
      tenders: {
        title: `Tenders & Procurement Opportunities | ${brandName}`,
        description: `Explore procurement notices, trade subcontracting packages, materials supply tenders, and submit Expressions of Interest to ${brandName}.`,
        keywords: `tenders ${country}, construction procurement, civil engineering contracts, ${brandName}`,
        ogType: 'website'
      },
      terms: {
        title: `Terms of Service & Agreements | ${brandName}`,
        description: `Official terms of service, intellectual property guidelines, and contractual policies governing the ${brandName} platform.`,
        keywords: `terms of service, legal notice, ${brandName} terms`,
        ogType: 'article'
      },
      privacy: {
        title: `Privacy Policy & Cookie Statement | ${brandName}`,
        description: `${brandName} data privacy practices in compliance with national cybersecurity laws and international privacy frameworks.`,
        keywords: `privacy policy, cookie policy, data protection, ${brandName}`,
        ogType: 'article'
      },
      safety: {
        title: `Quality, Health, Safety & Environment (QHSE) Directive | ${brandName}`,
        description: `Zero-Harm workforce safety policies, PPE standards, and environmental controls across all ${brandName} operations.`,
        keywords: `QHSE policy, construction safety, PPE requirements, zero harm, ${brandName}`,
        ogType: 'article'
      },
      cookies: {
        title: `Cookie Policy & Tracking Notice | ${brandName}`,
        description: `Cookie preferences, essential session cookies, and consent disclosures for ${brandName}.`,
        keywords: `cookie policy, tracking notice, ${brandName}`,
        ogType: 'article'
      },
      disclaimer: {
        title: `Legal & Engineering Estimates Disclaimer | ${brandName}`,
        description: `Disclaimer regarding automated cost calculators, feasibility estimates, and engineering services at ${brandName}.`,
        keywords: `engineering disclaimer, calculator estimates, ${brandName}`,
        ogType: 'article'
      },
      copyright: {
        title: `Copyright & Intellectual Property Notice | ${brandName}`,
        description: `Intellectual property ownership and OAPI protection notice for ${brandName}.`,
        keywords: `copyright notice, OAPI intellectual property, ${brandName}`,
        ogType: 'article'
      },
      'acceptable-use': {
        title: `Acceptable Use Policy | ${brandName}`,
        description: `Acceptable use standards for ${brandName} portals, APIs, and public services.`,
        keywords: `acceptable use policy, platform rules, ${brandName}`,
        ogType: 'article'
      },
      'data-protection': {
        title: `Data Protection & Cybersecurity Compliance | ${brandName}`,
        description: `Data protection safeguards under Cameroon Law No. 2010/012 and international privacy frameworks at ${brandName}.`,
        keywords: `data protection, Cameroon Law 2010/012, GDPR, ${brandName}`,
        ogType: 'article'
      },
      'api-terms': {
        title: `Developer & Paid API Platform Terms | ${brandName}`,
        description: `Commercial terms, rate limits, and API key responsibilities for ${brandName} Developer Portal.`,
        keywords: `API terms of use, developer agreement, ${brandName}`,
        ogType: 'article'
      },
      'investor-disclaimer': {
        title: `Investor & Partnership Disclosure Disclaimer | ${brandName}`,
        description: `Transparent registration disclosure and partnership terms for ${brandName}.`,
        keywords: `investor disclaimer, partnership terms, ${brandName}`,
        ogType: 'article'
      },
      'data-deletion': {
        title: `User Data Deletion & Privacy Rights | ${brandName}`,
        description: `Official Data Erasure & Compliance Request Portal for ${brandName} in compliance with Google AdSense, Meta Platform, and GDPR.`,
        keywords: `data deletion, user privacy rights, erase account data, GDPR erasure, Google AdSense compliance, ${brandName}`,
        ogType: 'website'
      },
      admin: {
        title: `Operations Command Center | ${brandName} Admin`,
        description: `Authorized administrative panel for managing contract progress, audit logs, banner slides, and appointment scheduling.`,
        keywords: `admin panel, backend, security operations, user management, ${brandName}`,
        ogType: 'website'
      }
    };

    const formattedTabTitle = currentTab
      .replace(/-/g, ' ')
      .replace(/\b\w/g, (l) => l.toUpperCase());

    let title = TAB_META[currentTab]?.title || `${formattedTabTitle} | ${brandName}`;
    let description = TAB_META[currentTab]?.description || (isFlagship && settings?.globalSeo?.metaDescription) || `${brandName} is a leading multi-disciplinary civil engineering firm.`;
    let keywords = TAB_META[currentTab]?.keywords || (isFlagship && settings?.globalSeo?.keywords) || `construction, engineering, ${country}, ${brandName}`;
    let ogType = TAB_META[currentTab]?.ogType || 'website';

    if (currentTab === 'projects' && selectedProjectId) {
      title = `Project Timeline #${selectedProjectId} | ${brandName} Portfolio`;
      description = `View real-time construction progress, budget value, and project history for contract #${selectedProjectId} with ${brandName}.`;
      keywords = `project timeline, project #${selectedProjectId}, progress milestones, budget tracking, ${brandName}`;
      ogType = 'article';
    }

    document.title = title;

    const setMetaTag = (attrName: string, attrVal: string, content: string) => {
      let el = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const setCanonicalTag = (url: string) => {
      let el = document.querySelector('link[rel="canonical"]');
      if (!el) {
        el = document.createElement('link');
        el.setAttribute('rel', 'canonical');
        document.head.appendChild(el);
      }
      el.setAttribute('href', url);
    };

    const PRODUCTION_ORIGIN = (isFlagship && settings?.globalSeo?.canonicalUrl) || 'https://madeccgroup.online';
    const origin = window.location.hostname.includes('madeccgroup.online') ? 'https://madeccgroup.online' : window.location.origin;
    const path = currentTab === 'home' ? '' : currentTab;
    const canonicalBase = PRODUCTION_ORIGIN.replace(/\/$/, '');
    const canonicalUrl = `${canonicalBase}/${path}`;
    const currentUrl = `${origin}/${path}`;
    const rawLogoUrl = isFlagship && settings?.logoUrl && settings.logoUrl !== '/logo.png' ? settings.logoUrl : tenant.logoUrl;
    const shareImage = (isFlagship && settings?.globalSeo?.ogImage)
      ? settings.globalSeo.ogImage
      : profile.seo.ogImage && !profile.seo.ogImage.endsWith('/logo.png')
        ? profile.seo.ogImage
        : (rawLogoUrl && rawLogoUrl !== '/logo.png'
          ? (rawLogoUrl.startsWith('http') ? rawLogoUrl : `${canonicalBase}${rawLogoUrl}`)
          : `${canonicalBase}/logo.webp`);

    setCanonicalTag(canonicalUrl);

    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', keywords);
    setMetaTag('name', 'author', legalName);
    const defaultRobotsIndex = (isFlagship && settings?.globalSeo?.robotsIndex === false) ? 'noindex' : 'index';
    setMetaTag('name', 'robots', `${defaultRobotsIndex}, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1`);

    setMetaTag('property', 'og:title', (isFlagship && currentTab === 'home' && settings?.globalSeo?.ogTitle) || title);
    setMetaTag('property', 'og:description', (isFlagship && currentTab === 'home' && settings?.globalSeo?.ogDescription) || description);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:url', currentUrl);
    setMetaTag('property', 'og:image', shareImage);
    setMetaTag('property', 'og:site_name', brandName);

    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', shareImage);

    const primaryPhone = (isFlagship && settings?.phone) || tenant.phone || tenant.settings?.phone || '+237 683 316 486';
    const primaryEmail = (isFlagship && settings?.email) || tenant.email || tenant.settings?.email || 'kreboya603@gmail.com';
    const primaryAddress = addressText;

    const cmsSocialLinks = isFlagship && settings
      ? [
          settings.linkedinUrl,
          settings.facebookUrl,
          settings.youtubeUrl,
          settings.twitterUrl,
          settings.instagramUrl,
          settings.tiktokUrl,
          settings.pinterestUrl
        ].filter(Boolean)
      : Object.values(tenant.settings?.socialLinks || {}).filter(Boolean);

    let schemaObj: any = null;

    if (currentTab === 'home') {
      const resolvedLogo = rawLogoUrl && rawLogoUrl !== '/logo.png'
        ? (rawLogoUrl.startsWith('http') ? rawLogoUrl : `${origin}${rawLogoUrl}`)
        : `${origin}/logo.webp`;
      schemaObj = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': `${origin}/#organization`,
            'name': brandName,
            'legalName': legalName,
            'taxID': (isFlagship && settings?.niuTaxId) || tenant.settings?.taxNumber || 'P030217852934P',
            'founder': {
              '@type': 'Person',
              'name': (isFlagship && settings?.developerName) || 'Kasah Rodrick Reboya'
            },
            'url': origin,
            'logo': resolvedLogo,
            'description': description,
            'email': primaryEmail,
            'telephone': primaryPhone,
            'sameAs': cmsSocialLinks
          },
          {
            '@type': profile.seo.schemaType || 'GeneralContractor',
            '@id': `${origin}/#localbusiness`,
            'name': `${brandName} Headquarters`,
            'description': (isFlagship && settings?.tagline) || profile.hero.subtitle,
            'telephone': primaryPhone,
            'email': primaryEmail,
            'address': {
              '@type': 'PostalAddress',
              'streetAddress': primaryAddress,
              'addressLocality': city,
              'addressCountry': country
            },
            'url': origin,
            'image': shareImage,
            'priceRange': '$$$$'
          },
          ...profile.services.map(s => ({
            '@type': 'Service',
            'name': s.name || (s as any).title,
            'provider': { '@id': `${origin}/#organization` },
            'description': s.description
          }))
        ]
      };
    } else if (currentTab === 'about') {
      schemaObj = {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        'name': `About ${brandName}`,
        'description': description,
        'publisher': {
          '@type': 'Organization',
          'name': brandName,
          'legalName': legalName,
          'url': origin
        }
      };
    } else if (currentTab === 'projects') {
      if (selectedProjectId) {
        schemaObj = {
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          'name': `Construction Milestone #${selectedProjectId} | ${brandName}`,
          'description': `Verified construction progress for milestone ID ${selectedProjectId}.`,
          'creator': {
            '@type': 'Organization',
            'name': brandName,
            'url': origin
          }
        };
      } else {
        schemaObj = {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          'name': `Landmark Projects Portfolio | ${brandName}`,
          'description': `Engineering portfolio and landmark projects managed by ${brandName}.`,
          'publisher': {
            '@type': 'Organization',
            'name': brandName,
            'url': origin
          }
        };
      }
    } else if (currentTab === 'contact' || currentTab === 'schedule-consultation') {
      schemaObj = {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        'name': `Contact and Consultation Booking | ${brandName}`,
        'description': `Connect directly with senior engineers and estimators at ${brandName}.`,
        'publisher': {
          '@type': 'Organization',
          'name': brandName,
          'url': origin
        }
      };
    } else if (currentTab === 'website-development' || currentTab === 'services') {
      schemaObj = {
        '@context': 'https://schema.org',
        '@type': 'Service',
        'serviceType': currentTab === 'website-development'
          ? 'Website & Full-Stack Web Portal Development'
          : 'Civil Engineering, Construction & Digital Development Services',
        'provider': {
          '@type': 'Organization',
          'name': brandName,
          'legalName': legalName,
          'url': origin,
          'telephone': primaryPhone,
          'email': primaryEmail
        },
        'areaServed': {
          '@type': 'Country',
          'name': country
        }
      };
    }

    if (schemaObj) {
      let jsonLdScript = document.getElementById('seo-jsonld') as HTMLScriptElement | null;
      if (!jsonLdScript) {
        jsonLdScript = document.createElement('script');
        jsonLdScript.id = 'seo-jsonld';
        jsonLdScript.type = 'application/ld+json';
        document.head.appendChild(jsonLdScript);
      }
      jsonLdScript.textContent = JSON.stringify(schemaObj);
    } else {
      const jsonLdScript = document.getElementById('seo-jsonld');
      if (jsonLdScript) {
        jsonLdScript.remove();
      }
    }

    // 6. Non-blocking Live CMS SEO Override Hydration (from Neon DB /api/cms/pages/:slug?mode=live)
    let cancelled = false;
    const slug = (currentTab || 'home').toLowerCase();
    if (slug !== 'admin' && slug !== 'super-admin') {
      fetch(`/api/cms/pages/${encodeURIComponent(slug)}?mode=live`)
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (cancelled || !data || !data.seo) return;
          const cmsSeo = data.seo;
          if (cmsSeo.seoTitle) {
            document.title = cmsSeo.seoTitle;
            setMetaTag('property', 'og:title', cmsSeo.ogTitle || cmsSeo.seoTitle);
            setMetaTag('name', 'twitter:title', cmsSeo.ogTitle || cmsSeo.seoTitle);
          }
          if (cmsSeo.metaDescription) {
            setMetaTag('name', 'description', cmsSeo.metaDescription);
            setMetaTag('property', 'og:description', cmsSeo.ogDescription || cmsSeo.metaDescription);
            setMetaTag('name', 'twitter:description', cmsSeo.ogDescription || cmsSeo.metaDescription);
          }
          if (cmsSeo.keywords) {
            setMetaTag('name', 'keywords', cmsSeo.keywords);
          }
          if (cmsSeo.canonicalUrl) {
            setCanonicalTag(cmsSeo.canonicalUrl);
          }
          if (cmsSeo.ogImage) {
            setMetaTag('property', 'og:image', cmsSeo.ogImage);
            setMetaTag('name', 'twitter:image', cmsSeo.ogImage);
          }
          const idx = cmsSeo.robotsIndex === false ? 'noindex' : 'index';
          const flw = cmsSeo.robotsFollow === false ? 'nofollow' : 'follow';
          setMetaTag('name', 'robots', `${idx}, ${flw}, max-snippet:-1, max-image-preview:large, max-video-preview:-1`);
        })
        .catch(() => {});
    }

    return () => {
      cancelled = true;
    };
  }, [currentTab, selectedProjectId, tenantId, tenant, isFlagship, settings]);

  return null;
}
