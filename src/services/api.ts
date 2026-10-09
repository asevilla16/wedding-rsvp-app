import { WeddingDetails, GuestEntry, GuestbookWish, GalleryPhoto, BudgetItem, InitialDataStore } from '../types';
import { defaultWeddingData, defaultBudgetItems } from '../data/defaultData';
import { db, withTimeout, seedFirebaseDataIfEmpty } from '../lib/firebase';
import {
  doc,
  getDoc,
  getDocs,
  collection,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';

// Run seed check asynchronously
seedFirebaseDataIfEmpty().catch(() => {});

// Data sources, in priority order:
//   1. Firebase Firestore (primary, persistent)
//   2. The Express API backed by data/store.json (server-side fallback)
//   3. defaultWeddingData bundled in the app (read-only, last resort)
// A deep clone keeps the bundled defaults from being mutated by callers.
function freshDefaults(): InitialDataStore {
  return JSON.parse(JSON.stringify(defaultWeddingData)) as InitialDataStore;
}

function normalizeVenue(wedding: WeddingDetails | undefined) {
  if (!wedding) return;
  if (!wedding.weddingLocation || wedding.weddingLocation.includes('México')) {
    wedding.weddingLocation = defaultWeddingData.wedding.weddingLocation;
  }
  if (!wedding.venueAddress || wedding.venueAddress.includes('México')) {
    wedding.venueAddress = defaultWeddingData.wedding.venueAddress;
  }
}

export async function fetchWeddingInfo(): Promise<{ wedding: WeddingDetails; wishes: GuestbookWish[] }> {
  try {
    const weddingRef = doc(db, 'wedding', 'details');
    const weddingSnap = await withTimeout(getDoc(weddingRef), 2000);

    const wishesRef = collection(db, 'wishes');
    const wishesSnap = await withTimeout(getDocs(query(wishesRef, orderBy('date', 'desc'))), 2000);

    if (weddingSnap.exists()) {
      const wedding = weddingSnap.data() as WeddingDetails;
      normalizeVenue(wedding);
      const wishes = wishesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as GuestbookWish));
      return { wedding, wishes };
    }
  } catch (err) {
    console.warn('Firestore fetch failed, falling back to server API:', err);
  }

  try {
    const res = await fetch('/api/wedding');
    if (res.ok) {
      const data = await res.json();
      normalizeVenue(data.wedding);
      return data;
    }
  } catch (err) {
    console.warn('Server API fetch failed, using bundled defaults', err);
  }

  const backup = freshDefaults();
  normalizeVenue(backup.wedding);
  return { wedding: backup.wedding, wishes: backup.wishes };
}

export async function searchGuests(queryStr: string): Promise<GuestEntry[]> {
  const q = queryStr.trim().toLowerCase();
  if (!q) return [];

  const matches = (guests: GuestEntry[]) =>
    guests.filter(
      (g) =>
        g.primaryName.toLowerCase().includes(q) ||
        g.code.toLowerCase() === q ||
        (g.email && g.email.toLowerCase().includes(q))
    );

  try {
    const guestsRef = collection(db, 'guests');
    const snap = await withTimeout(getDocs(guestsRef), 2000);
    if (!snap.empty) {
      return matches(snap.docs.map((d) => ({ id: d.id, ...d.data() } as GuestEntry)));
    }
  } catch (err) {
    console.warn('Firestore search failed, using fallback:', err);
  }

  try {
    const res = await fetch(`/api/guests/search?q=${encodeURIComponent(queryStr)}`);
    if (res.ok) {
      const data = await res.json();
      return data.guests;
    }
  } catch (err) {
    console.warn('API guest search failed, searching bundled defaults', err);
  }

  return matches(freshDefaults().guests);
}

