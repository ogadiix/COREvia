import React, { useState, useEffect } from 'react';
import { bankingApi } from '../../lib/api.ts';
import { Badge } from '../common/Badge.tsx';
import { Button } from '../common/Button.tsx';
import { Modal } from '../common/Modal.tsx';
import { Table, Column } from '../common/Table.tsx';
import { StatCard } from '../common/StatCard.tsx';
import {
  CheckSquare,
  Search,
  Plus,
  RefreshCw,
  Calendar,
  Clock,
  User,
  CheckCircle2,
  AlertCircle,
  PhoneCall,
} from 'lucide-react';

interface TaskItem {
  id: number;
  customerId: number;
  customerName?: string;
  customerCode?: string;
  title: string;
  description?: string;
  dueDate: string;
  priority: string;
  status: string;
  assignedToName?: string;
  relatedType?: string;
  createdAt: string;
}

export const TasksModule: React.FC = () => {
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [isFollowupModalOpen, setIsFollowupModalOpen] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Form states
  const [customerId, setCustomerId] = useState<number>(1);
  const [title, setTitle] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>('2026-09-15');
  const [priority, setPriority] = useState<string>('MEDIUM');
  const [description, setDescription] = useState<string>('');

  const loadTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await bankingApi.getTasks({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
      });
      setTasks(data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, [statusFilter]);

  const handleToggleStatus = async (task: TaskItem) => {
    const nextStatus = task.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      await bankingApi.updateTask(task.id, { status: nextStatus });
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t))
      );
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await bankingApi.createTask({
        customerId,
        title: title.trim(),
        description: description.trim() || undefined,
        dueDate,
        priority,
      });
      setIsTaskModalOpen(false);
      setTitle('');
      setDescription('');
      loadTasks();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateFollowup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    setSaving(true);
    try {
      await bankingApi.createFollowup({
        customerId,
        title: title.trim(),
        dueDate,
        notes: description.trim() || undefined,
      });
      setIsFollowupModalOpen(false);
      setTitle('');
      setDescription('');
      loadTasks();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const filteredTasks = tasks.filter((t) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      t.title.toLowerCase().includes(term) ||
      (t.customerName && t.customerName.toLowerCase().includes(term)) ||
      (t.description && t.description.toLowerCase().includes(term))
    );
  });

  const columns: Column<TaskItem>[] = [
    {
      key: 'status',
      header: 'Done',
      render: (t) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            handleToggleStatus(t);
          }}
          className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
            t.status === 'COMPLETED'
              ? 'bg-emerald-600 border-emerald-700 text-white'
              : 'border-slate-300 hover:border-slate-500 bg-white'
          }`}
        >
          {t.status === 'COMPLETED' && <CheckCircle2 className="w-3.5 h-3.5" />}
        </button>
      ),
    },
    {
      key: 'title',
      header: 'Task & Details',
      render: (t) => (
        <div className="max-w-[320px]">
          <div
            className={`font-semibold text-xs ${
              t.status === 'COMPLETED' ? 'line-through text-slate-400' : 'text-slate-900'
            }`}
          >
            {t.title}
          </div>
          {t.description && (
            <div className="text-[11px] text-slate-500 truncate">{t.description}</div>
          )}
        </div>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer',
      render: (t) => (
        <div>
          <span className="font-medium text-slate-900">{t.customerName || 'Client'}</span>
          <div className="font-mono text-[11px] text-slate-500">{t.customerCode || 'CUS-NA'}</div>
        </div>
      ),
    },
    {
      key: 'dueDate',
      header: 'Due Date',
      mono: true,
      render: (t) => {
        const isPast = new Date(t.dueDate) < new Date() && t.status !== 'COMPLETED';
        return (
          <span
            className={`font-mono text-xs ${
              isPast ? 'text-rose-700 font-semibold' : 'text-slate-700'
            }`}
          >
            {t.dueDate}
          </span>
        );
      },
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (t) => (
        <Badge
          variant={
            t.priority === 'HIGH'
              ? 'danger'
              : t.priority === 'MEDIUM'
              ? 'warning'
              : 'neutral'
          }
          size="sm"
        >
          {t.priority}
        </Badge>
      ),
    },
    {
      key: 'assignedToName',
      header: 'Assignee',
      render: (t) => (
        <span className="text-xs text-slate-700">{t.assignedToName || 'Branch Team'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-slate-700" />
            <span>Relationship Tasks & Client Follow-ups</span>
          </h1>
          <p className="text-xs text-slate-500">
            PostgreSQL-backed actionable task tracking, relationship reviews, and dual-control follow-ups.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadTasks} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={() => setIsFollowupModalOpen(true)}>
            <PhoneCall className="w-3.5 h-3.5 mr-1" />
            + Follow-up
          </Button>
          <Button variant="primary" size="sm" onClick={() => setIsTaskModalOpen(true)}>
            <Plus className="w-3.5 h-3.5 mr-1" />
            + Task
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Tasks"
          value={tasks.length.toString()}
          badge="Live DB"
          badgeVariant="neutral"
        />
        <StatCard
          label="Pending / In Progress"
          value={tasks.filter((t) => t.status !== 'COMPLETED').length.toString()}
          badge="Active Action"
          badgeVariant="warning"
        />
        <StatCard
          label="High Priority"
          value={tasks.filter((t) => t.priority === 'HIGH' && t.status !== 'COMPLETED').length.toString()}
          badge="Urgent"
          badgeVariant="danger"
        />
        <StatCard
          label="Completed"
          value={tasks.filter((t) => t.status === 'COMPLETED').length.toString()}
          badge="Executed"
          badgeVariant="success"
        />
      </div>

      {/* Filters */}
      <div className="bg-white border border-slate-200 rounded p-3 space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search tasks by title, customer, description..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div className="sm:col-span-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      {error ? (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded text-xs">
          Error: {error}
        </div>
      ) : (
        <Table
          columns={columns}
          data={filteredTasks}
          keyExtractor={(t) => String(t.id)}
          onRowClick={(t) => handleToggleStatus(t)}
        />
      )}

      {/* Create Task Modal */}
      {isTaskModalOpen && (
        <Modal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          title="Create Operational Task"
          subtitle="Record relationship assignment in PostgreSQL"
          maxWidth="lg"
          footerActions={
            <div className="flex gap-2 justify-end w-full">
              <Button variant="outline" size="sm" onClick={() => setIsTaskModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreateTask} disabled={saving || !title.trim()}>
                {saving ? 'Saving...' : 'Create Task'}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Customer Account</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white"
              >
                <option value={1}>Rahul Sharma (CUS-10482)</option>
                <option value={2}>Kalyan Steels & Forgings Ltd (CUS-20841)</option>
                <option value={3}>Meera Sundaram (CUS-30915)</option>
                <option value={4}>Sunil Varma (CUS-40182)</option>
                <option value={5}>Ananya Deshmukh (CUS-50824)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Task Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Schedule Q3 portfolio review meeting"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-600 font-medium mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Action Notes</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Instructions or specific background details..."
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white"
              />
            </div>
          </form>
        </Modal>
      )}

      {/* Quick Follow-up Modal */}
      {isFollowupModalOpen && (
        <Modal
          isOpen={isFollowupModalOpen}
          onClose={() => setIsFollowupModalOpen(false)}
          title="Schedule Client Follow-up Call / Visit"
          subtitle="Creates high-priority follow-up entry in PostgreSQL"
          maxWidth="lg"
          footerActions={
            <div className="flex gap-2 justify-end w-full">
              <Button variant="outline" size="sm" onClick={() => setIsFollowupModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleCreateFollowup} disabled={saving || !title.trim()}>
                {saving ? 'Scheduling...' : 'Confirm Follow-up'}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleCreateFollowup} className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-600 font-medium mb-1">Customer</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white"
              >
                <option value={1}>Rahul Sharma (CUS-10482)</option>
                <option value={2}>Kalyan Steels & Forgings Ltd (CUS-20841)</option>
                <option value={3}>Meera Sundaram (CUS-30915)</option>
                <option value={4}>Sunil Varma (CUS-40182)</option>
                <option value={5}>Ananya Deshmukh (CUS-50824)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Follow-up Objective</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Call regarding term deposit renewal & rate card"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Follow-up Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white font-mono"
              />
            </div>

            <div>
              <label className="block text-slate-600 font-medium mb-1">Conversation Brief</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Key talking points or agenda..."
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded focus:bg-white"
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
