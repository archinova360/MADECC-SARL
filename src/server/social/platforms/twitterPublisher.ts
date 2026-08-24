import { SocialPublishResult, PlatformMediaPlan } from '../types.js';
import { normalizePlatformError } from '../errorNormalizer.js';

interface TwitterPublishContext {
  accessToken?: string;
  title?: string;
  caption?: string;
  hashtags?: string;
  ctaText?: string;
  mediaPlan: PlatformMediaPlan;
}

export async function publishToTwitter(ctx: TwitterPublishContext): Promise<SocialPublishResult> {
  const { accessToken, title, caption, hashtags, ctaText } = ctx;

  if (!accessToken || accessToken === '[TOKEN_ENCRYPTED_SERVER_SIDE]') {
    return {
      success: false,
      platform: 'twitter',
      status: 'not_connected',
      verified: false,
      errorCode: 'TWITTER_ACCOUNT_NOT_CONNECTED',
      errorMessage: 'X / Twitter account is not connected.',
      actionRequired: 'Authorize X (Twitter) in Social Account Connection Center.',
      httpStatus: 401
    };
  }

  // 280 character limit handling
  const shortText = [
    title ? `🏗️ ${title.trim()}` : '',
    caption ? caption.trim() : '',
    hashtags ? hashtags.trim() : '',
    ctaText ? ctaText.trim() : ''
  ]
    .filter(Boolean)
    .join('\n\n')
    .slice(0, 280);

  try {
    const res = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text: shortText })
    });

    const data = await res.json();

    if (data.errors || !data.data?.id) {
      const norm = normalizePlatformError('twitter', data.errors?.[0] || { message: 'Twitter API error' });
      return {
        success: false,
        platform: 'twitter',
        status: 'failed',
        verified: false,
        errorCode: norm.code,
        errorMessage: norm.message,
        actionRequired: norm.actionRequired
      };
    }

    const tweetId = data.data.id;

    return {
      success: true,
      platform: 'twitter',
      status: 'published',
      remotePostId: tweetId,
      permalink: `https://twitter.com/i/web/status/${tweetId}`,
      verified: true,
      verificationMethod: 'platform_api',
      publishedAt: new Date().toISOString()
    };
  } catch (err: any) {
    const norm = normalizePlatformError('twitter', err);
    return {
      success: false,
      platform: 'twitter',
      status: 'failed',
      verified: false,
      errorCode: norm.code,
      errorMessage: norm.message
    };
  }
}
