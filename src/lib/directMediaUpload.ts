import { getCsrfHeaders } from './csrf.ts';

export interface UploadCapabilities {
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
    limitSource: string;
    probeStatus: string;
    probeError?: string;
  };
  limitations: string[];
  recommendations: string[];
}

export interface DirectUploadResult {
  url: string;
  storageProvider: 'cloudinary' | 'supabase' | 'local';
  publicId?: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  resourceType?: string;
  dimensions?: string;
  durationSeconds?: number;
  fileFingerprint?: string;
  verified?: boolean;
  reusedDuplicate?: boolean;
}

export interface DirectUploadProgress {
  loadedBytes: number;
  totalBytes: number;
  percent: number;
  speedBytesPerSec: number;
  etaSeconds: number | null;
  stage: 'signing' | 'uploading' | 'chunking' | 'paused' | 'verifying' | 'fallback' | 'ingesting' | 'complete';
  label: string;
  provider?: 'cloudinary' | 'supabase' | 'proxy';
  chunkIndex?: number;
  totalChunks?: number;
  canResume?: boolean;
}

export interface DuplicateAssetInfo {
  id: number;
  title: string;
  fileUrl: string;
  filename: string;
  fileSize: number;
}

export interface UploadMediaAssetDirectOptions {
  file: File;
  folder?: string;
  fileType?: string;
  preferredProvider?: 'auto' | 'cloudinary' | 'supabase';
  authToken?: string | null;
  csrfHeaders?: Record<string, string>;
  useCmsEndpoint?: boolean;
  onProgress?: (progress: DirectUploadProgress) => void;
  onDuplicateFound?: (dup: DuplicateAssetInfo) => Promise<'reuse' | 'upload_anyway' | 'cancel'>;
  shouldPause?: () => boolean;
  waitWhilePaused?: () => Promise<'resume' | 'abort'>;
  signal?: AbortSignal;
}

const DEFAULT_CHUNK_SIZE = 6 * 1024 * 1024; // 6 MB chunk size (Cloudinary & Supabase TUS standard)
const DEFAULT_CHUNK_THRESHOLD = 20 * 1024 * 1024; // 20 MB
const DEFAULT_PROXY_MAX_BYTES = Math.floor(4.2 * 1024 * 1024); // Safe margin under Netlify 6 MB Lambda body limit

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const idx = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(1024)));
  const val = bytes / Math.pow(1024, idx);
  return `${val >= 100 || idx === 0 ? val.toFixed(0) : val >= 10 ? val.toFixed(1) : val.toFixed(2)} ${units[idx]}`;
}

export function formatEta(seconds: number | null | undefined): string {
  if (seconds === null || seconds === undefined || !Number.isFinite(seconds) || seconds < 0) {
    return '—';
  }
  if (seconds < 1) return '< 1s';
  const totalSec = Math.round(seconds);
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hrs > 0) return `${hrs}h ${String(mins).padStart(2, '0')}m`;
  if (mins > 0) return `${mins}m ${String(secs).padStart(2, '0')}s`;
  return `${secs}s`;
}

export function formatSpeed(bytesPerSec: number): string {
  if (!Number.isFinite(bytesPerSec) || bytesPerSec <= 0) return '0 MB/s';
  if (bytesPerSec >= 1024 * 1024) return `${(bytesPerSec / (1024 * 1024)).toFixed(1)} MB/s`;
  return `${(bytesPerSec / 1024).toFixed(0)} KB/s`;
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException('Upload cancelled by user.', 'AbortError');
  }
}

