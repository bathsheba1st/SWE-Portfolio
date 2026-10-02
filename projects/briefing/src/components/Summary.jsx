import { useState } from 'react';
import { api } from '../api.js';

// Tell the reader honestly where the summary came from.
const SOURCE_NOTES = {
  model: 'Written by an AI model from this story. Check the full text for detail.',
  fallback: 'Three sentences picked from this story automatically.',
};

/** The "three key points" box on a story page. */
export default function Summary({ slug }) {
  const [state, setState] = useState({ status: 'idle' }); // idle | loading | done | error

  async function handleClick() {
    setState({ status: 'loading' });
    try {
      const data = await api.summarize(slug);
      setState({ status: 'done', ...data });
    } catch (err) {
      setState({ status: 'error', message: err.message });
    }
  }

  return (
    <section className="summary" aria-labelledby="summary-heading">
      <h2 id="summary-heading">Three key points</h2>

      {state.status !== 'done' && (
        <button type="button" className="button" onClick={handleClick} disabled={state.status === 'loading'}>
          {state.status === 'loading' ? 'Summarizing…' : 'Summarize this story'}
        </button>
      )}

      {/* aria-live: the points are read out when they arrive */}
      <div aria-live="polite">
        {state.status === 'done' && (
          <>
            <ul>
              {state.bullets.map((bullet) => <li key={bullet}>{bullet}</li>)}
            </ul>
            <p className="small">{SOURCE_NOTES[state.source]}</p>
          </>
        )}
        {state.status === 'error' && <p className="error">{state.message}</p>}
      </div>
    </section>
  );
}
