import { useState } from 'react';
import { api } from '../api.js';

export default function SignupForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ status: 'idle', message: '' }); // idle | sending | done | error

  async function handleSubmit(event) {
    event.preventDefault();
    setState({ status: 'sending', message: '' });
    try {
      const data = await api.subscribe(email);
      setState({ status: 'done', message: data.message });
      setEmail('');
    } catch (err) {
      setState({ status: 'error', message: err.message });
    }
  }

  const hasError = state.status === 'error';

  return (
    <form className="signup" onSubmit={handleSubmit} noValidate>
      <label htmlFor="signup-email">Get the morning brief by email</label>
      <div className="signup-row">
        <input
          id="signup-email" type="email" autoComplete="email" placeholder="name@example.com"
          value={email} onChange={(event) => setEmail(event.target.value)}
          aria-invalid={hasError || undefined}
          aria-describedby="signup-message"
        />
        <button type="submit" className="button button-primary" disabled={state.status === 'sending'}>
          Subscribe
        </button>
      </div>
      <p id="signup-message" role="status" className={hasError ? 'error' : 'success'}>
        {state.message}
      </p>
    </form>
  );
}
