import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Summary from '../components/Summary.jsx';
import { capitalize, formatDate } from '../labels.js';

export default function StoryPage({ slug }) {
  const [story, setStory] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.getStory(slug)
      .then((data) => {
        setStory(data.story);
        document.title = `${data.story.title} · The Brief`;
      })
      .catch((err) => setError(err.message));

    // Put the site name back when the reader leaves the story.
    return () => { document.title = 'The Brief'; };
  }, [slug]);

  if (error) {
    return (
      <>
        <p className="error" role="alert">{error}</p>
        <a href="#/">Back to all stories</a>
      </>
    );
  }
  if (!story) return <p className="muted">Loading story…</p>;

  return (
    <article className="story">
      <a className="back" href="#/">← All stories</a>
      <p className="kicker">{capitalize(story.topic)}</p>
      <h1>{story.title}</h1>
      <p className="dek">{story.dek}</p>
      <p className="meta">
        {story.author} · <time dateTime={story.published_at}>{formatDate(story.published_at)}</time>
        {' · '}{story.reading_minutes} min read
      </p>

      <Summary slug={story.slug} />

      {/* The body is plain text with blank lines between paragraphs. React
          escapes it, so story text can never run as HTML or script. */}
      {story.body.split('\n\n').map((paragraph) => (
        <p key={paragraph}>{paragraph}</p>
      ))}
    </article>
  );
}
