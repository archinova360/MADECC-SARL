import React, { useState, useEffect } from 'react';
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
  Filter, 
  Sparkles,
  ExternalLink,
  CheckCircle2,
  X,
  Play
} from 'lucide-react';
import { MediaItem } from '../types.ts';
import { getCsrfHeaders } from '../lib/csrf.ts';
import { getOptimizedImageUrl } from '../lib/utils.ts';
import { getAuthToken } from '../lib/firebase.ts';

interface CmsMediaLibraryProps {
  onSelectMedia?: (media: MediaItem) => void;
  isPickerMode?: boolean;
  filterType?: 'all' | 'image' | 'video' | 'document' | 'logo';
}

export default function CmsMediaLibrary({
  onSelectMedia,
  isPickerMode = false,
  filterType: initialFilterType = 'all'
}: CmsMediaLibraryProps) {
  const [mediaList, setMediaList] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState<string>(initialFilterType);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('General');
  const [uploadAltText, setUploadAltText] = useState('');
  const [uploadCaption, setUploadCaption] = useState('');
  const [uploadTags, setUploadTags] = useState('');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const [uploadUrlDirect, setUploadUrlDirect] = useState('');
  const [uploadMode, setUploadMode] = useState<'file' | 'url'>('file');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadError, setUploadError] = useState('');

  // Edit modal state
  const [editingMedia, setEditingMedia] = useState<MediaItem | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editAltText, setEditAltText] = useState('');
  const [editCaption, setEditCaption] = useState('');
  const [editCategory, setEditCategory] = useState('General');
  const [editTags, setEditTags] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

  // Video preview player modal
  const [previewVideoUrl, setPreviewVideoUrl] = useState<string | null>(null);

  const categories = ['All', 'Hero Media', 'Projects', 'Services', 'Logos', 'Certifications', 'Site Photos', 'General'];
  const mediaTypes = [
    { label: 'All Media', value: 'all' },
    { label: 'Videos', value: 'video' },
    { label: 'Images', value: 'image' },
    { label: 'Logos & Badges', value: 'logo' },
    { label: 'Documents', value: 'document' }
  ];

  const fetchMedia = async () => {
    setLoading(true);
    try {
      let url = `/api/cms/media?category=${selectedCategory}&fileType=${selectedType}`;
      if (searchQuery) url += `&search=${encodeURIComponent(searchQuery)}`;
      
      const res = await fetch(url);
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

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim()) {
      setUploadError('Please provide a title for the media item.');
      return;
    }

    setIsUploading(true);
    setUploadError('');
    setUploadProgress(15);

    try {
      let finalFileUrl = uploadUrlDirect;
      let finalFileType: 'image' | 'video' | 'document' | 'logo' = 'image';
      let mimeType = 'image/jpeg';
      let fileSize = 0;

      if (uploadMode === 'file' && uploadFile) {
        const formData = new FormData();
        formData.append('file', uploadFile);
        formData.append('folder', 'madecc_cms_media');

        setUploadProgress(40);
        const csrf = await getCsrfHeaders();
        const authToken = await getAuthToken();
        const uploadHeaders: Record<string, string> = { ...csrf };
        if (authToken) {
          uploadHeaders['Authorization'] = `Bearer ${authToken}`;
        }
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          headers: uploadHeaders,
          body: formData
        });

        if (!uploadRes.ok) {
          const errData = await uploadRes.json().catch(() => ({}));
          throw new Error(errData.error || 'Failed to upload asset to cloud storage');
        }

        const uploadData = await uploadRes.json();
        finalFileUrl = uploadData.url;
        mimeType = uploadFile.type;
        fileSize = uploadFile.size;

        if (uploadFile.type.startsWith('video/')) {
          finalFileType = 'video';
        } else if (uploadCategory === 'Logos') {
          finalFileType = 'logo';
        } else if (uploadFile.type.includes('pdf') || uploadFile.type.includes('doc')) {
          finalFileType = 'document';
        } else {
          finalFileType = 'image';
        }
      } else {
        if (!uploadUrlDirect.trim()) {
          throw new Error('Please enter a valid media URL.');
        }
        if (uploadUrlDirect.endsWith('.mp4') || uploadUrlDirect.endsWith('.webm') || uploadUrlDirect.includes('video')) {
          finalFileType = 'video';
          mimeType = 'video/mp4';
        } else if (uploadCategory === 'Logos') {
          finalFileType = 'logo';
        } else {
          finalFileType = 'image';
        }
      }

      setUploadProgress(80);

      // Register in CMS Media Library Database
      const tagsArray = uploadTags.split(',').map(t => t.trim()).filter(Boolean);
      const csrf = await getCsrfHeaders();
      const authToken = await getAuthToken();
      const mediaHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...csrf
      };
      if (authToken) {
        mediaHeaders['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch('/api/cms/media', {
        method: 'POST',
        headers: mediaHeaders,
        body: JSON.stringify({
          title: uploadTitle,
          fileUrl: finalFileUrl,
          fileType: finalFileType,
          mimeType,
          fileSize,
          altText: uploadAltText || uploadTitle,
          caption: uploadCaption,
          category: uploadCategory,
          tags: tagsArray
        })
      });

      if (!res.ok) {
        const resErr = await res.json().catch(() => ({}));
        throw new Error(resErr.error || 'Failed to register media in database');
      }

      setUploadProgress(100);
      setShowUploadModal(false);
      // Reset form
      setUploadTitle('');
      setUploadAltText('');
      setUploadCaption('');
      setUploadTags('');
      setUploadFile(null);
      setUploadUrlDirect('');
      fetchMedia();
    } catch (err: any) {
      setUploadError(err.message || 'Upload process failed');
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenEdit = (item: MediaItem) => {
    setEditingMedia(item);
    setEditTitle(item.title);
    setEditAltText(item.altText || '');
    setEditCaption(item.caption || '');
    setEditCategory(item.category || 'General');
    setEditTags(Array.isArray(item.tags) ? item.tags.join(', ') : '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingMedia) return;

    setIsSavingEdit(true);
    try {
      const tagsArray = editTags.split(',').map(t => t.trim()).filter(Boolean);
      const csrf = await getCsrfHeaders();
      const authToken = await getAuthToken();
      const editHeaders: Record<string, string> = {
        'Content-Type': 'application/json',
        ...csrf
      };
      if (authToken) {
        editHeaders['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`/api/cms/media/${editingMedia.id}`, {
        method: 'PUT',
        headers: editHeaders,
        body: JSON.stringify({
          title: editTitle,
          altText: editAltText,
          caption: editCaption,
          category: editCategory,
          tags: tagsArray
        })
      });

      if (res.ok) {
        setEditingMedia(null);
        fetchMedia();
      }
    } catch (err) {
      console.error('Failed to update media item:', err);
    } finally {
      setIsSavingEdit(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this media asset? Any sections referencing it may show fallback imagery.')) {
      return;
    }

    try {
      const csrf = await getCsrfHeaders();
      const authToken = await getAuthToken();
      const delHeaders: Record<string, string> = { ...csrf };
      if (authToken) {
        delHeaders['Authorization'] = `Bearer ${authToken}`;
      }

      const res = await fetch(`/api/cms/media/${id}`, {
        method: 'DELETE',
        headers: delHeaders
      });
      if (res.ok) {
        setMediaList(prev => prev.filter(m => m.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete media asset:', err);
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-xl text-slate-200" id="cms-media-library">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Film className="w-5 h-5 text-amber-500" /> Central Media & Video Library
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Store, preview, and manage all high-definition videos, site photos, blueprints, and branding assets.
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
        {/* Search */}
        <div className="sm:col-span-5 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, filename, tags..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/70"
          />
        </div>

        {/* Category Filter */}
        <div className="sm:col-span-4">
          <select
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/70"
          >
            {categories.map(c => (
              <option key={c} value={c}>{c === 'All' ? 'All Categories' : c}</option>
            ))}
          </select>
        </div>

        {/* Type Filter */}
        <div className="sm:col-span-3">
          <select
            value={selectedType}
            onChange={e => setSelectedType(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-slate-200 focus:outline-none focus:border-amber-500/70"
          >
            {mediaTypes.map(t => (
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
      ) : mediaList.length === 0 ? (
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
          {mediaList.map(item => {
            const isVideo = item.fileType === 'video' || item.fileUrl?.endsWith('.mp4') || item.fileUrl?.endsWith('.webm');

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
                        className="w-full h-full object-cover"
                        preload="metadata"
                        muted
                      />
                      <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center">
                        <button
                          onClick={() => setPreviewVideoUrl(item.fileUrl)}
                          className="w-10 h-10 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                          title="Watch Live Video Reel"
                        >
                          <Play className="w-4 h-4 fill-current ml-0.5" />
                        </button>
                      </div>
                      <span className="absolute top-2 left-2 px-2 py-0.5 bg-rose-500/90 text-white font-mono text-[10px] font-bold rounded">
                        HD VIDEO
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

                  {/* Category Pill */}
                  <span className="absolute top-2 right-2 px-2 py-0.5 bg-slate-900/80 backdrop-blur-sm border border-slate-700 text-slate-300 font-mono text-[10px] rounded">
                    {item.category}
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
                            <><Check className="w-3.5 h-3.5 text-emerald-400" /> Copied</>
                          ) : (
                            <><Copy className="w-3.5 h-3.5" /> Copy Link</>
                          )}
                        </button>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(item)}
                            className="p-1 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
                            title="Edit Metadata"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(item.id)}
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

      {/* Upload Media Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-lg w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-amber-500" /> Upload Asset to CMS
              </h3>
              <button
                onClick={() => setShowUploadModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 pt-4 text-sm">
              {uploadError && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/30 text-rose-300 rounded-lg text-xs">
                  {uploadError}
                </div>
              )}

              {/* Upload Mode Selector */}
              <div className="flex rounded-lg bg-slate-950 p-1 border border-slate-800">
                <button
                  type="button"
                  onClick={() => setUploadMode('file')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    uploadMode === 'file' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Upload File (Video / Photo)
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('url')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    uploadMode === 'url' ? 'bg-amber-500 text-slate-950 shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Direct HTTPS URL
                </button>
              </div>

              {uploadMode === 'file' ? (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Select Media File (MP4, WebM, JPG, PNG, WebP)
                  </label>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,image/*,application/pdf"
                    onChange={e => {
                      if (e.target.files?.[0]) {
                        setUploadFile(e.target.files[0]);
                        if (!uploadTitle) {
                          setUploadTitle(e.target.files[0].name.replace(/\.[^/.]+$/, ''));
                        }
                      }
                    }}
                    className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-slate-800 file:text-amber-400 hover:file:bg-slate-700 bg-slate-950 border border-slate-800 rounded-lg p-2"
                  />
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1.5">
                    Direct Media URL (CDN / Cloudinary / Mixkit / Unsplash)
                  </label>
                  <input
                    type="url"
                    placeholder="https://example.com/construction-hero.mp4"
                    value={uploadUrlDirect}
                    onChange={e => setUploadUrlDirect(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Asset Title *</label>
                <input
                  type="text"
                  placeholder="e.g., Yaoundé Multi-Storey Concrete Frame 4K Reel"
                  value={uploadTitle}
                  onChange={e => setUploadTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Category</label>
                  <select
                    value={uploadCategory}
                    onChange={e => setUploadCategory(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  >
                    {categories.filter(c => c !== 'All').map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    placeholder="hero, video, concrete"
                    value={uploadTags}
                    onChange={e => setUploadTags(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Accessibility Alt Text</label>
                <input
                  type="text"
                  placeholder="Descriptive sentence for screen readers & SEO"
                  value={uploadAltText}
                  onChange={e => setUploadAltText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              {isUploading && (
                <div className="space-y-1 pt-2">
                  <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                    <span>Uploading & Optimizing...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isUploading ? (
                    <><RefreshCw className="w-3.5 h-3.5 animate-spin" /> Processing...</>
                  ) : (
                    <><Check className="w-3.5 h-3.5" /> Save to Media Library</>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Metadata Modal */}
      {editingMedia && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 shadow-2xl animate-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-500" /> Edit Media Metadata
              </h3>
              <button
                onClick={() => setEditingMedia(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 pt-4 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Title</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={e => setEditTitle(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                  required
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Alt Text (SEO)</label>
                <input
                  type="text"
                  value={editAltText}
                  onChange={e => setEditAltText(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Category</label>
                <select
                  value={editCategory}
                  onChange={e => setEditCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                >
                  {categories.filter(c => c !== 'All').map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Tags</label>
                <input
                  type="text"
                  value={editTags}
                  onChange={e => setEditTags(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-white"
                />
              </div>

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
            <video
              src={previewVideoUrl}
              controls
              autoPlay
              className="w-full aspect-video object-contain bg-black"
            />
          </div>
        </div>
      )}
    </div>
  );
}
