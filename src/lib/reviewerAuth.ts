import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.ts';
import { reviewerCredentials, users } from '../db/schema.ts';
import { eq, sql } from 'drizzle-orm';

// Environment secret for HMAC token signing
const SESSION_SECRET = process.env.SESSION_SECRET || process.env.ENCRYPTION_KEY || 'madecc_meta_review_isolated_hmac_secret_2026';
const REVIEWER_EMAIL = (process.env.META_REVIEWER_EMAIL || 'meta-reviewer@madeccgroup.online').toLowerCase().trim();
const DEFAULT_INITIAL_PASSWORD = process.env.META_REVIEWER_PASSWORD || 'M@deccMetaReview#2026!X7qP9';

export interface ReviewerPayload {
  uid: string;
  email: string;
  role: string;
  name: string;
  exp: number;
}

/**
 * Hash a plain password using bcrypt (12 rounds)
 */
export async function hashPassword(plainText: string): Promise<string> {
  return await bcrypt.hash(plainText, 12);
}

/**
 * Compare plain password against bcrypt hash
 */
export async function verifyPassword(plainText: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(plainText, hash);
}

/**
 * Issue a signed HMAC SHA-256 session token for the reviewer (7 days validity)
 */
export function signReviewerToken(payload: Omit<ReviewerPayload, 'exp'>, expiresInDays = 7): string {
  const exp = Math.floor(Date.now() / 1000) + (expiresInDays * 24 * 60 * 60);
  const fullPayload: ReviewerPayload = { ...payload, exp };
  const encodedPayload = Buffer.from(JSON.stringify(fullPayload)).toString('base64url');
  
  const hmac = crypto.createHmac('sha256', SESSION_SECRET);
  hmac.update(encodedPayload);
  const signature = hmac.digest('base64url');

  return `META_REVIEWER_SESSION:${encodedPayload}.${signature}`;
}

/**
 * Verify and unpack signed reviewer session token
 */
export function verifyReviewerToken(token: string): { valid: boolean; payload?: ReviewerPayload; error?: string } {
  if (!token || !token.startsWith('META_REVIEWER_SESSION:')) {
    return { valid: false, error: 'Invalid token prefix' };
  }

  try {
    const raw = token.replace('META_REVIEWER_SESSION:', '');
    const parts = raw.split('.');
    if (parts.length !== 2) {
      return { valid: false, error: 'Malformed token structure' };
    }

    const [encodedPayload, signature] = parts;
    const hmac = crypto.createHmac('sha256', SESSION_SECRET);
    hmac.update(encodedPayload);
    const expectedSig = hmac.digest('base64url');

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig))) {
      return { valid: false, error: 'Invalid token signature' };
    }

    const payloadJson = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    const payload = JSON.parse(payloadJson) as ReviewerPayload;

    if (payload.exp && Math.floor(Date.now() / 1000) > payload.exp) {
      return { valid: false, error: 'Token expired' };
    }

    return { valid: true, payload };
  } catch (err: any) {
    return { valid: false, error: err.message || 'Token verification failed' };
  }
}

/**
 * Ensure PostgreSQL reviewer_credentials table exists and seed initial reviewer account safely
 */
export async function ensureReviewerCredentialsTable(): Promise<void> {
  if (!db) return;
  try {
    // 1. Create table if it doesn't exist
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS reviewer_credentials (
        id SERIAL PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        display_name TEXT NOT NULL DEFAULT 'Meta App Review Tester',
        role TEXT NOT NULL DEFAULT 'social_media_reviewer',
        is_active BOOLEAN NOT NULL DEFAULT TRUE,
        last_login_at TIMESTAMP,
        created_at TIMESTAMP NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP NOT NULL DEFAULT NOW()
      );
    `);

    // 2. Check if reviewer account exists in reviewer_credentials
    const existing = await db
      .select()
      .from(reviewerCredentials)
      .where(eq(reviewerCredentials.email, REVIEWER_EMAIL))
      .limit(1);

    if (existing.length === 0) {
      const initialHash = await hashPassword(DEFAULT_INITIAL_PASSWORD);
      await db.insert(reviewerCredentials).values({
        email: REVIEWER_EMAIL,
        passwordHash: initialHash,
        displayName: 'Meta App Review Tester',
        role: 'social_media_reviewer',
        isActive: true,
      });
      console.log(`[REVIEWER_AUTH] Initialized dedicated non-Firebase reviewer account in PostgreSQL for ${REVIEWER_EMAIL}`);
    }

    // 3. Ensure corresponding users table record exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, REVIEWER_EMAIL))
      .limit(1);

    if (existingUser.length === 0) {
      await db.insert(users).values({
        uid: 'meta-reviewer-uid',
        email: REVIEWER_EMAIL,
        name: 'Meta App Review Tester',
        role: 'social_media_reviewer',
      });
    } else if (existingUser[0].role !== 'social_media_reviewer') {
      await db
        .update(users)
        .set({ role: 'social_media_reviewer' })
        .where(eq(users.id, existingUser[0].id));
    }
  } catch (err: any) {
    console.error('[REVIEWER_AUTH_INIT_ERROR]', err);
  }
}
