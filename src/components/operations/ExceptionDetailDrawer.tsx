import React, { useState } from 'react';
import {
  X,
  AlertTriangle,
  CheckCircle2,
  Clock,
  UserCheck,
  Shield,
  FileText,
  Building,
  Info,
  ExternalLink,
  ChevronRight,
  History,
  AlertCircle
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type { OperationalExceptionDTO } from '../../types/operations.types';

interface ExceptionDetailDrawerProps {
  exception: OperationalExceptionDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  onNavigateCustomer?: (customerId: number) => void;
}

export const ExceptionDetailDrawer: React.FC<ExceptionDetailDrawerProps> = ({
  exception,
  isOpen,
  onClose,
  onSuccess,
  onNavigateCustomer,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'details' | 'audit'>('details');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [ackNotes, setAckNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionConfirm, setActionConfirm] = useState<'ACK' | 'RESOLVE' | null>(null);

  if (!isOpen || !exception) return null;

  const isResolvedOrClosed = ['RESOLVED', 'CLOSED'].includes(exception.status);

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case 'CRITICAL':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'HIGH':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'MEDIUM':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'LOW':
        return 'bg-slate-50 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  const getStatusBadge = (st: string) => {
    switch (st) {
      case 'OPEN':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'ACKNOWLEDGED':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'IN_PROGRESS':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'WAITING':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'RESOLVED':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  const handleAcknowledge = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.acknowledgeOperationalException(
        exception.id,
        ackNotes || `Acknowledged by ${user?.name || 'Operations Officer'}`
      );
      if (res && res.success) {
        setActionConfirm(null);
        onSuccess();
        onClose();
      } else {
        setError('Failed to acknowledge exception.');
      }
    } catch (err: any) {
      setError(err?.message || 'Server rejected acknowledgment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolve = async () => {
    if (!resolutionNotes.trim()) {
      setError('Resolution notes explaining the root cause and remedy are mandatory.');
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await api.resolveOperationalException(exception.id, resolutionNotes);
      if (res && res.success) {
        setActionConfirm(null);
        onSuccess();
        onClose();
      } else {
        setError('Failed to resolve exception.');
      }
    } catch (err: any) {
      setError(err?.message || 'Server rejected resolution.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-2xs flex justify-end">
      <div className="bg-white w-full max-w-xl h-full shadow-2xl border-l border-slate-200 flex flex-col text-slate-900 animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-200 text-slate-800 font-semibold">
                {exception.exceptionId}
              </span>
              <span className="text-[11px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-300">
                {exception.category}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded border font-medium ${getSeverityBadge(exception.severity)}`}>
                {exception.severity}
              </span>
              <span className={`text-xs px-2 py-0.5 rounded border font-medium ${getStatusBadge(exception.status)}`}>
                {exception.status}
              </span>
            </div>
            <h2 className="text-base font-semibold text-slate-900 pt-1 leading-snug">
              {exception.description}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab navigation inside Drawer */}
        <div className="flex border-b border-slate-200 bg-white px-5 text-xs font-medium">
          <button
            onClick={() => setActiveTab('details')}
            className={`py-3 px-3 border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'border-[#087F8C] text-[#087F8C] font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            Exception Context & Evidence
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`py-3 px-3 border-b-2 flex items-center gap-1.5 transition-colors ${
              activeTab === 'audit'
                ? 'border-[#087F8C] text-[#087F8C] font-semibold'
                : 'border-transparent text-slate-600 hover:text-slate-900'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Operational Audit Trail
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {activeTab === 'details' ? (
            <>
              {/* Context Block */}
              <div className="border border-slate-200 rounded-lg p-4 bg-slate-50 space-y-3">
                <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 block">
                  Entity & Relationship Context
                </span>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block">Related Customer</span>
                    <span className="font-semibold text-slate-900 block mt-0.5">
                      {exception.customerName || 'None / Institutional'}
                    </span>
                    {exception.customerCode && (
                      <span className="font-mono text-slate-500 text-[11px]">
                        {exception.customerCode}
                      </span>
                    )}
                  </div>

                  <div>
                    <span className="text-slate-500 block">Related Entity</span>
                    <span className="font-mono font-medium text-slate-800 block mt-0.5">
                      {exception.relatedEntityType || 'N/A'}: {exception.relatedEntityId || 'N/A'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Source Subsystem</span>
                    <span className="font-medium text-slate-800 block mt-0.5">
                      {exception.source}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Assigned Owner</span>
                    <span className="font-medium text-slate-800 block mt-0.5">
                      {exception.ownerName || 'Unassigned'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">SLA Target</span>
                    <span className="font-medium text-slate-800 block mt-0.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-slate-400" />
                      {exception.slaDeadline ? new Date(exception.slaDeadline).toLocaleString() : 'No SLA'}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block">Detected Timestamp</span>
                    <span className="font-medium text-slate-800 block mt-0.5">
                      {new Date(exception.createdAt).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Evidence & Technical Context */}
              <div>
                <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 block mb-1">
                  Exception Evidence & Telemetry
                </span>
                <pre className="p-3 bg-slate-900 text-slate-100 rounded-md text-[11px] font-mono overflow-x-auto max-h-48 border border-slate-800 leading-relaxed">
                  {typeof exception.evidence === 'string'
                    ? exception.evidence
                    : JSON.stringify(exception.evidence, null, 2)}
                </pre>
              </div>

              {/* "Before You Act" Institutional Warning */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-md text-xs text-amber-900 space-y-1">
                <div className="flex items-center gap-1.5 font-semibold text-amber-950">
                  <Shield className="w-3.5 h-3.5 text-amber-600" />
                  Before You Act: Operational Impact Notice
                </div>
                <p className="text-[11px] text-amber-800 leading-relaxed">
                  Resolving or changing the status of this operational exception directly impacts branch SLA metrics, regulatory audit reporting, and customer communications. Verify that all remediation evidence is verified before resolving.
                </p>
              </div>

              {/* Resolution Info if already resolved */}
              {isResolvedOrClosed && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-950 space-y-2">
                  <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Resolved on {exception.resolvedAt ? new Date(exception.resolvedAt).toLocaleString() : 'N/A'}
                  </div>
                  <p className="text-slate-800">
                    <strong>Resolver:</strong> {exception.resolvedByName || 'Authorized Officer'}
                  </p>
                  <p className="text-slate-800">
                    <strong>Resolution Rationale:</strong> {exception.resolutionNotes || 'Remediated successfully.'}
                  </p>
                </div>
              )}

              {/* Actions Section if Open/In Progress */}
              {!isResolvedOrClosed && (
                <div className="space-y-4 pt-3 border-t border-slate-200">
                  <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-700 block">
                    Remediation & Officer Action
                  </span>

                  {exception.status === 'OPEN' && (
                    <div className="space-y-2">
                      <label className="text-xs font-medium text-slate-700 block">
                        Acknowledge & Accept Ownership
                      </label>
                      <input
                        type="text"
                        value={ackNotes}
                        onChange={(e) => setAckNotes(e.target.value)}
                        placeholder="Optional acknowledgment note..."
                        className="w-full text-xs p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#087F8C]"
                      />
                      <button
                        type="button"
                        onClick={handleAcknowledge}
                        disabled={isSubmitting}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-md bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                      >
                        {isSubmitting ? 'Acknowledging...' : 'Acknowledge Exception'}
                      </button>
                    </div>
                  )}

                  <div className="space-y-2 pt-2">
                    <label className="text-xs font-medium text-slate-700 block">
                      Resolution Reason & Remediation Summary <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={resolutionNotes}
                      onChange={(e) => setResolutionNotes(e.target.value)}
                      placeholder="Specify how the exception was remediated (e.g., corrected KYC docs re-uploaded, ledger adjustment posted, customer verified)..."
                      className="w-full text-xs p-2 border border-slate-300 rounded-md focus:ring-1 focus:ring-[#087F8C]"
                    />
                    <button
                      type="button"
                      onClick={() => setActionConfirm('RESOLVE')}
                      disabled={isSubmitting || !resolutionNotes.trim()}
                      className="px-4 py-1.5 text-xs font-semibold rounded-md bg-[#087F8C] hover:bg-[#076c77] text-white disabled:opacity-50 transition-colors"
                    >
                      {isSubmitting ? 'Resolving...' : 'Resolve Exception'}
                    </button>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Audit Trail Tab */
            <div className="space-y-4">
              <span className="text-[11px] font-semibold tracking-wider uppercase text-slate-500 block">
                Lifecycle Milestones
              </span>

              <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 text-xs">
                <div className="relative">
                  <div className="absolute -left-6 top-0.5 w-3.5 h-3.5 rounded-full bg-blue-500 border-2 border-white" />
                  <p className="font-semibold text-slate-900">Exception Detected & Logged</p>
                  <p className="text-[11px] text-slate-500">{new Date(exception.createdAt).toLocaleString()}</p>
                  <p className="text-slate-600 mt-0.5">Source: {exception.source}</p>
                </div>

                {exception.status !== 'OPEN' && (
                  <div className="relative">
                    <div className="absolute -left-6 top-0.5 w-3.5 h-3.5 rounded-full bg-amber-500 border-2 border-white" />
                    <p className="font-semibold text-slate-900">Acknowledged / In Progress</p>
                    <p className="text-[11px] text-slate-500">{new Date(exception.updatedAt).toLocaleString()}</p>
                    <p className="text-slate-600 mt-0.5">Owner: {exception.ownerName || 'Operations Officer'}</p>
                  </div>
                )}

                {exception.resolvedAt && (
                  <div className="relative">
                    <div className="absolute -left-6 top-0.5 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white" />
                    <p className="font-semibold text-slate-900">Resolved & Closed</p>
                    <p className="text-[11px] text-slate-500">{new Date(exception.resolvedAt).toLocaleString()}</p>
                    <p className="text-slate-600 mt-0.5">Remediated by: {exception.resolvedByName || 'Officer'}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Immutable regulatory audit trail recorded
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
          >
            Close
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {actionConfirm === 'RESOLVE' && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-lg border border-slate-200 p-5 max-w-md w-full shadow-2xl space-y-3">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 className="w-5 h-5 shrink-0" />
              <h3 className="text-sm font-semibold text-slate-900">
                Confirm Exception Resolution
              </h3>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              Confirm resolution of operational exception <span className="font-mono font-semibold">{exception.exceptionId}</span>?
              This will update customer SLA statuses and archive the pending operational item.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setActionConfirm(null)}
                className="px-3 py-1.5 text-xs font-medium text-slate-600 border border-slate-200 rounded-md hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isSubmitting}
                onClick={handleResolve}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#087F8C] rounded-md hover:bg-[#076c77]"
              >
                {isSubmitting ? 'Resolving...' : 'Confirm Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
