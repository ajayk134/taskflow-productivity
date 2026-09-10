import Tag from '../models/Tag.js';
import Todo from '../models/Todo.js';

export const createTag = async (req, res) => {
  try {
    const { name, color } = req.body;
    if (!name) return res.status(400).json({ error: 'Name is required' });

    const tag = await Tag.findOneAndUpdate(
      { userId: req.userId, name: name.toLowerCase().trim() },
      { $setOnInsert: { userId: req.userId, name: name.toLowerCase().trim(), color: color || '#6366f1' } },
      { upsert: true, new: true }
    );
    res.status(201).json({ tag });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const getTags = async (req, res) => {
  try {
    const tags = await Tag.find({ userId: req.userId }).sort({ name: 1 });
    res.json({ tags });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const updateTag = async (req, res) => {
  try {
    const tag = await Tag.findOneAndUpdate(
      { _id: req.params.id, userId: req.userId },
      req.body,
      { new: true }
    );
    if (!tag) return res.status(404).json({ error: 'Tag not found' });

    // Update tag name in all todos if name changed
    if (req.body.name) {
      await Todo.updateMany(
        { userId: req.userId, tags: tag.name },
        { $set: { 'tags.$': req.body.name.toLowerCase().trim() } }
      );
    }

    res.json({ tag });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

export const deleteTag = async (req, res) => {
  try {
    const tag = await Tag.findOne({ _id: req.params.id, userId: req.userId });
    if (!tag) return res.status(404).json({ error: 'Tag not found' });

    await Tag.findByIdAndDelete(req.params.id);
    await Todo.updateMany({ userId: req.userId, tags: tag.name }, { $pull: { tags: tag.name } });

    res.json({ message: 'Tag deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
