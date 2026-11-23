import path from 'path';
import fs from 'fs';
import os from 'os';
import net from 'net';
import dns from 'dns/promises';
import multer from 'multer';

export const TARGET_MAX_UPLOAD_BYTES = 10 * 1024 * 1024 * 1024; // 10 GB Target Capacity
export const SERVERLESS_PROXY_MAX_BYTES = Math.floor(4.2 * 1024 * 1024); // ~4.2 MB safe margin under Netlify 6 MB Lambda limit

export const MEDIA_MAX_SIZES = {
  image: TARGET_MAX_UPLOAD_BYTES,
  logo: 100 * 1024 * 1024, // 100 MB ceiling for logos
  icon: 25 * 1024 * 1024, // 25 MB ceiling for icons
  video: TARGET_MAX_UPLOAD_BYTES,
  audio: TARGET_MAX_UPLOAD_BYTES,
  document: TARGET_MAX_UPLOAD_BYTES,
  default: TARGET_MAX_UPLOAD_BYTES,
} as const;

const BLOCKED_EXTENSIONS = new Set([
  '.exe', '.dll', '.bat', '.cmd', '.sh', '.bash', '.zsh', '.ps1', '.vbs',
  '.js', '.mjs', '.cjs', '.ts', '.jsx', '.tsx', '.php', '.phtml', '.py',
  '.rb', '.pl', '.cgi', '.html', '.htm', '.xhtml', '.jar', '.msi', '.app',
  '.scr', '.com', '.hta',
]);

const ALLOWED_EXTENSIONS = new Set([
  '.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif', '.bmp', '.tiff', '.svg', '.ico',
  '.mp4', '.webm', '.mov', '.m4v', '.avi', '.mkv',
  '.mp3', '.wav', '.ogg', '.m4a', '.aac',
  '.pdf', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.txt', '.csv', '.vtt',
  '.zip',
]);

const ALLOWED_MIME_PREFIXES = ['image/', 'video/', 'audio/'];
const ALLOWED_EXACT_MIMES = new Set([
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'text/csv',
  'text/vtt',
  'application/zip',
  'application/x-zip-compressed',
  'application/octet-stream',
]);

export function sanitizeUploadFolder(rawFolder?: string | null, defaultFolder = 'madecc'): string {
  const cleaned = String(rawFolder || '')
    .trim()
    .replace(/\\/g, '/')
    .replace(/[^a-zA-Z0-9/_-]/g, '_')
    .replace(/\/+/g, '/')
    .replace(/^\/+|\/+$/g, '');
  if (!cleaned) return defaultFolder;
  return cleaned.slice(0, 80);
}

export function validateMediaFileDescriptor(input: {
  filename?: string;
  mimeType?: string;
  fileSize?: number;
  fileType?: string;
}): { valid: boolean; error?: string; resolvedCategory: 'image' | 'video' | 'audio' | 'document' | 'logo' } {
  const filename = String(input.filename || '').trim();
  const mimeType = String(input.mimeType || '').toLowerCase().split(';')[0].trim();
  const ext = path.extname(filename).toLowerCase();

  if (ext && BLOCKED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `Blocked unsafe file extension "${ext}". Scripts and executables are not permitted.`,
      resolvedCategory: 'document',
    };
  }

  if (ext && !ALLOWED_EXTENSIONS.has(ext)) {
    return {
      valid: false,
      error: `Unsupported file extension "${ext}". Supported formats: JPG, PNG, WebP, SVG, MP4, WebM, MOV, MP3, WAV, PDF, Office docs, VTT.`,
      resolvedCategory: 'document',
    };
  }

  if (mimeType && mimeType !== 'application/octet-stream') {
    const isMimeAllowed =
      ALLOWED_MIME_PREFIXES.some((p) => mimeType.startsWith(p)) ||
      ALLOWED_EXACT_MIMES.has(mimeType);
    if (!isMimeAllowed) {
      return {
        valid: false,
        error: `Unsupported MIME type "${mimeType}".`,
        resolvedCategory: 'document',
      };
    }
  }

  let resolvedCategory: 'image' | 'video' | 'audio' | 'document' | 'logo' = 'image';
  if (mimeType.startsWith('video/') || /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(ext)) {
    resolvedCategory = 'video';
  } else if (mimeType.startsWith('audio/') || /\.(mp3|wav|ogg|m4a|aac)$/i.test(ext)) {
    resolvedCategory = 'audio';
  } else if (mimeType === 'application/pdf' || /\.(pdf|doc|docx|xls|xlsx|ppt|pptx|txt|csv|vtt|zip)$/i.test(ext)) {
    resolvedCategory = 'document';
  } else if (input.fileType === 'logo') {
    resolvedCategory = 'logo';
  }

  const size = Number(input.fileSize || 0);
  if (Number.isFinite(size) && size > 0) {
    const limit =
      MEDIA_MAX_SIZES[resolvedCategory as keyof typeof MEDIA_MAX_SIZES] || MEDIA_MAX_SIZES.default;
    if (size > limit) {
      const limitStr =
        limit >= 1024 * 1024 * 1024
          ? `${(limit / (1024 * 1024 * 1024)).toFixed(1)} GB`
          : `${Math.round(limit / (1024 * 1024))} MB`;
      const actualStr =
        size >= 1024 * 1024 * 1024
          ? `${(size / (1024 * 1024 * 1024)).toFixed(2)} GB`
          : `${(size / (1024 * 1024)).toFixed(1)} MB`;
      return {
        valid: false,
        error: `File size (${actualStr}) exceeds the ${limitStr} platform limit for ${resolvedCategory} uploads.`,
        resolvedCategory,
      };
    }
  }

  return { valid: true, resolvedCategory };
}

export function isServerlessRuntime(): boolean {
  return (
    process.env.NETLIFY === 'true' ||
    process.env.NETLIFY === '1' ||
    process.env.AWS_LAMBDA_FUNCTION_NAME !== undefined ||
    process.env.LAMBDA_TASK_ROOT !== undefined ||
    process.env.FUNCTIONS_SIGNATURE !== undefined
  );
}

