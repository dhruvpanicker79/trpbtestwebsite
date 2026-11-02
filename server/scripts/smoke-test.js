/**
 * End-to-end smoke test against a running, freshly seeded API.
 *
 *   npm run seed && npm run dev:server     (in one terminal)
 *   npm run test:smoke                      (in another)
 *
 * Uses ADMIN_EMAIL / ADMIN_PASSWORD from server/.env. Creates throwaway
 * accounts (smoke_<timestamp>) and one test article, then deletes the article.
 */
import 'dotenv/config';

const BASE = process.env.SMOKE_API || `http://localhost:${process.env.PORT || 5000}/api`;
let passed = 0;
let failed = 0;

function client() {
  let cookie = '';
  return async (method, path, body) => {
    const res = await fetch(`${BASE}${path}`, {
      method,
      headers: { ...(body ? { 'Content-Type': 'application/json' } : {}), ...(cookie ? { Cookie: cookie } : {}) },
      body: body ? JSON.stringify(body) : undefined,
    });
    const set = res.headers.get('set-cookie');
    if (set) cookie = set.split(';')[0];
    let json = null;
    try {
      json = await res.json();
    } catch {
      /* ignore */
    }
    return { status: res.status, ...json };
  };
}

async function check(name, fn) {
  try {
    await fn();
    passed += 1;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed += 1;
    console.log(`  ✗ ${name}\n      ${err.message}`);
  }
}

function expect(cond, msg) {
  if (!cond) throw new Error(msg);
}

const stamp = Date.now().toString(36);
const anon = client();
const reader = client();
const reader2 = client();
const editor = client();
const admin = client();
const pw = 'SmokeTest123';

console.log(`TRPB smoke test → ${BASE}\n`);

await check('health endpoint responds', async () => {
  const r = await anon('GET', '/health');
  expect(r.status === 200, `status ${r.status}`);
});

let articles;
await check('public article list is paginated and published-only', async () => {
  const r = await anon('GET', '/articles?limit=3&page=1');
  expect(r.status === 200 && r.data.length === 3, 'expected 3 articles');
  expect(r.meta.total >= 3 && r.meta.pages >= 1, 'missing pagination meta');
  expect(r.data.every((a) => a.status === 'published'), 'non-published article leaked');
  const p2 = await anon('GET', '/articles?limit=3&page=2');
  expect(p2.data.every((a) => !r.data.some((b) => b._id === a._id)), 'page 2 overlaps page 1');
  articles = r.data;
});

await check('drafts and scheduled articles are hidden from the public', async () => {
  const all = await anon('GET', '/articles?limit=50');
  expect(!all.data.some((a) => /^(Draft|Scheduled):/.test(a.title)), 'draft/scheduled in list');
  const d = await anon('GET', '/articles/draft-set-piece-coaches-are-the-new-assistant-managers');
  expect(d.status === 404, `draft returned ${d.status}`);
  const s = await anon('GET', '/search?q=Draft%20set-piece');
  expect(!s.data.articles.some((a) => a.title.startsWith('Draft')), 'draft in search');
});

await check('featured and trending endpoints return articles', async () => {
  const f = await anon('GET', '/articles/featured');
  const t = await anon('GET', '/articles/trending');
  expect(f.data.length > 0 && t.data.length > 0, 'empty');
});

await check('search finds by body text, player and club, with pagination', async () => {
  const a = await anon('GET', '/search?q=groundsman');
  expect(a.data.articles.length >= 1, 'body text not found');
  const b = await anon('GET', '/search?q=Ilarramendi');
  expect(b.data.articles.length >= 1 && b.data.players.length >= 1, 'player not found');
  const c = await anon('GET', '/search?q=Calderbrook&limit=1');
  expect(c.meta.limit === 1 && c.meta.total >= 1, 'pagination meta wrong');
});

