import React from 'react';
import { X, GitCompare, ArrowRight, CheckCircle2, ShieldAlert, Award } from 'lucide-react';
import { ScenarioComparisonDTO } from '../../types/strategySimulator.types';

interface ScenarioComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparison: ScenarioComparisonDTO | null;
  loading?: boolean;
}

export const ScenarioComparisonModal: React.FC<ScenarioComparisonModalProps> = ({
  isOpen,
  onClose,
  comparison,
  loading = false,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-800 w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/50">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900/40 text-indigo-700 dark:text-indigo-300 rounded-lg">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                  Strategy Scenario Comparison
                </h3>
                <span className="px-2 py-0.5 text-xs font-semibold uppercase tracking-wider rounded bg-amber-100 dark:bg-amber-900/30 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                  Simulation Sandbox
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Deterministic before-and-after projection analysis (Customer-isolated)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {loading ? (
            <div className="py-16 text-center text-slate-500">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-indigo-500 border-t-transparent mb-3" />
              <p className="text-sm">Calculating scenario differential projection...</p>
            </div>
          ) : !comparison ? (
            <div className="py-12 text-center text-slate-500">
              <ShieldAlert className="w-10 h-10 text-slate-400 mx-auto mb-2" />
              <p className="text-sm">No comparison data available.</p>
            </div>
          ) : (
            <>
              {/* Scenario Labels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40">
                  <div className="text-xs font-medium text-slate-500 uppercase tracking-wider">
                    Base Scenario (A)
                  </div>
                  <div className="text-base font-semibold text-slate-900 dark:text-white mt-1">
                    {comparison.baseScenario.name}
                  </div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    {comparison.baseScenario.id} · Status: {comparison.baseScenario.status}
                  </div>
                </div>

                <div className="p-4 rounded-lg border border-indigo-200 dark:border-indigo-900 bg-indigo-50/50 dark:bg-indigo-950/20">
                  <div className="text-xs font-medium text-indigo-600 dark:text-indigo-400 uppercase tracking-wider">
                    Target Scenario (B)
                  </div>
                  <div className="text-base font-semibold text-slate-900 dark:text-white mt-1">
                    {comparison.targetScenario.name}
                  </div>
                  <div className="text-xs text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                    {comparison.targetScenario.id} · Status: {comparison.targetScenario.status}
                  </div>
                </div>
              </div>

              {/* Metric Delta Table */}
              <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                <div className="bg-slate-100 dark:bg-slate-800/80 px-4 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider border-b border-slate-200 dark:border-slate-800">
                  Projected Metric Comparison
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {comparison.metricComparisons.map((item, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-slate-50 dark:hover:bg-slate-800/30 transition text-sm"
                    >
                      <div className="font-medium text-slate-800 dark:text-slate-200 sm:w-1/3">
                        {item.metric}
                      </div>

                      <div className="flex items-center space-x-4 sm:w-2/3 justify-between sm:justify-end">
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          A: <span className="font-semibold text-slate-700 dark:text-slate-300">{String(item.baseSimulatedValue)}</span>
                        </div>

                        <ArrowRight className="w-3.5 h-3.5 text-slate-400" />

                        <div className="text-xs text-indigo-600 dark:text-indigo-400">
                          B: <span className="font-semibold">{String(item.targetSimulatedValue)}</span>
                        </div>

                        <div className="min-w-[90px] text-right">
                          {item.advantage === 'TARGET' ? (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                              <Award className="w-3 h-3 mr-1" />
                              B Advantage ({item.difference})
                            </span>
                          ) : item.advantage === 'BASE' ? (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-300">
                              A Advantage ({item.difference})
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                              Equal
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Overlap Analysis */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Unique to Target Scenario (B):
                  </div>
                  {comparison.uniqueTargetActions.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No additional actions</p>
                  ) : (
                    <ul className="space-y-1">
                      {comparison.uniqueTargetActions.map((act, i) => (
                        <li key={i} className="text-xs text-indigo-700 dark:text-indigo-300 flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mr-2" />
                          {act.replace(/_/g, ' ')}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/30">
                  <div className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                    Common Baseline Actions:
                  </div>
                  {comparison.commonActions.length === 0 ? (
                    <p className="text-xs text-slate-500 italic">No shared actions</p>
                  ) : (
                    <ul className="space-y-1">
                      {comparison.commonActions.map((act, i) => (
                        <li key={i} className="text-xs text-slate-600 dark:text-slate-400 flex items-center">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mr-1.5" />
                          {act.replace(/_/g, ' ')}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 dark:border-slate-800 flex justify-end bg-slate-50 dark:bg-slate-800/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
