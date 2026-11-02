import { Article, User, Comment, Category, Like, NewsletterSubscriber, Poll } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok, getPagination, pageMeta, assertObjectId, escapeRegex } from '../utils/http.js';
import { isAdmin } from '../middleware/auth.js';
import { canManageArticle, detailPopulate, listPopulate, LIST_FIELDS } from '../services/articleService.js';
import { removeComment } from './commentController.js';

/** Editors only see their own articles; admins see everything. */
const scope = (user) => (isAdmin(user) ? {} : { author: user._id });

export const analytics = asyncHandler(async (req, res) => {
  const own = scope(req.user);
  const articleIds = isAdmin(req.user) ? null : (await Article.find(own).select('_id').lean()).map((a) => a._id);
  const byArticle = articleIds ? { article: { $in: articleIds } } : {};

  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5, 1);
  sixMonthsAgo.setHours(0, 0, 0, 0);

  const [
    statusCounts,
    totals,
    users,
    comments,
    reportedComments,
    subscribers,
    polls,
    topArticles,
    byCategory,
    monthly,
    recentLikes,
  ] = await Promise.all([
    Article.aggregate([{ $match: own }, { $group: { _id: '$status', count: { $sum: 1 } } }]),
    Article.aggregate([
      { $match: own },
      {
        $group: {
          _id: null,
          views: { $sum: '$viewCount' },
          likes: { $sum: '$likeCount' },
          bookmarks: { $sum: '$bookmarkCount' },
        },
      },
    ]),
    isAdmin(req.user) ? User.countDocuments() : null,
    Comment.countDocuments({ ...byArticle, status: 'visible' }),
    isAdmin(req.user) ? Comment.countDocuments({ reportCount: { $gt: 0 }, status: 'visible' }) : null,
    isAdmin(req.user) ? NewsletterSubscriber.countDocuments({ status: 'subscribed' }) : null,
    Poll.countDocuments(),
    Article.find({ ...own, status: 'published' })
      .select('title slug viewCount likeCount commentCount bookmarkCount publishedAt')
      .sort({ viewCount: -1 })
      .limit(8)
      .lean(),
    Article.aggregate([
      { $match: { ...own, status: 'published' } },
      { $group: { _id: '$category', articles: { $sum: 1 }, views: { $sum: '$viewCount' }, likes: { $sum: '$likeCount' } } },
      { $lookup: { from: Category.collection.name, localField: '_id', foreignField: '_id', as: 'cat' } },
      { $project: { _id: 0, name: { $ifNull: [{ $first: '$cat.name' }, 'Uncategorised'] }, articles: 1, views: 1, likes: 1 } },
      { $sort: { views: -1 } },
    ]),
    Article.aggregate([
      { $match: { ...own, status: 'published', publishedAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: { y: { $year: '$publishedAt' }, m: { $month: '$publishedAt' } },
          published: { $sum: 1 },
          views: { $sum: '$viewCount' },
        },
      },
    ]),
    Like.countDocuments({ ...byArticle, createdAt: { $gte: new Date(Date.now() - 30 * 864e5) } }),
  ]);

  const status = Object.fromEntries(statusCounts.map((s) => [s._id, s.count]));
  const months = [];
  for (let i = 5; i >= 0; i -= 1) {
    const d = new Date();
    d.setMonth(d.getMonth() - i, 1);
    const row = monthly.find((m) => m._id.y === d.getFullYear() && m._id.m === d.getMonth() + 1);
    months.push({
      month: d.toLocaleString('en-GB', { month: 'short' }),
      published: row?.published || 0,
      views: row?.views || 0,
    });
  }

  ok(res, {
    scope: isAdmin(req.user) ? 'all' : 'own',
    cards: {
      totalArticles: Object.values(status).reduce((a, b) => a + b, 0),
      published: status.published || 0,
      drafts: status.draft || 0,
      scheduled: status.scheduled || 0,
      views: totals[0]?.views || 0,
      likes: totals[0]?.likes || 0,
      bookmarks: totals[0]?.bookmarks || 0,
      comments,
      users,
      reportedComments,
      subscribers,
      polls,
      likesLast30Days: recentLikes,
    },
    topArticles,
    byCategory,
    monthly: months,
  });
});

/* ---------- articles ---------- */

export const adminListArticles = asyncHandler(async (req, res) => {
  const pg = getPagination(req.query, { defaultLimit: 15, maxLimit: 100 });
  const filter = { ...scope(req.user) };
  if (['draft', 'scheduled', 'published'].includes(req.query.status)) filter.status = req.query.status;
  if (req.query.q) filter.title = new RegExp(escapeRegex(String(req.query.q).slice(0, 80)), 'i');
  if (req.query.featured === 'true') filter.featured = true;

  const [items, total] = await Promise.all([
    Article.find(filter)
      .select(LIST_FIELDS)
      .sort({ updatedAt: -1 })
      .skip(pg.skip)
      .limit(pg.limit)
      .populate(listPopulate)
      .lean(),
    Article.countDocuments(filter),
  ]);
  ok(res, items, pageMeta(pg, total));
});

