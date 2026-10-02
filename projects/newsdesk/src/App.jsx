import { useEffect, useRef, useState } from 'react';
import { api } from './api.js';
import { navigate, useHashRoute } from './hooks/useHashRoute.js';
import LoginPage from './pages/LoginPage.jsx';
import StoriesPage from './pages/StoriesPage.jsx';
import StoryPage from './pages/StoryPage.jsx';

export default function App() {
  // undefined = still checking, null = signed out, object = signed in
  const [user, setUser] = useState(undefined);
  const path = useHashRoute();
  const mainRef = useRef(null);

  // On first load, ask the server whether we already have a session.
  useEffect(() => {
    api.me()
      .then((data) => setUser(data.user))
      .catch(() => setUser(null));
  }, []);

  // When the page changes, move keyboard focus to the main area so screen
  // reader users hear the new page instead of staying on the old link.
  useEffect(() => {
    mainRef.current?.focus();
  }, [path]);

  async function handleLogout() {
    await api.logout();
    navigate('/'); // so the next person to sign in starts on the list
    setUser(null);
  }

  if (user === undefined) {
    return <p className="loading">Loading…</p>;
  }
  if (user === null) {
    return <LoginPage onLogin={setUser} />;
  }

  // Decide which page to show from the address.
  const storyMatch = path.match(/^\/stories\/(new|\d+)$/);
  let page;
  if (storyMatch) {
    // `key` makes React start the page fresh when moving between stories.
    page = <StoryPage key={storyMatch[1]} id={storyMatch[1]} user={user} />;
  } else {
    page = <StoriesPage user={user} />;
  }

  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <header className="topbar">
        <a className="brand" href="#/">Newsdesk</a>
        <div className="topbar-user">
          <span>
            {user.name} <span className="role">{user.role}</span>
          </span>
          <button type="button" className="button button-quiet" onClick={handleLogout}>
            Sign out
          </button>
        </div>
      </header>
      <main id="main" tabIndex={-1} ref={mainRef}>
        {page}
      </main>
    </>
  );
}
