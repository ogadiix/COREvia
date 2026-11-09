import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertTriangle,
  ExternalLink,
  ShieldCheck,
  Clock,
  User,
} from 'lucide-react';
import { PendingActionDetails } from '../../context/CopilotContext';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

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
      <div className="mt-3 p-3.5 bg-[#F0FDF4] dark:bg-emerald-950/40 border border-[#BBF7D0] dark:border-emerald-800/60 rounded-lg text-[#14532D] dark:text-emerald-300 shadow-2xs motion-fade-in">
        <div className="flex items-center gap-2 font-semibold text-xs text-[#16803C] dark:text-emerald-400">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16803C] dark:text-emerald-400" />
          <span>Action Confirmed & Executed in Master Ledger</span>
        </div>
        <p className="mt-1 text-xs text-[#166534] dark:text-emerald-200">
          {actionResult.message}
        </p>
        {actionResult.entityId && (
          <div className="mt-2.5 flex items-center gap-2 flex-wrap">
            <span className="font-mono text-[11px] px-2 py-0.5 bg-[#DCFCE7] dark:bg-emerald-900/60 text-[#15803D] dark:text-emerald-300 rounded-sm border border-[#86EFAC] dark:border-emerald-700/60 font-semibold">
              Reference: {actionResult.entityId}
            </span>
            {onNavigate && actionResult.entityType === 'TASK' && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onNavigate('/tasks')}
                icon={<ExternalLink className="w-3 h-3" />}
                iconPosition="right"
              >
                Open in Tasks Workspace
              </Button>
            )}
            {onNavigate && actionResult.entityType === 'CUSTOMER' && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onNavigate('/customers')}
                icon={<ExternalLink className="w-3 h-3" />}
                iconPosition="right"
              >
                Open in Customer 360
              </Button>
            )}
            {onNavigate && actionResult.entityType === 'OPPORTUNITY' && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onNavigate('/opportunities')}
                icon={<ExternalLink className="w-3 h-3" />}
                iconPosition="right"
              >
                Open in Pipeline
              </Button>
            )}
            {onNavigate && actionResult.entityType === 'CASE' && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onNavigate('/service-desk')}
                icon={<ExternalLink className="w-3 h-3" />}
                iconPosition="right"
              >
                Open in Service Desk
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  if (actionResult?.status === 'CANCELLED') {
    return (
      <div className="mt-3 p-3 bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#CBD5E1] dark:border-[#33485D] rounded-lg text-[#64748B] dark:text-[#A9BACB] text-xs flex items-center gap-2 motion-fade-in">
        <XCircle className="w-4 h-4 text-[#8194A8] dark:text-[#64748B] shrink-0" />
        <span>Proposal cancelled by officer. No modifications committed to Core Banking database.</span>
      </div>
    );
  }

  const actionId = pendingAction.action_id || (pendingAction as any).actionId;

  const handleConfirm = async () => {
    if (!actionId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onConfirm(actionId, messageId);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = async () => {
    if (!actionId || isSubmitting) return;
    setIsSubmitting(true);
    try {
      await onCancel(actionId, messageId);
    } finally {
      setIsSubmitting(false);
    }
  };

  const details = pendingAction.details || {};

  return (
    <div className="mt-3 border-2 border-amber-500/50 dark:border-amber-400/40 bg-[#FFFBEB] dark:bg-[#1E293B]/70 rounded-xl p-4 shadow-sm motion-dialog-enter text-[#142C45] dark:text-[#E8EEF5]">
      {/* Header Badge */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2.5">
          <span className="p-1.5 bg-amber-500/10 dark:bg-amber-400/20 text-amber-700 dark:text-amber-300 rounded-lg border border-amber-500/30">
            <ShieldAlert className="w-4 h-4" />
          </span>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-[11px] font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider">
                Dual-Control Authorization Required
              </h4>
              <span className="inline-flex items-center gap-1 text-[10px] text-amber-700 dark:text-amber-300 font-mono">
                <Clock className="w-3 h-3" />
                Pending Review
              </span>
            </div>
            <p className="text-xs font-semibold text-[#142C45] dark:text-[#E8EEF5]">
              {pendingAction.title}
            </p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 text-[10px] font-mono uppercase bg-[#FFFFFF] dark:bg-[#162638] text-[#142C45] dark:text-[#E8EEF5] border border-[#DCE3EA] dark:border-[#33485D] rounded font-semibold shadow-xs">
          {pendingAction.action_type.replace(/_/g, ' ')}
        </span>
      </div>

      {/* Structured Details Box */}
      <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg p-3.5 text-xs space-y-2.5 mb-3 shadow-2xs">
        {details.customer && (
          <div className="flex items-start justify-between gap-4">
            <span className="text-[#5D6B7B] dark:text-[#A9BACB] flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#168C83]" />
              Target Customer:
            </span>
            <span className="text-[#142C45] dark:text-[#E8EEF5] font-semibold text-right">{details.customer}</span>
          </div>
        )}
        {details.title && (
          <div className="flex items-start justify-between gap-4">
            <span className="text-[#5D6B7B] dark:text-[#A9BACB]">Action / Subject:</span>
            <span className="text-[#142C45] dark:text-[#E8EEF5] font-medium text-right">{details.title}</span>
          </div>
        )}
        {details.dueDate && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#5D6B7B] dark:text-[#A9BACB] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              Target Due Date:
            </span>
            <span className="text-amber-700 dark:text-amber-300 font-mono font-medium">
              {details.dueDate}
            </span>
          </div>
        )}
        {details.priority && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#5D6B7B] dark:text-[#A9BACB]">Priority Level:</span>
            <Badge
              variant={
                details.priority === 'CRITICAL'
                  ? 'danger'
                  : details.priority === 'HIGH'
                  ? 'warning'
                  : 'info'
              }
              size="sm"
            >
              {details.priority}
            </Badge>
          </div>
        )}
        {details.expectedValue && (
          <div className="flex items-center justify-between gap-4">
            <span className="text-[#5D6B7B] dark:text-[#A9BACB]">Expected Value:</span>
            <span className="text-emerald-700 dark:text-emerald-400 font-semibold font-mono">{details.expectedValue}</span>
          </div>
        )}
        {details.description && (
          <div className="pt-2 border-t border-[#DCE3EA] dark:border-[#33485D] text-[#5D6B7B] dark:text-[#A9BACB] italic text-[11px] leading-relaxed">
            "{details.description}"
          </div>
        )}
      </div>

      {/* Security Statement */}
      <div className="text-[11px] text-amber-800 dark:text-amber-200 mb-3.5 flex items-start gap-2 bg-amber-500/10 dark:bg-amber-400/10 p-2.5 rounded-lg border border-amber-500/20">
        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
        <span className="leading-relaxed">
          <strong>Institutional Governance:</strong> Gemini Banking Copilot operates in read/propose-only mode and cannot write directly to the database. Authorizing this action will trigger a validated transaction in PostgreSQL and register your employee ID in the audit trail.
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <Button
          variant="brand"
          size="sm"
          loading={isSubmitting}
          onClick={handleConfirm}
          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          className="flex-1 font-semibold"
        >
          {isSubmitting ? 'Authorizing Transaction...' : 'Authorize & Execute'}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={isSubmitting}
          onClick={handleCancel}
          icon={<XCircle className="w-3.5 h-3.5" />}
        >
          Cancel Proposal
        </Button>
      </div>
    </div>
  );
};
