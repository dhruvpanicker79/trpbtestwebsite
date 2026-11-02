import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Search, X } from 'lucide-react';
import { articlesApi, searchApi, taxonomyApi } from '../services/index.js';
import { useAsync } from '../hooks/useAsync.js';
import { useSeo } from '../hooks/useSeo.js';
import ArticleCard from '../components/articles/ArticleCard.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { Avatar, CardSkeleton, EmptyState, ErrorState } from '../components/ui/Bits.jsx';

/**
 * Search when ?q= is present (titles, excerpts, body, tags, players, clubs,
 * categories). With no query it becomes an archive browser with the same
 * category filter, sorting and pagination.
 */
export default function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') || '').trim();
  const category = params.get('category') || '';
  const tag = params.get('tag') || '';
  const page = Math.max(1, Number(params.get('page')) || 1);
  const sort = params.get('sort') || (q ? 'relevance' : 'newest');
  const [input, setInput] = useState(q);

  useEffect(() => setInput(q), [q]);
  useSeo({ title: q ? `Search: ${q}` : 'Archive', noindex: Boolean(q) });

  const categories = useAsync(() => taxonomyApi.categories(), []);
  const tags = useAsync(() => taxonomyApi.tags(), []);
  const results = useAsync(async () => {
    if (q.length >= 2) {
      const res = await searchApi.search({ q, category, sort, page, limit: 10 });
      return { data: res.data, meta: res.meta };
    }
    const res = await articlesApi.list({ category, tag, sort: sort === 'relevance' ? 'newest' : sort, page, limit: 10 });
    return { data: { articles: res.data, players: [] }, meta: res.meta };
  }, [q, category, tag, sort, page]);

  const update = (changes) => {
    const next = new URLSearchParams(params);
    Object.entries(changes).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    if (!('page' in changes)) next.delete('page');
    setParams(next);
  };

  const activeTag = tags.data?.find((t) => t.slug === tag);
  const articles = results.data?.articles || [];
  const players = results.data?.players || [];
  const sortOptions = q
    ? [['relevance', 'Relevance'], ['newest', 'Newest'], ['popular', 'Most popular']]
    : [['newest', 'Newest'], ['popular', 'Most popular'], ['discussed', 'Most discussed']];

  return (
    <div className="container-site py-12">
      <h1 className="font-display text-5xl font-bold text-white sm:text-6xl">{q ? 'Search' : 'The Archive'}</h1>

      <form
        role="search"
        className="mt-8 flex items-center gap-3 border-b-2 border-bone pb-3"
        onSubmit={(e) => {
          e.preventDefault();
          const v = input.trim();
          update({ q: v.length >= 2 ? v : '', sort: '' });
        }}
      >
        <Search className="h-6 w-6 shrink-0 text-ink-300" aria-hidden />
        <label htmlFor="search-page-input" className="sr-only">Search</label>
        <input
          id="search-page-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Players, clubs, tactics, ideas…"
          className="w-full bg-transparent font-display text-2xl text-white placeholder:text-ink-400 focus:outline-none sm:text-4xl"
        />
        {input && (
          <button type="button" onClick={() => { setInput(''); update({ q: '' }); }} aria-label="Clear search" className="text-ink-300 hover:text-white">
            <X className="h-5 w-5" />
          </button>
        )}
        <button className="btn-red btn-sm" type="submit">Search</button>
      </form>
      {input && input.trim().length < 2 && <p className="mt-2 text-xs text-ink-400">Type at least two characters.</p>}

      <div className="mt-8 grid gap-10 lg:grid-cols-12">
        {/* Filters */}
        <aside className="lg:col-span-3" aria-label="Filters">
          <div className="space-y-8 lg:sticky lg:top-40">
            <div>
              <label htmlFor="filter-category" className="label">Category</label>
              <select id="filter-category" value={category} onChange={(e) => update({ category: e.target.value })} className="field">
                <option value="">All sections</option>
                {(categories.data || []).map((c) => (
                  <option key={c._id} value={c.slug}>{c.name} ({c.articleCount})</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="filter-sort" className="label">Sort by</label>
              <select id="filter-sort" value={sort} onChange={(e) => update({ sort: e.target.value })} className="field">
                {sortOptions.map(([v, l]) => (
                  <option key={v} value={v}>{l}</option>
                ))}
              </select>
            </div>
            {!q && (tags.data || []).length > 0 && (
              <div>
                <p className="label">Tags</p>
                <div className="flex flex-wrap gap-2">
                  {tags.data.filter((t) => t.articleCount > 0).map((t) => (
                    <button
                      key={t._id}
                      onClick={() => update({ tag: t.slug === tag ? '' : t.slug })}
                      aria-pressed={t.slug === tag}
                      className={`border px-2.5 py-1 text-xs font-semibold ${t.slug === tag ? 'border-blood bg-blood text-white' : 'border-ink-500 text-bone hover:border-bone'}`}
                    >
                      #{t.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </aside>

        <section className="lg:col-span-9" aria-live="polite" aria-busy={results.loading}>
          <p className="mb-2 text-sm text-ink-300">
            {results.meta && !results.loading && (
              <>
                {results.meta.total} result{results.meta.total === 1 ? '' : 's'}
                {q && <> for <span className="font-semibold text-white">“{q}”</span></>}
                {activeTag && <> tagged <span className="font-semibold text-white">#{activeTag.name}</span></>}
              </>
            )}
          </p>

          {players.length > 0 && (
            <div className="mb-8 border border-ink-600 p-4">
              <p className="kicker mb-3 text-blood-400">Players</p>
              <div className="grid gap-3 sm:grid-cols-2">
                {players.map((p) => (
                  <Link key={p._id} to={`/players/${p.slug}`} className="flex items-center gap-3 p-2 hover:bg-ink-700">
                    <Avatar user={{ name: p.name, avatar: p.portrait }} size={44} />
                    <span>
                      <span className="block font-semibold text-white">{p.name}</span>
                      <span className="block text-xs text-ink-300">{p.position} · {p.currentClub}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {results.loading ? (
            <CardSkeleton count={2} className="!grid-cols-1" />
          ) : results.error ? (
            <ErrorState error={results.error} onRetry={results.reload} />
          ) : articles.length === 0 ? (
            <EmptyState
              title={q ? 'No matches' : 'Nothing here yet'}
              message={q ? 'Try a player, a club, a formation or a broader word.' : 'Try another filter.'}
            />
          ) : (
            <>
              {articles.map((a) => (
                <ArticleCard key={a._id} article={a} variant="list" />
              ))}
              <Pagination page={page} pages={results.meta?.pages} onChange={(p) => { update({ page: String(p) }); window.scrollTo({ top: 0 }); }} />
            </>
          )}
        </section>
      </div>
    </div>
  );
}
