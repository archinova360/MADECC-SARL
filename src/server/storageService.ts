import path from 'path';
import fs from 'fs';
import multer from 'multer';

export function initAndSanitizeCloudinaryEnv() {
  let cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || '';
  let apiKey = process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY || '';
  let apiSecret = process.env.CLOUDINARY_API_SECRET || '';

  const rawUrl = process.env.CLOUDINARY_URL;
  if (rawUrl && typeof rawUrl === 'string') {
    const trimmed = rawUrl.trim();
    if (trimmed.startsWith('cloudinary://')) {
      const match = trimmed.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
      if (match) {
        apiKey = apiKey || match[1];
        apiSecret = apiSecret || match[2];
        cloudName = cloudName || match[3];
      }
    } else if (trimmed.includes('@') && trimmed.includes(':')) {
      const match = trimmed.match(/^([^:]+):([^@]+)@(.+)$/);
      if (match) {
        apiKey = apiKey || match[1];
        apiSecret = apiSecret || match[2];
        cloudName = cloudName || match[3];
      }
    } else if (trimmed.includes('cloudinary.com')) {
      const match = trimmed.match(/cloudinary\.com\/(?:v\d+\/)?([^/]+)/);
      if (match) {
        cloudName = cloudName || match[1];
      }
    }
  }

  if (!cloudName) {
    cloudName = 'madecc';
  }

  return { cloudName, apiKey, apiSecret };
}

export function getCloudinaryCredentials() {
  return initAndSanitizeCloudinaryEnv();
}

export async function getCloudinary() {
  const { cloudName, apiKey, apiSecret } = initAndSanitizeCloudinaryEnv();
  
  const cloudinaryModule = await import('cloudinary');
  const cloudinary = (cloudinaryModule.v2 || cloudinaryModule) as any;

  if (cloudName && apiKey && apiSecret) {
    cloudinary.config({
      cloud_name: cloudName,
      api_key: apiKey,
      api_secret: apiSecret,
      secure: true
    });
  }

  return { cloudinary, cloudName, apiKey, apiSecret };
}

export async function deleteFileFromCloud(fileUrl: string | null | undefined) {
  if (!fileUrl) return;

  // 1. Cloudinary asset clean-up
  if (fileUrl.includes('cloudinary.com')) {
    try {
      const { cloudinary, cloudName, apiKey, apiSecret } = await getCloudinary();
      if (cloudName && apiKey && apiSecret) {
        const urlObj = new URL(fileUrl);
        const pathname = urlObj.pathname;
        const parts = pathname.split('/');
        
        const resourceType = parts[2] || 'image';
        const uploadIndex = parts.indexOf('upload');
        if (uploadIndex !== -1 && uploadIndex + 1 < parts.length) {
          let remainingParts = parts.slice(uploadIndex + 1);
          if (remainingParts[0] && remainingParts[0].startsWith('v') && /^\d+$/.test(remainingParts[0].substring(1))) {
            remainingParts = remainingParts.slice(1);
          }
          
          const fileWithExt = remainingParts.join('/');
          const lastDotIndex = fileWithExt.lastIndexOf('.');
          const publicId = lastDotIndex !== -1 ? fileWithExt.substring(0, lastDotIndex) : fileWithExt;
          
          const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType === 'raw' ? 'raw' : (resourceType === 'video' ? 'video' : 'image')
          });
          console.log(`[STORAGE_DELETE] Deleted from Cloudinary: publicId=${publicId}, result=`, result);
        }
      } else {
        console.warn('[STORAGE_DELETE_WARN] Could not delete Cloudinary asset because configuration is missing.');
      }
    } catch (err) {
      console.error('[STORAGE_DELETE_ERROR] Error deleting from Cloudinary:', err);
    }
  }
  // 2. Supabase Storage clean-up
  else if (fileUrl.includes('supabase.co') && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
      
      const urlObj = new URL(fileUrl);
      const pathParts = urlObj.pathname.split('/storage/v1/object/public/');
      if (pathParts.length > 1) {
        const fullPath = pathParts[1];
        const firstSlash = fullPath.indexOf('/');
        if (firstSlash !== -1) {
          const bucket = fullPath.substring(0, firstSlash);
          const filePath = fullPath.substring(firstSlash + 1);
          
          const { error } = await supabase.storage.from(bucket).remove([filePath]);
          if (error) {
            console.error(`[STORAGE_DELETE_ERROR] Failed to delete from Supabase storage:`, error);
          } else {
            console.log(`[STORAGE_DELETE] Deleted from Supabase: bucket=${bucket}, path=${filePath}`);
          }
        }
      }
    } catch (err) {
      console.error('[STORAGE_DELETE_ERROR] Error deleting from Supabase:', err);
    }
  }
  // 3. Local disk clean-up fallback
  else if (fileUrl.startsWith('/uploads/')) {
    try {
      const filename = path.basename(fileUrl);
      const candidates = [
        path.join(process.cwd(), fileUrl),
        path.join(os.tmpdir(), 'madecc_uploads', filename),
        path.join(os.tmpdir(), filename)
      ];
      for (const candidate of candidates) {
        if (fs.existsSync(candidate)) {
          fs.unlinkSync(candidate);
          console.log(`[STORAGE_DELETE] Deleted local file: ${candidate}`);
        }
      }
    } catch (err) {
      console.error('[STORAGE_DELETE_ERROR] Error deleting local file:', err);
    }
  }
}


// Multer storage setup with dynamic writable directory detection
import os from 'os';

export function getWritableUploadDir(): string {
  // 1. Try local project uploads directory
  const localDir = path.join(process.cwd(), 'uploads');
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    // Test write permission
    const testFile = path.join(localDir, `.write_test_${Date.now()}`);
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    return localDir;
  } catch (err) {
    // 2. Fallback to OS temporary directory (guaranteed writable on Netlify / AWS Lambda / read-only containers)
    const tmpDir = path.join(os.tmpdir(), 'madecc_uploads');
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      return tmpDir;
    } catch (_) {
      return os.tmpdir();
    }
  }
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const targetDir = getWritableUploadDir();
    cb(null, targetDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({
  storage,
  limits: { 
    fileSize: 2000 * 1024 * 1024 // 2000 MB / 2 GB Maximum Upload Capacity
  }
});

