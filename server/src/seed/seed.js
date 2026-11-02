/**
 * Seed the database with sample TRPB content.
 *
 *   npm run seed            (from /server, or `npm run seed` at the repo root)
 *
 * WARNING: clears all TRPB collections first. Refuses to run with
 * NODE_ENV=production unless `--force` is passed.
 */
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { connectDB, disconnectDB } from '../config/db.js';
import {
  User,
  Category,
  Tag,
  Article,
  Player,
  Comment,
  Poll,
  PollVote,
  Like,
  Bookmark,
  PlayerRating,
  NewsletterSubscriber,
} from '../models/index.js';
import { slugify } from '../utils/slug.js';
import { sanitizeArticleHtml } from '../utils/content.js';
import * as data from './data.js';

const DAY = 864e5;

async function main() {
  if (env.isProd && !process.argv.includes('--force')) {
    throw new Error('Refusing to seed in production without --force.');
  }
  if (!env.adminEmail || !env.adminPassword) {
    throw new Error('Set ADMIN_EMAIL and ADMIN_PASSWORD in server/.env before seeding.');
  }
  if (env.adminPassword.length < 8) throw new Error('ADMIN_PASSWORD must be at least 8 characters.');

  await connectDB();
  console.log('[seed] Clearing collections…');
  await Promise.all(
    [User, Category, Tag, Article, Player, Comment, Poll, PollVote, Like, Bookmark, PlayerRating, NewsletterSubscriber].map(
      (M) => M.deleteMany({})
    )
  );
  // Make sure unique and text indexes exist before inserting.
  await Promise.all([Article, User, Poll, PollVote, Like, Bookmark, PlayerRating].map((M) => M.syncIndexes()));

  /* ---------- users ---------- */
  const demoPassword = process.env.SEED_USER_PASSWORD || `${crypto.randomBytes(6).toString('base64url')}9a`;
  const hash = await User.hashPassword(demoPassword);
  const admin = await User.create({
    name: 'TRPB Editorial',
    username: 'trpb',
    email: env.adminEmail,
    passwordHash: await User.hashPassword(env.adminPassword),
    role: 'ADMIN',
    bio: 'The editorial desk of The Ronin’s Playbook.',
  });
  const people = {
    haruki: { name: 'Haruki Mori', role: 'EDITOR', bio: 'Features writer. Floodlights, lower leagues and long reads.', favouriteClub: 'FC Kanagawa Shore' },
    ines: { name: 'Inès Okafor', role: 'EDITOR', bio: 'Tactics editor. Draws boards on napkins.', favouriteClub: 'Real Costa Ámbar' },
    tomasz: { name: 'Tomasz Wilk', role: 'USER', bio: 'Season-ticket holder, armchair analyst.' },
    amara: { name: 'Amara Diallo', role: 'USER', bio: 'Grassroots coach. Full-backs are midfielders.' },
    jules: { name: 'Jules Laurent', role: 'USER', bio: 'Here for the culture pieces.' },
  };
  const users = { trpb: admin };
  for (const [username, p] of Object.entries(people)) {
    users[username] = await User.create({ ...p, username, email: `${username}@example.com`, passwordHash: hash });
  }

  /* ---------- taxonomy & players ---------- */
  const cats = Object.fromEntries(
    (await Category.insertMany(data.categories)).map((c) => [c.slug, c])
  );
  const tagDocs = Object.fromEntries(
    (await Tag.insertMany(data.tags.map((name) => ({ name, slug: slugify(name) })))).map((t) => [t.name, t])
  );
  const playerDocs = Object.fromEntries(
    (await Player.insertMany(data.players.map((p) => ({ ...p, slug: slugify(p.name), isSample: true })))).map((p) => [p.name, p])
  );

  /* ---------- articles ---------- */
  const now = Date.now();
  const articleDocs = [];
  for (const [i, a] of data.articles.entries()) {
    const status = a.status || 'published';
    const doc = new Article({
      title: a.title,
      slug: slugify(a.title),
      excerpt: a.excerpt,
      coverImage: a.coverImage,
      author: users[a.author]._id,
      category: cats[a.category]._id,
      tags: a.tags.map((t) => tagDocs[t]._id),
      players: a.players.map((p) => playerDocs[p]._id),
      clubs: a.clubs,
      content: sanitizeArticleHtml(a.content.trim()),
      status,
      featured: Boolean(a.featured),
      tactical: a.tactical,
      publishedAt: status === 'published' ? new Date(now - a.daysAgo * DAY - i * 3600e3) : undefined,
      scheduledFor: status === 'scheduled' ? new Date(now + (a.scheduleInDays || 7) * DAY) : undefined,
      // Sample engagement so trending/analytics have something to show.
      viewCount: status === 'published' ? 180 + ((i * 337) % 900) : 0,
    });
    doc.searchTerms = [
      cats[a.category].name,
      ...a.tags,
      ...a.players.flatMap((p) => [p, playerDocs[p].currentClub]),
      ...a.clubs,
      a.tactical?.formation,
    ]
      .filter(Boolean)
      .join(' ');
    await doc.save();
    articleDocs.push(doc);
  }
  const findArticle = (hint) => articleDocs.find((d) => d.slug.includes(hint));

  /* ---------- engagement ---------- */
  const fans = [users.tomasz, users.amara, users.jules];
  const published = articleDocs.filter((d) => d.status === 'published');
  for (const [i, art] of published.entries()) {
    const likers = fans.slice(0, (i % 3) + 1);
    await Like.insertMany(likers.map((u) => ({ article: art._id, user: u._id })));
    art.likeCount = likers.length;
    if (i % 2 === 0) {
      await Bookmark.create({ article: art._id, user: users.tomasz._id, list: i % 4 === 0 ? 'Tactics to rewatch' : 'Saved' });
      art.bookmarkCount = 1;
    }
    await art.save();
  }

  const created = [];
  for (const c of data.sampleComments) {
    const art = findArticle(c.article);
    const parent = c.replyTo !== undefined ? created[c.replyTo] : null;
    const doc = await Comment.create({
      article: art._id,
      author: users[c.user]._id,
      parent: parent?._id || null,
      body: c.body,
    });
    if (parent) await Comment.updateOne({ _id: parent._id }, { $inc: { replyCount: 1 } });
    await Article.updateOne({ _id: art._id }, { $inc: { commentCount: 1 } });
    created.push(doc);
  }

  /* ---------- polls ---------- */
  for (const p of data.polls) {
    const options = p.options.map((text, i) => ({ text, votes: p.seedVotes[i] || 0 }));
    await Poll.create({
      question: p.question,
      description: p.description ? `${p.description} (Includes sample baseline votes.)` : 'Includes sample baseline votes.',
      options,
      status: p.status || 'open',
      featured: p.featured,
      article: p.articleSlugHint ? findArticle(p.articleSlugHint)?._id : undefined,
      totalVotes: options.reduce((s, o) => s + o.votes, 0),
      createdBy: admin._id,
    });
  }

  /* ---------- ratings ---------- */
  for (const [i, player] of Object.values(playerDocs).entries()) {
    const scores = fans.map((_, j) => 6 + ((i + j) % 4));
    await PlayerRating.insertMany(fans.map((u, j) => ({ player: player._id, user: u._id, score: scores[j] })));
    const avg = scores.reduce((s, n) => s + n, 0) / scores.length;
    await Player.updateOne({ _id: player._id }, { ratingAverage: Math.round(avg * 10) / 10, ratingCount: scores.length });
  }

  await NewsletterSubscriber.create({ email: 'reader@example.com', source: 'seed' });

  console.log('\n[seed] Done.');
  console.log(`  Categories: ${Object.keys(cats).length}  Tags: ${Object.keys(tagDocs).length}  Players: ${Object.keys(playerDocs).length}`);
  console.log(`  Articles:   ${articleDocs.length} (${published.length} published, 1 draft, 1 scheduled)`);
  console.log(`  Admin:      ${env.adminEmail} (password from ADMIN_PASSWORD)`);
  console.log('  Demo users (email / role):');
  for (const [username, p] of Object.entries(people)) console.log(`    ${username}@example.com  ${p.role}`);
  console.log(
    process.env.SEED_USER_PASSWORD
      ? '  Demo user password: value of SEED_USER_PASSWORD'
      : `  Demo user password (random, this run only): ${demoPassword}`
  );
}

main()
  .catch((err) => {
    console.error('[seed] Failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());
