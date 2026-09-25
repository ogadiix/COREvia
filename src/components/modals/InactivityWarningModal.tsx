import React from 'react';
import { ShieldAlert, Clock, RefreshCw, LogOut, AlertTriangle } from 'lucide-react';

interface InactivityWarningModalProps {
  isOpen: boolean;
  remainingSeconds: number;
  totalWarningSeconds: number;
  onExtendSession: () => void;
  onLogoutNow: () => void;
}

export const InactivityWarningModal: React.FC<InactivityWarningModalProps> = ({
  isOpen,
  remainingSeconds,
  totalWarningSeconds,
  onExtendSession,
  onLogoutNow,
}) => {
  if (!isOpen) return null;

  const progressPercentage = Math.max(0, Math.min(100, (remainingSeconds / totalWarningSeconds) * 100));

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="inactivity-warning-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs select-none"
    >
      <div className="bg-white border border-slate-300 rounded-lg shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Institutional Alert Header */}
        <div className="bg-amber-500 text-slate-950 px-5 py-3.5 flex items-center justify-between border-b border-amber-600">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded bg-amber-600/30 flex items-center justify-center text-slate-950">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 id="inactivity-warning-title" className="text-sm font-bold tracking-tight">
                Workstation Inactivity Warning
              </h2>
              <div className="text-[11px] text-amber-950 font-medium">
                COREvia Security Policy &bull; Terminal Auto-Lock
              </div>
            </div>
          </div>

          <div className="font-mono text-sm font-bold bg-amber-600/30 px-2.5 py-1 rounded border border-amber-700/20">
            {remainingSeconds}s
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-4 text-slate-700">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-800 shrink-0 mt-0.5">
              <Clock className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p className="text-xs leading-relaxed text-slate-800">
                Your banking workstation session has been idle. To protect customer financial records and sensitive core banking accounts from unauthorized terminal access, this session will be securely terminated in:
              </p>
              <div className="pt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold font-mono text-slate-900">
                  {remainingSeconds}
                </span>
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Seconds remaining
                </span>
              </div>
            </div>
          </div>

          {/* Progress countdown bar */}
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
            <div
              className={`h-full transition-all duration-1000 ease-linear ${
                remainingSeconds <= 15 ? 'bg-red-600' : remainingSeconds <= 30 ? 'bg-amber-500' : 'bg-blue-600'
              }`}
              style={{ width: `${progressPercentage}%` }}
            />
          </div>

          {/* Regulatory Citation */}
          <div className="p-3 bg-slate-50 rounded border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
            <AlertTriangle className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
            <p className="leading-normal">
              <strong>Statutory Compliance:</strong> Banking Regulations and ISO 27001 mandate automated termination of unattended officer sessions to prevent unauthorized financial record exposure.
            </p>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="bg-slate-50 px-6 py-3.5 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-2.5">
          <button
            type="button"
            onClick={onLogoutNow}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded text-xs font-medium text-slate-700 hover:text-red-700 hover:bg-red-50 border border-slate-300 transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock & Sign Out</span>
          </button>

          <button
            type="button"
            onClick={onExtendSession}
            autoFocus
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded text-xs font-semibold text-white bg-[#0b1626] hover:bg-[#152945] shadow-xs transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5 text-amber-400" />
            <span>Extend Banking Session</span>
          </button>
        </div>
      </div>
    </div>
  );
};
