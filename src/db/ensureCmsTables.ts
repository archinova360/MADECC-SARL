import { pool, getOrInitPool } from './index.ts';

let cmsTablesEnsured = false;

const DEFAULT_LEGAL_DOCUMENTS = [
  {
    slug: 'privacy',
    docType: 'Privacy Policy',
    title: 'Privacy Policy & Cookie Data Notice',
    summary: 'How MADECC GROUP collects, processes, protects, and deletes personal data submitted via contact forms, client portals, and API access requests.',
    effectiveDate: '2026-02-01',
    lastUpdatedDate: '2026-11-19',
    contentHtml: `<h2>1. Data Controller Identity</h2><p>This website (<strong>https://madeccgroup.online</strong>) is operated by <strong>MADECC GROUP</strong>, a founder-led construction and engineering enterprise founded by <strong>Kasah Rodrick Reboya</strong>, based in Mbankolo, Yaoundé, Cameroon (Taxpayer ID / NIU: <strong>P030217852934P</strong>; legal status: <em>Individual establishment registration pending</em>).</p><h2>2. Information Collected</h2><ul><li>Contact and quote inquiries (name, email, phone, project specifications).</li><li>Client portal project files, invoices, and transaction references.</li><li>Essential security telemetry (rate limiting, session tokens, abuse prevention).</li></ul><h2>3. Contact &amp; Rights</h2><p>To request access, correction, or deletion of personal data, contact <a href="mailto:kreboya603@gmail.com">kreboya603@gmail.com</a> or visit the Data Deletion page.</p>`
  },
  {
    slug: 'terms',
    docType: 'Terms & Conditions',
    title: 'Terms & Conditions of Website & Service Use',
    summary: 'Master terms governing access to MADECC GROUP engineering calculators, consultation bookings, tenders, and digital services.',
    effectiveDate: '2026-02-01',
    lastUpdatedDate: '2026-11-19',
    contentHtml: `<h2>1. Scope of Agreement</h2><p>By using <strong>madeccgroup.online</strong>, you agree to these terms governing preliminary construction estimates, engineering inquiries, client portals, and digital publications.</p><h2>2. Disclosure of Registration Status</h2><p>MADECC GROUP operates as a founder-led enterprise headquartered in Mbankolo, Yaoundé, Cameroon (NIU: <strong>P030217852934P</strong>; formal entity registration currently pending). Any formal engineering contract requires written execution by authorized leadership.</p><h2>3. Cost Estimates Disclaimer</h2><p>Online budget calculations provide preliminary guidance only and do not constitute a binding commercial tender without formal geotechnical survey and signed Bills of Quantities.</p>`
  },
  {
    slug: 'cookies',
    docType: 'Cookie Policy',
    title: 'Cookie & Essential Session Storage Policy',
    summary: 'Transparent explanation of essential security cookies, preferences, and analytics consent choices.',
    effectiveDate: '2026-02-01',
    lastUpdatedDate: '2026-11-19',
    contentHtml: `<h2>1. How Cookies Are Used</h2><p>We use essential HTTP-only authentication cookies and CSRF security tokens to protect user accounts and prevent unauthorized requests.</p><h2>2. Preference Storage</h2><p>Interface language, light/dark theme preferences, and consent acknowledgments may be stored locally in your browser.</p><h2>3. Managing Preferences</h2><p>You can clear or block cookies through your browser settings at any time; disabling strictly necessary session cookies may restrict portal authentication.</p>`
  },
  {
    slug: 'disclaimer',
    docType: 'Website Disclaimer',
    title: 'General Engineering & Website Disclaimer',
    summary: 'Clarifications regarding preliminary cost calculators, third-party links, and verified corporate status.',
    effectiveDate: '2026-02-01',
    lastUpdatedDate: '2026-11-19',
    contentHtml: `<h2>1. Technical Information Accuracy</h2><p>Calculations and architectural guidance published on this website are prepared for informational and preliminary budgeting purposes. Structural construction decisions require site-specific engineering validation and stamped execution drawings.</p><h2>2. Corporate Verification</h2><p>Official records display only verified credentials (NIU: <strong>P030217852934P</strong>) and disclose pending formal registration status transparently.</p>`
  },
  {
    slug: 'copyright',
    docType: 'Copyright Notice',
    title: 'Copyright & Intellectual Property Notice',
    summary: 'Ownership rights covering engineering guides, KRR Bookstore publications, UI assets, and technical specifications.',
    effectiveDate: '2026-02-01',
    lastUpdatedDate: '2026-11-19',
    contentHtml: `<h2>1. Ownership</h2><p>© 2026 <strong>MADECC GROUP</strong> &amp; <strong>Kasah Rodrick Reboya</strong>. All original technical manuals, engineering software templates, calculators, and KRR Bookstore publications are protected under applicable intellectual property law.</p><h2>2. Permitted Use</h2><p>Authorized buyers and clients receive a non-transferable license for personal or internal project use only. Redistribution or resale without written authorization is prohibited.</p>`
  },
  {
    slug: 'acceptable-use',
    docType: 'Acceptable Use Policy',
    title: 'Platform Acceptable Use Policy',
    summary: 'Permitted behavior and prohibited security abuses across public forms, portals, and APIs.',
    effectiveDate: '2026-02-01',
    lastUpdatedDate: '2026-11-19',
    contentHtml: `<h2>1. Prohibited Activities</h2><ul><li>Automated scraping, vulnerability probing, credential stuffing, or denial-of-service attempts.</li><li>Submitting fraudulent payment references, forged documents, or unauthorized personal data.</li><li>Bypassing API rate limits or sharing restricted credentials.</li></ul>`
  },
  {
    slug: 'data-protection',
    docType: 'Data Protection Notice',
    title: 'Data Protection & Security Compliance Notice',
    summary: 'Operational safeguards protecting client blueprints, project files, and contact records.',
    effectiveDate: '2026-02-01',
    lastUpdatedDate: '2026-11-19',
    contentHtml: `<h2>1. Technical Safeguards</h2><p>Data is stored in managed PostgreSQL infrastructure with parameterized queries, role-based access control, CSRF protection, and transport encryption (HTTPS/TLS).</p><h2>2. Retention &amp; Deletion</h2><p>Project records are retained for contractual verification and deleted upon verified owner request where no statutory retention obligation applies.</p>`
  },
  {
    slug: 'api-terms',
    docType: 'API Terms of Use',
    title: 'Developer & Paid API Platform Terms of Use',
    summary: 'Terms governing API key issuance, payment verification, rate limits, and engineering calculation endpoints.',
    effectiveDate: '2026-02-01',
    lastUpdatedDate: '2026-11-19',
    contentHtml: `<h2>1. Key Issuance &amp; Verification</h2><p>Production API credentials are issued only after manual verification of MTN Mobile Money or Orange Money payment proof or approved enterprise agreement.</p><h2>2. Security Responsibilities</h2><p>Developers must keep secret keys strictly server-side, enforce environment variable isolation, and comply with per-minute rate limits.</p>`
  },
  {
    slug: 'investor-disclaimer',
    docType: 'Investor Disclaimer',
    title: 'Investor & Partnership Disclosure Disclaimer',
    summary: 'Non-solicitation notice and transparent disclosure for prospective regional partners and investors.',
    effectiveDate: '2026-02-01',
    lastUpdatedDate: '2026-11-19',
    contentHtml: `<h2>1. Informational Nature</h2><p>Materials describing upcoming projects, real estate concepts, or cross-border partnerships are exploratory and do not constitute a public securities offering.</p><h2>2. Due Diligence Disclosure</h2><p>MADECC GROUP discloses transparently that individual establishment registration is pending (NIU: <strong>P030217852934P</strong>) and formal agreements remain subject to legal review.</p>`
  },
  {
    slug: 'safety',
    docType: 'Health & Safety (QHSE) & Data Deletion Directive',
    title: 'Quality, Health, Safety & Environmental (QHSE) Directive',
    summary: 'Site PPE requirements, structural inspection gates, environmental controls, and data governance standards.',
    effectiveDate: '2026-02-01',
    lastUpdatedDate: '2026-11-19',
    contentHtml: `<h2>1. Zero-Harm Engineering Policy</h2><p>All active construction operations require mandatory PPE (helmets, safety boots, high-visibility vests, harnesses at height) and daily pre-task safety briefings.</p><h2>2. Structural Sign-Off Gates</h2><p>No concrete pour or structural load transfer proceeds without engineering reinforcement verification and mix compliance checks.</p>`
  }
];

