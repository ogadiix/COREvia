import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  User,
  Calendar,
  AlertTriangle,
  FileText,
  ExternalLink,
} from 'lucide-react';
import { PendingActionDetails } from '../../context/CopilotContext';

interface CopilotActionCardProps {
  pendingAction: PendingActionDetails;
  messageId: string;
  onConfirm: (actionId: string, messageId: string) => Promise<void>;
  onCancel: (actionId: string, messageId: string) => Promise<void>;
  actionResult?: {
    status: 'CONFIRMED' | 'CANCELLED';
    message: string;
    entityId?: string;
    entityType?: string;
  } | null;
  onNavigate?: (path: string) => void;
}

export const CopilotActionCard: React.FC<CopilotActionCardProps> = ({
  pendingAction,
  messageId,
  onConfirm,
  onCancel,
  actionResult,
  onNavigate,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (actionResult?.status === 'CONFIRMED') {
    return (
      <div className="mt-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl">
        <div className="flex items-center gap-2 text-emerald-400 font-medium text-sm">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400" />
          <span>Action Confirmed & Executed</span>
        </div>
        <p className="mt-1 text-xs text-slate-300">
          {actionResult.message}
        </p>
        {actionResult.entityId && (
          <div className="mt-2.5 flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-mono rounded-md">
              Ref: {actionResult.entityId}
            </span>
            {onNavigate && actionResult.entityType === 'TASK' && (
              <button
                onClick={() => onNavigate('/tasks')}
                className="inline-flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium underline underline-offset-2"
              >
                Open in Tasks
                <ExternalLink className="w-3 h-3" />
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  if (actionResult?.status === 'CANCELLED') {
    return (
      <div className="mt-3 p-3.5 bg-slate-800/60 border border-slate-700/50 rounded-xl text-slate-400 text-xs flex items-center gap-2">
        <XCircle className="w-4 h-4 text-slate-400 flex-shrink-0" />
        <span>Proposal cancelled. No database changes were made.</span>
      </div>
    );
  }

  const actionId = pendingAction.action_id || (pendingAction as any).actionId;

  const handleConfirm = async () => {
    if (!actionId) return;
    setIsSubmitting(true);
    try {
      await onConfirm(actionId, messageId);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!actionId) return;
    setIsSubmitting(true);
    try {
      await onCancel(actionId, messageId);
    } finally {
      setIsSubmitting(false);
    }
  };

  const details = pendingAction.details || {};

  return (
    <div className="mt-3 border border-amber-500/30 bg-amber-500/5 rounded-xl p-4 transition-all">
      {/* Header Badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span className="p-1 bg-amber-500/20 text-amber-400 rounded-md">
            <ShieldAlert className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
              Authorization Required
            </h4>
            <p className="text-xs font-medium text-slate-200">
              {pendingAction.title}
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-700 rounded-md">
          {pendingAction.action_type}
        </span>
      </div>

      {/* Structured Details Box */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 text-xs space-y-2 mb-3">
        {details.customer && (
          <div className="flex items-start justify-between gap-4">
            <span className="text-slate-400">Target Customer:</span>
            <span className="text-slate-200 font-medium text-right">{details.customer}</span>
          </div>
        )}
        {details.title && (
          <div className="flex items-start justify-between gap-4">
            <span className="text-slate-400">Action / Subject:</span>
            <span className="text-slate-200 font-medium text-right">{details.title}</span>
          </div>
        )}
        {details.dueDate && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Target Due Date:</span>
            <span className="text-amber-400 font-mono font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {details.dueDate}
            </span>
          </div>
        )}
        {details.priority && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Priority Level:</span>
            <span className="px-1.5 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-semibold rounded">
              {details.priority}
            </span>
          </div>
        )}
        {details.expectedValue && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-slate-400">Expected Value:</span>
            <span className="text-emerald-400 font-semibold">{details.expectedValue}</span>
          </div>
        )}
        {details.description && (
          <div className="pt-1.5 border-t border-slate-800 text-slate-300 italic">
            "{details.description}"
          </div>
        )}
      </div>

      {/* Security Statement */}
      <div className="text-[11px] text-slate-400 mb-3 flex items-start gap-1.5">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 flex-shrink-0 mt-0.5" />
        <span>
          Gemini Banking Copilot cannot perform mutations without explicit officer confirmation.
          Clicking confirm will commit this action to the PostgreSQL database with an immutable audit log.
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleConfirm}
          disabled={isSubmitting}
          className="flex-1 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-50 text-white font-medium text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors shadow-sm"
        >
          <CheckCircle2 className="w-4 h-4" />
          {isSubmitting ? 'Authorizing & Creating...' : 'Confirm & Create'}
        </button>
        <button
          onClick={handleCancel}
          disabled={isSubmitting}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-300 text-xs font-medium rounded-lg transition-colors border border-slate-700"
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
