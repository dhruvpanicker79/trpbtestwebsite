import mongoose from 'mongoose';

const optionSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true, maxlength: 120 },
  votes: { type: Number, default: 0 },
});

const pollSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true, maxlength: 200 },
    description: { type: String, default: '', maxlength: 600 },
    options: {
      type: [optionSchema],
      validate: [(v) => v.length >= 2 && v.length <= 8, 'A poll needs 2–8 options.'],
    },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    closesAt: { type: Date },
    featured: { type: Boolean, default: false },
    article: { type: mongoose.Schema.Types.ObjectId, ref: 'Article' },
    totalVotes: { type: Number, default: 0 },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

pollSchema.index({ status: 1, createdAt: -1 });

pollSchema.methods.isOpen = function isOpen() {
  return this.status === 'open' && (!this.closesAt || this.closesAt > new Date());
};

export const Poll = mongoose.model('Poll', pollSchema);

/** One document per (poll, user). The unique index is the duplicate-vote guard. */
const pollVoteSchema = new mongoose.Schema(
  {
    poll: { type: mongoose.Schema.Types.ObjectId, ref: 'Poll', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    option: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: true }
);
pollVoteSchema.index({ poll: 1, user: 1 }, { unique: true });

export const PollVote = mongoose.model('PollVote', pollVoteSchema);
