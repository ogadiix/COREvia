import React, { useState, useEffect } from 'react';
import {
  BankExecutiveMetrics,
  BankAccount,
  PaymentTransaction,
  PendingAuthorization,
  NextBestAction,
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
} from 'lucide-react';
import { TransactionReceiptModal } from '../modals/TransactionReceiptModal';
import { MarketMovementsWidget } from '../dashboard/MarketMovementsWidget';
import { NotificationStreamWidget } from '../notifications/NotificationStreamWidget';

interface DashboardModuleProps {
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
}

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
}) => {
  const [selectedReceiptPayment, setSelectedReceiptPayment] = useState<PaymentTransaction | null>(null);

  // Priority Next Best Actions State
  const [priorityActions, setPriorityActions] = useState<NextBestAction[]>([]);
  const [loadingPriorityActions, setLoadingPriorityActions] = useState<boolean>(false);
  const [selectedEvidenceAction, setSelectedEvidenceAction] = useState<NextBestAction | null>(null);
  const [selectedDismissAction, setSelectedDismissAction] = useState<NextBestAction | null>(null);
  const [selectedTaskAction, setSelectedTaskAction] = useState<NextBestAction | null>(null);
  const [radarStats, setRadarStats] = useState<any | null>(null);

  const loadPriorityActions = async () => {
    setLoadingPriorityActions(true);
    try {
      const res = await bankingApi.getNextBestActions({ limit: 4, status: 'ACTIVE' });
      setPriorityActions(res.data || []);
    } catch (err) {
      console.warn('Failed to load priority actions in DashboardModule:', err);
    } finally {
      setLoadingPriorityActions(false);
    }
  };

  useEffect(() => {
    loadPriorityActions();
    bankingApi.getOpportunityRadarStats()
      .then((s) => setRadarStats(s))
      .catch((e) => console.warn('Failed to load radar stats on dashboard:', e));
  }, []);

  const handleAcceptPriorityAction = async (action: NextBestAction) => {
    try {
      await bankingApi.acceptNextBestAction(action.id);
      loadPriorityActions();
    } catch (err) {
      console.error('Failed to accept action:', err);
    }
  };

  const handleConfirmDismissAction = async (id: number, reason: string) => {
    await bankingApi.dismissNextBestAction(id, reason);
    loadPriorityActions();
  };

  const handleConfirmCreateTaskFromAction = async (
    id: number,
    taskData: { title: string; dueDate: string; priority: string; description: string }
  ) => {
    await bankingApi.createTaskFromNextBestAction(id, taskData);
    loadPriorityActions();
  };

  const paymentColumns: Column<PaymentTransaction>[] = [
    {
      key: 'utrNumber',
      header: 'UTR / Txn ID',
      mono: true,
      render: (p) => (
        <div>
          <span className="font-mono font-medium text-slate-900">{p.utrNumber}</span>
          <div className="text-[10px] text-slate-500 font-sans">{p.rail} • {p.timestamp.split(' ')[1]}</div>
        </div>
      ),
    },
    {
      key: 'sourceName',
      header: 'Remitter / Beneficiary',
      render: (p) => (
        <div className="max-w-[220px]">
          <div className="font-medium text-slate-800 truncate">{p.sourceName}</div>
          <div className="text-[11px] text-slate-500 flex items-center gap-1 truncate">
            <span>to: {p.destName}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount (INR)',
      align: 'right',
      mono: true,
      render: (p) => (
        <span className="font-mono font-semibold text-slate-900">
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
          return <Badge variant="success" size="sm">Settled</Badge>;
        }
        if (p.status === 'PENDING_CLEARING') {
          return <Badge variant="warning" size="sm">Clearing</Badge>;
        }
        if (p.status === 'HELD_FOR_VERIFICATION') {
          return <Badge variant="danger" size="sm">Auth Held</Badge>;
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
            className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-medium text-amber-900 bg-amber-50 hover:bg-amber-100 border border-amber-300 rounded cursor-pointer transition-colors"
            title="View official formatted receipt"
          >
            <Printer className="w-3 h-3 text-amber-700" />
            <span>Receipt</span>
          </button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-5">
      {/* Top Notification / Alert Strip for Branch Operations */}
      <div className="bg-slate-50 border border-slate-200 rounded p-3 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-slate-700">
          <ShieldCheck className="w-4 h-4 text-[#0f1e36]" />
          <span className="font-medium text-slate-900">Branch Operations Status:</span>
          <span>Fort Branch (0104) is operating in Normal Business Hours. Real-time RTGS/NEFT settlement window is active.</span>
        </div>
        <div className="flex items-center gap-2">
          {pendingAuthorizations.length > 0 ? (
            <button
              onClick={onNavigateToMakerChecker}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-100 hover:bg-amber-200 text-amber-900 font-medium rounded-xs border border-amber-300 transition-colors cursor-pointer"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
              <span>{pendingAuthorizations.length} Items Require Checker Authorization</span>
            </button>
          ) : (
            <span className="inline-flex items-center gap-1 text-emerald-800 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>Checker Queue Clear</span>
            </span>
          )}
        </div>
      </div>

      {/* Primary Institutional Ratios & Balance Sheet Aggregates */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-600">
            Statutory Liquidity & Balance Sheet Aggregates
          </h2>
          <span className="font-mono text-[11px] text-slate-500">
            NDTL: {formatINR(metrics.netDemandAndTimeLiabilities, { compact: true })}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            id="stat-deposits"
            label="Total Deposits (CASA + Term)"
            value={formatINR(metrics.totalDepositsInr, { compact: true })}
            code="GL-1001"
            subtext="CASA Ratio: 43.80%"
            regulatoryBadge={{
              text: 'Adequate Liquidity',
              status: 'compliant',
            }}
          />

          <StatCard
            id="stat-advances"
            label="Gross Advances (Loan Book)"
            value={formatINR(metrics.totalAdvancesInr, { compact: true })}
            code="GL-2001"
            subtext="Credit-Deposit: 81.2%"
            regulatoryBadge={{
              text: 'Normal Range',
              status: 'compliant',
            }}
          />

          <StatCard
            id="stat-crr"
            label="Cash Reserve Ratio (CRR)"
            value={`${(Number(metrics?.crrMaintainedPercentage) || 4.54).toFixed(2)}%`}
            code="RBI SEC 42(1)"
            subtext="Statutory Floor: 4.50%"
            regulatoryBadge={{
              text: '+0.04% Surplus',
              status: 'compliant',
            }}
          />

          <StatCard
            id="stat-slr"
            label="Statutory Liquidity Ratio (SLR)"
            value={`${(Number(metrics?.slrMaintainedPercentage) || 18.65).toFixed(2)}%`}
            code="RBI SEC 24"
            subtext="Statutory Floor: 18.00%"
            regulatoryBadge={{
              text: '+0.65% G-Sec Buffer',
              status: 'compliant',
            }}
          />
        </div>
      </div>

      {/* Secondary Prudential & Asset Quality Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          id="stat-crar"
          label="Capital Adequacy (CRAR / Basel III)"
          value={`${(Number(metrics?.crarCapitalAdequacyPercentage) || 16.42).toFixed(2)}%`}
          code="BASEL-III"
          subtext="Regulatory Min: 11.50%"
          regulatoryBadge={{
            text: 'Tier-1 Capital: 14.8%',
            status: 'compliant',
          }}
        />

        <StatCard
          id="stat-gnpa"
          label="Gross NPA Ratio"
          value={`${(Number(metrics?.grossNpaPercentage) || 1.84).toFixed(2)}%`}
          code="ASSET-QUAL"
          subtext={`Net NPA: ${(Number(metrics?.netNpaPercentage) || 0.42).toFixed(2)}%`}
          regulatoryBadge={{
            text: 'PCR: 77.2%',
            status: 'compliant',
          }}
        />

        <StatCard
          id="stat-clearing-vol"
          label="Day's Clearing Turnover"
          value={formatINR(metrics.dailyClearingVolumeInr, { compact: true })}
          code="RTGS/NEFT/CTS"
          subtext={`${metrics.dailyClearingTransactionsCount.toLocaleString()} Transacted`}
        />

        <StatCard
          id="stat-vault-cash"
          label="Branch Vault Cash Holding"
          value={formatINR(metrics.vaultCashInHandInr, { compact: true })}
          code="VAULT-0104"
          subtext={`Cap Limit: ${formatINR(metrics.vaultCashAuthorizedLimitInr, { compact: true })}`}
          regulatoryBadge={{
            text: 'Within Limit',
            status: 'compliant',
          }}
        />
      </div>

      {/* Market Movements & Treasury Surveillance Widget */}
      <MarketMovementsWidget onNavigateToForex={onNavigateToTradeFinance} />

      {/* Intelligent Notifications & Operational Alerts Stream */}
      <NotificationStreamWidget
        onOpenNotificationsDrawer={onOpenNotificationsDrawer}
        onNavigateToEntity={onNavigateToEntity}
      />

      {/* Daily Relationship Brief (Phase 11 Signature Engine) */}
      <DailyRelationshipBriefWidget
        onNavigateToActions={onNavigateToNextBestActions}
        onNavigateToCustomer={onNavigateToCustomers}
      />

      {/* Opportunity Radar Executive Glance */}
      {radarStats && radarStats.totalActiveSignals > 0 && (
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-xl p-4 shadow-sm border border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-indigo-500/20 border border-indigo-400/30 text-indigo-300 shrink-0">
              <Radar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-indigo-300 uppercase tracking-wider">
                  Customer Opportunity Radar
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[11px] font-semibold border border-emerald-500/30">
                  {radarStats.totalActiveSignals} Active Signals
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Identified {radarStats.productGapsCount} product coverage gaps and {radarStats.relationshipOpportunitiesCount} relationship expansion opportunities across customer portfolios.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {onNavigateToOpportunityRadar && (
              <Button
                variant="primary"
                size="sm"
                onClick={onNavigateToOpportunityRadar}
                className="bg-brand-600 hover:bg-brand-700 text-white text-xs font-medium flex items-center gap-1.5"
              >
                <span>Launch Opportunity Radar</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Priority Relationship Actions Stream */}
      {priorityActions.length > 0 && (
        <div className="bg-white border border-slate-200 rounded p-4 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-600" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
                  Priority Relationship Recommendations
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-semibold">
                  Rule-Driven & Explainable
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Top recommendations derived from customer CORE scores, momentum trends, and open service cases.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={loadPriorityActions}
                disabled={loadingPriorityActions}
                className="text-xs inline-flex items-center gap-1"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loadingPriorityActions ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
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

      {/* Main Grid: Operational Modules & Recent Settlement Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left 2 Cols: Clearing Activity & Fast Voucher Trigger */}
        <div className="lg:col-span-2 space-y-4">
          {/* Quick Transaction Action Bar */}
          <div className="bg-white border border-slate-200 rounded p-4">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Branch Teller & Transaction Operations
                </h3>
                <p className="text-xs text-slate-500">
                  Initiate vouchers, payments, or ledger transfers with automatic four-eyes authorization checks.
                </p>
              </div>
              <Button
                size="sm"
                variant="primary"
                onClick={onOpenNewTransaction}
                icon={<ArrowUpRight className="w-3.5 h-3.5" />}
              >
                Initiate Transfer / Voucher
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-xs">
              <button
                onClick={onNavigateToAccounts}
                className="p-2.5 rounded border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left cursor-pointer transition-colors"
              >
                <div className="font-semibold text-slate-900">CASA Register</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Manage balances & liens</div>
              </button>
              <button
                onClick={onNavigateToLending}
                className="p-2.5 rounded border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left cursor-pointer transition-colors"
              >
                <div className="font-semibold text-slate-900">Drawing Power</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Inspect CC stock audits</div>
              </button>
              <button
                onClick={onNavigateToPayments}
                className="p-2.5 rounded border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left cursor-pointer transition-colors"
              >
                <div className="font-semibold text-slate-900">CTS Clearing</div>
                <div className="text-[11px] text-slate-500 mt-0.5">Cheque truncation batches</div>
              </button>
              <button
                onClick={onNavigateToMakerChecker}
                className="p-2.5 rounded border border-slate-200 hover:border-slate-300 hover:bg-slate-50 text-left cursor-pointer transition-colors"
              >
                <div className="font-semibold text-slate-900">Checker Queue</div>
                <div className="text-[11px] text-slate-500 mt-0.5">{pendingAuthorizations.length} items awaiting sign-off</div>
              </button>
            </div>
          </div>

          {/* Today's Transactions Table */}
          <div className="bg-white border border-slate-200 rounded">
            <div className="p-3.5 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Recent RTGS / NEFT / CTS Settlement Feed
                </h3>
                <span className="font-mono text-xs px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                  {recentPayments.length} txns
                </span>
              </div>
              <button
                onClick={onNavigateToPayments}
                className="text-xs text-[#0f1e36] hover:underline font-medium cursor-pointer"
              >
                View Clearing Switch →
              </button>
            </div>

            <Table
              columns={paymentColumns}
              data={recentPayments}
              keyExtractor={(p) => p.transactionId}
            />
          </div>
        </div>

        {/* Right 1 Col: Branch Cash & Statutory Health */}
        <div className="space-y-4">
          {/* Branch Cash & Vault Balancing Card */}
          <div className="bg-white border border-slate-200 rounded p-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  Branch Vault Position
                </h3>
              </div>
              <Badge variant="success" size="sm">Balanced</Badge>
            </div>

            <div className="mt-3 space-y-2.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Physical Vault Cash:</span>
                <span className="font-mono font-semibold text-slate-900">
                  {formatINR(metrics.vaultCashInHandInr)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Overnight Retention Cap:</span>
                <span className="font-mono text-slate-700">
                  {formatINR(metrics.vaultCashAuthorizedLimitInr)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Surplus to Remit (RBI Chest):</span>
                <span className="font-mono text-emerald-700 font-medium">₹0.00</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Last Physical Audit:</span>
                <span className="font-mono text-slate-600">09-SEP 11:15 IST</span>
              </div>
            </div>

            <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-500 bg-slate-50 p-2 rounded">
              <span className="font-semibold text-slate-700">Vault Custodians:</span>
              <div className="mt-0.5">Key Holder A: Suresh Patil (Head Teller)</div>
              <div>Key Holder B: Aditya Raj (Branch Operations Head)</div>
            </div>
          </div>

          {/* Core Banking System Engine Status */}
          <div className="bg-white border border-slate-200 rounded p-4">
            <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-slate-700" />
                <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-700">
                  RBI Clearing House Windows
                </h3>
              </div>
            </div>

            <div className="mt-3 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-600">RTGS Gross Settlement:</span>
                <Badge variant="success" size="sm">Active (08:00 - 16:30)</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">NEFT Half-Hourly Batches:</span>
                <Badge variant="success" size="sm">Active (24x7)</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">CTS-2010 Cheque Clearing:</span>
                <Badge variant="warning" size="sm">Batch 2 Closing 15:00</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-600">UPI / IMPS NPCI Switch:</span>
                <Badge variant="success" size="sm">Operational (99.98%)</Badge>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs text-slate-500 mb-1.5">
                <span>Statutory CRR Buffer</span>
                <span className="font-mono text-slate-800 font-medium">100.9%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                <div className="bg-emerald-600 h-1.5 rounded-full w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Official Formatted Printable Transaction Receipt Modal */}
      {selectedReceiptPayment && (
        <TransactionReceiptModal
          isOpen={!!selectedReceiptPayment}
          onClose={() => setSelectedReceiptPayment(null)}
          transaction={selectedReceiptPayment}
        />
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
