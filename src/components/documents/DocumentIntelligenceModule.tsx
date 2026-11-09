import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Download,
  Eye,
  RefreshCw,
  Sparkles,
  Shield,
  Layers,
  ArrowRight,
  UserCheck,
  Building,
  Calendar,
} from 'lucide-react';
import { StatCard } from '../common/StatCard';
import { UploadDocumentModal } from './UploadDocumentModal';
import { DocumentDetailDrawer } from './DocumentDetailDrawer';
import { DocumentCategory, DocumentType, DocumentStatus, DocumentReviewStatus } from '../../types';
import { bankingApi } from '../../lib/api';

type DocumentSubSection = 'VAULT' | 'QUEUE' | 'RADAR' | 'INTELLIGENCE';

export const DocumentIntelligenceModule: React.FC = () => {
  const [subSection, setSubSection] = useState<DocumentSubSection>('VAULT');
  const [metrics, setMetrics] = useState<any | null>(null);
  const [documents, setDocuments] = useState<any[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Intelligence signals state
  const [intelligenceSignals, setIntelligenceSignals] = useState<any | null>(null);

  // Filter states
  const [search, setSearch] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedDocType, setSelectedDocType] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedReviewStatus, setSelectedReviewStatus] = useState<string>('');
  const [expiryFilter, setExpiryFilter] = useState<string>('');

  // Modals & Drawers
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);

  // Load Metrics
  const loadMetrics = async () => {
    try {
      const data = await bankingApi.getDocumentMetrics();
      setMetrics(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Load Intelligence Signals
  const loadIntelligence = async () => {
    try {
      const data = await bankingApi.getDocumentIntelligence();
      setIntelligenceSignals(data);
    } catch (err) {
      console.error(err);
    }
  };

  // Load Documents based on active subsection & filters
  const loadDocuments = async () => {
    setIsLoading(true);
    try {
      const params: Record<string, any> = {
        page,
        limit: 15,
      };

      if (search) params.search = search;
      if (selectedCategory) params.category = selectedCategory;
      if (selectedDocType) params.documentType = selectedDocType;
      if (selectedStatus) params.status = selectedStatus;
      if (selectedReviewStatus) params.reviewStatus = selectedReviewStatus;
      if (expiryFilter) params.expiryFilter = expiryFilter;

      // Section specific preset filters
      if (subSection === 'QUEUE') {
        params.reviewStatus = 'PENDING';
      } else if (subSection === 'RADAR') {
        params.subsection = 'radar';
      }

      const data = await bankingApi.getDocuments(params);
      setDocuments(data?.items || data?.data || []);
      setTotalCount(data?.total || 0);
      setTotalPages(data?.totalPages || 1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
    loadIntelligence();
  }, []);

  useEffect(() => {
    loadDocuments();
  }, [subSection, page, search, selectedCategory, selectedDocType, selectedStatus, selectedReviewStatus, expiryFilter]);

  const handleRefresh = () => {
    loadMetrics();
    loadIntelligence();
    loadDocuments();
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'VERIFIED':
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-emerald-50 text-emerald-800 border border-emerald-200">VERIFIED</span>;
      case 'UNDER_REVIEW':
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-sky-50 text-sky-800 border border-sky-200">UNDER REVIEW</span>;
      case 'REJECTED':
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-rose-50 text-rose-800 border border-rose-200">REJECTED</span>;
      case 'REPLACEMENT_REQUIRED':
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-amber-50 text-amber-900 border border-amber-300">REPLACEMENT REQUIRED</span>;
      case 'EXPIRED':
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-100 text-slate-700 border border-slate-300">EXPIRED</span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  const getReviewStatusBadge = (reviewStatus: DocumentReviewStatus) => {
    switch (reviewStatus) {
      case 'APPROVED':
        return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-emerald-50 text-emerald-800">APPROVED</span>;
      case 'PENDING':
        return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-sky-50 text-sky-800">AWAITING REVIEW</span>;
      case 'REJECTED':
        return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-rose-50 text-rose-800">REJECTED</span>;
      case 'REPLACEMENT_REQUESTED':
        return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-50 text-amber-800">REPLACEMENT REQ.</span>;
      default:
        return <span className="px-1.5 py-0.5 text-[10px] font-bold rounded bg-slate-100 text-slate-700">{reviewStatus}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Control Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#162638] p-5 rounded-lg border border-slate-200 dark:border-[#33485D] shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono font-bold text-amber-700 dark:text-amber-400 uppercase bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded border border-amber-200 dark:border-amber-900/50">
              Phase 25 · Banking Enterprise Capability
            </span>
            <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">Institutional Clarity</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-[#E8EEF5] mt-1">Banking Document Intelligence & Vault</h1>
          <p className="text-xs text-slate-500 dark:text-[#A9BACB] mt-0.5">
            Centralized synthetic document repository, maker-checker verification, and statutory compliance radar
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleRefresh}
            className="p-2 text-slate-600 dark:text-[#A9BACB] hover:text-slate-900 dark:hover:text-white bg-white dark:bg-[#101C2A] border border-slate-300 dark:border-[#33485D] rounded-md hover:bg-slate-50 dark:hover:bg-[#192B3D] transition-colors shadow-2xs cursor-pointer"
            title="Refresh Vault Records"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-cyan-600 hover:bg-slate-800 dark:hover:bg-cyan-500 rounded-md shadow-xs flex items-center gap-2 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400 dark:text-white" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Overview StatCards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard
          label="Total Vault Docs"
          value={metrics?.totalDocuments || 0}
          subtext="Indexed & encrypted"
        />
        <StatCard
          label="Verified Ratio"
          value={`${metrics?.verifiedRatio || 0}%`}
          subtext={`${metrics?.verifiedCount || 0} approved`}
        />
        <StatCard
          label="Pending Review"
          value={metrics?.pendingReviewCount || 0}
          subtext="Maker-checker queue"
        />
        <StatCard
          label="Expiring (30d)"
          value={metrics?.expiringIn30DaysCount || 0}
          subtext="Renewal required"
        />
        <StatCard
          label="Expired Docs"
          value={metrics?.expiredCount || 0}
          subtext="Deficient compliance"
        />
        <StatCard
          label="Replacement Req."
          value={metrics?.replacementRequiredCount || 0}
          subtext="Remediation tasks"
        />
      </div>

      {/* SubSection Navigation Tabs */}
      <div className="flex border-b border-slate-200 dark:border-[#33485D] bg-white dark:bg-[#162638] px-4 rounded-t-lg">
        <button
          onClick={() => {
            setSubSection('VAULT');
            setPage(1);
          }}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            subSection === 'VAULT'
              ? 'border-slate-900 dark:border-cyan-400 text-slate-900 dark:text-[#E8EEF5]'
              : 'border-transparent text-slate-500 dark:text-[#A9BACB] hover:text-slate-700 dark:hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4 text-slate-500 dark:text-[#A9BACB]" />
          <span>Document Vault ({totalCount})</span>
        </button>

        <button
          onClick={() => {
            setSubSection('QUEUE');
            setPage(1);
          }}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            subSection === 'QUEUE'
              ? 'border-slate-900 dark:border-cyan-400 text-slate-900 dark:text-[#E8EEF5]'
              : 'border-transparent text-slate-500 dark:text-[#A9BACB] hover:text-slate-700 dark:hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4 text-sky-500" />
          <span>Verification Queue ({metrics?.pendingReviewCount || 0})</span>
        </button>

        <button
          onClick={() => {
            setSubSection('RADAR');
            setPage(1);
          }}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            subSection === 'RADAR'
              ? 'border-slate-900 dark:border-cyan-400 text-slate-900 dark:text-[#E8EEF5]'
              : 'border-transparent text-slate-500 dark:text-[#A9BACB] hover:text-slate-700 dark:hover:text-white'
          }`}
        >
          <AlertTriangle className="w-4 h-4 text-amber-500" />
          <span>Missing & Expired Radar</span>
        </button>

        <button
          onClick={() => {
            setSubSection('INTELLIGENCE');
            setPage(1);
          }}
          className={`py-3 px-4 text-xs font-semibold border-b-2 transition-colors flex items-center gap-2 cursor-pointer ${
            subSection === 'INTELLIGENCE'
              ? 'border-slate-900 dark:border-cyan-400 text-slate-900 dark:text-[#E8EEF5]'
              : 'border-transparent text-slate-500 dark:text-[#A9BACB] hover:text-slate-700 dark:hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Document Intelligence ({metrics?.unverifiedExtractionsCount || 0} extractions)</span>
        </button>
      </div>

      {/* Section Filter & Search Bar */}
      <div className="bg-white dark:bg-[#162638] p-4 rounded-b-lg border-x border-b border-slate-200 dark:border-[#33485D] space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Keyword Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search code, title, customer, PAN..."
              className="w-full pl-9 pr-3 py-1.5 border border-slate-300 dark:border-[#33485D] rounded-md text-xs bg-white dark:bg-[#101C2A] text-slate-900 dark:text-[#E8EEF5] placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-1 focus:ring-slate-900 dark:focus:ring-cyan-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => {
              setSelectedCategory(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-1.5 border border-slate-300 dark:border-[#33485D] rounded-md text-xs bg-white dark:bg-[#101C2A] text-slate-900 dark:text-[#E8EEF5] focus:outline-hidden focus:ring-1 focus:ring-slate-900 dark:focus:ring-cyan-500"
          >
            <option value="">All Categories</option>
            <option value="KYC">KYC & Identity</option>
            <option value="FINANCIAL">Financial & Underwriting</option>
            <option value="COLLATERAL">Collateral & Asset</option>
            <option value="COMPLIANCE">Compliance & Statutory</option>
            <option value="LEGAL">Legal & Agreements</option>
            <option value="OPERATIONAL">Operational</option>
          </select>

          {/* Document Type Filter */}
          <select
            value={selectedDocType}
            onChange={(e) => {
              setSelectedDocType(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-1.5 border border-slate-300 dark:border-[#33485D] rounded-md text-xs bg-white dark:bg-[#101C2A] text-slate-900 dark:text-[#E8EEF5] focus:outline-hidden focus:ring-1 focus:ring-slate-900 dark:focus:ring-cyan-500"
          >
            <option value="">All Document Types</option>
            <option value="PAN">PAN Card</option>
            <option value="Aadhaar Card">Aadhaar Card</option>
            <option value="Passport">Passport</option>
            <option value="Salary Slip">Salary Slip</option>
            <option value="Bank Statement">Bank Statement</option>
            <option value="Income Tax Returns">Income Tax Returns</option>
            <option value="Audited Balance Sheet">Audited Balance Sheet</option>
            <option value="Board Resolution">Board Resolution</option>
            <option value="Utility Bill">Utility Bill</option>
            <option value="Loan Agreement">Loan Agreement</option>
            <option value="GST Registration Certificate">GST Registration</option>
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => {
              setSelectedStatus(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-1.5 border border-slate-300 dark:border-[#33485D] rounded-md text-xs bg-white dark:bg-[#101C2A] text-slate-900 dark:text-[#E8EEF5] focus:outline-hidden focus:ring-1 focus:ring-slate-900 dark:focus:ring-cyan-500"
          >
            <option value="">All Lifecycle Statuses</option>
            <option value="VERIFIED">VERIFIED</option>
            <option value="UNDER_REVIEW">UNDER REVIEW</option>
            <option value="REJECTED">REJECTED</option>
            <option value="REPLACEMENT_REQUIRED">REPLACEMENT REQUIRED</option>
            <option value="EXPIRED">EXPIRED</option>
          </select>

          {/* Expiry Filter */}
          <select
            value={expiryFilter}
            onChange={(e) => {
              setExpiryFilter(e.target.value);
              setPage(1);
            }}
            className="w-full px-3 py-1.5 border border-slate-300 dark:border-[#33485D] rounded-md text-xs bg-white dark:bg-[#101C2A] text-slate-900 dark:text-[#E8EEF5] focus:outline-hidden focus:ring-1 focus:ring-slate-900 dark:focus:ring-cyan-500"
          >
            <option value="">All Expiry Windows</option>
            <option value="expired">Expired Documents Only</option>
            <option value="expiring_soon">Expiring within 30 Days</option>
            <option value="active">Active & Valid</option>
          </select>
        </div>
      </div>

      {/* RADAR VIEW: Missing and Expired Requirements Alerts */}
      {subSection === 'RADAR' && intelligenceSignals && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Missing Requirements Box */}
            <div className="bg-white dark:bg-[#162638] p-4 rounded-lg border border-amber-200 dark:border-amber-900/50 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 flex items-center justify-center font-bold text-xs">
                    {intelligenceSignals.missingRequirements?.length || 0}
                  </div>
                  <h3 className="text-xs font-semibold text-slate-900 dark:text-[#E8EEF5] uppercase tracking-wider">
                    Missing Requirements
                  </h3>
                </div>
                <span className="text-[11px] text-amber-800 dark:text-amber-400 font-medium">Compliance Risk</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#A9BACB]">
                Customers with mandatory KYC or financial documents that have not been uploaded yet.
              </p>
              <div className="divide-y divide-slate-100 dark:divide-[#33485D]/60 max-h-60 overflow-y-auto">
                {intelligenceSignals.missingRequirements?.slice(0, 5).map((m: any) => (
                  <div key={m.id} className="py-2 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-[#E8EEF5]">{m.customer?.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-[#A9BACB]">
                        Missing: <span className="text-amber-900 dark:text-amber-300 font-medium">{m.documentType}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsUploadModalOpen(true)}
                      className="px-2 py-1 text-[11px] font-semibold text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded border border-amber-300 dark:border-amber-800 cursor-pointer"
                    >
                      Upload
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Expired Documents Box */}
            <div className="bg-white dark:bg-[#162638] p-4 rounded-lg border border-rose-200 dark:border-rose-900/50 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-rose-100 dark:bg-rose-950/60 text-rose-800 dark:text-rose-300 flex items-center justify-center font-bold text-xs">
                    {intelligenceSignals.expiredDocuments?.length || 0}
                  </div>
                  <h3 className="text-xs font-semibold text-slate-900 dark:text-[#E8EEF5] uppercase tracking-wider">
                    Expired Documents
                  </h3>
                </div>
                <span className="text-[11px] text-rose-800 dark:text-rose-400 font-medium">Overdue</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#A9BACB]">
                Documents whose validity threshold has passed and require replacement copy.
              </p>
              <div className="divide-y divide-slate-100 dark:divide-[#33485D]/60 max-h-60 overflow-y-auto">
                {intelligenceSignals.expiredDocuments?.slice(0, 5).map((d: any) => (
                  <div key={d.id} className="py-2 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-[#E8EEF5]">{d.customer?.name}</div>
                      <div className="text-[11px] text-rose-700 dark:text-rose-400">
                        Expired {d.expiryDate} ({d.documentType})
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedDocId(d.id)}
                      className="px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-[#A9BACB] bg-slate-100 dark:bg-[#101C2A] hover:bg-slate-200 dark:hover:bg-[#192B3D] border border-slate-200 dark:border-[#33485D] rounded cursor-pointer"
                    >
                      View
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Replacement Required Box */}
            <div className="bg-white dark:bg-[#162638] p-4 rounded-lg border border-sky-200 dark:border-sky-900/50 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded bg-sky-100 dark:bg-sky-950/60 text-sky-800 dark:text-sky-300 flex items-center justify-center font-bold text-xs">
                    {intelligenceSignals.replacementRequired?.length || 0}
                  </div>
                  <h3 className="text-xs font-semibold text-slate-900 dark:text-[#E8EEF5] uppercase tracking-wider">
                    Replacement Required
                  </h3>
                </div>
                <span className="text-[11px] text-sky-800 dark:text-sky-400 font-medium">Remediation</span>
              </div>
              <p className="text-xs text-slate-500 dark:text-[#A9BACB]">
                Documents rejected during underwriting with open remediation tasks assigned to RMs.
              </p>
              <div className="divide-y divide-slate-100 dark:divide-[#33485D]/60 max-h-60 overflow-y-auto">
                {intelligenceSignals.replacementRequired?.slice(0, 5).map((r: any) => (
                  <div key={r.id} className="py-2 text-xs flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-[#E8EEF5]">{r.customer?.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-[#A9BACB] truncate max-w-[160px]">
                        {r.rejectionReason || 'Replacement requested'}
                      </div>
                    </div>
                    <button
                      onClick={() => setSelectedDocId(r.id)}
                      className="px-2 py-1 text-[11px] font-semibold text-slate-700 dark:text-[#A9BACB] bg-slate-100 dark:bg-[#101C2A] hover:bg-slate-200 dark:hover:bg-[#192B3D] border border-slate-200 dark:border-[#33485D] rounded cursor-pointer"
                    >
                      Resolve
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Table: Documents Grid */}
      <div className="bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded-lg overflow-hidden shadow-2xs">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-[#33485D] bg-slate-50/70 dark:bg-[#101C2A] flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-900 dark:text-[#E8EEF5] uppercase tracking-wider">
            {subSection === 'VAULT' && `Indexed Documents (${totalCount})`}
            {subSection === 'QUEUE' && `Verification Maker-Checker Queue (${totalCount})`}
            {subSection === 'RADAR' && `Document Deficiency Radar (${totalCount})`}
            {subSection === 'INTELLIGENCE' && `Extraction Pipeline Records (${totalCount})`}
          </div>
          <div className="text-xs text-slate-500 dark:text-[#A9BACB]">
            Page {page} of {totalPages}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20 text-slate-400 dark:text-[#A9BACB] text-xs">
            <RefreshCw className="w-5 h-5 animate-spin mr-2" />
            <span>Scanning vault indexes...</span>
          </div>
        ) : documents.length === 0 ? (
          <div className="text-center py-20 text-xs text-slate-400 dark:text-[#A9BACB] space-y-2">
            <FileText className="w-8 h-8 mx-auto text-slate-300 dark:text-slate-600" />
            <p>No documents found matching the filter criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-[#101C2A] border-b border-slate-200 dark:border-[#33485D] text-slate-600 dark:text-[#A9BACB] font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-4 py-3">Code</th>
                  <th className="px-4 py-3">Document Title</th>
                  <th className="px-4 py-3">Customer Entity</th>
                  <th className="px-4 py-3">Type & Category</th>
                  <th className="px-4 py-3">Version</th>
                  <th className="px-4 py-3">Lifecycle Status</th>
                  <th className="px-4 py-3">Review Status</th>
                  <th className="px-4 py-3">Expiry</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#33485D]">
                {documents.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 dark:hover:bg-[#101C2A]/70 transition-colors">
                    <td className="px-4 py-3 font-mono text-slate-900 dark:text-[#E8EEF5] font-semibold">{d.documentCode}</td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900 dark:text-[#E8EEF5]">{d.title}</div>
                      <div className="text-[11px] text-slate-500 dark:text-[#A9BACB] font-mono flex items-center gap-2 mt-0.5">
                        <span>{d.fileName}</span>
                        <span>·</span>
                        <span>{Math.round(d.fileSize / 1024)} KB</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-900 dark:text-[#E8EEF5]">{d.customerName}</div>
                      <div className="text-[11px] text-slate-500 dark:text-[#A9BACB] font-mono">{d.customerCode}</div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800 dark:text-[#E8EEF5]">{d.documentType}</div>
                      <div className="text-[10px] text-slate-500 dark:text-[#A9BACB]">{d.category}</div>
                    </td>
                    <td className="px-4 py-3 font-mono text-slate-700 dark:text-[#A9BACB]">v{d.currentVersion}.0</td>
                    <td className="px-4 py-3">{getStatusBadge(d.status)}</td>
                    <td className="px-4 py-3">{getReviewStatusBadge(d.reviewStatus)}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-600 dark:text-[#A9BACB]">
                      {d.expiryDate || 'N/A'}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5">
                      <button
                        onClick={() => setSelectedDocId(d.id)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-[#A9BACB] bg-white dark:bg-[#101C2A] border border-slate-300 dark:border-[#33485D] hover:bg-slate-50 dark:hover:bg-[#192B3D] rounded-md shadow-2xs inline-flex items-center gap-1 cursor-pointer"
                        title="Inspect & Review"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500 dark:text-[#A9BACB]" />
                        <span>Inspect</span>
                      </button>
                      <a
                        href={`/api/documents/${d.id}/download`}
                        download
                        className="p-1 text-slate-500 dark:text-[#A9BACB] hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-[#101C2A] inline-block align-middle cursor-pointer"
                        title="Download Synthetic Artifact"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="px-4 py-3 border-t border-slate-200 dark:border-[#33485D] bg-slate-50 dark:bg-[#101C2A] flex items-center justify-between text-xs text-slate-600 dark:text-[#A9BACB]">
            <div>
              Showing {documents.length} of {totalCount} records
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-2.5 py-1 bg-white dark:bg-[#162638] border border-slate-300 dark:border-[#33485D] text-slate-700 dark:text-[#E8EEF5] rounded hover:bg-slate-100 dark:hover:bg-[#192B3D] disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              <span className="font-mono">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-2.5 py-1 bg-white dark:bg-[#162638] border border-slate-300 dark:border-[#33485D] text-slate-700 dark:text-[#E8EEF5] rounded hover:bg-slate-100 dark:hover:bg-[#192B3D] disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={handleRefresh}
      />

      {/* Document Detail Drawer */}
      <DocumentDetailDrawer
        documentId={selectedDocId}
        isOpen={selectedDocId !== null}
        onClose={() => setSelectedDocId(null)}
        onRefresh={handleRefresh}
      />
    </div>
  );
};
