import mongoose from 'mongoose';

const { ObjectId } = mongoose.Schema.Types;

/** Article likes — unique per (article, user). */
const likeSchema = new mongoose.Schema(
  {
    article: { type: ObjectId, ref: 'Article', required: true },
    user: { type: ObjectId, ref: 'User', required: true },
  },
  { timestamps: true }
);
likeSchema.index({ article: 1, user: 1 }, { unique: true });
likeSchema.index({ createdAt: -1 });
export const Like = mongoose.model('Like', likeSchema);

/** Bookmarks — unique per (user, article), grouped into named reading lists. */
const bookmarkSchema = new mongoose.Schema(
  {
    user: { type: ObjectId, ref: 'User', required: true },
    article: { type: ObjectId, ref: 'Article', required: true },
    list: { type: String, default: 'Saved', trim: true, maxlength: 40 },
  },
  { timestamps: true }
);
bookmarkSchema.index({ user: 1, article: 1 }, { unique: true });
bookmarkSchema.index({ user: 1, createdAt: -1 });
export const Bookmark = mongoose.model('Bookmark', bookmarkSchema);

/** Player ratings — unique per (player, user). */
const playerRatingSchema = new mongoose.Schema(
  {
    player: { type: ObjectId, ref: 'Player', required: true },
    user: { type: ObjectId, ref: 'User', required: true },
    score: { type: Number, required: true, min: 1, max: 10 },
  },
  { timestamps: true }
);
playerRatingSchema.index({ player: 1, user: 1 }, { unique: true });
export const PlayerRating = mongoose.model('PlayerRating', playerRatingSchema);

const subscriberSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    status: { type: String, enum: ['subscribed', 'unsubscribed'], default: 'subscribed' },
    source: { type: String, default: 'website', maxlength: 40 },
  },
  { timestamps: true }
);
export const NewsletterSubscriber = mongoose.model('NewsletterSubscriber', subscriberSchema);
