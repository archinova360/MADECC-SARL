import { drizzle } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
const { Pool } = pkg;
import * as schema from './schema.ts';

// Function to create a new connection pool.
export const createPool = () => {
  const connectionString = process.env.DATABASE_URL || process.env.DIRECT_DATABASE_URL;
  if (!connectionString) {
    console.warn('⚠️  [DATABASE WARNING] Neither DATABASE_URL nor DIRECT_DATABASE_URL environment variable is defined.');
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
    max: process.env.NETLIFY ? 2 : 10, // Optimize pool size for serverless environments
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
