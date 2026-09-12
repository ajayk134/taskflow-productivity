import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Plus,
  Inbox,
  CalendarDays,
  Zap,
  FolderKanban,
  Sun,
  Download,
  Settings,
  ArrowRight,
  Command,
} from 'lucide-react';
import clsx from 'clsx';
import { useUIStore } from '../../stores/uiStore';

const commands = [
  { id: 'create-todo', label: 'Create Todo', icon: Plus, action: 'createTodo', keywords: ['add', 'new', 'task'] },
  { id: 'search', label: 'Search', icon: Search, action: 'search', keywords: ['find', 'lookup'] },
  { id: 'go-inbox', label: 'Go to Inbox', icon: Inbox, path: '/inbox', keywords: ['inbox'] },
  { id: 'go-today', label: 'Go to Today', icon: CalendarDays, path: '/today', keywords: ['today', 'day'] },
  { id: 'go-projects', label: 'Go to Projects', icon: FolderKanban, path: '/projects', keywords: ['projects', 'kanban', 'board'] },
  { id: 'open-calendar', label: 'Open Calendar', icon: CalendarDays, path: '/calendar', keywords: ['calendar', 'schedule', 'date'] },
  { id: 'start-focus', label: 'Start Focus Session', icon: Zap, action: 'startFocus', keywords: ['focus', 'pomodoro', 'timer', 'concentrate'] },
  { id: 'toggle-theme', label: 'Toggle Theme', icon: Sun, action: 'toggleTheme', keywords: ['dark', 'light', 'mode'] },
  { id: 'export-data', label: 'Export Data', icon: Download, action: 'exportData', keywords: ['download', 'backup'] },
  { id: 'open-settings', label: 'Open Settings', icon: Settings, path: '/settings', keywords: ['settings', 'preferences', 'config'] },
];

export default function CommandPalette({ isOpen, onClose, onCreateTodo, onSearch, onFocus }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { setTheme, theme } = useUIStore();

  const filtered = useMemo(() => {
    if (!query.trim()) return commands;
    const q = query.toLowerCase();
    return commands.filter(
      (cmd) =>
        cmd.label.toLowerCase().includes(q) ||
        cmd.keywords.some((kw) => kw.includes(q))
    );
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  const executeCommand = useCallback((cmd) => {
    if (cmd.path) {
      navigate(cmd.path);
    } else if (cmd.action === 'createTodo') {
      onCreateTodo?.();
    } else if (cmd.action === 'search') {
      onSearch?.();
    } else if (cmd.action === 'startFocus') {
      onFocus?.();
    } else if (cmd.action === 'toggleTheme') {
      setTheme(theme === 'dark' ? 'light' : 'dark');
    } else if (cmd.action === 'exportData') {
      window.dispatchEvent(new CustomEvent('taskflow:export'));
    }
    onClose();
  }, [navigate, onCreateTodo, onSearch, onFocus, setTheme, theme, onClose]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((i) => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && filtered[selectedIndex]) {
      e.preventDefault();
      executeCommand(filtered[selectedIndex]);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[15vh] p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in zoom-in-95 fade-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a command or search..."
            className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none text-sm"
          />
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[11px] font-medium text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-md border border-gray-200 dark:border-gray-600">
            esc
          </kbd>
        </div>

        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              No matching commands
            </div>
          )}
          {filtered.map((cmd, index) => (
            <button
              key={cmd.id}
              className={clsx(
                'flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors',
                index === selectedIndex
                  ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400'
                  : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
              )}
              onClick={() => executeCommand(cmd)}
              onMouseEnter={() => setSelectedIndex(index)}
            >
              <cmd.icon className={clsx('w-4 h-4 flex-shrink-0', index === selectedIndex ? 'text-blue-500' : 'text-gray-400 dark:text-gray-500')} />
              <span className="flex-1 text-left font-medium">{cmd.label}</span>
              <ArrowRight className={clsx('w-3.5 h-3.5 transition-opacity', index === selectedIndex ? 'opacity-100' : 'opacity-0')} />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-200 dark:border-gray-700 text-[11px] text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1">
            <Command className="w-3 h-3" />K
          </span>
          <span>to open</span>
          <span className="flex items-center gap-1">↑↓ navigate</span>
          <span className="flex items-center gap-1">↵ select</span>
        </div>
      </div>
    </div>
  );
}
