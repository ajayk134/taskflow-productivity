import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Flame,
  TrendingUp,
  CheckCircle2,
  Archive,
  RefreshCcw,
  Search,
  Repeat,
  Smile,
  Zap,
  Heart,
  Dumbbell,
  BookOpen,
  Moon,
  Droplets,
  Trash2,
  AlertTriangle,
} from 'lucide-react';
import clsx from 'clsx';
import { format, isSameDay } from 'date-fns';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';

const HABIT_ICONS = [Repeat, Zap, Heart, Dumbbell, BookOpen, Moon, Droplets, Smile];
const HABIT_ICON_NAMES = ['repeat', 'zap', 'heart', 'dumbbell', 'book', 'moon', 'water', 'smile'];
const HABIT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
const FREQUENCIES = ['daily', 'weekly', 'custom'];

const localDateKey = (date = new Date()) => format(date, 'yyyy-MM-dd');

const parseLocalKey = (key) => {
  const [y, m, d] = (key || '').split('-').map(Number);
  if (!y || !m || !d) return new Date();
  const date = new Date(y, m - 1, d, 0, 0, 0, 0);
  return date;
};

// Contiguous range of calendar days from a habit's earliest completion (or
// today if it has none) through today. No fixed-size window: the full, unbounded
// history is always represented so streaks and rates are never capped.
const historyDays = (dates, todayKey) => {
  const set = dates || new Set();
  const end = parseLocalKey(todayKey);
  const keys = [...set].sort();
  let start = end;
  if (keys.length && keys[0] <= todayKey) start = parseLocalKey(keys[0]);
  const days = [];
  const cursor = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endMs = new Date(end.getFullYear(), end.getMonth(), end.getDate()).getTime();
  while (cursor.getTime() <= endMs) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
  }
  return days;
};

