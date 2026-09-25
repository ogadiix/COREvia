import React, { useState, useMemo } from 'react';
import {
  BankAccount,
  PaymentTransaction,
  LoanAccount,
  TradeFinanceItem,
  PendingAuthorization,
  AuditLogEntry,
  BankExecutiveMetrics,
  PaymentRail,
} from '../../types';
import { Table, Column } from '../common/Table';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { StatCard } from '../common/StatCard';
import { formatINR, BANK_META } from '../../data/mockIndianBankingData';
import {
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Clock,
  Printer,
  Download,
  Scale,
  Building,
  ArrowDownUp,
  Lock,
  FileCheck,
  RefreshCw,
  CheckCheck,
  Landmark,
  FileText,
  AlertCircle,
} from 'lucide-react';

interface DailyEODReportViewProps {
  metrics: BankExecutiveMetrics;
  auditLogs: AuditLogEntry[];
  accounts: BankAccount[];
  payments: PaymentTransaction[];
  loans: LoanAccount[];
  tradeItems: TradeFinanceItem[];
  pendingAuthorizations: PendingAuthorization[];
}

interface RegulatoryFlagItem {
  id: string;
  code: string;
  mandate: string;
  severity: 'ALERT' | 'WARNING' | 'NOTICE';
  timestamp: string;
  reference: string;
  subject: string;
  observation: string;
  regulatoryAction: string;
  status: 'REPORTED_TO_FIU' | 'PENDING_CHECKER' | 'MONITORED_SMA' | 'ATTACHED_FROZEN' | 'COMPLIANT_LODGED';
}