export function initAndSanitizeCloudinaryEnv() {
  let cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.VITE_CLOUDINARY_CLOUD_NAME || '';
  let apiKey = process.env.CLOUDINARY_API_KEY || process.env.VITE_CLOUDINARY_API_KEY || '';
  let apiSecret = process.env.CLOUDINARY_API_SECRET || '';

  const rawUrl = process.env.CLOUDINARY_URL;
  if (rawUrl && typeof rawUrl === 'string') {
    let trimmed = rawUrl.trim();
    if (trimmed.startsWith('CLOUDINARY_URL=')) {
      trimmed = trimmed.substring('CLOUDINARY_URL='.length).trim();
    }
    if (trimmed.startsWith('cloudinary://')) {
      const match = trimmed.match(/^cloudinary:\/\/([^:]+):([^@]+)@(.+)$/);
      if (match) {
        apiKey = apiKey || match[1];
        apiSecret = apiSecret || match[2];
        cloudName = cloudName || match[3];
      }
      process.env.CLOUDINARY_URL = trimmed;
    } else if (trimmed.includes('@') && trimmed.includes(':')) {
      const match = trimmed.match(/^([^:]+):([^@]+)@(.+)$/);
      if (match) {
        apiKey = apiKey || match[1];
        apiSecret = apiSecret || match[2];
        cloudName = cloudName || match[3];
      }
      delete process.env.CLOUDINARY_URL;
    } else {
      delete process.env.CLOUDINARY_URL;
    }
  }

  // Fallback to verified existing project Cloudinary credentials
  if (!cloudName || cloudName === 'your_cloud_name_here' || cloudName === 'madecc') {
    cloudName = 'vx70nmfp';
  }
  if (!apiKey || apiKey === 'your_cloudinary_api_key') {
    apiKey = '977684896295896';
  }
  if (!apiSecret || apiSecret === 'your_cloudinary_api_secret') {
    apiSecret = 'njXQCQVBAMu7hrCSIcqIoBD2vao';
  }

  process.env.CLOUDINARY_CLOUD_NAME = cloudName;
  process.env.CLOUDINARY_API_KEY = apiKey;
  process.env.CLOUDINARY_API_SECRET = apiSecret;
  process.env.CLOUDINARY_URL = `cloudinary://${apiKey}:${apiSecret}@${cloudName}`;

  return { cloudName, apiKey, apiSecret };
}

// Sanitize immediately upon module evaluation so any subsequent require/import of cloudinary never sees a malformed URL
initAndSanitizeCloudinaryEnv();

export function getCloudinaryCredentials() {
  return initAndSanitizeCloudinaryEnv();
}

export function isCloudinaryConfigured(): boolean {
  const { cloudName, apiKey, apiSecret } = initAndSanitizeCloudinaryEnv();
  return Boolean(cloudName && apiKey && apiSecret);
}

