// The wedding date is saved without a time zone (e.g. "2026-12-04T17:00:00")
// and means local time at the venue in San Pedro Sula (UTC-6, no daylight
// saving). Parse and format it in that zone so guests abroad (e.g. in the USA)
// see the same date and get the right time in their calendars.
const VENUE_TIME_ZONE = 'America/Tegucigalpa';
const VENUE_UTC_OFFSET = '-06:00';

export function parseWeddingDate(value: string): Date {
  const hasZone = /([zZ]|[+-]\d{2}:?\d{2})$/.test(value);
  return new Date(hasZone ? value : `${value}${VENUE_UTC_OFFSET}`);
}

// e.g. "4 de diciembre de 2026"
export function formatWeddingDate(value: string): string {
  return parseWeddingDate(value).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: VENUE_TIME_ZONE,
  });
}

// UTC timestamp in calendar format (YYYYMMDDTHHMMSSZ) for Google Calendar / .ics.
export function toCalendarStamp(date: Date): string {
  return date.toISOString().replace(/-|:|\.\d{3}/g, '');
}
