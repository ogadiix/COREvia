import React, { useState, useEffect } from 'react';
import {
  OnboardingApplicationItem,
  OnboardingSummaryMetrics,
  OnboardingDocumentItem,
  OnboardingExceptionItem,
  OnboardingStatus,
  KycStatus,
  KybStatus,
} from '../../types';
import { bankingApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  Search,
  Filter,
  Plus,
  RefreshCw,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  UserCheck,
  Building2,
  ShieldCheck,
  ChevronRight,
  ExternalLink,
  ArrowUpDown,
  AlertOctagon,
  UserPlus,
  Send,
  Eye,
  SlidersHorizontal,
  FileCheck2,
  FileWarning,
  X,
  ChevronLeft,
} from 'lucide-react';
import { OnboardingDetailDrawer } from './OnboardingDetailDrawer';
import { NewApplicationModal } from './NewApplicationModal';
import { DocumentReviewModal } from './DocumentReviewModal';
import { RaiseExceptionModal } from './RaiseExceptionModal';
import { ResolveExceptionModal } from './ResolveExceptionModal';
import { WaiveExceptionModal } from './WaiveExceptionModal';
import { ReassignModal } from './ReassignModal';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

type SubSectionType =
  | 'applications'
  | 'kyc-queue'
  | 'kyb-queue'
  | 'documents'
  | 'exceptions'
  | 'sla-performance';

interface OnboardingModuleProps {
  onNavigateToCustomer?: (customerCode: string) => void;
}

