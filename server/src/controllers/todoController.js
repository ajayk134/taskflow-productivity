import Todo from '../models/Todo.js';
import Activity from '../models/Activity.js';
import Tag from '../models/Tag.js';
import { parseNaturalLanguage, getStartOfDay, getEndOfDay, getStartOfWeek, getEndOfWeek } from '../utils/helpers.js';

const VALID_STATUSES = ['inbox', 'planned', 'next', 'in-progress', 'waiting', 'blocked', 'completed', 'archived', 'review'];
const STATUS_ALIASES = {
  pending: 'inbox',
  in_progress: 'in-progress',
  'in progress': 'in-progress',
  todo: 'planned',
  done: 'completed',
  'in review': 'review'
};

const normalizeStatus = (status) => {
  if (status === undefined || status === null) return undefined;
  const normalized = String(status).toLowerCase().trim();
  return STATUS_ALIASES[normalized] || normalized;
};

// Resolves a request payload into a final { status, completedAt } pair.
// Supports the client's boolean `completed` flag plus status aliases like
// `pending` / `in_progress`. Returns null updates when nothing changes.
const resolveCompletion = (body, oldTodo = {}) => {
  const updates = {};
  let status = normalizeStatus(body.status);

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return { error: `Invalid status: ${body.status}` };
  }

  if (body.completed === true) {
    status = 'completed';
  } else if (body.completed === false && status === undefined) {
    status = oldTodo.status === 'completed' ? 'inbox' : oldTodo.status || 'inbox';
  }

  if (status !== undefined) {
    if (status === 'completed' && oldTodo.status !== 'completed') {
      updates.status = 'completed';
      updates.completedAt = new Date();
    } else if (status !== 'completed' && oldTodo.status === 'completed') {
      updates.status = status;
      updates.completedAt = null;
    } else if (status !== 'completed') {
      updates.status = status;
    }
  }

  return { error: null, updates, status };
};

const logActivity = async (userId, action, entityType, entityId, entityTitle, details = {}) => {
  try {
    await Activity.create({ userId, action, entityType, entityId, entityTitle, details });
  } catch (e) { /* silently fail */ }
};

