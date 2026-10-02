import { splitSentences, words } from './text.js';

// Very common words say nothing about what a story is about, so we skip them.
const STOP_WORDS = new Set(
  ('a an and are as at be been but by for from had has have he her his in is it its ' +
   'of on or said says she that the their they this to was were will with').split(' '),
);

/**
 * The fallback summary, used when no AI model is available.
 *
 * It does not write anything new. It picks the three sentences that best
 * represent the story, like a highlighter pen:
 *
 *   1. Count how often each meaningful word appears in the story.
 *   2. Score each sentence by adding up the counts of its words, divided
 *      by the sentence length so long sentences do not win automatically.
 *   3. Keep the three best sentences, in the order they appear.
 */
export function extractiveSummary(text, count = 3) {
  const sentences = splitSentences(text);
  if (sentences.length <= count) return sentences;

  // Step 1: word -> number of times it appears
  const frequency = new Map();
  for (const word of words(text)) {
    if (!STOP_WORDS.has(word)) {
      frequency.set(word, (frequency.get(word) ?? 0) + 1);
    }
  }

  // Step 2: score every sentence, remembering its position
  const scored = sentences.map((sentence, position) => {
    const meaningful = words(sentence).filter((word) => !STOP_WORDS.has(word));
    const total = meaningful.reduce((sum, word) => sum + frequency.get(word), 0);
    return { sentence, position, score: meaningful.length ? total / meaningful.length : 0 };
  });

  // Step 3: best three, then back into reading order
  return scored
    .sort((a, b) => b.score - a.score || a.position - b.position)
    .slice(0, count)
    .sort((a, b) => a.position - b.position)
    .map((item) => item.sentence);
}
