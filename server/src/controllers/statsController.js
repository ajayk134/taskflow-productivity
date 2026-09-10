import Todo from '../models/Todo.js';
import Project from '../models/Project.js';
import Habit from '../models/Habit.js';
import Goal from '../models/Goal.js';
import { getStartOfDay, getEndOfDay, getStartOfWeek, getEndOfWeek, getStartOfMonth, getEndOfMonth } from '../utils/helpers.js';

export const getDashboard = async (req, res) => {
  try {
    const userId = req.userId;
    const today = getStartOfDay();
    const endToday = getEndOfDay();
    const startWeek = getStartOfWeek();
    const endWeek = getEndOfWeek();
    const startMonth = getStartOfMonth();
    const endMonth = getEndOfMonth();

    const [
      totalActive,
      todayTasks,
      overdueTasks,
      completedToday,
      completedThisWeek,
      completedThisMonth,
      totalCompleted,
      importantTasks,
      upcomingTasks,
      projects,
      habits,
      goals
    ] = await Promise.all([
      Todo.countDocuments({ userId, deletedAt: null, status: { $nin: ['completed', 'archived'] } }),
      Todo.countDocuments({ userId, deletedAt: null, status: { $nin: ['completed', 'archived'] }, dueDate: { $gte: today, $lte: endToday } }),
      Todo.countDocuments({ userId, deletedAt: null, status: { $nin: ['completed', 'archived'] }, dueDate: { $lt: today } }),
      Todo.countDocuments({ userId, deletedAt: null, status: 'completed', completedAt: { $gte: today, $lte: endToday } }),
      Todo.countDocuments({ userId, deletedAt: null, status: 'completed', completedAt: { $gte: startWeek, $lte: endWeek } }),
      Todo.countDocuments({ userId, deletedAt: null, status: 'completed', completedAt: { $gte: startMonth, $lte: endMonth } }),
      Todo.countDocuments({ userId, deletedAt: null, status: 'completed' }),
      Todo.find({ userId, deletedAt: null, isImportant: true, status: { $nin: ['completed', 'archived'] } }).limit(5).sort({ dueDate: 1 }),
      Todo.find({ userId, deletedAt: null, status: { $nin: ['completed', 'archived'] }, dueDate: { $gte: today, $lte: endWeek } }).sort({ dueDate: 1 }).limit(10),
      Project.find({ userId, deletedAt: null, status: 'active' }).limit(5),
      Habit.find({ userId, isArchived: false }),
      Goal.find({ userId, deletedAt: null, status: 'active' })
    ]);

    const completionRate = totalCompleted > 0 ? Math.round((completedToday / Math.max(totalActive + completedToday, 1)) * 100) : 0;

    // Habit progress today
    const habitsCompletedToday = habits.filter(h => {
      return h.logs.some(l => l.date.toISOString().split('T')[0] === today.toISOString().split('T')[0]);
    }).length;

    res.json({
      overview: {
        totalActive,
        todayTasks,
        overdueTasks,
        completedToday,
        completedThisWeek,
        completedThisMonth,
        completionRate,
        habitsCompletedToday,
        totalHabits: habits.length
      },
      importantTasks,
      upcomingTasks,
      projects,
      goals
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getAnalytics = async (req, res) => {
  try {
    const userId = req.userId;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [
      tasksByPriority,
      tasksByStatus,
      completedByDay,
      avgCompletionTime,
      tasksByProject
    ] = await Promise.all([
      Todo.aggregate([
        { $match: { userId: userId, deletedAt: null, status: 'completed' } },
        { $group: { _id: '$priority', count: { $sum: 1 } } }
      ]),
      Todo.aggregate([
        { $match: { userId: userId, deletedAt: null } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),
      Todo.aggregate([
        { $match: { userId: userId, deletedAt: null, status: 'completed', completedAt: { $gte: thirtyDaysAgo } } },
        { $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$completedAt' } },
          count: { $sum: 1 }
        }},
        { $sort: { _id: 1 } }
      ]),
      Todo.aggregate([
        { $match: { userId: userId, deletedAt: null, status: 'completed', completedAt: { $ne: null }, createdAt: { $ne: null } } },
        { $project: {
          diff: { $subtract: ['$completedAt', '$createdAt'] }
        }},
        { $group: { _id: null, avg: { $avg: '$diff' } } }
      ]),
      Todo.aggregate([
        { $match: { userId: userId, deletedAt: null, projectId: { $ne: null } } },
        { $group: { _id: '$projectId', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 10 }
      ])
    ]);

    // Fill missing days in completedByDay
    const completedMap = {};
    completedByDay.forEach(d => { completedMap[d._id] = d.count; });
    const filledCompletedByDay = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().split('T')[0];
      filledCompletedByDay.push({ date: key, count: completedMap[key] || 0 });
    }

    res.json({
      tasksByPriority: tasksByPriority.map(p => ({ priority: p._id, count: p.count })),
      tasksByStatus: tasksByStatus.map(s => ({ status: s._id, count: s.count })),
      completedByDay: filledCompletedByDay,
      avgCompletionTimeHours: avgCompletionTime[0] ? Math.round(avgCompletionTime[0].avg / (1000 * 60 * 60) * 10) / 10 : 0,
      tasksByProject
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
