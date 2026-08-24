import { useEffect } from 'react';

interface SEOHandlerProps {
  currentTab: string;
  selectedProjectId: number | null;
}

const TAB_META: Record<string, { title: string; description: string; keywords: string; ogType?: string }> = {
  home: {
    title: 'MADECC Group | Premier Engineering & Construction Firm in Cameroon',
    description: 'Cameroon’s leading multi-disciplinary construction company. Turning blueprints into sustainable architectural masterpieces, custom commercial spaces, and smart estates.',
    keywords: 'construction Cameroon, engineering firm Douala, civil engineering Yaounde, architectural blueprints, sustainable buildings, commercial estate construction, MADECC Group, building contractors Douala, civil tech Africa',
    ogType: 'website'
  },
  about: {
    title: 'About Us | MADECC Group Construction & Engineering',
    description: 'Learn about MADECC Group’s legacy of precision, ISO certified standards, and elite multi-disciplinary team driving sustainable development across Central Africa.',
    keywords: 'about MADECC Group, civil engineers Cameroon, construction standards, sustainable development Cameroon, engineering leadership, structural safety, Cameroon builders, construction quality control',
    ogType: 'profile'
  },
  projects: {
    title: 'Contract Portfolio & Landmark Projects | MADECC Group',
    description: 'Explore our construction milestones and landmark projects in Cameroon. View real-time value budgets, location updates, and completed works.',
    keywords: 'construction portfolio, infrastructure projects Cameroon, road construction Cameroon, commercial builds, building milestones, project tracker, public contracts, civil development',
    ogType: 'website'
  },
  blog: {
    title: 'Industry Insights, News & Civil Tech Blog | MADECC Group',
    description: 'Stay updated with civil engineering trends, construction updates, and expert structural guidelines from MADECC Group experts in Central Africa.',
    keywords: 'civil tech blog, construction news Douala, engineering trends, structural guidelines, concrete testing, safety standards Africa, builders diary Cameroon',
    ogType: 'blog'
  },
  contact: {
    title: 'Contact Engineering Support & Offices | MADECC Group',
    description: 'Get in touch with MADECC Group. Schedule secure on-site inspections, coordinate with engineers, or request professional service proposals.',
    keywords: 'contact construction company, civil engineering support, Douala office, Yaounde engineering, get quote, project consultation, building builders Cameroon',
    ogType: 'website'
  },
  booking: {
    title: 'Book a Construction Consultation & Inspection | MADECC Group',
    description: 'Securely book professional structural assessments, project planning sessions, and soil testing with our multi-disciplinary experts.',
    keywords: 'book construction inspection, schedule soil test, engineering consultation, project estimate Cameroon, structural assessment booking, architect interview Douala',
    ogType: 'website'
  },
  services: {
    title: 'Civil Engineering & Construction Services | MADECC Group',
    description: 'Explore comprehensive engineering services: structural design, commercial building, roadworks, geotechnical surveying, and turnkey EPC contracting.',
    keywords: 'civil engineering services, structural design Douala, EPC contractor Cameroon, road building, geotechnical investigation',
    ogType: 'website'
  },
  'request-a-quote': {
    title: 'Request a Project Quote & Bill of Quantities | MADECC Group',
    description: 'Submit your architectural blueprints and project specifications to receive a verified, detailed engineering estimate within 48 hours.',
    keywords: 'request construction quote, BOQ estimation, building cost Cameroon, civil engineering proposal',
    ogType: 'website'
  },
  'schedule-consultation': {
    title: 'Schedule an Engineering Consultation | MADECC Group',
    description: 'Meet with senior structural engineers and quantity surveyors for on-site analysis and architectural planning.',
    keywords: 'engineering consultation, structural analysis, site inspection Cameroon',
    ogType: 'website'
  },
  'budget-calculator': {
    title: 'Construction Cost & Budget Calculator | MADECC Group',
    description: 'Calculate preliminary structural, architectural, and MEP cost estimates in FCFA for residential and commercial developments in Cameroon.',
    keywords: 'construction cost calculator Cameroon, building budget estimator, cost per square meter Douala',
    ogType: 'website'
  },
  'construction-cost-guide': {
    title: 'Cameroon Construction Cost Guide 2026 | MADECC Group',
    description: 'Official benchmarks for material prices, labor rates, and structural foundation costs across Central Africa.',
    keywords: 'construction cost guide Cameroon, cement prices Douala, steel rates Yaounde, labor cost per day',
    ogType: 'article'
  },
  faq: {
    title: 'Frequently Asked Questions & Help Centre | MADECC Group',
    description: 'Get verified answers to technical questions about building permits, construction costs in Cameroon, subcontracting tenders, soil testing, and project guarantees.',
    keywords: 'construction FAQ Cameroon, building permits Douala, civil engineering questions, building cost per m2, MADECC help centre',
    ogType: 'website'
  },
  tenders: {
    title: 'Tenders & Procurement Opportunities | MADECC Group',
    description: 'Explore live procurement notices, trade subcontracting packages, materials supply tenders, and submit Expressions of Interest (EOI) to MADECC Group.',
    keywords: 'tenders Cameroon, construction procurement Douala, civil engineering contracts, subcontractor prequalification, EOI MADECC',
    ogType: 'website'
  },
  terms: {
    title: 'Terms of Service & Usage Agreements | MADECC Group',
    description: 'Official terms of service, intellectual property guidelines, and contractual policies governing the MADECC Group digital platform.',
    keywords: 'terms of service, legal notice, MADECC Group terms, engineering contracts FIDIC',
    ogType: 'article'
  },
  privacy: {
    title: 'Privacy Policy & Cookie Statement | MADECC Group',
    description: 'MADECC Group data privacy practices in compliance with Cameroon Law No. 2010/012 on Cybersecurity and international privacy frameworks.',
    keywords: 'privacy policy, cookie policy, data protection, Cameroon cybersecurity law',
    ogType: 'article'
  },
  safety: {
    title: 'Quality, Health, Safety & Environment (QHSE) Directive | MADECC Group',
    description: 'Zero-Harm workforce safety policies, PPE standards, and environmental impact controls across all MADECC construction operations.',
    keywords: 'QHSE policy, construction safety Cameroon, PPE requirements, zero harm',
    ogType: 'article'
  },
  'data-deletion': {
    title: 'User Data Deletion & Privacy Rights | MADECC Group',
    description: 'Official Data Erasure & Compliance Request Portal for MADECC Group in compliance with Google AdSense, Meta Platform, GDPR, and Cameroon Law No. 2010/012.',
    keywords: 'data deletion, user privacy rights, erase account data, GDPR erasure, Google AdSense compliance, Facebook data deletion callback, Cameroon cybersecurity law',
    ogType: 'website'
  },
  admin: {
    title: 'Secure Operations Command Center | MADECC Group Admin',
    description: 'Authorized administrative panel for managing contract progress, audit logs, banner slides, and appointment scheduling.',
    keywords: 'admin panel, backend, security operations, user management',
    ogType: 'website'
  },
};

