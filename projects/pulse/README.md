# Pulse

A small monitoring dashboard. An Express middleware times every request to a demo API and saves it to SQLite; the dashboard charts traffic, error rate and response times, and lists each endpoint with its 95th percentile.

- **Front end:** React (JavaScript), built with Vite. Charts are hand-written SVG, no chart library.
- **Back end:** Node.js and Express
- **Database:** SQLite, using the `node:sqlite` module built into Node
- **Tests:** 20, using Node's built-in test runner

## Run it

Needs Node.js 22.13 or newer.

```bash
npm install
npm run dev      # API on http://localhost:3003, app on http://localhost:5175
npm test
```

The first start fills the database with 24 hours of invented traffic, including a 25 minute incident about three hours ago. Press **Send test traffic** to make real requests and watch the 15 minute view change. `npm run seed` resets the data.

## How it works

1. `server/middleware/recordRequests.js` notes the time when a request arrives and, when the response has been sent, inserts one row: method, route, status, duration, time.
2. `server/routes/metrics.js` answers `GET /api/metrics?range=1h` with three things: totals, one entry per chart bucket, and one row per endpoint. Counting, averaging and grouping are done in SQL.
3. `server/lib/stats.js` does what SQL cannot do simply here: the 95th percentile, and filling in empty buckets so the time axis has no holes.
4. `src/App.jsx` loads the metrics, reloads every 5 seconds, and passes them to the tiles, the three charts and the table.

## Read the code in this order

1. `server/schema.sql`: one table and one index.
2. `server/middleware/recordRequests.js`: 30 lines.
3. `server/lib/stats.js`, with `tests/stats.test.js` open beside it.
4. `server/routes/metrics.js`: the three SQL queries.
5. `src/components/TimeChart.jsx`: how a chart is drawn from numbers.

## Decisions

- **Routes are stored as patterns** (`/api/demo/stories/:id`), not as the address the visitor typed. Otherwise every story id would become its own row in the dashboard.
- **95th percentile next to the average.** Nine fast requests and one very slow one have a fine-looking average; the percentile shows the slow one. There is a test that demonstrates exactly this.
- **Monitoring must not break the app.** A failed insert is logged and ignored.
- **The dashboard's own requests are not recorded**, so looking at the numbers does not change them.
- **Old rows are deleted** every ten minutes, because the dashboard only looks back 24 hours.
- **The time column is indexed**, since every query asks for "rows since time X".
- **Charts are plain SVG** in one component of about 130 lines. Each chart shows one number on one axis; hovering shows the exact value, and the same numbers are available as a table.

## Accessibility

Each chart has a text description and the data is available as a real table. The error-rate status uses a symbol and words, not color alone. Sortable column headings are buttons with `aria-sort`. Light and dark themes.

## Known limits

- One database insert per request is fine for a demo. A busy service would collect rows in memory and insert them in batches.
- Percentiles are worked out in JavaScript from every duration in the range. At larger scale this would use pre-computed buckets (a histogram).
- Charts show hover details with a mouse or touch; keyboard users get the data table instead.
