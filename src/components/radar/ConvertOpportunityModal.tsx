import React, { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { bankingApi } from '../../lib/api';
import type { OpportunityRadarSignal } from '../../types';
import {
  Target,
  DollarSign,
  Calendar,
  AlertCircle,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
} from 'lucide-react';

interface ConvertOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  signal: OpportunityRadarSignal | null;
  onSuccess: (opportunity: any, radarSignal: OpportunityRadarSignal) => void;
}

export const ConvertOpportunityModal: React.FC<ConvertOpportunityModalProps> = ({
  isOpen,
  onClose,
  signal,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [stage, setStage] = useState('PROSPECT');
  const [expectedValue, setExpectedValue] = useState('2500000');
  const [probability, setProbability] = useState(40);
  const [expectedCloseDate, setExpectedCloseDate] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (signal) {
      setTitle(signal.title);
      setStage('PROSPECT');

      // Estimate initial value based on signal category/expectedValueBand
      if (signal.expectedValueBand === 'Tier 1: High Potential Band') {
        setExpectedValue('5000000');
        setProbability(50);
      } else if (signal.expectedValueBand === 'HIGH') {
        setExpectedValue('2500000');
        setProbability(40);
      } else {
        setExpectedValue('1000000');
        setProbability(30);
      }

      // Default close date in 45 days
      const d = new Date();
      d.setDate(d.getDate() + 45);
      setExpectedCloseDate(d.toISOString().split('T')[0]);

      // Strategic notes pre-filled with explainability evidence
      const initialNotes = `Converted from Radar Signal: ${signal.radarId} (${signal.title})\n` +
        `Rationale: ${signal.rationale}\n` +
        `Key Evidence: ${signal.evidence?.map((e) => e.evidenceSummary).join('; ') || 'Verified banking records'}`;
      setNotes(initialNotes);
      setError(null);
    }
  }, [signal]);

  if (!signal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Opportunity title is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const res = await bankingApi.convertRadarToOpportunity(signal.id, {
        title: title.trim(),
        stage,
        expectedValue: String(expectedValue),
        probability: Number(probability),
        expectedCloseDate,
        notes,
      });

      onSuccess(res.opportunity, res.radarSignal);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to convert radar signal to opportunity.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Convert Radar Signal to Pipeline Opportunity"
      maxWidth="max-w-2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-sm text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Origin Context Header */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-3.5 text-xs text-slate-700 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-600" />
              <span>Origin Radar Signal:</span>
              <span className="font-mono text-slate-500 font-bold">{signal.radarId}</span>
            </div>
            <Badge variant="brand" size="sm">
              {signal.category}
            </Badge>
          </div>
          <div>
            <strong>Customer:</strong> {signal.customerName || `Customer #${signal.customerId}`}
            {signal.cifNumber && <span className="text-gray-400 font-mono ml-1">({signal.cifNumber})</span>}
          </div>
          {signal.targetProductName && (
            <div className="text-purple-700 font-medium">
              <strong>Target Product:</strong> {signal.targetProductName}
            </div>
          )}
        </div>

        {/* Title Input */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Opportunity Title *
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            placeholder="e.g., Working Capital Cash Credit Facility Expansion"
          />
        </div>

        {/* Stage and Expected Value Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Initial Pipeline Stage
            </label>
            <select
              value={stage}
              onChange={(e) => setStage(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none bg-white"
            >
              <option value="PROSPECT">Prospect (Initial Discovery)</option>
              <option value="QUALIFIED">Qualified (Requirement Verified)</option>
              <option value="PROPOSAL">Proposal (Term Sheet / Proposal Sent)</option>
              <option value="NEGOTIATION">Negotiation (Commercial Structuring)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Expected Facility Value (INR) *
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-gray-400 font-medium text-sm">₹</span>
              <input
                type="number"
                value={expectedValue}
                onChange={(e) => setExpectedValue(e.target.value)}
                required
                min="1000"
                step="50000"
                className="w-full pl-7 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none font-mono"
              />
            </div>
            <div className="text-[11px] text-gray-400 mt-1">
              ≈ ₹{(Number(expectedValue || 0) / 100000).toFixed(2)} Lakhs
            </div>
          </div>
        </div>

        {/* Probability & Close Date */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-700">
                Win Probability: <strong className="text-brand-700">{probability}%</strong>
              </label>
            </div>
            <input
              type="range"
              min="10"
              max="90"
              step="5"
              value={probability}
              onChange={(e) => setProbability(Number(e.target.value))}
              className="w-full accent-brand-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Target Close Date
            </label>
            <input
              type="date"
              value={expectedCloseDate}
              onChange={(e) => setExpectedCloseDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
          </div>
        </div>

        {/* Strategic Plan Notes */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            Commercial Notes & Origin Evidence
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none text-gray-700 leading-relaxed"
          />
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
          <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            disabled={submitting}
            className="bg-brand-600 hover:bg-brand-700 text-white font-medium flex items-center gap-1.5"
          >
            {submitting ? 'Creating Opportunity...' : 'Convert to Opportunity'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
