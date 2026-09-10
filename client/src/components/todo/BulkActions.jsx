import { useState } from 'react';
import { useTodoStore } from '../../stores/todoStore';
import { useUIStore } from '../../stores/uiStore';
import { useProjectStore } from '../../stores/projectStore';
import {
  Check,
  Trash2,
  Archive,
  Flag,
  Tag,
  Folder,
  X,
  CheckSquare,
  Square,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

const PRIORITY_OPTIONS = [
  { value: 1, label: 'P1', color: 'text-red-400' },
  { value: 2, label: 'P2', color: 'text-orange-400' },
  { value: 3, label: 'P3', color: 'text-blue-400' },
  { value: 4, label: 'P4', color: 'text-gray-400' },
];

export default function BulkActions() {
  const [showPriorityMenu, setShowPriorityMenu] = useState(false);
  const [showTagMenu, setShowTagMenu] = useState(false);
  const [showProjectMenu, setShowProjectMenu] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const { bulkUpdate, bulkDelete, selectedTodos } = useTodoStore();
  const { toggleSelectTodo, selectAllTodos, clearSelection } = useUIStore();
  const { projects } = useProjectStore();

  const count = selectedTodos?.length || 0;
  if (count === 0) return null;

  const handleComplete = async () => {
    await bulkUpdate(selectedTodos, {
      status: 'completed',
      completedAt: new Date().toISOString(),
    });
    toast.success(`${count} task${count > 1 ? 's' : ''} completed`);
    clearSelection();
  };

  const handleDelete = async () => {
    await bulkDelete(selectedTodos);
    toast.success(`${count} task${count > 1 ? 's' : ''} deleted`);
    clearSelection();
  };

  const handleArchive = async () => {
    await bulkUpdate(selectedTodos, { archivedAt: new Date().toISOString() });
    toast.success(`${count} task${count > 1 ? 's' : ''} archived`);
    clearSelection();
  };

  const handleChangePriority = async (priority) => {
    await bulkUpdate(selectedTodos, { priority });
    toast.success(`Priority updated to P${priority}`);
    setShowPriorityMenu(false);
    clearSelection();
  };

  const handleAddTag = async () => {
    if (!tagInput.trim()) return;
    const todos = useTodoStore.getState().todos;
    const updates = selectedTodos.map((id) => {
      const todo = todos.find((t) => t.id === id);
      return {
        id,
        tags: [...new Set([...(todo?.tags || []), tagInput.trim()])],
      };
    });
    for (const u of updates) {
      await bulkUpdate([u.id], { tags: u.tags });
    }
    toast.success(`Tag "${tagInput}" added`);
    setTagInput('');
    setShowTagMenu(false);
    clearSelection();
  };

  const handleMoveToProject = async (projectId) => {
    await bulkUpdate(selectedTodos, { projectId });
    toast.success(`${count} task${count > 1 ? 's' : ''} moved`);
    setShowProjectMenu(false);
    clearSelection();
  };

  return (
    <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-slide-up">
      <div className="flex items-center gap-3 rounded-2xl border border-gray-700/50 bg-gray-800/95 px-5 py-3 shadow-2xl backdrop-blur-xl">
        {/* Select all / Clear */}
        <button
          onClick={() => selectAllTodos([])}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-700/50 hover:text-gray-300"
          title="Select all"
        >
          <CheckSquare size={14} />
        </button>
        <button
          onClick={clearSelection}
          className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-gray-400 transition-colors hover:bg-gray-700/50 hover:text-gray-300"
          title="Clear selection"
        >
          <Square size={14} />
        </button>

        <div className="h-6 w-px bg-gray-700" />

        {/* Count */}
        <span className="min-w-[60px] text-center text-sm font-medium text-gray-200">
          {count} selected
        </span>

        <div className="h-6 w-px bg-gray-700" />

        {/* Actions */}
        <button
          onClick={handleComplete}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-emerald-400 transition-colors hover:bg-emerald-500/10"
        >
          <Check size={14} /> Complete
        </button>
        <button
          onClick={handleArchive}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-blue-400 transition-colors hover:bg-blue-500/10"
        >
          <Archive size={14} /> Archive
        </button>

        {/* Priority dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowPriorityMenu(!showPriorityMenu);
              setShowTagMenu(false);
              setShowProjectMenu(false);
            }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-amber-400 transition-colors hover:bg-amber-500/10"
          >
            <Flag size={14} /> Priority
          </button>
          {showPriorityMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-32 rounded-xl border border-gray-700/50 bg-gray-800 py-1 shadow-xl">
              {PRIORITY_OPTIONS.map((p) => (
                <button
                  key={p.value}
                  onClick={() => handleChangePriority(p.value)}
                  className={clsx(
                    'flex w-full items-center px-3 py-1.5 text-xs transition-colors hover:bg-gray-700/50',
                    p.color
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Tags dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowTagMenu(!showTagMenu);
              setShowPriorityMenu(false);
              setShowProjectMenu(false);
            }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-emerald-400 transition-colors hover:bg-emerald-500/10"
          >
            <Tag size={14} /> Tags
          </button>
          {showTagMenu && (
            <div className="absolute bottom-full left-0 mb-2 w-48 rounded-xl border border-gray-700/50 bg-gray-800 p-3 shadow-xl">
              <input
                autoFocus
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleAddTag();
                }}
                placeholder="Tag name..."
                className="mb-2 w-full rounded-lg border border-gray-700 bg-gray-900 px-3 py-1.5 text-xs text-gray-200 placeholder-gray-500 outline-none focus:border-blue-500/50"
              />
              <button
                onClick={handleAddTag}
                className="w-full rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
              >
                Add Tag
              </button>
            </div>
          )}
        </div>

        {/* Project dropdown */}
        <div className="relative">
          <button
            onClick={() => {
              setShowProjectMenu(!showProjectMenu);
              setShowPriorityMenu(false);
              setShowTagMenu(false);
            }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-purple-400 transition-colors hover:bg-purple-500/10"
          >
            <Folder size={14} /> Move
          </button>
          {showProjectMenu && (
            <div className="absolute bottom-full right-0 mb-2 w-48 rounded-xl border border-gray-700/50 bg-gray-800 py-1 shadow-xl">
              <button
                onClick={() => handleMoveToProject(null)}
                className="flex w-full items-center px-3 py-2 text-xs text-gray-300 transition-colors hover:bg-gray-700/50"
              >
                No project
              </button>
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleMoveToProject(p.id)}
                  className="flex w-full items-center px-3 py-2 text-xs text-gray-300 transition-colors hover:bg-gray-700/50"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="h-6 w-px bg-gray-700" />

        <button
          onClick={handleDelete}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-red-400 transition-colors hover:bg-red-500/10"
        >
          <Trash2 size={14} /> Delete
        </button>

        <button
          onClick={clearSelection}
          className="ml-1 rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-700/50 hover:text-gray-300"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
