import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Target,
  CheckCircle2,
  Pause,
  Circle,
  Calendar,
  ChevronRight,
  Trash2,
  Edit3,
  Milestone,
} from 'lucide-react';
import clsx from 'clsx';
import { format, parseISO, isPast } from 'date-fns';
import toast from 'react-hot-toast';
import { api } from '../utils/api';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';

const STATUS_CONFIG = {
  active: { color: 'bg-blue-500', label: 'Active', icon: Circle },
  completed: { color: 'bg-green-500', label: 'Completed', icon: CheckCircle2 },
  paused: { color: 'bg-yellow-500', label: 'Paused', icon: Pause },
};

export default function Goals() {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showDetail, setShowDetail] = useState(null);
  const [filter, setFilter] = useState('all');
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newTargetDate, setNewTargetDate] = useState('');
  const [newStatus, setNewStatus] = useState('active');
  const [newMilestoneName, setNewMilestoneName] = useState('');

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get('/goals');
      setGoals(data.goals || []);
    } catch {
      setGoals([]);
    }
    setLoading(false);
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  const filteredGoals = goals.filter((g) => filter === 'all' || g.status === filter);

  const handleCreate = async () => {
    if (!newName.trim()) return;
    try {
      await api.post('/goals', {
        name: newName,
        description: newDescription,
        targetDate: newTargetDate || undefined,
        status: newStatus,
      });
      toast.success('Goal created');
      setShowCreate(false);
      resetForm();
      fetchGoals();
    } catch {
      toast.error('Failed to create goal');
    }
  };

  const resetForm = () => {
    setNewName('');
    setNewDescription('');
    setNewTargetDate('');
    setNewStatus('active');
  };

  const toggleMilestone = async (goalId, milestoneId, completed) => {
    try {
      await api.put(`/goals/${goalId}/milestones/${milestoneId}`, { completed: !completed });
      fetchGoals();
    } catch {
      toast.error('Failed to update milestone');
    }
  };

  const addMilestone = async (goalId) => {
    if (!newMilestoneName.trim()) return;
    try {
      await api.post(`/goals/${goalId}/milestones`, { name: newMilestoneName });
      setNewMilestoneName('');
      fetchGoals();
    } catch {
      toast.error('Failed to add milestone');
    }
  };

  const deleteGoal = async (id) => {
    try {
      await api.delete(`/goals/${id}`);
      toast.success('Goal deleted');
      setShowDetail(null);
      fetchGoals();
    } catch {
      toast.error('Failed to delete goal');
    }
  };

  const updateGoalStatus = async (id, status) => {
    try {
      await api.put(`/goals/${id}`, { status });
      fetchGoals();
      if (showDetail?._id === id) setShowDetail((prev) => ({ ...prev, status }));
    } catch {
      toast.error('Failed to update goal');
    }
  };

  const getProgress = (goal) => {
    const milestones = goal.milestones || [];
    if (milestones.length === 0) return goal.status === 'completed' ? 100 : 0;
    const done = milestones.filter((m) => m.completed).length;
    return Math.round((done / milestones.length) * 100);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Goals</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{goals.filter((g) => g.status === 'active').length} active goals</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary btn-sm">
          <Plus className="w-4 h-4" /> New Goal
        </button>
      </div>

      <div className="flex gap-2">
        {['all', 'active', 'completed', 'paused'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={clsx(
              'px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors',
              filter === f ? 'bg-blue-500 text-white' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {filteredGoals.length === 0 && !loading && (
        <EmptyState
          icon={Target}
          title="No goals yet"
          description="Set goals to track your progress and stay motivated."
          onAction={() => setShowCreate(true)}
          actionLabel="Create Goal"
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {filteredGoals.map((goal) => {
          const progress = getProgress(goal);
          const cfg = STATUS_CONFIG[goal.status] || STATUS_CONFIG.active;
          const StatusIcon = cfg.icon;
          const isOverdue = goal.targetDate && isPast(parseISO(goal.targetDate)) && goal.status === 'active';

          return (
            <button
              key={goal._id}
              onClick={() => setShowDetail(goal)}
              className="card p-5 text-left hover:shadow-md transition-shadow group"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className={clsx('w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0', cfg.color)}>
                  <Target className="w-4.5 h-4.5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">{goal.name}</h3>
                  {goal.description && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{goal.description}</p>
                  )}
                </div>
                <span className={clsx('flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold capitalize', cfg.color + '/10', goal.status === 'active' ? 'text-blue-600 dark:text-blue-400' : goal.status === 'completed' ? 'text-green-600 dark:text-green-400' : 'text-yellow-600 dark:text-yellow-400')}>
                  <StatusIcon className="w-2.5 h-2.5" />
                  {cfg.label}
                </span>
              </div>

              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Progress</span>
                  <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{progress}%</span>
                </div>
                <div className="w-full h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>{(goal.milestones || []).length} milestones</span>
                {goal.targetDate && (
                  <span className={clsx('flex items-center gap-1', isOverdue && 'text-red-500 font-semibold')}>
                    <Calendar className="w-3 h-3" />
                    {format(parseISO(goal.targetDate), 'MMM d, yyyy')}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <Modal isOpen={showCreate} onClose={() => setShowCreate(false)} title="Create Goal" size="md">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name</label>
            <input type="text" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="e.g. Launch new website" className="input" autoFocus />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea value={newDescription} onChange={(e) => setNewDescription(e.target.value)} placeholder="Optional description" className="input min-h-[80px] resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Target Date</label>
              <input type="date" value={newTargetDate} onChange={(e) => setNewTargetDate(e.target.value)} className="input" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <div className="flex gap-2">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => setNewStatus(key)}
                    className={clsx('flex-1 px-2 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors', newStatus === key ? cfg.color + ' text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400')}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={() => setShowCreate(false)} className="btn-secondary btn-sm">Cancel</button>
          <button onClick={handleCreate} className="btn-primary btn-sm">Create Goal</button>
        </div>
      </Modal>

      {showDetail && (
        <Modal isOpen={!!showDetail} onClose={() => setShowDetail(null)} title={showDetail.name} size="lg">
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="flex gap-2">
                {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                  <button
                    key={key}
                    onClick={() => updateGoalStatus(showDetail._id, key)}
                    className={clsx('px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors', showDetail.status === key ? cfg.color + ' text-white' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400')}
                  >
                    {cfg.label}
                  </button>
                ))}
              </div>
              <button onClick={() => deleteGoal(showDetail._id)} className="ml-auto p-2 text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {showDetail.description && (
              <p className="text-sm text-gray-600 dark:text-gray-400">{showDetail.description}</p>
            )}

            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Progress</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{getProgress(showDetail)}%</span>
              </div>
              <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 transition-all duration-500" style={{ width: `${getProgress(showDetail)}%` }} />
              </div>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Milestone className="w-4 h-4" /> Milestones
              </h4>
              <div className="space-y-2">
                {(showDetail.milestones || []).map((m) => (
                  <div key={m._id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <button onClick={() => toggleMilestone(showDetail._id, m._id, m.completed)} className="flex-shrink-0">
                      {m.completed ? <CheckCircle2 className="w-4.5 h-4.5 text-green-500" /> : <Circle className="w-4.5 h-4.5 text-gray-300 dark:text-gray-600" />}
                    </button>
                    <span className={clsx('text-sm', m.completed ? 'text-gray-400 line-through' : 'text-gray-700 dark:text-gray-300')}>{m.name}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-3">
                <input
                  type="text"
                  value={newMilestoneName}
                  onChange={(e) => setNewMilestoneName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addMilestone(showDetail._id)}
                  placeholder="Add milestone..."
                  className="flex-1 px-3 py-1.5 text-sm bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button onClick={() => addMilestone(showDetail._id)} className="btn-primary btn-sm text-xs">Add</button>
              </div>
            </div>

            {showDetail.targetDate && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Calendar className="w-4 h-4" />
                Target: {format(parseISO(showDetail.targetDate), 'MMMM d, yyyy')}
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