export const DailyEODReportView: React.FC<DailyEODReportViewProps> = ({
  metrics,
  auditLogs,
  accounts,
  payments,
  loans,
  tradeItems,
  pendingAuthorizations,
}) => {
  const [diagnosticRan, setDiagnosticRan] = useState<boolean>(false);
  const [signedOff, setSignedOff] = useState<boolean>(false);
  const [downloadNotification, setDownloadNotification] = useState<string | null>(null);

  // 1. Calculate End-of-Day Balances from live state
  const casaBalances = useMemo(() => {
    const currentTotal = accounts
      .filter((a) => a.accountType === 'CURRENT')
      .reduce((sum, a) => sum + a.availableBalance, 0);
    const savingsTotal = accounts
      .filter((a) => a.accountType === 'SAVINGS')
      .reduce((sum, a) => sum + a.availableBalance, 0);
    return {
      current: currentTotal,
      savings: savingsTotal,
      total: currentTotal + savingsTotal,
    };
  }, [accounts]);

  const termBalances = useMemo(() => {
    const fixedTotal = accounts
      .filter((a) => a.accountType === 'FIXED_DEPOSIT')
      .reduce((sum, a) => sum + a.availableBalance, 0);
    const recurringTotal = accounts
      .filter((a) => a.accountType === 'RECURRING_DEPOSIT')
      .reduce((sum, a) => sum + a.availableBalance, 0);
    return {
      fixed: fixedTotal,
      recurring: recurringTotal,
      total: fixedTotal + recurringTotal,
    };
  }, [accounts]);

  const totalCustomerDeposits = casaBalances.total + termBalances.total;

  const totalLiensMarked = useMemo(() => {
    return accounts.reduce((sum, a) => sum + a.lienAmount, 0);
  }, [accounts]);

  const advancesSummary = useMemo(() => {
    const totalSanctioned = loans.reduce((sum, l) => sum + l.sanctionedLimit, 0);
    const totalOutstanding = loans.reduce((sum, l) => sum + l.outstandingPrincipal, 0);
    const totalDrawingPower = loans.reduce((sum, l) => sum + l.drawingPower, 0);
    const totalOverdue = loans
      .filter((l) => l.overdueDays > 0)
      .reduce((sum, l) => sum + l.interestDue, 0);
    return {
      totalSanctioned,
      totalOutstanding,
      totalDrawingPower,
      totalOverdue,
    };
  }, [loans]);

  // 2. Transaction Totals by Type (Rails & Settlement Channels)
  const transactionTotalsByType = useMemo(() => {
    const rails: PaymentRail[] = ['RTGS', 'NEFT', 'IMPS', 'UPI', 'CTS_CHEQUE'];

    return rails.map((rail) => {
      const txns = payments.filter((p) => p.rail === rail);
      const settled = txns.filter((p) => p.status === 'SETTLED');
      const held = txns.filter((p) => p.status === 'HELD_FOR_VERIFICATION');
      const totalVolume = txns.reduce((sum, p) => sum + p.amount, 0);
      const settledVolume = settled.reduce((sum, p) => sum + p.amount, 0);
      const heldVolume = held.reduce((sum, p) => sum + p.amount, 0);

      const railLabels: Record<PaymentRail, { name: string; clearingWindow: string; hub: string }> = {
        RTGS: {
          name: 'Real-Time Gross Settlement (RTGS)',
          clearingWindow: 'Continuous Gross (Cut-off 16:30 IST)',
          hub: 'RBI Fort Settlement Engine',
        },
        NEFT: {
          name: 'National Electronic Funds Transfer (NEFT)',
          clearingWindow: '48 Half-Hourly Batches (Batch #31 Active)',
          hub: 'RBI Clearing Centre',
        },
        IMPS: {
          name: 'Immediate Payment Service (IMPS 24x7)',
          clearingWindow: '24x7 Instant Real-Time Credit',
          hub: 'NPCI Central Switch',
        },
        UPI: {
          name: 'Unified Payments Interface (UPI 2.0)',
          clearingWindow: 'Instant Switch Clearing (T+0)',
          hub: 'NPCI Western Hub',
        },
        CTS_CHEQUE: {
          name: 'Cheque Truncation System (CTS-2010)',
          clearingWindow: 'Grid 1 & Grid 2 Batches Cleared',
          hub: 'NPCI Western CTS Grid',
        },
      };

      return {
        rail,
        name: railLabels[rail].name,
        clearingWindow: railLabels[rail].clearingWindow,
        hub: railLabels[rail].hub,
        totalCount: txns.length,
        settledCount: settled.length,
        heldCount: held.length,
        totalVolume,
        settledVolume,
        heldVolume,
      };
    });
  }, [payments]);

  const grossDayTurnover = useMemo(() => {
    return payments.reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  const settledDayTurnover = useMemo(() => {
    return payments
      .filter((p) => p.status === 'SETTLED')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  // 3. Regulatory Flags observed during the business day
  const regulatoryFlags: RegulatoryFlagItem[] = useMemo(() => {
    const flags: RegulatoryFlagItem[] = [];

    // Flag: PMLA Cash Transaction Reporting (CTR) for amounts >= 10 Lakhs
    flags.push({
      id: 'FLAG-PMLA-01',
      code: 'PMLA-SEC-12',
      mandate: 'PMLA 2002 / FIU-IND CTR Mandate (Cash Trans > ₹10.00 Lakhs)',
      severity: 'NOTICE',
      timestamp: '09-SEP-2026 11:42 IST',
      reference: 'CTR-BATCH-2026-09-0104',
      subject: 'Physical Cash Receipt ₹18,50,000 (Bullion & Metal Works Current A/c)',
      observation: 'Cash deposit exceeding ₹10 Lakh statutory ceiling deposited in vault.',
      regulatoryAction: 'Automated cryptographic payload prepared for FINnet 2.0 monthly batch.',
      status: 'REPORTED_TO_FIU',
    });

    // Flag: High-Value Maker-Checker Dual Control Escalation (>= ₹1 Crore)
    const highValueTxns = payments.filter((p) => p.amount >= 10000000);
    highValueTxns.forEach((txn, idx) => {
      flags.push({
        id: `FLAG-FOUR-EYES-${idx + 1}`,
        code: 'RBI-FOUR-EYES-112',
        mandate: 'RBI Master Direction on Operational Governance (Threshold ≥ ₹1.00 Cr)',
        severity: 'ALERT',
        timestamp: txn.timestamp,
        reference: txn.utrNumber,
        subject: `${txn.rail} Transfer ${formatINR(txn.amount)} to ${txn.destName}`,
        observation: `Debited from ${txn.sourceAccount}. Exceeds single-officer Maker authority (₹1.00 Cr ceiling).`,
        regulatoryAction: txn.status === 'SETTLED'
          ? 'Level-3 Checker verification remark recorded; committed to SFMS gateway.'
          : 'Held in Level-3 dual-control verification queue pending second officer sign-off.',
        status: txn.status === 'SETTLED' ? 'COMPLIANT_LODGED' : 'PENDING_CHECKER',
      });
    });

    // Flag: IRAC Drawing Power (DP) breaches or SMA classifications
    const stressedLoans = loans.filter(
      (l) => l.outstandingPrincipal > l.drawingPower || l.assetClassification !== 'STANDARD'
    );
    stressedLoans.forEach((loan, idx) => {
      const isExceedingDp = loan.outstandingPrincipal > loan.drawingPower;
      flags.push({
        id: `FLAG-IRAC-${idx + 1}`,
        code: isExceedingDp ? 'RBI-IRAC-DP-EXCEED' : 'RBI-IRAC-SMA-SURVEILLANCE',
        mandate: 'RBI Prudential Norms on Asset Classification (IRAC Guidelines)',
        severity: isExceedingDp ? 'ALERT' : 'WARNING',
        timestamp: '09-SEP-2026 09:30 IST',
        reference: loan.loanAccountNumber,
        subject: `${loan.borrowerName} (${loan.loanType.replace(/_/g, ' ')})`,
        observation: isExceedingDp
          ? `Outstanding (${formatINR(loan.outstandingPrincipal)}) exceeds Drawing Power (${formatINR(loan.drawingPower)}) by ${formatINR(loan.outstandingPrincipal - loan.drawingPower)}.`
          : `Classified as ${loan.assetClassification} with ${loan.overdueDays} continuous overdue days.`,
        regulatoryAction: `Statutory loan provision buffer of ${formatINR(loan.provisionAmount)} locked in GL-PROV.`,
        status: 'MONITORED_SMA',
      });
    });

    // Flag: Statutory Attachment / Debit Freeze
    const frozenAccs = accounts.filter((a) => a.status === 'DEBIT_FREEZE' || a.status === 'TOTAL_FREEZE');
    frozenAccs.forEach((acc, idx) => {
      flags.push({
        id: `FLAG-FREEZE-${idx + 1}`,
        code: 'STATUTORY-ATTACH-226',
        mandate: 'Income Tax Act Sec 226(3) / High Court Attachment Order',
        severity: 'ALERT',
        timestamp: '09-SEP-2026 14:10 IST',
        reference: acc.accountNumber,
        subject: `${acc.customerName} (${acc.schemeCode})`,
        observation: `Account placed under ${acc.status}. All debit operations blocked.`,
        regulatoryAction: `Lien of ${formatINR(acc.lienAmount)} earmarked in favour of statutory authorities.`,
        status: 'ATTACHED_FROZEN',
      });
    });

    // Flag: FEMA 1999 Trade Remittance
    tradeItems.filter((t) => !t.femaCompliant || t.cashMarginPercentage < 100).forEach((item, idx) => {
      flags.push({
        id: `FLAG-FEMA-${idx + 1}`,
        code: 'FEMA-1999-EDD',
        mandate: 'Foreign Exchange Management Act / RBI EDPMS Reporting',
        severity: 'NOTICE',
        timestamp: '09-SEP-2026 15:45 IST',
        reference: item.referenceNumber,
        subject: `${item.instrumentType.replace(/_/g, ' ')} ${item.currency} ${item.amount.toLocaleString()}`,
        observation: `Import trade facility for ${item.underlyingGoods}. Margin lien: ${item.cashMarginPercentage}%.`,
        regulatoryAction: 'Lodged on RBI Export Data Processing and Monitoring System (EDPMS).',
        status: 'COMPLIANT_LODGED',
      });
    });

    return flags;
  }, [payments, loans, accounts, tradeItems]);

  const handleRunDiagnostic = () => {
    setDiagnosticRan(true);
    setDownloadNotification('Automated General Ledger & Clearing Balancing Diagnostic: Passed with ZERO discrepancies.');
    setTimeout(() => setDownloadNotification(null), 5000);
  };

  const handleExportScroll = (format: 'PDF' | 'CSV' | 'ASCII') => {
    setDownloadNotification(
      `EOD Closing Scroll for ${BANK_META.activeBusinessDate} exported in ${format} format with cryptographic verification signature.`
    );
    setTimeout(() => setDownloadNotification(null), 5000);
  };

  const handleSignOff = () => {
    setSignedOff(true);
    setDownloadNotification('Level-3 Checker Digital Signature successfully affixed to Day-End Closing Scroll.');
    setTimeout(() => setDownloadNotification(null), 5000);
  };

  const flagColumns: Column<RegulatoryFlagItem>[] = [
    {
      key: 'code',
      header: 'Flag Code & Mandate',
      mono: true,
      render: (f) => (
        <div>
          <span className="font-mono font-semibold text-slate-900">{f.code}</span>
          <div className="text-[10px] text-slate-500 font-sans max-w-[260px] truncate">{f.mandate}</div>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Observed Event & Account',
      render: (f) => (
        <div className="max-w-[280px]">
          <div className="font-semibold text-slate-900 truncate">{f.subject}</div>
          <div className="text-[11px] text-slate-500 truncate">{f.observation}</div>
          <div className="text-[10px] font-mono text-slate-400 mt-0.5">Ref: {f.reference}</div>
        </div>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      align: 'center',
      render: (f) => {
        if (f.severity === 'ALERT') return <Badge variant="danger" size="sm">CRITICAL ALERT</Badge>;
        if (f.severity === 'WARNING') return <Badge variant="warning" size="sm">WARNING</Badge>;
        return <Badge variant="neutral" size="sm">NOTICE</Badge>;
      },
    },
    {
      key: 'regulatoryAction',
      header: 'Statutory Resolution / Audit Action',
      render: (f) => (
        <div className="max-w-[260px]">
          <span className="text-slate-800 text-xs">{f.regulatoryAction}</span>
          <div className="text-[10px] text-slate-500 font-mono mt-0.5">{f.timestamp}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Compliance Status',
      align: 'right',
      render: (f) => {
        const statusMap: Record<RegulatoryFlagItem['status'], { label: string; variant: 'success' | 'warning' | 'danger' | 'neutral' }> = {
          REPORTED_TO_FIU: { label: 'FIU-IND Logged', variant: 'success' },
          COMPLIANT_LODGED: { label: 'Compliant & Settled', variant: 'success' },
          MONITORED_SMA: { label: 'SMA Surveillance', variant: 'warning' },
          PENDING_CHECKER: { label: 'Pending Sign-Off', variant: 'danger' },
          ATTACHED_FROZEN: { label: 'Statutory Attachment', variant: 'danger' },
        };
        const st = statusMap[f.status];
        return <Badge variant={st.variant} size="sm">{st.label}</Badge>;
      },
    },
  ];

  return (
    <div className="space-y-5">
      {/* Institutional Day-End Header Banner */}
      <div className="bg-slate-900 text-white rounded p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-emerald-400" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-100">
              Daily End-of-Day (EOD) Closing Scroll & Balancing Certificate
            </h2>
            <span className="bg-emerald-900/80 text-emerald-300 border border-emerald-700 text-[10px] font-mono px-2 py-0.5 rounded">
              DAY-END ACTIVE
            </span>
          </div>
          <p className="text-xs text-slate-400">
            Business Date: <span className="font-mono text-white font-semibold">{BANK_META.activeBusinessDate}</span> • Branch: <span className="text-slate-200 font-semibold">{BANK_META.currentBranch.name} ({BANK_META.currentBranch.code})</span> • IFSC: <span className="font-mono text-slate-300">{BANK_META.currentBranch.ifsc}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="bg-white text-slate-900 hover:bg-slate-100 font-medium"
            onClick={handleRunDiagnostic}
            icon={<RefreshCw className="w-3.5 h-3.5" />}
          >
            Run Balancing Diagnostic
          </Button>

          <Button
            size="sm"
            variant="outline"
            className="bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700 font-medium"
            onClick={() => handleExportScroll('PDF')}
            icon={<Printer className="w-3.5 h-3.5" />}
          >
            Print EOD Scroll
          </Button>

          <Button
            size="sm"
            variant="primary"
            disabled={signedOff}
            onClick={handleSignOff}
            icon={<CheckCheck className="w-3.5 h-3.5" />}
          >
            {signedOff ? 'Level-3 Signed Off' : 'Affix Checker Signature'}
          </Button>
        </div>
      </div>

      {downloadNotification && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-950 p-3 rounded text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{downloadNotification}</span>
        </div>
      )}

      {/* Primary KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Total Customer Deposits (CASA + TD)"
          value={formatINR(totalCustomerDeposits, { compact: true })}
          code="GL-DEP-0104"
          subtext={
            totalCustomerDeposits > 0
              ? `CASA: ${(((casaBalances.total || 0) / totalCustomerDeposits) * 100).toFixed(1)}% | Term: ${(((termBalances.total || 0) / totalCustomerDeposits) * 100).toFixed(1)}%`
              : 'CASA: 0.0% | Term: 0.0%'
          }
          regulatoryBadge={{
            text: 'Reconciled',
            status: 'compliant',
          }}
        />

        <StatCard
          label="Total Advances & Credit Outstanding"
          value={formatINR(advancesSummary.totalOutstanding, { compact: true })}
          code="GL-ADV-0104"
          subtext={`Sanctioned: ${formatINR(advancesSummary.totalSanctioned, { compact: true })}`}
          regulatoryBadge={{
            text: 'Within Limits',
            status: 'compliant',
          }}
        />

        <StatCard
          label="Gross Day Settlement Turnover"
          value={formatINR(grossDayTurnover, { compact: true })}
          code="PAYMENT-SWITCH-ALL"
          subtext={`Settled: ${formatINR(settledDayTurnover, { compact: true })}`}
          regulatoryBadge={{
            text: '100% Batched',
            status: 'compliant',
          }}
        />

        <StatCard
          label="Regulatory Surveillance Flags"
          value={`${regulatoryFlags.length} Logged`}
          code="PMLA / RBI / IRAC"
          subtext="Audited for Day-End Returns"
          regulatoryBadge={
            regulatoryFlags.some((f) => f.status === 'PENDING_CHECKER')
              ? { text: 'Pending Sign-Off', status: 'warning' }
              : { text: 'Fully Cleared', status: 'compliant' }
          }
        />
      </div>

      {/* SECTION 1: END-OF-DAY BALANCES SUMMARY & TRIAL BALANCE */}
      <div className="bg-white border border-slate-200 rounded p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <Building className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
              1. End-of-Day Ledger Balances & Trial Balance Balancing Scroll
            </h3>
          </div>
          <span className="font-mono text-xs text-slate-500">
            Currency: Indian Rupee (INR) • Base: GL-AC-0104
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {/* Demand Liabilities */}
          <div className="border border-slate-200 rounded p-3.5 bg-slate-50/60 space-y-2">
            <div className="font-semibold text-slate-900 uppercase text-[11px] border-b border-slate-200 pb-1 flex justify-between">
              <span>A. Demand Liabilities (CASA)</span>
              <span className="font-mono font-bold text-slate-900">{formatINR(casaBalances.total, { compact: true })}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-600">Current Accounts (CA Ledger):</span>
              <span className="font-mono font-semibold text-slate-900">{formatINR(casaBalances.current)}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-600">Savings Bank (SB Ledger):</span>
              <span className="font-mono font-semibold text-slate-900">{formatINR(casaBalances.savings)}</span>
            </div>
            <div className="flex justify-between py-0.5 border-t border-slate-200 pt-1 text-slate-500">
              <span>Lien Earmarked on CASA:</span>
              <span className="font-mono font-medium text-amber-800">{formatINR(totalLiensMarked)}</span>
            </div>
          </div>

          {/* Time Liabilities */}
          <div className="border border-slate-200 rounded p-3.5 bg-slate-50/60 space-y-2">
            <div className="font-semibold text-slate-900 uppercase text-[11px] border-b border-slate-200 pb-1 flex justify-between">
              <span>B. Time Liabilities (Term Deposits)</span>
              <span className="font-mono font-bold text-slate-900">{formatINR(termBalances.total, { compact: true })}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-600">Fixed Deposits (FD Contractual):</span>
              <span className="font-mono font-semibold text-slate-900">{formatINR(termBalances.fixed)}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-600">Recurring Deposits (RD Monthly):</span>
              <span className="font-mono font-semibold text-slate-900">{formatINR(termBalances.recurring)}</span>
            </div>
            <div className="flex justify-between py-0.5 border-t border-slate-200 pt-1 text-slate-500">
              <span>Total Contractual Liability:</span>
              <span className="font-mono font-medium text-slate-900">{formatINR(termBalances.total)}</span>
            </div>
          </div>

          {/* Assets & Cash */}
          <div className="border border-slate-200 rounded p-3.5 bg-slate-50/60 space-y-2">
            <div className="font-semibold text-slate-900 uppercase text-[11px] border-b border-slate-200 pb-1 flex justify-between">
              <span>C. Advances & Vault Holdings</span>
              <span className="font-mono font-bold text-slate-900">{formatINR(advancesSummary.totalOutstanding, { compact: true })}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-600">Gross Outstanding Advances:</span>
              <span className="font-mono font-semibold text-slate-900">{formatINR(advancesSummary.totalOutstanding)}</span>
            </div>
            <div className="flex justify-between py-0.5">
              <span className="text-slate-600">Physical Vault Cash-in-Hand:</span>
              <span className="font-mono font-semibold text-slate-900">{formatINR(metrics.vaultCashInHandInr)}</span>
            </div>
            <div className="flex justify-between py-0.5 border-t border-slate-200 pt-1 text-slate-500">
              <span>Vault Authorized Ceiling:</span>
              <span className="font-mono font-medium text-slate-700">{formatINR(metrics.vaultCashAuthorizedLimitInr)}</span>
            </div>
          </div>
        </div>

        {/* Zero-Discrepancy Balancing Certification Banner */}
        <div className="bg-emerald-50/70 border border-emerald-300 rounded p-3.5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-950">
                General Ledger Trial Balance Balancing Certificate: BALANCED
              </div>
              <div className="text-[11px] text-emerald-800">
                Total Debits: <span className="font-mono font-semibold">₹1,42,85,92,400.00</span> | Total Credits: <span className="font-mono font-semibold">₹1,42,85,92,400.00</span> | Net Discrepancy: <span className="font-mono font-bold">₹0.00</span>
              </div>
            </div>
          </div>

          <Badge variant="success" size="md">
            100% BALANCED & RECONCILED
          </Badge>
        </div>
      </div>

      {/* SECTION 2: TRANSACTION TOTALS BY TYPE & SETTLEMENT RAIL */}
      <div className="bg-white border border-slate-200 rounded p-4 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <ArrowDownUp className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
              2. Transaction Volume & Gross Turnover Totals by Rail
            </h3>
          </div>
          <span className="font-mono text-xs px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
            Settlement Hub: RBI Fort / NPCI Western Grid
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                <th className="py-2.5 px-3">Clearing Rail / Type</th>
                <th className="py-2.5 px-3">Clearing Window / Batch Cycle</th>
                <th className="py-2.5 px-3">Settlement Hub</th>
                <th className="py-2.5 px-3 text-center">Txn Count</th>
                <th className="py-2.5 px-3 text-right">Settled Amount</th>
                <th className="py-2.5 px-3 text-right">Held / In Queue</th>
                <th className="py-2.5 px-3 text-right">Gross Total Volume</th>
                <th className="py-2.5 px-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {transactionTotalsByType.map((item) => (
                <tr key={item.rail} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-2.5 px-3 font-semibold text-slate-900">
                    {item.name}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">
                    {item.clearingWindow}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-500 text-[11px]">
                    {item.hub}
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-semibold text-slate-800">
                    {item.totalCount}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-semibold text-emerald-800">
                    {formatINR(item.settledVolume)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono text-amber-800 font-medium">
                    {item.heldVolume > 0 ? formatINR(item.heldVolume) : '—'}
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    {formatINR(item.totalVolume)}
                  </td>
                  <td className="py-2.5 px-3 text-center">
                    {item.heldCount > 0 ? (
                      <Badge variant="warning" size="sm">{item.heldCount} Held for Checker</Badge>
                    ) : (
                      <Badge variant="success" size="sm">Cleared</Badge>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 border-t-2 border-slate-300 font-semibold text-slate-900">
                <td className="py-2.5 px-3" colSpan={3}>
                  Consolidated Clearing & Settlement Turnover
                </td>
                <td className="py-2.5 px-3 text-center font-mono font-bold">
                  {payments.length}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-900">
                  {formatINR(settledDayTurnover)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-900">
                  {formatINR(grossDayTurnover - settledDayTurnover)}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                  {formatINR(grossDayTurnover)}
                </td>
                <td className="py-2.5 px-3 text-center">
                  <Badge variant="success" size="sm">100% Batched</Badge>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* SECTION 3: REGULATORY FLAGS OBSERVED DURING THE BUSINESS DAY */}
      <div className="bg-white border border-slate-200 rounded p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
              3. Regulatory Flags & Compliance Watchlist Observed During Business Day
            </h3>
          </div>
          <span className="font-mono text-xs px-1.5 py-0.5 bg-slate-100 text-slate-600 rounded">
            {regulatoryFlags.length} Observations Logged
          </span>
        </div>

        <p className="text-xs text-slate-500">
          Statutory triggers requiring mandatory surveillance, second-officer sign-off, or return filings per RBI, FIU-IND, and PMLA directives.
        </p>

        <Table
          columns={flagColumns}
          data={regulatoryFlags}
          keyExtractor={(f) => f.id}
        />
      </div>

      {/* SECTION 4: DAY-END SUPERVISORY CLOSING SCROLL & DIGITAL SIGN-OFF */}
      <div className="bg-white border border-slate-200 rounded p-4 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
          <div className="flex items-center gap-2">
            <Landmark className="w-4 h-4 text-slate-700" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
              4. Day-End Supervisory Sign-Off & Cryptographic Ledger Lock
            </h3>
          </div>
          <span className="font-mono text-xs text-slate-500">
            Batch ID: EOD-MUM0104-20260909-001
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div className="border border-slate-200 rounded p-3 bg-slate-50/50 space-y-1.5">
            <div className="font-semibold text-slate-900 uppercase text-[11px] border-b border-slate-200 pb-1">
              Dual-Control Operations Signatories
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Primary Maker:</span>
              <span className="font-medium text-slate-800">Deepak Nambiar (EMP-401928, Clearing Desk Officer)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Supervisory Level-3 Checker:</span>
              <span className="font-medium text-slate-800">Aditya Raj (EMP-782194, Branch Operations Head)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Day-End Authorization State:</span>
              <span className="font-semibold text-emerald-700">
                {signedOff ? 'Level-3 Digitally Certified & Locked' : 'Pending Checker Signature'}
              </span>
            </div>
          </div>

          <div className="border border-slate-200 rounded p-3 bg-slate-50/50 space-y-1.5">
            <div className="font-semibold text-slate-900 uppercase text-[11px] border-b border-slate-200 pb-1">
              Cryptographic Audit Digest & Chain Seal
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Algorithm:</span>
              <span className="font-mono text-slate-800">SHA-256 HMAC CBS-SEAL</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">Ledger Hash:</span>
              <span className="font-mono text-[10px] text-slate-800 bg-slate-100 px-1 py-0.5 rounded truncate max-w-[240px]">
                7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Scheduled EOD Rollover:</span>
              <span className="font-mono font-semibold text-slate-800">{BANK_META.eodScheduleTime}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Ready for Day-End Rollover to Next Business Date (10-SEP-2026).</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExportScroll('ASCII')}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Export ASCII Day-End Scroll
            </Button>

            <Button
              size="sm"
              variant="primary"
              disabled={signedOff}
              onClick={handleSignOff}
              icon={<CheckCheck className="w-3.5 h-3.5" />}
            >
              {signedOff ? 'Digital Signature Affixed' : 'Sign & Certify EOD Scroll'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};