/**
 * High-fidelity SEO handler that dynamically updates document title,
 * meta tags, Open Graph properties, Twitter cards, and appends 
 * rich structured JSON-LD schemas as the user navigates.
 */
export default function SEOHandler({ currentTab, selectedProjectId }: SEOHandlerProps) {
  useEffect(() => {
    let title = TAB_META[currentTab]?.title || 'MADECC Group | Construction & Engineering';
    let description = TAB_META[currentTab]?.description || 'Cameroon’s leading multi-disciplinary construction and engineering firm.';
    let keywords = TAB_META[currentTab]?.keywords || 'construction, engineering, Cameroon, MADECC';
    let ogType = TAB_META[currentTab]?.ogType || 'website';

    if (currentTab === 'projects' && selectedProjectId) {
      title = `Project Timeline #${selectedProjectId} | MADECC Group Portfolio`;
      description = `View real-time construction progress, budget value, and project history for contract #${selectedProjectId}.`;
      keywords = `project timeline, project #${selectedProjectId}, progress milestones, budget tracking, MADECC portfolio`;
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
    const shareImage = `${origin}/images/hero-banner-placeholder.jpg`; // Fallback shareable preview image

    // 2. Set Standard Meta Tags
    setMetaTag('name', 'description', description);
    setMetaTag('name', 'keywords', keywords);
    setMetaTag('name', 'author', 'MADECC Group');
    setMetaTag('name', 'robots', 'index, follow');

    // 3. Set Open Graph Tags
    setMetaTag('property', 'og:title', title);
    setMetaTag('property', 'og:description', description);
    setMetaTag('property', 'og:type', ogType);
    setMetaTag('property', 'og:url', currentUrl);
    setMetaTag('property', 'og:image', shareImage);
    setMetaTag('property', 'og:site_name', 'MADECC Group');

    // 4. Set Twitter Card Tags
    setMetaTag('name', 'twitter:card', 'summary_large_image');
    setMetaTag('name', 'twitter:title', title);
    setMetaTag('name', 'twitter:description', description);
    setMetaTag('name', 'twitter:image', shareImage);

    // 5. Generate JSON-LD Structured Schema
    let schemaObj: any = null;

    if (currentTab === 'home') {
      schemaObj = {
        '@context': 'https://schema.org',
        '@graph': [
          {
            '@type': 'Organization',
            '@id': `${origin}/#organization`,
            'name': 'MADECC Group',
            'url': origin,
            'logo': `${origin}/images/logo.png`,
            'description': 'Cameroon’s premier multi-disciplinary civil engineering and construction firm.',
            'sameAs': [
              'https://www.facebook.com/madeccgroup',
              'https://www.linkedin.com/company/madeccgroup'
            ]
          },
          {
            '@type': 'LocalBusiness',
            '@id': `${origin}/#localbusiness`,
            'name': 'MADECC Group Cameroon HQ',
            'description': 'Cameroon and Pan-Africa leading multi-disciplinary construction, civil engineering, and infrastructure group.',
            'telephone': '+237683316486',
            'email': 'kreboya603@gmail.com',
            'address': {
              '@type': 'PostalAddress',
              'streetAddress': 'Yaoundé Mbankolo',
              'addressLocality': 'Yaoundé',
              'addressRegion': 'Centre',
              'postalCode': '00237',
              'addressCountry': 'CM'
            },
            'geo': {
              '@type': 'GeoCoordinates',
              'latitude': '3.8964',
              'longitude': '11.4888'
            },
            'url': origin,
            'image': shareImage
          },
          {
            '@type': 'Service',
            'name': 'Civil Engineering & Structural Design',
            'provider': { '@id': `${origin}/#organization` },
            'description': 'Advanced structural engineering, foundation calculations, concrete analysis, and customized blueprints using ISO certified standards.'
          },
          {
            '@type': 'Service',
            'name': 'Commercial & Residential Construction',
            'provider': { '@id': `${origin}/#organization` },
            'description': 'Turnkey commercial hubs, luxury high-rises, logistics warehouses, and smart residential estates built with high-fidelity materials.'
          }
        ]
      };
    } else if (currentTab === 'about') {
      schemaObj = {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        'name': 'About MADECC Group',
        'description': 'MADECC Group’s legacy of engineering precision, ISO certifications, and elite multi-disciplinary team driving sustainable development across Cameroon.',
        'publisher': {
          '@type': 'Organization',
          'name': 'MADECC Group',
          'url': origin
        }
      };
    } else if (currentTab === 'projects') {
      if (selectedProjectId) {
        schemaObj = {
          '@context': 'https://schema.org',
          '@type': 'CreativeWork',
          'name': `Construction Contract Milestone #${selectedProjectId}`,
          'description': `Real-time construction progress and timeline verification for milestone ID ${selectedProjectId}.`,
          'creator': {
            '@type': 'Organization',
            'name': 'MADECC Group',
            'url': origin
          }
        };
      } else {
        schemaObj = {
          '@context': 'https://schema.org',
          '@type': 'CollectionPage',
          'name': 'Landmark Projects Portfolio | MADECC Group',
          'description': 'Review public and private construction projects, smart estates, and civil developments managed by MADECC Group.',
          'publisher': {
            '@type': 'Organization',
            'name': 'MADECC Group',
            'url': origin
          }
        };
      }
    } else if (currentTab === 'blog') {
      schemaObj = {
        '@context': 'https://schema.org',
        '@type': 'Blog',
        'name': 'MADECC Group Civil Tech & Engineering Blog',
        'description': 'Professional construction tech insights, structural engineering news, and planning guidelines from MADECC Group senior directors.',
        'publisher': {
          '@type': 'Organization',
          'name': 'MADECC Group',
          'url': origin
        }
      };
    } else if (currentTab === 'contact' || currentTab === 'booking') {
      schemaObj = {
        '@context': 'https://schema.org',
        '@type': 'ContactPage',
        'name': 'Contact and Consultation Booking | MADECC Group',
        'description': 'Connect directly with senior estimators and civil engineers for assessments, proposals, or inspections.',
        'publisher': {
          '@type': 'Organization',
          'name': 'MADECC Group',
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
      // Remove script tag if not on a page that needs custom JSON-LD
      const jsonLdScript = document.getElementById('seo-jsonld');
      if (jsonLdScript) {
        jsonLdScript.remove();
      }
    }
  }, [currentTab, selectedProjectId]);

  return null; // Renderless helper
}