const DEFAULT_ROUTES_CONFIG = [
  { path: '/', pageGroup: 'home', title: 'Home Landing Page', metaDescription: 'MADECC GROUP — Premier Civil Engineering, Construction & Digital Solutions in Cameroon.', priority: '1.0', changefreq: 'daily', robotsIndex: true, robotsFollow: true, includeInSitemap: true },
  { path: '/about', pageGroup: 'about', title: 'About MADECC GROUP', metaDescription: 'Corporate overview, founder governance, and engineering standards in Yaoundé, Cameroon.', priority: '0.8', changefreq: 'monthly', robotsIndex: true, robotsFollow: true, includeInSitemap: true },
  { path: '/services', pageGroup: 'services', title: 'Engineering & Construction Services', metaDescription: 'Construction, civil engineering, quantity surveying, real estate, and multi-division enterprise services.', priority: '0.9', changefreq: 'weekly', robotsIndex: true, robotsFollow: true, includeInSitemap: true },
  { path: '/website-development', pageGroup: 'services', title: 'Website Development Services', metaDescription: 'Corporate websites, client portals, MTN MoMo e-commerce, and technical SEO.', priority: '0.9', changefreq: 'weekly', robotsIndex: true, robotsFollow: true, includeInSitemap: true },
  { path: '/projects', pageGroup: 'projects', title: 'Projects Portfolio', metaDescription: 'Construction milestones, active works, and engineering deliverables across Cameroon.', priority: '0.9', changefreq: 'weekly', robotsIndex: true, robotsFollow: true, includeInSitemap: true },
  { path: '/developers', pageGroup: 'developers', title: 'Developer & Paid API Platform', metaDescription: 'REST APIs for BoQ estimates, concrete mix design, reinforcement, and regional material costs.', priority: '0.8', changefreq: 'weekly', robotsIndex: true, robotsFollow: true, includeInSitemap: true },
  { path: '/sitemap', pageGroup: 'sitemap', title: 'Architecture & Site Map', metaDescription: 'Directory of all public MADECC GROUP portals, calculators, guides, and governance pages.', priority: '0.8', changefreq: 'daily', robotsIndex: true, robotsFollow: true, includeInSitemap: true },
  { path: '/contact', pageGroup: 'contact', title: 'Contact Offices', metaDescription: 'Reach MADECC GROUP headquarters in Mbankolo, Yaoundé or schedule consultations.', priority: '0.8', changefreq: 'monthly', robotsIndex: true, robotsFollow: true, includeInSitemap: true },
  { path: '/budget-calculator', pageGroup: 'services', title: 'Project Budget Calculator', metaDescription: 'Real-time FCFA construction cost estimator.', priority: '0.8', changefreq: 'weekly', robotsIndex: true, robotsFollow: true, includeInSitemap: true },
  { path: '/construction-cost-guide', pageGroup: 'services', title: 'Cameroon Construction Cost Guide', metaDescription: 'Market unit rates for structural materials and labour in Cameroon.', priority: '0.8', changefreq: 'weekly', robotsIndex: true, robotsFollow: true, includeInSitemap: true },
  { path: '/tenders', pageGroup: 'services', title: 'Tenders & Procurement', metaDescription: 'Contractor tender opportunities and vendor prequalification.', priority: '0.9', changefreq: 'weekly', robotsIndex: true, robotsFollow: true, includeInSitemap: true },
  { path: '/store', pageGroup: 'services', title: 'KRR Bookstore', metaDescription: 'Civil engineering textbooks and study manuals.', priority: '0.9', changefreq: 'daily', robotsIndex: true, robotsFollow: true, includeInSitemap: true },
  { path: '/terms', pageGroup: 'legal', title: 'Terms & Conditions', metaDescription: 'Terms of service and civil engineering governance.', priority: '0.7', changefreq: 'monthly', robotsIndex: true, robotsFollow: true, includeInSitemap: true },
  { path: '/privacy', pageGroup: 'legal', title: 'Privacy Policy', metaDescription: 'Data privacy, session security, and user rights policy.', priority: '0.7', changefreq: 'monthly', robotsIndex: true, robotsFollow: true, includeInSitemap: true },
  { path: '/safety', pageGroup: 'legal', title: 'Health & Safety (QHSE)', metaDescription: 'Workplace safety and environmental compliance directive.', priority: '0.7', changefreq: 'monthly', robotsIndex: true, robotsFollow: true, includeInSitemap: true },
  { path: '/data-deletion', pageGroup: 'legal', title: 'Data Deletion Portal', metaDescription: 'Request account and personal data erasure.', priority: '0.7', changefreq: 'monthly', robotsIndex: true, robotsFollow: true, includeInSitemap: true },
  { path: '/admin', pageGroup: 'system', title: 'Admin Command Center (Protected)', metaDescription: 'Restricted administrative console.', priority: '0.1', changefreq: 'never', robotsIndex: false, robotsFollow: false, includeInSitemap: false, isSystemRoute: true }
];

