import React, { useState, useEffect } from 'react';
import { bankingApi } from '../../lib/api';
import type { OpportunityRadarSignal, RadarSummaryStats } from '../../types';
import { RadarSignalCard } from '../radar/RadarSignalCard';
import { RadarEvidenceModal } from '../radar/RadarEvidenceModal';
import { ConvertOpportunityModal } from '../radar/ConvertOpportunityModal';
import { DismissRadarModal } from '../radar/DismissRadarModal';
import { Button } from '../common/Button';
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
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-brand-100/80 text-brand-700">
              <Radar className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">
                Customer Opportunity Radar
              </h1>
              <p className="text-sm text-gray-500">
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
            className="flex items-center gap-2 text-sm font-medium"
          >
            <RefreshCw className={`w-4 h-4 ${recalculating ? 'animate-spin text-brand-600' : ''}`} />
            <span>{recalculating ? 'Scanning Portfolios...' : 'Recalculate All'}</span>
          </Button>

          {onNavigateToOpportunities && (
            <Button
              variant="primary"
              onClick={onNavigateToOpportunities}
              className="flex items-center gap-1.5 text-sm bg-brand-600 hover:bg-brand-700 text-white font-medium"
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
          className={`p-4 rounded-xl border flex items-center justify-between gap-3 text-sm ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
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
      <div className="bg-slate-900 text-slate-100 rounded-xl p-4 shadow-xs border border-slate-800">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold tracking-wide text-brand-400 uppercase">
            <ShieldCheck className="w-4 h-4" />
            <span>COREvia Governance Architecture</span>
          </div>
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-slate-300">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              <span><strong>Service-First Safety:</strong> Resolves service issues before cross-selling</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-blue-400"></span>
              <span><strong>Customer Health Gate:</strong> Restricts sales to deteriorating accounts</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-purple-400"></span>
              <span><strong>Deterministic & Explainable:</strong> Full evidence lineage & zero hallucinations</span>
            </div>
          </div>
        </div>
      </div>

      {/* Summary KPI Cards */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
            <div className="text-xs text-gray-500 font-medium">Active Signals</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">
              {stats.totalActiveSignals}
            </div>
            <div className="text-[11px] text-gray-400 mt-1">Review Suggested</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-rose-200/80 bg-rose-50/10 shadow-xs">
            <div className="text-xs text-rose-700 font-medium">High / Critical</div>
            <div className="text-2xl font-bold text-rose-800 mt-1">
              {stats.highPriorityCount}
            </div>
            <div className="text-[11px] text-rose-600 mt-1">Priority Attention</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-amber-200/80 bg-amber-50/10 shadow-xs">
            <div className="text-xs text-amber-700 font-medium">Product Gaps</div>
            <div className="text-2xl font-bold text-amber-800 mt-1">
              {stats.productGapsCount}
            </div>
            <div className="text-[11px] text-amber-600 mt-1">Missing Offerings</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-blue-200/80 bg-blue-50/10 shadow-xs">
            <div className="text-xs text-blue-700 font-medium">Expansion Opps</div>
            <div className="text-2xl font-bold text-blue-800 mt-1">
              {stats.relationshipOpportunitiesCount}
            </div>
            <div className="text-[11px] text-blue-600 mt-1">Tier-1 Accounts</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-purple-200/80 bg-purple-50/10 shadow-xs">
            <div className="text-xs text-purple-700 font-medium">Maturity & Renewal</div>
            <div className="text-2xl font-bold text-purple-800 mt-1">
              {stats.expiringSoonCount}
            </div>
            <div className="text-[11px] text-purple-600 mt-1">Next 30 Days</div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-emerald-200/80 bg-emerald-50/10 shadow-xs">
            <div className="text-xs text-emerald-700 font-medium">Converted MTD</div>
            <div className="text-2xl font-bold text-emerald-800 mt-1">
              {stats.convertedThisMonthCount}
            </div>
            <div className="text-[11px] text-emerald-600 mt-1">To Sales Pipeline</div>
          </div>
        </div>
      )}

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row gap-3">
          {/* Search Form */}
          <form onSubmit={handleSearchSubmit} className="flex-1 relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by customer name, CIF, rule, title, or target product..."
              className="w-full pl-9 pr-20 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-brand-500 focus:border-brand-500 outline-none"
            />
            <Button
              type="submit"
              size="sm"
              variant="primary"
              className="absolute right-1.5 top-1.5 text-xs py-1 px-3 bg-brand-600 hover:bg-brand-700 text-white"
            >
              Search
            </Button>
          </form>

          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-lg self-start md:self-auto shrink-0">
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
                    ? 'bg-white text-gray-900 shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {st === 'ACTIVE' ? 'Active Signals' : st === 'CONVERTED' ? 'Converted' : st === 'DISMISSED' ? 'Dismissed' : 'All Signals'}
              </button>
            ))}
          </div>
        </div>

        {/* Dropdown Filters */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-gray-100 text-xs">
          <div>
            <label className="block text-gray-500 mb-1 font-medium">Category</label>
            <select
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg outline-none bg-white text-gray-800"
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
            <label className="block text-gray-500 mb-1 font-medium">Signal Type</label>
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg outline-none bg-white text-gray-800"
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
            <label className="block text-gray-500 mb-1 font-medium">Priority</label>
            <select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="w-full px-2.5 py-1.5 border border-gray-300 rounded-lg outline-none bg-white text-gray-800"
            >
              <option value="ALL">All Priorities</option>
              <option value="CRITICAL">Critical</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div>
            <label className="block text-gray-500 mb-1 font-medium">Sort Order</label>
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
          <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300 p-8">
            <Radar className="w-12 h-12 mx-auto text-gray-300 mb-3" />
            <h3 className="text-base font-bold text-gray-900 mb-1">
              No Opportunity Signals Match Current Filters
            </h3>
            <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
              Try adjusting your category, priority or status filters, or run a fresh recalculation across all customer profiles.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRecalculateAll}
              disabled={recalculating}
              className="text-xs"
            >
              Recalculate All Radar Signals
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {signals.map((sig) => (
              <RadarSignalCard
                key={sig.id}
                signal={sig}
                onViewEvidence={(s) => setSelectedEvidenceSignal(s)}
                onConvert={(s) => setSelectedConvertSignal(s)}
                onDismiss={(s) => setSelectedDismissSignal(s)}
                onReview={(s) => handleReview(s)}
                onNavigateToCustomer={onNavigateToCustomer}
              />
            ))}
          </div>
        )}

        {/* Bottom Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
            <span className="text-xs text-gray-500">
              Page {page} of {totalPages} ({totalCount} signals)
            </span>
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
    </div>
  );
};
