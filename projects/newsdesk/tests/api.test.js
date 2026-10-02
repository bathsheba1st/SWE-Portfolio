import test, { after, before } from 'node:test';
import assert from 'node:assert/strict';
import {
  EDITOR,
  OTHER_REPORTER,
  REPORTER,
  VALID_STORY,
  startTestServer,
} from './helpers.js';

let server;
before(async () => {
  server = await startTestServer();
});
after(() => server.close());

/** Finds a seeded story by status and author email, straight from the database. */
function seededStory(status, email) {
  return server.db
    .prepare(
      `
      SELECT stories.id FROM stories JOIN users ON users.id = stories.author_id
      WHERE stories.status = ? AND users.email = ?
    `,
    )
    .get(status, email);
}

// --- Signing in --------

test('stories are private: 401 without a session', async () => {
  const response = await server.client().get('/api/stories');
  assert.equal(response.status, 401);
});

test('login rejects a wrong password with a generic message', async () => {
  const wrongPassword = await server.client().login(REPORTER, 'nope');
  const unknownUser = await server
    .client()
    .login('nobody@newsdesk.test', 'nope');

  assert.equal(wrongPassword.status, 401);
  assert.equal(unknownUser.status, 401);
  assert.equal(wrongPassword.body.error, unknownUser.body.error);
});

test('login sets an HttpOnly, SameSite=Strict cookie and never returns the password hash', async () => {
  const response = await server.client().login(REPORTER);

  assert.equal(response.status, 200);
  assert.equal(response.body.user.role, 'reporter');
  assert.equal(response.body.user.password_hash, undefined);

  const cookie = response.headers.get('set-cookie');
  assert.match(cookie, /HttpOnly/);
  assert.match(cookie, /SameSite=Strict/);
});

test('logout ends the session', async () => {
  const client = server.client();
  await client.login(REPORTER);
  assert.equal((await client.get('/api/auth/me')).body.user.email, REPORTER);

  await client.post('/api/auth/logout');
  assert.equal((await client.get('/api/stories')).status, 401);
});

test('login is rate limited after 5 wrong passwords', async () => {
  const client = server.client();
  for (let i = 0; i < 5; i += 1) {
    assert.equal((await client.login(OTHER_REPORTER, 'wrong')).status, 401);
  }
  // Even the right password is refused until the window passes.
  assert.equal((await client.login(OTHER_REPORTER)).status, 429);
});

test('requests that change data must be JSON (CSRF defense)', async () => {
  const response = await fetch(`${server.baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: 'email=a&password=b',
  });
  assert.equal(response.status, 415);
});

test('malformed JSON gets a 400, not a crash', async () => {
  const response = await fetch(`${server.baseUrl}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: '{"email": ',
  });
  assert.equal(response.status, 400);
});

// --- Stories -------

test('the list can be filtered by status and by "mine"', async () => {
  const client = server.client();
  await client.login(REPORTER);

  const drafts = (await client.get('/api/stories?status=draft')).body.stories;
  assert.ok(drafts.length > 0);
  assert.ok(drafts.every((story) => story.status === 'draft'));

  const mine = (await client.get('/api/stories?mine=1')).body.stories;
  assert.ok(mine.length > 0);
  assert.ok(mine.every((story) => story.author_name === 'Riley Chen'));
});

test('creating a story validates the fields', async () => {
  const client = server.client();
  await client.login(REPORTER);

  const response = await client.post('/api/stories', {
    ...VALID_STORY,
    title: 'Hi',
  });
  assert.equal(response.status, 422);
  assert.ok(response.body.fields.title);
});

test('a new story starts as a draft with a unique slug', async () => {
  const client = server.client();
  await client.login(REPORTER);

  const first = await client.post('/api/stories', VALID_STORY);
  const second = await client.post('/api/stories', VALID_STORY);

  assert.equal(first.status, 201);
  assert.equal(first.body.story.status, 'draft');
  assert.equal(
    first.body.story.slug,
    'school-board-sets-dates-for-spring-term',
  );
  assert.equal(
    second.body.story.slug,
    'school-board-sets-dates-for-spring-term-2',
  );
});

test('SQL injection attempts are stored as plain text', async () => {
  const client = server.client();
  await client.login(REPORTER);

  const title = "Robert'); DROP TABLE stories;--";
  const created = await client.post('/api/stories', { ...VALID_STORY, title });

  assert.equal(created.status, 201);
  assert.equal(created.body.story.title, title);
  assert.equal((await client.get('/api/stories')).status, 200); // table still there
});

test("a reporter cannot edit or delete another reporter's draft", async () => {
  const client = server.client();
  await client.login(REPORTER);
  const { id } = seededStory('draft', OTHER_REPORTER);

  assert.equal(
    (await client.put(`/api/stories/${id}`, VALID_STORY)).status,
    403,
  );
  assert.equal((await client.delete(`/api/stories/${id}`)).status, 403);
});

test('a reporter cannot publish, even their own story', async () => {
  const client = server.client();
  await client.login(REPORTER);
  const { id } = seededStory('in_review', REPORTER);

  const response = await client.post(`/api/stories/${id}/status`, {
    status: 'published',
  });
  assert.equal(response.status, 403);
});

test('the full workflow: write, send for review, publish', async () => {
  const reporter = server.client();
  await reporter.login(REPORTER);
  const editor = server.client();
  await editor.login(EDITOR);

  const { story } = (
    await reporter.post('/api/stories', {
      ...VALID_STORY,
      title: 'Workflow test story',
    })
  ).body;
  assert.deepEqual(story.permissions.nextStatuses, ['in_review']);

  const sent = await reporter.post(`/api/stories/${story.id}/status`, {
    status: 'in_review',
  });
  assert.equal(sent.body.story.status, 'in_review');
  assert.equal(sent.body.story.permissions.canEdit, false); // locked while in review

  const published = await editor.post(`/api/stories/${story.id}/status`, {
    status: 'published',
  });
  assert.equal(published.body.story.status, 'published');
  assert.ok(published.body.story.published_at);

  // The history records each step and who did it, newest first.
  const actions = published.body.events.map(
    (event) => `${event.user_name}: ${event.action}`,
  );
  assert.deepEqual(actions, [
    'Morgan Diaz: moved to published',
    'Riley Chen: moved to in_review',
    'Riley Chen: created',
  ]);
});

test('deleting a story also deletes its history', async () => {
  const client = server.client();
  await client.login(EDITOR);
  const { story } = (
    await client.post('/api/stories', {
      ...VALID_STORY,
      title: 'Story to delete',
    })
  ).body;

  assert.equal((await client.delete(`/api/stories/${story.id}`)).status, 204);
  assert.equal((await client.get(`/api/stories/${story.id}`)).status, 404);

  const { count } = server.db
    .prepare('SELECT COUNT(*) AS count FROM story_events WHERE story_id = ?')
    .get(story.id);
  assert.equal(count, 0);
});

test('unknown ids and unknown routes return 404', async () => {
  const client = server.client();
  await client.login(REPORTER);

  assert.equal((await client.get('/api/stories/999999')).status, 404);
  assert.equal((await client.get('/api/stories/abc')).status, 404);
  assert.equal((await client.get('/api/nothing-here')).status, 404);
});
