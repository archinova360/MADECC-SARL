import React, { useState, useEffect, useRef } from 'react';
import {
  Upload,
  Search,
  Trash2,
  Edit3,
  Copy,
  Check,
  Film,
  Image as ImageIcon,
  FileText,
  Plus,
  RefreshCw,
  CheckCircle2,
  X,
  Play,
  Pause,
  RotateCcw,
  FolderOpen,
  Link2,
  Replace,
  AlertTriangle,
  HardDrive,
} from 'lucide-react';
import { MediaItem } from '../types.ts';
import { getCsrfHeaders } from '../lib/csrf.ts';
import { getOptimizedImageUrl } from '../lib/utils.ts';
import { getAuthToken } from '../lib/firebase.ts';
import { cmsFetch } from './cms/cmsClient.ts';
import {
  uploadMediaAssetDirect,
  ingestRemoteMediaUrl,
  fetchUploadCapabilities,
  formatBytes,
  formatEta,
  formatSpeed,
  UploadCapabilities,
} from '../lib/directMediaUpload.ts';

interface CmsMediaLibraryProps {
  onSelectMedia?: (media: MediaItem) => void;
  isPickerMode?: boolean;
  filterType?: 'all' | 'image' | 'video' | 'document' | 'logo';
}

const FOLDERS = ['All', 'Root', 'Hero', 'Projects', 'Services', 'Legal', 'Videos'];

