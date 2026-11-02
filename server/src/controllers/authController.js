import { User } from '../models/index.js';
import { signToken } from '../middleware/auth.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler, ok, created } from '../utils/http.js';
import { setAuthCookie, clearAuthCookie } from '../utils/cookies.js';

const publicUser = (u) => {
  const obj = typeof u.toJSON === 'function' ? u.toJSON() : { ...u };
  delete obj.passwordHash;
  delete obj.__v;
  return obj;
};

export const register = asyncHandler(async (req, res) => {
  const { name, username, email, password } = req.body;
  const clash = await User.findOne({ $or: [{ email }, { username }] }).select('email username').lean();
  if (clash) {
    throw ApiError.conflict(
      clash.email === email ? 'An account with that email already exists.' : 'That username is taken.'
    );
  }
  const user = await User.create({
    name,
    username,
    email,
    passwordHash: await User.hashPassword(password),
  });
  setAuthCookie(res, signToken(user));
  created(res, publicUser(user));
});

export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  // Accept either email or username in the "email" field.
  const user = await User.findOne(email.includes('@') ? { email } : { username: email }).select(
    '+passwordHash'
  );
  // Same message for unknown user and wrong password — do not leak which.
  if (!user || !(await user.comparePassword(password))) {
    throw ApiError.unauthorized('Incorrect email or password.');
  }
  setAuthCookie(res, signToken(user));
  ok(res, publicUser(user));
});

export const logout = asyncHandler(async (_req, res) => {
  clearAuthCookie(res);
  ok(res, { loggedOut: true });
});

export const me = asyncHandler(async (req, res) => {
  ok(res, req.user ? publicUser(req.user) : null);
});
