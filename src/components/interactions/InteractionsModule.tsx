import React, { useState, useEffect, useMemo } from 'react';
import {
  MessageSquare,
  Plus,
  Search,
  Filter,
  RefreshCw,
  Download,
  Calendar,
  Phone,
  Mail,
  Video,
  Users,
  Building2,
  Clock,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  CheckSquare,
  Briefcase,
  LifeBuoy,
  FileText,
  UserCheck,
  TrendingUp,
  LayoutList,
  SlidersHorizontal,
  X,
  ChevronRight,
  Shield,
  Activity,
} from 'lucide-react';
import {
  InteractionItem,
  InteractionMetricsOverview,
  InteractionChannel,
  InteractionType,
  InteractionOutcome,
  InteractionSentiment,
} from '../../types';
import { RecordInteractionModal } from './RecordInteractionModal';
import { InteractionDetailDrawer } from './InteractionDetailDrawer';
import { CommunicationProfileWidget } from './CommunicationProfileWidget';

interface InteractionsModuleProps {
  initialCustomerId?: number;
  onNavigateToCustomer?: (customerId: number) => void;
}

export const InteractionsModule: React.FC<InteractionsModuleProps> = ({
  initialCustomerId,
  onNavigateToCustomer,
}) => {
  // Data state
  const [interactions, setInteractions] = useState<InteractionItem[]>([]);
  const [metrics, setMetrics] = useState<InteractionMetricsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  // Filter state
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<number | ''>(initialCustomerId || '');
  const [selectedChannel, setSelectedChannel] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('');
  const [selectedOutcome, setSelectedOutcome] = useState<string>('');
  const [selectedSentiment, setSelectedSentiment] = useState<string>('');
  const [followupFilter, setFollowupFilter] = useState<'ALL' | 'REQUIRED' | 'NONE'>('ALL');
  const [viewMode, setViewMode] = useState<'TIMELINE' | 'TABLE'>('TIMELINE');
  const [page, setPage] = useState(1);

  // Active interaction & modals
  const [selectedInteraction, setSelectedInteraction] = useState<InteractionItem | null>(null);
  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);

  // Fetch interactions and metrics
  const fetchInteractions = async () => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      if (selectedCustomer) queryParams.set('customerId', String(selectedCustomer));
      if (selectedChannel) queryParams.set('channel', selectedChannel);
      if (selectedType) queryParams.set('interactionType', selectedType);
      if (selectedOutcome) queryParams.set('outcome', selectedOutcome);
      if (selectedSentiment) queryParams.set('sentiment', selectedSentiment);
      if (followupFilter === 'REQUIRED') queryParams.set('followupRequired', 'true');
      if (followupFilter === 'NONE') queryParams.set('followupRequired', 'false');
      if (search.trim()) queryParams.set('search', search.trim());
      queryParams.set('page', String(page));
      queryParams.set('limit', '50');

      const [listRes, metricsRes] = await Promise.all([
        fetch(`/api/interactions?${queryParams.toString()}`, { credentials: 'include' }),
        fetch(`/api/interactions/metrics${selectedCustomer ? `?customerId=${selectedCustomer}` : ''}`, {
          credentials: 'include',
        }),
      ]);

      if (listRes.ok) {
        const listData = await listRes.json();
        setInteractions(listData.data || []);
        setTotalCount(listData.total || 0);
      }

      if (metricsRes.ok) {
        const metricsData = await metricsRes.json();
        setMetrics(metricsData);
      }
    } catch (err) {
      console.error('Failed to load interactions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInteractions();
  }, [
    selectedCustomer,
    selectedChannel,
    selectedType,
    selectedOutcome,
    selectedSentiment,
    followupFilter,
    search,
    page,
  ]);

  const channelIcons: Record<string, React.ReactNode> = {
    PHONE: <Phone className="w-3.5 h-3.5 text-blue-600" />,
    IN_PERSON: <Users className="w-3.5 h-3.5 text-emerald-600" />,
    VIDEO: <Video className="w-3.5 h-3.5 text-indigo-600" />,
    EMAIL: <Mail className="w-3.5 h-3.5 text-slate-600" />,
    BRANCH: <Building2 className="w-3.5 h-3.5 text-amber-600" />,
    CHAT: <MessageSquare className="w-3.5 h-3.5 text-purple-600" />,
    MESSAGE: <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />,
    PORTAL: <Building2 className="w-3.5 h-3.5 text-cyan-600" />,
    ONBOARDING: <UserCheck className="w-3.5 h-3.5 text-rose-600" />,
    OTHER: <MessageSquare className="w-3.5 h-3.5 text-slate-500" />,
  };

  const outcomeColors: Record<string, string> = {
    FOLLOW_UP_REQUIRED: 'bg-amber-50 text-amber-800 border-amber-200',
    OPPORTUNITY_IDENTIFIED: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    OPPORTUNITY_PROGRESS: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    SERVICE_RESOLVED: 'bg-blue-50 text-blue-800 border-blue-200',
    SERVICE_ESCALATED: 'bg-rose-50 text-rose-800 border-rose-200',
    DOCUMENT_REQUESTED: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    ONBOARDING_PROGRESS: 'bg-purple-50 text-purple-800 border-purple-200',
    COMMITMENT_MADE: 'bg-teal-50 text-teal-800 border-teal-200',
    CUSTOMER_REQUEST: 'bg-sky-50 text-sky-800 border-sky-200',
    NO_ACTION_REQUIRED: 'bg-slate-50 text-slate-700 border-slate-200',
  };

  const sentimentColors: Record<string, string> = {
    POSITIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    NEUTRAL: 'bg-slate-50 text-slate-700 border-slate-200',
    CONCERNED: 'bg-amber-50 text-amber-700 border-amber-200',
    ESCALATED: 'bg-rose-50 text-rose-700 border-rose-200',
  };

  const handleExportCSV = () => {
    if (interactions.length === 0) return;
    const headers = [
      'Reference',
      'Date',
      'Customer',
      'Channel',
      'Type',
      'Subject',
      'Outcome',
      'Sentiment',
      'Followup Required',
      'Followup Action',
      'RM / Officer',
    ];
    const rows = interactions.map((i) => [
      i.interactionReference,
      i.timestamp,
      `"${i.customerName || ''}"`,
      i.channel,
      i.interactionType,
      `"${i.subject.replace(/"/g, '""')}"`,
      i.outcome,
      i.sentiment,
      i.followupRequired ? 'YES' : 'NO',
      `"${(i.followupAction || '').replace(/"/g, '""')}"`,
      `"${i.ownerName || ''}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `COREvia_Interactions_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedCustomer('');
    setSelectedChannel('');
    setSelectedType('');
    setSelectedOutcome('');
    setSelectedSentiment('');
    setFollowupFilter('ALL');
  };

  const hasActiveFilters =
    search || selectedCustomer || selectedChannel || selectedType || selectedOutcome || selectedSentiment || followupFilter !== 'ALL';

  return (
    <div id="interactions-hub-module" className="space-y-5 text-xs text-slate-800 max-w-7xl mx-auto">
      {/* Module Title Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="p-1.5 bg-sky-100 text-sky-700 rounded-md">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900">
              Customer Communication & Interaction Hub
            </h1>
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-sky-50 text-sky-800 border border-sky-200">
              Phase 24
            </span>
          </div>
          <p className="text-slate-500 text-xs">
            Complete, chronological, structured record of customer interactions, touchpoints, commitments, and follow-ups across the relationship lifecycle.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="btn-export-interactions"
            onClick={handleExportCSV}
            className="px-3 py-2 border border-slate-300 text-slate-700 font-medium rounded-md hover:bg-slate-50 flex items-center gap-1.5 transition-colors shadow-2xs"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            id="btn-open-record-interaction"
            onClick={() => setIsRecordModalOpen(true)}
            className="px-4 py-2 bg-slate-900 text-white font-medium rounded-md hover:bg-slate-800 flex items-center gap-1.5 transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            <span>Record Touchpoint</span>
          </button>
        </div>
      </div>

      {/* Metrics Banner */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
          <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
            <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Recorded
            </span>
            <span className="text-xl font-bold text-slate-900 mt-1 block">{metrics.totalInteractions}</span>
            <span className="text-[10px] text-slate-400">All touchpoints</span>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
            <span className="text-[10px] font-semibold text-amber-700 uppercase tracking-wider block">
              Follow-ups Pending
            </span>
            <span className="text-xl font-bold text-amber-900 mt-1 block">
              {metrics.followUpsRequiredCount}
            </span>
            <span className="text-[10px] text-amber-600">Action items</span>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
            <span className="text-[10px] font-semibold text-rose-700 uppercase tracking-wider block">
              Follow-ups Overdue
            </span>
            <span className="text-xl font-bold text-rose-900 mt-1 block">
              {metrics.followUpsOverdueCount}
            </span>
            <span className="text-[10px] text-rose-500">Past target date</span>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
            <span className="text-[10px] font-semibold text-emerald-700 uppercase tracking-wider block">
              Linked to Deals
            </span>
            <span className="text-xl font-bold text-emerald-900 mt-1 block">
              {metrics.linkedToOpportunitiesCount}
            </span>
            <span className="text-[10px] text-emerald-600">Pipeline active</span>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
            <span className="text-[10px] font-semibold text-blue-700 uppercase tracking-wider block">
              Linked to Cases
            </span>
            <span className="text-xl font-bold text-blue-900 mt-1 block">
              {metrics.linkedToCasesCount}
            </span>
            <span className="text-[10px] text-blue-600">Service desk</span>
          </div>

          <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-2xs">
            <span className="text-[10px] font-semibold text-sky-700 uppercase tracking-wider block">
              Recent (30 Days)
            </span>
            <span className="text-xl font-bold text-sky-900 mt-1 block">{metrics.recentCount}</span>
            <span className="text-[10px] text-sky-600">Active engagement</span>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              id="input-search-interactions"
              type="text"
              placeholder="Search by topic, summary, customer name, or reference (e.g. INT-2026-000481)..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-300 rounded-md focus:bg-white focus:ring-1 focus:ring-slate-900"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 border border-slate-200 p-0.5 rounded-md bg-slate-50">
            <button
              id="btn-view-timeline"
              onClick={() => setViewMode('TIMELINE')}
              className={`px-3 py-1.5 rounded font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'TIMELINE' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>Timeline Feed</span>
            </button>
            <button
              id="btn-view-table"
              onClick={() => setViewMode('TABLE')}
              className={`px-3 py-1.5 rounded font-semibold flex items-center gap-1.5 transition-colors ${
                viewMode === 'TABLE' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <LayoutList className="w-3.5 h-3.5" />
              <span>Table Grid</span>
            </button>
          </div>

          <button
            id="btn-refresh-interactions"
            onClick={fetchInteractions}
            className="p-2 border border-slate-300 text-slate-600 rounded-md hover:bg-slate-50"
            title="Refresh List"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 pt-2 border-t border-slate-100">
          <div>
            <select
              id="filter-channel"
              value={selectedChannel}
              onChange={(e) => {
                setSelectedChannel(e.target.value);
                setPage(1);
              }}
              className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-[11px]"
            >
              <option value="">All Channels</option>
              <option value="PHONE">Phone Calls</option>
              <option value="IN_PERSON">In-Person Meetings</option>
              <option value="VIDEO">Video Conferences</option>
              <option value="EMAIL">Email Dispatch</option>
              <option value="BRANCH">Branch Visits</option>
              <option value="CHAT">Portal Chats</option>
              <option value="MESSAGE">WhatsApp / SMS</option>
              <option value="PORTAL">Corporate Portal</option>
              <option value="ONBOARDING">KYC Desk</option>
            </select>
          </div>

          <div>
            <select
              id="filter-type"
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setPage(1);
              }}
              className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-[11px]"
            >
              <option value="">All Types</option>
              <option value="CALL">Call</option>
              <option value="MEETING">Strategic Meeting</option>
              <option value="VIDEO_MEETING">Video Meeting</option>
              <option value="BRANCH_VISIT">Branch Visit</option>
              <option value="EMAIL">Email</option>
              <option value="CHAT">Chat</option>
              <option value="MESSAGE">Message</option>
              <option value="SERVICE_CONTACT">Service Contact</option>
              <option value="RELATIONSHIP_REVIEW">Relationship Review</option>
              <option value="ONBOARDING_CONTACT">Onboarding Contact</option>
            </select>
          </div>

          <div>
            <select
              id="filter-outcome"
              value={selectedOutcome}
              onChange={(e) => {
                setSelectedOutcome(e.target.value);
                setPage(1);
              }}
              className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-[11px]"
            >
              <option value="">All Outcomes</option>
              <option value="FOLLOW_UP_REQUIRED">Follow-up Required</option>
              <option value="OPPORTUNITY_IDENTIFIED">Opportunity Identified</option>
              <option value="OPPORTUNITY_PROGRESS">Opportunity Progress</option>
              <option value="SERVICE_RESOLVED">Service Resolved</option>
              <option value="SERVICE_ESCALATED">Service Escalated</option>
              <option value="DOCUMENT_REQUESTED">Document Requested</option>
              <option value="ONBOARDING_PROGRESS">Onboarding Progress</option>
              <option value="COMMITMENT_MADE">Commitment Made</option>
              <option value="NO_ACTION_REQUIRED">No Action Required</option>
            </select>
          </div>

          <div>
            <select
              id="filter-sentiment"
              value={selectedSentiment}
              onChange={(e) => {
                setSelectedSentiment(e.target.value);
                setPage(1);
              }}
              className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-[11px]"
            >
              <option value="">All Sentiments</option>
              <option value="POSITIVE">Positive</option>
              <option value="NEUTRAL">Neutral</option>
              <option value="CONCERNED">Concerned</option>
              <option value="ESCALATED">Escalated</option>
            </select>
          </div>

          <div>
            <select
              id="filter-followup"
              value={followupFilter}
              onChange={(e) => {
                setFollowupFilter(e.target.value as any);
                setPage(1);
              }}
              className="w-full p-1.5 bg-slate-50 border border-slate-300 rounded text-[11px]"
            >
              <option value="ALL">All Touchpoints</option>
              <option value="REQUIRED">Follow-ups Required Only</option>
              <option value="NONE">No Follow-up Required</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              id="btn-clear-filters"
              onClick={clearFilters}
              className="w-full py-1.5 px-2 bg-rose-50 text-rose-700 border border-rose-200 rounded font-medium hover:bg-rose-100 flex items-center justify-center gap-1"
            >
              <X className="w-3 h-3" /> Clear Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column: List / Timeline (8 or 12 cols) */}
        <div className={`${selectedCustomer ? 'lg:col-span-8' : 'lg:col-span-8'} space-y-4`}>
          {loading && interactions.length === 0 ? (
            <div className="p-8 text-center bg-white border border-slate-200 rounded-lg">
              <RefreshCw className="w-6 h-6 animate-spin text-slate-400 mx-auto mb-2" />
              <span className="text-slate-500 font-medium">Loading interaction records...</span>
            </div>
          ) : interactions.length === 0 ? (
            <div className="p-12 text-center bg-white border border-slate-200 rounded-lg space-y-3">
              <MessageSquare className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="font-bold text-slate-800 text-sm">No interactions matching criteria</div>
              <p className="text-slate-500 max-w-sm mx-auto text-xs">
                Try clearing active filters or record a new customer interaction to initiate the chronological log.
              </p>
              <button
                onClick={() => setIsRecordModalOpen(true)}
                className="px-4 py-2 bg-slate-900 text-white rounded-md font-medium hover:bg-slate-800 inline-flex items-center gap-1.5 shadow-2xs"
              >
                <Plus className="w-4 h-4" /> Record Touchpoint
              </button>
            </div>
          ) : viewMode === 'TIMELINE' ? (
            /* Timeline View */
            <div className="space-y-3">
              {interactions.map((item) => {
                const dateObj = new Date(item.timestamp);
                const isFollowupPending = item.followupRequired && item.followupDate;
                return (
                  <div
                    key={item.id}
                    id={`interaction-card-${item.id}`}
                    onClick={() => setSelectedInteraction(item)}
                    className="p-4 bg-white border border-slate-200 hover:border-slate-400 rounded-lg shadow-2xs transition-all cursor-pointer group hover:shadow-xs space-y-3"
                  >
                    {/* Top Row */}
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-slate-100 font-mono text-[10px] font-bold text-slate-700 rounded border border-slate-200">
                          {item.interactionReference}
                        </span>
                        <div className="flex items-center gap-1 px-2 py-0.5 bg-slate-50 text-slate-700 rounded border border-slate-200 font-semibold text-[11px]">
                          {channelIcons[item.channel] || <Phone className="w-3.5 h-3.5 text-slate-500" />}
                          <span>{item.channel.replace('_', ' ')}</span>
                        </div>
                        <span className="text-[11px] text-slate-400">•</span>
                        <span className="text-[11px] font-medium text-slate-600">
                          {item.interactionType.replace('_', ' ')}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-slate-400 text-[11px]">
                        <Clock className="w-3 h-3" />
                        <span>
                          {dateObj.toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                          })}{' '}
                          at{' '}
                          {dateObj.toLocaleTimeString('en-IN', {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                        {item.duration && (
                          <span className="bg-slate-100 px-1.5 py-0.2 rounded text-[10px] text-slate-600 font-mono">
                            {item.duration}m
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Customer & Subject */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-slate-900 group-hover:text-sky-700 transition-colors">
                          {item.customerName || 'Customer Entity'}
                        </span>
                        {item.customerCode && (
                          <span className="text-[10px] font-mono text-slate-400">({item.customerCode})</span>
                        )}
                        <span className="text-slate-300">|</span>
                        <span className="text-slate-500 text-[11px]">Officer: {item.ownerName || 'Bank RM'}</span>
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 leading-snug">{item.subject}</h3>
                    </div>

                    {/* Summary Excerpt */}
                    <p className="text-slate-600 line-clamp-2 leading-relaxed text-xs">{item.summary}</p>

                    {/* Follow-up Banner if required */}
                    {item.followupRequired && (
                      <div className="p-2.5 bg-amber-50/80 border border-amber-200 rounded flex items-center justify-between text-[11px]">
                        <div className="flex items-center gap-2 min-w-0">
                          <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
                          <span className="font-semibold text-amber-900 truncate">
                            Follow-up: {item.followupAction || item.subject}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {item.followupDate && (
                            <span className="text-[10px] font-medium text-amber-800">
                              Target:{' '}
                              {new Date(item.followupDate).toLocaleDateString('en-IN', {
                                day: 'numeric',
                                month: 'short',
                              })}
                            </span>
                          )}
                          {item.followupPriority && (
                            <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-amber-200 text-amber-900">
                              {item.followupPriority}
                            </span>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Bottom Status Tags & Cross Links */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            outcomeColors[item.outcome] || 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {item.outcome.replace(/_/g, ' ')}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            sentimentColors[item.sentiment] || 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {item.sentiment}
                        </span>

                        {item.commitments && item.commitments.length > 0 && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-teal-50 text-teal-800 border border-teal-200 flex items-center gap-1">
                            <CheckSquare className="w-3 h-3" />
                            <span>{item.commitments.length} Commitment(s)</span>
                          </span>
                        )}

                        {item.linkedOpportunityId && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                            <Briefcase className="w-3 h-3" /> Deal #{item.linkedOpportunityId}
                          </span>
                        )}

                        {item.linkedCaseId && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-blue-800 border border-blue-200 flex items-center gap-1">
                            <LifeBuoy className="w-3 h-3" /> Case #{item.linkedCaseId}
                          </span>
                        )}

                        {item.linkedOnboardingId && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-purple-50 text-purple-800 border border-purple-200 flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> KYC #{item.linkedOnboardingId}
                          </span>
                        )}
                      </div>

                      <span className="text-[11px] font-semibold text-sky-600 group-hover:translate-x-0.5 transition-transform flex items-center">
                        Dossier <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table Grid View */
            <div className="bg-white border border-slate-200 rounded-lg overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 text-[10px] font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-2.5 px-3">Reference</th>
                    <th className="py-2.5 px-3">Date</th>
                    <th className="py-2.5 px-3">Customer</th>
                    <th className="py-2.5 px-3">Channel / Type</th>
                    <th className="py-2.5 px-3">Subject</th>
                    <th className="py-2.5 px-3">Outcome</th>
                    <th className="py-2.5 px-3">Sentiment</th>
                    <th className="py-2.5 px-3">Follow-up</th>
                    <th className="py-2.5 px-3">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {interactions.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => setSelectedInteraction(item)}
                      className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                    >
                      <td className="py-2.5 px-3 font-mono font-bold text-[11px] text-slate-700 whitespace-nowrap">
                        {item.interactionReference}
                      </td>
                      <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                        {new Date(item.timestamp).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                        })}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-slate-900 whitespace-nowrap">
                        {item.customerName || 'Customer'}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1 font-medium text-slate-700">
                          {channelIcons[item.channel]}
                          <span>{item.channel}</span>
                        </div>
                      </td>
                      <td className="py-2.5 px-3 max-w-xs truncate font-medium text-slate-800" title={item.subject}>
                        {item.subject}
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                            outcomeColors[item.outcome] || 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {item.outcome.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        <span
                          className={`px-1.5 py-0.2 rounded text-[10px] font-bold border ${
                            sentimentColors[item.sentiment] || 'bg-slate-100 text-slate-800'
                          }`}
                        >
                          {item.sentiment}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 whitespace-nowrap">
                        {item.followupRequired ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900">
                            Required
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedInteraction(item);
                          }}
                          className="text-sky-600 hover:text-sky-800 font-semibold"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Column: Customer Communication Profile & Recent Context */}
        <div className="lg:col-span-4 space-y-4">
          {selectedCustomer ? (
            <CommunicationProfileWidget
              customerId={Number(selectedCustomer)}
              customerName={interactions[0]?.customerName}
              onViewAllInteractions={() => setSelectedCustomer('')}
            />
          ) : (
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-slate-800 font-bold uppercase tracking-wider text-xs">
                <Activity className="w-4 h-4 text-sky-600" />
                <span>Client Communication Intelligence</span>
              </div>
              <p className="text-slate-500 text-xs leading-relaxed">
                Filter by a specific customer or click on any touchpoint to load their full Customer 360 Communication Profile, contact cadence metrics, channel breakdown, and sentiment trajectory.
              </p>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-2">
                <span className="font-semibold text-slate-700 block">Quick Filters by Relationship</span>
                <div className="flex flex-wrap gap-1.5">
                  {Array.from(new Map(interactions.map((i) => [i.customerId, i.customerName])).entries())
                    .filter(([_, name]) => Boolean(name))
                    .slice(0, 6)
                    .map(([id, name]) => (
                      <button
                        key={id}
                        onClick={() => setSelectedCustomer(id)}
                        className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] font-medium text-slate-700 hover:bg-sky-50 hover:text-sky-800 hover:border-sky-300 transition-colors"
                      >
                        {name}
                      </button>
                    ))}
                </div>
              </div>
            </div>
          )}

          {/* Regulatory & Institutional Compliance Note */}
          <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-600 text-[11px] space-y-1.5">
            <div className="flex items-center gap-1.5 text-slate-800 font-bold">
              <Shield className="w-3.5 h-3.5 text-emerald-600" />
              <span>Institutional Record Governance</span>
            </div>
            <p className="text-slate-500 leading-normal">
              All interaction entries are subject to immutable audit logging in accordance with RBI guidelines on customer relationship records, credit reviews, and grievance handling.
            </p>
          </div>
        </div>
      </div>

      {/* Record Interaction Modal */}
      <RecordInteractionModal
        isOpen={isRecordModalOpen}
        onClose={() => setIsRecordModalOpen(false)}
        onSuccess={() => {
          fetchInteractions();
        }}
        initialCustomerId={selectedCustomer ? Number(selectedCustomer) : undefined}
      />

      {/* Interaction Detail Slide-Over Drawer */}
      <InteractionDetailDrawer
        interaction={selectedInteraction}
        onClose={() => setSelectedInteraction(null)}
        onCustomerSelect={(cid) => {
          if (onNavigateToCustomer) onNavigateToCustomer(cid);
        }}
        onCommitmentUpdated={() => {
          fetchInteractions();
        }}
        onDeleted={() => {
          fetchInteractions();
          setSelectedInteraction(null);
        }}
      />
    </div>
  );
};