export async function computeQuickFileFingerprint(file: File): Promise<string> {
  const headSlice = file.slice(0, Math.min(file.size, 64 * 1024));
  const tailStart = Math.max(0, file.size - 64 * 1024);
  const tailSlice = file.slice(tailStart, file.size);
  const metaString = `${file.name}|${file.size}|${file.lastModified}|${file.type || ''}`;

  try {
    if (typeof crypto !== 'undefined' && crypto.subtle) {
      const [headBuf, tailBuf] = await Promise.all([headSlice.arrayBuffer(), tailSlice.arrayBuffer()]);
      const metaBytes = new TextEncoder().encode(metaString);
      const combined = new Uint8Array(metaBytes.byteLength + headBuf.byteLength + tailBuf.byteLength);
      combined.set(metaBytes, 0);
      combined.set(new Uint8Array(headBuf), metaBytes.byteLength);
      combined.set(new Uint8Array(tailBuf), metaBytes.byteLength + headBuf.byteLength);
      const digest = await crypto.subtle.digest('SHA-256', combined);
      return Array.from(new Uint8Array(digest))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('')
        .slice(0, 32);
    }
  } catch {
    // Fallback if subtle crypto is unavailable in non-HTTPS contexts
  }

  let hash = 2166136261;
  for (let i = 0; i < metaString.length; i++) {
    hash ^= metaString.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return `fp_${(hash >>> 0).toString(16)}_${file.size}`;
}

export async function fetchUploadCapabilities(opts?: {
  authToken?: string | null;
  isCms?: boolean;
  refresh?: boolean;
}): Promise<UploadCapabilities | null> {
  try {
    const headers: Record<string, string> = {};
    if (opts?.authToken) headers['Authorization'] = `Bearer ${opts.authToken}`;
    const endpoint = opts?.isCms
      ? `/api/cms/media/upload-capabilities${opts?.refresh ? '?refresh=true' : ''}`
      : `/api/upload/capabilities${opts?.refresh ? '?refresh=true' : ''}`;
    const res = await fetch(endpoint, { headers, credentials: 'include' });
    if (!res.ok) return null;
    const data = await res.json().catch(() => null);
    return data?.capabilities || null;
  } catch {
    return null;
  }
}

class SpeedTracker {
  private samples: Array<{ t: number; bytes: number }> = [];
  private lastEmit = 0;

  record(loadedBytes: number): { speedBytesPerSec: number; etaSeconds: number | null; totalBytes?: number } {
    const now = performance.now();
    this.samples.push({ t: now, bytes: loadedBytes });
    const cutoff = now - 4000;
    while (this.samples.length > 2 && this.samples[0].t < cutoff) {
      this.samples.shift();
    }
    if (this.samples.length < 2) {
      return { speedBytesPerSec: 0, etaSeconds: null };
    }
    const first = this.samples[0];
    const last = this.samples[this.samples.length - 1];
    const dtSec = Math.max(0.05, (last.t - first.t) / 1000);
    const deltaBytes = Math.max(0, last.bytes - first.bytes);
    return {
      speedBytesPerSec: deltaBytes / dtSec,
      etaSeconds: null,
    };
  }

  computeEta(loadedBytes: number, totalBytes: number): { speedBytesPerSec: number; etaSeconds: number | null } {
    const { speedBytesPerSec } = this.record(loadedBytes);
    const remaining = Math.max(0, totalBytes - loadedBytes);
    const etaSeconds = speedBytesPerSec > 1024 ? remaining / speedBytesPerSec : null;
    return { speedBytesPerSec, etaSeconds };
  }

  shouldThrottle(minMs = 120): boolean {
    const now = performance.now();
    if (now - this.lastEmit < minMs) return true;
    this.lastEmit = now;
    return false;
  }
}

function sendXhr(opts: {
  method?: 'POST' | 'PATCH' | 'PUT';
  url: string;
  body: FormData | Blob;
  headers?: Record<string, string>;
  withCredentials?: boolean;
  onProgress?: (loaded: number, total: number) => void;
  signal?: AbortSignal;
}): Promise<{ status: number; responseText: string; headers: Record<string, string> }> {
  return new Promise((resolve, reject) => {
    throwIfAborted(opts.signal);

    const xhr = new XMLHttpRequest();
    xhr.open(opts.method || 'POST', opts.url, true);
    if (opts.withCredentials) {
      xhr.withCredentials = true;
    }
    if (opts.headers) {
      for (const [key, val] of Object.entries(opts.headers)) {
        if (val !== undefined && val !== '') xhr.setRequestHeader(key, val);
      }
    }

    const handleAbort = () => {
      try {
        xhr.abort();
      } catch {}
      reject(new DOMException('Upload cancelled by user.', 'AbortError'));
    };

    if (opts.signal) {
      opts.signal.addEventListener('abort', handleAbort, { once: true });
    }

    xhr.upload.onprogress = (ev) => {
      if (ev.lengthComputable && opts.onProgress) {
        opts.onProgress(ev.loaded, ev.total);
      }
    };

    xhr.onload = () => {
      if (opts.signal) opts.signal.removeEventListener('abort', handleAbort);
      const rawHeaders = xhr.getAllResponseHeaders() || '';
      const headerMap: Record<string, string> = {};
      rawHeaders.split(/\r?\n/).forEach((line) => {
        const idx = line.indexOf(':');
        if (idx > 0) {
          headerMap[line.slice(0, idx).trim().toLowerCase()] = line.slice(idx + 1).trim();
        }
      });
      resolve({ status: xhr.status, responseText: xhr.responseText || '', headers: headerMap });
    };

    xhr.onerror = () => {
      if (opts.signal) opts.signal.removeEventListener('abort', handleAbort);
      reject(new Error('Network connection interrupted during upload'));
    };

    xhr.onabort = () => {
      if (opts.signal) opts.signal.removeEventListener('abort', handleAbort);
      reject(new DOMException('Upload cancelled by user.', 'AbortError'));
    };

    xhr.send(opts.body);
  });
}

function toBase64Utf8(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let bin = '';
  for (let i = 0; i < bytes.length; i++) {
    bin += String.fromCharCode(bytes[i]);
  }
  return btoa(bin);
}

async function handlePauseCheckpoint(
  opts: UploadMediaAssetDirectOptions,
  loadedBytes: number,
  totalBytes: number,
  provider: 'cloudinary' | 'supabase',
  canResume: boolean
) {
  if (opts.shouldPause && opts.shouldPause() && opts.waitWhilePaused) {
    const pct = Math.min(99, Math.round((loadedBytes / Math.max(1, totalBytes)) * 100));
    opts.onProgress?.({
      loadedBytes,
      totalBytes,
      percent: pct,
      speedBytesPerSec: 0,
      etaSeconds: null,
      stage: 'paused',
      provider,
      canResume,
      label: `Paused at ${pct}% (${formatBytes(loadedBytes)} / ${formatBytes(totalBytes)})`,
    });
    const action = await opts.waitWhilePaused();
    if (action === 'abort') {
      throw new DOMException('Upload cancelled by user.', 'AbortError');
    }
  }
}

async function verifyUploadOnServer(opts: {
  ticket: any;
  provider: 'cloudinary' | 'supabase';
  publicId?: string;
  resourceType?: string;
  fileUrl?: string;
  authToken?: string | null;
  csrfHeaders?: Record<string, string>;
  signal?: AbortSignal;
}) {
  const endpoint = opts.ticket?.verifyEndpoint;
  if (!endpoint) return null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.csrfHeaders || {}),
  };
  if (opts.authToken) headers['Authorization'] = `Bearer ${opts.authToken}`;

  const res = await fetch(endpoint, {
    method: 'POST',
    headers,
    credentials: 'include',
    signal: opts.signal,
    body: JSON.stringify({
      uploadSessionToken: opts.ticket.uploadSessionToken,
      provider: opts.provider,
      publicId: opts.publicId,
      resourceType: opts.resourceType || opts.ticket.resourceType,
      bucketName: opts.ticket.bucketName,
      objectPath: opts.ticket.objectPath,
      fileUrl: opts.fileUrl || opts.ticket.publicUrl,
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.verified) {
    throw new Error(data?.error || `Server upload completion verification failed (HTTP ${res.status})`);
  }
  return data;
}

async function uploadSingleDirectToCloudinary(
  file: File,
  ticket: any,
  opts: UploadMediaAssetDirectOptions
): Promise<DirectUploadResult> {
  const uploadUrl =
    ticket.uploadUrl || `https://api.cloudinary.com/v1_1/${ticket.cloudName}/${ticket.resourceType || 'auto'}/upload`;
  const speed = new SpeedTracker();

  let lastErr: any = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    throwIfAborted(opts.signal);
    const fd = new FormData();
    fd.append('file', file);
    fd.append('api_key', ticket.apiKey);
    fd.append('timestamp', String(ticket.timestamp));
    fd.append('signature', ticket.signature);
    if (ticket.folder) fd.append('folder', ticket.folder);

    try {
      const res = await sendXhr({
        url: uploadUrl,
        body: fd,
        signal: opts.signal,
        onProgress: (loaded, total) => {
          const { speedBytesPerSec, etaSeconds } = speed.computeEta(loaded, total);
          if (speed.shouldThrottle() && loaded < total) return;
          const pct = Math.min(96, Math.round((loaded / Math.max(1, total)) * 96));
          opts.onProgress?.({
            loadedBytes: loaded,
            totalBytes: total,
            percent: pct,
            speedBytesPerSec,
            etaSeconds,
            stage: 'uploading',
            provider: 'cloudinary',
            canResume: false,
            label: `Direct upload: ${pct}% · ${formatSpeed(speedBytesPerSec)} · ETA ${formatEta(etaSeconds)}`,
          });
        },
      });

      if (res.status >= 200 && res.status < 300) {
        const parsed = JSON.parse(res.responseText);
        const url = parsed.secure_url || parsed.url;
        if (!url) throw new Error('Cloudinary did not return an asset URL');

        opts.onProgress?.({
          loadedBytes: file.size,
          totalBytes: file.size,
          percent: 98,
          speedBytesPerSec: 0,
          etaSeconds: 0,
          stage: 'verifying',
          provider: 'cloudinary',
          label: 'Verifying uploaded file on server...',
        });

        let verifiedData: any = null;
        if (ticket.uploadSessionToken) {
          verifiedData = await verifyUploadOnServer({
            ticket,
            provider: 'cloudinary',
            publicId: parsed.public_id,
            resourceType: parsed.resource_type,
            fileUrl: url,
            authToken: opts.authToken,
            csrfHeaders: opts.csrfHeaders,
            signal: opts.signal,
          }).catch(() => null);
        }

        opts.onProgress?.({
          loadedBytes: file.size,
          totalBytes: file.size,
          percent: 100,
          speedBytesPerSec: 0,
          etaSeconds: 0,
          stage: 'complete',
          provider: 'cloudinary',
          label: 'Upload verified & complete',
        });

        return {
          url: verifiedData?.fileUrl || url,
          storageProvider: 'cloudinary',
          publicId: verifiedData?.publicId || parsed.public_id || '',
          filename: file.name,
          mimeType: file.type || verifiedData?.mimeType || 'application/octet-stream',
          fileSize: verifiedData?.fileSize || file.size,
          resourceType: parsed.resource_type,
          dimensions:
            verifiedData?.dimensions ||
            (parsed.width && parsed.height ? `${parsed.width}x${parsed.height}` : undefined),
          durationSeconds:
            verifiedData?.durationSeconds ??
            (typeof parsed.duration === 'number' ? Math.round(parsed.duration) : undefined),
          verified: Boolean(verifiedData?.verified),
        };
      }

      const parsedErr = (() => {
        try {
          return JSON.parse(res.responseText)?.error?.message;
        } catch {
          return '';
        }
      })();
      if (res.status >= 500 && attempt === 0) {
        lastErr = new Error(parsedErr || `Cloudinary HTTP ${res.status}`);
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
      throw new Error(parsedErr || `Direct cloud upload rejected (HTTP ${res.status})`);
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err;
      lastErr = err;
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 500));
        continue;
      }
    }
  }

  throw lastErr || new Error('Direct Cloudinary upload failed');
}

