import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Search,
  Plus,
  Moon,
  Sun,
  Bell,
  Menu,
  Command,
  LogOut,
  User,
  Settings,
  ChevronDown,
} from 'lucide-react';
import clsx from 'clsx';
import useUIStore from '../../stores/uiStore';
import useAuthStore from '../../stores/authStore';

const viewTitles = {
  inbox: 'Inbox',
  'my-day': 'My Day',
  today: 'Today',
  upcoming: 'Upcoming',
  important: 'Important',
  completed: 'Completed',
  calendar: 'Calendar',
  kanban: 'Kanban Board',
  habits: 'Habits',
  goals: 'Goals',
  analytics: 'Analytics',
  notes: 'Notes',
  trash: 'Trash',
  settings: 'Settings',
};

export default function Header() {
  const { toggleSidebar, theme, setTheme, toggleCommandPalette } = useUIStore();
  const { user, logout } = useAuthStore();
  const location = useLocation();
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const menuRef = useRef(null);
  const notifRef = useRef(null);
  const searchRef = useRef(null);

  const pathParts = location.pathname.split('/').filter(Boolean);
  const currentView = pathParts[0] || 'inbox';

  const viewTitle = viewTitles[currentView] || currentView.charAt(0).toUpperCase() + currentView.slice(1);

  useEffect(() => {
    const handleClick = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setNotificationsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        toggleCommandPalette();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleCommandPalette]);

  const notifications = [
    { id: 1, text: 'Task "Review PR" is due today', time: '2m ago', read: false },
    { id: 2, text: 'Project "Website Redesign" updated', time: '1h ago', read: false },
    { id: 3, text: 'Habit "Exercise" streak: 7 days!', time: '3h ago', read: true },
  ];

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <header className="flex items-center h-16 px-4 md:px-6 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
      <button
        onClick={toggleSidebar}
        className="p-2 -ml-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors lg:hidden"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex items-center gap-3 ml-2 lg:ml-0">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {viewTitle}
        </h1>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <div
          className={clsx(
            'relative hidden sm:flex items-center transition-all duration-200',
            searchFocused ? 'w-72' : 'w-56'
          )}
        >
          <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            className="w-full pl-9 pr-12 py-2 text-sm bg-gray-100 dark:bg-gray-700/60 border-0 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white dark:focus:bg-gray-700 transition-all"
          />
          <kbd className="absolute right-2.5 hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-600 rounded">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </div>

        <button
          onClick={toggleCommandPalette}
          className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors sm:hidden"
        >
          <Search className="w-5 h-5" />
        </button>

        <button className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/25 transition-all duration-150 active:scale-[0.97]">
          <Plus className="w-4 h-4" />
          <span className="hidden md:inline">Add Task</span>
        </button>

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5" />
          ) : (
            <Moon className="w-5 h-5" />
          )}
        </button>

        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            className="relative p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex items-center justify-center w-4 h-4 text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800">
                {unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/30 border border-gray-200 dark:border-gray-700 z-50 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Notifications
                </span>
                <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  Mark all read
                </button>
              </div>
              <div className="max-h-72 overflow-y-auto">
                {notifications.map((notif) => (
                  <div
                    key={notif.id}
                    className={clsx(
                      'flex items-start gap-3 px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors border-b border-gray-50 dark:border-gray-700/50 last:border-0',
                      !notif.read && 'bg-blue-50/50 dark:bg-blue-500/5'
                    )}
                  >
                    <div
                      className={clsx(
                        'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                        notif.read ? 'bg-transparent' : 'bg-blue-500'
                      )}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {notif.text}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                        {notif.time}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="flex items-center gap-2 p-1 pr-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shadow-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <ChevronDown
              className={clsx(
                'w-4 h-4 text-gray-400 transition-transform hidden md:block',
                menuOpen && 'rotate-180'
              )}
            />
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/30 border border-gray-200 dark:border-gray-700 z-50 overflow-hidden py-1.5">
              <div className="px-3.5 py-2.5 border-b border-gray-100 dark:border-gray-700 mb-1.5">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user?.name || 'User'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user?.email || 'user@example.com'}
                </p>
              </div>
              <button className="flex items-center gap-3 w-full px-3.5 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <User className="w-4 h-4" />
                Profile
              </button>
              <button className="flex items-center gap-3 w-full px-3.5 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
              <button
                onClick={() => {
                  setMenuOpen(false);
                  logout();
                }}
                className="flex items-center gap-3 w-full px-3.5 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
