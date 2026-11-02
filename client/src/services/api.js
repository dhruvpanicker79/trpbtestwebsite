const BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, { status, code, details } = {}) {
    super(message);
    this.status = status;
    this.code = code;
    this.details = details || [];
  }

  /** Map server validation details to { field: message } for forms. */
  get fieldErrors() {
    return Object.fromEntries(this.details.map((d) => [d.field, d.message]));
  }
}

function toQuery(params) {
  if (!params) return '';
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') qs.set(k, v);
  }
  const s = qs.toString();
  return s ? `?${s}` : '';
}

/**
 * Single request helper. Always sends cookies, unwraps the
 * { success, data, meta } envelope and throws ApiError on failure.
 */
export async function request(method, path, { body, params, signal } = {}) {
  const isForm = body instanceof FormData;
  let res;
  try {
    res = await fetch(`${BASE}${path}${toQuery(params)}`, {
      method,
      credentials: 'include',
      signal,
      headers: body && !isForm ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? (isForm ? body : JSON.stringify(body)) : undefined,
    });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiError('Network error — check your connection and try again.', { status: 0 });
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    /* empty or non-JSON body */
  }

  if (!res.ok || json?.success === false) {
    const e = json?.error || {};
    throw new ApiError(e.message || `Request failed (${res.status})`, {
      status: res.status,
      code: e.code,
      details: e.details,
    });
  }
  return { data: json?.data, meta: json?.meta };
}

export const api = {
  get: (path, params, opts) => request('GET', path, { params, ...opts }),
  post: (path, body) => request('POST', path, { body }),
  patch: (path, body) => request('PATCH', path, { body }),
  del: (path) => request('DELETE', path),
};
