import test from 'node:test';
import assert from 'node:assert/strict';
import { extractiveSummary } from '../server/lib/summarize.js';
import { readingMinutes, splitSentences } from '../server/lib/text.js';
import { escapeLike, isValidEmail, parsePage } from '../server/lib/validate.js';

test('splitSentences splits on sentence ends, across line breaks', () => {
  assert.deepEqual(splitSentences('One is here. Two is here!\n\nIs three here? Yes.'), [
    'One is here.', 'Two is here!', 'Is three here?', 'Yes.',
  ]);
});

test('splitSentences does not split on decimals or mid-sentence dots', () => {
  assert.deepEqual(splitSentences('Prices rose 2.5 percent. Rents did not.'), [
    'Prices rose 2.5 percent.', 'Rents did not.',
  ]);
});

test('readingMinutes rounds to whole minutes and never returns 0', () => {
  assert.equal(readingMinutes('short'), 1);
  assert.equal(readingMinutes('word '.repeat(440)), 2);
});

test('extractiveSummary returns short text unchanged', () => {
  assert.deepEqual(extractiveSummary('Only one. And two.'), ['Only one.', 'And two.']);
});

test('extractiveSummary picks the sentences about the main subject, in reading order', () => {
  const text =
    'The bridge will close for repairs in March. ' +
    'Nobody expected rain. ' +
    'Engineers say the bridge repairs will take six weeks. ' +
    'A cat sat nearby. ' +
    'Drivers should avoid the bridge during repairs.';

  assert.deepEqual(extractiveSummary(text), [
    'The bridge will close for repairs in March.',
    'Engineers say the bridge repairs will take six weeks.',
    'Drivers should avoid the bridge during repairs.',
  ]);
});

test('extractiveSummary copes with empty text', () => {
  assert.deepEqual(extractiveSummary(''), []);
});

test('isValidEmail accepts normal addresses and rejects obvious mistakes', () => {
  assert.equal(isValidEmail('reader@example.com'), true);
  for (const bad of ['', 'reader', 'reader@', '@example.com', 'a b@example.com', 'reader@example', null, 42]) {
    assert.equal(isValidEmail(bad), false, `expected ${JSON.stringify(bad)} to be invalid`);
  }
});

test('parsePage falls back to 1 for anything that is not a positive whole number', () => {
  assert.equal(parsePage('3'), 3);
  for (const bad of [undefined, '0', '-2', '1.5', 'abc', '']) {
    assert.equal(parsePage(bad), 1);
  }
});

test('escapeLike escapes the LIKE wildcards', () => {
  assert.equal(escapeLike('100%_done\\'), '100\\%\\_done\\\\');
});
