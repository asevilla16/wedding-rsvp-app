// Adds the guests from scripts/guestList.ts to Firestore's `guests` collection.
// Guests already present (matched by name) are skipped, so RSVPs are never
// lost. Each new guest's document id is a fresh secret invitation code.
//
// Once the locked-down firestore.rules are deployed, this script (which runs
// without signing in) is rejected; add guests from the admin panel instead.
//
//   npm run seed:guests                 add guests that are missing
//   npm run seed:guests -- --dry-run    show what would be written, write nothing

import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, doc, getDocs, setDoc, terminate } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { GuestEntry } from '../src/types';
import { generateInviteCode } from '../src/lib/inviteCode';
import { guestList } from './guestList';

const dryRun = process.argv.slice(2).includes('--dry-run');

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { ignoreUndefinedProperties: true });

const normalize = (name: string) => name.trim().toLowerCase();

async function seedGuests() {
  const snap = await getDocs(collection(db, 'guests'));
  const existingNames = new Set(snap.docs.map((d) => normalize(d.data().primaryName || '')));
  const usedCodes = new Set(snap.docs.map((d) => d.id));
  console.log(`Firestore currently has ${snap.size} guests.`);

  let written = 0;
  for (const [primaryName, groupCategory] of guestList) {
    if (existingNames.has(normalize(primaryName))) continue;

    let code = generateInviteCode();
    while (usedCodes.has(code)) code = generateInviteCode();
    usedCodes.add(code);

    const guest: GuestEntry = {
      id: code,
      code,
      primaryName,
      partySizeAllowed: 1,
      status: 'pending',
      attendingEvents: [],
      groupCategory,
    };
    console.log(`${dryRun ? '[dry-run] ' : ''}add  ${code}  ${primaryName}`);
    if (!dryRun) await setDoc(doc(db, 'guests', code), guest);
    written++;
  }

  console.log(
    `\nDone: ${written} ${dryRun ? 'would be added' : 'added'}, ` +
      `${guestList.length - written} already in Firestore (skipped).`
  );
}

seedGuests()
  .catch((err) => {
    console.error('Seeding guests failed:', err);
    process.exitCode = 1;
  })
  .finally(() => terminate(db));
