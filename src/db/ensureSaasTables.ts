import { pool, getOrInitPool } from './index.ts';

let saasTablesReady = false;
let ensurePromise: Promise<void> | null = null;

export const DEFAULT_SAAS_PAYMENT_CONFIG = {
  momoNumbers: ['+237671063511', '+237683316486'],
  orangeMoneyNumbers: ['+237689115595', '+237640194505'],
  bankAccount: {
    accountName: 'MADECC GROUP SAAS / DIRECT SERVICES',
    bankName: 'UBA Cameroon / Afriland First Bank',
    accountNumber: 'CM21 10005 00012 34567890123 45',
    ibanOrSwift: 'UNAFCMCXXXX'
  },
  contactWhatsApp: '+237671063511',
  contactEmail: 'kreboya603@gmail.com',
  promoNote: 'Enjoy 2 Months Free with Annual Billing! Instant Workspace Activation.'
};

export async function ensureSaasTables(): Promise<void> {
  if (saasTablesReady) return;
  if (ensurePromise) return ensurePromise;

  ensurePromise = (async () => {
    const activePool = pool || getOrInitPool();
    if (!activePool) {
      console.warn('[ENSURE_SAAS_TABLES] No database pool available.');
      return;
    }

    const client = await activePool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS tenants (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          legal_name TEXT,
          logo_url TEXT,
          favicon_url TEXT,
          brand_cover_url TEXT,
          primary_domain TEXT,
          custom_domain TEXT,
          status TEXT NOT NULL DEFAULT 'ACTIVE',
          publish_status TEXT NOT NULL DEFAULT 'PUBLISHED',
          published_version INTEGER NOT NULL DEFAULT 1,
          published_at TIMESTAMP DEFAULT NOW(),
          last_republished_at TIMESTAMP,
          plan_code TEXT NOT NULL DEFAULT 'ENTERPRISE',
          currency TEXT NOT NULL DEFAULT 'XAF',
          timezone TEXT DEFAULT 'Africa/Douala',
          phone TEXT,
          email TEXT,
          address TEXT,
          country TEXT DEFAULT 'Cameroon',
          settings JSONB,
          ai_credits_balance INTEGER NOT NULL DEFAULT 10000,
          storage_usage_bytes BIGINT NOT NULL DEFAULT 0,
          is_flagship BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        ALTER TABLE tenants ADD COLUMN IF NOT EXISTS brand_cover_url TEXT;
        ALTER TABLE tenants ADD COLUMN IF NOT EXISTS publish_status TEXT NOT NULL DEFAULT 'PUBLISHED';
        ALTER TABLE tenants ADD COLUMN IF NOT EXISTS published_version INTEGER NOT NULL DEFAULT 1;
        ALTER TABLE tenants ADD COLUMN IF NOT EXISTS published_at TIMESTAMP DEFAULT NOW();
        ALTER TABLE tenants ADD COLUMN IF NOT EXISTS last_republished_at TIMESTAMP;
        ALTER TABLE tenants ADD COLUMN IF NOT EXISTS storage_usage_bytes BIGINT NOT NULL DEFAULT 0;

        CREATE TABLE IF NOT EXISTS tenant_memberships (
          id SERIAL PRIMARY KEY,
          tenant_id INTEGER NOT NULL,
          user_id TEXT NOT NULL,
          email TEXT NOT NULL,
          full_name TEXT,
          role TEXT NOT NULL DEFAULT 'MEMBER',
          permissions JSONB,
          status TEXT NOT NULL DEFAULT 'ACTIVE',
          invited_by TEXT,
          invited_at TIMESTAMP,
          last_active_at TIMESTAMP,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS plans (
          id SERIAL PRIMARY KEY,
          code TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          description TEXT,
          monthly_price INTEGER NOT NULL,
          annual_price INTEGER NOT NULL,
          currency TEXT NOT NULL DEFAULT 'XAF',
          max_users INTEGER NOT NULL DEFAULT 3,
          max_projects INTEGER NOT NULL DEFAULT 5,
          max_storage_gb INTEGER NOT NULL DEFAULT 5,
          ai_credits_monthly INTEGER NOT NULL DEFAULT 100,
          features JSONB,
          is_popular BOOLEAN DEFAULT FALSE,
          status TEXT NOT NULL DEFAULT 'ACTIVE',
          publish_status TEXT NOT NULL DEFAULT 'PUBLISHED',
          version INTEGER NOT NULL DEFAULT 1,
          published_at TIMESTAMP DEFAULT NOW(),
          display_order INTEGER NOT NULL DEFAULT 1,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        ALTER TABLE plans ADD COLUMN IF NOT EXISTS publish_status TEXT NOT NULL DEFAULT 'PUBLISHED';
        ALTER TABLE plans ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1;
        ALTER TABLE plans ADD COLUMN IF NOT EXISTS published_at TIMESTAMP DEFAULT NOW();

        CREATE TABLE IF NOT EXISTS subscriptions (
          id SERIAL PRIMARY KEY,
          tenant_id INTEGER NOT NULL,
          plan_code TEXT NOT NULL,
          billing_cycle TEXT NOT NULL DEFAULT 'MONTHLY',
          amount INTEGER NOT NULL,
          currency TEXT NOT NULL DEFAULT 'XAF',
          status TEXT NOT NULL DEFAULT 'PENDING_CONFIRMATION',
          payment_method TEXT,
          payment_reference TEXT,
          sender_phone TEXT,
          proof_url TEXT,
          notes TEXT,
          start_date TIMESTAMP NOT NULL DEFAULT NOW(),
          renewal_date TIMESTAMP NOT NULL,
          confirmed_at TIMESTAMP,
          confirmed_by TEXT,
          thank_you_shown BOOLEAN NOT NULL DEFAULT FALSE,
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        ALTER TABLE subscriptions ADD COLUMN IF NOT EXISTS proof_url TEXT;

        CREATE TABLE IF NOT EXISTS tenant_domains (
          id SERIAL PRIMARY KEY,
          tenant_id INTEGER NOT NULL,
          domain TEXT NOT NULL UNIQUE,
          domain_type TEXT NOT NULL DEFAULT 'CUSTOM',
          status TEXT NOT NULL DEFAULT 'ACTIVE',
          ssl_status TEXT DEFAULT 'PROVISIONED',
          verification_token TEXT,
          verified_at TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS usage_events (
          id SERIAL PRIMARY KEY,
          tenant_id INTEGER NOT NULL,
          user_id TEXT,
          event_type TEXT NOT NULL,
          quantity INTEGER NOT NULL DEFAULT 1,
          unit TEXT NOT NULL DEFAULT 'credit',
          estimated_cost INTEGER DEFAULT 0,
          metadata JSONB,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS platform_audit_logs (
          id SERIAL PRIMARY KEY,
          tenant_id INTEGER,
          user_id TEXT,
          user_email TEXT,
          action TEXT NOT NULL,
          resource_type TEXT NOT NULL,
          resource_id TEXT,
          ip_address TEXT,
          metadata JSONB,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS saas_workspace_versions (
          id SERIAL PRIMARY KEY,
          tenant_id INTEGER NOT NULL,
          version_number INTEGER NOT NULL,
          version_label TEXT NOT NULL,
          changelog TEXT,
          snapshot JSONB NOT NULL,
          publish_status TEXT NOT NULL DEFAULT 'DRAFT',
          created_by TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );

        CREATE TABLE IF NOT EXISTS saas_plan_versions (
          id SERIAL PRIMARY KEY,
          plan_id INTEGER NOT NULL,
          plan_code TEXT NOT NULL,
          version_number INTEGER NOT NULL,
          changelog TEXT,
          snapshot JSONB NOT NULL,
          created_by TEXT,
          created_at TIMESTAMP NOT NULL DEFAULT NOW()
        );
      `);

      // Seed default plans if plans table is empty
      const planCount = await client.query(`SELECT COUNT(*)::int AS cnt FROM plans`);
      if ((planCount.rows[0]?.cnt || 0) === 0) {
        await client.query(`
          INSERT INTO plans (code, name, description, monthly_price, annual_price, currency, max_users, max_projects, max_storage_gb, ai_credits_monthly, features, is_popular, status, publish_status, version, display_order)
          VALUES
          (
            'STARTER',
            'Starter Construction Portal',
            'Perfect for small construction contractors, craft teams, and specialized site builders.',
            50000, 500000, 'XAF', 3, 5, 5, 100,
            '["Basic Construction Company Website","Client Quote Intake System","Standard BOQ Studio (up to 5 active projects)","Basic Labor Cost Calculator","5 GB Cloud Storage","100 AI Estimation Credits/month","Standard Email & WhatsApp Support"]'::jsonb,
            false, 'ACTIVE', 'PUBLISHED', 1, 1
          ),
          (
            'PROFESSIONAL',
            'Professional Engineering Suite',
            'Designed for growing civil engineering firms, general contractors, and project consultancies.',
            100000, 1000000, 'XAF', 10, 25, 25, 500,
            '["Full Dynamic White-Label Website & CMS","Complete BOQ Studio with Revision Tree","AI CAD/Drawing Takeoff Studio (Auto-Quantities)","EN 1992 Eurocode 2 Structural Calculator","Document Studio (Contracts, IPCs, Receipts with QR)","Social Media Studio Multi-Platform Publisher","Enterprise Staff & Subcontractor RBAC","25 GB Cloud Storage","500 AI Quantity Takeoff Credits/month","Priority Phone & WhatsApp Support"]'::jsonb,
            true, 'ACTIVE', 'PUBLISHED', 1, 2
          ),
          (
            'ENTERPRISE',
            'Enterprise Cloud ERP',
            'Comprehensive platform for premier construction groups, developers, and multinational builders.',
            250000, 2500000, 'XAF', -1, -1, 100, 5000,
            '["Unlimited Users, Engineers & Project Managers","Unlimited Concurrent Construction Projects","Custom Domain Support (e.g., yourcompany.com)","Full White-Label Branding (Zero MADECC references)","Advanced AI Quantity Takeoff & Drawing Analysis","Full ERP Hub (Inventory, Change Orders, Site Daily Logs)","Dedicated Cloud Database & Storage Partition","Custom Eurocode & Local Parametric Libraries","100 GB High-Speed Storage","24/7 Dedicated Account Director & Engineering Support"]'::jsonb,
            false, 'ACTIVE', 'PUBLISHED', 1, 3
          )
          ON CONFLICT (code) DO NOTHING
        `);
      }

      // Seed starter tenants if tenants table is empty
      const tenantCount = await client.query(`SELECT COUNT(*)::int AS cnt FROM tenants`);
      if ((tenantCount.rows[0]?.cnt || 0) === 0) {
        await client.query(`
          INSERT INTO tenants (name, slug, legal_name, logo_url, primary_domain, custom_domain, status, publish_status, published_version, plan_code, currency, timezone, phone, email, address, country, settings, ai_credits_balance, storage_usage_bytes, is_flagship)
          VALUES
          (
            'MADECC GROUP',
            'madecc-construction',
            'MADECC Construction & Civil Engineering Group SARL',
            '/logo.png',
            'madecc-construction.madecccloud.com',
            'madeccgroup.online',
            'ACTIVE', 'PUBLISHED', 1, 'ENTERPRISE', 'XAF', 'Africa/Douala',
            '+237 671 063 511 / +237 683 316 486',
            'kreboya603@gmail.com',
            'Commercial Avenue, Bamenda & Douala, Cameroon',
            'Cameroon',
            '{"primaryColor":"#0f172a","secondaryColor":"#f59e0b","accentColor":"#2563eb","fontFamily":"Plus Jakarta Sans","tagline":"Premier Civil Engineering, Structural Design & Turnkey EPC Contractor","companyAddress":"Commercial Avenue, Bamenda & Boulevard de la Liberté, Douala","phone":"+237 671 063 511","email":"kreboya603@gmail.com","whatsappNumber":"+237671063511","currency":"XAF","taxNumber":"M051812728192K","registrationNumber":"RC/YAO/2018/B/1429"}'::jsonb,
            50000, 3435973836, true
          ),
          (
            'BuildPro Engineering Ltd',
            'buildpro-engineering',
            'BuildPro Civil & Structural Contractors Ltd',
            'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=400&q=80',
            'buildpro.madecccloud.com',
            'buildpro-contractors.com',
            'ACTIVE', 'PUBLISHED', 1, 'PROFESSIONAL', 'XAF', 'Africa/Douala',
            '+237 689 115 595',
            'info@buildpro-contractors.com',
            'Plot 42, Bonabéri Industrial Zone, Douala',
            'Cameroon',
            '{"primaryColor":"#1e3a8a","secondaryColor":"#10b981","accentColor":"#f97316","fontFamily":"Inter","tagline":"Heavy Industrial Steel Structures, Logistics Warehouses & Commercial Buildings","companyAddress":"Plot 42, Bonabéri Industrial Zone, Douala, Cameroon","phone":"+237 689 115 595","email":"info@buildpro-contractors.com","whatsappNumber":"+237689115595","currency":"XAF"}'::jsonb,
            450, 1288490188, false
          ),
          (
            'Alpha Civil & Infra Group',
            'alpha-civil',
            'Alpha Civil Infrastructure, Roads & Geotechnics SARL',
            'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=400&q=80',
            'alphacivil.madecccloud.com',
            'alphacivil.cm',
            'ACTIVE', 'PUBLISHED', 1, 'STARTER', 'XAF', 'Africa/Douala',
            '+237 640 194 505',
            'projects@alphacivil.cm',
            'Avenue Rosa Parks, Bastos, Yaoundé',
            'Cameroon',
            '{"primaryColor":"#18181b","secondaryColor":"#e11d48","accentColor":"#0284c7","fontFamily":"Plus Jakarta Sans","tagline":"Heavy Earthworks, Highway Paving, Box Culverts & Reinforced Bridge Construction","companyAddress":"Avenue Rosa Parks, Bastos, Yaoundé, Cameroon","phone":"+237 640 194 505","email":"projects@alphacivil.cm","whatsappNumber":"+237640194505","currency":"XAF"}'::jsonb,
            85, 536870912, false
          )
          ON CONFLICT (slug) DO NOTHING
        `);
      }

      // Ensure every existing tenant has at least v1 in saas_workspace_versions
      const versionCount = await client.query(`SELECT COUNT(*)::int AS cnt FROM saas_workspace_versions`);
      if ((versionCount.rows[0]?.cnt || 0) === 0) {
        const allTenants = await client.query(`SELECT * FROM tenants ORDER BY id ASC`);
        for (const t of allTenants.rows) {
          await client.query(
            `INSERT INTO saas_workspace_versions (tenant_id, version_number, version_label, changelog, snapshot, publish_status, created_by)
             VALUES ($1, 1, 'v1.0', 'Initial live workspace baseline snapshot', $2::jsonb, $3, 'system')`,
            [t.id, JSON.stringify(t), t.publish_status || 'PUBLISHED']
          );
        }
      }

      // Ensure saas_platform_settings has persistent saas_payment_config
      await client.query(`
        CREATE TABLE IF NOT EXISTS saas_platform_settings (
          id SERIAL PRIMARY KEY,
          key TEXT NOT NULL UNIQUE,
          value JSONB,
          category TEXT NOT NULL DEFAULT 'saas',
          description TEXT,
          updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
          updated_by TEXT
        )
      `);

      await client.query(
        `INSERT INTO saas_platform_settings (key, value, category, description, updated_by)
         VALUES ('saas_payment_config', $1::jsonb, 'saas', 'MADECC Cloud Direct Payment Receiving Accounts', 'system')
         ON CONFLICT (key) DO NOTHING`,
        [JSON.stringify(DEFAULT_SAAS_PAYMENT_CONFIG)]
      );

      // Seed initial platform audit log if empty
      const auditCount = await client.query(`SELECT COUNT(*)::int AS cnt FROM platform_audit_logs`);
      if ((auditCount.rows[0]?.cnt || 0) === 0) {
        await client.query(`
          INSERT INTO platform_audit_logs (tenant_id, user_id, user_email, action, resource_type, resource_id, metadata)
          VALUES
          (1, 'system', 'kreboya603@gmail.com', 'SAAS_PLATFORM_INITIALIZED', 'SAAS_WORKSPACE', '1', '{"note":"Flagship MADECC GROUP tenant & SaaS workspace versioning initialized in Neon PostgreSQL"}'::jsonb)
        `);
      }

      saasTablesReady = true;
    } catch (err) {
      console.error('[ENSURE_SAAS_TABLES_ERROR]', err);
      ensurePromise = null;
    } finally {
      client.release();
    }
  })();

  return ensurePromise;
}
