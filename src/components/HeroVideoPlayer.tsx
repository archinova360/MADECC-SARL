import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, VolumeX, AlertCircle, RefreshCw, Eye } from 'lucide-react';
import { HeroSectionConfig } from '../types.ts';
import { getOptimizedImageUrl } from '../lib/utils.ts';

interface HeroVideoPlayerProps {
  config?: HeroSectionConfig | null;
  defaultTitle?: string;
  defaultSubtitle?: string;
  children?: React.ReactNode;
  isPreview?: boolean;
}

export default function HeroVideoPlayer({
  config,
  defaultTitle = 'Building Cameroon’s Future with Structural Precision & Integrity',
  defaultSubtitle = 'Premier Civil Engineering, Commercial Towers, and Turnkey Construction in Cameroon.',
  children,
  isPreview = false
}: HeroVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [videoError, setVideoError] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Settings from CMS config with safe fallbacks
  const videoUrl = config?.videoUrl;
  const posterUrl = config?.posterUrl || config?.imageUrl || 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1920&q=80';
  const fallbackImageUrl = config?.imageUrl || posterUrl;
  const mediaType = config?.mediaType || (videoUrl ? 'video' : 'image');
  const showVideo = config?.showVideo !== false && mediaType === 'video' && Boolean(videoUrl);
  const videoSettings = config?.videoSettings || {
    autoplay: true,
    muted: true,
    loop: true,
    playsInline: true,
    disableOnMobile: false,
    overlayOpacity: 75
  };

  const overlayOpacity = videoSettings.overlayOpacity !== undefined ? videoSettings.overlayOpacity : 75;

  // Check mobile viewport
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Handle Video Autoplay & Lifecycle
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !showVideo) return;

    if (videoSettings.disableOnMobile && isMobile) {
      return;
    }

    video.muted = isMuted;
    
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setVideoLoaded(true);
          setVideoError(false);
        })
        .catch((err) => {
          console.warn('[HERO_VIDEO] Autoplay was prevented by browser policy, attempting muted playback:', err);
          // Retry strictly muted
          video.muted = true;
          setIsMuted(true);
          video.play().then(() => {
            setIsPlaying(true);
            setVideoLoaded(true);
          }).catch(finalErr => {
            console.error('[HERO_VIDEO] Video playback failed, falling back to high-res poster image:', finalErr);
            setVideoError(true);
          });
        });
    }
  }, [videoUrl, showVideo, isMobile, videoSettings.disableOnMobile]);

  const togglePlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().then(() => setIsPlaying(true)).catch(() => setVideoError(true));
    } else {
      video.pause();
      setIsPlaying(false);
    }
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;

    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const handleVideoError = () => {
    console.warn('[HERO_VIDEO] Video source failed to load or unsupported codec. Falling back to poster image.');
    setVideoError(true);
  };

  const shouldRenderVideo = showVideo && !videoError && (!videoSettings.disableOnMobile || !isMobile);

  return (
    <div className="relative w-full h-full min-h-[640px] lg:min-h-[700px] overflow-hidden bg-slate-950 flex items-center" id="madecc-hero-container">
      {/* 1. Background Video Layer */}
      {shouldRenderVideo && videoUrl && (
        <video
          ref={videoRef}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            videoLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          poster={getOptimizedImageUrl(posterUrl, 1920, 85)}
          playsInline={videoSettings.playsInline !== false}
          autoPlay={videoSettings.autoplay !== false}
          muted={isMuted}
          loop={videoSettings.loop !== false}
          preload="auto"
          onLoadedData={() => {
            setVideoLoaded(true);
            setVideoError(false);
          }}
          onError={handleVideoError}
          crossOrigin="anonymous"
          id="hero-background-video"
        >
          <source src={videoUrl} type="video/mp4" />
          <source src={videoUrl} type="video/webm" />
          {/* Fallback text if video is completely unparsed by browser */}
          Your browser does not support HTML5 video streaming.
        </video>
      )}

      {/* 2. Fallback Poster Image Layer (Shows while loading, if video fails, or if image mode selected) */}
      {(!shouldRenderVideo || !videoLoaded) && (
        <img
          src={getOptimizedImageUrl(fallbackImageUrl, 1920, 85)}
          alt={config?.title || defaultTitle}
          className="absolute inset-0 w-full h-full object-cover transition-all duration-700 animate-in fade-in"
          fetchPriority="high"
          loading="eager"
          decoding="sync"
          referrerPolicy="no-referrer"
          id="hero-fallback-poster"
        />
      )}

      {/* 3. Dark Contrast Overlay with configurable Opacity */}
      <div
        className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/85 to-slate-950/40 pointer-events-none transition-opacity duration-300"
        style={{
          backgroundColor: `rgba(2, 6, 23, ${(overlayOpacity / 100).toFixed(2)})`
        }}
      />

      {/* 4. Subtle Blueprint Grid pattern decoration */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-10"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #f59e0b 1px, transparent 0)',
          backgroundSize: '32px 32px'
        }}
      />

      {/* 5. Interactive Video Controls (Bottom Right Pill) */}
      {shouldRenderVideo && videoLoaded && (
        <div className="absolute bottom-6 right-6 z-30 flex items-center gap-2 bg-slate-900/85 backdrop-blur-md border border-slate-800 text-slate-200 px-3 py-1.5 rounded-full text-xs shadow-xl animate-in fade-in duration-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse mr-1" />
          <span className="font-mono text-[11px] text-slate-300 mr-2">LIVE SITE REEL</span>
          
          <button
            onClick={togglePlay}
            className="p-1.5 hover:bg-slate-800 rounded-full transition-colors text-slate-300 hover:text-white"
            title={isPlaying ? 'Pause Background Video' : 'Play Background Video'}
            aria-label="Toggle Playback"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={toggleMute}
            className="p-1.5 hover:bg-slate-800 rounded-full transition-colors text-slate-300 hover:text-white"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
            aria-label="Toggle Mute"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
          </button>
        </div>
      )}

      {/* 6. Preview Banner Tag if in CMS Preview mode */}
      {isPreview && (
        <div className="absolute top-4 left-4 z-40 bg-amber-500 text-slate-950 font-bold font-mono text-xs px-3 py-1.5 rounded-md shadow-lg flex items-center gap-1.5">
          <Eye className="w-3.5 h-3.5" /> CMS REAL-TIME PREVIEW MODE
        </div>
      )}

      {/* 7. Hero Content Projection */}
      <div className="relative z-20 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24">
        {children}
      </div>
    </div>
  );
}
