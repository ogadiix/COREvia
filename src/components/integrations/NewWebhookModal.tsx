/**
 * COREvia Phase 38: New Webhook Modal
 * Configures a new enterprise webhook endpoint and displays the generated signing secret once.
 */

import React, { useState } from 'react';
import { X, Webhook, ShieldAlert, CheckCircle2, Copy } from 'lucide-react';
import { IntegrationDTO } from '../../types/integration.types.ts';
import { bankingApi } from '../../lib/api.ts';

interface NewWebhookModalProps {
  integrations: IntegrationDTO[];
  isOpen: boolean;
  onClose: () => void;
  onCreated: () => void;
}

const EVENT_TYPES = [
  'CUSTOMER_UPDATED',
  'ACCOUNT_UPDATED',
  'PAYMENT_STATUS_CHANGED',
  'KYC_STATUS_CHANGED',
  'DOCUMENT_STATUS_CHANGED',
  'SERVICE_CASE_UPDATED',
  'OPPORTUNITY_UPDATED',
];

export const NewWebhookModal: React.FC<NewWebhookModalProps> = ({
  integrations,
  isOpen,
  onClose,
  onCreated,
}) => {
  const [integrationId, setIntegrationId] = useState(integrations[0]?.integrationId || 'INT-PAYMENTS');
  const [eventType, setEventType] = useState(EVENT_TYPES[0]);
  const [targetUrl, setTargetUrl] = useState('https://corevia.internal.bank/api/webhooks/listener');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await bankingApi.createWebhook({
        integrationId,
        eventType,
        targetUrl,
      });
      if (res.success) {
        setCreatedSecret(res.data.generatedSecret);
        onCreated();
      }
    } catch (err: any) {
      alert(`Webhook creation failed: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const copySecret = () => {
    if (createdSecret) {
      navigator.clipboard.writeText(createdSecret);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-200 flex items-center justify-center text-indigo-600">
              <Webhook className="w-4 h-4" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Register Webhook</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {createdSecret ? (
          <div className="p-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
              <CheckCircle2 className="w-5 h-5" />
              Webhook Successfully Registered!
            </div>
            <div className="p-3 bg-amber-50 rounded-lg border border-amber-200 text-xs text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                Signing Secret (Shown Only Once)
              </div>
              <p>Store this secret in your secure vault. You will not be able to view it again.</p>
            </div>
            <div className="relative">
              <input
                type="text"
                readOnly
                value={createdSecret}
                className="w-full pr-10 py-2.5 px-3 bg-slate-100 border border-slate-300 rounded-lg font-mono text-xs text-slate-900 select-all"
              />
              <button
                onClick={copySecret}
                className="absolute right-2 top-2 p-1 text-slate-500 hover:text-indigo-600 cursor-pointer"
                title="Copy secret"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            {copied && <p className="text-xs text-emerald-600 font-semibold">Copied to clipboard!</p>}
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Integration
              </label>
              <select
                value={integrationId}
                onChange={(e) => setIntegrationId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {integrations.map((i) => (
                  <option key={i.integrationId} value={i.integrationId}>
                    {i.name} ({i.integrationId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Subscribed Event Type
              </label>
              <select
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {EVENT_TYPES.map((et) => (
                  <option key={et} value={et}>
                    {et}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Target Listener URL
              </label>
              <input
                type="url"
                required
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-xs font-mono focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div className="pt-2 flex justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm cursor-pointer disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? 'Registering...' : 'Register Webhook'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
