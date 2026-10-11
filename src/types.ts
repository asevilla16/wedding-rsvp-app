export interface PlusOneDetails {
  attending: boolean;
  // Set when the companion is another registered guest. Cleared with null (not
  // undefined) so merged Firestore writes actually remove the link.
  guestId?: string | null;
  fullName?: string;
  mealOptionId?: string;
  dietaryRestrictions?: string;
}

export interface SongRequest {
  title: string;
  artist: string;
}

export interface GuestEntry {
  id: string; // Firestore document id; always equal to `code`
  code: string; // secret invitation code, used in the guest's personal link
  primaryName: string;
  email?: string;
  phone?: string;
  partySizeAllowed: number;
  status: 'pending' | 'attending' | 'declined';
  attendingEvents?: string[]; // IDs of schedule items
  plusOne?: PlusOneDetails | null;
  primaryMealOptionId?: string;
  primaryDietaryRestrictions?: string;
  songRequest?: SongRequest;
  messageToCouple?: string;
  updatedAt?: string;
  tableNumber?: string;
  groupCategory?: string;
  // Name of the guest whose invitation covers this one (they're that guest's
  // linked companion). Written by the admin panel so the covered guest can see
  // it from their own record, without being able to read anyone else's.
  coveredByName?: string | null;
}

export interface BudgetItem {
  id: string;
  // One of the categories managed in the panel (Firestore budgetSettings/categories).
  category: string;
  description: string;
  vendor?: string;
  estimatedCost: number;
  actualCost: number;
  paidAmount: number;
  isPaid: boolean;
  notes?: string;
  dueDate?: string;
}

export interface EventScheduleItem {
  id: string;
  title: string;
  time: string;
  location: string;
  description: string;
  iconName: string; // e.g. 'Wine', 'Heart', 'GlassWater', 'Music', 'Utensils', 'Sparkles'
  dressCode?: string;
}

export interface MealOption {
  id: string;
  name: string;
  description: string;
  category: 'meat' | 'fish' | 'vegetarian' | 'vegan' | 'kids';
  isGlutenFree?: boolean;
}

export interface AccommodationItem {
  id: string;
  hotelName: string;
  address: string;
  phone: string;
  website: string;
  bookingCode?: string;
  discountNotes?: string;
  distanceFromVenue: string;
  imageUrl?: string;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: 'general' | 'travel' | 'dress-code' | 'gifts' | 'kids';
}

export interface RegistryItem {
  id: string;
  title: string;
  description: string;
  category: 'fund' | 'item' | 'experience';
  targetAmount?: number;
  currentAmount?: number;
  externalUrl?: string;
  iconName: string;
}

export interface GuestbookWish {
  id: string;
  guestName: string;
  message: string;
  date: string;
  isPublic: boolean;
  likesCount?: number;
}

export interface GalleryPhoto {
  id: string;
  url: string;
  caption: string;
  category: 'novios' | 'detalles' | 'lugar' | 'momentos';
  aspectRatio?: string;
}

export interface WeddingDetails {
  coupleNames: string; // e.g. "Sophia & Alexander"
  partner1Name: string; // e.g. "Sophia Martinez"
  partner2Name: string; // e.g. "Alexander Wright"
  weddingDate: string; // ISO string e.g. "2026-09-18T16:00:00"
  weddingLocation: string; // e.g. "Villa Bella Rosa"
  venueAddress: string; // e.g. "1200 Silverado Trail, St. Helena, CA 94574"
  venueMapUrl: string;
  heroSubtitle: string;
  coverImageUrl: string;
  ourStory: string;
  storyImageUrl?: string;
  rsvpDeadline: string;
  // Legacy: the admin PIN now lives in Firestore's unreadable private/admin
  // document. Never stored on the public wedding details.
  adminPin?: string;
  partner1Email?: string; // Groom / Bride 1 Google email
  partner2Email?: string; // Groom / Bride 2 Google email
  allowPlusOnes: boolean;
  mealSelectionEnabled: boolean;
  songRequestsEnabled: boolean;
  registryEnabled: boolean;
  guestbookEnabled: boolean;
  schedule: EventScheduleItem[];
  meals: MealOption[];
  accommodations: AccommodationItem[];
  faqs: FAQItem[];
  registry: RegistryItem[];
  galleryPhotos?: GalleryPhoto[];
}

export interface InitialDataStore {
  wedding: WeddingDetails;
  guests: GuestEntry[];
  wishes: GuestbookWish[];
}
