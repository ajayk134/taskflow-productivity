import Project from '../models/Project.js';
import Todo from '../models/Todo.js';
import Activity from '../models/Activity.js';

export const createProject = async (req, res) => {
  try {
    const maxOrder = await Project.findOne({ userId: req.userId }).sort({ order: -1 }).select('order');
    const project = await Project.create({
      ...req.body,
      userId: req.userId,
      order: (maxOrder?.order || 0) + 1,
      sections: req.body.sections || [
        { name: 'To Do', order: 0 },
        { name: 'In Progress', order: 1 },
        { name: 'Done', order: 2 }
      ]
    });
    await Activity.create({ userId: req.userId, action: 'project-created', entityType: 'project', entityId: project._id, entityTitle: project.name });
    res.status(201).json({ project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProjects = async (req, res) => {
  try {
    const { status, includeStats } = req.query;
    const query = { userId: req.userId, deletedAt: null };
    if (status) query.status = status;

    const projects = await Project.find(query).sort({ order: 1, createdAt: -1 });

    if (includeStats === 'true') {
      const projectsWithStats = await Promise.all(projects.map(async (p) => {
        const [totalTodos, completedTodos] = await Promise.all([
          Todo.countDocuments({ projectId: p._id, deletedAt: null }),
          Todo.countDocuments({ projectId: p._id, status: 'completed', deletedAt: null })
        ]);
        return { ...p.toJSON(), totalTodos, completedTodos, progress: totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0 };
      }));
      return res.json({ projects: projectsWithStats });
    }

    res.json({ projects });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getProject = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const [totalTodos, completedTodos] = await Promise.all([
      Todo.countDocuments({ projectId: project._id, deletedAt: null }),
      Todo.countDocuments({ projectId: project._id, status: 'completed', deletedAt: null })
    ]);

    res.json({
      project: {
        ...project.toJSON(),
        totalTodos,
        completedTodos,
        progress: totalTodos > 0 ? Math.round((completedTodos / totalTodos) * 100) : 0
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const pick = (obj, keys) => {
  const out = {};
  for (const key of keys) {
    if (key in obj) out[key] = obj[key];
  }
  return out;
};

const PROJECT_FIELDS = ['name', 'description', 'icon', 'color', 'status', 'startDate', 'targetDate', 'sections', 'isFavorite', 'order'];
const SECTION_FIELDS = ['name', 'order', 'color'];

export const updateProject = async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      pick(req.body, PROJECT_FIELDS),
      { new: true, runValidators: true }
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });
    await Activity.create({ userId: req.userId, action: 'project-updated', entityType: 'project', entityId: project._id, entityTitle: project.name });
    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    await Project.findByIdAndUpdate(req.params.id, { deletedAt: new Date() });
    // Move todos to inbox (scoped to the user so we never touch another user's rows)
    await Todo.updateMany(
      { projectId: req.params.id, userId: req.userId },
      { $set: { projectId: null, status: 'inbox', sectionId: null } }
    );

    res.json({ message: 'Project deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const archiveProject = async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { status: 'archived', archivedAt: new Date() },
      { new: true }
    );
    if (!project) return res.status(404).json({ error: 'Project not found' });
    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const addSection = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    if (!req.body || typeof req.body !== 'object' || !req.body.name) {
      return res.status(400).json({ error: 'Section name is required' });
    }
    project.sections.push({ name: req.body.name, order: req.body.order ?? project.sections.length, color: req.body.color });
    await project.save();
    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateSection = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    const section = project.sections.id(req.params.sectionId);
    if (!section) return res.status(404).json({ error: 'Section not found' });

    if (req.body && req.body._id !== undefined) {
      return res.status(400).json({ error: 'Cannot change section id' });
    }
    Object.assign(section, pick(req.body || {}, SECTION_FIELDS));
    await project.save();
    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteSection = async (req, res) => {
  try {
    const project = await Project.findOne({ _id: req.params.id, userId: req.userId });
    if (!project) return res.status(404).json({ error: 'Project not found' });

    project.sections = project.sections.filter(s => s._id.toString() !== req.params.sectionId);
    await project.save();
    res.json({ project });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
