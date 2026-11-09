import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BankAccount, AccountType, AccountStatus } from '../../types';
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
  Filter,
  Eye,
  EyeOff,
  ShieldAlert,
  Lock,
  Unlock,
  CreditCard,
  Plus,
  FileText,
  RefreshCw,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Landmark,
  Building2,
  Calendar,
  AlertCircle,
  Copy,
  Check,
  X,
  SlidersHorizontal,
  ExternalLink,
  ShieldCheck,
  Clock,
  ArrowUpRight,
  ArrowDownLeft,
} from 'lucide-react';

interface AccountsModuleProps {
  accounts?: BankAccount[];
  onSelectAccount?: (account: BankAccount) => void;
  onOpenNewAccountOrVoucher?: () => void;
  onRequestStatusChange?: (account: BankAccount, newStatus: AccountStatus) => void;
  onRequestLienChange?: (account: BankAccount) => void;
  onNavigateToCustomer?: (customerIdOrCode: string | number) => void;
}

export const AccountsModule: React.FC<AccountsModuleProps> = ({
  onSelectAccount,
  onOpenNewAccountOrVoucher,
  onRequestStatusChange,
  onRequestLienChange,
  onNavigateToCustomer,
}) => {
  // Live Data State from PostgreSQL
  const [accountList, setAccountList] = useState<BankAccount[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [accountTypeFilter, setAccountTypeFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [branchFilter, setBranchFilter] = useState<string>('ALL');
  const [quickFilter, setQuickFilter] = useState<'ALL' | 'ACTIVE' | 'LIEN' | 'HNI'>('ALL');
  const [tableDensity, setTableDensity] = useState<'normal' | 'compact'>('normal');

  // Sorting State
  const [sortBy, setSortBy] = useState<string>('openDate');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(10);
  const [paginationInfo, setPaginationInfo] = useState<{ total: number; totalPages: number }>({
    total: 0,
    totalPages: 1,
  });

  // Account Detail Modal State
  const [detailModalOpen, setDetailModalOpen] = useState<boolean>(false);
  const [selectedAcc, setSelectedAcc] = useState<any | null>(null);
  const [activeDetailTab, setActiveDetailTab] = useState<'TRANSACTIONS' | 'DETAILS' | 'GOVERNANCE'>('TRANSACTIONS');
  const [unmaskedAccNumber, setUnmaskedAccNumber] = useState<boolean>(false);
  const [copiedAcc, setCopiedAcc] = useState<boolean>(false);

  // Paginated Transactions inside Modal
  const [txnPage, setTxnPage] = useState<number>(1);
  const [txnLimit] = useState<number>(10);
  const [txns, setTxns] = useState<any[]>([]);
  const [txnPagination, setTxnPagination] = useState<{ total: number; totalPages: number }>({
    total: 0,
    totalPages: 1,
  });
  const [loadingTxns, setLoadingTxns] = useState<boolean>(false);

  // Fetch accounts from PostgreSQL API
  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await bankingApi.getAccounts({
        search: searchTerm.trim() || undefined,
        accountType: accountTypeFilter !== 'ALL' ? accountTypeFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
        branchCode: branchFilter !== 'ALL' ? branchFilter : undefined,
        page: currentPage,
        limit: pageSize,
        sortBy,
        sortOrder,
      });

      if (res && res.data) {
        const mapped: BankAccount[] = res.data.map((row: any) => ({
          id: row.id,
          accountNumber: row.accountNumber,
          maskedAccountNumber: row.maskedAccountNumber || `****${row.accountNumber.slice(-4)}`,
          cifNumber: row.cifNumber || 'CIF-NA',
          customerName: row.customerName || 'Account Holder',
          customerCode: row.customerCode,
          customerId: row.customerId,
          accountType: row.accountType,
          schemeCode: row.schemeCode || 'SB-GEN',
          schemeName: row.schemeName || 'Standard Banking Account',
          currency: (row.currency as 'INR') || 'INR',
          availableBalance: parseFloat(row.availableBalance || '0'),
          ledgerBalance: parseFloat(row.ledgerBalance || '0'),
          lienAmount: parseFloat(row.lienAmount || '0'),
          unclearBalance: parseFloat(row.unclearBalance || '0'),
          interestRate: parseFloat(row.interestRate || '0'),
          openDate: row.openDate ? String(row.openDate).split('T')[0] : '2022-01-01',
          lastActivityDate: row.lastActivityDate ? String(row.lastActivityDate).split('T')[0] : undefined,
          status: row.status as AccountStatus,
          branchCode: row.branchCode || '0104',
          branchName: row.branchName || 'Mumbai Fort Branch',
          ifscCode: row.ifscCode || 'CRVI0001042',
          panNumber: row.panNumber || '—',
        }));

        setAccountList(mapped);
        if (res.pagination) {
          setPaginationInfo({
            total: res.pagination.total,
            totalPages: res.pagination.totalPages,
          });
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch accounts from database.');
    } finally {
      setLoading(false);
    }
  }, [searchTerm, accountTypeFilter, statusFilter, branchFilter, currentPage, pageSize, sortBy, sortOrder]);

  // Fetch account stats
  const fetchStats = async () => {
    try {
      const s = await bankingApi.getAccountStats();
      if (s) setStats(s);
    } catch (e) {
      console.warn('Account stats error:', e);
    }
  };

  useEffect(() => {
    fetchAccounts();
    fetchStats();
  }, [fetchAccounts]);

  // Handle Search Submission
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAccounts();
  };

  // Open Account Detail Modal & fetch transactions
  const handleOpenAccountDetail = async (acc: BankAccount) => {
    setSelectedAcc(acc);
    setDetailModalOpen(true);
    setActiveDetailTab('TRANSACTIONS');
    setUnmaskedAccNumber(false);
    setTxnPage(1);
    fetchAccountDetailAndTxns(acc.id || acc.accountNumber, 1);
  };

  const fetchAccountDetailAndTxns = async (idOrNumber: string | number, pageNum: number) => {
    setLoadingTxns(true);
    try {
      const detail = await bankingApi.getAccountDetail(idOrNumber);
      if (detail) {
        setSelectedAcc(detail);
      }

      const txnRes = await bankingApi.getAccountTransactions(idOrNumber, {
        page: pageNum,
        limit: txnLimit,
      });

      if (txnRes && txnRes.data) {
        setTxns(txnRes.data);
        if (txnRes.pagination) {
          setTxnPagination({
            total: txnRes.pagination.total,
            totalPages: txnRes.pagination.totalPages,
          });
        }
      }
    } catch (err) {
      console.error('Error fetching account details/txns:', err);
    } finally {
      setLoadingTxns(false);
    }
  };

  const handleTxnPageChange = (newPage: number) => {
    if (newPage < 1 || newPage > txnPagination.totalPages) return;
    setTxnPage(newPage);
    if (selectedAcc) {
      fetchAccountDetailAndTxns(selectedAcc.id || selectedAcc.accountNumber, newPage);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAcc(true);
    setTimeout(() => setCopiedAcc(false), 2000);
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

  // Filtered account list taking quick filters into account
  const displayedAccounts = useMemo(() => {
    return accountList.filter((a) => {
      if (quickFilter === 'ACTIVE') return a.status === 'ACTIVE';
      if (quickFilter === 'LIEN') return (a.lienAmount || 0) > 0;
      if (quickFilter === 'HNI') return (a.availableBalance || 0) >= 1000000;
      return true;
    });
  }, [accountList, quickFilter]);

  // Columns definition
  const columns: Column<BankAccount>[] = [
    {
      key: 'accountNumber',
      header: 'Account Number',
      mono: true,
      sortable: true,
      render: (a) => (
        <div className="flex items-center gap-1.5">
          <span className="font-mono font-semibold text-slate-900 dark:text-[#E8EEF5]">
            {a.maskedAccountNumber || `****${a.accountNumber.slice(-4)}`}
          </span>
          <span className="text-[10px] text-slate-500 dark:text-[#8194A8] font-mono px-1 py-0.5 bg-slate-100 dark:bg-[#101C2A] rounded border border-slate-200 dark:border-[#33485D]">
            {a.schemeCode}
          </span>
        </div>
      ),
    },
    {
      key: 'accountType',
      header: 'Account Type',
      sortable: true,
      render: (a) => {
        const typeLabels: Record<string, string> = {
          CURRENT: 'CA (Current)',
          SAVINGS: 'SB (Savings)',
          SALARY: 'SB (Salary)',
          FIXED_DEPOSIT: 'FD (Term Deposit)',
          RECURRING_DEPOSIT: 'RD (Recurring)',
          PREMIUM_SAVINGS: 'SB (Wealth Premier)',
        };
        return (
          <span className="font-medium text-xs text-slate-700 dark:text-[#A9BACB]">
            {typeLabels[a.accountType] || a.accountType}
          </span>
        );
      },
    },
    {
      key: 'customerName',
      header: 'Customer / Corporate Entity',
      sortable: true,
      render: (a) => (
        <div className="max-w-[200px]">
          <div
            className={`font-semibold text-slate-900 dark:text-[#E8EEF5] truncate ${
              onNavigateToCustomer ? 'hover:text-[#168C83] dark:hover:text-[#1B9D92] cursor-pointer' : ''
            }`}
            onClick={(e) => {
              if (onNavigateToCustomer && (a.customerId || a.customerCode || a.cifNumber)) {
                e.stopPropagation();
                onNavigateToCustomer(a.customerCode || a.customerId || a.cifNumber);
              }
            }}
          >
            {a.customerName}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-[#8194A8] font-mono">
            CIF: {a.cifNumber} {a.panNumber && a.panNumber !== '—' && `• PAN: ${a.panNumber}`}
          </div>
        </div>
      ),
    },
    {
      key: 'branchCode',
      header: 'Branch Routing',
      render: (a) => (
        <div>
          <div className="text-xs font-medium text-slate-900 dark:text-[#E8EEF5]">{a.branchName}</div>
          <div className="text-[11px] font-mono text-slate-500 dark:text-[#8194A8]">IFSC: {a.ifscCode}</div>
        </div>
      ),
    },
    {
      key: 'currency',
      header: 'Currency',
      align: 'center',
      mono: true,
      render: (a) => (
        <span className="font-mono text-xs font-semibold text-slate-700 dark:text-[#A9BACB]">{a.currency}</span>
      ),
    },
    {
      key: 'availableBalance',
      header: 'Available Balance',
      align: 'right',
      mono: true,
      sortable: true,
      render: (a) => (
        <div>
          <span className="font-mono font-bold text-slate-900 dark:text-[#E8EEF5] text-xs">
            {formatINR(a.availableBalance)}
          </span>
          {a.lienAmount > 0 && (
            <div className="text-[10px] text-amber-600 dark:text-amber-400 font-mono font-medium">
              Lien: {formatINR(a.lienAmount)}
            </div>
          )}
        </div>
      ),
    },
    {
      key: 'ledgerBalance',
      header: 'Current Ledger',
      align: 'right',
      mono: true,
      sortable: true,
      render: (a) => (
        <span className="font-mono text-xs text-slate-600 dark:text-[#A9BACB]">
          {formatINR(a.ledgerBalance)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      align: 'center',
      sortable: true,
      render: (a) => {
        if (a.status === 'ACTIVE') return <Badge variant="success" size="sm">Active</Badge>;
        if (a.status === 'DEBIT_FREEZE') return <Badge variant="warning" size="sm">Debit Freeze</Badge>;
        if (a.status === 'TOTAL_FREEZE') return <Badge variant="danger" size="sm">Total Freeze</Badge>;
        if (a.status === 'DORMANT') return <Badge variant="neutral" size="sm">Dormant</Badge>;
        return <Badge variant="neutral" size="sm">{a.status}</Badge>;
      },
    },
    {
      key: 'openDate',
      header: 'Opened Date',
      align: 'center',
      mono: true,
      sortable: true,
      render: (a) => <span className="font-mono text-xs text-slate-500 dark:text-[#8194A8]">{a.openDate}</span>,
    },
    {
      key: 'actions',
      header: 'Action',
      align: 'right',
      render: (a) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          <Button
            size="sm"
            variant="outline"
            icon={<Eye className="w-3.5 h-3.5" />}
            onClick={() => handleOpenAccountDetail(a)}
            className="text-xs py-0.5 px-2"
          >
            Inquire
          </Button>
          {onRequestLienChange && (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => onRequestLienChange(a)}
              className="text-xs py-0.5 px-2 text-slate-600 dark:text-[#A9BACB]"
              title="Mark or manage judicial/credit lien hold"
            >
              Lien
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
            <span>Deposit &amp; CASA Accounts Ledger</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-[#8194A8]">
            Core banking account master registry and ledger balances backed by PostgreSQL.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            icon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
            onClick={() => {
              fetchAccounts();
              fetchStats();
            }}
          >
            Sync
          </Button>

          {onOpenNewAccountOrVoucher && (
            <Button
              size="sm"
              variant="primary"
              icon={<Plus className="w-3.5 h-3.5" />}
              onClick={onOpenNewAccountOrVoucher}
            >
              New Account / Txn
            </Button>
          )}
        </div>
      </div>

      {/* Aggregate Financial Metrics Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total CASA Volume"
          value={stats ? formatINR(stats.totalCasaVolume, { compact: true }) : '₹3.92 Cr'}
          code="GL-CASA-0104"
          subtext="Low-cost demand deposits"
          badge="Demand Book"
          badgeVariant="success"
        />
        <StatCard
          label="Term &amp; Fixed Deposits"
          value={stats ? formatINR(stats.totalTermDeposits, { compact: true }) : '₹10.35 Cr'}
          code="GL-TERM-0104"
          subtext="Contractual fixed liabilities"
          badge="Term Reserves"
          badgeVariant="info"
        />
        <StatCard
          label="Encumbered Liens Marked"
          value={stats ? formatINR(stats.totalLiensMarked, { compact: true }) : '₹4.50 L'}
          code="GL-LIEN-CTRL"
          subtext="Judicial &amp; margin holds"
          badge="Risk Encumbered"
          badgeVariant="warning"
        />
        <StatCard
          label="Frozen Accounts"
          value={stats ? String(stats.frozenAccountsCount) : '2'}
          code="AML-FREEZE-Q"
          subtext="Dual-checker clearance required"
          badge="Compliance"
          badgeVariant="danger"
        />
      </div>

      {/* Search & Filter Controls Bar */}
      <div className="bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded p-3 space-y-3 shadow-2xs">
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
          {/* Search Box */}
          <form onSubmit={handleSearchSubmit} className="sm:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 dark:text-[#8194A8] absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Search Account #, Customer Name, CIF, or PAN..."
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
                  fetchAccounts();
                }}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 focus:outline-none"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>

          {/* Account Type Filter */}
          <div className="sm:col-span-3">
            <select
              value={accountTypeFilter}
              onChange={(e) => {
                setAccountTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 dark:bg-[#101C2A] border border-slate-300 dark:border-[#33485D] rounded focus:bg-white dark:focus:bg-[#162638] focus:outline-none focus:ring-1 focus:ring-[#168C83] text-slate-800 dark:text-[#E8EEF5]"
            >
              <option value="ALL">All Account Types</option>
              <option value="SAVINGS">Savings (SB)</option>
              <option value="CURRENT">Current (CA)</option>
              <option value="SALARY">Salary Savings</option>
              <option value="FIXED_DEPOSIT">Fixed Deposit (FD)</option>
              <option value="RECURRING_DEPOSIT">Recurring Deposit (RD)</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="sm:col-span-2">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 dark:bg-[#101C2A] border border-slate-300 dark:border-[#33485D] rounded focus:bg-white dark:focus:bg-[#162638] focus:outline-none focus:ring-1 focus:ring-[#168C83] text-slate-800 dark:text-[#E8EEF5]"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Only</option>
              <option value="DEBIT_FREEZE">Debit Freeze</option>
              <option value="TOTAL_FREEZE">Total Freeze</option>
              <option value="DORMANT">Dormant</option>
            </select>
          </div>

          {/* Table Density & Sort Controls */}
          <div className="sm:col-span-2 flex items-center justify-end gap-1.5">
            <button
              onClick={() => handleSort('availableBalance')}
              className="flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-slate-100 dark:bg-[#192B3D] text-slate-700 dark:text-[#A9BACB] hover:bg-slate-200 dark:hover:bg-[#20364B] border border-slate-300 dark:border-[#33485D] transition-colors"
              title="Sort by Available Balance"
            >
              <ArrowUpDown className="w-3 h-3" />
              <span>Balance {sortBy === 'availableBalance' ? (sortOrder === 'asc' ? '↑' : '↓') : ''}</span>
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
              Showing <strong className="text-slate-800 dark:text-[#E8EEF5]">{displayedAccounts.length}</strong> of {paginationInfo.total} accounts:
            </span>

            {[
              { id: 'ALL', label: 'All Accounts' },
              { id: 'ACTIVE', label: 'Active Only' },
              { id: 'LIEN', label: 'Liens Marked' },
              { id: 'HNI', label: 'High Balance (> ₹10L)' },
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

          {(searchTerm || accountTypeFilter !== 'ALL' || statusFilter !== 'ALL' || quickFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setAccountTypeFilter('ALL');
                setStatusFilter('ALL');
                setQuickFilter('ALL');
                setCurrentPage(1);
                fetchAccounts();
              }}
              className="text-xs text-[#168C83] dark:text-[#1B9D92] hover:underline font-medium"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Accounts Data Table */}
      {loading ? (
        <div className="py-16 text-center text-slate-500 dark:text-[#8194A8] bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-[#168C83]" />
          <p className="text-xs">Querying PostgreSQL Accounts database...</p>
        </div>
      ) : error ? (
        <div className="p-6 text-center text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900 rounded">
          <AlertCircle className="w-6 h-6 mx-auto mb-2" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      ) : displayedAccounts.length === 0 ? (
        <EmptyState
          icon={<Landmark className="w-8 h-8 text-slate-400 dark:text-[#8194A8]" />}
          title="No bank accounts match criteria"
          description="No accounts match the current search term, account type, or status filters."
          actionLabel="Reset Filters"
          onAction={() => {
            setSearchTerm('');
            setAccountTypeFilter('ALL');
            setStatusFilter('ALL');
            setQuickFilter('ALL');
            setCurrentPage(1);
            fetchAccounts();
          }}
          className="py-12 bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded"
        />
      ) : (
        <div className="space-y-3">
          <Table
            data={displayedAccounts}
            columns={columns}
            keyExtractor={(a) => a.accountNumber}
            density={tableDensity}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            onRowClick={(a) => handleOpenAccountDetail(a)}
          />

          {/* Table Pagination Bar */}
          <div className="bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded p-2.5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-500 dark:text-[#8194A8]">
              <span>
                Showing page <strong className="text-slate-800 dark:text-[#E8EEF5]">{currentPage}</strong> of {paginationInfo.totalPages || 1}
                {' '}({paginationInfo.total} total accounts)
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

      {/* Account Detail Modal */}
      {selectedAcc && (
        <Modal
          isOpen={detailModalOpen}
          onClose={() => {
            setDetailModalOpen(false);
            setSelectedAcc(null);
          }}
          title={
            <div className="flex items-center gap-2">
              <Landmark className="w-4 h-4 text-[#168C83] dark:text-[#1B9D92]" />
              <span>Account Inquiry Dossier: {selectedAcc.schemeName || selectedAcc.accountNumber}</span>
            </div>
          }
          subtitle={`Account Number: ${selectedAcc.accountNumber} · Customer: ${selectedAcc.customerName}`}
          size="4xl"
        >
          <div className="space-y-4">
            {/* Account Identity & Status Strip */}
            <div className="bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded p-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200 dark:border-[#1F334A]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded bg-[#142C45] dark:bg-[#1B9D92] text-white flex items-center justify-center font-mono font-bold text-sm">
                    {selectedAcc.currency || 'INR'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-base font-bold text-slate-900 dark:text-[#E8EEF5]">
                        {unmaskedAccNumber
                          ? selectedAcc.accountNumber
                          : selectedAcc.maskedAccountNumber || `****${selectedAcc.accountNumber.slice(-4)}`}
                      </span>
                      <button
                        onClick={() => setUnmaskedAccNumber((prev) => !prev)}
                        className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 p-1"
                        title={unmaskedAccNumber ? 'Mask Account Number' : 'Reveal Full Account Number'}
                      >
                        {unmaskedAccNumber ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button
                        onClick={() => handleCopy(selectedAcc.accountNumber)}
                        className="text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 p-1"
                        title="Copy Account Number"
                      >
                        {copiedAcc ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                    <div className="text-xs text-slate-500 dark:text-[#8194A8] font-mono">
                      Scheme: {selectedAcc.schemeCode} • IFSC: {selectedAcc.ifscCode || 'CRVI0001042'}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Badge
                    variant={
                      selectedAcc.status === 'ACTIVE'
                        ? 'success'
                        : selectedAcc.status === 'DEBIT_FREEZE'
                        ? 'warning'
                        : 'danger'
                    }
                    size="md"
                  >
                    {selectedAcc.status}
                  </Badge>
                  {onRequestStatusChange && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRequestStatusChange(selectedAcc, 'DEBIT_FREEZE')}
                    >
                      Status Override
                    </Button>
                  )}
                </div>
              </div>

              {/* Cohesive 6-Metric Balance Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div className="bg-white dark:bg-[#162638] p-2.5 rounded border border-slate-200 dark:border-[#33485D]">
                  <span className="text-[10px] text-slate-500 dark:text-[#8194A8] uppercase font-mono block">Available Balance</span>
                  <span className="text-sm font-mono font-bold text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                    {formatINR(parseFloat(selectedAcc.availableBalance || '0'))}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Ready for withdrawal</span>
                </div>

                <div className="bg-white dark:bg-[#162638] p-2.5 rounded border border-slate-200 dark:border-[#33485D]">
                  <span className="text-[10px] text-slate-500 dark:text-[#8194A8] uppercase font-mono block">Current Ledger Balance</span>
                  <span className="text-sm font-mono font-bold text-slate-900 dark:text-[#E8EEF5] mt-0.5 block">
                    {formatINR(parseFloat(selectedAcc.ledgerBalance || '0'))}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Accounting position</span>
                </div>

                <div className="bg-white dark:bg-[#162638] p-2.5 rounded border border-slate-200 dark:border-[#33485D]">
                  <span className="text-[10px] text-slate-500 dark:text-[#8194A8] uppercase font-mono block">Lien / Encumbered Hold</span>
                  <span className="text-sm font-mono font-bold text-amber-600 dark:text-amber-400 mt-0.5 block">
                    {formatINR(parseFloat(selectedAcc.lienAmount || '0'))}
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Judicial / margin hold</span>
                </div>

                <div className="bg-white dark:bg-[#162638] p-2.5 rounded border border-slate-200 dark:border-[#33485D]">
                  <span className="text-[10px] text-slate-500 dark:text-[#8194A8] uppercase font-mono block">Interest Terms</span>
                  <span className="text-sm font-mono font-bold text-slate-900 dark:text-[#E8EEF5] mt-0.5 block">
                    {(Number(selectedAcc.interestRate) || 3.5).toFixed(2)}% p.a.
                  </span>
                  <span className="text-[9px] text-slate-400 block mt-0.5">Quarterly credit</span>
                </div>
              </div>
            </div>

            {/* Modal Detail Tabs */}
            <div className="flex items-center gap-1 border-b border-slate-200 dark:border-[#33485D] text-xs">
              <button
                onClick={() => setActiveDetailTab('TRANSACTIONS')}
                className={`py-2 px-3 border-b-2 font-medium transition-colors ${
                  activeDetailTab === 'TRANSACTIONS'
                    ? 'border-[#168C83] text-[#142C45] dark:text-[#1B9D92] font-semibold'
                    : 'border-transparent text-slate-600 dark:text-[#A9BACB] hover:text-slate-900'
                }`}
              >
                Transaction History ({txnPagination.total})
              </button>
              <button
                onClick={() => setActiveDetailTab('DETAILS')}
                className={`py-2 px-3 border-b-2 font-medium transition-colors ${
                  activeDetailTab === 'DETAILS'
                    ? 'border-[#168C83] text-[#142C45] dark:text-[#1B9D92] font-semibold'
                    : 'border-transparent text-slate-600 dark:text-[#A9BACB] hover:text-slate-900'
                }`}
              >
                Account Specifications
              </button>
              <button
                onClick={() => setActiveDetailTab('GOVERNANCE')}
                className={`py-2 px-3 border-b-2 font-medium transition-colors ${
                  activeDetailTab === 'GOVERNANCE'
                    ? 'border-[#168C83] text-[#142C45] dark:text-[#1B9D92] font-semibold'
                    : 'border-transparent text-slate-600 dark:text-[#A9BACB] hover:text-slate-900'
                }`}
              >
                Governance &amp; Restrictions
              </button>
            </div>

            {/* Tab 1: Transactions Table */}
            {activeDetailTab === 'TRANSACTIONS' && (
              <div className="space-y-3">
                {loadingTxns ? (
                  <div className="py-8 text-center text-slate-500 dark:text-[#8194A8]">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-1 text-[#168C83]" />
                    <p className="text-xs">Fetching transactions from database...</p>
                  </div>
                ) : txns.length === 0 ? (
                  <div className="p-6 text-center text-slate-500 dark:text-[#8194A8] bg-slate-50 dark:bg-[#101C2A] rounded border border-slate-200 dark:border-[#33485D]">
                    <p className="text-xs">No transactions recorded for this account.</p>
                  </div>
                ) : (
                  <div className="border border-slate-200 dark:border-[#33485D] rounded overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-100 dark:bg-[#101C2A] text-slate-700 dark:text-[#A9BACB] font-semibold border-b border-slate-200 dark:border-[#33485D]">
                          <tr>
                            <th className="px-3 py-2">Date</th>
                            <th className="px-3 py-2">Description</th>
                            <th className="px-3 py-2">Reference ID</th>
                            <th className="px-3 py-2 text-center">Type</th>
                            <th className="px-3 py-2 text-right">Amount</th>
                            <th className="px-3 py-2 text-right">Balance After</th>
                            <th className="px-3 py-2 text-center">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-[#1F334A] bg-white dark:bg-[#162638]">
                          {txns.map((t) => {
                            const isCredit = t.type === 'CREDIT';
                            return (
                              <tr key={t.id || t.transactionId} className="hover:bg-slate-50 dark:hover:bg-[#192B3D] transition-colors">
                                <td className="px-3 py-2 font-mono whitespace-nowrap text-slate-600 dark:text-[#A9BACB]">
                                  {t.date ? String(t.date).split('T')[0] : t.timestamp ? String(t.timestamp).split('T')[0] : '2026-09-09'}
                                </td>
                                <td className="px-3 py-2 max-w-[220px] truncate font-medium text-slate-900 dark:text-[#E8EEF5]" title={t.description || t.narration}>
                                  {t.description || t.narration || 'Transfer / Clearing'}
                                </td>
                                <td className="px-3 py-2 font-mono text-slate-600 dark:text-[#8194A8] max-w-[160px] truncate">
                                  {t.referenceNumber || t.utrNumber || t.transactionId || '—'}
                                </td>
                                <td className="px-3 py-2 text-center whitespace-nowrap">
                                  <Badge variant={isCredit ? 'success' : 'neutral'} size="sm">
                                    {t.type}
                                  </Badge>
                                </td>
                                <td className="px-3 py-2 font-mono font-semibold text-right whitespace-nowrap">
                                  <span className={isCredit ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-[#E8EEF5]'}>
                                    {isCredit ? '+' : '-'} {formatINR(parseFloat(String(t.amount || '0')))}
                                  </span>
                                </td>
                                <td className="px-3 py-2 font-mono text-right text-slate-700 dark:text-[#A9BACB] whitespace-nowrap">
                                  {t.balanceAfterTransaction || t.runningBalance
                                    ? formatINR(parseFloat(String(t.balanceAfterTransaction || t.runningBalance)))
                                    : '—'}
                                </td>
                                <td className="px-3 py-2 text-center whitespace-nowrap">
                                  <Badge variant={t.status === 'SETTLED' ? 'success' : 'warning'} size="sm">
                                    {t.status}
                                  </Badge>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    {/* Transactions Pagination Bar */}
                    <div className="px-3 py-2 bg-slate-50 dark:bg-[#101C2A] border-t border-slate-200 dark:border-[#33485D] flex items-center justify-between text-xs">
                      <span className="text-slate-500 dark:text-[#8194A8] font-mono">
                        Page {txnPage} of {txnPagination.totalPages || 1}
                      </span>
                      <div className="flex items-center gap-1">
                        <Button
                          size="xs"
                          variant="outline"
                          disabled={txnPage <= 1 || loadingTxns}
                          onClick={() => handleTxnPageChange(txnPage - 1)}
                        >
                          Previous
                        </Button>
                        <Button
                          size="xs"
                          variant="outline"
                          disabled={txnPage >= txnPagination.totalPages || loadingTxns}
                          onClick={() => handleTxnPageChange(txnPage + 1)}
                        >
                          Next
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Account Specifications */}
            {activeDetailTab === 'DETAILS' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded space-y-2">
                  <div className="font-semibold text-slate-900 dark:text-[#E8EEF5] border-b border-slate-200 dark:border-[#1F334A] pb-1.5 uppercase text-[11px] tracking-wide">
                    Branch &amp; Ownership
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-[#8194A8]">Customer Name:</span>
                    <span className="font-medium text-slate-800 dark:text-[#E8EEF5]">{selectedAcc.customerName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-[#8194A8]">CIF Number:</span>
                    <span className="font-mono text-slate-800 dark:text-[#E8EEF5]">{selectedAcc.cifNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-[#8194A8]">Branch:</span>
                    <span className="font-medium text-slate-800 dark:text-[#E8EEF5]">{selectedAcc.branchName} ({selectedAcc.branchCode})</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-[#8194A8]">IFSC Routing:</span>
                    <span className="font-mono text-slate-800 dark:text-[#E8EEF5]">{selectedAcc.ifscCode}</span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded space-y-2">
                  <div className="font-semibold text-slate-900 dark:text-[#E8EEF5] border-b border-slate-200 dark:border-[#1F334A] pb-1.5 uppercase text-[11px] tracking-wide">
                    Regulatory &amp; Product Mandate
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-[#8194A8]">Account Type:</span>
                    <span className="font-medium text-slate-800 dark:text-[#E8EEF5]">{selectedAcc.accountType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-[#8194A8]">Scheme Code:</span>
                    <span className="font-mono text-slate-800 dark:text-[#E8EEF5]">{selectedAcc.schemeCode}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-[#8194A8]">Opened Date:</span>
                    <span className="font-mono text-slate-800 dark:text-[#E8EEF5]">{String(selectedAcc.openDate || '').split('T')[0]}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-[#8194A8]">PAN / Tax ID:</span>
                    <span className="font-mono text-slate-800 dark:text-[#E8EEF5]">{selectedAcc.panNumber || '—'}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Governance & Restrictions */}
            {activeDetailTab === 'GOVERNANCE' && (
              <div className="space-y-3 text-xs">
                <div className="p-3.5 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded space-y-2">
                  <div className="font-semibold text-slate-900 dark:text-[#E8EEF5] flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span>Lien and Restrictive Hold Governance</span>
                  </div>
                  <p className="text-slate-600 dark:text-[#A9BACB] text-[11px] leading-relaxed">
                    Under Indian Banking Regulations (RBI PMLA &amp; Banking Regulation Act), marking liens requires a formal judicial mandate, credit pledge, or tax attachment notice. Holds prevent debit withdrawal up to the encumbered amount while preserving interest accrual.
                  </p>
                  <div className="flex items-center gap-2 pt-2">
                    {onRequestLienChange && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setDetailModalOpen(false);
                          onRequestLienChange(selectedAcc);
                        }}
                      >
                        Initiate Lien Hold Review
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Modal Footer */}
            <div className="pt-3 border-t border-slate-200 dark:border-[#33485D] flex items-center justify-between">
              <div className="text-[11px] text-slate-500 dark:text-[#8194A8] font-mono">
                Audit Record ID: ACC-{selectedAcc.id || selectedAcc.accountNumber} • Branch {selectedAcc.branchCode}
              </div>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  setDetailModalOpen(false);
                  setSelectedAcc(null);
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
