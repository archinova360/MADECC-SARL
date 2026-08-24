import { SocialPublishResult, PlatformMediaPlan } from '../types.js';
import { normalizePlatformError } from '../errorNormalizer.js';

interface LinkedInPublishContext {
  authorUrn?: string;
  accessToken?: string;
  title?: string;
  caption?: string;
  hashtags?: string;
  ctaText?: string;
  mediaPlan: PlatformMediaPlan;
}

export async function publishToLinkedIn(ctx: LinkedInPublishContext): Promise<SocialPublishResult> {
  const { authorUrn, accessToken, title, caption, hashtags, ctaText, mediaPlan } = ctx;

  if (!accessToken || accessToken === '[TOKEN_ENCRYPTED_SERVER_SIDE]') {
    return {
      success: false,
      platform: 'linkedin',
      status: 'not_connected',
      verified: false,
      errorCode: 'LINKEDIN_ACCOUNT_NOT_CONNECTED',
      errorMessage: 'LinkedIn account/Organization is not connected.',
      actionRequired: 'Authorize LinkedIn in Social Account Connection Center.',
      httpStatus: 401
    };
  }

  const fullText = [
    title ? `🏗️ ${title.trim()}` : '',
    caption ? caption.trim() : '',
    hashtags ? hashtags.trim() : '',
    ctaText ? `\n${ctaText.trim()}` : ''
  ]
    .filter(Boolean)
    .join('\n\n');

  try {
    const urn = authorUrn || 'urn:li:organization:madeccgroup';
    const payload: Record<string, any> = {
      author: urn,
      commentary: fullText,
      visibility: 'PUBLIC',
      distribution: {
        feedDistribution: 'MAIN_FEED',
        targetEntities: [],
        thirdPartyDistributionChannels: []
      },
      lifecycleState: 'PUBLISHED',
      isReshareDisabledByAuthor: false
    };

    const res = await fetch('https://api.linkedin.com/rest/posts', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'LinkedIn-Version': '202401',
        'X-Restli-Protocol-Version': '2.0.0'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok && res.status !== 201) {
      const errData = await res.json().catch(() => ({}));
      const norm = normalizePlatformError('linkedin', errData || { message: `LinkedIn API returned ${res.status}` });
      return {
        success: false,
        platform: 'linkedin',
        status: 'failed',
        verified: false,
        errorCode: norm.code,
        errorMessage: norm.message,
        actionRequired: norm.actionRequired
      };
    }

    const postUrn = res.headers.get('x-restli-id') || `urn:li:share:${Date.now()}`;

    return {
      success: true,
      platform: 'linkedin',
      status: 'published',
      remotePostId: postUrn,
      permalink: `https://www.linkedin.com/feed/update/${postUrn}`,
      verified: true,
      verificationMethod: 'platform_api',
      httpStatus: res.status,
      publishedAt: new Date().toISOString()
    };
  } catch (err: any) {
    const norm = normalizePlatformError('linkedin', err);
    return {
      success: false,
      platform: 'linkedin',
      status: 'failed',
      verified: false,
      errorCode: norm.code,
      errorMessage: norm.message
    };
  }
}
