import React, { useState, useEffect } from 'react';
import { bankingApi } from '../../lib/api';
import type { OpportunityRadarSignal } from '../../types';
import { RadarSignalCard } from './RadarSignalCard';
import { RadarEvidenceModal } from './RadarEvidenceModal';
import { ConvertOpportunityModal } from './ConvertOpportunityModal';
import { DismissRadarModal } from './DismissRadarModal';
import { Button } from '../common/Button';
import {
  Radar,
  RefreshCw,
  Sparkles,
  AlertCircle,
  Package,
  Layers,
  CheckCircle2,
} from 'lucide-react';

interface CustomerOpportunityRadarWidgetProps {
  customerId: number;
  cifNumber: string;
  customerName?: string;
  onOpportunityCreated?: () => void;
}

export const CustomerOpportunityRadarWidget: React.FC<CustomerOpportunityRadarWidgetProps> = ({
  customerId,
  cifNumber,
  customerName,
  onOpportunityCreated,
}) => {
  const [signals, setSignals] = useState<OpportunityRadarSignal[]>([]);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Modals
  const [selectedEvidenceSignal, setSelectedEvidenceSignal] = useState<OpportunityRadarSignal | null>(null);
  const [selectedConvertSignal, setSelectedConvertSignal] = useState<OpportunityRadarSignal | null>(null);
  const [selectedDismissSignal, setSelectedDismissSignal] = useState<OpportunityRadarSignal | null>(null);

  const fetchSignals = async () => {
    setLoading(true);
    try {
      const res = await bankingApi.getOpportunityRadar({
        customerId,
        status: 'ALL',
        limit: 20,
      });
      setSignals(res.signals || []);
    } catch (err) {
      console.error('Failed to load customer opportunity radar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      fetchSignals();
    }
  }, [customerId]);

  const handleRecalculate = async () => {
    setRecalculating(true);
    setStatusMessage(null);
    try {
      await bankingApi.recalculateCustomerRadar(cifNumber);
      await fetchSignals();
      setStatusMessage('Opportunity Radar evaluated successfully.');
      setTimeout(() => setStatusMessage(null), 4000);
    } catch (err: any) {
      setStatusMessage(err.message || 'Failed to recalculate radar.');
    } finally {
      setRecalculating(false);
    }
  };

  const handleReview = async (signal: OpportunityRadarSignal) => {
    try {
      await bankingApi.reviewRadarSignal(signal.id);
      await fetchSignals();
    } catch (err) {
      console.error('Failed to review radar signal:', err);
    }
  };

  const activeSignals = signals.filter(
    (s) => s.status === 'DETECTED' || s.status === 'REVIEW_SUGGESTED'
  );
  const convertedSignals = signals.filter((s) => s.status === 'CONVERTED');

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-4 rounded-xl border border-gray-200">
        <div>
          <div className="flex items-center gap-2">
            <Radar className="w-5 h-5 text-brand-600" />
            <h3 className="text-base font-bold text-gray-900">
              Customer Opportunity Radar
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-brand-50 text-brand-700 text-xs font-bold border border-brand-200">
              {activeSignals.length} Active Signal{activeSignals.length === 1 ? '' : 's'}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            Deterministic signals detecting product coverage gaps and expansion potential from existing customer data.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleRecalculate}
          disabled={recalculating}
          className="flex items-center gap-1.5 text-xs font-medium"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin text-brand-600' : ''}`} />
          <span>{recalculating ? 'Evaluating...' : 'Recalculate Radar'}</span>
        </Button>
      </div>

      {statusMessage && (
        <div className="p-3 bg-brand-50 border border-brand-200 text-xs text-brand-800 rounded-lg flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-brand-600 shrink-0" />
          <span>{statusMessage}</span>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto text-brand-600 mb-2" />
          <p className="text-xs text-gray-500">Scanning customer records & product coverage...</p>
        </div>
      ) : activeSignals.length === 0 ? (
        <div className="text-center py-10 bg-white rounded-xl border border-dashed border-gray-300 p-6">
          <Radar className="w-10 h-10 mx-auto text-gray-300 mb-3" />
          <h4 className="text-sm font-semibold text-gray-900 mb-1">
            No Active Opportunity Gaps Detected
          </h4>
          <p className="text-xs text-gray-500 max-w-md mx-auto mb-4">
            Customer product coverage and relationship cadence are aligned with current profile metrics.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRecalculate}
            disabled={recalculating}
            className="text-xs"
          >
            Run Rules Engine Evaluation
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {activeSignals.map((sig) => (
            <RadarSignalCard
              key={sig.id}
              signal={sig}
              onViewEvidence={(s) => setSelectedEvidenceSignal(s)}
              onConvert={(s) => setSelectedConvertSignal(s)}
              onDismiss={(s) => setSelectedDismissSignal(s)}
              onReview={(s) => handleReview(s)}
            />
          ))}
        </div>
      )}

      {/* Recently Converted Signals */}
      {convertedSignals.length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <h4 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            <span>Converted to Pipeline Opportunities ({convertedSignals.length})</span>
          </h4>
          <div className="space-y-2">
            {convertedSignals.map((sig) => (
              <div
                key={sig.id}
                className="bg-emerald-50/50 border border-emerald-200 rounded-lg p-3 flex items-center justify-between text-xs"
              >
                <div>
                  <div className="font-semibold text-emerald-950">{sig.title}</div>
                  <div className="text-emerald-700 text-[11px]">
                    Opportunity: <strong>{sig.convertedOpportunityCode || 'Generated'}</strong> ({sig.convertedOpportunityTitle})
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEvidenceSignal(sig)}
                  className="text-xs text-emerald-800 hover:bg-emerald-100"
                >
                  View Evidence
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <RadarEvidenceModal
        isOpen={!!selectedEvidenceSignal}
        onClose={() => setSelectedEvidenceSignal(null)}
        signal={selectedEvidenceSignal}
        onConvert={(s) => {
          setSelectedEvidenceSignal(null);
          setSelectedConvertSignal(s);
        }}
      />

      <ConvertOpportunityModal
        isOpen={!!selectedConvertSignal}
        onClose={() => setSelectedConvertSignal(null)}
        signal={selectedConvertSignal}
        onSuccess={async () => {
          await fetchSignals();
          if (onOpportunityCreated) onOpportunityCreated();
        }}
      />

      <DismissRadarModal
        isOpen={!!selectedDismissSignal}
        onClose={() => setSelectedDismissSignal(null)}
        signal={selectedDismissSignal}
        onSuccess={async () => {
          await fetchSignals();
        }}
      />
    </div>
  );
};
