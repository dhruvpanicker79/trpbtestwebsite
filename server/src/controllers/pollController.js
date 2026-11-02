import mongoose from 'mongoose';
import { Poll, PollVote } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok, created, getPagination, pageMeta, assertObjectId } from '../utils/http.js';

async function withViewerVotes(polls, user) {
  if (!user || !polls.length) return polls.map((p) => ({ ...p, userVote: null }));
  const votes = await PollVote.find({ user: user._id, poll: { $in: polls.map((p) => p._id) } }).lean();
  const map = new Map(votes.map((v) => [String(v.poll), String(v.option)]));
  return polls.map((p) => ({ ...p, userVote: map.get(String(p._id)) || null }));
}

function decorate(p) {
  const open = p.status === 'open' && (!p.closesAt || new Date(p.closesAt) > new Date());
  return { ...p, isOpen: open };
}

export const listPolls = asyncHandler(async (req, res) => {
  const pg = getPagination(req.query, { defaultLimit: 6, maxLimit: 30 });
  const filter = {};
  if (req.query.status === 'open') filter.status = 'open';
  if (req.query.status === 'closed') filter.status = 'closed';
  if (req.query.featured === 'true') filter.featured = true;

  const [polls, total] = await Promise.all([
    Poll.find(filter)
      .sort({ featured: -1, createdAt: -1 })
      .skip(pg.skip)
      .limit(pg.limit)
      .populate({ path: 'article', select: 'title slug' })
      .lean(),
    Poll.countDocuments(filter),
  ]);
  ok(res, (await withViewerVotes(polls, req.user)).map(decorate), pageMeta(pg, total));
});

export const getPoll = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Poll');
  const poll = await Poll.findById(req.params.id).populate({ path: 'article', select: 'title slug' }).lean();
  if (!poll) throw ApiError.notFound('Poll not found.');
  const [withVote] = await withViewerVotes([poll], req.user);
  ok(res, decorate(withVote));
});

/**
 * One vote per user per poll. The unique (poll,user) index on PollVote is the
 * source of truth: inserting the vote first means concurrent duplicate requests
 * fail with E11000 before any counter is incremented.
 */
export const vote = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Poll');
  const poll = await Poll.findById(req.params.id);
  if (!poll) throw ApiError.notFound('Poll not found.');
  if (!poll.isOpen()) throw ApiError.badRequest('This poll is closed.');

  const option = poll.options.id(req.body.optionId);
  if (!option) throw ApiError.badRequest('That option does not belong to this poll.');

  try {
    await PollVote.create({ poll: poll._id, user: req.user._id, option: option._id });
  } catch (err) {
    if (err.code === 11000) throw ApiError.conflict('You have already voted in this poll.');
    throw err;
  }

  const updated = await Poll.findOneAndUpdate(
    { _id: poll._id, 'options._id': option._id },
    { $inc: { 'options.$.votes': 1, totalVotes: 1 } },
    { new: true }
  ).lean();
  ok(res, decorate({ ...updated, userVote: String(option._id) }));
});

/* ---------- admin ---------- */

export const createPoll = asyncHandler(async (req, res) => {
  const { options, ...rest } = req.body;
  const poll = await Poll.create({
    ...rest,
    options: options.map((o) => ({ text: o.text })),
    createdBy: req.user._id,
  });
  created(res, poll);
});

/** Editing keeps vote counts for options that still exist (matched by _id). */
export const updatePoll = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Poll');
  const poll = await Poll.findById(req.params.id);
  if (!poll) throw ApiError.notFound('Poll not found.');
  const { options, ...rest } = req.body;
  Object.assign(poll, rest);

  if (options) {
    const kept = options.map((o) => {
      const existing = o._id ? poll.options.id(o._id) : null;
      return existing ? { _id: existing._id, text: o.text, votes: existing.votes } : { text: o.text, votes: 0 };
    });
    const keptIds = kept.filter((o) => o._id).map((o) => o._id);
    // Votes for removed options are discarded so totals stay consistent.
    await PollVote.deleteMany({ poll: poll._id, option: { $nin: keptIds.map((id) => new mongoose.Types.ObjectId(id)) } });
    poll.options = kept;
    poll.totalVotes = kept.reduce((s, o) => s + (o.votes || 0), 0);
  }
  await poll.save();
  ok(res, poll);
});

export const deletePoll = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Poll');
  const removed = await Poll.findByIdAndDelete(req.params.id);
  if (!removed) throw ApiError.notFound('Poll not found.');
  await PollVote.deleteMany({ poll: removed._id });
  ok(res, { deleted: true, id: removed._id });
});
