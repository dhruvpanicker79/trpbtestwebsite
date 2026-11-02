/**
 * Vercel serverless entry point. The whole Express API runs as one function;
 * vercel.json rewrites /api/*, /sitemap.xml and /robots.txt here, and Express
 * sees the original URL. The MongoDB connection is reused across invocations.
 */
import { createApp } from '../server/src/app.js';
import { connectDB } from '../server/src/config/db.js';

const app = createApp();
let connection;

export default async function handler(req, res) {
  try {
    connection ??= connectDB();
    await connection;
  } catch (err) {
    connection = undefined; // retry on the next request
    res.statusCode = 503;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ success: false, error: { message: 'Database unavailable. Check MONGODB_URI.', code: 'DB_UNAVAILABLE' } }));
    return;
  }
  return app(req, res);
}
