import React from 'react';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import type { OpportunityRadarSignal, RadarEvidence } from '../../types';
import {
  Radar,
  FileText,
  ShieldCheck,
  Calendar,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertCircle,
  ExternalLink,
  Target,
  Sparkles,
  ShieldAlert,
  Building,
  DollarSign,
  Package,
} from 'lucide-react';

interface RadarEvidenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  signal: OpportunityRadarSignal | null;
  onConvert?: (signal: OpportunityRadarSignal) => void;
  onNavigateToCustomer?: (customerId: number) => void;
}

export const RadarEvidenceModal: React.FC<RadarEvidenceModalProps> = ({
  isOpen,
  onClose,
  signal,
  onConvert,
  onNavigateToCustomer,
}) => {
  if (!signal) return null;

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'CRITICAL':
        return 'danger';
      case 'HIGH':
        return 'warning';
      case 'MEDIUM':
        return 'info';
      default:
        return 'neutral';
    }
  };

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'ACCOUNT':
        return <DollarSign className="w-4 h-4 text-emerald-600" />;
      case 'LOAN':
        return <TrendingUp className="w-4 h-4 text-blue-600" />;
      case 'CASE':
        return <ShieldAlert className="w-4 h-4 text-rose-600" />;
      case 'CUSTOMER':
        return <Building className="w-4 h-4 text-purple-600" />;
      case 'CORE_SCORE':
        return <ShieldCheck className="w-4 h-4 text-indigo-600" />;
      case 'OPPORTUNITY':
        return <Target className="w-4 h-4 text-amber-600" />;
      case 'PRODUCT':
        return <Package className="w-4 h-4 text-teal-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Evidence-Backed Opportunity Analysis"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Header Summary */}
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                {signal.radarId}
              </span>
              <Badge variant={getPriorityVariant(signal.priority)} size="sm">
                {signal.priority} Priority
              </Badge>
              <Badge variant="brand" size="sm">
                {signal.category}
              </Badge>
              <span className="text-xs px-2.5 py-0.5 rounded bg-slate-200 text-slate-700 font-medium">
                {signal.signalType.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 font-medium">Relevance Score:</span>
              <span className="text-base font-bold text-brand-700 bg-brand-50 border border-brand-200 px-2.5 py-0.5 rounded-full">
                {signal.relevanceScore}%
              </span>
            </div>
          </div>

          <h3 className="text-lg font-bold text-gray-900 mb-1">
            {signal.title}
          </h3>
          <p className="text-sm text-gray-700 leading-relaxed">
            {signal.summary}
          </p>

          <div className="mt-4 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs text-gray-600">
            <div className="flex items-center gap-2">
              <span>Customer:</span>
              <strong className="text-gray-900">{signal.customerName || `CUST-${signal.customerId}`}</strong>
              {signal.cifNumber && <span className="font-mono text-gray-400">({signal.cifNumber})</span>}
            </div>
            {signal.targetProductName && (
              <div className="text-purple-700 font-medium bg-purple-50 px-2 py-0.5 rounded">
                Target Product: <strong>{signal.targetProductName}</strong>
              </div>
            )}
          </div>
        </div>

        {/* Section 1: Why COREvia believes this is relevant */}
        <div className="border border-brand-200 bg-brand-50/40 rounded-xl p-5">
          <h4 className="text-sm font-bold text-brand-900 flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-brand-600" />
            <span>Why does COREvia believe this is relevant?</span>
          </h4>
          <p className="text-sm text-brand-950 leading-relaxed">
            {signal.rationale}
          </p>
        </div>

        {/* Section 2: Verified Evidence Records */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-bold text-gray-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-gray-700" />
              <span>What evidence supports this? ({signal.evidence?.length || 0} Records)</span>
            </h4>
            <span className="text-xs text-gray-500">
              Deterministic CRM & Core Banking verification
            </span>
          </div>

          {signal.evidence && signal.evidence.length > 0 ? (
            <div className="space-y-3">
              {signal.evidence.map((ev, index) => (
                <div
                  key={ev.id || index}
                  className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-gray-100">
                        {getEntityIcon(ev.sourceEntityType)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {ev.sourceEntityType}
                          </span>
                          {ev.sourceEntityCode && (
                            <span className="font-mono text-xs font-bold text-gray-800 bg-gray-100 px-1.5 py-0.5 rounded">
                              {ev.sourceEntityCode}
                            </span>
                          )}
                        </div>
                        <h5 className="text-sm font-bold text-gray-900 mt-0.5">
                          {ev.recordTitle}
                        </h5>
                      </div>
                    </div>

                    {ev.metricValue && (
                      <div className="text-right">
                        <span className="inline-block px-2.5 py-1 rounded bg-slate-100 border border-slate-200 text-xs font-bold text-slate-800 font-mono">
                          {ev.metricValue}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="text-sm font-medium text-gray-800 mb-1">
                    {ev.evidenceSummary}
                  </div>

                  {ev.detail && (
                    <p className="text-xs text-gray-600 bg-gray-50 rounded p-2.5 border border-gray-100 leading-relaxed">
                      {ev.detail}
                    </p>
                  )}

                  {ev.timestamp && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-gray-400">
                      <Calendar className="w-3 h-3" />
                      <span>Recorded Date: {new Date(ev.timestamp).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6 text-sm text-gray-500 bg-gray-50 rounded-lg border border-dashed border-gray-300">
              No detailed evidence records attached.
            </div>
          )}
        </div>

        {/* Section 3: Safety Checks & Governance Audit */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-xs">
          <div className="font-semibold text-gray-800 mb-2 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Banking Governance & Safety Checklist:</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-600">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span><strong>Service-First Safe:</strong> {signal.serviceDeprioritized ? 'Grievance flagged - Priority lowered' : 'No critical SLA disputes blocking'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              <span><strong>Health Gate:</strong> {signal.healthGateApplied ? 'Deteriorating CORE score detected' : 'Customer health score verified'}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500"></span>
              <span><strong>Deterministic Rule:</strong> {signal.ruleId} ({signal.ruleVersion})</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-purple-500"></span>
              <span><strong>Expected Band:</strong> {signal.expectedValueBand || 'Unassigned'}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>

          {signal.status !== 'CONVERTED' && signal.status !== 'DISMISSED' && onConvert && (
            <Button
              variant="primary"
              onClick={() => {
                onClose();
                onConvert(signal);
              }}
              className="flex items-center gap-2 bg-brand-600 hover:bg-brand-700 text-white font-medium"
            >
              <span>Convert to Opportunity</span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
