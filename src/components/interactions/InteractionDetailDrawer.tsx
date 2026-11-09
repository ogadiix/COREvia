import React, { useState, useEffect } from 'react';
import {
  X,
  Phone,
  Mail,
  Video,
  Users,
  Building2,
  MessageSquare,
  Clock,
  Calendar,
  User,
  CheckCircle2,
  Circle,
  AlertCircle,
  Link as LinkIcon,
  CheckSquare,
  ExternalLink,
  Trash2,
  Printer,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { InteractionItem, InteractionCommitment } from '../../types';

interface InteractionDetailDrawerProps {
  interaction: InteractionItem | null;
  onClose: () => void;
  onCustomerSelect?: (customerId: number) => void;
  onCommitmentUpdated?: () => void;
  onDeleted?: () => void;
}

export const InteractionDetailDrawer: React.FC<InteractionDetailDrawerProps> = ({
  interaction,
  onClose,
  onCustomerSelect,
  onCommitmentUpdated,
  onDeleted,
}) => {
  const [updatingCommitmentId, setUpdatingCommitmentId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!interaction) return null;

  const channelIcons: Record<string, React.ReactNode> = {
    PHONE: <Phone className="w-4 h-4 text-blue-600" />,
    IN_PERSON: <Users className="w-4 h-4 text-emerald-600" />,
    VIDEO: <Video className="w-4 h-4 text-indigo-600" />,
    EMAIL: <Mail className="w-4 h-4 text-slate-600" />,
    BRANCH: <Building2 className="w-4 h-4 text-amber-600" />,
    CHAT: <MessageSquare className="w-4 h-4 text-purple-600" />,
    MESSAGE: <MessageSquare className="w-4 h-4 text-emerald-600" />,
    PORTAL: <Building2 className="w-4 h-4 text-cyan-600" />,
  };

  const outcomeBadgeColors: Record<string, string> = {
    FOLLOW_UP_REQUIRED: 'bg-amber-50 text-amber-800 border-amber-200',
    OPPORTUNITY_IDENTIFIED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    OPPORTUNITY_PROGRESS: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    SERVICE_RESOLVED: 'bg-blue-50 text-blue-800 border-blue-200',
    SERVICE_ESCALATED: 'bg-rose-50 text-rose-800 border-rose-200',
    DOCUMENT_REQUESTED: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    ONBOARDING_PROGRESS: 'bg-purple-50 text-purple-800 border-purple-200',
    COMMITMENT_MADE: 'bg-teal-50 text-teal-800 border-teal-200',
    CUSTOMER_REQUEST: 'bg-sky-50 text-sky-800 border-sky-200',
    NO_ACTION_REQUIRED: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  const sentimentBadgeColors: Record<string, string> = {
    POSITIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    NEUTRAL: 'bg-slate-50 text-slate-700 border-slate-200',
    CONCERNED: 'bg-amber-50 text-amber-700 border-amber-200',
    ESCALATED: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const handleToggleCommitment = async (c: InteractionCommitment) => {
    setUpdatingCommitmentId(c.id);
    const newStatus = c.status === 'COMPLETED' ? 'PENDING' : 'COMPLETED';
    try {
      const res = await fetch(`/api/interactions/commitments/${c.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        c.status = newStatus;
        if (onCommitmentUpdated) onCommitmentUpdated();
      }
    } catch (err) {
      console.error('Failed to update commitment:', err);
    } finally {
      setUpdatingCommitmentId(null);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/interactions/${interaction.id}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (res.ok) {
        if (onDeleted) onDeleted();
        onClose();
      }
    } catch (err) {
      console.error('Failed to delete interaction:', err);
    } finally {
      setDeleting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-2xs z-40 transition-opacity motion-fade-in"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        id="interaction-detail-drawer"
        className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white dark:bg-[#162638] border-l border-[#DCE3EA] dark:border-[#33485D] shadow-2xl flex flex-col text-xs motion-drawer motion-slide-in-right"
      >
      {/* Header */}
      <div className="px-6 py-4 bg-[#142C45] dark:bg-[#101C2A] text-white flex items-center justify-between border-b border-[#DCE3EA]/10 dark:border-[#33485D]">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-[#168C83]/20 text-[#168C83] font-mono text-[11px] font-bold rounded border border-[#168C83]/40">
            {interaction.interactionReference}
          </span>
          <span className="text-[11px] text-slate-300">Touchpoint Dossier</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="btn-print-interaction"
            onClick={handlePrint}
            title="Print Record"
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-[#1C3045] transition-colors"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            id="btn-close-interaction-detail"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-[#1C3045] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Customer Header Card */}
        <div className="p-3.5 bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-[#142C45] dark:text-[#E8EEF5]">{interaction.customerName || 'Customer'}</span>
              <span className="text-[10px] font-mono text-[#5D6B7B] dark:text-[#8194A8] bg-[#EDF1F5] dark:bg-[#162638] px-1.5 py-0.5 rounded border border-[#DCE3EA] dark:border-[#33485D]">
                {interaction.customerCode}
              </span>
            </div>
            <span className="text-[11px] text-[#5D6B7B] dark:text-[#8194A8]">
              Relationship Owner: {interaction.ownerName || 'Relationship Manager'}
            </span>
          </div>

          {onCustomerSelect && (
            <button
              id="btn-drawer-view-customer-360"
              onClick={() => onCustomerSelect(interaction.customerId)}
              className="px-2.5 py-1 text-[11px] font-semibold text-[#142C45] dark:text-[#E8EEF5] bg-white dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded hover:bg-[#EDF1F5] dark:hover:bg-[#1C3045] flex items-center gap-1 shadow-2xs"
            >
              Customer 360 <ExternalLink className="w-3 h-3 text-[#168C83]" />
            </button>
          )}
        </div>

        {/* Badges & Meta */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-2 bg-white dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded flex items-center gap-2">
            {channelIcons[interaction.channel] || <Phone className="w-4 h-4 text-slate-500" />}
            <div>
              <span className="text-[9px] uppercase font-semibold text-[#8793A1] block">Channel</span>
              <span className="font-bold text-[#142C45] dark:text-[#E8EEF5] truncate block">
                {interaction.channel.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="p-2 bg-white dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded">
            <span className="text-[9px] uppercase font-semibold text-[#8793A1] block">Type</span>
            <span className="font-bold text-[#142C45] dark:text-[#E8EEF5] truncate block">
              {interaction.interactionType.replace('_', ' ')}
            </span>
          </div>

          <div className="p-2 bg-white dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded">
            <span className="text-[9px] uppercase font-semibold text-[#8793A1] block">Duration</span>
            <span className="font-bold text-[#142C45] dark:text-[#E8EEF5]">{interaction.duration ? `${interaction.duration}m` : '—'}</span>
          </div>

          <div className="p-2 bg-white dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded">
            <span className="text-[9px] uppercase font-semibold text-[#8793A1] block">Sentiment</span>
            <span
              className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                sentimentBadgeColors[interaction.sentiment] || 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
              }`}
            >
              {interaction.sentiment}
            </span>
          </div>
        </div>

        {/* Date & Time */}
        <div className="flex items-center gap-2 text-[#5D6B7B] dark:text-[#8194A8] text-[11px] px-1 font-mono">
          <Calendar className="w-3.5 h-3.5 text-[#8793A1]" />
          <span>
            {new Date(interaction.timestamp).toLocaleString('en-IN', {
              weekday: 'short',
              day: 'numeric',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Subject & Summary */}
        <div className="space-y-2">
          <h3 className="text-base font-bold text-[#142C45] dark:text-[#E8EEF5] leading-snug">{interaction.subject}</h3>
          <div className="p-3.5 bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg text-[#273444] dark:text-[#A9BACB] leading-relaxed whitespace-pre-line">
            {interaction.summary}
          </div>
        </div>

        {/* Outcome Badge */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-[#5D6B7B] dark:text-[#8194A8]">Outcome:</span>
          <span
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${
              outcomeBadgeColors[interaction.outcome] || 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-200'
            }`}
          >
            {interaction.outcome.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Follow-up Section */}
        {interaction.followupRequired && (
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/30 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-amber-800 dark:text-amber-300 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <span>Actionable Follow-up</span>
              </div>
              {interaction.followupPriority && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-800 dark:text-amber-300 border border-amber-500/30">
                  {interaction.followupPriority} Priority
                </span>
              )}
            </div>

            <p className="text-amber-900 dark:text-amber-200 font-medium">{interaction.followupAction || 'Follow-up required'}</p>

            <div className="flex items-center justify-between text-[11px] text-amber-800 dark:text-amber-300 pt-1 border-t border-amber-500/20">
              <div className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                <span>
                  Target Date:{' '}
                  {interaction.followupDate
                    ? new Date(interaction.followupDate).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })
                    : 'Not specified'}
                </span>
              </div>
              {interaction.followupTaskId && (
                <span className="font-mono text-[10px] bg-amber-500/20 px-1.5 py-0.5 rounded border border-amber-500/40 text-amber-900 dark:text-amber-200">
                  Task #{interaction.followupTaskId}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Commitments Checklist */}
        <div className="p-3.5 bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[#142C45] dark:text-[#E8EEF5] font-bold uppercase tracking-wider text-[11px]">
              <CheckSquare className="w-3.5 h-3.5 text-[#168C83]" />
              <span>Commitments & Agreed Actions ({interaction.commitments?.length || 0})</span>
            </div>
          </div>

          {!interaction.commitments || interaction.commitments.length === 0 ? (
            <p className="text-[#8793A1] italic text-[11px]">No formal commitments recorded for this touchpoint.</p>
          ) : (
            <div className="space-y-2">
              {interaction.commitments.map((c) => {
                const isCompleted = c.status === 'COMPLETED';
                const isRM = c.commitmentType === 'RM_COMMITMENT';
                return (
                  <div
                    key={c.id}
                    className={`p-2.5 rounded border transition-colors flex items-start gap-2.5 ${
                      isCompleted
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-[#8793A1]'
                        : 'bg-white dark:bg-[#162638] border-[#DCE3EA] dark:border-[#33485D] text-[#273444] dark:text-[#E8EEF5]'
                    }`}
                  >
                    <button
                      type="button"
                      disabled={updatingCommitmentId === c.id}
                      onClick={() => handleToggleCommitment(c)}
                      className="mt-0.5 text-[#8793A1] hover:text-[#168C83] focus:outline-hidden"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-[#168C83]" />
                      ) : (
                        <Circle className="w-4 h-4 text-[#8793A1]" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            isRM ? 'bg-[#168C83]/20 text-[#168C83]' : 'bg-purple-500/20 text-purple-700 dark:text-purple-400'
                          }`}
                        >
                          {isRM ? 'Bank RM' : 'Customer'}
                        </span>
                        {c.ownerName && <span className="text-[10px] text-[#5D6B7B] dark:text-[#8194A8] font-medium">({c.ownerName})</span>}
                      </div>
                      <p className={`text-xs ${isCompleted ? 'line-through text-[#8793A1]' : 'text-[#273444] dark:text-[#E8EEF5]'}`}>
                        {c.description}
                      </p>
                      {c.dueDate && (
                        <div className="text-[10px] text-[#8793A1] font-mono mt-1">
                          Due:{' '}
                          {new Date(c.dueDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Meeting Participants */}
        <div className="p-3.5 bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg space-y-2">
          <div className="flex items-center gap-1.5 text-[#142C45] dark:text-[#E8EEF5] font-bold uppercase tracking-wider text-[11px]">
            <Users className="w-3.5 h-3.5 text-[#168C83]" />
            <span>Participants ({interaction.participants?.length || 0})</span>
          </div>

          <div className="divide-y divide-[#DCE3EA] dark:divide-[#33485D]">
            {(interaction.participants || []).map((p, idx) => (
              <div key={idx} className="py-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-[#EDF1F5] dark:bg-[#162638] text-[#142C45] dark:text-[#E8EEF5] flex items-center justify-center font-bold text-[10px]">
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-[#142C45] dark:text-[#E8EEF5] block">{p.name}</span>
                    <span className="text-[10px] text-[#5D6B7B] dark:text-[#8194A8] block">{p.role || p.type}</span>
                  </div>
                </div>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    p.type === 'CUSTOMER'
                      ? 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20'
                      : p.type === 'RM'
                      ? 'bg-[#168C83]/10 text-[#168C83] border border-[#168C83]/30'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                  }`}
                >
                  {p.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Linked Entities */}
        <div className="p-3.5 bg-[#F4F6F8] dark:bg-[#101C2A] border border-[#DCE3EA] dark:border-[#33485D] rounded-lg space-y-2">
          <div className="flex items-center gap-1.5 text-[#142C45] dark:text-[#E8EEF5] font-bold uppercase tracking-wider text-[11px]">
            <LinkIcon className="w-3.5 h-3.5 text-[#168C83]" />
            <span>Cross-Entity Linkages</span>
          </div>

          {interaction.links && interaction.links.length > 0 ? (
            <div className="space-y-1.5">
              {interaction.links.map((link) => (
                <div
                  key={link.id}
                  className="p-2 bg-white dark:bg-[#162638] border border-[#DCE3EA] dark:border-[#33485D] rounded flex items-center justify-between"
                >
                  <div>
                    <span className="text-[9px] font-bold uppercase text-[#8793A1] block">{link.linkType}</span>
                    <span className="font-semibold text-[#142C45] dark:text-[#E8EEF5] text-[11px]">{link.title || `Entity #${link.linkId}`}</span>
                  </div>
                  <span className="text-[10px] text-[#8793A1] font-mono">#{link.linkId}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#8793A1] italic text-[11px]">No external modules explicitly linked.</p>
          )}
        </div>

        {/* Audit Footer */}
        <div className="pt-2 border-t border-[#DCE3EA] dark:border-[#33485D] text-[10px] text-[#8793A1] flex items-center justify-between font-mono">
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-[#168C83]" />
            <span>Regulatory Record: Immutable Audit Log Active</span>
          </div>
          <span>ID #{interaction.id}</span>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="px-6 py-3 bg-[#F4F6F8] dark:bg-[#101C2A] border-t border-[#DCE3EA] dark:border-[#33485D] flex items-center justify-between">
        {showConfirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-red-600 dark:text-red-400 font-bold text-[11px]">Confirm soft deletion?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-2.5 py-1 bg-red-600 text-white rounded font-medium hover:bg-red-700 text-[11px]"
            >
              {deleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button
              onClick={() => setShowConfirmDelete(false)}
              className="px-2 py-1 bg-[#EDF1F5] dark:bg-[#162638] text-[#5D6B7B] dark:text-[#A9BACB] rounded font-medium text-[11px]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            id="btn-delete-interaction"
            onClick={() => setShowConfirmDelete(true)}
            className="text-[#8793A1] hover:text-red-600 font-medium flex items-center gap-1 text-[11px] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove Record
          </button>
        )}

        <button
          type="button"
          id="btn-close-drawer-bottom"
          onClick={onClose}
          className="px-4 py-1.5 bg-[#142C45] dark:bg-[#168C83] text-white rounded font-medium hover:bg-[#192B3D] dark:hover:bg-[#1B9D92] transition-colors shadow-2xs"
        >
          Done
        </button>
      </div>
    </div>
    </>
  );
};
