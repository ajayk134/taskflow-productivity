import { useState, useEffect, useMemo } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  CalendarDays,
  List,
  Grid3X3,
  LayoutList,
} from 'lucide-react';
import clsx from 'clsx';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from 'date-fns';
import { useTodoStore } from '../stores/todoStore';
import Modal from '../components/common/Modal';
import toast from 'react-hot-toast';

const VIEWS = ['month', 'week', 'day', 'agenda'];
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const priorityDot = {
  urgent: 'bg-red-500',
  high: 'bg-orange-500',
  medium: 'bg-yellow-500',
  low: 'bg-blue-500',
};

export default function Calendar() {
  const { todos, fetchTodos, createTodo } = useTodoStore();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState('month');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createDate, setCreateDate] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('medium');

  useEffect(() => { fetchTodos(); }, [fetchTodos]);

  const todosByDate = useMemo(() => {
    const map = {};
    todos.forEach((todo) => {
      if (todo.dueDate) {
        const key = format(parseISO(todo.dueDate), 'yyyy-MM-dd');
        if (!map[key]) map[key] = [];
        map[key].push(todo);
      }
    });
    return map;
  }, [todos]);

  const navigatePrev = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(addDays(currentDate, -7));
    else if (view === 'day') setCurrentDate(addDays(currentDate, -1));
  };

  const navigateNext = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(addDays(currentDate, 7));
    else if (view === 'day') setCurrentDate(addDays(currentDate, 1));
  };

  const goToday = () => setCurrentDate(new Date());

  const openCreate = (date) => {
    setCreateDate(date);
    setNewTitle('');
    setNewPriority('medium');
    setShowCreateModal(true);
  };

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      await createTodo({ title: newTitle, dueDate: createDate.toISOString(), priority: newPriority });
      toast.success('Task created');
      setShowCreateModal(false);
      fetchTodos();
    } catch {
      toast.error('Failed to create task');
    }
  };

  const monthDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(currentDate));
    const end = endOfWeek(endOfMonth(currentDate));
    const days = [];
    let day = start;
    while (day <= end) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentDate]);

  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate);
    return Array.from({ length: 7 }, (_, i) => addDays(start, i));
  }, [currentDate]);

  const agendaTodos = useMemo(() => {
    const now = new Date();
    return todos
      .filter((t) => t.dueDate && parseISO(t.dueDate) >= now && !t.completed)
      .sort((a, b) => parseISO(a.dueDate) - parseISO(b.dueDate))
      .slice(0, 20);
  }, [todos]);

  const headerLabel = () => {
    if (view === 'month') return format(currentDate, 'MMMM yyyy');
    if (view === 'week') return `${format(weekDays[0], 'MMM d')} – ${format(weekDays[6], 'MMM d, yyyy')}`;
    return format(currentDate, 'EEEE, MMMM d, yyyy');
  };

  const renderMonthView = () => (
    <div className="grid grid-cols-7 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
      {WEEKDAYS.map((d) => (
        <div key={d} className="px-2 py-2.5 text-center text-xs font-semibold text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700">
          {d}
        </div>
      ))}
      {monthDays.map((day, idx) => {
        const key = format(day, 'yyyy-MM-dd');
        const dayTodos = todosByDate[key] || [];
        const inMonth = isSameMonth(day, currentDate);
        const selected = selectedDate && isSameDay(day, selectedDate);
        return (
          <button
            key={idx}
            className={clsx(
              'relative min-h-[80px] sm:min-h-[100px] p-1.5 text-left border-b border-r border-gray-100 dark:border-gray-700/50 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/50',
              !inMonth && 'opacity-30',
              selected && 'bg-blue-50 dark:bg-blue-500/10'
            )}
            onClick={() => setSelectedDate(day)}
            onDoubleClick={() => openCreate(day)}
          >
            <span
              className={clsx(
                'inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-medium',
                isToday(day) ? 'bg-blue-500 text-white' : 'text-gray-700 dark:text-gray-300'
              )}
            >
              {format(day, 'd')}
            </span>
            <div className="mt-1 space-y-0.5">
              {dayTodos.slice(0, 3).map((todo) => (
                <div key={todo._id} className="flex items-center gap-1 px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-700/50 text-[10px] leading-tight truncate">
                  <div className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', priorityDot[todo.priority] || 'bg-gray-400')} />
                  <span className="truncate text-gray-700 dark:text-gray-300">{todo.title}</span>
                </div>
              ))}
              {dayTodos.length > 3 && (
                <span className="text-[10px] text-gray-400 pl-1">+{dayTodos.length - 3}</span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderWeekView = () => (
    <div className="grid grid-cols-7 gap-2">
      {weekDays.map((day) => {
        const key = format(day, 'yyyy-MM-dd');
        const dayTodos = (todosByDate[key] || []).sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
        return (
          <div key={key} className={clsx('rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden', isToday(day) && 'ring-2 ring-blue-500')}>
            <div className={clsx('px-3 py-2 text-center', isToday(day) ? 'bg-blue-500 text-white' : 'bg-gray-50 dark:bg-gray-800/50')}>
              <p className="text-[10px] font-semibold uppercase">{format(day, 'EEE')}</p>
              <p className={clsx('text-lg font-bold', isToday(day) ? 'text-white' : 'text-gray-900 dark:text-gray-100')}>{format(day, 'd')}</p>
            </div>
            <div className="p-2 min-h-[120px] space-y-1">
              {dayTodos.map((todo) => (
                <div key={todo._id} className="px-2 py-1.5 rounded-lg bg-gray-50 dark:bg-gray-800 text-xs truncate text-gray-700 dark:text-gray-300">
                  <div className="flex items-center gap-1.5">
                    <div className={clsx('w-1.5 h-1.5 rounded-full flex-shrink-0', priorityDot[todo.priority] || 'bg-gray-400')} />
                    <span className="truncate">{todo.title}</span>
                  </div>
                </div>
              ))}
              <button
                onClick={() => openCreate(day)}
                className="w-full flex items-center justify-center gap-1 py-1 text-[11px] text-gray-400 hover:text-blue-500 transition-colors"
              >
                <Plus className="w-3 h-3" /> Add
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderDayView = () => {
    const key = format(currentDate, 'yyyy-MM-dd');
    const dayTodos = (todosByDate[key] || []).sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
    return (
      <div className="space-y-1">
        {dayTodos.length === 0 && (
          <div className="text-center py-16 text-gray-400 dark:text-gray-500">
            <CalendarDays className="w-10 h-10 mx-auto mb-3 opacity-50" />
            <p className="text-sm">No tasks for this day</p>
            <button onClick={() => openCreate(currentDate)} className="mt-3 text-sm text-blue-500 hover:text-blue-600 font-medium">+ Add Task</button>
          </div>
        )}
        {dayTodos.map((todo) => (
          <div key={todo._id} className="flex items-center gap-3 px-4 py-3 card">
            <div className={clsx('w-2 h-2 rounded-full flex-shrink-0', priorityDot[todo.priority] || 'bg-gray-400')} />
            <div className="flex-1 min-w-0">
              <p className={clsx('text-sm font-medium truncate', todo.completed ? 'line-through text-gray-400' : 'text-gray-900 dark:text-gray-100')}>{todo.title}</p>
            </div>
            <span className="text-xs text-gray-400">{format(parseISO(todo.dueDate), 'h:mm a')}</span>
          </div>
        ))}
        {dayTodos.length > 0 && (
          <button onClick={() => openCreate(currentDate)} className="w-full flex items-center justify-center gap-2 py-3 text-sm text-gray-400 hover:text-blue-500 transition-colors">
            <Plus className="w-4 h-4" /> Add Task
          </button>
        )}
      </div>
    );
  };

  const renderAgendaView = () => (
    <div className="space-y-3">
      {agendaTodos.length === 0 && (
        <div className="text-center py-16 text-gray-400 dark:text-gray-500">
          <LayoutList className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No upcoming tasks</p>
        </div>
      )}
      {agendaTodos.map((todo) => {
        const due = parseISO(todo.dueDate);
        const isOverdue = due < new Date();
        return (
          <div key={todo._id} className="flex items-center gap-4 px-4 py-3 card">
            <div className="text-center min-w-[48px]">
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{format(due, 'd')}</p>
              <p className="text-[10px] font-medium text-gray-500 uppercase">{format(due, 'MMM')}</p>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{todo.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={clsx('text-xs', isOverdue ? 'text-red-500 font-semibold' : 'text-gray-400')}>
                  {format(due, 'EEEE, h:mm a')}
                </span>
                <div className={clsx('w-1.5 h-1.5 rounded-full', priorityDot[todo.priority] || 'bg-gray-400')} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const viewIcons = { month: Grid3X3, week: CalendarDays, day: List, agenda: LayoutList };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Calendar</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{headerLabel()}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5">
            {VIEWS.map((v) => {
              const Icon = viewIcons[v];
              return (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={clsx(
                    'flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors capitalize',
                    view === v ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 shadow-sm' : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  )}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {v}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button onClick={goToday} className="btn-secondary btn-sm text-xs">Today</button>
        <button onClick={navigatePrev} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400">
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button onClick={navigateNext} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-600 dark:text-gray-400">
          <ChevronRight className="w-4 h-4" />
        </button>
        {selectedDate && (
          <button
            onClick={() => openCreate(selectedDate)}
            className="btn-primary btn-sm text-xs ml-auto"
          >
            <Plus className="w-3.5 h-3.5" /> Add Task
          </button>
        )}
      </div>

      <div className="card p-4">
        {view === 'month' && renderMonthView()}
        {view === 'week' && renderWeekView()}
        {view === 'day' && renderDayView()}
        {view === 'agenda' && renderAgendaView()}
      </div>

      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create Task" size="sm">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Title</label>
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Task title"
              className="input"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priority</label>
            <div className="flex gap-2">
              {['low', 'medium', 'high', 'urgent'].map((p) => (
                <button
                  key={p}
                  onClick={() => setNewPriority(p)}
                  className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors', newPriority === p ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600')}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Due: {createDate && format(createDate, 'EEEE, MMMM d, yyyy')}
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setShowCreateModal(false)} className="btn-secondary btn-sm">Cancel</button>
          <button onClick={handleCreate} className="btn-primary btn-sm">Create</button>
        </div>
      </Modal>
    </div>
  );
}
