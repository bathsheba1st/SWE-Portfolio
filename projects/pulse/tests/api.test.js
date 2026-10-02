import test from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../server/app.js';
import { openDatabase } from '../server/db.js';
import { seed } from '../server/seed.js';

const MINUTE = 60 * 1000;
// A fixed "current time" so the tests give the same answer every day.
const NOW = Date.UTC(2026, 0, 15, 12, 0, 0);

/** Starts the real app on a free port with an empty in-memory database. */
async function startTestServer(options) {
  const db = openDatabase(':memory:');
  const server = createApp(db, options).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://localhost:${server.address().port}`;

  return {
    db,
    get: async (path) => {
      const response = await fetch(baseUrl + path);
      return { status: response.status, body: await response.json() };
    },
    addRequest: (route, status, durationMs, minutesAgo) => {
      db.prepare(
        `
        INSERT INTO requests (method, route, status, duration_ms, created_at)
        VALUES ('GET', ?, ?, ?, ?)
      `,
      ).run(route, status, durationMs, NOW - minutesAgo * MINUTE);
    },
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

// --- Recording -------

test('every demo request is recorded with its route pattern, status and duration', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  await server.get('/api/demo/headlines');
  await server.get('/api/demo/stories/7');
  await server.get('/api/demo/stories/8?ref=home');

  const rows = server.db.prepare('SELECT * FROM requests ORDER BY id').all();
  assert.deepEqual(
    rows.map((row) => row.route),
    [
      '/api/demo/headlines',
      '/api/demo/stories/:id', // not /stories/7
      '/api/demo/stories/:id', // not /stories/8?ref=home
    ],
  );
  assert.ok(rows.every((row) => row.method === 'GET' && row.status === 200));
  assert.ok(rows.every((row) => row.duration_ms > 0));
});

test('requests to unknown demo addresses are recorded under one name', async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  assert.equal((await server.get('/api/demo/nothing-here')).status, 404);
  assert.equal((await server.get('/api/demo/also-nothing')).status, 404);

  const rows = server.db.prepare('SELECT route, status FROM requests').all();
  assert.deepEqual(
    rows.map((row) => `${row.status} ${row.route}`),
    ['404 (no matching route)', '404 (no matching route)'],
  );
});

test("the dashboard's own requests are not recorded", async (t) => {
  const server = await startTestServer();
  t.after(() => server.close());

  await server.get('/api/metrics');
  const { count } = server.db
    .prepare('SELECT COUNT(*) AS count FROM requests')
    .get();
  assert.equal(count, 0);
});

// --- Metrics -------

test('metrics for an empty database are all zeros, not an error', async (t) => {
  const server = await startTestServer({ now: () => NOW });
  t.after(() => server.close());

  const { status, body } = await server.get('/api/metrics?range=15m');
  assert.equal(status, 200);
  assert.deepEqual(body.totals, {
    requests: 0,
    errors: 0,
    errorRate: 0,
    avgMs: 0,
    p95Ms: 0,
  });
  assert.equal(body.series.length, 15);
  assert.deepEqual(body.routes, []);
});

test('totals, chart buckets and per-route numbers add up', async (t) => {
  const server = await startTestServer({ now: () => NOW });
  t.after(() => server.close());

  server.addRequest('/a', 200, 10, 1.5);
  server.addRequest('/a', 200, 30, 1.5);
  server.addRequest('/a', 500, 50, 5.5);
  server.addRequest('/b', 200, 110, 5.5);
  server.addRequest('/a', 200, 999, 20); // older than 15 minutes: ignored

  const { body } = await server.get('/api/metrics?range=15m');

  assert.deepEqual(body.totals, {
    requests: 4,
    errors: 1,
    errorRate: 25,
    avgMs: 50,
    p95Ms: 110,
  });

  // 15 one-minute buckets, oldest first. Two of them have traffic.
  assert.equal(body.series.length, 15);
  const busy = body.series.filter((bucket) => bucket.requests > 0);
  assert.deepEqual(
    busy.map(({ requests, errors, avgMs }) => ({ requests, errors, avgMs })),
    [
      { requests: 2, errors: 1, avgMs: 80 },
      { requests: 2, errors: 0, avgMs: 20 },
    ],
  );

  const routeA = body.routes.find((row) => row.route === '/a');
  assert.deepEqual(routeA, {
    method: 'GET',
    route: '/a',
    requests: 3,
    errorRate: 33.3,
    avgMs: 30,
    p95Ms: 50,
  });
});

test('each range uses its own bucket size', async (t) => {
  const server = await startTestServer({ now: () => NOW });
  t.after(() => server.close());

  assert.equal(
    (await server.get('/api/metrics?range=1h')).body.series.length,
    12,
  );
  assert.equal(
    (await server.get('/api/metrics?range=24h')).body.series.length,
    24,
  );
});

test('an unknown range falls back to 1 hour', async (t) => {
  const server = await startTestServer({ now: () => NOW });
  t.after(() => server.close());

  assert.equal(
    (await server.get('/api/metrics?range=forever')).body.range,
    '1h',
  );
  assert.equal(
    (await server.get('/api/metrics?range=constructor')).body.range,
    '1h',
  );
});

test('the demo data is repeatable and includes the incident', async (t) => {
  const server = await startTestServer({ now: () => NOW });
  t.after(() => server.close());
  seed(server.db, NOW);

  const { body } = await server.get('/api/metrics?range=24h');
  assert.ok(body.totals.requests > 5000);

  // Search is the slowest route.
  const slowest = body.routes.reduce((a, b) => (b.p95Ms > a.p95Ms ? b : a));
  assert.equal(slowest.route, '/api/demo/search');

  const worstHour = body.series.reduce((worst, bucket) =>
    bucket.errorRate > worst.errorRate ? bucket : worst,
  );
  assert.ok(worstHour.errorRate > 5, 'one hour should stand out');
});
