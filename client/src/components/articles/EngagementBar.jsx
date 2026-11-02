import { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Bookmark, Eye, Heart, Link2, MessageSquare, Share2 } from 'lucide-react';
import { articlesApi } from '../../services/index.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useToast } from '../../context/ToastContext.jsx';
import { compactNumber } from '../../utils/format.js';

/** Like, bookmark and share controls. State persists through the API. */
export default function EngagementBar({ article, onChange, vertical = false }) {
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(null);

  const requireUser = (action) => {
    if (user) return true;
    toast.info(`Sign in to ${action}.`);
    navigate('/login', { state: { from: location.pathname } });
    return false;
  };

  const like = async () => {
    if (!requireUser('like stories') || busy) return;
    setBusy('like');
    // Optimistic update, rolled back on failure.
    const prev = { liked: article.viewer.liked, likeCount: article.likeCount };
    onChange({ viewer: { ...article.viewer, liked: !prev.liked }, likeCount: prev.likeCount + (prev.liked ? -1 : 1) });
    try {
      const { data } = await articlesApi.like(article._id);
      onChange({ viewer: { ...article.viewer, liked: data.liked }, likeCount: data.likeCount });
    } catch (err) {
      onChange({ viewer: { ...article.viewer, liked: prev.liked }, likeCount: prev.likeCount });
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  const bookmark = async () => {
    if (!requireUser('save stories') || busy) return;
    setBusy('bookmark');
    try {
      const { data } = await articlesApi.bookmark(article._id);
      onChange({ viewer: { ...article.viewer, bookmarked: data.bookmarked }, bookmarkCount: data.bookmarkCount });
      toast.success(data.bookmarked ? 'Saved to your reading list.' : 'Removed from your reading list.');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBusy(null);
    }
  };

  const share = async () => {
    const url = window.location.href.split('#')[0];
    if (navigator.share) {
      try {
        await navigator.share({ title: article.title, text: article.excerpt, url });
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard.');
    } catch {
      toast.error('Could not copy the link. Copy it from the address bar instead.');
    }
  };

  const btn = 'group inline-flex items-center gap-2 text-sm font-semibold transition-colors disabled:opacity-60';
  const liked = article.viewer?.liked;
  const saved = article.viewer?.bookmarked;

  return (
    <div className={`flex ${vertical ? 'flex-col items-start gap-5' : 'flex-wrap items-center gap-x-6 gap-y-3'}`}>
      <button onClick={like} disabled={busy === 'like'} className={`${btn} ${liked ? 'text-blood-400' : 'text-bone hover:text-white'}`} aria-pressed={liked} aria-label={liked ? 'Unlike' : 'Like'}>
        <Heart className={`h-5 w-5 ${liked ? 'fill-current' : ''}`} aria-hidden />
        <span className="tabular-nums">{compactNumber(article.likeCount)}</span>
      </button>
      <button onClick={bookmark} disabled={busy === 'bookmark'} className={`${btn} ${saved ? 'text-blood-400' : 'text-bone hover:text-white'}`} aria-pressed={saved} aria-label={saved ? 'Remove bookmark' : 'Bookmark'}>
        <Bookmark className={`h-5 w-5 ${saved ? 'fill-current' : ''}`} aria-hidden />
        <span>{saved ? 'Saved' : 'Save'}</span>
      </button>
      <button onClick={share} className={`${btn} text-bone hover:text-white`} aria-label="Share this article">
        {typeof navigator !== 'undefined' && navigator.share ? <Share2 className="h-5 w-5" aria-hidden /> : <Link2 className="h-5 w-5" aria-hidden />}
        <span>Share</span>
      </button>
      <a href="#comments" className={`${btn} text-bone hover:text-white`}>
        <MessageSquare className="h-5 w-5" aria-hidden />
        <span className="tabular-nums">{article.commentCount}</span>
        <span className="sr-only">comments</span>
      </a>
      <span className="inline-flex items-center gap-2 text-sm text-ink-300" title="Views">
        <Eye className="h-5 w-5" aria-hidden />
        <span className="tabular-nums">{compactNumber(article.viewCount)}</span>
        <span className="sr-only">views</span>
      </span>
    </div>
  );
}
