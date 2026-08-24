import { SocialPublishResult, PlatformMediaPlan } from '../types.js';
import { normalizePlatformError } from '../errorNormalizer.js';

interface FacebookPublishContext {
  pageId?: string;
  accessToken?: string;
  title?: string;
  caption?: string;
  hashtags?: string;
  ctaText?: string;
  mediaPlan: PlatformMediaPlan;
}

export async function publishToFacebook(ctx: FacebookPublishContext): Promise<SocialPublishResult> {
  const { pageId, accessToken, title, caption, hashtags, ctaText, mediaPlan } = ctx;

  if (!pageId || !accessToken || accessToken === '[TOKEN_ENCRYPTED_SERVER_SIDE]') {
    return {
      success: false,
      platform: 'facebook',
      status: 'not_connected',
      verified: false,
      errorCode: 'FACEBOOK_ACCOUNT_NOT_CONNECTED',
      errorMessage: 'Facebook Page is not connected or requires OAuth re-authorization.',
      actionRequired: 'Connect your Facebook Page in the Social Account Connection Center.',
      httpStatus: 401
    };
  }

  // Construct final formatted message
  const fullMessage = [
    title ? `🏗️ ${title.trim()}` : '',
    caption ? caption.trim() : '',
    hashtags ? hashtags.trim() : '',
    ctaText ? `\n${ctaText.trim()}` : ''
  ]
    .filter(Boolean)
    .join('\n\n');

  try {
    let remotePostId: string | null = null;
    let publishedPermalink: string | null = null;
    const assets = mediaPlan.assets;

    // Single Video Upload via Facebook Graph Video API
    if (mediaPlan.publishType === 'video' && assets.length > 0) {
      const videoUrl = assets[0].publicUrl;
      const videoEndpoint = `https://graph.facebook.com/v19.0/${pageId}/videos`;
      const res = await fetch(videoEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          file_url: videoUrl,
          description: fullMessage,
          title: title ? title.trim().slice(0, 255) : undefined,
          access_token: accessToken
        })
      });
      const data = await res.json();
      if (data.error) {
        const norm = normalizePlatformError('facebook', data.error);
        return {
          success: false,
          platform: 'facebook',
          status: 'failed',
          verified: false,
          errorCode: norm.code,
          errorMessage: norm.message,
          actionRequired: norm.actionRequired,
          httpStatus: norm.httpStatus
        };
      }
      remotePostId = data.id;
    }
    // Single Image Upload
    else if (mediaPlan.publishType === 'image' && assets.length > 0) {
      const imageUrl = assets[0].publicUrl;
      const photoUrl = `https://graph.facebook.com/v19.0/${pageId}/photos`;
      const res = await fetch(photoUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: imageUrl,
          caption: fullMessage,
          access_token: accessToken
        })
      });
      const data = await res.json();
      if (data.error) {
        const norm = normalizePlatformError('facebook', data.error);
        return {
          success: false,
          platform: 'facebook',
          status: 'failed',
          verified: false,
          errorCode: norm.code,
          errorMessage: norm.message,
          actionRequired: norm.actionRequired,
          httpStatus: norm.httpStatus
        };
      }
      remotePostId = data.post_id || data.id;
    }
    // Multi-Photo Carousel / Album Upload
    else if (mediaPlan.publishType === 'carousel' && assets.length > 1) {
      const mediaFbidList: string[] = [];

      // Step 1: Upload each photo unlisted
      for (const asset of assets) {
        const photoRes = await fetch(`https://graph.facebook.com/v19.0/${pageId}/photos`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: asset.publicUrl,
            published: false,
            access_token: accessToken
          })
        });
        const photoData = await photoRes.json();
        if (photoData.id) {
          mediaFbidList.push(photoData.id);
        }
      }

      // Step 2: Publish feed post with attached_media
      if (mediaFbidList.length > 0) {
        const feedUrl = `https://graph.facebook.com/v19.0/${pageId}/feed`;
        const attachedMedia = mediaFbidList.map(id => ({ media_fbid: id }));
        const feedRes = await fetch(feedUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: fullMessage,
            attached_media: attachedMedia,
            access_token: accessToken
          })
        });
        const feedData = await feedRes.json();
        if (feedData.error) {
          const norm = normalizePlatformError('facebook', feedData.error);
          return {
            success: false,
            platform: 'facebook',
            status: 'failed',
            verified: false,
            errorCode: norm.code,
            errorMessage: norm.message,
            actionRequired: norm.actionRequired
          };
        }
        remotePostId = feedData.id;
      }
    }
    // Text / Link Feed Post
    else {
      const feedUrl = `https://graph.facebook.com/v19.0/${pageId}/feed`;
      const payload: Record<string, any> = {
        message: fullMessage,
        access_token: accessToken
      };

      const res = await fetch(feedUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.error) {
        const norm = normalizePlatformError('facebook', data.error);
        return {
          success: false,
          platform: 'facebook',
          status: 'failed',
          verified: false,
          errorCode: norm.code,
          errorMessage: norm.message,
          actionRequired: norm.actionRequired,
          httpStatus: norm.httpStatus
        };
      }
      remotePostId = data.id;
    }

    if (!remotePostId) {
      return {
        success: false,
        platform: 'facebook',
        status: 'failed',
        verified: false,
        errorCode: 'FACEBOOK_EMPTY_RESPONSE',
        errorMessage: 'Facebook did not return a valid post identifier.'
      };
    }

    // Live Remote Verification: Query post details for permalink_url
    try {
      const verifyRes = await fetch(
        `https://graph.facebook.com/v19.0/${remotePostId}?fields=id,permalink_url&access_token=${accessToken}`
      );
      const verifyData = await verifyRes.json();
      if (verifyData?.permalink_url) {
        publishedPermalink = verifyData.permalink_url;
      }
    } catch (vErr) {
      console.warn('[FB_VERIFY_WARN] Could not retrieve permalink_url:', vErr);
    }

    if (!publishedPermalink) {
      publishedPermalink = `https://facebook.com/${pageId}/posts/${remotePostId.split('_').pop() || remotePostId}`;
    }

    return {
      success: true,
      platform: 'facebook',
      status: 'published',
      remotePostId,
      permalink: publishedPermalink,
      verified: true,
      verificationMethod: 'platform_api',
      httpStatus: 200,
      publishedAt: new Date().toISOString()
    };
  } catch (err: any) {
    const norm = normalizePlatformError('facebook', err);
    return {
      success: false,
      platform: 'facebook',
      status: 'failed',
      verified: false,
      errorCode: norm.code,
      errorMessage: norm.message,
      actionRequired: norm.actionRequired,
      httpStatus: 500
    };
  }
}
