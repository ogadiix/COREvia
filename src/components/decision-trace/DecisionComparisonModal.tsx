import React, { useState, useEffect } from 'react';
import { X, ArrowRight, GitCompare, Plus, Minus, Check, AlertCircle } from 'lucide-react';
import { bankingApi } from '../../lib/api.ts';
import { DecisionComparisonDTO } from '../../types/decisionTrace.types.ts';

interface DecisionComparisonModalProps {
  isOpen: boolean;
  onClose: () => void;
  baseDecisionId: string | number;
  compareDecisionId: string | number;
}

export const DecisionComparisonModal: React.FC<DecisionComparisonModalProps> = ({
  isOpen,
  onClose,
  baseDecisionId,
  compareDecisionId,
}) => {
  const [comparison, setComparison] = useState<DecisionComparisonDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !baseDecisionId || !compareDecisionId) return;

    let mounted = true;
    setLoading(true);
    setError(null);

    bankingApi
      .compareDecisionTraces(baseDecisionId, compareDecisionId)
      .then((data) => {
        if (mounted) {
          setComparison(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Failed to compare decision traces.');
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, baseDecisionId, compareDecisionId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-100 text-indigo-700 rounded-lg">
              <GitCompare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Decision Trace Delta Comparison</h3>
              <p className="text-xs text-slate-500 font-mono">
                {String(baseDecisionId)} <ArrowRight className="w-3 h-3 inline mx-1" /> {String(compareDecisionId)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 max-h-[75vh] overflow-y-auto space-y-5 text-xs">
          {loading && (
            <div className="py-12 text-center text-slate-500">
              <div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <span>Analyzing structural delta across decision traces...</span>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {comparison && (
            <>
              {/* Executive Summary of Differences */}
              <div className="p-3.5 bg-indigo-50/70 border border-indigo-200 rounded-lg">
                <span className="text-[10px] font-bold text-indigo-800 uppercase tracking-wider block mb-1">
                  Delta Synthesis
                </span>
                <p className="text-xs text-indigo-950 font-medium leading-relaxed">
                  {comparison.summaryOfDifferences}
                </p>
              </div>

              {/* Side-by-Side Metadata Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Base Trace</span>
                  <div className="font-bold text-slate-900 mt-1">{comparison.baseTrace.recommendationTitle}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {comparison.baseTrace.decisionId} • {comparison.baseTrace.sourceEngine}
                  </div>
                  <div className="mt-2 text-[11px] flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="font-semibold text-slate-700">{comparison.baseTrace.decisionStatus}</span>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 border border-indigo-200 rounded-lg">
                  <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-wider">Compared Trace</span>
                  <div className="font-bold text-slate-900 mt-1">{comparison.comparedTrace.recommendationTitle}</div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    {comparison.comparedTrace.decisionId} • {comparison.comparedTrace.sourceEngine}
                  </div>
                  <div className="mt-2 text-[11px] flex justify-between">
                    <span className="text-slate-500">Status:</span>
                    <span className="font-semibold text-slate-700">{comparison.comparedTrace.decisionStatus}</span>
                  </div>
                </div>
              </div>

              {/* Metric / Score Changes */}
              {comparison.scoreChanges.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                    Metric & Score Divergences
                  </h4>
                  <div className="border border-slate-200 rounded-lg overflow-hidden">
                    <table className="w-full text-left text-xs divide-y divide-slate-200">
                      <thead className="bg-slate-50 text-slate-600 font-semibold text-[10px] uppercase">
                        <tr>
                          <th className="px-3 py-2">Metric</th>
                          <th className="px-3 py-2">Source Engine</th>
                          <th className="px-3 py-2">Prior Value</th>
                          <th className="px-3 py-2">Current Value</th>
                          <th className="px-3 py-2 text-right">Delta</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono">
                        {comparison.scoreChanges.map((sc, i) => (
                          <tr key={i} className="hover:bg-slate-50">
                            <td className="px-3 py-2 font-sans font-medium text-slate-800">{sc.metric}</td>
                            <td className="px-3 py-2 text-slate-500">{sc.engine}</td>
                            <td className="px-3 py-2 text-slate-600">{sc.baseValue}</td>
                            <td className="px-3 py-2 text-slate-900 font-bold">{sc.comparedValue}</td>
                            <td className="px-3 py-2 text-right">
                              {sc.delta !== undefined ? (
                                <span className={Number(sc.delta) < 0 ? 'text-rose-600' : 'text-emerald-600'}>
                                  {Number(sc.delta) > 0 ? `+${sc.delta}` : sc.delta}
                                </span>
                              ) : (
                                '—'
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Evidence Added */}
              {comparison.evidenceAdded.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-emerald-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    New Contributing Evidence ({comparison.evidenceAdded.length})
                  </h4>
                  <div className="space-y-1.5">
                    {comparison.evidenceAdded.map((e) => (
                      <div key={e.id} className="p-2.5 bg-emerald-50/50 border border-emerald-200 rounded text-slate-800">
                        <div className="font-semibold text-slate-900">{e.description}</div>
                        <div className="text-[11px] text-emerald-800 font-mono mt-0.5">
                          Value: {e.observedValue} • Engine: {e.sourceEngine} ({e.contributionType})
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Evidence Removed */}
              {comparison.evidenceRemoved.length > 0 && (
                <div>
                  <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                    <Minus className="w-3.5 h-3.5" />
                    Prior Evidence Cleared ({comparison.evidenceRemoved.length})
                  </h4>
                  <div className="space-y-1.5">
                    {comparison.evidenceRemoved.map((e) => (
                      <div key={e.id} className="p-2.5 bg-rose-50/50 border border-rose-200 rounded text-slate-800">
                        <div className="font-semibold text-slate-700">{e.description}</div>
                        <div className="text-[11px] text-rose-700 font-mono mt-0.5">
                          Observed: {e.observedValue} • Engine: {e.sourceEngine}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium text-xs transition cursor-pointer"
          >
            Close Comparison
          </button>
        </div>
      </div>
    </div>
  );
};
