import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { openDatabase } from './db.js';
import { seed } from './seed.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ?? 3003;
const DATABASE_FILE = process.env.DATABASE_FILE ?? path.join(here, '..', 'data', 'pulse.db');
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

const db = openDatabase(DATABASE_FILE);

const { count } = db.prepare('SELECT COUNT(*) AS count FROM requests').get();
if (count === 0) {
  seed(db);
  console.log('Empty database: added 24 hours of demo traffic.');
}

// The dashboard only looks back 24 hours, so older rows are deleted every
// ten minutes. Without this the table would grow forever.
const deleteOld = db.prepare('DELETE FROM requests WHERE created_at < ?');
function prune() {
  deleteOld.run(Date.now() - ONE_DAY_MS);
}
prune();
setInterval(prune, 10 * 60 * 1000);

createApp(db).listen(PORT, () => {
  console.log(`Pulse API listening on http://localhost:${PORT}`);
});
