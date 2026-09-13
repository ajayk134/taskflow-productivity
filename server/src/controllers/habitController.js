import Habit from '../models/Habit.js';
import Activity from '../models/Activity.js';

// ─── Date handling ────────────────────────────────────────────────────────────
// Habit completions are identified by *calendar date* keys (`YYYY-MM-DD`). The
// client sends its local calendar date so "today" is always the user's today.
// All log dates and window bounds are compared in UTC so results are stable
// regardless of the server or client timezone.

const DAY_MS = 24 * 60 * 60 * 1000;

export const dateKey = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().split('T')[0];
};

export const parseDateKey = (key) => {
  if (!key || typeof key !== 'string') return null;
  const m = key.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  return new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
};

// The server's "today" in UTC, used as a fallback when the client does not send
// its own calendar date.
export const utcTodayKey = () => dateKey(new Date());

export const addDaysKey = (key, days) => {
  const d = parseDateKey(key) || new Date();
  d.setUTCDate(d.getUTCDate() + days);
  return dateKey(d);
};

// Recompute a habit's streaks from its completed log dates. `todayKey` is the
// user's calendar date so the "current streak" is anchored on their today.
function recomputeStreaks(habit, todayKey) {
  const done = new Set();
  for (const log of habit.logs || []) {
    if (log.completed && log.date) done.add(dateKey(log.date));
  }

  let current = 0;
  let cursor = parseDateKey(todayKey) || new Date();
  while (done.has(dateKey(cursor))) {
    current += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  const sorted = [...done].sort();
  let longest = 0;
  let run = 0;
  let prev = null;
  for (const key of sorted) {
    if (prev && parseDateKey(key) - parseDateKey(prev) === DAY_MS) {
      run += 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prev = key;
  }

  habit.currentStreak = current;
  habit.longestStreak = Math.max(habit.longestStreak || 0, longest);
  return habit;
}

// ─── CRUD ─────────────────────────────────────────────────────────────────────

export const createHabit = async (req, res) => {
  try {
    const maxOrder = await Habit.findOne({ userId: req.userId }).sort({ order: -1 }).select('order');
    const habit = await Habit.create({
      ...req.body,
      userId: req.userId,
      order: (maxOrder?.order || 0) + 1
    });
    res.status(201).json({ habit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getHabits = async (req, res) => {
  try {
    const { includeArchived } = req.query;
    const query = { userId: req.userId };
    if (includeArchived !== 'true') query.isArchived = false;

    const habits = await Habit.find(query).sort({ order: 1, createdAt: -1 });
    res.json({ habits });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateHabit = async (req, res) => {
  try {
    const habit = await Habit.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!habit) return res.status(404).json({ error: 'Habit not found' });
    res.json({ habit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteHabit = async (req, res) => {
  try {
    const habit = await Habit.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });
    res.json({ message: 'Habit deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ─── Completions ──────────────────────────────────────────────────────────────

const parseDay = (req, fallbackKey) => {
  const bodyDate = req.body?.date || req.params?.date || fallbackKey;
  const key = dateKey(bodyDate);
  const parsed = parseDateKey(key);
  if (!parsed) return null;
  return parsed;
};

const todayKeyOf = (req) => {
  const k = req.body?.today || req.query?.today;
  const parsed = parseDateKey(k);
  return parsed ? dateKey(parsed) : utcTodayKey();
};

// Legacy toggle endpoint: flips completion for today (or the given date).
export const logHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    const today = todayKeyOf(req);
    const target = parseDay(req, today);
    if (!target) return res.status(400).json({ error: 'Invalid date provided' });
    const key = dateKey(target);

    const existingIndex = habit.logs.findIndex((l) => dateKey(l.date) === key);
    if (existingIndex !== -1) {
      habit.logs.splice(existingIndex, 1);
    } else {
      habit.logs.push({ date: target, completed: true, notes: req.body.notes || '' });
    }

    recomputeStreaks(habit, today);
    await habit.save();
    await Activity.create({ userId: req.userId, action: 'habit-completed', entityType: 'habit', entityId: habit._id, entityTitle: habit.name });

    res.json({ habit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/habits/completions?days=N&today=YYYY-MM-DD
// Returns a map of `${habitId}:${YYYY-MM-DD}` -> true for the window of the
// user's `days` ending at `today`. `today` is the client's calendar date so
// users ahead of or behind UTC never lose their current-day completion.
export const getHabitCompletions = async (req, res) => {
  try {
    const daysNum = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);
    const today = todayKeyOf(req);
    const windowEnd = parseDateKey(addDaysKey(today, 1));
    const windowStart = parseDateKey(addDaysKey(today, -(daysNum - 1)));

    const habits = await Habit.find({ userId: req.userId, isArchived: false }).select('logs');
    const completions = {};
    for (const habit of habits) {
      for (const log of habit.logs) {
        const d = log.date instanceof Date ? log.date : new Date(log.date);
        if (!log.completed || Number.isNaN(d.getTime())) continue;
        if (d >= windowStart && d < windowEnd) {
          completions[`${habit._id}:${dateKey(log.date)}`] = true;
        }
      }
    }
    res.json({ completions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// POST /api/habits/:id/completions { date: 'YYYY-MM-DD', today?: 'YYYY-MM-DD' }
// Logs a completion for the given calendar date, deduplicating existing entries.
export const logHabitCompletion = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    const today = todayKeyOf(req);
    const target = parseDay(req, today);
    if (!target) return res.status(400).json({ error: 'Invalid date provided' });

    const key = dateKey(target);
    const existing = habit.logs.find((l) => dateKey(l.date) === key);

    if (!existing) {
      habit.logs.push({ date: target, completed: true, notes: req.body.notes || '' });
    } else if (!existing.completed) {
      existing.completed = true;
      existing.notes = req.body.notes || existing.notes;
    }

    recomputeStreaks(habit, today);
    await habit.save();
    await Activity.create({ userId: req.userId, action: 'habit-completed', entityType: 'habit', entityId: habit._id, entityTitle: habit.name });

    res.json({ habit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// DELETE /api/habits/:id/completions/:date
export const removeHabitCompletion = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    const today = req.query.today
      ? todayKeyOf(req)
      : utcTodayKey();

    const key = req.params.date ? req.params.date.split('T')[0] : today;
    const index = habit.logs.findIndex((l) => dateKey(l.date) === key);
    if (index === -1) {
      res.status(404).json({ error: 'Completion not found' });
      return;
    }

    habit.logs.splice(index, 1);
    recomputeStreaks(habit, today);
    await habit.save();
    res.json({ habit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// GET /api/habits/:id/stats?days=30&today=YYYY-MM-DD
export const getHabitStats = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    const daysNum = Math.min(Math.max(parseInt(req.query.days, 10) || 30, 1), 365);
    const today = req.query.today ? todayKeyOf(req) : utcTodayKey();
    const windowEnd = parseDateKey(addDaysKey(today, 1));
    const windowStart = parseDateKey(addDaysKey(today, -(daysNum - 1)));

    const keys = new Set();
    for (const log of habit.logs) {
      const d = log.date instanceof Date ? log.date : new Date(log.date);
      if (log.completed && d >= windowStart && d < windowEnd) {
        keys.add(dateKey(log.date));
      }
    }

    recomputeStreaks(habit, today);

    const completedDays = keys.size;
    const completionRate = Math.round((completedDays / daysNum) * 100);

    const monthlyData = [];
    for (let i = daysNum - 1; i >= 0; i--) {
      const dayKey = addDaysKey(today, -i);
      monthlyData.push({ date: dayKey, completed: keys.has(dayKey) });
    }

    res.json({
      currentStreak: habit.currentStreak,
      longestStreak: habit.longestStreak,
      completionRate,
      completedDays,
      monthlyData
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};