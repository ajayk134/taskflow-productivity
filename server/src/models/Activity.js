import mongoose from 'mongoose';

const activitySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  action: {
    type: String,
    enum: ['created', 'updated', 'completed', 'reopened', 'archived', 'restored', 'deleted', 'permanently-deleted',
      'priority-changed', 'due-date-changed', 'status-changed', 'moved', 'tag-added', 'tag-removed',
      'subtask-added', 'subtask-completed', 'project-created', 'project-updated',
      'habit-completed', 'goal-created', 'goal-updated', 'note-created'],
    required: true
  },
  entityType: {
    type: String,
    enum: ['todo', 'project', 'habit', 'goal', 'note', 'template', 'tag', 'system'],
    required: true
  },
  entityId: { type: mongoose.Schema.Types.ObjectId, required: true },
  entityTitle: { type: String, default: '' },
  details: { type: mongoose.Schema.Types.Mixed, default: {} }
}, {
  timestamps: true
});

activitySchema.index({ userId: 1, createdAt: -1 });
activitySchema.index({ userId: 1, entityType: 1, entityId: 1 });

const Activity = mongoose.model('Activity', activitySchema);
export default Activity;
