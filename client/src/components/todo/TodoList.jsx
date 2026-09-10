import { useState, useMemo } from 'react';
import TodoItem from './TodoItem';
import { ListFilter, ArrowUpDown, Layers, ChevronDown } from 'lucide-react';
import { isToday, isPast, parseISO, isThisWeek, isNextWeek } from 'date-fns';
import clsx from 'clsx';

const SORT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'dueDate', label: 'Due Date' },
  { value: 'priority', label: 'Priority' },
  { value: 'title', label: 'Title' },
  { value: 'created', label: 'Created' },
];

const GROUP_OPTIONS = [
  { value: 'none', label: 'No grouping' },
  { value: 'date', label: 'By date' },
  { value: 'priority', label: 'By priority' },
  { value: 'status', label: 'By status' },
  { value: 'project', label: 'By project' },
];

function sortTodos(todos, sortBy) {
  const sorted = [...todos];
  switch (sortBy) {
    case 'dueDate':
      return sorted.sort((a, b) => {
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return new Date(a.dueDate) - new Date(b.dueDate);
      });
    case 'priority':
      return sorted.sort((a, b) => (a.priority || 4) - (b.priority || 4));
    case 'title':
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case 'created':
      return sorted.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );
    default:
      return sorted.sort((a, b) => {
        if (a.isPinned && !b.isPinned) return -1;
        if (!a.isPinned && b.isPinned) return 1;
        return (a.order || 0) - (b.order || 0);
      });
  }
}

function groupTodos(todos, groupBy) {
  if (groupBy === 'none') return { 'All Tasks': todos };

  const groups = {};
  todos.forEach((todo) => {
    let key;
    switch (groupBy) {
      case 'date': {
        if (!todo.dueDate) {
          key = 'No date';
        } else {
          const date = parseISO(todo.dueDate);
          if (isToday(date)) key = 'Today';
          else if (isPast(date)) key = 'Overdue';
          else if (isThisWeek(date)) key = 'This week';
          else if (isNextWeek(date)) key = 'Next week';
          else key = 'Later';
        }
        break;
      }
      case 'priority':
        key = `P${todo.priority || 4}`;
        break;
      case 'status':
        key = todo.status === 'completed' ? 'Completed' : 'In Progress';
        break;
      case 'project':
        key = todo.projectName || 'No project';
        break;
      default:
        key = 'All Tasks';
    }
    if (!groups[key]) groups[key] = [];
    groups[key].push(todo);
  });
  return groups;
}

function LoadingSkeleton() {
  return (
    <div className="space-y-2 px-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <div
          key={i}
          className="flex animate-pulse items-center gap-3 rounded-xl border border-gray-800 bg-gray-800/30 px-4 py-3"
        >
          <div className="h-5 w-5 rounded-full bg-gray-700" />
          <div className="flex-1 space-y-2">
            <div className="h-3.5 w-3/4 rounded bg-gray-700" />
            <div className="flex gap-2">
              <div className="h-3 w-16 rounded bg-gray-700/50" />
              <div className="h-3 w-10 rounded bg-gray-700/50" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gray-800/50">
        <Layers size={36} className="text-gray-600" />
      </div>
      <h3 className="mb-1 text-sm font-medium text-gray-400">
        {message || 'No tasks here'}
      </h3>
      <p className="max-w-[240px] text-xs text-gray-600">
        Add a task using the input above or adjust your filters
      </p>
    </div>
  );
}

export default function TodoList({
  todos = [],
  isLoading = false,
  emptyMessage,
  groupBy = 'none',
  showGroupToggle = true,
  onOpenDetail,
}) {
  const [sortBy, setSortBy] = useState('default');
  const [activeGroup, setActiveGroup] = useState(groupBy);
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);

  const sortedTodos = useMemo(() => sortTodos(todos, sortBy), [todos, sortBy]);
  const groupedTodos = useMemo(
    () => groupTodos(sortedTodos, activeGroup),
    [sortedTodos, activeGroup]
  );

  if (isLoading) return <LoadingSkeleton />;
  if (!todos.length) return <EmptyState message={emptyMessage} />;

  const groupEntries = Object.entries(groupedTodos);

  return (
    <div>
      {/* Toolbar */}
      <div className="mb-3 flex items-center justify-between px-1">
        <span className="text-xs text-gray-500">
          {todos.length} task{todos.length !== 1 ? 's' : ''}
        </span>
        <div className="flex items-center gap-2">
          {/* Sort */}
          <div className="relative">
            <button
              onClick={() => {
                setShowSortMenu(!showSortMenu);
                setShowGroupMenu(false);
              }}
              className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-700/40 hover:text-gray-300"
            >
              <ArrowUpDown size={12} />
              {SORT_OPTIONS.find((o) => o.value === sortBy)?.label}
            </button>
            {showSortMenu && (
              <div className="absolute right-0 top-full z-40 mt-1 w-36 rounded-xl border border-gray-700/50 bg-gray-800 py-1 shadow-xl">
                {SORT_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setSortBy(opt.value);
                      setShowSortMenu(false);
                    }}
                    className={clsx(
                      'flex w-full items-center px-3 py-1.5 text-xs transition-colors',
                      sortBy === opt.value
                        ? 'bg-blue-500/10 text-blue-400'
                        : 'text-gray-300 hover:bg-gray-700/50'
                    )}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Group */}
          {showGroupToggle && (
            <div className="relative">
              <button
                onClick={() => {
                  setShowGroupMenu(!showGroupMenu);
                  setShowSortMenu(false);
                }}
                className="flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-700/40 hover:text-gray-300"
              >
                <ListFilter size={12} />
                Group
              </button>
              {showGroupMenu && (
                <div className="absolute right-0 top-full z-40 mt-1 w-40 rounded-xl border border-gray-700/50 bg-gray-800 py-1 shadow-xl">
                  {GROUP_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        setActiveGroup(opt.value);
                        setShowGroupMenu(false);
                      }}
                      className={clsx(
                        'flex w-full items-center px-3 py-1.5 text-xs transition-colors',
                        activeGroup === opt.value
                          ? 'bg-blue-500/10 text-blue-400'
                          : 'text-gray-300 hover:bg-gray-700/50'
                      )}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Close menus on outside click */}
      {(showSortMenu || showGroupMenu) && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => {
            setShowSortMenu(false);
            setShowGroupMenu(false);
          }}
        />
      )}

      {/* Groups */}
      <div className="space-y-4">
        {groupEntries.map(([groupLabel, groupTodos]) => (
          <div key={groupLabel}>
            {activeGroup !== 'none' && (
              <div className="mb-2 flex items-center gap-2 px-1">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                  {groupLabel}
                </h4>
                <span className="rounded-full bg-gray-700/40 px-1.5 py-0.5 text-[10px] text-gray-500">
                  {groupTodos.length}
                </span>
              </div>
            )}
            <div className="space-y-1.5">
              {groupTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  isBulkMode={false}
                  onOpenDetail={onOpenDetail}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
