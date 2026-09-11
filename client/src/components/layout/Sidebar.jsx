import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import {
  Inbox,
  SunMedium,
  CalendarDays,
  Clock,
  Star,
  CheckCircle2,
  FolderKanban,
  Tag,
  Repeat,
  Target,
  Settings,
  Plus,
  ChevronDown,
  ChevronRight,
  Zap,
  Trash2,
  BarChart3,
  StickyNote,
  X,
  Check,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import useUIStore from '../../stores/uiStore';
import useProjectStore from '../../stores/projectStore';
import useAuthStore from '../../stores/authStore';
import useTodoStore from '../../stores/todoStore';
import api from '../../utils/api';

const TAG_COLORS = ['#6366f1', '#3b82f6', '#10b981', '#f59e0b', '#ef4444'];

export default function Sidebar() {
  const { toggleSidebar, setCurrentView } = useUIStore();
  const { projects, fetchProjects } = useProjectStore();
  const { user } = useAuthStore();
  const { todos, fetchTodos } = useTodoStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const [tags, setTags] = useState([]);
  const [creatingTag, setCreatingTag] = useState(false);
  const [tagName, setTagName] = useState('');
  const [tagColor, setTagColor] = useState(TAG_COLORS[0]);
  const [tagCreating, setTagCreating] = useState(false);

  useEffect(() => {
    api
      .get('/tags')
      .then((data) => setTags(data.tags || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  useEffect(() => {
    const path = location.pathname.split('/').filter(Boolean)[0] || 'inbox';
    setCurrentView(path);
  }, [location.pathname, setCurrentView]);

  const inboxCount = todos.filter(
    (t) => !t.projectId && t.status !== 'completed' && t.status !== 'archived'
  ).length;

  const smartLists = [
    { to: '/inbox', icon: Inbox, label: 'Inbox', badge: inboxCount, color: 'text-blue-500' },
    { to: '/my-day', icon: SunMedium, label: 'My Day', color: 'text-amber-500' },
    { to: '/today', icon: CalendarDays, label: 'Today', color: 'text-emerald-500' },
    { to: '/upcoming', icon: Clock, label: 'Upcoming', color: 'text-violet-500' },
    { to: '/important', icon: Star, label: 'Important', color: 'text-rose-500' },
    { to: '/completed', icon: CheckCircle2, label: 'Completed', color: 'text-teal-500' },
  ];

  const toolLinks = [
    { to: '/calendar', icon: CalendarDays, label: 'Calendar' },
    { to: '/kanban', icon: FolderKanban, label: 'Kanban Board' },
    { to: '/habits', icon: Repeat, label: 'Habits' },
    { to: '/goals', icon: Target, label: 'Goals' },
    { to: '/analytics', icon: BarChart3, label: 'Analytics' },
    { to: '/notes', icon: StickyNote, label: 'Notes' },
  ];

  const sampleTags = tags.map((tag) => ({
    label: tag.name,
    color: tag.color || 'bg-gray-500',
  }));

  const handleCreateProject = () => {
    if (window.innerWidth < 1024) toggleSidebar();
    navigate('/projects?new=1');
  };

  const openTagCreate = () => {
    setTagsExpanded(true);
    setCreatingTag(true);
    setTagName('');
    setTagColor(TAG_COLORS[0]);
  };

  const handleCreateTag = async () => {
    const name = tagName.trim();
    if (!name) return;
    if (tagCreating) return;
    setTagCreating(true);
    try {
      const { tag } = await api.post('/tags', { name, color: tagColor });
      setTags((prev) => {
        const existing = prev.find((t) => t.name === tag.name);
        return existing
          ? prev.map((t) => (t.name === tag.name ? tag : t))
          : [tag, ...prev];
      });
      toast.success(`Tag "${tag.name}" created`);
      setCreatingTag(false);
      setTagName('');
    } catch {
      toast.error('Failed to create tag');
    } finally {
      setTagCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/25">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Donezo
          </span>
        </div>
        <button
          onClick={toggleSidebar}
          className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:hover:text-gray-300 transition-colors lg:hidden"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
        <section>
          <p className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Smart Lists
          </p>
          <nav className="space-y-0.5">
            {smartLists.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 shadow-sm'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                  )
                }
                onClick={() => {
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
              >
                <item.icon className={clsx('w-[18px] h-[18px]', item.color)} />
                <span className="flex-1">{item.label}</span>
                {item.badge && (
                  <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400">
                    {item.badge}
                  </span>
                )}
              </NavLink>
            ))}
          </nav>
        </section>

        <section>
          <div className="flex items-center justify-between px-3 mb-2">
            <button
              type="button"
              onClick={() => setProjectsExpanded(!projectsExpanded)}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <span>Projects</span>
              {projectsExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="button"
              aria-label="Create project"
              title="Create project"
              onClick={handleCreateProject}
              className="p-0.5 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          {projectsExpanded && (
            <nav className="space-y-0.5">
              {projects.map((project) => (
                <NavLink
                  key={project.id}
                  to={`/projects/${project.id}`}
                  className={({ isActive }) =>
                    clsx(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                      isActive
                        ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                    )
                  }
                  onClick={() => {
                    if (window.innerWidth < 1024) toggleSidebar();
                  }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: project.color || '#6366f1' }}
                  />
                  <span className="flex-1 truncate">{project.name}</span>
                  {project.totalTodos != null && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {project.totalTodos}
                    </span>
                  )}
                </NavLink>
              ))}
              {projects.length === 0 && (
                <p className="px-3 py-2 text-xs text-gray-400 dark:text-gray-500">
                  No projects yet
                </p>
              )}
            </nav>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between px-3 mb-2">
            <button
              type="button"
              onClick={() => setTagsExpanded(!tagsExpanded)}
              className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            >
              <span>Tags</span>
              {tagsExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              type="button"
              aria-label="Create tag"
              title="Create tag"
              onClick={openTagCreate}
              className="p-0.5 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
          {creatingTag && (
            <div className="px-3 mb-2">
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-700 rounded-lg px-2 py-1.5">
                <Tag className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <input
                  autoFocus
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleCreateTag();
                    else if (e.key === 'Escape') setCreatingTag(false);
                  }}
                  placeholder="Tag name..."
                  className="flex-1 min-w-0 bg-transparent text-sm text-gray-700 dark:text-gray-300 placeholder-gray-400 outline-none"
                />
                <div className="flex items-center gap-1 flex-shrink-0">
                  {TAG_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Tag color ${c}`}
                      onClick={() => setTagColor(c)}
                      className={clsx(
                        'w-3.5 h-3.5 rounded-full transition-transform hover:scale-110',
                        tagColor === c && 'ring-2 ring-offset-1 ring-gray-400 dark:ring-offset-gray-800'
                      )}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  aria-label="Save tag"
                  disabled={tagCreating}
                  onClick={handleCreateTag}
                  className="p-0.5 rounded text-blue-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
          {tagsExpanded && (
            <nav className="flex flex-wrap gap-2 px-3">
              {sampleTags.length === 0 && (
                <p className="text-xs text-gray-400 dark:text-gray-500">No tags yet</p>
              )}
              {sampleTags.map((tag) => (
                <span
                  key={tag.label}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 cursor-pointer transition-colors"
                >
                  <Tag className="w-3 h-3" />
                  {tag.label}
                </span>
              ))}
            </nav>
          )}
        </section>

        <section>
          <p className="px-3 mb-2 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
            Tools
          </p>
          <nav className="space-y-0.5">
            {toolLinks.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
                    isActive
                      ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                      : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                  )
                }
                onClick={() => {
                  if (window.innerWidth < 1024) toggleSidebar();
                }}
              >
                <item.icon className="w-[18px] h-[18px] text-gray-400 dark:text-gray-500" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </section>
      </div>

      <div className="px-3 py-3 border-t border-gray-100 dark:border-gray-700/50">
        <NavLink
          to="/trash"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-3 py-2 mb-1 rounded-lg text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
            )
          }
          onClick={() => {
            if (window.innerWidth < 1024) toggleSidebar();
          }}
        >
          <Trash2 className="w-[18px] h-[18px]" />
          <span>Trash</span>
        </NavLink>
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
              isActive
                ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
            )
          }
          onClick={() => {
            if (window.innerWidth < 1024) toggleSidebar();
          }}
        >
          <Settings className="w-[18px] h-[18px]" />
          <span>Settings</span>
        </NavLink>
      </div>
    </div>
  );
}
