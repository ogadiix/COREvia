import React, { useState } from 'react';
import { Drawer } from '../common/Drawer';
import { Button } from '../common/Button';
import { useToast } from '../common/Toast';
import { bankingApi } from '../../lib/api';
import { MessageSquare, Calendar, User, CheckSquare } from 'lucide-react';

interface LogInteractionDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  customerId: number;
  customerName: string;
  cifNumber: string;
  onInteractionLogged: () => void;
}

export const LogInteractionDrawer: React.FC<LogInteractionDrawerProps> = ({
  isOpen,
  onClose,
  customerId,
  customerName,
  cifNumber,
  onInteractionLogged,
}) => {
  const toast = useToast();
  const [channel, setChannel] = useState<string>('BRANCH_VISIT');
  const [subject, setSubject] = useState<string>('');
  const [summary, setSummary] = useState<string>('');
  const [outcome, setOutcome] = useState<string>('Client requirements noted. Actions captured in CRM.');
  const [sentiment, setSentiment] = useState<string>('POSITIVE');
  const [followupRequired, setFollowupRequired] = useState<boolean>(false);
  const [followupAction, setFollowupAction] = useState<string>('');
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !summary.trim()) {
      toast.error('Subject and discussion summary are mandatory.');
      return;
    }

    setSubmitting(true);
    try {
      await bankingApi.recordInteraction({
        customerId,
        channel,
        interactionType: 'RELATIONSHIP_REVIEW',
        subject: subject.trim(),
        summary: summary.trim(),
        outcome: outcome.trim(),
        sentiment,
        followupRequired,
        followupAction: followupRequired ? followupAction.trim() : undefined,
      });

      toast.success('Relationship touchpoint logged successfully.');
      // Reset form
      setSubject('');
      setSummary('');
      setOutcome('Client requirements noted. Actions captured in CRM.');
      setFollowupRequired(false);
      setFollowupAction('');
      onInteractionLogged();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to record interaction.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Drawer
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-[#168C83] dark:text-[#1B9D92]" />
          <span>Log Client Touchpoint</span>
        </div>
      }
      subtitle={`Customer: ${customerName} · CIF: ${cifNumber}`}
      referenceId={cifNumber}
      size="md"
      footerActions={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            disabled={submitting || !subject.trim() || !summary.trim()}
          >
            {submitting ? 'Recording Touchpoint...' : 'Save Interaction'}
          </Button>
        </div>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {/* Channel Selection */}
        <div>
          <label className="block text-slate-700 dark:text-[#E8EEF5] font-semibold mb-1">
            Engagement Channel
          </label>
          <select
            value={channel}
            onChange={(e) => setChannel(e.target.value)}
            className="w-full p-2 bg-slate-50 dark:bg-[#101C2A] border border-slate-300 dark:border-[#33485D] rounded text-slate-900 dark:text-[#E8EEF5] focus:outline-none focus:ring-1 focus:ring-[#168C83]"
          >
            <option value="BRANCH_VISIT">Branch Visit (In-Person)</option>
            <option value="PHONE_CALL">Telephone Consultation</option>
            <option value="MEETING">Client Site / Executive Meeting</option>
            <option value="EMAIL">Formal Email Communication</option>
            <option value="VIDEO_CONFERENCE">Secure Video Conference</option>
          </select>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-slate-700 dark:text-[#E8EEF5] font-semibold mb-1">
            Meeting / Call Subject <span className="text-rose-500">*</span>
          </label>
          <input
            type="text"
            placeholder="e.g. Q1 Working Capital Facility Review & Hedging Strategy"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="w-full p-2 bg-slate-50 dark:bg-[#101C2A] border border-slate-300 dark:border-[#33485D] rounded text-slate-900 dark:text-[#E8EEF5] focus:outline-none focus:ring-1 focus:ring-[#168C83]"
            required
          />
        </div>

        {/* Summary */}
        <div>
          <label className="block text-slate-700 dark:text-[#E8EEF5] font-semibold mb-1">
            Discussion Summary & Key Points <span className="text-rose-500">*</span>
          </label>
          <textarea
            rows={4}
            placeholder="Document discussion details, customer intent, commercial proposals discussed, risk observations..."
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            className="w-full p-2 bg-slate-50 dark:bg-[#101C2A] border border-slate-300 dark:border-[#33485D] rounded text-slate-900 dark:text-[#E8EEF5] focus:outline-none focus:ring-1 focus:ring-[#168C83] leading-relaxed"
            required
          />
        </div>

        {/* Outcome & Sentiment */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-slate-700 dark:text-[#E8EEF5] font-semibold mb-1">
              Customer Sentiment
            </label>
            <select
              value={sentiment}
              onChange={(e) => setSentiment(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-[#101C2A] border border-slate-300 dark:border-[#33485D] rounded text-slate-900 dark:text-[#E8EEF5] focus:outline-none focus:ring-1 focus:ring-[#168C83]"
            >
              <option value="POSITIVE">Positive / Collaborative</option>
              <option value="NEUTRAL">Neutral / Routine</option>
              <option value="CONCERNED">Concerned / Escalation Risk</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-700 dark:text-[#E8EEF5] font-semibold mb-1">
              Agreed Outcome
            </label>
            <input
              type="text"
              value={outcome}
              onChange={(e) => setOutcome(e.target.value)}
              className="w-full p-2 bg-slate-50 dark:bg-[#101C2A] border border-slate-300 dark:border-[#33485D] rounded text-slate-900 dark:text-[#E8EEF5] focus:outline-none focus:ring-1 focus:ring-[#168C83]"
            />
          </div>
        </div>

        {/* Follow-up Section */}
        <div className="p-3 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={followupRequired}
              onChange={(e) => setFollowupRequired(e.target.checked)}
              className="rounded border-slate-300 dark:border-[#33485D] text-[#168C83] focus:ring-[#168C83]"
            />
            <span className="font-semibold text-slate-800 dark:text-[#E8EEF5]">
              Mandatory RM Follow-up Required
            </span>
          </label>

          {followupRequired && (
            <div className="pt-2">
              <label className="block text-slate-600 dark:text-[#A9BACB] text-[11px] font-medium mb-1">
                Follow-up Action Details
              </label>
              <input
                type="text"
                placeholder="e.g. Issue sanctioned limit letter and schedule documentation review"
                value={followupAction}
                onChange={(e) => setFollowupAction(e.target.value)}
                className="w-full p-2 bg-white dark:bg-[#162638] border border-slate-300 dark:border-[#33485D] rounded text-slate-900 dark:text-[#E8EEF5] focus:outline-none focus:ring-1 focus:ring-[#168C83]"
              />
            </div>
          )}
        </div>
      </form>
    </Drawer>
  );
};

