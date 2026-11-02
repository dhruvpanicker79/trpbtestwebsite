import mongoose from 'mongoose';

const timelineSchema = new mongoose.Schema({
  club: { type: String, required: true, trim: true, maxlength: 80 },
  from: { type: String, required: true, maxlength: 12 }, // e.g. "2014" or "2014/15"
  to: { type: String, default: '', maxlength: 12 }, // empty = present
  note: { type: String, default: '', maxlength: 300 },
  loan: { type: Boolean, default: false },
});

const achievementSchema = new mongoose.Schema({
  title: { type: String, required: true, maxlength: 120 },
  year: { type: String, default: '', maxlength: 12 },
  detail: { type: String, default: '', maxlength: 300 },
});

const playerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    slug: { type: String, required: true, unique: true, lowercase: true },
    portrait: { type: String, default: '' },
    nationality: { type: String, default: '', maxlength: 60 },
    position: { type: String, default: '', maxlength: 40 },
    currentClub: { type: String, default: '', maxlength: 80 },
    born: { type: String, default: '', maxlength: 40 },
    preferredFoot: { type: String, enum: ['Left', 'Right', 'Both', ''], default: '' },
    summary: { type: String, default: '', maxlength: 3000 },
    timeline: { type: [timelineSchema], default: [] },
    achievements: { type: [achievementSchema], default: [] },
    isSample: { type: Boolean, default: false },
    ratingAverage: { type: Number, default: 0 },
    ratingCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

playerSchema.index({ name: 'text', currentClub: 'text', nationality: 'text' });

export const Player = mongoose.model('Player', playerSchema);
