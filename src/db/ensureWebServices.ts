import { db } from './index.ts';
import { services } from './schema.ts';
import { eq, sql } from 'drizzle-orm';

export interface SeedWebServiceSpec {
  slug: string;
  serviceCode: string;
  name: string;
  shortDescription: string;
  description: string;
  fullDescription: string;
  category: string;
  status: string;
  featured: boolean;
  displayOrder: number;
  priceRange: string;
  icon: string;
  coverImage: string;
  overview: string;
  whatWeDeliver: string[];
  deliverables: string[];
  processSteps: { title: string; desc: string }[];
  typicalProjects: string[];
  industriesServed: string[];
  faqs: { q: string; a: string }[];
  ctaText: string;
  ctaDestination: string;
  seoTitle: string;
  metaDescription: string;
  keywords: string;
  details: string;
}

export const WEBSITE_DEVELOPMENT_SERVICES: SeedWebServiceSpec[] = [
  {
    slug: 'corporate-website-development',
    serviceCode: 'MD-WEB-001',
    name: 'Corporate & Business Website Development',
    shortDescription:
      'High-converting corporate websites, bilingual EN/FR company platforms, responsive mobile-first interfaces, technical SEO, and cloud hosting engineered for growth.',
    description:
      'Custom-engineered corporate and enterprise websites built with React, TypeScript, and PostgreSQL/CMS back-ends tailored for Cameroon and international markets.',
    fullDescription:
      'MADECC GROUP builds authoritative corporate and institutional websites that convert visitors into qualified enquiries. Every site is engineered from clean semantic code—featuring mobile-first UX, bilingual EN/FR readiness, dynamic database content management, technical Schema.org SEO, and fast global CDN deployment.',
    category: 'Website & Digital Development',
    status: 'PUBLISHED',
    featured: true,
    displayOrder: 11,
    priceRange: '350,000 - 1,800,000 FCFA',
    icon: 'Globe',
    coverImage:
      'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=1200&q=80',
    overview:
      'We design and develop production-grade corporate websites for construction firms, B2B enterprises, NGOs, consultancies, and regional institutions with complete administrative CMS control.',
    whatWeDeliver: [
      'Custom responsive UI/UX architecture tailored to your brand identity',
      'Live Admin CMS for pages, portfolio items, blog insights, and team profiles',
      'Lead capture quote/contact workflows backed by PostgreSQL & SMTP alerts',
      'Technical SEO, XML sitemap, OpenGraph cards, and Google Search Console setup',
      'SSL/HTTPS security hardening and Netlify / cloud edge deployment'
    ],
    deliverables: [
      'Production corporate web application with custom domain & SSL',
      'Admin content dashboard for zero-code ongoing updates',
      'Technical SEO audit report, XML sitemap & Schema.org markup',
      'Staff handover training & operational documentation'
    ],
    processSteps: [
      { title: 'Discovery & Architecture', desc: 'Information architecture, brand positioning, sitemap planning, and conversion funnel design.' },
      { title: 'UI/UX Engineering', desc: 'High-contrast, accessible layouts across mobile, tablet, and desktop breakpoints.' },
      { title: 'Full-Stack CMS Integration', desc: 'Connecting PostgreSQL databases, admin publishing tools, and automated SMTP email workflows.' },
      { title: 'SEO & Launch Verification', desc: 'Core Web Vitals tuning, canonical & Schema.org verification, and live DNS cutover.' }
    ],
    typicalProjects: [
      'Construction & Engineering Corporate Portals',
      'B2B & Industrial Enterprise Websites',
      'Real Estate Showcase & Lead Intake Sites',
      'Institutional & NGO Digital Platforms'
    ],
    industriesServed: [
      'Civil Engineering & Construction',
      'Real Estate & Property Development',
      'Logistics & Industrial Supply',
      'Professional Advisory & Legal Firms'
    ],
    faqs: [
      {
        q: 'Can we update pages, articles, and services ourselves after launch?',
        a: 'Yes. Every corporate platform includes a database-backed Admin CMS so authorized staff can publish updates without touching source code.'
      },
      {
        q: 'Is hosting and domain setup included?',
        a: 'We configure DNS, SSL certificates, cloud deployment, and SMTP email routing on your owned domain so you retain 100% ownership.'
      }
    ],
    ctaText: 'Request Corporate Website Quote',
    ctaDestination: 'request-a-quote',
    seoTitle: 'Corporate Website Development Cameroon | MADECC GROUP',
    metaDescription:
      'Custom corporate websites, bilingual EN/FR company platforms, CMS management, and technical SEO engineered by MADECC GROUP.',
    keywords: 'corporate website development Cameroon, web design Yaounde Douala, enterprise website MADECC',
    details: 'Custom React/TypeScript frontend, PostgreSQL CMS, responsive UI, technical SEO, SMTP lead forms, SSL & cloud hosting.'
  },
  {
    slug: 'custom-web-app-portals',
    serviceCode: 'MD-WEB-002',
    name: 'Custom Web Applications & Client Portals',
    shortDescription:
      'Full-stack ERP dashboards, authenticated client portals, booking & workflow engines, cloud media pipelines, and REST APIs built on PostgreSQL.',
    description:
      'Bespoke full-stack web software including client portals, operations dashboards, project tracking systems, document studios, and role-based access control.',
    fullDescription:
      'Beyond static websites, MADECC GROUP engineers complex full-stack web applications powered by TypeScript, Node.js/Express, Neon PostgreSQL, and Cloudinary/Supabase storage. Our systems centralize client communication, project milestones, invoicing, document generation, and operational analytics in one secure portal.',
    category: 'Website & Digital Development',
    status: 'PUBLISHED',
    featured: true,
    displayOrder: 12,
    priceRange: '1,200,000 - 6,500,000 FCFA',
    icon: 'Code',
    coverImage:
      'https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=1200&q=80',
    overview:
      'Ideal for enterprises needing real-time operational control: authenticated customer portals, internal resource planning, document workflows, and live reporting.',
    whatWeDeliver: [
      'Role-based authentication (Admin, Staff, Client Portals) with secure sessions',
      'PostgreSQL relational database design, migrations, and REST API endpoints',
      'Cloud document & media upload pipelines (PDFs, high-res photos, site videos)',
      'Automated PDF generation, invoice reconciliation, and CSV/Excel exports',
      'Transactional SMTP email notifications & audit trail logging'
    ],
    deliverables: [
      'Deployed full-stack web application & API layer',
      'PostgreSQL schema & automated backup configuration',
      'Admin control panel & client self-service portal',
      'API documentation & developer handover guide'
    ],
    processSteps: [
      { title: 'Workflow & Data Modeling', desc: 'Mapping user roles, business rules, approvals, and PostgreSQL schema entities.' },
      { title: 'API & Security Engineering', desc: 'Building authenticated REST routes, CSRF/rate-limit protection, and SMTP triggers.' },
      { title: 'Interactive Portal UI', desc: 'Developing fast filterable tables, live status tracking, and print/export tools.' },
      { title: 'End-to-End QA & Cutover', desc: 'Testing database persistence, email delivery, and production serverless deployment.' }
    ],
    typicalProjects: [
      'Client Project Monitoring & Billing Portals',
      'Custom ERP, Inventory & Procurement Dashboards',
      'Appointment, Inspection & Document Portals',
      'Multi-Tenant B2B SaaS Platforms'
    ],
    industriesServed: [
      'Construction & Infrastructure',
      'Healthcare & Clinics',
      'Education & Training Institutes',
      'Finance, Logistics & Operations'
    ],
    faqs: [
      {
        q: 'Can our client portal sync with invoices, projects, and automated emails?',
        a: 'Yes. We engineer live database views where admin updates appear immediately in the client portal alongside automatic SMTP email notifications.'
      }
    ],
    ctaText: 'Request Web App & Portal Quote',
    ctaDestination: 'request-a-quote',
    seoTitle: 'Custom Web Applications & Client Portals | MADECC GROUP',
    metaDescription:
      'Full-stack web applications, client portals, PostgreSQL ERP dashboards, and REST APIs engineered by MADECC GROUP.',
    keywords: 'custom web application Cameroon, client portal development, ERP web software, Node PostgreSQL React',
    details: 'Full-stack React + Node/Express + Neon PostgreSQL portals, RBAC auth, PDF export, cloud storage & transactional SMTP.'
  },
  {
    slug: 'ecommerce-momo-platforms',
    serviceCode: 'MD-WEB-003',
    name: 'E-Commerce & Mobile Money Platforms',
    shortDescription:
      'Online storefronts, digital product bookstores, booking checkouts, and MTN Mobile Money / Orange Money payment workflows with instant order tracking.',
    description:
      'Conversion-focused online stores and paid service portals integrating Cameroon Mobile Money (MTN MoMo & Orange Money), card gateways, and order tracking.',
    fullDescription:
      'Sell physical goods, construction materials, courses, or digital PDFs online with frictionless checkout engineered for Central African buyers. Our e-commerce systems combine fast catalog browsing, real-time stock/order management, MTN MoMo & Orange Money payment verification, and automated digital fulfillment.',
    category: 'Website & Digital Development',
    status: 'PUBLISHED',
    featured: true,
    displayOrder: 13,
    priceRange: '650,000 - 3,200,000 FCFA',
    icon: 'ShoppingBag',
    coverImage:
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=1200&q=80',
    overview:
      'Purpose-built e-commerce and paid-portal platforms supporting FCFA (XAF), EUR, and USD currencies with real order tracking and automated receipts.',
    whatWeDeliver: [
      'Searchable product/service catalog with categories, variants & dynamic pricing',
      'MTN Mobile Money, Orange Money, bank wire & card checkout flows',
      'Order tracking portal with reference codes & instant payment status updates',
      'Protected digital download delivery & automated branded PDF receipts',
      'Admin sales dashboard for transaction reconciliation & stock control'
    ],
    deliverables: [
      'Live e-commerce storefront & checkout engine',
      'Order management & payment reconciliation dashboard',
      'Automated customer receipt emails via SMTP',
      'Structured Product Schema.org SEO markup'
    ],
    processSteps: [
      { title: 'Catalog & Pricing Setup', desc: 'Structuring product SKUs, categories, digital assets, and XAF/EUR pricing tiers.' },
      { title: 'Payment & Order Pipeline', desc: 'Configuring Mobile Money / gateway flows, reference codes, and email receipts.' },
      { title: 'Storefront Optimization', desc: 'Mobile checkout UX, fast image CDN delivery, and search/filter performance.' }
    ],
    typicalProjects: [
      'Building Materials & Hardware Online Stores',
      'Digital Publications, Courses & Paid Manuals',
      'Service Booking & Consultation Portals',
      'Multi-Vendor Marketplace Catalogs'
    ],
    industriesServed: [
      'Retail & Distribution',
      'Education & Publishing',
      'Hospitality & Bookings',
      'Construction Supply Chains'
    ],
    faqs: [
      {
        q: 'Do your e-commerce websites support MTN MoMo and Orange Money?',
        a: 'Yes. We build native Cameroon payment flows including transaction reference reconciliation, instant admin alerts, and automated order unlocking.'
      }
    ],
    ctaText: 'Request E-Commerce Website Quote',
    ctaDestination: 'request-a-quote',
    seoTitle: 'E-Commerce & Mobile Money Web Development | MADECC GROUP',
    metaDescription:
      'Launch online stores and digital sales platforms with MTN MoMo, Orange Money checkout, order tracking, and PDF receipts.',
    keywords: 'ecommerce website Cameroon, MTN MoMo Orange Money website integration, online store Douala Yaounde',
    details: 'Online storefront, cart & checkout, MTN MoMo & Orange Money integration, order tracking, protected downloads & PDF receipts.'
  },
  {
    slug: 'technical-seo-cloud-hosting',
    serviceCode: 'MD-WEB-004',
    name: 'Technical SEO, Performance & Cloud Hosting',
    shortDescription:
      'Search engine ranking architecture, Schema.org JSON-LD, Core Web Vitals speed tuning, AdSense/ads.txt readiness, and reliable cloud maintenance.',
    description:
      'End-to-end technical SEO optimization, structured data engineering, Google Search Console indexing, and resilient cloud/database operations.',
    fullDescription:
      'A high-performing website must be fast, crawlable, and trusted by search engines. We audit and upgrade existing websites or newly built platforms with clean canonical URLs, dynamic OpenGraph tags, Schema.org JSON-LD graphs, XML sitemaps, ads.txt verification, and sub-second edge caching.',
    category: 'Website & Digital Development',
    status: 'PUBLISHED',
    featured: false,
    displayOrder: 14,
    priceRange: '200,000 - 950,000 FCFA',
    icon: 'Search',
    coverImage:
      'https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?auto=format&fit=crop&w=1200&q=80',
    overview:
      'Keep your digital presence ranking cleanly, loading rapidly on 3G/4G mobile connections, and compliant with Google Search & AdSense standards.',
    whatWeDeliver: [
      'Full technical SEO audit, canonical hygiene & crawlability optimization',
      'Rich Schema.org JSON-LD (Organization, Service, OfferCatalog, FAQ, Article)',
      'Core Web Vitals speed optimization, image compression & bundle code-splitting',
      'XML sitemap automation, robots.txt, ads.txt & Search Console verification',
      'Ongoing uptime monitoring, PostgreSQL tuning & cloud deployment support'
    ],
    deliverables: [
      'Technical SEO & performance audit scorecard',
      'Implemented JSON-LD structured data & meta tag system',
      'Validated sitemap.xml, robots.txt & ads.txt configuration',
      'Monthly speed, uptime & search indexing health summary'
    ],
    processSteps: [
      { title: 'Baseline Crawl & Speed Audit', desc: 'Inspecting indexing status, broken links, metadata gaps, and bundle weight.' },
      { title: 'Structured Data & Code Tuning', desc: 'Implementing Schema.org JSON-LD, canonicals, lazy loading, and asset caching.' },
      { title: 'Search Console & Verification', desc: 'Submitting updated sitemaps and verifying live production crawl metrics.' }
    ],
    typicalProjects: [
      'Google Ranking & Local SEO Overhaul',
      'Slow Website Speed & Mobile Optimization',
      'Google AdSense & Policy Compliance Remediation',
      'Managed Cloud Hosting & Database Maintenance'
    ],
    industriesServed: [
      'Corporate & SME Websites',
      'E-Commerce Storefronts',
      'Media, Education & Publishing Portals',
      'SaaS & Service Businesses'
    ],
    faqs: [
      {
        q: 'Can you optimize our existing website without rebuilding it from scratch?',
        a: 'Yes. We inspect your existing codebase, preserve your URLs and data, and implement non-breaking SEO, performance, and cloud reliability upgrades.'
      }
    ],
    ctaText: 'Request SEO & Hosting Audit',
    ctaDestination: 'request-a-quote',
    seoTitle: 'Technical SEO, Performance & Cloud Hosting | MADECC GROUP',
    metaDescription:
      'Technical SEO engineering, Schema.org JSON-LD, Core Web Vitals optimization, and managed cloud hosting by MADECC GROUP.',
    keywords: 'technical SEO Cameroon, Core Web Vitals optimization, Schema.org JSON-LD, cloud website maintenance',
    details: 'Technical SEO architecture, Schema.org JSON-LD, XML sitemaps, Core Web Vitals optimization & managed cloud operations.'
  }
];

