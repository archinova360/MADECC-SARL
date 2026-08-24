import React, { useState, useEffect } from 'react';
import { 
  Leaf, 
  ShieldCheck, 
  Users, 
  TrendingUp, 
  Building2, 
  FileText, 
  Download, 
  CheckCircle2, 
  Award, 
  Heart, 
  ArrowRight,
  Globe2,
  HardHat,
  Sparkles
} from 'lucide-react';
import { exportSustainabilityPDF, exportSustainabilityDOCX } from '../lib/exportEngine.ts';

interface SustainabilityData {
  content: {
    title: string;
    heroSubtitle: string;
    introduction: string;
    environmentalPolicy: string;
    safetyPolicy: string;
    localEconomicCommitment: string;
    documents: { title: string; fileUrl: string; docType: string }[];
  };
  initiatives: {
    id: number;
    title: string;
    category: string;
    description: string;
    impactSummary: string;
    image: string;
  }[];
  socialProjects: {
    id: number;
    title: string;
    category: string;
    location: string;
    dateCompleted: string;
    description: string;
    impactMetricsText: string;
    image: string;
  }[];
  metrics: {
    id: number;
    label: string;
    value: string;
    category: string;
    icon: string;
  }[];
}

interface SustainabilityProps {
  onNavigateToTab?: (tab: string) => void;
}

