// Every call to the server goes through this file.

export async function getMetrics(range) {
  const response = await fetch(`/api/metrics?range=${encodeURIComponent(range)}`);
  if (!response.ok) throw new Error('Could not load the metrics.');
  return response.json();
}

// The pretend API that Pulse watches (see server/routes/demo.js).
const DEMO_REQUESTS = [
  () => fetch('/api/demo/headlines'),
  () => fetch('/api/demo/headlines'),
  () => fetch(`/api/demo/stories/${1 + Math.floor(Math.random() * 50)}`),
  () => fetch('/api/demo/search?q=news'),
  () => fetch('/api/demo/subscribe', { method: 'POST' }),
];

/** Sends `count` requests to random demo endpoints and waits for them all. */
export async function sendTestTraffic(count) {
  const requests = Array.from({ length: count }, () => {
    const send = DEMO_REQUESTS[Math.floor(Math.random() * DEMO_REQUESTS.length)];
    return send();
  });
  // allSettled waits for every request, including the ones that fail.
  await Promise.allSettled(requests);
}
