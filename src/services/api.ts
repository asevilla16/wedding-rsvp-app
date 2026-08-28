import { WeddingDetails, GuestEntry, GuestbookWish, GalleryPhoto, InitialDataStore } from '../types';
import { defaultWeddingData } from '../data/defaultData';
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

const LOCAL_KEY = 'wedding_app_local_store_v2';

// Run seed check asynchronously
seedFirebaseDataIfEmpty().catch(() => {});

function getLocalBackup(): InitialDataStore {
  try {
    const saved = localStorage.getItem(LOCAL_KEY);
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.warn('LocalStorage access failed:', e);
  }
  return defaultWeddingData;
}

function setLocalBackup(store: InitialDataStore) {
  try {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(store));
  } catch (e) {
    console.warn('LocalStorage save failed:', e);
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
      if (!wedding.weddingLocation || wedding.weddingLocation.includes('México')) {
        wedding.weddingLocation = defaultWeddingData.wedding.weddingLocation;
      }
      if (!wedding.venueAddress || wedding.venueAddress.includes('México')) {
        wedding.venueAddress = defaultWeddingData.wedding.venueAddress;
      }
      const wishes = wishesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as GuestbookWish));
      return { wedding, wishes };
    }
  } catch (err) {
    console.warn('Firestore fetch failed, falling back to server/local API:', err);
  }

  try {
    const res = await fetch('/api/wedding');
    if (res.ok) {
      const data = await res.json();
      if (data.wedding) {
        if (!data.wedding.weddingLocation || data.wedding.weddingLocation.includes('México')) {
          data.wedding.weddingLocation = defaultWeddingData.wedding.weddingLocation;
        }
        if (!data.wedding.venueAddress || data.wedding.venueAddress.includes('México')) {
          data.wedding.venueAddress = defaultWeddingData.wedding.venueAddress;
        }
      }
      return data;
    }
  } catch (err) {
    console.warn('Server API fetch failed, using local backup', err);
  }

  const backup = getLocalBackup();
  if (backup.wedding) {
    if (!backup.wedding.weddingLocation || backup.wedding.weddingLocation.includes('México')) {
      backup.wedding.weddingLocation = defaultWeddingData.wedding.weddingLocation;
    }
    if (!backup.wedding.venueAddress || backup.wedding.venueAddress.includes('México')) {
      backup.wedding.venueAddress = defaultWeddingData.wedding.venueAddress;
    }
  }
  return { wedding: backup.wedding, wishes: backup.wishes };
}

