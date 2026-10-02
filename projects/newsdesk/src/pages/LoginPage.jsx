import { useState } from 'react';
import { api } from '../api.js';

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault(); // stop the browser reloading the page
    setError('');
    setBusy(true);
    try {
      const data = await api.login(email, password);
      onLogin(data.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  function fillDemo(demoEmail) {
    setEmail(demoEmail);
    setPassword('newsdesk-demo');
  }

  return (
    <main className="login">
      <h1>Newsdesk</h1>
      <p className="muted">Sign in to write, review and publish stories.</p>

      <form onSubmit={handleSubmit} className="card form">
        {/* role="alert" makes screen readers announce the error right away */}
        {error && <p className="form-error" role="alert">{error}</p>}

        <label htmlFor="email">Email</label>
        <input
          id="email" type="email" autoComplete="username" required
          value={email} onChange={(event) => setEmail(event.target.value)}
        />

        <label htmlFor="password">Password</label>
        <input
          id="password" type="password" autoComplete="current-password" required
          value={password} onChange={(event) => setPassword(event.target.value)}
        />

        <button type="submit" className="button button-primary" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <section className="demo" aria-labelledby="demo-heading">
        <h2 id="demo-heading">Demo accounts</h2>
        <p className="muted">This is a demo with made-up data. Pick a role to fill in the form.</p>
        <div className="demo-buttons">
          <button type="button" className="button" onClick={() => fillDemo('reporter@newsdesk.test')}>
            Reporter
          </button>
          <button type="button" className="button" onClick={() => fillDemo('editor@newsdesk.test')}>
            Editor
          </button>
        </div>
      </section>
    </main>
  );
}
