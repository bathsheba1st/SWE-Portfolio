/**
 * A practical email check: something@something.something, no spaces.
 * The only way to be sure an address is real is to send it an email.
 */
export function isValidEmail(value) {
  return (
    typeof value === 'string' &&
    value.length <= 254 &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
  );
}

/** Reads ?page= from the URL. Anything that is not a positive whole number becomes 1. */
export function parsePage(value) {
  const page = Number(value);
  return Number.isInteger(page) && page >= 1 ? page : 1;
}

/**
 * In a SQL LIKE pattern, % and _ are wildcards. If a reader searches for
 * "100%" we want to find the text "100%", not "100 followed by anything",
 * so we put a backslash in front of those characters.
 */
export function escapeLike(text) {
  return text.replace(/[\\%_]/g, (character) => `\\${character}`);
}
