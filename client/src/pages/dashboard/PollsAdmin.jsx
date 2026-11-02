import { useState } from 'react';
import { Pencil, Plus, Trash2, X } from 'lucide-react';
import { adminApi, pollsApi } from '../../services/index.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useToast } from '../../context/ToastContext.jsx';
import ConfirmDialog from '../../components/ui/ConfirmDialog.jsx';
import Pagination from '../../components/ui/Pagination.jsx';
import { EmptyState, ErrorState, FieldError, Skeleton, Spinner } from '../../components/ui/Bits.jsx';
import { DashHeader, StatusPill } from '../../layouts/DashboardLayout.jsx';
import { formatDate } from '../../utils/format.js';

function toLocal(v) {
  if (!v) return '';
  const d = new Date(v);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

function PollForm({ initial, articles, onSave, onCancel }) {
  const [f, setF] = useState(() =>
    initial
      ? {
          question: initial.question,
          description: initial.description || '',
          options: initial.options.map((o) => ({ _id: o._id, text: o.text, votes: o.votes })),
          status: initial.status,
          closesAt: toLocal(initial.closesAt),
          featured: Boolean(initial.featured),
          article: initial.article?._id || '',
        }
      : { question: '', description: '', options: [{ text: '' }, { text: '' }], status: 'open', closesAt: '', featured: false, article: '' }
  );
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const errs = {};
    if (f.question.trim().length < 5) errs.question = 'Write a question (5+ characters).';
    const opts = f.options.filter((o) => o.text.trim());
    if (opts.length < 2) errs.options = 'Add at least two options.';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      await onSave({
        question: f.question.trim(),
        description: f.description.trim(),
        options: opts.map((o) => ({ ...(o._id ? { _id: o._id } : {}), text: o.text.trim() })),
        status: f.status,
        closesAt: f.closesAt ? new Date(f.closesAt).toISOString() : null,
        featured: f.featured,
        article: f.article || null,
      });
    } catch (err) {
      setErrors({ form: err.message });
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate className="space-y-4 border border-ink-600 bg-ink-900 p-5">
      {errors.form && <p className="text-sm text-blood-400" role="alert">{errors.form}</p>}
      <div>
        <label className="label" htmlFor="poll-q">Question</label>
        <input id="poll-q" className={`field ${errors.question ? 'field-error' : ''}`} maxLength={200} value={f.question} onChange={(e) => setF({ ...f, question: e.target.value })} />
        <FieldError>{errors.question}</FieldError>
      </div>
      <div>
        <label className="label" htmlFor="poll-d">Description</label>
        <textarea id="poll-d" rows={2} className="field" maxLength={600} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })} />
      </div>
      <div>
        <p className="label">Options (2–8)</p>
        <div className="space-y-2">
          {f.options.map((o, i) => (
            <div key={i} className="flex gap-2">
              <input aria-label={`Option ${i + 1}`} className="field" maxLength={120} value={o.text} onChange={(e) => setF({ ...f, options: f.options.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} />
              {o.votes > 0 && <span className="self-center whitespace-nowrap text-xs text-ink-400">{o.votes} votes</span>}
              <button type="button" disabled={f.options.length <= 2} aria-label="Remove option" className="px-2 text-ink-400 hover:text-blood-400 disabled:opacity-30" onClick={() => setF({ ...f, options: f.options.filter((_, j) => j !== i) })}>
                <X className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
        <FieldError>{errors.options}</FieldError>
        {initial && <p className="mt-1 text-xs text-ink-400">Removing an option discards its votes.</p>}
        {f.options.length < 8 && (
          <button type="button" className="btn-ghost btn-sm mt-2" onClick={() => setF({ ...f, options: [...f.options, { text: '' }] })}>
            <Plus className="h-3.5 w-3.5" /> Add option
          </button>
        )}
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="label" htmlFor="poll-s">Status</label>
          <select id="poll-s" className="field" value={f.status} onChange={(e) => setF({ ...f, status: e.target.value })}>
            <option value="open">Open</option>
            <option value="closed">Closed</option>
          </select>
        </div>
        <div>
          <label className="label" htmlFor="poll-c">Closes at (optional)</label>
          <input id="poll-c" type="datetime-local" className="field" value={f.closesAt} onChange={(e) => setF({ ...f, closesAt: e.target.value })} />
        </div>
        <div>
          <label className="label" htmlFor="poll-a">Linked article</label>
          <select id="poll-a" className="field" value={f.article} onChange={(e) => setF({ ...f, article: e.target.value })}>
            <option value="">None</option>
            {articles.map((a) => <option key={a._id} value={a._id}>{a.title}</option>)}
          </select>
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={f.featured} onChange={(e) => setF({ ...f, featured: e.target.checked })} className="accent-[#b5121b]" /> Feature on homepage
      </label>
      <div className="flex gap-2">
        <button className="btn-red btn-sm" disabled={busy}>{busy && <Spinner className="h-3.5 w-3.5" />} Save poll</button>
        <button type="button" className="btn-ghost btn-sm" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}

export default function PollsAdmin() {
  const toast = useToast();
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null); // 'new' | poll
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const polls = useAsync(() => pollsApi.list({ page, limit: 10 }), [page]);
  const articles = useAsync(() => adminApi.articles({ status: 'published', limit: 100 }), []);

  const save = async (body) => {
    if (editing === 'new') await pollsApi.create(body);
    else await pollsApi.update(editing._id, body);
    toast.success('Poll saved.');
    setEditing(null);
    polls.reload();
  };

  const remove = async () => {
    setBusy(true);
    try {
      await pollsApi.remove(pending._id);
      toast.success('Poll deleted.');
      setPending(null);
      polls.reload();
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <DashHeader title="Polls" subtitle="One vote per user per poll is enforced by the database." actions={!editing && <button className="btn-red btn-sm" onClick={() => setEditing('new')}>New poll</button>} />
      {editing && (
        <div className="mb-8">
          <PollForm key={editing === 'new' ? 'new' : editing._id} initial={editing === 'new' ? null : editing} articles={articles.data || []} onSave={save} onCancel={() => setEditing(null)} />
        </div>
      )}
      {polls.loading ? (
        <Skeleton className="h-60" />
      ) : polls.error ? (
        <ErrorState error={polls.error} onRetry={polls.reload} />
      ) : !polls.data.length ? (
        <EmptyState title="No polls yet" />
      ) : (
        <div className="space-y-3">
          {polls.data.map((p) => (
            <div key={p._id} className="flex flex-col gap-4 border border-ink-600 bg-ink-900 p-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <StatusPill status={p.isOpen ? 'open' : 'closed'} />
                  {p.featured && <span className="text-[10px] font-bold uppercase tracking-wider text-blood-400">Featured</span>}
                </div>
                <p className="mt-1.5 font-semibold text-white">{p.question}</p>
                <p className="mt-1 text-xs text-ink-400">
                  {p.totalVotes} votes · {p.options.length} options · created {formatDate(p.createdAt)}
                  {p.closesAt && ` · closes ${formatDate(p.closesAt)}`}
                </p>
                <div className="mt-2 flex h-1.5 overflow-hidden bg-ink-700">
                  {p.options.map((o, i) => (
                    <div key={o._id} title={`${o.text}: ${o.votes}`} style={{ width: `${p.totalVotes ? (o.votes / p.totalVotes) * 100 : 0}%` }} className={i % 2 ? 'bg-ink-300' : 'bg-blood'} />
                  ))}
                </div>
              </div>
              <div className="flex gap-1">
                <button className="p-2 text-ink-300 hover:text-white" onClick={() => { setEditing(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }} aria-label="Edit poll"><Pencil className="h-4 w-4" /></button>
                <button className="p-2 text-ink-300 hover:text-blood-400" onClick={() => setPending(p)} aria-label="Delete poll"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
      <Pagination page={page} pages={polls.meta?.pages} onChange={setPage} />
      <ConfirmDialog open={Boolean(pending)} title="Delete this poll?" message="All of its votes will be deleted too." busy={busy} onConfirm={remove} onCancel={() => setPending(null)} />
    </>
  );
}
