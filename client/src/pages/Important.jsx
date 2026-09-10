import { useState, useEffect, useMemo } from 'react';
import { useTodoStore } from '../stores/todoStore';
import { useUIStore } from '../stores/uiStore';
import QuickAdd from '../components/todo/QuickAdd';
import TodoItem from '../components/todo/TodoItem';
import TodoDetail from '../components/todo/TodoDetail';
import BulkActions from '../components/todo/BulkActions';
import { Star } from 'lucide-react';
import clsx from 'clsx';

export default function Important() {
  const { todos, fetchTodos, isLoading } = useTodoStore();
  const { selectedTodos } = useUIStore();
  const [selectedTodo, setSelectedTodo] = useState(null);

  useEffect(() => {
    fetchTodos({ isImportant: true });
  }, [fetchTodos]);

  const importantTodos = useMemo(
    () =>
      todos.filter(
        (t) => t.isImportant && t.status !== 'completed' && t.status !== 'trashed'
      ),
    [todos]
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15">
            <Star size={20} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Important</h1>
            <p className="text-xs text-gray-500">
              {importantTodos.length} important task{importantTodos.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
      </div>

      {/* Quick Add */}
      <div className="mb-4">
        <QuickAdd />
      </div>

      {/* Todo List */}
      <div className="flex-1 overflow-y-auto">
        {importantTodos.length === 0 && !isLoading ? (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800/50 dark:bg-gray-800/20">
            <Star size={32} className="mx-auto mb-3 text-blue-500/30" />
            <h3 className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">No important tasks</h3>
            <p className="text-xs text-gray-500 dark:text-gray-600">
              Star tasks to mark them as important.
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {importantTodos.map((todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onOpenDetail={setSelectedTodo}
              />
            ))}
          </div>
        )}
      </div>

      {selectedTodos.length > 0 && <BulkActions />}

      {selectedTodo && (
        <TodoDetail todo={selectedTodo} onClose={() => setSelectedTodo(null)} />
      )}
    </div>
  );
}
