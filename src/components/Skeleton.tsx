import React from 'react';

/**
 * High-fidelity pulsing skeleton loader for the Hero Banner Carousel.
 * Perfectly mirrors the visual structure, heights, and positions of real text & buttons.
 */
export function HeroBannerSkeleton() {
  return (
    <div className="relative h-[640px] bg-slate-950 overflow-hidden flex items-center animate-pulse">
      {/* Background overlay */}
      <div className="absolute inset-0 bg-[#0c0c0e]" />
      <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/75 to-transparent" />
      
      {/* Content wrapper */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full relative z-10">
        <div className="max-w-2xl space-y-6">
          {/* ISO Badge placeholder */}
          <div className="w-56 h-6 bg-slate-900 border border-slate-800/60 rounded" />
          
          {/* Main heading lines */}
          <div className="space-y-3">
            <div className="h-10 sm:h-12 lg:h-14 bg-slate-900 rounded w-11/12" />
            <div className="h-10 sm:h-12 lg:h-14 bg-slate-900 rounded w-3/4" />
          </div>
          
          {/* Subtitle lines */}
          <div className="space-y-2 pt-2">
            <div className="h-4 bg-slate-900/80 rounded w-full" />
            <div className="h-4 bg-slate-900/80 rounded w-11/12" />
            <div className="h-4 bg-slate-900/80 rounded w-4/5" />
          </div>
          
          {/* Button indicators */}
          <div className="flex flex-wrap gap-4 pt-4">
            <div className="w-48 h-12 bg-slate-900 rounded-lg" />
            <div className="w-40 h-12 bg-slate-900 border border-slate-800 rounded-lg" />
          </div>
        </div>
      </div>
      
      {/* Dot Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
        <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
        <div className="w-2.5 h-2.5 rounded-full bg-slate-900" />
      </div>
    </div>
  );
}

/**
 * Pulsing project card loader.
 * Exactly matches the height, layout, and visual borders of a project contract card.
 */
export function ProjectCardSkeleton() {
  return (
    <div className="bg-slate-900/30 border border-slate-800/50 rounded-xl overflow-hidden shadow-sm flex flex-col h-full animate-pulse">
      {/* Image box placeholder */}
      <div className="h-56 sm:h-52 bg-slate-950/80 relative flex items-center justify-center">
        <div className="w-12 h-12 rounded bg-slate-900/60" />
        {/* Status badge placeholder */}
        <div className="absolute top-4 right-4 w-20 h-6 bg-slate-900 rounded" />
      </div>
      
      {/* Body contents */}
      <div className="p-6 flex flex-col justify-between flex-grow space-y-6">
        <div className="space-y-3">
          {/* Location tag */}
          <div className="w-28 h-3.5 bg-slate-950 rounded" />
          {/* Title line */}
          <div className="w-4/5 h-6 bg-slate-950 rounded" />
          {/* Description lines */}
          <div className="space-y-2 pt-1">
            <div className="w-full h-3 bg-slate-950/70 rounded" />
            <div className="w-11/12 h-3 bg-slate-950/70 rounded" />
            <div className="w-3/4 h-3 bg-slate-950/70 rounded" />
          </div>
        </div>
        
        {/* Card footer */}
        <div className="pt-4 border-t border-slate-800/40 flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="w-16 h-3 bg-slate-950/50 rounded" />
            <div className="w-24 h-4 bg-slate-950 rounded" />
          </div>
          <div className="w-36 h-4 bg-slate-950/80 rounded" />
        </div>
      </div>
    </div>
  );
}

/**
 * Grid layout wrapper for project skeletons.
 */
export function ProjectListSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <ProjectCardSkeleton key={i} />
      ))}
    </div>
  );
}
