import mongoose from 'mongoose';
import {
  Article,
  Category,
  Tag,
  Player,
  User,
  Comment,
  Like,
  Bookmark,
  PUBLIC_FILTER,
} from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok, created, getPagination, pageMeta, assertObjectId } from '../utils/http.js';
import {
  LIST_FIELDS,
  listPopulate,
  detailPopulate,
  applyArticleInput,
  canManageArticle,
  viewerState,
} from '../services/articleService.js';

const SORTS = {
  newest: { publishedAt: -1, _id: -1 },
  oldest: { publishedAt: 1, _id: 1 },
  popular: { viewCount: -1, likeCount: -1, publishedAt: -1 },
  discussed: { commentCount: -1, publishedAt: -1 },
};

/** Build a public filter from query-string filters (category, tag, player, author). */
async function publicFilterFromQuery(q) {
  const filter = PUBLIC_FILTER();
  if (q.category) {
    const cat = await Category.findOne({ slug: q.category }).select('_id').lean();
    if (!cat) return null;
    filter.category = cat._id;
  }
  if (q.tag) {
    const tag = await Tag.findOne({ slug: q.tag }).select('_id').lean();
    if (!tag) return null;
    filter.tags = tag._id;
  }
  if (q.player) {
    const player = await Player.findOne({ slug: q.player }).select('_id').lean();
    if (!player) return null;
    filter.players = player._id;
  }
  if (q.author) {
    const author = await User.findOne({ username: String(q.author).toLowerCase() }).select('_id').lean();
    if (!author) return null;
    filter.author = author._id;
  }
  if (q.featured === 'true') filter.featured = true;
  if (q.exclude) {
    const ids = String(q.exclude).split(',').filter((id) => mongoose.isValidObjectId(id));
    if (ids.length) filter._id = { $nin: ids };
  }
  return filter;
}

export const listArticles = asyncHandler(async (req, res) => {
  const pg = getPagination(req.query);
  const filter = await publicFilterFromQuery(req.query);
  if (!filter) return ok(res, [], pageMeta(pg, 0));

  const sort = SORTS[req.query.sort] || SORTS.newest;
  const [items, total] = await Promise.all([
    Article.find(filter).select(LIST_FIELDS).sort(sort).skip(pg.skip).limit(pg.limit).populate(listPopulate).lean(),
    Article.countDocuments(filter),
  ]);
  ok(res, items, pageMeta(pg, total));
});

export const featuredArticles = asyncHandler(async (req, res) => {
  const limit = Math.min(10, parseInt(req.query.limit, 10) || 5);
  let items = await Article.find({ ...PUBLIC_FILTER(), featured: true })
    .select(LIST_FIELDS)
    .sort({ publishedAt: -1 })
    .limit(limit)
    .populate(listPopulate)
    .lean();
  // Fall back to latest stories so the homepage hero is never empty.
  if (!items.length) {
    items = await Article.find(PUBLIC_FILTER())
      .select(LIST_FIELDS)
      .sort({ publishedAt: -1 })
      .limit(limit)
      .populate(listPopulate)
      .lean();
  }
  ok(res, items);
});

/**
 * Trending = engagement weighted by recency. Score:
 *   (views + 4·likes + 6·comments + 3·bookmarks) / (ageInDays + 2)^1.3
 * Restricted to the last 120 days so old evergreen pieces don't dominate.
 */
export const trendingArticles = asyncHandler(async (req, res) => {
  const limit = Math.min(10, parseInt(req.query.limit, 10) || 5);
  const now = new Date();
  const since = new Date(now.getTime() - 120 * 864e5);
  const ranked = await Article.aggregate([
    { $match: { status: 'published', publishedAt: { $lte: now, $gte: since } } },
    {
      $addFields: {
        _age: { $divide: [{ $subtract: [now, '$publishedAt'] }, 864e5] },
        _engagement: {
          $add: [
            '$viewCount',
            { $multiply: ['$likeCount', 4] },
            { $multiply: ['$commentCount', 6] },
            { $multiply: ['$bookmarkCount', 3] },
          ],
        },
      },
    },
    { $addFields: { trendScore: { $divide: ['$_engagement', { $pow: [{ $add: ['$_age', 2] }, 1.3] }] } } },
    { $sort: { trendScore: -1 } },
    { $limit: limit },
    { $project: { _id: 1, trendScore: 1 } },
  ]);

  let ids = ranked.map((r) => r._id);
  if (ids.length < limit) {
    const extra = await Article.find({ ...PUBLIC_FILTER(), _id: { $nin: ids } })
      .sort({ viewCount: -1 })
      .limit(limit - ids.length)
      .select('_id')
      .lean();
    ids = ids.concat(extra.map((e) => e._id));
  }
  const docs = await Article.find({ _id: { $in: ids } }).select(LIST_FIELDS).populate(listPopulate).lean();
  const order = new Map(ids.map((id, i) => [String(id), i]));
  docs.sort((a, b) => order.get(String(a._id)) - order.get(String(b._id)));
  ok(res, docs);
});

