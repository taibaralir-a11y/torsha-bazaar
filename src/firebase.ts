import { initializeApp, getApps } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  deleteUser,
  sendPasswordResetEmail,
  setPersistence,
  inMemoryPersistence,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged, 
  signOut, 
  User 
} from 'firebase/auth';
import { getFirestore, doc, getDoc, getDocFromServer, setDoc, updateDoc, SetOptions, DocumentReference } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { normalizePhoneE164 } from './utils/phone';

export const app = initializeApp(firebaseConfig);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);
export const auth = getAuth(app);

// Secondary isolated Firebase Auth instance for Super Admin partner account provisioning
// Uses inMemoryPersistence and immediately signs out so the Super Admin session is never disrupted.
const PROVISION_APP_NAME = 'adminAccountProvisioner';
const provisionApp =
  getApps().find((a) => a.name === PROVISION_APP_NAME) ||
  initializeApp(firebaseConfig, PROVISION_APP_NAME);
const provisionAuth = getAuth(provisionApp);

export function buildSyntheticPartnerEmail(phone: string): string {
  const normalized = normalizePhoneE164(phone) || phone.trim();
  const digits = normalized.replace(/\D/g, '');
  return `partner.${digits}@login.torshabazaar.in`;
}

export async function hashPhoneForLookup(phone: string): Promise<string> {
  const canonical = normalizePhoneE164(phone) || phone.replace(/\D/g, '');
  const encoder = new TextEncoder();
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(canonical));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export async function createPartnerAuthAccount(
  email: string,
  password: string,
  options?: { sendResetEmail?: boolean }
): Promise<{ uid: string; email: string; resetEmailSent: boolean }> {
  const cleanEmail = email.trim().toLowerCase();
  await setPersistence(provisionAuth, inMemoryPersistence);
  let resetEmailSent = false;
  try {
    const cred = await createUserWithEmailAndPassword(provisionAuth, cleanEmail, password);
    if (options?.sendResetEmail && !cleanEmail.endsWith('@login.torshabazaar.in')) {
      try {
        await sendPasswordResetEmail(provisionAuth, cleanEmail);
        resetEmailSent = true;
      } catch (resetErr) {
        console.warn('Password reset email dispatch notice:', (resetErr as Error)?.message);
      }
    }
    return {
      uid: cred.user.uid,
      email: cred.user.email || cleanEmail,
      resetEmailSent
    };
  } finally {
    await signOut(provisionAuth).catch(() => {});
  }
}

/**
 * Provisions a new Partner Firebase Auth user and immediately executes the
 * accompanying Firestore write callback while the provisioned user is still
 * signed in on the isolated secondary Auth instance. Best-effort client
 * rollback attempts to delete the newly created Auth user if Firestore fails
 * (cannot protect against abrupt browser crashes/tab closes without a trusted backend).
 */
export async function provisionPartnerAuthWithFirestore<T>(
  email: string,
  password: string,
  options: { sendResetEmail?: boolean } | undefined,
  onProvisioned: (created: { uid: string; email: string }) => Promise<T>
): Promise<{ result: T; resetEmailSent: boolean }> {
  const cleanEmail = email.trim().toLowerCase();
  await setPersistence(provisionAuth, inMemoryPersistence);
  const cred = await createUserWithEmailAndPassword(provisionAuth, cleanEmail, password);
  let resetEmailSent = false;
  try {
    const result = await onProvisioned({
      uid: cred.user.uid,
      email: cred.user.email || cleanEmail
    });
    if (options?.sendResetEmail && !cleanEmail.endsWith('@login.torshabazaar.in')) {
      try {
        await sendPasswordResetEmail(provisionAuth, cleanEmail);
        resetEmailSent = true;
      } catch (resetErr) {
        console.warn('Password reset email dispatch notice:', (resetErr as Error)?.message);
      }
    }
    return { result, resetEmailSent };
  } catch (err) {
    let rollbackFailed = false;
    try {
      await deleteUser(cred.user);
    } catch (delErr) {
      rollbackFailed = true;
      console.warn('Rollback deleteUser failed:', (delErr as Error)?.message);
    }
    if (rollbackFailed) {
      const baseMsg = err instanceof Error ? err.message : String(err);
      throw new Error(
        `${baseMsg} (Warning: Automatic Auth rollback for ${cleanEmail} [uid: ${cred.user.uid}] could not complete; remove or link the Auth user manually in Firebase Auth console.)`
      );
    }
    throw err;
  } finally {
    await signOut(provisionAuth).catch(() => {});
  }
}

export async function resolvePartnerLoginEmail(identifier: string): Promise<string> {
  const trimmed = identifier.trim();
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase();
  }
  const normalizedPhone = normalizePhoneE164(trimmed);
  if (!normalizedPhone) {
    throw new Error('Please enter a valid email address or 10-digit mobile number.');
  }
  try {
    const phoneHash = await hashPhoneForLookup(normalizedPhone);
    const snap = await getDoc(doc(db, 'phoneAuthLookup', phoneHash));
    if (snap.exists()) {
      const data = snap.data() as { loginEmail?: string };
      if (data?.loginEmail) {
        return data.loginEmail.toLowerCase();
      }
    }
  } catch (err) {
    console.warn('Phone auth lookup notice:', (err as Error)?.message);
  }
  return buildSyntheticPartnerEmail(normalizedPhone);
}

const LOGOUT_FLAG_KEY = 'tb_explicit_logout';
let inFlightAuthPromise: Promise<User | null> | null = null;
let lastAuthError: { code?: string; message?: string } | null = null;

export function getLastAuthError() {
  return lastAuthError;
}

/**
 * Ensures a valid cryptographic Firebase Auth session is active for guest/partner convenience.
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
    lastAuthError = null;
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

  if (inFlightAuthPromise) {
    return inFlightAuthPromise;
  }

  inFlightAuthPromise = (async () => {
    try {
      const cred = await signInAnonymously(auth);
      lastAuthError = null;
      try { sessionStorage.removeItem(LOGOUT_FLAG_KEY); } catch {}
      return cred.user;
    } catch (err: any) {
      lastAuthError = {
        code: err?.code,
        message: err?.message
      };
      console.warn('Firebase Anonymous Auth notice:', err?.code || err?.message || err);
      return auth.currentUser;
    } finally {
      inFlightAuthPromise = null;
    }
  })();

  return inFlightAuthPromise;
}

export function getCurrentAuthUid(): string | null {
  return auth.currentUser?.uid || null;
}

export function getCurrentUserEmail(): string | null {
  return auth.currentUser?.email || null;
}

export async function handleAuthSignOut(): Promise<void> {
  try {
    lastAuthError = null;
    try { sessionStorage.setItem(LOGOUT_FLAG_KEY, 'true'); } catch {}
    await signOut(auth);
  } catch (err) {
    console.warn('Sign out notice:', err);
  }
}

export { onAuthStateChanged, signInWithEmailAndPassword, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup };

// Automatically bootstrap/restore session on load
ensureAuthSession(false).catch(() => {});

import { cleanForFirestore } from './utils/firestoreClean';
export { cleanForFirestore };

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
