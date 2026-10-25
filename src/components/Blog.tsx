import React, { useState, useEffect, useMemo } from 'react';
import { 
  Newspaper, 
  Calendar, 
  User as UserIcon, 
  Tag, 
  X, 
  ArrowRight, 
  Clock,
  Search,
  BookOpen,
  Filter,
  CheckCircle2,
  Share2,
  Building2,
  FileCheck2,
  ShieldCheck,
  Award
} from 'lucide-react';
import { BlogPost } from '../types.ts';
import { getOptimizedImageUrl } from '../lib/utils.ts';
import AdSenseSlot from './AdSenseSlot.tsx';

// Comprehensive, authoritative engineering publications to ensure high editorial value for Google AdSense
const EDITORIAL_ARTICLES: BlogPost[] = [
  {
    id: 901,
    title: 'The Definitive Guide to Obtaining a Building Permit (Permis de Construire) in Cameroon: 2026 Legal & Technical Guide',
    authorId: 1,
    publishedAt: '2026-02-15T09:00:00Z',
    image: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=80',
    summary: 'Step-by-step statutory requirements, urban planning certificates (Certificat d’Urbanisme), cadastral land title verification, architectural approvals, and engineering calculation dossiers required across Douala, Yaoundé, and regional councils.',
    category: 'Legal & Regulatory',
    content: `Under Cameroon's Law No. 2004/003 on the Town Planning Code and Ministry of Housing and Urban Development (MINDDHU) directives, erecting any permanent structure requires a statutory Building Permit (Permis de Construire). 

1. Preliminary Phase: The Urban Planning Certificate (Certificat d'Urbanisme)
Before architectural drafting commences, property developers must obtain a Certificat d'Urbanisme from the local council (Mairie) or City Council (Communauté Urbaine). This document details zoning designations, road setbacks (servitudes de recul), maximum allowable ground occupancy rates (Coefficient d'Occupation du Sol - COS), and height limitations.

2. Mandatory Technical Dossier Components
A valid submission file compiled for council review must include:
• Certified Land Title (Titre Foncier) or authentic notary conveyance deed.
• Topographic site survey produced by a surveyor registered with the Ordre des Géomètres Experts du Cameroun (OGEC).
• Comprehensive architectural blueprint set (floor plans, elevations, sections at 1/50 or 1/100 scale) signed by a certified architect registered with ONAC (Ordre National des Architectes du Cameroun).
• Structural engineering calculation note and reinforcement drawings (Plan de ferraillage) signed by a civil engineer registered with ONIGC (Ordre National des Ingénieurs de Génie Civil).
• Geotechnical soil test report (Rapport Géotechnique) from an accredited laboratory certifying bearing capacity (qu and qad).
• Environmental and Social Impact Assessment (Notice d’Impact Environnemental et Social - NIES) for commercial or multi-story structures.

3. Processing Timelines and Verification Inspections
By statutory decree, municipal commissions must examine and respond to building permit submissions within 30 to 45 business days. During this period, municipal planning commissions conduct site boundary verifications to ensure alignments with public right-of-ways.

At MADECC GROUP, our regulatory compliance division coordinates the entire dossier preparation, ensuring zero rejection delays and total adherence to Cameroonian building laws.`
  },
  {
    id: 902,
    title: 'Geotechnical Soil Testing & Foundation Engineering for Coastal Soils in Douala and Kribi',
    authorId: 1,
    publishedAt: '2026-02-10T14:30:00Z',
    image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
    summary: 'Deep analysis of compressible alluvial silts, high coastal water tables, Standard Penetration Tests (SPT), and engineering deep pile vs. reinforced raft foundations in Central Africa.',
    category: 'Geotechnical',
    content: `Coastal construction in Douala (Wouri Estuary) and Kribi presents severe structural foundation challenges due to water-saturated quaternary alluvium, high organic silts, and aggressive groundwater containing dissolved sulfates and chlorides.

1. Geotechnical Investigation Protocol
A standard shallow test pit is dangerously insufficient for buildings exceeding R+1. MADECC GROUP geotechnical protocols require:
• Mechanical core drilling down to stable bedrock or dense substrata (typically 18m to 35m in Douala Bonabéri and Akwa).
• Standard Penetration Tests (SPT) conducted every 1.5m to determine dynamic penetration resistance (N-values).
• In-situ Menard pressuremeter tests (Essais Pressiométriques) to establish the limit pressure (Pl) and pressiometric modulus (Em).
• Laboratory analysis measuring soil consolidation parameters (Cc and Cs), Atterberg limits, and organic matter content.

2. Selecting the Optimal Foundation System
When permissible ground pressure (qad) falls below 0.12 MPa (1.2 bars) in upper strata, isolated pad footings risk catastrophic differential settlement. Engineering solutions deployed include:
• Continuous Rigid Raft (Radier Général Nervuré): Ideal for residential complexes up to R+3 on homogeneous soft clays, redistributing structural stress across the entire footprint.
• Bored Cast-in-Place Concrete Piles (Pieux Forés): Essential for multi-story commercial buildings, anchoring axial compressive loads directly into dense gravels or sandstones.
• Sulfate-Resistant Cement (CEM I 42.5N SR or CEM III blast furnace slag cement) and hydrophobic admixtures to prevent rebar corrosion from saline moisture.

Investing in rigorous pre-construction geotechnical analysis protects developers from multi-million FCFA structural remediation costs.`
  },
  {
    id: 903,
    title: 'Eurocode 2 vs. BAEL 91: Modern Reinforced Concrete Design Standards in Central Africa',
    authorId: 1,
    publishedAt: '2026-02-02T11:00:00Z',
    image: 'https://images.unsplash.com/photo-1590381105924-c72589b9ef3f?auto=format&fit=crop&w=1200&q=80',
    summary: 'A technical comparison between French BAEL 91 rules and modern European Eurocode 2 (EN 1992-1-1) for crack control, concrete durability, and rebar efficiency in tropical climates.',
    category: 'Structural Engineering',
    content: `For decades, structural design across Francophone Africa relied almost exclusively on French BAEL 91 (Béton Armé aux États Limites). Today, progressive civil engineering practices are transitioning to Eurocode 2 (EN 1992-1-1), providing optimized material efficiency, enhanced crack control, and superior seismic resilience.

Key Technical Contrasts:
1. Material Constitutive Models:
Eurocode 2 utilizes a refined parabolic-rectangular stress-strain relationship for concrete in compression, providing more accurate plastic hinge analysis than BAEL's simplified bi-linear model.

2. Serviceability Limit State (SLS) Crack Width Control:
Under high humidity and coastal atmospheric exposure in Cameroon (Exposure Class XC3, XC4, and XS1), Eurocode 2 mandates strict maximum characteristic crack width limits (wk ≤ 0.2mm to 0.3mm). BAEL 91 used generalized stress limitations that often led to early reinforcement carbonation.

3. Shear Reinforcement & Truss Angle Optimization:
Eurocode 2 incorporates the variable-strut angle method (1.0 ≤ cot θ ≤ 2.5), allowing structural engineers to minimize web shear rebar quantities in deep beams without compromising safety margins.

MADECC GROUP engineers utilize licensed Robot Structural Analysis and ETABS software configured to Eurocode 2 with regional climatic load parameters, delivering lighter, stronger, and more cost-effective structural frames.`
  },
  {
    id: 904,
    title: 'The Rising Trend of Photovoltaic Glass Facades in Cameroon: Clean Energy Commercial Towers',
    authorId: 1,
    publishedAt: '2026-01-25T16:00:00Z',
    image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    summary: 'How building-integrated photovoltaics (BIPV), high-efficiency low-E thermal insulation, and solar facades offset up to 35% of commercial building electrical demand in equatorial regions.',
    category: 'Sustainability',
    content: `Commercial buildings in Douala and Yaoundé consume up to 60% of their operational energy on HVAC air conditioning due to high equatorial solar insolation and ambient humidity. Building-Integrated Photovoltaics (BIPV) offers a dual-action breakthrough: reducing heat gain while generating clean on-site electricity.

1. Anatomy of Photovoltaic Glass
Unlike conventional opaque rooftop solar panels, BIPV facade units consist of laminated architectural safety glass embedded with transparent or semi-transparent monocrystalline silicon cells. They function simultaneously as weather envelopes, thermal barriers, and active electrical power generators.

2. Thermal Performance & Solar Heat Gain Coefficient (SHGC)
By reflecting infrared radiation and transmitting filtered visual daylight, photovoltaic glass reduces the Solar Heat Gain Coefficient (SHGC) below 0.25, slashing cooling chiller loads by over 30%.

3. Grid Interconnection & Battery Micro-Grids
In Cameroon, where municipal grid stability fluctuates, BIPV facades integrate with hybrid inverter micro-grids and Lithium Iron Phosphate (LiFePO4) storage banks. Excess power generated during peak midday solar hours charges corporate backup arrays, reducing diesel generator fuel expenditures by millions of FCFA annually.

At MADECC GROUP, we engineer commercial office complexes that combine aesthetic prestige with long-term energy independence.`
  },
  {
    id: 905,
    title: 'Construction Cost Estimation & Bill of Quantities (BoQ) Best Practices: Avoiding Budget Blowouts',
    authorId: 1,
    publishedAt: '2026-01-18T10:15:00Z',
    image: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
    summary: 'Professional quantity surveying methodologies for civil earthworks, structural concrete, finishing materials, labor scheduling, and contingency allocation in Central Africa.',
    category: 'Quantity Surveying',
    content: `One of the most frequent causes of stalled construction projects in Africa is improper pre-construction budgeting based on arbitrary square-meter estimates rather than verified Bills of Quantities (BoQ).

1. The Anatomy of an Accurate BoQ
A professional engineering Bill of Quantities divides a project into standardized MasterFormat divisions:
• Division 01: General Requirements, site mobilization, temporary water/power, and safety compliance.
• Division 02: Earthworks, site clearing, soil grading, and mechanical excavation.
• Division 03: Concrete works (substructure footings, grade beams, columns, suspended slabs).
• Division 04: Masonry (hollow concrete blocks, fair-faced brickwork).
• Division 05–09: Structural steelwork, waterproofing, thermal insulation, doors/windows, and interior finishes.
• Division 22–26: Plumbing, sanitary fittings, electrical power distribution, and low-voltage networks.

2. Controlling Material Price Volatility
Cement, rebar, and aggregate prices in Cameroon experience seasonal price shifts. An experienced quantity surveyor mitigates these risks by:
• Establishing firm supplier agreements with authorized distributors (e.g., Cimencam, Dangote, Prometal).
• Structuring contractual escalation clauses based on published indices from the Ministry of Commerce.
• Recommending a disciplined 5% to 8% contingency reserve on substructure works to absorb unforeseen geotechnical anomalies.

Use our interactive Project Budget Calculator to run verified preliminary estimates configured with current 2026 regional market rates.`
  }
];