/** Public article by slug. Drafts are only visible to their author or an admin. */
export const getArticle = asyncHandler(async (req, res) => {
  const article = await Article.findOne({ slug: req.params.slug }).populate(detailPopulate).lean();
  if (!article) throw ApiError.notFound('Article not found.');

  const isLive = article.status === 'published' && article.publishedAt <= new Date();
  if (!isLive && !canManageArticle(req.user, article)) throw ApiError.notFound('Article not found.');

  const viewer = await viewerState(req.user, article._id);
  ok(res, { ...article, isPreview: !isLive, viewer });
});

/** Increment view count — separate endpoint so previews and refetches don't inflate it. */
export const recordView = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Article');
  const updated = await Article.findOneAndUpdate(
    { _id: req.params.id, ...PUBLIC_FILTER() },
    { $inc: { viewCount: 1 } },
    { new: true, projection: { viewCount: 1 } }
  ).lean();
  if (!updated) throw ApiError.notFound('Article not found.');
  ok(res, { viewCount: updated.viewCount });
});

export const relatedArticles = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Article');
  const base = await Article.findOne({ _id: req.params.id, ...PUBLIC_FILTER() })
    .select('category tags players')
    .lean();
  if (!base) throw ApiError.notFound('Article not found.');
  const limit = Math.min(8, parseInt(req.query.limit, 10) || 3);

  const candidates = await Article.aggregate([
    {
      $match: {
        ...PUBLIC_FILTER(),
        _id: { $ne: base._id },
        $or: [{ category: base.category }, { tags: { $in: base.tags } }, { players: { $in: base.players } }],
      },
    },
    {
      $addFields: {
        relevance: {
          $add: [
            { $cond: [{ $eq: ['$category', base.category] }, 2, 0] },
            { $multiply: [{ $size: { $setIntersection: ['$tags', base.tags] } }, 3] },
            { $multiply: [{ $size: { $setIntersection: ['$players', base.players] } }, 4] },
          ],
        },
      },
    },
    { $sort: { relevance: -1, publishedAt: -1 } },
    { $limit: limit },
    { $project: { _id: 1 } },
  ]);
  const ids = candidates.map((c) => c._id);
  const docs = await Article.find({ _id: { $in: ids } }).select(LIST_FIELDS).populate(listPopulate).lean();
  docs.sort((a, b) => ids.findIndex((i) => i.equals(a._id)) - ids.findIndex((i) => i.equals(b._id)));
  ok(res, docs);
});

/* ---------- editorial CRUD ---------- */

export const createArticle = asyncHandler(async (req, res) => {
  const doc = new Article({ author: req.user._id, title: req.body.title });
  await applyArticleInput(doc, req.body, req.user);
  await doc.save();
  created(res, await doc.populate(detailPopulate));
});

export const updateArticle = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Article');
  const doc = await Article.findById(req.params.id);
  if (!doc) throw ApiError.notFound('Article not found.');
  if (!canManageArticle(req.user, doc)) throw ApiError.forbidden('You can only edit your own articles.');
  await applyArticleInput(doc, req.body, req.user);
  await doc.save();
  ok(res, await doc.populate(detailPopulate));
});

export const deleteArticle = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Article');
  const doc = await Article.findById(req.params.id).select('author');
  if (!doc) throw ApiError.notFound('Article not found.');
  if (!canManageArticle(req.user, doc)) throw ApiError.forbidden('You can only delete your own articles.');
  await Promise.all([
    Article.deleteOne({ _id: doc._id }),
    Comment.deleteMany({ article: doc._id }),
    Like.deleteMany({ article: doc._id }),
    Bookmark.deleteMany({ article: doc._id }),
  ]);
  ok(res, { deleted: true, id: doc._id });
});

/* ---------- engagement ---------- */

async function loadPublic(id) {
  assertObjectId(id, 'Article');
  const article = await Article.findOne({ _id: id, ...PUBLIC_FILTER() }).select('_id').lean();
  if (!article) throw ApiError.notFound('Article not found.');
  return article;
}

/** Toggle a unique (article,user) record and keep the counter in sync. */
async function toggle(Model, counterField, articleId, userId) {
  const removed = await Model.deleteOne({ article: articleId, user: userId });
  if (removed.deletedCount) {
    const a = await Article.findOneAndUpdate(
      { _id: articleId },
      [{ $set: { [counterField]: { $max: [0, { $subtract: [`$${counterField}`, 1] }] } } }],
      { new: true, projection: { [counterField]: 1 } }
    ).lean();
    return { active: false, count: a[counterField] };
  }
  try {
    await Model.create({ article: articleId, user: userId });
  } catch (err) {
    if (err.code !== 11000) throw err; // concurrent duplicate → already active
    const a = await Article.findById(articleId).select(counterField).lean();
    return { active: true, count: a[counterField] };
  }
  const a = await Article.findByIdAndUpdate(
    articleId,
    { $inc: { [counterField]: 1 } },
    { new: true, projection: { [counterField]: 1 } }
  ).lean();
  return { active: true, count: a[counterField] };
}

export const toggleLike = asyncHandler(async (req, res) => {
  const article = await loadPublic(req.params.id);
  const { active, count } = await toggle(Like, 'likeCount', article._id, req.user._id);
  ok(res, { liked: active, likeCount: count });
});

export const toggleBookmark = asyncHandler(async (req, res) => {
  const article = await loadPublic(req.params.id);
  const { active, count } = await toggle(Bookmark, 'bookmarkCount', article._id, req.user._id);
  ok(res, { bookmarked: active, bookmarkCount: count });
});
