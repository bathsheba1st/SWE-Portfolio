import express from 'express';
import { createRateLimiter } from '../lib/rateLimit.js';
import { isValidEmail } from '../lib/validate.js';

export function subscriberRoutes(db) {
  const router = express.Router();
  const limiter = createRateLimiter({ limit: 5, windowMs: 60 * 1000 });

  // "OR IGNORE" means: if the email is already there (UNIQUE), do nothing.
  const insert = db.prepare('INSERT OR IGNORE INTO subscribers (email, created_at) VALUES (?, ?)');

  router.post('/', (req, res) => {
    if (limiter.isBlocked(req.ip)) {
      return res.status(429).json({ error: 'Too many requests. Try again in a minute.' });
    }
    limiter.hit(req.ip);

    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (!isValidEmail(email)) {
      return res.status(422).json({ error: 'Enter a valid email address, like name@example.com.' });
    }

    insert.run(email, new Date().toISOString());

    // The answer is the same whether the address is new or already on the
    // list, so nobody can use this form to find out who subscribes.
    res.status(201).json({ message: 'You are subscribed. See you in the morning.' });
  });

  return router;
}
