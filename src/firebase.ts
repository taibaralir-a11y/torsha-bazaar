import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged, 
  signOut, 
  User 
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer, setDoc, updateDoc, SetOptions, DocumentReference } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

const LOGOUT_FLAG_KEY = 'tb_explicit_logout';

/**
 * Ensures a valid cryptographic Firebase Auth session is active.
 * Waits for Firebase Auth persistence restoration first so existing UIDs
 * are reused across sessions without creating duplicate anonymous accounts.
 * Operates at ₹0 on Firebase Spark Plan.
 */
export async function ensureAuthSession(forceCreate = false): Promise<User | null> {
  try {
    await auth.authStateReady();
  } catch (err) {
    console.warn('authStateReady notice:', err);
  }

  if (auth.currentUser) {
    try { sessionStorage.removeItem(LOGOUT_FLAG_KEY); } catch {}
    return auth.currentUser;
  }

  // If user explicitly logged out and hasn't triggered a new sign-in/register, keep signed out
  let wasExplicitLogout = false;
  try {
    wasExplicitLogout = sessionStorage.getItem(LOGOUT_FLAG_KEY) === 'true';
  } catch {}

  if (wasExplicitLogout && !forceCreate) {
    return null;
  }

  try {
    const cred = await signInAnonymously(auth);
    try { sessionStorage.removeItem(LOGOUT_FLAG_KEY); } catch {}
    return cred.user;
  } catch (err: any) {
    console.warn('Firebase Anonymous Auth notice:', err?.code || err?.message || err);
    return auth.currentUser;
  }
}

export function getCurrentAuthUid(): string | null {
  return auth.currentUser?.uid || null;
}

export function getCurrentUserEmail(): string | null {
  return auth.currentUser?.email || null;
}

export async function handleAuthSignOut(): Promise<void> {
  try {
    try { sessionStorage.setItem(LOGOUT_FLAG_KEY, 'true'); } catch {}
    await signOut(auth);
  } catch (err) {
    console.warn('Sign out notice:', err);
  }
}

export { onAuthStateChanged, signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup };

// Automatically bootstrap/restore session on load
ensureAuthSession(false).catch(() => {});

/**
 * Strips undefined properties recursively so Firestore setDoc never throws:
 * "Unsupported field value: undefined"
 */
export function cleanForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return null as any;
  }
  if (Array.isArray(data)) {
    return data.map(item => cleanForFirestore(item)) as any;
  }
  if (typeof data === 'object' && !(data instanceof Date)) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(data as Record<string, any>)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned;
  }
  return data;
}

/**
 * Safe wrapper for Firestore setDoc that automatically cleans out undefined fields
 */
export function safeSetDoc<T extends object>(docRef: DocumentReference, data: T, options?: SetOptions) {
  const cleaned = cleanForFirestore(data);
  return options ? setDoc(docRef, cleaned, options) : setDoc(docRef, cleaned);
}

/**
 * Safe wrapper for Firestore updateDoc that cleans out undefined fields so partial
 * updates strictly exercise `allow update` rules (never `allow create` via setDoc merge).
 */
export function safeUpdateDoc<T extends object>(docRef: DocumentReference, data: T) {
  const cleaned = cleanForFirestore(data) as Record<string, any>;
  if (!cleaned || Object.keys(cleaned).length === 0) {
    return Promise.resolve();
  }
  return updateDoc(docRef, cleaned);
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Startup connection verification
async function testConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline or connecting: ', error.message);
    }
  }
}

testConnection().catch(() => {});
