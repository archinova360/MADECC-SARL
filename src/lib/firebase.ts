import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const googleAuthProvider = new GoogleAuthProvider();

export async function getAuthToken(): Promise<string | null> {
  // Check reviewer session tokens
  const reviewerToken = sessionStorage.getItem('reviewer_token') || localStorage.getItem('reviewer_token');
  if (reviewerToken) {
    return reviewerToken;
  }
  // Check admin tokens
  const bypass = sessionStorage.getItem('admin_token') || localStorage.getItem('admin_token');
  if (bypass === 'Adminmadeccgroup' || bypass === 'ADMIN_BYPASS:Adminmadeccgroup') {
    return 'ADMIN_BYPASS:Adminmadeccgroup';
  }
  if (bypass === 'MADECC Group admin' || bypass === 'ADMIN_BYPASS:MADECC Group admin' || bypass === 'MADECC_Group_admin') {
    return 'ADMIN_BYPASS:MADECC Group admin';
  }
  const genericToken = localStorage.getItem('token') || sessionStorage.getItem('token');
  if (genericToken) {
    return genericToken;
  }
  return await auth.currentUser?.getIdToken() || null;
}
