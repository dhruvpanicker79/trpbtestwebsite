import multer from 'multer';
import { env } from '../config/env.js';
import { ApiError } from '../utils/ApiError.js';

export function notFound(req, _res, next) {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found.`));
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, _req, res, _next) {
  let error = err;

  if (err?.name === 'CastError') error = ApiError.notFound('Resource not found.');
  else if (err?.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'value';
    error = ApiError.conflict(`That ${field} is already taken.`);
  } else if (err?.name === 'ValidationError') {
    const details = Object.values(err.errors).map((e) => ({ field: e.path, message: e.message }));
    error = new ApiError(422, details[0]?.message || 'Invalid input.', { details });
  } else if (err instanceof multer.MulterError) {
    error = ApiError.badRequest(
      err.code === 'LIMIT_FILE_SIZE' ? 'That file is too large.' : err.message
    );
  } else if (err?.type === 'entity.parse.failed') {
    error = ApiError.badRequest('Malformed JSON body.');
  } else if (!(err instanceof ApiError)) {
    console.error('[error]', err);
    error = new ApiError(500, env.isProd ? 'Something went wrong.' : err?.message || 'Server error');
  }

  res.status(error.status).json({
    success: false,
    error: {
      message: error.message,
      code: error.code,
      ...(error.details ? { details: error.details } : {}),
    },
  });
}