export async function submitRsvp(rsvpData: {
  guestId: string;
  status: 'attending' | 'declined';
  primaryMealOptionId?: string;
  primaryDietaryRestrictions?: string;
  plusOne?: any;
  songRequest?: { title: string; artist: string };
  messageToCouple?: string;
  attendingEvents?: string[];
  email?: string;
  phone?: string;
}): Promise<{ success: boolean; guest: GuestEntry }> {
  try {
    const guestRef = doc(db, 'guests', rsvpData.guestId);
    const guestSnap = await withTimeout(getDoc(guestRef), 2000);

    if (guestSnap.exists()) {
      const existing = guestSnap.data() as GuestEntry;
      const updatedGuest: GuestEntry = {
        ...existing,
        status: rsvpData.status,
        primaryMealOptionId: rsvpData.primaryMealOptionId || existing.primaryMealOptionId,
        primaryDietaryRestrictions: rsvpData.primaryDietaryRestrictions ?? existing.primaryDietaryRestrictions,
        plusOne: rsvpData.plusOne !== undefined ? rsvpData.plusOne : existing.plusOne,
        songRequest: rsvpData.songRequest || existing.songRequest,
        messageToCouple: rsvpData.messageToCouple || existing.messageToCouple,
        attendingEvents: rsvpData.attendingEvents || existing.attendingEvents || [],
        email: rsvpData.email || existing.email,
        phone: rsvpData.phone || existing.phone,
        updatedAt: new Date().toISOString(),
      };

      await withTimeout(setDoc(guestRef, updatedGuest), 2000);

      if (rsvpData.messageToCouple && rsvpData.messageToCouple.trim().length > 3) {
        const wishId = `wsh_${Date.now()}`;
        const wish: GuestbookWish = {
          id: wishId,
          guestName: updatedGuest.primaryName,
          message: rsvpData.messageToCouple.trim(),
          date: new Date().toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' }),
          isPublic: true,
          likesCount: 1,
        };
        await withTimeout(setDoc(doc(db, 'wishes', wishId), wish), 1500).catch(() => {});
      }

      return { success: true, guest: updatedGuest };
    }
  } catch (err) {
    console.warn('Firestore RSVP submit failed, using fallback:', err);
  }

  try {
    const res = await fetch('/api/rsvp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(rsvpData),
    });
    if (res.ok) {
      return await res.json();
    }
  } catch (err) {
    console.warn('API submit RSVP failed', err);
  }

  // Last resort: compute an optimistic result from the bundled defaults.
  // This is not persisted anywhere.
  const guest = freshDefaults().guests.find((g) => g.id === rsvpData.guestId);
  if (guest) {
    return {
      success: true,
      guest: {
        ...guest,
        status: rsvpData.status,
        primaryMealOptionId: rsvpData.primaryMealOptionId,
        primaryDietaryRestrictions: rsvpData.primaryDietaryRestrictions,
        plusOne: rsvpData.plusOne,
        songRequest: rsvpData.songRequest,
        messageToCouple: rsvpData.messageToCouple,
        attendingEvents: rsvpData.attendingEvents || [],
        email: rsvpData.email || guest.email,
        phone: rsvpData.phone || guest.phone,
        updatedAt: new Date().toISOString(),
      },
    };
  }
  throw new Error('Invitado no encontrado');
}

export async function fetchAllGuests(pin: string): Promise<GuestEntry[]> {
  try {
    const guestsRef = collection(db, 'guests');
    const snap = await withTimeout(getDocs(guestsRef), 2000);
    if (!snap.empty) {
      return snap.docs.map((d) => ({ id: d.id, ...d.data() } as GuestEntry));
    }
  } catch (err) {
    console.warn('Firestore fetchAllGuests failed:', err);
  }

  try {
    const res = await fetch('/api/guests', {
      headers: { 'x-admin-pin': pin || '1234' },
    });
    if (res.ok) {
      const data = await res.json();
      return data.guests;
    }
  } catch (err: any) {
    console.warn('API fetch guests failed, using bundled defaults');
  }
  return freshDefaults().guests;
}

export async function saveGuest(pin: string, guest: Partial<GuestEntry>): Promise<GuestEntry[]> {
  const guestId = guest.id || `gst_${Date.now()}_${Math.floor(Math.random() * 1000)}`;

  try {
    const newGuestEntry: GuestEntry = {
      id: guestId,
      code: guest.code || `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      primaryName: guest.primaryName || 'Nuevo Invitado',
      email: guest.email || '',
      phone: guest.phone || '',
      partySizeAllowed: guest.partySizeAllowed || 1,
      status: guest.status || 'pending',
      tableNumber: guest.tableNumber || '',
      groupCategory: guest.groupCategory,
      primaryMealOptionId: guest.primaryMealOptionId,
      primaryDietaryRestrictions: guest.primaryDietaryRestrictions,
      plusOne: guest.plusOne,
      songRequest: guest.songRequest,
      messageToCouple: guest.messageToCouple,
      attendingEvents: guest.attendingEvents || [],
    };

    await withTimeout(setDoc(doc(db, 'guests', guestId), newGuestEntry, { merge: true }), 2000);
    return await fetchAllGuests(pin);
  } catch (err) {
    console.warn('Firestore saveGuest failed:', err);
  }

  try {
    const res = await fetch('/api/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: pin || '1234', guest }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.guests;
    }
  } catch (err) {
    console.warn('API save guest failed');
  }

  // Last resort: ephemeral list derived from bundled defaults (not persisted).
  const guests = freshDefaults().guests;
  if (guest.id) {
    const idx = guests.findIndex((g) => g.id === guest.id);
    if (idx !== -1) guests[idx] = { ...guests[idx], ...guest } as GuestEntry;
  } else {
    guests.unshift({
      id: guestId,
      code: guest.code || `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      primaryName: guest.primaryName || 'Nuevo Invitado',
      email: guest.email || '',
      partySizeAllowed: guest.partySizeAllowed || 1,
      status: guest.status || 'pending',
    });
  }
  return guests;
}

