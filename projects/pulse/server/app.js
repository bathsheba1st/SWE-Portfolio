import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { recordRequests } from './middleware/recordRequests.js';
import { demoRoutes } from './routes/demo.js';
import { metricsRoutes } from './routes/metrics.js';

const distFolder = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
  'dist',
);

/**
 * Builds the Express app. The database is passed in so tests can use an
 * in-memory one. `now` lets tests control what time the app thinks it is.
 */
export function createApp(db, options = {}) {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '10kb' }));

  // Only the demo API is recorded. The dashboard's own calls to
  // /api/metrics are left out so that watching does not change the numbers.
  app.use('/api/demo', recordRequests(db), demoRoutes());
  app.use('/api/metrics', metricsRoutes(db, options));
  app.use('/api', (req, res) => res.status(404).json({ error: 'Not found.' }));

  if (fs.existsSync(distFolder)) {
    app.use(express.static(distFolder));
  }

  app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong on the server.' });
  });

  return app;
}
