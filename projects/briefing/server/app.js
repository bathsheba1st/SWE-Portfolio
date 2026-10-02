import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createSummarizer } from './lib/ai.js';
import {
  errorHandler,
  requireJson,
  securityHeaders,
} from './middleware/security.js';
import { storyRoutes, topicRoutes } from './routes/stories.js';
import { subscriberRoutes } from './routes/subscribers.js';

const distFolder = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'dist',
);

/**
 * Builds the Express app. The database and the summarizer are passed in,
 * so tests can use an in-memory database and a fake AI model.
 */
export function createApp(db, summarizer = createSummarizer()) {
  const app = express();
  app.disable('x-powered-by');

  app.use(securityHeaders);
  app.use(express.json({ limit: '10kb' }));

  app.use('/api', requireJson);
  app.use('/api/stories', storyRoutes(db, summarizer));
  app.use('/api/topics', topicRoutes(db));
  app.use('/api/subscribers', subscriberRoutes(db));
  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

  if (fs.existsSync(distFolder)) {
    app.use(express.static(distFolder));
  }

  app.use(errorHandler);
  return app;
}
