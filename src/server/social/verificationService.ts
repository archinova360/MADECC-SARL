import { eq } from 'drizzle-orm';
import { socialPublishingJobs, socialMediaChannels } from '../../db/schema.js';
import { SocialPublishResult, PublishStatus } from './types.js';
import { decryptToken } from '../socialOAuth.js';

export async function verifyRemotePublishJob(
  jobId: string,
  db?: any
): Promise<SocialPublishResult> {
  if (!db) {
    return {
      success: false,
      platform: 'facebook',
      status: 'failed',
      verified: false,
      errorCode: 'DB_UNAVAILABLE',
      errorMessage: 'Database connection is unavailable for job verification.'
    };
  }

  try {
    const jobList = await db
      .select()
      .from(socialPublishingJobs)
      .where(eq(socialPublishingJobs.jobId, jobId))
      .limit(1);

    if (jobList.length === 0) {
      return {
        success: false,
        platform: 'facebook',
        status: 'failed',
        verified: false,
        errorCode: 'JOB_NOT_FOUND',
        errorMessage: `No publish job found with ID: ${jobId}`
      };
    }

    const job = jobList[0];
    const platform = job.platform.toLowerCase();

    // Fetch channel credentials
    const channels = await db
      .select()
      .from(socialMediaChannels)
      .where(eq(socialMediaChannels.platform, platform))
      .limit(1);

    const channel = channels.length > 0 ? channels[0] : null;
    const token = channel?.accessTokenEncrypted ? decryptToken(channel.accessTokenEncrypted) : null;

    // 1. Facebook Verification
    if (platform === 'facebook') {
      if (!job.externalPostId || !token) {
        return {
          success: job.status === 'SUCCESS' || job.status === 'PUBLISHED',
          platform: 'facebook',
          status: (job.status.toLowerCase() as PublishStatus) || 'published',
          remotePostId: job.externalPostId || undefined,
          permalink: job.externalUrl || undefined,
          verified: Boolean(job.externalPostId)
        };
      }

      try {
        const fbRes = await fetch(
          `https://graph.facebook.com/v19.0/${job.externalPostId}?fields=id,permalink_url&access_token=${token}`
        );
        const fbData = await fbRes.json();
        if (fbData.id) {
          const permalink = fbData.permalink_url || job.externalUrl;
          await db
            .update(socialPublishingJobs)
            .set({
              status: 'SUCCESS',
              externalUrl: permalink,
              completedAt: new Date()
            })
            .where(eq(socialPublishingJobs.jobId, jobId));

          return {
            success: true,
            platform: 'facebook',
            status: 'published',
            remotePostId: fbData.id,
            permalink,
            verified: true,
            verificationMethod: 'platform_api'
          };
        }
      } catch (fbErr) {
        console.warn('[FB_VERIFY_POLL_ERROR]', fbErr);
      }
    }

    // 2. Instagram Verification (handles ongoing container transcoding)
    if (platform === 'instagram') {
      const containerId = job.externalPostId;
      const igUserId = channel?.accountHandle;

      if (containerId && token && igUserId) {
        try {
          // Check container processing status
          const statusRes = await fetch(
            `https://graph.facebook.com/v19.0/${containerId}?fields=status_code&access_token=${token}`
          );
          const statusData = await statusRes.json();
          const statusCode = statusData?.status_code;

          if (statusCode === 'FINISHED') {
            // Publish the container
            const pubRes = await fetch(`https://graph.facebook.com/v19.0/${igUserId}/media_publish`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ creation_id: containerId, access_token: token })
            });
            const pubData = await pubRes.json();

            if (pubData.id) {
              const liveMediaId = pubData.id;
              let permalink = `https://instagram.com/p/${liveMediaId}`;

              try {
                const pRes = await fetch(
                  `https://graph.facebook.com/v19.0/${liveMediaId}?fields=permalink&access_token=${token}`
                );
                const pData = await pRes.json();
                if (pData?.permalink) permalink = pData.permalink;
              } catch (e) {}

              await db
                .update(socialPublishingJobs)
                .set({
                  status: 'SUCCESS',
                  externalPostId: liveMediaId,
                  externalUrl: permalink,
                  completedAt: new Date()
                })
                .where(eq(socialPublishingJobs.jobId, jobId));

              return {
                success: true,
                platform: 'instagram',
                status: 'published',
                remotePostId: liveMediaId,
                permalink,
                verified: true,
                verificationMethod: 'platform_api'
              };
            }
          } else if (statusCode === 'IN_PROGRESS') {
            return {
              success: true,
              platform: 'instagram',
              status: 'processing',
              remoteMediaId: containerId,
              verified: false,
              verificationMethod: 'platform_status',
              metadata: { statusCode: 'IN_PROGRESS', notice: 'Media transcoding in progress on Meta servers.' }
            };
          } else if (statusCode === 'ERROR') {
            await db
              .update(socialPublishingJobs)
              .set({
                status: 'FAILED',
                errorCode: 'INSTAGRAM_CONTAINER_ERROR',
                errorMessage: 'Instagram media container transcoding failed.'
              })
              .where(eq(socialPublishingJobs.jobId, jobId));

            return {
              success: false,
              platform: 'instagram',
              status: 'failed',
              verified: false,
              errorCode: 'INSTAGRAM_CONTAINER_ERROR',
              errorMessage: 'Instagram media container transcoding failed.'
            };
          }
        } catch (igErr) {
          console.warn('[IG_VERIFY_POLL_ERROR]', igErr);
        }
      }
    }

    // 3. YouTube Verification
    if (platform === 'youtube') {
      const videoId = job.externalPostId;
      if (videoId && token) {
        try {
          const ytRes = await fetch(
            `https://www.googleapis.com/youtube/v3/videos?part=status,processingDetails&id=${videoId}`,
            { headers: { Authorization: `Bearer ${token}` } }
          );
          const ytData = await ytRes.json();
          const item = ytData.items?.[0];
          if (item) {
            const uploadStatus = item.status?.uploadStatus;
            const isProcessed = uploadStatus === 'processed' || item.processingDetails?.processingStatus === 'succeeded';
            const permalink = `https://www.youtube.com/watch?v=${videoId}`;

            if (isProcessed) {
              await db
                .update(socialPublishingJobs)
                .set({ status: 'SUCCESS', externalUrl: permalink, completedAt: new Date() })
                .where(eq(socialPublishingJobs.jobId, jobId));

              return {
                success: true,
                platform: 'youtube',
                status: 'published',
                remotePostId: videoId,
                permalink,
                verified: true,
                verificationMethod: 'platform_api'
              };
            }

            return {
              success: true,
              platform: 'youtube',
              status: 'processing',
              remotePostId: videoId,
              permalink,
              verified: false,
              verificationMethod: 'platform_status'
            };
          }
        } catch (ytErr) {
          console.warn('[YT_VERIFY_POLL_ERROR]', ytErr);
        }
      }
    }

    // Fallback: return current database state
    return {
      success: job.status === 'SUCCESS' || job.status === 'PUBLISHED',
      platform: platform as any,
      status: (job.status.toLowerCase() as PublishStatus) || 'published',
      remotePostId: job.externalPostId || undefined,
      permalink: job.externalUrl || undefined,
      verified: Boolean(job.externalPostId && job.externalUrl)
    };
  } catch (err: any) {
    return {
      success: false,
      platform: 'facebook',
      status: 'failed',
      verified: false,
      errorCode: 'VERIFICATION_EXCEPTION',
      errorMessage: err.message
    };
  }
}
