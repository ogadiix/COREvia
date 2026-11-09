import React, { useState, useEffect } from 'react';
import {
  X,
  ShieldCheck,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  AlertTriangle,
  CheckCircle2,
  CheckCheck,
  XCircle,
  GitCompare,
  History,
  Info,
  ExternalLink,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  RotateCcw,
  Zap,
  Compass,
} from 'lucide-react';
import { bankingApi } from '../../lib/api.ts';
import { DecisionTraceDTO } from '../../types/decisionTrace.types.ts';
import { DecisionComparisonModal } from './DecisionComparisonModal.tsx';

interface DecisionTracePanelProps {
  decisionId: string | number | null;
  isOpen: boolean;
  onClose: () => void;
  onNavigateToCustomer?: (customerId: number | string) => void;
}

export const DecisionTracePanel: React.FC<DecisionTracePanelProps> = ({
  decisionId,
  isOpen,
  onClose,
  onNavigateToCustomer,
}) => {
  const [trace, setTrace] = useState<DecisionTraceDTO | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'EVIDENCE' | 'SOURCES' | 'HISTORY'>('OVERVIEW');

  // History state
  const [historyItems, setHistoryItems] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState<boolean>(false);

  // Compare state
  const [compareTargetId, setCompareTargetId] = useState<string | number | null>(null);
  const [isCompareOpen, setIsCompareOpen] = useState<boolean>(false);

  // Action mutation state
  const [actionInProgress, setActionInProgress] = useState<boolean>(false);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen || !decisionId) return;

    let mounted = true;
    setLoading(true);
    setError(null);
    setActionFeedback(null);

    bankingApi
      .getDecisionTrace(decisionId)
      .then((data) => {
        if (mounted) {
          setTrace(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (mounted) {
          setError(err.message || 'Failed to retrieve explainable decision trace.');
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [isOpen, decisionId]);

  // Load history when tab changes to HISTORY
  useEffect(() => {
    if (activeTab === 'HISTORY' && trace?.customerId && historyItems.length === 0) {
      setLoadingHistory(true);
      bankingApi
        .getDecisionHistory(trace.customerId)
        .then((res) => {
          setHistoryItems(res.history || []);
          setLoadingHistory(false);
        })
        .catch(() => setLoadingHistory(false));
    }
  }, [activeTab, trace?.customerId, historyItems.length]);

  if (!isOpen) return null;

  const handleConfirmAction = async () => {
    if (!trace) return;
    setActionInProgress(true);
    try {
      const updated = await bankingApi.confirmDecisionAction(trace.id);
      setTrace(updated);
      setActionFeedback('Action confirmed by officer. Ready for execution.');
    } catch (err: any) {
      setActionFeedback(`Confirmation failed: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleRejectAction = async () => {
    if (!trace) return;
    setActionInProgress(true);
    try {
      const updated = await bankingApi.rejectDecisionAction(trace.id, 'Officer rejected recommendation during review.');
      setTrace(updated);
      setActionFeedback('Recommendation dismissed.');
    } catch (err: any) {
      setActionFeedback(`Dismissal failed: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  const handleExecuteAction = async () => {
    if (!trace) return;
    setActionInProgress(true);
    try {
      const updated = await bankingApi.executeDecisionAction(
        trace.id,
        'Action executed successfully in institutional workflow.'
      );
      setTrace(updated);
      setActionFeedback('Action successfully executed and recorded in audit trail.');
    } catch (err: any) {
      setActionFeedback(`Execution failed: ${err.message}`);
    } finally {
      setActionInProgress(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Semi-transparent Backdrop */}
      <div
        onClick={onClose}
        className="absolute inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity duration-200"
      />

      {/* Slide-over Sheet / Panel */}
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-0 sm:pl-10 w-full sm:w-auto">
        <div className="w-full sm:w-[500px] md:w-[580px] max-w-full bg-white dark:bg-[#162638] border-l border-slate-200 dark:border-[#33485D] shadow-2xl flex flex-col animate-in slide-in-from-right duration-200 text-[#273444] dark:text-[#E8EEF5]">
          {/* Header */}
          <div className="px-5 py-4 bg-slate-900 dark:bg-[#101C2A] text-white flex items-center justify-between shrink-0 border-b border-transparent dark:border-[#33485D]">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded bg-indigo-500/20 border border-indigo-400 text-indigo-300 flex items-center justify-center font-bold text-xs">
                DT
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-white tracking-tight">AI Decision Trace</h3>
                  {trace && (
                    <span className="font-mono text-[10px] px-1.5 py-0.2 bg-slate-800 dark:bg-[#1C3045] text-slate-300 rounded border border-slate-700 dark:border-[#33485D]">
                      {trace.decisionId}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-400 font-mono">
                  Institutional Explainability & Provenance Ledger
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 dark:hover:bg-[#1C3045] transition cursor-pointer"
              title="Close panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Tabs */}
          <div className="flex items-center px-5 bg-slate-100/80 dark:bg-[#101C2A] border-b border-slate-200 dark:border-[#33485D] text-xs shrink-0">
            {[
              { id: 'OVERVIEW', label: 'Overview' },
              { id: 'EVIDENCE', label: `Evidence (${trace?.evidence?.length || 0})` },
              { id: 'SOURCES', label: `Sources (${trace?.sourceChain?.length || 0})` },
              { id: 'HISTORY', label: 'History' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2.5 px-3 font-medium border-b-2 transition-colors cursor-pointer ${
                  activeTab === tab.id
                    ? 'border-indigo-600 dark:border-indigo-400 text-indigo-700 dark:text-indigo-300 font-bold'
                    : 'border-transparent text-slate-600 dark:text-[#8194A8] hover:text-slate-900 dark:hover:text-[#E8EEF5]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Panel Content Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
            {loading && (
              <div className="py-16 text-center text-slate-500 dark:text-[#8194A8]">
                <div className="w-7 h-7 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                <span className="font-medium">Retrieving verified decision trace & evidence...</span>
              </div>
            )}

            {error && (
              <div className="p-4 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 rounded-lg text-rose-800 dark:text-rose-300 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 dark:text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {actionFeedback && (
              <div className="p-3 bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/60 rounded-lg text-indigo-900 dark:text-indigo-200 flex items-center justify-between">
                <span>{actionFeedback}</span>
                <button
                  onClick={() => setActionFeedback(null)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  Dismiss
                </button>
              </div>
            )}

            {trace && (
              <>
                {/* TAB 1: OVERVIEW */}
                {activeTab === 'OVERVIEW' && (
                  <div className="space-y-4">
                    {/* Recommendation Card */}
                    <div className="p-4 bg-slate-50 dark:bg-[#101C2A] rounded-xl border border-slate-200 dark:border-[#33485D] space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-indigo-700 dark:text-indigo-400 uppercase tracking-wider font-mono">
                          {trace.sourceEngine.replace(/_/g, ' ')} • {trace.decisionType.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono uppercase ${
                            trace.decisionStatus === 'EXECUTED'
                              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800'
                              : trace.decisionStatus === 'CONFIRMED'
                              ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 border border-sky-200 dark:border-sky-800'
                              : trace.decisionStatus === 'REJECTED'
                              ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 border border-rose-200 dark:border-rose-800'
                              : 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
                          }`}
                        >
                          {trace.decisionStatus}
                        </span>
                      </div>

                      <h2 className="text-sm font-bold text-slate-900 dark:text-[#E8EEF5] leading-snug">
                        {trace.recommendationTitle}
                      </h2>

                      <p className="text-slate-700 dark:text-[#E8EEF5] leading-relaxed bg-white dark:bg-[#162638] p-3 rounded-lg border border-slate-200/80 dark:border-[#33485D]">
                        {trace.recommendationSummary}
                      </p>

                      {/* Decision Basis & Confidence */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-200 dark:border-[#33485D] text-[11px]">
                        <div>
                          <span className="text-slate-500 dark:text-[#8194A8] block">Decision Basis:</span>
                          <span className="font-semibold text-slate-800 dark:text-[#E8EEF5]">
                            {trace.confidenceBasis} ({trace.decisionMode})
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 dark:text-[#8194A8] block">Engine Confidence:</span>
                          <span className="font-mono text-slate-800 dark:text-[#E8EEF5] font-semibold">
                            {trace.confidence ? trace.confidence : 'Not provided by source engine'}
                          </span>
                        </div>
                      </div>

                      {trace.customerName && (
                        <div className="flex items-center justify-between pt-1 border-t border-slate-200 dark:border-[#33485D] text-[11px]">
                          <span className="text-slate-500 dark:text-[#8194A8]">Customer:</span>
                          <span className="font-semibold text-indigo-900 dark:text-indigo-300 font-mono">
                            {trace.customerName} ({trace.customerCif})
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Data Freshness Breakdown */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-[#E8EEF5] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-500 dark:text-[#8194A8]" />
                        Contributing System Freshness
                      </h4>
                      <div className="p-3 bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded-lg space-y-2">
                        <div className="flex justify-between text-[11px] pb-1 border-b border-slate-100 dark:border-[#33485D] text-slate-500 dark:text-[#8194A8]">
                          <span>Decision Generated:</span>
                          <span className="font-mono font-medium text-slate-800 dark:text-[#E8EEF5]">
                            {new Date(trace.generatedAt).toLocaleString()}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {trace.freshnessBreakdown && trace.freshnessBreakdown.length > 0 ? (
                            trace.freshnessBreakdown.map((f, i) => (
                              <div key={i} className="p-2 bg-slate-50 dark:bg-[#101C2A] rounded border border-slate-200/70 dark:border-[#33485D]">
                                <span className="text-[10px] text-slate-500 dark:text-[#8194A8] block font-bold">
                                  {f.engine.replace(/_/g, ' ')}
                                </span>
                                <span className="font-mono font-bold text-slate-800 dark:text-[#E8EEF5] text-[11px]">
                                  {f.freshnessLabel}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="col-span-2 text-slate-400 italic">Freshness unavailable</div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Contextual Limitations & Regulatory Boundaries */}
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-[#E8EEF5] uppercase tracking-wider mb-2 flex items-center gap-1.5">
                        <Info className="w-3.5 h-3.5 text-amber-600" />
                        Contextual Limitations
                      </h4>
                      <div className="p-3 bg-amber-50/60 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800/50 rounded-lg space-y-1.5">
                        {trace.limitations && trace.limitations.length > 0 ? (
                          trace.limitations.map((lim, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-amber-950 dark:text-amber-200 text-[11px]">
                              <span className="text-amber-600 font-bold">•</span>
                              <span>{lim}</span>
                            </div>
                          ))
                        ) : (
                          <div className="text-amber-800 dark:text-amber-300 text-[11px]">
                            Standard institutional CRM limitations apply. Human verification required.
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Proposed Action & Human Governance */}
                    <div className="p-4 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded-xl space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-slate-800 dark:text-[#E8EEF5] uppercase tracking-wider">
                          Proposed Action & Governance
                        </h4>
                        {trace.confirmedByName && (
                          <span className="text-[10px] text-slate-500 dark:text-[#8194A8] font-mono">
                            Confirmed by {trace.confirmedByName}
                          </span>
                        )}
                      </div>

                      {trace.actionTitle ? (
                        <div className="p-3 bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded-lg">
                          <div className="font-bold text-slate-900 dark:text-[#E8EEF5] text-xs">{trace.actionTitle}</div>
                          {trace.outcome && (
                            <div className="mt-2 pt-2 border-t border-slate-100 dark:border-[#33485D] text-[11px] text-emerald-800 dark:text-emerald-300 font-medium">
                              Outcome: {trace.outcome}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-[11px] text-slate-500 dark:text-[#8194A8] italic">No automated action linked.</div>
                      )}

                      {/* Controls based on status */}
                      <div className="flex items-center gap-2 pt-1">
                        {trace.decisionStatus === 'PENDING' && (
                          <>
                            <button
                              onClick={handleConfirmAction}
                              disabled={actionInProgress}
                              className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                            >
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              <span>Confirm Recommendation</span>
                            </button>
                            <button
                              onClick={handleRejectAction}
                              disabled={actionInProgress}
                              className="py-2 px-3 bg-white dark:bg-[#162638] border border-slate-300 dark:border-[#33485D] hover:bg-rose-50 dark:hover:bg-rose-950/40 text-slate-700 dark:text-[#E8EEF5] hover:text-rose-700 dark:hover:text-rose-300 font-medium rounded-lg text-xs transition cursor-pointer"
                            >
                              Dismiss
                            </button>
                          </>
                        )}

                        {trace.decisionStatus === 'CONFIRMED' && (
                          <button
                            onClick={handleExecuteAction}
                            disabled={actionInProgress}
                            className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-300 dark:disabled:bg-slate-800 text-white font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Execute Action in Core Banking</span>
                          </button>
                        )}

                        {trace.decisionStatus === 'EXECUTED' && (
                          <div className="w-full py-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5">
                            <CheckCheck className="w-4 h-4 text-emerald-600" />
                            <span>Action Executed & Verified in Audit Trail</span>
                          </div>
                        )}
                      </div>

                      {trace.customerId && (
                        <div className="pt-2 border-t border-slate-200/80 dark:border-[#33485D]">
                          <button
                            onClick={() => {
                              window.location.href = `/strategy-simulator?customerId=${trace.customerId}`;
                            }}
                            className="w-full py-2 px-3 bg-indigo-50 dark:bg-indigo-950/40 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 font-semibold rounded-lg text-xs flex items-center justify-center gap-1.5 transition cursor-pointer border border-indigo-200 dark:border-indigo-800/60"
                            title="Open Strategy Simulator for this customer"
                          >
                            <Compass className="w-3.5 h-3.5 text-indigo-600" />
                            <span>Simulate Counterfactual Strategy</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 2: EVIDENCE */}
                {activeTab === 'EVIDENCE' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-[11px] text-slate-500 dark:text-[#8194A8] font-medium">
                        Granular factors observed by COREvia intelligence engines
                      </span>
                    </div>

                    {trace.evidence && trace.evidence.length > 0 ? (
                      trace.evidence.map((e) => (
                        <div
                          key={e.id}
                          className="p-3 bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded-xl space-y-2 hover:border-slate-300 dark:hover:border-slate-600 transition"
                        >
                          <div className="flex items-center justify-between text-[10px]">
                            <span className="font-bold text-indigo-700 dark:text-indigo-400 uppercase font-mono tracking-wider">
                              {e.sourceEngine} • {e.evidenceType}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded font-mono font-bold ${
                                e.contributionType === 'PRIMARY'
                                  ? 'bg-indigo-100 dark:bg-indigo-950/60 text-indigo-800 dark:text-indigo-300'
                                  : e.contributionType === 'NEGATIVE_SIGNAL'
                                  ? 'bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300'
                                  : 'bg-slate-100 dark:bg-[#101C2A] text-slate-700 dark:text-[#A9BACB]'
                              }`}
                            >
                              {e.contributionType}
                            </span>
                          </div>

                          <div className="font-semibold text-slate-900 dark:text-[#E8EEF5] text-xs">{e.description}</div>

                          <div className="grid grid-cols-2 gap-2 p-2 bg-slate-50 dark:bg-[#101C2A] rounded border border-slate-100 dark:border-[#33485D] font-mono text-[11px]">
                            <div>
                              <span className="text-slate-400 dark:text-[#8194A8] block text-[10px]">Observed Value:</span>
                              <span className="font-bold text-slate-900 dark:text-[#E8EEF5]">{e.observedValue}</span>
                            </div>
                            {e.previousValue && (
                              <div>
                                <span className="text-slate-400 dark:text-[#8194A8] block text-[10px]">Previous Value:</span>
                                <span className="text-slate-600 dark:text-[#A9BACB]">{e.previousValue}</span>
                              </div>
                            )}
                          </div>

                          <div className="flex justify-between items-center text-[10px] text-slate-500 dark:text-[#8194A8] pt-1 border-t border-slate-100 dark:border-[#33485D]">
                            <span>Entity: {e.sourceEntityType} ({e.sourceEntityId})</span>
                            <span>As of: {new Date(e.dataAsOf).toLocaleTimeString()}</span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-slate-400 italic">No granular evidence rows found.</div>
                    )}
                  </div>
                )}

                {/* TAB 3: SOURCES */}
                {activeTab === 'SOURCES' && (
                  <div className="space-y-4">
                    <p className="text-[11px] text-slate-500 dark:text-[#8194A8]">
                      Step-by-step origin provenance chain tracking data flow through core banking modules.
                    </p>

                    <div className="relative pl-6 space-y-4 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-[#33485D]">
                      {trace.sourceChain && trace.sourceChain.length > 0 ? (
                        trace.sourceChain.map((node, i) => (
                          <div key={node.id} className="relative">
                            <div className="absolute -left-6 top-1 w-5 h-5 rounded-full bg-white dark:bg-[#162638] border-2 border-indigo-600 dark:border-indigo-400 flex items-center justify-center text-[10px] font-mono font-bold text-indigo-700 dark:text-indigo-300 shadow-xs">
                              {i + 1}
                            </div>
                            <div className="p-3 bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded-lg space-y-1">
                              <div className="flex items-center justify-between text-[10px]">
                                <span className="font-bold text-slate-900 dark:text-[#E8EEF5] uppercase font-mono">
                                  {node.sourceType} • {node.sourceId}
                                </span>
                                <span className="text-slate-400 dark:text-[#8194A8] font-mono">
                                  {node.freshnessLabel || 'Fresh'}
                                </span>
                              </div>
                              <p className="text-slate-700 dark:text-[#E8EEF5] text-xs">{node.description}</p>
                              <div className="text-[10px] text-indigo-700 dark:text-indigo-400 font-mono font-semibold pt-1">
                                Engine: {node.sourceEngine} (Scope: {node.authorizationScope})
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-slate-400 italic">Source chain unavailable.</div>
                      )}
                    </div>
                  </div>
                )}

                {/* TAB 4: HISTORY */}
                {activeTab === 'HISTORY' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between pb-1">
                      <span className="text-[11px] text-slate-500 dark:text-[#8194A8] font-medium">
                        Chronological decisions generated for this customer
                      </span>
                    </div>

                    {loadingHistory && (
                      <div className="py-8 text-center text-slate-400">Loading decision history...</div>
                    )}

                    {historyItems.map((h) => (
                      <div
                        key={h.id}
                        className={`p-3 bg-white dark:bg-[#162638] border rounded-xl space-y-2 transition ${
                          h.id === trace.id
                            ? 'border-indigo-500 ring-1 ring-indigo-500/20'
                            : 'border-slate-200 dark:border-[#33485D]'
                        }`}
                      >
                        <div className="flex items-center justify-between text-[10px]">
                          <span className="font-mono text-slate-500 dark:text-[#8194A8]">
                            {h.decisionId} • {h.freshnessLabel}
                          </span>
                          <span
                            className={`px-1.5 py-0.2 rounded font-mono font-bold uppercase text-[9px] ${
                              h.decisionStatus === 'EXECUTED'
                                ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300'
                                : h.decisionStatus === 'CONFIRMED'
                                ? 'bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300'
                                : 'bg-slate-100 dark:bg-[#101C2A] text-slate-700 dark:text-[#A9BACB]'
                            }`}
                          >
                            {h.decisionStatus}
                          </span>
                        </div>

                        <div className="font-semibold text-slate-900 dark:text-[#E8EEF5] text-xs">{h.recommendationTitle}</div>

                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 dark:border-[#33485D] text-[11px]">
                          <span className="text-slate-400 dark:text-[#8194A8] font-mono">{h.sourceEngine}</span>
                          {h.id !== trace.id && (
                            <button
                              onClick={() => {
                                setCompareTargetId(h.decisionId);
                                setIsCompareOpen(true);
                              }}
                              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 dark:hover:text-indigo-300 font-semibold flex items-center gap-1 cursor-pointer"
                            >
                              <GitCompare className="w-3 h-3" />
                              <span>Compare with this</span>
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Footer */}
          <div className="p-3 bg-slate-50 dark:bg-[#101C2A] border-t border-slate-200 dark:border-[#33485D] flex items-center justify-between text-xs shrink-0">
            <span className="text-[11px] text-slate-500 dark:text-[#8194A8] font-mono">
              Audit Stamped &bull; Dual-Control Governed
            </span>
            <button
              onClick={onClose}
              className="px-4 py-1.5 bg-slate-200 dark:bg-[#1C3045] hover:bg-slate-300 dark:hover:bg-[#26394C] text-slate-800 dark:text-[#E8EEF5] font-medium rounded-lg transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Comparison Modal */}
      {isCompareOpen && trace && compareTargetId && (
        <DecisionComparisonModal
          isOpen={isCompareOpen}
          onClose={() => setIsCompareOpen(false)}
          baseDecisionId={compareTargetId}
          compareDecisionId={trace.decisionId}
        />
      )}
    </div>
  );
};
