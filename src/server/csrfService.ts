import crypto from 'crypto';

const CSRF_SECRET = process.env.CSRF_SECRET || crypto.randomBytes(32).toString('hex');

export function generateCsrfToken(): string {
  const timestamp = Date.now().toString();
  const randomSalt = crypto.randomBytes(16).toString('hex');
  const payload = `${timestamp}.${randomSalt}`;
  const hmac = crypto.createHmac('sha256', CSRF_SECRET);
  hmac.update(payload);
  const signature = hmac.digest('hex');
  return `${payload}.${signature}`;
}

export function validateCsrfToken(token: string): boolean {
  if (!token) return false;
  const parts = token.split('.');
  if (parts.length !== 3) return false;
  
  const [timestampStr, randomSalt, signature] = parts;
  const timestamp = parseInt(timestampStr, 10);
  if (isNaN(timestamp)) return false;
  
  // Max token age: 24 hours
  const age = Date.now() - timestamp;
  const MAX_AGE = 24 * 60 * 60 * 1000;
  if (age < 0 || age > MAX_AGE) return false;
  
  const payload = `${timestampStr}.${randomSalt}`;
  const hmac = crypto.createHmac('sha256', CSRF_SECRET);
  hmac.update(payload);
  const expectedSignature = hmac.digest('hex');
  
  try {
    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
  } catch (err) {
    return false;
  }
}
