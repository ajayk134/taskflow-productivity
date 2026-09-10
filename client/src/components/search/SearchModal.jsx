import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  X,
  Filter,
  Tag,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Circle,
  ArrowRight,
} from 'lucide-react';
import clsx from 'clsx';
import { format, isToday, isTomorrow, isThisWeek, parseISO } from 'date-fns';
import { useTodoStore } from '../../stores/todoStore';

const operators = [
  { key: 'priority:', label: 'Priority', values: ['high', 'medium', 'low', 'urgent'] },
  { key: 'status:', label: 'Status', values: ['active', 'completed', 'pending'] },
  { key: 'due:', label: 'Due Date', values: ['today', 'tomorrow', 'this-week', 'overdue'] },
  { key: 'tag:', label: 'Tag', values: [] },
];

const priorityColors = {
  urgent: 'text-red-600 bg-red-50 dark:bg-red-500/10',
  high: 'text-orange-600 bg-orange-50 dark:bg-orange-500/10',
  medium: 'text-yellow-600 bg-yellow-50 dark:bg-yellow-500/10',
  low: 'text-blue-600 bg-blue-50 dark:bg-blue-500/10',
};

function parseSearchQuery(query) {
  const filters = { text: '', priority: null, status: null, due: null, tag: null };
  const parts = query.split(/\s+/);
  const textParts = [];
  for (const part of parts) {
    if (part.startsWith('priority:')) {
      filters.priority = part.slice(9).toLowerCase();
    } else if (part.startsWith('status:')) {
      filters.status = part.slice(7).toLowerCase();
    } else if (part.startsWith('due:')) {
      filters.due = part.slice(4).toLowerCase();
    } else if (part.startsWith('tag:')) {
      filters.tag = part.slice(4).toLowerCase();
    } else {
      textParts.push(part);
    }
  }
  filters.text = textParts.join(' ').toLowerCase();
  return filters;
}

function matchesFilters(todo, filters) {
  if (filters.text) {
    const text = (todo.title || '').toLowerCase();
    if (!text.includes(filters.text)) return false;
  }
  if (filters.priority) {
    if ((todo.priority || '').toLowerCase() !== filters.priority) return false;
  }
  if (filters.status) {
    if (filters.status === 'completed' && !todo.completed) return false;
    if (filters.status === 'active' && todo.completed) return false;
    if (filters.status === 'pending' && todo.status !== 'pending') return false;
  }
  if (filters.due && todo.dueDate) {
    const due = parseISO(todo.dueDate);
    if (filters.due === 'today' && !isToday(due)) return false;
    if (filters.due === 'tomorrow' && !isTomorrow(due)) return false;
    if (filters.due === 'this-week' && !isThisWeek(due)) return false;
    if (filters.due === 'overdue' && due >= new Date()) return false;
  } else if (filters.due && !todo.dueDate) {
    return false;
  }
  if (filters.tag) {
    const tags = (todo.tags || []).map((t) => (typeof t === 'string' ? t : t.name).toLowerCase());
    if (!tags.includes(filters.tag)) return false;
  }
  return true;
}

function highlightText(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? (
      <mark key={i} className="bg-yellow-200 dark:bg-yellow-500/30 text-inherit rounded px-0.5">
        {part}
      </mark>
    ) : (
      part
    )
  );
}

export default function SearchModal({ isOpen, onClose }) {
  const [query, setQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const inputRef = useRef(null);
  const navigate = useNavigate();
  const { todos, fetchTodos } = useTodoStore();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      fetchTodos();
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen, fetchTodos]);

  const filters = useMemo(() => parseSearchQuery(query), [query]);

  const results = useMemo(() => {
    return todos.filter((todo) => matchesFilters(todo, filters)).slice(0, 20);
  }, [todos, filters]);

  const handleSelect = useCallback((todo) => {
    onClose();
    if (todo.project) {
      navigate(`/projects/${todo.project}`);
    } else {
      navigate('/inbox');
    }
  }, [onClose, navigate]);

  const insertFilter = useCallback((key, value) => {
    setQuery((prev) => {
      const base = prev.replace(new RegExp(`\\s*${key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}${value}\\s*`), '');
      return `${base} ${key}${value}`.trim();
    });
    setShowFilters(false);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[10vh] p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden animate-in zoom-in-95 fade-in duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <Search className="w-5 h-5 text-gray-400 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tasks... Use priority:high, status:active, due:today, tag:work"
            className="flex-1 bg-transparent text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none text-sm"
          />
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              'p-1.5 rounded-lg transition-colors',
              showFilters ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-500' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'
            )}
          >
            <Filter className="w-4 h-4" />
          </button>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        {showFilters && (
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <div className="flex flex-wrap gap-2">
              {operators.map((op) =>
                op.values.map((val) => (
                  <button
                    key={`${op.key}${val}`}
                    onClick={() => insertFilter(op.key, val)}
                    className={clsx(
                      'px-2.5 py-1 rounded-full text-xs font-medium border transition-colors',
                      query.includes(`${op.key}${val}`)
                        ? 'bg-blue-50 dark:bg-blue-500/10 border-blue-300 dark:border-blue-500/30 text-blue-600 dark:text-blue-400'
                        : 'bg-white dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300 dark:hover:border-gray-500'
                    )}
                  >
                    {op.key}{val}
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        <div className="max-h-96 overflow-y-auto">
          {results.length === 0 && (
            <div className="px-4 py-12 text-center">
              <Search className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
              <p className="text-sm text-gray-500 dark:text-gray-400">No results found</p>
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">Try different keywords or filters</p>
            </div>
          )}
          {results.map((todo) => (
            <button
              key={todo._id}
              className="flex items-center gap-3 w-full px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors text-left border-b border-gray-100 dark:border-gray-700/50 last:border-0"
              onClick={() => handleSelect(todo)}
            >
              {todo.completed ? (
                <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
              ) : (
                <Circle className="w-4 h-4 text-gray-300 dark:text-gray-600 flex-shrink-0" />
              )}
              <div className="flex-1 min-w-0">
                <p className={clsx('text-sm font-medium truncate', todo.completed ? 'text-gray-400 dark:text-gray-500 line-through' : 'text-gray-900 dark:text-gray-100')}>
                  {highlightText(todo.title || 'Untitled', filters.text)}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  {todo.priority && (
                    <span className={clsx('text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded', priorityColors[todo.priority])}>
                      {todo.priority}
                    </span>
                  )}
                  {todo.dueDate && (
                    <span className="flex items-center gap-1 text-[11px] text-gray-400">
                      <Calendar className="w-3 h-3" />
                      {format(parseISO(todo.dueDate), 'MMM d')}
                    </span>
                  )}
                  {(todo.tags || []).slice(0, 2).map((tag) => (
                    <span key={typeof tag === 'string' ? tag : tag._id} className="flex items-center gap-0.5 text-[11px] text-gray-400">
                      <Tag className="w-2.5 h-2.5" />
                      {typeof tag === 'string' ? tag : tag.name}
                    </span>
                  ))}
                </div>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-gray-300 dark:text-gray-600 flex-shrink-0" />
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-gray-200 dark:border-gray-700 text-[11px] text-gray-400 dark:text-gray-500">
          <span>Filters: priority:high status:active due:today tag:work</span>
        </div>
      </div>
    </div>
  );
}
