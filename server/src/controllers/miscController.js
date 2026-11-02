import { NewsletterSubscriber, Article, Category, Player, PUBLIC_FILTER } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok, created } from '../utils/http.js';
import { storeImage } from '../services/uploadService.js';
import { env } from '../config/env.js';

/**
 * Stores the address only. No email is sent — wire up a provider
 * (e.g. Resend, Mailchimp) to actually deliver newsletters.
 */
export const subscribe = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const existing = await NewsletterSubscriber.findOne({ email });
  if (existing?.status === 'subscribed') {
    return ok(res, { email, alreadySubscribed: true });
  }
  if (existing) {
    existing.status = 'subscribed';
    await existing.save();
  } else {
    await NewsletterSubscriber.create({ email });
  }
  created(res, { email, alreadySubscribed: false });
});

export const uploadImage = (folder) =>
  asyncHandler(async (req, res) => {
    if (!req.file) throw ApiError.badRequest('Choose an image to upload (field name "image").');
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const stored = await storeImage(req.file, { folder: `trpb/${folder}`, baseUrl });
    created(res, stored);
  });

export const uploadStatus = (_req, res) =>
  ok(res, { provider: env.cloudinaryEnabled ? 'cloudinary' : 'local' });

/* ---------- SEO ---------- */

const xmlEscape = (s) =>
  String(s).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]);

export const sitemap = asyncHandler(async (_req, res) => {
  const site = env.clientUrl;
  const [articles, categories, players] = await Promise.all([
    Article.find(PUBLIC_FILTER()).select('slug updatedAt').sort({ publishedAt: -1 }).limit(5000).lean(),
    Category.find().select('slug updatedAt').lean(),
    Player.find().select('slug updatedAt').lean(),
  ]);
  const urls = [
    { loc: `${site}/`, priority: '1.0', changefreq: 'daily' },
    { loc: `${site}/players`, priority: '0.6', changefreq: 'weekly' },
    { loc: `${site}/polls`, priority: '0.5', changefreq: 'daily' },
    ...categories.map((c) => ({ loc: `${site}/category/${c.slug}`, lastmod: c.updatedAt, priority: '0.7' })),
    ...articles.map((a) => ({ loc: `${site}/article/${a.slug}`, lastmod: a.updatedAt, priority: '0.8' })),
    ...players.map((p) => ({ loc: `${site}/players/${p.slug}`, lastmod: p.updatedAt, priority: '0.6' })),
  ];
  const body = urls
    .map(
      (u) =>
        `  <url><loc>${xmlEscape(u.loc)}</loc>${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString()}</lastmod>` : ''}${u.changefreq ? `<changefreq>${u.changefreq}</changefreq>` : ''}<priority>${u.priority}</priority></url>`
    )
    .join('\n');
  res
    .type('application/xml')
    .send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`);
});

export const robots = (_req, res) => {
  res
    .type('text/plain')
    .send(
      ['User-agent: *', 'Allow: /', 'Disallow: /dashboard', 'Disallow: /account', 'Disallow: /api/', '', `Sitemap: ${env.clientUrl}/sitemap.xml`, ''].join('\n')
    );
};
