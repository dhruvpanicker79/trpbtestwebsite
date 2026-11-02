import mongoose from 'mongoose';
import { ApiError } from './ApiError.js';

/** Wrap async route handlers so rejected promises reach the error middleware. */
export const asyncHandler = (fn) => (req, res, next) =>
  Promise.resolve(fn(req, res, next)).catch(next);

/** Consistent success envelope: { success, data, meta? } */
export function ok(res, data, meta, status = 200) {
  const body = { success: true, data };
  if (meta) body.meta = meta;
  return res.status(status).json(body);
}

export const created = (res, data) => ok(res, data, undefined, 201);

/** Parse ?page & ?limit with sane defaults and caps. */
export function getPagination(query, { defaultLimit = 12, maxLimit = 50 } = {}) {
  const page = Math.max(1, parseInt(query.page, 10) || 1);
  const limit = Math.min(maxLimit, Math.max(1, parseInt(query.limit, 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
}

export function pageMeta({ page, limit }, total) {
  const pages = Math.max(1, Math.ceil(total / limit));
  return { page, limit, total, pages, hasMore: page < pages };
}

export function assertObjectId(id, label = 'Resource') {
  if (!mongoose.isValidObjectId(id)) throw ApiError.notFound(`${label} not found.`);
}

export function escapeRegex(str = '') {
  return String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
