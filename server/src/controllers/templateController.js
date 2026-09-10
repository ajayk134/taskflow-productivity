import Template from '../models/Template.js';
import Todo from '../models/Todo.js';

export const createTemplate = async (req, res) => {
  try {
    const template = await Template.create({ ...req.body, userId: req.userId });
    res.status(201).json({ template });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTemplates = async (req, res) => {
  try {
    const templates = await Template.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json({ templates });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTemplate = async (req, res) => {
  try {
    const template = await Template.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!template) return res.status(404).json({ error: 'Template not found' });
    res.json({ template });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTemplate = async (req, res) => {
  try {
    await Template.findOneAndDelete({ _id: req.params.id, userId: req.userId });
    res.json({ message: 'Template deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const createTodosFromTemplate = async (req, res) => {
  try {
    const template = await Template.findOne({ _id: req.params.id, userId: req.userId });
    if (!template) return res.status(404).json({ error: 'Template not found' });

    const todos = [];
    for (const item of template.items) {
      const todo = await Todo.create({
        userId: req.userId,
        title: item.title,
        priority: item.priority,
        estimatedDuration: item.estimatedDuration,
        tags: template.tags || [],
        category: template.category || '',
        projectId: req.body.projectId || null,
        subtasks: item.subtasks?.map(s => ({ title: s.title })) || [],
        checklist: item.checklist?.map(c => ({ text: c.text })) || [],
        templateId: template._id
      });
      todos.push(todo);
    }

    res.status(201).json({ todos });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
