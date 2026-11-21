export interface DirectUploadResult {
  url: string;
  storageProvider: 'cloudinary' | 'supabase' | 'local';
  publicId?: string;
  filename: string;
  mimeType: string;
  fileSize: number;
  resourceType?: string;
}

export interface DirectUploadProgress {
  loadedBytes: number;
  totalBytes: number;
  percent: number;
  stage: 'signing' | 'uploading' | 'chunking' | 'fallback' | 'ingesting' | 'complete';
  label: string;
  chunkIndex?: number;
  totalChunks?: number;
}

export interface UploadMediaAssetDirectOptions {
  file: File;
  folder?: string;
  fileType?: string;
  authToken?: string | null;
  csrfHeaders?: Record<string, string>;
  useCmsEndpoint?: boolean;
  onProgress?: (progress: DirectUploadProgress) => void;
  signal?: AbortSignal;
}

const DEFAULT_CHUNK_SIZE = 6_000_000; // 6 MB Cloudinary chunk size
const DEFAULT_CHUNK_THRESHOLD = 20 * 1024 * 1024; // 20 MB
const DEFAULT_PROXY_MAX_BYTES = Math.floor(4.2 * 1024 * 1024); // Safe margin under Netlify 6 MB Lambda body limit

function formatMb(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1);
}

function throwIfAborted(signal?: AbortSignal) {
  if (signal?.aborted) {
    throw new DOMException('Upload cancelled by user.', 'AbortError');
  }
}

function sendXhr(
  opts: {
    url: string;
    body: FormData;
    headers?: Record<string, string>;
    withCredentials?: boolean;
    onProgress?: (loaded: number, total: number) => void;
    signal?: AbortSignal;
  }
): Promise<{ status: number; responseText: string }> {
  return new Promise((resolve, reject) => {
    throwIfAborted(opts.signal);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', opts.url, true);
    if (opts.withCredentials) {
      xhr.withCredentials = true;
    }
    if (opts.headers) {
      for (const [key, val] of Object.entries(opts.headers)) {
        if (val) xhr.setRequestHeader(key, val);
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
      resolve({ status: xhr.status, responseText: xhr.responseText || '' });
    };

    xhr.onerror = () => {
      if (opts.signal) opts.signal.removeEventListener('abort', handleAbort);
      reject(new Error('Network connection error during upload'));
    };

    xhr.onabort = () => {
      if (opts.signal) opts.signal.removeEventListener('abort', handleAbort);
      reject(new DOMException('Upload cancelled by user.', 'AbortError'));
    };

    xhr.send(opts.body);
  });
}

async function uploadSingleDirectToCloudinary(
  file: File,
  ticket: any,
  onProgress?: (progress: DirectUploadProgress) => void,
  signal?: AbortSignal
): Promise<DirectUploadResult> {
  const uploadUrl =
    ticket.uploadUrl || `https://api.cloudinary.com/v1_1/${ticket.cloudName}/${ticket.resourceType || 'auto'}/upload`;

  let lastErr: any = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    throwIfAborted(signal);
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
        signal,
        onProgress: (loaded, total) => {
          const pct = Math.min(99, Math.round((loaded / Math.max(1, total)) * 100));
          onProgress?.({
            loadedBytes: loaded,
            totalBytes: total,
            percent: pct,
            stage: 'uploading',
            label: `Direct upload: ${pct}% (${formatMb(loaded)} / ${formatMb(total)} MB)`,
          });
        },
      });

      if (res.status >= 200 && res.status < 300) {
        const parsed = JSON.parse(res.responseText);
        const url = parsed.secure_url || parsed.url;
        if (!url) throw new Error('Cloudinary did not return an asset URL');
        onProgress?.({
          loadedBytes: file.size,
          totalBytes: file.size,
          percent: 100,
          stage: 'complete',
          label: 'Upload complete',
        });
        return {
          url,
          storageProvider: 'cloudinary',
          publicId: parsed.public_id || '',
          filename: file.name,
          mimeType: file.type || 'application/octet-stream',
          fileSize: file.size,
          resourceType: parsed.resource_type,
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
        await new Promise((r) => setTimeout(r, 400));
        continue;
      }
      throw new Error(parsedErr || `Direct cloud upload rejected (HTTP ${res.status})`);
    } catch (err: any) {
      if (err?.name === 'AbortError') throw err;
      lastErr = err;
      if (attempt === 0) {
        await new Promise((r) => setTimeout(r, 400));
        continue;
      }
    }
  }

  throw lastErr || new Error('Direct Cloudinary upload failed');
}

