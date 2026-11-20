import type { Auth, GoogleAuthProvider } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

let cachedAuth: Auth | null = null;
let cachedGoogleProvider: GoogleAuthProvider | null = null;

export async function getFirebaseAuth(): Promise<Auth> {
  if (cachedAuth) return cachedAuth;
  const [{ initializeApp, getApps }, { getAuth }] = await Promise.all([
    import('firebase/app'),
    import('firebase/auth'),
  ]);
  const app = getApps().length > 0 ? getApps()[0] : initializeApp(firebaseConfig);
  cachedAuth = getAuth(app);
  return cachedAuth;
}

export async function getGoogleAuthProvider(): Promise<GoogleAuthProvider> {
  if (cachedGoogleProvider) return cachedGoogleProvider;
  const { GoogleAuthProvider } = await import('firebase/auth');
  cachedGoogleProvider = new GoogleAuthProvider();
  return cachedGoogleProvider;
}

function hasStoredFirebaseUserHint(): boolean {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return false;
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith('firebase:authUser:')) {
        return true;
      }
    }
  } catch (_) {}
  return false;
}

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
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ email: userEmail, uid: userUid }),
    }).catch(() => {});
  } catch {
    // Non-blocking
  }

  // 2. Firebase sign out (only load Firebase SDK if previously initialized or a Firebase session hint exists)
  try {
    if (cachedAuth || hasStoredFirebaseUserHint()) {
      const [firebaseAuth, { signOut }] = await Promise.all([
        getFirebaseAuth(),
        import('firebase/auth'),
      ]);
      await signOut(firebaseAuth);
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
    const stored =
      localStorage.getItem('madecc_auth_token') ||
      sessionStorage.getItem('madecc_auth_token') ||
      localStorage.getItem('admin_token') ||
      sessionStorage.getItem('admin_token') ||
      localStorage.getItem('token');
    if (stored && stored !== 'null' && stored !== 'undefined') {
      return stored;
    }
  } catch (_) {}

  try {
    if (cachedAuth?.currentUser) {
      const token = await cachedAuth.currentUser.getIdToken();
      if (token) return token;
    } else if (hasStoredFirebaseUserHint()) {
      const firebaseAuth = await getFirebaseAuth();
      if (firebaseAuth.currentUser) {
        const token = await firebaseAuth.currentUser.getIdToken();
        if (token) return token;
      }
    }
  } catch (err) {
    console.warn('Could not retrieve Firebase getIdToken:', err);
  }

  try {
    if (
      localStorage.getItem('madecc_is_admin_user') === 'true' ||
      sessionStorage.getItem('madecc_is_admin_user') === 'true'
    ) {
      return 'Adminmadeccgroup';
    }
  } catch (_) {}

  return null;
}
