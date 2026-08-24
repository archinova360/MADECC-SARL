import { eq, inArray } from 'drizzle-orm';
import {
  socialMediaChannels,
  customBroadcastOutlets,
  customBroadcastDeliveryLogs,
  socialPublishingJobs,
  socialMediaPosts
} from '../../db/schema.js';
import {
  BroadcastRequest,
  BroadcastExecutionResult,
  SocialPublishResult,
  SocialPlatform,
  PlatformMediaPlan
} from './types.js';
import { resolveMediaAssets } from './mediaResolver.js';
import { createPlatformMediaPlan } from './mediaValidator.js';
import { decryptToken } from '../socialOAuth.js';
import { getValidConnectionToken, markConnectionRequiresReauthorization } from './tokenManager.js';

// Platform Publishers
import { publishToFacebook } from './platforms/facebookPublisher.js';
import { publishToInstagram } from './platforms/instagramPublisher.js';
import { publishToYouTube } from './platforms/youtubePublisher.js';
import { publishToWhatsApp } from './platforms/whatsappPublisher.js';
import { publishToTikTok } from './platforms/tiktokPublisher.js';
import { publishToLinkedIn } from './platforms/linkedinPublisher.js';
import { publishToTwitter } from './platforms/twitterPublisher.js';
import { publishToCustomWebhook } from './platforms/customWebhookPublisher.js';

