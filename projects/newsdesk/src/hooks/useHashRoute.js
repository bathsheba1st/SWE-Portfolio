import { useEffect, useState } from 'react';

function currentPath() {
  // "#/stories/3" -> "/stories/3". No hash means the home page.
  return window.location.hash.slice(1) || '/';
}

/**
 * A tiny router. The page address after the "#" decides what to show,
 * for example "#/stories/3". The browser fires "hashchange" whenever it
 * changes (links, back button), and we re-render with the new path.
 */
export function useHashRoute() {
  const [path, setPath] = useState(currentPath);

  useEffect(() => {
    const onChange = () => setPath(currentPath());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return path;
}

export function navigate(path) {
  window.location.hash = path;
}
