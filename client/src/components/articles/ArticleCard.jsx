import { Link } from 'react-router-dom';
import { Eye, MessageSquare } from 'lucide-react';
import Img from '../ui/Img.jsx';
import { Byline, CategoryBadge } from '../ui/Bits.jsx';
import { compactNumber, formatDate } from '../../utils/format.js';

const href = (a) => `/article/${a.slug}`;

/**
 * One card component, several editorial layouts:
 *  - standard: image on top, kicker, headline, excerpt, byline
 *  - feature:  large image with headline beneath, bigger type
 *  - overlay:  headline set over a darkened image
 *  - list:     horizontal thumbnail + text (feeds)
 *  - compact:  text-only headline with kicker (sidebars)
 *  - numbered: big red index numeral (trending)
 */
export default function ArticleCard({ article, variant = 'standard', index, light = false, eager = false, sizes }) {
  if (!article) return null;
  const headlineColor = light ? 'text-ink' : 'text-white';
  const muted = light ? 'text-ink/70' : 'text-ink-300';

  if (variant === 'overlay') {
    return (
      <article className="group relative isolate h-full min-h-[340px] overflow-hidden bg-ink-800">
        <Img src={article.coverImage?.url} alt={article.coverImage?.alt} className="absolute inset-0 -z-10" imgClassName="transition-transform duration-700 group-hover:scale-[1.03]" sizes={sizes} eager={eager} />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black via-black/60 to-black/10" />
        <div className="flex h-full flex-col justify-end p-5 sm:p-7">
          <CategoryBadge category={article.category} tone="solid" className="self-start" />
          <h3 className="mt-4 font-display text-2xl font-bold leading-[1.08] text-white sm:text-[1.9rem]">
            <Link to={href(article)} className="after:absolute after:inset-0">
              <span className="headline-hover">{article.title}</span>
            </Link>
          </h3>
          <Byline article={article} className="relative z-10 mt-4" />
        </div>
      </article>
    );
  }

  if (variant === 'list') {
    return (
      <article className={`group grid grid-cols-[112px_1fr] gap-4 border-t py-6 sm:grid-cols-[240px_1fr] sm:gap-7 ${light ? 'border-ink/15' : 'border-ink-600'}`}>
        <Link to={href(article)} tabIndex={-1} aria-hidden>
          <Img src={article.coverImage?.url} alt="" className="aspect-[4/3] w-full" width={480} sizes="(min-width:640px) 240px, 112px" />
        </Link>
        <div className="min-w-0">
          <CategoryBadge category={article.category} tone={light ? 'dark' : 'red'} />
          <h3 className={`mt-2 font-display text-lg font-semibold leading-snug sm:text-2xl ${headlineColor}`}>
            <Link to={href(article)} className="headline-hover">
              {article.title}
            </Link>
          </h3>
          <p className={`mt-2 hidden line-clamp-2 font-serif text-[15px] sm:block ${muted}`}>{article.excerpt}</p>
          <Byline article={article} light={light} className="mt-3" />
        </div>
      </article>
    );
  }

  if (variant === 'compact') {
    return (
      <article className={`group border-t py-4 ${light ? 'border-ink/15' : 'border-ink-600'}`}>
        <CategoryBadge category={article.category} tone={light ? 'dark' : 'red'} />
        <h3 className={`mt-1.5 font-display text-lg font-semibold leading-snug ${headlineColor}`}>
          <Link to={href(article)} className="headline-hover">
            {article.title}
          </Link>
        </h3>
        <p className={`mt-1.5 text-xs ${muted}`}>
          {article.author?.name} · {formatDate(article.publishedAt)}
        </p>
      </article>
    );
  }

  if (variant === 'numbered') {
    return (
      <article className={`group flex gap-5 border-t py-5 ${light ? 'border-ink/15' : 'border-ink-600'}`}>
        <span className="font-display text-5xl font-bold leading-none text-blood-400 tabular-nums" aria-hidden>
          {String(index).padStart(2, '0')}
        </span>
        <div className="min-w-0">
          <CategoryBadge category={article.category} tone="muted" />
          <h3 className={`mt-1 font-display text-lg font-semibold leading-snug ${headlineColor}`}>
            <Link to={href(article)} className="headline-hover">
              {article.title}
            </Link>
          </h3>
          <p className={`mt-2 flex items-center gap-3 text-xs ${muted}`}>
            <span className="inline-flex items-center gap-1">
              <Eye className="h-3.5 w-3.5" aria-hidden /> {compactNumber(article.viewCount)}
              <span className="sr-only">views</span>
            </span>
            <span className="inline-flex items-center gap-1">
              <MessageSquare className="h-3.5 w-3.5" aria-hidden /> {article.commentCount}
              <span className="sr-only">comments</span>
            </span>
          </p>
        </div>
      </article>
    );
  }

  const isFeature = variant === 'feature';
  return (
    <article className="group flex h-full flex-col">
      <Link to={href(article)} tabIndex={-1} aria-hidden className="block">
        <Img
          src={article.coverImage?.url}
          alt=""
          className={isFeature ? 'aspect-[16/10] w-full' : 'aspect-[4/3] w-full'}
          imgClassName="transition-transform duration-700 group-hover:scale-[1.03]"
          sizes={sizes || (isFeature ? '(min-width:1024px) 60vw, 100vw' : '(min-width:1024px) 30vw, (min-width:640px) 50vw, 100vw')}
          eager={eager}
        />
      </Link>
      <div className="flex flex-1 flex-col pt-4">
        <CategoryBadge category={article.category} tone={light ? 'dark' : 'red'} />
        <h3 className={`mt-2 font-display font-bold leading-[1.1] ${isFeature ? 'text-3xl sm:text-[2.4rem]' : 'text-[1.4rem]'} ${headlineColor}`}>
          <Link to={href(article)} className="headline-hover">
            {article.title}
          </Link>
        </h3>
        {article.excerpt && (
          <p className={`mt-3 font-serif ${isFeature ? 'text-lg' : 'line-clamp-3 text-[15px]'} leading-relaxed ${muted}`}>{article.excerpt}</p>
        )}
        <Byline article={article} light={light} className="mt-auto pt-4" />
      </div>
    </article>
  );
}
