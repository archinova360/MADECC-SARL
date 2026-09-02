/**
 * MADECC GROUP Social Media Media Classifier & Normalizer
 * Provides robust validation, classification, sanitization, and compatibility diagnostics
 * for images, direct videos, and YouTube URLs.
 */

export interface MediaClassification {
  isValid: boolean;
  rawUrl: string;
  normalizedUrl: string;
  mediaType: 'image' | 'video' | 'youtube' | 'unknown';
  isYouTube: boolean;
  isDirectVideo: boolean;
  isImage: boolean;
  youtubeId?: string;
  youtubeEmbedUrl?: string;
  fileExtension?: string;
  formatLabel: string;
  mimeTypeHint: string;
  platformCompatibility: {
    youtube: { compatible: boolean; reason: string; requiredAction?: string };
    tiktok: { compatible: boolean; reason: string; requiredAction?: string };
    instagram: { compatible: boolean; reason: string; requiredAction?: string };
    facebook: { compatible: boolean; reason: string; requiredAction?: string };
    linkedin: { compatible: boolean; reason: string; requiredAction?: string };
    twitter: { compatible: boolean; reason: string; requiredAction?: string };
    whatsapp: { compatible: boolean; reason: string; requiredAction?: string };
    custom: { compatible: boolean; reason: string; requiredAction?: string };
  };
  warnings: string[];
}

export const FALLBACK_ENGINEERING_IMAGES = [
  'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1200&q=80', // Construction Site & Crane
  'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80', // Architectural Building Structure
  'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80', // Civil Engineer on Site
  'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?auto=format&fit=crop&w=1200&q=80', // Commercial Steel & Concrete
  'https://images.unsplash.com/photo-1541971875076-8f970d573be6?auto=format&fit=crop&w=1200&q=80'  // Modern Skyline & Infrastructure
];

/**
 * Robustly sanitizes and cleans media URLs, repairing accidental concatenations
 * like "https://imaghttps://kommodo.ai/..." or stray quotes/spaces.
 */
