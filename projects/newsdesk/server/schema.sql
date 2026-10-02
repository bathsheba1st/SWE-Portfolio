-- Newsdesk database schema (SQLite).
-- Running this file more than once is safe because of IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS users (
  id            INTEGER PRIMARY KEY,
  name          TEXT NOT NULL,
  email         TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role          TEXT NOT NULL CHECK (role IN ('reporter', 'editor')),
  created_at    TEXT NOT NULL
);

-- One row per signed-in browser. We store a hash of the session token,
-- not the token itself, so a leaked database cannot be used to sign in.
CREATE TABLE IF NOT EXISTS sessions (
  token_hash TEXT PRIMARY KEY,
  user_id    INTEGER NOT NULL REFERENCES users (id) ON DELETE CASCADE,
  expires_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS stories (
  id           INTEGER PRIMARY KEY,
  title        TEXT NOT NULL,
  slug         TEXT NOT NULL UNIQUE,
  summary      TEXT NOT NULL,
  body         TEXT NOT NULL,
  topic        TEXT NOT NULL,
  status       TEXT NOT NULL DEFAULT 'draft'
               CHECK (status IN ('draft', 'in_review', 'published')),
  author_id    INTEGER NOT NULL REFERENCES users (id),
  created_at   TEXT NOT NULL,
  updated_at   TEXT NOT NULL,
  published_at TEXT
);

-- The list page filters by status and by author, so index both columns.
CREATE INDEX IF NOT EXISTS idx_stories_status ON stories (status);
CREATE INDEX IF NOT EXISTS idx_stories_author ON stories (author_id);

-- A history of what happened to each story and who did it.
CREATE TABLE IF NOT EXISTS story_events (
  id         INTEGER PRIMARY KEY,
  story_id   INTEGER NOT NULL REFERENCES stories (id) ON DELETE CASCADE,
  user_id    INTEGER NOT NULL REFERENCES users (id),
  action     TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_story_events_story ON story_events (story_id);
