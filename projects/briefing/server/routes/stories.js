import express from 'express';
import { createRateLimiter } from '../lib/rateLimit.js';
import { readingMinutes } from '../lib/text.js';
import { escapeLike, parsePage } from '../lib/validate.js';

export const PAGE_SIZE = 5;

export function storyRoutes(db, summarizer) {
  const router = express.Router();

  // Summaries can cost money (an AI call), so each visitor gets 20 a minute.
  const summaryLimiter = createRateLimiter({ limit: 20, windowMs: 60 * 1000 });

  const findBySlug = db.prepare('SELECT * FROM stories WHERE slug = ?');
  const findSummary = db.prepare('SELECT bullets, source FROM summaries WHERE story_id = ?');
  const saveSummary = db.prepare(`
    INSERT INTO summaries (story_id, bullets, source, created_at) VALUES (?, ?, ?, ?)
    ON CONFLICT (story_id) DO UPDATE SET
      bullets = excluded.bullets, source = excluded.source, created_at = excluded.created_at
  `);

  // GET /api/stories?topic=science&q=tree&page=2
  router.get('/', (req, res) => {
    const conditions = [];
    const params = [];

    if (typeof req.query.topic === 'string' && req.query.topic) {
      conditions.push('topic = ?');
      params.push(req.query.topic);
    }

    const search = typeof req.query.q === 'string' ? req.query.q.trim().slice(0, 100) : '';
    if (search) {
      const pattern = `%${escapeLike(search)}%`;
      conditions.push(
        "(title LIKE ? ESCAPE '\\' OR dek LIKE ? ESCAPE '\\' OR body LIKE ? ESCAPE '\\')",
      );
      params.push(pattern, pattern, pattern);
    }

    // Only fixed pieces of SQL are joined here; the reader's input stays in `params`.
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { total } = db.prepare(`SELECT COUNT(*) AS total FROM stories ${where}`).get(...params);
    const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
    const page = Math.min(parsePage(req.query.page), pageCount);

    const rows = db
      .prepare(`
        SELECT slug, title, dek, body, topic, author, published_at
        FROM stories ${where}
        ORDER BY published_at DESC
        LIMIT ? OFFSET ?
      `)
      .all(...params, PAGE_SIZE, (page - 1) * PAGE_SIZE);

    // The list does not need the full text, only how long it takes to read.
    const stories = rows.map(({ body, ...story }) => ({
      ...story,
      reading_minutes: readingMinutes(body),
    }));

    res.json({ stories, total, page, pageCount });
  });

  router.get('/:slug', (req, res) => {
    const story = findBySlug.get(req.params.slug);
    if (!story) return res.status(404).json({ error: 'Story not found.' });

    res.json({ story: { ...story, reading_minutes: readingMinutes(story.body) } });
  });

  // POST /api/stories/:slug/summary -> { bullets: [...], source: 'model' | 'fallback' }
  router.post('/:slug/summary', async (req, res) => {
    const story = findBySlug.get(req.params.slug);
    if (!story) return res.status(404).json({ error: 'Story not found.' });

    // Use the saved summary if we have one. The exception: a saved fallback
    // is replaced once an AI model becomes available.
    const saved = findSummary.get(story.id);
    if (saved && (saved.source === 'model' || !summarizer.usesModel)) {
      return res.json({ bullets: JSON.parse(saved.bullets), source: saved.source });
    }

    if (summaryLimiter.isBlocked(req.ip)) {
      return res.status(429).json({ error: 'Too many requests. Try again in a minute.' });
    }
    summaryLimiter.hit(req.ip);

    const { bullets, source } = await summarizer.summarize(story);
    saveSummary.run(story.id, JSON.stringify(bullets), source, new Date().toISOString());
    res.json({ bullets, source });
  });

  return router;
}

export function topicRoutes(db) {
  const router = express.Router();

  // GET /api/topics -> [{ topic: 'science', count: 3 }, ...]
  router.get('/', (req, res) => {
    const topics = db
      .prepare('SELECT topic, COUNT(*) AS count FROM stories GROUP BY topic ORDER BY topic')
      .all();
    res.json({ topics });
  });

  return router;
}
