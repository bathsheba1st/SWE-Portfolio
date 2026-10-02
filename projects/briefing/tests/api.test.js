import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import { createSummarizer } from '../server/lib/ai.js';
import { fakeModel, startTestServer } from './helpers.js';

let server;
before(async () => {
  server = await startTestServer();
});
after(() => server.close());

// --- Listing and searching -----

test('the list is paginated, newest first', async () => {
  const { status, body } = await server.get('/api/stories');

  assert.equal(status, 200);
  assert.equal(body.stories.length, 5);
  assert.equal(body.total, 12);
  assert.equal(body.pageCount, 3);

  const dates = body.stories.map((story) => story.published_at);
  assert.deepEqual(dates, [...dates].sort().reverse());
});

test('list items carry a reading time but not the full text', async () => {
  const { body } = await server.get('/api/stories');
  assert.equal(body.stories[0].body, undefined);
  assert.ok(body.stories[0].reading_minutes >= 1);
});

test('the last page holds the leftovers and pages do not overlap', async () => {
  const first = (await server.get('/api/stories?page=1')).body.stories.map(
    (s) => s.slug,
  );
  const third = (await server.get('/api/stories?page=3')).body.stories.map(
    (s) => s.slug,
  );

  assert.equal(third.length, 2);
  assert.equal(first.filter((slug) => third.includes(slug)).length, 0);
});

test('a page number that is too big or not a number is corrected', async () => {
  assert.equal((await server.get('/api/stories?page=99')).body.page, 3);
  assert.equal((await server.get('/api/stories?page=abc')).body.page, 1);
});

test('filter by topic', async () => {
  const { body } = await server.get('/api/stories?topic=science');
  assert.equal(body.total, 2);
  assert.ok(body.stories.every((story) => story.topic === 'science'));
});

test('search looks in the title, dek and body, ignoring case', async () => {
  const { body } = await server.get('/api/stories?q=BAKERY');
  assert.equal(body.total, 1);
  assert.equal(body.stories[0].slug, 'corner-bakery-cooperative');
});

test('search and topic can be combined', async () => {
  assert.equal(
    (await server.get('/api/stories?q=bus&topic=technology')).body.total,
    1,
  );
  assert.equal(
    (await server.get('/api/stories?q=bus&topic=science')).body.total,
    0,
  );
});

test('search treats % and quotes as plain text, not as SQL', async () => {
  assert.equal((await server.get('/api/stories?q=%25')).body.total, 0); // %25 is "%"
  const injection = await server.get(
    `/api/stories?q=${encodeURIComponent("' OR 1=1 --")}`,
  );
  assert.equal(injection.status, 200);
  assert.equal(injection.body.total, 0);
});

test('topics come with story counts', async () => {
  const { body } = await server.get('/api/topics');
  assert.deepEqual(
    body.topics.find((item) => item.topic === 'technology'),
    {
      topic: 'technology',
      count: 3,
    },
  );
});

test('one story by slug, and 404 for an unknown slug', async () => {
  const found = await server.get('/api/stories/night-sky-count');
  assert.equal(
    found.body.story.title,
    'Volunteers count stars to measure light pollution',
  );
  assert.equal((await server.get('/api/stories/no-such-story')).status, 404);
});

// --- Summaries ------

test('without an AI key the summary is three sentences taken from the story', async () => {
  const story = (await server.get('/api/stories/night-sky-count')).body.story;
  const { status, body } = await server.post(
    '/api/stories/night-sky-count/summary',
  );

  assert.equal(status, 200);
  assert.equal(body.source, 'fallback');
  assert.equal(body.bullets.length, 3);
  for (const bullet of body.bullets) {
    assert.ok(
      story.body.includes(bullet),
      `"${bullet}" should come from the story`,
    );
  }
});

test('a model summary is saved, so the model is only called once per story', async () => {
  const model = fakeModel('- Point one.\n- Point two.\n- Point three.');
  const aiServer = await startTestServer(
    createSummarizer({ apiKey: 'test-key', fetchFn: model.fetchFn }),
  );

  const first = await aiServer.post('/api/stories/mural-underpass/summary');
  const second = await aiServer.post('/api/stories/mural-underpass/summary');
  await aiServer.close();

  assert.equal(first.body.source, 'model');
  assert.deepEqual(second.body, first.body);
  assert.equal(model.calls.length, 1);
});

test('summary for an unknown story is a 404', async () => {
  assert.equal(
    (await server.post('/api/stories/no-such-story/summary')).status,
    404,
  );
});

// --- Newsletter sign-up -----

test('sign-up rejects an invalid email', async () => {
  const { status, body } = await server.post('/api/subscribers', {
    email: 'not-an-email',
  });
  assert.equal(status, 422);
  assert.match(body.error, /valid email/);
});

test('sign-up stores the email once, even if sent twice, with the same answer', async () => {
  const first = await server.post('/api/subscribers', {
    email: 'Reader@Example.com',
  });
  const second = await server.post('/api/subscribers', {
    email: 'reader@example.com ',
  });

  assert.equal(first.status, 201);
  assert.deepEqual(second, first);

  const rows = server.db.prepare('SELECT email FROM subscribers').all();
  assert.deepEqual(
    rows.map((row) => row.email),
    ['reader@example.com'],
  );
});

test('sign-up is rate limited', async () => {
  const limited = await startTestServer();
  const statuses = [];
  for (let i = 0; i < 6; i += 1) {
    statuses.push(
      (await limited.post('/api/subscribers', { email: `a${i}@example.com` }))
        .status,
    );
  }
  await limited.close();

  assert.deepEqual(statuses, [201, 201, 201, 201, 201, 429]);
});
