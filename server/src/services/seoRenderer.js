import fs from 'node:fs';
import path from 'node:path';
import { Article, Player, Category, PUBLIC_FILTER } from '../models/index.js';
import { env } from '../config/env.js';

/**
 * Production-only: inject page-specific <title>, description, canonical and
 * Open Graph tags into the built index.html so link-preview bots and crawlers
 * that don't run JavaScript still see real metadata for articles, players and
 * categories. The React app takes over in the browser as usual.
 */
const esc = (s = '') =>
  String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

const DEFAULT_META = {
  title: "The Ronin's Playbook — Football, Beyond The 90.",
  description:
    'Independent football writing: tactical analysis, player files, match analysis and football culture from The Ronin’s Playbook.',
  image: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=1200&h=630&q=80',
  type: 'website',
};

async function metaFor(urlPath) {
  let m;
  if ((m = urlPath.match(/^\/article\/([a-z0-9-]+)\/?$/))) {
    const a = await Article.findOne({ slug: m[1], ...PUBLIC_FILTER() })
      .select('title excerpt coverImage seo publishedAt')
      .lean();
    if (a) {
      return {
        title: `${a.seo?.metaTitle || a.title} — TRPB`,
        description: a.seo?.metaDescription || a.excerpt,
        image: a.coverImage?.url,
        type: 'article',
        publishedTime: a.publishedAt?.toISOString(),
      };
    }
  } else if ((m = urlPath.match(/^\/players\/([a-z0-9-]+)\/?$/))) {
    const p = await Player.findOne({ slug: m[1] }).select('name summary portrait position currentClub').lean();
    if (p) {
      return {
        title: `${p.name} — Player File — TRPB`,
        description: p.summary?.slice(0, 160) || `${p.name}, ${p.position}, ${p.currentClub}.`,
        image: p.portrait,
        type: 'profile',
      };
    }
  } else if ((m = urlPath.match(/^\/category\/([a-z0-9-]+)\/?$/))) {
    const c = await Category.findOne({ slug: m[1] }).select('name description').lean();
    if (c) return { title: `${c.name} — TRPB`, description: c.description, type: 'website' };
  }
  return null;
}

export function createSeoRenderer(distDir) {
  const indexPath = path.join(distDir, 'index.html');
  const template = fs.readFileSync(indexPath, 'utf8');

  return async function render(req, res, next) {
    try {
      const found = await metaFor(req.path);
      const meta = { ...DEFAULT_META, ...(found || {}) };
      const canonical = `${env.clientUrl}${req.path === '/' ? '/' : req.path.replace(/\/$/, '')}`;
      const image = meta.image?.startsWith('http') ? meta.image : `${env.clientUrl}${meta.image || ''}`;

      const tags = [
        `<title>${esc(meta.title)}</title>`,
        `<meta name="description" content="${esc(meta.description)}" />`,
        `<link rel="canonical" href="${esc(canonical)}" />`,
        `<meta property="og:site_name" content="The Ronin's Playbook" />`,
        `<meta property="og:title" content="${esc(meta.title)}" />`,
        `<meta property="og:description" content="${esc(meta.description)}" />`,
        `<meta property="og:type" content="${esc(meta.type)}" />`,
        `<meta property="og:url" content="${esc(canonical)}" />`,
        `<meta property="og:image" content="${esc(image)}" />`,
        `<meta name="twitter:card" content="summary_large_image" />`,
        meta.publishedTime ? `<meta property="article:published_time" content="${meta.publishedTime}" />` : '',
      ].join('\n    ');

      const html = template.replace(/<!--seo-start-->[\s\S]*?<!--seo-end-->/, `<!--seo-start-->\n    ${tags}\n    <!--seo-end-->`);
      // The SPA decides what to render for unknown paths (its own 404 page).
      res.type('html').send(html);
    } catch (err) {
      next(err);
    }
  };
}
