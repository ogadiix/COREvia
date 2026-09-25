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
} from 'lucide-react';

interface RadarSignalCardProps {
  signal: OpportunityRadarSignal;
  onViewEvidence: (signal: OpportunityRadarSignal) => void;
  onConvert: (signal: OpportunityRadarSignal) => void;
  onDismiss: (signal: OpportunityRadarSignal) => void;
  onReview?: (signal: OpportunityRadarSignal) => void;
  onNavigateToCustomer?: (customerId: number) => void;
  compact?: boolean;
}

export const RadarSignalCard: React.FC<RadarSignalCardProps> = ({
  signal,
  onViewEvidence,
  onConvert,
  onDismiss,
  onReview,
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
          ? 'bg-emerald-50/40 border-emerald-200 opacity-90'
          : isDismissed
          ? 'bg-gray-50/60 border-gray-200 opacity-70'
          : signal.priority === 'CRITICAL'
          ? 'bg-rose-50/30 border-rose-200 hover:border-rose-300 hover:shadow-sm'
          : signal.priority === 'HIGH'
          ? 'bg-amber-50/20 border-amber-200/80 hover:border-amber-300 hover:shadow-sm'
          : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
      }`}
    >
      <div className="p-5">
        {/* Header Badges & Score */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-medium">
              {getCategoryIcon(signal.category)}
              <span>{signal.category}</span>
            </div>
            {getSignalTypeBadge(signal.signalType)}
            <Badge variant={getPriorityVariant(signal.priority)} size="sm">
              {signal.priority}
            </Badge>

            {isConverted && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-100 text-emerald-800">
                <CheckCircle2 className="w-3.5 h-3.5" /> Converted
              </span>
            )}
            {isDismissed && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-gray-200 text-gray-700">
                <XCircle className="w-3.5 h-3.5" /> Dismissed
              </span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="text-right">
              <div className="text-xs text-gray-500 font-medium">Relevance</div>
              <div className="text-sm font-bold text-gray-900">
                {signal.relevanceScore}%
              </div>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-brand-200 bg-brand-50 flex items-center justify-center font-bold text-xs text-brand-700">
              {signal.relevanceScore}
            </div>
          </div>
        </div>

        {/* Safety Gate Warning Banners */}
        {isServiceDeprioritized && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 flex items-start gap-2 text-xs text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Service-First Safety Gate Applied:</span> Customer has unresolved service issues. Commercial priority reduced until grievances are resolved.
            </div>
          </div>
        )}

        {isHealthGated && (
          <div className="mb-3 px-3 py-2 rounded-lg bg-red-50 border border-red-200 flex items-start gap-2 text-xs text-red-800">
            <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Health Gate Applied:</span> CORE Score indicates customer vulnerability. High-pressure sales restricted.
            </div>
          </div>
        )}

        {/* Title & Summary */}
        <h4 className="text-base font-semibold text-gray-900 mb-1 leading-snug">
          {signal.title}
        </h4>
        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
          {signal.summary}
        </p>

        {/* Customer Context Line */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500 mb-3 pb-3 border-b border-gray-100">
          <div className="flex items-center gap-1.5 font-medium text-gray-700">
            <span>Customer:</span>
            {onNavigateToCustomer ? (
              <button
                type="button"
                onClick={() => onNavigateToCustomer(signal.customerId)}
                className="text-brand-600 hover:text-brand-800 hover:underline font-semibold flex items-center gap-0.5"
              >
                {signal.customerName || `Customer #${signal.customerId}`}
                <ExternalLink className="w-3 h-3 ml-0.5" />
              </button>
            ) : (
              <span className="font-semibold">{signal.customerName || `Customer #${signal.customerId}`}</span>
            )}
            {signal.cifNumber && <span className="text-gray-400 font-mono">({signal.cifNumber})</span>}
          </div>

          {signal.targetProductName && (
            <div className="flex items-center gap-1 text-purple-700 bg-purple-50 px-2 py-0.5 rounded font-medium">
              <Package className="w-3 h-3" />
              <span>Target: {signal.targetProductName}</span>
            </div>
          )}

          {signal.expectedValueBand && (
            <div className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
              Band: {signal.expectedValueBand}
            </div>
          )}
        </div>

        {/* Explainability Callout: Why COREvia believes this is relevant */}
        <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-3 mb-4 text-xs">
          <div className="font-semibold text-slate-800 flex items-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-brand-600" />
            <span>Why COREvia believes this is relevant:</span>
          </div>
          <p className="text-slate-600 leading-relaxed">
            {signal.rationale}
          </p>
        </div>

        {/* Evidence preview count */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4">
          <div className="flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-gray-400" />
            <span>
              Supported by <strong className="text-gray-700">{signal.evidence?.length || 0}</strong> verified CRM records
            </span>
          </div>
          <span className="font-mono text-[11px] text-gray-400">
            Rule: {signal.ruleId}
          </span>
        </div>

        {/* Converted Opportunity Link if exists */}
        {isConverted && signal.convertedOpportunityCode && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-emerald-100/60 border border-emerald-300 text-xs text-emerald-900 flex items-center justify-between">
            <span>
              Converted to Opportunity <strong>{signal.convertedOpportunityCode}</strong>
            </span>
            <span className="text-[11px] text-emerald-700 font-medium">
              {signal.convertedOpportunityTitle}
            </span>
          </div>
        )}

        {/* Dismissed reason if exists */}
        {isDismissed && signal.dismissedReason && (
          <div className="mb-4 px-3 py-2 rounded-lg bg-gray-100 border border-gray-300 text-xs text-gray-700">
            <span className="font-semibold">Dismissed Reason:</span> {signal.dismissedReason}
          </div>
        )}

        {/* Action Controls */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-100">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onViewEvidence(signal)}
            className="flex items-center gap-1 text-xs"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Inspect Evidence ({signal.evidence?.length || 0})</span>
          </Button>

          {!isConverted && !isDismissed && (
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDismiss(signal)}
                className="text-xs text-gray-500 hover:text-red-600 hover:bg-red-50"
              >
                Dismiss
              </Button>
              {onReview && signal.status === 'DETECTED' && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onReview(signal)}
                  className="text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                >
                  Mark Reviewed
                </Button>
              )}
              <Button
                variant="primary"
                size="sm"
                onClick={() => onConvert(signal)}
                className="flex items-center gap-1.5 text-xs bg-brand-600 hover:bg-brand-700 text-white font-medium shadow-sm"
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
