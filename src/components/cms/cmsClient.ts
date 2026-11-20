import { getAuthToken } from '../../lib/firebase.ts';
import { getCsrfHeaders } from '../../lib/csrf.ts';

export const CMS_TIMEZONES = [
  'Africa/Douala',
  'Africa/Accra',
  'Africa/Lagos',
  'UTC',
  'Europe/Paris',
  'Europe/London',
  'America/New_York',
];

export const PAGE_GROUP_OPTIONS = [
  { id: 'all', label: 'All Page Groups' },
  { id: 'home', label: 'Home' },
  { id: 'about', label: 'About Us' },
  { id: 'services', label: 'Services' },
  { id: 'projects', label: 'Projects' },
  { id: 'legal', label: 'Legal' },
  { id: 'developers', label: 'Developers / Paid API' },
  { id: 'sitemap', label: 'Sitemap' },
  { id: 'contact', label: 'Contact' },
  { id: 'custom', label: 'Other / Custom' },
];

export async function cmsFetch<T = any>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  const [token, csrf] = await Promise.all([
    getAuthToken().catch(() => null),
    isWrite ? getCsrfHeaders().catch(() => ({})) : Promise.resolve({}),
  ]);

  const headers: Record<string, string> = {
    ...(options.body && !(options.body instanceof FormData) ? { 'Content-Type': 'application/json' } : {}),
    ...csrf,
    ...((options.headers as Record<string, string>) || {}),
  };

  if (token && token !== 'null' && token !== 'undefined') {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    credentials: 'include',
    headers,
  });

  const text = await res.text();
  let data: any = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { error: text || `HTTP ${res.status}` };
  }

  if (!res.ok) {
    throw new Error(data?.error || data?.message || `Request failed (HTTP ${res.status})`);
  }

  return data as T;
}

export function getStatusBadgeClass(status?: string | null): string {
  switch ((status || '').toUpperCase()) {
    case 'PUBLISHED':
    case 'APPROVED_BY_ADMIN':
    case 'ACTIVE':
    case 'COMPLETED':
      return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30';
    case 'APPROVED':
    case 'SCHEDULED':
      return 'bg-sky-500/15 text-sky-300 border border-sky-500/30';
    case 'PENDING_REVIEW':
    case 'REVIEW_REQUIRED':
    case 'CHANGES_RECOMMENDED':
      return 'bg-amber-500/15 text-amber-300 border border-amber-500/30';
    case 'EMERGENCY':
    case 'FAIL':
    case 'FAILED':
      return 'bg-rose-500/15 text-rose-300 border border-rose-500/30';
    case 'ARCHIVED':
    case 'UNPUBLISHED':
    case 'CANCELLED':
    default:
      return 'bg-slate-800 text-slate-300 border border-slate-700';
  }
}

export function formatDateTimeInTz(iso?: string | null, tz = 'Africa/Douala'): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return String(iso);
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: tz,
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d) + ` (${tz})`;
  } catch {
    return d.toISOString();
  }
}
