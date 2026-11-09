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
  GitFork,
  Compass,
  BarChart3,
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
import { RelationshipValueProfile } from '../relationship-value/RelationshipValueProfile';
import { getSessionToken } from '../../lib/api';
import { useToast } from '../common/Toast';

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
  const toast = useToast();

  const [selectedCustomerId, setSelectedCustomerId] = useState<number>(initialCustomerId);
  const [twinData, setTwinData] = useState<RelationshipTwinOverview | null>(null);
  const [portfolioAnalytics, setPortfolioAnalytics] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Active view tab inside Digital Twin
  const [activeTab, setActiveTab] = useState<'overview' | 'value' | 'timeline' | 'snapshots' | 'actions' | 'portfolio'>('overview');

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
      const token = getSessionToken();
      const headers: Record<string, string> = {
        'x-mock-user-id': String(user?.id || 1),
        'x-mock-user-name': user?.name || 'Bank Officer',
        'x-mock-user-role': user?.role || 'RELATIONSHIP_MANAGER',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/relationship-twin/${cId}`, {
        credentials: 'include',
        headers,
      });

      if (!res.ok) {
        throw new Error(`Failed to load Relationship Digital Twin (${res.status})`);
      }

      const data: RelationshipTwinOverview = await res.json();
      const normalizedData = {
        ...data,
        snapshots: Array.isArray(data?.snapshots) ? data.snapshots : [],
        timeline: Array.isArray(data?.timeline) ? data.timeline : [],
        signals: Array.isArray(data?.signals) ? data.signals : [],
        actions: Array.isArray((data as any)?.actions)
          ? (data as any).actions
          : Array.isArray(data?.actionTraces)
          ? data.actionTraces
          : [],
        beforeYouAct: {
          recommendedPrecautions: Array.isArray(data?.beforeYouAct?.recommendedPrecautions)
            ? data.beforeYouAct.recommendedPrecautions
            : [],
          nextBestActions: Array.isArray((data?.beforeYouAct as any)?.nextBestActions)
            ? (data?.beforeYouAct as any).nextBestActions
            : [],
          ...(data?.beforeYouAct || {}),
        },
      };
      setTwinData(normalizedData);

      if (normalizedData.snapshots.length >= 2) {
        setCompareSnapA(normalizedData.snapshots[normalizedData.snapshots.length - 1].snapshotCode);
        setCompareSnapB(normalizedData.snapshots[0].snapshotCode);
      } else if (normalizedData.snapshots.length === 1) {
        setCompareSnapA(normalizedData.snapshots[0].snapshotCode);
        setCompareSnapB(normalizedData.snapshots[0].snapshotCode);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Error fetching digital twin');
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch portfolio level analytics
  const fetchPortfolioTwinAnalytics = async () => {
    try {
      const token = getSessionToken();
      const headers: Record<string, string> = {
        'x-mock-user-id': String(user?.id || 1),
        'x-mock-user-name': user?.name || 'Bank Officer',
        'x-mock-user-role': user?.role || 'RELATIONSHIP_MANAGER',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch('/api/relationship-twin/portfolio/analytics', {
        credentials: 'include',
        headers,
      });
      if (res.ok) {
        const pData = await res.json();
        setPortfolioAnalytics(pData);
      }
    } catch (e) {
      console.warn('Portfolio twin fetch notice:', e);
    }
  };

  useEffect(() => {
    fetchTwinData(selectedCustomerId);
    fetchPortfolioTwinAnalytics();
  }, [selectedCustomerId]);

  // Handle capture snapshot
  const handleCaptureSnapshot = async () => {
    if (!twinData) return;
    setIsSavingSnapshot(true);
    try {
      const token = getSessionToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-mock-user-id': String(user?.id || 1),
        'x-mock-user-name': user?.name || 'Bank Officer',
        'x-mock-user-role': user?.role || 'RELATIONSHIP_MANAGER',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/relationship-twin/${selectedCustomerId}/snapshot`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          summaryNotes: snapshotNotes || `Snapshot captured during relationship review by ${user?.name || 'Officer'}`,
        }),
      });

      if (!res.ok) throw new Error('Failed to capture snapshot');
      await fetchTwinData(selectedCustomerId);
      setIsSnapshotModalOpen(false);
      setSnapshotNotes('');
      toast.success('Point-in-time snapshot committed to audit ledger.');
    } catch (err: any) {
      toast.error(err.message || 'Error capturing snapshot');
    } finally {
      setIsSavingSnapshot(false);
    }
  };

  // Handle compare snapshots
  const handleRunCompare = async () => {
    if (!compareSnapA || !compareSnapB) return;
    setIsComparing(true);
    try {
      const token = getSessionToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-mock-user-id': String(user?.id || 1),
        'x-mock-user-name': user?.name || 'Bank Officer',
        'x-mock-user-role': user?.role || 'RELATIONSHIP_MANAGER',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/relationship-twin/${selectedCustomerId}/compare`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          snapshotCodeA: compareSnapA,
          snapshotCodeB: compareSnapB,
        }),
      });

      if (!res.ok) throw new Error('Failed to run comparison');
      const data = await res.json();
      setCompareResult(data);
    } catch (err: any) {
      toast.error(err.message || 'Error running snapshot comparison');
    } finally {
      setIsComparing(false);
    }
  };

  // Handle signal action update
  const handleUpdateSignal = async () => {
    if (!selectedSignal) return;
    setIsUpdatingSignal(true);
    try {
      const token = getSessionToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-mock-user-id': String(user?.id || 1),
        'x-mock-user-name': user?.name || 'Bank Officer',
        'x-mock-user-role': user?.role || 'RELATIONSHIP_MANAGER',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/relationship-twin/${selectedCustomerId}/signals/${selectedSignal.id}`, {
        method: 'PATCH',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          status: signalActionStatus,
          notes: signalNotes,
        }),
      });

      if (!res.ok) throw new Error('Failed to update signal');
      await fetchTwinData(selectedCustomerId);
      setSelectedSignal(null);
      setSignalNotes('');
      toast.success(`Signal marked as ${signalActionStatus}.`);
    } catch (err: any) {
      toast.error(err.message || 'Error updating signal');
    } finally {
      setIsUpdatingSignal(false);
    }
  };

  // Handle logging action trace
  const handleLogAction = async () => {
    if (!actionTitle.trim()) return;
    setIsLoggingAction(true);
    try {
      const token = getSessionToken();
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-mock-user-id': String(user?.id || 1),
        'x-mock-user-name': user?.name || 'Bank Officer',
        'x-mock-user-role': user?.role || 'RELATIONSHIP_MANAGER',
      };
      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const res = await fetch(`/api/relationship-twin/${selectedCustomerId}/actions`, {
        method: 'POST',
        credentials: 'include',
        headers,
        body: JSON.stringify({
          title: actionTitle,
          actionType,
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
      toast.success('Action trace committed.');
    } catch (err: any) {
      toast.error(err.message || 'Error logging action');
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
    STABLE: { bg: 'bg-emerald-50 dark:bg-emerald-950/40', text: 'text-emerald-700 dark:text-emerald-300', border: 'border-emerald-200 dark:border-emerald-800', label: 'Stable Relationship' },
    ATTENTION_REQUIRED: { bg: 'bg-amber-50 dark:bg-amber-950/40', text: 'text-amber-700 dark:text-amber-300', border: 'border-amber-200 dark:border-amber-800', label: 'Attention Required' },
    GROWING: { bg: 'bg-cyan-50 dark:bg-cyan-950/40', text: 'text-cyan-700 dark:text-cyan-300', border: 'border-cyan-200 dark:border-cyan-800', label: 'High Growth Trajectory' },
    AT_RISK: { bg: 'bg-rose-50 dark:bg-rose-950/40', text: 'text-rose-700 dark:text-rose-300', border: 'border-rose-200 dark:border-rose-800', label: 'Immediate Churn Risk' },
    DORMANT_TRENDING: { bg: 'bg-slate-100 dark:bg-slate-900', text: 'text-slate-700 dark:text-slate-300', border: 'border-slate-200 dark:border-slate-800', label: 'Trending Dormant' },
    NEW_ONBOARDED: { bg: 'bg-blue-50 dark:bg-blue-950/40', text: 'text-blue-700 dark:text-blue-300', border: 'border-blue-200 dark:border-blue-800', label: 'Newly Onboarded' },
  };

  const currentStateStyle = twinData?.state?.state
    ? stateBadgeStyles[twinData.state.state] || stateBadgeStyles.STABLE
    : stateBadgeStyles.STABLE;

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="p-3 bg-[#168C83]/10 dark:bg-[#168C83]/20 border border-[#168C83]/30 rounded-2xl animate-pulse">
          <Network className="w-10 h-10 text-[#168C83] dark:text-[#46C3B2] animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-base font-semibold text-[#142C45] dark:text-[#E8EEF5]">Synthesizing Relationship Digital Twin...</p>
          <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB] mt-1">
            Aggregating CORE score, service cases, SLA timelines, document vault, and action traces
          </p>
        </div>
      </div>
    );
  }

  if (error || !twinData) {
    return (
      <div className="p-8 max-w-4xl mx-auto text-center space-y-4">
        <div className="p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded-2xl inline-block">
          <AlertTriangle className="w-10 h-10 text-rose-600 dark:text-rose-400" />
        </div>
        <h3 className="text-lg font-bold text-[#142C45] dark:text-[#E8EEF5]">Unable to load Relationship Digital Twin</h3>
        <p className="text-sm text-[#5D6B7B] dark:text-[#A9BACB]">{error || 'Customer twin records not found'}</p>
        <button
          onClick={() => fetchTwinData(selectedCustomerId)}
          className="px-4 py-2 bg-[#168C83] hover:bg-[#127069] text-white rounded-lg text-sm font-semibold transition cursor-pointer"
        >
          Retry Synthesis
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 text-[#142C45] dark:text-[#E8EEF5]">
      {/* Top Bar: Customer Switcher & Quick Capabilities */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-4 sm:p-5 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#168C83]/10 dark:bg-[#168C83]/20 border border-[#168C83]/30 rounded-xl text-[#168C83] dark:text-[#46C3B2]">
            <Network className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-[#142C45] dark:text-[#E8EEF5]">Relationship Digital Twin</h2>
              <span className="px-2 py-0.5 text-xs font-semibold rounded bg-[#EDF1F5] dark:bg-[#101C2A] text-[#168C83] dark:text-[#46C3B2] border border-[#DCE3EA] dark:border-[#33485D]">
                Temporal State Engine
              </span>
            </div>
            <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB]">
              Deterministic temporal state machine, event streams, and real-time advisory
            </p>
          </div>
        </div>

        {/* Customer Quick Selector & Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg px-3 py-1.5 text-xs">
            <User className="w-3.5 h-3.5 text-[#5D6B7B] dark:text-[#A9BACB] mr-2" />
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
              className="bg-transparent text-[#142C45] dark:text-[#E8EEF5] focus:outline-hidden cursor-pointer pr-2 font-medium"
            >
              {sampleCustomers.map((c) => (
                <option key={c.id} value={c.id} className="bg-[#FFFFFF] dark:bg-[#162638] text-[#142C45] dark:text-[#E8EEF5]">
                  {c.name} ({c.code}) - {c.segment}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={() => fetchTwinData(selectedCustomerId)}
            title="Refresh State Model"
            className="p-2 bg-[#EDF1F5] dark:bg-[#101C2A] hover:bg-[#DCE3EA] dark:hover:bg-[#26394C] text-[#142C45] dark:text-[#E8EEF5] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg transition-colors text-xs flex items-center gap-1.5 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            onClick={() => setIsSnapshotModalOpen(true)}
            className="px-3 py-1.5 bg-[#EDF1F5] dark:bg-[#101C2A] hover:bg-[#DCE3EA] dark:hover:bg-[#26394C] text-[#142C45] dark:text-[#E8EEF5] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <Camera className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <span>Capture Snapshot</span>
          </button>

          <button
            onClick={() => {
              openDrawer({
                initialPrompt: `Explain why customer ${twinData.customer.name} (${twinData.customer.customerCode}) is currently in ${twinData.state.state} state and give me the Before You Act advisory.`,
              });
            }}
            className="px-3 py-1.5 bg-[#168C83] hover:bg-[#127069] text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Copilot Advisory</span>
          </button>

          <button
            onClick={() => {
              if (onNavigateToModule) {
                onNavigateToModule('relationship-graph');
              } else {
                window.location.href = `/relationship-graph?customerId=${twinData.customer.customerCode || selectedCustomerId}`;
              }
            }}
            className="px-3 py-1.5 bg-[#142C45] dark:bg-[#26394C] hover:bg-[#0F1B2A] text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <GitFork className="w-3.5 h-3.5" />
            <span>Explore Graph</span>
          </button>

          <button
            onClick={() => {
              if (onNavigateToModule) {
                onNavigateToModule('strategy-simulator');
              } else {
                window.location.href = `/strategy-simulator?customerId=${twinData.customer.customerCode || selectedCustomerId}`;
              }
            }}
            className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
          >
            <Compass className="w-3.5 h-3.5" />
            <span>Simulate Strategy</span>
          </button>
        </div>
      </div>

      {/* Customer Relationship Status Hero Card */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* State Badge & Core Score Card */}
        <div className="lg:col-span-1 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-5 flex flex-col justify-between shadow-xs relative overflow-hidden">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-wider text-[#5D6B7B] dark:text-[#A9BACB] font-semibold">Current State</span>
              <div className="flex items-center gap-1 text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">
                <Clock className="w-3 h-3" />
                <span>{new Date(twinData.state.calculatedAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className={`p-3.5 rounded-xl border ${currentStateStyle.bg} ${currentStateStyle.border} flex items-center justify-between`}>
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#168C83] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-[#168C83]"></span>
                </div>
                <div>
                  <h4 className={`text-sm font-bold ${currentStateStyle.text}`}>{currentStateStyle.label}</h4>
                  <p className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">Previous: {twinData.state.previousState || 'NONE'}</p>
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-[#DCE3EA] dark:border-[#33485D] flex items-center justify-between">
              <div>
                <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB]">CORE Score</p>
                <div className="flex items-baseline gap-2 mt-0.5">
                  <span className="text-2xl font-bold text-[#142C45] dark:text-[#E8EEF5] font-mono">{twinData.header.coreScore}</span>
                  <span className="text-xs text-[#5D6B7B] dark:text-[#A9BACB]">/ 100</span>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB]">Momentum</p>
                <div className="flex items-center gap-1 mt-0.5 justify-end">
                  {twinData.header.relationshipMomentum === 'POSITIVE' && (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center">
                      <ArrowUpRight className="w-3.5 h-3.5" /> +Improving
                    </span>
                  )}
                  {twinData.header.relationshipMomentum === 'NEGATIVE' && (
                    <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center">
                      <ArrowDownRight className="w-3.5 h-3.5" /> -Degrading
                    </span>
                  )}
                  {twinData.header.relationshipMomentum === 'STABLE' && (
                    <span className="text-xs font-semibold text-[#5D6B7B] dark:text-[#A9BACB] flex items-center">
                      Neutral
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#DCE3EA] dark:border-[#33485D] flex items-center justify-between text-xs text-[#5D6B7B] dark:text-[#A9BACB]">
            <span>Portfolio Value:</span>
            <span className="font-semibold text-[#142C45] dark:text-[#E8EEF5] font-mono">{formatINR(twinData.header.relationshipValue)}</span>
          </div>
        </div>

        {/* "Why This State?" & Explanation Banner */}
        <div className="lg:col-span-3 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-5 flex flex-col justify-between shadow-xs">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#168C83] dark:text-[#46C3B2]" />
                <h3 className="text-sm font-bold text-[#142C45] dark:text-[#E8EEF5]">Why This State?</h3>
              </div>
              <span className="text-xs text-[#5D6B7B] dark:text-[#A9BACB]">Automated Explainability Engine</span>
            </div>

            <div className="text-xs leading-relaxed text-[#142C45] dark:text-[#E8EEF5] bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] p-3 rounded-lg font-mono">
              {Array.isArray(twinData?.whyThisState) ? (
                twinData.whyThisState.length === 0 ? (
                  <span>Core parameters stable. No elevated risk alerts detected.</span>
                ) : (
                  <ul className="space-y-1">
                    {twinData.whyThisState.map((item: any, idx: number) => (
                      <li key={idx} className="flex items-start gap-1.5">
                        <span className="text-[#168C83] dark:text-[#46C3B2] mt-0.5">•</span>
                        <span>{typeof item === 'string' ? item : item?.reason || item?.details || JSON.stringify(item)}</span>
                      </li>
                    ))}
                  </ul>
                )
              ) : (
                <span>{String(twinData?.whyThisState || 'Core parameters stable.')}</span>
              )}
            </div>

            {/* What Changed in 7 / 30 days */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
              <div className="bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg p-2.5">
                <p className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">Score Shift (7D)</p>
                <div className="flex items-center gap-1.5 mt-1 font-mono">
                  {(twinData?.whatChanged as any)?.scoreChange >= 0 ? (
                    <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center">
                      <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +{(twinData?.whatChanged as any)?.scoreChange || 0} pts
                    </span>
                  ) : (
                    <span className="text-sm font-bold text-rose-600 dark:text-rose-400 flex items-center">
                      <TrendingDown className="w-3.5 h-3.5 mr-0.5" /> {(twinData?.whatChanged as any)?.scoreChange || 0} pts
                    </span>
                  )}
                </div>
              </div>

              <div className="bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg p-2.5">
                <p className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">Service & Case SLA</p>
                <div className="flex items-center gap-1.5 mt-1 font-mono">
                  <span className={`text-sm font-bold ${(twinData?.header as any)?.slaAtRiskCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-[#142C45] dark:text-[#E8EEF5]'}`}>
                    {twinData?.header?.openCasesCount || 0} Open ({((twinData?.header as any)?.slaAtRiskCount) || 0} SLA Risk)
                  </span>
                </div>
              </div>

              <div className="bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg p-2.5">
                <p className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">KYC & Vault Status</p>
                <div className="flex items-center gap-1.5 mt-1 font-mono">
                  <span className={`text-sm font-bold ${(twinData?.header as any)?.pendingDocumentsCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {(twinData?.header as any)?.pendingDocumentsCount > 0
                      ? `${(twinData?.header as any)?.pendingDocumentsCount} Action Req.`
                      : 'All Verified'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#DCE3EA] dark:border-[#33485D] flex flex-wrap items-center justify-between text-xs text-[#5D6B7B] dark:text-[#A9BACB] gap-2">
            <div className="flex items-center gap-2">
              <span>Assigned RM:</span>
              <span className="text-[#142C45] dark:text-[#E8EEF5] font-semibold">{twinData.customer.relationshipManagerName || 'Aditya Raj'}</span>
              <span>·</span>
              <span>Branch:</span>
              <span className="text-[#142C45] dark:text-[#E8EEF5] font-semibold">{twinData.customer.branchName || 'Fort Branch, Mumbai'}</span>
            </div>
            {onNavigateToCustomer && (
              <button
                onClick={() => onNavigateToCustomer(twinData.customer.id)}
                className="text-[#168C83] dark:text-[#46C3B2] hover:underline flex items-center gap-1 font-semibold transition cursor-pointer"
              >
                <span>View Full Customer 360</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center border-b border-[#DCE3EA] dark:border-[#33485D] gap-1 overflow-x-auto">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'border-[#168C83] text-[#168C83] dark:text-[#46C3B2]'
              : 'border-transparent text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#142C45] dark:hover:text-[#E8EEF5]'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>State & Health Pillars</span>
        </button>

        <button
          onClick={() => setActiveTab('value')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'value'
              ? 'border-[#168C83] text-[#168C83] dark:text-[#46C3B2]'
              : 'border-transparent text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#142C45] dark:hover:text-[#E8EEF5]'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span>Relationship Value & CORE Score</span>
          <span className="px-1.5 py-0.2 text-[10px] bg-[#168C83]/10 text-[#168C83] dark:text-[#46C3B2] rounded font-mono">
            Phase 32
          </span>
        </button>

        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'timeline'
              ? 'border-[#168C83] text-[#168C83] dark:text-[#46C3B2]'
              : 'border-transparent text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#142C45] dark:hover:text-[#E8EEF5]'
          }`}
        >
          <History className="w-4 h-4" />
          <span>Temporal Event Stream</span>
          <span className="px-1.5 py-0.2 text-[10px] bg-[#EDF1F5] dark:bg-[#101C2A] text-[#5D6B7B] dark:text-[#A9BACB] rounded-full">
            {twinData?.timeline?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('snapshots')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'snapshots'
              ? 'border-[#168C83] text-[#168C83] dark:text-[#46C3B2]'
              : 'border-transparent text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#142C45] dark:hover:text-[#E8EEF5]'
          }`}
        >
          <Camera className="w-4 h-4" />
          <span>Snapshots & Time Travel</span>
        </button>

        <button
          onClick={() => setActiveTab('actions')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'actions'
              ? 'border-[#168C83] text-[#168C83] dark:text-[#46C3B2]'
              : 'border-transparent text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#142C45] dark:hover:text-[#E8EEF5]'
          }`}
        >
          <Send className="w-4 h-4" />
          <span>Action Traces</span>
        </button>

        <button
          onClick={() => setActiveTab('portfolio')}
          className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition flex items-center gap-2 whitespace-nowrap cursor-pointer ${
            activeTab === 'portfolio'
              ? 'border-[#168C83] text-[#168C83] dark:text-[#46C3B2]'
              : 'border-transparent text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#142C45] dark:hover:text-[#E8EEF5]'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Portfolio Distribution</span>
        </button>
      </div>

      <div className="space-y-6">
        {/* TAB: RELATIONSHIP VALUE & CORE SCORE */}
        {activeTab === 'value' && (
          <div className="space-y-4">
            <RelationshipValueProfile
              customerId={selectedCustomerId}
              onNavigateToSimulator={() => {
                if (onNavigateToModule) onNavigateToModule('strategy-simulator');
              }}
            />
          </div>
        )}

        {/* TAB: OVERVIEW & HEALTH PILLARS & BEFORE YOU ACT */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* "BEFORE YOU ACT" ADVISORY PANEL */}
            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/40 rounded-xl p-5 space-y-4 text-[#142C45] dark:text-[#E8EEF5]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-amber-500/10 dark:bg-amber-500/20 border border-amber-500/30 rounded-xl text-amber-700 dark:text-amber-400">
                    <ShieldAlert className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-900 dark:text-amber-300">
                      "Before You Act" Contextual Relationship Guardrails
                    </h3>
                    <p className="text-xs text-amber-800/80 dark:text-amber-400/80">
                      Mandatory briefing for RM, Service Agents, and Officers prior to reaching out or pitching
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsActionModalOpen(true)}
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Action Taken</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-2">
                  <h4 className="font-semibold text-amber-900 dark:text-amber-300 flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                    Active Precautions & Risk Factors:
                  </h4>
                  <ul className="space-y-1.5">
                    {(twinData.beforeYouAct?.recommendedPrecautions || []).map((prec, i) => (
                      <li key={i} className="flex items-start gap-2 text-[#5D6B7B] dark:text-[#A9BACB]">
                        <span className="text-amber-600 dark:text-amber-400 mt-0.5">•</span>
                        <span>{prec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-2">
                  <h4 className="font-semibold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                    <CheckCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    Recommended Next Best Steps:
                  </h4>
                  <ul className="space-y-1.5">
                    {(((twinData?.beforeYouAct as any)?.nextBestActions) || []).map((nba: any, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-[#5D6B7B] dark:text-[#A9BACB]">
                        <span className="text-emerald-600 dark:text-emerald-400 mt-0.5">✓</span>
                        <span>{nba}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* 4 PILLARS HEALTH GAUGES */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#5D6B7B] dark:text-[#A9BACB] font-medium">Financial Health</span>
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 font-mono">{twinData.healthBreakdown.financialHealth}/100</span>
                </div>
                <div className="w-full bg-[#EDF1F5] dark:bg-[#101C2A] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-500 h-2 rounded-full"
                    style={{ width: `${twinData.healthBreakdown.financialHealth}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">Balance stability, debt-to-income, credit health</p>
              </div>

              <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#5D6B7B] dark:text-[#A9BACB] font-medium">Engagement Momentum</span>
                  <span className="text-xs font-bold text-[#168C83] dark:text-[#46C3B2] font-mono">{twinData.healthBreakdown.engagementMomentum}/100</span>
                </div>
                <div className="w-full bg-[#EDF1F5] dark:bg-[#101C2A] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-[#168C83] h-2 rounded-full"
                    style={{ width: `${twinData.healthBreakdown.engagementMomentum}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">Transaction velocity, app logins, meeting cadence</p>
              </div>

              <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#5D6B7B] dark:text-[#A9BACB] font-medium">Compliance & Trust</span>
                  <span className="text-xs font-bold text-blue-600 dark:text-blue-400 font-mono">{twinData.healthBreakdown.complianceAndTrust}/100</span>
                </div>
                <div className="w-full bg-[#EDF1F5] dark:bg-[#101C2A] rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-blue-500 h-2 rounded-full"
                    style={{ width: `${twinData.healthBreakdown.complianceAndTrust}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">cKYC compliance, document renewals, AML risk</p>
              </div>

              <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-4 space-y-3 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[#5D6B7B] dark:text-[#A9BACB] font-medium">Service Satisfaction</span>
                  <span className={`text-xs font-bold font-mono ${twinData.healthBreakdown.serviceSatisfaction < 70 ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                    {twinData.healthBreakdown.serviceSatisfaction}/100
                  </span>
                </div>
                <div className="w-full bg-[#EDF1F5] dark:bg-[#101C2A] rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-2 rounded-full ${twinData.healthBreakdown.serviceSatisfaction < 70 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${twinData.healthBreakdown.serviceSatisfaction}%` }}
                  ></div>
                </div>
                <p className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">Resolution TAT, grievance frequency, NPS score</p>
              </div>
            </div>

            {/* ACTIVE SIGNALS & SURVEILLANCE BOARD */}
            <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Activity className="w-4 h-4 text-[#168C83] dark:text-[#46C3B2]" />
                  <h3 className="text-sm font-bold text-[#142C45] dark:text-[#E8EEF5]">Active Signals & Surveillance Triggers</h3>
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-[#EDF1F5] dark:bg-[#101C2A] text-[#142C45] dark:text-[#E8EEF5]">
                    {twinData?.signals?.length || 0} Detected
                  </span>
                </div>
                <span className="text-xs text-[#5D6B7B] dark:text-[#A9BACB]">Deterministic Rule Engine & Signal Listener</span>
              </div>

              {(!twinData?.signals || twinData.signals.length === 0) ? (
                <div className="text-center py-8 text-[#5D6B7B] dark:text-[#A9BACB] text-xs">
                  No active anomaly signals detected. Relationship parameters operating normally.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {twinData.signals.map((sig) => (
                    <div
                      key={sig.id}
                      className="p-3.5 bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] hover:border-[#168C83] rounded-xl transition flex flex-col md:flex-row md:items-center justify-between gap-3"
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`p-2 rounded-lg mt-0.5 ${
                            sig.severity === 'CRITICAL'
                              ? 'bg-rose-50 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                              : sig.severity === 'HIGH'
                              ? 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800'
                              : 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800'
                          }`}
                        >
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h4 className="text-xs font-bold text-[#142C45] dark:text-[#E8EEF5]">{sig.title}</h4>
                            <span
                              className={`px-1.5 py-0.5 text-[10px] font-bold rounded ${
                                sig.severity === 'CRITICAL'
                                  ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300'
                                  : sig.severity === 'HIGH'
                                  ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                              }`}
                            >
                              {sig.severity}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 text-[10px] rounded font-semibold ${
                                sig.status === 'ACTIVE'
                                  ? 'bg-[#168C83]/10 dark:bg-[#168C83]/20 text-[#168C83] dark:text-[#46C3B2] border border-[#168C83]/30'
                                  : sig.status === 'RESOLVED'
                                  ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300'
                                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                              }`}
                            >
                              {sig.status}
                            </span>
                          </div>
                          <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB] mt-1">{sig.description}</p>
                          {sig.recommendedAction && (
                            <p className="text-[11px] text-[#168C83] dark:text-[#46C3B2] mt-1 font-medium">
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
                          className="px-2.5 py-1 bg-[#EDF1F5] dark:bg-[#162638] hover:bg-[#DCE3EA] dark:hover:bg-[#26394C] text-[#142C45] dark:text-[#E8EEF5] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg text-xs font-medium transition cursor-pointer"
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
          <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-[#142C45] dark:text-[#E8EEF5]">Temporal Event Stream</h3>
                <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB]">
                  Chronological ledger of customer interactions, service tickets, score calculations, and alerts
                </p>
              </div>

              {/* Event Filter */}
              <div className="flex items-center gap-2">
                <Filter className="w-3.5 h-3.5 text-[#5D6B7B] dark:text-[#A9BACB]" />
                <select
                  value={timelineFilter}
                  onChange={(e) => setTimelineFilter(e.target.value)}
                  className="bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg px-2.5 py-1 text-xs text-[#142C45] dark:text-[#E8EEF5]"
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

            <div className="space-y-3 relative before:absolute before:inset-0 before:left-3.5 before:w-0.5 before:bg-[#DCE3EA] dark:before:bg-[#33485D]">
              {filteredEvents.map((evt, idx) => (
                <div key={evt.id || idx} className="relative flex items-start gap-4 pl-8">
                  <div
                    className={`absolute left-2 top-1.5 w-3.5 h-3.5 rounded-full border-2 border-[#FFFFFF] dark:border-[#162638] ${
                      evt.impact === 'NEGATIVE'
                        ? 'bg-rose-500'
                        : evt.impact === 'POSITIVE'
                        ? 'bg-emerald-500'
                        : 'bg-[#168C83]'
                    }`}
                  />
                  <div className="w-full bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-3.5 space-y-1.5 hover:border-[#168C83] transition">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#142C45] dark:text-[#E8EEF5]">{evt.title}</span>
                      <span className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] font-mono">
                        {new Date(evt.eventTimestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB]">{evt.description}</p>
                    <div className="flex items-center gap-3 pt-1 text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">
                      <span>Source: {evt.sourceModule}</span>
                      <span>•</span>
                      <span>Actor: {evt.actorName || 'System'}</span>
                      {evt.scoreDelta !== 0 && (
                        <>
                          <span>•</span>
                          <span className={evt.scoreDelta > 0 ? 'text-emerald-600 dark:text-emerald-400 font-semibold' : 'text-rose-600 dark:text-rose-400 font-semibold'}>
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
            <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-5 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 className="text-sm font-bold text-[#142C45] dark:text-[#E8EEF5] flex items-center gap-2">
                    <GitCompare className="w-4 h-4 text-[#168C83] dark:text-[#46C3B2]" />
                    Time-Travel Snapshot Comparison
                  </h3>
                  <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB]">
                    Deterministically compare customer state between two temporal points in history
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#5D6B7B] dark:text-[#A9BACB]">From:</span>
                    <select
                      value={compareSnapA}
                      onChange={(e) => setCompareSnapA(e.target.value)}
                      className="bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg px-2 py-1 text-[#142C45] dark:text-[#E8EEF5]"
                    >
                      {twinData.snapshots.map((s) => (
                        <option key={s.snapshotCode} value={s.snapshotCode}>
                          {s.snapshotCode} ({new Date(s.capturedAt).toLocaleDateString()}) - {s.state}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-[#5D6B7B] dark:text-[#A9BACB]">To:</span>
                    <select
                      value={compareSnapB}
                      onChange={(e) => setCompareSnapB(e.target.value)}
                      className="bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg px-2 py-1 text-[#142C45] dark:text-[#E8EEF5]"
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
                    className="px-3 py-1 bg-[#168C83] hover:bg-[#127069] disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition cursor-pointer"
                  >
                    {isComparing ? 'Comparing...' : 'Compare Diffs'}
                  </button>
                </div>
              </div>

              {/* Comparison Diff Display */}
              {compareResult && (
                <div className="bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-4 space-y-4">
                  <div className="flex items-center justify-between border-b border-[#DCE3EA] dark:border-[#33485D] pb-3">
                    <h4 className="text-xs font-bold text-[#142C45] dark:text-[#E8EEF5]">
                      Comparison: {compareResult.snapA.code} vs {compareResult.snapB.code}
                    </h4>
                    <span className="text-xs font-semibold text-[#5D6B7B] dark:text-[#A9BACB]">
                      State: {compareResult.snapA.state} ➔ {compareResult.snapB.state}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                    <div className="p-3 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl">
                      <p className="text-[#5D6B7B] dark:text-[#A9BACB]">CORE Score Change</p>
                      <p className="text-lg font-bold mt-1 font-mono">
                        {compareResult.scoreDelta >= 0 ? (
                          <span className="text-emerald-600 dark:text-emerald-400">+{compareResult.scoreDelta}</span>
                        ) : (
                          <span className="text-rose-600 dark:text-rose-400">{compareResult.scoreDelta}</span>
                        )}
                      </p>
                    </div>

                    <div className="p-3 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl">
                      <p className="text-[#5D6B7B] dark:text-[#A9BACB]">Open Cases Delta</p>
                      <p className="text-lg font-bold text-[#142C45] dark:text-[#E8EEF5] mt-1 font-mono">{compareResult.metricsDelta.casesDelta}</p>
                    </div>

                    <div className="p-3 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl">
                      <p className="text-[#5D6B7B] dark:text-[#A9BACB]">Products Count Delta</p>
                      <p className="text-lg font-bold text-[#142C45] dark:text-[#E8EEF5] mt-1 font-mono">{compareResult.metricsDelta.productsDelta}</p>
                    </div>

                    <div className="p-3 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl">
                      <p className="text-[#5D6B7B] dark:text-[#A9BACB]">Intervening Events</p>
                      <p className="text-lg font-bold text-[#168C83] dark:text-[#46C3B2] mt-1 font-mono">{compareResult.interveningEventsCount}</p>
                    </div>
                  </div>

                  {compareResult.eventsBetween && compareResult.eventsBetween.length > 0 && (
                    <div className="space-y-2 pt-2">
                      <p className="text-xs font-semibold text-[#142C45] dark:text-[#E8EEF5]">Key Events Occurred in Period:</p>
                      <div className="space-y-1.5">
                        {compareResult.eventsBetween.map((e: any, i: number) => (
                          <div key={i} className="text-xs text-[#5D6B7B] dark:text-[#A9BACB] flex items-center justify-between bg-[#FFFFFF] dark:bg-[#162638] p-2 rounded-lg border border-[#DCE3EA] dark:border-[#33485D]">
                            <span>{e.title}</span>
                            <span className="font-mono text-[10px]">{new Date(e.eventTimestamp).toLocaleDateString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* List of Captured Snapshots */}
            <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-5 space-y-4 shadow-xs">
              <h3 className="text-sm font-bold text-[#142C45] dark:text-[#E8EEF5]">Saved Snapshot Ledger</h3>
              <div className="space-y-2.5">
                {twinData.snapshots.map((s) => (
                  <div
                    key={s.id}
                    className="p-3.5 bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#142C45] dark:text-[#E8EEF5] font-mono">{s.snapshotCode}</span>
                        <span className="px-2 py-0.5 text-[10px] rounded bg-[#EDF1F5] dark:bg-[#162638] text-[#142C45] dark:text-[#E8EEF5] font-semibold border border-[#DCE3EA] dark:border-[#33485D]">
                          {s.state}
                        </span>
                        <span className="text-[#5D6B7B] dark:text-[#A9BACB]">CORE Score: {s.coreScore}</span>
                      </div>
                      <p className="text-[#5D6B7B] dark:text-[#A9BACB]">{s.summaryNotes || 'System checkpoint snapshot'}</p>
                    </div>

                    <div className="text-right text-[#5D6B7B] dark:text-[#A9BACB] text-[11px]">
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
          <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-5 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#142C45] dark:text-[#E8EEF5]">Closed-Loop Action Trace</h3>
                <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB]">
                  Audited record of operational and relationship interventions triggered from Twin alerts
                </p>
              </div>
              <button
                onClick={() => setIsActionModalOpen(true)}
                className="px-3 py-1.5 bg-[#168C83] hover:bg-[#127069] text-white rounded-lg text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Action</span>
              </button>
            </div>

            {(!twinData?.actions || twinData.actions.length === 0) ? (
              <div className="text-center py-8 text-[#5D6B7B] dark:text-[#A9BACB] text-xs">
                No actions logged yet. Use "Log Action" to record proactive outreach, waiver, or follow-up.
              </div>
            ) : (
              <div className="space-y-2.5">
                {twinData.actions.map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-[#142C45] dark:text-[#E8EEF5]">{act.title}</h4>
                        <span className="px-1.5 py-0.5 text-[10px] bg-[#EDF1F5] dark:bg-[#162638] text-[#142C45] dark:text-[#E8EEF5] rounded font-semibold border border-[#DCE3EA] dark:border-[#33485D]">
                          {act.actionType}
                        </span>
                        <span className="px-1.5 py-0.5 text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded font-semibold">
                          {act.status}
                        </span>
                      </div>
                      <p className="text-[#5D6B7B] dark:text-[#A9BACB]">{act.description}</p>
                    </div>

                    <div className="text-right text-[#5D6B7B] dark:text-[#A9BACB] text-[11px]">
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
            <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-5 space-y-4 shadow-xs">
              <h3 className="text-sm font-bold text-[#142C45] dark:text-[#E8EEF5]">Portfolio Digital Twin Distribution</h3>
              <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB]">
                Cross-portfolio aggregation of relationship states, critical signals, and intervention rates
              </p>

              {portfolioAnalytics ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                  {Object.entries(portfolioAnalytics.stateDistribution || {}).map(([stateKey, count]: [string, any]) => (
                    <div key={stateKey} className="bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-4 space-y-1">
                      <span className="text-xs font-semibold text-[#5D6B7B] dark:text-[#A9BACB] uppercase tracking-wider">{stateKey.replace('_', ' ')}</span>
                      <p className="text-2xl font-bold text-[#142C45] dark:text-[#E8EEF5] font-mono">{count}</p>
                      <p className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">Customers in state</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-xs text-[#5D6B7B] dark:text-[#A9BACB]">Loading portfolio metrics...</div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* CAPTURE SNAPSHOT MODAL */}
      {isSnapshotModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-5 max-w-md w-full space-y-4 shadow-xl text-[#142C45] dark:text-[#E8EEF5]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#142C45] dark:text-[#E8EEF5] flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Capture State Snapshot
              </h3>
              <button onClick={() => setIsSnapshotModalOpen(false)} className="text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#142C45] dark:hover:text-[#E8EEF5] cursor-pointer">
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB]">
              Captures a frozen point-in-time state of {twinData.customer.name}'s CORE score ({twinData.header.coreScore}), state ({twinData.state.state}), active cases, and product holdings for future audit and comparison.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-medium text-[#142C45] dark:text-[#E8EEF5]">Snapshot Notes / Purpose:</label>
              <textarea
                value={snapshotNotes}
                onChange={(e) => setSnapshotNotes(e.target.value)}
                placeholder="e.g., Pre-annual review checkpoint before expanding term deposit"
                className="w-full bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg p-2.5 text-xs text-[#142C45] dark:text-[#E8EEF5] focus:outline-none focus:border-[#168C83] h-20"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsSnapshotModalOpen(false)}
                className="px-3 py-1.5 bg-[#EDF1F5] dark:bg-[#101C2A] hover:bg-[#DCE3EA] dark:hover:bg-[#26394C] text-[#142C45] dark:text-[#E8EEF5] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleCaptureSnapshot}
                disabled={isSavingSnapshot}
                className="px-4 py-1.5 bg-[#168C83] hover:bg-[#127069] disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs"
              >
                {isSavingSnapshot ? 'Capturing...' : 'Save Snapshot'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SIGNAL ACTION MODAL */}
      {selectedSignal && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-5 max-w-md w-full space-y-4 shadow-xl text-[#142C45] dark:text-[#E8EEF5]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#142C45] dark:text-[#E8EEF5] flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                Signal Action: {selectedSignal.title}
              </h3>
              <button onClick={() => setSelectedSignal(null)} className="text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#142C45] dark:hover:text-[#E8EEF5] cursor-pointer">
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB]">{selectedSignal.description}</p>

            <div className="space-y-2 text-xs">
              <label className="font-medium text-[#142C45] dark:text-[#E8EEF5]">Set New Status:</label>
              <div className="flex items-center gap-2">
                {(['ACKNOWLEDGED', 'RESOLVED', 'DISMISSED'] as const).map((st) => (
                  <button
                    key={st}
                    onClick={() => setSignalActionStatus(st)}
                    className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition cursor-pointer ${
                      signalActionStatus === st
                        ? 'bg-[#168C83] text-white border-[#168C83]'
                        : 'bg-[#F8FAFC] dark:bg-[#101C2A] text-[#5D6B7B] dark:text-[#A9BACB] border-[#DCE3EA] dark:border-[#33485D]'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <div className="pt-2 space-y-1">
                <label className="font-medium text-[#142C45] dark:text-[#E8EEF5]">Officer Notes:</label>
                <textarea
                  value={signalNotes}
                  onChange={(e) => setSignalNotes(e.target.value)}
                  placeholder="e.g., Called customer, grievance escalated to operations supervisor"
                  className="w-full bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg p-2 text-xs text-[#142C45] dark:text-[#E8EEF5] focus:outline-none focus:border-[#168C83] h-16"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedSignal(null)}
                className="px-3 py-1.5 bg-[#EDF1F5] dark:bg-[#101C2A] hover:bg-[#DCE3EA] dark:hover:bg-[#26394C] text-[#142C45] dark:text-[#E8EEF5] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateSignal}
                disabled={isUpdatingSignal}
                className="px-4 py-1.5 bg-[#168C83] hover:bg-[#127069] text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs"
              >
                {isUpdatingSignal ? 'Updating...' : 'Confirm Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* LOG ACTION TRACE MODAL */}
      {isActionModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-5 max-w-md w-full space-y-4 shadow-xl text-[#142C45] dark:text-[#E8EEF5]">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#142C45] dark:text-[#E8EEF5] flex items-center gap-2">
                <Send className="w-4 h-4 text-[#168C83] dark:text-[#46C3B2]" />
                Log Closed-Loop Action
              </h3>
              <button onClick={() => setIsActionModalOpen(false)} className="text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#142C45] dark:hover:text-[#E8EEF5] cursor-pointer">
                <XCircle className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="font-medium text-[#142C45] dark:text-[#E8EEF5]">Action Title:</label>
                <input
                  type="text"
                  value={actionTitle}
                  onChange={(e) => setActionTitle(e.target.value)}
                  placeholder="e.g., Proactive call regarding pending grievance SLA"
                  className="w-full bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg p-2.5 text-xs text-[#142C45] dark:text-[#E8EEF5] focus:outline-none focus:border-[#168C83]"
                />
              </div>

              <div className="space-y-1">
                <label className="font-medium text-[#142C45] dark:text-[#E8EEF5]">Action Type:</label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  className="w-full bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg p-2.5 text-xs text-[#142C45] dark:text-[#E8EEF5]"
                >
                  <option value="PROACTIVE_OUTREACH">Proactive Outreach / Call</option>
                  <option value="GRIEVANCE_ESCALATION">Grievance Escalation</option>
                  <option value="DOCUMENT_COLLECTION">Document Collection Follow-up</option>
                  <option value="FEE_WAIVER">Fee / Charge Waiver</option>
                  <option value="PORTFOLIO_REVIEW">Portfolio Review Meeting</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-medium text-[#142C45] dark:text-[#E8EEF5]">Description & Outcome:</label>
                <textarea
                  value={actionDescription}
                  onChange={(e) => setActionDescription(e.target.value)}
                  placeholder="Summary of discussion, customer reassurance, or operational ticket created..."
                  className="w-full bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg p-2.5 text-xs text-[#142C45] dark:text-[#E8EEF5] focus:outline-none focus:border-[#168C83] h-18"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setIsActionModalOpen(false)}
                className="px-3 py-1.5 bg-[#EDF1F5] dark:bg-[#101C2A] hover:bg-[#DCE3EA] dark:hover:bg-[#26394C] text-[#142C45] dark:text-[#E8EEF5] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg text-xs font-medium transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleLogAction}
                disabled={isLoggingAction || !actionTitle}
                className="px-4 py-1.5 bg-[#168C83] hover:bg-[#127069] disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition cursor-pointer shadow-xs"
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
