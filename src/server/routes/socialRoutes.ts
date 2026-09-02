import express, { Request, Response } from 'express';
import { db } from '../../db/index.ts';
import {
  socialMediaChannels,
  socialMediaPosts,
  socialPublishingJobs,
  customBroadcastOutlets,
  customBroadcastDeliveryLogs
} from '../../db/schema.ts';
import { eq, desc, sql } from 'drizzle-orm';
import { setupSocialOAuthRoutes, executePublishBroadcast, encryptToken, decryptToken, validateWebhookUrl } from '../socialOAuth.js';
import { logAudit } from '../../lib/audit.ts';

export function setupSocialRoutes(app: express.Express) {
  // 1. Mount core OAuth, verification, diagnostics and broadcast routes with live DB instance
  setupSocialOAuthRoutes(app, db);

  // 2. Marketing Channels Management Endpoints
  app.get('/api/marketing/channels', async (req: Request, res: Response) => {
    try {
      let channels: any[] = [];
      if (db) {
        channels = await db.select().from(socialMediaChannels).orderBy(desc(socialMediaChannels.createdAt));
      }

      // Safe representation - mask secret tokens
      const safeChannels = channels.map(c => ({
        id: c.id,
        platform: c.platform,
        channelName: c.channelName,
        accountHandle: c.accountHandle,
        accountId: c.accountId,
        profileImageUrl: c.profileImageUrl,
        status: c.status,
        healthStatus: c.healthStatus,
        approvalStatus: c.approvalStatus,
        isCustom: c.isCustom,
        connectedBy: c.connectedBy,
        connectedAt: c.connectedAt,
        lastSuccessfulApiCheck: c.lastSuccessfulApiCheck,
        lastErrorCode: c.lastErrorCode,
        lastErrorMessage: c.lastErrorMessage,
        scopes: c.scopes,
        webhookUrl: c.webhookUrl,
        hasToken: Boolean(c.accessTokenEncrypted || c.apiKeyOrToken),
        tokenExpiresAt: c.tokenExpiresAt
      }));

      res.json(safeChannels);
    } catch (err: any) {
      console.error('[GET_MARKETING_CHANNELS_ERROR]', err);
      res.status(500).json({ error: err.message || 'Failed to fetch social channels' });
    }
  });

  app.post('/api/marketing/channels', async (req: Request, res: Response) => {
    try {
      const {
        platform,
        channelName,
        accountHandle,
        accountId,
        profileImageUrl,
        apiKeyOrToken,
        webhookUrl,
        isCustom,
        metadata
      } = req.body;

      if (!platform || !channelName) {
        return res.status(400).json({ error: 'Platform and channelName are required' });
      }

      const encToken = apiKeyOrToken ? encryptToken(apiKeyOrToken) : null;

      const [newChannel] = await db
        .insert(socialMediaChannels)
        .values({
          platform: String(platform).toLowerCase(),
          channelName,
          accountHandle: accountHandle || null,
          accountId: accountId || null,
          profileImageUrl: profileImageUrl || null,
          status: 'CONNECTED',
          healthStatus: 'HEALTHY',
          approvalStatus: 'APPROVED',
          accessTokenEncrypted: encToken,
          webhookUrl: webhookUrl || null,
          isCustom: Boolean(isCustom),
          connectedBy: req.body.connectedBy || 'MADECC Executive Admin',
          connectedAt: new Date(),
          metadata: metadata || null
        })
        .returning();

      logAudit('CREATE', 'SOCIAL_CHANNEL', String(newChannel.id), `Connected channel ${channelName} for platform ${platform}`, 'admin');
      res.status(201).json(newChannel);
    } catch (err: any) {
      console.error('[CREATE_MARKETING_CHANNEL_ERROR]', err);
      res.status(500).json({ error: err.message || 'Failed to create social channel' });
    }
  });

  app.put('/api/marketing/channels/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid channel ID' });

      const {
        channelName,
        accountHandle,
        accountId,
        profileImageUrl,
        apiKeyOrToken,
        status,
        healthStatus,
        webhookUrl
      } = req.body;

      const updateData: any = {
        updatedAt: new Date()
      };

      if (channelName !== undefined) updateData.channelName = channelName;
      if (accountHandle !== undefined) updateData.accountHandle = accountHandle;
      if (accountId !== undefined) updateData.accountId = accountId;
      if (profileImageUrl !== undefined) updateData.profileImageUrl = profileImageUrl;
      if (status !== undefined) updateData.status = status;
      if (healthStatus !== undefined) updateData.healthStatus = healthStatus;
      if (webhookUrl !== undefined) updateData.webhookUrl = webhookUrl;
      if (apiKeyOrToken) updateData.accessTokenEncrypted = encryptToken(apiKeyOrToken);

      const [updated] = await db
        .update(socialMediaChannels)
        .set(updateData)
        .where(eq(socialMediaChannels.id, id))
        .returning();

      if (!updated) return res.status(404).json({ error: 'Channel not found' });
      res.json(updated);
    } catch (err: any) {
      console.error('[UPDATE_MARKETING_CHANNEL_ERROR]', err);
      res.status(500).json({ error: err.message || 'Failed to update channel' });
    }
  });

  app.delete('/api/marketing/channels/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid channel ID' });

      await db.delete(socialMediaChannels).where(eq(socialMediaChannels.id, id));
      logAudit('DELETE', 'SOCIAL_CHANNEL', String(id), `Disconnected and removed social channel #${id}`, 'admin');
      res.json({ success: true, message: `Channel #${id} deleted successfully` });
    } catch (err: any) {
      console.error('[DELETE_MARKETING_CHANNEL_ERROR]', err);
      res.status(500).json({ error: err.message || 'Failed to delete channel' });
    }
  });

  // 3. Marketing Posts Management Endpoints
  app.get('/api/marketing/posts', async (req: Request, res: Response) => {
    try {
      let posts: any[] = [];
      if (db) {
        posts = await db.select().from(socialMediaPosts).orderBy(desc(socialMediaPosts.createdAt));
      }
      res.json(posts);
    } catch (err: any) {
      console.error('[GET_MARKETING_POSTS_ERROR]', err);
      res.status(500).json({ error: err.message || 'Failed to fetch marketing posts' });
    }
  });

  app.post('/api/marketing/posts', async (req: Request, res: Response) => {
    try {
      const {
        title,
        seoTopic,
        targetPlatforms,
        caption,
        hashtags,
        ctaText,
        mediaUrl,
        mediaType,
        status,
        scheduledAt,
        reachEstimate,
        engagementCount
      } = req.body;

      if (!title || !caption) {
        return res.status(400).json({ error: 'Title and caption are required' });
      }

      const [newPost] = await db
        .insert(socialMediaPosts)
        .values({
          title,
          seoTopic: seoTopic || null,
          targetPlatforms: Array.isArray(targetPlatforms) ? targetPlatforms : ['facebook', 'instagram'],
          caption,
          hashtags: hashtags || '#MADECCGroup #CivilEngineering',
          ctaText: ctaText || 'https://madeccgroup.online',
          mediaUrl: mediaUrl || null,
          mediaType: mediaType || 'image',
          status: status || 'DRAFT',
          scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
          publishedAt: status === 'PUBLISHED' ? new Date() : null,
          reachEstimate: reachEstimate || 0,
          engagementCount: engagementCount || 0
        })
        .returning();

      logAudit('CREATE', 'SOCIAL_POST', String(newPost.id), `Created marketing post: ${title}`, 'admin');
      res.status(201).json(newPost);
    } catch (err: any) {
      console.error('[CREATE_MARKETING_POST_ERROR]', err);
      res.status(500).json({ error: err.message || 'Failed to create marketing post' });
    }
  });

  app.put('/api/marketing/posts/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid post ID' });

      const {
        title,
        seoTopic,
        targetPlatforms,
        caption,
        hashtags,
        ctaText,
        mediaUrl,
        mediaType,
        status,
        scheduledAt,
        publishedAt
      } = req.body;

      const updateData: any = {};
      if (title !== undefined) updateData.title = title;
      if (seoTopic !== undefined) updateData.seoTopic = seoTopic;
      if (targetPlatforms !== undefined) updateData.targetPlatforms = targetPlatforms;
      if (caption !== undefined) updateData.caption = caption;
      if (hashtags !== undefined) updateData.hashtags = hashtags;
      if (ctaText !== undefined) updateData.ctaText = ctaText;
      if (mediaUrl !== undefined) updateData.mediaUrl = mediaUrl;
      if (mediaType !== undefined) updateData.mediaType = mediaType;
      if (status !== undefined) updateData.status = status;
      if (scheduledAt !== undefined) updateData.scheduledAt = scheduledAt ? new Date(scheduledAt) : null;
      if (publishedAt !== undefined) updateData.publishedAt = publishedAt ? new Date(publishedAt) : null;

      const [updated] = await db
        .update(socialMediaPosts)
        .set(updateData)
        .where(eq(socialMediaPosts.id, id))
        .returning();

      if (!updated) return res.status(404).json({ error: 'Post not found' });
      res.json(updated);
    } catch (err: any) {
      console.error('[UPDATE_MARKETING_POST_ERROR]', err);
      res.status(500).json({ error: err.message || 'Failed to update post' });
    }
  });

  app.delete('/api/marketing/posts/:id', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid post ID' });

      await db.delete(socialMediaPosts).where(eq(socialMediaPosts.id, id));
      logAudit('DELETE', 'SOCIAL_POST', String(id), `Deleted marketing post #${id}`, 'admin');
      res.json({ success: true, message: `Post #${id} deleted successfully` });
    } catch (err: any) {
      console.error('[DELETE_MARKETING_POST_ERROR]', err);
      res.status(500).json({ error: err.message || 'Failed to delete post' });
    }
  });

  // 4. Republish and Duplicate Endpoints
  app.post('/api/marketing/posts/:id/republish', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid post ID' });

      const [existingPost] = await db.select().from(socialMediaPosts).where(eq(socialMediaPosts.id, id));
      if (!existingPost) return res.status(404).json({ error: 'Post not found' });

      const platforms = req.body.targetPlatforms || existingPost.targetPlatforms || ['facebook', 'instagram'];

      const broadcastResult = await executePublishBroadcast({
        postId: existingPost.id,
        title: existingPost.title,
        caption: existingPost.caption,
        hashtags: existingPost.hashtags || undefined,
        ctaText: existingPost.ctaText || undefined,
        mediaUrl: existingPost.mediaUrl || undefined,
        mediaType: (existingPost.mediaType as any) || 'image',
        platforms,
        db
      });

      // Update post status to PUBLISHED on success
      if (broadcastResult.overallStatus !== 'FAILED') {
        await db
          .update(socialMediaPosts)
          .set({
            status: 'PUBLISHED',
            publishedAt: new Date()
          })
          .where(eq(socialMediaPosts.id, id));
      }

      logAudit('REPUBLISH', 'SOCIAL_POST', String(id), `Republished post #${id} to ${platforms.join(', ')}`, 'admin');
      res.json({ success: true, broadcastResult });
    } catch (err: any) {
      console.error('[REPUBLISH_ERROR]', err);
      res.status(500).json({ error: err.message || 'Failed to republish post' });
    }
  });

  app.post('/api/marketing/posts/:id/duplicate', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid post ID' });

      const [original] = await db.select().from(socialMediaPosts).where(eq(socialMediaPosts.id, id));
      if (!original) return res.status(404).json({ error: 'Post not found' });

      const [duplicated] = await db
        .insert(socialMediaPosts)
        .values({
          title: `${original.title} (Copy)`,
          seoTopic: original.seoTopic,
          targetPlatforms: original.targetPlatforms,
          caption: original.caption,
          hashtags: original.hashtags,
          ctaText: original.ctaText,
          mediaUrl: original.mediaUrl,
          mediaType: original.mediaType,
          status: 'DRAFT',
          reachEstimate: 0,
          engagementCount: 0
        })
        .returning();

      res.status(201).json(duplicated);
    } catch (err: any) {
      console.error('[DUPLICATE_POST_ERROR]', err);
      res.status(500).json({ error: err.message || 'Failed to duplicate post' });
    }
  });

  app.get('/api/marketing/posts/:id/versions', async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) return res.status(400).json({ error: 'Invalid post ID' });

      const jobs = await db
        .select()
        .from(socialPublishingJobs)
        .where(eq(socialPublishingJobs.postId, id))
        .orderBy(desc(socialPublishingJobs.startedAt));

      res.json(jobs);
    } catch (err: any) {
      console.error('[GET_POST_VERSIONS_ERROR]', err);
      res.status(500).json({ error: err.message || 'Failed to fetch versions' });
    }
  });

  // 5. Marketing Webhook Testing Alias
  app.post('/api/marketing/webhooks/test', async (req: Request, res: Response) => {
    try {
      const { endpointUrl, name, customTemplate, authenticationType, credentials, headers } = req.body;
      const val = validateWebhookUrl(endpointUrl);
      if (!val.valid) {
        return res.status(400).json({ success: false, message: val.reason });
      }

      const startTime = Date.now();
      const testHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'MADECC-Broadcast-Tester/2.0'
      };

      if (headers) {
        try {
          const parsed = typeof headers === 'string' ? JSON.parse(headers) : headers;
          Object.assign(testHeaders, parsed);
        } catch (e) {}
      }

      if (credentials) {
        if (authenticationType === 'BEARER_TOKEN') testHeaders['Authorization'] = `Bearer ${credentials}`;
        else if (authenticationType === 'API_KEY') testHeaders['X-API-Key'] = credentials;
      }

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 6000);
      const pingRes = await fetch(endpointUrl, {
        method: 'POST',
        headers: testHeaders,
        body: JSON.stringify({
          event: 'test_ping',
          service: 'MADECC Marketing Webhook Engine',
          timestamp: new Date().toISOString()
        }),
        signal: controller.signal
      });
      clearTimeout(timeout);

      const durationMs = Date.now() - startTime;
      res.json({
        success: pingRes.ok,
        httpStatus: pingRes.status,
        durationMs,
        message: pingRes.ok ? `Webhook responder answered in ${durationMs}ms (HTTP ${pingRes.status})` : `Webhook responded with HTTP ${pingRes.status}`
      });
    } catch (err: any) {
      res.json({
        success: false,
        httpStatus: 500,
        message: `Connection failed: ${err.message}`
      });
    }
  });
}
