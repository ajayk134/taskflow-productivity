import { useState, useEffect, useMemo } from 'react';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Plus,
  GripVertical,
  Circle,
  CheckCircle2,
  Clock,
  Eye,
  Inbox,
  ChevronDown,
} from 'lucide-react';
import clsx from 'clsx';
import { useTodoStore } from '../stores/todoStore';
import { useProjectStore } from '../stores/projectStore';
import TodoDetail from '../components/todo/TodoDetail';
import toast from 'react-hot-toast';

const COLUMNS = [
  { id: 'inbox', label: 'Inbox', icon: Inbox, color: 'bg-blue-500' },
  { id: 'next', label: 'Next', icon: Clock, color: 'bg-yellow-500' },
  { id: 'in-progress', label: 'In Progress', icon: Eye, color: 'bg-purple-500' },
  { id: 'review', label: 'Review', icon: Circle, color: 'bg-orange-500' },
  { id: 'completed', label: 'Completed', icon: CheckCircle2, color: 'bg-green-500' },
];

function mapTodoStatus(todo) {
  if (todo.completed) return 'completed';
  if (todo.status) return todo.status;
  if (todo.list === 'inbox') return 'inbox';
  return 'inbox';
}

function KanbanCard({ todo, onOpen }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: todo._id, data: { todo } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const priorityColors = {
    1: 'border-l-red-500',
    2: 'border-l-orange-500',
    3: 'border-l-yellow-500',
    4: 'border-l-blue-500',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={clsx(
        'bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 border-l-[3px] p-3 cursor-pointer hover:shadow-md transition-shadow group',
        isDragging && 'opacity-50 shadow-lg',
        priorityColors[todo.priority] || 'border-l-gray-300'
      )}
      onClick={() => onOpen?.(todo)}
    >
      <div className="flex items-start gap-2">
        <button
          className="mt-0.5 p-1 -ml-1 transition-opacity cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 md:opacity-0 md:group-hover:opacity-100"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="w-3.5 h-3.5" />
        </button>
        <div className="flex-1 min-w-0">
          <p className={clsx('text-sm font-medium', todo.completed ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-gray-100')}>
            {todo.title}
          </p>
          {(todo.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {todo.tags.slice(0, 3).map((tag) => (
                <span key={typeof tag === 'string' ? tag : tag._id} className="px-1.5 py-0.5 text-[10px] font-medium rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                  {typeof tag === 'string' ? tag : tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function KanbanColumn({ column, todos, _onAddTask, onOpenTask }) {
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const { createTodo, fetchTodos } = useTodoStore();
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { column },
  });

  const handleCreate = async () => {
    if (!newTitle.trim()) return;
    try {
      const data = { title: newTitle };
      if (column.id === 'completed') {
        data.completed = true;
      } else {
        data.status = column.id;
      }
      await createTodo(data);
      toast.success('Task added');
      setNewTitle('');
      setShowAdd(false);
      fetchTodos();
    } catch {
      toast.error('Failed to add task');
    }
  };

  return (
    <div className="flex flex-col w-full md:w-[300px] lg:w-[300px] md:min-w-[300px] md:flex-shrink-0">
      <div className="flex items-center gap-2 px-3 py-2 mb-2 md:mb-3">
        <div className={clsx('w-2 h-2 rounded-full', column.color)} />
        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{column.label}</h3>
        <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded-full font-medium">
          {todos.length}
        </span>
      </div>

      <div
        ref={setNodeRef}
        className={clsx(
          'flex-1 space-y-2 min-h-[120px] md:min-h-[200px] p-1 rounded-xl bg-gray-50/50 dark:bg-gray-800/30',
          isOver && 'ring-2 ring-blue-400/60 bg-blue-50/60 dark:bg-blue-500/5'
        )}
      >
        <SortableContext items={todos.map((t) => t._id)} strategy={verticalListSortingStrategy}>
          {todos.map((todo) => (
            <KanbanCard key={todo._id} todo={todo} onOpen={onOpenTask} />
          ))}
        </SortableContext>

        {showAdd ? (
          <div className="p-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <input
              type="text"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleCreate();
                if (e.key === 'Escape') { setShowAdd(false); setNewTitle(''); }
              }}
              placeholder="Task title"
              className="w-full px-2 py-1 text-sm bg-transparent focus:outline-none text-gray-900 dark:text-gray-100 placeholder-gray-400"
              autoFocus
            />
            <div className="flex gap-1 mt-2">
              <button onClick={handleCreate} className="px-2 py-1 text-xs font-medium bg-blue-500 text-white rounded hover:bg-blue-600">Add</button>
              <button onClick={() => { setShowAdd(false); setNewTitle(''); }} className="px-2 py-1 text-xs font-medium text-gray-500 hover:text-gray-700 rounded hover:bg-gray-100 dark:hover:bg-gray-700">Cancel</button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-white dark:hover:bg-gray-800 rounded-lg transition-colors"
          >
            <Plus className="w-4 h-4" /> Add task
          </button>
        )}
      </div>
    </div>
  );
}

export default function Kanban() {
  const { todos, fetchTodos, updateTodo } = useTodoStore();
  const { projects, fetchProjects } = useProjectStore();
  const [selectedProject, setSelectedProject] = useState('all');
  const [activeId, setActiveId] = useState(null);
  const [selectedTodo, setSelectedTodo] = useState(null);

  useEffect(() => {
    fetchTodos();
    fetchProjects();
  }, [fetchTodos, fetchProjects]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const filteredTodos = useMemo(() => {
    if (selectedProject === 'all') return todos;
    return todos.filter((t) => t.projectId === selectedProject);
  }, [todos, selectedProject]);

  const columnTodos = useMemo(() => {
    const map = {};
    COLUMNS.forEach((c) => { map[c.id] = []; });
    filteredTodos.forEach((todo) => {
      const status = mapTodoStatus(todo);
      if (map[status]) map[status].push(todo);
    });
    return map;
  }, [filteredTodos]);

  const handleDragStart = (event) => setActiveId(event.active.id);

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeTodo = todos.find((t) => t._id === active.id);
    if (!activeTodo) return;

    let targetColumn = null;
    if (COLUMNS.find((c) => c.id === over.id)) {
      targetColumn = over.id;
    } else {
      const overTodo = todos.find((t) => t._id === over.id);
      if (overTodo) targetColumn = mapTodoStatus(overTodo);
    }

    if (!targetColumn || targetColumn === mapTodoStatus(activeTodo)) return;

    const updates = {};
    if (targetColumn === 'completed') {
      updates.completed = true;
      updates.status = 'completed';
    } else {
      updates.completed = false;
      updates.status = targetColumn;
    }

    try {
      await updateTodo(activeTodo._id, updates);
      toast.success(`Moved to ${COLUMNS.find((c) => c.id === targetColumn)?.label}`);
    } catch {
      toast.error('Failed to move task');
    }
  };

  const activeTodo = activeId ? todos.find((t) => t._id === activeId) : null;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Kanban Board</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Drag tasks between columns</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <select
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="appearance-none input pr-8 text-sm"
            >
              <option value="all">All Projects</option>
              {projects.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex flex-col md:flex-row gap-5 md:gap-4 md:overflow-x-auto md:pb-4 md:-mx-2 md:px-2">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              todos={columnTodos[column.id]}
              onOpenTask={setSelectedTodo}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTodo && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 shadow-xl opacity-90 rotate-2 w-full max-w-[300px]">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{activeTodo.title}</p>
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {selectedTodo && (
        <TodoDetail todo={selectedTodo} onClose={() => setSelectedTodo(null)} />
      )}
    </div>
  );
}
