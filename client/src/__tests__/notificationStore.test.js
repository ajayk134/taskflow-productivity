import { describe, it, expect, vi, beforeEach } from 'vitest';
import useNotificationStore from '../../src/stores/notificationStore';

vi.mock('../../src/utils/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const api = (await import('../../src/utils/api')).default;

function resetStore() {
  useNotificationStore.setState({
    notifications: [],
    unreadCount: 0,
    isLoading: false,
    hasLoaded: false,
    error: null,
  });
}

const fixture = (overrides = {}) => ({
  _id: overrides._id || 'n1',
  type: 'reminder',
  title: 'Task due today',
  message: 'Review PR before EOD',
  isRead: false,
  actionUrl: '/my-day',
  createdAt: new Date().toISOString(),
  ...overrides,
});

describe('notificationStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    resetStore();
  });

  it('fetches notifications and unread count from the API', async () => {
    api.get.mockResolvedValueOnce({
      notifications: [fixture(), fixture({ _id: 'n2', isRead: true })],
      unreadCount: 1,
    });

    const result = await useNotificationStore.getState().fetchNotifications();

    expect(api.get).toHaveBeenCalledWith('/notifications');
    expect(result.unreadCount).toBe(1);
    expect(useNotificationStore.getState().notifications).toHaveLength(2);
    expect(useNotificationStore.getState().unreadCount).toBe(1);
    expect(useNotificationStore.getState().hasLoaded).toBe(true);
  });

  it('tolerates a malformed API response', async () => {
    api.get.mockResolvedValueOnce({});

    await useNotificationStore.getState().fetchNotifications();

    expect(useNotificationStore.getState().notifications).toEqual([]);
    expect(useNotificationStore.getState().unreadCount).toBe(0);
    expect(useNotificationStore.getState().error).toBeNull();
  });

  it('does not crash when the API request fails', async () => {
    api.get.mockRejectedValueOnce(new Error('Network down'));

    await useNotificationStore.getState().fetchNotifications();

    expect(useNotificationStore.getState().notifications).toEqual([]);
    expect(useNotificationStore.getState().unreadCount).toBe(0);
    expect(useNotificationStore.getState().error).toBe('Network down');
  });

  it('marks one notification as read via the API and updates state', async () => {
    useNotificationStore.setState({
      notifications: [fixture(), fixture({ _id: 'n2', isRead: true })],
      unreadCount: 1,
      hasLoaded: true,
    });
    api.post.mockResolvedValueOnce({ success: true });

    await useNotificationStore.getState().markAsRead('n1');

    expect(api.post).toHaveBeenCalledWith('/notifications/n1/read');
    expect(useNotificationStore.getState().notifications[0].isRead).toBe(true);
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it('restores previous state when marking one as read fails', async () => {
    useNotificationStore.setState({
      notifications: [fixture()],
      unreadCount: 1,
      hasLoaded: true,
    });
    api.post.mockRejectedValueOnce(new Error('Server error'));

    await useNotificationStore.getState().markAsRead('n1');

    expect(useNotificationStore.getState().notifications[0].isRead).toBe(false);
  });

  it('marks all notifications as read and resets the unread count', async () => {
    useNotificationStore.setState({
      notifications: [
        fixture(),
        fixture({ _id: 'n2', isRead: false }),
        fixture({ _id: 'n3', isRead: true }),
      ],
      unreadCount: 2,
      hasLoaded: true,
    });
    api.post.mockResolvedValueOnce({ success: true, modified: 2 });

    const result = await useNotificationStore.getState().markAllAsRead();

    expect(api.post).toHaveBeenCalledWith('/notifications/read-all');
    expect(result.success).toBe(true);
    expect(useNotificationStore.getState().notifications.every((n) => n.isRead === true)).toBe(true);
    expect(useNotificationStore.getState().unreadCount).toBe(0);
  });

  it('restores previous state when mark-all fails', async () => {
    useNotificationStore.setState({
      notifications: [fixture(), fixture({ _id: 'n2', isRead: false })],
      unreadCount: 2,
      hasLoaded: true,
    });
    api.post.mockRejectedValueOnce(new Error('Server error'));

    const result = await useNotificationStore.getState().markAllAsRead();

    expect(result.success).toBe(false);
    expect(useNotificationStore.getState().notifications[1].isRead).toBe(false);
  });

  it('reset clears all notification state', () => {
    useNotificationStore.setState({
      notifications: [fixture()],
      unreadCount: 1,
      hasLoaded: true,
    });

    useNotificationStore.getState().reset();

    expect(useNotificationStore.getState()).toMatchObject({
      notifications: [],
      unreadCount: 0,
      hasLoaded: false,
      error: null,
    });
  });
});