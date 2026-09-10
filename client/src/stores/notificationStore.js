import { create } from 'zustand';
import api from '../utils/api';

export const EMPTY_NOTIFICATION_STATE = {
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  hasLoaded: false,
  error: null,
};

const useNotificationStore = create((set, get) => ({
  ...EMPTY_NOTIFICATION_STATE,

  fetchNotifications: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await api.get('/notifications');
      const notifications = Array.isArray(data?.notifications) ? data.notifications : [];
      const unreadCount = typeof data?.unreadCount === 'number' ? data.unreadCount : 0;
      set({ notifications, unreadCount, isLoading: false, hasLoaded: true });
      return { notifications, unreadCount };
    } catch (error) {
      set({ isLoading: false, hasLoaded: true, error: error?.message || 'Failed to load notifications' });
      return { notifications: [], unreadCount: 0 };
    }
  },

  markAsRead: async (id) => {
    const prev = get().notifications;
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n._id === id ? { ...n, isRead: true } : n
      ),
      unreadCount: Math.max(0, state.unreadCount - (state.notifications.some((n) => n._id === id && !n.isRead) ? 1 : 0)),
    }));
    try {
      await api.post(`/notifications/${id}/read`);
    } catch (error) {
      set({ notifications: prev, error: error?.message || 'Failed to mark notification as read' });
    }
  },

  markAllAsRead: async () => {
    const prev = get().notifications;
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
      unreadCount: 0,
    }));
    try {
      await api.post('/notifications/read-all');
      return { success: true };
    } catch (error) {
      set({ notifications: prev, error: error?.message || 'Failed to mark all notifications as read' });
      return { success: false };
    }
  },

  reset: () => set({ ...EMPTY_NOTIFICATION_STATE }),
}));

export { useNotificationStore };
export default useNotificationStore;