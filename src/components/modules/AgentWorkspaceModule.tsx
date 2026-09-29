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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 lg:p-8 space-y-6">
      {/* Alert Banner */}
      {actionNotice && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border text-sm animate-in fade-in slide-in-from-top-2 ${
            actionNotice.type === 'success'
              ? 'bg-emerald-950/60 border-emerald-500/40 text-emerald-200'
              : actionNotice.type === 'error'
              ? 'bg-rose-950/60 border-rose-500/40 text-rose-200'
              : 'bg-blue-950/60 border-blue-500/40 text-blue-200'
          }`}
        >
          <div className="flex items-center gap-3">
            {actionNotice.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            ) : actionNotice.type === 'error' ? (
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
            ) : (
              <Info className="w-5 h-5 text-blue-400 shrink-0" />
            )}
            <span>{actionNotice.message}</span>
          </div>
          <button
            onClick={() => setActionNotice(null)}
            className="text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">
                  Controlled Banking Agent
                </h1>
                <span className="px-2 py-0.5 text-xs font-semibold rounded-full bg-emerald-950 border border-emerald-500/40 text-emerald-400">
                  Dual-Control Governed
                </span>
              </div>
              <p className="text-xs md:text-sm text-slate-400 mt-0.5">
                Sequential workflow orchestration with strict human approval gates & transaction verification.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Governance Sequence Badge */}
          <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-[11px] font-mono text-slate-400">
            <span className="text-slate-200 font-bold">PLAN</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-slate-200 font-bold">EXPLAIN</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-slate-200 font-bold">ASK</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-emerald-400 font-bold">AUTHORIZE</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-blue-400 font-bold">EXECUTE</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-slate-200 font-bold">VERIFY</span>
            <ChevronRight className="w-3 h-3 text-slate-600" />
            <span className="text-slate-200 font-bold">REPORT</span>
          </div>

          <button
            onClick={() => setShowNewPlanModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-400" />
            New Agent Plan
          </button>

          <button
            onClick={loadInitialData}
            className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white border border-slate-800 transition"
            title="Refresh Sessions & Plans"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Main Grid: Sessions Sidebar + Plan Detail Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Sessions & Historical Runs (4 cols on lg) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <History className="w-3.5 h-3.5 text-slate-400" />
                Governed Sessions
              </h2>
              <span className="text-xs font-mono text-slate-500">{sessions.length} recorded</span>
            </div>

            <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
              {sessions.map((sess) => {
                const isSelected = activeSession?.id === sess.id;
                const statusColor =
                  sess.status === 'COMPLETED'
                    ? 'bg-emerald-950 border-emerald-500/30 text-emerald-400'
                    : sess.status === 'AWAITING_APPROVAL'
                    ? 'bg-amber-950 border-amber-500/30 text-amber-300'
                    : sess.status === 'EXECUTING'
                    ? 'bg-blue-950 border-blue-500/30 text-blue-300 animate-pulse'
                    : 'bg-slate-800 border-slate-700 text-slate-400';

                return (
                  <div
                    key={sess.id}
                    onClick={() => handleSelectSession(sess)}
                    className={`p-3 rounded-xl border text-left cursor-pointer transition ${
                      isSelected
                        ? 'bg-slate-800/90 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                        : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-850 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-mono font-medium text-slate-300">
                        {sess.sessionId}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${statusColor}`}>
                        {sess.status}
                      </span>
                    </div>

                    <div className="text-sm font-semibold text-white truncate">
                      {sess.customerName || 'General Portfolio Governance'}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 pt-2 border-t border-slate-800/60">
                      <span>Origin: {sess.contextType}</span>
                      <span>{new Date(sess.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                );
              })}

              {sessions.length === 0 && !isLoading && (
                <div className="p-6 text-center text-xs text-slate-500">
                  No agent sessions created yet. Click "New Agent Plan" to begin.
                </div>
              )}
            </div>
          </div>

          {/* Context Minimization Overview Box */}
          {activeSession?.context && (
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Database className="w-3.5 h-3.5 text-indigo-400" />
                  Authorized Context
                </span>
                <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-950/60 border border-emerald-500/30">
                  Minimization Active
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300">
                {activeSession.context.summary}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <span className="text-[11px] text-slate-400">CORE Score</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-base font-bold text-white">
                      {activeSession.context.recentScore}
                    </span>
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                        activeSession.context.relationshipMomentum === 'DECLINING'
                          ? 'text-rose-400 bg-rose-950/60'
                          : 'text-emerald-400 bg-emerald-950/60'
                      }`}
                    >
                      {activeSession.context.relationshipMomentum}
                    </span>
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <span className="text-[11px] text-slate-400">Open Tickets</span>
                  <div className="text-base font-bold text-amber-400 mt-0.5">
                    {activeSession.context.openCasesCount}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <span className="text-[11px] text-slate-400">Stalled Deals</span>
                  <div className="text-base font-bold text-slate-200 mt-0.5">
                    {activeSession.context.stalledOpportunitiesCount}
                  </div>
                </div>

                <div className="p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80">
                  <span className="text-[11px] text-slate-400">Active Signals</span>
                  <div className="text-base font-bold text-indigo-400 mt-0.5">
                    {activeSession.context.availableSignalsCount}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Governed Tool Allowlist Quick Reference */}
          <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-400" />
              Tool Governance Boundaries
            </h3>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Only strictly allowlisted read tools & non-financial mutations are permissible. Fund transfers and automated credit approvals are permanently blocked.
            </p>
            <div className="flex flex-wrap gap-1.5 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/30 text-emerald-300">CREATE_TASK</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/30 text-emerald-300">UPDATE_SERVICE_CASE</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/30 text-emerald-300">CREATE_RELATIONSHIP_REVIEW</span>
              <span className="px-2 py-0.5 rounded bg-emerald-950/50 border border-emerald-500/30 text-emerald-300">UPDATE_OPPORTUNITY</span>
              <span className="px-2 py-0.5 rounded bg-rose-950/60 border border-rose-500/30 text-rose-300 line-through">TRANSFER_FUNDS</span>
              <span className="px-2 py-0.5 rounded bg-rose-950/60 border border-rose-500/30 text-rose-300 line-through">APPROVE_LOAN</span>
            </div>
          </div>
        </div>

        {/* Right Column: Active Plan, Steps, Approval, & Execution (8 cols on lg) */}
        <div className="lg:col-span-8 space-y-4">
          {activePlan ? (
            <>
              {/* Plan Card Header */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-mono text-emerald-400 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/30 font-semibold">
                        {activePlan.planId}
                      </span>
                      <span className="text-xs text-slate-400 font-mono">v{activePlan.planVersion}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full border font-semibold ${
                          activePlan.status === 'COMPLETED'
                            ? 'bg-emerald-950 border-emerald-500/40 text-emerald-300'
                            : activePlan.status === 'APPROVED'
                            ? 'bg-indigo-950 border-indigo-500/40 text-indigo-300'
                            : activePlan.status === 'AWAITING_APPROVAL'
                            ? 'bg-amber-950 border-amber-500/40 text-amber-300'
                            : activePlan.status === 'EXECUTING'
                            ? 'bg-blue-950 border-blue-500/40 text-blue-300 animate-pulse'
                            : 'bg-slate-800 border-slate-700 text-slate-300'
                        }`}
                      >
                        {activePlan.status}
                      </span>
                    </div>
                    <h2 className="text-lg md:text-xl font-bold text-white">
                      {activePlan.title}
                    </h2>
                  </div>

                  {/* Customer Quick Link */}
                  {activePlan.customerName && (
                    <div className="text-right sm:text-right">
                      <span className="text-[11px] text-slate-400 uppercase font-semibold">Target Entity</span>
                      <div className="text-sm font-semibold text-white">
                        {activePlan.customerName}
                      </div>
                      <span className="text-xs font-mono text-slate-400">
                        {activePlan.customerCode}
                      </span>
                    </div>
                  )}
                </div>

                {/* Objective & Rationale */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="md:col-span-2 p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                      Governed Objective
                    </span>
                    <p className="text-slate-200 leading-relaxed font-medium">
                      {activePlan.objective}
                    </p>
                    {activePlan.planRationale && (
                      <p className="text-slate-400 text-[11px] pt-1 border-t border-slate-800/60">
                        {activePlan.planRationale}
                      </p>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-1">
                    <span className="font-semibold text-slate-400 uppercase tracking-wider text-[10px]">
                      Estimated Effect
                    </span>
                    <p className="text-emerald-400 font-medium leading-relaxed">
                      {activePlan.estimatedEffect || 'Positive stabilization based on deterministic simulation.'}
                    </p>
                  </div>
                </div>

                {/* Plan Basis: Decision Trace & Strategy Simulator Integration */}
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  <span className="text-slate-400 font-semibold">Plan Basis:</span>
                  {activePlan.decisionTraceId && (
                    <button
                      onClick={() => setSelectedTraceId(activePlan.decisionTraceId!)}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-950/60 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-900/60 transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
                      Trace: {activePlan.decisionTraceId}
                      <ExternalLink className="w-3 h-3 text-indigo-400" />
                    </button>
                  )}

                  {activePlan.scenarioId && (
                    <button
                      onClick={() => onNavigateToModule && onNavigateToModule('strategy-simulator')}
                      className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-950/60 border border-amber-500/40 text-amber-300 hover:bg-amber-900/60 transition"
                    >
                      <Compass className="w-3.5 h-3.5 text-amber-400" />
                      Scenario: {activePlan.scenarioId}
                      <ExternalLink className="w-3 h-3 text-amber-400" />
                    </button>
                  )}
                </div>
              </div>

              {/* Steps List */}
              <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-slate-200">
                      Sequential Governed Execution Plan
                    </h3>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                      {stepsCount} steps
                    </span>
                  </div>

                  {activePlan.status === 'AWAITING_APPROVAL' && (
                    <div className="text-xs text-slate-400">
                      Selected for Approval: <span className="font-bold text-white">{selectedCount}</span> of {stepsCount}
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
                        className={`p-4 rounded-xl border transition ${
                          step.status === 'COMPLETED'
                            ? 'bg-slate-950/90 border-emerald-500/30'
                            : step.status === 'EXECUTING'
                            ? 'bg-blue-950/40 border-blue-500/50 ring-1 ring-blue-500/20'
                            : step.status === 'FAILED'
                            ? 'bg-rose-950/40 border-rose-500/40'
                            : step.status === 'SKIPPED'
                            ? 'bg-slate-950/40 border-slate-800 text-slate-500'
                            : isChecked
                            ? 'bg-slate-950/80 border-slate-700'
                            : 'bg-slate-950/40 border-slate-850 text-slate-500'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            {/* Checkbox for partial approval */}
                            {activePlan.status === 'AWAITING_APPROVAL' ? (
                              <button
                                onClick={() => handleToggleStep(step.stepNumber)}
                                className="mt-0.5 text-slate-400 hover:text-white transition"
                              >
                                {isChecked ? (
                                  <CheckSquare className="w-5 h-5 text-emerald-400" />
                                ) : (
                                  <Square className="w-5 h-5 text-slate-600" />
                                )}
                              </button>
                            ) : (
                              <div className="mt-0.5">
                                {step.status === 'COMPLETED' ? (
                                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                                ) : step.status === 'EXECUTING' ? (
                                  <RefreshCw className="w-5 h-5 text-blue-400 animate-spin" />
                                ) : step.status === 'FAILED' ? (
                                  <AlertCircle className="w-5 h-5 text-rose-400" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full border border-slate-700 flex items-center justify-center text-[10px] text-slate-500">
                                    {step.stepNumber}
                                  </div>
                                )}
                              </div>
                            )}

                            <div>
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="text-xs font-mono font-bold text-slate-400">
                                  Step {String(step.stepNumber).padStart(2, '0')}
                                </span>
                                <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                                  {step.actionType}
                                </span>
                                {isMutating ? (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-950/60 border border-amber-500/30 text-amber-300 font-semibold">
                                    Mutation · Approval Required
                                  </span>
                                ) : (
                                  <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 font-semibold">
                                    Read-Only
                                  </span>
                                )}
                              </div>

                              <p className="text-sm font-medium text-slate-100">
                                {step.rationale}
                              </p>

                              {/* Dependencies & Parameters */}
                              <div className="flex flex-wrap items-center gap-2 mt-2 text-[11px] text-slate-400">
                                {step.targetEntityType && (
                                  <span>
                                    Target: <strong className="text-slate-300">{step.targetEntityType}</strong>
                                    {step.targetEntityId ? ` (#${step.targetEntityId})` : ''}
                                  </span>
                                )}

                                {step.dependsOnStepNumber && (
                                  <span className="px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-300 flex items-center gap-1 font-mono">
                                    <GitBranch className="w-3 h-3 text-slate-400" />
                                    Depends on Step {step.dependsOnStepNumber} ({step.dependencyPolicy})
                                  </span>
                                )}

                                <span>Permission: <code className="text-slate-300">{step.requiredPermission}</code></span>
                              </div>

                              {/* Completed Execution Result Summary */}
                              {step.resultSummary && (
                                <div className="mt-2.5 p-2 rounded-lg bg-emerald-950/30 border border-emerald-500/30 text-xs text-emerald-300 flex items-center justify-between">
                                  <span>{step.resultSummary}</span>
                                  {step.auditLogId && (
                                    <span className="text-[10px] font-mono text-emerald-400 px-1.5 py-0.5 rounded bg-emerald-950 border border-emerald-500/40">
                                      Audit: #{step.auditLogId}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span
                              className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                                step.status === 'COMPLETED'
                                  ? 'bg-emerald-950 border-emerald-500/40 text-emerald-300'
                                  : step.status === 'AUTHORIZED'
                                  ? 'bg-indigo-950 border-indigo-500/40 text-indigo-300'
                                  : step.status === 'EXECUTING'
                                  ? 'bg-blue-950 border-blue-500/40 text-blue-300'
                                  : step.status === 'FAILED'
                                  ? 'bg-rose-950 border-rose-500/40 text-rose-300'
                                  : step.status === 'SKIPPED'
                                  ? 'bg-slate-800 border-slate-700 text-slate-500'
                                  : 'bg-slate-900 border-slate-800 text-slate-400'
                              }`}
                            >
                              {step.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Governed Action Controls Bar */}
                <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
                  <div className="text-xs text-slate-400">
                    Status: <strong className="text-white">{activePlan.status}</strong>
                    {activePlan.approvedAt && ` · Authorized on ${new Date(activePlan.approvedAt).toLocaleTimeString()}`}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {/* Awaiting Approval Controls */}
                    {activePlan.status === 'AWAITING_APPROVAL' && (
                      <>
                        <button
                          onClick={handleRejectPlan}
                          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-rose-950/60 hover:bg-rose-900/60 text-rose-300 border border-rose-500/40 transition"
                        >
                          Reject Plan
                        </button>
                        {selectedCount < stepsCount && selectedCount > 0 && (
                          <button
                            onClick={() => handleApprovePlan(true)}
                            className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition shadow-sm"
                          >
                            Approve Selected ({selectedCount} Steps)
                          </button>
                        )}
                        <button
                          onClick={() => handleApprovePlan(false)}
                          className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-md shadow-emerald-950/50"
                        >
                          <ShieldCheck className="w-4 h-4" />
                          Approve Full Plan
                        </button>
                      </>
                    )}

                    {/* Approved / Execution Controls */}
                    {activePlan.status === 'APPROVED' && (
                      <button
                        onClick={handleExecutePlan}
                        disabled={isExecuting}
                        className="flex items-center gap-2 px-5 py-2 text-xs font-bold rounded-lg bg-blue-600 hover:bg-blue-500 text-white transition shadow-md shadow-blue-950/50 disabled:opacity-50"
                      >
                        {isExecuting ? (
                          <>
                            <RefreshCw className="w-4 h-4 animate-spin" />
                            Executing Governed Sequence...
                          </>
                        ) : (
                          <>
                            <Play className="w-4 h-4 fill-white" />
                            Execute Governed Sequence
                          </>
                        )}
                      </button>
                    )}

                    {/* Completed Controls */}
                    {(activePlan.status === 'COMPLETED' || activePlan.status === 'PARTIALLY_COMPLETED') && (
                      <button
                        onClick={() => setShowNewPlanModal(true)}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
                      >
                        <Plus className="w-4 h-4 text-emerald-400" />
                        Create Follow-up Plan
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Execution Outcome Report Card */}
              {executionReport && (
                <div className="bg-slate-900/90 border border-emerald-500/40 rounded-2xl p-5 shadow-lg space-y-4 animate-in fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                      <h3 className="text-base font-bold text-white">
                        Agent Governed Execution Report
                      </h3>
                    </div>
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-500/30">
                      {executionReport.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300">
                    {executionReport.summary}
                  </p>

                  <div className="grid grid-cols-3 gap-3 text-center text-xs">
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Completed</span>
                      <div className="text-lg font-bold text-emerald-400">
                        {executionReport.completedStepsCount}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Skipped</span>
                      <div className="text-lg font-bold text-slate-400">
                        {executionReport.skippedStepsCount}
                      </div>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                      <span className="text-slate-400">Failed</span>
                      <div className="text-lg font-bold text-rose-400">
                        {executionReport.failedStepsCount}
                      </div>
                    </div>
                  </div>

                  {executionReport.auditReferences?.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Immutable Audit References
                      </span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                        {executionReport.auditReferences.map((ref: any, idx: number) => (
                          <div
                            key={idx}
                            className="p-2 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-slate-300"
                          >
                            <span>Step {ref.stepNumber}: {ref.action}</span>
                            <span className="font-mono text-[10px] text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-500/30">
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
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-12 text-center space-y-4">
              <ShieldAlert className="w-12 h-12 text-slate-600 mx-auto" />
              <h3 className="text-base font-semibold text-white">No Active Plan Selected</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto">
                Select a session from the left sidebar or draft a new governed multi-step plan to begin.
              </p>
              <button
                onClick={() => setShowNewPlanModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Draft Governed Plan
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Decision Trace Detail Drawer / Modal */}
      {selectedTraceId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-indigo-400" />
                <h3 className="text-lg font-bold text-white">Plan Basis: Decision Trace</h3>
              </div>
              <button
                onClick={() => setSelectedTraceId(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <DecisionTracePanel initialTraceId={selectedTraceId} />
          </div>
        </div>
      )}

      {/* New Agent Plan Drafting Modal */}
      {showNewPlanModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-bold text-white">Draft Governed Agent Plan</h3>
              </div>
              <button
                onClick={() => setShowNewPlanModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Customer ID / Target CIF
                </label>
                <input
                  type="number"
                  value={newPlanCustomer}
                  onChange={(e) => setNewPlanCustomer(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Plan Title
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma Relationship Recovery Plan"
                  value={newPlanTitle}
                  onChange={(e) => setNewPlanTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  Business Objective
                </label>
                <textarea
                  rows={3}
                  placeholder="e.g. Clear service friction ticket, schedule executive relationship review, and unblock stalled loan facility."
                  value={newPlanObjective}
                  onChange={(e) => setNewPlanObjective(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-slate-400 text-[11px] leading-relaxed">
                <strong className="text-slate-200">Governance Notice:</strong> Creating a plan produces a structured draft with dependency validation. No database mutations will occur until you explicitly authorize the plan steps.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowNewPlanModal(false)}
                className="px-3.5 py-1.5 text-xs text-slate-400 hover:text-white transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateDraftPlan}
                disabled={isSubmittingDraft || !newPlanTitle.trim() || !newPlanObjective.trim()}
                className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50"
              >
                {isSubmittingDraft ? 'Generating Draft...' : 'Generate Plan Draft'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
