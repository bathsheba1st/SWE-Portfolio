import test from 'node:test';
import assert from 'node:assert/strict';
import { hashPassword, verifyPassword } from '../server/lib/passwords.js';
import { createRateLimiter } from '../server/lib/rateLimit.js';
import { slugify, validateStory } from '../server/lib/validate.js';
import { VALID_STORY } from './helpers.js';

test('validateStory accepts a good story and trims spaces', () => {
  const { values, errors } = validateStory({ ...VALID_STORY, title: `  ${VALID_STORY.title}  ` });
  assert.deepEqual(errors, {});
  assert.equal(values.title, VALID_STORY.title);
});

test('validateStory reports every invalid field', () => {
  const { errors } = validateStory({ title: 'Hi', summary: '', body: 'short', topic: 'sports' });
  assert.deepEqual(Object.keys(errors).sort(), ['body', 'summary', 'title', 'topic']);
  assert.match(errors.title, /at least 5/);
});

test('validateStory copes with missing or wrong-typed input', () => {
  assert.equal(Object.keys(validateStory(undefined).errors).length, 4);
  assert.ok(validateStory({ ...VALID_STORY, title: 12345 }).errors.title);
});

test('validateStory rejects a title that is too long', () => {
  const { errors } = validateStory({ ...VALID_STORY, title: 'x'.repeat(121) });
  assert.match(errors.title, /at most 120/);
});

test('slugify makes a URL-friendly slug', () => {
  assert.equal(slugify('Council Approves New Budget!'), 'council-approves-new-budget');
  assert.equal(slugify('  Café   opens — again  '), 'cafe-opens-again');
  assert.equal(slugify('!!!'), 'story');
});

test('a password verifies against its own hash only', () => {
  const stored = hashPassword('correct horse');
  assert.equal(verifyPassword('correct horse', stored), true);
  assert.equal(verifyPassword('wrong horse', stored), false);
  assert.equal(verifyPassword('correct horse', 'not-a-real-hash'), false);
});

test('the same password hashes differently each time (random salt)', () => {
  assert.notEqual(hashPassword('same'), hashPassword('same'));
});

test('the rate limiter blocks after the limit and recovers after the window', () => {
  let time = 0;
  const limiter = createRateLimiter({ limit: 2, windowMs: 1000, now: () => time });

  limiter.hit('a');
  assert.equal(limiter.isBlocked('a'), false);
  limiter.hit('a');
  assert.equal(limiter.isBlocked('a'), true);
  assert.equal(limiter.isBlocked('b'), false); // other keys are unaffected

  time = 1001; // the window has passed
  assert.equal(limiter.isBlocked('a'), false);
});
