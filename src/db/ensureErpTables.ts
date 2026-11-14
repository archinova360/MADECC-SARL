import { pool, getOrInitPool } from './index.ts';

let erpTablesEnsured = false;

/**
 * Ensures all MADECC GROUP Construction ERP and Client Portal tables exist in PostgreSQL
 * with all required columns, safe additive migrations, indexes, and initial realistic Cameroon
 * enterprise seed records.
 */
export async function ensureErpTables(): Promise<void> {
  if (erpTablesEnsured) return;

  const activePool = pool || getOrInitPool();
  if (!activePool) {
    console.warn('[ERP_TABLES] No active database pool available to verify ERP tables.');
    return;
  }

  try {
    const client = await activePool.connect();
    try {
      // 1. Clients Table (Client Portal Accounts)
      await client.query(`
        CREATE TABLE IF NOT EXISTS clients (
          id SERIAL PRIMARY KEY,
          client_code TEXT NOT NULL UNIQUE,
          full_name TEXT NOT NULL,
          company_name TEXT,
          email TEXT NOT NULL UNIQUE,
          password_hash TEXT,
          phone TEXT,
          phone_secondary TEXT,
          address TEXT,
          city TEXT DEFAULT 'Yaoundé',
          country TEXT DEFAULT 'Cameroon',
          status TEXT DEFAULT 'ACTIVE' NOT NULL,
          invited_by TEXT DEFAULT 'Adminmadeccgroup',
          notes TEXT,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
          last_login TIMESTAMP WITHOUT TIME ZONE
        );
      `);

      // 2. Client Projects Junction
      await client.query(`
        CREATE TABLE IF NOT EXISTS client_projects (
          id SERIAL PRIMARY KEY,
          client_id INTEGER NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
          project_id INTEGER NOT NULL,
          role TEXT DEFAULT 'OWNER' NOT NULL,
          access_level TEXT DEFAULT 'FULL' NOT NULL,
          assigned_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
          CONSTRAINT uq_client_project UNIQUE (client_id, project_id)
        );
      `);

      // 3. Project Progress Media (Photos & Videos)
      await client.query(`
        CREATE TABLE IF NOT EXISTS project_media (
          id SERIAL PRIMARY KEY,
          project_id INTEGER NOT NULL,
          phase TEXT NOT NULL,
          media_type TEXT DEFAULT 'PHOTO' NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          media_url TEXT NOT NULL,
          thumbnail_url TEXT,
          upload_date DATE DEFAULT CURRENT_DATE NOT NULL,
          is_client_visible BOOLEAN DEFAULT TRUE NOT NULL,
          uploaded_by TEXT DEFAULT 'Project Manager' NOT NULL,
          file_size_mb NUMERIC DEFAULT 1.5,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
        );
      `);

      // 4. Project Invoices
      await client.query(`
        CREATE TABLE IF NOT EXISTS project_invoices (
          id SERIAL PRIMARY KEY,
          invoice_number TEXT NOT NULL UNIQUE,
          project_id INTEGER NOT NULL,
          client_id INTEGER,
          issue_date DATE DEFAULT CURRENT_DATE NOT NULL,
          due_date DATE NOT NULL,
          subtotal_xaf NUMERIC DEFAULT 0 NOT NULL,
          tax_rate_percent NUMERIC DEFAULT 19.25 NOT NULL,
          tax_amount_xaf NUMERIC DEFAULT 0 NOT NULL,
          discount_xaf NUMERIC DEFAULT 0 NOT NULL,
          total_amount_xaf NUMERIC DEFAULT 0 NOT NULL,
          paid_amount_xaf NUMERIC DEFAULT 0 NOT NULL,
          balance_due_xaf NUMERIC DEFAULT 0 NOT NULL,
          status TEXT DEFAULT 'ISSUED' NOT NULL,
          payment_method TEXT,
          payment_reference TEXT,
          notes TEXT,
          pdf_url TEXT,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
          updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
        );
      `);

      // 5. Project Invoice Line Items
      await client.query(`
        CREATE TABLE IF NOT EXISTS project_invoice_items (
          id SERIAL PRIMARY KEY,
          invoice_id INTEGER NOT NULL REFERENCES project_invoices(id) ON DELETE CASCADE,
          item_number INTEGER DEFAULT 1 NOT NULL,
          description TEXT NOT NULL,
          category TEXT DEFAULT 'MATERIALS' NOT NULL,
          unit TEXT DEFAULT 'LS' NOT NULL,
          quantity NUMERIC DEFAULT 1 NOT NULL,
          unit_price_xaf NUMERIC DEFAULT 0 NOT NULL,
          total_price_xaf NUMERIC DEFAULT 0 NOT NULL
        );
      `);

      // 6. Equipment & Machinery Fleet
      await client.query(`
        CREATE TABLE IF NOT EXISTS equipment (
          id SERIAL PRIMARY KEY,
          asset_tag TEXT NOT NULL UNIQUE,
          name TEXT NOT NULL,
          category TEXT NOT NULL,
          brand_model TEXT,
          serial_number TEXT,
          status TEXT DEFAULT 'AVAILABLE' NOT NULL,
          condition TEXT DEFAULT 'EXCELLENT' NOT NULL,
          assigned_project_id INTEGER,
          assigned_operator TEXT,
          purchase_date DATE,
          purchase_cost_xaf NUMERIC DEFAULT 0,
          hourly_rate_xaf NUMERIC DEFAULT 0,
          last_maintenance_date DATE,
          next_maintenance_date DATE,
          location TEXT DEFAULT 'Yaoundé Central Depot',
          notes TEXT,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
        );
      `);

      // 7. Equipment Maintenance Records
      await client.query(`
        CREATE TABLE IF NOT EXISTS equipment_maintenance (
          id SERIAL PRIMARY KEY,
          equipment_id INTEGER NOT NULL REFERENCES equipment(id) ON DELETE CASCADE,
          maintenance_date DATE DEFAULT CURRENT_DATE NOT NULL,
          maintenance_type TEXT DEFAULT 'PREVENTATIVE' NOT NULL,
          description TEXT NOT NULL,
          parts_replaced TEXT,
          technician_name TEXT NOT NULL,
          cost_xaf NUMERIC DEFAULT 0 NOT NULL,
          status TEXT DEFAULT 'COMPLETED' NOT NULL,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
        );
      `);

      // 8. Subcontractors Registry
      await client.query(`
        CREATE TABLE IF NOT EXISTS subcontractors (
          id SERIAL PRIMARY KEY,
          company_name TEXT NOT NULL,
          contact_person TEXT NOT NULL,
          phone TEXT NOT NULL,
          email TEXT,
          specialization TEXT NOT NULL,
          rccm_number TEXT,
          niu_tax_number TEXT,
          rating NUMERIC DEFAULT 5.0 NOT NULL,
          status TEXT DEFAULT 'APPROVED' NOT NULL,
          total_contracts_count INTEGER DEFAULT 0 NOT NULL,
          total_contract_value_xaf NUMERIC DEFAULT 0 NOT NULL,
          address TEXT DEFAULT 'Yaoundé / Douala',
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
        );
      `);

      // 9. Workforce & Artisans Roster
      await client.query(`
        CREATE TABLE IF NOT EXISTS worker_roster (
          id SERIAL PRIMARY KEY,
          worker_code TEXT NOT NULL UNIQUE,
          full_name TEXT NOT NULL,
          national_id TEXT,
          phone TEXT,
          trade_category TEXT NOT NULL,
          skill_level TEXT DEFAULT 'SKILLED' NOT NULL,
          daily_rate_xaf NUMERIC DEFAULT 7500 NOT NULL,
          monthly_salary_xaf NUMERIC DEFAULT 0,
          assigned_project_id INTEGER,
          emergency_contact TEXT,
          safety_induction_date DATE,
          status TEXT DEFAULT 'ACTIVE' NOT NULL,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
        );
      `);

      // 10. Daily Worker Attendance & Hours
      await client.query(`
        CREATE TABLE IF NOT EXISTS worker_attendance (
          id SERIAL PRIMARY KEY,
          worker_id INTEGER NOT NULL REFERENCES worker_roster(id) ON DELETE CASCADE,
          project_id INTEGER NOT NULL,
          attendance_date DATE DEFAULT CURRENT_DATE NOT NULL,
          status TEXT DEFAULT 'PRESENT' NOT NULL,
          check_in_time TEXT DEFAULT '07:30',
          check_out_time TEXT DEFAULT '17:00',
          regular_hours NUMERIC DEFAULT 8.0 NOT NULL,
          overtime_hours NUMERIC DEFAULT 0.0 NOT NULL,
          daily_cost_xaf NUMERIC DEFAULT 0 NOT NULL,
          supervisor_signoff TEXT DEFAULT 'Site Engineer',
          remarks TEXT,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL,
          CONSTRAINT uq_worker_attendance UNIQUE (worker_id, attendance_date)
        );
      `);

      // 11. Materials Inventory Movements
      await client.query(`
        CREATE TABLE IF NOT EXISTS inventory_movements (
          id SERIAL PRIMARY KEY,
          inventory_item_id INTEGER,
          movement_type TEXT NOT NULL,
          quantity NUMERIC NOT NULL,
          unit TEXT NOT NULL,
          unit_cost_xaf NUMERIC DEFAULT 0 NOT NULL,
          total_cost_xaf NUMERIC DEFAULT 0 NOT NULL,
          project_id INTEGER,
          authorized_by TEXT DEFAULT 'Stores Manager',
          receiver_name TEXT,
          reference_doc TEXT,
          movement_date DATE DEFAULT CURRENT_DATE NOT NULL,
          notes TEXT,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
        );
      `);

      // 11b. Project Site Progress Updates (Live Admin -> Client Portal Sync)
      await client.query(`
        CREATE TABLE IF NOT EXISTS project_updates (
          id SERIAL PRIMARY KEY,
          project_id INTEGER NOT NULL,
          phase TEXT DEFAULT 'Superstructure & Columns' NOT NULL,
          title TEXT NOT NULL,
          summary TEXT NOT NULL,
          completion_percentage INTEGER DEFAULT 0 NOT NULL,
          status_badge TEXT DEFAULT 'ON_SCHEDULE' NOT NULL,
          schedule_variance TEXT DEFAULT 'On schedule per master Gantt',
          delay_explanation TEXT DEFAULT '',
          supervisor_name TEXT DEFAULT 'Ing. Arnaud Fopa (ONIGC Registered)',
          supervisor_phone TEXT DEFAULT '+237 671 06 35 11',
          workforce_on_site INTEGER DEFAULT 14,
          weather TEXT DEFAULT 'Dry / Clear',
          attachment_url TEXT,
          attachment_type TEXT DEFAULT 'PHOTO',
          is_client_visible BOOLEAN DEFAULT TRUE NOT NULL,
          published_by TEXT DEFAULT 'Adminmadeccgroup',
          update_date DATE DEFAULT CURRENT_DATE NOT NULL,
          created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now() NOT NULL
        );
      `);

      // 12. Safe Additive Columns Check
      const additiveColumns: { table: string; col: string }[] = [
        { table: 'clients', col: 'password_hash TEXT' },
        { table: 'clients', col: 'last_login TIMESTAMP WITHOUT TIME ZONE' },
        { table: 'clients', col: 'updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT now()' },
        { table: 'project_invoices', col: 'pdf_url TEXT' },
        { table: 'project_invoices', col: 'payment_reference TEXT' },
        { table: 'project_media', col: 'is_client_visible BOOLEAN DEFAULT TRUE' },
        { table: 'worker_roster', col: 'assigned_project_id INTEGER' },
        { table: 'equipment', col: 'assigned_project_id INTEGER' },
        { table: 'project_updates', col: 'attachment_type TEXT DEFAULT \'PHOTO\'' },
        { table: 'project_updates', col: 'delay_explanation TEXT DEFAULT \'\'' }
      ];

      for (const item of additiveColumns) {
        try {
          await client.query(`ALTER TABLE ${item.table} ADD COLUMN IF NOT EXISTS ${item.col};`);
        } catch (colErr: any) {
          // Ignore if already present
        }
      }

      // 13. Seed Starter Records if tables are empty
      const clientCount = await client.query('SELECT COUNT(*) FROM clients');
      if (parseInt(clientCount.rows[0].count, 10) === 0) {
        // Create initial client accounts mapped to live projects
        await client.query(`
          INSERT INTO clients (client_code, full_name, company_name, email, password_hash, phone, address, city, status)
          VALUES 
          ('CLT-2026-001', 'Dr. Paul Biwoli', 'Société Immobilière Camerounaise (SIC)', 'client@madeccgroup.online', 'Client2026@Madecc', '+237 671 06 35 11', 'Quartier Bastos, Rue 1028', 'Yaoundé', 'ACTIVE'),
          ('CLT-2026-002', 'Eng. Jeannette Ebanda', 'Ebanda Commercial Properties', 'ebanda.properties@gmail.com', 'Client2026@Madecc', '+237 699 82 41 05', 'Bonanjo Maritime Zone', 'Douala', 'ACTIVE');
        `);

        // Link clients dynamically to existing projects (or fallback 1 & 2)
        const existingProjects = await client.query('SELECT id FROM projects ORDER BY id ASC LIMIT 2');
        const firstProjId = existingProjects.rows[0]?.id || 1;
        const secondProjId = existingProjects.rows[1]?.id || firstProjId;
        await client.query(
          `INSERT INTO client_projects (client_id, project_id, role, access_level)
           VALUES (1, $1, 'PROJECT_SPONSOR', 'FULL'), (2, $2, 'DEVELOPER', 'FULL')
           ON CONFLICT DO NOTHING`,
          [firstProjId, secondProjId]
        );
      }

      // Ensure Project 1 (or first existing project) has starter progress updates if empty
      const updCount = await client.query('SELECT COUNT(*) FROM project_updates');
      if (parseInt(updCount.rows[0].count, 10) === 0) {
        const firstProjRes = await client.query('SELECT id FROM projects ORDER BY id ASC LIMIT 1');
        const targetProjId = firstProjRes.rows[0]?.id || 1;
        await client.query(
          `INSERT INTO project_updates (
            project_id, phase, title, summary, completion_percentage, status_badge, schedule_variance,
            delay_explanation, supervisor_name, supervisor_phone, workforce_on_site, weather,
            attachment_url, attachment_type, is_client_visible, published_by, update_date
          ) VALUES
          ($1, 'Foundation & Earthworks', 'Foundation Concrete Pour & Soil Certification Completed',
           'Strip footing excavation, lean blinding concrete, and FeE500 rebar cage placement passed geotechnical & structural inspection with 28-day cube test confirmation.',
           35, 'COMPLETED', '+2 Days Ahead', '', 'Ing. Arnaud Fopa (ONIGC Registered)', '+237 671 06 35 11', 16, 'Clear / Dry',
           'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1200&q=80', 'PHOTO', TRUE, 'Adminmadeccgroup', CURRENT_DATE - INTERVAL '10 days'),
          ($1, 'Superstructure & Columns', 'Level 1 Columns, Beams Formwork & Concrete Curing Inspection',
           'Completed Doka formwork alignment and Class C25/30 ready-mix concrete casting for primary structural columns C1-C14 and Level 1 ring beams. Mechanical vibration verified.',
           58, 'ON_SCHEDULE', 'On Schedule per Master GANTT', '', 'Ing. Arnaud Fopa (ONIGC Registered)', '+237 671 06 35 11', 18, 'Partly Cloudy',
           'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80', 'PHOTO', TRUE, 'Adminmadeccgroup', CURRENT_DATE - INTERVAL '2 days')`,
          [targetProjId]
        );
      }

      // Seed equipment if empty
      const eqCount = await client.query('SELECT COUNT(*) FROM equipment');
      if (parseInt(eqCount.rows[0].count, 10) === 0) {
        await client.query(`
          INSERT INTO equipment (asset_tag, name, category, brand_model, status, condition, assigned_project_id, assigned_operator, hourly_rate_xaf, location)
          VALUES
          ('EQP-CAT-320', 'Crawler Hydraulic Excavator 22T', 'Heavy Machinery', 'Caterpillar 320 GC', 'ASSIGNED', 'EXCELLENT', 1, 'Jean-Claude Mbarga', 45000, 'Site Mbankolo Hill Phase 2'),
          ('EQP-MIX-500', 'Reversible Drum Concrete Mixer 500L', 'Light Machinery', 'Altrad Belle Promix 500', 'AVAILABLE', 'GOOD', NULL, 'Samuel Ndongo', 15000, 'Yaoundé Central Yard'),
          ('EQP-TRK-001', 'Heavy Tipper Dump Truck 20m3', 'Transport Vehicles', 'Mercedes-Benz Actros 3340', 'ASSIGNED', 'EXCELLENT', 1, 'Etienne Nguemo', 35000, 'Site Mbankolo Hill Phase 2'),
          ('EQP-GEN-100', 'Silent Diesel Generator 100kVA', 'Light Machinery', 'Perkins Soundproofed', 'AVAILABLE', 'EXCELLENT', NULL, 'Technical Stores', 12000, 'Central Depot Bastos'),
          ('EQP-CRN-002', 'Self-Erecting Tower Crane 32m', 'Heavy Machinery', 'Potain Igo T 85 A', 'ASSIGNED', 'EXCELLENT', 2, 'Roger Manga (Chief Rigger)', 65000, 'Douala Commercial Tower'),
          ('EQP-SCF-1000', 'Galvanized Modular Scaffolding System 1500m2', 'Scaffolding & Formwork', 'Doka Framax Xlife', 'ASSIGNED', 'EXCELLENT', 1, 'Scaffolding Crew A', 8000, 'Site Mbankolo Hill Phase 2'),
          ('EQP-SRV-GPS', 'Dual-Frequency RTK GNSS Receiver & Total Station', 'Surveying Equipment', 'Leica FlexLine TS07', 'AVAILABLE', 'EXCELLENT', NULL, 'Chief Topographer', 25000, 'Engineering HQ');
        `);
      }

      // Seed Subcontractors if empty
      const subCount = await client.query('SELECT COUNT(*) FROM subcontractors');
      if (parseInt(subCount.rows[0].count, 10) === 0) {
        await client.query(`
          INSERT INTO subcontractors (company_name, contact_person, phone, email, specialization, rccm_number, niu_tax_number, rating, status, total_contracts_count, total_contract_value_xaf)
          VALUES
          ('SOGETRA Earthworks Sarl', 'Alain Tchuente', '+237 677 23 44 11', 'contact@sogetra-cm.com', 'Earthworks & Excavation', 'RC/YAO/2018/B/421', 'M041800012458Z', 4.9, 'APPROVED', 4, 38500000),
          ('Cameroun Électricité & Fluides (CEF)', 'Marcelle Ngo', '+237 699 44 55 22', 'info@cef-cameroun.com', 'Electrical Works', 'RC/DLA/2019/B/874', 'M051900034871A', 4.8, 'APPROVED', 3, 24800000),
          ('Hydro-Plomberie Moderne', 'Patrice Bella', '+237 674 11 22 33', 'hydroplomberie@yahoo.fr', 'Plumbing & Drainage', 'RC/YAO/2020/B/156', 'M082000078912C', 4.7, 'APPROVED', 2, 16200000),
          ('Alu-Verre Architecture Douala', 'Bernard Kamga', '+237 690 33 22 11', 'direction@aluverre.cm', 'Glazing & Aluminium', 'RC/DLA/2017/B/992', 'M021700045123K', 4.9, 'APPROVED', 5, 42000000);
        `);
      }

      // Seed Worker Roster if empty
      const wrkCount = await client.query('SELECT COUNT(*) FROM worker_roster');
      if (parseInt(wrkCount.rows[0].count, 10) === 0) {
        await client.query(`
          INSERT INTO worker_roster (worker_code, full_name, national_id, phone, trade_category, skill_level, daily_rate_xaf, assigned_project_id, status)
          VALUES
          ('WRK-001', 'Arnaud Fopa (Ing. Civil)', '114872911', '+237 671 45 22 01', 'Site Engineer', 'ENGINEER', 25000, 1, 'ACTIVE'),
          ('WRK-002', 'Michel Onana', '109834212', '+237 699 11 88 44', 'General Foreman', 'FOREMAN', 15000, 1, 'ACTIVE'),
          ('WRK-003', 'Dieudonné Manga', '118374829', '+237 675 33 22 11', 'Mason / Bricklayer', 'MASTER_CRAFTSMAN', 8500, 1, 'ACTIVE'),
          ('WRK-004', 'Rodrigue Tagne', '115482910', '+237 691 22 33 44', 'Carpenter & Formworker', 'SKILLED', 8000, 1, 'ACTIVE'),
          ('WRK-005', 'Christian Bella', '116938201', '+237 678 99 00 11', 'Steel Fixer / Rebar', 'SKILLED', 8000, 1, 'ACTIVE'),
          ('WRK-006', 'Fabrice Nji', '117492019', '+237 694 55 66 77', 'Plumber & Pipefitter', 'SKILLED', 8500, 1, 'ACTIVE'),
          ('WRK-007', 'Simon Etoa', '112039481', '+237 673 44 11 22', 'Electrician', 'SKILLED', 8500, 1, 'ACTIVE'),
          ('WRK-008', 'Albert Kemadjou', '119203841', '+237 695 11 22 33', 'Unskilled Site Labourer', 'UNSKILLED', 4500, 1, 'ACTIVE'),
          ('WRK-009', 'Joseph Bassong', '113948201', '+237 672 33 44 55', 'Unskilled Site Labourer', 'UNSKILLED', 4500, 1, 'ACTIVE');
        `);
      }

      // Seed Project Invoices if empty
      const invCount = await client.query('SELECT COUNT(*) FROM project_invoices');
      if (parseInt(invCount.rows[0].count, 10) === 0) {
        await client.query(`
          INSERT INTO project_invoices (invoice_number, project_id, client_id, issue_date, due_date, subtotal_xaf, tax_rate_percent, tax_amount_xaf, discount_xaf, total_amount_xaf, paid_amount_xaf, balance_due_xaf, status, notes)
          VALUES
          ('INV-2026-001', 1, 1, '2026-02-15', '2026-03-05', 18500000, 19.25, 3561250, 0, 22061250, 22061250, 0, 'PAID', 'Foundation & Earthworks phase completion certificate milestone payment'),
          ('INV-2026-002', 1, 1, '2026-03-20', '2026-04-10', 24000000, 19.25, 4620000, 0, 28620000, 15000000, 13620000, 'PARTIALLY_PAID', 'Superstructure Level 1 slab casting and column reinforcement mobilization'),
          ('INV-2026-003', 2, 2, '2026-03-25', '2026-04-15', 32000000, 19.25, 6160000, 0, 38160000, 0, 38160000, 'ISSUED', 'Commercial Complex substructure piles & deep foundation works phase 1');
        `);

        // Add invoice items
        await client.query(`
          INSERT INTO project_invoice_items (invoice_id, item_number, description, category, unit, quantity, unit_price_xaf, total_price_xaf)
          VALUES
          (1, 1, 'Site clearing, topographical beaconing & bulk excavation in rocky soil', 'SUBCONTRACT', 'm3', 450, 8500, 3825000),
          (1, 2, 'Supply and placement of Class C25/30 reinforced concrete in strip footings', 'MATERIALS', 'm3', 85, 95000, 8075000),
          (1, 3, 'High-yield FeE500 ribbed rebar fabrication & steel fixing', 'MATERIALS', 'ton', 8.5, 780000, 6630000),
          (2, 1, 'Supply and erection of Doka formwork for Level 1 suspended beams & slab', 'EQUIPMENT', 'm2', 380, 12500, 4750000),
          (2, 2, 'Ready-mix concrete pumping for 200mm solid floor slab with additive', 'MATERIALS', 'm3', 95, 115000, 10925000),
          (2, 3, 'Skilled civil engineering supervision, quality control & slump tests', 'PROFESSIONAL_FEES', 'LS', 1, 8325000, 8325000);
        `);
      }

      // Seed Project Media (Progress Photos) if empty
      const medCount = await client.query('SELECT COUNT(*) FROM project_media');
      if (parseInt(medCount.rows[0].count, 10) === 0) {
        await client.query(`
          INSERT INTO project_media (project_id, phase, media_type, title, description, media_url, upload_date, is_client_visible, uploaded_by)
          VALUES
          (1, 'Foundation & Earthworks', 'PHOTO', 'Strip Footing Trenching & Bedding Concrete', 'Successful soil excavation and placement of 100mm blinding concrete under footings.', 'https://images.unsplash.com/photo-1541888946425-d0fbb18086f6?auto=format&fit=crop&w=1200&q=80', '2026-02-18', TRUE, 'Arnaud Fopa (Site Eng)'),
          (1, 'Superstructure & Columns', 'PHOTO', 'Level 1 Column Cages & Formwork Alignment', 'Installation of high-tensile rebar cages for columns C1-C14 with laser plumb checks.', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1200&q=80', '2026-03-12', TRUE, 'Michel Onana (Foreman)'),
          (1, 'Superstructure & Columns', 'PHOTO', 'Floor Slab Concrete Pouring & Mechanical Vibration', 'Continuous pour of 95m3 C25/30 ready-mix concrete with dual vibrators.', 'https://images.unsplash.com/photo-1581094794329-c8112a89af12?auto=format&fit=crop&w=1200&q=80', '2026-03-24', TRUE, 'Arnaud Fopa (Site Eng)');
        `);
      }

      erpTablesEnsured = true;
      console.log('[ERP_TABLES] All MADECC GROUP Construction ERP and Client Portal tables verified successfully.');
    } finally {
      client.release();
    }
  } catch (err: any) {
    console.error('[ERP_TABLES_ERROR] Failed ensuring ERP tables:', err.message);
  }
}
