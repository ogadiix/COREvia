import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { bankingApi } from '../../lib/api';
import type { OpportunityRadarSignal } from '../../types';
import { AlertTriangle, AlertCircle, ShieldAlert } from 'lucide-react';

interface DismissRadarModalProps {
  isOpen: boolean;
  onClose: () => void;
  signal: OpportunityRadarSignal | null;
  onSuccess: (updatedSignal: OpportunityRadarSignal) => void;
}

const PRESET_REASONS = [
  'Customer explicitly not interested in this product category',
  'Customer capex or financial timing not appropriate at this juncture',
  'Active service or operational issue must be prioritized first',
  'Customer already engaged with alternate institutional channel',
  'Customer risk appetite or regulatory parameters not aligned',
  'Duplicate signal or outdated profile data',
  'Other operational reason',
];

export const DismissRadarModal: React.FC<DismissRadarModalProps> = ({
  isOpen,
  onClose,
  signal,
  onSuccess,
}) => {
  const [selectedPreset, setSelectedPreset] = useState(PRESET_REASONS[0]);
  const [customNotes, setCustomNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!signal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalReason = selectedPreset === 'Other operational reason'
      ? customNotes.trim()
      : customNotes.trim()
      ? `${selectedPreset} — ${customNotes.trim()}`
      : selectedPreset;

    if (!finalReason) {
      setError('A dismissal reason is required for compliance audit logging.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await bankingApi.dismissRadarSignal(signal.id, finalReason);
      onSuccess(res.signal);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to dismiss radar signal.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Dismiss Opportunity Radar Signal"
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2.5 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold mb-0.5">Audit Governance Requirement</div>
            Dismissing a radar signal records an immutable compliance log entry. Please specify the business justification.
          </div>
        </div>

        <div className="text-xs text-gray-600">
          <strong>Signal:</strong> {signal.title} ({signal.radarId})
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Reason for Dismissal *
          </label>
          <select
            value={selectedPreset}
            onChange={(e) => setSelectedPreset(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
          >
            {PRESET_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Additional Relationship Manager Notes {selectedPreset === 'Other operational reason' && '*'}
          </label>
          <textarea
            value={customNotes}
            onChange={(e) => setCustomNotes(e.target.value)}
            rows={3}
            placeholder="Add relevant customer context or meeting feedback..."
            required={selectedPreset === 'Other operational reason'}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-gray-200">
          <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="danger"
            type="submit"
            disabled={submitting}
            className="text-xs"
          >
            {submitting ? 'Dismissing...' : 'Confirm Dismissal'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
