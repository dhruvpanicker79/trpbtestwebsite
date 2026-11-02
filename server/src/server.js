import { env } from './config/env.js';
import { connectDB } from './config/db.js';
import { createApp } from './app.js';
import { startScheduler } from './services/scheduler.js';

async function main() {
  await connectDB();
  const app = createApp();
  const server = app.listen(env.port, () => {
    console.log(`[api] TRPB API listening on http://localhost:${env.port} (${env.nodeEnv})`);
    console.log(`[api] Image uploads: ${env.cloudinaryEnabled ? 'Cloudinary' : 'local disk (server/uploads)'}`);
  });
  startScheduler();

  const shutdown = (signal) => {
    console.log(`[api] ${signal} received — shutting down.`);
    server.close(() => process.exit(0));
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

main().catch(() => {
  console.error('[api] Startup failed. Is MongoDB running and MONGODB_URI correct?');
  process.exit(1);
});
