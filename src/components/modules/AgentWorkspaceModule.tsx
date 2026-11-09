import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Clock,
  Play,
  CheckSquare,
  Square,
  RotateCcw,
  Sparkles,
  FileText,
  UserCheck,
  ArrowRight,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  ChevronRight,
  Layers,
  Database,
  Lock,
  Plus,
  Compass,
  GitBranch,
  RefreshCw,
  ExternalLink,
  Info,
  Check,
  X,
  History,
  Activity,
  User,
} from 'lucide-react';
import { api } from '../../lib/api';
import {
  AgentPlanDTO,
  AgentPlanStepDTO,
  AgentSessionDTO,
  AgentPlanStatus,
  AgentStepStatus,
  AgentToolDefinition,
} from '../../types/agent.types';
import { DecisionTracePanel } from '../decision-trace/DecisionTracePanel';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { Dialog } from '../common/Dialog';
import { EmptyState } from '../common/EmptyState';
import { StatCard } from '../common/StatCard';

interface AgentWorkspaceModuleProps {
  initialPlanId?: string;
  initialCustomerId?: number;
  onNavigateToCustomer?: (customerId: number) => void;
  onNavigateToModule?: (moduleName: string) => void;
}

export const AgentWorkspaceModule: React.FC<AgentWorkspaceModuleProps> = ({
  initialPlanId,
  initialCustomerId,
  onNavigateToCustomer,
  onNavigateToModule,
}) => {
  // State
  const [sessions, setSessions] = useState<AgentSessionDTO[]>([]);
  const [activeSession, setActiveSession] = useState<AgentSessionDTO | null>(null);
  const [activePlan, setActivePlan] = useState<AgentPlanDTO | null>(null);
  const [toolCatalog, setToolCatalog] = useState<AgentToolDefinition[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [selectedSteps, setSelectedSteps] = useState<Record<number, boolean>>({});
  const [executionReport, setExecutionReport] = useState<any | null>(null);
  const [selectedTraceId, setSelectedTraceId] = useState<string | null>(null);
  const [actionNotice, setActionNotice] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // New Plan Modal State
  const [showNewPlanModal, setShowNewPlanModal] = useState<boolean>(false);
  const [newPlanCustomer, setNewPlanCustomer] = useState<number>(initialCustomerId || 1);
  const [newPlanTitle, setNewPlanTitle] = useState<string>('');
  const [newPlanObjective, setNewPlanObjective] = useState<string>('');
  const [isSubmittingDraft, setIsSubmittingDraft] = useState<boolean>(false);

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, [initialPlanId]);

  const loadInitialData = async () => {
    setIsLoading(true);
    try {
      // 1. Load tools catalog
      const toolsRes = await api.getAgentTools();
      if (toolsRes && toolsRes.data) {
        setToolCatalog(toolsRes.data);
      }

      // 2. Load sessions
      const sessionsRes = await api.listAgentSessions(10);
      const sessionList: AgentSessionDTO[] = sessionsRes?.data || [];
      setSessions(sessionList);

      if (sessionList.length > 0) {
        // Look for targeted plan or select latest active session
        let targetSession = sessionList[0];
        if (initialPlanId) {
          const match = sessionList.find(s => s.activePlan?.planId === initialPlanId);
          if (match) targetSession = match;
        }
        setActiveSession(targetSession);

        // Load specific plan if provided, or session's active plan
        if (initialPlanId) {
          const planRes = await api.getAgentPlan(initialPlanId);
          if (planRes && planRes.data) {
            setActivePlan(planRes.data);
            initStepSelection(planRes.data.steps);
          }
        } else if (targetSession.activePlan) {
          const planRes = await api.getAgentPlan(targetSession.activePlan.id);
          if (planRes && planRes.data) {
            setActivePlan(planRes.data);
            initStepSelection(planRes.data.steps);
          }
        }
      }
    } catch (err: any) {
      console.error('[AgentWorkspaceModule] Failed to load data:', err);
      setActionNotice({ type: 'error', message: err?.message || 'Failed to initialize agent workspace.' });
    } finally {
      setIsLoading(false);
    }
  };

  const initStepSelection = (steps: AgentPlanStepDTO[]) => {
    const initial: Record<number, boolean> = {};
    steps.forEach((step) => {
      // By default select steps that are not skipped or cancelled
      initial[step.stepNumber] = step.status !== 'SKIPPED' && step.status !== 'CANCELLED';
    });
    setSelectedSteps(initial);
  };

  const handleSelectSession = async (session: AgentSessionDTO) => {
    setActiveSession(session);
    setExecutionReport(null);
    if (session.activePlan) {
      try {
        const planRes = await api.getAgentPlan(session.activePlan.id);
        if (planRes?.data) {
          setActivePlan(planRes.data);
          initStepSelection(planRes.data.steps);
        }
      } catch (e) {
        setActivePlan(session.activePlan);
      }
    } else {
      setActivePlan(null);
    }
  };

  const handleToggleStep = (stepNumber: number) => {
    if (activePlan?.status !== 'AWAITING_APPROVAL' && activePlan?.status !== 'DRAFT') return;
    setSelectedSteps((prev) => ({
      ...prev,
      [stepNumber]: !prev[stepNumber],
    }));
  };

  const handleApprovePlan = async (isPartial: boolean = false) => {
    if (!activePlan) return;
    try {
      const stepNumbers = isPartial
        ? Object.entries(selectedSteps)
            .filter(([_, isSel]) => isSel)
            .map(([num]) => Number(num))
        : undefined;

      const res = await api.approveAgentPlan(activePlan.id, stepNumbers);
      if (res?.data) {
        setActivePlan(res.data);
        setActionNotice({
          type: 'success',
          message: isPartial
            ? `Plan partially approved (${stepNumbers?.length} steps authorized). Ready for governed execution.`
            : 'All plan steps authorized. Governed execution is now unlocked.',
        });
      }
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err?.message || 'Plan approval failed.' });
    }
  };

  const handleRejectPlan = async () => {
    if (!activePlan) return;
    const reason = prompt('Please enter rejection rationale for audit logging:', 'Step criteria not aligned with client preference.');
    if (!reason) return;

    try {
      const res = await api.rejectAgentPlan(activePlan.id, reason);
      if (res?.data) {
        setActivePlan(res.data);
        setActionNotice({ type: 'info', message: 'Plan rejected and cancelled. Audit record generated.' });
      }
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err?.message || 'Failed to reject plan.' });
    }
  };

  const handleExecutePlan = async () => {
    if (!activePlan) return;
    setIsExecuting(true);
    setActionNotice(null);
    try {
      const res = await api.executeAgentPlan(activePlan.id);
      if (res?.data) {
        setExecutionReport(res.data);
        // Refresh plan details
        const updated = await api.getAgentPlan(activePlan.id);
        if (updated?.data) {
          setActivePlan(updated.data);
        }
        setActionNotice({
          type: res.data.status === 'COMPLETED' ? 'success' : 'info',
          message: `Execution finished with status: ${res.data.status}. ${res.data.completedStepsCount} steps completed.`,
        });
      }
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err?.message || 'Plan execution encountered an error.' });
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCreateDraftPlan = async () => {
    if (!newPlanObjective.trim() || !newPlanTitle.trim()) return;
    setIsSubmittingDraft(true);
    try {
      const res = await api.createAgentPlanFromContext({
        customerId: newPlanCustomer,
        source: 'CUSTOMER_360',
        title: newPlanTitle,
        objective: newPlanObjective,
      });

      if (res?.data) {
        setShowNewPlanModal(false);
        setNewPlanTitle('');
        setNewPlanObjective('');
        await loadInitialData();
        setActionNotice({ type: 'success', message: 'New Governed Agent Plan draft created and awaiting human authorization.' });
      }
    } catch (err: any) {
      setActionNotice({ type: 'error', message: err?.message || 'Failed to create plan draft.' });
    } finally {
      setIsSubmittingDraft(false);
    }
  };

  // Helper stats
  const stepsCount = activePlan?.steps?.length || 0;
  const completedCount = activePlan?.steps?.filter(s => s.status === 'COMPLETED').length || 0;
  const selectedCount = Object.values(selectedSteps).filter(Boolean).length;
  const mutatingCount = activePlan?.steps?.filter(s => s.requiresConfirmation).length || 0;

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#172033] p-4 md:p-6 lg:p-8 space-y-6">
      {/* Alert Banner */}
      {actionNotice && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border text-xs animate-in fade-in transition-all ${
            actionNotice.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : actionNotice.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-blue-50 border-blue-200 text-blue-800'
          }`}
        >
          <div className="flex items-center gap-3">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : actionNotice.type === 'error' ? (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-blue-600 shrink-0" />
            )}
            <span className="font-medium">{actionNotice.message}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-slate-400 hover:text-slate-700 transition"
            aria-label="Dismiss notice"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="bg-white dark:bg-[#162638] rounded-xl border border-[#E2E8F0] dark:border-[#33485D] p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 text-[#273444] dark:text-[#E8EEF5]">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-[#087F8C]/10 border border-[#087F8C]/20 text-[#087F8C] dark:text-[#2dd4c7]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-[#172033] dark:text-[#E8EEF5]">
                  Controlled Banking Agent
                </h1>
                <Badge variant="success" size="sm">
                  Dual-Control Governed
                </Badge>
              </div>
              <p className="text-xs text-[#475569] dark:text-[#8194A8] mt-0.5">
                Sequential workflow orchestration with strict human approval gates & transaction verification.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Governance Sequence Pipeline Stepper */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] text-[11px] font-mono text-[#64748B]">
            <span className="text-slate-700 font-bold">PLAN</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-700 font-bold">EXPLAIN</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-700 font-bold">ASK</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-[#087F8C] font-bold">AUTHORIZE</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-blue-700 font-bold">EXECUTE</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-700 font-bold">VERIFY</span>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            <span className="text-slate-700 font-bold">REPORT</span>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => setShowNewPlanModal(true)}
            icon={<Plus className="w-3.5 h-3.5" />}
          >
            New Agent Plan
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={loadInitialData}
            title="Refresh Sessions & Plans"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-[#087F8C]' : 'text-slate-600'}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* KPI Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Plan Steps"
          value={stepsCount}
          caption="Deterministic steps in sequence"
          icon={<Layers className="w-4 h-4 text-[#087F8C]" />}
        />
        <StatCard
          label="Authorized Steps"
          value={selectedCount}
          caption={`Selected for approval out of ${stepsCount}`}
          icon={<CheckSquare className="w-4 h-4 text-emerald-600" />}
        />
        <StatCard
          label="Mutating Actions"
          value={mutatingCount}
          caption="Require dual-control authorization"
          icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}
        />
        <StatCard
          label="Execution Status"
          value={activePlan ? activePlan.status : 'IDLE'}
          caption={activePlan ? `Version ${activePlan.planVersion}` : 'No active execution'}
          icon={<Activity className="w-4 h-4 text-blue-600" />}
        />
      </div>

      {/* Main Grid: Sessions Sidebar + Plan Detail Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sessions & Historical Runs (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-4 text-[#273444] dark:text-[#E8EEF5]">
          <div className="bg-white dark:bg-[#162638] border border-[#E2E8F0] dark:border-[#33485D] rounded-xl p-4 shadow-2xs">
            <div className="flex items-center justify-between mb-3 pb-2 border-b border-slate-100 dark:border-[#33485D]">
              <h2 className="text-xs font-bold uppercase tracking-wider text-[#475569] dark:text-[#A9BACB] flex items-center gap-2">
                <History className="w-3.5 h-3.5 text-[#087F8C] dark:text-[#2dd4c7]" />
                Governed Sessions
              </h2>
              <span className="text-xs font-mono text-[#64748B] dark:text-[#8194A8]">{sessions.length} recorded</span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {sessions.map((sess) => {
                const isSelected = activeSession?.id === sess.id;
                const statusVariant =
                  sess.status === 'COMPLETED'
                    ? 'success'
                    : sess.status === 'AWAITING_APPROVAL'
                    ? 'warning'
                    : sess.status === 'EXECUTING'
                    ? 'info'
                    : 'neutral';

                return (
                  <div
                    key={sess.id}
                    onClick={() => handleSelectSession(sess)}
                    className={`p-3 rounded-lg border text-left cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-[#F0FDFA] dark:bg-[#1C3045] border-[#087F8C] dark:border-[#2dd4c7] shadow-2xs ring-1 ring-[#087F8C]/20'
                        : 'bg-white dark:bg-[#101C2A] border-[#E2E8F0] dark:border-[#33485D] hover:bg-slate-50 dark:hover:bg-[#162638]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono font-semibold text-slate-800 dark:text-[#E8EEF5]">
                        {sess.sessionId}
                      </span>
                      <Badge variant={statusVariant} size="sm">
                        {sess.status}
                      </Badge>
                    </div>

                    <div className="text-sm font-semibold text-[#172033] dark:text-[#E8EEF5] truncate">
                      {sess.customerName || 'General Portfolio Governance'}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[#64748B] dark:text-[#8194A8] mt-2 pt-2 border-t border-slate-100 dark:border-[#33485D]">
                      <span>Origin: {sess.contextType}</span>
                      <span>{new Date(sess.createdAt).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                );
              })}

              {sessions.length === 0 && !isLoading && (
                <div className="p-6 text-center text-xs text-[#64748B] dark:text-[#8194A8]">
                  No agent sessions created yet. Click "New Agent Plan" to begin.
                </div>
              )}
            </div>
          </div>

          {/* Context Minimization Overview Box */}
          {activeSession?.context && (
            <div className="bg-white dark:bg-[#162638] border border-[#E2E8F0] dark:border-[#33485D] rounded-xl p-4 space-y-3 shadow-2xs">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-[#33485D]">
                <span className="text-xs font-bold uppercase tracking-wider text-[#475569] dark:text-[#A9BACB] flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  Authorized Context
                </span>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-300 px-1.5 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800">
                  Minimization Active
                </span>
              </div>

              <div className="p-3 rounded-lg bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#E2E8F0] dark:border-[#33485D] text-xs text-[#475569] dark:text-[#A9BACB] leading-relaxed">
                {activeSession.context.summary}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[11px] text-[#64748B]">CORE Score</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-base font-bold text-[#172033]">
                      {activeSession.context.recentScore}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.5 rounded font-semibold ${
                        activeSession.context.relationshipMomentum === 'DECLINING'
                          ? 'text-rose-700 bg-rose-50'
                          : 'text-emerald-700 bg-emerald-50'
                      }`}
                    >
                      {activeSession.context.relationshipMomentum}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[11px] text-[#64748B]">Open Tickets</span>
                  <div className="text-base font-bold text-amber-600 mt-0.5">
                    {activeSession.context.openCasesCount}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[11px] text-[#64748B]">Stalled Deals</span>
                  <div className="text-base font-bold text-slate-700 mt-0.5">
                    {activeSession.context.stalledOpportunitiesCount}
                  </div>
                </div>

                <div className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
                  <span className="text-[11px] text-[#64748B]">Active Signals</span>
                  <div className="text-base font-bold text-indigo-600 mt-0.5">
                    {activeSession.context.availableSignalsCount}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Governed Tool Allowlist Reference */}
          <div className="bg-white dark:bg-[#162638] border border-[#E2E8F0] dark:border-[#33485D] rounded-xl p-4 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#475569] dark:text-[#E8EEF5] mb-1.5 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-[#087F8C] dark:text-[#2dd4c7]" />
              Tool Governance Boundaries
            </h3>
            <p className="text-[11px] text-[#64748B] dark:text-[#8194A8] leading-relaxed mb-3">
              Only strictly allowlisted read tools & non-financial mutations are permissible. Fund transfers and automated credit approvals are permanently blocked.
            </p>
            <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">CREATE_TASK</span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">UPDATE_SERVICE_CASE</span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">CREATE_RELATIONSHIP_REVIEW</span>
              <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300">UPDATE_OPPORTUNITY</span>
              <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 line-through">TRANSFER_FUNDS</span>
              <span className="px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-300 line-through">APPROVE_LOAN</span>
            </div>
          </div>
        </div>

        {/* Right Column: Active Plan, Steps, Approval, & Execution (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-4 text-[#273444] dark:text-[#E8EEF5]">
          {activePlan ? (
            <>
              {/* Plan Card Header */}
              <div className="bg-white dark:bg-[#162638] border border-[#E2E8F0] dark:border-[#33485D] rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-xs font-mono text-[#087F8C] px-2 py-0.5 rounded bg-[#087F8C]/10 border border-[#087F8C]/20 font-semibold">
                        {activePlan.planId}
                      </span>
                      <span className="text-xs text-[#64748B] font-mono">v{activePlan.planVersion}</span>
                      <Badge
                        variant={
                          activePlan.status === 'COMPLETED'
                            ? 'success'
                            : activePlan.status === 'APPROVED'
                            ? 'info'
                            : activePlan.status === 'AWAITING_APPROVAL'
                            ? 'warning'
                            : 'neutral'
                        }
                        size="sm"
                      >
                        {activePlan.status}
                      </Badge>
                    </div>
                    <h2 className="text-lg md:text-xl font-bold text-[#172033]">
                      {activePlan.title}
                    </h2>
                  </div>

                  {/* Customer Quick Link */}
                  {activePlan.customerName && (
                    <div className="sm:text-right">
                      <span className="text-[11px] text-[#64748B] uppercase font-semibold block">Target Entity</span>
                      <button
                        onClick={() => onNavigateToCustomer && onNavigateToCustomer(activePlan.customerId)}
                        className="text-sm font-semibold text-[#087F8C] hover:underline flex items-center gap-1 sm:justify-end"
                      >
                        <User className="w-3.5 h-3.5" />
                        <span>{activePlan.customerName}</span>
                      </button>
                      <span className="text-xs font-mono text-[#64748B] block">
                        {activePlan.customerCode}
                      </span>
                    </div>
                  )}
                </div>

                {/* Objective & Rationale */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="md:col-span-2 p-3.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] space-y-1">
                    <span className="font-bold text-[#475569] uppercase tracking-wider text-[10px]">
                      Governed Objective
                    </span>
                    <p className="text-slate-800 leading-relaxed font-medium">
                      {activePlan.objective}
                    </p>
                    {activePlan.planRationale && (
                      <p className="text-[#64748B] text-[11px] pt-1.5 border-t border-slate-200">
                        {activePlan.planRationale}
                      </p>
                    )}
                  </div>

                  <div className="p-3.5 rounded-lg bg-emerald-50/50 border border-emerald-200/60 space-y-1">
                    <span className="font-bold text-emerald-800 uppercase tracking-wider text-[10px]">
                      Estimated Effect
                    </span>
                    <p className="text-emerald-900 font-medium leading-relaxed">
                      {activePlan.estimatedEffect || 'Positive stabilization based on deterministic simulation.'}
                    </p>
                  </div>
                </div>

                {/* Plan Basis: Decision Trace & Strategy Simulator Integration */}
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  <span className="text-[#475569] font-semibold">Plan Basis:</span>
                  {activePlan.decisionTraceId && (
                    <button
                      onClick={() => setSelectedTraceId(activePlan.decisionTraceId!)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 transition cursor-pointer text-xs font-medium"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Trace: {activePlan.decisionTraceId}</span>
                      <ExternalLink className="w-3 h-3 text-indigo-500" />
                    </button>
                  )}

                  {activePlan.scenarioId && (
                    <button
                      onClick={() => onNavigateToModule && onNavigateToModule('strategy-simulator')}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 transition cursor-pointer text-xs font-medium"
                    >
                      <Compass className="w-3.5 h-3.5 text-amber-600" />
                      <span>Scenario: {activePlan.scenarioId}</span>
                      <ExternalLink className="w-3 h-3 text-amber-600" />
                    </button>
                  )}
                </div>
              </div>

              {/* Steps List */}
              <div className="bg-white dark:bg-[#162638] border border-[#E2E8F0] dark:border-[#33485D] rounded-xl p-5 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                      Sequential Governed Execution Plan
                    </h3>
                    <Badge variant="neutral" size="sm">
                      {stepsCount} steps
                    </Badge>
                  </div>

                  {activePlan.status === 'AWAITING_APPROVAL' && (
                    <div className="text-xs text-[#64748B]">
                      Selected for Approval: <strong className="text-slate-900">{selectedCount}</strong> of {stepsCount}
                    </div>
                  )}
                </div>

                <div className="space-y-3">
                  {activePlan.steps.map((step) => {
                    const isChecked = !!selectedSteps[step.stepNumber];
                    const isMutating = step.requiresConfirmation;

                    return (
                      <div
                        key={step.stepNumber}
                        className={`p-3.5 rounded-lg border transition-all ${
                          step.status === 'COMPLETED'
                            ? 'bg-emerald-50/40 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
                            : step.status === 'EXECUTING'
                            ? 'bg-blue-50/50 dark:bg-blue-950/30 border-blue-300 dark:border-blue-700 ring-1 ring-blue-400/20'
                            : step.status === 'FAILED'
                            ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
                            : step.status === 'SKIPPED'
                            ? 'bg-slate-50 dark:bg-[#101C2A] border-slate-200 dark:border-[#33485D] text-slate-400 dark:text-slate-500'
                            : isChecked
                            ? 'bg-white dark:bg-[#192B3D] border-slate-300 dark:border-[#33485D] shadow-2xs'
                            : 'bg-slate-50/50 dark:bg-[#101C2A]/50 border-slate-200 dark:border-[#33485D] text-slate-500 dark:text-[#A9BACB]'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            {/* Checkbox for partial approval */}
                            {activePlan.status === 'AWAITING_APPROVAL' ? (
                              <button
                                onClick={() => handleToggleStep(step.stepNumber)}
                                className="mt-0.5 text-slate-400 hover:text-slate-800 transition cursor-pointer"
                                aria-label={`Toggle step ${step.stepNumber}`}
                              >
                                {isChecked ? (
                                  <CheckSquare className="w-4 h-4 text-[#087F8C]" />
                                ) : (
                                  <Square className="w-4 h-4 text-slate-400" />
                                )}
                              </button>
                            ) : (
                              <div className="mt-0.5">
                                {step.status === 'COMPLETED' ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                ) : step.status === 'EXECUTING' ? (
                                  <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
                                ) : step.status === 'FAILED' ? (
                                  <AlertCircle className="w-4 h-4 text-rose-600" />
                                ) : (
                                  <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[10px] text-slate-500 font-mono">
                                    {step.stepNumber}
                                  </div>
                                )}
                              </div>
                            )}

                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="text-xs font-mono font-bold text-slate-700">
                                  Step {String(step.stepNumber).padStart(2, '0')}
                                </span>
                                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-800 border border-slate-200">
                                  {step.actionType}
                                </span>
                                {isMutating ? (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-800 font-semibold">
                                    Mutation · Approval Required
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-semibold">
                                    Read-Only
                                  </span>
                                )}
                              </div>

                              <p className="text-xs font-medium text-slate-900">
                                {step.rationale}
                              </p>

                              {/* Dependencies & Parameters */}
                              <div className="flex flex-wrap items-center gap-2.5 mt-2 text-[11px] text-[#64748B]">
                                {step.targetEntityType && (
                                  <span>
                                    Target: <strong className="text-slate-800">{step.targetEntityType}</strong>
                                    {step.targetEntityId ? ` (#${step.targetEntityId})` : ''}
                                  </span>
                                )}

                                {step.dependsOnStepNumber && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-700 flex items-center gap-1 font-mono">
                                    <GitBranch className="w-3 h-3 text-slate-500" />
                                    Depends on Step {step.dependsOnStepNumber} ({step.dependencyPolicy})
                                  </span>
                                )}

                                <span>Permission: <code className="text-slate-800 bg-slate-100 px-1 py-0.5 rounded text-[10px] font-mono">{step.requiredPermission}</code></span>
                              </div>

                              {/* Completed Execution Result Summary */}
                              {step.resultSummary && (
                                <div className="mt-2.5 p-2 rounded-md bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between">
                                  <span>{step.resultSummary}</span>
                                  {step.auditLogId && (
                                    <span className="text-[10px] font-mono text-emerald-800 px-1.5 py-0.5 rounded bg-emerald-100 border border-emerald-300">
                                      Audit: #{step.auditLogId}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <Badge
                              variant={
                                step.status === 'COMPLETED'
                                  ? 'success'
                                  : step.status === 'AUTHORIZED'
                                  ? 'info'
                                  : step.status === 'EXECUTING'
                                  ? 'info'
                                  : step.status === 'FAILED'
                                  ? 'danger'
                                  : 'neutral'
                              }
                              size="sm"
                            >
                              {step.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Governed Action Controls Bar */}
                <div className="pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-[#64748B]">
                    Status: <strong className="text-slate-900">{activePlan.status}</strong>
                    {activePlan.approvedAt && ` · Authorized on ${new Date(activePlan.approvedAt).toLocaleTimeString('en-IN')}`}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Awaiting Approval Controls */}
                    {activePlan.status === 'AWAITING_APPROVAL' && (
                      <>
                        <Button
                          variant="danger"
                          size="sm"
                          onClick={handleRejectPlan}
                        >
                          Reject Plan
                        </Button>
                        {selectedCount < stepsCount && selectedCount > 0 && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleApprovePlan(true)}
                          >
                            Approve Selected ({selectedCount} Steps)
                          </Button>
                        )}
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleApprovePlan(false)}
                          icon={<ShieldCheck className="w-4 h-4" />}
                        >
                          Approve Full Plan
                        </Button>
                      </>
                    )}

                    {/* Approved / Execution Controls */}
                    {activePlan.status === 'APPROVED' && (
                      <Button
                        variant="primary"
                        size="md"
                        onClick={handleExecutePlan}
                        disabled={isExecuting}
                        icon={isExecuting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                      >
                        {isExecuting ? 'Executing Governed Sequence...' : 'Execute Governed Sequence'}
                      </Button>
                    )}

                    {/* Completed Controls */}
                    {(activePlan.status === 'COMPLETED' || activePlan.status === 'PARTIALLY_COMPLETED') && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowNewPlanModal(true)}
                        icon={<Plus className="w-3.5 h-3.5 text-[#087F8C]" />}
                      >
                        Create Follow-up Plan
                      </Button>
                    )}
                  </div>
                </div>
              </div>

              {/* Execution Outcome Report Card */}
              {executionReport && (
                <div className="bg-white dark:bg-[#162638] border border-emerald-300 dark:border-emerald-800 rounded-xl p-5 shadow-sm space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                      <h3 className="text-sm font-bold text-slate-900">
                        Agent Governed Execution Report
                      </h3>
                    </div>
                    <Badge variant="success" size="sm">
                      {executionReport.status}
                    </Badge>
                  </div>

                  <p className="text-xs text-[#475569]">
                    {executionReport.summary}
                  </p>

                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="p-3 rounded-lg bg-emerald-50/50 border border-emerald-200">
                      <span className="text-emerald-800 font-medium">Completed</span>
                      <div className="text-lg font-bold text-emerald-900 font-mono">
                        {executionReport.completedStepsCount}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <span className="text-slate-600 font-medium">Skipped</span>
                      <div className="text-lg font-bold text-slate-800 font-mono">
                        {executionReport.skippedStepsCount}
                      </div>
                    </div>
                    <div className="p-3 rounded-lg bg-rose-50 border border-rose-200">
                      <span className="text-rose-800 font-medium">Failed</span>
                      <div className="text-lg font-bold text-rose-900 font-mono">
                        {executionReport.failedStepsCount}
                      </div>
                    </div>
                  </div>

                  {executionReport.auditReferences?.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                        Immutable Audit References
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {executionReport.auditReferences.map((ref: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-2.5 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between text-slate-800"
                          >
                            <span className="text-xs font-medium">Step {ref.stepNumber}: {ref.action}</span>
                            <span className="font-mono text-[10px] text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200">
                              AUD-#{ref.auditLogId}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="bg-white dark:bg-[#162638] border border-[#E2E8F0] dark:border-[#33485D] rounded-xl p-8 text-center shadow-2xs">
              <EmptyState
                icon={<ShieldAlert className="w-5 h-5 text-[#087F8C]" />}
                title="No Active Governed Plan Selected"
                description="Select a recorded session from the left sidebar or draft a new governed multi-step plan to initiate dual-control workflow orchestration."
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => setShowNewPlanModal(true)}
                    icon={<Plus className="w-3.5 h-3.5" />}
                  >
                    Draft Governed Plan
                  </Button>
                }
              />
            </div>
          )}
        </div>
      </div>

      {/* Decision Trace Detail Modal */}
      {selectedTraceId && (
        <Dialog
          isOpen={!!selectedTraceId}
          onClose={() => setSelectedTraceId(null)}
          title={
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              <span>Plan Basis: Decision Trace</span>
            </div>
          }
          subtitle={`Cryptographic trace ID: ${selectedTraceId}`}
          size="4xl"
        >
          <div className="p-1">
            <DecisionTracePanel initialTraceId={selectedTraceId} />
          </div>
        </Dialog>
      )}

      {/* New Agent Plan Drafting Modal */}
      {showNewPlanModal && (
        <Dialog
          isOpen={showNewPlanModal}
          onClose={() => setShowNewPlanModal(false)}
          title={
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-[#087F8C]" />
              <span>Draft Governed Agent Plan</span>
            </div>
          }
          subtitle="Generate a multi-step structured proposal for human authorization"
          size="lg"
          footerActions={
            <div className="flex items-center justify-end gap-2 w-full">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowNewPlanModal(false)}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCreateDraftPlan}
                disabled={isSubmittingDraft || !newPlanTitle.trim() || !newPlanObjective.trim()}
              >
                {isSubmittingDraft ? 'Generating Draft...' : 'Generate Plan Draft'}
              </Button>
            </div>
          }
        >
          <div className="space-y-4 text-xs py-2 text-[#273444] dark:text-[#E8EEF5]">
            <div>
              <label className="block text-slate-700 dark:text-[#A9BACB] font-semibold mb-1">
                Customer ID / Target CIF
              </label>
              <input
                type="number"
                value={newPlanCustomer}
                onChange={(e) => setNewPlanCustomer(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#101C2A] border border-slate-300 dark:border-[#33485D] text-slate-900 dark:text-[#E8EEF5] focus:outline-none focus:border-[#087F8C] font-mono text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-[#A9BACB] font-semibold mb-1">
                Plan Title
              </label>
              <input
                type="text"
                placeholder="e.g. Rahul Sharma Relationship Recovery Plan"
                value={newPlanTitle}
                onChange={(e) => setNewPlanTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#101C2A] border border-slate-300 dark:border-[#33485D] text-slate-900 dark:text-[#E8EEF5] focus:outline-none focus:border-[#087F8C] text-xs"
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-[#A9BACB] font-semibold mb-1">
                Business Objective
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Clear service friction ticket, schedule executive relationship review, and unblock stalled loan facility."
                value={newPlanObjective}
                onChange={(e) => setNewPlanObjective(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-white dark:bg-[#101C2A] border border-slate-300 dark:border-[#33485D] text-slate-900 dark:text-[#E8EEF5] focus:outline-none focus:border-[#087F8C] text-xs leading-relaxed"
              />
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] text-[#475569] dark:text-[#A9BACB] text-[11px] leading-relaxed">
              <strong className="text-slate-800 dark:text-[#E8EEF5]">Governance Notice:</strong> Creating a plan produces a structured draft with dependency validation. No database mutations will occur until you explicitly authorize the plan steps.
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
};