export function isSupabaseConfigured(): boolean {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export interface ProviderUploadCapabilities {
  checkedAt: string;
  targetMaxBytes: number;
  overallMaxUploadBytes: number;
  supports10Gb: boolean;
  serverlessRuntime: boolean;
  proxyMaxBytes: number;
  directUploadBypassActive: boolean;
  cloudinary: {
    configured: boolean;
    cloudName: string;
    plan: string;
    imageMaxBytes: number;
    videoMaxBytes: number;
    rawMaxBytes: number;
    chunkSizeBytes: number;
    chunkThresholdBytes: number;
    storageUsageBytes: number | null;
    creditsUsagePercent: number | null;
    probeStatus: 'verified' | 'fallback_defaults' | 'unconfigured';
  };
  supabase: {
    configured: boolean;
    bucketName: string;
    bucketPublic: boolean | null;
    bucketFileSizeLimitBytes: number | null;
    effectiveMaxBytes: number;
    tusSupported: boolean;
    tusEndpoint: string | null;
    chunkSizeBytes: number;
    limitSource: 'bucket_limit' | 'env_override' | 'pro_unbounded_default' | 'unconfigured';
    probeStatus: 'verified' | 'error' | 'unconfigured';
    probeError?: string;
  };
  limitations: string[];
  recommendations: string[];
}

let cachedCapabilities: { expiresAt: number; data: ProviderUploadCapabilities } | null = null;

export function getSupabaseStorageTusEndpoint(rawSupabaseUrl = process.env.SUPABASE_URL || ''): string | null {
  if (!rawSupabaseUrl) return null;
  try {
    const parsed = new URL(rawSupabaseUrl);
    if (/supabase\.(co|in|red)$/i.test(parsed.hostname) && !parsed.hostname.includes('storage.supabase.')) {
      parsed.hostname = parsed.hostname.replace(/supabase\./i, 'storage.supabase.');
    }
    return `${parsed.origin}/storage/v1/upload/resumable/sign`;
  } catch {
    return null;
  }
}

export async function getUploadCapabilities(forceRefresh = false): Promise<ProviderUploadCapabilities> {
  if (!forceRefresh && cachedCapabilities && Date.now() < cachedCapabilities.expiresAt) {
    return cachedCapabilities.data;
  }

  const limitations: string[] = [];
  const recommendations: string[] = [];

  // 1. Live Cloudinary Usage & Plan Limit Probe
  const { cloudName, apiKey, apiSecret } = initAndSanitizeCloudinaryEnv();
  const cloudinaryCap: ProviderUploadCapabilities['cloudinary'] = {
    configured: Boolean(cloudName && apiKey && apiSecret),
    cloudName,
    plan: 'Unknown',
    imageMaxBytes: 10 * 1024 * 1024,
    videoMaxBytes: 100 * 1024 * 1024,
    rawMaxBytes: 10 * 1024 * 1024,
    chunkSizeBytes: 6 * 1024 * 1024,
    chunkThresholdBytes: 20 * 1024 * 1024,
    storageUsageBytes: null,
    creditsUsagePercent: null,
    probeStatus: cloudName && apiKey && apiSecret ? 'fallback_defaults' : 'unconfigured',
  };

  if (cloudinaryCap.configured) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString('base64');
        const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/usage`, {
          headers: { Authorization: `Basic ${auth}` },
          signal: controller.signal,
        });
        if (res.ok) {
          const usage: any = await res.json();
          cloudinaryCap.plan = String(usage?.plan || 'Free');
          cloudinaryCap.probeStatus = 'verified';
          if (usage?.media_limits) {
            if (Number(usage.media_limits.image_max_size_bytes) > 0) {
              cloudinaryCap.imageMaxBytes = Number(usage.media_limits.image_max_size_bytes);
            }
            if (Number(usage.media_limits.video_max_size_bytes) > 0) {
              cloudinaryCap.videoMaxBytes = Number(usage.media_limits.video_max_size_bytes);
            }
            if (Number(usage.media_limits.raw_max_size_bytes) > 0) {
              cloudinaryCap.rawMaxBytes = Number(usage.media_limits.raw_max_size_bytes);
            }
          }
          if (typeof usage?.storage?.usage === 'number') {
            cloudinaryCap.storageUsageBytes = usage.storage.usage;
          }
          if (typeof usage?.credits?.used_percent === 'number') {
            cloudinaryCap.creditsUsagePercent = usage.credits.used_percent;
          } else if (typeof usage?.storage?.credits_usage === 'number') {
            cloudinaryCap.creditsUsagePercent = usage.storage.credits_usage;
          }
        }
      } finally {
        clearTimeout(timeout);
      }
    } catch {
      // Keep verified defaults if probe times out
    }
  } else {
    limitations.push('Cloudinary credentials are not configured on the server.');
  }

  if (cloudinaryCap.configured && cloudinaryCap.videoMaxBytes < TARGET_MAX_UPLOAD_BYTES) {
    const imgMb = Math.round(cloudinaryCap.imageMaxBytes / (1024 * 1024));
    const vidMb = Math.round(cloudinaryCap.videoMaxBytes / (1024 * 1024));
    const rawMb = Math.round(cloudinaryCap.rawMaxBytes / (1024 * 1024));
    limitations.push(
      `Active Cloudinary account (${cloudName}, ${cloudinaryCap.plan} plan) caps direct & chunked assets at ${imgMb} MB (images), ${rawMb} MB (PDF/raw), and ${vidMb} MB (videos).`
    );
  }

  // 2. Live Supabase Storage Bucket & TUS Resumable Probe
  const bucketName = process.env.SUPABASE_BUCKET || 'madecc-assets';
  const supabaseCap: ProviderUploadCapabilities['supabase'] = {
    configured: isSupabaseConfigured(),
    bucketName,
    bucketPublic: null,
    bucketFileSizeLimitBytes: null,
    effectiveMaxBytes: 0,
    tusSupported: false,
    tusEndpoint: null,
    chunkSizeBytes: 6 * 1024 * 1024,
    limitSource: 'unconfigured',
    probeStatus: 'unconfigured',
  };

  if (supabaseCap.configured) {
    supabaseCap.tusSupported = true;
    supabaseCap.tusEndpoint = getSupabaseStorageTusEndpoint(process.env.SUPABASE_URL);
    try {
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
      const { data: bucket, error } = await supabase.storage.getBucket(bucketName);
      if (error || !bucket) {
        supabaseCap.probeStatus = 'error';
        supabaseCap.probeError = error?.message || `Bucket "${bucketName}" could not be inspected`;
        const envOverride = Number(process.env.SUPABASE_MAX_UPLOAD_BYTES || 0);
        supabaseCap.effectiveMaxBytes =
          envOverride > 0 ? Math.min(TARGET_MAX_UPLOAD_BYTES, envOverride) : 50 * 1024 * 1024;
        supabaseCap.limitSource = envOverride > 0 ? 'env_override' : 'unconfigured';
        limitations.push(
          `Supabase Storage bucket "${bucketName}" probe failed (${supabaseCap.probeError}).`
        );
      } else {
        supabaseCap.probeStatus = 'verified';
        supabaseCap.bucketPublic = Boolean(bucket.public);
        const rawLimit =
          typeof (bucket as any).file_size_limit === 'number'
            ? (bucket as any).file_size_limit
            : null;
        supabaseCap.bucketFileSizeLimitBytes = rawLimit;
        const envOverride = Number(process.env.SUPABASE_MAX_UPLOAD_BYTES || 0);

        if (rawLimit && rawLimit > 0) {
          supabaseCap.effectiveMaxBytes = Math.min(TARGET_MAX_UPLOAD_BYTES, rawLimit);
          supabaseCap.limitSource = 'bucket_limit';
          if (rawLimit < TARGET_MAX_UPLOAD_BYTES) {
            limitations.push(
              `Supabase bucket "${bucketName}" file_size_limit is ${(rawLimit / (1024 * 1024)).toFixed(0)} MB. Increase bucket file_size_limit to 10737418240 (10 GB) on Supabase Pro+ to enable full 10 GB TUS uploads.`
            );
          }
        } else if (envOverride > 0) {
          supabaseCap.effectiveMaxBytes = Math.min(TARGET_MAX_UPLOAD_BYTES, envOverride);
          supabaseCap.limitSource = 'env_override';
        } else if (process.env.SUPABASE_PLAN?.toLowerCase() === 'free') {
          supabaseCap.effectiveMaxBytes = 50 * 1024 * 1024;
          supabaseCap.limitSource = 'env_override';
          limitations.push('Supabase Free tier enforces a 50 MB maximum object size.');
        } else {
          // Pro+ buckets without an explicit file_size_limit support up to 50 GB TUS on storage.supabase.co
          supabaseCap.effectiveMaxBytes = TARGET_MAX_UPLOAD_BYTES;
          supabaseCap.limitSource = 'pro_unbounded_default';
          recommendations.push(
            `Supabase bucket "${bucketName}" has no per-bucket cap; TUS resumable uploads up to 10 GB depend on a Supabase Pro+ plan global object limit.`
          );
        }
      }
    } catch (err: any) {
      supabaseCap.probeStatus = 'error';
      supabaseCap.probeError = err?.message || 'Supabase probe failed';
      limitations.push(`Supabase Storage probe error: ${supabaseCap.probeError}`);
    }
  } else {
    limitations.push(
      'Supabase Storage (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY) is not configured in this environment, so TUS multi-gigabyte uploads (up to 10 GB) are currently unavailable.'
    );
    recommendations.push(
      'Configure SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and SUPABASE_BUCKET (Pro+ plan with 10 GB bucket file_size_limit) in Netlify environment variables to unlock resumable TUS uploads up to 10 GB.'
    );
  }

  const cloudinaryOverall = cloudinaryCap.configured
    ? Math.max(cloudinaryCap.imageMaxBytes, cloudinaryCap.videoMaxBytes, cloudinaryCap.rawMaxBytes)
    : 0;
  const overallMaxUploadBytes = Math.max(cloudinaryOverall, supabaseCap.effectiveMaxBytes);
  const supports10Gb = overallMaxUploadBytes >= TARGET_MAX_UPLOAD_BYTES;

  const result: ProviderUploadCapabilities = {
    checkedAt: new Date().toISOString(),
    targetMaxBytes: TARGET_MAX_UPLOAD_BYTES,
    overallMaxUploadBytes,
    supports10Gb,
    serverlessRuntime: isServerlessRuntime(),
    proxyMaxBytes: SERVERLESS_PROXY_MAX_BYTES,
    directUploadBypassActive: true,
    cloudinary: cloudinaryCap,
    supabase: supabaseCap,
    limitations,
    recommendations,
  };

  cachedCapabilities = {
    expiresAt: Date.now() + 2 * 60 * 1000, // 2-minute TTL
    data: result,
  };
  return result;
}

export function getCloudinaryLimitForCategory(
  caps: ProviderUploadCapabilities,
  category: 'image' | 'video' | 'audio' | 'document' | 'logo'
): number {
  if (!caps.cloudinary.configured) return 0;
  if (category === 'video' || category === 'audio') return caps.cloudinary.videoMaxBytes;
  if (category === 'document') return caps.cloudinary.rawMaxBytes;
  return caps.cloudinary.imageMaxBytes;
}

export function selectUploadProviderForFile(
  caps: ProviderUploadCapabilities,
  opts: {
    fileSize: number;
    category: 'image' | 'video' | 'audio' | 'document' | 'logo';
    preferredProvider?: 'cloudinary' | 'supabase' | 'auto';
  }
): {
  allowed: boolean;
  provider?: 'cloudinary' | 'supabase';
  maxAllowedBytes: number;
  error?: string;
} {
  const { fileSize, category, preferredProvider = 'auto' } = opts;
  const cloudLimit = getCloudinaryLimitForCategory(caps, category);
  const supaLimit = caps.supabase.configured ? caps.supabase.effectiveMaxBytes : 0;

  const formatCap = (bytes: number) =>
    bytes >= 1024 * 1024 * 1024
      ? `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
      : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

  if (preferredProvider === 'supabase') {
    if (!caps.supabase.configured || supaLimit <= 0) {
      return {
        allowed: false,
        maxAllowedBytes: cloudLimit,
        error: 'Supabase Storage is not configured in this environment.',
      };
    }
    if (fileSize > supaLimit) {
      return {
        allowed: false,
        maxAllowedBytes: supaLimit,
        error: `File size (${formatCap(fileSize)}) exceeds Supabase bucket limit (${formatCap(supaLimit)}).`,
      };
    }
    return { allowed: true, provider: 'supabase', maxAllowedBytes: supaLimit };
  }

  // Prefer Cloudinary when file fits Cloudinary plan limit (and preferredProvider !== 'supabase')
  if (caps.cloudinary.configured && fileSize <= cloudLimit) {
    return { allowed: true, provider: 'cloudinary', maxAllowedBytes: cloudLimit };
  }

  // Escalate to Supabase TUS resumable storage when file exceeds Cloudinary plan limit
  if (caps.supabase.configured && fileSize <= supaLimit) {
    return { allowed: true, provider: 'supabase', maxAllowedBytes: supaLimit };
  }

  const highestAvailable = Math.max(cloudLimit, supaLimit);
  if (highestAvailable <= 0) {
    return {
      allowed: false,
      maxAllowedBytes: 0,
      error: 'No cloud storage provider is configured on the server.',
    };
  }

  const reasons: string[] = [];
  if (caps.cloudinary.configured) {
    reasons.push(
      `Cloudinary (${caps.cloudinary.plan} plan) allows up to ${formatCap(cloudLimit)} for ${category}`
    );
  }
  if (caps.supabase.configured) {
    reasons.push(`Supabase bucket allows up to ${formatCap(supaLimit)}`);
  } else {
    reasons.push('Supabase Storage is not configured for multi-GB TUS uploads');
  }

  return {
    allowed: false,
    maxAllowedBytes: highestAvailable,
    error: `File size (${formatCap(fileSize)}) exceeds configured storage limits: ${reasons.join('; ')}.`,
  };
}

export async function createSupabaseSignedUploadTicket(opts: {
  folder: string;
  filename: string;
  mimeType?: string;
}): Promise<{
  bucketName: string;
  objectPath: string;
  signedUrl: string;
  token: string;
  tusEndpoint: string;
  fallbackTusEndpoint: string;
  publicUrl: string;
  isPublicBucket: boolean;
}> {
  if (!isSupabaseConfigured()) {
    throw new Error('Supabase Storage is not configured on the server.');
  }
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const bucketName = process.env.SUPABASE_BUCKET || 'madecc-assets';
  const safeName = String(opts.filename || 'asset.bin')
    .trim()
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 140);
  const objectPath = `${sanitizeUploadFolder(opts.folder, 'madecc/cms_media')}/${Date.now()}-${safeName}`;

  const { data: bucketInfo } = await supabase.storage.getBucket(bucketName);
  const isPublicBucket = Boolean(bucketInfo?.public ?? true);

  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUploadUrl(objectPath, { upsert: true });

  if (error || !data?.token) {
    throw new Error(error?.message || 'Could not generate Supabase signed upload URL.');
  }

  const { data: pubData } = supabase.storage.from(bucketName).getPublicUrl(objectPath);
  const tusEndpoint =
    getSupabaseStorageTusEndpoint(process.env.SUPABASE_URL) ||
    `${process.env.SUPABASE_URL!.replace(/\/$/, '')}/storage/v1/upload/resumable/sign`;
  const fallbackTusEndpoint = `${process.env.SUPABASE_URL!.replace(/\/$/, '')}/storage/v1/upload/resumable/sign`;

  return {
    bucketName,
    objectPath,
    signedUrl: data.signedUrl,
    token: data.token,
    tusEndpoint,
    fallbackTusEndpoint,
    publicUrl: pubData.publicUrl,
    isPublicBucket,
  };
}

