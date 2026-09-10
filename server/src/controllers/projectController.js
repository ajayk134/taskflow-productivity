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

export const updateProject = async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
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
    // Move todos to inbox
    await Todo.updateMany({ projectId: req.params.id }, { $set: { projectId: null, status: 'inbox' } });

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

    project.sections.push(req.body);
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

    Object.assign(section, req.body);
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
