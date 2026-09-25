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
} from 'lucide-react';
import { OnboardingDetailDrawer } from './OnboardingDetailDrawer';
import { NewApplicationModal } from './NewApplicationModal';
import { DocumentReviewModal } from './DocumentReviewModal';
import { RaiseExceptionModal } from './RaiseExceptionModal';
import { ResolveExceptionModal } from './ResolveExceptionModal';
import { WaiveExceptionModal } from './WaiveExceptionModal';
import { ReassignModal } from './ReassignModal';

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
          search: searchQuery,
          status: selectedStatus,
          customerType: selectedCustomerType,
          priority: selectedPriority,
          slaStatus: selectedSlaStatus,
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
    const map: Record<OnboardingStatus, { label: string; bg: string; text: string; border: string }> = {
      DRAFT: { label: 'Draft', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
      SUBMITTED: { label: 'Submitted', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
      DOCUMENT_REVIEW: { label: 'Doc Review', bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
      KYC_REVIEW: { label: 'KYC Review', bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
      ADDITIONAL_INFORMATION: { label: 'Info Requested', bg: 'bg-orange-50', text: 'text-orange-700', border: 'border-orange-200' },
      COMPLIANCE_REVIEW: { label: 'Compliance', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
      APPROVED: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
      REJECTED: { label: 'Rejected', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
      WITHDRAWN: { label: 'Withdrawn', bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
      COMPLETED: { label: 'Completed', bg: 'bg-teal-50', text: 'text-teal-700', border: 'border-teal-200' },
    };
    const c = map[status] || { label: status, bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' };
    return (
      <span className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium border ${c.bg} ${c.text} ${c.border} whitespace-nowrap`}>
        {c.label}
      </span>
    );
  };

  // SLA Badge Helper
  const renderSlaBadge = (status: 'ON_TRACK' | 'AT_RISK' | 'BREACHED', remainingHours: number) => {
    if (status === 'BREACHED') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-red-50 text-red-700 border border-red-200">
          <AlertOctagon className="w-3 h-3 text-red-600" />
          Breached
        </span>
      );
    }
    if (status === 'AT_RISK') {
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
          <Clock className="w-3 h-3 text-amber-600" />
          {remainingHours}h left
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
        <Clock className="w-3 h-3 text-emerald-600" />
        {remainingHours}h left
      </span>
    );
  };

  // Priority Badge Helper
  const renderPriorityBadge = (priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT') => {
    const colors: Record<string, string> = {
      URGENT: 'text-red-700 bg-red-50 border-red-200',
      HIGH: 'text-orange-700 bg-orange-50 border-orange-200',
      MEDIUM: 'text-slate-700 bg-slate-50 border-slate-200',
      LOW: 'text-gray-600 bg-gray-50 border-gray-200',
    };
    return (
      <span className={`inline-flex px-1.5 py-0.5 rounded text-[10px] font-medium border uppercase tracking-wider ${colors[priority] || colors.MEDIUM}`}>
        {priority}
      </span>
    );
  };

  return (
    <div className="space-y-4 pb-12">
      {/* Institutional Header */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-md bg-blue-900 text-white flex items-center justify-center font-bold text-sm shadow-xs">
                <UserCheck className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold text-slate-900 tracking-tight">
                    Digital Onboarding & KYC Workspace
                  </h1>
                  <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800 border border-blue-200 text-xs font-medium">
                    Institutional Tier
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-mono">
                    RBI Master Direction 2026
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  End-to-end customer onboarding, synthetic KYC verification, corporate KYB diligence, document review, and SLA governance.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchData()}
              disabled={isLoading}
              className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Refresh Workspace"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-blue-600' : ''}`} />
              Sync Data
            </button>
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="px-3.5 py-2 text-xs font-medium text-white bg-blue-900 hover:bg-blue-800 rounded-md transition-colors flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              New Application
            </button>
          </div>
        </div>

        {/* Compact Key Metric Ribbon */}
        {metrics && (
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 mt-5 pt-4 border-t border-slate-100">
            <div className="bg-slate-50/70 border border-slate-200/80 rounded p-2.5">
              <div className="text-[11px] font-medium text-slate-500">Active Pipeline</div>
              <div className="text-lg font-bold text-slate-900 font-mono mt-0.5">
                {metrics.totalApplications}
              </div>
              <div className="text-[10px] text-slate-400 mt-0.5">{metrics.submittedCount} new submitted</div>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/80 rounded p-2.5">
              <div className="text-[11px] font-medium text-slate-500">Individual KYC Queue</div>
              <div className="text-lg font-bold text-amber-700 font-mono mt-0.5">
                {metrics.kycPendingCount}
              </div>
              <div className="text-[10px] text-amber-600 mt-0.5">Awaiting verification</div>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/80 rounded p-2.5">
              <div className="text-[11px] font-medium text-slate-500">Business KYB Queue</div>
              <div className="text-lg font-bold text-indigo-700 font-mono mt-0.5">
                {metrics.kybPendingCount}
              </div>
              <div className="text-[10px] text-indigo-600 mt-0.5">Entity / UBO check</div>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/80 rounded p-2.5">
              <div className="text-[11px] font-medium text-slate-500">Compliance Review</div>
              <div className="text-lg font-bold text-purple-700 font-mono mt-0.5">
                {metrics.complianceReviewCount}
              </div>
              <div className="text-[10px] text-purple-600 mt-0.5">Dual check stage</div>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/80 rounded p-2.5">
              <div className="text-[11px] font-medium text-slate-500">Open Exceptions</div>
              <div className="text-lg font-bold text-red-700 font-mono mt-0.5 flex items-center gap-1">
                {metrics.openExceptionsCount}
                {metrics.openExceptionsCount > 0 && <AlertTriangle className="w-3.5 h-3.5 text-red-600" />}
              </div>
              <div className="text-[10px] text-red-600 mt-0.5">Action required</div>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/80 rounded p-2.5">
              <div className="text-[11px] font-medium text-slate-500">SLA Status</div>
              <div className="text-lg font-bold font-mono mt-0.5 flex items-center gap-1.5">
                <span className="text-amber-700">{metrics.slaAtRiskCount}</span>
                <span className="text-slate-300 font-normal">/</span>
                <span className="text-red-700">{metrics.slaBreachedCount}</span>
              </div>
              <div className="text-[10px] text-slate-500 mt-0.5">At Risk / Breached</div>
            </div>

            <div className="bg-slate-50/70 border border-slate-200/80 rounded p-2.5">
              <div className="text-[11px] font-medium text-slate-500">Completion Rate</div>
              <div className="text-lg font-bold text-emerald-700 font-mono mt-0.5">
                {metrics.completionRatePercent}%
              </div>
              <div className="text-[10px] text-emerald-600 mt-0.5">{metrics.completedCount} accounts onboarded</div>
            </div>
          </div>
        )}
      </div>

      {/* Sub-Section Navigation Tabs */}
      <div className="bg-white border border-slate-200 rounded-lg p-1.5 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => {
              setActiveTab('applications');
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'applications'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Applications ({metrics?.totalApplications || 0})
          </button>
          <button
            onClick={() => {
              setActiveTab('kyc-queue');
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'kyc-queue'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            KYC Queue ({metrics?.kycPendingCount || 0})
          </button>
          <button
            onClick={() => {
              setActiveTab('kyb-queue');
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'kyb-queue'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            KYB Review ({metrics?.kybPendingCount || 0})
          </button>
          <button
            onClick={() => {
              setActiveTab('documents');
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'documents'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Document Management
          </button>
          <button
            onClick={() => {
              setActiveTab('exceptions');
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'exceptions'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            Exceptions & Blockers ({metrics?.openExceptionsCount || 0})
          </button>
          <button
            onClick={() => {
              setActiveTab('sla-performance');
              setPage(1);
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded transition-colors whitespace-nowrap cursor-pointer ${
              activeTab === 'sla-performance'
                ? 'bg-blue-900 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            SLA & Compliance Tracker
          </button>
        </div>

        {/* Global Search Bar */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search app #, name, branch..."
            className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-blue-900 focus:border-blue-900 transition-colors"
          />
        </div>
      </div>

      {/* Structured Filter Bar (Only for Applications/KYC/KYB/Docs) */}
      {activeTab !== 'sla-performance' && (
        <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-xs flex flex-wrap items-center gap-3 text-xs">
          <div className="flex items-center gap-1.5 text-slate-500 font-medium">
            <Filter className="w-3.5 h-3.5" />
            Filters:
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Status:</span>
            <select
              value={selectedStatus}
              onChange={(e) => {
                setSelectedStatus(e.target.value);
                setPage(1);
              }}
              className="py-1 px-2 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs focus:ring-1 focus:ring-blue-900"
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
            <span className="text-slate-500">Type:</span>
            <select
              value={selectedCustomerType}
              onChange={(e) => {
                setSelectedCustomerType(e.target.value);
                setPage(1);
              }}
              className="py-1 px-2 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs focus:ring-1 focus:ring-blue-900"
            >
              <option value="ALL">All Types</option>
              <option value="INDIVIDUAL">Individual (Retail / HNI)</option>
              <option value="BUSINESS">Corporate / Business (MSME / Mid-Corp)</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">Priority:</span>
            <select
              value={selectedPriority}
              onChange={(e) => {
                setSelectedPriority(e.target.value);
                setPage(1);
              }}
              className="py-1 px-2 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs focus:ring-1 focus:ring-blue-900"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-slate-500">SLA:</span>
            <select
              value={selectedSlaStatus}
              onChange={(e) => {
                setSelectedSlaStatus(e.target.value);
                setPage(1);
              }}
              className="py-1 px-2 bg-slate-50 border border-slate-200 rounded text-slate-700 text-xs focus:ring-1 focus:ring-blue-900"
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
              className="ml-auto text-blue-700 hover:underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      )}

      {/* Main Content Area */}
      {activeTab === 'sla-performance' ? (
        /* SLA & Compliance Governance View */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">SLA Performance Matrix</h3>
                <p className="text-xs text-slate-500">Benchmark processing time across onboarding stages</p>
              </div>
              <span className="text-xs font-mono font-medium px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                Avg: 28h (Target: &le; 48h)
              </span>
            </div>

            <div className="space-y-3 pt-2">
              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Initial Document Intake &amp; OCR</span>
                  <span className="font-mono">4.2h / 8h limit (96% on-time)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '52%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Synthetic Pan / CKYC / Aadhaar Check</span>
                  <span className="font-mono">2.1h / 4h limit (99% on-time)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '48%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Corporate KYB &amp; UBO Verification</span>
                  <span className="font-mono">18.5h / 24h limit (84% on-time)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-amber-500 h-2 rounded-full" style={{ width: '77%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Exception Resolution &amp; Document Replacement</span>
                  <span className="font-mono">22.8h / 24h limit (71% on-time)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-red-500 h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-medium text-slate-700 mb-1">
                  <span>Compliance Final Sign-off (Dual Control)</span>
                  <span className="font-mono">5.6h / 12h limit (94% on-time)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div className="bg-emerald-600 h-2 rounded-full" style={{ width: '46%' }}></div>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 text-xs text-slate-500 space-y-1.5">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-900" />
                <span className="font-semibold text-slate-700">Audit &amp; Regulatory Standard:</span>
                <span>Enforced dual-authorization on approvals; zero PII leakage policy.</span>
              </div>
              <p className="text-[11px] text-slate-400">
                All verification records are synchronized directly with COREvia statutory audit trail and relationship management timelines.
              </p>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-xs space-y-4">
            <h3 className="text-sm font-bold text-slate-900">SLA Breach Mitigation Actions</h3>
            <div className="space-y-2.5">
              <div className="p-3 bg-red-50/70 border border-red-200 rounded text-xs space-y-1">
                <div className="font-bold text-red-900 flex items-center justify-between">
                  <span>ONB-2026-00185 (Sunil Varma)</span>
                  <span className="font-mono text-[10px] text-red-700">BREACHED</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Pending since 52 hours due to passport expiry exception.
                </p>
                <button
                  onClick={() => handleOpenAppDetails('ONB-2026-00185')}
                  className="text-red-800 hover:underline font-semibold text-[11px] mt-1 block"
                >
                  Open Dossier &rarr;
                </button>
              </div>

              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded text-xs space-y-1">
                <div className="font-bold text-amber-900 flex items-center justify-between">
                  <span>ONB-2026-00183 (Vikram Malhotra)</span>
                  <span className="font-mono text-[10px] text-amber-700">8h REMAINING</span>
                </div>
                <p className="text-slate-600 text-[11px]">
                  Aadhaar address verification discrepancy awaiting RM outreach.
                </p>
                <button
                  onClick={() => handleOpenAppDetails('ONB-2026-00183')}
                  className="text-amber-800 hover:underline font-semibold text-[11px] mt-1 block"
                >
                  Open Dossier &rarr;
                </button>
              </div>

              <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs">
                <div className="font-medium text-slate-700">Automated Escalation Rule</div>
                <p className="text-slate-500 text-[11px] mt-0.5">
                  Applications crossing 36h without resolution automatically generate high-priority operational tasks to Branch Operations Manager.
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Applications / Queue Table */
        <div className="bg-white border border-slate-200 rounded-lg shadow-xs overflow-hidden">
          {isLoading ? (
            <div className="p-12 text-center text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-blue-900 mb-2" />
              <p className="text-xs font-medium">Loading onboarding records...</p>
            </div>
          ) : error ? (
            <div className="p-8 text-center text-red-600">
              <AlertTriangle className="w-6 h-6 mx-auto mb-2 text-red-500" />
              <p className="text-xs font-semibold">{error}</p>
              <button
                onClick={() => fetchData()}
                className="mt-3 px-3 py-1 bg-red-50 text-red-700 border border-red-200 rounded text-xs font-medium hover:bg-red-100"
              >
                Retry
              </button>
            </div>
          ) : applications.length === 0 ? (
            <div className="p-12 text-center text-slate-500">
              <UserCheck className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No applications match your query</p>
              <p className="text-xs text-slate-400 mt-0.5">
                Adjust search keywords or filter criteria to view onboarding records.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-semibold text-slate-600">
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
                <tbody className="divide-y divide-slate-100">
                  {applications.map((app) => (
                    <tr
                      key={app.id}
                      onClick={() => handleOpenAppDetails(app.id)}
                      className="hover:bg-blue-50/30 transition-colors cursor-pointer group"
                    >
                      <td className="py-2.5 px-3 font-mono font-semibold text-slate-900">
                        {app.applicationNumber}
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="font-semibold text-slate-900 group-hover:text-blue-900">
                          {app.applicantName}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                          <span>{app.branchName}</span>
                          {app.customerCode && (
                            <span className="font-mono text-slate-500">({app.customerCode})</span>
                          )}
                        </div>
                      </td>

                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1">
                          {app.customerType === 'BUSINESS' ? (
                            <Building2 className="w-3.5 h-3.5 text-indigo-600" />
                          ) : (
                            <UserCheck className="w-3.5 h-3.5 text-blue-600" />
                          )}
                          <span className="font-medium text-slate-700">
                            {app.customerType === 'BUSINESS' ? 'Corporate' : 'Individual'}
                          </span>
                        </div>
                        <div className="mt-1">{renderPriorityBadge(app.priority)}</div>
                      </td>

                      <td className="py-2.5 px-3">{renderStatusBadge(app.status)}</td>

                      <td className="py-2.5 px-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1 text-[11px]">
                            <span className="text-slate-400 font-medium">KYC:</span>
                            <span
                              className={`font-semibold ${
                                app.kycStatus === 'VERIFIED'
                                  ? 'text-emerald-700'
                                  : app.kycStatus === 'FAILED'
                                  ? 'text-red-700'
                                  : app.kycStatus === 'ADDITIONAL_INFORMATION_REQUIRED'
                                  ? 'text-orange-700'
                                  : 'text-amber-700'
                              }`}
                            >
                              {app.kycStatus.replace(/_/g, ' ')}
                            </span>
                          </div>

                          {app.customerType === 'BUSINESS' && (
                            <div className="flex items-center gap-1 text-[11px]">
                              <span className="text-slate-400 font-medium">KYB:</span>
                              <span
                                className={`font-semibold ${
                                  app.kybStatus === 'VERIFIED'
                                    ? 'text-emerald-700'
                                    : app.kybStatus === 'FAILED'
                                    ? 'text-red-700'
                                    : 'text-amber-700'
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
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-red-50 text-red-700 border border-red-200 rounded text-[11px] font-bold">
                            <AlertTriangle className="w-3 h-3" />
                            {app.exceptionCount} open
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-slate-400 text-[11px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                            None
                          </span>
                        )}
                      </td>

                      <td className="py-2.5 px-3 text-slate-700">
                        <div className="font-medium">{app.assignedRmName || 'Unassigned'}</div>
                        <div className="text-[10px] text-slate-400">{app.branchCode}</div>
                      </td>

                      <td className="py-2.5 px-3">
                        {renderSlaBadge(app.slaStatus, app.slaHoursRemaining)}
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenAppDetails(app.id);
                          }}
                          className="px-2.5 py-1 bg-white border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-[11px] font-medium shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                        >
                          Review
                          <ChevronRight className="w-3 h-3 text-slate-400" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination Footer */}
          <div className="bg-slate-50/70 border-t border-slate-200 px-4 py-2.5 flex items-center justify-between text-xs text-slate-500">
            <div>
              Showing <span className="font-semibold text-slate-800">{applications.length}</span> of{' '}
              <span className="font-semibold text-slate-800">{totalCount}</span> applications
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50 text-slate-700 cursor-pointer"
              >
                Previous
              </button>
              <span className="font-mono text-slate-600">
                Page {page} of {totalPages}
              </span>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-2.5 py-1 bg-white border border-slate-200 rounded disabled:opacity-40 hover:bg-slate-50 text-slate-700 cursor-pointer"
              >
                Next
              </button>
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
