import { useParams, useSearchParams } from 'react-router-dom';
import { articlesApi, taxonomyApi } from '../services/index.js';
import { useAsync } from '../hooks/useAsync.js';
import { useSeo } from '../hooks/useSeo.js';
import ArticleCard from '../components/articles/ArticleCard.jsx';
import Pagination from '../components/ui/Pagination.jsx';
import { CardSkeleton, EmptyState, ErrorState, PageLoader } from '../components/ui/Bits.jsx';
import NotFoundPage from './NotFoundPage.jsx';

const SORTS = [
  ['newest', 'Newest'],
  ['popular', 'Most read'],
  ['discussed', 'Most discussed'],
];

export default function CategoryPage() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const page = Math.max(1, Number(params.get('page')) || 1);
  const sort = params.get('sort') || 'newest';

  const category = useAsync(() => taxonomyApi.category(slug), [slug]);
  const list = useAsync(() => articlesApi.list({ category: slug, page, sort, limit: 9 }), [slug, page, sort]);

  useSeo({ title: category.data?.name, description: category.data?.description });

  const setParam = (key, value) => {
    const next = new URLSearchParams(params);
    next.set(key, value);
    if (key !== 'page') next.delete('page');
    setParams(next);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (category.loading) return <PageLoader />;
  if (category.error?.status === 404) return <NotFoundPage message="That section doesn’t exist." />;
  if (category.error) return <div className="container-site py-20"><ErrorState error={category.error} onRetry={category.reload} /></div>;

  const cat = category.data;
  const items = list.data || [];
  const [first, ...rest] = page === 1 ? items : [null, ...items];

  return (
    <>
      <header className="border-b border-ink-600">
        <div className="container-site grid gap-6 py-14 lg:grid-cols-12 lg:items-end">
          <div className="lg:col-span-8">
            <p className="kicker text-blood-400">{cat.kicker || 'Section'}</p>
            <h1 className="mt-3 font-display text-5xl font-bold leading-[0.95] tracking-tight text-white sm:text-7xl lg:text-8xl">{cat.name}</h1>
          </div>
          <p className="text-lg text-ink-300 lg:col-span-4">{cat.description}</p>
        </div>
      </header>

      <div className="container-site py-10">
        <div className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-ink-300">{list.meta ? `${list.meta.total} ${list.meta.total === 1 ? 'story' : 'stories'}` : ' '}</p>
          <div className="flex gap-1" role="group" aria-label="Sort">
            {SORTS.map(([value, label]) => (
              <button
                key={value}
                onClick={() => setParam('sort', value)}
                aria-pressed={sort === value}
                className={`px-3 py-1.5 text-xs font-semibold uppercase tracking-wider ${sort === value ? 'bg-bone text-ink' : 'text-ink-300 hover:text-white'}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {list.loading ? (
          <CardSkeleton count={6} />
        ) : list.error ? (
          <ErrorState error={list.error} onRetry={list.reload} />
        ) : items.length === 0 ? (
          <EmptyState title="No stories in this section yet" message="Check back soon — the desk is working on it." />
        ) : (
          <>
            {first && (
              <div className="mb-14 border-b border-ink-600 pb-14">
                <ArticleCard article={first} variant="feature" eager />
              </div>
            )}
            <div className="grid gap-x-8 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
              {rest.map((a) => (
                <ArticleCard key={a._id} article={a} />
              ))}
            </div>
            <Pagination page={page} pages={list.meta?.pages} onChange={(p) => setParam('page', p)} />
          </>
        )}
      </div>
    </>
  );
}
