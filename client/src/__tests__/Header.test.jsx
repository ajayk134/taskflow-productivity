import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Header from '../../src/components/layout/Header';
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

function fixture(overrides = {}) {
  return {
    _id: 'n1',
    type: 'reminder',
    title: 'Task due today',
    message: 'Review PR before EOD',
    isRead: false,
    actionUrl: '/my-day',
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

function renderHeader() {
  return render(
    <MemoryRouter>
      <Header />
    </MemoryRouter>
  );
}

async function openDropdown() {
  fireEvent.click(screen.getByRole('button', { name: 'Notifications' }));
}

describe('Header notifications', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useNotificationStore.setState({
      notifications: [],
      unreadCount: 0,
      isLoading: false,
      hasLoaded: false,
      error: null,
    });
  });

  it('renders notifications loaded from the API', async () => {
    api.get.mockResolvedValueOnce({
      notifications: [fixture(), fixture({ _id: 'n2', title: 'Habit streak', message: '14-day streak', isRead: true })],
      unreadCount: 1,
    });

    renderHeader();
    await openDropdown();

    expect(await screen.findByText('Task due today')).toBeTruthy();
    expect(screen.getByText('Review PR before EOD')).toBeTruthy();
    expect(screen.getByText('Habit streak')).toBeTruthy();
    expect(api.get).toHaveBeenCalledWith('/notifications');
  });

  it('shows the correct unread badge count', async () => {
    api.get.mockResolvedValueOnce({
      notifications: [fixture(), fixture({ _id: 'n2' }), fixture({ _id: 'n3', isRead: true })],
      unreadCount: 2,
    });

    renderHeader();

    await waitFor(() => {
      expect(screen.getByText('2')).toBeTruthy();
    });
  });

  it('hides the badge when there are no unread notifications', async () => {
    api.get.mockResolvedValueOnce({ notifications: [], unreadCount: 0 });

    renderHeader();

    await waitFor(() => {
      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });
    const bell = screen.getByRole('button', { name: 'Notifications' });
    expect(bell.querySelector('.bg-red-500')).toBeNull();
  });

  it('marks all as read when the control is clicked', async () => {
    api.get.mockResolvedValueOnce({
      notifications: [fixture(), fixture({ _id: 'n2', isRead: false })],
      unreadCount: 2,
    });
    api.post.mockResolvedValueOnce({ success: true, modified: 2 });

    renderHeader();
    await openDropdown();

    fireEvent.click(await screen.findByRole('button', { name: 'Mark all read' }));

    expect(api.post).toHaveBeenCalledWith('/notifications/read-all');
    await waitFor(() => {
      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });
  });

  it('marks a single notification read when clicked', async () => {
    api.get.mockResolvedValueOnce({
      notifications: [fixture({ _id: 'n1' }), fixture({ _id: 'n2', title: 'Habit streak', isRead: true })],
      unreadCount: 1,
    });
    api.post.mockResolvedValueOnce({ success: true });

    renderHeader();
    await openDropdown();

    fireEvent.click(await screen.findByText('Task due today'));

    expect(api.post).toHaveBeenCalledWith('/notifications/n1/read');
    await waitFor(() => {
      expect(useNotificationStore.getState().unreadCount).toBe(0);
    });
  });

  it('shows an empty state when there are no notifications', async () => {
    api.get.mockResolvedValueOnce({ notifications: [], unreadCount: 0 });

    renderHeader();
    await openDropdown();

    expect(await screen.findByText('No new notifications')).toBeTruthy();
  });

  it('renders the header with an error state instead of crashing on API failure', async () => {
    api.get.mockRejectedValueOnce(new Error('Network down'));

    renderHeader();
    await openDropdown();

    expect(await screen.findByText('Could not load notifications.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeTruthy();
  });
});