export interface PlusOneDetails {
  attending: boolean;
  fullName?: string;
  mealOptionId?: string;
  dietaryRestrictions?: string;
}

export interface SongRequest {
  title: string;
  artist: string;
}

export interface GuestEntry {
  id: string;
  code: string;
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
}

export interface BudgetItem {
  id: string;
  category: 'Lugar & Banquetes' | 'Fotografía & Video' | 'Música & DJ' | 'Vestuario & Belleza' | 'Decoración & Flores' | 'Invitaciones & Detalles' | 'Otros';
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
  adminPin: string; // default e.g. "1234"
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
