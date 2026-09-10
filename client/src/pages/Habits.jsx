import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Plus,
  Flame,
  TrendingUp,
  CheckCircle2,
  Archive,
  X,
  Repeat,
  Smile,
  Zap,
  Heart,
  Dumbbell,
  BookOpen,
  Moon,
  Droplets,
} from 'lucide-react';
import clsx from 'clsx';
import { format, subDays, isSameDay, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';

const HABIT_ICONS = [Repeat, Zap, Heart, Dumbbell, BookOpen, Moon, Droplets, Smile];
const HABIT_ICON_NAMES = ['repeat', 'zap', 'heart', 'dumbbell', 'book', 'moon', 'water', 'smile'];
const HABIT_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];
const FREQUENCIES = ['daily', 'weekly', 'custom'];

export default function Habits() {
  const [habits, setHabits] = useState([]);
  const [completions, setCompletions] = useState({});
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState(0);
  const [newColor, setNewColor] = useState(0);
  const [newFrequency, setNewFrequency] = useState('daily');
  const [loading, setLoading] = useState(true);

  const fetchHabits = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/habits');
      setHabits(data.habits || []);
    } catch {
      setHabits([]);
    }
    setLoading(false);
  }, []);

  const fetchCompletions = useCallback(async () => {
    try {
      const data = await api.get('/habits/completions', { days: '30' });
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
  const last30Days = useMemo(() =>
    Array.from({ length: 30 }, (_, i) => subDays(today, 29 - i)),
  []);

  const toggleCompletion = async (habitId, date) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const key = `${habitId}:${dateStr}`;
    const isCompleted = completions[key];

    try {
      if (isCompleted) {
        await api.delete(`/habits/${habitId}/completions/${dateStr}`);
        setCompletions((prev) => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      } else {
        await api.post(`/habits/${habitId}/completions`, { date: dateStr });
        setCompletions((prev) => ({ ...prev, [key]: true }));
      }
    } catch {
      toast.error('Failed to update habit');
    }
  };

  const getStreak = (habitId) => {
    let streak = 0;
    for (let i = last30Days.length - 1; i >= 0; i--) {
      const key = `${habitId}:${format(last30Days[i], 'yyyy-MM-dd')}`;
      if (completions[key]) streak++;
      else break;
    }
    return streak;
  };

  const getLongestStreak = (habitId) => {
    let longest = 0;
    let current = 0;
    for (const day of last30Days) {
      const key = `${habitId}:${format(day, 'yyyy-MM-dd')}`;
      if (completions[key]) {
        current++;
        longest = Math.max(longest, current);
      } else {
        current = 0;
      }
    }
    return longest;
  };

  const getCompletionRate = (habitId) => {
    let count = 0;
    for (const day of last30Days) {
      const key = `${habitId}:${format(day, 'yyyy-MM-dd')}`;
      if (completions[key]) count++;
    }
    return Math.round((count / 30) * 100);
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

  const todayCompleted = habits.filter((h) => completions[`${h._id}:${format(today, 'yyyy-MM-dd')}`]).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Habits</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {todayCompleted}/{habits.length} completed today
          </p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary btn-sm">
          <Plus className="w-4 h-4" /> New Habit
        </button>
      </div>

      {habits.length === 0 && !loading && (
        <EmptyState
          icon={Repeat}
          title="No habits yet"
          description="Start building positive habits by creating your first one."
          onAction={() => setShowCreate(true)}
          actionLabel="Create Habit"
        />
      )}

      <div className="space-y-4">
        {habits.map((habit) => {
          const isCompletedToday = completions[`${habit._id}:${format(today, 'yyyy-MM-dd')}`];
          const streak = getStreak(habit._id);
          const longest = getLongestStreak(habit._id);
          const rate = getCompletionRate(habit._id);
          const iconIdx = HABIT_ICON_NAMES.indexOf(habit.icon);
          const IconComp = iconIdx >= 0 ? HABIT_ICONS[iconIdx] : Repeat;

          return (
            <div key={habit._id} className="card p-5 hover:shadow-md transition-shadow">
              <div className="flex items-start gap-4">
                <button
                  onClick={() => toggleCompletion(habit._id, today)}
                  className={clsx(
                    'flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-200',
                    isCompletedToday
                      ? 'text-white shadow-md'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300'
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
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{habit.name}</h3>
                    <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 capitalize">
                      {habit.frequency || 'daily'}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mb-3">
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
                    <button
                      onClick={() => archiveHabit(habit._id)}
                      className="ml-auto p-1 text-gray-400 transition-colors hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300"
                      title="Archive"
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="flex gap-[3px]">
                    {last30Days.map((day) => {
                      const key = `${habit._id}:${format(day, 'yyyy-MM-dd')}`;
                      const done = completions[key];
                      const isToday = isSameDay(day, today);
                      return (
                        <button
                          key={key}
                          onClick={() => toggleCompletion(habit._id, day)}
                          className={clsx(
                            'w-2.5 h-2.5 rounded-sm transition-all hover:scale-125',
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
    </div>
  );
}
