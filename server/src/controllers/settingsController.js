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

export const updateSettings = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.userId, req.body, { new: true });
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
