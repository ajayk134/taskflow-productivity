import { create } from 'zustand';
import api from '../utils/api';

const useProjectStore = create((set) => ({
  projects: [],
  currentProject: null,
  isLoading: false,

  fetchProjects: async (params = {}) => {
    set({ isLoading: true });
    try {
      const { projects } = await api.get('/projects', { includeStats: 'true', ...params });
      set({ projects, isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  fetchProject: async (id) => {
    const { project } = await api.get(`/projects/${id}`);
    set({ currentProject: project });
    return project;
  },

  createProject: async (data) => {
    const { project } = await api.post('/projects', data);
    set(state => ({ projects: [project, ...state.projects] }));
    return project;
  },

  updateProject: async (id, data) => {
    const { project } = await api.put(`/projects/${id}`, data);
    set(state => ({
      projects: state.projects.map(p => p._id === id ? project : p),
      currentProject: state.currentProject?._id === id ? project : state.currentProject
    }));
    return project;
  },

  deleteProject: async (id) => {
    await api.delete(`/projects/${id}`);
    set(state => ({ projects: state.projects.filter(p => p._id !== id) }));
  },

  archiveProject: async (id) => {
    const { project } = await api.post(`/projects/${id}/archive`);
    set(state => ({
      projects: state.projects.map(p => p._id === id ? project : p)
    }));
    return project;
  }
}));

export { useProjectStore };
export default useProjectStore;
