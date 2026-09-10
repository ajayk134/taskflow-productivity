import Notification from '../models/Notification.js';

export const getNotifications = async (req, res) => {
  try {
    const { unreadOnly } = req.query;
    const query = { userId: req.userId };
    if (unreadOnly === 'true') query.isRead = false;

    const notifications = await Notification.find(query).sort({ createdAt: -1 }).limit(100);
    const unreadCount = await Notification.countDocuments({ userId: req.userId, isRead: false });

    res.json({ notifications, unreadCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markAsRead = async (req, res) => {
  try {
    await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { isRead: true }
    );
    res.json({ message: 'Marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.userId, isRead: false },
      { isRead: true }
    );
    res.json({ message: 'All marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteNotification = async (req, res) => {
  try {
    await Notification.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: 'Notification deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
