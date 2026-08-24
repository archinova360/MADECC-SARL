import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Ruler, 
  Layers, 
  Compass, 
  Calculator, 
  FileCheck, 
  Briefcase, 
  Eye, 
  UserCheck, 
  Hammer, 
  ArrowRight, 
  CheckCircle2, 
  Clock, 
  ShieldCheck, 
  Phone, 
  MessageSquare, 
  Sparkles, 
  ChevronRight, 
  HelpCircle, 
  Download,
  FileText,
  MapPin,
  X
} from 'lucide-react';

interface ServicesProps {
  onNavigateToTab: (tab: string, extraState?: any) => void;
}

export interface ServiceItem {
  id: string;
  slug: string;
  title: string;
  category: string;
  icon: any;
  shortDesc: string;
  overview: string;
  whatWeDeliver: string[];
  typicalProjects: string[];
  deliverables: string[];
  processSteps: { title: string; desc: string }[];
  faqs: { q: string; a: string }[];
  ctaLabel: string;
}

export const SERVICES_DATA: ServiceItem[] = [
  {
    id: 'building-construction',
    slug: 'building-construction',
    title: 'Building Construction',
    category: 'Construction & Execution',
    icon: Building2,
    shortDesc: 'Turn-key construction services from site clearance and foundation works to structural frames, MEP services, roofing, high-end finishing, and handover.',
    overview: 'MADECC Group provides end-to-end building construction services across Cameroon. Our engineering-led construction team manages site safety, quality assurance, material testing, and strict program scheduling for residential, commercial, and industrial facilities.',
    whatWeDeliver: [
      'Substructure & deep foundation engineering',
      'Reinforced concrete structural framing',
      'Quality masonry & blockwork construction',
      'Roofing systems & waterproofing insulation',
      'MEP (Mechanical, Electrical, Plumbing) installation',
      'Architectural interior & exterior finishing',
      'Handover, commissioning, and snagging resolution'
    ],
    typicalProjects: [
      'Residential Homes, Duplexes & Luxury Villas',
      'Multi-Storey Apartment Buildings',
      'Commercial Malls & Retail Plazas',
      'Industrial Warehouses & Factories',
      'Institutional Schools & Healthcare Clinics'
    ],
    deliverables: [
      'Complete physical structure built to structural drawings',
      'Quality test certificates (Concrete crushing, steel tensile)',
      'As-built drawings & warranty documentation',
      'Occupancy-ready building handover'
    ],
    processSteps: [
      { title: 'Site Mobilization', desc: 'Site perimeter setup, safety fencing, temporary utilities, and surveyor grid alignment.' },
      { title: 'Foundations & Earthworks', desc: 'Excavation, soil compaction, blinding, rebar cage placement, and foundation pouring.' },
      { title: 'Structural Frame', desc: 'Erection of columns, beams, floor slabs, and load-bearing walls using quality reinforced concrete.' },
      { title: 'Finishes & MEP Integration', desc: 'Electrical conduits, plumbing runs, plastering, tiling, windows, doors, and painting.' },
      { title: 'Quality Inspection & Handover', desc: 'Rigorous client inspection, MEP testing, clean-up, and key handover.' }
    ],
    faqs: [
      { q: 'Does MADECC Group handle turn-key residential construction?', a: 'Yes. We handle everything from land preparation, structural execution, finishing, to final occupancy certification.' },
      { q: 'What quality standards do you follow for concrete and rebar?', a: 'We strictly adhere to Eurocode / French BAEL standards, testing cement batches and cube compression strengths at accredited labs.' }
    ],
    ctaLabel: 'Request Building Construction Quote'
  },
  {
    id: 'civil-engineering',
    slug: 'civil-engineering',
    title: 'Civil Engineering & Earthworks',
    category: 'Engineering & Infrastructure',
    icon: Layers,
    shortDesc: 'Site preparation, bulk earthworks, drainage infrastructure, access roads, culverts, retaining walls, and civil utility networks.',
    overview: 'Our civil engineering division specializes in ground transformation, heavy earthworks, stormwater drainage, access roads, and retaining structures for complex topographical sites in Cameroon.',
    whatWeDeliver: [
      'Site clearance, grading & bulk earthworks',
      'Stormwater drainage channels & culvert construction',
      'Paved & unpaved access roads and parking lots',
      'Gabion & reinforced concrete retaining walls',
      'Subsurface drainage & erosion control',
      'Civil site utility trenching & pipework'
    ],
    typicalProjects: [
      'Subdivision Infrastructure & Road Networks',
      'Commercial Site Preparation & Terracing',
      'Industrial Logistics Yard Paving',
      'Hillside Retaining Walls & Slope Stabilization'
    ],
    deliverables: [
      'Fully engineered site earthworks and drainage system',
      'Soil compaction & CBR test reports',
      'Access road infrastructure ready for heavy traffic'
    ],
    processSteps: [
      { title: 'Topographical Survey', desc: 'Precise total station surveying to establish cut-and-fill balances.' },
      { title: 'Earthmoving & Grading', desc: 'Heavy excavator and bulldozer clearing, benching, and level grading.' },
      { title: 'Drainage & Retention', desc: 'Constructing reinforced concrete drains, culverts, and retaining walls.' },
      { title: 'Pavement Layer Works', desc: 'Sub-base, base course compaction, and asphalt or interlock stone paving.' }
    ],
    faqs: [
      { q: 'How do you handle difficult hillside terrain in Yaoundé/Bafoussam?', a: 'We engineer custom retaining walls (gabions, cantilever RC walls) and benching protocols to guarantee slope stability.' }
    ],
    ctaLabel: 'Request Civil Engineering Quote'
  },
  {
    id: 'structural-engineering',
    slug: 'structural-engineering',
    title: 'Structural Engineering & Assessment',
    category: 'Engineering & Consultancy',
    icon: Compass,
    shortDesc: 'Structural analysis, reinforced concrete design, steel frame design, foundation engineering, structural retrofitting, and safety audits.',
    overview: 'MADECC structural engineers design safe, economical structural systems for buildings and civil works, while offering independent structural audits for existing buildings facing cracks or load increases.',
    whatWeDeliver: [
      'Structural design for concrete, steel & timber',
      'Foundation design (Shallow pads, rafts, deep piles)',
      'Structural calculation sheets & rebar schedules (BBS)',
      'Structural integrity audits & crack diagnosis',
      'Structural strengthening & carbon fiber/steel retrofitting',
      'Independent structural peer review'
    ],
    typicalProjects: [
      'Multi-Storey Concrete Skeleton Buildings',
      'Long-Span Industrial Steel Hangar Frames',
      'Deep Foundation Pile Cap Engineering',
      'Existing Building Safety Audits'
    ],
    deliverables: [
      'Signed & stamped structural calculation package',
      'Detailed rebar execution drawings & bending schedules',
      'Structural Audit & Safety Certificate'
    ],
    processSteps: [
      { title: 'Load Assessment', desc: 'Calculating dead, live, wind, and seismic design forces.' },
      { title: 'Structural Modeling', desc: 'Computerized FEA simulation for beam/column sizing.' },
      { title: 'Detailing & BBS', desc: 'Producing bar bending schedules for steel fixers on site.' }
    ],
    faqs: [
      { q: 'Why is a structural audit necessary for old buildings?', a: 'An audit confirms structural load capacity before adding extra floors or converting residential properties into commercial offices.' }
    ],
    ctaLabel: 'Request Structural Engineering Service'
  },
  {
    id: 'architectural-design',
    slug: 'architectural-design',
    title: 'Architectural & Space Design',
    category: 'Design & Planning',
    icon: Ruler,
    shortDesc: 'Concept development, floor plans, 3D photorealistic architectural renderings, building permit drawings, and spatial coordination.',
    overview: 'We craft functional, energy-efficient architectural designs adapted to tropical climates, combining natural lighting, optimal space utilization, and striking aesthetic appeal.',
    whatWeDeliver: [
      'Architectural concept floor plans & sections',
      '3D exterior & interior photorealistic visualizations',
      'Urban planning & building permit application packages',
      'Climatic design for passive cooling and natural ventilation',
      'Space planning for residential & corporate interiors'
    ],
    typicalProjects: [
      'Modern Contemporary Family Duplexes',
      'Commercial Retail & Office Developments',
      'Mixed-Use Commercial & Residential Towers'
    ],
    deliverables: [
      'Complete Architectural Working Drawing Set (Scale 1:50 / 1:100)',
      'High-resolution 3D Renderings & 360 Walkthroughs',
      'Permit-ready Municipal Approval File'
    ],
    processSteps: [
      { title: 'Briefing & Site Context', desc: 'Understanding client needs, plot orientation, and setback requirements.' },
      { title: 'Concept Sketches', desc: 'Developing initial floor plan layouts and volumetric forms.' },
      { title: '3D Rendering', desc: 'Applying materials, lighting, and landscaping in 3D.' },
      { title: 'Working Drawings', desc: 'Producing precise dimensioned drawings for site construction.' }
    ],
    faqs: [
      { q: 'Do you help obtain building permits in Yaoundé and Douala?', a: 'Yes, we prepare all required architectural and engineering dossiers formatted specifically for municipal council submissions.' }
    ],
    ctaLabel: 'Start a Design Project'
  },
  {
    id: 'quantity-surveying',
    slug: 'quantity-surveying',
    title: 'Quantity Surveying & Cost Estimation',
    category: 'Cost & Commercial',
    icon: Calculator,
    shortDesc: 'Independent cost planning, quantity take-offs, budget estimation, material schedules, and commercial cost monitoring.',
    overview: 'Quantity surveying is central to MADECC’s core identity. We protect property owners from cost overruns through transparent quantity measurements and real Cameroon market unit rate benchmarking.',
    whatWeDeliver: [
      'Detailed material quantity take-offs',
      'Pre-construction budget forecasting & cost planning',
      'Material & trade labour cost schedule generation',
      'Valuation of completed works & interim payment certs',
      'Value engineering to optimize material expenditure'
    ],
    typicalProjects: [
      'Private Residential Construction Cost Planning',
      'Commercial Development Commercial Audits',
      'Bank & Investor Project Feasibility Reviews'
    ],
    deliverables: [
      'Comprehensive Itemized Cost Estimate Report',
      'Material Breakdown Schedule (Cement bags, Rebar tonnes, Sand m³)',
      'Payment Certificate Recommendations'
    ],
    processSteps: [
      { title: 'Drawing Take-Off', desc: 'Extracting precise material quantities from CAD/PDF drawings.' },
      { title: 'Rate Application', desc: 'Applying current MADECC price index rates for regional materials and trades.' },
      { title: 'Cost Reporting', desc: 'Compiling structured category cost breakdowns.' }
    ],
    faqs: [
      { q: 'How accurate are MADECC Quantity Surveyor estimates?', a: 'Our estimates draw directly from active supplier invoices across Douala, Yaoundé, and Garoua, offering +/- 3% material accuracy.' }
    ],
    ctaLabel: 'Request Cost Estimate'
  },
  {
    id: 'boq-tender',
    slug: 'boq-tender',
    title: 'BOQ Preparation & Tender Services',
    category: 'Cost & Commercial',
    icon: FileCheck,
    shortDesc: 'Standard Bill of Quantities (BOQ) preparation according to SMM/POMI standards, tender document drafting, and contractor tender analysis.',
    overview: 'A standard Bill of Quantities protects project owners from unfair contractor quotes. MADECC prepares formal unpriced and priced BOQs for competitive bidding and tender evaluation.',
    whatWeDeliver: [
      'Formal unpriced & priced Bill of Quantities (BOQ)',
      'Standard Method of Measurement (SMM) compliance',
      'Tender document compilation & technical specs',
      'Contractor bid comparison & tender evaluation reports',
      'Negotiation support & contract drafting'
    ],
    typicalProjects: [
      'Private & Corporate Tender Procurement Packages',
      'Government & Institutional Infrastructure Bids',
      'Bank Financing Project Cost Dossiers'
    ],
    deliverables: [
      'Standard BOQ Excel/PDF Master Package',
      'Contractor Tender Evaluation Matrix',
      'Contract Award Recommendation Letter'
    ],
    processSteps: [
      { title: 'Scope Standardization', desc: 'Categorizing work into standard SMM divisions (Substructure, Superstructure, MEP, Finishes).' },
      { title: 'BOQ Drafting', desc: 'Writing clear work specifications, units, and item quantities.' },
      { title: 'Tender Management', desc: 'Issuing to contractors and evaluating returned proposals.' }
    ],
    faqs: [
      { q: 'Can I use a MADECC BOQ to request quotes from multiple contractors?', a: 'Yes. An unpriced BOQ ensures all contractors bid on the exact same quantities, eliminating hidden extras.' }
    ],
    ctaLabel: 'Request BOQ'
  },
  {
    id: 'project-management',
    slug: 'project-management',
    title: 'Construction Project Management',
    category: 'Management & Supervision',
    icon: Briefcase,
    shortDesc: 'Comprehensive project management, contractor coordination, procurement scheduling, quality control, and budget monitoring.',
    overview: 'We represent project owners, controlling cost, time, and quality. Our project managers ensure contractors stay on schedule, enforce safety standards, and maintain clear progress reporting.',
    whatWeDeliver: [
      'Master project scheduling & CPM programme tracking',
      'Contractor procurement & site coordination',
      'Cost control & change order management',
      'Quality control & material sample verification',
      'Weekly & monthly progress reporting to owners'
    ],
    typicalProjects: [
      'Diaspora Owner Building Projects in Cameroon',
      'Commercial Multi-Tenant Developments',
      'Complex Multi-Contractor Construction Sites'
    ],
    deliverables: [
      'Master Project Execution Plan',
      'Weekly Video & Photo Progress Dashboards',
      'Financial Budget vs Actual Tracker'
    ],
    processSteps: [
      { title: 'Project Charter', desc: 'Establishing scope boundaries, timeline milestones, and budget baselines.' },
      { title: 'Site Governance', desc: 'Holding weekly site meetings with main contractors and subcontractors.' },
      { title: 'Cost & Quality Checks', desc: 'Verifying work completed before authorizing contractor invoices.' }
    ],
    faqs: [
      { q: 'Can MADECC manage my construction project if I live abroad?', a: 'Yes. We specialize in managing diaspora projects in Cameroon, providing cloud dashboard reports, photos, and live site updates.' }
    ],
    ctaLabel: 'Discuss Project Management'
  },
  {
    id: 'construction-supervision',
    slug: 'construction-supervision',
    title: 'Site Supervision & Quality Control',
    category: 'Management & Supervision',
    icon: Eye,
    shortDesc: 'On-site technical supervision, rebar checking, concrete pour inspection, workmanship verification, and site safety compliance.',
    overview: 'Improper rebar spacing or low-grade concrete causes structural failures. MADECC resident engineers provide independent site supervision to enforce drawings and material specifications.',
    whatWeDeliver: [
      'Daily / weekly resident site engineering inspection',
      'Pre-pour inspection for foundation & slab concrete',
      'Rebar diameter, spacing & lap length verification',
      'Material sample collection & lab slump/cube testing',
      'Workmanship defect identification & correction orders'
    ],
    typicalProjects: [
      'Active Residential & Commercial Construction Sites',
      'Third-Party Contractor Supervision Packages'
    ],
    deliverables: [
      'Signed Pre-Pour Concrete Authorization Certificates',
      'Daily Site Supervision Logbook',
      'Quality Non-Conformance Reports (NCR)'
    ],
    processSteps: [
      { title: 'Drawing Alignment', desc: 'Checking site rebar fixes against structural bending schedules.' },
      { title: 'Pour Supervision', desc: 'Monitoring concrete batch mixing, vibration, and curing.' },
      { title: 'Inspection Sign-Off', desc: 'Documenting quality compliance at every key milestone.' }
    ],
    faqs: [
      { q: 'Can MADECC supervise a contractor I hired myself?', a: 'Yes. We act as your independent engineer to ensure your contractor executes the work correctly.' }
    ],
    ctaLabel: 'Request Site Supervision'
  },
  {
    id: 'consultancy',
    slug: 'consultancy',
    title: 'Construction Advisory & Consultancy',
    category: 'Consultancy & Advisory',
    icon: UserCheck,
    shortDesc: 'Feasibility studies, technical due diligence, land acquisition technical review, dispute resolution, and project strategy.',
    overview: 'Our senior civil engineers and quantity surveyors provide expert technical advisory for land buyers, real estate developers, financial institutions, and corporate boards.',
    whatWeDeliver: [
      'Project technical & financial feasibility studies',
      'Land technical due diligence & soil suitability review',
      'Dispute resolution & claims advisory for construction contracts',
      'Value engineering & cost reduction strategy',
      'Independent technical expert opinion reports'
    ],
    typicalProjects: [
      'Real Estate Investment Feasibility Studies',
      'Commercial Property Acquisition Inspections'
    ],
    deliverables: [
      'Formal Feasibility & Strategy Advisory Dossier',
      'Site Technical Risk Assessment Report'
    ],
    processSteps: [
      { title: 'Data Gathering', desc: 'Reviewing title, soil reports, municipal zoning, and market context.' },
      { title: 'Technical Analysis', desc: 'Evaluating structural risks, utility availability, and financial ROI.' },
      { title: 'Strategic Advisory', desc: 'Presenting clear recommendations to stakeholders.' }
    ],
    faqs: [
      { q: 'Should I consult MADECC before buying land for a high-rise building?', a: 'Yes. Soil bearing capacity and slope conditions in Cameroon significantly impact foundation costs.' }
    ],
    ctaLabel: 'Speak With a Consultant'
  },
  {
    id: 'renovation',
    slug: 'renovation',
    title: 'Renovation, Refurbishment & Extensions',
    category: 'Construction & Execution',
    icon: Hammer,
    shortDesc: 'Structural modifications, building extensions, roof replacement, interior modernization, commercial refurbishment, and structural rehabilitation.',
    overview: 'Breathe new life into existing buildings. We undertake structural modifications, adding additional floors, modernizing facades, replacing roofs, and updating MEP systems.',
    whatWeDeliver: [
      'Building structural capacity verification before modification',
      'Vertical building extension (Adding storeys / floors)',
      'Roof timber replacement & modern sheet conversion',
      'Commercial office & retail interior refurbishment',
      'Façade modernization & exterior rendering'
    ],
    typicalProjects: [
      'Bungalow to Duplex Conversion & Vertical Extension',
      'Commercial Bank & Retail Store Refurbishment',
      'Dilapidated Building Structural Rehabilitation'
    ],
    deliverables: [
      'Renovation Execution Drawings & Structural Strengthening File',
      'Modernized High-Finish Property Handover'
    ],
    processSteps: [
      { title: 'Structural Assessment', desc: 'Testing existing foundations and columns for added load.' },
      { title: 'Demolition & Strengthening', desc: 'Careful structural underpinning and selective demolition.' },
      { title: 'Modernization Execution', desc: 'Installing new finishes, lighting, and architectural features.' }
    ],
    faqs: [
      { q: 'Can I add a second storey to my existing bungalow?', a: 'Yes, after our structural engineer conducts a core test and foundation inspection to confirm load capacity.' }
    ],
    ctaLabel: 'Request Renovation Quote'
  }
];

