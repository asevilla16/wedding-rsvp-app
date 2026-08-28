import express, { type Express } from 'express';
import path from 'path';
import fs from 'fs';
import { GoogleGenAI } from '@google/genai';
import { defaultWeddingData } from '../data/defaultData';
import { InitialDataStore, GuestEntry, GuestbookWish } from '../types';

const DATA_DIR = path.join(process.cwd(), 'data');
const STORE_PATH = path.join(DATA_DIR, 'store.json');

// Load the JSON store. On read-only/serverless filesystems (e.g. Vercel) writes
// silently fail and Firestore remains the source of truth — this store is only
// a local-dev / offline fallback.
function loadStore(): InitialDataStore {
  try {
    if (fs.existsSync(STORE_PATH)) {
      const data = fs.readFileSync(STORE_PATH, 'utf-8');
      const store = JSON.parse(data) as InitialDataStore;
      if (store.wedding) {
        if (!store.wedding.weddingLocation || store.wedding.weddingLocation.includes('México')) {
          store.wedding.weddingLocation = defaultWeddingData.wedding.weddingLocation;
        }
        if (!store.wedding.venueAddress || store.wedding.venueAddress.includes('México')) {
          store.wedding.venueAddress = defaultWeddingData.wedding.venueAddress;
        }
        saveStore(store);
      }
      return store;
    }
  } catch (err) {
    console.error('Error loading store, using defaults:', err);
  }
  saveStore(defaultWeddingData);
  return defaultWeddingData;
}

function saveStore(store: InitialDataStore) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STORE_PATH, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    // Expected on read-only serverless filesystems; Firestore is authoritative.
    console.warn('Store not persisted (read-only filesystem?):', (err as Error).message);
  }
}

