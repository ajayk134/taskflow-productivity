import mongoose from 'mongoose';

const subtaskSchema = new mongoose.Schema({
  title: { type: String, required: true },
  completed: { type: Boolean, default: false },
  completedAt: Date,
  createdAt: { type: Date, default: Date.now }
});

const checklistSchema = new mongoose.Schema({
  text: { type: String, required: true },
  checked: { type: Boolean, default: false },
  order: { type: Number, default: 0 }
});

const todoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  notes: { type: String, default: '' },
  priority: { type: Number, enum: [1, 2, 3, 4], default: 3 },
  status: {
    type: String,
    enum: ['inbox', 'planned', 'next', 'in-progress', 'waiting', 'blocked', 'completed', 'archived'],
    default: 'inbox',
    index: true
  },
  category: { type: String, default: '' },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null, index: true },
  sectionId: { type: mongoose.Schema.Types.ObjectId, default: null },
  tags: [{ type: String, lowercase: true, trim: true }],
  dueDate: { type: Date, default: null, index: true },
  dueTime: { type: String, default: '' },
  reminder: { type: Date, default: null },
  recurrence: {
    type: { type: String, enum: ['none', 'daily', 'weekdays', 'weekly', 'monthly', 'yearly', 'custom'], default: 'none' },
    interval: { type: Number, default: 1 },
    daysOfWeek: [{ type: Number, min: 0, max: 6 }],
    dayOfMonth: { type: Number, min: 1, max: 31 },
    endAfter: { type: Date, default: null }
  },
  estimatedDuration: { type: Number, default: 0 },
  actualDuration: { type: Number, default: 0 },
  location: { type: String, default: '' },
  links: [{ type: String }],
  subtasks: [subtaskSchema],
  checklist: [checklistSchema],
  dependencies: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Todo' }],
  isImportant: { type: Boolean, default: false, index: true },
  isPinned: { type: Boolean, default: false },
  isFavorite: { type: Boolean, default: false },
  isMyDay: { type: Boolean, default: false, index: true },
  myDayOrder: { type: Number, default: 0 },
  completedAt: { type: Date, default: null },
  archivedAt: { type: Date, default: null },
  deletedAt: { type: Date, default: null, index: true },
  order: { type: Number, default: 0 },
  templateId: { type: mongoose.Schema.Types.ObjectId, ref: 'Template', default: null }
}, {
  timestamps: true
});

// Indexes for performance
todoSchema.index({ userId: 1, status: 1 });
todoSchema.index({ userId: 1, projectId: 1 });
todoSchema.index({ userId: 1, dueDate: 1 });
todoSchema.index({ userId: 1, tags: 1 });
todoSchema.index({ userId: 1, isMyDay: 1, myDayOrder: 1 });
todoSchema.index({ userId: 1, deletedAt: 1 });
todoSchema.index({ userId: 1, isImportant: 1 });
todoSchema.index({ userId: 1, isPinned: 1 });
todoSchema.index({ title: 'text', description: 'text', notes: 'text' });

// Virtual for subtask progress
todoSchema.virtual('subtaskProgress').get(function() {
  if (!this.subtasks || this.subtasks.length === 0) return null;
  const completed = this.subtasks.filter(s => s.completed).length;
  return { completed, total: this.subtasks.length };
});

// Virtual for checklist progress
todoSchema.virtual('checklistProgress').get(function() {
  if (!this.checklist || this.checklist.length === 0) return null;
  const checked = this.checklist.filter(c => c.checked).length;
  return { checked, total: this.checklist.length };
});

todoSchema.set('toJSON', { virtuals: true });
todoSchema.set('toObject', { virtuals: true });

const Todo = mongoose.model('Todo', todoSchema);
export default Todo;
