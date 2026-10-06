import React, { useState, useEffect, useMemo } from 'react';
import {
  Layers,
  Shield,
  Activity,
  Calendar,
  Filter,
  Download,
  Search,
  RefreshCw,
  Info,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Users,
  Building2,
  DollarSign,
  PieChart,
  Clock,
  ArrowRight,
  HelpCircle,
  FileText,
  Briefcase,
  ChevronLeft,
} from 'lucide-react';
import { api } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  PortfolioFilterParams,
  PortfolioOverviewDTO,
  HealthDistributionBucket,
  CoreScoreAnalysisDTO,
  RelationshipValueAnalysisDTO,
  ProductPenetrationDTO,
  EngagementIntelligenceDTO,
  ServiceQualityDTO,
  OpportunityPortfolioDTO,
  SignalPortfolioDTO,
  NbaPortfolioDTO,
  ActionOutcomeDTO,
  WhatChangedItem,
  PortfolioChangelogEvent,
  HealthMatrixQuadrant,
  FocusAreaGroup,
  CustomerPortfolioSummaryItem,
  CustomerPortfolioProfileDTO,
  PortfolioPeriodComparisonDTO,
  MetricDefinitionDTO,
} from '../../types/portfolioIntelligence.types';
import { MetricInfoModal } from './MetricInfoModal';
import { CustomerPortfolioDrawer } from './CustomerPortfolioDrawer';

interface PortfolioIntelligenceWorkspaceProps {
  onNavigateToCustomer?: (customerId: number) => void;
  onNavigateToTwin?: (customerId: number) => void;
  onNavigateToModule?: (module: string) => void;
}

type TabType =
  | 'overview'
  | 'health-score'
  | 'value-concentration'
  | 'products-penetration'
  | 'engagement-service'
  | 'opportunities-signals'
  | 'what-changed'
  | 'matrix-focus'
  | 'comparison'
  | 'customers';