export default function CmsMediaLibrary({
  onSelectMedia,
  isPickerMode = false,
  filterType: initialFilterType = 'all',
}: CmsMediaLibraryProps) {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedFolder, setSelectedFolder] = useState('All');
  const [selectedType, setSelectedType] = useState<string>(initialFilterType);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [statusNotice, setStatusNotice] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Upload modal & multi-file resumable queue state
  interface QueuedUploadItem {
    id: string;
    file: File;
    title: string;
    previewUrl: string | null;
    kind: 'image' | 'video' | 'document';
    status: 'queued' | 'uploading' | 'paused' | 'verifying' | 'completed' | 'error' | 'cancelled';
    percent: number;
    loadedBytes: number;
    speedBytesPerSec: number;
    etaSeconds: number | null;
    stageLabel: string;
    chunkText?: string;
    error?: string;
    duplicateMatch?: MediaItem | null;
    resultUrl?: string;
  }

  const [capabilities, setCapabilities] = useState<UploadCapabilities | null>(null);
  const [capabilitiesLoading, setCapabilitiesLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState(initialFilterType === 'video' ? 'Hero Media' : 'General');
  const [uploadFolder, setUploadFolder] = useState(initialFilterType === 'video' ? 'Videos' : 'Root');
  const [uploadAltText, setUploadAltText] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadDescription, setUploadDescription] = useState('');
  const [uploadCreditSource, setUploadCreditSource] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadThumbnailUrl, setUploadThumbnailUrl] = useState('');
  const [uploadSubtitlesUrl, setUploadSubtitlesUrl] = useState('');
  const [uploadTranscript, setUploadTranscript] = useState('');
  const [uploadDurationSeconds, setUploadDurationSeconds] = useState('');
  const [uploadQueue, setUploadQueue] = useState<QueuedUploadItem[]>([]);
  const [uploadUrlDirect, setUploadUrlDirect] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatusLabel, setUploadStatusLabel] = useState('');
  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const [uploadAbortController, setUploadAbortController] = useState<AbortController | null>(null);
  const [uploadError, setUploadError] = useState('');

  // Per-item pause/abort runtime refs so pause/resume works reliably without stale closures
  const itemControllersRef = useRef<Map<string, AbortController>>(new Map());
  const pausedIdsRef = useRef<Set<string>>(new Set());
  const pauseResolversRef = useRef<Map<string, (action: 'resume' | 'abort') => void>>(new Map());
  const previewUrlsRef = useRef<string[]>([]);

  // Edit modal state
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAltText, setEditAltText] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editCreditSource, setEditCreditSource] = useState('');
  const [editFolder, setEditFolder] = useState('Root');
  const [editCategory, setEditCategory] = useState('General');
  const [editTags, setEditTags] = useState('');
  const [editThumbnailUrl, setEditThumbnailUrl] = useState('');
  const [editSubtitlesUrl, setEditSubtitlesUrl] = useState('');
  const [editTranscript, setEditTranscript] = useState('');
  const [editDurationSeconds, setEditDurationSeconds] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Usage modal / Delete confirmation modal / Replace modal
  const [usageModal, setUsageModal] = useState<{ item: MediaItem; usedIn: string[]; loading: boolean } | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<{ item: MediaItem; usedIn: string[]; message: string } | null>(null);
  const [replaceModal, setReplaceModal] = useState<MediaItem | null>(null);
  const [replaceUrl, setReplaceUrl] = useState('');
  const [replaceFile, setReplaceFile] = useState<File | null>(null);
  const [replaceUpdateRefs, setReplaceUpdateRefs] = useState(true);
  const [isReplacing, setIsReplacing] = useState(false);
  const [replaceProgressText, setReplaceProgressText] = useState('');

  // Video preview player modal
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  const categories = ['All', 'Hero Media', 'Projects', 'Services', 'Logos', 'Certifications', 'Site Photos', 'General'];
  const mediaTypes = [
    { label: 'All Media', value: 'all' },
    { label: 'Videos', value: 'video' },
    { label: 'Images', value: 'image' },
    { label: 'Logos & Badges', value: 'logo' },
    { label: 'Documents', value: 'document' },
  ];

  useEffect(() => {
    setSelectedType(initialFilterType);
  }, [initialFilterType]);

  const loadCapabilities = async (refresh = false) => {
    setCapabilitiesLoading(true);
    try {
      const token = await getAuthToken();
      const caps = await fetchUploadCapabilities({ authToken: token, isCms: true, refresh });
      if (caps) setCapabilities(caps);
    } finally {
      setCapabilitiesLoading(false);
    }
  };

  useEffect(() => {
    loadCapabilities(false);
    return () => {
      previewUrlsRef.current.forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch {}
      });
      previewUrlsRef.current = [];
    };
  }, []);

  const showNotice = (type: 'success' | 'error', text: string) => {
    setStatusNotice({ type, text });
    setTimeout(() => setStatusNotice(null), 4500);
  };

  const fetchMedia = async () => {
    setLoading(true);
    try {
      let url = `/api/cms/media?category=${encodeURIComponent(selectedCategory)}&fileType=${encodeURIComponent(selectedType)}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;

      const res = await fetch(url, { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        if (data.success && Array.isArray(data.media)) {
          setMediaList(data.media);
        }
      }
    } catch (err) {
      console.error('Failed to fetch media library items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMedia();
  }, [selectedCategory, selectedType, searchQuery]);

  const handleCopyUrl = (url: string, id: number) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isUploadVideo =
    initialFilterType === 'video' ||
    uploadQueue.some((q) => q.kind === 'video') ||
    uploadUrlDirect.endsWith('.mp4') ||
    uploadUrlDirect.endsWith('.webm') ||
    uploadFolder === 'Videos';

  const enqueueFiles = (fileList: FileList | File[]) => {
    const incoming = Array.from(fileList || []);
    if (incoming.length === 0) return;

    const newItems: QueuedUploadItem[] = incoming.map((file) => {
      const isVid = file.type.startsWith('video/') || /\.(mp4|webm|mov|m4v|avi|mkv)$/i.test(file.name);
      const isImg = file.type.startsWith('image/') || /\.(jpg|jpeg|png|webp|gif|avif|svg)$/i.test(file.name);
      let previewUrl: string | null = null;
      if (isImg || isVid) {
        previewUrl = URL.createObjectURL(file);
        previewUrlsRef.current.push(previewUrl);
      }
      const duplicateMatch =
        mediaList.find(
          (m) => m.filename === file.name && Number(m.fileSize || 0) === file.size && m.status === 'ACTIVE'
        ) || null;

      return {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        file,
        title: file.name.replace(/\.[^/.]+$/, ''),
        previewUrl,
        kind: isVid ? 'video' : isImg ? 'image' : 'document',
        status: 'queued',
        percent: 0,
        loadedBytes: 0,
        speedBytesPerSec: 0,
        etaSeconds: null,
        stageLabel: duplicateMatch ? 'Duplicate detected in library (ready to upload copy or remove)' : 'Queued',
        duplicateMatch,
      };
    });

    setUploadQueue((prev) => {
      const merged = [...prev, ...newItems];
      if (!uploadTitle && merged.length === 1) {
        setUploadTitle(merged[0].title);
      }
      return merged;
    });
    setUploadError('');
  };

  const removeQueueItem = (itemId: string) => {
    const ctrl = itemControllersRef.current.get(itemId);
    if (ctrl) ctrl.abort();
    const resolver = pauseResolversRef.current.get(itemId);
    if (resolver) {
      resolver('abort');
      pauseResolversRef.current.delete(itemId);
    }
    pausedIdsRef.current.delete(itemId);
    setUploadQueue((prev) => {
      const target = prev.find((i) => i.id === itemId);
      if (target?.previewUrl) {
        try {
          URL.revokeObjectURL(target.previewUrl);
        } catch {}
      }
      return prev.filter((i) => i.id !== itemId);
    });
  };

  const togglePauseQueueItem = (itemId: string) => {
    if (pausedIdsRef.current.has(itemId)) {
      pausedIdsRef.current.delete(itemId);
      const resolver = pauseResolversRef.current.get(itemId);
      if (resolver) {
        resolver('resume');
        pauseResolversRef.current.delete(itemId);
      }
      setUploadQueue((prev) =>
        prev.map((q) => (q.id === itemId ? { ...q, status: 'uploading', stageLabel: 'Resuming upload...' } : q))
      );
    } else {
      pausedIdsRef.current.add(itemId);
      setUploadQueue((prev) =>
        prev.map((q) =>
          q.id === itemId
            ? { ...q, status: 'paused', stageLabel: 'Pausing after active chunk finishes...' }
            : q
        )
      );
    }
  };

  const uploadSingleQueueItem = async (
    item: QueuedUploadItem,
    totalCount: number,
    csrf: Record<string, string>,
    authToken: string | null
  ): Promise<boolean> => {
    const controller = new AbortController();
    itemControllersRef.current.set(item.id, controller);

    const resolveItemTitle = () => {
      if (totalCount === 1 && uploadTitle.trim()) return uploadTitle.trim();
      return item.title || item.file.name.replace(/\.[^/.]+$/, '');
    };

    try {
      setUploadQueue((prev) =>
        prev.map((q) =>
          q.id === item.id ? { ...q, status: 'uploading', error: undefined, stageLabel: 'Signing upload ticket...' } : q
        )
      );

      const directRes = await uploadMediaAssetDirect({
        file: item.file,
        folder: `madecc/cms_media/${uploadFolder.toLowerCase()}`,
        fileType: uploadCategory === 'Logos' ? 'logo' : undefined,
        authToken,
        csrfHeaders: csrf,
        useCmsEndpoint: true,
        signal: controller.signal,
        shouldPause: () => pausedIdsRef.current.has(item.id),
        waitWhilePaused: () =>
          new Promise<'resume' | 'abort'>((resolve) => {
            setUploadQueue((prev) =>
              prev.map((q) => (q.id === item.id ? { ...q, status: 'paused' } : q))
            );
            pauseResolversRef.current.set(item.id, resolve);
          }),
        onProgress: (p) => {
          setUploadQueue((prev) =>
            prev.map((q) =>
              q.id === item.id
                ? {
                    ...q,
                    status: p.stage === 'paused' ? 'paused' : p.stage === 'verifying' ? 'verifying' : 'uploading',
                    percent: p.percent,
                    loadedBytes: p.loadedBytes,
                    speedBytesPerSec: p.speedBytesPerSec,
                    etaSeconds: p.etaSeconds,
                    stageLabel: p.label,
                    chunkText:
                      p.chunkIndex && p.totalChunks ? `Chunk ${p.chunkIndex}/${p.totalChunks}` : undefined,
                  }
                : q
            )
          );
          if (totalCount === 1) {
            setUploadProgress(p.percent);
            setUploadStatusLabel(p.label);
          }
        },
      });

      const mimeType = directRes.mimeType || item.file.type || 'application/octet-stream';
      const resolvedTitle = resolveItemTitle();
      let finalFileType: 'image' | 'video' | 'document' | 'logo' = 'image';
      if (mimeType.startsWith('video/')) finalFileType = 'video';
      else if (uploadCategory === 'Logos') finalFileType = 'logo';
      else if (mimeType.includes('pdf') || mimeType.includes('doc') || item.kind === 'document') {
        finalFileType = 'document';
      }

      setUploadQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? { ...q, status: 'verifying', percent: 97, stageLabel: 'Saving asset metadata in Neon DB...' }
            : q
        )
      );

      const tagsArray = uploadTags.split(',').map((t) => t.trim()).filter(Boolean);
      const regData = await cmsFetch('/api/cms/media', {
        method: 'POST',
        body: JSON.stringify({
          title: resolvedTitle,
          filename: directRes.filename || item.file.name,
          fileUrl: directRes.url,
          fileType: finalFileType,
          mimeType,
          fileSize: directRes.fileSize || item.file.size,
          dimensions: directRes.dimensions,
          storageProvider: directRes.storageProvider,
          publicId: directRes.publicId || '',
          fileFingerprint: directRes.fileFingerprint,
          uploadStatus: 'COMPLETED',
          uploadCompletedAt: new Date().toISOString(),
          altText: totalCount === 1 && uploadAltText ? uploadAltText : resolvedTitle,
          caption: uploadCaption,
          description: uploadDescription,
          creditSource: uploadCreditSource,
          folder: uploadFolder,
          thumbnailUrl: uploadThumbnailUrl || undefined,
          subtitlesUrl: uploadSubtitlesUrl || undefined,
          transcript: uploadTranscript || undefined,
          durationSeconds: uploadDurationSeconds
            ? Number(uploadDurationSeconds)
            : directRes.durationSeconds || undefined,
          category: uploadCategory,
          tags: tagsArray,
        }),
      });

      if (!regData.success) {
        throw new Error(regData.error || 'Failed to register media in database');
      }

      setUploadQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? {
                ...q,
                status: 'completed',
                percent: 100,
                loadedBytes: item.file.size,
                speedBytesPerSec: 0,
                etaSeconds: 0,
                stageLabel: 'Saved & Verified',
                resultUrl: directRes.url,
              }
            : q
        )
      );
      return true;
    } catch (err: any) {
      const isAbort = err?.name === 'AbortError';
      setUploadQueue((prev) =>
        prev.map((q) =>
          q.id === item.id
            ? {
                ...q,
                status: isAbort ? 'cancelled' : 'error',
                speedBytesPerSec: 0,
                etaSeconds: null,
                error: isAbort ? 'Cancelled' : err?.message || 'Upload failed',
                stageLabel: isAbort ? 'Cancelled' : err?.message || 'Upload failed',
              }
            : q
        )
      );
      return false;
    } finally {
      itemControllersRef.current.delete(item.id);
      pausedIdsRef.current.delete(item.id);
      pauseResolversRef.current.delete(item.id);
    }
  };

  const retryQueueItem = async (itemId: string) => {
    const target = uploadQueue.find((q) => q.id === itemId);
    if (!target || isUploading) return;
    setIsUploading(true);
    try {
      const csrf = await getCsrfHeaders();
      const authToken = await getAuthToken();
      const ok = await uploadSingleQueueItem(target, uploadQueue.length, csrf, authToken);
      if (ok) {
        fetchMedia();
        showNotice('success', `Uploaded "${target.title}".`);
      }
    } finally {
      setIsUploading(false);
    }
  };

  const resetUploadModal = () => {
    previewUrlsRef.current.forEach((u) => {
      try {
        URL.revokeObjectURL(u);
      } catch {}
    });
    previewUrlsRef.current = [];
    setUploadQueue([]);
    setUploadTitle('');
    setUploadAltText('');
    setUploadCaption('');
    setUploadDescription('');
    setUploadCreditSource('');
    setUploadTags('');
    setUploadThumbnailUrl('');
    setUploadSubtitlesUrl('');
    setUploadTranscript('');
    setUploadDurationSeconds('');
    setUploadUrlDirect('');
    setUploadError('');
    setUploadProgress(0);
    setUploadStatusLabel('');
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadMode === 'file' && uploadQueue.length === 0) {
      setUploadError('Please select or drop at least one file to upload.');
      return;
    }
    if (uploadMode === 'file' && uploadQueue.length === 1 && !uploadTitle.trim()) {
      setUploadError('Please provide a title for the media item.');
      return;
    }
    if (uploadMode === 'url' && !uploadTitle.trim()) {
      setUploadError('Please provide a title for the media item.');
      return;
    }

    const controller = new AbortController();
    setUploadAbortController(controller);
    setIsUploading(true);
    setUploadError('');
    setUploadProgress(5);
    setUploadStatusLabel('Preparing upload...');

    try {
      const csrf = await getCsrfHeaders();
      const authToken = await getAuthToken();

      if (uploadMode === 'file') {
        const pending = uploadQueue.filter(
          (q) => q.status === 'queued' || q.status === 'error' || q.status === 'cancelled'
        );
        let successCount = 0;
        let failCount = 0;

        for (const item of pending) {
          if (controller.signal.aborted) break;
          const ok = await uploadSingleQueueItem(item, uploadQueue.length, csrf, authToken);
          if (ok) successCount++;
          else failCount++;
        }

        if (successCount > 0) {
          fetchMedia();
        }
        if (failCount === 0 && successCount > 0) {
          setShowUploadModal(false);
          resetUploadModal();
          showNotice(
            'success',
            successCount === 1
              ? 'Asset uploaded, verified & registered in CMS Media Library.'
              : `${successCount} assets uploaded, verified & registered in CMS Media Library.`
          );
        } else if (failCount > 0) {
          setUploadError(`${failCount} file(s) did not complete. Check individual queue status to retry.`);
        }
        return;
      }

      // Remote HTTPS URL safe ingestion path
      const finalFileUrl = uploadUrlDirect.trim();
      if (!finalFileUrl) {
        throw new Error('Please enter a valid HTTPS media URL.');
      }
      setUploadStatusLabel('Fetching & verifying remote HTTPS media safely...');
      setUploadProgress(35);
      const ingested = await ingestRemoteMediaUrl({
        url: finalFileUrl,
        folder: `madecc/cms_media/${uploadFolder.toLowerCase()}`,
        fileType: uploadCategory === 'Logos' ? 'logo' : undefined,
        authToken,
        csrfHeaders: csrf,
        signal: controller.signal,
      });

      let finalFileType: 'image' | 'video' | 'document' | 'logo' = 'image';
      if (ingested.mimeType.startsWith('video/') || initialFilterType === 'video') {
        finalFileType = 'video';
      } else if (uploadCategory === 'Logos') {
        finalFileType = 'logo';
      } else if (ingested.mimeType.includes('pdf')) {
        finalFileType = 'document';
      }

      setUploadProgress(92);
      setUploadStatusLabel('Saving asset metadata in Neon DB...');

      const tagsArray = uploadTags.split(',').map((t) => t.trim()).filter(Boolean);
      const regData = await cmsFetch('/api/cms/media', {
        method: 'POST',
        body: JSON.stringify({
          title: uploadTitle,
          filename: ingested.filename || undefined,
          fileUrl: ingested.url,
          fileType: finalFileType,
          mimeType: ingested.mimeType,
          fileSize: ingested.fileSize,
          storageProvider: ingested.storageProvider,
          publicId: ingested.publicId || '',
          uploadStatus: 'COMPLETED',
          uploadCompletedAt: new Date().toISOString(),
          altText: uploadAltText || uploadTitle,
          caption: uploadCaption,
          description: uploadDescription,
          creditSource: uploadCreditSource,
          folder: uploadFolder,
          thumbnailUrl: uploadThumbnailUrl || undefined,
          subtitlesUrl: uploadSubtitlesUrl || undefined,
          transcript: uploadTranscript || undefined,
          durationSeconds: uploadDurationSeconds ? Number(uploadDurationSeconds) : undefined,
          category: uploadCategory,
          tags: tagsArray,
        }),
      });

      if (!regData.success) {
        throw new Error(regData.error || 'Failed to register media in database');
      }

      setUploadProgress(100);
      setUploadStatusLabel('Saved!');
      setShowUploadModal(false);
      resetUploadModal();
      showNotice('success', 'Asset ingested & registered in CMS Media Library.');
      fetchMedia();
    } catch (err: any) {
      if (err?.name === 'AbortError') {
        setUploadError('Upload cancelled.');
      } else {
        setUploadError(err.message || 'Upload process failed');
      }
    } finally {
      setUploadAbortController(null);
      setIsUploading(false);
    }
  };

  const handleOpenEdit = (item: MediaItem) => {
    setEditingMedia(item);
    setEditTitle(item.title);
    setEditAltText(item.altText || '');
    setEditCaption(item.caption || '');
    setEditDescription(item.description || '');
    setEditCreditSource(item.creditSource || '');
    setEditFolder(item.folder || 'Root');
    setEditCategory(item.category || 'General');
    setEditTags(Array.isArray(item.tags) ? item.tags.join(', ') : '');
    setEditThumbnailUrl(item.thumbnailUrl || '');
    setEditSubtitlesUrl(item.subtitlesUrl || '');
    setEditTranscript(item.transcript || '');
    setEditDurationSeconds(item.durationSeconds ? String(item.durationSeconds) : '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMedia) return;

    setIsSavingEdit(true);
    try {
      const tagsArray = editTags.split(',').map((t) => t.trim()).filter(Boolean);
      await cmsFetch(`/api/cms/media/${editingMedia.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: editTitle,
          altText: editAltText,
          caption: editCaption,
          description: editDescription,
          creditSource: editCreditSource,
          folder: editFolder,
          category: editCategory,
          tags: tagsArray,
          thumbnailUrl: editThumbnailUrl || null,
          subtitlesUrl: editSubtitlesUrl || null,
          transcript: editTranscript || null,
          durationSeconds: editDurationSeconds ? Number(editDurationSeconds) : null,
        }),
      });
      setEditingMedia(null);
      showNotice('success', 'Media metadata saved.');
      fetchMedia();
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to update media item.');
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleCheckUsage = async (item: MediaItem) => {
    setUsageModal({ item, usedIn: item.usedIn || [], loading: true });
    try {
      const res = await cmsFetch(`/api/cms/media/${item.id}/usage`);
      setUsageModal({ item, usedIn: res.usedIn || [], loading: false });
    } catch (err: any) {
      setUsageModal(null);
      showNotice('error', err.message || 'Failed to check asset usage.');
    }
  };

  const handleAttemptDelete = async (item: MediaItem, force = false) => {
    try {
      const csrf = await getCsrfHeaders();
      const authToken = await getAuthToken();
      const headers: Record<string, string> = { ...csrf };
      if (authToken) headers['Authorization'] = `Bearer ${authToken}`;

      const res = await fetch(`/api/cms/media/${item.id}${force ? '?force=true' : ''}`, {
        method: 'DELETE',
        headers,
        credentials: 'include',
      });
      const data = await res.json().catch(() => ({}));

      if (res.status === 409 && data.requiresConfirmation) {
        setDeleteConfirmModal({
          item,
          usedIn: Array.isArray(data.usedIn) ? data.usedIn : [],
          message: data.error || 'This asset is currently referenced on live pages.',
        });
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || `Delete failed (${res.status})`);
      }

      setDeleteConfirmModal(null);
      setMediaList((prev) => prev.filter((m) => m.id !== item.id));
      showNotice('success', `Deleted "${item.title}" from Media Library.`);
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to delete media asset.');
    }
  };

  const handleOpenReplace = (item: MediaItem) => {
    setReplaceModal(item);
    setReplaceUrl(item.fileUrl);
    setReplaceFile(null);
    setReplaceUpdateRefs(true);
  };

  const handleSubmitReplace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replaceModal) return;
    setIsReplacing(true);
    setReplaceProgressText('Preparing replacement...');
    try {
      let nextUrl = replaceUrl.trim();
      let mimeType = replaceModal.mimeType;
      let fileSize = replaceModal.fileSize;
      let filename = replaceModal.filename;
      let storageProvider = replaceModal.storageProvider;
      let publicId = replaceModal.publicId;

      const csrf = await getCsrfHeaders();
      const authToken = await getAuthToken();

      if (replaceFile) {
        const directRes = await uploadMediaAssetDirect({
          file: replaceFile,
          folder: `madecc/cms_media/${(replaceModal.folder || 'root').toLowerCase()}`,
          authToken,
          csrfHeaders: csrf,
          useCmsEndpoint: true,
          onProgress: (p) => {
            setReplaceProgressText(p.label);
          },
        });
        nextUrl = directRes.url;
        mimeType = directRes.mimeType;
        fileSize = directRes.fileSize;
        filename = directRes.filename;
        storageProvider = directRes.storageProvider;
        publicId = directRes.publicId;
      } else if (nextUrl && nextUrl !== replaceModal.fileUrl) {
        setReplaceProgressText('Ingesting & validating remote HTTPS URL...');
        const ingested = await ingestRemoteMediaUrl({
          url: nextUrl,
          folder: `madecc/cms_media/${(replaceModal.folder || 'root').toLowerCase()}`,
          authToken,
          csrfHeaders: csrf,
        });
        nextUrl = ingested.url;
        mimeType = ingested.mimeType;
        fileSize = ingested.fileSize;
        filename = ingested.filename;
        storageProvider = ingested.storageProvider;
        publicId = ingested.publicId;
      }

      if (!nextUrl) throw new Error('Provide a replacement file or URL.');

      setReplaceProgressText('Updating references in Neon DB...');
      const res = await cmsFetch(`/api/cms/media/${replaceModal.id}/replace`, {
        method: 'POST',
        body: JSON.stringify({
          newFileUrl: nextUrl,
          filename,
          mimeType,
          fileSize,
          storageProvider,
          publicId,
          updateReferences: replaceUpdateRefs,
        }),
      });

      setReplaceModal(null);
      setReplaceProgressText('');
      showNotice(
        'success',
        `Asset replaced cleanly (${res.updatedRefsCount || 0} hero banner reference(s) updated).`
      );
      fetchMedia();
    } catch (err: any) {
      showNotice('error', err.message || 'Failed to replace asset.');
    } finally {
      setIsReplacing(false);
      setReplaceProgressText('');
    }
  };

  const displayedMedia = mediaList.filter((item) => {
    if (selectedFolder === 'All') return true;
    return (item.folder || 'Root').toLowerCase() === selectedFolder.toLowerCase();
  });

  const isVideoMode = selectedType === 'video';

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl text-slate-200" id="cms-media-library">
      {statusNotice && (
        <div
          className={`mb-4 p-3 rounded-lg border text-xs flex items-center justify-between ${
            statusNotice.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
          }`}
        >
          <span>{statusNotice.text}</span>
          <button onClick={() => setStatusNotice(null)} className="opacity-70 hover:opacity-100">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Film className="w-5 h-5 text-amber-500" />
            {isVideoMode ? 'Video Library (Reels, Subtitles & Transcripts)' : 'Central Media & Video Library'}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {isVideoMode
              ? 'Manage project videos, poster thumbnails, WebVTT subtitles, transcripts, and durations stored in Neon DB.'
              : 'Store, check page usage, replace assets safely, and organize photos, videos, blueprints, and branding assets.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchMedia()}
            className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-lg transition-colors border border-slate-700"
            title="Refresh Media"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-amber-500' : ''}`} />
          </button>

          <button
            onClick={() => setShowUploadModal(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-lg text-sm transition-all shadow-md shadow-amber-500/10"
            id="cms-upload-media-btn"
          >
            <Upload className="w-4 h-4" /> Upload New Asset
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 py-4">
        <div className="sm:col-span-4 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, filename, tags..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/70"
          />
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedFolder}
            onChange={(e) => setSelectedFolder(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/70"
          >
            {FOLDERS.map((f) => (
              <option key={f} value={f}>{f === 'All' ? 'All Folders' : `Folder: ${f}`}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/70"
          >
            {categories.map((c) => (
              <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/70"
          >
            {mediaTypes.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Media Grid */}
      {loading ? (
        <div className="py-24 text-center">
          <div className="w-10 h-10 border-4 border-slate-800 border-t-amber-500 rounded-full animate-spin mx-auto mb-3" />
          <p className="text-xs font-mono uppercase tracking-widest text-slate-400">Loading Media Library...</p>
        </div>
      ) : displayedMedia.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-slate-800 rounded-xl bg-slate-950/40">
          <ImageIcon className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-300">No media assets found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
            Upload your first video, site photo, or architectural blueprint to begin managing your media library.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold rounded-lg hover:bg-amber-500/20"
          >
            <Plus className="w-3.5 h-3.5" /> Upload Asset Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mt-2">
          {displayedMedia.map((item) => {
            const isVideo =
              item.fileType === 'video' || item.fileUrl?.endsWith('.mp4') || item.fileUrl?.endsWith('.webm');

            return (
              <div
                key={item.id}
                className="group relative bg-slate-950 border border-slate-800 hover:border-amber-500/50 rounded-xl overflow-hidden transition-all shadow-md flex flex-col justify-between"
              >
                {/* Thumbnail / Video Preview Frame */}
                <div className="relative aspect-video bg-slate-900 overflow-hidden flex items-center justify-center">
                  {isVideo ? (
                    <div className="relative w-full h-full flex items-center justify-center bg-slate-900 group-hover:scale-105 transition-transform duration-500">
                      <video
                        src={item.fileUrl}
                        poster={item.thumbnailUrl || undefined}
                        className="w-full h-full object-cover"
                        preload="metadata"
                        muted
                      />
                      <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                        <button
                          onClick={() => setPreviewVideoUrl(item.fileUrl)}
                          className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                          title="Watch Video Preview"
                        >
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </button>
                      </div>
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-rose-500/90 text-white font-mono text-[10px] font-bold rounded">
                        VIDEO {item.durationSeconds ? `• ${item.durationSeconds}s` : ''}
                      </span>
                    </div>
                  ) : (
                    <img
                      src={getOptimizedImageUrl(item.fileUrl, 400, 75)}
                      alt={item.altText || item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                      referrerPolicy="no-referrer"
                    />
                  )}

                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-slate-900/80 backdrop-blur-sm border border-slate-700 text-slate-300 font-mono text-[10px] rounded">
                    {item.folder || 'Root'} / {item.category}
                  </span>
                </div>

                {/* Info Block */}
                <div className="p-3.5 flex-1 flex flex-col justify-between">
                  <div>
                    <h4 className="font-semibold text-sm text-white truncate" title={item.title}>
                      {item.title}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5" title={item.altText || ''}>
                      {item.altText || item.filename}
                    </p>
                    {item.creditSource && (
                      <p className="text-[10px] text-slate-500 truncate mt-0.5">Credit: {item.creditSource}</p>
                    )}
                  </div>

                  {/* Action Bar */}
                  <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-800/80 text-xs">
                    {isPickerMode ? (
                      <button
                        onClick={() => onSelectMedia && onSelectMedia(item)}
                        className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-1.5 rounded text-xs transition-colors flex items-center justify-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Use this Asset
                      </button>
                    ) : (
                      <>
                        <button
                          onClick={() => handleCopyUrl(item.fileUrl, item.id)}
                          className="flex items-center gap-1 text-slate-400 hover:text-amber-400 transition-colors text-[11px]"
                          title="Copy Direct URL"
                        >
                          {copiedId === item.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copy
                            </>
                          )}
                        </button>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCheckUsage(item)}
                            className="p-1 text-slate-400 hover:text-sky-400 rounded hover:bg-slate-800 transition-colors"
                            title="Check Where Used"
                          >
                            <Link2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenReplace(item)}
                            className="p-1 text-slate-400 hover:text-emerald-400 rounded hover:bg-slate-800 transition-colors"
                            title="Replace Asset File/URL"
                          >
                            <Replace className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                            title="Edit Metadata"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleAttemptDelete(item, false)}
                            className="p-1 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
                            title="Delete Asset"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Media Modal (Multi-File Resumable Queue + Live Provider Limits) */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 shadow-2xl my-8 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-500" /> Upload Assets to CMS
              </h3>
              <button
                onClick={() => {
                  if (!isUploading) setShowUploadModal(false);
                }}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Storage Capacity Telemetry (Strictly reflects real configured provider caps) */}
            <div className="mt-4 p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-amber-500" />
                  Active Cloud Upload Capacity
                </span>
                <button
                  type="button"
                  onClick={() => loadCapabilities(true)}
                  disabled={capabilitiesLoading}
                  className="text-[11px] text-slate-400 hover:text-amber-400 flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${capabilitiesLoading ? 'animate-spin' : ''}`} />
                  Refresh Limits
                </button>
              </div>
              {capabilities ? (
                <div className="space-y-1 text-[11px] text-slate-400 tabular-nums">
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-slate-300">
                    <span>
                      Cloudinary ({capabilities.cloudinary.plan}):{' '}
                      <strong className="text-white">
                        {formatBytes(capabilities.cloudinary.imageMaxBytes)} img/doc ·{' '}
                        {formatBytes(capabilities.cloudinary.videoMaxBytes)} video
                      </strong>
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>
                      Supabase TUS:{' '}
                      <strong className={capabilities.supabase.configured ? 'text-emerald-400' : 'text-slate-400'}>
                        {capabilities.supabase.configured
                          ? `Up to ${formatBytes(capabilities.supabase.effectiveMaxBytes)} (${capabilities.supabase.bucketName})`
                          : 'Not configured'}
                      </strong>
                    </span>
                  </div>
                  <div className="text-slate-400">
                    Verified max single file:{' '}
                    <strong className="text-amber-400">{formatBytes(capabilities.overallMaxUploadBytes)}</strong>
                    {capabilities.supports10Gb
                      ? ' (10 GB Resumable TUS Active)'
                      : ' (Direct chunked uploads bypass serverless 4.2 MB limit; 10 GB requires Supabase Pro+ bucket)'}
                  </div>
                  {capabilities.limitations.length > 0 && !capabilities.supports10Gb && (
                    <p className="text-[10px] text-amber-300/90 leading-relaxed">
                      {capabilities.limitations[0]}
                    </p>
                  )}
                </div>
              ) : (
                <p className="text-[11px] text-slate-400">Inspecting live Cloudinary &amp; Supabase storage limits...</p>
              )}
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-3 pt-4 text-sm">
              {uploadError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-xs">
                  {uploadError}
                </div>
              )}

              <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    uploadMode === 'file' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Upload Files (Direct / Chunked / TUS)
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    uploadMode === 'url' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Remote HTTPS URL
                </button>
              </div>

              {uploadMode === 'file' ? (
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(true);
                  }}
                  onDragLeave={() => setIsDraggingFile(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingFile(false);
                    if (e.dataTransfer.files?.length) {
                      enqueueFiles(e.dataTransfer.files);
                    }
                  }}
                  className={`rounded-xl border-2 border-dashed p-3.5 transition-colors space-y-2.5 ${
                    isDraggingFile ? 'border-amber-400 bg-amber-500/10' : 'border-slate-800 bg-slate-950'
                  }`}
                >
                  <label className="block text-xs font-medium text-slate-300">
                    Select or Drop Single / Multiple Files (Max{' '}
                    {capabilities ? formatBytes(capabilities.overallMaxUploadBytes) : 'Configured Limit'})
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="video/*,image/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.csv,.vtt,.zip"
                    onChange={(e) => {
                      if (e.target.files?.length) {
                        enqueueFiles(e.target.files);
                        e.target.value = '';
                      }
                    }}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-amber-400 hover:file:bg-slate-700 bg-slate-900 border border-slate-800 rounded-lg p-2"
                  />

                  {/* Multi-File Resumable Upload Queue */}
                  {uploadQueue.length > 0 && (
                    <div className="space-y-2 pt-1 max-h-56 overflow-y-auto">
                      {uploadQueue.map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 flex items-start gap-3 text-xs"
                        >
                          <div className="w-12 h-12 rounded bg-slate-950 border border-slate-800 overflow-hidden shrink-0 flex items-center justify-center">
                            {item.previewUrl && item.kind === 'image' ? (
                              <img src={item.previewUrl} alt={item.file.name} className="w-full h-full object-cover" />
                            ) : item.previewUrl && item.kind === 'video' ? (
                              <video src={item.previewUrl} className="w-full h-full object-cover" muted />
                            ) : (
                              <FileText className="w-5 h-5 text-slate-400" />
                            )}
                          </div>

                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-semibold text-white truncate" title={item.file.name}>
                                {item.file.name}
                              </span>
                              <span className="text-[11px] font-mono text-slate-400 shrink-0 tabular-nums">
                                {formatBytes(item.file.size)}
                              </span>
                            </div>

                            {item.duplicateMatch && item.status === 'queued' && (
                              <p className="text-[11px] text-amber-400">
                                Already in library as “{item.duplicateMatch.title}”. Upload anyway or remove.
                              </p>
                            )}

                            <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                              <div
                                className={`h-full origin-left transition-transform duration-150 ${
                                  item.status === 'error'
                                    ? 'bg-rose-500'
                                    : item.status === 'completed'
                                      ? 'bg-emerald-500'
                                      : item.status === 'paused'
                                        ? 'bg-sky-400'
                                        : 'bg-amber-500'
                                }`}
                                style={{ transform: `scaleX(${Math.max(0.02, item.percent / 100)})` }}
                              />
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-slate-400 tabular-nums gap-2">
                              <span className="truncate">{item.stageLabel}</span>
                              <span className="shrink-0 font-mono">
                                {item.percent}%
                                {item.speedBytesPerSec > 0 ? ` · ${formatSpeed(item.speedBytesPerSec)}` : ''}
                                {item.etaSeconds !== null && item.status === 'uploading'
                                  ? ` · ETA ${formatEta(item.etaSeconds)}`
                                  : ''}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            {(item.status === 'uploading' || item.status === 'paused') && (
                              <button
                                type="button"
                                onClick={() => togglePauseQueueItem(item.id)}
                                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-200"
                                title={item.status === 'paused' ? 'Resume Upload' : 'Pause Upload'}
                              >
                                {item.status === 'paused' ? (
                                  <Play className="w-3.5 h-3.5 text-emerald-400" />
                                ) : (
                                  <Pause className="w-3.5 h-3.5 text-amber-400" />
                                )}
                              </button>
                            )}
                            {(item.status === 'error' || item.status === 'cancelled') && !isUploading && (
                              <button
                                type="button"
                                onClick={() => retryQueueItem(item.id)}
                                className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-amber-400"
                                title="Retry Upload"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => removeQueueItem(item.id)}
                              className="p-1.5 rounded bg-slate-800 hover:bg-rose-600/20 text-slate-400 hover:text-rose-400"
                              title="Cancel & Remove"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Direct Media URL</label>
                  <input
                    type="url"
                    placeholder="https://example.com/construction-hero.mp4"
                    value={uploadUrlDirect}
                    onChange={(e) => setUploadUrlDirect(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              )}

              {(uploadMode === 'url' || uploadQueue.length <= 1) && (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Asset Title {uploadQueue.length <= 1 ? '*' : '(Auto-derived from filenames for batch)'}
                  </label>
                  <input
                    type="text"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                    required={uploadMode === 'url' || uploadQueue.length <= 1}
                  />
                </div>
              )}

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Folder</label>
                  <select
                    value={uploadFolder}
                    onChange={(e) => setUploadFolder(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-xs text-white"
                  >
                    {FOLDERS.filter((f) => f !== 'All').map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-xs text-white"
                  >
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Credit / Source</label>
                  <input
                    type="text"
                    value={uploadCreditSource}
                    onChange={(e) => setUploadCreditSource(e.target.value)}
                    placeholder="e.g., MADECC Site Team"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Alt Text (SEO)</label>
                  <input
                    type="text"
                    value={uploadAltText}
                    onChange={(e) => setUploadAltText(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={uploadTags}
                    onChange={(e) => setUploadTags(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Caption / Description</label>
                <input
                  type="text"
                  value={uploadDescription}
                  onChange={(e) => setUploadDescription(e.target.value)}
                  placeholder="Optional editorial caption or asset notes"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white"
                />
              </div>

              {isUploadVideo && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="text-[11px] font-bold text-amber-400">Video Metadata (Optional)</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="url"
                      value={uploadThumbnailUrl}
                      onChange={(e) => setUploadThumbnailUrl(e.target.value)}
                      placeholder="Poster Thumbnail URL"
                      className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                    />
                    <input
                      type="number"
                      value={uploadDurationSeconds}
                      onChange={(e) => setUploadDurationSeconds(e.target.value)}
                      placeholder="Duration (seconds)"
                      className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                    />
                  </div>
                  <input
                    type="url"
                    value={uploadSubtitlesUrl}
                    onChange={(e) => setUploadSubtitlesUrl(e.target.value)}
                    placeholder="Subtitles / Captions WebVTT (.vtt) URL"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                  />
                  <textarea
                    rows={2}
                    value={uploadTranscript}
                    onChange={(e) => setUploadTranscript(e.target.value)}
                    placeholder="Accessibility transcript text..."
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white"
                  />
                </div>
              )}

              {isUploading && uploadMode === 'url' && (
                <div className="space-y-1.5 pt-2">
                  <div className="flex justify-between text-[11px] text-slate-300 font-mono">
                    <span className="truncate pr-2">{uploadStatusLabel || 'Ingesting & Registering...'}</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full origin-left transition-transform duration-200"
                      style={{ transform: `scaleX(${Math.max(0.05, uploadProgress / 100)})` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    if (isUploading) {
                      uploadAbortController?.abort();
                      itemControllersRef.current.forEach((ctrl) => ctrl.abort());
                      pauseResolversRef.current.forEach((res) => res('abort'));
                    } else {
                      setShowUploadModal(false);
                    }
                  }}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
                >
                  {isUploading ? 'Abort Active Uploads' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isUploading
                    ? 'Uploading Queue...'
                    : uploadQueue.length > 1
                      ? `Upload ${uploadQueue.length} Files to Library`
                      : 'Save to Media Library'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Metadata Modal */}
      {editingMedia && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-500" /> Edit Media Metadata
              </h3>
              <button onClick={() => setEditingMedia(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 pt-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Folder</label>
                  <select
                    value={editFolder}
                    onChange={(e) => setEditFolder(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                  >
                    {FOLDERS.filter((f) => f !== 'All').map((f) => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                  >
                    {categories.filter((c) => c !== 'All').map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Alt Text (SEO)</label>
                <input
                  type="text"
                  value={editAltText}
                  onChange={(e) => setEditAltText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Caption</label>
                  <input
                    type="text"
                    value={editCaption}
                    onChange={(e) => setEditCaption(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Credit / Source</label>
                  <input
                    type="text"
                    value={editCreditSource}
                    onChange={(e) => setEditCreditSource(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Description</label>
                <input
                  type="text"
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Tags</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                />
              </div>

              {editingMedia.fileType === 'video' && (
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                  <div className="font-bold text-amber-400">Video Subtitles, Thumbnail &amp; Transcript</div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="url"
                      value={editThumbnailUrl}
                      onChange={(e) => setEditThumbnailUrl(e.target.value)}
                      placeholder="Poster Thumbnail URL"
                      className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                    />
                    <input
                      type="number"
                      value={editDurationSeconds}
                      onChange={(e) => setEditDurationSeconds(e.target.value)}
                      placeholder="Duration (sec)"
                      className="bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <input
                    type="url"
                    value={editSubtitlesUrl}
                    onChange={(e) => setEditSubtitlesUrl(e.target.value)}
                    placeholder="Subtitles URL (.vtt)"
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                  />
                  <textarea
                    rows={2}
                    value={editTranscript}
                    onChange={(e) => setEditTranscript(e.target.value)}
                    placeholder="Transcript..."
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-white"
                  />
                </div>
              )}

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingMedia(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEdit}
                  className="px-4 py-1.5 bg-amber-500 text-slate-950 font-bold rounded"
                >
                  {isSavingEdit ? 'Saving...' : 'Update Details'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Asset Usage Check Modal */}
      {usageModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-sky-400" /> Asset Reference Checker
              </h3>
              <button onClick={() => setUsageModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-300 font-semibold">{usageModal.item.title}</p>
            {usageModal.loading ? (
              <p className="text-xs text-slate-400">Scanning Neon DB pages, banners, services, projects &amp; legal documents...</p>
            ) : usageModal.usedIn.length === 0 ? (
              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300">
                No active references found across CMS pages, services, projects, blogs, hero banners, or legal documents. Safe to delete.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto">
                <div className="text-xs text-amber-300 font-semibold">
                  Referenced in {usageModal.usedIn.length} location(s):
                </div>
                {usageModal.usedIn.map((loc, i) => (
                  <div key={i} className="px-2.5 py-1.5 rounded bg-slate-950 border border-slate-800 text-xs text-slate-200 font-mono">
                    {loc}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Replace Asset Modal */}
      {replaceModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Replace className="w-4 h-4 text-emerald-400" /> Replace Media Asset
              </h3>
              <button onClick={() => setReplaceModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmitReplace} className="space-y-3 pt-4 text-xs">
              <p className="text-slate-300">
                Replacing: <strong>{replaceModal.title}</strong>
              </p>
              <div>
                <label className="block text-slate-400 mb-1">Upload Replacement File (Optional)</label>
                <input
                  type="file"
                  onChange={(e) => setReplaceFile(e.target.files?.[0] || null)}
                  className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-slate-300"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">Or Replacement HTTPS URL</label>
                <input
                  type="url"
                  value={replaceUrl}
                  onChange={(e) => setReplaceUrl(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                  required={!replaceFile}
                />
              </div>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={replaceUpdateRefs}
                  onChange={(e) => setReplaceUpdateRefs(e.target.checked)}
                />
                <span>Automatically update Hero Banner image/video references</span>
              </label>
              {isReplacing && replaceProgressText && (
                <p className="text-[11px] font-mono text-amber-300 truncate">{replaceProgressText}</p>
              )}
              <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setReplaceModal(null)}
                  className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReplacing}
                  className="px-4 py-1.5 bg-emerald-500 text-slate-950 font-bold rounded disabled:opacity-50"
                >
                  {isReplacing ? 'Replacing...' : 'Replace Asset'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Referenced Asset Delete Confirmation Modal */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-rose-500/40 rounded-xl max-w-md w-full p-5 shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-rose-400 font-bold text-sm">
              <AlertTriangle className="w-4 h-4" />
              <span>Asset In Use — Confirm Deletion</span>
            </div>
            <p className="text-xs text-slate-300">{deleteConfirmModal.message}</p>
            {deleteConfirmModal.usedIn.length > 0 && (
              <div className="max-h-36 overflow-y-auto space-y-1">
                {deleteConfirmModal.usedIn.map((loc, idx) => (
                  <div key={idx} className="text-[11px] font-mono bg-slate-950 border border-slate-800 px-2 py-1 rounded text-amber-300">
                    {loc}
                  </div>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setDeleteConfirmModal(null)}
                className="px-3 py-1.5 bg-slate-800 text-slate-300 rounded text-xs"
              >
                Keep Asset
              </button>
              <button
                onClick={() => handleAttemptDelete(deleteConfirmModal.item, true)}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded text-xs"
              >
                Force Delete Anyway
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {previewVideoUrl && (
        <div className="fixed inset-0 z-50 bg-slate-950/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="max-w-4xl w-full bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl relative">
            <button
              onClick={() => setPreviewVideoUrl(null)}
              className="absolute top-4 right-4 z-20 p-2 bg-slate-950/80 text-white rounded-full hover:bg-rose-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <video src={previewVideoUrl} controls autoPlay className="w-full aspect-video object-contain bg-black" />
          </div>
        </div>
      )}
    </div>
  );
}
