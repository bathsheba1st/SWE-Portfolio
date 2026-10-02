import express from 'express';
import { RANGES, errorRate, fillBuckets, percentile } from '../lib/stats.js';

export function metricsRoutes(db, { now = Date.now } = {}) {
  const router = express.Router();

  // Totals for the whole time range. SQL does the counting and averaging.
  // "status >= 500" is 1 for a server error and 0 otherwise, so SUM counts them.
  const totalsQuery = db.prepare(`
    SELECT COUNT(*) AS requests,
           COALESCE(SUM(status >= 500), 0) AS errors,
           COALESCE(AVG(duration_ms), 0) AS avgMs
    FROM requests
    WHERE created_at >= ?
  `);

  // One row per chart bucket. Dividing the time by the bucket size, dropping
  // the decimals (CAST ... AS INTEGER) and multiplying back rounds each time
  // down to the start of its bucket: 12:07 becomes 12:05 for 5-minute buckets.
  const seriesQuery = db.prepare(`
    SELECT CAST(created_at / ? AS INTEGER) * ? AS start,
           COUNT(*) AS requests,
           SUM(status >= 500) AS errors,
           AVG(duration_ms) AS avgMs
    FROM requests
    WHERE created_at >= ?
    GROUP BY start
    ORDER BY start
  `);

  // One row per endpoint.
  const routesQuery = db.prepare(`
    SELECT method, route,
           COUNT(*) AS requests,
           SUM(status >= 500) AS errors,
           AVG(duration_ms) AS avgMs
    FROM requests
    WHERE created_at >= ?
    GROUP BY method, route
  `);

  // SQLite has no built-in percentile, so we fetch the sorted durations
  // and work it out in JavaScript (see lib/stats.js).
  const allDurations = db.prepare(`
    SELECT duration_ms FROM requests WHERE created_at >= ? ORDER BY duration_ms
  `);
  const routeDurations = db.prepare(`
    SELECT duration_ms FROM requests
    WHERE created_at >= ? AND method = ? AND route = ?
    ORDER BY duration_ms
  `);

  const durationsOf = (rows) => rows.map((row) => row.duration_ms);

  // GET /api/metrics?range=1h
  router.get('/', (req, res) => {
    const rangeKey = Object.hasOwn(RANGES, req.query.range) ? req.query.range : '1h';
    const { durationMs, bucketMs } = RANGES[rangeKey];
    const to = now();
    // Start the window on a bucket boundary, so the oldest bar in the chart
    // is a whole bucket. The newest bar is the bucket still in progress.
    const currentBucket = Math.floor(to / bucketMs) * bucketMs;
    const from = currentBucket + bucketMs - durationMs;

    const totals = totalsQuery.get(from);
    const series = fillBuckets(seriesQuery.all(bucketMs, bucketMs, from), { from, to, bucketMs });

    const routes = routesQuery.all(from).map((row) => ({
      method: row.method,
      route: row.route,
      requests: row.requests,
      errorRate: errorRate(row.errors, row.requests),
      avgMs: Math.round(row.avgMs),
      p95Ms: Math.round(percentile(durationsOf(routeDurations.all(from, row.method, row.route)), 95)),
    }));

    res.json({
      range: rangeKey,
      from,
      to,
      bucketMs,
      totals: {
        requests: totals.requests,
        errors: totals.errors,
        errorRate: errorRate(totals.errors, totals.requests),
        avgMs: Math.round(totals.avgMs),
        p95Ms: Math.round(percentile(durationsOf(allDurations.all(from)), 95)),
      },
      series,
      routes,
    });
  });

  return router;
}
