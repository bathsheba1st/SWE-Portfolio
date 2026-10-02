# The Brief (Briefing)

A reader-facing news site: browse, filter by topic, search, and get a three-point summary of any story. The summary comes from an AI model when an API key is set, and from a built-in summarizer when it is not, so the feature always works.

- **Front end:** React (JavaScript), built with Vite
- **Back end:** Node.js and Express, a JSON REST API
- **Database:** SQLite, using the `node:sqlite` module built into Node
- **Tests:** 33, using Node's built-in test runner

## Run it

Needs Node.js 22.13 or newer.

```bash
npm install
npm run dev      # API on http://localhost:3002, app on http://localhost:5174
npm test
```

To use an AI model for summaries, start with an Anthropic API key:

```bash
ANTHROPIC_API_KEY=your-key npm run dev
```

Without a key nothing else changes; summaries use the built-in fallback. `AI_MODEL` picks a different model. `npm run seed` resets the demo stories.

## How the summary works

`POST /api/stories/:slug/summary` in `server/routes/stories.js`:

1. If a summary is already saved for this story, return it. A model is called at most once per story.
2. Otherwise check the rate limit (20 per minute per visitor), because model calls cost money.
3. `server/lib/ai.js` asks the model for exactly three bullets, with a 15 second timeout.
4. The reply is checked by `parseBullets`: exactly three bullets, none too long. Model output is never shown unchecked.
5. If there is no key, the call fails, it times out, or the reply is the wrong shape, `server/lib/summarize.js` picks the three most representative sentences from the story instead.
6. The result is saved with its `source` (`model` or `fallback`), and the page tells the reader which one they are looking at.

The API key stays on the server. The story is sent inside `<story>` tags with an instruction to treat it as data, and React escapes everything it renders, so text inside a story cannot change the page.

The tests replace the network with a fake model (`fakeModel` in `tests/helpers.js`), so they run offline and cover the failure cases: an error status, a wrong-shaped reply, and a network failure.

## Read the code in this order

1. `server/schema.sql`: stories, saved summaries, subscribers.
2. `server/lib/summarize.js`: the fallback summarizer, about 30 lines of logic.
3. `server/lib/ai.js`: the model call, the output check, and the fallback decision.
4. `server/routes/stories.js`: listing, search, pagination, and the summary endpoint.
5. `src/hooks/useHashRoute.js` and `src/pages/HomePage.jsx`: filters kept in the address.
6. `tests/`: the same behavior, written as examples.

## Decisions

- **Filters live in the address** (`#/?topic=science&q=tree&page=2`). A search can be bookmarked or shared, and the back button works without extra code.
- **Search uses SQL `LIKE` with placeholders.** The wildcard characters `%` and `_` are escaped so they are searched for as text.
- **Pagination is done in SQL** with `LIMIT` and `OFFSET`, and the API corrects page numbers that are too big or not numbers.
- **The list endpoint does not send story bodies**, only a reading time worked out from them.
- **Newsletter sign-up gives the same answer** for a new address and one already on the list, so the form cannot be used to check who subscribes. The `UNIQUE` constraint stops duplicates.
- **Stale answers are ignored.** If the reader changes a filter while a request is still loading, the older answer is dropped.

## Accessibility

A real `<form role="search">`, topic links marked with `aria-current`, result counts announced with `role="status"`, summaries announced when they arrive, focus moved to the main area on page change, a skip link, light and dark themes.

## Known limits

- `LIKE` matches parts of words, so "bus" also finds "business". SQLite's full-text search (FTS5) would rank whole-word matches.
- `OFFSET` pagination slows down on very large tables; keyset pagination would be the next step.
- The model path is tested against a fake model. It has not been run against the real API as part of the test suite.
- Rate limits are kept in memory and reset when the server restarts.
