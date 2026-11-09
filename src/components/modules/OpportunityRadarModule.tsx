import React, { useState, useEffect } from 'react';
import { bankingApi } from '../../lib/api';
import type { OpportunityRadarSignal, RadarSummaryStats } from '../../types';
import { RadarSignalCard } from '../radar/RadarSignalCard';
import { RadarEvidenceModal } from '../radar/RadarEvidenceModal';
import { ConvertOpportunityModal } from '../radar/ConvertOpportunityModal';
import { DismissRadarModal } from '../radar/DismissRadarModal';
import { DecisionTracePanel } from '../decision-trace/DecisionTracePanel';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import {
  Radar,
  RefreshCw,
  Search,
  Filter,
  Layers,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  DollarSign,
  Package,
  ShieldCheck,
  Sparkles,
  ArrowUpDown,
  Clock,
  ExternalLink,
  X,
  SlidersHorizontal,
} from 'lucide-react';

interface OpportunityRadarModuleProps {
  onNavigateToCustomer: (customerId: number) => void;
  onNavigateToOpportunities?: () => void;
}

export const OpportunityRadarModule: React.FC<OpportunityRadarModuleProps> = ({
  onNavigateToCustomer,
  onNavigateToOpportunities,
}) => {
  const [signals, setSignals] = useState<OpportunityRadarSignal[]>([]);
  const [stats, setStats] = useState<RadarSummaryStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recalculating, setRecalculating] = useState(false);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Filters & Search
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ACTIVE');
  const [sortBy, setSortBy] = useState<'relevance' | 'priority' | 'date' | 'customer'>('relevance');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [selectedEvidenceSignal, setSelectedEvidenceSignal] = useState<OpportunityRadarSignal | null>(null);
  const [selectedConvertSignal, setSelectedConvertSignal] = useState<OpportunityRadarSignal | null>(null);
  const [selectedDismissSignal, setSelectedDismissSignal] = useState<OpportunityRadarSignal | null>(null);
  const [selectedDecisionId, setSelectedDecisionId] = useState<string | null>(null);

  const fetchSignals = async () => {
    setLoading(true);
    try {
      let statusParam: string | undefined = undefined;
      if (statusFilter === 'ACTIVE') {
        statusParam = undefined; // backend defaults to DETECTED, REVIEW_SUGGESTED
      } else if (statusFilter !== 'ALL') {
        statusParam = statusFilter;
      } else {
        statusParam = 'ALL';
      }

      const res = await bankingApi.getOpportunityRadar({
        category: categoryFilter === 'ALL' ? undefined : categoryFilter,
        signalType: typeFilter === 'ALL' ? undefined : typeFilter,
        priority: priorityFilter === 'ALL' ? undefined : priorityFilter,
        status: statusParam,
        search: searchTerm.trim() || undefined,
        sortBy,
        sortOrder,
        page,
        limit: 20,
      });

      setSignals(res.signals || []);
      setTotalPages(res.totalPages || 1);
      setTotalCount(res.total || 0);
    } catch (err) {
      console.error('Failed to load opportunity radar signals:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await bankingApi.getOpportunityRadarStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load radar stats:', err);
    }
  };

  useEffect(() => {
    fetchSignals();
  }, [categoryFilter, typeFilter, priorityFilter, statusFilter, sortBy, sortOrder, page]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchSignals();
  };

  const handleRecalculateAll = async () => {
    setRecalculating(true);
    setNotification(null);
    try {
      const res = await bankingApi.recalculateAllRadar();
      await fetchSignals();
      await fetchStats();
      setNotification({
        type: 'success',
        message: `Opportunity Radar refreshed across ${res.processed} customer portfolios (${res.generated} active signals).`,
      });
      setTimeout(() => setNotification(null), 5000);
    } catch (err: any) {
      setNotification({
        type: 'error',
        message: err.message || 'Failed to recalculate radar signals.',
      });
    } finally {
      setRecalculating(false);
    }
  };

  const handleReview = async (signal: OpportunityRadarSignal) => {
    try {
      await bankingApi.reviewRadarSignal(signal.id);
      await fetchSignals();
      await fetchStats();
    } catch (err) {
      console.error('Failed to review radar signal:', err);
    }
  };

  const handleConversionSuccess = async (opp: any, radarSignal: OpportunityRadarSignal) => {
    await fetchSignals();
    await fetchStats();
    setNotification({
      type: 'success',
      message: `Successfully created Opportunity ${opp.opportunityCode} for ${radarSignal.customerName || 'customer'}!`,
    });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleDismissSuccess = async () => {
    await fetchSignals();
    await fetchStats();
    setNotification({
      type: 'success',
      message: 'Radar signal dismissed and audit logged.',
    });
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 border-b border-[#DCE3EA] dark:border-[#33485D] pb-3">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#142C45] dark:bg-[#168C83] text-white">
              <Radar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-[#142C45] dark:text-[#E8EEF5] tracking-tight">
                  Signal to Action & Opportunity Radar
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-medium bg-[#168C83]/10 text-[#168C83] border border-[#168C83]/30">
                  Deterministic AI Engine
                </span>
              </div>
              <p className="text-xs text-[#5D6B7B] dark:text-[#A9BACB] mt-0.5">
                Deterministic, explainable relationship opportunities & product coverage gaps from verified CRM data
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleRecalculateAll}
            disabled={recalculating}
            className="flex items-center gap-2 text-xs font-medium border-[#DCE3EA] dark:border-[#33485D] text-[#273444] dark:text-[#E8EEF5]"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${recalculating ? 'animate-spin text-[#168C83]' : ''}`} />
            <span>{recalculating ? 'Scanning Portfolios...' : 'Recalculate All'}</span>
          </Button>

          {onNavigateToOpportunities && (
            <Button
              variant="primary"
              onClick={onNavigateToOpportunities}
              className="flex items-center gap-1.5 text-xs bg-[#142C45] dark:bg-[#168C83] hover:bg-[#192B3D] dark:hover:bg-[#1B9D92] text-white font-medium"
            >
              <span>Sales Pipeline</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Button>
          )}
        </div>
      </div>

      {/* Notification Toast Banner */}
      {notification && (
        <div
          className={`p-3.5 rounded-lg border flex items-center justify-between gap-3 text-xs ${
            notification.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-800 dark:text-emerald-300'
              : 'bg-red-500/10 border-red-500/30 text-red-800 dark:text-red-300'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="text-xs font-semibold hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Institutional Governance Banner */}
      <div className="bg-[#101C2A] text-slate-100 rounded-lg p-3.5 shadow-xs border border-[#168C83]/30">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-[#168C83] uppercase">
            <ShieldCheck className="w-4 h-4" />
            <span>COREvia Governance Architecture</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-[#A9BACB]">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span><strong>Service-First Safety:</strong> Resolves service issues before cross-selling</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span><strong>Customer Health Gate:</strong> Restricts sales to deteriorating accounts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span>
              <span><strong>Deterministic & Explainable:</strong> Full evidence lineage & zero hallucinations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-[#FFFFFF] dark:bg-[#162638] p-3.5 rounded-lg border border-[#DCE3EA] dark:border-[#33485D] shadow-xs">
            <div className="text-[11px] text-[#5D6B7B] dark:text-[#8194A8] font-medium uppercase tracking-wider">Active Signals</div>
            <div className="text-2xl font-bold font-mono text-[#142C45] dark:text-[#E8EEF5] mt-1">
              {stats.totalActiveSignals}
            </div>
            <div className="text-[10px] text-[#8793A1] mt-0.5">Review Suggested</div>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#162638] p-3.5 rounded-lg border border-red-500/30 shadow-xs">
            <div className="text-[11px] text-red-600 dark:text-red-400 font-medium uppercase tracking-wider">High / Critical</div>
            <div className="text-2xl font-bold font-mono text-red-600 dark:text-red-400 mt-1">
              {stats.highPriorityCount}
            </div>
            <div className="text-[10px] text-red-500 mt-0.5">Priority Attention</div>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#162638] p-3.5 rounded-lg border border-amber-500/30 shadow-xs">
            <div className="text-[11px] text-amber-600 dark:text-amber-400 font-medium uppercase tracking-wider">Product Gaps</div>
            <div className="text-2xl font-bold font-mono text-amber-600 dark:text-amber-400 mt-1">
              {stats.productGapsCount}
            </div>
            <div className="text-[10px] text-amber-500 mt-0.5">Missing Offerings</div>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#162638] p-3.5 rounded-lg border border-blue-500/30 shadow-xs">
            <div className="text-[11px] text-blue-600 dark:text-blue-400 font-medium uppercase tracking-wider">Expansion Opps</div>
            <div className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400 mt-1">
              {stats.relationshipOpportunitiesCount}
            </div>
            <div className="text-[10px] text-blue-500 mt-0.5">Tier-1 Accounts</div>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#162638] p-3.5 rounded-lg border border-purple-500/30 shadow-xs">
            <div className="text-[11px] text-purple-600 dark:text-purple-400 font-medium uppercase tracking-wider">Maturity / Renewal</div>
            <div className="text-2xl font-bold font-mono text-purple-600 dark:text-purple-400 mt-1">
              {stats.expiringSoonCount}
            </div>
            <div className="text-[10px] text-purple-500 mt-0.5">Next 30 Days</div>
          </div>

          <div className="bg-[#FFFFFF] dark:bg-[#162638] p-3.5 rounded-lg border border-emerald-500/30 shadow-xs">
            <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium uppercase tracking-wider">Converted MTD</div>
            <div className="text-2xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {stats.convertedThisMonthCount}
            </div>
            <div className="text-[10px] text-emerald-500 mt-0.5">To Sales Pipeline</div>
          </div>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="bg-[#FFFFFF] dark:bg-[#162638] p-3.5 rounded-lg border border-[#DCE3EA] dark:border-[#33485D] shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-[#8793A1]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer name, CIF, rule, title, or target product..."
              className="w-full pl-9 pr-24 py-2 border border-[#DCE3EA] dark:border-[#33485D] rounded-md text-xs bg-[#F4F6F8] dark:bg-[#101C2A] text-[#273444] dark:text-[#E8EEF5] placeholder-[#8793A1] focus:ring-1 focus:ring-[#168C83] outline-none"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setPage(1);
                }}
                className="absolute right-20 top-2.5 text-[#8793A1] hover:text-[#273444] dark:hover:text-[#E8EEF5]"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <Button
              type="submit"
              size="sm"
              variant="primary"
              className="absolute right-1 top-1 text-xs py-1 px-3 bg-[#142C45] dark:bg-[#168C83] text-white"
            >
              Search
            </Button>
          </form>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-[#EDF1F5] dark:bg-[#101C2A] p-1 rounded-lg self-start md:self-auto shrink-0 border border-[#DCE3EA] dark:border-[#33485D]">
            {(['ACTIVE', 'ALL', 'CONVERTED', 'DISMISSED'] as const).map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => {
                  setStatusFilter(st);
                  setPage(1);
                }}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${
                  statusFilter === st
                    ? 'bg-[#FFFFFF] dark:bg-[#162638] text-[#142C45] dark:text-[#E8EEF5] shadow-xs'
                    : 'text-[#5D6B7B] dark:text-[#8194A8] hover:text-[#142C45] dark:hover:text-[#E8EEF5]'
                }`}
              >
                {st === 'ACTIVE' ? 'Active Signals' : st === 'CONVERTED' ? 'Converted' : st === 'DISMISSED' ? 'Dismissed' : 'All Signals'}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-[#DCE3EA] dark:border-[#33485D] text-xs">
          <div>
            <label className="block text-[#5D6B7B] dark:text-[#8194A8] mb-1 font-medium">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 border border-[#DCE3EA] dark:border-[#33485D] rounded-lg outline-none bg-[#F4F6F8] dark:bg-[#101C2A] text-[#273444] dark:text-[#E8EEF5]"
            >
              <option value="ALL">All Categories</option>
              <option value="INVESTMENTS">Investments / Wealth</option>
              <option value="LENDING">Lending / Credit</option>
              <option value="CARDS">Cards</option>
              <option value="INSURANCE">Insurance</option>
              <option value="DEPOSITS">Deposits</option>
              <option value="RELATIONSHIP_REVIEW">Relationship Review</option>
            </select>
          </div>

          <div>
            <label className="block text-[#5D6B7B] dark:text-[#8194A8] mb-1 font-medium">Signal Type</label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 border border-[#DCE3EA] dark:border-[#33485D] rounded-lg outline-none bg-[#F4F6F8] dark:bg-[#101C2A] text-[#273444] dark:text-[#E8EEF5]"
            >
              <option value="ALL">All Signal Types</option>
              <option value="PRODUCT_COVERAGE_GAP">Product Coverage Gap</option>
              <option value="RELATIONSHIP_EXPANSION">Relationship Expansion</option>
              <option value="OPPORTUNITY_FOLLOWUP">Opportunity Followup</option>
              <option value="RENEWAL_MATURITY">Renewal / Maturity</option>
              <option value="ENGAGEMENT_OPPORTUNITY">Engagement Opportunity</option>
              <option value="SERVICE_FIRST_RECOVERY">Service Recovery</option>
            </select>
          </div>

          <div>
            <label className="block text-[#5D6B7B] dark:text-[#8194A8] mb-1 font-medium">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 border border-[#DCE3EA] dark:border-[#33485D] rounded-lg outline-none bg-[#F4F6F8] dark:bg-[#101C2A] text-[#273444] dark:text-[#E8EEF5]"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-[#5D6B7B] dark:text-[#8194A8] mb-1 font-medium">Sort Order</label>
            <select
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [sb, so] = e.target.value.split('-');
                setSortBy(sb as any);
                setSortOrder(so as any);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg outline-none bg-white text-gray-800"
            >
              <option value="relevance-desc">Highest Relevance</option>
              <option value="priority-asc">Highest Priority</option>
              <option value="date-desc">Newest Detected</option>
              <option value="customer-asc">Customer Name (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Signals Grid & Results */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="text-xs text-gray-500">
            Showing <strong className="text-gray-900">{signals.length}</strong> of{' '}
            <strong className="text-gray-900">{totalCount}</strong> relationship signals
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="text-xs"
              >
                Previous
              </Button>
              <span className="text-xs font-semibold text-gray-700">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="text-xs"
              >
                Next
              </Button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-brand-600 mb-3" />
            <p className="text-sm font-semibold text-gray-800">Analyzing customer portfolios & radar rules...</p>
            <p className="text-xs text-gray-400 mt-1">Cross-referencing deposit liquidity, credit lines, and CORE scores</p>
          </div>
        ) : signals.length === 0 ? (
          <EmptyState
            icon={<Radar className="w-12 h-12 text-slate-300" />}
            title="No Opportunity Signals Match Current Filters"
            description="Try adjusting your category, priority, or status filters, or run a fresh recalculation across all customer profiles."
            actionLabel="Recalculate All Radar Signals"
            onAction={handleRecalculateAll}
            className="bg-white rounded-xl border border-gray-200 p-12 shadow-xs"
          />
        ) : (
          <div className="motion-fade-in grid grid-cols-1 md:grid-cols-2 gap-4">
            {signals.map((sig) => (
              <RadarSignalCard
                key={sig.id}
                signal={sig}
                onViewEvidence={(s) => setSelectedEvidenceSignal(s)}
                onConvert={(s) => setSelectedConvertSignal(s)}
                onDismiss={(s) => setSelectedDismissSignal(s)}
                onReview={(s) => handleReview(s)}
                onExplainDecision={(s) => {
                  setSelectedDecisionId(s.customerId === 1 ? 'DT-20260928-00103' : 'DT-20260928-00201');
                }}
                onNavigateToCustomer={onNavigateToCustomer}
              />
            ))}
          </div>
        )}

        {/* Bottom Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-[#DCE3EA] dark:border-[#33485D]">
            <span className="text-xs font-mono text-[#5D6B7B] dark:text-[#8194A8]">
              Page {page} of {totalPages} ({totalCount} signals)
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="text-xs border-[#DCE3EA] dark:border-[#33485D] text-[#273444] dark:text-[#E8EEF5]"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="text-xs border-[#DCE3EA] dark:border-[#33485D] text-[#273444] dark:text-[#E8EEF5]"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <RadarEvidenceModal
        isOpen={!!selectedEvidenceSignal}
        onClose={() => setSelectedEvidenceSignal(null)}
        signal={selectedEvidenceSignal}
        onConvert={(s) => {
          setSelectedEvidenceSignal(null);
          setSelectedConvertSignal(s);
        }}
        onNavigateToCustomer={onNavigateToCustomer}
      />

      <ConvertOpportunityModal
        isOpen={!!selectedConvertSignal}
        onClose={() => setSelectedConvertSignal(null)}
        signal={selectedConvertSignal}
        onSuccess={handleConversionSuccess}
      />

      <DismissRadarModal
        isOpen={!!selectedDismissSignal}
        onClose={() => setSelectedDismissSignal(null)}
        signal={selectedDismissSignal}
        onSuccess={handleDismissSuccess}
      />

      {/* Phase 29: AI Decision Trace Panel */}
      <DecisionTracePanel
        decisionId={selectedDecisionId}
        isOpen={Boolean(selectedDecisionId)}
        onClose={() => setSelectedDecisionId(null)}
        onNavigateToCustomer={onNavigateToCustomer}
      />
    </div>
  );
};
