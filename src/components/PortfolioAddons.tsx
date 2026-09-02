import React, { useState } from 'react';
import { 
  Award, 
  Briefcase, 
  ChevronDown, 
  ChevronUp, 
  Clock, 
  Globe2, 
  HelpCircle, 
  Quote, 
  ShieldCheck, 
  Sparkles, 
  TrendingUp, 
  Users2, 
  HardHat,
  Layers,
  MapPin,
  Building2,
  CheckCircle2,
  Ruler,
  FileCheck2,
  Scale
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import RotatingMovingText from './RotatingMovingText.tsx';

// ==========================================
// 1. BEFORE AND AFTER INTERACTIVE SLIDER
// ==========================================
export function BeforeAfterGallery() {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);

  const handleMove = (clientX: number, containerRect: DOMRect) => {
    const x = clientX - containerRect.left;
    const percentage = Math.max(0, Math.min(100, (x / containerRect.width) * 100));
    setSliderPos(percentage);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const container = e.currentTarget.getBoundingClientRect();
    if (e.touches[0]) {
      handleMove(e.touches[0].clientX, container);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging && e.type !== 'click') return;
    const container = e.currentTarget.getBoundingClientRect();
    handleMove(e.clientX, container);
  };

  return (
    <div className="py-16 border-t border-slate-900 bg-slate-950/25">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold font-mono uppercase text-amber-500 tracking-widest block mb-2">Phase Transformation</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Excavation to Structural Completion</h2>
          <p className="text-sm text-slate-400 mt-2">
            Drag the comparison slider to observe the progression from raw geotechnical excavation to completed reinforced superstructure.
          </p>
        </div>

        {/* Sliding Widget Frame */}
        <div 
          className="relative h-[30rem] w-full max-w-4xl mx-auto rounded-2xl overflow-hidden border border-slate-800 shadow-2xl select-none cursor-ew-resize"
          onMouseMove={handleMouseMove}
          onTouchMove={handleTouchMove}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onClick={(e) => {
            const container = e.currentTarget.getBoundingClientRect();
            handleMove(e.clientX, container);
          }}
        >
          {/* AFTER IMAGE (Background) */}
          <div className="absolute inset-0">
            <img 
              src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80" 
              alt="Completed Structural Execution" 
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-6 right-6 bg-emerald-600 text-white font-mono text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-md shadow-lg border border-emerald-400/40">
              Phase 2: Completed Handover
            </div>
          </div>

          {/* BEFORE IMAGE (Foreground clip-path) */}
          <div 
            className="absolute inset-0 transition-all duration-75"
            style={{ clipPath: `polygon(0 0, ${sliderPos}% 0, ${sliderPos}% 100%, 0 100%)` }}
          >
            <img 
              src="https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=80" 
              alt="Initial Site Excavation" 
              className="w-full h-full object-cover filter contrast-110"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-6 left-6 bg-slate-900/90 text-amber-400 font-mono text-xs font-bold uppercase tracking-wider px-3.5 py-1.5 rounded-md shadow-lg border border-amber-500/30">
              Phase 1: Substructure & Foundation Pour
            </div>
          </div>

          {/* SLIDER CONTROLLER HANDLE */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-amber-500 cursor-ew-resize transition-all duration-75"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-10 w-10 rounded-full bg-amber-500 border-4 border-slate-950 text-slate-950 shadow-2xl flex items-center justify-center">
              <svg className="w-5 h-5 font-black" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l-4 4 4 4m8 0l4-4-4-4" />
              </svg>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 2. COMPANY CHRONOLOGICAL METHODOLOGY
// ==========================================
export function CompanyTimeline() {
  const milestones = [
    {
      year: 'Stage 01',
      title: 'Geotechnical Investigation & Survey',
      desc: 'Topographical land mapping and dynamic cone penetrometer (CPT) soil bearing tests across Cameroon site conditions.'
    },
    {
      year: 'Stage 02',
      title: 'Structural Calculation Dossier',
      desc: 'Eurocode 2 / BAEL 91 structural design, foundation raft calculations, and permit submission to CUY / CUD municipal authorities.'
    },
    {
      year: 'Stage 03',
      title: 'Itemized BOQ Pricing & FIDIC Contracting',
      desc: 'Preparation of exhaustive bills of quantities with transparent material, labor, and plant rates in Central African CFA Francs.'
    },
    {
      year: 'Stage 04',
      title: 'Supervised Structural Pouring & Batching',
      desc: 'Resident civil engineer oversight on concrete dosing (350 kg/m³), steel rebar cage inspection, and 28-day laboratory cube crush tests.'
    },
    {
      year: 'Stage 05',
      title: 'MEP Integration & Architectural Finishes',
      desc: 'Installation of plumbing, electrical distribution, high-grade tile finishes, thermal insulation, and roofing assemblies.'
    }
  ];

  return (
    <div className="py-16 border-t border-slate-900 bg-slate-950/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="text-xs font-bold font-mono uppercase text-amber-500 tracking-widest block mb-2">Quality Protocol</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">MADECC Project Execution Framework</h2>
          <p className="text-sm text-slate-400 mt-2">
            The sequential technical stages enforced on every civil construction site in Cameroon.
          </p>
        </div>

        {/* Timeline Grid */}
        <div className="relative border-l border-slate-800 ml-4 md:ml-32 space-y-10">
          {milestones.map((item, idx) => (
            <div key={idx} className="relative pl-8 md:pl-12 group">
              {/* Year Label */}
              <div className="absolute -left-4 md:-left-36 top-1 text-right w-24 hidden md:block">
                <span className="text-sm font-bold text-amber-500 font-mono tracking-wider">{item.year}</span>
              </div>

              {/* Node Indicator Dot */}
              <div className="absolute -left-1.5 top-2 h-3.5 w-3.5 rounded-full bg-slate-950 border-2 border-amber-500 group-hover:bg-amber-500 transition-colors shadow-lg" />

              {/* Card */}
              <div className="bg-[#0E0E11] border border-slate-850/80 hover:border-slate-800 p-6 rounded-xl shadow-md transition-all">
                <div className="flex items-center gap-2 md:hidden mb-2">
                  <span className="text-xs font-bold text-amber-500 font-mono bg-amber-500/10 px-2.5 py-0.5 rounded border border-amber-500/20">{item.year}</span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-amber-500 transition-colors">{item.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-2">{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 3. FAQS INTERACTIVE ACCORDION
// ==========================================
export function FAQSection() {
  const faqs = [
    {
      q: "What construction codes are adhered to by MADECC GROUP?",
      a: "Our civil and structural engineers calculate load-bearing members according to Eurocode 2 (Design of Concrete Structures) and French BAEL 91 standards, verified through accredited civil engineering calculation sheets."
    },
    {
      q: "How does MADECC GROUP support Cameroonians in the diaspora building locally?",
      a: "We provide diaspora property developers with complete financial and visual transparency: milestone escrow releases, weekly high-resolution drone photo/video progress reports, and certified site logbooks."
    },
    {
      q: "Can MADECC GROUP assist with municipal building permit dossiers (Permis de Construire)?",
      a: "Yes. We prepare the complete architectural and structural submission dossier, including geotechnical soil analysis and MEP plans, coordinating directly with the Yaoundé (CUY) and Douala (CUD) Urban Councils."
    },
    {
      q: "How are construction estimates structured?",
      a: "All estimates are provided as detailed Bills of Quantities (BOQ) with clear unit prices for cement, sand, gravel, high-yield steel rebar, and skilled artisanal labor in Central African CFA Francs (FCFA)."
    }
  ];

  const [openIdx, setOpenIdx] = useState<number | null>(0);

  return (
    <div className="py-16 border-t border-slate-900 bg-slate-950/20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-bold font-mono uppercase text-amber-500 tracking-widest block mb-2">Engineering Guidance</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
          <p className="text-sm text-slate-400 mt-2">
            Technical answers regarding construction permitting, geotechnical testing, and cost estimation in Cameroon.
          </p>
        </div>

        {/* Accordions */}
        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div 
                key={idx}
                className="border border-slate-850/80 rounded-xl bg-slate-900/20 overflow-hidden"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left text-xs font-bold uppercase tracking-wider text-white hover:bg-slate-900/60 transition-colors"
                >
                  <span className="flex items-center gap-2.5">
                    <HelpCircle className="w-4 h-4 text-amber-500 shrink-0" />
                    {faq.q}
                  </span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-amber-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
                </button>
                
                <AnimatePresence initial={false}>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      <div className="p-5 pt-0 border-t border-slate-850/30 text-xs text-slate-400 leading-relaxed font-sans">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 4. TECHNICAL ASSURANCE PILLARS
// ==========================================
export function CompanyStats() {
  const pillars = [
    { icon: <ShieldCheck className="w-6 h-6 text-amber-500" />, title: 'Eurocode 2 / BAEL 91', desc: 'Certified structural concrete calculations' },
    { icon: <Layers className="w-6 h-6 text-emerald-400" />, title: '350 kg/m³ Batching', desc: 'Standard dosage for reinforced elements' },
    { icon: <MapPin className="w-6 h-6 text-sky-400" />, title: '10 Cameroon Regions', desc: 'Active deployment across Yaoundé, Douala & beyond' },
    { icon: <Scale className="w-6 h-6 text-amber-500" />, title: 'Itemized BOQ in FCFA', desc: 'Transparent fixed-price cost schedules' }
  ];

  return (
    <div className="py-12 border-t border-slate-900 bg-[#0E0E11]/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {pillars.map((pillar, idx) => (
            <div key={idx} className="bg-slate-900/40 border border-slate-850 p-6 rounded-xl flex items-start gap-4 hover:border-slate-800 transition-colors">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 shrink-0">
                {pillar.icon}
              </div>
              <div>
                <span className="block text-sm font-bold text-white">{pillar.title}</span>
                <span className="block text-xs text-slate-400 mt-1">{pillar.desc}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 5. TESTIMONIALS & QUALITY COMMITMENT
// ==========================================
export function TestimonialsAndPartners() {
  const qualityCommitments = [
    {
      title: "Geotechnical Due Diligence",
      desc: "No foundation is poured without verifying soil bearing capacity (bars/bars per cm²) and groundwater tables.",
    },
    {
      title: "Material Testing Verification",
      desc: "Concrete test cylinders and cubes crushed at 7-day and 28-day intervals to verify target compressive strength (C25/30).",
    },
    {
      title: "Diaspora Project Escrow",
      desc: "Disbursements tied strictly to engineer-verified milestone completion with comprehensive video logbooks.",
    }
  ];

  return (
    <div className="py-16 border-t border-slate-900 bg-slate-950/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-bold font-mono uppercase text-amber-500 tracking-widest block">Quality Assurance</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Our Engineering Standards</h2>
          <p className="text-xs sm:text-sm text-slate-400">
            Stringent quality control protocols applied across all residential and commercial building sites.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {qualityCommitments.map((item, idx) => (
            <div key={idx} className="bg-slate-900/40 border border-slate-850 p-6 rounded-xl space-y-3 hover:border-slate-800 transition-colors">
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-500 flex items-center justify-center font-bold text-xs font-mono">
                0{idx + 1}
              </div>
              <h3 className="text-sm font-bold text-white">{item.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==========================================
// 6. HERO SECTION
// ==========================================
export function PortfolioHero() {
  return (
    <section className="bg-slate-950/80 border-b border-slate-850/60 text-white py-20 relative overflow-hidden" id="projects-header">
      <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#f59e0b_1px,transparent_1px)] [background-size:16px_16px]" />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative text-center max-w-3xl">
        <span className="text-xs font-bold font-mono uppercase text-amber-500 tracking-widest bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full inline-block mb-4">
          Construction Execution Portfolio
        </span>
        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
          Structural Projects in Cameroon:{' '}
          <RotatingMovingText 
            words={[
              'Commercial Towers',
              'Luxury Duplexes',
              'Highway Arteries',
              'Hydraulic Drainage',
              'Industrial Complexes'
            ]}
            highlightClassName="text-amber-400 decoration-amber-500/50 underline decoration-wavy decoration-2 underline-offset-8"
          />
        </h1>
        <p className="text-slate-400 text-sm sm:text-base mt-4 leading-relaxed">
          Explore completed and active residential villas, apartment complexes, commercial facilities, and earthwork developments managed by MADECC GROUP across Cameroon.
        </p>

        {/* Highlight Badges */}
        <div className="flex flex-wrap justify-center gap-3 mt-8">
          <motion.div 
            whileHover={{ y: -2 }}
            className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Turnkey Delivery</span>
          </motion.div>
          <motion.div 
            whileHover={{ y: -2 }}
            className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Milestone-Based Reporting</span>
          </motion.div>
          <motion.div 
            whileHover={{ y: -2 }}
            className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg text-xs font-mono text-slate-300"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Fixed FCFA Contract Rates</span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

// ==========================================
// 7. GOOGLE ADSENSE PRIVACY AND DISCLAIMER LINKS
// ==========================================
export function AdSenseReadinessBlock() {
  return (
    <div className="py-8 bg-[#070709] border-t border-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-slate-500 text-[10px] font-mono space-y-2">
        <p>© {new Date().getFullYear()} MADECC GROUP Cameroon. All rights reserved.</p>
        <div className="flex justify-center gap-4 text-slate-400">
          <a href="/privacy-policy" className="hover:text-amber-500 transition-colors">Privacy Policy</a>
          <span>•</span>
          <a href="/terms" className="hover:text-amber-500 transition-colors">Terms of Service</a>
          <span>•</span>
          <a href="/cookie-policy" className="hover:text-amber-500 transition-colors">Cookie Policy</a>
          <span>•</span>
          <a href="/disclaimer" className="hover:text-amber-500 transition-colors">Disclaimer</a>
        </div>
      </div>
    </div>
  );
}
