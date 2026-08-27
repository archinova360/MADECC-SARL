import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
  Play, 
  Pause, 
  Volume2, 
  VolumeX, 
  Eye, 
  ChevronLeft, 
  ChevronRight,
  Building2,
  HardHat,
  Sparkles,
  Layers,
  ShieldCheck,
  Video
} from 'lucide-react';
import { HeroSectionConfig, HeroBanner } from '../types.ts';
import { getOptimizedImageUrl } from '../lib/utils.ts';

export interface HeroVideoItem {
  id: string | number;
  title: string;
  subtitle?: string | null;
  category?: string;
  location?: string;
  videoUrl?: string | null;
  posterUrl: string;
  accent?: string;
}

export const DEFAULT_HERO_VIDEOS: HeroVideoItem[] = [
  {
    id: 'civil-infra',
    title: 'Civil & Infrastructure Engineering',
    subtitle: 'Highways, Bridges, and Heavy Civil Groundworks across Cameroon.',
    category: 'Heavy Infrastructure & Bridges',
    location: 'Yaoundé - Douala Expressway Corridor',
    videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1920&q=85',
    accent: '#f59e0b'
  },
  {
    id: 'structural-concrete',
    title: 'Precision Structural Concrete & Framing',
    subtitle: 'Engineered strictly to Eurocode 2 and BAEL 91 structural standards.',
    category: 'Eurocode 2 & BAEL 91 Standards',
    location: 'Yaoundé (Mbankolo & Bastos)',
    videoUrl: 'https://cdn.jsdelivr.net/npm/video-media-samples@1.0.0/big-buck-bunny-480p-30sec.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1920&q=85',
    accent: '#10b981'
  },
  {
    id: 'commercial-complex',
    title: 'Commercial Complexes & Turnkey High-Rises',
    subtitle: 'From foundation excavation to architectural handover.',
    category: 'Modern Architecture in Cameroon',
    location: 'Douala (Akwa & Bonanjo Business Districts)',
    videoUrl: 'https://vjs.zencdn.net/v/oceans.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=1920&q=85',
    accent: '#3b82f6'
  },
  {
    id: 'highway-roadwork',
    title: 'Highway Corridors & Heavy Crane Operations',
    subtitle: 'Inter-urban expressway and municipal paving infrastructure.',
    category: 'Municipal & Inter-Urban Roadways',
    location: 'National Road Network & Urban Centers',
    videoUrl: 'https://cdn.jsdelivr.net/npm/video-media-samples@1.0.0/big-buck-bunny-480p-30sec.mp4',
    posterUrl: 'https://images.unsplash.com/photo-1578575437130-527eed3abbec?auto=format&fit=crop&w=1920&q=85',
    accent: '#f97316'
  }
];

const SLIDE_INTERVAL_MS = 6000; // 6 seconds auto-slide

interface HeroVideoPlayerProps {
  config?: HeroSectionConfig | null;
  banners?: HeroBanner[] | null;
  defaultTitle?: string;
  defaultSubtitle?: string;
  children?: React.ReactNode;
  isPreview?: boolean;
}

