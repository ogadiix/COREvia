import React, { useState, useEffect } from 'react';
import {
  BellRing,
  AlertTriangle,
  AlertCircle,
  CheckCircle2,
  Info,
  ArrowRight,
  RefreshCw,
  Check,
  User,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { bankingApi } from '../../lib/api';
import { NotificationItem, NotificationSeverity } from '../../types';

interface NotificationStreamWidgetProps {
  onOpenNotificationsDrawer?: () => void;
  onNavigateToEntity?: (url: string) => void;
}

export const NotificationStreamWidget: React.FC<NotificationStreamWidgetProps> = ({
  onOpenNotificationsDrawer,
  onNavigateToEntity,
}) => {
  const [alerts, setAlerts] = useState<NotificationItem[]>([]);
  const [summary, setSummary] = useState<{
    totalCount: number;
    unreadCount: number;
    criticalCount: number;
    warningCount: number;
  }>({
    totalCount: 0,
    unreadCount: 0,
    criticalCount: 0,
    warningCount: 0,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [actionInProgressId, setActionInProgressId] = useState<number | null>(null);

  const loadAlerts = async () => {
    setIsLoading(true);
    try {
      const [listRes, summaryRes] = await Promise.all([
        bankingApi.getNotifications({ limit: 5 }),
        bankingApi.getNotificationSummary(),
      ]);
      setAlerts(listRes.data || []);
      setSummary(summaryRes);
    } catch (err) {
      console.error('Failed to load alert stream:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAlerts();
  }, []);

  const handleAcknowledge = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    setActionInProgressId(id);
    try {
      await bankingApi.acknowledgeNotification(id);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a))
      );
      const updatedSummary = await bankingApi.getNotificationSummary();
      setSummary(updatedSummary);
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleAction = (alert: NotificationItem) => {
    if (alert.status === 'UNREAD') {
      bankingApi.markNotificationRead(alert.id).catch(() => {});
    }
    if (alert.actionUrl && onNavigateToEntity) {
      onNavigateToEntity(alert.actionUrl);
    } else if (onOpenNotificationsDrawer) {
      onOpenNotificationsDrawer();
    }
  };

  const getSeverityPill = (severity: NotificationSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300 uppercase">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
            CRITICAL
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-amber-100 text-amber-800 border border-amber-300 uppercase">
            <AlertTriangle className="w-2.5 h-2.5 text-amber-700" />
            WARNING
          </span>
        );
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300 uppercase">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />
            SUCCESS
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-sky-100 text-sky-800 border border-sky-300 uppercase">
            <Info className="w-2.5 h-2.5 text-sky-700" />
            INFO
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded p-4 shadow-2xs space-y-3">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded bg-slate-100 border border-slate-200 text-[#0f1e36]">
            <BellRing className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800 font-sans">
                Active Operational & Intelligent Alerts
              </h3>
              {summary.unreadCount > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-100 text-rose-800 font-bold border border-rose-200">
                  {summary.unreadCount} Unread
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-sans mt-0.5">
              Event-driven signals across SLA breaches, score shifts, pipeline milestones, and officer commitments.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex items-center gap-2 font-mono text-[11px] text-slate-500">
            <span className="text-rose-700 font-semibold">{summary.criticalCount} Critical</span>
            <span>&bull;</span>
            <span className="text-amber-700 font-semibold">{summary.warningCount} Warning</span>
          </div>
          {onOpenNotificationsDrawer && (
            <button
              onClick={onOpenNotificationsDrawer}
              className="text-xs font-semibold text-[#0f1e36] hover:text-blue-700 inline-flex items-center gap-1 cursor-pointer transition-colors"
            >
              <span>View All Alerts</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Alert Stream Items */}
      {isLoading ? (
        <div className="py-6 text-center text-slate-400 font-mono text-xs flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
          Loading alert stream...
        </div>
      ) : alerts.length === 0 ? (
        <div className="py-6 text-center text-slate-500 text-xs font-sans">
          No urgent alerts pending. All officer workflows and customer tickets are compliant.
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {alerts.map((alert) => {
            const isUnread = alert.status === 'UNREAD';
            const isAck = alert.status === 'ACKNOWLEDGED';

            return (
              <div
                key={alert.id}
                onClick={() => handleAction(alert)}
                className={`py-2.5 px-3 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer transition-colors ${
                  isUnread
                    ? alert.severity === 'CRITICAL'
                      ? 'bg-rose-50/50 hover:bg-rose-50'
                      : 'bg-amber-50/40 hover:bg-amber-50'
                    : 'hover:bg-slate-50'
                }`}
              >
                <div className="flex items-start gap-2.5 flex-1 min-w-0">
                  <div className="mt-0.5 shrink-0">{getSeverityPill(alert.severity)}</div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-semibold text-slate-900 font-sans truncate">
                        {alert.title}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                        {alert.category}
                      </span>
                      {isAck && (
                        <span className="text-[10px] font-mono px-1 py-0.2 bg-slate-200 text-slate-700 rounded font-medium">
                          ACKNOWLEDGED
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-1 font-sans">
                      {alert.message}
                    </p>
                    {alert.customerName && (
                      <div className="text-[10px] text-slate-500 font-mono mt-1 flex items-center gap-1">
                        <User className="w-3 h-3 text-slate-400" />
                        <span>{alert.customerName}</span>
                        {alert.customerCode && <span>({alert.customerCode})</span>}
                        {alert.sourceEntityId && (
                          <>
                            <span>&bull;</span>
                            <span>Ref: {alert.sourceEntityId}</span>
                          </>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  {(alert.severity === 'CRITICAL' || alert.severity === 'WARNING') && !isAck && (
                    <button
                      onClick={(e) => handleAcknowledge(e, alert.id)}
                      disabled={actionInProgressId === alert.id}
                      className="px-2 py-1 rounded text-[10px] font-mono font-medium bg-amber-100 text-amber-900 hover:bg-amber-200 border border-amber-300 transition-colors"
                    >
                      Acknowledge
                    </button>
                  )}
                  {alert.actionUrl && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAction(alert);
                      }}
                      className="px-2 py-1 rounded text-[11px] font-semibold bg-[#0f1e36] text-white hover:bg-slate-800 flex items-center gap-1 transition-colors"
                    >
                      <span>{alert.actionLabel || 'Action'}</span>
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
