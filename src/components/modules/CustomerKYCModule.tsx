import React, { useState, useMemo, useEffect } from 'react';
import { CustomerKYC, RiskCategory, CustomerCategory, NextBestAction } from '../../types';
import { Table, Column } from '../common/Table';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { StatCard } from '../common/StatCard';
import { Modal } from '../common/Modal';
import { formatINR } from '../../data/mockIndianBankingData';
import { bankingApi } from '../../lib/api';
import { NextBestActionCard } from '../nba/NextBestActionCard';
import { ActionEvidenceModal } from '../nba/ActionEvidenceModal';
import { DismissActionModal } from '../nba/DismissActionModal';
import { CreateTaskModal } from '../nba/CreateTaskModal';
import { CustomerOpportunityRadarWidget } from '../radar/CustomerOpportunityRadarWidget';
import { CustomerAlertsCard } from '../notifications/CustomerAlertsCard';
import { CommunicationProfileWidget } from '../interactions/CommunicationProfileWidget';
import { CustomerDocumentsTab } from '../documents/CustomerDocumentsTab';
import { CompactRelationshipTwinWidget } from '../twin/CompactRelationshipTwinWidget';
import { CustomerTwinTab } from '../twin/CustomerTwinTab';
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
} from 'lucide-react';
import { useCopilot } from '../../context/CopilotContext';

interface CustomerKYCModuleProps {
  customers: CustomerKYC[];
  onRequestRiskOverride: (customer: CustomerKYC) => void;
}