export const Services: React.FC<ServicesProps> = ({ onNavigateToTab }) => {
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const [dbServicesList, setDbServicesList] = useState<ServiceItem[]>([]);

  useEffect(() => {
    const loadServicesFromDb = async () => {
      try {
        const res = await fetch('/api/services');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped: ServiceItem[] = data.map((s: any) => ({
              id: String(s.id),
              slug: s.slug || `service-${s.id}`,
              title: s.name,
              category: s.category || 'Construction & Execution',
              icon: Building2,
              shortDesc: s.shortDescription || s.description || '',
              overview: s.fullDescription || s.overview || s.description || '',
              whatWeDeliver: Array.isArray(s.whatWeDeliver) && s.whatWeDeliver.length > 0 ? s.whatWeDeliver : ['Professional site execution', 'Quality technical management', 'Full compliance certification'],
              typicalProjects: Array.isArray(s.typicalProjects) && s.typicalProjects.length > 0 ? s.typicalProjects : ['Residential & Commercial Developments'],
              deliverables: Array.isArray(s.deliverables) && s.deliverables.length > 0 ? s.deliverables : ['Execution drawings & quality report'],
              processSteps: Array.isArray(s.processSteps) && s.processSteps.length > 0 ? s.processSteps : [
                { title: 'Initial Assessment', desc: 'Site survey & scope definition.' },
                { title: 'Technical Execution', desc: 'Engineering & construction works.' }
              ],
              faqs: Array.isArray(s.faqs) && s.faqs.length > 0 ? s.faqs : [
                { q: 'How do I request a quote for this service?', a: 'Click the Request Quote button to fill out project location and budget details.' }
              ],
              ctaLabel: s.ctaText || `Request Quote for ${s.name}`
            }));
            setDbServicesList(mapped);
          }
        }
      } catch (err) {
        console.warn('Using default services catalog fallback');
      }
    };
    loadServicesFromDb();
  }, []);

  const combinedServices = dbServicesList.length > 0 
    ? [...dbServicesList, ...SERVICES_DATA.filter(sd => !dbServicesList.some(dbs => dbs.title.toLowerCase() === sd.title.toLowerCase()))]
    : SERVICES_DATA;

  const handleSelectServiceForQuote = (serviceName: string) => {
    onNavigateToTab('request-a-quote', { selectedService: serviceName });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-20">
      
      {/* 1. HERO SECTION */}
      <div className="bg-slate-900 text-white border-b border-slate-800 py-16 lg:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
        
        <div className="max-w-6xl mx-auto relative z-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-amber-500/20 text-amber-400 rounded-full text-xs font-extrabold uppercase tracking-wider mb-6 border border-amber-500/30">
            <Sparkles className="w-3.5 h-3.5" /> Full-Spectrum Construction & Engineering
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white mb-6 leading-tight max-w-4xl">
            Construction & Engineering Services Built Around Your Project
          </h1>

          <p className="text-slate-300 text-base sm:text-xl max-w-3xl leading-relaxed mb-10 font-normal">
            MADECC Group provides integrated construction, civil & structural engineering, quantity surveying, project management, and consultancy services for residential, commercial, industrial, and infrastructure projects across Cameroon.
          </p>

          <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start">
            <button
              onClick={() => onNavigateToTab('request-a-quote')}
              className="px-8 py-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm rounded-2xl shadow-xl shadow-amber-500/20 transition-all flex items-center gap-2.5"
            >
              Request a Quote <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigateToTab('projects')}
              className="px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold text-sm rounded-2xl border border-slate-700 transition-all flex items-center gap-2"
            >
              Explore Our Projects
            </button>

            <button
              onClick={() => onNavigateToTab('schedule-consultation')}
              className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm rounded-2xl shadow-lg transition-all flex items-center gap-2"
            >
              Schedule Consultation
            </button>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 space-y-16">

        {/* 2. SERVICES GRID SECTION */}
        <div>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">
              Our Core Expertise
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Engineering Excellence Across Every Phase
            </h2>
            <p className="text-slate-600 text-sm sm:text-base mt-3">
              Explore our core capabilities or click any service card for detailed process workflows, deliverables, and project scopes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {combinedServices.map((service) => {
              const IconComp = service.icon;
              return (
                <div
                  key={service.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-md hover:shadow-xl transition-all duration-300 flex flex-col justify-between group hover:border-amber-400"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
                        <IconComp className="w-6 h-6" />
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                        {service.category.split('&')[0]}
                      </span>
                    </div>

                    <h3 className="text-lg font-bold text-slate-900 mb-2 group-hover:text-amber-600 transition-colors">
                      {service.title}
                    </h3>

                    <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-6">
                      {service.shortDesc}
                    </p>

                    <div className="space-y-1.5 mb-6 text-xs text-slate-700">
                      {service.whatWeDeliver.slice(0, 3).map((item, idx) => (
                        <div key={idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-amber-500 shrink-0 mt-0.5" />
                          <span className="truncate">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-100 space-y-2">
                    <button
                      onClick={() => setSelectedService(service)}
                      className="w-full py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-200"
                    >
                      <FileText className="w-3.5 h-3.5 text-amber-600" /> View Details & Deliverables
                    </button>

                    <button
                      onClick={() => handleSelectServiceForQuote(service.title)}
                      className="w-full py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs rounded-xl shadow-sm transition-all flex items-center justify-center gap-1.5"
                    >
                      {service.ctaLabel} &rarr;
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* 3. HOW WE WORK (PROCESS SECTION) */}
        <div className="bg-slate-900 text-white rounded-3xl p-8 sm:p-12 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="max-w-3xl mb-10">
            <div className="text-xs font-extrabold text-amber-400 uppercase tracking-widest mb-2">
              Structured Project Delivery
            </div>
            <h2 className="text-2xl sm:text-4xl font-extrabold text-white">
              How We Work
            </h2>
            <p className="text-slate-300 text-sm sm:text-base mt-2">
              Our 5-phase engineering protocol guarantees transparency, cost precision, and quality execution on every job.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            {[
              { num: '01', name: 'Understand', desc: 'We understand your project requirements, objectives, site location, scope, and target budget.' },
              { num: '02', name: 'Assess', desc: 'Our team reviews drawings, soil/site conditions, quantities, and structural constraints.' },
              { num: '03', name: 'Plan', desc: 'We develop technical, BOQ, procurement, and site execution methodologies.' },
              { num: '04', name: 'Execute', desc: 'Our engineers coordinate physical construction, quality testing, and safety controls.' },
              { num: '05', name: 'Handover', desc: 'We conduct final inspections, client walkthroughs, documentation sign-off, and handover.' }
            ].map((step) => (
              <div key={step.num} className="p-5 bg-slate-800/80 rounded-2xl border border-slate-700/60 flex flex-col justify-between space-y-3">
                <div>
                  <div className="text-2xl font-black text-amber-400 font-mono mb-1">{step.num}</div>
                  <div className="text-sm font-bold text-white mb-2">{step.name}</div>
                  <div className="text-xs text-slate-300 leading-relaxed">{step.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. WHY CHOOSE MADECC */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl">
          <div className="text-center max-w-3xl mx-auto mb-10">
            <div className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-2">
              The MADECC Advantage
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Why Project Owners Trust MADECC Group
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-xs sm:text-sm">
            {[
              { title: 'Engineering-Led Approach', desc: 'Civil and structural engineers supervise site works directly rather than relying on unmonitored masons.' },
              { title: 'Transparent Cost Estimation', desc: 'Itemized material quantity breakdowns and real Cameroon market price indices eliminate surprises.' },
              { title: 'Quantity Surveying Rigor', desc: 'SMM-compliant Bills of Quantities protect you from bloated contractor quotes.' },
              { title: 'Technology-Enabled Dashboards', desc: 'Diaspora and local clients receive weekly digital photo/video progress updates and budget reports.' },
              { title: 'Local Cameroon Market Expertise', desc: 'Deep knowledge of regional soil types, quarry sources, and logistics in Yaoundé, Douala, and all 10 regions.' },
              { title: 'Integrated Services', desc: 'From initial architectural sketches to foundation pouring and final finishing under one umbrella.' }
            ].map((item, i) => (
              <div key={i} className="p-5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-slate-900 text-sm mb-1">{item.title}</div>
                  <div className="text-slate-600 leading-relaxed text-xs">{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 5. FREQUENTLY ASKED QUESTIONS */}
        <div className="bg-white rounded-3xl p-8 sm:p-12 border border-slate-200 shadow-xl space-y-6">
          <div>
            <div className="text-xs font-bold text-amber-600 uppercase tracking-widest mb-1">
              Knowledge & Clarity
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Frequently Asked Questions About Our Services
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs sm:text-sm">
            {[
              {
                q: 'What types of construction projects does MADECC handle?',
                a: 'We handle residential houses, duplexes, multi-storey apartments, commercial plazas, industrial warehouses, civil drainage, retaining walls, and building renovations.'
              },
              {
                q: 'Can MADECC prepare a BOQ before construction begins?',
                a: 'Yes. Our Quantity Surveying team prepares standard Bills of Quantities (BOQs) from your architectural and structural drawings.'
              },
              {
                q: 'Do I need architectural drawings before requesting a quote?',
                a: 'Not necessarily. If you already have drawings, you can upload them in our Request a Quote system. If not, our Architectural team can design them for you.'
              },
              {
                q: 'Can MADECC supervise a project designed or built by another contractor?',
                a: 'Yes. We offer independent technical supervision and quality control to protect project owners and enforce compliance.'
              },
              {
                q: 'Does MADECC work outside Yaoundé and Douala?',
                a: 'Yes. We execute and supervise projects across all 10 regions of Cameroon, including Kribi, Bafoussam, Bamenda, Garoua, and Maroua.'
              },
              {
                q: 'How long does it take to receive a quote response after submitting?',
                a: 'Our engineering intake team reviews submitted project enquiries and contacts clients within 24 to 48 business hours.'
              }
            ].map((faq, idx) => (
              <div key={idx} className="p-5 rounded-2xl bg-slate-50 border border-slate-200 leading-relaxed space-y-1.5">
                <div className="font-bold text-slate-900 text-sm">{faq.q}</div>
                <div className="text-slate-600 text-xs">{faq.a}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. BOTTOM CTA BANNER */}
        <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-slate-950 text-slate-950 rounded-3xl p-8 sm:p-12 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <h3 className="text-2xl sm:text-3xl font-black text-slate-950 tracking-tight">
              Ready to Start Your Construction Project in Cameroon?
            </h3>
            <p className="text-slate-900 font-medium text-xs sm:text-sm">
              Submit your project details through our multi-step intake form or schedule a direct consultation with our engineering team.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigateToTab('request-a-quote')}
              className="px-6 py-3.5 bg-slate-950 hover:bg-slate-900 text-amber-400 font-black text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2"
            >
              Request a Quote <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onNavigateToTab('schedule-consultation')}
              className="px-6 py-3.5 bg-white hover:bg-slate-100 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-sm transition-all"
            >
              Schedule Consultation
            </button>
          </div>
        </div>

      </div>

      {/* DYNAMIC SERVICE DETAIL MODAL */}
      {selectedService && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6 sm:p-8 relative shadow-2xl border border-slate-200">
            
            <button
              onClick={() => setSelectedService(null)}
              className="absolute right-6 top-6 w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition-all"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-2xl bg-amber-500 text-slate-950 font-bold flex items-center justify-center shrink-0">
                {React.createElement(selectedService.icon, { className: 'w-6 h-6' })}
              </div>
              <div>
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">{selectedService.category}</span>
                <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900">{selectedService.title}</h3>
              </div>
            </div>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed mb-6 border-b border-slate-100 pb-4">
              {selectedService.overview}
            </p>

            <div className="space-y-6 text-xs sm:text-sm">
              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" /> What We Deliver
                </h4>
                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {selectedService.whatWeDeliver.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-700 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <span className="w-1.5 h-1.5 bg-amber-500 rounded-full mt-1.5 shrink-0" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-amber-600" /> Typical Project Types
                </h4>
                <div className="flex flex-wrap gap-2">
                  {selectedService.typicalProjects.map((p, i) => (
                    <span key={i} className="px-3 py-1 bg-amber-50 text-amber-900 rounded-lg text-xs font-semibold border border-amber-200/60">
                      {p}
                    </span>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-blue-600" /> Key Deliverables & Documentation
                </h4>
                <ul className="space-y-1.5 text-slate-700">
                  {selectedService.deliverables.map((d, i) => (
                    <li key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                      <span>{d}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 flex flex-wrap items-center justify-between gap-4">
              <button
                onClick={() => setSelectedService(null)}
                className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition-all"
              >
                Close
              </button>

              <button
                onClick={() => {
                  const sName = selectedService.title;
                  setSelectedService(null);
                  handleSelectServiceForQuote(sName);
                }}
                className="px-6 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold text-xs sm:text-sm rounded-xl shadow-lg transition-all flex items-center gap-2"
              >
                Request Quote for {selectedService.title} &rarr;
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
