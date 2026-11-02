import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Pencil, Search, Star, Trash2, ExternalLink } from 'lucide-react';
import { adminApi, articlesApi } from '../../services/index.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import { EmptyState, ErrorState, Skeleton } from '../../components/ui/Bits.jsx';
import { DashHeader, StatusPill } from '../../layouts/DashboardLayout.jsx';
import { formatDate } from '../../utils/format.js';

const STATUSES = ['', 'published', 'draft', 'scheduled'];

export default function ArticlesAdmin() {
  const { hasRole } = useAuth();
  const toast = useToast();
  const [status, setStatus] = useState('');
  const [q, setQ] = useState('');
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pending, setPending] = useState(null);
  const [busyId, setBusyId] = useState(null);
  const { data, meta, loading, error, reload, setData } = useAsync(() => adminApi.articles({ status, q: query, page }), [status, query, page]);

  const patchRow = (id, patch) => setData((rows) => rows.map((r) => (r._id === id ? { ...r, ...patch } : r)));

  const togglePublish = async (a) => {
    const next = a.status === 'published' ? 'draft' : 'published';
    setBusyId(a._id);
    try {
      const { data: updated } = await articlesApi.update(a._id, { status: next });
      patchRow(a._id, { status: updated.status, publishedAt: updated.publishedAt, featured: updated.featured });
      toast.success(next === 'published' ? 'Published.' : 'Unpublished — moved to drafts.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const toggleFeatured = async (a) => {
    setBusyId(a._id);
    try {
      const { data: res } = await adminApi.setFeatured(a._id, !a.featured);
      patchRow(a._id, { featured: res.featured });
      toast.success(res.featured ? 'Featured on the homepage.' : 'Removed from featured.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const remove = async () => {
    setBusyId(pending._id);
    try {
      await articlesApi.remove(pending._id);
      toast.success('Article deleted.');
      setPending(null);
      reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <>
      <DashHeader
        title="Articles"
        subtitle={hasRole('ADMIN') ? 'All articles across the publication.' : 'Your articles.'}
        actions={<Link to="/dashboard/articles/new" className="btn-red btn-sm">New article</Link>}
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <div className="flex border border-ink-600" role="group" aria-label="Filter by status">
          {STATUSES.map((s) => (
            <button
              key={s || 'all'}
              onClick={() => { setStatus(s); setPage(1); }}
              aria-pressed={status === s}
              className={`px-3 py-2 text-xs font-semibold uppercase tracking-wider ${status === s ? 'bg-bone text-ink' : 'text-ink-300 hover:text-white'}`}
            >
              {s || 'All'}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); setQuery(q); setPage(1); }} className="flex flex-1 items-center gap-2 border border-ink-600 px-3 sm:max-w-xs">
          <Search className="h-4 w-4 text-ink-400" aria-hidden />
          <label htmlFor="adm-q" className="sr-only">Search titles</label>
          <input id="adm-q" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search titles" className="w-full bg-transparent py-2 text-sm focus:outline-none" />
        </form>
      </div>

      {loading ? (
        <div className="space-y-2">{[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-14" />)}</div>
      ) : error ? (
        <ErrorState error={error} onRetry={reload} />
      ) : !data.length ? (
        <EmptyState title="No articles" message="Nothing matches these filters." action={<Link to="/dashboard/articles/new" className="btn-red btn-sm">Write one</Link>} />
      ) : (
        <div className="overflow-x-auto border border-ink-600">
          <table className="w-full min-w-[860px] text-left text-sm">
            <thead className="bg-ink-900 text-[11px] uppercase tracking-wider text-ink-400">
              <tr>
                <th className="px-4 py-3 font-semibold">Title</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Category</th>
                <th className="px-4 py-3 font-semibold">Author</th>
                <th className="px-4 py-3 text-right font-semibold">Views</th>
                <th className="px-4 py-3 font-semibold">Date</th>
                <th className="px-4 py-3 text-right font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.map((a) => (
                <tr key={a._id} className="border-t border-ink-700 align-middle hover:bg-ink-900/60">
                  <td className="max-w-[320px] px-4 py-3">
                    <Link to={`/dashboard/articles/${a._id}`} className="line-clamp-2 font-semibold text-white hover:underline">{a.title}</Link>
                    {a.featured && <span className="mt-1 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-blood-400"><Star className="h-3 w-3 fill-current" /> Featured</span>}
                  </td>
                  <td className="px-4 py-3"><StatusPill status={a.status} /></td>
                  <td className="px-4 py-3 text-ink-300">{a.category?.name}</td>
                  <td className="px-4 py-3 text-ink-300">{a.author?.name}</td>
                  <td className="px-4 py-3 text-right tabular-nums">{a.viewCount.toLocaleString()}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-ink-300">
                    {a.status === 'scheduled' ? `⏱ ${formatDate(a.scheduledFor, { dateStyle: 'medium', timeStyle: 'short' })}` : formatDate(a.publishedAt || a.updatedAt)}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-1">
                      <Link to={`/article/${a.slug}`} target="_blank" className="p-2 text-ink-300 hover:text-white" title={a.status === 'published' ? 'View' : 'Preview'} aria-label={`Preview ${a.title}`}>
                        <ExternalLink className="h-4 w-4" />
                      </Link>
                      <Link to={`/dashboard/articles/${a._id}`} className="p-2 text-ink-300 hover:text-white" title="Edit" aria-label={`Edit ${a.title}`}>
                        <Pencil className="h-4 w-4" />
                      </Link>
                      <button onClick={() => togglePublish(a)} disabled={busyId === a._id} className="p-2 text-ink-300 hover:text-white disabled:opacity-40" title={a.status === 'published' ? 'Unpublish' : 'Publish now'} aria-label={a.status === 'published' ? 'Unpublish' : 'Publish now'}>
                        {a.status === 'published' ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                      {hasRole('ADMIN') && (
                        <button onClick={() => toggleFeatured(a)} disabled={busyId === a._id || a.status !== 'published'} className={`p-2 disabled:opacity-30 ${a.featured ? 'text-blood-400' : 'text-ink-300 hover:text-white'}`} title={a.featured ? 'Unfeature' : 'Feature on homepage'} aria-label="Toggle featured">
                          <Star className={`h-4 w-4 ${a.featured ? 'fill-current' : ''}`} />
                        </button>
                      )}
                      <button onClick={() => setPending(a)} className="p-2 text-ink-300 hover:text-blood-400" title="Delete" aria-label={`Delete ${a.title}`}>
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination page={page} pages={meta?.pages} onChange={setPage} />

      <ConfirmDialog
        open={Boolean(pending)}
        title="Delete this article?"
        message={pending ? `“${pending.title}” and its comments, likes and bookmarks will be permanently removed.` : ''}
        busy={busyId === pending?._id}
        onConfirm={remove}
        onCancel={() => setPending(null)}
      />
    </>
  );
}
