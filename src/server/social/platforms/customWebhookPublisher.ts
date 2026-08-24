import { SocialPublishResult, PlatformMediaPlan } from '../types.js';
import { validateWebhookUrl } from '../mediaResolver.js';

interface WebhookPublishContext {
  outletId?: number;
  outletName?: string;
  endpointUrl: string;
  httpMethod?: string;
  authenticationType?: string;
  authToken?: string;
  title?: string;
  caption?: string;
  hashtags?: string;
  ctaText?: string;
  mediaPlan: PlatformMediaPlan;
}

export async function publishToCustomWebhook(ctx: WebhookPublishContext): Promise<SocialPublishResult> {
  const { outletId, outletName, endpointUrl, httpMethod = 'POST', authenticationType, authToken, title, caption, hashtags, ctaText, mediaPlan } = ctx;

  const urlCheck = validateWebhookUrl(endpointUrl);
  if (!urlCheck.valid) {
    return {
      success: false,
      platform: 'custom',
      status: 'failed',
      verified: false,
      errorCode: 'SSRF_BLOCKED',
      errorMessage: urlCheck.reason || 'Invalid webhook destination URL.',
      actionRequired: 'Verify that the webhook URL is a valid public HTTP/HTTPS endpoint.'
    };
  }

  const payload = {
    event: 'BROADCAST_PUBLISH',
    timestamp: new Date().toISOString(),
    outletName: outletName || 'Custom Syndicate',
    post: {
      title,
      caption,
      hashtags,
      ctaText,
      mediaAssets: mediaPlan.assets.map(a => ({
        url: a.publicUrl,
        type: a.mediaType,
        mimeType: a.mimeType
      }))
    }
  };

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'User-Agent': 'MADECC-Social-Syndicator/2.0'
  };

  if (authToken && authToken !== '[TOKEN_ENCRYPTED_SERVER_SIDE]') {
    if (authenticationType === 'API_KEY') {
      headers['X-API-Key'] = authToken;
    } else {
      headers['Authorization'] = `Bearer ${authToken}`;
    }
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const res = await fetch(endpointUrl, {
      method: httpMethod,
      headers,
      body: JSON.stringify(payload),
      signal: controller.signal
    }).finally(() => clearTimeout(timeoutId));

    if (res.ok || res.status === 200 || res.status === 201 || res.status === 202) {
      return {
        success: true,
        platform: 'custom',
        status: 'published',
        remotePostId: `webhook_ack_${Date.now()}`,
        permalink: endpointUrl,
        verified: true,
        verificationMethod: 'webhook',
        httpStatus: res.status,
        publishedAt: new Date().toISOString(),
        metadata: {
          outletId,
          outletName,
          httpStatus: res.status
        }
      };
    }

    return {
      success: false,
      platform: 'custom',
      status: 'failed',
      verified: false,
      errorCode: `HTTP_${res.status}`,
      errorMessage: `Custom webhook endpoint returned HTTP ${res.status}: ${res.statusText}`,
      httpStatus: res.status
    };
  } catch (err: any) {
    return {
      success: false,
      platform: 'custom',
      status: 'failed',
      verified: false,
      errorCode: 'WEBHOOK_DELIVERY_FAILED',
      errorMessage: `Could not deliver payload to webhook endpoint: ${err.message}`
    };
  }
}
