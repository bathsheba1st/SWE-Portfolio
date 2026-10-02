import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from './db.js';

// Invented traffic for the last 24 hours, so the dashboard has something
// to show the first time it opens.

const ROUTES = [
  { method: 'GET', route: '/api/demo/headlines', share: 0.45, minMs: 5, maxMs: 30, errorChance: 0.002 },
  { method: 'GET', route: '/api/demo/stories/:id', share: 0.3, minMs: 10, maxMs: 60, errorChance: 0.005 },
  { method: 'GET', route: '/api/demo/search', share: 0.15, minMs: 80, maxMs: 400, errorChance: 0.01 },
  { method: 'POST', route: '/api/demo/subscribe', share: 0.1, minMs: 20, maxMs: 80, errorChance: 0.08 },
];

/**
 * A random number generator that gives the same numbers every time for the
 * same seed, so the demo data (and the tests) are repeatable.
 */
function createRandom(seedNumber) {
  let state = seedNumber;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
}

function pickRoute(random) {
  let roll = random();
  for (const route of ROUTES) {
    if (roll < route.share) return route;
    roll -= route.share;
  }
  return ROUTES[0];
}

/** Empties the table and fills it with 24 hours of traffic ending at `now`. */
export function seed(db, now = Date.now()) {
  const random = createRandom(42);
  const insert = db.prepare(`
    INSERT INTO requests (method, route, status, duration_ms, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const MINUTE = 60 * 1000;
  // A made-up incident: for 25 minutes, about three hours ago, everything
  // was four times slower and half of the story and search requests failed.
  // It shows up clearly in the 24 hour charts.
  const incidentStart = now - 190 * MINUTE;
  const incidentEnd = incidentStart + 25 * MINUTE;

  // One transaction for all the inserts is far faster than thousands of
  // small ones, because SQLite writes to disk once instead of every time.
  db.exec('BEGIN');
  db.exec('DELETE FROM requests');

  for (let minute = 24 * 60; minute >= 1; minute -= 1) {
    const minuteStart = now - minute * MINUTE;

    // Traffic rises and falls over the day like a wave: roughly 2 to 12 a minute.
    const wave = Math.sin((minute / (24 * 60)) * Math.PI * 2);
    const requestsThisMinute = Math.round(6 + 4 * wave + random() * 2);

    for (let i = 0; i < requestsThisMinute; i += 1) {
      const route = pickRoute(random);
      const createdAt = Math.floor(minuteStart + random() * MINUTE);
      const inIncident = createdAt >= incidentStart && createdAt < incidentEnd;

      let duration = route.minMs + random() * (route.maxMs - route.minMs);
      let failed = random() < route.errorChance;
      if (inIncident) {
        duration *= 4;
        if (route.method === 'GET' && route.route !== '/api/demo/headlines') {
          failed = random() < 0.5;
        }
      }

      const okStatus = route.method === 'POST' ? 201 : 200;
      insert.run(route.method, route.route, failed ? 500 : okStatus, duration, createdAt);
    }
  }

  db.exec('COMMIT');
}

// `npm run seed` runs this file directly and resets the real database.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const file = process.env.DATABASE_FILE ?? path.join(here, '..', 'data', 'pulse.db');
  seed(openDatabase(file));
  console.log(`Reset ${file} with 24 hours of demo traffic.`);
}
