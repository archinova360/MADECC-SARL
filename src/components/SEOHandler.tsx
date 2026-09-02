import { useEffect } from 'react';
import { Tenant } from '../types.ts';
import { TenantContentService } from '../services/tenantContentService.ts';

interface SEOHandlerProps {
  currentTab: string;
  selectedProjectId: number | null;
  currentTenant?: Tenant;
}

/**
 * High-fidelity Multi-Tenant SEO handler that dynamically updates document title,
 * meta tags, Open Graph properties, Twitter cards, and appends 
 * rich structured JSON-LD schemas as the user navigates, customized per tenant.
 */
export default function SEOHandler({ currentTab, selectedProjectId, currentTenant }: SEOHandlerProps) {
  const tenantId = currentTenant?.id || 1;
  const profile = TenantContentService.getProfile(tenantId);
  const tenant = currentTenant || profile.tenant;

  useEffect(() => {
    const brandName = tenant.name;
    const legalName = tenant.legalName || brandName;
    const country = tenant.country || 'Cameroon';
    const city = tenant.address?.includes('Douala') ? 'Douala' : tenant.address?.includes('Yaoundé') ? 'Yaoundé' : 'Cameroon';

    const TAB_META: Record<string, { title: string; description: string; keywords: string; ogType?: string }> = {
      home: {
        title: profile.seo.metaTitle || `${brandName} | Premier Civil Engineering & Construction Firm`,
        description: profile.seo.metaDescription || `${brandName} delivers certified structural engineering, infrastructure development, and transparent cost estimates across ${country}.`,
        keywords: profile.seo.keywords || `construction ${country}, civil engineering ${city}, building contractor, ${brandName}`,
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

    let title = TAB_META[currentTab]?.title || `${brandName} | Construction & Engineering`;
    let description = TAB_META[currentTab]?.description || `${brandName} is a leading multi-disciplinary civil engineering firm.`;
    let keywords = TAB_META[currentTab]?.keywords || `construction, engineering, ${country}, ${brandName}`;
    let ogType = TAB_META[currentTab]?.ogType || 'website';

    if (currentTab === 'projects' && selectedProjectId) {
      title = `Project Timeline #${selectedProjectId} | ${brandName} Portfolio`;
      description = `View real-time construction progress, budget value, and project history for contract #${selectedProjectId} with ${brandName}.`;
      keywords = `project timeline, project #${selectedProjectId}, progress milestones, budget tracking, ${brandName}`;
      ogType = 'article';
    }

    // 1. Set Document Title
    document.title = title;

    // Helper to set or update dynamic meta tags
    const setMetaTag = (attrName: string, attrVal: string, content: string) => {
      let el = document.querySelector(`meta[${attrName}="${attrVal}"]`);
      if (!el) {
        el = document.createElement('meta');
        el.setAttribute(attrName, attrVal);
        document.head.appendChild(el);
      }
      el.setAttribute('content', content);
    };

    const origin = window.location.origin;
    const currentUrl = window.location.href;
    const shareImage = profile.seo.ogImage || `${origin}/logo.png`;

    // 2. Set Standard Meta Tags
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', keywords);
    setMetaTag('name', 'author', legalName);
    setMetaTag('name', 'robots', 'index, follow');

    // 3. Set Open Graph Tags
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:url', currentUrl);
    setMetaTag('property', 'og:image', shareImage);
    setMetaTag('property', 'og:site_name', brandName);

    // 4. Set Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', shareImage);

    // 5. Generate Dynamic JSON-LD Structured Schema
    const primaryPhone = tenant.phone || tenant.settings?.phone || '+237671063511';
    const primaryEmail = tenant.email || tenant.settings?.email || 'contact@madeccgroup.online';
    const primaryAddress = tenant.address || tenant.settings?.companyAddress || 'Commercial Avenue, Cameroon';

    let schemaObj: any = null;

    if (currentTab === 'home') {
      schemaObj = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': `${origin}/#organization`,
            'name': brandName,
            'legalName': legalName,
            'url': origin,
            'logo': tenant.logoUrl ? (tenant.logoUrl.startsWith('http') ? tenant.logoUrl : `${origin}${tenant.logoUrl}`) : `${origin}/logo.png`,
            'description': profile.seo.metaDescription,
            'email': primaryEmail,
            'telephone': primaryPhone,
            'sameAs': Object.values(tenant.settings?.socialLinks || {}).filter(Boolean)
          },
          {
            '@type': profile.seo.schemaType || 'GeneralContractor',
            '@id': `${origin}/#localbusiness`,
            'name': `${brandName} Headquarters`,
            'description': profile.hero.subtitle,
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
        'description': profile.about.story,
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
    }

    // Append/update JSON-LD script tag in the document head
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
  }, [currentTab, selectedProjectId, tenantId, tenant]);

  return null; // Renderless helper
}
