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
  ExternalLink,
  ChevronRight,
  RefreshCw,
  Layers,
  Bot,
} from 'lucide-react';
import { RelationshipTwinOverview, RelationshipState } from '../../types';
import { formatINR } from '../../data/mockIndianBankingData';
import { useCopilot } from '../../context/CopilotContext';

interface CompactRelationshipTwinWidgetProps {
  customerId: number;
  customerName: string;
  onOpenFullTwin?: () => void;
  onNavigateToTab?: (tab: string) => void;
}

const STATE_CONFIG: Record<
  string,
  { label: string; badgeClass: string; borderClass: string; bgClass: string; textClass: string; icon: any }
> = {
  ATTENTION_REQUIRED: {
    label: 'Attention Required',
    badgeClass: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    borderClass: 'border-amber-500/30',
    bgClass: 'bg-amber-950/20',
    textClass: 'text-amber-400',
    icon: AlertTriangle,
  },
  SERVICE_RECOVERY: {
    label: 'Service Recovery',
    badgeClass: 'bg-rose-500/20 text-rose-300 border-rose-500/40',
    borderClass: 'border-rose-500/30',
    bgClass: 'bg-rose-950/20',
    textClass: 'text-rose-400',
    icon: ShieldAlert,
  },
  GROWING: {
    label: 'Growing',
    badgeClass: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
    borderClass: 'border-emerald-500/30',
    bgClass: 'bg-emerald-950/20',
    textClass: 'text-emerald-400',
    icon: ArrowUpRight,
  },
  OPPORTUNITY_ACTIVE: {
    label: 'Opportunity Active',
    badgeClass: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
    borderClass: 'border-blue-500/30',
    bgClass: 'bg-blue-950/20',
    textClass: 'text-blue-400',
    icon: Sparkles,
  },
  FOLLOW_UP_REQUIRED: {
    label: 'Follow-Up Required',
    badgeClass: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/40',
    borderClass: 'border-indigo-500/30',
    bgClass: 'bg-indigo-950/20',
    textClass: 'text-indigo-400',
    icon: Clock,
  },
  STABLE: {
    label: 'Stable',
    badgeClass: 'bg-slate-500/20 text-slate-300 border-slate-500/40',
    borderClass: 'border-slate-500/30',
    bgClass: 'bg-slate-950/20',
    textClass: 'text-slate-400',
    icon: CheckCircle2,
  },
};

