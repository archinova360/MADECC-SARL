import { SocialPublishResult, PlatformMediaPlan } from '../types.js';
import { normalizePlatformError } from '../errorNormalizer.js';

interface TikTokPublishContext {
  openId?: string;
  accessToken?: string;
  title?: string;
  caption?: string;
  hashtags?: string;
  ctaText?: string;
  mediaPlan: PlatformMediaPlan;
}

export async function publishToTikTok(ctx: TikTokPublishContext): Promise<SocialPublishResult> {
  const { openId, accessToken, title, caption, hashtags, ctaText, mediaPlan } = ctx;

  if (!accessToken || accessToken === '[TOKEN_ENCRYPTED_SERVER_SIDE]') {
    return {
      success: false,
      platform: 'tiktok',
      status: 'not_connected',
      verified: false,
      errorCode: 'TIKTOK_ACCOUNT_NOT_CONNECTED',
      errorMessage: 'TikTok Creator/Business account is not connected or token has expired.',
      actionRequired: 'Authorize your TikTok account in the Social Account Connection Center.',
      httpStatus: 401
    };
  }

  if (!mediaPlan.compatible || mediaPlan.assets.length === 0) {
    return {
      success: false,
      platform: 'tiktok',
      status: 'failed',
      verified: false,
      errorCode: 'TIKTOK_MEDIA_REQUIRED',
      errorMessage: 'TikTok requires a video asset (.mp4) or photos in photo mode.',
      actionRequired: 'Attach a video or photo asset before publishing to TikTok.',
      httpStatus: 400
    };
  }

  const fullCaption = [
    title ? `[MADECC] ${title.trim()}` : '',
    caption ? caption.trim() : '',
    hashtags ? hashtags.trim() : ''
  ]
    .filter(Boolean)
    .join('\n\n')
    .slice(0, 2200);

  try {
    const assets = mediaPlan.assets;

    // Video Direct Post Initialization
    if (mediaPlan.publishType === 'video') {
      const videoUrl = assets[0].publicUrl;

      const initRes = await fetch('https://open.tiktokapis.com/v2/post/publish/video/init/', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          post_info: {
            title: fullCaption,
            privacy_level: 'PUBLIC_TO_EVERYONE',
            disable_duet: false,
            disable_stitch: false,
            disable_comment: false,
            video_cover_timestamp_ms: 1000
          },
          source_info: {
            source: 'PULL_FROM_URL',
            video_url: videoUrl
          }
        })
      });

      const initData = await initRes.json();

      if (initData.error && initData.error.code !== 'ok' && initData.error.code !== 0) {
        const norm = normalizePlatformError('tiktok', initData.error);
        return {
          success: false,
          platform: 'tiktok',
          status: 'failed',
          verified: false,
          errorCode: norm.code,
          errorMessage: norm.message,
          actionRequired: norm.actionRequired
        };
      }

      const publishId = initData?.data?.publish_id || `tt_pub_${Date.now()}`;

      return {
        success: true,
        platform: 'tiktok',
        status: 'processing',
        publishId,
        remotePostId: publishId,
        verified: false,
        verificationMethod: 'platform_status',
        metadata: {
          publishId,
          notice: 'TikTok Direct Post session initialized. Media undergoing server-side transcoding on TikTok.'
        }
      };
    }

    // Photo Mode Post Initialization
    const photoUrls = assets.filter(a => a.mediaType === 'image').map(a => a.publicUrl);
    const photoRes = await fetch('https://open.tiktokapis.com/v2/post/publish/content/init/', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        post_info: {
          title: fullCaption,
          privacy_level: 'PUBLIC_TO_EVERYONE'
        },
        source_info: {
          source: 'PULL_FROM_URL',
          photo_images: photoUrls
        },
        post_mode: 'DIRECT_POST',
        media_type: 'PHOTO'
      })
    });

    const photoData = await photoRes.json();
    if (photoData.error && photoData.error.code !== 'ok') {
      const norm = normalizePlatformError('tiktok', photoData.error);
      return {
        success: false,
        platform: 'tiktok',
        status: 'failed',
        verified: false,
        errorCode: norm.code,
        errorMessage: norm.message,
        actionRequired: norm.actionRequired
      };
    }

    const publishId = photoData?.data?.publish_id || `tt_photo_${Date.now()}`;

    return {
      success: true,
      platform: 'tiktok',
      status: 'processing',
      publishId,
      remotePostId: publishId,
      verified: false,
      verificationMethod: 'platform_status'
    };
  } catch (err: any) {
    const norm = normalizePlatformError('tiktok', err);
    return {
      success: false,
      platform: 'tiktok',
      status: 'failed',
      verified: false,
      errorCode: norm.code,
      errorMessage: norm.message,
      actionRequired: norm.actionRequired
    };
  }
}
