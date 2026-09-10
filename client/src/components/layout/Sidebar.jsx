import { NavLink, useLocation } from 'react-router-dom';
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
} from 'lucide-react';
import { useState, useEffect } from 'react';
import clsx from 'clsx';
import useUIStore from '../../stores/uiStore';
import useProjectStore from '../../stores/projectStore';
import useAuthStore from '../../stores/authStore';

export default function Sidebar() {
  const { toggleSidebar, setCurrentView } = useUIStore();
  const { projects, fetchProjects } = useProjectStore();
  const { user } = useAuthStore();
  const location = useLocation();
  const [projectsExpanded, setProjectsExpanded] = useState(true);
  const [tagsExpanded, setTagsExpanded] = useState(false);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  useEffect(() => {
    const path = location.pathname.split('/').filter(Boolean)[0] || 'inbox';
    setCurrentView(path);
  }, [location.pathname, setCurrentView]);

  const smartLists = [
    { to: '/inbox', icon: Inbox, label: 'Inbox', badge: 3, color: 'text-blue-500' },
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

  const sampleTags = [
    { label: 'work', color: 'bg-blue-500' },
    { label: 'personal', color: 'bg-green-500' },
    { label: 'urgent', color: 'bg-red-500' },
    { label: 'learning', color: 'bg-purple-500' },
  ];

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100 dark:border-gray-700/50">
        <div className="flex items-center gap-2.5">
          <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md shadow-blue-500/25">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-lg font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            TaskFlow
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
          <button
            onClick={() => setProjectsExpanded(!projectsExpanded)}
            className="flex items-center justify-between w-full px-3 mb-2 group"
          >
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Projects
            </span>
            <div className="flex items-center gap-1">
              <button
                className="p-0.5 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                }}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              {projectsExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              )}
            </div>
          </button>
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
                  {project.taskCount != null && (
                    <span className="text-xs text-gray-400 dark:text-gray-500">
                      {project.taskCount}
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
          <button
            onClick={() => setTagsExpanded(!tagsExpanded)}
            className="flex items-center justify-between w-full px-3 mb-2 group"
          >
            <span className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
              Tags
            </span>
            <div className="flex items-center gap-1">
              <button
                className="p-0.5 rounded text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              {tagsExpanded ? (
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
              )}
            </div>
          </button>
          {tagsExpanded && (
            <nav className="flex flex-wrap gap-2 px-3">
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
        <div className="flex items-center gap-2 px-3 py-2 mb-1 rounded-lg text-gray-500 dark:text-gray-400 text-sm">
          <Trash2 className="w-[18px] h-[18px]" />
          <span>Trash</span>
        </div>
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
