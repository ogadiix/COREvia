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
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex items-center justify-center min-h-[220px]">
        <div className="flex items-center space-x-3 text-slate-400">
          <RefreshCw className="w-5 h-5 animate-spin text-cyan-400" />
          <span className="text-sm font-medium">Resolving relationship value dimensions...</span>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 text-center">
        <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-2" />
        <p className="text-sm text-slate-300 font-medium">{error || 'Relationship value profile unavailable'}</p>
        <button
          onClick={fetchProfileData}
          className="mt-3 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 rounded border border-slate-700 inline-flex items-center space-x-1.5"
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
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <TrendingUp className="w-3 h-3" />
            <span>{changeValue}</span>
          </span>
        );
      case 'DECLINED':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <TrendingDown className="w-3 h-3" />
            <span>{changeValue}</span>
          </span>
        );
      case 'NOT_CALCULATED':
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-semibold bg-amber-500/10 text-amber-300 border border-amber-500/20" title="Current simulation rules do not model monetary relationship value.">
            <HelpCircle className="w-3 h-3" />
            <span>Not Recalculated</span>
          </span>
        );
      case 'UNCHANGED':
      default:
        return (
          <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            <Minus className="w-3 h-3" />
            <span>Unchanged</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl text-slate-100">
      {/* Header Banner */}
      <div className="p-4 sm:p-5 border-b border-slate-800 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center space-x-2">
            <Coins className="w-5 h-5 text-amber-400" />
            <h3 className="text-base font-bold text-slate-100 tracking-tight">Relationship Value Intelligence</h3>
            {profile.isSimulated && (
              <span className="px-2 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                Simulation Comparison
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            {profile.customerName} ({profile.customerCode}) • Multi-dimensional relationship value & strategy impact
          </p>
        </div>

        {/* Tab Controls & Simulation action */}
        <div className="flex items-center space-x-2">
          <div className="flex bg-slate-800/80 p-0.5 rounded-lg border border-slate-700/80 text-xs">
            <button
              onClick={() => setActiveTab('profile')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                activeTab === 'profile' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dimensions
            </button>
            <button
              onClick={() => setActiveTab('breakdown')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                activeTab === 'breakdown' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Why Valuable?
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                activeTab === 'history' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              History
            </button>
          </div>

          {onNavigateToSimulator && (
            <button
              onClick={() => onNavigateToSimulator(scenarioId)}
              className="px-2.5 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-xs font-semibold inline-flex items-center space-x-1.5 transition-all"
            >
              <Compass className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Simulate Strategy</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Highlight Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 border-b border-slate-800 bg-slate-950/60 divide-x divide-slate-800/60">
        <div className="p-3 sm:p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Relationship Value</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold text-amber-300 font-mono">
              {currentSnapshot.relationshipValueFormatted}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Customer Master Ledger</span>
        </div>

        <div className="p-3 sm:p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">CORE Score</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold text-cyan-400 font-mono">
              {scenarioSnapshot ? scenarioSnapshot.coreScore : currentSnapshot.coreScore}
            </span>
            {scenarioSnapshot && scenarioSnapshot.coreScore !== currentSnapshot.coreScore && (
              <span className="text-xs font-bold text-emerald-400">
                +{scenarioSnapshot.coreScore - currentSnapshot.coreScore}
              </span>
            )}
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">
            {scenarioSnapshot ? scenarioSnapshot.relationshipMomentum : currentSnapshot.relationshipMomentum} Momentum
          </span>
        </div>

        <div className="p-3 sm:p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Product Depth</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className="text-xl sm:text-2xl font-bold text-slate-100 font-mono">
              {scenarioSnapshot ? scenarioSnapshot.productDepth : currentSnapshot.productDepth}
            </span>
            <span className="text-xs text-slate-400">Products</span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Core Banking Holdings</span>
        </div>

        <div className="p-3 sm:p-4">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">Service Health</span>
          <div className="flex items-baseline space-x-2 mt-1">
            <span className={`text-base sm:text-lg font-bold font-mono ${
              ['EXCELLENT', 'GOOD'].includes(scenarioSnapshot ? scenarioSnapshot.serviceHealth : currentSnapshot.serviceHealth)
                ? 'text-emerald-400'
                : 'text-amber-400'
            }`}>
              {scenarioSnapshot ? scenarioSnapshot.serviceHealth : currentSnapshot.serviceHealth}
            </span>
          </div>
          <span className="text-[10px] text-slate-500 block mt-0.5">Service Desk SLA Track</span>
        </div>
      </div>

      {/* Main Tab Content */}
      <div className="p-4 sm:p-5">
        {/* TAB 1: DIMENSIONS COMPARISON */}
        {activeTab === 'profile' && (
          <div className="space-y-4">
            {/* Context Explanation */}
            {profile.isSimulated && (
              <div className="p-3 rounded-lg bg-indigo-950/40 border border-indigo-800/40 text-xs text-indigo-200 flex items-start space-x-2.5">
                <Sparkles className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-indigo-300">Scenario Analysis: </span>
                  {profile.explanation}
                </div>
              </div>
            )}

            {/* Desktop Table View (Hidden on mobile) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-semibold tracking-wider uppercase text-[10px]">
                    <th className="py-2.5 px-3">Relationship Dimension</th>
                    <th className="py-2.5 px-3">Current</th>
                    {profile.isSimulated && <th className="py-2.5 px-3 text-indigo-300">Simulated Scenario</th>}
                    <th className="py-2.5 px-3">Impact / Change</th>
                    <th className="py-2.5 px-3">Source Engine</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-medium">
                  {dimensions.map((dim) => (
                    <tr key={dim.dimension} className="hover:bg-slate-800/30 transition-colors">
                      <td className="py-3 px-3">
                        <div className="font-semibold text-slate-200">{dim.label}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5 line-clamp-1">{dim.explanation}</div>
                      </td>
                      <td className="py-3 px-3 font-mono text-slate-300">{dim.currentValue}</td>
                      {profile.isSimulated && (
                        <td className="py-3 px-3 font-mono font-bold text-indigo-300">{dim.scenarioValue}</td>
                      )}
                      <td className="py-3 px-3">
                        {renderBadge(dim.changeType, dim.change)}
                      </td>
                      <td className="py-3 px-3 text-slate-400 text-[11px]">{dim.sourceEngine}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Stacked View (CURRENT -> SCENARIO -> CHANGE) */}
            <div className="md:hidden space-y-3">
              {dimensions.map((dim) => (
                <div key={dim.dimension} className="p-3 bg-slate-950/70 border border-slate-800 rounded-lg text-xs space-y-2">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-1.5">
                    <span className="font-bold text-slate-200">{dim.label}</span>
                    <span className="text-[10px] text-slate-500">{dim.sourceEngine}</span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono">
                    <div className="bg-slate-900 p-2 rounded border border-slate-800/80">
                      <span className="text-[9px] uppercase tracking-wider text-slate-500 block mb-1">Current</span>
                      <span className="text-slate-300 font-bold">{dim.currentValue}</span>
                    </div>

                    <div className="bg-indigo-950/30 p-2 rounded border border-indigo-900/40">
                      <span className="text-[9px] uppercase tracking-wider text-indigo-400 block mb-1">Scenario</span>
                      <span className="text-indigo-300 font-bold">{dim.scenarioValue}</span>
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
              <div className="mt-4 pt-3 border-t border-slate-800">
                <span className="text-xs font-semibold text-slate-300 flex items-center space-x-1.5 mb-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Supporting Signals & Catalysts</span>
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {supportingSignals.map((sig) => (
                    <div key={sig.code} className="p-2.5 rounded bg-slate-950/60 border border-slate-800 text-xs flex items-start space-x-2">
                      <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                      <div>
                        <span className="font-semibold text-slate-200">{sig.label}</span>
                        <p className="text-[11px] text-slate-400 mt-0.5">{sig.impact}</p>
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
            <div className="p-3 bg-slate-950/60 border border-slate-800 rounded-lg text-xs text-slate-300">
              <span className="font-bold text-amber-300">Measurable Value Basis: </span>
              COREvia evaluates relationship value strictly through verified financial commitments, operating accounts, lending limits, and transactional depth—avoiding subjective speculation.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {valueBreakdown.map((item, idx) => (
                <div key={idx} className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-lg flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-200">{item.category}</span>
                      <span className="text-[10px] font-semibold text-slate-500">{item.source}</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{item.description}</p>
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <span className="text-[11px] text-slate-500 uppercase font-semibold">Recorded Value</span>
                    <span className="text-sm font-bold font-mono text-cyan-300">{item.value}</span>
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
                <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-800">
                  <span>90-Day Trend Timeline ({history.timeline.length} snapshots recorded)</span>
                  <span className="text-emerald-400 font-semibold">CORE Score Trend: {history.trendSummary.coreScoreTrend}</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px]">
                        <th className="py-2 px-3">Date</th>
                        <th className="py-2 px-3">CORE Score</th>
                        <th className="py-2 px-3">Engagement</th>
                        <th className="py-2 px-3">Service Health</th>
                        <th className="py-2 px-3">Momentum</th>
                        <th className="py-2 px-3">Products</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {history.timeline.map((point, pIdx) => (
                        <tr key={pIdx} className="hover:bg-slate-800/30">
                          <td className="py-2.5 px-3 text-slate-300">{point.date} ({point.daysAgo}d ago)</td>
                          <td className="py-2.5 px-3 font-bold text-cyan-400">{point.coreScore}</td>
                          <td className="py-2.5 px-3 text-slate-300">{point.engagement}</td>
                          <td className="py-2.5 px-3 font-semibold text-emerald-400">{point.serviceHealth}</td>
                          <td className="py-2.5 px-3 text-slate-400">{point.relationshipMomentum}</td>
                          <td className="py-2.5 px-3 text-slate-300">{point.productDepth}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-slate-400 space-y-2">
                <Calendar className="w-8 h-8 mx-auto text-slate-600" />
                <p className="text-sm font-medium">Historical relationship profile unavailable.</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Historical snapshots are logged deterministically as strategic simulations and governed actions occur. No synthetic history is manufactured.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer Info / Decision Trace Link */}
      <div className="px-4 py-3 bg-slate-950 border-t border-slate-800 text-[11px] text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center space-x-1.5">
          <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Deterministic relationship profile • Zero predictive speculative models</span>
        </div>

        {profile.decisionTraceId && onNavigateToTrace && (
          <button
            onClick={() => onNavigateToTrace(profile.decisionTraceId!)}
            className="text-cyan-400 hover:text-cyan-300 font-semibold inline-flex items-center space-x-1 transition-colors"
          >
            <span>Decision Trace: {profile.decisionTraceId}</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
};