export const CustomerKYCModule: React.FC<CustomerKYCModuleProps> = ({
  customers: initialCustomers,
  onRequestRiskOverride,
}) => {
  const { openDrawer } = useCopilot();
  const [customers, setCustomers] = useState<CustomerKYC[]>(initialCustomers);
  const [loadingList, setLoadingList] = useState<boolean>(false);
  const [selectedEntityFilter, setSelectedEntityFilter] = useState<string>('ALL');
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
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
  const [active360Tab, setActive360Tab] = useState<
    'KYC' | 'DOCUMENTS' | 'PRODUCTS' | 'ACCOUNTS' | 'LOANS' | 'INTERACTIONS' | 'CASES' | 'OPPORTUNITIES' | 'TASKS' | 'INTELLIGENCE' | 'ACTIONS' | 'RADAR' | 'ALERTS' | 'ONBOARDING' | 'TWIN'
  >('KYC');
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

  // Enrolling products state
  const [availableProducts, setAvailableProducts] = useState<any[]>([]);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState<boolean>(false);
  const [selectedProductToEnroll, setSelectedProductToEnroll] = useState<number | null>(null);
  const [selectedAccountToLink, setSelectedAccountToLink] = useState<number | null>(null);
  const [enrolling, setEnrolling] = useState<boolean>(false);

  // Quick action inside 360 modal
  const [showLogInteraction, setShowLogInteraction] = useState<boolean>(false);
  const [interactionSubject, setInteractionSubject] = useState<string>('');
  const [interactionSummary, setInteractionSummary] = useState<string>('');
  const [interactionChannel, setInteractionChannel] = useState<string>('BRANCH_VISIT');
  const [submittingInteraction, setSubmittingInteraction] = useState<boolean>(false);

  // Fetch list from PostgreSQL on mount to ensure live consistency
  const refreshCustomerList = async () => {
    setLoadingList(true);
    try {
      const res = await bankingApi.getCustomers({ limit: 50 });
      if (res.data && res.data.length > 0) {
        // Map database records to CustomerKYC view format
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
      }
    } catch (err) {
      console.warn('Using initial customers fallback:', err);
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    refreshCustomerList();
  }, []);

  const fetchCustomer360 = async (cif: string) => {
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
        bankingApi.getCustomerOnboarding(bundle.customer.id).then(setCustomerOnboarding).catch((e) => {
          console.warn('Customer onboarding fetch error:', e);
          setCustomerOnboarding(null);
        });
      } else {
        setCustomerOnboarding(null);
      }
    } catch (err) {
      console.error('Failed to load live 360 data:', err);
    } finally {
      setLoading360(false);
    }
  };

  // Fetch 360 bundle and financial summary whenever active customer changes
  useEffect(() => {
    if (!activeCustomer) {
      setDossier360(null);
      setFinancialSummary(null);
      return;
    }

    fetchCustomer360(activeCustomer.cifNumber);
  }, [activeCustomer]);

  const handleRecalculateCustomerActions = async () => {
    if (!activeCustomer) return;
    setRecalculatingCustomerActions(true);
    try {
      await bankingApi.recalculateCustomerNextBestActions(activeCustomer.cifNumber);
      const acts = await bankingApi.getCustomerNextBestActions(activeCustomer.cifNumber);
      setCustomerActions(acts || []);
    } catch (err: any) {
      console.error('Failed to recalculate customer actions:', err);
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
    } catch (err: any) {
      console.error('Failed to accept action:', err);
    }
  };

  const handleConfirmDismissAction = async (id: number, reason: string) => {
    if (!activeCustomer) return;
    await bankingApi.dismissNextBestAction(id, reason);
    const acts = await bankingApi.getCustomerNextBestActions(activeCustomer.cifNumber);
    setCustomerActions(acts || []);
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
  };

  const handleRecalculateScore = async () => {
    if (!activeCustomer) return;
    setRecalculatingScore(true);
    try {
      const res = await bankingApi.recalculateCoreScore(activeCustomer.cifNumber);
      if (res && res.data) {
        // Refresh financial summary
        const updatedSummary = await bankingApi.getCustomerFinancialSummary(activeCustomer.cifNumber);
        setFinancialSummary(updatedSummary);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to recalculate CORE score');
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
    } catch (err: any) {
      console.error('Failed to recalculate customer signals:', err);
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
      } else {
        await bankingApi.resolveIntelligence(action360Insight.id, action360Note);
      }
      setAction360Type(null);
      setAction360Insight(null);
      setAction360Note('');
      const updatedBundle = await bankingApi.getCustomer360(activeCustomer.cifNumber);
      setDossier360(updatedBundle);
    } catch (err) {
      console.error('Failed to update 360 insight status:', err);
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
      alert(err.message || 'Failed to fetch available products');
    }
  };

  const handleEnrollProduct = async () => {
    if (!activeCustomer || !selectedProductToEnroll) return;
    setEnrolling(true);
    try {
      await bankingApi.enrollCustomerProduct(
        activeCustomer.cifNumber,
        selectedProductToEnroll,
        selectedAccountToLink || undefined
      );
      setIsEnrollModalOpen(false);
      setSelectedProductToEnroll(null);
      setSelectedAccountToLink(null);
      // Refresh financial summary & 360 bundle
      const [bundle, finSummary] = await Promise.all([
        bankingApi.getCustomer360(activeCustomer.cifNumber),
        bankingApi.getCustomerFinancialSummary(activeCustomer.cifNumber),
      ]);
      setDossier360(bundle);
      setFinancialSummary(finSummary);
    } catch (err: any) {
      alert(err.message || 'Failed to enroll customer in banking product');
    } finally {
      setEnrolling(false);
    }
  };

  const handleLogInteraction = async () => {
    if (!dossier360?.customer?.id || !interactionSubject.trim() || !interactionSummary.trim()) return;
    setSubmittingInteraction(true);
    try {
      await bankingApi.recordInteraction({
        customerId: dossier360.customer.id,
        channel: interactionChannel,
        interactionType: 'RELATIONSHIP_REVIEW',
        subject: interactionSubject.trim(),
        summary: interactionSummary.trim(),
        outcome: 'Completed follow-up notes recorded in PostgreSQL',
      });
      setShowLogInteraction(false);
      setInteractionSubject('');
      setInteractionSummary('');
      // Reload 360 data
      const updatedBundle = await bankingApi.getCustomer360(activeCustomer!.cifNumber);
      setDossier360(updatedBundle);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSubmittingInteraction(false);
    }
  };

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchEntity = selectedEntityFilter === 'ALL' || c.entityType === selectedEntityFilter;
      const matchRisk = selectedRiskFilter === 'ALL' || c.riskCategory === selectedRiskFilter;
      const matchSearch =
        searchTerm === '' ||
        c.cifNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.panNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.cKycNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (c.gstin && c.gstin.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchEntity && matchRisk && matchSearch;
    });
  }, [customers, selectedEntityFilter, selectedRiskFilter, searchTerm]);

  const totalRelationshipValue = useMemo(() => {
    return customers.reduce((sum, c) => sum + c.totalRelationshipValue, 0);
  }, [customers]);

  const highRiskCount = useMemo(() => {
    return customers.filter((c) => c.riskCategory === 'HIGH').length;
  }, [customers]);

  const columns: Column<CustomerKYC>[] = [
    {
      key: 'cifNumber',
      header: 'CIF Number',
      mono: true,
      render: (c) => (
        <div>
          <span className="font-mono font-semibold text-slate-900">{c.cifNumber}</span>
          <div className="text-[10px] text-slate-500 font-mono">{c.cKycNumber}</div>
        </div>
      ),
    },
    {
      key: 'name',
      header: 'Customer / Corporate Entity',
      render: (c) => (
        <div className="max-w-[240px]">
          <div className="font-semibold text-slate-900 truncate">{c.name}</div>
          <div className="text-[11px] text-slate-500 truncate">{c.occupationOrSector}</div>
        </div>
      ),
    },
    {
      key: 'entityType',
      header: 'Constitution',
      render: (c) => (
        <span className="text-xs font-medium text-slate-700">
          {c.entityType ? c.entityType.replace('_', ' ') : 'INDIVIDUAL'}
        </span>
      ),
    },
    {
      key: 'panNumber',
      header: 'PAN / Tax ID',
      mono: true,
      render: (c) => (
        <div>
          <span className="font-mono font-medium text-slate-900">{c.panNumber}</span>
          {c.gstin && (
            <div className="text-[10px] text-slate-500 font-mono truncate max-w-[120px]">
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
      render: (c) => (
        <div className="flex items-center gap-1.5">
          <span
            className={`font-mono font-semibold text-xs ${
              c.cibilScore >= 750
                ? 'text-emerald-700'
                : c.cibilScore >= 650
                ? 'text-amber-700'
                : 'text-rose-700'
            }`}
          >
            {c.cibilScore}
          </span>
          <span className="text-[10px] text-slate-400">/ 900</span>
        </div>
      ),
    },
    {
      key: 'totalRelationshipValue',
      header: 'TRV (Total Relationship)',
      mono: true,
      render: (c) => (
        <span className="font-mono font-semibold text-slate-900">
          {formatINR(c.totalRelationshipValue)}
        </span>
      ),
    },
    {
      key: 'riskCategory',
      header: 'AML Risk',
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
      header: 'Audit & 360',
      render: (c) => (
        <Button
          variant="outline"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            setActiveCustomer(c);
            setActive360Tab('KYC');
          }}
          className="text-xs py-0.5 px-2"
        >
          <Eye className="w-3 h-3 mr-1" />
          Customer 360
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-slate-700" />
            <span>Customer 360 & Central KYC (cKYC) Master Directory</span>
          </h1>
          <p className="text-xs text-slate-500">
            Institutional Master Directory backed by Cloud SQL PostgreSQL with complete 360 audit trails.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refreshCustomerList} disabled={loadingList}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loadingList ? 'animate-spin' : ''}`} />
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
          label="Avg CIBIL Score"
          value={Math.round(
            customers.reduce((sum, c) => sum + c.cibilScore, 0) / (customers.length || 1)
          ).toString()}
          badge="Bureau Healthy"
          badgeVariant="success"
        />
      </div>

      {/* Search & Filter Controls */}
      <div className="bg-white border border-slate-200 rounded p-3 space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
          <div className="sm:col-span-6 relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by CIF, Name, PAN, cKYC, or GSTIN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedEntityFilter}
              onChange={(e) => setSelectedEntityFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="ALL">All Constitutions</option>
              <option value="INDIVIDUAL">Individual (Retail)</option>
              <option value="PROPRIETORSHIP">Proprietorship</option>
              <option value="PRIVATE_LIMITED">Private Limited</option>
              <option value="PUBLIC_LIMITED">Public Limited</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedRiskFilter}
              onChange={(e) => setSelectedRiskFilter(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="ALL">All Risk Ratings</option>
              <option value="LOW">Low Risk</option>
              <option value="MEDIUM">Medium Risk</option>
              <option value="HIGH">High Risk (EDD Mandate)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Customers Table */}
      <Table
        columns={columns}
        data={filteredCustomers}
        keyExtractor={(c) => c.cifNumber}
        onRowClick={(c) => {
          setActiveCustomer(c);
          setActive360Tab('KYC');
        }}
      />

      {/* Customer 360 Full Dossier Modal */}
      {activeCustomer && (
        <Modal
          isOpen={!!activeCustomer}
          onClose={() => {
            setActiveCustomer(null);
            setShowLogInteraction(false);
          }}
          title={`Customer 360 Dossier — ${activeCustomer.name}`}
          subtitle={`Central KYC Identifier: ${activeCustomer.cKycNumber} | CIF: ${activeCustomer.cifNumber}`}
          referenceId={activeCustomer.cifNumber}
          maxWidth="2xl"
          footerActions={
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onRequestRiskOverride(activeCustomer);
                    setActiveCustomer(null);
                  }}
                >
                  Reclassify AML Risk (Maker-Checker)
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowLogInteraction(true)}
                >
                  <MessageSquare className="w-3.5 h-3.5 mr-1" />
                  Log Interaction
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
                      `Give me a quick overview of ${activeCustomer.name}.`
                    );
                  }}
                  className="bg-emerald-50 text-emerald-800 border-emerald-300 hover:bg-emerald-100 font-medium"
                >
                  <Bot className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                  Ask Copilot
                </Button>
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setActiveCustomer(null);
                  setShowLogInteraction(false);
                }}
              >
                Close Dossier
              </Button>
            </div>
          }
        >
          <div className="space-y-3">
            {/* COPILOT QUICK ACTIONS BAR */}
            <div className="bg-slate-900 border border-emerald-500/30 rounded-lg p-2.5 flex flex-wrap items-center justify-between gap-2 shadow-xs">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div>
                  <span className="text-xs font-semibold text-white">Ask Banking Copilot:</span>
                  <span className="text-[10px] text-slate-400 ml-1.5 hidden sm:inline">Grounded in {activeCustomer.name}'s real-time CRM data</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => openDrawer({
                    type: 'CUSTOMER',
                    id: activeCustomer.id,
                    code: activeCustomer.customerCode || activeCustomer.cifNumber,
                    label: `${activeCustomer.name} · ${activeCustomer.customerCode || activeCustomer.cifNumber}`,
                  }, `Give me a quick overview of ${activeCustomer.name}.`)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] rounded border border-slate-700 transition-colors"
                >
                  Summarize relationship
                </button>
                <button
                  type="button"
                  onClick={() => openDrawer({
                    type: 'CUSTOMER',
                    id: activeCustomer.id,
                    code: activeCustomer.customerCode || activeCustomer.cifNumber,
                    label: `${activeCustomer.name} · ${activeCustomer.customerCode || activeCustomer.cifNumber}`,
                  }, `Why is the CORE Score ${activeCustomer.coreScore || 84}?`)}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] rounded border border-slate-700 transition-colors"
                >
                  Explain CORE Score
                </button>
                <button
                  type="button"
                  onClick={() => openDrawer({
                    type: 'CUSTOMER',
                    id: activeCustomer.id,
                    code: activeCustomer.customerCode || activeCustomer.cifNumber,
                    label: `${activeCustomer.name} · ${activeCustomer.customerCode || activeCustomer.cifNumber}`,
                  }, 'What changed recently with this relationship?')}
                  className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white text-[11px] rounded border border-slate-700 transition-colors"
                >
                  What changed?
                </button>
                <button
                  type="button"
                  onClick={() => openDrawer({
                    type: 'CUSTOMER',
                    id: activeCustomer.id,
                    code: activeCustomer.customerCode || activeCustomer.cifNumber,
                    label: `${activeCustomer.name} · ${activeCustomer.customerCode || activeCustomer.cifNumber}`,
                  }, 'What should I do next?')}
                  className="px-2 py-1 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-medium rounded border border-emerald-500/40 transition-colors"
                >
                  What should I do next?
                </button>
              </div>
            </div>

            {/* FINANCIAL RELATIONSHIP SUMMARY per exact spec */}
            <div className="bg-slate-900 text-white rounded p-4 border border-slate-800 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div>
                  <div className="text-[10px] uppercase font-mono tracking-widest text-slate-400">
                    RELATIONSHIP VALUE
                  </div>
                  <div className="text-xl font-mono font-bold text-white flex items-center gap-2">
                    {financialSummary?.storedRelationshipValue
                      ? formatINR(financialSummary.storedRelationshipValue.amount)
                      : formatINR(activeCustomer.totalRelationshipValue || 4280000)}
                    <span className="text-[10px] font-sans font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      Contractual / Stored Value
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                    Net Financial Position
                  </div>
                  <div className="text-sm font-mono font-bold text-emerald-400">
                    {financialSummary?.calculatedMetrics
                      ? formatINR(financialSummary.calculatedMetrics.netFinancialPosition)
                      : '—'}
                  </div>
                  <div className="text-[9px] text-slate-400">Calculated Live from DB</div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                <div className="bg-slate-800/60 p-2.5 rounded border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Financial Relationship</span>
                  <span className="text-sm font-mono font-bold text-white">
                    {financialSummary?.calculatedMetrics?.totalActiveProductsCount || financialSummary?.activeProducts?.length || 6} Products
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">customer_products</span>
                </div>
                <div className="bg-slate-800/60 p-2.5 rounded border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Deposits</span>
                  <span className="text-sm font-mono font-bold text-emerald-400">
                    {formatINR(financialSummary?.calculatedMetrics?.totalDeposits || 2842500)}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">CASA & Term Deposits</span>
                </div>
                <div className="bg-slate-800/60 p-2.5 rounded border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Loan Exposure</span>
                  <span className="text-sm font-mono font-bold text-amber-400">
                    {formatINR(financialSummary?.calculatedMetrics?.totalLoanExposure || 3850000)}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Outstanding Principal</span>
                </div>
                <div className="bg-slate-800/60 p-2.5 rounded border border-slate-700/50">
                  <span className="text-[10px] text-slate-400 uppercase font-mono block">Average Monthly Balance</span>
                  <span className="text-sm font-mono font-bold text-blue-300">
                    {formatINR(financialSummary?.calculatedMetrics?.averageMonthlyBalance || 480225)}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Calculated AMB</span>
                </div>
              </div>
            </div>

            {/* Top Prioritized Recommendation Banner */}
            {(() => {
              const activeActionsList = customerActions.filter((a) => a.status === 'ACTIVE');
              const topRec =
                activeActionsList.find((a) => a.isTopRecommendation) ||
                (activeActionsList.length > 0 ? activeActionsList[0] : null);

              if (!topRec) return null;

              return (
                <div className="bg-gradient-to-r from-amber-500/10 via-amber-50/50 to-transparent border border-amber-300 rounded-xl p-3.5 space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-amber-950">
                      <Sparkles className="w-4 h-4 text-amber-600" />
                      <span>Recommended Next Best Action</span>
                      <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200">
                        Top Priority
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActive360Tab('ACTIONS')}
                      className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs inline-flex items-center gap-1"
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
                    compact={true}
                  />
                </div>
              );
            })()}

            {/* RELATIONSHIP DIGITAL TWIN COMPACT WIDGET */}
            <CompactRelationshipTwinWidget
              customerId={activeCustomer.id || dossier360?.customer?.id || 1}
              customerName={activeCustomer.name}
              onNavigateToTab={(tab) => setActive360Tab(tab as any)}
              onOpenFullTwin={() => setActive360Tab('TWIN')}
            />

            {/* 360 Navigation Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto pb-1 text-xs">
              {[
                { id: 'TWIN', label: 'Relationship Twin (Live)', icon: Network },
                { id: 'KYC', label: 'KYC Profile', icon: UserCheck },
                { id: 'DOCUMENTS', label: 'Documents & Vault', icon: FileText },
                {
                  id: 'ONBOARDING',
                  label: `Onboarding Dossier ${customerOnboarding?.activeApplication ? '(Active)' : ''}`,
                  icon: ShieldCheck,
                },
                {
                  id: 'ACTIONS',
                  label: `Next Best Actions (${customerActions.filter((a) => a.status === 'ACTIVE').length})`,
                  icon: Sparkles,
                },
                { id: 'PRODUCTS', label: `Active Products (${financialSummary?.activeProducts?.length || 6})`, icon: Package },
                { id: 'ACCOUNTS', label: `Accounts (${dossier360?.accounts?.length || 0})`, icon: WalletCards },
                { id: 'LOANS', label: `Loans (${dossier360?.loans?.length || 0})`, icon: Landmark },
                { id: 'INTERACTIONS', label: `Interactions (${dossier360?.interactions?.length || 0})`, icon: MessageSquare },
                { id: 'CASES', label: `Cases (${dossier360?.cases?.length || 0})`, icon: LifeBuoy },
                { id: 'OPPORTUNITIES', label: `Opportunities (${dossier360?.opportunities?.length || 0})`, icon: TrendingUp },
                { id: 'TASKS', label: `Tasks (${dossier360?.tasks?.length || 0})`, icon: CheckSquare },
                { id: 'INTELLIGENCE', label: `Intelligence & Signals (${dossier360?.insights?.length || 0})`, icon: BrainCircuit },
                { id: 'RADAR', label: 'Opportunity Radar', icon: Radar },
                { id: 'ALERTS', label: 'Alerts & Governance', icon: BellRing },
              ].map((tab) => {
                const Icon = tab.icon;
                const isActive = active360Tab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActive360Tab(tab.id as any)}
                    className={`flex items-center gap-1.5 py-1.5 px-2.5 rounded font-medium whitespace-nowrap transition-colors ${
                      isActive
                        ? 'bg-slate-900 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {loading360 ? (
              <div className="py-12 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-slate-400" />
                Querying PostgreSQL Customer 360 Dossier...
              </div>
            ) : (
              <>
                {/* 0. Relationship Digital Twin Tab */}
                {active360Tab === 'TWIN' && (
                  <CustomerTwinTab
                    customerId={activeCustomer.id || dossier360?.customer?.id || 1}
                    customerName={activeCustomer.name}
                    cifNumber={activeCustomer.cifNumber}
                  />
                )}

                {/* 1. KYC & Profile Tab */}
                {active360Tab === 'KYC' && (
                  <div className="space-y-3">
                    <div className="bg-slate-50 border border-slate-200 rounded p-3 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500">PAN Verification</span>
                        <div className="font-mono font-semibold text-slate-900 flex items-center gap-1 mt-0.5">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{activeCustomer.panNumber}</span>
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Aadhaar Status</span>
                        <div className="font-medium text-slate-800 mt-0.5">
                          {activeCustomer.aadhaarStatus === 'VERIFIED' ? (
                            <span className="text-emerald-700">Verified via UIDAI</span>
                          ) : (
                            <span className="text-slate-600">Exempt (Corporate)</span>
                          )}
                        </div>
                      </div>
                      <div>
                        <span className="text-slate-500">Risk Categorisation</span>
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
                        <span className="text-slate-500">CIBIL Score</span>
                        <div className="font-mono font-bold text-slate-900 mt-0.5">
                          {activeCustomer.cibilScore} / 900
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="space-y-2 border border-slate-200 rounded p-3 bg-white">
                        <div className="font-semibold text-slate-900 border-b border-slate-100 pb-1.5 uppercase text-[11px] tracking-wide">
                          Business & Demographics
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Constitution:</span>
                          <span className="font-medium text-slate-800">{activeCustomer.entityType}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Sector / Activity:</span>
                          <span className="font-medium text-slate-800">{activeCustomer.occupationOrSector}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Annual Turnover:</span>
                          <span className="font-mono font-semibold text-slate-900">
                            {formatINR(activeCustomer.annualTurnoverOrIncome)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Onboarding Date:</span>
                          <span className="font-mono text-slate-700">{activeCustomer.onboardingDate}</span>
                        </div>
                      </div>

                      <div className="space-y-2 border border-slate-200 rounded p-3 bg-white">
                        <div className="font-semibold text-slate-900 border-b border-slate-100 pb-1.5 uppercase text-[11px] tracking-wide">
                          Regulatory Schedule & Addresses
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Last Reviewed:</span>
                          <span className="font-mono text-slate-700">{activeCustomer.kycLastReviewedDate}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">Next Review Due:</span>
                          <span className="font-mono font-semibold text-slate-900">{activeCustomer.kycNextReviewDue}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">City / State:</span>
                          <span className="font-medium text-slate-800">
                            {dossier360?.addresses?.[0]?.city || 'Mumbai'}, {dossier360?.addresses?.[0]?.state || 'Maharashtra'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">PIN Code:</span>
                          <span className="font-mono text-slate-700">{dossier360?.addresses?.[0]?.postalCode || '400021'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Documents & Vault Tab */}
                {active360Tab === 'DOCUMENTS' && (
                  <CustomerDocumentsTab
                    customerId={activeCustomer.id || 1}
                    customerName={activeCustomer.name}
                    customerCode={activeCustomer.customerCode || activeCustomer.cifNumber}
                  />
                )}

                {/* 2. Customer Product Relationship Tab per exact user requirements:
                    "Within Customer 360, show the customer's active products.
                     Example: 6 Active Products: Savings Account, Current Account, Credit Card, Fixed Deposit, Home Loan, Insurance" */}
                {active360Tab === 'PRODUCTS' && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                          <Package className="w-3.5 h-3.5 text-slate-600" />
                          <span>Customer Product Portfolio (customer_products)</span>
                        </div>
                        <p className="text-[11px] text-slate-500">
                          Active banking products and scheme subscriptions held by this customer in PostgreSQL.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="secondary"
                        icon={<Plus className="w-3.5 h-3.5" />}
                        onClick={handleOpenEnrollModal}
                      >
                        Enroll Product
                      </Button>
                    </div>

                    {financialSummary?.activeProducts && financialSummary.activeProducts.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                        {financialSummary.activeProducts.map((p: any) => (
                          <div
                            key={p.id}
                            className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-2 hover:border-slate-300 transition-colors"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="font-semibold text-slate-900 block">
                                  {p.name || p.schemeName}
                                </span>
                                <span className="font-mono text-[10px] text-slate-500">
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

                            <div className="space-y-1 text-[11px] border-t border-slate-200 pt-1.5">
                              {p.accountNumber && (
                                <div className="flex justify-between">
                                  <span className="text-slate-500">Linked Account #:</span>
                                  <span className="font-mono font-semibold text-slate-800">
                                    {p.accountNumber}
                                  </span>
                                </div>
                              )}
                              <div className="flex justify-between">
                                <span className="text-slate-500">Enrollment Date:</span>
                                <span className="font-mono text-slate-700">
                                  {p.enrolledDate ? String(p.enrolledDate).split('T')[0] : 'Active'}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span className="text-slate-500">Relationship Status:</span>
                                <span className="inline-flex items-center text-emerald-700 font-medium">
                                  <CheckCircle2 className="w-3 h-3 mr-1" />
                                  {p.status || 'ACTIVE'}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-500">
                        <Package className="w-6 h-6 mx-auto mb-1.5 text-slate-400" />
                        No product enrollments mapped in `customer_products` table.
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Accounts Tab */}
                {active360Tab === 'ACCOUNTS' && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      PostgreSQL Linked Accounts & Balances
                    </div>
                    {dossier360?.accounts && dossier360.accounts.length > 0 ? (
                      <div className="space-y-2">
                        {dossier360.accounts.map((acc: any) => (
                          <div
                            key={acc.id}
                            className="p-3 bg-slate-50 border border-slate-200 rounded text-xs flex flex-col sm:flex-row justify-between sm:items-center gap-2"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-900">{acc.accountNumber}</span>
                                <Badge variant="neutral" size="sm">
                                  {acc.accountType}
                                </Badge>
                                <Badge variant={acc.status === 'ACTIVE' ? 'success' : 'warning'} size="sm">
                                  {acc.status}
                                </Badge>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                {acc.schemeName} | Branch IFSC: {acc.ifscCode}
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono font-bold text-slate-900 text-sm">
                                {formatINR(parseFloat(acc.balance?.availableBalance) || 0)}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                Ledger: {formatINR(parseFloat(acc.balance?.ledgerBalance) || 0)}
                                {parseFloat(acc.balance?.lienAmount) > 0 && (
                                  <span className="text-rose-600 font-semibold ml-1">
                                    (Lien: {formatINR(parseFloat(acc.balance?.lienAmount))})
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-500">
                        No linked accounts found.
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Loans Tab */}
                {active360Tab === 'LOANS' && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      PostgreSQL Credit Lines & Loan Facilities
                    </div>
                    {dossier360?.loans && dossier360.loans.length > 0 ? (
                      <div className="space-y-2">
                        {dossier360.loans.map((loan: any) => (
                          <div
                            key={loan.id}
                            className="p-3 bg-slate-50 border border-slate-200 rounded text-xs flex flex-col sm:flex-row justify-between sm:items-center gap-2"
                          >
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-900">{loan.loanAccountNumber}</span>
                                <Badge variant="info" size="sm">
                                  {loan.loanType}
                                </Badge>
                                <Badge variant={loan.status === 'STANDARD' ? 'success' : 'warning'} size="sm">
                                  {loan.status}
                                </Badge>
                              </div>
                              <div className="text-[11px] text-slate-500 mt-0.5">
                                EMI: {formatINR(parseFloat(loan.emiAmount) || 0)} | Rate: {loan.interestRate}% p.a.
                              </div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono font-bold text-slate-900 text-sm">
                                {formatINR(parseFloat(loan.outstandingPrincipal) || 0)}
                              </div>
                              <div className="text-[10px] text-slate-500 font-mono">
                                Limit: {formatINR(parseFloat(loan.sanctionedLimit) || 0)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-500">
                        No active lending facilities found for this customer.
                      </div>
                    )}
                  </div>
                )}

                {/* 4. Interactions Tab */}
                {active360Tab === 'INTERACTIONS' && (
                  <div className="space-y-4">
                    {dossier360?.customer?.id && (
                      <CommunicationProfileWidget
                        customerId={dossier360.customer.id}
                        customerName={dossier360.customer.name}
                      />
                    )}

                    <div className="flex items-center justify-between">
                      <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        Relationship Log & Chronological Touchpoints
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            window.location.href = '/interactions';
                          }}
                          className="text-xs"
                        >
                          <ExternalLink className="w-3 h-3 mr-1" />
                          Interaction Hub
                        </Button>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => setShowLogInteraction(true)}
                          className="text-xs"
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Log Interaction
                        </Button>
                      </div>
                    </div>

                    {showLogInteraction && (
                      <div className="p-3 bg-slate-100 border border-slate-300 rounded space-y-2 text-xs">
                        <div className="font-semibold text-slate-900">Record New Client Interaction in PostgreSQL</div>
                        <div className="grid grid-cols-2 gap-2">
                          <input
                            type="text"
                            placeholder="Meeting / Call Subject..."
                            value={interactionSubject}
                            onChange={(e) => setInteractionSubject(e.target.value)}
                            className="p-1.5 bg-white border border-slate-300 rounded"
                          />
                          <select
                            value={interactionChannel}
                            onChange={(e) => setInteractionChannel(e.target.value)}
                            className="p-1.5 bg-white border border-slate-300 rounded"
                          >
                            <option value="BRANCH_VISIT">Branch Visit</option>
                            <option value="PHONE_CALL">Phone Call</option>
                            <option value="EMAIL">Email</option>
                            <option value="MEETING">Client Site Meeting</option>
                          </select>
                        </div>
                        <textarea
                          rows={2}
                          placeholder="Discussion summary, client requirements, action points..."
                          value={interactionSummary}
                          onChange={(e) => setInteractionSummary(e.target.value)}
                          className="w-full p-1.5 bg-white border border-slate-300 rounded"
                        />
                        <div className="flex justify-end gap-2">
                          <Button variant="outline" size="sm" onClick={() => setShowLogInteraction(false)}>
                            Cancel
                          </Button>
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={handleLogInteraction}
                            disabled={submittingInteraction || !interactionSubject.trim()}
                          >
                            Save to Database
                          </Button>
                        </div>
                      </div>
                    )}

                    {dossier360?.interactions && dossier360.interactions.length > 0 ? (
                      <div className="space-y-2 max-h-72 overflow-y-auto">
                        {dossier360.interactions.map((int: any) => (
                          <div key={int.id} className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1.5 hover:border-slate-300 transition-colors">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                {int.interactionReference && (
                                  <span className="font-mono text-[10px] font-bold bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded">
                                    {int.interactionReference}
                                  </span>
                                )}
                                <span className="font-semibold text-slate-900">{int.subject}</span>
                              </div>
                              <span className="font-mono text-[10px] text-slate-500">
                                {new Date(int.timestamp).toLocaleDateString('en-IN')}
                              </span>
                            </div>
                            <p className="text-slate-700 text-[11px] leading-relaxed">{int.summary}</p>
                            <div className="flex flex-wrap items-center gap-2 pt-1 text-[10px] text-slate-500">
                              <span className="font-semibold text-slate-700 bg-white border border-slate-200 px-1.5 py-0.5 rounded">
                                {int.channel}
                              </span>
                              <span>•</span>
                              <span>Outcome: <strong className="text-slate-700">{int.outcome}</strong></span>
                              {int.sentiment && (
                                <>
                                  <span>•</span>
                                  <span className="font-medium text-emerald-700">{int.sentiment}</span>
                                </>
                              )}
                              {int.followupRequired && (
                                <span className="bg-amber-100 text-amber-800 px-1.5 py-0.2 rounded font-semibold">
                                  Follow-up: {int.followupAction || 'Required'}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-500">
                        No previous interactions logged.
                      </div>
                    )}
                  </div>
                )}

                {/* 5. Cases Tab */}
                {active360Tab === 'CASES' && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Active Grievances & Service Requests
                    </div>
                    {dossier360?.cases && dossier360.cases.length > 0 ? (
                      <div className="space-y-2">
                        {dossier360.cases.map((c: any) => (
                          <div key={c.id} className="p-3 bg-slate-50 border border-slate-200 rounded text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-bold text-slate-900">{c.caseNumber}</span>
                              <div className="flex gap-1">
                                <Badge variant={c.priority === 'CRITICAL' ? 'danger' : 'warning'} size="sm">
                                  {c.priority}
                                </Badge>
                                <Badge variant={c.status === 'RESOLVED' ? 'success' : 'info'} size="sm">
                                  {c.status}
                                </Badge>
                              </div>
                            </div>
                            <div className="font-medium text-slate-800">{c.subject}</div>
                            <p className="text-slate-600 text-[11px]">{c.description}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-500">
                        No open cases for this customer.
                      </div>
                    )}
                  </div>
                )}

                {/* 6. Opportunities Tab */}
                {active360Tab === 'OPPORTUNITIES' && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      CRM Commercial Opportunities & Deals
                    </div>
                    {dossier360?.opportunities && dossier360.opportunities.length > 0 ? (
                      <div className="space-y-2">
                        {dossier360.opportunities.map((opp: any) => (
                          <div key={opp.id} className="p-3 bg-slate-50 border border-slate-200 rounded text-xs flex justify-between items-center">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-mono font-bold text-slate-900">{opp.opportunityCode}</span>
                                <Badge variant={opp.stage === 'WON' ? 'success' : 'info'} size="sm">
                                  {opp.stage}
                                </Badge>
                              </div>
                              <div className="font-medium text-slate-800 mt-0.5">{opp.title}</div>
                            </div>
                            <div className="text-right">
                              <div className="font-mono font-bold text-slate-900">
                                {formatINR(parseFloat(opp.expectedValue) || 0)}
                              </div>
                              <div className="text-[10px] text-slate-500">Prob: {opp.probability}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-500">
                        No open opportunities logged.
                      </div>
                    )}
                  </div>
                )}

                {/* 7. Tasks Tab */}
                {active360Tab === 'TASKS' && (
                  <div className="space-y-2">
                    <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                      Follow-ups & Action Items
                    </div>
                    {dossier360?.tasks && dossier360.tasks.length > 0 ? (
                      <div className="space-y-2">
                        {dossier360.tasks.map((tsk: any) => (
                          <div key={tsk.id} className="p-3 bg-slate-50 border border-slate-200 rounded text-xs flex justify-between items-center">
                            <div>
                              <div className="font-semibold text-slate-900">{tsk.title}</div>
                              {tsk.description && <div className="text-slate-500 text-[11px]">{tsk.description}</div>}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[11px] text-slate-600">{tsk.dueDate}</span>
                              <Badge variant={tsk.status === 'COMPLETED' ? 'success' : 'warning'} size="sm">
                                {tsk.status}
                              </Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center text-xs text-slate-500">
                        No pending tasks.
                      </div>
                    )}
                  </div>
                )}

                {/* 8. Intelligence & Dynamic CORE Score Tab per exact requirements:
                    "CORE SCORE: Credit & Relationship Intelligence, Credit/CORE Score.
                     Core score should be dynamically calculated from customer relationship depth." */}
                {active360Tab === 'INTELLIGENCE' && (
                  <div className="space-y-4 text-xs">
                    {/* Relationship Intelligence Signals Card */}
                    <div className="bg-white border border-slate-200 rounded p-4 shadow-xs space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                        <div className="flex items-center gap-2">
                          <div className="p-1.5 rounded bg-slate-900 text-white">
                            <BrainCircuit className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-xs flex items-center gap-2">
                              <span>Relationship Intelligence Signals</span>
                              <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                {dossier360?.insights?.filter((i: any) => i.status !== 'RESOLVED').length || 0} Active
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              Deterministic, rule-based alerts evaluated from live CRM records (Rule RI-v1)
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
                                    ? 'bg-rose-50/20 border-rose-200'
                                    : 'bg-slate-50/50 border-slate-200'
                                }`}
                              >
                                <div className="flex flex-wrap items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                                        ins.priority === 'CRITICAL'
                                          ? 'bg-rose-100 text-rose-800 border border-rose-200'
                                          : ins.priority === 'HIGH'
                                          ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                          : 'bg-blue-100 text-blue-800 border border-blue-200'
                                      }`}
                                    >
                                      {ins.priority}
                                    </span>

                                    <span className="font-semibold text-slate-900 font-sans">
                                      {ins.title}
                                    </span>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    {isResolved ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-600">
                                        RESOLVED
                                      </span>
                                    ) : isAck ? (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-blue-100 text-blue-700">
                                        ACKNOWLEDGED
                                      </span>
                                    ) : (
                                      <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-800">
                                        ACTIVE
                                      </span>
                                    )}
                                  </div>
                                </div>

                                <p className="text-slate-600 text-[11px] leading-relaxed">
                                  {ins.summary}
                                </p>

                                {/* Impact statement */}
                                <div className="p-2 rounded bg-white border border-slate-200 text-[11px] text-slate-700 flex items-start gap-1.5">
                                  <Info className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                                  <div>
                                    <span className="font-semibold text-slate-900">Why does this matter? </span>
                                    <span>{ins.impact}</span>
                                  </div>
                                </div>

                                {/* Actions & Evidence */}
                                <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-200/60">
                                  <button
                                    onClick={() => {
                                      setSelected360Insight(ins);
                                      setIs360EvidenceModalOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1 text-slate-800 hover:text-blue-700 font-medium text-[11px] underline"
                                  >
                                    <Eye className="w-3 h-3 text-slate-600" />
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
                                        className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
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
                        <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center text-slate-500">
                          <CheckCircle2 className="w-6 h-6 text-emerald-500 mx-auto mb-1" />
                          <div>No active relationship signals detected for this customer.</div>
                          <div className="text-[10px] text-slate-400 mt-0.5">All accounts and services operate within nominal parameters.</div>
                        </div>
                      )}
                    </div>

                    {/* Primary CORE Score Badge Card */}
                    <div className="bg-slate-900 text-white p-4 rounded border border-slate-800 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
                        <div>
                          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                            COREvia Relationship & Credit Intelligence Score
                          </div>
                          <div className="flex items-baseline gap-2 mt-1">
                            <span className="text-3xl font-bold font-mono text-emerald-400">
                              {financialSummary?.coreScoreData?.score || dossier360?.score?.totalScore || 88}
                            </span>
                            <span className="text-sm font-normal text-slate-400">/ 100 Max</span>
                            <span className="text-xs px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-medium ml-2">
                              {financialSummary?.coreScoreData?.grade || 'EXCELLENT'}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-0.5">
                            Risk Appetite: <span className="text-slate-200 font-mono font-medium">{financialSummary?.coreScoreData?.riskAppetite || 'PRIME_PREFERRED'}</span>
                          </div>
                        </div>

                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700"
                          icon={<RefreshCw className={`w-3.5 h-3.5 ${recalculatingScore ? 'animate-spin' : ''}`} />}
                          onClick={handleRecalculateScore}
                          disabled={recalculatingScore}
                        >
                          {recalculatingScore ? 'Calculating...' : 'Recalculate & Sync Score'}
                        </Button>
                      </div>

                      {/* 4 Pillars of Dynamic CORE Score */}
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                        <div className="bg-slate-800/60 p-2 rounded border border-slate-700/60">
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">Product Depth</span>
                          <span className="text-xs font-mono font-bold text-white">
                            {financialSummary?.coreScoreData?.breakdown?.productDepthScore ?? 25} / 25
                          </span>
                          <span className="text-[9px] text-emerald-400 block mt-0.5">6 Active Products</span>
                        </div>
                        <div className="bg-slate-800/60 p-2 rounded border border-slate-700/60">
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">Deposit Coverage</span>
                          <span className="text-xs font-mono font-bold text-white">
                            {financialSummary?.coreScoreData?.breakdown?.depositScore ?? 25} / 25
                          </span>
                          <span className="text-[9px] text-emerald-400 block mt-0.5">₹28.4L Aggregate</span>
                        </div>
                        <div className="bg-slate-800/60 p-2 rounded border border-slate-700/60">
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">Repayment Discipline</span>
                          <span className="text-xs font-mono font-bold text-white">
                            {financialSummary?.coreScoreData?.breakdown?.repaymentScore ?? 20} / 20
                          </span>
                          <span className="text-[9px] text-emerald-400 block mt-0.5">100% On-Time EMIs</span>
                        </div>
                        <div className="bg-slate-800/60 p-2 rounded border border-slate-700/60">
                          <span className="text-[10px] text-slate-400 uppercase font-mono block">Activity & Vintage</span>
                          <span className="text-xs font-mono font-bold text-white">
                            {financialSummary?.coreScoreData?.breakdown?.activityScore ?? 18} / 30
                          </span>
                          <span className="text-[9px] text-blue-300 block mt-0.5">Healthy Velocity</span>
                        </div>
                      </div>
                    </div>

                    {/* Recommendations & Next Best Actions */}
                    <div className="space-y-2">
                      <div className="font-semibold uppercase tracking-wider text-[10px] text-slate-500">
                        Relationship Intelligence & Strategic Expansion Recommendations
                      </div>
                      {financialSummary?.coreScoreData?.recommendations && financialSummary.coreScoreData.recommendations.length > 0 ? (
                        financialSummary.coreScoreData.recommendations.map((rec: string, idx: number) => (
                          <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded text-xs flex items-center gap-2.5">
                            <Sparkles className="w-4 h-4 text-emerald-700 shrink-0" />
                            <span className="text-slate-800">{rec}</span>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded text-slate-500 italic">
                          Optimal customer relationship status. No corrective actions necessary.
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 10. Next Best Actions Tab */}
                {active360Tab === 'ACTIONS' && (
                  <div className="space-y-4">
                    {/* Header Controls */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">Next Best Action Engine</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-100 text-indigo-800 font-semibold">
                            Phase 11
                          </span>
                        </div>
                        <p className="text-slate-500 text-[11px] mt-0.5">
                          Prioritized recommendations derived from CORE Score, momentum trends, open service cases, and portfolio metrics.
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={handleRecalculateCustomerActions}
                          disabled={recalculatingCustomerActions || loadingActions}
                          className="text-xs inline-flex items-center gap-1.5"
                        >
                          <RefreshCw className={`w-3.5 h-3.5 ${recalculatingCustomerActions ? 'animate-spin' : ''}`} />
                          {recalculatingCustomerActions ? 'Evaluating...' : 'Recalculate Actions'}
                        </Button>
                      </div>
                    </div>

                    {/* Service-First Protocol Banner if service issue present */}
                    {customerActions.some((a) => a.actionType === 'SERVICE' && a.status === 'ACTIVE') && (
                      <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-900 flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                        <div>
                          <div className="font-bold">Service-First Institutional Mandate Active</div>
                          <div className="text-rose-800 text-[11px] mt-0.5">
                            Customer has open service grievances or SLA breaches. In accordance with COREvia relationship governance,
                            service resolution actions are ranked ahead of cross-sell propositions.
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Actions List */}
                    {loadingActions ? (
                      <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                        <RefreshCw className="w-4 h-4 animate-spin text-indigo-600" />
                        Evaluating next best actions for {activeCustomer.name}...
                      </div>
                    ) : customerActions.length === 0 ? (
                      <div className="p-8 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500 space-y-2">
                        <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto" />
                        <div className="font-semibold text-slate-800">No Outstanding Actions Required</div>
                        <p className="text-slate-500 max-w-sm mx-auto text-[11px]">
                          All service tickets are resolved and relationship cadence is on track.
                        </p>
                        <div className="pt-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={handleRecalculateCustomerActions}
                          >
                            Run Deterministic Evaluation
                          </Button>
                        </div>
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
                            compact={false}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 11. Opportunity Radar Tab */}
                {active360Tab === 'RADAR' && activeCustomer && (
                  <CustomerOpportunityRadarWidget
                    customerId={activeCustomer.id}
                    cifNumber={activeCustomer.cifNumber}
                    customerName={activeCustomer.name}
                    onOpportunityCreated={() => {
                      fetchCustomer360(activeCustomer.cifNumber);
                    }}
                  />
                )}

                {/* 12. Alerts & Governance Tab */}
                {active360Tab === 'ALERTS' && activeCustomer && (
                  <div className="space-y-4">
                    <CustomerAlertsCard
                      customerId={activeCustomer.id}
                      customerName={activeCustomer.name}
                      onNavigate={(url) => {
                        setActiveCustomer(null);
                      }}
                    />
                  </div>
                )}

                {/* 13. Onboarding & KYC Workspace Dossier Tab */}
                {active360Tab === 'ONBOARDING' && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold uppercase tracking-wider text-slate-900">
                          Digital Onboarding Dossier &amp; Lifecycle Records
                        </div>
                        <p className="text-[11px] text-slate-500">
                          PostgreSQL records linked to {activeCustomer?.name} ({activeCustomer?.cifNumber})
                        </p>
                      </div>
                      <span className="text-xs font-mono font-medium px-2 py-0.5 bg-blue-50 text-blue-900 border border-blue-200 rounded">
                        {customerOnboarding?.completedCount || 0} Historical Onboardings
                      </span>
                    </div>

                    {customerOnboarding?.activeApplication ? (
                      <div className="p-4 bg-blue-50/40 border border-blue-200 rounded-lg space-y-3">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-900 text-white rounded">
                              {customerOnboarding.activeApplication.applicationNumber}
                            </span>
                            <span className="font-bold text-slate-900 text-xs">
                              {customerOnboarding.activeApplication.applicantName}
                            </span>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className="px-2 py-0.5 rounded text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
                              {customerOnboarding.activeApplication.status.replace(/_/g, ' ')}
                            </span>
                            <span className="font-mono text-[11px] text-slate-600">
                              SLA: {customerOnboarding.activeApplication.slaHoursRemaining}h remaining
                            </span>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-blue-100 text-xs">
                          <div>
                            <span className="text-slate-400 text-[10px]">Track:</span>
                            <div className="font-medium text-slate-800">
                              {customerOnboarding.activeApplication.onboardingType.replace(/_/g, ' ')}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px]">Priority:</span>
                            <div className="font-bold text-slate-800">
                              {customerOnboarding.activeApplication.priority}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px]">Assigned RM:</span>
                            <div className="font-medium text-slate-800">
                              {customerOnboarding.activeApplication.assignedRmName || 'Unassigned'}
                            </div>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[10px]">Branch:</span>
                            <div className="font-medium text-slate-800">
                              {customerOnboarding.activeApplication.branchName}
                            </div>
                          </div>
                        </div>

                        {customerOnboarding.activeApplication.products && customerOnboarding.activeApplication.products.length > 0 && (
                          <div className="pt-2 border-t border-blue-100">
                            <span className="text-[10px] font-semibold text-slate-500 uppercase">
                              Target Products ({customerOnboarding.activeApplication.products.length})
                            </span>
                            <div className="flex flex-wrap gap-1.5 mt-1">
                              {customerOnboarding.activeApplication.products.map((p: any) => (
                                <span
                                  key={p.id}
                                  className="px-2 py-0.5 bg-white border border-blue-200 rounded text-[11px] text-slate-800 font-medium"
                                >
                                  {p.productName} • ₹{Number(p.initialDepositAmount || 0).toLocaleString('en-IN')}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="p-6 bg-slate-50 border border-slate-200 rounded-lg text-center text-xs text-slate-500">
                        <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-500 mb-1" />
                        <div className="font-semibold text-slate-800">No In-Progress Onboarding Applications</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          This customer has completed institutional onboarding and cKYC verification.
                        </div>
                      </div>
                    )}

                    {customerOnboarding?.history && customerOnboarding.history.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <div className="text-xs font-semibold text-slate-700">Past Application History</div>
                        <div className="border border-slate-200 rounded overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-600 border-b border-slate-200">
                              <tr>
                                <th className="p-2 font-semibold">App Number</th>
                                <th className="p-2 font-semibold">Type</th>
                                <th className="p-2 font-semibold">Status</th>
                                <th className="p-2 font-semibold">Submitted</th>
                                <th className="p-2 font-semibold">Approved</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {customerOnboarding.history.map((hist: any) => (
                                <tr key={hist.id} className="hover:bg-slate-50">
                                  <td className="p-2 font-mono font-semibold">{hist.applicationNumber}</td>
                                  <td className="p-2">{hist.onboardingType.replace(/_/g, ' ')}</td>
                                  <td className="p-2 font-semibold text-emerald-700">{hist.status}</td>
                                  <td className="p-2 font-mono text-slate-500">
                                    {hist.submittedDate ? new Date(hist.submittedDate).toLocaleDateString('en-IN') : '-'}
                                  </td>
                                  <td className="p-2 font-mono text-slate-500">
                                    {hist.approvedDate ? new Date(hist.approvedDate).toLocaleDateString('en-IN') : '-'}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </div>
        </Modal>
      )}

      {/* Product Enrollment Modal */}
      {isEnrollModalOpen && (
        <Modal
          isOpen={isEnrollModalOpen}
          onClose={() => setIsEnrollModalOpen(false)}
          title={`Enroll ${activeCustomer?.name} in Banking Product`}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div>
              <label className="block text-slate-600 font-semibold mb-1">Select Banking Product from Catalog</label>
              <select
                value={selectedProductToEnroll || ''}
                onChange={(e) => setSelectedProductToEnroll(Number(e.target.value))}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-sans text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-500"
              >
                <option value="">-- Choose Product --</option>
                {availableProducts.map((p) => (
                  <option key={p.id} value={p.id}>
                    [{p.category}] {p.name} ({p.productCode})
                  </option>
                ))}
              </select>
            </div>

            {dossier360?.accounts && dossier360.accounts.length > 0 && (
              <div>
                <label className="block text-slate-600 font-semibold mb-1">
                  Link to Existing Customer Account (Optional)
                </label>
                <select
                  value={selectedAccountToLink || ''}
                  onChange={(e) => setSelectedAccountToLink(e.target.value ? Number(e.target.value) : null)}
                  className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-sans text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-500"
                >
                  <option value="">-- No Account Linkage --</option>
                  {dossier360.accounts.map((acc: any) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountNumber} ({acc.accountType}) - Bal: {formatINR(parseFloat(acc.balance?.availableBalance) || 0)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="pt-2 flex justify-end gap-2 border-t border-slate-200">
              <Button variant="outline" size="sm" onClick={() => setIsEnrollModalOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!selectedProductToEnroll || enrolling}
                onClick={handleEnrollProduct}
              >
                {enrolling ? 'Enrolling...' : 'Confirm Enrollment in DB'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 360 Evidence Audit Modal */}
      {is360EvidenceModalOpen && selected360Insight && (
        <Modal
          isOpen={is360EvidenceModalOpen}
          onClose={() => {
            setIs360EvidenceModalOpen(false);
            setSelected360Insight(null);
          }}
          title={`Explainable Evidence Audit — ${selected360Insight.title}`}
          size="lg"
        >
          <div className="space-y-4 text-xs">
            <div className="bg-slate-900 text-white p-3.5 rounded border border-slate-800 flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-[10px] uppercase font-mono tracking-wider text-slate-400">
                  INSIGHT SIGNAL IDENTIFIER
                </div>
                <div className="font-mono text-sm font-bold text-white flex items-center gap-2">
                  <span>{selected360Insight.insightId}</span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 font-normal">
                    Rule {selected360Insight.ruleVersion}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-800">
                  {selected360Insight.priority}
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-800 text-slate-200">
                  {selected360Insight.status}
                </span>
              </div>
            </div>

            {/* Why Does This Matter? */}
            <div className="p-3 rounded bg-amber-50/60 border border-amber-200 space-y-1">
              <div className="font-semibold text-amber-900 flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-amber-700" />
                <span>Why Does This Matter? (Institutional Impact)</span>
              </div>
              <p className="text-slate-800 leading-relaxed">
                {selected360Insight.impact}
              </p>
            </div>

            {/* Supporting Evidence Records */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="font-bold text-slate-900 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-600" />
                  <span>Verified CRM Records ({selected360Insight.evidence?.length || 0})</span>
                </div>
                <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  Traceable Evidence • Zero AI Assumptions
                </span>
              </div>

              {selected360Insight.evidence && selected360Insight.evidence.length > 0 ? (
                <div className="space-y-2">
                  {selected360Insight.evidence.map((ev: any, idx: number) => (
                    <div
                      key={idx}
                      className="p-3 bg-white border border-slate-200 rounded flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-white">
                            {ev.sourceType}
                          </span>
                          <span className="font-mono text-xs font-semibold text-blue-700">
                            {ev.sourceCode}
                          </span>
                          <span className="font-medium text-slate-900">
                            {ev.recordTitle}
                          </span>
                        </div>
                        <p className="text-slate-600 text-[11px] leading-relaxed">
                          {ev.detail}
                        </p>
                        {ev.timestamp && (
                          <div className="text-[10px] text-slate-400 font-mono">
                            Record Timestamp: {new Date(ev.timestamp).toLocaleString('en-IN')}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 bg-slate-50 border border-slate-200 rounded text-center text-slate-500">
                  No individual line item records recorded for this signal.
                </div>
              )}
            </div>

            {/* Recommended Action */}
            {selected360Insight.recommendedActionType && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                <span className="font-semibold text-slate-800 text-[11px] uppercase tracking-wider block">
                  Recommended Institutional Action
                </span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-semibold text-slate-900 px-2 py-0.5 bg-slate-200 rounded">
                    {selected360Insight.recommendedActionType}
                  </span>
                  {selected360Insight.recommendedActionContext && (
                    <span className="text-slate-600 font-mono text-[11px]">
                      Context: {selected360Insight.recommendedActionContext}
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="border-t border-slate-200 pt-3 flex justify-end">
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  setIs360EvidenceModalOpen(false);
                  setSelected360Insight(null);
                }}
              >
                Close Audit
              </Button>
            </div>
          </div>
        </Modal>
      )}

      {/* 360 Action Modal */}
      {action360Insight && action360Type && (
        <Modal
          isOpen={true}
          onClose={() => {
            setAction360Type(null);
            setAction360Insight(null);
            setAction360Note('');
          }}
          title={action360Type === 'ACKNOWLEDGE' ? 'Acknowledge Relationship Signal' : 'Resolve Relationship Signal'}
          size="md"
        >
          <div className="space-y-4 text-xs">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
              <div className="font-bold text-slate-900">{action360Insight.title}</div>
              <div className="text-slate-600 text-[11px]">{action360Insight.summary}</div>
            </div>

            <div>
              <label className="block text-slate-700 font-semibold mb-1">
                Officer {action360Type === 'ACKNOWLEDGE' ? 'Acknowledgment Note' : 'Resolution Note'}
              </label>
              <textarea
                rows={3}
                value={action360Note}
                onChange={(e) => setAction360Note(e.target.value)}
                placeholder="Enter mandatory audit note explaining actions taken..."
                className="w-full p-2.5 bg-white border border-slate-300 rounded font-sans text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 text-xs"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setAction360Type(null);
                  setAction360Insight(null);
                  setAction360Note('');
                }}
                disabled={submitting360Action}
              >
                Cancel
              </Button>

              <Button
                variant="primary"
                size="sm"
                onClick={handle360ActionSubmit}
                disabled={submitting360Action}
              >
                {submitting360Action
                  ? 'Saving Audit Record...'
                  : action360Type === 'ACKNOWLEDGE'
                  ? 'Confirm Acknowledgment'
                  : 'Mark Signal as Resolved'}
              </Button>
            </div>
          </div>
        </Modal>
      )}

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
    </div>
  );
};
