// One-time migration to the locked-down firestore.rules. Run it BEFORE
// deploying those rules (it signs in as nobody, which the new rules reject).
//
//  1. Guests: re-keys every guest so its document id equals its invitation
//     code (the rules let guests `get` their own invitation by code but never
//     list the collection). Secure codes are kept, so links already sent keep
//     working; guessable ones (e.g. INV-1001) get a new random code.
//  2. Companion links (plusOne.guestId) are re-pointed to the new ids, and each
//     covered companion gets `coveredByName` so they can see it themselves.
//  3. Removes the admin PIN from the public wedding/details document. Set it
//     again from the panel afterwards; it is then stored in private/admin,
//     which no client can read.
//
// Safe to re-run: guests already keyed by their code are left where they are.
//
//   npm run migrate:secure -- --dry-run    show what would change, write nothing
//   npm run migrate:secure                 apply

import { initializeApp } from 'firebase/app';
import {
  initializeFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  writeBatch,
  deleteField,
  terminate,
} from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { GuestEntry } from '../src/types';
import { generateInviteCode, isSecureInviteCode } from '../src/lib/inviteCode';
import { buildCoverageMap } from '../src/lib/guestCoverage';

const dryRun = process.argv.slice(2).includes('--dry-run');
const tag = dryRun ? '[dry-run] ' : '';

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { ignoreUndefinedProperties: true });

async function migrateGuests() {
  const snap = await getDocs(collection(db, 'guests'));
  const guests = snap.docs.map((d) => ({ ...(d.data() as GuestEntry), id: d.id }));

  // Old document id -> new id (= invitation code).
  const used = new Set<string>();
  const idMap = new Map<string, string>();
  for (const g of guests) {
    let code = isSecureInviteCode(g.code?.toUpperCase()) ? g.code.toUpperCase() : generateInviteCode();
    while (used.has(code)) code = generateInviteCode();
    used.add(code);
    idMap.set(g.id, code);
  }

  const migrated: GuestEntry[] = guests.map((g) => {
    const id = idMap.get(g.id)!;
    const linked = g.plusOne?.guestId;
    return {
      ...g,
      id,
      code: id,
      plusOne: g.plusOne ? { ...g.plusOne, guestId: linked ? idMap.get(linked) ?? null : null } : g.plusOne,
    };
  });
  const coverage = buildCoverageMap(migrated);
  for (const g of migrated) g.coveredByName = coverage.get(g.id)?.primaryName ?? null;

  const batch = writeBatch(db);
  let moved = 0;
  for (const [i, g] of migrated.entries()) {
    const oldId = guests[i].id;
    const notes = [
      oldId !== g.id ? `${oldId} -> ${g.id}` : `${g.id} (id ok)`,
      guests[i].code !== g.code ? `code ${guests[i].code} -> ${g.code}` : '',
      g.coveredByName ? `covered by ${g.coveredByName}` : '',
    ].filter(Boolean);
    console.log(`${tag}${g.primaryName}: ${notes.join(', ')}`);

    batch.set(doc(db, 'guests', g.id), g);
    if (oldId !== g.id) {
      batch.delete(doc(db, 'guests', oldId));
      moved++;
    }
  }
  if (!dryRun) await batch.commit();
  console.log(`\n${tag}Guests: ${guests.length} total, ${moved} re-keyed.`);
}

async function migratePin() {
  const weddingRef = doc(db, 'wedding', 'details');
  const wedding = (await getDoc(weddingRef)).data() || {};
  const batch = writeBatch(db);

  // The PIN can't be copied to private/admin from here: no rules version lets
  // an unsigned-in script write there. Just take it off the public document;
  // the couple sets it again from the panel (Configuración -> Cambiar PIN)
  // after signing in with Google, once the new rules are deployed.
  if (wedding.adminPin) {
    batch.update(weddingRef, { adminPin: deleteField() });
    console.log(`${tag}PIN: removed from the public wedding/details document.`);
  }
  console.log(
    `${tag}PIN: after deploying the rules, sign in with Google and set it in Configuración -> Cambiar PIN.`
  );
  // Leftover marker from the old client-side guest seeding.
  batch.delete(doc(db, 'wedding', 'guestSeed'));

  if (!dryRun) await batch.commit();
}

migrateGuests()
  .then(migratePin)
  .catch((err) => {
    console.error('Migration failed:', err);
    process.exitCode = 1;
  })
  .finally(() => terminate(db));