// Helper to extract YouTube video ID if URL is from YouTube
function getYouTubeId(url?: string | null): string | null {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

export default function HeroVideoPlayer({
  config,
  banners,
  children,
  isPreview = false
}: HeroVideoPlayerProps) {
  // Combine dynamic uploaded banners from Admin / DB with CMS config & default fallbacks
  const slides = useMemo(() => {
    const list: HeroVideoItem[] = [];

    // 1. If admin uploaded banners exist, use active ones sorted by displayOrder
    if (banners && banners.length > 0) {
      const activeBanners = [...banners]
        .filter(b => b.active !== false)
        .sort((a, b) => (a.displayOrder || 0) - (b.displayOrder || 0));

      activeBanners.forEach(b => {
        list.push({
          id: `banner-${b.id}`,
          title: b.title || 'MADECC Construction Project',
          subtitle: b.subtitle || null,
          category: 'Construction & Civil Engineering',
          location: 'Cameroon Operations',
          videoUrl: b.videoUrl && b.videoUrl.trim() ? b.videoUrl.trim() : null,
          posterUrl: b.imageUrl && b.imageUrl.trim() ? b.imageUrl.trim() : DEFAULT_HERO_VIDEOS[0].posterUrl,
          accent: '#f59e0b'
        });
      });
    }

    // 2. If CMS config has a custom video/poster that's not already in list, include it
    if (config?.videoUrl || config?.imageUrl || config?.posterUrl) {
      const configItem: HeroVideoItem = {
        id: 'cms-hero-config',
        title: config.title || 'MADECC Flagship Video Reel',
        subtitle: config.subtitle || null,
        category: config.eyebrow || 'Featured Engineering',
        location: 'Yaoundé & Douala, Cameroon',
        videoUrl: config.videoUrl || null,
        posterUrl: config.posterUrl || config.imageUrl || DEFAULT_HERO_VIDEOS[0].posterUrl,
        accent: '#f59e0b'
      };

      if (!list.some(s => s.title === configItem.title)) {
        list.unshift(configItem);
      }
    }

    // 3. If no banners or config, fallback to default high quality reels
    if (list.length === 0) {
      return DEFAULT_HERO_VIDEOS;
    }

    return list;
  }, [banners, config]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [slideProgress, setSlideProgress] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const videoRefs = useRef<{ [key: number]: HTMLVideoElement | null }>({});

  const overlayOpacity = config?.videoSettings?.overlayOpacity !== undefined 
    ? config.videoSettings.overlayOpacity 
    : 70;

  // Next & Prev slide handlers
  const handleNext = useCallback(() => {
    setCurrentIndex(prev => (prev + 1) % slides.length);
  }, [slides.length]);

  const handlePrev = useCallback(() => {
    setCurrentIndex(prev => (prev - 1 + slides.length) % slides.length);
  }, [slides.length]);

  const handleGoToSlide = useCallback((index: number) => {
    setCurrentIndex(index);
  }, []);

  // 1. Continuous Auto Sliding Timer
  useEffect(() => {
    if (!isPlaying || slides.length <= 1) return;

    const timer = setInterval(() => {
      handleNext();
    }, SLIDE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [isPlaying, slides.length, handleNext]);

  // 2. Smooth Slide Progress Bar
  useEffect(() => {
    if (!isPlaying || slides.length <= 1) {
      setSlideProgress(0);
      return;
    }

    setSlideProgress(0);
    const startMs = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - startMs;
      const pct = Math.min(100, (elapsed / SLIDE_INTERVAL_MS) * 100);
      setSlideProgress(pct);
    }, 40);

    return () => clearInterval(interval);
  }, [currentIndex, isPlaying, slides.length]);

  // 3. Play active video and pause inactive videos
  useEffect(() => {
    Object.keys(videoRefs.current).forEach((key) => {
      const idx = Number(key);
      const vid = videoRefs.current[idx];
      if (!vid) return;

      if (idx === currentIndex) {
        vid.muted = isMuted;
        if (isPlaying) {
          vid.play().catch(() => {
            // Autoplay policy fallback: guarantee muted
            vid.muted = true;
            vid.play().catch(() => {});
          });
        } else {
          vid.pause();
        }
      } else {
        vid.pause();
      }
    });
  }, [currentIndex, isPlaying, isMuted]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsPlaying(prev => !prev);
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const newMuted = !isMuted;
    setIsMuted(newMuted);
    const currentVideo = videoRefs.current[currentIndex];
    if (currentVideo) {
      currentVideo.muted = newMuted;
    }
  };

  // Touch Swipe Support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > 50) {
      // Swiped left -> Next slide
      handleNext();
    } else if (distance < -50) {
      // Swiped right -> Prev slide
      handlePrev();
    }
    setTouchStart(null);
    setTouchEnd(null);
  };

  const currentSlide = slides[currentIndex] || slides[0];

  return (
    <div 
      className="relative w-full min-h-[680px] lg:min-h-[740px] overflow-hidden bg-slate-950 flex items-center select-none"
      id="madecc-hero-container"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* 1. Hardware Accelerated Right-to-Left Sliding Reel Track */}
      <div 
        className="absolute inset-0 flex h-full transition-transform duration-700 ease-in-out will-change-transform"
        style={{ 
          width: `${slides.length * 100}%`,
          transform: `translateX(-${(currentIndex * 100) / slides.length}%)`
        }}
      >
        {slides.map((item, idx) => {
          const isActive = idx === currentIndex;
          const ytId = getYouTubeId(item.videoUrl);

          return (
            <div 
              key={item.id} 
              className="relative h-full overflow-hidden flex-shrink-0 bg-slate-950"
              style={{ width: `${100 / slides.length}%` }}
            >
              {/* Cinematic Background Poster with Ken Burns Zoom on active slide */}
              <div 
                className={`absolute inset-0 w-full h-full bg-cover bg-center transition-transform duration-[6000ms] ease-out ${
                  isActive ? 'scale-105' : 'scale-100'
                }`}
                style={{
                  backgroundImage: `url(${getOptimizedImageUrl(item.posterUrl, 1920, 85)})`
                }}
              />

              {/* YouTube Video Player Embed */}
              {ytId && isActive && (
                <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none opacity-80">
                  <iframe
                    className="w-full h-full object-cover scale-125"
                    src={`https://www.youtube.com/embed/${ytId}?autoplay=1&mute=${isMuted ? 1 : 0}&controls=0&loop=1&playlist=${ytId}&playsinline=1&enablejsapi=1&rel=0`}
                    title={item.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  />
                </div>
              )}

              {/* HTML5 Video Player for MP4 / WebM / Cloud Uploads */}
              {item.videoUrl && !ytId && (
                <video
                  ref={el => { videoRefs.current[idx] = el; }}
                  className="absolute inset-0 w-full h-full object-cover opacity-80 transition-opacity duration-500"
                  poster={getOptimizedImageUrl(item.posterUrl, 1920, 85)}
                  playsInline
                  autoPlay
                  muted={isMuted}
                  loop
                  preload="auto"
                  crossOrigin="anonymous"
                  onError={(e) => {
                    // Fail gracefully to image poster
                    const target = e.currentTarget;
                    target.style.display = 'none';
                  }}
                >
                  <source src={item.videoUrl} type="video/mp4" />
                </video>
              )}

              {/* Subtle ambient gradient vignette */}
              <div className="absolute inset-0 bg-radial from-transparent via-slate-950/30 to-slate-950 pointer-events-none" />
            </div>
          );
        })}
      </div>

      {/* 2. Global Dark Contrast Gradient Overlay for text legibility */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-slate-950/95 via-slate-950/80 to-slate-950/40 pointer-events-none transition-opacity duration-300 z-10"
        style={{
          backgroundColor: `rgba(2, 6, 23, ${(overlayOpacity / 100).toFixed(2)})`
        }}
      />

      {/* 3. Subtle Technical Engineering Grid Overlay */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10 z-10"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #f59e0b 1px, transparent 0)',
          backgroundSize: '36px 36px'
        }}
      />

      {/* 4. Left Arrow Slide Controller */}
      <button
        type="button"
        onClick={handlePrev}
        className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-slate-900/85 hover:bg-amber-500 hover:text-slate-950 text-slate-200 border border-slate-700/80 flex items-center justify-center transition-all backdrop-blur-md shadow-xl cursor-pointer active:scale-95 group"
        title="Previous Construction Reel (Slide Left)"
        aria-label="Previous Slide"
      >
        <ChevronLeft className="w-6 h-6 group-hover:-translate-x-0.5 transition-transform" />
      </button>

      {/* 5. Right Arrow Slide Controller */}
      <button
        type="button"
        onClick={handleNext}
        className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-30 w-11 h-11 rounded-full bg-slate-900/85 hover:bg-amber-500 hover:text-slate-950 text-slate-200 border border-slate-700/80 flex items-center justify-center transition-all backdrop-blur-md shadow-xl cursor-pointer active:scale-95 group"
        title="Next Construction Reel (Slide Right)"
        aria-label="Next Slide"
      >
        <ChevronRight className="w-6 h-6 group-hover:translate-x-0.5 transition-transform" />
      </button>

      {/* 6. Active Reel Identification Badge (Top-Right) */}
      <div className="hidden md:flex absolute top-6 right-6 z-30 items-center gap-2.5 bg-slate-900/90 backdrop-blur-md border border-slate-800 text-slate-200 px-4 py-2 rounded-full text-xs shadow-xl animate-in fade-in duration-300">
        <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
        <span className="font-mono text-[11px] font-bold tracking-wide text-amber-300">
          SLIDE {currentIndex + 1}/{slides.length}:
        </span>
        <span className="font-semibold text-slate-200 truncate max-w-xs">
          {currentSlide.title}
        </span>
      </div>

      {/* 7. Bottom Navigation Bar with Progress Bars, Play/Pause, & Mute Controls */}
      <div className="absolute bottom-6 right-4 sm:right-6 z-30 flex flex-wrap items-center gap-2.5 sm:gap-3.5 bg-slate-900/95 backdrop-blur-md border border-slate-800 text-slate-200 px-3.5 sm:px-4 py-2 rounded-full text-xs shadow-2xl animate-in fade-in duration-300">
        {/* Live Site Status Tag */}
        <div className="flex items-center gap-1.5 pr-2 border-r border-slate-800">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <span className="font-mono text-[10px] font-bold tracking-wider text-slate-300 uppercase">
            LIVE REEL {currentIndex + 1}/{slides.length}
          </span>
        </div>

        {/* Video Reel Slides Dots / Progress Bars */}
        <div className="flex items-center gap-1.5">
          {slides.map((_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleGoToSlide(i)}
              className={`relative h-2 rounded-full overflow-hidden transition-all duration-300 cursor-pointer ${
                i === currentIndex 
                  ? 'w-9 bg-slate-800 ring-1 ring-amber-500/60' 
                  : 'w-2 bg-slate-700 hover:bg-slate-500'
              }`}
              title={`Jump to slide ${i + 1}`}
              aria-label={`Slide ${i + 1}`}
            >
              {i === currentIndex && (
                <div 
                  className="absolute inset-y-0 left-0 bg-amber-500 transition-all ease-linear"
                  style={{ width: `${slideProgress}%` }}
                />
              )}
            </button>
          ))}
        </div>

        {/* Play/Pause Auto-Slide Button */}
        <button
          type="button"
          onClick={togglePlay}
          className="p-1.5 hover:bg-slate-800 rounded-full transition-colors text-slate-300 hover:text-white cursor-pointer"
          title={isPlaying ? 'Pause Auto-Slide' : 'Resume Auto-Slide'}
          aria-label="Toggle Playback"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-white" />}
        </button>

        {/* Audio Mute/Unmute Button */}
        <button
          type="button"
          onClick={toggleMute}
          className="p-1.5 hover:bg-slate-800 rounded-full transition-colors text-slate-300 hover:text-white cursor-pointer"
          title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          aria-label="Toggle Mute"
        >
          {isMuted ? <VolumeX className="w-3.5 h-3.5 text-slate-400" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
        </button>
      </div>

      {/* 8. CMS Preview Tag if enabled */}
      {isPreview && (
        <div className="absolute top-4 left-4 z-40 bg-amber-500 text-slate-950 font-bold font-mono text-xs px-3 py-1.5 rounded-md shadow-lg flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5" /> CMS REAL-TIME PREVIEW MODE
        </div>
      )}

      {/* 9. Hero Content Projection */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {children}
      </div>
    </div>
  );
}
