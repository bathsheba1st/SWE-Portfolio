import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Pagination from '../components/Pagination.jsx';
import { homeLink } from '../hooks/useHashRoute.js';
import { capitalize, formatDate } from '../labels.js';

/**
 * The story list. The filters live in the address (`params`), not in
 * component state, so this page simply shows whatever the address says.
 */
export default function HomePage({ params }) {
  const topic = params.topic ?? '';
  const q = params.q ?? '';
  const page = params.page ?? '1';

  const [topics, setTopics] = useState([]);
  const [result, setResult] = useState(null); // null = loading
  const [error, setError] = useState('');
  const [searchText, setSearchText] = useState(q);

  // The topic list never changes, so load it once.
  useEffect(() => {
    api.listTopics().then((data) => setTopics(data.topics)).catch(() => {});
  }, []);

  // Keep the search box in step with the address (for example after "back").
  useEffect(() => setSearchText(q), [q]);

  // Load stories whenever a filter changes.
  useEffect(() => {
    // `ignore` stops a slow, older answer from replacing a newer one.
    let ignore = false;
    setError('');

    api.listStories({ topic, q, page })
      .then((data) => {
        // Remember which filters this answer belongs to, so the summary line
        // never describes a new search with the old numbers.
        if (!ignore) setResult({ ...data, topic, q });
      })
      .catch((err) => { if (!ignore) setError(err.message); });

    return () => { ignore = true; };
  }, [topic, q, page]);

  function handleSearch(event) {
    event.preventDefault();
    // A new search starts again from page 1.
    window.location.hash = homeLink({ topic, q: searchText.trim() }).slice(1);
  }

  return (
    <>
      <h1 className="visually-hidden">Latest stories</h1>

      <form role="search" className="search" onSubmit={handleSearch}>
        <label htmlFor="search" className="visually-hidden">Search stories</label>
        <input
          id="search" type="search" placeholder="Search stories"
          value={searchText} onChange={(event) => setSearchText(event.target.value)}
        />
        <button type="submit" className="button">Search</button>
      </form>

      <nav aria-label="Topics" className="topics">
        <a href={homeLink({ q })} aria-current={topic === '' ? 'page' : undefined}>All</a>
        {topics.map((item) => (
          <a
            key={item.topic} href={homeLink({ topic: item.topic, q })}
            aria-current={topic === item.topic ? 'page' : undefined}
          >
            {capitalize(item.topic)} <span className="count">{item.count}</span>
          </a>
        ))}
      </nav>

      {/* Screen readers announce this line when the results change. */}
      <p className="result-count" role="status">
        {result && describe(result.total, result.q, result.topic)}
      </p>

      {error && <p className="error" role="alert">{error}</p>}
      {!error && result === null && <p className="muted">Loading stories…</p>}

      {result?.total === 0 && (
        <p className="muted">
          Try a different word, or <a href="#/">see all stories</a>.
        </p>
      )}

      {result && (
        <ol className="story-list">
          {result.stories.map((story) => (
            <li key={story.slug}>
              <article>
                <p className="kicker">{capitalize(story.topic)}</p>
                <h2><a href={`#/story/${story.slug}`}>{story.title}</a></h2>
                <p className="dek">{story.dek}</p>
                <p className="meta">
                  {story.author} · <time dateTime={story.published_at}>{formatDate(story.published_at)}</time>
                  {' · '}{story.reading_minutes} min read
                </p>
              </article>
            </li>
          ))}
        </ol>
      )}

      {result && result.pageCount > 1 && (
        <Pagination
          page={result.page} pageCount={result.pageCount}
          linkFor={(number) => homeLink({ topic, q, page: number })}
        />
      )}
    </>
  );
}

/** "3 stories about “bus” in Technology" */
function describe(total, q, topic) {
  let text = total === 1 ? '1 story' : `${total} stories`;
  if (q) text += ` about “${q}”`;
  if (topic) text += ` in ${capitalize(topic)}`;
  return text;
}