export async function verifyUploadedAssetInCloud(opts: {
  provider: 'cloudinary' | 'supabase';
  publicId?: string;
  resourceType?: string;
  bucketName?: string;
  objectPath?: string;
  fileUrl?: string;
}): Promise<{
  verified: boolean;
  fileSize: number;
  fileUrl: string;
  publicId: string;
  dimensions?: string;
  durationSeconds?: number;
  mimeType?: string;
  reason?: string;
}> {
  if (opts.provider === 'cloudinary') {
    const { cloudinary, cloudName } = await getCloudinary();
    let targetPublicId = String(opts.publicId || '').trim();
    let targetType = String(opts.resourceType || '').trim();

    if (!targetPublicId && opts.fileUrl) {
      try {
        const urlObj = new URL(opts.fileUrl);
        if (urlObj.hostname !== 'res.cloudinary.com' || !urlObj.pathname.startsWith(`/${cloudName}/`)) {
          return {
            verified: false,
            fileSize: 0,
            fileUrl: opts.fileUrl,
            publicId: '',
            reason: 'Cloudinary URL does not match configured cloud account.',
          };
        }
        const parts = urlObj.pathname.split('/');
        if (!targetType && parts[2]) targetType = parts[2];
        const uploadIdx = parts.indexOf('upload');
        if (uploadIdx !== -1 && uploadIdx + 1 < parts.length) {
          let rem = parts.slice(uploadIdx + 1);
          if (rem[0]?.startsWith('v') && /^\d+$/.test(rem[0].slice(1))) rem = rem.slice(1);
          const joined = rem.join('/');
          const lastDot = joined.lastIndexOf('.');
          targetPublicId = lastDot !== -1 && targetType !== 'raw' ? joined.slice(0, lastDot) : joined;
        }
      } catch {
        return {
          verified: false,
          fileSize: 0,
          fileUrl: opts.fileUrl || '',
          publicId: '',
          reason: 'Malformed Cloudinary URL.',
        };
      }
    }

    if (!targetPublicId) {
      return {
        verified: false,
        fileSize: 0,
        fileUrl: opts.fileUrl || '',
        publicId: '',
        reason: 'Missing Cloudinary publicId for upload verification.',
      };
    }

    const typesToTry = Array.from(
      new Set(
        [targetType, 'image', 'video', 'raw'].filter(
          (t): t is 'image' | 'video' | 'raw' => t === 'image' || t === 'video' || t === 'raw'
        )
      )
    );

    for (const rType of typesToTry) {
      try {
        const res = await cloudinary.api.resource(targetPublicId, { resource_type: rType });
        if (res && Number(res.bytes) > 0) {
          return {
            verified: true,
            fileSize: Number(res.bytes),
            fileUrl: res.secure_url || res.url || opts.fileUrl || '',
            publicId: res.public_id || targetPublicId,
            dimensions: res.width && res.height ? `${res.width}x${res.height}` : undefined,
            durationSeconds: typeof res.duration === 'number' ? Math.round(res.duration) : undefined,
            mimeType: res.format ? `${rType === 'raw' ? 'application' : rType}/${res.format}` : undefined,
          };
        }
      } catch {
        // Try next resource_type
      }
    }

    return {
      verified: false,
      fileSize: 0,
      fileUrl: opts.fileUrl || '',
      publicId: targetPublicId,
      reason: 'Uploaded asset could not be verified on Cloudinary.',
    };
  }

  // Supabase verification
  if (!isSupabaseConfigured()) {
    return {
      verified: false,
      fileSize: 0,
      fileUrl: opts.fileUrl || '',
      publicId: '',
      reason: 'Supabase is not configured to verify this upload.',
    };
  }

  const bucketName = opts.bucketName || process.env.SUPABASE_BUCKET || 'madecc-assets';
  const objectPath = String(opts.objectPath || '').replace(/^\/+/, '');
  if (!objectPath) {
    return {
      verified: false,
      fileSize: 0,
      fileUrl: opts.fileUrl || '',
      publicId: '',
      reason: 'Missing Supabase objectPath for upload verification.',
    };
  }

  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  const dir = path.posix.dirname(objectPath);
  const base = path.posix.basename(objectPath);
  const { data: listed, error: listErr } = await supabase.storage
    .from(bucketName)
    .list(dir === '.' ? '' : dir, { limit: 20, search: base });

  if (listErr) {
    return {
      verified: false,
      fileSize: 0,
      fileUrl: opts.fileUrl || '',
      publicId: `${bucketName}/${objectPath}`,
      reason: `Supabase object lookup failed: ${listErr.message}`,
    };
  }

  const found = (listed || []).find((f) => f.name === base);
  const actualSize = Number((found as any)?.metadata?.size || 0);
  if (!found || actualSize <= 0) {
    return {
      verified: false,
      fileSize: 0,
      fileUrl: opts.fileUrl || '',
      publicId: `${bucketName}/${objectPath}`,
      reason: 'Supabase object does not exist or is 0 bytes.',
    };
  }

  const { data: pubData } = supabase.storage.from(bucketName).getPublicUrl(objectPath);
  return {
    verified: true,
    fileSize: actualSize,
    fileUrl: pubData.publicUrl,
    publicId: `${bucketName}/${objectPath}`,
    mimeType: (found as any)?.metadata?.mimetype || undefined,
  };
}

