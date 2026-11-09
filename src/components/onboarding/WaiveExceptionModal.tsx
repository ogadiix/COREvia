import React, { useState } from 'react';
import { X, ShieldAlert, AlertTriangle } from 'lucide-react';
import { OnboardingExceptionItem } from '../../types';
import { bankingApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';

interface WaiveExceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  exception: OnboardingExceptionItem;
  onSuccess: () => void;
}

export const WaiveExceptionModal: React.FC<WaiveExceptionModalProps> = ({
  isOpen,
  onClose,
  exception,
  onSuccess,
}) => {
  const { user, hasRole } = useAuth();
  const [waiveReason, setWaiveReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const canWaive = hasRole('BRANCH_MANAGER', 'ADMINISTRATOR', 'COMPLIANCE');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waiveReason.trim()) {
      setError('Regulatory waiver justification is mandatory.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await bankingApi.waiveOnboardingException(exception.id, waiveReason);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Failed to waive exception.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 dark:bg-black/80 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#162638] rounded-lg shadow-xl border border-slate-200 dark:border-[#33485D] overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 dark:bg-[#101C2A] border-b border-slate-200 dark:border-[#33485D] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 flex items-center justify-center">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#E8EEF5]">Waive Exception (Dual Control)</h3>
              <p className="text-xs text-slate-500 dark:text-[#A9BACB] font-mono">{exception.exceptionCode}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-[#192B3D] cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {!canWaive && (
            <div className="p-2.5 bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-900/50 text-red-700 dark:text-rose-300 rounded font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>
                Dual-control policy requires Branch Manager or Compliance Officer role to waive exceptions.
              </span>
            </div>
          )}

          {error && (
            <div className="p-2.5 bg-red-50 dark:bg-rose-950/40 border border-red-200 dark:border-rose-900/50 text-red-700 dark:text-rose-300 rounded font-medium">
              {error}
            </div>
          )}

          <div className="p-3 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded">
            <div className="font-bold text-slate-900 dark:text-[#E8EEF5]">{exception.title}</div>
            <p className="text-slate-600 dark:text-[#A9BACB] mt-1">{exception.description}</p>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-[#A9BACB] mb-1">
              Statutory Waiver Justification &amp; Risk Acceptance *
            </label>
            <textarea
              required
              disabled={!canWaive}
              rows={3}
              value={waiveReason}
              onChange={(e) => setWaiveReason(e.target.value)}
              placeholder="State formal justification for waiving this exception under banking delegated powers..."
              className="w-full p-2 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] text-slate-900 dark:text-[#E8EEF5] rounded text-xs focus:bg-white dark:focus:bg-[#101C2A] focus:ring-1 focus:ring-purple-600 disabled:opacity-50"
            />
          </div>

          <div className="pt-3 border-t border-slate-200 dark:border-[#33485D] flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white dark:bg-[#101C2A] border border-slate-300 dark:border-[#33485D] text-slate-700 dark:text-[#A9BACB] rounded text-xs font-medium hover:bg-slate-50 dark:hover:bg-[#192B3D] cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !canWaive}
              className="px-4 py-1.5 bg-purple-700 hover:bg-purple-800 text-white rounded text-xs font-medium shadow-xs cursor-pointer disabled:opacity-40"
            >
              {loading ? 'Authorizing Waiver...' : 'Authorize Waiver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