async function uploadChunkedDirectToCloudinary(
  file: File,
  ticket: any,
  opts: UploadMediaAssetDirectOptions,
  fingerprint: string
): Promise<DirectUploadResult> {
  const uploadUrl =
    ticket.uploadUrl || `https://api.cloudinary.com/v1_1/${ticket.cloudName}/${ticket.resourceType || 'video'}/upload`;
  const chunkSize = Number(ticket.chunkSizeBytes) || DEFAULT_CHUNK_SIZE;
  const totalBytes = file.size;
  const totalChunks = Math.ceil(totalBytes / chunkSize);
  const uniqueUploadId = `madecc-${fingerprint.slice(0, 12)}-${Date.now()}`;
  const speed = new SpeedTracker();

  let finalParsed: any = null;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    throwIfAborted(opts.signal);
    await handlePauseCheckpoint(opts, chunkIndex * chunkSize, totalBytes, 'cloudinary', true);

    const start = chunkIndex * chunkSize;
    const end = Math.min(totalBytes, start + chunkSize);
    const chunkBlob = file.slice(start, end);
    const contentRange = `bytes ${start}-${end - 1}/${totalBytes}`;

    let chunkUploaded = false;
    let lastChunkErr: any = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      throwIfAborted(opts.signal);
      const fd = new FormData();
      fd.append('file', chunkBlob, file.name);
      fd.append('api_key', ticket.apiKey);
      fd.append('timestamp', String(ticket.timestamp));
      fd.append('signature', ticket.signature);
      if (ticket.folder) fd.append('folder', ticket.folder);

      try {
        const res = await sendXhr({
          url: uploadUrl,
          body: fd,
          headers: {
            'X-Unique-Upload-Id': uniqueUploadId,
            'Content-Range': contentRange,
          },
          signal: opts.signal,
          onProgress: (chunkLoaded) => {
            const overallLoaded = Math.min(totalBytes, start + chunkLoaded);
            const { speedBytesPerSec, etaSeconds } = speed.computeEta(overallLoaded, totalBytes);
            if (speed.shouldThrottle() && overallLoaded < totalBytes) return;
            const pct = Math.min(96, Math.round((overallLoaded / Math.max(1, totalBytes)) * 96));
            opts.onProgress?.({
              loadedBytes: overallLoaded,
              totalBytes,
              percent: pct,
              speedBytesPerSec,
              etaSeconds,
              stage: 'chunking',
              provider: 'cloudinary',
              canResume: true,
              chunkIndex: chunkIndex + 1,
              totalChunks,
              label: `Chunk ${chunkIndex + 1}/${totalChunks}: ${pct}% · ${formatSpeed(speedBytesPerSec)} · ETA ${formatEta(etaSeconds)}`,
            });
          },
        });

        if (res.status >= 200 && res.status < 300) {
          if (res.responseText) {
            try {
              const maybeJson = JSON.parse(res.responseText);
              if (maybeJson?.secure_url || maybeJson?.url) {
                finalParsed = maybeJson;
              }
            } catch {}
          }
          chunkUploaded = true;
          break;
        }

        const msg = (() => {
          try {
            return JSON.parse(res.responseText)?.error?.message;
          } catch {
            return '';
          }
        })();
        lastChunkErr = new Error(msg || `Chunk ${chunkIndex + 1} failed with HTTP ${res.status}`);
        if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) {
          throw lastChunkErr;
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') throw err;
        lastChunkErr = err;
      }

      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 600 * Math.pow(2, attempt)));
      }
    }

    if (!chunkUploaded) {
      throw lastChunkErr || new Error(`Failed uploading chunk ${chunkIndex + 1}/${totalChunks}`);
    }
  }

  const finalUrl = finalParsed?.secure_url || finalParsed?.url;
  if (!finalUrl) {
    throw new Error('Chunked upload finished without returning a cloud asset URL.');
  }

  opts.onProgress?.({
    loadedBytes: totalBytes,
    totalBytes,
    percent: 98,
    speedBytesPerSec: 0,
    etaSeconds: 0,
    stage: 'verifying',
    provider: 'cloudinary',
    chunkIndex: totalChunks,
    totalChunks,
    label: 'Verifying chunked upload integrity on server...',
  });

  let verifiedData: any = null;
  if (ticket.uploadSessionToken) {
    verifiedData = await verifyUploadOnServer({
      ticket,
      provider: 'cloudinary',
      publicId: finalParsed.public_id,
      resourceType: finalParsed.resource_type,
      fileUrl: finalUrl,
      authToken: opts.authToken,
      csrfHeaders: opts.csrfHeaders,
      signal: opts.signal,
    }).catch(() => null);
  }

  opts.onProgress?.({
    loadedBytes: totalBytes,
    totalBytes,
    percent: 100,
    speedBytesPerSec: 0,
    etaSeconds: 0,
    stage: 'complete',
    provider: 'cloudinary',
    chunkIndex: totalChunks,
    totalChunks,
    label: 'Chunked upload verified & complete',
  });

  return {
    url: verifiedData?.fileUrl || finalUrl,
    storageProvider: 'cloudinary',
    publicId: verifiedData?.publicId || finalParsed.public_id || '',
    filename: file.name,
    mimeType: file.type || verifiedData?.mimeType || 'application/octet-stream',
    fileSize: verifiedData?.fileSize || file.size,
    resourceType: finalParsed.resource_type,
    dimensions: verifiedData?.dimensions,
    durationSeconds: verifiedData?.durationSeconds,
    verified: Boolean(verifiedData?.verified),
  };
}

