import { create } from 'zustand';
import api from '../utils/api';

const useUIStore = create((set, get) => ({
  sidebarOpen: true,
  sidebarCollapsed: false,
  commandPaletteOpen: false,
  currentView: 'inbox',
  modalOpen: null,
  selectedTodos: [],
  theme: localStorage.getItem('taskflow_theme') || 'system',

  toggleSidebar: () => set(state => ({ sidebarOpen: !state.sidebarOpen })),
  collapseSidebar: () => set(state => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),
  toggleCommandPalette: () => set(state => ({ commandPaletteOpen: !state.commandPaletteOpen })),
  openModal: (modal) => set({ modalOpen: modal }),
  closeModal: () => set({ modalOpen: null }),
  setCurrentView: (view) => set({ currentView: view }),
  
  toggleSelectTodo: (id) => set(state => ({
    selectedTodos: state.selectedTodos.includes(id)
      ? state.selectedTodos.filter(i => i !== id)
      : [...state.selectedTodos, id]
  })),
  selectAllTodos: (ids) => set({ selectedTodos: ids }),
  clearSelection: () => set({ selectedTodos: [] }),

  setTheme: (theme) => {
    localStorage.setItem('taskflow_theme', theme);
    set({ theme });
    applyTheme(theme);
  }
}));

export function applyTheme(theme) {
  const isDark = theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  if (isDark) {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}

// Initialize theme
applyTheme(localStorage.getItem('taskflow_theme') || 'system');

export { useUIStore };
export default useUIStore;
