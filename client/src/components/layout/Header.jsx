import { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
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
  AlarmClock,
  AlertTriangle,
  Lightbulb,
  Info,
  Flame,
  CalendarDays,
  BellOff,
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import useUIStore from '../../stores/uiStore';
import useAuthStore from '../../stores/authStore';
import useNotificationStore from '../../stores/notificationStore';

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

const notificationTypeIcon = {
  reminder: AlarmClock,
  overdue: AlertTriangle,
  suggestion: Lightbulb,
  system: Info,
  habit: Flame,
  'daily-planning': CalendarDays,
};

function formatRelativeTime(value) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${formatDistanceToNow(date, { addSuffix: true })}`;
}

export default function Header() {
  const { toggleSidebar, theme, setTheme, toggleCommandPalette } = useUIStore();
  const { user, logout } = useAuthStore();
  const {
    notifications,
    unreadCount,
    isLoading: notificationsLoading,
    hasLoaded,
    error: notificationsError,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    reset: resetNotifications,
  } = useNotificationStore();
  const location = useLocation();
  const navigate = useNavigate();
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

  useEffect(() => {
    if (!hasLoaded && !notificationsLoading) {
      fetchNotifications();
    }
  }, [hasLoaded, notificationsLoading, fetchNotifications]);

  const openNotification = (notif) => {
    if (!notif.isRead) {
      markAsRead(notif._id);
    }
    setNotificationsOpen(false);
    if (notif.actionUrl) {
      navigate(notif.actionUrl);
    }
  };

  const handleMarkAllRead = () => {
    if (unreadCount > 0) {
      markAllAsRead();
    }
  };

  const handleLogout = () => {
    setMenuOpen(false);
    resetNotifications();
    logout();
  };

  return (
    <header className="flex items-center h-14 sm:h-16 px-3 sm:px-6 border-b border-gray-200 dark:border-gray-700 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm gap-1 sm:gap-2">
      <button
        onClick={toggleSidebar}
        aria-label="Open navigation menu"
        className="flex items-center justify-center w-10 h-10 -ml-1 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors lg:hidden flex-shrink-0"
      >
        <Menu className="w-5 h-5" />
      </button>

      <div className="flex items-center ml-1 sm:ml-2 lg:ml-0 min-w-0 flex-1">
        <h1 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate whitespace-nowrap">
          {viewTitle}
        </h1>
      </div>

      <div className="flex items-center gap-0.5 sm:gap-1.5 ml-auto flex-shrink-0">
        <div
          className={clsx(
            'relative hidden sm:flex items-center transition-all duration-200',
            searchFocused ? 'w-56 md:w-72' : 'w-40 md:w-56'
          )}
        >
          <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            ref={searchRef}
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => {
              setSearchFocused(true);
              window.dispatchEvent(new CustomEvent('taskflow:open-search'));
            }}
            onBlur={() => setSearchFocused(false)}
            className="w-full pl-9 pr-12 py-2 text-sm bg-gray-100 dark:bg-gray-700/60 border-0 rounded-xl text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:bg-white dark:focus:bg-gray-700 transition-all"
          />
          <kbd className="absolute right-2.5 hidden md:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-200 dark:bg-gray-600 rounded">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </div>

        <button
          onClick={toggleCommandPalette}
          aria-label="Search"
          title="Search"
          className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors sm:hidden"
        >
          <Search className="w-5 h-5" />
        </button>

        <button
          onClick={() => window.dispatchEvent(new CustomEvent('taskflow:open-quick-add'))}
          aria-label="Add Task"
          title="Add Task"
          className="flex items-center justify-center w-10 h-10 md:w-auto md:px-3 md:py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm shadow-blue-500/25 transition-all duration-150 active:scale-[0.97]"
        >
          <Plus className="w-5 h-5 md:w-4 md:h-4" />
          <span className="hidden md:inline">Add Task</span>
        </button>

        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors"
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
            aria-label="Notifications"
            aria-haspopup="true"
            aria-expanded={notificationsOpen}
            title="Notifications"
            className="relative flex items-center justify-center w-10 h-10 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 flex items-center justify-center min-w-4 h-4 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full ring-2 ring-white dark:ring-gray-800">
                {unreadCount > 99 ? '99+' : unreadCount}
              </span>
            )}
          </button>

          {notificationsOpen && (
            <div className="fixed left-3 right-3 top-16 z-50 sm:absolute sm:left-auto sm:right-0 sm:top-full sm:mt-2 sm:w-96 sm:max-w-[calc(100vw-1.5rem)] flex flex-col max-h-[min(70vh,32rem)] bg-white dark:bg-gray-800 rounded-xl shadow-xl shadow-gray-900/10 dark:shadow-black/40 border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-gray-100 dark:border-gray-700">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  Notifications
                </span>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs font-medium text-blue-600 dark:text-blue-400 px-3 min-h-10 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-700 dark:hover:text-blue-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
                  >
                    Mark all read
                  </button>
                )}
              </div>
              <div className="overflow-y-auto overscroll-contain min-h-0">
                {notificationsLoading && (
                  <div className="flex items-center justify-center gap-2 px-4 py-12">
                    <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">Loading...</span>
                  </div>
                )}

                {!notificationsLoading && notificationsError && (
                  <div className="px-4 py-12 text-center">
                    <AlertTriangle className="w-8 h-8 mx-auto text-gray-300 dark:text-gray-600" />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Could not load notifications.
                    </p>
                    <button
                      onClick={fetchNotifications}
                      className="mt-2 text-xs font-medium text-blue-600 dark:text-blue-400 px-3 min-h-10 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-950 hover:text-blue-700 dark:hover:text-blue-300 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70"
                    >
                      Try again
                    </button>
                  </div>
                )}

                {!notificationsLoading && !notificationsError && notifications.length === 0 && (
                  <div className="flex flex-col items-center gap-2 px-4 py-12">
                    <BellOff className="w-8 h-8 text-gray-300 dark:text-gray-600" />
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No new notifications
                    </p>
                  </div>
                )}

                {!notificationsLoading && !notificationsError && notifications.map((notif) => {
                  const TypeIcon = notificationTypeIcon[notif.type] || Info;
                  return (
                    <div
                      key={notif._id}
                      role="button"
                      tabIndex={0}
                      aria-label={`${notif.isRead ? 'Read' : 'Unread'} notification: ${notif.title}`}
                      onClick={() => openNotification(notif)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          openNotification(notif);
                        }
                      }}
                      className={clsx(
                        'flex items-start gap-3 px-4 py-3 border-b border-gray-100 dark:border-gray-700 last:border-b-0 cursor-pointer transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-blue-500/50',
                        !notif.isRead
                          ? 'bg-blue-50 hover:bg-blue-100 dark:bg-blue-950 dark:hover:bg-blue-900'
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700'
                      )}
                    >
                      <span
                        className={clsx(
                          'mt-1.5 w-2 h-2 rounded-full flex-shrink-0',
                          notif.isRead ? 'bg-transparent' : 'bg-blue-500'
                        )}
                      />
                      <span
                        className={clsx(
                          'mt-0.5 flex-shrink-0 p-1 rounded-lg',
                          notif.isRead
                            ? 'text-gray-300 dark:text-gray-600'
                            : 'text-blue-500 bg-blue-100 dark:text-blue-300 dark:bg-blue-900',
                          !notif.type && 'hidden'
                        )}
                      >
                        <TypeIcon className="w-4 h-4" />
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={clsx(
                          'text-sm',
                          notif.isRead
                            ? 'font-medium text-gray-600 dark:text-gray-300'
                            : 'font-semibold text-gray-900 dark:text-white'
                        )}>
                          {notif.title}
                        </p>
                        {notif.message && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-2">
                            {notif.message}
                          </p>
                        )}
                        {formatRelativeTime(notif.createdAt) && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                            {formatRelativeTime(notif.createdAt)}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="User menu"
            className="flex items-center gap-1.5 p-1 pr-1.5 sm:pr-2 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
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
            <div className="absolute right-0 mt-2 w-56 max-w-[calc(100vw-1.5rem)] bg-white dark:bg-gray-800 rounded-2xl shadow-xl shadow-black/10 dark:shadow-black/30 border border-gray-200 dark:border-gray-700 z-50 overflow-hidden py-1.5">
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
              <button
                onClick={() => {
                  setMenuOpen(false);
                  navigate('/settings');
                }}
                className="flex items-center gap-3 w-full px-3.5 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
              <button
                onClick={handleLogout}
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