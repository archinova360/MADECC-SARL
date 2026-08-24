import { useState, useEffect } from 'react';
import { 
  FolderKanban, 
  MapPin, 
  Banknote, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  ChevronLeft, 
  SlidersHorizontal,
  Target,
  Video,
  Image as ImageIcon,
  Play,
  LayoutGrid
} from 'lucide-react';
import { Project, Category, ProjectProgress, GalleryItem } from '../types.ts';
import { getOptimizedImageUrl, formatCurrency } from '../lib/utils.ts';
import { ProjectListSkeleton } from './Skeleton.tsx';
import { 
  PortfolioHero, 
  BeforeAfterGallery, 
  CompanyTimeline, 
  FAQSection, 
  CompanyStats, 
  TestimonialsAndPartners, 
  AdSenseReadinessBlock 
} from './PortfolioAddons.tsx';

interface ProjectsProps {
  selectedProjectId: number | null;
  setSelectedProjectId: (id: number | null) => void;
}

export default function Projects({ selectedProjectId, setSelectedProjectId }: ProjectsProps) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [loadingProjects, setLoadingProjects] = useState(true);
  
  // Tab selector: 'landmark' (standard contracts/projects) vs 'updates' (galleryItems)
  const [activeSubTab, setActiveSubTab] = useState<'landmark' | 'updates'>('landmark');
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [selectedGalleryCategory, setSelectedGalleryCategory] = useState<string | null>(null);
  
  // Active Project Detail states
  const [activeProject, setActiveProject] = useState<Project | null>(null);
  const [loadingProjectDetail, setLoadingProjectDetail] = useState(false);
  
  // Fetch full lists of projects, categories, and gallery items
  useEffect(() => {
    const fetchData = async () => {
      setLoadingProjects(true);
      try {
        const [projRes, catRes, galRes] = await Promise.all([
          fetch('/api/projects'),
          fetch('/api/categories'),
          fetch('/api/gallery')
        ]);
        if (projRes.ok) setProjects(await projRes.json());
        if (catRes.ok) setCategories(await catRes.json());
        if (galRes.ok) setGalleryItems(await galRes.json());
      } catch (err) {
        console.error('Error fetching portfolio data:', err);
      } finally {
        setLoadingProjects(false);
      }
    };
    fetchData();
  }, []);

  // Fetch individual project details (with milestones progress list!) when selectedProjectId updates
  useEffect(() => {
    if (!selectedProjectId) {
      setActiveProject(null);
      return;
    }
    const fetchProjectDetails = async () => {
      setLoadingProjectDetail(true);
      try {
        const res = await fetch(`/api/projects/${selectedProjectId}`);
        if (res.ok) {
          const data = await res.json();
          setActiveProject(data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoadingProjectDetail(false);
      }
    };
    fetchProjectDetails();
  }, [selectedProjectId]);

  // Handle filtering
  const filteredProjects = selectedCategory
    ? projects.filter(p => p.categoryId === selectedCategory)
    : projects;

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'TBA';
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Render detail screen of a specific project
  if (selectedProjectId && activeProject) {
    // Calculate total average progress from milestones
    const progressList = activeProject.progress || [];
    const avgProgress = progressList.length > 0 
      ? Math.round(progressList.reduce((acc, curr) => acc + curr.percentage, 0) / progressList.length)
      : 0;

    return (
      <div className="font-sans text-slate-200 bg-[#0A0A0B] min-h-screen py-12" id="project-detail-view">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Back to Portfolio button */}
          <button
            onClick={() => setSelectedProjectId(null)}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-400 hover:text-amber-500 transition-colors mb-8 uppercase tracking-wider bg-slate-900 px-4 py-2 border border-slate-800 rounded-lg shadow-sm"
            id="back-to-portfolio"
          >
            <ChevronLeft className="w-4 h-4" /> Back to Full Portfolio
          </button>

          {loadingProjectDetail ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start animate-pulse">
              {/* Left Column Skeleton */}
              <div className="lg:col-span-6 space-y-8">
                <div className="relative h-96 bg-slate-900 rounded-2xl border border-slate-800/60" />
                <div className="bg-slate-900/40 border border-slate-800/40 rounded-2xl p-6 space-y-4">
                  <div className="h-5 bg-slate-900 rounded w-1/3" />
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-900/60 rounded w-1/2" />
                      <div className="h-4 bg-slate-900 rounded w-3/4" />
                    </div>
                    <div className="space-y-2">
                      <div className="h-3 bg-slate-900/60 rounded w-1/2" />
                      <div className="h-4 bg-slate-900 rounded w-3/4" />
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Right Column Skeleton */}
              <div className="lg:col-span-6 space-y-6">
                <div className="space-y-3">
                  <div className="h-4 bg-slate-900/60 rounded w-1/4" />
                  <div className="h-8 bg-slate-900 rounded w-3/4" />
                  <div className="h-4 bg-slate-900/80 rounded w-full" />
                  <div className="h-4 bg-slate-900/80 rounded w-11/12" />
                </div>
                
                <div className="pt-6 border-t border-slate-800 space-y-4">
                  <div className="h-5 bg-slate-900 rounded w-1/3" />
                  <div className="space-y-3">
                    <div className="h-14 bg-slate-900/50 rounded-xl" />
                    <div className="h-14 bg-slate-900/50 rounded-xl" />
                    <div className="h-14 bg-slate-900/50 rounded-xl" />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
              
              {/* Column Left: Visual Specs & Details */}
              <div className="lg:col-span-6 space-y-8">
                <div className="relative h-96 bg-slate-950 rounded-2xl overflow-hidden shadow-md border border-slate-800">
                  <img
                    src={getOptimizedImageUrl(activeProject.image, 1000, 85)}
                    alt={activeProject.title}
                    className="w-full h-full object-cover opacity-90"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="absolute top-4 right-4">
                    <span className={`inline-flex items-center px-3 py-1.5 rounded-md text-xs font-extrabold uppercase tracking-wider text-white shadow ${
                      activeProject.status === 'completed' ? 'bg-emerald-600' :
                      activeProject.status === 'in-progress' ? 'bg-amber-500 text-slate-950' :
                      'bg-indigo-600'
                    }`}>
                      {activeProject.status}
                    </span>
                  </div>
                </div>

                <div className="bg-[#0E0E10]/90 border border-slate-850 rounded-2xl p-8 shadow-sm space-y-6">
                  <div>
                    <span className="text-xs font-bold text-amber-500 uppercase tracking-widest font-mono">Project Specification Details</span>
                    <h2 className="text-2xl font-extrabold text-white mt-1 leading-tight">{activeProject.title}</h2>
                  </div>

                  <p className="text-sm text-slate-400 leading-relaxed">
                    {activeProject.description}
                  </p>

                  {activeProject.videoUrl && (
                    <div className="pt-6 border-t border-slate-800">
                      <span className="block text-[10px] text-slate-500 uppercase font-mono mb-2">Project Video Briefing</span>
                      <div className="rounded-xl overflow-hidden border border-slate-800 bg-black aspect-video relative">
                        <video 
                          src={activeProject.videoUrl} 
                          controls 
                          className="w-full h-full object-contain"
                          preload="metadata"
                        />
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-800 text-sm">
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[10px] text-slate-500 uppercase font-mono">Location</span>
                        <span className="block font-bold text-white">{activeProject.location}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Banknote className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[10px] text-slate-500 uppercase font-mono">Value Budget</span>
                        <span className="block font-bold text-white">
                          {activeProject.budget ? formatCurrency(activeProject.budget, (activeProject as any).currency || 'XAF') : 'TBA'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Calendar className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[10px] text-slate-500 uppercase font-mono">Start Date</span>
                        <span className="block font-bold text-white">{formatDate(activeProject.startDate)}</span>
                      </div>
                    </div>

                    <div className="flex items-start gap-2.5">
                      <Calendar className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="block text-[10px] text-slate-500 uppercase font-mono">Target Finish</span>
                        <span className="block font-bold text-white">{formatDate(activeProject.endDate)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Column Right: Interactive Progress Milestone Timeline */}
              <div className="lg:col-span-6 space-y-8">
                
                {/* Aggregate Progress Card */}
                <div className="bg-slate-900/80 text-white rounded-2xl p-8 border border-slate-800 shadow-md space-y-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <span className="text-[10px] font-mono tracking-widest uppercase text-amber-500">Live Delivery Metrics</span>
                      <h3 className="text-lg font-bold">Aggregate Contract Progress</h3>
                    </div>
                    <span className="text-3xl font-extrabold text-amber-500">{avgProgress}%</span>
                  </div>

                  <div className="w-full bg-slate-950 rounded-full h-3 overflow-hidden border border-slate-850">
                    <div 
                      className="bg-amber-500 h-full rounded-full transition-all duration-1000"
                      style={{ width: `${avgProgress}%` }}
                    />
                  </div>
                </div>

                {/* Vertical Milestone Progress Steps */}
                <div className="bg-[#0E0E10]/90 border border-slate-850 rounded-2xl p-8 shadow-sm space-y-6">
                  <h3 className="font-extrabold text-lg text-white flex items-center gap-2 border-b border-slate-800/80 pb-4">
                    <Target className="w-5 h-5 text-amber-500" /> Contract Milestone Timeline
                  </h3>

                  {progressList.length > 0 ? (
                    <div className="relative pl-6 border-l-2 border-slate-800 space-y-8 ml-3 py-2">
                      {progressList.map((step) => (
                        <div key={step.id} className="relative" id={`milestone-step-${step.id}`}>
                          
                          {/* Circle marker pin */}
                          <div className={`absolute -left-[33px] top-0.5 w-4 h-4 rounded-full border-2 ${
                            step.status === 'completed' ? 'bg-emerald-500 border-emerald-500' :
                            step.status === 'active' ? 'bg-amber-500 border-amber-500' :
                            'bg-slate-950 border-slate-800'
                          }`} />
                          {/* Inner static pin for pulsating state */}
                          {step.status === 'active' && (
                            <div className="absolute -left-[33px] top-0.5 w-4 h-4 rounded-full border-2 bg-amber-500 border-amber-500 animate-pulse" />
                          )}

                          <div className="space-y-1.5 pl-2">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                              <h4 className="font-extrabold text-sm text-white">{step.milestoneName}</h4>
                              <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                  step.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                  step.status === 'active' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                                  'bg-slate-800 text-slate-400'
                                }`}>
                                  {step.status}
                                </span>
                                <span className="text-xs font-mono font-bold text-slate-350">{step.percentage}% Complete</span>
                              </div>
                            </div>

                            <span className="block text-[10px] text-slate-500 font-mono tracking-wide">{formatDate(step.date)}</span>
                            <p className="text-xs text-slate-400 leading-relaxed pt-1">{step.description}</p>
                            
                            {/* Inner milestone progress sub-bar */}
                            <div className="w-full bg-slate-950 rounded-full h-1.5 mt-2 overflow-hidden border border-slate-900">
                              <div 
                                className={`h-full rounded-full ${
                                  step.status === 'completed' ? 'bg-emerald-500' :
                                  step.status === 'active' ? 'bg-amber-500' :
                                  'bg-slate-700'
                                }`}
                                style={{ width: `${step.percentage}%` }}
                              />
                            </div>
                          </div>

                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-slate-500 text-xs">
                      No milestones registered for this contract.
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

        </div>
      </div>
    );
  }

  // Otherwise, render full filterable Projects Portfolio Grid list
  return (
    <div className="font-sans text-slate-200 bg-[#0A0A0B] min-h-screen">
      
      {/* Portfolio Header */}
      <PortfolioHero />

      {/* Portfolio Browser Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        
        {/* Custom Portfolio Section Switcher */}
        <div className="flex border border-slate-850 p-1.5 rounded-xl bg-slate-950 max-w-lg mx-auto mb-12 gap-1.5">
          <button
            onClick={() => setActiveSubTab('landmark')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all select-none cursor-pointer ${
              activeSubTab === 'landmark'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <LayoutGrid className="w-4 h-4" />
            Major Contracts Portfolio
          </button>
          <button
            onClick={() => setActiveSubTab('updates')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-extrabold uppercase tracking-wider transition-all select-none cursor-pointer ${
              activeSubTab === 'updates'
                ? 'bg-amber-500 text-slate-950 shadow-md font-black'
                : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Video className="w-4 h-4" />
            Live Site Media Updates
          </button>
        </div>

        {activeSubTab === 'landmark' ? (
          <>
            {/* Category filtering chips */}
            <div className="flex flex-wrap items-center gap-2 mb-10 pb-4 border-b border-slate-800/80">
              <SlidersHorizontal className="w-4 h-4 text-slate-500 mr-2" />
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedCategory === null 
                    ? 'bg-amber-500 text-slate-950 shadow' 
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-white border border-slate-800'
                }`}
              >
                Show All Contracts
              </button>
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    selectedCategory === cat.id 
                      ? 'bg-amber-500 text-slate-950 shadow' 
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-white border border-slate-800'
                  }`}
                >
                  {cat.name}
                </button>
              ))}
            </div>

            {/* Projects list grid */}
            {loadingProjects ? (
              <ProjectListSkeleton count={6} />
            ) : filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
                {filteredProjects.map((project) => (
                  <div
                    key={project.id}
                    onClick={() => setSelectedProjectId(project.id)}
                    className="bg-slate-900/50 border border-slate-800/85 rounded-xl overflow-hidden shadow-sm hover:border-slate-700/80 hover:bg-slate-900 transition-all flex flex-col h-full cursor-pointer group"
                    id={`portfolio-item-${project.id}`}
                  >
                    <div className="relative h-52 bg-slate-950 overflow-hidden">
                      <img
                        src={getOptimizedImageUrl(project.image, 800, 80)}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-90 group-hover:opacity-100"
                        referrerPolicy="no-referrer"
                        loading="lazy"
                        decoding="async"
                      />
                      <div className="absolute top-3 right-3">
                        <span className={`inline-flex items-center px-2 py-1 rounded text-[10px] font-extrabold uppercase tracking-wider text-white shadow ${
                          project.status === 'completed' ? 'bg-emerald-600' :
                          project.status === 'in-progress' ? 'bg-amber-500 text-slate-950' :
                          'bg-indigo-600'
                        }`}>
                          {project.status}
                        </span>
                      </div>
                    </div>

                    <div className="p-6 flex flex-col justify-between flex-grow space-y-4">
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-mono tracking-widest uppercase text-slate-500 block">{project.location}</span>
                        <h3 className="font-extrabold text-base text-white leading-tight line-clamp-1 group-hover:text-amber-500 transition-colors">{project.title}</h3>
                        <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                          {project.description}
                        </p>
                      </div>

                      <div className="pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                        <div>
                          <span className="block text-[9px] text-slate-500 uppercase tracking-wider font-mono">Contract Budget</span>
                          <span className="block font-bold text-white">
                            {project.budget ? formatCurrency(project.budget, (project as any).currency || 'XAF') : 'TBA'}
                          </span>
                        </div>
                        <span className="text-amber-500 font-bold inline-flex items-center gap-1 group-hover:text-amber-400 transition-colors">
                          View Milestone Timeline →
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-[#0E0E10]/90 border border-slate-850 rounded-xl text-slate-400 max-w-xl mx-auto">
                <FolderKanban className="w-10 h-10 mx-auto text-slate-600 mb-3 animate-bounce" />
                <span className="block font-bold text-white text-sm">No Active Contracts Found</span>
                <span className="block text-xs text-slate-500 mt-1">Try adjusting your category filter chips to browse other project segments.</span>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Gallery / Media Live Updates view */}
            <div className="flex flex-wrap items-center gap-2 mb-10 pb-4 border-b border-slate-800/80">
              <SlidersHorizontal className="w-4 h-4 text-slate-500 mr-2" />
              <button
                onClick={() => setSelectedGalleryCategory(null)}
                className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                  selectedGalleryCategory === null 
                    ? 'bg-amber-500 text-slate-950 shadow' 
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-white border border-slate-800'
                }`}
              >
                All Live Updates
              </button>
              {Array.from(new Set(galleryItems.map(g => g.category))).map((catName) => (
                <button
                  key={catName}
                  onClick={() => setSelectedGalleryCategory(catName)}
                  className={`px-4 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
                    selectedGalleryCategory === catName 
                      ? 'bg-amber-500 text-slate-950 shadow' 
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-white border border-slate-800'
                  }`}
                >
                  {catName}
                </button>
              ))}
            </div>

            {/* Gallery item cards containing live videos and photos */}
            {galleryItems.filter(g => !selectedGalleryCategory || g.category === selectedGalleryCategory).length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in duration-300">
                {galleryItems
                  .filter(g => !selectedGalleryCategory || g.category === selectedGalleryCategory)
                  .map((item) => (
                    <div
                      key={item.id}
                      className="bg-slate-900/50 border border-slate-800/85 rounded-xl overflow-hidden shadow-sm hover:border-slate-750 transition-all flex flex-col h-full group"
                    >
                      <div className="relative h-60 bg-slate-950 overflow-hidden flex items-center justify-center">
                        {item.videoUrl ? (
                          <video
                            src={item.videoUrl}
                            poster={item.imageUrl}
                            controls
                            className="w-full h-full object-cover"
                            preload="none"
                          />
                        ) : (
                          <img
                            src={item.imageUrl}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                            loading="lazy"
                            decoding="async"
                          />
                        )}
                        <div className="absolute top-3 left-3 bg-slate-950/80 border border-slate-800 rounded px-2.5 py-1 text-[9px] font-mono uppercase font-bold text-amber-500 tracking-wider">
                          {item.videoUrl ? 'Video Log' : 'Photo Update'}
                        </div>
                        <div className="absolute top-3 right-3 bg-amber-500 text-slate-950 rounded text-[9px] font-extrabold uppercase px-2 py-0.5 shadow">
                          {item.category}
                        </div>
                      </div>

                      <div className="p-6 flex-grow flex flex-col justify-between gap-3 bg-slate-900/40">
                        <div>
                          <h4 className="font-extrabold text-base text-white mb-2 tracking-tight">
                            {item.title}
                          </h4>
                          <span className="text-[10px] text-slate-500 font-mono">
                            Published on: {new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            ) : (
              <div className="text-center py-24 bg-[#0E0E10]/90 border border-slate-850 rounded-xl text-slate-400 max-w-xl mx-auto">
                <Video className="w-10 h-10 mx-auto text-slate-600 mb-3 animate-pulse" />
                <span className="block font-bold text-white text-sm">No Live Media Logs Found</span>
                <span className="block text-xs text-slate-500 mt-1 font-sans">Be the first to publish modern live field updates in the admin portal!</span>
              </div>
            )}
          </>
        )}

      </div>

      {/* Premium Modular Portfolio Sections */}
      <CompanyStats />
      <BeforeAfterGallery />
      <CompanyTimeline />
      <TestimonialsAndPartners />
      <FAQSection />
      <AdSenseReadinessBlock />

    </div>
  );
}
