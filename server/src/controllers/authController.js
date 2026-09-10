import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import { generateToken } from '../middleware/auth.js';

export const register = async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      name: name.trim()
    });
    const token = generateToken(user._id);
    res.status(201).json({
      token,
      user: { id: user._id, email: user.email, name: user.name, theme: user.theme, accentColor: user.accentColor }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = generateToken(user._id);
    res.json({
      token,
      user: { id: user._id, email: user.email, name: user.name, theme: user.theme, accentColor: user.accentColor }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password;
    delete updates.email;
    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true });
    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
