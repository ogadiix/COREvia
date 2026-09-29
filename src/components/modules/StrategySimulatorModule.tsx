import React, { useState, useEffect, useMemo } from 'react';
import {
  Sparkles,
  Play,
  RotateCcw,
  Save,
  Archive,
  GitCompare,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  ShieldAlert,
  ShieldCheck,
  Plus,
  Trash2,
  Clock,
  Layers,
  FileText,
  UserCheck,
  ChevronRight,
  Compass,
  Zap,
} from 'lucide-react';
import { bankingApi } from '../../lib/api';
import {
  StrategyScenarioDTO,
  StrategySimulationResultDTO,
  ScenarioActionItem,
  ScenarioActionType,
  RelationshipStateSnapshot,
} from '../../types/strategySimulator.types';
import { ScenarioComparisonModal } from '../simulator/ScenarioComparisonModal';
import { ApplyActionConfirmationModal } from '../simulator/ApplyActionConfirmationModal';
import { DecisionTracePanel } from '../decision-trace/DecisionTracePanel';

interface StrategySimulatorModuleProps {
  initialCustomerId?: number;
  initialScenarioId?: string;
  onNavigateToCustomer?: (customerId: number) => void;
}

const ACTION_CATALOG: Array<{
  type: ScenarioActionType;
  label: string;
  category: string;
  defaultEntity?: string;
  description: string;
}> = [
  {
    type: 'RESOLVE_SERVICE_CASE',
    label: 'Resolve Active Service Issue',
    category: 'Service Recovery',
    description: 'Simulates clearing active high-priority ticket dispute to restore service health.',
  },
  {
    type: 'SCHEDULE_RELATIONSHIP_REVIEW',
    label: 'Schedule Annual Relationship Review',
    category: 'Relationship Governance',
    description: 'Adds calendar governance cadence to re-engage client leadership.',
  },
  {
    type: 'FOLLOW_UP_OPPORTUNITY',
    label: 'Follow Up Stalled Opportunity',
    category: 'Commercial Pipeline',
    description: 'Proactively contacts customer to unfreeze proposal/negotiation stage.',
  },
  {
    type: 'COMPLETE_COMMITMENT',
    label: 'Complete Overdue Banker Commitment',
    category: 'Relationship Credibility',
    description: 'Fulfills pending deliverables (e.g. customized wealth statement or advisory doc).',
  },
  {
    type: 'COMPLETE_TASK',
    label: 'Complete Operational Task',
    category: 'Operational Backlog',
    description: 'Clears overdue operational checklist items.',
  },
  {
    type: 'LOG_RELATIONSHIP_INTERACTION',
    label: 'Log In-Person Meeting / Call',
    category: 'Touchpoints',
    description: 'Resets contact recency gap to 0 days via direct branch or executive outreach.',
  },
  {
    type: 'INCREASE_ENGAGEMENT_ACTIVITY',
    label: 'Increase Relationship Touchpoint Cadence',
    category: 'Touchpoints',
    description: 'Augments monthly touchpoint frequency to lift overall engagement index.',
  },
  {
    type: 'ACTIVATE_EXISTING_PRODUCT_OPPORTUNITY',
    label: 'Activate Existing Product Opportunity',
    category: 'Commercial Pipeline',
    description: 'Simulates expansion of relationship product depth (e.g. sweep FD or trade line).',
  },
];

