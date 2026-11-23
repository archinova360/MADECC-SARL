import express from 'express';
import fs from 'fs';
import crypto from 'crypto';
import { eq, and, desc } from 'drizzle-orm';
import { db } from '../../db/index.ts';
import { mediaLibrary, uploadSessions } from '../../db/schema.ts';
import { requireStaffOrAdmin } from '../../middleware/auth.ts';
import {
  getCloudinary,
  upload,
  validateMediaFileDescriptor,
  sanitizeUploadFolder,
  isSupabaseConfigured,
  isServerlessRuntime,
  fetchRemoteMediaSafeBuffer,
  uploadBufferToCloudStorage,
  getUploadCapabilities,
  selectUploadProviderForFile,
  createSupabaseSignedUploadTicket,
  verifyUploadedAssetInCloud,
  SERVERLESS_PROXY_MAX_BYTES,
} from '../storageService.ts';
import { recordUploadRejectionEvent } from '../securityMonitorService.ts';

// Lightweight sliding-window rate limiter for upload signing / verification
function createSlidingWindowLimiter(maxRequests: number, windowMs: number, label: string) {
  const buckets = new Map<string, number[]>();
  return (req: any, res: any, next: any) => {
    const ip = String(req.ip || req.headers['x-forwarded-for'] || 'unknown').split(',')[0].trim();
    const userPart = req.dbUser?.id ? `u:${req.dbUser.id}` : 'anon';
    const key = `${ip}:${userPart}`;
    const now = Date.now();
    const cutoff = now - windowMs;
    const recent = (buckets.get(key) || []).filter((ts) => ts > cutoff);

    if (recent.length >= maxRequests) {
      const retryAfterSec = Math.max(1, Math.ceil((recent[0] + windowMs - now) / 1000));
      res.setHeader('Retry-After', String(retryAfterSec));
      return res.status(429).json({
        success: false,
        error: `Too many ${label} requests. Please wait ${retryAfterSec}s before trying again.`,
      });
    }

    recent.push(now);
    buckets.set(key, recent);
    if (buckets.size > 2000) {
      for (const [k, v] of buckets.entries()) {
        if (v.length === 0 || v[v.length - 1] <= cutoff) buckets.delete(k);
      }
    }
    next();
  };
}

const uploadSignRateLimiter = createSlidingWindowLimiter(60, 5 * 60 * 1000, 'upload signature');
const uploadVerifyRateLimiter = createSlidingWindowLimiter(120, 5 * 60 * 1000, 'upload verification');

