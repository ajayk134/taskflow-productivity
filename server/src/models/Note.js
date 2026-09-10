import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true },
  content: { type: String, default: '' },
  projectId: { type: mongoose.Schema.Types.ObjectId, ref: 'Project', default: null },
  todoId: { type: mongoose.Schema.Types.ObjectId, ref: 'Todo', default: null },
  tags: [{ type: String }],
  isPinned: { type: Boolean, default: false },
  isArchived: { type: Boolean, default: false },
  color: { type: String, default: '' },
  deletedAt: { type: Date, default: null, index: true }
}, {
  timestamps: true
});

noteSchema.index({ userId: 1, deletedAt: 1 });
noteSchema.index({ userId: 1, projectId: 1 });

const Note = mongoose.model('Note', noteSchema);
export default Note;
