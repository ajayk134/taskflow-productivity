import Note from '../models/Note.js';
import Activity from '../models/Activity.js';

const pick = (obj, keys) => {
  const out = {};
  for (const key of keys) {
    if (key in obj) out[key] = obj[key];
  }
  return out;
};

const NOTE_FIELDS = ['title', 'content', 'projectId', 'todoId', 'tags', 'isPinned', 'isArchived', 'color'];

const escapeRegex = (str) => String(str).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

export const createNote = async (req, res) => {
  try {
    const noteData = pick(req.body, NOTE_FIELDS);
    noteData.userId = req.userId;
    if (noteData.title) noteData.title = noteData.title.trim();
    const note = await Note.create(noteData);
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
      const safe = escapeRegex(search);
      query.$or = [
        { title: { $regex: safe, $options: 'i' } },
        { content: { $regex: safe, $options: 'i' } }
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
      pick(req.body, NOTE_FIELDS),
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
