import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { openDatabase } from './db.js';
import { hashPassword } from './lib/passwords.js';
import { slugify } from './lib/validate.js';

// Demo data. Every name and story here is invented.
export const DEMO_PASSWORD = 'newsdesk-demo';

const USERS = [
  { name: 'Riley Chen', email: 'reporter@newsdesk.test', role: 'reporter' },
  { name: 'Sam Okafor', email: 'sam@newsdesk.test', role: 'reporter' },
  { name: 'Morgan Diaz', email: 'editor@newsdesk.test', role: 'editor' },
];

const STORIES = [
  {
    author: 0, status: 'published', topic: 'politics',
    title: 'City council approves budget after late-night session',
    summary: 'The vote passed 7 to 2 and adds money for road repairs and library hours.',
    body: 'The city council approved next year\'s budget shortly before midnight on Tuesday.\n\nThe plan adds funding for road repairs and extends weekend hours at three library branches. Two members voted against it, saying the reserve fund is too small.\n\nThe budget takes effect at the start of the next fiscal year.',
  },
  {
    author: 1, status: 'published', topic: 'technology',
    title: 'Transit agency tests tap-to-pay on downtown bus routes',
    summary: 'Riders on four routes can pay with a phone or bank card during a three-month trial.',
    body: 'The transit agency began a three-month trial of tap-to-pay readers on four downtown bus routes this week.\n\nRiders can hold a phone or contactless bank card to the reader instead of buying a ticket in advance. Paper tickets and passes still work.\n\nThe agency says it will decide whether to expand the system after reviewing boarding times and rider feedback.',
  },
  {
    author: 0, status: 'in_review', topic: 'business',
    title: 'Farmers market moves indoors for the winter season',
    summary: 'Vendors will set up in the old train depot from November through March.',
    body: 'The weekly farmers market will move into the old train depot for the winter, organizers said.\n\nAbout forty vendors have signed up for indoor stalls, slightly more than last year. The depot has heating and step-free access from the main street.\n\nThe outdoor market is expected to return in April.',
  },
  {
    author: 1, status: 'in_review', topic: 'science',
    title: 'University researchers map tree cover street by street',
    summary: 'The map shows which neighborhoods have the least shade in summer.',
    body: 'A team at the university has published a street-by-street map of tree cover across the city.\n\nThe researchers combined aerial photos with ground surveys carried out by student volunteers. The map shows that shade is spread unevenly, with some neighborhoods having less than half the average cover.\n\nThe city\'s parks department says it will use the map to plan next year\'s planting.',
  },
  {
    author: 0, status: 'draft', topic: 'world',
    title: 'Sister-city exchange brings visiting students for two weeks',
    summary: 'Twenty students will stay with host families and attend local schools.',
    body: 'Twenty students from the city\'s sister city arrive next month for a two-week exchange.\n\nThey will stay with host families and join classes at two local high schools. A return visit is planned for the spring.\n\nNotes: confirm arrival date with the school district before filing.',
  },
  {
    author: 1, status: 'draft', topic: 'business',
    title: 'Main street bookshop to reopen under new owners',
    summary: 'The shop closed in the summer and is expected to reopen before the holidays.',
    body: 'The bookshop on Main Street is set to reopen under new owners, according to a notice in the window.\n\nThe shop closed over the summer after more than twenty years. The new owners say they plan to keep the children\'s section and add a small reading area.\n\nNotes: waiting on a call back about the opening date.',
  },
];

/** Empties the tables and fills them with the demo data. */
export function seed(db) {
  db.exec('DELETE FROM story_events; DELETE FROM stories; DELETE FROM sessions; DELETE FROM users;');

  const insertUser = db.prepare(
    'INSERT INTO users (name, email, password_hash, role, created_at) VALUES (?, ?, ?, ?, ?)',
  );
  const insertStory = db.prepare(`
    INSERT INTO stories
      (title, slug, summary, body, topic, status, author_id, created_at, updated_at, published_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const insertEvent = db.prepare(
    'INSERT INTO story_events (story_id, user_id, action, created_at) VALUES (?, ?, ?, ?)',
  );

  const now = Date.now();
  const userIds = USERS.map((user) => {
    const result = insertUser.run(
      user.name, user.email, hashPassword(DEMO_PASSWORD), user.role, new Date(now).toISOString(),
    );
    return Number(result.lastInsertRowid);
  });

  STORIES.forEach((story, index) => {
    // Spread the stories out so each was last updated a few hours apart.
    const time = new Date(now - (index + 1) * 3 * 60 * 60 * 1000).toISOString();
    const authorId = userIds[story.author];
    const result = insertStory.run(
      story.title, slugify(story.title), story.summary, story.body, story.topic, story.status,
      authorId, time, time, story.status === 'published' ? time : null,
    );
    insertEvent.run(Number(result.lastInsertRowid), authorId, 'created', time);
  });
}

// `npm run seed` runs this file directly and resets the real database.
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const here = path.dirname(fileURLToPath(import.meta.url));
  const file = process.env.DATABASE_FILE ?? path.join(here, '..', 'data', 'newsdesk.db');
  seed(openDatabase(file));
  console.log(`Reset ${file} with demo data.`);
  console.log(`Sign in as reporter@newsdesk.test or editor@newsdesk.test, password "${DEMO_PASSWORD}".`);
}
