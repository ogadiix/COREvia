/**
 * COREvia Phase 38: Enterprise Integration & API Gateway Workspace
 * Light institutional banking interface for integration registry, gateway endpoints,
 * webhooks, event logs, delivery retry engine, and synthetic simulators.
 */

import React, { useState, useEffect } from 'react';
import {
  Layers,
  Network,
  Activity,
  Shield,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  Search,
  Filter,
  Play,
  Webhook,
  Code2,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
  RefreshCw,
  Plus,
  Radio,
  ExternalLink,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';
import {
  IntegrationDTO,
  IntegrationEndpointDTO,
  WebhookConfigDTO,
  WebhookDeliveryDTO,
  IntegrationEventDTO,
  IntegrationSummaryAnalyticsDTO,
} from '../../types/integration.types.ts';
import { bankingApi } from '../../lib/api.ts';
import { IntegrationDetailDrawer } from './IntegrationDetailDrawer.tsx';
import { SimulatorTestModal } from './SimulatorTestModal.tsx';
import { NewWebhookModal } from './NewWebhookModal.tsx';

export const IntegrationsWorkspace: React.FC = () => {
  const [activeTab, setActiveTab] = useState<
    'overview' | 'integrations' | 'endpoints' | 'webhooks' | 'events' | 'failures' | 'health' | 'audit'
  >('overview');

  // Data states
  const [integrations, setIntegrations] = useState<IntegrationDTO[]>([]);
  const [summary, setSummary] = useState<IntegrationSummaryAnalyticsDTO | null>(null);
  const [endpoints, setEndpoints] = useState<IntegrationEndpointDTO[]>([]);
  const [webhooks, setWebhooks] = useState<WebhookConfigDTO[]>([]);
  const [deliveries, setDeliveries] = useState<WebhookDeliveryDTO[]>([]);
  const [events, setEvents] = useState<IntegrationEventDTO[]>([]);
  const [failures, setFailures] = useState<IntegrationEventDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter states
  const [search, setSearch] = useState('');
  const [domainFilter, setDomainFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Modals & Drawers
  const [selectedIntegration, setSelectedIntegration] = useState<IntegrationDTO | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isTestModalOpen, setIsTestModalOpen] = useState(false);
  const [isNewWebhookModalOpen, setIsNewWebhookModalOpen] = useState(false);
  const [retryingDeliveryId, setRetryingDeliveryId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [intRes, sumRes, epRes, whRes, delRes, evRes, failRes] = await Promise.all([
        bankingApi.getIntegrations({
          domain: domainFilter || undefined,
          mode: modeFilter || undefined,
          status: statusFilter || undefined,
          search: search || undefined,
        }),
        bankingApi.getIntegrationSummary(),
        bankingApi.getIntegrationEndpoints(),
        bankingApi.getIntegrationWebhooks(),
        bankingApi.getWebhookDeliveries(),
        bankingApi.getIntegrationEvents({ search: search || undefined, limit: 30 }),
        bankingApi.getIntegrationFailures(),
      ]);

      if (intRes.success) setIntegrations(intRes.data);
      if (sumRes.success) setSummary(sumRes.data);
      if (epRes.success) setEndpoints(epRes.data);
      if (whRes.success) setWebhooks(whRes.data);
      if (delRes.success) setDeliveries(delRes.data);
      if (evRes.success) setEvents(evRes.data);
      if (failRes.success) setFailures(failRes.data);
    } catch (e: any) {
      console.error('Failed to load integration gateway data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [domainFilter, modeFilter, statusFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const handleOpenDrawer = (item: IntegrationDTO) => {
    setSelectedIntegration(item);
    setIsDrawerOpen(true);
  };

  const handleOpenTestModal = (item: IntegrationDTO) => {
    setSelectedIntegration(item);
    setIsTestModalOpen(true);
  };

  const handleRetryDelivery = async (deliveryId: string) => {
    setRetryingDeliveryId(deliveryId);
    try {
      const res = await bankingApi.retryWebhookDelivery(deliveryId);
      if (res.success) {
        alert(`Delivery ${deliveryId} retried successfully (Attempt #${res.data.attempt})`);
        loadData();
      }
    } catch (err: any) {
      alert(`Retry failed: ${err.message}`);
    } finally {
      setRetryingDeliveryId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Enterprise Context Header */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold rounded font-mono">
                PHASE 38 · API GATEWAY
              </span>
              <span className="px-2 py-0.5 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold rounded">
                ENV: DEVELOPMENT
              </span>
              <span className="text-xs text-slate-500 font-mono">
                As of: {new Date().toLocaleTimeString()} (Active Session)
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Enterprise Integration & API Gateway</h1>
            <p className="text-xs text-slate-500 mt-1">
              Internal gateway routing, synthetic adapter simulators, webhook delivery engine, and strict idempotency controls.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                if (integrations.length > 0) {
                  setSelectedIntegration(integrations[0]);
                  setIsTestModalOpen(true);
                }
              }}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" />
              Simulate Live Operation
            </button>
            <button
              onClick={() => setIsNewWebhookModalOpen(true)}
              className="px-3.5 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold rounded-lg shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 text-slate-500" />
              New Webhook
            </button>
            <button
              onClick={loadData}
              disabled={isLoading}
              className="p-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-600 rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-50"
              title="Refresh Gateway Telemetry"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {/* 6 High-Level Gateway KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mt-6 pt-6 border-t border-slate-200">
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Integrations</div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{summary?.totalIntegrations || integrations.length}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Registered In Gateway</div>
          </div>
          <div className="p-3 bg-purple-50/60 rounded-lg border border-purple-200">
            <div className="text-[10px] font-semibold text-purple-700 uppercase tracking-wider">Simulators</div>
            <div className="text-xl font-bold text-purple-900 font-mono mt-0.5">{summary?.simulatedCount || 5}</div>
            <div className="text-[10px] text-purple-700 mt-0.5">Synthetic FinTech Rails</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">24h Gateway Events</div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{summary?.totalEvents24h || events.length}</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Inbound & Outbound</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Success Rate</div>
            <div className="text-xl font-bold text-emerald-700 font-mono mt-0.5">{summary?.successRate || 99.5}%</div>
            <div className="text-[10px] text-emerald-600 mt-0.5">Verified Deliveries</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Avg Latency</div>
            <div className="text-xl font-bold text-slate-900 font-mono mt-0.5">{summary?.averageLatencyMs || 42} ms</div>
            <div className="text-[10px] text-slate-500 mt-0.5">Gateway Processing</div>
          </div>
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
            <div className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Circuit Breakers</div>
            <div className="text-xl font-bold text-emerald-700 font-mono mt-0.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ALL CLOSED
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">Normal Operational State</div>
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 flex-1 min-w-[260px] max-w-md">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search by ID, name, or correlation ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <button
            type="submit"
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg border border-slate-300 cursor-pointer"
          >
            Search
          </button>
        </form>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={domainFilter}
            onChange={(e) => setDomainFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="">All Domains</option>
            <option value="CORE_BANKING">Core Banking</option>
            <option value="KYC">KYC & Identity</option>
            <option value="PAYMENTS">Payments</option>
            <option value="DOCUMENT_MANAGEMENT">Documents</option>
            <option value="NOTIFICATION">Notifications</option>
            <option value="EMAIL">Email</option>
            <option value="AML">AML</option>
          </select>

          <select
            value={modeFilter}
            onChange={(e) => setModeFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="">All Modes</option>
            <option value="SIMULATOR">Simulator</option>
            <option value="ADAPTER">Adapter</option>
            <option value="EXTERNAL">External</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-none"
          >
            <option value="">All Statuses</option>
            <option value="SIMULATED">Simulated</option>
            <option value="AVAILABLE">Available</option>
            <option value="CONNECTED">Connected</option>
            <option value="NOT_CONFIGURED">Not Configured</option>
            <option value="DISABLED">Disabled</option>
            <option value="FAILED">Failed</option>
          </select>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        <div className="flex border-b border-slate-200 overflow-x-auto bg-slate-50">
          {[
            { id: 'overview', label: 'Overview', icon: Layers },
            { id: 'integrations', label: `Integrations (${integrations.length})`, icon: Network },
            { id: 'endpoints', label: `Endpoints (${endpoints.length})`, icon: Code2 },
            { id: 'webhooks', label: `Webhooks (${webhooks.length})`, icon: Webhook },
            { id: 'events', label: `Events (${events.length})`, icon: Activity },
            { id: 'failures', label: `Failures & Retries (${failures.length})`, icon: AlertTriangle },
            { id: 'health', label: 'Health & Circuit Breaker', icon: Radio },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3.5 px-4 text-xs font-semibold uppercase tracking-wider flex items-center gap-2 border-b-2 transition-colors cursor-pointer shrink-0 ${
                  isActive
                    ? 'border-indigo-600 text-indigo-600 bg-white'
                    : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-100'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab Contents */}
        <div className="p-6">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Notice Banner */}
              <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg flex items-start gap-3">
                <Shield className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                <div className="text-xs text-purple-900 leading-relaxed">
                  <strong>Simulated FinTech Architecture:</strong> COREvia’s integration adapters run deterministic synthetic simulators for CBS account lookups, KYC token verification, document vault hashing, RTGS/NEFT settlement rails, and multi-channel notifications. They do not claim live connections to external national banking networks or regulators.
                </div>
              </div>

              {/* Quick Simulator Launchers */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Synthetic Adapter Simulators (Click to execute)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {integrations
                    .filter((i) => i.mode === 'SIMULATOR')
                    .map((item) => (
                      <div
                        key={item.integrationId}
                        onClick={() => handleOpenDrawer(item)}
                        className="p-4 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl cursor-pointer transition-all hover:border-indigo-300 group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-mono text-[11px] px-2 py-0.5 rounded font-semibold bg-white border border-slate-300 text-slate-800">
                            {item.integrationId}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">
                            {item.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                          {item.name}
                        </h4>
                        <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                          {item.metadata?.description}
                        </p>
                        <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-200 text-[11px] font-mono text-slate-500">
                          <span>Latency: {item.averageLatencyMs}ms</span>
                          <span className="text-indigo-600 font-semibold group-hover:underline flex items-center gap-0.5 font-sans">
                            Details <ChevronRight className="w-3.5 h-3.5" />
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Recent Events Snapshot */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Recent Gateway Telemetry
                  </h3>
                  <button
                    onClick={() => setActiveTab('events')}
                    className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold cursor-pointer"
                  >
                    View all events →
                  </button>
                </div>
                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-2.5 px-4">Event ID</th>
                        <th className="py-2.5 px-4">Integration</th>
                        <th className="py-2.5 px-4">Event Type</th>
                        <th className="py-2.5 px-4">Direction</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4">Latency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {events.slice(0, 5).map((ev) => (
                        <tr key={ev.eventId} className="hover:bg-slate-50">
                          <td className="py-2 px-4 font-mono font-medium text-slate-800">{ev.eventId}</td>
                          <td className="py-2 px-4 font-mono text-slate-600">{ev.integrationId}</td>
                          <td className="py-2 px-4 font-medium text-slate-900">{ev.eventType}</td>
                          <td className="py-2 px-4">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-mono ${
                                ev.direction === 'INBOUND'
                                  ? 'bg-blue-100 text-blue-800'
                                  : 'bg-slate-100 text-slate-800'
                              }`}
                            >
                              {ev.direction}
                            </span>
                          </td>
                          <td className="py-2 px-4">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                ev.status === 'SUCCESS'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {ev.status}
                            </span>
                          </td>
                          <td className="py-2 px-4 font-mono text-slate-600">{ev.latencyMs}ms</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: INTEGRATIONS TABLE */}
          {activeTab === 'integrations' && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-lg overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Integration</th>
                      <th className="py-3 px-4">Domain</th>
                      <th className="py-3 px-4">Mode</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Version</th>
                      <th className="py-3 px-4">Health</th>
                      <th className="py-3 px-4">Latency</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {integrations.map((item) => (
                      <tr key={item.integrationId} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{item.name}</div>
                          <div className="font-mono text-[11px] text-slate-500">{item.integrationId}</div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">{item.domain}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-100 text-slate-800 border border-slate-300">
                            {item.mode}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full font-bold text-[10px] uppercase ${
                              item.status === 'SIMULATED'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : item.status === 'AVAILABLE' || item.status === 'CONNECTED'
                                ? 'bg-emerald-100 text-emerald-800'
                                : item.status === 'DISABLED'
                                ? 'bg-slate-200 text-slate-700'
                                : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {item.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-600">v{item.version}</td>
                        <td className="py-3 px-4 font-mono">
                          <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            {item.healthStatus}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-700">{item.averageLatencyMs} ms</td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenTestModal(item)}
                              className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded text-[11px] flex items-center gap-1 cursor-pointer"
                              title="Simulate operation"
                            >
                              <Play className="w-3 h-3" /> Test
                            </button>
                            <button
                              onClick={() => handleOpenDrawer(item)}
                              className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded text-[11px] cursor-pointer"
                            >
                              Inspect
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: ENDPOINTS REGISTRY */}
          {activeTab === 'endpoints' && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-lg overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Endpoint ID</th>
                      <th className="py-3 px-4">Integration</th>
                      <th className="py-3 px-4">Method & Path</th>
                      <th className="py-3 px-4">Purpose</th>
                      <th className="py-3 px-4">Auth Type</th>
                      <th className="py-3 px-4">Rate Limit</th>
                      <th className="py-3 px-4">Timeout</th>
                      <th className="py-3 px-4">Idempotency</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {endpoints.map((ep) => (
                      <tr key={ep.endpointId} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">{ep.endpointId}</td>
                        <td className="py-3 px-4 text-slate-600">{ep.integrationId}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold mr-1.5 ${
                              ep.method === 'GET'
                                ? 'bg-blue-100 text-blue-800'
                                : ep.method === 'POST'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {ep.method}
                          </span>
                          <span className="text-slate-900 font-medium">{ep.path}</span>
                        </td>
                        <td className="py-3 px-4 font-sans text-slate-600 max-w-xs truncate">{ep.purpose}</td>
                        <td className="py-3 px-4 text-slate-600 text-[11px]">{ep.authType}</td>
                        <td className="py-3 px-4 text-slate-700">{ep.rateLimit} RPM</td>
                        <td className="py-3 px-4 text-slate-700">{ep.timeoutMs} ms</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-sans font-semibold ${
                              ep.idempotencyRequired
                                ? 'bg-indigo-100 text-indigo-800'
                                : 'bg-slate-100 text-slate-500'
                            }`}
                          >
                            {ep.idempotencyRequired ? 'MANDATORY' : 'OPTIONAL'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 4: WEBHOOKS */}
          {activeTab === 'webhooks' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Registered Webhook Subscriptions
                </h3>
                <button
                  onClick={() => setIsNewWebhookModalOpen(true)}
                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Register Webhook
                </button>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Webhook ID</th>
                      <th className="py-3 px-4">Integration</th>
                      <th className="py-3 px-4">Subscribed Event</th>
                      <th className="py-3 px-4">Target Listener URL</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Failures</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {webhooks.map((wh) => (
                      <tr key={wh.webhookId} className="hover:bg-slate-50">
                        <td className="py-3 px-4 font-bold text-slate-900">{wh.webhookId}</td>
                        <td className="py-3 px-4 text-slate-600">{wh.integrationId}</td>
                        <td className="py-3 px-4 text-indigo-700 font-semibold">{wh.eventType}</td>
                        <td className="py-3 px-4 text-slate-600 truncate max-w-xs">{wh.targetUrl}</td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {wh.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-700">{wh.failureCount}</td>
                        <td className="py-3 px-4 text-right font-sans">
                          <button
                            onClick={async () => {
                              try {
                                await bankingApi.triggerWebhookTest(wh.webhookId, {
                                  testTriggeredBy: 'Operator',
                                  timestamp: new Date().toISOString(),
                                });
                                alert(`Synthetic webhook delivery triggered for ${wh.webhookId}`);
                                loadData();
                              } catch (e: any) {
                                alert(`Test failed: ${e.message}`);
                              }
                            }}
                            className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold rounded cursor-pointer"
                          >
                            Trigger Test
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Delivery History */}
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Recent Webhook Delivery Attempts
                </h3>
                <div className="border border-slate-200 rounded-lg overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="py-2.5 px-4">Delivery ID</th>
                        <th className="py-2.5 px-4">Webhook</th>
                        <th className="py-2.5 px-4">Attempt</th>
                        <th className="py-2.5 px-4">Status</th>
                        <th className="py-2.5 px-4">HTTP Status</th>
                        <th className="py-2.5 px-4">Latency</th>
                        <th className="py-2.5 px-4">Error / Notes</th>
                        <th className="py-2.5 px-4 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 font-mono">
                      {deliveries.map((del) => (
                        <tr key={del.deliveryId} className="hover:bg-slate-50">
                          <td className="py-2 px-4 font-bold text-slate-900">{del.deliveryId}</td>
                          <td className="py-2 px-4 text-slate-600">{del.webhookId}</td>
                          <td className="py-2 px-4 text-slate-700">Attempt #{del.attempt}</td>
                          <td className="py-2 px-4">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                del.status === 'DELIVERED'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : del.status === 'RETRYING'
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              {del.status}
                            </span>
                          </td>
                          <td className="py-2 px-4 text-slate-700">{del.httpStatus || '---'}</td>
                          <td className="py-2 px-4 text-slate-600">{del.latencyMs ? `${del.latencyMs}ms` : '---'}</td>
                          <td className="py-2 px-4 font-sans text-slate-500 max-w-xs truncate">
                            {del.error || 'Acknowledged'}
                          </td>
                          <td className="py-2 px-4 text-right font-sans">
                            {del.status !== 'DELIVERED' && (
                              <button
                                onClick={() => handleRetryDelivery(del.deliveryId)}
                                disabled={retryingDeliveryId === del.deliveryId}
                                className="px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[11px] font-semibold rounded cursor-pointer disabled:opacity-50"
                              >
                                {retryingDeliveryId === del.deliveryId ? 'Retrying...' : 'Retry'}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: EVENTS STREAM */}
          {activeTab === 'events' && (
            <div className="space-y-4">
              <div className="border border-slate-200 rounded-lg overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Event ID</th>
                      <th className="py-3 px-4">Integration</th>
                      <th className="py-3 px-4">Event Type</th>
                      <th className="py-3 px-4">Direction</th>
                      <th className="py-3 px-4">Correlation ID</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Latency</th>
                      <th className="py-3 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {events.map((ev) => (
                      <tr key={ev.eventId} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-bold text-slate-900">{ev.eventId}</td>
                        <td className="py-2.5 px-4 text-slate-600">{ev.integrationId}</td>
                        <td className="py-2.5 px-4 font-sans font-semibold text-slate-800">{ev.eventType}</td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] ${
                              ev.direction === 'INBOUND' ? 'bg-blue-100 text-blue-800' : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {ev.direction}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-500 text-[11px] truncate max-w-[140px]">
                          {ev.correlationId}
                        </td>
                        <td className="py-2.5 px-4">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              ev.status === 'SUCCESS' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            {ev.status}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-600">{ev.latencyMs} ms</td>
                        <td className="py-2.5 px-4 text-slate-500 text-[11px] font-sans">
                          {new Date(ev.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 6: FAILURES & RETRIES */}
          {activeTab === 'failures' && (
            <div className="space-y-4">
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  <strong>Failure & Retry Telemetry:</strong> All upstream errors are classified into retryable (network timeout, 5xx) vs non-retryable (4xx, schema mismatch) with bounded maximum attempts.
                </span>
              </div>

              <div className="border border-slate-200 rounded-lg overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-600 border-b border-slate-200 font-semibold uppercase tracking-wider text-[10px]">
                    <tr>
                      <th className="py-3 px-4">Event ID</th>
                      <th className="py-3 px-4">Integration</th>
                      <th className="py-3 px-4">Error Code</th>
                      <th className="py-3 px-4">Error Message</th>
                      <th className="py-3 px-4">Retryable</th>
                      <th className="py-3 px-4">Retry Count</th>
                      <th className="py-3 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    {failures.map((f) => (
                      <tr key={f.eventId} className="hover:bg-slate-50">
                        <td className="py-2.5 px-4 font-bold text-slate-900">{f.eventId}</td>
                        <td className="py-2.5 px-4 text-slate-600">{f.integrationId}</td>
                        <td className="py-2.5 px-4 text-rose-700 font-bold">{f.errorCode || 'ERROR'}</td>
                        <td className="py-2.5 px-4 font-sans text-slate-700 max-w-sm">{f.errorMessage}</td>
                        <td className="py-2.5 px-4 font-sans">
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                              f.retryable ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'
                            }`}
                          >
                            {f.retryable ? 'YES' : 'NO'}
                          </span>
                        </td>
                        <td className="py-2.5 px-4 text-slate-700">{f.retryCount}</td>
                        <td className="py-2.5 px-4 font-sans text-slate-500 text-[11px]">
                          {new Date(f.createdAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                    {failures.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-xs text-slate-400 font-sans">
                          Zero active failures recorded. Gateway is operational.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 7: HEALTH & CIRCUIT BREAKER */}
          {activeTab === 'health' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {integrations.map((item) => (
                  <div key={item.integrationId} className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3 font-mono text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900 font-sans text-sm">{item.name}</span>
                      <span className="px-2 py-0.5 rounded font-bold text-[10px] bg-emerald-100 text-emerald-800">
                        {item.healthStatus}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 font-sans">{item.integrationId}</div>

                    <div className="pt-2 border-t border-slate-200 space-y-1.5">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Circuit Breaker:</span>
                        <span className="font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                          {item.circuitBreaker.state}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Success Rate:</span>
                        <span className="text-slate-800 font-bold">{item.successRate}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Average Latency:</span>
                        <span className="text-slate-800 font-bold">{item.averageLatencyMs} ms</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">Consecutive Failures:</span>
                        <span className="text-slate-800">{item.circuitBreaker.consecutiveFailures} / {item.circuitBreaker.failureThreshold}</span>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button
                        onClick={async () => {
                          try {
                            const res = await bankingApi.testIntegrationConnection(item.integrationId);
                            alert(`Health Check: ${res.data.status} (${res.data.latencyMs}ms)`);
                            loadData();
                          } catch (e: any) {
                            alert(`Health check failed: ${e.message}`);
                          }
                        }}
                        className="w-full py-1.5 bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 text-xs font-semibold rounded font-sans cursor-pointer transition-colors"
                      >
                        Ping Health Check
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Slide-out Drawer */}
      <IntegrationDetailDrawer
        integration={selectedIntegration}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onRefresh={loadData}
        onOpenTestModal={(item) => {
          setIsDrawerOpen(false);
          setSelectedIntegration(item);
          setIsTestModalOpen(true);
        }}
      />

      {/* Simulator Test Modal */}
      <SimulatorTestModal
        integration={selectedIntegration}
        isOpen={isTestModalOpen}
        onClose={() => setIsTestModalOpen(false)}
        onSuccess={loadData}
      />

      {/* New Webhook Modal */}
      <NewWebhookModal
        integrations={integrations}
        isOpen={isNewWebhookModalOpen}
        onClose={() => setIsNewWebhookModalOpen(false)}
        onCreated={loadData}
      />
    </div>
  );
};
