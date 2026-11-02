import mongoose from 'mongoose';
import { htmlToText, readingTimeMinutes } from '../utils/content.js';

export const ARTICLE_STATUSES = ['draft', 'scheduled', 'published'];

const imageSchema = new mongoose.Schema(
  {
    url: { type: String, default: '' },
    alt: { type: String, default: '', maxlength: 200 },
    caption: { type: String, default: '', maxlength: 300 },
    credit: { type: String, default: '', maxlength: 120 },
  },
  { _id: false }
);

const roleSchema = new mongoose.Schema(
  {
    position: { type: String, required: true, maxlength: 20 },
    role: { type: String, required: true, maxlength: 60 },
    description: { type: String, default: '', maxlength: 500 },
  },
  { _id: false }
);

/** Optional structured block for Tactical Room pieces. */
const tacticalSchema = new mongoose.Schema(
  {
    formation: { type: String, default: '', maxlength: 20 },
    inPossession: { type: String, default: '', maxlength: 20 },
    outOfPossession: { type: String, default: '', maxlength: 20 },
    summary: { type: String, default: '', maxlength: 1200 },
    roles: { type: [roleSchema], default: [] },
    boards: { type: [imageSchema], default: [] },
  },
  { _id: false }
);

const articleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 160 },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, default: '', maxlength: 400 },
    coverImage: { type: imageSchema, default: () => ({}) },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
    tags: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tag' }],
    players: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Player' }],
    clubs: [{ type: String, trim: true, maxlength: 60 }],
    content: { type: String, default: '' },
    contentText: { type: String, default: '', select: false },
    searchTerms: { type: String, default: '', select: false },
    readingTime: { type: Number, default: 1 },
    status: { type: String, enum: ARTICLE_STATUSES, default: 'draft' },
    publishedAt: { type: Date },
    scheduledFor: { type: Date },
    featured: { type: Boolean, default: false },
    tactical: { type: tacticalSchema, default: undefined },
    seo: {
      metaTitle: { type: String, default: '', maxlength: 70 },
      metaDescription: { type: String, default: '', maxlength: 170 },
    },
    viewCount: { type: Number, default: 0 },
    likeCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    bookmarkCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

articleSchema.index({ status: 1, publishedAt: -1 });
articleSchema.index({ category: 1, status: 1, publishedAt: -1 });
articleSchema.index({ tags: 1, status: 1 });
articleSchema.index({ players: 1, status: 1 });
articleSchema.index({ featured: 1, status: 1, publishedAt: -1 });
articleSchema.index({ status: 1, scheduledFor: 1 });
articleSchema.index(
  { title: 'text', excerpt: 'text', searchTerms: 'text', contentText: 'text' },
  { weights: { title: 10, excerpt: 5, searchTerms: 5, contentText: 1 }, name: 'article_text' }
);

articleSchema.pre('validate', function derive(next) {
  if (this.isModified('content')) {
    this.contentText = htmlToText(this.content);
    this.readingTime = readingTimeMinutes(this.contentText);
  }
  if (this.status === 'published' && !this.publishedAt) this.publishedAt = new Date();
  next();
});

/** Filter that public endpoints must always apply. */
export const PUBLIC_FILTER = () => ({ status: 'published', publishedAt: { $lte: new Date() } });

export const Article = mongoose.model('Article', articleSchema);
