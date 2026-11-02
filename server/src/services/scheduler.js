import { Article } from '../models/index.js';
import { env } from '../config/env.js';

/**
 * Promote scheduled articles whose time has arrived. Runs inside the API
 * process, so it only fires while the server is running — on serverless
 * hosts, call `publishDueArticles` from a cron job instead.
 */
export async function publishDueArticles(now = new Date()) {
  const result = await Article.updateMany(
    { status: 'scheduled', scheduledFor: { $lte: now } },
    [{ $set: { status: 'published', publishedAt: '$scheduledFor', scheduledFor: null } }]
  );
  if (result.modifiedCount) {
    console.log(`[scheduler] Published ${result.modifiedCount} scheduled article(s).`);
  }
  return result.modifiedCount;
}

export function startScheduler() {
  const tick = () => publishDueArticles().catch((e) => console.error('[scheduler]', e.message));
  tick();
  const timer = setInterval(tick, env.schedulerIntervalMs);
  timer.unref();
  return timer;
}
