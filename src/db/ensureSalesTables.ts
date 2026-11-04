import { pool, db, getOrInitPool } from './index.ts';

let salesTablesEnsured = false;

/**
 * Ensures all KRR Group sales, book publishing, and order management tables exist in PostgreSQL
 * with all required columns, safe additive migrations, and default catalog textbooks.
 */
export async function ensureSalesTables(): Promise<void> {
  const activePool = pool || getOrInitPool();
  if (!activePool) {
    console.warn('[SALES_TABLES] No active database pool available to verify sales tables.');
    return;
  }

  try {
    const client = await activePool.connect();
    try {
      // 1. Create sales_products table
      await client.query(`
        CREATE TABLE IF NOT EXISTS sales_products (
          id SERIAL PRIMARY KEY,
          sku TEXT NOT NULL UNIQUE,
          title TEXT NOT NULL,
          slug TEXT NOT NULL UNIQUE,
          description TEXT NOT NULL,
          short_description TEXT,
          category TEXT DEFAULT 'Civil Engineering Textbooks' NOT NULL,
          year_level TEXT DEFAULT 'General',
          subject TEXT DEFAULT 'Civil Engineering',
          format TEXT DEFAULT 'DIGITAL' NOT NULL,
          price INTEGER DEFAULT 0 NOT NULL,
          compare_at_price INTEGER,
          cover_image TEXT NOT NULL,
          preview_pdf_url TEXT,
          digital_file_url TEXT,
          digital_file_name TEXT,
          digital_file_size_mb NUMERIC,
          stock_quantity INTEGER DEFAULT 100,
          track_inventory BOOLEAN DEFAULT FALSE NOT NULL,
          isbn TEXT,
          author TEXT DEFAULT 'KRR Engineering Editorial Board',
          publisher TEXT DEFAULT 'KRR Group & MADECC Publishing, Yaoundé',
          publication_year INTEGER DEFAULT 2026,
          pages_count INTEGER DEFAULT 350,
          language TEXT DEFAULT 'English & French',
          status TEXT DEFAULT 'PUBLISHED' NOT NULL,
          featured BOOLEAN DEFAULT FALSE NOT NULL,
          tags JSONB DEFAULT '[]'::jsonb,
          display_order INTEGER DEFAULT 1 NOT NULL,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
          updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
        );
      `);

      // 2. Safe additive columns for sales_products (guarantees schema compatibility with live Neon databases)
      const productColumns = [
        "title TEXT",
        "description TEXT",
        "short_description TEXT",
        "category TEXT DEFAULT 'Civil Engineering Textbooks'",
        "year_level TEXT DEFAULT 'General'",
        "subject TEXT DEFAULT 'Civil Engineering'",
        "format TEXT DEFAULT 'DIGITAL'",
        "price INTEGER DEFAULT 0",
        "compare_at_price INTEGER",
        "cover_image TEXT DEFAULT '/logo.png'",
        "preview_pdf_url TEXT",
        "digital_file_url TEXT",
        "digital_file_name TEXT",
        "digital_file_size_mb NUMERIC",
        "stock_quantity INTEGER DEFAULT 100",
        "track_inventory BOOLEAN DEFAULT FALSE",
        "isbn TEXT",
        "author TEXT DEFAULT 'KRR Engineering Editorial Board'",
        "publisher TEXT DEFAULT 'KRR Group & MADECC Publishing, Yaoundé'",
        "publication_year INTEGER DEFAULT 2026",
        "pages_count INTEGER DEFAULT 350",
        "language TEXT DEFAULT 'English & French'",
        "status TEXT DEFAULT 'PUBLISHED'",
        "featured BOOLEAN DEFAULT FALSE",
        "tags JSONB DEFAULT '[]'::jsonb",
        "display_order INTEGER DEFAULT 1",
        "created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()",
        "updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()"
      ];

      for (const colDef of productColumns) {
        const colName = colDef.split(' ')[0];
        await client.query(`ALTER TABLE sales_products ADD COLUMN IF NOT EXISTS ${colName} ${colDef.substring(colName.length)};`);
      }

      // 3. Create sales_orders table
      await client.query(`
        CREATE TABLE IF NOT EXISTS sales_orders (
          id SERIAL PRIMARY KEY,
          order_reference TEXT NOT NULL UNIQUE,
          access_token TEXT NOT NULL UNIQUE,
          customer_name TEXT NOT NULL,
          customer_email TEXT NOT NULL,
          customer_phone TEXT NOT NULL,
          customer_whatsapp TEXT,
          shipping_city TEXT DEFAULT 'Yaoundé' NOT NULL,
          shipping_address TEXT,
          delivery_method TEXT DEFAULT 'DIGITAL_DOWNLOAD' NOT NULL,
          subtotal INTEGER DEFAULT 0 NOT NULL,
          delivery_fee INTEGER DEFAULT 0 NOT NULL,
          tax_amount INTEGER DEFAULT 0 NOT NULL,
          grand_total INTEGER DEFAULT 0 NOT NULL,
          currency TEXT DEFAULT 'XAF' NOT NULL,
          order_status TEXT DEFAULT 'PENDING' NOT NULL,
          payment_status TEXT DEFAULT 'UNPAID' NOT NULL,
          payment_method TEXT DEFAULT 'MTN_MOMO' NOT NULL,
          internal_notes TEXT,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
          updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
        );
      `);

      // 4. Create sales_order_items table
      await client.query(`
        CREATE TABLE IF NOT EXISTS sales_order_items (
          id SERIAL PRIMARY KEY,
          order_id INTEGER REFERENCES sales_orders(id) ON DELETE CASCADE NOT NULL,
          product_id INTEGER REFERENCES sales_products(id) ON DELETE SET NULL,
          product_title TEXT NOT NULL,
          product_sku TEXT,
          product_format TEXT DEFAULT 'DIGITAL' NOT NULL,
          unit_price INTEGER NOT NULL,
          quantity INTEGER DEFAULT 1 NOT NULL,
          total_price INTEGER NOT NULL,
          digital_file_url TEXT,
          download_count INTEGER DEFAULT 0 NOT NULL,
          last_downloaded_at TIMESTAMP WITHOUT TIME ZONE
        );
      `);

      // 5. Create sales_payments table
      await client.query(`
        CREATE TABLE IF NOT EXISTS sales_payments (
          id SERIAL PRIMARY KEY,
          order_id INTEGER REFERENCES sales_orders(id) ON DELETE CASCADE NOT NULL,
          order_reference TEXT NOT NULL,
          amount INTEGER NOT NULL,
          currency TEXT DEFAULT 'XAF' NOT NULL,
          payment_method TEXT NOT NULL,
          transaction_reference TEXT NOT NULL,
          payer_phone TEXT,
          payer_name TEXT,
          proof_image_url TEXT,
          status TEXT DEFAULT 'AWAITING_VERIFICATION' NOT NULL,
          rejection_reason TEXT,
          verified_by TEXT,
          verified_at TIMESTAMP WITHOUT TIME ZONE,
          customer_notified BOOLEAN DEFAULT FALSE NOT NULL,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
        );
      `);

      // 6. Create sales_download_logs table
      await client.query(`
        CREATE TABLE IF NOT EXISTS sales_download_logs (
          id SERIAL PRIMARY KEY,
          order_id INTEGER NOT NULL,
          order_reference TEXT NOT NULL,
          product_id INTEGER NOT NULL,
          customer_email TEXT NOT NULL,
          ip_address TEXT,
          user_agent TEXT,
          timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
        );
      `);

      // 7. Ensure audit_logs table exists
      await client.query(`
        CREATE TABLE IF NOT EXISTS audit_logs (
          id SERIAL PRIMARY KEY,
          user_id TEXT NOT NULL,
          user_email TEXT NOT NULL,
          action TEXT NOT NULL,
          details TEXT,
          ip_address TEXT,
          timestamp TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
        );
      `);

      // 8. Seed default KRR Group textbooks if sales_products is empty
      const countRes = await client.query('SELECT count(*)::int as count FROM sales_products;');
      if (countRes.rows[0]?.count === 0) {
        console.log('[SALES_TABLES] Seeding baseline publications catalog...');
        await client.query(`
          INSERT INTO sales_products (
            sku, title, slug, description, short_description, category, year_level, subject,
            format, price, compare_at_price, cover_image, preview_pdf_url, digital_file_url,
            digital_file_name, digital_file_size_mb, stock_quantity, track_inventory, isbn,
            author, publisher, publication_year, pages_count, language, status, featured, tags, display_order
          ) VALUES 
          (
            'KRR-TXT-2026-001',
            'Cameroon Civil Engineering & Eurocode 2 Practice Manual',
            'cameroon-civil-engineering-eurocode-manual',
            'Comprehensive technical reference manual for structural engineers, project managers, and civil consultants operating in Central Africa. Fully covers limit state concrete design, Eurocode 2 (EN 1992-1-1), BAEL 91 comparison, soil-structure interaction under tropical moisture, pad footings, continuous beams, high-strength rebar scheduling (HA FeE500), and site safety compliance.',
            'The authoritative structural engineering & Eurocode 2 reference manual tailored for Central Africa construction.',
            'Civil Engineering Textbooks',
            'University & Polytechnic',
            'Structural Engineering',
            'DIGITAL',
            15000,
            25000,
            'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1200&q=80',
            'https://madeccgroup.online/assets/sample-civil-engineering-preview.pdf',
            'https://madeccgroup.online/assets/krr-eurocode2-manual-complete-2026.pdf',
            'krr-eurocode2-manual-complete-2026.pdf',
            18.5,
            500,
            false,
            '978-9956-42-026-1',
            'Kasah Rodrick Reboya & KRR Editorial Board',
            'KRR Group & MADECC Educational Publishing, Yaoundé',
            2026,
            428,
            'English & French',
            'PUBLISHED',
            true,
            '["eurocode2", "civil-engineering", "structural-design", "cameroon-construction", "reinforced-concrete"]'::jsonb,
            1
          ),
          (
            'KRR-TXT-2026-002',
            'Building Construction & Reinforced Concrete Site Handbook',
            'building-construction-reinforced-concrete-handbook',
            'A practical, job-site illustrated field handbook covering formwork design, batching plant calibration, slump and compressive strength tests (C25/30), curing regimens in equatorial climates, and masonry detailing.',
            'Essential jobsite field guide for site engineers, foremen, and TVET construction students.',
            'Building Construction',
            'Technical School & TVET',
            'Building Construction',
            'DIGITAL',
            12500,
            18000,
            'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1200&q=80',
            'https://madeccgroup.online/assets/sample-site-handbook-preview.pdf',
            'https://madeccgroup.online/assets/krr-site-handbook-complete-2026.pdf',
            'krr-site-handbook-complete-2026.pdf',
            14.2,
            500,
            false,
            '978-9956-42-026-2',
            'KRR Engineering Editorial Board',
            'KRR Group & MADECC Educational Publishing, Yaoundé',
            2026,
            340,
            'English & French',
            'PUBLISHED',
            true,
            '["site-supervision", "concrete-handbook", "construction-management", "cameroon"]'::jsonb,
            2
          ),
          (
            'KRR-TXT-2026-003',
            'Quantity Surveying, Estimating & BOQ Master Guide for Central Africa',
            'quantity-surveying-boq-estimating-master-guide',
            'Definitive standard method of measurement (SMM) guide and parametric unit cost database for Cameroon and the CEMAC zone.',
            'Standard Method of Measurement & Unit Rate Analysis database for estimators and contractors.',
            'Quantity Surveying & BOQ',
            'Professional Practice',
            'Quantity Surveying',
            'DIGITAL',
            18000,
            30000,
            'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1200&q=80',
            'https://madeccgroup.online/assets/sample-qs-guide-preview.pdf',
            'https://madeccgroup.online/assets/krr-qs-estimating-master-guide-2026.pdf',
            'krr-qs-estimating-master-guide-2026.pdf',
            22.8,
            500,
            false,
            '978-9956-42-026-3',
            'KRR Quantity Surveying Practice Group',
            'KRR Group & MADECC Educational Publishing, Yaoundé',
            2026,
            490,
            'English',
            'PUBLISHED',
            true,
            '["quantity-surveying", "boq-estimating", "unit-rates", "cameroon", "tenders"]'::jsonb,
            3
          ),
          (
            'KRR-MAN-2026-004',
            'Navigation Manual (A4 PDF)',
            'navigation-manual-a4-pdf',
            'Official MADECC Group portal and system navigation guide. Step-by-step documentation for clients, contractors, and project stakeholders to navigate all interactive features, BOQ cost estimators, tender dossiers, and online services.',
            'Complete A4 printable and digital PDF manual for platform and operational navigation.',
            'Educational Guides',
            'General',
            'Platform Navigation',
            'DIGITAL',
            999,
            3000,
            'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
            'https://madeccgroup.online/assets/navigation-manual-preview.pdf',
            'https://madeccgroup.online/assets/madecc-navigation-manual-2026.pdf',
            'madecc-navigation-manual-2026.pdf',
            4.5,
            1000,
            false,
            '978-9956-42-026-4',
            'MADECC Portal Engineering Team',
            'KRR Group & MADECC Publishing, Yaoundé',
            2026,
            45,
            'English & French',
            'PUBLISHED',
            false,
            '["manual", "navigation", "guide", "madecc", "pdf"]'::jsonb,
            4
          ),
          (
            'KRR-MAN-2026-005',
            'Buyer Brand Handover Manual (PDF)',
            'buyer-brand-handover-manual-pdf',
            'Official Buyer Brand Handover and Asset Documentation Manual. Comprehensive guidelines on corporate brand identity usage, technical intellectual property, architectural handover standards, and turnkey commercial asset transfer.',
            'Comprehensive brand handover and technical asset documentation manual for purchasers and commercial partners.',
            'Educational Guides',
            'General',
            'Brand Handover',
            'DIGITAL',
            999,
            3500,
            'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=1200&q=80',
            'https://madeccgroup.online/assets/brand-handover-preview.pdf',
            'https://madeccgroup.online/assets/madecc-brand-handover-manual-2026.pdf',
            'madecc-brand-handover-manual-2026.pdf',
            5.2,
            1000,
            false,
            '978-9956-42-026-5',
            'KRR Group Brand & Legal Secretariat',
            'KRR Group & MADECC Publishing, Yaoundé',
            2026,
            58,
            'English & French',
            'PUBLISHED',
            false,
            '["brand", "handover", "manual", "buyer-guide", "legal-asset"]'::jsonb,
            5
          );
        `);
      }

      salesTablesEnsured = true;
      console.log('✅ [DATABASE] sales_products and related sales tables verified and initialized.');
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('⚠️ [DATABASE ERROR] Failed verifying sales tables:', err.message);
  }
}
