import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
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
  onSnapshot
} from 'firebase/firestore';
import { WeddingDetails, GuestEntry, GuestbookWish, InitialDataStore } from '../types';
import { defaultWeddingData, defaultBudgetItems, GUEST_SEED_VERSION } from '../data/defaultData';
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
  await signOut(auth);
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

// Initialize database with default data if empty
export async function seedFirebaseDataIfEmpty() {
  try {
    const weddingRef = doc(db, 'wedding', 'details');
    const snap = await withTimeout(getDoc(weddingRef), 2000);
    if (!snap.exists()) {
      // Seed wedding details
      await withTimeout(setDoc(weddingRef, defaultWeddingData.wedding), 2000);

      // Seed initial guests
      for (const guest of defaultWeddingData.guests) {
        await withTimeout(setDoc(doc(db, 'guests', guest.id), guest), 1000).catch(() => {});
      }

      // Seed initial wishes
      for (const wish of defaultWeddingData.wishes) {
        await withTimeout(setDoc(doc(db, 'wishes', wish.id), wish), 1000).catch(() => {});
      }
      console.log('Firebase seeded with initial wedding data successfully');
    }

    // Seed the guest list independently, gated by a version marker so that
    // databases provisioned before the real list was added still receive it.
    // Only missing ids are written: existing RSVPs are never overwritten, and
    // guests deleted in the admin panel are not re-created on later loads.
    const guestSeedRef = doc(db, 'wedding', 'guestSeed');
    const guestSeedSnap = await withTimeout(getDoc(guestSeedRef), 2000);
    const seededVersion = guestSeedSnap.exists() ? guestSeedSnap.data().version ?? 0 : 0;
    if (seededVersion < GUEST_SEED_VERSION) {
      const guestsSnap = await withTimeout(getDocs(collection(db, 'guests')), 2000);
      const existingIds = new Set(guestsSnap.docs.map((d) => d.id));
      for (const guest of defaultWeddingData.guests) {
        if (!existingIds.has(guest.id)) {
          await withTimeout(setDoc(doc(db, 'guests', guest.id), guest), 1000).catch(() => {});
        }
      }
      await withTimeout(setDoc(guestSeedRef, { version: GUEST_SEED_VERSION }), 1000);
      console.log('Firebase seeded with guest list successfully');
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
