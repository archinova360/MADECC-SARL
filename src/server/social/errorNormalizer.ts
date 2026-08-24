export interface NormalizedPlatformError {
  code: string;
  message: string;
  actionRequired: string;
  httpStatus: number;
}

export function normalizePlatformError(platform: string, err: any, customCode?: string): NormalizedPlatformError {
  const errMsg = String(err?.message || err?.error_description || err?.error || err || 'Unknown API error');
  const errCode = String(err?.code || err?.error_subcode || customCode || 'API_ERROR');
  const upperMsg = errMsg.toUpperCase();

  // Facebook & Instagram
  if (platform === 'facebook' || platform === 'instagram') {
    if (upperMsg.includes('OAUTHEXCEPTION') || upperMsg.includes('SESSION HAS EXPIRED') || upperMsg.includes('INVALID OAUTH') || upperMsg.includes('190')) {
      return {
        code: `${platform.toUpperCase()}_TOKEN_EXPIRED`,
        message: 'The Meta OAuth access token has expired or was revoked. Re-authorization is required.',
        actionRequired: 'Open Social Account Connection Center and click "Authorize with Facebook / Meta".',
        httpStatus: 401
      };
    }
    if (upperMsg.includes('PERMISSION') || upperMsg.includes('PAGES_MANAGE_POSTS') || upperMsg.includes('INSTAGRAM_CONTENT_PUBLISH') || upperMsg.includes('200')) {
      return {
        code: `${platform.toUpperCase()}_PERMISSION_DENIED`,
        message: 'The connected Meta token lacks required publishing permissions.',
        actionRequired: 'Ensure pages_manage_posts and instagram_content_publish scopes are granted during Meta OAuth.',
        httpStatus: 403
      };
    }
    if (upperMsg.includes('CONTAINER') || upperMsg.includes('TRANSCODE') || upperMsg.includes('MEDIA_ERROR')) {
      return {
        code: 'INSTAGRAM_CONTAINER_PROCESSING_FAILED',
        message: `Instagram media processing failed: ${errMsg}`,
        actionRequired: 'Verify that the image/video conforms to Instagram aspect ratio and codec standards (H.264/AAC).',
        httpStatus: 422
      };
    }
  }

  // YouTube
  if (platform === 'youtube') {
    if (
      upperMsg.includes('TOKEN') ||
      upperMsg.includes('UNAUTHORIZED') ||
      upperMsg.includes('401') ||
      upperMsg.includes('190') ||
      upperMsg.includes('INVALID_GRANT') ||
      upperMsg.includes('BAD REQUEST') ||
      upperMsg.includes('REAUTH') ||
      errCode.includes('190') ||
      errCode.includes('TOKEN')
    ) {
      return {
        code: 'YOUTUBE_TOKEN_EXPIRED',
        message: 'YouTube/Google OAuth token is expired or requires re-authorization. Please reconnect your YouTube channel.',
        actionRequired: 'Re-authenticate your Google Account in the Connection Center.',
        httpStatus: 401
      };
    }
    if (upperMsg.includes('QUOTA') || upperMsg.includes('RATE LIMIT')) {
      return {
        code: 'YOUTUBE_QUOTA_EXCEEDED',
        message: 'YouTube API daily upload quota exceeded.',
        actionRequired: 'Wait for quota reset or request YouTube API quota expansion in Google Cloud Console.',
        httpStatus: 429
      };
    }
    if (upperMsg.includes('VIDEO_REQUIRED') || upperMsg.includes('NO VIDEO')) {
      return {
        code: 'YOUTUBE_VIDEO_REQUIRED',
        message: 'YouTube only accepts video files (.mp4/.mov). Static images or text cannot be uploaded to YouTube.',
        actionRequired: 'Attach a video asset or remove YouTube from target destinations.',
        httpStatus: 400
      };
    }
  }

  // WhatsApp
  if (platform === 'whatsapp') {
    if (upperMsg.includes('ACCOUNT_NOT_CONNECTED') || upperMsg.includes('PHONE_NUMBER_ID')) {
      return {
        code: 'WHATSAPP_ACCOUNT_NOT_CONNECTED',
        message: 'WhatsApp Business Cloud API is not configured or missing Phone Number ID.',
        actionRequired: 'Configure WHATSAPP_PHONE_NUMBER_ID and access token in server settings.',
        httpStatus: 400
      };
    }
    if (upperMsg.includes('TEMPLATE') || upperMsg.includes('24 HOUR') || upperMsg.includes('131047')) {
      return {
        code: 'WHATSAPP_WINDOW_EXPIRED',
        message: '24-hour customer service messaging window expired. Requires an approved WhatsApp message template.',
        actionRequired: 'Send a pre-approved utility/marketing template message to initiate conversation.',
        httpStatus: 422
      };
    }
  }

  // TikTok
  if (platform === 'tiktok') {
    if (upperMsg.includes('NOT_CONNECTED') || upperMsg.includes('UNAUTHORIZED') || upperMsg.includes('TOKEN')) {
      return {
        code: 'TIKTOK_ACCOUNT_NOT_CONNECTED',
        message: 'TikTok Business account is not connected or token has expired.',
        actionRequired: 'Click "Authorize with TikTok" in Social Account Connection Center.',
        httpStatus: 401
      };
    }
    if (upperMsg.includes('VIDEO_REQUIRED')) {
      return {
        code: 'TIKTOK_VIDEO_REQUIRED',
        message: 'TikTok requires a video asset or photos in photo-mode.',
        actionRequired: 'Attach a video or photo asset.',
        httpStatus: 400
      };
    }
  }

  // LinkedIn
  if (platform === 'linkedin') {
    if (upperMsg.includes('TOKEN') || upperMsg.includes('UNAUTHORIZED') || upperMsg.includes('EXPIRED') || upperMsg.includes('401') || errCode.includes('401')) {
      return {
        code: 'LINKEDIN_TOKEN_EXPIRED',
        message: 'LinkedIn OAuth token has expired or is invalid. Re-authorization is required.',
        actionRequired: 'Re-authorize LinkedIn in the Social Account Connection Center.',
        httpStatus: 401
      };
    }
    if (upperMsg.includes('PERMISSION') || upperMsg.includes('FORBIDDEN') || upperMsg.includes('403') || errCode.includes('403')) {
      return {
        code: 'LINKEDIN_PERMISSION_DENIED',
        message: 'LinkedIn publishing scope missing (w_member_social or w_organization_social).',
        actionRequired: 'Reconnect LinkedIn and grant Member / Organization posting permissions.',
        httpStatus: 403
      };
    }
  }

  // Twitter / X
  if (platform === 'twitter' || platform === 'x') {
    if (upperMsg.includes('TOKEN') || upperMsg.includes('UNAUTHORIZED') || upperMsg.includes('401') || errCode.includes('401')) {
      return {
        code: 'TWITTER_TOKEN_EXPIRED',
        message: 'X (Twitter) OAuth token is expired or unauthorized.',
        actionRequired: 'Re-authorize X (Twitter) in the Social Account Connection Center.',
        httpStatus: 401
      };
    }
    if (upperMsg.includes('CHARACTER') || upperMsg.includes('280') || upperMsg.includes('TOO LONG')) {
      return {
        code: 'TWITTER_CHAR_LIMIT_EXCEEDED',
        message: 'Post exceeds Twitter/X 280-character maximum limit.',
        actionRequired: 'Trim caption or click "Auto-Fit 280" before publishing.',
        httpStatus: 400
      };
    }
  }

  return {
    code: customCode || `${platform.toUpperCase()}_PUBLISH_ERROR`,
    message: errMsg,
    actionRequired: 'Inspect platform configuration or review server logs for detailed trace.',
    httpStatus: 500
  };
}
