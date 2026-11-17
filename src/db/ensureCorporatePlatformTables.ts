import { pool, getOrInitPool } from './index.ts';

let ensured = false;

export const REGISTRATION_STATUS_LABELS: Record<string, string> = {
  UNREGISTERED: 'Unregistered – formal registration pending',
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
        employee_count INTEGER NOT NULL DEFAULT 0,
        employee_count_note TEXT DEFAULT 'Founder-led venture; no salaried employees yet',
        is_reg_number_public BOOLEAN NOT NULL DEFAULT false,
        is_tax_id_public BOOLEAN NOT NULL DEFAULT false,
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
        operational_status TEXT NOT NULL DEFAULT 'PROPOSED',
        publish_status TEXT NOT NULL DEFAULT 'PUBLISHED',
        country TEXT NOT NULL DEFAULT 'Cameroon',
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

      CREATE TABLE IF NOT EXISTS division_services (
        id SERIAL PRIMARY KEY,
        division_id INTEGER NOT NULL,
        name TEXT NOT NULL,
        slug TEXT NOT NULL,
        short_description TEXT NOT NULL,
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

    // 4. Clean legacy synthetic RCCM/NIU/SARL placeholder strings and idempotently backfill functional NIU P030217852934P when empty/uninitialized
    await client.query(`
      UPDATE business_profiles
      SET
        taxpayer_number = 'P030217852934P',
        is_tax_id_public = true
      WHERE (taxpayer_number IS NULL OR BTRIM(taxpayer_number) = '');

      UPDATE business_legal_entities
      SET taxpayer_number = 'P030217852934P'
      WHERE is_current = true AND (taxpayer_number IS NULL OR BTRIM(taxpayer_number) = '');

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

      UPDATE tenants
      SET settings = jsonb_set(COALESCE(settings, '{}'::jsonb), '{taxNumber}', '"P030217852934P"'::jsonb, true)
      WHERE slug = 'madecc-construction'
        AND (settings->>'taxNumber' IS NULL OR BTRIM(settings->>'taxNumber') = '' OR settings->>'taxNumber' = 'M051812728192K');
    `);

    // 5. Seed All 9 Business Divisions + Key Sub-Services Idempotently (ON CONFLICT DO NOTHING)
    const divisionsSeed = [
      {
        code: 'DIV-01',
        slug: 'construction-building-services',
        name: 'Division 1 — Construction & Building Services',
        category: 'Construction & Building',
        summary: 'Residential, commercial, industrial, mixed-use developments, renovations, and project management in Cameroon.',
        fullDescription: 'Turnkey building execution, residential villas & apartments, commercial/mixed-use developments, renovations, site supervision, and digital quantity surveying.',
        operationalStatus: 'PROPOSED',
        publishStatus: 'PUBLISHED',
        country: 'Cameroon',
        operatingCountries: ['Cameroon'],
        currency: 'XAF',
        regulatoryBody: 'MINHDU / Municipal Building Permit Authorities (CUY/CUD)',
        licenceRequired: true,
        licenceStatus: 'NOT_APPLIED',
        displayOrder: 1,
        services: [
          { name: 'Residential & Commercial Turnkey Building', slug: 'residential-commercial-turnkey', desc: 'Feasibility, structural framing, masonry, MEP systems, and handover coordination subject to municipal building permits.' },
          { name: 'Renovation & Structural Rehabilitation', slug: 'renovation-rehabilitation', desc: 'Modernization, waterproofing, and structural reinforcement of existing residential and commercial properties.' },
          { name: 'Digital BOQ & Construction Cost Advisory', slug: 'digital-boq-cost-advisory', desc: 'Itemized Bill of Quantities preparation, unit-rate benchmarking in FCFA, and project supervision planning.' },
        ],
      },
      {
        code: 'DIV-02',
        slug: 'civil-engineering-infrastructure',
        name: 'Division 2 — Civil Engineering & Infrastructure',
        category: 'Civil Engineering',
        summary: 'Structural design review, site grading, drainage works, retaining walls, rural access roads, and engineering supervision.',
        fullDescription: 'Core civil engineering preparation covering earthworks, stormwater drainage, structural calculation modeling (Eurocode 2 / BAEL 91), culverts, and technical inspection workflows.',
        operationalStatus: 'UNDER_FEASIBILITY',
        publishStatus: 'PUBLISHED',
        country: 'Cameroon',
        operatingCountries: ['Cameroon'],
        currency: 'XAF',
        regulatoryBody: 'MINTP / Ordre National des Ingénieurs de Génie Civil (ONIGC)',
        licenceRequired: true,
        licenceStatus: 'NOT_APPLIED',
        displayOrder: 2,
        services: [
          { name: 'Structural Analysis & Reinforcement Modeling', slug: 'structural-analysis-modeling', desc: 'Preliminary reinforced concrete beam, column, slab, and footing calculations under Eurocode 2 guidance.' },
          { name: 'Drainage, Culverts & Earthworks Planning', slug: 'drainage-earthworks-planning', desc: 'Site grading, retaining walls, stormwater channels, and geotechnical testing coordination with accredited labs.' },
        ],
      },
      {
        code: 'DIV-03',
        slug: 'real-estate-property-development',
        name: 'Division 3 — Real Estate & Property Development',
        category: 'Real Estate',
        summary: 'Residential & mixed-use real estate development, land feasibility evaluation, investment structuring, and property advisory in Cameroon.',
        fullDescription: 'Strategic property development pipeline targeting urban housing and mixed-use commercial spaces in Yaoundé, Douala, and secondary growth hubs, open to structured joint-venture and cross-border co-investment.',
        operationalStatus: 'SEEKING_INVESTMENT',
        publishStatus: 'PUBLISHED',
        country: 'Cameroon',
        operatingCountries: ['Cameroon', 'Ghana (Investor Origination)'],
        currency: 'XAF',
        regulatoryBody: 'MINDCAF (Land Title Verification) / MINHDU',
        licenceRequired: true,
        licenceStatus: 'NOT_APPLIED',
        displayOrder: 3,
        services: [
          { name: 'Land Feasibility & Development Packaging', slug: 'land-feasibility-packaging', desc: 'Topographical review, preliminary yield modeling, and construction cost feasibility for residential estates.' },
          { name: 'Joint-Venture Real Estate Co-Development', slug: 'jv-real-estate-development', desc: 'Structured partnership scoping for cross-border diaspora and regional investors targeting Cameroonian real estate.' },
        ],
      },
      {
        code: 'DIV-04',
        slug: 'pharmaceuticals-healthcare-business',
        name: 'Division 4 — Pharmaceuticals & Healthcare Business',
        category: 'Pharmaceuticals & Healthcare',
        summary: 'Proposed pharmaceutical distribution, medical supply, and healthcare venture subject strictly to MINSANTE & DPML regulatory licensing.',
        fullDescription: 'Planned healthcare and pharmaceutical enterprise division in Cameroon, currently in pre-registration / regulatory preparation. No dispensing, wholesale distribution, or clinical operations may proceed without formal MINSANTE / DPML authorization and qualified pharmacist oversight.',
        operationalStatus: 'AWAITING_REGULATORY_APPROVAL',
        publishStatus: 'PUBLISHED',
        country: 'Cameroon',
        operatingCountries: ['Cameroon'],
        currency: 'XAF',
        regulatoryBody: 'MINSANTE / DPML (Direction de la Pharmacie, du Médicament et des Laboratoires) / ONPC',
        licenceRequired: true,
        licenceStatus: 'NOT_APPLIED',
        displayOrder: 4,
        services: [
          { name: 'Healthcare Facility & Pharma Infrastructure Advisory', slug: 'pharma-infrastructure-advisory', desc: 'Facility planning, clean-zone layout scoping, and investment feasibility subject to MINSANTE regulatory clearance.' },
          { name: 'Pharmaceutical Supply & Distribution Venture (Proposed)', slug: 'pharma-supply-venture-proposed', desc: 'Cross-border investment concept under feasibility evaluation; operations strictly contingent on MINSANTE licensing.' },
        ],
      },
      {
        code: 'DIV-05',
        slug: 'agriculture-agribusiness',
        name: 'Division 5 — Agriculture & Agribusiness',
        category: 'Agriculture & Agribusiness',
        summary: 'Proposed commercial crop production, cold-chain farm infrastructure, and agricultural value-chain partnerships.',
        fullDescription: 'Planned agribusiness division exploring arable crop farming, farm civil infrastructure, irrigation layout, and out-grower partnerships across fertile Cameroonian agricultural zones.',
        operationalStatus: 'PROPOSED',
        publishStatus: 'PUBLISHED',
        country: 'Cameroon',
        operatingCountries: ['Cameroon'],
        currency: 'XAF',
        regulatoryBody: 'MINADER / MINEPIA',
        licenceRequired: false,
        licenceStatus: 'NOT_APPLIED',
        displayOrder: 5,
        services: [
          { name: 'Agricultural Infrastructure & Irrigation Scoping', slug: 'agri-infrastructure-scoping', desc: 'Feasibility planning for greenhouses, farm storage buildings, and water retention basins.' },
        ],
      },
      {
        code: 'DIV-06',
        slug: 'agro-processing-food-manufacturing',
        name: 'Division 6 — Agro-Processing & Food Manufacturing',
        category: 'Agro-Processing',
        summary: 'Proposed food processing facility engineering, post-harvest transformation concepts, and industrial unit planning.',
        fullDescription: 'Concept-stage industrial food transformation division focused on reducing post-harvest losses through compliant processing facility design and partnership formation.',
        operationalStatus: 'PROPOSED',
        publishStatus: 'PUBLISHED',
        country: 'Cameroon',
        operatingCountries: ['Cameroon'],
        currency: 'XAF',
        regulatoryBody: 'MINMIDT / ANOR (Standards & Quality Agency)',
        licenceRequired: true,
        licenceStatus: 'NOT_APPLIED',
        displayOrder: 6,
        services: [
          { name: 'Food Processing Plant Concept & Civil Layout', slug: 'food-plant-concept', desc: 'Preliminary plant workflow, civil building specs, and ANOR compliance roadmap.' },
        ],
      },
      {
        code: 'DIV-07',
        slug: 'warehousing-logistics-distribution',
        name: 'Division 7 — Warehousing, Logistics & Distribution',
        category: 'Logistics & Warehousing',
        summary: 'Proposed storage depots, construction supply logistics, and regional freight coordination corridors.',
        fullDescription: 'Planned logistics and warehousing division designed to support industrial storage, steel/cement inventory staging, and regional trade corridors.',
        operationalStatus: 'PROPOSED',
        publishStatus: 'PUBLISHED',
        country: 'Cameroon',
        operatingCountries: ['Cameroon'],
        currency: 'XAF',
        regulatoryBody: 'MINT (Ministry of Transport) / Customs & Port Authorities',
        licenceRequired: true,
        licenceStatus: 'NOT_APPLIED',
        displayOrder: 7,
        services: [
          { name: 'Industrial Warehouse Construction & Staging', slug: 'warehouse-staging-concepts', desc: 'Design-build planning for portal-frame depots and regional supply hubs.' },
        ],
      },
      {
        code: 'DIV-08',
        slug: 'renewable-energy-solar-solutions',
        name: 'Division 8 — Renewable Energy & Solar Solutions',
        category: 'Renewable Energy',
        summary: 'Hybrid solar PV backup concepts for residential villas, construction sites, clinics, and commercial estates.',
        fullDescription: 'Clean energy integration unit evaluating commercial rooftop solar PV, hybrid inverter sizing, and off-grid borehole pumping for building developments.',
        operationalStatus: 'UNDER_FEASIBILITY',
        publishStatus: 'PUBLISHED',
        country: 'Cameroon',
        operatingCountries: ['Cameroon'],
        currency: 'XAF',
        regulatoryBody: 'MINEE / ARSEL',
        licenceRequired: false,
        licenceStatus: 'NOT_APPLIED',
        displayOrder: 8,
        services: [
          { name: 'Building-Integrated Solar PV Sizing', slug: 'solar-pv-sizing', desc: 'Load profiling and hybrid battery backup design integrated into new residential and commercial construction.' },
        ],
      },
      {
        code: 'DIV-09',
        slug: 'building-materials-manufacturing',
        name: 'Division 9 — Building Materials & Manufacturing',
        category: 'Building Materials',
        summary: 'Proposed local fabrication of interlocking compressed blocks, precast concrete elements, and aggregate sourcing.',
        fullDescription: 'Strategic backward-integration initiative evaluating precast pavers, vibrated hollow blocks, and standardized reinforcement prefabrication to lower project input costs.',
        operationalStatus: 'PROPOSED',
        publishStatus: 'PUBLISHED',
        country: 'Cameroon',
        operatingCountries: ['Cameroon'],
        currency: 'XAF',
        regulatoryBody: 'MINMIDT / MINEPDED',
        licenceRequired: true,
        licenceStatus: 'NOT_APPLIED',
        displayOrder: 9,
        services: [
          { name: 'Precast Concrete & Masonry Supply Concept', slug: 'precast-masonry-concept', desc: 'Quality-tested block and kerbstone production feasibility for urban construction developments.' },
        ],
      },
    ];

    for (const div of divisionsSeed) {
      const res = await client.query(
        `
        INSERT INTO business_divisions (
          code, slug, name, category, summary, full_description,
          operational_status, publish_status, country, operating_countries,
          currency, regulatory_body, licence_required, licence_status,
          visibility_public, is_featured, display_order, version, created_by, updated_by
        ) VALUES (
          $1, $2, $3, $4, $5, $6,
          $7, $8, $9, $10::jsonb,
          $11, $12, $13, $14,
          true, true, $15, 1, 'kreboya603@gmail.com', 'kreboya603@gmail.com'
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

      if (res.rows[0]?.id) {
        const divId = res.rows[0].id;
        for (let idx = 0; idx < div.services.length; idx++) {
          const svc = div.services[idx];
          await client.query(
            `
            INSERT INTO division_services (
              division_id, name, slug, short_description, pricing_model, currency,
              operational_status, publish_status, visibility_public, display_order, version, created_by, updated_by
            ) VALUES (
              $1, $2, $3, $4, 'Project-specific feasibility & custom quote (subject to applicable licensing)', $5,
              $6, 'PUBLISHED', true, $7, 1, 'kreboya603@gmail.com', 'kreboya603@gmail.com'
            )
            `,
            [divId, svc.name, svc.slug, svc.desc, div.currency, div.operationalStatus, idx + 1]
          );
        }
      }
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
