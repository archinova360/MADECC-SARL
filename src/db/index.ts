import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './schema.ts';

// Function to resolve database connection string across all standard naming conventions
export const getDatabaseConnectionString = (): string | undefined => {
  if (
    !process.env.DATABASE_URL &&
    !process.env.DIRECT_DATABASE_URL &&
    !process.env.POSTGRES_URL &&
    !process.env.NEON_DATABASE_URL &&
    !process.env.SUPABASE_DATABASE_URL
  ) {
    try {
      // Lazily attempt loading .env if available
      const dotenv = require('dotenv');
      dotenv.config();
    } catch (_) {}
  }

  return (
    process.env.DATABASE_URL ||
    process.env.DIRECT_DATABASE_URL ||
    process.env.POSTGRES_URL ||
    process.env.POSTGRES_PRISMA_URL ||
    process.env.POSTGRES_URL_NON_POOLING ||
    process.env.NEON_DATABASE_URL ||
    process.env.SUPABASE_DATABASE_URL
  );
};

// Function to create a new connection pool.
export const createPool = () => {
  const connectionString = getDatabaseConnectionString();
  if (!connectionString) {
    console.warn('⚠️  [DATABASE WARNING] No PostgreSQL connection string found (checked DATABASE_URL, DIRECT_DATABASE_URL, POSTGRES_URL, NEON_DATABASE_URL, SUPABASE_DATABASE_URL).');
    return null;
  }
  
  // Check explicit query parameters
  const hasForceDisable = connectionString.includes('sslmode=disable');
  const hasForceEnable = connectionString.includes('sslmode=require');
  
  // Detect standard local addresses
  const isLocalHost = connectionString.includes('localhost') || 
                      connectionString.includes('127.0.0.1');
  
  // Enable SSL for remote database connections unless explicitly disabled or connecting to localhost.
  const needsSsl = hasForceEnable || (!isLocalHost && !hasForceDisable);

  return new Pool({
    connectionString,
    connectionTimeoutMillis: 15000,
    max: process.env.NETLIFY ? 3 : 10, // Optimize pool size for serverless environments
    idleTimeoutMillis: process.env.NETLIFY ? 1000 : 30000,
    ssl: needsSsl ? { rejectUnauthorized: false } : false
  });
};

// Create a pool instance safely.
export let pool = createPool();

export const getOrInitPool = () => {
  if (!pool) {
    pool = createPool();
    if (pool) {
      pool.on('error', (err: any) => {
        console.error('Unexpected error on idle SQL pool client:', err);
      });
    }
  }
  return pool;
};

// Prevent unhandled pool-level errors from crashing the application
if (pool) {
  pool.on('error', (err: any) => {
    console.error('Unexpected error on idle SQL pool client:', err);
  });
}

// Initialize Drizzle with the pool and schema.
let drizzleInstance: any = pool ? drizzle(pool, { schema }) : null;

export const db: any = new Proxy({}, {
  get(_target, prop) {
    if (!drizzleInstance) {
      const activePool = getOrInitPool();
      if (activePool) {
        drizzleInstance = drizzle(activePool, { schema });
      }
    }
    if (drizzleInstance) {
      return (drizzleInstance as any)[prop];
    }
    console.warn(`[DATABASE WARNING] Attempted to access db.${String(prop)} without active DATABASE_URL`);
    return () => Promise.resolve([]);
  }
});
