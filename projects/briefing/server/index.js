import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createApp } from './app.js';
import { openDatabase } from './db.js';
import { createSummarizer } from './lib/ai.js';
import { seed } from './seed.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT ?? 3002;
const DATABASE_FILE = process.env.DATABASE_FILE ?? path.join(here, '..', 'data', 'briefing.db');

const db = openDatabase(DATABASE_FILE);

const { count } = db.prepare('SELECT COUNT(*) AS count FROM stories').get();
if (count === 0) {
  seed(db);
  console.log('Empty database: added demo stories.');
}

// The API key is read from the environment and never sent to the browser.
// Start with:  ANTHROPIC_API_KEY=your-key npm run dev
const summarizer = createSummarizer({
  apiKey: process.env.ANTHROPIC_API_KEY,
  model: process.env.AI_MODEL,
});
console.log(
  summarizer.usesModel
    ? 'Summaries: AI model, with the built-in summary as a fallback.'
    : 'Summaries: built-in summary (set ANTHROPIC_API_KEY to use an AI model).',
);

createApp(db, summarizer).listen(PORT, () => {
  console.log(`Briefing API listening on http://localhost:${PORT}`);
});
