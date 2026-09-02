import express from 'express';
import path from 'path';
import fs from 'fs';
import { getCloudinary, initAndSanitizeCloudinaryEnv, upload } from '../storageService.js';

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

  // Endpoint to sign client-side direct Cloudinary uploads (prevents serverless 6MB body size limits and timeouts)
  app.get('/api/cloudinary-signature', async (req: any, res) => {
    try {
      const { cloudinary, cloudName, apiKey, apiSecret } = await getCloudinary();
      if (!cloudName || !apiKey || !apiSecret) {
        return res.status(400).json({ error: 'Cloudinary is not fully configured on the server.' });
      }

      const timestamp = Math.round(Date.now() / 1000);
      const folder = 'madecc';

      const signature = cloudinary.utils.api_sign_request(
        { timestamp, folder },
        apiSecret
      );

      res.json({
        signature,
        timestamp,
        apiKey,
        cloudName,
        folder
      });
    } catch (err: any) {
      console.error('[CLOUDINARY_SIGN_ERROR] Error generating upload signature:', err);
      res.status(500).json({ error: err.message });
    }
  });

  // Upload endpoint (accepts all media types: images, videos up to 150MB, audio, documents, and archives)
  app.post('/api/upload', upload.single('file'), async (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    try {
      let fileUrl = `/uploads/${req.file.filename}`;
      let uploadedToCloud = false;

      // 1. Prioritize Cloudinary for all media types (images, videos, audio, documents)
      try {
        const { cloudinary, cloudName, apiKey, apiSecret } = await getCloudinary();
        if (cloudName && apiKey && apiSecret) {
          const isVideo = req.file.mimetype?.startsWith('video/') || /\.(mp4|mov|avi|webm|mkv|flv|wmv|m4v)$/i.test(req.file.originalname);
          const isImage = req.file.mimetype?.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|svg|avif|bmp|tiff)$/i.test(req.file.originalname);
          const resourceType = isVideo ? 'video' : (isImage ? 'image' : 'auto');

          console.log(`[STORAGE] Uploading ${req.file.originalname} (${req.file.mimetype}, ${(req.file.size / 1024 / 1024).toFixed(2)} MB) to Cloudinary (resource_type: ${resourceType})...`);

          let result: any;
          if (req.file.size > 20 * 1024 * 1024) {
            // For large files (>20MB), use upload_large with chunking
            result = await cloudinary.uploader.upload_large(req.file.path, {
              resource_type: resourceType,
              folder: 'madecc',
              chunk_size: 6000000,
              use_filename: true,
              unique_filename: true,
            });
          } else {
            result = await cloudinary.uploader.upload(req.file.path, {
              resource_type: resourceType,
              folder: 'madecc',
              use_filename: true,
              unique_filename: true,
            });
          }

          if (result && (result.secure_url || result.url)) {
            fileUrl = result.secure_url || result.url;
            uploadedToCloud = true;
            console.log(`[STORAGE] Successfully uploaded ${req.file.originalname} to Cloudinary: ${fileUrl}`);
            
            // Remove local temp file after successful cloud upload
            if (fs.existsSync(req.file.path)) {
              fs.unlinkSync(req.file.path);
            }
          }
        }
      } catch (cloudinaryErr: any) {
        console.error('[STORAGE-FALLBACK] Failed to upload to Cloudinary, trying next storage tier:', cloudinaryErr);
      }

      // 2. Secondary fallback: Supabase Storage if configured and not uploaded to Cloudinary
      if (!uploadedToCloud && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
          const fileBuffer = fs.readFileSync(req.file.path);
          const bucketName = process.env.SUPABASE_BUCKET || 'madecc-assets';
          const fileName = `uploads/${Date.now()}-${req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

          const { error } = await supabase.storage
            .from(bucketName)
            .upload(fileName, fileBuffer, {
              contentType: req.file.mimetype || 'application/octet-stream',
              cacheControl: '3600',
              upsert: true
            });

          if (!error) {
            const { data: { publicUrl } } = supabase.storage
              .from(bucketName)
              .getPublicUrl(fileName);

            fileUrl = publicUrl;
            uploadedToCloud = true;
            console.log(`[STORAGE] Successfully uploaded ${req.file.originalname} to Supabase Storage: ${fileUrl}`);
            
            if (fs.existsSync(req.file.path)) {
              fs.unlinkSync(req.file.path);
            }
          }
        } catch (supabaseErr) {
          console.error('[STORAGE-FALLBACK] Failed to upload to Supabase Storage, using local disk path:', supabaseErr);
        }
      }

      // Return metadata and public-facing secure URL
      res.json({
        success: true,
        url: fileUrl,
        secure_url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      });
    } catch (err: any) {
      console.error('File upload handler error:', err);
      // Even on unexpected error, fallback safely to local static file URL if file exists
      const fallbackUrl = req.file?.filename ? `/uploads/${req.file.filename}` : '';
      res.json({
        success: true,
        url: fallbackUrl,
        secure_url: fallbackUrl,
        filename: req.file?.filename || '',
        originalName: req.file?.originalname || '',
        size: req.file?.size || 0
      });
    }

  });

  app.post('/api/public/upload', upload.single('file'), async (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    try {
      let fileUrl = `/uploads/${req.file.filename}`;

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
              upsert: true
            });

          if (!error) {
            const { data: { publicUrl } } = supabase.storage
              .from(bucketName)
              .getPublicUrl(fileName);
            fileUrl = publicUrl;
            console.log(`[STORAGE] Public upload to Supabase Storage successful: ${fileUrl}`);
          }
        } catch (supabaseErr) {
          console.error('[STORAGE-FALLBACK] Supabase public upload failed, trying Cloudinary/disk:', supabaseErr);
        }
      }

      // 2. Upload to Cloudinary if configured and not already stored in Supabase
      if (fileUrl.startsWith('/uploads/')) {
        try {
          const { cloudinary, cloudName, apiKey, apiSecret } = await getCloudinary();
          if (cloudName && apiKey && apiSecret) {
            const result = await cloudinary.uploader.upload(req.file.path, {
              resource_type: 'auto',
              folder: 'madecc/tenders'
            });

            fileUrl = result.secure_url;
            console.log(`[STORAGE] Public upload to Cloudinary successful: ${fileUrl}`);
          }
        } catch (cloudErr) {
          console.error('[STORAGE-FALLBACK] Cloudinary public upload failed, using local disk path:', cloudErr);
        }
      }

      res.json({
        success: true,
        fileUrl,
        url: fileUrl,
        fileName: req.file.originalname,
        fileType: req.file.mimetype,
        fileSize: req.file.size
      });
    } catch (error: any) {
      console.error('[PUBLIC_UPLOAD_ERROR]', error);
      res.status(500).json({ error: error.message || 'Upload failed' });
    }
  });


}
