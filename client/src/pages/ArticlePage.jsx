import { useEffect, useRef } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Eye, PencilLine } from 'lucide-react';
import { articlesApi } from '../services/index.js';
import { useAsync } from '../hooks/useAsync.js';
import { useSeo } from '../hooks/useSeo.js';
import { useAuth } from '../context/AuthContext.jsx';
import ArticleBody, { useArticleHtml } from '../components/articles/ArticleBody.jsx';
import ArticleCard from '../components/articles/ArticleCard.jsx';
import EngagementBar from '../components/articles/EngagementBar.jsx';
import TableOfContents from '../components/articles/TableOfContents.jsx';
import TacticalBlock from '../components/articles/TacticalBlock.jsx';
import ReadingProgress from '../components/articles/ReadingProgress.jsx';
import CommentSection from '../components/community/CommentSection.jsx';
import Img from '../components/ui/Img.jsx';
import { Avatar, CategoryBadge, ErrorState, PageLoader, SectionHeader } from '../components/ui/Bits.jsx';
import { formatDate } from '../utils/format.js';
import NotFoundPage from './NotFoundPage.jsx';

export default function ArticlePage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { data: article, loading, error, reload, setData } = useAsync(() => articlesApi.get(slug), [slug]);
  const related = useAsync(
    () => (article && !article.isPreview ? articlesApi.related(article._id, 3) : Promise.resolve({ data: [] })),
    [article?._id]
  );
  const { html, toc } = useArticleHtml(article?.content);
  const counted = useRef(null);

  // Count a view once per article per page load (not for previews).
  useEffect(() => {
    if (!article || article.isPreview || counted.current === article._id) return;
    counted.current = article._id;
    articlesApi
      .view(article._id)
      .then(({ data }) => setData((a) => (a && a._id === article._id ? { ...a, viewCount: data.viewCount } : a)))
      .catch(() => {});
  }, [article, setData]);

  useSeo({
    title: article ? article.seo?.metaTitle || article.title : loading ? undefined : 'Article not found',
    description: article?.seo?.metaDescription || article?.excerpt,
    image: article?.coverImage?.url,
    type: 'article',
    publishedTime: article?.publishedAt,
    noindex: article?.isPreview,
  });

  if (loading && (!article || article.slug !== slug)) return <PageLoader />;
  if (error?.status === 404) return <NotFoundPage message="That story doesn’t exist or hasn’t been published yet." />;
  if (error) return <div className="container-site py-20"><ErrorState error={error} onRetry={reload} /></div>;
  if (!article) return null;

  const update = (patch) => setData((a) => ({ ...a, ...patch }));
  const canEdit = user && (user.role === 'ADMIN' || (user.role === 'EDITOR' && user._id === article.author?._id));
  const showToc = toc.length >= 3;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt,
    image: article.coverImage?.url ? [article.coverImage.url] : undefined,
    datePublished: article.publishedAt,
    dateModified: article.updatedAt,
    author: article.author ? [{ '@type': 'Person', name: article.author.name }] : undefined,
    publisher: { '@type': 'Organization', name: "The Ronin's Playbook" },
  };

  return (
    <article>
      <ReadingProgress targetId="article-body" />
      {!article.isPreview && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />}

      {article.isPreview && (
        <div className="bg-blood py-2 text-center text-sm font-semibold text-white" role="status">
          <Eye className="mr-2 inline h-4 w-4" aria-hidden />
          Preview — this article is {article.status}
          {article.scheduledFor ? ` for ${formatDate(article.scheduledFor, { dateStyle: 'medium', timeStyle: 'short' })}` : ''} and is not public.
        </div>
      )}

      {/* Header */}
      <header className="container-site pt-10 sm:pt-14">
        <div className="mx-auto max-w-4xl text-center">
          <div className="flex items-center justify-center gap-3">
            <CategoryBadge category={article.category} />
            {article.publishedAt && (
              <>
                <span className="h-px w-6 bg-ink-500" aria-hidden />
                <time className="kicker text-ink-300" dateTime={article.publishedAt}>
                  {formatDate(article.publishedAt, { day: 'numeric', month: 'long', year: 'numeric' })}
                </time>
              </>
            )}
          </div>
          <h1 className="mt-5 text-balance font-display text-[2.3rem] font-bold leading-[1.04] tracking-[-0.01em] text-white sm:text-6xl lg:text-[4.2rem]">
            {article.title}
          </h1>
          {article.excerpt && (
            <p className="mx-auto mt-6 max-w-2xl text-balance text-xl leading-relaxed text-ink-300 sm:text-[1.4rem]">
              {article.excerpt}
            </p>
          )}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm">
            {article.author && (
              <Link to={`/u/${article.author.username}`} className="flex items-center gap-3 text-left">
                <Avatar user={article.author} size={40} />
                <span>
                  <span className="block font-semibold text-white">By {article.author.name}</span>
                  <span className="block text-xs text-ink-300">{article.readingTime} min read</span>
                </span>
              </Link>
            )}
            {canEdit && (
              <Link to={`/dashboard/articles/${article._id}`} className="btn-ghost btn-sm">
                <PencilLine className="h-3.5 w-3.5" /> Edit
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Cover */}
      <figure className="container-site mt-10">
        <Img
          src={article.coverImage?.url}
          alt={article.coverImage?.alt || article.title}
          eager
          className="aspect-[16/9] w-full lg:aspect-[21/9]"
          sizes="100vw"
          width={2000}
        />
        {(article.coverImage?.caption || article.coverImage?.credit) && (
          <figcaption className="mt-3 flex flex-wrap justify-between gap-2 text-xs text-ink-300">
            <span>{article.coverImage.caption}</span>
            {article.coverImage.credit && <span className="uppercase tracking-wider">Photo: {article.coverImage.credit}</span>}
          </figcaption>
        )}
      </figure>

      {/* Body */}
      <div className="container-site mt-12 grid gap-10 lg:grid-cols-12">
        <aside className="hidden lg:col-span-3 lg:block">
          <div className="sticky top-40 space-y-10">
            {showToc && <TableOfContents items={toc} />}
            <EngagementBar article={article} onChange={update} vertical />
          </div>
        </aside>

        <div className="min-w-0 lg:col-span-6">
          <div className="mb-8 border-y border-ink-600 py-4 lg:hidden">
            <EngagementBar article={article} onChange={update} />
          </div>
          {showToc && (
            <details className="mb-8 border border-ink-600 px-4 py-3 lg:hidden">
              <summary className="kicker cursor-pointer text-blood-400">Contents</summary>
              <ol className="mt-3 space-y-2 text-sm">
                {toc.map((t) => (
                  <li key={t.id} className={t.level === 3 ? 'pl-4' : ''}>
                    <a href={`#${t.id}`} className="text-ink-300 hover:text-white">{t.text}</a>
                  </li>
                ))}
              </ol>
            </details>
          )}

          <div id="article-body">
            <ArticleBody html={html} />
          </div>
          <TacticalBlock tactical={article.tactical} />

          {/* Tags, players, clubs */}
          <footer className="mt-14 space-y-6 border-t border-ink-600 pt-8">
            {article.tags?.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="kicker mr-2 text-ink-400">Tags</span>
                {article.tags.map((t) => (
                  <Link key={t._id} to={`/search?tag=${t.slug}`} className="border border-ink-500 px-3 py-1 text-xs font-semibold text-bone hover:border-blood hover:text-white">
                    #{t.name}
                  </Link>
                ))}
              </div>
            )}
            {article.players?.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="kicker mr-2 text-ink-400">Players</span>
                {article.players.map((p) => (
                  <Link key={p._id} to={`/players/${p.slug}`} className="flex items-center gap-2 border border-ink-500 py-1 pl-1 pr-3 text-xs font-semibold text-bone hover:border-blood">
                    <Avatar user={{ name: p.name, avatar: p.portrait }} size={22} />
                    {p.name}
                  </Link>
                ))}
              </div>
            )}
            {article.author?.bio && (
              <div className="flex gap-4 bg-ink-800 p-5">
                <Avatar user={article.author} size={56} />
                <div>
                  <p className="kicker text-blood-400">About the author</p>
                  <Link to={`/u/${article.author.username}`} className="mt-1 block font-display text-xl font-semibold text-white hover:underline">
                    {article.author.name}
                  </Link>
                  <p className="mt-1 text-sm text-ink-300">{article.author.bio}</p>
                </div>
              </div>
            )}
          </footer>

          {!article.isPreview && (
            <div className="mt-16">
              <CommentSection articleId={article._id} onCountChange={(d) => setData((a) => ({ ...a, commentCount: Math.max(0, a.commentCount + d) }))} />
            </div>
          )}
        </div>
      </div>

      {/* Related */}
      {related.data?.length > 0 && (
        <section className="container-site mt-24" aria-labelledby="related-h">
          <SectionHeader kicker="Keep reading" title={<span id="related-h">Related Stories</span>} />
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3">
            {related.data.map((a) => (
              <ArticleCard key={a._id} article={a} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
