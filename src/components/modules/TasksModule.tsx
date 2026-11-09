import React, { useState, useEffect, useMemo } from 'react';
import { bankingApi } from '../../lib/api';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';
import { Table, Column } from '../common/Table';
import { StatCard } from '../common/StatCard';
import { useToast } from '../common/Toast';
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
  X,
  SlidersHorizontal,
  Flame,
  ArrowRight,
  Building2,
  CalendarDays,
  FileText,
  ExternalLink,
  ChevronRight,
  ShieldCheck,
  Check,
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

interface TasksModuleProps {
  onNavigateToCustomer?: (customerId: number) => void;
}

export const TasksModule: React.FC<TasksModuleProps> = ({ onNavigateToCustomer }) => {
  const toast = useToast();
  const [tasks, setTasks] = useState<TaskItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Queue & Navigation Filters
  const [activeQueue, setActiveQueue] = useState<'ALL' | 'PENDING' | 'OVERDUE' | 'HIGH_PRIORITY' | 'COMPLETED'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [isCompact, setIsCompact] = useState<boolean>(false);

  // Selected Task Inspection
  const [selectedTask, setSelectedTask] = useState<TaskItem | null>(null);

  // Creation Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState<boolean>(false);
  const [isFollowupModalOpen, setIsFollowupModalOpen] = useState<boolean>(false);
  const [saving, setSaving] = useState<boolean>(false);

  // Form states
  const [customerId, setCustomerId] = useState<number>(1);
  const [title, setTitle] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
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
      setError(err.message || 'Failed to load officer tasks');
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
      if (selectedTask && selectedTask.id === task.id) {
        setSelectedTask({ ...selectedTask, status: nextStatus });
      }
      toast.success(`Task "${task.title}" updated to ${nextStatus}.`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update task status.');
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
      toast.success('Actionable task scheduled successfully.');
      loadTasks();
    } catch (err: any) {
      toast.error(err.message || 'Failed to schedule task.');
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
      toast.success('Client follow-up scheduled in CRM agenda.');
      loadTasks();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record follow-up.');
    } finally {
      setSaving(false);
    }
  };

  // Due Date status utility
  const getDueDateStatus = (dueDateStr: string, isCompleted: boolean) => {
    if (isCompleted) {
      return { status: 'COMPLETED', label: 'Done', badgeClass: 'text-emerald-600 dark:text-emerald-400 font-normal' };
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDateStr);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.round((due.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) {
      return {
        status: 'OVERDUE',
        label: `${Math.abs(diffDays)}d overdue`,
        badgeClass: 'text-red-600 dark:text-red-400 font-semibold bg-red-500/10 px-1.5 py-0.5 rounded border border-red-500/30',
      };
    }
    if (diffDays === 0) {
      return {
        status: 'TODAY',
        label: 'Due Today',
        badgeClass: 'text-amber-600 dark:text-amber-400 font-semibold bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30',
      };
    }
    return {
      status: 'UPCOMING',
      label: `In ${diffDays}d`,
      badgeClass: 'text-[#5D6B7B] dark:text-[#A9BACB] font-mono',
    };
  };

  // Filter tasks based on queue, priority, search
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const isCompleted = t.status === 'COMPLETED';
      const dueStatus = getDueDateStatus(t.dueDate, isCompleted);

      // Queue Filtering
      if (activeQueue === 'PENDING' && isCompleted) return false;
      if (activeQueue === 'OVERDUE' && (isCompleted || dueStatus.status !== 'OVERDUE')) return false;
      if (activeQueue === 'HIGH_PRIORITY' && t.priority !== 'HIGH' && t.priority !== 'CRITICAL') return false;
      if (activeQueue === 'COMPLETED' && !isCompleted) return false;

      // Priority Filter
      if (priorityFilter !== 'ALL' && t.priority !== priorityFilter) return false;

      // Text Search
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      return (
        t.title.toLowerCase().includes(term) ||
        (t.customerName && t.customerName.toLowerCase().includes(term)) ||
        (t.customerCode && t.customerCode.toLowerCase().includes(term)) ||
        (t.description && t.description.toLowerCase().includes(term))
      );
    });
  }, [tasks, activeQueue, priorityFilter, search]);

  const columns: Column<TaskItem>[] = [
    {
      key: 'status',
      header: 'Done',
      render: (t) => {
        const isDone = t.status === 'COMPLETED';
        return (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              handleToggleStatus(t);
            }}
            title={isDone ? 'Mark as Pending' : 'Mark as Completed'}
            className={`w-5 h-5 rounded flex items-center justify-center transition-colors border ${
              isDone
                ? 'bg-[#168C83] border-[#168C83] text-white shadow-2xs'
                : 'border-[#DCE3EA] dark:border-[#33485D] hover:border-[#168C83] bg-[#FFFFFF] dark:bg-[#101C2A]'
            }`}
          >
            {isDone && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
          </button>
        );
      },
    },
    {
      key: 'title',
      header: 'Actionable Task & Objective',
      render: (t) => {
        const isDone = t.status === 'COMPLETED';
        return (
          <div className="max-w-[340px] space-y-0.5">
            <div
              className={`text-xs font-medium transition-colors ${
                isDone
                  ? 'line-through text-[#8793A1] dark:text-[#5D6B7B]'
                  : 'text-[#142C45] dark:text-[#E8EEF5]'
              }`}
            >
              {t.title}
            </div>
            {t.description && (
              <div className="text-[11px] text-[#5D6B7B] dark:text-[#8194A8] truncate">
                {t.description}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'customerName',
      header: 'Client / Account CIF',
      render: (t) => (
        <div className="space-y-0.5">
          <div className="font-medium text-[#273444] dark:text-[#E8EEF5] text-xs">
            {t.customerName || 'Direct Client'}
          </div>
          <div className="font-mono text-[11px] text-[#5D6B7B] dark:text-[#8194A8] flex items-center gap-1">
            <Building2 className="w-3 h-3 text-[#8793A1]" />
            <span>{t.customerCode || 'CIF-NA'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'dueDate',
      header: 'Target Date',
      mono: true,
      render: (t) => {
        const isDone = t.status === 'COMPLETED';
        const dueInfo = getDueDateStatus(t.dueDate, isDone);
        return (
          <div className="space-y-0.5">
            <div className="font-mono text-xs text-[#273444] dark:text-[#E8EEF5]">
              {t.dueDate}
            </div>
            <div className={`text-[10px] inline-flex items-center gap-1 ${dueInfo.badgeClass}`}>
              <Clock className="w-2.5 h-2.5" />
              <span>{dueInfo.label}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (t) => {
        const isHigh = t.priority === 'HIGH' || t.priority === 'CRITICAL';
        const isMed = t.priority === 'MEDIUM';
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
              isHigh
                ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30'
                : isMed
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                : 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30'
            }`}
          >
            {isHigh && <Flame className="w-3 h-3" />}
            {t.priority}
          </span>
        );
      },
    },
    {
      key: 'assignedToName',
      header: 'Account Officer',
      render: (t) => (
        <div className="flex items-center gap-1.5 text-xs text-[#273444] dark:text-[#A9BACB]">
          <User className="w-3.5 h-3.5 text-[#8793A1]" />
          <span>{t.assignedToName || 'Branch RM Team'}</span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Executive Command Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#DCE3EA] dark:border-[#33485D] pb-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded bg-[#142C45] text-white dark:bg-[#168C83]">
              <CheckSquare className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold text-[#142C45] dark:text-[#E8EEF5] tracking-tight">
              Officer Tasks & Client Follow-ups
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#168C83]/10 text-[#168C83] border border-[#168C83]/30">
              Dual-Control Agenda
            </span>
          </div>
          <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB] mt-0.5">
            Operational action register, statutory compliance follow-ups, and portfolio review task queue.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadTasks}
            disabled={loading}
            className="border-[#DCE3EA] dark:border-[#33485D] text-[#273444] dark:text-[#E8EEF5] hover:bg-[#EDF1F5] dark:hover:bg-[#192B3D]"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsFollowupModalOpen(true)}
            className="border-[#DCE3EA] dark:border-[#33485D] text-[#273444] dark:text-[#E8EEF5] hover:bg-[#EDF1F5] dark:hover:bg-[#192B3D]"
          >
            <PhoneCall className="w-3.5 h-3.5 mr-1.5 text-[#168C83]" />
            + Follow-up
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsTaskModalOpen(true)}
            className="bg-[#142C45] dark:bg-[#168C83] hover:bg-[#192B3D] dark:hover:bg-[#1B9D92] text-white"
          >
            <Plus className="w-3.5 h-3.5 mr-1.5" />
            New Task
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Tasks"
          value={tasks.length.toString()}
          badge="Live Register"
          badgeVariant="neutral"
        />
        <StatCard
          label="Pending Execution"
          value={tasks.filter((t) => t.status !== 'COMPLETED').length.toString()}
          badge="Active Queue"
          badgeVariant="warning"
        />
        <StatCard
          label="Overdue / Due Today"
          value={tasks.filter((t) => {
            if (t.status === 'COMPLETED') return false;
            const s = getDueDateStatus(t.dueDate, false);
            return s.status === 'OVERDUE' || s.status === 'TODAY';
          }).length.toString()}
          badge="Urgent SLA"
          badgeVariant="danger"
        />
        <StatCard
          label="Completed & Closed"
          value={tasks.filter((t) => t.status === 'COMPLETED').length.toString()}
          badge="Executed"
          badgeVariant="success"
        />
      </div>

      {/* Queue Tabs & Filters Bar */}
      <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg p-3 space-y-3 shadow-xs">
        <div className="flex items-center justify-between border-b border-[#DCE3EA] dark:border-[#33485D] pb-2.5">
          <div className="flex items-center gap-1 overflow-x-auto">
            {[
              { id: 'ALL', label: 'All Tasks', count: tasks.length },
              { id: 'PENDING', label: 'Pending Action', count: tasks.filter((t) => t.status !== 'COMPLETED').length },
              {
                id: 'OVERDUE',
                label: 'Overdue / Due Today',
                count: tasks.filter((t) => {
                  if (t.status === 'COMPLETED') return false;
                  const s = getDueDateStatus(t.dueDate, false);
                  return s.status === 'OVERDUE' || s.status === 'TODAY';
                }).length,
              },
              { id: 'HIGH_PRIORITY', label: 'High Priority', count: tasks.filter((t) => t.priority === 'HIGH' && t.status !== 'COMPLETED').length },
              { id: 'COMPLETED', label: 'Completed', count: tasks.filter((t) => t.status === 'COMPLETED').length },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveQueue(tab.id as any)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1.5 whitespace-nowrap ${
                  activeQueue === tab.id
                    ? 'bg-[#142C45] text-white dark:bg-[#168C83]'
                    : 'text-[#5D6B7B] dark:text-[#A9BACB] hover:bg-[#EDF1F5] dark:hover:bg-[#192B3D]'
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`text-[10px] font-mono px-1.5 py-0.2 rounded-full ${
                    activeQueue === tab.id
                      ? 'bg-white/20 text-white'
                      : 'bg-[#EDF1F5] dark:bg-[#101C2A] text-[#5D6B7B] dark:text-[#8194A8]'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setIsCompact(!isCompact)}
            className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#142C45] dark:hover:text-[#E8EEF5] flex items-center gap-1"
          >
            <SlidersHorizontal className="w-3 h-3" />
            <span>{isCompact ? 'Comfortable' : 'Compact'}</span>
          </button>
        </div>

        {/* Search & Selector Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-8 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8793A1]" />
            <input
              type="text"
              placeholder="Search by task title, client CIF, description, or RM..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-8 py-2 text-xs bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-md text-[#273444] dark:text-[#E8EEF5] placeholder-[#8793A1] focus:outline-none focus:ring-1 focus:ring-[#168C83] focus:border-[#168C83]"
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-2.5 text-[#8793A1] hover:text-[#273444] dark:hover:text-[#E8EEF5]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="sm:col-span-4">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-md text-[#273444] dark:text-[#E8EEF5] focus:outline-none focus:ring-1 focus:ring-[#168C83]"
            >
              <option value="ALL">All Severities</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
            </select>
          </div>
        </div>

        {/* Filter Summary Pill */}
        <div className="flex items-center justify-between text-xs pt-1">
          <div className="text-[11px] font-mono text-[#5D6B7B] dark:text-[#8194A8] flex items-center gap-2">
            <span>
              Showing <strong className="text-[#142C45] dark:text-[#E8EEF5]">{filteredTasks.length}</strong> of {tasks.length} tasks
            </span>
            {(search || activeQueue !== 'ALL' || priorityFilter !== 'ALL') && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-[#EDF1F5] dark:bg-[#101C2A] text-[#142C45] dark:text-[#A9BACB]">
                Filtered
              </span>
            )}
          </div>

          {(search || activeQueue !== 'ALL' || priorityFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setActiveQueue('ALL');
                setPriorityFilter('ALL');
              }}
              className="text-xs text-[#168C83] hover:underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Operational Table */}
      {error ? (
        <div className="p-4 bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-400 rounded text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>Operational Error: {error}</span>
        </div>
      ) : !loading && filteredTasks.length === 0 ? (
        <EmptyState
          icon={<CheckSquare className="w-8 h-8 text-[#8793A1]" />}
          title="No tasks match criteria"
          description="There are no officer tasks matching the active filters. Adjust your criteria or schedule a new task."
          actionLabel="Reset Queue Filters"
          onAction={() => {
            setSearch('');
            setActiveQueue('ALL');
            setPriorityFilter('ALL');
          }}
          className="border border-[#DCE3EA] dark:border-[#33485D] rounded-lg bg-[#FFFFFF] dark:bg-[#162638] p-8"
        />
      ) : (
        <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg overflow-hidden shadow-xs">
          <Table
            columns={columns}
            data={filteredTasks}
            isLoading={loading}
            keyExtractor={(t) => String(t.id)}
            onRowClick={(t) => setSelectedTask(t)}
            className={isCompact ? 'table-compact' : ''}
          />
        </div>
      )}

      {/* Task Details Dossier Modal */}
      {selectedTask && (
        <Modal
          isOpen={!!selectedTask}
          onClose={() => setSelectedTask(null)}
          title={`Task Dossier — #${selectedTask.id}`}
          subtitle={selectedTask.title}
          maxWidth="2xl"
          footerActions={
            <div className="flex items-center justify-between w-full">
              <Button
                variant={selectedTask.status === 'COMPLETED' ? 'outline' : 'primary'}
                size="sm"
                onClick={() => handleToggleStatus(selectedTask)}
                className={
                  selectedTask.status === 'COMPLETED'
                    ? 'border-[#DCE3EA] dark:border-[#33485D] text-[#273444] dark:text-[#E8EEF5]'
                    : 'bg-[#168C83] hover:bg-[#1B9D92] text-white'
                }
              >
                {selectedTask.status === 'COMPLETED' ? 'Re-open Task' : 'Mark Completed'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTask(null)}
                className="border-[#DCE3EA] dark:border-[#33485D] text-[#273444] dark:text-[#E8EEF5]"
              >
                Close
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            <div className="bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-mono text-[#5D6B7B] dark:text-[#8194A8] uppercase tracking-wider">Client</span>
                <div className="font-semibold text-[#142C45] dark:text-[#E8EEF5] mt-0.5">{selectedTask.customerName || 'Direct Client'}</div>
                <div className="font-mono text-[10px] text-[#5D6B7B] dark:text-[#8194A8]">{selectedTask.customerCode || 'CIF-NA'}</div>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#5D6B7B] dark:text-[#8194A8] uppercase tracking-wider">Due Date</span>
                <div className="font-mono font-medium text-[#273444] dark:text-[#E8EEF5] mt-0.5">{selectedTask.dueDate}</div>
                <div className="text-[10px] text-[#5D6B7B] dark:text-[#8194A8]">
                  {getDueDateStatus(selectedTask.dueDate, selectedTask.status === 'COMPLETED').label}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#5D6B7B] dark:text-[#8194A8] uppercase tracking-wider">Priority</span>
                <div className="mt-0.5">
                  <Badge variant={selectedTask.priority === 'HIGH' ? 'danger' : 'warning'} size="sm">
                    {selectedTask.priority}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-[10px] font-mono text-[#5D6B7B] dark:text-[#8194A8] uppercase tracking-wider">Assignee</span>
                <div className="font-medium text-[#273444] dark:text-[#E8EEF5] mt-0.5">{selectedTask.assignedToName || 'Branch Team'}</div>
              </div>
            </div>

            {selectedTask.description && (
              <div className="p-3 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg text-xs space-y-1">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-[#5D6B7B] dark:text-[#8194A8] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-[#168C83]" />
                  Task Instructions & Notes
                </span>
                <p className="text-[#273444] dark:text-[#E8EEF5] leading-relaxed whitespace-pre-wrap">
                  {selectedTask.description}
                </p>
              </div>
            )}

            {onNavigateToCustomer && selectedTask.customerId && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    onNavigateToCustomer(selectedTask.customerId);
                    setSelectedTask(null);
                  }}
                  className="px-3 py-1.5 bg-[#EDF1F5] dark:bg-[#101C2A] hover:bg-[#DCE3EA] dark:hover:bg-[#1C3045] text-[#142C45] dark:text-[#E8EEF5] text-xs font-medium rounded border border-[#DCE3EA] dark:border-[#33485D] transition-colors flex items-center gap-1.5"
                >
                  <span>Open Client 360 Workspace</span>
                  <ExternalLink className="w-3 h-3 text-[#168C83]" />
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Create Task Modal */}
      {isTaskModalOpen && (
        <Modal
          isOpen={isTaskModalOpen}
          onClose={() => setIsTaskModalOpen(false)}
          title="Schedule Operational Task"
          subtitle="Record relationship assignment in PostgreSQL"
          maxWidth="lg"
          footerActions={
            <div className="flex gap-2 justify-end w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsTaskModalOpen(false)}
                className="border-[#DCE3EA] dark:border-[#33485D] text-[#273444] dark:text-[#E8EEF5]"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateTask}
                disabled={saving || !title.trim()}
                className="bg-[#142C45] dark:bg-[#168C83] hover:bg-[#192B3D] text-white"
              >
                {saving ? 'Saving...' : 'Create Task'}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleCreateTask} className="space-y-3 text-xs">
            <div>
              <label className="block text-[#5D6B7B] dark:text-[#A9BACB] font-medium mb-1">Customer Account</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(Number(e.target.value))}
                className="w-full p-2 bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded text-[#273444] dark:text-[#E8EEF5] focus:outline-none focus:ring-1 focus:ring-[#168C83]"
              >
                <option value={1}>Rahul Sharma (CUS-10482)</option>
                <option value={2}>Kalyan Steels & Forgings Ltd (CUS-20841)</option>
                <option value={3}>Meera Sundaram (CUS-30915)</option>
                <option value={4}>Sunil Varma (CUS-40182)</option>
                <option value={5}>Ananya Deshmukh (CUS-50824)</option>
              </select>
            </div>

            <div>
              <label className="block text-[#5D6B7B] dark:text-[#A9BACB] font-medium mb-1">Task Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Schedule Q3 portfolio review meeting"
                className="w-full p-2 bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded text-[#273444] dark:text-[#E8EEF5] placeholder-[#8793A1] focus:outline-none focus:ring-1 focus:ring-[#168C83]"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[#5D6B7B] dark:text-[#A9BACB] font-medium mb-1">Due Date</label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full p-2 bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded text-[#273444] dark:text-[#E8EEF5] font-mono focus:outline-none focus:ring-1 focus:ring-[#168C83]"
                />
              </div>
              <div>
                <label className="block text-[#5D6B7B] dark:text-[#A9BACB] font-medium mb-1">Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="w-full p-2 bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded text-[#273444] dark:text-[#E8EEF5] focus:outline-none focus:ring-1 focus:ring-[#168C83]"
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-[#5D6B7B] dark:text-[#A9BACB] font-medium mb-1">Action Notes</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Instructions or specific background details..."
                className="w-full p-2 bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded text-[#273444] dark:text-[#E8EEF5] placeholder-[#8793A1] focus:outline-none focus:ring-1 focus:ring-[#168C83]"
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
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsFollowupModalOpen(false)}
                className="border-[#DCE3EA] dark:border-[#33485D] text-[#273444] dark:text-[#E8EEF5]"
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateFollowup}
                disabled={saving || !title.trim()}
                className="bg-[#168C83] hover:bg-[#1B9D92] text-white"
              >
                {saving ? 'Scheduling...' : 'Confirm Follow-up'}
              </Button>
            </div>
          }
        >
          <form onSubmit={handleCreateFollowup} className="space-y-3 text-xs">
            <div>
              <label className="block text-[#5D6B7B] dark:text-[#A9BACB] font-medium mb-1">Customer</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(Number(e.target.value))}
                className="w-full p-2 bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded text-[#273444] dark:text-[#E8EEF5] focus:outline-none focus:ring-1 focus:ring-[#168C83]"
              >
                <option value={1}>Rahul Sharma (CUS-10482)</option>
                <option value={2}>Kalyan Steels & Forgings Ltd (CUS-20841)</option>
                <option value={3}>Meera Sundaram (CUS-30915)</option>
                <option value={4}>Sunil Varma (CUS-40182)</option>
                <option value={5}>Ananya Deshmukh (CUS-50824)</option>
              </select>
            </div>

            <div>
              <label className="block text-[#5D6B7B] dark:text-[#A9BACB] font-medium mb-1">Follow-up Objective</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Call regarding term deposit renewal & rate card"
                className="w-full p-2 bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded text-[#273444] dark:text-[#E8EEF5] placeholder-[#8793A1] focus:outline-none focus:ring-1 focus:ring-[#168C83]"
              />
            </div>

            <div>
              <label className="block text-[#5D6B7B] dark:text-[#A9BACB] font-medium mb-1">Follow-up Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2 bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded text-[#273444] dark:text-[#E8EEF5] font-mono focus:outline-none focus:ring-1 focus:ring-[#168C83]"
              />
            </div>

            <div>
              <label className="block text-[#5D6B7B] dark:text-[#A9BACB] font-medium mb-1">Conversation Brief</label>
              <textarea
                rows={2}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Key talking points or agenda..."
                className="w-full p-2 bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded text-[#273444] dark:text-[#E8EEF5] placeholder-[#8793A1] focus:outline-none focus:ring-1 focus:ring-[#168C83]"
              />
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
