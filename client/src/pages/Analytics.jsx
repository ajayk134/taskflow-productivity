import { useState, useEffect, useMemo } from 'react';
import {
  CheckCircle2,
  Clock,
  TrendingUp,
  Target,
  Calendar,
  ListTodo,
  Repeat,
  Flag,
} from 'lucide-react';
import clsx from 'clsx';
import { format, subDays, startOfDay, isToday, isThisWeek, isThisMonth, parseISO, isPast } from 'date-fns';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { useTodoStore } from '../stores/todoStore';
import { api } from '../utils/api';

const PIE_COLORS = ['#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#10b981'];
const BAR_COLORS = ['#94a3b8', '#f59e0b', '#3b82f6', '#8b5cf6', '#10b981'];

function StatCard({ icon: Icon, label, value, change, color }) {
  return (
    <div className="card p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">{value}</p>
          {change !== undefined && (
            <p className={clsx('text-xs font-medium mt-1', change >= 0 ? 'text-green-500' : 'text-red-500')}>
              {change >= 0 ? '+' : ''}{change}% vs last period
            </p>
          )}
        </div>
        <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center', color)}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

export default function Analytics() {
  const { todos, fetchTodos } = useTodoStore();
  const [, setLoading] = useState(true);
  const [habits, setHabits] = useState([]);
  const [goals, setGoals] = useState([]);
  const [habitsLoading, setHabitsLoading] = useState(true);
  const [goalsLoading, setGoalsLoading] = useState(true);

  useEffect(() => {
    fetchTodos().finally(() => setLoading(false));
    api
      .get('/habits')
      .then((d) => setHabits(d.habits || []))
      .catch(() => setHabits([]))
      .finally(() => setHabitsLoading(false));
    api
      .get('/goals')
      .then((d) => setGoals(d.goals || []))
      .catch(() => setGoals([]))
      .finally(() => setGoalsLoading(false));
  }, [fetchTodos]);

  const stats = useMemo(() => {
    const completedToday = todos.filter((t) => t.completed && t.completedAt && isToday(parseISO(t.completedAt))).length;
    const completedThisWeek = todos.filter((t) => t.completed && t.completedAt && isThisWeek(parseISO(t.completedAt))).length;
    const completedThisMonth = todos.filter((t) => t.completed && t.completedAt && isThisMonth(parseISO(t.completedAt))).length;
    const totalCompleted = todos.filter((t) => t.completed).length;
    const totalActive = todos.filter((t) => !t.completed).length;
    const completionRate = todos.length > 0 ? Math.round((totalCompleted / todos.length) * 100) : 0;

    return { completedToday, completedThisWeek, completedThisMonth, totalCompleted, totalActive, completionRate };
  }, [todos]);

  const lineData = useMemo(() => {
    const days = Array.from({ length: 14 }, (_, i) => subDays(new Date(), 13 - i));
    return days.map((day) => ({
      date: format(day, 'MMM d'),
      completed: todos.filter((t) => t.completed && t.completedAt && startOfDay(parseISO(t.completedAt)).getTime() === startOfDay(day).getTime()).length,
    }));
  }, [todos]);

  const priorityData = useMemo(() => {
    const labels = { 1: 'urgent', 2: 'high', 3: 'medium', 4: 'low' };
    const counts = { urgent: 0, high: 0, medium: 0, low: 0 };
    todos.forEach((t) => {
      if (t.priority && labels[t.priority]) counts[labels[t.priority]]++;
    });
    return Object.entries(counts)
      .filter(([, v]) => v > 0)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value }));
  }, [todos]);

  const statusData = useMemo(() => {
    const counts = { Inbox: 0, Next: 0, 'In Progress': 0, Review: 0, Completed: 0 };
    todos.forEach((t) => {
      if (t.completed) counts['Completed']++;
      else if (t.status === 'in-progress') counts['In Progress']++;
      else if (t.status === 'review') counts['Review']++;
      else if (t.status === 'next') counts['Next']++;
      else counts['Inbox']++;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [todos]);

  const utcKey = (d) => (d instanceof Date ? d : new Date(d)).toISOString().split('T')[0];
  const lastNDays = (n) => Array.from({ length: n }, (_, i) => subDays(new Date(), n - 1 - i));

  const habitStats = useMemo(() => {
    const todayKey = utcKey(new Date());
    const byDay = new Map();
    habits.forEach((h) => {
      for (const l of h.logs || []) {
        if (!l.completed || !l.date) continue;
        const k = utcKey(l.date);
        if (!byDay.has(k)) byDay.set(k, new Set());
        byDay.get(k).add(h._id);
      }
    });
    const dayCount = (key) => byDay.get(key)?.size ?? 0;
    const days30 = lastNDays(30);
    const withRate = habits.map((h) => {
      const done = new Set((h.logs || []).filter((l) => l.completed && l.date).map((l) => utcKey(l.date)));
      const count = days30.filter((d) => done.has(utcKey(d))).length;
      return { name: h.name, rate: Math.round((count / 30) * 100), currentStreak: h.currentStreak || 0 };
    });
    const avgRate = habits.length ? Math.round(withRate.reduce((s, h) => s + h.rate, 0) / habits.length) : 0;
    const bestStreak = habits.reduce((m, h) => Math.max(m, h.currentStreak || 0), 0);
    const completedToday = dayCount(todayKey);
    return { completedToday, totalHabits: habits.length, avgRate, bestStreak, withRate, dayCount };
  }, [habits]);

  const habitLineData = useMemo(
    () =>
      lastNDays(14).map((d) => ({
        date: format(d, 'MMM d'),
        completed: habitStats.dayCount(utcKey(d)),
      })),
    [habitStats]
  );

  const goalStats = useMemo(() => {
    const byStatus = { active: 0, completed: 0, paused: 0 };
    goals.forEach((g) => {
      if (byStatus[g.status] !== undefined) byStatus[g.status]++;
    });
    const rows = goals.map((g) => {
      const ms = g.milestones || [];
      const progress = ms.length
        ? Math.round((ms.filter((m) => m.completed).length / ms.length) * 100)
        : g.status === 'completed'
          ? 100
          : 0;
      return { name: g.title, progress, status: g.status, targetDate: g.targetDate };
    });
    const activeGoals = goals.filter((g) => g.status === 'active');
    const avgProgress = goals.length ? Math.round(rows.reduce((s, r) => s + r.progress, 0) / goals.length) : 0;
    const overdue = activeGoals.filter((g) => g.targetDate && isPast(parseISO(g.targetDate))).length;
    return { byStatus, rows, avgProgress, activeCount: activeGoals.length, overdue };
  }, [goals]);

  const CustomTooltip = ({ active, payload, label, suffix = 'tasks' }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-3 py-2">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>{entry.value} {suffix}</p>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Track your productivity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={CheckCircle2} label="Completed Today" value={stats.completedToday} color="bg-green-500" />
        <StatCard icon={Calendar} label="This Week" value={stats.completedThisWeek} color="bg-blue-500" />
        <StatCard icon={TrendingUp} label="This Month" value={stats.completedThisMonth} color="bg-violet-500" />
        <StatCard icon={Target} label="Completion Rate" value={`${stats.completionRate}%`} color="bg-amber-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Tasks Completed (Last 14 Days)</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={lineData}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="completed" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">By Priority</h3>
          <div className="h-[250px] flex items-center justify-center">
            {priorityData.length === 0 ? (
              <p className="text-sm text-gray-400">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={priorityData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {priorityData.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Tasks by Status</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                  {statusData.map((_, i) => (
                    <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Quick Stats</h3>
          <div className="space-y-4">
            {[
              { label: 'Total Tasks', value: todos.length, icon: ListTodo, color: 'text-blue-500' },
              { label: 'Active Tasks', value: stats.totalActive, icon: Clock, color: 'text-amber-500' },
              { label: 'Completed Tasks', value: stats.totalCompleted, icon: CheckCircle2, color: 'text-green-500' },
              { label: 'Completion Rate', value: `${stats.completionRate}%`, icon: TrendingUp, color: 'text-violet-500' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="flex items-center justify-between px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800/50">
                <div className="flex items-center gap-3">
                  <Icon className={clsx('w-5 h-5', color)} />
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Repeat} label="Habits Completed Today" value={`${habitStats.completedToday}/${habitStats.totalHabits}`} color="bg-orange-500" />
        <StatCard icon={TrendingUp} label="Avg Habit Rate (30d)" value={`${habitStats.avgRate}%`} color="bg-blue-500" />
        <StatCard icon={Calendar} label="Best Current Streak" value={`${habitStats.bestStreak}d`} color="bg-violet-500" />
        <StatCard icon={Flag} label="Active Goals" value={goalStats.activeCount} color="bg-green-500" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Habits Completed (Last 14 Days)</h3>
          <div className="h-[250px]">
            {habitLineData.every((d) => d.completed === 0) ? (
              <p className="text-sm text-gray-400 flex h-full items-center justify-center">No habit activity in the last 14 days</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={habitLineData}>
                  <defs>
                    <linearGradient id="colorHabitCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                  <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} allowDecimals={false} />
                  <Tooltip content={<CustomTooltip suffix="habits" />} />
                  <Area type="monotone" dataKey="completed" stroke="#f59e0b" strokeWidth={2} fillOpacity={1} fill="url(#colorHabitCompleted)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Habit Completion Rate (30d)</h3>
          {habitsLoading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : habitStats.withRate.length === 0 ? (
            <p className="text-sm text-gray-400">No habits tracked yet</p>
          ) : (
            <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
              {habitStats.withRate
                .slice()
                .sort((a, b) => b.rate - a.rate)
                .map((h) => (
                  <div key={h.name}>
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700 dark:text-gray-300 truncate pr-2">{h.name}</span>
                      <span className="text-gray-500 dark:text-gray-400">{h.rate}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                      <div className="h-full rounded-full bg-orange-500 transition-all" style={{ width: `${h.rate}%` }} />
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Goal Progress</h3>
          {goalsLoading ? (
            <p className="text-sm text-gray-400">Loading...</p>
          ) : goalStats.rows.length === 0 ? (
            <p className="text-sm text-gray-400">No goals yet — create one to track progress</p>
          ) : (
            <div className="space-y-4">
              {goalStats.rows.map((g) => {
                const statusColor = g.status === 'completed' ? 'bg-green-500' : g.status === 'paused' ? 'bg-yellow-500' : 'bg-blue-500';
                return (
                  <div key={g.name}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="font-medium text-gray-700 dark:text-gray-300 truncate pr-2">{g.name}</span>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        {g.targetDate && (
                          <span className="text-[10px] text-gray-400">{format(parseISO(g.targetDate), 'MMM d, yyyy')}</span>
                        )}
                        <span className={clsx('text-[10px] font-medium px-1.5 py-0.5 rounded-full text-white', statusColor)}>
                          {g.status}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-gray-100">{g.progress}%</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
                      <div className={clsx('h-full rounded-full transition-all', statusColor)} style={{ width: `${g.progress}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">Goals by Status</h3>
          <div className="h-[250px] flex items-center justify-center">
            {!goalsLoading && goalStats.rows.length === 0 ? (
              <p className="text-sm text-gray-400">No data</p>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Active', value: goalStats.byStatus.active },
                      { name: 'Completed', value: goalStats.byStatus.completed },
                      { name: 'Paused', value: goalStats.byStatus.paused },
                    ].filter((x) => x.value > 0)}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    <Cell fill="#3b82f6" />
                    <Cell fill="#10b981" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <div className="grid grid-cols-3 gap-2 text-center mt-3">
            {[
              { label: 'Active', value: goalStats.byStatus.active, color: 'text-blue-500' },
              { label: 'Completed', value: goalStats.byStatus.completed, color: 'text-green-500' },
              { label: 'Paused', value: goalStats.byStatus.paused, color: 'text-yellow-500' },
            ].map((s) => (
              <div key={s.label} className="rounded-lg bg-gray-50 dark:bg-gray-800/50 py-2">
                <p className={clsx('text-lg font-bold', s.color)}>{s.value}</p>
                <p className="text-[10px] text-gray-500 dark:text-gray-400">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-3 text-center">
            {goalStats.overdue > 0 ? `${goalStats.overdue} active goal${goalStats.overdue > 1 ? 's' : ''} past target date` : 'No overdue goals'}
          </p>
        </div>
      </div>
    </div>
  );
}
