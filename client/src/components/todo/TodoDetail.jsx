import { useState, useEffect, useRef } from 'react';
import { useTodoStore } from '../../stores/todoStore';
import { useProjectStore } from '../../stores/projectStore';
import {
  X,
  Pencil,
  Flag,
  Calendar,
  Clock,
  Tag,
  Folder,
  MapPin,
  Link,
  Repeat,
  Bell,
  Sun,
  Star,
  Pin,
  Archive,
  Trash2,
  Copy,
  RotateCcw,
  Check,
  Plus,
  GripVertical,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const PRIORITY_OPTIONS = [
  { value: 1, label: 'P1', color: 'bg-red-500 text-white', border: 'border-red-500' },
  { value: 2, label: 'P2', color: 'bg-orange-500 text-white', border: 'border-orange-500' },
  { value: 3, label: 'P3', color: 'bg-blue-500 text-white', border: 'border-blue-500' },
  { value: 4, label: 'P4', color: 'bg-gray-600 text-white', border: 'border-gray-600' },
];

const STATUS_OPTIONS = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'planned', label: 'Planned' },
  { value: 'next', label: 'Next' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'waiting', label: 'Waiting' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'review', label: 'Review' },
  { value: 'completed', label: 'Completed' },
  { value: 'archived', label: 'Archived' },
];

function EditableTitle({ value, onSave }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef(null);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  const save = () => {
    setEditing(false);
    if (draft.trim() && draft !== value) onSave(draft.trim());
    else setDraft(value);
  };

  if (editing) {
    return (
      <input
        ref={ref}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
          if (e.key === 'Escape') {
            setDraft(value);
            setEditing(false);
          }
        }}
        className="w-full bg-transparent text-lg font-semibold text-gray-900 outline-none dark:text-gray-100"
      />
    );
  }

  return (
    <h2
      onClick={() => setEditing(true)}
      className="group flex cursor-pointer items-center gap-2 text-lg font-semibold text-gray-900 hover:text-gray-600 dark:text-gray-100 dark:hover:text-white"
    >
      {value}
      <Pencil
        size={14}
        className="text-gray-600 opacity-0 transition-opacity group-hover:opacity-100"
      />
    </h2>
  );
}

function SubtaskList({ subtasks = [], onChange }) {
  const [newTitle, setNewTitle] = useState('');
  const [showInput, setShowInput] = useState(false);

  const add = () => {
    if (!newTitle.trim()) return;
    onChange([...subtasks, { id: Date.now().toString(), title: newTitle.trim(), completed: false }]);
    setNewTitle('');
  };

  const toggle = (id) => {
    onChange(
      subtasks.map((s) =>
        s.id === id ? { ...s, completed: !s.completed } : s
      )
    );
  };

  const remove = (id) => {
    onChange(subtasks.filter((s) => s.id !== id));
  };

  return (
    <div>
      {subtasks.map((sub) => (
        <div key={sub.id} className="group flex items-center gap-2 py-1.5">
          <button
            onClick={() => toggle(sub.id)}
            className={clsx(
              'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-all',
              sub.completed
                ? 'border-emerald-500 bg-emerald-500 text-white'
                : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
            )}
          >
            {sub.completed && <Check size={10} strokeWidth={3} />}
          </button>
          <span
            className={clsx(
              'flex-1 text-sm',
              sub.completed ? 'text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300'
            )}
          >
            {sub.title}
          </span>
          <button
            onClick={() => remove(sub.id)}
            className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
          >
            <X size={12} />
          </button>
        </div>
      ))}
      {showInput ? (
        <div className="flex items-center gap-2 py-1.5">
          <input
            autoFocus
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') add();
              if (e.key === 'Escape') {
                setShowInput(false);
                setNewTitle('');
              }
            }}
            onBlur={() => {
              if (newTitle.trim()) add();
              else setShowInput(false);
            }}
            placeholder="Subtask title..."
            className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none dark:text-gray-300 dark:placeholder-gray-600"
          />
        </div>
      ) : (
        <button
          onClick={() => setShowInput(true)}
          className="flex items-center gap-1.5 py-1.5 text-xs text-gray-500 transition-colors hover:text-gray-700 dark:hover:text-gray-300"
        >
          <Plus size={12} /> Add subtask
        </button>
      )}
    </div>
  );
}

