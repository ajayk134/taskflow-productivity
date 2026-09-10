import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  name: { type: String, required: true, trim: true },
  avatar: { type: String, default: '' },
  theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
  accentColor: { type: String, default: '#6366f1' },
  timezone: { type: String, default: 'UTC' },
  dateFormat: { type: String, default: 'MMM dd, yyyy' },
  defaultView: { type: String, enum: ['list', 'compact', 'kanban', 'calendar', 'timeline'], default: 'list' },
  weekStartsOn: { type: Number, enum: [0, 1], default: 1 },
  notifications: {
    reminders: { type: Boolean, default: true },
    overdue: { type: Boolean, default: true },
    dailyPlanning: { type: Boolean, default: false },
    habitReminder: { type: Boolean, default: true }
  }
}, {
  timestamps: true
});

userSchema.index({ email: 1 });

const User = mongoose.model('User', userSchema);
export default User;
