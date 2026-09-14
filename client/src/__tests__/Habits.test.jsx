import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Habits from '../../src/pages/Habits';

vi.mock('../../src/utils/api', () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

const api = (await import('../../src/utils/api')).api;

const makeHabit = (overrides = {}) => ({
  _id: 'h1',
  name: 'Test habit',
  icon: 'repeat',
  color: '#10b981',
  frequency: 'daily',
  currentStreak: 5,
  longestStreak: 10,
  logs: [],
  isArchived: false,
  ...overrides,
});

function renderHabits() {
  return render(
    <MemoryRouter>
      <Habits />
    </MemoryRouter>
  );
}

describe('Habits page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    api.get.mockImplementation((path) => {
      if (path === '/habits') {
        return Promise.resolve({
          habits: [
            makeHabit(),
            makeHabit({ _id: 'h2', name: 'Archived habit', isArchived: true, icon: 'book', logs: [
              { date: new Date().toISOString(), completed: true },
            ] }),
          ],
        });
      }
      if (path === '/habits/completions') {
        return Promise.resolve({ completions: { 'h1:today': true } });
      }
      return Promise.resolve({});
    });
  });

  it('renders the active habits tab with habit cards', async () => {
    renderHabits();
    const cards = await screen.findAllByText('Test habit');
    expect(cards.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/completed today/i)).toBeTruthy();
  });

  it('renders a New Habit button', async () => {
    renderHabits();
    await screen.findByText('Test habit');
    expect(screen.getByText('New Habit')).toBeTruthy();
  });

  it('switches to archived tab and shows archived habits', async () => {
    renderHabits();
    await screen.findByText('Test habit');
    const archivedTab = screen.getByText(/Archived/i);
    fireEvent.click(archivedTab);
    expect(await screen.findByText('Archived habit')).toBeTruthy();
  });

  it('opens the delete confirmation modal for an archived habit', async () => {
    renderHabits();
    await screen.findByText('Test habit');
    const archivedTab = screen.getByText(/Archived/i);
    fireEvent.click(archivedTab);
    await screen.findByText('Archived habit');

    const deleteBtn = screen.getByRole('button', { name: /delete/i });
    fireEvent.click(deleteBtn);

    expect(await screen.findByText(/permanently delete/i)).toBeTruthy();
    expect(screen.getByText(/cannot be undone/i)).toBeTruthy();
  });

  it('no habit card contains overflow-causing CSS patterns on mobile', async () => {
    renderHabits();
    await screen.findByText('Test habit');
    const cards = document.querySelectorAll('.card');
    cards.forEach((card) => {
      expect(card.className).not.toMatch(/overflow-hidden/);
      expect(card.className).not.toMatch(/overflow-x-hidden/);
    });
  });

  it('archived habit action row uses flex-wrap for mobile safety', async () => {
    renderHabits();
    await screen.findByText('Test habit');
    fireEvent.click(screen.getByText(/Archived/i));
    await screen.findByText('Archived habit');

    // The actions group should include flex-wrap to handle narrow screens
    const archivedRow = document.querySelector('[class*="ml-auto"][class*="flex"][class*="flex-wrap"]');
    expect(archivedRow).toBeTruthy();
  });

  it('habit name and badges row allows wrapping', async () => {
    renderHabits();
    await screen.findByText('Test habit');
    const badgesRow = document.querySelector('[class*="flex"][class*="flex-wrap"][class*="items-center"][class*="gap-2"][class*="mb-2"]');
    expect(badgesRow).toBeTruthy();
  });

  it('restoring an archived habit calls the API', async () => {
    api.put.mockResolvedValueOnce({ habit: { _id: 'h2', isArchived: false } });
    renderHabits();
    await screen.findByText('Test habit');
    fireEvent.click(screen.getByText(/Archived/i));
    await screen.findByText('Archived habit');

    const restoreBtn = screen.getByRole('button', { name: /restore/i });
    fireEvent.click(restoreBtn);

    expect(api.put).toHaveBeenCalledWith('/habits/h2', { isArchived: false });
  });

  it('confirmation modal buttons wrap on small screens', async () => {
    renderHabits();
    await screen.findByText('Test habit');
    fireEvent.click(screen.getByText(/Archived/i));
    await screen.findByText('Archived habit');

    fireEvent.click(screen.getByRole('button', { name: /delete/i }));
    await screen.findByText(/permanently delete/i);

    // Buttons row uses flex-wrap for mobile
    const btnsRow = document.querySelector('[class*="flex"][class*="flex-wrap"][class*="justify-end"]');
    expect(btnsRow).toBeTruthy();
  });
});
