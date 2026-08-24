import { SocialPublishResult, PlatformMediaPlan } from '../types.js';
import { normalizePlatformError } from '../errorNormalizer.js';

interface InstagramPublishContext {
  igUserId?: string;
  accessToken?: string;
  caption?: string;
  hashtags?: string;
  ctaText?: string;
  mediaPlan: PlatformMediaPlan;
}

export async function publishToInstagram(ctx: InstagramPublishContext): Promise<SocialPublishResult> {
  const { igUserId, accessToken, caption, hashtags, ctaText, mediaPlan } = ctx;

  if (!igUserId || !accessToken || accessToken === '[TOKEN_ENCRYPTED_SERVER_SIDE]') {
    return {
      success: false,
      platform: 'instagram',
      status: 'not_connected',
      verified: false,
      errorCode: 'INSTAGRAM_ACCOUNT_NOT_CONNECTED',
      errorMessage: 'Instagram Business/Creator account is not connected or requires OAuth re-authorization.',
      actionRequired: 'Connect an Instagram Professional account linked to your Facebook Page.',
      httpStatus: 401
    };
  }

  if (!mediaPlan.compatible || mediaPlan.assets.length === 0) {
    return {
      success: false,
      platform: 'instagram',
      status: 'failed',
      verified: false,
      errorCode: 'INSTAGRAM_MEDIA_REQUIRED',
      errorMessage: mediaPlan.errors[0] || 'Instagram requires a direct image (.jpg/.png) or video (.mp4/.mov) asset.',
      actionRequired: 'Attach a supported image or video asset before publishing to Instagram.',
      httpStatus: 400
    };
  }

  const fullCaption = [
    caption ? caption.trim() : '',
    hashtags ? hashtags.trim() : '',
    ctaText ? `\n${ctaText.trim()}` : ''
  ]
    .filter(Boolean)
    .join('\n\n');

  try {
    const assets = mediaPlan.assets;

    // Single Image Flow
    if (mediaPlan.publishType === 'image') {
      const imageUrl = assets[0].publicUrl;

      // 1. Create Media Container
      const containerRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: imageUrl,
          caption: fullCaption,
          access_token: accessToken
        })
      });
      const containerData = await containerRes.json();

      if (containerData.error) {
        const norm = normalizePlatformError('instagram', containerData.error);
        return {
          success: false,
          platform: 'instagram',
          status: 'failed',
          verified: false,
          errorCode: norm.code,
          errorMessage: norm.message,
          actionRequired: norm.actionRequired,
          httpStatus: norm.httpStatus
        };
      }

      const creationId = containerData.id;

      // 2. Publish Container
      const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creation_id: creationId,
          access_token: accessToken
        })
      });
      const publishData = await publishRes.json();

      if (publishData.error) {
        const norm = normalizePlatformError('instagram', publishData.error);
        return {
          success: false,
          platform: 'instagram',
          status: 'failed',
          verified: false,
          errorCode: norm.code,
          errorMessage: norm.message,
          actionRequired: norm.actionRequired,
          httpStatus: norm.httpStatus
        };
      }

      const publishedMediaId = publishData.id;

      // 3. Retrieve Live Permalink
      let livePermalink = `https://instagram.com/p/${publishedMediaId}`;
      try {
        const permalinkRes = await fetch(
          `https://graph.facebook.com/v19.0/${publishedMediaId}?fields=permalink&access_token=${accessToken}`
        );
        const permalinkData = await permalinkRes.json();
        if (permalinkData?.permalink) {
          livePermalink = permalinkData.permalink;
        }
      } catch (pErr) {
        console.warn('[IG_PERMALINK_WARN]', pErr);
      }

      return {
        success: true,
        platform: 'instagram',
        status: 'published',
        remotePostId: publishedMediaId,
        permalink: livePermalink,
        verified: true,
        verificationMethod: 'platform_api',
        httpStatus: 200,
        publishedAt: new Date().toISOString()
      };
    }

    // Video / Reel Container Flow
    if (mediaPlan.publishType === 'reel' || mediaPlan.publishType === 'video') {
      const videoUrl = assets[0].publicUrl;

      // 1. Create Video Container
      const containerRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_type: 'REELS',
          video_url: videoUrl,
          caption: fullCaption,
          access_token: accessToken
        })
      });
      const containerData = await containerRes.json();

      if (containerData.error) {
        const norm = normalizePlatformError('instagram', containerData.error);
        return {
          success: false,
          platform: 'instagram',
          status: 'failed',
          verified: false,
          errorCode: norm.code,
          errorMessage: norm.message,
          actionRequired: norm.actionRequired
        };
      }

      const containerId = containerData.id;

      // Check Status
      const statusRes = await fetch(
        `https://graph.facebook.com/v19.0/${containerId}?fields=status_code&access_token=${accessToken}`
      );
      const statusData = await statusRes.json();
      const statusCode = statusData?.status_code;

      if (statusCode === 'FINISHED') {
        // Publish immediately
        const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ creation_id: containerId, access_token: accessToken })
        });
        const publishData = await publishRes.json();
        if (publishData.id) {
          return {
            success: true,
            platform: 'instagram',
            status: 'published',
            remotePostId: publishData.id,
            permalink: `https://instagram.com/reel/${publishData.id}`,
            verified: true,
            verificationMethod: 'platform_api',
            publishedAt: new Date().toISOString()
          };
        }
      }

      // Container accepted but still transcoding
      return {
        success: true,
        platform: 'instagram',
        status: 'processing',
        remoteMediaId: containerId,
        verified: false,
        verificationMethod: 'platform_status',
        metadata: {
          containerId,
          statusCode: statusCode || 'IN_PROGRESS',
          notice: 'Video accepted by Meta. Media is currently transcoding on Instagram ingest servers.'
        }
      };
    }

    // Carousel Flow
    if (mediaPlan.publishType === 'carousel') {
      const childContainerIds: string[] = [];

      for (const item of assets.slice(0, 10)) {
        const itemRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image_url: item.publicUrl,
            is_carousel_item: true,
            access_token: accessToken
          })
        });
        const itemData = await itemRes.json();
        if (itemData.id) childContainerIds.push(itemData.id);
      }

      if (childContainerIds.length < 2) {
        return {
          success: false,
          platform: 'instagram',
          status: 'failed',
          verified: false,
          errorCode: 'INSTAGRAM_CAROUSEL_FAILED',
          errorMessage: 'Failed to create child media containers for Instagram carousel.'
        };
      }

      const parentRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          media_type: 'CAROUSEL',
          children: childContainerIds,
          caption: fullCaption,
          access_token: accessToken
        })
      });
      const parentData = await parentRes.json();

      if (parentData.error) {
        const norm = normalizePlatformError('instagram', parentData.error);
        return {
          success: false,
          platform: 'instagram',
          status: 'failed',
          verified: false,
          errorCode: norm.code,
          errorMessage: norm.message
        };
      }

      const publishRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ creation_id: parentData.id, access_token: accessToken })
      });
      const publishData = await publishRes.json();

      if (publishData.id) {
        return {
          success: true,
          platform: 'instagram',
          status: 'published',
          remotePostId: publishData.id,
          permalink: `https://instagram.com/p/${publishData.id}`,
          verified: true,
          verificationMethod: 'platform_api',
          publishedAt: new Date().toISOString()
        };
      }
    }

    return {
      success: false,
      platform: 'instagram',
      status: 'failed',
      verified: false,
      errorCode: 'INSTAGRAM_UNSUPPORTED_FLOW',
      errorMessage: 'Unable to execute publishing for specified Instagram media configuration.'
    };
  } catch (err: any) {
    const norm = normalizePlatformError('instagram', err);
    return {
      success: false,
      platform: 'instagram',
      status: 'failed',
      verified: false,
      errorCode: norm.code,
      errorMessage: norm.message,
      actionRequired: norm.actionRequired
    };
  }
}