await check('registration and login work; password is never returned', async () => {
  const r = await reader('POST', '/auth/register', { name: 'Smoke Reader', username: `smoke_${stamp}`, email: `smoke_${stamp}@example.com`, password: pw });
  expect(r.status === 201 && !r.data.passwordHash, `register ${r.status} ${r.error?.message || ''}`);
  const me = await reader('GET', '/auth/me');
  expect(me.data?.username === `smoke_${stamp}`, 'me mismatch');
  const r2 = await reader2('POST', '/auth/register', { name: 'Smoke Two', username: `smoke2_${stamp}`, email: `smoke2_${stamp}@example.com`, password: pw });
  expect(r2.status === 201, 'second register failed');
  const bad = await anon('POST', '/auth/login', { email: `smoke_${stamp}@example.com`, password: 'wrong-password1' });
  expect(bad.status === 401, 'bad login accepted');
});

await check('validation errors are consistent', async () => {
  const r = await anon('POST', '/auth/register', { name: 'x', username: 'a', email: 'nope', password: 'short' });
  expect(r.status === 422 && r.success === false && r.error.details.length > 0, 'expected 422 with details');
});

await check('anonymous users cannot write', async () => {
  const like = await anon('POST', `/articles/${articles[0]._id}/like`);
  const create = await anon('POST', '/articles', { title: 'Nope', category: articles[0].category._id });
  expect(like.status === 401 && create.status === 401, `got ${like.status}/${create.status}`);
});

await check('regular users cannot use editor or admin endpoints', async () => {
  const c = await reader('POST', '/articles', { title: 'Nope', category: articles[0].category._id });
  const a = await reader('GET', '/admin/users');
  const an = await reader('GET', '/admin/analytics');
  expect(c.status === 403 && a.status === 403 && an.status === 403, `got ${c.status}/${a.status}/${an.status}`);
});

await check('likes and bookmarks persist and toggle', async () => {
  const id = articles[0]._id;
  const before = (await reader('GET', `/articles/${articles[0].slug}`)).data;
  const l1 = await reader('POST', `/articles/${id}/like`);
  expect(l1.data.liked === true && l1.data.likeCount === before.likeCount + 1, 'like failed');
  const after = await reader('GET', `/articles/${articles[0].slug}`);
  expect(after.data.viewer.liked === true, 'like not persisted');
  const l2 = await reader('POST', `/articles/${id}/like`);
  expect(l2.data.liked === false && l2.data.likeCount === before.likeCount, 'unlike failed');
  const b = await reader('POST', `/articles/${id}/bookmark`);
  expect(b.data.bookmarked, 'bookmark failed');
  const list = await reader('GET', '/users/me/bookmarks');
  expect(list.data.some((x) => x.article._id === id), 'bookmark not in list');
});

let commentId;
await check('comments, replies, reports and author-only deletion', async () => {
  const id = articles[0]._id;
  const c = await reader('POST', `/articles/${id}/comments`, { body: 'Smoke test comment.' });
  expect(c.status === 201, `comment ${c.status}`);
  commentId = c.data._id;
  const rep = await reader2('POST', `/comments/${commentId}/replies`, { body: 'Smoke test reply.' });
  expect(rep.status === 201, 'reply failed');
  const report = await reader2('POST', `/comments/${commentId}/report`, { reason: 'test' });
  const dupReport = await reader2('POST', `/comments/${commentId}/report`, { reason: 'test' });
  expect(report.status === 200 && dupReport.status === 409, 'report dedupe failed');
  const steal = await reader2('DELETE', `/comments/${commentId}`);
  expect(steal.status === 403, 'non-author deleted comment');
  const list = await anon('GET', `/articles/${id}/comments`);
  const thread = list.data.find((t) => t._id === commentId);
  expect(thread && thread.replies.length === 1, 'thread missing');
});

await check('one vote per user per poll (duplicate rejected)', async () => {
  const polls = await reader('GET', '/polls?status=open');
  const poll = polls.data[0];
  const v1 = await reader('POST', `/polls/${poll._id}/vote`, { optionId: poll.options[0]._id });
  expect(v1.status === 200 && v1.data.totalVotes === poll.totalVotes + 1, 'vote failed');
  const v2 = await reader('POST', `/polls/${poll._id}/vote`, { optionId: poll.options[1]._id });
  expect(v2.status === 409, `duplicate vote returned ${v2.status}`);
  const after = await reader('GET', `/polls/${poll._id}`);
  expect(after.data.totalVotes === poll.totalVotes + 1 && after.data.userVote === poll.options[0]._id, 'vote not persisted');
});

