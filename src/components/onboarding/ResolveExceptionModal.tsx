import React, { useState } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { OnboardingExceptionItem } from '../../types';
import { bankingApi } from '../../lib/api';

interface ResolveExceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  exception: OnboardingExceptionItem;
  onSuccess: () => void;
}

export const ResolveExceptionModal: React.FC<ResolveExceptionModalProps> = ({
  isOpen,
  onClose,
  exception,
  onSuccess,
}) => {
  const [resolution, setResolution] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resolution.trim()) {
      setError('Resolution narrative is required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await bankingApi.resolveOnboardingException(exception.id, resolution);
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Failed to resolve exception.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 dark:bg-black/80 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white dark:bg-[#162638] rounded-lg shadow-xl border border-slate-200 dark:border-[#33485D] overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 dark:bg-[#101C2A] border-b border-slate-200 dark:border-[#33485D] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#E8EEF5]">Resolve Onboarding Exception</h3>
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
              Resolution Narrative &amp; Verification Evidence *
            </label>
            <textarea
              required
              rows={3}
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              placeholder="State how the deficiency was remediated (e.g. Received updated valid passport copy via registered email; verified on e-passport portal)..."
              className="w-full p-2 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] text-slate-900 dark:text-[#E8EEF5] rounded text-xs focus:bg-white dark:focus:bg-[#101C2A] focus:ring-1 focus:ring-emerald-600"
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
              disabled={loading}
              className="px-4 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-medium shadow-xs cursor-pointer"
            >
              {loading ? 'Resolving...' : 'Confirm Resolution'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
