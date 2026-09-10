import Activity from '../models/Activity.js';

export const getActivities = async (req, res) => {
  try {
    const { entityType, entityId, page = 1, limit = 50 } = req.query;
    const query = { userId: req.userId };
    if (entityType) query.entityType = entityType;
    if (entityId) query.entityId = entityId;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const [activities, total] = await Promise.all([
      Activity.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit)),
      Activity.countDocuments(query)
    ]);

    res.json({ activities, total, page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
