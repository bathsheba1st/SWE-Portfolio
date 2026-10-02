import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadUser, requireUser } from './middleware/auth.js';
import {
  errorHandler,
  requireJson,
  securityHeaders,
} from './middleware/security.js';
import { authRoutes } from './routes/auth.js';
import { storyRoutes } from './routes/stories.js';

const distFolder = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'dist',
);

/**
 * Builds the Express app. It takes the database as an argument instead of
 * opening one itself, so the tests can pass in an empty in-memory database.
 *
 * Middleware runs top to bottom for every request.
 */
export function createApp(db) {
  const app = express();
  app.disable('x-powered-by');

  app.use(securityHeaders);
  app.use(express.json({ limit: '100kb' })); // parse JSON bodies into req.body
  app.use(loadUser(db)); // sets req.user (or null)

  app.use('/api', requireJson);
  app.use('/api/auth', authRoutes(db));
  app.use('/api/stories', requireUser, storyRoutes(db));
  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

  if (fs.existsSync(distFolder)) {
    app.use(express.static(distFolder));
  }

  app.use(errorHandler);
  return app;
}