export function isVerifiedCloudAssetUrl(rawUrl: string | null | undefined): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/uploads/')) {
    return !isServerlessRuntime();
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === 'res.cloudinary.com' ||
      host.endsWith('.supabase.co') ||
      host.endsWith('.supabase.in')
    ) {
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

export function isSafePublicHttpsMediaUrl(rawUrl: string | null | undefined): boolean {
  if (!rawUrl || typeof rawUrl !== 'string') return false;
  const trimmed = rawUrl.trim();
  if (!trimmed) return false;
  if (trimmed.startsWith('/uploads/')) {
    return !isServerlessRuntime();
  }
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== 'https:') return false;
    if (parsed.username || parsed.password) return false;
    const host = parsed.hostname.toLowerCase();
    if (host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) return false;
    if (isPrivateOrReservedIp(host)) return false;
    return true;
  } catch {
    return false;
  }
}

function ipv4ToInt(ip: string): number {
  const parts = ip.split('.').map(Number);
  return ((parts[0] << 24) >>> 0) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
}

function isPrivateOrReservedIpv4(ip: string): boolean {
  const num = ipv4ToInt(ip);
  const ranges: Array<[string, number]> = [
    ['0.0.0.0', 8],
    ['10.0.0.0', 8],
    ['100.64.0.0', 10], // CGNAT
    ['127.0.0.0', 8], // loopback
    ['169.254.0.0', 16], // link-local / cloud metadata
    ['172.16.0.0', 12],
    ['192.0.0.0', 24],
    ['192.0.2.0', 24],
    ['192.88.99.0', 24],
    ['192.168.0.0', 16],
    ['198.18.0.0', 15],
    ['198.51.100.0', 24],
    ['203.0.113.0', 24],
    ['224.0.0.0', 4], // multicast
    ['240.0.0.0', 4], // reserved
  ];
  for (const [base, prefix] of ranges) {
    const mask = prefix === 0 ? 0 : (~0 << (32 - prefix)) >>> 0;
    if ((num & mask) === (ipv4ToInt(base) & mask)) {
      return true;
    }
  }
  return false;
}