async function issueUploadTicket(opts: {
  req: any;
  filename: string;
  mimeType: string;
  fileSize: number;
  fileType?: string;
  folder: string;
  preferredProvider?: 'cloudinary' | 'supabase' | 'auto';
  fileFingerprint?: string;
  isCms: boolean;
}) {
  const {
    req,
    filename,
    mimeType,
    fileSize,
    fileType,
    folder,
    preferredProvider = 'auto',
    fileFingerprint,
    isCms,
  } = opts;

  const validation = validateMediaFileDescriptor({
    filename: filename || 'asset.bin',
    mimeType,
    fileSize,
    fileType,
  });

  if (!validation.valid) {
    void recordUploadRejectionEvent(req, new Error(validation.error || 'Invalid file descriptor'));
    return { status: 400, body: { success: false, error: validation.error } };
  }

  const caps = await getUploadCapabilities();
  const selection = selectUploadProviderForFile(caps, {
    fileSize: Number(fileSize) || 0,
    category: validation.resolvedCategory,
    preferredProvider,
  });

  if (!selection.allowed || !selection.provider) {
    void recordUploadRejectionEvent(req, new Error(selection.error || 'File exceeds configured storage limits'));
    return {
      status: 413,
      body: {
        success: false,
        error: selection.error || 'File size exceeds configured storage provider limits.',
        maxAllowedBytes: selection.maxAllowedBytes,
        capabilities: {
          overallMaxUploadBytes: caps.overallMaxUploadBytes,
          supports10Gb: caps.supports10Gb,
          cloudinary: {
            plan: caps.cloudinary.plan,
            imageMaxBytes: caps.cloudinary.imageMaxBytes,
            videoMaxBytes: caps.cloudinary.videoMaxBytes,
            rawMaxBytes: caps.cloudinary.rawMaxBytes,
          },
          supabase: {
            configured: caps.supabase.configured,
            effectiveMaxBytes: caps.supabase.effectiveMaxBytes,
          },
          limitations: caps.limitations,
        },
      },
    };
  }

  // Duplicate detection in media_library (non-blocking advisory or reuse offer)
  let duplicateAsset: { id: number; title: string; fileUrl: string; filename: string; fileSize: number } | null = null;
  if (db && (fileFingerprint || (filename && fileSize > 0))) {
    try {
      if (fileFingerprint) {
        const dupRows = await db
          .select({
            id: mediaLibrary.id,
            title: mediaLibrary.title,
            fileUrl: mediaLibrary.fileUrl,
            filename: mediaLibrary.filename,
            fileSize: mediaLibrary.fileSize,
          })
          .from(mediaLibrary)
          .where(and(eq(mediaLibrary.fileFingerprint, fileFingerprint), eq(mediaLibrary.status, 'ACTIVE')))
          .orderBy(desc(mediaLibrary.id))
          .limit(1);
        if (dupRows.length > 0) {
          duplicateAsset = {
            ...dupRows[0],
            fileSize: Number(dupRows[0].fileSize || 0),
          };
        }
      }
      if (!duplicateAsset && filename && fileSize > 0) {
        const dupByNameSize = await db
          .select({
            id: mediaLibrary.id,
            title: mediaLibrary.title,
            fileUrl: mediaLibrary.fileUrl,
            filename: mediaLibrary.filename,
            fileSize: mediaLibrary.fileSize,
          })
          .from(mediaLibrary)
          .where(
            and(
              eq(mediaLibrary.filename, filename),
              eq(mediaLibrary.fileSize, Number(fileSize)),
              eq(mediaLibrary.status, 'ACTIVE')
            )
          )
          .orderBy(desc(mediaLibrary.id))
          .limit(1);
        if (dupByNameSize.length > 0) {
          duplicateAsset = {
            ...dupByNameSize[0],
            fileSize: Number(dupByNameSize[0].fileSize || 0),
          };
        }
      }
    } catch {
      // Non-fatal if DB query is unavailable
    }
  }

  const uploadSessionToken = `upl_${crypto.randomBytes(20).toString('hex')}`;
  const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2-hour expiration window

  if (selection.provider === 'supabase') {
    const supaTicket = await createSupabaseSignedUploadTicket({
      folder,
      filename: filename || 'asset.bin',
      mimeType,
    });

    if (db) {
      await db
        .insert(uploadSessions)
        .values({
          sessionToken: uploadSessionToken,
          provider: 'supabase',
          folder,
          filename: filename || 'asset.bin',
          mimeType: mimeType || 'application/octet-stream',
          fileType: validation.resolvedCategory,
          expectedSize: Number(fileSize) || 0,
          fileFingerprint: fileFingerprint || null,
          bucketName: supaTicket.bucketName,
          objectPath: supaTicket.objectPath,
          publicId: `${supaTicket.bucketName}/${supaTicket.objectPath}`,
          resourceType: validation.resolvedCategory,
          fileUrl: supaTicket.publicUrl,
          status: 'PENDING',
          ownerUserId: req.dbUser?.id || null,
          ownerEmail: req.dbUser?.email || null,
          expiresAt,
        })
        .catch(() => {});
    }

    return {
      status: 200,
      body: {
        success: true,
        provider: 'supabase',
        protocol: 'tus',
        uploadSessionToken,
        expiresAt: expiresAt.toISOString(),
        tusEndpoint: supaTicket.tusEndpoint,
        fallbackTusEndpoint: supaTicket.fallbackTusEndpoint,
        signedUploadUrl: supaTicket.signedUrl,
        signedToken: supaTicket.token,
        bucketName: supaTicket.bucketName,
        objectPath: supaTicket.objectPath,
        publicUrl: supaTicket.publicUrl,
        isPublicBucket: supaTicket.isPublicBucket,
        folder,
        chunkSizeBytes: caps.supabase.chunkSizeBytes,
        chunkThresholdBytes: 0, // Always use TUS resumable chunks on Supabase
        maxAllowedBytes: selection.maxAllowedBytes,
        proxyFallbackMaxBytes: SERVERLESS_PROXY_MAX_BYTES,
        supabaseFallbackReady: true,
        duplicateDetected: Boolean(duplicateAsset),
        duplicateAsset,
        verifyEndpoint: isCms ? '/api/cms/media/upload-verify' : '/api/upload/verify',
      },
    };
  }

  // Provider === 'cloudinary'
  const { cloudinary, cloudName, apiKey, apiSecret } = await getCloudinary();
  if (!cloudName || !apiKey || !apiSecret) {
    return {
      status: 500,
      body: {
        success: false,
        error: 'Cloudinary signing credentials are missing on the server.',
      },
    };
  }

  const resourceType =
    validation.resolvedCategory === 'video' || validation.resolvedCategory === 'audio'
      ? 'video'
      : validation.resolvedCategory === 'document'
        ? 'auto'
        : 'image';
  const timestamp = Math.round(Date.now() / 1000);
  const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, apiSecret);

  if (db) {
    await db
      .insert(uploadSessions)
      .values({
        sessionToken: uploadSessionToken,
        provider: 'cloudinary',
        folder,
        filename: filename || 'asset.bin',
        mimeType: mimeType || 'application/octet-stream',
        fileType: validation.resolvedCategory,
        expectedSize: Number(fileSize) || 0,
        fileFingerprint: fileFingerprint || null,
        resourceType,
        status: 'PENDING',
        ownerUserId: req.dbUser?.id || null,
        ownerEmail: req.dbUser?.email || null,
        expiresAt,
      })
      .catch(() => {});
  }

  return {
    status: 200,
    body: {
      success: true,
      provider: 'cloudinary',
      protocol: Number(fileSize) > caps.cloudinary.chunkThresholdBytes ? 'cloudinary-chunked' : 'cloudinary-direct',
      uploadSessionToken,
      expiresAt: expiresAt.toISOString(),
      uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
      resourceType,
      signature,
      timestamp,
      apiKey,
      cloudName,
      folder,
      chunkSizeBytes: caps.cloudinary.chunkSizeBytes,
      chunkThresholdBytes: caps.cloudinary.chunkThresholdBytes,
      maxAllowedBytes: selection.maxAllowedBytes,
      proxyFallbackMaxBytes: SERVERLESS_PROXY_MAX_BYTES,
      supabaseFallbackReady: isSupabaseConfigured(),
      duplicateDetected: Boolean(duplicateAsset),
      duplicateAsset,
      verifyEndpoint: isCms ? '/api/cms/media/upload-verify' : '/api/upload/verify',
    },
  };
}

