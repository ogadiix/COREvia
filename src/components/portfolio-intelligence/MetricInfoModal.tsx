import React from 'react';
import { X, Info, FileText, Calendar, Users, Calculator } from 'lucide-react';
import { MetricDefinitionDTO } from '../../types/portfolioIntelligence.types';

interface MetricInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  metric: MetricDefinitionDTO | null;
}

export const MetricInfoModal: React.FC<MetricInfoModalProps> = ({ isOpen, onClose, metric }) => {
  if (!isOpen || !metric) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800 bg-slate-800/40">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-md bg-blue-500/10 border border-blue-500/20 text-blue-400">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-slate-100">{metric.label}</h3>
              <p className="text-xs text-slate-400 font-mono">{metric.metricKey}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-lg p-3 space-y-2">
            <div className="flex items-center space-x-2 text-slate-300 font-medium">
              <Calculator className="w-3.5 h-3.5 text-indigo-400" />
              <span>Calculation & Definition</span>
            </div>
            <p className="text-slate-300 leading-relaxed pl-5 font-mono text-[11px] bg-slate-900/80 p-2 rounded border border-slate-800">
              {metric.calculation}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-slate-850/40 border border-slate-800/70 rounded-lg p-3 space-y-1">
              <div className="flex items-center space-x-2 text-slate-400">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-medium">Data Source</span>
              </div>
              <p className="text-slate-200 font-semibold pl-5">{metric.source}</p>
            </div>

            <div className="bg-slate-850/40 border border-slate-800/70 rounded-lg p-3 space-y-1">
              <div className="flex items-center space-x-2 text-slate-400">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span className="font-medium">Time Period</span>
              </div>
              <p className="text-slate-200 font-semibold pl-5">{metric.timePeriod}</p>
            </div>
          </div>

          <div className="bg-slate-850/40 border border-slate-800/70 rounded-lg p-3 space-y-1">
            <div className="flex items-center space-x-2 text-slate-400">
              <Users className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-medium">Population Scope</span>
            </div>
            <p className="text-slate-200 font-medium pl-5">{metric.population}</p>
          </div>

          <div className="p-2.5 rounded bg-blue-950/30 border border-blue-800/40 text-[11px] text-blue-300">
            <span className="font-semibold">Compliance Guarantee:</span> Metrics are deterministic and strictly limited
            to current authorized customer relationships under bank-grade RBAC isolation.
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
