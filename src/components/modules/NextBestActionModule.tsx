import React, { useState, useEffect } from 'react';
import { bankingApi } from '../../lib/api';
import type { NextBestAction } from '../../types';
import { NextBestActionCard } from '../nba/NextBestActionCard';
import { ActionEvidenceModal } from '../nba/ActionEvidenceModal';
import { DismissActionModal } from '../nba/DismissActionModal';
import { CreateTaskModal } from '../nba/CreateTaskModal';
import { Button } from '../common/Button';
import {
  Sparkles,
  RefreshCw,
  Search,
  Filter,
  Layers,
  AlertTriangle,
  CheckCircle2,
  CheckSquare,
  ShieldAlert,
  ArrowUpDown,
} from 'lucide-react';

interface NextBestActionModuleProps {
  onNavigateToCustomer: (customerId: number) => void;
}

export const NextBestActionModule: React.FC<NextBestActionModuleProps> = ({
  onNavigateToCustomer,
}) => {
  const [actions, setActions] = useState<NextBestAction[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [recalculating, setRecalculating] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ACTIVE');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');
  const [priorityFilter, setPriorityFilter] = useState<string>('ALL');
  const [urgencyFilter, setUrgencyFilter] = useState<string>('ALL');

  // Modals state
  const [selectedEvidenceAction, setSelectedEvidenceAction] = useState<NextBestAction | null>(null);
  const [selectedDismissAction, setSelectedDismissAction] = useState<NextBestAction | null>(null);
  const [selectedTaskAction, setSelectedTaskAction] = useState<NextBestAction | null>(null);

  const fetchActions = async () => {
    setLoading(true);
    try {
      const res = await bankingApi.getNextBestActions({
        status: statusFilter === 'ALL' ? undefined : statusFilter,
        actionType: typeFilter === 'ALL' ? undefined : typeFilter,
        priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
        urgency: urgencyFilter === 'ALL' ? undefined : urgencyFilter,
        search: searchTerm.trim() || undefined,
        limit: 50,
      });
      setActions(res.data || []);
    } catch (err) {
      console.error('Failed to load next best actions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActions();
  }, [statusFilter, typeFilter, priorityFilter, urgencyFilter]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchActions();
  };

  const handleRecalculateAll = async () => {
    setRecalculating(true);
    try {
      await bankingApi.recalculateAllNextBestActions();
      await fetchActions();
    } catch (err) {
      console.error('Failed to recalculate actions:', err);
    } finally {
      setRecalculating(false);
    }
  };

  const handleAccept = async (action: NextBestAction) => {
    try {
      await bankingApi.acceptNextBestAction(action.id);
      await fetchActions();
    } catch (err) {
      console.error('Failed to accept action:', err);
    }
  };

  const handleConfirmDismiss = async (id: number, reason: string) => {
    await bankingApi.dismissNextBestAction(id, reason);
    await fetchActions();
  };

  const handleConfirmCreateTask = async (
    id: number,
    taskData: { title: string; dueDate: string; priority: string; description: string }
  ) => {
    await bankingApi.createTaskFromNextBestAction(id, taskData);
    await fetchActions();
  };

  return (
    <div className="space-y-5 p-6 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-2 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700">
              <Sparkles className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Next Best Action Engine</h1>
            <span className="text-[11px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
              Phase 11
            </span>
          </div>
          <p className="text-xs text-slate-500 max-w-2xl">
            Deterministic, rule-based recommendation engine prioritizing relationship-preserving service resolutions
            ahead of opportunistic cross-selling. Every recommendation carries immutable evidence.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRecalculateAll}
            disabled={recalculating || loading}
            className="inline-flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
            {recalculating ? 'Evaluating...' : 'Recalculate Portfolio'}
          </Button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer name, CIF, action title, or keywords..."
              className="w-full text-xs pl-9 pr-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <Button type="submit" variant="secondary" size="sm">
            Search
          </Button>
        </form>

        <div className="flex items-center gap-2 flex-wrap text-xs pt-1 border-t border-slate-100">
          <span className="text-slate-500 font-semibold flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5" />
            Filters:
          </span>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-xs p-1.5 rounded-md border border-slate-200 bg-slate-50 font-medium"
          >
            <option value="ACTIVE">Status: Active</option>
            <option value="ACCEPTED">Status: Accepted</option>
            <option value="DISMISSED">Status: Dismissed</option>
            <option value="ALL">Status: All</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="text-xs p-1.5 rounded-md border border-slate-200 bg-slate-50 font-medium"
          >
            <option value="ALL">Type: All Types</option>
            <option value="SERVICE">Service (SLA / Grievance)</option>
            <option value="OPP_FOLLOWUP">Opportunity Follow-up</option>
            <option value="CROSS_SELL">Cross-Sell Opportunity</option>
            <option value="TASK">Operational Task</option>
            <option value="ENGAGEMENT">Relationship Touchpoint</option>
          </select>

          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="text-xs p-1.5 rounded-md border border-slate-200 bg-slate-50 font-medium"
          >
            <option value="ALL">Priority: All</option>
            <option value="CRITICAL">Critical</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </select>

          <select
            value={urgencyFilter}
            onChange={(e) => setUrgencyFilter(e.target.value)}
            className="text-xs p-1.5 rounded-md border border-slate-200 bg-slate-50 font-medium"
          >
            <option value="ALL">Urgency: All</option>
            <option value="IMMEDIATE">Immediate</option>
            <option value="TODAY">Today</option>
            <option value="THIS_WEEK">This Week</option>
          </select>

          {(statusFilter !== 'ACTIVE' ||
            typeFilter !== 'ALL' ||
            priorityFilter !== 'ALL' ||
            urgencyFilter !== 'ALL' ||
            searchTerm) && (
            <button
              type="button"
              onClick={() => {
                setStatusFilter('ACTIVE');
                setTypeFilter('ALL');
                setPriorityFilter('ALL');
                setUrgencyFilter('ALL');
                setSearchTerm('');
              }}
              className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold ml-auto"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Actions List */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
          Loading prioritized recommendations...
        </div>
      ) : actions.length === 0 ? (
        <div className="py-12 text-center text-xs text-slate-500 bg-white rounded-xl border border-slate-200 p-8 space-y-2">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <div className="font-semibold text-slate-800 text-sm">No Next Best Actions match your current criteria</div>
          <p className="text-slate-500 max-w-md mx-auto">
            All customer relationships in this slice are operating nominally or have already been acted upon.
          </p>
          <div className="pt-2">
            <Button variant="secondary" size="sm" onClick={handleRecalculateAll}>
              Recalculate Recommendations
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-500 px-1">
            <span>Showing {actions.length} prioritized recommendations</span>
            <span className="font-mono text-[11px]">Sorted by Rank Score (Desc)</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {actions.map((action) => (
              <NextBestActionCard
                key={action.id}
                action={action}
                onAccept={handleAccept}
                onDismiss={(act) => setSelectedDismissAction(act)}
                onCreateTask={(act) => setSelectedTaskAction(act)}
                onViewEvidence={(act) => setSelectedEvidenceAction(act)}
                onNavigateToCustomer={onNavigateToCustomer}
              />
            ))}
          </div>
        </div>
      )}

      {/* Evidence Modal */}
      <ActionEvidenceModal
        isOpen={Boolean(selectedEvidenceAction)}
        onClose={() => setSelectedEvidenceAction(null)}
        action={selectedEvidenceAction}
        onNavigateToCustomer={onNavigateToCustomer}
      />

      {/* Dismiss Modal */}
      <DismissActionModal
        isOpen={Boolean(selectedDismissAction)}
        onClose={() => setSelectedDismissAction(null)}
        action={selectedDismissAction}
        onConfirm={handleConfirmDismiss}
      />

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={Boolean(selectedTaskAction)}
        onClose={() => setSelectedTaskAction(null)}
        action={selectedTaskAction}
        onConfirm={handleConfirmCreateTask}
      />
    </div>
  );
};
