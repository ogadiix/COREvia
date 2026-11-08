import React, { useState, useEffect } from 'react';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { bankingApi } from '../../lib/api';
import type { DailyRelationshipBrief, NextBestAction } from '../../types';
import {
  Sparkles,
  AlertTriangle,
  Clock,
  Eye,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  Calendar,
  Layers,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Target,
} from 'lucide-react';
import { formatINR } from '../../data/mockIndianBankingData';

interface DailyRelationshipBriefWidgetProps {
  onNavigateToCustomer: (customerId: number) => void;
  onViewEvidence: (action: NextBestAction) => void;
  onCreateTask: (action: NextBestAction) => void;
  onAcceptAction: (action: NextBestAction) => void;
}

export const DailyRelationshipBriefWidget: React.FC<DailyRelationshipBriefWidgetProps> = ({
  onNavigateToCustomer,
  onViewEvidence,
  onCreateTask,
  onAcceptAction,
}) => {
  const [brief, setBrief] = useState<DailyRelationshipBrief | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [recalculating, setRecalculating] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'ACT_NOW' | 'FOLLOW_UP' | 'WATCH' | 'OPPORTUNITIES'>('ACT_NOW');

  const fetchBrief = async () => {
    setLoading(true);
    try {
      const data = await bankingApi.getDailyRelationshipBrief();
      setBrief(data);
    } catch (err) {
      console.error('Failed to load Daily Relationship Brief:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBrief();
  }, []);

  const handleRecalculateAll = async () => {
    setRecalculating(true);
    try {
      await bankingApi.recalculateAllNextBestActions();
      await fetchBrief();
    } catch (err) {
      console.error('Failed to recalculate actions:', err);
    } finally {
      setRecalculating(false);
    }
  };

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

  return (
    <div className="bg-white dark:bg-[#162638] rounded-xl border border-slate-200 dark:border-[#33485D] shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-[#26394C] bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 dark:from-[#080F19] dark:via-[#101C2A] dark:to-[#080F19] text-white flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold tracking-tight text-white">Daily Relationship Brief</h3>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-indigo-800/80 text-indigo-200 border border-indigo-700">
                RM Operations Desk
              </span>
            </div>
            <p className="text-[11px] text-slate-300 dark:text-[#A9BACB]">
              Prioritized operational briefing powered by deterministic relationship intelligence
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={handleRecalculateAll}
            disabled={recalculating || loading}
            className="text-xs bg-slate-800/90 text-slate-200 border-slate-700 hover:bg-slate-700 hover:text-white"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin' : ''}`} />
            {recalculating ? 'Evaluating...' : 'Recalculate'}
          </Button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      {brief && (
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-y sm:divide-y-0 divide-slate-100 dark:divide-[#26394C] bg-slate-50/70 dark:bg-[#101C2A] border-b border-slate-200 dark:border-[#26394C] text-xs">
          <div className="p-3">
            <div className="text-slate-500 dark:text-[#8194A8] font-medium">Active Prioritized Actions</div>
            <div className="text-lg font-bold text-slate-900 dark:text-[#E8EEF5] mt-0.5">
              {brief.summaryStats.totalActiveActions}
            </div>
          </div>
          <div className="p-3">
            <div className="text-rose-600 dark:text-rose-400 font-semibold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" />
              Critical Priority
            </div>
            <div className="text-lg font-bold text-rose-700 dark:text-rose-400 mt-0.5">
              {brief.summaryStats.criticalActions}
            </div>
          </div>
          <div className="p-3">
            <div className="text-amber-700 dark:text-amber-300 font-semibold flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              Service-First Cases
            </div>
            <div className="text-lg font-bold text-amber-800 dark:text-amber-300 mt-0.5">
              {brief.summaryStats.serviceFirstAlerts}
            </div>
          </div>
          <div className="p-3">
            <div className="text-indigo-600 dark:text-indigo-400 font-semibold flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              Immediate Response
            </div>
            <div className="text-lg font-bold text-indigo-700 dark:text-indigo-400 mt-0.5">
              {brief.summaryStats.immediateUrgencyCount}
            </div>
          </div>
        </div>
      )}

      {/* Section Tabs */}
      <div className="flex border-b border-slate-200 dark:border-[#26394C] px-4 bg-white dark:bg-[#162638] text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('ACT_NOW')}
          className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'ACT_NOW'
              ? 'border-rose-600 text-rose-700 dark:text-rose-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-[#8194A8] hover:text-slate-800 dark:hover:text-[#E8EEF5]'
          }`}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          <span>Act Now</span>
          {brief?.actNow && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300">
              {brief.actNow.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('FOLLOW_UP')}
          className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'FOLLOW_UP'
              ? 'border-indigo-600 text-indigo-700 dark:text-indigo-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-[#8194A8] hover:text-slate-800 dark:hover:text-[#E8EEF5]'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Follow Up</span>
          {brief?.followUp && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-indigo-100 dark:bg-indigo-950/50 text-indigo-800 dark:text-indigo-300">
              {brief.followUp.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('WATCH')}
          className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'WATCH'
              ? 'border-amber-600 text-amber-700 dark:text-amber-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-[#8194A8] hover:text-slate-800 dark:hover:text-[#E8EEF5]'
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Watch List</span>
          {brief?.watch && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300">
              {brief.watch.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('OPPORTUNITIES')}
          className={`py-3 px-3 border-b-2 transition-colors flex items-center gap-1.5 ${
            activeTab === 'OPPORTUNITIES'
              ? 'border-emerald-600 text-emerald-700 dark:text-emerald-400 font-bold'
              : 'border-transparent text-slate-500 dark:text-[#8194A8] hover:text-slate-800 dark:hover:text-[#E8EEF5]'
          }`}
        >
          <Target className="w-3.5 h-3.5" />
          <span>Priority Pipeline</span>
          {brief?.opportunities && (
            <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-100 dark:bg-emerald-950/50 text-emerald-800 dark:text-emerald-300">
              {brief.opportunities.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab Contents */}
      <div className="p-4">
        {loading ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-[#8194A8] flex items-center justify-center gap-2">
            <RefreshCw className="w-4 h-4 animate-spin text-indigo-600 dark:text-indigo-400" />
            Evaluating relationship portfolio intelligence...
          </div>
        ) : !brief ? (
          <div className="py-8 text-center text-xs text-slate-500 dark:text-[#8194A8]">
            No briefing data available. Click Recalculate to generate fresh actions.
          </div>
        ) : (
          <>
            {/* 1. Act Now */}
            {activeTab === 'ACT_NOW' && (
              <div className="space-y-3">
                {brief.actNow.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 dark:text-[#8194A8] rounded-lg border border-dashed border-slate-200 dark:border-[#33485D]">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                    No critical SLA breaches or emergency issues require immediate intervention today.
                  </div>
                ) : (
                  brief.actNow.map((action) => (
                    <div
                      key={action.id}
                      className="p-3.5 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20 hover:bg-rose-50/50 dark:hover:bg-rose-950/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-slate-900 dark:text-[#E8EEF5] text-xs">
                              {action.customerName}
                            </span>
                            {action.customerCode && (
                              <span className="font-mono text-slate-500 dark:text-[#8194A8] text-[11px]">
                                ({action.customerCode})
                              </span>
                            )}
                            <Badge variant={getPriorityVariant(action.priority)} size="sm">
                              {action.priority}
                            </Badge>
                            <span className="px-2 py-0.5 rounded bg-rose-100 dark:bg-rose-950/50 text-rose-800 dark:text-rose-300 text-[10px] font-bold">
                              {action.actionType}
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-[#E8EEF5] mb-0.5">{action.title}</h4>
                          <p className="text-xs text-slate-600 dark:text-[#A9BACB] leading-relaxed line-clamp-2">
                            {action.description}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onNavigateToCustomer(action.customerId)}
                            className="text-xs inline-flex items-center gap-1"
                          >
                            <span>Customer 360</span>
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onViewEvidence(action)}
                              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
                            >
                              Why?
                            </button>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <button
                              type="button"
                              onClick={() => onCreateTask(action)}
                              className="text-[11px] text-slate-700 dark:text-[#A9BACB] hover:text-slate-900 dark:hover:text-white font-medium cursor-pointer"
                            >
                              Create Task
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 2. Follow Up */}
            {activeTab === 'FOLLOW_UP' && (
              <div className="space-y-3">
                {brief.followUp.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 dark:text-[#8194A8] rounded-lg border border-dashed border-slate-200 dark:border-[#33485D]">
                    No follow-ups due today. Outstanding customer touchpoints are on schedule.
                  </div>
                ) : (
                  brief.followUp.map((action) => (
                    <div
                      key={action.id}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-[#26394C] bg-white dark:bg-[#101C2A] hover:border-slate-300 dark:hover:border-[#33485D] transition-colors shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-slate-900 dark:text-[#E8EEF5] text-xs">
                              {action.customerName}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 text-[10px] font-bold">
                              {action.actionType}
                            </span>
                            <span className="text-[11px] text-slate-500 dark:text-[#8194A8]">
                              Urgency: <strong>{action.urgency}</strong>
                            </span>
                          </div>
                          <h4 className="text-xs font-bold text-slate-900 dark:text-[#E8EEF5] mb-0.5">{action.title}</h4>
                          <p className="text-xs text-slate-600 dark:text-[#A9BACB] leading-relaxed line-clamp-2">
                            {action.description}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onNavigateToCustomer(action.customerId)}
                            className="text-xs inline-flex items-center gap-1"
                          >
                            <span>Customer 360</span>
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => onViewEvidence(action)}
                              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
                            >
                              Why?
                            </button>
                            <span className="text-slate-300 dark:text-slate-600">•</span>
                            <button
                              type="button"
                              onClick={() => onCreateTask(action)}
                              className="text-[11px] text-slate-700 dark:text-[#A9BACB] hover:text-slate-900 dark:hover:text-white font-medium cursor-pointer"
                            >
                              Create Task
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 3. Watch List */}
            {activeTab === 'WATCH' && (
              <div className="space-y-3">
                {brief.watch.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 dark:text-[#8194A8] rounded-lg border border-dashed border-slate-200 dark:border-[#33485D]">
                    No customers currently in degraded health or critical risk bands.
                  </div>
                ) : (
                  brief.watch.map((w) => (
                    <div
                      key={w.customerId}
                      className="p-3.5 rounded-xl border border-amber-200 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/20 hover:bg-amber-50/40 dark:hover:bg-amber-950/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-bold text-slate-900 dark:text-[#E8EEF5] text-xs">{w.customerName}</span>
                            <span className="font-mono text-slate-500 dark:text-[#8194A8] text-[11px]">({w.customerCode})</span>
                            <span className="px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-950/50 text-amber-900 dark:text-amber-300 font-bold text-[10px]">
                              {w.relationshipBand}
                            </span>
                            <span className="text-xs font-mono font-bold text-rose-700 dark:text-rose-400">
                              CORE Score: {w.coreScore}/100
                            </span>
                          </div>

                          <div className="flex items-center gap-2 flex-wrap mb-1.5">
                            {w.reasons.map((r, idx) => (
                              <span
                                key={idx}
                                className="text-[10px] px-2 py-0.5 rounded bg-white dark:bg-[#162638] border border-amber-200 dark:border-amber-900/60 text-amber-900 dark:text-amber-300 font-medium"
                              >
                                {r}
                              </span>
                            ))}
                          </div>

                          {w.topAction && (
                            <div className="text-xs text-slate-700 dark:text-[#A9BACB] bg-white/80 dark:bg-[#162638] p-2 rounded border border-slate-200 dark:border-[#33485D]">
                              <span className="font-semibold text-indigo-700 dark:text-indigo-400">Recommended Step: </span>
                              {w.topAction.title}
                            </div>
                          )}
                        </div>

                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => onNavigateToCustomer(w.customerId)}
                          className="shrink-0 text-xs inline-flex items-center gap-1"
                        >
                          <span>Review 360</span>
                          <ArrowRight className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}

            {/* 4. Opportunities */}
            {activeTab === 'OPPORTUNITIES' && (
              <div className="space-y-3">
                {brief.opportunities.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 dark:text-[#8194A8] rounded-lg border border-dashed border-slate-200 dark:border-[#33485D]">
                    No active high-priority opportunities closing within the immediate forecast window.
                  </div>
                ) : (
                  brief.opportunities.map((opp) => (
                    <div
                      key={opp.opportunityId}
                      className="p-3.5 rounded-xl border border-slate-200 dark:border-[#26394C] bg-white dark:bg-[#101C2A] hover:border-slate-300 dark:hover:border-[#33485D] transition-colors shadow-xs"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <span className="font-semibold text-slate-900 dark:text-[#E8EEF5] text-xs">
                              {opp.customerName}
                            </span>
                            <span className="font-mono text-slate-500 dark:text-[#8194A8] text-[11px]">
                              {opp.opportunityCode}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 text-[10px] font-bold">
                              {opp.stage} ({opp.probability}%)
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-900 dark:text-[#E8EEF5]">
                              {formatINR(opp.expectedValue)}
                            </span>
                          </div>

                          <h4 className="text-xs font-bold text-slate-900 dark:text-[#E8EEF5] mb-0.5">{opp.title}</h4>
                          <div className="text-[11px] text-slate-500 dark:text-[#8194A8]">
                            Target Close Date: <strong>{opp.expectedCloseDate}</strong>
                          </div>

                          {opp.action && (
                            <div className="mt-1.5 text-xs text-indigo-900 dark:text-indigo-300 bg-indigo-50/60 dark:bg-indigo-950/40 p-1.5 rounded border border-indigo-100 dark:border-indigo-800">
                              <span className="font-semibold">Next Action: </span>
                              {opp.action.title}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => onNavigateToCustomer(opp.customerId)}
                            className="text-xs inline-flex items-center gap-1"
                          >
                            <span>Customer 360</span>
                            <ArrowRight className="w-3 h-3" />
                          </Button>
                          {opp.action && (
                            <button
                              type="button"
                              onClick={() => onViewEvidence(opp.action!)}
                              className="text-[11px] text-indigo-600 dark:text-indigo-400 hover:underline font-medium cursor-pointer"
                            >
                              Why this action?
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
