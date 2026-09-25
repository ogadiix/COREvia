import React, { useState } from 'react';
import { X, FileText, CheckCircle2, XCircle, RefreshCw, AlertTriangle } from 'lucide-react';
import { OnboardingDocumentItem } from '../../types';
import { bankingApi } from '../../lib/api';

interface DocumentReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  document: OnboardingDocumentItem;
  onSuccess: () => void;
}

export const DocumentReviewModal: React.FC<DocumentReviewModalProps> = ({
  isOpen,
  onClose,
  document,
  onSuccess,
}) => {
  const [decision, setDecision] = useState<'VERIFIED' | 'REJECTED' | 'REPLACEMENT_REQUIRED'>('VERIFIED');
  const [rejectionReason, setRejectionReason] = useState<string>('');
  const [replacementReason, setReplacementReason] = useState<string>('');
  const [replacementDueDate, setReplacementDueDate] = useState<string>(
    new Date(Date.now() + 48 * 3600 * 1000).toISOString().split('T')[0]
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (decision === 'REJECTED' && !rejectionReason.trim()) {
      setError('Rejection reason is required.');
      return;
    }
    if (decision === 'REPLACEMENT_REQUIRED' && !replacementReason.trim()) {
      setError('Replacement justification is required.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await bankingApi.reviewOnboardingDocument(document.id, {
        status: decision,
        rejectionReason: decision === 'REJECTED' ? rejectionReason : undefined,
        replacementReason: decision === 'REPLACEMENT_REQUIRED' ? replacementReason : undefined,
        replacementDueDate: decision === 'REPLACEMENT_REQUIRED' ? replacementDueDate : undefined,
      });
      onSuccess();
    } catch (err: any) {
      setError(err?.message || 'Failed to review document.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Document Verification &amp; Diligence</h3>
            <p className="text-xs text-slate-500 font-mono">Doc #{document.documentCode}</p>
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

          {/* Document Meta Header */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center gap-3">
            <div className="w-9 h-9 rounded bg-blue-100 text-blue-900 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-slate-900">{document.title}</div>
              <div className="text-[11px] text-slate-500 font-mono">
                {document.fileName} • {document.fileSize} • v{document.version}
              </div>
            </div>
          </div>

          {/* Decision Selector */}
          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Verification Decision</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setDecision('VERIFIED')}
                className={`p-2.5 rounded border text-center font-medium transition-colors cursor-pointer ${
                  decision === 'VERIFIED'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-emerald-600" />
                Mark Verified
              </button>

              <button
                type="button"
                onClick={() => setDecision('REPLACEMENT_REQUIRED')}
                className={`p-2.5 rounded border text-center font-medium transition-colors cursor-pointer ${
                  decision === 'REPLACEMENT_REQUIRED'
                    ? 'border-orange-600 bg-orange-50 text-orange-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <RefreshCw className="w-4 h-4 mx-auto mb-1 text-orange-600" />
                Request Replacement
              </button>

              <button
                type="button"
                onClick={() => setDecision('REJECTED')}
                className={`p-2.5 rounded border text-center font-medium transition-colors cursor-pointer ${
                  decision === 'REJECTED'
                    ? 'border-red-600 bg-red-50 text-red-800'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <XCircle className="w-4 h-4 mx-auto mb-1 text-red-600" />
                Reject Document
              </button>
            </div>
          </div>

          {/* Replacement Form */}
          {decision === 'REPLACEMENT_REQUIRED' && (
            <div className="space-y-3 p-3 bg-orange-50/50 border border-orange-200 rounded">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Deficiency / Replacement Reason *
                </label>
                <input
                  type="text"
                  required
                  value={replacementReason}
                  onChange={(e) => setReplacementReason(e.target.value)}
                  placeholder="e.g. Scanned copy blurred, corners cut off, expired electricity bill"
                  className="w-full p-2 bg-white border border-slate-300 rounded text-xs"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-medium mb-1">Replacement Due Date</label>
                <input
                  type="date"
                  required
                  value={replacementDueDate}
                  onChange={(e) => setReplacementDueDate(e.target.value)}
                  className="w-full p-2 bg-white border border-slate-300 rounded text-xs"
                />
              </div>
            </div>
          )}

          {/* Rejection Form */}
          {decision === 'REJECTED' && (
            <div className="space-y-3 p-3 bg-red-50/50 border border-red-200 rounded">
              <div>
                <label className="block text-slate-700 font-medium mb-1">
                  Regulatory Rejection Reason *
                </label>
                <input
                  type="text"
                  required
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Forged document format, name mismatch with PAN records"
                  className="w-full p-2 bg-white border border-slate-300 rounded text-xs"
                />
              </div>
            </div>
          )}

          {/* Modal Footer */}
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
              className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded text-xs font-medium shadow-xs cursor-pointer"
            >
              {loading ? 'Submitting...' : 'Confirm Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
