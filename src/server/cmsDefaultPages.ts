import { HeroSectionConfig, PageSection, SeoConfig } from '../types.ts';

export interface DefaultPageSeedSpec {
  slug: string;
  title: string;
  group: string;
  heroConfig: HeroSectionConfig;
  sections: PageSection[];
  seo: SeoConfig;
}

const CANONICAL_ORIGIN = 'https://madeccgroup.online';

const defaultHero = (
  title: string,
  subtitle: string,
  eyebrow: string,
  description = '',
  primaryText = 'Request a Free Quote',
  primaryLink = '/request-a-quote',
  secondaryText = 'Calculate Budget (FCFA)',
  secondaryLink = '/budget-calculator'
): HeroSectionConfig => ({
  eyebrow,
  title,
  subtitle,
  description,
  showHero: true,
  showVideo: true,
  mediaType: 'video',
  videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-construction-site-with-cranes-and-workers-40915-large.mp4',
  posterUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1600&q=80',
  imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1600&q=80',
  imageAlt: `${title} — MADECC GROUP Cameroon`,
  videoSettings: {
    autoplay: true,
    muted: true,
    loop: true,
    playsInline: true,
    disableOnMobile: false,
    overlayOpacity: 75,
  },
  primaryCta: { text: primaryText, link: primaryLink, visible: true },
  secondaryCta: { text: secondaryText, link: secondaryLink, visible: true },
  tertiaryCta: { text: 'Schedule Consultation →', link: '/schedule-consultation', visible: true },
  trustBadges: [
    { icon: 'ShieldCheck', text: 'Eurocode 2 & BAEL 91 Engineering' },
    { icon: 'Building2', text: 'Transparent Milestone Escrow' },
    { icon: 'Compass', text: 'Serving All 10 Regions of Cameroon' },
  ],
});

