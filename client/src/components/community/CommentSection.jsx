import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Flag, CornerDownRight, Trash2 } from 'lucide-react';
import { commentsApi } from '../../services/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { usePaged } from '../../hooks/useAsync.js';
import { Avatar, EmptyState, ErrorState, FieldError, LoadMore, Skeleton, Spinner } from '../ui/Bits.jsx';
import ConfirmDialog from '../ui/ConfirmDialog.jsx';
import { timeAgo } from '../../utils/format.js';

const MAX = 2000;

function CommentForm({ onSubmit, placeholder = 'Add to the discussion…', autoFocus, onCancel, submitLabel = 'Post comment' }) {
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    const text = body.trim();
    if (text.length < 2) return setError('Write at least a couple of characters.');
    if (text.length > MAX) return setError(`Keep it under ${MAX} characters.`);
    setBusy(true);
    setError('');
    try {
      await onSubmit(text);
      setBody('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} noValidate>
      <label className="sr-only" htmlFor={`c-${placeholder}`}>
        {placeholder}
      </label>
      <textarea
        id={`c-${placeholder}`}
        value={body}
        autoFocus={autoFocus}
        onChange={(e) => setBody(e.target.value)}
        rows={autoFocus ? 3 : 4}
        maxLength={MAX + 100}
        placeholder={placeholder}
        className={`field resize-y font-serif text-base ${error ? 'field-error' : ''}`}
        aria-invalid={Boolean(error)}
      />
      <FieldError>{error}</FieldError>
      <div className="mt-3 flex items-center justify-between gap-3">
        <span className={`text-xs ${body.length > MAX ? 'text-blood-400' : 'text-ink-400'}`}>
          {body.length}/{MAX}
        </span>
        <div className="flex gap-2">
          {onCancel && (
            <button type="button" className="btn-ghost btn-sm" onClick={onCancel}>
              Cancel
            </button>
          )}
          <button type="submit" disabled={busy} className="btn-red btn-sm">
            {busy && <Spinner className="h-3.5 w-3.5" />} {submitLabel}
          </button>
        </div>
      </div>
    </form>
  );
}

function CommentItem({ comment, isReply, onReply, onDelete, onReport, canReply }) {
  const { user } = useAuth();
  const [replying, setReplying] = useState(false);

  if (comment.removed) {
    return <p className="py-3 text-sm italic text-ink-400">This comment was removed.</p>;
  }
  const mine = user && comment.author && String(comment.author._id) === String(user._id);
  const canDelete = mine || user?.role === 'ADMIN';

  return (
    <div className="py-4">
      <div className="flex items-start gap-3">
        <Avatar user={comment.author} size={isReply ? 28 : 36} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-x-2 text-sm">
            <Link to={`/u/${comment.author.username}`} className="font-semibold text-white hover:underline">
              {comment.author.name}
            </Link>
            {comment.author.role !== 'USER' && (
              <span className="bg-blood px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                {comment.author.role === 'ADMIN' ? 'TRPB' : 'Writer'}
              </span>
            )}
            <time className="text-xs text-ink-400" dateTime={comment.createdAt}>
              {timeAgo(comment.createdAt)}
            </time>
          </p>
          <p className="mt-1.5 whitespace-pre-line break-words font-serif text-[16px] leading-relaxed text-bone/90">{comment.body}</p>
          <div className="mt-2 flex items-center gap-4 text-xs font-semibold text-ink-300">
            {canReply && user && (
              <button onClick={() => setReplying((r) => !r)} className="inline-flex items-center gap-1 hover:text-white">
                <CornerDownRight className="h-3.5 w-3.5" /> Reply
              </button>
            )}
            {user && !mine && (
              <button onClick={() => onReport(comment)} className="inline-flex items-center gap-1 hover:text-white">
                <Flag className="h-3.5 w-3.5" /> Report
              </button>
            )}
            {canDelete && (
              <button onClick={() => onDelete(comment)} className="inline-flex items-center gap-1 hover:text-blood-400">
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </button>
            )}
          </div>
          {replying && (
            <div className="mt-4">
              <CommentForm
                autoFocus
                placeholder={`Reply to ${comment.author.name}…`}
                submitLabel="Reply"
                onCancel={() => setReplying(false)}
                onSubmit={async (text) => {
                  await onReply(comment, text);
                  setReplying(false);
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function CommentSection({ articleId, onCountChange }) {
  const { user } = useAuth();
  const toast = useToast();
  const location = useLocation();
  const [sort, setSort] = useState('newest');
  const [pendingDelete, setPendingDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const { items, setItems, loading, loadingMore, error, hasMore, loadMore, reload, meta } = usePaged(
    (page) => commentsApi.list(articleId, { page, sort }),
    [articleId, sort]
  );

  const add = async (text) => {
    const { data } = await commentsApi.create(articleId, text);
    setItems((list) => (sort === 'newest' ? [data, ...list] : [...list, data]));
    onCountChange(1);
    toast.success('Comment posted.');
  };

  const reply = async (parent, text) => {
    const { data } = await commentsApi.reply(parent._id, text);
    const rootId = parent.parent || parent._id;
    setItems((list) => list.map((c) => (c._id === rootId ? { ...c, replies: [...(c.replies || []), data] } : c)));
    onCountChange(1);
    toast.success('Reply posted.');
  };

  const confirmDelete = async () => {
    const c = pendingDelete;
    setDeleting(true);
    try {
      await commentsApi.remove(c._id);
      setItems((list) =>
        list
          .map((t) => {
            if (t._id === c._id) return t.replies?.length ? { ...t, removed: true } : null;
            return { ...t, replies: (t.replies || []).filter((r) => r._id !== c._id) };
          })
          .filter(Boolean)
      );
      onCountChange(-1);
      toast.success('Comment deleted.');
      setPendingDelete(null);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setDeleting(false);
    }
  };

  const report = async (c) => {
    const reason = window.prompt('Why are you reporting this comment? (optional)', '');
    if (reason === null) return;
    try {
      await commentsApi.report(c._id, reason.slice(0, 200));
      toast.success('Thanks — our moderators will take a look.');
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <section id="comments" aria-labelledby="comments-heading" className="scroll-mt-28">
      <div className="flex flex-wrap items-end justify-between gap-4 border-t-2 border-bone pt-4">
        <h2 id="comments-heading" className="font-display text-3xl font-bold text-white">
          The Discussion {meta?.total ? <span className="text-ink-400">({meta.total})</span> : null}
        </h2>
        <label className="flex items-center gap-2 text-xs text-ink-300">
          Sort
          <select value={sort} onChange={(e) => setSort(e.target.value)} className="border border-ink-500 bg-ink-800 px-2 py-1.5 text-bone">
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
          </select>
        </label>
      </div>

      <div className="mt-6">
        {user ? (
          <CommentForm onSubmit={add} />
        ) : (
          <div className="border border-ink-600 bg-ink-800 px-5 py-6 text-sm text-ink-300">
            <Link to="/login" state={{ from: location.pathname }} className="link-underline font-semibold text-bone">
              Sign in
            </Link>{' '}
            or{' '}
            <Link to="/register" className="link-underline font-semibold text-bone">
              create an account
            </Link>{' '}
            to join the discussion.
          </div>
        )}
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="space-y-6">
            {[0, 1].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-9 w-9" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-4 w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <ErrorState error={error} onRetry={reload} title="Couldn’t load comments" />
        ) : items.length === 0 ? (
          <EmptyState title="No comments yet" message="Start the conversation." />
        ) : (
          <ul className="divide-y divide-ink-600">
            {items.map((c) => (
              <li key={c._id}>
                <CommentItem comment={c} canReply={!c.removed} onReply={reply} onDelete={setPendingDelete} onReport={report} />
                {c.replies?.length > 0 && (
                  <ul className="mb-4 ml-5 border-l-2 border-ink-600 pl-4 sm:ml-12">
                    {c.replies.map((r) => (
                      <li key={r._id}>
                        <CommentItem comment={r} isReply canReply onReply={(_, text) => reply(c, text)} onDelete={setPendingDelete} onReport={report} />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
        <LoadMore hasMore={hasMore} loading={loadingMore} onClick={loadMore} />
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        title="Delete this comment?"
        message="This can’t be undone."
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </section>
  );
}
