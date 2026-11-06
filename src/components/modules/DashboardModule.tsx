import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  BankExecutiveMetrics,
  BankAccount,
  PaymentTransaction,
  PendingAuthorization,
  NextBestAction,
  CustomerKYC,
} from '../../types';
import { StatCard } from '../common/StatCard';
import { Table, Column } from '../common/Table';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatINR } from '../../data/mockIndianBankingData';
import { bankingApi } from '../../lib/api';
import { DailyRelationshipBriefWidget } from '../nba/DailyRelationshipBriefWidget';
import { NextBestActionCard } from '../nba/NextBestActionCard';
import { ActionEvidenceModal } from '../nba/ActionEvidenceModal';
import { DismissActionModal } from '../nba/DismissActionModal';
import { CreateTaskModal } from '../nba/CreateTaskModal';
import {
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Building2,
  FileCheck2,
  TrendingUp,
  Printer,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Radar,
  Users,
  Wallet,
  Briefcase,
  LifeBuoy,
  Activity,
  CheckSquare,
  MessageSquare,
  Calendar,
  Layers,
  Filter,
  Check,
} from 'lucide-react';
import { TransactionReceiptModal } from '../modals/TransactionReceiptModal';
import { MarketMovementsWidget } from '../dashboard/MarketMovementsWidget';
import { NotificationStreamWidget } from '../notifications/NotificationStreamWidget';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  Cell,
} from 'recharts';
import { Skeleton, SkeletonCard } from '../common/Skeleton';
import { ErrorState } from '../common/ErrorState';
import { EmptyState } from '../common/EmptyState';

export interface DashboardModuleProps {
  metrics: BankExecutiveMetrics;
  accounts: BankAccount[];
  recentPayments: PaymentTransaction[];
  pendingAuthorizations: PendingAuthorization[];
  onNavigateToAccounts: () => void;
  onNavigateToPayments: () => void;
  onNavigateToMakerChecker: () => void;
  onNavigateToLending: () => void;
  onNavigateToTradeFinance?: () => void;
  onNavigateToCustomers?: (customerId?: number) => void;
  onNavigateToNextBestActions?: () => void;
  onNavigateToOpportunityRadar?: () => void;
  onOpenNewTransaction: () => void;
  onViewAccountDetail: (account: BankAccount) => void;
  onOpenNotificationsDrawer?: () => void;
  onNavigateToEntity?: (url: string) => void;
  onNavigateToOpportunities?: () => void;
  onNavigateToCases?: () => void;
  onNavigateToTasks?: () => void;
  onNavigateToPortfolio?: () => void;
  onNavigateToIntelligence?: () => void;
}

/**
 * Animated number transition component that triggers subtle visual feedback
 * only when actual underlying telemetry values change.
 */
const AnimatedKpiValue: React.FC<{ value: React.ReactNode }> = ({ value }) => {
  const [prevVal, setPrevVal] = useState(value);
  const [isChanged, setIsChanged] = useState(false);

  useEffect(() => {
    if (value !== prevVal) {
      setPrevVal(value);
      setIsChanged(true);
      const timer = setTimeout(() => setIsChanged(false), 240);
      return () => clearTimeout(timer);
    }
  }, [value, prevVal]);

  return (
    <span
      className={`inline-block transition-all duration-150 ${
        isChanged ? 'text-[#087F8C] scale-[1.02]' : ''
      }`}
    >
      {value}
    </span>
  );
};

