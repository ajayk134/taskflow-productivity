import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: {
    type: String,
    enum: ['reminder', 'overdue', 'suggestion', 'system', 'habit', 'daily-planning'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, default: '' },
  entityId: { type: mongoose.Schema.Types.ObjectId, default: null },
  entityType: { type: String, default: '' },
  isRead: { type: Boolean, default: false },
  actionUrl: { type: String, default: '' }
}, {
  timestamps: true
});

notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification = mongoose.model('Notification', notificationSchema);
export default Notification;
