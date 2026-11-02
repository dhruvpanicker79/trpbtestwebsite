import { useParams } from 'react-router-dom';
import { Trophy } from 'lucide-react';
import { playersApi } from '../services/index.js';
import { useAsync } from '../hooks/useAsync.js';
import { useSeo } from '../hooks/useSeo.js';
import Img from '../components/ui/Img.jsx';
import ArticleCard from '../components/articles/ArticleCard.jsx';
import RatingWidget from '../components/community/RatingWidget.jsx';
import { EmptyState, ErrorState, PageLoader, SectionHeader } from '../components/ui/Bits.jsx';
import NotFoundPage from './NotFoundPage.jsx';

export default function PlayerPage() {
  const { slug } = useParams();
  const { data: player, loading, error, reload, setData } = useAsync(() => playersApi.get(slug), [slug]);

  useSeo({
    title: player ? `${player.name} — Player File` : undefined,
    description: player?.summary?.slice(0, 160),
    image: player?.portrait,
    type: 'profile',
  });

  if (loading && (!player || player.slug !== slug)) return <PageLoader />;
  if (error?.status === 404) return <NotFoundPage message="We don’t have a file on that player." />;
  if (error) return <div className="container-site py-20"><ErrorState error={error} onRetry={reload} /></div>;
  if (!player) return null;

  const onRated = (stats, score) =>
    setData((p) => {
      const dist = p.ratingDistribution.map((d) => {
        if (d.score === score && p.myRating !== score) return { ...d, count: d.count + 1 };
        if (d.score === p.myRating && p.myRating !== score) return { ...d, count: Math.max(0, d.count - 1) };
        return d;
      });
      return { ...p, ...stats, ratingDistribution: dist };
    });

  const facts = [
    ['Position', player.position],
    ['Current club', player.currentClub],
    ['Nationality', player.nationality],
    ['Born', player.born],
    ['Preferred foot', player.preferredFoot],
  ].filter(([, v]) => v);

  return (
    <div>
      <header className="border-b border-ink-600">
        <div className="container-site grid gap-10 py-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Img src={player.portrait} alt={player.name} eager className="aspect-[3/4] w-full" imgClassName="grayscale" sizes="(min-width:1024px) 33vw, 100vw" width={900} fallbackLabel="Player File" />
          </div>
          <div className="lg:col-span-8">
            <p className="kicker text-blood-400">Player File{player.isSample ? ' · Sample profile' : ''}</p>
            <h1 className="mt-3 font-display text-5xl font-bold leading-[0.95] text-white sm:text-7xl lg:text-8xl">{player.name}</h1>
            <dl className="mt-8 grid grid-cols-2 border-t border-ink-600 sm:grid-cols-3">
              {facts.map(([k, v]) => (
                <div key={k} className="border-b border-ink-600 py-4 pr-4">
                  <dt className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-400">{k}</dt>
                  <dd className="mt-1 font-display text-xl font-semibold text-white">{v}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-8 max-w-2xl whitespace-pre-line font-serif text-lg leading-relaxed text-bone/90">{player.summary}</p>
          </div>
        </div>
      </header>

      <div className="container-site grid gap-12 py-16 lg:grid-cols-12">
        <section className="lg:col-span-7" aria-labelledby="timeline-h">
          <SectionHeader kicker="Clubs & seasons" title={<span id="timeline-h">Career Timeline</span>} />
          {player.timeline.length === 0 ? (
            <EmptyState title="No timeline yet" />
          ) : (
            <ol className="relative border-l-2 border-ink-600 pl-8">
              {player.timeline.map((t) => (
                <li key={t._id} className="relative pb-10 last:pb-0">
                  <span className={`absolute -left-[41px] top-1 h-4 w-4 border-2 ${t.to ? 'border-ink-400 bg-ink-900' : 'border-blood bg-blood'}`} aria-hidden />
                  <p className="font-sans text-sm font-semibold tabular-nums text-blood-400">
                    {t.from} — {t.to || 'present'}
                  </p>
                  <h3 className="mt-1 font-display text-2xl font-semibold text-white">
                    {t.club} {t.loan && <span className="ml-1 align-middle text-xs font-sans font-semibold uppercase tracking-wider text-ink-300">(loan)</span>}
                  </h3>
                  {t.note && <p className="mt-1 text-sm text-ink-300">{t.note}</p>}
                </li>
              ))}
            </ol>
          )}

          <div className="mt-16">
            <SectionHeader kicker="Honours" title="Achievements & Milestones" />
            {player.achievements.length === 0 ? (
              <EmptyState title="Nothing listed yet" />
            ) : (
              <ul className="grid gap-4 sm:grid-cols-2">
                {player.achievements.map((a) => (
                  <li key={a._id} className="flex gap-4 border border-ink-600 p-4">
                    <Trophy className="mt-1 h-5 w-5 shrink-0 text-blood-400" aria-hidden />
                    <div>
                      <p className="font-semibold text-white">{a.title}</p>
                      {a.year && <p className="text-sm text-ink-300">{a.year}</p>}
                      {a.detail && <p className="mt-1 text-sm text-ink-300">{a.detail}</p>}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </section>

        <aside className="space-y-12 lg:col-span-5">
          <RatingWidget player={player} onRated={onRated} />
          <div>
            <SectionHeader kicker="On TRPB" title="Related Stories" />
            {player.articles.length === 0 ? (
              <EmptyState title="No stories yet" />
            ) : (
              player.articles.map((a) => <ArticleCard key={a._id} article={a} variant="compact" />)
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
