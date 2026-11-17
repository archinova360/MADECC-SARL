export interface DivisionServiceSeed {
  name: string;
  slug: string;
  categoryGroup?: string;
  desc: string;
  pricingModel?: string;
  investmentInfo?: string;
}

export interface DivisionSeed {
  code: string;
  slug: string;
  name: string;
  category: string;
  imageUrl: string;
  summary: string;
  fullDescription: string;
  investmentInfo?: string;
  complianceDisclaimer?: string;
  operationalStatus: string;
  publishStatus: string;
  country: string;
  operatingCountries: string[];
  currency: string;
  regulatoryBody: string;
  licenceRequired: boolean;
  licenceStatus: string;
  displayOrder: number;
  services: DivisionServiceSeed[];
}

export const CORPORATE_DESCRIPTION_DEFAULT = [
  'MADECC Group is a founder-led, diversified business initiative originating in Cameroon, with a primary focus on construction, civil engineering and real estate development.',
  'Its proposed business activities also include pharmaceuticals and healthcare-related opportunities, agriculture, agro-processing, logistics, renewable energy, building-materials manufacturing, procurement and project development.',
  'The group aims to develop business opportunities through professional service delivery, strategic partnerships and responsible investment.',
  'Additional business divisions will be developed gradually as funding, expertise, partnerships and regulatory approvals become available.',
].join('\n\n');

