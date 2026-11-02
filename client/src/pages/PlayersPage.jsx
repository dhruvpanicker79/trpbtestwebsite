import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { playersApi } from '../services/index.js';
import { useAsync } from '../hooks/useAsync.js';
import { useSeo } from '../hooks/useSeo.js';
import PlayerCard from '../components/community/PlayerCard.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { EmptyState, ErrorState, Skeleton } from '../components/ui/Bits.jsx';

export default function PlayersPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') || '';
  const sort = params.get('sort') || 'name';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const [input, setInput] = useState(q);

  useEffect(() => setInput(q), [q]);
  useSeo({ title: 'Player Files', description: 'Career timelines, achievements and community ratings for the players TRPB writes about.' });

  // Debounced search-as-you-type.
  useEffect(() => {
    const t = setTimeout(() => {
      if (input !== q) {
        const next = new URLSearchParams(params);
        input ? next.set('q', input) : next.delete('q');
        next.delete('page');
        setParams(next, { replace: true });
      }
    }, 300);
    return () => clearTimeout(t);
  }, [input, q, params, setParams]);

  const { data, meta, loading, error, reload } = useAsync(() => playersApi.list({ q, sort, page, limit: 12 }), [q, sort, page]);

  return (
    <div className="container-site py-12">
      <p className="kicker text-blood-400">Database</p>
      <h1 className="mt-2 font-display text-5xl font-bold text-white sm:text-7xl">Player Files</h1>
      <p className="mt-4 max-w-2xl font-serif text-lg text-ink-300">
        Editorial career profiles maintained by the TRPB desk, with community ratings. We don’t publish live statistics;
        profiles marked “sample” are fictional demonstrations.
      </p>

      <div className="mt-10 flex flex-col gap-4 border-y border-ink-600 py-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex flex-1 items-center gap-3">
          <Search className="h-5 w-5 text-ink-300" aria-hidden />
          <span className="sr-only">Filter players</span>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Filter by name, club or nationality"
            className="w-full bg-transparent text-base text-white placeholder:text-ink-400 focus:outline-none"
          />
        </label>
        <label className="flex items-center gap-2 text-xs text-ink-300">
          Sort
          <select
            value={sort}
            onChange={(e) => {
              const next = new URLSearchParams(params);
              next.set('sort', e.target.value);
              next.delete('page');
              setParams(next);
            }}
            className="border border-ink-500 bg-ink-800 px-2 py-1.5 text-bone"
          >
            <option value="name">Name</option>
            <option value="rating">Community rating</option>
          </select>
        </label>
      </div>

      <div className="mt-10">
        {loading ? (
          <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="aspect-[3/4]" />)}
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : !data?.length ? (
          <EmptyState title="No players found" message="Try a different name or club." />
        ) : (
          <>
            <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:grid-cols-4">
              {data.map((p) => <PlayerCard key={p._id} player={p} />)}
            </div>
            <Pagination
              page={page}
              pages={meta?.pages}
              onChange={(p) => {
                const next = new URLSearchParams(params);
                next.set('page', String(p));
                setParams(next);
                window.scrollTo({ top: 0 });
              }}
            />
          </>
        )}
      </div>
    </div>
  );
}
