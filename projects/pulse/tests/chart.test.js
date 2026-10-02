import test from 'node:test';
import assert from 'node:assert/strict';
import { linePath, niceMax, sortRows } from '../src/lib/chart.js';

test('niceMax rounds up to a tidy axis value', () => {
  assert.equal(niceMax(87), 100);
  assert.equal(niceMax(12), 20);
  assert.equal(niceMax(430), 500);
  assert.equal(niceMax(3.2), 4);
  assert.equal(niceMax(100), 100);
});

test('niceMax never returns 0, so an empty chart still has an axis', () => {
  assert.equal(niceMax(0), 1);
});

test('linePath starts with a move and continues with lines', () => {
  assert.equal(linePath([{ x: 0, y: 10 }, { x: 20, y: 5 }]), 'M 0.0 10.0 L 20.0 5.0');
  assert.equal(linePath([]), '');
});

test('sortRows sorts numbers and text in both directions without changing the input', () => {
  const rows = [
    { route: '/b', p95Ms: 30 },
    { route: '/a', p95Ms: 200 },
    { route: '/c', p95Ms: 5 },
  ];

  assert.deepEqual(sortRows(rows, 'p95Ms', 'desc').map((row) => row.route), ['/a', '/b', '/c']);
  assert.deepEqual(sortRows(rows, 'route', 'asc').map((row) => row.route), ['/a', '/b', '/c']);
  assert.equal(rows[0].route, '/b'); // original order untouched
});
