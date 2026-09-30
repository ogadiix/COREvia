import React, { useState, useEffect } from 'react';
import {
  Milestone,
  ArrowLeft,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ShieldAlert,
  ArrowRightLeft,
  FileCheck,
  Send,
  User,
  Building2,
  Calendar,
  Layers,
  ChevronRight,
  ExternalLink,
  ShieldCheck,
  CheckSquare,
  Sparkles,
  Lock,
  RefreshCw,
  Eye,
  FileText,
  AlertCircle,
} from 'lucide-react';
import { bankingApi } from '../../lib/api';
import { CustomerJourneyDTO, CustomerJourneyStepDTO, JourneyTimelineEventDTO, JourneyProgressDTO } from '../../types/journey.types';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';

interface CustomerJourneyWorkspaceProps {
  journeyId: string | number;
  onBack: () => void;
  onNavigateToCustomer?: (customerId: number | string) => void;
}

export const CustomerJourneyWorkspace: React.FC<CustomerJourneyWorkspaceProps> = ({
  journeyId,
  onBack,
  onNavigateToCustomer,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [journey, setJourney] = useState<CustomerJourneyDTO | null>(null);
  const [steps, setSteps] = useState<CustomerJourneyStepDTO[]>([]);
  const [progress, setProgress] = useState<JourneyProgressDTO | null>(null);
  const [timeline, setTimeline] = useState<JourneyTimelineEventDTO[]>([]);
  const [activeTab, setActiveTab] = useState<'STEPS' | 'TIMELINE' | 'EVIDENCE'>('STEPS');

  // Modals & Action States
  const [selectedStep, setSelectedStep] = useState<CustomerJourneyStepDTO | null>(null);
  const [isHandoffModalOpen, setIsHandoffModalOpen] = useState(false);
  const [handoffRole, setHandoffRole] = useState('RELATIONSHIP_MANAGER');
  const [handoffReason, setHandoffReason] = useState('');
  const [isEscalateModalOpen, setIsEscalateModalOpen] = useState(false);
  const [escalationReason, setEscalationReason] = useState('');
  const [escalationUrgency, setEscalationUrgency] = useState<'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [isOutcomeModalOpen, setIsOutcomeModalOpen] = useState(false);
  const [outcomeType, setOutcomeType] = useState('GOAL_MET');
  const [outcomeNotes, setOutcomeNotes] = useState('');
  const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
  const [blockerReason, setBlockerReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const fetchJourney = async () => {
    try {
      setLoading(true);
      setError(null);
      const res: any = await bankingApi.getJourney(journeyId);
      const data = res.data || res;
      setJourney(data.journey || data);
      setSteps(data.steps || []);
      setProgress(data.progress || data.journey?.progress);
      setTimeline(data.timeline || []);
    } catch (err: any) {
      console.error('Failed to load journey:', err);
      setError(err?.message || 'Failed to load journey details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJourney();
  }, [journeyId]);

  const handleStepAction = async (stepId: number, newStatus: string, reason?: string) => {
    try {
      setActionLoading(true);
      setActionSuccess(null);
      await bankingApi.updateJourneyStep(journeyId, stepId, {
        status: newStatus,
        blockerReason: reason,
        notes: reason ? `Updated to ${newStatus}: ${reason}` : undefined,
      });
      setActionSuccess(`Step status updated to ${newStatus}.`);
      setIsBlockModalOpen(false);
      setBlockerReason('');
      await fetchJourney();
    } catch (err: any) {
      alert(err?.message || 'Failed to update journey step.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleHandoff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!handoffReason.trim()) return;
    try {
      setActionLoading(true);
      await bankingApi.handoffJourney(journeyId, {
        targetRole: handoffRole,
        reason: handoffReason,
      });
      setIsHandoffModalOpen(false);
      setHandoffReason('');
      setActionSuccess('Journey ownership transferred successfully.');
      await fetchJourney();
    } catch (err: any) {
      alert(err?.message || 'Failed to handoff journey.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEscalate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!escalationReason.trim()) return;
    try {
      setActionLoading(true);
      const res = await bankingApi.escalateJourney(journeyId, {
        reason: escalationReason,
        urgency: escalationUrgency,
      });
      setIsEscalateModalOpen(false);
      setEscalationReason('');
      setActionSuccess(`Journey escalated to ${res.decisionTraceId || 'Decision Trace'}.`);
      await fetchJourney();
    } catch (err: any) {
      alert(err?.message || 'Failed to escalate journey.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleRecordOutcome = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setActionLoading(true);
      await bankingApi.recordJourneyOutcome(journeyId, {
        outcomeType: outcomeType as any,
        summary: outcomeNotes,
        goalMet: outcomeType === 'GOAL_MET' || outcomeType === 'PARTIALLY_MET',
      });
      setIsOutcomeModalOpen(false);
      setActionSuccess('Journey outcome recorded successfully.');
      await fetchJourney();
    } catch (err: any) {
      alert(err?.message || 'Failed to record journey outcome.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-16 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mb-3" />
        <p className="text-sm font-medium">Loading Governed Lifecycle Journey...</p>
      </div>
    );
  }

  if (error || !journey) {
    return (
      <div className="p-8 max-w-2xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <AlertCircle className="w-10 h-10 text-red-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-red-900 mb-1">Failed to Load Journey</h3>
          <p className="text-sm text-red-700 mb-4">{error || 'Journey record not found or access denied.'}</p>
          <Button variant="outline" onClick={onBack} icon={<ArrowLeft className="w-4 h-4" />}>
            Back to Journeys Portfolio
          </Button>
        </div>
      </div>
    );
  }

  const getStatusBadgeClass = (st: string) => {
    switch (st) {
      case 'COMPLETED':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'BLOCKED':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'IN_PROGRESS':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'ESCALATED':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'CANCELLED':
        return 'bg-slate-100 text-slate-700 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const getSlaBadgeClass = (sla: string) => {
    switch (sla) {
      case 'BREACHED':
        return 'bg-rose-600 text-white animate-pulse';
      case 'AT_RISK':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-emerald-600 text-white';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Top Breadcrumb & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-md hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Back to Journeys"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono font-bold text-slate-500 uppercase tracking-wider">
                {journey.journeyCode}
              </span>
              <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${getStatusBadgeClass(journey.status)}`}>
                {journey.status}
              </span>
              <span className={`px-2 py-0.5 text-xs font-bold rounded ${getSlaBadgeClass(journey.slaStatus)}`}>
                SLA: {journey.slaStatus}
              </span>
              <span className="px-2 py-0.5 text-xs font-medium bg-slate-100 text-slate-700 rounded border border-slate-200">
                Priority: {journey.priority}
              </span>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mt-1">{journey.name}</h1>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            icon={<ArrowRightLeft className="w-3.5 h-3.5" />}
            onClick={() => setIsHandoffModalOpen(true)}
            disabled={journey.status === 'COMPLETED' || journey.status === 'CANCELLED'}
          >
            Handoff
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-amber-700 border-amber-300 hover:bg-amber-50"
            icon={<ShieldAlert className="w-3.5 h-3.5" />}
            onClick={() => setIsEscalateModalOpen(true)}
            disabled={journey.status === 'COMPLETED' || journey.status === 'CANCELLED'}
          >
            Escalate (Trace)
          </Button>
          <Button
            size="sm"
            variant="primary"
            icon={<CheckCircle2 className="w-3.5 h-3.5" />}
            onClick={() => setIsOutcomeModalOpen(true)}
            disabled={journey.status === 'COMPLETED' || journey.status === 'CANCELLED'}
          >
            Record Outcome
          </Button>
        </div>
      </div>

      {actionSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-4 py-2.5 rounded-md flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="text-emerald-600 hover:text-emerald-900 font-bold">
            ×
          </button>
        </div>
      )}

      {/* Blocker Alert Banner if Blocked */}
      {journey.status === 'BLOCKED' && (
        <div className="bg-rose-50 border-l-4 border-rose-600 p-4 rounded-r-md">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="text-xs">
              <h4 className="font-bold text-rose-900 text-sm">Customer Journey is Currently Blocked</h4>
              <p className="text-rose-700 mt-1">
                Reason: {journey.blockerReason || 'Unresolved dependency or prerequisite step failure.'}
              </p>
              <p className="text-rose-600 font-mono text-[11px] mt-1">
                Action required: Inspect the blocked step below, verify prerequisites, and resolve or reassign ownership.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Overview Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Customer Context Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-2">
            <User className="w-3.5 h-3.5 text-blue-600" />
            Customer Subject
          </div>
          <div className="font-bold text-slate-900 truncate">{journey.customerName || `Customer #${journey.customerId}`}</div>
          <div className="text-xs text-slate-500 font-mono mt-0.5">Code: {journey.customerCode || 'CUS-N/A'}</div>
          {onNavigateToCustomer && (
            <button
              onClick={() => onNavigateToCustomer(journey.customerId)}
              className="text-xs text-blue-600 hover:text-blue-800 font-medium mt-2 flex items-center gap-1 cursor-pointer"
            >
              <span>View Customer 360</span>
              <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Progress Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-2">
            <Milestone className="w-3.5 h-3.5 text-indigo-600" />
            Step Progression
          </div>
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-xl font-bold text-slate-900">{progress?.progressPercentage || 0}%</span>
            <span className="text-xs text-slate-500 font-mono">
              {progress?.completedSteps || 0} / {progress?.totalSteps || steps.length} Completed
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all duration-500 ${
                journey.status === 'BLOCKED' ? 'bg-rose-500' : 'bg-blue-600'
              }`}
              style={{ width: `${progress?.progressPercentage || 0}%` }}
            />
          </div>
        </div>

        {/* SLA Health Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-2">
            <Clock className="w-3.5 h-3.5 text-amber-600" />
            SLA & Deadlines
          </div>
          <div className="text-base font-bold text-slate-900">
            {journey.targetCompletionDate ? new Date(journey.targetCompletionDate).toLocaleDateString() : 'Target N/A'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Status: <span className="font-semibold text-slate-800">{journey.slaStatus}</span>
          </div>
          {journey.decisionTraceId && (
            <div className="mt-2 text-[11px] font-mono text-purple-700 bg-purple-50 px-2 py-0.5 rounded border border-purple-200 truncate">
              Linked Trace: {journey.decisionTraceId}
            </div>
          )}
        </div>

        {/* Assigned Owner Card */}
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium flex items-center gap-1.5 mb-2">
            <Building2 className="w-3.5 h-3.5 text-emerald-600" />
            Operational Ownership
          </div>
          <div className="font-bold text-slate-900">{journey.ownerName || 'Unassigned Officer'}</div>
          <div className="text-xs text-slate-600 font-mono mt-0.5">Role: {journey.ownerRole}</div>
          <div className="text-[11px] text-slate-400 mt-2">
            Template: {journey.templateName || journey.templateCode}
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('STEPS')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'STEPS'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Lifecycle Steps Matrix ({steps.length})
        </button>
        <button
          onClick={() => setActiveTab('TIMELINE')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'TIMELINE'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Audit Timeline ({timeline.length})
        </button>
        <button
          onClick={() => setActiveTab('EVIDENCE')}
          className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
            activeTab === 'EVIDENCE'
              ? 'border-blue-600 text-blue-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Authoritative Evidence ({steps.filter((s) => s.evidenceVerified).length})
        </button>
      </div>

      {/* Tab 1: STEPS MATRIX */}
      {activeTab === 'STEPS' && (
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Governed Step Execution Matrix
              </span>
              <span className="text-[11px] text-slate-500">
                Steps must satisfy prerequisite dependencies before unlocking ready state.
              </span>
            </div>

            <div className="divide-y divide-slate-100">
              {steps.map((step) => {
                const isReady = step.status === 'READY';
                const isInProgress = step.status === 'IN_PROGRESS';
                const isCompleted = step.status === 'COMPLETED';
                const isBlocked = step.status === 'BLOCKED';

                return (
                  <div
                    key={step.id}
                    className={`p-4 transition-colors ${
                      isBlocked
                        ? 'bg-rose-50/50'
                        : isCompleted
                        ? 'bg-slate-50/30'
                        : isReady
                        ? 'bg-blue-50/30'
                        : 'bg-white'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      {/* Step Header & Key Details */}
                      <div className="flex items-start gap-3">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                              : isBlocked
                              ? 'bg-rose-100 text-rose-800 border border-rose-300'
                              : isReady
                              ? 'bg-blue-600 text-white animate-pulse'
                              : isInProgress
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-100 text-slate-600 border border-slate-300'
                          }`}
                        >
                          {isCompleted ? '✓' : step.stepOrder}
                        </div>

                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-sm text-slate-900">{step.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200">
                              {step.stepType}
                            </span>
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${
                                isCompleted
                                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                  : isBlocked
                                  ? 'bg-rose-100 text-rose-800 border-rose-300'
                                  : isReady
                                  ? 'bg-blue-100 text-blue-800 border-blue-300'
                                  : isInProgress
                                  ? 'bg-amber-100 text-amber-800 border-amber-300'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              }`}
                            >
                              {step.status}
                            </span>
                            {step.evidenceVerified && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded flex items-center gap-1">
                                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                                Verified Evidence
                              </span>
                            )}
                          </div>

                          <p className="text-xs text-slate-600 mt-1">{step.description || 'No description provided.'}</p>

                          {/* Dependencies & SLA Tags */}
                          <div className="flex items-center gap-3 mt-2 text-[11px] text-slate-500 font-mono flex-wrap">
                            <span>Assignee: {step.assignedRole}</span>
                            <span>•</span>
                            <span>Target SLA: {step.slaDays} days</span>
                            {step.dueDate && (
                              <>
                                <span>•</span>
                                <span>Due: {new Date(step.dueDate).toLocaleDateString()}</span>
                              </>
                            )}
                            {step.dependencyStepKeys && step.dependencyStepKeys.length > 0 && (
                              <>
                                <span>•</span>
                                <span className="text-amber-700 bg-amber-50 px-1.5 py-0.2 rounded border border-amber-200">
                                  Requires: {step.dependencyStepKeys.join(', ')}
                                </span>
                              </>
                            )}
                          </div>

                          {/* Blocker Reason if Step is Blocked */}
                          {isBlocked && step.blockerReason && (
                            <div className="mt-2 text-xs font-semibold text-rose-700 bg-rose-100/70 px-2.5 py-1 rounded border border-rose-200 flex items-center gap-1.5">
                              <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                              <span>Blocker: {step.blockerReason}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Step Actions */}
                      <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                        {isReady && (
                          <Button
                            size="sm"
                            variant="primary"
                            icon={<ChevronRight className="w-3.5 h-3.5" />}
                            onClick={() => handleStepAction(step.id, 'IN_PROGRESS')}
                            disabled={actionLoading}
                          >
                            Start Step
                          </Button>
                        )}

                        {isInProgress && (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-emerald-700 border-emerald-300 hover:bg-emerald-50"
                              icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                              onClick={() => handleStepAction(step.id, 'COMPLETED')}
                              disabled={actionLoading}
                            >
                              Complete
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-rose-700 border-rose-300 hover:bg-rose-50"
                              icon={<AlertTriangle className="w-3.5 h-3.5" />}
                              onClick={() => {
                                setSelectedStep(step);
                                setIsBlockModalOpen(true);
                              }}
                              disabled={actionLoading}
                            >
                              Block
                            </Button>
                          </>
                        )}

                        {isBlocked && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-blue-700 border-blue-300 hover:bg-blue-50"
                            icon={<RefreshCw className="w-3.5 h-3.5" />}
                            onClick={() => handleStepAction(step.id, 'READY')}
                            disabled={actionLoading}
                          >
                            Unblock
                          </Button>
                        )}

                        {isCompleted && (
                          <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Completed
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: AUDIT TIMELINE */}
      {activeTab === 'TIMELINE' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs">
          <div className="space-y-6">
            {timeline.length === 0 ? (
              <p className="text-xs text-slate-500 italic">No timeline events recorded.</p>
            ) : (
              timeline.map((evt, idx) => (
                <div key={evt.id || idx} className="relative flex items-start gap-4">
                  {idx < timeline.length - 1 && (
                    <div className="absolute left-3.5 top-7 bottom-0 w-0.5 bg-slate-200 -z-0" />
                  )}
                  <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 border border-blue-300 flex items-center justify-center text-xs shrink-0 z-10">
                    <Clock className="w-3.5 h-3.5" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-slate-900">{evt.title}</h4>
                      <span className="text-[11px] font-mono text-slate-400">
                        {new Date(evt.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-0.5">{evt.description}</p>
                    <div className="text-[10px] text-slate-400 font-mono mt-1">
                      Actor: {evt.actorName || 'System Service'} ({evt.actorRole || 'SYSTEM'})
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Tab 3: AUTHORITATIVE EVIDENCE */}
      {activeTab === 'EVIDENCE' && (
        <div className="bg-white border border-slate-200 rounded-lg p-6 shadow-xs space-y-4">
          <div className="border-b border-slate-200 pb-3">
            <h3 className="text-sm font-bold text-slate-900">Verified Evidence Records</h3>
            <p className="text-xs text-slate-500">
              Evidence is cryptographically and referentially verified against authoritative COREvia tables.
            </p>
          </div>

          <div className="space-y-3">
            {steps
              .filter((s) => s.evidenceVerified)
              .map((s) => (
                <div key={s.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-md">
                  <div className="flex items-center justify-between">
                    <div className="font-semibold text-xs text-slate-900">{s.name}</div>
                    <span className="text-[10px] font-mono text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                      Verified at {s.verifiedAt ? new Date(s.verifiedAt).toLocaleString() : 'Completion'}
                    </span>
                  </div>
                  <div className="mt-2 text-xs font-mono bg-white p-2.5 rounded border border-slate-200 text-slate-700 overflow-x-auto">
                    {JSON.stringify(s.completionEvidence || {}, null, 2)}
                  </div>
                </div>
              ))}
            {steps.filter((s) => s.evidenceVerified).length === 0 && (
              <p className="text-xs text-slate-500 italic">No verified completion evidence records yet.</p>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: Handoff Ownership */}
      {isHandoffModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Transfer Journey Ownership</h3>
              <button
                onClick={() => setIsHandoffModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleHandoff} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Target Department / Role</label>
                <select
                  value={handoffRole}
                  onChange={(e) => setHandoffRole(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                >
                  <option value="RELATIONSHIP_MANAGER">Relationship Manager (RM)</option>
                  <option value="KYC_OPERATIONS">KYC Operations</option>
                  <option value="CREDIT_OFFICER">Credit Officer</option>
                  <option value="SERVICE_DESK_LEAD">Service Desk Lead</option>
                  <option value="BRANCH_MANAGER">Branch Manager</option>
                  <option value="COMPLIANCE_OFFICER">Compliance Officer</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Handoff Rationale (Mandatory)</label>
                <textarea
                  rows={3}
                  value={handoffReason}
                  onChange={(e) => setHandoffReason(e.target.value)}
                  placeholder="Provide explicit operational context and reason for transferring responsibility..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsHandoffModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={actionLoading}>
                  Confirm Handoff
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: Escalate Journey */}
      {isEscalateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 text-purple-900">
                <ShieldAlert className="w-4 h-4 text-purple-700" />
                Escalate via Decision Trace
              </h3>
              <button
                onClick={() => setIsEscalateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleEscalate} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Escalation Urgency</label>
                <select
                  value={escalationUrgency}
                  onChange={(e) => setEscalationUrgency(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900"
                >
                  <option value="MEDIUM">Medium Urgency</option>
                  <option value="HIGH">High Urgency</option>
                  <option value="CRITICAL">Critical SLA Breach</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Escalation Context & Justification</label>
                <textarea
                  rows={3}
                  value={escalationReason}
                  onChange={(e) => setEscalationReason(e.target.value)}
                  placeholder="Detail the prerequisite failure, SLA breach, or institutional blocker requiring supervisory review..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEscalateModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" className="bg-purple-600 hover:bg-purple-700" disabled={actionLoading}>
                  Create Decision Trace Escalation
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: Record Outcome */}
      {isOutcomeModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Record Journey Lifecycle Outcome</h3>
              <button
                onClick={() => setIsOutcomeModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ×
              </button>
            </div>
            <form onSubmit={handleRecordOutcome} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Outcome Status</label>
                <select
                  value={outcomeType}
                  onChange={(e) => setOutcomeType(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900"
                >
                  <option value="GOAL_MET">Goal Fully Met (Success)</option>
                  <option value="PARTIALLY_MET">Partially Met</option>
                  <option value="ABANDONED">Customer Abandoned</option>
                  <option value="EXPIRED">SLA Expired / Time Out</option>
                  <option value="FAILED">Compliance / Underwriting Failed</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Outcome Summary Notes</label>
                <textarea
                  rows={3}
                  value={outcomeNotes}
                  onChange={(e) => setOutcomeNotes(e.target.value)}
                  placeholder="Record definitive business outcome, conversion notes, or reasons for closure..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsOutcomeModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={actionLoading}>
                  Finalize Journey Outcome
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: Step Blocker Dialog */}
      {isBlockModalOpen && selectedStep && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-rose-900 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-600" />
                Block Step: {selectedStep.name}
              </h3>
              <button
                onClick={() => setIsBlockModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ×
              </button>
            </div>
            <div className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Blocker Reason (Required)</label>
                <textarea
                  rows={3}
                  value={blockerReason}
                  onChange={(e) => setBlockerReason(e.target.value)}
                  placeholder="Specify why this step is blocked (e.g. Missing Aadhaar OTP, Pending FIU-IND sanction check)..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBlockModalOpen(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  className="bg-rose-600 hover:bg-rose-700"
                  disabled={!blockerReason.trim() || actionLoading}
                  onClick={() => handleStepAction(selectedStep.id, 'BLOCKED', blockerReason)}
                >
                  Confirm Blocker
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
