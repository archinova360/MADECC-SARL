import { getAuthToken } from './firebase.ts';

// Helper to retrieve correct headers for database authentication
async function getAuthHeaders() {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  const token = await getAuthToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

const memoryCache: Record<string, any> = {};

/**
 * Fetches all persistent states synced in the Neon PostgreSQL database for the current logged-in user.
 */
export async function fetchUserSyncData(): Promise<Record<string, any>> {
  try {
    const headers = await getAuthHeaders();
    const res = await fetch('/api/user-sync', {
      headers,
      credentials: 'include'
    });
    if (res.ok) {
      const { data } = await res.json();
      const parsed: Record<string, any> = {};
      for (const key of Object.keys(data)) {
        try {
          parsed[key] = JSON.parse(data[key]);
        } catch (e) {
          parsed[key] = data[key];
        }
      }
      return parsed;
    }
  } catch (err) {
    console.warn('Non-fatal: Error fetching user sync data from database (using offline/local state):', err);
  }
  return memoryCache;
}

/**
 * Saves a persistent state key-value pair to the live Neon database, falling back to local cache if logged out.
 */
export async function saveUserSyncData(key: string, value: any): Promise<boolean> {
  try {
    memoryCache[key] = value;
    const headers = await getAuthHeaders();
    const res = await fetch('/api/user-sync', {
      method: 'POST',
      credentials: 'include',
      headers,
      body: JSON.stringify({ key, value })
    });
    return res.ok;
  } catch (err) {
    console.warn(`Non-fatal: Error saving user sync data for key ${key}:`, err);
    return false;
  }
}
