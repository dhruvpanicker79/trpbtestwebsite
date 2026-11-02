import { Article, Comment, PUBLIC_FILTER } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok, created, getPagination, pageMeta, assertObjectId } from '../utils/http.js';
import { cleanPlainText } from '../utils/content.js';
import { isAdmin } from '../middleware/auth.js';

const AUTHOR = { path: 'author', select: 'name username avatar role' };

/** Present removed comments as tombstones so reply threads keep their context. */
function present(c) {
  if (c.status === 'removed') return { ...c, body: '', author: null, removed: true };
  return c;
}

export const listComments = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Article');
  const article = await Article.findOne({ _id: req.params.id, ...PUBLIC_FILTER() }).select('_id').lean();
  if (!article) throw ApiError.notFound('Article not found.');

  const pg = getPagination(req.query, { defaultLimit: 10, maxLimit: 30 });
  const sort = req.query.sort === 'oldest' ? { createdAt: 1 } : { createdAt: -1 };
  const filter = { article: article._id, parent: null, status: { $in: ['visible', 'removed'] } };

  const [topLevel, total] = await Promise.all([
    Comment.find(filter).sort(sort).skip(pg.skip).limit(pg.limit).populate(AUTHOR).lean(),
    Comment.countDocuments(filter),
  ]);

  const replies = await Comment.find({
    parent: { $in: topLevel.map((c) => c._id) },
    status: { $in: ['visible', 'removed'] },
  })
    .sort({ createdAt: 1 })
    .populate(AUTHOR)
    .lean();

  const byParent = new Map();
  for (const r of replies) {
    const key = String(r.parent);
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key).push(present(r));
  }

  const threads = topLevel
    .map((c) => ({ ...present(c), replies: byParent.get(String(c._id)) || [] }))
    // Hide fully-removed threads with no surviving replies.
    .filter((c) => !c.removed || c.replies.length);

  ok(res, threads, pageMeta(pg, total));
});

export const createComment = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Article');
  const article = await Article.findOne({ _id: req.params.id, ...PUBLIC_FILTER() }).select('_id').lean();
  if (!article) throw ApiError.notFound('Article not found.');

  const body = cleanPlainText(req.body.body);
  if (body.length < 2) throw ApiError.badRequest('Comment is too short.');

  const comment = await Comment.create({ article: article._id, author: req.user._id, body });
  await Article.updateOne({ _id: article._id }, { $inc: { commentCount: 1 } });
  created(res, { ...(await comment.populate(AUTHOR)).toObject(), replies: [] });
});

export const createReply = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Comment');
  const parent = await Comment.findOne({ _id: req.params.id, status: 'visible' }).lean();
  if (!parent) throw ApiError.notFound('Comment not found.');
  // Replies are one level deep: replying to a reply attaches to its thread root.
  const rootId = parent.parent || parent._id;

  const article = await Article.findOne({ _id: parent.article, ...PUBLIC_FILTER() }).select('_id').lean();
  if (!article) throw ApiError.notFound('Article not found.');

  const body = cleanPlainText(req.body.body);
  if (body.length < 2) throw ApiError.badRequest('Reply is too short.');

  const reply = await Comment.create({ article: article._id, author: req.user._id, parent: rootId, body });
  await Promise.all([
    Comment.updateOne({ _id: rootId }, { $inc: { replyCount: 1 } }),
    Article.updateOne({ _id: article._id }, { $inc: { commentCount: 1 } }),
  ]);
  created(res, (await reply.populate(AUTHOR)).toObject());
});

/** Author or admin may delete. Threads with replies keep a tombstone. */
export const deleteComment = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Comment');
  const comment = await Comment.findById(req.params.id);
  if (!comment || comment.status === 'removed') throw ApiError.notFound('Comment not found.');

  const isOwner = String(comment.author) === String(req.user._id);
  if (!isOwner && !isAdmin(req.user)) throw ApiError.forbidden('You can only delete your own comments.');

  await removeComment(comment);
  ok(res, { deleted: true, id: comment._id });
});

/** Shared by user deletion and moderation. Keeps counters consistent. */
export async function removeComment(comment) {
  const wasVisible = comment.status === 'visible';
  if (!comment.parent && comment.replyCount > 0) {
    comment.status = 'removed';
    comment.body = '[removed]';
    await comment.save();
  } else {
    await Comment.deleteOne({ _id: comment._id });
    if (comment.parent) {
      await Comment.updateOne(
        { _id: comment.parent },
        [{ $set: { replyCount: { $max: [0, { $subtract: ['$replyCount', 1] }] } } }]
      );
    }
  }
  if (wasVisible) {
    await Article.updateOne(
      { _id: comment.article },
      [{ $set: { commentCount: { $max: [0, { $subtract: ['$commentCount', 1] }] } } }]
    );
  }
}

export const reportComment = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Comment');
  const result = await Comment.updateOne(
    { _id: req.params.id, status: 'visible', author: { $ne: req.user._id }, 'reports.user': { $ne: req.user._id } },
    {
      $push: { reports: { user: req.user._id, reason: cleanPlainText(req.body.reason || '') } },
      $inc: { reportCount: 1 },
    }
  );
  if (!result.matchedCount) {
    const exists = await Comment.exists({ _id: req.params.id, status: 'visible' });
    if (!exists) throw ApiError.notFound('Comment not found.');
    throw ApiError.conflict('You have already reported this comment (or it is your own).');
  }
  ok(res, { reported: true });
});
