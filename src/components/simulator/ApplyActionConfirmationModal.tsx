import React, { useState } from 'react';
import { AlertTriangle, ShieldCheck, X, Check } from 'lucide-react';
import { ScenarioActionItem } from '../../types/strategySimulator.types';

interface ApplyActionConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (notes: string) => Promise<void>;
  action: ScenarioActionItem | null;
  scenarioName?: string;
  customerName?: string;
  loading?: boolean;
}

export const ApplyActionConfirmationModal: React.FC<ApplyActionConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  action,
  scenarioName,
  customerName,
  loading = false,
}) => {
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  if (!isOpen || !action) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      setError('Please provide mandatory banker justification notes.');
      return;
    }
    setError('');
    await onConfirm(notes);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-amber-300 dark:border-amber-700/60 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-amber-50 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-900/50 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300 rounded-lg">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                Apply Real Operational Action
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-400 font-medium">
                Production Banking Execution Warning
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 space-y-1.5">
            <div className="flex justify-between">
              <span className="text-slate-400">Target Customer:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{customerName || 'Customer'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Source Scenario:</span>
              <span className="font-semibold text-slate-800 dark:text-slate-200">{scenarioName || 'Simulation'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">Action Type:</span>
              <span className="font-mono font-semibold text-indigo-600 dark:text-indigo-400">
                {action.actionType}
              </span>
            </div>
            {action.targetEntityId && (
              <div className="flex justify-between">
                <span className="text-slate-400">Target Reference:</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{action.targetEntityId}</span>
              </div>
            )}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            <p>
              Applying this action will exit the what-if simulation sandbox and execute a real
              transaction/update in the Core Banking ledger or CRM pipeline under your employee ID.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Banker Justification Notes <span className="text-rose-500">*</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={loading}
              placeholder="State the regulatory / business rationale for applying this action..."
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-amber-500 focus:outline-none"
            />
            {error && <p className="text-xs text-rose-500 mt-1 font-medium">{error}</p>}
          </div>

          <div className="pt-2 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg shadow-sm flex items-center space-x-1.5 transition"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  <span>Executing...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4 mr-1" />
                  <span>Confirm & Execute</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
