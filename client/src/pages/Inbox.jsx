import { useState, useEffect } from 'react';
import { useTodoStore } from '../stores/todoStore';
import { useUIStore } from '../stores/uiStore';
import QuickAdd from '../components/todo/QuickAdd';
import TodoList from '../components/todo/TodoList';
import TodoDetail from '../components/todo/TodoDetail';
import BulkActions from '../components/todo/BulkActions';
import { Inbox as InboxIcon, Mail } from 'lucide-react';

export default function Inbox() {
  const { todos, fetchTodos, isLoading } = useTodoStore();
  const { selectedTodos } = useUIStore();
  const [selectedTodo, setSelectedTodo] = useState(null);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const inboxTodos = todos.filter(
    (t) => !t.projectId && t.status !== 'completed' && t.status !== 'trashed'
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/15">
            <InboxIcon size={20} className="text-blue-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-100">Inbox</h1>
            <p className="text-xs text-gray-500">Tasks without a project</p>
          </div>
        </div>
      </div>

      {/* Quick Add */}
      <div className="mb-4">
        <QuickAdd />
      </div>

      {/* Todo List */}
      <div className="flex-1 overflow-y-auto">
        <TodoList
          todos={inboxTodos}
          isLoading={isLoading}
          emptyMessage="Your inbox is clean! Add a task above."
          onOpenDetail={setSelectedTodo}
        />
      </div>

      {/* Bulk Actions */}
      {selectedTodos.length > 0 && <BulkActions />}

      {/* Detail Panel */}
      {selectedTodo && (
        <TodoDetail todo={selectedTodo} onClose={() => setSelectedTodo(null)} />
      )}
    </div>
  );
}