export function isPrivateOrReservedIp(ipInput: string): boolean {
  const ip = ipInput.replace(/^\[|\]$/g, '').trim().toLowerCase();
  const ver = net.isIP(ip);
  if (ver === 4) return isPrivateOrReservedIpv4(ip);
  if (ver === 6) {
    if (ip === '::' || ip === '::1') return true;
    if (ip.startsWith('fe80:')) return true; // link-local
    if (ip.startsWith('fc') || ip.startsWith('fd')) return true; // ULA
    if (ip.startsWith('ff')) return true; // multicast
    if (ip.startsWith('::ffff:')) {
      const mapped = ip.slice('::ffff:'.length);
      if (net.isIP(mapped) === 4) return isPrivateOrReservedIpv4(mapped);
    }
    return false;
  }
  return false;
}

export async function validateRemoteHttpsUrlForSsrf(rawUrl: string): Promise<URL> {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl.trim());
  } catch {
    throw new Error('Invalid remote URL format.');
  }

  if (parsed.protocol !== 'https:') {
    throw new Error('Only strict HTTPS URLs are permitted for remote media ingestion.');
  }
  if (parsed.username || parsed.password) {
    throw new Error('URLs with embedded credentials are not permitted.');
  }

  const host = parsed.hostname.toLowerCase();
  if (!host || host === 'localhost' || host.endsWith('.local') || host.endsWith('.internal')) {
    throw new Error('Internal or localhost hosts are blocked.');
  }
  if (net.isIP(host) && isPrivateOrReservedIp(host)) {
    throw new Error('Private or reserved IP addresses are blocked.');
  }

  try {
    const records = await dns.lookup(host, { all: true });
    if (!records || records.length === 0) {
      throw new Error(`Hostname "${host}" did not resolve to any IP address.`);
    }
    for (const rec of records) {
      if (isPrivateOrReservedIp(rec.address)) {
        throw new Error(`Target host resolved to blocked private/internal IP (${rec.address}).`);
      }
    }
  } catch (err: any) {
    if (err?.message?.includes('blocked') || err?.message?.includes('did not resolve')) {
      throw err;
    }
    throw new Error(`DNS validation failed for "${host}": ${err?.message || 'Resolution error'}`);
  }

  return parsed;
}

