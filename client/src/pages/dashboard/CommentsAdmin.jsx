import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, Trash2 } from 'lucide-react';
import { adminApi } from '../../services/index.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useToast } from '../../context/ToastContext.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { Avatar, EmptyState, ErrorState, Skeleton } from '../../components/ui/Bits.jsx';
import { DashHeader, StatusPill } from '../../layouts/DashboardLayout.jsx';
import { timeAgo } from '../../utils/format.js';

const FILTERS = [
  ['reported', 'Reported'],
  ['all', 'All visible'],
  ['hidden', 'Hidden'],
];

export default function CommentsAdmin() {
  const toast = useToast();
  const [filter, setFilter] = useState('reported');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);
  const { data, meta, loading, error, reload, setData } = useAsync(() => adminApi.comments({ filter, page }), [filter, page]);

  const act = async (c, body, message) => {
    setBusyId(c._id);
    try {
      await adminApi.moderate(c._id, body);
      toast.success(message);
      // Drop rows that no longer match the current filter.
      setData((rows) =>
        rows
          .map((r) => (r._id === c._id ? { ...r, status: body.status, reportCount: body.clearReports ? 0 : r.reportCount } : r))
          .filter((r) => {
            if (r.status === 'removed') return false;
            if (filter === 'reported') return r.reportCount > 0 && r.status === 'visible';
            if (filter === 'hidden') return r.status === 'hidden';
            return true;
          })
      );
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <DashHeader title="Comment moderation" subtitle="Review reports, hide or restore comments, or remove them permanently." />
      <div className="mb-5 flex border-b border-ink-600" role="tablist">
        {FILTERS.map(([v, l]) => (
          <button key={v} role="tab" aria-selected={filter === v} onClick={() => { setFilter(v); setPage(1); }} className={`-mb-px border-b-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider ${filter === v ? 'border-blood text-white' : 'border-transparent text-ink-300 hover:text-white'}`}>
            {l}
          </button>
        ))}
      </div>

      {loading ? (
        <Skeleton className="h-60" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data.length ? (
        <EmptyState title={filter === 'reported' ? 'No reported comments' : 'Nothing here'} message={filter === 'reported' ? 'The terraces are behaving.' : undefined} />
      ) : (
        <ul className="space-y-3">
          {data.map((c) => (
            <li key={c._id} className="border border-ink-600 bg-ink-900 p-4">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <Avatar user={c.author} size={36} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-xs text-ink-400">
                    <span className="font-semibold text-white">{c.author?.name}</span> @{c.author?.username} · {timeAgo(c.createdAt)} · on{' '}
                    {c.article ? <Link to={`/article/${c.article.slug}#comments`} target="_blank" className="text-bone underline decoration-blood underline-offset-2">{c.article.title}</Link> : 'deleted article'}
                    <StatusPill status={c.status} />
                  </p>
                  <p className="mt-2 whitespace-pre-line font-serif text-bone/90">{c.body}</p>
                  {c.reportCount > 0 && (
                    <div className="mt-3 border-l-2 border-blood pl-3 text-xs text-ink-300">
                      <p className="font-semibold text-blood-400">{c.reportCount} report{c.reportCount > 1 ? 's' : ''}</p>
                      <ul className="mt-1 space-y-0.5">
                        {(c.reports || []).slice(0, 5).map((r, i) => (
                          <li key={i}>@{r.user?.username || 'user'}: {r.reason || <em>no reason given</em>}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
                <div className="flex shrink-0 flex-wrap gap-2">
                  {c.status === 'visible' && c.reportCount > 0 && (
                    <button className="btn-ghost btn-sm" disabled={busyId === c._id} onClick={() => act(c, { status: 'visible', clearReports: true }, 'Reports dismissed.')}>
                      <ShieldCheck className="h-3.5 w-3.5" /> Keep
                    </button>
                  )}
                  {c.status === 'visible' ? (
                    <button className="btn-ghost btn-sm" disabled={busyId === c._id} onClick={() => act(c, { status: 'hidden' }, 'Comment hidden.')}>
                      <EyeOff className="h-3.5 w-3.5" /> Hide
                    </button>
                  ) : (
                    <button className="btn-ghost btn-sm" disabled={busyId === c._id} onClick={() => act(c, { status: 'visible', clearReports: true }, 'Comment restored.')}>
                      <Eye className="h-3.5 w-3.5" /> Restore
                    </button>
                  )}
                  <button className="btn-red btn-sm" disabled={busyId === c._id} onClick={() => act(c, { status: 'removed' }, 'Comment removed.')}>
                    <Trash2 className="h-3.5 w-3.5" /> Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
      <Pagination page={page} pages={meta?.pages} onChange={setPage} />
    </>
  );
}
