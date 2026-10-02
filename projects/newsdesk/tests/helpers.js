import { createApp } from '../server/app.js';
import { openDatabase } from '../server/db.js';
import { DEMO_PASSWORD, seed } from '../server/seed.js';

/**
 * Starts the real app on a free port with a fresh in-memory database.
 * Tests then talk to it over HTTP with fetch, exactly like a browser would.
 */
export async function startTestServer() {
  const db = openDatabase(':memory:');
  seed(db);

  const server = createApp(db).listen(0); // port 0 = "pick any free port"
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://localhost:${server.address().port}`;

  return {
    db,
    /** A pretend browser: it remembers the session cookie between requests. */
    client() {
      let cookie = '';

      async function request(method, path, body) {
        const response = await fetch(baseUrl + path, {
          method,
          headers: { 'Content-Type': 'application/json', Cookie: cookie },
          body: body === undefined ? undefined : JSON.stringify(body),
        });

        const setCookie = response.headers.get('set-cookie');
        if (setCookie) cookie = setCookie.split(';')[0];

        const text = await response.text();
        return { status: response.status, body: text ? JSON.parse(text) : null, headers: response.headers };
      }

      return {
        get: (path) => request('GET', path),
        post: (path, body = {}) => request('POST', path, body),
        put: (path, body) => request('PUT', path, body),
        delete: (path) => request('DELETE', path),
        login: (email, password = DEMO_PASSWORD) =>
          request('POST', '/api/auth/login', { email, password }),
      };
    },
    baseUrl,
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

export const REPORTER = 'reporter@newsdesk.test';
export const OTHER_REPORTER = 'sam@newsdesk.test';
export const EDITOR = 'editor@newsdesk.test';

export const VALID_STORY = {
  title: 'School board sets dates for spring term',
  summary: 'Classes resume on the second Monday of January.',
  body: 'The school board confirmed the spring term calendar at its meeting on Monday evening.',
  topic: 'politics',
};