await check('player ratings: one per user, re-rating updates', async () => {
  const p = (await anon('GET', '/players?limit=1')).data[0];
  const r1 = await reader('POST', `/players/${p._id}/rate`, { score: 9 });
  expect(r1.data.ratingCount === p.ratingCount + 1, 'first rating not counted');
  const r2 = await reader('POST', `/players/${p._id}/rate`, { score: 4 });
  expect(r2.data.ratingCount === p.ratingCount + 1 && r2.data.myRating === 4, 'second rating duplicated');
});

let editorUserId;
await check('admin can promote a user to editor; editor cannot change roles', async () => {
  const login = await admin('POST', '/auth/login', { email: process.env.ADMIN_EMAIL, password: process.env.ADMIN_PASSWORD });
  expect(login.status === 200 && login.data.role === 'ADMIN', 'admin login failed — check ADMIN_EMAIL/ADMIN_PASSWORD');
  const reg = await editor('POST', '/auth/register', { name: 'Smoke Editor', username: `smoked_${stamp}`, email: `smoked_${stamp}@example.com`, password: pw });
  editorUserId = reg.data._id;
  const promote = await admin('PATCH', `/admin/users/${editorUserId}/role`, { role: 'EDITOR' });
  expect(promote.status === 200 && promote.data.role === 'EDITOR', 'promotion failed');
  const escalate = await editor('PATCH', `/admin/users/${editorUserId}/role`, { role: 'ADMIN' });
  expect(escalate.status === 403, 'editor escalated own role');
});

let draftId;
let draftSlug;
await check('editor creates a draft that stays private, then publishes it', async () => {
  const cat = articles[0].category._id;
  const d = await editor('POST', '/articles', { title: `Smoke draft ${stamp}`, category: cat, content: '<p>Hello <script>alert(1)</script> world</p>', status: 'draft', featured: true });
  expect(d.status === 201, `create ${d.status} ${d.error?.message || ''}`);
  expect(!d.data.content.includes('<script'), 'HTML not sanitised');
  expect(d.data.featured === false, 'editor was able to feature');
  draftId = d.data._id;
  draftSlug = d.data.slug;
  const pub = await anon('GET', `/articles/${draftSlug}`);
  expect(pub.status === 404, 'draft visible to public');
  const own = await editor('GET', `/articles/${draftSlug}`);
  expect(own.status === 200 && own.data.isPreview, 'author cannot preview own draft');
  const p = await editor('PATCH', `/articles/${draftId}`, { status: 'published', excerpt: 'Smoke' });
  expect(p.data.status === 'published', 'publish failed');
  const vis = await anon('GET', `/articles/${draftSlug}`);
  expect(vis.status === 200, 'published article not visible');
});

await check("editors cannot edit or delete other people's articles", async () => {
  const r = await editor('PATCH', `/articles/${articles[0]._id}`, { title: 'Hijacked title' });
  const d = await editor('DELETE', `/articles/${articles[0]._id}`);
  expect(r.status === 403 && d.status === 403, `got ${r.status}/${d.status}`);
});

await check('scheduling requires a future date', async () => {
  const r = await editor('PATCH', `/articles/${draftId}`, { status: 'scheduled', scheduledFor: new Date(Date.now() - 1000).toISOString() });
  expect(r.status === 400, `got ${r.status}`);
});

await check('admin analytics and moderation use real data', async () => {
  const a = await admin('GET', '/admin/analytics');
  expect(a.data.cards.totalArticles > 0 && a.data.cards.users > 0, 'empty analytics');
  const m = await admin('GET', '/admin/comments?filter=reported');
  expect(m.data.some((c) => c._id === commentId), 'reported comment missing from queue');
  const hide = await admin('PATCH', `/admin/comments/${commentId}`, { status: 'hidden' });
  expect(hide.status === 200, 'hide failed');
});

await check('cleanup: editor deletes own test article', async () => {
  const r = await editor('DELETE', `/articles/${draftId}`);
  expect(r.status === 200, `got ${r.status}`);
});

await check('logout clears the session', async () => {
  await reader('POST', '/auth/logout');
  const me = await reader('GET', '/auth/me');
  expect(me.data === null, 'still logged in');
});

console.log(`\n${passed} passed, ${failed} failed`);
process.exit(failed ? 1 : 0);
