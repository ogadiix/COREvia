import React, { useState, useEffect } from 'react';
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
  Layers,
  FileText,
  TrendingUp,
  CheckSquare,
  Bot,
  Info,
  ChevronRight,
  ExternalLink,
  Shield,
  Zap,
  ArrowRight,
} from 'lucide-react';
import {
  RelationshipTwinOverview,
  RelationshipStateMapNode,
  RelationshipHealthMetric,
} from '../../types';
import { formatINR } from '../../data/mockIndianBankingData';
import { useCopilot } from '../../context/CopilotContext';

interface CustomerTwinTabProps {
  customerId: number;
  customerName: string;
  cifNumber: string;
  onNavigateToModule?: (module: string) => void;
}

export const CustomerTwinTab: React.FC<CustomerTwinTabProps> = ({
  customerId,
  customerName,
  cifNumber,
  onNavigateToModule,
}) => {
  const { openDrawer } = useCopilot();
  const [twinData, setTwinData] = useState<RelationshipTwinOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [creatingSnapshot, setCreatingSnapshot] = useState<boolean>(false);
  const [snapshotMessage, setSnapshotMessage] = useState<string | null>(null);

  const fetchTwin = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/relationship-twin/${customerId}`, {
        headers: {
          'x-mock-user-id': '1',
          'x-mock-user-name': 'Relationship Manager',
          'x-mock-user-role': 'RELATIONSHIP_MANAGER',
        },
      });
      if (!res.ok) {
        throw new Error(`Failed to load Relationship Digital Twin (${res.status})`);
      }
      const data = await res.json();
      setTwinData(data);
    } catch (err: any) {
      setError(err.message || 'Error fetching digital twin');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchTwin();
    }
  }, [customerId]);

  const handleCreateSnapshot = async () => {
    setCreatingSnapshot(true);
    setSnapshotMessage(null);
    try {
      const res = await fetch(`/api/relationship-twin/${customerId}/snapshot`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-mock-user-id': '1',
          'x-mock-user-name': 'Relationship Manager',
          'x-mock-user-role': 'RELATIONSHIP_MANAGER',
        },
        body: JSON.stringify({
          summaryNotes: `Point-in-time snapshot created from Customer 360 for ${customerName}.`,
        }),
      });
      if (res.ok) {
        setSnapshotMessage('Snapshot recorded successfully.');
        setTimeout(() => setSnapshotMessage(null), 4000);
        fetchTwin();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setCreatingSnapshot(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-violet-600" />
        <span>Synthesizing live Relationship Digital Twin across CRM engines...</span>
      </div>
    );
  }

  if (error || !twinData) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded p-4 text-xs text-rose-800 space-y-2">
        <div className="font-semibold flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>Unable to generate Digital Twin</span>
        </div>
        <p>{error || 'An unexpected error occurred while compiling the relationship state model.'}</p>
        <button
          onClick={fetchTwin}
          className="px-3 py-1 bg-rose-600 text-white rounded text-xs font-medium hover:bg-rose-700"
        >
          Retry
        </button>
      </div>
    );
  }

  const { state, header, whyThisState, whatChanged, beforeYouAct, stateMap, healthBreakdown, productMap } = twinData;

  return (
    <div className="space-y-4 text-slate-800">
      {/* 1. Header Banner & Actions */}
      <div className="bg-slate-900 text-white rounded-lg p-4 border border-slate-800 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400 shadow-xs">
              <Network className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight text-white">
                  Relationship Digital Twin · Live State Model
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/40">
                  ORCHESTRATION LAYER
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Dynamic single-source-of-truth combining CORE Score, Opportunity Radar, Service SLA, and Interaction Recency.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateSnapshot}
              disabled={creatingSnapshot}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded border border-slate-700 flex items-center gap-1.5 transition-colors"
            >
              <Camera className="w-3.5 h-3.5 text-amber-400" />
              <span>{creatingSnapshot ? 'Capturing...' : 'Capture Snapshot'}</span>
            </button>

            <button
              onClick={() => {
                openDrawer(
                  {
                    type: 'CUSTOMER',
                    id: customerId,
                    code: cifNumber,
                    label: `${customerName} · Digital Twin`,
                  },
                  `Provide a detailed Relationship Digital Twin assessment for ${customerName} (${cifNumber}). Explain the state '${state.state}', why it occurred, what changed, and how to navigate the upcoming customer contact safely.`
                );
              }}
              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Ask Copilot Twin</span>
            </button>
          </div>
        </div>

        {snapshotMessage && (
          <div className="p-2 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{snapshotMessage}</span>
          </div>
        )}

        {/* State Badge Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800 text-xs">
          <div className="bg-slate-800/60 p-2 rounded border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-mono">RELATIONSHIP STATE</span>
            <div className="text-sm font-bold text-amber-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>{state.state.replace(/_/g, ' ')}</span>
            </div>
            <span className="text-[10px] text-slate-400">Previous: {state.previousState || 'GROWING'}</span>
          </div>

          <div className="bg-slate-800/60 p-2 rounded border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-mono">CORE SCORE (SOURCE ENGINE)</span>
            <div className="text-sm font-bold text-white font-mono mt-0.5 flex items-center gap-1.5">
              <span>{header.coreScore}/100</span>
              {header.previousCoreScore && header.coreScore < header.previousCoreScore ? (
                <span className="text-rose-400 text-xs flex items-center">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  {header.coreScore - header.previousCoreScore} pts
                </span>
              ) : (
                <span className="text-emerald-400 text-xs flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +2 pts
                </span>
              )}
            </div>
            <span className="text-[10px] text-slate-400">Momentum: {header.relationshipMomentum}</span>
          </div>

          <div className="bg-slate-800/60 p-2 rounded border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-mono">FINANCIAL FOOTPRINT (TRV)</span>
            <div className="text-sm font-bold text-white font-mono mt-0.5">
              {header.formattedRelationshipValue}
            </div>
            <span className="text-[10px] text-slate-400">{header.productsCount} Active Facilities</span>
          </div>

          <div className="bg-slate-800/60 p-2 rounded border border-slate-700/60">
            <span className="text-[10px] text-slate-400 font-mono">LAST INTERACTION RECENCY</span>
            <div className="text-sm font-bold text-slate-200 mt-0.5">
              {header.lastInteractionDate ? String(header.lastInteractionDate).slice(0, 10) : '07 Sep 2026'}
            </div>
            <span className="text-[10px] text-slate-400 truncate block">
              {header.lastInteractionSummary || 'NRI investment options'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Before You Act Precautionary Advisory */}
      {beforeYouAct && (
        <div className="bg-amber-50 border border-amber-300 rounded-lg p-3.5 text-xs space-y-2.5">
          <div className="flex items-center gap-2 text-amber-900 font-semibold">
            <ShieldAlert className="w-4 h-4 text-amber-700" />
            <span>Before You Act Advisory — Pre-contact Context Check</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-slate-700">
            <div>
              <div className="font-semibold text-slate-900 mb-1">Key Context & Sensitivities:</div>
              <ul className="list-disc list-inside space-y-1 text-slate-600 pl-1">
                {beforeYouAct.relevantContext.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>

            <div>
              <div className="font-semibold text-slate-900 mb-1">Mandatory Precautions:</div>
              <ul className="list-disc list-inside space-y-1 text-amber-800 pl-1">
                {beforeYouAct.recommendedPrecautions.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 3. Why is it in this state? (Explainable Drivers) */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-violet-600" />
            <span>Why is it in this state? — Explainable Relationship Factors</span>
          </h4>
          <span className="text-[11px] text-slate-500 font-mono">
            {whyThisState?.length || 0} Cross-Engine Evidence Items
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {whyThisState?.map((factor, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded border text-xs flex items-start gap-2.5 ${
                factor.severity === 'CRITICAL'
                  ? 'bg-rose-50/70 border-rose-200 text-rose-900'
                  : factor.severity === 'WARNING'
                  ? 'bg-amber-50/70 border-amber-200 text-amber-900'
                  : factor.severity === 'POSITIVE'
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-900'
                  : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <div className="mt-0.5">
                {factor.severity === 'CRITICAL' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                ) : factor.severity === 'WARNING' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                ) : factor.severity === 'POSITIVE' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-blue-600 shrink-0" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{factor.reason}</div>
                <div className="text-[11px] text-slate-600 mt-0.5">{factor.details}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1.5">
                  <span className="font-semibold text-slate-500">{factor.engine}</span>
                  {factor.link && (
                    <span className="text-violet-700 hover:underline cursor-pointer">
                      View {factor.link.module} #{factor.link.id || ''}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 4. What Changed? (Material Change Diff) */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-2.5 shadow-2xs">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>What Changed Recently? (Material Point-in-Time Diffs)</span>
          </h4>
          <span className="text-[11px] text-slate-500">
            Comparing latest state against prior baseline snapshot
          </span>
        </div>

        <div className="divide-y divide-slate-100 text-xs">
          {whatChanged?.map((change, idx) => (
            <div key={idx} className="py-2.5 flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-900">{change.title}</span>
                  <span
                    className={`px-1.5 py-0.2 text-[9px] font-mono uppercase rounded ${
                      change.severity === 'CRITICAL'
                        ? 'bg-rose-100 text-rose-800'
                        : change.severity === 'WARNING'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {change.category}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500">{change.evidence}</p>
                <div className="text-[10px] text-slate-400 font-mono">Source: {change.source}</div>
              </div>

              <div className="text-right shrink-0">
                <div className="font-mono text-slate-500 text-[11px] line-through">
                  {String(change.oldValue)}
                </div>
                <div className="font-mono font-bold text-slate-900 text-xs flex items-center gap-1 justify-end">
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                  <span>{String(change.newValue)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. State Map Nodes (Visual 6-Domain System Topology) */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-2.5 shadow-2xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-cyan-600" />
          <span>Relationship Topology & State Map (6 Connected Domains)</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {stateMap?.nodes?.map((node) => (
            <div
              key={node.id}
              className={`p-3 rounded-lg border text-xs space-y-1.5 transition-all ${
                node.status === 'CRITICAL'
                  ? 'bg-rose-50/50 border-rose-200'
                  : node.status === 'WARNING' || node.status === 'ATTENTION'
                  ? 'bg-amber-50/50 border-amber-200'
                  : 'bg-slate-50/60 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">{node.name}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-medium ${
                    node.status === 'CRITICAL'
                      ? 'bg-rose-100 text-rose-800'
                      : node.status === 'WARNING' || node.status === 'ATTENTION'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {node.status}
                </span>
              </div>

              <div className="text-sm font-bold font-mono text-slate-800">{node.keyMetric}</div>
              <p className="text-[11px] text-slate-500 leading-tight">{node.description}</p>

              <div className="space-y-0.5 pt-1 border-t border-slate-200/60 text-[10px] text-slate-600">
                {node.items?.map((it, i) => (
                  <div key={i} className="truncate">
                    • {it}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 6. Product Relationship & Whitespace */}
      <div className="bg-white border border-slate-200 rounded-lg p-3.5 space-y-2.5 shadow-2xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-emerald-600" />
          <span>Product Whitespace & Recommended Expansion Facilities</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
          {productMap?.whitespaceRecommendations?.map((rec, i) => (
            <div key={i} className="p-2.5 rounded border border-slate-200 bg-slate-50 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-slate-900">{rec.name}</span>
                <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 font-bold">
                  {rec.potentialValue}
                </span>
              </div>
              <p className="text-[11px] text-slate-600">{rec.rationale}</p>
              <div className="text-[10px] text-slate-400 font-mono">Engine: {rec.sourceEngine}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
