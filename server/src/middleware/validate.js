import { ApiError } from '../utils/ApiError.js';

/**
 * Validate req[source] against a Zod schema. On success, the parsed (and
 * coerced/stripped) value replaces the original so handlers only see clean data.
 */
export const validate = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source] ?? {});
  if (!result.success) {
    const details = result.error.issues.map((i) => ({
      field: i.path.join('.') || source,
      message: i.message,
    }));
    return next(new ApiError(422, details[0]?.message || 'Invalid input.', { details }));
  }
  if (source === 'query') req.validatedQuery = result.data;
  else req[source] = result.data;
  next();
};
