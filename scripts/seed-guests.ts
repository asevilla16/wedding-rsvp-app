// Pushes the guest list from src/data/defaultData.ts into Firestore's `guests`
// collection. Existing guests are skipped by default so RSVPs already submitted
// are never lost.
//
//   npm run seed:guests                 add guests that are missing
//   npm run seed:guests -- --dry-run    show what would be written, write nothing
//   npm run seed:guests -- --force      overwrite existing guests too (resets RSVPs!)

import { initializeApp } from 'firebase/app';
import { initializeFirestore, collection, doc, getDocs, setDoc, terminate } from 'firebase/firestore';
import firebaseConfig from '../firebase-applet-config.json';
import { defaultWeddingData } from '../src/data/defaultData';

const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const force = args.includes('--force');

const app = initializeApp(firebaseConfig);
const db = initializeFirestore(app, { ignoreUndefinedProperties: true });

async function seedGuests() {
  const snap = await getDocs(collection(db, 'guests'));
  const existingIds = new Set(snap.docs.map((d) => d.id));
  console.log(`Firestore currently has ${existingIds.size} guests.`);

  let written = 0;
  let skipped = 0;
  for (const guest of defaultWeddingData.guests) {
    const exists = existingIds.has(guest.id);
    if (exists && !force) {
      skipped++;
      continue;
    }
    console.log(`${dryRun ? '[dry-run] ' : ''}${exists ? 'overwrite' : 'add'}  ${guest.code}  ${guest.primaryName}`);
    if (!dryRun) await setDoc(doc(db, 'guests', guest.id), guest);
    written++;
  }

  console.log(`\nDone: ${written} ${dryRun ? 'would be written' : 'written'}, ${skipped} already existed (skipped).`);
}

seedGuests()
  .catch((err) => {
    console.error('Seeding guests failed:', err);
    process.exitCode = 1;
  })
  .finally(() => terminate(db));
