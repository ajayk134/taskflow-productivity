import { useState, useEffect } from 'react';
import { useTodoStore } from '../stores/todoStore';
import TodoDetail from '../components/todo/TodoDetail';
import { Trash2, RotateCcw, X, AlertTriangle } from 'lucide-react';
import { formatDistanceToNow, parseISO } from 'date-fns';
import clsx from 'clsx';
import toast from 'react-hot-toast';

function TrashItem({ todo, onRestore, onDelete, onOpen }) {
  return (
    <div className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 transition-all hover:border-gray-300 hover:bg-gray-100 dark:border-gray-800/30 dark:bg-gray-800/20 dark:hover:border-gray-700/40 dark:hover:bg-gray-800/40">
      <div className="min-w-0 flex-1 cursor-pointer" onClick={() => onOpen(todo)}>
        <span className="block truncate text-sm text-gray-500 line-through dark:text-gray-400">{todo.title}</span>
        <span className="mt-0.5 block text-[10px] text-gray-500 dark:text-gray-600">
          Deleted {formatDistanceToNow(new Date(todo.deletedAt || todo.updatedAt), { addSuffix: true })}
        </span>
      </div>
      <div className="flex items-center gap-1.5 transition-opacity md:opacity-0 md:group-hover:opacity-100">
        <button
          onClick={() => onRestore(todo.id)}
          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-blue-500/10 hover:text-blue-400"
          title="Restore"
        >
          <RotateCcw size={14} />
        </button>
        <button
          onClick={() => onDelete(todo.id)}
          className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-red-500/10 hover:text-red-400"
          title="Delete permanently"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

export default function Trash() {
  const { trash, fetchTrash, restoreTodo, emptyTrash, deleteTodo, isLoading } = useTodoStore();
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [showConfirmEmpty, setShowConfirmEmpty] = useState(false);

  useEffect(() => {
    fetchTrash();
  }, [fetchTrash]);

  const handleRestore = async (id) => {
    await restoreTodo(id);
    toast.success('Task restored');
  };

  const handlePermanentDelete = async (id) => {
    await deleteTodo(id, { permanent: true });
    toast.success('Task permanently deleted');
  };

  const handleEmptyTrash = async () => {
    await emptyTrash();
    setShowConfirmEmpty(false);
    toast.success('Trash emptied');
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15">
            <Trash2 size={20} className="text-red-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Trash</h1>
            <p className="text-xs text-gray-500">
              {trash.length} deleted task{trash.length !== 1 ? 's' : ''}
            </p>
          </div>
          {trash.length > 0 && (
            <button
              onClick={() => setShowConfirmEmpty(true)}
              className="ml-auto rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20"
            >
              Empty Trash
            </button>
          )}
        </div>
      </div>

      {/* Trash List */}
      <div className="flex-1 overflow-y-auto">
        {trash.length === 0 && !isLoading ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800/50 dark:bg-gray-800/20">
            <Trash2 size={32} className="mx-auto mb-3 text-gray-600/40" />
            <h3 className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">Trash is empty</h3>
            <p className="text-xs text-gray-500 dark:text-gray-600">Deleted tasks will appear here.</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {trash.map((todo) => (
              <TrashItem
                key={todo.id}
                todo={todo}
                onRestore={handleRestore}
                onDelete={handlePermanentDelete}
                onOpen={setSelectedTodo}
              />
            ))}
          </div>
        )}
      </div>

      {/* Empty Trash Confirmation */}
      {showConfirmEmpty && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/50"
            onClick={() => setShowConfirmEmpty(false)}
          />
          <div className="relative z-10 w-full max-w-sm rounded-2xl border border-gray-200 bg-white p-6 shadow-2xl dark:border-gray-700/50 dark:bg-gray-800">
            <div className="mb-4 flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/15">
                <AlertTriangle size={20} className="text-red-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Empty Trash?</h3>
                <p className="text-xs text-gray-500">
                  This will permanently delete {trash.length} task{trash.length !== 1 ? 's' : ''}.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowConfirmEmpty(false)}
                className="flex-1 rounded-lg border border-gray-200 px-4 py-2 text-sm text-gray-600 transition-colors hover:bg-gray-100 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700/50"
              >
                Cancel
              </button>
              <button
                onClick={handleEmptyTrash}
                className="flex-1 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-500"
              >
                Empty
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTodo && (
        <TodoDetail todo={selectedTodo} onClose={() => setSelectedTodo(null)} />
      )}
    </div>
  );
}
