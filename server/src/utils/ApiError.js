export class ApiError extends Error {
  constructor(status, message, { code, details } = {}) {
    super(message);
    this.status = status;
    this.code = code || defaultCode(status);
    this.details = details;
  }

  static badRequest(msg = 'Bad request', details) {
    return new ApiError(400, msg, { details });
  }
  static unauthorized(msg = 'Please sign in to continue.') {
    return new ApiError(401, msg);
  }
  static forbidden(msg = 'You do not have permission to do that.') {
    return new ApiError(403, msg);
  }
  static notFound(msg = 'Not found.') {
    return new ApiError(404, msg);
  }
  static conflict(msg = 'Conflict.') {
    return new ApiError(409, msg);
  }
}

function defaultCode(status) {
  return (
    {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'RATE_LIMITED',
    }[status] || 'SERVER_ERROR'
  );
}
