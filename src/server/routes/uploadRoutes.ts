import express from 'express';
import fs from 'fs';
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
} from '../storageService.ts';
import { recordUploadRejectionEvent } from '../securityMonitorService.ts';

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

  // Public/tenant direct upload signature (never exposes apiSecret; sets no-store)
  app.get('/api/cloudinary-signature', async (req: any, res) => {
    res.setHeader('Cache-Control', 'no-store, private');
    try {
      const { cloudinary, cloudName, apiKey, apiSecret } = await getCloudinary();
      if (!cloudName || !apiKey || !apiSecret) {
        return res.status(400).json({ error: 'Cloudinary is not fully configured on the server.' });
      }

      const timestamp = Math.round(Date.now() / 1000);
      const folder = sanitizeUploadFolder(req.query?.folder, 'madecc');

      const signature = cloudinary.utils.api_sign_request(
        { timestamp, folder },
        apiSecret
      );

      res.json({
        signature,
        timestamp,
        apiKey,
        cloudName,
        folder,
        chunkSizeBytes: 6_000_000,
        chunkThresholdBytes: 20 * 1024 * 1024,
        supabaseFallbackReady: isSupabaseConfigured(),
      });
    } catch (err: any) {
      console.error('[CLOUDINARY_SIGN_ERROR] Error generating upload signature:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Staff/Admin CMS signed direct upload endpoint (eliminates Netlify 413 payload limits)
  app.post('/api/cms/media/upload-signature', requireStaffOrAdmin, async (req: any, res) => {
    res.setHeader('Cache-Control', 'no-store, private');
    try {
      const { filename, mimeType, fileSize, fileType, folder: requestedFolder } = req.body || {};

      const validation = validateMediaFileDescriptor({
        filename: filename || 'asset.bin',
        mimeType,
        fileSize,
        fileType,
      });

      if (!validation.valid) {
        void recordUploadRejectionEvent(req, new Error(validation.error || 'Invalid file descriptor'));
        return res.status(400).json({ success: false, error: validation.error });
      }

      const { cloudinary, cloudName, apiKey, apiSecret } = await getCloudinary();
      if (!cloudName || !apiKey || !apiSecret) {
        return res.status(500).json({
          success: false,
          error: 'Cloudinary signing credentials are missing on the server.',
        });
      }

      const folder = sanitizeUploadFolder(
        requestedFolder ? `madecc/cms_media/${sanitizeUploadFolder(requestedFolder, 'root')}` : 'madecc/cms_media',
        'madecc/cms_media'
      );
      const resourceType =
        validation.resolvedCategory === 'video' || validation.resolvedCategory === 'audio'
          ? 'video'
          : validation.resolvedCategory === 'document'
            ? 'auto'
            : 'image';
      const timestamp = Math.round(Date.now() / 1000);

      const signature = cloudinary.utils.api_sign_request(
        { timestamp, folder },
        apiSecret
      );

      res.json({
        success: true,
        provider: 'cloudinary',
        uploadUrl: `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`,
        resourceType,
        signature,
        timestamp,
        apiKey,
        cloudName,
        folder,
        chunkSizeBytes: 6_000_000,
        chunkThresholdBytes: 20 * 1024 * 1024,
        proxyFallbackMaxBytes: 4.2 * 1024 * 1024,
        supabaseFallbackReady: isSupabaseConfigured(),
      });
    } catch (err: any) {
      console.error('[CMS_MEDIA_SIGN_ERROR]', err);
      res.status(500).json({ success: false, error: err.message || 'Failed to generate upload signature' });
    }
  });

  // SSRF-hardened remote HTTPS media ingestor (never stores raw unverified links blindly)
  app.post('/api/cms/media/ingest-url', requireStaffOrAdmin, async (req: any, res) => {
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

  // Middleware wrapper ensuring all multer errors return JSON (prevents HTML error pages and "Jason error")
  const safeMulter = (req: any, res: any, next: any) => {
    upload.single('file')(req, res, (err: any) => {
      if (err) {
        console.error('[STORAGE_MULTER_ERROR]', err);
        void recordUploadRejectionEvent(req, err);
        return res.status(400).json({
          success: false,
          error: err.message || 'File upload processing failed',
        });
      }
      next();
    });
  };

  // Upload endpoint (proxy / small-file fallback <=4.2MB on Netlify, 2GB local)
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

      // 1. Prioritize Cloudinary
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

          console.log(
            `[STORAGE] Uploading ${req.file.originalname} (${req.file.mimetype}, ${(req.file.size / 1024 / 1024).toFixed(2)} MB) to Cloudinary (folder: ${targetFolder}, resource_type: ${resourceType})...`
          );

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
            console.log(`[STORAGE] Successfully uploaded ${req.file.originalname} to Cloudinary: ${fileUrl}`);

            if (fs.existsSync(req.file.path)) {
              fs.unlinkSync(req.file.path);
            }
          }
        }
      } catch (cloudinaryErr: any) {
        console.error('[STORAGE-FALLBACK] Failed to upload to Cloudinary, trying next storage tier:', cloudinaryErr);
      }

      // 2. Secondary fallback: Supabase Storage
      if (!uploadedToCloud && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
          const fileBuffer = fs.readFileSync(req.file.path);
          const bucketName = process.env.SUPABASE_BUCKET || 'madecc-assets';
          const fileName = `${targetFolder}/${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

          const { error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, fileBuffer, {
              contentType: req.file.mimetype || 'application/octet-stream',
              cacheControl: '3600',
              upsert: true,
            });

          if (!error) {
            const { data: { publicUrl } } = supabase.storage
              .from(bucketName)
              .getPublicUrl(fileName);

            fileUrl = publicUrl;
            uploadedToCloud = true;
            storageProvider = 'supabase';
            publicId = `${bucketName}/${fileName}`;
            console.log(`[STORAGE] Successfully uploaded ${req.file.originalname} to Supabase Storage: ${fileUrl}`);

            if (fs.existsSync(req.file.path)) {
              fs.unlinkSync(req.file.path);
            }
          }
        } catch (supabaseErr) {
          console.error('[STORAGE-FALLBACK] Failed to upload to Supabase Storage:', supabaseErr);
        }
      }

      // Never return ephemeral /uploads/* paths on Netlify/Lambda serverless runtimes
      if (!uploadedToCloud && isServerlessRuntime()) {
        if (fs.existsSync(req.file.path)) {
          try { fs.unlinkSync(req.file.path); } catch {}
        }
        return res.status(502).json({
          success: false,
          error: 'Cloud upload failed in serverless runtime (Cloudinary & Supabase unavailable). Ephemeral disk fallback is disabled to prevent broken asset URLs.',
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

      // 1. Upload to Supabase Storage if configured
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
          const fileBuffer = fs.readFileSync(req.file.path);
          const bucketName = process.env.SUPABASE_BUCKET || 'madecc-assets';
          const fileName = `eoi-dossiers/${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

          const { error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, fileBuffer, {
              contentType: req.file.mimetype,
              cacheControl: '3600',
              upsert: true,
            });

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

      // 2. Upload to Cloudinary if not already stored in Supabase
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
