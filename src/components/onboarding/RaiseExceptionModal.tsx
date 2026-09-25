import React, { useState } from 'react';
import { X, AlertTriangle, ShieldAlert } from 'lucide-react';
import { OnboardingApplicationItem } from '../../types';
import { bankingApi } from '../../lib/api';

interface RaiseExceptionModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: OnboardingApplicationItem;
  onSuccess: () => void;
}

export const RaiseExceptionModal: React.FC<RaiseExceptionModalProps> = ({
  isOpen,
  onClose,
  application,
  onSuccess,
}) => {
  const [exceptionType, setExceptionType] = useState<string>('DOCUMENT_EXPIRED');
  const [severity, setSeverity] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [dueDate, setDueDate] = useState<string>(
    new Date(Date.now() + 48 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [createTask, setCreateTask] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setError('Title and description are mandatory.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await bankingApi.raiseOnboardingException(application.id, {
        exceptionType,
        severity,
        title,
        description,
        dueDate,
        createTask,
      });
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Failed to raise exception.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-red-100 text-red-700 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Raise Onboarding Exception</h3>
              <p className="text-xs text-slate-500 font-mono">{application.applicationNumber}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Exception Category</label>
              <select
                value={exceptionType}
                onChange={(e) => setExceptionType(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:ring-1 focus:ring-red-600"
              >
                <option value="DOCUMENT_EXPIRED">Document Expired (Passport/Lease)</option>
                <option value="NAME_MISMATCH">Name Mismatch with NSDL / UIDAI</option>
                <option value="ADDRESS_MISMATCH">Proof of Address Inconsistency</option>
                <option value="MISSING_DOCUMENT">Missing Mandatory Regulatory Form</option>
                <option value="SIGNATURE_MISMATCH">Signatory Discrepancy</option>
                <option value="SANCTIONS_SUSPECT">AML / Sanctions Screening False Positive</option>
                <option value="REVIEW_OVERDUE">Processing Overdue (Escalation)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Severity Tier</label>
              <select
                value={severity}
                onChange={(e) => setSeverity(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:ring-1 focus:ring-red-600"
              >
                <option value="LOW">Low (Informational Deficiency)</option>
                <option value="MEDIUM">Medium (Secondary Documentation)</option>
                <option value="HIGH">High (Mandatory KYC Blocker)</option>
                <option value="CRITICAL">Critical (AML / Regulatory Flag)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Exception Headline *</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Passport validity expired on 12-Nov-2025"
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:ring-1 focus:ring-red-600"
            />
          </div>

          <div>
            <label className="block font-medium text-slate-700 mb-1">Detailed Observation &amp; Impact *</label>
            <textarea
              required
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detail specific observations and required remediation from the client or relationship manager..."
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:ring-1 focus:ring-red-600"
            />
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Remediation Due Date</label>
              <input
                type="date"
                required
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:ring-1 focus:ring-red-600"
              />
            </div>

            <div className="pt-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createTask}
                  onChange={(e) => setCreateTask(e.target.checked)}
                  className="rounded text-red-600 focus:ring-red-500"
                />
                <span className="text-slate-700 font-medium">Auto-assign Task to RM</span>
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 rounded text-xs font-medium hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded text-xs font-medium shadow-xs cursor-pointer"
            >
              {loading ? 'Logging Exception...' : 'Log & Block Stage'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