export async function ensureCmsTables(): Promise<void> {
  if (cmsTablesEnsured) return;
  const activePool = pool || getOrInitPool();
  if (!activePool) {
    console.warn('[CMS_DB] Database pool unavailable, deferring CMS table init.');
    return;
  }

  const client = await activePool.connect();
  try {
    // 1. Safe additive columns on existing CMS tables
    await client.query(`
      ALTER TABLE page_contents ADD COLUMN IF NOT EXISTS page_group TEXT DEFAULT 'public';
      ALTER TABLE page_contents ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'NOT_REVIEWED';
      ALTER TABLE page_contents ADD COLUMN IF NOT EXISTS scheduled_publish_at TIMESTAMP WITHOUT TIME ZONE;
      ALTER TABLE page_contents ADD COLUMN IF NOT EXISTS expires_at TIMESTAMP WITHOUT TIME ZONE;
      ALTER TABLE page_contents ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITHOUT TIME ZONE;
      ALTER TABLE page_contents ADD COLUMN IF NOT EXISTS approval_notes TEXT;
      ALTER TABLE page_contents ADD COLUMN IF NOT EXISTS approved_by TEXT;
      ALTER TABLE page_contents ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITHOUT TIME ZONE;
      ALTER TABLE page_contents ADD COLUMN IF NOT EXISTS last_publish_error TEXT;
    `);

    await client.query(`
      ALTER TABLE page_content_revisions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'PUBLISHED';
      ALTER TABLE page_content_revisions ADD COLUMN IF NOT EXISTS published_at TIMESTAMP WITHOUT TIME ZONE;
      ALTER TABLE page_content_revisions ADD COLUMN IF NOT EXISTS action_type TEXT DEFAULT 'PUBLISH';
    `);

    await client.query(`
      ALTER TABLE media_library ADD COLUMN IF NOT EXISTS description TEXT;
      ALTER TABLE media_library ADD COLUMN IF NOT EXISTS credit_source TEXT;
      ALTER TABLE media_library ADD COLUMN IF NOT EXISTS folder TEXT DEFAULT 'Root';
      ALTER TABLE media_library ADD COLUMN IF NOT EXISTS subtitles_url TEXT;
      ALTER TABLE media_library ADD COLUMN IF NOT EXISTS transcript TEXT;
      ALTER TABLE media_library ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
      ALTER TABLE media_library ADD COLUMN IF NOT EXISTS duration_seconds INTEGER;
      ALTER TABLE media_library ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
      ALTER TABLE media_library ADD COLUMN IF NOT EXISTS storage_provider TEXT DEFAULT 'cloudinary';
      ALTER TABLE media_library ADD COLUMN IF NOT EXISTS public_id TEXT;
      ALTER TABLE media_library ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP WITHOUT TIME ZONE;
    `);

    // 2. Create 7 new tables cleanly
    await client.query(`
      CREATE TABLE IF NOT EXISTS legal_documents (
        id SERIAL PRIMARY KEY,
        slug TEXT NOT NULL UNIQUE,
        doc_type TEXT NOT NULL,
        title TEXT NOT NULL,
        summary TEXT,
        content_html TEXT NOT NULL DEFAULT '',
        status TEXT NOT NULL DEFAULT 'DRAFT',
        version INTEGER NOT NULL DEFAULT 1,
        effective_date TEXT,
        last_updated_date TEXT,
        review_status TEXT NOT NULL DEFAULT 'REVIEW_REQUIRED',
        legal_review_warning TEXT DEFAULT 'Requires review by qualified legal counsel before treating as final statutory text.',
        requires_professional_review BOOLEAN NOT NULL DEFAULT true,
        draft_data JSONB,
        published_data JSONB,
        scheduled_publish_at TIMESTAMP WITHOUT TIME ZONE,
        published_at TIMESTAMP WITHOUT TIME ZONE,
        archived_at TIMESTAMP WITHOUT TIME ZONE,
        updated_by TEXT DEFAULT 'MADECC Admin',
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS legal_document_revisions (
        id SERIAL PRIMARY KEY,
        legal_slug TEXT NOT NULL,
        version INTEGER NOT NULL,
        title TEXT NOT NULL,
        snapshot_data JSONB NOT NULL,
        change_summary TEXT,
        author TEXT DEFAULT 'MADECC Admin',
        is_published BOOLEAN DEFAULT false,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS content_reviews (
        id SERIAL PRIMARY KEY,
        target_type TEXT NOT NULL,
        target_slug TEXT NOT NULL,
        review_status TEXT NOT NULL DEFAULT 'NOT_REVIEWED',
        grammar_issues_count INTEGER NOT NULL DEFAULT 0,
        readability_score INTEGER NOT NULL DEFAULT 0,
        repeated_phrases_count INTEGER NOT NULL DEFAULT 0,
        hype_flags_count INTEGER NOT NULL DEFAULT 0,
        fact_check_issues JSONB DEFAULT '[]'::jsonb,
        report_json JSONB DEFAULT '{}'::jsonb,
        reviewer_notes TEXT,
        reviewed_by TEXT,
        reviewed_at TIMESTAMP WITHOUT TIME ZONE,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS publication_history (
        id SERIAL PRIMARY KEY,
        target_type TEXT NOT NULL,
        target_slug TEXT NOT NULL,
        target_title TEXT,
        action TEXT NOT NULL,
        from_status TEXT,
        to_status TEXT,
        version INTEGER,
        scheduled_for TIMESTAMP WITHOUT TIME ZONE,
        success BOOLEAN NOT NULL DEFAULT true,
        error_message TEXT,
        performed_by TEXT DEFAULT 'MADECC Admin',
        details TEXT,
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS maintenance_schedules (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'CANCELLED',
        mode TEXT NOT NULL DEFAULT 'non_intrusive_banner',
        timezone TEXT NOT NULL DEFAULT 'Africa/Douala',
        start_at TIMESTAMP WITHOUT TIME ZONE,
        end_at TIMESTAMP WITHOUT TIME ZONE,
        estimated_completion TEXT,
        affected_scope TEXT DEFAULT 'Background Sync & Cloud Backup Only (All Public Pages & Calculators 100% Active)',
        allow_admin_bypass BOOLEAN NOT NULL DEFAULT true,
        require_manual_confirm BOOLEAN NOT NULL DEFAULT false,
        full_site_advisory BOOLEAN NOT NULL DEFAULT false,
        subscribers_json JSONB DEFAULT '[]'::jsonb,
        last_smtp_dispatch_at TIMESTAMP WITHOUT TIME ZONE,
        last_smtp_status TEXT,
        created_by TEXT DEFAULT 'MADECC Admin',
        updated_by TEXT DEFAULT 'MADECC Admin',
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS visitor_announcements (
        id SERIAL PRIMARY KEY,
        title TEXT NOT NULL,
        message TEXT NOT NULL,
        category TEXT NOT NULL DEFAULT 'NOTICE',
        priority INTEGER NOT NULL DEFAULT 1,
        display_location TEXT NOT NULL DEFAULT 'site_wide_banner',
        target_pages JSONB DEFAULT '[]'::jsonb,
        cta_text TEXT,
        cta_link TEXT,
        dismissible BOOLEAN NOT NULL DEFAULT true,
        active BOOLEAN NOT NULL DEFAULT false,
        publish_at TIMESTAMP WITHOUT TIME ZONE,
        expire_at TIMESTAMP WITHOUT TIME ZONE,
        timezone TEXT NOT NULL DEFAULT 'Africa/Douala',
        notify_subscribers_smtp BOOLEAN NOT NULL DEFAULT false,
        last_smtp_status TEXT,
        created_by TEXT DEFAULT 'MADECC Admin',
        created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
      );

      CREATE TABLE IF NOT EXISTS site_routes_config (
        id SERIAL PRIMARY KEY,
        path TEXT NOT NULL UNIQUE,
        page_group TEXT NOT NULL DEFAULT 'public',
        title TEXT NOT NULL,
        meta_description TEXT,
        robots_index BOOLEAN NOT NULL DEFAULT true,
        robots_follow BOOLEAN NOT NULL DEFAULT true,
        include_in_sitemap BOOLEAN NOT NULL DEFAULT true,
        priority TEXT NOT NULL DEFAULT '0.8',
        changefreq TEXT NOT NULL DEFAULT 'weekly',
        is_system_route BOOLEAN NOT NULL DEFAULT false,
        status TEXT NOT NULL DEFAULT 'PUBLISHED',
        updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
      );
    `);

    // 3. Seed Legal Documents idempotently (DRAFT status with legal review warning until admin publishes/approves)
    for (const doc of DEFAULT_LEGAL_DOCUMENTS) {
      const payload = {
        title: doc.title,
        docType: doc.docType,
        summary: doc.summary,
        contentHtml: doc.contentHtml,
        effectiveDate: doc.effectiveDate,
        lastUpdatedDate: doc.lastUpdatedDate
      };
      await client.query(
        `
        INSERT INTO legal_documents (
          slug, doc_type, title, summary, content_html, status, version,
          effective_date, last_updated_date, review_status, requires_professional_review,
          draft_data, published_data, updated_by
        ) VALUES ($1, $2, $3, $4, $5, 'DRAFT', 1, $6, $7, 'REVIEW_REQUIRED', true, $8::jsonb, NULL, 'System Initializer')
        ON CONFLICT (slug) DO NOTHING;
        `,
        [doc.slug, doc.docType, doc.title, doc.summary, doc.contentHtml, doc.effectiveDate, doc.lastUpdatedDate, JSON.stringify(payload)]
      );
    }

    // 4. Seed public routes catalog idempotently
    for (const r of DEFAULT_ROUTES_CONFIG) {
      await client.query(
        `
        INSERT INTO site_routes_config (
          path, page_group, title, meta_description, robots_index, robots_follow,
          include_in_sitemap, priority, changefreq, is_system_route, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'PUBLISHED')
        ON CONFLICT (path) DO NOTHING;
        `,
        [r.path, r.pageGroup, r.title, r.metaDescription, r.robotsIndex, r.robotsFollow, r.includeInSitemap, r.priority, r.changefreq, Boolean(r.isSystemRoute)]
      );
    }

    // 5. Ensure at least one standby maintenance record exists so DB state replaces volatile memory cleanly
    const maintCountRes = await client.query(`SELECT COUNT(*)::int AS cnt FROM maintenance_schedules;`);
    if ((maintCountRes.rows[0]?.cnt || 0) === 0) {
      await client.query(
        `
        INSERT INTO maintenance_schedules (
          title, message, status, mode, timezone, estimated_completion, affected_scope,
          allow_admin_bypass, require_manual_confirm, full_site_advisory, subscribers_json, created_by
        ) VALUES (
          'Scheduled Platform Enhancement & Maintenance in Progress',
          'We are currently performing background engineering database & server optimizations. You can continue browsing all pages, using calculators, and exploring the website without any interruption.',
          'CANCELLED',
          'non_intrusive_banner',
          'Africa/Douala',
          'Today at 18:00 WAT',
          'Background Sync & Cloud Backup Only (All Public Pages & Calculators 100% Active)',
          true,
          false,
          false,
          $1::jsonb,
          'System Initializer'
        );
        `,
        [
          JSON.stringify([
            {
              email: 'kreboya603@gmail.com',
              name: 'Executive Admin Monitor',
              phone: '+237 671 063 511',
              note: 'Primary SMTP Maintenance Dispatch Account',
              subscribedAt: new Date().toISOString()
            }
          ])
        ]
      );
    }

    cmsTablesEnsured = true;
    console.log('✅ [DATABASE] Website Content & Publishing Management Centre tables ensured.');
  } catch (err: any) {
    console.error('⚠️ [CMS_DB_INIT_ERROR]', err.message);
  } finally {
    client.release();
  }
}
