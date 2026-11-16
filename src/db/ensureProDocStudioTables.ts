import { pool, getOrInitPool } from './index.ts';
import { getSeedTemplates, VerifiedCompanyProfile } from './proDocumentTemplatesSeed.ts';

let proDocTablesInitialized = false;
let initPromise: Promise<void> | null = null;

export async function ensureProDocStudioTables(): Promise<void> {
  if (proDocTablesInitialized) return;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    const activePool = pool || getOrInitPool();
    if (!activePool) {
      console.warn('[PRO_DOC_STUDIO_INIT_WARN] PostgreSQL pool unavailable; skipping DDL.');
      return;
    }

    const client = await activePool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS pro_document_templates (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          category TEXT NOT NULL,
          description TEXT,
          content_json JSONB NOT NULL,
          content_html TEXT NOT NULL,
          default_orientation TEXT NOT NULL DEFAULT 'portrait',
          default_visibility TEXT NOT NULL DEFAULT 'PRIVATE',
          default_header_text TEXT,
          default_footer_text TEXT,
          is_confidential BOOLEAN NOT NULL DEFAULT true,
          is_system BOOLEAN NOT NULL DEFAULT false,
          version INTEGER NOT NULL DEFAULT 1,
          created_by TEXT,
          updated_by TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS pro_documents (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          document_number TEXT NOT NULL UNIQUE,
          category TEXT NOT NULL,
          description TEXT,
          content_json JSONB NOT NULL,
          content_html TEXT NOT NULL,
          template_id INTEGER,
          status TEXT NOT NULL DEFAULT 'DRAFT',
          visibility TEXT NOT NULL DEFAULT 'PRIVATE',
          is_confidential BOOLEAN NOT NULL DEFAULT true,
          page_size TEXT NOT NULL DEFAULT 'A4',
          orientation TEXT NOT NULL DEFAULT 'portrait',
          margin_mm INTEGER NOT NULL DEFAULT 20,
          header_text TEXT,
          footer_text TEXT,
          show_page_numbers BOOLEAN NOT NULL DEFAULT true,
          show_confidentiality_footer BOOLEAN NOT NULL DEFAULT true,
          signature_block JSONB,
          metadata JSONB,
          stored_pdf_url TEXT,
          stored_docx_url TEXT,
          version INTEGER NOT NULL DEFAULT 1,
          created_by TEXT,
          updated_by TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
          published_at TIMESTAMP,
          archived_at TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS pro_document_versions (
          id SERIAL PRIMARY KEY,
          document_id INTEGER NOT NULL,
          version_number INTEGER NOT NULL,
          title TEXT NOT NULL,
          category TEXT NOT NULL,
          status TEXT NOT NULL,
          content_json JSONB NOT NULL,
          content_html TEXT NOT NULL,
          header_text TEXT,
          footer_text TEXT,
          signature_block JSONB,
          metadata JSONB,
          change_summary TEXT,
          created_by TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS pro_document_shares (
          id SERIAL PRIMARY KEY,
          document_id INTEGER NOT NULL,
          share_token_hash TEXT NOT NULL UNIQUE,
          token_prefix TEXT NOT NULL,
          access_type TEXT NOT NULL DEFAULT 'VIEW_ONLY',
          recipient_email TEXT,
          recipient_name TEXT,
          expires_at TIMESTAMP,
          revoked_at TIMESTAMP,
          revoked_by TEXT,
          access_count INTEGER NOT NULL DEFAULT 0,
          last_accessed_at TIMESTAMP,
          created_by TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS pro_document_exports (
          id SERIAL PRIMARY KEY,
          document_id INTEGER NOT NULL,
          format TEXT NOT NULL,
          file_name TEXT NOT NULL,
          file_url TEXT,
          storage_provider TEXT NOT NULL DEFAULT 'supabase',
          storage_path TEXT,
          file_size_bytes INTEGER NOT NULL DEFAULT 0,
          orientation TEXT NOT NULL DEFAULT 'portrait',
          version_at_export INTEGER NOT NULL DEFAULT 1,
          created_by TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS pro_document_settings (
          id SERIAL PRIMARY KEY,
          default_page_size TEXT NOT NULL DEFAULT 'A4',
          default_orientation TEXT NOT NULL DEFAULT 'portrait',
          default_margin_mm INTEGER NOT NULL DEFAULT 20,
          auto_save_interval_sec INTEGER NOT NULL DEFAULT 15,
          default_header_text TEXT NOT NULL DEFAULT 'MADECC GROUP | Civil Engineering, Construction & Infrastructure',
          default_footer_text TEXT NOT NULL DEFAULT 'CONFIDENTIAL — MADECC GROUP | Non-Binding Proposal Document',
          confidentiality_notice TEXT NOT NULL DEFAULT 'CONFIDENTIALITY NOTICE: This document contains proprietary commercial, financial, and engineering information prepared exclusively for authorized recipients. Unauthorized reproduction or distribution is strictly prohibited.',
          require_approval_before_publish BOOLEAN NOT NULL DEFAULT true,
          default_confidential_sharing_private BOOLEAN NOT NULL DEFAULT true,
          brand_primary_color TEXT NOT NULL DEFAULT '#0F172A',
          brand_accent_color TEXT NOT NULL DEFAULT '#D97706',
          updated_by TEXT,
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE INDEX IF NOT EXISTS idx_pro_documents_status ON pro_documents(status);
        CREATE INDEX IF NOT EXISTS idx_pro_documents_category ON pro_documents(category);
        CREATE INDEX IF NOT EXISTS idx_pro_doc_versions_doc ON pro_document_versions(document_id, version_number DESC);
        CREATE INDEX IF NOT EXISTS idx_pro_doc_shares_doc ON pro_document_shares(document_id);
        CREATE INDEX IF NOT EXISTS idx_pro_doc_exports_doc ON pro_document_exports(document_id);
      `);

      // Seed global document settings row id=1
      await client.query(`
        INSERT INTO pro_document_settings (id)
        VALUES (1)
        ON CONFLICT (id) DO NOTHING
      `);

      // Hydrate verified company profile from existing site_settings table if present
      let verifiedCompany: VerifiedCompanyProfile = {
        companyName: 'MADECC GROUP',
        website: 'https://madeccgroup.online',
      };
      try {
        const ss = await client.query(
          `SELECT site_name, tagline, phone, email, office_address_yaounde, office_address_douala, legal_status, rccm_number, niu_tax_id, logo_url
           FROM site_settings ORDER BY id ASC LIMIT 1`
        );
        if (ss.rows[0]) {
          const row = ss.rows[0];
          verifiedCompany = {
            companyName: row.site_name || 'MADECC GROUP',
            tagline: row.tagline || undefined,
            website: 'https://madeccgroup.online',
            phone: row.phone || undefined,
            email: row.email || undefined,
            officeYaounde: row.office_address_yaounde || undefined,
            officeDouala: row.office_address_douala || undefined,
            legalStatus: row.legal_status || undefined,
            rccmNumber: row.rccm_number || undefined,
            niuTaxId: row.niu_tax_id || undefined,
            logoUrl: row.logo_url || undefined,
          };
        }
      } catch {
        // site_settings may not yet exist on brand new empty db
      }

      // Idempotently insert any missing templates of the 10 system templates
      const seedTemplates = getSeedTemplates(verifiedCompany);
      for (const tpl of seedTemplates) {
        await client.query(
          `INSERT INTO pro_document_templates
            (name, slug, category, description, content_json, content_html, default_orientation, default_visibility, default_header_text, default_footer_text, is_confidential, is_system, version, created_by, updated_by)
           VALUES
            ($1, $2, $3, $4, $5::jsonb, $6, $7, $8, $9, $10, $11, $12, 1, 'system', 'system')
           ON CONFLICT (slug) DO NOTHING`,
          [
            tpl.name,
            tpl.slug,
            tpl.category,
            tpl.description,
            JSON.stringify(tpl.contentJson),
            tpl.contentHtml,
            tpl.defaultOrientation,
            tpl.defaultVisibility,
            tpl.defaultHeaderText,
            tpl.defaultFooterText,
            tpl.isConfidential,
            tpl.isSystem,
          ]
        );
      }

      proDocTablesInitialized = true;
    } catch (err) {
      console.error('[ENSURE_PRO_DOC_STUDIO_TABLES_ERROR]', err);
      initPromise = null;
    } finally {
      client.release();
    }
  })();

  return initPromise;
}
