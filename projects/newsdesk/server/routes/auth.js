import express from 'express';
import { randomBytes } from 'node:crypto';
import { verifyPassword } from '../lib/passwords.js';
import { createRateLimiter } from '../lib/rateLimit.js';
import { SESSION_COOKIE, hashToken, readCookie } from '../middleware/auth.js';

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export function authRoutes(db) {
  const router = express.Router();

  // 5 wrong passwords per 15 minutes, counted per IP address and email.
  const loginLimiter = createRateLimiter({ limit: 5, windowMs: 15 * 60 * 1000 });

  const findUserByEmail = db.prepare('SELECT * FROM users WHERE email = ?');
  const insertSession = db.prepare(
    'INSERT INTO sessions (token_hash, user_id, expires_at) VALUES (?, ?, ?)',
  );
  const deleteSession = db.prepare('DELETE FROM sessions WHERE token_hash = ?');

  // Who am I? The React app calls this when it loads.
  router.get('/me', (req, res) => {
    res.json({ user: req.user });
  });

  router.post('/login', (req, res) => {
    const { email, password } = req.body ?? {};
    if (typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    const key = `${req.ip}:${email.toLowerCase()}`;
    if (loginLimiter.isBlocked(key)) {
      return res.status(429).json({ error: 'Too many attempts. Try again in a few minutes.' });
    }

    const user = findUserByEmail.get(email.trim().toLowerCase());
    const passwordIsCorrect = user ? verifyPassword(password, user.password_hash) : false;

    if (!passwordIsCorrect) {
      loginLimiter.hit(key);
      // The same message for "no such user" and "wrong password", so the
      // response does not reveal which email addresses have accounts.
      return res.status(401).json({ error: 'Email or password is incorrect.' });
    }

    loginLimiter.reset(key);

    // The session token is a long random string. The browser keeps it in a
    // cookie; we keep only its hash.
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + ONE_WEEK_MS).toISOString();
    insertSession.run(hashToken(token), user.id, expiresAt);

    res.cookie(SESSION_COOKIE, token, {
      httpOnly: true, // JavaScript on the page cannot read it (limits XSS damage)
      sameSite: 'strict', // not sent on requests from other sites (CSRF)
      secure: process.env.NODE_ENV === 'production', // HTTPS only when deployed
      maxAge: ONE_WEEK_MS,
    });

    res.json({
      user: { id: user.id, name: user.name, email: user.email, role: user.role },
    });
  });

  router.post('/logout', (req, res) => {
    const token = readCookie(req, SESSION_COOKIE);
    if (token) deleteSession.run(hashToken(token));
    res.clearCookie(SESSION_COOKIE);
    res.status(204).end();
  });

  return router;
}
