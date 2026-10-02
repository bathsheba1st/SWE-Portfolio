-- Briefing database schema (SQLite).

CREATE TABLE IF NOT EXISTS stories (
  id           INTEGER PRIMARY KEY,
  slug         TEXT NOT NULL UNIQUE,
  title        TEXT NOT NULL,
  dek          TEXT NOT NULL,          -- the one-line summary under a headline
  body         TEXT NOT NULL,
  topic        TEXT NOT NULL,
  author       TEXT NOT NULL,
  published_at TEXT NOT NULL
);

-- The home page filters by topic and always sorts newest first.
CREATE INDEX IF NOT EXISTS idx_stories_topic_date ON stories (topic, published_at DESC);

-- A saved summary for a story, so we only work it out once.
-- source says where it came from: an AI model, or our built-in fallback.
CREATE TABLE IF NOT EXISTS summaries (
  story_id   INTEGER PRIMARY KEY REFERENCES stories (id) ON DELETE CASCADE,
  bullets    TEXT NOT NULL,            -- a JSON array of three strings
  source     TEXT NOT NULL CHECK (source IN ('model', 'fallback')),
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS subscribers (
  id         INTEGER PRIMARY KEY,
  email      TEXT NOT NULL UNIQUE,     -- UNIQUE stops the same address twice
  created_at TEXT NOT NULL
);
