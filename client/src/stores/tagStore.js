import { create } from 'zustand';
import api from '../utils/api';

export const DEFAULT_TAG_COLOR = '#6366f1';

const useTagStore = create((set, get) => ({
  tags: [],
  loaded: false,

  fetchTags: async (force = false) => {
    if (get().loaded && !force) return get().tags;
    try {
      const { tags } = await api.get('/tags');
      set({ tags, loaded: true });
      return tags;
    } catch {
      return get().tags;
    }
  },

  createTag: async ({ name, color }) => {
    const { tag } = await api.post('/tags', { name, color: color || DEFAULT_TAG_COLOR });
    set((state) => ({
      tags: [tag, ...state.tags.filter((t) => t.name !== tag.name)],
      loaded: true,
    }));
    return tag;
  },

  colorFor: (name) => {
    if (!name) return DEFAULT_TAG_COLOR;
    const clean = name.toLowerCase().trim();
    const tag = get().tags.find((t) => (t.name || '').toLowerCase().trim() === clean);
    return tag?.color || DEFAULT_TAG_COLOR;
  },

  styleFor: (name) => {
    const color = get().colorFor(name);
    return { backgroundColor: `${color}1F`, color };
  },
}));

export { useTagStore };
export default useTagStore;