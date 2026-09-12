import { useState, useEffect } from 'react';
import {
  Plus,
  FolderKanban,
  Trash2,
  Edit3,
  Archive,
  CheckCircle2,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useProjectStore } from '../stores/projectStore';
import { useNavigate, useLocation } from 'react-router-dom';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';

const PROJECT_ICONS = ['📁', '🚀', '💼', '🎯', '📊', '🛠️', '💡', '🔬', '🎨', '📱'];
const PROJECT_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#6366f1', '#f97316', '#14b8a6'];
const STATUS_FILTERS = ['all', 'active', 'completed', 'archived'];

export default function Projects() {
  const { projects, fetchProjects, createProject, updateProject, deleteProject, archiveProject } = useProjectStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(null);
  const [filter, setFilter] = useState('all');
  const [newName, setNewName] = useState('');
  const [newIcon, setNewIcon] = useState(0);
  const [newColor, setNewColor] = useState(0);
  const [editName, setEditName] = useState('');
  const [editIcon, setEditIcon] = useState(0);
  const [editColor, setEditColor] = useState(0);

  useEffect(() => {
    fetchProjects().finally(() => setLoading(false));
  }, [fetchProjects]);

  useEffect(() => {
    if (new URLSearchParams(location.search).get('new') === '1') {
      setShowCreate(true);
      window.history.replaceState({}, '', location.pathname);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredProjects = projects.filter((p) => {
    if (filter === 'all') return true;
    if (filter === 'archived') return p.status === 'archived';
    if (filter === 'completed') return p.status === 'completed';
    return p.status !== 'archived' && p.status !== 'completed';
  });

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await createProject({ name: newName, icon: PROJECT_ICONS[newIcon], color: PROJECT_COLORS[newColor] });
      toast.success('Project created');
      setShowCreate(false);
      setNewName('');
      setNewIcon(0);
      setNewColor(0);
    } catch {
      toast.error('Failed to create project');
    }
  };

  const openEdit = (project) => {
    setEditName(project.name);
    setEditIcon(PROJECT_ICONS.indexOf(project.icon) >= 0 ? PROJECT_ICONS.indexOf(project.icon) : 0);
    setEditColor(PROJECT_COLORS.indexOf(project.color) >= 0 ? PROJECT_COLORS.indexOf(project.color) : 0);
    setShowEdit(project);
  };

  const handleEdit = async () => {
    if (!editName.trim() || !showEdit) return;
    try {
      await updateProject(showEdit._id, { name: editName, icon: PROJECT_ICONS[editIcon], color: PROJECT_COLORS[editColor] });
      toast.success('Project updated');
      setShowEdit(null);
    } catch {
      toast.error('Failed to update project');
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteProject(id);
      toast.success('Project deleted');
    } catch {
      toast.error('Failed to delete project');
    }
  };

  const handleArchive = async (id) => {
    try {
      await archiveProject(id);
      toast.success('Project archived');
    } catch {
      toast.error('Failed to archive project');
    }
  };

  const getProgress = (project) => {
    const total = project.totalTodos || 0;
    const completed = project.completedTodos || 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Projects</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{projects.length} projects</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary btn-sm">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </div>

      <div className="flex gap-2">
        {STATUS_FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors',
              filter === f
                ? 'bg-blue-500 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {filteredProjects.length === 0 && !loading && (
        <EmptyState
          icon={FolderKanban}
          title="No projects yet"
          description="Organize your tasks into projects to stay on top of everything."
          onAction={() => setShowCreate(true)}
          actionLabel="Create Project"
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {filteredProjects.map((project) => {
          const progress = getProgress(project);
          return (
            <div
              key={project._id}
              className="card p-5 hover:shadow-md transition-shadow cursor-pointer group"
              onClick={() => navigate(`/projects/${project._id}`)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-lg"
                    style={{ backgroundColor: (project.color || '#3b82f6') + '15' }}
                  >
                    {project.icon || '📁'}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{project.name}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{project.totalTodos || 0} tasks</p>
                  </div>
                </div>
                <div className="flex gap-1 transition-opacity md:opacity-0 md:group-hover:opacity-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEdit(project); }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleArchive(project._id); }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-yellow-500/10"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(project._id); }}
                    className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-500">Progress</span>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${progress}%`, backgroundColor: project.color || '#3b82f6' }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between mt-3 text-[11px] text-gray-400">
                <span className="flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {project.completedTodos || 0} done
                </span>
                {project.status === 'completed' && (
                  <span className="flex items-center gap-1 text-green-500">
                    <CheckCircle2 className="w-3 h-3" /> Completed
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="New Project" size="sm">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              placeholder="Project name"
              className="input"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {PROJECT_ICONS.map((icon, i) => (
                <button
                  key={i}
                  onClick={() => setNewIcon(i)}
                  className={clsx(
                    'w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all',
                    newIcon === i ? 'bg-blue-500/10 ring-2 ring-blue-500 scale-110' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Color</label>
            <div className="flex gap-2">
              {PROJECT_COLORS.map((color, i) => (
                <button
                  key={color}
                  onClick={() => setNewColor(i)}
                  className={clsx(
                    'w-7 h-7 rounded-full transition-transform',
                    newColor === i ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800 scale-110' : 'hover:scale-110'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setShowCreate(false)} className="btn-secondary btn-sm">Cancel</button>
          <button onClick={handleCreate} className="btn-primary btn-sm">Create</button>
        </div>
      </Modal>

      <Modal isOpen={!!showEdit} onClose={() => setShowEdit(null)} title="Edit Project" size="sm">
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Name</label>
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEdit()}
              className="input"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {PROJECT_ICONS.map((icon, i) => (
                <button
                  key={i}
                  onClick={() => setEditIcon(i)}
                  className={clsx(
                    'w-9 h-9 rounded-lg flex items-center justify-center text-lg transition-all',
                    editIcon === i ? 'bg-blue-500/10 ring-2 ring-blue-500 scale-110' : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600'
                  )}
                >
                  {icon}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Color</label>
            <div className="flex gap-2">
              {PROJECT_COLORS.map((color, i) => (
                <button
                  key={color}
                  onClick={() => setEditColor(i)}
                  className={clsx(
                    'w-7 h-7 rounded-full transition-transform',
                    editColor === i ? 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800 scale-110' : 'hover:scale-110'
                  )}
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setShowEdit(null)} className="btn-secondary btn-sm">Cancel</button>
          <button onClick={handleEdit} className="btn-primary btn-sm">Save</button>
        </div>
      </Modal>
    </div>
  );
}
