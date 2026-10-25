import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
export { signOut };

export function setStoredAuthToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem('madecc_auth_token', token);
      sessionStorage.setItem('madecc_auth_token', token);
      if (token.startsWith('MADECC_AUTH_')) {
        localStorage.setItem('madecc_is_admin_user', 'true');
        sessionStorage.setItem('madecc_is_admin_user', 'true');
      }
    } else {
      localStorage.removeItem('madecc_auth_token');
      sessionStorage.removeItem('madecc_auth_token');
      localStorage.removeItem('madecc_is_admin_user');
      sessionStorage.removeItem('madecc_is_admin_user');
    }
  } catch (_) {}
}

export async function logoutUser(userEmail?: string, userUid?: string): Promise<void> {
  // 1. Notify backend for audit tracking & clear server-side session cookies
  try {
    const token = await getAuthToken();
    await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      },
      body: JSON.stringify({ email: userEmail, uid: userUid })
    }).catch(() => {});
  } catch {
    // Non-blocking
  }

  // 2. Firebase sign out
  try {
    if (auth) {
      await signOut(auth);
    }
  } catch (err) {
    console.warn('Firebase signOut notice:', err);
  }

  // 3. Clear any legacy residual keys to ensure complete cleanup
  try {
    setStoredAuthToken(null);
    sessionStorage.removeItem('admin_token');
    sessionStorage.removeItem('reviewer_token');
    sessionStorage.removeItem('token');
    localStorage.removeItem('admin_token');
    localStorage.removeItem('reviewer_token');
    localStorage.removeItem('token');
  } catch (_) {}
}

export async function getAuthToken(): Promise<string | null> {
  try {
    const stored = localStorage.getItem('madecc_auth_token') || sessionStorage.getItem('madecc_auth_token');
    if (stored) {
      return stored;
    }
  } catch (_) {}

  try {
    if (auth?.currentUser) {
      return (await auth.currentUser.getIdToken()) || null;
    }
  } catch (err) {
    console.warn('Could not retrieve Firebase getIdToken:', err);
  }
  return null;
}
