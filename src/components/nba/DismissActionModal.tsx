import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import type { NextBestAction } from '../../types';
import { AlertTriangle, AlertCircle } from 'lucide-react';

interface DismissActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  action: NextBestAction | null;
  onConfirm: (id: number, reason: string) => Promise<void>;
}

export const DismissActionModal: React.FC<DismissActionModalProps> = ({
  isOpen,
  onClose,
  action,
  onConfirm,
}) => {
  const [reason, setReason] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!action) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim() || reason.trim().length < 3) {
      setError('A substantive reason (minimum 3 characters) is required by governance.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await onConfirm(action.id, reason.trim());
      setReason('');
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to dismiss recommendation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {
        if (!loading) {
          setReason('');
          setError(null);
          onClose();
        }
      }}
      title="Dismiss Recommendation"
      maxWidth="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold">Regulatory Audit Requirement:</span> Dismissing an
            engine-generated recommendation requires a documented rationale recorded in the
            banking audit trail.
          </div>
        </div>

        <div className="text-xs text-slate-600">
          <div className="font-medium text-slate-900 mb-1">{action.title}</div>
          <div className="text-slate-500">Action ID: {action.actionId}</div>
        </div>

        {error && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Reason for Dismissal <span className="text-rose-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => {
              setReason(e.target.value);
              if (error) setError(null);
            }}
            placeholder="e.g. Customer has already communicated resolution via personal phone; not applicable."
            rows={3}
            className="w-full text-xs p-2.5 rounded-md border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            required
            disabled={loading}
          />
          <div className="text-[11px] text-slate-500 mt-1">
            Min 3 characters. This will be preserved in audit logs.
          </div>
        </div>

        <div className="pt-2 border-t border-slate-200 flex justify-end gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => {
              setReason('');
              setError(null);
              onClose();
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="danger"
            size="sm"
            disabled={loading || reason.trim().length < 3}
          >
            {loading ? 'Recording...' : 'Confirm Dismissal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
