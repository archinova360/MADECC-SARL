import fs from 'fs';
import path from 'path';
import pkg from 'pg';
const { Pool } = pkg;
import * as dotenv from 'dotenv';

dotenv.config();

async function runMigration() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    console.error('DATABASE_URL is missing in environment.');
    process.exit(1);
  }

  const isLocalHost = connectionString.includes('localhost') || connectionString.includes('127.0.0.1');
  const pool = new Pool({
    connectionString,
    connectionTimeoutMillis: 15000,
    ssl: !isLocalHost ? { rejectUnauthorized: false } : false
  });

  const sqlFile = path.join(process.cwd(), 'drizzle/0000_absent_mister_fear.sql');
  if (!fs.existsSync(sqlFile)) {
    console.error('Migration SQL file not found at:', sqlFile);
    process.exit(1);
  }

  let sqlContent = fs.readFileSync(sqlFile, 'utf8');
  // Replace CREATE TABLE with CREATE TABLE IF NOT EXISTS
  sqlContent = sqlContent.replace(/CREATE TABLE "/g, 'CREATE TABLE IF NOT EXISTS "');

  const statements = sqlContent.split('--> statement-breakpoint').map(s => s.trim()).filter(Boolean);
  console.log(`Found ${statements.length} SQL statements to execute.`);

  const client = await pool.connect();
  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    try {
      await client.query(stmt);
      successCount++;
    } catch (err: any) {
      console.warn(`[STMT ${i + 1} WARN] ${err.message}`);
      errorCount++;
    }
  }

  client.release();
  await pool.end();
  console.log(`Migration complete. Successfully executed: ${successCount}, Errors/Skipped: ${errorCount}`);
}

runMigration().catch(err => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
