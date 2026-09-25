import React, { useState, useEffect, useMemo } from 'react';
import {
  Network,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
  Sparkles,
  RefreshCw,
  Camera,
  GitCompare,
  History,
  User,
  TrendingUp,
  TrendingDown,
  Layers,
  Send,
  FileText,
  CheckCheck,
  XCircle,
  Info,
  ExternalLink,
  ChevronRight,
  Filter,
  Plus,
  Bot,
  Zap,
} from 'lucide-react';
import {
  RelationshipTwinOverview,
  RelationshipSnapshot,
  RelationshipSignal,
  RelationshipEvent,
  RelationshipActionTraceItem,
} from '../../types';
import { formatINR } from '../../data/mockIndianBankingData';
import { useAuth } from '../../context/AuthContext';
import { useCopilot } from '../../context/CopilotContext';

interface RelationshipTwinModuleProps {
  initialCustomerId?: number;
  onNavigateToCustomer?: (customerId: number) => void;
  onNavigateToModule?: (module: string) => void;
}

export const RelationshipTwinModule: React.FC<RelationshipTwinModuleProps> = ({
  initialCustomerId = 1,
  onNavigateToCustomer,
  onNavigateToModule,
}) => {
  const { user } = useAuth();
  const { openDrawer } = useCopilot();

  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(initialCustomerId);
  const [twinData, setTwinData] = useState<RelationshipTwinOverview | null>(null);
  const [portfolioAnalytics, setPortfolioAnalytics] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active view tab inside Digital Twin
  const [activeTab, setActiveTab] = useState<'overview' | 'timeline' | 'snapshots' | 'actions' | 'portfolio'>('overview');

  // Modal states
  const [isSnapshotModalOpen, setIsSnapshotModalOpen] = useState(false);
  const [snapshotNotes, setSnapshotNotes] = useState('');
  const [isSavingSnapshot, setIsSavingSnapshot] = useState(false);

  // Compare snapshot states
  const [compareSnapA, setCompareSnapA] = useState<string>('');
  const [compareSnapB, setCompareSnapB] = useState<string>('');
  const [compareResult, setCompareResult] = useState<any | null>(null);
  const [isComparing, setIsComparing] = useState(false);

  // Signal action modal
  const [selectedSignal, setSelectedSignal] = useState<RelationshipSignal | null>(null);
  const [signalActionStatus, setSignalActionStatus] = useState<'ACKNOWLEDGED' | 'RESOLVED' | 'DISMISSED'>('ACKNOWLEDGED');
  const [signalNotes, setSignalNotes] = useState('');
  const [isUpdatingSignal, setIsUpdatingSignal] = useState(false);

  // Action log modal
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [actionTitle, setActionTitle] = useState('');
  const [actionType, setActionType] = useState('PROACTIVE_OUTREACH');
  const [actionDescription, setActionDescription] = useState('');
  const [actionTargetModule, setActionTargetModule] = useState('cases');
  const [isLoggingAction, setIsLoggingAction] = useState(false);

  // Event filter
  const [timelineFilter, setTimelineFilter] = useState<string>('ALL');

  // Available sample customers for quick-switching
  const sampleCustomers = [
    { id: 1, name: 'Rahul Sharma', code: 'CUS-10482', segment: 'PREMIUM_WEALTH' },
    { id: 2, name: 'Priya Patel', code: 'CUS-10483', segment: 'AFFLUENT' },
    { id: 3, name: 'Amit Verma', code: 'CUS-10484', segment: 'RETAIL' },
    { id: 4, name: 'Sunita Rao', code: 'CUS-10485', segment: 'BUSINESS_BANKING' },
  ];

  // Fetch twin data
  const fetchTwinData = async (cId: number) => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/relationship-twin/${cId}`, {
        headers: {
          'x-mock-user-id': String(user?.id || 1),
          'x-mock-user-name': user?.name || 'Bank Officer',
          'x-mock-user-role': user?.role || 'RELATIONSHIP_MANAGER',
        },
      });

      if (!res.ok) {
        throw new Error(`Failed to load Relationship Digital Twin (${res.status})`);
      }

      const data: RelationshipTwinOverview = await res.json();
      setTwinData(data);

      if (data.snapshots.length >= 2) {
        setCompareSnapA(data.snapshots[data.snapshots.length - 1].snapshotCode);
        setCompareSnapB(data.snapshots[0].snapshotCode);
      } else if (data.snapshots.length === 1) {
        setCompareSnapA(data.snapshots[0].snapshotCode);
        setCompareSnapB(data.snapshots[0].snapshotCode);
      }
    } catch (err: any) {
      setError(err.message || 'Error loading Digital Twin data');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch portfolio analytics
  const fetchPortfolioAnalytics = async () => {
    try {
      const res = await fetch('/api/relationship-twin/analytics', {
        headers: {
          'x-mock-user-id': String(user?.id || 1),
          'x-mock-user-name': user?.name || 'Bank Officer',
          'x-mock-user-role': user?.role || 'RELATIONSHIP_MANAGER',
        },
      });
      if (res.ok) {
        const data = await res.json();
        setPortfolioAnalytics(data);
      }
    } catch (err) {
      console.error('Error loading portfolio twin analytics:', err);
    }
  };

  useEffect(() => {
    fetchTwinData(selectedCustomerId);
    fetchPortfolioAnalytics();
  }, [selectedCustomerId]);

  // Handle capture snapshot
  const handleCaptureSnapshot = async () => {
    if (!twinData) return;
    setIsSavingSnapshot(true);
    try {
      const res = await fetch(`/api/relationship-twin/${selectedCustomerId}/snapshot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mock-user-id': String(user?.id || 1),
          'x-mock-user-name': user?.name || 'Bank Officer',
          'x-mock-user-role': user?.role || 'RELATIONSHIP_MANAGER',
        },
        body: JSON.stringify({ summaryNotes: snapshotNotes || 'Ad-hoc snapshot captured by Officer' }),
      });

      if (!res.ok) throw new Error('Failed to create snapshot');

      await fetchTwinData(selectedCustomerId);
      setIsSnapshotModalOpen(false);
      setSnapshotNotes('');
    } catch (err: any) {
      alert(err.message || 'Could not save snapshot');
    } finally {
      setIsSavingSnapshot(false);
    }
  };

  // Handle compare snapshots
  const handleRunCompare = async () => {
    if (!compareSnapA || !compareSnapB) return;
    setIsComparing(true);
    try {
      const res = await fetch(
        `/api/relationship-twin/${selectedCustomerId}/compare?snapA=${encodeURIComponent(compareSnapA)}&snapB=${encodeURIComponent(compareSnapB)}`,
        {
          headers: {
            'x-mock-user-id': String(user?.id || 1),
            'x-mock-user-name': user?.name || 'Bank Officer',
            'x-mock-user-role': user?.role || 'RELATIONSHIP_MANAGER',
          },
        }
      );
      if (!res.ok) throw new Error('Comparison failed');
      const diff = await res.json();
      setCompareResult(diff);
    } catch (err: any) {
      alert(err.message || 'Comparison error');
    } finally {
      setIsComparing(false);
    }
  };

  // Handle update signal status
  const handleUpdateSignal = async () => {
    if (!selectedSignal) return;
    setIsUpdatingSignal(true);
    try {
      const res = await fetch(`/api/relationship-twin/${selectedCustomerId}/signals/${selectedSignal.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-mock-user-id': String(user?.id || 1),
          'x-mock-user-name': user?.name || 'Bank Officer',
          'x-mock-user-role': user?.role || 'RELATIONSHIP_MANAGER',
        },
        body: JSON.stringify({ status: signalActionStatus, notes: signalNotes }),
      });

      if (!res.ok) throw new Error('Failed to update signal');
      await fetchTwinData(selectedCustomerId);
      setSelectedSignal(null);
      setSignalNotes('');
    } catch (err: any) {
      alert(err.message || 'Error updating signal');
    } finally {
      setIsUpdatingSignal(false);
    }
  };

  // Handle log action trace
  const handleLogAction = async () => {
    if (!actionTitle) return;
    setIsLoggingAction(true);
    try {
      const res = await fetch(`/api/relationship-twin/${selectedCustomerId}/actions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mock-user-id': String(user?.id || 1),
          'x-mock-user-name': user?.name || 'Bank Officer',
          'x-mock-user-role': user?.role || 'RELATIONSHIP_MANAGER',
        },
        body: JSON.stringify({
          actionType,
          title: actionTitle,
          description: actionDescription,
          targetModule: actionTargetModule,
          status: 'EXECUTED',
        }),
      });

      if (!res.ok) throw new Error('Failed to log action trace');
      await fetchTwinData(selectedCustomerId);
      setIsActionModalOpen(false);
      setActionTitle('');
      setActionDescription('');
    } catch (err: any) {
      alert(err.message || 'Error logging action');
    } finally {
      setIsLoggingAction(false);
    }
  };

  // Filtered timeline
  const filteredEvents = useMemo(() => {
    if (!twinData) return [];
    if (timelineFilter === 'ALL') return twinData.timeline;
    return twinData.timeline.filter((e) => e.eventType === timelineFilter);
  }, [twinData, timelineFilter]);

  // State Color Map
  const stateBadgeStyles: Record<string, { bg: string; text: string; border: string; label: string }> = {
    STABLE: { bg: 'bg-emerald-950/40', text: 'text-emerald-400', border: 'border-emerald-500/30', label: 'Stable Relationship' },
    ATTENTION_REQUIRED: { bg: 'bg-amber-950/40', text: 'text-amber-400', border: 'border-amber-500/30', label: 'Attention Required' },
    GROWING: { bg: 'bg-cyan-950/40', text: 'text-cyan-400', border: 'border-cyan-500/30', label: 'High Growth Trajectory' },
    AT_RISK: { bg: 'bg-rose-950/40', text: 'text-rose-400', border: 'border-rose-500/30', label: 'Immediate Churn Risk' },
    DORMANT_TRENDING: { bg: 'bg-slate-900', text: 'text-slate-400', border: 'border-slate-700', label: 'Trending Dormant' },
    NEW_ONBOARDED: { bg: 'bg-blue-950/40', text: 'text-blue-400', border: 'border-blue-500/30', label: 'Newly Onboarded' },
  };

  const currentStateStyle = twinData?.state?.state
    ? stateBadgeStyles[twinData.state.state] || stateBadgeStyles.STABLE
    : stateBadgeStyles.STABLE;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="p-3 bg-violet-950/40 border border-violet-500/30 rounded-2xl animate-pulse">
          <Network className="w-10 h-10 text-violet-400 animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-base font-medium text-slate-200">Synthesizing Relationship Digital Twin...</p>
          <p className="text-xs text-slate-400 mt-1">
            Aggregating CORE score, service cases, SLA timelines, document vault, and action traces
          </p>
        </div>
      </div>
    );
  }

  if (error || !twinData) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <div className="p-3 bg-rose-950/40 border border-rose-500/30 rounded-2xl inline-block">
          <AlertTriangle className="w-10 h-10 text-rose-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-100">Unable to load Relationship Digital Twin</h3>
        <p className="text-sm text-slate-400">{error || 'Customer twin records not found'}</p>
        <button
          onClick={() => fetchTwinData(selectedCustomerId)}
          className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-sm font-medium transition"
        >
          Retry Synthesis
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Bar: Customer Switcher & Quick Capabilities */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800 rounded-2xl p-4 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-violet-600/10 border border-violet-500/30 rounded-xl text-violet-400">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-semibold text-slate-100">Relationship Digital Twin</h2>
              <span className="px-2 py-0.5 text-xs font-medium rounded-md bg-violet-950/60 text-violet-300 border border-violet-500/30">
                Phase 26 Live
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Deterministic temporal state machine, event streams, and real-time advisory
            </p>
          </div>
        </div>

        {/* Customer Quick Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs">
            <User className="w-3.5 h-3.5 text-slate-400 mr-2" />
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
              className="bg-transparent text-slate-200 focus:outline-none cursor-pointer pr-2 font-medium"
            >
              {sampleCustomers.map((c) => (
                <option key={c.id} value={c.id} className="bg-slate-900 text-slate-200">
                  {c.name} ({c.code}) - {c.segment}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => fetchTwinData(selectedCustomerId)}
            title="Refresh State Model"
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition text-xs flex items-center gap-1.5"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsSnapshotModalOpen(true)}
            className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Capture Snapshot</span>
          </button>

          <button
            onClick={() => {
              openDrawer({
                initialPrompt: `Explain why customer ${twinData.customer.name} (${twinData.customer.customerCode}) is currently in ${twinData.state.state} state and give me the Before You Act advisory.`,
              });
            }}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-medium transition flex items-center gap-1.5 shadow-sm"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Copilot Advisory</span>
          </button>
        </div>
      </div>

      {/* Customer Relationship Status Hero Card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* State Badge & Core Score Card */}
        <div className="lg:col-span-1 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">Current State</span>
              <div className="flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="w-3 h-3" />
                <span>{new Date(twinData.state.calculatedAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border ${currentStateStyle.bg} ${currentStateStyle.border} flex items-center justify-between`}>
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-violet-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-violet-500"></span>
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${currentStateStyle.text}`}>{currentStateStyle.label}</h4>
                  <p className="text-[11px] text-slate-400">Previous: {twinData.state.previousState || 'NONE'}</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400">CORE Score</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-bold text-slate-100">{twinData.header.coreScore}</span>
                  <span className="text-xs text-slate-500">/ 100</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-slate-400">Momentum</p>
                <div className="flex items-center gap-1 mt-0.5 justify-end">
                  {twinData.header.relationshipMomentum === 'POSITIVE' && (
                    <span className="text-xs font-semibold text-emerald-400 flex items-center">
                      <ArrowUpRight className="w-3.5 h-3.5" /> +Improving
                    </span>
                  )}
                  {twinData.header.relationshipMomentum === 'NEGATIVE' && (
                    <span className="text-xs font-semibold text-rose-400 flex items-center">
                      <ArrowDownRight className="w-3.5 h-3.5" /> -Degrading
                    </span>
                  )}
                  {twinData.header.relationshipMomentum === 'STABLE' && (
                    <span className="text-xs font-semibold text-slate-400 flex items-center">
                      Neutral
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-400">
            <span>Portfolio Value:</span>
            <span className="font-semibold text-slate-200">{formatINR(twinData.header.relationshipValue)}</span>
          </div>
        </div>

        {/* "Why This State?" & Explanation Banner */}
        <div className="lg:col-span-3 bg-slate-900/90 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between shadow-sm">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-slate-100">Why This State?</h3>
              </div>
              <span className="text-xs text-slate-400">Automated Reasoning Engine</span>
            </div>

            <p className="text-xs leading-relaxed text-slate-300 bg-slate-950/60 border border-slate-800/70 p-3 rounded-xl font-mono">
              {twinData.whyThisState}
            </p>

            {/* What Changed in 7 / 30 days */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-2.5">
                <p className="text-[11px] text-slate-400">Score Shift (7D)</p>
                <div className="flex items-center gap-1.5 mt-1">
                  {twinData.whatChanged.scoreChange >= 0 ? (
                    <span className="text-sm font-bold text-emerald-400 flex items-center">
                      <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +{twinData.whatChanged.scoreChange} pts
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-rose-400 flex items-center">
                      <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> {twinData.whatChanged.scoreChange} pts
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-2.5">
                <p className="text-[11px] text-slate-400">Grievance / Case SLA</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-sm font-bold ${twinData.header.slaAtRiskCount > 0 ? 'text-amber-400' : 'text-slate-200'}`}>
                    {twinData.header.openCasesCount} Open ({twinData.header.slaAtRiskCount} SLA Risk)
                  </span>
                </div>
              </div>

              <div className="bg-slate-950/40 border border-slate-800 rounded-xl p-2.5">
                <p className="text-[11px] text-slate-400">KYC & Document Vault</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`text-sm font-bold ${twinData.header.pendingDocumentsCount > 0 ? 'text-amber-400' : 'text-emerald-400'}`}>
                    {twinData.header.pendingDocumentsCount > 0
                      ? `${twinData.header.pendingDocumentsCount} Action Req.`
                      : 'All Verified'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-400 gap-2">
            <div className="flex items-center gap-2">
              <span className="text-slate-500">Assigned RM:</span>
              <span className="text-slate-300 font-medium">{twinData.customer.relationshipManagerName || 'Aditya Raj'}</span>
              <span className="text-slate-600">·</span>
              <span className="text-slate-500">Branch:</span>
              <span className="text-slate-300 font-medium">{twinData.customer.branchName || 'Fort Branch, Mumbai'}</span>
            </div>
            {onNavigateToCustomer && (
              <button
                onClick={() => onNavigateToCustomer(twinData.customer.id)}
                className="text-violet-400 hover:text-violet-300 flex items-center gap-1 font-medium transition"
              >
                <span>View Full Customer 360</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center border-b border-slate-800 gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'overview'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>State & Health Breakdown</span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'timeline'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Temporal Event Stream</span>
          <span className="px-1.5 py-0.2 text-[10px] bg-slate-800 text-slate-300 rounded-full">
            {twinData.timeline.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('snapshots')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'snapshots'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GitCompare className="w-4 h-4" />
          <span>Historical Snapshots & Time-Travel Diff</span>
          <span className="px-1.5 py-0.2 text-[10px] bg-slate-800 text-slate-300 rounded-full">
            {twinData.snapshots.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('actions')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'actions'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Closed-Loop Action Trace</span>
          <span className="px-1.5 py-0.2 text-[10px] bg-slate-800 text-slate-300 rounded-full">
            {twinData.actions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('portfolio')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
            activeTab === 'portfolio'
              ? 'border-violet-500 text-violet-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Network className="w-4 h-4" />
          <span>Portfolio Twin Health</span>
        </button>
      </div>

      {/* TAB 1: OVERVIEW & HEALTH PILLARS & BEFORE YOU ACT */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* "BEFORE YOU ACT" ADVISORY PANEL */}
          <div className="bg-amber-950/20 border border-amber-500/40 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-400">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-amber-200">
                    "Before You Act" Contextual Relationship Guardrails
                  </h3>
                  <p className="text-xs text-amber-300/80">
                    Mandatory briefing for RM, Service Agents, and Officers prior to reaching out or pitching
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsActionModalOpen(true)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-slate-950 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Action Taken</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="space-y-2">
                <h4 className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  Active Precautions & Risk Factors:
                </h4>
                <ul className="space-y-1.5">
                  {twinData.beforeYouAct.recommendedPrecautions.map((prec, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-300">
                      <span className="text-amber-400 mt-0.5">•</span>
                      <span>{prec}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold text-slate-200 flex items-center gap-1.5">
                  <CheckCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Recommended Next Best Steps:
                </h4>
                <ul className="space-y-1.5">
                  {twinData.beforeYouAct.nextBestActions.map((nba, i) => (
                    <li key={i} className="flex items-start gap-2 text-slate-300">
                      <span className="text-emerald-400 mt-0.5">✓</span>
                      <span>{nba}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>

          {/* 4 PILLARS HEALTH GAUGES */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Financial Health</span>
                <span className="text-xs font-bold text-emerald-400">{twinData.healthBreakdown.financialHealth}/100</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-emerald-500 h-2 rounded-full"
                  style={{ width: `${twinData.healthBreakdown.financialHealth}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-400">Balance stability, debt-to-income, credit health</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Engagement Momentum</span>
                <span className="text-xs font-bold text-cyan-400">{twinData.healthBreakdown.engagementMomentum}/100</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-cyan-500 h-2 rounded-full"
                  style={{ width: `${twinData.healthBreakdown.engagementMomentum}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-400">Transaction velocity, app logins, meeting cadence</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Compliance & Trust</span>
                <span className="text-xs font-bold text-blue-400">{twinData.healthBreakdown.complianceAndTrust}/100</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-500 h-2 rounded-full"
                  style={{ width: `${twinData.healthBreakdown.complianceAndTrust}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-400">cKYC compliance, document renewals, AML risk</p>
            </div>

            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400 font-medium">Service Satisfaction</span>
                <span className={`text-xs font-bold ${twinData.healthBreakdown.serviceSatisfaction < 70 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {twinData.healthBreakdown.serviceSatisfaction}/100
                </span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-2 rounded-full ${twinData.healthBreakdown.serviceSatisfaction < 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${twinData.healthBreakdown.serviceSatisfaction}%` }}
                ></div>
              </div>
              <p className="text-[11px] text-slate-400">Resolution TAT, grievance frequency, NPS score</p>
            </div>
          </div>

          {/* ACTIVE SIGNALS & SURVEILLANCE BOARD */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-violet-400" />
                <h3 className="text-sm font-semibold text-slate-100">Active Signals & Triggers</h3>
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-slate-800 text-slate-300">
                  {twinData.signals.length} Detected
                </span>
              </div>
              <span className="text-xs text-slate-400">Deterministic Rule Engine & Signal Listener</span>
            </div>

            {twinData.signals.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-xs">
                No active anomaly signals detected. Relationship parameters operating normally.
              </div>
            ) : (
              <div className="space-y-2.5">
                {twinData.signals.map((sig) => (
                  <div
                    key={sig.id}
                    className="p-3.5 bg-slate-950/60 border border-slate-800 hover:border-slate-700 rounded-xl transition flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className={`p-2 rounded-lg mt-0.5 ${
                          sig.severity === 'CRITICAL'
                            ? 'bg-rose-950/50 text-rose-400 border border-rose-500/30'
                            : sig.severity === 'HIGH'
                            ? 'bg-amber-950/50 text-amber-400 border border-amber-500/30'
                            : 'bg-blue-950/50 text-blue-400 border border-blue-500/30'
                        }`}
                      >
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-200">{sig.title}</h4>
                          <span
                            className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                              sig.severity === 'CRITICAL'
                                ? 'bg-rose-950 text-rose-300'
                                : sig.severity === 'HIGH'
                                ? 'bg-amber-950 text-amber-300'
                                : 'bg-slate-800 text-slate-300'
                            }`}
                          >
                            {sig.severity}
                          </span>
                          <span
                            className={`px-1.5 py-0.5 text-[10px] rounded ${
                              sig.status === 'ACTIVE'
                                ? 'bg-violet-950 text-violet-300 border border-violet-500/30'
                                : sig.status === 'RESOLVED'
                                ? 'bg-emerald-950 text-emerald-300'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {sig.status}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1">{sig.description}</p>
                        {sig.recommendedAction && (
                          <p className="text-[11px] text-violet-400 mt-1 font-medium">
                            Action: {sig.recommendedAction}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end md:self-center">
                      <button
                        onClick={() => {
                          setSelectedSignal(sig);
                          setSignalActionStatus('ACKNOWLEDGED');
                        }}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium transition"
                      >
                        Action
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: TEMPORAL EVENT STREAM */}
      {activeTab === 'timeline' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Temporal Event Stream</h3>
              <p className="text-xs text-slate-400">
                Chronological ledger of customer interactions, service tickets, score calculations, and alerts
              </p>
            </div>

            {/* Event Filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={timelineFilter}
                onChange={(e) => setTimelineFilter(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-1 text-xs text-slate-200"
              >
                <option value="ALL">All Event Types</option>
                <option value="CORE_SCORE_CHANGE">CORE Score Changes</option>
                <option value="CASE_OPENED">Cases Opened</option>
                <option value="TASK_PENDING">Tasks Pending</option>
                <option value="DOCUMENT_VERIFIED">Document Events</option>
                <option value="SIGNAL_DETECTED">Signals Detected</option>
                <option value="NOTE_LOGGED">Notes Logged</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-slate-800">
            {filteredEvents.map((evt, idx) => (
              <div key={evt.id || idx} className="relative flex items-start gap-4 pl-8">
                <div
                  className={`absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-slate-900 ${
                    evt.impact === 'NEGATIVE'
                      ? 'bg-rose-500'
                      : evt.impact === 'POSITIVE'
                      ? 'bg-emerald-500'
                      : 'bg-violet-500'
                  }`}
                />
                <div className="w-full bg-slate-950/70 border border-slate-800/80 rounded-xl p-3.5 space-y-1.5 hover:border-slate-700 transition">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-200">{evt.title}</span>
                    <span className="text-[11px] text-slate-400 font-mono">
                      {new Date(evt.eventTimestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300">{evt.description}</p>
                  <div className="flex items-center gap-3 pt-1 text-[11px] text-slate-500">
                    <span>Source: {evt.sourceModule}</span>
                    <span>•</span>
                    <span>Actor: {evt.actorName || 'System'}</span>
                    {evt.scoreDelta !== 0 && (
                      <>
                        <span>•</span>
                        <span className={evt.scoreDelta > 0 ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
                          Score Delta: {evt.scoreDelta > 0 ? `+${evt.scoreDelta}` : evt.scoreDelta}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: HISTORICAL SNAPSHOTS & TIME TRAVEL DIFF */}
      {activeTab === 'snapshots' && (
        <div className="space-y-6">
          {/* Comparison Tool Header */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
                  <GitCompare className="w-4 h-4 text-violet-400" />
                  Time-Travel Snapshot Comparison
                </h3>
                <p className="text-xs text-slate-400">
                  Deterministically compare customer state between two temporal points in history
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">From:</span>
                  <select
                    value={compareSnapA}
                    onChange={(e) => setCompareSnapA(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-slate-200"
                  >
                    {twinData.snapshots.map((s) => (
                      <option key={s.snapshotCode} value={s.snapshotCode}>
                        {s.snapshotCode} ({new Date(s.capturedAt).toLocaleDateString()}) - {s.state}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="text-slate-400">To:</span>
                  <select
                    value={compareSnapB}
                    onChange={(e) => setCompareSnapB(e.target.value)}
                    className="bg-slate-950 border border-slate-800 rounded-xl px-2 py-1 text-slate-200"
                  >
                    {twinData.snapshots.map((s) => (
                      <option key={s.snapshotCode} value={s.snapshotCode}>
                        {s.snapshotCode} ({new Date(s.capturedAt).toLocaleDateString()}) - {s.state}
                      </option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={handleRunCompare}
                  disabled={isComparing || !compareSnapA || !compareSnapB}
                  className="px-3 py-1 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition"
                >
                  {isComparing ? 'Comparing...' : 'Compare Diffs'}
                </button>
              </div>
            </div>

            {/* Comparison Diff Display */}
            {compareResult && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h4 className="text-xs font-bold text-slate-200">
                    Comparison: {compareResult.snapA.code} vs {compareResult.snapB.code}
                  </h4>
                  <span className="text-xs font-semibold text-slate-400">
                    State: {compareResult.snapA.state} ➔ {compareResult.snapB.state}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <p className="text-slate-400">CORE Score Change</p>
                    <p className="text-lg font-bold mt-1">
                      {compareResult.scoreDelta >= 0 ? (
                        <span className="text-emerald-400">+{compareResult.scoreDelta}</span>
                      ) : (
                        <span className="text-rose-400">{compareResult.scoreDelta}</span>
                      )}
                    </p>
                  </div>

                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <p className="text-slate-400">Open Cases Delta</p>
                    <p className="text-lg font-bold text-slate-200 mt-1">{compareResult.metricsDelta.casesDelta}</p>
                  </div>

                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <p className="text-slate-400">Products Count Delta</p>
                    <p className="text-lg font-bold text-slate-200 mt-1">{compareResult.metricsDelta.productsDelta}</p>
                  </div>

                  <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
                    <p className="text-slate-400">Intervening Events</p>
                    <p className="text-lg font-bold text-violet-400 mt-1">{compareResult.interveningEventsCount}</p>
                  </div>
                </div>

                {compareResult.eventsBetween && compareResult.eventsBetween.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <p className="text-xs font-semibold text-slate-300">Key Events Occurred in Period:</p>
                    <div className="space-y-1.5">
                      {compareResult.eventsBetween.map((e: any, i: number) => (
                        <div key={i} className="text-xs text-slate-400 flex items-center justify-between bg-slate-900/40 p-2 rounded-lg">
                          <span>{e.title}</span>
                          <span className="text-slate-500 font-mono text-[10px]">{new Date(e.eventTimestamp).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* List of Captured Snapshots */}
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-100">Saved Snapshot History</h3>
            <div className="space-y-2.5">
              {twinData.snapshots.map((s) => (
                <div
                  key={s.id}
                  className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200 font-mono">{s.snapshotCode}</span>
                      <span className="px-2 py-0.5 text-[10px] rounded bg-slate-800 text-slate-300 font-semibold">
                        {s.state}
                      </span>
                      <span className="text-slate-400">CORE Score: {s.coreScore}</span>
                    </div>
                    <p className="text-slate-400">{s.summaryNotes || 'System checkpoint snapshot'}</p>
                  </div>

                  <div className="text-right text-slate-500 text-[11px]">
                    <p>Captured by {s.capturedByName || 'Automated Engine'}</p>
                    <p>{new Date(s.capturedAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: CLOSED-LOOP ACTION TRACE */}
      {activeTab === 'actions' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">Closed-Loop Action Trace</h3>
              <p className="text-xs text-slate-400">
                Audited record of operational and relationship interventions triggered from Twin alerts
              </p>
            </div>
            <button
              onClick={() => setIsActionModalOpen(true)}
              className="px-3 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold transition flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Action</span>
            </button>
          </div>

          {twinData.actions.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No actions logged yet. Use "Log Action" to record proactive outreach, waiver, or follow-up.
            </div>
          ) : (
            <div className="space-y-2.5">
              {twinData.actions.map((act) => (
                <div
                  key={act.id}
                  className="p-3.5 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-slate-200">{act.title}</h4>
                      <span className="px-1.5 py-0.5 text-[10px] bg-slate-800 text-slate-300 rounded font-semibold">
                        {act.actionType}
                      </span>
                      <span className="px-1.5 py-0.5 text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-500/30 rounded font-semibold">
                        {act.status}
                      </span>
                    </div>
                    <p className="text-slate-400">{act.description}</p>
                  </div>

                  <div className="text-right text-slate-500 text-[11px]">
                    <p>Logged by {act.officerName || 'Officer'}</p>
                    <p>{new Date(act.executedAt).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 5: PORTFOLIO TWIN HEALTH */}
      {activeTab === 'portfolio' && (
        <div className="space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold text-slate-100">Portfolio Digital Twin Distribution</h3>
            <p className="text-xs text-slate-400">
              Cross-portfolio aggregation of relationship states, critical signals, and intervention rates
            </p>

            {portfolioAnalytics ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                {Object.entries(portfolioAnalytics.stateDistribution || {}).map(([stateKey, count]: [string, any]) => (
                  <div key={stateKey} className="bg-slate-950/60 border border-slate-800 rounded-xl p-4 space-y-1">
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{stateKey.replace('_', ' ')}</span>
                    <p className="text-2xl font-bold text-slate-100">{count}</p>
                    <p className="text-[11px] text-slate-500">Customers in state</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-xs text-slate-500">Loading portfolio metrics...</div>
            )}
          </div>
        </div>
      )}

      {/* CAPTURE SNAPSHOT MODAL */}
      {isSnapshotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Camera className="w-4 h-4 text-violet-400" />
                Capture State Snapshot
              </h3>
              <button onClick={() => setIsSnapshotModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">
              Captures a frozen point-in-time state of {twinData.customer.name}'s CORE score ({twinData.header.coreScore}), state ({twinData.state.state}), active cases, and product holdings for future audit and comparison.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Snapshot Notes / Purpose:</label>
              <textarea
                value={snapshotNotes}
                onChange={(e) => setSnapshotNotes(e.target.value)}
                placeholder="e.g., Pre-annual review checkpoint before expanding term deposit"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-violet-500 h-20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsSnapshotModalOpen(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleCaptureSnapshot}
                disabled={isSavingSnapshot}
                className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition"
              >
                {isSavingSnapshot ? 'Capturing...' : 'Save Snapshot'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIGNAL ACTION MODAL */}
      {selectedSignal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Signal Action: {selectedSignal.title}
              </h3>
              <button onClick={() => setSelectedSignal(null)} className="text-slate-400 hover:text-slate-200">
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400">{selectedSignal.description}</p>

            <div className="space-y-2 text-xs">
              <label className="font-medium text-slate-300">Set New Status:</label>
              <div className="flex items-center gap-2">
                {(['ACKNOWLEDGED', 'RESOLVED', 'DISMISSED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setSignalActionStatus(st)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                      signalActionStatus === st
                        ? 'bg-violet-600 text-white border-violet-500'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="pt-2 space-y-1">
                <label className="font-medium text-slate-300">Officer Notes:</label>
                <textarea
                  value={signalNotes}
                  onChange={(e) => setSignalNotes(e.target.value)}
                  placeholder="e.g., Called customer, grievance escalated to operations supervisor"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-xs text-slate-200 focus:outline-none h-16"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedSignal(null)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSignal}
                disabled={isUpdatingSignal}
                className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 text-white rounded-xl text-xs font-semibold transition"
              >
                {isUpdatingSignal ? 'Updating...' : 'Confirm Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOG ACTION TRACE MODAL */}
      {isActionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-md w-full space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Send className="w-4 h-4 text-violet-400" />
                Log Closed-Loop Action
              </h3>
              <button onClick={() => setIsActionModalOpen(false)} className="text-slate-400 hover:text-slate-200">
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-slate-300">Action Title:</label>
                <input
                  type="text"
                  value={actionTitle}
                  onChange={(e) => setActionTitle(e.target.value)}
                  placeholder="e.g., Proactive call regarding pending grievance SLA"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-300">Action Type:</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200"
                >
                  <option value="PROACTIVE_OUTREACH">Proactive Outreach / Call</option>
                  <option value="GRIEVANCE_ESCALATION">Grievance Escalation</option>
                  <option value="DOCUMENT_COLLECTION">Document Collection Follow-up</option>
                  <option value="FEE_WAIVER">Fee / Charge Waiver</option>
                  <option value="PORTFOLIO_REVIEW">Portfolio Review Meeting</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-slate-300">Description & Outcome:</label>
                <textarea
                  value={actionDescription}
                  onChange={(e) => setActionDescription(e.target.value)}
                  placeholder="Summary of discussion, customer reassurance, or operational ticket created..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none h-18"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsActionModalOpen(false)}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLogAction}
                disabled={isLoggingAction || !actionTitle}
                className="px-4 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold transition"
              >
                {isLoggingAction ? 'Logging...' : 'Save Action Trace'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
