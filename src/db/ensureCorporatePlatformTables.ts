import { pool, getOrInitPool } from './index.ts';
import {
  TEN_BUSINESS_DIVISIONS_SEED,
  CORPORATE_DESCRIPTION_DEFAULT,
} from './corporateDivisionsSeedData.ts';

let ensured = false;

export const REGISTRATION_STATUS_LABELS: Record<string, string> = {
  UNREGISTERED: 'REGISTRATION PENDING (Unregistered – formal registration pending)',
  REGISTRATION_PREPARATION: 'Registration preparation',
  APPLICATION_SUBMITTED: 'Application submitted',
  UNDER_ADMINISTRATIVE_REVIEW: 'Under administrative review',
  REGISTERED_AWAITING_DOC_VERIFICATION: 'Registered – awaiting documentary verification',
  REGISTERED_VERIFIED: 'Registered – verified',
  REJECTED_OR_REQUIRES_CORRECTION: 'Rejected or requires correction',
  SUSPENDED: 'Suspended',
  EXPIRED: 'Expired',
  HISTORICAL_SUPERSEDED: 'Historical or superseded legal structure',
};

export const LEGAL_STRUCTURE_LABELS: Record<string, string> = {
  INDIVIDUAL_ESTABLISHMENT_PLANNED: 'Individual establishment planned, subject to formal registration',
  INDIVIDUAL_ESTABLISHMENT_REGISTERED: 'Individual establishment (Établissement Individuel)',
  SARL: 'Société à Responsabilité Limitée (SARL)',
  SUARL: 'Société Unipersonnelle à Responsabilité Limitée (SUARL)',
  SA: 'Société Anonyme (SA)',
  SAS: 'Société par Actions Simplifiée (SAS)',
};

export const INVESTOR_STAGES = [
  'POTENTIAL_INVESTOR',
  'INITIAL_INQUIRY',
  'INTEREST_EXPRESSED',
  'NDA_PROPOSED',
  'DUE_DILIGENCE',
  'FEASIBILITY_REVIEW',
  'TERM_SHEET_DISCUSSED',
  'MOU_DRAFT',
  'LEGAL_REVIEW',
  'AGREEMENT_SIGNED',
  'REGULATORY_CLEARANCE',
  'FUNDING_RECEIVED_VERIFIED',
  'DECLINED',
  'ON_HOLD',
] as const;

export const INVESTOR_STAGE_LABELS: Record<string, string> = {
  POTENTIAL_INVESTOR: 'Potential investor',
  INITIAL_INQUIRY: 'Initial inquiry',
  INTEREST_EXPRESSED: 'Interest expressed',
  NDA_PROPOSED: 'NDA proposed',
  DUE_DILIGENCE: 'Due diligence',
  FEASIBILITY_REVIEW: 'Feasibility review',
  TERM_SHEET_DISCUSSED: 'Term sheet discussed',
  MOU_DRAFT: 'MOU draft',
  LEGAL_REVIEW: 'Legal review',
  AGREEMENT_SIGNED: 'Agreement signed',
  REGULATORY_CLEARANCE: 'Regulatory clearance',
  FUNDING_RECEIVED_VERIFIED: 'Funding received and verified',
  DECLINED: 'Declined',
  ON_HOLD: 'On hold',
};

