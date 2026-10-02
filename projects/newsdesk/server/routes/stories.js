import express from 'express';
import { canDelete, canEdit, nextStatuses } from '../lib/permissions.js';
import { slugify, validateStory } from '../lib/validate.js';

const STATUSES = ['draft', 'in_review', 'published'];

export function storyRoutes(db) {
  const router = express.Router();

  // Every query uses "?" placeholders. The values are sent to SQLite
  // separately from the SQL text, so user input can never change the query
  // (this is what prevents SQL injection).
  const findStory = db.prepare(`
    SELECT stories.*, users.name AS author_name
    FROM stories
    JOIN users ON users.id = stories.author_id
    WHERE stories.id = ?
  `);
  const findEvents = db.prepare(`
    SELECT story_events.id, story_events.action, story_events.created_at,
           users.name AS user_name
    FROM story_events
    JOIN users ON users.id = story_events.user_id
    WHERE story_events.story_id = ?
    ORDER BY story_events.id DESC
  `);
  const slugExists = db.prepare('SELECT 1 FROM stories WHERE slug = ?');
  const insertStory = db.prepare(`
    INSERT INTO stories (title, slug, summary, body, topic, author_id, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const updateStory = db.prepare(`
    UPDATE stories SET title = ?, summary = ?, body = ?, topic = ?, updated_at = ?
    WHERE id = ?
  `);
  const updateStatus = db.prepare(`
    UPDATE stories SET status = ?, published_at = ?, updated_at = ? WHERE id = ?
  `);
  const deleteStory = db.prepare('DELETE FROM stories WHERE id = ?');
  const insertEvent = db.prepare(`
    INSERT INTO story_events (story_id, user_id, action, created_at) VALUES (?, ?, ?, ?)
  `);

  /** "budget-vote" -> "budget-vote-2" if the first one is taken. */
  function uniqueSlug(title) {
    const base = slugify(title);
    let slug = base;
    let n = 2;
    while (slugExists.get(slug)) {
      slug = `${base}-${n}`;
      n += 1;
    }
    return slug;
  }

  /** The story plus what the current user is allowed to do with it. */
  function present(story, user) {
    return {
      ...story,
      permissions: {
        canEdit: canEdit(user, story),
        canDelete: canDelete(user, story),
        nextStatuses: nextStatuses(user, story),
      },
    };
  }

  /**
   * Looks up the story named in the URL and stores it on req.story.
   * Answers 404 itself when there is no such story.
   */
  function loadStory(req, res, next) {
    const id = Number(req.params.id);
    const story = Number.isInteger(id) ? findStory.get(id) : undefined;
    if (!story) {
      return res.status(404).json({ error: 'Story not found.' });
    }
    req.story = story;
    next();
  }

  // GET /api/stories?status=draft&mine=1
  router.get('/', (req, res) => {
    const conditions = [];
    const params = [];

    if (STATUSES.includes(req.query.status)) {
      conditions.push('stories.status = ?');
      params.push(req.query.status);
    }
    if (req.query.mine === '1') {
      conditions.push('stories.author_id = ?');
      params.push(req.user.id);
    }

    // Only fixed pieces of SQL are joined together here. The values the
    // user sent still travel separately in `params`.
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const stories = db
      .prepare(`
        SELECT stories.id, stories.title, stories.slug, stories.summary, stories.topic,
               stories.status, stories.author_id, stories.updated_at,
               users.name AS author_name
        FROM stories
        JOIN users ON users.id = stories.author_id
        ${where}
        ORDER BY stories.updated_at DESC
      `)
      .all(...params);

    res.json({ stories });
  });

  router.get('/:id', loadStory, (req, res) => {
    res.json({
      story: present(req.story, req.user),
      events: findEvents.all(req.story.id),
    });
  });

  router.post('/', (req, res) => {
    const { values, errors } = validateStory(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(422).json({ error: 'Please fix the highlighted fields.', fields: errors });
    }

    const now = new Date().toISOString();
    const result = insertStory.run(
      values.title, uniqueSlug(values.title), values.summary, values.body, values.topic,
      req.user.id, now, now,
    );
    const id = Number(result.lastInsertRowid);
    insertEvent.run(id, req.user.id, 'created', now);

    res.status(201).json({ story: present(findStory.get(id), req.user) });
  });

  router.put('/:id', loadStory, (req, res) => {
    if (!canEdit(req.user, req.story)) {
      return res.status(403).json({ error: 'You are not allowed to edit this story.' });
    }

    const { values, errors } = validateStory(req.body);
    if (Object.keys(errors).length > 0) {
      return res.status(422).json({ error: 'Please fix the highlighted fields.', fields: errors });
    }

    const now = new Date().toISOString();
    updateStory.run(values.title, values.summary, values.body, values.topic, now, req.story.id);
    insertEvent.run(req.story.id, req.user.id, 'edited', now);

    res.json({
      story: present(findStory.get(req.story.id), req.user),
      events: findEvents.all(req.story.id),
    });
  });

  // POST /api/stories/12/status   { "status": "published" }
  router.post('/:id/status', loadStory, (req, res) => {
    const status = req.body?.status;
    if (!nextStatuses(req.user, req.story).includes(status)) {
      return res.status(403).json({ error: 'You are not allowed to make that change.' });
    }

    const now = new Date().toISOString();
    const publishedAt = status === 'published' ? now : null;

    // Two writes that belong together: either both happen or neither does.
    db.exec('BEGIN');
    try {
      updateStatus.run(status, publishedAt, now, req.story.id);
      insertEvent.run(req.story.id, req.user.id, `moved to ${status}`, now);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }

    res.json({
      story: present(findStory.get(req.story.id), req.user),
      events: findEvents.all(req.story.id),
    });
  });

  router.delete('/:id', loadStory, (req, res) => {
    if (!canDelete(req.user, req.story)) {
      return res.status(403).json({ error: 'You are not allowed to delete this story.' });
    }
    deleteStory.run(req.story.id); // story_events rows go too (ON DELETE CASCADE)
    res.status(204).end();
  });

  return router;
}
