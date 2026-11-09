import React from 'react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import type { OpportunityRadarSignal } from '../../types';
import {
  Radar,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  FileText,
  DollarSign,
  Package,
  Layers,
  Sparkles,
  Calendar,
  XCircle,
  Clock,
  ExternalLink,
  Compass,
} from 'lucide-react';

interface RadarSignalCardProps {
  signal: OpportunityRadarSignal;
  onViewEvidence: (signal: OpportunityRadarSignal) => void;
  onConvert: (signal: OpportunityRadarSignal) => void;
  onDismiss: (signal: OpportunityRadarSignal) => void;
  onReview?: (signal: OpportunityRadarSignal) => void;
  onExplainDecision?: (signal: OpportunityRadarSignal) => void;
  onNavigateToCustomer?: (customerId: number) => void;
  compact?: boolean;
}

export const RadarSignalCard: React.FC<RadarSignalCardProps> = ({
  signal,
  onViewEvidence,
  onConvert,
  onDismiss,
  onReview,
  onExplainDecision,
  onNavigateToCustomer,
  compact = false,
}) => {
  const isConverted = signal.status === 'CONVERTED';
  const isDismissed = signal.status === 'DISMISSED';
  const isServiceDeprioritized = signal.serviceDeprioritized;
  const isHealthGated = signal.healthGateApplied;

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'danger';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      default:
        return 'neutral';
    }
  };

  const getSignalTypeBadge = (type: string) => {
    switch (type) {
      case 'PRODUCT_COVERAGE_GAP':
        return <Badge variant="warning" size="sm">Product Gap</Badge>;
      case 'RELATIONSHIP_EXPANSION':
        return <Badge variant="success" size="sm">Expansion Opportunity</Badge>;
      case 'OPPORTUNITY_FOLLOWUP':
        return <Badge variant="info" size="sm">Pipeline Momentum</Badge>;
      case 'RENEWAL_MATURITY':
        return <Badge variant="brand" size="sm">Maturity / Renewal</Badge>;
      case 'ENGAGEMENT_OPPORTUNITY':
        return <Badge variant="neutral" size="sm">Engagement Cadence</Badge>;
      case 'SERVICE_FIRST_RECOVERY':
        return <Badge variant="danger" size="sm">Service Recovery</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{type}</Badge>;
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'INVESTMENTS':
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case 'LENDING':
        return <DollarSign className="w-4 h-4 text-blue-600" />;
      case 'CARDS':
        return <Layers className="w-4 h-4 text-purple-600" />;
      case 'INSURANCE':
        return <ShieldAlert className="w-4 h-4 text-indigo-600" />;
      case 'DEPOSITS':
        return <Package className="w-4 h-4 text-amber-600" />;
      default:
        return <Radar className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <div
      className={`rounded-xl border transition-all duration-200 ${
        isConverted
          ? 'bg-emerald-500/10 border-emerald-500/30 opacity-90'
          : isDismissed
          ? 'bg-slate-500/10 border-slate-500/30 opacity-70'
          : signal.priority === 'CRITICAL'
          ? 'bg-red-500/10 border-red-500/30 hover:border-red-500/50 hover:shadow-xs'
          : signal.priority === 'HIGH'
          ? 'bg-amber-500/10 border-amber-500/30 hover:border-amber-500/50 hover:shadow-xs'
          : 'bg-[#FFFFFF] dark:bg-[#162638] border-[#DCE3EA] dark:border-[#33485D] hover:border-[#168C83] hover:shadow-xs'
      }`}
    >
      <div className="p-5">
        {/* Header Badges & Score */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#EDF1F5] dark:bg-[#101C2A] text-[#142C45] dark:text-[#E8EEF5] text-xs font-medium border border-[#DCE3EA] dark:border-[#33485D]">
              {getCategoryIcon(signal.category)}
              <span>{signal.category}</span>
            </div>
            {getSignalTypeBadge(signal.signalType)}
            <Badge variant={getPriorityVariant(signal.priority)} size="sm">
              {signal.priority}
            </Badge>

            {isConverted && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/40">
                <CheckCircle2 className="w-3.5 h-3.5" /> Converted
              </span>
            )}
            {isDismissed && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-slate-500/20 text-slate-700 dark:text-slate-300 border border-slate-500/30">
                <XCircle className="w-3.5 h-3.5" /> Dismissed
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right font-mono">
              <div className="text-[10px] text-[#5D6B7B] dark:text-[#8194A8] font-medium uppercase">Relevance</div>
              <div className="text-sm font-bold text-[#142C45] dark:text-[#E8EEF5]">
                {signal.relevanceScore}%
              </div>
            </div>
            <div className="w-9 h-9 rounded-full border border-[#168C83]/30 bg-[#168C83]/10 flex items-center justify-center font-bold text-xs font-mono text-[#168C83]">
              {signal.relevanceScore}
            </div>
          </div>
        </div>

        {/* Safety Gate Warning Banners */}
        {isServiceDeprioritized && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Service-First Safety Gate Applied:</span> Customer has unresolved service issues. Commercial priority reduced until grievances are resolved.
            </div>
          </div>
        )}

        {isHealthGated && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-2 text-xs text-red-800 dark:text-red-300">
            <ShieldAlert className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Health Gate Applied:</span> CORE Score indicates customer vulnerability. High-pressure sales restricted.
            </div>
          </div>
        )}

        {/* Title & Summary */}
        <h4 className="text-base font-semibold text-[#142C45] dark:text-[#E8EEF5] mb-1 leading-snug">
          {signal.title}
        </h4>
        <p className="text-sm text-[#5D6B7B] dark:text-[#A9BACB] mb-3 line-clamp-2 leading-relaxed">
          {signal.summary}
        </p>

        {/* Customer Context Line */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[#5D6B7B] dark:text-[#8194A8] mb-3 pb-3 border-b border-[#DCE3EA] dark:border-[#33485D]">
          <div className="flex items-center gap-1.5 font-medium text-[#273444] dark:text-[#E8EEF5]">
            <span>Customer:</span>
            {onNavigateToCustomer ? (
              <button
                type="button"
                onClick={() => onNavigateToCustomer(signal.customerId)}
                className="text-[#168C83] hover:underline font-semibold flex items-center gap-0.5"
              >
                {signal.customerName || `Customer #${signal.customerId}`}
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </button>
            ) : (
              <span className="font-semibold">{signal.customerName || `Customer #${signal.customerId}`}</span>
            )}
            {signal.cifNumber && <span className="text-[#8793A1] font-mono">({signal.cifNumber})</span>}
          </div>

          {signal.targetProductName && (
            <div className="flex items-center gap-1 text-purple-700 dark:text-purple-300 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded font-medium">
              <Package className="w-3 h-3" />
              <span>Target: {signal.targetProductName}</span>
            </div>
          )}

          {signal.expectedValueBand && (
            <div className="text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded font-mono font-medium">
              Band: {signal.expectedValueBand}
            </div>
          )}
        </div>

        {/* Explainability Callout: Why COREvia believes this is relevant */}
        <div className="rounded-lg bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] p-3 mb-4 text-xs">
          <div className="font-semibold text-[#142C45] dark:text-[#E8EEF5] flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-[#168C83]" />
            <span>Why COREvia believes this is relevant:</span>
          </div>
          <p className="text-[#5D6B7B] dark:text-[#A9BACB] leading-relaxed">
            {signal.rationale}
          </p>
        </div>

        {/* Evidence preview count */}
        <div className="flex items-center justify-between text-xs text-[#5D6B7B] dark:text-[#8194A8] mb-4">
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-[#8793A1]" />
            <span>
              Supported by <strong className="text-[#142C45] dark:text-[#E8EEF5] font-mono">{signal.evidence?.length || 0}</strong> verified CRM records
            </span>
          </div>
          <span className="font-mono text-[11px] text-[#8793A1]">
            Rule: {signal.ruleId}
          </span>
        </div>

        {/* Converted Opportunity Link if exists */}
        {isConverted && signal.convertedOpportunityCode && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-900 dark:text-emerald-200 flex items-center justify-between">
            <span>
              Converted to Opportunity <strong>{signal.convertedOpportunityCode}</strong>
            </span>
            <span className="text-[11px] text-emerald-700 dark:text-emerald-400 font-medium">
              {signal.convertedOpportunityTitle}
            </span>
          </div>
        )}

        {/* Dismissed reason if exists */}
        {isDismissed && signal.dismissedReason && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-slate-500/10 border border-slate-500/30 text-xs text-[#5D6B7B] dark:text-[#A9BACB]">
            <span className="font-semibold text-[#142C45] dark:text-[#E8EEF5]">Dismissed Reason:</span> {signal.dismissedReason}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[#DCE3EA] dark:border-[#33485D]">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewEvidence(signal)}
              className="flex items-center gap-1 text-xs border-[#DCE3EA] dark:border-[#33485D] text-[#273444] dark:text-[#E8EEF5]"
            >
              <FileText className="w-3.5 h-3.5 text-[#168C83]" />
              <span>Inspect Evidence ({signal.evidence?.length || 0})</span>
            </Button>
            {onExplainDecision && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExplainDecision(signal)}
                className="flex items-center gap-1 text-xs border-[#DCE3EA] dark:border-[#33485D] text-[#273444] dark:text-[#E8EEF5]"
              >
                <Sparkles className="w-3.5 h-3.5 text-[#168C83]" />
                <span>Decision Trace</span>
              </Button>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                window.location.href = `/strategy-simulator?customerId=${signal.customerId}`;
              }}
              className="flex items-center gap-1 text-xs border-[#DCE3EA] dark:border-[#33485D] text-[#273444] dark:text-[#E8EEF5]"
              title="Simulate relationship response in Strategy Sandbox"
            >
              <Compass className="w-3.5 h-3.5 text-[#D9A441]" />
              <span>Simulate Response</span>
            </Button>
          </div>

          {!isConverted && !isDismissed && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDismiss(signal)}
                className="text-xs text-[#5D6B7B] dark:text-[#8194A8] hover:text-red-600 hover:bg-red-500/10"
              >
                Dismiss
              </Button>
              {onReview && signal.status === 'DETECTED' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReview(signal)}
                  className="text-xs text-[#168C83] border-[#168C83]/30 hover:bg-[#168C83]/10"
                >
                  Mark Reviewed
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={() => onConvert(signal)}
                className="flex items-center gap-1.5 text-xs bg-[#142C45] dark:bg-[#168C83] hover:bg-[#192B3D] dark:hover:bg-[#1B9D92] text-white font-medium shadow-xs"
              >
                <span>Convert to Opportunity</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
