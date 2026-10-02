# Newsdesk

A small newsroom CMS. Reporters write stories and send them for review; editors publish them.

- **Front end:** React (JavaScript), built with Vite
- **Back end:** Node.js and Express, a JSON REST API
- **Database:** SQLite, using the `node:sqlite` module built into Node
- **Tests:** 31, using Node's built-in test runner

## Run it

Needs Node.js 22.13 or newer.

```bash
npm install
npm run dev      # API on http://localhost:3001, app on http://localhost:5173
npm test
```

Open http://localhost:5173 and sign in with a demo account (the login page has a button for each):

| Role | Email | Password |
| --- | --- | --- |
| Reporter | `reporter@newsdesk.test` | `newsdesk-demo` |
| Editor | `editor@newsdesk.test` | `newsdesk-demo` |

Other commands: `npm run seed` resets the demo data. `npm run build` then `npm start` serves the built app and the API together on port 3001.

## What it does

| | Reporter | Editor |
| --- | --- | --- |
| Read every story | yes | yes |
| Create a story | yes | yes |
| Edit | own drafts only | any story |
| Send for review | own drafts | any draft |
| Publish, unpublish | no | yes |
| Delete | own drafts only | any story |

Each story keeps a history of who did what and when.

## How a request travels through the code

Take "the editor clicks Publish":

1. `src/pages/StoryPage.jsx` calls `api.setStatus(id, 'published')`.
2. `src/api.js` sends `POST /api/stories/12/status` with a JSON body. The browser attaches the session cookie.
3. `server/app.js` runs the middleware in order: security headers, JSON parsing, `loadUser` (turns the cookie into `req.user`), `requireJson`, `requireUser`.
4. `server/routes/stories.js` loads the story, asks `nextStatuses(user, story)` whether this user may publish it, then updates the story and adds a history row inside one transaction.
5. The response includes the story and what this user may do next, and React re-renders.

## Read the code in this order

1. `server/schema.sql`: the four tables.
2. `server/lib/permissions.js`: every rule about who may do what, in 50 lines.
3. `server/routes/auth.js` and `server/middleware/auth.js`: login and sessions.
4. `server/routes/stories.js`: the story API.
5. `src/App.jsx`, then the two pages in `src/pages/`.
6. `tests/api.test.js`: the same behavior, written as examples.

## Decisions

- **Permissions live in one file of plain functions.** The API uses them to allow or refuse a request, and sends the result to the browser so the page only shows buttons that will work. The server is always the one that decides; hiding a button is a convenience, not security.
- **Sessions in the database, not JWTs.** Signing out deletes the row, so a session can be ended immediately. The database stores a SHA-256 hash of the token, so a leaked database cannot be used to sign in.
- **Passwords are hashed with scrypt** (built into Node) with a random salt per user, and compared in constant time.
- **The cookie is `HttpOnly` and `SameSite=Strict`**, and every request that changes data must be JSON. Together these block cross-site request forgery without a separate CSRF token.
- **Login is rate limited** (5 wrong attempts per 15 minutes per IP and email) and gives the same error for a wrong password and an unknown email.
- **Every SQL query uses `?` placeholders**, never string building with user input. There is a test that tries an injection.
- **Validation happens on the server** and returns one message per field. The form links each message to its input with `aria-describedby` so screen readers read it out.

## Accessibility

Labels on every input, a skip link, visible keyboard focus, focus moved to the main area on page change, errors announced with `role="alert"`, status shown as text and not color alone, light and dark themes.

## Known limits

- The rate limiter keeps its counts in memory, so they reset when the server restarts and are not shared between several servers. A shared store such as Redis would fix that.
- Expired session rows are ignored but never deleted. A scheduled clean-up job would be the next step.
- Two editors saving the same story at the same time: the last save wins.
- SQLite is a single file, which suits a demo. The SQL is standard enough to move to PostgreSQL.