export const Sustainability: React.FC<SustainabilityProps> = ({ onNavigateToTab }) => {
  const [data, setData] = useState<SustainabilityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activePillar, setActivePillar] = useState<'all' | 'environment' | 'safety' | 'social' | 'local'>('all');

  useEffect(() => {
    fetch('/api/public/sustainability')
      .then(res => res.json())
      .then(resData => {
        if (resData.success) {
          setData(resData);
        } else {
          // Default fallback state if server endpoint is initializing
          setData(getFallbackData());
        }
        setLoading(false);
      })
      .catch(err => {
        console.warn('Using default sustainability fallback data:', err);
        setData(getFallbackData());
        setLoading(false);
      });
  }, []);

  const getFallbackData = (): SustainabilityData => ({
    content: {
      title: 'Sustainability & Social Impact',
      heroSubtitle: 'Building responsibly. Creating lasting value across Cameroon.',
      introduction: 'MADECC Group integrates sustainable engineering practices, environmental stewardship, and social responsibility into every phase of construction. From reducing carbon footprints through local material sourcing to training Cameroonian tradespeople, we build for longevity and equity.',
      environmentalPolicy: 'We minimize site waste, utilize energy-efficient machinery, enforce responsible runoff control, and optimize eco-friendly building designs to preserve local ecosystems.',
      safetyPolicy: 'Target Zero Harm: ISO-aligned QHSE standards protect every worker, client, and neighboring community on every MADECC site.',
      localEconomicCommitment: 'Over 85% of our site workforce and raw material procurement is sourced directly within Cameroon, fostering economic resilience.',
      documents: [
        { title: 'MADECC Environmental & Sustainability Policy 2026', fileUrl: '#', docType: 'PDF' },
        { title: 'MADECC QHSE & Site Health & Safety Charter', fileUrl: '#', docType: 'PDF' },
        { title: 'Local Content & Youth Empowerment Framework', fileUrl: '#', docType: 'PDF' }
      ]
    },
    initiatives: [
      {
        id: 1,
        title: 'Low-Carbon Concrete & Material Selection',
        category: 'Sustainable Construction',
        description: 'Optimizing concrete mix design with locally sourced pozzolana and industrial by-products to cut embodied carbon by 28%.',
        impactSummary: '28% reduction in embodied CO2 per cubic meter of structural concrete.',
        image: 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b2?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 2,
        title: 'Solar-Assisted Construction Worksite Systems',
        category: 'Resource Efficiency',
        description: 'Deploying hybrid solar generators and LED task lighting across remote site camps in Central and Far North regions.',
        impactSummary: 'Saved 14,000+ liters of diesel fuel across active project sites.',
        image: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 3,
        title: 'Site Erosion Control & Stormwater Retention',
        category: 'Environmental Responsibility',
        description: 'Constructing eco-friendly silt basins and bio-retention swales on hillside foundations in Yaoundé and West regions.',
        impactSummary: '100% compliance with local environmental protection regulations.',
        image: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=800&q=80'
      }
    ],
    socialProjects: [
      {
        id: 1,
        title: 'Douala Youth Masonry & Construction Apprenticeship',
        category: 'Local Employment & Skills',
        location: 'Douala, Littoral Region',
        dateCompleted: 'Q4 2025',
        description: 'A 6-month intensive vocational training program for young men and women in structural masonry, steel fixing, and site safety.',
        impactMetricsText: '120 Youth Trained | 94% Direct Job Placement',
        image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80'
      },
      {
        id: 2,
        title: 'Clean Water Well & Drainage for Bonabéri Community',
        category: 'Community Participation',
        location: 'Bonabéri, Douala',
        dateCompleted: 'Q1 2026',
        description: 'Engineered a solar-powered borehole and neighborhood storm drain to mitigate seasonal flooding and provide potable water to 3,500 residents.',
        impactMetricsText: '3,500+ Beneficiaries | 1 Clean Water Well',
        image: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=800&q=80'
      }
    ],
    metrics: [
      { id: 1, label: 'Local Workers & Craftsmen Engaged', value: '85%+', category: 'Local Economic Impact', icon: 'Users' },
      { id: 2, label: 'Youth Apprentices Trained & Certified', value: '350+', category: 'Social Impact', icon: 'Award' },
      { id: 3, label: 'Zero Harm Consecutive Work Hours', value: '1.2M+', category: 'Health & Safety', icon: 'ShieldCheck' },
      { id: 4, label: 'Local Cameroon Suppliers Partnered', value: '140+', category: 'Local Economic Impact', icon: 'Building2' }
    ]
  });

  const content = data?.content || getFallbackData().content;
  const initiatives = data?.initiatives || getFallbackData().initiatives;
  const socialProjects = data?.socialProjects || getFallbackData().socialProjects;
  const metrics = data?.metrics || getFallbackData().metrics;

  return (
    <div className="bg-slate-950 text-slate-100 min-h-screen">
      
      {/* HERO BANNER */}
      <section className="relative py-24 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950 border-b border-slate-800/80 overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#d97706_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono tracking-wider uppercase mb-6">
              <Leaf className="w-4 h-4 text-emerald-400" />
              <span>ESG & Environmental Responsibility</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white tracking-tight mb-6">
              Building Responsibly. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-500 to-emerald-400">
                Creating Lasting Value.
              </span>
            </h1>

            <p className="text-lg text-slate-300 leading-relaxed mb-8">
              {content.heroSubtitle} At MADECC Group, sustainable construction is not an afterthought — it is an engineering discipline that preserves Cameroon's natural resources and uplifts local communities.
            </p>

            <div className="flex flex-wrap gap-4">
              <button
                onClick={() => exportSustainabilityPDF({ content, initiatives, socialProjects, metrics })}
                className="px-6 py-3.5 rounded-xl font-medium bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-2 transition-all shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                <Download className="w-5 h-5" />
                <span>Download Impact Report (PDF)</span>
              </button>

              <button
                onClick={() => exportSustainabilityDOCX({ content, initiatives, socialProjects, metrics })}
                className="px-6 py-3.5 rounded-xl font-medium bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center gap-2 transition-all cursor-pointer"
              >
                <FileText className="w-5 h-5 text-amber-400" />
                <span>Export Executive Brief (.DOCX)</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* METRICS DASHBOARD */}
      <section className="py-12 bg-slate-900/60 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {metrics.map((m) => (
              <div key={m.id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800/80 shadow-md flex flex-col justify-between">
                <div>
                  <span className="text-3xl sm:text-4xl font-extrabold text-amber-400 block tracking-tight">
                    {m.value}
                  </span>
                  <span className="text-sm font-semibold text-slate-200 block mt-2">
                    {m.label}
                  </span>
                </div>
                <span className="text-xs font-mono text-emerald-400/90 mt-4 block">
                  {m.category}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* EXECUTIVE VISION & COMMITMENT */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 items-start">
          <div className="lg:col-span-2">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-6 flex items-center gap-3">
              <Globe2 className="w-7 h-7 text-amber-500" />
              <span>1. Executive Vision & Commitments</span>
            </h2>
            <p className="text-slate-300 text-base leading-relaxed mb-6 whitespace-pre-line">
              {content.introduction}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-4">
                  <Leaf className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">Environmental Management</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {content.environmentalPolicy}
                </p>
              </div>

              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800">
                <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-4">
                  <HardHat className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-white mb-2">QHSE & Worksite Safety</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {content.safetyPolicy}
                </p>
              </div>
            </div>
          </div>

          <div className="p-6 rounded-2xl bg-slate-900/90 border border-amber-500/30">
            <h3 className="text-lg font-bold text-amber-400 mb-4 flex items-center gap-2">
              <Award className="w-5 h-5" />
              <span>Policy & Compliance Documents</span>
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Download official MADECC Group policy frameworks and environmental certifications.
            </p>
            <div className="space-y-3">
              {content.documents?.map((doc, idx) => (
                <div key={idx} className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between hover:border-slate-700 transition-colors">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-amber-500 shrink-0" />
                    <div>
                      <span className="text-xs font-semibold text-slate-200 block line-clamp-1">{doc.title}</span>
                      <span className="text-[10px] font-mono text-slate-500">{doc.docType || 'PDF'} • Official Publication</span>
                    </div>
                  </div>
                  <a
                    href={doc.fileUrl || '#'}
                    onClick={(e) => {
                      if (doc.fileUrl === '#') {
                        e.preventDefault();
                        exportSustainabilityPDF({ content, initiatives, socialProjects, metrics });
                      }
                    }}
                    className="p-2 text-amber-400 hover:text-amber-300"
                    title="Download"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SUSTAINABLE INITIATIVES */}
      <section className="py-16 bg-slate-900/40 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="text-xs font-mono text-amber-400 tracking-wider uppercase block mb-2">Sustainable Practices</span>
              <h2 className="text-3xl font-bold text-white">2. Sustainable Construction Initiatives</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {initiatives.map((init) => (
              <div key={init.id} className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden group hover:border-slate-700 transition-all flex flex-col">
                <div className="h-48 overflow-hidden relative">
                  <img 
                    src={init.image || 'https://images.unsplash.com/photo-1541888946425-d0fbb186a5b2?auto=format&fit=crop&w=800&q=80'} 
                    alt={init.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-md bg-slate-950/80 backdrop-blur-sm border border-slate-800 text-[11px] font-mono text-amber-400">
                    {init.category}
                  </span>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-2">{init.title}</h3>
                    <p className="text-xs text-slate-300 leading-relaxed mb-4">{init.description}</p>
                  </div>

                  {init.impactSummary && (
                    <div className="pt-4 border-t border-slate-800 flex items-center gap-2 text-xs text-emerald-400">
                      <CheckCircle2 className="w-4 h-4 shrink-0" />
                      <span>{init.impactSummary}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* COMMUNITY & SOCIAL IMPACT */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-mono text-emerald-400 tracking-wider uppercase block mb-2">Community & Social Uplift</span>
          <h2 className="text-3xl font-bold text-white">3. Social Impact & Community Projects</h2>
          <p className="text-slate-400 text-sm mt-3">
            Every MADECC construction site creates local opportunities, employment for youth, and infrastructure that directly benefits Cameroonian families.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {socialProjects.map((proj) => (
            <div key={proj.id} className="p-6 rounded-2xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-6 items-center">
              <img 
                src={proj.image || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80'} 
                alt={proj.title}
                className="w-full md:w-48 h-40 object-cover rounded-xl shrink-0"
              />
              <div>
                <span className="text-[11px] font-mono text-amber-400 block mb-1">{proj.category} • {proj.location}</span>
                <h3 className="text-lg font-bold text-white mb-2">{proj.title}</h3>
                <p className="text-xs text-slate-300 mb-4">{proj.description}</p>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{proj.impactMetricsText}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CALL TO ACTION */}
      <section className="py-16 bg-gradient-to-r from-amber-600 to-amber-700 text-slate-950">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-8">
          <div>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Partner with MADECC on Sustainable Construction</h2>
            <p className="text-slate-950/80 text-sm mt-2 max-w-xl">
              Ready to plan your next residential, commercial, or civil project with eco-friendly engineering and guaranteed quality?
            </p>
          </div>

          <div className="flex gap-4 shrink-0">
            <button
              onClick={() => onNavigateToTab ? onNavigateToTab('request-a-quote') : null}
              className="px-6 py-3.5 rounded-xl bg-slate-950 hover:bg-slate-900 text-white font-bold text-sm transition-all flex items-center gap-2 cursor-pointer shadow-lg"
            >
              <span>Request a Quote</span>
              <ArrowRight className="w-4 h-4 text-amber-400" />
            </button>
          </div>
        </div>
      </section>

    </div>
  );
};
