import { useState } from 'react';
import { useTodoStore } from '../../stores/todoStore';
import { useUIStore } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';
import {
  Check,
  Calendar,
  Flag,
  MoreHorizontal,
  Pencil,
  Trash2,
  Sun,
  Copy,
  Archive,
  Clock,
  ChevronRight,
} from 'lucide-react';
import {
  format,
  isToday,
  isTomorrow,
  isPast,
  parseISO,
  formatDistanceToNow,
} from 'date-fns';
import clsx from 'clsx';

const PRIORITY_CONFIG = {
  1: { color: 'bg-red-500', ring: 'ring-red-500/30', text: 'text-red-400', label: 'P1' },
  2: { color: 'bg-orange-500', ring: 'ring-orange-500/30', text: 'text-orange-400', label: 'P2' },
  3: { color: 'bg-blue-500', ring: 'ring-blue-500/30', text: 'text-blue-400', label: 'P3' },
  4: { color: 'bg-gray-500', ring: 'ring-gray-500/30', text: 'text-gray-400', label: 'P4' },
};

function getDueDateInfo(dueDate) {
  if (!dueDate) return null;
  const date = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
  const past = isPast(date) && !isToday(date);
  const today = isToday(date);
  const tomorrow = isTomorrow(date);

  return {
    date,
    label: today
      ? 'Today'
      : tomorrow
        ? 'Tomorrow'
        : format(date, 'MMM d'),
    color: past
      ? 'bg-red-500/15 text-red-400 border-red-500/20'
      : today
        ? 'bg-amber-500/15 text-amber-400 border-amber-500/20'
        : 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    past,
    today,
  };
}

