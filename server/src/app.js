import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { env } from './config/env.js';
import apiRoutes from './routes/index.js';
import { notFound, errorHandler } from './middleware/error.js';
import { sitemap, robots } from './controllers/miscController.js';
import { UPLOAD_DIR } from './services/uploadService.js';
import { createSeoRenderer } from './services/seoRenderer.js';
import { publishDueArticles } from './services/scheduler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CLIENT_DIST = path.resolve(__dirname, '../../client/dist');

export function createApp() {
  const app = express();

  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' }, // allow client to load /uploads
      contentSecurityPolicy: false, // the SPA sets its own; API returns JSON
    })
  );
  app.use(
    cors({
      origin(origin, cb) {
        // Same-origin / server-to-server requests have no Origin header.
        if (!origin || env.clientUrls.includes(origin.replace(/\/$/, ''))) return cb(null, true);
        return cb(null, false);
      },
      credentials: true,
    })
  );
  app.use(express.json({ limit: '2mb' }));
  app.use(express.urlencoded({ extended: false }));
  app.use(cookieParser());
  if (!env.isProd) app.use(morgan('dev'));

  // Serverless hosts have no long-running scheduler: publish due articles lazily,
  // at most once a minute per warm instance (plus the daily Vercel cron backup).
  if (process.env.VERCEL) {
    let lastRun = 0;
    app.use('/api', (_req, _res, next) => {
      if (Date.now() - lastRun < 60_000) return next();
      lastRun = Date.now();
      publishDueArticles().catch((e) => console.error('[scheduler]', e.message)).finally(next);
    });
  }

  app.use('/uploads', express.static(UPLOAD_DIR, { maxAge: '30d' }));
  app.get('/sitemap.xml', sitemap);
  app.get('/robots.txt', robots);
  app.use('/api', apiRoutes);
  app.use('/api', notFound);

  // In production, serve the built client with server-injected SEO metadata.
  if (env.isProd && fs.existsSync(path.join(CLIENT_DIST, 'index.html'))) {
    app.use(express.static(CLIENT_DIST, { index: false, maxAge: '7d' }));
    const render = createSeoRenderer(CLIENT_DIST);
    app.get('*', render);
  }

  app.use(notFound);
  app.use(errorHandler);
  return app;
}
