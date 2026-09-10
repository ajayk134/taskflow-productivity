import mongoose from 'mongoose';

const sectionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  order: { type: Number, default: 0 },
  color: { type: String, default: '' }
});

const projectSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '📁' },
  color: { type: String, default: '#6366f1' },
  status: {
    type: String,
    enum: ['active', 'on-hold', 'completed', 'archived'],
    default: 'active',
    index: true
  },
  startDate: { type: Date, default: null },
  targetDate: { type: Date, default: null },
  sections: [sectionSchema],
  isFavorite: { type: Boolean, default: false },
  archivedAt: { type: Date, default: null },
  deletedAt: { type: Date, default: null, index: true },
  order: { type: Number, default: 0 }
}, {
  timestamps: true
});

projectSchema.index({ userId: 1, status: 1 });
projectSchema.index({ userId: 1, isFavorite: 1 });

projectSchema.virtual('progress', {
  ref: 'Todo',
  localField: '_id',
  foreignField: 'projectId',
  count: true,
  match: { status: 'completed', deletedAt: null }
});

projectSchema.set('toJSON', { virtuals: true });
projectSchema.set('toObject', { virtuals: true });

const Project = mongoose.model('Project', projectSchema);
export default Project;
