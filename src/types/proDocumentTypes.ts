export type ProDocumentStatus = 'DRAFT' | 'UNDER_REVIEW' | 'APPROVED' | 'PUBLISHED' | 'ARCHIVED';
export type ProDocumentVisibility = 'PRIVATE' | 'INTERNAL' | 'PUBLIC';
export type ProDocumentOrientation = 'portrait' | 'landscape';
export type ProDocumentShareAccess = 'VIEW_ONLY' | 'EDIT';

export interface ProDocumentSignatureBlock {
  enabled: boolean;
  leftHeading?: string;
  leftSignerName?: string;
  leftSignerRole?: string;
  leftSignedDate?: string;
  leftSignatureDataUrl?: string;
  rightHeading?: string;
  rightSignerName?: string;
  rightSignerRole?: string;
  rightSignedDate?: string;
  rightSignatureDataUrl?: string;
  includeCompanyStamp?: boolean;
}

export interface ProDocumentMetadata {
  author?: string;
  department?: string;
  recipientName?: string;
  recipientOrganization?: string;
  recipientEmail?: string;
  referenceCode?: string;
  projectLocation?: string;
  effectiveDate?: string;
  expiryDate?: string;
  keywords?: string[];
  companyName?: string;
  companyWebsite?: string;
  companyEmail?: string;
  companyPhone?: string;
  companyAddress?: string;
}

export interface ProDocument {
  id: number;
  title: string;
  documentNumber: string;
  category: string;
  description?: string | null;
  contentJson: any;
  contentHtml: string;
  templateId?: number | null;
  status: ProDocumentStatus;
  visibility: ProDocumentVisibility;
  isConfidential: boolean;
  pageSize: string;
  orientation: ProDocumentOrientation;
  marginMm: number;
  headerText?: string | null;
  footerText?: string | null;
  showPageNumbers: boolean;
  showConfidentialityFooter: boolean;
  signatureBlock: ProDocumentSignatureBlock;
  metadata: ProDocumentMetadata;
  storedPdfUrl?: string | null;
  storedDocxUrl?: string | null;
  version: number;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string | null;
  archivedAt?: string | null;
  activeSharesCount?: number;
  versionsCount?: number;
  exportsCount?: number;
}

export interface ProDocumentTemplate {
  id: number;
  name: string;
  slug: string;
  category: string;
  description?: string | null;
  contentJson: any;
  contentHtml: string;
  defaultOrientation: ProDocumentOrientation;
  defaultVisibility: ProDocumentVisibility;
  defaultHeaderText?: string | null;
  defaultFooterText?: string | null;
  isConfidential: boolean;
  isSystem: boolean;
  version: number;
  createdBy?: string | null;
  updatedBy?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProDocumentVersion {
  id: number;
  documentId: number;
  versionNumber: number;
  title: string;
  category: string;
  status: ProDocumentStatus;
  contentJson: any;
  contentHtml: string;
  headerText?: string | null;
  footerText?: string | null;
  signatureBlock?: ProDocumentSignatureBlock | null;
  metadata?: ProDocumentMetadata | null;
  changeSummary?: string | null;
  createdBy?: string | null;
  createdAt: string;
}

export interface ProDocumentShare {
  id: number;
  documentId: number;
  tokenPrefix: string;
  accessType: ProDocumentShareAccess;
  recipientEmail?: string | null;
  recipientName?: string | null;
  expiresAt?: string | null;
  revokedAt?: string | null;
  revokedBy?: string | null;
  accessCount: number;
  lastAccessedAt?: string | null;
  createdBy?: string | null;
  createdAt: string;
  shareUrl?: string;
}

export interface ProDocumentExportRecord {
  id: number;
  documentId: number;
  format: 'PDF' | 'DOCX';
  fileName: string;
  fileUrl?: string | null;
  storageProvider: 'supabase' | 'cloudinary' | 'local';
  storagePath?: string | null;
  fileSizeBytes: number;
  orientation: ProDocumentOrientation;
  versionAtExport: number;
  createdBy?: string | null;
  createdAt: string;
}

export interface ProDocumentSettings {
  id: number;
  defaultPageSize: string;
  defaultOrientation: ProDocumentOrientation;
  defaultMarginMm: number;
  autoSaveIntervalSec: number;
  defaultHeaderText: string;
  defaultFooterText: string;
  confidentialityNotice: string;
  requireApprovalBeforePublish: boolean;
  defaultConfidentialSharingPrivate: boolean;
  brandPrimaryColor: string;
  brandAccentColor: string;
  updatedBy?: string | null;
  updatedAt: string;
}

export interface ProDocDashboardStats {
  totalDocuments: number;
  draftCount: number;
  underReviewCount: number;
  approvedCount: number;
  publishedCount: number;
  archivedCount: number;
  sharedCount: number;
  templatesCount: number;
  exportsCount: number;
  recentDocuments: ProDocument[];
  recentExports: (ProDocumentExportRecord & { documentTitle?: string; documentNumber?: string })[];
}
