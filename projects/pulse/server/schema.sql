-- Pulse database schema (SQLite).

-- One row for every API request we handled.
CREATE TABLE IF NOT EXISTS requests (
  id          INTEGER PRIMARY KEY,
  method      TEXT NOT NULL,           -- GET, POST, ...
  route       TEXT NOT NULL,           -- the route pattern, e.g. /api/demo/stories/:id
  status      INTEGER NOT NULL,        -- the HTTP status we answered with
  duration_ms REAL NOT NULL,           -- how long we took to answer
  created_at  INTEGER NOT NULL         -- when, as milliseconds since 1970
);

-- Every dashboard query asks for "rows since time X", so index the time.
CREATE INDEX IF NOT EXISTS idx_requests_created_at ON requests (created_at);
