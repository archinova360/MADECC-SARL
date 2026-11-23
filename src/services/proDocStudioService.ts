import { getAuthToken } from '../lib/firebase.ts';
import { getCsrfHeaders } from '../lib/csrf.ts';
import { uploadMediaAssetDirect } from '../lib/directMediaUpload.ts';
import {
  ProDocument,
  ProDocumentTemplate,
  ProDocumentVersion,
  ProDocumentShare,
  ProDocumentExportRecord,
  ProDocumentSettings,
  ProDocDashboardStats,
  ProDocumentStatus,
  ProDocumentVisibility,
  ProDocumentOrientation,
  ProDocumentShareAccess,
  ProDocumentSignatureBlock,
  ProDocumentMetadata,
} from '../types/proDocumentTypes.ts';

export interface VerifiedCompanyInfo {
  companyName: string;
  tagline: string;
  website: string;
  phone: string;
  email: string;
  officeYaounde: string;
  officeDouala: string;
  legalStatus: string;
  rccmNumber: string;
  niuTaxId: string;
  logoUrl: string;
}

export class VersionConflictError extends Error {
  serverVersion: number;
  serverDocument?: ProDocument;
  constructor(message: string, serverVersion: number, serverDocument?: ProDocument) {
    super(message);
    this.name = 'VersionConflictError';
    this.serverVersion = serverVersion;
    this.serverDocument = serverDocument;
  }
}

