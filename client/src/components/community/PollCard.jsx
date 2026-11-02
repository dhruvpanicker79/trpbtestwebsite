import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Check, Lock } from 'lucide-react';
import { pollsApi } from '../../services/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { Spinner } from '../ui/Bits.jsx';

/** Poll with one-vote-per-user voting and animated result bars. */
export default function PollCard({ poll: initial, light = false }) {
  const [poll, setPoll] = useState(initial);
  const [choice, setChoice] = useState(null);
  const [busy, setBusy] = useState(false);
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const showResults = Boolean(poll.userVote) || !poll.isOpen;
  const total = poll.totalVotes || 0;
  const leader = Math.max(...poll.options.map((o) => o.votes));

  const vote = async (e) => {
    e.preventDefault();
    if (!user) {
      toast.info('Sign in to vote.');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    if (!choice) return toast.error('Pick an option first.');
    setBusy(true);
    try {
      const { data } = await pollsApi.vote(poll._id, choice);
      setPoll((p) => ({ ...p, ...data, article: p.article }));
      toast.success('Vote counted.');
    } catch (err) {
      toast.error(err.message);
      if (err.status === 409) {
        const { data } = await pollsApi.get(poll._id);
        setPoll(data);
      }
    } finally {
      setBusy(false);
    }
  };

  const border = light ? 'border-ink/20' : 'border-ink-500';
  const text = light ? 'text-ink' : 'text-white';
  const muted = light ? 'text-ink/60' : 'text-ink-300';

  return (
    <div className={`flex h-full flex-col border ${border} p-5 sm:p-6`}>
      <div className="flex items-center justify-between gap-3">
        <p className={`kicker ${light ? 'text-blood' : 'text-blood-400'}`}>{poll.isOpen ? 'Open poll' : 'Closed poll'}</p>
        {!poll.isOpen && <Lock className={`h-3.5 w-3.5 ${muted}`} aria-hidden />}
      </div>
      <h3 className={`mt-3 font-display text-2xl font-semibold leading-tight ${text}`}>{poll.question}</h3>
      {poll.description && <p className={`mt-2 text-sm ${muted}`}>{poll.description}</p>}

      {showResults ? (
        <ul className="mt-5 space-y-3" aria-label="Results">
          {poll.options.map((o) => {
            const pct = total ? Math.round((o.votes / total) * 100) : 0;
            const mine = poll.userVote === o._id;
            const top = o.votes === leader && leader > 0;
            return (
              <li key={o._id}>
                <div className={`flex justify-between text-sm ${text}`}>
                  <span className="flex items-center gap-2 font-medium">
                    {o.text} {mine && <Check className="h-3.5 w-3.5 text-blood-400" aria-label="Your vote" />}
                  </span>
                  <span className="font-semibold tabular-nums">{pct}%</span>
                </div>
                <div className={`mt-1.5 h-2 ${light ? 'bg-ink/10' : 'bg-ink-600'}`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${pct}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className={`h-full ${top ? 'bg-blood' : light ? 'bg-ink/40' : 'bg-ink-300'}`}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <form onSubmit={vote} className="mt-5">
          <fieldset>
            <legend className="sr-only">{poll.question}</legend>
            <div className="space-y-2">
              {poll.options.map((o) => (
                <label
                  key={o._id}
                  className={`flex cursor-pointer items-center gap-3 border px-4 py-3 text-sm transition-colors ${
                    choice === o._id ? 'border-blood bg-blood/10' : `${border} hover:border-current`
                  } ${text}`}
                >
                  <input
                    type="radio"
                    name={`poll-${poll._id}`}
                    value={o._id}
                    checked={choice === o._id}
                    onChange={() => setChoice(o._id)}
                    className="accent-[#b5121b]"
                  />
                  {o.text}
                </label>
              ))}
            </div>
          </fieldset>
          <button type="submit" disabled={busy} className="btn-red btn-sm mt-4 w-full">
            {busy && <Spinner className="h-3.5 w-3.5" />} Cast vote
          </button>
        </form>
      )}

      <div className={`mt-auto flex items-center justify-between pt-5 text-xs ${muted}`}>
        <span>{total.toLocaleString()} votes</span>
        {poll.article && (
          <Link to={`/article/${poll.article.slug}`} className={`font-semibold ${light ? 'hover:text-ink' : 'hover:text-white'} underline decoration-blood underline-offset-4`}>
            Read the story
          </Link>
        )}
      </div>
    </div>
  );
}
