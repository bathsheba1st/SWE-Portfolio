/**
 * A small in-memory rate limiter.
 *
 * It remembers when each key (for example an IP address plus an email) was
 * last used, and refuses once a key has been used `limit` times inside
 * `windowMs` milliseconds. Used to slow down password guessing on login.
 */
export function createRateLimiter({ limit, windowMs, now = Date.now }) {
  const hits = new Map(); // key -> array of timestamps

  function recent(key) {
    const cutoff = now() - windowMs;
    return (hits.get(key) ?? []).filter((time) => time > cutoff);
  }

  return {
    /** True when this key has used up its attempts. */
    isBlocked(key) {
      return recent(key).length >= limit;
    },
    /** Records one attempt for this key. */
    hit(key) {
      hits.set(key, [...recent(key), now()]);
    },
    /** Forgets a key, for example after a successful login. */
    reset(key) {
      hits.delete(key);
    },
  };
}
