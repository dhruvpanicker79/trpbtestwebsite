import 'dotenv/config';

const isProd = process.env.NODE_ENV === 'production';

function read(name, fallback) {
  const value = process.env[name];
  return value === undefined || value === '' ? fallback : value;
}

let jwtSecret = read('JWT_SECRET');
if (!jwtSecret) {
  if (isProd) throw new Error('JWT_SECRET must be set in production.');
  jwtSecret = 'trpb-dev-only-secret-change-me';
  console.warn('[env] JWT_SECRET not set — using an insecure development secret.');
}

export const env = {
  isProd,
  nodeEnv: read('NODE_ENV', 'development'),
  port: Number(read('PORT', 5000)),
  mongoUri: read('MONGODB_URI', 'mongodb://127.0.0.1:27017/trpb'),
  jwtSecret,
  jwtExpiresIn: read('JWT_EXPIRES_IN', '7d'),
  // Comma-separated list of allowed browser origins.
  clientUrls: read('CLIENT_URL', 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean),
  // "lax" works when client and API share a site (same domain or Vite proxy).
  // Use "none" when the client and API live on different sites (requires HTTPS).
  cookieSameSite: read('COOKIE_SAMESITE', 'lax'),
  cookieSecure: read('COOKIE_SECURE', isProd ? 'true' : 'false') === 'true',
  adminEmail: read('ADMIN_EMAIL'),
  adminPassword: read('ADMIN_PASSWORD'),
  cloudinary: {
    cloudName: read('CLOUDINARY_CLOUD_NAME'),
    apiKey: read('CLOUDINARY_API_KEY'),
    apiSecret: read('CLOUDINARY_API_SECRET'),
  },
  schedulerIntervalMs: Number(read('SCHEDULER_INTERVAL_MS', 60_000)),
};

env.clientUrl = env.clientUrls[0];
env.cloudinaryEnabled = Boolean(
  env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret
);
