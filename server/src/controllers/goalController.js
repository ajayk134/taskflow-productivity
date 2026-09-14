import Goal from '../models/Goal.js';
import Activity from '../models/Activity.js';

const pick = (obj, keys) => {
  const out = {};
  for (const key of keys) {
    if (key in obj) out[key] = obj[key];
  }
  return out;
};

const GOAL_FIELDS = ['title', 'description', 'color', 'icon', 'targetDate', 'progress', 'status', 'category'];
const MILESTONE_FIELDS = ['name', 'targetDate', 'completed', 'order', 'description'];

export const createGoal = async (req, res) => {
  try {
    const goal = await Goal.create({ ...pick(req.body, GOAL_FIELDS), userId: req.userId });
    await Activity.create({ userId: req.userId, action: 'goal-created', entityType: 'goal', entityId: goal._id, entityTitle: goal.title });
    res.status(201).json({ goal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getGoals = async (req, res) => {
  try {
    const { status } = req.query;
    const query = { userId: req.userId, deletedAt: null };
    if (status) query.status = status;

    const goals = await Goal.find(query).sort({ createdAt: -1 });
    res.json({ goals });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      pick(req.body, GOAL_FIELDS),
      { new: true, runValidators: true }
    );
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    await Activity.create({ userId: req.userId, action: 'goal-updated', entityType: 'goal', entityId: goal._id, entityTitle: goal.title });
    res.json({ goal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteGoal = async (req, res) => {
  try {
    const goal = await Goal.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { deletedAt: new Date() },
      { new: true }
    );
    if (!goal) return res.status(404).json({ error: 'Goal not found' });
    res.json({ message: 'Goal deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addMilestone = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    const milestoneData = pick(req.body || {}, MILESTONE_FIELDS);
    if (!milestoneData.name) {
      return res.status(400).json({ error: 'Milestone name is required' });
    }
    milestoneData.order = goal.milestones.length;
    goal.milestones.push(milestoneData);
    await goal.save();
    res.json({ goal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateMilestone = async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.userId });
    if (!goal) return res.status(404).json({ error: 'Goal not found' });

    const milestone = goal.milestones.id(req.params.milestoneId);
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });

    if (req.body && req.body._id !== undefined) {
      return res.status(400).json({ error: 'Cannot change milestone id' });
    }
    const milestoneData = pick(req.body || {}, MILESTONE_FIELDS);
    Object.assign(milestone, milestoneData);
    if (req.body.completed && !milestone.completedAt) {
      milestone.completedAt = new Date();
    }
    await goal.save();
    res.json({ goal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
