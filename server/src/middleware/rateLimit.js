import rateLimit from 'express-rate-limit';

const handler = (_req, res) =>
  res.status(429).json({
    success: false,
    error: { message: 'Too many requests — slow down and try again shortly.', code: 'RATE_LIMITED' },
  });

const base = { standardHeaders: 'draft-7', legacyHeaders: false, handler };

/** Login / register: 20 attempts per 15 minutes per IP. */
export const authLimiter = rateLimit({ ...base, windowMs: 15 * 60 * 1000, limit: 20 });

/** Public writes (comments, likes, votes, ratings, newsletter, reports). */
export const writeLimiter = rateLimit({ ...base, windowMs: 60 * 1000, limit: 40 });

/** View counting — generous but bounded. */
export const viewLimiter = rateLimit({ ...base, windowMs: 60 * 1000, limit: 120 });
