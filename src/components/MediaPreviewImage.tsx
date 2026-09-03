import React, { useState, useEffect } from 'react';
import { ImageIcon, AlertCircle, RefreshCw, Youtube, Tv, ExternalLink, Play, Sparkles } from 'lucide-react';
import { sanitizeMediaUrl, classifyMedia, FALLBACK_ENGINEERING_IMAGES } from '../utils/mediaClassifier.ts';

interface MediaPreviewImageProps {
  src?: string | null;
  alt?: string;
  className?: string;
  containerClassName?: string;
  aspectRatio?: 'square' | 'video' | 'auto';
  mediaType?: 'image' | 'video' | 'youtube' | 'auto';
  onImageError?: (failedUrl: string) => void;
  showFallbackBadge?: boolean;
  interactive?: boolean;
}

export default function MediaPreviewImage({
  src,
  alt = 'Media preview',
  className = 'w-full h-full object-cover',
  containerClassName = 'w-full rounded-lg overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center relative',
  aspectRatio = 'auto',
  mediaType = 'auto',
  onImageError,
  showFallbackBadge = false,
  interactive = true
}: MediaPreviewImageProps) {
  const sanitized = sanitizeMediaUrl(src);
  const [currentSrc, setCurrentSrc] = useState<string>(sanitized);
  const [hasError, setHasError] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(Boolean(sanitized));
  const [retryCount, setRetryCount] = useState<number>(0);

  useEffect(() => {
    const clean = sanitizeMediaUrl(src);
    setCurrentSrc(clean);
    setHasError(false);
    setErrorMessage('');
    setIsLoading(Boolean(clean));
  }, [src]);

  const classification = classifyMedia(currentSrc);
  const resolvedMediaType = mediaType !== 'auto'
    ? mediaType
    : classification.mediaType === 'youtube'
    ? 'youtube'
    : classification.isDirectVideo
    ? 'video'
    : 'image';

  const handleError = (e?: any) => {
    setIsLoading(false);
    setHasError(true);
    setErrorMessage('The media at this URL could not be loaded. Please check the URL syntax or host access.');
    if (onImageError && currentSrc) {
      onImageError(currentSrc);
    }
  };

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleRetry = () => {
    setIsLoading(true);
    setHasError(false);
    setRetryCount(prev => prev + 1);
  };

  const handleUseSample = () => {
    const sample = FALLBACK_ENGINEERING_IMAGES[0];
    setCurrentSrc(sample);
    setHasError(false);
    setIsLoading(true);
    if (onImageError) {
      onImageError(sample);
    }
  };

  const aspectClass = aspectRatio === 'square'
    ? 'aspect-square'
    : aspectRatio === 'video'
    ? 'aspect-video'
    : '';

  if (!currentSrc) {
    return (
      <div className={`${containerClassName} ${aspectClass} min-h-[120px] p-4 text-center text-slate-500`}>
        <div className="space-y-1.5 flex flex-col items-center justify-center">
          <ImageIcon className="w-8 h-8 text-slate-600" />
          <span className="text-[11px] font-mono block">No Media Attached</span>
          <span className="text-[10px] text-slate-600 block">Attach an image, video file, or YouTube link to preview here</span>
        </div>
      </div>
    );
  }

  return (
    <div className={`${containerClassName} ${aspectClass} relative group`}>
      {/* LOADING SPINNER */}
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-950/80 backdrop-blur-xs z-10">
          <div className="flex items-center gap-2 text-indigo-400 text-xs font-mono">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Loading preview...</span>
          </div>
        </div>
      )}

      {/* ERROR CARD - NEVER OVERWRITES USER'S MEDIA SILENTLY */}
      {hasError ? (
        <div className="p-4 w-full h-full min-h-[140px] flex flex-col items-center justify-center text-center bg-slate-950 border border-rose-500/30 rounded-lg space-y-2">
          <div className="flex items-center gap-1.5 text-rose-400 text-xs font-bold">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>Media Preview Notice</span>
          </div>
          <p className="text-[11px] text-slate-400 max-w-sm line-clamp-2 break-all font-mono">
            {currentSrc}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              type="button"
              onClick={handleRetry}
              className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg border border-slate-700 flex items-center gap-1 transition-colors"
            >
              <RefreshCw className="w-3 h-3 text-indigo-400" /> Retry Loading
            </button>
            {currentSrc.startsWith('http') && (
              <a
                href={currentSrc}
                target="_blank"
                rel="noopener noreferrer"
                className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] font-bold rounded-lg border border-slate-700 flex items-center gap-1 transition-colors"
              >
                <ExternalLink className="w-3 h-3 text-blue-400" /> Open Direct URL
              </a>
            )}
            <button
              type="button"
              onClick={handleUseSample}
              className="px-2.5 py-1 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[10px] font-bold rounded-lg border border-amber-500/40 flex items-center gap-1 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-amber-400" /> Insert Sample Image
            </button>
          </div>
        </div>
      ) : resolvedMediaType === 'youtube' && classification.youtubeId ? (
        /* YOUTUBE EMBED PLAYER */
        <div className="w-full h-full min-h-[180px] relative aspect-video bg-black rounded-lg overflow-hidden">
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${classification.youtubeId}?rel=0&modestbranding=1`}
            title={alt || 'YouTube Video Player'}
            className="w-full h-full absolute inset-0 border-0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            onLoad={handleLoad}
          />
          <div className="absolute top-2 left-2 z-10 px-2 py-0.5 bg-black/80 backdrop-blur-xs text-red-400 text-[9px] font-mono font-bold rounded border border-red-500/30 flex items-center gap-1 pointer-events-none">
            <Youtube className="w-3 h-3 text-red-500" />
            <span>YouTube Live Player</span>
          </div>
        </div>
      ) : resolvedMediaType === 'video' ? (
        /* DIRECT VIDEO STREAM (HTML5 VIDEO) */
        <div className="w-full h-full relative flex items-center justify-center bg-black/40 overflow-hidden">
          <video
            key={`video-${currentSrc}-${retryCount}`}
            src={currentSrc}
            controls={interactive}
            playsInline
            preload="metadata"
            onLoadedData={handleLoad}
            onCanPlay={handleLoad}
            onError={handleError}
            className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
          />
          {showFallbackBadge && (
            <div className="absolute bottom-2 left-2 z-20 px-2 py-0.5 bg-slate-950/80 backdrop-blur-xs border border-purple-500/40 text-purple-300 text-[9px] font-mono rounded flex items-center gap-1 pointer-events-none">
              <Tv className="w-2.5 h-2.5 text-purple-400" />
              <span>Direct Video (.mp4)</span>
            </div>
          )}
          {!interactive && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none bg-black/20">
              <div className="p-2 rounded-full bg-slate-950/80 border border-purple-500/40 text-purple-300 shadow-lg">
                <Play className="w-4 h-4 fill-purple-400 text-purple-400" />
              </div>
            </div>
          )}
        </div>
      ) : (
        /* DIRECT IMAGE DISPLAY */
        <div className="w-full h-full relative flex items-center justify-center">
          <img
            key={`img-${currentSrc}-${retryCount}`}
            src={currentSrc}
            alt={alt}
            referrerPolicy="no-referrer"
            onError={handleError}
            onLoad={handleLoad}
            className={`${className} ${isLoading ? 'opacity-0' : 'opacity-100'} transition-opacity duration-200`}
          />
          {showFallbackBadge && (
            <div className="absolute bottom-2 left-2 z-20 px-2 py-0.5 bg-slate-950/80 backdrop-blur-xs border border-emerald-500/40 text-emerald-300 text-[9px] font-mono rounded flex items-center gap-1">
              <ImageIcon className="w-2.5 h-2.5 text-emerald-400" />
              <span>Exact Media Attached</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