async function buildHeaders(isJson = true): Promise<Record<string, string>> {
  const [token, csrf] = await Promise.all([getAuthToken(), getCsrfHeaders()]);
  const headers: Record<string, string> = {
    ...csrf,
  };
  if (isJson) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function handleJsonResponse<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text || `HTTP ${res.status}` };
  }

  if (res.status === 409 && data?.error === 'VERSION_CONFLICT') {
    throw new VersionConflictError(
      data.message || 'Document version conflict detected.',
      Number(data.serverVersion || 0),
      data.serverDocument
    );
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Request failed (${res.status})`);
  }

  return data as T;
}

export const proDocStudioService = {
  async getDashboard(): Promise<ProDocDashboardStats> {
    const headers = await buildHeaders(false);
    const res = await fetch('/api/doc-studio/dashboard', {
      credentials: 'include',
      headers,
    });
    return handleJsonResponse<ProDocDashboardStats>(res);
  },

  async getSettings(): Promise<{ settings: ProDocumentSettings | null; verifiedCompany: VerifiedCompanyInfo }> {
    const headers = await buildHeaders(false);
    const res = await fetch('/api/doc-studio/settings', {
      credentials: 'include',
      headers,
    });
    return handleJsonResponse<{ settings: ProDocumentSettings | null; verifiedCompany: VerifiedCompanyInfo }>(res);
  },

  async updateSettings(payload: Partial<ProDocumentSettings>): Promise<{ success: boolean; settings: ProDocumentSettings }> {
    const headers = await buildHeaders(true);
    const res = await fetch('/api/doc-studio/settings', {
      method: 'PUT',
      credentials: 'include',
      headers,
      body: JSON.stringify(payload),
    });
    return handleJsonResponse<{ success: boolean; settings: ProDocumentSettings }>(res);
  },

  async listTemplates(): Promise<ProDocumentTemplate[]> {
    const headers = await buildHeaders(false);
    const res = await fetch('/api/doc-studio/templates', {
      credentials: 'include',
      headers,
    });
    return handleJsonResponse<ProDocumentTemplate[]>(res);
  },

  async createTemplate(payload: Partial<ProDocumentTemplate>): Promise<ProDocumentTemplate> {
    const headers = await buildHeaders(true);
    const res = await fetch('/api/doc-studio/templates', {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(payload),
    });
    return handleJsonResponse<ProDocumentTemplate>(res);
  },

  async updateTemplate(id: number, payload: Partial<ProDocumentTemplate>): Promise<ProDocumentTemplate> {
    const headers = await buildHeaders(true);
    const res = await fetch(`/api/doc-studio/templates/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers,
      body: JSON.stringify(payload),
    });
    return handleJsonResponse<ProDocumentTemplate>(res);
  },

  async duplicateTemplate(id: number): Promise<ProDocumentTemplate> {
    const headers = await buildHeaders(true);
    const res = await fetch(`/api/doc-studio/templates/${id}/duplicate`, {
      method: 'POST',
      credentials: 'include',
      headers,
    });
    return handleJsonResponse<ProDocumentTemplate>(res);
  },

  async deleteTemplate(id: number): Promise<{ success: boolean; id: number }> {
    const headers = await buildHeaders(false);
    const res = await fetch(`/api/doc-studio/templates/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers,
    });
    return handleJsonResponse<{ success: boolean; id: number }>(res);
  },

  async listDocuments(params?: {
    q?: string;
    status?: ProDocumentStatus | 'ALL';
    category?: string;
    sharedOnly?: boolean;
    sort?: 'updated_desc' | 'updated_asc' | 'title_asc' | 'created_desc';
  }): Promise<ProDocument[]> {
    const headers = await buildHeaders(false);
    const qs = new URLSearchParams();
    if (params?.q) qs.set('q', params.q);
    if (params?.status && params.status !== 'ALL') qs.set('status', params.status);
    if (params?.category && params.category !== 'ALL') qs.set('category', params.category);
    if (params?.sharedOnly) qs.set('sharedOnly', 'true');
    if (params?.sort) qs.set('sort', params.sort);
    const queryStr = qs.toString() ? `?${qs.toString()}` : '';
    const res = await fetch(`/api/doc-studio/documents${queryStr}`, {
      credentials: 'include',
      headers,
    });
    return handleJsonResponse<ProDocument[]>(res);
  },

  async getDocument(id: number): Promise<{
    document: ProDocument;
    versions: ProDocumentVersion[];
    shares: ProDocumentShare[];
    exports: ProDocumentExportRecord[];
  }> {
    const headers = await buildHeaders(false);
    const res = await fetch(`/api/doc-studio/documents/${id}`, {
      credentials: 'include',
      headers,
    });
    return handleJsonResponse(res);
  },

  async createDocument(payload: {
    title: string;
    category?: string;
    description?: string;
    templateId?: number | null;
    contentJson?: any;
    contentHtml?: string;
    visibility?: ProDocumentVisibility;
    isConfidential?: boolean;
    orientation?: ProDocumentOrientation;
    marginMm?: number;
    headerText?: string;
    footerText?: string;
    showPageNumbers?: boolean;
    showConfidentialityFooter?: boolean;
    signatureBlock?: ProDocumentSignatureBlock;
    metadata?: ProDocumentMetadata;
  }): Promise<ProDocument> {
    const headers = await buildHeaders(true);
    const res = await fetch('/api/doc-studio/documents', {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(payload),
    });
    return handleJsonResponse<ProDocument>(res);
  },

  async updateDocument(
    id: number,
    payload: Partial<ProDocument> & {
      expectedVersion?: number;
      forceOverwrite?: boolean;
      isAutoSave?: boolean;
      saveVersionSnapshot?: boolean;
      changeSummary?: string;
    }
  ): Promise<{ success: boolean; document: ProDocument }> {
    const headers = await buildHeaders(true);
    const res = await fetch(`/api/doc-studio/documents/${id}`, {
      method: 'PUT',
      credentials: 'include',
      headers,
      body: JSON.stringify(payload),
    });
    return handleJsonResponse<{ success: boolean; document: ProDocument }>(res);
  },

  async transitionStatus(
    id: number,
    status: ProDocumentStatus,
    visibility?: ProDocumentVisibility
  ): Promise<{ success: boolean; document: ProDocument }> {
    const headers = await buildHeaders(true);
    const res = await fetch(`/api/doc-studio/documents/${id}/status`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({ status, visibility }),
    });
    return handleJsonResponse<{ success: boolean; document: ProDocument }>(res);
  },

  async duplicateDocument(id: number): Promise<ProDocument> {
    const headers = await buildHeaders(true);
    const res = await fetch(`/api/doc-studio/documents/${id}/duplicate`, {
      method: 'POST',
      credentials: 'include',
      headers,
    });
    return handleJsonResponse<ProDocument>(res);
  },

  async deleteDocument(id: number): Promise<{ success: boolean; id: number }> {
    const headers = await buildHeaders(false);
    const res = await fetch(`/api/doc-studio/documents/${id}`, {
      method: 'DELETE',
      credentials: 'include',
      headers,
    });
    return handleJsonResponse<{ success: boolean; id: number }>(res);
  },

  async listVersions(id: number): Promise<ProDocumentVersion[]> {
    const headers = await buildHeaders(false);
    const res = await fetch(`/api/doc-studio/documents/${id}/versions`, {
      credentials: 'include',
      headers,
    });
    return handleJsonResponse<ProDocumentVersion[]>(res);
  },

  async restoreVersion(id: number, versionId: number): Promise<{ success: boolean; document: ProDocument }> {
    const headers = await buildHeaders(true);
    const res = await fetch(`/api/doc-studio/documents/${id}/versions/${versionId}/restore`, {
      method: 'POST',
      credentials: 'include',
      headers,
    });
    return handleJsonResponse<{ success: boolean; document: ProDocument }>(res);
  },

  async storeExport(
    documentId: number,
    fileBlob: Blob,
    fileName: string,
    format: 'PDF' | 'DOCX',
    orientation: ProDocumentOrientation
  ): Promise<{
    success: boolean;
    exportRecord: ProDocumentExportRecord;
    authorizedDownloadUrl: string;
    directSignedUrl: string | null;
  }> {
    const headers = await buildHeaders(false);
    const formData = new FormData();
    formData.append('file', fileBlob, fileName);
    formData.append('format', format);
    formData.append('orientation', orientation);

    const res = await fetch(`/api/doc-studio/documents/${documentId}/store-export`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: formData,
    });
    return handleJsonResponse(res);
  },

  async downloadAuthorizedExport(exportId: number, fallbackFilename: string, shareToken?: string): Promise<void> {
    const headers = await buildHeaders(false);
    const url = shareToken
      ? `/api/doc-studio/exports/${exportId}/download?docShare=${encodeURIComponent(shareToken)}`
      : `/api/doc-studio/exports/${exportId}/download`;

    const res = await fetch(url, {
      credentials: 'include',
      headers,
    });
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.error || `Failed to download export (${res.status})`);
    }
    const blob = await res.blob();
    const objUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = objUrl;
    a.download = fallbackFilename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(objUrl), 2500);
  },

  async createShare(
    documentId: number,
    payload: {
      accessType: ProDocumentShareAccess;
      recipientEmail?: string;
      recipientName?: string;
      expiresInDays?: number | null;
      neverExpires?: boolean;
      sendEmail?: boolean;
    }
  ): Promise<{ success: boolean; share: ProDocumentShare & { shareUrl: string }; emailSent: boolean }> {
    const headers = await buildHeaders(true);
    const res = await fetch(`/api/doc-studio/documents/${documentId}/shares`, {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify(payload),
    });
    return handleJsonResponse(res);
  },

  async revokeShare(shareId: number): Promise<{ success: boolean; share: ProDocumentShare }> {
    const headers = await buildHeaders(true);
    const res = await fetch(`/api/doc-studio/shares/${shareId}/revoke`, {
      method: 'POST',
      credentials: 'include',
      headers,
    });
    return handleJsonResponse(res);
  },

  async getSharedDocument(token: string): Promise<{
    success: boolean;
    accessType: ProDocumentShareAccess;
    recipientName?: string | null;
    expiresAt?: string | null;
    document: ProDocument;
    exports: (ProDocumentExportRecord & { downloadUrl: string })[];
  }> {
    const res = await fetch(`/api/doc-studio/shared/${encodeURIComponent(token)}`, {
      credentials: 'include',
    });
    return handleJsonResponse(res);
  },

  async saveSharedDocument(
    token: string,
    payload: {
      title?: string;
      contentJson: any;
      contentHtml: string;
      signatureBlock?: ProDocumentSignatureBlock;
      expectedVersion?: number;
    }
  ): Promise<{ success: boolean; document: ProDocument }> {
    const csrf = await getCsrfHeaders();
    const res = await fetch(`/api/doc-studio/shared/${encodeURIComponent(token)}`, {
      method: 'PUT',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...csrf,
      },
      body: JSON.stringify(payload),
    });
    return handleJsonResponse(res);
  },

  async uploadEditorImage(file: File): Promise<string> {
    const authToken = await getAuthToken();
    const result = await uploadMediaAssetDirect({
      file,
      folder: 'madecc/doc-studio',
      authToken,
      useCmsEndpoint: false,
    });
    if (!result.url) throw new Error('Image upload did not return a URL.');
    return result.url;
  },
};
