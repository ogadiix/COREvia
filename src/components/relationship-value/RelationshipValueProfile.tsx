import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  AlertCircle,
  Sparkles,
  ShieldCheck,
  Compass,
  History,
  Layers,
  Activity,
  Award,
  Calendar,
  ExternalLink,
  Info,
  CheckCircle2,
  RefreshCw,
  Coins,
  Briefcase,
  HelpCircle,
} from 'lucide-react';
import { api } from '../../lib/api';
import {
  RelationshipValueProfileDTO,
  RelationshipDimensionItem,
  RelationshipValueHistoryDTO,
  DimensionChangeType,
} from '../../types/relationshipValue.types';

interface RelationshipValueProfileProps {
  customerId: number;
  scenarioId?: string;
  onNavigateToSimulator?: (scenarioId?: string) => void;
  onNavigateToTrace?: (traceId: string) => void;
  compact?: boolean;
}

export const RelationshipValueProfile: React.FC<RelationshipValueProfileProps> = ({
  customerId,
  scenarioId,
  onNavigateToSimulator,
  onNavigateToTrace,
  compact = false,
}) => {
  const [profile, setProfile] = useState<RelationshipValueProfileDTO | null>(null);
  const [history, setHistory] = useState<RelationshipValueHistoryDTO | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'profile' | 'breakdown' | 'history'>('profile');

  const fetchProfileData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (scenarioId) {
        const res = await api.compareRelationshipValueScenario(customerId, scenarioId);
        if (res.success) setProfile(res.data);
      } else {
        const res = await api.getRelationshipValueProfile(customerId);
        if (res.success) setProfile(res.data);
      }

      // Fetch history non-blocking
      try {
        const histRes = await api.getRelationshipValueHistory(customerId);
        if (histRes.success) setHistory(histRes.data);
      } catch (histErr) {
        console.warn('History fetch notice:', histErr);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to load relationship value profile');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchProfileData();
    }
  }, [customerId, scenarioId]);

  if (isLoading) {
    return (
      <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-6 flex items-center justify-center min-h-[220px]">
        <div className="flex items-center space-x-3 text-[#5D6B7B] dark:text-[#A9BACB]">
          <RefreshCw className="w-5 h-5 animate-spin text-[#168C83] dark:text-[#46C3B2]" />
          <span className="text-sm font-medium">Resolving relationship value dimensions...</span>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-6 text-center">
        <AlertCircle className="w-8 h-8 text-rose-500 mx-auto mb-2" />
        <p className="text-sm text-[#142C45] dark:text-[#E8EEF5] font-medium">{error || 'Relationship value profile unavailable'}</p>
        <button
          onClick={fetchProfileData}
          className="mt-3 px-3 py-1.5 bg-[#EDF1F5] dark:bg-[#101C2A] hover:bg-[#DCE3EA] dark:hover:bg-[#26394C] text-xs font-semibold text-[#142C45] dark:text-[#E8EEF5] rounded border border-[#DCE3EA] dark:border-[#33485D] inline-flex items-center space-x-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const { currentSnapshot, scenarioSnapshot, dimensions, supportingSignals, valueBreakdown } = profile;

  const renderBadge = (changeType: DimensionChangeType, changeValue: string | number) => {
    switch (changeType) {
      case 'IMPROVED':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-3 h-3" />
            <span>{changeValue}</span>
          </span>
        );
      case 'DECLINED':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <TrendingDown className="w-3 h-3" />
            <span>{changeValue}</span>
          </span>
        );
      case 'NOT_CALCULATED':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-300 border border-amber-500/20" title="Current simulation rules do not model monetary relationship value.">
            <HelpCircle className="w-3 h-3" />
            <span>Not Recalculated</span>
          </span>
        );
      case 'UNCHANGED':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-semibold bg-[#EDF1F5] dark:bg-[#101C2A] text-[#5D6B7B] dark:text-[#A9BACB] border border-[#DCE3EA] dark:border-[#33485D]">
            <Minus className="w-3 h-3" />
            <span>Unchanged</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl overflow-hidden shadow-xs text-[#142C45] dark:text-[#E8EEF5]">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 border-b border-[#DCE3EA] dark:border-[#33485D] bg-[#F8FAFC] dark:bg-[#0F1B2A] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <div className="p-1.5 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
              <Coins className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-[#142C45] dark:text-[#E8EEF5] tracking-tight">Relationship Value & CORE Score</h3>
            {profile.isSimulated && (
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                Simulation Comparison
              </span>
            )}
          </div>
          <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB] mt-1">
            {profile.customerName} ({profile.customerCode}) • Deterministic multi-dimensional health & value profile
          </p>
        </div>

        {/* Tab Controls & Simulation action */}
        <div className="flex items-center space-x-2">
          <div className="flex bg-[#EDF1F5] dark:bg-[#101C2A] p-0.5 rounded-lg border border-[#DCE3EA] dark:border-[#33485D] text-xs">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                activeTab === 'profile' ? 'bg-[#168C83] text-white' : 'text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#142C45] dark:hover:text-[#E8EEF5]'
              }`}
            >
              Dimensions
            </button>
            <button
              onClick={() => setActiveTab('breakdown')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                activeTab === 'breakdown' ? 'bg-[#168C83] text-white' : 'text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#142C45] dark:hover:text-[#E8EEF5]'
              }`}
            >
              Value Basis
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                activeTab === 'history' ? 'bg-[#168C83] text-white' : 'text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#142C45] dark:hover:text-[#E8EEF5]'
              }`}
            >
              History
            </button>
          </div>

          {onNavigateToSimulator && (
            <button
              onClick={() => onNavigateToSimulator(scenarioId)}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-xs font-semibold inline-flex items-center space-x-1.5 transition-all"
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Simulate</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-[#DCE3EA] dark:border-[#33485D] bg-[#FFFFFF] dark:bg-[#162638] divide-x divide-[#DCE3EA] dark:divide-[#33485D]">
        <div className="p-3 sm:p-4">
          <span className="text-[11px] font-semibold text-[#5D6B7B] dark:text-[#A9BACB] uppercase tracking-wider block">Relationship Value</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-300 font-mono">
              {currentSnapshot.relationshipValueFormatted}
            </span>
          </div>
          <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] block mt-0.5">Customer Master Ledger</span>
        </div>

        <div className="p-3 sm:p-4">
          <span className="text-[11px] font-semibold text-[#5D6B7B] dark:text-[#A9BACB] uppercase tracking-wider block">CORE Score</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold text-[#168C83] dark:text-[#46C3B2] font-mono">
              {scenarioSnapshot ? scenarioSnapshot.coreScore : currentSnapshot.coreScore}
            </span>
            {scenarioSnapshot && scenarioSnapshot.coreScore !== currentSnapshot.coreScore && (
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                +{scenarioSnapshot.coreScore - currentSnapshot.coreScore}
              </span>
            )}
          </div>
          <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] block mt-0.5">
            {scenarioSnapshot ? scenarioSnapshot.relationshipMomentum : currentSnapshot.relationshipMomentum} Momentum
          </span>
        </div>

        <div className="p-3 sm:p-4">
          <span className="text-[11px] font-semibold text-[#5D6B7B] dark:text-[#A9BACB] uppercase tracking-wider block">Product Depth</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold text-[#142C45] dark:text-[#E8EEF5] font-mono">
              {scenarioSnapshot ? scenarioSnapshot.productDepth : currentSnapshot.productDepth}
            </span>
            <span className="text-xs text-[#5D6B7B] dark:text-[#A9BACB]">Products</span>
          </div>
          <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] block mt-0.5">Core Banking Holdings</span>
        </div>

        <div className="p-3 sm:p-4">
          <span className="text-[11px] font-semibold text-[#5D6B7B] dark:text-[#A9BACB] uppercase tracking-wider block">Service Health</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className={`text-base sm:text-lg font-bold font-mono ${
              ['EXCELLENT', 'GOOD'].includes(scenarioSnapshot ? scenarioSnapshot.serviceHealth : currentSnapshot.serviceHealth)
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-amber-600 dark:text-amber-400'
            }`}>
              {scenarioSnapshot ? scenarioSnapshot.serviceHealth : currentSnapshot.serviceHealth}
            </span>
          </div>
          <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] block mt-0.5">Service Desk SLA Track</span>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="p-4 sm:p-5">
        {/* TAB 1: DIMENSIONS COMPARISON */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            {/* Context Explanation */}
            {profile.isSimulated && (
              <div className="p-3 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-800/40 text-xs text-indigo-900 dark:text-indigo-200 flex items-start space-x-2.5">
                <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-indigo-800 dark:text-indigo-300">Scenario Analysis: </span>
                  {profile.explanation}
                </div>
              </div>
            )}

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#DCE3EA] dark:border-[#33485D] text-[#5D6B7B] dark:text-[#A9BACB] font-semibold tracking-wider uppercase text-[10px]">
                    <th className="py-2.5 px-3">Relationship Dimension</th>
                    <th className="py-2.5 px-3">Current</th>
                    {profile.isSimulated && <th className="py-2.5 px-3 text-indigo-600 dark:text-indigo-300">Simulated Scenario</th>}
                    <th className="py-2.5 px-3">Impact / Change</th>
                    <th className="py-2.5 px-3">Source Engine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DCE3EA] dark:divide-[#33485D]/60 font-medium">
                  {dimensions.map((dim) => (
                    <tr key={dim.dimension} className="hover:bg-[#F8FAFC] dark:hover:bg-[#101C2A] transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-[#142C45] dark:text-[#E8EEF5]">{dim.label}</div>
                        <div className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] mt-0.5 line-clamp-1">{dim.explanation}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-[#142C45] dark:text-[#E8EEF5]">{dim.currentValue}</td>
                      {profile.isSimulated && (
                        <td className="py-3 px-3 font-mono font-bold text-indigo-600 dark:text-indigo-300">{dim.scenarioValue}</td>
                      )}
                      <td className="py-3 px-3">
                        {renderBadge(dim.changeType, dim.change)}
                      </td>
                      <td className="py-3 px-3 text-[#5D6B7B] dark:text-[#A9BACB] text-[11px]">{dim.sourceEngine}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked View */}
            <div className="md:hidden space-y-3">
              {dimensions.map((dim) => (
                <div key={dim.dimension} className="p-3 bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-[#DCE3EA] dark:border-[#33485D] pb-1.5">
                    <span className="font-bold text-[#142C45] dark:text-[#E8EEF5]">{dim.label}</span>
                    <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB]">{dim.sourceEngine}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono">
                    <div className="bg-[#FFFFFF] dark:bg-[#162638] p-2 rounded border border-[#DCE3EA] dark:border-[#33485D]">
                      <span className="text-[9px] uppercase tracking-wider text-[#5D6B7B] dark:text-[#A9BACB] block mb-1">Current</span>
                      <span className="text-[#142C45] dark:text-[#E8EEF5] font-bold">{dim.currentValue}</span>
                    </div>

                    <div className="bg-indigo-50 dark:bg-indigo-950/30 p-2 rounded border border-indigo-200 dark:border-indigo-900/40">
                      <span className="text-[9px] uppercase tracking-wider text-indigo-700 dark:text-indigo-400 block mb-1">Scenario</span>
                      <span className="text-indigo-700 dark:text-indigo-300 font-bold">{dim.scenarioValue}</span>
                    </div>

                    <div className="flex items-center justify-center">
                      {renderBadge(dim.changeType, dim.change)}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Supporting Signals Strip */}
            {supportingSignals.length > 0 && (
              <div className="mt-4 pt-3 border-t border-[#DCE3EA] dark:border-[#33485D]">
                <span className="text-xs font-semibold text-[#142C45] dark:text-[#E8EEF5] flex items-center space-x-1.5 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>Supporting Signals & Evidence Catalysts</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {supportingSignals.map((sig) => (
                    <div key={sig.code} className="p-2.5 rounded bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] text-xs flex items-start space-x-2">
                      <span className="text-emerald-600 dark:text-emerald-400 font-bold mt-0.5">✓</span>
                      <div>
                        <span className="font-semibold text-[#142C45] dark:text-[#E8EEF5]">{sig.label}</span>
                        <p className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] mt-0.5">{sig.impact}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 2: WHY IS THIS RELATIONSHIP VALUABLE? */}
        {activeTab === 'breakdown' && (
          <div className="space-y-4">
            <div className="p-3 bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg text-xs text-[#142C45] dark:text-[#E8EEF5]">
              <span className="font-bold text-amber-600 dark:text-amber-300">Measurable Value Basis: </span>
              COREvia evaluates relationship value strictly through verified financial commitments, operating accounts, lending limits, and transactional depth—avoiding subjective speculation.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {valueBreakdown.map((item, idx) => (
                <div key={idx} className="p-3.5 bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg flex flex-col justify-between shadow-2xs">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-[#142C45] dark:text-[#E8EEF5]">{item.category}</span>
                      <span className="text-[10px] font-semibold text-[#5D6B7B] dark:text-[#A9BACB]">{item.source}</span>
                    </div>
                    <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB] mt-1.5 leading-relaxed">{item.description}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-[#DCE3EA] dark:border-[#33485D] flex items-center justify-between">
                    <span className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] uppercase font-semibold">Recorded Value</span>
                    <span className="text-sm font-bold font-mono text-[#168C83] dark:text-[#46C3B2]">{item.value}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: HISTORICAL TREND (30 / 60 / 90 DAYS) */}
        {activeTab === 'history' && (
          <div>
            {history && history.available && history.timeline.length > 0 ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-[#5D6B7B] dark:text-[#A9BACB] pb-2 border-b border-[#DCE3EA] dark:border-[#33485D]">
                  <span>90-Day Trend Timeline ({history.timeline.length} snapshots recorded)</span>
                  <span className="text-emerald-600 dark:text-emerald-400 font-semibold">CORE Score Trend: {history.trendSummary.coreScoreTrend}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="border-b border-[#DCE3EA] dark:border-[#33485D] text-[#5D6B7B] dark:text-[#A9BACB] uppercase text-[10px]">
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">CORE Score</th>
                        <th className="py-2 px-3">Engagement</th>
                        <th className="py-2 px-3">Service Health</th>
                        <th className="py-2 px-3">Momentum</th>
                        <th className="py-2 px-3">Products</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DCE3EA] dark:divide-[#33485D]/60">
                      {history.timeline.map((point, pIdx) => (
                        <tr key={pIdx} className="hover:bg-[#F8FAFC] dark:hover:bg-[#101C2A]">
                          <td className="py-2.5 px-3 text-[#142C45] dark:text-[#E8EEF5]">{point.date} ({point.daysAgo}d ago)</td>
                          <td className="py-2.5 px-3 font-bold text-[#168C83] dark:text-[#46C3B2]">{point.coreScore}</td>
                          <td className="py-2.5 px-3 text-[#142C45] dark:text-[#E8EEF5]">{point.engagement}</td>
                          <td className="py-2.5 px-3 font-semibold text-emerald-600 dark:text-emerald-400">{point.serviceHealth}</td>
                          <td className="py-2.5 px-3 text-[#5D6B7B] dark:text-[#A9BACB]">{point.relationshipMomentum}</td>
                          <td className="py-2.5 px-3 text-[#142C45] dark:text-[#E8EEF5]">{point.productDepth}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-[#5D6B7B] dark:text-[#A9BACB] space-y-2">
                <Calendar className="w-8 h-8 mx-auto text-[#5D6B7B] dark:text-[#A9BACB]" />
                <p className="text-sm font-medium">Historical relationship profile unavailable.</p>
                <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB] max-w-sm mx-auto">
                  Historical snapshots are logged deterministically as strategic simulations and governed actions occur. No synthetic history is manufactured.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info / Decision Trace Link */}
      <div className="px-4 py-3 bg-[#F8FAFC] dark:bg-[#0F1B2A] border-t border-[#DCE3EA] dark:border-[#33485D] text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5">
          <Info className="w-3.5 h-3.5 text-[#5D6B7B] dark:text-[#A9BACB] shrink-0" />
          <span>Deterministic relationship profile • Zero predictive speculative models</span>
        </div>

        {profile.decisionTraceId && onNavigateToTrace && (
          <button
            onClick={() => onNavigateToTrace(profile.decisionTraceId!)}
            className="text-[#168C83] dark:text-[#46C3B2] hover:underline font-semibold inline-flex items-center space-x-1 transition-colors"
          >
            <span>Decision Trace: {profile.decisionTraceId}</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