export const CompactRelationshipTwinWidget: React.FC<CompactRelationshipTwinWidgetProps> = ({
  customerId,
  customerName,
  onOpenFullTwin,
  onNavigateToTab,
}) => {
  const { openDrawer } = useCopilot();
  const [data, setData] = useState<RelationshipTwinOverview | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

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
        throw new Error(`Failed to load twin status (${res.status})`);
      }
      const json = await res.json();
      setData(json);
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

  if (loading) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-400 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-3.5 h-3.5 animate-spin text-violet-400" />
          <span>Synchronizing Relationship Digital Twin state...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-slate-400 text-xs flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Network className="w-4 h-4 text-violet-400" />
          <span>Digital Twin status available in dedicated tab.</span>
        </div>
        <button
          onClick={fetchTwin}
          className="text-violet-400 hover:text-violet-300 underline font-medium"
        >
          Retry
        </button>
      </div>
    );
  }

  const currentState = data.state?.state || 'STABLE';
  const conf = STATE_CONFIG[currentState] || STATE_CONFIG.STABLE;
  const StateIcon = conf.icon;

  return (
    <div className={`bg-slate-900 border ${conf.borderClass} rounded-lg p-3.5 text-white shadow-sm space-y-3`}>
      {/* Top Banner: Relationship State & Momentum */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-violet-950/60 border border-violet-700/50 flex items-center justify-center text-violet-300 shadow-2xs">
            <Network className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold tracking-tight text-white flex items-center gap-1.5">
                Relationship Digital Twin
              </span>
              <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full border ${conf.badgeClass} flex items-center gap-1`}>
                <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                {conf.label}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
              {data.state?.reason || 'Synthesized across CRM engines and intelligence layers.'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => {
              openDrawer(
                {
                  type: 'CUSTOMER',
                  id: customerId,
                  code: data.customer?.customerCode || String(customerId),
                  label: `${customerName} · Digital Twin`,
                },
                `Explain the Relationship Digital Twin state for ${customerName}. What is causing '${conf.label}' and what precautions should I take?`
              );
            }}
            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-[11px] font-medium rounded border border-slate-700 flex items-center gap-1 transition-colors"
            title="Ask Copilot about this Relationship State"
          >
            <Bot className="w-3 h-3 text-emerald-400" />
            <span>Copilot Context</span>
          </button>

          {onOpenFullTwin && (
            <button
              type="button"
              onClick={onOpenFullTwin}
              className="px-2.5 py-1 bg-violet-600 hover:bg-violet-500 text-white text-[11px] font-medium rounded flex items-center gap-1 transition-colors shadow-2xs"
            >
              <span>Full Digital Twin</span>
              <ArrowUpRight className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Grid: 3 Pillars (Financial TRV + CORE Score + Health Summary) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
        <div className="bg-slate-800/60 border border-slate-700/60 rounded p-2">
          <div className="text-[10px] text-slate-400 font-mono">TOTAL RELATIONSHIP</div>
          <div className="text-sm font-bold text-white font-mono mt-0.5">
            {data.header?.formattedRelationshipValue || formatINR(data.header?.relationshipValue || 0)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {data.header?.productsCount || 0} Active Facilities
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded p-2">
          <div className="text-[10px] text-slate-400 font-mono">CORE SCORE</div>
          <div className="text-sm font-bold text-white font-mono mt-0.5 flex items-center gap-1.5">
            <span>{data.header?.coreScore || 84}/100</span>
            {data.header?.previousCoreScore && data.header.coreScore < data.header.previousCoreScore ? (
              <span className="text-rose-400 text-[10px] flex items-center">
                <ArrowDownRight className="w-3 h-3" />
                {data.header.coreScore - data.header.previousCoreScore}
              </span>
            ) : (
              <span className="text-emerald-400 text-[10px] flex items-center">
                <ArrowUpRight className="w-3 h-3" />
                +2
              </span>
            )}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Momentum: <span className="text-amber-300 font-medium">{data.header?.relationshipMomentum || 'STABLE'}</span>
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded p-2">
          <div className="text-[10px] text-slate-400 font-mono">SERVICE & CASES</div>
          <div className="text-sm font-bold text-white font-mono mt-0.5 flex items-center gap-1">
            <span className={data.header?.openCasesCount > 0 ? 'text-amber-400' : 'text-slate-300'}>
              {data.header?.openCasesCount || 0} Open
            </span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {data.serviceMap?.slaRiskCases?.length || 0} approaching SLA
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/60 rounded p-2">
          <div className="text-[10px] text-slate-400 font-mono">OPPORTUNITIES</div>
          <div className="text-sm font-bold text-white font-mono mt-0.5 text-slate-200">
            {data.header?.openOpportunitiesCount || 0} Active Deals
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Pipeline: {data.growthMap?.formattedPipelineValue || '₹15.0 Lakhs'}
          </div>
        </div>
      </div>

      {/* Why This State (Explainable Evidence Pills) */}
      {data.whyThisState && data.whyThisState.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Explainable State Drivers ({data.whyThisState.length})</span>
            {onNavigateToTab && (
              <button
                type="button"
                onClick={() => onNavigateToTab('TWIN')}
                className="text-violet-400 hover:text-violet-300 lowercase text-[10px] flex items-center gap-0.5"
              >
                <span>view graph & evidence</span>
                <ChevronRight className="w-2.5 h-2.5" />
              </button>
            )}
          </div>
          <div className="space-y-1">
            {data.whyThisState.slice(0, 3).map((item, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2 p-1.5 rounded bg-slate-800/40 border border-slate-700/40 text-[11px]"
              >
                <div className="mt-0.5">
                  {item.severity === 'CRITICAL' ? (
                    <AlertTriangle className="w-3 h-3 text-rose-400 shrink-0" />
                  ) : item.severity === 'WARNING' ? (
                    <AlertTriangle className="w-3 h-3 text-amber-400 shrink-0" />
                  ) : item.severity === 'POSITIVE' ? (
                    <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                  ) : (
                    <Clock className="w-3 h-3 text-blue-400 shrink-0" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-slate-200 font-medium leading-tight line-clamp-1">{item.reason}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-2">
                    <span className="text-violet-400 font-mono">{item.engine}</span>
                    <span className="text-slate-500">·</span>
                    <span className="text-slate-400 line-clamp-1">{item.details}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Before You Act Precautionary Banner */}
      {data.beforeYouAct && data.beforeYouAct.recommendedPrecautions && data.beforeYouAct.recommendedPrecautions.length > 0 && (
        <div className="p-2 rounded bg-amber-950/30 border border-amber-500/30 text-amber-200 text-[11px] flex items-start gap-2">
          <ShieldAlert className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
          <div className="leading-snug">
            <span className="font-semibold text-amber-300">Before You Act: </span>
            <span className="text-amber-200/90">{data.beforeYouAct.recommendedPrecautions[0]}</span>
          </div>
        </div>
      )}
    </div>
  );
};
