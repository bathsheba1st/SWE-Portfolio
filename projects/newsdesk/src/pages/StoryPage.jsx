import { useEffect, useState } from 'react';
import { api } from '../api.js';
import StatusBadge from '../components/StatusBadge.jsx';
import { navigate } from '../hooks/useHashRoute.js';
import { TOPICS, capitalize, formatDate } from '../labels.js';

const EMPTY_FORM = { title: '', summary: '', body: '', topic: 'politics' };

// The button text for each status change.
const STATUS_ACTIONS = {
  in_review: 'Send for review',
  published: 'Publish',
  draft: 'Move back to draft',
};

/** The message under a field that failed validation. */
function FieldError({ name, errors }) {
  if (!errors[name]) return null;
  return <p className="field-error" id={`${name}-error`}>{errors[name]}</p>;
}

/** Create a story (id === 'new') or view and edit an existing one. */
export default function StoryPage({ id }) {
  const isNew = id === 'new';

  const [story, setStory] = useState(null);
  const [events, setEvents] = useState([]);
  const [form, setForm] = useState(EMPTY_FORM);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(!isNew);

  /** Puts a server response on screen. */
  function show(data) {
    setStory(data.story);
    if (data.events) setEvents(data.events);
    setForm({
      title: data.story.title,
      summary: data.story.summary,
      body: data.story.body,
      topic: data.story.topic,
    });
  }

  useEffect(() => {
    if (isNew) return;
    api.getStory(id)
      .then(show)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isNew]);

  // A reporter cannot edit a story that is in review, for example.
  const canEdit = isNew || story?.permissions.canEdit;

  function handleChange(event) {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  }

  /** Runs an API call with the shared busy and error handling. */
  async function run(action, successMessage) {
    setBusy(true);
    setError('');
    setNotice('');
    setFieldErrors({});
    try {
      await action();
      if (successMessage) setNotice(successMessage);
    } catch (err) {
      setError(err.message);
      setFieldErrors(err.fields ?? {});
    } finally {
      setBusy(false);
    }
  }

  function handleSubmit(event) {
    event.preventDefault();
    run(async () => {
      if (isNew) {
        const data = await api.createStory(form);
        navigate(`/stories/${data.story.id}`);
      } else {
        show(await api.updateStory(id, form));
      }
    }, 'Saved.');
  }

  function handleStatus(status) {
    run(async () => show(await api.setStatus(id, status)), 'Status updated.');
  }

  function handleDelete() {
    if (!window.confirm('Delete this story? This cannot be undone.')) return;
    run(async () => {
      await api.deleteStory(id);
      navigate('/');
    });
  }

  if (loading) return <p className="loading">Loading story…</p>;
  if (!isNew && !story) {
    return (
      <>
        <p className="form-error" role="alert">{error || 'Story not found.'}</p>
        <a href="#/">Back to stories</a>
      </>
    );
  }

  /** Props shared by every form field, including the error wiring. */
  function field(name) {
    return {
      id: name,
      name,
      value: form[name],
      onChange: handleChange,
      readOnly: !canEdit,
      'aria-invalid': fieldErrors[name] ? true : undefined,
      'aria-describedby': fieldErrors[name] ? `${name}-error` : undefined,
    };
  }

  return (
    <>
      <a className="back" href="#/">← All stories</a>

      <div className="page-header">
        <h1>{isNew ? 'New story' : story.title}</h1>
        {story && <StatusBadge status={story.status} />}
      </div>
      {story && (
        <p className="muted">
          By {story.author_name} · last updated {formatDate(story.updated_at)}
        </p>
      )}

      {/* Announced by screen readers without moving focus */}
      <p className="notice" role="status">{notice}</p>
      {error && <p className="form-error" role="alert">{error}</p>}

      <div className="story-layout">
        <form onSubmit={handleSubmit} className="card form" noValidate>
          {!canEdit && (
            <p className="locked">
              You can read this story but not change it while it is {story.status.replace('_', ' ')}.
            </p>
          )}

          <label htmlFor="title">Title</label>
          <input type="text" {...field('title')} />
          <FieldError name="title" errors={fieldErrors} />

          <label htmlFor="summary">Summary</label>
          <input type="text" {...field('summary')} />
          <FieldError name="summary" errors={fieldErrors} />

          <label htmlFor="topic">Topic</label>
          <select {...field('topic')} readOnly={undefined} disabled={!canEdit}>
            {TOPICS.map((topic) => (
              <option key={topic} value={topic}>{capitalize(topic)}</option>
            ))}
          </select>
          <FieldError name="topic" errors={fieldErrors} />

          <label htmlFor="body">Body</label>
          <textarea rows={12} {...field('body')} />
          <FieldError name="body" errors={fieldErrors} />

          {canEdit && (
            <button type="submit" className="button button-primary" disabled={busy}>
              {isNew ? 'Create draft' : 'Save changes'}
            </button>
          )}
        </form>

        {story && (
          <aside className="sidebar">
            <section className="card" aria-labelledby="actions-heading">
              <h2 id="actions-heading">Actions</h2>
              {story.permissions.nextStatuses.length === 0 && !story.permissions.canDelete && (
                <p className="muted">Nothing you can do with this story right now.</p>
              )}
              <div className="actions">
                {story.permissions.nextStatuses.map((status) => (
                  <button
                    key={status} type="button" disabled={busy}
                    className={status === 'draft' ? 'button' : 'button button-primary'}
                    onClick={() => handleStatus(status)}
                  >
                    {STATUS_ACTIONS[status]}
                  </button>
                ))}
                {story.permissions.canDelete && (
                  <button type="button" className="button button-danger" disabled={busy} onClick={handleDelete}>
                    Delete story
                  </button>
                )}
              </div>
            </section>

            <section className="card" aria-labelledby="history-heading">
              <h2 id="history-heading">History</h2>
              <ol className="history">
                {events.map((event) => (
                  <li key={event.id}>
                    <strong>{event.user_name}</strong> {event.action.replace('_', ' ')}
                    <time dateTime={event.created_at}>{formatDate(event.created_at)}</time>
                  </li>
                ))}
              </ol>
            </section>
          </aside>
        )}
      </div>
    </>
  );
}
