import mongoose from 'mongoose';

const tagSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true, lowercase: true },
  color: { type: String, default: '#6366f1' },
  count: { type: Number, default: 0 }
}, {
  timestamps: true
});

tagSchema.index({ userId: 1, name: 1 }, { unique: true });

const Tag = mongoose.model('Tag', tagSchema);
export default Tag;
