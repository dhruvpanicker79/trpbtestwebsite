import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Pencil, Trash2 } from 'lucide-react';
import { playersApi } from '../../services/index.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useToast } from '../../context/ToastContext.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { Avatar, EmptyState, ErrorState, Skeleton } from '../../components/ui/Bits.jsx';
import { DashHeader } from '../../layouts/DashboardLayout.jsx';

export default function PlayersAdmin() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const { data, meta, loading, error, reload } = useAsync(() => playersApi.list({ page, q, limit: 20 }), [page, q]);

  const remove = async () => {
    setBusy(true);
    try {
      await playersApi.remove(pending._id);
      toast.success('Player deleted.');
      setPending(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <DashHeader title="Players" subtitle="Editorial player profiles. No live data — everything here is edited by hand." actions={<Link to="/dashboard/players/new" className="btn-red btn-sm">Add player</Link>} />
      <input aria-label="Filter players" className="field mb-5 max-w-xs" placeholder="Filter by name or club" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} />
      {loading ? (
        <Skeleton className="h-60" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data.length ? (
        <EmptyState title="No players" action={<Link to="/dashboard/players/new" className="btn-red btn-sm">Add the first</Link>} />
      ) : (
        <div className="overflow-x-auto border border-ink-600">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-ink-900 text-[11px] uppercase tracking-wider text-ink-400">
              <tr>
                <th className="px-4 py-3">Player</th>
                <th className="px-4 py-3">Position</th>
                <th className="px-4 py-3">Club</th>
                <th className="px-4 py-3 text-right">Rating</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((p) => (
                <tr key={p._id} className="border-t border-ink-700">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar user={{ name: p.name, avatar: p.portrait }} size={36} />
                      <div>
                        <p className="font-semibold text-white">{p.name}</p>
                        <p className="text-xs text-ink-400">{p.nationality}{p.isSample ? ' · sample' : ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-ink-300">{p.position}</td>
                  <td className="px-4 py-3 text-ink-300">{p.currentClub}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{p.ratingCount ? `${p.ratingAverage.toFixed(1)} (${p.ratingCount})` : '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link to={`/players/${p.slug}`} target="_blank" className="p-2 text-ink-300 hover:text-white" aria-label={`View ${p.name}`}><ExternalLink className="h-4 w-4" /></Link>
                      <Link to={`/dashboard/players/${p._id}`} className="p-2 text-ink-300 hover:text-white" aria-label={`Edit ${p.name}`}><Pencil className="h-4 w-4" /></Link>
                      <button onClick={() => setPending(p)} className="p-2 text-ink-300 hover:text-blood-400" aria-label={`Delete ${p.name}`}><Trash2 className="h-4 w-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={meta?.pages} onChange={setPage} />
      <ConfirmDialog open={Boolean(pending)} title="Delete this player?" message="Their ratings will be removed and they’ll be unlinked from articles." busy={busy} onConfirm={remove} onCancel={() => setPending(null)} />
    </>
  );
}
