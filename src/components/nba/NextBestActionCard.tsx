import React from 'react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import type { NextBestAction } from '../../types';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  CheckSquare,
  HelpCircle,
  ArrowRight,
  ShieldAlert,
  Clock,
  ExternalLink,
  Target,
} from 'lucide-react';

interface NextBestActionCardProps {
  action: NextBestAction;
  onAccept?: (action: NextBestAction) => void;
  onDismiss?: (action: NextBestAction) => void;
  onCreateTask?: (action: NextBestAction) => void;
  onViewEvidence?: (action: NextBestAction) => void;
  onNavigateToCustomer?: (customerId: number) => void;
  compact?: boolean;
}

export const NextBestActionCard: React.FC<NextBestActionCardProps> = ({
  action,
  onAccept,
  onDismiss,
  onCreateTask,
  onViewEvidence,
  onNavigateToCustomer,
  compact = false,
}) => {
  const isTop = action.isTopRecommendation;
  const isServiceFirst = action.actionType === 'SERVICE';
  const isDismissed = action.status === 'DISMISSED';
  const isAccepted = action.status === 'ACCEPTED';

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

  const getUrgencyBadge = (urgency: string) => {
    switch (urgency) {
      case 'IMMEDIATE':
        return <Badge variant="danger" size="sm">Immediate Action</Badge>;
      case 'TODAY':
        return <Badge variant="warning" size="sm">Due Today</Badge>;
      case 'THIS_WEEK':
        return <Badge variant="info" size="sm">This Week</Badge>;
      default:
        return <Badge variant="neutral" size="sm">{urgency}</Badge>;
    }
  };

  const getActionTypeBadge = (type: string) => {
    switch (type) {
      case 'SERVICE':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200">
            <ShieldAlert className="w-3 h-3 text-rose-600" />
            Service Priority
          </span>
        );
      case 'OPP_FOLLOWUP':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
            Pipeline Follow-up
          </span>
        );
      case 'CROSS_SELL':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
            Cross-Sell Opportunity
          </span>
        );
      case 'TASK':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 border border-indigo-200">
            Operational Task
          </span>
        );
      case 'ENGAGEMENT':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded bg-sky-100 text-sky-800 border border-sky-200">
            Relationship Touchpoint
          </span>
        );
    }
  };

  return (
    <div
      className={`rounded-xl transition-all duration-200 border ${
        isTop
          ? 'bg-gradient-to-br from-amber-50/50 via-white to-amber-50/30 border-amber-300 shadow-sm'
          : isServiceFirst
          ? 'bg-rose-50/30 border-rose-200/80 shadow-xs'
          : 'bg-white border-slate-200 shadow-xs hover:border-slate-300'
      } ${compact ? 'p-3.5' : 'p-4'}`}
    >
      {/* Service First Callout Banner if Service Priority */}
      {isServiceFirst && !compact && (
        <div className="mb-2.5 px-3 py-1.5 rounded-lg bg-rose-100/70 border border-rose-200 flex items-center justify-between text-xs text-rose-900 font-medium">
          <div className="flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>Service-First Mandate: Open service grievances take precedence over cross-selling.</span>
          </div>
          <span className="text-[10px] font-mono text-rose-700 uppercase font-bold">Rule Protected</span>
        </div>
      )}

      {/* Header Row */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 flex-wrap">
          {isTop && (
            <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-500 text-white shadow-xs">
              <Sparkles className="w-3 h-3 text-white" />
              Top Recommendation
            </span>
          )}
          {getActionTypeBadge(action.actionType)}
          <Badge variant={getPriorityVariant(action.priority)} size="sm">
            {action.priority}
          </Badge>
          {getUrgencyBadge(action.urgency)}
        </div>

        <div className="flex items-center gap-2">
          <span className="text-[11px] font-mono text-slate-400">
            Score: <strong className="text-slate-700">{action.rankScore.toFixed(1)}</strong>
          </span>
          {onViewEvidence && (
            <button
              type="button"
              onClick={() => onViewEvidence(action)}
              className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold transition-colors"
              title="View deterministic rule rationale and linked evidence records"
            >
              <HelpCircle className="w-3.5 h-3.5" />
              Why this action?
            </button>
          )}
        </div>
      </div>

      {/* Customer Header if Present */}
      {action.customerName && (
        <div className="mb-1.5 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="font-semibold text-slate-800">{action.customerName}</span>
            {action.customerCode && <span className="font-mono text-slate-400">({action.customerCode})</span>}
          </div>
          {onNavigateToCustomer && (
            <button
              type="button"
              onClick={() => onNavigateToCustomer(action.customerId)}
              className="text-indigo-600 hover:text-indigo-800 text-[11px] font-medium inline-flex items-center gap-0.5"
            >
              Customer 360 <ExternalLink className="w-2.5 h-2.5" />
            </button>
          )}
        </div>
      )}

      {/* Title & Description */}
      <h4 className="text-sm font-bold text-slate-900 mb-1 leading-snug">{action.title}</h4>
      <p className="text-xs text-slate-600 leading-relaxed mb-3">{action.description}</p>

      {/* Rationale & Expected Impact (full view) */}
      {!compact && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-3 text-xs">
          <div className="p-2 rounded bg-slate-50 border border-slate-100">
            <span className="font-semibold text-slate-700 block mb-0.5">Rationale</span>
            <span className="text-slate-600 leading-relaxed">{action.rationale}</span>
          </div>
          <div className="p-2 rounded bg-indigo-50/40 border border-indigo-100">
            <span className="font-semibold text-indigo-900 block mb-0.5">Expected Impact</span>
            <span className="text-slate-700 leading-relaxed">{action.expectedImpact}</span>
          </div>
        </div>
      )}

      {/* Evidence Summary preview pill */}
      {action.evidence && action.evidence.length > 0 && !compact && (
        <div className="mb-3 flex items-center gap-2 text-[11px] text-slate-500 bg-slate-50/70 px-2.5 py-1.5 rounded border border-slate-100">
          <span className="font-medium text-slate-700">Evidence verified:</span>
          <span className="truncate">{action.evidence[0].recordTitle} ({action.evidence[0].evidenceSummary})</span>
          {action.evidence.length > 1 && (
            <span className="text-indigo-600 font-semibold shrink-0">+{action.evidence.length - 1} more</span>
          )}
        </div>
      )}

      {/* Linked Task Notice */}
      {action.createdTaskId && (
        <div className="mb-3 p-2 rounded bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-1.5">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Task linked and assigned in CRM (Task #{action.createdTaskId})</span>
        </div>
      )}

      {/* Resolution State Notice */}
      {isAccepted && !action.createdTaskId && (
        <div className="mb-3 p-1.5 rounded bg-emerald-50 text-xs text-emerald-700 font-medium text-center">
          Accepted by {action.acceptedByName || 'Officer'}
        </div>
      )}

      {isDismissed && (
        <div className="mb-3 p-1.5 rounded bg-slate-100 text-xs text-slate-600 italic">
          Dismissed: "{action.dismissedReason}"
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
        <div className="text-[11px] text-slate-400">
          Rule: <span className="font-mono">{action.ruleId}</span>
        </div>

        {action.status === 'ACTIVE' ? (
          <div className="flex items-center gap-1.5">
            {onDismiss && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onDismiss(action)}
                className="text-slate-600 hover:text-rose-600 hover:border-rose-300"
              >
                Dismiss
              </Button>
            )}

            {onCreateTask && !action.createdTaskId && (
              <Button
                variant="secondary"
                size="sm"
                onClick={() => onCreateTask(action)}
                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 border-indigo-200"
              >
                <CheckSquare className="w-3 h-3" />
                Create Task
              </Button>
            )}

            {onAccept && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => onAccept(action)}
                className="inline-flex items-center gap-1 font-semibold"
              >
                <span>Take Action</span>
                <ArrowRight className="w-3 h-3" />
              </Button>
            )}
          </div>
        ) : (
          <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
            Status: {action.status}
          </span>
        )}
      </div>
    </div>
  );
};
