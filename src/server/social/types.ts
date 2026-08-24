export type PublishStatus =
  | 'queued'
  | 'uploading'
  | 'processing'
  | 'verifying'
  | 'published'
  | 'failed'
  | 'not_connected'
  | 'requires_review'
  | 'message_accepted'
  | 'delivered';

export type SocialPlatform =
  | 'facebook'
  | 'instagram'
  | 'youtube'
  | 'whatsapp'
  | 'tiktok'
  | 'linkedin'
  | 'twitter'
  | 'custom';

export interface MediaAsset {
  id: string;
  originalFilename?: string;
  mediaType: 'image' | 'video' | 'audio' | 'document';
  mimeType?: string;
  fileSize?: number;
  width?: number;
  height?: number;
  duration?: number;
  storageProvider?: string;
  publicUrl: string;
  secureUrl?: string;
  platformCompatibility?: Record<SocialPlatform, boolean>;
}

export type PlatformPublishType =
  | 'image'
  | 'video'
  | 'carousel'
  | 'reel'
  | 'short'
  | 'message'
  | 'photo_post'
  | 'link_post'
  | 'text_only';

export interface PlatformMediaPlan {
  platform: SocialPlatform;
  compatible: boolean;
  publishType: PlatformPublishType;
  assets: MediaAsset[];
  warnings: string[];
  errors: string[];
}

export interface SocialPublishResult {
  success: boolean;
  platform: SocialPlatform;
  status: PublishStatus;
  remotePostId?: string;
  remoteMediaId?: string;
  publishId?: string;
  permalink?: string;
  verified: boolean;
  verificationMethod?: 'platform_api' | 'webhook' | 'platform_status' | 'accepted_only';
  errorCode?: string;
  errorMessage?: string;
  actionRequired?: string;
  httpStatus?: number;
  publishedAt?: string;
  metadata?: Record<string, any>;
}

export interface PublishDestinationJob {
  jobId: string;
  postId?: number | string;
  campaignName?: string;
  platform: SocialPlatform;
  destinationName: string;
  status: PublishStatus;
  attempt: number;
  externalPostId?: string;
  externalUrl?: string;
  errorCode?: string;
  errorMessage?: string;
  verified: boolean;
  verificationMethod?: string;
  mediaUrl?: string;
  mediaType?: string;
  startedAt: string;
  completedAt?: string;
}

export interface BroadcastRequest {
  postId?: number | string;
  campaignName?: string;
  title?: string;
  caption?: string;
  hashtags?: string;
  ctaText?: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'video' | 'carousel' | 'document' | 'auto';
  mediaAssets?: Array<{
    id?: string;
    url?: string;
    type?: string;
    name?: string;
    size?: number;
  }>;
  targetPlatforms?: string[];
  targetWebhookIds?: number[];
  db?: any;
}

export interface BroadcastExecutionResult {
  success: boolean;
  broadcastId: string;
  overallStatus: 'PUBLISHED' | 'PARTIALLY_PUBLISHED' | 'FAILED' | 'PENDING_PROCESSING';
  totalDestinations: number;
  successCount: number;
  processingCount: number;
  failureCount: number;
  publishedAt: string;
  jobs: SocialPublishResult[];
  message: string;
}

export interface PreflightPlatformDiagnostic {
  platform: SocialPlatform;
  name: string;
  ready: boolean;
  status: 'READY' | 'WARNING' | 'NOT_CONNECTED' | 'INCOMPATIBLE_MEDIA' | 'ERROR';
  accountStatus: 'CONNECTED' | 'NOT_CONNECTED' | 'EXPIRED' | 'UNCONFIGURED';
  accountName?: string;
  accountId?: string;
  tokenStatus: string;
  permissionsValid: boolean;
  mediaPlan: PlatformMediaPlan;
  issues: string[];
  recommendations: string[];
}
