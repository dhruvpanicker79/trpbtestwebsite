import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { User } from '../models/index.js';
import { ApiError } from '../utils/ApiError.js';
import { AUTH_COOKIE } from '../utils/cookies.js';

export function signToken(user) {
  return jwt.sign({ sub: String(user._id), role: user.role }, env.jwtSecret, {
    expiresIn: env.jwtExpiresIn,
  });
}

async function resolveUser(req) {
  const token = req.cookies?.[AUTH_COOKIE];
  if (!token) return null;
  try {
    const payload = jwt.verify(token, env.jwtSecret);
    // Always reload: role changes and deletions take effect immediately.
    return await User.findById(payload.sub).lean();
  } catch {
    return null;
  }
}

/** Attach req.user when a valid session exists; never rejects. */
export async function optionalAuth(req, _res, next) {
  try {
    req.user = await resolveUser(req);
    next();
  } catch (err) {
    next(err);
  }
}

export async function requireAuth(req, _res, next) {
  try {
    req.user = req.user ?? (await resolveUser(req));
    if (!req.user) throw ApiError.unauthorized();
    next();
  } catch (err) {
    next(err);
  }
}

const RANK = { USER: 1, EDITOR: 2, ADMIN: 3 };

/** Require at least the given role (ADMIN implies EDITOR implies USER). */
export const requireRole = (minRole) => [
  requireAuth,
  (req, _res, next) => {
    if ((RANK[req.user.role] || 0) < RANK[minRole]) return next(ApiError.forbidden());
    next();
  },
];

export const isAdmin = (user) => user?.role === 'ADMIN';
export const isEditor = (user) => (RANK[user?.role] || 0) >= RANK.EDITOR;
