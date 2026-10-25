import crypto from 'crypto';
import { db, pool } from '../db/index.ts';
import { authSessions } from '../db/schema.ts';
import { eq, and, desc } from 'drizzle-orm';

interface MemorySessionRecord {
  id: number;
  sessionToken: string;
  userId: string;
  email: string;
  role: string;
  isActive: boolean;
  expiresAt: Date;
  revokedAt?: Date | null;
  createdAt: Date;
}

// Authoritative in-memory session mirror so admin login works reliably even if DB is cold/unreachable
const activeMemorySessions = new Map<string, MemorySessionRecord>();

/**
 * Ensure the auth_sessions table exists in Neon PostgreSQL
 */
export async function ensureAuthSessionsTable(): Promise<void> {
  if (!pool) return;
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS auth_sessions (
        id SERIAL PRIMARY KEY,
        session_token TEXT NOT NULL UNIQUE,
        user_id TEXT NOT NULL,
        email TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        expires_at TIMESTAMP NOT NULL,
        revoked_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_token ON auth_sessions(session_token);
      CREATE INDEX IF NOT EXISTS idx_auth_sessions_email ON auth_sessions(email);
    `);
  } catch (err) {
    console.warn('[AUTH_SESSIONS_INIT_WARN] Failed to check/create auth_sessions table:', err);
  }
}

/**
 * Creates an authoritative database session in Neon PostgreSQL (with memory mirror)
 */
export async function createDatabaseSession(
  userId: string,
  email: string,
  role: string = 'admin'
): Promise<{ sessionToken: string; expiresAt: Date }> {
  const sessionToken = 'MADECC_AUTH_' + crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days validity
  const normalizedEmail = (email || '').toLowerCase().trim();

  activeMemorySessions.set(sessionToken, {
    id: Date.now(),
    sessionToken,
    userId: userId || 'admin-madecc-uid',
    email: normalizedEmail,
    role: role || 'admin',
    isActive: true,
    expiresAt,
    createdAt: new Date()
  });

  try {
    await ensureAuthSessionsTable();
    if (db) {
      await db.insert(authSessions).values({
        sessionToken,
        userId: userId || 'admin-madecc-uid',
        email: normalizedEmail,
        role: role || 'admin',
        isActive: true,
        expiresAt,
      });
    }
  } catch (err) {
    console.warn('[DATABASE_SESSION_CREATE_NOTICE] Using memory session fallback:', err);
  }

  return { sessionToken, expiresAt };
}

/**
 * Validates whether a given session token is active and unexpired in Neon PostgreSQL or memory mirror
 */
export async function validateDatabaseSession(sessionToken: string) {
  if (!sessionToken) return null;
  const trimmed = sessionToken.trim();

  // Check in-memory mirror first for fast & resilient verification
  const memSess = activeMemorySessions.get(trimmed);
  if (memSess) {
    if (!memSess.isActive || new Date(memSess.expiresAt).getTime() <= Date.now()) {
      memSess.isActive = false;
      return null;
    }
    return memSess;
  }

  if (!db) return null;

  try {
    const results = await db
      .select()
      .from(authSessions)
      .where(and(eq(authSessions.sessionToken, trimmed), eq(authSessions.isActive, true)))
      .limit(1);

    if (results.length === 0) {
      return null;
    }

    const sess = results[0];
    const now = new Date();

    if (new Date(sess.expiresAt).getTime() <= now.getTime()) {
      // Expired: Mark inactive in DB
      await db
        .update(authSessions)
        .set({ isActive: false, revokedAt: now })
        .where(eq(authSessions.id, sess.id));
      return null;
    }

    return sess;
  } catch (err) {
    console.warn('[DATABASE_SESSION_VALIDATE_ERROR]', err);
    return null;
  }
}

/**
 * Revokes an administrative/user session in Neon PostgreSQL upon logout
 */
export async function revokeDatabaseSession(
  sessionToken?: string,
  email?: string,
  userId?: string
): Promise<boolean> {
  const now = new Date();
  const normalizedEmail = email ? email.toLowerCase().trim() : '';

  if (sessionToken) {
    const mem = activeMemorySessions.get(sessionToken.trim());
    if (mem) {
      mem.isActive = false;
      mem.revokedAt = now;
    }
  }
  for (const [, mem] of activeMemorySessions.entries()) {
    if (
      (normalizedEmail && mem.email === normalizedEmail) ||
      (userId && mem.userId === userId)
    ) {
      mem.isActive = false;
      mem.revokedAt = now;
    }
  }

  if (!db) return true;
  let revokedCount = 0;

  try {
    // 1. Invalidate by exact session token
    if (sessionToken) {
      const trimmed = sessionToken.trim();
      const res = await db
        .update(authSessions)
        .set({ isActive: false, revokedAt: now })
        .where(eq(authSessions.sessionToken, trimmed))
        .returning();
      revokedCount += res.length;
    }

    // 2. Invalidate all active sessions for the user's email if provided
    if (email) {
      const normalizedEmail = email.toLowerCase().trim();
      const res = await db
        .update(authSessions)
        .set({ isActive: false, revokedAt: now })
        .where(and(eq(authSessions.email, normalizedEmail), eq(authSessions.isActive, true)))
        .returning();
      revokedCount += res.length;
    }

    // 3. Invalidate all active sessions for the user's UID if provided
    if (userId) {
      const res = await db
        .update(authSessions)
        .set({ isActive: false, revokedAt: now })
        .where(and(eq(authSessions.userId, userId), eq(authSessions.isActive, true)))
        .returning();
      revokedCount += res.length;
    }

    return true;
  } catch (err) {
    console.error('[DATABASE_SESSION_REVOKE_ERROR]', err);
    return false;
  }
}
