import { createApp } from '../server/app.js';
import { openDatabase } from '../server/db.js';
import { createSummarizer } from '../server/lib/ai.js';
import { seed } from '../server/seed.js';

/**
 * Starts the real app on a free port with a fresh in-memory database.
 * Pass a summarizer to test the AI path with a fake model.
 */
export async function startTestServer(summarizer = createSummarizer()) {
  const db = openDatabase(':memory:');
  seed(db);

  const server = createApp(db, summarizer).listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  const baseUrl = `http://localhost:${server.address().port}`;

  async function request(method, path, body) {
    const response = await fetch(baseUrl + path, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: response.status, body: await response.json() };
  }

  return {
    db,
    baseUrl,
    get: (path) => request('GET', path),
    post: (path, body = {}) => request('POST', path, body),
    close: () => new Promise((resolve) => server.close(resolve)),
  };
}

/**
 * A fake `fetch` that pretends to be the AI model API.
 * It records every call so tests can check how often it was used.
 */
export function fakeModel(replyText, { status = 200 } = {}) {
  const calls = [];
  async function fetchFn(url, options) {
    calls.push({ url, options });
    return {
      ok: status >= 200 && status < 300,
      status,
      json: async () => ({ content: [{ type: 'text', text: replyText }] }),
    };
  }
  return { fetchFn, calls };
}