export function setupUploadRoutes(app: express.Express) {
  app.get('/api/resolve-image', (req, res) => {
    const rawUrl = req.query.url as string;
    if (!rawUrl) return res.status(400).send('Missing url query parameter');
    let targetUrl = rawUrl.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }
    return res.redirect(targetUrl);
  });

  // Real-time provider capabilities inspection (never fabricates limits or leaks secrets)
  app.get('/api/cms/media/upload-capabilities', requireStaffOrAdmin, async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, private');
    try {
      const caps = await getUploadCapabilities(String(req.query.refresh || '') === 'true');
      res.json({ success: true, capabilities: caps });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to inspect storage capabilities' });
    }
  });

  app.get('/api/upload/capabilities', async (req, res) => {
    res.setHeader('Cache-Control', 'no-store, private');
    try {
      const caps = await getUploadCapabilities(String(req.query.refresh || '') === 'true');
      res.json({
        success: true,
        capabilities: {
          ...caps,
          cloudinary: {
            ...caps.cloudinary,
            cloudName: caps.cloudinary.configured ? caps.cloudinary.cloudName : '',
          },
        },
      });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err?.message || 'Failed to inspect storage capabilities' });
    }
  });

  // Public/portal direct upload signature (supports BOTH GET and POST; supports Cloudinary chunked & Supabase TUS)
  const handleCloudinaryOrTusSignature = async (req: any, res: any) => {
    res.setHeader('Cache-Control', 'no-store, private');
    try {
      const source = req.method === 'POST' ? req.body || {} : req.query || {};
      const folder = sanitizeUploadFolder(source.folder, 'madecc');
      const filename = String(source.filename || '').trim();
      const mimeType = String(source.mimeType || '').trim();
      const fileSize = Number(source.fileSize || 0);
      const fileType = source.fileType ? String(source.fileType) : undefined;
      const preferredProvider =
        source.preferredProvider === 'supabase' || source.preferredProvider === 'cloudinary'
          ? source.preferredProvider
          : 'auto';
      const fileFingerprint = source.fileFingerprint ? String(source.fileFingerprint) : undefined;

      // Backward-compatible minimal GET /api/cloudinary-signature?folder=... (without fileSize)
      if (!filename && fileSize <= 0 && preferredProvider === 'auto') {
        const { cloudinary, cloudName, apiKey, apiSecret } = await getCloudinary();
        if (!cloudName || !apiKey || !apiSecret) {
          return res.status(400).json({ error: 'Cloudinary is not fully configured on the server.' });
        }
        const caps = await getUploadCapabilities();
        const timestamp = Math.round(Date.now() / 1000);
        const signature = cloudinary.utils.api_sign_request({ timestamp, folder }, apiSecret);
        return res.json({
          success: true,
          provider: 'cloudinary',
          signature,
          timestamp,
          apiKey,
          cloudName,
          folder,
          chunkSizeBytes: caps.cloudinary.chunkSizeBytes,
          chunkThresholdBytes: caps.cloudinary.chunkThresholdBytes,
          proxyFallbackMaxBytes: SERVERLESS_PROXY_MAX_BYTES,
          maxAllowedBytes: caps.cloudinary.videoMaxBytes,
          supabaseFallbackReady: isSupabaseConfigured(),
        });
      }

      const issued = await issueUploadTicket({
        req,
        filename: filename || 'asset.bin',
        mimeType: mimeType || 'application/octet-stream',
        fileSize: Number.isFinite(fileSize) ? fileSize : 0,
        fileType,
        folder,
        preferredProvider,
        fileFingerprint,
        isCms: false,
      });
      return res.status(issued.status).json(issued.body);
    } catch (err: any) {
      console.error('[CLOUDINARY_SIGN_ERROR] Error generating upload signature:', err);
      res.status(500).json({ success: false, error: err.message });
    }
  };

  app.get('/api/cloudinary-signature', uploadSignRateLimiter, handleCloudinaryOrTusSignature);
  app.post('/api/cloudinary-signature', uploadSignRateLimiter, handleCloudinaryOrTusSignature);

  // Staff/Admin CMS signed direct upload endpoint (Cloudinary chunked + Supabase TUS up to 10 GB)
  app.post('/api/cms/media/upload-signature', requireStaffOrAdmin, uploadSignRateLimiter, async (req: any, res) => {
    res.setHeader('Cache-Control', 'no-store, private');
    try {
      const {
        filename,
        mimeType,
        fileSize,
        fileType,
        folder: requestedFolder,
        preferredProvider,
        fileFingerprint,
      } = req.body || {};

      const folder = sanitizeUploadFolder(
        requestedFolder ? `madecc/cms_media/${sanitizeUploadFolder(requestedFolder, 'root')}` : 'madecc/cms_media',
        'madecc/cms_media'
      );

      const issued = await issueUploadTicket({
        req,
        filename: filename || 'asset.bin',
        mimeType: mimeType || 'application/octet-stream',
        fileSize: Number(fileSize) || 0,
        fileType,
        folder,
        preferredProvider:
          preferredProvider === 'supabase' || preferredProvider === 'cloudinary' ? preferredProvider : 'auto',
        fileFingerprint: fileFingerprint ? String(fileFingerprint) : undefined,
        isCms: true,
      });
      return res.status(issued.status).json(issued.body);
    } catch (err: any) {
      console.error('[CMS_MEDIA_SIGN_ERROR]', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to generate upload signature' });
    }
  });

  // Server-side verification of direct cloud upload completion (validates ticket expiry, ownership & real byte size)
  const handleVerifyUpload = async (req: any, res: any) => {
    res.setHeader('Cache-Control', 'no-store, private');
    try {
      const {
        uploadSessionToken,
        provider,
        publicId,
        resourceType,
        bucketName,
        objectPath,
        fileUrl,
      } = req.body || {};

      let sessionRow: any = null;
      if (db && uploadSessionToken) {
        const rows = await db
          .select()
          .from(uploadSessions)
          .where(eq(uploadSessions.sessionToken, String(uploadSessionToken)))
          .limit(1);
        sessionRow = rows[0] || null;

        if (sessionRow) {
          if (new Date(sessionRow.expiresAt).getTime() < Date.now()) {
            await db
              .update(uploadSessions)
              .set({ status: 'EXPIRED', updatedAt: new Date() })
              .where(eq(uploadSessions.id, sessionRow.id))
              .catch(() => {});
            return res.status(410).json({
              success: false,
              error: 'Upload session ticket has expired. Please request a fresh upload signature.',
            });
          }

          if (
            sessionRow.ownerUserId &&
            req.dbUser?.id &&
            sessionRow.ownerUserId !== req.dbUser.id &&
            req.dbUser.role !== 'admin'
          ) {
            return res.status(403).json({
              success: false,
              error: 'Forbidden: Upload session belongs to another user.',
            });
          }
        }
      }

      const resolvedProvider = (provider || sessionRow?.provider || 'cloudinary') as 'cloudinary' | 'supabase';
      const verified = await verifyUploadedAssetInCloud({
        provider: resolvedProvider,
        publicId: publicId || sessionRow?.publicId,
        resourceType: resourceType || sessionRow?.resourceType,
        bucketName: bucketName || sessionRow?.bucketName,
        objectPath: objectPath || sessionRow?.objectPath,
        fileUrl: fileUrl || sessionRow?.fileUrl,
      });

      if (!verified.verified) {
        if (db && sessionRow) {
          await db
            .update(uploadSessions)
            .set({ status: 'FAILED', updatedAt: new Date() })
            .where(eq(uploadSessions.id, sessionRow.id))
            .catch(() => {});
        }
        return res.status(400).json({
          success: false,
          verified: false,
          error: verified.reason || 'Cloud upload completion could not be verified.',
        });
      }

      if (db && sessionRow) {
        await db
          .update(uploadSessions)
          .set({
            status: 'COMPLETED',
            uploadedSize: verified.fileSize,
            publicId: verified.publicId,
            fileUrl: verified.fileUrl,
            completedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(uploadSessions.id, sessionRow.id))
          .catch(() => {});
      }

      res.json({
        success: true,
        verified: true,
        storageProvider: resolvedProvider,
        fileUrl: verified.fileUrl,
        fileSize: verified.fileSize,
        publicId: verified.publicId,
        dimensions: verified.dimensions,
        durationSeconds: verified.durationSeconds,
        mimeType: verified.mimeType,
      });
    } catch (err: any) {
      console.error('[UPLOAD_VERIFY_ERROR]', err);
      res.status(500).json({
        success: false,
        error: err?.message || 'Upload completion verification failed.',
      });
    }
  };

  app.post('/api/cms/media/upload-verify', requireStaffOrAdmin, uploadVerifyRateLimiter, handleVerifyUpload);
  app.post('/api/upload/verify', uploadVerifyRateLimiter, handleVerifyUpload);

  // SSRF-hardened remote HTTPS media ingestor (never stores raw unverified links blindly)
  app.post('/api/cms/media/ingest-url', requireStaffOrAdmin, uploadVerifyRateLimiter, async (req: any, res) => {
    res.setHeader('Cache-Control', 'no-store, private');
    try {
      const { url, folder, fileType } = req.body || {};
      if (!url || typeof url !== 'string') {
        return res.status(400).json({ success: false, error: 'A valid remote HTTPS url is required.' });
      }

      const fetched = await fetchRemoteMediaSafeBuffer(url);
      const descriptorCheck = validateMediaFileDescriptor({
        filename: fetched.filename,
        mimeType: fetched.mimeType,
        fileSize: fetched.fileSize,
        fileType,
      });
      if (!descriptorCheck.valid) {
        return res.status(400).json({ success: false, error: descriptorCheck.error });
      }

      const uploaded = await uploadBufferToCloudStorage(fetched.buffer, {
        filename: fetched.filename,
        mimeType: fetched.mimeType,
        folder: sanitizeUploadFolder(folder || 'madecc/cms_media', 'madecc/cms_media'),
        resourceType:
          descriptorCheck.resolvedCategory === 'video' || descriptorCheck.resolvedCategory === 'audio'
            ? 'video'
            : descriptorCheck.resolvedCategory === 'document'
              ? 'auto'
              : 'image',
      });

      res.json({
        success: true,
        url: uploaded.fileUrl,
        secure_url: uploaded.fileUrl,
        storageProvider: uploaded.storageProvider,
        publicId: uploaded.publicId,
        filename: fetched.filename,
        mimeType: fetched.mimeType,
        fileSize: fetched.fileSize,
        fileType: descriptorCheck.resolvedCategory,
      });
    } catch (err: any) {
      console.error('[CMS_MEDIA_INGEST_ERROR]', err);
      void recordUploadRejectionEvent(req, err);
      const status = /blocked|invalid|https|html|svg|pdf|signature/i.test(String(err?.message || '')) ? 400 : 502;
      res.status(status).json({
        success: false,
        error: err?.message || 'Remote media ingestion failed.',
      });
    }
  });

  // Middleware wrapper ensuring all multer errors return JSON (prevents HTML error pages and returns 413 for LIMIT_FILE_SIZE)
  const safeMulter = (req: any, res: any, next: any) => {
    upload.single('file')(req, res, (err: any) => {
      if (err) {
        console.error('[STORAGE_MULTER_ERROR]', err);
        void recordUploadRejectionEvent(req, err);
        const isTooLarge = err.code === 'LIMIT_FILE_SIZE' || /too large|file size/i.test(String(err.message || ''));
        return res.status(isTooLarge ? 413 : 400).json({
          success: false,
          error: err.message || 'File upload processing failed',
        });
      }
      next();
    });
  };

  // Upload endpoint (proxy / small-file fallback <=4.2MB on Netlify, streaming/direct preferred)
  app.post('/api/upload', safeMulter, async (req: any, res) => {
    res.setHeader('Cache-Control', 'no-store, private');
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }

    const validation = validateMediaFileDescriptor({
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
    });
    if (!validation.valid) {
      if (fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch {}
      }
      void recordUploadRejectionEvent(req, new Error(validation.error || 'Invalid file type'));
      return res.status(400).json({ success: false, error: validation.error });
    }

    try {
      const targetFolder = sanitizeUploadFolder(req.body?.folder, 'madecc');
      let fileUrl = `/uploads/${req.file.filename}`;
      let uploadedToCloud = false;
      let storageProvider: 'cloudinary' | 'supabase' | 'local' = 'local';
      let publicId = '';

      // 1. Check live provider selection so we don't blindly push >10MB image or >100MB video to Cloudinary Free
      const caps = await getUploadCapabilities();
      const selection = selectUploadProviderForFile(caps, {
        fileSize: req.file.size,
        category: validation.resolvedCategory,
      });

      if (selection.allowed && selection.provider === 'cloudinary') {
        try {
          const { cloudinary, cloudName, apiKey, apiSecret } = await getCloudinary();
          if (cloudName && apiKey && apiSecret) {
            const isVideo =
              req.file.mimetype?.startsWith('video/') ||
              /\.(mp4|mov|avi|webm|mkv|flv|wmv|m4v)$/i.test(req.file.originalname);
            const isImage =
              req.file.mimetype?.startsWith('image/') ||
              /\.(jpg|jpeg|png|webp|gif|svg|avif|bmp|tiff)$/i.test(req.file.originalname);
            const resourceType = isVideo ? 'video' : isImage ? 'image' : 'auto';

            const result: any =
              req.file.size > 20 * 1024 * 1024
                ? await cloudinary.uploader.upload_large(req.file.path, {
                    resource_type: resourceType,
                    folder: targetFolder,
                    chunk_size: 6000000,
                    use_filename: true,
                    unique_filename: true,
                  })
                : await cloudinary.uploader.upload(req.file.path, {
                    resource_type: resourceType,
                    folder: targetFolder,
                    use_filename: true,
                    unique_filename: true,
                  });

            if (result && (result.secure_url || result.url)) {
              fileUrl = result.secure_url || result.url;
              uploadedToCloud = true;
              storageProvider = 'cloudinary';
              publicId = result.public_id || '';
              if (fs.existsSync(req.file.path)) {
                fs.unlinkSync(req.file.path);
              }
            }
          }
        } catch (cloudinaryErr: any) {
          console.error('[STORAGE-FALLBACK] Failed to upload to Cloudinary, trying next storage tier:', cloudinaryErr);
        }
      }

      // 2. Secondary fallback / escalation: Supabase Storage (streaming from disk instead of full-buffer read!)
      if (!uploadedToCloud && isSupabaseConfigured()) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
          const fileStream = fs.createReadStream(req.file.path);
          const bucketName = process.env.SUPABASE_BUCKET || 'madecc-assets';
          const fileName = `${targetFolder}/${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

          const { error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, fileStream as any, {
              contentType: req.file.mimetype || 'application/octet-stream',
              cacheControl: '3600',
              upsert: true,
              duplex: 'half',
            } as any);

          if (!error) {
            const { data: { publicUrl } } = supabase.storage
              .from(bucketName)
              .getPublicUrl(fileName);

            fileUrl = publicUrl;
            uploadedToCloud = true;
            storageProvider = 'supabase';
            publicId = `${bucketName}/${fileName}`;
            if (fs.existsSync(req.file.path)) {
              fs.unlinkSync(req.file.path);
            }
          }
        } catch (supabaseErr) {
          console.error('[STORAGE-FALLBACK] Failed to upload to Supabase Storage:', supabaseErr);
        }
      }

      if (!uploadedToCloud && isServerlessRuntime()) {
        if (fs.existsSync(req.file.path)) {
          try { fs.unlinkSync(req.file.path); } catch {}
        }
        return res.status(selection.allowed ? 502 : 413).json({
          success: false,
          error:
            selection.error ||
            'Cloud upload failed in serverless runtime (Cloudinary & Supabase unavailable). Ephemeral disk fallback is disabled.',
        });
      }

      res.json({
        success: true,
        url: fileUrl,
        secure_url: fileUrl,
        storageProvider,
        publicId,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size,
      });
    } catch (err: any) {
      console.error('File upload handler error:', err);
      if (isServerlessRuntime()) {
        if (req.file?.path && fs.existsSync(req.file.path)) {
          try { fs.unlinkSync(req.file.path); } catch {}
        }
        return res.status(502).json({
          success: false,
          error: err?.message || 'Cloud file upload handler failed.',
        });
      }
      const fallbackUrl = req.file?.filename ? `/uploads/${req.file.filename}` : '';
      res.json({
        success: true,
        url: fallbackUrl,
        secure_url: fallbackUrl,
        storageProvider: 'local',
        publicId: '',
        filename: req.file?.filename || '',
        originalName: req.file?.originalname || '',
        size: req.file?.size || 0,
      });
    }
  });

  app.post('/api/public/upload', safeMulter, async (req: any, res) => {
    res.setHeader('Cache-Control', 'no-store, private');
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' });
    }
    const validation = validateMediaFileDescriptor({
      filename: req.file.originalname,
      mimeType: req.file.mimetype,
      fileSize: req.file.size,
    });
    if (!validation.valid) {
      if (fs.existsSync(req.file.path)) {
        try { fs.unlinkSync(req.file.path); } catch {}
      }
      return res.status(400).json({ success: false, error: validation.error });
    }

    try {
      let fileUrl = `/uploads/${req.file.filename}`;
      let uploadedToCloud = false;
      let storageProvider: 'cloudinary' | 'supabase' | 'local' = 'local';
      let publicId = '';

      if (isSupabaseConfigured()) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
          const fileStream = fs.createReadStream(req.file.path);
          const bucketName = process.env.SUPABASE_BUCKET || 'madecc-assets';
          const fileName = `eoi-dossiers/${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

          const { error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, fileStream as any, {
              contentType: req.file.mimetype,
              cacheControl: '3600',
              upsert: true,
              duplex: 'half',
            } as any);

          if (!error) {
            const { data: { publicUrl } } = supabase.storage
              .from(bucketName)
              .getPublicUrl(fileName);
            fileUrl = publicUrl;
            uploadedToCloud = true;
            storageProvider = 'supabase';
            publicId = `${bucketName}/${fileName}`;
            if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
          }
        } catch (supabaseErr) {
          console.error('[STORAGE-FALLBACK] Supabase public upload failed, trying Cloudinary:', supabaseErr);
        }
      }

      if (!uploadedToCloud) {
        try {
          const { cloudinary, cloudName, apiKey, apiSecret } = await getCloudinary();
          if (cloudName && apiKey && apiSecret) {
            const result = await cloudinary.uploader.upload(req.file.path, {
              resource_type: 'auto',
              folder: 'madecc/tenders',
            });

            if (result && (result.secure_url || result.url)) {
              fileUrl = result.secure_url || result.url;
              uploadedToCloud = true;
              storageProvider = 'cloudinary';
              publicId = result.public_id || '';
              if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
            }
          }
        } catch (cloudErr) {
          console.error('[STORAGE-FALLBACK] Cloudinary public upload failed:', cloudErr);
        }
      }

      if (!uploadedToCloud && isServerlessRuntime()) {
        if (fs.existsSync(req.file.path)) {
          try { fs.unlinkSync(req.file.path); } catch {}
        }
        return res.status(502).json({
          success: false,
          error: 'Cloud upload failed in serverless runtime.',
        });
      }

      res.json({
        success: true,
        fileUrl,
        url: fileUrl,
        storageProvider,
        publicId,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size,
      });
    } catch (error: any) {
      console.error('[PUBLIC_UPLOAD_ERROR]', error);
      res.status(500).json({ error: error.message || 'Upload failed' });
    }
  });
}
