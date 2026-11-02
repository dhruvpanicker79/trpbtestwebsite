import { useState } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../../services/index.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { Avatar, EmptyState, ErrorState, Skeleton } from '../../components/ui/Bits.jsx';
import { DashHeader } from '../../layouts/DashboardLayout.jsx';
import { formatDate } from '../../utils/format.js';

function Users() {
  const { user: me } = useAuth();
  const toast = useToast();
  const [role, setRole] = useState('');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [busyId, setBusyId] = useState(null);
  const { data, meta, loading, error, reload, setData } = useAsync(() => adminApi.users({ role, q: query, page }), [role, query, page]);

  const changeRole = async (u, next) => {
    if (next === u.role) return;
    if (!window.confirm(`Change @${u.username} from ${u.role} to ${next}?`)) return;
    setBusyId(u._id);
    try {
      const { data: updated } = await adminApi.setRole(u._id, next);
      setData((rows) => rows.map((r) => (r._id === u._id ? { ...r, role: updated.role } : r)));
      toast.success(`@${u.username} is now ${updated.role}.`);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <div className="mb-5 flex flex-wrap gap-3">
        <select aria-label="Filter by role" className="field max-w-[160px]" value={role} onChange={(e) => { setRole(e.target.value); setPage(1); }}>
          <option value="">All roles</option>
          <option value="USER">Users</option>
          <option value="EDITOR">Editors</option>
          <option value="ADMIN">Admins</option>
        </select>
        <form onSubmit={(e) => { e.preventDefault(); setQuery(q); setPage(1); }} className="flex gap-2">
          <input aria-label="Search users" className="field" placeholder="Name, username or email" value={q} onChange={(e) => setQ(e.target.value)} />
          <button className="btn-ghost btn-sm">Search</button>
        </form>
      </div>
      {loading ? (
        <Skeleton className="h-60" />
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data.length ? (
        <EmptyState title="No users found" />
      ) : (
        <div className="overflow-x-auto border border-ink-600">
          <table className="w-full min-w-[680px] text-left text-sm">
            <thead className="bg-ink-900 text-[11px] uppercase tracking-wider text-ink-400">
              <tr>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Joined</th>
                <th className="px-4 py-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {data.map((u) => (
                <tr key={u._id} className="border-t border-ink-700">
                  <td className="px-4 py-3">
                    <Link to={`/u/${u.username}`} target="_blank" className="flex items-center gap-3">
                      <Avatar user={u} size={32} />
                      <span>
                        <span className="block font-semibold text-white">{u.name}</span>
                        <span className="block text-xs text-ink-400">@{u.username}</span>
                      </span>
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-ink-300">{u.email}</td>
                  <td className="px-4 py-3 text-ink-300">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    {u._id === me._id ? (
                      <span className="text-xs font-semibold text-ink-300">{u.role} (you)</span>
                    ) : (
                      <select aria-label={`Role for ${u.username}`} disabled={busyId === u._id} className="border border-ink-500 bg-ink-800 px-2 py-1.5 text-xs font-semibold" value={u.role} onChange={(e) => changeRole(u, e.target.value)}>
                        <option value="USER">USER</option>
                        <option value="EDITOR">EDITOR</option>
                        <option value="ADMIN">ADMIN</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={meta?.pages} onChange={setPage} />
    </>
  );
}

function Subscribers() {
  const [page, setPage] = useState(1);
  const { data, meta, loading, error, reload } = useAsync(() => adminApi.subscribers({ page }), [page]);
  if (loading) return <Skeleton className="h-40" />;
  if (error) return <ErrorState error={error} onRetry={reload} />;
  if (!data.length) return <EmptyState title="No subscribers yet" />;
  return (
    <>
      <p className="mb-4 text-sm text-ink-300">{meta.total} addresses stored. TRPB stores sign-ups only — connect an email provider to send newsletters.</p>
      <ul className="divide-y divide-ink-700 border border-ink-600">
        {data.map((s) => (
          <li key={s._id} className="flex justify-between px-4 py-2.5 text-sm">
            <span className="text-white">{s.email}</span>
            <span className="text-xs text-ink-400">{s.status} · {formatDate(s.createdAt)}</span>
          </li>
        ))}
      </ul>
      <Pagination page={page} pages={meta.pages} onChange={setPage} />
    </>
  );
}

export default function UsersAdmin() {
  const [tab, setTab] = useState('users');
  return (
    <>
      <DashHeader title="Users & roles" subtitle="Role changes take effect on the user’s next request. You can’t change your own role." />
      <div className="mb-6 flex border-b border-ink-600" role="tablist">
        {[['users', 'Users'], ['subs', 'Newsletter']].map(([v, l]) => (
          <button key={v} role="tab" aria-selected={tab === v} onClick={() => setTab(v)} className={`-mb-px border-b-2 px-4 py-2.5 text-xs font-semibold uppercase tracking-wider ${tab === v ? 'border-blood text-white' : 'border-transparent text-ink-300 hover:text-white'}`}>
            {l}
          </button>
        ))}
      </div>
      {tab === 'users' ? <Users /> : <Subscribers />}
    </>
  );
}