export function sanitizeMediaUrl(input?: string | null): string {
  if (!input || typeof input !== 'string') return '';
  let trimmed = input.trim();

  // Strip wrapping quotes
  if ((trimmed.startsWith('"') && trimmed.endsWith('"')) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  // Handle data or blob URLs directly
  if (trimmed.startsWith('data:image/') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  // Repair accidental concatenated URLs (e.g., "https://imaghttps://domain.com/path" or "https://abc.com/https://xyz.com")
  const matches = Array.from(trimmed.matchAll(/https?:\/\/[^\s"'<>]+/gi));
  if (matches.length > 1) {
    // Pick the last complete valid URL found in the string
    const lastMatch = matches[matches.length - 1][0];
    trimmed = lastMatch;
  } else if (matches.length === 1 && trimmed.indexOf(matches[0][0]) > 0) {
    trimmed = matches[0][0];
  }

  // Protocol normalization
  if (trimmed.startsWith('//')) {
    trimmed = `https:${trimmed}`;
  } else if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('data:')) {
    trimmed = `https://${trimmed}`;
  }

  return trimmed;
}

/**
 * Extract YouTube Video ID from standard, shortened, shorts, or embed URLs
 */
export function extractYouTubeId(url: string): string | null {
  if (!url || typeof url !== 'string') return null;
  const sanitized = sanitizeMediaUrl(url);

  // Standard: youtube.com/watch?v=ID or &v=ID
  const stdMatch = sanitized.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/i);
  if (stdMatch && stdMatch[1]) {
    return stdMatch[1];
  }

  // Short URL: youtu.be/ID
  const shortMatch = sanitized.match(/^https?:\/\/youtu\.be\/([a-zA-Z0-9_-]{11})/i);
  if (shortMatch && shortMatch[1]) {
    return shortMatch[1];
  }

  // Shorts URL: youtube.com/shorts/ID
  const shortsMatch = sanitized.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/i);
  if (shortsMatch && shortsMatch[1]) {
    return shortsMatch[1];
  }

  return null;
}

/**
 * Classify and normalize any media attachment URL
 */
export function classifyMedia(url?: string | null): MediaClassification {
  const defaultEmpty: MediaClassification = {
    isValid: false,
    rawUrl: '',
    normalizedUrl: '',
    mediaType: 'unknown',
    isYouTube: false,
    isDirectVideo: false,
    isImage: false,
    formatLabel: 'No Media Attached',
    mimeTypeHint: 'none',
    platformCompatibility: {
      youtube: { compatible: false, reason: 'YouTube requires a video asset (.mp4 or YouTube link)', requiredAction: 'Attach a video or YouTube link' },
      tiktok: { compatible: false, reason: 'TikTok requires a video asset (.mp4/.mov)', requiredAction: 'Attach a video asset' },
      instagram: { compatible: false, reason: 'Instagram requires an image or video asset', requiredAction: 'Attach an image or video asset' },
      facebook: { compatible: true, reason: 'Facebook supports text-only or media posts' },
      linkedin: { compatible: true, reason: 'LinkedIn supports text-only or media posts' },
      twitter: { compatible: true, reason: 'X supports text-only tweets' },
      whatsapp: { compatible: true, reason: 'WhatsApp supports text broadcast or media' },
      custom: { compatible: true, reason: 'Custom webhook accepts payload with or without media' }
    },
    warnings: []
  };

  if (!url || typeof url !== 'string' || !url.trim()) {
    return defaultEmpty;
  }

  const rawUrl = url.trim();
  const normalizedUrl = sanitizeMediaUrl(rawUrl);

  // Handle data:image URLs
  if (normalizedUrl.startsWith('data:image/') || normalizedUrl.startsWith('data:video/')) {
    const isVid = normalizedUrl.startsWith('data:video/');
    return {
      isValid: true,
      rawUrl,
      normalizedUrl,
      mediaType: isVid ? 'video' : 'image',
      isYouTube: false,
      isDirectVideo: isVid,
      isImage: !isVid,
      formatLabel: isVid ? 'Local Base64 Video' : 'Local Base64 Image',
      mimeTypeHint: isVid ? 'video/mp4' : 'image/png',
      platformCompatibility: {
        youtube: { compatible: true, reason: isVid ? 'Direct video asset ready for YouTube Data API.' : 'Image asset (syndicated as YouTube Channel Community Post / Presentation).' },
        tiktok: { compatible: isVid, reason: isVid ? 'Direct video file ready for TikTok upload.' : 'TikTok requires a video file (.mp4/.mov).', requiredAction: 'Provide video asset for TikTok.' },
        instagram: { compatible: true, reason: 'Media asset ready for Instagram publishing.' },
        facebook: { compatible: true, reason: 'Media asset ready for Facebook publishing.' },
        linkedin: { compatible: true, reason: 'Media asset ready for LinkedIn media post.' },
        twitter: { compatible: true, reason: 'Media asset ready for X / Twitter.' },
        whatsapp: { compatible: true, reason: 'Media asset ready for WhatsApp broadcast.' },
        custom: { compatible: true, reason: 'Included in custom webhook payload.' }
      },
      warnings: []
    };
  }

  // Handle blob: URLs
  if (normalizedUrl.startsWith('blob:')) {
    return {
      isValid: true,
      rawUrl,
      normalizedUrl,
      mediaType: 'image',
      isYouTube: false,
      isDirectVideo: false,
      isImage: true,
      formatLabel: 'Local Uploaded Media',
      mimeTypeHint: 'image/jpeg',
      platformCompatibility: {
        youtube: { compatible: true, reason: 'Uploaded media asset (syndicated as YouTube Channel Announcement / Community Post).' },
        tiktok: { compatible: true, reason: 'Uploaded media asset prepared for TikTok publishing.' },
        instagram: { compatible: true, reason: 'Uploaded media asset ready for Instagram photo/carousel.' },
        facebook: { compatible: true, reason: 'Uploaded media asset ready for Facebook Page broadcast.' },
        linkedin: { compatible: true, reason: 'Uploaded media asset ready for LinkedIn company feed.' },
        twitter: { compatible: true, reason: 'Uploaded media asset ready for X / Twitter.' },
        whatsapp: { compatible: true, reason: 'Uploaded media asset ready for WhatsApp status/broadcast.' },
        custom: { compatible: true, reason: 'Included in webhook syndication payload.' }
      },
      warnings: []
    };
  }

  // Validate basic URL syntax
  let parsedUrl: URL | null = null;
  try {
    parsedUrl = new URL(normalizedUrl);
  } catch {
    return {
      ...defaultEmpty,
      rawUrl,
      normalizedUrl,
      formatLabel: 'Invalid URL Format',
      warnings: ['The provided media URL is not a valid HTTP/HTTPS URL.']
    };
  }

  const pathname = parsedUrl.pathname.toLowerCase();
  const hostname = parsedUrl.hostname.toLowerCase();
  const search = parsedUrl.search.toLowerCase();
  const fullUrlLower = normalizedUrl.toLowerCase();

  // Check 1: YouTube Detection
  const youtubeId = extractYouTubeId(normalizedUrl);
  if (youtubeId || hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
    const validId = youtubeId || 'sample';
    const embedUrl = `https://www.youtube-nocookie.com/embed/${validId}`;
    return {
      isValid: Boolean(youtubeId),
      rawUrl,
      normalizedUrl,
      mediaType: 'youtube',
      isYouTube: true,
      isDirectVideo: true,
      isImage: false,
      youtubeId: validId,
      youtubeEmbedUrl: embedUrl,
      formatLabel: 'YouTube Video Link',
      mimeTypeHint: 'video/youtube',
      platformCompatibility: {
        youtube: { compatible: true, reason: 'Direct YouTube video link (syndicated via YouTube Data API v3)' },
        tiktok: { compatible: false, reason: 'TikTok requires a raw direct video file (.mp4/.mov), not an external YouTube web link.', requiredAction: 'Provide direct .mp4 or Cloudinary video URL for TikTok.' },
        instagram: { compatible: false, reason: 'Instagram API requires a direct public media file URL (.mp4 or .jpg), not a YouTube link.', requiredAction: 'Provide direct image/video URL for Instagram.' },
        facebook: { compatible: true, reason: 'Facebook supports YouTube link rich previews.' },
        linkedin: { compatible: true, reason: 'LinkedIn supports YouTube rich media cards.' },
        twitter: { compatible: true, reason: 'X / Twitter supports embedded YouTube player cards.' },
        whatsapp: { compatible: true, reason: 'WhatsApp renders rich YouTube video playback cards in chat.' },
        custom: { compatible: true, reason: 'Custom webhook receives full YouTube URL in payload.' }
      },
      warnings: !youtubeId ? ['Could not extract 11-character YouTube video ID from URL.'] : []
    };
  }

  // Check 2: Direct Video formats (.mp4, .mov, .webm, .mkv, Cloudinary video upload, etc.)
  const videoExts = ['.mp4', '.mov', '.webm', '.mkv', '.avi', '.m4v', '.ogv'];
  const hasVideoExt = videoExts.some(ext => pathname.endsWith(ext) || search.includes(ext));
  const isCloudinaryVideo = hostname.includes('cloudinary.com') && pathname.includes('/video/');

  if (hasVideoExt || isCloudinaryVideo) {
    const ext = videoExts.find(e => pathname.endsWith(e) || search.includes(e)) || '.mp4';
    return {
      isValid: true,
      rawUrl,
      normalizedUrl,
      mediaType: 'video',
      isYouTube: false,
      isDirectVideo: true,
      isImage: false,
      fileExtension: ext,
      formatLabel: `Direct Video Asset (${ext.toUpperCase().replace('.', '')})`,
      mimeTypeHint: `video/${ext.replace('.', '')}`,
      platformCompatibility: {
        youtube: { compatible: true, reason: 'Valid video file for YouTube Video Upload API.' },
        tiktok: { compatible: true, reason: 'Valid video file for TikTok Creator API publishing.' },
        instagram: { compatible: true, reason: 'Valid video file for Instagram Reels / Video publishing.' },
        facebook: { compatible: true, reason: 'Valid video file for Facebook Graph API video publish.' },
        linkedin: { compatible: true, reason: 'Valid video file for LinkedIn UGC Video post.' },
        twitter: { compatible: true, reason: 'Valid video file for X / Twitter Media Upload.' },
        whatsapp: { compatible: true, reason: 'Valid video attachment for WhatsApp Business API.' },
        custom: { compatible: true, reason: 'Direct video URL included in webhook payload.' }
      },
      warnings: []
    };
  }

  // Check 3: Image formats & Image Host / CDN Detection
  const imageExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.svg', '.avif', '.bmp', '.jfif'];
  const hasImageExt = imageExts.some(ext => pathname.endsWith(ext) || search.includes(ext) || fullUrlLower.includes(ext));
  const isKnownImageHost = [
    'images.unsplash.com',
    'unsplash.com',
    'kommodo.ai',
    'images.pexels.com',
    'pexels.com',
    'cloudinary.com',
    'imgur.com',
    'i.imgur.com',
    'fbcdn.net',
    'cdninstagram.com',
    'twimg.com',
    'googleusercontent.com',
    'postimg.cc',
    'i.postimg.cc',
    'ibb.co',
    'i.ibb.co',
    'wikimedia.org',
    'githubusercontent.com',
    'supabase.co',
    'firebasestorage.googleapis.com'
  ].some(domain => hostname.includes(domain));

  const hasImageKeyword = fullUrlLower.includes('/photo-') || fullUrlLower.includes('/image/') || fullUrlLower.includes('/img/') || fullUrlLower.includes('format=jpg') || fullUrlLower.includes('format=png') || fullUrlLower.includes('auto=format');

  // Treat as image if it matches extensions, known image host/CDN, or image keywords, OR if it is a general HTTP/HTTPS link not classified as video
  if (hasImageExt || isKnownImageHost || hasImageKeyword || parsedUrl.protocol.startsWith('http')) {
    const ext = imageExts.find(e => pathname.endsWith(e) || search.includes(e)) || '.jpg';
    return {
      isValid: true,
      rawUrl,
      normalizedUrl,
      mediaType: 'image',
      isYouTube: false,
      isDirectVideo: false,
      isImage: true,
      fileExtension: ext,
      formatLabel: hasImageExt ? `High-Res Image (${ext.toUpperCase().replace('.', '')})` : 'Web Image Asset',
      mimeTypeHint: `image/${ext.replace('.', '')}`,
      platformCompatibility: {
        youtube: { compatible: false, reason: 'YouTube requires video media. Static images are not supported for standard YouTube video uploads.', requiredAction: 'Attach a video file or YouTube URL for YouTube publishing.' },
        tiktok: { compatible: false, reason: 'TikTok requires a video file (.mp4/.mov). Static image alone cannot be published to TikTok.', requiredAction: 'Attach a video file for TikTok.' },
        instagram: { compatible: true, reason: 'Valid image asset for Instagram Graph API Feed publishing.' },
        facebook: { compatible: true, reason: 'Valid image asset for Facebook Page Photo publishing.' },
        linkedin: { compatible: true, reason: 'Valid image asset for LinkedIn Rich Media post.' },
        twitter: { compatible: true, reason: 'Valid image asset for X / Twitter Media Upload.' },
        whatsapp: { compatible: true, reason: 'Valid image asset for WhatsApp Media Message.' },
        custom: { compatible: true, reason: 'Image URL included in webhook payload.' }
      },
      warnings: []
    };
  }

  // Fallback
  return {
    isValid: true,
    rawUrl,
    normalizedUrl,
    mediaType: 'image',
    isYouTube: false,
    isDirectVideo: false,
    isImage: true,
    formatLabel: 'Web Media Link',
    mimeTypeHint: 'image/jpeg',
    platformCompatibility: {
      youtube: { compatible: false, reason: 'YouTube requires video media.' },
      tiktok: { compatible: false, reason: 'TikTok requires video media.' },
      instagram: { compatible: true, reason: 'Image attachment for Instagram.' },
      facebook: { compatible: true, reason: 'Facebook supports media link.' },
      linkedin: { compatible: true, reason: 'LinkedIn supports media attachment.' },
      twitter: { compatible: true, reason: 'X supports media attachment.' },
      whatsapp: { compatible: true, reason: 'WhatsApp supports media.' },
      custom: { compatible: true, reason: 'Custom webhook receives mediaUrl.' }
    },
    warnings: []
  };
}
