const STATIC_ALLOWED_ORIGINS = new Set<string>([
  'https://madeccgroup.online',
  'https://www.madeccgroup.online',
  'https://app.madeccgroup.online',
  'https://madeccgroup.netlify.app',
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
]);

export function isOriginAllowed(origin?: string | null): boolean {
  if (!origin || typeof origin !== 'string') return false;
  const trimmed = origin.trim();
  if (!trimmed) return false;

  if (STATIC_ALLOWED_ORIGINS.has(trimmed)) return true;

  // Allow explicitly configured deployment URLs
  const envOrigins = [
    process.env.URL,
    process.env.DEPLOY_PRIME_URL,
    process.env.DEPLOY_URL,
    process.env.SITE_URL,
    process.env.ALLOWED_ORIGIN,
  ]
    .filter((v): v is string => typeof v === 'string' && v.trim().length > 0)
    .map((v) => v.trim().replace(/\/+$/, ''));

  if (envOrigins.includes(trimmed.replace(/\/+$/, ''))) {
    return true;
  }

  try {
    const parsed = new URL(trimmed);
    const host = parsed.hostname.toLowerCase();
    const isHttps = parsed.protocol === 'https:';
    const isLocalHttp = parsed.protocol === 'http:' && (host === 'localhost' || host === '127.0.0.1');

    if (isLocalHttp) return true;
    if (!isHttps) return false;

    if (
      host === 'madeccgroup.online' ||
      host.endsWith('.madeccgroup.online') ||
      host.endsWith('.madecccloud.com') ||
      host.endsWith('.netlify.app') ||
      host === 'aistudio.google.com' ||
      host.endsWith('.googleusercontent.com') ||
      host.endsWith('.ai.studio')
    ) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

export function buildCorsHeadersForOrigin(origin?: string | null): Record<string, string> {
  const headers: Record<string, string> = {
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token, X-API-Key, X-Admin-Key',
    'Access-Control-Max-Age': '86400',
  };

  if (origin && isOriginAllowed(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Credentials'] = 'true';
  }

  return headers;
}
