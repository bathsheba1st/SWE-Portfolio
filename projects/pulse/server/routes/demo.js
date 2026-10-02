import express from 'express';

// A pretend API for Pulse to watch. Each endpoint behaves differently so
// the dashboard has something to show: one is fast, one is slow, one fails
// now and then.

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function randomBetween(min, max) {
  return min + Math.random() * (max - min);
}

export function demoRoutes() {
  const router = express.Router();

  // Fast: answers in 5 to 30 ms.
  router.get('/headlines', async (req, res) => {
    await sleep(randomBetween(5, 30));
    res.json({ headlines: ['Bike lanes open early', 'Library tests late hours'] });
  });

  // A route with a parameter, to show that /stories/1 and /stories/2 are
  // counted together as /stories/:id.
  router.get('/stories/:id', async (req, res) => {
    await sleep(randomBetween(10, 60));
    res.json({ id: req.params.id, title: `Story ${req.params.id}` });
  });

  // Slow: answers in 80 to 400 ms.
  router.get('/search', async (req, res) => {
    await sleep(randomBetween(80, 400));
    res.json({ results: [] });
  });

  // Unreliable: fails about one time in twelve.
  router.post('/subscribe', async (req, res) => {
    await sleep(randomBetween(20, 80));
    if (Math.random() < 1 / 12) {
      return res.status(500).json({ error: 'The mailing service did not answer.' });
    }
    res.status(201).json({ ok: true });
  });

  return router;
}
