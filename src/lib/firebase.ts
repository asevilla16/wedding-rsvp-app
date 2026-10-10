import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInAnonymously,
  signOut,
  onAuthStateChanged,
  User
} from 'firebase/auth';
import {
  initializeFirestore,
  getFirestore,
  doc,
  getDoc,
  setDoc,
  getDocs,
  collection,
  query,
  updateDoc,
  deleteDoc,
  orderBy,
  onSnapshot,
  limit
} from 'firebase/firestore';
import { WeddingDetails, GuestEntry, GuestbookWish, InitialDataStore } from '../types';
import { defaultWeddingData, defaultBudgetItems } from '../data/defaultData';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase with the provisioned Applet configuration
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Uses the default Firestore database for this project.
// `ignoreUndefinedProperties` drops `undefined` fields from writes instead of
// throwing — otherwise creating a NEW guest (whose optional fields like
// primaryMealOptionId / plusOne / songRequest are undefined) fails the write and
// silently falls back to the local store.
export const db = (() => {
  try {
    return initializeFirestore(app, { ignoreUndefinedProperties: true });
  } catch {
    // Firestore already initialized for this app (e.g. HMR) — reuse it.
    return getFirestore(app);
  }
})();

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();

export async function loginWithGoogle(): Promise<User> {
  const result = await signInWithPopup(auth, googleProvider);
  return result.user;
}

export async function logoutUser(): Promise<void> {
  // End a PIN session, if this browser has one, before signing out.
  const user = auth.currentUser;
  if (user?.isAnonymous) {
    await deleteDoc(doc(db, 'adminSessions', user.uid)).catch(() => {});
  }
  await signOut(auth);
}

// PIN login. The PIN is never sent to or stored in the browser: we sign in
// anonymously and record the typed PIN in adminSessions/{uid}. Firestore's
// rules only accept that write if it matches the PIN in the unreadable
// private/admin document, so a successful write IS the PIN check.
export async function unlockWithPin(pin: string): Promise<boolean> {
  const user = auth.currentUser?.isAnonymous ? auth.currentUser : (await signInAnonymously(auth)).user;
  try {
    await setDoc(doc(db, 'adminSessions', user.uid), { pin, createdAt: new Date().toISOString() });
    return true;
  } catch (err: any) {
    if (err?.code === 'permission-denied') return false;
    throw err;
  }
}

// True when this browser holds a PIN session that is still valid (the PIN
// hasn't been changed since). Used to restore the panel after a reload.
export async function hasValidPinSession(): Promise<boolean> {
  const user = auth.currentUser;
  if (!user?.isAnonymous) return false;
  try {
    // The session record only exists if the right PIN was entered at some
    // point (the rules reject anything else). Checking it explicitly also
    // means an anonymous sign-in on its own never unlocks the panel, whatever
    // rules happen to be deployed.
    const session = await getDoc(doc(db, 'adminSessions', user.uid));
    if (!session.exists()) return false;
    // Listing guests is admin-only, so this fails if the PIN has since changed.
    await getDocs(query(collection(db, 'guests'), limit(1)));
    return true;
  } catch {
    return false;
  }
}

// Changes the admin PIN. Existing PIN sessions stop working, so the current
// one (if the panel was unlocked by PIN) is refreshed with the new PIN.
export async function changeAdminPin(newPin: string): Promise<void> {
  await setDoc(doc(db, 'private', 'admin'), { pin: newPin });
  const user = auth.currentUser;
  if (user?.isAnonymous) {
    await setDoc(doc(db, 'adminSessions', user.uid), { pin: newPin, createdAt: new Date().toISOString() });
  }
}

// Timeout helper to prevent infinite pending promises if offline/unreachable
export function withTimeout<T>(promise: Promise<T>, timeoutMs = 2500): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Firebase operation timed out')), timeoutMs)
    ),
  ]);
}

// Initialize database with default data if empty. Only called from the admin
// panel once unlocked: the security rules reject these writes for visitors.
// Guests are never seeded from here (see scripts/seed-guests.ts).
export async function seedFirebaseDataIfEmpty() {
  try {
    const weddingRef = doc(db, 'wedding', 'details');
    const snap = await withTimeout(getDoc(weddingRef), 2000);
    if (!snap.exists()) {
      // Seed wedding details
      await withTimeout(setDoc(weddingRef, defaultWeddingData.wedding), 2000);

      // Seed initial wishes
      for (const wish of defaultWeddingData.wishes) {
        await withTimeout(setDoc(doc(db, 'wishes', wish.id), wish), 1000).catch(() => {});
      }
      console.log('Firebase seeded with initial wedding data successfully');
    }

    // Seed the budget collection independently — existing deployments were
    // provisioned before budget items lived in Firestore. Prefer a pre-existing
    // localStorage cache so a couple that already tracked expenses locally keeps
    // their data; otherwise fall back to the bundled defaults.
    const budgetSnap = await withTimeout(getDocs(collection(db, 'budget')), 2000);
    if (budgetSnap.empty) {
      let seed = defaultBudgetItems;
      try {
        const cached = localStorage.getItem('wedding_budget_items');
        const parsed = cached ? JSON.parse(cached) : null;
        if (Array.isArray(parsed) && parsed.length > 0) seed = parsed;
      } catch {
        // ignore malformed cache, use defaults
      }
      for (const item of seed) {
        if (item && item.id) {
          await withTimeout(setDoc(doc(db, 'budget', item.id), item), 1000).catch(() => {});
        }
      }
      console.log('Firebase seeded with initial budget items successfully');
    }
  } catch (err) {
    console.warn('Firebase seed check warning (offline or fast fallback):', err);
  }
}
