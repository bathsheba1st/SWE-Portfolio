import { useEffect, useState } from 'react';

/**
 * Reads the part of the address after "#".
 * "#/?topic=science&page=2" -> { path: '/', params: { topic: 'science', page: '2' } }
 */
function readHash() {
  const hash = window.location.hash.slice(1) || '/';
  const [path, query = ''] = hash.split('?');
  return { path, params: Object.fromEntries(new URLSearchParams(query)) };
}

/**
 * Keeping the filters in the address means a search can be
 * bookmarked or shared, and the browser's back button just works.
 */
export function useHashRoute() {
  const [route, setRoute] = useState(readHash);

  useEffect(() => {
    const onChange = () => setRoute(readHash());
    window.addEventListener('hashchange', onChange);
    return () => window.removeEventListener('hashchange', onChange);
  }, []);

  return route;
}

/** Builds a link such as "#/?topic=science". */
export function homeLink(params) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value && !(key === 'page' && String(value) === '1'))
      query.set(key, value);
  }
  const text = query.toString();
  return text ? `#/?${text}` : '#/';
}
