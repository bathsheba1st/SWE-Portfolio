import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';

// Passwords are never stored. We store a slow, salted hash instead.
// scrypt is built into Node and is designed to be expensive to brute force.
const KEY_LENGTH = 64;

/** Returns a string like "salt:hash" that is safe to store. */
export function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const hash = scryptSync(password, salt, KEY_LENGTH).toString('hex');
  return `${salt}:${hash}`;
}

/** Checks a password against a stored "salt:hash" string. */
export function verifyPassword(password, stored) {
  const [salt, hash] = stored.split(':');
  if (!salt || !hash) return false;

  const expected = Buffer.from(hash, 'hex');
  const actual = scryptSync(password, salt, KEY_LENGTH);

  // timingSafeEqual takes the same time whether the first or the last byte
  // differs, so an attacker cannot learn anything by timing the response.
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
