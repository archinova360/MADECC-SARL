import { db } from './index.ts';
import { 
  categories, 
  services, 
  projects, 
  projectProgress, 
  heroBanners, 
  blogPosts, 
  reviews, 
  galleryItems, 
  users, 
  signedContracts, 
  teamMembers,
  siteSettings,
  pageContents,
  mediaLibrary,
  cmsContentRevisions
} from './schema.ts';
import { eq, sql } from 'drizzle-orm';

export async function seedDatabase() {
  try {
    console.log('--- Starting Database Seeding Check ---');

    // Check if database connection is healthy first
    try {
      await db.execute(sql`SELECT 1`);
    } catch (connErr: any) {
      console.error('========================================================================');
      console.error('DATABASE CONNECTIVITY ERROR: Unable to connect to the database.');
      console.error('Please verify your DATABASE_URL environment variable is correct and');
      console.error('the database server is running.');
      console.error('Error Details:', connErr.message || connErr);
      console.error('========================================================================');
      return; // Exit gracefully instead of crashing
    }

    // Ensure BOQ tables exist in Neon DB
    try {
      console.log('Verifying BOQ tables infrastructure in Neon DB...');
      await db.execute(sql`
        CREATE TABLE IF NOT EXISTS boqs (
          id SERIAL PRIMARY KEY,
          boq_reference TEXT NOT NULL UNIQUE,
          project_id INTEGER REFERENCES projects(id) ON DELETE SET NULL,
          project_name TEXT NOT NULL,
          client_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          client_name TEXT NOT NULL,
          client_email TEXT,
          client_niu TEXT,
          client_address TEXT,
          location TEXT NOT NULL,
          description TEXT,
          date_prepared TIMESTAMP DEFAULT NOW() NOT NULL,
          prepared_by TEXT NOT NULL,
          revision_number TEXT DEFAULT 'REV-00' NOT NULL,
          currency TEXT DEFAULT 'XAF' NOT NULL,
          status TEXT DEFAULT 'DRAFT' NOT NULL,
          overhead_percent NUMERIC DEFAULT '0' NOT NULL,
          contingency_percent NUMERIC DEFAULT '0' NOT NULL,
          profit_percent NUMERIC DEFAULT '0' NOT NULL,
          tax_percent NUMERIC DEFAULT '0' NOT NULL,
          subtotal NUMERIC DEFAULT '0' NOT NULL,
          overhead_amount NUMERIC DEFAULT '0' NOT NULL,
          contingency_amount NUMERIC DEFAULT '0' NOT NULL,
          profit_amount NUMERIC DEFAULT '0' NOT NULL,
          tax_amount NUMERIC DEFAULT '0' NOT NULL,
          grand_total NUMERIC DEFAULT '0' NOT NULL,
          pdf_url TEXT,
          approved_by TEXT,
          approved_at TIMESTAMP,
          sent_to_client_at TIMESTAMP,
          sent_to_client_by TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS boq_sections (
          id SERIAL PRIMARY KEY,
          boq_id INTEGER REFERENCES boqs(id) ON DELETE CASCADE NOT NULL,
          section_code TEXT NOT NULL,
          title TEXT NOT NULL,
          display_order INTEGER DEFAULT 0 NOT NULL,
          subtotal NUMERIC DEFAULT '0' NOT NULL
        );

        CREATE TABLE IF NOT EXISTS boq_items (
          id SERIAL PRIMARY KEY,
          section_id INTEGER REFERENCES boq_sections(id) ON DELETE CASCADE NOT NULL,
          boq_id INTEGER REFERENCES boqs(id) ON DELETE CASCADE NOT NULL,
          item_number TEXT NOT NULL,
          description TEXT NOT NULL,
          unit TEXT NOT NULL,
          quantity NUMERIC DEFAULT '0' NOT NULL,
          unit_rate NUMERIC DEFAULT '0' NOT NULL,
          amount NUMERIC DEFAULT '0' NOT NULL,
          notes TEXT,
          measurement_basis TEXT,
          internal_material_cost NUMERIC DEFAULT '0' NOT NULL,
          internal_labour_cost NUMERIC DEFAULT '0' NOT NULL,
          internal_plant_cost NUMERIC DEFAULT '0' NOT NULL,
          internal_other_cost NUMERIC DEFAULT '0' NOT NULL,
          display_order INTEGER DEFAULT 0 NOT NULL
        );

        CREATE TABLE IF NOT EXISTS boq_revisions (
          id SERIAL PRIMARY KEY,
          boq_id INTEGER REFERENCES boqs(id) ON DELETE CASCADE NOT NULL,
          revision_number TEXT NOT NULL,
          snapshot_data TEXT NOT NULL,
          approved_by TEXT,
          approved_at TIMESTAMP DEFAULT NOW() NOT NULL,
          pdf_url TEXT,
          notes TEXT
        );

        CREATE TABLE IF NOT EXISTS boq_audit_logs (
          id SERIAL PRIMARY KEY,
          boq_id INTEGER REFERENCES boqs(id) ON DELETE CASCADE NOT NULL,
          user_id TEXT,
          user_email TEXT,
          action TEXT NOT NULL,
          details TEXT NOT NULL,
          timestamp TIMESTAMP DEFAULT NOW() NOT NULL
        );

        ALTER TABLE signed_receipts ADD COLUMN IF NOT EXISTS invoice_total_amount TEXT;
        ALTER TABLE signed_receipts ADD COLUMN IF NOT EXISTS remaining_balance TEXT;

        CREATE TABLE IF NOT EXISTS structural_projects (
          id SERIAL PRIMARY KEY,
          project_code TEXT NOT NULL,
          project_name TEXT NOT NULL,
          client_name TEXT NOT NULL,
          client_email TEXT,
          location TEXT NOT NULL,
          prepared_by TEXT NOT NULL,
          status TEXT DEFAULT 'DRAFT' NOT NULL,
          design_inputs JSON,
          drawings JSON,
          detected_elements JSON,
          calculations_result JSON,
          revision_number TEXT DEFAULT 'REV-01' NOT NULL,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS labour_calculations (
          id SERIAL PRIMARY KEY,
          quotation_ref TEXT NOT NULL,
          project_name TEXT NOT NULL,
          client_name TEXT NOT NULL,
          client_email TEXT,
          location TEXT NOT NULL,
          project_type TEXT NOT NULL,
          building_floors INTEGER DEFAULT 1 NOT NULL,
          date TEXT NOT NULL,
          prepared_by TEXT NOT NULL,
          approved_by TEXT,
          status TEXT DEFAULT 'DRAFT' NOT NULL,
          currency TEXT DEFAULT 'XAF' NOT NULL,
          overhead_percent NUMERIC DEFAULT '10.00',
          contingency_percent NUMERIC DEFAULT '5.00',
          profit_percent NUMERIC DEFAULT '15.00',
          discount_percent NUMERIC DEFAULT '0.00',
          tax_percent NUMERIC DEFAULT '19.25',
          base_subtotal NUMERIC DEFAULT '0.00',
          overhead_amount NUMERIC DEFAULT '0.00',
          contingency_amount NUMERIC DEFAULT '0.00',
          profit_amount NUMERIC DEFAULT '0.00',
          discount_amount NUMERIC DEFAULT '0.00',
          taxable_net NUMERIC DEFAULT '0.00',
          tax_amount NUMERIC DEFAULT '0.00',
          grand_total NUMERIC DEFAULT '0.00',
          paid_amount NUMERIC DEFAULT '0.00',
          balance_due NUMERIC DEFAULT '0.00',
          revision_number TEXT DEFAULT 'REV-01' NOT NULL,
          sections_data JSON NOT NULL,
          revisions_history JSON,
          audit_logs_data JSON,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS drawing_takeoffs (
          id SERIAL PRIMARY KEY,
          takeoff_ref TEXT NOT NULL,
          project_name TEXT NOT NULL,
          client_name TEXT NOT NULL,
          client_email TEXT,
          location TEXT NOT NULL,
          drawing_name TEXT NOT NULL,
          file_type TEXT NOT NULL,
          file_size INTEGER DEFAULT 0,
          file_url TEXT,
          mime_type TEXT,
          metadata JSON,
          analysis_stage TEXT DEFAULT 'Validation' NOT NULL,
          pipeline_log JSON,
          detected_elements JSON NOT NULL,
          quantities_data JSON NOT NULL,
          labour_estimate_data JSON,
          status TEXT DEFAULT 'DRAFT' NOT NULL,
          ai_verified BOOLEAN DEFAULT FALSE NOT NULL,
          prepared_by TEXT NOT NULL,
          approved_by TEXT,
          approval_notes TEXT,
          revision_number TEXT DEFAULT 'REV-01' NOT NULL,
          revisions_history JSON,
          audit_logs_data JSON,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS faq_categories (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          description TEXT,
          icon TEXT,
          display_order INTEGER DEFAULT 1 NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS faqs (
          id SERIAL PRIMARY KEY,
          question TEXT NOT NULL,
          answer TEXT NOT NULL,
          category_id INTEGER REFERENCES faq_categories(id) ON DELETE SET NULL,
          category_name TEXT DEFAULT 'General' NOT NULL,
          tags JSON,
          featured BOOLEAN DEFAULT FALSE NOT NULL,
          display_order INTEGER DEFAULT 1 NOT NULL,
          helpful_count INTEGER DEFAULT 0 NOT NULL,
          unhelpful_count INTEGER DEFAULT 0 NOT NULL,
          status TEXT DEFAULT 'PUBLISHED' NOT NULL,
          author TEXT DEFAULT 'MADECC Editorial Team',
          reviewer TEXT,
          published_at TIMESTAMP DEFAULT NOW(),
          seo_title TEXT,
          seo_description TEXT,
          related_service TEXT,
          related_page TEXT,
          created_by TEXT,
          updated_by TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sustainability_content (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          hero_subtitle TEXT,
          introduction TEXT NOT NULL,
          environmental_policy TEXT,
          safety_policy TEXT,
          local_economic_commitment TEXT,
          documents JSON,
          updated_by TEXT,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS sustainability_initiatives (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          category TEXT DEFAULT 'Sustainable Construction' NOT NULL,
          description TEXT NOT NULL,
          impact_summary TEXT,
          image TEXT,
          documents JSON,
          display_order INTEGER DEFAULT 1 NOT NULL,
          status TEXT DEFAULT 'PUBLISHED' NOT NULL,
          featured BOOLEAN DEFAULT FALSE NOT NULL,
          created_by TEXT,
          updated_by TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS social_impact_projects (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          category TEXT DEFAULT 'Community Participation' NOT NULL,
          location TEXT NOT NULL,
          date_completed TEXT,
          description TEXT NOT NULL,
          impact_metrics_text TEXT,
          image TEXT,
          gallery JSON,
          documents JSON,
          display_order INTEGER DEFAULT 1 NOT NULL,
          status TEXT DEFAULT 'PUBLISHED' NOT NULL,
          featured BOOLEAN DEFAULT FALSE NOT NULL,
          created_by TEXT,
          updated_by TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS impact_metrics (
          id SERIAL PRIMARY KEY,
          label TEXT NOT NULL,
          value TEXT NOT NULL,
          category TEXT DEFAULT 'Social Impact' NOT NULL,
          icon TEXT DEFAULT 'Users',
          display_order INTEGER DEFAULT 1 NOT NULL,
          status TEXT DEFAULT 'PUBLISHED' NOT NULL,
          updated_by TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        ALTER TABLE impact_metrics ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();

        CREATE TABLE IF NOT EXISTS supplier_subcontractor_categories (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          type TEXT DEFAULT 'supplier' NOT NULL,
          description TEXT,
          display_order INTEGER DEFAULT 1 NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS supplier_applications (
          id SERIAL PRIMARY KEY,
          application_number TEXT NOT NULL UNIQUE,
          company_name TEXT NOT NULL,
          registration_number TEXT NOT NULL,
          company_type TEXT DEFAULT 'SARL' NOT NULL,
          country TEXT DEFAULT 'Cameroon' NOT NULL,
          region TEXT NOT NULL,
          division TEXT,
          city TEXT NOT NULL,
          address TEXT NOT NULL,
          website TEXT,
          contact_person TEXT NOT NULL,
          position TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT NOT NULL,
          whatsapp TEXT,
          supplier_category TEXT NOT NULL,
          products TEXT NOT NULL,
          years_in_business INTEGER DEFAULT 1,
          service_regions JSON,
          capacity TEXT,
          previous_projects TEXT,
          major_clients TEXT,
          compliance_documents JSON,
          declaration_accepted BOOLEAN DEFAULT TRUE NOT NULL,
          status TEXT DEFAULT 'SUBMITTED' NOT NULL,
          reviewer_notes TEXT,
          assigned_reviewer TEXT,
          assigned_reviewer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS subcontractor_applications (
          id SERIAL PRIMARY KEY,
          application_number TEXT NOT NULL UNIQUE,
          company_name TEXT NOT NULL,
          trade TEXT NOT NULL,
          years_in_business INTEGER DEFAULT 1,
          workforce_size INTEGER DEFAULT 5,
          equipment_owned TEXT,
          previous_projects TEXT,
          geographic_coverage TEXT,
          safety_record TEXT,
          certifications TEXT,
          references_list TEXT,
          country TEXT DEFAULT 'Cameroon' NOT NULL,
          region TEXT NOT NULL,
          city TEXT NOT NULL,
          address TEXT NOT NULL,
          contact_person TEXT NOT NULL,
          position TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT NOT NULL,
          whatsapp TEXT,
          compliance_documents JSON,
          declaration_accepted BOOLEAN DEFAULT TRUE NOT NULL,
          status TEXT DEFAULT 'SUBMITTED' NOT NULL,
          reviewer_notes TEXT,
          assigned_reviewer TEXT,
          assigned_reviewer_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS tender_categories (
          id SERIAL PRIMARY KEY,
          name TEXT NOT NULL UNIQUE,
          description TEXT,
          display_order INTEGER DEFAULT 1 NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS tenders (
          id SERIAL PRIMARY KEY,
          tender_number TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          category_id INTEGER REFERENCES tender_categories(id) ON DELETE SET NULL,
          category_name TEXT DEFAULT 'Construction' NOT NULL,
          client_project TEXT NOT NULL,
          location TEXT NOT NULL,
          description TEXT NOT NULL,
          scope_of_work TEXT NOT NULL,
          eligibility TEXT NOT NULL,
          required_experience TEXT,
          required_documents TEXT,
          submission_method TEXT DEFAULT 'Online Submission & Hard Copy at MADECC Douala Head Office' NOT NULL,
          opening_date TIMESTAMP DEFAULT NOW() NOT NULL,
          closing_date TIMESTAMP NOT NULL,
          status TEXT DEFAULT 'OPEN' NOT NULL,
          contact_instructions TEXT DEFAULT 'For tender clarifications, contact procurement@madeccgroup.com' NOT NULL,
          attachments JSON,
          featured BOOLEAN DEFAULT FALSE NOT NULL,
          display_order INTEGER DEFAULT 1 NOT NULL,
          seo_title TEXT,
          seo_description TEXT,
          created_by TEXT,
          published_at TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS tender_submissions (
          id SERIAL PRIMARY KEY,
          submission_number TEXT NOT NULL UNIQUE,
          tender_id INTEGER REFERENCES tenders(id) ON DELETE CASCADE NOT NULL,
          tender_reference TEXT NOT NULL,
          company_name TEXT NOT NULL,
          contact_person TEXT NOT NULL,
          email TEXT NOT NULL,
          phone TEXT NOT NULL,
          expression_of_interest TEXT NOT NULL,
          supporting_documents JSON,
          status TEXT DEFAULT 'SUBMITTED' NOT NULL,
          internal_evaluation_notes TEXT,
          evaluated_by TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS cms_activity_logs (
          id SERIAL PRIMARY KEY,
          module TEXT NOT NULL,
          action TEXT NOT NULL,
          record_id TEXT NOT NULL,
          record_title TEXT NOT NULL,
          performed_by TEXT NOT NULL,
          details TEXT NOT NULL,
          timestamp TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS cms_content_revisions (
          id SERIAL PRIMARY KEY,
          module TEXT NOT NULL,
          record_id INTEGER NOT NULL,
          version_number INTEGER DEFAULT 1 NOT NULL,
          snapshot JSON NOT NULL,
          created_by TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS construction_projects (
          id SERIAL PRIMARY KEY,
          project_id TEXT NOT NULL UNIQUE,
          project_name TEXT NOT NULL,
          client TEXT NOT NULL,
          contractor TEXT,
          consultant TEXT,
          location TEXT NOT NULL,
          gps_coordinates TEXT,
          building_type TEXT DEFAULT 'Residential' NOT NULL,
          number_of_floors INTEGER DEFAULT 1,
          currency TEXT DEFAULT 'XAF' NOT NULL,
          contract_sum NUMERIC DEFAULT '0',
          start_date TEXT,
          completion_date TEXT,
          project_status TEXT DEFAULT 'Planning' NOT NULL,
          created_by TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS construction_drawings (
          id SERIAL PRIMARY KEY,
          project_id TEXT NOT NULL,
          title TEXT NOT NULL,
          file_name TEXT NOT NULL,
          file_url TEXT NOT NULL,
          file_type TEXT NOT NULL,
          file_size_mb NUMERIC,
          category TEXT DEFAULT 'Architectural' NOT NULL,
          version TEXT DEFAULT 'v1.0' NOT NULL,
          uploaded_by TEXT,
          uploaded_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS drawing_analysis (
          id SERIAL PRIMARY KEY,
          drawing_id INTEGER,
          project_id TEXT NOT NULL,
          detected_elements JSON NOT NULL,
          confidence_score NUMERIC DEFAULT '95.0',
          engineer_status TEXT DEFAULT 'Pending Review',
          reviewed_by TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS quantities_takeoff (
          id SERIAL PRIMARY KEY,
          project_id TEXT NOT NULL,
          item TEXT NOT NULL,
          category TEXT NOT NULL,
          description TEXT NOT NULL,
          source TEXT,
          formula TEXT,
          quantity NUMERIC DEFAULT '0' NOT NULL,
          unit TEXT NOT NULL,
          confidence_level NUMERIC DEFAULT '95.0',
          approved BOOLEAN DEFAULT FALSE,
          approved_by TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS construction_programmes (
          id SERIAL PRIMARY KEY,
          project_id TEXT NOT NULL,
          programme_name TEXT NOT NULL,
          activities_data JSON NOT NULL,
          completion_percentage NUMERIC DEFAULT '0',
          status TEXT DEFAULT 'Draft',
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS procurement_orders (
          id SERIAL PRIMARY KEY,
          project_id TEXT NOT NULL,
          material_name TEXT NOT NULL,
          quantity NUMERIC DEFAULT '0' NOT NULL,
          unit TEXT NOT NULL,
          required_date TEXT,
          supplier TEXT,
          purchase_status TEXT DEFAULT 'Draft',
          cost NUMERIC DEFAULT '0',
          delivery_status TEXT DEFAULT 'Pending',
          stock_balance NUMERIC DEFAULT '0',
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS reinforcement_schedules (
          id SERIAL PRIMARY KEY,
          project_id TEXT NOT NULL,
          member TEXT NOT NULL,
          bar_mark TEXT NOT NULL,
          shape_code TEXT NOT NULL,
          diameter_mm INTEGER NOT NULL,
          cut_length_m NUMERIC NOT NULL,
          total_bars INTEGER NOT NULL,
          total_weight_kg NUMERIC NOT NULL,
          cutting_list JSON,
          approved BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS cashflow_forecasts (
          id SERIAL PRIMARY KEY,
          project_id TEXT NOT NULL,
          period_name TEXT NOT NULL,
          forecast_data JSON NOT NULL,
          s_curve_data JSON,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS structural_calculations (
          id SERIAL PRIMARY KEY,
          project_id TEXT NOT NULL,
          element_name TEXT NOT NULL,
          design_code TEXT DEFAULT 'EN 1992 Eurocode 2' NOT NULL,
          inputs_data JSON NOT NULL,
          steps_data JSON NOT NULL,
          results_data JSON NOT NULL,
          approved_by_engineer BOOLEAN DEFAULT FALSE,
          engineer_name TEXT,
          disclaimer_notice TEXT DEFAULT 'AI-generated engineering outputs are design assistance drafts. Final responsibility, verification and approval remain with qualified engineers.',
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS module_versions (
          id SERIAL PRIMARY KEY,
          project_id TEXT NOT NULL,
          module_name TEXT NOT NULL,
          version_number TEXT NOT NULL,
          user_email TEXT NOT NULL,
          change_description TEXT NOT NULL,
          snapshot_data JSON NOT NULL,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS staff_access_keys (
          id SERIAL PRIMARY KEY,
          employee_number TEXT NOT NULL UNIQUE,
          login_key TEXT NOT NULL UNIQUE,
          temp_password TEXT NOT NULL,
          email TEXT NOT NULL,
          username TEXT NOT NULL,
          full_name TEXT NOT NULL,
          department TEXT DEFAULT 'Engineering' NOT NULL,
          position TEXT DEFAULT 'Project Engineer' NOT NULL,
          assigned_projects JSON,
          assigned_permissions JSON,
          status TEXT DEFAULT 'PENDING' NOT NULL,
          created_by TEXT DEFAULT 'Adminmadeccgroup' NOT NULL,
          activated_at TIMESTAMP,
          expires_at TIMESTAMP,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS employee_profiles (
          id SERIAL PRIMARY KEY,
          employee_number TEXT NOT NULL UNIQUE,
          email TEXT NOT NULL UNIQUE,
          full_name TEXT NOT NULL,
          gender TEXT DEFAULT 'Male',
          dob TEXT,
          nationality TEXT DEFAULT 'Cameroonian',
          national_id TEXT,
          passport_number TEXT,
          tax_number TEXT,
          social_security_number TEXT,
          phone TEXT,
          address TEXT,
          emergency_contact TEXT,
          department TEXT NOT NULL,
          position TEXT NOT NULL,
          reporting_manager TEXT DEFAULT 'Adminmadeccgroup',
          employment_date TEXT,
          employment_type TEXT DEFAULT 'FULL_TIME',
          salary_xaf NUMERIC DEFAULT '0',
          allowances_xaf NUMERIC DEFAULT '0',
          bank_details TEXT,
          skills JSON,
          certifications JSON,
          engineering_registration TEXT,
          leave_balance_days INTEGER DEFAULT 24,
          status TEXT DEFAULT 'ACTIVE',
          digital_signature_url TEXT,
          passport_photo_url TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS staff_audit_logs (
          id SERIAL PRIMARY KEY,
          admin_user TEXT NOT NULL,
          target_employee TEXT,
          action TEXT NOT NULL,
          details TEXT NOT NULL,
          ip_address TEXT DEFAULT '127.0.0.1',
          device_info TEXT DEFAULT 'Enterprise Web Client',
          module TEXT DEFAULT 'STAFF_MANAGEMENT',
          previous_value TEXT,
          new_value TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS staff_announcements (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          content TEXT NOT NULL,
          department TEXT DEFAULT 'ALL',
          author TEXT DEFAULT 'Adminmadeccgroup',
          priority TEXT DEFAULT 'NORMAL',
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS staff_roles (
          id SERIAL PRIMARY KEY,
          role_name TEXT NOT NULL UNIQUE,
          description TEXT,
          department TEXT DEFAULT 'Engineering',
          permissions JSON,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS staff_notifications (
          id SERIAL PRIMARY KEY,
          employee_number TEXT NOT NULL,
          title TEXT NOT NULL,
          message TEXT NOT NULL,
          category TEXT DEFAULT 'SYSTEM',
          is_read INTEGER DEFAULT 0,
          action_url TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS staff_login_history (
          id SERIAL PRIMARY KEY,
          employee_number TEXT NOT NULL,
          login_key_used TEXT,
          ip_address TEXT DEFAULT '127.0.0.1',
          device_info TEXT DEFAULT 'Enterprise Web Client',
          status TEXT NOT NULL,
          failure_reason TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS staff_performance_reviews (
          id SERIAL PRIMARY KEY,
          employee_number TEXT NOT NULL,
          reviewer_name TEXT DEFAULT 'Adminmadeccgroup',
          review_period TEXT NOT NULL,
          kpi_score NUMERIC DEFAULT '85.0',
          quality_rating NUMERIC DEFAULT '90.0',
          safety_rating NUMERIC DEFAULT '95.0',
          completed_tasks_count INTEGER DEFAULT 12,
          comments TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS staff_training_records (
          id SERIAL PRIMARY KEY,
          employee_number TEXT NOT NULL,
          course_title TEXT NOT NULL,
          institution TEXT DEFAULT 'ONIGC / Eurocode Academy',
          completion_date TEXT,
          expiry_date TEXT,
          certificate_url TEXT,
          status TEXT DEFAULT 'COMPLETED',
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS cost_library_items (
          id SERIAL PRIMARY KEY,
          item_code TEXT NOT NULL,
          category TEXT NOT NULL,
          name TEXT NOT NULL,
          unit TEXT NOT NULL,
          base_price_xaf NUMERIC DEFAULT '0' NOT NULL,
          douala_price NUMERIC DEFAULT '0',
          yaounde_price NUMERIC DEFAULT '0',
          garoua_price NUMERIC DEFAULT '0',
          supplier_name TEXT,
          brand TEXT,
          specifications TEXT,
          last_updated TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_by TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS project_budget_estimates (
          id SERIAL PRIMARY KEY,
          estimate_reference TEXT NOT NULL UNIQUE,
          client_name TEXT,
          client_email TEXT,
          client_phone TEXT,
          preferred_contact_method TEXT DEFAULT 'WhatsApp',
          project_timeline TEXT,
          project_type TEXT NOT NULL,
          custom_project_type TEXT,
          location TEXT NOT NULL,
          region TEXT,
          total_floor_area_m2 NUMERIC NOT NULL,
          number_of_floors INTEGER DEFAULT 1,
          construction_standard TEXT DEFAULT 'Standard' NOT NULL,
          building_configuration JSON,
          selected_scopes JSON,
          selected_finishes JSON,
          mode TEXT DEFAULT 'quick',
          estimated_budget_min NUMERIC NOT NULL,
          estimated_budget_max NUMERIC NOT NULL,
          estimated_budget_expected NUMERIC NOT NULL,
          cost_per_m2 NUMERIC,
          rate_version TEXT DEFAULT 'MADECC-RATES-2026-08' NOT NULL,
          rate_snapshot JSON,
          line_items_breakdown JSON,
          status TEXT DEFAULT 'CALCULATED' NOT NULL,
          lead_status TEXT DEFAULT 'NEW',
          converted_project_id INTEGER,
          converted_boq_id INTEGER,
          notes TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS quote_requests (
          id SERIAL PRIMARY KEY,
          reference_number TEXT NOT NULL UNIQUE,
          user_id INTEGER,
          client_name TEXT NOT NULL,
          client_company TEXT,
          client_email TEXT NOT NULL,
          client_phone TEXT NOT NULL,
          whatsapp_number TEXT,
          preferred_contact_method TEXT DEFAULT 'WhatsApp',
          preferred_contact_time TEXT DEFAULT 'Any time',
          project_type TEXT NOT NULL,
          services_requested JSONB NOT NULL,
          region TEXT NOT NULL,
          division TEXT,
          subdivision TEXT,
          city TEXT,
          neighborhood TEXT,
          site_address TEXT,
          latitude NUMERIC,
          longitude NUMERIC,
          project_name TEXT NOT NULL,
          project_description TEXT,
          building_type TEXT,
          storeys INTEGER DEFAULT 1,
          floor_area NUMERIC,
          floor_area_unit TEXT DEFAULT 'm²',
          site_status TEXT,
          project_stage TEXT,
          budget_currency TEXT DEFAULT 'XAF',
          budget_min NUMERIC,
          budget_max NUMERIC,
          budget_range_text TEXT,
          desired_start_date TIMESTAMP,
          expected_completion_date TIMESTAMP,
          urgency TEXT DEFAULT 'Standard',
          additional_notes TEXT,
          source TEXT DEFAULT 'Website Direct',
          source_metadata JSONB,
          status TEXT DEFAULT 'NEW' NOT NULL,
          priority TEXT DEFAULT 'NORMAL' NOT NULL,
          assigned_to INTEGER,
          internal_notes TEXT,
          activity_timeline JSONB,
          converted_project_id INTEGER,
          converted_boq_id INTEGER,
          converted_estimate_id INTEGER,
          admin_notification_status TEXT DEFAULT 'PENDING',
          client_confirmation_status TEXT DEFAULT 'PENDING',
          admin_notification_sent_at TIMESTAMP,
          client_confirmation_sent_at TIMESTAMP,
          email_error TEXT,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS quote_request_documents (
          id SERIAL PRIMARY KEY,
          quote_request_id INTEGER REFERENCES quote_requests(id) ON DELETE CASCADE NOT NULL,
          file_name TEXT NOT NULL,
          file_url TEXT NOT NULL,
          file_type TEXT,
          file_size INTEGER,
          uploaded_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS social_media_channels (
          id SERIAL PRIMARY KEY,
          platform TEXT NOT NULL,
          channel_name TEXT NOT NULL,
          account_handle TEXT,
          account_id TEXT,
          profile_image_url TEXT,
          status TEXT DEFAULT 'CONNECTED' NOT NULL,
          health_status TEXT DEFAULT 'HEALTHY',
          approval_status TEXT DEFAULT 'APPROVED',
          api_key_or_token TEXT,
          access_token_encrypted TEXT,
          refresh_token_encrypted TEXT,
          token_expires_at TIMESTAMP,
          scopes JSONB,
          webhook_url TEXT,
          is_custom BOOLEAN DEFAULT FALSE,
          connected_by TEXT,
          connected_at TIMESTAMP,
          last_successful_api_check TIMESTAMP,
          last_error_code TEXT,
          last_error_message TEXT,
          metadata JSONB,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS social_media_posts (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          seo_topic TEXT,
          target_platforms JSONB,
          caption TEXT NOT NULL,
          hashtags TEXT,
          cta_text TEXT,
          media_url TEXT,
          media_type TEXT DEFAULT 'image',
          status TEXT DEFAULT 'DRAFT' NOT NULL,
          scheduled_at TIMESTAMP,
          published_at TIMESTAMP,
          reach_estimate INTEGER DEFAULT 0,
          engagement_count INTEGER DEFAULT 0,
          created_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        ALTER TABLE social_media_channels ADD COLUMN IF NOT EXISTS account_id TEXT;
        ALTER TABLE social_media_channels ADD COLUMN IF NOT EXISTS profile_image_url TEXT;
        ALTER TABLE social_media_channels ADD COLUMN IF NOT EXISTS health_status TEXT DEFAULT 'HEALTHY';
        ALTER TABLE social_media_channels ADD COLUMN IF NOT EXISTS approval_status TEXT DEFAULT 'APPROVED';
        ALTER TABLE social_media_channels ADD COLUMN IF NOT EXISTS access_token_encrypted TEXT;
        ALTER TABLE social_media_channels ADD COLUMN IF NOT EXISTS refresh_token_encrypted TEXT;
        ALTER TABLE social_media_channels ADD COLUMN IF NOT EXISTS token_expires_at TIMESTAMP;
        ALTER TABLE social_media_channels ADD COLUMN IF NOT EXISTS scopes JSONB;
        ALTER TABLE social_media_channels ADD COLUMN IF NOT EXISTS connected_by TEXT;
        ALTER TABLE social_media_channels ADD COLUMN IF NOT EXISTS connected_at TIMESTAMP;
        ALTER TABLE social_media_channels ADD COLUMN IF NOT EXISTS last_successful_api_check TIMESTAMP;
        ALTER TABLE social_media_channels ADD COLUMN IF NOT EXISTS last_error_code TEXT;
        ALTER TABLE social_media_channels ADD COLUMN IF NOT EXISTS last_error_message TEXT;
        ALTER TABLE social_media_channels ADD COLUMN IF NOT EXISTS metadata JSONB;
        ALTER TABLE social_media_channels ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

        -- Ensure missing columns are added if quote_requests pre-existed
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS reference_number TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS user_id INTEGER;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS client_name TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS client_company TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS client_email TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS client_phone TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS whatsapp_number TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS preferred_contact_method TEXT DEFAULT 'WhatsApp';
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS preferred_contact_time TEXT DEFAULT 'Any time';
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS project_type TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS services_requested JSONB;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS region TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS division TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS subdivision TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS city TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS neighborhood TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS site_address TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS latitude NUMERIC;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS longitude NUMERIC;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS project_name TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS project_description TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS building_type TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS storeys INTEGER DEFAULT 1;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS floor_area NUMERIC;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS floor_area_unit TEXT DEFAULT 'm²';
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS site_status TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS project_stage TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS budget_currency TEXT DEFAULT 'XAF';
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS budget_min NUMERIC;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS budget_max NUMERIC;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS budget_range_text TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS desired_start_date TIMESTAMP;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS expected_completion_date TIMESTAMP;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS urgency TEXT DEFAULT 'Standard';
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS additional_notes TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'Website Direct';
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS source_metadata JSONB;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'NEW';
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT 'NORMAL';
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS assigned_to INTEGER;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS internal_notes TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS activity_timeline JSONB;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS converted_project_id INTEGER;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS converted_boq_id INTEGER;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS converted_estimate_id INTEGER;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS admin_notification_status TEXT DEFAULT 'PENDING';
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS client_confirmation_status TEXT DEFAULT 'PENDING';
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS admin_notification_sent_at TIMESTAMP;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS client_confirmation_sent_at TIMESTAMP;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS email_error TEXT;
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT NOW();
        ALTER TABLE quote_requests ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();

        ALTER TABLE quote_request_documents ADD COLUMN IF NOT EXISTS quote_request_id INTEGER;
        ALTER TABLE quote_request_documents ADD COLUMN IF NOT EXISTS file_name TEXT;
        ALTER TABLE quote_request_documents ADD COLUMN IF NOT EXISTS file_url TEXT;
        ALTER TABLE quote_request_documents ADD COLUMN IF NOT EXISTS file_type TEXT;
        ALTER TABLE quote_request_documents ADD COLUMN IF NOT EXISTS file_size INTEGER;
        ALTER TABLE quote_request_documents ADD COLUMN IF NOT EXISTS uploaded_at TIMESTAMP DEFAULT NOW();

        CREATE TABLE IF NOT EXISTS site_settings (
          id SERIAL PRIMARY KEY,
          site_name TEXT NOT NULL DEFAULT 'MADECC Group',
          tagline TEXT DEFAULT 'Premier Engineering, Construction & Project Management in Cameroon',
          phone TEXT DEFAULT '+237 670 00 00 00',
          emergency_phone TEXT DEFAULT '+237 690 00 00 00',
          email TEXT DEFAULT 'contact@madeccgroup.com',
          office_address_yaounde TEXT DEFAULT 'Mbankolo, Yaoundé, Centre Region, Cameroon',
          office_address_douala TEXT DEFAULT 'Akwa, Douala, Littoral Region, Cameroon',
          business_hours TEXT DEFAULT 'Mon - Fri: 08:00 - 18:00 | Sat: 08:30 - 14:00 (GMT+1)',
          whatsapp_number TEXT DEFAULT '+237670000000',
          facebook_url TEXT DEFAULT 'https://facebook.com/madeccgroup',
          linkedin_url TEXT DEFAULT 'https://linkedin.com/company/madecc-group',
          instagram_url TEXT DEFAULT 'https://instagram.com/madeccgroup',
          youtube_url TEXT DEFAULT 'https://youtube.com/@madeccgroup',
          twitter_url TEXT DEFAULT 'https://x.com/madeccgroup',
          logo_url TEXT,
          favicon_url TEXT,
          global_seo JSON,
          navigation_links JSON,
          footer_content JSON,
          emergency_banner JSON,
          updated_by TEXT DEFAULT 'MADECC Executive Admin',
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS page_contents (
          id SERIAL PRIMARY KEY,
          slug TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          status TEXT NOT NULL DEFAULT 'PUBLISHED',
          hero_config JSON,
          sections JSON,
          seo JSON,
          draft_data JSON,
          published_data JSON,
          version INTEGER DEFAULT 1 NOT NULL,
          last_saved_by TEXT DEFAULT 'MADECC Executive Admin',
          published_at TIMESTAMP DEFAULT NOW(),
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

        CREATE TABLE IF NOT EXISTS media_library (
          id SERIAL PRIMARY KEY,
          title TEXT NOT NULL,
          filename TEXT NOT NULL,
          file_url TEXT NOT NULL,
          file_type TEXT NOT NULL DEFAULT 'image',
          mime_type TEXT,
          file_size INTEGER DEFAULT 0,
          dimensions TEXT,
          alt_text TEXT,
          caption TEXT,
          category TEXT DEFAULT 'General' NOT NULL,
          tags JSON,
          used_in JSON,
          status TEXT DEFAULT 'ACTIVE' NOT NULL,
          uploaded_by TEXT DEFAULT 'MADECC Media Admin',
          created_at TIMESTAMP DEFAULT NOW() NOT NULL,
          updated_at TIMESTAMP DEFAULT NOW() NOT NULL
        );

      `);
      console.log('✅ BOQ, Receipts, Rates & Budget Estimator infrastructure ready in Neon DB.');
    } catch (boqTableErr) {
      console.error('Failed creating BOQ tables in DB:', boqTableErr);
    }

    // Seed default cost library items if table is empty
    try {
      const rateCountRes = await db.execute(sql`SELECT COUNT(*)::int as count FROM cost_library_items`);
      const count = (rateCountRes.rows[0] as any)?.count || 0;
      if (count === 0) {
        console.log('Seeding official MADECC construction rate library...');
        await db.execute(sql`
          INSERT INTO cost_library_items (item_code, category, name, unit, base_price_xaf, douala_price, yaounde_price, garoua_price, specifications, updated_by) VALUES
          ('MAT-CEM-425', 'Material', 'Portland Cement 42.5N (Dangal / CIMENCAM)', 'bag', 5200, 5000, 5200, 5800, '50kg High Grade Structural Cement', 'Adminmadeccgroup'),
          ('MAT-AGG-SND', 'Material', 'River Sand (Sanaga / Moungo)', 'm3', 14000, 13500, 14500, 16000, 'Clean washed concrete sand', 'Adminmadeccgroup'),
          ('MAT-AGG-GRV', 'Material', 'Crushed Aggregate Gravel (15/25mm)', 'm3', 18500, 17500, 18500, 21000, 'Hard granite crushed aggregate', 'Adminmadeccgroup'),
          ('MAT-BLK-15', 'Material', 'Hollow Concrete Blocks 15x20x40cm', 'piece', 350, 320, 350, 420, 'Vibrated concrete block 15cm', 'Adminmadeccgroup'),
          ('MAT-BLK-20', 'Material', 'Hollow Concrete Blocks 20x20x40cm', 'piece', 420, 390, 420, 490, 'Structural loadbearing block 20cm', 'Adminmadeccgroup'),
          ('MAT-STL-FE400', 'Material', 'High-Yield Reinforcement Steel FeE400 (T10-T16)', 'kg', 750, 720, 750, 820, 'Deformed high-yield steel bars', 'Adminmadeccgroup'),
          ('MAT-BRK-RED', 'Material', 'Compressed Stabilized Earth / Clay Bricks', 'piece', 220, 250, 220, 280, 'Eco-friendly compressed earth bricks', 'Adminmadeccgroup'),
          ('MAT-TILE-PORC', 'Material', '60x60cm Porcelain Floor Tiles', 'm2', 8500, 8000, 8500, 9500, 'High-traffic glazed porcelain tile', 'Adminmadeccgroup'),
          ('MAT-ROOF-ALU', 'Material', 'Aluminium Roofing Sheets (0.50mm)', 'm2', 6800, 6500, 6800, 7500, 'Corrugated aluminium roof sheet', 'Adminmadeccgroup'),
          ('LAB-MASON-DAY', 'Labour', 'Master Mason / Builder Daily Rate', 'man-day', 12000, 12000, 12000, 10000, 'Skilled structural mason', 'Adminmadeccgroup'),
          ('LAB-CARP-DAY', 'Labour', 'Formwork Carpenter Daily Rate', 'man-day', 10000, 10000, 10000, 9000, 'Skilled timber & shuttering carpenter', 'Adminmadeccgroup'),
          ('LAB-STEEL-DAY', 'Labour', 'Steel Fixer / Ironworker Daily Rate', 'man-day', 10000, 10000, 10000, 9000, 'Rebar bending and fixing worker', 'Adminmadeccgroup'),
          ('LAB-HELPER-DAY', 'Labour', 'Site Labourer / Helper Daily Rate', 'man-day', 5000, 5000, 5000, 4500, 'General site worker', 'Adminmadeccgroup'),
          ('PLT-EXCAV-HR', 'Plant', 'Crawler Excavator Rental (20-Ton)', 'hour', 45000, 42000, 45000, 50000, 'Including operator and fuel allowance', 'Adminmadeccgroup'),
          ('PLT-MIXER-DAY', 'Plant', 'Diesel Concrete Mixer 500L', 'day', 35000, 30000, 35000, 40000, 'Site portable concrete mixer', 'Adminmadeccgroup')
        `);
        console.log('✅ Official MADECC Construction Rate Library seeded.');
      }
    } catch (rateSeedErr) {
      console.warn('Could not seed rate library:', rateSeedErr);
    }


    // Seeding specific contract for live verification testing
    console.log('Seeding specific contract CNT-0ZS6BJ8EF5I9QJ4ASHMZ for verification...');
    const existingContract = await db.select().from(signedContracts).where(eq(signedContracts.verificationToken, 'CNT-0ZS6BJ8EF5I9QJ4ASHMZ')).limit(1);
    if (existingContract.length === 0) {
      await db.insert(signedContracts).values({
        contractNo: 'MADECC-2026-LA-089',
        clientName: 'Jean-Pierre Belinga',
        clientNiu: 'M052614923184J',
        clientAddress: 'Bonanjo Boulevard',
        clientCity: 'Douala',
        contractProject: 'MADECC Eco-HQ Tower',
        contractProjectLocation: 'Douala, Littoral Region, Cameroon',
        contractValue: '2200000',
        contractDuration: '6 Months',
        contractScope: 'Foundation works\nBlockwork / Partitions\nReinforcements / Adjustments\nStaircase construction\nStructural masonry\nPlastering & Septic Tank',
        contractDate: 'July 5, 2026',
        contractAgreedBalance: '2200000',
        contractAdvancePayment: '1000000',
        representativeName: 'Dr. Marcel Mbida',
        representativeTitle: 'Managing Director',
        signatoryTitle: 'Client Legal Representative',
        typedClientSignature: 'Jean-Pierre Belinga',
        verificationToken: 'CNT-0ZS6BJ8EF5I9QJ4ASHMZ',
      });
      console.log('Successfully seeded verification key: CNT-0ZS6BJ8EF5I9QJ4ASHMZ');
    }

    // 1. Check if we already have categories seeded
    const categoryCountResult = await db.select({ count: sql<number>`count(*)` }).from(categories);
    const categoryCount = Number(categoryCountResult[0]?.count || 0);

    if (categoryCount > 0) {
      console.log('Database already has data. Running Cameroon localization on existing records...');
      try {
        await db.execute(sql`
          UPDATE projects 
          SET title = 'MADECC Eco-HQ Tower', 
              location = 'Rue Joss, Bonanjo, Douala, Cameroon', 
              budget = '14700000000',
              description = 'A cutting-edge 6-story commercial office tower in Douala featuring green facades, solar roofs, and zero-carbon building design adapted for tropical climates.'
          WHERE title LIKE '%Eco-HQ%' OR location LIKE '%London%';
        `);
        await db.execute(sql`
          UPDATE projects 
          SET title = 'Kribi Beachfront Luxury Estates', 
              location = 'Kribi, South Region, Cameroon', 
              budget = '8500000000',
              description = 'A collection of twelve premium custom-built net-zero smart homes nestled near the gorgeous sandy beaches of Kribi.'
          WHERE title LIKE '%Oakridge%' OR title LIKE '%Surrey%' OR location LIKE '%Surrey%';
        `);
        await db.execute(sql`
          UPDATE projects 
          SET title = 'The Sanaga Bridge Corridor', 
              location = 'Eda, Littoral Region, Cameroon', 
              budget = '43200000000',
              description = 'A vital civil infrastructure expansion spanning 2.4 kilometers of double-lane structural freeway and reinforced arch bridge across the Sanaga River.'
          WHERE title LIKE '%Viaduct%' OR title LIKE '%Devon%' OR location LIKE '%Devon%';
        `);
        await db.execute(sql`
          UPDATE projects 
          SET title = 'Douala Port Logistics Terminal', 
              location = 'Douala Port Area, Cameroon', 
              budget = '22800000000',
              description = 'Massive, highly-efficient industrial shipping terminal and distribution warehouse designed for autonomous logistics in Central Africa.'
          WHERE title LIKE '%Logistics Terminal%' OR location LIKE '%Manchester%';
        `);

        // Update services
        await db.execute(sql`
          UPDATE services 
          SET price_range = '30,000,000 - 6,000,000,000 FCFA'
          WHERE name = 'General Contracting';
        `);
        await db.execute(sql`
          UPDATE services 
          SET price_range = '3,000,000 - 300,000,000 FCFA'
          WHERE name = 'Architectural & Interior Design';
        `);
        await db.execute(sql`
          UPDATE services 
          SET price_range = '300,000,000 - 30,000,000,000 FCFA'
          WHERE name = 'Civil Infrastructure Planning';
        `);
        await db.execute(sql`
          UPDATE services 
          SET price_range = '60,000,000 - 12,000,000,000 FCFA'
          WHERE name = 'Green & Sustainable Building';
        `);

        // Update user contacts
        await db.execute(sql`
          UPDATE users
          SET email = 'kreboya603@gmail.com'
          WHERE email = 'info@madecc.com';
        `);
      } catch (err) {
        console.warn('Could not run existing record migration:', err);
      }
      return;
    }

    console.log('Database is empty. Seeding initial production data...');

    // 2. Seed Categories
    console.log('Seeding categories...');
    const insertedCategories = await db.insert(categories).values([
      { name: 'Residential Construction', slug: 'residential' },
      { name: 'Commercial Development', slug: 'commercial' },
      { name: 'Infrastructure & Civil', slug: 'infrastructure' },
      { name: 'Industrial & Warehouses', slug: 'industrial' },
    ]).returning();

    const catResidential = insertedCategories.find(c => c.slug === 'residential')?.id;
    const catCommercial = insertedCategories.find(c => c.slug === 'commercial')?.id;
    const catInfrastructure = insertedCategories.find(c => c.slug === 'infrastructure')?.id;
    const catIndustrial = insertedCategories.find(c => c.slug === 'industrial')?.id;

    // 3. Seed Services
    console.log('Seeding services...');
    await db.insert(services).values([
      {
        name: 'General Contracting',
        description: 'Comprehensive management of construction operations from groundbreaking to handover.',
        icon: 'HardHat',
        priceRange: '30,000,000 - 6,000,000,000 FCFA',
        details: 'Full site management, safety compliance, subcontractor coordination, material procurement, quality assurance.'
      },
      {
        name: 'Architectural & Interior Design',
        description: 'Creating innovative, functional, and visually striking residential and commercial designs.',
        icon: 'DraftingCompass',
        priceRange: '3,000,000 - 300,000,000 FCFA',
        details: 'Concept drafting, 3D building modeling (BIM), material selection, space optimization, local permit support.'
      },
      {
        name: 'Civil Infrastructure Planning',
        description: 'Large-scale civil projects including bridges, structural frameworks, highways, and transport hubs.',
        icon: 'Bridge',
        priceRange: '300,000,000 - 30,000,000,000 FCFA',
        details: 'Geotechnical surveys, environmental impact reporting, structural engineering, high-stress concrete work.'
      },
      {
        name: 'Green & Sustainable Building',
        description: 'Eco-conscious design and construction focused on energy efficiency and certified standards.',
        icon: 'Leaf',
        priceRange: '60,000,000 - 12,000,000,000 FCFA',
        details: 'LEED certification assistance, solar integration, geothermal HVAC setups, recycled building materials.'
      },
    ]);

    // 4. Seed Projects
    console.log('Seeding projects...');
    const insertedProjects = await db.insert(projects).values([
      {
        title: 'MADECC Eco-HQ Tower',
        description: 'A cutting-edge 6-story commercial office tower in Douala featuring green facades, solar roofs, and zero-carbon building design adapted for tropical climates.',
        budget: '14700000000',
        location: 'Rue Joss, Bonanjo, Douala, Cameroon',
        startDate: new Date('2025-01-10'),
        endDate: new Date('2026-12-15'),
        status: 'in-progress',
        categoryId: catCommercial,
        image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
      },
      {
        title: 'Kribi Beachfront Luxury Estates',
        description: 'A collection of twelve premium custom-built net-zero smart homes nestled near the gorgeous sandy beaches of Kribi.',
        budget: '8500000000',
        location: 'Kribi, South Region, Cameroon',
        startDate: new Date('2024-03-01'),
        endDate: new Date('2025-09-30'),
        status: 'in-progress',
        categoryId: catResidential,
        image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80',
      },
      {
        title: 'The Sanaga Bridge Corridor',
        description: 'A vital civil infrastructure expansion spanning 2.4 kilometers of double-lane structural freeway and reinforced arch bridge across the Sanaga River.',
        budget: '43200000000',
        location: 'Eda, Littoral Region, Cameroon',
        startDate: new Date('2023-06-15'),
        endDate: new Date('2025-05-10'),
        status: 'completed',
        categoryId: catInfrastructure,
        image: 'https://images.unsplash.com/photo-1545558014-868cfc47e053?auto=format&fit=crop&w=800&q=80',
      },
      {
        title: 'Douala Port Logistics Terminal',
        description: 'Massive, highly-efficient industrial shipping terminal and distribution warehouse designed for autonomous logistics in Central Africa.',
        budget: '22800000000',
        location: 'Douala Port Area, Cameroon',
        startDate: new Date('2025-02-01'),
        endDate: new Date('2026-06-30'),
        status: 'planning',
        categoryId: catIndustrial,
        image: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=800&q=80',
      }
    ]).returning();

    const projEcoHQ = insertedProjects.find(p => p.title.includes('Eco-HQ'))?.id;
    const projOakridge = insertedProjects.find(p => p.title.includes('Kribi'))?.id;
    const projDevon = insertedProjects.find(p => p.title.includes('Sanaga'))?.id;

    // 5. Seed Project Progress (Milestones)
    console.log('Seeding project milestones...');
    if (projEcoHQ) {
      await db.insert(projectProgress).values([
        { projectId: projEcoHQ, milestoneName: 'Site Planning & Permits', percentage: 100, status: 'completed', description: 'Environmental impact surveys and commercial blueprints approved by Douala Council.' },
        { projectId: projEcoHQ, milestoneName: 'Foundation & Excavation', percentage: 100, status: 'completed', description: 'Deep excavation and pouring of smart-sensored foundation piles complete.' },
        { projectId: projEcoHQ, milestoneName: 'Steel Structure Framing', percentage: 100, status: 'completed', description: 'Core steel framework raised and certified by structural safety board.' },
        { projectId: projEcoHQ, milestoneName: 'Glass Facade & Cladding', percentage: 40, status: 'active', description: 'Double-glazed high insulation photovoltaic window panes currently being installed.' },
        { projectId: projEcoHQ, milestoneName: 'Interior HVAC & Handover', percentage: 0, status: 'pending', description: 'Installation of green energy grid and client sign-off.' },
      ]);
    }

    if (projOakridge) {
      await db.insert(projectProgress).values([
        { projectId: projOakridge, milestoneName: 'Land Clearing & Grading', percentage: 100, status: 'completed', description: 'Cleared individual plots and established access roadways.' },
        { projectId: projOakridge, milestoneName: 'Foundations & Utilities', percentage: 100, status: 'completed', description: 'High durability floor slabs poured with integrated underfloor cooling lines.' },
        { projectId: projOakridge, milestoneName: 'Structure Construction', percentage: 100, status: 'completed', description: 'Sustainable structures assembled for all 12 units.' },
        { projectId: projOakridge, milestoneName: 'Roofing & Solar Panels', percentage: 80, status: 'active', description: 'Installing smart roof shingles and high-capacity battery units.' },
        { projectId: projOakridge, milestoneName: 'Fittings, Landscaping & Handover', percentage: 15, status: 'pending', description: 'Premium kitchen fittings, smart home hubs, and perimeter landscaping.' },
      ]);
    }

    if (projDevon) {
      await db.insert(projectProgress).values([
        { projectId: projDevon, milestoneName: 'Geotechnical Soil Testing', percentage: 100, status: 'completed', description: 'Tested riverbed soil density and seismic resilience.' },
        { projectId: projDevon, milestoneName: 'Arch Support Concrete Pours', percentage: 100, status: 'completed', description: 'Finished massive pre-stressed arch supports.' },
        { projectId: projDevon, milestoneName: 'Deck Slab Cable Installation', percentage: 100, status: 'completed', description: 'Secured critical steel suspension cables across the viaduct.' },
        { projectId: projDevon, milestoneName: 'Final Tarmac & Safety Barriers', percentage: 100, status: 'completed', description: 'Completed paving and crash-tested side safety boundaries.' },
      ]);
    }

    // 6. Seed Hero Banners
    console.log('Seeding hero banners...');
    await db.insert(heroBanners).values([
      {
        title: 'Precision Construction. Absolute Integrity.',
        subtitle: 'MADECC Group is Cameroon’s premier multi-disciplinary construction and engineering firm turning architectural blueprints into iconic structural masterpieces.',
        imageUrl: 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1600&q=80',
        displayOrder: 1,
        active: true,
      },
      {
        title: 'Eco-Conscious Building For Central Africa',
        subtitle: 'We specialize in sustainable commercial complexes and residential smart estates with zero-carbon footprints in Cameroon.',
        imageUrl: 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1600&q=80',
        displayOrder: 2,
        active: true,
      }
    ]);

    // 7. Seed Blog Posts
    console.log('Seeding blog posts...');
    // Create an author user for blog posts
    const seedAuthor = await db.insert(users).values({
      uid: 'seed-author-uid',
      email: 'kreboya603@gmail.com',
      name: 'Arthur Sterling',
      role: 'staff',
    }).returning();
    const authorId = seedAuthor[0]?.id;

    await db.insert(blogPosts).values([
      {
        title: 'The Rising Trend of Photovoltaic Glass Facades in Cameroon',
        content: `Commercial buildings consume up to 40% of standard city energy grids. At MADECC Group, we are bypassing traditional solar panels by integrating photovoltaic cells directly into structural glass facades.

Our upcoming project, the MADECC Eco-HQ Tower in Douala, uses clear double-glazed solar glass panels. In this post, we explore how building-integrated photovoltaics (BIPV) offset up to 35% of a skyscraper's operational carbon footprint in equatorial climates.`,
        authorId: authorId,
        image: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=800&q=80',
        summary: 'Explore how building-integrated solar glass is transforming modern urban skyscrapers into autonomous green generators in Douala.',
        category: 'Sustainability',
      },
      {
        title: 'Pre-Construction Feasibility: The Secret to Under-Budget Delivery',
        content: `Delays in major civil engineering projects are typically caused by unforeseen geotechnical issues. By utilizing deep soil seismology profiling and full 3D BIM (Building Information Modeling) simulations before a single excavator enters the site, MADECC Group maintains a pristine track record of on-budget handovers in Central Africa.

This article reviews our pre-construction workflow used on the Sanaga Bridge project, highlighting risk-mitigation metrics.`,
        authorId: authorId,
        image: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=800&q=80',
        summary: 'Learn how advanced BIM soil rendering and digital stress simulations eliminate construction overruns before breaking ground.',
        category: 'Engineering',
      }
    ]);

    // 8. Seed Reviews
    console.log('Seeding reviews...');
    await db.insert(reviews).values([
      {
        authorName: 'Jean-Pierre Belinga',
        rating: 5,
        text: 'The structural integrity and speed of the MADECC engineering squad is outstanding. Our Douala logistics terminal was completed two weeks ahead of schedule.',
        projectName: 'Logistics Center Expansion',
        approved: true,
        approvedAt: new Date(),
      },
      {
        authorName: 'Therese Fotso',
        rating: 5,
        text: 'Building our family estate in Kribi with MADECC was an exceptional journey. They accommodated all custom smart-grid adjustments seamlessly. Highly recommended!',
        projectName: 'Kribi Beachfront Custom Eco-Home',
        approved: true,
        approvedAt: new Date(),
      },
      {
        authorName: 'Marcus Brodie',
        rating: 4,
        text: 'Outstanding pre-construction consultations. Their virtual 3D rendering of our corporate site saved us massive foundation planning errors.',
        projectName: 'Commercial Office Block',
        approved: false, // For testing approval flow!
      }
    ]);

    // 9. Seed Gallery Items
    console.log('Seeding gallery items...');
    await db.insert(galleryItems).values([
      { title: 'Excavators Preparing Foundation', imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80', category: 'Civil Work' },
      { title: 'Steel Skeleton High-Rise', imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=600&q=80', category: 'Commercial' },
      { title: 'Photovoltaic Glass Placement', imageUrl: 'https://images.unsplash.com/photo-1508514177221-188b1cf16e9d?auto=format&fit=crop&w=600&q=80', category: 'Sustainability' },
      { title: 'Kribi Beachfront Estates Construction', imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80', category: 'Residential' },
    ]);

    // 10. Seed Team Members
    console.log('Seeding team members...');
    const existingTeam = await db.select().from(teamMembers).limit(1);
    if (existingTeam.length === 0) {
      await db.insert(teamMembers).values([
        {
          name: 'Eng. Dieudonné Kemgne',
          role: 'Managing Director & Principal Civil Engineer',
          specialization: 'Structural Engineering & Heavy Infrastructure Projects (MEng, SEC)',
          image: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80',
          email: 'd.kemgne@madeccgroup.com'
        },
        {
          name: 'Marcus Ndip',
          role: 'Lead Architect & BIM Director',
          specialization: 'Eco-Conscious Building Design, 3D Soil Rendering & BIM Modeling (BArch, RIBA)',
          image: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
          email: 'm.ndip@madeccgroup.com'
        },
        {
          name: 'Dr. Amélie Fotso',
          role: 'Director of Project Delivery',
          specialization: 'Strategic Contract Management & Construction Resource Optimization (PhD, PMP)',
          image: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
          email: 'a.fotso@madeccgroup.com'
        },
        {
          name: 'Alain Tchouta',
          role: 'Senior Health & Safety Officer (HSE)',
          specialization: 'Regulatory Weekly Site Safety Audits & Compliance Standards (NEBOSH Cert)',
          image: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80',
          email: 'a.tchouta@madeccgroup.com'
        }
      ]);
    }

    // 11. Seed CMS Site Settings
    console.log('Seeding CMS site settings...');
    const existingSettings = await db.select().from(siteSettings).limit(1);
    if (existingSettings.length === 0) {
      await db.insert(siteSettings).values({
        siteName: 'MADECC Group',
        tagline: 'Premier Construction, Civil Engineering & Project Management in Cameroon',
        phone: '+237 670 00 00 00',
        emergencyPhone: '+237 690 00 00 00',
        email: 'contact@madeccgroup.com',
        officeAddressYaounde: 'Mbankolo, Yaoundé, Centre Region, Cameroon',
        officeAddressDouala: 'Akwa, Douala, Littoral Region, Cameroon',
        businessHours: 'Mon - Fri: 08:00 - 18:00 | Sat: 08:30 - 14:00 (GMT+1)',
        whatsappNumber: '+237670000000',
        facebookUrl: 'https://facebook.com/madeccgroup',
        linkedinUrl: 'https://linkedin.com/company/madecc-group',
        instagramUrl: 'https://instagram.com/madeccgroup',
        youtubeUrl: 'https://youtube.com/@madeccgroup',
        twitterUrl: 'https://x.com/madeccgroup',
        logoUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=400&q=80',
        globalSeo: {
          seoTitle: 'MADECC Group — Premier Construction & Civil Engineering in Cameroon',
          metaDescription: 'Official portal of MADECC Group. Structural design, turn-key civil construction, Eurocode compliance, BOQ estimation, and project management in Yaoundé, Douala, and across Cameroon.',
          canonicalUrl: 'https://madeccgroup.com',
          ogTitle: 'MADECC Group — Engineering Excellence in Cameroon',
          ogDescription: 'Leading construction and civil engineering contractor in Cameroon. Eurocode 2 standards, certified concrete batching, and turnkey execution.',
          ogImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1600&q=80',
          robotsIndex: true,
          keywords: 'construction cameroon, civil engineering yaounde, building contractor douala, madecc group, eurocode concrete, boq estimation cameroon'
        },
        navigationLinks: [
          { id: 'nav-home', label: 'Home', href: 'home', order: 1, isEnabled: true },
          { id: 'nav-about', label: 'About Us', href: 'about', order: 2, isEnabled: true },
          { id: 'nav-services', label: 'Services', href: 'services', order: 3, isEnabled: true },
          { id: 'nav-projects', label: 'Projects', href: 'projects', order: 4, isEnabled: true },
          { id: 'nav-sustainability', label: 'Sustainability', href: 'sustainability', order: 5, isEnabled: true },
          { id: 'nav-tenders', label: 'Tenders & Bids', href: 'tenders', order: 6, isEnabled: true },
          { id: 'nav-suppliers', label: 'Suppliers', href: 'suppliers', order: 7, isEnabled: true },
          { id: 'nav-blog', label: 'Technical Insights', href: 'blog', order: 8, isEnabled: true },
          { id: 'nav-contact', label: 'Contact', href: 'contact', order: 9, isEnabled: true }
        ],
        footerContent: {
          aboutText: 'MADECC Group is a premier multi-disciplinary construction, design-build, and civil engineering firm operating across Cameroon. We construct landmarks of absolute structural integrity, sustainability, and architectural excellence.',
          copyrightText: `© ${new Date().getFullYear()} MADECC Group. All rights reserved. Registered Enterprise with MINTP & ONIGC Compliance in Cameroon.`,
          accreditationBadges: [
            'Eurocode 2 / BAEL 91 Compliant',
            'Order of Civil Engineers (ONIGC)',
            'ISO 9001:2015 Quality Certified',
            'MINTP Category A Contractor'
          ]
        },
        emergencyBanner: {
          enabled: false,
          message: '24/7 Rapid Emergency Civil & Structural Response Team available across Yaoundé and Douala.',
          linkText: 'Call Emergency Hotline',
          linkUrl: 'tel:+237690000000',
          badgeType: 'urgent'
        }
      });
    }

    // 12. Seed CMS Pages (Home, About, Services, Projects, Contact, etc.)
    console.log('Seeding CMS pages...');
    const existingPages = await db.select().from(pageContents).limit(1);
    if (existingPages.length === 0) {
      // Home Page CMS Content
      const homeHeroConfig = {
        eyebrow: 'Construction & Civil Engineering — Cameroon',
        title: 'Building Cameroon’s Future with Structural Precision & Integrity',
        subtitle: 'From major infrastructure corridors to high-grade commercial and residential complexes in Yaoundé, Douala, and nationwide. Engineered to Eurocode 2 and certified Cameroonian standards.',
        description: 'MADECC Group delivers turnkey civil engineering, structural calculations, geotechnical soil validation, and fixed-price BOQ execution for private, institutional, and government clients.',
        primaryCta: {
          text: 'Request a Free Quote',
          link: 'request-quote',
          visible: true
        },
        secondaryCta: {
          text: 'Calculate Budget (FCFA)',
          link: 'budget-calculator',
          visible: true
        },
        tertiaryCta: {
          text: 'Schedule Technical Consultation →',
          link: 'booking',
          visible: true
        },
        mediaType: 'video' as const,
        videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-construction-site-with-cranes-and-workers-40915-large.mp4',
        posterUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1920&q=80',
        imageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1920&q=80',
        mobileImageUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=800&q=80',
        videoSettings: {
          autoplay: true,
          muted: true,
          loop: true,
          playsInline: true,
          disableOnMobile: false,
          overlayOpacity: 75
        },
        showHero: true,
        showVideo: true,
        trustBadges: [
          { icon: 'CheckCircle2', text: 'Eurocode 2 / BAEL 91 Standards' },
          { icon: 'CheckCircle2', text: 'Fixed-Price Itemized BOQ in FCFA' },
          { icon: 'CheckCircle2', text: '28-Day Concrete Cube Strength Tests' },
          { icon: 'CheckCircle2', text: 'ONIGC Licensed Engineers' }
        ]
      };

      const homeSections = [
        {
          id: 'sec-estimator',
          type: 'custom' as const,
          title: 'Quick Construction Cost Estimator',
          subtitle: 'Instant transparent preliminary budget calculation in FCFA (XAF)',
          enabled: true,
          displayOrder: 1
        },
        {
          id: 'sec-about',
          type: 'about' as const,
          title: 'About MADECC Group',
          subtitle: 'A Premier Cameroonian Construction & Engineering Firm',
          content: 'Founded on bedrock principles of technical rigour, transparent BOQ pricing, and uncompromising site safety, MADECC Group operates as a fully accredited multidisciplinary contractor across Cameroon. Our in-house geotechnical, structural, and quantity surveying teams bridge European engineering benchmarks (Eurocode 2) with local subsoil and climate realities.',
          mediaUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80',
          layout: 'split' as const,
          enabled: true,
          displayOrder: 2,
          ctaText: 'Discover Our Company Story',
          ctaLink: 'about'
        },
        {
          id: 'sec-services',
          type: 'services' as const,
          title: 'Our Core Engineering & Construction Services',
          subtitle: 'End-to-end capabilities from geotechnical site survey to handover',
          enabled: true,
          displayOrder: 3,
          ctaText: 'Explore All Services',
          ctaLink: 'services'
        },
        {
          id: 'sec-projects',
          type: 'projects' as const,
          title: 'Featured Works & Landmark Projects',
          subtitle: 'Demonstrating structural excellence and timely project delivery',
          enabled: true,
          displayOrder: 4,
          ctaText: 'View Portfolio',
          ctaLink: 'projects'
        },
        {
          id: 'sec-why-choose-us',
          type: 'why_choose_us' as const,
          title: 'Why Clients & Institutions Trust MADECC Group',
          subtitle: 'Rigorous engineering standards tailored for Cameroon’s terrain',
          enabled: true,
          displayOrder: 5
        },
        {
          id: 'sec-process',
          type: 'process' as const,
          title: 'Our 5-Stage Project Delivery Framework',
          subtitle: 'From initial feasibility study to turnkey commissioning',
          enabled: true,
          displayOrder: 6
        },
        {
          id: 'sec-testimonials',
          type: 'testimonials' as const,
          title: 'Client Testimonials & Industry Reviews',
          subtitle: 'What commercial developers, diaspora builders, and public partners say',
          enabled: true,
          displayOrder: 7
        },
        {
          id: 'sec-faq',
          type: 'faq' as const,
          title: 'Frequently Asked Technical & Cost Questions',
          subtitle: 'Direct answers on building costs, permits, concrete dosages, and timelines in Cameroon',
          enabled: true,
          displayOrder: 8
        },
        {
          id: 'sec-cta',
          type: 'cta' as const,
          title: 'Ready to Plan Your Next Construction Project in Cameroon?',
          subtitle: 'Schedule a consultation with our Chief Structural Engineer in Yaoundé or Douala.',
          ctaText: 'Book Technical Consultation',
          ctaLink: 'booking',
          enabled: true,
          displayOrder: 9
        }
      ];

      const homeSeo = {
        seoTitle: 'MADECC Group — Premier Construction & Civil Engineering in Cameroon',
        metaDescription: 'Leading Cameroonian construction and engineering firm. Turnkey commercial and residential building, roadworks, geotechnical soil surveys, and BOQ estimation in Yaoundé and Douala.',
        canonicalUrl: 'https://madeccgroup.com/',
        ogTitle: 'MADECC Group — Building Cameroon with Structural Precision',
        ogDescription: 'Certified civil engineering contractor in Yaoundé & Douala. Eurocode 2 standards, transparent BOQs, and timely execution.',
        ogImage: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1600&q=80',
        keywords: 'construction cameroon, civil engineering yaounde, building contractor douala, madecc group, eurocode concrete, boq estimation cameroon',
        robotsIndex: true
      };

      await db.insert(pageContents).values([
        {
          slug: 'home',
          title: 'Homepage',
          status: 'PUBLISHED',
          heroConfig: homeHeroConfig,
          sections: homeSections,
          seo: homeSeo,
          publishedData: {
            heroConfig: homeHeroConfig,
            sections: homeSections,
            seo: homeSeo
          },
          draftData: {
            heroConfig: homeHeroConfig,
            sections: homeSections,
            seo: homeSeo
          },
          version: 1,
          lastSavedBy: 'MADECC Executive Admin',
          publishedAt: new Date()
        },
        {
          slug: 'about',
          title: 'About Us',
          status: 'PUBLISHED',
          heroConfig: {
            ...homeHeroConfig,
            eyebrow: 'Our Heritage & Mission',
            title: 'Engineering Rigour, Local Roots & Enduring Integrity',
            subtitle: 'Learn about the engineers, values, and technical licenses driving MADECC Group across the 10 regions of Cameroon.',
            videoUrl: null,
            imageUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1600&q=80'
          },
          sections: [],
          seo: {
            seoTitle: 'About MADECC Group — Civil Engineering Company in Cameroon',
            metaDescription: 'Learn about MADECC Group: management team, ONIGC engineering certifications, equipment fleet, and mission in Cameroon.',
            robotsIndex: true
          },
          publishedData: {
            heroConfig: homeHeroConfig,
            sections: [],
            seo: { seoTitle: 'About MADECC Group', metaDescription: 'About our company.', robotsIndex: true }
          },
          version: 1,
          lastSavedBy: 'MADECC Executive Admin',
          publishedAt: new Date()
        },
        {
          slug: 'services',
          title: 'Services & Solutions',
          status: 'PUBLISHED',
          heroConfig: {
            ...homeHeroConfig,
            eyebrow: 'Our Capabilities',
            title: 'Comprehensive Civil Engineering & Turnkey Construction',
            subtitle: 'From foundation pile driving to MEP installations and interior finishes.',
            imageUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1600&q=80'
          },
          sections: [],
          seo: {
            seoTitle: 'Civil Engineering & Construction Services — MADECC Group Cameroon',
            metaDescription: 'Discover our construction services in Cameroon: structural calculations, building construction, quantity surveying, MEP, and project supervision.',
            robotsIndex: true
          },
          publishedData: {
            heroConfig: homeHeroConfig,
            sections: [],
            seo: { seoTitle: 'Services — MADECC Group', metaDescription: 'Our services.', robotsIndex: true }
          },
          version: 1,
          lastSavedBy: 'MADECC Executive Admin',
          publishedAt: new Date()
        },
        {
          slug: 'contact',
          title: 'Contact Us',
          status: 'PUBLISHED',
          heroConfig: {
            ...homeHeroConfig,
            eyebrow: 'Headquarters & Regional Branches',
            title: 'Connect with MADECC Engineering Teams in Yaoundé & Douala',
            subtitle: 'Schedule an on-site visit or submit architectural drawings for a detailed BOQ estimate.',
            imageUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1600&q=80'
          },
          sections: [],
          seo: {
            seoTitle: 'Contact MADECC Group — Yaoundé & Douala Offices',
            metaDescription: 'Get in touch with MADECC Group. Yaoundé Mbankolo HQ & Douala Akwa office. Phone: +237 670 00 00 00.',
            robotsIndex: true
          },
          publishedData: {
            heroConfig: homeHeroConfig,
            sections: [],
            seo: { seoTitle: 'Contact — MADECC Group', metaDescription: 'Contact us.', robotsIndex: true }
          },
          version: 1,
          lastSavedBy: 'MADECC Executive Admin',
          publishedAt: new Date()
        }
      ]);
    }

    // 13. Seed Media Library Assets
    console.log('Seeding Media Library assets...');
    const existingMedia = await db.select().from(mediaLibrary).limit(1);
    if (existingMedia.length === 0) {
      await db.insert(mediaLibrary).values([
        {
          title: 'Hero Background Site Video (MP4)',
          filename: 'construction-site-40915.mp4',
          fileUrl: 'https://assets.mixkit.co/videos/preview/mixkit-construction-site-with-cranes-and-workers-40915-large.mp4',
          fileType: 'video',
          mimeType: 'video/mp4',
          fileSize: 12582912,
          dimensions: '1920x1080',
          altText: 'Active Cameroonian construction site with tower cranes and reinforced concrete frame',
          caption: 'High-definition video showcase of civil engineering operations',
          category: 'Hero Media',
          tags: ['hero', 'video', 'cranes', 'concrete', 'workers'],
          usedIn: ['Home Hero Section']
        },
        {
          title: 'Heavy Foundation Excavator (High-Res Poster)',
          filename: 'hero-poster-foundation.jpg',
          fileUrl: 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1920&q=80',
          fileType: 'image',
          mimeType: 'image/jpeg',
          fileSize: 1845000,
          dimensions: '1920x1080',
          altText: 'Heavy machinery and concrete foundation casting in Cameroon',
          caption: 'Primary hero fallback image and poster frame',
          category: 'Hero Media',
          tags: ['hero', 'poster', 'excavator', 'foundation'],
          usedIn: ['Home Hero Section Poster', 'About Page']
        },
        {
          title: 'Eco-HQ Tower Douala Architecture',
          filename: 'eco-hq-douala.jpg',
          fileUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
          fileType: 'image',
          mimeType: 'image/jpeg',
          fileSize: 1420000,
          dimensions: '1200x800',
          altText: 'MADECC Eco-HQ Commercial Tower in Bonanjo Douala',
          caption: 'Flagship commercial project showcase',
          category: 'Projects',
          tags: ['commercial', 'douala', 'architecture', 'high-rise'],
          usedIn: ['Projects Portfolio', 'Homepage Featured Works']
        },
        {
          title: 'Concrete Cylinder Strength Compression Test',
          filename: 'concrete-compression-test.jpg',
          fileUrl: 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80',
          fileType: 'image',
          mimeType: 'image/jpeg',
          fileSize: 1105000,
          dimensions: '1200x800',
          altText: 'Laboratory 28-day concrete cube crush test conforming to Eurocode 2',
          caption: 'Quality control laboratory testing',
          category: 'Services',
          tags: ['quality', 'concrete', 'lab', 'eurocode'],
          usedIn: ['Why Choose Us', 'Services Page']
        },
        {
          title: 'MADECC Group Corporate Badge & Logo',
          filename: 'madecc-badge-logo.jpg',
          fileUrl: 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=600&q=80',
          fileType: 'logo',
          mimeType: 'image/jpeg',
          fileSize: 340000,
          dimensions: '600x600',
          altText: 'MADECC Group official enterprise insignia',
          caption: 'Corporate branding badge',
          category: 'Logos',
          tags: ['logo', 'brand', 'identity'],
          usedIn: ['Global Navigation', 'Footer', 'Official Documents']
        }
      ]);
    }

    console.log('--- Database Seeding Completed Successfully ---');
  } catch (error) {
    console.error('Error during database seeding:', error);
  }
}
