import { Tenant, HeroBanner } from '../types.ts';

export interface TenantExecutive {
  name: string;
  role: string;
  qualifications: string;
  experienceYears: number;
  bio: string;
  avatarUrl: string;
}

export interface TenantStatItem {
  value: string;
  label: string;
  description: string;
}

export interface TenantServiceItem {
  id: number;
  name?: string;
  title?: string;
  description: string;
  icon: string;
  features?: string[];
  priceStartingFrom?: string;
  priceRange?: string | null;
  details?: string | null;
  isPopular?: boolean;
}

export interface TenantProjectItem {
  id: number;
  title: string;
  description: string;
  category?: string;
  status: string;
  clientName?: string;
  location: string;
  budget?: string | null;
  duration?: string;
  imageUrl?: string;
  image?: string;
  featured?: boolean;
  startDate?: string | null;
  endDate?: string | null;
  createdAt?: string;
}

export interface TenantReviewItem {
  id: number;
  authorName: string;
  authorRole?: string;
  company?: string;
  rating: number;
  reviewText?: string;
  text?: string;
  date?: string;
  verified?: boolean;
  approved?: boolean;
  approvedAt?: string | null;
  projectName?: string | null;
  createdAt?: string;
}

export interface TenantFullProfile {
  tenant: Tenant;
  hero: {
    title: string;
    subtitle: string;
    tagline: string;
    primaryCtaText: string;
    primaryCtaTab: string;
    secondaryCtaText: string;
    secondaryCtaTab: string;
    bannerImage: string;
    stats: TenantStatItem[];
    trustBadges: string[];
  };
  about: {
    headline: string;
    story: string;
    vision: string;
    mission: string;
    certifications: Array<{ title: string; issuer: string; year: string; badge: string }>;
    executives: TenantExecutive[];
    officeLocations: Array<{ city: string; address: string; phone: string; email: string; isHq: boolean }>;
  };
  services: TenantServiceItem[];
  projects: TenantProjectItem[];
  reviews: TenantReviewItem[];
  faqs: Array<{ question: string; answer: string; category: string }>;
  boqDefaults: {
    concreteC25Rate: number;
    rebarFe500Rate: number;
    excavationRate: number;
    blockwork15cmRate: number;
    plasteringRate: number;
    tileFinishingRate: number;
    laborDailyRate: number;
    currency: string;
  };
  seo: {
    metaTitle: string;
    metaDescription: string;
    keywords: string;
    ogImage: string;
    schemaType: string;
  };
}

