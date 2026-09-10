import Habit from '../models/Habit.js';
import Activity from '../models/Activity.js';
import { getStartOfDay, getEndOfDay } from '../utils/helpers.js';

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

export const logHabit = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    const today = getStartOfDay();
    const existingLog = habit.logs.find(l =>
      l.date.toISOString().split('T')[0] === today.toISOString().split('T')[0]
    );

    if (existingLog) {
      // Toggle off
      habit.logs = habit.logs.filter(l =>
        l.date.toISOString().split('T')[0] !== today.toISOString().split('T')[0]
      );
      habit.currentStreak = Math.max(0, habit.currentStreak - 1);
    } else {
      // Log completion
      habit.logs.push({ date: today, completed: true, notes: req.body.notes || '' });
      habit.currentStreak += 1;
      habit.longestStreak = Math.max(habit.longestStreak, habit.currentStreak);
    }

    await habit.save();
    await Activity.create({ userId: req.userId, action: 'habit-completed', entityType: 'habit', entityId: habit._id, entityTitle: habit.name });

    res.json({ habit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const dateKey = (date) => {
  const d = date instanceof Date ? date : new Date(date);
  return d.toISOString().split('T')[0];
};

export const getHabitCompletions = async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const daysNum = parseInt(days) || 30;

    const today = getStartOfDay();
    const todayEnd = getEndOfDay(today);
    const windowStart = new Date(today);
    windowStart.setDate(windowStart.getDate() - (daysNum - 1));

    const habits = await Habit.find({ userId: req.userId, isArchived: false }).select('logs');
    const completions = {};
    for (const habit of habits) {
      for (const log of habit.logs) {
        if (log.date >= windowStart && log.date <= todayEnd) {
          completions[`${habit._id}:${dateKey(log.date)}`] = true;
        }
      }
    }
    res.json({ completions });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const logHabitCompletion = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    const targetDate = req.body.date ? new Date(req.body.date) : getStartOfDay();
    if (Number.isNaN(targetDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date provided' });
    }

    const key = dateKey(targetDate);
    const existing = habit.logs.find(l => dateKey(l.date) === key);

    if (!existing) {
      const todayKey = dateKey(getStartOfDay());
      habit.logs.push({ date: targetDate, completed: true, notes: req.body.notes || '' });
      if (key === todayKey) {
        habit.currentStreak += 1;
        habit.longestStreak = Math.max(habit.longestStreak, habit.currentStreak);
      }
    }

    await habit.save();
    await Activity.create({ userId: req.userId, action: 'habit-completed', entityType: 'habit', entityId: habit._id, entityTitle: habit.name });
    res.json({ habit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const removeHabitCompletion = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    const key = req.params.date || dateKey(getStartOfDay());
    const index = habit.logs.findIndex(l => dateKey(l.date) === key);

    if (index === -1) {
      res.status(404).json({ error: 'Completion not found' });
      return;
    }

    habit.logs.splice(index, 1);
    if (key === dateKey(getStartOfDay())) {
      habit.currentStreak = Math.max(0, habit.currentStreak - 1);
    }
    await habit.save();
    res.json({ habit });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getHabitStats = async (req, res) => {
  try {
    const habit = await Habit.findOne({ _id: req.params.id, userId: req.userId });
    if (!habit) return res.status(404).json({ error: 'Habit not found' });

    const today = getStartOfDay();
    const thirtyDaysAgo = new Date(today);
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const last30Days = habit.logs.filter(l => l.date >= thirtyDaysAgo);
    const completedDays = last30Days.length;
    const completionRate = Math.round((completedDays / 30) * 100);

    // Monthly data for chart
    const monthlyData = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const completed = habit.logs.some(l =>
        l.date.toISOString().split('T')[0] === date.toISOString().split('T')[0]
      );
      monthlyData.push({ date: date.toISOString().split('T')[0], completed });
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
