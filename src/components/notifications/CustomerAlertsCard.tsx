import React, { useState, useEffect } from 'react';
import {
  Bell,
  AlertTriangle,
  CheckCircle2,
  Info,
  Clock,
  ExternalLink,
  ShieldAlert,
  ChevronRight,
} from 'lucide-react';
import { bankingApi } from '../../lib/api';
import { NotificationItem, NotificationSeverity } from '../../types';

interface CustomerAlertsCardProps {
  customerId: number;
  customerName?: string;
  onNavigate?: (url: string) => void;
}

export const CustomerAlertsCard: React.FC<CustomerAlertsCardProps> = ({
  customerId,
  customerName,
  onNavigate,
}) => {
  const [alerts, setAlerts] = useState<NotificationItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!customerId) return;
    let mounted = true;
    setIsLoading(true);

    bankingApi
      .getNotifications({ customerId, limit: 10 })
      .then((res) => {
        if (mounted) {
          setAlerts(res.data || []);
        }
      })
      .catch((err) => {
        console.error('Failed to load customer alerts:', err);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [customerId]);

  const handleAcknowledge = async (id: number) => {
    try {
      await bankingApi.acknowledgeNotification(id);
      setAlerts((prev) =>
        prev.map((a) => (a.id === id ? { ...a, status: 'ACKNOWLEDGED' } : a))
      );
    } catch (err) {
      console.error('Failed to acknowledge alert:', err);
    }
  };

  const getSeverityBadge = (severity: NotificationSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
            CRITICAL
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-2.5 h-2.5 text-amber-700" />
            WARNING
          </span>
        );
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />
            SUCCESS
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold bg-sky-100 text-sky-800 border border-sky-300">
            <Info className="w-2.5 h-2.5 text-sky-700" />
            INFO
          </span>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white border border-slate-200 rounded p-4 text-center text-xs font-mono text-slate-400">
        Loading customer alerts & signals...
      </div>
    );
  }

  if (alerts.length === 0) {
    return (
      <div className="bg-white border border-slate-200 rounded p-4 text-center">
        <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-200 flex items-center justify-center mx-auto mb-2">
          <CheckCircle2 className="w-4 h-4" />
        </div>
        <p className="text-xs font-semibold text-slate-800 font-sans">No Active Account Alerts</p>
        <p className="text-[11px] text-slate-500 font-sans mt-0.5">
          Customer relationship is in good standing with no open SLA breaches or critical task flags.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white border border-slate-200 rounded p-4 space-y-3">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 font-sans">
            Customer Alerts & Signals ({alerts.length})
          </h4>
        </div>
        <span className="text-[10px] font-mono text-slate-400">Scoped to Customer Account</span>
      </div>

      <div className="divide-y divide-slate-100">
        {alerts.map((alert) => (
          <div key={alert.id} className="py-2.5 flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1">
                {getSeverityBadge(alert.severity)}
                <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                  {alert.category}
                </span>
                {alert.status === 'ACKNOWLEDGED' && (
                  <span className="text-[10px] font-mono px-1 py-0.2 bg-slate-200 text-slate-700 rounded font-medium">
                    ACKNOWLEDGED
                  </span>
                )}
              </div>
              <h5 className="text-xs font-semibold text-slate-900 font-sans">{alert.title}</h5>
              <p className="text-[11px] text-slate-600 mt-0.5 leading-relaxed font-sans">{alert.message}</p>
              {alert.sourceEntityId && (
                <span className="text-[10px] font-mono text-slate-400 block mt-1">
                  Source: {alert.sourceEntityType} ({alert.sourceEntityId})
                </span>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              {alert.status !== 'ACKNOWLEDGED' && (alert.severity === 'CRITICAL' || alert.severity === 'WARNING') && (
                <button
                  onClick={() => handleAcknowledge(alert.id)}
                  className="px-2 py-1 rounded text-[10px] font-mono font-medium bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100 transition-colors"
                >
                  Ack
                </button>
              )}
              {alert.actionUrl && onNavigate && (
                <button
                  onClick={() => onNavigate(alert.actionUrl!)}
                  className="p-1 rounded text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
                  title="Navigate to Record"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