export const createTodo = async (req, res) => {
  try {
    let todoData = { ...req.body, userId: req.userId };

    // If natural language parsing is requested
    if (req.body.parseNaturalLanguage) {
      const parsed = parseNaturalLanguage(req.body.title);
      todoData.title = parsed.title;
      if (parsed.dueDate) todoData.dueDate = parsed.dueDate;
      if (parsed.dueTime) todoData.dueTime = parsed.dueTime;
      if (parsed.priority) todoData.priority = parsed.priority;
      if (parsed.tags.length) todoData.tags = parsed.tags;
      if (parsed.recurrence) todoData.recurrence = parsed.recurrence;
    }

    if (!todoData.title || !todoData.title.trim()) {
      return res.status(400).json({ error: 'Title is required' });
    }

    todoData.title = todoData.title.trim();

    const resolved = resolveCompletion(todoData, {});
    if (resolved.error) return res.status(400).json({ error: resolved.error });
    delete todoData.completed;
    Object.assign(todoData, resolved.updates);

    // Get max order for positioning
    const maxOrder = await Todo.findOne({ userId: req.userId, status: todoData.status || 'inbox' })
      .sort({ order: -1 }).select('order');
    todoData.order = (maxOrder?.order || 0) + 1;

    const todo = await Todo.create(todoData);

    // Update tag counts
    if (todo.tags?.length) {
      for (const tagName of todo.tags) {
        await Tag.findOneAndUpdate(
          { userId: req.userId, name: tagName },
          { $inc: { count: 1 } },
          { upsert: true }
        );
      }
    }

    await logActivity(req.userId, 'created', 'todo', todo._id, todo.title);

    res.status(201).json({ todo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const parseTodo = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: 'Text is required' });
    }
    res.json({ parsed: parseNaturalLanguage(String(text)) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTodos = async (req, res) => {
  try {
    const { status, projectId, tag, priority, search, sort, dueBefore, dueAfter, isMyDay,
            isImportant, isFavorite, category, page = 1, limit = 100 } = req.query;

    const query = { userId: req.userId, deletedAt: null };

    if (status) query.status = status;
    if (projectId) query.projectId = projectId;
    if (tag) query.tags = { $in: Array.isArray(tag) ? tag : [tag] };
    if (priority) query.priority = parseInt(priority);
    if (category) query.category = category;
    if (isMyDay === 'true') query.isMyDay = true;
    if (isImportant === 'true') query.isImportant = true;
    if (isFavorite === 'true') query.isFavorite = true;
    if (dueBefore) query.dueDate = { ...query.dueDate, $lte: new Date(dueBefore) };
    if (dueAfter) query.dueDate = { ...query.dueDate, $gte: new Date(dueAfter) };
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } }
      ];
    }

    let sortObj = { isPinned: -1, order: 1, createdAt: -1 };
    if (sort === 'dueDate') sortObj = { dueDate: 1, priority: 1 };
    if (sort === 'priority') sortObj = { priority: 1, dueDate: 1 };
    if (sort === 'title') sortObj = { title: 1 };
    if (sort === 'created') sortObj = { createdAt: -1 };
    if (sort === 'completed') sortObj = { completedAt: -1 };

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [todos, total] = await Promise.all([
      Todo.find(query).populate('projectRef', 'name').sort(sortObj).skip(skip).limit(parseInt(limit)),
      Todo.countDocuments(query)
    ]);

    res.json({ todos, total, page: parseInt(page), pages: Math.ceil(total / parseInt(limit)) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTodo = async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, userId: req.userId });
    if (!todo) return res.status(404).json({ error: 'Todo not found' });
    res.json({ todo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTodo = async (req, res) => {
  try {
    const oldTodo = await Todo.findOne({ _id: req.params.id, userId: req.userId });
    if (!oldTodo) return res.status(404).json({ error: 'Todo not found' });

    const updates = { ...req.body };
    delete updates.userId;
    delete updates.completed;

    // Normalize status aliases and boolean `completed` before the change logic below
    const resolved = resolveCompletion(req.body, oldTodo);
    if (resolved.error) return res.status(400).json({ error: resolved.error });
    delete updates.status;
    Object.assign(updates, resolved.updates);

    // Track status change
    const newStatus = updates.status ?? oldTodo.status;
    if (newStatus === 'completed' && oldTodo.status !== 'completed') {
      updates.completedAt = new Date();
      await logActivity(req.userId, 'completed', 'todo', oldTodo._id, oldTodo.title);
    } else if (newStatus !== oldTodo.status && oldTodo.status === 'completed') {
      updates.completedAt = null;
      await logActivity(req.userId, 'reopened', 'todo', oldTodo._id, oldTodo.title);
    }

    if (updates.priority && updates.priority !== oldTodo.priority) {
      await logActivity(req.userId, 'priority-changed', 'todo', oldTodo._id, oldTodo.title,
        { from: oldTodo.priority, to: updates.priority });
    }

    if (updates.dueDate && (!oldTodo.dueDate || new Date(updates.dueDate).getTime() !== new Date(oldTodo.dueDate).getTime())) {
      await logActivity(req.userId, 'due-date-changed', 'todo', oldTodo._id, oldTodo.title,
        { from: oldTodo.dueDate, to: updates.dueDate });
    }

    // Handle tag changes
    if (updates.tags) {
      const removedTags = oldTodo.tags.filter(t => !updates.tags.includes(t));
      const addedTags = updates.tags.filter(t => !oldTodo.tags.includes(t));
      for (const t of removedTags) {
        await Tag.findOneAndUpdate({ userId: req.userId, name: t }, { $inc: { count: -1 } });
      }
      for (const t of addedTags) {
        await Tag.findOneAndUpdate({ userId: req.userId, name: t }, { $inc: { count: 1 } }, { upsert: true });
      }
    }

    const todo = await Todo.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!updates.status || updates.status === oldTodo.status) {
      await logActivity(req.userId, 'updated', 'todo', oldTodo._id, oldTodo.title);
    }

    res.json({ todo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTodo = async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, userId: req.userId });
    if (!todo) return res.status(404).json({ error: 'Todo not found' });

    // Soft delete
    await Todo.findByIdAndUpdate(req.params.id, { deletedAt: new Date() });
    await logActivity(req.userId, 'deleted', 'todo', todo._id, todo.title);

    res.json({ message: 'Todo moved to trash', todo, todoId: req.params.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const permanentlyDeleteTodo = async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, userId: req.userId });
    if (!todo) return res.status(404).json({ error: 'Todo not found' });

    await Todo.findByIdAndDelete(req.params.id);
    await logActivity(req.userId, 'permanently-deleted', 'todo', todo._id, todo.title);

    res.json({ message: 'Todo permanently deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const restoreTodo = async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, userId: req.userId });
    if (!todo) return res.status(404).json({ error: 'Todo not found' });

    await Todo.findByIdAndUpdate(req.params.id, { deletedAt: null });
    await logActivity(req.userId, 'restored', 'todo', todo._id, todo.title);

    res.json({ todo: await Todo.findById(req.params.id) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const duplicateTodo = async (req, res) => {
  try {
    const todo = await Todo.findOne({ _id: req.params.id, userId: req.userId });
    if (!todo) return res.status(404).json({ error: 'Todo not found' });

    const todoObj = todo.toObject();
    delete todoObj._id;
    delete todoObj.createdAt;
    delete todoObj.updatedAt;
    todoObj.title = `${todo.title} (copy)`;
    todoObj.status = 'inbox';
    todoObj.completedAt = null;
    todoObj.deletedAt = null;

    const newTodo = await Todo.create(todoObj);
    await logActivity(req.userId, 'created', 'todo', newTodo._id, newTodo.title, { copiedFrom: todo._id });

    res.status(201).json({ todo: newTodo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const archiveTodo = async (req, res) => {
  try {
    const todo = await Todo.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { status: 'archived', archivedAt: new Date() },
      { new: true }
    );
    if (!todo) return res.status(404).json({ error: 'Todo not found' });

    await logActivity(req.userId, 'archived', 'todo', todo._id, todo.title);

    res.json({ message: 'Todo archived', todo });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const snoozeTodo = async (req, res) => {
  try {
    const { until } = req.body;
    const todo = await Todo.findOne({ _id: req.params.id, userId: req.userId });
    if (!todo) return res.status(404).json({ error: 'Todo not found' });

    const snoozeDate = new Date(until || Date.now() + 24 * 60 * 60 * 1000);
    if (Number.isNaN(snoozeDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date provided' });
    }

    const updated = await Todo.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { dueDate: snoozeDate, reminder: snoozeDate },
      { new: true }
    );

    res.json({ message: 'Todo snoozed', until: snoozeDate, todo: updated });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const bulkUpdateTodos = async (req, res) => {
  try {
    const { ids, updates } = req.body;
    if (!ids?.length) return res.status(400).json({ error: 'No todo IDs provided' });

    const cleanUpdates = { ...updates };
    delete cleanUpdates.userId;
    delete cleanUpdates.completed;

    if (cleanUpdates.status !== undefined) {
      const status = normalizeStatus(cleanUpdates.status);
      if (!VALID_STATUSES.includes(status)) {
        return res.status(400).json({ error: `Invalid status: ${cleanUpdates.status}` });
      }
      cleanUpdates.status = status;
    }

    const result = await Todo.updateMany(
      { _id: { $in: ids }, userId: req.userId },
      { $set: cleanUpdates }
    );

    res.json({ updated: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const bulkDeleteTodos = async (req, res) => {
  try {
    const { ids } = req.body;
    if (!ids?.length) return res.status(400).json({ error: 'No todo IDs provided' });

    const result = await Todo.updateMany(
      { _id: { $in: ids }, userId: req.userId },
      { $set: { deletedAt: new Date() } }
    );

    res.json({ deleted: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getMyDay = async (req, res) => {
  try {
    const today = getStartOfDay();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const [myDayTasks, overdueTasks, todayTasks, importantTasks, yesterdayUnfinished] = await Promise.all([
      Todo.find({ userId: req.userId, isMyDay: true, deletedAt: null }).sort({ myDayOrder: 1, priority: 1 }),
      Todo.find({ userId: req.userId, dueDate: { $lt: today }, status: { $nin: ['completed', 'archived'] }, deletedAt: null }).sort({ dueDate: 1 }),
      Todo.find({ userId: req.userId, dueDate: { $gte: today, $lt: tomorrow }, status: { $nin: ['completed', 'archived'] }, deletedAt: null }),
      Todo.find({ userId: req.userId, isImportant: true, status: { $nin: ['completed', 'archived'] }, deletedAt: null, isMyDay: false }).limit(5),
      Todo.find({ userId: req.userId, isMyDay: true, status: { $nin: ['completed'] }, updatedAt: { $gte: yesterday, $lt: today }, deletedAt: null })
    ]);

    // Deduplicate
    const allIds = new Set();
    const dedup = (arr) => arr.filter(t => {
      if (allIds.has(t._id.toString())) return false;
      allIds.add(t._id.toString());
      return true;
    });

    res.json({
      myDay: dedup(myDayTasks),
      overdue: dedup(overdueTasks),
      today: dedup(todayTasks),
      suggested: dedup(importantTasks),
      unfinishedYesterday: dedup(yesterdayUnfinished)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const reorderMyDay = async (req, res) => {
  try {
    const { orderedIds } = req.body;
    for (let i = 0; i < orderedIds.length; i++) {
      await Todo.findOneAndUpdate(
        { _id: orderedIds[i], userId: req.userId },
        { myDayOrder: i }
      );
    }
    res.json({ message: 'Reordered' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTrash = async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.userId, deletedAt: { $ne: null } })
      .sort({ deletedAt: -1 });
    res.json({ todos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const emptyTrash = async (req, res) => {
  try {
    const result = await Todo.deleteMany({ userId: req.userId, deletedAt: { $ne: null } });
    res.json({ deleted: result.deletedCount });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
