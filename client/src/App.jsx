import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import useAuthStore from './stores/authStore';
import useUIStore from './stores/uiStore';
import Layout from './components/layout/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Calendar from './pages/Calendar';
import Kanban from './pages/Kanban';
import Habits from './pages/Habits';
import Goals from './pages/Goals';
import Analytics from './pages/Analytics';
import Notes from './pages/Notes';
import Settings from './pages/Settings';
import Projects from './pages/Projects';

function App() {
  const { isAuthenticated, isLoading, init } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const [initialized, setInitialized] = useState(false);

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

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-gray-500 dark:text-gray-400">Loading TaskFlow...</span>
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
            background: theme === 'dark' ? '#1f2937' : '#ffffff',
            color: theme === 'dark' ? '#f3f4f6' : '#111827',
            boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            borderRadius: '12px',
            border: `1px solid ${theme === 'dark' ? '#374151' : '#e5e7eb'}`,
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
            <Route path="/inbox" element={<PlaceholderView title="Inbox" />} />
            <Route path="/my-day" element={<PlaceholderView title="My Day" />} />
            <Route path="/today" element={<PlaceholderView title="Today" />} />
            <Route path="/upcoming" element={<PlaceholderView title="Upcoming" />} />
            <Route path="/important" element={<PlaceholderView title="Important" />} />
            <Route path="/completed" element={<PlaceholderView title="Completed" />} />
            <Route path="/projects/:id" element={<PlaceholderView title="Project" />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/kanban" element={<Kanban />} />
            <Route path="/habits" element={<Habits />} />
            <Route path="/goals" element={<Goals />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/notes" element={<Notes />} />
            <Route path="/trash" element={<PlaceholderView title="Trash" />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="*" element={<Navigate to="/inbox" replace />} />
          </Route>
        )}
      </Routes>
    </BrowserRouter>
  );
}

function PlaceholderView({ title }) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">{title}</h2>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          This view is coming soon.
        </p>
      </div>
    </div>
  );
}

export default App;
