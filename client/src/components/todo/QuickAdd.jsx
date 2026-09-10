import { useState, useRef, useEffect } from 'react';
import { useTodoStore } from '../../stores/todoStore';
import { useUIStore } from '../../stores/uiStore';
import { Plus, Calendar, Flag, Tag, Clock, X, Sparkles } from 'lucide-react';
import clsx from 'clsx';

const PRIORITY_COLORS = {
  1: 'bg-red-500/20 text-red-400 border-red-500/30',
  2: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  3: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  4: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
};

const SUGGESTIONS = [
  "Gym every Monday at 7am",
  "Submit report Friday",
  "Call dentist tomorrow 10am p1",
  "Weekly team meeting every Wednesday",
  "Read 30 pages before bed",
];

export default function QuickAdd({ projectId, onClose }) {
  const [text, setText] = useState('');
  const [parsed, setParsed] = useState(null);
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const { createTodo, isLoading } = useTodoStore();
  const { clearSelection } = useUIStore();

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    if (isFocused) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isFocused, onClose]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      if (text.trim().length > 3) {
        fetchParsedInfo(text);
      } else {
        setParsed(null);
      }
    }, 400);
    return () => clearTimeout(debounce);
  }, [text]);

  const fetchParsedInfo = async (value) => {
    try {
      const res = await fetch('/api/todos/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: value }),
      });
      if (res.ok) {
        const data = await res.json();
        setParsed(data);
      }
    } catch {
      setParsed(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim() || isLoading) return;

    const todoData = {
      title: text.trim(),
      projectId,
    };

    if (parsed) {
      if (parsed.dueDate) todoData.dueDate = parsed.dueDate;
      if (parsed.dueTime) todoData.dueTime = parsed.dueTime;
      if (parsed.priority) todoData.priority = parsed.priority;
      if (parsed.tags?.length) todoData.tags = parsed.tags;
      if (parsed.recurrence) todoData.recurrence = parsed.recurrence;
    }

    try {
      await createTodo(todoData);
      setText('');
      setParsed(null);
      clearSelection();
    } catch {
      // error handled by store
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setText(suggestion);
    inputRef.current?.focus();
  };

  const chips = [];
  if (parsed?.dueDate) {
    chips.push({
      key: 'date',
      icon: Calendar,
      label: parsed.dueDate,
      color: 'bg-blue-500/20 text-blue-400',
    });
  }
  if (parsed?.dueTime) {
    chips.push({
      key: 'time',
      icon: Clock,
      label: parsed.dueTime,
      color: 'bg-purple-500/20 text-purple-400',
    });
  }
  if (parsed?.priority) {
    chips.push({
      key: 'priority',
      icon: Flag,
      label: `P${parsed.priority}`,
      color: PRIORITY_COLORS[parsed.priority],
    });
  }
  if (parsed?.tags?.length) {
    parsed.tags.forEach((tag) => {
      chips.push({
        key: `tag-${tag}`,
        icon: Tag,
        label: tag,
        color: 'bg-emerald-500/20 text-emerald-400',
      });
    });
  }
  if (parsed?.recurrence) {
    chips.push({
      key: 'recurrence',
      icon: Sparkles,
      label: parsed.recurrence,
      color: 'bg-amber-500/20 text-amber-400',
    });
  }

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="relative">
        <div
          className={clsx(
            'flex items-center gap-2 rounded-xl border px-4 py-3 transition-all duration-200',
            isFocused
              ? 'border-blue-500/50 bg-gray-800/80 shadow-lg shadow-blue-500/10 ring-1 ring-blue-500/20'
              : 'border-gray-700/50 bg-gray-800/50 hover:border-gray-600/50'
          )}
        >
          <Plus
            size={18}
            className={clsx(
              'flex-shrink-0 transition-colors',
              isFocused ? 'text-blue-400' : 'text-gray-500'
            )}
          />
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 150)}
            placeholder="Add a task... (e.g., 'Call John tomorrow at 5pm p1 #work')"
            className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-500 outline-none"
            disabled={isLoading}
          />
          {text && (
            <button
              type="button"
              onClick={() => {
                setText('');
                setParsed(null);
                inputRef.current?.focus();
              }}
              className="flex-shrink-0 rounded-md p-1 text-gray-500 transition-colors hover:bg-gray-700 hover:text-gray-300"
            >
              <X size={14} />
            </button>
          )}
          <button
            type="submit"
            disabled={!text.trim() || isLoading}
            className={clsx(
              'flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-all duration-200',
              text.trim()
                ? 'bg-blue-600 text-white hover:bg-blue-500 active:scale-95'
                : 'bg-gray-700/50 text-gray-500 cursor-not-allowed'
            )}
          >
            {isLoading ? (
              <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-white/20 border-t-white" />
            ) : (
              'Add'
            )}
          </button>
        </div>
      </form>

      {chips.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5 px-1">
          {chips.map((chip) => (
            <span
              key={chip.key}
              className={clsx(
                'inline-flex items-center gap-1 rounded-md border border-transparent px-2 py-0.5 text-xs font-medium',
                chip.color
              )}
            >
              <chip.icon size={10} />
              {chip.label}
            </span>
          ))}
        </div>
      )}

      {!text && isFocused && (
        <div className="mt-3 px-1">
          <p className="mb-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-600">
            Suggestions
          </p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault();
                  handleSuggestionClick(s);
                }}
                className="rounded-lg border border-gray-700/40 bg-gray-800/30 px-2.5 py-1 text-xs text-gray-400 transition-all hover:border-gray-600/50 hover:bg-gray-700/40 hover:text-gray-300"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
