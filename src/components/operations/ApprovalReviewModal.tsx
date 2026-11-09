import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldAlert,
  CheckCircle2,
  XCircle,
  RotateCcw,
  AlertTriangle,
  Clock,
  User,
  Building,
  FileText,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../common/Toast';
import type { OperationalApprovalDTO } from '../../types/operations.types';

interface ApprovalReviewModalProps {
  approval: OperationalApprovalDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ApprovalReviewModal: React.FC<ApprovalReviewModalProps> = ({
  approval,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const toast = useToast();
  const [action, setAction] = useState<'APPROVE' | 'REJECT' | 'RETURN'>('APPROVE');
  const [checkerNotes, setCheckerNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          if (confirmDialog) {
            setConfirmDialog(false);
          } else {
            onClose();
          }
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, confirmDialog, onClose]);

  if (!isOpen || !approval) return null;

  const isMaker = user?.id === approval.makerId;
  const isFinalStatus = ['APPROVED', 'REJECTED', 'EXPIRED'].includes(approval.status);

  const handleSubmit = async () => {
    if (!checkerNotes.trim()) {
      setError('Checker notes/remarks are mandatory for audit compliance.');
      return;
    }
    setError(null);
    setIsSubmitting(true);
    try {
      const res = await api.actOnOperationalApproval(approval.id, action, checkerNotes);
      if (res && res.success) {
        setConfirmDialog(false);
        toast.success(`Operational approval ${approval.approvalId} actioned: ${action}`);
        onSuccess();
        onClose();
      } else {
        const msg = 'Operational action failed. Please check permissions.';
        setError(msg);
        toast.error(msg);
      }
    } catch (err: any) {
      const msg = err?.message || 'Dual-control action rejected by server.';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'HIGH':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FFFFFF] dark:bg-[#162638] rounded-lg border border-[#DCE3EA] dark:border-[#33485D] shadow-xl max-w-2xl w-full overflow-hidden text-[#273444] dark:text-[#E8EEF5] animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#DCE3EA] dark:border-[#33485D] flex items-center justify-between bg-[#F4F6F8] dark:bg-[#101C2A]">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#EDF1F5] dark:bg-[#162638] text-[#142C45] dark:text-[#E8EEF5] font-semibold border border-[#DCE3EA] dark:border-[#33485D]">
                {approval.approvalId}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded border font-medium ${getPriorityBadge(approval.priority)}`}>
                {approval.priority}
              </span>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30 font-medium">
                {approval.status}
              </span>
            </div>
            <h2 className="text-base font-semibold text-[#142C45] dark:text-[#E8EEF5] mt-1">
              Review Operational Approval: {approval.requestType.replace(/_/g, ' ')}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[#8793A1] hover:text-[#273444] dark:hover:text-[#E8EEF5] p-1.5 rounded-md hover:bg-[#EDF1F5] dark:hover:bg-[#101C2A] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Dual Control Enforcement Notice */}
          {isMaker && (
            <div className="p-3 bg-amber-50 border border-amber-300 rounded-md text-amber-900 text-xs flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-600" />
              <div>
                <p className="font-semibold">Dual-Control Policy Enforced</p>
                <p className="mt-0.5">
                  You are the registered Maker of this request (<span className="font-mono">{approval.makerName}</span>).
                  Under institutional banking controls, the Maker is strictly prohibited from authorizing their own submission.
                  A separate authorized Checker must action this request.
                </p>
              </div>
            </div>
          )}

          {/* Context Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs bg-[#F4F6F8] dark:bg-[#101C2A] p-4 rounded-md border border-[#DCE3EA] dark:border-[#33485D]">
            <div>
              <span className="text-[#5D6B7B] dark:text-[#8194A8] font-medium block">Customer</span>
              <span className="text-[#142C45] dark:text-[#E8EEF5] font-semibold block mt-0.5">
                {approval.customerName || 'N/A'} {approval.customerCode && <span className="font-mono text-[#5D6B7B] dark:text-[#8194A8] font-normal">({approval.customerCode})</span>}
              </span>
            </div>

            <div>
              <span className="text-[#5D6B7B] dark:text-[#8194A8] font-medium block">Related Entity</span>
              <span className="text-[#142C45] dark:text-[#E8EEF5] font-mono font-medium block mt-0.5">
                {approval.relatedEntityType || 'N/A'}: {approval.relatedEntityId || 'N/A'}
              </span>
            </div>

            <div>
              <span className="text-[#5D6B7B] dark:text-[#8194A8] font-medium block">Operational Amount</span>
              <span className="text-[#142C45] dark:text-[#E8EEF5] font-mono font-semibold block mt-0.5">
                {approval.amount ? `${approval.currency} ${Number(approval.amount).toLocaleString('en-IN')}` : 'Non-Financial'}
              </span>
            </div>

            <div>
              <span className="text-[#5D6B7B] dark:text-[#8194A8] font-medium block">SLA Deadline</span>
              <span className="text-[#142C45] dark:text-[#E8EEF5] font-medium block mt-0.5 flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-[#8793A1]" />
                {approval.slaDeadline ? new Date(approval.slaDeadline).toLocaleString() : 'No SLA set'}
              </span>
            </div>

            <div>
              <span className="text-[#5D6B7B] dark:text-[#8194A8] font-medium block">Maker</span>
              <span className="text-[#142C45] dark:text-[#E8EEF5] font-medium block mt-0.5">
                {approval.makerName} ({approval.makerRole || 'MAKER'})
              </span>
            </div>

            <div>
              <span className="text-[#5D6B7B] dark:text-[#8194A8] font-medium block">Created Timestamp</span>
              <span className="text-[#142C45] dark:text-[#E8EEF5] font-medium block mt-0.5 font-mono">
                {new Date(approval.createdAt).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Request Reason */}
          <div>
            <label className="text-xs font-semibold text-[#5D6B7B] dark:text-[#8194A8] uppercase tracking-wider block mb-1">
              Operational Justification / Reason
            </label>
            <div className="p-3 bg-[#FFFFFF] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-md text-xs text-[#273444] dark:text-[#E8EEF5] leading-relaxed font-sans">
              {approval.reason}
            </div>
          </div>

          {/* Synthetic Evidence */}
          {approval.evidence && (
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-1">
                Audit Evidence & Technical Context
              </label>
              <pre className="p-3 bg-slate-900 text-slate-200 rounded-md text-[11px] font-mono overflow-x-auto max-h-40 border border-slate-800">
                {typeof approval.evidence === 'string' ? approval.evidence : JSON.stringify(approval.evidence, null, 2)}
              </pre>
            </div>
          )}

          {/* Action Decision Form */}
          {!isFinalStatus && (
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
                Checker Determination
              </label>

              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  disabled={isMaker}
                  onClick={() => setAction('APPROVE')}
                  className={`py-2 px-3 text-xs font-semibold rounded-md border flex items-center justify-center gap-1.5 transition-colors ${
                    action === 'APPROVE'
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-1 ring-emerald-500'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  } ${isMaker ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Approve Request
                </button>

                <button
                  type="button"
                  disabled={isMaker}
                  onClick={() => setAction('REJECT')}
                  className={`py-2 px-3 text-xs font-semibold rounded-md border flex items-center justify-center gap-1.5 transition-colors ${
                    action === 'REJECT'
                      ? 'bg-red-50 border-red-500 text-red-700 ring-1 ring-red-500'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  } ${isMaker ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <XCircle className="w-4 h-4 text-red-600" />
                  Reject Request
                </button>

                <button
                  type="button"
                  disabled={isMaker}
                  onClick={() => setAction('RETURN')}
                  className={`py-2 px-3 text-xs font-semibold rounded-md border flex items-center justify-center gap-1.5 transition-colors ${
                    action === 'RETURN'
                      ? 'bg-amber-50 border-amber-500 text-amber-700 ring-1 ring-amber-500'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  } ${isMaker ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  Return for Correction
                </button>
              </div>

              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Checker Notes / Regulatory Compliance Remarks <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={checkerNotes}
                  disabled={isMaker}
                  onChange={(e) => setCheckerNotes(e.target.value)}
                  placeholder="Enter explicit rationale for operational authorization or rejection..."
                  className="w-full text-xs p-2.5 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#087F8C] focus:border-[#087F8C] disabled:bg-slate-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          )}

          {isFinalStatus && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-md text-xs text-slate-600">
              <span className="font-semibold block text-slate-800">Finalized Lifecycle Item</span>
              This approval record has been closed with status <span className="font-mono font-medium">{approval.status}</span> by {approval.checkerName || 'System'}.
              {approval.checkerNotes && (
                <p className="mt-1 italic text-slate-700">&ldquo;{approval.checkerNotes}&rdquo;</p>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[#DCE3EA] dark:border-[#33485D] bg-[#F4F6F8] dark:bg-[#101C2A] flex items-center justify-between">
          <span className="text-[11px] text-[#5D6B7B] dark:text-[#8194A8]">
            Mandatory audit logging active on all dual-control events
          </span>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 text-xs font-medium text-[#273444] dark:text-[#E8EEF5] bg-white dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-md hover:bg-[#EDF1F5] dark:hover:bg-[#1C3045]"
            >
              Close
            </button>

            {!isFinalStatus && (
              <button
                type="button"
                disabled={isMaker || isSubmitting || !checkerNotes.trim()}
                onClick={() => setConfirmDialog(true)}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#168C83] rounded-md hover:bg-[#1B9D92] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Processing...' : `Submit ${action}`}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Dialog */}
      {confirmDialog && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#162638] rounded-lg border border-[#DCE3EA] dark:border-[#33485D] p-5 max-w-md w-full shadow-2xl space-y-3 text-[#273444] dark:text-[#E8EEF5]">
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-semibold text-[#142C45] dark:text-[#E8EEF5]">
                Confirm Operational Dual-Control Mutation
              </h3>
            </div>
            <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB] leading-relaxed">
              Are you sure you want to mark approval <span className="font-mono font-semibold text-[#142C45] dark:text-[#E8EEF5]">{approval.approvalId}</span> as <span className="font-semibold text-[#142C45] dark:text-[#E8EEF5]">{action}</span>?
              This action will be permanently recorded in the immutable audit log and trigger relevant regulatory notifications.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmDialog(false)}
                className="px-3 py-1.5 text-xs font-medium text-[#5D6B7B] dark:text-[#A9BACB] border border-[#DCE3EA] dark:border-[#33485D] rounded-md hover:bg-[#EDF1F5] dark:hover:bg-[#101C2A]"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleSubmit}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#168C83] rounded-md hover:bg-[#1B9D92]"
              >
                {isSubmitting ? 'Submitting...' : 'Confirm Action'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
