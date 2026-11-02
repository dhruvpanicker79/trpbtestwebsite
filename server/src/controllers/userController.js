import { User, Article, Comment, Bookmark, PUBLIC_FILTER } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok, getPagination, pageMeta, assertObjectId } from '../utils/http.js';
import { cleanPlainText } from '../utils/content.js';
import { LIST_FIELDS, listPopulate } from '../services/articleService.js';

export const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findOne({ username: req.params.username.toLowerCase() })
    .select('name username avatar bio favouriteClub role createdAt')
    .lean();
  if (!user) throw ApiError.notFound('User not found.');

  const [commentCount, recentComments, articles] = await Promise.all([
    Comment.countDocuments({ author: user._id, status: 'visible' }),
    Comment.find({ author: user._id, status: 'visible' })
      .sort({ createdAt: -1 })
      .limit(6)
      .populate({ path: 'article', select: 'title slug status publishedAt' })
      .lean(),
    user.role === 'USER'
      ? []
      : Article.find({ ...PUBLIC_FILTER(), author: user._id })
          .select(LIST_FIELDS)
          .sort({ publishedAt: -1 })
          .limit(6)
          .populate(listPopulate)
          .lean(),
  ]);

  ok(res, {
    ...user,
    commentCount,
    // Never surface comments on unpublished articles.
    recentComments: recentComments.filter((c) => c.article?.status === 'published'),
    articles,
  });
});

export const updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('+passwordHash');
  const { currentPassword, newPassword, ...rest } = req.body;

  if (rest.username && rest.username !== user.username) {
    if (await User.exists({ username: rest.username, _id: { $ne: user._id } })) {
      throw ApiError.conflict('That username is taken.');
    }
  }
  if (newPassword) {
    if (!(await user.comparePassword(currentPassword || ''))) {
      throw new ApiError(422, 'Current password is incorrect.', {
        details: [{ field: 'currentPassword', message: 'Current password is incorrect.' }],
      });
    }
    user.passwordHash = await User.hashPassword(newPassword);
  }

  for (const key of ['name', 'username', 'avatar', 'favouriteClub']) {
    if (rest[key] !== undefined) user[key] = rest[key];
  }
  if (rest.bio !== undefined) user.bio = cleanPlainText(rest.bio);

  await user.save();
  ok(res, user.toJSON());
});

export const myBookmarks = asyncHandler(async (req, res) => {
  const pg = getPagination(req.query, { defaultLimit: 12 });
  const filter = { user: req.user._id };
  if (req.query.list) filter.list = String(req.query.list);

  const [rows, total, lists] = await Promise.all([
    Bookmark.find(filter)
      .sort({ createdAt: -1 })
      .skip(pg.skip)
      .limit(pg.limit)
      .populate({ path: 'article', select: `${LIST_FIELDS}`, populate: listPopulate })
      .lean(),
    Bookmark.countDocuments(filter),
    Bookmark.aggregate([
      { $match: { user: req.user._id } },
      { $group: { _id: '$list', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  const items = rows
    .filter((b) => b.article && b.article.status === 'published')
    .map((b) => ({ _id: b._id, list: b.list, savedAt: b.createdAt, article: b.article }));

  ok(res, items, { ...pageMeta(pg, total), lists: lists.map((l) => ({ name: l._id, count: l.count })) });
});

/** Move a bookmark into a named reading list. */
export const moveBookmark = asyncHandler(async (req, res) => {
  assertObjectId(req.params.articleId, 'Bookmark');
  const updated = await Bookmark.findOneAndUpdate(
    { user: req.user._id, article: req.params.articleId },
    { list: req.body.list },
    { new: true }
  ).lean();
  if (!updated) throw ApiError.notFound('Bookmark not found.');
  ok(res, updated);
});
