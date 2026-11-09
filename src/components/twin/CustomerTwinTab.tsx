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
import { RelationshipValueProfile } from '../relationship-value/RelationshipValueProfile';

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
      <div className="py-16 text-center text-xs text-[#5D6B7B] dark:text-[#A9BACB] flex flex-col items-center justify-center gap-2">
        <RefreshCw className="w-5 h-5 animate-spin text-[#168C83] dark:text-[#46C3B2]" />
        <span>Synthesizing live Relationship Digital Twin across CRM engines...</span>
      </div>
    );
  }

  if (error || !twinData) {
    return (
      <div className="bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded-lg p-4 text-xs text-rose-800 dark:text-rose-300 space-y-2">
        <div className="font-semibold flex items-center gap-1.5">
          <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
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
    <div className="space-y-4 text-[#142C45] dark:text-[#E8EEF5]">
      {/* 1. Header Banner & Actions */}
      <div className="bg-[#FFFFFF] dark:bg-[#162638] rounded-xl p-4 sm:p-5 border border-[#DCE3EA] dark:border-[#33485D] shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#168C83]/10 dark:bg-[#168C83]/20 border border-[#168C83]/30 flex items-center justify-center text-[#168C83] dark:text-[#46C3B2] shadow-2xs">
              <Network className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold tracking-tight text-[#142C45] dark:text-[#E8EEF5]">
                  Relationship Digital Twin · Temporal State Model
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-semibold rounded bg-[#EDF1F5] dark:bg-[#101C2A] text-[#168C83] dark:text-[#46C3B2] border border-[#DCE3EA] dark:border-[#33485D]">
                  ORCHESTRATION LAYER
                </span>
              </div>
              <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB] mt-0.5">
                Deterministic telemetry combining CORE Score, Opportunity Radar, Service SLA, and Interaction Recency.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCreateSnapshot}
              disabled={creatingSnapshot}
              className="px-2.5 py-1.5 bg-[#EDF1F5] dark:bg-[#101C2A] hover:bg-[#DCE3EA] dark:hover:bg-[#26394C] text-[#142C45] dark:text-[#E8EEF5] text-xs font-medium rounded border border-[#DCE3EA] dark:border-[#33485D] flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Camera className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
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
              className="px-2.5 py-1.5 bg-[#168C83] hover:bg-[#127069] text-white text-xs font-medium rounded flex items-center gap-1.5 transition-colors shadow-2xs cursor-pointer"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Ask Copilot Twin</span>
            </button>
          </div>
        </div>

        {snapshotMessage && (
          <div className="p-2 rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{snapshotMessage}</span>
          </div>
        )}

        {/* State Badge Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-[#DCE3EA] dark:border-[#33485D] text-xs">
          <div className="bg-[#F8FAFC] dark:bg-[#101C2A] p-2.5 rounded-lg border border-[#DCE3EA] dark:border-[#33485D]">
            <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] font-mono">RELATIONSHIP STATE</span>
            <div className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1.5 mt-0.5">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <span>{state.state.replace(/_/g, ' ')}</span>
            </div>
            <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB]">Previous: {state.previousState || 'GROWING'}</span>
          </div>

          <div className="bg-[#F8FAFC] dark:bg-[#101C2A] p-2.5 rounded-lg border border-[#DCE3EA] dark:border-[#33485D]">
            <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] font-mono">CORE SCORE</span>
            <div className="text-sm font-bold text-[#142C45] dark:text-[#E8EEF5] font-mono mt-0.5 flex items-center gap-1.5">
              <span>{header.coreScore}/100</span>
              {header.previousCoreScore && header.coreScore < header.previousCoreScore ? (
                <span className="text-rose-600 dark:text-rose-400 text-xs flex items-center">
                  <ArrowDownRight className="w-3.5 h-3.5" />
                  {header.coreScore - header.previousCoreScore} pts
                </span>
              ) : (
                <span className="text-emerald-600 dark:text-emerald-400 text-xs flex items-center">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  +2 pts
                </span>
              )}
            </div>
            <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB]">Momentum: {header.relationshipMomentum}</span>
          </div>

          <div className="bg-[#F8FAFC] dark:bg-[#101C2A] p-2.5 rounded-lg border border-[#DCE3EA] dark:border-[#33485D]">
            <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] font-mono">FINANCIAL FOOTPRINT (TRV)</span>
            <div className="text-sm font-bold text-[#142C45] dark:text-[#E8EEF5] font-mono mt-0.5">
              {header.formattedRelationshipValue}
            </div>
            <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB]">{header.productsCount} Active Facilities</span>
          </div>

          <div className="bg-[#F8FAFC] dark:bg-[#101C2A] p-2.5 rounded-lg border border-[#DCE3EA] dark:border-[#33485D]">
            <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] font-mono">LAST TOUCHPOINT RECENCY</span>
            <div className="text-sm font-bold text-[#142C45] dark:text-[#E8EEF5] mt-0.5">
              {header.lastInteractionDate ? String(header.lastInteractionDate).slice(0, 10) : '07 Sep 2026'}
            </div>
            <span className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] truncate block">
              {header.lastInteractionSummary || 'NRI portfolio review'}
            </span>
          </div>
        </div>
      </div>

      {/* 2. Before You Act Precautionary Advisory */}
      {beforeYouAct && (
        <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800/40 rounded-xl p-4 text-xs space-y-2.5">
          <div className="flex items-center gap-2 text-amber-900 dark:text-amber-300 font-semibold">
            <ShieldAlert className="w-4 h-4 text-amber-700 dark:text-amber-400" />
            <span>Before You Act Advisory — Pre-Contact Operational Guardrails</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[#142C45] dark:text-[#E8EEF5]">
            <div>
              <div className="font-semibold mb-1 text-[#142C45] dark:text-[#E8EEF5]">Key Context & Sensitivities:</div>
              <ul className="list-disc list-inside space-y-1 text-[#5D6B7B] dark:text-[#A9BACB] pl-1">
                {beforeYouAct.relevantContext.map((c, i) => (
                  <li key={i}>{c}</li>
                ))}
              </ul>
            </div>

            <div>
              <div className="font-semibold text-amber-900 dark:text-amber-300 mb-1">Mandatory Precautions:</div>
              <ul className="list-disc list-inside space-y-1 text-amber-800 dark:text-amber-400 pl-1">
                {beforeYouAct.recommendedPrecautions.map((p, i) => (
                  <li key={i}>{p}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* 3. Why is it in this state? (Explainable Drivers) */}
      <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#142C45] dark:text-[#E8EEF5] flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-[#168C83] dark:text-[#46C3B2]" />
            <span>Why is it in this state? — Explainable Relationship Factors</span>
          </h4>
          <span className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] font-mono">
            {whyThisState?.length || 0} Deterministic Evidence Items
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {whyThisState?.map((factor, idx) => (
            <div
              key={idx}
              className={`p-3 rounded-lg border text-xs flex items-start gap-2.5 ${
                factor.severity === 'CRITICAL'
                  ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900 text-rose-900 dark:text-rose-200'
                  : factor.severity === 'WARNING'
                  ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900 text-amber-900 dark:text-amber-200'
                  : factor.severity === 'POSITIVE'
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900 text-emerald-900 dark:text-emerald-200'
                  : 'bg-[#F8FAFC] dark:bg-[#101C2A] border-[#DCE3EA] dark:border-[#33485D] text-[#142C45] dark:text-[#E8EEF5]'
              }`}
            >
              <div className="mt-0.5">
                {factor.severity === 'CRITICAL' ? (
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                ) : factor.severity === 'WARNING' ? (
                  <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                ) : factor.severity === 'POSITIVE' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                ) : (
                  <Clock className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold">{factor.reason}</div>
                <div className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] mt-0.5">{factor.details}</div>
                <div className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] font-mono mt-1 flex items-center gap-1.5">
                  <span className="font-semibold">{factor.engine}</span>
                  {factor.link && (
                    <span className="text-[#168C83] dark:text-[#46C3B2] hover:underline cursor-pointer">
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
      <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-4 space-y-3 shadow-xs">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold uppercase tracking-wider text-[#142C45] dark:text-[#E8EEF5] flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <span>What Changed Recently? (Point-in-Time Diffs)</span>
          </h4>
          <span className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">
            Comparing latest state against prior baseline snapshot
          </span>
        </div>

        <div className="divide-y divide-[#DCE3EA] dark:divide-[#33485D] text-xs">
          {whatChanged?.map((change, idx) => (
            <div key={idx} className="py-2.5 flex items-start justify-between gap-3">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-[#142C45] dark:text-[#E8EEF5]">{change.title}</span>
                  <span
                    className={`px-1.5 py-0.5 text-[9px] font-mono uppercase rounded ${
                      change.severity === 'CRITICAL'
                        ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                        : change.severity === 'WARNING'
                        ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    {change.category}
                  </span>
                </div>
                <p className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">{change.evidence}</p>
                <div className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] font-mono">Source: {change.source}</div>
              </div>

              <div className="text-right shrink-0">
                <div className="font-mono text-[#5D6B7B] dark:text-[#A9BACB] text-[11px] line-through">
                  {String(change.oldValue)}
                </div>
                <div className="font-mono font-bold text-[#142C45] dark:text-[#E8EEF5] text-xs flex items-center gap-1 justify-end">
                  <ArrowRight className="w-3 h-3 text-[#5D6B7B] dark:text-[#A9BACB]" />
                  <span>{String(change.newValue)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. State Map Nodes (Visual 6-Domain System Topology) */}
      <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-4 space-y-3 shadow-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#142C45] dark:text-[#E8EEF5] flex items-center gap-1.5">
          <Layers className="w-4 h-4 text-[#168C83] dark:text-[#46C3B2]" />
          <span>Relationship Topology & State Map (6 Connected Domains)</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {stateMap?.nodes?.map((node) => (
            <div
              key={node.id}
              className={`p-3 rounded-lg border text-xs space-y-1.5 transition-all ${
                node.status === 'CRITICAL'
                  ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900'
                  : node.status === 'WARNING' || node.status === 'ATTENTION'
                  ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900'
                  : 'bg-[#F8FAFC] dark:bg-[#101C2A] border-[#DCE3EA] dark:border-[#33485D]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#142C45] dark:text-[#E8EEF5]">{node.name}</span>
                <span
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase font-medium ${
                    node.status === 'CRITICAL'
                      ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                      : node.status === 'WARNING' || node.status === 'ATTENTION'
                      ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300'
                      : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                  }`}
                >
                  {node.status}
                </span>
              </div>

              <div className="text-sm font-bold font-mono text-[#142C45] dark:text-[#E8EEF5]">{node.keyMetric}</div>
              <p className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB] leading-tight">{node.description}</p>

              <div className="space-y-0.5 pt-1 border-t border-[#DCE3EA] dark:border-[#33485D] text-[10px] text-[#5D6B7B] dark:text-[#A9BACB]">
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

      {/* 6. Product Whitespace */}
      <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl p-4 space-y-3 shadow-xs">
        <h4 className="text-xs font-bold uppercase tracking-wider text-[#142C45] dark:text-[#E8EEF5] flex items-center gap-1.5">
          <TrendingUp className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Product Whitespace & Recommended Expansion Facilities</span>
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs">
          {productMap?.whitespaceRecommendations?.map((rec, i) => (
            <div key={i} className="p-3 rounded-lg border border-[#DCE3EA] dark:border-[#33485D] bg-[#F8FAFC] dark:bg-[#101C2A] space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#142C45] dark:text-[#E8EEF5]">{rec.name}</span>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded border border-emerald-200 dark:border-emerald-800 font-bold">
                  {rec.potentialValue}
                </span>
              </div>
              <p className="text-[11px] text-[#5D6B7B] dark:text-[#A9BACB]">{rec.rationale}</p>
              <div className="text-[10px] text-[#5D6B7B] dark:text-[#A9BACB] font-mono">Engine: {rec.sourceEngine}</div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. RELATIONSHIP VALUE PROFILE */}
      <div className="pt-2">
        <RelationshipValueProfile
          customerId={customerId}
          onNavigateToSimulator={() => {
            if (onNavigateToModule) onNavigateToModule('strategy-simulator');
          }}
        />
      </div>
    </div>
  );
};
