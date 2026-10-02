// Plain functions that turn rows of requests into numbers for the dashboard.
// No database or HTTP code here, so they are easy to test.

/** The time ranges the dashboard offers, and how wide each chart bar is. */
export const RANGES = {
  '15m': { label: '15 minutes', durationMs: 15 * 60 * 1000, bucketMs: 60 * 1000 },
  '1h': { label: '1 hour', durationMs: 60 * 60 * 1000, bucketMs: 5 * 60 * 1000 },
  '24h': { label: '24 hours', durationMs: 24 * 60 * 60 * 1000, bucketMs: 60 * 60 * 1000 },
};

/**
 * The value that `p` percent of the numbers are at or below.
 *
 * percentile(durations, 95) answers "95% of requests were at least this
 * fast". It describes the slow requests that an average hides: nine quick
 * requests and one very slow one still have a pleasant-looking average.
 *
 * `sorted` must already be sorted from smallest to largest.
 */
export function percentile(sorted, p) {
  if (sorted.length === 0) return 0;
  // "Nearest rank" method: the position of the value, counting from 1.
  const rank = Math.ceil((p / 100) * sorted.length);
  return sorted[Math.max(rank, 1) - 1];
}

/** Errors as a percentage of requests, to one decimal place. 0 when there were none. */
export function errorRate(errors, requests) {
  if (requests === 0) return 0;
  return Math.round((errors / requests) * 1000) / 10;
}

/**
 * The database only returns buckets that had requests. A chart needs every
 * bucket, including the quiet ones, or its time axis would have holes.
 * This returns one entry per bucket from the one containing `from` to the
 * one containing `to`, filling the gaps with zeros.
 */
export function fillBuckets(rows, { from, to, bucketMs }) {
  const byStart = new Map(rows.map((row) => [row.start, row]));
  const buckets = [];

  // Line the first bucket up with the clock (e.g. exactly on the hour).
  const first = Math.floor(from / bucketMs) * bucketMs;
  for (let start = first; start <= to; start += bucketMs) {
    const row = byStart.get(start);
    buckets.push({
      start,
      requests: row?.requests ?? 0,
      errors: row?.errors ?? 0,
      errorRate: errorRate(row?.errors ?? 0, row?.requests ?? 0),
      avgMs: Math.round(row?.avgMs ?? 0),
    });
  }
  return buckets;
}
