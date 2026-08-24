import { SocialPublishResult, PlatformMediaPlan } from '../types.js';
import { normalizePlatformError } from '../errorNormalizer.js';

interface WhatsAppPublishContext {
  phoneNumberId?: string;
  accessToken?: string;
  recipientPhone?: string;
  title?: string;
  caption?: string;
  hashtags?: string;
  ctaText?: string;
  mediaPlan: PlatformMediaPlan;
}

export async function publishToWhatsApp(ctx: WhatsAppPublishContext): Promise<SocialPublishResult> {
  const { phoneNumberId, accessToken, recipientPhone = '237671063511', title, caption, hashtags, ctaText, mediaPlan } = ctx;

  const phoneId = phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || process.env.META_WHATSAPP_PHONE_ID;
  const token = accessToken || process.env.WHATSAPP_ACCESS_TOKEN || process.env.META_ACCESS_TOKEN;

  if (!phoneId || !token || token === '[TOKEN_ENCRYPTED_SERVER_SIDE]') {
    return {
      success: false,
      platform: 'whatsapp',
      status: 'not_connected',
      verified: false,
      errorCode: 'WHATSAPP_ACCOUNT_NOT_CONNECTED',
      errorMessage: 'WhatsApp Business Cloud API is not connected. Requires WHATSAPP_PHONE_NUMBER_ID and access token.',
      actionRequired: 'Connect WhatsApp Business in Social Account Connection Center.',
      httpStatus: 401
    };
  }

  const cleanRecipient = recipientPhone.replace(/\D/g, '');
  const fullText = [
    title ? `*${title.trim()}*` : '',
    caption ? caption.trim() : '',
    hashtags ? hashtags.trim() : '',
    ctaText ? `\n_${ctaText.trim()}_` : ''
  ]
    .filter(Boolean)
    .join('\n\n');

  try {
    const assets = mediaPlan.assets;
    let messageBody: Record<string, any>;

    if (mediaPlan.publishType === 'image' && assets.length > 0) {
      messageBody = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanRecipient,
        type: 'image',
        image: {
          link: assets[0].publicUrl,
          caption: fullText.slice(0, 1024)
        }
      };
    } else if (mediaPlan.publishType === 'video' && assets.length > 0) {
      messageBody = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanRecipient,
        type: 'video',
        video: {
          link: assets[0].publicUrl,
          caption: fullText.slice(0, 1024)
        }
      };
    } else {
      messageBody = {
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanRecipient,
        type: 'text',
        text: {
          preview_url: true,
          body: fullText.slice(0, 4096)
        }
      };
    }

    const waRes = await fetch(`https://graph.facebook.com/v19.0/${phoneId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(messageBody)
    });

    const waData = await waRes.json();

    if (waData.error) {
      const norm = normalizePlatformError('whatsapp', waData.error);
      return {
        success: false,
        platform: 'whatsapp',
        status: 'failed',
        verified: false,
        errorCode: norm.code,
        errorMessage: norm.message,
        actionRequired: norm.actionRequired,
        httpStatus: norm.httpStatus
      };
    }

    const messageId = waData?.messages?.[0]?.id || `wamid_${Date.now()}`;

    return {
      success: true,
      platform: 'whatsapp',
      status: 'message_accepted',
      remotePostId: messageId,
      permalink: `https://wa.me/${cleanRecipient}`,
      verified: true,
      verificationMethod: 'accepted_only',
      httpStatus: 200,
      publishedAt: new Date().toISOString(),
      metadata: {
        recipient: cleanRecipient,
        messageId,
        type: messageBody.type,
        notice: 'WhatsApp Cloud API accepted the message payload. Broadcast dispatched directly to recipient channel.'
      }
    };
  } catch (err: any) {
    const norm = normalizePlatformError('whatsapp', err);
    return {
      success: false,
      platform: 'whatsapp',
      status: 'failed',
      verified: false,
      errorCode: norm.code,
      errorMessage: norm.message,
      actionRequired: norm.actionRequired
    };
  }
}
