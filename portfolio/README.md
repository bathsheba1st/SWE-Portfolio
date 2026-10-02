# Portfolio site

A single-page site built with React and Vite. No back end; it builds to static files.

```bash
npm install
npm run dev       # http://localhost:5170
npm run build     # static site in dist/
npm run preview   # look at the built site locally
```

## Editing

- **Words:** everything is in `src/content.js`. Search for `TODO`.
- **Layout:** `src/App.jsx` (the page) and `src/components/Project.jsx` (one project).
- **Look:** `src/styles.css`. Colors are variables at the top, with a dark-mode set below them.
- **Screenshots:** `public/shots/`. To replace one, take a 1280 by 800 screenshot of the running project and save it under the same name.

Your name also appears in `index.html` (the page title and description).
