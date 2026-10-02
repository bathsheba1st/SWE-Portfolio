/** Response headers that switch on the browser's built-in protections. */
export function securityHeaders(req, res, next) {
  res.set('X-Content-Type-Options', 'nosniff');
  res.set('X-Frame-Options', 'DENY');
  res.set('Referrer-Policy', 'same-origin');
  next();
}

/**
 * Requests that change data must send JSON. A form on another website
 * cannot do that without the browser asking our permission first, so this
 * blocks cross-site form posts.
 */
export function requireJson(req, res, next) {
  const changesData = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  const isJson = (req.headers['content-type'] ?? '').startsWith('application/json');

  if (changesData && !isJson) {
    return res.status(415).json({ error: 'Send JSON with Content-Type: application/json.' });
  }
  next();
}

/** The last stop for any error thrown in a route. */
export function errorHandler(err, req, res, next) {
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'The request body is not valid JSON.' });
  }
  // Log the details for us; send the reader a generic message.
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
}