export const PortfolioIntelligenceWorkspace: React.FC<PortfolioIntelligenceWorkspaceProps> = ({
  onNavigateToCustomer,
  onNavigateToTwin,
  onNavigateToModule,
}) => {
  const { user } = useAuth();

  // Active Tab
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Filters State
  const [filters, setFilters] = useState<PortfolioFilterParams>({
    period: '30D',
    entityType: 'ALL',
    segment: 'ALL',
    search: '',
  });

  // Data States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [asOfTimestamp, setAsOfTimestamp] = useState<string>(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));

  const [overview, setOverview] = useState<PortfolioOverviewDTO | null>(null);
  const [healthDist, setHealthDist] = useState<HealthDistributionBucket[]>([]);
  const [coreScore, setCoreScore] = useState<CoreScoreAnalysisDTO | null>(null);
  const [valueAnalysis, setValueAnalysis] = useState<RelationshipValueAnalysisDTO | null>(null);
  const [productPen, setProductPen] = useState<ProductPenetrationDTO | null>(null);
  const [engagement, setEngagement] = useState<EngagementIntelligenceDTO | null>(null);
  const [serviceQuality, setServiceQuality] = useState<ServiceQualityDTO | null>(null);
  const [opportunityData, setOpportunityData] = useState<OpportunityPortfolioDTO | null>(null);
  const [signalData, setSignalData] = useState<SignalPortfolioDTO | null>(null);
  const [nbaData, setNbaData] = useState<NbaPortfolioDTO | null>(null);
  const [actionOutcomes, setActionOutcomes] = useState<ActionOutcomeDTO | null>(null);
  const [whatChanged, setWhatChanged] = useState<WhatChangedItem[]>([]);
  const [changelog, setChangelog] = useState<PortfolioChangelogEvent[]>([]);
  const [healthMatrix, setHealthMatrix] = useState<HealthMatrixQuadrant[]>([]);
  const [focusAreas, setFocusAreas] = useState<FocusAreaGroup[]>([]);
  const [comparison, setComparison] = useState<PortfolioPeriodComparisonDTO | null>(null);

  // Paginated Customer Table State
  const [customerPage, setCustomerPage] = useState<number>(1);
  const [customerData, setCustomerData] = useState<{
    customers: CustomerPortfolioSummaryItem[];
    total: number;
    page: number;
    totalPages: number;
  }>({ customers: [], total: 0, page: 1, totalPages: 1 });
  const [isCustomerLoading, setIsCustomerLoading] = useState<boolean>(false);

  // Drawer & Modal State
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(null);
  const [customerProfile, setCustomerProfile] = useState<CustomerPortfolioProfileDTO | null>(null);
  const [isProfileLoading, setIsProfileLoading] = useState<boolean>(false);
  const [selectedMetric, setSelectedMetric] = useState<MetricDefinitionDTO | null>(null);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Load Primary Overview & Core Aggregates
  const loadPortfolioData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [
        overviewRes,
        healthRes,
        coreRes,
        valRes,
        prodRes,
        engRes,
        srvRes,
        oppRes,
        sigRes,
        nbaRes,
        actRes,
        chgRes,
        logRes,
        mtxRes,
        focRes,
      ] = await Promise.all([
        api.getPortfolioOverview(filters),
        api.getPortfolioHealthDistribution(filters),
        api.getPortfolioCoreScoreAnalysis(filters),
        api.getPortfolioValueAnalysis(filters),
        api.getPortfolioProductPenetration(filters),
        api.getPortfolioEngagement(filters),
        api.getPortfolioServiceQuality(filters),
        api.getPortfolioOpportunities(filters),
        api.getPortfolioSignals(filters),
        api.getPortfolioNbas(filters),
        api.getPortfolioActionOutcomes(filters),
        api.getPortfolioWhatChanged(filters),
        api.getPortfolioChangelog(filters),
        api.getPortfolioHealthMatrix(filters),
        api.getPortfolioFocusAreas(filters),
      ]);

      if (overviewRes.success) setOverview(overviewRes.data);
      if (healthRes.success) setHealthDist(healthRes.data);
      if (coreRes.success) setCoreScore(coreRes.data);
      if (valRes.success) setValueAnalysis(valRes.data);
      if (prodRes.success) setProductPen(prodRes.data);
      if (engRes.success) setEngagement(engRes.data);
      if (srvRes.success) setServiceQuality(srvRes.data);
      if (oppRes.success) setOpportunityData(oppRes.data);
      if (sigRes.success) setSignalData(sigRes.data);
      if (nbaRes.success) setNbaData(nbaRes.data);
      if (actRes.success) setActionOutcomes(actRes.data);
      if (chgRes.success) setWhatChanged(chgRes.data);
      if (logRes.success) setChangelog(logRes.data);
      if (mtxRes.success) setHealthMatrix(mtxRes.data);
      if (focRes.success) setFocusAreas(focRes.data);

      setAsOfTimestamp(new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    } catch (err: any) {
      setError(err?.message || 'Failed to aggregate portfolio intelligence.');
    } finally {
      setIsLoading(false);
    }
  };

  // Load Paginated Customers
  const loadCustomerDrillDown = async (page: number = 1) => {
    setIsCustomerLoading(true);
    try {
      const res = await api.getPortfolioCustomers({ ...filters, page, limit: 15 });
      if (res.success) {
        setCustomerData(res.data);
        setCustomerPage(page);
      }
    } catch (err: any) {
      console.error('Failed to load drilldown customers:', err);
    } finally {
      setIsCustomerLoading(false);
    }
  };

  // Load Comparison Data when Tab Opened
  const loadComparison = async () => {
    try {
      const res = await api.getPortfolioComparison('30D_AGO', 'CURRENT');
      if (res.success) setComparison(res.data);
    } catch (err) {
      console.error('Failed to load period comparison:', err);
    }
  };

  useEffect(() => {
    loadPortfolioData();
    loadCustomerDrillDown(1);
  }, [filters.period, filters.entityType, filters.segment, filters.rmId, filters.branchCode]);

  useEffect(() => {
    if (activeTab === 'customers') {
      loadCustomerDrillDown(customerPage);
    } else if (activeTab === 'comparison' && !comparison) {
      loadComparison();
    }
  }, [activeTab]);

  // Handle Customer Selection for Drawer
  const handleSelectCustomer = async (customerId: number) => {
    setSelectedCustomerId(customerId);
    setIsProfileLoading(true);
    try {
      const res = await api.getPortfolioCustomerProfile(customerId);
      if (res.success) {
        setCustomerProfile(res.data);
      }
    } catch (err) {
      console.error('Failed to load customer profile:', err);
    } finally {
      setIsProfileLoading(false);
    }
  };

  // Export CSV Handler
  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const csvData = await api.exportPortfolioCSV(filters);
      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `portfolio-intelligence-${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err: any) {
      alert(err?.message || 'Failed to export CSV. Please check permissions.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-5 pb-16">
      {/* 1. ENTERPRISE CONTEXT HEADER */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2.5">
              <div className="p-2 rounded-lg bg-blue-600/10 border border-blue-500/20 text-blue-400">
                <PieChart className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h1 className="text-xl font-bold text-slate-100 tracking-tight">Portfolio Intelligence</h1>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                    Phase 37
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Explainable, non-predictive portfolio analytics across authorized relationships
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-3 border-t border-slate-800/80 text-xs">
              <div>
                <span className="text-slate-500 block text-[11px]">Authorized Portfolio</span>
                <span className="font-semibold text-slate-200">
                  {user?.name || 'Deepak Nambiar'} ({user?.role?.replace('_', ' ') || 'RM'})
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Time Period</span>
                <span className="font-semibold text-slate-200 font-mono">
                  {filters.period === '30D' ? 'Last 30 Days' : filters.period === '60D' ? 'Last 60 Days' : filters.period === '90D' ? 'Last 90 Days' : 'Year to Date'}
                </span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">As Of</span>
                <span className="font-semibold text-slate-200 font-mono text-[11px]">{asOfTimestamp}</span>
              </div>
              <div>
                <span className="text-slate-500 block text-[11px]">Scope & RBAC</span>
                <span className="font-semibold text-blue-400">Strict Authorized Boundary</span>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-start lg:self-center">
            <button
              onClick={() => {
                loadPortfolioData();
                loadCustomerDrillDown(customerPage);
              }}
              disabled={isLoading}
              className="px-3 py-2 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
            <button
              onClick={handleExportCSV}
              disabled={isExporting}
              className="px-3.5 py-2 text-xs rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium flex items-center space-x-1.5 shadow-sm transition-colors disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. SERVER-SIDE FILTER BAR */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm text-xs">
        <div className="flex items-center justify-between mb-3 text-slate-400">
          <div className="flex items-center space-x-1.5">
            <Filter className="w-3.5 h-3.5 text-blue-400" />
            <span className="font-medium text-slate-300">Server-Side Portfolio Filters</span>
          </div>
          <span className="text-[11px] text-slate-500">Query evaluated on server; no whole-database browser download</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Period</label>
            <select
              value={filters.period || '30D'}
              onChange={(e) => setFilters((prev) => ({ ...prev, period: e.target.value as any }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-hidden focus:border-blue-500"
            >
              <option value="30D">Last 30 Days</option>
              <option value="60D">Last 60 Days</option>
              <option value="90D">Last 90 Days</option>
              <option value="YTD">Year to Date (YTD)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Entity Type</label>
            <select
              value={filters.entityType || 'ALL'}
              onChange={(e) => setFilters((prev) => ({ ...prev, entityType: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-hidden focus:border-blue-500"
            >
              <option value="ALL">All Entity Types</option>
              <option value="INDIVIDUAL">Individual</option>
              <option value="CORPORATE">Corporate</option>
              <option value="PROPRIETORSHIP">Proprietorship</option>
              <option value="PUBLIC_LIMITED">Public Limited</option>
              <option value="NRI">NRI</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Risk Segment</label>
            <select
              value={filters.segment || 'ALL'}
              onChange={(e) => setFilters((prev) => ({ ...prev, segment: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-hidden focus:border-blue-500"
            >
              <option value="ALL">All Risk Segments</option>
              <option value="LOW">Low Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="HIGH">High Risk</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">CORE Score Band</label>
            <select
              value={filters.coreScoreBand || 'ALL'}
              onChange={(e) => setFilters((prev) => ({ ...prev, coreScoreBand: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-hidden focus:border-blue-500"
            >
              <option value="ALL">All Score Bands</option>
              <option value="EXCELLENT">Excellent (800+)</option>
              <option value="STRONG">Strong (700-799)</option>
              <option value="MODERATE">Moderate (600-699)</option>
              <option value="DEVELOPING">Developing (&lt;600)</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Momentum</label>
            <select
              value={filters.momentum || 'ALL'}
              onChange={(e) => setFilters((prev) => ({ ...prev, momentum: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-200 text-xs focus:outline-hidden focus:border-blue-500"
            >
              <option value="ALL">All Momentum</option>
              <option value="POSITIVE">Positive</option>
              <option value="STABLE">Stable</option>
              <option value="NEGATIVE">Negative</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Customer Search</label>
            <div className="relative">
              <input
                type="text"
                placeholder="Search name/CIF..."
                value={filters.search || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, search: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-8 pr-2.5 py-1.5 text-slate-200 text-xs focus:outline-hidden focus:border-blue-500"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
            </div>
          </div>
        </div>
      </div>

      {/* 3. PORTFOLIO OVERVIEW: 13 CONCISE KPIS */}
      {overview && (
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between mb-3 text-xs">
            <span className="font-semibold text-slate-200">Portfolio Overview Metrics</span>
            <span className="text-slate-500 text-[11px]">Click ⓘ on any card to view deterministic source and calculation</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 gap-2.5 text-xs">
            {/* KPI 1: Authorized Customers */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 relative group">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Authorized Customers</span>
                <button
                  onClick={() => setSelectedMetric(overview.definitions['authorizedCustomers'])}
                  className="text-slate-500 hover:text-blue-400"
                  title="Definition & Calculation"
                >
                  <Info className="w-3 h-3" />
                </button>
              </div>
              <div className="text-lg font-bold text-slate-100 font-mono mt-1">
                {overview.authorizedCustomers}
              </div>
            </div>

            {/* KPI 2: Total Relationship Value */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 relative group">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Total Value</span>
                <button
                  onClick={() => setSelectedMetric(overview.definitions['totalRelationshipValue'])}
                  className="text-slate-500 hover:text-blue-400"
                >
                  <Info className="w-3 h-3" />
                </button>
              </div>
              <div className="text-lg font-bold text-emerald-400 font-mono mt-1">
                ₹{(overview.totalRelationshipValue / 10000000).toFixed(2)} Cr
              </div>
            </div>

            {/* KPI 3: Avg Relationship Value */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 relative group">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Avg Value</span>
                <button
                  onClick={() => setSelectedMetric(overview.definitions['averageRelationshipValue'])}
                  className="text-slate-500 hover:text-blue-400"
                >
                  <Info className="w-3 h-3" />
                </button>
              </div>
              <div className="text-lg font-bold text-slate-200 font-mono mt-1">
                ₹{(overview.averageRelationshipValue / 100000).toFixed(1)} L
              </div>
            </div>

            {/* KPI 4: Active Products */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 relative group">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Active Products</span>
                <button
                  onClick={() => setSelectedMetric(overview.definitions['activeProducts'])}
                  className="text-slate-500 hover:text-blue-400"
                >
                  <Info className="w-3 h-3" />
                </button>
              </div>
              <div className="text-lg font-bold text-slate-100 font-mono mt-1">
                {overview.activeProducts}
              </div>
            </div>

            {/* KPI 5: Avg CORE Score */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 relative group">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Avg CORE Score</span>
                <button
                  onClick={() => setSelectedMetric(overview.definitions['averageCoreScore'])}
                  className="text-slate-500 hover:text-blue-400"
                >
                  <Info className="w-3 h-3" />
                </button>
              </div>
              <div className="text-lg font-bold text-indigo-300 font-mono mt-1">
                {overview.averageCoreScore}
              </div>
            </div>

            {/* KPI 6: Positive Momentum */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 relative group">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Positive Momentum</span>
                <button
                  onClick={() => setSelectedMetric(overview.definitions['customersWithPositiveMomentum'])}
                  className="text-slate-500 hover:text-blue-400"
                >
                  <Info className="w-3 h-3" />
                </button>
              </div>
              <div className="text-lg font-bold text-emerald-400 font-mono mt-1 flex items-center space-x-1">
                <TrendingUp className="w-4 h-4" />
                <span>{overview.customersWithPositiveMomentum}</span>
              </div>
            </div>

            {/* KPI 7: Negative Momentum */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 relative group">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Negative Momentum</span>
                <button
                  onClick={() => setSelectedMetric(overview.definitions['customersWithNegativeMomentum'])}
                  className="text-slate-500 hover:text-blue-400"
                >
                  <Info className="w-3 h-3" />
                </button>
              </div>
              <div className="text-lg font-bold text-rose-400 font-mono mt-1 flex items-center space-x-1">
                <TrendingDown className="w-4 h-4" />
                <span>{overview.customersWithNegativeMomentum}</span>
              </div>
            </div>

            {/* KPI 8: Open Opportunities */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 relative group">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Open Deals</span>
                <button
                  onClick={() => setSelectedMetric(overview.definitions['openOpportunities'])}
                  className="text-slate-500 hover:text-blue-400"
                >
                  <Info className="w-3 h-3" />
                </button>
              </div>
              <div className="text-lg font-bold text-slate-100 font-mono mt-1">
                {overview.openOpportunities}
              </div>
            </div>

            {/* KPI 9: Pipeline Value */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 relative group">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Pipeline Value</span>
                <button
                  onClick={() => setSelectedMetric(overview.definitions['opportunityPipelineValue'])}
                  className="text-slate-500 hover:text-blue-400"
                >
                  <Info className="w-3 h-3" />
                </button>
              </div>
              <div className="text-lg font-bold text-purple-400 font-mono mt-1">
                ₹{(overview.opportunityPipelineValue / 10000000).toFixed(2)} Cr
              </div>
            </div>

            {/* KPI 10: Open Service Cases */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 relative group">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Open Cases</span>
                <button
                  onClick={() => setSelectedMetric(overview.definitions['openServiceCases'])}
                  className="text-slate-500 hover:text-blue-400"
                >
                  <Info className="w-3 h-3" />
                </button>
              </div>
              <div className="text-lg font-bold text-amber-400 font-mono mt-1">
                {overview.openServiceCases}
              </div>
            </div>

            {/* KPI 11: SLA Risk Count */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 relative group">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>SLA Risk</span>
                <button
                  onClick={() => setSelectedMetric(overview.definitions['slaRiskCount'])}
                  className="text-slate-500 hover:text-blue-400"
                >
                  <Info className="w-3 h-3" />
                </button>
              </div>
              <div className="text-lg font-bold text-rose-400 font-mono mt-1">
                {overview.slaRiskCount}
              </div>
            </div>

            {/* KPI 12: Active Signals */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 relative group">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Active Signals</span>
                <button
                  onClick={() => setSelectedMetric(overview.definitions['activeSignals'])}
                  className="text-slate-500 hover:text-blue-400"
                >
                  <Info className="w-3 h-3" />
                </button>
              </div>
              <div className="text-lg font-bold text-amber-400 font-mono mt-1">
                {overview.activeSignals}
              </div>
            </div>

            {/* KPI 13: Outstanding Actions */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 relative group">
              <div className="flex items-center justify-between text-slate-400 text-[11px]">
                <span>Pending Actions</span>
                <button
                  onClick={() => setSelectedMetric(overview.definitions['outstandingActions'])}
                  className="text-slate-500 hover:text-blue-400"
                >
                  <Info className="w-3 h-3" />
                </button>
              </div>
              <div className="text-lg font-bold text-blue-400 font-mono mt-1">
                {overview.outstandingActions}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. WORKSPACE TABS */}
      <div className="border-b border-slate-800 flex items-center space-x-1 overflow-x-auto text-xs font-medium text-slate-400">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3.5 py-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'overview'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent hover:text-slate-200'
          }`}
        >
          Summary Dashboard
        </button>
        <button
          onClick={() => setActiveTab('health-score')}
          className={`px-3.5 py-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'health-score'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent hover:text-slate-200'
          }`}
        >
          Health & CORE Score
        </button>
        <button
          onClick={() => setActiveTab('value-concentration')}
          className={`px-3.5 py-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'value-concentration'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent hover:text-slate-200'
          }`}
        >
          Value & Concentration
        </button>
        <button
          onClick={() => setActiveTab('products-penetration')}
          className={`px-3.5 py-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'products-penetration'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent hover:text-slate-200'
          }`}
        >
          Product Penetration
        </button>
        <button
          onClick={() => setActiveTab('engagement-service')}
          className={`px-3.5 py-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'engagement-service'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent hover:text-slate-200'
          }`}
        >
          Engagement & Service
        </button>
        <button
          onClick={() => setActiveTab('opportunities-signals')}
          className={`px-3.5 py-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'opportunities-signals'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent hover:text-slate-200'
          }`}
        >
          Pipeline, Signals & NBAs
        </button>
        <button
          onClick={() => setActiveTab('what-changed')}
          className={`px-3.5 py-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'what-changed'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent hover:text-slate-200'
          }`}
        >
          What Changed & Changelog
        </button>
        <button
          onClick={() => setActiveTab('matrix-focus')}
          className={`px-3.5 py-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'matrix-focus'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent hover:text-slate-200'
          }`}
        >
          Health Matrix & Focus Areas
        </button>
        <button
          onClick={() => setActiveTab('comparison')}
          className={`px-3.5 py-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'comparison'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent hover:text-slate-200'
          }`}
        >
          Period Comparison
        </button>
        <button
          onClick={() => setActiveTab('customers')}
          className={`px-3.5 py-2.5 border-b-2 whitespace-nowrap transition-colors ${
            activeTab === 'customers'
              ? 'border-blue-500 text-blue-400 font-semibold'
              : 'border-transparent hover:text-slate-200'
          }`}
        >
          Authorized Customers ({overview?.authorizedCustomers || 0})
        </button>
      </div>

      {/* 5. TAB CONTENTS */}
      {isLoading ? (
        <div className="flex items-center justify-center py-24 text-slate-500">
          <Clock className="w-6 h-6 animate-spin mr-2" />
          <span>Aggregating authorized relationship portfolio intelligence...</span>
        </div>
      ) : error ? (
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/40 text-rose-300 text-xs">
          {error}
        </div>
      ) : (
        <div className="space-y-5">
          {/* TAB: SUMMARY DASHBOARD */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Health Distribution Panel */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-xs font-semibold text-slate-200">Relationship Health Distribution</h3>
                  </div>
                  <span className="text-[11px] text-slate-500">Derived from CORE Score & Momentum</span>
                </div>
                <div className="space-y-2">
                  {healthDist.map((b) => (
                    <div
                      key={b.bucketKey}
                      onClick={() => setActiveTab('customers')}
                      className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 hover:border-slate-700 cursor-pointer transition-colors"
                    >
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-200">{b.label}</span>
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-slate-100 font-mono">{b.customerCount}</span>
                          <span className="text-slate-400 font-mono">({b.percentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            b.bucketKey === 'HEALTHY'
                              ? 'bg-emerald-500'
                              : b.bucketKey === 'STABLE'
                              ? 'bg-blue-500'
                              : b.bucketKey === 'WATCH'
                              ? 'bg-amber-500'
                              : b.bucketKey === 'AT_RISK'
                              ? 'bg-orange-500'
                              : 'bg-rose-500'
                          }`}
                          style={{ width: `${Math.min(100, b.percentage)}%` }}
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1.5">{b.description}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* CORE Score Distribution Panel */}
              {coreScore && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-indigo-400" />
                      <h3 className="text-xs font-semibold text-slate-200">CORE Score Engine Distribution</h3>
                    </div>
                    <div className="text-[11px] font-mono text-indigo-300">
                      Avg: {coreScore.averageScore} | Median: {coreScore.medianScore}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 gap-2 text-center text-xs">
                    {coreScore.distribution.map((d) => (
                      <div key={d.band} className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">{d.label}</span>
                        <span className="text-sm font-bold text-slate-100 font-mono mt-1 block">
                          {d.customerCount}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">{d.percentage}%</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-800">
                    <h4 className="text-xs font-semibold text-slate-300 mb-2">Component Score Averages</h4>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center text-xs">
                      <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Value</span>
                        <span className="font-bold text-slate-200 font-mono">
                          {coreScore.componentAverages.relationshipValueAvg}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Depth</span>
                        <span className="font-bold text-slate-200 font-mono">
                          {coreScore.componentAverages.productDepthAvg}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Engagement</span>
                        <span className="font-bold text-slate-200 font-mono">
                          {coreScore.componentAverages.engagementAvg}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Service</span>
                        <span className="font-bold text-slate-200 font-mono">
                          {coreScore.componentAverages.serviceHealthAvg}
                        </span>
                      </div>
                      <div className="p-2 rounded bg-slate-950/60 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Activity</span>
                        <span className="font-bold text-slate-200 font-mono">
                          {coreScore.componentAverages.activityMomentumAvg}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: HEALTH & CORE SCORE */}
          {activeTab === 'health-score' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Health Buckets */}
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                  <h3 className="text-xs font-semibold text-slate-200">Authorized Relationship Health State</h3>
                  <div className="space-y-2.5">
                    {healthDist.map((b) => (
                      <div key={b.bucketKey} className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold text-slate-100">{b.label}</span>
                          <span className="font-mono text-slate-300">
                            {b.customerCount} customers ({b.percentage}%)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{b.description}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Meaningful Score Movements */}
                {coreScore && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xs font-semibold text-slate-200">Meaningful Score Movements (&gt;15 Pts)</h3>
                      <span className="text-[11px] text-slate-500 font-mono">{coreScore.scoreChanges.length} changes detected</span>
                    </div>
                    {coreScore.scoreChanges.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-6 text-center">
                        No material score movements observed over the active comparison period.
                      </p>
                    ) : (
                      <div className="space-y-2 max-h-[360px] overflow-y-auto pr-1">
                        {coreScore.scoreChanges.map((sc, idx) => (
                          <div
                            key={`${sc.customerId}-${idx}`}
                            onClick={() => handleSelectCustomer(sc.customerId)}
                            className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 hover:border-slate-700 cursor-pointer text-xs space-y-1"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-slate-200">{sc.customerName}</span>
                              <div className="flex items-center space-x-2 font-mono">
                                <span className="text-slate-400">{sc.previousScore}</span>
                                <ArrowRight className="w-3 h-3 text-slate-500" />
                                <span className="font-bold text-slate-100">{sc.currentScore}</span>
                                <span
                                  className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                                    sc.direction === 'IMPROVED'
                                      ? 'text-emerald-400 bg-emerald-500/10'
                                      : 'text-rose-400 bg-rose-500/10'
                                  }`}
                                >
                                  {sc.change > 0 ? `+${sc.change}` : sc.change}
                                </span>
                              </div>
                            </div>
                            <p className="text-[11px] text-slate-400">{sc.evidence}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: VALUE & CONCENTRATION */}
          {activeTab === 'value-concentration' && valueAnalysis && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                  <span className="text-slate-400 text-[11px]">Total Relationship Value</span>
                  <div className="text-2xl font-bold text-emerald-400 font-mono">
                    ₹{(valueAnalysis.totalValue / 10000000).toFixed(2)} Cr
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Average: ₹{(valueAnalysis.averageValue / 100000).toFixed(2)} L | Median: ₹{(valueAnalysis.medianValue / 100000).toFixed(2)} L
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                  <span className="text-slate-400 text-[11px]">Top 5 Customer Concentration</span>
                  <div className="text-2xl font-bold text-blue-400 font-mono">
                    {valueAnalysis.top5ConcentrationPct}%
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Calculated over active authorized portfolio
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-2">
                  <span className="text-slate-400 text-[11px]">Top 10 Customer Concentration</span>
                  <div className="text-2xl font-bold text-purple-400 font-mono">
                    {valueAnalysis.top10ConcentrationPct}%
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Neutral descriptive concentration metric
                  </div>
                </div>
              </div>

              {/* Top Customer Concentration Table */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-200">High Concentration Accounts</h3>
                  <span className="text-[11px] text-slate-500">Sorted by relationship value</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-medium text-[11px]">
                        <th className="pb-2">Customer</th>
                        <th className="pb-2">Customer Code</th>
                        <th className="pb-2 text-right">Relationship Value</th>
                        <th className="pb-2 text-right">Portfolio Share</th>
                        <th className="pb-2 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {valueAnalysis.topConcentration.map((c) => (
                        <tr key={c.customerId} className="hover:bg-slate-850/50 transition-colors">
                          <td className="py-2.5 font-medium text-slate-200">{c.customerName}</td>
                          <td className="py-2.5 font-mono text-slate-400 text-[11px]">{c.customerCode}</td>
                          <td className="py-2.5 font-mono text-right text-emerald-400 font-semibold">
                            ₹{(c.relationshipValue / 100000).toFixed(2)} L
                          </td>
                          <td className="py-2.5 font-mono text-right text-blue-400 font-semibold">
                            {c.portfolioSharePercentage}%
                          </td>
                          <td className="py-2.5 text-center">
                            <button
                              onClick={() => handleSelectCustomer(c.customerId)}
                              className="text-[11px] text-blue-400 hover:underline"
                            >
                              View Profile
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB: PRODUCT PENETRATION */}
          {activeTab === 'products-penetration' && productPen && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Product Adoption List */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <h3 className="text-xs font-semibold text-slate-200">Product Penetration & Adoption</h3>
                <div className="space-y-2">
                  {productPen.products.map((p) => (
                    <div key={p.productCode} className="p-3 rounded-lg bg-slate-950/40 border border-slate-800">
                      <div className="flex items-center justify-between text-xs">
                        <div>
                          <span className="font-semibold text-slate-200">{p.productName}</span>
                          <span className="text-[10px] text-slate-500 ml-2 font-mono">({p.productCode})</span>
                        </div>
                        <div className="flex items-center space-x-2 font-mono">
                          <span className="text-slate-300 font-bold">{p.customerCount} custs</span>
                          <span className="text-blue-400 font-semibold">({p.penetrationPercentage}%)</span>
                        </div>
                      </div>
                      <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full"
                          style={{ width: `${Math.min(100, p.penetrationPercentage)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Shallow Depth Accounts */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-200">Shallow Product Depth Accounts (Single Product)</h3>
                  <span className="text-[11px] text-slate-500">{productPen.shallowDepthCustomers.length} accounts</span>
                </div>
                <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                  {productPen.shallowDepthCustomers.map((c) => (
                    <div
                      key={c.customerId}
                      onClick={() => handleSelectCustomer(c.customerId)}
                      className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 hover:border-slate-700 cursor-pointer text-xs"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-200">{c.customerName}</span>
                        <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                          {c.productCount} Product
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">
                        Holding: {c.productsHeld.join(', ')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: ENGAGEMENT & SERVICE */}
          {activeTab === 'engagement-service' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Engagement Intelligence */}
              {engagement && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-200">Interaction Volume & Inactive Accounts</h3>
                    <span className="text-[11px] font-mono text-slate-400">
                      Total: {engagement.totalInteractions} interactions
                    </span>
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-[11px] font-semibold text-slate-400">Inactive Accounts (&gt;45 Days Rule)</h4>
                    {engagement.inactiveCustomers.length === 0 ? (
                      <p className="text-xs text-slate-500 italic py-2">All customers have recent recorded interactions.</p>
                    ) : (
                      engagement.inactiveCustomers.map((ic) => (
                        <div
                          key={ic.customerId}
                          onClick={() => handleSelectCustomer(ic.customerId)}
                          className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 hover:border-slate-700 cursor-pointer text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-200">{ic.customerName}</span>
                            <span className="text-[10px] font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                              {ic.daysSinceLastInteraction} days inactive
                            </span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-1">{ic.rule}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}

              {/* Service Quality */}
              {serviceQuality && (
                <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-200">Service Desk & SLA Compliance</h3>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Resolution Rate: {serviceQuality.resolutionRate}%
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center text-xs">
                    <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">Open Cases</span>
                      <span className="text-base font-bold text-amber-400 font-mono">{serviceQuality.openCases}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">SLA at Risk</span>
                      <span className="text-base font-bold text-orange-400 font-mono">{serviceQuality.slaAtRiskCount}</span>
                    </div>
                    <div className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800">
                      <span className="text-[10px] text-slate-400 block">SLA Breached</span>
                      <span className="text-base font-bold text-rose-400 font-mono">{serviceQuality.slaBreachedCount}</span>
                    </div>
                  </div>

                  <div className="mt-3">
                    <h4 className="text-[11px] font-semibold text-slate-400 mb-2">Service Concentration</h4>
                    <div className="space-y-1.5">
                      {serviceQuality.customerConcentration.map((sc) => (
                        <div
                          key={sc.customerId}
                          onClick={() => handleSelectCustomer(sc.customerId)}
                          className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 hover:border-slate-700 cursor-pointer flex items-center justify-between text-xs"
                        >
                          <span className="font-medium text-slate-200">{sc.customerName}</span>
                          <div className="flex items-center space-x-2 text-[11px] font-mono">
                            <span className="text-amber-400 font-semibold">{sc.openCaseCount} Open</span>
                            {sc.slaAtRiskCount > 0 && (
                              <span className="text-rose-400 bg-rose-500/10 px-1.5 py-0.2 rounded">
                                {sc.slaAtRiskCount} SLA Risk
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB: PIPELINE, SIGNALS & NBAS */}
          {activeTab === 'opportunities-signals' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {/* Pipeline */}
                {opportunityData && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                    <h3 className="text-xs font-semibold text-slate-200">Pipeline by Stage</h3>
                    <div className="space-y-2">
                      {opportunityData.stageBreakdown.map((s) => (
                        <div key={s.stage} className="p-2.5 rounded-lg bg-slate-950/40 border border-slate-800 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-300">{s.stage}</span>
                            <span className="font-mono text-purple-400 font-semibold">
                              ₹{(s.totalValue / 100000).toFixed(1)} L
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 mt-1">
                            {s.count} deals | Weighted: ₹{(s.weightedValue / 100000).toFixed(1)} L
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Signals */}
                {signalData && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                    <h3 className="text-xs font-semibold text-slate-200">Active Signals</h3>
                    <div className="grid grid-cols-4 gap-1 text-center text-xs">
                      <div className="p-2 rounded bg-rose-950/40 border border-rose-800 text-rose-300">
                        <span className="text-[10px] block">Critical</span>
                        <span className="font-bold">{signalData.severityBreakdown.critical}</span>
                      </div>
                      <div className="p-2 rounded bg-amber-950/40 border border-amber-800 text-amber-300">
                        <span className="text-[10px] block">High</span>
                        <span className="font-bold">{signalData.severityBreakdown.high}</span>
                      </div>
                      <div className="p-2 rounded bg-blue-950/40 border border-blue-800 text-blue-300">
                        <span className="text-[10px] block">Medium</span>
                        <span className="font-bold">{signalData.severityBreakdown.medium}</span>
                      </div>
                      <div className="p-2 rounded bg-slate-800 border border-slate-700 text-slate-300">
                        <span className="text-[10px] block">Low</span>
                        <span className="font-bold">{signalData.severityBreakdown.low}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5 max-h-[300px] overflow-y-auto">
                      {signalData.recentSignals.map((sig, idx) => (
                        <div key={`${sig.id}-${idx}`} className="p-2 rounded bg-slate-950/50 border border-slate-800 text-xs">
                          <span className="font-semibold text-slate-200 block truncate">{sig.headline}</span>
                          <span className="text-[10px] text-slate-400">{sig.customerName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Outcomes */}
                {actionOutcomes && (
                  <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                    <h3 className="text-xs font-semibold text-slate-200">Action Outcomes Trace</h3>
                    <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Proposed</span>
                        <span className="font-bold text-slate-200">{actionOutcomes.totalProposed}</span>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Executed</span>
                        <span className="font-bold text-blue-400">{actionOutcomes.totalExecuted}</span>
                      </div>
                      <div className="p-2 rounded bg-slate-950 border border-slate-800">
                        <span className="text-[10px] text-slate-400 block">Success</span>
                        <span className="font-bold text-emerald-400">{actionOutcomes.totalSuccessful}</span>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      {actionOutcomes.recentTraces.slice(0, 5).map((t, idx) => (
                        <div key={`${t.id}-${idx}`} className="p-2 rounded bg-slate-950/40 border border-slate-800 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-slate-300 truncate">{t.actionTitle}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400">
                              {t.status}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500">{t.customerName}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: WHAT CHANGED & CHANGELOG */}
          {activeTab === 'what-changed' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* What Changed Differential Telemetry */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-200">What Changed (Telemetry Differentials)</h3>
                  <span className="text-[11px] text-slate-500 font-mono">{whatChanged.length} events</span>
                </div>
                {whatChanged.length === 0 ? (
                  <p className="text-xs text-slate-500 italic py-6 text-center">
                    No material differentials recorded for this comparison window.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                    {whatChanged.map((chg, idx) => (
                      <div
                        key={`${chg.id}-${idx}`}
                        onClick={() => handleSelectCustomer(chg.customerId)}
                        className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 hover:border-slate-700 cursor-pointer text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200">{chg.customerName}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {chg.changeType}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 font-mono text-[11px]">
                          <span className="text-slate-400">{String(chg.previousValue)}</span>
                          <ArrowRight className="w-3 h-3 text-slate-500" />
                          <span className="text-slate-100 font-semibold">{String(chg.currentValue)}</span>
                        </div>
                        <p className="text-[11px] text-slate-400">{chg.evidence}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Portfolio Chronological Changelog */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-200">Portfolio Chronological Changelog</h3>
                  <span className="text-[11px] text-slate-500">Live Relationship Event Stream</span>
                </div>
                <div className="space-y-2 max-h-[460px] overflow-y-auto pr-1">
                  {changelog.map((ev, idx) => (
                    <div key={`${ev.id}-${idx}`} className="p-3 rounded-lg bg-slate-950/40 border border-slate-800 text-xs space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-200">{ev.title}</span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          {new Date(ev.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{ev.description}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                        <span>{ev.customerName}</span>
                        <span className="font-mono">{ev.category}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: HEALTH MATRIX & FOCUS AREAS */}
          {activeTab === 'matrix-focus' && (
            <div className="space-y-5">
              {/* Explainable 2x2 Matrix */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-200">Portfolio Health Matrix (CORE Score × Momentum)</h3>
                  <span className="text-[11px] text-slate-500">Descriptive categorization only; non-predictive</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {healthMatrix.map((q) => (
                    <div
                      key={q.quadrantKey}
                      className="p-4 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-xs text-slate-200">{q.title}</span>
                        <span className="text-base font-bold text-slate-100 font-mono">
                          {q.customerCount} customers ({q.percentage}%)
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">{q.description}</p>
                      <div className="text-[10px] text-slate-500 font-mono">
                        Rule: {q.coreScoreBand} CORE Score & {q.momentumState} Momentum
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Deterministic Focus Areas */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-200">Manager Deterministic Focus Areas</h3>
                  <span className="text-[11px] text-slate-500">Rules-based operational attention areas</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {focusAreas.map((fa) => (
                    <div
                      key={fa.id}
                      className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 space-y-2 flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-xs text-slate-200">{fa.title}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${
                              fa.priority === 'HIGH'
                                ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}
                          >
                            {fa.customerCount} Accounts
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 mt-1">{fa.description}</p>
                      </div>
                      <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-500">
                        <span className="font-semibold text-slate-400">Evidence Rule:</span> {fa.ruleEvidence}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB: PERIOD COMPARISON */}
          {activeTab === 'comparison' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold text-slate-200">Period-Over-Period Comparison</h3>
                  <p className="text-xs text-slate-400">
                    Comparing 30 Days Ago vs Current Authorized Portfolio State
                  </p>
                </div>
                <span className="text-xs font-mono text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-1 rounded">
                  Population: Authorized Portfolio
                </span>
              </div>

              {comparison ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-medium text-[11px]">
                        <th className="pb-2.5">Portfolio Metric</th>
                        <th className="pb-2.5 text-right">30 Days Ago</th>
                        <th className="pb-2.5 text-right">Current Period</th>
                        <th className="pb-2.5 text-right">Net Change</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono">
                      <tr>
                        <td className="py-3 font-sans text-slate-300 font-medium">Customer Count</td>
                        <td className="py-3 text-right text-slate-400">{comparison.period1.customerCount}</td>
                        <td className="py-3 text-right text-slate-200 font-bold">{comparison.period2.customerCount}</td>
                        <td className="py-3 text-right text-slate-300">
                          {comparison.deltas.customerCountChange > 0
                            ? `+${comparison.deltas.customerCountChange}`
                            : comparison.deltas.customerCountChange}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 font-sans text-slate-300 font-medium">Total Relationship Value</td>
                        <td className="py-3 text-right text-slate-400">
                          ₹{(comparison.period1.totalRelationshipValue / 10000000).toFixed(2)} Cr
                        </td>
                        <td className="py-3 text-right text-emerald-400 font-bold">
                          ₹{(comparison.period2.totalRelationshipValue / 10000000).toFixed(2)} Cr
                        </td>
                        <td className="py-3 text-right text-emerald-400 font-bold">
                          {comparison.deltas.relationshipValueChangePct > 0 ? '+' : ''}
                          {comparison.deltas.relationshipValueChangePct}%
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 font-sans text-slate-300 font-medium">Average CORE Score</td>
                        <td className="py-3 text-right text-slate-400">{comparison.period1.averageCoreScore}</td>
                        <td className="py-3 text-right text-indigo-300 font-bold">{comparison.period2.averageCoreScore}</td>
                        <td className="py-3 text-right text-slate-300">
                          {comparison.deltas.coreScoreDelta > 0
                            ? `+${comparison.deltas.coreScoreDelta}`
                            : comparison.deltas.coreScoreDelta}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 font-sans text-slate-300 font-medium">Open Pipeline Value</td>
                        <td className="py-3 text-right text-slate-400">
                          ₹{(comparison.period1.opportunityPipelineValue / 10000000).toFixed(2)} Cr
                        </td>
                        <td className="py-3 text-right text-purple-400 font-bold">
                          ₹{(comparison.period2.opportunityPipelineValue / 10000000).toFixed(2)} Cr
                        </td>
                        <td className="py-3 text-right text-slate-300">
                          {comparison.deltas.pipelineValueChange > 0 ? '+' : ''}₹
                          {(comparison.deltas.pipelineValueChange / 100000).toFixed(1)} L
                        </td>
                      </tr>
                      <tr>
                        <td className="py-3 font-sans text-slate-300 font-medium">Open Service Cases</td>
                        <td className="py-3 text-right text-slate-400">{comparison.period1.openCases}</td>
                        <td className="py-3 text-right text-amber-400 font-bold">{comparison.period2.openCases}</td>
                        <td className="py-3 text-right text-slate-300">
                          {comparison.deltas.openCasesDelta > 0
                            ? `+${comparison.deltas.openCasesDelta}`
                            : comparison.deltas.openCasesDelta}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Loading comparison calculation...
                </div>
              )}
            </div>
          )}

          {/* TAB: AUTHORIZED CUSTOMERS (PAGINATED DRILL-DOWN TABLE) */}
          {activeTab === 'customers' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-semibold text-slate-200">Authorized Customer Drill-Down</h3>
                  <span className="text-[11px] text-slate-400">
                    Showing {customerData.customers.length} of {customerData.total} authorized accounts
                  </span>
                </div>
                <button
                  onClick={handleExportCSV}
                  disabled={isExporting}
                  className="px-3 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center space-x-1.5 transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Export Customer List</span>
                </button>
              </div>

              {isCustomerLoading ? (
                <div className="py-16 text-center text-slate-500 text-xs">
                  <Clock className="w-5 h-5 animate-spin mx-auto mb-2" />
                  Loading customer records...
                </div>
              ) : customerData.customers.length === 0 ? (
                <div className="py-16 text-center text-slate-500 text-xs italic">
                  No authorized customers matching the active filters.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 font-medium text-[11px]">
                        <th className="pb-2.5">Customer</th>
                        <th className="pb-2.5">Entity / Risk</th>
                        <th className="pb-2.5 text-right">Relationship Value</th>
                        <th className="pb-2.5 text-center">CORE Score</th>
                        <th className="pb-2.5 text-center">Momentum</th>
                        <th className="pb-2.5 text-center">Products</th>
                        <th className="pb-2.5 text-center">Open Cases</th>
                        <th className="pb-2.5 text-center">Deals</th>
                        <th className="pb-2.5 text-center">Signals</th>
                        <th className="pb-2.5 text-right">Last Interaction</th>
                        <th className="pb-2.5 text-center">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {customerData.customers.map((c) => (
                        <tr
                          key={c.id}
                          className="hover:bg-slate-850/50 cursor-pointer transition-colors"
                          onClick={() => handleSelectCustomer(c.id)}
                        >
                          <td className="py-2.5">
                            <span className="font-semibold text-slate-200 block">{c.name}</span>
                            <span className="text-[10px] text-slate-500 font-mono">{c.customerCode}</span>
                          </td>
                          <td className="py-2.5 text-[11px] text-slate-400">
                            <div>{c.entityType}</div>
                            <span className="text-[10px] text-slate-500">Risk: {c.riskCategory}</span>
                          </td>
                          <td className="py-2.5 text-right font-mono font-semibold text-emerald-400">
                            ₹{(c.relationshipValue / 100000).toFixed(2)} L
                          </td>
                          <td className="py-2.5 text-center font-mono font-bold text-indigo-300">
                            {c.coreScore}
                          </td>
                          <td className="py-2.5 text-center">
                            <span
                              className={`text-[10px] px-1.5 py-0.5 rounded font-medium inline-flex items-center space-x-1 ${
                                c.momentum === 'POSITIVE'
                                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                  : c.momentum === 'NEGATIVE'
                                  ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                                  : 'bg-slate-800 text-slate-300 border border-slate-700'
                              }`}
                            >
                              <span>{c.momentum}</span>
                            </span>
                          </td>
                          <td className="py-2.5 text-center font-mono text-slate-300">{c.productCount}</td>
                          <td className="py-2.5 text-center font-mono text-amber-400 font-semibold">
                            {c.openCasesCount}
                          </td>
                          <td className="py-2.5 text-center font-mono text-purple-400">{c.openOpportunitiesCount}</td>
                          <td className="py-2.5 text-center font-mono text-rose-400">{c.activeSignalsCount}</td>
                          <td className="py-2.5 text-right font-mono text-[11px] text-slate-400">
                            {c.lastInteractionDate || 'Never'}
                          </td>
                          <td className="py-2.5 text-center">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSelectCustomer(c.id);
                              }}
                              className="px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] transition-colors"
                            >
                              Profile
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Pagination Bar */}
              {customerData.totalPages > 1 && (
                <div className="flex items-center justify-between pt-3 border-t border-slate-800 text-xs text-slate-400">
                  <span>
                    Page {customerData.page} of {customerData.totalPages}
                  </span>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => loadCustomerDrillDown(Math.max(1, customerPage - 1))}
                      disabled={customerPage <= 1 || isCustomerLoading}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition-colors"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => loadCustomerDrillDown(Math.min(customerData.totalPages, customerPage + 1))}
                      disabled={customerPage >= customerData.totalPages || isCustomerLoading}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 transition-colors"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Customer Portfolio Profile Drawer */}
      <CustomerPortfolioDrawer
        isOpen={Boolean(selectedCustomerId)}
        onClose={() => {
          setSelectedCustomerId(null);
          setCustomerProfile(null);
        }}
        profile={customerProfile}
        isLoading={isProfileLoading}
        onNavigateToCustomer={onNavigateToCustomer}
        onNavigateToTwin={onNavigateToTwin}
      />

      {/* Metric Transparency Modal */}
      <MetricInfoModal
        isOpen={Boolean(selectedMetric)}
        onClose={() => setSelectedMetric(null)}
        metric={selectedMetric}
      />
    </div>
  );
};
