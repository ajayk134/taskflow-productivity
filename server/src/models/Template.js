import mongoose from 'mongoose';

const templateItemSchema = new mongoose.Schema({
  title: { type: String, required: true },
  priority: { type: Number, enum: [1, 2, 3, 4], default: 3 },
  estimatedDuration: { type: Number, default: 0 },
  subtasks: [{
    title: { type: String, required: true }
  }],
  checklist: [{
    text: { type: String, required: true }
  }]
});

const templateSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  icon: { type: String, default: '📋' },
  items: [templateItemSchema],
  tags: [{ type: String }],
  category: { type: String, default: '' },
  isFavorite: { type: Boolean, default: false }
}, {
  timestamps: true
});

templateSchema.index({ userId: 1 });

const Template = mongoose.model('Template', templateSchema);
export default Template;