// Resumable TUS 1.0.0 Upload Client for Supabase Storage (supports up to 10 GB / 50 GB Pro+)
async function uploadResumableToSupabaseTus(
  file: File,
  ticket: any,
  opts: UploadMediaAssetDirectOptions,
  fingerprint: string
): Promise<DirectUploadResult> {
  const chunkSize = Number(ticket.chunkSizeBytes) || DEFAULT_CHUNK_SIZE;
  const totalBytes = file.size;
  const totalChunks = Math.max(1, Math.ceil(totalBytes / chunkSize));
  const storageKey = `madecc_tus_${fingerprint}`;
  const tusAuthHeaders: Record<string, string> = {
    'Tus-Resumable': '1.0.0',
    'x-signature': ticket.signedToken,
  };

  let uploadLocation = '';
  let offset = 0;

  // 1. Check if a previous interrupted session for this exact file fingerprint exists and is still resumable via HEAD
  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.uploadLocation && parsed?.signedToken) {
        const headRes = await fetch(parsed.uploadLocation, {
          method: 'HEAD',
          headers: {
            'Tus-Resumable': '1.0.0',
            'x-signature': parsed.signedToken,
          },
          signal: opts.signal,
        });
        if (headRes.ok) {
          const remoteOffset = Number(headRes.headers.get('Upload-Offset') || 0);
          if (Number.isFinite(remoteOffset) && remoteOffset >= 0 && remoteOffset <= totalBytes) {
            uploadLocation = parsed.uploadLocation;
            tusAuthHeaders['x-signature'] = parsed.signedToken;
            offset = remoteOffset;
          }
        } else {
          localStorage.removeItem(storageKey);
        }
      }
    }
  } catch {
    // Start fresh TUS upload if resume probe fails
  }

  // 2. Create new TUS resource if not resumed
  if (!uploadLocation) {
    const metadataEntries = [
      `bucketName ${toBase64Utf8(ticket.bucketName)}`,
      `objectName ${toBase64Utf8(ticket.objectPath)}`,
      `contentType ${toBase64Utf8(file.type || 'application/octet-stream')}`,
      `cacheControl ${toBase64Utf8('3600')}`,
    ].join(',');

    const endpoints = [ticket.tusEndpoint, ticket.fallbackTusEndpoint].filter(Boolean);
    let createErr: any = null;

    for (const ep of endpoints) {
      throwIfAborted(opts.signal);
      try {
        const createRes = await fetch(ep, {
          method: 'POST',
          headers: {
            ...tusAuthHeaders,
            'Upload-Length': String(totalBytes),
            'Upload-Metadata': metadataEntries,
          },
          signal: opts.signal,
        });

        if (createRes.status === 201 || createRes.ok) {
          const loc = createRes.headers.get('Location');
          if (!loc) throw new Error('TUS server did not return a Location URL');
          uploadLocation = loc.startsWith('http') ? loc : new URL(loc, ep).toString();
          try {
            localStorage.setItem(
              storageKey,
              JSON.stringify({ uploadLocation, signedToken: ticket.signedToken, createdAt: Date.now() })
            );
          } catch {}
          break;
        } else {
          const errText = await createRes.text().catch(() => '');
          createErr = new Error(errText || `TUS creation rejected (HTTP ${createRes.status})`);
          if (createRes.status === 413) throw createErr;
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') throw err;
        createErr = err;
        if (/413|too large/i.test(String(err?.message || ''))) throw err;
      }
    }

    if (!uploadLocation) {
      throw createErr || new Error('Failed to initialize Supabase TUS resumable upload session.');
    }
  }

  // 3. Stream 6 MB chunks sequentially using PATCH + Upload-Offset
  const speed = new SpeedTracker();
  while (offset < totalBytes) {
    throwIfAborted(opts.signal);
    await handlePauseCheckpoint(opts, offset, totalBytes, 'supabase', true);

    const chunkEnd = Math.min(totalBytes, offset + chunkSize);
    const chunkBlob = file.slice(offset, chunkEnd);
    const chunkIdx = Math.floor(offset / chunkSize) + 1;

    let chunkPatched = false;
    let lastErr: any = null;

    for (let attempt = 0; attempt < 4; attempt++) {
      throwIfAborted(opts.signal);
      try {
        const res = await sendXhr({
          method: 'PATCH',
          url: uploadLocation,
          body: chunkBlob,
          headers: {
            ...tusAuthHeaders,
            'Upload-Offset': String(offset),
            'Content-Type': 'application/offset+octet-stream',
          },
          signal: opts.signal,
          onProgress: (chunkLoaded) => {
            const totalLoaded = Math.min(totalBytes, offset + chunkLoaded);
            const { speedBytesPerSec, etaSeconds } = speed.computeEta(totalLoaded, totalBytes);
            if (speed.shouldThrottle() && totalLoaded < totalBytes) return;
            const pct = Math.min(96, Math.round((totalLoaded / Math.max(1, totalBytes)) * 96));
            opts.onProgress?.({
              loadedBytes: totalLoaded,
              totalBytes,
              percent: pct,
              speedBytesPerSec,
              etaSeconds,
              stage: 'chunking',
              provider: 'supabase',
              canResume: true,
              chunkIndex: chunkIdx,
              totalChunks,
              label: `TUS Chunk ${chunkIdx}/${totalChunks}: ${pct}% · ${formatSpeed(speedBytesPerSec)} · ETA ${formatEta(etaSeconds)}`,
            });
          },
        });

        if (res.status === 204 || (res.status >= 200 && res.status < 300)) {
          const nextOffsetHeader = res.headers['upload-offset'];
          offset = nextOffsetHeader !== undefined ? Number(nextOffsetHeader) : chunkEnd;
          chunkPatched = true;
          break;
        }

        if (res.status === 409) {
          // Offset mismatch -> probe HEAD to resynchronize offset cleanly
          const headRes = await fetch(uploadLocation, {
            method: 'HEAD',
            headers: tusAuthHeaders,
            signal: opts.signal,
          });
          if (headRes.ok) {
            offset = Number(headRes.headers.get('Upload-Offset') || offset);
            continue;
          }
        }

        lastErr = new Error(res.responseText || `TUS PATCH failed (HTTP ${res.status})`);
        if (res.status === 413 || (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429)) {
          throw lastErr;
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') throw err;
        lastErr = err;
      }

      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 800 * Math.pow(2, attempt)));
      }
    }

    if (!chunkPatched) {
      throw lastErr || new Error(`Failed uploading TUS chunk ${chunkIdx}/${totalChunks}`);
    }
  }

  try {
    localStorage.removeItem(storageKey);
  } catch {}

  opts.onProgress?.({
    loadedBytes: totalBytes,
    totalBytes,
    percent: 98,
    speedBytesPerSec: 0,
    etaSeconds: 0,
    stage: 'verifying',
    provider: 'supabase',
    chunkIndex: totalChunks,
    totalChunks,
    label: 'Verifying completed TUS upload on server...',
  });

  const verifiedData = await verifyUploadOnServer({
    ticket,
    provider: 'supabase',
    fileUrl: ticket.publicUrl,
    authToken: opts.authToken,
    csrfHeaders: opts.csrfHeaders,
    signal: opts.signal,
  });

  opts.onProgress?.({
    loadedBytes: totalBytes,
    totalBytes,
    percent: 100,
    speedBytesPerSec: 0,
    etaSeconds: 0,
    stage: 'complete',
    provider: 'supabase',
    chunkIndex: totalChunks,
    totalChunks,
    label: 'TUS resumable upload verified & complete',
  });

  return {
    url: verifiedData.fileUrl || ticket.publicUrl,
    storageProvider: 'supabase',
    publicId: verifiedData.publicId || `${ticket.bucketName}/${ticket.objectPath}`,
    filename: file.name,
    mimeType: file.type || verifiedData.mimeType || 'application/octet-stream',
    fileSize: verifiedData.fileSize || file.size,
    verified: true,
  };
}

