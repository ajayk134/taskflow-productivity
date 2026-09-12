import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './stores/authStore';
import useUIStore from './stores/uiStore';
import Layout from './components/layout/Layout';
import SearchModal from './components/search/SearchModal';
import CommandPalette from './components/common/CommandPalette';
import FocusMode from './components/focus/FocusMode';
import QuickAdd from './components/todo/QuickAdd';
import Login from './pages/Login';
import Register from './pages/Register';
import Inbox from './pages/Inbox';
import MyDay from './pages/MyDay';
import Upcoming from './pages/Upcoming';
import Important from './pages/Important';
import Completed from './pages/Completed';
import Trash from './pages/Trash';
import Calendar from './pages/Calendar';
import Kanban from './pages/Kanban';
import Habits from './pages/Habits';
import Goals from './pages/Goals';
import Analytics from './pages/Analytics';
import Notes from './pages/Notes';
import Settings from './pages/Settings';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';

function App() {
  const { isAuthenticated, isLoading, init } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const [initialized, setInitialized] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [focusOpen, setFocusOpen] = useState(false);

  useEffect(() => {
    init().finally(() => setInitialized(true));
  }, [init]);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else if (theme === 'light') {
      root.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.classList.toggle('dark', prefersDark);
    }
  }, [theme]);

  useEffect(() => {
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e) => {
      document.documentElement.classList.toggle('dark', e.matches);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme]);

  useEffect(() => {
    if (!isAuthenticated) return;
    const openSearch = () => setSearchOpen(true);
    const openQuickAdd = () => setQuickAddOpen(true);
    const openCommand = () => setCommandOpen(true);
    window.addEventListener('taskflow:open-search', openSearch);
    window.addEventListener('taskflow:open-quick-add', openQuickAdd);
    window.addEventListener('taskflow:open-command', openCommand);
    const onKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandOpen(true);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('taskflow:open-search', openSearch);
      window.removeEventListener('taskflow:open-quick-add', openQuickAdd);
      window.removeEventListener('taskflow:open-command', openCommand);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isAuthenticated]);

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Loading Donezo...</span>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#ffffff',
            color: document.documentElement.classList.contains('dark') ? '#f3f4f6' : '#111827',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            borderRadius: '12px',
            border: `1px solid ${document.documentElement.classList.contains('dark') ? '#374151' : '#e5e7eb'}`,
          },
        }}
      />
      <Routes>
        {!isAuthenticated ? (
          <>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="*" element={<Navigate to="/login" replace />} />
          </>
        ) : (
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/inbox" replace />} />
            <Route path="/inbox" element={<Inbox />} />
            <Route path="/my-day" element={<MyDay />} />
            <Route path="/today" element={<MyDay />} />
            <Route path="/upcoming" element={<Upcoming />} />
            <Route path="/important" element={<Important />} />
            <Route path="/completed" element={<Completed />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/kanban" element={<Kanban />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/trash" element={<Trash />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="*" element={<Navigate to="/inbox" replace />} />
          </Route>
        )}
      </Routes>

      {isAuthenticated && (
        <>
          <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} />
          <CommandPalette
            isOpen={commandOpen}
            onClose={() => setCommandOpen(false)}
            onCreateTodo={() => setQuickAddOpen(true)}
            onSearch={() => setSearchOpen(true)}
            onFocus={() => setFocusOpen(true)}
          />
          {quickAddOpen && (
            <div
              className="fixed inset-0 z-[70] flex items-start justify-center p-4 pt-[18vh]"
              onClick={() => setQuickAddOpen(false)}
            >
              <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
              <div
                className="relative w-full max-w-2xl rounded-2xl border border-gray-200 dark:border-gray-700 bg-white p-4 shadow-2xl dark:bg-gray-800"
                onClick={(e) => e.stopPropagation()}
              >
                <QuickAdd onClose={() => setQuickAddOpen(false)} />
              </div>
            </div>
          )}
          {focusOpen && <FocusMode onClose={() => setFocusOpen(false)} />}
        </>
      )}
    </BrowserRouter>
  );
}

export default App;