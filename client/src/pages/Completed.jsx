import { useState, useEffect, useMemo } from 'react';
import { useTodoStore } from '../stores/todoStore';
import { useUIStore } from '../stores/uiStore';
import TodoItem from '../components/todo/TodoItem';
import TodoDetail from '../components/todo/TodoDetail';
import BulkActions from '../components/todo/BulkActions';
import { CheckCircle2, Trash2, Archive } from 'lucide-react';
import { format, isToday, isYesterday, parseISO } from 'date-fns';
import clsx from 'clsx';

function groupByDate(todos) {
  const groups = {};
  todos.forEach((todo) => {
    if (!todo.completedAt) return;
    const date = parseISO(todo.completedAt);
    let key;
    if (isToday(date)) key = 'Today';
    else if (isYesterday(date)) key = 'Yesterday';
    else key = format(date, 'EEEE, MMMM d');
    if (!groups[key]) groups[key] = [];
    groups[key].push(todo);
  });
  return groups;
}

export default function Completed() {
  const { todos, fetchTodos, isLoading } = useTodoStore();
  const { selectedTodos } = useUIStore();
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchTodos({ status: 'completed' });
  }, [fetchTodos]);

  const completedTodos = useMemo(
    () => todos.filter((t) => t.status === 'completed'),
    [todos]
  );

  const filtered = useMemo(() => {
    switch (filter) {
      case 'today':
        return completedTodos.filter(
          (t) => t.completedAt && isToday(parseISO(t.completedAt))
        );
      case 'week': {
        const weekAgo = new Date();
        weekAgo.setDate(weekAgo.getDate() - 7);
        return completedTodos.filter(
          (t) => t.completedAt && parseISO(t.completedAt) >= weekAgo
        );
      }
      default:
        return completedTodos;
    }
  }, [completedTodos, filter]);

  const grouped = useMemo(() => groupByDate(filtered), [filtered]);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/15">
            <CheckCircle2 size={20} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Completed</h1>
            <p className="text-xs text-gray-500">{completedTodos.length} tasks completed</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex gap-2">
        {[
          { value: 'all', label: 'All time' },
          { value: 'week', label: 'This week' },
          { value: 'today', label: 'Today' },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={clsx(
              'rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
              filter === f.value
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700/40 dark:hover:text-gray-300'
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto">
        {Object.entries(grouped).map(([date, tasks]) => (
          <div key={date}>
            <div className="mb-3 flex items-center gap-2 px-1">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">
                {date}
              </h3>
              <span className="rounded-full bg-gray-200/80 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-700/40">
                {tasks.length}
              </span>
            </div>
            <div className="space-y-1.5">
              {tasks.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onOpenDetail={setSelectedTodo}
                />
              ))}
            </div>
          </div>
        ))}

        {!isLoading && filtered.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800/50 dark:bg-gray-800/20">
            <CheckCircle2 size={32} className="mx-auto mb-3 text-emerald-500/30" />
            <h3 className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">No completed tasks</h3>
            <p className="text-xs text-gray-500 dark:text-gray-600">
              Completed tasks will appear here.
            </p>
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
