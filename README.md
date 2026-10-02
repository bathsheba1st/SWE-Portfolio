# Portfolio

A portfolio site and three small full stack projects, written in JavaScript: React on the front end, Node.js and Express on the back end, SQLite for data.

| Folder | What it is | Tests |
| --- | --- | --- |
| [`portfolio/`](portfolio) | The portfolio website (React + Vite, static) | |
| [`projects/newsdesk/`](projects/newsdesk) | A newsroom CMS: sign-in, roles, a review and publish workflow | 31 |
| [`projects/briefing/`](projects/briefing) | A reader-facing news site with search and AI summaries with a fallback | 33 |
| [`projects/pulse/`](projects/pulse) | A monitoring dashboard: request timing, error rates, 95th percentile | 20 |

Each project is self-contained, with its own `package.json` and a README that explains how it works and why it is built that way.

## Run everything

```bash
# one project (same commands in each folder)
cd projects/newsdesk
npm install
npm run dev        # starts the API and the React app together
npm test

# the portfolio site
cd portfolio
npm install
npm run dev        # http://localhost:5170
```

| App | Address in development |
| --- | --- |
| Portfolio | http://localhost:5170 |
| Newsdesk | http://localhost:5173 (API on 3001) |
| The Brief | http://localhost:5174 (API on 3002) |
| Pulse | http://localhost:5175 (API on 3003) |

From this folder, `npm run install:all` installs all four and `npm run test:all` runs every test suite.
