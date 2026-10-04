/**
 * COREvia Phase 39: Admin Action Confirmation Modal
 * Strict institutional confirmation for dangerous mutations.
 */

import React from 'react';
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
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isDangerous ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-100">{title}</h3>
              <p className="text-xs text-slate-400">Institutional Governance & Audit Verification</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-lg p-3 text-xs space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-400">Action:</span>
              <span className="font-semibold text-slate-200">{actionName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Target:</span>
              <span className="font-mono text-slate-300">{targetDescription}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Required Privilege:</span>
              <span className="font-medium text-amber-400">{requiredRole}</span>
            </div>
          </div>

          <div className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
            isDangerous
              ? 'bg-rose-950/30 border-rose-500/30 text-rose-200'
              : 'bg-amber-950/30 border-amber-500/30 text-amber-200'
          }`}>
            <div className="flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
              <div>
                <span className="font-semibold uppercase tracking-wider block mb-1">Operational Impact Notice</span>
                {impactDescription}
              </div>
            </div>
          </div>

          <p className="text-xs text-slate-400 italic">
            This action will be cryptographically recorded in the SHA-256 tamper-evident administrative audit ledger.
          </p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-5 py-4 border-t border-slate-800 bg-slate-950/40">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-medium text-slate-300 hover:bg-slate-800 rounded-lg transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 text-xs font-medium rounded-lg text-white transition flex items-center gap-2 ${
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