export default function Blog() {
  const [posts, setPosts] = useState<BlogPost[]>(EDITORIAL_ARTICLES);
  const [activePost, setActivePost] = useState<BlogPost | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        setLoading(true);
        const res = await fetch('/api/blogs');
        if (res.ok) {
          const apiPosts = await res.json();
          if (Array.isArray(apiPosts) && apiPosts.length > 0) {
            // Merge API posts with editorial articles, ensuring no duplicate titles
            const existingTitles = new Set(apiPosts.map(p => p.title.toLowerCase()));
            const nonDuplicates = EDITORIAL_ARTICLES.filter(p => !existingTitles.has(p.title.toLowerCase()));
            setPosts([...apiPosts, ...nonDuplicates]);
          } else {
            setPosts(EDITORIAL_ARTICLES);
          }
        }
      } catch (err) {
        console.warn('Using editorial technical articles fallback:', err);
        setPosts(EDITORIAL_ARTICLES);
      } finally {
        setLoading(false);
      }
    };
    fetchBlogs();
  }, []);

  const categories = useMemo(() => {
    const set = new Set<string>();
    posts.forEach((p) => {
      if (p.category) set.add(p.category);
    });
    return ['All', ...Array.from(set)];
  }, [posts]);

  const filteredPosts = useMemo(() => {
    return posts.filter((post) => {
      const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
      const matchesSearch = 
        post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [posts, selectedCategory, searchQuery]);

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-GB', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="font-sans text-slate-200 bg-[#0A0A0B] min-h-screen">
      
      {/* Blog Header */}
      <section className="bg-slate-950/80 border-b border-slate-850/60 text-white py-16 relative overflow-hidden" id="blog-header">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative space-y-4">
          <div className="flex items-center gap-2">
            <span className="p-1 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Award className="w-4 h-4" />
            </span>
            <span className="text-xs font-bold font-mono uppercase text-amber-500 tracking-widest block">
              MADECC Technical Knowledge Directorate
            </span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Cameroon Civil Engineering &amp; Construction Insights
          </h1>
          <p className="text-slate-400 text-sm max-w-3xl leading-relaxed">
            Peer-reviewed technical guidelines, building permit procedures, geotechnical soil analysis, structural Eurocode calculation notes, and real-world construction cost management in Central Africa.
          </p>

          {/* Search and Category Filter */}
          <div className="pt-4 flex flex-col sm:flex-row items-center gap-4 max-w-3xl">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search engineering publications..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all"
                id="blog-search-input"
              />
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            {categories.length > 1 && (
              <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
                {categories.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      selectedCategory === cat
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'bg-slate-900/80 text-slate-400 border border-slate-800 hover:border-slate-700 hover:text-white'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Main Blog Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
        
        {/* Top Responsive AdSense Container */}
        <AdSenseSlot slotId="3492810574" format="horizontal" className="mb-10" />

        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <article
                key={post.id}
                onClick={() => setActivePost(post)}
                className="bg-slate-900/50 border border-slate-800/85 rounded-2xl overflow-hidden shadow-sm hover:border-amber-500/50 hover:bg-slate-900 transition-all flex flex-col h-full cursor-pointer group"
                id={`blog-card-${post.id}`}
              >
                <div className="h-52 bg-slate-950 shrink-0 relative overflow-hidden">
                  <img
                    src={getOptimizedImageUrl(post.image, 800, 80)}
                    alt={post.title}
                    className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-500"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute top-3 left-3">
                    <span className="inline-flex items-center gap-1 bg-slate-950/90 backdrop-blur-md text-amber-400 border border-amber-500/30 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider">
                      <Tag className="w-3 h-3 text-amber-500" /> {post.category}
                    </span>
                  </div>
                </div>

                <div className="p-6 flex flex-col justify-between flex-grow space-y-4">
                  <div className="space-y-2.5">
                    <div className="flex items-center gap-3 text-[11px] text-slate-500 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-amber-500" /> {formatDate(post.publishedAt)}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" /> 6 min read
                      </span>
                    </div>

                    <h2 className="font-extrabold text-base text-white leading-snug line-clamp-2 group-hover:text-amber-400 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
                      {post.summary}
                    </p>
                  </div>

                  <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-amber-400 font-bold text-xs inline-flex items-center gap-1 group-hover:text-amber-300 transition-colors">
                      Read Full Dossier <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono">ONIGC Guideline</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-[#0E0E10]/90 border border-slate-850 rounded-xl max-w-lg mx-auto space-y-3">
            <BookOpen className="w-10 h-10 text-slate-600 mx-auto" />
            <p className="font-bold text-white text-sm">No Publications Found</p>
            <p className="text-xs text-slate-400">
              {searchQuery ? `No technical articles matching "${searchQuery}". Try a different keyword.` : 'Engineering publications will be posted here.'}
            </p>
          </div>
        )}

        {/* Bottom Responsive AdSense Container */}
        <AdSenseSlot slotId="8492019482" format="auto" className="mt-12" />

      </div>

      {/* Reading Detail Modal */}
      {activePost && (
        <div 
          className="fixed inset-0 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-[#0E0E10] border border-slate-800 rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in zoom-in-95 duration-200">
            
            {/* Close button */}
            <button
              onClick={() => setActivePost(null)}
              className="absolute right-4 top-4 bg-amber-500 hover:bg-amber-400 text-slate-950 p-2 rounded-full transition-colors z-10 shadow-lg cursor-pointer"
              id="close-blog-modal"
              aria-label="Close article modal"
            >
              <X className="w-5 h-5 stroke-[2.5]" />
            </button>

            {/* Banner image */}
            <div className="h-64 sm:h-72 bg-slate-950 relative">
              <img
                src={getOptimizedImageUrl(activePost.image, 1200, 85)}
                alt={activePost.title}
                className="w-full h-full object-cover opacity-85"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0E0E10] via-slate-950/40 to-transparent" />
              <div className="absolute bottom-6 left-6 right-6 text-white space-y-2">
                <span className="inline-block bg-amber-500 text-slate-950 text-[10px] font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded">
                  {activePost.category}
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight leading-tight">{activePost.title}</h2>
              </div>
            </div>

            {/* Reading Details */}
            <div className="p-6 sm:p-8 space-y-6">
              <div className="flex flex-wrap items-center justify-between border-b border-slate-800 pb-4 text-xs text-slate-400 font-mono gap-3">
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <Calendar className="w-4 h-4 text-amber-500" /> {formatDate(activePost.publishedAt)}
                  </span>
                  <span className="flex items-center gap-1.5 text-slate-300">
                    <UserIcon className="w-4 h-4 text-amber-500" /> MADECC Engineering Directorate
                  </span>
                </div>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded text-[11px] font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Peer-Reviewed
                </span>
              </div>

              {/* Mid-Article Compliant Ad Placement */}
              <AdSenseSlot slotId="5928174029" format="rectangle" className="my-6" />

              {/* Body Content */}
              <div className="text-slate-300 text-sm leading-relaxed space-y-4 whitespace-pre-wrap font-sans">
                {activePost.content}
              </div>

              {/* Author & Compliance Sign-off */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-400 space-y-2">
                <div className="flex items-center gap-2 text-white font-bold">
                  <Building2 className="w-4 h-4 text-amber-500" />
                  <span>MADECC GROUP Technical Publications Directorate</span>
                </div>
                <p className="text-[11px] leading-normal">
                  Published in compliance with ONIGC standards, Cameroon Building Codes, and Eurocode structural provisions. For bespoke structural calculations, geotechnical testing, or project consultations, contact our technical desk.
                </p>
              </div>

              {/* Bottom bar */}
              <div className="pt-4 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3 text-xs text-slate-500">
                <span>© {new Date().getFullYear()} MADECC GROUP Cameroon. All rights reserved.</span>
                <button
                  onClick={() => setActivePost(null)}
                  className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-slate-950 px-5 py-2 rounded-lg font-bold transition-all cursor-pointer"
                >
                  Close Article
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