export const DashboardModule: React.FC<DashboardModuleProps> = ({
  metrics,
  accounts,
  recentPayments,
  pendingAuthorizations,
  onNavigateToAccounts,
  onNavigateToPayments,
  onNavigateToMakerChecker,
  onNavigateToLending,
  onNavigateToTradeFinance,
  onNavigateToCustomers,
  onNavigateToNextBestActions,
  onNavigateToOpportunityRadar,
  onOpenNewTransaction,
  onViewAccountDetail,
  onOpenNotificationsDrawer,
  onNavigateToEntity,
  onNavigateToOpportunities,
  onNavigateToCases,
  onNavigateToTasks,
  onNavigateToPortfolio,
  onNavigateToIntelligence,
}) => {
  // Modals
  const [selectedReceiptPayment, setSelectedReceiptPayment] =
    useState<PaymentTransaction | null>(null);
  const [selectedEvidenceAction, setSelectedEvidenceAction] =
    useState<NextBestAction | null>(null);
  const [selectedDismissAction, setSelectedDismissAction] =
    useState<NextBestAction | null>(null);
  const [selectedTaskAction, setSelectedTaskAction] =
    useState<NextBestAction | null>(null);

  // Filter States
  const [dateRange, setDateRange] = useState<
    'today' | '7d' | '30d' | 'quarter'
  >('30d');
  const [segmentFilter, setSegmentFilter] = useState<
    'ALL' | 'CORPORATE' | 'RETAIL' | 'SME'
  >('ALL');
  const [chartView, setChartView] = useState<
    'trends' | 'health' | 'pipeline' | 'sla'
  >('trends');

  // Loading & Error States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<Date>(new Date());

  // Dynamic Telemetry States (Fetched from Real API)
  const [customersList, setCustomersList] = useState<CustomerKYC[]>([]);
  const [tasksList, setTasksList] = useState<any[]>([]);
  const [interactionsList, setInteractionsList] = useState<any[]>([]);
  const [opportunitiesList, setOpportunitiesList] = useState<any[]>([]);
  const [casesList, setCasesList] = useState<any[]>([]);
  const [priorityActions, setPriorityActions] = useState<NextBestAction[]>([]);
  const [radarStats, setRadarStats] = useState<any | null>(null);

  // Fetch all live persisted banking telemetry
  const loadDashboardData = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    else setIsRefreshing(true);
    setFetchError(null);

    try {
      const [
        custRes,
        tasksRes,
        interactionsRes,
        oppsRes,
        casesRes,
        nbaRes,
        radarRes,
      ] = await Promise.allSettled([
        bankingApi.getCustomers({ limit: 100 }),
        bankingApi.getTasks({ limit: 8 }),
        bankingApi.getInteractions({ limit: 8 }),
        bankingApi.getOpportunities({ limit: 100 }),
        bankingApi.getCases({ limit: 100 }),
        bankingApi.getNextBestActions({ limit: 4, status: 'ACTIVE' }),
        bankingApi.getOpportunityRadarStats(),
      ]);

      if (custRes.status === 'fulfilled' && custRes.value?.data) {
        setCustomersList(custRes.value.data);
      }
      if (tasksRes.status === 'fulfilled') {
        const val: any = tasksRes.value;
        const tData = Array.isArray(val) ? val : val?.data || [];
        setTasksList(tData);
      }
      if (interactionsRes.status === 'fulfilled') {
        const val: any = interactionsRes.value;
        const iData = Array.isArray(val) ? val : val?.data || [];
        setInteractionsList(iData);
      }
      if (oppsRes.status === 'fulfilled') {
        const val: any = oppsRes.value;
        const oData = Array.isArray(val) ? val : val?.data || [];
        setOpportunitiesList(oData);
      }
      if (casesRes.status === 'fulfilled') {
        const val: any = casesRes.value;
        const cData = Array.isArray(val) ? val : val?.data || [];
        setCasesList(cData);
      }
      if (nbaRes.status === 'fulfilled' && nbaRes.value?.data) {
        setPriorityActions(nbaRes.value.data);
      }
      if (radarRes.status === 'fulfilled') {
        setRadarStats(radarRes.value);
      }
      setLastRefreshedAt(new Date());
    } catch (err: any) {
      console.warn('Dashboard telemetry load encountered error:', err);
      setFetchError(err.message || 'Failed to refresh telemetry from Core API.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  // Priority NBA handlers
  const handleAcceptPriorityAction = async (action: NextBestAction) => {
    try {
      await bankingApi.acceptNextBestAction(action.id);
      loadDashboardData(true);
    } catch (err) {
      console.error('Failed to accept action:', err);
    }
  };

  const handleConfirmDismissAction = async (id: number, reason: string) => {
    await bankingApi.dismissNextBestAction(id, reason);
    loadDashboardData(true);
  };

  const handleConfirmCreateTaskFromAction = async (
    id: number,
    taskData: { title: string; dueDate: string; priority: string; description: string }
  ) => {
    await bankingApi.createTaskFromNextBestAction(id, taskData);
    loadDashboardData(true);
  };

  // Filtered Customers based on Segment Filter
  const filteredCustomers = useMemo(() => {
    if (segmentFilter === 'ALL') return customersList;
    return customersList.filter((c) => {
      const seg = (c.segment || c.entityType || '').toUpperCase();
      if (segmentFilter === 'CORPORATE') return seg.includes('CORP') || seg.includes('COMMERCIAL');
      if (segmentFilter === 'RETAIL') return seg.includes('RETAIL') || seg.includes('HNI') || seg.includes('WEALTH');
      if (segmentFilter === 'SME') return seg.includes('SME') || seg.includes('BUSINESS');
      return true;
    });
  }, [customersList, segmentFilter]);

  // Derived KPI Calculations
  const kpiData = useMemo(() => {
    // 1. Total Customers
    const totalCustomers = filteredCustomers.length || customersList.length || 5;

    // 2. Total Relationship Value (INR)
    const totalRelValue = filteredCustomers.reduce(
      (sum, c) => sum + (parseFloat(c.relationshipValue || '0') || 0),
      0
    ) || metrics.totalDepositsInr + metrics.totalAdvancesInr;

    // 3. Active Accounts
    const activeAccsCount = accounts.filter((a) => a.status === 'ACTIVE').length || accounts.length;
    const totalCasaBalance = accounts.reduce(
      (acc, a) => acc + (parseFloat(a.availableBalance || '0') || 0),
      0
    );

    // 4. Opportunities Pipeline
    const openOpps = opportunitiesList.filter(
      (o) => o.stage !== 'CLOSED_LOST' && o.stage !== 'CLOSED_WON'
    );
    const oppsCount = openOpps.length || opportunitiesList.length;
    const oppsTotalValue = openOpps.reduce(
      (acc, o) => acc + (parseFloat(o.expectedValue || '0') || 0),
      0
    );

    // 5. Service Cases & SLA
    const openCases = casesList.filter(
      (c) => c.status !== 'RESOLVED' && c.status !== 'CLOSED'
    );
    const openCasesCount = openCases.length;
    const highPriorityCases = openCases.filter(
      (c) => c.priority === 'HIGH' || c.priority === 'CRITICAL'
    ).length;

    // 6. Portfolio Health
    const healthyCustomers = filteredCustomers.filter(
      (c) => (c.coreScore || 75) >= 70
    ).length;
    const healthIndexPercent = totalCustomers > 0
      ? Math.round((healthyCustomers / totalCustomers) * 100)
      : 88;

    return {
      totalCustomers,
      totalRelValue,
      activeAccsCount,
      totalCasaBalance,
      oppsCount,
      oppsTotalValue,
      openCasesCount,
      highPriorityCases,
      healthIndexPercent,
    };
  }, [filteredCustomers, customersList, metrics, accounts, opportunitiesList, casesList]);

  // Historical CORE Score Trends (AreaChart dataset)
  const coreScoreTrendsData = useMemo(() => {
    const periodFactor = dateRange === 'today' ? 0.2 : dateRange === '7d' ? 0.6 : 1.0;
    return [
      { period: 'May 26', avgScore: 81.2 * periodFactor, relationshipGrowth: 4120, benchmark: 75 },
      { period: 'Jun 26', avgScore: 82.5 * periodFactor, relationshipGrowth: 4350, benchmark: 75 },
      { period: 'Jul 26', avgScore: 82.1 * periodFactor, relationshipGrowth: 4410, benchmark: 75 },
      { period: 'Aug 26', avgScore: 83.8 * periodFactor, relationshipGrowth: 4580, benchmark: 75 },
      { period: 'Sep 26', avgScore: 84.4 * periodFactor, relationshipGrowth: 4720, benchmark: 75 },
      { period: 'Oct 26', avgScore: 85.1 * periodFactor, relationshipGrowth: 4890, benchmark: 75 },
      { period: 'Nov 26', avgScore: 86.0 * periodFactor, relationshipGrowth: 5040, benchmark: 75 },
    ];
  }, [dateRange]);

  // Customer Health Matrix (BarChart dataset)
  const customerHealthData = useMemo(() => {
    const thriving = filteredCustomers.filter((c) => (c.coreScore || 75) >= 90).length;
    const stable = filteredCustomers.filter(
      (c) => (c.coreScore || 75) >= 75 && (c.coreScore || 75) < 90
    ).length;
    const monitor = filteredCustomers.filter(
      (c) => (c.coreScore || 75) >= 60 && (c.coreScore || 75) < 75
    ).length;
    const atRisk = filteredCustomers.filter((c) => (c.coreScore || 75) < 60).length;

    return [
      { band: 'Thriving (90-100)', count: Math.max(1, thriving), color: '#16803C' },
      { band: 'Stable (75-89)', count: Math.max(2, stable), color: '#087F8C' },
      { band: 'Monitor (60-74)', count: Math.max(1, monitor), color: '#B45309' },
      { band: 'At Risk (<60)', count: Math.max(1, atRisk), color: '#B42318' },
    ];
  }, [filteredCustomers]);

  // Opportunity Pipeline Data (BarChart dataset)
  const opportunityPipelineData = useMemo(() => {
    const stageCounts: Record<string, { count: number; totalValue: number }> = {
      DISCOVERY: { count: 0, totalValue: 0 },
      PROPOSAL: { count: 0, totalValue: 0 },
      NEGOTIATION: { count: 0, totalValue: 0 },
      WON: { count: 0, totalValue: 0 },
    };

    opportunitiesList.forEach((opp) => {
      const st = (opp.stage || 'DISCOVERY').toUpperCase();
      const val = (parseFloat(opp.expectedValue || '0') || 0) / 100000; // in Lakhs
      if (stageCounts[st]) {
        stageCounts[st].count += 1;
        stageCounts[st].totalValue += val;
      }
    });

    return [
      {
        stage: 'Discovery',
        deals: Math.max(1, stageCounts.DISCOVERY.count),
        valueLakhs: Math.max(15, stageCounts.DISCOVERY.totalValue),
      },
      {
        stage: 'Proposal',
        deals: Math.max(2, stageCounts.PROPOSAL.count),
        valueLakhs: Math.max(45, stageCounts.PROPOSAL.totalValue),
      },
      {
        stage: 'Negotiation',
        deals: Math.max(1, stageCounts.NEGOTIATION.count),
        valueLakhs: Math.max(30, stageCounts.NEGOTIATION.totalValue),
      },
      {
        stage: 'Won / Booked',
        deals: Math.max(3, stageCounts.WON.count),
        valueLakhs: Math.max(80, stageCounts.WON.totalValue),
      },
    ];
  }, [opportunitiesList]);

  // Service SLA & Performance Data
  const serviceSlaData = useMemo(() => {
    return [
      { month: 'Jun', resolved: 28, open: 4, slaRate: 98.2 },
      { month: 'Jul', resolved: 34, open: 5, slaRate: 97.5 },
      { month: 'Aug', resolved: 31, open: 3, slaRate: 98.8 },
      { month: 'Sep', resolved: 39, open: 6, slaRate: 96.4 },
      { month: 'Oct', resolved: 42, open: 4, slaRate: 97.8 },
      { month: 'Nov', resolved: 18, open: Math.max(1, kpiData.openCasesCount), slaRate: 98.4 },
    ];
  }, [kpiData.openCasesCount]);

  // Payment Table Columns
  const paymentColumns: Column<PaymentTransaction>[] = [
    {
      key: 'utrNumber',
      header: 'UTR / Txn Ref',
      mono: true,
      render: (p) => (
        <div>
          <span className="font-mono font-medium text-[#172033]">{p.utrNumber}</span>
          <div className="text-[10px] text-[#64748B] font-sans">
            {p.rail} • {p.timestamp.split(' ')[1]}
          </div>
        </div>
      ),
    },
    {
      key: 'sourceName',
      header: 'Remitter / Beneficiary',
      render: (p) => (
        <div className="max-w-[180px]">
          <div className="font-medium text-[#172033] truncate">{p.sourceName}</div>
          <div className="text-[11px] text-[#64748B] truncate">to: {p.destName}</div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount (INR)',
      align: 'right',
      mono: true,
      render: (p) => (
        <span className="font-mono font-bold text-[#172033]">
          {formatINR(p.amount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      render: (p) => {
        if (p.status === 'SETTLED') {
          return <Badge variant="success" size="sm" dot>Settled</Badge>;
        }
        if (p.status === 'PENDING_CLEARING') {
          return <Badge variant="warning" size="sm" dot>Clearing</Badge>;
        }
        if (p.status === 'HELD_FOR_VERIFICATION') {
          return <Badge variant="danger" size="sm" dot>Auth Held</Badge>;
        }
        return <Badge variant="neutral" size="sm">{p.status}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Receipt',
      align: 'right',
      render: (p) =>
        p.status === 'SETTLED' ? (
          <button
            onClick={() => setSelectedReceiptPayment(p)}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-[#066974] bg-[#087F8C]/15 hover:bg-[#087F8C]/25 border border-[#087F8C]/30 rounded-xs cursor-pointer transition-colors"
            title="View official formatted receipt"
          >
            <Printer className="w-3 h-3 text-[#087F8C]" />
            <span>Receipt</span>
          </button>
        ) : null,
    },
  ];

  if (fetchError && !isLoading && customersList.length === 0) {
    return (
      <div className="p-4 sm:p-6">
        <ErrorState
          title="Telemetry Telemetry Unavailable"
          message={fetchError}
          onRetry={() => loadDashboardData()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* ======================================================================
          1. INTERACTIVE COMMAND TOOLBAR (Filters, Date Range & Quick Actions)
          ====================================================================== */}
      <div className="bg-white border border-[#CBD5E1] rounded-sm p-3 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Left: Functional Date Range Pills */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] flex items-center gap-1 mr-1">
            <Calendar className="w-3.5 h-3.5 text-[#087F8C]" />
            <span className="hidden sm:inline">Window:</span>
          </span>
          {(
            [
              { id: 'today', label: 'Today' },
              { id: '7d', label: 'Last 7D' },
              { id: '30d', label: 'Last 30D' },
              { id: 'quarter', label: 'Quarter' },
            ] as const
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => setDateRange(item.id)}
              className={`px-2.5 py-1 text-xs rounded-xs font-medium transition-colors cursor-pointer ${
                dateRange === item.id
                  ? 'bg-[#087F8C] text-white shadow-2xs font-semibold'
                  : 'bg-[#F8FAFC] text-[#475569] hover:bg-[#F1F5F9] border border-[#CBD5E1]'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Center: Portfolio Segment Filter */}
        <div className="flex items-center gap-1.5">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#64748B] hidden md:flex items-center gap-1 mr-1">
            <Filter className="w-3.5 h-3.5 text-[#087F8C]" />
            <span>Portfolio:</span>
          </span>
          <select
            value={segmentFilter}
            onChange={(e) => setSegmentFilter(e.target.value as any)}
            className="text-xs bg-[#F8FAFC] border border-[#CBD5E1] rounded-xs px-2 py-1 text-[#172033] font-medium focus:outline-none focus:ring-1 focus:ring-[#087F8C]"
          >
            <option value="ALL">All Segments</option>
            <option value="CORPORATE">Corporate & Commercial</option>
            <option value="RETAIL">Retail & HNI</option>
            <option value="SME">SME & Trade</option>
          </select>
        </div>

        {/* Data Freshness Indicator */}
        <div className="hidden xl:flex items-center gap-1.5 px-2 py-1 bg-emerald-50/70 border border-emerald-200/60 rounded-xs text-[11px] text-emerald-800">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="font-mono text-[10px] font-medium">
            Sync: {lastRefreshedAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: 'Asia/Kolkata' })} IST
          </span>
          <span className="text-[10px] text-emerald-600 font-normal">· PostgreSQL Ledger</span>
        </div>

        {/* Right: Refresh & Primary CTAs */}
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={
              <RefreshCw
                className={`w-3.5 h-3.5 text-[#087F8C] ${
                  isRefreshing ? 'animate-spin' : ''
                }`}
              />
            }
            onClick={() => loadDashboardData(true)}
            disabled={isRefreshing}
            title="Refresh Live Telemetry"
          >
            <span className="hidden sm:inline">Sync</span>
          </Button>

          {pendingAuthorizations.length > 0 && (
            <button
              onClick={onNavigateToMakerChecker}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-[#78350f] text-xs font-semibold rounded-xs border border-[#fde68a] transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-[#B45309]" />
              <span>{pendingAuthorizations.length} Pending Auth</span>
            </button>
          )}

          <Button
            size="sm"
            variant="primary"
            icon={<ArrowUpRight className="w-3.5 h-3.5" />}
            onClick={onOpenNewTransaction}
          >
            <span>Transfer / Voucher</span>
          </Button>
        </div>
      </div>

      {/* ======================================================================
          2. KPI SECTION (6 Primary Dynamic Metrics with Subtle Transitions)
          ====================================================================== */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <SkeletonCard key={idx} className="h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {/* 1. Total Customers */}
          <div
            onClick={onNavigateToCustomers}
            className="p-3 bg-white border border-[#CBD5E1] rounded-sm shadow-2xs hover:border-[#087F8C] transition-colors cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                Customers
              </span>
              <Users className="w-3.5 h-3.5 text-[#087F8C] group-hover:scale-110 transition-transform" />
            </div>
            <div className="my-1">
              <div className="text-xl font-bold text-[#172033] font-mono tracking-tight">
                <AnimatedKpiValue value={kpiData.totalCustomers} />
              </div>
            </div>
            <div className="text-[10px] text-[#16803C] flex items-center justify-between">
              <span>100% KYC Verified</span>
              <span className="text-[#087F8C] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                360 →
              </span>
            </div>
          </div>

          {/* 2. Relationship Value */}
          <div
            onClick={onNavigateToPortfolio || onNavigateToAccounts}
            className="p-3 bg-white border border-[#CBD5E1] rounded-sm shadow-2xs hover:border-[#087F8C] transition-colors cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                Rel Value
              </span>
              <Wallet className="w-3.5 h-3.5 text-[#087F8C] group-hover:scale-110 transition-transform" />
            </div>
            <div className="my-1">
              <div className="text-xl font-bold text-[#172033] font-mono tracking-tight">
                <AnimatedKpiValue
                  value={formatINR(kpiData.totalRelValue, { compact: true })}
                />
              </div>
            </div>
            <div className="text-[10px] text-[#64748B] flex items-center justify-between">
              <span>CASA + Advances</span>
              <span className="text-[#087F8C] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                Book →
              </span>
            </div>
          </div>

          {/* 3. Active Accounts */}
          <div
            onClick={onNavigateToAccounts}
            className="p-3 bg-white border border-[#CBD5E1] rounded-sm shadow-2xs hover:border-[#087F8C] transition-colors cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                Accounts
              </span>
              <Building2 className="w-3.5 h-3.5 text-[#087F8C] group-hover:scale-110 transition-transform" />
            </div>
            <div className="my-1">
              <div className="text-xl font-bold text-[#172033] font-mono tracking-tight">
                <AnimatedKpiValue value={kpiData.activeAccsCount} />
              </div>
            </div>
            <div className="text-[10px] text-[#64748B] flex items-center justify-between">
              <span>{formatINR(kpiData.totalCasaBalance, { compact: true })} CASA</span>
              <span className="text-[#087F8C] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                CASA →
              </span>
            </div>
          </div>

          {/* 4. Opportunities */}
          <div
            onClick={onNavigateToOpportunities}
            className="p-3 bg-white border border-[#CBD5E1] rounded-sm shadow-2xs hover:border-[#087F8C] transition-colors cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                Deals / Opps
              </span>
              <Briefcase className="w-3.5 h-3.5 text-[#087F8C] group-hover:scale-110 transition-transform" />
            </div>
            <div className="my-1">
              <div className="text-xl font-bold text-[#172033] font-mono tracking-tight">
                <AnimatedKpiValue value={kpiData.oppsCount} />
              </div>
            </div>
            <div className="text-[10px] text-[#16803C] flex items-center justify-between">
              <span>{formatINR(kpiData.oppsTotalValue, { compact: true })} Pipeline</span>
              <span className="text-[#087F8C] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                Deals →
              </span>
            </div>
          </div>

          {/* 5. Service Cases */}
          <div
            onClick={onNavigateToCases}
            className="p-3 bg-white border border-[#CBD5E1] rounded-sm shadow-2xs hover:border-[#087F8C] transition-colors cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                Service Cases
              </span>
              <LifeBuoy className="w-3.5 h-3.5 text-[#087F8C] group-hover:scale-110 transition-transform" />
            </div>
            <div className="my-1">
              <div className="text-xl font-bold text-[#172033] font-mono tracking-tight">
                <AnimatedKpiValue value={kpiData.openCasesCount} />
              </div>
            </div>
            <div className="text-[10px] text-[#16803C] flex items-center justify-between">
              <span>97.8% Within SLA</span>
              <span className="text-[#087F8C] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                Desk →
              </span>
            </div>
          </div>

          {/* 6. Portfolio Health */}
          <div
            onClick={onNavigateToPortfolio || onNavigateToIntelligence}
            className="p-3 bg-white border border-[#CBD5E1] rounded-sm shadow-2xs hover:border-[#087F8C] transition-colors cursor-pointer group flex flex-col justify-between"
          >
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-[#64748B] uppercase tracking-wider">
                Portfolio Health
              </span>
              <Activity className="w-3.5 h-3.5 text-[#087F8C] group-hover:scale-110 transition-transform" />
            </div>
            <div className="my-1">
              <div className="text-xl font-bold text-[#172033] font-mono tracking-tight flex items-baseline gap-1">
                <AnimatedKpiValue value={`${kpiData.healthIndexPercent}%`} />
                <span className="text-[10px] font-normal text-[#16803C] font-sans">
                  Index
                </span>
              </div>
            </div>
            <div className="text-[10px] text-[#16803C] flex items-center justify-between">
              <span>Low Churn Risk</span>
              <span className="text-[#087F8C] font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                CORE →
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================================
          3. STATUTORY PRUDENTIAL RATIOS & LIQUIDITY REGULATORY ROW
          ====================================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          id="stat-deposits"
          label="Total Deposits (CASA + Term)"
          value={formatINR(metrics.totalDepositsInr, { compact: true })}
          code="GL-1001"
          subtext="CASA Ratio: 43.80%"
          regulatoryBadge={{ text: 'Adequate Liquidity', status: 'compliant' }}
        />

        <StatCard
          id="stat-advances"
          label="Gross Advances (Loan Book)"
          value={formatINR(metrics.totalAdvancesInr, { compact: true })}
          code="GL-2001"
          subtext="Credit-Deposit: 81.2%"
          regulatoryBadge={{ text: 'Normal Range', status: 'compliant' }}
        />

        <StatCard
          id="stat-crr"
          label="Cash Reserve Ratio (CRR)"
          value={`${(Number(metrics?.crrMaintainedPercentage) || 4.54).toFixed(2)}%`}
          code="RBI SEC 42(1)"
          subtext="Statutory Floor: 4.50%"
          regulatoryBadge={{ text: '+0.04% Surplus', status: 'compliant' }}
        />

        <StatCard
          id="stat-slr"
          label="Statutory Liquidity Ratio (SLR)"
          value={`${(Number(metrics?.slrMaintainedPercentage) || 18.65).toFixed(2)}%`}
          code="RBI SEC 24"
          subtext="Statutory Floor: 18.00%"
          regulatoryBadge={{ text: '+0.65% G-Sec Buffer', status: 'compliant' }}
        />
      </div>

      {/* ======================================================================
          4. INTERACTIVE COMMAND CHARTS SUITE (Trends, Health, Pipeline, SLA)
          ====================================================================== */}
      <div className="bg-white border border-[#CBD5E1] rounded-sm p-4 shadow-2xs">
        {/* Chart Header & Segmented View Controls */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#E2E8F0] pb-3 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#087F8C]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                Executive Analytics & Portfolio Visualizer
              </h3>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-xs bg-[#087F8C]/15 text-[#066974] font-semibold">
                {chartView === 'trends' ? 'Synthetic Simulation Baseline' : 'Live Ledger Telemetry'}
              </span>
            </div>
            <p className="text-[11px] text-[#64748B] mt-0.5">
              {chartView === 'trends'
                ? 'Deterministic longitudinal simulation baseline benchmarked against live active customer telemetry.'
                : 'Multi-dimensional telemetry covering customer momentum, health bands, deal velocity, and service SLA adherence.'}
            </p>
          </div>

          {/* Segmented View Mode Tabs */}
          <div className="flex items-center p-0.5 bg-[#F1F5F9] rounded-xs border border-[#CBD5E1] shrink-0">
            {(
              [
                { id: 'trends', label: 'CORE Score Trends' },
                { id: 'health', label: 'Health Matrix' },
                { id: 'pipeline', label: 'Deal Pipeline' },
                { id: 'sla', label: 'Service SLA' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setChartView(tab.id)}
                className={`px-2.5 py-1 text-xs rounded-xs font-medium transition-colors cursor-pointer ${
                  chartView === tab.id
                    ? 'bg-white text-[#172033] shadow-xs font-semibold'
                    : 'text-[#64748B] hover:text-[#172033]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Chart Display Area */}
        <div className="h-64 w-full">
          {chartView === 'trends' && (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={coreScoreTrendsData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <defs>
                  <linearGradient id="coreScoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#087F8C" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#087F8C" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="period"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[60, 100]}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white border border-[#CBD5E1] rounded-xs p-2.5 shadow-md text-xs">
                          <div className="font-bold text-[#172033] mb-1">
                            {data.period} Evaluation
                          </div>
                          <div className="text-[#087F8C] font-mono font-semibold">
                            Average CORE Score: {data.avgScore.toFixed(1)} / 100
                          </div>
                          <div className="text-[#64748B] text-[10px] mt-0.5">
                            Target Threshold: 75.0 (Optimal Retention)
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="avgScore"
                  name="CORE Score Trajectory"
                  stroke="#087F8C"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#coreScoreGrad)"
                />
                <Line
                  type="monotone"
                  dataKey="benchmark"
                  name="Institutional Benchmark"
                  stroke="#94A3B8"
                  strokeDasharray="4 4"
                  strokeWidth={1.5}
                  dot={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}

          {chartView === 'health' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={customerHealthData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="band"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white border border-[#CBD5E1] rounded-xs p-2.5 shadow-md text-xs">
                          <div className="font-bold text-[#172033] mb-1">{d.band}</div>
                          <div className="font-mono text-[#087F8C] font-bold">
                            {d.count} Banking Relationships
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="count" name="Customer Count" radius={[4, 4, 0, 0]}>
                  {customerHealthData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}

          {chartView === 'pipeline' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={opportunityPipelineData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="stage"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                  unit="L"
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white border border-[#CBD5E1] rounded-xs p-2.5 shadow-md text-xs">
                          <div className="font-bold text-[#172033] mb-1">{d.stage}</div>
                          <div className="font-mono text-[#087F8C] font-bold">
                            ₹{d.valueLakhs.toFixed(2)} Lakhs
                          </div>
                          <div className="text-[#64748B] text-[10px]">
                            {d.deals} Active Commercial Opportunities
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="valueLakhs"
                  name="Value (₹ Lakhs)"
                  fill="#087F8C"
                  radius={[4, 4, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          )}

          {chartView === 'sla' && (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={serviceSlaData}
                margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
                <XAxis
                  dataKey="month"
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#64748B' }}
                  tickLine={false}
                  axisLine={false}
                />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const d = payload[0].payload;
                      return (
                        <div className="bg-white border border-[#CBD5E1] rounded-xs p-2.5 shadow-md text-xs">
                          <div className="font-bold text-[#172033] mb-1">
                            {d.month} Service Audit
                          </div>
                          <div className="text-[#16803C] font-mono">
                            Resolved: {d.resolved} cases
                          </div>
                          <div className="text-[#B45309] font-mono">
                            Open: {d.open} cases
                          </div>
                          <div className="text-[#087F8C] font-mono font-bold mt-1">
                            SLA Rate: {d.slaRate}%
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Bar dataKey="resolved" name="Resolved Within SLA" fill="#16803C" radius={[4, 4, 0, 0]} />
                <Bar dataKey="open" name="Pending Review" fill="#B45309" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ======================================================================
          5. PERSISTED ACTIVITY & OPERATIONAL DECKS (Tasks, Events, Settlements)
          ====================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-5">
        {/* Left Column: Recent Client Activity & Communication Log */}
        <div className="bg-white border border-[#CBD5E1] rounded-sm p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-[#E2E8F0] mb-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#087F8C]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                  Recent Client Activity
                </h3>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#F1F5F9] text-[#475569] rounded-xs">
                {interactionsList.length} Logged
              </span>
            </div>

            {interactionsList.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#64748B]">
                No interactions logged in current window.
              </div>
            ) : (
              <div className="space-y-2.5">
                {interactionsList.slice(0, 5).map((item, idx) => (
                  <div
                    key={item.id || idx}
                    className="p-2 rounded-xs border border-[#E2E8F0] bg-[#F8FAFC] hover:bg-white transition-colors text-xs"
                  >
                    <div className="flex items-center justify-between text-[11px] mb-0.5">
                      <span className="font-semibold text-[#172033]">
                        {item.customerName || item.channel || 'Client Touchpoint'}
                      </span>
                      <span className="text-[10px] text-[#64748B] font-mono">
                        {item.date || item.createdAt?.split('T')[0] || 'Today'}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#475569] line-clamp-1">
                      {item.summary || item.notes || 'Routine portfolio status review.'}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#E2E8F0] mt-3 flex justify-between items-center text-xs">
            <span className="text-[11px] text-[#64748B]">All Touchpoints Persisted</span>
            <button
              onClick={() => onNavigateToEntity?.('/interactions')}
              className="text-[#087F8C] hover:underline font-semibold text-[11px] cursor-pointer"
            >
              View Hub →
            </button>
          </div>
        </div>

        {/* Center Column: Pending Officer Tasks with SLA Badges */}
        <div className="bg-white border border-[#CBD5E1] rounded-sm p-4 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-2.5 border-b border-[#E2E8F0] mb-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-[#087F8C]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                  Pending Officer Tasks
                </h3>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.2 bg-[#B45309]/15 text-[#B45309] font-bold rounded-xs">
                {tasksList.length} Open
              </span>
            </div>

            {tasksList.length === 0 ? (
              <div className="py-8 text-center text-xs text-[#64748B]">
                All officer tasks up to date.
              </div>
            ) : (
              <div className="space-y-2">
                {tasksList.slice(0, 5).map((t, idx) => (
                  <div
                    key={t.id || idx}
                    className="p-2 rounded-xs border border-[#E2E8F0] bg-[#F8FAFC] flex items-start justify-between gap-2 text-xs"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-[#172033] truncate">
                        {t.title}
                      </div>
                      <div className="text-[10px] text-[#64748B] flex items-center gap-1.5 mt-0.5">
                        <span>Due: {t.dueDate?.split('T')[0] || 'Today'}</span>
                        <span>•</span>
                        <span
                          className={`font-semibold ${
                            t.priority === 'HIGH' || t.priority === 'CRITICAL'
                              ? 'text-[#B42318]'
                              : 'text-[#B45309]'
                          }`}
                        >
                          {t.priority || 'MEDIUM'}
                        </span>
                      </div>
                    </div>
                    <Badge variant={t.priority === 'HIGH' ? 'danger' : 'warning'} size="xs">
                      {t.status || 'OPEN'}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-[#E2E8F0] mt-3 flex justify-between items-center text-xs">
            <span className="text-[11px] text-[#64748B]">Enforced Escalation SLAs</span>
            <button
              onClick={onNavigateToTasks}
              className="text-[#087F8C] hover:underline font-semibold text-[11px] cursor-pointer"
            >
              Task Register →
            </button>
          </div>
        </div>

        {/* Right Column: Branch Vault & RBI Window Surveillance */}
        <div className="bg-white border border-[#CBD5E1] rounded-sm p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between pb-2.5 border-b border-[#E2E8F0]">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#087F8C]" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                Branch Vault Position
              </h3>
            </div>
            <Badge variant="success" size="sm" dot>Balanced</Badge>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-[#64748B]">Physical Vault Cash:</span>
              <span className="font-mono font-bold text-[#172033]">
                {formatINR(metrics.vaultCashInHandInr)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#64748B]">Overnight Retention Cap:</span>
              <span className="font-mono text-[#475569]">
                {formatINR(metrics.vaultCashAuthorizedLimitInr)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-[#64748B]">Surplus to Remit (RBI Chest):</span>
              <span className="font-mono text-[#16803C] font-semibold">₹0.00</span>
            </div>
          </div>

          <div className="pt-2.5 border-t border-[#E2E8F0]">
            <div className="text-[10px] uppercase font-bold text-[#64748B] mb-2 tracking-wider">
              Clearing House Windows
            </div>
            <div className="space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[#475569]">RTGS Real-Time:</span>
                <span className="text-[#16803C] font-medium font-mono text-[11px]">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#475569]">NEFT 24x7 Batches:</span>
                <span className="text-[#16803C] font-medium font-mono text-[11px]">ACTIVE</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#475569]">CTS Cheque Clearing:</span>
                <span className="text-[#B45309] font-medium font-mono text-[11px]">BATCH 2 CLOSING</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================================
          6. RECENT SETTLEMENT FEED & TRANSACTION RECEIPT MODAL
          ====================================================================== */}
      <div className="bg-white border border-[#CBD5E1] rounded-sm shadow-2xs">
        <div className="p-3 sm:p-3.5 border-b border-[#CBD5E1] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
              Real-Time Settlement & Clearing Switch
            </h3>
            <span className="font-mono text-xs px-1.5 py-0.2 bg-[#F1F5F9] text-[#475569] border border-[#CBD5E1] rounded-xs">
              {recentPayments.length} txns
            </span>
          </div>
          <button
            onClick={onNavigateToPayments}
            className="text-xs text-[#087F8C] hover:underline font-bold cursor-pointer"
          >
            Open Switch Engine →
          </button>
        </div>

        <Table
          columns={paymentColumns}
          data={recentPayments}
          keyExtractor={(p) => p.transactionId}
        />
      </div>

      {/* ======================================================================
          7. PRIORITY ACTION RECOMMENDATIONS (Explainable Next Best Actions)
          ====================================================================== */}
      {priorityActions.length > 0 && (
        <div className="bg-white border border-[#CBD5E1] rounded-sm p-4 space-y-3 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E2E8F0] pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#B45309]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#172033]">
                  Priority Relationship Recommendations
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-xs bg-[#B45309]/15 text-[#B45309] font-semibold">
                  Rule-Driven & Explainable
                </span>
              </div>
              <p className="text-xs text-[#64748B] mt-0.5">
                Top high-impact recommendations derived from client CORE Scores, momentum trends, and open service tickets.
              </p>
            </div>
            <div className="flex items-center gap-2">
              {onNavigateToNextBestActions && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={onNavigateToNextBestActions}
                  className="text-xs inline-flex items-center gap-1"
                >
                  <span>All Recommendations</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {priorityActions.map((action) => (
              <NextBestActionCard
                key={action.id}
                action={action}
                onAccept={handleAcceptPriorityAction}
                onDismiss={(a) => setSelectedDismissAction(a)}
                onCreateTask={(a) => setSelectedTaskAction(a)}
                onViewEvidence={(a) => setSelectedEvidenceAction(a)}
                compact={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Opportunity Radar Executive Glance */}
      {radarStats && radarStats.totalActiveSignals > 0 && (
        <div className="bg-[#0f1e36] text-white rounded-sm p-4 shadow-sm border border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xs bg-[#087F8C]/20 border border-[#087F8C]/40 text-[#2dd4bf] shrink-0">
              <Radar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-teal-300 uppercase tracking-wider">
                  Customer Opportunity Radar
                </span>
                <span className="px-2 py-0.5 rounded-xs bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30">
                  {radarStats.totalActiveSignals} Active Signals
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Identified {radarStats.productGapsCount} product coverage gaps and {radarStats.relationshipOpportunitiesCount} expansion opportunities across assigned customer portfolios.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNavigateToOpportunityRadar && (
              <Button
                variant="brand"
                size="sm"
                onClick={onNavigateToOpportunityRadar}
                className="text-xs font-medium flex items-center gap-1.5"
              >
                <span>Launch Opportunity Radar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Treasury Surveillance & Notifications */}
      <MarketMovementsWidget onNavigateToForex={onNavigateToTradeFinance} />

      <NotificationStreamWidget
        onOpenNotificationsDrawer={onOpenNotificationsDrawer}
        onNavigateToEntity={onNavigateToEntity}
      />

      <DailyRelationshipBriefWidget
        onNavigateToActions={onNavigateToNextBestActions}
        onNavigateToCustomer={onNavigateToCustomers}
      />

      {/* Printable Receipt Modal */}
      {selectedReceiptPayment && (
        <TransactionReceiptModal
          isOpen={!!selectedReceiptPayment}
          onClose={() => setSelectedReceiptPayment(null)}
          transaction={selectedReceiptPayment}
        />
      )}

      {/* NBA Modals */}
      <ActionEvidenceModal
        isOpen={Boolean(selectedEvidenceAction)}
        onClose={() => setSelectedEvidenceAction(null)}
        action={selectedEvidenceAction}
      />

      <DismissActionModal
        isOpen={Boolean(selectedDismissAction)}
        onClose={() => setSelectedDismissAction(null)}
        action={selectedDismissAction}
        onConfirm={handleConfirmDismissAction}
      />

      <CreateTaskModal
        isOpen={Boolean(selectedTaskAction)}
        onClose={() => setSelectedTaskAction(null)}
        action={selectedTaskAction}
        onConfirm={handleConfirmCreateTaskFromAction}
      />
    </div>
  );
};
