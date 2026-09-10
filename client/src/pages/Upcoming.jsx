import { useState, useEffect, useMemo } from 'react';
import { useTodoStore } from '../stores/todoStore';
import { useUIStore } from '../stores/uiStore';
import QuickAdd from '../components/todo/QuickAdd';
import TodoItem from '../components/todo/TodoItem';
import TodoDetail from '../components/todo/TodoDetail';
import BulkActions from '../components/todo/BulkActions';
import { Calendar, ChevronRight, ChevronLeft } from 'lucide-react';
import {
  format,
  isThisWeek,
  differenceInCalendarWeeks,
  isToday,
  parseISO,
  startOfWeek,
  endOfWeek,
  addWeeks,
} from 'date-fns';
import clsx from 'clsx';

export default function Upcoming() {
  const { todos, fetchTodos, isLoading } = useTodoStore();
  const { selectedTodos } = useUIStore();
  const [selectedTodo, setSelectedTodo] = useState(null);
  const [weekOffset, setWeekOffset] = useState(0);

  useEffect(() => {
    fetchTodos({});
  }, [fetchTodos]);

  const thisWeekTodos = useMemo(() => {
    return todos.filter(
      (t) =>
        t.dueDate &&
        isThisWeek(parseISO(t.dueDate), { weekStartsOn: 1 }) &&
        !isToday(parseISO(t.dueDate)) &&
        t.status !== 'completed' &&
        t.status !== 'trashed'
    );
  }, [todos]);

  const nextWeekTodos = useMemo(() => {
    return todos.filter(
      (t) =>
        t.dueDate &&
        differenceInCalendarWeeks(parseISO(t.dueDate), new Date(), {
          weekStartsOn: 1,
        }) === 1 &&
        t.status !== 'completed' &&
        t.status !== 'trashed'
    );
  }, [todos]);

  const laterTodos = useMemo(() => {
    const nextWeekEnd = endOfWeek(addWeeks(new Date(), 1), { weekStartsOn: 1 });
    return todos.filter(
      (t) =>
        t.dueDate &&
        parseISO(t.dueDate) > nextWeekEnd &&
        t.status !== 'completed' &&
        t.status !== 'trashed'
    );
  }, [todos]);

  const todayTodos = useMemo(
    () =>
      todos.filter(
        (t) =>
          t.dueDate &&
          isToday(parseISO(t.dueDate)) &&
          t.status !== 'completed' &&
          t.status !== 'trashed'
      ),
    [todos]
  );

  const Section = ({ title, tasks, icon: Icon, color }) => (
    <div>
      <div className="mb-3 flex items-center gap-2 px-1">
        {Icon && <Icon size={14} className={color} />}
        <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {title}
        </h3>
        <span className="rounded-full bg-gray-200/80 px-1.5 py-0.5 text-[10px] text-gray-500 dark:bg-gray-700/40">
          {tasks.length}
        </span>
      </div>
      {tasks.length === 0 ? (
        <p className="px-1 py-3 text-xs text-gray-600">No tasks</p>
      ) : (
        <div className="space-y-1.5">
          {tasks.map((todo) => (
            <TodoItem key={todo.id} todo={todo} onOpenDetail={setSelectedTodo} />
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15">
            <Calendar size={20} className="text-indigo-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">Upcoming</h1>
            <p className="text-xs text-gray-500">
              {format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'MMM d')} –{' '}
              {format(endOfWeek(addWeeks(new Date(), weekOffset + 1), { weekStartsOn: 1 }), 'MMM d, yyyy')}
            </p>
          </div>
          <div className="ml-auto flex items-center gap-1">
            <button
              onClick={() => setWeekOffset(Math.max(0, weekOffset - 1))}
              disabled={weekOffset === 0}
              className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700/50 dark:hover:text-gray-300 disabled:opacity-30"
            >
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setWeekOffset(weekOffset + 1)}
              className="rounded-lg p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700/50 dark:hover:text-gray-300"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* Quick Add */}
      <div className="mb-4">
        <QuickAdd />
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto">
        <Section title="Today" tasks={todayTodos} icon={Calendar} color="text-amber-400" />
        <Section
          title="This Week"
          tasks={thisWeekTodos}
          icon={Calendar}
          color="text-blue-400"
        />
        <Section
          title="Next Week"
          tasks={nextWeekTodos}
          icon={Calendar}
          color="text-purple-400"
        />
        <Section title="Later" tasks={laterTodos} icon={Calendar} color="text-gray-500" />

        {!isLoading &&
          todayTodos.length === 0 &&
          thisWeekTodos.length === 0 &&
          nextWeekTodos.length === 0 &&
          laterTodos.length === 0 && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-8 text-center dark:border-gray-800/50 dark:bg-gray-800/20">
              <Calendar size={32} className="mx-auto mb-3 text-indigo-500/30" />
              <h3 className="mb-1 text-sm font-medium text-gray-500 dark:text-gray-400">No upcoming tasks</h3>
              <p className="text-xs text-gray-500 dark:text-gray-600">
                Tasks with due dates will appear here.
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
