import React, { useState, useEffect, useMemo } from 'react';
import { bankingApi } from '../../lib/api';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';
import { Table, Column } from '../common/Table';
import { StatCard } from '../common/StatCard';
import {
  LifeBuoy,
  Search,
  Filter,
  RefreshCw,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertTriangle,
  User,
  ShieldAlert,
  Send,
  Bot,
  X,
  SlidersHorizontal,
  ChevronRight,
  ExternalLink,
  Flame,
  Check,
  Building2,
  AlertCircle,
  FileText,
  Calendar,
} from 'lucide-react';
import { useCopilot } from '../../context/CopilotContext';
import { useToast } from '../common/Toast';

interface CaseItem {
  id: number;
  caseNumber: string;
  customerId: number;
  customerName?: string;
  customerCode?: string;
  category: string;
  priority: string;
  status: string;
  subject: string;
  description: string;
  assignedToName?: string;
  resolutionSummary?: string;
  createdAt: string;
  comments?: any[];
}

interface CasesModuleProps {
  onNavigateToCustomer?: (customerId: number) => void;
}

export const CasesModule: React.FC<CasesModuleProps> = ({ onNavigateToCustomer }) => {
  const { openDrawer } = useCopilot();
  const toast = useToast();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Queue Navigation
  const [activeQueue, setActiveQueue] = useState<'ALL' | 'ACTIVE' | 'CRITICAL' | 'SLA_RISK' | 'RESOLVED'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');
  const [isCompact, setIsCompact] = useState<boolean>(false);

  // Selected Case & Dossier State
  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [caseDetail, setCaseDetail] = useState<CaseItem | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [newComment, setNewComment] = useState<string>('');
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);
  const [resolvingCase, setResolvingCase] = useState<boolean>(false);
  const [resolutionSummary, setResolutionSummary] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'DOSSIER' | 'INVESTIGATION' | 'SLA'>('DOSSIER');

  const loadCases = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bankingApi.getCases({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
      });
      setCases(res.data || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load service cases');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCases();
  }, [statusFilter, priorityFilter]);

  const loadCaseDetail = async (id: number) => {
    setDetailLoading(true);
    try {
      const detail = await bankingApi.getCaseById(id);
      setCaseDetail(detail);
    } catch (err: any) {
      console.error(err);
    } finally {
      setDetailLoading(false);
    }
  };

  const handleOpenCase = (c: CaseItem) => {
    setSelectedCase(c);
    setActiveTab('DOSSIER');
    setResolvingCase(false);
    loadCaseDetail(c.id);
  };

  const handleAddComment = async () => {
    if (!selectedCase || !newComment.trim()) return;
    setSubmittingComment(true);
    try {
      await bankingApi.addCaseComment(selectedCase.id, newComment.trim());
      setNewComment('');
      toast.success('Investigation log note recorded.');
      loadCaseDetail(selectedCase.id);
    } catch (err: any) {
      toast.error(err.message || 'Failed to record note.');
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedCase) return;
    try {
      await bankingApi.updateCase(selectedCase.id, {
        status: newStatus,
        resolutionSummary: newStatus === 'RESOLVED' ? resolutionSummary || 'Resolved by branch operations team' : undefined,
      });
      setResolvingCase(false);
      setResolutionSummary('');
      toast.success(`Service case transitioned to ${newStatus.replace('_', ' ')}`);
      loadCaseDetail(selectedCase.id);
      loadCases();
      setSelectedCase((prev) => prev ? { ...prev, status: newStatus } : null);
    } catch (err: any) {
      toast.error(err.message || 'Failed to transition case status.');
    }
  };

  // Compute SLA status for a case
  const getSlaInfo = (createdAtStr: string, priority: string, status: string) => {
    const isClosed = status === 'RESOLVED' || status === 'CLOSED';
    const createdTime = new Date(createdAtStr).getTime();
    const now = Date.now();
    // Institutional SLA thresholds: Critical 12h, High 24h, Medium 48h, Low 72h
    const slaHours = priority === 'CRITICAL' ? 12 : priority === 'HIGH' ? 24 : priority === 'MEDIUM' ? 48 : 72;
    const slaTarget = createdTime + slaHours * 3600 * 1000;
    const remainingMs = slaTarget - now;
    const remainingHours = Math.round(remainingMs / (3600 * 1000));

    if (isClosed) {
      return { status: 'MET', label: 'SLA Met', badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30' };
    }
    if (remainingMs < 0) {
      const breachedHours = Math.abs(remainingHours);
      return { status: 'BREACHED', label: `Breached by ${breachedHours}h`, badgeClass: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30' };
    }
    if (remainingHours <= 4) {
      return { status: 'AT_RISK', label: `${remainingHours}h remaining`, badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30' };
    }
    return { status: 'NORMAL', label: `${remainingHours}h remaining`, badgeClass: 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30' };
  };

  // Filter cases by active queue, search, and category
  const filteredCases = useMemo(() => {
    return cases.filter((c) => {
      // Queue Filter
      if (activeQueue === 'ACTIVE' && (c.status === 'RESOLVED' || c.status === 'CLOSED')) return false;
      if (activeQueue === 'CRITICAL' && c.priority !== 'CRITICAL' && c.priority !== 'HIGH') return false;
      if (activeQueue === 'RESOLVED' && c.status !== 'RESOLVED' && c.status !== 'CLOSED') return false;
      if (activeQueue === 'SLA_RISK') {
        const sla = getSlaInfo(c.createdAt, c.priority, c.status);
        if (sla.status !== 'BREACHED' && sla.status !== 'AT_RISK') return false;
      }

      // Category filter
      if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false;

      // Text search
      if (!search.trim()) return true;
      const term = search.toLowerCase();
      return (
        c.caseNumber.toLowerCase().includes(term) ||
        (c.customerName && c.customerName.toLowerCase().includes(term)) ||
        (c.customerCode && c.customerCode.toLowerCase().includes(term)) ||
        c.subject.toLowerCase().includes(term) ||
        c.category.toLowerCase().includes(term)
      );
    });
  }, [cases, activeQueue, categoryFilter, search]);

  const categories = useMemo(() => {
    const set = new Set<string>();
    cases.forEach((c) => {
      if (c.category) set.add(c.category);
    });
    return Array.from(set);
  }, [cases]);

  // Operational Table Columns
  const columns: Column<CaseItem>[] = [
    {
      key: 'caseNumber',
      header: 'Case ID / Reference',
      mono: true,
      render: (c) => {
        const sla = getSlaInfo(c.createdAt, c.priority, c.status);
        return (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="font-mono font-semibold text-[#142C45] dark:text-[#E8EEF5] hover:text-[#168C83] dark:hover:text-[#168C83]">
                {c.caseNumber}
              </span>
              {c.priority === 'CRITICAL' && (
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
              )}
            </div>
            <div className="flex items-center gap-1.5 text-[10px] text-[#5D6B7B] dark:text-[#8194A8]">
              <Calendar className="w-3 h-3 text-[#8793A1]" />
              <span>{new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
            </div>
          </div>
        );
      },
    },
    {
      key: 'customerName',
      header: 'Client / Account CIF',
      render: (c) => (
        <div className="space-y-0.5">
          <div className="font-medium text-[#273444] dark:text-[#E8EEF5]">
            {c.customerName || 'Direct Client'}
          </div>
          <div className="font-mono text-[11px] text-[#5D6B7B] dark:text-[#8194A8] flex items-center gap-1">
            <Building2 className="w-3 h-3 text-[#8793A1]" />
            <span>{c.customerCode || 'CIF-NA'}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Grievance / Subject',
      render: (c) => (
        <div className="max-w-[280px] space-y-0.5">
          <div className="font-medium text-[#273444] dark:text-[#E8EEF5] text-xs truncate" title={c.subject}>
            {c.subject}
          </div>
          <div className="text-[11px] text-[#5D6B7B] dark:text-[#8194A8] truncate flex items-center gap-1">
            <span className="inline-block px-1.5 py-0.2 rounded bg-[#EDF1F5] dark:bg-[#101C2A] text-[#142C45] dark:text-[#A9BACB] text-[10px]">
              {c.category}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Severity',
      render: (c) => {
        const isCrit = c.priority === 'CRITICAL';
        const isHigh = c.priority === 'HIGH';
        const isMed = c.priority === 'MEDIUM';
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
              isCrit
                ? 'bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30'
                : isHigh
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                : isMed
                ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30'
                : 'bg-slate-500/10 text-slate-700 dark:text-slate-400 border-slate-500/30'
            }`}
          >
            {isCrit ? <Flame className="w-3 h-3" /> : isHigh ? <AlertTriangle className="w-3 h-3" /> : null}
            {c.priority}
          </span>
        );
      },
    },
    {
      key: 'sla',
      header: 'RBI SLA Clock',
      render: (c) => {
        const sla = getSlaInfo(c.createdAt, c.priority, c.status);
        return (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${sla.badgeClass}`}
          >
            <Clock className="w-3 h-3" />
            {sla.label}
          </span>
        );
      },
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => {
        const isResolved = c.status === 'RESOLVED' || c.status === 'CLOSED';
        const isInProgress = c.status === 'IN_PROGRESS';
        return (
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${
              isResolved
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                : isInProgress
                ? 'bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30'
                : 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isResolved ? 'bg-emerald-500' : isInProgress ? 'bg-blue-500' : 'bg-amber-500'
              }`}
            />
            {c.status.replace('_', ' ')}
          </span>
        );
      },
    },
    {
      key: 'assignedToName',
      header: 'Case Officer',
      render: (c) => (
        <div className="flex items-center gap-1.5 text-xs text-[#273444] dark:text-[#A9BACB]">
          <User className="w-3.5 h-3.5 text-[#8793A1]" />
          <span>{c.assignedToName || 'Unassigned Queue'}</span>
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
              <LifeBuoy className="w-4 h-4" />
            </div>
            <h1 className="text-lg font-bold text-[#142C45] dark:text-[#E8EEF5] tracking-tight">
              Service Desk & Grievance Governance
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#168C83]/10 text-[#168C83] border border-[#168C83]/30">
              RBI BO Scheme Compliant
            </span>
          </div>
          <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB] mt-0.5">
            Institutional dispute tracking, SLA breach prevention, and audit-logged grievance investigations.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={loadCases}
            disabled={loading}
            className="border-[#DCE3EA] dark:border-[#33485D] text-[#273444] dark:text-[#E8EEF5] hover:bg-[#EDF1F5] dark:hover:bg-[#192B3D]"
          >
            <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Sync Register
          </Button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Cases"
          value={cases.length.toString()}
          badge="Live Register"
          badgeVariant="neutral"
        />
        <StatCard
          label="Open & In Progress"
          value={cases.filter((c) => c.status === 'OPEN' || c.status === 'IN_PROGRESS').length.toString()}
          badge="Active Queue"
          badgeVariant="warning"
        />
        <StatCard
          label="Escalated / Critical"
          value={cases.filter((c) => c.priority === 'CRITICAL' || c.priority === 'HIGH').length.toString()}
          badge="Priority Risk"
          badgeVariant="danger"
        />
        <StatCard
          label="SLA Breached / At Risk"
          value={cases.filter((c) => {
            const sla = getSlaInfo(c.createdAt, c.priority, c.status);
            return sla.status === 'BREACHED' || sla.status === 'AT_RISK';
          }).length.toString()}
          badge="Urgent SLA"
          badgeVariant="danger"
        />
      </div>

      {/* Queue Filter Tabs & Search Controls */}
      <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg p-3 space-y-3 shadow-xs">
        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-[#DCE3EA] dark:border-[#33485D] pb-2.5">
          <div className="flex items-center gap-1 overflow-x-auto">
            {[
              { id: 'ALL', label: 'All Cases', count: cases.length },
              { id: 'ACTIVE', label: 'Active Queue', count: cases.filter((c) => c.status === 'OPEN' || c.status === 'IN_PROGRESS').length },
              { id: 'CRITICAL', label: 'Critical / High', count: cases.filter((c) => c.priority === 'CRITICAL' || c.priority === 'HIGH').length },
              { id: 'SLA_RISK', label: 'SLA Watchlist', count: cases.filter((c) => {
                const s = getSlaInfo(c.createdAt, c.priority, c.status);
                return s.status === 'BREACHED' || s.status === 'AT_RISK';
              }).length },
              { id: 'RESOLVED', label: 'Resolved / Closed', count: cases.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED').length },
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

        {/* Search & Selectors Row */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8793A1]" />
            <input
              type="text"
              placeholder="Search by case #, CIF, customer name, grievance subject..."
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

          <div className="sm:col-span-3">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-md text-[#273444] dark:text-[#E8EEF5] focus:outline-none focus:ring-1 focus:ring-[#168C83]"
            >
              <option value="ALL">All Categories ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-md text-[#273444] dark:text-[#E8EEF5] focus:outline-none focus:ring-1 focus:ring-[#168C83]"
            >
              <option value="ALL">All Severities</option>
              <option value="CRITICAL">Critical Priority</option>
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
              Showing <strong className="text-[#142C45] dark:text-[#E8EEF5]">{filteredCases.length}</strong> of {cases.length} records
            </span>
            {(search || activeQueue !== 'ALL' || priorityFilter !== 'ALL' || categoryFilter !== 'ALL') && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-[#EDF1F5] dark:bg-[#101C2A] text-[#142C45] dark:text-[#A9BACB]">
                <Filter className="w-2.5 h-2.5 text-[#168C83]" />
                Active Filters
              </span>
            )}
          </div>

          {(search || activeQueue !== 'ALL' || priorityFilter !== 'ALL' || categoryFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setActiveQueue('ALL');
                setPriorityFilter('ALL');
                setCategoryFilter('ALL');
              }}
              className="text-xs text-[#168C83] hover:underline font-medium"
            >
              Clear All Filters
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
      ) : !loading && filteredCases.length === 0 ? (
        <EmptyState
          icon={<LifeBuoy className="w-8 h-8 text-[#8793A1]" />}
          title="No service cases match filter criteria"
          description="Adjust your search query or reset queue filters to view service tickets."
          actionLabel="Reset Queue Filters"
          onAction={() => {
            setSearch('');
            setActiveQueue('ALL');
            setPriorityFilter('ALL');
            setCategoryFilter('ALL');
          }}
          className="border border-[#DCE3EA] dark:border-[#33485D] rounded-lg bg-[#FFFFFF] dark:bg-[#162638] p-8"
        />
      ) : (
        <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg overflow-hidden shadow-xs">
          <Table
            columns={columns}
            data={filteredCases}
            isLoading={loading}
            keyExtractor={(c) => String(c.id)}
            onRowClick={handleOpenCase}
            className={isCompact ? 'table-compact' : ''}
          />
        </div>
      )}

      {/* Case Dossier Modal / Slide-over Inquiry */}
      {selectedCase && (
        <Modal
          isOpen={!!selectedCase}
          onClose={() => {
            setSelectedCase(null);
            setCaseDetail(null);
          }}
          title={`Service Case Dossier — ${selectedCase.caseNumber}`}
          subtitle={selectedCase.subject}
          referenceId={selectedCase.caseNumber}
          maxWidth="4xl"
          footerActions={
            <div className="flex flex-col sm:flex-row items-center justify-between w-full gap-2">
              <div className="flex items-center gap-2 w-full sm:w-auto">
                {selectedCase.status !== 'RESOLVED' && selectedCase.status !== 'CLOSED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus('IN_PROGRESS')}
                    disabled={selectedCase.status === 'IN_PROGRESS'}
                    className="border-[#DCE3EA] dark:border-[#33485D] text-[#273444] dark:text-[#E8EEF5]"
                  >
                    Mark In Progress
                  </Button>
                )}
                {selectedCase.status !== 'RESOLVED' && selectedCase.status !== 'CLOSED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setResolvingCase(true)}
                    className="bg-[#168C83] hover:bg-[#1B9D92] text-white"
                  >
                    Resolve Case
                  </Button>
                )}
                {selectedCase.status === 'RESOLVED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleUpdateStatus('CLOSED')}
                    className="bg-[#142C45] hover:bg-[#192B3D] text-white dark:bg-[#168C83]"
                  >
                    Close Case & Archive
                  </Button>
                )}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setSelectedCase(null);
                  setCaseDetail(null);
                }}
                className="border-[#DCE3EA] dark:border-[#33485D] text-[#273444] dark:text-[#E8EEF5]"
              >
                Dismiss Dossier
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Copilot Contextual Action Banner */}
            <div className="bg-[#101C2A] border border-[#168C83]/40 rounded-lg p-3 flex flex-wrap items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-md bg-[#168C83]/20 flex items-center justify-center text-[#168C83]">
                  <Bot className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#E8EEF5]">Copilot Resolution Intelligence</div>
                  <div className="text-[10px] text-[#8194A8]">
                    Synthesize dispute history against regulatory compliance manuals
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() =>
                    openDrawer(
                      {
                        type: 'CUSTOMER',
                        id: selectedCase.customerId,
                        code: selectedCase.customerCode,
                        label: `${selectedCase.customerName || 'Client'} · ${selectedCase.customerCode || selectedCase.customerId}`,
                      },
                      `Analyze service case ${selectedCase.caseNumber} ("${selectedCase.subject}"). Review category ${selectedCase.category}, identify root cause, and draft an audit-defensible resolution action.`
                    )
                  }
                  className="px-2.5 py-1 bg-[#168C83]/20 hover:bg-[#168C83]/30 text-[#168C83] text-[11px] font-medium rounded border border-[#168C83]/40 transition-colors"
                >
                  Analyze Root Cause
                </button>
                {onNavigateToCustomer && selectedCase.customerId && (
                  <button
                    type="button"
                    onClick={() => {
                      onNavigateToCustomer(selectedCase.customerId);
                      setSelectedCase(null);
                    }}
                    className="px-2.5 py-1 bg-[#162638] hover:bg-[#1C3045] text-[#A9BACB] text-[11px] rounded border border-[#33485D] transition-colors flex items-center gap-1"
                  >
                    <span>View Customer 360</span>
                    <ExternalLink className="w-3 h-3 text-[#8793A1]" />
                  </button>
                )}
              </div>
            </div>

            {/* Structured Meta Grid */}
            <div className="bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-[10px] font-mono text-[#5D6B7B] dark:text-[#8194A8] uppercase tracking-wider">
                  Client CIF
                </span>
                <div className="font-semibold text-[#142C45] dark:text-[#E8EEF5] mt-0.5">
                  {selectedCase.customerName || 'Direct Client'}
                </div>
                <div className="font-mono text-[10px] text-[#5D6B7B] dark:text-[#8194A8]">{selectedCase.customerCode || 'CIF-NA'}</div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-[#5D6B7B] dark:text-[#8194A8] uppercase tracking-wider">
                  Dispute Category
                </span>
                <div className="font-medium text-[#273444] dark:text-[#E8EEF5] mt-0.5 truncate">{selectedCase.category}</div>
                <div className="text-[10px] text-[#5D6B7B] dark:text-[#8194A8]">Regulatory Escalation: Tier 1</div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-[#5D6B7B] dark:text-[#8194A8] uppercase tracking-wider">
                  SLA Timeline
                </span>
                <div className="mt-0.5">
                  {(() => {
                    const sla = getSlaInfo(selectedCase.createdAt, selectedCase.priority, selectedCase.status);
                    return (
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-mono font-medium border ${sla.badgeClass}`}>
                        <Clock className="w-3 h-3" />
                        {sla.label}
                      </span>
                    );
                  })()}
                </div>
              </div>

              <div>
                <span className="text-[10px] font-mono text-[#5D6B7B] dark:text-[#8194A8] uppercase tracking-wider">
                  Investigation Status
                </span>
                <div className="mt-0.5">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                      selectedCase.status === 'RESOLVED' || selectedCase.status === 'CLOSED'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30'
                        : selectedCase.status === 'IN_PROGRESS'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30'
                    }`}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current" />
                    {selectedCase.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>

            {/* Grievance Statement */}
            <div className="p-3 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg text-xs space-y-1">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-[#5D6B7B] dark:text-[#8194A8] flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-[#168C83]" />
                Formal Grievance Statement
              </span>
              <p className="text-[#273444] dark:text-[#E8EEF5] leading-relaxed whitespace-pre-wrap">
                {selectedCase.description}
              </p>
            </div>

            {/* Resolution Form if active */}
            {resolvingCase && (
              <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-xs space-y-2.5">
                <div className="flex items-center gap-1.5 font-semibold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Enter Resolution Summary & Closure Justification</span>
                </div>
                <textarea
                  rows={2}
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  placeholder="Record formal corrective action, refund adjustments, or customer communication..."
                  className="w-full p-2.5 text-xs bg-[#FFFFFF] dark:bg-[#101C2A] border border-emerald-500/40 rounded-md text-[#273444] dark:text-[#E8EEF5] placeholder-[#8793A1] focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <div className="flex gap-2 justify-end">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setResolvingCase(false)}
                    className="border-emerald-500/30 text-emerald-800 dark:text-emerald-300"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleUpdateStatus('RESOLVED')}
                    className="bg-[#168C83] hover:bg-[#1B9D92] text-white"
                  >
                    Confirm Resolution
                  </Button>
                </div>
              </div>
            )}

            {/* Investigation Audit Trail & Comment Thread */}
            <div className="space-y-2.5 border-t border-[#DCE3EA] dark:border-[#33485D] pt-3">
              <div className="flex items-center justify-between">
                <span className="font-semibold uppercase tracking-wider text-[10px] text-[#5D6B7B] dark:text-[#8194A8] flex items-center gap-1.5">
                  <MessageSquare className="w-3.5 h-3.5 text-[#168C83]" />
                  Audit Trail & Investigation Notes ({caseDetail?.comments?.length || 0})
                </span>
                <span className="text-[10px] font-mono text-[#8793A1]">Immutable Log</span>
              </div>

              {detailLoading ? (
                <div className="text-xs text-[#5D6B7B] dark:text-[#8194A8] py-3 text-center">
                  Loading investigation audit trail...
                </div>
              ) : (
                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {caseDetail?.comments && caseDetail.comments.length > 0 ? (
                    caseDetail.comments.map((comment: any) => (
                      <div
                        key={comment.id}
                        className="p-2.5 bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-md text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-[#142C45] dark:text-[#E8EEF5] flex items-center gap-1.5">
                            <User className="w-3 h-3 text-[#168C83]" />
                            {comment.authorName}
                          </span>
                          <span className="text-[#8793A1] font-mono text-[10px]">
                            {new Date(comment.createdAt).toLocaleString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>
                        <p className="text-[#273444] dark:text-[#A9BACB] pl-4">{comment.comment}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-[#8793A1] italic py-2 text-center">
                      No investigation notes recorded yet.
                    </div>
                  )}
                </div>
              )}

              {/* Add Comment Input */}
              <div className="flex items-center gap-2 pt-1.5">
                <input
                  type="text"
                  placeholder="Append officer investigation remark or internal note..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddComment();
                  }}
                  className="flex-1 py-1.5 px-3 text-xs bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-md text-[#273444] dark:text-[#E8EEF5] placeholder-[#8793A1] focus:outline-none focus:ring-1 focus:ring-[#168C83]"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddComment}
                  disabled={submittingComment || !newComment.trim()}
                  className="border-[#DCE3EA] dark:border-[#33485D] text-[#273444] dark:text-[#E8EEF5] hover:bg-[#EDF1F5] dark:hover:bg-[#192B3D]"
                >
                  <Send className="w-3 h-3 mr-1 text-[#168C83]" />
                  Post
                </Button>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
