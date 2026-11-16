import express, { Request, Response } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import os from 'os';
import path from 'path';
import multer from 'multer';
import { pool, getOrInitPool } from '../../db/index.ts';
import { ensureProDocStudioTables } from '../../db/ensureProDocStudioTables.ts';
import { requireAuth, requireStaffOrAdmin, requireAdmin, AuthRequest } from '../../middleware/auth.ts';
import { logAudit } from '../../lib/audit.ts';
import { getCloudinary, getWritableUploadDir } from '../storageService.ts';
import { sendEmail, buildBrandedHtmlTemplate } from '../mailService.ts';

const ALLOWED_STATUSES = ['DRAFT', 'UNDER_REVIEW', 'APPROVED', 'PUBLISHED', 'ARCHIVED'] as const;
const ALLOWED_VISIBILITIES = ['PRIVATE', 'INTERNAL', 'PUBLIC'] as const;
const ALLOWED_ORIENTATIONS = ['portrait', 'landscape'] as const;

const memoryUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok =
      file.mimetype === 'application/pdf' ||
      file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
      /\.(pdf|docx)$/i.test(file.originalname || '');
    if (!ok) {
      return cb(new Error('Only .pdf and .docx document exports are permitted.'));
    }
    cb(null, true);
  },
});

function hashToken(rawToken: string): string {
  return crypto.createHash('sha256').update(rawToken).digest('hex');
}

function formatDocumentRow(r: any) {
  return {
    id: r.id,
    title: r.title,
    documentNumber: r.document_number,
    category: r.category,
    description: r.description,
    contentJson: r.content_json,
    contentHtml: r.content_html,
    templateId: r.template_id,
    status: r.status,
    visibility: r.visibility,
    isConfidential: Boolean(r.is_confidential),
    pageSize: r.page_size || 'A4',
    orientation: r.orientation || 'portrait',
    marginMm: Number(r.margin_mm ?? 20),
    headerText: r.header_text,
    footerText: r.footer_text,
    showPageNumbers: r.show_page_numbers !== false,
    showConfidentialityFooter: r.show_confidentiality_footer !== false,
    signatureBlock: r.signature_block || { enabled: false },
    metadata: r.metadata || {},
    storedPdfUrl: r.stored_pdf_url,
    storedDocxUrl: r.stored_docx_url,
    version: Number(r.version ?? 1),
    createdBy: r.created_by,
    updatedBy: r.updated_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
    publishedAt: r.published_at,
    archivedAt: r.archived_at,
    activeSharesCount: r.active_shares_count !== undefined ? Number(r.active_shares_count) : undefined,
    versionsCount: r.versions_count !== undefined ? Number(r.versions_count) : undefined,
    exportsCount: r.exports_count !== undefined ? Number(r.exports_count) : undefined,
  };
}

