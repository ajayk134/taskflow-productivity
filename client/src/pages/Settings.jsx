import { useState } from 'react';
import {
  Sun,
  Moon,
  Monitor,
  Download,
  Upload,
  ChevronRight,
  Check,
} from 'lucide-react';
import clsx from 'clsx';
import toast from 'react-hot-toast';
import { useUIStore } from '../stores/uiStore';
import { useAuthStore } from '../stores/authStore';
import { api } from '../utils/api';
import { applyAccent } from '../utils/theme';

const ACCENT_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#ef4444', '#f59e0b', '#10b981', '#06b6d4', '#6366f1'];
const THEMES = [
  { id: 'light', label: 'Light', icon: Sun },
  { id: 'dark', label: 'Dark', icon: Moon },
  { id: 'system', label: 'System', icon: Monitor },
];
const WEEK_STARTS = [
  { id: 'monday', label: 'Monday' },
  { id: 'sunday', label: 'Sunday' },
];

function Section({ title, children }) {
  return (
    <div className="card divide-y divide-gray-100 dark:divide-gray-700">
      <div className="px-5 py-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      </div>
      <div className="px-5 py-4 space-y-4">{children}</div>
    </div>
  );
}

function SettingRow({ label, description, children }) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
      <div className="min-w-0">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</p>
        {description && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{description}</p>}
      </div>
      <div className="flex-shrink-0 sm:ml-auto">{children}</div>
    </div>
  );
}

