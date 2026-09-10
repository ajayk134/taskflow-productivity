import { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  CheckCircle2,
  Clock,
  TrendingUp,
  Target,
  Calendar,
  ListTodo,
} from 'lucide-react';
import clsx from 'clsx';
import { format, subDays, startOfDay, isToday, isThisWeek, isThisMonth, parseISO } from 'date-fns';
import {
  LineChart,
  Line,
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
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTodos().finally(() => setLoading(false));
  }, [fetchTodos]);

  const stats = useMemo(() => {
    const now = new Date();
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
    const counts = { urgent: 0, high: 0, medium: 0, low: 0 };
    todos.forEach((t) => {
      if (t.priority) counts[t.priority] = (counts[t.priority] || 0) + 1;
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

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg px-3 py-2">
        <p className="text-xs font-medium text-gray-500">{label}</p>
        {payload.map((entry, i) => (
          <p key={i} className="text-sm font-semibold" style={{ color: entry.color }}>{entry.value} tasks</p>
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
        <StatCard icon={CheckCircle2} label="Completed Today" value={stats.completedToday} color="bg-green-500" change={12} />
        <StatCard icon={Calendar} label="This Week" value={stats.completedThisWeek} color="bg-blue-500" change={8} />
        <StatCard icon={TrendingUp} label="This Month" value={stats.completedThisMonth} color="bg-violet-500" change={-3} />
        <StatCard icon={Target} label="Completion Rate" value={`${stats.completionRate}%`} color="bg-amber-500" change={5} />
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
    </div>
  );
}
