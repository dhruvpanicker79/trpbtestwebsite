import { env } from '../config/env.js';

export const AUTH_COOKIE = 'trpb_token';

const SEVEN_DAYS = 7 * 24 * 60 * 60 * 1000;

export function authCookieOptions() {
  return {
    httpOnly: true,
    secure: env.cookieSecure || env.cookieSameSite === 'none',
    sameSite: env.cookieSameSite,
    path: '/',
    maxAge: SEVEN_DAYS,
  };
}

export function setAuthCookie(res, token) {
  res.cookie(AUTH_COOKIE, token, authCookieOptions());
}

export function clearAuthCookie(res) {
  const { maxAge, ...opts } = authCookieOptions();
  res.clearCookie(AUTH_COOKIE, opts);
}
