import Note from '../models/Note.js';
import Activity from '../models/Activity.js';

export const createNote = async (req, res) => {
  try {
    const note = await Note.create({ ...req.body, userId: req.userId });
    await Activity.create({ userId: req.userId, action: 'note-created', entityType: 'note', entityId: note._id, entityTitle: note.title });
    res.status(201).json({ note });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getNotes = async (req, res) => {
  try {
    const { projectId, todoId, search, isArchived } = req.query;
    const query = { userId: req.userId, deletedAt: null };
    if (projectId) query.projectId = projectId;
    if (todoId) query.todoId = todoId;
    if (isArchived === 'true') query.isArchived = true;
    else query.isArchived = false;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { content: { $regex: search, $options: 'i' } }
      ];
    }

    const notes = await Note.find(query).sort({ isPinned: -1, updatedAt: -1 });
    res.json({ notes });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateNote = async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json({ note });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      { deletedAt: new Date() },
      { new: true }
    );
    if (!note) return res.status(404).json({ error: 'Note not found' });
    res.json({ message: 'Note deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
