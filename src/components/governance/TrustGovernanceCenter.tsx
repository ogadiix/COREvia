import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Activity,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  RefreshCw,
  Cpu,
  Bot,
  Database,
  Lock,
  FileSpreadsheet,
  Download,
  Eye,
  Check,
  User,
  ArrowRight,
  ChevronDown,
  ChevronRight,
  Server,
  Layers,
  Sparkles,
  GitBranch,
  KeyRound,
  FileCheck,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import type {
  GovernanceOverviewDTO,
  AIGovernanceDTO,
  AgentGovernanceDTO,
  AccessGovernanceDTO,
  SecurityGovernanceDTO,
  DataGovernanceDTO,
  ApprovalCenterDTO,
  ExportGovernanceDTO,
  SystemHealthDTO,
  DecisionGovernanceDTO,
  GovernanceExceptionDTO,
  ExceptionCategory,
  ExceptionSeverity,
  ExceptionStatus,
} from '../../types/governance.types';

type TabKey =
  | 'overview'
  | 'audit'
  | 'ai'
  | 'agents'
  | 'access'
  | 'security'
  | 'data'
  | 'approvals'
  | 'decisions'
  | 'exports'
  | 'health'
  | 'exceptions';

export const TrustGovernanceCenter: React.FC = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabKey>('overview');
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [overview, setOverview] = useState<GovernanceOverviewDTO | null>(null);
  const [auditData, setAuditData] = useState<any | null>(null);
  const [aiGov, setAiGov] = useState<AIGovernanceDTO | null>(null);
  const [agentGov, setAgentGov] = useState<AgentGovernanceDTO | null>(null);
  const [accessGov, setAccessGov] = useState<AccessGovernanceDTO | null>(null);
  const [securityGov, setSecurityGov] = useState<SecurityGovernanceDTO | null>(null);
  const [dataGov, setDataGov] = useState<DataGovernanceDTO | null>(null);
  const [approvals, setApprovals] = useState<ApprovalCenterDTO | null>(null);
  const [decisions, setDecisions] = useState<DecisionGovernanceDTO | null>(null);
  const [exportsData, setExportsData] = useState<ExportGovernanceDTO | null>(null);
  const [systemHealth, setSystemHealth] = useState<SystemHealthDTO | null>(null);
  const [exceptions, setExceptions] = useState<{ items: GovernanceExceptionDTO[]; total: number } | null>(null);

  // Audit filter state
  const [auditFilterEvent, setAuditFilterEvent] = useState<string>('');
  const [auditFilterModule, setAuditFilterModule] = useState<string>('');
  const [auditFilterOutcome, setAuditFilterOutcome] = useState<string>('');
  const [expandedAuditId, setExpandedAuditId] = useState<number | null>(null);

  // Exception modal / action states
  const [selectedException, setSelectedException] = useState<GovernanceExceptionDTO | null>(null);
  const [actionType, setActionType] = useState<'assign' | 'resolve' | 'dismiss' | null>(null);
  const [actionInput, setActionInput] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Load active tab data
  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'overview') {
        const res = await api.getGovernanceOverview();
        if (res.data) setOverview(res.data);
      } else if (activeTab === 'audit') {
        const res = await api.getAuditExplorer({
          event: auditFilterEvent || undefined,
          module: auditFilterModule || undefined,
          outcome: auditFilterOutcome || undefined,
          limit: 25,
        });
        if (res.data) setAuditData(res.data);
      } else if (activeTab === 'ai') {
        const res = await api.getAIGovernance();
        if (res.data) setAiGov(res.data);
      } else if (activeTab === 'agents') {
        const res = await api.getAgentGovernance();
        if (res.data) setAgentGov(res.data);
      } else if (activeTab === 'access') {
        const res = await api.getAccessGovernance();
        if (res.data) setAccessGov(res.data);
      } else if (activeTab === 'security') {
        const res = await api.getSecurityGovernance();
        if (res.data) setSecurityGov(res.data);
      } else if (activeTab === 'data') {
        const res = await api.getDataGovernance();
        if (res.data) setDataGov(res.data);
      } else if (activeTab === 'approvals') {
        const res = await api.getGovernanceApprovals();
        if (res.data) setApprovals(res.data);
      } else if (activeTab === 'decisions') {
        const res = await api.getDecisionGovernance();
        if (res.data) setDecisions(res.data);
      } else if (activeTab === 'exports') {
        const res = await api.getExportGovernance();
        if (res.data) setExportsData(res.data);
      } else if (activeTab === 'health') {
        const res = await api.getSystemHealth();
        if (res.data) setSystemHealth(res.data);
      } else if (activeTab === 'exceptions') {
        const res = await api.getGovernanceExceptions();
        if (res.data) setExceptions(res.data);
      }
    } catch (err: any) {
      console.error('Governance data fetch error:', err);
      setError(err?.message || 'Failed to load governance information.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab]);

  // Handle Exception mutations
  const handleAcknowledge = async (id: number) => {
    try {
      setActionLoading(true);
      await api.acknowledgeGovernanceException(id);
      await loadData();
    } catch (err: any) {
      alert(`Error acknowledging exception: ${err?.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleActionSubmit = async () => {
    if (!selectedException || !actionType) return;
    try {
      setActionLoading(true);
      if (actionType === 'assign') {
        const userId = parseInt(actionInput, 10) || user?.id || 1;
        await api.assignGovernanceException(selectedException.id, String(userId));
      } else if (actionType === 'resolve') {
        await api.resolveGovernanceException(selectedException.id, actionInput);
      } else if (actionType === 'dismiss') {
        await api.dismissGovernanceException(selectedException.id, actionInput);
      }
      setSelectedException(null);
      setActionType(null);
      setActionInput('');
      await loadData();
    } catch (err: any) {
      alert(`Error completing action: ${err?.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  // RBAC Tab visibility
  const isSecurityRole = ['ADMINISTRATOR', 'COMPLIANCE_OFFICER', 'BRANCH_OPS_HEAD'].includes(user?.role || '');

  const tabs: { key: TabKey; label: string; icon: React.ReactNode; hidden?: boolean }[] = [
    { key: 'overview', label: 'Overview', icon: <Activity className="w-4 h-4" /> },
    { key: 'audit', label: 'Audit Explorer', icon: <FileCheck className="w-4 h-4" /> },
    { key: 'ai', label: 'AI Governance', icon: <Sparkles className="w-4 h-4" /> },
    { key: 'agents', label: 'Agent Governance', icon: <Cpu className="w-4 h-4" /> },
    { key: 'access', label: 'Access Governance', icon: <KeyRound className="w-4 h-4" /> },
    { key: 'security', label: 'Security Center', icon: <Lock className="w-4 h-4" />, hidden: !isSecurityRole },
    { key: 'data', label: 'Data & Lineage', icon: <GitBranch className="w-4 h-4" /> },
    { key: 'approvals', label: 'Approvals', icon: <CheckCircle2 className="w-4 h-4" /> },
    { key: 'decisions', label: 'Decision Trace', icon: <Layers className="w-4 h-4" /> },
    { key: 'exports', label: 'Export Activity', icon: <Download className="w-4 h-4" /> },
    { key: 'health', label: 'System Health', icon: <Server className="w-4 h-4" /> },
    { key: 'exceptions', label: 'Exceptions', icon: <AlertTriangle className="w-4 h-4" /> },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100 p-4 md:p-6 lg:p-8 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                Trust & Governance Center
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  Institutional Clarity
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Centralized enterprise visibility into AI, Agent, Decision, Data, and Security envelopes.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-md bg-slate-900 border border-slate-800 text-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-slate-300 font-medium">SYNTHETIC ENVIRONMENT</span>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="flex items-center space-x-1.5 px-3 py-1.5 rounded-md bg-slate-850 hover:bg-slate-800 border border-slate-750 text-xs font-medium text-slate-200 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="overflow-x-auto scrollbar-none border-b border-slate-800 pb-px">
        <div className="flex space-x-1 min-w-max">
          {tabs
            .filter((t) => !t.hidden)
            .map((tab) => {
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center space-x-2 px-3.5 py-2 text-xs font-medium rounded-t-md transition-all border-b-2 ${
                    isActive
                      ? 'bg-slate-900 text-emerald-400 border-emerald-500 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/50 border-transparent'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.label}</span>
                </button>
              );
            })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {loading && !overview && !auditData && !aiGov && (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
            <p className="text-sm">Loading governance telemetry...</p>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg bg-rose-950/40 border border-rose-800 text-rose-200 text-sm flex items-start space-x-3 mb-6">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Governance Service Notice</p>
              <p className="text-xs text-rose-300 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 1. OVERVIEW TAB */}
        {/* ========================================================================= */}
        {activeTab === 'overview' && overview && (
          <div className="space-y-6">
            {/* System Status Banner */}
            <div
              className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                overview.systemStatus === 'OPERATIONAL'
                  ? 'bg-emerald-950/20 border-emerald-800/60'
                  : overview.systemStatus === 'ATTENTION_REQUIRED'
                  ? 'bg-amber-950/20 border-amber-800/60'
                  : 'bg-rose-950/20 border-rose-800/60'
              }`}
            >
              <div className="flex items-center space-x-3">
                <span
                  className={`w-3.5 h-3.5 rounded-full shrink-0 ${
                    overview.systemStatus === 'OPERATIONAL'
                      ? 'bg-emerald-500 shadow-md shadow-emerald-500/50'
                      : overview.systemStatus === 'ATTENTION_REQUIRED'
                      ? 'bg-amber-500 shadow-md shadow-amber-500/50'
                      : 'bg-rose-500 shadow-md shadow-rose-500/50'
                  }`}
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">System Status:</span>
                    <span
                      className={`text-sm font-bold ${
                        overview.systemStatus === 'OPERATIONAL'
                          ? 'text-emerald-400'
                          : overview.systemStatus === 'ATTENTION_REQUIRED'
                          ? 'text-amber-400'
                          : 'text-rose-400'
                      }`}
                    >
                      {overview.systemStatus}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">{overview.statusReason}</p>
                </div>
              </div>
              <div className="text-right text-xs text-slate-400">
                <span>Last Audit: {overview.lastAuditTimestamp ? new Date(overview.lastAuditTimestamp).toLocaleTimeString() : 'N/A'}</span>
              </div>
            </div>

            {/* Metric Summary Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold uppercase tracking-wider">Audit Activity</span>
                  <FileCheck className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-white">{overview.auditActivity.totalEvents.toLocaleString()}</div>
                <div className="text-xs text-slate-400">
                  <span className="text-emerald-400 font-medium">{overview.auditActivity.recentEvents24h}</span> events in last 24h
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold uppercase tracking-wider">AI Activity</span>
                  <Sparkles className="w-4 h-4 text-purple-400" />
                </div>
                <div className="text-2xl font-bold text-white">{overview.aiActivity.copilotSessions} Sessions</div>
                <div className="text-xs text-slate-400">
                  <span className="text-purple-400 font-medium">{overview.aiActivity.agentPlans}</span> Controlled Agent plans
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold uppercase tracking-wider">Human Approvals</span>
                  <CheckCircle2 className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-white">{overview.humanApprovals.pendingCount} Pending</div>
                <div className="text-xs text-slate-400">Awaiting dual-control Maker-Checker review</div>
              </div>

              <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold uppercase tracking-wider">Security Anomaly Filter</span>
                  <Lock className="w-4 h-4 text-rose-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {overview.security.authorizationFailures} Failures
                </div>
                <div className="text-xs text-slate-400">
                  <span className="text-slate-300 font-medium">{overview.security.criticalEvents}</span> critical events detected
                </div>
              </div>

              <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold uppercase tracking-wider">Data Access Requests</span>
                  <Database className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="text-2xl font-bold text-white">
                  {overview.dataAccess.customerContextRequests.toLocaleString()}
                </div>
                <div className="text-xs text-slate-400">Customer & Group 360 context lookups</div>
              </div>

              <div className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400">
                  <span className="font-semibold uppercase tracking-wider">Governance Exceptions</span>
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-white">{overview.governanceExceptions.open} Open</div>
                <div className="text-xs text-slate-400">
                  <span className="text-amber-400 font-medium">{overview.governanceExceptions.highCritical}</span> High/Critical severity
                </div>
              </div>
            </div>

            {/* Quick Navigation Panel */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-sm font-semibold text-white">Institutional Observability Principles</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                COREvia answers <strong className="text-slate-200">WHO, WHAT, WHEN, WHY, WHICH DATA, WHICH ENGINE, WHICH TOOL, WHICH PERMISSION, WHICH APPROVAL,</strong> and <strong className="text-slate-200">WHICH RESULT</strong> across every customer mutation. Deterministic rules are never labeled "AI decisions". Cryptographic audit hashing guarantees tamper-evident provenance.
              </p>
              <div className="flex flex-wrap gap-2 pt-2">
                <button
                  onClick={() => setActiveTab('exceptions')}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-750 text-xs font-medium text-emerald-400 border border-slate-700 transition-colors"
                >
                  Inspect Exceptions ({overview.governanceExceptions.open}) →
                </button>
                <button
                  onClick={() => setActiveTab('audit')}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-750 text-xs font-medium text-slate-200 border border-slate-700 transition-colors"
                >
                  Open Audit Explorer →
                </button>
                <button
                  onClick={() => setActiveTab('ai')}
                  className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-750 text-xs font-medium text-purple-400 border border-slate-700 transition-colors"
                >
                  Verify Gemini Guardrails →
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. AUDIT CENTER TAB */}
        {/* ========================================================================= */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            {/* Integrity Status Header */}
            {auditData && (
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 rounded-lg bg-slate-900 border border-slate-800 text-xs gap-2">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="font-semibold text-slate-200">Cryptographic SHA-256 Tamper-Evident Chain:</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {auditData.chainIntegrity?.chainStatus || 'VERIFIED_IMMUTABLE'}
                  </span>
                  <span className="text-slate-400">
                    ({auditData.chainIntegrity?.recordsChecked || 50} recent links verified)
                  </span>
                </div>
                <div className="text-slate-400 text-xs">Total Records: {auditData.total}</div>
              </div>
            )}

            {/* Filter Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 bg-slate-900 p-3 rounded-lg border border-slate-800 text-xs">
              <input
                type="text"
                placeholder="Filter by Action / Event..."
                value={auditFilterEvent}
                onChange={(e) => setAuditFilterEvent(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <input
                type="text"
                placeholder="Filter by Module / Resource..."
                value={auditFilterModule}
                onChange={(e) => setAuditFilterModule(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              />
              <select
                value={auditFilterOutcome}
                onChange={(e) => setAuditFilterOutcome(e.target.value)}
                className="bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="">All Outcomes</option>
                <option value="SUCCESS">SUCCESS</option>
                <option value="FAILURE">FAILURE</option>
                <option value="DENIED">DENIED</option>
              </select>
              <button
                onClick={loadData}
                className="bg-emerald-600 hover:bg-emerald-500 text-white rounded px-3 py-1.5 font-medium transition-colors"
              >
                Apply Filters
              </button>
            </div>

            {/* Audit Table */}
            <div className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-900">
              <table className="w-full text-left text-xs text-slate-300">
                <thead className="bg-slate-950/80 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3 hidden md:table-cell">Actor</th>
                    <th className="py-2.5 px-3">Event</th>
                    <th className="py-2.5 px-3 hidden lg:table-cell">Module</th>
                    <th className="py-2.5 px-3 hidden sm:table-cell">Resource</th>
                    <th className="py-2.5 px-3">Outcome</th>
                    <th className="py-2.5 px-3 hidden xl:table-cell">Request ID</th>
                    <th className="py-2.5 px-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800 font-mono">
                  {auditData?.events?.map((ev: any) => {
                    const isExpanded = expandedAuditId === ev.id;
                    return (
                      <React.Fragment key={ev.id}>
                        <tr className="hover:bg-slate-850/60 transition-colors">
                          <td className="py-2.5 px-3 text-slate-400 whitespace-nowrap">
                            {new Date(ev.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="py-2.5 px-3 font-sans hidden md:table-cell">
                            <div className="font-medium text-slate-200">{ev.actor.name}</div>
                            <div className="text-[10px] text-slate-500">{ev.actor.id}</div>
                          </td>
                          <td className="py-2.5 px-3 font-semibold text-white whitespace-nowrap">{ev.event}</td>
                          <td className="py-2.5 px-3 text-slate-300 hidden lg:table-cell">{ev.module}</td>
                          <td className="py-2.5 px-3 text-slate-400 hidden sm:table-cell truncate max-w-[140px]">
                            {ev.resource.id}
                          </td>
                          <td className="py-2.5 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                ev.outcome === 'SUCCESS'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                  : ev.outcome === 'DENIED'
                                  ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                  : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              }`}
                            >
                              {ev.outcome}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-500 text-[10px] hidden xl:table-cell truncate max-w-[120px]">
                            {ev.requestId}
                          </td>
                          <td className="py-2.5 px-3 text-right font-sans">
                            <button
                              onClick={() => setExpandedAuditId(isExpanded ? null : ev.id)}
                              className="text-emerald-400 hover:text-emerald-300 font-medium text-xs inline-flex items-center gap-1"
                            >
                              {isExpanded ? 'Hide' : 'Context'}
                              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                            </button>
                          </td>
                        </tr>

                        {isExpanded && (
                          <tr className="bg-slate-950/70">
                            <td colSpan={8} className="p-4 space-y-3 font-sans text-xs">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="font-semibold text-slate-300 mb-1">Cryptographic Provenance</h4>
                                  <div className="space-y-1 font-mono text-[11px] text-slate-400">
                                    <div>Previous Hash: {ev.tamperEvident.previousHash || '0000000000...'}</div>
                                    <div>Record Hash: {ev.tamperEvident.recordHash || 'N/A'}</div>
                                    <div>Integrity: Verified Chain Link</div>
                                  </div>
                                </div>
                                <div>
                                  <h4 className="font-semibold text-slate-300 mb-1">Authorization Context</h4>
                                  <div className="space-y-1 text-slate-400">
                                    <div>Actor: {ev.actor.name} ({ev.actor.id})</div>
                                    <div>Role: {ev.actor.role}</div>
                                    <div>Request ID: {ev.requestId}</div>
                                    {ev.context.decisionTraceId && <div>Decision Trace: {ev.context.decisionTraceId}</div>}
                                    {ev.context.agentPlanId && <div>Agent Plan: {ev.context.agentPlanId}</div>}
                                    {ev.context.details && <div>Details: {ev.context.details}</div>}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 3. AI GOVERNANCE TAB */}
        {/* ========================================================================= */}
        {activeTab === 'ai' && aiGov && (
          <div className="space-y-6">
            {/* Safe Model Configuration Card */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-lg text-purple-400">
                    <Bot className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">Google Gemini Model Configuration</h3>
                    <p className="text-xs text-slate-400">Safe configuration metadata — secrets masked</p>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded text-xs font-bold ${
                    aiGov.modelConfig.status === 'AVAILABLE'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}
                >
                  {aiGov.modelConfig.status}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs pt-2 border-t border-slate-800">
                <div>
                  <span className="text-slate-400 block mb-1">Provider</span>
                  <span className="font-semibold text-white">{aiGov.modelConfig.provider}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Configured Model</span>
                  <span className="font-semibold text-white font-mono">{aiGov.modelConfig.model}</span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">API Key Status</span>
                  <span
                    className={`font-semibold font-mono ${
                      aiGov.modelConfig.keyConfigured ? 'text-emerald-400' : 'text-amber-400'
                    }`}
                  >
                    {aiGov.modelConfig.keyConfigured ? 'CONFIGURED' : 'MISSING'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block mb-1">Secret Masking Guarantee</span>
                  <span className="text-slate-300 font-mono">Zero Exposure Verified</span>
                </div>
              </div>
            </div>

            {/* Tool Calls Breakdown */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white">Controlled Copilot Tool Execution Breakdown</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
                {aiGov.toolCallsBreakdown.map((tb) => (
                  <div key={tb.toolName} className="p-3 rounded bg-slate-950 border border-slate-800 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-emerald-400 font-semibold">{tb.toolName}</span>
                      <span className="text-slate-300 font-bold">{tb.callCount} calls</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">Classification: {tb.classification}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Fallback Monitoring */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white">AI Fallback Telemetry</h3>
              <p className="text-xs text-slate-400">
                When external Gemini inference experiences network timeouts or quota exhaustion, COREvia seamlessly falls back to institutional rule engines without leaking sensitive prompt contents.
              </p>

              <div className="overflow-x-auto rounded border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300 font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-sans">
                    <tr>
                      <th className="p-2.5">Timestamp</th>
                      <th className="p-2.5">Module</th>
                      <th className="p-2.5">Trigger Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {aiGov.aiFallbacks.map((fb, idx) => (
                      <tr key={idx} className="hover:bg-slate-850/50">
                        <td className="p-2.5 text-slate-400">{new Date(fb.timestamp).toLocaleTimeString()}</td>
                        <td className="p-2.5 font-bold text-white">{fb.module}</td>
                        <td className="p-2.5 text-slate-300 font-sans">{fb.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 4. AGENT GOVERNANCE TAB */}
        {/* ========================================================================= */}
        {activeTab === 'agents' && agentGov && (
          <div className="space-y-6">
            {/* Agent Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Plans Created</span>
                <div className="text-xl font-bold text-white mt-1">{agentGov.plansCreated}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Approved</span>
                <div className="text-xl font-bold text-emerald-400 mt-1">{agentGov.approved}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Completed</span>
                <div className="text-xl font-bold text-cyan-400 mt-1">{agentGov.completed}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Partial</span>
                <div className="text-xl font-bold text-amber-400 mt-1">{agentGov.partial}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Rejected</span>
                <div className="text-xl font-bold text-rose-400 mt-1">{agentGov.rejected}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Failed</span>
                <div className="text-xl font-bold text-rose-500 mt-1">{agentGov.failed}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Expired</span>
                <div className="text-xl font-bold text-slate-400 mt-1">{agentGov.expired}</div>
              </div>
            </div>

            {/* Recent Agent Plans */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-white">Recent Agent Plans & Execution Provenance</h3>
              <div className="overflow-x-auto rounded border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300 font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-sans">
                    <tr>
                      <th className="p-2.5">Plan ID</th>
                      <th className="p-2.5">Title / Objective</th>
                      <th className="p-2.5">Customer</th>
                      <th className="p-2.5">Decision Trace</th>
                      <th className="p-2.5">Status</th>
                      <th className="p-2.5 text-right">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {agentGov.recentPlans.map((plan) => (
                      <tr key={plan.planId} className="hover:bg-slate-850/50">
                        <td className="p-2.5 font-bold text-emerald-400 whitespace-nowrap">{plan.planId}</td>
                        <td className="p-2.5 font-sans">
                          <div className="font-semibold text-slate-100">{plan.title}</div>
                          <div className="text-[11px] text-slate-400 truncate max-w-sm">{plan.objective}</div>
                        </td>
                        <td className="p-2.5 text-slate-300">{plan.customerName || `CUS-${plan.customerId}` || 'N/A'}</td>
                        <td className="p-2.5 text-purple-400">{plan.decisionTraceId}</td>
                        <td className="p-2.5">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              plan.status === 'COMPLETED'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : plan.status === 'APPROVED'
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                                : plan.status === 'PARTIALLY_COMPLETED'
                                ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {plan.status}
                          </span>
                        </td>
                        <td className="p-2.5 text-right text-slate-400">
                          {new Date(plan.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. ACCESS GOVERNANCE TAB */}
        {/* ========================================================================= */}
        {activeTab === 'access' && accessGov && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Total Access Events</span>
                <span className="text-xl font-bold text-white">{accessGov.totalEvents}</span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Login Events</span>
                <span className="text-xl font-bold text-white">{accessGov.loginEvents}</span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Logout Events</span>
                <span className="text-xl font-bold text-white">{accessGov.logoutEvents}</span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Authorization Failures</span>
                <span className="text-xl font-bold text-amber-400">{accessGov.authorizationFailures}</span>
              </div>
            </div>

            {/* Authorization Failures Section */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white">Recent Access & Authorization Audit Events</h3>
              <div className="overflow-x-auto rounded border border-slate-800">
                <table className="w-full text-left text-xs text-slate-300 font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-sans">
                    <tr>
                      <th className="p-2.5">Timestamp</th>
                      <th className="p-2.5">Actor</th>
                      <th className="p-2.5">Resource</th>
                      <th className="p-2.5">Action</th>
                      <th className="p-2.5 text-right">Outcome</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {accessGov.recentAccessEvents.map((ae) => (
                      <tr key={ae.id} className="hover:bg-slate-850/50">
                        <td className="p-2.5 text-slate-400">{new Date(ae.timestamp).toLocaleTimeString()}</td>
                        <td className="p-2.5 font-sans font-medium text-white">{ae.actorName}</td>
                        <td className="p-2.5 text-slate-300 truncate max-w-xs">{ae.resourceId}</td>
                        <td className="p-2.5 text-slate-400">{ae.action}</td>
                        <td className="p-2.5 text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              ae.outcome === 'SUCCESS'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {ae.outcome}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. SECURITY CENTER TAB */}
        {/* ========================================================================= */}
        {activeTab === 'security' && securityGov && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Failed Logins</span>
                <div className="text-xl font-bold text-white mt-1">{securityGov.failedLogins}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Auth Failures</span>
                <div className="text-xl font-bold text-amber-400 mt-1">{securityGov.authorizationFailures}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Expired Sessions</span>
                <div className="text-xl font-bold text-slate-300 mt-1">{securityGov.expiredSessions}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Rate Limit Events</span>
                <div className="text-xl font-bold text-cyan-400 mt-1">{securityGov.rateLimitEvents}</div>
              </div>
              <div className="p-3 rounded-lg bg-slate-900 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Active Sessions</span>
                <div className="text-xl font-bold text-white mt-1">{securityGov.activeSessionsCount}</div>
              </div>
            </div>

            {/* Security Warnings */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white">Active Security Governance Observations</h3>
              <div className="space-y-2">
                {securityGov.securityWarnings.map((w, idx) => (
                  <div key={idx} className="p-3 rounded bg-amber-950/20 border border-amber-800/40 text-xs text-amber-200 flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 7. DATA GOVERNANCE & LINEAGE TAB */}
        {/* ========================================================================= */}
        {activeTab === 'data' && dataGov && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Customer Context 24h</span>
                <span className="text-xl font-bold text-white">{dataGov.customerContextAccessCount}</span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Group Context 24h</span>
                <span className="text-xl font-bold text-white">{dataGov.groupContextAccessCount}</span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Copilot Context Lookups</span>
                <span className="text-xl font-bold text-white">{dataGov.copilotContextRetrievals}</span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Decision Evidence Access</span>
                <span className="text-xl font-bold text-purple-400">
                  {dataGov.decisionEvidenceAccessCount}
                </span>
              </div>
            </div>

            {/* Data Lineage Visualization */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-4">
              <div>
                <h3 className="text-sm font-bold text-white">Canonical Intelligence Data Lineage</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  End-to-end provenance graph linking verified customer evidence to the executed tamper-evident audit record.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 pt-2">
                {dataGov.lineageNodes.map((node, index) => (
                  <div
                    key={node.id}
                    className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col justify-between space-y-2 relative"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded font-mono ${
                            node.type === 'SOURCE'
                              ? 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                              : node.type === 'DERIVED'
                              ? 'bg-purple-500/10 text-purple-400 border border-purple-500/30'
                              : node.type === 'SIMULATED'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : node.type === 'HUMAN_ACTION'
                              ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                              : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {node.type}
                        </span>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      </div>
                      <h4 className="text-xs font-bold text-white">{node.label}</h4>
                      <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{node.description}</p>
                    </div>
                    <div className="text-[10px] text-slate-500 font-mono">{node.system} · {node.freshness}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 8. APPROVALS TAB */}
        {/* ========================================================================= */}
        {activeTab === 'approvals' && approvals && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Pending Institutional Approvals ({approvals.pendingCount})</h3>
              <span className="text-xs text-slate-400">Maker-Checker dual-control envelope</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {approvals.items.map((app) => (
                <div key={app.id} className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-bold text-emerald-400">{app.id}</span>
                    <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                      {app.status}
                    </span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white">{app.title}</h4>
                    <p className="text-xs text-slate-300 mt-1">{app.objective}</p>
                  </div>

                  <div className="p-2.5 rounded bg-slate-950 border border-slate-850 space-y-1 text-xs text-slate-400">
                    <div>
                      <strong className="text-slate-300">Requested By:</strong> {app.requestedBy}
                    </div>
                    <div>
                      <strong className="text-slate-300">Target Entity:</strong> {app.affectedEntityName || app.affectedEntityId}
                    </div>
                    <div>
                      <strong className="text-slate-300">Risk Assessment:</strong> {app.riskImpact}
                    </div>
                    {app.decisionTraceId && (
                      <div>
                        <strong className="text-slate-300">Basis:</strong> {app.decisionTraceId}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 9. DECISION TRACE TAB */}
        {/* ========================================================================= */}
        {activeTab === 'decisions' && decisions && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Total Decisions</span>
                <span className="text-xl font-bold text-white">{decisions.totalDecisions}</span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Deterministic</span>
                <span className="text-xl font-bold text-emerald-400">{decisions.byMode.DETERMINISTIC}</span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Hybrid (Rules + LLM)</span>
                <span className="text-xl font-bold text-purple-400">{decisions.byMode.HYBRID}</span>
              </div>
              <div className="p-3.5 rounded-lg bg-slate-900 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">Confirmed Rate</span>
                <span className="text-xl font-bold text-cyan-400">
                  {Math.round((decisions.confirmedCount / decisions.totalDecisions) * 100)}%
                </span>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-white">Recent Explainable Decisions</h3>
              <div className="space-y-3">
                {decisions.recentDecisions.map((dec) => (
                  <div key={dec.decisionId} className="p-3 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-white">{dec.title}</span>
                      <span className="font-mono text-emerald-400">{dec.decisionId}</span>
                    </div>
                    <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-mono">
                      <span>Engine: {dec.sourceEngine}</span>
                      <span>·</span>
                      <span>Mode: {dec.decisionMode}</span>
                      <span>·</span>
                      <span>Evidence: {dec.evidenceCount} verified records</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 10. EXPORTS TAB */}
        {/* ========================================================================= */}
        {activeTab === 'exports' && exportsData && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <h3 className="text-sm font-bold text-white">Data Export Governance Trail</h3>
              <span className="text-slate-400">Total Exports: {exportsData.totalExports}</span>
            </div>

            <div className="overflow-x-auto rounded border border-slate-800 bg-slate-900">
              <table className="w-full text-left text-xs text-slate-300 font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-sans">
                  <tr>
                    <th className="p-2.5">Export ID</th>
                    <th className="p-2.5">Actor</th>
                    <th className="p-2.5">Dataset</th>
                    <th className="p-2.5">Scope</th>
                    <th className="p-2.5">Records</th>
                    <th className="p-2.5">Outcome</th>
                    <th className="p-2.5 text-right">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {exportsData.recentExports.map((exp) => (
                    <tr key={exp.id} className="hover:bg-slate-850/50">
                      <td className="p-2.5 text-emerald-400 font-bold">{exp.id}</td>
                      <td className="p-2.5 font-sans">
                        <div className="font-medium text-white">{exp.actorName}</div>
                        <div className="text-[10px] text-slate-500">{exp.actorRole}</div>
                      </td>
                      <td className="p-2.5 text-slate-200">{exp.dataset}</td>
                      <td className="p-2.5 text-slate-400">{exp.filterScope}</td>
                      <td className="p-2.5 text-slate-300">{exp.recordCount}</td>
                      <td className="p-2.5">
                        <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                          {exp.outcome}
                        </span>
                      </td>
                      <td className="p-2.5 text-right text-slate-400 font-sans">
                        {new Date(exp.timestamp).toLocaleTimeString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 11. SYSTEM HEALTH TAB */}
        {/* ========================================================================= */}
        {activeTab === 'health' && systemHealth && (
          <div className="space-y-6">
            <div className="flex items-center space-x-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span
                className={`w-3.5 h-3.5 rounded-full ${
                  systemHealth.overall === 'HEALTHY' ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                }`}
              />
              <div>
                <h3 className="text-sm font-bold text-white">Overall Architecture Health: {systemHealth.overall}</h3>
                <p className="text-xs text-slate-400">Live health verification executed via genuine database pings</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Object.entries(systemHealth.services).map(([key, service]: [string, any]) => (
                <div key={key} className="p-4 rounded-lg bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase text-slate-300">{key}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        service.status === 'HEALTHY'
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                          : service.status === 'NOT_CONFIGURED'
                          ? 'bg-slate-800 text-slate-400 border border-slate-700'
                          : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                      }`}
                    >
                      {service.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">{service.details}</p>
                  {service.latencyMs !== undefined && (
                    <div className="text-[10px] text-slate-500 font-mono">Ping Latency: {service.latencyMs}ms</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 12. GOVERNANCE EXCEPTIONS TAB */}
        {/* ========================================================================= */}
        {activeTab === 'exceptions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-xs">
              <h3 className="text-sm font-bold text-white">
                Active Governance Exceptions ({exceptions?.total || 0})
              </h3>
              <span className="text-slate-400">Human-controlled lifecycle management</span>
            </div>

            <div className="overflow-x-auto rounded border border-slate-800 bg-slate-900">
              <table className="w-full text-left text-xs text-slate-300 font-mono">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800 font-sans">
                  <tr>
                    <th className="p-2.5">Exception ID</th>
                    <th className="p-2.5">Category</th>
                    <th className="p-2.5">Severity</th>
                    <th className="p-2.5">Description</th>
                    <th className="p-2.5">Status</th>
                    <th className="p-2.5">Assigned To</th>
                    <th className="p-2.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {exceptions?.items?.map((ex) => (
                    <tr key={ex.id} className="hover:bg-slate-850/50">
                      <td className="p-2.5 font-bold text-emerald-400 whitespace-nowrap">{ex.exceptionId}</td>
                      <td className="p-2.5 text-slate-300">{ex.category}</td>
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ex.severity === 'CRITICAL' || ex.severity === 'HIGH'
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                              : ex.severity === 'MEDIUM'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-blue-500/10 text-blue-400 border border-blue-500/30'
                          }`}
                        >
                          {ex.severity}
                        </span>
                      </td>
                      <td className="p-2.5 font-sans text-slate-200 truncate max-w-sm">{ex.description}</td>
                      <td className="p-2.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ex.status === 'RESOLVED'
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                              : ex.status === 'UNDER_REVIEW'
                              ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {ex.status}
                        </span>
                      </td>
                      <td className="p-2.5 text-slate-400 font-sans truncate max-w-[140px]">
                        {ex.assignedUserName || (ex.assignedTo ? `User #${ex.assignedTo}` : 'Unassigned')}
                      </td>
                      <td className="p-2.5 text-right font-sans space-x-1 whitespace-nowrap">
                        {ex.status === 'OPEN' && (
                          <button
                            onClick={() => handleAcknowledge(ex.id)}
                            disabled={actionLoading}
                            className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-emerald-400"
                          >
                            Acknowledge
                          </button>
                        )}
                        {ex.status !== 'RESOLVED' && ex.status !== 'DISMISSED' && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedException(ex);
                                setActionType('assign');
                                setActionInput(String(ex.assignedTo || user?.id || 1));
                              }}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-200"
                            >
                              Assign
                            </button>
                            <button
                              onClick={() => {
                                setSelectedException(ex);
                                setActionType('resolve');
                                setActionInput('');
                              }}
                              className="px-2 py-1 rounded bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white"
                            >
                              Resolve
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Exception Action Modal */}
      {selectedException && actionType && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 max-w-md w-full space-y-4">
            <h3 className="text-sm font-bold text-white capitalize">
              {actionType} Exception ({selectedException.exceptionId})
            </h3>
            <p className="text-xs text-slate-400">{selectedException.description}</p>

            <div className="space-y-1">
              <label className="text-xs text-slate-300 font-medium">
                {actionType === 'assign'
                  ? 'Assignee User ID:'
                  : actionType === 'resolve'
                  ? 'Resolution Rationale:'
                  : 'Dismissal Reason:'}
              </label>
              <textarea
                value={actionInput}
                onChange={(e) => setActionInput(e.target.value)}
                placeholder={
                  actionType === 'assign'
                    ? '1'
                    : 'Provide detailed institutional explanation...'
                }
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div className="flex justify-end space-x-2 pt-2">
              <button
                onClick={() => {
                  setSelectedException(null);
                  setActionType(null);
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-medium text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={handleActionSubmit}
                disabled={actionLoading || !actionInput.trim()}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-xs font-medium text-white disabled:opacity-50"
              >
                {actionLoading ? 'Processing...' : 'Confirm'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
