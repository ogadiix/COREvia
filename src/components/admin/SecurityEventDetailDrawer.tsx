/**
 * COREvia Phase 39: Security Event Detail Drawer
 * Deep inspection drawer for authorization failures, IDOR attempts, and tamper alarms.
 * Invariant: Never renders passwords, tokens, or private secrets.
 */

import React from 'react';
import { X, ShieldAlert, AlertTriangle, Clock, Server, CheckCircle2, Copy } from 'lucide-react';
import { SecurityEventDTO } from '../../types/admin.types.ts';

interface SecurityEventDetailDrawerProps {
  event: SecurityEventDTO | null;
  onClose: () => void;
}

export const SecurityEventDetailDrawer: React.FC<SecurityEventDetailDrawerProps> = ({
  event,
  onClose,
}) => {
  if (!event) return null;

  const severityBadge = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/30';
      case 'HIGH':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'MEDIUM':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
    }
  };

  const outcomeBadge = (outcome: string) => {
    switch (outcome) {
      case 'BLOCKED':
        return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
      case 'DENIED':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'CHALLENGED':
        return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20';
      default:
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm flex justify-end animate-fadeIn">
      <div className="w-full max-w-xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold text-slate-100">{event.eventId}</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${severityBadge(event.severity)}`}>
                  {event.severity}
                </span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${outcomeBadge(event.outcome)}`}>
                  {event.outcome}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">{event.type}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5 text-xs">
          {/* Overview Grid */}
          <div className="grid grid-cols-2 gap-3 bg-slate-800/40 p-4 rounded-xl border border-slate-700/60">
            <div>
              <span className="text-slate-400 text-[11px] block">Actor</span>
              <span className="font-semibold text-slate-200 mt-0.5 block">{event.actorName}</span>
              <span className="font-mono text-[10px] text-slate-400">ID: {event.actorId}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Source IP</span>
              <span className="font-mono text-slate-200 mt-0.5 block">{event.sourceIp}</span>
              <span className="text-[10px] text-slate-400">{event.source}</span>
            </div>
            <div className="col-span-2 pt-2 border-t border-slate-700/40">
              <span className="text-slate-400 text-[11px] block">Target Resource</span>
              <span className="font-mono text-slate-200 break-all bg-slate-900/80 px-2 py-1 rounded mt-1 block border border-slate-800">
                {event.targetResource}
              </span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Request ID</span>
              <span className="font-mono text-[10px] text-slate-300 mt-0.5 block">{event.requestId}</span>
            </div>
            <div>
              <span className="text-slate-400 text-[11px] block">Timestamp</span>
              <span className="font-mono text-[10px] text-slate-300 mt-0.5 block">
                {new Date(event.timestamp).toLocaleString()}
              </span>
            </div>
          </div>

          {/* Evidence Metadata (Safe & Sanitized) */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-slate-200 text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                Sanitized Evidence Metadata
              </h4>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                Data Minimization Enforced
              </span>
            </div>
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 overflow-x-auto">
              <pre className="font-mono text-[11px] text-slate-300 whitespace-pre-wrap leading-relaxed">
                {JSON.stringify(event.evidenceMetadata, null, 2)}
              </pre>
            </div>
          </div>

          {/* Security Guard Assessment */}
          <div className="bg-blue-950/20 border border-blue-500/20 rounded-lg p-3.5 space-y-1.5">
            <span className="text-[11px] font-semibold text-blue-300 uppercase tracking-wider block">
              Automated Guard Action
            </span>
            <p className="text-slate-300 text-xs leading-relaxed">
              The access attempt was intercepted by COREvia Authorization Guard before execution.
              Principal was not granted access to the underlying banking entity.
              Incident classified under institutional regulatory surveillance.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/70 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-lg transition"
          >
            Close Detail
          </button>
        </div>
      </div>
    </div>
  );
};
