import { useState } from 'react';
import { pollsApi } from '../services/index.js';
import { usePaged } from '../hooks/useAsync.js';
import { useSeo } from '../hooks/useSeo.js';
import PollCard from '../components/community/PollCard.jsx';
import { EmptyState, ErrorState, LoadMore, Skeleton } from '../components/ui/Bits.jsx';

const TABS = [
  ['', 'All'],
  ['open', 'Open'],
  ['closed', 'Closed'],
];

export default function PollsPage() {
  const [status, setStatus] = useState('');
  useSeo({ title: 'Polls & Debates', description: 'Vote on the questions the TRPB community is arguing about.' });
  const { items, loading, loadingMore, error, hasMore, loadMore, reload } = usePaged(
    (page) => pollsApi.list({ page, limit: 6, status }),
    [status]
  );

  return (
    <div className="container-site py-12">
      <p className="kicker text-blood-400">Community</p>
      <h1 className="mt-2 font-display text-5xl font-bold text-white sm:text-7xl">Polls & Debates</h1>
      <p className="mt-4 max-w-xl font-serif text-lg text-ink-300">One account, one vote per poll. Results appear once you’ve voted or the poll closes.</p>

      <div className="mt-10 flex gap-1 border-b border-ink-600" role="tablist" aria-label="Filter polls">
        {TABS.map(([value, label]) => (
          <button
            key={label}
            role="tab"
            aria-selected={status === value}
            onClick={() => setStatus(value)}
            className={`-mb-px border-b-2 px-4 py-3 text-xs font-semibold uppercase tracking-wider ${status === value ? 'border-blood text-white' : 'border-transparent text-ink-300 hover:text-white'}`}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="mt-10">
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-80" />)}</div>
        ) : error ? (
          <ErrorState error={error} onRetry={reload} />
        ) : items.length === 0 ? (
          <EmptyState title="No polls here" />
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {items.map((p) => <PollCard key={p._id} poll={p} />)}
          </div>
        )}
        <LoadMore hasMore={hasMore} loading={loadingMore} onClick={loadMore} />
      </div>
    </div>
  );
}
