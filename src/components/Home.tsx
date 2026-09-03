import React, { useState, useEffect } from 'react';
import { getCsrfHeaders } from '../lib/csrf.ts';
import { useLanguage } from '../lib/LanguageContext.tsx';
import { 
  ArrowRight, 
  ChevronLeft, 
  ChevronRight, 
  Star, 
  CheckCircle, 
  Quote, 
  ShieldCheck, 
  Truck, 
  Cpu, 
  Hammer,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Calculator,
  Building2,
  HardHat,
  MapPin,
  FileCheck2,
  Phone,
  MessageSquare,
  Sparkles,
  Award,
  Layers,
  Ruler,
  CheckCircle2,
  X
} from 'lucide-react';
import { Service, Project, Review, HeroBanner, PageContent, HeroSectionConfig, Tenant } from '../types.ts';
import LucideIcon from './LucideIcon.tsx';
import { getOptimizedImageUrl, formatCurrency } from '../lib/utils.ts';
import { HeroBannerSkeleton, ProjectListSkeleton } from './Skeleton.tsx';
import HeroVideoPlayer from './HeroVideoPlayer.tsx';
import { TenantContentService } from '../services/tenantContentService.ts';
import { useSiteSettings } from '../lib/SiteSettingsContext.tsx';
import AnimatedCounter from './AnimatedCounter.tsx';
import { FadeIn, FadeInDirection, ScaleIn, StaggerContainer, StaggerItem, InteractiveCard, FloatElement, PulseBeacon } from './MotionReveal.tsx';
import { InteractiveQuickEstimator } from './InteractiveQuickEstimator.tsx';
import { InteractiveBlueprintPreview } from './InteractiveBlueprintPreview.tsx';
import RotatingMovingText from './RotatingMovingText.tsx';
import { motion } from 'motion/react';

interface HomeProps {
  setCurrentTab: (tab: string) => void;
  setSelectedProjectId: (id: number | null) => void;
  currentTenant?: Tenant;
}

