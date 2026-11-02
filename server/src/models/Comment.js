import mongoose from 'mongoose';

export const COMMENT_STATUSES = ['visible', 'hidden', 'removed'];

const reportSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    reason: { type: String, default: '', maxlength: 200 },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const commentSchema = new mongoose.Schema(
  {
    article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article', required: true },
    author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null },
    body: { type: String, required: true, maxlength: 2000 },
    status: { type: String, enum: COMMENT_STATUSES, default: 'visible' },
    replyCount: { type: Number, default: 0 },
    reports: { type: [reportSchema], default: [], select: false },
    reportCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

commentSchema.index({ article: 1, parent: 1, createdAt: -1 });
commentSchema.index({ reportCount: -1, createdAt: -1 });
commentSchema.index({ author: 1, createdAt: -1 });

export const Comment = mongoose.model('Comment', commentSchema);