export async function searchGuests(queryStr: string): Promise<GuestEntry[]> {
  const q = queryStr.trim().toLowerCase();
  if (!q) return [];

  try {
    const guestsRef = collection(db, 'guests');
    const snap = await withTimeout(getDocs(guestsRef), 2000);
    if (!snap.empty) {
      const allGuests = snap.docs.map((d) => ({ id: d.id, ...d.data() } as GuestEntry));
      return allGuests.filter(
        (g) =>
          g.primaryName.toLowerCase().includes(q) ||
          g.code.toLowerCase() === q ||
          (g.email && g.email.toLowerCase().includes(q))
      );
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
    console.warn('API guest search failed, searching local backup', err);
  }

  const backup = getLocalBackup();
  return backup.guests.filter(
    (g) =>
      g.primaryName.toLowerCase().includes(q) ||
      g.code.toLowerCase() === q ||
      (g.email && g.email.toLowerCase().includes(q))
  );
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
  let updatedGuest: GuestEntry | null = null;

  try {
    const guestRef = doc(db, 'guests', rsvpData.guestId);
    const guestSnap = await withTimeout(getDoc(guestRef), 2000);

    if (guestSnap.exists()) {
      const existing = guestSnap.data() as GuestEntry;
      updatedGuest = {
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
      const data = await res.json();
      return data;
    }
  } catch (err) {
    console.warn('API submit RSVP failed, applying to local store', err);
  }

  const backup = getLocalBackup();
  const idx = backup.guests.findIndex((g) => g.id === rsvpData.guestId);
  if (idx !== -1) {
    updatedGuest = {
      ...backup.guests[idx],
      status: rsvpData.status,
      primaryMealOptionId: rsvpData.primaryMealOptionId,
      primaryDietaryRestrictions: rsvpData.primaryDietaryRestrictions,
      plusOne: rsvpData.plusOne,
      songRequest: rsvpData.songRequest,
      messageToCouple: rsvpData.messageToCouple,
      attendingEvents: rsvpData.attendingEvents || [],
      email: rsvpData.email || backup.guests[idx].email,
      phone: rsvpData.phone || backup.guests[idx].phone,
      updatedAt: new Date().toISOString(),
    };
    backup.guests[idx] = updatedGuest;

    if (rsvpData.messageToCouple && rsvpData.messageToCouple.length > 3) {
      backup.wishes.unshift({
        id: `wsh_${Date.now()}`,
        guestName: updatedGuest.primaryName,
        message: rsvpData.messageToCouple,
        date: new Date().toLocaleDateString('es-ES', { month: 'long', day: 'numeric', year: 'numeric' }),
        isPublic: true,
        likesCount: 1,
      });
    }

    setLocalBackup(backup);
    return { success: true, guest: updatedGuest };
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
    console.warn('API fetch guests failed, using local backup');
  }
  return getLocalBackup().guests;
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

  const backup = getLocalBackup();
  if (guest.id) {
    const idx = backup.guests.findIndex((g) => g.id === guest.id);
    if (idx !== -1) backup.guests[idx] = { ...backup.guests[idx], ...guest } as GuestEntry;
  } else {
    backup.guests.unshift({
      id: guestId,
      code: guest.code || `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      primaryName: guest.primaryName || 'Nuevo Invitado',
      email: guest.email || '',
      partySizeAllowed: guest.partySizeAllowed || 1,
      status: guest.status || 'pending',
    });
  }
  setLocalBackup(backup);
  return backup.guests;
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

  const backup = getLocalBackup();
  backup.guests = backup.guests.filter((g) => g.id !== guestId);
  setLocalBackup(backup);
  return backup.guests;
}

export async function updateWeddingDetails(pin: string, wedding: Partial<WeddingDetails>): Promise<WeddingDetails> {
  // 1. Update Local Storage immediately so changes are never lost
  const backup = getLocalBackup();
  const mergedWedding: WeddingDetails = { ...backup.wedding, ...wedding };
  backup.wedding = mergedWedding;
  setLocalBackup(backup);

  // 2. Persist to Firestore with timeout
  try {
    const weddingRef = doc(db, 'wedding', 'details');
    await withTimeout(setDoc(weddingRef, mergedWedding, { merge: true }), 2500);
  } catch (err) {
    console.warn('Firestore updateWeddingDetails notice (handled gracefully):', err);
  }

  // 3. Persist to Server store
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
    console.warn('Server API update wedding noticed, continuing with local store');
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

  const backup = getLocalBackup();
  backup.wishes.unshift(newWish);
  setLocalBackup(backup);
  return backup.wishes;
}

export async function deleteWish(wishId: string): Promise<GuestbookWish[]> {
  try {
    await withTimeout(deleteDoc(doc(db, 'wishes', wishId)), 2000);
    const wishesSnap = await withTimeout(getDocs(query(collection(db, 'wishes'), orderBy('date', 'desc'))), 2000);
    return wishesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as GuestbookWish));
  } catch (err) {
    console.warn('Firestore deleteWish failed:', err);
  }

  const backup = getLocalBackup();
  backup.wishes = backup.wishes.filter((w) => w.id !== wishId);
  setLocalBackup(backup);
  return backup.wishes;
}

export async function updateWish(wishId: string, updates: Partial<GuestbookWish>): Promise<GuestbookWish[]> {
  try {
    await withTimeout(updateDoc(doc(db, 'wishes', wishId), updates), 2000);
    const wishesSnap = await withTimeout(getDocs(query(collection(db, 'wishes'), orderBy('date', 'desc'))), 2000);
    return wishesSnap.docs.map((d) => ({ id: d.id, ...d.data() } as GuestbookWish));
  } catch (err) {
    console.warn('Firestore updateWish failed:', err);
  }

  const backup = getLocalBackup();
  const idx = backup.wishes.findIndex((w) => w.id === wishId);
  if (idx !== -1) {
    backup.wishes[idx] = { ...backup.wishes[idx], ...updates };
  }
  setLocalBackup(backup);
  return backup.wishes;
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
    galleryPhotos: updatedPhotos,
  });
}

export async function deleteGalleryPhoto(photoId: string, currentWedding: WeddingDetails): Promise<WeddingDetails> {
  const currentPhotos = currentWedding.galleryPhotos || defaultWeddingData.wedding.galleryPhotos || [];
  const updatedPhotos = currentPhotos.filter((p) => p.id !== photoId);

  return await updateWeddingDetails(currentWedding.adminPin || '1234', {
    galleryPhotos: updatedPhotos,
  });
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
