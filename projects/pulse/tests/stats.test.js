import test from 'node:test';
import assert from 'node:assert/strict';
import { errorRate, fillBuckets, percentile } from '../server/lib/stats.js';

test('percentile of an empty list is 0', () => {
  assert.equal(percentile([], 95), 0);
});

test('percentile uses the nearest-rank method', () => {
  const oneToHundred = Array.from({ length: 100 }, (_, index) => index + 1);
  assert.equal(percentile(oneToHundred, 95), 95);
  assert.equal(percentile(oneToHundred, 50), 50);
  assert.equal(percentile(oneToHundred, 100), 100);
});

test('percentile shows the slow request that the average hides', () => {
  const durations = [10, 10, 10, 10, 10, 10, 10, 10, 10, 900];
  const average = durations.reduce((sum, value) => sum + value, 0) / durations.length;

  assert.equal(average, 99);
  assert.equal(percentile(durations, 50), 10); // the typical request
  assert.equal(percentile(durations, 95), 900); // the slow one
});

test('percentile of a single value is that value', () => {
  assert.equal(percentile([42], 95), 42);
});

test('errorRate is a percentage with one decimal place', () => {
  assert.equal(errorRate(1, 3), 33.3);
  assert.equal(errorRate(0, 50), 0);
  assert.equal(errorRate(50, 50), 100);
});

test('errorRate does not divide by zero', () => {
  assert.equal(errorRate(0, 0), 0);
});

test('fillBuckets adds empty buckets so the time axis has no holes', () => {
  const rows = [
    { start: 1000, requests: 4, errors: 1, avgMs: 20.4 },
    { start: 3000, requests: 2, errors: 0, avgMs: 9.6 },
  ];

  assert.deepEqual(fillBuckets(rows, { from: 1000, to: 4999, bucketMs: 1000 }), [
    { start: 1000, requests: 4, errors: 1, errorRate: 25, avgMs: 20 },
    { start: 2000, requests: 0, errors: 0, errorRate: 0, avgMs: 0 },
    { start: 3000, requests: 2, errors: 0, errorRate: 0, avgMs: 10 },
    { start: 4000, requests: 0, errors: 0, errorRate: 0, avgMs: 0 },
  ]);
});

test('fillBuckets lines the first bucket up with the clock', () => {
  const buckets = fillBuckets([], { from: 1500, to: 3500, bucketMs: 1000 });
  assert.deepEqual(buckets.map((bucket) => bucket.start), [1000, 2000, 3000]);
});