export const adminGetArticle = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Article');
  const article = await Article.findById(req.params.id).populate(detailPopulate).lean();
  if (!article) throw ApiError.notFound('Article not found.');
  if (!canManageArticle(req.user, article)) throw ApiError.forbidden('You can only open your own articles.');
  ok(res, article);
});

/** Toggle homepage featuring (admin only). */
export const setFeatured = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Article');
  const featured = Boolean(req.body.featured);
  const article = await Article.findById(req.params.id);
  if (!article) throw ApiError.notFound('Article not found.');
  if (featured && article.status !== 'published') {
    throw ApiError.badRequest('Only published articles can be featured.');
  }
  article.featured = featured;
  await article.save();
  ok(res, { _id: article._id, featured: article.featured });
});

/* ---------- users ---------- */

export const listUsers = asyncHandler(async (req, res) => {
  const pg = getPagination(req.query, { defaultLimit: 20, maxLimit: 100 });
  const filter = {};
  if (['USER', 'EDITOR', 'ADMIN'].includes(req.query.role)) filter.role = req.query.role;
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(String(req.query.q).slice(0, 60)), 'i');
    filter.$or = [{ name: rx }, { username: rx }, { email: rx }];
  }
  const [items, total] = await Promise.all([
    User.find(filter).sort({ createdAt: -1 }).skip(pg.skip).limit(pg.limit).lean(),
    User.countDocuments(filter),
  ]);
  ok(res, items.map(({ passwordHash, __v, ...u }) => u), pageMeta(pg, total));
});

export const setUserRole = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'User');
  if (String(req.params.id) === String(req.user._id)) {
    throw ApiError.badRequest('You cannot change your own role.');
  }
  const target = await User.findById(req.params.id);
  if (!target) throw ApiError.notFound('User not found.');
  if (target.role === 'ADMIN' && req.body.role !== 'ADMIN') {
    const admins = await User.countDocuments({ role: 'ADMIN' });
    if (admins <= 1) throw ApiError.badRequest('At least one administrator must remain.');
  }
  target.role = req.body.role;
  await target.save();
  ok(res, target.toJSON());
});

/* ---------- comment moderation ---------- */

export const listCommentsForModeration = asyncHandler(async (req, res) => {
  const pg = getPagination(req.query, { defaultLimit: 20, maxLimit: 100 });
  const filter = {};
  if (req.query.filter === 'reported') {
    filter.reportCount = { $gt: 0 };
    filter.status = 'visible';
  } else if (req.query.filter === 'hidden') filter.status = 'hidden';
  else filter.status = { $ne: 'removed' };

  const sort = req.query.filter === 'reported' ? { reportCount: -1, createdAt: -1 } : { createdAt: -1 };
  const [items, total] = await Promise.all([
    Comment.find(filter)
      .select('+reports')
      .sort(sort)
      .skip(pg.skip)
      .limit(pg.limit)
      .populate({ path: 'author', select: 'name username avatar' })
      .populate({ path: 'article', select: 'title slug' })
      .populate({ path: 'reports.user', select: 'username' })
      .lean(),
    Comment.countDocuments(filter),
  ]);
  ok(res, items, pageMeta(pg, total));
});

export const moderateComment = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Comment');
  const comment = await Comment.findById(req.params.id).select('+reports');
  if (!comment) throw ApiError.notFound('Comment not found.');

  const { status, clearReports } = req.body;
  if (status === 'removed') {
    await removeComment(comment);
    return ok(res, { _id: comment._id, status: 'removed' });
  }

  const prev = comment.status;
  comment.status = status;
  if (clearReports) {
    comment.reports = [];
    comment.reportCount = 0;
  }
  await comment.save();

  // Keep the public comment counter in line with visibility.
  const delta = prev === 'visible' && status === 'hidden' ? -1 : prev === 'hidden' && status === 'visible' ? 1 : 0;
  if (delta) {
    await Article.updateOne(
      { _id: comment.article },
      [{ $set: { commentCount: { $max: [0, { $add: ['$commentCount', delta] }] } } }]
    );
  }
  ok(res, { _id: comment._id, status: comment.status, reportCount: comment.reportCount });
});

/* ---------- newsletter ---------- */

export const listSubscribers = asyncHandler(async (req, res) => {
  const pg = getPagination(req.query, { defaultLimit: 25, maxLimit: 200 });
  const [items, total] = await Promise.all([
    NewsletterSubscriber.find().sort({ createdAt: -1 }).skip(pg.skip).limit(pg.limit).lean(),
    NewsletterSubscriber.countDocuments(),
  ]);
  ok(res, items, pageMeta(pg, total));
});