export async function executeCentralBroadcast(
  req: BroadcastRequest
): Promise<BroadcastExecutionResult> {
  const {
    postId,
    campaignName = 'MADECC Engineering Broadcast',
    title,
    caption,
    hashtags,
    ctaText,
    mediaUrl,
    mediaType,
    mediaAssets,
    targetPlatforms = ['facebook', 'instagram', 'youtube', 'whatsapp', 'tiktok', 'linkedin', 'twitter'],
    targetWebhookIds = [],
    db
  } = req;

  const broadcastId = `BROADCAST-${Date.now()}`;
  const resolvedAssets = resolveMediaAssets(mediaUrl, mediaType, mediaAssets);

  // 1. Fetch connected channels from database
  let connectedChannels: any[] = [];
  let customOutlets: any[] = [];

  if (db) {
    try {
      connectedChannels = await db.select().from(socialMediaChannels);
      if (Array.isArray(targetWebhookIds) && targetWebhookIds.length > 0) {
        customOutlets = await db
          .select()
          .from(customBroadcastOutlets)
          .where(inArray(customBroadcastOutlets.id, targetWebhookIds));
      }
    } catch (dbErr) {
      console.warn('[BROADCAST_DB_FETCH_WARN]', dbErr);
    }
  }

  const channelMap = new Map<string, any>();
  for (const chan of connectedChannels) {
    channelMap.set(chan.platform.toLowerCase(), chan);
  }

  const results: SocialPublishResult[] = [];
  const normalizedTargets = targetPlatforms.map(p => p.toLowerCase());

  // 2. Dispatch to each selected target platform
  for (const rawPlatform of normalizedTargets) {
    const platform = rawPlatform as SocialPlatform;
    const mediaPlan = createPlatformMediaPlan(platform, resolvedAssets);
    const chan = channelMap.get(platform);
    
    // Resolve valid token using SocialTokenManager (with auto-refresh support)
    const tokenInfo = await getValidConnectionToken({
      connectionId: chan?.id,
      platform,
      db
    });

    const activeToken = tokenInfo.valid && tokenInfo.token ? tokenInfo.token : null;
    const jobId = `JOB-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    // Create Initial DB record
    if (db && postId) {
      try {
        await db.insert(socialPublishingJobs).values({
          jobId,
          postId: typeof postId === 'number' ? postId : parseInt(String(postId), 10) || null,
          campaignName,
          platform,
          destinationName: chan?.channelName || `MADECC ${platform.toUpperCase()}`,
          status: 'PENDING',
          attempt: 1,
          startedAt: new Date()
        });
      } catch (insertErr) {
        console.warn('[JOB_INSERT_WARN]', insertErr);
      }
    }

    let publishResult: SocialPublishResult;

    // If token is not valid or explicitly requires re-authorization, do NOT simulate or attempt doomed dispatch
    if (!activeToken || tokenInfo.requiresReauth) {
      publishResult = {
        success: false,
        platform,
        status: 'not_connected',
        verified: false,
        errorCode: tokenInfo.errorCode || `${platform.toUpperCase()}_TOKEN_EXPIRED`,
        errorMessage: tokenInfo.reason || `${platform.toUpperCase()} token is expired or unauthorized. Re-authorization required in Connection Center.`,
        actionRequired: `Open Social Account Connection Center and click "Authorize / Re-authorize ${platform.toUpperCase()}".`,
        httpStatus: 401
      };
    } else {
      switch (platform) {
        case 'facebook': {
          const pageId = chan?.accountId || process.env.META_PAGE_ID || process.env.FACEBOOK_PAGE_ID || 'me';
          publishResult = await publishToFacebook({
            pageId,
            accessToken: activeToken,
            title,
            caption,
            hashtags,
            ctaText,
            mediaPlan
          });
          break;
        }

        case 'instagram': {
          const igUserId = chan?.accountId || process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID || process.env.META_IG_USER_ID;
          publishResult = await publishToInstagram({
            igUserId,
            accessToken: activeToken,
            caption,
            hashtags,
            ctaText,
            mediaPlan
          });
          break;
        }

        case 'youtube': {
          const channelId = chan?.accountId || process.env.YOUTUBE_CHANNEL_ID;
          publishResult = await publishToYouTube({
            channelId,
            accessToken: activeToken,
            title,
            caption,
            hashtags,
            ctaText,
            mediaPlan,
            privacyStatus: 'public'
          });
          break;
        }

        case 'whatsapp': {
          const phoneId = chan?.accountId || process.env.WHATSAPP_PHONE_NUMBER_ID;
          publishResult = await publishToWhatsApp({
            phoneNumberId: phoneId,
            accessToken: activeToken,
            recipientPhone: '237671063511',
            title,
            caption,
            hashtags,
            ctaText,
            mediaPlan
          });
          break;
        }

        case 'tiktok': {
          publishResult = await publishToTikTok({
            openId: chan?.accountId || chan?.accountHandle,
            accessToken: activeToken,
            title,
            caption,
            hashtags,
            ctaText,
            mediaPlan
          });
          break;
        }

        case 'linkedin': {
          publishResult = await publishToLinkedIn({
            authorUrn: chan?.accountId || chan?.accountHandle,
            accessToken: activeToken,
            title,
            caption,
            hashtags,
            ctaText,
            mediaPlan
          });
          break;
        }

        case 'twitter': {
          publishResult = await publishToTwitter({
            accessToken: activeToken,
            title,
            caption,
            hashtags,
            ctaText,
            mediaPlan
          });
          break;
        }

        default: {
          publishResult = {
            success: false,
            platform,
            status: 'failed',
            verified: false,
            errorCode: 'UNSUPPORTED_PLATFORM',
            errorMessage: `Platform '${platform}' is not supported for broadcast dispatch.`
          };
          break;
        }
      }

      // If provider responded with an authorization expired or revoked code, mark channel for re-auth immediately
      if (
        chan?.id &&
        db &&
        !publishResult.success &&
        (publishResult.errorCode?.includes('190') ||
         publishResult.errorCode?.includes('TOKEN_EXPIRED') ||
         publishResult.errorCode?.includes('AUTH_EXPIRED') ||
         publishResult.httpStatus === 401)
      ) {
        await markConnectionRequiresReauthorization(
          chan.id,
          publishResult.errorMessage || 'Provider rejected token as expired or revoked.',
          publishResult.errorCode || `${platform.toUpperCase()}_ERR_190`,
          db
        );
      }
    }

    // Attach internal tracking jobId
    (publishResult as any).jobId = jobId;
    results.push(publishResult);

    // Update DB record with real outcome
    if (db) {
      try {
        const dbStatus =
          publishResult.status === 'published' || publishResult.status === 'message_accepted'
            ? 'SUCCESS'
            : publishResult.status === 'processing'
            ? 'PENDING'
            : 'FAILED';

        await db
          .update(socialPublishingJobs)
          .set({
            status: dbStatus,
            externalPostId: publishResult.remotePostId || publishResult.remoteMediaId || publishResult.publishId || null,
            externalUrl: publishResult.permalink || null,
            errorCode: publishResult.errorCode || null,
            errorMessage: publishResult.errorMessage || null,
            completedAt: new Date()
          })
          .where(eq(socialPublishingJobs.jobId, jobId));
      } catch (updateErr) {
        console.warn('[JOB_UPDATE_WARN]', updateErr);
      }
    }
  }

  // 3. Dispatch to selected custom webhook syndicates
  for (const outlet of customOutlets) {
    const mediaPlan = createPlatformMediaPlan('custom', resolvedAssets);
    const authToken = outlet.encryptedCredentials ? decryptToken(outlet.encryptedCredentials) : undefined;

    const hookResult = await publishToCustomWebhook({
      outletId: outlet.id,
      outletName: outlet.name,
      endpointUrl: outlet.endpointUrl,
      httpMethod: outlet.httpMethod,
      authenticationType: outlet.authenticationType,
      authToken,
      title,
      caption,
      hashtags,
      ctaText,
      mediaPlan
    });

    results.push(hookResult);

    // Delivery log in DB
    if (db) {
      try {
        await db.insert(customBroadcastDeliveryLogs).values({
          broadcastId,
          outletId: outlet.id,
          outletName: outlet.name,
          status: hookResult.success ? 'SUCCESS' : 'FAILED',
          httpStatus: hookResult.httpStatus || (hookResult.success ? 200 : 500),
          payloadExcerpt: { title, captionExcerpt: (caption || '').slice(0, 100) },
          errorDetails: hookResult.errorMessage || null,
          completedAt: new Date()
        });
      } catch (logErr) {
        console.warn('[OUTLET_LOG_WARN]', logErr);
      }
    }
  }

  // 4. Calculate Aggregate Stats
  const totalDestinations = results.length;
  const successCount = results.filter(
    r => r.status === 'published' || r.status === 'message_accepted' || r.status === 'delivered'
  ).length;
  const processingCount = results.filter(r => r.status === 'processing' || r.status === 'uploading').length;
  const failureCount = results.filter(
    r => r.status === 'failed' || r.status === 'not_connected' || r.status === 'requires_review'
  ).length;

  let overallStatus: 'PUBLISHED' | 'PARTIALLY_PUBLISHED' | 'FAILED' | 'PENDING_PROCESSING';
  if (successCount === totalDestinations && totalDestinations > 0) {
    overallStatus = 'PUBLISHED';
  } else if (processingCount > 0 && failureCount === 0) {
    overallStatus = 'PENDING_PROCESSING';
  } else if (successCount > 0 || processingCount > 0) {
    overallStatus = 'PARTIALLY_PUBLISHED';
  } else {
    overallStatus = 'FAILED';
  }

  // 5. Update parent post record if postId provided
  if (db && postId) {
    const numId = typeof postId === 'number' ? postId : parseInt(String(postId), 10);
    if (!isNaN(numId)) {
      try {
        await db
          .update(socialMediaPosts)
          .set({
            status: overallStatus,
            publishedAt: overallStatus === 'PUBLISHED' ? new Date() : null,
            targetPlatforms: targetPlatforms
          })
          .where(eq(socialMediaPosts.id, numId));
      } catch (postUpdateErr) {
        console.warn('[POST_RECORD_UPDATE_WARN]', postUpdateErr);
      }
    }
  }

  return {
    success: successCount > 0 || processingCount > 0,
    broadcastId,
    overallStatus,
    totalDestinations,
    successCount,
    processingCount,
    failureCount,
    publishedAt: new Date().toISOString(),
    jobs: results,
    message:
      overallStatus === 'PUBLISHED'
        ? 'All destinations verified live on official accounts.'
        : overallStatus === 'PENDING_PROCESSING'
        ? 'Broadcast dispatched. Media is undergoing background transcoding on target platforms.'
        : overallStatus === 'PARTIALLY_PUBLISHED'
        ? `Partially broadcast: ${successCount} published, ${processingCount} processing, ${failureCount} failed/unauthorized.`
        : 'Broadcast failed. Check destination credentials in Connection Center.'
  };
}
