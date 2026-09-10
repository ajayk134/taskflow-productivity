import { useState, useEffect, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useProjectStore } from '../stores/projectStore';
import { useTodoStore } from '../stores/todoStore';
import { useUIStore } from '../stores/uiStore';
import QuickAdd from '../components/todo/QuickAdd';
import TodoList from '../components/todo/TodoList';
import TodoDetail from '../components/todo/TodoDetail';
import BulkActions from '../components/todo/BulkActions';
import {
  Folder,
  Pencil,
  Trash2,
  Archive,
  Columns3,
  LayoutList,
  MoreHorizontal,
  ArrowLeft,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';

export default function ProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentProject, fetchProject, updateProject, deleteProject, archiveProject } =
    useProjectStore();
  const { todos, fetchTodos, isLoading } = useTodoStore();
  const { selectedTodos } = useUIStore();
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [viewMode, setViewMode] = useState('list');
  const [showMenu, setShowMenu] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    fetchProject(id);
    fetchTodos({ projectId: id });
  }, [id, fetchProject, fetchTodos]);

  const projectTodos = useMemo(
    () =>
      todos.filter(
        (t) => t.projectId === id && t.status !== 'completed' && t.status !== 'trashed'
      ),
    [todos, id]
  );

  const completedTodos = useMemo(
    () => todos.filter((t) => t.projectId === id && t.status === 'completed'),
    [todos, id]
  );

  const handleSaveName = async () => {
    if (nameDraft.trim() && nameDraft !== currentProject?.name) {
      await updateProject(id, { name: nameDraft.trim() });
      toast.success('Project renamed');
    }
    setIsEditingName(false);
  };

  const handleDelete = async () => {
    await deleteProject(id);
    toast.success('Project deleted');
    navigate('/projects');
  };

  const handleArchive = async () => {
    await archiveProject(id);
    toast.success('Project archived');
    navigate('/projects');
  };

  if (!currentProject) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-700 border-t-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/projects')}
          className="mb-3 flex items-center gap-1 text-xs text-gray-500 transition-colors hover:text-gray-300"
        >
          <ArrowLeft size={14} /> Projects
        </button>
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{
              backgroundColor: `${currentProject.color || '#6366f1'}20`,
            }}
          >
            <Folder
              size={20}
              style={{ color: currentProject.color || '#6366f1' }}
            />
          </div>
          <div className="min-w-0 flex-1">
            {isEditingName ? (
              <input
                autoFocus
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveName();
                  if (e.key === 'Escape') setIsEditingName(false);
                }}
                className="w-full bg-transparent text-xl font-bold text-gray-100 outline-none"
              />
            ) : (
              <h1
                onClick={() => {
                  setNameDraft(currentProject.name);
                  setIsEditingName(true);
                }}
                className="cursor-pointer text-xl font-bold text-gray-100 hover:text-white"
              >
                {currentProject.name}
              </h1>
            )}
            <p className="text-xs text-gray-500">
              {projectTodos.length} tasks · {completedTodos.length} completed
            </p>
          </div>

          {/* View toggle */}
          <div className="flex items-center gap-1 rounded-lg border border-gray-700/50 bg-gray-800/50 p-0.5">
            <button
              onClick={() => setViewMode('list')}
              className={clsx(
                'rounded-md p-1.5 transition-all',
                viewMode === 'list'
                  ? 'bg-gray-700 text-gray-200'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              <LayoutList size={14} />
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={clsx(
                'rounded-md p-1.5 transition-all',
                viewMode === 'kanban'
                  ? 'bg-gray-700 text-gray-200'
                  : 'text-gray-500 hover:text-gray-300'
              )}
            >
              <Columns3 size={14} />
            </button>
          </div>

          {/* More menu */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-700/50 hover:text-gray-300"
            >
              <MoreHorizontal size={18} />
            </button>
            {showMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowMenu(false)}
                />
                <div className="absolute right-0 top-full z-50 mt-1 w-44 rounded-xl border border-gray-700/50 bg-gray-800 py-1 shadow-xl">
                  <button
                    onClick={() => {
                      setNameDraft(currentProject.name);
                      setIsEditingName(true);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-gray-700/50"
                  >
                    <Pencil size={13} /> Rename
                  </button>
                  <button
                    onClick={() => {
                      handleArchive();
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-300 hover:bg-gray-700/50"
                  >
                    <Archive size={13} /> Archive
                  </button>
                  <hr className="my-1 border-gray-700/50" />
                  <button
                    onClick={() => {
                      setShowConfirmDelete(true);
                      setShowMenu(false);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-xs text-red-400 hover:bg-red-500/10"
                  >
                    <Trash2 size={13} /> Delete Project
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Description */}
        {currentProject.description && (
          <p className="mt-3 text-sm text-gray-500">{currentProject.description}</p>
        )}
      </div>

      {/* Quick Add */}
      <div className="mb-4">
        <QuickAdd projectId={id} />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {viewMode === 'list' ? (
          <TodoList
            todos={projectTodos}
            isLoading={isLoading}
            emptyMessage="No tasks in this project yet."
            onOpenDetail={setSelectedTodo}
          />
        ) : (
          <KanbanView todos={projectTodos} onOpenDetail={setSelectedTodo} />
        )}
      </div>

      {selectedTodos.length > 0 && <BulkActions />}

      {selectedTodo && (
        <TodoDetail todo={selectedTodo} onClose={() => setSelectedTodo(null)} />
      )}

      {/* Delete Confirmation */}
      {showConfirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowConfirmDelete(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-gray-700/50 bg-gray-800 p-6 shadow-2xl">
            <h3 className="mb-2 text-sm font-semibold text-gray-100">Delete Project?</h3>
            <p className="mb-4 text-xs text-gray-500">
              This will permanently delete "{currentProject.name}" and all its tasks.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmDelete(false)}
                className="flex-1 rounded-lg border border-gray-700 px-4 py-2 text-sm text-gray-300 hover:bg-gray-700/50"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-500"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function KanbanView({ todos, onOpenDetail }) {
  const columns = {
    inbox: { label: 'To Do', color: 'border-gray-600' },
    'in-progress': { label: 'In Progress', color: 'border-blue-500' },
    completed: { label: 'Done', color: 'border-emerald-500' },
  };

  const grouped = {};
  Object.keys(columns).forEach((key) => {
    grouped[key] = todos.filter((t) => t.status === key);
  });

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Object.entries(columns).map(([status, config]) => (
        <div key={status} className="min-w-[280px] flex-1">
          <div className={clsx('mb-3 border-t-2 pt-3', config.color)}>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
                {config.label}
              </h3>
              <span className="rounded-full bg-gray-700/40 px-1.5 py-0.5 text-[10px] text-gray-500">
                {grouped[status]?.length || 0}
              </span>
            </div>
          </div>
          <div className="space-y-2">
            {(grouped[status] || []).map((todo) => (
              <div
                key={todo.id}
                onClick={() => onOpenDetail(todo)}
                className="cursor-pointer rounded-xl border border-gray-700/30 bg-gray-800/40 p-3 transition-all hover:border-gray-600/40 hover:bg-gray-800/60"
              >
                <p className="text-sm text-gray-200">{todo.title}</p>
                <div className="mt-2 flex items-center gap-2">
                  {todo.priority && todo.priority <= 2 && (
                    <span
                      className={clsx(
                        'text-[10px] font-bold',
                        todo.priority === 1 ? 'text-red-400' : 'text-orange-400'
                      )}
                    >
                      P{todo.priority}
                    </span>
                  )}
                  {todo.dueDate && (
                    <span className="rounded bg-gray-700/30 px-1.5 py-0.5 text-[10px] text-gray-500">
                      {new Date(todo.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
