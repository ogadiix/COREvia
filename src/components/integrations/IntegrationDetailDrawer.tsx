/**
 * COREvia Phase 38: Integration Detail Drawer
 * Slide-out drawer providing technical overview, endpoints, webhooks, health, credentials, and actions.
 */

import React, { useState } from 'react';
import {
  X,
  Shield,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Play,
  RotateCw,
  Power,
  Globe,
  Sliders,
  Webhook,
  Code2,
} from 'lucide-react';
import { IntegrationDTO, HealthCheckResult } from '../../types/integration.types.ts';
import { bankingApi } from '../../lib/api.ts';

interface IntegrationDetailDrawerProps {
  integration: IntegrationDTO | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
  onOpenTestModal: (integration: IntegrationDTO) => void;
}

export const IntegrationDetailDrawer: React.FC<IntegrationDetailDrawerProps> = ({
  integration,
  isOpen,
  onClose,
  onRefresh,
  onOpenTestModal,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'config' | 'health' | 'credentials'>('overview');
  const [isTestingHealth, setIsTestingHealth] = useState(false);
  const [healthResult, setHealthResult] = useState<HealthCheckResult | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  if (!isOpen || !integration) return null;

  const handleTestHealth = async () => {
    setIsTestingHealth(true);
    try {
      const res = await bankingApi.testIntegrationConnection(integration.integrationId);
      if (res.success) {
        setHealthResult(res.data);
        onRefresh();
      }
    } catch (e: any) {
      alert(`Health check failed: ${e.message}`);
    } finally {
      setIsTestingHealth(false);
    }
  };

  const handleToggleStatus = async () => {
    const nextStatus = integration.status === 'DISABLED' ? (integration.mode === 'SIMULATOR' ? 'SIMULATED' : 'AVAILABLE') : 'DISABLED';
    if (!confirm(`Are you sure you want to change status to ${nextStatus}?`)) return;

    setIsUpdatingStatus(true);
    try {
      await bankingApi.updateIntegrationStatus(integration.integrationId, nextStatus, 'Manual user toggle via drawer');
      onRefresh();
    } catch (e: any) {
      alert(`Status update failed: ${e.message}`);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end animate-fadeIn">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200 animate-slideLeft">
        {/* Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-xs px-2 py-0.5 rounded font-medium bg-slate-200 text-slate-800">
                {integration.integrationId}
              </span>
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                  integration.status === 'SIMULATED'
                    ? 'bg-purple-100 text-purple-800 border border-purple-200'
                    : integration.status === 'AVAILABLE' || integration.status === 'CONNECTED'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : integration.status === 'DISABLED'
                    ? 'bg-slate-200 text-slate-700'
                    : 'bg-rose-100 text-rose-800 border border-rose-200'
                }`}
              >
                {integration.status}
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                {integration.mode}
              </span>
            </div>
            <h2 className="text-xl font-bold text-slate-900">{integration.name}</h2>
            <p className="text-xs text-slate-500 mt-0.5 font-mono">
              Adapter: {integration.adapterType} · v{integration.version} · Domain: {integration.domain}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Disclaimer for Simulators */}
        {integration.mode === 'SIMULATOR' && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 flex items-center gap-2.5 text-xs text-amber-900 font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              <strong>SYNTHETIC SIMULATOR:</strong> Produces verified synthetic data. Does not establish real external banking or regulatory network connectivity.
            </span>
          </div>
        )}

        {/* Drawer Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-slate-50">
          {(['overview', 'config', 'health', 'credentials'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 px-3 text-xs font-semibold uppercase tracking-wider border-b-2 transition-colors cursor-pointer ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Quick KPI Strip */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Health Status</div>
                  <div className="text-sm font-bold text-slate-900 flex items-center gap-1.5 mt-1 font-mono">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    {integration.healthStatus}
                  </div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Success Rate</div>
                  <div className="text-sm font-bold text-slate-900 mt-1 font-mono">{integration.successRate}%</div>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Avg Latency</div>
                  <div className="text-sm font-bold text-slate-900 mt-1 font-mono">{integration.averageLatencyMs} ms</div>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Capabilities & Scope</h4>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3.5 rounded-lg border border-slate-200">
                  {integration.metadata?.description || 'Enterprise integration adapter connected to internal API Gateway.'}
                </p>
              </div>

              {/* Circuit Breaker Status */}
              <div>
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">Circuit Breaker Telemetry</h4>
                <div className="p-3.5 bg-slate-50 rounded-lg border border-slate-200 space-y-2 text-xs font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">State:</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                        integration.circuitBreaker.state === 'CLOSED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : integration.circuitBreaker.state === 'HALF_OPEN'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {integration.circuitBreaker.state}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Consecutive Failures:</span>
                    <span className="font-semibold text-slate-800">{integration.circuitBreaker.consecutiveFailures} / {integration.circuitBreaker.failureThreshold}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Reset Timeout:</span>
                    <span className="font-semibold text-slate-800">{integration.circuitBreaker.resetTimeoutMs}ms</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex gap-3">
                <button
                  onClick={() => onOpenTestModal(integration)}
                  className="flex-1 py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center justify-center gap-2 cursor-pointer transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Simulate Live Operation
                </button>
                <button
                  onClick={handleTestHealth}
                  disabled={isTestingHealth}
                  className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 flex items-center justify-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                >
                  <RotateCw className={`w-3.5 h-3.5 ${isTestingHealth ? 'animate-spin' : ''}`} />
                  Check Health
                </button>
                <button
                  onClick={handleToggleStatus}
                  disabled={isUpdatingStatus}
                  className={`py-2.5 px-3 text-xs font-semibold rounded-lg border flex items-center justify-center cursor-pointer transition-colors ${
                    integration.status === 'DISABLED'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100'
                      : 'bg-rose-50 text-rose-700 border-rose-300 hover:bg-rose-100'
                  }`}
                  title={integration.status === 'DISABLED' ? 'Enable Integration' : 'Disable Integration'}
                >
                  <Power className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Gateway Configuration</h4>
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3 font-mono text-xs">
                <div>
                  <div className="text-slate-400 text-[10px] uppercase font-sans">Base URL / Endpoint</div>
                  <div className="text-slate-900 font-semibold break-all mt-0.5">{integration.baseUrl}</div>
                </div>
                <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                  <div>
                    <div className="text-slate-400 text-[10px] uppercase font-sans">Timeout</div>
                    <div className="text-slate-900 font-semibold mt-0.5">{integration.timeoutMs} ms</div>
                  </div>
                  <div>
                    <div className="text-slate-400 text-[10px] uppercase font-sans">Rate Limit</div>
                    <div className="text-slate-900 font-semibold mt-0.5">{integration.rateLimitRpm} RPM</div>
                  </div>
                </div>
                <div className="pt-2 border-t border-slate-200">
                  <div className="text-slate-400 text-[10px] uppercase font-sans">Retry Policy</div>
                  <div className="text-slate-900 mt-1">
                    Max Retries: <span className="font-semibold">{integration.retryPolicy.maxRetries}</span> · Backoff:{' '}
                    <span className="font-semibold">{integration.retryPolicy.backoffMs}ms</span>
                  </div>
                  <div className="text-slate-500 text-[11px] mt-0.5">
                    Retryable Codes: {integration.retryPolicy.retryableCodes.join(', ') || 'TIMEOUT, 5xx'}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'health' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Health Diagnostics</h4>
                <button
                  onClick={handleTestHealth}
                  disabled={isTestingHealth}
                  className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded border border-slate-300 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  <RotateCw className={`w-3 h-3 ${isTestingHealth ? 'animate-spin' : ''}`} />
                  Run Check
                </button>
              </div>

              {healthResult ? (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3 font-mono text-xs">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-sans">Status:</span>
                    <span className="font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      {healthResult.status}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-sans">Measured Latency:</span>
                    <span className="font-bold text-slate-900">{healthResult.latencyMs} ms</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 font-sans">Timestamp:</span>
                    <span className="text-slate-700">{healthResult.timestamp}</span>
                  </div>
                  <div className="pt-2 border-t border-slate-200">
                    <span className="text-slate-500 font-sans block mb-1">Sub-system Checks:</span>
                    <div className="space-y-1 pl-2">
                      {Object.entries(healthResult.details.checks || {}).map(([key, ok]) => (
                        <div key={key} className="flex items-center justify-between">
                          <span className="text-slate-700">{key}:</span>
                          <span className={ok ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                            {ok ? 'PASS' : 'FAIL'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
                  Click 'Run Check' to execute live adapter diagnostic inspection.
                </div>
              )}
            </div>
          )}

          {activeTab === 'credentials' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Credential Metadata</h4>
              <div className="bg-slate-50 rounded-lg border border-slate-200 p-4 space-y-3 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-sans">Active Key Prefix:</span>
                  <span className="font-bold text-slate-900 bg-slate-200 px-2 py-0.5 rounded">cv_sim_9984...</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-sans">Secret Storage:</span>
                  <span className="text-emerald-700 font-semibold font-sans">Hashed (SHA-256)</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-sans">Environment:</span>
                  <span className="text-slate-800">{integration.environment}</span>
                </div>
                <div className="p-2.5 bg-amber-50 rounded border border-amber-200 text-[11px] text-amber-900 font-sans">
                  <strong>Zero Secrets Policy:</strong> Plain-text API keys and secrets are never displayed or stored in unhashed form after initial provisioning.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
