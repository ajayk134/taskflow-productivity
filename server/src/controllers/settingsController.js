import User from '../models/User.js';

export const getSettings = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({
      settings: {
        theme: user.theme,
        accentColor: user.accentColor,
        timezone: user.timezone,
        dateFormat: user.dateFormat,
        defaultView: user.defaultView,
        weekStartsOn: user.weekStartsOn,
        notifications: user.notifications,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const ALLOWED_SETTINGS = [
  'theme', 'accentColor', 'timezone', 'dateFormat', 'defaultView', 'weekStartsOn', 'notifications', 'name'
];

export const updateSettings = async (req, res) => {
  try {
    const updatable = {};
    for (const key of ALLOWED_SETTINGS) {
      if (key in req.body) updatable[key] = req.body[key];
    }
    if (updatable.notifications !== undefined && (typeof updatable.notifications !== 'object' || updatable.notifications === null)) {
      return res.status(400).json({ error: 'Invalid notifications payload' });
    }
    if (updatable.theme !== undefined && !['light', 'dark', 'system'].includes(updatable.theme)) {
      return res.status(400).json({ error: 'Invalid theme' });
    }
    if (updatable.defaultView !== undefined && !['inbox', 'my-day', 'today', 'upcoming', 'kanban', 'calendar', 'list', 'compact', 'timeline'].includes(updatable.defaultView)) {
      return res.status(400).json({ error: 'Invalid default view' });
    }
    if (updatable.weekStartsOn !== undefined && ![0, 1].includes(Number(updatable.weekStartsOn))) {
      return res.status(400).json({ error: 'Invalid week start' });
    }

    const user = await User.findByIdAndUpdate(req.userId, updatable, { new: true, runValidators: true });
    res.json({
      settings: {
        theme: user.theme,
        accentColor: user.accentColor,
        timezone: user.timezone,
        dateFormat: user.dateFormat,
        defaultView: user.defaultView,
        weekStartsOn: user.weekStartsOn,
        notifications: user.notifications,
        name: user.name,
        email: user.email
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
