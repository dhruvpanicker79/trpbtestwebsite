import { Link } from 'react-router-dom';
import { AlertTriangle, Loader2, RotateCcw } from 'lucide-react';
import { formatDate, initials } from '../../utils/format.js';

export function CategoryBadge({ category, tone = 'red', className = '' }) {
  if (!category) return null;
  const styles = {
    red: 'text-blood-400 hover:text-white',
    solid: 'bg-blood px-2 py-1 text-white hover:bg-blood-400',
    dark: 'text-blood hover:text-ink',
    muted: 'text-ink-300 hover:text-white',
  };
  return (
    <Link to={`/category/${category.slug}`} className={`kicker inline-block transition-colors ${styles[tone]} ${className}`}>
      {category.name}
    </Link>
  );
}

export function Avatar({ user, size = 32, className = '' }) {
  const style = { width: size, height: size, fontSize: size * 0.38 };
  if (user?.avatar) {
    return <img src={user.avatar} alt="" style={style} className={`shrink-0 bg-ink-600 object-cover ${className}`} loading="lazy" />;
  }
  return (
    <span style={style} className={`inline-grid shrink-0 place-items-center bg-ink-600 font-semibold text-bone ${className}`} aria-hidden>
      {initials(user?.name || user?.username || '?')}
    </span>
  );
}

export function Byline({ article, light = false, showAvatar = false, className = '' }) {
  const author = article.author;
  return (
    <div className={`flex flex-wrap items-center gap-x-2 gap-y-1 text-xs ${light ? 'text-ink/60' : 'text-ink-300'} ${className}`}>
      {showAvatar && author && <Avatar user={author} size={24} />}
      {author && (
        <Link to={`/u/${author.username}`} className={`font-semibold ${light ? 'text-ink hover:text-blood' : 'text-bone hover:text-white'}`}>
          {author.name}
        </Link>
      )}
      {article.publishedAt && (
        <>
          <span aria-hidden>·</span>
          <time dateTime={article.publishedAt}>{formatDate(article.publishedAt)}</time>
        </>
      )}
      {article.readingTime && (
        <>
          <span aria-hidden>·</span>
          <span>{article.readingTime} min read</span>
        </>
      )}
    </div>
  );
}

export function SectionHeader({ kicker, title, action, light = false, className = '' }) {
  return (
    <div className={`mb-8 flex items-end justify-between gap-4 border-t-2 pt-4 ${light ? 'border-ink' : 'border-bone'} ${className}`}>
      <div>
        {kicker && <p className={`kicker mb-2 ${light ? 'text-blood' : 'text-blood-400'}`}>{kicker}</p>}
        <h2 className={`font-display text-3xl font-bold leading-none tracking-tight sm:text-4xl ${light ? 'text-ink' : 'text-white'}`}>{title}</h2>
      </div>
      {action}
    </div>
  );
}

export function Spinner({ className = 'h-5 w-5' }) {
  return <Loader2 className={`animate-spin ${className}`} aria-hidden />;
}

export function PageLoader() {
  return (
    <div className="grid min-h-[50vh] place-items-center text-ink-300" role="status">
      <Spinner className="h-7 w-7" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}

export function Skeleton({ className = '' }) {
  return (
    <div className={`relative overflow-hidden bg-ink-700 ${className}`} aria-hidden>
      <div className="absolute inset-0 -translate-x-full animate-shimmer bg-gradient-to-r from-transparent via-white/5 to-transparent" />
    </div>
  );
}

export function CardSkeleton({ count = 3, className = '' }) {
  return (
    <div className={`grid gap-8 sm:grid-cols-2 lg:grid-cols-3 ${className}`} role="status" aria-label="Loading">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i}>
          <Skeleton className="aspect-[4/3] w-full" />
          <Skeleton className="mt-4 h-3 w-24" />
          <Skeleton className="mt-3 h-6 w-full" />
          <Skeleton className="mt-2 h-6 w-2/3" />
        </div>
      ))}
    </div>
  );
}

export function EmptyState({ title = 'Nothing here yet', message, action, light = false }) {
  return (
    <div className={`border border-dashed px-6 py-14 text-center ${light ? 'border-ink/25 text-ink' : 'border-ink-500 text-bone'}`}>
      <p className="font-display text-2xl font-semibold">{title}</p>
      {message && <p className={`mx-auto mt-2 max-w-md text-sm ${light ? 'text-ink/60' : 'text-ink-300'}`}>{message}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'Something went wrong' }) {
  return (
    <div className="border border-blood/50 bg-blood/5 px-6 py-10 text-center" role="alert">
      <AlertTriangle className="mx-auto h-6 w-6 text-blood-400" aria-hidden />
      <p className="mt-3 font-display text-xl font-semibold text-white">{title}</p>
      <p className="mt-1 text-sm text-ink-300">{error?.message || 'Please try again.'}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-ghost btn-sm mt-5">
          <RotateCcw className="h-3.5 w-3.5" /> Try again
        </button>
      )}
    </div>
  );
}

export function LoadMore({ hasMore, loading, onClick, light = false }) {
  if (!hasMore) return null;
  return (
    <div className="mt-12 flex justify-center">
      <button onClick={onClick} disabled={loading} className={light ? 'btn-ghost-dark' : 'btn-ghost'}>
        {loading ? <Spinner className="h-4 w-4" /> : null}
        {loading ? 'Loading' : 'Load more stories'}
      </button>
    </div>
  );
}

export function FieldError({ children, id }) {
  if (!children) return null;
  return (
    <p id={id} className="mt-1.5 text-xs font-medium text-blood-400" role="alert">
      {children}
    </p>
  );
}
