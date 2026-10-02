import test from 'node:test';
import assert from 'node:assert/strict';
import { createSummarizer, parseBullets } from '../server/lib/ai.js';
import { fakeModel } from './helpers.js';

const story = {
  title: 'Bridge to close',
  body: 'The bridge will close in March. Repairs take six weeks. Drivers should use the tunnel. Buses will be rerouted.',
};
const GOOD_REPLY =
  '- The bridge closes in March.\n- Repairs take six weeks.\n- Drivers should use the tunnel.';

// The fallback logs a warning when the model fails.
test.beforeEach((t) => t.mock.method(console, 'warn', () => {}));

test('parseBullets reads three bullets and ignores other lines', () => {
  assert.deepEqual(parseBullets(`Here you go:\n${GOOD_REPLY}\n`), [
    'The bridge closes in March.',
    'Repairs take six weeks.',
    'Drivers should use the tunnel.',
  ]);
});

test('parseBullets rejects replies that are not exactly three bullets', () => {
  assert.throws(() => parseBullets('- Only one.'));
  assert.throws(() => parseBullets('Sorry, I cannot help with that.'));
  assert.throws(() => parseBullets('- a\n- b\n- c\n- d'));
});

test('parseBullets rejects a bullet that is far too long', () => {
  assert.throws(() => parseBullets(`- ${'x'.repeat(300)}\n- b\n- c`));
});

test('without an API key the summarizer uses the fallback and never calls the network', async () => {
  const model = fakeModel(GOOD_REPLY);
  const summarizer = createSummarizer({ fetchFn: model.fetchFn });

  const result = await summarizer.summarize(story);

  assert.equal(result.source, 'fallback');
  assert.equal(result.bullets.length, 3);
  assert.equal(model.calls.length, 0);
});

test('with an API key the summarizer uses the model reply', async () => {
  const model = fakeModel(GOOD_REPLY);
  const summarizer = createSummarizer({
    apiKey: 'test-key',
    fetchFn: model.fetchFn,
  });

  const result = await summarizer.summarize(story);

  assert.equal(result.source, 'model');
  assert.equal(result.bullets[0], 'The bridge closes in March.');

  // The key goes in a header, and the story text goes in the request body.
  const { options } = model.calls[0];
  assert.equal(options.headers['x-api-key'], 'test-key');
  assert.match(options.body, /The bridge will close in March/);
});

test('falls back when the model API returns an error', async () => {
  const model = fakeModel('', { status: 500 });
  const summarizer = createSummarizer({
    apiKey: 'test-key',
    fetchFn: model.fetchFn,
  });

  assert.equal((await summarizer.summarize(story)).source, 'fallback');
});

test('falls back when the model reply is not in the format we asked for', async () => {
  const model = fakeModel('I think this story is about a bridge.');
  const summarizer = createSummarizer({
    apiKey: 'test-key',
    fetchFn: model.fetchFn,
  });

  const result = await summarizer.summarize(story);
  assert.equal(result.source, 'fallback');
  assert.equal(result.bullets.length, 3);
});

test('falls back when the network call itself fails', async () => {
  const fetchFn = async () => {
    throw new Error('network down');
  };
  const summarizer = createSummarizer({ apiKey: 'test-key', fetchFn });

  assert.equal((await summarizer.summarize(story)).source, 'fallback');
});
