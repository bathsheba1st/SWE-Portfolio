// Small helpers for drawing charts. Plain functions, tested in tests/chart.test.js.

/**
 * A round number at or above `value` to use as the top of a chart axis,
 * so the axis reads 0 / 50 / 100 instead of 0 / 43.5 / 87.
 */
export function niceMax(value) {
  if (value <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(value)); // 87 -> 10, 430 -> 100
  const steps = [1, 2, 4, 5, 10];
  const step = steps.find((candidate) => candidate * magnitude >= value);
  return step * magnitude;
}

/** "M 0 10 L 20 5 L 40 8": the SVG path that joins the points with a line. */
export function linePath(points) {
  return points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x.toFixed(1)} ${point.y.toFixed(1)}`)
    .join(' ');
}

/**
 * Sorts table rows by one column. Returns a new array and leaves the
 * original alone, which is what React expects.
 */
export function sortRows(rows, key, direction) {
  const sign = direction === 'asc' ? 1 : -1;
  return [...rows].sort((a, b) => {
    const result = typeof a[key] === 'string' ? a[key].localeCompare(b[key]) : a[key] - b[key];
    return result * sign;
  });
}

export const formatNumber = (value) => value.toLocaleString('en-US');
export const formatMs = (value) => `${formatNumber(value)} ms`;
export const formatPercent = (value) => `${value}%`;

const timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' });
/** 1767268800000 -> "12:00 PM" in the viewer's time zone. */
export const formatTime = (ms) => timeFormat.format(new Date(ms));
