import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import todoRoutes from './routes/todos.js';
import projectRoutes from './routes/projects.js';
import tagRoutes from './routes/tags.js';
import habitRoutes from './routes/habits.js';
import goalRoutes from './routes/goals.js';
import templateRoutes from './routes/templates.js';
import noteRoutes from './routes/notes.js';
import settingsRoutes from './routes/settings.js';
import activityRoutes from './routes/activity.js';
import notificationRoutes from './routes/notifications.js';
import authRoutes from './routes/auth.js';
import statsRoutes from './routes/stats.js';
import searchRoutes from './routes/search.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));
app.use(compression());
app.use(morgan('combined'));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// CORS
app.use(cors({
  origin: process.env.CORS_ORIGIN || '*',
  credentials: true
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/todos', todoRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/tags', tagRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/goals', goalRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/notes', noteRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/stats', statsRoutes);
app.use('/api/search', searchRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Serve static frontend in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '../../client/dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message
  });
});

// Connect to MongoDB and start server
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI is not defined');
  process.exit(1);
}

mongoose.connect(MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

export default app;
