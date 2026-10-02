import { useEffect, useRef } from 'react';
import SignupForm from './components/SignupForm.jsx';
import { useHashRoute } from './hooks/useHashRoute.js';
import HomePage from './pages/HomePage.jsx';
import StoryPage from './pages/StoryPage.jsx';

export default function App() {
  const { path, params } = useHashRoute();
  const mainRef = useRef(null);

  // When the reader opens a different page, start at the top and move
  // keyboard focus to the main area so screen readers announce the new page.
  useEffect(() => {
    window.scrollTo(0, 0);
    mainRef.current?.focus({ preventScroll: true });
  }, [path]);

  const storyMatch = path.match(/^\/story\/([a-z0-9-]+)$/);

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="masthead">
        <a className="brand" href="#/">The Brief</a>
        <p>Local news, three points at a time.</p>
      </header>

      <main id="main" tabIndex={-1} ref={mainRef}>
        {storyMatch
          ? <StoryPage key={storyMatch[1]} slug={storyMatch[1]} />
          : <HomePage params={params} />}
      </main>

      <footer className="footer">
        <SignupForm />
        <p className="small">A demo project. Every story, name and place is invented.</p>
      </footer>
    </>
  );
}
