import { Article, Category, Tag, Player, Like, Bookmark } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { sanitizeArticleHtml } from '../utils/content.js';
import { uniqueSlug } from '../utils/slug.js';

export const AUTHOR_FIELDS = 'name username avatar bio role';
export const LIST_FIELDS =
  'title slug excerpt coverImage author category tags readingTime status publishedAt scheduledFor featured viewCount likeCount commentCount createdAt updatedAt';

export const listPopulate = [
  { path: 'author', select: 'name username avatar' },
  { path: 'category', select: 'name slug' },
  { path: 'tags', select: 'name slug' },
];

export const detailPopulate = [
  { path: 'author', select: AUTHOR_FIELDS },
  { path: 'category', select: 'name slug description' },
  { path: 'tags', select: 'name slug' },
  { path: 'players', select: 'name slug portrait position currentClub nationality' },
];

/** Denormalise taxonomy names into a single indexed field for full-text search. */
async function buildSearchTerms(doc) {
  const [category, tags, players] = await Promise.all([
    Category.findById(doc.category).select('name').lean(),
    Tag.find({ _id: { $in: doc.tags } }).select('name').lean(),
    Player.find({ _id: { $in: doc.players } }).select('name currentClub').lean(),
  ]);
  return [
    category?.name,
    ...tags.map((t) => t.name),
    ...players.flatMap((p) => [p.name, p.currentClub]),
    ...(doc.clubs || []),
    doc.tactical?.formation,
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * Apply validated input to an article document, enforcing editorial rules.
 * Shared by create and update so both paths behave identically.
 */
export async function applyArticleInput(doc, input, user) {
  const isAdmin = user.role === 'ADMIN';

  if (input.category !== undefined) {
    if (!(await Category.exists({ _id: input.category }))) {
      throw ApiError.badRequest('Selected category does not exist.');
    }
    doc.category = input.category;
  }
  if (input.tags !== undefined) {
    const count = await Tag.countDocuments({ _id: { $in: input.tags } });
    if (count !== new Set(input.tags).size) throw ApiError.badRequest('One or more tags do not exist.');
    doc.tags = [...new Set(input.tags)];
  }
  if (input.players !== undefined) {
    const count = await Player.countDocuments({ _id: { $in: input.players } });
    if (count !== new Set(input.players).size) {
      throw ApiError.badRequest('One or more players do not exist.');
    }
    doc.players = [...new Set(input.players)];
  }

  for (const key of ['title', 'excerpt', 'coverImage', 'clubs', 'seo']) {
    if (input[key] !== undefined) doc[key] = input[key];
  }
  if (input.tactical !== undefined) doc.tactical = input.tactical || undefined;
  if (input.content !== undefined) doc.content = sanitizeArticleHtml(input.content);

  // Only admins may feature articles on the homepage.
  if (input.featured !== undefined && isAdmin) doc.featured = input.featured;

  if (input.slug) doc.slug = await uniqueSlug(Article, input.slug, doc._id);
  else if (!doc.slug) doc.slug = await uniqueSlug(Article, doc.title, doc._id);

  if (input.status !== undefined) {
    const prev = doc.status;
    doc.status = input.status;
    if (input.status === 'scheduled') {
      const when = input.scheduledFor ?? doc.scheduledFor;
      if (!when || new Date(when) <= new Date()) {
        throw ApiError.badRequest('Scheduled articles need a publication time in the future.');
      }
      doc.scheduledFor = when;
      doc.publishedAt = undefined;
    } else if (input.status === 'published') {
      if (prev !== 'published' || !doc.publishedAt) doc.publishedAt = new Date();
      doc.scheduledFor = undefined;
    } else {
      doc.scheduledFor = input.scheduledFor ?? doc.scheduledFor;
    }
  } else if (input.scheduledFor !== undefined) {
    doc.scheduledFor = input.scheduledFor;
  }

  if (doc.status !== 'published') doc.featured = isAdmin ? doc.featured : false;

  doc.searchTerms = await buildSearchTerms(doc);
  return doc;
}

export function canManageArticle(user, article) {
  if (!user) return false;
  if (user.role === 'ADMIN') return true;
  const authorId = article.author?._id ?? article.author;
  return user.role === 'EDITOR' && String(authorId) === String(user._id);
}

export async function viewerState(user, articleId) {
  if (!user) return { liked: false, bookmarked: false };
  const [liked, bookmarked] = await Promise.all([
    Like.exists({ article: articleId, user: user._id }),
    Bookmark.exists({ article: articleId, user: user._id }),
  ]);
  return { liked: Boolean(liked), bookmarked: Boolean(bookmarked) };
}
