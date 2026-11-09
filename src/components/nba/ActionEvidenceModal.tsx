import React from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import type { NextBestAction } from '../../types';
import {
  FileText,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  Target,
  Sparkles,
} from 'lucide-react';

interface ActionEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: NextBestAction | null;
  onNavigateToCustomer?: (customerId: number) => void;
}

export const ActionEvidenceModal: React.FC<ActionEvidenceModalProps> = ({
  isOpen,
  onClose,
  action,
  onNavigateToCustomer,
}) => {
  if (!action) return null;

  const isServiceFirst = action.actionType === 'SERVICE';

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Recommendation Explainability & Evidence"
      size="4xl"
    >
      <div className="space-y-5">
        {/* Top Header Card */}
        <div
          className={`p-4 rounded-xl border ${
            isServiceFirst
              ? 'bg-rose-50/50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
              : 'bg-slate-50 dark:bg-[#101C2A] border-slate-200 dark:border-[#33485D]'
          }`}
        >
          <div className="flex items-start justify-between gap-3 mb-2">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-white dark:bg-[#162638] text-slate-700 dark:text-[#E8EEF5] border border-slate-200 dark:border-[#33485D]">
                {action.actionId}
              </span>
              <Badge variant={getPriorityVariant(action.priority)} size="sm">
                {action.priority}
              </Badge>
              {getUrgencyBadge(action.urgency)}
              <span className="text-xs font-semibold px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800">
                {action.actionType}
              </span>
            </div>
            {action.isTopRecommendation && (
              <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 dark:bg-amber-950/60 text-amber-900 dark:text-amber-200 border border-amber-300 dark:border-amber-700">
                <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                Top Priority
              </span>
            )}
          </div>

          <h3 className="text-base font-bold text-slate-900 dark:text-[#E8EEF5] mb-1">{action.title}</h3>
          <p className="text-sm text-slate-600 dark:text-[#A9BACB]">{action.description}</p>

          {/* Customer info */}
          {action.customerName && (
            <div className="mt-3 pt-3 border-t border-slate-200/70 dark:border-[#33485D] flex items-center justify-between text-xs text-slate-600 dark:text-[#8194A8]">
              <div>
                <span className="font-semibold text-slate-900 dark:text-[#E8EEF5]">{action.customerName}</span>
                {action.customerCode && <span className="ml-2 font-mono text-slate-500 dark:text-[#8194A8]">({action.customerCode})</span>}
                {action.cifNumber && <span className="ml-2 font-mono text-slate-500 dark:text-[#8194A8]">CIF: {action.cifNumber}</span>}
              </div>
              {onNavigateToCustomer && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onNavigateToCustomer(action.customerId);
                  }}
                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-medium inline-flex items-center gap-1 cursor-pointer"
                >
                  View 360 <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Explainability Breakdown */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-[#33485D] bg-white dark:bg-[#162638] shadow-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-[#8194A8] uppercase tracking-wide">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              Evaluation Governance
            </div>
            <div className="text-xs text-slate-700 dark:text-[#E8EEF5] space-y-1">
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-[#33485D]">
                <span className="text-slate-500 dark:text-[#8194A8]">Rule Triggered:</span>
                <span className="font-mono font-medium text-slate-900 dark:text-[#E8EEF5]">{action.ruleId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-[#33485D]">
                <span className="text-slate-500 dark:text-[#8194A8]">Rule Engine Version:</span>
                <span className="font-mono font-medium text-slate-900 dark:text-[#E8EEF5]">{action.ruleVersion}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-100 dark:border-[#33485D]">
                <span className="text-slate-500 dark:text-[#8194A8]">Confidence Rating:</span>
                <span className="font-semibold text-emerald-700 dark:text-emerald-400">
                  {action.confidence} ({Math.round(action.confidenceScore * 100)}%)
                </span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-500 dark:text-[#8194A8]">Deterministic Rank Score:</span>
                <span className="font-mono font-bold text-indigo-700 dark:text-indigo-400">{action.rankScore.toFixed(1)} / 100</span>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-lg border border-slate-200 dark:border-[#33485D] bg-white dark:bg-[#162638] shadow-xs space-y-1.5">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-[#8194A8] uppercase tracking-wide">
              <Target className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
              Expected Banking Impact
            </div>
            <p className="text-xs text-slate-700 dark:text-[#E8EEF5] leading-relaxed font-medium bg-indigo-50/50 dark:bg-indigo-950/40 p-2 rounded border border-indigo-100 dark:border-indigo-900/60">
              {action.expectedImpact}
            </p>
            <div className="text-[11px] text-slate-500 dark:text-[#8194A8] pt-1">
              Generated: {new Date(action.generatedAt).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
            </div>
          </div>
        </div>

        {/* Rationale Section */}
        <div className="p-3.5 rounded-lg border border-amber-200/80 bg-amber-50/40">
          <div className="text-xs font-bold text-amber-900 uppercase tracking-wide mb-1 flex items-center gap-1.5">
            <AlertCircle className="w-3.5 h-3.5 text-amber-600" />
            Decision Engine Rationale
          </div>
          <p className="text-xs text-slate-800 leading-relaxed">{action.rationale}</p>
        </div>

        {/* Evidence Records List */}
        <div>
          <div className="flex items-center justify-between mb-2.5">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-600" />
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Supporting Verification Evidence ({action.evidence?.length || 0} Records)
              </h4>
            </div>
            <span className="text-[11px] text-slate-500">Immutable CRM Audit Trail</span>
          </div>

          {action.evidence && action.evidence.length > 0 ? (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {action.evidence.map((ev, idx) => (
                <div
                  key={ev.id || idx}
                  className="p-3 rounded-lg border border-slate-200 bg-slate-50/50 hover:bg-slate-50 transition-colors text-xs"
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="px-1.5 py-0.5 rounded bg-slate-200/80 font-mono text-[10px] font-bold text-slate-800">
                        {ev.sourceEntityType}
                      </span>
                      {ev.sourceEntityCode && (
                        <span className="font-mono font-medium text-indigo-700">
                          {ev.sourceEntityCode}
                        </span>
                      )}
                      <span className="font-semibold text-slate-900">{ev.recordTitle}</span>
                    </div>
                    {ev.metricValue && (
                      <span className="px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 font-mono font-semibold text-[11px]">
                        {ev.metricValue}
                      </span>
                    )}
                  </div>

                  <p className="text-slate-700 font-medium">{ev.evidenceSummary}</p>
                  {ev.detail && <p className="text-slate-500 mt-1 text-[11px]">{ev.detail}</p>}

                  {ev.timestamp && (
                    <div className="mt-1.5 flex items-center gap-1 text-[10px] text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {new Date(ev.timestamp).toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="p-4 text-center rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-500">
              No specific discrete record linked; generated by portfolio baseline aggregate rules.
            </div>
          )}
        </div>

        {/* Actions taken if already handled */}
        {action.status !== 'ACTIVE' && (
          <div className="p-3 rounded-lg border border-slate-200 bg-slate-100 text-xs space-y-1">
            <div className="font-semibold text-slate-800">Lifecycle Resolution</div>
            <div className="text-slate-600">
              Status: <span className="font-bold">{action.status}</span>
              {action.acceptedByName && <span> by {action.acceptedByName}</span>}
              {action.dismissedByName && <span> by {action.dismissedByName}</span>}
              {action.dismissedReason && <div className="mt-1 italic">Reason: "{action.dismissedReason}"</div>}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-slate-200 flex justify-end">
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
