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
      <div className="bg-[#FFFFFF] dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded-xl shadow-2xl max-w-lg w-full overflow-hidden text-[#142C45] dark:text-[#E8EEF5]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#DCE3EA] dark:border-[#33485D] bg-[#F8FAFC] dark:bg-[#101C2A]">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 rounded-md bg-[#168C83]/10 dark:bg-[#168C83]/20 border border-[#168C83]/30 text-[#168C83] dark:text-[#46C3B2]">
              <Info className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-sm text-[#142C45] dark:text-[#E8EEF5]">{metric.label}</h3>
              <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB] font-mono">{metric.metricKey}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#5D6B7B] dark:text-[#A9BACB] hover:text-[#142C45] dark:hover:text-[#E8EEF5] hover:bg-[#EDF1F5] dark:hover:bg-[#1E3247] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4 text-xs">
          <div className="bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg p-3 space-y-2">
            <div className="flex items-center space-x-2 text-[#142C45] dark:text-[#CBD5E1] font-medium">
              <Calculator className="w-3.5 h-3.5 text-[#168C83] dark:text-[#46C3B2]" />
              <span>Calculation & Definition</span>
            </div>
            <p className="text-[#142C45] dark:text-[#CBD5E1] leading-relaxed pl-5 font-mono text-[11px] bg-[#FFFFFF] dark:bg-[#0A121E] p-2 rounded border border-[#DCE3EA] dark:border-[#33485D]">
              {metric.calculation}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg p-3 space-y-1">
              <div className="flex items-center space-x-2 text-[#5D6B7B] dark:text-[#A9BACB]">
                <FileText className="w-3.5 h-3.5 text-[#168C83] dark:text-[#46C3B2]" />
                <span className="font-medium">Data Source</span>
              </div>
              <p className="text-[#142C45] dark:text-[#E8EEF5] font-semibold pl-5">{metric.source}</p>
            </div>

            <div className="bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg p-3 space-y-1">
              <div className="flex items-center space-x-2 text-[#5D6B7B] dark:text-[#A9BACB]">
                <Calendar className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="font-medium">Time Period</span>
              </div>
              <p className="text-[#142C45] dark:text-[#E8EEF5] font-semibold pl-5">{metric.timePeriod}</p>
            </div>
          </div>

          <div className="bg-[#F8FAFC] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg p-3 space-y-1">
            <div className="flex items-center space-x-2 text-[#5D6B7B] dark:text-[#A9BACB]">
              <Users className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              <span className="font-medium">Population Scope</span>
            </div>
            <p className="text-[#142C45] dark:text-[#E8EEF5] font-medium pl-5">{metric.population}</p>
          </div>

          <div className="p-2.5 rounded bg-[#168C83]/10 dark:bg-[#168C83]/20 border border-[#168C83]/30 text-[11px] text-[#142C45] dark:text-[#E8EEF5]">
            <span className="font-semibold text-[#168C83] dark:text-[#46C3B2]">Compliance Guarantee:</span> Metrics are deterministic and strictly limited
            to current authorized customer relationships under bank-grade RBAC isolation.
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#DCE3EA] dark:border-[#33485D] bg-[#F8FAFC] dark:bg-[#101C2A] flex justify-end">
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-[#EDF1F5] dark:bg-[#1E3247] hover:bg-[#DCE3EA] dark:hover:bg-[#26394C] text-[#142C45] dark:text-[#E8EEF5] text-xs font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
