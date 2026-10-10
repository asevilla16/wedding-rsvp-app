import { GuestEntry } from '../types';

// A guest is "covered" when another guest has linked them as their companion
// (plusOne.guestId). Covered guests attend on their partner's invitation: they
// don't RSVP separately and aren't counted on their own. The admin panel works
// this out from the links; the covered guest sees it via `coveredByName` on
// their own record, which only the admin panel writes.
//
// Returns a map of covered guest id -> the guest whose invitation covers them.
export function buildCoverageMap(guests: GuestEntry[]): Map<string, GuestEntry> {
  const coveredBy = new Map<string, GuestEntry>();
  for (const host of guests) {
    const companionId = host.plusOne?.attending ? host.plusOne.guestId : null;
    if (companionId && companionId !== host.id) coveredBy.set(companionId, host);
  }
  return coveredBy;
}

// Companion changes that still need writing to the companion's own record.
// Guests can only edit their own RSVP, so when a host renames their linked
// companion, or drops them (comes alone / declines), the change lands on the
// host's record only and shows up here for the couple to apply.
export type CompanionReview =
  | { kind: 'rename'; companion: GuestEntry; host: GuestEntry; newName: string }
  | { kind: 'cover'; companion: GuestEntry; hostName: string }
  | { kind: 'release'; companion: GuestEntry; formerHostName: string };

export function findCompanionReviews(guests: GuestEntry[]): CompanionReview[] {
  const byId = new Map(guests.map((g) => [g.id, g]));
  const coverage = buildCoverageMap(guests);
  const reviews: CompanionReview[] = [];

  for (const guest of guests) {
    const host = coverage.get(guest.id);
    const stored = guest.coveredByName || null;
    if (host && stored !== host.primaryName) {
      reviews.push({ kind: 'cover', companion: guest, hostName: host.primaryName });
    } else if (!host && stored) {
      reviews.push({ kind: 'release', companion: guest, formerHostName: stored });
    }
  }

  for (const [companionId, host] of coverage) {
    const companion = byId.get(companionId);
    const newName = host.plusOne?.fullName?.trim();
    if (companion && newName && newName !== companion.primaryName) {
      reviews.push({ kind: 'rename', companion, host, newName });
    }
  }
  return reviews;
}
