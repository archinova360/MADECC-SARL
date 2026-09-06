import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signOut } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();
export { signOut };

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
    if (auth?.currentUser) {
      return (await auth.currentUser.getIdToken()) || null;
    }
  } catch (err) {
    console.warn('Could not retrieve Firebase getIdToken:', err);
  }
  return null;
}