export const ALL_PUBLIC_PAGE_TEMPLATES: DefaultPageSeedSpec[] = [
  {
    slug: 'home',
    title: 'Home Page',
    group: 'home',
    heroConfig: {
      ...defaultHero(
        'Engineering Resilient Infrastructure | Modernizing Urban Housing | Delivering Precision Execution',
        'MADECC GROUP is a multi-disciplinary civil engineering, architectural design, and construction firm based in Yaoundé & Douala. We deliver structurally certified villas, commercial complexes, highways, and digital solutions nationwide.',
        'Mbankolo, Yaoundé & Akwa, Douala — Cameroon',
        'From geotechnical groundworks to turnkey structural handover with transparent XAF Bills of Quantities.'
      ),
    },
    sections: [
      {
        id: 'sec-home-pillars',
        type: 'pillars',
        title: 'Engineering Rigor & Uncompromising Delivery',
        subtitle: 'Every structure is engineered to international safety factors and local soil dynamics.',
        enabled: true,
        displayOrder: 1,
      },
      {
        id: 'sec-home-blueprint',
        type: 'blueprint',
        title: 'Interactive Architectural Blueprint Inspection',
        subtitle: 'Explore structural layers, load-bearing zones, and MEP tolerances.',
        enabled: true,
        displayOrder: 2,
      },
      {
        id: 'sec-home-estimator',
        type: 'estimator',
        title: 'Instant Preliminary Construction Cost Estimator (FCFA)',
        subtitle: 'Estimate structural materials and execution ranges before commissioning your full Bill of Quantities.',
        enabled: true,
        displayOrder: 3,
      },
      {
        id: 'sec-home-services',
        type: 'services',
        title: 'Core Capabilities & Engineering Services',
        subtitle: 'Residential builds, commercial complexes, civil works, architectural CAD/BIM, and quantity surveying.',
        enabled: true,
        displayOrder: 4,
      },
      {
        id: 'sec-home-workflow',
        type: 'workflow',
        title: '5-Stage Transparent Project Delivery Process',
        subtitle: 'Accountability from soil investigation to final client key handover.',
        enabled: true,
        displayOrder: 5,
      },
      {
        id: 'sec-home-projects',
        type: 'projects',
        title: 'Featured Active & Delivered Projects',
        subtitle: 'Live site progress tracking across Yaoundé, Douala, Kribi, and nationwide.',
        enabled: true,
        displayOrder: 6,
      },
      {
        id: 'sec-home-divisions',
        type: 'divisions',
        title: 'Multi-Division Enterprise Capabilities',
        subtitle: 'Unified execution across civil construction, real estate, software engineering, and technical trade.',
        enabled: true,
        displayOrder: 7,
      },
      {
        id: 'sec-home-testimonials',
        type: 'testimonials',
        title: 'Verified Client Testimonials & Field Reviews',
        subtitle: 'Moderation-verified feedback from homeowners, diaspora investors, and corporate developers.',
        enabled: true,
        displayOrder: 8,
      },
      {
        id: 'sec-home-faq',
        type: 'faq',
        title: 'Frequently Asked Engineering & Contracting Questions',
        subtitle: 'Clear answers on permits, staged payments, structural warranties, and diaspora builds.',
        enabled: true,
        displayOrder: 9,
      },
      {
        id: 'sec-home-cta',
        type: 'cta',
        title: 'Ready to Commission Your Construction Project?',
        subtitle: 'Connect with MADECC GROUP engineers in Yaoundé or Douala for a formal site review or quotation.',
        ctaText: 'Request Free Engineering Quote',
        ctaLink: '/request-a-quote',
        enabled: true,
        displayOrder: 10,
      },
    ],
    seo: {
      seoTitle: 'MADECC GROUP — Premier Civil Engineering & Construction Firm in Cameroon',
      metaDescription: 'Turnkey civil engineering, building construction, quantity surveying, and digital infrastructure across Yaoundé, Douala, and all 10 regions of Cameroon.',
      canonicalUrl: `${CANONICAL_ORIGIN}/`,
      keywords: 'MADECC GROUP, construction cameroon, civil engineering yaounde, structural design douala, diaspora building cameroon',
      robotsIndex: true,
      robotsFollow: true,
    },
  },
  {
    slug: 'about',
    title: 'About MADECC GROUP',
    group: 'about',
    heroConfig: defaultHero(
      'Engineering Integrity Meets Precision Construction',
      'MADECC GROUP is a premier multi-disciplinary construction, civil engineering, and enterprise operations conglomerate founded by Kasah Rodrick Reboya in Yaoundé, Cameroon.',
      'Corporate Identity & Leadership'
    ),
    sections: [
      {
        id: 'sec-about-history',
        type: 'about',
        title: 'Who We Are & Our Founding Mission',
        subtitle: 'Constructing resilient residential, commercial, and civil infrastructure across Central Africa.',
        content: '<p><strong>MADECC GROUP</strong> combines structural engineering precision, certified material batching, and transparent milestone accounting to eliminate schedule overruns and structural risk across Cameroon.</p><p>Headquartered in <strong>Mbankolo, Yaoundé</strong> with operational reach across Douala, Kribi, Bafoussam, Buea, Bamenda, and Garoua, we serve private families, diaspora investors, commercial enterprises, and institutional tenders.</p>',
        enabled: true,
        displayOrder: 1,
      },
      {
        id: 'sec-about-regions',
        type: 'stats',
        title: 'Operational Reach Across All 10 Regions of Cameroon',
        subtitle: 'Dedicated mobilization teams across Centre, Littoral, West, South, North-West, South-West, and Northern corridors.',
        enabled: true,
        displayOrder: 2,
      },
      {
        id: 'sec-about-pillars',
        type: 'pillars',
        title: 'Our 4 Core Engineering Pillars',
        subtitle: 'Engineering Excellence, Structural Integrity, Safety & Sustainability, and Transparent Accountability.',
        enabled: true,
        displayOrder: 3,
      },
      {
        id: 'sec-about-audiences',
        type: 'why_choose_us',
        title: 'Who We Build For',
        subtitle: 'Homeowners, Commercial Developers, Industrial Facilities, and Public Infrastructure Stakeholders.',
        enabled: true,
        displayOrder: 4,
      },
      {
        id: 'sec-about-codes',
        type: 'process',
        title: 'Engineering Standards & Structural Governance',
        subtitle: 'Eurocode 2, BAEL 91, ISO 9001 quality workflows, and QHSE site protocols.',
        enabled: true,
        displayOrder: 5,
      },
      {
        id: 'sec-about-team',
        type: 'team',
        title: 'Leadership & Senior Engineering Team',
        subtitle: 'Direct executive oversight led by Founder & CEO Kasah Rodrick Reboya.',
        enabled: true,
        displayOrder: 6,
      },
    ],
    seo: {
      seoTitle: 'About MADECC GROUP | Leadership, Governance & Engineering Standards',
      metaDescription: 'Learn about MADECC GROUP, founded by Kasah Rodrick Reboya in Yaoundé, Cameroon — structural standards, regional operations, and corporate leadership.',
      canonicalUrl: `${CANONICAL_ORIGIN}/about`,
      keywords: 'about madecc group, kasah rodrick reboya, civil engineering firm yaounde, construction standards cameroon',
      robotsIndex: true,
      robotsFollow: true,
    },
  },
  {
    slug: 'services',
    title: 'Services & Divisions',
    group: 'services',
    heroConfig: defaultHero(
      'Engineering & Construction Services Built to International Standards',
      'Comprehensive civil engineering, architectural design, residential & commercial contracting, quantity surveying, real estate, and digital transformation divisions.',
      'Integrated Turnkey Capabilities'
    ),
    sections: [
      {
        id: 'sec-services-catalog',
        type: 'services',
        title: 'Published Core Services & Technical Divisions',
        subtitle: 'Select any service below to inspect full deliverables, phases, pricing benchmarks, and quotation tools.',
        enabled: true,
        displayOrder: 1,
      },
      {
        id: 'sec-services-workflow',
        type: 'workflow',
        title: 'How We Execute Every Contract',
        subtitle: 'Five transparent engineering checkpoints from brief to handover.',
        enabled: true,
        displayOrder: 2,
      },
      {
        id: 'sec-services-why',
        type: 'why_choose_us',
        title: 'Why Clients Trust MADECC GROUP',
        subtitle: 'Zero hidden extras, itemized FCFA BOQs, and verifiable photographic progress.',
        enabled: true,
        displayOrder: 3,
      },
      {
        id: 'sec-services-faq',
        type: 'faq',
        title: 'Service Contracting Questions',
        subtitle: 'Answers regarding timelines, turnkey contracts, and supervision.',
        enabled: true,
        displayOrder: 4,
      },
      {
        id: 'sec-services-cta',
        type: 'cta',
        title: 'Need an Itemized Bill of Quantities or Technical Proposal?',
        subtitle: 'Submit your project parameters directly to our Quantity Surveying & Civil Engineering desk.',
        ctaText: 'Request Formal Quote',
        ctaLink: '/request-a-quote',
        enabled: true,
        displayOrder: 5,
      },
    ],
    seo: {
      seoTitle: 'Civil Engineering, Construction & Multi-Division Services | MADECC GROUP',
      metaDescription: 'Explore civil works, residential villas, commercial complexes, BOQ quantity surveying, real estate, and digital software services in Cameroon.',
      canonicalUrl: `${CANONICAL_ORIGIN}/services`,
      keywords: 'construction services cameroon, quantity surveying yaounde, commercial builder douala, civil engineering',
      robotsIndex: true,
      robotsFollow: true,
    },
  },
  {
    slug: 'projects',
    title: 'Projects Portfolio',
    group: 'projects',
    heroConfig: defaultHero(
      'Verified Infrastructure & Building Projects Portfolio',
      'Inspect live civil contracts, structural handovers, photographic documentation, and verified progress milestones delivered across Cameroon.',
      'Track Record & Live Works',
      '',
      'Request Similar Build Quote',
      '/request-a-quote',
      'Budget Calculator',
      '/budget-calculator'
    ),
    sections: [
      {
        id: 'sec-projects-stats',
        type: 'stats',
        title: 'Portfolio Execution Metrics',
        subtitle: 'Tracked structural phases, safety compliance, and verified field milestones.',
        enabled: true,
        displayOrder: 1,
      },
      {
        id: 'sec-projects-catalog',
        type: 'projects',
        title: 'Active & Completed Engineering Contracts',
        subtitle: 'Filter by execution stage or category and view project galleries & milestones.',
        enabled: true,
        displayOrder: 2,
      },
      {
        id: 'sec-projects-before-after',
        type: 'media_showcase',
        title: 'Structural Transformation: Before & After Case Study',
        subtitle: 'From raw ground clearing and reinforcement to finished architectural facade.',
        enabled: true,
        displayOrder: 3,
      },
      {
        id: 'sec-projects-timeline',
        type: 'process',
        title: 'Standard Structural Execution Timeline',
        subtitle: 'Geotechnical prep, foundation pouring, superstructure, MEP, and finishes.',
        enabled: true,
        displayOrder: 4,
      },
      {
        id: 'sec-projects-quality',
        type: 'why_choose_us',
        title: 'Laboratory & Site Quality Verification',
        subtitle: 'Cube crushing tests, rebar inspection, and waterproofing checks.',
        enabled: true,
        displayOrder: 5,
      },
      {
        id: 'sec-projects-faq',
        type: 'faq',
        title: 'Portfolio & Remote Supervision FAQs',
        subtitle: 'How diaspora and institutional clients monitor live sites.',
        enabled: true,
        displayOrder: 6,
      },
    ],
    seo: {
      seoTitle: 'Construction Projects & Engineering Portfolio | MADECC GROUP Cameroon',
      metaDescription: 'Browse active and completed civil engineering, villa, and commercial building projects delivered by MADECC GROUP in Yaoundé, Douala, and Kribi.',
      canonicalUrl: `${CANONICAL_ORIGIN}/projects`,
      keywords: 'construction portfolio cameroon, yaounde villas, douala commercial builds, civil infrastructure',
      robotsIndex: true,
      robotsFollow: true,
    },
  },
  {
    slug: 'blog',
    title: 'Insights & Publications',
    group: 'blog',
    heroConfig: defaultHero(
      'Engineering Insights, Research & Field Briefings',
      'Technical publications covering concrete batching, Cameroon urban zoning, structural durability, cost management, and modern construction technology.',
      'Technical Knowledge Hub'
    ),
    sections: [
      {
        id: 'sec-blog-feed',
        type: 'custom',
        title: 'Published Engineering Briefings',
        subtitle: 'Technical guides written by MADECC GROUP structural engineers and quantity surveyors.',
        enabled: true,
        displayOrder: 1,
      },
    ],
    seo: {
      seoTitle: 'Civil Engineering Insights & Construction Publications | MADECC GROUP',
      metaDescription: 'Read engineering articles, concrete mix guides, cost optimization insights, and building compliance notes for Cameroon.',
      canonicalUrl: `${CANONICAL_ORIGIN}/blog`,
      keywords: 'construction blog cameroon, structural engineering articles, concrete batching cameroon',
      robotsIndex: true,
      robotsFollow: true,
    },
  },
  {
    slug: 'contact',
    title: 'Contact & Offices',
    group: 'contact',
    heroConfig: defaultHero(
      'Connect With MADECC GROUP Engineering Offices',
      'Reach our headquarters in Mbankolo, Yaoundé or our Littoral operations desk in Akwa, Douala for quotes, tenders, and site inspections.',
      'Direct Engineering Dispatch'
    ),
    sections: [
      {
        id: 'sec-contact-details',
        type: 'custom',
        title: 'Headquarters, Phones, Email & Interactive Location Map',
        subtitle: 'Direct communication channels and verified office coordinates.',
        enabled: true,
        displayOrder: 1,
      },
    ],
    seo: {
      seoTitle: 'Contact MADECC GROUP | Yaoundé & Douala Engineering Offices',
      metaDescription: 'Contact MADECC GROUP in Mbankolo, Yaoundé or Akwa, Douala by phone, WhatsApp, email, or online project inquiry form.',
      canonicalUrl: `${CANONICAL_ORIGIN}/contact`,
      keywords: 'contact madecc group, construction company yaounde phone, douala contractor contact',
      robotsIndex: true,
      robotsFollow: true,
    },
  },
  {
    slug: 'faq',
    title: 'FAQ & Help Centre',
    group: 'faq',
    heroConfig: defaultHero(
      'Frequently Asked Questions & Client Help Centre',
      'Clear answers on contracting stages, Bills of Quantities, diaspora remote monitoring, building permits, and warranty support.',
      'Transparent Client Guidance'
    ),
    sections: [
      {
        id: 'sec-faq-list',
        type: 'faq',
        title: 'Verified Engineering & Contracting Answers',
        subtitle: 'Browse categories or search specific construction, payment, and engineering questions.',
        enabled: true,
        displayOrder: 1,
      },
    ],
    seo: {
      seoTitle: 'Construction & Contracting FAQ | MADECC GROUP Cameroon',
      metaDescription: 'Answers to common questions about house construction costs in Cameroon, building permits, payment milestones, and diaspora engineering management.',
      canonicalUrl: `${CANONICAL_ORIGIN}/faq`,
      keywords: 'construction faq cameroon, house cost yaounde, building permit cameroon',
      robotsIndex: true,
      robotsFollow: true,
    },
  },
  {
    slug: 'sustainability',
    title: 'Sustainability & ESG',
    group: 'sustainability',
    heroConfig: defaultHero(
      'Sustainable Engineering, QHSE Safety & Climate Resilience',
      'Low-carbon concrete optimization, responsible quarry sourcing, stormwater drainage design, and Zero-Harm workplace standards.',
      'Environmental & Social Governance'
    ),
    sections: [
      {
        id: 'sec-sustainability-overview',
        type: 'about',
        title: 'Zero-Harm QHSE & Climate-Adapted Construction',
        subtitle: 'Engineering buildings for Central African tropical rainfall, thermal efficiency, and decades of structural longevity.',
        enabled: true,
        displayOrder: 1,
      },
    ],
    seo: {
      seoTitle: 'Sustainability, ESG & Zero-Harm Safety | MADECC GROUP',
      metaDescription: 'Explore MADECC GROUP commitment to environmental impact reduction, solar-ready architecture, and ISO 45001 aligned jobsite safety.',
      canonicalUrl: `${CANONICAL_ORIGIN}/sustainability`,
      keywords: 'sustainable construction cameroon, QHSE madecc group, green building yaounde',
      robotsIndex: true,
      robotsFollow: true,
    },
  },
  {
    slug: 'tenders',
    title: 'Procurement & Tenders',
    group: 'services',
    heroConfig: defaultHero(
      'Procurement Portal & Active Tender Notices',
      'Public and corporate tender opportunities, bidder prequalification requirements, and procurement desk communications.',
      'Institutional & Commercial Procurement'
    ),
    sections: [
      {
        id: 'sec-tenders-board',
        type: 'custom',
        title: 'Current Tender Notices & Supplier Submissions',
        subtitle: 'Review active tenders, technical eligibility, and submission deadlines.',
        enabled: true,
        displayOrder: 1,
      },
    ],
    seo: {
      seoTitle: 'Tenders & Procurement Opportunities | MADECC GROUP Cameroon',
      metaDescription: 'View open construction tenders, material supply notices, and contractor prequalification guidelines.',
      canonicalUrl: `${CANONICAL_ORIGIN}/tenders`,
      keywords: 'construction tenders cameroon, procurement madecc group, civil engineering bids',
      robotsIndex: true,
      robotsFollow: true,
    },
  },
  {
    slug: 'suppliers',
    title: 'Supplier Registration',
    group: 'services',
    heroConfig: defaultHero(
      'Suppliers, Subcontractors & Approved Vendors',
      'Partner with MADECC GROUP across structural steel, cement distribution, aggregates, MEP contracting, and heavy machinery.',
      'Supply Chain & Vendor Network'
    ),
    sections: [
      {
        id: 'sec-suppliers-onboarding',
        type: 'custom',
        title: 'Vendor Prequalification & Trade Categories',
        subtitle: 'Register your company credentials to join our approved contractor pool.',
        enabled: true,
        displayOrder: 1,
      },
    ],
    seo: {
      seoTitle: 'Supplier & Subcontractor Portal | MADECC GROUP Cameroon',
      metaDescription: 'Apply to become an approved material vendor or specialist trade subcontractor with MADECC GROUP.',
      canonicalUrl: `${CANONICAL_ORIGIN}/suppliers`,
      keywords: 'construction suppliers cameroon, subcontractors yaounde, vendor portal',
      robotsIndex: true,
      robotsFollow: true,
    },
  },
  {
    slug: 'careers',
    title: 'Careers & Talent',
    group: 'about',
    heroConfig: defaultHero(
      'Careers in Civil Engineering, Quantity Surveying & Architecture',
      'Join our field engineers, BIM architects, site supervisors, and project managers delivering landmark builds across Cameroon.',
      'Engineering Talent & Internships'
    ),
    sections: [
      {
        id: 'sec-careers-roles',
        type: 'custom',
        title: 'Engineering Disciplines & Application Guidance',
        subtitle: 'Send your CV and engineering portfolio to our recruitment desk.',
        content: '<p>MADECC GROUP welcomes applications from civil engineers, site conductors, quantity surveyors, CAD/BIM technicians, and safety officers committed to exacting execution quality.</p>',
        enabled: true,
        displayOrder: 1,
      },
    ],
    seo: {
      seoTitle: 'Careers & Engineering Jobs | MADECC GROUP Cameroon',
      metaDescription: 'Explore engineering, architecture, and site management careers with MADECC GROUP in Yaoundé and Douala.',
      canonicalUrl: `${CANONICAL_ORIGIN}/careers`,
      keywords: 'engineering jobs cameroon, construction careers yaounde',
      robotsIndex: true,
      robotsFollow: true,
    },
  },
  {
    slug: 'request-a-quote',
    title: 'Request a Project Quote',
    group: 'services',
    heroConfig: defaultHero(
      'Request an Itemized Construction Quote & BOQ Review',
      'Share your land location, architectural drawings, or target scope to receive an accurate engineering valuation in XAF.',
      'Formal Quotation Desk'
    ),
    sections: [
      {
        id: 'sec-quote-form',
        type: 'custom',
        title: 'Project Scope & Structural Estimate Request',
        subtitle: 'Upload project parameters directly to our estimating engineers.',
        enabled: true,
        displayOrder: 1,
      },
    ],
    seo: {
      seoTitle: 'Request a Construction Quote | MADECC GROUP Cameroon',
      metaDescription: 'Request a custom residential, commercial, or civil engineering quotation from MADECC GROUP.',
      canonicalUrl: `${CANONICAL_ORIGIN}/request-a-quote`,
      keywords: 'construction quote cameroon, boq estimate yaounde, building quote douala',
      robotsIndex: true,
      robotsFollow: true,
    },
  },
  {
    slug: 'schedule-consultation',
    title: 'Schedule Consultation',
    group: 'services',
    heroConfig: defaultHero(
      'Schedule an Engineering & Quantity Surveying Consultation',
      'Book an in-person meeting in Yaoundé or Douala, or schedule a video review session for diaspora clients.',
      '1-on-1 Project Advisory'
    ),
    sections: [
      {
        id: 'sec-consult-booking',
        type: 'custom',
        title: 'Consultation Booking & Engineering Calendar',
        subtitle: 'Reserve a dedicated slot with a lead civil or structural specialist.',
        enabled: true,
        displayOrder: 1,
      },
    ],
    seo: {
      seoTitle: 'Schedule Engineering Consultation | MADECC GROUP Cameroon',
      metaDescription: 'Book an in-office or remote video construction consultation with MADECC GROUP engineers.',
      canonicalUrl: `${CANONICAL_ORIGIN}/schedule-consultation`,
      keywords: 'engineering consultation cameroon, architect meeting yaounde',
      robotsIndex: true,
      robotsFollow: true,
    },
  },
  {
    slug: 'budget-calculator',
    title: 'Project Budget Calculator',
    group: 'services',
    heroConfig: defaultHero(
      'Cameroon Construction Project Budget Calculator (FCFA)',
      'Calculate realistic structural shell, finishing, and turnkey engineering estimates tailored to city rates and building type.',
      'Interactive Cost Modeling'
    ),
    sections: [
      {
        id: 'sec-calculator-tool',
        type: 'estimator',
        title: 'Interactive Engineering Budget Estimator',
        subtitle: 'Adjust surface area, levels, city, and finish tier to preview breakdown costs.',
        enabled: true,
        displayOrder: 1,
      },
    ],
    seo: {
      seoTitle: 'Construction Budget Calculator (FCFA) | MADECC GROUP Cameroon',
      metaDescription: 'Estimate building costs per square meter in Yaoundé, Douala, Kribi, and Bafoussam in XAF.',
      canonicalUrl: `${CANONICAL_ORIGIN}/budget-calculator`,
      keywords: 'construction cost calculator cameroon, xaf building estimator',
      robotsIndex: true,
      robotsFollow: true,
    },
  },
  {
    slug: 'construction-cost-guide',
    title: 'Cameroon Construction Cost Guide',
    group: 'services',
    heroConfig: defaultHero(
      '2026 Cameroon Construction Cost Guide & Market Unit Rates',
      'Verified market unit prices per m², structural material benchmarks, cement & rebar pricing, and regional construction factors.',
      'Market Benchmark Reference'
    ),
    sections: [
      {
        id: 'sec-cost-guide-content',
        type: 'custom',
        title: 'Regional Unit Rates & Downloadable Cost Reference',
        subtitle: 'Explore current residential and commercial rates in XAF.',
        enabled: true,
        displayOrder: 1,
      },
    ],
    seo: {
      seoTitle: 'Cameroon Construction Cost Guide (2026 XAF Rates) | MADECC GROUP',
      metaDescription: 'Current Cameroon construction costs per square meter, cement, steel rebar, labour rates, and downloadable engineering guide.',
      canonicalUrl: `${CANONICAL_ORIGIN}/construction-cost-guide`,
      keywords: 'cameroon construction cost per m2, building prices yaounde douala',
      robotsIndex: true,
      robotsFollow: true,
    },
  },
  {
    slug: 'website-development',
    title: 'Website Development Services',
    group: 'services',
    heroConfig: defaultHero(
      'Enterprise Website Development, Client Portals & MoMo Platforms',
      'Custom TypeScript web applications, corporate CMS portals, MTN/Orange Mobile Money integrations, and technical SEO engineered in Cameroon.',
      'Digital & Software Division'
    ),
    sections: [
      {
        id: 'sec-webdev-packages',
        type: 'services',
        title: 'Digital Engineering & SaaS Packages',
        subtitle: 'Full-stack architecture built for speed, security, and local mobile payments.',
        enabled: true,
        displayOrder: 1,
      },
    ],
    seo: {
      seoTitle: 'Enterprise Website & SaaS Development | MADECC GROUP Cameroon',
      metaDescription: 'Custom websites, client portals, e-commerce with MTN MoMo & Orange Money, and technical SEO in Yaoundé & Douala.',
      canonicalUrl: `${CANONICAL_ORIGIN}/website-development`,
      keywords: 'website development cameroon, momo integration, enterprise software yaounde',
      robotsIndex: true,
      robotsFollow: true,
    },
  },
  {
    slug: 'developers',
    title: 'Developer & Paid API Platform',
    group: 'developers',
    heroConfig: defaultHero(
      'MADECC Civil & Structural Engineering REST API Platform',
      'Programmatic concrete mix calculators, reinforcement design formulas, BoQ estimators, and Cameroon regional construction cost APIs.',
      'Engineering APIs & SDKs'
    ),
    sections: [
      {
        id: 'sec-dev-docs',
        type: 'custom',
        title: 'API Plans, Documentation & MoMo Subscription Access',
        subtitle: 'Production endpoints verified against Neon PostgreSQL.',
        enabled: true,
        displayOrder: 1,
      },
    ],
    seo: {
      seoTitle: 'Engineering REST APIs & Developer Portal | MADECC GROUP',
      metaDescription: 'Integrate civil engineering concrete mix, steel weight, and Cameroon BoQ cost APIs into your applications.',
      canonicalUrl: `${CANONICAL_ORIGIN}/developers`,
      keywords: 'civil engineering api, construction cost api cameroon, madecc developer portal',
      robotsIndex: true,
      robotsFollow: true,
    },
  },
  {
    slug: 'client-portal',
    title: 'Client Portal',
    group: 'public',
    heroConfig: defaultHero(
      'Client Project & Financial Tracking Portal',
      'Access live construction milestones, site photography, verified invoices, contracts, and engineering documents in real time.',
      'Client Dashboard Access'
    ),
    sections: [
      {
        id: 'sec-client-portal-info',
        type: 'custom',
        title: 'Secure Client Sign-In & Live Site Tracking',
        subtitle: 'Enter your registered email or Client Code to view real-time project progress.',
        enabled: true,
        displayOrder: 1,
      },
    ],
    seo: {
      seoTitle: 'Client Portal — Live Progress & Invoices | MADECC GROUP',
      metaDescription: 'Log into your MADECC GROUP Client Portal to inspect milestone progress, site photos, and financial statements.',
      canonicalUrl: `${CANONICAL_ORIGIN}/client-portal`,
      keywords: 'madecc client portal, construction progress tracking cameroon',
      robotsIndex: true,
      robotsFollow: true,
    },
  },
  {
    slug: 'store',
    title: 'KRR Bookstore & Engineering Manuals',
    group: 'services',
    heroConfig: defaultHero(
      'KRR Bookstore — Engineering Textbooks & Technical Manuals',
      'Purchase certified civil engineering textbooks, BoQ templates, and study guides via MTN Mobile Money or Orange Money.',
      'KRR Technical Publications'
    ),
    sections: [
      {
        id: 'sec-store-catalog',
        type: 'custom',
        title: 'Published Textbooks & Technical Resources',
        subtitle: 'Verified downloadable publications with instant order tracking.',
        enabled: true,
        displayOrder: 1,
      },
    ],
    seo: {
      seoTitle: 'KRR Bookstore & Engineering Textbooks | MADECC GROUP',
      metaDescription: 'Browse civil engineering textbooks, building manuals, and study resources by Kasah Rodrick Reboya.',
      canonicalUrl: `${CANONICAL_ORIGIN}/store`,
      keywords: 'krr bookstore, civil engineering books cameroon, madecc manuals',
      robotsIndex: true,
      robotsFollow: true,
    },
  },
  {
    slug: 'walkthrough-guide',
    title: 'Visitor & Client Walkthrough Guide',
    group: 'public',
    heroConfig: defaultHero(
      'Interactive Visitor & Client Platform Walkthrough Guide',
      'Step-by-step orientation covering quotes, budget calculators, client portal logins, MoMo verification, and document tools.',
      'Platform Orientation'
    ),
    sections: [
      {
        id: 'sec-walkthrough-steps',
        type: 'process',
        title: 'Platform Navigation & Workflow Guide',
        subtitle: 'How visitors, clients, students, and developers use each module.',
        enabled: true,
        displayOrder: 1,
      },
    ],
    seo: {
      seoTitle: 'Visitor Walkthrough Guide | MADECC GROUP Portal',
      metaDescription: 'Learn how to navigate all tools, calculators, client portals, and resources on madeccgroup.online.',
      canonicalUrl: `${CANONICAL_ORIGIN}/walkthrough-guide`,
      keywords: 'madecc walkthrough guide, website navigation help',
      robotsIndex: true,
      robotsFollow: true,
    },
  },
  {
    slug: 'sitemap',
    title: 'Sitemap & Architecture Index',
    group: 'sitemap',
    heroConfig: defaultHero(
      'Official Website Architecture & Public Route Directory',
      'Complete structured index of all public MADECC GROUP pages, engineering tools, publications, and governance links.',
      'Navigation Architecture'
    ),
    sections: [
      {
        id: 'sec-sitemap-directory',
        type: 'custom',
        title: 'Indexed Public Routes',
        subtitle: 'Direct links to every public module on madeccgroup.online.',
        enabled: true,
        displayOrder: 1,
      },
    ],
    seo: {
      seoTitle: 'Site Map & Architecture Index | MADECC GROUP',
      metaDescription: 'Browse the complete directory of pages, calculators, services, and legal disclosures on madeccgroup.online.',
      canonicalUrl: `${CANONICAL_ORIGIN}/sitemap`,
      keywords: 'madecc sitemap, directory madeccgroup.online',
      robotsIndex: true,
      robotsFollow: true,
    },
  },
  {
    slug: 'legal',
    title: 'Legal & Governance Hub',
    group: 'legal',
    heroConfig: defaultHero(
      'Corporate Legal, Compliance & Privacy Governance',
      'Transparent Privacy Policy, Terms & Conditions, QHSE Directives, Cookie Notice, and Data Deletion controls.',
      'Legal & Regulatory Center'
    ),
    sections: [
      {
        id: 'sec-legal-docs',
        type: 'custom',
        title: 'Published Legal Policies',
        subtitle: 'Governed by applicable Cameroon and international compliance rules.',
        enabled: true,
        displayOrder: 1,
      },
    ],
    seo: {
      seoTitle: 'Legal & Governance Policies | MADECC GROUP Cameroon',
      metaDescription: 'Privacy Policy, Terms of Service, QHSE Safety, and Corporate Governance notices for MADECC GROUP.',
      canonicalUrl: `${CANONICAL_ORIGIN}/legal`,
      keywords: 'madecc legal, privacy policy, terms of service cameroon',
      robotsIndex: true,
      robotsFollow: true,
    },
  },
  {
    slug: 'data-deletion',
    title: 'Data Deletion & Privacy Rights',
    group: 'legal',
    heroConfig: defaultHero(
      'Personal Data Erasure & Meta Privacy Compliance Portal',
      'Submit a verifiable request to erase account records, contact inquiries, or portal credentials.',
      'Data Protection & Erasure'
    ),
    sections: [
      {
        id: 'sec-data-deletion-form',
        type: 'custom',
        title: 'Data Deletion Request Form & Status Tracker',
        subtitle: 'Track requests with your unique verification code.',
        enabled: true,
        displayOrder: 1,
      },
    ],
    seo: {
      seoTitle: 'Data Deletion & Privacy Rights | MADECC GROUP',
      metaDescription: 'Submit and track personal data deletion requests on madeccgroup.online.',
      canonicalUrl: `${CANONICAL_ORIGIN}/data-deletion`,
      keywords: 'data deletion request, privacy rights madecc group',
      robotsIndex: true,
      robotsFollow: true,
    },
  },
];