export const TENANT_PROFILES: Record<number, TenantFullProfile> = {
  // =========================================================================
  // TENANT 1: MADECC GROUP (FLAGSHIP - TURNKEY EPC & LUXURY COMMERCIAL)
  // =========================================================================
  1: {
    tenant: {
      id: 1,
      name: 'MADECC-CONSTRUCTION',
      slug: 'madecc-construction',
      legalName: 'MADECC Construction & Civil Engineering Group SARL',
      logoUrl: '/logo.png',
      faviconUrl: '/app_favicon.jpg',
      primaryDomain: 'madecc-construction.madecccloud.com',
      customDomain: 'madeccgroup.online',
      status: 'ACTIVE',
      planCode: 'ENTERPRISE',
      currency: 'XAF',
      timezone: 'Africa/Douala',
      phone: '+237 671 063 511 / +237 683 316 486',
      email: 'contact@madeccgroup.online',
      address: 'Commercial Avenue, Bamenda & Douala, Cameroon',
      country: 'Cameroon',
      settings: {
        primaryColor: '#0f172a',
        secondaryColor: '#f59e0b',
        accentColor: '#2563eb',
        fontFamily: 'Plus Jakarta Sans',
        tagline: 'Premier Civil Engineering, Structural Design & Turnkey EPC Contractor',
        companyAddress: 'Commercial Avenue, Bamenda & Boulevard de la Liberté, Douala',
        phone: '+237 671 063 511',
        email: 'contact@madeccgroup.online',
        whatsappNumber: '+237671063511',
        currency: 'XAF',
        taxNumber: 'M051812728192K',
        registrationNumber: 'RC/YAO/2018/B/1429',
        socialLinks: {
          facebook: 'https://facebook.com/madeccgroup',
          linkedin: 'https://linkedin.com/company/madecc-group',
          instagram: 'https://instagram.com/madeccgroup',
          youtube: 'https://youtube.com/@madeccgroup',
          twitter: 'https://x.com/madeccgroup'
        }
      },
      aiCreditsBalance: 50000,
      storageUsageBytes: 4294967296,
      isFlagship: true,
      createdAt: '2024-01-01T00:00:00.000Z',
      updatedAt: new Date().toISOString()
    },
    hero: {
      title: 'Engineered Precision & Turnkey Construction in Central Africa',
      subtitle: 'MADECC Group delivers certified structural engineering, high-end residential estates, commercial complexes, and transparent quantity surveying across Cameroon and CEMAC.',
      tagline: 'Mastering Blueprints. Building Legacies.',
      primaryCtaText: 'Request Detailed BOQ Quote',
      primaryCtaTab: 'request-a-quote',
      secondaryCtaText: 'Explore Landmark Portfolio',
      secondaryCtaTab: 'projects',
      bannerImage: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1600&q=80',
      stats: [
        { value: '180+', label: 'Delivered Projects', description: 'Turnkey residential, institutional and commercial assets' },
        { value: '100%', label: 'Eurocode 2 Compliance', description: 'Certified structural stability and seismic safety' },
        { value: '15+ Yrs', label: 'Engineering Excellence', description: 'Continuous operations in Central African infrastructure' },
        { value: '24/7', label: 'Digital Project Tracking', description: 'Real-time client progress and transparent BOQ auditing' }
      ],
      trustBadges: ['ISO 9001:2015 Certified', 'Eurocode EN 1992-1-1', 'Order of Civil Engineers Registered', 'FIDIC Compliant']
    },
    about: {
      headline: 'A Decadal Legacy of Structural Integrity & Architectural Craftsmanship',
      story: 'Founded with the mission to bring precision engineering, zero-compromise structural calculations, and transparent cost accounting to African construction, MADECC Group has grown into an elite EPC general contractor. We combine on-site craftsmanship with algorithmic CAD takeoff, Eurocode structural models, and verifiable blockchain-grade contract systems.',
      vision: 'To be the benchmark of engineering integrity, resilient urban infrastructure, and sustainable smart buildings across Sub-Saharan Africa.',
      mission: 'Delivering uncompromised structural quality on schedule and within verified budgets through algorithmic quantity surveying and skilled project governance.',
      certifications: [
        { title: 'Quality Management Systems (ISO 9001:2015)', issuer: 'International Standards Bureau', year: '2021-Present', badge: 'ISO 9001' },
        { title: 'Registered Engineering Practice License', issuer: 'National Order of Civil Engineers (ONIGC)', year: '2018-Present', badge: 'ONIGC' },
        { title: 'Occupational Health & Safety (ISO 45001)', issuer: 'Regional Safety Council', year: '2022-Present', badge: 'ISO 45001' }
      ],
      executives: [
        {
          name: 'Eng. K. Robinson, M.Sc., P.E.',
          role: 'Managing Director & Lead Structural Consultant',
          qualifications: 'M.Sc. Structural Engineering, B.Eng. Civil Works',
          experienceYears: 18,
          bio: 'Specialist in reinforced concrete design, deep foundation geotechnics, and high-rise commercial structures under Eurocode 2.',
          avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80'
        },
        {
          name: 'Dr. Helene Mbarga, Ph.D.',
          role: 'Head of Quantity Surveying & Estimations',
          qualifications: 'Ph.D. Construction Economics, RICS Fellow',
          experienceYears: 14,
          bio: 'Oversees algorithmic takeoff, procurement logistics, and parametric BOQ verification models.',
          avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=300&q=80'
        }
      ],
      officeLocations: [
        { city: 'Douala (Headquarters)', address: 'Boulevard de la Liberté, Akwa Business District', phone: '+237 671 063 511', email: 'douala@madeccgroup.online', isHq: true },
        { city: 'Yaoundé (Operations Hub)', address: 'Avenue Kennedy, Centre-Ville', phone: '+237 683 316 486', email: 'yaounde@madeccgroup.online', isHq: false },
        { city: 'Bamenda (Regional Bureau)', address: 'Commercial Avenue, Up Station', phone: '+237 671 063 511', email: 'bamenda@madeccgroup.online', isHq: false }
      ]
    },
    services: [
      {
        id: 1,
        title: 'Turnkey General Contracting & EPC',
        description: 'End-to-end management from architectural blueprint formulation, geotechnical soil investigation, foundation casting to turnkey commissioning.',
        icon: 'Building2',
        features: ['Full Turnkey Delivery', 'Fixed-Price Contract Guarantees', 'Dedicated Site Engineer', 'Milestone Payment Scheduling'],
        priceStartingFrom: '150,000,000 XAF',
        isPopular: true
      },
      {
        id: 2,
        title: 'Eurocode 2 Structural Engineering & CAD',
        description: 'Rigorous calculation of reinforced concrete frames, shear walls, foundation rafts, and heavy steel structures compliant with EN 1992 and French DTU.',
        icon: 'Ruler',
        features: ['Parametric 3D Finite Element Analysis', 'Reinforcement Detailing & Bar Bending Schedules', 'Independent Structural Audits', 'Soil-Structure Interaction Analysis'],
        priceStartingFrom: '2,500,000 XAF',
        isPopular: false
      },
      {
        id: 3,
        title: 'Algorithmic Bill of Quantities (BOQ)',
        description: 'AI-assisted takeoff from architectural and CAD drawings yielding transparent itemized material and labor schedules down to the kilogram of steel and bag of cement.',
        icon: 'Calculator',
        features: ['Exact Material Quantity Takeoff', 'Regional Market Price Benchmarks', 'Contractor Variance Audits', 'Exportable Excel & Signed PDF'],
        priceStartingFrom: '500,000 XAF',
        isPopular: false
      },
      {
        id: 4,
        title: 'Luxury Residential & Smart Villas',
        description: 'High-specification bespoke residences featuring open architectural cantilevers, smart home automation, energy-efficient glazing, and solar micro-grids.',
        icon: 'Layers',
        features: ['Architectural 3D Visualizations', 'Premium Finishing & Imported Sanitaryware', 'Solar Roof Integration', '10-Year Decennial Insurance'],
        priceStartingFrom: '85,000,000 XAF',
        isPopular: true
      }
    ],
    projects: [
      {
        id: 1,
        title: 'The Pearl Residences — 6-Storey Luxury Apartment Complex',
        description: 'Turnkey structural execution of a 24-unit luxury residential building with underground parking, rooftop infinity lounge, and backup solar generator.',
        category: 'Commercial & Multi-Family',
        status: 'Completed',
        clientName: 'SOGECAM Real Estate Development',
        location: 'Bonapriso, Douala',
        budget: '850,000,000 XAF',
        duration: '18 Months',
        imageUrl: 'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
        featured: true
      },
      {
        id: 2,
        title: 'Grand Horizon Commercial Center & Corporate Headquarters',
        description: 'Construction of a reinforced concrete multi-use commercial and banking tower with high-efficiency curtain walling and Eurocode structural seismic resistance.',
        category: 'Commercial',
        status: 'Completed',
        clientName: 'Afriland Financial Services Group',
        location: 'Avenue Charles de Gaulle, Yaoundé',
        budget: '1,420,000,000 XAF',
        duration: '24 Months',
        imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
        featured: true
      },
      {
        id: 3,
        title: 'Kribi Oceanfront Eco-Resort & Conference Center',
        description: 'Bespoke coastal resort featuring treated timber trusses, marine-grade reinforced concrete, decentralized wastewater treatment, and solar micro-grid.',
        category: 'Hospitality & Luxury',
        status: 'In Progress',
        clientName: 'Atlantic Coastal Resorts SA',
        location: 'Kribi Coastal Strip, South Region',
        budget: '680,000,000 XAF',
        duration: '14 Months',
        imageUrl: 'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
        featured: true
      }
    ],
    reviews: [
      {
        id: 1,
        authorName: 'Alain Fotso',
        authorRole: 'CEO, SOGECAM Properties',
        company: 'SOGECAM Real Estate',
        rating: 5,
        reviewText: 'MADECC Group delivered our Bonapriso 6-storey complex two weeks ahead of schedule. The BOQ accuracy was within 2% of final accounts, which is unprecedented in Central African construction.',
        date: '2025-11-14',
        verified: true
      },
      {
        id: 2,
        authorName: 'Dr. Esther Nguemo',
        authorRole: 'Diaspora Homeowner (London, UK)',
        company: 'Private Client',
        rating: 5,
        reviewText: 'Managing a villa construction from the UK was seamless thanks to MADECC’s weekly digital audit logs, verified video inspections, and transparent milestone contracts.',
        date: '2026-02-08',
        verified: true
      }
    ],
    faqs: [
      {
        question: 'What building standards do you use for structural calculations?',
        answer: 'All our structural designs comply strictly with Eurocode 2 (EN 1992-1-1) for reinforced concrete and Eurocode 3 for structural steel, alongside national DTU standards adapted for sub-tropical soil geotechnics.',
        category: 'Engineering'
      },
      {
        question: 'Do you offer a decennial structural warranty?',
        answer: 'Yes. All turnkey building projects executed by MADECC Group are backed by full 10-year decennial civil liability coverage and certified structural inspection certificates.',
        category: 'Contracts & Legal'
      }
    ],
    boqDefaults: {
      concreteC25Rate: 88000,
      rebarFe500Rate: 650000,
      excavationRate: 4500,
      blockwork15cmRate: 8500,
      plasteringRate: 3800,
      tileFinishingRate: 9500,
      laborDailyRate: 6000,
      currency: 'XAF'
    },
    seo: {
      metaTitle: 'MADECC Group | Premier Civil Engineering & Turnkey Construction Firm',
      metaDescription: 'Cameroon’s premier civil engineering firm. Turnkey commercial towers, luxury villas, Eurocode 2 structural calculations, and transparent BOQ estimation in Douala & Yaoundé.',
      keywords: 'civil engineering Cameroon, construction company Douala, structural engineer Yaounde, BOQ estimator FCFA, turnkey building contractor, MADECC Group',
      ogImage: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=80',
      schemaType: 'GeneralContractor'
    }
  },

  // =========================================================================
  // TENANT 2: BUILDPRO ENGINEERING LTD (STRUCTURAL STEEL & INDUSTRIAL WAREHOUSES)
  // =========================================================================
  2: {
    tenant: {
      id: 2,
      name: 'BuildPro Engineering Ltd',
      slug: 'buildpro-engineering',
      legalName: 'BuildPro Civil & Structural Contractors Ltd',
      logoUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=400&q=80',
      faviconUrl: null,
      primaryDomain: 'buildpro.madecccloud.com',
      customDomain: 'buildpro-contractors.com',
      status: 'ACTIVE',
      planCode: 'PROFESSIONAL',
      currency: 'XAF',
      timezone: 'Africa/Douala',
      phone: '+237 689 115 595',
      email: 'info@buildpro-contractors.com',
      address: 'Boulevard de la Liberté, Akwa & Bonabéri Industrial Zone, Douala',
      country: 'Cameroon',
      settings: {
        primaryColor: '#1e3a8a',
        secondaryColor: '#10b981',
        accentColor: '#f97316',
        fontFamily: 'Inter',
        tagline: 'Heavy Industrial Steel Structures, Logistics Warehouses & Commercial Buildings',
        companyAddress: 'Plot 42, Bonabéri Industrial Zone, Douala, Cameroon',
        phone: '+237 689 115 595',
        email: 'info@buildpro-contractors.com',
        whatsappNumber: '+237689115595',
        currency: 'XAF',
        taxNumber: 'M091914285710P',
        registrationNumber: 'RC/DLA/2019/B/2240',
        socialLinks: {
          linkedin: 'https://linkedin.com/company/buildpro-contractors',
          facebook: 'https://facebook.com/buildprocameroon'
        }
      },
      aiCreditsBalance: 450,
      storageUsageBytes: 3221225472,
      isFlagship: false,
      createdAt: '2024-06-15T00:00:00.000Z',
      updatedAt: new Date().toISOString()
    },
    hero: {
      title: 'Heavy Structural Steel, Industrial Hubs & Commercial Contracting',
      subtitle: 'BuildPro Engineering Ltd designs, fabricates, and erects large-span steel warehouses, agro-industrial plants, and high-load reinforced concrete slabs across the Gulf of Guinea.',
      tagline: 'Strength Through Structural Precision.',
      primaryCtaText: 'Request Industrial Warehouse Estimate',
      primaryCtaTab: 'request-a-quote',
      secondaryCtaText: 'View Industrial Portfolio',
      secondaryCtaTab: 'projects',
      bannerImage: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1600&q=80',
      stats: [
        { value: '95,000 m²', label: 'Industrial Space Erected', description: 'Logistics parks, factory floors, and temperature-controlled storage' },
        { value: '4,500 Tons', label: 'Fabricated Structural Steel', description: 'Certified S355 and S275 structural steel framing' },
        { value: '12 Yrs', label: 'Heavy Engineering Track Record', description: 'Supplying major FMCG and multinational manufacturers' },
        { value: '0 Incident', label: 'OHSAS Safety Standard', description: 'Over 500,000 man-hours without lost-time accidents' }
      ],
      trustBadges: ['Certified Steel Fabricator', 'ISO 3834 Welding Standards', 'Heavy Crane Operations Certified', 'CIMENCAM Approved Partner']
    },
    about: {
      headline: 'Pioneering Large-Span Industrial Architecture in Central Africa',
      story: 'BuildPro Engineering Ltd was established to fill the regional gap in heavy structural steel fabrication and rapid-deployment industrial warehousing. With an in-house 5,000 m² steel fabrication yard in Bonabéri and high-precision plasma cutters, we manufacture overhead gantry frames, truss bridges, and pre-engineered metal buildings (PEB) that meet international British Standard and Eurocode 3 requirements.',
      vision: 'To power Africa’s industrial transformation through durable, high-efficiency manufacturing and logistics facilities.',
      mission: 'Providing manufacturers and logistics operators with earthquake-resilient, weather-resistant, and cost-effective industrial infrastructure delivered on record timelines.',
      certifications: [
        { title: 'Structural Steelwork Execution (EN 1090-2 EXC3)', issuer: 'Steel Construction Certification Board', year: '2020-Present', badge: 'EN 1090-2' },
        { title: 'Quality System for Fusion Welding (ISO 3834-2)', issuer: 'International Institute of Welding', year: '2021-Present', badge: 'ISO 3834' }
      ],
      executives: [
        {
          name: 'Eng. Patrick Tchakoute, P.Eng.',
          role: 'Chief Technical Officer & Head of Structural Fabrication',
          qualifications: 'B.Sc. Mechanical & Structural Engineering (Polytechnique)',
          experienceYears: 16,
          bio: '16 years leading large-scale industrial erections, factory setups, and heavy overhead crane runway structures.',
          avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=300&q=80'
        },
        {
          name: 'Sarah Ndong, M.Eng.',
          role: 'Project Director — Industrial Contracts',
          qualifications: 'M.Eng. Civil & Industrial Project Management',
          experienceYears: 11,
          bio: 'Specialist in fast-track procurement, industrial supply chain scheduling, and turnkey factory commissioning.',
          avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=300&q=80'
        }
      ],
      officeLocations: [
        { city: 'Douala (Head Office & Works)', address: 'Plot 42, Bonabéri Industrial Zone', phone: '+237 689 115 595', email: 'douala@buildpro-contractors.com', isHq: true },
        { city: 'Bafoussam (Regional Yard)', address: 'Zone Industrielle de Bafoussam', phone: '+237 689 115 595', email: 'west@buildpro-contractors.com', isHq: false }
      ]
    },
    services: [
      {
        id: 101,
        title: 'Pre-Engineered Steel Buildings (PEB) & Warehouses',
        description: 'Design, in-house fabrication, and on-site erection of clear-span steel buildings for logistics, packaging plants, and agricultural storage.',
        icon: 'Hammer',
        features: ['Clear Spans up to 60m Without Internal Columns', 'Hot-Dip Galvanized & Primer Coating', 'Integrated Overhead Crane Beams', 'Insulated Polyurethane Sandwich Panels'],
        priceStartingFrom: '95,000,000 XAF',
        isPopular: true
      },
      {
        id: 102,
        title: 'Heavy Industrial Concrete Flooring & Laser Screed',
        description: 'Jointless steel-fiber reinforced concrete slabs with burnished quartz dry-shake hardeners capable of supporting 10-ton forklift axle loads.',
        icon: 'Layers',
        features: ['Laser Screed Flatness (FM2 Classification)', 'Steel Fiber Reinforcement', 'Monolithic Dry-Shake Wear Layer', 'Dust-Proof Epoxy Sealing'],
        priceStartingFrom: '18,500 XAF / m²',
        isPopular: false
      },
      {
        id: 103,
        title: 'Overhead Crane Runways & Heavy Gantry Systems',
        description: 'Structural calculation and crane runway rail alignment for 5-ton to 50-ton overhead travelling cranes in accordance with BS 5950 and CMAA standards.',
        icon: 'Truck',
        features: ['Precision Optical Rail Alignment', 'Fatigue-Resistant Welded Girders', 'Load Testing & Commissioning', 'Annual Structural Inspection'],
        priceStartingFrom: '15,000,000 XAF',
        isPopular: false
      }
    ],
    projects: [
      {
        id: 101,
        title: 'Central African Freight Logistics Distribution Hub (12,000 m²)',
        description: 'Turnkey steel fabrication, concrete slab casting, and loading dock installation for a multi-modal logistics hub.',
        category: 'Industrial & Logistics',
        status: 'Completed',
        clientName: 'Bolloré / AGL Logistics Cameroon',
        location: 'Bonabéri Industrial Zone, Douala',
        budget: '1,850,000,000 XAF',
        duration: '12 Months',
        imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80',
        featured: true
      },
      {
        id: 102,
        title: 'Brasseries Agro-Processing Bottling Plant & Silo Complex',
        description: 'Heavy structural steel framework with 30m clear spans and elevated grain hopper platforms.',
        category: 'Manufacturing',
        status: 'Completed',
        clientName: 'SABC Agro-Industries',
        location: 'Bassa Industrial Area, Douala',
        budget: '2,400,000,000 XAF',
        duration: '16 Months',
        imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
        featured: true
      }
    ],
    reviews: [
      {
        id: 101,
        authorName: 'Jean-Marc Belinga',
        authorRole: 'Supply Chain Operations Director',
        company: 'AGL Logistics',
        rating: 5,
        reviewText: 'BuildPro’s ability to erect 12,000 square meters of steel warehouse in under 6 months allowed us to operationalize our regional transit contract ahead of our competitor.',
        date: '2025-10-20',
        verified: true
      }
    ],
    faqs: [
      {
        question: 'What is the maximum clear-span distance BuildPro can fabricate?',
        answer: 'We routinely engineer and fabricate clear-span portal frames up to 60 meters without any interior intermediate columns, maximizing usable warehousing and logistics volume.',
        category: 'Technical Specifications'
      }
    ],
    boqDefaults: {
      concreteC25Rate: 85000,
      rebarFe500Rate: 640000,
      excavationRate: 4200,
      blockwork15cmRate: 8200,
      plasteringRate: 3600,
      tileFinishingRate: 8900,
      laborDailyRate: 5800,
      currency: 'XAF'
    },
    seo: {
      metaTitle: 'BuildPro Engineering Ltd | Heavy Structural Steel & Industrial Warehouses',
      metaDescription: 'Leading industrial steel building contractor in Cameroon. Pre-engineered metal buildings, heavy logistics warehouses, laser-screed concrete slabs, and factory installations in Douala.',
      keywords: 'structural steel Cameroon, industrial warehouse builder Douala, pre-engineered buildings Africa, steel fabrication Bonaberi, factory contractor, BuildPro Engineering',
      ogImage: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
      schemaType: 'GeneralContractor'
    }
  },

  // =========================================================================
  // TENANT 3: ALPHA CIVIL & INFRA GROUP (ROADS, BRIDGES & EARTHWORKS)
  // =========================================================================
  3: {
    tenant: {
      id: 3,
      name: 'Alpha Civil & Infra Group',
      slug: 'alpha-civil',
      legalName: 'Alpha Civil Infrastructure, Roads & Geotechnics SARL',
      logoUrl: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=400&q=80',
      faviconUrl: null,
      primaryDomain: 'alphacivil.madecccloud.com',
      customDomain: 'alphacivil.cm',
      status: 'ACTIVE',
      planCode: 'STARTER',
      currency: 'XAF',
      timezone: 'Africa/Douala',
      phone: '+237 640 194 505',
      email: 'projects@alphacivil.cm',
      address: 'Bastos Diplomatic Quarter & Mbankolo Works Depot, Yaoundé',
      country: 'Cameroon',
      settings: {
        primaryColor: '#18181b',
        secondaryColor: '#e11d48',
        accentColor: '#0284c7',
        fontFamily: 'Plus Jakarta Sans',
        tagline: 'Heavy Earthworks, Highway Paving, Box Culverts & Reinforced Bridge Construction',
        companyAddress: 'Avenue Rosa Parks, Bastos, Yaoundé, Cameroon',
        phone: '+237 640 194 505',
        email: 'projects@alphacivil.cm',
        whatsappNumber: '+237640194505',
        currency: 'XAF',
        taxNumber: 'M022015893021T',
        registrationNumber: 'RC/YAO/2020/B/3118',
        socialLinks: {
          linkedin: 'https://linkedin.com/company/alpha-civil-group',
          facebook: 'https://facebook.com/alphacivilcameroon'
        }
      },
      aiCreditsBalance: 85,
      storageUsageBytes: 1073741824,
      isFlagship: false,
      createdAt: '2024-09-01T00:00:00.000Z',
      updatedAt: new Date().toISOString()
    },
    hero: {
      title: 'Heavy Civil Infrastructure, Highways, Bridges & Land Development',
      subtitle: 'Alpha Civil & Infra Group executes major earthmoving, asphalt paving, concrete bridges, retaining walls, and flood control drainage for regional governments and private developers.',
      tagline: 'Connecting Communities. Engineering Terrain.',
      primaryCtaText: 'Request Road & Earthwork Pricing',
      primaryCtaTab: 'request-a-quote',
      secondaryCtaText: 'Explore Civil Works Portfolio',
      secondaryCtaTab: 'projects',
      bannerImage: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1600&q=80',
      stats: [
        { value: '320 km', label: 'Paved & Rural Roadways', description: 'Bituminous asphalt, laterite stabilization, and urban arterial roads' },
        { value: '45+', label: 'Heavy Machinery Fleet', description: 'CAT bulldozers, motor graders, excavators, and asphalt pavers' },
        { value: '18', label: 'Concrete Bridges & Culverts', description: 'Post-tensioned beam bridges and hydraulic storm channels' },
        { value: '98.5%', label: 'Compaction Quality Rate', description: 'Proctor compaction densities meeting national highway standards' }
      ],
      trustBadges: ['Ministry of Public Works (MINTP) Approved', 'AASHTO Pavement Design Certified', 'Heavy Earthmoving Equipment Fleet', 'Geotechnical Soil Lab Verified']
    },
    about: {
      headline: 'Engineering the Arteries of African Commerce & Community Mobility',
      story: 'Alpha Civil & Infra Group specializes in overcoming challenging tropical terrain, heavy monsoon rainfall drainage, and clay-rich soil geotechnics. Operating a modern fleet of GPS-guided earthmoving machinery, we deliver road realignments, highway paving, retaining structures, and urban stormwater networks with guaranteed longevity against tropical erosion.',
      vision: 'To build resilient transportation arteries and sustainable drainage infrastructure that withstand climate extremities across Africa.',
      mission: 'Transforming rugged terrain into high-speed, safe, and durable transportation corridors using advanced compaction geotechnics and rigorous material testing.',
      certifications: [
        { title: 'Public Works Highway & Bridge Execution Class A', issuer: 'Ministry of Public Works (MINTP)', year: '2020-Present', badge: 'MINTP Class A' },
        { title: 'Road Material Testing & Quality Control Laboratory License', issuer: 'National Civil Engineering Lab (LABOGENIE)', year: '2021-Present', badge: 'LABOGENIE' }
      ],
      executives: [
        {
          name: 'Eng. Samuel Nkongho, M.Sc. Transport Eng.',
          role: 'General Manager & Chief Highways Engineer',
          qualifications: 'M.Sc. Transportation Infrastructure & Pavement Geotechnics',
          experienceYears: 20,
          bio: 'Former senior road consultant with 20 years supervising national corridor paving and bridge engineering across Central Africa.',
          avatarUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=300&q=80'
        }
      ],
      officeLocations: [
        { city: 'Yaoundé (Headquarters)', address: 'Avenue Rosa Parks, Bastos', phone: '+237 640 194 505', email: 'yaounde@alphacivil.cm', isHq: true },
        { city: 'Bafia (Field Operations Base)', address: 'National Road 4 Base Camp', phone: '+237 640 194 505', email: 'field@alphacivil.cm', isHq: false }
      ]
    },
    services: [
      {
        id: 201,
        title: 'Asphalt Highway Paving & Road Rehabilitation',
        description: 'Complete sub-base stabilization, crushed rock base course, and hot-mix asphalt (BBSG) paving for urban avenues and rural trunk roads.',
        icon: 'Truck',
        features: ['Hot-Mix Asphalt (BB) Paving', 'Cement-Stabilized Laterite Base', 'Curb & Concrete Gutter Installation', 'Retroreflective Road Thermoplastic Marking'],
        priceStartingFrom: '450,000,000 XAF / km',
        isPopular: true
      },
      {
        id: 202,
        title: 'Reinforced Concrete Bridges & Stormwater Culverts',
        description: 'Construction of reinforced concrete box culverts, single and multi-span girder bridges, and energy-dissipating spillways.',
        icon: 'Building2',
        features: ['Hydrological Watershed Sizing', 'Deep Piled Abutments & Piers', 'Elastomeric Bearing Installation', 'Scour-Protection Gabions & Rip-Rap'],
        priceStartingFrom: '75,000,000 XAF',
        isPopular: false
      },
      {
        id: 203,
        title: 'Mass Earthworks, Site Levelling & Slope Stabilization',
        description: 'Large-scale excavation, cut-and-fill balancing, terracing, and geotextile-reinforced soil retaining walls for commercial development plots.',
        icon: 'Hammer',
        features: ['GPS Cut-and-Fill Optimization', 'Gabion & Geogrid Retaining Walls', 'Sub-Surface French Drains', '95% Modified Proctor Compaction'],
        priceStartingFrom: '3,800 XAF / m³',
        isPopular: false
      }
    ],
    projects: [
      {
        id: 201,
        title: 'Bastos Valley Urban Arterial Dual-Carriageway (4.2 km)',
        description: 'Full reconstruction with underground storm drainage, street lighting conduits, and heavy-duty asphalt overlay.',
        category: 'Roads & Highways',
        status: 'Completed',
        clientName: 'Yaoundé City Council (CUY)',
        location: 'Bastos - Nlongkak, Yaoundé',
        budget: '2,100,000,000 XAF',
        duration: '14 Months',
        imageUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?auto=format&fit=crop&w=1200&q=80',
        featured: true
      },
      {
        id: 202,
        title: 'Mefou River 3-Span Concrete Bridge & Flood Channel',
        description: '28-meter pre-stressed concrete beam bridge providing flood-proof access to new suburban residential zones.',
        category: 'Bridges & Hydraulics',
        status: 'Completed',
        clientName: 'Ministry of Housing & Urban Development (MINDHU)',
        location: 'Mbankolo - Mefou River Basin',
        budget: '920,000,000 XAF',
        duration: '10 Months',
        imageUrl: 'https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&w=1200&q=80',
        featured: true
      }
    ],
    reviews: [
      {
        id: 201,
        authorName: 'Eng. Paulin Mendomo',
        authorRole: 'Director of Technical Services',
        company: 'Yaoundé City Council',
        rating: 5,
        reviewText: 'Alpha Civil delivered the Bastos bypass with zero flooding during the torrential September rains. Their stormwater culvert sizing and asphalt finish are exemplary.',
        date: '2025-12-05',
        verified: true
      }
    ],
    faqs: [
      {
        question: 'What compaction standards are enforced on your roadbed earthworks?',
        answer: 'We mandate a minimum of 95% Modified Proctor Density (OPM) for sub-grades and 98% for base courses, verified with nuclear density gauges and sand cone testing.',
        category: 'Quality Control'
      }
    ],
    boqDefaults: {
      concreteC25Rate: 86000,
      rebarFe500Rate: 645000,
      excavationRate: 3800,
      blockwork15cmRate: 8300,
      plasteringRate: 3700,
      tileFinishingRate: 9000,
      laborDailyRate: 5500,
      currency: 'XAF'
    },
    seo: {
      metaTitle: 'Alpha Civil & Infra Group | Highway Paving, Bridges & Earthworks',
      metaDescription: 'Leading road construction and heavy civil engineering firm in Cameroon. Asphalt highway paving, reinforced concrete bridges, drainage culverts, and site excavation in Yaoundé.',
      keywords: 'road construction Cameroon, civil engineering contractor Yaounde, asphalt paving, bridge contractor Africa, earthworks excavation, Alpha Civil Group',
      ogImage: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80',
      schemaType: 'GeneralContractor'
    }
  },

  // =========================================================================
  // TENANT 4: GREENHORIZON URBAN PLANNERS & ECO-BUILDERS
  // =========================================================================
  4: {
    tenant: {
      id: 4,
      name: 'GreenHorizon Eco-Builders',
      slug: 'greenhorizon-eco',
      legalName: 'GreenHorizon Sustainable Architecture & Eco-Building SARL',
      logoUrl: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&w=400&q=80',
      faviconUrl: null,
      primaryDomain: 'greenhorizon.madecccloud.com',
      customDomain: 'greenhorizon-eco.com',
      status: 'ACTIVE',
      planCode: 'PROFESSIONAL',
      currency: 'XAF',
      timezone: 'Africa/Douala',
      phone: '+237 677 882 109',
      email: 'hello@greenhorizon-eco.com',
      address: 'Mont Fébé Green Enclave, Yaoundé, Cameroon',
      country: 'Cameroon',
      settings: {
        primaryColor: '#064e3b',
        secondaryColor: '#059669',
        accentColor: '#b45309',
        fontFamily: 'Plus Jakarta Sans',
        tagline: 'Bioclimatic Architecture, Compressed Earth Block (CEB) & Net-Zero Solar Estates',
        companyAddress: 'Mont Fébé Hills, Yaoundé, Cameroon',
        phone: '+237 677 882 109',
        email: 'hello@greenhorizon-eco.com',
        whatsappNumber: '+237677882109',
        currency: 'XAF',
        taxNumber: 'M042217649201E',
        registrationNumber: 'RC/YAO/2022/B/5182',
        socialLinks: {
          linkedin: 'https://linkedin.com/company/greenhorizon-eco',
          instagram: 'https://instagram.com/greenhorizon_eco'
        }
      },
      aiCreditsBalance: 500,
      storageUsageBytes: 2147483648,
      isFlagship: false,
      createdAt: '2024-11-01T00:00:00.000Z',
      updatedAt: new Date().toISOString()
    },
    hero: {
      title: 'Sustainable Bioclimatic Architecture & Net-Zero Eco-Villas',
      subtitle: 'GreenHorizon creates carbon-neutral residential estates, compressed stabilized earth blocks (CSEB), passive thermal cooling, and integrated rooftop solar micro-grids across Central Africa.',
      tagline: 'Building with Nature. Living for Tomorrow.',
      primaryCtaText: 'Design Your Net-Zero Eco Villa',
      primaryCtaTab: 'request-a-quote',
      secondaryCtaText: 'View Sustainable Projects',
      secondaryCtaTab: 'projects',
      bannerImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=80',
      stats: [
        { value: '-65%', label: 'HVAC Energy Consumption', description: 'Thermal mass earth blocks and cross-ventilation passive cooling' },
        { value: '45+', label: 'Eco-Villas Delivered', description: 'Certified sustainable residences in Yaoundé, Kribi, and Limbe' },
        { value: '1.2 MW', label: 'Solar Capacity Installed', description: 'Clean solar micro-grids integrated into private residential estates' },
        { value: '100%', label: 'Locally Sourced Materials', description: 'Stabilized local laterite, bamboo, and certified FSC timber' }
      ],
      trustBadges: ['EDGE Green Building Certified Partner', 'World Green Building Council Member', 'Zero-Carbon Thermal Design', 'Decennial Eco-Warranty']
    },
    about: {
      headline: 'Harmonizing Indigenous African Materials with Modern Bioclimatic Science',
      story: 'GreenHorizon Eco-Builders was founded by eco-architects and civil engineers passionate about lowering the carbon footprint and electricity bills of modern living. By leveraging compressed stabilized earth blocks (CSEB) which provide natural thermal inertia, rainwater harvesting systems, and solar shading louvers, we create luxurious, naturally cool homes that require minimal air conditioning in tropical climates.',
      vision: 'To spearhead the green building revolution across Africa, creating beautiful, self-sustaining communities that respect our natural ecosystems.',
      mission: 'Designing and building luxury, climate-resilient, and energy-positive homes using high-tech sustainable African materials.',
      certifications: [
        { title: 'EDGE Certified Green Practitioner', issuer: 'International Finance Corporation (IFC)', year: '2022-Present', badge: 'IFC EDGE' },
        { title: 'African Sustainable Building Excellence Award', issuer: 'Green Architecture Alliance', year: '2024', badge: 'Green Alliance' }
      ],
      executives: [
        {
          name: 'Arch. Mireille Eboa, M.Arch., EDGE Expert',
          role: 'Principal Eco-Architect & Co-Founder',
          qualifications: 'M.Arch. Sustainable Tropical Architecture, B.Eng. Architectural Engineering',
          experienceYears: 13,
          bio: '13 years designing bioclimatic homes, passive solar shading, and sustainable rammed-earth resorts.',
          avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
        }
      ],
      officeLocations: [
        { city: 'Yaoundé (Design Studio)', address: 'Mont Fébé Green Enclave', phone: '+237 677 882 109', email: 'yaounde@greenhorizon-eco.com', isHq: true },
        { city: 'Kribi (Coastal Bureau)', address: 'Boulevard Maritime, Kribi', phone: '+237 677 882 109', email: 'kribi@greenhorizon-eco.com', isHq: false }
      ]
    },
    services: [
      {
        id: 301,
        title: 'Bioclimatic Architecture & Solar Villa Construction',
        description: 'Turnkey luxury eco-villas engineered with natural cross-ventilation, shaded overhangs, and high-efficiency rooftop solar batteries.',
        icon: 'Sparkles',
        features: ['Passive Solar Orientation', 'Zero-Air Conditioning Thermal Comfort', 'Off-Grid Hybrid Solar & Lithium Storage', 'Rainwater Filtration & Greywater Recycling'],
        priceStartingFrom: '110,000,000 XAF',
        isPopular: true
      },
      {
        id: 302,
        title: 'Compressed Stabilized Earth Block (CSEB) Masonry',
        description: 'Hydraulic high-density interlocked earth block masonry offering high acoustic insulation, fire resistance, and 40% reduction in embodied carbon.',
        icon: 'Layers',
        features: ['No-Mortar Interlocking Precision', 'High Thermal Mass (Keeps Interiors Cool)', 'Zero Brick-Kiln Carbon Emissions', 'Natural Earth Textured Finish'],
        priceStartingFrom: '450 XAF / Block Delivered',
        isPopular: false
      }
    ],
    projects: [
      {
        id: 301,
        title: 'Mont Fébé Bioclimatic Eco-Residence (Net-Zero)',
        description: 'A 450 m² luxury residence built entirely with compressed earth blocks, solar glass, and natural rainwater gravity-flow systems.',
        category: 'Eco-Luxury Residential',
        status: 'Completed',
        clientName: 'Dr. Martin Nkeng',
        location: 'Mont Fébé, Yaoundé',
        budget: '220,000,000 XAF',
        duration: '9 Months',
        imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
        featured: true
      }
    ],
    reviews: [
      {
        id: 301,
        authorName: 'Dr. Martin Nkeng',
        authorRole: 'UN Environmental Advisor',
        company: 'Private Homeowner',
        rating: 5,
        reviewText: 'My electric bill has dropped by 80% and the house remains naturally cool even during the hottest dry season weeks without air conditioning. GreenHorizon is redefining construction.',
        date: '2026-01-18',
        verified: true
      }
    ],
    faqs: [
      {
        question: 'Are compressed earth blocks (CSEB) durable against heavy tropical rain?',
        answer: 'Yes. Our blocks are stabilized with 6-8% cement and hydraulic compaction under 200 bars of pressure, passing all ASTM weathering and compressive strength tests.',
        category: 'Eco Materials'
      }
    ],
    boqDefaults: {
      concreteC25Rate: 84000,
      rebarFe500Rate: 640000,
      excavationRate: 4000,
      blockwork15cmRate: 7200,
      plasteringRate: 3400,
      tileFinishingRate: 8500,
      laborDailyRate: 5600,
      currency: 'XAF'
    },
    seo: {
      metaTitle: 'GreenHorizon Eco-Builders | Sustainable Architecture & Net-Zero Villas',
      metaDescription: 'Sustainable construction and bioclimatic architecture in Cameroon. Compressed earth blocks (CSEB), passive solar villas, net-zero energy design, and green building certification in Yaoundé.',
      keywords: 'green building Cameroon, sustainable architecture Africa, compressed earth block Yaounde, eco villa construction, solar home builder, GreenHorizon Eco',
      ogImage: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      schemaType: 'GeneralContractor'
    }
  }
};

export class TenantContentService {
  /**
   * Get full rich profile for any tenant ID
   */
  static getProfile(tenantId: number): TenantFullProfile {
    const profile = TENANT_PROFILES[tenantId];
    if (profile) return profile;

    // Fallback: build dynamically from flagship template if a custom new tenant was registered
    const base = TENANT_PROFILES[1];
    return {
      ...base,
      tenant: {
        ...base.tenant,
        id: tenantId,
        name: `Tenant ${tenantId} Workspace`,
        slug: `tenant-${tenantId}`,
        isFlagship: false
      }
    };
  }

  /**
   * Get all registered pilot tenant profiles
   */
  static getAllProfiles(): TenantFullProfile[] {
    return Object.values(TENANT_PROFILES);
  }

  /**
   * Get all Tenant objects
   */
  static getAllTenants(): Tenant[] {
    return Object.values(TENANT_PROFILES).map(p => p.tenant);
  }
}