export const OnboardingModule: React.FC<OnboardingModuleProps> = ({ onNavigateToCustomer }) => {
  const { user, hasRole, hasPermission } = useAuth();

  // Active sub-section
  const [activeTab, setActiveTab] = useState<SubSectionType>('applications');

  // Applications List State
  const [applications, setApplications] = useState<OnboardingApplicationItem[]>([]);
  const [metrics, setMetrics] = useState<OnboardingSummaryMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedCustomerType, setSelectedCustomerType] = useState<string>('ALL');
  const [selectedPriority, setSelectedPriority] = useState<string>('ALL');
  const [selectedSlaStatus, setSelectedSlaStatus] = useState<string>('ALL');
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [totalCount, setTotalCount] = useState<number>(0);

  // Modals & Drawer State
  const [selectedApp, setSelectedApp] = useState<OnboardingApplicationItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [isNewModalOpen, setIsNewModalOpen] = useState<boolean>(false);
  const [reviewingDoc, setReviewingDoc] = useState<OnboardingDocumentItem | null>(null);
  const [exceptionTargetApp, setExceptionTargetApp] = useState<OnboardingApplicationItem | null>(null);
  const [resolvingException, setResolvingException] = useState<OnboardingExceptionItem | null>(null);
  const [waivingException, setWaivingException] = useState<OnboardingExceptionItem | null>(null);
  const [reassignTargetApp, setReassignTargetApp] = useState<OnboardingApplicationItem | null>(null);

  // Fetch metrics & list data
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const queueParam =
        activeTab === 'kyc-queue'
          ? 'KYC'
          : activeTab === 'kyb-queue'
          ? 'KYB'
          : activeTab === 'documents'
          ? 'DOCUMENTS'
          : activeTab === 'exceptions'
          ? 'EXCEPTIONS'
          : undefined;

      const [appsRes, metricsRes] = await Promise.all([
        bankingApi.listOnboardingApplications({
          search: searchQuery.trim() || undefined,
          status: selectedStatus !== 'ALL' ? selectedStatus : undefined,
          customerType: selectedCustomerType !== 'ALL' ? selectedCustomerType : undefined,
          priority: selectedPriority !== 'ALL' ? selectedPriority : undefined,
          slaStatus: selectedSlaStatus !== 'ALL' ? selectedSlaStatus : undefined,
          queue: queueParam,
          page,
          limit: 15,
        }),
        bankingApi.getOnboardingMetrics(),
      ]);

      setApplications(appsRes.data || []);
      setTotalPages(appsRes.totalPages || 1);
      setTotalCount(appsRes.total || 0);
      setMetrics(metricsRes);
    } catch (err: any) {
      console.error('Failed to load onboarding data:', err);
      setError(err?.message || 'Failed to load onboarding records.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [
    activeTab,
    searchQuery,
    selectedStatus,
    selectedCustomerType,
    selectedPriority,
    selectedSlaStatus,
    page,
  ]);

  // Open detail drawer for an application
  const handleOpenAppDetails = async (appIdOrNumber: string | number) => {
    try {
      const fullApp = await bankingApi.getOnboardingApplication(appIdOrNumber);
      setSelectedApp(fullApp);
      setIsDrawerOpen(true);
    } catch (err: any) {
      console.error('Failed to fetch full application details:', err);
    }
  };

  const handleRefreshApp = async () => {
    if (selectedApp) {
      const fullApp = await bankingApi.getOnboardingApplication(selectedApp.id);
      setSelectedApp(fullApp);
    }
    fetchData();
  };

  // Status Badge Helper
  const renderStatusBadge = (status: OnboardingStatus) => {
    const map: Record<OnboardingStatus, { label: string; variant: 'neutral' | 'success' | 'warning' | 'danger' | 'info' }> = {
      DRAFT: { label: 'Draft', variant: 'neutral' },
      SUBMITTED: { label: 'Submitted', variant: 'info' },
      DOCUMENT_REVIEW: { label: 'Doc Review', variant: 'neutral' },
      KYC_REVIEW: { label: 'KYC Review', variant: 'warning' },
      ADDITIONAL_INFORMATION: { label: 'Info Requested', variant: 'warning' },
      COMPLIANCE_REVIEW: { label: 'Compliance', variant: 'info' },
      APPROVED: { label: 'Approved', variant: 'success' },
      REJECTED: { label: 'Rejected', variant: 'danger' },
      WITHDRAWN: { label: 'Withdrawn', variant: 'neutral' },
      COMPLETED: { label: 'Completed', variant: 'success' },
    };
    const c = map[status] || { label: status, variant: 'neutral' };
    return <Badge variant={c.variant} size="sm">{c.label}</Badge>;
  };

  // SLA Badge Helper
  const renderSlaBadge = (status: 'ON_TRACK' | 'AT_RISK' | 'BREACHED', remainingHours: number) => {
    if (status === 'BREACHED') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
          <AlertOctagon className="w-3 h-3 text-rose-600 dark:text-rose-400" />
          Breached
        </span>
      );
    }
    if (status === 'AT_RISK') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">
          <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
          {remainingHours}h left
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">
        <Clock className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
        {remainingHours}h left
      </span>
    );
  };

  // Priority Badge Helper
  const renderPriorityBadge = (priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') => {
    const colors: Record<string, string> = {
      URGENT: 'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900',
      HIGH: 'text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900',
      MEDIUM: 'text-slate-700 dark:text-[#A9BACB] bg-slate-50 dark:bg-[#101C2A] border-slate-200 dark:border-[#33485D]',
      LOW: 'text-slate-500 dark:text-[#8194A8] bg-slate-50 dark:bg-[#101C2A] border-slate-200 dark:border-[#33485D]',
    };
    return (
      <span className={`inline-flex px-1.5 py-0.2 rounded text-[10px] font-medium border uppercase tracking-wider ${colors[priority] || colors.MEDIUM}`}>
        {priority}
      </span>
    );
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Institutional Header */}
      <div className="bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded p-4 shadow-2xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded bg-[#142C45] dark:bg-[#1B9D92] text-white flex items-center justify-center font-bold text-sm shadow-xs">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900 dark:text-[#E8EEF5] tracking-tight">
                    Digital Onboarding &amp; KYC Workspace
                  </h1>
                  <span className="px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-medium">
                    Institutional Tier
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-[#101C2A] text-slate-600 dark:text-[#A9BACB] border border-slate-200 dark:border-[#33485D] text-[11px] font-mono">
                    RBI Master Direction 2026
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-[#8194A8] mt-0.5">
                  End-to-end customer onboarding, synthetic KYC verification, corporate KYB diligence, document review, and SLA governance.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              icon={<RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />}
              onClick={fetchData}
              disabled={isLoading}
            >
              Sync Data
            </Button>
            <Button
              size="sm"
              variant="primary"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={() => setIsNewModalOpen(true)}
            >
              New Application
            </Button>
          </div>
        </div>

        {/* Compact Key Metric Ribbon */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-4 pt-4 border-t border-slate-100 dark:border-[#1F334A]">
            <div className="bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded p-2.5">
              <div className="text-[11px] font-medium text-slate-500 dark:text-[#8194A8]">Active Pipeline</div>
              <div className="text-lg font-bold text-slate-900 dark:text-[#E8EEF5] font-mono mt-0.5">
                {metrics.totalApplications}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{metrics.submittedCount} new submitted</div>
            </div>

            <div className="bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded p-2.5">
              <div className="text-[11px] font-medium text-slate-500 dark:text-[#8194A8]">Individual KYC Queue</div>
              <div className="text-lg font-bold text-amber-600 dark:text-amber-400 font-mono mt-0.5">
                {metrics.kycPendingCount}
              </div>
              <div className="text-[10px] text-amber-600 dark:text-amber-400 mt-0.5">Awaiting verification</div>
            </div>

            <div className="bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded p-2.5">
              <div className="text-[11px] font-medium text-slate-500 dark:text-[#8194A8]">Business KYB Queue</div>
              <div className="text-lg font-bold text-indigo-600 dark:text-indigo-400 font-mono mt-0.5">
                {metrics.kybPendingCount}
              </div>
              <div className="text-[10px] text-indigo-600 dark:text-indigo-400 mt-0.5">Entity / UBO check</div>
            </div>

            <div className="bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded p-2.5">
              <div className="text-[11px] font-medium text-slate-500 dark:text-[#8194A8]">Compliance Review</div>
              <div className="text-lg font-bold text-purple-600 dark:text-purple-400 font-mono mt-0.5">
                {metrics.complianceReviewCount}
              </div>
              <div className="text-[10px] text-purple-600 dark:text-purple-400 mt-0.5">Dual check stage</div>
            </div>

            <div className="bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded p-2.5">
              <div className="text-[11px] font-medium text-slate-500 dark:text-[#8194A8]">Open Exceptions</div>
              <div className="text-lg font-bold text-rose-600 dark:text-rose-400 font-mono mt-0.5 flex items-center gap-1">
                {metrics.openExceptionsCount}
                {metrics.openExceptionsCount > 0 && <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />}
              </div>
              <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-0.5">Action required</div>
            </div>

            <div className="bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded p-2.5">
              <div className="text-[11px] font-medium text-slate-500 dark:text-[#8194A8]">SLA Status</div>
              <div className="text-lg font-bold font-mono mt-0.5 flex items-center gap-1.5">
                <span className="text-amber-600 dark:text-amber-400">{metrics.slaAtRiskCount}</span>
                <span className="text-slate-300 dark:text-[#33485D] font-normal">/</span>
                <span className="text-rose-600 dark:text-rose-400">{metrics.slaBreachedCount}</span>
              </div>
              <div className="text-[10px] text-slate-500 dark:text-[#8194A8] mt-0.5">At Risk / Breached</div>
            </div>

            <div className="bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded p-2.5">
              <div className="text-[11px] font-medium text-slate-500 dark:text-[#8194A8]">Completion Rate</div>
              <div className="text-lg font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                {metrics.completionRatePercent}%
              </div>
              <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">{metrics.completedCount} onboarded</div>
            </div>
          </div>
        )}
      </div>

      {/* Sub-Section Navigation Tabs & Search */}
      <div className="bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded p-1.5 shadow-2xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          {[
            { id: 'applications', label: `Applications (${metrics?.totalApplications || 0})` },
            { id: 'kyc-queue', label: `KYC Queue (${metrics?.kycPendingCount || 0})` },
            { id: 'kyb-queue', label: `KYB Review (${metrics?.kybPendingCount || 0})` },
            { id: 'documents', label: 'Document Management' },
            { id: 'exceptions', label: `Exceptions (${metrics?.openExceptionsCount || 0})` },
            { id: 'sla-performance', label: 'SLA & Compliance Tracker' },
          ].map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id as SubSectionType);
                  setPage(1);
                }}
                className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
                  isActive
                    ? 'bg-[#142C45] dark:bg-[#1B9D92] text-white shadow-xs font-semibold'
                    : 'text-slate-600 dark:text-[#A9BACB] hover:text-slate-900 dark:hover:text-[#E8EEF5] hover:bg-slate-100 dark:hover:bg-[#192B3D]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-[#8194A8]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search app #, name, branch..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-[#101C2A] border border-slate-300 dark:border-[#33485D] rounded text-slate-900 dark:text-[#E8EEF5] focus:outline-none focus:ring-1 focus:ring-[#168C83]"
          />
        </div>
      </div>

      {/* Structured Filter Bar */}
      {activeTab !== 'sla-performance' && (
        <div className="bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded p-3 shadow-2xs flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 dark:text-[#8194A8] font-medium">
            <Filter className="w-3.5 h-3.5" />
            Filters:
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-[#8194A8]">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="py-1 px-2 bg-slate-50 dark:bg-[#101C2A] border border-slate-300 dark:border-[#33485D] rounded text-slate-800 dark:text-[#E8EEF5] text-xs focus:ring-1 focus:ring-[#168C83]"
            >
              <option value="ALL">All Statuses</option>
              <option value="SUBMITTED">Submitted</option>
              <option value="DOCUMENT_REVIEW">Document Review</option>
              <option value="KYC_REVIEW">KYC Review</option>
              <option value="ADDITIONAL_INFORMATION">Info Required</option>
              <option value="COMPLIANCE_REVIEW">Compliance Review</option>
              <option value="APPROVED">Approved</option>
              <option value="COMPLETED">Completed</option>
              <option value="REJECTED">Rejected</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-[#8194A8]">Type:</span>
            <select
              value={selectedCustomerType}
              onChange={(e) => {
                setSelectedCustomerType(e.target.value);
                setPage(1);
              }}
              className="py-1 px-2 bg-slate-50 dark:bg-[#101C2A] border border-slate-300 dark:border-[#33485D] rounded text-slate-800 dark:text-[#E8EEF5] text-xs focus:ring-1 focus:ring-[#168C83]"
            >
              <option value="ALL">All Types</option>
              <option value="INDIVIDUAL">Individual (Retail / HNI)</option>
              <option value="BUSINESS">Corporate / Business (MSME / Mid-Corp)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-[#8194A8]">Priority:</span>
            <select
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                setPage(1);
              }}
              className="py-1 px-2 bg-slate-50 dark:bg-[#101C2A] border border-slate-300 dark:border-[#33485D] rounded text-slate-800 dark:text-[#E8EEF5] text-xs focus:ring-1 focus:ring-[#168C83]"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500 dark:text-[#8194A8]">SLA:</span>
            <select
              value={selectedSlaStatus}
              onChange={(e) => {
                setSelectedSlaStatus(e.target.value);
                setPage(1);
              }}
              className="py-1 px-2 bg-slate-50 dark:bg-[#101C2A] border border-slate-300 dark:border-[#33485D] rounded text-slate-800 dark:text-[#E8EEF5] text-xs focus:ring-1 focus:ring-[#168C83]"
            >
              <option value="ALL">All SLA Statuses</option>
              <option value="ON_TRACK">On Track</option>
              <option value="AT_RISK">At Risk (&lt;12h)</option>
              <option value="BREACHED">Breached</option>
            </select>
          </div>

          {(selectedStatus !== 'ALL' ||
            selectedCustomerType !== 'ALL' ||
            selectedPriority !== 'ALL' ||
            selectedSlaStatus !== 'ALL' ||
            searchQuery) && (
            <button
              onClick={() => {
                setSelectedStatus('ALL');
                setSelectedCustomerType('ALL');
                setSelectedPriority('ALL');
                setSelectedSlaStatus('ALL');
                setSearchQuery('');
                setPage(1);
              }}
              className="ml-auto text-[#168C83] dark:text-[#1B9D92] hover:underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'sla-performance' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-[#E8EEF5]">SLA Performance Matrix</h3>
                <p className="text-xs text-slate-500 dark:text-[#8194A8]">Benchmark processing time across onboarding stages</p>
              </div>
              <span className="text-xs font-mono font-medium px-2 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded">
                Avg: 28h (Target: &le; 48h)
              </span>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-[#A9BACB] mb-1">
                  <span>Initial Document Intake &amp; OCR</span>
                  <span className="font-mono">4.2h / 8h limit (96% on-time)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-[#101C2A] rounded-full h-2">
                  <div className="bg-[#168C83] h-2 rounded-full" style={{ width: '52%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-[#A9BACB] mb-1">
                  <span>Synthetic Pan / CKYC / Aadhaar Check</span>
                  <span className="font-mono">2.1h / 4h limit (99% on-time)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-[#101C2A] rounded-full h-2">
                  <div className="bg-[#168C83] h-2 rounded-full" style={{ width: '48%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-[#A9BACB] mb-1">
                  <span>Corporate KYB &amp; UBO Verification</span>
                  <span className="font-mono">18.5h / 24h limit (84% on-time)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-[#101C2A] rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: '77%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-[#A9BACB] mb-1">
                  <span>Exception Resolution &amp; Document Replacement</span>
                  <span className="font-mono">22.8h / 24h limit (71% on-time)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-[#101C2A] rounded-full h-2">
                  <div className="bg-rose-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 dark:text-[#A9BACB] mb-1">
                  <span>Compliance Final Sign-off (Dual Control)</span>
                  <span className="font-mono">5.6h / 12h limit (94% on-time)</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-[#101C2A] rounded-full h-2">
                  <div className="bg-[#168C83] h-2 rounded-full" style={{ width: '46%' }}></div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 dark:border-[#1F334A] text-xs text-slate-500 dark:text-[#8194A8] space-y-1.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#168C83]" />
                <span className="font-semibold text-slate-700 dark:text-[#E8EEF5]">Audit &amp; Regulatory Standard:</span>
                <span>Enforced dual-authorization on approvals; zero PII leakage policy.</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded p-5 shadow-2xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-[#E8EEF5]">SLA Breach Mitigation Actions</h3>
            <div className="space-y-2.5">
              <div className="p-3 bg-rose-50/70 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded text-xs space-y-1">
                <div className="font-bold text-rose-900 dark:text-rose-200 flex items-center justify-between">
                  <span>ONB-2026-00185 (Sunil Varma)</span>
                  <span className="font-mono text-[10px] text-rose-700 dark:text-rose-300">BREACHED</span>
                </div>
                <p className="text-slate-600 dark:text-[#A9BACB] text-[11px]">
                  Pending since 52 hours due to passport expiry exception.
                </p>
                <button
                  onClick={() => handleOpenAppDetails('ONB-2026-00185')}
                  className="text-rose-800 dark:text-rose-300 hover:underline font-semibold text-[11px] mt-1 block"
                >
                  Open Dossier &rarr;
                </button>
              </div>

              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded text-xs space-y-1">
                <div className="font-bold text-amber-900 dark:text-amber-200 flex items-center justify-between">
                  <span>ONB-2026-00183 (Vikram Malhotra)</span>
                  <span className="font-mono text-[10px] text-amber-700 dark:text-amber-300">8h REMAINING</span>
                </div>
                <p className="text-slate-600 dark:text-[#A9BACB] text-[11px]">
                  Aadhaar address verification discrepancy awaiting RM outreach.
                </p>
                <button
                  onClick={() => handleOpenAppDetails('ONB-2026-00183')}
                  className="text-amber-800 dark:text-amber-300 hover:underline font-semibold text-[11px] mt-1 block"
                >
                  Open Dossier &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded shadow-2xs overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500 dark:text-[#8194A8]">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-[#168C83] mb-2" />
              <p className="text-xs font-medium">Loading onboarding records...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-rose-500" />
              <p className="text-xs font-semibold">{error}</p>
              <button
                onClick={() => fetchData()}
                className="mt-3 px-3 py-1 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded text-xs font-medium hover:bg-rose-100"
              >
                Retry
              </button>
            </div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center text-slate-500 dark:text-[#8194A8]">
              <UserCheck className="w-8 h-8 mx-auto text-slate-300 dark:text-[#8194A8] mb-2" />
              <p className="text-sm font-semibold text-slate-700 dark:text-[#E8EEF5]">No applications match criteria</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Adjust search keywords or filter criteria to view onboarding records.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 dark:bg-[#101C2A] border-b border-slate-200 dark:border-[#33485D] text-[11px] font-semibold text-slate-600 dark:text-[#A9BACB]">
                    <th className="py-2.5 px-3">App Number</th>
                    <th className="py-2.5 px-3">Applicant Name</th>
                    <th className="py-2.5 px-3">Type</th>
                    <th className="py-2.5 px-3">Status</th>
                    <th className="py-2.5 px-3">KYC / KYB</th>
                    <th className="py-2.5 px-3">Exceptions</th>
                    <th className="py-2.5 px-3">Assigned RM</th>
                    <th className="py-2.5 px-3">SLA Deadline</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-[#1F334A] bg-white dark:bg-[#162638]">
                  {applications.map((app) => (
                    <tr
                      key={app.id}
                      onClick={() => handleOpenAppDetails(app.id)}
                      className="hover:bg-slate-50 dark:hover:bg-[#192B3D] transition-colors cursor-pointer group"
                    >
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900 dark:text-[#E8EEF5]">
                        {app.applicationNumber}
                      </td>

                      <td className="py-2.5 px-3">
                        <div
                          className={`font-semibold text-slate-900 dark:text-[#E8EEF5] group-hover:text-[#168C83] dark:group-hover:text-[#1B9D92] ${
                            onNavigateToCustomer && app.customerCode ? 'hover:underline cursor-pointer' : ''
                          }`}
                          onClick={(e) => {
                            if (onNavigateToCustomer && app.customerCode) {
                              e.stopPropagation();
                              onNavigateToCustomer(app.customerCode);
                            }
                          }}
                        >
                          {app.applicantName}
                        </div>
                        <div className="text-[11px] text-slate-400 dark:text-[#8194A8] flex items-center gap-1.5 mt-0.5">
                          <span>{app.branchName}</span>
                          {app.customerCode && (
                            <span className="font-mono text-slate-500 dark:text-[#A9BACB]">({app.customerCode})</span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          {app.customerType === 'BUSINESS' ? (
                            <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5 text-[#168C83]" />
                          )}
                          <span className="font-medium text-slate-700 dark:text-[#A9BACB]">
                            {app.customerType === 'BUSINESS' ? 'Corporate' : 'Individual'}
                          </span>
                        </div>
                        <div className="mt-1">{renderPriorityBadge(app.priority)}</div>
                      </td>

                      <td className="py-2.5 px-3">{renderStatusBadge(app.status)}</td>

                      <td className="py-2.5 px-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-slate-400 dark:text-[#8194A8] font-medium">KYC:</span>
                            <span
                              className={`font-semibold ${
                                app.kycStatus === 'VERIFIED'
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : app.kycStatus === 'FAILED'
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              {app.kycStatus.replace(/_/g, ' ')}
                            </span>
                          </div>

                          {app.customerType === 'BUSINESS' && (
                            <div className="flex items-center gap-1 text-[11px]">
                              <span className="text-slate-400 dark:text-[#8194A8] font-medium">KYB:</span>
                              <span
                                className={`font-semibold ${
                                  app.kybStatus === 'VERIFIED'
                                    ? 'text-emerald-600 dark:text-emerald-400'
                                    : app.kybStatus === 'FAILED'
                                    ? 'text-rose-600 dark:text-rose-400'
                                    : 'text-amber-600 dark:text-amber-400'
                                }`}
                              >
                                {app.kybStatus.replace(/_/g, ' ')}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        {app.exceptionCount > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900 rounded text-[11px] font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            {app.exceptionCount} open
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 dark:text-[#8194A8] text-[11px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            None
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-slate-700 dark:text-[#A9BACB]">
                        <div className="font-medium text-slate-900 dark:text-[#E8EEF5]">{app.assignedRmName || 'Unassigned'}</div>
                        <div className="text-[10px] text-slate-400 dark:text-[#8194A8] font-mono">{app.branchCode}</div>
                      </td>

                      <td className="py-2.5 px-3">
                        {renderSlaBadge(app.slaStatus, app.slaHoursRemaining)}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAppDetails(app.id);
                          }}
                        >
                          Review
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          <div className="bg-slate-50 dark:bg-[#101C2A] border-t border-slate-200 dark:border-[#33485D] px-4 py-2.5 flex items-center justify-between text-xs text-slate-500 dark:text-[#8194A8]">
            <div>
              Showing <span className="font-semibold text-slate-800 dark:text-[#E8EEF5]">{applications.length}</span> of{' '}
              <span className="font-semibold text-slate-800 dark:text-[#E8EEF5]">{totalCount}</span> applications
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="xs"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                icon={<ChevronLeft className="w-3 h-3" />}
              >
                Previous
              </Button>
              <span className="font-mono text-slate-600 dark:text-[#A9BACB]">
                Page {page} of {totalPages}
              </span>
              <Button
                size="xs"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <span>Next</span>
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Detail Drawer */}
      <OnboardingDetailDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setSelectedApp(null);
        }}
        application={selectedApp}
        onRefreshApp={handleRefreshApp}
        onNavigateToCustomer={onNavigateToCustomer}
        onReviewDoc={(doc) => setReviewingDoc(doc)}
        onRaiseException={(app) => setExceptionTargetApp(app)}
        onResolveException={(exc) => setResolvingException(exc)}
        onWaiveException={(exc) => setWaivingException(exc)}
        onReassign={(app) => setReassignTargetApp(app)}
      />

      {/* Modals */}
      {isNewModalOpen && (
        <NewApplicationModal
          isOpen={isNewModalOpen}
          onClose={() => setIsNewModalOpen(false)}
          onSuccess={(created) => {
            setIsNewModalOpen(false);
            fetchData();
            handleOpenAppDetails(created.id);
          }}
        />
      )}

      {reviewingDoc && (
        <DocumentReviewModal
          isOpen={Boolean(reviewingDoc)}
          onClose={() => setReviewingDoc(null)}
          document={reviewingDoc}
          onSuccess={() => {
            setReviewingDoc(null);
            handleRefreshApp();
          }}
        />
      )}

      {exceptionTargetApp && (
        <RaiseExceptionModal
          isOpen={Boolean(exceptionTargetApp)}
          onClose={() => setExceptionTargetApp(null)}
          application={exceptionTargetApp}
          onSuccess={() => {
            setExceptionTargetApp(null);
            handleRefreshApp();
          }}
        />
      )}

      {resolvingException && (
        <ResolveExceptionModal
          isOpen={Boolean(resolvingException)}
          onClose={() => setResolvingException(null)}
          exception={resolvingException}
          onSuccess={() => {
            setResolvingException(null);
            handleRefreshApp();
          }}
        />
      )}

      {waivingException && (
        <WaiveExceptionModal
          isOpen={Boolean(waivingException)}
          onClose={() => setWaivingException(null)}
          exception={waivingException}
          onSuccess={() => {
            setWaivingException(null);
            handleRefreshApp();
          }}
        />
      )}

      {reassignTargetApp && (
        <ReassignModal
          isOpen={Boolean(reassignTargetApp)}
          onClose={() => setReassignTargetApp(null)}
          application={reassignTargetApp}
          onSuccess={() => {
            setReassignTargetApp(null);
            handleRefreshApp();
          }}
        />
      )}
    </div>
  );
};