let seededPromise: Promise<void> | null = null;

export async function ensureWebsiteDevelopmentServices(): Promise<void> {
  if (!seededPromise) {
    seededPromise = (async () => {
      try {
        // Non-destructive column guard for live Neon DBs where services table pre-dated CMS columns
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS services (
            id SERIAL PRIMARY KEY,
            slug TEXT,
            name TEXT NOT NULL,
            service_code TEXT,
            short_description TEXT,
            description TEXT NOT NULL DEFAULT '',
            full_description TEXT,
            category TEXT DEFAULT 'Construction & Execution',
            status TEXT DEFAULT 'PUBLISHED' NOT NULL,
            featured BOOLEAN DEFAULT false,
            display_order INTEGER DEFAULT 1,
            price_range TEXT,
            icon TEXT NOT NULL DEFAULT 'Building2',
            cover_image TEXT,
            gallery JSON,
            supporting_documents JSON,
            seo_title TEXT,
            meta_description TEXT,
            keywords TEXT,
            canonical_slug TEXT,
            social_title TEXT,
            social_description TEXT,
            social_image TEXT,
            overview TEXT,
            what_we_deliver JSON,
            deliverables JSON,
            process_steps JSON,
            typical_projects JSON,
            industries_served JSON,
            faqs JSON,
            related_projects JSON,
            related_insights JSON,
            sections JSON,
            cta_text TEXT,
            cta_destination TEXT,
            details TEXT,
            created_at TIMESTAMP DEFAULT NOW() NOT NULL,
            updated_at TIMESTAMP DEFAULT NOW() NOT NULL
          );
          ALTER TABLE services ADD COLUMN IF NOT EXISTS slug TEXT;
          ALTER TABLE services ADD COLUMN IF NOT EXISTS service_code TEXT;
          ALTER TABLE services ADD COLUMN IF NOT EXISTS short_description TEXT;
          ALTER TABLE services ADD COLUMN IF NOT EXISTS full_description TEXT;
          ALTER TABLE services ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Construction & Execution';
          ALTER TABLE services ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PUBLISHED';
          ALTER TABLE services ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false;
          ALTER TABLE services ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 1;
          ALTER TABLE services ADD COLUMN IF NOT EXISTS price_range TEXT;
          ALTER TABLE services ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'Building2';
          ALTER TABLE services ADD COLUMN IF NOT EXISTS cover_image TEXT;
          ALTER TABLE services ADD COLUMN IF NOT EXISTS gallery JSON;
          ALTER TABLE services ADD COLUMN IF NOT EXISTS supporting_documents JSON;
          ALTER TABLE services ADD COLUMN IF NOT EXISTS seo_title TEXT;
          ALTER TABLE services ADD COLUMN IF NOT EXISTS meta_description TEXT;
          ALTER TABLE services ADD COLUMN IF NOT EXISTS keywords TEXT;
          ALTER TABLE services ADD COLUMN IF NOT EXISTS canonical_slug TEXT;
          ALTER TABLE services ADD COLUMN IF NOT EXISTS social_title TEXT;
          ALTER TABLE services ADD COLUMN IF NOT EXISTS social_description TEXT;
          ALTER TABLE services ADD COLUMN IF NOT EXISTS social_image TEXT;
          ALTER TABLE services ADD COLUMN IF NOT EXISTS overview TEXT;
          ALTER TABLE services ADD COLUMN IF NOT EXISTS what_we_deliver JSON;
          ALTER TABLE services ADD COLUMN IF NOT EXISTS deliverables JSON;
          ALTER TABLE services ADD COLUMN IF NOT EXISTS process_steps JSON;
          ALTER TABLE services ADD COLUMN IF NOT EXISTS typical_projects JSON;
          ALTER TABLE services ADD COLUMN IF NOT EXISTS industries_served JSON;
          ALTER TABLE services ADD COLUMN IF NOT EXISTS faqs JSON;
          ALTER TABLE services ADD COLUMN IF NOT EXISTS related_projects JSON;
          ALTER TABLE services ADD COLUMN IF NOT EXISTS related_insights JSON;
          ALTER TABLE services ADD COLUMN IF NOT EXISTS sections JSON;
          ALTER TABLE services ADD COLUMN IF NOT EXISTS cta_text TEXT;
          ALTER TABLE services ADD COLUMN IF NOT EXISTS cta_destination TEXT;
          ALTER TABLE services ADD COLUMN IF NOT EXISTS details TEXT;
          ALTER TABLE services ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
          ALTER TABLE services ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
        `);

        for (const item of WEBSITE_DEVELOPMENT_SERVICES) {
          const existing = await db
            .select({ id: services.id })
            .from(services)
            .where(eq(services.slug, item.slug))
            .limit(1);

          if (existing.length === 0) {
            await db.insert(services).values({
              slug: item.slug,
              serviceCode: item.serviceCode,
              name: item.name,
              shortDescription: item.shortDescription,
              description: item.description,
              fullDescription: item.fullDescription,
              category: item.category,
              status: item.status,
              featured: item.featured,
              displayOrder: item.displayOrder,
              priceRange: item.priceRange,
              icon: item.icon,
              coverImage: item.coverImage,
              gallery: [],
              supportingDocuments: [],
              overview: item.overview,
              whatWeDeliver: item.whatWeDeliver,
              deliverables: item.deliverables,
              processSteps: item.processSteps,
              typicalProjects: item.typicalProjects,
              industriesServed: item.industriesServed,
              faqs: item.faqs,
              ctaText: item.ctaText,
              ctaDestination: item.ctaDestination,
              seoTitle: item.seoTitle,
              metaDescription: item.metaDescription,
              keywords: item.keywords,
              details: item.details
            });
          }
        }
      } catch (err) {
        console.warn('[WEB_SERVICES_SEED_WARN] Could not verify website services in DB:', (err as any)?.message || err);
        seededPromise = null;
      }
    })();
  }
  return seededPromise;
}
