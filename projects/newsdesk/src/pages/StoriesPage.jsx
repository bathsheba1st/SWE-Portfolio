import { useEffect, useState } from 'react';
import { api } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { STATUS_LABELS, capitalize, formatDate } from '../labels.js';

const FILTERS = [
  { value: '', label: 'All' },
  ...Object.entries(STATUS_LABELS).map(([value, label]) => ({ value, label })),
];

export default function StoriesPage() {
  const [status, setStatus] = useState('');
  const [mine, setMine] = useState(false);
  const [stories, setStories] = useState(null); // null = loading
  const [error, setError] = useState('');

  // Load the list again whenever a filter changes.
  useEffect(() => {
    // If the filters change again before this request finishes, `ignore`
    // stops the older, slower answer from overwriting the newer one.
    let ignore = false;
    setError('');

    api.listStories({ status, mine })
      .then((data) => { if (!ignore) setStories(data.stories); })
      .catch((err) => { if (!ignore) setError(err.message); });

    return () => { ignore = true; };
  }, [status, mine]);

  return (
    <>
      <div className="page-header">
        <h1>Stories</h1>
        <a className="button button-primary" href="#/stories/new">New story</a>
      </div>

      <div className="filters">
        <div role="group" aria-label="Filter by status" className="segmented">
          {FILTERS.map((filter) => (
            <button
              key={filter.value} type="button"
              aria-pressed={status === filter.value}
              onClick={() => setStatus(filter.value)}
            >
              {filter.label}
            </button>
          ))}
        </div>
        <label className="checkbox">
          <input type="checkbox" checked={mine} onChange={(event) => setMine(event.target.checked)} />
          Only my stories
        </label>
      </div>

      {error && <p className="form-error" role="alert">{error}</p>}
      {!error && stories === null && <p className="loading">Loading stories…</p>}
      {stories?.length === 0 && <p className="empty">No stories match these filters.</p>}

      {stories?.length > 0 && (
        <div className="card table-wrap">
          <table>
            <caption className="visually-hidden">
              Stories, most recently updated first
            </caption>
            <thead>
              <tr>
                <th scope="col">Title</th>
                <th scope="col">Status</th>
                <th scope="col">Topic</th>
                <th scope="col">Author</th>
                <th scope="col">Updated</th>
              </tr>
            </thead>
            <tbody>
              {stories.map((story) => (
                <tr key={story.id}>
                  <th scope="row">
                    <a href={`#/stories/${story.id}`}>{story.title}</a>
                  </th>
                  <td><StatusBadge status={story.status} /></td>
                  <td>{capitalize(story.topic)}</td>
                  <td>{story.author_name}</td>
                  <td>{formatDate(story.updated_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
