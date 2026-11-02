import { Article, Category, Player, PUBLIC_FILTER } from '../models/index.js';
import { asyncHandler, ok, getPagination, pageMeta, escapeRegex } from '../utils/http.js';
import { LIST_FIELDS, listPopulate } from '../services/articleService.js';

/**
 * Search published articles across title, excerpt, body text, tags, players,
 * clubs and category (via the weighted text index). Falls back to a
 * case-insensitive substring match when the text index finds nothing, so
 * partial words like "gegenpress" still return results.
 */
export const search = asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim().slice(0, 100);
  const pg = getPagination(req.query, { defaultLimit: 10, maxLimit: 30 });
  if (q.length < 2) return ok(res, { articles: [], players: [], query: q }, pageMeta(pg, 0));

  const base = PUBLIC_FILTER();
  if (req.query.category) {
    const cat = await Category.findOne({ slug: req.query.category }).select('_id').lean();
    if (!cat) return ok(res, { articles: [], players: [], query: q }, pageMeta(pg, 0));
    base.category = cat._id;
  }

  const sortKey = req.query.sort || 'relevance';
  const sortMap = {
    newest: { publishedAt: -1 },
    popular: { viewCount: -1, likeCount: -1 },
  };

  let filter = { ...base, $text: { $search: q } };
  let total = await Article.countDocuments(filter);
  let useText = true;

  if (!total) {
    const rx = new RegExp(escapeRegex(q), 'i');
    filter = {
      ...base,
      $or: [{ title: rx }, { excerpt: rx }, { contentText: rx }, { searchTerms: rx }, { clubs: rx }],
    };
    total = await Article.countDocuments(filter);
    useText = false;
  }

  let query = Article.find(filter, useText ? { score: { $meta: 'textScore' } } : undefined).select(
    LIST_FIELDS
  );
  if (sortMap[sortKey]) query = query.sort(sortMap[sortKey]);
  else query = query.sort(useText ? { score: { $meta: 'textScore' }, publishedAt: -1 } : { publishedAt: -1 });

  const playerRx = new RegExp(escapeRegex(q), 'i');
  const [articles, players] = await Promise.all([
    query.skip(pg.skip).limit(pg.limit).populate(listPopulate).lean(),
    pg.page === 1
      ? Player.find({ $or: [{ name: playerRx }, { currentClub: playerRx }, { nationality: playerRx }] })
          .select('name slug portrait position currentClub nationality')
          .limit(4)
          .lean()
      : [],
  ]);

  ok(res, { articles, players, query: q }, pageMeta(pg, total));
});
