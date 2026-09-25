import React, { useState, useEffect, useCallback } from 'react';
import {
  X,
  Bell,
  BellRing,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle2,
  CheckCheck,
  RefreshCw,
  Settings,
  ExternalLink,
  ShieldAlert,
  Clock,
  Filter,
  Check,
  Trash2,
  User,
  Layers,
  ChevronRight,
} from 'lucide-react';
import { Button } from '../common/Button';
import { bankingApi } from '../../lib/api';
import { NotificationItem, NotificationCategory, NotificationSeverity, NotificationStatus } from '../../types';
import { NotificationPreferencesModal } from './NotificationPreferencesModal';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigate?: (url: string) => void;
  onCountChange?: (count: number) => void;
}

type TabType = 'ALL' | 'UNREAD' | 'CRITICAL' | 'WARNINGS';

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onNavigate,
  onCountChange,
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [summary, setSummary] = useState<{
    totalCount: number;
    unreadCount: number;
    criticalCount: number;
    warningCount: number;
    byCategory: Record<string, number>;
  }>({
    totalCount: 0,
    unreadCount: 0,
    criticalCount: 0,
    warningCount: 0,
    byCategory: {},
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isPreferencesOpen, setIsPreferencesOpen] = useState<boolean>(false);
  const [actionInProgressId, setActionInProgressId] = useState<number | null>(null);

  const fetchNotifications = useCallback(async () => {
    setIsLoading(true);
    try {
      const filters: any = { limit: 50 };
      if (activeTab === 'UNREAD') {
        filters.status = 'UNREAD';
      } else if (activeTab === 'CRITICAL') {
        filters.severity = 'CRITICAL';
      } else if (activeTab === 'WARNINGS') {
        filters.severity = 'WARNING';
      }

      if (selectedCategory !== 'ALL') {
        filters.category = selectedCategory;
      }

      const [listRes, summaryRes] = await Promise.all([
        bankingApi.getNotifications(filters),
        bankingApi.getNotificationSummary(),
      ]);

      setNotifications(listRes.data || []);
      setSummary(summaryRes);
      if (onCountChange) {
        onCountChange(summaryRes.unreadCount);
      }
    } catch (err) {
      console.error('Failed to fetch notifications:', err);
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, selectedCategory, onCountChange]);

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen, fetchNotifications]);

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await bankingApi.syncNotifications();
      await fetchNotifications();
    } catch (err) {
      console.error('Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleMarkRead = async (id: number) => {
    setActionInProgressId(id);
    try {
      await bankingApi.markNotificationRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'READ' as NotificationStatus } : n))
      );
      setSummary((prev) => ({
        ...prev,
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
      if (onCountChange) {
        onCountChange(Math.max(0, summary.unreadCount - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleMarkAllRead = async () => {
    setIsLoading(true);
    try {
      await bankingApi.markAllNotificationsRead();
      setNotifications((prev) =>
        prev.map((n) => (n.status === 'UNREAD' ? { ...n, status: 'READ' as NotificationStatus } : n))
      );
      setSummary((prev) => ({
        ...prev,
        unreadCount: 0,
      }));
      if (onCountChange) {
        onCountChange(0);
      }
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcknowledge = async (id: number) => {
    setActionInProgressId(id);
    try {
      await bankingApi.acknowledgeNotification(id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, status: 'ACKNOWLEDGED' as NotificationStatus } : n))
      );
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to acknowledge notification:', err);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleDismiss = async (id: number) => {
    setActionInProgressId(id);
    try {
      await bankingApi.dismissNotification(id);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
      await fetchNotifications();
    } catch (err) {
      console.error('Failed to dismiss notification:', err);
    } finally {
      setActionInProgressId(null);
    }
  };

  const handleActionClick = (notif: NotificationItem) => {
    if (notif.status === 'UNREAD') {
      handleMarkRead(notif.id);
    }
    if (notif.actionUrl && onNavigate) {
      onNavigate(notif.actionUrl);
      onClose();
    }
  };

  const formatRelativeTime = (timestamp?: string | number | Date) => {
    if (!timestamp) return 'Recent';
    const d = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHours = Math.floor(diffMin / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMin < 1) return 'Just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
  };

  const getSeverityBadge = (severity: NotificationSeverity) => {
    switch (severity) {
      case 'CRITICAL':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-rose-100 text-rose-800 border border-rose-300">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-600 animate-pulse" />
            CRITICAL
          </span>
        );
      case 'WARNING':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-2.5 h-2.5 text-amber-700" />
            WARNING
          </span>
        );
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-2.5 h-2.5 text-emerald-700" />
            SUCCESS
          </span>
        );
      case 'INFO':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold uppercase bg-sky-100 text-sky-800 border border-sky-300">
            <Info className="w-2.5 h-2.5 text-sky-700" />
            INFO
          </span>
        );
    }
  };

  const getCategoryBadge = (category: NotificationCategory) => {
    const colors: Record<string, string> = {
      SERVICE: 'bg-indigo-50 text-indigo-700 border-indigo-200',
      TASK: 'bg-cyan-50 text-cyan-700 border-cyan-200',
      OPPORTUNITY: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      RELATIONSHIP: 'bg-purple-50 text-purple-700 border-purple-200',
      CUSTOMER: 'bg-blue-50 text-blue-700 border-blue-200',
      OPERATIONAL: 'bg-amber-50 text-amber-700 border-amber-200',
      SYSTEM: 'bg-slate-100 text-slate-700 border-slate-300',
    };
    return (
      <span
        className={`px-1.5 py-0.2 rounded text-[10px] font-mono uppercase border ${
          colors[category] || 'bg-slate-100 text-slate-700 border-slate-200'
        }`}
      >
        {category}
      </span>
    );
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-fade-in"
      />

      {/* Slide-over Drawer */}
      <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-white border-l border-slate-300 shadow-2xl flex flex-col animate-slide-left">
        {/* Header */}
        <div className="p-4 bg-[#0f1e36] text-white flex flex-col gap-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded bg-slate-800/80 border border-slate-700 text-amber-400">
                <BellRing className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-bold tracking-tight text-white uppercase font-sans">
                    Notifications & Alerts
                  </h2>
                  {summary.unreadCount > 0 && (
                    <span className="font-mono text-[10px] font-bold px-1.5 py-0.2 bg-rose-500 text-white rounded">
                      {summary.unreadCount} Unread
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-slate-300 font-mono">
                  Institutional Alerts & Relationship Signals
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsPreferencesOpen(true)}
                className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
                title="Notification Preferences"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded text-slate-300 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar & Operational Controls */}
          <div className="flex items-center justify-between pt-1 border-t border-slate-700/60 text-xs">
            <div className="flex items-center gap-2 font-mono text-[11px]">
              <span className="text-rose-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                {summary.criticalCount} Critical
              </span>
              <span className="text-slate-500">&bull;</span>
              <span className="text-amber-300 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                {summary.warningCount} Warnings
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleSync}
                disabled={isSyncing}
                className="text-[11px] font-mono text-slate-300 hover:text-white flex items-center gap-1 cursor-pointer transition-colors"
                title="Scan operational queues for new alerts"
              >
                <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin text-amber-400' : ''}`} />
                <span>{isSyncing ? 'Scanning...' : 'Scan'}</span>
              </button>
              {summary.unreadCount > 0 && (
                <>
                  <span className="text-slate-600">|</span>
                  <button
                    onClick={handleMarkAllRead}
                    disabled={isLoading}
                    className="text-[11px] font-mono text-slate-300 hover:text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <CheckCheck className="w-3 h-3" />
                    <span>Read all</span>
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Severity Tabs */}
        <div className="px-3 pt-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1 text-xs">
            {(['ALL', 'UNREAD', 'CRITICAL', 'WARNINGS'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-1.5 text-[11px] font-medium transition-colors border-b-2 cursor-pointer font-sans ${
                  activeTab === tab
                    ? 'border-[#0f1e36] text-[#0f1e36] font-semibold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                {tab === 'ALL' && `All (${summary.totalCount})`}
                {tab === 'UNREAD' && `Unread (${summary.unreadCount})`}
                {tab === 'CRITICAL' && `Critical (${summary.criticalCount})`}
                {tab === 'WARNINGS' && `Warnings (${summary.warningCount})`}
              </button>
            ))}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="px-3 py-2 bg-white border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-[11px] shrink-0 scrollbar-none">
          <span className="text-slate-400 text-[10px] font-mono uppercase shrink-0">Category:</span>
          {['ALL', 'SERVICE', 'TASK', 'OPPORTUNITY', 'RELATIONSHIP', 'OPERATIONAL'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-2 py-0.5 rounded text-[10px] font-mono uppercase whitespace-nowrap transition-colors cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-800 text-white font-semibold'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Notification List Container */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-2 space-y-2">
          {isLoading && notifications.length === 0 ? (
            <div className="py-16 text-center text-slate-400 font-mono text-xs">
              <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-slate-400" />
              Loading alerts...
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-16 text-center px-4">
              <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400 border border-slate-200">
                <Check className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-xs font-semibold text-slate-800 font-sans">No pending alerts</p>
              <p className="text-[11px] text-slate-500 font-mono mt-1">
                {activeTab === 'UNREAD'
                  ? 'All notifications have been read.'
                  : activeTab === 'CRITICAL'
                  ? 'No critical operational alerts at this time.'
                  : 'Your relationship queues and service tickets are clear.'}
              </p>
              <button
                onClick={handleSync}
                className="mt-3 inline-flex items-center gap-1 text-xs text-blue-700 hover:underline font-mono"
              >
                <RefreshCw className="w-3 h-3" />
                Scan pipeline now
              </button>
            </div>
          ) : (
            notifications.map((notif) => {
              const isUnread = notif.status === 'UNREAD';
              const isAcknowledged = notif.status === 'ACKNOWLEDGED';

              return (
                <div
                  key={notif.id}
                  className={`p-3 rounded border transition-colors ${
                    isUnread
                      ? notif.severity === 'CRITICAL'
                        ? 'bg-rose-50/40 border-rose-200'
                        : notif.severity === 'WARNING'
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-blue-50/30 border-blue-200'
                      : isAcknowledged
                      ? 'bg-slate-50/80 border-slate-200 opacity-80'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {/* Top Badges & Timestamp */}
                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {getSeverityBadge(notif.severity)}
                      {getCategoryBadge(notif.category)}
                      {isAcknowledged && (
                        <span className="px-1.5 py-0.2 rounded text-[10px] font-mono uppercase bg-slate-200 text-slate-700 font-medium">
                          ACKNOWLEDGED
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 whitespace-nowrap">
                      {formatRelativeTime(notif.createdAt)}
                    </span>
                  </div>

                  {/* Title & Message */}
                  <h4 className="text-xs font-semibold text-slate-900 font-sans leading-snug">
                    {notif.title}
                  </h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed font-sans">
                    {notif.message}
                  </p>

                  {/* Context Entities (Customer & Source Entity) */}
                  {(notif.customerName || notif.sourceEntityId) && (
                    <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-mono text-slate-500">
                      {notif.customerName && (
                        <span className="flex items-center gap-1 text-slate-700 truncate max-w-[200px]">
                          <User className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate">{notif.customerName}</span>
                          {notif.customerCode && <span className="text-slate-400 font-mono">({notif.customerCode})</span>}
                        </span>
                      )}
                      {notif.sourceEntityId && (
                        <span className="text-slate-500 font-mono ml-auto">
                          Ref: {notif.sourceEntityId}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Action Buttons Bar */}
                  <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      {/* Deep Link Action */}
                      {notif.actionUrl && (
                        <button
                          onClick={() => handleActionClick(notif)}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold bg-[#0f1e36] text-white hover:bg-slate-800 cursor-pointer transition-colors"
                        >
                          <span>{notif.actionLabel || 'View Record'}</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}

                      {/* Acknowledge Button for High/Critical Alert Governance */}
                      {(notif.severity === 'CRITICAL' || notif.severity === 'WARNING') && !isAcknowledged && (
                        <button
                          onClick={() => handleAcknowledge(notif.id)}
                          disabled={actionInProgressId === notif.id}
                          className="px-2 py-1 rounded text-[10px] font-mono font-medium bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 cursor-pointer transition-colors"
                          title="Acknowledge alert and log review"
                        >
                          Acknowledge
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1 text-slate-400">
                      {/* Mark Read Toggle */}
                      {isUnread && (
                        <button
                          onClick={() => handleMarkRead(notif.id)}
                          disabled={actionInProgressId === notif.id}
                          className="p-1 rounded hover:text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors"
                          title="Mark as read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {/* Dismiss */}
                      <button
                        onClick={() => handleDismiss(notif.id)}
                        disabled={actionInProgressId === notif.id}
                        className="p-1 rounded hover:text-rose-700 hover:bg-rose-50 cursor-pointer transition-colors"
                        title="Dismiss alert"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[10px] font-mono text-slate-500 shrink-0">
          COREvia Event-Driven Notification Engine &bull; Enterprise Banking Audit Active
        </div>
      </div>

      {/* Preferences Modal */}
      <NotificationPreferencesModal
        isOpen={isPreferencesOpen}
        onClose={() => setIsPreferencesOpen(false)}
        onSaved={fetchNotifications}
      />
    </>
  );
};
