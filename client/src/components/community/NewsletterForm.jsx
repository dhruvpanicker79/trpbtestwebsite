import { useState } from 'react';
import { ArrowRight } from 'lucide-react';
import { miscApi } from '../../services/index.js';
import { FieldError, Spinner } from '../ui/Bits.jsx';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [state, setState] = useState({ busy: false, error: '', done: '' });

  const submit = async (e) => {
    e.preventDefault();
    if (!EMAIL.test(email.trim())) return setState({ busy: false, error: 'Enter a valid email address.', done: '' });
    setState({ busy: true, error: '', done: '' });
    try {
      const { data } = await miscApi.subscribe(email.trim());
      setState({
        busy: false,
        error: '',
        done: data.alreadySubscribed ? 'You’re already on the list.' : 'You’re on the list. Welcome to the Playbook.',
      });
      setEmail('');
    } catch (err) {
      setState({ busy: false, error: err.message, done: '' });
    }
  };

  return (
    <form onSubmit={submit} noValidate className="w-full">
      <label htmlFor="newsletter-email" className="sr-only">
        Email address
      </label>
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-0">
        <input
          id="newsletter-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          aria-invalid={Boolean(state.error)}
          aria-describedby="newsletter-msg"
          className="h-14 flex-1 border-2 border-ink bg-transparent px-4 text-base text-ink placeholder:text-ink/40 focus:outline-none"
        />
        <button type="submit" disabled={state.busy} className="btn h-14 bg-ink text-bone hover:bg-blood sm:px-8">
          {state.busy ? <Spinner className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />} Subscribe
        </button>
      </div>
      <div id="newsletter-msg" aria-live="polite">
        {state.error && <FieldError>{state.error}</FieldError>}
        {state.done && <p className="mt-2 text-sm font-semibold text-blood">{state.done}</p>}
      </div>
    </form>
  );
}
