/**
 * COREvia Phase 39: Admin Action Confirmation Modal
 * Strict institutional confirmation for dangerous mutations.
 */

import React, { useEffect } from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle, X } from 'lucide-react';

interface AdminConfirmModalProps {
  isOpen: boolean;
  title: string;
  actionName: string;
  targetDescription: string;
  impactDescription: string;
  requiredRole?: string;
  confirmButtonLabel?: string;
  isDangerous?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const AdminConfirmModal: React.FC<AdminConfirmModalProps> = ({
  isOpen,
  title,
  actionName,
  targetDescription,
  impactDescription,
  requiredRole = 'ADMINISTRATOR',
  confirmButtonLabel = 'Confirm Action',
  isDangerous = true,
  isLoading = false,
  onConfirm,
  onCancel,
}) => {
  useEffect(() => {
    if (isOpen) {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape' && !isLoading) {
          onCancel();
        }
      };
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, isLoading, onCancel]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-[#142C45] dark:text-[#E8EEF5]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#DCE3EA] dark:border-[#33485D] bg-[#F8FAFC] dark:bg-[#101C2A]">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDangerous ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'}`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-[#142C45] dark:text-[#E8EEF5]">{title}</h3>
              <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB]">Institutional Governance & Audit Verification</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-1 rounded-lg text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#142C45] dark:hover:text-[#E8EEF5] hover:bg-[#EDF1F5] dark:hover:bg-[#1E3247] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg p-3.5 text-xs space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[#5D6B7B] dark:text-[#A9BACB]">Action:</span>
              <span className="font-semibold text-[#142C45] dark:text-[#E8EEF5] font-mono text-[11px]">{actionName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#5D6B7B] dark:text-[#A9BACB]">Target:</span>
              <span className="font-mono text-[#142C45] dark:text-[#E8EEF5]">{targetDescription}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#5D6B7B] dark:text-[#A9BACB]">Required Privilege:</span>
              <span className="font-medium text-amber-700 dark:text-amber-400 font-mono text-[11px]">{requiredRole}</span>
            </div>
          </div>

          <div className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
            isDangerous
              ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800/40 text-rose-900 dark:text-rose-200'
              : 'bg-amber-50/80 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/40 text-amber-900 dark:text-amber-200'
          }`}>
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold uppercase tracking-wider block mb-1">Operational Impact Notice</span>
                {impactDescription}
              </div>
            </div>
          </div>

          <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB] italic">
            This action will be cryptographically recorded in the SHA-256 tamper-evident administrative audit ledger.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-[#DCE3EA] dark:border-[#33485D] bg-[#F8FAFC] dark:bg-[#101C2A]">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#142C45] dark:hover:text-[#E8EEF5] hover:bg-[#EDF1F5] dark:hover:bg-[#1E3247] rounded-lg transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-medium rounded-lg text-white transition-colors flex items-center gap-2 cursor-pointer ${
              isDangerous
                ? 'bg-rose-600 hover:bg-rose-700 focus:ring-2 focus:ring-rose-500/40'
                : 'bg-amber-600 hover:bg-amber-700 focus:ring-2 focus:ring-amber-500/40'
            }`}
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Executing...
              </>
            ) : (
              <>
                <CheckCircle className="w-3.5 h-3.5" />
                {confirmButtonLabel}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