export default function Home({ setCurrentTab, setSelectedProjectId, currentTenant }: HomeProps) {
  const { t } = useLanguage();
  const { settings } = useSiteSettings();
  const tenantId = currentTenant?.id || 1;
  const tenantProfile = TenantContentService.getProfile(tenantId);
  const tenant = currentTenant || tenantProfile.tenant;

  const tenantBanners: HeroBanner[] = [
    {
      id: 1,
      title: tenantProfile.hero.title,
      subtitle: tenantProfile.hero.subtitle,
      imageUrl: tenantProfile.hero.bannerImage,
      displayOrder: 1,
      active: true,
    },
    {
      id: 2,
      title: `${tenant.name} — Precision Civil Engineering & Execution`,
      subtitle: `${tenant.settings?.tagline || 'Structural calculation, zero-harm standards, and transparent BOQ deliverables.'} Operating across ${tenant.country || 'Cameroon'}.`,
      imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80',
      displayOrder: 2,
      active: true,
    }
  ];

  const [cmsPageData, setCmsPageData] = useState<PageContent | null>(null);
  const [banners, setBanners] = useState<HeroBanner[]>(tenantBanners);
  const [services, setServices] = useState<Service[]>(tenantProfile.services as unknown as Service[]);
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>(tenantProfile.projects as unknown as Project[]);
  const [approvedReviews, setApprovedReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  // Sync state when tenant changes
  useEffect(() => {
    const profile = TenantContentService.getProfile(tenantId);
    setBanners([
      {
        id: 1,
        title: profile.hero.title,
        subtitle: profile.hero.subtitle,
        imageUrl: profile.hero.bannerImage,
        displayOrder: 1,
        active: true,
      },
      {
        id: 2,
        title: `${profile.tenant.name} — Certified Engineering & Execution`,
        subtitle: `${profile.tenant.settings?.tagline || 'Structural calculations and certified deliverables.'} Certified compliance in ${profile.tenant.country || 'Cameroon'}.`,
        imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80',
        displayOrder: 2,
        active: true,
      }
    ]);
    setServices(profile.services as unknown as Service[]);
    setFeaturedProjects(profile.projects as unknown as Project[]);
  }, [tenantId]);

  
  // Carousel State
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // Review Carousel State
  const [currentReviewIndex, setCurrentReviewIndex] = useState(0);
  const [isHoveringReviews, setIsHoveringReviews] = useState(false);

  // Review Submission State
  const [newAuthor, setNewAuthor] = useState('');
  const [newRating, setNewRating] = useState(5);
  const [newText, setNewText] = useState('');
  const [newProject, setNewProject] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);
  const [reviewCaptcha, setReviewCaptcha] = useState('');
  const [reviewCaptchaError, setReviewCaptchaError] = useState(false);
  const [agreeReviewTerms, setAgreeReviewTerms] = useState(false);
  const [reviewErrorMsg, setReviewErrorMsg] = useState('');

  // Interactive Technical Standard Modals State
  const [activeTechnicalModal, setActiveTechnicalModal] = useState<'eurocode' | 'boq' | 'cube-tests' | null>(null);

  // Expanded Service Card index
  const [expandedServiceId, setExpandedServiceId] = useState<number | null>(null);

  // Accordion state for SEO FAQs section
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);

  // Quick Cost Estimator on Homepage State
  const [calcBuildingType, setCalcBuildingType] = useState('villa');
  const [calcArea, setCalcArea] = useState(250);
  const [calcFinishing, setCalcFinishing] = useState('medium');

  // Calculation rates in FCFA / m²
  const rateTable: Record<string, Record<string, number>> = {
    villa: { economic: 200000, medium: 290000, premium: 420000 },
    apartments: { economic: 180000, medium: 260000, premium: 380000 },
    commercial: { economic: 220000, medium: 320000, premium: 480000 },
    warehouse: { economic: 130000, medium: 180000, premium: 250000 },
  };

  const estimatedRatePerSqm = rateTable[calcBuildingType]?.[calcFinishing] || 280000;
  const estimatedTotalCost = calcArea * estimatedRatePerSqm;

  useEffect(() => {
    // Fetch home data from backend APIs with robust individual handling
    const fetchHomeData = async () => {
      setLoading(true);
      
      // 0. Fetch CMS Page Content & Hero Config
      try {
        const cmsRes = await fetch('/api/cms/pages/home');
        if (cmsRes.ok) {
          const cmsData = await cmsRes.json();
          if (cmsData.success) {
            setCmsPageData(cmsData);
            if (cmsData.seo?.metaTitle) {
              document.title = cmsData.seo.metaTitle;
            }
            if (cmsData.seo?.metaDescription) {
              const metaDesc = document.querySelector('meta[name="description"]');
              if (metaDesc) {
                metaDesc.setAttribute('content', cmsData.seo.metaDescription);
              }
            }
          }
        }
      } catch (err) {
        console.warn('Non-fatal: Error fetching CMS page contents.', err);
      }

      // 1. Fetch Banners
      try {
        const bannersRes = await fetch('/api/banners');
        if (bannersRes.ok) {
          const bannersData = await bannersRes.json();
          if (bannersData && bannersData.length > 0) {
            setBanners(bannersData);
          }
        }
      } catch (err) {
        console.warn('Non-fatal: Error fetching banners, using default local assets.', err);
      }

      // 2. Fetch Services
      try {
        const servicesRes = await fetch('/api/services');
        if (servicesRes.ok) {
          setServices(await servicesRes.json());
        }
      } catch (err) {
        console.warn('Non-fatal: Error fetching services.', err);
      }

      // 3. Fetch Projects
      try {
        const projectsRes = await fetch('/api/projects');
        if (projectsRes.ok) {
          const allProjs = await projectsRes.json();
          setFeaturedProjects(allProjs.slice(0, 3)); // Grab first 3 as featured
        }
      } catch (err) {
        console.warn('Non-fatal: Error fetching projects.', err);
      }

      // 4. Fetch Reviews
      try {
        const reviewsRes = await fetch('/api/reviews');
        if (reviewsRes.ok) {
          setApprovedReviews(await reviewsRes.json());
        }
      } catch (err) {
        console.warn('Non-fatal: Error fetching reviews.', err);
      }

      setLoading(false);
    };

    fetchHomeData();
  }, []);

  // Auto transition hero banners every 6s
  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentBannerIndex((prev) => (prev + 1) % banners.length);
    }, 6000);
    return () => clearInterval(timer);
  }, [banners]);

  // Auto transition review carousel every 5s (pauses on hover)
  useEffect(() => {
    if (approvedReviews.length <= 1 || isHoveringReviews) return;
    const timer = setInterval(() => {
      setCurrentReviewIndex((prev) => (prev + 1) % approvedReviews.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [approvedReviews, isHoveringReviews]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAuthor || !newText) return;

    if (!agreeReviewTerms) {
      setReviewErrorMsg('Please agree to our Terms & Conditions and Privacy Policy before submitting.');
      return;
    }

    if (reviewCaptcha.trim() !== '5') {
      setReviewCaptchaError(true);
      setReviewErrorMsg('Incorrect anti-bot verification answer. Please solve the equation correctly (x = 5).');
      return;
    }

    setReviewCaptchaError(false);
    setReviewErrorMsg('');
    setSubmittingReview(true);
    try {
      const csrfHeaders = await getCsrfHeaders();
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...csrfHeaders
        },
        body: JSON.stringify({
          authorName: newAuthor,
          rating: newRating,
          text: newText,
          projectName: newProject,
        }),
      });

      if (response.ok) {
        setReviewSuccess(true);
        setNewAuthor('');
        setNewText('');
        setNewProject('');
        setNewRating(5);
        setReviewCaptcha('');
        setReviewErrorMsg('');
        setTimeout(() => setReviewSuccess(false), 5000);
      } else {
        setReviewErrorMsg('Failed to post review. Please try again.');
      }
    } catch (err) {
      console.error(err);
      setReviewErrorMsg('Network failure. Please try again.');
    } finally {
      setSubmittingReview(false);
    }
  };

  const handleViewProject = (projId: number) => {
    setSelectedProjectId(projId);
    setCurrentTab('projects');
  };

  return (
    <div className="font-sans text-slate-200 bg-[#0A0A0B] min-h-screen">
      
      {/* ==========================================
          CMS DRIVEN HERO BANNER & VIDEO REEL SECTION
          ========================================== */}
      <section className="relative min-h-[680px] bg-slate-950 overflow-hidden" id="hero-section">
        <HeroVideoPlayer config={cmsPageData?.heroConfig} banners={banners}>
          <div className="max-w-3xl text-white space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 border border-amber-500/30 bg-amber-500/10 text-xs font-mono font-bold uppercase tracking-widest text-amber-400 rounded-md">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                </span>
                <Building2 className="w-3.5 h-3.5" /> Construction & Civil Engineering — Cameroon
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-300 rounded-md shadow-sm">
                <MapPin className="w-3 h-3 text-amber-500" /> HQ: {settings?.officeAddressYaounde || 'Mbankolo, Yaoundé, Cameroon'}
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight text-white drop-shadow-md">
              {settings?.siteName || 'MADECC GROUP'} — Building Cameroon’s{' '}
              <RotatingMovingText 
                words={[
                  'Future',
                  'Modern Skylines',
                  'Heavy Infrastructure',
                  'Civil Landmarks',
                  'Sustainable Tomorrow'
                ]}
                highlightClassName="text-amber-400 decoration-amber-500/60 decoration-wavy underline decoration-2 underline-offset-8"
              />
            </h1>

            <p className="text-base sm:text-lg text-slate-200 leading-relaxed font-normal max-w-2xl drop-shadow-sm">
              {settings?.tagline || 'Excellence in Civil Engineering, Infrastructure, and Commercial Complex Construction in Cameroon. Delivered with Eurocode 2 structural rigor and zero compromise.'}
            </p>

            <div className="flex flex-wrap items-center gap-4 pt-3">
              <motion.button
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentTab('request-a-quote')}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-7 py-3.5 rounded-xl text-sm transition-all shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40 flex items-center gap-2 cursor-pointer"
                id="hero-cta-quote"
              >
                Request a Free Quote <ArrowRight className="w-4 h-4" />
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentTab('budget-calculator')}
                className="bg-slate-900/90 hover:bg-slate-800 text-white font-bold px-6 py-3.5 rounded-xl text-sm border border-slate-700 hover:border-amber-500/60 hover:text-amber-400 transition-all flex items-center gap-2 shadow-md cursor-pointer"
                id="hero-cta-calculator"
              >
                <Calculator className="w-4 h-4 text-amber-500" /> Calculate Budget (FCFA)
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setCurrentTab('schedule-consultation')}
                className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 hover:text-amber-200 border border-amber-500/30 font-bold text-xs sm:text-sm px-5 py-3 rounded-xl transition-all flex items-center gap-1.5 cursor-pointer"
                id="hero-cta-consultation"
              >
                Schedule Consultation →
              </motion.button>
            </div>

            {/* Quick Trust Highlights with Interactive Modals */}
            <div className="pt-6 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <button
                type="button"
                onClick={() => setActiveTechnicalModal('eurocode')}
                className="group flex items-center gap-2.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/40 p-2.5 rounded-xl transition-all text-left text-slate-300 hover:text-white cursor-pointer"
                title="Click to view Eurocode 2 & BAEL 91 structural standards"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="font-semibold">Eurocode 2 / BAEL 91 Codes</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTechnicalModal('boq')}
                className="group flex items-center gap-2.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/40 p-2.5 rounded-xl transition-all text-left text-slate-300 hover:text-white cursor-pointer"
                title="Click to view fixed-price BOQ details"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="font-semibold">Fixed-Price Itemized BOQ</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTechnicalModal('cube-tests')}
                className="group flex items-center gap-2.5 bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-amber-500/40 p-2.5 rounded-xl transition-all text-left text-slate-300 hover:text-white cursor-pointer"
                title="Click to view 28-day concrete cube crush test certification"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform" />
                <span className="font-semibold">28-Day Concrete Cube Tests</span>
              </button>
            </div>
          </div>
        </HeroVideoPlayer>
      </section>

      {/* ==========================================
          LIVE PERFORMANCE & STATS TICKER BANNER
          ========================================== */}
      <section className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-y border-amber-500/20 py-8 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8">
            <StaggerItem className="flex items-center gap-4 p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80">
              <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/30 shrink-0">
                <Building2 className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white">
                  <AnimatedCounter value={150} suffix="+" />
                </div>
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Engineered Builds Handed Over
                </div>
              </div>
            </StaggerItem>

            <StaggerItem className="flex items-center gap-4 p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80">
              <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/30 shrink-0">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white">
                  <AnimatedCounter value={100} suffix="%" />
                </div>
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Eurocode 2 & Lab Verified
                </div>
              </div>
            </StaggerItem>

            <StaggerItem className="flex items-center gap-4 p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80">
              <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/30 shrink-0">
                <HardHat className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white">
                  <AnimatedCounter value={2.8} suffix="M+" decimals={1} />
                </div>
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Safe Man-Hours Zero LTI
                </div>
              </div>
            </StaggerItem>

            <StaggerItem className="flex items-center gap-4 p-3 rounded-2xl bg-slate-900/50 border border-slate-800/80">
              <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/30 shrink-0">
                <MapPin className="w-6 h-6" />
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-extrabold text-white">
                  <AnimatedCounter value={10} suffix=" Regions" />
                </div>
                <div className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
                  Cameroon-Wide Deployment
                </div>
              </div>
            </StaggerItem>
          </StaggerContainer>
        </div>

        {/* Continuous Architectural & Engineering Moving Text Ribbon */}
        <div className="mt-8 border-t border-slate-800/80 pt-3 overflow-hidden select-none">
          <div className="flex overflow-x-hidden whitespace-nowrap group">
            <div className="flex items-center gap-6 animate-marquee-reverse group-hover:[animation-play-state:paused] will-change-transform text-[11px] font-mono tracking-widest text-slate-400 uppercase">
              {[
                'STRUCTURAL REINFORCEMENT EUROCODE 2',
                'GEOTECHNICAL SOIL SAMPLING & CBR TESTS',
                'HIGHWAY CIVIL PAVING & ASPHALT SURFACING',
                'TURNKEY RESIDENTIAL VILLAS & DUPLEXES',
                'HYDRAULIC STORMWATER RETENTION & BASINS',
                'PRE-STRESSED CONCRETE BEAMS & GIRDERS',
                'TOWER CRANE LOGISTICS & STEEL FRAMING',
                'MEP ELECTROMECHANICAL & SOLAR MICROGRIDS',
                'BIM 3D ARCHITECTURAL MODELING',
                'TOPOGRAPHIC TOTAL STATION SURVEYS',
                '28-DAY CONCRETE CYLINDER CRUSH TESTING'
              ].concat([
                'STRUCTURAL REINFORCEMENT EUROCODE 2',
                'GEOTECHNICAL SOIL SAMPLING & CBR TESTS',
                'HIGHWAY CIVIL PAVING & ASPHALT SURFACING',
                'TURNKEY RESIDENTIAL VILLAS & DUPLEXES',
                'HYDRAULIC STORMWATER RETENTION & BASINS',
                'PRE-STRESSED CONCRETE BEAMS & GIRDERS',
                'TOWER CRANE LOGISTICS & STEEL FRAMING',
                'MEP ELECTROMECHANICAL & SOLAR MICROGRIDS',
                'BIM 3D ARCHITECTURAL MODELING',
                'TOPOGRAPHIC TOTAL STATION SURVEYS',
                '28-DAY CONCRETE CYLINDER CRUSH TESTING'
              ]).map((phrase, idx) => (
                <span key={idx} className="inline-flex items-center gap-3">
                  <span className="text-amber-500 font-bold">•</span>
                  <span className="hover:text-amber-300 transition-colors cursor-default">{phrase}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ==========================================
          ENGINEERING PILLARS & VALUE PROPOSITION
          ========================================== */}
      <section className="py-16 bg-[#0E0E10] border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <FadeIn className="text-center max-w-3xl mx-auto mb-12 space-y-2">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-widest font-mono">Why Property Owners Choose {tenant.name}</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Disciplined Engineering. Total Cost Transparency.</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              We eliminate the common pitfalls of construction in Cameroon—untested concrete mixes, unverified soil bearing, unauthorized price inflation, and absent site supervisors.
            </p>
          </FadeIn>

          <StaggerContainer className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StaggerItem className="bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl space-y-3 hover:border-slate-700 transition-colors">
              <div className="bg-amber-500/10 text-amber-500 p-3 rounded-xl border border-amber-500/20 w-fit">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Certified Structural Calculations</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Every beam, column, and foundation raft is designed in accordance with Eurocode 2 and BAEL 91 structural standards, complete with detailed Bar Bending Schedules (BBS) to prevent structural cracking.
              </p>
            </StaggerItem>

            <StaggerItem className="bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl space-y-3 hover:border-slate-700 transition-colors">
              <div className="bg-amber-500/10 text-amber-500 p-3 rounded-xl border border-amber-500/20 w-fit">
                <Layers className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">Itemized Bill of Quantities (BOQ)</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Our quantity surveyors provide exhaustive BOQs with transparent material, labor, and equipment rates in Central African CFA Francs (FCFA). You know exactly where every Franc is spent.
              </p>
            </StaggerItem>

            <StaggerItem className="bg-slate-900/50 border border-slate-800/80 p-6 rounded-2xl space-y-3 hover:border-slate-700 transition-colors">
              <div className="bg-amber-500/10 text-amber-500 p-3 rounded-xl border border-amber-500/20 w-fit">
                <HardHat className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-white text-base">On-Site Supervision & Lab Tests</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Resident civil engineers supervise all concrete batching, slump tests, and curing. Concrete test cubes are crushed at 7 and 28 days in accredited laboratories to verify compressive strength.
              </p>
            </StaggerItem>
          </StaggerContainer>

        </div>
      </section>

      {/* ==========================================
          INTERACTIVE BLUEPRINT & CODE INSPECTOR
          ========================================== */}
      <section className="py-16 bg-[#0A0A0B] border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <InteractiveBlueprintPreview onNavigateToTab={setCurrentTab} />
          </FadeIn>
        </div>
      </section>

      {/* ==========================================
          INTERACTIVE HOMEPAGE COST ESTIMATOR WIDGET
          ========================================== */}
      <section className="py-20 bg-gradient-to-b from-[#0A0A0B] via-[#0D0D10] to-[#0A0A0B] border-b border-slate-800/80" id="instant-cost-estimator">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn>
            <InteractiveQuickEstimator onNavigateToTab={setCurrentTab} currency={tenant.currency || 'XAF'} />
          </FadeIn>
        </div>
      </section>

      {/* ==========================================
          OUR CORE CONSTRUCTION & ENTERPRISE SERVICES
          ========================================== */}
      <section className="py-24 bg-[#0A0A0B]" id="services-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="max-w-3xl mx-auto text-center space-y-3 mb-16">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-widest font-mono">Comprehensive Solutions</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Our Construction & Enterprise Services</h2>
            <p className="text-slate-400 leading-relaxed text-sm">
              MADECC GROUP provides end-to-end engineering, design-build execution, and commercial advisory across Cameroon.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service) => (
              <div
                key={service.id}
                className={`bg-slate-900/50 rounded-2xl border p-6 transition-all duration-300 shadow-sm ${
                  expandedServiceId === service.id 
                    ? 'border-amber-500 ring-2 ring-amber-500/10 bg-slate-900/80' 
                    : 'border-slate-800/80 hover:border-slate-750 hover:bg-slate-900/70'
                }`}
                id={`service-card-${service.id}`}
              >
                <div className="flex items-start gap-5">
                  <div className="bg-amber-500 text-slate-950 p-3.5 rounded-xl shadow-md shrink-0">
                    <LucideIcon name={service.icon} className="w-6 h-6" />
                  </div>
                  <div className="space-y-2 flex-grow">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg text-white">{service.name}</h3>
                      <span className="text-xs font-mono font-bold bg-slate-850 px-2.5 py-1 text-slate-300 rounded border border-slate-800">
                        {service.priceRange || 'Custom Quote'}
                      </span>
                    </div>
                    <p className="text-sm text-slate-400 leading-relaxed">
                      {service.description}
                    </p>

                    {/* Expandable details */}
                    {expandedServiceId === service.id && service.details && (
                      <div className="pt-4 border-t border-slate-850 mt-4 animate-in fade-in slide-in-from-top-2 duration-200">
                        <h4 className="text-xs font-bold uppercase text-slate-500 tracking-wider mb-2">Scope of Operations:</h4>
                        <div className="grid grid-cols-1 gap-1.5">
                          {service.details.split(',').map((item, idx) => (
                            <div key={idx} className="flex items-center gap-2 text-xs text-slate-300">
                              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
                              <span>{item.trim()}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="pt-3 flex items-center justify-between">
                      <button
                        onClick={() => setCurrentTab('request-quote')}
                        className="text-xs font-bold text-amber-500 hover:text-amber-400 transition-colors"
                      >
                        Inquire for this Service →
                      </button>
                      <button
                        onClick={() => setExpandedServiceId(expandedServiceId === service.id ? null : service.id)}
                        className="text-xs font-semibold text-slate-400 hover:text-white transition-colors flex items-center gap-1 focus:outline-none"
                      >
                        {expandedServiceId === service.id ? 'Collapse' : 'View Scope'}
                        <ArrowRight className={`w-3.5 h-3.5 transition-transform ${expandedServiceId === service.id ? 'rotate-90' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <button
              onClick={() => setCurrentTab('services')}
              className="inline-flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 px-6 rounded-xl text-xs uppercase tracking-wider border border-slate-800 hover:border-amber-500 transition-all"
            >
              Explore Full 9-Module Services Directory <ArrowRight className="w-4 h-4 text-amber-500" />
            </button>
          </div>

        </div>
      </section>

      {/* ==========================================
          STRUCTURED 6-STEP DELIVERY WORKFLOW
          ========================================== */}
      <section className="py-20 bg-[#0E0E11] border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-2">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-widest font-mono">Execution Protocol</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Our 6-Step Project Delivery Methodology</h2>
            <p className="text-xs sm:text-sm text-slate-400">
              A disciplined, transparent process that eliminates uncertainty and ensures adherence to budget, schedule, and safety.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Feasibility & Land Audit',
                desc: 'Topographical survey, land title verification, site accessibility audit, and initial client architectural brief formulation.'
              },
              {
                step: '02',
                title: 'Soil Testing & Structural Design',
                desc: 'Geotechnical soil bearing capacity analysis, Eurocode 2 reinforced concrete calculations, and MEP engineering drawings.'
              },
              {
                step: '03',
                title: 'Itemized BOQ & Contract Signing',
                desc: 'Detailed Bill of Quantities with fixed material unit rates, milestone schedule definition, and formal FIDIC contract signing.'
              },
              {
                step: '04',
                title: 'Permitting & Site Mobilization',
                desc: 'Municipal building permit (Permis de Construire) filing with CUY/CUD, perimeter fencing, safety setup, and equipment mobilization.'
              },
              {
                step: '05',
                title: 'Phased Structural Execution',
                desc: 'Excavation, foundation pouring, column framing, slab cast, roofing, and finishes with daily logs and 28-day concrete crush testing.'
              },
              {
                step: '06',
                title: 'Inspection & Key Handover',
                desc: 'Final architectural snagging, MEP pressure testing, certified as-built dossiers delivery, and formal client handover with warranty.'
              }
            ].map((st, idx) => (
              <div key={idx} className="bg-slate-950/60 border border-slate-850 p-6 rounded-2xl relative space-y-3 group hover:border-slate-750 transition-all">
                <span className="font-mono font-black text-amber-500 text-lg bg-amber-500/10 px-2.5 py-1 rounded border border-amber-500/20 inline-block">
                  {st.step}
                </span>
                <h3 className="font-bold text-white text-base group-hover:text-amber-400 transition-colors">{st.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{st.desc}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ==========================================
          FEATURED PROJECTS PORTFOLIO
          ========================================== */}
      <section className="py-24 bg-[#0A0A0B]" id="featured-projects">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-4 mb-16">
            <div className="space-y-2">
              <span className="text-xs font-bold text-amber-500 uppercase tracking-widest font-mono">Structural Case Studies</span>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Featured Projects in Cameroon</h2>
              <p className="text-slate-400 leading-relaxed text-sm max-w-xl">
                A selection of contemporary residential villas, apartment complexes, and commercial facilities constructed across Cameroon.
              </p>
            </div>
            <button
              onClick={() => setCurrentTab('projects')}
              className="group text-sm font-bold text-amber-500 hover:text-amber-400 transition-colors flex items-center gap-1"
            >
              Browse Full Portfolio <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>

          {loading ? (
            <ProjectListSkeleton count={3} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredProjects.map((project) => (
                <div 
                  key={project.id} 
                  className="bg-slate-900/50 border border-slate-800/85 rounded-2xl overflow-hidden shadow-sm hover:border-slate-700/80 hover:bg-slate-900 transition-all flex flex-col h-full cursor-pointer group"
                  onClick={() => handleViewProject(project.id)}
                  id={`featured-project-${project.id}`}
                >
                  <div className="relative h-56 bg-slate-950 overflow-hidden">
                    <img
                      src={getOptimizedImageUrl(project.image, 800, 80)}
                      alt={project.title}
                      width={400}
                      height={224}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                      referrerPolicy="no-referrer"
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="absolute top-4 right-4">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-bold uppercase tracking-wider shadow ${
                        project.status === 'completed' ? 'bg-emerald-600 text-white' :
                        project.status === 'in-progress' ? 'bg-amber-500 text-slate-950' :
                        'bg-indigo-600 text-white'
                      }`}>
                        {project.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 flex flex-col justify-between flex-grow space-y-4">
                    <div className="space-y-2">
                      <span className="text-[10px] font-mono tracking-widest uppercase text-amber-500 block flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {project.location}
                      </span>
                      <h3 className="font-extrabold text-lg text-white line-clamp-1">{project.title}</h3>
                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {project.description}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-slate-850 flex items-center justify-between text-xs">
                      <div>
                        <span className="block text-[10px] text-slate-500 uppercase tracking-wider font-mono">Contract Budget</span>
                        <span className="block font-bold text-white">
                          {project.budget ? formatCurrency(project.budget, project.currency || project.currency_code || 'XAF') : 'Confidential'}
                        </span>
                      </div>
                      <span className="text-amber-500 group-hover:text-amber-400 transition-colors font-bold inline-flex items-center gap-1">
                        View Milestones <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ==========================================
          REVIEWS & TESTIMONIALS + SUBMISSION
          ========================================== */}
      <section className="py-24 bg-[#0E0E10]/80 border-y border-slate-800/80" id="testimonials-section">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-start">
            
            {/* Reviews list */}
            <div className="lg:col-span-7 space-y-8">
              <div className="space-y-2">
                <span className="text-xs font-bold text-amber-500 uppercase tracking-widest font-mono">Client Feedback</span>
                <h2 className="text-3xl font-extrabold text-white tracking-tight">Verified Client Reviews</h2>
                <p className="text-slate-400 text-sm leading-relaxed max-w-xl">
                  Client trust is our primary corporate asset. Below are verified feedback entries from completed construction handovers in Cameroon.
                </p>
              </div>

              {approvedReviews.length > 0 ? (
                <div 
                  className="relative group/carousel overflow-hidden bg-slate-950/60 border border-slate-850 rounded-2xl p-4 md:p-6"
                  onMouseEnter={() => setIsHoveringReviews(true)}
                  onMouseLeave={() => setIsHoveringReviews(false)}
                >
                  <div className="overflow-hidden relative w-full">
                    <div 
                      className="flex transition-transform duration-500 ease-in-out"
                      style={{ transform: `translateX(-${currentReviewIndex * 100}%)` }}
                    >
                      {approvedReviews.map((review) => (
                        <div 
                          key={review.id} 
                          className="w-full shrink-0 px-2 py-4 relative"
                          itemScope 
                          itemType="https://schema.org/Review"
                        >
                          <meta itemProp="datePublished" content={review.createdAt || new Date().toISOString()} />
                          <div itemProp="reviewRating" itemScope itemType="https://schema.org/Rating" className="hidden">
                            <meta itemProp="ratingValue" content={String(review.rating)} />
                            <meta itemProp="bestRating" content="5" />
                          </div>
                          
                          <Quote className="absolute right-4 top-2 w-10 h-10 text-slate-800/30 pointer-events-none" />
                          
                          <div className="flex gap-1 text-amber-500 mb-4">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star 
                                key={i} 
                                className={`w-4 h-4 ${i < review.rating ? 'fill-current' : 'text-slate-700'}`} 
                              />
                            ))}
                          </div>

                          <p itemProp="reviewBody" className="text-slate-300 text-sm sm:text-base leading-relaxed mb-6 italic min-h-[70px]">
                            "{review.text}"
                          </p>

                          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-slate-900 text-xs">
                            <div itemProp="author" itemScope itemType="https://schema.org/Person">
                              <span itemProp="name" className="font-extrabold text-white text-sm block">
                                {review.authorName}
                              </span>
                              {review.projectName && (
                                <span className="text-[10px] text-slate-500 font-mono tracking-wider block uppercase mt-0.5">
                                  Project: <span itemProp="itemReviewed">{review.projectName}</span>
                                </span>
                              )}
                            </div>
                            
                            <span className="text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider inline-flex items-center gap-1.5 select-none">
                              <CheckCircle className="w-3.5 h-3.5" /> Verified Handover
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Chevrons */}
                  {approvedReviews.length > 1 && (
                    <div className="flex items-center justify-between mt-4 px-2 pt-4 border-t border-slate-900">
                      <button
                        onClick={() => setCurrentReviewIndex((prev) => (prev - 1 + approvedReviews.length) % approvedReviews.length)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-850 text-slate-400 hover:text-white transition-colors"
                        aria-label="Previous review"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <div className="flex gap-1.5">
                        {approvedReviews.map((_, idx) => (
                          <button
                            key={idx}
                            onClick={() => setCurrentReviewIndex(idx)}
                            className={`h-1.5 rounded-full transition-all duration-300 ${idx === currentReviewIndex ? 'w-5 bg-amber-500' : 'w-1.5 bg-slate-800'}`}
                            aria-label={`Slide ${idx + 1}`}
                          />
                        ))}
                      </div>

                      <button
                        onClick={() => setCurrentReviewIndex((prev) => (prev + 1) % approvedReviews.length)}
                        className="p-1.5 rounded-lg bg-slate-900 border border-slate-850 text-slate-400 hover:text-white transition-colors"
                        aria-label="Next review"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-slate-900/50 border border-slate-800 p-8 text-center rounded-2xl text-slate-400 text-xs">
                  <p>Client reviews are verified after project handover. Use the form to submit your feedback.</p>
                </div>
              )}
            </div>

            {/* Submit a Review Form */}
            <div className="lg:col-span-5 bg-slate-950 border border-slate-850 rounded-2xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-amber-500" />
              <div className="space-y-2 mb-6">
                <h3 className="font-extrabold text-xl text-white">Submit Handover Feedback</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Have we completed a project for you? Submit your honest review for verification.
                </p>
              </div>

              {reviewSuccess ? (
                <div className="bg-emerald-950/40 border border-emerald-800 text-emerald-300 p-6 rounded-xl text-sm flex flex-col items-center text-center gap-3">
                  <CheckCircle className="w-10 h-10 text-emerald-500" />
                  <div>
                    <span className="font-bold block text-base mb-1">Feedback Received</span>
                    <span className="text-xs">Your review has been submitted for administrative verification and will appear on the portal once approved.</span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleReviewSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="review-author" className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1">Your Full Name</label>
                    <input
                      id="review-author"
                      type="text"
                      className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 px-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                      placeholder="e.g. Richard Ndip"
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="review-rating" className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1">Rating</label>
                      <select
                        id="review-rating"
                        aria-label="Rating"
                        className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 px-3 text-sm text-white outline-none"
                        value={newRating}
                        onChange={(e) => setNewRating(parseInt(e.target.value))}
                      >
                        <option value="5">5 - Exceptional</option>
                        <option value="4">4 - High Quality</option>
                        <option value="3">3 - Satisfactory</option>
                        <option value="2">2 - Needs Improvement</option>
                        <option value="1">1 - Unsatisfactory</option>
                      </select>
                    </div>

                    <div>
                      <label htmlFor="review-project" className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1">Project / Location</label>
                      <input
                        id="review-project"
                        type="text"
                        className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 px-3 text-sm text-white placeholder-slate-600 outline-none transition-all"
                        placeholder="e.g. Odza Duplex"
                        value={newProject}
                        onChange={(e) => setNewProject(e.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="review-text" className="block text-xs font-bold text-slate-300 uppercase tracking-wide mb-1">Your Review</label>
                    <textarea
                      id="review-text"
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-800 focus:border-amber-500 rounded-xl py-2.5 px-3 text-sm text-white placeholder-slate-600 outline-none transition-all resize-none"
                      placeholder="Describe your experience with our construction execution..."
                      value={newText}
                      onChange={(e) => setNewText(e.target.value)}
                      required
                    />
                  </div>

                  {/* Anti-Bot Human Verification */}
                  <div className="bg-slate-900/60 border border-slate-850 p-3.5 rounded-xl space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-300 uppercase tracking-wide text-[11px]">
                        Anti-Bot Verification
                      </span>
                      <span className="font-mono text-amber-500 font-bold text-[10px]">
                        Solve: 15x + 5x - 10 = 90
                      </span>
                    </div>
                    <input
                      type="text"
                      id="home-review-captcha"
                      aria-label="Solve mathematical equation to post review"
                      className={`w-full bg-slate-950 border ${reviewCaptchaError ? 'border-red-500' : 'border-slate-800'} focus:border-amber-500 rounded-xl py-2 px-3 text-xs text-white placeholder-slate-600 outline-none`}
                      placeholder="What is x? (e.g. 5)"
                      value={reviewCaptcha}
                      onChange={(e) => {
                        setReviewCaptcha(e.target.value);
                        setReviewCaptchaError(false);
                      }}
                      required
                    />
                  </div>

                  {/* Terms & Conditions Agreement */}
                  <div className="flex items-start gap-2.5 pt-1">
                    <input
                      type="checkbox"
                      id="agreeReviewTerms"
                      checked={agreeReviewTerms}
                      onChange={(e) => setAgreeReviewTerms(e.target.checked)}
                      className="mt-0.5 w-4 h-4 rounded border-slate-700 bg-slate-950 text-amber-500 focus:ring-amber-500/20"
                      required
                    />
                    <label htmlFor="agreeReviewTerms" className="text-[11px] text-slate-400 leading-tight select-none">
                      I agree to the <button type="button" onClick={() => setCurrentTab('terms')} className="text-amber-400 hover:underline">Terms & Conditions</button> and <button type="button" onClick={() => setCurrentTab('privacy')} className="text-amber-400 hover:underline">Privacy Policy</button>.
                    </label>
                  </div>

                  {reviewErrorMsg && (
                    <div className="bg-red-950/40 border border-red-800 text-red-300 p-3 rounded-lg text-xs">
                      <span>{reviewErrorMsg}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submittingReview}
                    className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-3 px-4 rounded-xl text-xs uppercase tracking-wider transition-all cursor-pointer"
                  >
                    {submittingReview ? 'Submitting...' : 'Post Client Review'}
                  </button>
                </form>
              )}
            </div>

          </div>

        </div>
      </section>

      {/* ==========================================
          SEO FAQ SECTION (CAMEROON BUILDING CODES)
          ========================================== */}
      <section className="py-24 bg-[#0A0A0C]" id="seo-faq-section">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <div className="text-center space-y-3 mb-16">
            <span className="text-xs font-bold text-amber-500 uppercase tracking-widest font-mono">Expert Answers & Guidelines</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Frequently Asked Questions</h2>
            <p className="text-slate-400 leading-relaxed text-sm max-w-2xl mx-auto">
              Answers regarding construction permits in Cameroon, soil testing, cost per square metre, concrete mix design, and diaspora project supervision.
            </p>
          </div>

          <div className="space-y-4" id="faq-accordions-group">
            {[
              {
                q: `Where is ${settings?.siteName || 'MADECC GROUP'} headquartered and where do you operate in Cameroon?`,
                a: `${settings?.siteName || 'MADECC GROUP'} is headquartered in ${settings?.officeAddressYaounde || 'Mbankolo, Yaoundé, Cameroon'}. We operate across all 10 regions of Cameroon: Centre (Yaoundé), Littoral (Douala), South (Kribi), West (Bafoussam), North-West (Bamenda), South-West (Limbe/Buea), East (Bertoua), and Northern regions (Garoua, Maroua, Ngaoundéré). We deploy resident site supervisors and mobile machinery to urban and peri-urban locations.`
              },
              {
                q: "How does MADECC GROUP ensure accurate construction pricing in FCFA?",
                a: "We prepare detailed, itemized Bills of Quantities (BOQ) breaking down every component into materials (cement, high-yield rebar, sand, gravel), skilled labor (masons, iron fixers, carpenters), equipment plant hire, and preliminaries. We use transparent unit rates based on real-time market rates across Cameroon and fix the price in formal contract milestones."
              },
              {
                q: "Does MADECC GROUP handle the municipal building permit (Permis de Construire)?",
                a: "Yes. Our engineering and architectural team prepares the complete technical permit dossier (dossier de permis de construire) including architectural plans, structural calculation notes, geotechnical soil analysis, and sanitation plans. We coordinate directly with the Yaoundé Urban Council (CUY), Douala Urban Council (CUD), and regional municipal councils."
              },
              {
                q: "How do you manage construction projects for Cameroonians in the diaspora?",
                a: "We provide diaspora property developers with complete transparency: weekly high-resolution photo and video logs, drone progress scans, milestone-based bank escrow payments, and dedicated WhatsApp communication with the lead civil engineer. Funds are only drawn when milestones (e.g. foundation slab pour, first floor slab) are certified."
              },
              {
                q: "Why is geotechnical soil testing essential before building in Cameroon?",
                a: "Cameroon features diverse soil types: marshy, low-bearing coastal ground in Douala and Kribi requiring reinforced raft foundations or micro-piles, and lateritic clay or rocky terrains in Yaoundé and Bafoussam. A soil test (Penetrometer / CPT) determines the safe bearing capacity and prevents severe foundation settling and wall cracking."
              },
              {
                q: "What concrete strength standards are enforced on MADECC GROUP sites?",
                a: "All reinforced concrete elements (footings, columns, ring beams, slabs) are dosed at a minimum of 350 kg/m³ using CEM II 42.5R cement. We perform standard slump tests on-site and cast 150mm test cubes for 7-day and 28-day compression crush testing in accredited civil engineering laboratories."
              }
            ].map((faq, idx) => {
              const isExpanded = expandedFaqIndex === idx;
              return (
                <div 
                  key={idx}
                  className="bg-slate-900/40 border border-slate-850 rounded-2xl overflow-hidden transition-all duration-300"
                  id={`faq-item-${idx}`}
                >
                  <button
                    onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                    className="w-full text-left p-5 flex items-center justify-between gap-4 focus:outline-none hover:bg-slate-900/80 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <HelpCircle className="w-5 h-5 text-amber-500 shrink-0" />
                      <span className="font-bold text-sm text-slate-100 hover:text-white transition-colors">{faq.q}</span>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-amber-500 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-500 shrink-0" />
                    )}
                  </button>
                  
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 text-xs text-slate-300 border-t border-slate-850/60 bg-slate-950/30 leading-relaxed font-sans animate-in fade-in slide-in-from-top-2 duration-200">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Call to action badge */}
          <div className="mt-12 text-center bg-gradient-to-r from-amber-500/5 via-amber-500/10 to-amber-500/5 border border-amber-500/20 rounded-2xl p-8 space-y-3">
            <h3 className="text-base font-bold text-white">Have a Specific Project in Mind in Cameroon?</h3>
            <p className="text-xs text-slate-400 max-w-xl mx-auto">
              Our civil engineers and quantity surveyors are available to review your architectural plans, land title, or project requirements.
            </p>
            <div className="pt-2 flex flex-wrap justify-center gap-3">
              <button 
                onClick={() => setCurrentTab('contact')}
                className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold uppercase tracking-wider py-3 px-6 rounded-xl transition-all"
              >
                Contact Our Engineering Office <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <a 
                href="https://wa.me/237683316486" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold uppercase tracking-wider py-3 px-6 rounded-xl transition-all"
              >
                Chat on WhatsApp (+237 683 31 64 86)
              </a>
            </div>
          </div>

        </div>
      </section>

      {/* ==========================================
          INTERACTIVE TECHNICAL STANDARD MODALS
          ========================================== */}
      {activeTechnicalModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl rounded-2xl p-6 sm:p-8 shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setActiveTechnicalModal(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white p-2 rounded-lg bg-slate-800/80 hover:bg-slate-800 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            {activeTechnicalModal === 'eurocode' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Eurocode 2 & BAEL 91 Structural Codes</h3>
                    <p className="text-xs text-amber-500 font-mono">EN 1992-1-1 & Certified National Order of Civil Engineers (ONIGC)</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                  <p>
                    At <strong>MADECC GROUP</strong>, every beam, column, slab, and foundation is rigorously calculated under <strong className="text-white">Eurocode 2 (EN 1992-1-1)</strong> and validated against French-Cameroonian <strong className="text-white">BAEL 91 (Béton Armé aux États Limites)</strong> standards.
                  </p>
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-slate-400">Structural Safety Limit State:</span>
                      <span className="font-mono text-emerald-400 font-semibold">ELU (Ultimate) & ELS (Serviceability)</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-slate-400">Earthquake & Wind Load:</span>
                      <span className="font-mono text-emerald-400 font-semibold">Eurocode 1 & 8 Zone Cameroon</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Engineering Approval:</span>
                      <span className="font-mono text-emerald-400 font-semibold">Stamped by Licensed ONIGC Engineers</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">
                    Calculations account for equatorial soil conditions in Yaoundé (lateritic clay), Douala (coastal marine alluvial soil), and Kribi (high water table).
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setActiveTechnicalModal(null);
                      setCurrentTab('schedule-consultation');
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all"
                  >
                    Schedule Consultation With Our Engineers
                  </button>
                  <button
                    onClick={() => {
                      setActiveTechnicalModal(null);
                      setCurrentTab('request-a-quote');
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all"
                  >
                    Request Structural Quote
                  </button>
                </div>
              </div>
            )}

            {activeTechnicalModal === 'boq' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <Calculator className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Fixed-Price Itemized BOQ (Devis Quantitatif Estimatif)</h3>
                    <p className="text-xs text-amber-500 font-mono">100% Transparent Unit Costing in FCFA (XAF) • Zero Hidden Fees</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                  <p>
                    MADECC GROUP eliminates contractor inflation and unexpected price hikes through a rigorous, transparent <strong className="text-white">Bill of Quantities (BOQ / DQE)</strong>.
                  </p>
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-slate-400">Material Transparency:</span>
                      <span className="font-mono text-emerald-400 font-semibold">Exact Kg of FE E500 rebar & cement bags</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-slate-400">Contractual Commitment:</span>
                      <span className="font-mono text-emerald-400 font-semibold">Firm Fixed-Price Contract</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Disbursement Schedule:</span>
                      <span className="font-mono text-emerald-400 font-semibold">Milestone-linked payments with proof</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">
                    Designed specifically for local clients and Cameroonians in the diaspora (France, USA, Canada, UK, Germany) to supervise financial disbursements with complete confidence.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setActiveTechnicalModal(null);
                      setCurrentTab('budget-calculator');
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all"
                  >
                    Open Online Budget Calculator
                  </button>
                  <button
                    onClick={() => {
                      setActiveTechnicalModal(null);
                      setCurrentTab('request-a-quote');
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all"
                  >
                    Request Custom Itemized BOQ
                  </button>
                </div>
              </div>
            )}

            {activeTechnicalModal === 'cube-tests' && (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">28-Day Concrete Cube Compressive Tests</h3>
                    <p className="text-xs text-amber-500 font-mono">NF EN 12390-3 • C25/30 & C30/37 Lab Certification</p>
                  </div>
                </div>

                <div className="space-y-3 text-sm text-slate-300 leading-relaxed">
                  <p>
                    We never compromise on structural integrity. For every major concrete pour (footings, columns, suspended slabs, lintels), sample concrete test cubes are cast on-site and crushed under hydraulic press at accredited laboratory facilities (Labo-Génie or accredited national testing labs).
                  </p>
                  <div className="bg-slate-950/60 p-4 rounded-xl border border-slate-800 space-y-2 text-xs">
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-slate-400">7-Day Curing Test:</span>
                      <span className="font-mono text-emerald-400 font-semibold">Minimum 65% design strength validation</span>
                    </div>
                    <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                      <span className="text-slate-400">14-Day Curing Test:</span>
                      <span className="font-mono text-emerald-400 font-semibold">Minimum 90% strength validation</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">28-Day Official Strength:</span>
                      <span className="font-mono text-emerald-400 font-semibold">≥ 25 MPa to 35 MPa (Certified Certificate)</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-400">
                    Clients receive copies of all certified crushing reports, slump cone tests, and cement batch quality tracking documents for the project record.
                  </p>
                </div>

                <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-3">
                  <button
                    onClick={() => {
                      setActiveTechnicalModal(null);
                      setCurrentTab('schedule-consultation');
                    }}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all"
                  >
                    Schedule Quality Inspection
                  </button>
                  <button
                    onClick={() => {
                      setActiveTechnicalModal(null);
                      setCurrentTab('contact');
                    }}
                    className="bg-slate-800 hover:bg-slate-700 text-white font-semibold px-5 py-2.5 rounded-xl text-xs uppercase tracking-wider transition-all"
                  >
                    Contact Quality Control Lab
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
