const WORDS_PER_MINUTE = 220;

/** Splits text into words, lower-cased, ignoring punctuation. */
export function words(text) {
  return text.toLowerCase().match(/[a-z0-9']+/g) ?? [];
}

/** How long the text takes to read, in whole minutes (never less than 1). */
export function readingMinutes(text) {
  return Math.max(1, Math.round(words(text).length / WORDS_PER_MINUTE));
}

/**
 * Splits text into sentences. A sentence ends with . ! or ? followed by a
 * space and a capital letter.
 */
export function splitSentences(text) {
  return text
    .replace(/\s+/g, ' ')
    .split(/(?<=[.!?])\s+(?=[A-Z"])/)
    .map((sentence) => sentence.trim())
    .filter(Boolean);
}