export const StrategySimulatorModule: React.FC<StrategySimulatorModuleProps> = ({
  initialCustomerId = 1,
  initialScenarioId,
  onNavigateToCustomer,
}) => {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(initialCustomerId);
  const [customersList, setCustomersList] = useState<any[]>([]);
  const [scenariosList, setScenariosList] = useState<StrategyScenarioDTO[]>([]);
  const [selectedScenario, setSelectedScenario] = useState<StrategyScenarioDTO | null>(null);

  // Base snapshot & builder state
  const [baseSnapshot, setBaseSnapshot] = useState<RelationshipStateSnapshot | null>(null);
  const [scenarioName, setScenarioName] = useState('Custom Strategy Scenario');
  const [scenarioDescription, setScenarioDescription] = useState('');
  const [configuredActions, setConfiguredActions] = useState<ScenarioActionItem[]>([
    {
      actionType: 'RESOLVE_SERVICE_CASE',
      orderIndex: 0,
      label: 'Resolve Ticket #SR-4921',
      description: 'Clear UPI dispute',
    },
    {
      actionType: 'SCHEDULE_RELATIONSHIP_REVIEW',
      orderIndex: 1,
      label: 'Schedule Annual Review',
      description: 'Calendar proactive governance session',
    },
  ]);

  // Simulation result state
  const [simulationResult, setSimulationResult] = useState<StrategySimulationResultDTO | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals state
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [compareTargetId, setCompareTargetId] = useState<string>('');
  const [comparisonData, setComparisonData] = useState<any>(null);
  const [comparing, setComparing] = useState(false);

  const [isApplyActionOpen, setIsApplyActionOpen] = useState(false);
  const [actionToApply, setActionToApply] = useState<{ action: ScenarioActionItem; index: number } | null>(null);
  const [applyingAction, setApplyingAction] = useState(false);

  const [activeTraceId, setActiveTraceId] = useState<string | null>(null);

  // Load customer profiles
  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await bankingApi.getCustomers({ limit: 10 });
        if (res?.data) {
          setCustomersList(res.data);
        }
      } catch (err) {
        console.error('Failed to load customers for simulator:', err);
      }
    }
    loadCustomers();
  }, []);

  // Load scenarios & base snapshot when customer changes
  useEffect(() => {
    async function loadCustomerData() {
      try {
        // Fetch saved scenarios
        const scenarios = await bankingApi.getCustomerStrategyScenarios(selectedCustomerId);
        setScenariosList(scenarios || []);

        // Fetch ad-hoc baseline snapshot by running empty simulation
        const adhoc = await bankingApi.simulateAdhocStrategy({
          customerId: selectedCustomerId,
          actions: [],
        });
        if (adhoc?.data?.baseSnapshot) {
          setBaseSnapshot(adhoc.data.baseSnapshot);
        }

        // If specific scenario requested or available
        if (initialScenarioId) {
          const match = scenarios?.find((s: any) => s.scenarioId === initialScenarioId || s.id === Number(initialScenarioId));
          if (match) loadScenarioIntoBuilder(match);
        } else if (scenarios && scenarios.length > 0) {
          loadScenarioIntoBuilder(scenarios[0]);
        }
      } catch (err) {
        console.error('Failed to load strategy customer baseline:', err);
      }
    }
    loadCustomerData();
  }, [selectedCustomerId]);

  const loadScenarioIntoBuilder = (sc: StrategyScenarioDTO) => {
    setSelectedScenario(sc);
    setScenarioName(sc.name);
    setScenarioDescription(sc.description || '');
    setConfiguredActions(sc.actions || []);
    if (sc.resultSnapshot && sc.comparisons) {
      setSimulationResult({
        scenarioId: sc.scenarioId,
        customerId: sc.customerId,
        customerName: sc.customerName || 'Customer',
        customerCode: sc.customerCode || 'CUS-10482',
        baseSnapshot: sc.baseSnapshot,
        simulatedSnapshot: sc.resultSnapshot,
        comparisons: sc.comparisons,
        intermediateSteps: [],
        whyFactors: sc.comparisons
          .filter((c) => c.changeType !== 'UNCHANGED')
          .map((c) => ({
            factor: c.explanation,
            engine: c.sourceEngine,
            impact: c.changeType === 'IMPROVED' ? 'POSITIVE' : 'NEGATIVE',
          })),
        sourceRules: [
          'CORE Score Engine (v4.2.1)',
          'Relationship Intelligence Engine',
          'Service Desk SLA Tracker',
        ],
        limitations: [
          'Simulation based on deterministic COREvia rules. It does not predict customer behaviour.',
        ],
        decisionTraceId: sc.decisionTraceId,
        simulatedAt: sc.updatedAt,
        isSimulation: true,
        simulationDisclaimer:
          'SIMULATION — NOT PRODUCTION DATA. Deterministic impact based on currently available COREvia relationship data and rules.',
      });
    }
  };

  const handleAddAction = (actType: ScenarioActionType) => {
    const catalogItem = ACTION_CATALOG.find((a) => a.type === actType);
    const newAction: ScenarioActionItem = {
      actionType: actType,
      orderIndex: configuredActions.length,
      label: catalogItem?.label || actType,
      description: catalogItem?.description,
    };
    setConfiguredActions([...configuredActions, newAction]);
  };

  const handleRemoveAction = (index: number) => {
    const updated = configuredActions.filter((_, idx) => idx !== index);
    setConfiguredActions(updated.map((act, i) => ({ ...act, orderIndex: i })));
  };

  const handleRunSimulation = async () => {
    setSimulating(true);
    setNotificationMsg(null);
    try {
      const res = await bankingApi.simulateAdhocStrategy({
        customerId: selectedCustomerId,
        actions: configuredActions,
        scenarioName,
        description: scenarioDescription,
      });

      if (res?.data) {
        setSimulationResult(res.data);
        setNotificationMsg({
          type: 'success',
          text: `Simulation computed successfully: ${res.data.comparisons.filter((c: any) => c.changeType === 'IMPROVED').length} projected metric improvements.`,
        });
      }
    } catch (err: any) {
      setNotificationMsg({
        type: 'error',
        text: err?.message || 'Failed to execute deterministic simulation.',
      });
    } finally {
      setSimulating(false);
    }
  };

  const handleSaveScenario = async () => {
    setSaving(true);
    try {
      const payload = {
        customerId: selectedCustomerId,
        name: scenarioName,
        description: scenarioDescription,
        actions: configuredActions,
        autoSimulate: true,
      };

      const res = await bankingApi.createStrategyScenario(payload);
      if (res?.data) {
        await bankingApi.saveStrategyScenario(res.data.id);
        const refreshed = await bankingApi.getCustomerStrategyScenarios(selectedCustomerId);
        setScenariosList(refreshed || []);
        setNotificationMsg({
          type: 'success',
          text: `Scenario '${scenarioName}' saved to strategy library (${res.data.scenarioId}).`,
        });
      }
    } catch (err: any) {
      setNotificationMsg({
        type: 'error',
        text: err?.message || 'Failed to save scenario.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleOpenCompare = async (targetScenarioId?: string) => {
    if (!simulationResult?.scenarioId && !selectedScenario?.scenarioId) {
      setNotificationMsg({ type: 'error', text: 'Run or select a scenario first to compare.' });
      return;
    }

    const baseId = selectedScenario?.scenarioId || simulationResult?.scenarioId;
    const target = targetScenarioId || scenariosList.find((s) => s.scenarioId !== baseId)?.scenarioId;

    if (!target) {
      setNotificationMsg({ type: 'error', text: 'At least two saved scenarios are required to run comparison.' });
      return;
    }

    setCompareTargetId(target);
    setIsCompareOpen(true);
    setComparing(true);
    try {
      const comp = await bankingApi.compareStrategyScenarios(baseId!, target);
      setComparisonData(comp?.data || comp);
    } catch (err: any) {
      console.error('Comparison error:', err);
      setNotificationMsg({ type: 'error', text: err?.message || 'Failed to compare scenarios.' });
    } finally {
      setComparing(false);
    }
  };

  const handleConfirmApplyAction = async (notes: string) => {
    if (!actionToApply || !simulationResult?.scenarioId) return;
    setApplyingAction(true);
    try {
      // Find scenario ID or save current as draft first
      let scId = selectedScenario?.scenarioId;
      if (!scId) {
        const created = await bankingApi.createStrategyScenario({
          customerId: selectedCustomerId,
          name: scenarioName,
          actions: configuredActions,
          autoSimulate: false,
        });
        scId = created.data.scenarioId;
      }

      const res = await bankingApi.applyStrategyScenarioAction(
        scId,
        actionToApply.index,
        notes
      );

      setIsApplyActionOpen(false);
      setActionToApply(null);
      setNotificationMsg({
        type: 'success',
        text: `Action '${res.data?.executedAction}' applied to production Core Banking! (${res.data?.message})`,
      });

      // Refresh baseline
      const refreshedBase = await bankingApi.simulateAdhocStrategy({
        customerId: selectedCustomerId,
        actions: [],
      });
      if (refreshedBase?.data?.baseSnapshot) {
        setBaseSnapshot(refreshedBase.data.baseSnapshot);
      }
    } catch (err: any) {
      setNotificationMsg({
        type: 'error',
        text: err?.message || 'Failed to apply actual action.',
      });
    } finally {
      setApplyingAction(false);
    }
  };

  const handleResetSandbox = () => {
    setConfiguredActions([]);
    setSimulationResult(null);
    setScenarioName('Custom Strategy Scenario');
    setScenarioDescription('');
    setNotificationMsg(null);
  };

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner: SIMULATION — NOT PRODUCTION DATA */}
      <div className="bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-700/60 rounded-xl px-4 py-3 sm:px-6 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-500/20 text-amber-700 dark:text-amber-300 rounded-lg shrink-0">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-300/40">
                SIMULATION SANDBOX
              </span>
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                NOT PRODUCTION DATA
              </span>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Deterministic scenario projection based on currently available COREvia relationship data and rules. Zero customer records are altered during simulation.
            </p>
          </div>
        </div>

        {/* Customer Selector */}
        <div className="flex items-center space-x-2 self-start sm:self-center shrink-0">
          <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Customer:</label>
          <select
            value={selectedCustomerId}
            onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
            className="text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 px-3 py-1.5 focus:ring-2 focus:ring-indigo-500"
          >
            {customersList.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.customerCode})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Notifications */}
      {notificationMsg && (
        <div
          className={`px-4 py-3 rounded-lg text-xs flex items-center justify-between border ${
            notificationMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 text-emerald-800 dark:text-emerald-300'
              : 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 text-rose-800 dark:text-rose-300'
          }`}
        >
          <span>{notificationMsg.text}</span>
          <button onClick={() => setNotificationMsg(null)} className="font-bold ml-2">
            ×
          </button>
        </div>
      )}

      {/* Header and Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center space-x-2">
            <span>Relationship Strategy Simulator</span>
            <span className="text-xs font-medium text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/40 px-2.5 py-0.5 rounded-full border border-indigo-200 dark:border-indigo-800">
              Phase 30
            </span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            "What would the relationship look like if I changed this strategy?" — Deterministic What-If Modeling
          </p>
        </div>

        {/* Demo Scenarios Quick Pick */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-slate-400">Library:</span>
          {scenariosList.map((s) => (
            <button
              key={s.id}
              onClick={() => loadScenarioIntoBuilder(s)}
              className={`px-2.5 py-1 text-xs rounded-lg border transition font-medium ${
                selectedScenario?.id === s.id
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-slate-50'
              }`}
            >
              {s.name}
              {s.isStale && (
                <span className="ml-1.5 px-1 py-0.2 text-[10px] bg-rose-500 text-white rounded">
                  STALE
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Main Two-Column Layout: Current State vs Scenario Builder */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: CURRENT STATE SNAPSHOT (5 Cols) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center">
                <Clock className="w-4 h-4 mr-1.5 text-indigo-500" />
                Current Baseline State
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Snapshot as of {baseSnapshot?.asOf ? new Date(baseSnapshot.asOf).toLocaleTimeString() : 'now'}
              </p>
            </div>
            {baseSnapshot && (
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                {baseSnapshot.customerCode}
              </span>
            )}
          </div>

          {!baseSnapshot ? (
            <div className="py-8 text-center text-xs text-slate-400">Loading customer baseline...</div>
          ) : (
            <div className="space-y-4">
              {/* Primary Score & Momentum Card */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100/70 dark:from-slate-800/60 dark:to-slate-800/30 border border-slate-200/80 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <div className="text-xs text-slate-500 font-medium">CORE Score</div>
                  <div className="text-3xl font-black text-slate-900 dark:text-white mt-0.5">
                    {baseSnapshot.coreScore}
                    <span className="text-xs font-normal text-slate-400 ml-1">/100</span>
                  </div>
                  <div className="flex items-center space-x-1.5 mt-1 text-xs text-slate-500">
                    <span>Momentum:</span>
                    <span
                      className={`font-semibold ${
                        baseSnapshot.relationshipMomentum === 'ACCELERATING'
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : baseSnapshot.relationshipMomentum === 'DECLINING'
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      {baseSnapshot.relationshipMomentum}
                    </span>
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="text-xs text-slate-500">Service Health</div>
                  <span
                    className={`inline-block px-2.5 py-1 text-xs font-bold rounded-lg border ${
                      baseSnapshot.serviceHealth === 'EXCELLENT' || baseSnapshot.serviceHealth === 'GOOD'
                        ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800'
                        : 'bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-800'
                    }`}
                  >
                    {baseSnapshot.serviceHealth}
                  </span>
                  <div className="text-[11px] text-slate-400">
                    State: <span className="font-semibold text-slate-700 dark:text-slate-300">{baseSnapshot.relationshipState}</span>
                  </div>
                </div>
              </div>

              {/* Metric Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400">Engagement Score</div>
                  <div className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {baseSnapshot.engagementScore}/100
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Recency: {baseSnapshot.daysSinceLastInteraction}d ago
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400">Open Service Cases</div>
                  <div className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {baseSnapshot.openCasesCount}
                    {baseSnapshot.criticalCasesCount > 0 && (
                      <span className="text-rose-500 text-xs ml-1 font-semibold">
                        ({baseSnapshot.criticalCasesCount} critical)
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    SLA Risk: {baseSnapshot.slaRiskCasesCount}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400">Stalled Opportunities</div>
                  <div className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {baseSnapshot.stalledOpportunitiesCount} / {baseSnapshot.openOpportunitiesCount}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Products Held: {baseSnapshot.productDepth}
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-slate-800">
                  <div className="text-slate-400">Open Tasks & Follow-ups</div>
                  <div className="text-base font-bold text-slate-800 dark:text-slate-200 mt-0.5">
                    {baseSnapshot.openTasksCount}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-1">
                    Review: {baseSnapshot.reviewStatus}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Right Column: SCENARIO BUILDER & ACTIONS (7 Cols) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm flex flex-col space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center">
                <Sparkles className="w-4 h-4 mr-1.5 text-indigo-500" />
                Scenario Action Builder
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Compose sequential hypothetical banker interventions
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <button
                onClick={handleResetSandbox}
                className="px-2.5 py-1 text-xs text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg flex items-center space-x-1"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
              <button
                onClick={handleSaveScenario}
                disabled={saving || configuredActions.length === 0}
                className="px-3 py-1 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 flex items-center space-x-1"
              >
                <Save className="w-3 h-3" />
                <span>Save</span>
              </button>
            </div>
          </div>

          {/* Scenario Name & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Scenario Title</label>
              <input
                type="text"
                value={scenarioName}
                onChange={(e) => setScenarioName(e.target.value)}
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-slate-500 font-semibold mb-1">Objective / Rationale</label>
              <input
                type="text"
                value={scenarioDescription}
                onChange={(e) => setScenarioDescription(e.target.value)}
                placeholder="e.g. Service ticket recovery and senior citizen FD outreach"
                className="w-full px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 text-xs focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Active Configured Actions List */}
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-600 dark:text-slate-400">
              <span>Configured Sequential Interventions ({configuredActions.length})</span>
              <span className="text-[11px] text-slate-400 italic">Evaluated in order</span>
            </div>

            {configuredActions.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-lg text-xs text-slate-400">
                No actions added yet. Select an intervention below to build scenario.
              </div>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                {configuredActions.map((act, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 dark:bg-slate-800/70 border border-slate-200 dark:border-slate-700/80 rounded-lg flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center space-x-2.5">
                      <span className="w-5 h-5 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-bold flex items-center justify-center text-[10px] shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <div className="font-semibold text-slate-800 dark:text-slate-200">
                          {act.label || act.actionType.replace(/_/g, ' ')}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400">
                          {act.description || act.actionType}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1.5 shrink-0">
                      <button
                        onClick={() => {
                          setActionToApply({ action: act, index: idx });
                          setIsApplyActionOpen(true);
                        }}
                        className="px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded hover:bg-amber-100 transition"
                        title="Execute this action in real Core Banking"
                      >
                        Apply Real Action
                      </button>
                      <button
                        onClick={() => handleRemoveAction(idx)}
                        className="text-slate-400 hover:text-rose-500 p-1 rounded transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Catalog Selector */}
          <div className="border-t border-slate-100 dark:border-slate-800 pt-3">
            <div className="text-xs font-semibold text-slate-500 mb-2">Add What-If Intervention:</div>
            <div className="flex flex-wrap gap-1.5">
              {ACTION_CATALOG.map((cat) => (
                <button
                  key={cat.type}
                  onClick={() => handleAddAction(cat.type)}
                  className="px-2.5 py-1 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 hover:border-indigo-300 dark:hover:border-indigo-800 text-slate-700 dark:text-slate-300 transition flex items-center space-x-1"
                >
                  <Plus className="w-3 h-3 text-indigo-500" />
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Run Simulation Button */}
          <div className="pt-2">
            <button
              onClick={handleRunSimulation}
              disabled={simulating || configuredActions.length === 0}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-semibold text-sm rounded-xl shadow-sm transition flex items-center justify-center space-x-2"
            >
              {simulating ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Computing Scenario Impact...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run Deterministic Simulation</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* SIMULATION RESULTS SECTION */}
      {simulationResult && (
        <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm space-y-6 animate-fade-in">
          {/* Result Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 rounded-xl">
                <Zap className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    Simulation Projection Result
                  </h3>
                  <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded bg-emerald-100 dark:bg-emerald-900/30 text-emerald-800 dark:text-emerald-300 border border-emerald-200">
                    SIMULATED
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Scenario: {simulationResult.scenarioId} · Evaluated: {new Date(simulationResult.simulatedAt).toLocaleTimeString()}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-2.5">
              {simulationResult.decisionTraceId && (
                <button
                  onClick={() => setActiveTraceId(simulationResult.decisionTraceId!)}
                  className="px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800 rounded-lg hover:bg-indigo-100 transition flex items-center space-x-1.5"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Explain Decision Trace ({simulationResult.decisionTraceId})</span>
                </button>
              )}
              <button
                onClick={() => handleOpenCompare()}
                className="px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-lg hover:bg-slate-50 transition flex items-center space-x-1.5"
              >
                <GitCompare className="w-3.5 h-3.5" />
                <span>Compare Scenario</span>
              </button>
            </div>
          </div>

          {/* Before / After Metric Comparison Table */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
              Metric Impact Differential
            </div>
            <div className="border border-slate-200 dark:border-slate-800 rounded-xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-500 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Relationship Metric</th>
                    <th className="px-4 py-3 font-semibold">Current (Base)</th>
                    <th className="px-4 py-3 font-semibold">Simulated</th>
                    <th className="px-4 py-3 font-semibold">Delta</th>
                    <th className="px-4 py-3 font-semibold">Status / Impact</th>
                    <th className="px-4 py-3 font-semibold">Source Engine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {simulationResult.comparisons.map((c, i) => (
                    <tr key={i} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition">
                      <td className="px-4 py-3 font-semibold text-slate-800 dark:text-slate-200">
                        {c.metric}
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-600 dark:text-slate-400 font-mono">
                        {String(c.currentValue)}
                      </td>
                      <td className="px-4 py-3 font-bold text-slate-900 dark:text-white font-mono">
                        {String(c.simulatedValue)}
                      </td>
                      <td className="px-4 py-3 font-semibold font-mono">
                        <span
                          className={
                            c.changeType === 'IMPROVED'
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : c.changeType === 'DECLINED'
                              ? 'text-rose-600 dark:text-rose-400'
                              : 'text-slate-400'
                          }
                        >
                          {String(c.change)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            c.changeType === 'IMPROVED'
                              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300'
                              : c.changeType === 'DECLINED'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          {c.changeType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {c.sourceEngine}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Why Did This Change? & Source Rules */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Why Did This Change */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center">
                <HelpCircle className="w-4 h-4 mr-1.5 text-indigo-500" />
                Why Did This Change?
              </div>
              <ul className="space-y-2 text-xs">
                {simulationResult.whyFactors.map((w, idx) => (
                  <li key={idx} className="flex items-start space-x-2">
                    <span className="text-emerald-500 font-bold mt-0.5">+</span>
                    <div>
                      <span className="text-slate-800 dark:text-slate-200">{w.factor}</span>
                      <span className="text-[10px] text-slate-400 block font-mono">{w.engine}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Source Rules & Limitations */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center">
                <Compass className="w-4 h-4 mr-1.5 text-indigo-500" />
                Source Rules & Limitations
              </div>

              <div className="space-y-2 text-xs">
                <div>
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Engines Reused:
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {simulationResult.sourceRules.map((rule, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 text-[10px] rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-mono"
                      >
                        {rule}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="pt-1">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Governance Caveats:
                  </div>
                  <ul className="mt-1 space-y-1 text-[11px] text-slate-500 dark:text-slate-400 list-disc list-inside">
                    {simulationResult.limitations.map((lim, idx) => (
                      <li key={idx}>{lim}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Sequential Step Progression */}
          {simulationResult.intermediateSteps.length > 0 && (
            <div className="border-t border-slate-100 dark:border-slate-800 pt-4">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-3">
                Sequential State Transition Progression
              </div>
              <div className="flex flex-col sm:flex-row items-stretch gap-2 overflow-x-auto pb-2">
                <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shrink-0 min-w-[160px] text-xs">
                  <div className="text-[10px] text-slate-400 font-bold uppercase">Initial State</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-1">
                    Score: {simulationResult.baseSnapshot.coreScore}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Health: {simulationResult.baseSnapshot.serviceHealth}
                  </div>
                </div>

                {simulationResult.intermediateSteps.map((step, idx) => (
                  <React.Fragment key={idx}>
                    <div className="hidden sm:flex items-center text-slate-300 dark:text-slate-700">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                    <div className="p-3 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200 dark:border-indigo-900/60 shrink-0 min-w-[200px] text-xs">
                      <div className="text-[10px] font-bold text-indigo-600 uppercase">
                        Step {step.stepIndex}: {step.action.actionType.replace(/_/g, ' ')}
                      </div>
                      <div className="font-bold text-slate-900 dark:text-white mt-1">
                        Score: {step.stateAfter.coreScore} ({step.stateAfter.serviceHealth})
                      </div>
                      <div className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-1 mt-0.5">
                        {step.deltaExplanation}
                      </div>
                    </div>
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Comparison Modal */}
      <ScenarioComparisonModal
        isOpen={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        comparison={comparisonData}
        loading={comparing}
      />

      {/* Apply Action Human Confirmation Modal */}
      <ApplyActionConfirmationModal
        isOpen={isApplyActionOpen}
        onClose={() => {
          setIsApplyActionOpen(false);
          setActionToApply(null);
        }}
        onConfirm={handleConfirmApplyAction}
        action={actionToApply?.action || null}
        scenarioName={scenarioName}
        customerName={baseSnapshot?.customerName}
        loading={applyingAction}
      />

      {/* Decision Trace Drawer Panel */}
      <DecisionTracePanel
        isOpen={!!activeTraceId}
        onClose={() => setActiveTraceId(null)}
        decisionId={activeTraceId || ''}
      />
    </div>
  );
};