export async function uploadMediaAssetDirect(
  options: UploadMediaAssetDirectOptions
): Promise<DirectUploadResult> {
  const {
    file,
    folder = 'madecc/cms_media',
    fileType,
    preferredProvider = 'auto',
    authToken,
    csrfHeaders: providedCsrfHeaders,
    useCmsEndpoint = true,
    onProgress,
    onDuplicateFound,
    signal,
  } = options;

  throwIfAborted(signal);
  const csrfHeaders = providedCsrfHeaders || (await getCsrfHeaders().catch(() => ({})));
  const fingerprint = await computeQuickFileFingerprint(file);

  onProgress?.({
    loadedBytes: 0,
    totalBytes: file.size,
    percent: 3,
    speedBytesPerSec: 0,
    etaSeconds: null,
    stage: 'signing',
    label: `Inspecting provider capacity & signing ticket (${formatBytes(file.size)})...`,
  });

  let ticket: any = null;
  let signatureErrorMsg = '';

  try {
    const reqHeaders: Record<string, string> = { ...csrfHeaders };
    if (authToken) reqHeaders['Authorization'] = `Bearer ${authToken}`;

    if (useCmsEndpoint) {
      reqHeaders['Content-Type'] = 'application/json';
      const sigRes = await fetch('/api/cms/media/upload-signature', {
        method: 'POST',
        headers: reqHeaders,
        credentials: 'include',
        signal,
        body: JSON.stringify({
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          fileSize: file.size,
          fileType,
          preferredProvider,
          fileFingerprint: fingerprint,
          folder,
        }),
      });
      const sigData = await sigRes.json().catch(() => ({}));
      if (!sigRes.ok) {
        if ((sigRes.status === 400 || sigRes.status === 413 || sigRes.status === 429) && sigData?.error) {
          throw new Error(sigData.error);
        }
        signatureErrorMsg = sigData?.error || `Signature error (${sigRes.status})`;
      } else {
        ticket = sigData;
      }
    } else {
      const qs = new URLSearchParams({
        folder,
        filename: file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSize: String(file.size),
        fileFingerprint: fingerprint,
        preferredProvider,
      });
      if (fileType) qs.set('fileType', fileType);

      const sigRes = await fetch(`/api/cloudinary-signature?${qs.toString()}`, {
        headers: reqHeaders,
        credentials: 'include',
        signal,
      });
      const sigData = await sigRes.json().catch(() => ({}));
      if (!sigRes.ok) {
        if ((sigRes.status === 400 || sigRes.status === 413 || sigRes.status === 429) && sigData?.error) {
          throw new Error(sigData.error);
        }
        signatureErrorMsg = sigData?.error || `Signature error (${sigRes.status})`;
      } else {
        ticket = sigData;
      }
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err;
    if (
      err?.message &&
      /exceeds|unsupported|blocked|extension|mime|too many|limit|configured/i.test(err.message)
    ) {
      throw err;
    }
    signatureErrorMsg = err?.message || 'Could not obtain signed upload ticket';
  }

  // Optional duplicate asset reuse check
  if (ticket?.duplicateDetected && ticket?.duplicateAsset && onDuplicateFound) {
    const decision = await onDuplicateFound(ticket.duplicateAsset);
    if (decision === 'cancel') {
      throw new DOMException('Upload cancelled after duplicate check.', 'AbortError');
    }
    if (decision === 'reuse') {
      onProgress?.({
        loadedBytes: file.size,
        totalBytes: file.size,
        percent: 100,
        speedBytesPerSec: 0,
        etaSeconds: 0,
        stage: 'complete',
        label: 'Reused existing verified asset',
      });
      return {
        url: ticket.duplicateAsset.fileUrl,
        storageProvider: 'cloudinary',
        filename: ticket.duplicateAsset.filename || file.name,
        mimeType: file.type || 'application/octet-stream',
        fileSize: ticket.duplicateAsset.fileSize || file.size,
        fileFingerprint: fingerprint,
        reusedDuplicate: true,
        verified: true,
      };
    }
  }

  const chunkThreshold = Number(ticket?.chunkThresholdBytes) || DEFAULT_CHUNK_THRESHOLD;
  const proxyMaxBytes = Number(ticket?.proxyFallbackMaxBytes) || DEFAULT_PROXY_MAX_BYTES;
  const enrichedOpts: UploadMediaAssetDirectOptions = { ...options, csrfHeaders };

  if (ticket?.provider === 'supabase' && ticket?.signedToken && ticket?.tusEndpoint) {
    const res = await uploadResumableToSupabaseTus(file, ticket, enrichedOpts, fingerprint);
    return { ...res, fileFingerprint: fingerprint };
  }

  if (ticket?.signature && ticket?.cloudName && ticket?.apiKey) {
    try {
      const res =
        file.size > chunkThreshold
          ? await uploadChunkedDirectToCloudinary(file, ticket, enrichedOpts, fingerprint)
          : await uploadSingleDirectToCloudinary(file, ticket, enrichedOpts);
      return { ...res, fileFingerprint: fingerprint };
    } catch (directErr: any) {
      if (directErr?.name === 'AbortError') throw directErr;
      if (file.size > proxyMaxBytes) {
        throw new Error(
          `Direct upload failed for ${formatBytes(file.size)} file (${directErr.message}). Files above ${(proxyMaxBytes / (1024 * 1024)).toFixed(1)} MB require direct cloud upload to avoid HTTP 413.`
        );
      }
      console.warn('[DIRECT_UPLOAD_PROXY_FALLBACK]', directErr);
    }
  } else if (file.size > proxyMaxBytes) {
    throw new Error(
      signatureErrorMsg ||
        `Unable to initialize direct upload for ${formatBytes(file.size)} file (serverless proxy limit is 4.2 MB to prevent HTTP 413).`
    );
  }

  // Small-file safe proxy fallback (<= 4.2 MB -> Cloudinary / Supabase)
  throwIfAborted(signal);
  const speed = new SpeedTracker();
  onProgress?.({
    loadedBytes: 0,
    totalBytes: file.size,
    percent: 15,
    speedBytesPerSec: 0,
    etaSeconds: null,
    stage: 'fallback',
    provider: 'proxy',
    label: 'Uploading small asset via server storage fallback...',
  });

  const fd = new FormData();
  fd.append('file', file);
  fd.append('folder', folder);
  const proxyHeaders: Record<string, string> = { ...csrfHeaders };
  if (authToken) proxyHeaders['Authorization'] = `Bearer ${authToken}`;

  const proxyRes = await sendXhr({
    url: '/api/upload',
    body: fd,
    headers: proxyHeaders,
    withCredentials: true,
    signal,
    onProgress: (loaded, total) => {
      const { speedBytesPerSec, etaSeconds } = speed.computeEta(loaded, total);
      const pct = Math.min(98, Math.round((loaded / Math.max(1, total)) * 100));
      onProgress?.({
        loadedBytes: loaded,
        totalBytes: total,
        percent: pct,
        speedBytesPerSec,
        etaSeconds,
        stage: 'fallback',
        provider: 'proxy',
        label: `Fallback upload: ${pct}% · ${formatSpeed(speedBytesPerSec)}`,
      });
    },
  });

  const parsedProxy = (() => {
    try {
      return JSON.parse(proxyRes.responseText);
    } catch {
      return {};
    }
  })();

  if (proxyRes.status < 200 || proxyRes.status >= 300 || (!parsedProxy.url && !parsedProxy.secure_url)) {
    throw new Error(parsedProxy.error || `Server upload failed (HTTP ${proxyRes.status})`);
  }

  onProgress?.({
    loadedBytes: file.size,
    totalBytes: file.size,
    percent: 100,
    speedBytesPerSec: 0,
    etaSeconds: 0,
    stage: 'complete',
    provider: 'proxy',
    label: 'Upload complete',
  });

  return {
    url: parsedProxy.secure_url || parsedProxy.url,
    storageProvider: parsedProxy.storageProvider || 'cloudinary',
    publicId: parsedProxy.publicId || '',
    filename: file.name,
    mimeType: file.type || parsedProxy.mimetype || 'application/octet-stream',
    fileSize: file.size,
    fileFingerprint: fingerprint,
  };
}

export async function ingestRemoteMediaUrl(opts: {
  url: string;
  folder?: string;
  fileType?: string;
  authToken?: string | null;
  csrfHeaders?: Record<string, string>;
  signal?: AbortSignal;
}): Promise<DirectUploadResult> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(opts.csrfHeaders || {}),
  };
  if (opts.authToken) headers['Authorization'] = `Bearer ${opts.authToken}`;

  const res = await fetch('/api/cms/media/ingest-url', {
    method: 'POST',
    headers,
    credentials: 'include',
    signal: opts.signal,
    body: JSON.stringify({
      url: opts.url.trim(),
      folder: opts.folder || 'madecc/cms_media',
      fileType: opts.fileType,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data?.url) {
    throw new Error(data?.error || `Remote URL ingestion failed (${res.status})`);
  }

  return {
    url: data.url,
    storageProvider: data.storageProvider || 'cloudinary',
    publicId: data.publicId || '',
    filename: data.filename || 'remote-asset',
    mimeType: data.mimeType || 'application/octet-stream',
    fileSize: Number(data.fileSize) || 0,
    resourceType: data.fileType,
  };
}
