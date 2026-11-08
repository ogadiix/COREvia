import React, { useState, useEffect } from 'react';
import { X, ShieldAlert, Check, Settings, AlertTriangle, Lock } from 'lucide-react';
import { Button } from '../common/Button';
import { bankingApi } from '../../lib/api';
import { UserNotificationPreferences } from '../../types';

interface NotificationPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const NotificationPreferencesModal: React.FC<NotificationPreferencesModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [preferences, setPreferences] = useState<UserNotificationPreferences>({
    serviceAlerts: true,
    taskAlerts: true,
    opportunityAlerts: true,
    relationshipAlerts: true,
    customerActivityAlerts: true,
    operationalAlerts: true,
    systemAlerts: true,
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    let mounted = true;
    setIsLoading(true);
    setFeedback(null);

    bankingApi
      .getNotificationPreferences()
      .then((data) => {
        if (mounted && data) {
          setPreferences({
            serviceAlerts: data.serviceAlerts !== false,
            taskAlerts: data.taskAlerts !== false,
            opportunityAlerts: data.opportunityAlerts !== false,
            relationshipAlerts: data.relationshipAlerts !== false,
            customerActivityAlerts: data.customerActivityAlerts !== false,
            operationalAlerts: data.operationalAlerts !== false,
            systemAlerts: data.systemAlerts !== false,
          });
        }
      })
      .catch((err) => {
        console.error('Failed to load notification preferences:', err);
      })
      .finally(() => {
        if (mounted) setIsLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggle = (key: keyof UserNotificationPreferences) => {
    setPreferences((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setFeedback(null);
    try {
      await bankingApi.updateNotificationPreferences(preferences);
      setFeedback({ type: 'success', message: 'Notification preferences updated successfully.' });
      if (onSaved) onSaved();
      setTimeout(() => {
        onClose();
      }, 750);
    } catch (err: any) {
      setFeedback({ type: 'error', message: err.message || 'Failed to save preferences.' });
    } finally {
      setIsSaving(false);
    }
  };

  const categoryConfigs: Array<{
    key: keyof UserNotificationPreferences;
    title: string;
    description: string;
    tag: string;
  }> = [
    {
      key: 'serviceAlerts',
      title: 'Service Desk & Escalations',
      description: 'Customer grievances, SLA breach warnings, and ticket assignment events.',
      tag: 'SERVICE',
    },
    {
      key: 'taskAlerts',
      title: 'Tasks & Officer Commitments',
      description: 'Scheduled customer touchpoints, KYC renewals, and pending officer follow-ups.',
      tag: 'TASK',
    },
    {
      key: 'opportunityAlerts',
      title: 'Pipeline & Opportunities',
      description: 'High-value deal stage advancements, negotiations, and credit facility closings.',
      tag: 'OPPORTUNITY',
    },
    {
      key: 'relationshipAlerts',
      title: 'Relationship Intelligence & CORE Score',
      description: 'Significant credit/churn risk movements and emerging relationship signals.',
      tag: 'RELATIONSHIP',
    },
    {
      key: 'customerActivity',
      title: 'Customer 360 & KYC',
      description: 'Onboarding milestones, profile updates, and risk classification modifications.',
      tag: 'CUSTOMER',
    },
    {
      key: 'operationalAlerts',
      title: 'Operational Pipeline & Radar',
      description: 'Cross-sell opportunity radar conversions, high-value deposit movements, and maker-checker tasks.',
      tag: 'OPERATIONAL',
    },
    {
      key: 'systemAlerts',
      title: 'System & Security',
      description: 'Core banking interface updates, maintenance schedules, and audit warnings.',
      tag: 'SYSTEM',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 animate-fade-in">
      <div className="bg-white dark:bg-[#162638] border border-slate-300 dark:border-[#33485D] rounded shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-4 bg-[#142C45] dark:bg-[#101C2A] text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Settings className="w-5 h-5 text-[#D9A441]" />
            <div>
              <h3 className="text-sm font-bold tracking-tight text-white uppercase font-sans">
                Notification Preferences
              </h3>
              <p className="text-[11px] text-slate-300 dark:text-[#A9BACB] font-mono">
                Institutional Alert Filtering & Delivery Controls
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-300 dark:text-[#A9BACB] hover:text-white hover:bg-slate-700/50 dark:hover:bg-[#1C3045] cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Institutional Policy Notice */}
        <div className="px-5 py-3 bg-amber-50/80 dark:bg-amber-950/40 border-b border-amber-200 dark:border-amber-700/50 text-amber-900 dark:text-amber-200 text-xs flex items-start gap-2.5">
          <Lock className="w-4 h-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold font-sans">Mandatory Compliance Policy:</span>
            <span className="text-slate-700 dark:text-[#A9BACB] ml-1">
              Critical severity alerts (including SLA breaches, significant score drops, and regulatory flags) will
              always be delivered regardless of preferences.
            </span>
          </div>
        </div>

        {/* Preferences List */}
        <div className="p-5 overflow-y-auto space-y-3 divide-y divide-slate-100 dark:divide-[#26394C] flex-1">
          {isLoading ? (
            <div className="py-12 text-center text-slate-500 dark:text-[#8194A8] font-mono text-xs">
              Loading preferences...
            </div>
          ) : (
            categoryConfigs.map((cfg) => {
              const enabled = preferences[cfg.key] !== false;
              return (
                <div key={cfg.key} className="pt-3 first:pt-0 flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-900 dark:text-[#E8EEF5] font-sans">{cfg.title}</span>
                      <span className="text-[10px] font-mono uppercase px-1.5 py-0.2 bg-slate-100 dark:bg-[#101C2A] text-slate-600 dark:text-[#A9BACB] rounded border border-slate-200 dark:border-[#33485D]">
                        {cfg.tag}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-[#8194A8] mt-0.5 leading-relaxed">{cfg.description}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleToggle(cfg.key)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                      enabled ? 'bg-[#168C83]' : 'bg-slate-300 dark:bg-slate-700'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        enabled ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Feedback Message */}
        {feedback && (
          <div
            className={`px-5 py-2 text-xs font-mono border-t ${
              feedback.type === 'success'
                ? 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-700/50'
                : 'bg-rose-50 dark:bg-rose-950/40 text-rose-800 dark:text-rose-300 border-rose-200 dark:border-rose-700/50'
            }`}
          >
            {feedback.message}
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 dark:bg-[#101C2A] border-t border-slate-200 dark:border-[#26394C] flex items-center justify-between">
          <span className="text-[11px] text-slate-500 dark:text-[#8194A8] font-mono">Changes apply across all active sessions</span>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" onClick={onClose} disabled={isSaving}>
              Cancel
            </Button>
            <Button size="sm" variant="primary" onClick={handleSave} disabled={isSaving || isLoading}>
              {isSaving ? 'Saving...' : 'Save Preferences'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
