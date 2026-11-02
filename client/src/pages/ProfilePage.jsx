import { Link, useParams } from 'react-router-dom';
import { usersApi } from '../services/index.js';
import { useAsync } from '../hooks/useAsync.js';
import { useSeo } from '../hooks/useSeo.js';
import { useAuth } from '../context/AuthContext.jsx';
import ArticleCard from '../components/articles/ArticleCard.jsx';
import { Avatar, EmptyState, ErrorState, PageLoader, SectionHeader } from '../components/ui/Bits.jsx';
import { formatDate, timeAgo } from '../utils/format.js';
import NotFoundPage from './NotFoundPage.jsx';

export default function ProfilePage() {
  const { username } = useParams();
  const { user: me } = useAuth();
  const { data: profile, loading, error, reload } = useAsync(() => usersApi.profile(username), [username]);
  useSeo({ title: profile ? `${profile.name} (@${profile.username})` : undefined, description: profile?.bio });

  if (loading && (!profile || profile.username !== username.toLowerCase())) return <PageLoader />;
  if (error?.status === 404) return <NotFoundPage message="No reader with that username." />;
  if (error) return <div className="container-site py-20"><ErrorState error={error} onRetry={reload} /></div>;
  if (!profile) return null;

  const isMe = me?.username === profile.username;

  return (
    <div className="container-site py-14">
      <header className="flex flex-col gap-6 border-b border-ink-600 pb-10 sm:flex-row sm:items-end">
        <Avatar user={profile} size={112} />
        <div className="flex-1">
          {profile.role !== 'USER' && <p className="kicker text-blood-400">{profile.role === 'ADMIN' ? 'TRPB Editorial' : 'Contributor'}</p>}
          <h1 className="mt-1 font-display text-4xl font-bold text-white sm:text-6xl">{profile.name}</h1>
          <p className="mt-2 text-sm text-ink-300">
            @{profile.username} · Joined {formatDate(profile.createdAt, { month: 'long', year: 'numeric' })}
            {profile.favouriteClub && <> · Supports {profile.favouriteClub}</>} · {profile.commentCount} comments
          </p>
          {profile.bio && <p className="mt-4 max-w-2xl font-serif text-lg text-bone/90">{profile.bio}</p>}
        </div>
        {isMe && <Link to="/account" className="btn-ghost btn-sm self-start sm:self-end">Edit profile</Link>}
      </header>

      <div className="mt-12 grid gap-12 lg:grid-cols-12">
        {profile.articles?.length > 0 && (
          <section className="lg:col-span-7">
            <SectionHeader kicker="Writing" title="Articles" />
            {profile.articles.map((a) => <ArticleCard key={a._id} article={a} variant="list" />)}
          </section>
        )}
        <section className={profile.articles?.length ? 'lg:col-span-5' : 'lg:col-span-8'}>
          <SectionHeader kicker="Community" title="Recent comments" />
          {profile.recentComments.length === 0 ? (
            <EmptyState title="No comments yet" />
          ) : (
            <ul className="divide-y divide-ink-600">
              {profile.recentComments.map((c) => (
                <li key={c._id} className="py-5">
                  <p className="text-xs text-ink-400">
                    On <Link to={`/article/${c.article.slug}#comments`} className="font-semibold text-bone hover:text-white">{c.article.title}</Link> · {timeAgo(c.createdAt)}
                  </p>
                  <p className="mt-2 line-clamp-4 font-serif text-bone/90">{c.body}</p>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
