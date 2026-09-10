import { create } from 'zustand';
import api from '../utils/api';

const useAuthStore = create((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,

  init: async () => {
    const token = localStorage.getItem('taskflow_token');
    if (!token) {
      set({ isLoading: false });
      return;
    }
    api.setToken(token);
    try {
      const { user } = await api.get('/auth/profile');
      set({ user, isAuthenticated: true, isLoading: false });
    } catch {
      api.setToken(null);
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    const { token, user } = await api.post('/auth/login', { email, password });
    api.setToken(token);
    set({ user, isAuthenticated: true });
  },

  register: async ({ name, email, password } = {}) => {
    const { token, user } = await api.post('/auth/register', { name, email, password });
    api.setToken(token);
    set({ user, isAuthenticated: true });
  },

  logout: () => {
    api.setToken(null);
    set({ user: null, isAuthenticated: false });
  },

  updateProfile: async (updates) => {
    const { user } = await api.put('/auth/profile', updates);
    set({ user });
  }
}));

export { useAuthStore };
export default useAuthStore;
