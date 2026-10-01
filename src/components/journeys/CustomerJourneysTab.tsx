import React, { useState, useEffect } from 'react';
import {
  Milestone,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';
import { bankingApi } from '../../lib/api';
import { CustomerJourneyDTO } from '../../types/journey.types';
import { Button } from '../common/Button';

interface CustomerJourneysTabProps {
  customerId: number;
  customerName: string;
  customerCode?: string;
  onOpenWorkspaceJourney?: (journeyId: number | string) => void;
}

export const CustomerJourneysTab: React.FC<CustomerJourneysTabProps> = ({
  customerId,
  customerName,
  customerCode,
  onOpenWorkspaceJourney,
}) => {
  const [loading, setLoading] = useState(true);
  const [journeys, setJourneys] = useState<CustomerJourneyDTO[]>([]);

  const fetchJourneys = async () => {
    try {
      setLoading(true);
      const res: any = await bankingApi.getJourneys({ customerId });
      setJourneys(res.data || res || []);
    } catch (err) {
      console.error('Failed to load customer journeys:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJourneys();
  }, [customerId]);

  const journeyList = Array.isArray(journeys) ? journeys : [];
  const activeJourneys = journeyList.filter((j) => j.status === 'IN_PROGRESS' || j.status === 'BLOCKED');
  const completedJourneys = journeyList.filter((j) => j.status === 'COMPLETED');

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between border-b border-slate-200 pb-3">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
            <Milestone className="w-3.5 h-3.5 text-blue-600" />
            <span>Active & Historical Lifecycle Journeys</span>
          </h3>
          <p className="text-[11px] text-slate-500">
            Multi-department orchestrations tracking milestones, evidence, and SLA governance for {customerName}.
          </p>
        </div>

        <button
          onClick={() => {
            window.location.href = `/journeys`;
          }}
          className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 cursor-pointer"
        >
          <span>All Portfolio Journeys</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {loading ? (
        <div className="p-8 text-center text-slate-500 flex flex-col items-center">
          <RefreshCw className="w-5 h-5 animate-spin text-blue-600 mb-2" />
          <p className="text-xs">Loading customer lifecycle journeys...</p>
        </div>
      ) : journeys.length === 0 ? (
        <div className="p-8 text-center text-slate-500 bg-slate-50 border border-slate-200 rounded-lg">
          <Milestone className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-xs font-semibold text-slate-700">No Lifecycle Journeys for This Customer</p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            No active or historical journeys have been initiated yet.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {journeys.map((j) => {
            const isBlocked = j.status === 'BLOCKED';
            const isCompleted = j.status === 'COMPLETED';

            return (
              <div
                key={j.id}
                className={`p-4 border rounded-lg transition-all ${
                  isBlocked
                    ? 'bg-rose-50/40 border-rose-200'
                    : isCompleted
                    ? 'bg-emerald-50/20 border-slate-200'
                    : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-slate-900">{j.name}</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                            : isBlocked
                            ? 'bg-rose-100 text-rose-800 border-rose-300'
                            : 'bg-blue-100 text-blue-800 border-blue-300'
                        }`}
                      >
                        {j.status}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                          j.slaStatus === 'BREACHED'
                            ? 'bg-rose-600 text-white'
                            : j.slaStatus === 'AT_RISK'
                            ? 'bg-amber-500 text-white'
                            : 'bg-emerald-600 text-white'
                        }`}
                      >
                        SLA: {j.slaStatus}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-500 font-mono flex items-center gap-2 mt-1">
                      <span>{j.journeyCode}</span>
                      <span>•</span>
                      <span>Owner: {j.ownerRole}</span>
                      {j.targetCompletionDate && (
                        <>
                          <span>•</span>
                          <span>Target: {new Date(j.targetCompletionDate).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>

                    {isBlocked && j.blockerReason && (
                      <div className="mt-2 text-xs text-rose-700 font-medium flex items-center gap-1.5">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                        <span>Blocker: {j.blockerReason}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center">
                    <div className="text-right min-w-[100px]">
                      <div className="text-xs font-bold text-slate-900">{j.progressPercentage}%</div>
                      <div className="w-24 bg-slate-200 rounded-full h-1.5 mt-1 overflow-hidden">
                        <div
                          className={`h-1.5 rounded-full ${isBlocked ? 'bg-rose-500' : 'bg-blue-600'}`}
                          style={{ width: `${j.progressPercentage}%` }}
                        />
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        if (onOpenWorkspaceJourney) {
                          onOpenWorkspaceJourney(j.id);
                        } else {
                          window.location.href = `/journeys?id=${j.id}`;
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md border border-blue-200 flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Workspace</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
