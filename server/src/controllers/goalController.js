import Goal from '../models/Goal.js';
import Activity from '../models/Activity.js';

export const createGoal = async (req, res) => {
  try {
    const goal = await Goal.create({ ...req.body, userId: req.userId });
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
      req.body,
      { new: true }
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

    goal.milestones.push(req.body);
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

    Object.assign(milestone, req.body);
    if (req.body.completed && !milestone.completedAt) {
      milestone.completedAt = new Date();
    }
    await goal.save();
    res.json({ goal });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
