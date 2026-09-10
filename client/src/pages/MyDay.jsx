import { useState, useEffect, useMemo } from 'react';
import { useTodoStore } from '../stores/todoStore';
import { useUIStore } from '../stores/uiStore';
import QuickAdd from '../components/todo/QuickAdd';
import TodoItem from '../components/todo/TodoItem';
import TodoDetail from '../components/todo/TodoDetail';
import BulkActions from '../components/todo/BulkActions';
import { Sun, Clock, AlertTriangle, Sparkles, CheckCircle2 } from 'lucide-react';
import { isPast, parseISO, isToday, format } from 'date-fns';
import clsx from 'clsx';

export default function MyDay() {
  const { todos, fetchTodos, fetchMyDay, myDay, isLoading } = useTodoStore();
  const { selectedTodos } = useUIStore();
  const [selectedTodo, setSelectedTodo] = useState(null);

  useEffect(() => {
    fetchTodos({});
    fetchMyDay();
  }, [fetchTodos, fetchMyDay]);

  const myDayTodos = useMemo(
    () => todos.filter((t) => t.isMyDay && t.status !== 'completed' && t.status !== 'trashed'),
    [todos]
  );

  const overdue = useMemo(
    () =>
      todos.filter(
        (t) =>
          t.dueDate &&
          isPast(parseISO(t.dueDate)) &&
          !isToday(parseISO(t.dueDate)) &&
          t.status !== 'completed' &&
          t.status !== 'trashed' &&
          !t.isMyDay
      ),
    [todos]
  );

  const todayTasks = useMemo(
    () =>
      todos.filter(
        (t) =>
          t.dueDate &&
          isToday(parseISO(t.dueDate)) &&
          t.status !== 'completed' &&
          t.status !== 'trashed' &&
          !t.isMyDay
      ),
    [todos]
  );

  const completedToday = useMemo(
    () =>
      todos.filter(
        (t) =>
          t.status === 'completed' &&
          t.completedAt &&
          isToday(parseISO(t.completedAt))
      ),
    [todos]
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/15">
            <Sun size={20} className="text-amber-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">My Day</h1>
            <p className="text-xs text-gray-500">{format(new Date(), 'EEEE, MMMM d')}</p>
          </div>
        </div>
      </div>

      {/* Quick Add */}
      <div className="mb-4">
        <QuickAdd />
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto">
        {/* My Day Tasks */}
        <div>
          <div className="mb-3 flex items-center gap-2 px-1">
            <Sun size={14} className="text-amber-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
              My Day
            </h3>
            <span className="rounded-full bg-gray-200/80 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-700/40">
              {myDayTodos.length}
            </span>
          </div>
          {myDayTodos.length === 0 && !isLoading ? (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-6 text-center dark:border-gray-800/50 dark:bg-gray-800/20">
              <Sparkles size={24} className="mx-auto mb-2 text-amber-500/40" />
              <p className="text-sm text-gray-500 dark:text-gray-400">
                No tasks in your day yet. Add one above or mark tasks as My Day.
              </p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {myDayTodos.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onOpenDetail={setSelectedTodo}
                />
              ))}
            </div>
          )}
        </div>

        {/* Overdue */}
        {overdue.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2 px-1">
              <AlertTriangle size={14} className="text-red-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Overdue
              </h3>
              <span className="rounded-full bg-red-500/20 px-1.5 py-0.5 text-[10px] text-red-400">
                {overdue.length}
              </span>
            </div>
            <div className="space-y-1.5">
              {overdue.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onOpenDetail={setSelectedTodo}
                />
              ))}
            </div>
          </div>
        )}

        {/* Due Today */}
        {todayTasks.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2 px-1">
              <Clock size={14} className="text-blue-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Due Today
              </h3>
              <span className="rounded-full bg-blue-500/20 px-1.5 py-0.5 text-[10px] text-blue-400">
                {todayTasks.length}
              </span>
            </div>
            <div className="space-y-1.5">
              {todayTasks.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onOpenDetail={setSelectedTodo}
                />
              ))}
            </div>
          </div>
        )}

        {/* Completed Today */}
        {completedToday.length > 0 && (
          <div>
            <div className="mb-3 flex items-center gap-2 px-1">
              <CheckCircle2 size={14} className="text-emerald-400" />
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                Completed Today
              </h3>
              <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-400">
                {completedToday.length}
              </span>
            </div>
            <div className="space-y-1.5 opacity-60">
              {completedToday.map((todo) => (
                <TodoItem
                  key={todo.id}
                  todo={todo}
                  onOpenDetail={setSelectedTodo}
                />
              ))}
            </div>
          </div>
        )}

        {/* Smart suggestions */}
        {!isLoading && myDayTodos.length === 0 && overdue.length === 0 && todayTasks.length === 0 && (
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800/50 dark:bg-gray-800/20">
            <Sparkles size={32} className="mx-auto mb-3 text-amber-500/30" />
            <h3 className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">You're all caught up!</h3>
            <p className="text-xs text-gray-500 dark:text-gray-600">
              Add tasks to your day or check your inbox for new items.
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
