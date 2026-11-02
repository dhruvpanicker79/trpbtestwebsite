import { Player, PlayerRating, Article, PUBLIC_FILTER } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok, created, getPagination, pageMeta, assertObjectId, escapeRegex } from '../utils/http.js';
import { uniqueSlug } from '../utils/slug.js';
import { LIST_FIELDS, listPopulate } from '../services/articleService.js';

export const listPlayers = asyncHandler(async (req, res) => {
  const pg = getPagination(req.query, { defaultLimit: 12, maxLimit: 50 });
  const filter = {};
  if (req.query.q) {
    const rx = new RegExp(escapeRegex(String(req.query.q).slice(0, 60)), 'i');
    filter.$or = [{ name: rx }, { currentClub: rx }, { nationality: rx }];
  }
  if (req.query.position) filter.position = new RegExp(escapeRegex(req.query.position), 'i');
  const sort = req.query.sort === 'rating' ? { ratingAverage: -1, ratingCount: -1 } : { name: 1 };

  const [items, total] = await Promise.all([
    Player.find(filter)
      .select('name slug portrait nationality position currentClub ratingAverage ratingCount isSample')
      .sort(sort)
      .skip(pg.skip)
      .limit(pg.limit)
      .lean(),
    Player.countDocuments(filter),
  ]);
  ok(res, items, pageMeta(pg, total));
});

export const getPlayer = asyncHandler(async (req, res) => {
  const player = await Player.findOne({ slug: req.params.slug }).lean();
  if (!player) throw ApiError.notFound('Player not found.');

  const [articles, myRating, distribution] = await Promise.all([
    Article.find({ ...PUBLIC_FILTER(), players: player._id })
      .select(LIST_FIELDS)
      .sort({ publishedAt: -1 })
      .limit(6)
      .populate(listPopulate)
      .lean(),
    req.user ? PlayerRating.findOne({ player: player._id, user: req.user._id }).lean() : null,
    PlayerRating.aggregate([
      { $match: { player: player._id } },
      { $group: { _id: '$score', count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  ok(res, {
    ...player,
    articles,
    myRating: myRating?.score ?? null,
    ratingDistribution: Array.from({ length: 10 }, (_, i) => ({
      score: i + 1,
      count: distribution.find((d) => d._id === i + 1)?.count || 0,
    })),
  });
});

async function recalcRating(playerId) {
  const [agg] = await PlayerRating.aggregate([
    { $match: { player: playerId } },
    { $group: { _id: null, avg: { $avg: '$score' }, count: { $sum: 1 } } },
  ]);
  const ratingAverage = agg ? Math.round(agg.avg * 10) / 10 : 0;
  const ratingCount = agg?.count || 0;
  await Player.updateOne({ _id: playerId }, { ratingAverage, ratingCount });
  return { ratingAverage, ratingCount };
}

/**
 * One rating per user per player (unique index). Re-rating updates the
 * existing record in place rather than creating a second one.
 */
export const ratePlayer = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Player');
  const player = await Player.findById(req.params.id).select('_id').lean();
  if (!player) throw ApiError.notFound('Player not found.');

  try {
    await PlayerRating.findOneAndUpdate(
      { player: player._id, user: req.user._id },
      { $set: { score: req.body.score } },
      { upsert: true, new: true, runValidators: true }
    );
  } catch (err) {
    // A concurrent upsert lost the race — retry as a plain update.
    if (err.code !== 11000) throw err;
    await PlayerRating.updateOne({ player: player._id, user: req.user._id }, { score: req.body.score });
  }
  const stats = await recalcRating(player._id);
  ok(res, { ...stats, myRating: req.body.score });
});

/* ---------- admin ---------- */

export const createPlayer = asyncHandler(async (req, res) => {
  const slug = await uniqueSlug(Player, req.body.slug || req.body.name);
  created(res, await Player.create({ ...req.body, slug }));
});

export const updatePlayer = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Player');
  const player = await Player.findById(req.params.id);
  if (!player) throw ApiError.notFound('Player not found.');
  const { slug, ...rest } = req.body;
  Object.assign(player, rest);
  if (slug) player.slug = await uniqueSlug(Player, slug, player._id);
  await player.save();
  ok(res, player);
});

export const deletePlayer = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Player');
  const removed = await Player.findByIdAndDelete(req.params.id);
  if (!removed) throw ApiError.notFound('Player not found.');
  await Promise.all([
    PlayerRating.deleteMany({ player: removed._id }),
    Article.updateMany({ players: removed._id }, { $pull: { players: removed._id } }),
  ]);
  ok(res, { deleted: true, id: removed._id });
});

export const getPlayerById = asyncHandler(async (req, res) => {
  assertObjectId(req.params.id, 'Player');
  const player = await Player.findById(req.params.id).lean();
  if (!player) throw ApiError.notFound('Player not found.');
  ok(res, player);
});
