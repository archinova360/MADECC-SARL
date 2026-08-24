import { MediaAsset, PlatformMediaPlan, SocialPlatform } from './types.js';
import { isYouTubeUrl } from './mediaResolver.js';

export function createPlatformMediaPlan(
  platform: SocialPlatform,
  assets: MediaAsset[]
): PlatformMediaPlan {
  const warnings: string[] = [];
  const errors: string[] = [];
  const count = assets.length;

  const hasVideo = assets.some(a => a.mediaType === 'video');
  const hasImage = assets.some(a => a.mediaType === 'image');
  const hasDocument = assets.some(a => a.mediaType === 'document');
  const firstAsset = assets[0];
  const firstIsYouTube = firstAsset && isYouTubeUrl(firstAsset.publicUrl);

  switch (platform) {
    case 'facebook': {
      if (count === 0) {
        return {
          platform,
          compatible: true,
          publishType: 'text_only',
          assets: [],
          warnings: ['Publishing as standard text status update without media.'],
          errors: []
        };
      }
      if (count > 1 && !hasVideo) {
        return {
          platform,
          compatible: true,
          publishType: 'carousel',
          assets: assets.slice(0, 10),
          warnings: count > 10 ? ['Facebook supports max 10 photos per multi-photo post. First 10 selected.'] : [],
          errors: []
        };
      }
      if (hasVideo) {
        return {
          platform,
          compatible: true,
          publishType: 'video',
          assets: [assets.find(a => a.mediaType === 'video')!],
          warnings: firstIsYouTube ? ['Using YouTube video link preview on Facebook.'] : [],
          errors: []
        };
      }
      return {
        platform,
        compatible: true,
        publishType: 'image',
        assets: [assets.find(a => a.mediaType === 'image')!],
        warnings: [],
        errors: []
      };
    }

    case 'instagram': {
      if (count === 0) {
        return {
          platform,
          compatible: false,
          publishType: 'text_only',
          assets: [],
          warnings: [],
          errors: ['Instagram requires at least one image or video asset. Text-only posts cannot be published.']
        };
      }
      if (firstIsYouTube) {
        return {
          platform,
          compatible: false,
          publishType: 'video',
          assets: [firstAsset],
          warnings: [],
          errors: ['Instagram requires a direct video file (.mp4/.mov). External YouTube links cannot be published to Instagram.']
        };
      }
      if (count > 1 && !hasVideo) {
        return {
          platform,
          compatible: true,
          publishType: 'carousel',
          assets: assets.slice(0, 10),
          warnings: count > 10 ? ['Instagram carousel capped at 10 items.'] : [],
          errors: []
        };
      }
      if (hasVideo) {
        const videoAsset = assets.find(a => a.mediaType === 'video')!;
        return {
          platform,
          compatible: true,
          publishType: 'reel',
          assets: [videoAsset],
          warnings: ['Video will be published via Instagram Reels / Video Container.'],
          errors: []
        };
      }
      return {
        platform,
        compatible: true,
        publishType: 'image',
        assets: [assets.find(a => a.mediaType === 'image')!],
        warnings: [],
        errors: []
      };
    }

    case 'youtube': {
      if (!hasVideo) {
        return {
          platform,
          compatible: false,
          publishType: 'video',
          assets: [],
          warnings: [],
          errors: ['YouTube requires video media for direct video publishing. Add an MP4/MOV video asset before publishing.']
        };
      }
      const videoAsset = assets.find(a => a.mediaType === 'video')!;
      return {
        platform,
        compatible: true,
        publishType: 'video',
        assets: [videoAsset],
        warnings: firstIsYouTube ? ['Existing YouTube URL detected. Channel upload requires source video binary.'] : [],
        errors: []
      };
    }

    case 'tiktok': {
      if (count === 0) {
        return {
          platform,
          compatible: false,
          publishType: 'text_only',
          assets: [],
          warnings: [],
          errors: ['TikTok requires either a video asset or photos for TikTok Photo Mode.']
        };
      }
      if (hasVideo) {
        return {
          platform,
          compatible: true,
          publishType: 'video',
          assets: [assets.find(a => a.mediaType === 'video')!],
          warnings: ['TikTok recommends 9:16 vertical video ratio.'],
          errors: []
        };
      }
      return {
        platform,
        compatible: true,
        publishType: 'photo_post',
        assets: assets.filter(a => a.mediaType === 'image'),
        warnings: ['Publishing in TikTok Photo Mode carousel.'],
        errors: []
      };
    }

    case 'whatsapp': {
      if (count === 0) {
        return {
          platform,
          compatible: true,
          publishType: 'message',
          assets: [],
          warnings: ['Sending direct WhatsApp text broadcast message.'],
          errors: []
        };
      }
      if (hasVideo) {
        return {
          platform,
          compatible: true,
          publishType: 'video',
          assets: [assets.find(a => a.mediaType === 'video')!],
          warnings: ['Sending video media message via WhatsApp Cloud API.'],
          errors: []
        };
      }
      if (hasDocument) {
        return {
          platform,
          compatible: true,
          publishType: 'message',
          assets: [assets.find(a => a.mediaType === 'document')!],
          warnings: ['Sending document media message via WhatsApp Cloud API.'],
          errors: []
        };
      }
      return {
        platform,
        compatible: true,
        publishType: 'image',
        assets: [assets.find(a => a.mediaType === 'image')!],
        warnings: count > 1 ? ['WhatsApp Cloud API message will send the primary image with caption.'] : [],
        errors: []
      };
    }

    case 'linkedin': {
      if (count === 0) {
        return {
          platform,
          compatible: true,
          publishType: 'text_only',
          assets: [],
          warnings: [],
          errors: []
        };
      }
      if (hasVideo) {
        return {
          platform,
          compatible: true,
          publishType: 'video',
          assets: [assets.find(a => a.mediaType === 'video')!],
          warnings: [],
          errors: []
        };
      }
      return {
        platform,
        compatible: true,
        publishType: count > 1 ? 'carousel' : 'image',
        assets: assets.filter(a => a.mediaType === 'image'),
        warnings: [],
        errors: []
      };
    }

    case 'twitter': {
      if (count === 0) {
        return {
          platform,
          compatible: true,
          publishType: 'text_only',
          assets: [],
          warnings: [],
          errors: []
        };
      }
      if (hasVideo) {
        return {
          platform,
          compatible: true,
          publishType: 'video',
          assets: [assets.find(a => a.mediaType === 'video')!],
          warnings: [],
          errors: []
        };
      }
      return {
        platform,
        compatible: true,
        publishType: 'photo_post',
        assets: assets.slice(0, 4),
        warnings: count > 4 ? ['X/Twitter supports max 4 images per tweet. First 4 selected.'] : [],
        errors: []
      };
    }

    case 'custom':
    default: {
      return {
        platform: 'custom',
        compatible: true,
        publishType: hasVideo ? 'video' : hasImage ? 'image' : 'text_only',
        assets,
        warnings: [],
        errors: []
      };
    }
  }
}
