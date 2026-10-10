import { WeddingDetails, GuestEntry, GuestbookWish, GalleryPhoto, BudgetItem, InitialDataStore } from '../types';
import { defaultWeddingData, defaultBudgetItems } from '../data/defaultData';
import { db, withTimeout } from '../lib/firebase';
import { findCompanionReviews, CompanionReview } from '../lib/guestCoverage';
import { generateInviteCode } from '../lib/inviteCode';
import {
  doc,
  getDoc,
  getDocs,
  collection,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  writeBatch,
  increment
} from 'firebase/firestore';

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

// Loads the single invitation behind a personal link (?code=...). The code is
// the guest's Firestore document id, and the security rules only allow
// fetching a guest by that exact id: guests can never list or browse others.
export async function fetchInvitation(code: string): Promise<GuestEntry | null> {
  const wanted = code.trim().toUpperCase();
  if (!wanted) return null;

  try {
    const snap = await withTimeout(getDoc(doc(db, 'guests', wanted)), 2000);
    return snap.exists() ? ({ id: snap.id, ...snap.data() } as GuestEntry) : null;
  } catch (err) {
    console.warn('Firestore invitation lookup failed, using fallback:', err);
  }

  try {
    const res = await fetch(`/api/guests/search?q=${encodeURIComponent(wanted)}`);
    if (res.ok) {
      const data = await res.json();
      return data.guests?.[0] ?? null;
    }
  } catch (err) {
    console.warn('API invitation lookup failed', err);
  }
  return null;
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

      // The admin-assigned companion link lives in Firestore, not in the form:
      // keep it for as long as the guest still brings a companion, even if they
      // edit the companion's name. It is dropped when they decline or come alone.
      // The companion's own record is never touched from here (the rules only
      // let a guest edit their own RSVP); the admin panel lists the resulting
      // rename / release for the couple to apply (see findCompanionReviews).
      const companionId = existing.plusOne?.guestId || null;
      let plusOne = rsvpData.plusOne !== undefined ? rsvpData.plusOne : existing.plusOne;
      if (plusOne) {
        plusOne = { ...plusOne, guestId: plusOne.attending ? companionId : null };
      }

      const updatedGuest: GuestEntry = {
        ...existing,
        status: rsvpData.status,
        primaryMealOptionId: rsvpData.primaryMealOptionId || existing.primaryMealOptionId,
        primaryDietaryRestrictions: rsvpData.primaryDietaryRestrictions ?? existing.primaryDietaryRestrictions,
        plusOne,
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
      headers: { 'x-admin-pin': pin },
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

export class InviteCodeInUseError extends Error {
  constructor() {
    super('Ese código de invitación ya pertenece a otro invitado.');
  }
}

// Applies one companion change from findCompanionReviews to the companion's
// guest record. Admin-only (the rules reject it for guests).
export async function applyCompanionReview(review: CompanionReview): Promise<void> {
  const ref = doc(db, 'guests', review.companion.id);
  if (review.kind === 'rename') {
    await withTimeout(updateDoc(ref, { primaryName: review.newName }), 2000);
  } else {
    await withTimeout(updateDoc(ref, { coveredByName: review.kind === 'cover' ? review.hostName : null }), 2000);
  }
}

// Applies coverage changes ('cover' / 'release') for the given companions.
// Used after an admin edit, so links the couple sets take effect immediately;
// changes caused by guests' RSVPs are left for the couple to review.
async function syncCoverageFor(pin: string, guests: GuestEntry[], companionIds: Set<string>): Promise<GuestEntry[]> {
  const pending = findCompanionReviews(guests).filter(
    (r) => r.kind !== 'rename' && companionIds.has(r.companion.id)
  );
  if (pending.length === 0) return guests;
  await Promise.all(pending.map(applyCompanionReview));
  return await fetchAllGuests(pin);
}

// The couple's private comments per guest (guestNotes/{guestId}), as a map of
// guest id -> text. Admin-only; kept off the guest record so guests can't read
// them through their own invitation.
export async function fetchGuestNotes(): Promise<Record<string, string>> {
  try {
    const snap = await withTimeout(getDocs(collection(db, 'guestNotes')), 2000);
    return Object.fromEntries(snap.docs.map((d) => [d.id, (d.data().text as string) || '']));
  } catch (err) {
    console.warn('Firestore fetchGuestNotes failed:', err);
    return {};
  }
}

// `note`: the guest's private comment. Pass undefined to leave it unchanged,
// or an empty string to remove it.
export async function saveGuest(pin: string, guest: Partial<GuestEntry>, note?: string): Promise<GuestEntry[]> {
  // The invitation code is the guest's document id (see firestore.rules), so a
  // new code means moving the record to a new id.
  const code = (guest.code || generateInviteCode()).trim().toUpperCase();
  const previousId = guest.id;
  const guestId = code;

  try {
    const previousSnap = previousId ? await withTimeout(getDoc(doc(db, 'guests', previousId)), 2000) : null;
    const previous = previousSnap?.exists() ? (previousSnap.data() as GuestEntry) : null;

    if (previousId !== code) {
      const clash = await withTimeout(getDoc(doc(db, 'guests', code)), 2000);
      if (clash.exists()) throw new InviteCodeInUseError();
    }

    const newGuestEntry: GuestEntry = {
      ...(previous || {}),
      id: guestId,
      code,
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

    const batch = writeBatch(db);
    batch.set(doc(db, 'guests', guestId), newGuestEntry, { merge: previousId === guestId });

    // Comments follow the guest to their new id when the code changes.
    let finalNote = note;
    if (previousId && previousId !== guestId) {
      if (finalNote === undefined) {
        const oldNote = await withTimeout(getDoc(doc(db, 'guestNotes', previousId)), 2000);
        finalNote = oldNote.exists() ? (oldNote.data().text as string) : '';
      }
      batch.delete(doc(db, 'guestNotes', previousId));
    }
    if (finalNote !== undefined) {
      if (finalNote.trim()) batch.set(doc(db, 'guestNotes', guestId), { text: finalNote.trim() });
      else batch.delete(doc(db, 'guestNotes', guestId));
    }

    if (previousId && previousId !== guestId) {
      batch.delete(doc(db, 'guests', previousId));
      // Re-point anyone who links this guest as their companion.
      const hosts = await withTimeout(
        getDocs(query(collection(db, 'guests'), where('plusOne.guestId', '==', previousId))),
        2000
      );
      hosts.forEach((h) => batch.update(h.ref, { 'plusOne.guestId': guestId }));
    }
    await withTimeout(batch.commit(), 2500);

    const touched = new Set(
      [guestId, previous?.plusOne?.guestId, newGuestEntry.plusOne?.guestId].filter((id): id is string => !!id)
    );
    return await syncCoverageFor(pin, await fetchAllGuests(pin), touched);
  } catch (err) {
    if (err instanceof InviteCodeInUseError) throw err;
    // Firestore is reachable but refused the write (rules not deployed, or the
    // session isn't an admin). Falling back would silently drop the change.
    if ((err as { code?: string })?.code === 'permission-denied') throw err;
    console.warn('Firestore saveGuest failed:', err);
  }

  try {
    const res = await fetch('/api/guests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, guest }),
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
      code: guest.code || generateInviteCode(),
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
    const snap = await withTimeout(getDoc(doc(db, 'guests', guestId)), 2000);
    const companionId = snap.exists() ? (snap.data() as GuestEntry).plusOne?.guestId : null;

    const batch = writeBatch(db);
    batch.delete(doc(db, 'guests', guestId));
    batch.delete(doc(db, 'guestNotes', guestId));
    // Anyone bringing this guest as their companion now has an unlinked plus-one.
    const hosts = await withTimeout(
      getDocs(query(collection(db, 'guests'), where('plusOne.guestId', '==', guestId))),
      2000
    );
    hosts.forEach((h) => batch.update(h.ref, { 'plusOne.guestId': null }));
    await withTimeout(batch.commit(), 2500);

    // Release the deleted guest's own companion, if they had one.
    return await syncCoverageFor(pin, await fetchAllGuests(pin), new Set(companionId ? [companionId] : []));
  } catch (err) {
    console.warn('Firestore deleteGuest failed:', err);
  }

  try {
    const res = await fetch(`/api/guests/${guestId}`, {
      method: 'DELETE',
      headers: { 'x-admin-pin': pin },
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
  // The PIN must never be written to the public wedding document; it lives in
  // private/admin (see changeAdminPin).
  const { adminPin: _ignored, ...mergedWedding }: WeddingDetails = { ...freshDefaults().wedding, ...wedding };

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
      body: JSON.stringify({ pin, wedding: mergedWedding }),
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

// Adds one like to a guestbook wish. Uses an atomic increment so likes from
// several visitors at once are all counted.
export async function likeWish(wishId: string): Promise<void> {
  await withTimeout(updateDoc(doc(db, 'wishes', wishId), { likesCount: increment(1) }), 2000);
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

  return await updateWeddingDetails('', {
    ...currentWedding,
    galleryPhotos: updatedPhotos,
  });
}

export async function deleteGalleryPhoto(photoId: string, currentWedding: WeddingDetails): Promise<WeddingDetails> {
  const currentPhotos = currentWedding.galleryPhotos || defaultWeddingData.wedding.galleryPhotos || [];
  const updatedPhotos = currentPhotos.filter((p) => p.id !== photoId);

  return await updateWeddingDetails('', {
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
