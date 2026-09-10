import Todo from '../models/Todo.js';

export const searchTodos = async (req, res) => {
  try {
    const { q, priority, status, due, tag, project, category } = req.query;
    const query = { userId: req.userId, deletedAt: null };

    // Parse search operators from query string
    if (q) {
      // Check for operators like priority:high
      const operatorPatterns = {
        priority: { regex: /priority:(\w+)/i, map: { high: 2, medium: 3, low: 4, urgent: 1, p1: 1, p2: 2, p3: 3, p4: 4 } },
        status: { regex: /status:(\w[\w-]*)/i },
        due: { regex: /due:(\w+)/i },
        tag: { regex: /tag:(\w+)/i },
        project: { regex: /project:(\w[\w\s]*)/i }
      };

      let searchText = q;

      for (const [key, config] of Object.entries(operatorPatterns)) {
        const match = searchText.match(config.regex);
        if (match) {
          searchText = searchText.replace(match[0], '').trim();
          if (key === 'priority' && config.map) {
            query.priority = config.map[match[1].toLowerCase()] || parseInt(match[1]);
          } else if (key === 'status') {
            query.status = match[1].toLowerCase().replace('-', '-');
          } else if (key === 'due') {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (match[1].toLowerCase() === 'today') {
              query.dueDate = { $gte: today, $lte: new Date(today.getTime() + 86400000) };
            } else if (match[1].toLowerCase() === 'overdue') {
              query.dueDate = { $lt: today };
              query.status = { $nin: ['completed', 'archived'] };
            } else if (match[1].toLowerCase() === 'week') {
              const endWeek = new Date(today);
              endWeek.setDate(endWeek.getDate() + 7);
              query.dueDate = { $gte: today, $lte: endWeek };
            }
          } else if (key === 'tag') {
            query.tags = match[1].toLowerCase();
          }
        }
      }

      if (searchText) {
        query.$or = [
          { title: { $regex: searchText, $options: 'i' } },
          { description: { $regex: searchText, $options: 'i' } },
          { notes: { $regex: searchText, $options: 'i' } }
        ];
      }
    }

    // Apply additional filters
    if (priority) query.priority = parseInt(priority);
    if (status) query.status = status;
    if (tag) query.tags = { $in: Array.isArray(tag) ? tag : [tag] };
    if (project) query.projectId = project;
    if (category) query.category = category;

    const todos = await Todo.find(query).sort({ isPinned: -1, priority: 1, dueDate: 1 }).limit(50);

    res.json({ todos, total: todos.length });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const exportData = async (req, res) => {
  try {
    const userId = req.userId;
    const Todo_model = (await import('../models/Todo.js')).default;
    const Project_model = (await import('../models/Project.js')).default;
    const Tag_model = (await import('../models/Tag.js')).default;
    const Habit_model = (await import('../models/Habit.js')).default;
    const Goal_model = (await import('../models/Goal.js')).default;
    const Template_model = (await import('../models/Template.js')).default;
    const Note_model = (await import('../models/Note.js')).default;

    const [todos, projects, tags, habits, goals, templates, notes] = await Promise.all([
      Todo_model.find({ userId, deletedAt: null }),
      Project_model.find({ userId, deletedAt: null }),
      Tag_model.find({ userId }),
      Habit_model.find({ userId }),
      Goal_model.find({ userId, deletedAt: null }),
      Template_model.find({ userId }),
      Note_model.find({ userId, deletedAt: null })
    ]);

    const backup = {
      version: '1.0',
      exportDate: new Date().toISOString(),
      data: { todos, projects, tags, habits, goals, templates, notes }
    };

    res.setHeader('Content-Disposition', 'attachment; filename=taskflow-backup.json');
    res.json(backup);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const exportCSV = async (req, res) => {
  try {
    const todos = await Todo.find({ userId: req.userId, deletedAt: null }).sort({ createdAt: -1 });

    const headers = ['Title', 'Status', 'Priority', 'Due Date', 'Project', 'Tags', 'Description', 'Created', 'Completed'];
    const rows = todos.map(t => [
      `"${(t.title || '').replace(/"/g, '""')}"`,
      t.status,
      t.priority,
      t.dueDate ? new Date(t.dueDate).toISOString().split('T')[0] : '',
      t.projectId || '',
      (t.tags || []).join('; '),
      `"${(t.description || '').replace(/"/g, '""')}"`,
      new Date(t.createdAt).toISOString().split('T')[0],
      t.completedAt ? new Date(t.completedAt).toISOString().split('T')[0] : ''
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=tasks.csv');
    res.send(csv);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const importData = async (req, res) => {
  try {
    const { data, overwrite } = req.body;
    if (!data) return res.status(400).json({ error: 'No data provided' });

    const userId = req.userId;
    const results = { todos: 0, projects: 0, tags: 0, habits: 0, goals: 0 };

    if (data.todos) {
      for (const todo of data.todos) {
        todo.userId = userId;
        delete todo._id;
        delete todo.__v;
        delete todo.createdAt;
        delete todo.updatedAt;
        await Todo.create(todo);
        results.todos++;
      }
    }

    if (data.projects) {
      for (const project of data.projects) {
        project.userId = userId;
        delete project._id;
        delete project.__v;
        await (await import('../models/Project.js')).default.create(project);
        results.projects++;
      }
    }

    if (data.tags) {
      for (const tag of data.tags) {
        tag.userId = userId;
        delete tag._id;
        await (await import('../models/Tag.js')).default.findOneAndUpdate(
          { userId, name: tag.name },
          { $setOnInsert: tag },
          { upsert: true }
        );
        results.tags++;
      }
    }

    res.json({ message: 'Import completed', results });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