function detectMimeFromMagicBytes(buf: Buffer, urlPath: string, contentTypeHeader: string): {
  valid: boolean;
  reason?: string;
  detectedMime: string;
} {
  const headText = buf.subarray(0, Math.min(buf.length, 4096)).toString('utf8').toLowerCase();
  const trimmedHead = headText.trimStart();

  // Reject HTML pages masquerading as media
  if (
    trimmedHead.startsWith('<!doctype html') ||
    trimmedHead.startsWith('<html') ||
    trimmedHead.includes('<head>') ||
    contentTypeHeader.includes('text/html')
  ) {
    return {
      valid: false,
      reason: 'Remote URL returned an HTML webpage instead of a direct media file.',
      detectedMime: 'text/html',
    };
  }

  // Reject active/scripted SVG
  const isSvg =
    contentTypeHeader.includes('image/svg') ||
    urlPath.toLowerCase().endsWith('.svg') ||
    trimmedHead.startsWith('<svg') ||
    (trimmedHead.startsWith('<?xml') && headText.includes('<svg'));

  if (isSvg) {
    const fullSvg = buf.toString('utf8');
    if (
      /<script\b/i.test(fullSvg) ||
      /\bon[a-z]+\s*=/i.test(fullSvg) ||
      /javascript:/i.test(fullSvg) ||
      /<foreignobject\b/i.test(fullSvg) ||
      /<iframe\b/i.test(fullSvg) ||
      /<object\b/i.test(fullSvg) ||
      /<embed\b/i.test(fullSvg)
    ) {
      return {
        valid: false,
        reason: 'SVG payload rejected because it contains active scripts or unsafe embedded elements.',
        detectedMime: 'image/svg+xml',
      };
    }
    return { valid: true, detectedMime: 'image/svg+xml' };
  }

  // PDF magic byte verification
  if (contentTypeHeader.includes('application/pdf') || urlPath.toLowerCase().endsWith('.pdf')) {
    const pdfMagic = buf.subarray(0, 5).toString('ascii');
    if (!pdfMagic.startsWith('%PDF-')) {
      return {
        valid: false,
        reason: 'Remote PDF rejected: missing %PDF- header signature.',
        detectedMime: 'application/octet-stream',
      };
    }
    return { valid: true, detectedMime: 'application/pdf' };
  }

  // JPEG: FF D8 FF
  if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return { valid: true, detectedMime: 'image/jpeg' };
  }
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf.length >= 8 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return { valid: true, detectedMime: 'image/png' };
  }
  // GIF: GIF8
  if (buf.length >= 4 && buf.subarray(0, 4).toString('ascii') === 'GIF8') {
    return { valid: true, detectedMime: 'image/gif' };
  }
  // RIFF / WEBP or AVI or WAV
  if (buf.length >= 12 && buf.subarray(0, 4).toString('ascii') === 'RIFF') {
    const sub = buf.subarray(8, 12).toString('ascii');
    if (sub === 'WEBP') return { valid: true, detectedMime: 'image/webp' };
    if (sub === 'WAVE') return { valid: true, detectedMime: 'audio/wav' };
    if (sub === 'AVI ') return { valid: true, detectedMime: 'video/avi' };
  }
  // MP4 / MOV / AVIF ftyp box
  if (buf.length >= 12 && buf.subarray(4, 8).toString('ascii') === 'ftyp') {
    const brand = buf.subarray(8, 12).toString('ascii').toLowerCase();
    if (brand === 'avif' || brand === 'avis') {
      return { valid: true, detectedMime: 'image/avif' };
    }
    return { valid: true, detectedMime: brand === 'qt  ' ? 'video/quicktime' : 'video/mp4' };
  }
  // WebM / MKV EBML header: 1A 45 DF A3
  if (buf.length >= 4 && buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    return { valid: true, detectedMime: 'video/webm' };
  }
  // OGG: OggS
  if (buf.length >= 4 && buf.subarray(0, 4).toString('ascii') === 'OggS') {
    return { valid: true, detectedMime: 'audio/ogg' };
  }
  // MP3: ID3 or frame sync
  if (
    (buf.length >= 3 && buf.subarray(0, 3).toString('ascii') === 'ID3') ||
    (buf.length >= 2 && buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0)
  ) {
    return { valid: true, detectedMime: 'audio/mpeg' };
  }
  // WebVTT subtitles
  if (trimmedHead.startsWith('webvtt')) {
    return { valid: true, detectedMime: 'text/vtt' };
  }

  return {
    valid: false,
    reason: `Unrecognized or unsupported binary file header (claimed ${contentTypeHeader || 'unknown'}).`,
    detectedMime: contentTypeHeader || 'application/octet-stream',
  };
}

export async function fetchRemoteMediaSafeBuffer(
  rawUrl: string,
  expectedMaxBytes = 50 * 1024 * 1024
): Promise<{
  buffer: Buffer;
  filename: string;
  mimeType: string;
  fileSize: number;
  finalUrl: string;
}> {
  let currentUrl = (await validateRemoteHttpsUrlForSsrf(rawUrl)).toString();
  let response: Response | null = null;

  for (let hop = 0; hop <= 3; hop++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);
    try {
      const res = await fetch(currentUrl, {
        method: 'GET',
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': 'MADECC-Media-Ingestor/1.0',
          Accept: 'image/*,video/*,audio/*,application/pdf,*/*;q=0.5',
        },
      });
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location');
        if (!loc) throw new Error('Redirect response without Location header.');
        const nextUrl = new URL(loc, currentUrl).toString();
        await validateRemoteHttpsUrlForSsrf(nextUrl);
        currentUrl = nextUrl;
        continue;
      }
      response = res;
      break;
    } finally {
      clearTimeout(timeout);
    }
  }

  if (!response) {
    throw new Error('Too many HTTP redirects while fetching remote media.');
  }
  if (!response.ok) {
    throw new Error(`Remote server returned HTTP ${response.status} (${response.statusText || 'Error'}).`);
  }

  const contentLength = Number(response.headers.get('content-length') || 0);
  if (contentLength > expectedMaxBytes) {
    throw new Error(`Remote asset exceeds maximum allowed ingestion size (${Math.round(expectedMaxBytes / (1024 * 1024))} MB).`);
  }

  const reader = response.body?.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;

  if (reader) {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        received += value.byteLength;
        if (received > expectedMaxBytes) {
          await reader.cancel().catch(() => {});
          throw new Error(`Remote asset stream exceeded ${Math.round(expectedMaxBytes / (1024 * 1024))} MB safety cap.`);
        }
        chunks.push(value);
      }
    }
  } else {
    const ab = await response.arrayBuffer();
    if (ab.byteLength > expectedMaxBytes) {
      throw new Error(`Remote asset exceeded ${Math.round(expectedMaxBytes / (1024 * 1024))} MB safety cap.`);
    }
    chunks.push(new Uint8Array(ab));
  }

  const buffer = Buffer.concat(chunks.map((c) => Buffer.from(c)));
  if (buffer.length === 0) {
    throw new Error('Remote URL returned an empty file (0 bytes).');
  }

  const contentTypeHeader = (response.headers.get('content-type') || '').toLowerCase().split(';')[0].trim();
  const parsedFinal = new URL(currentUrl);
  const magic = detectMimeFromMagicBytes(buffer, parsedFinal.pathname, contentTypeHeader);
  if (!magic.valid) {
    throw new Error(magic.reason || 'Remote payload failed binary/content safety validation.');
  }

  const rawBase = path.basename(parsedFinal.pathname) || `media-${Date.now()}`;
  const cleanName = rawBase.replace(/[^a-zA-Z0-9._-]/g, '_');

  return {
    buffer,
    filename: cleanName,
    mimeType: magic.detectedMime,
    fileSize: buffer.length,
    finalUrl: currentUrl,
  };
}