function ChecklistItem({ item, onToggle, onRemove }) {
  return (
    <div className="group flex items-center gap-2 py-1.5">
      <button
        onClick={() => onToggle(item.id)}
        className={clsx(
          'flex h-4 w-4 flex-shrink-0 items-center justify-center rounded border transition-all',
          item.checked
            ? 'border-emerald-500 bg-emerald-500 text-white'
            : 'border-gray-300 hover:border-gray-400 dark:border-gray-600 dark:hover:border-gray-500'
        )}
      >
        {item.checked && <Check size={10} strokeWidth={3} />}
      </button>
      <span
        className={clsx(
          'flex-1 text-sm',
          item.checked ? 'text-gray-500 line-through' : 'text-gray-700 dark:text-gray-300'
        )}
      >
        {item.text}
      </span>
      <button
        onClick={() => onRemove(item.id)}
        className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400 transition-all"
      >
        <X size={12} />
      </button>
    </div>
  );
}

export default function TodoDetail({ todo, onClose }) {
  const [local, setLocal] = useState({ ...todo });
  const [tagInput, setTagInput] = useState('');
  const [newCheckItem, setNewCheckItem] = useState('');
  const [newLink, setNewLink] = useState('');
  const [showCheckInput, setShowCheckInput] = useState(false);
  const [showLinkInput, setShowLinkInput] = useState(false);

  const { updateTodo, deleteTodo, archiveTodo, duplicateTodo, restoreTodo } = useTodoStore();
  const { projects } = useProjectStore();

  useEffect(() => {
    setLocal({ ...todo });
  }, [todo?.id]);

  const update = (field, value) => {
    setLocal((prev) => ({ ...prev, [field]: value }));
  };

  const save = async (field) => {
    try {
      await updateTodo(todo.id, { [field]: local[field] });
    } catch {
      toast.error('Failed to update');
    }
  };

  const handleDelete = async () => {
    if (local.deletedAt) {
      await deleteTodo(todo.id, { permanent: true });
      toast.success('Task permanently deleted');
    } else {
      await deleteTodo(todo.id);
      toast.success('Task deleted');
    }
    onClose();
  };

  const handleArchive = async () => {
    await archiveTodo(todo.id);
    toast.success('Task archived');
    onClose();
  };

  const handleDuplicate = async () => {
    await duplicateTodo(todo.id);
    toast.success('Task duplicated');
  };

  const handleRestore = async () => {
    await restoreTodo(todo.id);
    toast.success('Task restored');
    onClose();
  };

  const addTag = () => {
    if (!tagInput.trim()) return;
    const tags = [...(local.tags || []), tagInput.trim()];
    update('tags', tags);
    setTagInput('');
    save('tags');
  };

  const removeTag = (tag) => {
    update(
      'tags',
      local.tags.filter((t) => t !== tag)
    );
    setTimeout(() => save('tags'), 0);
  };

  const toggleCheckItem = (id) => {
    const items = (local.checklist || []).map((item) =>
      item.id === id ? { ...item, checked: !item.checked } : item
    );
    update('checklist', items);
    setTimeout(() => save('checklist'), 0);
  };

  const removeCheckItem = (id) => {
    update(
      'checklist',
      (local.checklist || []).filter((item) => item.id !== id)
    );
    setTimeout(() => save('checklist'), 0);
  };

  const addCheckItem = () => {
    if (!newCheckItem.trim()) return;
    const items = [
      ...(local.checklist || []),
      { id: Date.now().toString(), text: newCheckItem.trim(), checked: false },
    ];
    update('checklist', items);
    setNewCheckItem('');
    save('checklist');
  };

  const addLink = () => {
    if (!newLink.trim()) return;
    const links = [...(local.links || []), newLink.trim()];
    update('links', links);
    setNewLink('');
    save('links');
  };

  const removeLink = (idx) => {
    const links = (local.links || []).filter((_, i) => i !== idx);
    update('links', links);
    save('links');
  };

  if (!todo) return null;

  const isTrashed = Boolean(local.deletedAt);

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex h-full w-full max-w-lg flex-col overflow-hidden border-l border-gray-200 bg-white shadow-2xl animate-slide-in-right dark:border-gray-700/50 dark:bg-gray-900">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4 dark:border-gray-800">
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-500">
              Created {formatDistanceToNow(new Date(local.createdAt), { addSuffix: true })}
            </span>
            {local.updatedAt !== local.createdAt && (
              <span className="text-xs text-gray-500 dark:text-gray-600">
                · Edited {formatDistanceToNow(new Date(local.updatedAt), { addSuffix: true })}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-800 dark:hover:text-gray-300"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-6">
            {/* Title */}
            <EditableTitle
              value={local.title}
              onSave={(val) => {
                update('title', val);
                save('title');
              }}
            />

            {/* Toggles row */}
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  update('isMyDay', !local.isMyDay);
                  save('isMyDay');
                }}
                className={clsx(
                  'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                  local.isMyDay
                    ? 'border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600'
                )}
              >
                <Sun size={13} /> My Day
              </button>
              <button
                onClick={() => {
                  update('isImportant', !local.isImportant);
                  save('isImportant');
                }}
                className={clsx(
                  'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                  local.isImportant
                    ? 'border-blue-500/30 bg-blue-500/10 text-blue-600 dark:text-blue-400'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600'
                )}
              >
                <Star size={13} /> Important
              </button>
              <button
                onClick={() => {
                  update('isPinned', !local.isPinned);
                  save('isPinned');
                }}
                className={clsx(
                  'flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all',
                  local.isPinned
                    ? 'border-purple-500/30 bg-purple-500/10 text-purple-600 dark:text-purple-400'
                    : 'border-gray-200 text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600'
                )}
              >
                <Pin size={13} /> Pin
              </button>
            </div>

            {/* Priority */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                <Flag size={12} /> Priority
              </label>
              <div className="flex gap-2">
                {PRIORITY_OPTIONS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => {
                      update('priority', p.value);
                      save('priority');
                    }}
                    className={clsx(
                      'rounded-lg border px-3 py-1.5 text-xs font-bold transition-all',
                      local.priority === p.value
                        ? `${p.color} ${p.border}`
                        : 'border-gray-200 bg-transparent text-gray-500 hover:border-gray-300 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600'
                    )}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Status */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400">Status</label>
              <select
                value={local.status || 'inbox'}
                onChange={(e) => {
                  update('status', e.target.value);
                  save('status');
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Due Date & Time */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                  <Calendar size={12} /> Due Date
                </label>
                <input
                  type="date"
                  value={local.dueDate ? new Date(local.dueDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => {
                    update('dueDate', e.target.value || null);
                    save('dueDate');
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500/50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                />
              </div>
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                  <Clock size={12} /> Due Time
                </label>
                <input
                  type="time"
                  value={local.dueTime || ''}
                  onChange={(e) => {
                    update('dueTime', e.target.value || null);
                    save('dueTime');
                  }}
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500/50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                <Tag size={12} /> Tags
              </label>
              <div className="flex flex-wrap gap-1.5">
                {(local.tags || []).map((tag) => (
                  <span
                    key={tag}
                    className="group/tag flex items-center gap-1 rounded-md bg-emerald-500/15 px-2 py-1 text-xs text-emerald-600 dark:text-emerald-400"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="hidden group-hover/tag:inline"
                    >
                      <X size={10} />
                    </button>
                  </span>
                ))}
              </div>
              <input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') addTag();
                  if (e.key === ',') addTag();
                }}
                placeholder="Add tag and press Enter"
                className="mt-2 w-full bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none dark:text-gray-300 dark:placeholder-gray-600"
              />
            </div>

            {/* Project selector */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                <Folder size={12} /> Project
              </label>
              <select
                value={local.projectId || ''}
                onChange={(e) => {
                  update('projectId', e.target.value || null);
                  save('projectId');
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500/50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value="">No project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Category */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400">Category</label>
              <input
                value={local.category || ''}
                onChange={(e) => update('category', e.target.value)}
                onBlur={() => save('category')}
                placeholder="e.g., Work, Personal"
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500/50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-600"
              />
            </div>

            {/* Description */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400">Description</label>
              <textarea
                value={local.description || ''}
                onChange={(e) => update('description', e.target.value)}
                onBlur={() => save('description')}
                rows={3}
                placeholder="Add a description..."
                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500/50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-600"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400">Notes</label>
              <textarea
                value={local.notes || ''}
                onChange={(e) => update('notes', e.target.value)}
                onBlur={() => save('notes')}
                rows={3}
                placeholder="Add notes..."
                className="w-full resize-none rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500/50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-600"
              />
            </div>

            {/* Estimated Duration & Location */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400">
                  Est. Duration (min)
                </label>
                <input
                  type="number"
                  value={local.estimatedDuration || ''}
                  onChange={(e) => update('estimatedDuration', parseInt(e.target.value) || null)}
                  onBlur={() => save('estimatedDuration')}
                  placeholder="e.g., 30"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500/50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-600"
                />
              </div>
              <div>
                <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                  <MapPin size={12} /> Location
                </label>
                <input
                  value={local.location || ''}
                  onChange={(e) => update('location', e.target.value)}
                  onBlur={() => save('location')}
                  placeholder="e.g., Office"
                  className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-500/50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 dark:placeholder-gray-600"
                />
              </div>
            </div>

            {/* Recurrence */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                <Repeat size={12} /> Recurrence
              </label>
              <select
                value={local.recurrence?.type || ''}
                onChange={(e) => {
                  update('recurrence', e.target.value ? { type: e.target.value, interval: 1 } : null);
                  save('recurrence');
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500/50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              >
                <option value="">Does not repeat</option>
                <option value="daily">Daily</option>
                <option value="weekdays">Every weekday</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
              </select>
            </div>

            {/* Reminder */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                <Bell size={12} /> Reminder
              </label>
              <input
                type="datetime-local"
                value={local.reminder ? new Date(local.reminder).toISOString().slice(0, 16) : ''}
                onChange={(e) => {
                  update('reminder', e.target.value || null);
                  save('reminder');
                }}
                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none focus:border-blue-500/50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
              />
            </div>

            {/* Subtasks */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400">
                Subtasks ({(local.subtasks || []).filter((s) => s.completed).length}/
                {(local.subtasks || []).length})
              </label>
              <div className="h-1 w-full rounded-full bg-gray-200 dark:bg-gray-800">
                <div
                  className="h-full rounded-full bg-blue-500 transition-all duration-300"
                  style={{
                    width: `${
                      (local.subtasks || []).length
                        ? ((local.subtasks || []).filter((s) => s.completed).length /
                            (local.subtasks || []).length) *
                          100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <div className="mt-2">
                <SubtaskList
                  subtasks={local.subtasks || []}
                  onChange={(val) => {
                    update('subtasks', val);
                    save('subtasks');
                  }}
                />
              </div>
            </div>

            {/* Checklist */}
            <div>
              <label className="mb-2 block text-xs font-medium text-gray-500 dark:text-gray-400">Checklist</label>
              {(local.checklist || []).map((item) => (
                <ChecklistItem
                  key={item.id}
                  item={item}
                  onToggle={toggleCheckItem}
                  onRemove={removeCheckItem}
                />
              ))}
              {showCheckInput ? (
                <div className="flex items-center gap-2 py-1.5">
                  <input
                    autoFocus
                    value={newCheckItem}
                    onChange={(e) => setNewCheckItem(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addCheckItem();
                      if (e.key === 'Escape') {
                        setShowCheckInput(false);
                        setNewCheckItem('');
                      }
                    }}
                    onBlur={() => {
                      if (newCheckItem.trim()) addCheckItem();
                      else setShowCheckInput(false);
                    }}
                    placeholder="Checklist item..."
                    className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none dark:text-gray-300 dark:placeholder-gray-600"
                  />
                </div>
              ) : (
                <button
                  onClick={() => setShowCheckInput(true)}
                  className="flex items-center gap-1.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <Plus size={12} /> Add checklist item
                </button>
              )}
            </div>

            {/* Links */}
            <div>
              <label className="mb-2 flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400">
                <Link size={12} /> Links
              </label>
              {(local.links || []).map((link, idx) => (
                <div key={idx} className="group flex items-center gap-2 py-1">
                  <a
                    href={link}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 truncate text-sm text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {link}
                  </a>
                  <button
                    onClick={() => removeLink(idx)}
                    className="opacity-0 group-hover:opacity-100 text-gray-600 hover:text-red-400"
                  >
                    <X size={12} />
                  </button>
                </div>
              ))}
              {showLinkInput ? (
                <div className="flex items-center gap-2 py-1">
                  <input
                    autoFocus
                    value={newLink}
                    onChange={(e) => setNewLink(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') addLink();
                      if (e.key === 'Escape') {
                        setShowLinkInput(false);
                        setNewLink('');
                      }
                    }}
                    placeholder="https://..."
                    className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none dark:text-gray-300 dark:placeholder-gray-600"
                  />
                </div>
              ) : (
                <button
                  onClick={() => setShowLinkInput(true)}
                  className="flex items-center gap-1.5 py-1.5 text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  <Plus size={12} /> Add link
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="border-t border-gray-100 px-6 py-4 dark:border-gray-800">
          {isTrashed ? (
            <div className="flex gap-2">
              <button
                onClick={handleRestore}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-blue-500"
              >
                <RotateCcw size={15} /> Restore
              </button>
              <button
                onClick={handleDelete}
                className="flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2.5 text-sm font-medium text-red-400 transition-all hover:bg-red-500/20"
              >
                <Trash2 size={15} /> Delete Permanently
              </button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleDuplicate}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
              >
                <Copy size={13} /> Duplicate
              </button>
              <button
                onClick={handleArchive}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700 dark:border-gray-700 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:text-gray-300"
              >
                <Archive size={13} /> Archive
              </button>
              <button
                onClick={handleDelete}
                className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs text-gray-500 transition-colors hover:border-red-500/20 hover:text-red-400 dark:border-gray-700 dark:text-gray-400"
              >
                <Trash2 size={13} /> Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
