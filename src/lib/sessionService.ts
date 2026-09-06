import crypto from 'crypto';
import { db, pool } from '../db/index.ts';
import { authSessions } from '../db/schema.ts';
import { eq, and, desc } from 'drizzle-orm';

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
 * Creates an authoritative database session in Neon PostgreSQL
 */
export async function createDatabaseSession(
  userId: string,
  email: string,
  role: string = 'admin'
): Promise<{ sessionToken: string; expiresAt: Date }> {
  await ensureAuthSessionsTable();
  const sessionToken = 'MADECC_AUTH_' + crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days validity
  const normalizedEmail = (email || '').toLowerCase().trim();

  if (db) {
    try {
      await db.insert(authSessions).values({
        sessionToken,
        userId: userId || 'admin-madecc-uid',
        email: normalizedEmail,
        role: role || 'admin',
        isActive: true,
        expiresAt,
      });
    } catch (err) {
      console.error('[DATABASE_SESSION_CREATE_ERROR]', err);
    }
  }

  return { sessionToken, expiresAt };
}

/**
 * Validates whether a given session token is active and unexpired in Neon PostgreSQL
 */
export async function validateDatabaseSession(sessionToken: string) {
  if (!sessionToken || !db) return null;
  const trimmed = sessionToken.trim();

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
    console.error('[DATABASE_SESSION_VALIDATE_ERROR]', err);
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
  if (!db) return false;
  const now = new Date();
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
