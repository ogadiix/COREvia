import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { LoanAccount, AssetClassification, LoanType, LoanRepaymentRecord } from '../../types';
import { Table, Column } from '../common/Table';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { StatCard } from '../common/StatCard';
import { Modal } from '../common/Modal';
import { EmptyState } from '../common/EmptyState';
import { formatINR } from '../../data/mockIndianBankingData';
import { bankingApi } from '../../lib/api';
import {
  Search,
  Landmark,
  ShieldCheck,
  AlertTriangle,
  Eye,
  FileText,
  Clock,
  PieChart,
  CheckCircle2,
  RefreshCw,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  User,
  Calendar,
  AlertCircle,
  Building,
  Check,
  X,
  SlidersHorizontal,
  ExternalLink,
  Percent,
  Wallet,
  Activity,
  Layers,
} from 'lucide-react';

interface LendingModuleProps {
  loans?: LoanAccount[];
  onRequestLimitRevision?: (loan: LoanAccount) => void;
  onNavigateToCustomer?: (customerIdOrCode: string | number) => void;
}

export const LendingModule: React.FC<LendingModuleProps> = ({
  onRequestLimitRevision,
  onNavigateToCustomer,
}) => {
  // Live state from PostgreSQL
  const [loanList, setLoanList] = useState<LoanAccount[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedClassification, setSelectedClassification] = useState<string>('ALL');
  const [quickFilter, setQuickFilter] = useState<'ALL' | 'STANDARD' | 'WATCHLIST' | 'HNI'>('ALL');
  const [tableDensity, setTableDensity] = useState<'normal' | 'compact'>('normal');

  // Sorting
  const [sortBy, setSortBy] = useState<string>('sanctionDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [paginationInfo, setPaginationInfo] = useState<{ total: number; totalPages: number }>({
    total: 0,
    totalPages: 1,
  });

  // Loan Detail Modal State
  const [activeLoan, setActiveLoan] = useState<any | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'SCHEDULE' | 'SPECIFICATIONS' | 'GOVERNANCE'>('SCHEDULE');
  const [loadingDetail, setLoadingDetail] = useState<boolean>(false);

  // Repayments Schedule & Summary inside Modal
  const [repayments, setRepayments] = useState<LoanRepaymentRecord[]>([]);
  const [repaymentSummary, setRepaymentSummary] = useState<any>(null);
  const [repaymentPage, setRepaymentPage] = useState<number>(1);
  const [repaymentPagination, setRepaymentPagination] = useState<{ total: number; totalPages: number }>({
    total: 0,
    totalPages: 1,
  });
  const [loadingRepayments, setLoadingRepayments] = useState<boolean>(false);

  // Fetch loans list from PostgreSQL
  const fetchLoans = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bankingApi.getLoans({
        search: searchTerm.trim() || undefined,
        loanType: selectedType !== 'ALL' ? selectedType : undefined,
        assetClassification: selectedClassification !== 'ALL' ? selectedClassification : undefined,
        page: currentPage,
        limit: pageSize,
        sortBy,
        sortOrder,
      });

      if (res && res.data) {
        const mapped: LoanAccount[] = res.data.map((row: any) => ({
          id: row.id,
          loanAccountNumber: row.loanAccountNumber,
          cifNumber: row.cifNumber || 'CIF-NA',
          borrowerName: row.borrowerName || 'Primary Borrower',
          customerName: row.customerName || row.borrowerName,
          customerCode: row.customerCode,
          customerId: row.customerId,
          loanType: row.loanType as LoanType,
          sanctionedLimit: parseFloat(row.sanctionedLimit || '0'),
          drawingPower: parseFloat(row.drawingPower || row.sanctionedLimit || '0'),
          outstandingPrincipal: parseFloat(row.outstandingPrincipal || '0'),
          interestRate: parseFloat(row.interestRate || '8.5'),
          benchmarkRate: row.benchmarkRate || 'MCLR-1Y',
          emiAmount: parseFloat(row.emiAmount || '0'),
          tenureMonths: parseInt(row.tenureMonths || '60', 10),
          sanctionDate: row.sanctionDate ? String(row.sanctionDate).split('T')[0] : '2023-01-01',
          firstDisbursementDate: row.firstDisbursementDate ? String(row.firstDisbursementDate).split('T')[0] : '2023-01-15',
          maturityDate: row.maturityDate ? String(row.maturityDate).split('T')[0] : '2028-01-15',
          nextEmiDate: row.nextEmiDate ? String(row.nextEmiDate).split('T')[0] : '2026-10-15',
          interestDue: parseFloat(row.interestDue || '0'),
          penalInterestDue: parseFloat(row.penalInterestDue || '0'),
          overdueDays: parseInt(row.overdueDays || row.dpd || '0', 10),
          assetClassification: row.assetClassification as AssetClassification,
          collateralType: row.collateralType || 'IMMOVABLE_PROPERTY',
          collateralValue: parseFloat(row.collateralValue || '0'),
          hypothecationDetails: row.hypothecationDetails || 'Equitable mortgage on primary asset',
          prioritySector: Boolean(row.prioritySector),
          provisionAmount: parseFloat(row.provisionAmount || '0'),
          dpd: parseInt(row.dpd || '0', 10),
          branchCode: row.branchCode || '0104',
          branchName: row.branchName || 'Mumbai Fort Branch',
          relationshipManagerId: row.relationshipManagerId || '0104',
          rmName: row.rmName || 'Aditya Nair (Credit RM)',
        }));

        setLoanList(mapped);
        if (res.pagination) {
          setPaginationInfo({
            total: res.pagination.total,
            totalPages: res.pagination.totalPages,
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch loan accounts from database.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, selectedType, selectedClassification, currentPage, pageSize, sortBy, sortOrder]);

  const fetchStats = async () => {
    try {
      const s = await bankingApi.getLoanStats();
      if (s) setStats(s);
    } catch (e) {
      console.warn('Loan stats error:', e);
    }
  };

  useEffect(() => {
    fetchLoans();
    fetchStats();
  }, [fetchLoans]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchLoans();
  };

  // Open Loan Detail Modal & load repayments schedule
  const handleOpenLoanDetail = (loan: LoanAccount) => {
    setActiveLoan(loan);
    setDetailModalOpen(true);
    setActiveDetailTab('SCHEDULE');
    setRepaymentPage(1);
    loadLoanDetailAndRepayments(loan.id || loan.loanAccountNumber, 1);
  };

  const loadLoanDetailAndRepayments = async (idOrNumber: string | number, pageNum: number) => {
    setLoadingRepayments(true);
    try {
      const detail = await bankingApi.getLoanDetail(idOrNumber);
      if (detail) {
        setActiveLoan(detail);
      }

      const repRes = await bankingApi.getLoanRepayments(idOrNumber, {
        page: pageNum,
        limit: 10,
      });

      if (repRes && repRes.data) {
        setRepayments(repRes.data);
        if (repRes.pagination) {
          setRepaymentPagination({
            total: repRes.pagination.total,
            totalPages: repRes.pagination.totalPages,
          });
        }
        if (repRes.summary) {
          setRepaymentSummary(repRes.summary);
        }
      }
    } catch (err) {
      console.error('Error fetching loan detail & repayment records:', err);
    } finally {
      setLoadingRepayments(false);
    }
  };

  const handleRepaymentPageChange = (newPage: number) => {
    if (newPage < 1 || newPage > repaymentPagination.totalPages) return;
    setRepaymentPage(newPage);
    if (activeLoan) {
      loadLoanDetailAndRepayments(activeLoan.id || activeLoan.loanAccountNumber, newPage);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
    setCurrentPage(1);
  };

  // Filtered loan list with quick filter
  const displayedLoans = useMemo(() => {
    return loanList.filter((l) => {
      if (quickFilter === 'STANDARD') return l.assetClassification === 'STANDARD';
      if (quickFilter === 'WATCHLIST') return l.assetClassification !== 'STANDARD';
      if (quickFilter === 'HNI') return (l.sanctionedLimit || 0) >= 5000000;
      return true;
    });
  }, [loanList, quickFilter]);

  // Columns definition
  const columns: Column<LoanAccount>[] = [
    {
      key: 'loanAccountNumber',
      header: 'Loan Facility ID',
      mono: true,
      sortable: true,
      render: (l) => (
        <div>
          <span className="font-mono font-semibold text-slate-900 dark:text-[#E8EEF5]">
            {l.loanAccountNumber}
          </span>
          <div className="text-[10px] text-slate-500 dark:text-[#8194A8] font-mono">
            Sanction: {l.sanctionDate}
          </div>
        </div>
      ),
    },
    {
      key: 'borrowerName',
      header: 'Borrower Entity',
      sortable: true,
      render: (l) => (
        <div className="max-w-[200px]">
          <div
            className={`font-semibold text-slate-900 dark:text-[#E8EEF5] truncate ${
              onNavigateToCustomer ? 'hover:text-[#168C83] dark:hover:text-[#1B9D92] cursor-pointer' : ''
            }`}
            onClick={(e) => {
              if (onNavigateToCustomer && (l.customerId || l.customerCode || l.cifNumber)) {
                e.stopPropagation();
                onNavigateToCustomer(l.customerCode || l.customerId || l.cifNumber);
              }
            }}
          >
            {l.borrowerName}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-[#8194A8] font-mono">
            CIF: {l.cifNumber}
          </div>
        </div>
      ),
    },
    {
      key: 'loanType',
      header: 'Facility Scheme',
      sortable: true,
      render: (l) => {
        const typeLabels: Record<string, string> = {
          HOME_LOAN: 'Home Loan',
          HOUSING_LOAN: 'Housing Loan',
          WORKING_CAPITAL_CC: 'Cash Credit / WC',
          TERM_LOAN: 'Term Advance',
          MSME_PRIORITY: 'MSME Priority',
          PERSONAL_LOAN: 'Personal Loan',
          EDUCATION_LOAN: 'Education Loan',
          VEHICLE_LOAN: 'Auto / Vehicle',
          BUSINESS_LOAN: 'Commercial Business',
        };
        return (
          <span className="font-medium text-xs text-slate-700 dark:text-[#A9BACB]">
            {typeLabels[l.loanType] || l.loanType}
          </span>
        );
      },
    },
    {
      key: 'sanctionedLimit',
      header: 'Sanctioned Limit',
      align: 'right',
      mono: true,
      sortable: true,
      render: (l) => (
        <span className="font-mono font-semibold text-slate-900 dark:text-[#E8EEF5] text-xs">
          {formatINR(l.sanctionedLimit)}
        </span>
      ),
    },
    {
      key: 'outstandingPrincipal',
      header: 'Outstanding Balance',
      align: 'right',
      mono: true,
      sortable: true,
      render: (l) => (
        <div>
          <span className="font-mono font-bold text-xs text-slate-900 dark:text-[#E8EEF5]">
            {formatINR(l.outstandingPrincipal)}
          </span>
          {l.interestDue > 0 && (
            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono">
              Int Due: {formatINR(l.interestDue)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'interestRate',
      header: 'Interest Rate',
      align: 'right',
      mono: true,
      sortable: true,
      render: (l) => (
        <div>
          <span className="font-mono text-xs font-semibold text-slate-900 dark:text-[#E8EEF5]">
            {(Number(l.interestRate) || 0).toFixed(2)}%
          </span>
          <div className="text-[10px] text-slate-500 dark:text-[#8194A8] line-clamp-1">
            {l.benchmarkRate}
          </div>
        </div>
      ),
    },
    {
      key: 'tenureMonths',
      header: 'Tenure',
      align: 'center',
      mono: true,
      render: (l) => {
        const months = Number(l.tenureMonths) || 60;
        const years = (months / 12).toFixed(months % 12 === 0 ? 0 : 1);
        return (
          <span className="font-mono text-xs text-slate-600 dark:text-[#A9BACB]">
            {months} M ({years} Yrs)
          </span>
        );
      },
    },
    {
      key: 'assetClassification',
      header: 'Asset Status',
      align: 'center',
      sortable: true,
      render: (l) => {
        if (l.assetClassification === 'STANDARD') return <Badge variant="success" size="sm">Standard</Badge>;
        if (l.assetClassification === 'SMA_0') return <Badge variant="warning" size="sm">SMA-0</Badge>;
        if (l.assetClassification === 'SMA_1') return <Badge variant="warning" size="sm">SMA-1</Badge>;
        if (l.assetClassification === 'SMA_2') return <Badge variant="danger" size="sm">SMA-2</Badge>;
        return <Badge variant="danger" size="sm">{l.assetClassification}</Badge>;
      },
    },
    {
      key: 'nextEmiDate',
      header: 'Next Due Date',
      align: 'center',
      mono: true,
      sortable: true,
      render: (l) => (
        <div>
          <span className="font-mono text-xs text-slate-900 dark:text-[#E8EEF5] font-medium">
            {l.nextEmiDate}
          </span>
          <div className="text-[10px] text-slate-500 dark:text-[#8194A8] font-mono">
            EMI: {formatINR(l.emiAmount)}
          </div>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (l) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            icon={<Eye className="w-3.5 h-3.5" />}
            onClick={() => handleOpenLoanDetail(l)}
            className="text-xs py-0.5 px-2"
          >
            Inquire
          </Button>
          {onRequestLimitRevision && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRequestLimitRevision(l)}
              className="text-xs py-0.5 px-2 text-slate-600 dark:text-[#A9BACB]"
              title="Request Credit Limit Revision"
            >
              Revision
            </Button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      {/* Module Executive Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 dark:border-[#33485D] pb-3">
        <div>
          <h1 className="text-xl font-bold text-slate-900 dark:text-[#E8EEF5] tracking-tight flex items-center gap-2">
            <Landmark className="w-5 h-5 text-[#142C45] dark:text-[#1B9D92]" />
            <span>Lending &amp; Credit Facilities Master</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#8194A8]">
            Advances ledger, asset classification, and repayment tracking backed by PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={() => {
              fetchLoans();
              fetchStats();
            }}
          >
            Sync
          </Button>
        </div>
      </div>

      {/* Aggregate Credit Book KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Sanctioned Credit Book"
          value={stats ? formatINR(stats.totalSanctionedLimit, { compact: true }) : '₹12.45 Cr'}
          code="LN-SANCT-0104"
          subtext="Committed advances book"
          badge="Committed Exposure"
          badgeVariant="info"
        />
        <StatCard
          label="Principal Outstanding"
          value={stats ? formatINR(stats.totalOutstanding, { compact: true }) : '₹9.82 Cr'}
          code="LN-OUTST-0104"
          subtext="Current portfolio exposure"
          badge="Earning Assets"
          badgeVariant="success"
        />
        <StatCard
          label="SMA Watchlist / At-Risk"
          value={stats ? formatINR(stats.totalOverdue || 0, { compact: true }) : '₹35.20 L'}
          code="RBI-SMA-CTRL"
          subtext="SMA-0, 1 &amp; 2 delinquency"
          badge="Credit Risk"
          badgeVariant="warning"
        />
        <StatCard
          label="Gross NPA Exposure"
          value={stats?.totalNpa ? formatINR(stats.totalNpa, { compact: true }) : '₹0.00'}
          code="RBI-GNPA-RATIO"
          subtext="Impaired assets under recovery"
          badge="0.00% GNPA"
          badgeVariant="neutral"
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded p-3 space-y-3 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 dark:text-[#8194A8] absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search Loan ID, Borrower Name, CIF, or PAN..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-8 py-1.5 text-xs bg-slate-50 dark:bg-[#101C2A] border border-slate-300 dark:border-[#33485D] rounded focus:bg-white dark:focus:bg-[#162638] focus:outline-none focus:ring-1 focus:ring-[#168C83] text-slate-900 dark:text-[#E8EEF5] transition-colors"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => {
                  setSearchTerm('');
                  setCurrentPage(1);
                  fetchLoans();
                }}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Loan Facility Type Filter */}
          <div className="sm:col-span-3">
            <select
              value={selectedType}
              onChange={(e) => {
                setSelectedType(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 dark:bg-[#101C2A] border border-slate-300 dark:border-[#33485D] rounded focus:bg-white dark:focus:bg-[#162638] focus:outline-none focus:ring-1 focus:ring-[#168C83] text-slate-800 dark:text-[#E8EEF5]"
            >
              <option value="ALL">All Facility Schemes</option>
              <option value="HOME_LOAN">Home / Housing Loan</option>
              <option value="WORKING_CAPITAL_CC">Cash Credit / Working Capital</option>
              <option value="TERM_LOAN">Term Advance</option>
              <option value="MSME_PRIORITY">MSME Priority</option>
              <option value="PERSONAL_LOAN">Personal Loan</option>
              <option value="VEHICLE_LOAN">Auto / Vehicle Advance</option>
            </select>
          </div>

          {/* Asset Classification Filter */}
          <div className="sm:col-span-2">
            <select
              value={selectedClassification}
              onChange={(e) => {
                setSelectedClassification(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 dark:bg-[#101C2A] border border-slate-300 dark:border-[#33485D] rounded focus:bg-white dark:focus:bg-[#162638] focus:outline-none focus:ring-1 focus:ring-[#168C83] text-slate-800 dark:text-[#E8EEF5]"
            >
              <option value="ALL">All Asset Classes</option>
              <option value="STANDARD">Standard Performing</option>
              <option value="SMA_0">SMA-0 (1-30 DPD)</option>
              <option value="SMA_1">SMA-1 (31-60 DPD)</option>
              <option value="SMA_2">SMA-2 (61-90 DPD)</option>
            </select>
          </div>

          {/* Density & Sort Controls */}
          <div className="sm:col-span-2 flex items-center justify-end gap-1.5">
            <button
              onClick={() => handleSort('outstandingPrincipal')}
              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-slate-100 dark:bg-[#192B3D] text-slate-700 dark:text-[#A9BACB] hover:bg-slate-200 dark:hover:bg-[#20364B] border border-slate-300 dark:border-[#33485D] transition-colors"
              title="Sort by Outstanding Principal"
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>Balance {sortBy === 'outstandingPrincipal' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</span>
            </button>

            <div className="inline-flex rounded border border-slate-300 dark:border-[#33485D] p-0.5 bg-slate-100 dark:bg-[#101C2A]">
              <button
                type="button"
                onClick={() => setTableDensity('normal')}
                className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors ${
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
                className={`text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors ${
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

        {/* Quick Filter Chips */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100 dark:border-[#1F334A] text-xs">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] font-mono text-slate-500 dark:text-[#8194A8] mr-1">
              Showing <strong className="text-slate-800 dark:text-[#E8EEF5]">{displayedLoans.length}</strong> of {paginationInfo.total} loan facilities:
            </span>

            {[
              { id: 'ALL', label: 'All Facilities' },
              { id: 'STANDARD', label: 'Standard Performing' },
              { id: 'WATCHLIST', label: 'SMA Watchlist' },
              { id: 'HNI', label: 'High Exposure (> ₹50L)' },
            ].map((chip) => (
              <button
                key={chip.id}
                type="button"
                onClick={() => setQuickFilter(chip.id as any)}
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

          {(searchTerm || selectedType !== 'ALL' || selectedClassification !== 'ALL' || quickFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedType('ALL');
                setSelectedClassification('ALL');
                setQuickFilter('ALL');
                setCurrentPage(1);
                fetchLoans();
              }}
              className="text-xs text-[#168C83] dark:text-[#1B9D92] hover:underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Loans Data Table */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 dark:text-[#8194A8] bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#168C83]" />
          <p className="text-xs">Querying PostgreSQL Lending database...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded">
          <AlertCircle className="w-6 h-6 mx-auto mb-2" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      ) : displayedLoans.length === 0 ? (
        <EmptyState
          icon={<Landmark className="w-8 h-8 text-slate-400 dark:text-[#8194A8]" />}
          title="No loan facilities match criteria"
          description="No credit accounts match the current search term, scheme, or asset classification filters."
          actionLabel="Reset Filters"
          onAction={() => {
            setSearchTerm('');
            setSelectedType('ALL');
            setSelectedClassification('ALL');
            setQuickFilter('ALL');
            setCurrentPage(1);
            fetchLoans();
          }}
          className="py-12 bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded"
        />
      ) : (
        <div className="space-y-3">
          <Table
            data={displayedLoans}
            columns={columns}
            keyExtractor={(l) => l.loanAccountNumber}
            density={tableDensity}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onRowClick={(l) => handleOpenLoanDetail(l)}
          />

          {/* Table Pagination Bar */}
          <div className="bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded p-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-[#8194A8]">
              <span>
                Showing page <strong className="text-slate-800 dark:text-[#E8EEF5]">{currentPage}</strong> of {paginationInfo.totalPages || 1}
                {' '}({paginationInfo.total} total facilities)
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
                size="xs"
                variant="outline"
                disabled={currentPage <= 1 || loading}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                icon={<ChevronLeft className="w-3.5 h-3.5" />}
              >
                Previous
              </Button>
              <Button
                size="xs"
                variant="outline"
                disabled={currentPage >= paginationInfo.totalPages || loading}
                onClick={() => setCurrentPage((p) => Math.min(paginationInfo.totalPages, p + 1))}
              >
                <span>Next</span>
                <ChevronRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Loan Detail Inquiry Modal */}
      {activeLoan && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setActiveLoan(null);
          }}
          title={
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-[#168C83] dark:text-[#1B9D92]" />
              <span>Credit Facility Dossier: {activeLoan.loanAccountNumber}</span>
            </div>
          }
          subtitle={`Borrower: ${activeLoan.borrowerName} · CIF: ${activeLoan.cifNumber}`}
          size="4xl"
        >
          <div className="space-y-4">
            {/* Header & Cohesive 6-Metric Facility Balance Strip */}
            <div className="bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#1F334A]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-slate-900 dark:text-[#E8EEF5]">
                      {activeLoan.loanAccountNumber}
                    </span>
                    <Badge variant="neutral" size="sm">
                      {activeLoan.loanType}
                    </Badge>
                    <Badge
                      variant={activeLoan.assetClassification === 'STANDARD' ? 'success' : 'danger'}
                      size="sm"
                    >
                      {activeLoan.assetClassification}
                    </Badge>
                  </div>
                  <div className="text-xs text-slate-500 dark:text-[#8194A8] font-mono mt-0.5">
                    Branch: {activeLoan.branchName} • RM: {activeLoan.rmName || 'Branch Credit RM'}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {onRequestLimitRevision && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setDetailModalOpen(false);
                        onRequestLimitRevision(activeLoan);
                      }}
                    >
                      Credit Limit Revision
                    </Button>
                  )}
                </div>
              </div>

              {/* 6-Metric Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div className="bg-white dark:bg-[#162638] p-2.5 rounded border border-slate-200 dark:border-[#33485D]">
                  <span className="text-[10px] text-slate-500 dark:text-[#8194A8] uppercase font-mono block">Sanctioned Limit</span>
                  <span className="text-sm font-mono font-bold text-slate-900 dark:text-[#E8EEF5] mt-0.5 block">
                    {formatINR(parseFloat(activeLoan.sanctionedLimit || '0'))}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Committed drawing ceiling</span>
                </div>

                <div className="bg-white dark:bg-[#162638] p-2.5 rounded border border-slate-200 dark:border-[#33485D]">
                  <span className="text-[10px] text-slate-500 dark:text-[#8194A8] uppercase font-mono block">Outstanding Principal</span>
                  <span className="text-sm font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
                    {formatINR(parseFloat(activeLoan.outstandingPrincipal || '0'))}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Current principal balance</span>
                </div>

                <div className="bg-white dark:bg-[#162638] p-2.5 rounded border border-slate-200 dark:border-[#33485D]">
                  <span className="text-[10px] text-slate-500 dark:text-[#8194A8] uppercase font-mono block">Scheduled Monthly EMI</span>
                  <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                    {formatINR(parseFloat(activeLoan.emiAmount || '0'))}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Next Due: {activeLoan.nextEmiDate}</span>
                </div>

                <div className="bg-white dark:bg-[#162638] p-2.5 rounded border border-slate-200 dark:border-[#33485D]">
                  <span className="text-[10px] text-slate-500 dark:text-[#8194A8] uppercase font-mono block">Applied Interest Rate</span>
                  <span className="text-sm font-mono font-bold text-slate-900 dark:text-[#E8EEF5] mt-0.5 block">
                    {(Number(activeLoan.interestRate) || 8.5).toFixed(2)}% p.a.
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">{activeLoan.benchmarkRate || 'MCLR-1Y'}</span>
                </div>
              </div>
            </div>

            {/* Modal Navigation Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-200 dark:border-[#33485D] text-xs">
              <button
                onClick={() => setActiveDetailTab('SCHEDULE')}
                className={`py-2 px-3 border-b-2 font-medium transition-colors ${
                  activeDetailTab === 'SCHEDULE'
                    ? 'border-[#168C83] text-[#142C45] dark:text-[#1B9D92] font-semibold'
                    : 'border-transparent text-slate-600 dark:text-[#A9BACB] hover:text-slate-900'
                }`}
              >
                Repayment Schedule ({repaymentPagination.total})
              </button>
              <button
                onClick={() => setActiveDetailTab('SPECIFICATIONS')}
                className={`py-2 px-3 border-b-2 font-medium transition-colors ${
                  activeDetailTab === 'SPECIFICATIONS'
                    ? 'border-[#168C83] text-[#142C45] dark:text-[#1B9D92] font-semibold'
                    : 'border-transparent text-slate-600 dark:text-[#A9BACB] hover:text-slate-900'
                }`}
              >
                Terms &amp; Facility Parameters
              </button>
              <button
                onClick={() => setActiveDetailTab('GOVERNANCE')}
                className={`py-2 px-3 border-b-2 font-medium transition-colors ${
                  activeDetailTab === 'GOVERNANCE'
                    ? 'border-[#168C83] text-[#142C45] dark:text-[#1B9D92] font-semibold'
                    : 'border-transparent text-slate-600 dark:text-[#A9BACB] hover:text-slate-900'
                }`}
              >
                Asset Classification &amp; SMA Watchlist
              </button>
            </div>

            {/* Tab 1: Repayment Schedule */}
            {activeDetailTab === 'SCHEDULE' && (
              <div className="space-y-3">
                {loadingRepayments ? (
                  <div className="py-8 text-center text-slate-500 dark:text-[#8194A8]">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-[#168C83]" />
                    <p className="text-xs">Fetching repayment amortization schedule...</p>
                  </div>
                ) : repayments.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 dark:text-[#8194A8] bg-slate-50 dark:bg-[#101C2A] rounded border border-slate-200 dark:border-[#33485D]">
                    <p className="text-xs">No repayment installment records found.</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-[#33485D] rounded overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 dark:bg-[#101C2A] text-slate-700 dark:text-[#A9BACB] font-semibold border-b border-slate-200 dark:border-[#33485D]">
                          <tr>
                            <th className="px-3 py-2">Installment #</th>
                            <th className="px-3 py-2">Due Date</th>
                            <th className="px-3 py-2 text-right">Principal</th>
                            <th className="px-3 py-2 text-right">Interest</th>
                            <th className="px-3 py-2 text-right">Total EMI</th>
                            <th className="px-3 py-2 text-center">Payment Date</th>
                            <th className="px-3 py-2 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-[#1F334A] bg-white dark:bg-[#162638]">
                          {repayments.map((rep) => (
                            <tr key={rep.id || rep.installmentNumber} className="hover:bg-slate-50 dark:hover:bg-[#192B3D] transition-colors">
                              <td className="px-3 py-2 font-mono font-bold text-slate-800 dark:text-[#E8EEF5]">
                                #{rep.installmentNumber}
                              </td>
                              <td className="px-3 py-2 font-mono text-slate-600 dark:text-[#A9BACB]">
                                {rep.dueDate}
                              </td>
                              <td className="px-3 py-2 font-mono text-right text-slate-700 dark:text-[#A9BACB]">
                                {formatINR(parseFloat(String(rep.principalComponent || '0')))}
                              </td>
                              <td className="px-3 py-2 font-mono text-right text-slate-700 dark:text-[#A9BACB]">
                                {formatINR(parseFloat(String(rep.interestComponent || '0')))}
                              </td>
                              <td className="px-3 py-2 font-mono font-bold text-right text-slate-900 dark:text-[#E8EEF5]">
                                {formatINR(parseFloat(String(rep.totalEmi || '0')))}
                              </td>
                              <td className="px-3 py-2 text-center font-mono text-slate-500 dark:text-[#8194A8]">
                                {rep.paymentDate || '—'}
                              </td>
                              <td className="px-3 py-2 text-center whitespace-nowrap">
                                <Badge
                                  variant={
                                    rep.status === 'PAID'
                                      ? 'success'
                                      : rep.status === 'OVERDUE'
                                      ? 'danger'
                                      : 'neutral'
                                  }
                                  size="sm"
                                >
                                  {rep.status}
                                </Badge>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Pagination */}
                    <div className="px-3 py-2 bg-slate-50 dark:bg-[#101C2A] border-t border-slate-200 dark:border-[#33485D] flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-[#8194A8] font-mono">
                        Page {repaymentPage} of {repaymentPagination.totalPages || 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          size="xs"
                          variant="outline"
                          disabled={repaymentPage <= 1 || loadingRepayments}
                          onClick={() => handleRepaymentPageChange(repaymentPage - 1)}
                        >
                          Previous
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          disabled={repaymentPage >= repaymentPagination.totalPages || loadingRepayments}
                          onClick={() => handleRepaymentPageChange(repaymentPage + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Terms & Parameters */}
            {activeDetailTab === 'SPECIFICATIONS' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded space-y-2">
                  <div className="font-semibold text-slate-900 dark:text-[#E8EEF5] border-b border-slate-200 dark:border-[#1F334A] pb-1.5 uppercase text-[11px] tracking-wide">
                    Facility Tenor &amp; Benchmarks
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-[#8194A8]">Sanction Date:</span>
                    <span className="font-mono text-slate-800 dark:text-[#E8EEF5]">{activeLoan.sanctionDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-[#8194A8]">Maturity Date:</span>
                    <span className="font-mono text-slate-800 dark:text-[#E8EEF5]">{activeLoan.maturityDate}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-[#8194A8]">Tenure:</span>
                    <span className="font-mono text-slate-800 dark:text-[#E8EEF5]">{activeLoan.tenureMonths} Months</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-[#8194A8]">Benchmark Peg:</span>
                    <span className="font-mono text-slate-800 dark:text-[#E8EEF5]">{activeLoan.benchmarkRate}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded space-y-2">
                  <div className="font-semibold text-slate-900 dark:text-[#E8EEF5] border-b border-slate-200 dark:border-[#1F334A] pb-1.5 uppercase text-[11px] tracking-wide">
                    Servicing &amp; Officer Routing
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-[#8194A8]">Primary Borrower:</span>
                    <span className="font-medium text-slate-800 dark:text-[#E8EEF5]">{activeLoan.borrowerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-[#8194A8]">Servicing Branch:</span>
                    <span className="font-medium text-slate-800 dark:text-[#E8EEF5]">{activeLoan.branchName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-[#8194A8]">Credit RM:</span>
                    <span className="font-medium text-slate-800 dark:text-[#E8EEF5]">{activeLoan.rmName || 'Branch Credit RM'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-[#8194A8]">Penal Interest Due:</span>
                    <span className="font-mono text-rose-600 dark:text-rose-400 font-semibold">{formatINR(activeLoan.penalInterestDue || 0)}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Governance & SMA Watchlist */}
            {activeDetailTab === 'GOVERNANCE' && (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded space-y-2">
                  <div className="font-semibold text-slate-900 dark:text-[#E8EEF5] flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[#168C83] dark:text-[#1B9D92]" />
                    <span>RBI Asset Classification &amp; Prudential Provisioning</span>
                  </div>
                  <p className="text-slate-600 dark:text-[#A9BACB] text-[11px] leading-relaxed">
                    Under Reserve Bank of India (RBI) Prudential Framework for Resolution of Stressed Assets, facilities are classified based on Special Mention Account (SMA) stages: SMA-0 (1-30 days), SMA-1 (31-60 days), and SMA-2 (61-90 days). Once overdue crosses 90 days, the asset transitions automatically to Non-Performing Asset (NPA) status.
                  </p>
                  <div className="flex items-center gap-4 pt-2">
                    <div className="p-2 bg-white dark:bg-[#162638] rounded border border-slate-200 dark:border-[#33485D]">
                      <span className="text-[10px] text-slate-500 dark:text-[#8194A8] block">Current Classification</span>
                      <span className="font-bold text-slate-800 dark:text-[#E8EEF5]">{activeLoan.assetClassification}</span>
                    </div>
                    <div className="p-2 bg-white dark:bg-[#162638] rounded border border-slate-200 dark:border-[#33485D]">
                      <span className="text-[10px] text-slate-500 dark:text-[#8194A8] block">Days Past Due (DPD)</span>
                      <span className="font-bold font-mono text-slate-800 dark:text-[#E8EEF5]">{activeLoan.dpd || 0} Days</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200 dark:border-[#33485D] flex items-center justify-between">
              <div className="text-[11px] text-slate-500 dark:text-[#8194A8] font-mono">
                Audit Record ID: LN-{activeLoan.id || activeLoan.loanAccountNumber} • Branch {activeLoan.branchCode}
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setDetailModalOpen(false);
                  setActiveLoan(null);
                }}
              >
                Close Inquiry
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
