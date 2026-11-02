import { ChevronLeft, ChevronRight } from 'lucide-react';

/** Numbered pagination with ellipses. Fully keyboard accessible. */
export default function Pagination({ page, pages, onChange, light = false }) {
  if (!pages || pages <= 1) return null;

  const nums = new Set([1, pages, page, page - 1, page + 1]);
  const list = [...nums].filter((n) => n >= 1 && n <= pages).sort((a, b) => a - b);
  const items = [];
  list.forEach((n, i) => {
    if (i && n - list[i - 1] > 1) items.push(`gap-${n}`);
    items.push(n);
  });

  const base = `grid h-10 min-w-10 place-items-center px-3 text-sm font-semibold transition-colors`;
  const idle = light ? 'border border-ink/20 text-ink hover:border-ink' : 'border border-ink-500 text-bone hover:border-bone';
  const active = 'border border-blood bg-blood text-white';

  return (
    <nav className="mt-12 flex flex-wrap items-center justify-center gap-2" aria-label="Pagination">
      <button
        className={`${base} ${idle} disabled:opacity-40`}
        onClick={() => onChange(page - 1)}
        disabled={page <= 1}
        aria-label="Previous page"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      {items.map((n) =>
        typeof n === 'string' ? (
          <span key={n} className="px-1 text-ink-400" aria-hidden>
            …
          </span>
        ) : (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`${base} ${n === page ? active : idle}`}
            aria-current={n === page ? 'page' : undefined}
            aria-label={`Page ${n}`}
          >
            {n}
          </button>
        )
      )}
      <button
        className={`${base} ${idle} disabled:opacity-40`}
        onClick={() => onChange(page + 1)}
        disabled={page >= pages}
        aria-label="Next page"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </nav>
  );
}