async function uploadChunkedDirectToCloudinary(
  file: File,
  ticket: any,
  onProgress?: (progress: DirectUploadProgress) => void,
  signal?: AbortSignal
): Promise<DirectUploadResult> {
  const uploadUrl =
    ticket.uploadUrl || `https://api.cloudinary.com/v1_1/${ticket.cloudName}/${ticket.resourceType || 'video'}/upload`;
  const chunkSize = Number(ticket.chunkSizeBytes) || DEFAULT_CHUNK_SIZE;
  const totalBytes = file.size;
  const totalChunks = Math.ceil(totalBytes / chunkSize);
  const uniqueUploadId = `madecc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  let finalParsed: any = null;

  for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
    throwIfAborted(signal);
    const start = chunkIndex * chunkSize;
    const end = Math.min(totalBytes, start + chunkSize);
    const chunkBlob = file.slice(start, end);
    const contentRange = `bytes ${start}-${end - 1}/${totalBytes}`;

    let chunkUploaded = false;
    let lastChunkErr: any = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      throwIfAborted(signal);
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
          signal,
          onProgress: (chunkLoaded) => {
            const overallLoaded = Math.min(totalBytes, start + chunkLoaded);
            const pct = Math.min(99, Math.round((overallLoaded / Math.max(1, totalBytes)) * 100));
            onProgress?.({
              loadedBytes: overallLoaded,
              totalBytes,
              percent: pct,
              stage: 'chunking',
              chunkIndex: chunkIndex + 1,
              totalChunks,
              label: `Chunk ${chunkIndex + 1}/${totalChunks}: ${pct}% (${formatMb(overallLoaded)} / ${formatMb(totalBytes)} MB)`,
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

        lastChunkErr = new Error(`Chunk ${chunkIndex + 1} failed with HTTP ${res.status}`);
        if (res.status >= 400 && res.status < 500 && res.status !== 408 && res.status !== 429) {
          throw lastChunkErr;
        }
      } catch (err: any) {
        if (err?.name === 'AbortError') throw err;
        lastChunkErr = err;
      }

      if (attempt < 2) {
        await new Promise((r) => setTimeout(r, 500 * (attempt + 1)));
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

  onProgress?.({
    loadedBytes: totalBytes,
    totalBytes,
    percent: 100,
    stage: 'complete',
    chunkIndex: totalChunks,
    totalChunks,
    label: 'Chunked upload complete',
  });

  return {
    url: finalUrl,
    storageProvider: 'cloudinary',
    publicId: finalParsed.public_id || '',
    filename: file.name,
    mimeType: file.type || 'application/octet-stream',
    fileSize: file.size,
    resourceType: finalParsed.resource_type,
  };
}

export async function uploadMediaAssetDirect(
  options: UploadMediaAssetDirectOptions
): Promise<DirectUploadResult> {
  const {
    file,
    folder = 'madecc/cms_media',
    fileType,
    authToken,
    csrfHeaders = {},
    useCmsEndpoint = true,
    onProgress,
    signal,
  } = options;

  throwIfAborted(signal);
  onProgress?.({
    loadedBytes: 0,
    totalBytes: file.size,
    percent: 5,
    stage: 'signing',
    label: 'Requesting signed cloud upload ticket...',
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
          folder,
        }),
      });
      const sigData = await sigRes.json().catch(() => ({}));
      if (!sigRes.ok) {
        if (sigRes.status === 400 && sigData?.error) {
          throw new Error(sigData.error);
        }
        signatureErrorMsg = sigData?.error || `Signature error (${sigRes.status})`;
      } else {
        ticket = sigData;
      }
    } else {
      const sigRes = await fetch(`/api/cloudinary-signature?folder=${encodeURIComponent(folder)}`, {
        headers: reqHeaders,
        credentials: 'include',
        signal,
      });
      if (sigRes.ok) {
        ticket = await sigRes.json();
      }
    }
  } catch (err: any) {
    if (err?.name === 'AbortError') throw err;
    // Surface deterministic file validation errors immediately without proxy retry
    if (
      err?.message &&
      /exceeds|unsupported|blocked|extension|mime/i.test(err.message)
    ) {
      throw err;
    }
    signatureErrorMsg = err?.message || 'Could not obtain signed upload ticket';
  }

  const chunkThreshold = Number(ticket?.chunkThresholdBytes) || DEFAULT_CHUNK_THRESHOLD;
  const proxyMaxBytes = Number(ticket?.proxyFallbackMaxBytes) || DEFAULT_PROXY_MAX_BYTES;

  if (ticket?.signature && ticket?.cloudName && ticket?.apiKey) {
    try {
      if (file.size > chunkThreshold) {
        return await uploadChunkedDirectToCloudinary(file, ticket, onProgress, signal);
      }
      return await uploadSingleDirectToCloudinary(file, ticket, onProgress, signal);
    } catch (directErr: any) {
      if (directErr?.name === 'AbortError') throw directErr;
      if (file.size > proxyMaxBytes) {
        throw new Error(
          `Direct upload failed for ${formatMb(file.size)} MB file (${directErr.message}). Files above ${(proxyMaxBytes / (1024 * 1024)).toFixed(1)} MB require direct cloud upload to avoid serverless 413 payload limits.`
        );
      }
      console.warn('[DIRECT_UPLOAD_PROXY_FALLBACK]', directErr);
    }
  } else if (file.size > proxyMaxBytes) {
    throw new Error(
      signatureErrorMsg ||
        `Unable to initialize direct upload for ${formatMb(file.size)} MB file (serverless proxy limit is 4.2 MB to prevent HTTP 413).`
    );
  }

  // Small-file safe proxy fallback (<= 4.2 MB -> Cloudinary / Supabase)
  throwIfAborted(signal);
  onProgress?.({
    loadedBytes: 0,
    totalBytes: file.size,
    percent: 15,
    stage: 'fallback',
    label: 'Uploading via secure server storage fallback...',
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
      const pct = Math.min(98, Math.round((loaded / Math.max(1, total)) * 100));
      onProgress?.({
        loadedBytes: loaded,
        totalBytes: total,
        percent: pct,
        stage: 'fallback',
        label: `Fallback upload: ${pct}%`,
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
    stage: 'complete',
    label: 'Upload complete',
  });

  return {
    url: parsedProxy.secure_url || parsedProxy.url,
    storageProvider: parsedProxy.storageProvider || 'cloudinary',
    publicId: parsedProxy.publicId || '',
    filename: file.name,
    mimeType: file.type || parsedProxy.mimetype || 'application/octet-stream',
    fileSize: file.size,
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
