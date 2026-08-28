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
import { defaultWeddingData } from '../data/defaultData';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase with the provisioned Applet configuration
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

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
  } catch (err) {
    console.warn('Firebase seed check warning (offline or fast fallback):', err);
  }
}
