import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Trash2,
  Calendar,
  Clock,
  User,
  Users,
  Briefcase,
  AlertCircle,
  CheckCircle2,
  Link as LinkIcon,
  CheckSquare,
} from 'lucide-react';
import {
  InteractionChannel,
  InteractionType,
  InteractionOutcome,
  InteractionSentiment,
  InteractionParticipant,
} from '../../types';

interface RecordInteractionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialCustomerId?: number;
  initialCustomerName?: string;
}

interface CustomerOption {
  id: number;
  customerCode: string;
  name: string;
  type: string;
}

export const RecordInteractionModal: React.FC<RecordInteractionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialCustomerId,
  initialCustomerName,
}) => {
  const [customersList, setCustomersList] = useState<CustomerOption[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);

  // Form State
  const [customerId, setCustomerId] = useState<number | ''>(initialCustomerId || '');
  const [channel, setChannel] = useState<InteractionChannel>('PHONE');
  const [interactionType, setInteractionType] = useState<InteractionType>('CALL');
  const [subject, setSubject] = useState('');
  const [summary, setSummary] = useState('');
  const [outcome, setOutcome] = useState<InteractionOutcome>('FOLLOW_UP_REQUIRED');
  const [sentiment, setSentiment] = useState<InteractionSentiment>('POSITIVE');
  const [duration, setDuration] = useState<number>(30);
  const [timestamp, setTimestamp] = useState<string>(() => new Date().toISOString().slice(0, 16));

  // Follow-up
  const [followupRequired, setFollowupRequired] = useState(true);
  const [followupAction, setFollowupAction] = useState('');
  const [followupDate, setFollowupDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().slice(0, 10);
  });
  const [followupPriority, setFollowupPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');

  // Participants
  const [participants, setParticipants] = useState<InteractionParticipant[]>([
    { type: 'CUSTOMER', name: initialCustomerName || '', role: 'Client Representative', attended: true },
    { type: 'RM', name: 'Deepak Nambiar', role: 'Principal Relationship Manager', attended: true },
  ]);

  // Commitments
  const [commitments, setCommitments] = useState<
    Array<{
      commitmentType: 'CUSTOMER_COMMITMENT' | 'RM_COMMITMENT';
      description: string;
      ownerName: string;
      dueDate: string;
      createTask: boolean;
    }>
  >([]);

  // Links
  const [linkedOpportunityId, setLinkedOpportunityId] = useState<string>('');
  const [linkedCaseId, setLinkedCaseId] = useState<string>('');
  const [customerOpps, setCustomerOpps] = useState<Array<{ id: number; title: string }>>([]);
  const [customerCases, setCustomerCases] = useState<Array<{ id: number; subject: string }>>([]);

  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Load customer list
  useEffect(() => {
    async function loadCustomers() {
      setLoadingCustomers(true);
      try {
        const res = await fetch('/api/customers?limit=50', { credentials: 'include' });
        if (res.ok) {
          const data = await res.json();
          setCustomersList(data.data || []);
          if (!customerId && data.data?.length > 0 && !initialCustomerId) {
            setCustomerId(data.data[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching customers:', err);
      } finally {
        setLoadingCustomers(false);
      }
    }
    if (isOpen) {
      loadCustomers();
    }
  }, [isOpen, initialCustomerId]);

  // When customerId changes, update participant name & load opps/cases
  useEffect(() => {
    if (customerId) {
      const selected = customersList.find((c) => c.id === customerId);
      if (selected) {
        setParticipants((prev) =>
          prev.map((p, idx) => (idx === 0 && p.type === 'CUSTOMER' ? { ...p, name: selected.name } : p))
        );
      }

      // Load active opportunities & cases for linkage
      fetch(`/api/opportunities?customerId=${customerId}`, { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : { data: [] }))
        .then((d) => setCustomerOpps(d.data || []))
        .catch(() => setCustomerOpps([]));

      fetch(`/api/cases?customerId=${customerId}`, { credentials: 'include' })
        .then((r) => (r.ok ? r.json() : { data: [] }))
        .then((d) => setCustomerCases(d.data || []))
        .catch(() => setCustomerCases([]));
    }
  }, [customerId, customersList]);

  if (!isOpen) return null;

  const handleAddParticipant = () => {
    setParticipants([
      ...participants,
      { type: 'SPECIALIST', name: '', role: 'Banking Specialist', attended: true },
    ]);
  };

  const handleRemoveParticipant = (index: number) => {
    setParticipants(participants.filter((_, i) => i !== index));
  };

  const handleUpdateParticipant = (index: number, field: keyof InteractionParticipant, value: any) => {
    const updated = [...participants];
    updated[index] = { ...updated[index], [field]: value };
    setParticipants(updated);
  };

  const handleAddCommitment = () => {
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 5);
    setCommitments([
      ...commitments,
      {
        commitmentType: 'RM_COMMITMENT',
        description: '',
        ownerName: 'Relationship Manager',
        dueDate: defaultDate.toISOString().slice(0, 10),
        createTask: true,
      },
    ]);
  };

  const handleRemoveCommitment = (index: number) => {
    setCommitments(commitments.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!customerId) {
      setErrorMsg('Please select a customer.');
      return;
    }
    if (!subject.trim()) {
      setErrorMsg('Interaction subject is required.');
      return;
    }
    if (!summary.trim()) {
      setErrorMsg('Executive summary is required.');
      return;
    }
    if (followupRequired && !followupAction.trim()) {
      setErrorMsg('Please enter the follow-up action required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerId: Number(customerId),
        channel,
        interactionType,
        subject: subject.trim(),
        summary: summary.trim(),
        outcome,
        sentiment,
        duration: Number(duration) || 30,
        timestamp: new Date(timestamp).toISOString(),
        participants: participants.filter((p) => p.name.trim().length > 0),
        followupRequired,
        followupAction: followupRequired ? followupAction.trim() : null,
        followupDate: followupRequired ? followupDate : null,
        followupPriority: followupRequired ? followupPriority : null,
        commitments: commitments.filter((c) => c.description.trim().length > 0),
        linkedOpportunityId: linkedOpportunityId ? Number(linkedOpportunityId) : null,
        linkedCaseId: linkedCaseId ? Number(linkedCaseId) : null,
      };

      const res = await fetch('/api/interactions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || errorData.error || 'Failed to record interaction');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'An unexpected error occurred while logging the interaction.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      id="record-interaction-modal-overlay"
      className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto"
    >
      <div
        id="record-interaction-modal-container"
        className="bg-white border border-slate-200 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden text-xs"
      >
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div>
            <h2 className="text-sm font-bold tracking-tight">Record Customer Interaction</h2>
            <p className="text-[11px] text-slate-300">
              Institutional record of touchpoint, outcomes, officer commitments, and follow-up tasks
            </p>
          </div>
          <button
            id="btn-close-record-interaction"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Customer & Timestamp */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Customer / Account Entity *
              </label>
              {initialCustomerId && initialCustomerName ? (
                <div className="p-2 bg-slate-100 border border-slate-200 rounded text-slate-900 font-medium">
                  {initialCustomerName}
                </div>
              ) : (
                <select
                  id="select-interaction-customer"
                  value={customerId}
                  onChange={(e) => setCustomerId(Number(e.target.value))}
                  disabled={loadingCustomers}
                  className="w-full p-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                >
                  <option value="">Select customer...</option>
                  {customersList.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customerCode}) • {c.type}
                    </option>
                  ))}
                </select>
              )}
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Date & Time of Touchpoint *
              </label>
              <input
                id="input-interaction-timestamp"
                type="datetime-local"
                value={timestamp}
                onChange={(e) => setTimestamp(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Channel & Type & Duration */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Communication Channel *
              </label>
              <select
                id="select-interaction-channel"
                value={channel}
                onChange={(e) => setChannel(e.target.value as InteractionChannel)}
                className="w-full p-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-slate-900"
              >
                <option value="PHONE">Phone / Telephonic Call</option>
                <option value="IN_PERSON">In-Person Meeting (Client Site)</option>
                <option value="VIDEO">Virtual Video Conference</option>
                <option value="EMAIL">Email Dispatch / Response</option>
                <option value="BRANCH">Branch Counter Visit</option>
                <option value="CHAT">Portal Support Chat</option>
                <option value="MESSAGE">Official WhatsApp / SMS</option>
                <option value="PORTAL">Corporate NetBanking Portal</option>
                <option value="ONBOARDING">Digital Onboarding Desk</option>
                <option value="OTHER">Other Channel</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Interaction Classification *
              </label>
              <select
                id="select-interaction-type"
                value={interactionType}
                onChange={(e) => setInteractionType(e.target.value as InteractionType)}
                className="w-full p-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-slate-900"
              >
                <option value="CALL">Routine Call</option>
                <option value="MEETING">Strategic Meeting</option>
                <option value="VIDEO_MEETING">Video Discussion</option>
                <option value="BRANCH_VISIT">Branch Transaction</option>
                <option value="EMAIL">Email Exchange</option>
                <option value="CHAT">Chat Inquiry</option>
                <option value="MESSAGE">Instant Message</option>
                <option value="SERVICE_CONTACT">Service Request Handling</option>
                <option value="RELATIONSHIP_REVIEW">Relationship Review</option>
                <option value="ONBOARDING_CONTACT">KYC & Onboarding</option>
                <option value="OTHER">General Touchpoint</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Duration (Minutes)
              </label>
              <input
                id="input-interaction-duration"
                type="number"
                min="1"
                max="480"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full p-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Discussion Subject / Topic *
            </label>
            <input
              id="input-interaction-subject"
              type="text"
              placeholder="e.g., Working Capital Limit Review & FX Hedging Term Sheet"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full p-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 font-medium"
            />
          </div>

          {/* Summary */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Executive Summary & Discussion Log *
            </label>
            <textarea
              id="textarea-interaction-summary"
              rows={3}
              placeholder="Provide clear structured notes on discussion items, customer queries, decisions, and officer observations..."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="w-full p-2.5 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* Outcome & Sentiment */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Touchpoint Outcome *
              </label>
              <select
                id="select-interaction-outcome"
                value={outcome}
                onChange={(e) => setOutcome(e.target.value as InteractionOutcome)}
                className="w-full p-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-slate-900"
              >
                <option value="FOLLOW_UP_REQUIRED">Follow-up Required</option>
                <option value="OPPORTUNITY_IDENTIFIED">New Opportunity Identified</option>
                <option value="OPPORTUNITY_PROGRESS">Opportunity Progressed</option>
                <option value="SERVICE_RESOLVED">Service Request Resolved</option>
                <option value="SERVICE_ESCALATED">Service Case Escalated</option>
                <option value="DOCUMENT_REQUESTED">Regulatory Documents Requested</option>
                <option value="ONBOARDING_PROGRESS">Onboarding Progressed</option>
                <option value="COMMITMENT_MADE">Commitment Agreed</option>
                <option value="CUSTOMER_REQUEST">Customer Request Logged</option>
                <option value="NO_ACTION_REQUIRED">No Action Required / Informational</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Client Sentiment *
              </label>
              <select
                id="select-interaction-sentiment"
                value={sentiment}
                onChange={(e) => setSentiment(e.target.value as InteractionSentiment)}
                className="w-full p-2 bg-white border border-slate-300 rounded focus:ring-1 focus:ring-slate-900"
              >
                <option value="POSITIVE">Positive / Highly Satisfied</option>
                <option value="NEUTRAL">Neutral / Routine</option>
                <option value="CONCERNED">Concerned / High Scrutiny</option>
                <option value="ESCALATED">Escalated / Dissatisfied</option>
              </select>
            </div>
          </div>

          {/* Participants */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-slate-600" />
                <span className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
                  Meeting Participants ({participants.length})
                </span>
              </div>
              <button
                type="button"
                id="btn-add-participant"
                onClick={handleAddParticipant}
                className="text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1 text-[11px]"
              >
                <Plus className="w-3 h-3" /> Add Attendee
              </button>
            </div>

            <div className="space-y-1.5">
              {participants.map((p, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    value={p.type}
                    onChange={(e) => handleUpdateParticipant(idx, 'type', e.target.value)}
                    className="w-28 p-1.5 bg-white border border-slate-300 rounded text-[11px]"
                  >
                    <option value="CUSTOMER">Customer</option>
                    <option value="RM">Relationship Mgr</option>
                    <option value="SPECIALIST">Specialist</option>
                    <option value="OTHER">Other</option>
                  </select>
                  <input
                    type="text"
                    placeholder="Full Name"
                    value={p.name}
                    onChange={(e) => handleUpdateParticipant(idx, 'name', e.target.value)}
                    className="flex-1 p-1.5 bg-white border border-slate-300 rounded text-[11px]"
                  />
                  <input
                    type="text"
                    placeholder="Role / Title"
                    value={p.role || ''}
                    onChange={(e) => handleUpdateParticipant(idx, 'role', e.target.value)}
                    className="w-36 p-1.5 bg-white border border-slate-300 rounded text-[11px]"
                  />
                  {participants.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveParticipant(idx)}
                      className="p-1 text-slate-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Follow-up Action & Task Creation */}
          <div className="p-3 bg-sky-50/70 border border-sky-200 rounded-lg space-y-3">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  id="checkbox-followup-required"
                  checked={followupRequired}
                  onChange={(e) => setFollowupRequired(e.target.checked)}
                  className="rounded text-sky-600 focus:ring-sky-500 w-4 h-4"
                />
                <span className="font-semibold text-slate-900">Follow-up Action Required</span>
              </label>
              {followupRequired && (
                <span className="text-[10px] text-sky-800 font-medium bg-sky-100 px-2 py-0.5 rounded">
                  Will create task in Officer Tasks Module
                </span>
              )}
            </div>

            {followupRequired && (
              <div className="space-y-2 pt-1 border-t border-sky-100">
                <div>
                  <label className="block text-[11px] font-medium text-slate-700 mb-1">
                    Specific Follow-up Task / Action *
                  </label>
                  <input
                    id="input-followup-action"
                    type="text"
                    placeholder="e.g., Deliver amended Sanction Letter with reduced margin to CFO"
                    value={followupAction}
                    onChange={(e) => setFollowupAction(e.target.value)}
                    className="w-full p-2 bg-white border border-slate-300 rounded"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">Due Date</label>
                    <input
                      id="input-followup-date"
                      type="date"
                      value={followupDate}
                      onChange={(e) => setFollowupDate(e.target.value)}
                      className="w-full p-2 bg-white border border-slate-300 rounded"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-medium text-slate-700 mb-1">Priority</label>
                    <select
                      id="select-followup-priority"
                      value={followupPriority}
                      onChange={(e) => setFollowupPriority(e.target.value as any)}
                      className="w-full p-2 bg-white border border-slate-300 rounded"
                    >
                      <option value="LOW">Low</option>
                      <option value="MEDIUM">Medium</option>
                      <option value="HIGH">High Priority</option>
                      <option value="URGENT">Urgent / Critical</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Commitments Manager */}
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <CheckSquare className="w-3.5 h-3.5 text-slate-600" />
                <span className="font-semibold text-slate-800 uppercase tracking-wider text-[11px]">
                  Interaction Commitments ({commitments.length})
                </span>
              </div>
              <button
                type="button"
                id="btn-add-commitment"
                onClick={handleAddCommitment}
                className="text-sky-600 hover:text-sky-800 font-semibold flex items-center gap-1 text-[11px]"
              >
                <Plus className="w-3 h-3" /> Add Commitment
              </button>
            </div>

            {commitments.length === 0 ? (
              <p className="text-[11px] text-slate-400 italic">No formal commitments added.</p>
            ) : (
              <div className="space-y-2">
                {commitments.map((c, idx) => (
                  <div key={idx} className="p-2 bg-white border border-slate-200 rounded space-y-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <select
                        value={c.commitmentType}
                        onChange={(e) => {
                          const upd = [...commitments];
                          upd[idx].commitmentType = e.target.value as any;
                          setCommitments(upd);
                        }}
                        className="p-1 bg-slate-100 border border-slate-300 rounded text-[10px] font-semibold"
                      >
                        <option value="RM_COMMITMENT">RM Commitment</option>
                        <option value="CUSTOMER_COMMITMENT">Customer Commitment</option>
                      </select>
                      <input
                        type="date"
                        value={c.dueDate}
                        onChange={(e) => {
                          const upd = [...commitments];
                          upd[idx].dueDate = e.target.value;
                          setCommitments(upd);
                        }}
                        className="p-1 bg-white border border-slate-300 rounded text-[10px]"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveCommitment(idx)}
                        className="text-slate-400 hover:text-rose-600 p-0.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <input
                      type="text"
                      placeholder="Commitment description (e.g., Provide audited FY25 P&L by Friday)..."
                      value={c.description}
                      onChange={(e) => {
                        const upd = [...commitments];
                        upd[idx].description = e.target.value;
                        setCommitments(upd);
                      }}
                      className="w-full p-1.5 bg-white border border-slate-300 rounded text-[11px]"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Link to Deal / Opportunity or Case */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Link to Opportunity
              </label>
              <select
                id="select-linked-opportunity"
                value={linkedOpportunityId}
                onChange={(e) => setLinkedOpportunityId(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded"
              >
                <option value="">None / Not Linked</option>
                {customerOpps.map((opp) => (
                  <option key={opp.id} value={opp.id}>
                    Deal #{opp.id} - {opp.title}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Link to Service Case
              </label>
              <select
                id="select-linked-case"
                value={linkedCaseId}
                onChange={(e) => setLinkedCaseId(e.target.value)}
                className="w-full p-2 bg-white border border-slate-300 rounded"
              >
                <option value="">None / Not Linked</option>
                {customerCases.map((cs) => (
                  <option key={cs.id} value={cs.id}>
                    Case #{cs.id} - {cs.subject}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </form>

        {/* Footer Actions */}
        <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            id="btn-cancel-record-interaction"
            onClick={onClose}
            className="px-4 py-2 border border-slate-300 text-slate-700 rounded-md font-medium hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            id="btn-submit-record-interaction"
            onClick={handleSubmit}
            disabled={submitting}
            className="px-5 py-2 bg-slate-900 text-white rounded-md font-medium hover:bg-slate-800 disabled:opacity-50 flex items-center gap-2 transition-colors shadow-xs"
          >
            {submitting ? 'Recording Touchpoint...' : 'Confirm & Save Interaction'}
          </button>
        </div>
      </div>
    </div>
  );
};
