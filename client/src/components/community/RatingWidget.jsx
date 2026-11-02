import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { playersApi } from '../../services/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';

/** 1–10 community rating. One rating per user; re-rating replaces the old score. */
export default function RatingWidget({ player, onRated }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [hover, setHover] = useState(null);
  const [busy, setBusy] = useState(false);
  const current = player.myRating;

  const rate = async (score) => {
    if (!user) {
      toast.info('Sign in to rate players.');
      navigate('/login', { state: { from: location.pathname } });
      return;
    }
    setBusy(true);
    try {
      const { data } = await playersApi.rate(player._id, score);
      onRated(data, score);
      toast.success(current ? `Rating updated to ${score}.` : `You rated ${player.name} ${score}/10.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  const shown = hover ?? current ?? 0;
  const max = Math.max(1, ...player.ratingDistribution.map((d) => d.count));

  return (
    <div className="border border-ink-500 p-5 sm:p-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="kicker text-blood-400">Community rating</p>
          <p className="mt-2 font-display text-6xl font-bold leading-none text-white tabular-nums">
            {player.ratingCount ? player.ratingAverage.toFixed(1) : '—'}
            <span className="ml-1 text-xl text-ink-400">/10</span>
          </p>
          <p className="mt-2 text-xs text-ink-300">
            {player.ratingCount} rating{player.ratingCount === 1 ? '' : 's'} from TRPB readers
          </p>
        </div>
        {/* Distribution sparkline */}
        <div className="flex h-16 items-end gap-[3px]" aria-hidden>
          {player.ratingDistribution.map((d) => (
            <div key={d.score} className={`w-2.5 ${d.score === current ? 'bg-blood' : 'bg-ink-500'}`} style={{ height: `${Math.max(6, (d.count / max) * 100)}%` }} />
          ))}
        </div>
      </div>

      <fieldset className="mt-6" disabled={busy}>
        <legend className="mb-2 text-sm text-bone">{current ? `Your rating: ${current}/10 — tap to change` : 'Your rating'}</legend>
        <div className="grid grid-cols-10 gap-1" onMouseLeave={() => setHover(null)} role="radiogroup" aria-label="Rate from 1 to 10">
          {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={current === n}
              aria-label={`${n} out of 10`}
              onMouseEnter={() => setHover(n)}
              onFocus={() => setHover(n)}
              onBlur={() => setHover(null)}
              onClick={() => rate(n)}
              className={`h-10 text-sm font-bold tabular-nums transition-colors ${
                n <= shown ? 'bg-blood text-white' : 'bg-ink-700 text-ink-300 hover:bg-ink-600'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </fieldset>
    </div>
  );
}
