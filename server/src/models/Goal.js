import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema({
  name: { type: String, required: true },
  targetDate: { type: Date, default: null },
  completed: { type: Boolean, default: false },
  completedAt: { type: Date, default: null },
  order: { type: Number, default: 0 }
});

const goalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  color: { type: String, default: '#f59e0b' },
  icon: { type: String, default: '🎯' },
  targetDate: { type: Date, default: null },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  status: {
    type: String,
    enum: ['active', 'completed', 'paused', 'abandoned'],
    default: 'active'
  },
  milestones: [milestoneSchema],
  linkedTasks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Todo' }],
  category: { type: String, default: '' },
  deletedAt: { type: Date, default: null, index: true }
}, {
  timestamps: true
});

goalSchema.index({ userId: 1, status: 1 });

const Goal = mongoose.model('Goal', goalSchema);
export default Goal;
