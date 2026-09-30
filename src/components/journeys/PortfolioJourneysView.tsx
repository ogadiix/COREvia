import React, { useState, useEffect } from 'react';
import {
  Milestone,
  Search,
  Filter,
  PlusCircle,
  Clock,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Building2,
  User,
  Layers,
  ArrowRight,
  ShieldCheck,
  ChevronRight,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import { bankingApi } from '../../lib/api';
import { CustomerJourneyDTO, JourneyTemplateDTO, PortfolioJourneyAnalyticsDTO } from '../../types/journey.types';
import { Button } from '../common/Button';
import { useAuth } from '../../context/AuthContext';

interface PortfolioJourneysViewProps {
  onSelectJourney: (journeyId: number | string) => void;
  onNavigateToCustomer?: (customerId: number | string) => void;
}

export const PortfolioJourneysView: React.FC<PortfolioJourneysViewProps> = ({
  onSelectJourney,
  onNavigateToCustomer,
}) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [journeys, setJourneys] = useState<CustomerJourneyDTO[]>([]);
  const [templates, setTemplates] = useState<JourneyTemplateDTO[]>([]);
  const [analytics, setAnalytics] = useState<PortfolioJourneyAnalyticsDTO | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedTemplate, setSelectedTemplate] = useState<string>('ALL');
  const [selectedSla, setSelectedSla] = useState<string>('ALL');

  // Initiate Modal
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createCustomerId, setCreateCustomerId] = useState<string>('1');
  const [createTemplateCode, setCreateTemplateCode] = useState<string>('NEW_CUSTOMER_ONBOARDING');
  const [createPriority, setCreatePriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'>('HIGH');
  const [createNotes, setCreateNotes] = useState<string>('');
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [journeysData, templatesData, analyticsData] = await Promise.all([
        bankingApi.getJourneys({
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
          templateCode: selectedTemplate !== 'ALL' ? selectedTemplate : undefined,
          slaStatus: selectedSla !== 'ALL' ? selectedSla : undefined,
          search: searchQuery.trim() || undefined,
        }),
        bankingApi.getJourneyTemplates(),
        bankingApi.getJourneyAnalytics().catch(() => null),
      ]);

      setJourneys(journeysData || []);
      setTemplates(templatesData || []);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to load portfolio journeys:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedStatus, selectedTemplate, selectedSla]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleCreateJourney = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setCreating(true);
      setCreateError(null);
      const created = await bankingApi.createJourney({
        customerId: Number(createCustomerId),
        templateCode: createTemplateCode,
        priority: createPriority,
        notes: createNotes || undefined,
      });

      setIsCreateModalOpen(false);
      setCreateNotes('');
      await fetchData();
      const newId = (created as any).journey?.id || (created as any).id;
      onSelectJourney(newId);
    } catch (err: any) {
      console.error('Failed to create journey:', err);
      setCreateError(err?.message || 'Failed to initiate customer journey.');
    } finally {
      setCreating(false);
    }
  };

  const activeCount = journeys.filter((j) => j.status === 'IN_PROGRESS' || j.status === 'BLOCKED').length;
  const blockedCount = journeys.filter((j) => j.status === 'BLOCKED').length;
  const slaBreachedCount = journeys.filter((j) => j.slaStatus === 'BREACHED').length;
  const completedCount = journeys.filter((j) => j.status === 'COMPLETED').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-100 text-blue-700 rounded-md">
              <Milestone className="w-5 h-5" />
            </span>
            <h1 className="text-xl font-bold text-slate-900">Customer Journey Orchestrator</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Governed lifecycle management connecting KYC, documents, service recovery, and relationship milestones.
          </p>
        </div>

        <Button
          variant="primary"
          icon={<PlusCircle className="w-4 h-4" />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Initiate New Journey
        </Button>
      </div>

      {/* KPI Metrics Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>Active Journeys</span>
            <Layers className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{activeCount}</div>
          <div className="text-[11px] text-slate-500 mt-1 font-mono">Portfolio In-Flight</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>Blocked Milestones</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-bold text-rose-600 mt-2">{blockedCount}</div>
          <div className="text-[11px] text-rose-700 mt-1 font-mono">Requires RM Attention</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>SLA Breached</span>
            <Clock className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-bold text-amber-600 mt-2">{slaBreachedCount}</div>
          <div className="text-[11px] text-amber-700 mt-1 font-mono">Past Target Date</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs">
          <div className="text-xs text-slate-500 font-medium flex items-center justify-between">
            <span>Completed (30d)</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{completedCount}</div>
          <div className="text-[11px] text-emerald-700 mt-1 font-mono">Verified Outcomes</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by Journey ID, Name, or Customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded text-slate-900 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-600"
            />
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800"
            >
              <option value="ALL">All Statuses</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="BLOCKED">Blocked</option>
              <option value="COMPLETED">Completed</option>
              <option value="ESCALATED">Escalated</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Template Filter */}
            <select
              value={selectedTemplate}
              onChange={(e) => setSelectedTemplate(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800 max-w-xs truncate"
            >
              <option value="ALL">All Templates ({templates.length})</option>
              {templates.map((tpl) => (
                <option key={tpl.templateCode} value={tpl.templateCode}>
                  {tpl.name}
                </option>
              ))}
            </select>

            {/* SLA Status Filter */}
            <select
              value={selectedSla}
              onChange={(e) => setSelectedSla(e.target.value)}
              className="px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white text-slate-800"
            >
              <option value="ALL">All SLAs</option>
              <option value="ON_TRACK">On Track</option>
              <option value="AT_RISK">At Risk</option>
              <option value="BREACHED">Breached</option>
            </select>

            <Button type="submit" size="sm" variant="outline">
              Filter
            </Button>
          </div>
        </form>
      </div>

      {/* Journeys List Table */}
      <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
        {loading ? (
          <div className="p-12 text-center text-slate-500 flex flex-col items-center">
            <RefreshCw className="w-6 h-6 animate-spin text-blue-600 mb-2" />
            <p className="text-xs">Loading customer journeys...</p>
          </div>
        ) : journeys.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            <Milestone className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No Customer Journeys Found</p>
            <p className="text-xs text-slate-400 mt-1">
              No journeys match the active filters or search criteria.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Journey Code & Name</th>
                  <th className="px-4 py-3">Customer</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">SLA Status</th>
                  <th className="px-4 py-3">Progress</th>
                  <th className="px-4 py-3">Assigned Owner</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {journeys.map((j) => {
                  const isBlocked = j.status === 'BLOCKED';
                  const isCompleted = j.status === 'COMPLETED';

                  return (
                    <tr
                      key={j.id}
                      onClick={() => onSelectJourney(j.id)}
                      className={`hover:bg-slate-50/80 cursor-pointer transition-colors ${
                        isBlocked ? 'bg-rose-50/20' : ''
                      }`}
                    >
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{j.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono flex items-center gap-1.5 mt-0.5">
                          <span>{j.journeyCode}</span>
                          <span>•</span>
                          <span>{j.templateName || j.templateCode}</span>
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="font-semibold text-slate-900">
                          {j.customerName || `Customer #${j.customerId}`}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {j.customerCode || 'CUS-N/A'}
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
                            isCompleted
                              ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                              : isBlocked
                              ? 'bg-rose-100 text-rose-800 border-rose-300'
                              : j.status === 'IN_PROGRESS'
                              ? 'bg-blue-100 text-blue-800 border-blue-300'
                              : 'bg-slate-100 text-slate-700 border-slate-200'
                          }`}
                        >
                          {j.status}
                        </span>
                        {j.blockerReason && (
                          <div className="text-[10px] text-rose-700 truncate max-w-xs mt-1" title={j.blockerReason}>
                            ⚠️ {j.blockerReason}
                          </div>
                        )}
                      </td>

                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded ${
                            j.slaStatus === 'BREACHED'
                              ? 'bg-rose-600 text-white'
                              : j.slaStatus === 'AT_RISK'
                              ? 'bg-amber-500 text-white'
                              : 'bg-emerald-600 text-white'
                          }`}
                        >
                          {j.slaStatus}
                        </span>
                        <div className="text-[10px] text-slate-500 mt-1 font-mono">
                          {j.targetCompletionDate
                            ? `Due: ${new Date(j.targetCompletionDate).toLocaleDateString()}`
                            : 'No target set'}
                        </div>
                      </td>

                      <td className="px-4 py-3 min-w-[120px]">
                        <div className="flex items-center justify-between text-[11px] font-semibold mb-1">
                          <span>{j.progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              isBlocked ? 'bg-rose-500' : 'bg-blue-600'
                            }`}
                            style={{ width: `${j.progressPercentage}%` }}
                          />
                        </div>
                      </td>

                      <td className="px-4 py-3">
                        <div className="text-slate-800 font-medium">{j.ownerName || 'Unassigned'}</div>
                        <div className="text-[10px] text-slate-500 font-mono">{j.ownerRole}</div>
                      </td>

                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectJourney(j.id);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-800 font-semibold inline-flex items-center gap-1 cursor-pointer"
                        >
                          <span>Open</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* MODAL: Initiate Journey */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 p-4">
          <div className="bg-white rounded-lg max-w-lg w-full p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Milestone className="w-5 h-5 text-blue-600" />
                Initiate Governed Customer Journey
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ×
              </button>
            </div>

            {createError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-md">
                {createError}
              </div>
            )}

            <form onSubmit={handleCreateJourney} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Customer ID or CIF</label>
                <input
                  type="number"
                  value={createCustomerId}
                  onChange={(e) => setCreateCustomerId(e.target.value)}
                  placeholder="e.g. 1"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900 font-mono"
                  required
                />
                <span className="text-[11px] text-slate-400">
                  Customer 1: Rahul Sharma | Customer 2: Kalyan Jewellers | Customer 3: Anita Desai
                </span>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Standard Lifecycle Template</label>
                <select
                  value={createTemplateCode}
                  onChange={(e) => setCreateTemplateCode(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900"
                >
                  {templates.map((tpl) => (
                    <option key={tpl.templateCode} value={tpl.templateCode}>
                      {tpl.name} ({tpl.targetDurationDays}d SLA)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Priority</label>
                <select
                  value={createPriority}
                  onChange={(e) => setCreatePriority(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900"
                >
                  <option value="LOW">Low Priority</option>
                  <option value="MEDIUM">Medium Priority</option>
                  <option value="HIGH">High Priority</option>
                  <option value="CRITICAL">Critical Priority</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Initiation Notes</label>
                <textarea
                  rows={3}
                  value={createNotes}
                  onChange={(e) => setCreateNotes(e.target.value)}
                  placeholder="Optional context or instructions for assigned milestone officers..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md bg-white text-slate-900"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsCreateModalOpen(false)}
                  disabled={creating}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="primary" size="sm" disabled={creating}>
                  {creating ? 'Initiating...' : 'Launch Lifecycle Journey'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
