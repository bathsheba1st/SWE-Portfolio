/** Response headers that switch on the browser's built-in protections. */
export function securityHeaders(req, res, next) {
  // Do not guess file types: stops a text upload being run as a script.
  res.set('X-Content-Type-Options', 'nosniff');
  // Do not allow other sites to show this app inside a frame (clickjacking).
  res.set('X-Frame-Options', 'DENY');
  // Do not send the full page address to other sites.
  res.set('Referrer-Policy', 'same-origin');
  next();
}

/** Requests that change data must send JSON. */
export function requireJson(req, res, next) {
  const changesData = !['GET', 'HEAD', 'OPTIONS'].includes(req.method);
  const isJson = (req.headers['content-type'] ?? '').startsWith(
    'application/json',
  );

  if (changesData && !isJson) {
    return res
      .status(415)
      .json({ error: 'Send JSON with Content-Type: application/json.' });
  }
  next();
}

/** The last stop for any error thrown in a route. */
export function errorHandler(err, req, res, next) {
  // express.json() could not parse the request body.
  if (err.type === 'entity.parse.failed') {
    return res
      .status(400)
      .json({ error: 'The request body is not valid JSON.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'The request body is too large.' });
  }

  console.error(err);
  res.status(500).json({ error: 'Something went wrong on the server.' });
}