export async function deleteGuest(pin: string, guestId: string): Promise<GuestEntry[]> {
  try {
    await withTimeout(deleteDoc(doc(db, 'guests', guestId)), 2000);
    return await fetchAllGuests(pin);
  } catch (err) {
    console.warn('Firestore deleteGuest failed:', err);
  }

  try {
    const res = await fetch(`/api/guests/${guestId}`, {
      method: 'DELETE',
      headers: { 'x-admin-pin': pin || '1234' },
    });
    if (res.ok) {
      const data = await res.json();
      return data.guests;
    }
  } catch (err) {
    console.warn('API delete guest failed');
  }

  return freshDefaults().guests.filter((g) => g.id !== guestId);
}

export async function updateWeddingDetails(pin: string, wedding: Partial<WeddingDetails>): Promise<WeddingDetails> {
  const mergedWedding: WeddingDetails = { ...freshDefaults().wedding, ...wedding };

  // 1. Persist to Firestore with timeout
  try {
    const weddingRef = doc(db, 'wedding', 'details');
    await withTimeout(setDoc(weddingRef, mergedWedding, { merge: true }), 2500);
  } catch (err) {
    console.warn('Firestore updateWeddingDetails notice (handled gracefully):', err);
  }

  // 2. Persist to the server store
  try {
    const res = await fetch('/api/wedding', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin: pin || '1234', wedding: mergedWedding }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.wedding) return data.wedding;
    }
  } catch (err) {
    console.warn('Server API update wedding noticed, returning merged result');
  }

  return mergedWedding;
}

export async function postGuestbookWish(guestName: string, message: string): Promise<GuestbookWish[]> {
  const wishId = `wsh_${Date.now()}`;
  const newWish: GuestbookWish = {
    id: wishId,
    guestName: guestName.trim(),
    message: message.trim(),
    date: new Date().toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' }),
    isPublic: true,
    likesCount: 0,
  };

  try {
    await withTimeout(setDoc(doc(db, 'wishes', wishId), newWish), 2000);
    const wishesSnap = await withTimeout(getDocs(collection(db, 'wishes')), 2000);
    return wishesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as GuestbookWish));
  } catch (err) {
    console.warn('Firestore postGuestbookWish failed:', err);
  }

  try {
    const res = await fetch('/api/guestbook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guestName, message }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.wishes;
    }
  } catch (err) {
    console.warn('API guestbook wish failed');
  }

  return [newWish, ...freshDefaults().wishes];
}

export async function deleteWish(wishId: string): Promise<GuestbookWish[]> {
  try {
    await withTimeout(deleteDoc(doc(db, 'wishes', wishId)), 2000);
    const wishesSnap = await withTimeout(getDocs(query(collection(db, 'wishes'), orderBy('date', 'desc'))), 2000);
    return wishesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as GuestbookWish));
  } catch (err) {
    console.warn('Firestore deleteWish failed:', err);
  }

  return freshDefaults().wishes.filter((w) => w.id !== wishId);
}

export async function updateWish(wishId: string, updates: Partial<GuestbookWish>): Promise<GuestbookWish[]> {
  try {
    await withTimeout(updateDoc(doc(db, 'wishes', wishId), updates), 2000);
    const wishesSnap = await withTimeout(getDocs(query(collection(db, 'wishes'), orderBy('date', 'desc'))), 2000);
    return wishesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as GuestbookWish));
  } catch (err) {
    console.warn('Firestore updateWish failed:', err);
  }

  return freshDefaults().wishes.map((w) => (w.id === wishId ? { ...w, ...updates } : w));
}

