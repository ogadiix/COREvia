import React, { useState } from 'react';
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  Calendar,
  AlertTriangle,
  ExternalLink,
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
      <div className="mt-3 p-3.5 bg-[#F0FDF4] border border-[#BBF7D0] rounded-sm text-[#14532D] shadow-2xs motion-fade-in">
        <div className="flex items-center gap-2 font-semibold text-xs text-[#16803C]">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-[#16803C]" />
          <span>Action Confirmed & Executed</span>
        </div>
        <p className="mt-1 text-xs text-[#166534]">
          {actionResult.message}
        </p>
        {actionResult.entityId && (
          <div className="mt-2.5 flex items-center gap-2">
            <span className="font-mono text-[11px] px-2 py-0.5 bg-[#DCFCE7] text-[#15803D] rounded-xs border border-[#86EFAC]">
              Ref: {actionResult.entityId}
            </span>
            {onNavigate && actionResult.entityType === 'TASK' && (
              <Button
                variant="ghost"
                size="xs"
                onClick={() => onNavigate('/tasks')}
                icon={<ExternalLink className="w-3 h-3" />}
                iconPosition="right"
              >
                Open in Tasks
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
                Open in Customers
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  if (actionResult?.status === 'CANCELLED') {
    return (
      <div className="mt-3 p-3 bg-[#F8FAFC] border border-[#CBD5E1] rounded-sm text-[#64748B] text-xs flex items-center gap-2 motion-fade-in">
        <XCircle className="w-4 h-4 text-[#94A3B8] shrink-0" />
        <span>Proposal cancelled. No database changes were made.</span>
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
    <div className="mt-3 border-2 border-[#D9A441] bg-[#FFFBEB] dark:bg-[#1C3045] rounded-sm p-3.5 shadow-2xs motion-dialog-enter text-[#172033] dark:text-[#E8EEF5]">
      {/* Header Badge */}
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <div className="flex items-center gap-2">
          <span className="p-1 bg-[#FEF3C7] dark:bg-amber-950/60 text-[#B45309] dark:text-amber-300 rounded-xs border border-[#FDE68A] dark:border-amber-700/50">
            <ShieldAlert className="w-4 h-4" />
          </span>
          <div>
            <h4 className="text-[11px] font-bold text-[#B45309] dark:text-amber-300 uppercase tracking-wider">
              Dual-Control Authorization Required
            </h4>
            <p className="text-xs font-semibold text-[#142C45] dark:text-[#E8EEF5]">
              {pendingAction.title}
            </p>
          </div>
        </div>
        <span className="px-2 py-0.5 text-[10px] font-mono uppercase bg-white dark:bg-[#162638] text-[#5D6B7B] dark:text-[#A9BACB] border border-[#DCE3EA] dark:border-[#33485D] rounded-xs font-medium">
          {pendingAction.action_type}
        </span>
      </div>

      {/* Structured Details Box */}
      <div className="bg-white dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-sm p-3 text-xs space-y-2 mb-3 shadow-2xs">
        {details.customer && (
          <div className="flex items-start justify-between gap-4">
            <span className="text-[#5D6B7B] dark:text-[#A9BACB]">Target Customer:</span>
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
            <span className="text-[#5D6B7B] dark:text-[#A9BACB]">Target Due Date:</span>
            <span className="text-[#B45309] dark:text-amber-300 font-mono font-medium flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
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
            <span className="text-[#16803C] dark:text-emerald-400 font-semibold font-mono">{details.expectedValue}</span>
          </div>
        )}
        {details.description && (
          <div className="pt-2 border-t border-[#DCE3EA] dark:border-[#26394C] text-[#5D6B7B] dark:text-[#A9BACB] italic">
            "{details.description}"
          </div>
        )}
      </div>

      {/* Security Statement */}
      <div className="text-[11px] text-[#78350F] dark:text-amber-200 mb-3 flex items-start gap-1.5 bg-[#FEF3C7]/60 dark:bg-amber-950/40 p-2 rounded-xs border border-[#FDE68A] dark:border-amber-700/50">
        <AlertTriangle className="w-3.5 h-3.5 text-[#B45309] dark:text-amber-400 shrink-0 mt-0.5" />
        <span>
          Gemini Banking Copilot cannot perform mutations without explicit officer confirmation.
          Clicking confirm will commit this action to the PostgreSQL database with an immutable audit log.
        </span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2 pt-0.5">
        <Button
          variant="brand"
          size="sm"
          loading={isSubmitting}
          onClick={handleConfirm}
          icon={<CheckCircle2 className="w-3.5 h-3.5" />}
          className="flex-1"
        >
          {isSubmitting ? 'Authorizing & Creating...' : 'Confirm & Create'}
        </Button>
        <Button
          variant="secondary"
          size="sm"
          disabled={isSubmitting}
          onClick={handleCancel}
        >
          Cancel Proposal
        </Button>
      </div>
    </div>
  );
};