function formatTemplateRow(r: any) {
  return {
    id: r.id,
    name: r.name,
    slug: r.slug,
    category: r.category,
    description: r.description,
    contentJson: r.content_json,
    contentHtml: r.content_html,
    defaultOrientation: r.default_orientation || 'portrait',
    defaultVisibility: r.default_visibility || 'PRIVATE',
    defaultHeaderText: r.default_header_text,
    defaultFooterText: r.default_footer_text,
    isConfidential: Boolean(r.is_confidential),
    isSystem: Boolean(r.is_system),
    version: Number(r.version ?? 1),
    createdBy: r.created_by,
    updatedBy: r.updated_by,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

function formatVersionRow(r: any) {
  return {
    id: r.id,
    documentId: r.document_id,
    versionNumber: Number(r.version_number),
    title: r.title,
    category: r.category,
    status: r.status,
    contentJson: r.content_json,
    contentHtml: r.content_html,
    headerText: r.header_text,
    footerText: r.footer_text,
    signatureBlock: r.signature_block,
    metadata: r.metadata,
    changeSummary: r.change_summary,
    createdBy: r.created_by,
    createdAt: r.created_at,
  };
}

function formatShareRow(r: any) {
  return {
    id: r.id,
    documentId: r.document_id,
    tokenPrefix: r.token_prefix,
    accessType: r.access_type,
    recipientEmail: r.recipient_email,
    recipientName: r.recipient_name,
    expiresAt: r.expires_at,
    revokedAt: r.revoked_at,
    revokedBy: r.revoked_by,
    accessCount: Number(r.access_count ?? 0),
    lastAccessedAt: r.last_accessed_at,
    createdBy: r.created_by,
    createdAt: r.created_at,
  };
}

function formatExportRow(r: any) {
  return {
    id: r.id,
    documentId: r.document_id,
    format: r.format,
    fileName: r.file_name,
    fileUrl: r.file_url,
    storageProvider: r.storage_provider,
    storagePath: r.storage_path,
    fileSizeBytes: Number(r.file_size_bytes ?? 0),
    orientation: r.orientation || 'portrait',
    versionAtExport: Number(r.version_at_export ?? 1),
    createdBy: r.created_by,
    createdAt: r.created_at,
    documentTitle: r.document_title,
    documentNumber: r.document_number,
  };
}

function formatSettingsRow(r: any) {
  return {
    id: r.id,
    defaultPageSize: r.default_page_size || 'A4',
    defaultOrientation: r.default_orientation || 'portrait',
    defaultMarginMm: Number(r.default_margin_mm ?? 20),
    autoSaveIntervalSec: Number(r.auto_save_interval_sec ?? 15),
    defaultHeaderText: r.default_header_text,
    defaultFooterText: r.default_footer_text,
    confidentialityNotice: r.confidentiality_notice,
    requireApprovalBeforePublish: Boolean(r.require_approval_before_publish),
    defaultConfidentialSharingPrivate: Boolean(r.default_confidential_sharing_private),
    brandPrimaryColor: r.brand_primary_color || '#0F172A',
    brandAccentColor: r.brand_accent_color || '#D97706',
    updatedBy: r.updated_by,
    updatedAt: r.updated_at,
  };
}

export function setupProDocStudioRoutes(app: express.Express) {
  const getDbClient = async () => {
    const activePool = pool || getOrInitPool();
    if (!activePool) {
      throw new Error('Neon PostgreSQL connection pool is unavailable');
    }
    return await activePool.connect();
  };

  // Cold-start defense for every /api/doc-studio route
  app.use('/api/doc-studio', async (_req, _res, next) => {
    try {
      await ensureProDocStudioTables();
    } catch (err) {
      console.warn('[PRO_DOC_ENSURE_WARN]', err);
    }
    next();
  });

  // =========================================================================
  // 1. DASHBOARD OVERVIEW METRICS (REAL SQL COUNTS)
  // =========================================================================
  app.get('/api/doc-studio/dashboard', requireStaffOrAdmin, async (_req: AuthRequest, res: Response) => {
    let client;
    try {
      client = await getDbClient();
      const [countsRes, shareCountRes, tplCountRes, expCountRes, recentDocsRes, recentExpsRes] = await Promise.all([
        client.query(`
          SELECT
            COUNT(*)::int AS total,
            COUNT(*) FILTER (WHERE status = 'DRAFT')::int AS draft_count,
            COUNT(*) FILTER (WHERE status = 'UNDER_REVIEW')::int AS under_review_count,
            COUNT(*) FILTER (WHERE status = 'APPROVED')::int AS approved_count,
            COUNT(*) FILTER (WHERE status = 'PUBLISHED')::int AS published_count,
            COUNT(*) FILTER (WHERE status = 'ARCHIVED')::int AS archived_count
          FROM pro_documents
        `),
        client.query(`
          SELECT COUNT(DISTINCT document_id)::int AS shared_count
          FROM pro_document_shares
          WHERE revoked_at IS NULL AND (expires_at IS NULL OR expires_at > NOW())
        `),
        client.query(`SELECT COUNT(*)::int AS cnt FROM pro_document_templates`),
        client.query(`SELECT COUNT(*)::int AS cnt FROM pro_document_exports`),
        client.query(`
          SELECT d.*,
            (SELECT COUNT(*)::int FROM pro_document_shares s WHERE s.document_id = d.id AND s.revoked_at IS NULL AND (s.expires_at IS NULL OR s.expires_at > NOW())) AS active_shares_count,
            (SELECT COUNT(*)::int FROM pro_document_versions v WHERE v.document_id = d.id) AS versions_count,
            (SELECT COUNT(*)::int FROM pro_document_exports e WHERE e.document_id = d.id) AS exports_count
          FROM pro_documents d
          ORDER BY d.updated_at DESC
          LIMIT 8
        `),
        client.query(`
          SELECT e.*, d.title AS document_title, d.document_number
          FROM pro_document_exports e
          LEFT JOIN pro_documents d ON d.id = e.document_id
          ORDER BY e.created_at DESC
          LIMIT 8
        `),
      ]);

      const c = countsRes.rows[0] || {};
      return res.json({
        totalDocuments: Number(c.total || 0),
        draftCount: Number(c.draft_count || 0),
        underReviewCount: Number(c.under_review_count || 0),
        approvedCount: Number(c.approved_count || 0),
        publishedCount: Number(c.published_count || 0),
        archivedCount: Number(c.archived_count || 0),
        sharedCount: Number(shareCountRes.rows[0]?.shared_count || 0),
        templatesCount: Number(tplCountRes.rows[0]?.cnt || 0),
        exportsCount: Number(expCountRes.rows[0]?.cnt || 0),
        recentDocuments: recentDocsRes.rows.map(formatDocumentRow),
        recentExports: recentExpsRes.rows.map(formatExportRow),
      });
    } catch (err: any) {
      console.error('[PRO_DOC_DASHBOARD_ERROR]', err);
      return res.status(500).json({ error: err.message || 'Failed to load Document Studio dashboard' });
    } finally {
      if (client) client.release();
    }
  });

  // =========================================================================
  // 2. SETTINGS + VERIFIED COMPANY DETAILS FROM site_settings
  // =========================================================================
  app.get('/api/doc-studio/settings', requireStaffOrAdmin, async (_req: AuthRequest, res: Response) => {
    let client;
    try {
      client = await getDbClient();
      const [settingsRes, siteRes] = await Promise.all([
        client.query(`SELECT * FROM pro_document_settings WHERE id = 1 LIMIT 1`),
        client.query(
          `SELECT site_name, tagline, phone, email, office_address_yaounde, office_address_douala, legal_status, rccm_number, niu_tax_id, logo_url
           FROM site_settings ORDER BY id ASC LIMIT 1`
        ).catch(() => ({ rows: [] })),
      ]);

      const settings = settingsRes.rows[0] ? formatSettingsRow(settingsRes.rows[0]) : null;
      const ss = siteRes.rows[0] || {};
      return res.json({
        settings,
        verifiedCompany: {
          companyName: ss.site_name || 'MADECC GROUP',
          tagline: ss.tagline || '',
          website: 'https://madeccgroup.online',
          phone: ss.phone || '',
          email: ss.email || '',
          officeYaounde: ss.office_address_yaounde || '',
          officeDouala: ss.office_address_douala || '',
          legalStatus: ss.legal_status || '',
          rccmNumber: ss.rccm_number || '',
          niuTaxId: ss.niu_tax_id || '',
          logoUrl: ss.logo_url || '/logo.png',
        },
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.put('/api/doc-studio/settings', requireAdmin, async (req: AuthRequest, res: Response) => {
    let client;
    try {
      client = await getDbClient();
      const b = req.body || {};
      const actor = req.dbUser?.email || 'admin';
      const orientation = ALLOWED_ORIENTATIONS.includes(b.defaultOrientation) ? b.defaultOrientation : 'portrait';
      const marginMm = Math.min(40, Math.max(10, Number(b.defaultMarginMm ?? 20)));
      const autoSaveIntervalSec = Math.min(120, Math.max(5, Number(b.autoSaveIntervalSec ?? 15)));

      const updated = await client.query(
        `UPDATE pro_document_settings
         SET default_page_size = $1,
             default_orientation = $2,
             default_margin_mm = $3,
             auto_save_interval_sec = $4,
             default_header_text = $5,
             default_footer_text = $6,
             confidentiality_notice = $7,
             require_approval_before_publish = $8,
             default_confidential_sharing_private = $9,
             brand_primary_color = $10,
             brand_accent_color = $11,
             updated_by = $12,
             updated_at = NOW()
         WHERE id = 1
         RETURNING *`,
        [
          b.defaultPageSize || 'A4',
          orientation,
          marginMm,
          autoSaveIntervalSec,
          b.defaultHeaderText || 'MADECC GROUP | Civil Engineering, Construction & Infrastructure',
          b.defaultFooterText || 'CONFIDENTIAL — MADECC GROUP | Non-Binding Proposal Document',
          b.confidentialityNotice || '',
          Boolean(b.requireApprovalBeforePublish ?? true),
          Boolean(b.defaultConfidentialSharingPrivate ?? true),
          b.brandPrimaryColor || '#0F172A',
          b.brandAccentColor || '#D97706',
          actor,
        ]
      );

      logAudit(req.dbUser?.uid || 'admin', actor, 'DOC_STUDIO_SETTINGS_UPDATED', 'Updated Document Studio global settings').catch(() => {});
      return res.json({ success: true, settings: formatSettingsRow(updated.rows[0]) });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // =========================================================================
  // 3. TEMPLATES CRUD (READ: STAFF/ADMIN, WRITE: ADMIN ONLY)
  // =========================================================================
  app.get('/api/doc-studio/templates', requireStaffOrAdmin, async (_req: AuthRequest, res: Response) => {
    let client;
    try {
      client = await getDbClient();
      const result = await client.query(`SELECT * FROM pro_document_templates ORDER BY is_system DESC, id ASC`);
      return res.json(result.rows.map(formatTemplateRow));
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.post('/api/doc-studio/templates', requireAdmin, async (req: AuthRequest, res: Response) => {
    const b = req.body || {};
    if (!b.name || !String(b.name).trim()) {
      return res.status(400).json({ error: 'Template name is required.' });
    }
    let client;
    try {
      client = await getDbClient();
      const actor = req.dbUser?.email || 'admin';
      const baseSlug = String(b.slug || b.name)
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '') || 'template';
      const slug = `${baseSlug}-${Date.now().toString(36)}`;
      const contentJson = b.contentJson || { type: 'doc', content: [{ type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: String(b.name).trim() }] }, { type: 'paragraph' }] };
      const contentHtml = b.contentHtml || `<h1>${String(b.name).trim()}</h1><p></p>`;

      const inserted = await client.query(
        `INSERT INTO pro_document_templates
          (name, slug, category, description, content_json, content_html, default_orientation, default_visibility, default_header_text, default_footer_text, is_confidential, is_system, version, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11, false, 1, $12, $12)
         RETURNING *`,
        [
          String(b.name).trim(),
          slug,
          String(b.category || 'General').trim(),
          b.description || null,
          JSON.stringify(contentJson),
          contentHtml,
          ALLOWED_ORIENTATIONS.includes(b.defaultOrientation) ? b.defaultOrientation : 'portrait',
          ALLOWED_VISIBILITIES.includes(b.defaultVisibility) ? b.defaultVisibility : 'PRIVATE',
          b.defaultHeaderText || null,
          b.defaultFooterText || null,
          b.isConfidential !== false,
          actor,
        ]
      );
      logAudit(req.dbUser?.uid || 'admin', actor, 'DOC_STUDIO_TEMPLATE_CREATED', `Created template ${b.name}`).catch(() => {});
      return res.status(201).json(formatTemplateRow(inserted.rows[0]));
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.put('/api/doc-studio/templates/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid template ID' });
    const b = req.body || {};
    let client;
    try {
      client = await getDbClient();
      const existing = await client.query(`SELECT * FROM pro_document_templates WHERE id = $1`, [id]);
      if (existing.rows.length === 0) return res.status(404).json({ error: 'Template not found' });
      const cur = existing.rows[0];
      const actor = req.dbUser?.email || 'admin';

      const updated = await client.query(
        `UPDATE pro_document_templates
         SET name = $1,
             category = $2,
             description = $3,
             content_json = $4::jsonb,
             content_html = $5,
             default_orientation = $6,
             default_visibility = $7,
             default_header_text = $8,
             default_footer_text = $9,
             is_confidential = $10,
             version = version + 1,
             updated_by = $11,
             updated_at = NOW()
         WHERE id = $12
         RETURNING *`,
        [
          b.name !== undefined ? String(b.name).trim() : cur.name,
          b.category !== undefined ? String(b.category).trim() : cur.category,
          b.description !== undefined ? b.description : cur.description,
          JSON.stringify(b.contentJson !== undefined ? b.contentJson : cur.content_json),
          b.contentHtml !== undefined ? b.contentHtml : cur.content_html,
          ALLOWED_ORIENTATIONS.includes(b.defaultOrientation) ? b.defaultOrientation : cur.default_orientation,
          ALLOWED_VISIBILITIES.includes(b.defaultVisibility) ? b.defaultVisibility : cur.default_visibility,
          b.defaultHeaderText !== undefined ? b.defaultHeaderText : cur.default_header_text,
          b.defaultFooterText !== undefined ? b.defaultFooterText : cur.default_footer_text,
          b.isConfidential !== undefined ? Boolean(b.isConfidential) : cur.is_confidential,
          actor,
          id,
        ]
      );
      logAudit(req.dbUser?.uid || 'admin', actor, 'DOC_STUDIO_TEMPLATE_UPDATED', `Updated template #${id}`).catch(() => {});
      return res.json(formatTemplateRow(updated.rows[0]));
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.post('/api/doc-studio/templates/:id/duplicate', requireAdmin, async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid template ID' });
    let client;
    try {
      client = await getDbClient();
      const src = await client.query(`SELECT * FROM pro_document_templates WHERE id = $1`, [id]);
      if (src.rows.length === 0) return res.status(404).json({ error: 'Template not found' });
      const s = src.rows[0];
      const actor = req.dbUser?.email || 'admin';
      const newSlug = `${s.slug}-copy-${Date.now().toString(36)}`;

      const inserted = await client.query(
        `INSERT INTO pro_document_templates
          (name, slug, category, description, content_json, content_html, default_orientation, default_visibility, default_header_text, default_footer_text, is_confidential, is_system, version, created_by, updated_by)
         VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11, false, 1, $12, $12)
         RETURNING *`,
        [
          `${s.name} (Copy)`,
          newSlug,
          s.category,
          s.description,
          JSON.stringify(s.content_json),
          s.content_html,
          s.default_orientation,
          s.default_visibility,
          s.default_header_text,
          s.default_footer_text,
          s.is_confidential,
          actor,
        ]
      );
      logAudit(req.dbUser?.uid || 'admin', actor, 'DOC_STUDIO_TEMPLATE_DUPLICATED', `Duplicated template #${id}`).catch(() => {});
      return res.status(201).json(formatTemplateRow(inserted.rows[0]));
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.delete('/api/doc-studio/templates/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid template ID' });
    let client;
    try {
      client = await getDbClient();
      const deleted = await client.query(`DELETE FROM pro_document_templates WHERE id = $1 RETURNING id, name`, [id]);
      if (deleted.rows.length === 0) return res.status(404).json({ error: 'Template not found' });
      const actor = req.dbUser?.email || 'admin';
      logAudit(req.dbUser?.uid || 'admin', actor, 'DOC_STUDIO_TEMPLATE_DELETED', `Deleted template ${deleted.rows[0].name}`).catch(() => {});
      return res.json({ success: true, id });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // =========================================================================
  // 4. DOCUMENTS LIST, DETAIL, CREATE, UPDATE (+ OPTIMISTIC LOCK & AUTO-SAVE)
  // =========================================================================
  app.get('/api/doc-studio/documents', requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
    const q = String(req.query.q || '').trim().toLowerCase();
    const status = String(req.query.status || '').trim().toUpperCase();
    const category = String(req.query.category || '').trim();
    const sharedOnly = req.query.sharedOnly === 'true';
    const sort = String(req.query.sort || 'updated_desc');

    let client;
    try {
      client = await getDbClient();
      const whereClauses: string[] = [];
      const params: any[] = [];
      let idx = 1;

      if (q) {
        whereClauses.push(`(LOWER(d.title) LIKE $${idx} OR LOWER(d.document_number) LIKE $${idx} OR LOWER(COALESCE(d.description,'')) LIKE $${idx})`);
        params.push(`%${q}%`);
        idx++;
      }
      if (status && status !== 'ALL') {
        whereClauses.push(`d.status = $${idx}`);
        params.push(status);
        idx++;
      }
      if (category && category !== 'ALL') {
        whereClauses.push(`d.category = $${idx}`);
        params.push(category);
        idx++;
      }
      if (sharedOnly) {
        whereClauses.push(`EXISTS (SELECT 1 FROM pro_document_shares s WHERE s.document_id = d.id AND s.revoked_at IS NULL AND (s.expires_at IS NULL OR s.expires_at > NOW()))`);
      }

      const orderMap: Record<string, string> = {
        updated_desc: 'd.updated_at DESC',
        updated_asc: 'd.updated_at ASC',
        title_asc: 'd.title ASC',
        created_desc: 'd.created_at DESC',
      };
      const orderBy = orderMap[sort] || 'd.updated_at DESC';
      const whereSql = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      const query = `
        SELECT d.*,
          (SELECT COUNT(*)::int FROM pro_document_shares s WHERE s.document_id = d.id AND s.revoked_at IS NULL AND (s.expires_at IS NULL OR s.expires_at > NOW())) AS active_shares_count,
          (SELECT COUNT(*)::int FROM pro_document_versions v WHERE v.document_id = d.id) AS versions_count,
          (SELECT COUNT(*)::int FROM pro_document_exports e WHERE e.document_id = d.id) AS exports_count
        FROM pro_documents d
        ${whereSql}
        ORDER BY ${orderBy}
      `;
      const result = await client.query(query, params);
      return res.json(result.rows.map(formatDocumentRow));
    } catch (err: any) {
      console.error('[GET_PRO_DOCS_ERROR]', err);
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.get('/api/doc-studio/documents/:id', requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid document ID' });
    let client;
    try {
      client = await getDbClient();
      const docRes = await client.query(`SELECT * FROM pro_documents WHERE id = $1 LIMIT 1`, [id]);
      if (docRes.rows.length === 0) return res.status(404).json({ error: 'Document not found' });

      const [versionsRes, sharesRes, exportsRes] = await Promise.all([
        client.query(`SELECT * FROM pro_document_versions WHERE document_id = $1 ORDER BY version_number DESC, id DESC`, [id]),
        client.query(`SELECT * FROM pro_document_shares WHERE document_id = $1 ORDER BY created_at DESC`, [id]),
        client.query(`SELECT * FROM pro_document_exports WHERE document_id = $1 ORDER BY created_at DESC`, [id]),
      ]);

      return res.json({
        document: formatDocumentRow(docRes.rows[0]),
        versions: versionsRes.rows.map(formatVersionRow),
        shares: sharesRes.rows.map(formatShareRow),
        exports: exportsRes.rows.map(formatExportRow),
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.post('/api/doc-studio/documents', requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
    const b = req.body || {};
    if (!b.title || !String(b.title).trim()) {
      return res.status(400).json({ error: 'Document title is required.' });
    }

    let client;
    try {
      client = await getDbClient();
      await client.query('BEGIN');

      const actor = req.dbUser?.email || 'staff';
      const settingsRes = await client.query(`SELECT * FROM pro_document_settings WHERE id = 1 LIMIT 1`);
      const cfg = settingsRes.rows[0] || {};

      let tplRow: any = null;
      if (b.templateId) {
        const tplRes = await client.query(`SELECT * FROM pro_document_templates WHERE id = $1 LIMIT 1`, [Number(b.templateId)]);
        tplRow = tplRes.rows[0] || null;
      }

      // Generate unique corporate document number (e.g. MADECC-DOC-2026-1042)
      const seqRes = await client.query(`SELECT COALESCE(MAX(id), 0)::int + 1 AS next_seq FROM pro_documents`);
      const nextSeq = String(seqRes.rows[0]?.next_seq || 1).padStart(4, '0');
      const year = new Date().getFullYear();
      const docNumber = b.documentNumber ? String(b.documentNumber).trim() : `MADECC-DOC-${year}-${nextSeq}-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;

      const contentJson = b.contentJson || tplRow?.content_json || {
        type: 'doc',
        content: [
          { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: String(b.title).trim() }] },
          { type: 'paragraph', content: [{ type: 'text', text: '' }] },
        ],
      };
      const contentHtml = b.contentHtml || tplRow?.content_html || `<h1>${String(b.title).trim()}</h1><p></p>`;

      const isConfidential = b.isConfidential !== undefined ? Boolean(b.isConfidential) : (tplRow ? Boolean(tplRow.is_confidential) : true);
      let visibility = ALLOWED_VISIBILITIES.includes(b.visibility) ? b.visibility : (tplRow?.default_visibility || 'PRIVATE');
      if (isConfidential && visibility === 'PUBLIC') visibility = 'PRIVATE';

      const orientation = ALLOWED_ORIENTATIONS.includes(b.orientation)
        ? b.orientation
        : (tplRow?.default_orientation || cfg.default_orientation || 'portrait');

      const signatureBlock = b.signatureBlock || {
        enabled: true,
        leftHeading: 'Prepared & Endorsed By',
        leftSignerName: '',
        leftSignerRole: 'Authorized Representative',
        leftSignedDate: '',
        rightHeading: 'Acknowledged / Counterparty',
        rightSignerName: '',
        rightSignerRole: 'Authorized Signatory',
        rightSignedDate: '',
        includeCompanyStamp: true,
      };

      const metadata = {
        author: actor,
        effectiveDate: new Date().toISOString().split('T')[0],
        ...(b.metadata || {}),
      };

      const inserted = await client.query(
        `INSERT INTO pro_documents
          (title, document_number, category, description, content_json, content_html, template_id, status, visibility, is_confidential, page_size, orientation, margin_mm, header_text, footer_text, show_page_numbers, show_confidentiality_footer, signature_block, metadata, version, created_by, updated_by)
         VALUES
          ($1, $2, $3, $4, $5::jsonb, $6, $7, 'DRAFT', $8, $9, 'A4', $10, $11, $12, $13, $14, $15, $16::jsonb, $17::jsonb, 1, $18, $18)
         RETURNING *`,
        [
          String(b.title).trim(),
          docNumber,
          String(b.category || tplRow?.category || 'General').trim(),
          b.description || tplRow?.description || null,
          JSON.stringify(contentJson),
          contentHtml,
          tplRow?.id || null,
          visibility,
          isConfidential,
          orientation,
          Number(b.marginMm ?? cfg.default_margin_mm ?? 20),
          b.headerText !== undefined ? b.headerText : (tplRow?.default_header_text || cfg.default_header_text),
          b.footerText !== undefined ? b.footerText : (tplRow?.default_footer_text || cfg.default_footer_text),
          b.showPageNumbers !== undefined ? Boolean(b.showPageNumbers) : true,
          b.showConfidentialityFooter !== undefined ? Boolean(b.showConfidentialityFooter) : true,
          JSON.stringify(signatureBlock),
          JSON.stringify(metadata),
          actor,
        ]
      );

      const docRow = inserted.rows[0];
      await client.query(
        `INSERT INTO pro_document_versions
          (document_id, version_number, title, category, status, content_json, content_html, header_text, footer_text, signature_block, metadata, change_summary, created_by)
         VALUES ($1, 1, $2, $3, 'DRAFT', $4::jsonb, $5, $6, $7, $8::jsonb, $9::jsonb, $10, $11)`,
        [
          docRow.id,
          docRow.title,
          docRow.category,
          JSON.stringify(contentJson),
          contentHtml,
          docRow.header_text,
          docRow.footer_text,
          JSON.stringify(signatureBlock),
          JSON.stringify(metadata),
          tplRow ? `Created from template: ${tplRow.name}` : 'Initial draft created',
          actor,
        ]
      );

      await client.query('COMMIT');
      logAudit(req.dbUser?.uid || 'staff', actor, 'DOC_STUDIO_CREATED', `Created document ${docRow.document_number}: ${docRow.title}`).catch(() => {});
      return res.status(201).json(formatDocumentRow(docRow));
    } catch (err: any) {
      if (client) await client.query('ROLLBACK').catch(() => {});
      console.error('[CREATE_PRO_DOC_ERROR]', err);
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.put('/api/doc-studio/documents/:id', requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid document ID' });
    const b = req.body || {};
    const actor = req.dbUser?.email || 'staff';
    const isAutoSave = Boolean(b.isAutoSave);

    let client;
    try {
      client = await getDbClient();
      await client.query('BEGIN');

      const curRes = await client.query(`SELECT * FROM pro_documents WHERE id = $1 FOR UPDATE`, [id]);
      if (curRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Document not found' });
      }
      const cur = curRes.rows[0];

      if (b.expectedVersion !== undefined && !b.forceOverwrite && Number(b.expectedVersion) !== Number(cur.version)) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: 'VERSION_CONFLICT',
          message: `This document was updated elsewhere (server is at v${cur.version}, your editor was at v${b.expectedVersion}).`,
          serverVersion: Number(cur.version),
          serverDocument: formatDocumentRow(cur),
        });
      }

      const nextVersion = Number(cur.version) + 1;
      const isConfidential = b.isConfidential !== undefined ? Boolean(b.isConfidential) : Boolean(cur.is_confidential);
      let visibility = ALLOWED_VISIBILITIES.includes(b.visibility) ? b.visibility : cur.visibility;
      if (isConfidential && visibility === 'PUBLIC') {
        visibility = 'PRIVATE';
      }

      const orientation = ALLOWED_ORIENTATIONS.includes(b.orientation) ? b.orientation : cur.orientation;
      const marginMm = b.marginMm !== undefined ? Math.min(40, Math.max(10, Number(b.marginMm))) : Number(cur.margin_mm);
      const nextJson = b.contentJson !== undefined ? b.contentJson : cur.content_json;
      const nextHtml = b.contentHtml !== undefined ? b.contentHtml : cur.content_html;
      const nextSig = b.signatureBlock !== undefined ? b.signatureBlock : cur.signature_block;
      const nextMeta = b.metadata !== undefined ? b.metadata : cur.metadata;
      const nextTitle = b.title !== undefined && String(b.title).trim() ? String(b.title).trim() : cur.title;
      const nextCategory = b.category !== undefined ? String(b.category).trim() : cur.category;
      const nextDesc = b.description !== undefined ? b.description : cur.description;
      const nextHeader = b.headerText !== undefined ? b.headerText : cur.header_text;
      const nextFooter = b.footerText !== undefined ? b.footerText : cur.footer_text;

      const updated = await client.query(
        `UPDATE pro_documents
         SET title = $1,
             category = $2,
             description = $3,
             content_json = $4::jsonb,
             content_html = $5,
             visibility = $6,
             is_confidential = $7,
             orientation = $8,
             margin_mm = $9,
             header_text = $10,
             footer_text = $11,
             show_page_numbers = $12,
             show_confidentiality_footer = $13,
             signature_block = $14::jsonb,
             metadata = $15::jsonb,
             version = $16,
             updated_by = $17,
             updated_at = NOW()
         WHERE id = $18
         RETURNING *`,
        [
          nextTitle,
          nextCategory,
          nextDesc,
          JSON.stringify(nextJson),
          nextHtml,
          visibility,
          isConfidential,
          orientation,
          marginMm,
          nextHeader,
          nextFooter,
          b.showPageNumbers !== undefined ? Boolean(b.showPageNumbers) : cur.show_page_numbers,
          b.showConfidentialityFooter !== undefined ? Boolean(b.showConfidentialityFooter) : cur.show_confidentiality_footer,
          JSON.stringify(nextSig || {}),
          JSON.stringify(nextMeta || {}),
          nextVersion,
          actor,
          id,
        ]
      );

      // Record full revision snapshot on manual save, milestone save, or every 5th auto-save
      if (!isAutoSave || b.saveVersionSnapshot || nextVersion % 5 === 0) {
        await client.query(
          `INSERT INTO pro_document_versions
            (document_id, version_number, title, category, status, content_json, content_html, header_text, footer_text, signature_block, metadata, change_summary, created_by)
           VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10::jsonb, $11::jsonb, $12, $13)`,
          [
            id,
            nextVersion,
            nextTitle,
            nextCategory,
            cur.status,
            JSON.stringify(nextJson),
            nextHtml,
            nextHeader,
            nextFooter,
            JSON.stringify(nextSig || {}),
            JSON.stringify(nextMeta || {}),
            b.changeSummary || (isAutoSave ? `Auto-saved checkpoint v${nextVersion}` : `Manual save v${nextVersion}`),
            actor,
          ]
        );
      }

      await client.query('COMMIT');
      if (!isAutoSave) {
        logAudit(req.dbUser?.uid || 'staff', actor, 'DOC_STUDIO_SAVED', `Saved ${cur.document_number} v${nextVersion}`).catch(() => {});
      }
      return res.json({ success: true, document: formatDocumentRow(updated.rows[0]) });
    } catch (err: any) {
      if (client) await client.query('ROLLBACK').catch(() => {});
      console.error('[UPDATE_PRO_DOC_ERROR]', err);
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // =========================================================================
  // 5. DOCUMENT LIFECYCLE (DRAFT -> REVIEW -> APPROVED -> PUBLISHED -> ARCHIVED)
  // =========================================================================
  app.post('/api/doc-studio/documents/:id/status', requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid document ID' });
    const targetStatus = String(req.body?.status || '').toUpperCase();
    if (!ALLOWED_STATUSES.includes(targetStatus as any)) {
      return res.status(400).json({ error: `Invalid status. Allowed: ${ALLOWED_STATUSES.join(', ')}` });
    }

    const userRole = req.dbUser?.role || 'staff';
    const actor = req.dbUser?.email || 'staff';
    // Permission-controlled publishing: Only admins may Approve, Publish, Unpublish from Published, or Archive
    if ((targetStatus === 'APPROVED' || targetStatus === 'PUBLISHED' || targetStatus === 'ARCHIVED') && userRole !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Only Executive Administrators may approve, publish, or archive documents.' });
    }

    let client;
    try {
      client = await getDbClient();
      await client.query('BEGIN');
      const curRes = await client.query(`SELECT * FROM pro_documents WHERE id = $1 FOR UPDATE`, [id]);
      if (curRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Document not found' });
      }
      const cur = curRes.rows[0];
      if (cur.status === 'PUBLISHED' && targetStatus !== 'PUBLISHED' && userRole !== 'admin') {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Forbidden: Only Executive Administrators may unpublish a published document.' });
      }

      // Confidential documents remain PRIVATE by default even when published
      let nextVisibility = ALLOWED_VISIBILITIES.includes(req.body?.visibility) ? req.body.visibility : cur.visibility;
      if (cur.is_confidential && nextVisibility === 'PUBLIC') {
        nextVisibility = 'PRIVATE';
      }

      const nextVersion = Number(cur.version) + 1;
      const publishedAtSql = targetStatus === 'PUBLISHED' ? 'NOW()' : (targetStatus === 'DRAFT' ? 'NULL' : 'published_at');
      const archivedAtSql = targetStatus === 'ARCHIVED' ? 'NOW()' : (targetStatus !== 'ARCHIVED' ? 'NULL' : 'archived_at');

      const updated = await client.query(
        `UPDATE pro_documents
         SET status = $1,
             visibility = $2,
             version = $3,
             published_at = ${publishedAtSql},
             archived_at = ${archivedAtSql},
             updated_by = $4,
             updated_at = NOW()
         WHERE id = $5
         RETURNING *`,
        [targetStatus, nextVisibility, nextVersion, actor, id]
      );

      await client.query(
        `INSERT INTO pro_document_versions
          (document_id, version_number, title, category, status, content_json, content_html, header_text, footer_text, signature_block, metadata, change_summary, created_by)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10::jsonb, $11::jsonb, $12, $13)`,
        [
          id,
          nextVersion,
          cur.title,
          cur.category,
          targetStatus,
          JSON.stringify(cur.content_json),
          cur.content_html,
          cur.header_text,
          cur.footer_text,
          JSON.stringify(cur.signature_block || {}),
          JSON.stringify(cur.metadata || {}),
          `Status transitioned: ${cur.status} -> ${targetStatus} (Visibility: ${nextVisibility})`,
          actor,
        ]
      );

      await client.query('COMMIT');
      logAudit(req.dbUser?.uid || 'admin', actor, 'DOC_STUDIO_STATUS_CHANGED', `${cur.document_number}: ${cur.status} -> ${targetStatus}`).catch(() => {});
      return res.json({ success: true, document: formatDocumentRow(updated.rows[0]) });
    } catch (err: any) {
      if (client) await client.query('ROLLBACK').catch(() => {});
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.post('/api/doc-studio/documents/:id/duplicate', requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid document ID' });
    let client;
    try {
      client = await getDbClient();
      await client.query('BEGIN');
      const srcRes = await client.query(`SELECT * FROM pro_documents WHERE id = $1 LIMIT 1`, [id]);
      if (srcRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Document not found' });
      }
      const s = srcRes.rows[0];
      const actor = req.dbUser?.email || 'staff';
      const newDocNo = `${s.document_number}-COPY-${Date.now().toString(36).slice(-4).toUpperCase()}`;

      const inserted = await client.query(
        `INSERT INTO pro_documents
          (title, document_number, category, description, content_json, content_html, template_id, status, visibility, is_confidential, page_size, orientation, margin_mm, header_text, footer_text, show_page_numbers, show_confidentiality_footer, signature_block, metadata, version, created_by, updated_by)
         VALUES
          ($1, $2, $3, $4, $5::jsonb, $6, $7, 'DRAFT', 'PRIVATE', $8, $9, $10, $11, $12, $13, $14, $15, $16::jsonb, $17::jsonb, 1, $18, $18)
         RETURNING *`,
        [
          `${s.title} (Copy)`,
          newDocNo,
          s.category,
          s.description,
          JSON.stringify(s.content_json),
          s.content_html,
          s.template_id,
          s.is_confidential,
          s.page_size,
          s.orientation,
          s.margin_mm,
          s.header_text,
          s.footer_text,
          s.show_page_numbers,
          s.show_confidentiality_footer,
          JSON.stringify(s.signature_block || {}),
          JSON.stringify(s.metadata || {}),
          actor,
        ]
      );
      const clone = inserted.rows[0];
      await client.query(
        `INSERT INTO pro_document_versions
          (document_id, version_number, title, category, status, content_json, content_html, header_text, footer_text, signature_block, metadata, change_summary, created_by)
         VALUES ($1, 1, $2, $3, 'DRAFT', $4::jsonb, $5, $6, $7, $8::jsonb, $9::jsonb, $10, $11)`,
        [
          clone.id,
          clone.title,
          clone.category,
          JSON.stringify(s.content_json),
          s.content_html,
          clone.header_text,
          clone.footer_text,
          JSON.stringify(s.signature_block || {}),
          JSON.stringify(s.metadata || {}),
          `Duplicated from ${s.document_number}`,
          actor,
        ]
      );
      await client.query('COMMIT');
      logAudit(req.dbUser?.uid || 'staff', actor, 'DOC_STUDIO_DUPLICATED', `Duplicated ${s.document_number} -> ${clone.document_number}`).catch(() => {});
      return res.status(201).json(formatDocumentRow(clone));
    } catch (err: any) {
      if (client) await client.query('ROLLBACK').catch(() => {});
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.delete('/api/doc-studio/documents/:id', requireAdmin, async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid document ID' });
    let client;
    try {
      client = await getDbClient();
      await client.query('BEGIN');
      await client.query(`DELETE FROM pro_document_shares WHERE document_id = $1`, [id]);
      await client.query(`DELETE FROM pro_document_versions WHERE document_id = $1`, [id]);
      await client.query(`DELETE FROM pro_document_exports WHERE document_id = $1`, [id]);
      const del = await client.query(`DELETE FROM pro_documents WHERE id = $1 RETURNING id, document_number, title`, [id]);
      if (del.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Document not found' });
      }
      await client.query('COMMIT');
      const actor = req.dbUser?.email || 'admin';
      logAudit(req.dbUser?.uid || 'admin', actor, 'DOC_STUDIO_DELETED', `Deleted document ${del.rows[0].document_number}`).catch(() => {});
      return res.json({ success: true, id });
    } catch (err: any) {
      if (client) await client.query('ROLLBACK').catch(() => {});
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // =========================================================================
  // 6. VERSION HISTORY & RESTORE
  // =========================================================================
  app.get('/api/doc-studio/documents/:id/versions', requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid document ID' });
    let client;
    try {
      client = await getDbClient();
      const result = await client.query(
        `SELECT * FROM pro_document_versions WHERE document_id = $1 ORDER BY version_number DESC, id DESC`,
        [id]
      );
      return res.json(result.rows.map(formatVersionRow));
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.post('/api/doc-studio/documents/:id/versions/:versionId/restore', requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    const versionId = parseInt(req.params.versionId, 10);
    if (isNaN(id) || isNaN(versionId)) return res.status(400).json({ error: 'Invalid ID parameters' });

    let client;
    try {
      client = await getDbClient();
      await client.query('BEGIN');
      const [docRes, verRes] = await Promise.all([
        client.query(`SELECT * FROM pro_documents WHERE id = $1 FOR UPDATE`, [id]),
        client.query(`SELECT * FROM pro_document_versions WHERE id = $1 AND document_id = $2 LIMIT 1`, [versionId, id]),
      ]);
      if (docRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Document not found' });
      }
      if (verRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Version snapshot not found' });
      }

      const cur = docRes.rows[0];
      const snap = verRes.rows[0];
      const nextVersion = Number(cur.version) + 1;
      const actor = req.dbUser?.email || 'staff';

      const updated = await client.query(
        `UPDATE pro_documents
         SET title = $1,
             category = $2,
             content_json = $3::jsonb,
             content_html = $4,
             header_text = $5,
             footer_text = $6,
             signature_block = $7::jsonb,
             metadata = $8::jsonb,
             version = $9,
             updated_by = $10,
             updated_at = NOW()
         WHERE id = $11
         RETURNING *`,
        [
          snap.title,
          snap.category,
          JSON.stringify(snap.content_json),
          snap.content_html,
          snap.header_text,
          snap.footer_text,
          JSON.stringify(snap.signature_block || cur.signature_block || {}),
          JSON.stringify(snap.metadata || cur.metadata || {}),
          nextVersion,
          actor,
          id,
        ]
      );

      await client.query(
        `INSERT INTO pro_document_versions
          (document_id, version_number, title, category, status, content_json, content_html, header_text, footer_text, signature_block, metadata, change_summary, created_by)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10::jsonb, $11::jsonb, $12, $13)`,
        [
          id,
          nextVersion,
          snap.title,
          snap.category,
          cur.status,
          JSON.stringify(snap.content_json),
          snap.content_html,
          snap.header_text,
          snap.footer_text,
          JSON.stringify(snap.signature_block || {}),
          JSON.stringify(snap.metadata || {}),
          `Restored from version v${snap.version_number}`,
          actor,
        ]
      );

      await client.query('COMMIT');
      logAudit(req.dbUser?.uid || 'staff', actor, 'DOC_STUDIO_VERSION_RESTORED', `Restored ${cur.document_number} to snapshot v${snap.version_number} as v${nextVersion}`).catch(() => {});
      return res.json({ success: true, document: formatDocumentRow(updated.rows[0]) });
    } catch (err: any) {
      if (client) await client.query('ROLLBACK').catch(() => {});
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // =========================================================================
  // 7. EXPORT STORAGE UPLOAD & AUTHORIZED RETRIEVAL (SUPABASE / CLOUDINARY)
  // =========================================================================
  const safeExportMulter = (req: Request, res: Response, next: express.NextFunction) => {
    memoryUpload.single('file')(req, res, (err: any) => {
      if (err) {
        return res.status(400).json({ error: err.message || 'Export upload error' });
      }
      next();
    });
  };

  app.post('/api/doc-studio/documents/:id/store-export', requireStaffOrAdmin, safeExportMulter, async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid document ID' });
    const file = (req as any).file as Express.Multer.File | undefined;
    if (!file) return res.status(400).json({ error: 'No export file uploaded.' });

    const format = String(req.body?.format || (file.originalname.endsWith('.docx') ? 'DOCX' : 'PDF')).toUpperCase() === 'DOCX' ? 'DOCX' : 'PDF';
    const orientation = ALLOWED_ORIENTATIONS.includes(req.body?.orientation) ? req.body.orientation : 'portrait';
    const actor = req.dbUser?.email || 'staff';

    let client;
    try {
      client = await getDbClient();
      const docRes = await client.query(`SELECT id, document_number, version, is_confidential, visibility FROM pro_documents WHERE id = $1 LIMIT 1`, [id]);
      if (docRes.rows.length === 0) return res.status(404).json({ error: 'Document not found' });
      const doc = docRes.rows[0];

      const cleanName = (file.originalname || `${doc.document_number}.${format.toLowerCase()}`).replace(/[^a-zA-Z0-9._-]/g, '_');
      const storagePath = `pro-documents/doc-${id}/${Date.now()}-${cleanName}`;
      let storageProvider: 'supabase' | 'cloudinary' | 'local' = 'local';
      let fileUrl: string | null = null;
      let persistedPath = storagePath;

      // 1. Primary: Supabase Storage
      if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        try {
          const { createClient } = await import('@supabase/supabase-js');
          const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
          const bucketName = process.env.SUPABASE_BUCKET || 'madecc-assets';
          const { error } = await supabase.storage
            .from(bucketName)
            .upload(storagePath, file.buffer, {
              contentType: file.mimetype || (format === 'DOCX'
                ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                : 'application/pdf'),
              cacheControl: '3600',
              upsert: true,
            });

          if (!error) {
            storageProvider = 'supabase';
            persistedPath = `${bucketName}/${storagePath}`;
            if (!doc.is_confidential && doc.visibility === 'PUBLIC') {
              const { data } = supabase.storage.from(bucketName).getPublicUrl(storagePath);
              fileUrl = data.publicUrl;
            } else {
              // Private document: create signed short-lived URL or proxy via authorized download endpoint
              const { data: signedData } = await supabase.storage.from(bucketName).createSignedUrl(storagePath, 3600);
              fileUrl = signedData?.signedUrl || null;
            }
          } else {
            console.warn('[PRO_DOC_SUPABASE_UPLOAD_WARN]', error.message);
          }
        } catch (supaErr: any) {
          console.warn('[PRO_DOC_SUPABASE_ERR]', supaErr?.message || supaErr);
        }
      }

      // 2. Secondary fallback: Cloudinary (raw asset) when Supabase unavailable
      if (storageProvider === 'local') {
        try {
          const { cloudinary, cloudName, apiKey, apiSecret } = await getCloudinary();
          if (cloudName && apiKey && apiSecret) {
            const uploaded: any = await new Promise((resolve, reject) => {
              const stream = cloudinary.uploader.upload_stream(
                {
                  resource_type: 'raw',
                  folder: `madecc/pro-documents/doc-${id}`,
                  public_id: `${Date.now()}-${cleanName}`,
                },
                (error: any, result: any) => {
                  if (error) reject(error);
                  else resolve(result);
                }
              );
              stream.end(file.buffer);
            });
            if (uploaded?.secure_url || uploaded?.url) {
              storageProvider = 'cloudinary';
              fileUrl = uploaded.secure_url || uploaded.url;
              persistedPath = uploaded.public_id || storagePath;
            }
          }
        } catch (cloudErr: any) {
          console.warn('[PRO_DOC_CLOUDINARY_ERR]', cloudErr?.message || cloudErr);
        }
      }

      // 3. Container writable directory fallback when offline
      if (storageProvider === 'local') {
        const dir = path.join(getWritableUploadDir(), 'pro_documents');
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        const localFile = `${Date.now()}-${cleanName}`;
        fs.writeFileSync(path.join(dir, localFile), file.buffer);
        persistedPath = path.join(dir, localFile);
      }

      const expRes = await client.query(
        `INSERT INTO pro_document_exports
          (document_id, format, file_name, file_url, storage_provider, storage_path, file_size_bytes, orientation, version_at_export, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
         RETURNING *`,
        [id, format, cleanName, fileUrl, storageProvider, persistedPath, file.size, orientation, doc.version, actor]
      );
      const exportRow = expRes.rows[0];
      const authorizedDownloadUrl = `/api/doc-studio/exports/${exportRow.id}/download`;

      // Update stored URL column cleanly
      if (format === 'PDF') {
        await client.query(`UPDATE pro_documents SET stored_pdf_url = $1 WHERE id = $2`, [authorizedDownloadUrl, id]);
      } else {
        await client.query(`UPDATE pro_documents SET stored_docx_url = $1 WHERE id = $2`, [authorizedDownloadUrl, id]);
      }

      logAudit(req.dbUser?.uid || 'staff', actor, 'DOC_STUDIO_EXPORT_STORED', `Stored ${format} export for ${doc.document_number} via ${storageProvider}`).catch(() => {});
      return res.status(201).json({
        success: true,
        exportRecord: formatExportRow(exportRow),
        authorizedDownloadUrl,
        directSignedUrl: fileUrl,
      });
    } catch (err: any) {
      console.error('[STORE_EXPORT_ERROR]', err);
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // Authorized download endpoint for stored exports (Staff/Admin OR valid non-revoked share token for document)
  app.get('/api/doc-studio/exports/:exportId/download', async (req: AuthRequest, res: Response) => {
    const exportId = parseInt(req.params.exportId, 10);
    if (isNaN(exportId)) return res.status(400).json({ error: 'Invalid export ID' });
    const rawShareToken = String(req.query.docShare || req.headers['x-doc-share-token'] || '').trim();

    let client;
    try {
      client = await getDbClient();
      const expRes = await client.query(`SELECT * FROM pro_document_exports WHERE id = $1 LIMIT 1`, [exportId]);
      if (expRes.rows.length === 0) return res.status(404).json({ error: 'Export file record not found' });
      const exp = expRes.rows[0];

      let authorized = false;
      if (rawShareToken) {
        const shareRes = await client.query(
          `SELECT * FROM pro_document_shares
           WHERE share_token_hash = $1 AND document_id = $2 AND revoked_at IS NULL AND (expires_at IS NULL OR expires_at > NOW())
           LIMIT 1`,
          [hashToken(rawShareToken), exp.document_id]
        );
        if (shareRes.rows.length > 0) authorized = true;
      }

      if (!authorized) {
        // Fallback to requireStaffOrAdmin check cleanly
        let authPassed = false;
        await new Promise<void>((resolve) => {
          requireStaffOrAdmin(req, {
            status: () => ({ json: () => resolve() }),
          } as any, () => {
            authPassed = true;
            resolve();
          });
        });
        authorized = authPassed;
      }

      if (!authorized) {
        return res.status(403).json({ error: 'Forbidden: Valid staff credentials or active document share token required.' });
      }

      if (exp.storage_provider === 'supabase' && exp.storage_path && process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        const { createClient } = await import('@supabase/supabase-js');
        const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
        const slashIdx = String(exp.storage_path).indexOf('/');
        const bucket = slashIdx !== -1 ? exp.storage_path.slice(0, slashIdx) : (process.env.SUPABASE_BUCKET || 'madecc-assets');
        const objPath = slashIdx !== -1 ? exp.storage_path.slice(slashIdx + 1) : exp.storage_path;
        const { data, error } = await supabase.storage.from(bucket).download(objPath);
        if (!error && data) {
          const buf = Buffer.from(await data.arrayBuffer());
          res.setHeader('Content-Disposition', `attachment; filename="${exp.file_name}"`);
          res.setHeader(
            'Content-Type',
            exp.format === 'DOCX'
              ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              : 'application/pdf'
          );
          return res.send(buf);
        }
      }

      if (exp.storage_provider === 'cloudinary') {
        let fetchedBuf: Buffer | null = null;
        if (exp.file_url) {
          const upstream = await fetch(exp.file_url);
          if (upstream.ok) {
            fetchedBuf = Buffer.from(await upstream.arrayBuffer());
          }
        }
        if (!fetchedBuf && exp.storage_path) {
          const { cloudinary } = await getCloudinary();
          const signedDownloadUrl = cloudinary.utils.private_download_url(exp.storage_path, '', {
            resource_type: 'raw',
            type: 'upload',
            expires_at: Math.floor(Date.now() / 1000) + 300,
          });
          const signedRes = await fetch(signedDownloadUrl);
          if (signedRes.ok) {
            fetchedBuf = Buffer.from(await signedRes.arrayBuffer());
          }
        }
        if (fetchedBuf) {
          res.setHeader('Content-Disposition', `attachment; filename="${exp.file_name}"`);
          res.setHeader(
            'Content-Type',
            exp.format === 'DOCX'
              ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
              : 'application/pdf'
          );
          return res.send(fetchedBuf);
        }
      }

      if (exp.storage_path && fs.existsSync(exp.storage_path)) {
        res.setHeader('Content-Disposition', `attachment; filename="${exp.file_name}"`);
        return res.sendFile(exp.storage_path);
      }

      return res.status(404).json({ error: 'Stored export object unavailable in storage provider.' });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // =========================================================================
  // 8. SECURE DOCUMENT SHARING & TOKEN VERIFICATION
  // =========================================================================
  app.post('/api/doc-studio/documents/:id/shares', requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
    const id = parseInt(req.params.id, 10);
    if (isNaN(id)) return res.status(400).json({ error: 'Invalid document ID' });

    const actor = req.dbUser?.email || 'staff';
    const b = req.body || {};
    const accessType = b.accessType === 'EDIT' ? 'EDIT' : 'VIEW_ONLY';
    const expiresInDays = b.expiresInDays !== undefined && b.expiresInDays !== null && b.expiresInDays !== ''
      ? Math.max(1, Math.min(365, Number(b.expiresInDays)))
      : 14;

    let client;
    try {
      client = await getDbClient();
      const docRes = await client.query(`SELECT id, title, document_number, is_confidential FROM pro_documents WHERE id = $1 LIMIT 1`, [id]);
      if (docRes.rows.length === 0) return res.status(404).json({ error: 'Document not found' });
      const doc = docRes.rows[0];

      // Only admin can grant EDIT share on confidential proposals
      if (doc.is_confidential && accessType === 'EDIT' && req.dbUser?.role !== 'admin') {
        return res.status(403).json({ error: 'Only Executive Administrators may issue EDIT sharing links on confidential documents.' });
      }

      const rawToken = crypto.randomBytes(32).toString('base64url');
      const tokenHash = hashToken(rawToken);
      const tokenPrefix = rawToken.slice(0, 8);
      const expiresAt = b.neverExpires ? null : new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

      const inserted = await client.query(
        `INSERT INTO pro_document_shares
          (document_id, share_token_hash, token_prefix, access_type, recipient_email, recipient_name, expires_at, created_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
         RETURNING *`,
        [
          id,
          tokenHash,
          tokenPrefix,
          accessType,
          b.recipientEmail ? String(b.recipientEmail).trim() : null,
          b.recipientName ? String(b.recipientName).trim() : null,
          expiresAt,
          actor,
        ]
      );

      const originHeader = req.headers.origin || (process.env.URL || 'https://madeccgroup.online');
      const shareUrl = `${String(originHeader).replace(/\/$/, '')}/?docShare=${rawToken}`;

      // Optional email delivery if requested
      let emailSent = false;
      if (b.sendEmail && b.recipientEmail && String(b.recipientEmail).includes('@')) {
        const subject = `Secure Document Shared: ${doc.title} (${doc.document_number})`;
        const text = `Hello ${b.recipientName || 'Partner'},\n\n${actor} has shared a document with you from MADECC GROUP Document Studio.\n\nDocument: ${doc.title} (${doc.document_number})\nAccess Mode: ${accessType}\n${expiresAt ? `Expires: ${expiresAt.toISOString()}\n` : ''}\nSecure Link: ${shareUrl}\n\n${doc.is_confidential ? 'CONFIDENTIAL: Do not forward this private link to unauthorized parties.' : ''}`;
        const html = buildBrandedHtmlTemplate({
          title: `Document Shared: ${doc.title}`,
          badge: 'MADECC GROUP · SECURE DOCUMENT STUDIO',
          recipientName: b.recipientName || 'Partner',
          leadParagraph: `${actor} has granted you <strong>${accessType === 'EDIT' ? 'Collaborator Edit' : 'View & Download'}</strong> access to a corporate document.`,
          sectionsHtml: `
            <div style="background:#f8fafc;border:1px solid #cbd5e1;border-radius:8px;padding:16px;font-size:13px;line-height:1.6;">
              <div><strong>Reference:</strong> ${doc.document_number}</div>
              <div><strong>Access Level:</strong> ${accessType}</div>
              ${expiresAt ? `<div><strong>Link Expires:</strong> ${expiresAt.toISOString()}</div>` : ''}
              ${doc.is_confidential ? '<div style="color:#b45309;margin-top:8px;"><strong>CONFIDENTIAL NOTICE:</strong> Private tokenized access. Do not distribute without authorization.</div>' : ''}
            </div>
          `,
          actionButton: { label: 'Open Secure Document', url: shareUrl },
        });
        await sendEmail(String(b.recipientEmail).trim(), subject, text, html).then(() => { emailSent = true; }).catch(() => {});
      }

      logAudit(req.dbUser?.uid || 'staff', actor, 'DOC_STUDIO_SHARE_CREATED', `Created ${accessType} share (${tokenPrefix}...) for ${doc.document_number}`).catch(() => {});
      return res.status(201).json({
        success: true,
        share: {
          ...formatShareRow(inserted.rows[0]),
          shareUrl,
        },
        emailSent,
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  app.post('/api/doc-studio/shares/:shareId/revoke', requireStaffOrAdmin, async (req: AuthRequest, res: Response) => {
    const shareId = parseInt(req.params.shareId, 10);
    if (isNaN(shareId)) return res.status(400).json({ error: 'Invalid share ID' });
    const actor = req.dbUser?.email || 'staff';
    let client;
    try {
      client = await getDbClient();
      const updated = await client.query(
        `UPDATE pro_document_shares
         SET revoked_at = NOW(), revoked_by = $1
         WHERE id = $2
         RETURNING *`,
        [actor, shareId]
      );
      if (updated.rows.length === 0) return res.status(404).json({ error: 'Share link not found' });
      logAudit(req.dbUser?.uid || 'staff', actor, 'DOC_STUDIO_SHARE_REVOKED', `Revoked share #${shareId} (${updated.rows[0].token_prefix}...)`).catch(() => {});
      return res.json({ success: true, share: formatShareRow(updated.rows[0]) });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // Public / Recipient Share Token Validation & Read Endpoint
  app.get('/api/doc-studio/shared/:token', async (req: Request, res: Response) => {
    const rawToken = String(req.params.token || '').trim();
    if (!rawToken || rawToken.length < 16) {
      return res.status(401).json({ error: 'Invalid or malformed document share token.' });
    }

    let client;
    try {
      client = await getDbClient();
      const tokenHash = hashToken(rawToken);
      const shareRes = await client.query(`SELECT * FROM pro_document_shares WHERE share_token_hash = $1 LIMIT 1`, [tokenHash]);
      if (shareRes.rows.length === 0) {
        return res.status(404).json({ error: 'Shared document link not found or unauthorized.' });
      }

      const share = shareRes.rows[0];
      if (share.revoked_at) {
        return res.status(410).json({ error: 'This document sharing link has been revoked by the administrator.' });
      }
      if (share.expires_at && new Date(share.expires_at) <= new Date()) {
        return res.status(410).json({ error: 'This document sharing link has expired.' });
      }

      const docRes = await client.query(`SELECT * FROM pro_documents WHERE id = $1 LIMIT 1`, [share.document_id]);
      if (docRes.rows.length === 0) {
        return res.status(404).json({ error: 'Associated document no longer exists.' });
      }
      const doc = docRes.rows[0];
      if (doc.status === 'ARCHIVED') {
        return res.status(403).json({ error: 'This document has been archived and is no longer available via share links.' });
      }

      await client.query(
        `UPDATE pro_document_shares SET access_count = access_count + 1, last_accessed_at = NOW() WHERE id = $1`,
        [share.id]
      );

      const expRes = await client.query(
        `SELECT id, document_id, format, file_name, file_size_bytes, orientation, version_at_export, created_at
         FROM pro_document_exports
         WHERE document_id = $1
         ORDER BY created_at DESC LIMIT 6`,
        [doc.id]
      );

      const formattedDoc = formatDocumentRow(doc);
      // Do not expose raw private storage URLs directly to share recipients; route via authorized download endpoint with token
      return res.json({
        success: true,
        accessType: share.access_type,
        recipientName: share.recipient_name,
        expiresAt: share.expires_at,
        document: {
          ...formattedDoc,
          storedPdfUrl: null,
          storedDocxUrl: null,
        },
        exports: expRes.rows.map((e) => ({
          id: e.id,
          format: e.format,
          fileName: e.file_name,
          fileSizeBytes: Number(e.file_size_bytes || 0),
          orientation: e.orientation,
          versionAtExport: Number(e.version_at_export || 1),
          createdAt: e.created_at,
          downloadUrl: `/api/doc-studio/exports/${e.id}/download?docShare=${encodeURIComponent(rawToken)}`,
        })),
      });
    } catch (err: any) {
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });

  // Authorized Edit via Share Token (ONLY permitted when access_type === 'EDIT', non-revoked, non-expired)
  app.put('/api/doc-studio/shared/:token', async (req: Request, res: Response) => {
    const rawToken = String(req.params.token || '').trim();
    if (!rawToken || rawToken.length < 16) {
      return res.status(401).json({ error: 'Unauthorized: Invalid token.' });
    }

    let client;
    try {
      client = await getDbClient();
      await client.query('BEGIN');
      const shareRes = await client.query(`SELECT * FROM pro_document_shares WHERE share_token_hash = $1 LIMIT 1`, [hashToken(rawToken)]);
      if (shareRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Share link not found.' });
      }
      const share = shareRes.rows[0];
      if (share.revoked_at) {
        await client.query('ROLLBACK');
        return res.status(410).json({ error: 'This sharing link has been revoked.' });
      }
      if (share.expires_at && new Date(share.expires_at) <= new Date()) {
        await client.query('ROLLBACK');
        return res.status(410).json({ error: 'This sharing link has expired.' });
      }
      if (share.access_type !== 'EDIT') {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Forbidden: This sharing link grants read-only viewing permissions.' });
      }

      const curRes = await client.query(`SELECT * FROM pro_documents WHERE id = $1 FOR UPDATE`, [share.document_id]);
      if (curRes.rows.length === 0) {
        await client.query('ROLLBACK');
        return res.status(404).json({ error: 'Document not found.' });
      }
      const cur = curRes.rows[0];
      if (cur.status === 'ARCHIVED') {
        await client.query('ROLLBACK');
        return res.status(403).json({ error: 'Archived documents cannot be modified.' });
      }

      const b = req.body || {};
      if (b.expectedVersion !== undefined && Number(b.expectedVersion) !== Number(cur.version)) {
        await client.query('ROLLBACK');
        return res.status(409).json({
          error: 'VERSION_CONFLICT',
          message: 'A newer version was saved. Refresh before overwriting.',
          serverVersion: Number(cur.version),
        });
      }

      const nextVersion = Number(cur.version) + 1;
      const editorIdentity = share.recipient_email || share.recipient_name || `SharedEditor(${share.token_prefix})`;

      const updated = await client.query(
        `UPDATE pro_documents
         SET title = $1,
             content_json = $2::jsonb,
             content_html = $3,
             signature_block = $4::jsonb,
             version = $5,
             updated_by = $6,
             updated_at = NOW()
         WHERE id = $7
         RETURNING *`,
        [
          b.title ? String(b.title).trim() : cur.title,
          JSON.stringify(b.contentJson !== undefined ? b.contentJson : cur.content_json),
          b.contentHtml !== undefined ? b.contentHtml : cur.content_html,
          JSON.stringify(b.signatureBlock !== undefined ? b.signatureBlock : (cur.signature_block || {})),
          nextVersion,
          editorIdentity,
          cur.id,
        ]
      );

      await client.query(
        `INSERT INTO pro_document_versions
          (document_id, version_number, title, category, status, content_json, content_html, header_text, footer_text, signature_block, metadata, change_summary, created_by)
         VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8, $9, $10::jsonb, $11::jsonb, $12, $13)`,
        [
          cur.id,
          nextVersion,
          updated.rows[0].title,
          cur.category,
          cur.status,
          JSON.stringify(updated.rows[0].content_json),
          updated.rows[0].content_html,
          cur.header_text,
          cur.footer_text,
          JSON.stringify(updated.rows[0].signature_block || {}),
          JSON.stringify(cur.metadata || {}),
          `Collaborative edit via authorized share link (${share.token_prefix}...)`,
          editorIdentity,
        ]
      );

      await client.query('COMMIT');
      logAudit('shared-collaborator', editorIdentity, 'DOC_STUDIO_SHARED_EDIT', `Edited ${cur.document_number} via authorized share link`).catch(() => {});
      return res.json({ success: true, document: formatDocumentRow(updated.rows[0]) });
    } catch (err: any) {
      if (client) await client.query('ROLLBACK').catch(() => {});
      return res.status(500).json({ error: err.message });
    } finally {
      if (client) client.release();
    }
  });
}