export async function saveGalleryPhoto(photo: GalleryPhoto, currentWedding: WeddingDetails): Promise<WeddingDetails> {
  const currentPhotos = currentWedding.galleryPhotos || defaultWeddingData.wedding.galleryPhotos || [];
  let updatedPhotos: GalleryPhoto[];

  if (photo.id) {
    const idx = currentPhotos.findIndex((p) => p.id === photo.id);
    if (idx !== -1) {
      updatedPhotos = [...currentPhotos];
      updatedPhotos[idx] = { ...updatedPhotos[idx], ...photo };
    } else {
      updatedPhotos = [photo, ...currentPhotos];
    }
  } else {
    const newPhoto = { ...photo, id: `img_${Date.now()}` };
    updatedPhotos = [newPhoto, ...currentPhotos];
  }

  return await updateWeddingDetails(currentWedding.adminPin || '1234', {
    ...currentWedding,
    galleryPhotos: updatedPhotos,
  });
}

export async function deleteGalleryPhoto(photoId: string, currentWedding: WeddingDetails): Promise<WeddingDetails> {
  const currentPhotos = currentWedding.galleryPhotos || defaultWeddingData.wedding.galleryPhotos || [];
  const updatedPhotos = currentPhotos.filter((p) => p.id !== photoId);

  return await updateWeddingDetails(currentWedding.adminPin || '1234', {
    ...currentWedding,
    galleryPhotos: updatedPhotos,
  });
}

// ---------------------------------------------------------------------------
// Budget & Expenses
//
// Persisted in the Firestore `budget` collection (one document per line item).
// When Firestore is unreachable we fall back to a localStorage cache of the
// last known list, and finally to the bundled defaults.
// ---------------------------------------------------------------------------
const BUDGET_CACHE_KEY = 'wedding_budget_items';

function readBudgetCache(): BudgetItem[] | null {
  try {
    const cached = localStorage.getItem(BUDGET_CACHE_KEY);
    if (cached) return JSON.parse(cached) as BudgetItem[];
  } catch (err) {
    console.warn('Budget cache read failed:', err);
  }
  return null;
}

function writeBudgetCache(items: BudgetItem[]) {
  try {
    localStorage.setItem(BUDGET_CACHE_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('Budget cache write failed:', err);
  }
}

function sortBudgetItems(items: BudgetItem[]): BudgetItem[] {
  return [...items].sort((a, b) => (a.dueDate || '9999').localeCompare(b.dueDate || '9999'));
}

export async function fetchBudgetItems(): Promise<BudgetItem[]> {
  try {
    const snap = await withTimeout(getDocs(collection(db, 'budget')), 2000);
    if (!snap.empty) {
      const items = sortBudgetItems(snap.docs.map((d) => ({ id: d.id, ...d.data() } as BudgetItem)));
      writeBudgetCache(items);
      return items;
    }
  } catch (err) {
    console.warn('Firestore fetchBudgetItems failed, using local fallback:', err);
  }

  return readBudgetCache() ?? sortBudgetItems(JSON.parse(JSON.stringify(defaultBudgetItems)));
}

export async function saveBudgetItem(item: BudgetItem): Promise<BudgetItem[]> {
  try {
    await withTimeout(setDoc(doc(db, 'budget', item.id), item, { merge: true }), 2000);
    return await fetchBudgetItems();
  } catch (err) {
    console.warn('Firestore saveBudgetItem failed, updating local cache:', err);
  }

  const items = readBudgetCache() ?? (JSON.parse(JSON.stringify(defaultBudgetItems)) as BudgetItem[]);
  const idx = items.findIndex((i) => i.id === item.id);
  if (idx !== -1) items[idx] = item;
  else items.push(item);
  const sorted = sortBudgetItems(items);
  writeBudgetCache(sorted);
  return sorted;
}

export async function deleteBudgetItem(id: string): Promise<BudgetItem[]> {
  try {
    await withTimeout(deleteDoc(doc(db, 'budget', id)), 2000);
    return await fetchBudgetItems();
  } catch (err) {
    console.warn('Firestore deleteBudgetItem failed, updating local cache:', err);
  }

  const items = readBudgetCache() ?? (JSON.parse(JSON.stringify(defaultBudgetItems)) as BudgetItem[]);
  const sorted = sortBudgetItems(items.filter((i) => i.id !== id));
  writeBudgetCache(sorted);
  return sorted;
}

export async function askAiConcierge(prompt: string, type: 'qa' | 'toast_generator' = 'qa'): Promise<string> {
  try {
    const res = await fetch('/api/ai/concierge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, type }),
    });
    if (res.ok) {
      const data = await res.json();
      return data.response;
    }
  } catch (err) {
    console.warn('AI concierge call failed');
  }
  return "¡Nos llena de emoción celebrar este día tan especial contigo! Por favor revisa la sección de Preguntas Frecuentes para más detalles.";
}