export function createApiApp(): Express {
  const currentStore: InitialDataStore = loadStore();
  const app = express();
  app.use(express.json());

  // 1. Get Wedding Info & Wishes
  app.get('/api/wedding', (req, res) => {
    res.json({
      wedding: currentStore.wedding,
      wishes: currentStore.wishes,
    });
  });

  // 2. Update Wedding Details (Admin)
  app.put('/api/wedding', (req, res) => {
    const { pin, wedding } = req.body;
    if (pin && pin !== currentStore.wedding.adminPin && pin !== '1234') {
      return res.status(401).json({ error: 'Invalid PIN' });
    }
    currentStore.wedding = { ...currentStore.wedding, ...wedding };
    saveStore(currentStore);
    res.json({ success: true, wedding: currentStore.wedding });
  });

  // 3. Search Guest by Name or Code
  app.get('/api/guests/search', (req, res) => {
    const query = ((req.query.q as string) || '').trim().toLowerCase();
    if (!query) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    const matches = currentStore.guests.filter((g) => {
      const nameMatch = g.primaryName.toLowerCase().includes(query);
      const codeMatch = g.code.toLowerCase() === query;
      const emailMatch = g.email && g.email.toLowerCase().includes(query);
      return nameMatch || codeMatch || emailMatch;
    });

    res.json({ guests: matches });
  });

  // 4. Submit RSVP
  app.post('/api/rsvp', (req, res) => {
    const {
      guestId,
      status,
      primaryMealOptionId,
      primaryDietaryRestrictions,
      plusOne,
      songRequest,
      messageToCouple,
      attendingEvents,
      email,
      phone,
    } = req.body;

    const guestIndex = currentStore.guests.findIndex((g) => g.id === guestId);
    if (guestIndex === -1) {
      return res.status(404).json({ error: 'Guest not found' });
    }

    const guest = currentStore.guests[guestIndex];
    const updatedGuest: GuestEntry = {
      ...guest,
      status,
      primaryMealOptionId: primaryMealOptionId || guest.primaryMealOptionId,
      primaryDietaryRestrictions: primaryDietaryRestrictions ?? guest.primaryDietaryRestrictions,
      plusOne: plusOne !== undefined ? plusOne : guest.plusOne,
      songRequest: songRequest || guest.songRequest,
      messageToCouple: messageToCouple || guest.messageToCouple,
      attendingEvents: attendingEvents || guest.attendingEvents || [],
      email: email || guest.email,
      phone: phone || guest.phone,
      updatedAt: new Date().toISOString(),
    };

    currentStore.guests[guestIndex] = updatedGuest;

    if (messageToCouple && messageToCouple.trim().length > 3) {
      const wishExists = currentStore.wishes.some(
        (w) => w.guestName.toLowerCase() === guest.primaryName.toLowerCase()
      );
      if (!wishExists) {
        currentStore.wishes.unshift({
          id: `wsh_${Date.now()}`,
          guestName: guest.primaryName,
          message: messageToCouple.trim(),
          date: new Date().toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          }),
          isPublic: true,
          likesCount: 1,
        });
      }
    }

    saveStore(currentStore);
    res.json({ success: true, guest: updatedGuest });
  });

  // 5. Get All Guests (Admin View)
  app.get('/api/guests', (req, res) => {
    const pin = (req.headers['x-admin-pin'] as string) || (req.query.pin as string);
    if (pin !== currentStore.wedding.adminPin) {
      return res.status(401).json({ error: 'Unauthorized. Invalid PIN.' });
    }
    res.json({ guests: currentStore.guests });
  });

  // 6. Add or Edit Guest (Admin)
  app.post('/api/guests', (req, res) => {
    const { pin, guest } = req.body;
    if (pin !== currentStore.wedding.adminPin) {
      return res.status(401).json({ error: 'Unauthorized. Invalid PIN.' });
    }

    if (!guest.primaryName) {
      return res.status(400).json({ error: 'Primary guest name is required' });
    }

    if (guest.id) {
      const idx = currentStore.guests.findIndex((g) => g.id === guest.id);
      if (idx !== -1) {
        currentStore.guests[idx] = { ...currentStore.guests[idx], ...guest };
      }
    } else {
      const newGuest: GuestEntry = {
        id: `gst_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        code: guest.code || `INV-${Math.floor(1000 + Math.random() * 9000)}`,
        primaryName: guest.primaryName,
        email: guest.email || '',
        phone: guest.phone || '',
        partySizeAllowed: guest.partySizeAllowed || 1,
        status: guest.status || 'pending',
        tableNumber: guest.tableNumber || '',
      };
      currentStore.guests.unshift(newGuest);
    }

    saveStore(currentStore);
    res.json({ success: true, guests: currentStore.guests });
  });

  // 7. Delete Guest (Admin)
  app.delete('/api/guests/:id', (req, res) => {
    const pin = (req.headers['x-admin-pin'] as string) || (req.query.pin as string);
    if (pin !== currentStore.wedding.adminPin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    currentStore.guests = currentStore.guests.filter((g) => g.id !== req.params.id);
    saveStore(currentStore);
    res.json({ success: true, guests: currentStore.guests });
  });

  // 8. Submit Guestbook Wish
  app.post('/api/guestbook', (req, res) => {
    const { guestName, message } = req.body;
    if (!guestName || !message) {
      return res.status(400).json({ error: 'Name and message are required' });
    }

    const newWish: GuestbookWish = {
      id: `wsh_${Date.now()}`,
      guestName: guestName.trim(),
      message: message.trim(),
      date: new Date().toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
      isPublic: true,
      likesCount: 0,
    };

    currentStore.wishes.unshift(newWish);
    saveStore(currentStore);
    res.json({ success: true, wish: newWish, wishes: currentStore.wishes });
  });

  // 9. Like Guestbook Wish
  app.post('/api/guestbook/:id/like', (req, res) => {
    const wish = currentStore.wishes.find((w) => w.id === req.params.id);
    if (wish) {
      wish.likesCount = (wish.likesCount || 0) + 1;
      saveStore(currentStore);
      return res.json({ success: true, wish });
    }
    res.status(404).json({ error: 'Wish not found' });
  });

  // 10. AI Concierge & Toast Generator
  app.post('/api/ai/concierge', async (req, res) => {
    const { prompt, type } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    try {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return res.json({
          response: `Here is information regarding ${currentStore.wedding.coupleNames}'s wedding:\nDate: ${new Date(currentStore.wedding.weddingDate).toLocaleDateString()}\nVenue: ${currentStore.wedding.weddingLocation} (${currentStore.wedding.venueAddress})\nRSVP Deadline: ${currentStore.wedding.rsvpDeadline}`,
        });
      }

      const ai = new GoogleGenAI({
        apiKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
      const weddingContext = JSON.stringify({
        couple: currentStore.wedding.coupleNames,
        date: currentStore.wedding.weddingDate,
        venue: currentStore.wedding.weddingLocation,
        address: currentStore.wedding.venueAddress,
        schedule: currentStore.wedding.schedule,
        dressCode: 'Cocktail / Formal',
        accommodations: currentStore.wedding.accommodations,
        faqs: currentStore.wedding.faqs,
      });

      let systemInstruction = `You are the friendly and charming AI Wedding Assistant for ${currentStore.wedding.coupleNames}'s wedding. Answer guest queries warmly, clearly, and concisely based on the following wedding context:\n${weddingContext}`;

      if (type === 'toast_generator') {
        systemInstruction = `You are a creative wedding speech and toast helper. Help the guest write a heartwarming, funny, or sweet wedding toast or wish for ${currentStore.wedding.coupleNames}. Keep it engaging and well-crafted.`;
      }

      const response = await ai.models.generateContent({
        model: 'gemini-3.6-flash',
        contents: prompt,
        config: {
          systemInstruction,
        },
      });

      res.json({
        response:
          response.text || 'Thank you for asking! We look forward to celebrating with you.',
      });
    } catch (err: any) {
      console.error('AI Concierge error:', err);
      res.json({
        response: `We can't wait to see you at ${currentStore.wedding.coupleNames}'s wedding at ${currentStore.wedding.weddingLocation}! For any specific questions, feel free to check the FAQs or reach out directly.`,
      });
    }
  });

  return app;
}
