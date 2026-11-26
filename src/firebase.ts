import { initializeApp } from 'firebase/app';
import {
  getAuth,
  getRedirectResult,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
  doc,
  getDocFromServer,
  Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);

function createFirestoreClient(): Firestore {
  try {
    return initializeFirestore(
      app,
      {
        localCache: persistentLocalCache({
          tabManager: persistentMultipleTabManager(),
        }),
      },
      firebaseConfig.firestoreDatabaseId
    );
  } catch {
    return getFirestore(app, firebaseConfig.firestoreDatabaseId);
  }
}

export const db = createFirestoreClient();
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
export const FIREBASE_APP_ID = firebaseConfig.appId;
export const FIREBASE_DATABASE_ID = firebaseConfig.firestoreDatabaseId;
export const FIREBASE_DATABASE_URL = firebaseConfig.databaseURL;
export const FIREBASE_CONSOLE_URL = `https://console.firebase.google.com/project/${firebaseConfig.projectId}/firestore/databases/${firebaseConfig.firestoreDatabaseId}/data`;
export const FIREBASE_UPGRADE_URL = `${FIREBASE_CONSOLE_URL}?openUpgradeDialog=true`;

export type ServerConnectivityState = 'online' | 'offline' | 'error';

export async function checkFirestoreServerConnectivity(): Promise<ServerConnectivityState> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return 'offline';
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return 'online';
  } catch (error) {
    const msg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
    const code = (error as { code?: string })?.code?.toLowerCase() || '';
    // Default-deny rule rejects /test/connection with permission-denied, which proves live server contact!
    if (code === 'permission-denied' || msg.includes('missing or insufficient permissions')) {
      return 'online';
    }
    if (msg.includes('the client is offline') || code === 'unavailable') {
      console.error('Please check your Firebase configuration.');
      return 'offline';
    }
    return 'error';
  }
}

void checkFirestoreServerConnectivity();

export async function resolveRedirectAuth(): Promise<User | null> {
  try {
    const result = await getRedirectResult(auth);
    return result?.user ?? null;
  } catch {
    return null;
  }
}

export async function signInWithGoogle(): Promise<User | null> {
  const isStandalonePWA =
    typeof window !== 'undefined' &&
    (window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true);
  const isInIframe = typeof window !== 'undefined' && window.self !== window.top;

  try {
    const result = await signInWithPopup(auth, googleProvider);
    return result.user;
  } catch (error) {
    const code = (error as { code?: string })?.code;
    const shouldFallbackToRedirect =
      !isInIframe &&
      (isStandalonePWA ||
        code === 'auth/popup-blocked' ||
        code === 'auth/operation-not-supported-in-this-environment');

    if (shouldFallbackToRedirect) {
      await signInWithRedirect(auth, googleProvider);
      return null;
    }
    throw error;
  }
}

export async function signOutFirebase(): Promise<void> {
  await signOut(auth);
}
