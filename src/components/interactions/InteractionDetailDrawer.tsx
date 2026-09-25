import React, { useState } from 'react';
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
    <div
      id="interaction-detail-drawer"
      className="fixed inset-y-0 right-0 z-50 w-full max-w-xl bg-white border-l border-slate-200 shadow-2xl flex flex-col text-xs"
    >
      {/* Header */}
      <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 bg-slate-800 text-sky-400 font-mono text-[11px] font-bold rounded border border-slate-700">
            {interaction.interactionReference}
          </span>
          <span className="text-[11px] text-slate-300">Touchpoint Dossier</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            id="btn-print-interaction"
            onClick={handlePrint}
            title="Print Record"
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <Printer className="w-4 h-4" />
          </button>
          <button
            id="btn-close-interaction-detail"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6 space-y-5">
        {/* Customer Header Card */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-slate-900">{interaction.customerName || 'Customer'}</span>
              <span className="text-[10px] font-mono text-slate-500 bg-slate-200 px-1.5 py-0.5 rounded">
                {interaction.customerCode}
              </span>
            </div>
            <span className="text-[11px] text-slate-500">
              Relationship Owner: {interaction.ownerName || 'Relationship Manager'}
            </span>
          </div>

          {onCustomerSelect && (
            <button
              id="btn-drawer-view-customer-360"
              onClick={() => onCustomerSelect(interaction.customerId)}
              className="px-2.5 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-300 rounded hover:bg-slate-100 flex items-center gap-1 shadow-2xs"
            >
              Customer 360 <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Badges & Meta */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          <div className="p-2 bg-white border border-slate-200 rounded flex items-center gap-2">
            {channelIcons[interaction.channel] || <Phone className="w-4 h-4 text-slate-500" />}
            <div>
              <span className="text-[9px] uppercase font-semibold text-slate-400 block">Channel</span>
              <span className="font-bold text-slate-800 truncate block">
                {interaction.channel.replace('_', ' ')}
              </span>
            </div>
          </div>

          <div className="p-2 bg-white border border-slate-200 rounded">
            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Type</span>
            <span className="font-bold text-slate-800 truncate block">
              {interaction.interactionType.replace('_', ' ')}
            </span>
          </div>

          <div className="p-2 bg-white border border-slate-200 rounded">
            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Duration</span>
            <span className="font-bold text-slate-800">{interaction.duration ? `${interaction.duration}m` : '—'}</span>
          </div>

          <div className="p-2 bg-white border border-slate-200 rounded">
            <span className="text-[9px] uppercase font-semibold text-slate-400 block">Sentiment</span>
            <span
              className={`inline-block px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                sentimentBadgeColors[interaction.sentiment] || 'bg-slate-100 text-slate-700'
              }`}
            >
              {interaction.sentiment}
            </span>
          </div>
        </div>

        {/* Date & Time */}
        <div className="flex items-center gap-2 text-slate-500 text-[11px] px-1">
          <Calendar className="w-3.5 h-3.5" />
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
          <h3 className="text-base font-bold text-slate-900 leading-snug">{interaction.subject}</h3>
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 leading-relaxed whitespace-pre-line">
            {interaction.summary}
          </div>
        </div>

        {/* Outcome Badge */}
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-500">Outcome:</span>
          <span
            className={`px-2.5 py-1 rounded-md text-[11px] font-bold border ${
              outcomeBadgeColors[interaction.outcome] || 'bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            {interaction.outcome.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Follow-up Section */}
        {interaction.followupRequired && (
          <div className="p-3.5 bg-amber-50/70 border border-amber-200 rounded-lg space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-amber-900 font-bold">
                <AlertCircle className="w-4 h-4 text-amber-600" />
                <span>Actionable Follow-up</span>
              </div>
              {interaction.followupPriority && (
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-200 text-amber-900">
                  {interaction.followupPriority} Priority
                </span>
              )}
            </div>

            <p className="text-amber-950 font-medium">{interaction.followupAction || 'Follow-up required'}</p>

            <div className="flex items-center justify-between text-[11px] text-amber-800 pt-1 border-t border-amber-200/60">
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
                <span className="font-mono text-[10px] bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300">
                  Task #{interaction.followupTaskId}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Commitments Checklist */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-slate-800 font-bold uppercase tracking-wider text-[11px]">
              <CheckSquare className="w-3.5 h-3.5 text-sky-600" />
              <span>Commitments & Agreed Actions ({interaction.commitments?.length || 0})</span>
            </div>
          </div>

          {!interaction.commitments || interaction.commitments.length === 0 ? (
            <p className="text-slate-400 italic text-[11px]">No formal commitments recorded for this touchpoint.</p>
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
                        ? 'bg-emerald-50/50 border-emerald-200 text-slate-600'
                        : 'bg-white border-slate-200 text-slate-900'
                    }`}
                  >
                    <button
                      type="button"
                      disabled={updatingCommitmentId === c.id}
                      onClick={() => handleToggleCommitment(c)}
                      className="mt-0.5 text-slate-400 hover:text-emerald-600 focus:outline-hidden"
                    >
                      {isCompleted ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-slate-300" />
                      )}
                    </button>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase ${
                            isRM ? 'bg-sky-100 text-sky-800' : 'bg-purple-100 text-purple-800'
                          }`}
                        >
                          {isRM ? 'Bank RM' : 'Customer'}
                        </span>
                        {c.ownerName && <span className="text-[10px] text-slate-500 font-medium">({c.ownerName})</span>}
                      </div>
                      <p className={`text-xs ${isCompleted ? 'line-through text-slate-400' : 'text-slate-800'}`}>
                        {c.description}
                      </p>
                      {c.dueDate && (
                        <div className="text-[10px] text-slate-400 mt-1">
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
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <div className="flex items-center gap-1.5 text-slate-800 font-bold uppercase tracking-wider text-[11px]">
            <Users className="w-3.5 h-3.5 text-slate-600" />
            <span>Participants ({interaction.participants?.length || 0})</span>
          </div>

          <div className="divide-y divide-slate-200/70">
            {(interaction.participants || []).map((p, idx) => (
              <div key={idx} className="py-1.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                    {p.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-900 block">{p.name}</span>
                    <span className="text-[10px] text-slate-500 block">{p.role || p.type}</span>
                  </div>
                </div>
                <span
                  className={`text-[9px] px-1.5 py-0.5 rounded font-bold uppercase ${
                    p.type === 'CUSTOMER'
                      ? 'bg-purple-50 text-purple-700 border border-purple-200'
                      : p.type === 'RM'
                      ? 'bg-sky-50 text-sky-700 border border-sky-200'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  {p.type}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Linked Entities */}
        <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
          <div className="flex items-center gap-1.5 text-slate-800 font-bold uppercase tracking-wider text-[11px]">
            <LinkIcon className="w-3.5 h-3.5 text-slate-600" />
            <span>Cross-Entity Linkages</span>
          </div>

          {interaction.links && interaction.links.length > 0 ? (
            <div className="space-y-1.5">
              {interaction.links.map((link) => (
                <div
                  key={link.id}
                  className="p-2 bg-white border border-slate-200 rounded flex items-center justify-between"
                >
                  <div>
                    <span className="text-[9px] font-bold uppercase text-slate-400 block">{link.linkType}</span>
                    <span className="font-semibold text-slate-800 text-[11px]">{link.title || `Entity #${link.linkId}`}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-mono">#{link.linkId}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-slate-400 italic text-[11px]">No external modules explicitly linked.</p>
          )}
        </div>

        {/* Audit Footer */}
        <div className="pt-2 border-t border-slate-200 text-[10px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Shield className="w-3 h-3 text-emerald-600" />
            <span>Regulatory Record: Immutable Audit Log Active</span>
          </div>
          <span>ID #{interaction.id}</span>
        </div>
      </div>

      {/* Footer Controls */}
      <div className="px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        {showConfirmDelete ? (
          <div className="flex items-center gap-2">
            <span className="text-rose-700 font-bold text-[11px]">Confirm soft deletion?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="px-2.5 py-1 bg-rose-600 text-white rounded font-medium hover:bg-rose-700 text-[11px]"
            >
              {deleting ? 'Deleting...' : 'Yes, Delete'}
            </button>
            <button
              onClick={() => setShowConfirmDelete(false)}
              className="px-2 py-1 bg-slate-200 text-slate-700 rounded font-medium text-[11px]"
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            type="button"
            id="btn-delete-interaction"
            onClick={() => setShowConfirmDelete(true)}
            className="text-slate-400 hover:text-rose-600 font-medium flex items-center gap-1 text-[11px] transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" /> Remove Record
          </button>
        )}

        <button
          type="button"
          id="btn-close-drawer-bottom"
          onClick={onClose}
          className="px-4 py-1.5 bg-slate-900 text-white rounded font-medium hover:bg-slate-800 transition-colors shadow-2xs"
        >
          Done
        </button>
      </div>
    </div>
  );
};
