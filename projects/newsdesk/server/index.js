import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { openDatabase } from './db.js';
import { seed } from './seed.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ?? 3001;
const DATABASE_FILE = process.env.DATABASE_FILE ?? path.join(here, '..', 'data', 'newsdesk.db');

const db = openDatabase(DATABASE_FILE);

// First run: add the demo users and stories so there is something to see.
const { count } = db.prepare('SELECT COUNT(*) AS count FROM users').get();
if (count === 0) {
  seed(db);
  console.log('Empty database: added demo users and stories.');
}

createApp(db).listen(PORT, () => {
  console.log(`Newsdesk API listening on http://localhost:${PORT}`);
});
