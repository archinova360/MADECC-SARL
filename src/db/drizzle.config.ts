import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';

// Load environment variables from .env file.
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;
const sqlHost = process.env.SQL_HOST;
const sqlDbName = process.env.SQL_DB_NAME;
const user = process.env.SQL_ADMIN_USER || process.env.SQL_USER;
const password = process.env.SQL_ADMIN_PASSWORD || process.env.SQL_PASSWORD;

if (!databaseUrl && (!sqlHost || !sqlDbName || !user || !password)) {
  throw new Error("Either DATABASE_URL or discrete SQL_* variables must be set in environment variables.");
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle', // Output directory for migrations.
  dialect: 'postgresql',
  schemaFilter: ['public'],
  dbCredentials: databaseUrl ? {
    url: databaseUrl,
  } : {
    host: sqlHost!,
    user: user!,
    password: password!,
    database: sqlDbName!,
    ssl: false, // Typically false when connecting via Cloud SQL Auth Proxy.
  },
  verbose: true,
});
