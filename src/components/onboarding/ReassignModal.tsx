import React, { useState } from 'react';
import { X, UserCheck } from 'lucide-react';
import { OnboardingApplicationItem } from '../../types';
import { bankingApi } from '../../lib/api';

interface ReassignModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: OnboardingApplicationItem;
  onSuccess: () => void;
}

const OFFICERS = [
  { id: 1, name: 'Deepak Nambiar', role: 'RELATIONSHIP_MANAGER', branch: 'Fort, Mumbai Main Branch' },
  { id: 2, name: 'Ananya Roy', role: 'KYC_ANALYST', branch: 'Fort, Mumbai Main Branch' },
  { id: 3, name: 'Vikram Joshi', role: 'BRANCH_MANAGER', branch: 'Fort, Mumbai Main Branch' },
  { id: 4, name: 'Priya Sharma', role: 'COMPLIANCE_OFFICER', branch: 'Corporate Compliance Unit' },
  { id: 5, name: 'Sanjay Deshmukh', role: 'OPERATIONS_OFFICER', branch: 'Operations Hub' },
];

export const ReassignModal: React.FC<ReassignModalProps> = ({
  isOpen,
  onClose,
  application,
  onSuccess,
}) => {
  const [selectedOfficerId, setSelectedOfficerId] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const officer = OFFICERS.find((o) => o.id === selectedOfficerId);
    if (!officer) return;

    setLoading(true);
    setError(null);
    try {
      await bankingApi.reassignOnboardingApplication(application.id, {
        assignedToUserId: officer.id,
        assignedToName: officer.name,
        assignedToRole: officer.role,
        reason: reason || 'Workload distribution rebalance',
      });
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Failed to reassign application.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 dark:bg-black/80 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white dark:bg-[#162638] rounded-lg shadow-xl border border-slate-200 dark:border-[#33485D] overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 dark:bg-[#101C2A] border-b border-slate-200 dark:border-[#33485D] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-blue-100 dark:bg-cyan-950/50 text-blue-900 dark:text-cyan-400 flex items-center justify-center">
              <UserCheck className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-[#E8EEF5]">Reassign Application Dossier</h3>
              <p className="text-xs text-slate-500 dark:text-[#A9BACB] font-mono">{application.applicationNumber}</p>
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

          <div>
            <label className="block font-medium text-slate-700 dark:text-[#A9BACB] mb-1.5">
              Select Assignee (RM / Officer)
            </label>
            <div className="space-y-2">
              {OFFICERS.map((off) => (
                <label
                  key={off.id}
                  className={`p-2.5 rounded border flex items-center justify-between cursor-pointer transition-colors ${
                    selectedOfficerId === off.id
                      ? 'border-blue-900 dark:border-cyan-400 bg-blue-50/60 dark:bg-cyan-950/40 text-blue-900 dark:text-cyan-300 font-semibold'
                      : 'border-slate-200 dark:border-[#33485D] bg-white dark:bg-[#101C2A] text-slate-700 dark:text-[#A9BACB] hover:bg-slate-50 dark:hover:bg-[#192B3D]'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <input
                      type="radio"
                      name="officer"
                      checked={selectedOfficerId === off.id}
                      onChange={() => setSelectedOfficerId(off.id)}
                      className="text-blue-900 focus:ring-blue-900"
                    />
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-[#E8EEF5]">{off.name}</div>
                      <div className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                        {off.role.replace(/_/g, ' ')} • {off.branch}
                      </div>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block font-medium text-slate-700 dark:text-[#A9BACB] mb-1">Reassignment Justification</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Workload rebalancing, specialist corporate desk required"
              className="w-full p-2 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] text-slate-900 dark:text-[#E8EEF5] rounded text-xs focus:bg-white dark:focus:bg-[#101C2A] focus:ring-1 focus:ring-blue-900 dark:focus:ring-cyan-500"
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
              className="px-4 py-1.5 bg-blue-900 dark:bg-cyan-600 hover:bg-blue-800 dark:hover:bg-cyan-500 text-white rounded text-xs font-medium shadow-xs cursor-pointer"
            >
              {loading ? 'Reassigning...' : 'Confirm Reassignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