const computeStreak = (dates, todayKey) => {
  const set = dates || new Set();
  let streak = 0;
  const cursor = parseLocalKey(todayKey);
  while (set.has(format(cursor, 'yyyy-MM-dd'))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
};

const computeRate = (dates, todayKey) => {
  const set = dates || new Set();
  const days = historyDays(set, todayKey);
  if (!days.length) return 0;
  let count = 0;
  for (const day of days) {
    if (set.has(format(day, 'yyyy-MM-dd'))) count += 1;
  }
  return Math.round((count / days.length) * 100);
};

const datesFromLogs = (habit) => {
  const set = new Set();
  for (const log of habit.logs || []) {
    if (log.completed && log.date) set.add(new Date(log.date).toISOString().split('T')[0]);
  }
  return set;
};

const TABS = ['active', 'archived'];

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState(0);
  const [newColor, setNewColor] = useState(0);
  const [newFrequency, setNewFrequency] = useState('daily');
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');
  const [search, setSearch] = useState('');
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchHabits = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/habits', { includeArchived: 'true' });
      setHabits(data.habits || []);
    } catch {
      setHabits([]);
    }
    setLoading(false);
  }, []);

  const fetchCompletions = useCallback(async () => {
    try {
      const data = await api.get('/habits/completions', { today: localDateKey() });
      setCompletions(data.completions || {});
    } catch {
      setCompletions({});
    }
  }, []);

  useEffect(() => {
    fetchHabits();
    fetchCompletions();
  }, [fetchHabits, fetchCompletions]);

  const today = new Date();

  const datesByHabit = useMemo(() => {
    const map = {};
    for (const key of Object.keys(completions)) {
      const idx = key.lastIndexOf(':');
      if (idx === -1) continue;
      const habitId = key.slice(0, idx);
      const day = key.slice(idx + 1);
      if (!map[habitId]) map[habitId] = new Set();
      map[habitId].add(day);
    }
    return map;
  }, [completions]);

  const toggleCompletion = async (habitId, date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const key = `${habitId}:${dateStr}`;
    const isCompleted = completions[key];

    try {
      if (isCompleted) {
        await api.delete(`/habits/${habitId}/completions/${dateStr}?today=${localDateKey()}`);
        setCompletions((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      } else {
        await api.post(`/habits/${habitId}/completions`, { date: dateStr, today: localDateKey() });
        setCompletions((prev) => ({ ...prev, [key]: true }));
      }
    } catch {
      toast.error('Failed to update habit');
    }
  };

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await api.post('/habits', {
        name: newName,
        icon: HABIT_ICON_NAMES[newIcon] || 'repeat',
        color: HABIT_COLORS[newColor],
        frequency: newFrequency,
      });
      toast.success('Habit created');
      setShowCreate(false);
      setNewName('');
      setNewIcon(0);
      setNewColor(0);
      fetchHabits();
    } catch {
      toast.error('Failed to create habit');
    }
  };

  const archiveHabit = async (id) => {
    try {
      await api.put(`/habits/${id}`, { isArchived: true });
      toast.success('Habit archived');
      fetchHabits();
    } catch {
      toast.error('Failed to archive habit');
    }
  };

  const restoreHabit = async (id) => {
    try {
      await api.put(`/habits/${id}`, { isArchived: false });
      toast.success('Habit restored');
      fetchHabits();
      fetchCompletions();
    } catch {
      toast.error('Failed to restore habit');
    }
  };

  const permanentlyDeleteHabit = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await api.delete(`/habits/${deleteTarget._id}`);
      toast.success('Habit permanently deleted');
      setDeleteTarget(null);
      setHabits((prev) => prev.filter((h) => h._id !== deleteTarget._id));
    } catch {
      toast.error('Failed to delete habit. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  const activeHabits = habits.filter((h) => !h.isArchived);
  const archivedHabits = habits.filter((h) => h.isArchived);
  const query = (search || '').trim().toLowerCase();
  const visibleHabits = (tab === 'archived' ? archivedHabits : activeHabits)
    .filter((h) => !query || h.name.toLowerCase().includes(query));
  const todayCompleted = activeHabits.filter((h) => completions[`${h._id}:${localDateKey()}`]).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Habits</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {todayCompleted}/{activeHabits.length} completed today
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary btn-sm">
          <Plus className="w-4 h-4" /> New Habit
        </button>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={clsx(
                'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors',
                tab === t ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              )}
            >
              {t === 'active'
                ? `Active (${activeHabits.length})`
                : `Archived (${archivedHabits.length})`}
            </button>
          ))}
        </div>
        <div className="relative flex-1 sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search habits..."
            className="input pl-9 py-1.5 text-sm"
          />
        </div>
      </div>

      {visibleHabits.length === 0 && !loading && (
        <EmptyState
          icon={Repeat}
          title={tab === 'archived' ? 'No archived habits' : 'No habits yet'}
          description={
            tab === 'archived'
              ? 'Archive a habit to keep it here.'
              : 'Start building positive habits by creating your first one.'
          }
          onAction={tab === 'archived' ? undefined : () => setShowCreate(true)}
          actionLabel={tab === 'archived' ? undefined : 'Create Habit'}
        />
      )}

      <div className="space-y-4">
        {visibleHabits.map((habit) => {
          const isArchivedView = tab === 'archived';
          const habitDates = isArchivedView ? datesFromLogs(habit) : (datesByHabit[habit._id] || new Set());
          const isCompletedToday = habitDates.has(localDateKey());
          const streak = isArchivedView ? (habit.currentStreak || 0) : computeStreak(habitDates, localDateKey());
          const rate = computeRate(habitDates, localDateKey());
          const history = historyDays(habitDates, localDateKey());
          const iconIdx = HABIT_ICON_NAMES.indexOf(habit.icon);
          const IconComp = iconIdx >= 0 ? HABIT_ICONS[iconIdx] : Repeat;

          return (
            <div key={habit._id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <button
                  onClick={() => !isArchivedView && toggleCompletion(habit._id, today)}
                  disabled={isArchivedView}
                  className={clsx(
                    'flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200',
                    isCompletedToday
                      ? 'text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300',
                    isArchivedView && 'opacity-60'
                  )}
                  style={isCompletedToday ? { backgroundColor: habit.color || '#3b82f6' } : {}}
                >
                  {isCompletedToday ? (
                    <CheckCircle2 className="w-5 h-5" />
                  ) : (
                    <IconComp className="w-5 h-5" />
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 break-words">{habit.name}</h3>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 capitalize">
                      {habit.frequency || 'daily'}
                    </span>
                    {isArchivedView && (
                      <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 capitalize">
                        Archived
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mb-3">
                    <div className="flex items-center gap-1 text-xs">
                      <Flame className={clsx('w-3.5 h-3.5', streak > 0 ? 'text-orange-500' : 'text-gray-300 dark:text-gray-600')} />
                      <span className={clsx('font-semibold', streak > 0 ? 'text-orange-600 dark:text-orange-400' : 'text-gray-400')}>{streak}</span>
                      <span className="text-gray-400">streak</span>
                    </div>
                    <div className="flex items-center gap-1 text-xs">
                      <TrendingUp className="w-3.5 h-3.5 text-gray-400 dark:text-gray-600" />
                      <span className="font-semibold text-gray-600 dark:text-gray-300">{rate}%</span>
                      <span className="text-gray-400">rate</span>
                    </div>
                    {isArchivedView ? (
                      <div className="w-full sm:w-auto flex items-center gap-1 flex-wrap justify-end sm:ml-auto">
                        <button
                          onClick={() => restoreHabit(habit._id)}
                          className="inline-flex items-center gap-1 p-2 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors whitespace-nowrap"
                          title="Restore"
                        >
                          <RefreshCcw className="w-3.5 h-3.5" /> Restore
                        </button>
                        <button
                          onClick={() => setDeleteTarget(habit)}
                          className="inline-flex items-center gap-1 p-2 text-xs font-medium text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors whitespace-nowrap"
                          title="Delete permanently"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => archiveHabit(habit._id)}
                        className="ml-auto p-2 text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                        title="Archive"
                      >
                        <Archive className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="flex gap-[3px] overflow-x-auto min-w-0 pb-0.5 -mx-1 px-1">
                    {history.map((day) => {
                      const dayKey = format(day, 'yyyy-MM-dd');
                      const key = `${habit._id}:${dayKey}`;
                      const done = habitDates.has(dayKey);
                      const isToday = isSameDay(day, today);
                      return (
                        <button
                          key={key}
                          onClick={() => !isArchivedView && toggleCompletion(habit._id, day)}
                          disabled={isArchivedView}
                          className={clsx(
                            'w-2.5 h-2.5 rounded-sm transition-all hover:scale-125 flex-shrink-0',
                            done ? 'opacity-100' : 'bg-gray-100 dark:bg-gray-700 opacity-50 hover:opacity-75',
                            isToday && !done && 'ring-1 ring-gray-300 dark:ring-gray-600'
                          )}
                          style={done ? { backgroundColor: habit.color || '#3b82f6' } : {}}
                          title={format(day, 'MMM d')}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Habit" size="sm">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="e.g. Read 30 minutes"
              className="input"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Icon</label>
            <div className="flex gap-2">
              {HABIT_ICONS.map((Icon, i) => (
                <button
                  key={i}
                  onClick={() => setNewIcon(i)}
                  className={clsx(
                    'w-9 h-9 rounded-lg flex items-center justify-center transition-colors',
                    newIcon === i ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Color</label>
            <div className="flex gap-2">
              {HABIT_COLORS.map((color, i) => (
                <button
                  key={color}
                  onClick={() => setNewColor(i)}
                  className={clsx(
                    'w-7 h-7 rounded-full transition-transform',
                    newColor === i ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : 'hover:scale-110'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Frequency</label>
            <div className="flex gap-2">
              {FREQUENCIES.map((f) => (
                <button
                  key={f}
                  onClick={() => setNewFrequency(f)}
                  className={clsx(
                    'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors',
                    newFrequency === f ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setShowCreate(false)} className="btn-secondary btn-sm">Cancel</button>
          <button onClick={handleCreate} className="btn-primary btn-sm">Create</button>
        </div>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => !deleting && setDeleteTarget(null)} title="Delete Habit Permanently" size="sm">
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-red-100 dark:bg-red-500/10 flex items-center justify-center mt-0.5">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-700 dark:text-gray-300 break-words">
                Are you sure you want to permanently delete <span className="font-semibold text-gray-900 dark:text-gray-100">{deleteTarget?.name}</span>?
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                This action cannot be undone. All habit data and completion history will be lost.
              </p>
            </div>
          </div>
        </div>
        <div className="flex flex-wrap justify-end gap-2 mt-6">
          <button onClick={() => setDeleteTarget(null)} disabled={deleting} className="btn-secondary btn-sm">Cancel</button>
          <button
            onClick={permanentlyDeleteHabit}
            disabled={deleting}
            className="btn-sm px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {deleting ? 'Deleting...' : 'Delete Permanently'}
          </button>
        </div>
      </Modal>
    </div>
  );
}
