import React, { useState, useEffect } from 'react';
import { bankingApi } from '../../lib/api.ts';
import { Badge } from '../common/Badge.tsx';
import { Button } from '../common/Button.tsx';
import { Modal } from '../common/Modal.tsx';
import { Table, Column } from '../common/Table.tsx';
import { StatCard } from '../common/StatCard.tsx';
import {
  LifeBuoy,
  Search,
  Filter,
  RefreshCw,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  ShieldCheck,
  Send,
  Bot,
} from 'lucide-react';
import { useCopilot } from '../../context/CopilotContext.tsx';

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

export const CasesModule: React.FC = () => {
  const { openDrawer } = useCopilot();
  const [cases, setCases] = useState<CaseItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [search, setSearch] = useState<string>('');

  const [selectedCase, setSelectedCase] = useState<CaseItem | null>(null);
  const [caseDetail, setCaseDetail] = useState<CaseItem | null>(null);
  const [detailLoading, setDetailLoading] = useState<boolean>(false);
  const [newComment, setNewComment] = useState<string>('');
  const [submittingComment, setSubmittingComment] = useState<boolean>(false);
  const [resolvingCase, setResolvingCase] = useState<boolean>(false);
  const [resolutionSummary, setResolutionSummary] = useState<string>('');

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
      setError(err.message || 'Failed to load cases');
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
    loadCaseDetail(c.id);
  };

  const handleAddComment = async () => {
    if (!selectedCase || !newComment.trim()) return;
    setSubmittingComment(true);
    try {
      await bankingApi.addCaseComment(selectedCase.id, newComment.trim());
      setNewComment('');
      loadCaseDetail(selectedCase.id);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleUpdateStatus = async (newStatus: string) => {
    if (!selectedCase) return;
    try {
      await bankingApi.updateCase(selectedCase.id, {
        status: newStatus,
        resolutionSummary: newStatus === 'RESOLVED' ? resolutionSummary || 'Resolved by branch officer' : undefined,
      });
      setResolvingCase(false);
      setResolutionSummary('');
      loadCaseDetail(selectedCase.id);
      loadCases();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const filteredCases = cases.filter((c) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      c.caseNumber.toLowerCase().includes(term) ||
      (c.customerName && c.customerName.toLowerCase().includes(term)) ||
      c.subject.toLowerCase().includes(term) ||
      c.category.toLowerCase().includes(term)
    );
  });

  const columns: Column<CaseItem>[] = [
    {
      key: 'caseNumber',
      header: 'Case Number',
      mono: true,
      render: (c) => (
        <div>
          <span className="font-mono font-semibold text-slate-900">{c.caseNumber}</span>
          <div className="text-[10px] text-slate-500">{new Date(c.createdAt).toLocaleDateString('en-IN')}</div>
        </div>
      ),
    },
    {
      key: 'customerName',
      header: 'Customer',
      render: (c) => (
        <div>
          <span className="font-medium text-slate-900">{c.customerName || 'Direct Client'}</span>
          <div className="font-mono text-[11px] text-slate-500">{c.customerCode || 'CUS-NA'}</div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category / Subject',
      render: (c) => (
        <div className="max-w-[260px]">
          <div className="font-semibold text-slate-800 text-xs truncate">{c.subject}</div>
          <div className="text-[11px] text-slate-500 truncate">{c.category}</div>
        </div>
      ),
    },
    {
      key: 'priority',
      header: 'Priority',
      render: (c) => (
        <Badge
          variant={
            c.priority === 'CRITICAL'
              ? 'danger'
              : c.priority === 'HIGH'
              ? 'warning'
              : c.priority === 'MEDIUM'
              ? 'info'
              : 'neutral'
          }
          size="sm"
        >
          {c.priority}
        </Badge>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (c) => (
        <Badge
          variant={
            c.status === 'RESOLVED' || c.status === 'CLOSED'
              ? 'success'
              : c.status === 'IN_PROGRESS'
              ? 'info'
              : 'warning'
          }
          size="sm"
        >
          {c.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: 'assignedToName',
      header: 'Assigned Officer',
      render: (c) => (
        <span className="text-xs text-slate-700">{c.assignedToName || 'Unassigned'}</span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <LifeBuoy className="w-5 h-5 text-slate-700" />
            <span>Service Cases & Grievance Governance</span>
          </h1>
          <p className="text-xs text-slate-500">
            PostgreSQL-backed customer grievance resolution, audit trails, and RBI SLA compliance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={loadCases} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Cases"
          value={cases.length.toString()}
          badge="Live DB"
          badgeVariant="neutral"
        />
        <StatCard
          label="Open / In Progress"
          value={cases.filter((c) => c.status === 'OPEN' || c.status === 'IN_PROGRESS').length.toString()}
          badge="Active Queue"
          badgeVariant="warning"
        />
        <StatCard
          label="Critical / High"
          value={cases.filter((c) => c.priority === 'CRITICAL' || c.priority === 'HIGH').length.toString()}
          badge="Escalated"
          badgeVariant="danger"
        />
        <StatCard
          label="Resolved / Closed"
          value={cases.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED').length.toString()}
          badge="Completed"
          badgeVariant="success"
        />
      </div>

      {/* Controls & Search */}
      <div className="bg-white border border-slate-200 rounded p-3 space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by case #, customer, subject..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="ALL">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical Priority</option>
              <option value="HIGH">High Priority</option>
              <option value="MEDIUM">Medium Priority</option>
              <option value="LOW">Low Priority</option>
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
          data={filteredCases}
          keyExtractor={(c) => String(c.id)}
          onRowClick={handleOpenCase}
        />
      )}

      {/* Case Detail Modal */}
      {selectedCase && (
        <Modal
          isOpen={!!selectedCase}
          onClose={() => {
            setSelectedCase(null);
            setCaseDetail(null);
          }}
          title={`Case Dossier — ${selectedCase.caseNumber}`}
          subtitle={selectedCase.subject}
          referenceId={selectedCase.caseNumber}
          maxWidth="2xl"
          footerActions={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                {selectedCase.status !== 'RESOLVED' && selectedCase.status !== 'CLOSED' && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdateStatus('IN_PROGRESS')}
                    disabled={selectedCase.status === 'IN_PROGRESS'}
                  >
                    Mark In Progress
                  </Button>
                )}
                {selectedCase.status !== 'RESOLVED' && selectedCase.status !== 'CLOSED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setResolvingCase(true)}
                  >
                    Resolve Case
                  </Button>
                )}
                {selectedCase.status === 'RESOLVED' && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleUpdateStatus('CLOSED')}
                  >
                    Close Case
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
              >
                Dismiss
              </Button>
            </div>
          }
        >
          <div className="space-y-4">
            {/* Copilot Contextual Quick Actions */}
            <div className="bg-slate-900 border border-emerald-500/30 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-white">Ask Copilot about Service Case:</span>
                  <span className="text-[10px] text-slate-400 ml-1.5 hidden sm:inline">{selectedCase.caseNumber}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openDrawer({
                    type: 'CUSTOMER',
                    id: selectedCase.customerId,
                    code: selectedCase.customerCode,
                    label: `${selectedCase.customerName || 'Client'} · ${selectedCase.customerCode || selectedCase.customerId}`,
                  }, `Review Case ${selectedCase.caseNumber} ("${selectedCase.subject}"). Analyze root cause and recommend resolution steps grounded in bank policy.`)}
                  className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-medium rounded border border-emerald-500/40 transition-colors"
                >
                  Analyze Issue & Root Cause
                </button>
                <button
                  type="button"
                  onClick={() => openDrawer({
                    type: 'CUSTOMER',
                    id: selectedCase.customerId,
                    code: selectedCase.customerCode,
                    label: `${selectedCase.customerName || 'Client'} · ${selectedCase.customerCode || selectedCase.customerId}`,
                  }, `What is ${selectedCase.customerName || 'this customer'}'s relationship context and recent activity?`)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] rounded border border-slate-700 transition-colors"
                >
                  Customer 360 Context
                </button>
              </div>
            </div>

            {/* Meta Strip */}
            <div className="bg-slate-50 border border-slate-200 rounded p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div>
                <span className="text-slate-500">Customer</span>
                <div className="font-semibold text-slate-900 mt-0.5">
                  {selectedCase.customerName || 'Direct Client'}
                </div>
                <div className="font-mono text-[10px] text-slate-500">{selectedCase.customerCode}</div>
              </div>
              <div>
                <span className="text-slate-500">Category</span>
                <div className="font-medium text-slate-800 mt-0.5">{selectedCase.category}</div>
              </div>
              <div>
                <span className="text-slate-500">Priority</span>
                <div className="mt-0.5">
                  <Badge variant={selectedCase.priority === 'CRITICAL' ? 'danger' : 'warning'} size="sm">
                    {selectedCase.priority}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-slate-500">Status</span>
                <div className="mt-0.5">
                  <Badge variant={selectedCase.status === 'RESOLVED' ? 'success' : 'info'} size="sm">
                    {selectedCase.status}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="p-3 bg-white border border-slate-200 rounded text-xs space-y-1">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-500">
                Grievance Description
              </span>
              <p className="text-slate-700 leading-relaxed">{selectedCase.description}</p>
            </div>

            {/* Resolution Form if active */}
            {resolvingCase && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded text-xs space-y-2">
                <span className="font-semibold text-emerald-900">Enter Resolution Summary & Closure Justification</span>
                <textarea
                  rows={2}
                  value={resolutionSummary}
                  onChange={(e) => setResolutionSummary(e.target.value)}
                  placeholder="Details of investigation and rectification..."
                  className="w-full p-2 text-xs bg-white border border-emerald-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setResolvingCase(false)}>
                    Cancel
                  </Button>
                  <Button variant="primary" size="sm" onClick={() => handleUpdateStatus('RESOLVED')}>
                    Confirm Resolution
                  </Button>
                </div>
              </div>
            )}

            {/* Comment Thread from PostgreSQL */}
            <div className="space-y-2 border-t border-slate-200 pt-3">
              <span className="font-semibold uppercase tracking-wider text-[10px] text-slate-500 flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Case Investigation Audit Trail & Notes ({caseDetail?.comments?.length || 0})
              </span>

              {detailLoading ? (
                <div className="text-xs text-slate-500 py-2">Loading notes trail...</div>
              ) : (
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {caseDetail?.comments && caseDetail.comments.length > 0 ? (
                    caseDetail.comments.map((comment: any) => (
                      <div key={comment.id} className="p-2.5 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="font-semibold text-slate-800 flex items-center gap-1">
                            <User className="w-3 h-3 text-slate-500" />
                            {comment.authorName}
                          </span>
                          <span className="text-slate-400 font-mono text-[10px]">
                            {new Date(comment.createdAt).toLocaleString('en-IN')}
                          </span>
                        </div>
                        <p className="text-slate-700">{comment.comment}</p>
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-slate-400 italic">No notes logged yet.</div>
                  )}
                </div>
              )}

              {/* Add Comment Input */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Append officer investigation remark..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddComment();
                  }}
                  className="flex-1 py-1.5 px-3 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddComment}
                  disabled={submittingComment || !newComment.trim()}
                >
                  <Send className="w-3 h-3 mr-1" />
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