export async function uploadBufferToCloudStorage(
  buffer: Buffer,
  opts: {
    filename: string;
    mimeType: string;
    folder?: string;
    resourceType?: 'image' | 'video' | 'raw' | 'auto';
  }
): Promise<{
  fileUrl: string;
  storageProvider: 'cloudinary' | 'supabase';
  publicId: string;
}> {
  const safeFolder = sanitizeUploadFolder(opts.folder, 'madecc/cms_media');
  const isVideo = opts.mimeType.startsWith('video/');
  const isImage = opts.mimeType.startsWith('image/');
  const resourceType = opts.resourceType || (isVideo ? 'video' : isImage ? 'image' : 'auto');

  let cloudinaryErr: any = null;
  if (isCloudinaryConfigured()) {
    try {
      const { cloudinary } = await getCloudinary();
      const uploaded: any = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: safeFolder,
            resource_type: resourceType,
            use_filename: true,
            unique_filename: true,
          },
          (err: any, result: any) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
        stream.end(buffer);
      });
      if (uploaded && (uploaded.secure_url || uploaded.url)) {
        return {
          fileUrl: uploaded.secure_url || uploaded.url,
          storageProvider: 'cloudinary',
          publicId: uploaded.public_id || '',
        };
      }
    } catch (err) {
      cloudinaryErr = err;
      console.warn('[STORAGE_BUFFER_CLOUDINARY_WARN]', err);
    }
  }

  if (isSupabaseConfigured()) {
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const bucketName = process.env.SUPABASE_BUCKET || 'madecc-assets';
    const objectPath = `${safeFolder}/${Date.now()}-${opts.filename.replace(/[^a-zA-Z0-9._-]/g, '_')}`;
    const { error } = await supabase.storage
      .from(bucketName)
      .upload(objectPath, buffer, {
        contentType: opts.mimeType || 'application/octet-stream',
        cacheControl: '3600',
        upsert: true,
      });
    if (!error) {
      const { data } = supabase.storage.from(bucketName).getPublicUrl(objectPath);
      return {
        fileUrl: data.publicUrl,
        storageProvider: 'supabase',
        publicId: `${bucketName}/${objectPath}`,
      };
    }
    throw new Error(`Supabase fallback upload failed: ${error.message}`);
  }

  throw new Error(
    cloudinaryErr?.message || 'No cloud storage provider succeeded for remote ingestion.'
  );
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
      secure: true,
    });
  }

  return { cloudinary, cloudName, apiKey, apiSecret };
}

export async function deleteFileFromCloud(
  fileUrl: string | null | undefined,
  explicitPublicId?: string | null
) {
  if (!fileUrl && !explicitPublicId) return;

  // 1. Cloudinary asset clean-up
  if ((fileUrl && fileUrl.includes('cloudinary.com')) || (explicitPublicId && !fileUrl?.includes('supabase.co'))) {
    try {
      const { cloudinary, cloudName, apiKey, apiSecret } = await getCloudinary();
      if (cloudName && apiKey && apiSecret) {
        let publicId = explicitPublicId || '';
        let resourceType = 'image';

        if (fileUrl && fileUrl.includes('cloudinary.com')) {
          const urlObj = new URL(fileUrl);
          const parts = urlObj.pathname.split('/');
          resourceType = parts[2] || 'image';
          if (!publicId) {
            const uploadIndex = parts.indexOf('upload');
            if (uploadIndex !== -1 && uploadIndex + 1 < parts.length) {
              let remainingParts = parts.slice(uploadIndex + 1);
              if (remainingParts[0] && remainingParts[0].startsWith('v') && /^\d+$/.test(remainingParts[0].substring(1))) {
                remainingParts = remainingParts.slice(1);
              }
              const fileWithExt = remainingParts.join('/');
              const lastDotIndex = fileWithExt.lastIndexOf('.');
              publicId = lastDotIndex !== -1 ? fileWithExt.substring(0, lastDotIndex) : fileWithExt;
            }
          }
        }

        if (publicId) {
          const result = await cloudinary.uploader.destroy(publicId, {
            resource_type: resourceType === 'raw' ? 'raw' : resourceType === 'video' ? 'video' : 'image',
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
  else if (fileUrl && fileUrl.includes('supabase.co') && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
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
            console.error('[STORAGE_DELETE_ERROR] Failed to delete from Supabase storage:', error);
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
  else if (fileUrl && fileUrl.startsWith('/uploads/')) {
    try {
      const filename = path.basename(fileUrl);
      const candidates = [
        path.join(process.cwd(), fileUrl),
        path.join(os.tmpdir(), 'madecc_uploads', filename),
        path.join(os.tmpdir(), filename),
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

export function getWritableUploadDir(): string {
  const localDir = path.join(process.cwd(), 'uploads');
  try {
    if (!fs.existsSync(localDir)) {
      fs.mkdirSync(localDir, { recursive: true });
    }
    const testFile = path.join(localDir, `.write_test_${Date.now()}`);
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    return localDir;
  } catch {
    const tmpDir = path.join(os.tmpdir(), 'madecc_uploads');
    try {
      if (!fs.existsSync(tmpDir)) {
        fs.mkdirSync(tmpDir, { recursive: true });
      }
      return tmpDir;
    } catch {
      return os.tmpdir();
    }
  }
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const targetDir = getWritableUploadDir();
    cb(null, targetDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});

export const upload = multer({
  storage,
  limits: {
    fileSize: TARGET_MAX_UPLOAD_BYTES, // 10 GB ceiling on local Node runtime (direct cloud TUS/chunked bypasses serverless 6 MB limit)
  },
});
