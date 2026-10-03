import React, { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  CheckCheck,
  AlertTriangle,
  RotateCw,
  Search,
  Filter,
  Layers,
  Clock,
  Shield,
  FileText,
  DollarSign,
  CheckCircle2,
  XCircle,
  RotateCcw,
  ArrowUpRight,
  Eye,
  RefreshCw,
  Server,
  AlertCircle,
  HelpCircle,
  Play,
  CheckSquare
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type {
  OperationsSummaryDTO,
  OperationalApprovalDTO,
  OperationalExceptionDTO,
  ReconciliationRecordDTO,
  FailedWorkflowDTO,
  OperationalTaskDTO,
  OperationalEventDTO,
} from '../../types/operations.types';
import { ApprovalReviewModal } from './ApprovalReviewModal';
import { ExceptionDetailDrawer } from './ExceptionDetailDrawer';

type WorkspaceTab = 'approvals' | 'exceptions' | 'reconciliation' | 'workflows' | 'tasks' | 'events';

export const OperationsWorkspace: React.FC = () => {
  const { user } = useAuth();

  // State for active tab
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('approvals');
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Operational Data State
  const [summary, setSummary] = useState<OperationsSummaryDTO | null>(null);
  const [summaryError, setSummaryError] = useState(false);
  const [approvals, setApprovals] = useState<OperationalApprovalDTO[]>([]);
  const [exceptions, setExceptions] = useState<OperationalExceptionDTO[]>([]);
  const [reconciliations, setReconciliations] = useState<ReconciliationRecordDTO[]>([]);
  const [workflows, setWorkflows] = useState<FailedWorkflowDTO[]>([]);
  const [tasks, setTasks] = useState<OperationalTaskDTO[]>([]);
  const [events, setEvents] = useState<OperationalEventDTO[]>([]);

  // Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal / Drawer Selection
  const [selectedApproval, setSelectedApproval] = useState<OperationalApprovalDTO | null>(null);
  const [isApprovalModalOpen, setIsApprovalModalOpen] = useState(false);

  const [selectedException, setSelectedException] = useState<OperationalExceptionDTO | null>(null);
  const [isExceptionDrawerOpen, setIsExceptionDrawerOpen] = useState(false);

  // Reconciliation Resolution Modal State
  const [selectedReconciliation, setSelectedReconciliation] = useState<ReconciliationRecordDTO | null>(null);
  const [reconResolutionNotes, setReconResolutionNotes] = useState('');
  const [isReconModalOpen, setIsReconModalOpen] = useState(false);
  const [isSubmittingRecon, setIsSubmittingRecon] = useState(false);

  // Workflow Retry State
  const [retryTarget, setRetryTarget] = useState<FailedWorkflowDTO | null>(null);
  const [isRetryingWorkflow, setIsRetryingWorkflow] = useState(false);
  const [retrySuccessMsg, setRetrySuccessMsg] = useState<string | null>(null);

  // Fetch summary and tab data
  const loadAllData = useCallback(async () => {
    setError(null);
    try {
      const [sumRes, appRes, exRes, reconRes, wfRes, taskRes, evRes] = await Promise.all([
        api.getOperationsSummary().catch(() => ({ success: false, data: null })),
        api.getOperationalApprovals().catch(() => ({ success: false, data: [] })),
        api.getOperationalExceptions().catch(() => ({ success: false, data: [] })),
        api.getReconciliationRecords().catch(() => ({ success: false, data: [] })),
        api.getFailedWorkflows().catch(() => ({ success: false, data: [] })),
        api.getOperationalTasks().catch(() => ({ success: false, data: [] })),
        api.getOperationalEvents().catch(() => ({ success: false, data: [] })),
      ]);

      if (sumRes && sumRes.success && sumRes.data) {
        setSummary(sumRes.data);
        setSummaryError(false);
      } else {
        setSummary(null);
        setSummaryError(true);
      }

      setApprovals(appRes?.data || []);
      setExceptions(exRes?.data || []);
      setReconciliations(reconRes?.data || []);
      setWorkflows(wfRes?.data || []);
      setTasks(taskRes?.data || []);
      setEvents(evRes?.data || []);
    } catch (err: any) {
      setError(err?.message || 'Failed to load operational control data.');
      setSummaryError(true);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  const handleManualRefresh = () => {
    setIsRefreshing(true);
    loadAllData();
  };

  // Safe retry handler for failed workflows
  const handleWorkflowRetry = async () => {
    if (!retryTarget) return;
    setIsRetryingWorkflow(true);
    setRetrySuccessMsg(null);
    try {
      const res = await api.retryWorkflow(retryTarget.workflowId, retryTarget.workflowType);
      if (res && res.success) {
        setRetrySuccessMsg(`Workflow ${retryTarget.workflowId} safely retried: ${res.data?.outcome || 'SUCCESS'}`);
        setRetryTarget(null);
        loadAllData();
      } else {
        setError('Retry failed or workflow is not in a retryable state.');
      }
    } catch (err: any) {
      setError(err?.message || 'Retry operation failed.');
    } finally {
      setIsRetryingWorkflow(false);
    }
  };

  // Reconciliation resolution handler
  const handleResolveReconciliation = async () => {
    if (!selectedReconciliation || !reconResolutionNotes.trim()) return;
    setIsSubmittingRecon(true);
    try {
      const res = await api.resolveReconciliationRecord(selectedReconciliation.id, reconResolutionNotes);
      if (res && res.success) {
        setIsReconModalOpen(false);
        setSelectedReconciliation(null);
        setReconResolutionNotes('');
        loadAllData();
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to resolve reconciliation variance.');
    } finally {
      setIsSubmittingRecon(false);
    }
  };

  // Helper formatting badges
  const renderPriorityBadge = (priority: string) => {
    const p = priority.toUpperCase();
    if (p === 'CRITICAL') return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">CRITICAL</span>;
    if (p === 'HIGH') return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">HIGH</span>;
    if (p === 'MEDIUM') return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200">MEDIUM</span>;
    return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-700 border border-slate-200">{p}</span>;
  };

  const renderStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'APPROVED' || s === 'RESOLVED' || s === 'MATCHED' || s === 'CLOSED') {
      return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">{s}</span>;
    }
    if (s === 'REJECTED' || s === 'MISMATCH' || s === 'BREACHED') {
      return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">{s}</span>;
    }
    if (s === 'PENDING' || s === 'UNDER_REVIEW' || s === 'INVESTIGATING' || s === 'ACKNOWLEDGED') {
      return <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200">{s}</span>;
    }
    return <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-slate-50 text-slate-700 border border-slate-200">{s}</span>;
  };

  // Filtering Logic for Approvals
  const filteredApprovals = approvals.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (severityFilter !== 'ALL' && item.priority !== severityFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = item.approvalId.toLowerCase().includes(q);
      const matchCustomer = item.customerName?.toLowerCase().includes(q) || item.customerCode?.toLowerCase().includes(q);
      const matchReason = item.reason.toLowerCase().includes(q);
      return matchId || matchCustomer || matchReason;
    }
    return true;
  });

  // Filtering Logic for Exceptions
  const filteredExceptions = exceptions.filter((item) => {
    if (categoryFilter !== 'ALL' && item.category !== categoryFilter) return false;
    if (severityFilter !== 'ALL' && item.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchId = item.exceptionId.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchCustomer = item.customerName?.toLowerCase().includes(q) || item.customerCode?.toLowerCase().includes(q);
      return matchId || matchDesc || matchCustomer;
    }
    return true;
  });

  // Filtering Logic for Reconciliation
  const filteredReconciliations = reconciliations.filter((item) => {
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.reconciliationId.toLowerCase().includes(q) ||
        item.source.toLowerCase().includes(q) ||
        item.reconciliationType.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#172033] p-6 space-y-6">
      {/* Enterprise Context Header */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-md bg-[#087F8C]/10 text-[#087F8C]">
              <Activity className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold tracking-tight text-[#172033]">
              Banking Operations Workspace
            </h1>
            <span className="text-[11px] px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 font-mono font-medium">
              SYNTHETIC CONTROL LAYER
            </span>
          </div>
          <p className="text-xs text-[#475569] mt-1">
            Centralized dual-control maker/checker queue, reconciliation variance monitor, and exception remediation.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <span className="text-[11px] text-[#475569] block">Operational Business Date</span>
            <span className="text-xs font-mono font-semibold text-slate-800">
              {new Date().toISOString().split('T')[0]} (DAY 274)
            </span>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-[#E2E8F0] rounded-md hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-[#087F8C]' : 'text-slate-500'}`} />
            <span>{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-800 text-xs font-medium">
            Dismiss
          </button>
        </div>
      )}

      {retrySuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg text-emerald-800 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{retrySuccessMsg}</span>
          </div>
          <button onClick={() => setRetrySuccessMsg(null)} className="text-emerald-700 hover:text-emerald-900 text-xs font-medium">
            Dismiss
          </button>
        </div>
      )}

      {/* 3. OPERATIONS SUMMARY METRICS ROW (10 compact database-backed KPIs) */}
      <div className="grid grid-cols-2 sm:grid-cols-5 lg:grid-cols-10 gap-2.5">
        {[
          { label: 'Pending Approvals', val: summary?.pendingApprovals, highlight: (summary?.pendingApprovals ?? 0) > 0 ? 'text-amber-600' : 'text-slate-800' },
          { label: 'High Priority Ex.', val: summary?.highPriorityExceptions, highlight: (summary?.highPriorityExceptions ?? 0) > 0 ? 'text-red-600 font-bold' : 'text-slate-800' },
          { label: 'SLA At Risk', val: summary?.slaAtRisk, highlight: (summary?.slaAtRisk ?? 0) > 0 ? 'text-red-600 font-bold' : 'text-slate-800' },
          { label: 'Failed Workflows', val: summary?.failedWorkflows, highlight: (summary?.failedWorkflows ?? 0) > 0 ? 'text-red-600' : 'text-slate-800' },
          { label: 'KYC Exceptions', val: summary?.kycExceptions, highlight: 'text-slate-800' },
          { label: 'Doc Exceptions', val: summary?.documentExceptions, highlight: 'text-slate-800' },
          { label: 'Recon Exceptions', val: summary?.reconciliationExceptions, highlight: (summary?.reconciliationExceptions ?? 0) > 0 ? 'text-amber-600' : 'text-slate-800' },
          { label: 'Awaiting Checker', val: summary?.awaitingChecker, highlight: (summary?.awaitingChecker ?? 0) > 0 ? 'text-blue-600' : 'text-slate-800' },
          { label: 'Tasks Due', val: summary?.operationalTasksDue, highlight: 'text-slate-800' },
          { label: 'Resolved Today', val: summary?.resolvedToday, highlight: 'text-emerald-600 font-semibold' },
        ].map((item, idx) => (
          <div
            key={idx}
            className="bg-white rounded-md border border-[#E2E8F0] p-2.5 shadow-2xs flex flex-col justify-between"
          >
            <span className="text-[11px] font-medium text-[#475569] truncate" title={item.label}>
              {item.label}
            </span>
            <div className="mt-1">
              {summaryError ? (
                <span className="text-xs font-medium text-slate-400">Unavailable</span>
              ) : isLoading ? (
                <div className="h-4 w-8 bg-slate-100 animate-pulse rounded" />
              ) : (
                <span className={`text-base font-mono font-semibold ${item.highlight}`}>
                  {item.val !== undefined && item.val !== null ? item.val : 'Unavailable'}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main Operational Container */}
      <div className="bg-white rounded-lg border border-[#E2E8F0] shadow-xs overflow-hidden">
        {/* Tab Navigation */}
        <div className="border-b border-[#E2E8F0] bg-slate-50/70 px-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex space-x-1">
            {[
              { id: 'approvals', label: 'Maker / Checker Queue', count: approvals.filter(a => a.status === 'PENDING').length },
              { id: 'exceptions', label: 'Operational Exceptions', count: exceptions.filter(e => e.status === 'OPEN' || e.status === 'IN_PROGRESS').length },
              { id: 'reconciliation', label: 'Reconciliation Workspace', count: reconciliations.filter(r => r.status === 'MISMATCH').length },
              { id: 'workflows', label: 'Failed Workflows', count: workflows.length },
              { id: 'tasks', label: 'Operational Tasks', count: tasks.length },
              { id: 'events', label: 'System Events & Audit', count: events.length },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as WorkspaceTab);
                  setSearchQuery('');
                  setCategoryFilter('ALL');
                  setSeverityFilter('ALL');
                  setStatusFilter('ALL');
                }}
                className={`py-3 px-3.5 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === tab.id
                    ? 'border-[#087F8C] text-[#087F8C] font-semibold bg-white'
                    : 'border-transparent text-[#475569] hover:text-[#172033] hover:border-slate-300'
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                    activeTab === tab.id ? 'bg-[#087F8C] text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Quick Filters */}
          <div className="py-2 flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search operational records..."
                className="text-xs pl-8 pr-3 py-1 border border-slate-200 rounded-md focus:ring-1 focus:ring-[#087F8C] focus:border-[#087F8C] w-48 lg:w-64 bg-white"
              />
            </div>

            {/* Status Filter for tabs */}
            {activeTab !== 'workflows' && activeTab !== 'tasks' && activeTab !== 'events' && (
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="text-xs py-1 px-2 border border-slate-200 rounded-md bg-white text-slate-700"
              >
                <option value="ALL">All Statuses</option>
                {activeTab === 'approvals' && (
                  <>
                    <option value="PENDING">PENDING</option>
                    <option value="UNDER_REVIEW">UNDER_REVIEW</option>
                    <option value="APPROVED">APPROVED</option>
                    <option value="REJECTED">REJECTED</option>
                    <option value="RETURNED">RETURNED</option>
                  </>
                )}
                {activeTab === 'exceptions' && (
                  <>
                    <option value="OPEN">OPEN</option>
                    <option value="ACKNOWLEDGED">ACKNOWLEDGED</option>
                    <option value="IN_PROGRESS">IN_PROGRESS</option>
                    <option value="RESOLVED">RESOLVED</option>
                    <option value="CLOSED">CLOSED</option>
                  </>
                )}
                {activeTab === 'reconciliation' && (
                  <>
                    <option value="MATCHED">MATCHED</option>
                    <option value="MISMATCH">MISMATCH</option>
                    <option value="INVESTIGATING">INVESTIGATING</option>
                    <option value="RESOLVED">RESOLVED</option>
                  </>
                )}
              </select>
            )}

            {/* Severity Filter for exceptions */}
            {activeTab === 'exceptions' && (
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="text-xs py-1 px-2 border border-slate-200 rounded-md bg-white text-slate-700"
              >
                <option value="ALL">All Severities</option>
                <option value="CRITICAL">CRITICAL</option>
                <option value="HIGH">HIGH</option>
                <option value="MEDIUM">MEDIUM</option>
                <option value="LOW">LOW</option>
              </select>
            )}
          </div>
        </div>

        {/* Tab 1: PENDING APPROVALS & MAKER-CHECKER QUEUE */}
        {activeTab === 'approvals' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-[#E2E8F0] text-[#475569] font-medium">
                <tr>
                  <th className="py-2.5 px-4">Approval ID</th>
                  <th className="py-2.5 px-4">Request Type</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Amount</th>
                  <th className="py-2.5 px-4">Maker</th>
                  <th className="py-2.5 px-4">Checker</th>
                  <th className="py-2.5 px-4">SLA Deadline</th>
                  <th className="py-2.5 px-4">Priority</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredApprovals.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      No operational approvals found matching the active filters.
                    </td>
                  </tr>
                ) : (
                  filteredApprovals.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-900">
                        {app.approvalId}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-medium text-slate-800">
                          {app.requestType.replace(/_/g, ' ')}
                        </span>
                        <p className="text-[11px] text-slate-500 truncate max-w-xs" title={app.reason}>
                          {app.reason}
                        </p>
                      </td>
                      <td className="py-2.5 px-4">
                        {app.customerName ? (
                          <div>
                            <span className="font-semibold text-slate-900">{app.customerName}</span>
                            {app.customerCode && (
                              <span className="block font-mono text-[10px] text-slate-500">
                                {app.customerCode}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">Institutional</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-800">
                        {app.amount ? `${app.currency} ${Number(app.amount).toLocaleString('en-IN')}` : '—'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">
                        <span className="block font-medium">{app.makerName}</span>
                        <span className="text-[10px] text-slate-500">{app.makerRole || 'MAKER'}</span>
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">
                        {app.checkerName ? (
                          <>
                            <span className="block font-medium">{app.checkerName}</span>
                            <span className="text-[10px] text-slate-500">{app.checkerRole || 'CHECKER'}</span>
                          </>
                        ) : (
                          <span className="text-amber-600 italic">Awaiting Checker</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {app.slaDeadline ? (
                          <div className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            <span>{new Date(app.slaDeadline).toLocaleDateString()}</span>
                          </div>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        {renderPriorityBadge(app.priority)}
                      </td>
                      <td className="py-2.5 px-4">
                        {renderStatusBadge(app.status)}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedApproval(app);
                            setIsApprovalModalOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-[#087F8C] hover:bg-[#087F8C]/10 rounded border border-[#087F8C]/30 transition-colors"
                        >
                          Review Dual-Control
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 2: OPERATIONAL EXCEPTIONS */}
        {activeTab === 'exceptions' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-[#E2E8F0] text-[#475569] font-medium">
                <tr>
                  <th className="py-2.5 px-4">Exception ID</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Severity</th>
                  <th className="py-2.5 px-4">Customer / Related Entity</th>
                  <th className="py-2.5 px-4">Description</th>
                  <th className="py-2.5 px-4">Source Subsystem</th>
                  <th className="py-2.5 px-4">Owner</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredExceptions.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      No operational exceptions found matching the current criteria.
                    </td>
                  </tr>
                ) : (
                  filteredExceptions.map((ex) => (
                    <tr key={ex.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-900">
                        {ex.exceptionId}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-700">
                        <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-[10px]">
                          {ex.category}
                        </span>
                      </td>
                      <td className="py-2.5 px-4">
                        {renderPriorityBadge(ex.severity)}
                      </td>
                      <td className="py-2.5 px-4">
                        {ex.customerName ? (
                          <div>
                            <span className="font-semibold text-slate-900">{ex.customerName}</span>
                            {ex.customerCode && (
                              <span className="block font-mono text-[10px] text-slate-500">
                                {ex.customerCode}
                              </span>
                            )}
                          </div>
                        ) : ex.relatedEntityId ? (
                          <span className="font-mono text-slate-600">
                            {ex.relatedEntityType}: {ex.relatedEntityId}
                          </span>
                        ) : (
                          <span className="text-slate-400">Institutional</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 text-slate-800 max-w-sm">
                        <p className="truncate font-medium" title={ex.description}>
                          {ex.description}
                        </p>
                      </td>
                      <td className="py-2.5 px-4 text-slate-500 font-mono text-[11px]">
                        {ex.source}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">
                        {ex.ownerName || <span className="text-slate-400 italic">Unassigned</span>}
                      </td>
                      <td className="py-2.5 px-4">
                        {renderStatusBadge(ex.status)}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedException(ex);
                            setIsExceptionDrawerOpen(true);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-[#087F8C] hover:bg-[#087F8C]/10 rounded border border-[#087F8C]/30 transition-colors"
                        >
                          View & Resolve
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: RECONCILIATION WORKSPACE */}
        {activeTab === 'reconciliation' && (
          <div className="overflow-x-auto">
            <div className="p-3 bg-slate-50/80 border-b border-[#E2E8F0] flex items-center justify-between text-xs text-slate-600">
              <span className="font-medium flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-[#087F8C]" />
                Synthetic Core Reconciliation (Calculated variance based on ledger snapshots)
              </span>
              <span className="text-[11px] text-slate-500">
                Automated hourly batch run: Active
              </span>
            </div>

            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-[#E2E8F0] text-[#475569] font-medium">
                <tr>
                  <th className="py-2.5 px-4">Reconciliation ID</th>
                  <th className="py-2.5 px-4">Business Date</th>
                  <th className="py-2.5 px-4">Source Subsystem</th>
                  <th className="py-2.5 px-4">Reconciliation Type</th>
                  <th className="py-2.5 px-4 text-right">Expected Value</th>
                  <th className="py-2.5 px-4 text-right">Observed Value</th>
                  <th className="py-2.5 px-4 text-right">Variance</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4">Owner</th>
                  <th className="py-2.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {filteredReconciliations.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-500">
                      No reconciliation records found matching criteria.
                    </td>
                  </tr>
                ) : (
                  filteredReconciliations.map((recon) => {
                    const varianceNum = Number(recon.variance) || 0;
                    return (
                      <tr key={recon.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-4 font-mono font-medium text-slate-900">
                          {recon.reconciliationId}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-slate-600">
                          {recon.businessDate}
                        </td>
                        <td className="py-2.5 px-4 font-mono text-[11px] text-slate-700">
                          {recon.source}
                        </td>
                        <td className="py-2.5 px-4 font-medium text-slate-800">
                          {recon.reconciliationType.replace(/_/g, ' ')}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-800">
                          {Number(recon.expectedValue).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-800">
                          {Number(recon.observedValue).toLocaleString('en-IN')}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono font-semibold">
                          <span className={varianceNum !== 0 ? 'text-red-600' : 'text-emerald-600'}>
                            {varianceNum > 0 ? `+${varianceNum.toLocaleString('en-IN')}` : varianceNum.toLocaleString('en-IN')}
                          </span>
                        </td>
                        <td className="py-2.5 px-4">
                          {renderStatusBadge(recon.status)}
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">
                          {recon.ownerName || 'Automated Engine'}
                        </td>
                        <td className="py-2.5 px-4 text-right">
                          {recon.status !== 'RESOLVED' && recon.status !== 'MATCHED' ? (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedReconciliation(recon);
                                setReconResolutionNotes('');
                                setIsReconModalOpen(true);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-[#087F8C] hover:bg-[#087F8C]/10 rounded border border-[#087F8C]/30 transition-colors"
                            >
                              Resolve Variance
                            </button>
                          ) : (
                            <span className="text-[11px] text-slate-400">Reconciled</span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 4: FAILED WORKFLOWS */}
        {activeTab === 'workflows' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-[#E2E8F0] text-[#475569] font-medium">
                <tr>
                  <th className="py-2.5 px-4">Workflow ID</th>
                  <th className="py-2.5 px-4">Type</th>
                  <th className="py-2.5 px-4">Entity</th>
                  <th className="py-2.5 px-4">Failure Stage</th>
                  <th className="py-2.5 px-4">Failure Reason</th>
                  <th className="py-2.5 px-4">Owner</th>
                  <th className="py-2.5 px-4">Timestamp</th>
                  <th className="py-2.5 px-4">Status</th>
                  <th className="py-2.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {workflows.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-500">
                      No failed workflows currently detected. All operational queues healthy.
                    </td>
                  </tr>
                ) : (
                  workflows.map((wf) => (
                    <tr key={wf.workflowId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-900">
                        {wf.workflowId}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-700">
                        {wf.workflowType}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="font-semibold text-slate-900 block">{wf.entityName || wf.entityId}</span>
                        <span className="font-mono text-[10px] text-slate-500">{wf.entityType}: {wf.entityId}</span>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-700">
                        {wf.failureStage}
                      </td>
                      <td className="py-2.5 px-4 text-red-700 max-w-sm truncate" title={wf.failureReason}>
                        {wf.failureReason}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {wf.owner || 'OPERATIONS'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {new Date(wf.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4">
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200">
                          {wf.status}
                        </span>
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        {wf.retryAvailable ? (
                          <button
                            type="button"
                            onClick={() => setRetryTarget(wf)}
                            className="px-2.5 py-1 text-xs font-semibold text-white bg-[#087F8C] hover:bg-[#076c77] rounded transition-colors flex items-center gap-1 ml-auto"
                          >
                            <Play className="w-3 h-3" />
                            Safe Retry
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400">Non-Retryable</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 5: OPERATIONAL TASKS */}
        {activeTab === 'tasks' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-[#E2E8F0] text-[#475569] font-medium">
                <tr>
                  <th className="py-2.5 px-4">Task ID</th>
                  <th className="py-2.5 px-4">Title & Context</th>
                  <th className="py-2.5 px-4">Customer</th>
                  <th className="py-2.5 px-4">Category</th>
                  <th className="py-2.5 px-4">Priority</th>
                  <th className="py-2.5 px-4">Due Date</th>
                  <th className="py-2.5 px-4">Assigned To</th>
                  <th className="py-2.5 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {tasks.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      No operational tasks pending action.
                    </td>
                  </tr>
                ) : (
                  tasks.map((task) => (
                    <tr key={task.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-900">
                        TSK-{task.id}
                      </td>
                      <td className="py-2.5 px-4 max-w-sm">
                        <span className="font-semibold text-slate-900 block">{task.title}</span>
                        {task.description && (
                          <p className="text-[11px] text-slate-500 truncate" title={task.description}>
                            {task.description}
                          </p>
                        )}
                      </td>
                      <td className="py-2.5 px-4">
                        {task.relatedCustomerName ? (
                          <div>
                            <span className="font-semibold text-slate-900">{task.relatedCustomerName}</span>
                            {task.relatedCustomerCode && (
                              <span className="block font-mono text-[10px] text-slate-500">
                                {task.relatedCustomerCode}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-slate-400">Institutional</span>
                        )}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-slate-600">
                        {task.category}
                      </td>
                      <td className="py-2.5 px-4">
                        {renderPriorityBadge(task.priority)}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600 font-medium">
                        {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'None'}
                      </td>
                      <td className="py-2.5 px-4 font-mono text-slate-700">
                        {task.assignedTo}
                      </td>
                      <td className="py-2.5 px-4">
                        {renderStatusBadge(task.status)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 6: SYSTEM EVENTS & AUDIT TRAIL */}
        {activeTab === 'events' && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50/75 border-b border-[#E2E8F0] text-[#475569] font-medium">
                <tr>
                  <th className="py-2.5 px-4">Event ID</th>
                  <th className="py-2.5 px-4">Event Type</th>
                  <th className="py-2.5 px-4">Severity</th>
                  <th className="py-2.5 px-4">Actor</th>
                  <th className="py-2.5 px-4">Title & Context</th>
                  <th className="py-2.5 px-4">Subsystem</th>
                  <th className="py-2.5 px-4">Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0]">
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      No operational events recorded yet.
                    </td>
                  </tr>
                ) : (
                  events.map((ev) => (
                    <tr key={ev.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-4 font-mono font-medium text-slate-900">
                        {ev.eventId}
                      </td>
                      <td className="py-2.5 px-4 font-semibold text-slate-800">
                        {ev.eventType}
                      </td>
                      <td className="py-2.5 px-4">
                        {renderPriorityBadge(ev.severity)}
                      </td>
                      <td className="py-2.5 px-4 text-slate-700">
                        <span className="font-medium block">{ev.actorName || 'System Service'}</span>
                        <span className="text-[10px] text-slate-500">{ev.actorRole || 'SYSTEM'}</span>
                      </td>
                      <td className="py-2.5 px-4 max-w-md">
                        <span className="font-semibold text-slate-900 block">{ev.title}</span>
                        <p className="text-[11px] text-slate-600 truncate" title={ev.description}>
                          {ev.description}
                        </p>
                      </td>
                      <td className="py-2.5 px-4 font-mono text-[11px] text-slate-500">
                        {ev.sourceModule}
                      </td>
                      <td className="py-2.5 px-4 text-slate-500">
                        {new Date(ev.createdAt).toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review & Dual-Control Approval Modal */}
      <ApprovalReviewModal
        approval={selectedApproval}
        isOpen={isApprovalModalOpen}
        onClose={() => {
          setIsApprovalModalOpen(false);
          setSelectedApproval(null);
        }}
        onSuccess={() => {
          loadAllData();
        }}
      />

      {/* Exception Detail Drawer */}
      <ExceptionDetailDrawer
        exception={selectedException}
        isOpen={isExceptionDrawerOpen}
        onClose={() => {
          setIsExceptionDrawerOpen(false);
          setSelectedException(null);
        }}
        onSuccess={() => {
          loadAllData();
        }}
      />

      {/* Reconciliation Resolution Modal */}
      {isReconModalOpen && selectedReconciliation && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full p-6 text-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-semibold text-slate-900">
                Resolve Reconciliation Variance: {selectedReconciliation.reconciliationId}
              </h3>
              <button
                onClick={() => setIsReconModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                &times;
              </button>
            </div>

            <div className="text-xs bg-slate-50 p-3 rounded border border-slate-200 space-y-1 font-mono">
              <p>Type: {selectedReconciliation.reconciliationType}</p>
              <p>Source: {selectedReconciliation.source}</p>
              <p>Expected: {Number(selectedReconciliation.expectedValue).toLocaleString('en-IN')}</p>
              <p>Observed: {Number(selectedReconciliation.observedValue).toLocaleString('en-IN')}</p>
              <p className="font-bold text-red-600">Variance: {Number(selectedReconciliation.variance).toLocaleString('en-IN')}</p>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700 block">
                Resolution Explanation & Balancing Voucher Reference <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={reconResolutionNotes}
                onChange={(e) => setReconResolutionNotes(e.target.value)}
                placeholder="Specify journal entry reference or physical cash count re-verification reason..."
                className="w-full text-xs p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#087F8C]"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsReconModalOpen(false)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmittingRecon || !reconResolutionNotes.trim()}
                onClick={handleResolveReconciliation}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#087F8C] rounded-md hover:bg-[#076c77] disabled:opacity-50"
              >
                {isSubmittingRecon ? 'Resolving...' : 'Confirm Reconciliation Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safe Workflow Retry Confirmation Modal */}
      {retryTarget && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5 max-w-md w-full shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-amber-600">
              <RotateCcw className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-semibold text-slate-900">
                Safe Workflow Retry Confirmation
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Confirm idempotent retry for workflow <span className="font-mono font-semibold">{retryTarget.workflowId}</span> ({retryTarget.workflowType})?
              The system will verify precondition idempotency and record an audit log entry.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRetryTarget(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isRetryingWorkflow}
                onClick={handleWorkflowRetry}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#087F8C] rounded-md hover:bg-[#076c77]"
              >
                {isRetryingWorkflow ? 'Retrying...' : 'Execute Safe Retry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