export async function ensureCorporatePlatformTables(): Promise<void> {
  if (ensured) return;

  const activePool = pool || getOrInitPool();
  if (!activePool) {
    console.warn('[CORPORATE_DB] No active database pool available.');
    return;
  }

  const client = await activePool.connect();
  try {
    // 1. Safe additive RBAC columns on users
    await client.query(`
      ALTER TABLE users ADD COLUMN IF NOT EXISTS admin_role TEXT DEFAULT 'STANDARD';
      ALTER TABLE users ADD COLUMN IF NOT EXISTS corporate_permissions JSONB;
      UPDATE users SET admin_role = 'SUPER_ADMIN' WHERE (role = 'admin' OR lower(email) = 'kreboya603@gmail.com') AND (admin_role IS NULL OR admin_role = 'STANDARD');
    `);

    // 2. Corporate Profile & Legal Registration Tables
    await client.query(`
      CREATE TABLE IF NOT EXISTS business_profiles (
        id SERIAL PRIMARY KEY,
        company_name TEXT NOT NULL DEFAULT 'MADECC Group',
        trade_name TEXT NOT NULL DEFAULT 'MADECC GROUP',
        legal_structure TEXT NOT NULL DEFAULT 'INDIVIDUAL_ESTABLISHMENT_PLANNED',
        planned_legal_structure TEXT DEFAULT 'SARL',
        registration_status TEXT NOT NULL DEFAULT 'UNREGISTERED',
        registration_number TEXT,
        taxpayer_number TEXT,
        country TEXT NOT NULL DEFAULT 'Cameroon',
        city TEXT NOT NULL DEFAULT 'Yaoundé',
        street_address TEXT DEFAULT 'Mbankolo',
        founder_name TEXT NOT NULL DEFAULT 'Kasah Rodrick Reboya',
        ownership_percentage NUMERIC NOT NULL DEFAULT 100,
        motto TEXT NOT NULL DEFAULT 'Building Cameroon''s Future',
        corporate_description TEXT,
        employee_count INTEGER NOT NULL DEFAULT 0,
        employee_count_note TEXT DEFAULT 'Founder-led venture; no salaried employees yet',
        is_reg_number_public BOOLEAN NOT NULL DEFAULT false,
        is_tax_id_public BOOLEAN NOT NULL DEFAULT true,
        is_street_address_public BOOLEAN NOT NULL DEFAULT false,
        is_founder_public BOOLEAN NOT NULL DEFAULT true,
        is_employee_count_public BOOLEAN NOT NULL DEFAULT true,
        verification_notes TEXT,
        verified_by TEXT,
        verified_at TIMESTAMP WITHOUT TIME ZONE,
        publish_status TEXT NOT NULL DEFAULT 'PUBLISHED',
        version INTEGER NOT NULL DEFAULT 1,
        draft_payload JSONB,
        published_payload JSONB,
        scheduled_publish_at TIMESTAMP WITHOUT TIME ZONE,
        updated_by TEXT,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
      );

      ALTER TABLE business_profiles ADD COLUMN IF NOT EXISTS corporate_description TEXT;

      CREATE TABLE IF NOT EXISTS business_legal_entities (
        id SERIAL PRIMARY KEY,
        profile_id INTEGER NOT NULL,
        entity_name TEXT NOT NULL,
        legal_form TEXT NOT NULL DEFAULT 'INDIVIDUAL_ESTABLISHMENT_PLANNED',
        planned_form TEXT DEFAULT 'SARL',
        jurisdiction TEXT NOT NULL DEFAULT 'Cameroon',
        registration_number TEXT,
        taxpayer_number TEXT,
        status TEXT NOT NULL DEFAULT 'PLANNED',
        effective_from TIMESTAMP WITHOUT TIME ZONE,
        effective_to TIMESTAMP WITHOUT TIME ZONE,
        superseded_by_id INTEGER,
        transition_notes TEXT,
        is_current BOOLEAN NOT NULL DEFAULT true,
        created_by TEXT,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS registration_documents (
        id SERIAL PRIMARY KEY,
        profile_id INTEGER NOT NULL,
        entity_id INTEGER,
        title TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'REGISTRATION',
        doc_type TEXT NOT NULL,
        issuer TEXT,
        reference_number TEXT,
        issued_at TIMESTAMP WITHOUT TIME ZONE,
        expires_at TIMESTAMP WITHOUT TIME ZONE,
        file_url TEXT NOT NULL,
        storage_provider TEXT NOT NULL DEFAULT 'cloudinary',
        storage_public_id TEXT,
        storage_path TEXT,
        file_name TEXT NOT NULL,
        mime_type TEXT,
        file_size_bytes INTEGER DEFAULT 0,
        sha256_checksum TEXT,
        version INTEGER NOT NULL DEFAULT 1,
        status TEXT NOT NULL DEFAULT 'UPLOADED',
        is_confidential BOOLEAN NOT NULL DEFAULT true,
        review_notes TEXT,
        reviewed_by TEXT,
        reviewed_at TIMESTAMP WITHOUT TIME ZONE,
        uploaded_by TEXT,
        archived_at TIMESTAMP WITHOUT TIME ZONE,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS business_divisions (
        id SERIAL PRIMARY KEY,
        code TEXT NOT NULL UNIQUE,
        slug TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        category TEXT NOT NULL,
        summary TEXT NOT NULL,
        full_description TEXT,
        image_url TEXT,
        investment_info TEXT,
        compliance_disclaimer TEXT,
        documents_json JSONB,
        operational_status TEXT NOT NULL DEFAULT 'PROPOSED',
        publish_status TEXT NOT NULL DEFAULT 'PUBLISHED',
        country TEXT NOT NULL DEFAULT 'Republic of Cameroon',
        operating_countries JSONB,
        currency TEXT NOT NULL DEFAULT 'XAF',
        regulatory_body TEXT,
        licence_required BOOLEAN NOT NULL DEFAULT false,
        licence_status TEXT NOT NULL DEFAULT 'NOT_APPLIED',
        licence_number TEXT,
        visibility_public BOOLEAN NOT NULL DEFAULT true,
        is_featured BOOLEAN NOT NULL DEFAULT true,
        display_order INTEGER NOT NULL DEFAULT 0,
        metadata JSONB,
        version INTEGER NOT NULL DEFAULT 1,
        scheduled_publish_at TIMESTAMP WITHOUT TIME ZONE,
        archived_at TIMESTAMP WITHOUT TIME ZONE,
        created_by TEXT,
        updated_by TEXT,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
      );

      ALTER TABLE business_divisions ADD COLUMN IF NOT EXISTS image_url TEXT;
      ALTER TABLE business_divisions ADD COLUMN IF NOT EXISTS investment_info TEXT;
      ALTER TABLE business_divisions ADD COLUMN IF NOT EXISTS compliance_disclaimer TEXT;
      ALTER TABLE business_divisions ADD COLUMN IF NOT EXISTS documents_json JSONB;

      CREATE TABLE IF NOT EXISTS division_services (
        id SERIAL PRIMARY KEY,
        division_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        category_group TEXT,
        short_description TEXT NOT NULL,
        full_description TEXT,
        image_url TEXT,
        investment_info TEXT,
        documents_json JSONB,
        scope_deliverables JSONB,
        pricing_model TEXT DEFAULT 'Custom quotation / milestone-based',
        currency TEXT NOT NULL DEFAULT 'XAF',
        regulatory_notes TEXT,
        operational_status TEXT NOT NULL DEFAULT 'PROPOSED',
        publish_status TEXT NOT NULL DEFAULT 'PUBLISHED',
        visibility_public BOOLEAN NOT NULL DEFAULT true,
        display_order INTEGER NOT NULL DEFAULT 0,
        version INTEGER NOT NULL DEFAULT 1,
        archived_at TIMESTAMP WITHOUT TIME ZONE,
        created_by TEXT,
        updated_by TEXT,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
      );

      ALTER TABLE division_services ADD COLUMN IF NOT EXISTS category_group TEXT;
      ALTER TABLE division_services ADD COLUMN IF NOT EXISTS full_description TEXT;
      ALTER TABLE division_services ADD COLUMN IF NOT EXISTS image_url TEXT;
      ALTER TABLE division_services ADD COLUMN IF NOT EXISTS investment_info TEXT;
      ALTER TABLE division_services ADD COLUMN IF NOT EXISTS documents_json JSONB;

      CREATE TABLE IF NOT EXISTS investors (
        id SERIAL PRIMARY KEY,
        investor_name TEXT NOT NULL,
        organization TEXT,
        investor_type TEXT NOT NULL DEFAULT 'STRATEGIC_PARTNER',
        email TEXT,
        phone TEXT,
        investor_country TEXT NOT NULL DEFAULT 'Ghana',
        target_country TEXT NOT NULL DEFAULT 'Cameroon',
        registration_jurisdiction TEXT NOT NULL DEFAULT 'Cameroon',
        sector_focus JSONB,
        ticket_size_min NUMERIC,
        ticket_size_max NUMERIC,
        currency TEXT NOT NULL DEFAULT 'USD',
        stage TEXT NOT NULL DEFAULT 'POTENTIAL_INVESTOR',
        summary TEXT,
        confidential_notes TEXT,
        publish_as_opportunity BOOLEAN NOT NULL DEFAULT false,
        opportunity_title TEXT,
        opportunity_description TEXT,
        compliance_status TEXT NOT NULL DEFAULT 'KYC_PENDING',
        ownership_implication_note TEXT NOT NULL DEFAULT 'No existing shareholding, signed investment agreement, or capital commitment implied.',
        version INTEGER NOT NULL DEFAULT 1,
        archived_at TIMESTAMP WITHOUT TIME ZONE,
        created_by TEXT,
        updated_by TEXT,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS investor_interactions (
        id SERIAL PRIMARY KEY,
        investor_id INTEGER NOT NULL,
        interaction_type TEXT NOT NULL DEFAULT 'NOTE',
        subject TEXT NOT NULL,
        summary TEXT NOT NULL,
        participants TEXT,
        next_steps TEXT,
        interaction_date TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
        is_confidential BOOLEAN NOT NULL DEFAULT true,
        created_by TEXT,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS investor_documents (
        id SERIAL PRIMARY KEY,
        investor_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        doc_type TEXT NOT NULL DEFAULT 'PROPOSAL',
        file_url TEXT NOT NULL,
        storage_provider TEXT NOT NULL DEFAULT 'cloudinary',
        storage_public_id TEXT,
        storage_path TEXT,
        file_name TEXT NOT NULL,
        mime_type TEXT,
        file_size_bytes INTEGER DEFAULT 0,
        sha256_checksum TEXT,
        status TEXT NOT NULL DEFAULT 'UPLOADED',
        is_confidential BOOLEAN NOT NULL DEFAULT true,
        review_notes TEXT,
        reviewed_by TEXT,
        reviewed_at TIMESTAMP WITHOUT TIME ZONE,
        uploaded_by TEXT,
        archived_at TIMESTAMP WITHOUT TIME ZONE,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS corporate_content_versions (
        id SERIAL PRIMARY KEY,
        entity_type TEXT NOT NULL,
        entity_id INTEGER NOT NULL,
        version_number INTEGER NOT NULL,
        entity_title TEXT NOT NULL,
        change_summary TEXT,
        snapshot_json JSONB NOT NULL,
        created_by TEXT,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS corporate_shares (
        id SERIAL PRIMARY KEY,
        share_token_hash TEXT NOT NULL UNIQUE,
        token_prefix TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id INTEGER NOT NULL,
        title TEXT NOT NULL,
        permissions TEXT NOT NULL DEFAULT 'VIEW_ONLY',
        allow_public BOOLEAN NOT NULL DEFAULT true,
        include_confidential BOOLEAN NOT NULL DEFAULT false,
        recipient_email TEXT,
        recipient_name TEXT,
        expires_at TIMESTAMP WITHOUT TIME ZONE,
        revoked_at TIMESTAMP WITHOUT TIME ZONE,
        revoked_by TEXT,
        access_count INTEGER NOT NULL DEFAULT 0,
        last_accessed_at TIMESTAMP WITHOUT TIME ZONE,
        created_by TEXT,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS corporate_audit_logs (
        id SERIAL PRIMARY KEY,
        actor_id INTEGER,
        actor_email TEXT,
        actor_role TEXT,
        action TEXT NOT NULL,
        entity_type TEXT NOT NULL,
        entity_id INTEGER,
        entity_title TEXT,
        before_json JSONB,
        after_json JSONB,
        ip_address TEXT,
        details TEXT,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS real_estate_projects (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT NOT NULL UNIQUE,
        location TEXT NOT NULL,
        description TEXT NOT NULL,
        property_type TEXT NOT NULL,
        land_area TEXT,
        building_area TEXT,
        floors INTEGER DEFAULT 1,
        estimated_budget TEXT,
        budget_currency TEXT NOT NULL DEFAULT 'XAF',
        investment_requirements TEXT,
        development_stage TEXT NOT NULL DEFAULT 'PROPOSED',
        publish_status TEXT NOT NULL DEFAULT 'DRAFT',
        visibility_public BOOLEAN NOT NULL DEFAULT true,
        is_conceptual BOOLEAN NOT NULL DEFAULT true,
        disclaimer_note TEXT NOT NULL DEFAULT 'Proposed real estate development / conceptual study. Architectural renders represent design intent only and are not completed buildings.',
        photographs_json JSONB,
        architectural_drawings_json JSONB,
        renders_json JSONB,
        feasibility_reports_json JSONB,
        supporting_docs_json JSONB,
        version INTEGER NOT NULL DEFAULT 1,
        archived_at TIMESTAMP WITHOUT TIME ZONE,
        created_by TEXT,
        updated_by TEXT,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS pharma_regulatory_compliance (
        id SERIAL PRIMARY KEY,
        division_id INTEGER,
        country TEXT NOT NULL DEFAULT 'Republic of Cameroon',
        regulatory_authority TEXT NOT NULL,
        licence_type TEXT NOT NULL,
        licence_number TEXT,
        licence_document_url TEXT,
        licence_document_name TEXT,
        storage_provider TEXT,
        sha256_checksum TEXT,
        issue_date TIMESTAMP WITHOUT TIME ZONE,
        expiry_date TIMESTAMP WITHOUT TIME ZONE,
        verification_status TEXT NOT NULL DEFAULT 'UNVERIFIED',
        responsible_professional TEXT,
        professional_qualification TEXT,
        approval_status TEXT NOT NULL DEFAULT 'NOT_APPLIED',
        compliance_notes TEXT,
        reviewed_by TEXT,
        reviewed_at TIMESTAMP WITHOUT TIME ZONE,
        archived_at TIMESTAMP WITHOUT TIME ZONE,
        created_by TEXT,
        updated_by TEXT,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS corporate_enquiries (
        id SERIAL PRIMARY KEY,
        enquiry_reference TEXT NOT NULL UNIQUE,
        enquiry_type TEXT NOT NULL,
        division_code TEXT,
        full_name TEXT NOT NULL,
        organization TEXT,
        email TEXT NOT NULL,
        phone TEXT,
        country TEXT NOT NULL DEFAULT 'Cameroon',
        proposed_budget TEXT,
        currency TEXT NOT NULL DEFAULT 'XAF',
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'NEW',
        admin_response TEXT,
        responded_by TEXT,
        responded_at TIMESTAMP WITHOUT TIME ZONE,
        archived_at TIMESTAMP WITHOUT TIME ZONE,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
      );
    `);

    // 3. Seed authoritative initial Business Profile if none exists
    const profileCheck = await client.query(`SELECT COUNT(*)::int AS cnt FROM business_profiles`);
    if ((profileCheck.rows[0]?.cnt || 0) === 0) {
      const insertedProfile = await client.query(
        `
        INSERT INTO business_profiles (
          company_name, trade_name, legal_structure, planned_legal_structure,
          registration_status, registration_number, taxpayer_number,
          country, city, street_address, founder_name, ownership_percentage,
          motto, employee_count, employee_count_note,
          is_reg_number_public, is_tax_id_public, is_street_address_public,
          is_founder_public, is_employee_count_public, publish_status, version, updated_by
        ) VALUES (
          'MADECC Group', 'MADECC GROUP', 'INDIVIDUAL_ESTABLISHMENT_PLANNED', 'SARL',
          'UNREGISTERED', NULL, 'P030217852934P',
          'Cameroon', 'Yaoundé', 'Mbankolo', 'Kasah Rodrick Reboya', 100,
          'Building Cameroon''s Future', 0, 'Founder-led enterprise; no salaried employees yet',
          false, true, false,
          true, true, 'PUBLISHED', 1, 'kreboya603@gmail.com'
        )
        RETURNING id
        `
      );
      const profileId = insertedProfile.rows[0]?.id || 1;

      await client.query(
        `
        INSERT INTO business_legal_entities (
          profile_id, entity_name, legal_form, planned_form, jurisdiction, taxpayer_number, status, transition_notes, is_current, created_by
        ) VALUES (
          $1, 'MADECC Group', 'INDIVIDUAL_ESTABLISHMENT_PLANNED', 'SARL', 'Cameroon', 'P030217852934P', 'PLANNED',
          'Initial pre-registration sole proprietorship founded by Kasah Rodrick Reboya (100% ownership). DGI Taxpayer NIU P030217852934P active; planned future transition to MADECC GROUP SARL upon formal OHADA RCCM registration.',
          true, 'kreboya603@gmail.com'
        )
        `,
        [profileId]
      );

      await client.query(
        `
        INSERT INTO corporate_content_versions (entity_type, entity_id, version_number, entity_title, change_summary, snapshot_json, created_by)
        VALUES ('BUSINESS_PROFILE', $1, 1, 'MADECC Group', 'Initial verified baseline profile (unregistered, founder-led)', $2::jsonb, 'kreboya603@gmail.com')
        `,
        [
          profileId,
          JSON.stringify({
            companyName: 'MADECC Group',
            legalStructure: 'INDIVIDUAL_ESTABLISHMENT_PLANNED',
            plannedLegalStructure: 'SARL',
            registrationStatus: 'UNREGISTERED',
            country: 'Cameroon',
            city: 'Yaoundé',
            founderName: 'Kasah Rodrick Reboya',
            ownershipPercentage: 100,
            motto: "Building Cameroon's Future",
            employeeCount: 0,
          }),
        ]
      );
    }

    // 4. Clean legacy synthetic RCCM/NIU/SARL placeholder strings and idempotently backfill functional NIU P030217852934P + corporate_description when empty
    await client.query(
      `
      UPDATE business_profiles
      SET
        taxpayer_number = CASE WHEN (taxpayer_number IS NULL OR BTRIM(taxpayer_number) = '') THEN 'P030217852934P' ELSE taxpayer_number END,
        is_tax_id_public = CASE WHEN (taxpayer_number IS NULL OR BTRIM(taxpayer_number) = '') THEN true ELSE is_tax_id_public END,
        country = CASE WHEN country = 'Cameroon' THEN 'Republic of Cameroon' ELSE country END,
        planned_legal_structure = CASE WHEN planned_legal_structure = 'SARL' THEN 'MADECC Group SARL' ELSE planned_legal_structure END,
        corporate_description = CASE WHEN (corporate_description IS NULL OR BTRIM(corporate_description) = '') THEN $1 ELSE corporate_description END
      `,
      [CORPORATE_DESCRIPTION_DEFAULT]
    );

    await client.query(`
      UPDATE business_legal_entities
      SET taxpayer_number = 'P030217852934P'
      WHERE is_current = true AND (taxpayer_number IS NULL OR BTRIM(taxpayer_number) = '');
    `);

    await client.query(`
      UPDATE site_settings
      SET
        rccm_number = CASE
          WHEN rccm_number IN ('RC/YAO/2023/B/1458', 'RC/YAO/2021/B/1429', 'RC/YAO/2020/B/1429', 'RC/YAO/2018/B/1429') THEN ''
          ELSE rccm_number
        END,
        niu_tax_id = CASE
          WHEN niu_tax_id IS NULL OR BTRIM(niu_tax_id) = '' OR niu_tax_id IN ('M072318492019A', 'M052114299876K', 'M022012845610W', 'M051812728192K') THEN 'P030217852934P'
          ELSE niu_tax_id
        END,
        legal_status = CASE
          WHEN legal_status IN ('SARL (Société à Responsabilité Limitée)', 'Société à Responsabilité Limitée (SARL)') THEN 'Individual establishment registration pending'
          ELSE legal_status
        END,
        developer_name = CASE
          WHEN developer_name IN ('MADECC GROUP PLC', 'MADECC GROUP SARL') THEN 'Kasah Rodrick Reboya'
          ELSE developer_name
        END
      WHERE id = 1;
    `);

    await client.query(`
      UPDATE tenants
      SET settings = jsonb_set(COALESCE(settings, '{}'::jsonb), '{taxNumber}', '"P030217852934P"'::jsonb, true)
      WHERE slug = 'madecc-construction'
        AND (settings->>'taxNumber' IS NULL OR BTRIM(settings->>'taxNumber') = '' OR settings->>'taxNumber' = 'M051812728192K');
    `);

    // 5. Idempotently Seed All 10 Business Divisions & All 146 Services (NEVER overwrites existing custom edits)
    for (const div of TEN_BUSINESS_DIVISIONS_SEED) {
      let divRes = await client.query(
        `
        INSERT INTO business_divisions (
          code, slug, name, category, summary, full_description,
          image_url, investment_info, compliance_disclaimer,
          operational_status, publish_status, country, operating_countries,
          currency, regulatory_body, licence_required, licence_status,
          visibility_public, is_featured, display_order, version, created_by, updated_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9,
          $10, $11, $12, $13::jsonb,
          $14, $15, $16, $17,
          true, true, $18, 1, 'kreboya603@gmail.com', 'kreboya603@gmail.com'
        )
        ON CONFLICT (code) DO NOTHING
        RETURNING id
        `,
        [
          div.code,
          div.slug,
          div.name,
          div.category,
          div.summary,
          div.fullDescription,
          div.imageUrl,
          div.investmentInfo || null,
          div.complianceDisclaimer || null,
          div.operationalStatus,
          div.publishStatus,
          div.country,
          JSON.stringify(div.operatingCountries),
          div.currency,
          div.regulatoryBody,
          div.licenceRequired,
          div.licenceStatus,
          div.displayOrder,
        ]
      );

      let divId = divRes.rows[0]?.id;
      if (!divId) {
        const existingDiv = await client.query(
          `SELECT id, image_url, investment_info, compliance_disclaimer FROM business_divisions WHERE code = $1 LIMIT 1`,
          [div.code]
        );
        divId = existingDiv.rows[0]?.id;
        if (divId) {
          // Non-destructively fill empty image/investment/disclaimer on already-seeded divisions
          await client.query(
            `
            UPDATE business_divisions
            SET
              image_url = COALESCE(NULLIF(BTRIM(image_url), ''), $2),
              investment_info = COALESCE(NULLIF(BTRIM(investment_info), ''), $3),
              compliance_disclaimer = COALESCE(NULLIF(BTRIM(compliance_disclaimer), ''), $4)
            WHERE id = $1
            `,
            [divId, div.imageUrl, div.investmentInfo || null, div.complianceDisclaimer || null]
          );
        }
      }

      if (divId) {
        for (let idx = 0; idx < div.services.length; idx++) {
          const svc = div.services[idx];
          const existingSvc = await client.query(
            `SELECT id FROM division_services WHERE division_id = $1 AND slug = $2 LIMIT 1`,
            [divId, svc.slug]
          );
          if (existingSvc.rows.length === 0) {
            await client.query(
              `
              INSERT INTO division_services (
                division_id, name, slug, category_group, short_description, full_description,
                investment_info, pricing_model, currency,
                operational_status, publish_status, visibility_public, display_order, version, created_by, updated_by
              ) VALUES (
                $1, $2, $3, $4, $5, $6,
                $7, $8, $9,
                $10, 'PUBLISHED', true, $11, 1, 'kreboya603@gmail.com', 'kreboya603@gmail.com'
              )
              `,
              [
                divId,
                svc.name,
                svc.slug,
                svc.categoryGroup || div.category,
                svc.desc,
                svc.desc,
                svc.investmentInfo || div.investmentInfo || null,
                svc.pricingModel || 'Project-specific feasibility & custom quote (subject to applicable licensing)',
                div.currency,
                div.operationalStatus,
                idx + 1,
              ]
            );
          }
        }
      }
    }

    // 5b. Seed initial truthful Pharmaceutical & Healthcare compliance tracking item if empty (UNVERIFIED / NOT_APPLIED)
    const pharmaCheck = await client.query(`SELECT COUNT(*)::int AS cnt FROM pharma_regulatory_compliance`);
    if ((pharmaCheck.rows[0]?.cnt || 0) === 0) {
      const pharmaDiv = await client.query(`SELECT id FROM business_divisions WHERE code = 'DIV-04' LIMIT 1`);
      await client.query(
        `
        INSERT INTO pharma_regulatory_compliance (
          division_id, country, regulatory_authority, licence_type, licence_number,
          verification_status, approval_status, compliance_notes, created_by, updated_by
        ) VALUES (
          $1, 'Republic of Cameroon', 'MINSANTE / DPML / ONPC',
          'Pharmaceutical Wholesale & Healthcare Facility Establishment Authorization',
          NULL,
          'UNVERIFIED', 'NOT_APPLIED',
          'Pre-application compliance record. MADECC Group is NOT a licensed pharmacy or pharmaceutical distributor. Unlicensed medicine sales or dispensing are strictly prohibited.',
          'kreboya603@gmail.com', 'kreboya603@gmail.com'
        )
        `,
        [pharmaDiv.rows[0]?.id || null]
      );
    }

    // 6. Seed Initial Ghanaian Investor Interest Record (Truthful, Zero Fake Commitments)
    const investorCheck = await client.query(`SELECT COUNT(*)::int AS cnt FROM investors`);
    if ((investorCheck.rows[0]?.cnt || 0) === 0) {
      const invRes = await client.query(
        `
        INSERT INTO investors (
          investor_name, organization, investor_type, investor_country, target_country,
          registration_jurisdiction, sector_focus, currency, stage,
          summary, confidential_notes, publish_as_opportunity,
          opportunity_title, opportunity_description, compliance_status,
          ownership_implication_note, version, created_by, updated_by
        ) VALUES (
          'Prospective Strategic Investor (Ghana)',
          'Ghana Cross-Border Investment Desk (Prospect)',
          'STRATEGIC_PARTNER',
          'Ghana',
          'Cameroon',
          'Cameroon',
          '["Real Estate & Property Development", "Pharmaceuticals & Healthcare Business"]'::jsonb,
          'USD',
          'INTEREST_EXPRESSED',
          'Prospective investor based in Ghana expressing exploratory interest in Cameroon real estate development and pharmaceutical distribution opportunities.',
          'Confidential tracking: Preliminary discussions only. No shareholding, MOU, term sheet, or signed agreement exists. Subject to Cameroon OHADA registration & MINSANTE/DPML regulatory licensing.',
          true,
          'Cameroon Real Estate & Healthcare Partnership Desk',
          'Exploratory partnership evaluation connecting regional West/Central African capital with planned Cameroonian real estate and regulated healthcare developments. Subject to formal entity registration and sector licensing.',
          'KYC_PENDING',
          'No existing shareholding, signed investment agreement, or capital commitment implied.',
          1,
          'kreboya603@gmail.com',
          'kreboya603@gmail.com'
        )
        RETURNING id
        `
      );

      if (invRes.rows[0]?.id) {
        await client.query(
          `
          INSERT INTO investor_interactions (
            investor_id, interaction_type, subject, summary, participants, next_steps, is_confidential, created_by
          ) VALUES (
            $1, 'INQUIRY', 'Initial Cross-Border Exploratory Interest (Ghana -> Cameroon)',
            'Initial interest expressed from a Ghana-based investor evaluating planned Cameroonian Real Estate and Pharmaceutical opportunities. Recorded truthfully as exploratory with zero legal commitment.',
            'Kasah Rodrick Reboya (Founder, MADECC Group)',
            'Complete Cameroon business registration, compile division feasibility briefs, and initiate NDA/KYC review if formal due diligence proceeds.',
            true,
            'kreboya603@gmail.com'
          )
          `,
          [invRes.rows[0].id]
        );
      }
    }

    ensured = true;
    console.log('✅ [CORPORATE_DB] Corporate profile, legal entities, 9 divisions, investors & governance tables verified.');
  } catch (err: any) {
    console.error('⚠️ [CORPORATE_DB] Failed ensuring corporate platform tables:', err?.message || err);
  } finally {
    client.release();
  }
}
