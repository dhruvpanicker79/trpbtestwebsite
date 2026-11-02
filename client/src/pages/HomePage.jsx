import { Link } from 'react-router-dom';
import { ArrowRight, ArrowUpRight, Instagram } from 'lucide-react';
import { INSTAGRAM_HANDLE, INSTAGRAM_URL } from '../utils/constants.js';
import { articlesApi, playersApi, pollsApi } from '../services/index.js';
import { useAsync, usePaged } from '../hooks/useAsync.js';
import { useSeo } from '../hooks/useSeo.js';
import ArticleCard from '../components/articles/ArticleCard.jsx';
import PollCard from '../components/community/PollCard.jsx';
import PlayerCard from '../components/community/PlayerCard.jsx';
import NewsletterForm from '../components/community/NewsletterForm.jsx';
import Img from '../components/ui/Img.jsx';
import { Byline, CardSkeleton, CategoryBadge, EmptyState, ErrorState, LoadMore, SectionHeader, Skeleton } from '../components/ui/Bits.jsx';

const QUICK_LINKS = [
  ['Tactics', '/category/tactical-room'],
  ['Player Files', '/players'],
  ['Polls', '/polls'],
  ['Debates', '/category/opinions'],
];

/** Front page: white paper, red accents, near-black type — the one light-first block on the homepage. */
function Hero({ lead, sidebar, loading }) {
  const pulse = 'animate-pulse bg-ink/[0.07]';

  return (
    <section className="bg-white text-ink-800" aria-label="Lead story">
      <div className="container-site pb-16 pt-8 sm:pt-10">
        {/* Masthead line */}
        <div className="flex flex-col gap-4 border-b-[6px] border-blood pb-5 md:flex-row md:items-end md:justify-between">
          <p className="text-[2.6rem] font-bold leading-[0.92] tracking-[-0.045em] sm:text-6xl lg:text-[5rem]">
            <span className="block">Football,</span>
            <span className="block whitespace-nowrap text-blood">Beyond The 90.</span>
          </p>
          <div className="flex flex-col gap-3 md:items-end">
            <a
              href={INSTAGRAM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-3 self-start border-2 border-blood py-2 pl-2 pr-4 text-blood transition-colors hover:bg-blood hover:text-white md:self-end"
              aria-label={`Follow ${INSTAGRAM_HANDLE} on Instagram (opens in a new tab)`}
            >
              <span className="grid h-8 w-8 place-items-center bg-blood text-white transition-colors group-hover:bg-white group-hover:text-blood">
                <Instagram className="h-4 w-4" aria-hidden />
              </span>
              <span className="leading-tight">
                <span className="block text-[10px] font-bold uppercase tracking-[0.18em] opacity-70">Follow us on Instagram</span>
                <span className="block text-sm font-bold">{INSTAGRAM_HANDLE}</span>
              </span>
              <ArrowUpRight className="h-4 w-4" aria-hidden />
            </a>
            <nav className="flex flex-wrap gap-2" aria-label="Quick sections">
              {QUICK_LINKS.map(([label, to]) => (
                <Link
                  key={to}
                  to={to}
                  className="border border-ink-800/15 px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-ink-800/70 transition-colors hover:border-blood hover:bg-blood hover:text-white"
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {loading ? (
          <div className="mt-10 grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <div className={`aspect-[16/10] ${pulse}`} />
              <div className={`mt-8 h-14 w-4/5 ${pulse}`} />
              <div className={`mt-3 h-14 w-3/5 ${pulse}`} />
            </div>
            <div className="min-h-[420px] bg-blood/80 lg:col-span-4" />
          </div>
        ) : !lead ? null : (
          <div className="mt-10 grid gap-10 lg:grid-cols-12">
            <article className="group lg:col-span-8">
              <div className="relative">
                {/* Offset red block behind the photo */}
                <div className="absolute -bottom-3 -left-3 h-3/5 w-2/5 bg-blood sm:-bottom-4 sm:-left-4" aria-hidden />
                <Link to={`/article/${lead.slug}`} tabIndex={-1} aria-hidden className="relative block">
                  <Img
                    src={lead.coverImage?.url}
                    alt=""
                    eager
                    className="aspect-[16/10] w-full"
                    imgClassName="transition-transform duration-[1200ms] group-hover:scale-[1.02]"
                    sizes="(min-width:1024px) 66vw, 100vw"
                    width={1600}
                  />
                  <span className="absolute left-0 top-0 bg-white px-3 py-2 text-[11px] font-bold uppercase tracking-[0.16em] text-blood">
                    Lead story
                  </span>
                </Link>
              </div>

              <div className="mt-10">
                <CategoryBadge category={lead.category} tone="dark" />
                <h1 className="mt-3 text-[2.5rem] font-bold leading-[0.98] text-ink-800 sm:text-6xl lg:text-[4.4rem]">
                  <Link to={`/article/${lead.slug}`} className="transition-colors hover:text-blood">
                    {lead.title}
                  </Link>
                </h1>
                <p className="mt-5 max-w-2xl text-lg leading-relaxed text-ink-800/65 sm:text-xl">{lead.excerpt}</p>
                <div className="mt-7 flex flex-wrap items-center gap-x-6 gap-y-4">
                  <Link to={`/article/${lead.slug}`} className="btn-red">
                    Read the story <ArrowRight className="h-4 w-4" />
                  </Link>
                  <Byline article={lead} light showAvatar />
                </div>
              </div>
            </article>

            <aside className="flex flex-col bg-blood p-6 text-white sm:p-8 lg:col-span-4" aria-label="Just in">
              <div className="flex items-center justify-between border-b border-white/30 pb-4">
                <p className="text-xs font-bold uppercase tracking-[0.18em]">Just in</p>
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-white/60">Latest {sidebar.length}</span>
              </div>
              <ol className="flex-1">
                {sidebar.map((a, i) => (
                  <li key={a._id} className="border-b border-white/20 last:border-b-0">
                    <Link to={`/article/${a.slug}`} className="group/item flex gap-4 py-5">
                      <span className="text-3xl font-bold leading-none tracking-tight text-white/40 tabular-nums transition-colors group-hover/item:text-white">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="min-w-0">
                        <span className="block text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">{a.category?.name}</span>
                        <span className="mt-1 block text-lg font-bold leading-snug tracking-tight decoration-2 underline-offset-4 group-hover/item:underline">
                          {a.title}
                        </span>
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
              <Link to="/search" className="mt-4 inline-flex items-center justify-between bg-white px-4 py-3 text-xs font-bold uppercase tracking-[0.14em] text-blood transition-colors hover:bg-ink-800 hover:text-white">
                Everything new <ArrowRight className="h-4 w-4" />
              </Link>
            </aside>
          </div>
        )}
      </div>
    </section>
  );
}

function SectionLink({ to, children, light }) {
  return (
    <Link to={to} className={`kicker inline-flex shrink-0 items-center gap-1.5 ${light ? 'text-ink hover:text-blood' : 'text-bone hover:text-blood-400'}`}>
      {children} <ArrowUpRight className="h-3.5 w-3.5" />
    </Link>
  );
}

export default function HomePage() {
  useSeo({});

  const featured = useAsync(() => articlesApi.featured(5), []);
  const trending = useAsync(() => articlesApi.trending(5), []);
  const tactical = useAsync(() => articlesApi.list({ category: 'tactical-room', limit: 3 }), []);
  const playerFiles = useAsync(() => articlesApi.list({ category: 'player-files', limit: 3 }), []);
  const players = useAsync(() => playersApi.list({ limit: 4, sort: 'rating' }), []);
  const debates = useAsync(() => articlesApi.list({ limit: 4, sort: 'discussed' }), []);
  const polls = useAsync(() => pollsApi.list({ limit: 2, status: 'open' }), []);
  const latest = usePaged((page) => articlesApi.list({ page, limit: 6 }), []);

  const f = featured.data || [];
  const lead = f[0];
  const picks = f.slice(1, 5);
  const justIn = (latest.items || []).filter((a) => a._id !== lead?._id).slice(0, 4);

  if (featured.error && latest.error) {
    return (
      <div className="container-site py-20">
        <ErrorState error={featured.error} onRetry={() => { featured.reload(); latest.reload(); }} title="We couldn’t reach the newsroom" />
      </div>
    );
  }

  if (!featured.loading && !lead && !latest.loading && latest.items.length === 0) {
    return (
      <div className="container-site py-20">
        <EmptyState title="The first issue is on its way" message="No stories have been published yet. Run the seed script or publish from the dashboard." />
      </div>
    );
  }

  return (
    <>
      <Hero lead={lead} sidebar={justIn} loading={featured.loading} />

      {/* Featured — editorial grid */}
      {picks.length > 0 && (
        <section className="container-site py-16" aria-labelledby="featured-h">
          <SectionHeader kicker="Editor’s selection" title={<span id="featured-h">Featured Stories</span>} />
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <ArticleCard article={picks[0]} variant="overlay" sizes="(min-width:1024px) 58vw, 100vw" />
            </div>
            <div className="grid gap-8 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-1">
              {picks.slice(1, 3).map((a) => (
                <ArticleCard key={a._id} article={a} variant="list" />
              ))}
              {picks[3] && <ArticleCard article={picks[3]} variant="list" />}
            </div>
          </div>
        </section>
      )}

      {/* Latest feed + trending */}
      <section className="container-site grid gap-12 py-8 lg:grid-cols-12" aria-labelledby="latest-h">
        <div className="lg:col-span-8">
          <SectionHeader kicker="The feed" title={<span id="latest-h">Latest</span>} />
          {latest.loading ? (
            <CardSkeleton count={2} className="!grid-cols-1" />
          ) : latest.error ? (
            <ErrorState error={latest.error} onRetry={latest.reload} />
          ) : (
            <>
              <div>
                {latest.items.map((a) => (
                  <ArticleCard key={a._id} article={a} variant="list" />
                ))}
              </div>
              <LoadMore hasMore={latest.hasMore} loading={latest.loadingMore} onClick={latest.loadMore} />
            </>
          )}
        </div>
        <aside className="lg:col-span-4" aria-labelledby="trending-h">
          <div className="lg:sticky lg:top-40">
            <SectionHeader kicker="Views × engagement" title={<span id="trending-h">Trending</span>} />
            {trending.loading ? (
              <div className="space-y-4">{[0, 1, 2].map((i) => <Skeleton key={i} className="h-16" />)}</div>
            ) : (
              (trending.data || []).map((a, i) => <ArticleCard key={a._id} article={a} variant="numbered" index={i + 1} />)
            )}
          </div>
        </aside>
      </section>

      {/* Tactical Room — white editorial section */}
      <section className="paper mt-16 py-16" aria-labelledby="tactics-h">
        <div className="container-site">
          <SectionHeader
            light
            kicker="Shape · structure · roles"
            title={<span id="tactics-h">The Tactical Room</span>}
            action={<SectionLink to="/category/tactical-room" light>All tactics</SectionLink>}
          />
          {tactical.loading ? (
            <CardSkeleton count={3} />
          ) : (tactical.data || []).length === 0 ? (
            <EmptyState light title="No tactical pieces yet" />
          ) : (
            <div className="grid gap-10 lg:grid-cols-12">
              <div className="lg:col-span-7">
                <ArticleCard article={tactical.data[0]} variant="feature" light />
              </div>
              <div className="lg:col-span-5">
                {tactical.data.slice(1).map((a) => (
                  <ArticleCard key={a._id} article={a} variant="list" light />
                ))}
                <div className="mt-6 border-t-2 border-ink pt-5">
                  <p className="kicker text-blood">How we draw it</p>
                  <p className="mt-2 font-serif text-[15px] leading-relaxed text-ink/70">
                    Tactical pieces come with boards, phase shapes and role tables. Diagrams are illustrative — we don’t
                    claim access to tracking data we don’t have.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Player Files */}
      <section className="container-site py-20" aria-labelledby="players-h">
        <SectionHeader
          kicker="Careers & retrospectives"
          title={<span id="players-h">Player Files</span>}
          action={<SectionLink to="/players">All players</SectionLink>}
        />
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:col-span-7 lg:grid-cols-2 xl:grid-cols-4">
            {players.loading
              ? [0, 1, 2, 3].map((i) => <Skeleton key={i} className="aspect-[3/4]" />)
              : (players.data || []).map((p) => <PlayerCard key={p._id} player={p} />)}
          </div>
          <div className="lg:col-span-5">
            {(playerFiles.data || []).map((a) => (
              <ArticleCard key={a._id} article={a} variant="list" />
            ))}
          </div>
        </div>
      </section>

      {/* Community — polls & debates */}
      <section className="border-y border-ink-600 bg-ink-800 py-20" aria-labelledby="community-h">
        <div className="container-site">
          <SectionHeader
            kicker="Have your say"
            title={<span id="community-h">Polls & Debates</span>}
            action={<SectionLink to="/polls">All polls</SectionLink>}
          />
          <div className="grid gap-8 lg:grid-cols-12">
            <div className="grid gap-6 md:grid-cols-2 lg:col-span-8">
              {polls.loading
                ? [0, 1].map((i) => <Skeleton key={i} className="h-80" />)
                : (polls.data || []).length === 0
                  ? <EmptyState title="No open polls" message="Check back soon." />
                  : polls.data.map((p) => <PollCard key={p._id} poll={p} />)}
            </div>
            <div className="lg:col-span-4">
              <p className="kicker text-blood-400">Most argued-about</p>
              {(debates.data || []).map((a) => (
                <ArticleCard key={a._id} article={a} variant="compact" />
              ))}
              <Link to="/category/opinions" className="btn-ghost btn-sm mt-6">
                Read the opinions desk
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="paper" aria-labelledby="newsletter-h">
        <div className="container-site grid items-center gap-10 py-20 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="kicker text-blood">The Sunday Sheet</p>
            <h2 id="newsletter-h" className="mt-3 font-display text-5xl font-bold leading-[0.95] tracking-tight text-ink sm:text-7xl">
              One email.
              <br />
              <span className="text-blood">Every Sunday.</span>
            </h2>
            <p className="mt-5 max-w-lg font-serif text-lg text-ink/70">
              The week’s best long reads, one tactical board and a poll worth arguing about. No spam, no transfer rumours.
            </p>
          </div>
          <div className="lg:col-span-5">
            <NewsletterForm />
            <p className="mt-3 text-xs text-ink/50">We store your email to build the list. Sending is handled separately — unsubscribe any time.</p>
          </div>
        </div>
      </section>
    </>
  );
}
