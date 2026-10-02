import { createHash } from 'node:crypto';

export const SESSION_COOKIE = 'sid';

/** The database stores this hash, never the raw token from the cookie. */
export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

/** Reads one cookie out of the Cookie header ("a=1; sid=abc"). */
export function readCookie(req, name) {
  const header = req.headers.cookie ?? '';
  for (const part of header.split(';')) {
    const [key, ...rest] = part.trim().split('=');
    if (key === name) return decodeURIComponent(rest.join('='));
  }
  return null;
}

/**
 * Runs on every request. If the browser sent a valid session cookie,
 * the signed-in user is attached as req.user. Otherwise req.user is null.
 */
export function loadUser(db) {
  const findUser = db.prepare(`
    SELECT users.id, users.name, users.email, users.role
    FROM sessions
    JOIN users ON users.id = sessions.user_id
    WHERE sessions.token_hash = ? AND sessions.expires_at > ?
  `);

  return (req, res, next) => {
    const token = readCookie(req, SESSION_COOKIE);
    req.user = token
      ? (findUser.get(hashToken(token), new Date().toISOString()) ?? null)
      : null;
    next();
  };
}

/** Put this in front of any route that needs a signed-in user. */
export function requireUser(req, res, next) {
  if (!req.user) {
    return res.status(401).json({ error: 'Please sign in.' });
  }
  next();
}
