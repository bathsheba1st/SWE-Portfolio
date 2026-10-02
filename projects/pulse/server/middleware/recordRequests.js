/**
 * Express middleware that times every request that passes through it and
 * saves one row to the `requests` table when the response has been sent.
 */
export function recordRequests(db) {
  const insert = db.prepare(`
    INSERT INTO requests (method, route, status, duration_ms, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  return (req, res, next) => {
    const startedAt = performance.now();

    // 'finish' fires once the whole response has been handed to the network.
    res.on('finish', () => {
      const durationMs = performance.now() - startedAt;

      // Store the route pattern (/stories/:id), not the address the visitor
      // typed (/stories/42). Otherwise every id would become its own row in
      // the dashboard and the table would grow without limit.
      const route = req.route ? req.baseUrl + req.route.path : '(no matching route)';

      try {
        insert.run(req.method, route, res.statusCode, durationMs, Date.now());
      } catch (err) {
        // Monitoring must never break the thing it monitors.
        console.error('Could not record request:', err.message);
      }
    });

    next();
  };
}
