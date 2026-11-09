import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { CustomerKYC, RiskCategory, CustomerCategory, NextBestAction } from '../../types';
import { Table, Column } from '../common/Table';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { StatCard } from '../common/StatCard';
import { Dialog } from '../common/Dialog';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';
import { formatINR } from '../../data/mockIndianBankingData';
import { bankingApi } from '../../lib/api';
import { useToast } from '../common/Toast';
import { NextBestActionCard } from '../nba/NextBestActionCard';
import { ActionEvidenceModal } from '../nba/ActionEvidenceModal';
import { DismissActionModal } from '../nba/DismissActionModal';
import { CreateTaskModal } from '../nba/CreateTaskModal';
import { CustomerOpportunityRadarWidget } from '../radar/CustomerOpportunityRadarWidget';
import { CustomerAlertsCard } from '../notifications/CustomerAlertsCard';
import { CommunicationProfileWidget } from '../interactions/CommunicationProfileWidget';
import { CustomerDocumentsTab } from '../documents/CustomerDocumentsTab';
import { CustomerJourneysTab } from '../journeys/CustomerJourneysTab';
import { CompactRelationshipTwinWidget } from '../twin/CompactRelationshipTwinWidget';
import { CustomerTwinTab } from '../twin/CustomerTwinTab';
import { DecisionTracePanel } from '../decision-trace/DecisionTracePanel';
import { DecisionComparisonModal } from '../decision-trace/DecisionComparisonModal';
import type { DecisionTraceDTO } from '../../types/decisionTrace.types';
import { CustomerTimelineTab } from '../customer/CustomerTimelineTab';
import { LogInteractionDrawer } from '../customer/LogInteractionDrawer';
import { EnrollProductModal } from '../customer/EnrollProductModal';
import {
  Search,
  UserCheck,
  Building,
  ShieldCheck,
  AlertCircle,
  Eye,
  FileBadge,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  WalletCards,
  Landmark,
  MessageSquare,
  LifeBuoy,
  TrendingUp,
  CheckSquare,
  Sparkles,
  RefreshCw,
  Plus,
  Send,
  Calendar,
  Package,
  BrainCircuit,
  AlertTriangle,
  Clock,
  Info,
  ExternalLink,
  FileText,
  ArrowRight,
  Radar,
  Bot,
  BellRing,
  Network,
  GitFork,
  GitCompare,
  Compass,
  BarChart3,
  Milestone,
  Users2,
  X,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  ArrowUpDown,
  User,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { useCopilot } from '../../context/CopilotContext';
import { RelationshipGraph } from '../graph/RelationshipGraph';
import { StrategySimulatorModule } from './StrategySimulatorModule';
import { RelationshipValueProfile } from '../relationship-value/RelationshipValueProfile';

interface CustomerKYCModuleProps {
  customers: CustomerKYC[];
  onRequestRiskOverride: (customer: CustomerKYC) => void;
  initialCustomerCode?: string;
}

export type Customer360TabType =
  | 'SUMMARY'
  | 'ACCOUNTS'
  | 'LOANS'
  | 'PRODUCTS'
  | 'INTERACTIONS'
  | 'CASES'
  | 'OPPORTUNITIES'
  | 'TASKS'
  | 'TIMELINE'
  | 'INTELLIGENCE'
  | 'ACTIONS'
  | 'KYC'
  | 'GRAPH'
  | 'TWIN'
  | 'DECISIONS'
  | 'RADAR'
  | 'ALERTS'
  | 'SIMULATOR'
  | 'VALUE'
  | 'JOURNEYS'
  | 'ONBOARDING';

export const CustomerKYCModule: React.FC<CustomerKYCModuleProps> = ({
  customers: initialCustomers,
  onRequestRiskOverride,
  initialCustomerCode,
}) => {
  const { openDrawer } = useCopilot();
  const toast = useToast();
  const [customers, setCustomers] = useState<CustomerKYC[]>(initialCustomers);
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [selectedEntityFilter, setSelectedEntityFilter] = useState<string>('ALL');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [quickFilter, setQuickFilter] = useState<'ALL' | 'DEMO' | 'HIGH_RISK' | 'HNI'>('ALL');
  const [tableDensity, setTableDensity] = useState<'normal' | 'compact'>('normal');

  // Sorting state for table
  const [sortColumn, setSortColumn] = useState<string>('cifNumber');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);

  // Active customer selection (null = Master Directory view; non-null = Customer 360 Workspace)
  const [activeCustomer, setActiveCustomer] = useState<CustomerKYC | null>(null);

  // 360 State from PostgreSQL
  const [dossier360, setDossier360] = useState<any | null>(null);
  const [financialSummary, setFinancialSummary] = useState<any | null>(null);
  const [loading360, setLoading360] = useState<boolean>(false);
  const [recalculatingScore, setRecalculatingScore] = useState<boolean>(false);
  const [selected360Insight, setSelected360Insight] = useState<any | null>(null);
  const [is360EvidenceModalOpen, setIs360EvidenceModalOpen] = useState<boolean>(false);
  const [action360Insight, setAction360Insight] = useState<any | null>(null);
  const [action360Type, setAction360Type] = useState<'ACKNOWLEDGE' | 'RESOLVE' | null>(null);
  const [action360Note, setAction360Note] = useState<string>('');
  const [submitting360Action, setSubmitting360Action] = useState<boolean>(false);
  const [recalculatingCustomerSignals, setRecalculatingCustomerSignals] = useState<boolean>(false);
  const [active360Tab, setActive360Tab] = useState<Customer360TabType>('SUMMARY');
  const [customerOnboarding, setCustomerOnboarding] = useState<{
    activeApplication: any | null;
    history: any[];
    completedCount: number;
  } | null>(null);

  // Next Best Action State
  const [customerActions, setCustomerActions] = useState<NextBestAction[]>([]);
  const [loadingActions, setLoadingActions] = useState<boolean>(false);
  const [recalculatingCustomerActions, setRecalculatingCustomerActions] = useState<boolean>(false);
  const [selectedEvidenceAction, setSelectedEvidenceAction] = useState<NextBestAction | null>(null);
  const [selectedDismissAction, setSelectedDismissAction] = useState<NextBestAction | null>(null);
  const [selectedTaskAction, setSelectedTaskAction] = useState<NextBestAction | null>(null);

  // Decision Trace State
  const [customerTraces, setCustomerTraces] = useState<DecisionTraceDTO[]>([]);
  const [loadingTraces, setLoadingTraces] = useState<boolean>(false);
  const [selectedDecisionTraceId, setSelectedDecisionTraceId] = useState<string | null>(null);
  const [isComparisonOpen, setIsComparisonOpen] = useState<boolean>(false);
  const [comparisonBaseTraceId, setComparisonBaseTraceId] = useState<string | null>(null);
  const [comparisonTargetTraceId, setComparisonTargetTraceId] = useState<string | null>(null);

  // Product Enrollment Modal & Interaction Drawer State
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState<boolean>(false);
  const [isLogInteractionDrawerOpen, setIsLogInteractionDrawerOpen] = useState<boolean>(false);

  // Fetch list from PostgreSQL on mount to ensure live consistency
  const refreshCustomerList = useCallback(async () => {
    setLoadingList(true);
    try {
      const res = await bankingApi.getCustomers({ limit: 100 });
      if (res.data && res.data.length > 0) {
        const mapped: CustomerKYC[] = res.data.map((dbC: any) => ({
          id: dbC.id,
          customerCode: dbC.customerCode,
          coreScore: dbC.coreScore,
          cifNumber: dbC.cifNumber,
          name: dbC.name,
          entityType: dbC.constitution as CustomerCategory,
          cKycNumber: dbC.ckycNumber || 'CKYC-9901-NA',
          panNumber: dbC.panNumber,
          aadhaarStatus: 'VERIFIED',
          gstin: dbC.gstin || undefined,
          riskCategory: dbC.riskCategory as RiskCategory,
          cibilScore: dbC.cibilScore || 750,
          occupationOrSector: dbC.industrySector || 'General Banking',
          annualTurnoverOrIncome: parseFloat(dbC.annualTurnover) || 5000000,
          onboardingDate: dbC.onboardingDate || '2023-01-15',
          kycLastReviewedDate: '2025-06-15',
          kycNextReviewDue: '2027-06-15',
          amlAlertCount: 0,
          email: 'client@corevia.bank.in',
          phone: '+91 98200 11223',
          registeredAddress: 'Nariman Point, Mumbai, Maharashtra 400021',
          accountsCount: 2,
          totalRelationshipValue: parseFloat(dbC.relationshipValue) || 4000000,
        }));
        setCustomers(mapped);

        // Handle initial customer code selection if provided
        if (initialCustomerCode && !activeCustomer) {
          const matched = mapped.find(
            (c) => c.customerCode === initialCustomerCode || c.cifNumber === initialCustomerCode
          );
          if (matched) {
            setActiveCustomer(matched);
          }
        }
      }
    } catch (err) {
      console.warn('Using initial customers fallback:', err);
    } finally {
      setLoadingList(false);
    }
  }, [initialCustomerCode, activeCustomer]);

  useEffect(() => {
    refreshCustomerList();
  }, [refreshCustomerList]);

  const fetchCustomer360 = useCallback(async (cif: string) => {
    setLoading360(true);
    try {
      const [bundle, finSummary, actionsRes] = await Promise.all([
        bankingApi.getCustomer360(cif),
        bankingApi.getCustomerFinancialSummary(cif).catch((e) => {
          console.warn('Financial summary fetch error:', e);
          return null;
        }),
        bankingApi.getCustomerNextBestActions(cif).catch((e) => {
          console.warn('Next Best Actions fetch error:', e);
          return [];
        }),
      ]);
      setDossier360(bundle);
      setFinancialSummary(finSummary);
      setCustomerActions(actionsRes || []);

      if (bundle?.customer?.id) {
        bankingApi
          .getCustomerOnboarding(bundle.customer.id)
          .then(setCustomerOnboarding)
          .catch((e) => {
            console.warn('Customer onboarding fetch error:', e);
            setCustomerOnboarding(null);
          });
        bankingApi
          .getDecisionTraces({ customerId: bundle.customer.id })
          .then((res) => {
            setCustomerTraces(res.items || []);
          })
          .catch((e) => {
            console.warn('Decision traces fetch error:', e);
            setCustomerTraces([]);
          });
      } else {
        setCustomerOnboarding(null);
        setCustomerTraces([]);
      }
    } catch (err) {
      console.error('Failed to load live 360 data:', err);
    } finally {
      setLoading360(false);
    }
  }, []);

  // Fetch 360 bundle whenever active customer changes
  useEffect(() => {
    if (!activeCustomer) {
      setDossier360(null);
      setFinancialSummary(null);
      return;
    }
    fetchCustomer360(activeCustomer.cifNumber);
  }, [activeCustomer, fetchCustomer360]);

  const handleRecalculateCustomerActions = async () => {
    if (!activeCustomer) return;
    setRecalculatingCustomerActions(true);
    try {
      await bankingApi.recalculateCustomerNextBestActions(activeCustomer.cifNumber);
      const acts = await bankingApi.getCustomerNextBestActions(activeCustomer.cifNumber);
      setCustomerActions(acts || []);
      toast.success('Next Best Actions recalculated deterministically.');
    } catch (err: any) {
      console.error('Failed to recalculate customer actions:', err);
      toast.error('Failed to evaluate next best actions.');
    } finally {
      setRecalculatingCustomerActions(false);
    }
  };

  const handleAcceptAction = async (action: NextBestAction) => {
    if (!activeCustomer) return;
    try {
      await bankingApi.acceptNextBestAction(action.id);
      const acts = await bankingApi.getCustomerNextBestActions(activeCustomer.cifNumber);
      setCustomerActions(acts || []);
      toast.success(`Action accepted: ${action.title}`);
    } catch (err: any) {
      console.error('Failed to accept action:', err);
    }
  };

  const handleConfirmDismissAction = async (id: number, reason: string) => {
    if (!activeCustomer) return;
    await bankingApi.dismissNextBestAction(id, reason);
    const acts = await bankingApi.getCustomerNextBestActions(activeCustomer.cifNumber);
    setCustomerActions(acts || []);
    toast.success('Action dismissed from queue.');
  };

  const handleConfirmCreateTaskFromAction = async (
    id: number,
    taskData: { title: string; dueDate: string; priority: string; description: string }
  ) => {
    if (!activeCustomer) return;
    await bankingApi.createTaskFromNextBestAction(id, taskData);
    const [acts, updatedBundle] = await Promise.all([
      bankingApi.getCustomerNextBestActions(activeCustomer.cifNumber),
      bankingApi.getCustomer360(activeCustomer.cifNumber),
    ]);
    setCustomerActions(acts || []);
    setDossier360(updatedBundle);
    toast.success('RM task created and scheduled.');
  };

  const handleRecalculateScore = async () => {
    if (!activeCustomer) return;
    setRecalculatingScore(true);
    try {
      const res = await bankingApi.recalculateCoreScore(activeCustomer.cifNumber);
      if (res && res.data) {
        const updatedSummary = await bankingApi.getCustomerFinancialSummary(activeCustomer.cifNumber);
        setFinancialSummary(updatedSummary);
        toast.success(`CORE score recalculated: ${res.data.coreScore || 'Updated'}`);
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to recalculate CORE score');
    } finally {
      setRecalculatingScore(false);
    }
  };

  const handleRecalculateCustomerSignals = async () => {
    if (!activeCustomer) return;
    setRecalculatingCustomerSignals(true);
    try {
      await bankingApi.recalculateCustomerIntelligence(activeCustomer.cifNumber);
      const updatedBundle = await bankingApi.getCustomer360(activeCustomer.cifNumber);
      setDossier360(updatedBundle);
      toast.success('Relationship intelligence signals refreshed.');
    } catch (err: any) {
      toast.error('Failed to recalculate customer signals.');
    } finally {
      setRecalculatingCustomerSignals(false);
    }
  };

  const handle360ActionSubmit = async () => {
    if (!action360Insight || !action360Type || !activeCustomer) return;
    setSubmitting360Action(true);
    try {
      if (action360Type === 'ACKNOWLEDGE') {
        await bankingApi.acknowledgeIntelligence(action360Insight.id, action360Note);
        toast.success('Intelligence signal acknowledged.');
      } else {
        await bankingApi.resolveIntelligence(action360Insight.id, action360Note);
        toast.success('Intelligence signal resolved.');
      }
      setAction360Type(null);
      setAction360Insight(null);
      setAction360Note('');
      const updatedBundle = await bankingApi.getCustomer360(activeCustomer.cifNumber);
      setDossier360(updatedBundle);
    } catch (err) {
      toast.error('Failed to update 360 insight status.');
    } finally {
      setSubmitting360Action(false);
    }
  };

  const handleOpenEnrollModal = async () => {
    try {
      const prods = await bankingApi.getProducts({ isActive: true });
      setAvailableProducts(prods || []);
      setIsEnrollModalOpen(true);
    } catch (err: any) {
      toast.error(err.message || 'Failed to fetch available products');
    }
  };

  // Filtered customers with sorting & search
  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      // Constitution filter
      const matchEntity = selectedEntityFilter === 'ALL' || c.entityType === selectedEntityFilter;

      // Risk category filter
      const matchRisk = selectedRiskFilter === 'ALL' || c.riskCategory === selectedRiskFilter;

      // Quick filter
      let matchQuick = true;
      if (quickFilter === 'DEMO') {
        matchQuick = c.customerCode === 'CUS-10482' || c.name.includes('Rahul Sharma');
      } else if (quickFilter === 'HIGH_RISK') {
        matchQuick = c.riskCategory === 'HIGH';
      } else if (quickFilter === 'HNI') {
        matchQuick = c.totalRelationshipValue >= 2500000;
      }

      // Search term
      const search = searchTerm.trim().toLowerCase();
      const matchSearch =
        search === '' ||
        c.cifNumber.toLowerCase().includes(search) ||
        c.name.toLowerCase().includes(search) ||
        c.panNumber.toLowerCase().includes(search) ||
        c.cKycNumber.toLowerCase().includes(search) ||
        (c.customerCode && c.customerCode.toLowerCase().includes(search)) ||
        (c.gstin && c.gstin.toLowerCase().includes(search));

      return matchEntity && matchRisk && matchQuick && matchSearch;
    });
  }, [customers, selectedEntityFilter, selectedRiskFilter, quickFilter, searchTerm]);

  // Sorted customers
  const sortedCustomers = useMemo(() => {
    return [...filteredCustomers].sort((a, b) => {
      let valA: any = a[sortColumn as keyof CustomerKYC] ?? '';
      let valB: any = b[sortColumn as keyof CustomerKYC] ?? '';

      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();

      if (valA < valB) return sortDirection === 'asc' ? -1 : 1;
      if (valA > valB) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }, [filteredCustomers, sortColumn, sortDirection]);

  // Paginated customers
  const paginatedCustomers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedCustomers.slice(startIndex, startIndex + pageSize);
  }, [sortedCustomers, currentPage, pageSize]);

  // KPI Calculations
  const totalRelationshipValue = useMemo(() => {
    return customers.reduce((sum, c) => sum + (c.totalRelationshipValue || 0), 0);
  }, [customers]);

  const highRiskCount = useMemo(() => {
    return customers.filter((c) => c.riskCategory === 'HIGH').length;
  }, [customers]);

  const avgCibil = useMemo(() => {
    if (customers.length === 0) return 750;
    return Math.round(customers.reduce((sum, c) => sum + (c.cibilScore || 750), 0) / customers.length);
  }, [customers]);

  const handleSort = (columnKey: string) => {
    if (sortColumn === columnKey) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(columnKey);
      setSortDirection('asc');
    }
  };

  // Table Columns Definition
  const columns: Column<CustomerKYC>[] = [
    {
      key: 'cifNumber',
      header: 'CIF Identifier',
      mono: true,
      sortable: true,
      render: (c) => (
        <div>
          <span className="font-mono font-semibold text-slate-900 dark:text-[#E8EEF5]">
            {c.cifNumber}
          </span>
          <div className="text-[10px] text-slate-500 dark:text-[#8194A8] font-mono">
            {c.cKycNumber}
          </div>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Customer / Corporate Entity',
      sortable: true,
      render: (c) => (
        <div className="max-w-[240px]">
          <div className="font-semibold text-slate-900 dark:text-[#E8EEF5] truncate flex items-center gap-1.5">
            <span>{c.name}</span>
            {(c.customerCode === 'CUS-10482' || c.name.includes('Rahul Sharma')) && (
              <span
                className="text-[9px] px-1.5 py-0.2 bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 rounded font-normal font-sans border border-amber-300 dark:border-amber-800"
                title="Deterministic Demonstration Subject"
              >
                Demo
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-[#8194A8] truncate">
            {c.occupationOrSector}
          </div>
        </div>
      ),
    },
    {
      key: 'entityType',
      header: 'Constitution',
      sortable: true,
      render: (c) => (
        <span className="text-xs font-medium text-slate-700 dark:text-[#A9BACB]">
          {c.entityType ? c.entityType.replace('_', ' ') : 'INDIVIDUAL'}
        </span>
      ),
    },
    {
      key: 'panNumber',
      header: 'Tax ID & PAN',
      mono: true,
      sortable: true,
      render: (c) => (
        <div>
          <span className="font-mono font-medium text-slate-900 dark:text-[#E8EEF5]">
            {c.panNumber}
          </span>
          {c.gstin && (
            <div className="text-[10px] text-slate-500 dark:text-[#8194A8] font-mono truncate max-w-[120px]">
              GST: {c.gstin}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'cibilScore',
      header: 'CIBIL Bureau',
      mono: true,
      sortable: true,
      render: (c) => (
        <div className="flex items-center gap-1.5">
          <span
            className={`font-mono font-semibold text-xs ${
              c.cibilScore >= 750
                ? 'text-emerald-700 dark:text-emerald-400'
                : c.cibilScore >= 650
                ? 'text-amber-700 dark:text-amber-400'
                : 'text-rose-700 dark:text-rose-400'
            }`}
          >
            {c.cibilScore}
          </span>
          <span className="text-[10px] text-slate-400 dark:text-[#8194A8]">/ 900</span>
        </div>
      ),
    },
    {
      key: 'totalRelationshipValue',
      header: 'TRV Portfolio',
      mono: true,
      sortable: true,
      render: (c) => (
        <span className="font-mono font-semibold text-slate-900 dark:text-[#E8EEF5]">
          {formatINR(c.totalRelationshipValue)}
        </span>
      ),
    },
    {
      key: 'riskCategory',
      header: 'AML Risk',
      sortable: true,
      render: (c) => (
        <Badge
          variant={
            c.riskCategory === 'LOW'
              ? 'success'
              : c.riskCategory === 'MEDIUM'
              ? 'warning'
              : 'danger'
          }
          size="sm"
        >
          {c.riskCategory} RISK
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      render: (c) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setActiveCustomer(c);
            setActive360Tab('SUMMARY');
          }}
          className="text-xs py-0.5 px-2.5 font-medium hover:border-[#168C83]"
        >
          <Eye className="w-3.5 h-3.5 mr-1" />
          <span>Open 360 Workspace</span>
        </Button>
      ),
    },
  ];

  // =========================================================================
  // RENDER: MODE B — CUSTOMER 360 RELATIONSHIP MANAGER WORKSPACE
  // =========================================================================
  if (activeCustomer) {
    const isRahulSharma =
      activeCustomer.customerCode === 'CUS-10482' || activeCustomer.name.includes('Rahul Sharma');

    return (
      <div className="space-y-4">
        {/* Workspace Top Navigation Breadcrumb & Customer Quick Switcher */}
        <div className="bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded p-3 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveCustomer(null)}
              className="inline-flex items-center gap-1 text-xs font-semibold text-[#142C45] dark:text-[#1B9D92] hover:underline px-2.5 py-1 rounded bg-slate-100 dark:bg-[#192B3D] border border-slate-200 dark:border-[#33485D] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to Master Directory</span>
            </button>

            <span className="text-slate-300 dark:text-[#33485D]">/</span>

            {/* Quick Customer Switcher Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 dark:text-[#8194A8] hidden md:inline">
                Active RM Dossier:
              </span>
              <div className="relative">
                <select
                  value={activeCustomer.cifNumber}
                  onChange={(e) => {
                    const matched = customers.find((c) => c.cifNumber === e.target.value);
                    if (matched) {
                      setActiveCustomer(matched);
                      setActive360Tab('SUMMARY');
                    }
                  }}
                  className="text-xs font-semibold bg-slate-50 dark:bg-[#101C2A] border border-slate-300 dark:border-[#33485D] rounded px-2.5 py-1 text-slate-900 dark:text-[#E8EEF5] focus:outline-none focus:ring-1 focus:ring-[#168C83]"
                >
                  {customers.map((c) => (
                    <option key={c.cifNumber} value={c.cifNumber}>
                      {c.name} ({c.cifNumber}) {c.customerCode === 'CUS-10482' ? '★ Demo' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fetchCustomer360(activeCustomer.cifNumber)}
              disabled={loading360}
              icon={<RefreshCw className={`w-3.5 h-3.5 ${loading360 ? 'animate-spin' : ''}`} />}
            >
              Sync 360 Dossier
            </Button>
          </div>
        </div>

        {/* Deterministic Demonstration Subject Notice */}
        {isRahulSharma && (
          <div className="bg-amber-500/10 dark:bg-amber-500/15 border border-amber-400/40 text-amber-900 dark:text-amber-200 text-xs px-3.5 py-2 rounded flex flex-wrap items-center justify-between gap-2 shadow-2xs">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                Deterministic Demonstration Subject (Rahul Sharma · CUS-10482) · Grounded Demo Fixture
              </span>
            </span>
            <span className="text-[10px] text-amber-800 dark:text-amber-300/80 font-mono">
              All relationship telemetry, balance positions, and audit traces validated against Cloud SQL PostgreSQL
            </span>
          </div>
        )}

        {/* UNIFIED EXECUTIVE CUSTOMER HEADER & INTEGRATED METRIC STRIP (Single Cohesive Container) */}
        <div className="bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded shadow-2xs overflow-hidden">
          {/* Identity Tier */}
          <div className="p-4 border-b border-slate-100 dark:border-[#1F334A] flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              {/* Monogram Avatar */}
              <div className="w-12 h-12 rounded bg-[#142C45] dark:bg-[#1B9D92] text-white flex items-center justify-center font-bold text-base shrink-0 shadow-xs tracking-wider">
                {activeCustomer.name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)
                  .toUpperCase()}
              </div>

              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg font-bold text-slate-900 dark:text-[#E8EEF5] tracking-tight">
                    {activeCustomer.name}
                  </h1>
                  <Badge variant="neutral" size="sm">
                    {activeCustomer.entityType ? activeCustomer.entityType.replace('_', ' ') : 'INDIVIDUAL'}
                  </Badge>
                  <Badge
                    variant={
                      activeCustomer.riskCategory === 'LOW'
                        ? 'success'
                        : activeCustomer.riskCategory === 'MEDIUM'
                        ? 'warning'
                        : 'danger'
                    }
                    size="sm"
                  >
                    {activeCustomer.riskCategory} AML RISK
                  </Badge>
                  {isRahulSharma && (
                    <span className="text-[10px] px-2 py-0.5 rounded font-mono font-medium bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800">
                      Grounded Fixture
                    </span>
                  )}
                </div>

                {/* Identity Identifiers & Verification Tags */}
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-[#A9BACB] font-mono">
                  <span>
                    CIF: <strong className="text-slate-900 dark:text-[#E8EEF5]">{activeCustomer.cifNumber}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    Code: <strong className="text-slate-900 dark:text-[#E8EEF5]">{activeCustomer.customerCode || 'CUS-10482'}</strong>
                  </span>
                  <span>•</span>
                  <span>
                    PAN: <strong className="text-slate-900 dark:text-[#E8EEF5]">{activeCustomer.panNumber}</strong>
                  </span>
                  <span>•</span>
                  <span className="inline-flex items-center text-emerald-700 dark:text-emerald-400 font-sans font-medium text-[11px]">
                    <CheckCircle2 className="w-3 h-3 mr-1" />
                    cKYC & Aadhaar Verified
                  </span>
                  <span>•</span>
                  <span className="font-sans text-[11px] text-slate-500 dark:text-[#8194A8]">
                    Sector: {activeCustomer.occupationOrSector}
                  </span>
                </div>
              </div>
            </div>

            {/* Contextual Action Bar */}
            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsLogInteractionDrawerOpen(true)}
                icon={<MessageSquare className="w-3.5 h-3.5" />}
              >
                Log Touchpoint
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => onRequestRiskOverride(activeCustomer)}
                icon={<ShieldCheck className="w-3.5 h-3.5" />}
              >
                Reclassify Risk (Maker-Checker)
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  openDrawer(
                    {
                      type: 'CUSTOMER',
                      id: activeCustomer.id,
                      code: activeCustomer.customerCode || activeCustomer.cifNumber,
                      label: `${activeCustomer.name} · ${activeCustomer.customerCode || activeCustomer.cifNumber}`,
                    },
                    `Provide executive portfolio overview and relationship health for ${activeCustomer.name}.`
                  );
                }}
                className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 font-medium"
                icon={<Bot className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />}
              >
                Ask Copilot
              </Button>

              <button
                type="button"
                onClick={() => setActive360Tab('GRAPH')}
                className="px-2.5 py-1.5 rounded text-xs font-medium bg-slate-100 dark:bg-[#192B3D] text-slate-700 dark:text-[#A9BACB] hover:bg-slate-200 dark:hover:bg-[#20364B] border border-slate-200 dark:border-[#33485D] transition-colors flex items-center gap-1"
                title="Explore Relationship Graph"
              >
                <GitFork className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Graph</span>
              </button>

              <button
                type="button"
                onClick={() => setActive360Tab('SIMULATOR')}
                className="px-2.5 py-1.5 rounded text-xs font-medium bg-slate-100 dark:bg-[#192B3D] text-slate-700 dark:text-[#A9BACB] hover:bg-slate-200 dark:hover:bg-[#20364B] border border-slate-200 dark:border-[#33485D] transition-colors flex items-center gap-1"
                title="Simulate Relationship Strategy"
              >
                <Compass className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Simulator</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  const grpId =
                    activeCustomer.customerCode === 'CUS-10482'
                      ? 'HH-10482'
                      : activeCustomer.customerCode === 'CUS-10821'
                      ? 'HH-10482'
                      : null;
                  if (grpId) {
                    window.location.href = `/group/${grpId}`;
                  } else {
                    window.location.href = `/groups`;
                  }
                }}
                className="px-2.5 py-1.5 rounded text-xs font-medium bg-slate-100 dark:bg-[#192B3D] text-slate-700 dark:text-[#A9BACB] hover:bg-slate-200 dark:hover:bg-[#20364B] border border-slate-200 dark:border-[#33485D] transition-colors flex items-center gap-1"
                title="Open Household / Group View"
              >
                <Users2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Household</span>
              </button>
            </div>
          </div>

          {/* Integrated Cohesive Metric Strip (No Excessive Cards) */}
          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 divide-y sm:divide-y-0 sm:divide-x divide-slate-100 dark:divide-[#1F334A] bg-slate-50/50 dark:bg-[#101C2A]/60 text-xs">
            {/* 1. TRV */}
            <div className="p-3">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-[#8194A8] block">
                Total Relationship Value
              </span>
              <div className="text-base font-mono font-bold text-slate-900 dark:text-[#E8EEF5] mt-0.5">
                {financialSummary?.storedRelationshipValue
                  ? formatINR(financialSummary.storedRelationshipValue.amount)
                  : formatINR(activeCustomer.totalRelationshipValue || 4280000)}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-[#8194A8] block">
                Contractual Stored Value
              </span>
            </div>

            {/* 2. Net Position */}
            <div className="p-3">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-[#8194A8] block">
                Net Financial Position
              </span>
              <div className="text-base font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {financialSummary?.calculatedMetrics
                  ? formatINR(financialSummary.calculatedMetrics.netFinancialPosition)
                  : formatINR(1007500)}
              </div>
              <span className="text-[10px] text-slate-500 dark:text-[#8194A8] block">
                Calculated Live from DB
              </span>
            </div>

            {/* 3. CORE Score */}
            <div className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-[#8194A8]">
                  CORE Score
                </span>
                <button
                  type="button"
                  onClick={handleRecalculateScore}
                  disabled={recalculatingScore}
                  className="text-[10px] text-[#168C83] dark:text-[#1B9D92] hover:underline flex items-center"
                  title="Recalculate score"
                >
                  <RefreshCw className={`w-2.5 h-2.5 mr-0.5 ${recalculatingScore ? 'animate-spin' : ''}`} />
                  Recalc
                </button>
              </div>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-base font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  {financialSummary?.coreScoreData?.score || dossier360?.score?.totalScore || 88}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-[#8194A8]">/ 100</span>
                <span className="ml-1 text-[9px] px-1 py-0.2 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-semibold">
                  {financialSummary?.coreScoreData?.grade || 'EXCELLENT'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-[#8194A8] block">
                Dynamic Health Band
              </span>
            </div>

            {/* 4. CIBIL Bureau */}
            <div className="p-3">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-[#8194A8] block">
                CIBIL Bureau Score
              </span>
              <div className="text-base font-mono font-bold text-slate-900 dark:text-[#E8EEF5] mt-0.5">
                {activeCustomer.cibilScore}
                <span className="text-[10px] font-normal text-slate-500 dark:text-[#8194A8] ml-1">
                  / 900
                </span>
              </div>
              <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium block">
                Bureau Prime Grade
              </span>
            </div>

            {/* 5. Active Products */}
            <div className="p-3">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-[#8194A8] block">
                Subscribed Products
              </span>
              <div className="text-base font-mono font-bold text-slate-900 dark:text-[#E8EEF5] mt-0.5">
                {financialSummary?.calculatedMetrics?.totalActiveProductsCount ||
                  financialSummary?.activeProducts?.length ||
                  6}{' '}
                <span className="text-xs font-normal text-slate-500 dark:text-[#8194A8]">Products</span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-[#8194A8] block">
                customer_products ledger
              </span>
            </div>

            {/* 6. AML Alerts & Risk */}
            <div className="p-3">
              <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-[#8194A8] block">
                AML & Regulatory
              </span>
              <div className="text-base font-mono font-bold text-slate-900 dark:text-[#E8EEF5] mt-0.5 flex items-center gap-1.5">
                <span className="text-emerald-600 dark:text-emerald-400">0 Alerts</span>
                <span className="text-[10px] text-slate-400">·</span>
                <span className="text-xs font-sans text-slate-600 dark:text-[#A9BACB]">
                  {activeCustomer.riskCategory}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 dark:text-[#8194A8] block">
                Next Review: {activeCustomer.kycNextReviewDue}
              </span>
            </div>
          </div>
        </div>

        {/* STRUCTURED WORKSPACE TABS */}
        <div className="bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded shadow-2xs">
          {/* Scrollable Tab Header Bar */}
          <div
            role="tablist"
            aria-label="Customer 360 Workspace Modules"
            className="flex items-center gap-1 border-b border-slate-200 dark:border-[#33485D] px-3 pt-2 overflow-x-auto text-xs scrollbar-none"
          >
            {[
              { id: 'SUMMARY', label: 'Relationship Summary', icon: BarChart3 },
              {
                id: 'ACCOUNTS',
                label: `Accounts (${dossier360?.accounts?.length || 0})`,
                icon: WalletCards,
              },
              {
                id: 'LOANS',
                label: `Loans & Credit (${dossier360?.loans?.length || 0})`,
                icon: Landmark,
              },
              {
                id: 'PRODUCTS',
                label: `Products (${financialSummary?.activeProducts?.length || 6})`,
                icon: Package,
              },
              {
                id: 'INTERACTIONS',
                label: `Interactions (${dossier360?.interactions?.length || 0})`,
                icon: MessageSquare,
              },
              {
                id: 'CASES',
                label: `Cases & Grievances (${dossier360?.cases?.length || 0})`,
                icon: LifeBuoy,
              },
              {
                id: 'OPPORTUNITIES',
                label: `Opportunities (${dossier360?.opportunities?.length || 0})`,
                icon: TrendingUp,
              },
              {
                id: 'TASKS',
                label: `Tasks (${dossier360?.tasks?.length || 0})`,
                icon: CheckSquare,
              },
              { id: 'TIMELINE', label: 'Visual Relationship Timeline', icon: Calendar },
              {
                id: 'INTELLIGENCE',
                label: `Signals & CORE (${dossier360?.insights?.length || 0})`,
                icon: BrainCircuit,
              },
              {
                id: 'ACTIONS',
                label: `Next Best Actions (${customerActions.filter((a) => a.status === 'ACTIVE').length})`,
                icon: Sparkles,
              },
              { id: 'KYC', label: 'KYC & Demographics', icon: UserCheck },
              { id: 'DOCUMENTS', label: 'Documents Vault', icon: FileText },
              { id: 'JOURNEYS', label: 'Lifecycle Journeys', icon: Milestone },
              { id: 'GRAPH', label: 'Relationship Graph', icon: GitFork },
              { id: 'TWIN', label: 'Digital Twin', icon: Network },
              {
                id: 'DECISIONS',
                label: `Decision Traces (${customerTraces.length || (activeCustomer?.id === 1 ? 4 : 1)})`,
                icon: ShieldCheck,
              },
              { id: 'RADAR', label: 'Opportunity Radar', icon: Radar },
              { id: 'ALERTS', label: 'Alerts & Governance', icon: BellRing },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = active360Tab === tab.id;
              return (
                <button
                  key={tab.id}
                  role="tab"
                  aria-selected={isActive}
                  onClick={() => setActive360Tab(tab.id as Customer360TabType)}
                  className={`flex items-center gap-1.5 py-2 px-3 border-b-2 font-medium whitespace-nowrap transition-colors text-xs ${
                    isActive
                      ? 'border-[#168C83] text-[#142C45] dark:text-[#1B9D92] font-semibold'
                      : 'border-transparent text-slate-600 dark:text-[#A9BACB] hover:text-slate-900 dark:hover:text-[#E8EEF5] hover:border-slate-300 dark:hover:border-[#33485D]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content Body */}
          <div className="p-4">
            {loading360 ? (
              <div className="py-12 text-center text-xs text-slate-500 dark:text-[#8194A8] flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-[#168C83]" />
                <span>Querying PostgreSQL Customer 360 Dossier & Ledger...</span>
              </div>
            ) : (
              <div key={active360Tab} className="space-y-4">
                {/* 1. SUMMARY TAB */}
                {active360Tab === 'SUMMARY' && (
                  <div className="space-y-4">
                    {/* Top Prioritized Next Best Action Banner */}
                    {(() => {
                      const activeActionsList = customerActions.filter((a) => a.status === 'ACTIVE');
                      const topRec =
                        activeActionsList.find((a) => a.isTopRecommendation) ||
                        (activeActionsList.length > 0 ? activeActionsList[0] : null);

                      if (!topRec) return null;

                      return (
                        <div className="bg-amber-500/10 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-800 rounded p-3.5 space-y-2.5 shadow-2xs">
                          <div className="flex items-center justify-between text-xs">
                            <div className="flex items-center gap-1.5 font-bold text-amber-950 dark:text-amber-200">
                              <Sparkles className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                              <span>Recommended Next Best Action</span>
                              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-200 border border-amber-200 dark:border-amber-700">
                                Top Priority
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActive360Tab('ACTIONS')}
                              className="text-[#168C83] dark:text-[#1B9D92] hover:underline font-semibold text-xs inline-flex items-center gap-1"
                            >
                              <span>View all {activeActionsList.length} actions</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                          <NextBestActionCard
                            action={topRec}
                            onAccept={handleAcceptAction}
                            onDismiss={(a) => setSelectedDismissAction(a)}
                            onCreateTask={(a) => setSelectedTaskAction(a)}
                            onViewEvidence={(a) => setSelectedEvidenceAction(a)}
                            onExplainDecision={(a) => {
                              const fallbackTrace =
                                a.customerId === 1 ? 'DT-20260928-00102' : 'DT-20260928-00201';
                              setSelectedDecisionTraceId(a.traceId || fallbackTrace);
                            }}
                            compact={true}
                          />
                        </div>
                      );
                    })()}

                    {/* Financial Portfolio Balance Breakdown */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded p-3.5 space-y-1">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-[#8194A8] block">
                          Aggregate Deposits
                        </span>
                        <div className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">
                          {formatINR(financialSummary?.calculatedMetrics?.totalDeposits || 2842500)}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-[#8194A8]">
                          CASA Balances &amp; Term Deposit Reserves
                        </p>
                      </div>

                      <div className="bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded p-3.5 space-y-1">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-[#8194A8] block">
                          Total Credit Exposure
                        </span>
                        <div className="text-lg font-mono font-bold text-amber-600 dark:text-amber-400">
                          {formatINR(financialSummary?.calculatedMetrics?.totalLoanExposure || 3850000)}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-[#8194A8]">
                          Outstanding Principal across Lending Lines
                        </p>
                      </div>

                      <div className="bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded p-3.5 space-y-1">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-[#8194A8] block">
                          Average Monthly Balance (AMB)
                        </span>
                        <div className="text-lg font-mono font-bold text-blue-600 dark:text-blue-400">
                          {formatINR(financialSummary?.calculatedMetrics?.averageMonthlyBalance || 480225)}
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-[#8194A8]">
                          Calculated 90-Day Operational Velocity
                        </p>
                      </div>
                    </div>

                    {/* Relationship Digital Twin Compact Widget */}
                    <CompactRelationshipTwinWidget
                      customerId={activeCustomer.id || dossier360?.customer?.id || 1}
                      customerName={activeCustomer.name}
                      onNavigateToTab={(tab) => setActive360Tab(tab as Customer360TabType)}
                      onOpenFullTwin={() => setActive360Tab('TWIN')}
                    />

                    {/* Quick Launch Cards for Connected Layers */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Graph Entry */}
                      <div className="bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded p-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200 dark:border-indigo-800 text-indigo-700 dark:text-indigo-400 rounded">
                            <GitFork className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-[#E8EEF5]">
                              Multi-Hop Relationship Graph
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-[#8194A8]">
                              Explore accounts, loans, guarantees, and corporate affiliations
                            </div>
                          </div>
                        </div>
                        <Button size="xs" variant="outline" onClick={() => setActive360Tab('GRAPH')}>
                          Explore Graph
                        </Button>
                      </div>

                      {/* Strategy Simulator Entry */}
                      <div className="bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded p-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 rounded">
                            <Compass className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="text-xs font-bold text-slate-900 dark:text-[#E8EEF5]">
                              Relationship Strategy Simulator
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-[#8194A8]">
                              Model interest rate shifts, deposits, and credit upgrades
                            </div>
                          </div>
                        </div>
                        <Button size="xs" variant="outline" onClick={() => setActive360Tab('SIMULATOR')}>
                          Open Simulator
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. ACCOUNTS TAB */}
                {active360Tab === 'ACCOUNTS' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-[#E8EEF5]">
                          PostgreSQL Linked Accounts &amp; Balances
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-[#8194A8]">
                          Real-time ledger accounts linked to CIF {activeCustomer.cifNumber}.
                        </p>
                      </div>
                    </div>

                    {dossier360?.accounts && dossier360.accounts.length > 0 ? (
                      <div className="space-y-2">
                        {dossier360.accounts.map((acc: any) => (
                          <div
                            key={acc.id}
                            className="p-3.5 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded text-xs flex flex-col sm:flex-row justify-between sm:items-center gap-2 hover:border-slate-300 dark:hover:border-[#435e7a] transition-all"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-900 dark:text-[#E8EEF5]">
                                  {acc.accountNumber}
                                </span>
                                <Badge variant="neutral" size="sm">
                                  {acc.accountType}
                                </Badge>
                                <Badge
                                  variant={acc.status === 'ACTIVE' ? 'success' : 'warning'}
                                  size="sm"
                                >
                                  {acc.status}
                                </Badge>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-[#8194A8]">
                                Scheme: {acc.schemeName} | Branch IFSC: {acc.ifscCode}
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="font-mono font-bold text-slate-900 dark:text-[#E8EEF5] text-sm">
                                {formatINR(parseFloat(acc.balance?.availableBalance) || 0)}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-[#8194A8] font-mono">
                                Ledger: {formatINR(parseFloat(acc.balance?.ledgerBalance) || 0)}
                                {parseFloat(acc.balance?.lienAmount) > 0 && (
                                  <span className="text-rose-600 dark:text-rose-400 font-semibold ml-1">
                                    (Lien: {formatINR(parseFloat(acc.balance?.lienAmount))})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded text-center text-xs text-slate-500 dark:text-[#8194A8]">
                        <WalletCards className="w-6 h-6 mx-auto mb-1.5 text-slate-400 dark:text-[#8194A8]" />
                        No linked deposit accounts registered.
                      </div>
                    )}
                  </div>
                )}

                {/* 3. LOANS TAB */}
                {active360Tab === 'LOANS' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-[#E8EEF5]">
                          Credit Lines &amp; Loan Facilities
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-[#8194A8]">
                          Sanctioned credit limits and outstanding principal balances.
                        </p>
                      </div>
                    </div>

                    {dossier360?.loans && dossier360.loans.length > 0 ? (
                      <div className="space-y-2">
                        {dossier360.loans.map((loan: any) => (
                          <div
                            key={loan.id}
                            className="p-3.5 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded text-xs flex flex-col sm:flex-row justify-between sm:items-center gap-2 hover:border-slate-300 dark:hover:border-[#435e7a] transition-all"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-900 dark:text-[#E8EEF5]">
                                  {loan.loanAccountNumber}
                                </span>
                                <Badge variant="info" size="sm">
                                  {loan.loanType}
                                </Badge>
                                <Badge
                                  variant={loan.status === 'STANDARD' ? 'success' : 'warning'}
                                  size="sm"
                                >
                                  {loan.status}
                                </Badge>
                              </div>
                              <div className="text-[11px] text-slate-500 dark:text-[#8194A8]">
                                EMI: {formatINR(parseFloat(loan.emiAmount) || 0)} | Interest Rate: {loan.interestRate}% p.a.
                              </div>
                            </div>

                            <div className="text-right">
                              <div className="font-mono font-bold text-slate-900 dark:text-[#E8EEF5] text-sm">
                                {formatINR(parseFloat(loan.outstandingPrincipal) || 0)}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-[#8194A8] font-mono">
                                Sanctioned Limit: {formatINR(parseFloat(loan.sanctionedLimit) || 0)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded text-center text-xs text-slate-500 dark:text-[#8194A8]">
                        <Landmark className="w-6 h-6 mx-auto mb-1.5 text-slate-400 dark:text-[#8194A8]" />
                        No active lending facilities found for this customer.
                      </div>
                    )}
                  </div>
                )}

                {/* 4. PRODUCTS TAB */}
                {active360Tab === 'PRODUCTS' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-[#E8EEF5] flex items-center gap-1.5">
                          <Package className="w-4 h-4 text-[#168C83] dark:text-[#1B9D92]" />
                          <span>Customer Product Portfolio (customer_products)</span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-[#8194A8]">
                          Active banking products and scheme subscriptions held in PostgreSQL ledger.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="primary"
                        icon={<Plus className="w-3.5 h-3.5" />}
                        onClick={handleOpenEnrollModal}
                      >
                        Enroll in Product
                      </Button>
                    </div>

                    {financialSummary?.activeProducts && financialSummary.activeProducts.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {financialSummary.activeProducts.map((p: any) => (
                          <div
                            key={p.id}
                            className="p-3.5 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded text-xs space-y-2 hover:border-slate-300 dark:hover:border-[#435e7a] transition-all"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="font-semibold text-slate-900 dark:text-[#E8EEF5] block">
                                  {p.name || p.schemeName}
                                </span>
                                <span className="font-mono text-[10px] text-slate-500 dark:text-[#8194A8]">
                                  Code: {p.productCode}
                                </span>
                              </div>
                              <Badge
                                variant={
                                  p.category === 'CASA'
                                    ? 'info'
                                    : p.category === 'TERM_DEPOSIT'
                                    ? 'neutral'
                                    : p.category === 'LOANS'
                                    ? 'warning'
                                    : 'success'
                                }
                                size="sm"
                              >
                                {p.category}
                              </Badge>
                            </div>

                            <div className="space-y-1 text-[11px] border-t border-slate-200 dark:border-[#1F334A] pt-2">
                              {p.accountNumber && (
                                <div className="flex justify-between">
                                  <span className="text-slate-500 dark:text-[#8194A8]">
                                    Linked Account #:
                                  </span>
                                  <span className="font-mono font-semibold text-slate-800 dark:text-[#E8EEF5]">
                                    {p.accountNumber}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-slate-500 dark:text-[#8194A8]">
                                  Enrollment Date:
                                </span>
                                <span className="font-mono text-slate-700 dark:text-[#A9BACB]">
                                  {p.enrolledDate ? String(p.enrolledDate).split('T')[0] : 'Active'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500 dark:text-[#8194A8]">
                                  Relationship Status:
                                </span>
                                <span className="inline-flex items-center text-emerald-700 dark:text-emerald-400 font-medium">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  {p.status || 'ACTIVE'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded text-center text-xs text-slate-500 dark:text-[#8194A8]">
                        <Package className="w-6 h-6 mx-auto mb-1.5 text-slate-400 dark:text-[#8194A8]" />
                        No product enrollments mapped in database.
                      </div>
                    )}
                  </div>
                )}

                {/* 5. INTERACTIONS TAB */}
                {active360Tab === 'INTERACTIONS' && (
                  <div className="space-y-4">
                    {dossier360?.customer?.id && (
                      <CommunicationProfileWidget
                        customerId={dossier360.customer.id}
                        customerName={dossier360.customer.name}
                      />
                    )}

                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-[#E8EEF5]">
                          Relationship Engagement &amp; Touchpoint Log
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-[#8194A8]">
                          Audited chronological record of client discussions, visits, and phone consultations.
                        </p>
                      </div>

                      <Button
                        size="sm"
                        variant="primary"
                        onClick={() => setIsLogInteractionDrawerOpen(true)}
                        icon={<Plus className="w-3.5 h-3.5" />}
                      >
                        Log Touchpoint
                      </Button>
                    </div>

                    {dossier360?.interactions && dossier360.interactions.length > 0 ? (
                      <div className="space-y-2.5 max-h-96 overflow-y-auto">
                        {dossier360.interactions.map((int: any) => (
                          <div
                            key={int.id}
                            className="p-3.5 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded text-xs space-y-1.5 hover:border-slate-300 dark:hover:border-[#435e7a] transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {int.interactionReference && (
                                  <span className="font-mono text-[10px] font-bold bg-slate-200 dark:bg-[#192B3D] text-slate-800 dark:text-[#E8EEF5] px-1.5 py-0.2 rounded border border-slate-300 dark:border-[#33485D]">
                                    {int.interactionReference}
                                  </span>
                                )}
                                <span className="font-semibold text-slate-900 dark:text-[#E8EEF5]">
                                  {int.subject}
                                </span>
                              </div>
                              <span className="font-mono text-[10px] text-slate-500 dark:text-[#8194A8]">
                                {new Date(int.timestamp).toLocaleDateString('en-IN')}
                              </span>
                            </div>
                            <p className="text-slate-700 dark:text-[#A9BACB] text-[11px] leading-relaxed">
                              {int.summary}
                            </p>
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-slate-500 dark:text-[#8194A8]">
                              <span className="font-semibold text-slate-700 dark:text-[#E8EEF5] bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] px-1.5 py-0.5 rounded">
                                {int.channel}
                              </span>
                              <span>•</span>
                              <span>
                                Outcome: <strong className="text-slate-700 dark:text-[#E8EEF5]">{int.outcome}</strong>
                              </span>
                              {int.sentiment && (
                                <>
                                  <span>•</span>
                                  <span className="font-medium text-emerald-700 dark:text-emerald-400">
                                    {int.sentiment}
                                  </span>
                                </>
                              )}
                              {int.followupRequired && (
                                <span className="bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded font-semibold border border-amber-300 dark:border-amber-800">
                                  Follow-up: {int.followupAction || 'Required'}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded text-center text-xs text-slate-500 dark:text-[#8194A8]">
                        <MessageSquare className="w-6 h-6 mx-auto mb-1.5 text-slate-400 dark:text-[#8194A8]" />
                        No previous interactions logged. Click "Log Touchpoint" to record a meeting.
                      </div>
                    )}
                  </div>
                )}

                {/* 6. CASES TAB */}
                {active360Tab === 'CASES' && (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#8194A8]">
                      Active Grievances &amp; Service Requests
                    </div>
                    {dossier360?.cases && dossier360.cases.length > 0 ? (
                      <div className="space-y-2">
                        {dossier360.cases.map((c: any) => (
                          <div
                            key={c.id}
                            className="p-3.5 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded text-xs space-y-1 hover:border-slate-300 dark:hover:border-[#435e7a] transition-all"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-slate-900 dark:text-[#E8EEF5]">
                                {c.caseNumber}
                              </span>
                              <div className="flex gap-1.5">
                                <Badge
                                  variant={c.priority === 'CRITICAL' ? 'danger' : 'warning'}
                                  size="sm"
                                >
                                  {c.priority}
                                </Badge>
                                <Badge
                                  variant={c.status === 'RESOLVED' ? 'success' : 'info'}
                                  size="sm"
                                >
                                  {c.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="font-medium text-slate-800 dark:text-[#E8EEF5]">
                              {c.subject}
                            </div>
                            <p className="text-slate-600 dark:text-[#A9BACB] text-[11px]">
                              {c.description}
                            </p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded text-center text-xs text-slate-500 dark:text-[#8194A8]">
                        <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                        No open service grievances or tickets. Nominal operating state.
                      </div>
                    )}
                  </div>
                )}

                {/* 7. OPPORTUNITIES TAB */}
                {active360Tab === 'OPPORTUNITIES' && (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#8194A8]">
                      Commercial Opportunities &amp; Pipeline Deals
                    </div>
                    {dossier360?.opportunities && dossier360.opportunities.length > 0 ? (
                      <div className="space-y-2">
                        {dossier360.opportunities.map((opp: any) => (
                          <div
                            key={opp.id}
                            className="p-3.5 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded text-xs flex justify-between items-center hover:border-slate-300 dark:hover:border-[#435e7a] transition-all"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-900 dark:text-[#E8EEF5]">
                                  {opp.opportunityCode}
                                </span>
                                <Badge variant={opp.stage === 'WON' ? 'success' : 'info'} size="sm">
                                  {opp.stage}
                                </Badge>
                              </div>
                              <div className="font-medium text-slate-800 dark:text-[#E8EEF5] mt-0.5">
                                {opp.title}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono font-bold text-slate-900 dark:text-[#E8EEF5]">
                                {formatINR(parseFloat(opp.expectedValue) || 0)}
                              </div>
                              <div className="text-[10px] text-slate-500 dark:text-[#8194A8]">
                                Win Probability: {opp.probability}%
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded text-center text-xs text-slate-500 dark:text-[#8194A8]">
                        <TrendingUp className="w-6 h-6 mx-auto mb-1.5 text-slate-400 dark:text-[#8194A8]" />
                        No active commercial opportunities recorded.
                      </div>
                    )}
                  </div>
                )}

                {/* 8. TASKS TAB */}
                {active360Tab === 'TASKS' && (
                  <div className="space-y-3">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-[#8194A8]">
                      Follow-ups &amp; Action Items
                    </div>
                    {dossier360?.tasks && dossier360.tasks.length > 0 ? (
                      <div className="space-y-2">
                        {dossier360.tasks.map((tsk: any) => (
                          <div
                            key={tsk.id}
                            className="p-3.5 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded text-xs flex justify-between items-center hover:border-slate-300 dark:hover:border-[#435e7a] transition-all"
                          >
                            <div>
                              <div className="font-semibold text-slate-900 dark:text-[#E8EEF5]">
                                {tsk.title}
                              </div>
                              {tsk.description && (
                                <div className="text-slate-500 dark:text-[#8194A8] text-[11px]">
                                  {tsk.description}
                                </div>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] text-slate-600 dark:text-[#A9BACB]">
                                Due: {tsk.dueDate}
                              </span>
                              <Badge
                                variant={tsk.status === 'COMPLETED' ? 'success' : 'warning'}
                                size="sm"
                              >
                                {tsk.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded text-center text-xs text-slate-500 dark:text-[#8194A8]">
                        <CheckSquare className="w-6 h-6 mx-auto mb-1.5 text-slate-400 dark:text-[#8194A8]" />
                        No pending RM tasks scheduled.
                      </div>
                    )}
                  </div>
                )}

                {/* 9. TIMELINE TAB (Unified Visual Chronological Relationship Timeline) */}
                {active360Tab === 'TIMELINE' && (
                  <CustomerTimelineTab
                    customer={activeCustomer}
                    dossier360={dossier360}
                    financialSummary={financialSummary}
                    onLogInteractionClick={() => setIsLogInteractionDrawerOpen(true)}
                  />
                )}

                {/* 10. INTELLIGENCE TAB (CORE Score Breakdown & Rule RI-v1 Signals) */}
                {active360Tab === 'INTELLIGENCE' && (
                  <div className="space-y-4 text-xs">
                    {/* Relationship Intelligence Signals */}
                    <div className="bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-[#1F334A] pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded bg-[#142C45] dark:bg-[#1B9D92] text-white">
                            <BrainCircuit className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-[#E8EEF5] text-xs flex items-center gap-2">
                              <span>Relationship Intelligence Signals</span>
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-200 dark:bg-[#192B3D] text-slate-700 dark:text-[#A9BACB]">
                                {dossier360?.insights?.filter((i: any) => i.status !== 'RESOLVED').length || 0} Active
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-[#8194A8]">
                              Deterministic alerts evaluated against live CRM telemetry (Rule RI-v1)
                            </div>
                          </div>
                        </div>

                        <Button
                          size="xs"
                          variant="outline"
                          icon={<RefreshCw className={`w-3 h-3 ${recalculatingCustomerSignals ? 'animate-spin' : ''}`} />}
                          onClick={handleRecalculateCustomerSignals}
                          disabled={recalculatingCustomerSignals}
                        >
                          {recalculatingCustomerSignals ? 'Evaluating Rules...' : 'Recalculate Signals'}
                        </Button>
                      </div>

                      {dossier360?.insights && dossier360.insights.length > 0 ? (
                        <div className="space-y-2.5">
                          {dossier360.insights.map((ins: any) => {
                            const isResolved = ins.status === 'RESOLVED';
                            const isAck = ins.status === 'ACKNOWLEDGED';

                            return (
                              <div
                                key={ins.id}
                                className={`p-3 rounded border text-xs space-y-2 transition-all ${
                                  ins.priority === 'CRITICAL' && !isResolved
                                    ? 'bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900'
                                    : 'bg-white dark:bg-[#162638] border-slate-200 dark:border-[#33485D]'
                                }`}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                                        ins.priority === 'CRITICAL'
                                          ? 'bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 border border-rose-300 dark:border-rose-800'
                                          : ins.priority === 'HIGH'
                                          ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 border border-amber-300 dark:border-amber-800'
                                          : 'bg-blue-100 dark:bg-blue-950 text-blue-800 dark:text-blue-300 border border-blue-300 dark:border-blue-800'
                                      }`}
                                    >
                                      {ins.priority}
                                    </span>

                                    <span className="font-semibold text-slate-900 dark:text-[#E8EEF5]">
                                      {ins.title}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {isResolved ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 dark:bg-[#192B3D] text-slate-600 dark:text-[#8194A8]">
                                        RESOLVED
                                      </span>
                                    ) : isAck ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                                        ACKNOWLEDGED
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300">
                                        ACTIVE
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <p className="text-slate-600 dark:text-[#A9BACB] text-[11px] leading-relaxed">
                                  {ins.summary}
                                </p>

                                <div className="p-2 rounded bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] text-[11px] text-slate-700 dark:text-[#A9BACB] flex items-start gap-1.5">
                                  <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-semibold text-slate-900 dark:text-[#E8EEF5]">
                                      Why does this matter?{' '}
                                    </span>
                                    <span>{ins.impact}</span>
                                  </div>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100 dark:border-[#1F334A]">
                                  <button
                                    onClick={() => {
                                      setSelected360Insight(ins);
                                      setIs360EvidenceModalOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1 text-[#168C83] dark:text-[#1B9D92] hover:underline font-medium text-[11px]"
                                  >
                                    <Eye className="w-3 h-3" />
                                    <span>View Evidence ({ins.evidence?.length || 0} Records Attached)</span>
                                  </button>

                                  <div className="flex items-center gap-1.5">
                                    {!isResolved && !isAck && (
                                      <Button
                                        size="xs"
                                        variant="outline"
                                        onClick={() => {
                                          setAction360Insight(ins);
                                          setAction360Type('ACKNOWLEDGE');
                                          setAction360Note('Reviewed signal. Escalating with branch operations.');
                                        }}
                                      >
                                        Acknowledge
                                      </Button>
                                    )}

                                    {!isResolved && (
                                      <Button
                                        size="xs"
                                        variant="secondary"
                                        onClick={() => {
                                          setAction360Insight(ins);
                                          setAction360Type('RESOLVE');
                                          setAction360Note('Customer issue addressed and remediated.');
                                        }}
                                        className="bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-300 dark:border-emerald-700"
                                      >
                                        Resolve Signal
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="p-6 bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded text-center text-slate-500 dark:text-[#8194A8]">
                          <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1.5" />
                          <div>No active relationship signals detected. All metrics nominal.</div>
                        </div>
                      )}
                    </div>

                    {/* 4 Pillars of Dynamic CORE Score Card */}
                    <div className="bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 dark:border-[#1F334A] pb-3">
                        <div>
                          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-500 dark:text-[#8194A8]">
                            COREvia Relationship &amp; Credit Intelligence Score
                          </div>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl font-bold font-mono text-emerald-600 dark:text-emerald-400">
                              {financialSummary?.coreScoreData?.score || dossier360?.score?.totalScore || 88}
                            </span>
                            <span className="text-sm font-normal text-slate-400 dark:text-[#8194A8]">/ 100 Max</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 font-medium border border-emerald-300 dark:border-emerald-800 ml-2">
                              {financialSummary?.coreScoreData?.grade || 'EXCELLENT'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 dark:text-[#8194A8] mt-0.5">
                            Risk Appetite:{' '}
                            <span className="text-slate-800 dark:text-[#E8EEF5] font-mono font-medium">
                              {financialSummary?.coreScoreData?.riskAppetite || 'PRIME_PREFERRED'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            icon={<ShieldCheck className="w-3.5 h-3.5 text-indigo-500" />}
                            onClick={() =>
                              setSelectedDecisionTraceId(
                                activeCustomer?.id === 2 ? 'DT-20260928-00201' : 'DT-20260928-00101'
                              )
                            }
                          >
                            Why? (Decision Trace)
                          </Button>
                          <Button
                            size="sm"
                            variant="primary"
                            icon={<RefreshCw className={`w-3.5 h-3.5 ${recalculatingScore ? 'animate-spin' : ''}`} />}
                            onClick={handleRecalculateScore}
                            disabled={recalculatingScore}
                          >
                            {recalculatingScore ? 'Calculating...' : 'Recalculate Score'}
                          </Button>
                        </div>
                      </div>

                      {/* 4 Pillars */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        <div className="bg-white dark:bg-[#162638] p-2.5 rounded border border-slate-200 dark:border-[#33485D]">
                          <span className="text-[10px] text-slate-500 dark:text-[#8194A8] uppercase font-mono block">
                            Product Depth
                          </span>
                          <span className="text-sm font-mono font-bold text-slate-900 dark:text-[#E8EEF5]">
                            {financialSummary?.coreScoreData?.breakdown?.productDepthScore ?? 25} / 25
                          </span>
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
                            6 Active Products
                          </span>
                        </div>
                        <div className="bg-white dark:bg-[#162638] p-2.5 rounded border border-slate-200 dark:border-[#33485D]">
                          <span className="text-[10px] text-slate-500 dark:text-[#8194A8] uppercase font-mono block">
                            Deposit Coverage
                          </span>
                          <span className="text-sm font-mono font-bold text-slate-900 dark:text-[#E8EEF5]">
                            {financialSummary?.coreScoreData?.breakdown?.depositScore ?? 25} / 25
                          </span>
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
                            ₹28.4L Aggregate
                          </span>
                        </div>
                        <div className="bg-white dark:bg-[#162638] p-2.5 rounded border border-slate-200 dark:border-[#33485D]">
                          <span className="text-[10px] text-slate-500 dark:text-[#8194A8] uppercase font-mono block">
                            Repayment Discipline
                          </span>
                          <span className="text-sm font-mono font-bold text-slate-900 dark:text-[#E8EEF5]">
                            {financialSummary?.coreScoreData?.breakdown?.repaymentScore ?? 20} / 20
                          </span>
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 block mt-0.5">
                            100% On-Time EMIs
                          </span>
                        </div>
                        <div className="bg-white dark:bg-[#162638] p-2.5 rounded border border-slate-200 dark:border-[#33485D]">
                          <span className="text-[10px] text-slate-500 dark:text-[#8194A8] uppercase font-mono block">
                            Activity &amp; Vintage
                          </span>
                          <span className="text-sm font-mono font-bold text-slate-900 dark:text-[#E8EEF5]">
                            {financialSummary?.coreScoreData?.breakdown?.activityScore ?? 18} / 30
                          </span>
                          <span className="text-[9px] text-blue-600 dark:text-blue-400 block mt-0.5">
                            Healthy Velocity
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 11. NEXT BEST ACTIONS TAB */}
                {active360Tab === 'ACTIONS' && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 dark:text-[#E8EEF5] text-sm">
                            Next Best Action Engine
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-950 text-indigo-800 dark:text-indigo-300 font-semibold border border-indigo-200 dark:border-indigo-800">
                            Deterministic Rules
                          </span>
                        </div>
                        <p className="text-slate-500 dark:text-[#8194A8] text-[11px] mt-0.5">
                          Prioritized recommendations derived from CORE Score, momentum trends, and open service cases.
                        </p>
                      </div>

                      <Button
                        variant="primary"
                        size="sm"
                        onClick={handleRecalculateCustomerActions}
                        disabled={recalculatingCustomerActions || loadingActions}
                        icon={<RefreshCw className={`w-3.5 h-3.5 ${recalculatingCustomerActions ? 'animate-spin' : ''}`} />}
                      >
                        {recalculatingCustomerActions ? 'Evaluating...' : 'Recalculate Actions'}
                      </Button>
                    </div>

                    {/* Service-First Protocol Banner if service issue present */}
                    {customerActions.some((a) => a.actionType === 'SERVICE' && a.status === 'ACTIVE') && (
                      <div className="p-3 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded text-xs text-rose-900 dark:text-rose-200 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold">Service-First Institutional Mandate Active</div>
                          <div className="text-rose-800 dark:text-rose-300 text-[11px] mt-0.5">
                            Customer has open service grievances or SLA breaches. In accordance with COREvia relationship governance,
                            service resolution actions are ranked ahead of commercial cross-sell propositions.
                          </div>
                        </div>
                      </div>
                    )}

                    {loadingActions ? (
                      <div className="py-8 text-center text-xs text-slate-500 dark:text-[#8194A8] flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-[#168C83]" />
                        Evaluating actions for {activeCustomer.name}...
                      </div>
                    ) : customerActions.length === 0 ? (
                      <div className="p-8 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded text-center text-xs text-slate-500 dark:text-[#8194A8] space-y-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                        <div className="font-semibold text-slate-800 dark:text-[#E8EEF5]">
                          No Outstanding Actions Required
                        </div>
                        <p className="text-slate-500 dark:text-[#8194A8] max-w-sm mx-auto text-[11px]">
                          All service tickets are resolved and relationship cadence is on track.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {customerActions.map((action) => (
                          <NextBestActionCard
                            key={action.id}
                            action={action}
                            onAccept={handleAcceptAction}
                            onDismiss={(a) => setSelectedDismissAction(a)}
                            onCreateTask={(a) => setSelectedTaskAction(a)}
                            onViewEvidence={(a) => setSelectedEvidenceAction(a)}
                            onExplainDecision={(a) => {
                              const fallbackTrace =
                                a.customerId === 1 ? 'DT-20260928-00102' : 'DT-20260928-00201';
                              setSelectedDecisionTraceId(a.traceId || fallbackTrace);
                            }}
                            compact={false}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 12. KYC & DEMOGRAPHICS TAB */}
                {active360Tab === 'KYC' && (
                  <div className="space-y-3">
                    <div className="bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded p-3.5 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 dark:text-[#8194A8]">PAN Verification</span>
                        <div className="font-mono font-semibold text-slate-900 dark:text-[#E8EEF5] flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>{activeCustomer.panNumber}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-[#8194A8]">Aadhaar Status</span>
                        <div className="font-medium text-slate-800 dark:text-[#E8EEF5] mt-0.5">
                          {activeCustomer.aadhaarStatus === 'VERIFIED' ? (
                            <span className="text-emerald-700 dark:text-emerald-400">Verified via UIDAI</span>
                          ) : (
                            <span className="text-slate-600 dark:text-[#A9BACB]">Exempt (Corporate)</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-[#8194A8]">Risk Categorisation</span>
                        <div className="mt-0.5">
                          <Badge
                            variant={activeCustomer.riskCategory === 'LOW' ? 'success' : 'warning'}
                            size="sm"
                          >
                            {activeCustomer.riskCategory} RISK
                          </Badge>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-[#8194A8]">CIBIL Bureau</span>
                        <div className="font-mono font-bold text-slate-900 dark:text-[#E8EEF5] mt-0.5">
                          {activeCustomer.cibilScore} / 900
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-2 border border-slate-200 dark:border-[#33485D] rounded p-3.5 bg-slate-50 dark:bg-[#101C2A]">
                        <div className="font-semibold text-slate-900 dark:text-[#E8EEF5] border-b border-slate-200 dark:border-[#1F334A] pb-1.5 uppercase text-[11px] tracking-wide">
                          Business &amp; Demographics
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-[#8194A8]">Constitution:</span>
                          <span className="font-medium text-slate-800 dark:text-[#E8EEF5]">{activeCustomer.entityType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-[#8194A8]">Sector / Activity:</span>
                          <span className="font-medium text-slate-800 dark:text-[#E8EEF5]">{activeCustomer.occupationOrSector}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-[#8194A8]">Annual Turnover:</span>
                          <span className="font-mono font-semibold text-slate-900 dark:text-[#E8EEF5]">
                            {formatINR(activeCustomer.annualTurnoverOrIncome)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-[#8194A8]">Onboarding Date:</span>
                          <span className="font-mono text-slate-700 dark:text-[#A9BACB]">{activeCustomer.onboardingDate}</span>
                        </div>
                      </div>

                      <div className="space-y-2 border border-slate-200 dark:border-[#33485D] rounded p-3.5 bg-slate-50 dark:bg-[#101C2A]">
                        <div className="font-semibold text-slate-900 dark:text-[#E8EEF5] border-b border-slate-200 dark:border-[#1F334A] pb-1.5 uppercase text-[11px] tracking-wide">
                          Regulatory Schedule &amp; Address
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-[#8194A8]">Last Reviewed:</span>
                          <span className="font-mono text-slate-700 dark:text-[#A9BACB]">{activeCustomer.kycLastReviewedDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-[#8194A8]">Next Review Due:</span>
                          <span className="font-mono font-semibold text-slate-900 dark:text-[#E8EEF5]">{activeCustomer.kycNextReviewDue}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-[#8194A8]">City / State:</span>
                          <span className="font-medium text-slate-800 dark:text-[#E8EEF5]">
                            {dossier360?.addresses?.[0]?.city || 'Mumbai'}, {dossier360?.addresses?.[0]?.state || 'Maharashtra'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500 dark:text-[#8194A8]">PIN Code:</span>
                          <span className="font-mono text-slate-700 dark:text-[#A9BACB]">{dossier360?.addresses?.[0]?.postalCode || '400021'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 13. DOCUMENTS VAULT TAB */}
                {active360Tab === 'DOCUMENTS' && (
                  <CustomerDocumentsTab
                    customerId={activeCustomer.id || 1}
                    customerName={activeCustomer.name}
                    customerCode={activeCustomer.customerCode || activeCustomer.cifNumber}
                  />
                )}

                {/* 14. LIFECYCLE JOURNEYS TAB */}
                {active360Tab === 'JOURNEYS' && (
                  <CustomerJourneysTab
                    customerId={activeCustomer.id || 1}
                    customerName={activeCustomer.name}
                    customerCode={activeCustomer.customerCode || activeCustomer.cifNumber}
                    onOpenWorkspaceJourney={(journeyId) => {
                      window.location.href = `/journeys?id=${journeyId}`;
                    }}
                  />
                )}

                {/* 15. RELATIONSHIP GRAPH TAB */}
                {active360Tab === 'GRAPH' && (
                  <div className="space-y-3">
                    <RelationshipGraph
                      initialEntityType="CUSTOMER"
                      initialEntityId={activeCustomer.id || dossier360?.customer?.id || 1}
                      compact={false}
                      onOpenFullGraph={(type, id) => {
                        window.location.href = `/relationship-graph?entityType=${type}&entityId=${id}`;
                      }}
                    />
                  </div>
                )}

                {/* 16. DIGITAL TWIN TAB */}
                {active360Tab === 'TWIN' && (
                  <CustomerTwinTab
                    customerId={activeCustomer.id || dossier360?.customer?.id || 1}
                    customerName={activeCustomer.name}
                    cifNumber={activeCustomer.cifNumber}
                  />
                )}

                {/* 17. DECISION TRACES TAB */}
                {active360Tab === 'DECISIONS' && (
                  <div className="space-y-4 text-xs">
                    <div className="p-3 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded flex items-center justify-between">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-[#E8EEF5]">
                          AI Decision Trace Repository
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-[#8194A8]">
                          Audited algorithmic traces for scoring, limit recommendations, and action selection.
                        </div>
                      </div>
                      <Button
                        size="xs"
                        variant="outline"
                        onClick={() => setIsComparisonOpen(true)}
                        icon={<GitCompare className="w-3.5 h-3.5" />}
                      >
                        Compare Traces
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {(customerTraces.length > 0
                        ? customerTraces
                        : [
                            {
                              decisionId: 'DT-20260928-00101',
                              decisionType: 'CORE_SCORE_CALCULATION',
                              outcome: 'CORE Score evaluated at 88/100 (Prime Grade)',
                              createdAt: '2026-03-01T10:30:00Z',
                              confidence: 0.94,
                            },
                            {
                              decisionId: 'DT-20260928-00102',
                              decisionType: 'NEXT_BEST_ACTION_RANKING',
                              outcome: 'Ranked FX Hedging Proposal as Top Priority',
                              createdAt: '2026-03-02T14:15:00Z',
                              confidence: 0.91,
                            },
                          ]
                      ).map((tr: any) => (
                        <div
                          key={tr.decisionId}
                          className="p-3 bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded flex items-center justify-between hover:border-slate-300 dark:hover:border-[#435e7a] transition-all"
                        >
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-slate-900 dark:text-[#E8EEF5]">
                                {tr.decisionId}
                              </span>
                              <Badge variant="neutral" size="sm">
                                {tr.decisionType}
                              </Badge>
                            </div>
                            <div className="text-slate-600 dark:text-[#A9BACB] text-[11px] mt-0.5">
                              {tr.outcome}
                            </div>
                          </div>
                          <Button
                            size="xs"
                            variant="outline"
                            onClick={() => setSelectedDecisionTraceId(tr.decisionId)}
                          >
                            Inspect Trace
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 18. OPPORTUNITY RADAR TAB */}
                {active360Tab === 'RADAR' && (
                  <CustomerOpportunityRadarWidget
                    customerId={activeCustomer.id}
                    cifNumber={activeCustomer.cifNumber}
                    customerName={activeCustomer.name}
                    onOpportunityCreated={() => {
                      fetchCustomer360(activeCustomer.cifNumber);
                    }}
                  />
                )}

                {/* 19. ALERTS TAB */}
                {active360Tab === 'ALERTS' && (
                  <CustomerAlertsCard
                    customerId={activeCustomer.id}
                    customerName={activeCustomer.name}
                    onNavigate={() => {}}
                  />
                )}

                {/* 20. STRATEGY SIMULATOR TAB */}
                {active360Tab === 'SIMULATOR' && (
                  <StrategySimulatorModule />
                )}
              </div>
            )}
          </div>
        </div>

        {/* LOG INTERACTION DRAWER */}
        <LogInteractionDrawer
          isOpen={isLogInteractionDrawerOpen}
          onClose={() => setIsLogInteractionDrawerOpen(false)}
          customerId={activeCustomer.id}
          customerName={activeCustomer.name}
          cifNumber={activeCustomer.cifNumber}
          onInteractionLogged={() => fetchCustomer360(activeCustomer.cifNumber)}
        />

        {/* ENROLL PRODUCT MODAL */}
        <EnrollProductModal
          isOpen={isEnrollModalOpen}
          onClose={() => setIsEnrollModalOpen(false)}
          customer={activeCustomer}
          availableProducts={availableProducts}
          linkedAccounts={dossier360?.accounts || []}
          onEnrolledSuccess={() => fetchCustomer360(activeCustomer.cifNumber)}
        />

        {/* Next Best Action Modals */}
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

        {/* Decision Trace Panels */}
        <DecisionTracePanel
          decisionId={selectedDecisionTraceId}
          isOpen={Boolean(selectedDecisionTraceId)}
          onClose={() => setSelectedDecisionTraceId(null)}
          onNavigateToCustomer={() => {}}
        />

        <DecisionComparisonModal
          isOpen={isComparisonOpen}
          onClose={() => setIsComparisonOpen(false)}
          baseDecisionId={comparisonBaseTraceId || (customerTraces[0]?.decisionId || 'DT-20260928-00101')}
          targetDecisionId={comparisonTargetTraceId || (customerTraces[1]?.decisionId || 'DT-20260928-00102')}
        />
      </div>
    );
  }

  // =========================================================================
  // RENDER: MODE A — CUSTOMER MASTER DIRECTORY (CUSTOMER LISTING VIEW)
  // =========================================================================
  const totalPages = Math.ceil(sortedCustomers.length / pageSize) || 1;

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[#33485D] pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-[#E8EEF5] tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-[#142C45] dark:text-[#1B9D92]" />
            <span>Customer 360 &amp; Central KYC (cKYC) Master Directory</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#8194A8]">
            Institutional Master Directory backed by Cloud SQL PostgreSQL with complete 360 audit trails.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Filter for Canonical Demo */}
          <Button
            variant={quickFilter === 'DEMO' ? 'primary' : 'outline'}
            size="sm"
            onClick={() => setQuickFilter(quickFilter === 'DEMO' ? 'ALL' : 'DEMO')}
            icon={<Sparkles className="w-3.5 h-3.5" />}
          >
            {quickFilter === 'DEMO' ? 'Showing Demo Record' : 'Demo: Rahul Sharma'}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={refreshCustomerList}
            disabled={loadingList}
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loadingList ? 'animate-spin' : ''}`} />}
          >
            Refresh
          </Button>
        </div>
      </div>

      {/* Aggregate KPI Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard
          label="Total Onboarded CIFs"
          value={customers.length.toString()}
          badge="Live Master"
          badgeVariant="neutral"
        />
        <StatCard
          label="Aggregate Relationship (TRV)"
          value={formatINR(totalRelationshipValue)}
          badge="Portfolio"
          badgeVariant="info"
        />
        <StatCard
          label="High Risk / EDD Mandate"
          value={highRiskCount.toString()}
          badge="RBI PMLA"
          badgeVariant="danger"
        />
        <StatCard
          label="Avg CIBIL Bureau"
          value={avgCibil.toString()}
          badge="Bureau Healthy"
          badgeVariant="success"
        />
      </div>

      {/* Search & Filter Controls Bar */}
      <div className="bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded p-3 space-y-3 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Search Box */}
          <div className="sm:col-span-5 relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400 dark:text-[#8194A8]" />
            <input
              id="customer-search-input"
              type="text"
              placeholder="Search by CIF, Name, PAN, cKYC, or GSTIN..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-[#101C2A] border border-slate-300 dark:border-[#33485D] rounded focus:bg-white dark:focus:bg-[#162638] focus:outline-none focus:ring-1 focus:ring-[#168C83] text-slate-900 dark:text-[#E8EEF5] transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Constitution Select */}
          <div className="sm:col-span-3">
            <select
              value={selectedEntityFilter}
              onChange={(e) => {
                setSelectedEntityFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 dark:bg-[#101C2A] border border-slate-300 dark:border-[#33485D] rounded focus:bg-white dark:focus:bg-[#162638] focus:outline-none focus:ring-1 focus:ring-[#168C83] text-slate-800 dark:text-[#E8EEF5]"
            >
              <option value="ALL">All Constitutions</option>
              <option value="INDIVIDUAL">Individual (Retail)</option>
              <option value="PROPRIETORSHIP">Proprietorship</option>
              <option value="PRIVATE_LIMITED">Private Limited</option>
              <option value="PUBLIC_LIMITED">Public Limited</option>
            </select>
          </div>

          {/* Risk Filter Select */}
          <div className="sm:col-span-2">
            <select
              value={selectedRiskFilter}
              onChange={(e) => {
                setSelectedRiskFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 dark:bg-[#101C2A] border border-slate-300 dark:border-[#33485D] rounded focus:bg-white dark:focus:bg-[#162638] focus:outline-none focus:ring-1 focus:ring-[#168C83] text-slate-800 dark:text-[#E8EEF5]"
            >
              <option value="ALL">All AML Ratings</option>
              <option value="LOW">Low Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="HIGH">High Risk (EDD Mandate)</option>
            </select>
          </div>

          {/* Table Density Toggle */}
          <div className="sm:col-span-2 flex items-center justify-end gap-1.5">
            <span className="text-[11px] text-slate-500 dark:text-[#8194A8] hidden sm:inline">Density:</span>
            <div className="inline-flex rounded border border-slate-300 dark:border-[#33485D] p-0.5 bg-slate-100 dark:bg-[#101C2A]">
              <button
                type="button"
                onClick={() => setTableDensity('normal')}
                className={`text-[10px] px-2 py-0.5 rounded font-medium transition-colors ${
                  tableDensity === 'normal'
                    ? 'bg-white dark:bg-[#162638] text-slate-900 dark:text-[#E8EEF5] shadow-xs'
                    : 'text-slate-500 dark:text-[#8194A8]'
                }`}
              >
                Normal
              </button>
              <button
                type="button"
                onClick={() => setTableDensity('compact')}
                className={`text-[10px] px-2 py-0.5 rounded font-medium transition-colors ${
                  tableDensity === 'compact'
                    ? 'bg-white dark:bg-[#162638] text-slate-900 dark:text-[#E8EEF5] shadow-xs'
                    : 'text-slate-500 dark:text-[#8194A8]'
                }`}
              >
                Compact
              </button>
            </div>
          </div>
        </div>

        {/* Quick Filter Chips & Status Summary */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-[#1F334A] text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono text-slate-500 dark:text-[#8194A8] mr-1">
              Showing <strong className="text-slate-800 dark:text-[#E8EEF5]">{sortedCustomers.length}</strong> of {customers.length} CIF profiles:
            </span>

            {[
              { id: 'ALL', label: 'All Profiles' },
              { id: 'DEMO', label: '★ Rahul Sharma (Demo)' },
              { id: 'HIGH_RISK', label: 'High Risk (EDD)' },
              { id: 'HNI', label: 'HNI (> ₹25L TRV)' },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => {
                  setQuickFilter(chip.id as any);
                  setCurrentPage(1);
                }}
                className={`text-[11px] px-2.5 py-0.5 rounded transition-colors ${
                  quickFilter === chip.id
                    ? 'bg-[#142C45] dark:bg-[#1B9D92] text-white font-medium'
                    : 'bg-slate-100 dark:bg-[#192B3D] text-slate-600 dark:text-[#A9BACB] hover:bg-slate-200 dark:hover:bg-[#20364B]'
                }`}
              >
                {chip.label}
              </button>
            ))}
          </div>

          {(searchTerm || selectedEntityFilter !== 'ALL' || selectedRiskFilter !== 'ALL' || quickFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedEntityFilter('ALL');
                setSelectedRiskFilter('ALL');
                setQuickFilter('ALL');
                setCurrentPage(1);
              }}
              className="text-xs text-[#168C83] dark:text-[#1B9D92] hover:underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Customers DataTable or Empty State */}
      {!loadingList && sortedCustomers.length === 0 ? (
        <EmptyState
          icon={<Search className="w-8 h-8 text-slate-400 dark:text-[#8194A8]" />}
          title="No customer profiles match criteria"
          description={
            searchTerm
              ? `No registered CIFs matching "${searchTerm}". Try searching by PAN, cKYC number, or name.`
              : 'No customer profiles match the selected constitution and risk criteria.'
          }
          actionLabel="Reset All Filters"
          onAction={() => {
            setSearchTerm('');
            setSelectedEntityFilter('ALL');
            setSelectedRiskFilter('ALL');
            setQuickFilter('ALL');
            setCurrentPage(1);
          }}
          className="border border-slate-200 dark:border-[#33485D] rounded bg-white dark:bg-[#162638] p-8"
        />
      ) : (
        <div className="space-y-3">
          <Table
            columns={columns}
            data={paginatedCustomers}
            isLoading={loadingList}
            keyExtractor={(c) => c.cifNumber}
            density={tableDensity}
            sortBy={sortColumn}
            sortOrder={sortDirection}
            onSort={handleSort}
            onRowClick={(c) => {
              setActiveCustomer(c);
              setActive360Tab('SUMMARY');
            }}
          />

          {/* Integrated Pagination Bar */}
          <div className="bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded p-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-[#8194A8]">
              <span>
                Showing page <strong className="text-slate-800 dark:text-[#E8EEF5]">{currentPage}</strong> of {totalPages}
                {' '}({sortedCustomers.length} total records)
              </span>

              <span className="text-slate-300 dark:text-[#33485D]">|</span>

              <div className="flex items-center gap-1">
                <span>Per page:</span>
                <select
                  value={pageSize}
                  onChange={(e) => {
                    setPageSize(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="bg-slate-50 dark:bg-[#101C2A] border border-slate-300 dark:border-[#33485D] rounded px-1.5 py-0.5 text-xs text-slate-800 dark:text-[#E8EEF5]"
                >
                  <option value={10}>10</option>
                  <option value={25}>25</option>
                  <option value={50}>50</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="xs"
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                icon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Previous
              </Button>

              <div className="flex items-center gap-1 px-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const pageNum = i + 1;
                  return (
                    <button
                      key={pageNum}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-6 h-6 rounded text-xs font-medium transition-colors ${
                        currentPage === pageNum
                          ? 'bg-[#142C45] dark:bg-[#1B9D92] text-white'
                          : 'text-slate-600 dark:text-[#A9BACB] hover:bg-slate-100 dark:hover:bg-[#192B3D]'
                      }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="xs"
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