export const TEN_BUSINESS_DIVISIONS_SEED: DivisionSeed[] = [
  {
    code: 'DIV-01',
    slug: 'construction-building-services',
    name: 'A. Construction and Building Works',
    category: 'Construction & Building',
    imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1000&q=80',
    summary:
      'Residential, commercial, and industrial building construction, renovations, extensions, structural finishing trades, maintenance, and professional project coordination.',
    fullDescription:
      'MADECC Group delivers building works across Cameroon from residential villas and apartments to commercial plazas and industrial facilities—integrating masonry, roofing, plastering, tiling, painting, maintenance, and construction supervision strictly through qualified professionals.',
    investmentInfo: 'Open to build-to-order contracts, phased residential construction financing partnerships, and institutional turnkey delivery.',
    complianceDisclaimer: 'Construction supervision and regulated engineering sign-offs are executed strictly through qualified professionals.',
    operationalStatus: 'PROPOSED',
    publishStatus: 'PUBLISHED',
    country: 'Republic of Cameroon',
    operatingCountries: ['Republic of Cameroon'],
    currency: 'XAF',
    regulatoryBody: 'MINHDU / Municipal Building Permit Authorities (CUY/CUD)',
    licenceRequired: true,
    licenceStatus: 'NOT_APPLIED',
    displayOrder: 1,
    services: [
      { name: 'Residential building construction', slug: 'residential-building-construction', categoryGroup: 'Building Execution', desc: 'Turnkey construction of single-family homes, duplexes, apartments, and residential compounds.' },
      { name: 'Commercial building construction', slug: 'commercial-building-construction', categoryGroup: 'Building Execution', desc: 'Construction of office complexes, retail plazas, hospitality units, and mixed-use commercial structures.' },
      { name: 'Industrial building construction', slug: 'industrial-building-construction', categoryGroup: 'Building Execution', desc: 'Portal-frame warehouses, processing halls, workshops, and heavy-floor industrial buildings.' },
      { name: 'Building renovation and rehabilitation', slug: 'building-renovation-rehabilitation', categoryGroup: 'Upgrades & Finishes', desc: 'Structural modernization, waterproofing, MEP upgrades, and rehabilitation of existing properties.' },
      { name: 'Building extensions', slug: 'building-extensions', categoryGroup: 'Upgrades & Finishes', desc: 'Horizontal wing additions and structural vertical storey extensions subject to engineering load verification.' },
      { name: 'Roofing', slug: 'roofing', categoryGroup: 'Upgrades & Finishes', desc: 'Structural roof trusses, aluminium/metal sheets, tile roofing, flashing, and weatherproofing installations.' },
      { name: 'Masonry', slug: 'masonry', categoryGroup: 'Structural & Finishing Trades', desc: 'Reinforced blockwork, structural stonework, partitioning, and load-bearing wall execution.' },
      { name: 'Tiling', slug: 'tiling', categoryGroup: 'Structural & Finishing Trades', desc: 'Interior porcelain, ceramic, natural stone floor tiling, wall cladding, and wet-area waterproofing.' },
      { name: 'Plastering', slug: 'plastering', categoryGroup: 'Structural & Finishing Trades', desc: 'Internal and external cement rendering, smooth skimming, and anti-damp wall preparation.' },
      { name: 'Painting and finishing', slug: 'painting-and-finishing', categoryGroup: 'Structural & Finishing Trades', desc: 'Protective exterior facade coatings, interior architectural painting, ceilings, and final fit-out.' },
      { name: 'Building maintenance and repairs', slug: 'building-maintenance-repairs', categoryGroup: 'Lifecycle Support', desc: 'Preventive facility upkeep, leak remediation, crack repairs, and cyclical building maintenance.' },
      { name: 'Construction project coordination', slug: 'construction-project-coordination', categoryGroup: 'Management & Oversight', desc: 'End-to-end trade scheduling, material mobilization, progress reporting, and site logistics coordination.' },
      { name: 'Construction supervision through qualified professionals', slug: 'construction-supervision-qualified-professionals', categoryGroup: 'Management & Oversight', desc: 'Independent site technical inspection and compliance oversight performed strictly by qualified engineers and supervisors.' },
    ],
  },
  {
    code: 'DIV-02',
    slug: 'civil-engineering-infrastructure',
    name: 'B. Civil Engineering and Infrastructure',
    category: 'Civil Engineering',
    imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1000&q=80',
    summary:
      'Roads, drainage systems, culverts, foundations, structural works, water supply, sanitation infrastructure, bulk earthworks, site preparation, and infrastructure planning.',
    fullDescription:
      'Engineered civil infrastructure services supporting urban estates, industrial parks, commercial sites, and community infrastructure with drainage protection, roadworks, structural foundations, and water/sanitation networks.',
    investmentInfo: 'Available for public-private infrastructure co-development, estate access road partnerships, and municipal civil subcontracts.',
    complianceDisclaimer: 'Regulated structural and civil engineering designs and certifications are delivered strictly through qualified and authorised engineers.',
    operationalStatus: 'UNDER_DEVELOPMENT',
    publishStatus: 'PUBLISHED',
    country: 'Republic of Cameroon',
    operatingCountries: ['Republic of Cameroon'],
    currency: 'XAF',
    regulatoryBody: 'MINTP / Ordre National des Ingénieurs de Génie Civil (ONIGC)',
    licenceRequired: true,
    licenceStatus: 'NOT_APPLIED',
    displayOrder: 2,
    services: [
      { name: 'Road construction', slug: 'road-construction', categoryGroup: 'Transport & Access', desc: 'Access roads, estate road networks, sub-base stabilization, asphalt, and interlocking paver carriageways.' },
      { name: 'Drainage systems', slug: 'drainage-systems', categoryGroup: 'Water & Stormwater', desc: 'Reinforced concrete stormwater channels, perimeter open/covered drains, and flood mitigation.' },
      { name: 'Culverts', slug: 'culverts', categoryGroup: 'Water & Stormwater', desc: 'Box culverts, pipe culverts, headwalls, and watercourse crossing structures.' },
      { name: 'Foundations', slug: 'foundations', categoryGroup: 'Geotechnical & Structural', desc: 'Shallow pad footings, strip footings, raft slabs, and deep foundation coordination.' },
      { name: 'Structural works', slug: 'structural-works', categoryGroup: 'Geotechnical & Structural', desc: 'Reinforced concrete retaining walls, frames, bridges, and load-bearing civil structures.' },
      { name: 'Water supply infrastructure', slug: 'water-supply-infrastructure', categoryGroup: 'Utilities & Sanitation', desc: 'Borehole civil housing, elevated storage tower foundations, and potable water distribution trenching.' },
      { name: 'Sanitation infrastructure', slug: 'sanitation-infrastructure', categoryGroup: 'Utilities & Sanitation', desc: 'Septic treatment systems, soakaways, wastewater piping networks, and sanitary civil works.' },
      { name: 'Earthworks', slug: 'earthworks', categoryGroup: 'Ground Engineering', desc: 'Cut-and-fill excavation, soil compaction, terracing, and hillside slope stabilization.' },
      { name: 'Site preparation', slug: 'site-preparation', categoryGroup: 'Ground Engineering', desc: 'Land clearing, leveling, boundary setting-out, and heavy equipment staging prior to construction.' },
      { name: 'Infrastructure rehabilitation', slug: 'infrastructure-rehabilitation', categoryGroup: 'Lifecycle & Planning', desc: 'Repair and structural upgrading of deteriorated roads, culverts, drains, and civil utilities.' },
      { name: 'Infrastructure project planning', slug: 'infrastructure-project-planning', categoryGroup: 'Lifecycle & Planning', desc: 'Technical scoping, phasing schedules, BOQ inputs, and civil infrastructure feasibility coordination.' },
    ],
  },
  {
    code: 'DIV-03',
    slug: 'real-estate-property-development',
    name: 'C. Real Estate and Property Development',
    category: 'Real Estate',
    imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1000&q=80',
    summary:
      'Residential & commercial property development, land planning, real estate investment joint ventures, feasibility studies, and property management coordination.',
    fullDescription:
      'One of MADECC Group’s flagship strategic pillars in Cameroon—encompassing residential housing estates, apartments, commercial plazas, mixed-use centres, land development coordination, investment packaging, and property administration.',
    investmentInfo:
      'Open to Joint Venture (JV) real estate co-development, diaspora residential equity partnerships, commercial plaza co-investment, and land-owner development structures in Cameroon.',
    complianceDisclaimer:
      'Only offer regulated property services through properly authorised professionals. Proposed developments and conceptual architectural renders are clearly labelled and never presented as completed properties.',
    operationalStatus: 'SEEKING_INVESTMENT',
    publishStatus: 'PUBLISHED',
    country: 'Republic of Cameroon',
    operatingCountries: ['Republic of Cameroon', 'Ghana (Investor Origination)'],
    currency: 'XAF',
    regulatoryBody: 'MINDCAF (Land Title Verification) / MINHDU',
    licenceRequired: true,
    licenceStatus: 'NOT_APPLIED',
    displayOrder: 3,
    services: [
      // Residential properties
      { name: 'Residential apartments', slug: 'residential-apartments', categoryGroup: 'Residential properties', desc: 'Multi-unit modern residential apartment blocks tailored for urban families and working professionals.' },
      { name: 'Luxury apartments', slug: 'luxury-apartments', categoryGroup: 'Residential properties', desc: 'High-specification executive apartments featuring premium finishes, security, and backup utilities.' },
      { name: 'Affordable housing', slug: 'affordable-housing', categoryGroup: 'Residential properties', desc: 'Cost-engineered starter homes and multi-family housing designed for accessible urban homeownership.' },
      { name: 'Detached houses', slug: 'detached-houses', categoryGroup: 'Residential properties', desc: 'Private standalone family residences with landscaped compounds and perimeter security.' },
      { name: 'Duplexes', slug: 'duplexes', categoryGroup: 'Residential properties', desc: 'Contemporary two-storey and semi-detached duplex residences across Yaoundé and Douala corridors.' },
      { name: 'Residential estates', slug: 'residential-estates', categoryGroup: 'Residential properties', desc: 'Master-planned housing clusters with shared road access, drainage, and community utilities.' },
      { name: 'Gated communities', slug: 'gated-communities', categoryGroup: 'Residential properties', desc: 'Secure access-controlled residential developments with integrated infrastructure planning.' },
      { name: 'Student accommodation', slug: 'student-accommodation', categoryGroup: 'Residential properties', desc: 'Purpose-built student hostels and campus housing near major Cameroonian university hubs.' },
      { name: 'Rental housing projects', slug: 'rental-housing-projects', categoryGroup: 'Residential properties', desc: 'Yield-focused multi-unit residential rental developments built for long-term cashflow.' },
      // Commercial properties
      { name: 'Shopping complexes', slug: 'shopping-complexes', categoryGroup: 'Commercial properties', desc: 'Multi-tenant retail shopping centres with customer parking and commercial loading access.' },
      { name: 'Office buildings', slug: 'office-buildings', categoryGroup: 'Commercial properties', desc: 'Modern corporate office buildings engineered for flexible commercial floor plates.' },
      { name: 'Commercial plazas', slug: 'commercial-plazas', categoryGroup: 'Commercial properties', desc: 'High-visibility street-facing commercial plazas for retail, banking, and professional services.' },
      { name: 'Retail buildings', slug: 'retail-buildings', categoryGroup: 'Commercial properties', desc: 'Showrooms, supermarkets, and standalone commercial retail outlets.' },
      { name: 'Mixed-use developments', slug: 'mixed-use-developments', categoryGroup: 'Commercial properties', desc: 'Integrated buildings combining ground-floor commercial retail with upper-level offices or residences.' },
      { name: 'Warehouses', slug: 'real-estate-warehouses', categoryGroup: 'Commercial properties', desc: 'Investment-grade storage warehouses and logistics depot real estate.' },
      { name: 'Business centres', slug: 'business-centres', categoryGroup: 'Commercial properties', desc: 'Serviced corporate business hubs, coworking floors, and enterprise suite buildings.' },
      // Land and property development
      { name: 'Land development planning', slug: 'land-development-planning', categoryGroup: 'Land and property development', desc: 'Subdivision layout scoping, infrastructure integration, and phased plot development planning.' },
      { name: 'Land acquisition project coordination', slug: 'land-acquisition-project-coordination', categoryGroup: 'Land and property development', desc: 'Coordinating site inspections and due-diligence referrals strictly alongside accredited notaries and surveyors.' },
      { name: 'Property development', slug: 'property-development', categoryGroup: 'Land and property development', desc: 'End-to-end real estate concept-to-construction coordination for residential and commercial sites.' },
      { name: 'Property renovation', slug: 'property-renovation', categoryGroup: 'Land and property development', desc: 'Value-enhancing interior and facade remodeling of existing real estate assets.' },
      { name: 'Property rehabilitation', slug: 'property-rehabilitation', categoryGroup: 'Land and property development', desc: 'Structural turnaround and restoration of aging or distressed building stock.' },
      { name: 'Property maintenance', slug: 'property-maintenance', categoryGroup: 'Land and property development', desc: 'Ongoing technical upkeep protecting long-term building quality and asset value.' },
      { name: 'Property management coordination', slug: 'property-management-coordination', categoryGroup: 'Land and property development', desc: 'Coordinating estate upkeep, contractor schedules, and asset operations with authorised specialists.' },
      // Real estate investment
      { name: 'Real estate investment opportunities', slug: 'real-estate-investment-opportunities', categoryGroup: 'Real estate investment', desc: 'Curated, transparent property development opportunities in Cameroon for local and diaspora partners.', investmentInfo: 'Exploratory equity & JV structuring available upon NDA and KYC review.' },
      { name: 'Joint venture projects', slug: 'joint-venture-projects', categoryGroup: 'Real estate investment', desc: 'Landowner + developer/investor joint-venture structuring frameworks for urban plots.' },
      { name: 'Residential development partnerships', slug: 'residential-development-partnerships', categoryGroup: 'Real estate investment', desc: 'Co-investment partnerships for apartments, duplexes, and residential estates.' },
      { name: 'Commercial development partnerships', slug: 'commercial-development-partnerships', categoryGroup: 'Real estate investment', desc: 'Strategic capital partnerships for retail plazas, business centres, and mixed-use buildings.' },
      { name: 'Property investment proposals', slug: 'property-investment-proposals', categoryGroup: 'Real estate investment', desc: 'Structured investment memorandums outlining project scope, costing, and execution phases.' },
      { name: 'Feasibility studies', slug: 'real-estate-feasibility-studies', categoryGroup: 'Real estate investment', desc: 'Technical, engineering cost, and preliminary yield viability studies prior to capital commitment.' },
      { name: 'Investor presentations', slug: 'real-estate-investor-presentations', categoryGroup: 'Real estate investment', desc: 'Clear data-backed project briefings and phased budget models for prospective partners.' },
      { name: 'Development cost estimation', slug: 'development-cost-estimation', categoryGroup: 'Real estate investment', desc: 'Detailed XAF/USD construction budget modeling grounded in live Cameroon unit rates.' },
      { name: 'Project coordination', slug: 'real-estate-project-coordination', categoryGroup: 'Real estate investment', desc: 'Cross-disciplinary synchronization of surveyors, architects, engineers, and contractors.' },
      // Property management
      { name: 'Rental property administration', slug: 'rental-property-administration', categoryGroup: 'Property management', desc: 'Coordinated administration of lease schedules and property upkeep through authorised professionals.' },
      { name: 'Property marketing', slug: 'property-marketing', categoryGroup: 'Property management', desc: 'Digital showcases, project brochures, and transparent buyer/tenant outreach campaigns.' },
      { name: 'Property sales support', slug: 'property-sales-support', categoryGroup: 'Property management', desc: 'Technical documentation support and buyer walkthrough coordination alongside authorised legal professionals.' },
      { name: 'Tenant management coordination', slug: 'tenant-management-coordination', categoryGroup: 'Property management', desc: 'Structured onboarding, inspection logs, and service-request coordination for developed properties.' },
      { name: 'Property maintenance coordination', slug: 'property-maintenance-coordination', categoryGroup: 'Property management', desc: 'Planned preventive maintenance and rapid technical repairs for residential and commercial units.' },
    ],
  },
  {
    code: 'DIV-04',
    slug: 'pharmaceuticals-healthcare-business',
    name: 'D. Pharmaceuticals and Healthcare',
    category: 'Pharmaceuticals & Healthcare',
    imageUrl: 'https://images.unsplash.com/photo-1587854692152-cbe660dbde88?auto=format&fit=crop&w=1000&q=80',
    summary:
      'Proposed pharmaceutical business development, pharmacy construction & feasibility, medical equipment & supplies, and healthcare facility infrastructure—strictly contingent on statutory licensing.',
    fullDescription:
      'Planned healthcare and pharmaceutical opportunity division exploring compliant healthcare infrastructure construction, medical equipment sourcing concepts, and regulated wholesale/pharmacy partnership models strictly under MINSANTE, DPML, and ONPC oversight.',
    investmentInfo:
      'Seeking strategic partnerships with licensed pharmacists, medical supply manufacturers, and healthcare operators for regulated Cameroonian and cross-border expansion.',
    complianceDisclaimer:
      'IMPORTANT NOTICE: MADECC Group is NOT a licensed pharmacy or pharmaceutical distributor. Unlicensed medicine sales or dispensing are strictly prohibited. All regulated pharmaceutical operations remain inactive pending MINSANTE / DPML / ONPC statutory authorization and qualified pharmacist supervision.',
    operationalStatus: 'AWAITING_REGULATORY_APPROVAL',
    publishStatus: 'PUBLISHED',
    country: 'Republic of Cameroon',
    operatingCountries: ['Republic of Cameroon'],
    currency: 'XAF',
    regulatoryBody: 'MINSANTE / DPML (Direction de la Pharmacie, du Médicament et des Laboratoires) / ONPC',
    licenceRequired: true,
    licenceStatus: 'NOT_APPLIED',
    displayOrder: 4,
    services: [
      // Pharmaceutical business opportunities
      { name: 'Pharmaceutical wholesale business development', slug: 'pharmaceutical-wholesale-business-development', categoryGroup: 'Pharmaceutical business opportunities', desc: 'Proposed wholesale venture structuring strictly subject to MINSANTE/DPML authorization and licensed pharmacist leadership.' },
      { name: 'Pharmaceutical distribution partnerships', slug: 'pharmaceutical-distribution-partnerships', categoryGroup: 'Pharmaceutical business opportunities', desc: 'Exploratory partnerships connecting international manufacturers with duly licensed Cameroonian distributors.' },
      { name: 'Medicine supply-chain development', slug: 'medicine-supply-chain-development', categoryGroup: 'Pharmaceutical business opportunities', desc: 'Cold-chain and compliant medical supply-chain feasibility studies under statutory guidelines.' },
      { name: 'Pharmaceutical procurement', slug: 'pharmaceutical-procurement', categoryGroup: 'Pharmaceutical business opportunities', desc: 'Procurement coordination concept supporting authorised institutions once statutory prerequisites are satisfied.' },
      { name: 'Pharmaceutical warehousing', slug: 'pharmaceutical-warehousing', categoryGroup: 'Pharmaceutical business opportunities', desc: 'Design and build planning for temperature-controlled Good Distribution Practice (GDP) storage facilities.' },
      { name: 'Pharmaceutical logistics', slug: 'pharmaceutical-logistics', categoryGroup: 'Pharmaceutical business opportunities', desc: 'Supply-chain logistics scoping exclusively through authorised and licensed operators.' },
      // Pharmacy development
      { name: 'Pharmacy investment proposals', slug: 'pharmacy-investment-proposals', categoryGroup: 'Pharmacy development', desc: 'Capital structuring proposals for compliant pharmacy ventures led by registered pharmacists.' },
      { name: 'Pharmacy construction and development', slug: 'pharmacy-construction-development', categoryGroup: 'Pharmacy development', desc: 'Civil construction, dispensary joinery, HVAC, and compliant interior fit-out for licensed pharmacy premises.' },
      { name: 'Pharmacy business feasibility studies', slug: 'pharmacy-business-feasibility-studies', categoryGroup: 'Pharmacy development', desc: 'Location assessment, setup CAPEX estimation, and regulatory milestone roadmaps.' },
      { name: 'Pharmacy partnership opportunities', slug: 'pharmacy-partnership-opportunities', categoryGroup: 'Pharmacy development', desc: 'Joint development frameworks pairing capital partners with authorised pharmacy practitioners.' },
      { name: 'Pharmacy chain development proposals', slug: 'pharmacy-chain-development-proposals', categoryGroup: 'Pharmacy development', desc: 'Multi-site healthcare retail rollout planning strictly aligned with ONPC/MINSANTE regulations.' },
      // Medical supplies
      { name: 'Medical consumables', slug: 'medical-consumables', categoryGroup: 'Medical supplies', desc: 'Proposed sourcing and healthcare facility procurement support for certified clinical consumables.' },
      { name: 'Hospital supplies', slug: 'hospital-supplies', categoryGroup: 'Medical supplies', desc: 'Proposed ward furnishings, sanitation supplies, and institutional hospital non-drug consumables.' },
      { name: 'Medical equipment', slug: 'medical-equipment', categoryGroup: 'Medical supplies', desc: 'Proposed clinical equipment procurement coordination and facility commissioning support.' },
      { name: 'Laboratory equipment', slug: 'laboratory-equipment', categoryGroup: 'Medical supplies', desc: 'Facility readiness and proposed equipment sourcing partnerships for diagnostic laboratories.' },
      { name: 'Diagnostic equipment', slug: 'diagnostic-equipment', categoryGroup: 'Medical supplies', desc: 'Imaging, screening, and diagnostic unit procurement partnerships with accredited OEMs.' },
      { name: 'Healthcare facility supplies', slug: 'healthcare-facility-supplies', categoryGroup: 'Medical supplies', desc: 'Comprehensive operational outfitting concepts for new and renovated medical clinics.' },
      // Healthcare infrastructure
      { name: 'Hospital construction', slug: 'hospital-construction', categoryGroup: 'Healthcare infrastructure', desc: 'Specialized design-build construction of hospitals, surgical suites, and inpatient facilities.' },
      { name: 'Clinic construction', slug: 'clinic-construction', categoryGroup: 'Healthcare infrastructure', desc: 'Turnkey construction of outpatient clinics, maternal health units, and specialist medical centres.' },
      { name: 'Medical laboratory construction', slug: 'medical-laboratory-construction', categoryGroup: 'Healthcare infrastructure', desc: 'Clean-room finishes, bio-safety layouts, and technical MEP construction for diagnostic labs.' },
      { name: 'Healthcare facility renovation', slug: 'healthcare-facility-renovation', categoryGroup: 'Healthcare infrastructure', desc: 'Hygienic surface upgrades, medical gas pathways, and wing modernization for existing clinics.' },
      { name: 'Medical infrastructure development', slug: 'medical-infrastructure-development', categoryGroup: 'Healthcare infrastructure', desc: 'End-to-end civil and MEP infrastructure development for regional healthcare campuses.' },
    ],
  },
  {
    code: 'DIV-05',
    slug: 'agriculture-agribusiness',
    name: 'E. Agriculture and Agribusiness',
    category: 'Agriculture & Agribusiness',
    imageUrl: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1000&q=80',
    summary:
      'Poultry farming, livestock, fish farming & aquaculture, commercial crop production (plantain, cassava, vegetables, fruits), irrigation, animal feed, and farm infrastructure.',
    fullDescription:
      'Diversified agribusiness initiative combining modern agricultural production concepts with MADECC’s core civil engineering capability to build resilient poultry houses, fish ponds, irrigation networks, and commercial plantations in Cameroon.',
    investmentInfo: 'Seeking agribusiness co-investors, off-take partners, and agricultural mechanization partnerships.',
    operationalStatus: 'PROPOSED',
    publishStatus: 'PUBLISHED',
    country: 'Republic of Cameroon',
    operatingCountries: ['Republic of Cameroon'],
    currency: 'XAF',
    regulatoryBody: 'MINADER / MINEPIA',
    licenceRequired: false,
    licenceStatus: 'NOT_APPLIED',
    displayOrder: 5,
    services: [
      { name: 'Poultry farming', slug: 'poultry-farming', categoryGroup: 'Livestock & Aquaculture', desc: 'Broiler and layer poultry production concepts with bio-secure poultry house design.' },
      { name: 'Livestock production', slug: 'livestock-production', categoryGroup: 'Livestock & Aquaculture', desc: 'Structured commercial livestock farming and veterinary-compliant housing infrastructure.' },
      { name: 'Fish farming', slug: 'fish-farming', categoryGroup: 'Livestock & Aquaculture', desc: 'Earthen pond and concrete tank catfish/tilapia production development.' },
      { name: 'Aquaculture', slug: 'aquaculture', categoryGroup: 'Livestock & Aquaculture', desc: 'Scalable recirculating and pond aquaculture systems for high-protein urban supply.' },
      { name: 'Crop cultivation', slug: 'crop-cultivation', categoryGroup: 'Crop Production', desc: 'Structured arable crop cultivation programs across fertile Cameroonian agro-ecological zones.' },
      { name: 'Commercial farming', slug: 'commercial-farming', categoryGroup: 'Crop Production', desc: 'Large-scale mechanized and semi-mechanized commercial farm enterprise development.' },
      { name: 'Vegetable production', slug: 'vegetable-production', categoryGroup: 'Crop Production', desc: 'Open-field and greenhouse market-garden vegetable production concepts.' },
      { name: 'Fruit production', slug: 'fruit-production', categoryGroup: 'Crop Production', desc: 'Orchard establishment for high-demand tropical fruits supporting fresh markets and juicing.' },
      { name: 'Plantain cultivation', slug: 'plantain-cultivation', categoryGroup: 'Crop Production', desc: 'Commercial plantain plantation scoping using high-yield tissue-culture suckers.' },
      { name: 'Cassava production', slug: 'cassava-production', categoryGroup: 'Crop Production', desc: 'High-starch commercial cassava cultivation feeding flour and agro-processing value chains.' },
      { name: 'Irrigation projects', slug: 'irrigation-projects', categoryGroup: 'Farm Engineering', desc: 'Drip irrigation, sprinkler systems, agricultural boreholes, and water retention basins.' },
      { name: 'Animal feed production', slug: 'animal-feed-production', categoryGroup: 'Farm Inputs', desc: 'Formulated poultry, fish, and livestock feed mill development concepts.' },
      { name: 'Farm infrastructure development', slug: 'farm-infrastructure-development', categoryGroup: 'Farm Engineering', desc: 'Construction of barns, poultry sheds, farm access roads, storage silos, and worker quarters.' },
    ],
  },
  {
    code: 'DIV-06',
    slug: 'agro-processing-food-manufacturing',
    name: 'F. Agro-processing and Food Manufacturing',
    category: 'Agro-Processing',
    imageUrl: 'https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?auto=format&fit=crop&w=1000&q=80',
    summary:
      'Cassava processing & flour production, palm oil processing, rice milling, food packaging, fruit juice & beverage production, storage, and processing facilities.',
    fullDescription:
      'Post-harvest industrial value-addition division connecting Cameroonian agricultural output with hygienically designed processing facilities, milling lines, bottling operations, and ANOR-aligned packaging partnerships.',
    investmentInfo: 'Seeking industrial food-machinery partners and agro-industrial plant co-investors.',
    complianceDisclaimer: 'Food manufacturing operations require ANOR standards certification and MINEPIA/MINMIDT plant clearance before commercial launch.',
    operationalStatus: 'PROPOSED',
    publishStatus: 'PUBLISHED',
    country: 'Republic of Cameroon',
    operatingCountries: ['Republic of Cameroon'],
    currency: 'XAF',
    regulatoryBody: 'MINMIDT / ANOR (Standards & Quality Agency)',
    licenceRequired: true,
    licenceStatus: 'NOT_APPLIED',
    displayOrder: 6,
    services: [
      { name: 'Cassava processing', slug: 'cassava-processing', categoryGroup: 'Crop Value Addition', desc: 'Mechanized peeling, grating, pressing, and drying lines for commercial cassava transformation.' },
      { name: 'Cassava flour production', slug: 'cassava-flour-production', categoryGroup: 'Crop Value Addition', desc: 'High-quality food-grade cassava flour milling concepts for bakeries and households.' },
      { name: 'Palm oil processing', slug: 'palm-oil-processing', categoryGroup: 'Oil & Grain Milling', desc: 'Small-to-medium industrial oil palm extraction and clarification facility development.' },
      { name: 'Rice milling', slug: 'rice-milling', categoryGroup: 'Oil & Grain Milling', desc: 'Destoning, hulling, polishing, and grading lines for domestic Cameroonian rice.' },
      { name: 'Food packaging', slug: 'food-packaging', categoryGroup: 'Packaging & Beverages', desc: 'Hygienic sealed retail & bulk food packaging solutions extending shelf life.' },
      { name: 'Fruit juice production', slug: 'fruit-juice-production', categoryGroup: 'Packaging & Beverages', desc: 'Natural tropical fruit extraction, pasteurization, and bottling plant development.' },
      { name: 'Beverage production', slug: 'beverage-production', categoryGroup: 'Packaging & Beverages', desc: 'Bottled beverage facility planning and bottling line partnership scoping.' },
      { name: 'Agricultural product storage', slug: 'agricultural-product-storage', categoryGroup: 'Facilities & Logistics', desc: 'Ventilated grain stores, climate-managed warehouses, and post-harvest crop preservation.' },
      { name: 'Food processing facilities', slug: 'food-processing-facilities', categoryGroup: 'Facilities & Logistics', desc: 'Civil construction of food-safe epoxy-floored factories compliant with hygiene zoning.' },
      { name: 'Food distribution partnerships', slug: 'food-distribution-partnerships', categoryGroup: 'Facilities & Logistics', desc: 'Wholesale market distribution frameworks linking processing plants to urban retailers.' },
    ],
  },
  {
    code: 'DIV-07',
    slug: 'warehousing-logistics-distribution',
    name: 'G. Logistics, Warehousing and Supply Chain',
    category: 'Logistics & Warehousing',
    imageUrl: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1000&q=80',
    summary:
      'General warehousing, commercial distribution, construction & agricultural logistics, authorised-operator pharma logistics, inventory management, procurement, and cold storage.',
    fullDescription:
      'Integrated logistics, warehousing, and procurement infrastructure supporting construction sites, commercial trade, agricultural off-take, cold storage, and authorised-operator healthcare supply corridors.',
    investmentInfo: 'Open to logistics hub real estate partnerships and fleet/cold-chain infrastructure investment.',
    complianceDisclaimer: 'Pharmaceutical logistics are conducted strictly through duly authorised and licensed operators.',
    operationalStatus: 'PROPOSED',
    publishStatus: 'PUBLISHED',
    country: 'Republic of Cameroon',
    operatingCountries: ['Republic of Cameroon'],
    currency: 'XAF',
    regulatoryBody: 'MINT (Ministry of Transport) / Port & Customs Authorities',
    licenceRequired: true,
    licenceStatus: 'NOT_APPLIED',
    displayOrder: 7,
    services: [
      { name: 'General warehousing', slug: 'general-warehousing', categoryGroup: 'Storage & Depots', desc: 'Secure commercial palletized and bulk warehousing storage hubs.' },
      { name: 'Commercial distribution', slug: 'commercial-distribution', categoryGroup: 'Distribution & Transport', desc: 'Regional last-mile and wholesale commercial goods distribution coordination.' },
      { name: 'Transport coordination', slug: 'transport-coordination', categoryGroup: 'Distribution & Transport', desc: 'Inter-city freight scheduling between Douala/Kribi ports and inland hubs like Yaoundé.' },
      { name: 'Construction materials logistics', slug: 'construction-materials-logistics', categoryGroup: 'Sector Logistics', desc: 'Scheduled site haulage of cement, rebar, aggregates, timber, and prefabricated elements.' },
      { name: 'Agricultural logistics', slug: 'agricultural-logistics', categoryGroup: 'Sector Logistics', desc: 'Farm-to-market harvest collection and post-harvest bulk transport coordination.' },
      { name: 'Pharmaceutical logistics through authorised operators', slug: 'pharmaceutical-logistics-authorised-operators', categoryGroup: 'Sector Logistics', desc: 'Coordinated medical supply transport executed exclusively via statutory-licensed operators.' },
      { name: 'Inventory management', slug: 'inventory-management', categoryGroup: 'Supply Chain Operations', desc: 'Digital stock tracking, batch control, and warehouse stock-level auditing.' },
      { name: 'Procurement', slug: 'logistics-procurement', categoryGroup: 'Supply Chain Operations', desc: 'Direct supplier sourcing, vendor qualification, and bulk purchase consolidation.' },
      { name: 'Supply-chain development', slug: 'supply-chain-development', categoryGroup: 'Supply Chain Operations', desc: 'Designing resilient end-to-end sourcing and fulfillment corridors across Central/West Africa.' },
      { name: 'Distribution centres', slug: 'distribution-centres', categoryGroup: 'Storage & Depots', desc: 'Design-build and operation planning for multi-bay cross-docking distribution hubs.' },
      { name: 'Cold-storage facilities', slug: 'cold-storage-facilities', categoryGroup: 'Storage & Depots', desc: 'Temperature-controlled cold rooms for perishable agricultural produce and food products.' },
    ],
  },
  {
    code: 'DIV-08',
    slug: 'renewable-energy-solar-solutions',
    name: 'H. Renewable Energy and Solar Solutions',
    category: 'Renewable Energy',
    imageUrl: 'https://images.unsplash.com/photo-1509391366360-2e959784a276?auto=format&fit=crop&w=1000&q=80',
    summary:
      'Residential & commercial solar systems, solar street lighting, battery storage, backup power, solar-powered cold rooms, project development, and energy efficiency.',
    fullDescription:
      'Clean-energy engineering division integrating reliable solar PV, lithium/gel battery energy storage, hybrid backup systems, street lighting, and solar-powered cold rooms directly into residential estates, commercial sites, clinics, and farms.',
    investmentInfo: 'Available for off-grid estate solar microgrid partnerships and commercial clean-energy deployment.',
    operationalStatus: 'UNDER_DEVELOPMENT',
    publishStatus: 'PUBLISHED',
    country: 'Republic of Cameroon',
    operatingCountries: ['Republic of Cameroon'],
    currency: 'XAF',
    regulatoryBody: 'MINEE / ARSEL',
    licenceRequired: false,
    licenceStatus: 'NOT_APPLIED',
    displayOrder: 8,
    services: [
      { name: 'Residential solar systems', slug: 'residential-solar-systems', categoryGroup: 'Solar PV Systems', desc: 'Rooftop hybrid solar PV kits eliminating blackouts for homes, duplexes, and apartments.' },
      { name: 'Commercial solar installations', slug: 'commercial-solar-installations', categoryGroup: 'Solar PV Systems', desc: 'High-capacity commercial solar arrays reducing diesel generator dependency for offices and plazas.' },
      { name: 'Solar street lighting', slug: 'solar-street-lighting', categoryGroup: 'Public & Estate Energy', desc: 'Autonomous LED solar street lighting poles for gated communities, roads, and campuses.' },
      { name: 'Solar energy storage', slug: 'solar-energy-storage', categoryGroup: 'Storage & Backup', desc: 'Lithium-ion (LiFePO4) and industrial battery banks engineered for overnight power autonomy.' },
      { name: 'Backup power systems', slug: 'backup-power-systems', categoryGroup: 'Storage & Backup', desc: 'Hybrid inverter-charger and automatic transfer backup systems for critical building loads.' },
      { name: 'Solar-powered cold rooms', slug: 'solar-powered-cold-rooms', categoryGroup: 'Agro & Cold Chain Energy', desc: 'Off-grid solar refrigeration units preserving harvests, dairy, fish, and vaccines.' },
      { name: 'Renewable energy project development', slug: 'renewable-energy-project-development', categoryGroup: 'Advisory & Engineering', desc: 'Load auditing, PV array sizing, ROI modeling, and mini-grid feasibility development.' },
      { name: 'Energy-efficiency solutions', slug: 'energy-efficiency-solutions', categoryGroup: 'Advisory & Engineering', desc: 'Passive solar orientation, LED retrofits, and power-factor optimization for lower consumption.' },
    ],
  },
  {
    code: 'DIV-09',
    slug: 'building-materials-manufacturing',
    name: 'I. Building Materials and Industrial Manufacturing',
    category: 'Building Materials',
    imageUrl: 'https://images.unsplash.com/photo-1565008447742-97f6f38c985c?auto=format&fit=crop&w=1000&q=80',
    summary:
      'Concrete blocks, paving stones, precast concrete products, construction materials supply, metal & aluminium fabrication, doors/windows, manufacturing & industrial partnerships.',
    fullDescription:
      'Industrial manufacturing and construction supply division delivering quality-controlled masonry blocks, interlock pavers, precast concrete elements, custom metalwork, aluminium doors/windows, and strategic manufacturing joint ventures.',
    investmentInfo: 'Seeking industrial block-plant equipment financing, aluminium extrusion partners, and manufacturing JV collaborators.',
    operationalStatus: 'PROPOSED',
    publishStatus: 'PUBLISHED',
    country: 'Republic of Cameroon',
    operatingCountries: ['Republic of Cameroon'],
    currency: 'XAF',
    regulatoryBody: 'MINMIDT / MINEPDED / ANOR',
    licenceRequired: true,
    licenceStatus: 'NOT_APPLIED',
    displayOrder: 9,
    services: [
      { name: 'Concrete blocks', slug: 'concrete-blocks', categoryGroup: 'Concrete & Precast', desc: 'High-strength vibrated hollow and solid masonry blocks produced to strict compression standards.' },
      { name: 'Paving stones', slug: 'paving-stones', categoryGroup: 'Concrete & Precast', desc: 'Heavy-duty interlocking concrete pavers for driveways, estates, and commercial courtyards.' },
      { name: 'Precast concrete products', slug: 'precast-concrete-products', categoryGroup: 'Concrete & Precast', desc: 'Kerbstones, precast lintels, drainage covers, fence posts, and modular concrete elements.' },
      { name: 'Construction materials supply', slug: 'construction-materials-supply', categoryGroup: 'Supply & Trade', desc: 'Verified project supply of cement, steel reinforcement, aggregates, timber, and finishing materials.' },
      { name: 'Metal fabrication', slug: 'metal-fabrication', categoryGroup: 'Metal & Fenestration', desc: 'Custom steel trusses, security gates, staircases, balustrades, and structural steelwork.' },
      { name: 'Doors and windows', slug: 'doors-and-windows', categoryGroup: 'Metal & Fenestration', desc: 'Supply and installation of architectural security doors, timber doors, and glazed window units.' },
      { name: 'Aluminium fabrication', slug: 'aluminium-fabrication', categoryGroup: 'Metal & Fenestration', desc: 'Custom powder-coated aluminium sliding windows, curtain walling, and commercial shopfronts.' },
      { name: 'Building materials manufacturing', slug: 'building-materials-manufacturing', categoryGroup: 'Industrial Ventures', desc: 'Backward-integrated local production units reducing import reliance on core building inputs.' },
      { name: 'Industrial development partnerships', slug: 'industrial-development-partnerships', categoryGroup: 'Industrial Ventures', desc: 'Joint-venture factory setup and technology transfer with international equipment manufacturers.' },
    ],
  },
  {
    code: 'DIV-10',
    slug: 'consultancy-procurement-project-development',
    name: 'J. Consultancy, Procurement and Project Development',
    category: 'Consultancy & Project Development',
    imageUrl: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1000&q=80',
    summary:
      'Feasibility coordination, cost estimation, BOQ preparation, project planning, construction documentation, procurement, supplier sourcing, investment & business development.',
    fullDescription:
      'Strategic advisory and commercial structuring division bridging technical engineering documentation (BOQs, cost estimates, planning schedules) with procurement coordination, business development, and investor-ready project structuring.',
    investmentInfo: 'Advisory mandates available for diaspora developers, international investors entering Cameroon, and institutional project sponsors.',
    complianceDisclaimer:
      'Only provide regulated professional services through appropriately qualified and authorised professionals.',
    operationalStatus: 'UNDER_DEVELOPMENT',
    publishStatus: 'PUBLISHED',
    country: 'Republic of Cameroon',
    operatingCountries: ['Republic of Cameroon', 'West & Central Africa'],
    currency: 'XAF',
    regulatoryBody: 'Qualified Engineers, Quantity Surveyors & Authorised Legal Professionals',
    licenceRequired: false,
    licenceStatus: 'NOT_REQUIRED',
    displayOrder: 10,
    services: [
      { name: 'Project feasibility coordination', slug: 'project-feasibility-coordination', categoryGroup: 'Technical & Cost Advisory', desc: 'Multi-disciplinary site, technical, and financial viability studies for capital projects.' },
      { name: 'Construction cost estimation', slug: 'construction-cost-estimation', categoryGroup: 'Technical & Cost Advisory', desc: 'Transparent XAF & USD material, labour, and equipment cost budgeting.' },
      { name: 'Bill of Quantities (BOQ) preparation', slug: 'boq-preparation', categoryGroup: 'Technical & Cost Advisory', desc: 'Detailed SMM-structured unpriced and priced BOQs for accurate contractor bidding.' },
      { name: 'Project planning', slug: 'project-planning', categoryGroup: 'Technical & Cost Advisory', desc: 'Master critical-path timelines, milestone schedules, and phased cashflow planning.' },
      { name: 'Construction documentation', slug: 'construction-documentation', categoryGroup: 'Technical & Cost Advisory', desc: 'Technical specifications, tender dossiers, site logs, and payment valuation records.' },
      { name: 'Procurement coordination', slug: 'procurement-coordination', categoryGroup: 'Procurement & Sourcing', desc: 'Competitive quotation management, bid comparison matrices, and delivery tracking.' },
      { name: 'Supplier identification', slug: 'supplier-identification', categoryGroup: 'Procurement & Sourcing', desc: 'Vetting domestic and international manufacturers for quality-verified materials and equipment.' },
      { name: 'Investment opportunity identification', slug: 'investment-opportunity-identification', categoryGroup: 'Business & Investment Development', desc: 'Sourcing and pre-screening high-potential real estate, agri, manufacturing, and infrastructure ventures.' },
      { name: 'Project development coordination', slug: 'project-development-coordination', categoryGroup: 'Business & Investment Development', desc: 'End-to-end orchestration from initial concept note through feasibility and partner onboarding.' },
      { name: 'Business development', slug: 'business-development', categoryGroup: 'Business & Investment Development', desc: 'Market-entry structuring and multi-sector commercial growth planning in Cameroon.' },
      { name: 'Partnership facilitation', slug: 'partnership-facilitation', categoryGroup: 'Business & Investment Development', desc: 'Connecting vetted land owners, technical operators, and regional/international investors.' },
      { name: 'Investor presentation preparation', slug: 'investor-presentation-preparation', categoryGroup: 'Business & Investment Development', desc: 'Preparation of transparent project briefs, financial summaries, and executive pitch decks.' },
    ],
  },
];
