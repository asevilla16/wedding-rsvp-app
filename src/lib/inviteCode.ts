// Personal invitation codes (?code=...) act as the guest's key to their RSVP,
// so they must not be guessable: 10 characters from a 31-symbol alphabet
// (~8 x 10^14 combinations) drawn from the platform's cryptographic RNG.
// Ambiguous characters (0/O, 1/I/L) are left out so codes are easy to read aloud.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const LENGTH = 10;
// Largest multiple of the alphabet size that fits in a byte; bytes at or above
// it are discarded so every character is equally likely.
const MAX_UNBIASED = 256 - (256 % ALPHABET.length);

export function generateInviteCode(): string {
  let code = '';
  const bytes = new Uint8Array(LENGTH * 2);
  while (code.length < LENGTH) {
    globalThis.crypto.getRandomValues(bytes);
    for (const b of bytes) {
      if (b < MAX_UNBIASED && code.length < LENGTH) code += ALPHABET[b % ALPHABET.length];
    }
  }
  return code;
}

// True for codes in the secure format above. Older sequential codes such as
// INV-1001 fail this check and should be rotated.
export function isSecureInviteCode(code: string | undefined): boolean {
  return !!code && new RegExp(`^[${ALPHABET}]{${LENGTH}}$`).test(code);
}