export default function TodoItem({ todo, isSelected, isBulkMode, onOpenDetail }) {
  const [showMenu, setShowMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const { updateTodo, deleteTodo, archiveTodo, duplicateTodo } = useTodoStore();
  const { toggleSelectTodo } = useUIStore();
  const { projects } = useProjectStore();

  const priority = PRIORITY_CONFIG[todo.priority] || PRIORITY_CONFIG[4];
  const dueDateInfo = getDueDateInfo(todo.dueDate);
  const completed = todo.completed || todo.status === 'completed';
  const project = projects.find((p) => p.id === todo.projectId);
  const subtaskTotal = todo.subtasks?.length || 0;
  const subtaskDone = todo.subtasks?.filter((s) => s.completed).length || 0;

  const handleToggle = async (e) => {
    e.stopPropagation();
    await updateTodo(todo.id, { completed: !completed });
  };

  const handleDelete = async (e) => {
    e.stopPropagation();
    await deleteTodo(todo.id);
    setShowMenu(false);
  };

  const handleArchive = async (e) => {
    e.stopPropagation();
    await archiveTodo(todo.id);
    setShowMenu(false);
  };

  const handleDuplicate = async (e) => {
    e.stopPropagation();
    await duplicateTodo(todo.id);
    setShowMenu(false);
  };

  const handleSelect = (e) => {
    e.stopPropagation();
    toggleSelectTodo(todo.id);
  };

  return (
    <div
      className={clsx(
        'group relative flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-200',
        completed
          ? 'border-gray-200 bg-gray-100/60 opacity-60 dark:border-gray-800/30 dark:bg-gray-900/20'
          : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700/30 dark:bg-gray-800/40 dark:hover:border-gray-600/40 dark:hover:bg-gray-800/60',
        isSelected && 'border-blue-500/40 bg-blue-500/5 ring-1 ring-blue-500/20',
        isBulkMode && 'cursor-default'
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowMenu(false);
      }}
    >
      {/* Bulk select checkbox */}
      {isBulkMode && (
        <button
          onClick={handleSelect}
          className={clsx(
            'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-all',
            isSelected
              ? 'border-blue-500 bg-blue-500 text-white'
              : 'border-gray-600 bg-transparent hover:border-gray-500'
          )}
        >
          {isSelected && <Check size={10} strokeWidth={3} />}
        </button>
      )}

      {/* Completion checkbox */}
      <button
        onClick={handleToggle}
        className={clsx(
          'flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-200',
          completed
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : `${priority.color.replace('bg-', 'border-')} hover:${priority.ring} hover:bg-opacity-20`,
          !completed && priority.color === 'bg-red-500' && 'border-red-500 hover:bg-red-500/20',
          !completed && priority.color === 'bg-orange-500' && 'border-orange-500 hover:bg-orange-500/20',
          !completed && priority.color === 'bg-blue-500' && 'border-blue-500 hover:bg-blue-500/20',
          !completed && priority.color === 'bg-gray-500' && 'border-gray-500 hover:bg-gray-500/20'
        )}
      >
        {completed && <Check size={12} strokeWidth={3} />}
      </button>

      {/* Content */}
      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => !isBulkMode && onOpenDetail?.(todo)}>
        <div className="flex items-center gap-2">
          <span
            className={clsx(
              'truncate text-sm font-medium transition-all duration-200',
              completed ? 'text-gray-500 line-through' : 'text-gray-900 dark:text-gray-100'
            )}
          >
            {todo.title}
          </span>
          {todo.isMyDay && !completed && (
            <Sun size={12} className="flex-shrink-0 text-amber-400" />
          )}
          {todo.isPinned && !completed && (
            <span className="flex-shrink-0 text-[10px] text-blue-400">📌</span>
          )}
        </div>

        <div className="mt-1 flex flex-wrap items-center gap-2">
          {/* Due date badge */}
          {dueDateInfo && (
            <span
              className={clsx(
                'inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[10px] font-medium',
                dueDateInfo.color
              )}
            >
              <Calendar size={9} />
              {dueDateInfo.label}
            </span>
          )}

          {/* Priority badge */}
          {todo.priority && todo.priority <= 2 && !completed && (
            <span className={clsx('text-[10px] font-bold', priority.text)}>
              {priority.label}
            </span>
          )}

          {/* Project */}
          {project && (
            <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-700/30 dark:text-gray-400">
              {project.name}
            </span>
          )}

          {/* Tags */}
          {todo.tags?.slice(0, 2).map((tag) => (
            <span
              key={tag}
              className="rounded-md bg-emerald-500/10 px-1.5 py-0.5 text-[10px] text-emerald-400"
            >
              {tag}
            </span>
          ))}
          {todo.tags?.length > 2 && (
            <span className="text-[10px] text-gray-500">+{todo.tags.length - 2}</span>
          )}

          {/* Subtasks progress */}
          {subtaskTotal > 0 && (
            <span className="inline-flex items-center gap-1 text-[10px] text-gray-500">
              <span className="h-1 w-8 rounded-full bg-gray-200 dark:bg-gray-700">
                <span
                  className="block h-full rounded-full bg-blue-500 transition-all"
                  style={{ width: `${(subtaskDone / subtaskTotal) * 100}%` }}
                />
              </span>
              {subtaskDone}/{subtaskTotal}
            </span>
          )}

          {/* Time estimate */}
          {todo.estimatedDuration && (
            <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-500">
              <Clock size={9} />
              {todo.estimatedDuration}m
            </span>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div
        className={clsx(
          'flex flex-shrink-0 items-center gap-1 transition-opacity duration-150 md:opacity-0 md:group-hover:opacity-100',
          isBulkMode && 'hidden'
        )}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail?.(todo);
          }}
          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700/50 dark:hover:text-gray-300"
          title="Edit"
        >
          <Pencil size={14} />
        </button>
        <button
          onClick={handleToggle}
          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-emerald-600 dark:hover:bg-gray-700/50 dark:hover:text-emerald-400"
          title={completed ? 'Mark incomplete' : 'Complete'}
        >
          <Check size={14} />
        </button>
        <button
          onClick={handleDelete}
          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-red-600 dark:hover:bg-gray-700/50 dark:hover:text-red-400"
          title="Delete"
        >
          <Trash2 size={14} />
        </button>

        {/* More menu */}
        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700/50 dark:hover:text-gray-300"
          >
            <MoreHorizontal size={14} />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-gray-200 bg-white py-1 shadow-xl dark:border-gray-700/50 dark:bg-gray-800">
              <button
                onClick={handleDuplicate}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50"
              >
                <Copy size={13} /> Duplicate
              </button>
              <button
                onClick={handleArchive}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700/50"
              >
                <Archive size={13} /> Archive
              </button>
              <hr className="my-1 border-gray-100 dark:border-gray-700/50" />
              <button
                onClick={handleDelete}
                className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Detail chevron (always visible) */}
      {!isBulkMode && (
        <ChevronRight
          size={14}
          className={clsx(
            'flex-shrink-0 text-gray-600 transition-all',
            isHovered ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-1'
          )}
        />
      )}
    </div>
  );
}
