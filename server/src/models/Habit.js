import mongoose from 'mongoose';

const habitLogSchema = new mongoose.Schema({
  date: { type: Date, required: true },
  completed: { type: Boolean, default: true },
  notes: { type: String, default: '' }
});

const habitSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  icon: { type: String, default: '✓' },
  color: { type: String, default: '#10b981' },
  frequency: {
    type: String,
    enum: ['daily', 'weekly', 'custom'],
    default: 'daily'
  },
  targetDays: [{ type: Number, min: 0, max: 6 }],
  targetCount: { type: Number, default: 1 },
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  logs: [habitLogSchema],
  isArchived: { type: Boolean, default: false },
  order: { type: Number, default: 0 },
  reminder: { type: Date, default: null }
}, {
  timestamps: true
});

habitSchema.index({ userId: 1, isArchived: 1 });

const Habit = mongoose.model('Habit', habitSchema);
export default Habit;