export default function Settings() {
  const { theme, setTheme } = useUIStore();
  const { user, updateProfile } = useAuthStore();
  const [accentColor, setAccentColor] = useState(() => localStorage.getItem('taskflow_accent') || '#3b82f6');
  const [defaultView, setDefaultView] = useState(() => localStorage.getItem('taskflow_defaultView') || 'inbox');
  const [weekStart, setWeekStart] = useState(() => localStorage.getItem('taskflow_weekStart') || 'monday');
  const [timezone, setTimezone] = useState(() => Intl.DateTimeFormat().resolvedOptions().timeZone);
  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem('taskflow_notifications');
    return stored ? JSON.parse(stored) : { email: true, push: false, daily: true, weekly: false };
  });
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  const updateAccentColor = (color) => {
    setAccentColor(color);
    localStorage.setItem('taskflow_accent', color);
    applyAccent(color);
    toast.success('Accent color updated');
  };

  const updateDefaultView = (view) => {
    setDefaultView(view);
    localStorage.setItem('taskflow_defaultView', view);
  };

  const updateWeekStart = (val) => {
    setWeekStart(val);
    localStorage.setItem('taskflow_weekStart', val);
  };

  const updateNotifications = (key, val) => {
    const updated = { ...notifications, [key]: val };
    setNotifications(updated);
    localStorage.setItem('taskflow_notifications', JSON.stringify(updated));
  };

  const handleExportData = async () => {
    try {
      const data = await api.get('/search/export');
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `donezo-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Data exported successfully');
    } catch {
      toast.error('Failed to export data');
    }
  };

  const handleImportData = async () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      try {
        const text = await file.text();
        const data = JSON.parse(text);
        await api.post('/search/import', { data });
        toast.success('Data imported successfully');
      } catch {
        toast.error('Failed to import data');
      }
    };
    input.click();
  };

  const handleSaveProfile = async () => {
    try {
      await updateProfile({ name, email });
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Settings</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Manage your preferences</p>
      </div>

      <Section title="Appearance">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Theme</p>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            Choose your preferred color theme
          </p>
          <div className="mt-3 grid w-full min-w-0 grid-cols-1 gap-2 sm:grid-cols-3">
            {THEMES.map((t) => (
              <button
                key={t.id}
                onClick={() => setTheme(t.id)}
                className={clsx(
                  'flex w-full items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium',
                  'transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500',
                  'focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900',
                  theme === t.id
                    ? 'border-blue-200 bg-blue-50 text-blue-700 ring-1 ring-blue-300 shadow-sm dark:border-blue-500/40 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-500/40'
                    : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800/60 dark:text-gray-400 dark:hover:border-gray-600 dark:hover:bg-gray-700/60'
                )}
              >
                <t.icon className="w-4 h-4 shrink-0" />
                <span className="flex-1 text-left">{t.label}</span>
                {theme === t.id && <Check className="w-4 h-4 shrink-0" />}
              </button>
            ))}
          </div>
        </div>

        <SettingRow label="Accent Color" description="Customize your accent color">
          <div className="flex flex-wrap gap-2">
            {ACCENT_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => updateAccentColor(color)}
                className={clsx(
                  'w-7 h-7 rounded-full transition-transform hover:scale-110',
                  accentColor === color && 'ring-2 ring-offset-2 ring-gray-400 dark:ring-offset-gray-800'
                )}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </SettingRow>
      </Section>

      <Section title="Preferences">
        <SettingRow label="Default View" description="Which view opens on startup">
          <div className="relative">
            <select
              value={defaultView}
              onChange={(e) => updateDefaultView(e.target.value)}
              className="appearance-none input pr-8 text-sm"
            >
              <option value="inbox">Inbox</option>
              <option value="today">Today</option>
              <option value="my-day">My Day</option>
              <option value="upcoming">Upcoming</option>
              <option value="kanban">Kanban Board</option>
            </select>
            <ChevronRight className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none rotate-90" />
          </div>
        </SettingRow>

        <SettingRow label="Week Starts On" description="First day of the week">
          <div className="flex gap-2">
            {WEEK_STARTS.map((w) => (
              <button
                key={w.id}
                onClick={() => updateWeekStart(w.id)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  weekStart === w.id
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'
                )}
              >
                {w.label}
              </button>
            ))}
          </div>
        </SettingRow>

        <SettingRow label="Timezone" description="Used for due dates and scheduling">
          <select
            value={timezone}
            onChange={(e) => setTimezone(e.target.value)}
            className="input text-sm max-w-[200px]"
          >
            {Intl.supportedValuesOf('timeZone').map((tz) => (
              <option key={tz} value={tz}>{tz}</option>
            ))}
          </select>
        </SettingRow>
      </Section>

      <Section title="Notifications">
        <SettingRow label="Email Notifications" description="Receive email updates">
          <button
            onClick={() => updateNotifications('email', !notifications.email)}
            className={clsx(
              'relative w-10 h-6 rounded-full transition-colors',
              notifications.email ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
            )}
          >
            <span className={clsx('absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow', notifications.email && 'translate-x-4')} />
          </button>
        </SettingRow>

        <SettingRow label="Push Notifications" description="Browser push notifications">
          <button
            onClick={() => updateNotifications('push', !notifications.push)}
            className={clsx(
              'relative w-10 h-6 rounded-full transition-colors',
              notifications.push ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
            )}
          >
            <span className={clsx('absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow', notifications.push && 'translate-x-4')} />
          </button>
        </SettingRow>

        <SettingRow label="Daily Digest" description="Summary of upcoming tasks">
          <button
            onClick={() => updateNotifications('daily', !notifications.daily)}
            className={clsx(
              'relative w-10 h-6 rounded-full transition-colors',
              notifications.daily ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
            )}
          >
            <span className={clsx('absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow', notifications.daily && 'translate-x-4')} />
          </button>
        </SettingRow>

        <SettingRow label="Weekly Report" description="Weekly productivity summary">
          <button
            onClick={() => updateNotifications('weekly', !notifications.weekly)}
            className={clsx(
              'relative w-10 h-6 rounded-full transition-colors',
              notifications.weekly ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'
            )}
          >
            <span className={clsx('absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform shadow', notifications.weekly && 'translate-x-4')} />
          </button>
        </SettingRow>
      </Section>

      <Section title="Account">
        <SettingRow label="Name">
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="input text-sm max-w-[250px]" />
        </SettingRow>
        <SettingRow label="Email">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="input text-sm max-w-[250px]" />
        </SettingRow>
        <div className="pt-2">
          <button onClick={handleSaveProfile} className="btn-primary btn-sm">Save Changes</button>
        </div>
      </Section>

      <Section title="Data">
        <SettingRow label="Export Data" description="Download all your data as JSON">
          <button onClick={handleExportData} className="btn-secondary btn-sm">
            <Download className="w-4 h-4" /> Export
          </button>
        </SettingRow>
        <SettingRow label="Import Data" description="Restore from a JSON backup">
          <button onClick={handleImportData} className="btn-secondary btn-sm">
            <Upload className="w-4 h-4" /> Import
          </button>
        </SettingRow>
      </Section>
    </div>
  );
}
