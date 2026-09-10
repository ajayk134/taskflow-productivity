import { create } from 'zustand';
import api from '../utils/api';

const useTodoStore = create((set, get) => ({
  todos: [],
  currentTodo: null,
  myDay: null,
  trash: [],
  total: 0,
  page: 1,
  pages: 1,
  isLoading: false,
  filters: {},

  setFilters: (filters) => set({ filters }),

  fetchTodos: async (params = {}) => {
    set({ isLoading: true });
    try {
      const query = { ...get().filters, ...params };
      const { todos, total, page, pages } = await api.get('/todos', query);
      set({ todos, total, page, pages, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchTodo: async (id) => {
    const { todo } = await api.get(`/todos/${id}`);
    set({ currentTodo: todo });
    return todo;
  },

  createTodo: async (data) => {
    const { todo } = await api.post('/todos', data);
    set(state => ({ todos: [todo, ...state.todos] }));
    return todo;
  },

  updateTodo: async (id, data) => {
    const { todo } = await api.put(`/todos/${id}`, data);
    set(state => ({
      todos: state.todos.map(t => t._id === id ? todo : t),
      currentTodo: state.currentTodo?._id === id ? todo : state.currentTodo
    }));
    return todo;
  },

  deleteTodo: async (id) => {
    await api.delete(`/todos/${id}`);
    set(state => ({ todos: state.todos.filter(t => t._id !== id) }));
  },

  restoreTodo: async (id) => {
    const { todo } = await api.post(`/todos/${id}/restore`);
    set(state => ({ trash: state.trash.filter(t => t._id !== id) }));
    return todo;
  },

  duplicateTodo: async (id) => {
    const { todo } = await api.post(`/todos/${id}/duplicate`);
    set(state => ({ todos: [todo, ...state.todos] }));
    return todo;
  },

  archiveTodo: async (id) => {
    await api.post(`/todos/${id}/archive`);
    set(state => ({ todos: state.todos.filter(t => t._id !== id) }));
  },

  snoozeTodo: async (id, until) => {
    await api.post(`/todos/${id}/snooze`, { until });
  },

  fetchMyDay: async () => {
    const data = await api.get('/todos/my-day');
    set({ myDay: data });
    return data;
  },

  reorderMyDay: async (orderedIds) => {
    await api.post('/todos/my-day/reorder', { orderedIds });
  },

  fetchTrash: async () => {
    const { todos } = await api.get('/todos/trash');
    set({ trash: todos });
  },

  emptyTrash: async () => {
    await api.post('/todos/trash/empty');
    set({ trash: [] });
  },

  bulkUpdate: async (ids, updates) => {
    await api.post('/todos/bulk-update', { ids, updates });
    set(state => ({
      todos: state.todos.map(t => ids.includes(t._id) ? { ...t, ...updates } : t)
    }));
  },

  bulkDelete: async (ids) => {
    await api.post('/todos/bulk-delete', { ids });
    set(state => ({
      todos: state.todos.filter(t => !ids.includes(t._id))
    }));
  }
}));

export { useTodoStore };
export default useTodoStore;
