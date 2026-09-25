import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Download,
  Filter,
  RotateCcw,
  Calendar,
  Building2,
  Users,
  Briefcase,
  AlertTriangle,
  Clock,
  CheckCircle2,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
  Search,
  Package,
  Activity,
  Layers,
  Info,
  ChevronDown,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
} from 'recharts';
import { bankingApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { ModuleType } from '../../types';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatINR } from '../../data/mockIndianBankingData';

interface AnalyticsModuleProps {
  onNavigateToCustomer?: (cifOrCode: string | number) => void;
  onNavigateToModule?: (module: ModuleType) => void;
}

type TabType =
  | 'overview'
  | 'portfolio'
  | 'health'
  | 'opportunities'
  | 'service'
  | 'rm'
  | 'products'
  | 'trends';

export const AnalyticsModule: React.FC<AnalyticsModuleProps> = ({
  onNavigateToCustomer,
  onNavigateToModule,
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('overview');

  // Global Filter State
  const [period, setPeriod] = useState<string>('last_30_days');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [branch, setBranch] = useState<string>('ALL');
  const [segment, setSegment] = useState<string>('ALL');
  const [status, setStatus] = useState<string>('ALL');
  const [scoreBand, setScoreBand] = useState<string>('ALL');
  const [momentum, setMomentum] = useState<string>('ALL');
  const [productCount, setProductCount] = useState<string>('ALL');
  const [oppStage, setOppStage] = useState<string>('ALL');
  const [caseStatus, setCaseStatus] = useState<string>('ALL');

  // UI state
  const [showAdvancedFilters, setShowAdvancedFilters] = useState<boolean>(false);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [exportSuccessMsg, setExportSuccessMsg] = useState<string | null>(null);

  // Data states
  const [loading, setLoading] = useState<boolean>(true);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [portfolioData, setPortfolioData] = useState<any>(null);
  const [healthData, setHealthData] = useState<any>(null);
  const [opportunityData, setOpportunityData] = useState<any>(null);
  const [serviceData, setServiceData] = useState<any>(null);
  const [rmData, setRmData] = useState<any>(null);
  const [productData, setProductData] = useState<any>(null);
  const [trendsData, setTrendsData] = useState<any>(null);
  const [whatChangedData, setWhatChangedData] = useState<any>(null);

  // Table search & sort helpers
  const [portfolioSearch, setPortfolioSearch] = useState<string>('');
  const [healthSearch, setHealthSearch] = useState<string>('');
  const [oppSearch, setOppSearch] = useState<string>('');
  const [caseSearch, setCaseSearch] = useState<string>('');

  const currentFilters = useMemo(() => {
    return {
      period,
      startDate: period === 'custom' ? startDate : undefined,
      endDate: period === 'custom' ? endDate : undefined,
      branch: branch !== 'ALL' ? branch : undefined,
      segment: segment !== 'ALL' ? segment : undefined,
      status: status !== 'ALL' ? status : undefined,
      scoreBand: scoreBand !== 'ALL' ? scoreBand : undefined,
      momentum: momentum !== 'ALL' ? momentum : undefined,
      productCount: productCount !== 'ALL' ? productCount : undefined,
      oppStage: oppStage !== 'ALL' ? oppStage : undefined,
      caseStatus: caseStatus !== 'ALL' ? caseStatus : undefined,
    };
  }, [
    period,
    startDate,
    endDate,
    branch,
    segment,
    status,
    scoreBand,
    momentum,
    productCount,
    oppStage,
    caseStatus,
  ]);

  const activeFilterCount = useMemo(() => {
    let cnt = 0;
    if (period !== 'last_30_days') cnt++;
    if (branch !== 'ALL') cnt++;
    if (segment !== 'ALL') cnt++;
    if (status !== 'ALL') cnt++;
    if (scoreBand !== 'ALL') cnt++;
    if (momentum !== 'ALL') cnt++;
    if (productCount !== 'ALL') cnt++;
    if (oppStage !== 'ALL') cnt++;
    if (caseStatus !== 'ALL') cnt++;
    return cnt;
  }, [period, branch, segment, status, scoreBand, momentum, productCount, oppStage, caseStatus]);

  const resetFilters = () => {
    setPeriod('last_30_days');
    setStartDate('');
    setEndDate('');
    setBranch('ALL');
    setSegment('ALL');
    setStatus('ALL');
    setScoreBand('ALL');
    setMomentum('ALL');
    setProductCount('ALL');
    setOppStage('ALL');
    setCaseStatus('ALL');
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const [ov, wc] = await Promise.all([
          bankingApi.getAnalyticsOverview(currentFilters),
          bankingApi.getWhatChanged(currentFilters),
        ]);
        setOverviewData(ov);
        setWhatChangedData(wc);
      } else if (activeTab === 'portfolio') {
        const res = await bankingApi.getRelationshipPortfolio(currentFilters);
        setPortfolioData(res);
      } else if (activeTab === 'health') {
        const res = await bankingApi.getCustomerHealth(currentFilters);
        setHealthData(res);
      } else if (activeTab === 'opportunities') {
        const res = await bankingApi.getOpportunityAnalytics(currentFilters);
        setOpportunityData(res);
      } else if (activeTab === 'service') {
        const res = await bankingApi.getServicePerformance(currentFilters);
        setServiceData(res);
      } else if (activeTab === 'rm') {
        const res = await bankingApi.getRmProductivity(currentFilters);
        setRmData(res);
      } else if (activeTab === 'products') {
        const res = await bankingApi.getProductPenetration(currentFilters);
        setProductData(res);
      } else if (activeTab === 'trends') {
        const [tr, wc] = await Promise.all([
          bankingApi.getCoreScoreTrends(currentFilters),
          bankingApi.getWhatChanged(currentFilters),
        ]);
        setTrendsData(tr);
        setWhatChangedData(wc);
      }
    } catch (err) {
      console.error('Error loading analytics dataset:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, currentFilters]);

  const handleExport = async (type: string) => {
    setIsExporting(true);
    setExportSuccessMsg(null);
    try {
      const filename = await bankingApi.downloadAnalyticsCsv(type, currentFilters);
      setExportSuccessMsg(`Successfully exported ${filename}`);
      setTimeout(() => setExportSuccessMsg(null), 4000);
    } catch (err: any) {
      console.error('CSV export failed:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const filteredPortfolioCustomers = useMemo(() => {
    if (!portfolioData?.customers) return [];
    if (!portfolioSearch) return portfolioData.customers;
    const q = portfolioSearch.toLowerCase();
    return portfolioData.customers.filter(
      (c: any) =>
        c.name.toLowerCase().includes(q) ||
        c.customerCode.toLowerCase().includes(q) ||
        c.rmName.toLowerCase().includes(q)
    );
  }, [portfolioData, portfolioSearch]);

  const filteredHealthChanges = useMemo(() => {
    if (!healthData?.healthChanges) return [];
    if (!healthSearch) return healthData.healthChanges;
    const q = healthSearch.toLowerCase();
    return healthData.healthChanges.filter(
      (c: any) =>
        c.name.toLowerCase().includes(q) ||
        c.customerCode.toLowerCase().includes(q) ||
        c.rmName.toLowerCase().includes(q)
    );
  }, [healthData, healthSearch]);

  const filteredOpps = useMemo(() => {
    if (!opportunityData?.opportunities) return [];
    if (!oppSearch) return opportunityData.opportunities;
    const q = oppSearch.toLowerCase();
    return opportunityData.opportunities.filter(
      (o: any) =>
        o.title.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.opportunityCode.toLowerCase().includes(q) ||
        o.assignedToName.toLowerCase().includes(q)
    );
  }, [opportunityData, oppSearch]);

  const filteredCases = useMemo(() => {
    if (!serviceData?.cases) return [];
    if (!caseSearch) return serviceData.cases;
    const q = caseSearch.toLowerCase();
    return serviceData.cases.filter(
      (sc: any) =>
        sc.title.toLowerCase().includes(q) ||
        sc.caseNumber.toLowerCase().includes(q) ||
        sc.assignedToName.toLowerCase().includes(q)
    );
  }, [serviceData, caseSearch]);

  return (
    <div className="space-y-5">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-700" />
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">
              Advanced Analytics & Management Intelligence
            </h1>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded border border-slate-200 font-mono">
              Phase 16 Engine
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Server-aggregated portfolio health, relationship depth, operational throughput, and deterministic trends.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {exportSuccessMsg && (
            <span className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded flex items-center gap-1.5 animate-fade-in">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {exportSuccessMsg}
            </span>
          )}

          <div className="relative group">
            <Button
              variant="outline"
              size="sm"
              disabled={isExporting}
              className="text-xs flex items-center gap-1.5 h-8 border-slate-300"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>{isExporting ? 'Exporting...' : 'Export CSV'}</span>
              <ChevronDown className="w-3 h-3 text-slate-400" />
            </Button>
            <div className="absolute right-0 top-full mt-1 w-52 bg-white rounded-md shadow-lg border border-slate-200 py-1 hidden group-hover:block z-30">
              <button
                onClick={() => handleExport('portfolio')}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
              >
                <span>Portfolio Analytics</span>
                <span className="text-[10px] text-slate-400">CSV</span>
              </button>
              <button
                onClick={() => handleExport('health')}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
              >
                <span>Customer Health & Scores</span>
                <span className="text-[10px] text-slate-400">CSV</span>
              </button>
              <button
                onClick={() => handleExport('opportunities')}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
              >
                <span>Opportunity Pipeline</span>
                <span className="text-[10px] text-slate-400">CSV</span>
              </button>
              <button
                onClick={() => handleExport('service_cases')}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
              >
                <span>Service Desk & SLA</span>
                <span className="text-[10px] text-slate-400">CSV</span>
              </button>
              <button
                onClick={() => handleExport('rm_productivity')}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
              >
                <span>RM Productivity</span>
                <span className="text-[10px] text-slate-400">CSV</span>
              </button>
              <button
                onClick={() => handleExport('products')}
                className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-slate-50 flex items-center justify-between"
              >
                <span>Product Penetration</span>
                <span className="text-[10px] text-slate-400">CSV</span>
              </button>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="text-xs h-8 px-2.5 border-slate-300"
            title="Reload analytical data"
          >
            <RotateCcw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Global Server-Side Filter Bar */}
      <div className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Period Selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              <span>Period:</span>
              <select
                value={period}
                onChange={(e) => setPeriod(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-cyan-600 font-normal"
              >
                <option value="last_30_days">Last 30 Days (Standard)</option>
                <option value="today">Today</option>
                <option value="last_7_days">Last 7 Days</option>
                <option value="last_90_days">Last 90 Days</option>
                <option value="this_quarter">This Quarter</option>
                <option value="previous_quarter">Previous Quarter</option>
                <option value="custom">Custom Date Range...</option>
              </select>
            </div>

            {/* Branch Selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
              <Building2 className="w-3.5 h-3.5 text-slate-500" />
              <span>Branch:</span>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-cyan-600 font-normal"
              >
                <option value="ALL">All Branches</option>
                <option value="0104">0104 - Mumbai Fort Branch</option>
              </select>
            </div>

            {/* Segment Selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
              <Briefcase className="w-3.5 h-3.5 text-slate-500" />
              <span>Segment:</span>
              <select
                value={segment}
                onChange={(e) => setSegment(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-cyan-600 font-normal"
              >
                <option value="ALL">All Segments</option>
                <option value="INDIVIDUAL">Individual (Retail)</option>
                <option value="PROPRIETORSHIP">Proprietorship (MSME)</option>
                <option value="PRIVATE_LIMITED">Private Limited (Mid-Corporate)</option>
                <option value="PUBLIC_LIMITED">Public Limited (Enterprise)</option>
              </select>
            </div>

            {/* Customer Status */}
            <div className="flex items-center gap-1.5 text-xs text-slate-700 font-medium">
              <span>Status:</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="bg-slate-50 border border-slate-300 rounded px-2.5 py-1 text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-cyan-600 font-normal"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="DORMANT">Dormant</option>
                <option value="INACTIVE">Inactive</option>
              </select>
            </div>

            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="text-xs text-cyan-700 hover:text-cyan-800 font-medium flex items-center gap-1 ml-1 cursor-pointer"
            >
              <Filter className="w-3 h-3" />
              <span>{showAdvancedFilters ? 'Fewer Filters' : 'More Filters'}</span>
              {activeFilterCount > 0 && (
                <span className="bg-cyan-100 text-cyan-800 rounded-full px-1.5 py-0.2 text-[10px] font-bold">
                  {activeFilterCount}
                </span>
              )}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeFilterCount > 0 && (
              <button
                onClick={resetFilters}
                className="text-xs text-slate-500 hover:text-slate-800 flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}
          </div>
        </div>

        {/* Custom Date Range Row */}
        {period === 'custom' && (
          <div className="flex items-center gap-3 pt-2 border-t border-slate-100 text-xs">
            <span className="text-slate-500 font-medium">Custom Range:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800"
            />
            <span className="text-slate-400">to</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-slate-50 border border-slate-300 rounded px-2 py-0.5 text-xs text-slate-800"
            />
          </div>
        )}

        {/* Secondary Filters Tray */}
        {showAdvancedFilters && (
          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div>
              <label className="block text-[11px] text-slate-500 font-medium mb-1">CORE Score Band</label>
              <select
                value={scoreBand}
                onChange={(e) => setScoreBand(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800"
              >
                <option value="ALL">All Bands</option>
                <option value="90-100">90–100 (Prime Sovereign)</option>
                <option value="75-89">75–89 (Strong Growth)</option>
                <option value="60-74">60–74 (Standard Stable)</option>
                <option value="40-59">40–59 (Needs Attention)</option>
                <option value="0-39">0–39 (High Risk)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 font-medium mb-1">Momentum</label>
              <select
                value={momentum}
                onChange={(e) => setMomentum(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800"
              >
                <option value="ALL">All Momentum</option>
                <option value="UP">UP (Improving)</option>
                <option value="STABLE">STABLE (Unchanged)</option>
                <option value="DOWN">DOWN (Deteriorating)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 font-medium mb-1">Product Depth</label>
              <select
                value={productCount}
                onChange={(e) => setProductCount(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800"
              >
                <option value="ALL">All Depths</option>
                <option value="1">1 Product</option>
                <option value="2">2 Products</option>
                <option value="3">3 Products</option>
                <option value="4+">4+ Products</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 font-medium mb-1">Opportunity Stage</label>
              <select
                value={oppStage}
                onChange={(e) => setOppStage(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800"
              >
                <option value="ALL">All Stages</option>
                <option value="IDENTIFIED">Identified</option>
                <option value="QUALIFIED">Qualified</option>
                <option value="PROPOSAL">Proposal</option>
                <option value="NEGOTIATION">Negotiation</option>
                <option value="WON">Closed Won</option>
                <option value="LOST">Closed Lost</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-500 font-medium mb-1">Case Status</label>
              <select
                value={caseStatus}
                onChange={(e) => setCaseStatus(e.target.value)}
                className="w-full bg-slate-50 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800"
              >
                <option value="ALL">All Statuses</option>
                <option value="OPEN">Open</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
                <option value="ESCALATED">Escalated</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Primary Analytics Navigation Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto no-scrollbar gap-1 text-xs font-medium">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'overview'
              ? 'border-cyan-700 text-cyan-800 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          Executive Overview
        </button>

        <button
          onClick={() => setActiveTab('portfolio')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'portfolio'
              ? 'border-cyan-700 text-cyan-800 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          Relationship Portfolio
        </button>

        <button
          onClick={() => setActiveTab('health')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'health'
              ? 'border-cyan-700 text-cyan-800 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          Customer Health
        </button>

        <button
          onClick={() => setActiveTab('opportunities')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'opportunities'
              ? 'border-cyan-700 text-cyan-800 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          Opportunity Performance
        </button>

        <button
          onClick={() => setActiveTab('service')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'service'
              ? 'border-cyan-700 text-cyan-800 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          Service Performance & SLA
        </button>

        <button
          onClick={() => setActiveTab('rm')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'rm'
              ? 'border-cyan-700 text-cyan-800 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          RM Productivity
        </button>

        <button
          onClick={() => setActiveTab('products')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'products'
              ? 'border-cyan-700 text-cyan-800 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          Product Penetration
        </button>

        <button
          onClick={() => setActiveTab('trends')}
          className={`px-3 py-2 border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
            activeTab === 'trends'
              ? 'border-cyan-700 text-cyan-800 font-bold'
              : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          Trends & "What Changed?"
        </button>
      </div>

      {/* Main Tab Content */}
      {loading ? (
        <div className="bg-white rounded-lg border border-slate-200 p-12 text-center text-slate-500">
          <RotateCcw className="w-6 h-6 animate-spin mx-auto text-cyan-700 mb-2" />
          <p className="text-xs font-medium">Aggregating PostgreSQL analytical telemetry...</p>
        </div>
      ) : (
        <>
          {/* TAB 1: EXECUTIVE OVERVIEW */}
          {activeTab === 'overview' && overviewData && (
            <div className="space-y-5">
              {/* 10 Structured KPI Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                {overviewData.kpis.map((kpi: any) => {
                  const isPositive = kpi.trend === 'UP';
                  const isNegative = kpi.trend === 'DOWN';
                  return (
                    <div
                      key={kpi.id}
                      className="bg-white rounded-lg border border-slate-200 p-3.5 shadow-2xs flex flex-col justify-between hover:border-slate-300 transition-colors"
                    >
                      <div>
                        <div className="flex items-center justify-between gap-1 text-slate-500 text-[11px] font-medium mb-1">
                          <span className="truncate">{kpi.label}</span>
                          {isPositive && <TrendingUp className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                          {isNegative && <TrendingDown className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                          {!isPositive && !isNegative && <Minus className="w-3.5 h-3.5 text-slate-400 shrink-0" />}
                        </div>
                        <div className="text-xl font-bold text-slate-900 tracking-tight">
                          {kpi.formattedValue || kpi.value.toLocaleString()}
                        </div>
                      </div>

                      <div className="mt-2.5 pt-2 border-t border-slate-100">
                        <div className="text-[10px] text-slate-500 leading-tight">
                          {kpi.comparison}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* What Changed Summary Card */}
              {whatChangedData && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <Activity className="w-4 h-4 text-cyan-700" />
                      <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                        "What Changed?" Engine — {whatChangedData.currentPeriod} vs {whatChangedData.comparisonPeriod}
                      </h3>
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">
                      Deterministic Variance Analysis
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {whatChangedData.changes.map((ch: any, idx: number) => (
                      <div key={idx} className="bg-white border border-slate-200 rounded p-2.5 text-xs shadow-2xs">
                        <div className="text-[11px] font-semibold text-slate-700 mb-0.5">{ch.metric}</div>
                        <div className="text-sm font-bold text-slate-900 mb-1">{ch.current}</div>
                        <div className="text-[10px] text-slate-500">{ch.summary}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actionable Insights Section */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900">Portfolio Action Highlights</span>
                    <Badge variant="warning" className="text-[10px]">Attention Needed</Badge>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600">
                    <li className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-800">Sunil Varma (CUS-48201)</span>
                        <p className="text-[11px] text-slate-500">CORE score declined to 76/100 due to 14-day seasonal cash flow overdue.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <Clock className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-800">Service SLA Warning</span>
                        <p className="text-[11px] text-slate-500">1 grievance approaching the 24-hour compliance deadline.</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900">Growth & Opportunities</span>
                    <Badge variant="success" className="text-[10px]">Expansion</Badge>
                  </div>
                  <ul className="space-y-2 text-xs text-slate-600">
                    <li className="flex items-start gap-2">
                      <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-800">Rahul Sharma (CUS-10482)</span>
                        <p className="text-[11px] text-slate-500">CORE score upgraded to 88/100 following ₹8.4L term deposit maturity roll-over.</p>
                      </div>
                    </li>
                    <li className="flex items-start gap-2">
                      <Briefcase className="w-4 h-4 text-cyan-600 shrink-0 mt-0.5" />
                      <div>
                        <span className="font-semibold text-slate-800">Kalyan Steel Works (CUS-91042)</span>
                        <p className="text-[11px] text-slate-500">Maintain sovereign score 92/100 with zero defaults and 2.4x debt service coverage.</p>
                      </div>
                    </li>
                  </ul>
                </div>

                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between pb-2 mb-3 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-900">Governance & Assurance</span>
                    <Badge variant="neutral" className="text-[10px]">Verified</Badge>
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    All analytics metrics represent verified database aggregations from active customer accounts, loan ledgers, and trade facilities. Metrics adhere strictly to RBAC boundaries.
                  </p>
                  <div className="mt-3 text-[11px] text-slate-500 flex items-center gap-1.5">
                    <ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                    <span>Audit trail logged: ANALYTICS_VIEWED</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: RELATIONSHIP PORTFOLIO */}
          {activeTab === 'portfolio' && portfolioData && (
            <div className="space-y-5">
              {/* Summary Stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Total Customers</span>
                  <div className="text-lg font-bold text-slate-900">{portfolioData.summary.totalCustomers}</div>
                  <span className="text-[10px] text-slate-400">{portfolioData.summary.activeCount} active</span>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Total TRV</span>
                  <div className="text-lg font-bold text-cyan-900">{portfolioData.summary.formattedTotalValue}</div>
                  <span className="text-[10px] text-slate-400">CASA + Term + Loans</span>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Average TRV</span>
                  <div className="text-lg font-bold text-slate-900">{portfolioData.summary.formattedAvgValue}</div>
                  <span className="text-[10px] text-slate-400">per relationship</span>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Median TRV</span>
                  <div className="text-lg font-bold text-slate-900">{portfolioData.summary.formattedMedianValue}</div>
                  <span className="text-[10px] text-slate-400">middle distribution</span>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Product Depth</span>
                  <div className="text-lg font-bold text-slate-900">{portfolioData.summary.averageProductsPerCustomer}</div>
                  <span className="text-[10px] text-slate-400">products/customer</span>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Total Enrollments</span>
                  <div className="text-lg font-bold text-slate-900">{portfolioData.summary.totalActiveProducts}</div>
                  <span className="text-[10px] text-slate-400">active contracts</span>
                </div>
              </div>

              {/* Breakdowns Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Segment Breakdown */}
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                    Portfolio by Customer Segment
                  </h3>
                  <div className="space-y-2.5">
                    {portfolioData.breakdowns.bySegment.map((seg: any) => (
                      <div key={seg.segment} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-slate-700">{seg.segment}</span>
                          <span className="text-slate-500">{seg.customerCount} clients ({seg.formattedValue})</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-cyan-700 h-1.5 rounded-full"
                            style={{ width: `${seg.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Score Band Breakdown */}
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                    CORE Score Distribution Bands
                  </h3>
                  <div className="space-y-2.5">
                    {portfolioData.breakdowns.byScoreBand.map((b: any) => (
                      <div key={b.band} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-medium text-slate-700">{b.label}</span>
                          <span className="text-slate-500">{b.customerCount} clients ({b.formattedValue})</span>
                        </div>
                        <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full ${
                              b.band === '90-100' ? 'bg-emerald-600' :
                              b.band === '75-89' ? 'bg-cyan-600' :
                              b.band === '60-74' ? 'bg-slate-400' :
                              b.band === '40-59' ? 'bg-amber-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${b.percentage}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Customer Portfolio Table */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="p-3 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-cyan-700" />
                    <span className="text-xs font-bold text-slate-900">Customer Portfolio Records</span>
                    <span className="text-[11px] text-slate-500 font-mono">({filteredPortfolioCustomers.length})</span>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Filter portfolio by customer or RM..."
                      value={portfolioSearch}
                      onChange={(e) => setPortfolioSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded pl-8 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-cyan-600"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Customer Code</th>
                        <th className="px-3 py-2">Customer Name</th>
                        <th className="px-3 py-2">Segment</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2 text-right">Relationship Value</th>
                        <th className="px-3 py-2 text-center">CORE Score</th>
                        <th className="px-3 py-2 text-center">Momentum</th>
                        <th className="px-3 py-2 text-center">Products</th>
                        <th className="px-3 py-2">Assigned RM</th>
                        <th className="px-3 py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredPortfolioCustomers.map((c: any) => (
                        <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2 font-mono text-[11px] font-semibold text-cyan-900">
                            {c.customerCode}
                          </td>
                          <td className="px-3 py-2 font-medium text-slate-900">{c.name}</td>
                          <td className="px-3 py-2 text-slate-600">{c.entityType}</td>
                          <td className="px-3 py-2">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                              c.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              'bg-slate-100 text-slate-600 border border-slate-200'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-medium text-slate-900">
                            {c.formattedValue}
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                              c.coreScore >= 85 ? 'bg-emerald-50 text-emerald-700' :
                              c.coreScore >= 70 ? 'bg-cyan-50 text-cyan-700' :
                              c.coreScore >= 50 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-700'
                            }`}>
                              {c.coreScore}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`text-[10px] font-bold ${
                              c.momentum === 'UP' ? 'text-emerald-600' :
                              c.momentum === 'DOWN' ? 'text-amber-600' : 'text-slate-500'
                            }`}>
                              {c.momentum}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center font-semibold text-slate-700">
                            {c.activeProductCount}
                          </td>
                          <td className="px-3 py-2 text-slate-600">{c.rmName}</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() => onNavigateToCustomer && onNavigateToCustomer(c.id)}
                              className="text-xs text-cyan-700 hover:text-cyan-900 font-medium inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Customer 360</span>
                              <ExternalLink className="w-3 h-3" />
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

          {/* TAB 3: CUSTOMER HEALTH */}
          {activeTab === 'health' && healthData && (
            <div className="space-y-5">
              {/* Metrics Header */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Average CORE Score</span>
                  <div className="text-xl font-bold text-slate-900">{healthData.metrics.averageCoreScore} / 100</div>
                  <span className="text-[10px] text-slate-400">portfolio index</span>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Relationships Evaluated</span>
                  <div className="text-xl font-bold text-slate-900">{healthData.metrics.totalEvaluated}</div>
                  <span className="text-[10px] text-slate-400">100% evaluated</span>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Score Improved</span>
                  <div className="text-xl font-bold text-emerald-600">{healthData.metrics.improvedCount}</div>
                  <span className="text-[10px] text-emerald-700">positive trajectory</span>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Score Stable</span>
                  <div className="text-xl font-bold text-slate-700">{healthData.metrics.stableCount}</div>
                  <span className="text-[10px] text-slate-400">consistent standing</span>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Score Declined</span>
                  <div className="text-xl font-bold text-amber-600">{healthData.metrics.declinedCount}</div>
                  <span className="text-[10px] text-amber-700">review suggested</span>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Needs Attention</span>
                  <div className="text-xl font-bold text-red-600">{healthData.metrics.needsAttentionCount}</div>
                  <span className="text-[10px] text-red-700">score &lt; 60 / high risk</span>
                </div>
              </div>

              {/* Needs Attention Alert Panel */}
              {healthData.needsAttention.length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3.5">
                  <div className="flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    <span className="text-xs font-bold text-amber-900">Relationships Requiring Officer Review</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {healthData.needsAttention.map((c: any) => (
                      <div key={c.id} className="bg-white rounded p-2.5 border border-amber-200 text-xs flex justify-between items-center">
                        <div>
                          <div className="font-semibold text-slate-900">{c.name} ({c.customerCode})</div>
                          <div className="text-[11px] text-amber-700 mt-0.5">{c.reason}</div>
                        </div>
                        <button
                          onClick={() => onNavigateToCustomer && onNavigateToCustomer(c.id)}
                          className="text-cyan-700 hover:text-cyan-900 text-xs font-medium inline-flex items-center gap-1 cursor-pointer"
                        >
                          Review 360 <ExternalLink className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Customer Health Table */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="p-3 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-cyan-700" />
                    <span className="text-xs font-bold text-slate-900">Relationship Health Trajectory</span>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search health records..."
                      value={healthSearch}
                      onChange={(e) => setHealthSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded pl-8 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-cyan-600"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Customer Code</th>
                        <th className="px-3 py-2">Customer Name</th>
                        <th className="px-3 py-2 text-center">Previous Score</th>
                        <th className="px-3 py-2 text-center">Current Score</th>
                        <th className="px-3 py-2 text-center">Delta</th>
                        <th className="px-3 py-2 text-center">Momentum</th>
                        <th className="px-3 py-2 text-center">Financial Health</th>
                        <th className="px-3 py-2 text-center">Credit Risk</th>
                        <th className="px-3 py-2 text-center">Engagement</th>
                        <th className="px-3 py-2">Assigned RM</th>
                        <th className="px-3 py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredHealthChanges.map((c: any) => (
                        <tr key={c.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2 font-mono text-[11px] font-semibold text-cyan-900">
                            {c.customerCode}
                          </td>
                          <td className="px-3 py-2 font-medium text-slate-900">{c.name}</td>
                          <td className="px-3 py-2 text-center text-slate-500 font-mono">{c.previousScore}</td>
                          <td className="px-3 py-2 text-center font-bold text-slate-900 font-mono">{c.currentScore}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              c.delta > 0 ? 'bg-emerald-50 text-emerald-700' :
                              c.delta < 0 ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {c.delta > 0 ? `+${c.delta}` : c.delta}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center">
                            <span className={`text-[10px] font-bold ${
                              c.momentum === 'UP' ? 'text-emerald-600' :
                              c.momentum === 'DOWN' ? 'text-amber-600' : 'text-slate-500'
                            }`}>
                              {c.momentum}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-center font-mono">{c.financialHealth}</td>
                          <td className="px-3 py-2 text-center font-mono">{c.creditRisk}</td>
                          <td className="px-3 py-2 text-center font-mono">{c.engagement}</td>
                          <td className="px-3 py-2 text-slate-600">{c.rmName}</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() => onNavigateToCustomer && onNavigateToCustomer(c.id)}
                              className="text-xs text-cyan-700 hover:text-cyan-900 font-medium cursor-pointer"
                            >
                              Customer 360
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

          {/* TAB 4: OPPORTUNITY PERFORMANCE */}
          {activeTab === 'opportunities' && opportunityData && (
            <div className="space-y-5">
              {/* Summary Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Active Deals</span>
                  <div className="text-lg font-bold text-slate-900">{opportunityData.summary.activeOpportunities}</div>
                  <span className="text-[10px] text-slate-400">in pipeline</span>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Pipeline Value</span>
                  <div className="text-lg font-bold text-cyan-900">{opportunityData.summary.formattedTotalPipelineValue}</div>
                  <span className="text-[10px] text-slate-400">unweighted</span>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Weighted Pipeline</span>
                  <div className="text-lg font-bold text-slate-900">{opportunityData.summary.formattedWeightedPipelineValue}</div>
                  <span className="text-[10px] text-slate-400">prob-adjusted</span>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Avg Deal Value</span>
                  <div className="text-lg font-bold text-slate-900">{opportunityData.summary.formattedAvgValue}</div>
                  <span className="text-[10px] text-slate-400">ticket size</span>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Closing Soon</span>
                  <div className="text-lg font-bold text-amber-600">{opportunityData.summary.closingSoonCount}</div>
                  <span className="text-[10px] text-amber-700">within 14 days</span>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Stalled Deals</span>
                  <div className="text-lg font-bold text-red-600">{opportunityData.summary.stalledCount}</div>
                  <span className="text-[10px] text-red-700">&gt; 30 days no move</span>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Won Deals</span>
                  <div className="text-lg font-bold text-emerald-600">{opportunityData.summary.wonCount}</div>
                  <span className="text-[10px] text-emerald-700">converted</span>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Lost Deals</span>
                  <div className="text-lg font-bold text-slate-500">{opportunityData.summary.lostCount}</div>
                  <span className="text-[10px] text-slate-400">archived</span>
                </div>
              </div>

              {/* Pipeline Funnel Visualizer */}
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Pipeline Funnel & Velocity Metrics
                  </h3>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Stage Count & Weighted Value
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                  {opportunityData.funnel.map((fn: any) => (
                    <div key={fn.stage} className="bg-slate-50 border border-slate-200 rounded p-3 text-center">
                      <div className="text-[11px] font-bold text-slate-700 mb-1">{fn.stage}</div>
                      <div className="text-xl font-bold text-slate-900">{fn.opportunityCount}</div>
                      <div className="text-[11px] text-cyan-800 font-mono font-medium mt-1">{fn.formattedValue}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Avg {fn.averageDaysInStage}d in stage</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Opportunities Table */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="p-3 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-700" />
                    <span className="text-xs font-bold text-slate-900">Opportunities Roster</span>
                    <span className="text-[11px] text-slate-500 font-mono">({filteredOpps.length})</span>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search opportunities..."
                      value={oppSearch}
                      onChange={(e) => setOppSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded pl-8 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-cyan-600"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Code</th>
                        <th className="px-3 py-2">Deal Title</th>
                        <th className="px-3 py-2">Customer</th>
                        <th className="px-3 py-2">Product</th>
                        <th className="px-3 py-2">Stage</th>
                        <th className="px-3 py-2 text-right">Value</th>
                        <th className="px-3 py-2 text-center">Probability</th>
                        <th className="px-3 py-2 text-right">Weighted</th>
                        <th className="px-3 py-2 text-center">Days in Stage</th>
                        <th className="px-3 py-2">Assigned Officer</th>
                        <th className="px-3 py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredOpps.map((o: any) => (
                        <tr key={o.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2 font-mono text-[11px] text-slate-600">{o.opportunityCode}</td>
                          <td className="px-3 py-2 font-medium text-slate-900">{o.title}</td>
                          <td className="px-3 py-2 text-slate-700">{o.customerName}</td>
                          <td className="px-3 py-2 text-slate-600">{o.productName}</td>
                          <td className="px-3 py-2">
                            <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                              {o.stage}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-right font-mono font-medium text-slate-900">{o.formattedValue}</td>
                          <td className="px-3 py-2 text-center font-mono">{o.probability}%</td>
                          <td className="px-3 py-2 text-right font-mono text-cyan-900 font-medium">{o.formattedWeightedValue}</td>
                          <td className="px-3 py-2 text-center font-mono text-slate-600">{o.daysInStage}d</td>
                          <td className="px-3 py-2 text-slate-600">{o.assignedToName}</td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() => onNavigateToModule && onNavigateToModule('opportunities')}
                              className="text-xs text-cyan-700 hover:text-cyan-900 font-medium cursor-pointer"
                            >
                              Manage Deal
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

          {/* TAB 5: SERVICE PERFORMANCE */}
          {activeTab === 'service' && serviceData && (
            <div className="space-y-5">
              {/* Service KPIs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Total Cases</span>
                  <div className="text-lg font-bold text-slate-900">{serviceData.metrics.casesOpened}</div>
                  <span className="text-[10px] text-slate-400">on record</span>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Resolved</span>
                  <div className="text-lg font-bold text-emerald-600">{serviceData.metrics.casesResolved}</div>
                  <span className="text-[10px] text-emerald-700">finalized</span>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Open / Pending</span>
                  <div className="text-lg font-bold text-slate-900">{serviceData.metrics.openCases + serviceData.metrics.pendingCases}</div>
                  <span className="text-[10px] text-slate-400">in resolution</span>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Escalated</span>
                  <div className="text-lg font-bold text-red-600">{serviceData.metrics.escalatedCases}</div>
                  <span className="text-[10px] text-red-700">supervisor tier</span>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">SLA Compliance</span>
                  <div className="text-lg font-bold text-cyan-900">{serviceData.metrics.slaCompliancePercentage}%</div>
                  <span className="text-[10px] text-slate-400">within SLA window</span>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">SLA At Risk</span>
                  <div className="text-lg font-bold text-amber-600">{serviceData.metrics.slaAtRisk}</div>
                  <span className="text-[10px] text-amber-700">&lt; 24h remaining</span>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Avg Resolution</span>
                  <div className="text-lg font-bold text-slate-900">{serviceData.metrics.averageResolutionTimeHours}h</div>
                  <span className="text-[10px] text-slate-400">resolved cases</span>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Median Resolution</span>
                  <div className="text-lg font-bold text-slate-900">{serviceData.metrics.medianResolutionTimeHours}h</div>
                  <span className="text-[10px] text-slate-400">midpoint duration</span>
                </div>
              </div>

              {/* Service Cases Table */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="p-3 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-cyan-700" />
                    <span className="text-xs font-bold text-slate-900">Service Tickets & SLA Adherence</span>
                    <span className="text-[11px] text-slate-500 font-mono">({filteredCases.length})</span>
                  </div>
                  <div className="relative w-full sm:w-64">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search service cases..."
                      value={caseSearch}
                      onChange={(e) => setCaseSearch(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded pl-8 pr-3 py-1 text-xs text-slate-800 placeholder-slate-400 focus:outline-hidden focus:ring-1 focus:ring-cyan-600"
                    />
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Case #</th>
                        <th className="px-3 py-2">Title</th>
                        <th className="px-3 py-2">Category</th>
                        <th className="px-3 py-2">Priority</th>
                        <th className="px-3 py-2">Status</th>
                        <th className="px-3 py-2 text-center">SLA State</th>
                        <th className="px-3 py-2">Assigned Agent</th>
                        <th className="px-3 py-2 text-center">Resolution</th>
                        <th className="px-3 py-2 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredCases.map((sc: any) => (
                        <tr key={sc.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2 font-mono text-[11px] font-semibold text-cyan-900">{sc.caseNumber}</td>
                          <td className="px-3 py-2 font-medium text-slate-900">{sc.title}</td>
                          <td className="px-3 py-2 text-slate-600">{sc.category}</td>
                          <td className="px-3 py-2">
                            <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                              sc.priority === 'CRITICAL' ? 'bg-red-50 text-red-700' :
                              sc.priority === 'HIGH' ? 'bg-amber-50 text-amber-700' : 'bg-slate-100 text-slate-600'
                            }`}>
                              {sc.priority}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-700">{sc.status}</td>
                          <td className="px-3 py-2 text-center">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                              sc.slaState === 'WITHIN_SLA' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              sc.slaState === 'AT_RISK' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-red-50 text-red-700 border border-red-200'
                            }`}>
                              {sc.slaState}
                            </span>
                          </td>
                          <td className="px-3 py-2 text-slate-600">{sc.assignedToName}</td>
                          <td className="px-3 py-2 text-center font-mono text-slate-600">
                            {sc.resolutionHours ? `${sc.resolutionHours}h` : '—'}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <button
                              onClick={() => onNavigateToModule && onNavigateToModule('cases')}
                              className="text-xs text-cyan-700 hover:text-cyan-900 font-medium cursor-pointer"
                            >
                              Service Desk
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

          {/* TAB 6: RM PRODUCTIVITY */}
          {activeTab === 'rm' && rmData && (
            <div className="space-y-5">
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Relationship Manager Operational Workload
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Objective throughput and active capacity across assigned portfolios, tasks, and deals.
                    </p>
                  </div>
                  <Badge variant="neutral" className="text-[10px]">{rmData.officers.length} Active Officers</Badge>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Emp ID</th>
                        <th className="px-3 py-2">Officer Name</th>
                        <th className="px-3 py-2">Department</th>
                        <th className="px-3 py-2 text-center">Assigned Clients</th>
                        <th className="px-3 py-2 text-center">Open Tasks</th>
                        <th className="px-3 py-2 text-center">Overdue</th>
                        <th className="px-3 py-2 text-center">Task Completion</th>
                        <th className="px-3 py-2 text-center">Active Deals</th>
                        <th className="px-3 py-2 text-right">Pipeline Value</th>
                        <th className="px-3 py-2 text-center">Interactions</th>
                        <th className="px-3 py-2 text-center">Avg Client CORE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {rmData.officers.map((off: any) => (
                        <tr key={off.rmId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2 font-mono text-[11px] text-slate-500">{off.employeeId}</td>
                          <td className="px-3 py-2 font-medium text-slate-900">{off.rmName}</td>
                          <td className="px-3 py-2 text-slate-600">{off.department}</td>
                          <td className="px-3 py-2 text-center font-bold text-slate-900">{off.assignedCustomersCount}</td>
                          <td className="px-3 py-2 text-center text-slate-700">{off.openTasks}</td>
                          <td className="px-3 py-2 text-center">
                            {off.overdueTasks > 0 ? (
                              <span className="text-amber-700 font-bold bg-amber-50 px-1.5 py-0.5 rounded text-[10px]">
                                {off.overdueTasks}
                              </span>
                            ) : (
                              <span className="text-emerald-700 font-medium">0</span>
                            )}
                          </td>
                          <td className="px-3 py-2 text-center font-mono font-medium">{off.completionRate}%</td>
                          <td className="px-3 py-2 text-center font-semibold text-slate-800">{off.activeOpportunitiesCount}</td>
                          <td className="px-3 py-2 text-right font-mono font-medium text-cyan-900">{off.formattedPipelineValue}</td>
                          <td className="px-3 py-2 text-center font-mono">{off.interactionsLogged}</td>
                          <td className="px-3 py-2 text-center font-bold text-slate-800">{off.averageCustomerCoreScore}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 7: PRODUCT PENETRATION */}
          {activeTab === 'products' && productData && (
            <div className="space-y-5">
              {/* Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Products in Catalog</span>
                  <div className="text-xl font-bold text-slate-900">{productData.summary.totalProductsInCatalog}</div>
                  <span className="text-[10px] text-slate-400">across CASA, Credit & Trade</span>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Total Active Enrollments</span>
                  <div className="text-xl font-bold text-cyan-900">{productData.summary.totalActiveEnrollments}</div>
                  <span className="text-[10px] text-slate-400">customer holdings</span>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs">
                  <span className="text-[11px] text-slate-500 font-medium">Average Products/Client</span>
                  <div className="text-xl font-bold text-slate-900">{productData.summary.averageProductsPerCustomer}</div>
                  <span className="text-[10px] text-slate-400">relationship cross-sell depth</span>
                </div>
              </div>

              {/* Relationship Depth Buckets */}
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                  Relationship Depth Buckets (Cross-Sell Tiers)
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  {productData.depthAnalysis.map((b: any) => (
                    <div key={b.depth} className="bg-slate-50 border border-slate-200 rounded p-3 text-center">
                      <div className="text-xs font-bold text-slate-700">{b.depth}</div>
                      <div className="text-2xl font-bold text-slate-900 my-1">{b.customerCount}</div>
                      <div className="text-[10px] text-slate-500">{b.percentage}% of portfolio</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                <div className="p-3 border-b border-slate-200">
                  <span className="text-xs font-bold text-slate-900">Catalog Product Penetration</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-medium border-b border-slate-200">
                      <tr>
                        <th className="px-3 py-2">Product Code</th>
                        <th className="px-3 py-2">Product Name</th>
                        <th className="px-3 py-2">Category</th>
                        <th className="px-3 py-2 text-center">Enrolled Clients</th>
                        <th className="px-3 py-2 text-center">Penetration %</th>
                        <th className="px-3 py-2 text-right">Held Relationship Value</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {productData.products.map((p: any) => (
                        <tr key={p.productId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2 font-mono text-[11px] text-slate-600">{p.productCode}</td>
                          <td className="px-3 py-2 font-medium text-slate-900">{p.productName}</td>
                          <td className="px-3 py-2 text-slate-600">{p.category}</td>
                          <td className="px-3 py-2 text-center font-bold text-slate-800">{p.enrolledCustomers}</td>
                          <td className="px-3 py-2 text-center font-mono">{p.penetrationPercentage}%</td>
                          <td className="px-3 py-2 text-right font-mono font-medium text-cyan-900">{p.formattedValue}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAB 8: TRENDS & "WHAT CHANGED?" */}
          {activeTab === 'trends' && trendsData && (
            <div className="space-y-5">
              {/* Methodology Box */}
              <div className="bg-cyan-50/50 border border-cyan-200 rounded-lg p-3.5 text-xs text-slate-700 space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-cyan-950">
                  <Info className="w-4 h-4 text-cyan-700" />
                  <span>CORE Score Methodology & Governance</span>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed">
                  {trendsData.methodologyInfo}
                </p>
                <p className="text-[10px] text-slate-500 italic">
                  {trendsData.disclaimer}
                </p>
              </div>

              {/* Deterministic Recharts Trend Chart */}
              <div className="bg-white rounded-lg border border-slate-200 p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                      Deterministic CORE Score Trajectory (Historical Snapshots)
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      Plotted directly from persisted PostgreSQL historical score records ({trendsData.totalHistoricalSnapshots} total snapshots).
                    </p>
                  </div>
                  <Badge variant="neutral" className="text-[10px] font-mono">{trendsData.period}</Badge>
                </div>

                <div className="h-64 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={trendsData.trendPoints} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#64748b' }} />
                      <YAxis domain={[50, 100]} tick={{ fontSize: 11, fill: '#64748b' }} />
                      <RechartsTooltip
                        contentStyle={{ backgroundColor: '#ffffff', borderColor: '#e2e8f0', fontSize: '11px' }}
                      />
                      <Legend wrapperStyle={{ fontSize: '11px' }} />
                      <Line
                        type="monotone"
                        dataKey="averageScore"
                        name="Average CORE Score"
                        stroke="#0e7490"
                        strokeWidth={2}
                        dot={{ r: 4, fill: '#0e7490' }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="maxScore"
                        name="Max Relationship Score"
                        stroke="#059669"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                      />
                      <Line
                        type="monotone"
                        dataKey="minScore"
                        name="Min Relationship Score"
                        stroke="#dc2626"
                        strokeWidth={1}
                        strokeDasharray="4 4"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* "What Changed?" Engine Deep Dive */}
              {whatChangedData && (
                <div className="bg-white rounded-lg border border-slate-200 p-4">
                  <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
                    Period-over-Period Variance Analysis Engine
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                    {whatChangedData.changes.map((ch: any, idx: number) => (
                      <div key={idx} className="bg-slate-50 border border-slate-200 rounded p-3 text-xs">
                        <div className="text-[11px] font-semibold text-slate-700">{ch.metric}</div>
                        <div className="text-lg font-bold text-slate-900 my-1">{ch.current}</div>
                        <div className="text-[11px] text-slate-500 leading-snug">{ch.summary}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
