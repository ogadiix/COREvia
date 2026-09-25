import React, { useState } from 'react';
import {
  AuditLogEntry,
  BankExecutiveMetrics,
  BankAccount,
  PaymentTransaction,
  LoanAccount,
  TradeFinanceItem,
  PendingAuthorization,
} from '../../types';
import { Table, Column } from '../common/Table';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { StatCard } from '../common/StatCard';
import { Tabs } from '../common/Tabs';
import { formatINR } from '../../data/mockIndianBankingData';
import { DailyEODReportView } from './DailyEODReportView';
import {
  FileSpreadsheet,
  ShieldCheck,
  Download,
  CheckCircle2,
  Terminal,
  Printer,
  Calendar,
  Building,
} from 'lucide-react';

interface AuditRegulatoryModuleProps {
  auditLogs: AuditLogEntry[];
  metrics: BankExecutiveMetrics;
  accounts: BankAccount[];
  payments: PaymentTransaction[];
  loans: LoanAccount[];
  tradeItems: TradeFinanceItem[];
  pendingAuthorizations: PendingAuthorization[];
}

export const AuditRegulatoryModule: React.FC<AuditRegulatoryModuleProps> = ({
  auditLogs,
  metrics,
  accounts,
  payments,
  loans,
  tradeItems,
  pendingAuthorizations,
}) => {
  const [activeTab, setActiveTab] = useState<string>('daily-eod-report');
  const [downloadNotice, setDownloadNotice] = useState<string | null>(null);

  const handleExport = (reportName: string) => {
    setDownloadNotice(`${reportName} package generated and queued for cryptographic signature.`);
    setTimeout(() => setDownloadNotice(null), 4000);
  };

  const logColumns: Column<AuditLogEntry>[] = [
    {
      key: 'timestamp',
      header: 'Timestamp & Operator',
      mono: true,
      render: (log) => (
        <div>
          <span className="font-mono text-slate-900 font-medium">{log.timestamp}</span>
          <div className="text-[10px] text-slate-500 font-sans">
            Op: <span className="font-semibold text-slate-700">{log.operatorName}</span> ({log.operatorId})
          </div>
        </div>
      ),
    },
    {
      key: 'module',
      header: 'Subsystem / Module',
      render: (log) => (
        <span className="font-mono text-[11px] px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded-xs">
          {log.module}
        </span>
      ),
    },
    {
      key: 'action',
      header: 'Committed Operation',
      render: (log) => (
        <div>
          <div className="font-semibold text-slate-900">{log.action.replace(/_/g, ' ')}</div>
          <div className="text-[11px] text-slate-500 font-mono truncate max-w-[280px]">
            Ref: {log.recordIdentifier}
          </div>
        </div>
      ),
    },
    {
      key: 'terminalId',
      header: 'Terminal & IP',
      mono: true,
      render: (log) => (
        <div>
          <span className="text-slate-800">{log.terminalId}</span>
          <div className="text-[10px] text-slate-400">{log.ipAddress}</div>
        </div>
      ),
    },
    {
      key: 'severity',
      header: 'Severity',
      align: 'center',
      render: (log) => {
        if (log.severity === 'ALERT') return <Badge variant="danger" size="sm">ALERT</Badge>;
        if (log.severity === 'WARNING') return <Badge variant="warning" size="sm">WARNING</Badge>;
        if (log.severity === 'NOTICE') return <Badge variant="neutral" size="sm">NOTICE</Badge>;
        return <Badge variant="neutral" size="sm">INFO</Badge>;
      },
    },
    {
      key: 'rbiReportable',
      header: 'RBI Audit',
      align: 'center',
      render: (log) => (
        log.rbiReportable ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-mono text-amber-800 bg-amber-50 px-1.5 py-0.5 border border-amber-200 rounded-xs">
            Reportable
          </span>
        ) : (
          <span className="text-slate-400 text-[10px] font-mono">Internal</span>
        )
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Top Banner */}
      <div className="bg-white border border-slate-200 rounded p-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-slate-800" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-900">
              Regulatory Returns & Statutory Audit Archive (RBI / FIU-IND)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Compliant with Section 42(2) of RBI Act, 1934 and Prevention of Money Laundering Act (PMLA), 2002.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => handleExport('Daily Trial Balance & Audit Package')}
            icon={<Download className="w-3.5 h-3.5" />}
          >
            Export Signed Package
          </Button>
        </div>
      </div>

      {downloadNotice && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 p-2.5 rounded text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{downloadNotice}</span>
        </div>
      )}

      {/* Aggregates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Net Demand & Time Liab (NDTL)"
          value={formatINR(metrics.netDemandAndTimeLiabilities, { compact: true })}
          code="RBI FORM-A"
          subtext="Base for CRR/SLR computation"
          regulatoryBadge={{
            text: 'Certified',
            status: 'compliant',
          }}
        />

        <StatCard
          label="Statutory CRR Maintained"
          value={`${(Number(metrics?.crrMaintainedPercentage) || 4.54).toFixed(2)}%`}
          code="TARGET: 4.50%"
          subtext={`Surplus: +${((Number(metrics?.crrMaintainedPercentage) || 4.54) - 4.5).toFixed(2)}%`}
          regulatoryBadge={{
            text: 'No Default',
            status: 'compliant',
          }}
        />

        <StatCard
          label="Statutory SLR Maintained"
          value={`${(Number(metrics?.slrMaintainedPercentage) || 18.65).toFixed(2)}%`}
          code="TARGET: 18.00%"
          subtext={`Surplus: +${((Number(metrics?.slrMaintainedPercentage) || 18.65) - 18.0).toFixed(2)}%`}
          regulatoryBadge={{
            text: 'G-Sec Backed',
            status: 'compliant',
          }}
        />

        <StatCard
          label="FIU-IND Reportable Events"
          value="2 Transmitted"
          code="CTR / STR PMLA"
          subtext="Monthly cycle submitted"
        />
      </div>

      {/* Tabs */}
      <Tabs
        tabs={[
          { id: 'daily-eod-report', label: 'Daily EOD Report', badge: '09-SEP-2026' },
          { id: 'audit-logs', label: 'Immutable Core Audit Trail', badge: auditLogs.length },
          { id: 'rbi-form-a', label: 'RBI Form A (Statutory NDTL)' },
          { id: 'fiu-reports', label: 'FIU-IND CTR & STR Register' },
        ]}
        activeTab={activeTab}
        onChange={setActiveTab}
      />

      {/* Tab 0: Daily EOD Report View */}
      {activeTab === 'daily-eod-report' && (
        <DailyEODReportView
          metrics={metrics}
          auditLogs={auditLogs}
          accounts={accounts}
          payments={payments}
          loans={loans}
          tradeItems={tradeItems}
          pendingAuthorizations={pendingAuthorizations}
        />
      )}

      {/* Tab 1: Audit Logs */}
      {activeTab === 'audit-logs' && (
        <div className="bg-white border border-slate-200 rounded">
          <div className="p-3 border-b border-slate-200 flex justify-between items-center text-xs">
            <span className="font-medium text-slate-700">
              Sequential Ledger & Security Audit Journal (Host: CBS-PROD-01)
            </span>
            <span className="font-mono text-slate-400">Cryptographically Chained</span>
          </div>
          <Table
            columns={logColumns}
            data={auditLogs}
            keyExtractor={(l) => l.id}
          />
        </div>
      )}

      {/* Tab 2: RBI Form A */}
      {activeTab === 'rbi-form-a' && (
        <div className="bg-white border border-slate-200 rounded p-5 space-y-4 text-xs">
          <div className="flex justify-between items-start pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                FORM A — Statement of Demand and Time Liabilities and Liquid Assets
              </h3>
              <p className="text-slate-500 mt-0.5">
                Submitted under Section 42(2) of Reserve Bank of India Act, 1934 | Alternate Friday Reporting
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport('RBI Form A XML')}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Generate Form A XML
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="border border-slate-200 rounded p-3 space-y-2 bg-slate-50/50">
              <div className="font-semibold text-slate-900 uppercase text-[11px] border-b border-slate-200 pb-1">
                I. Demand Liabilities (INR)
              </div>
              <div className="flex justify-between">
                <span>Demand Deposits (CASA CA/SB balances):</span>
                <span className="font-mono font-semibold">₹2,11,33,68,39,600.00</span>
              </div>
              <div className="flex justify-between">
                <span>Inter-bank Borrowings (Repayable on demand):</span>
                <span className="font-mono">₹4,20,00,00,000.00</span>
              </div>
              <div className="flex justify-between">
                <span>Other Demand Liabilities (Overdue FDs, Margins):</span>
                <span className="font-mono">₹1,85,50,00,000.00</span>
              </div>
            </div>

            <div className="border border-slate-200 rounded p-3 space-y-2 bg-slate-50/50">
              <div className="font-semibold text-slate-900 uppercase text-[11px] border-b border-slate-200 pb-1">
                II. Time Liabilities (INR)
              </div>
              <div className="flex justify-between">
                <span>Fixed Deposits & Term Liabilities:</span>
                <span className="font-mono font-semibold">₹2,71,16,73,60,400.00</span>
              </div>
              <div className="flex justify-between">
                <span>Cash Certificates / Recurring Deposits:</span>
                <span className="font-mono">₹24,34,08,00,000.00</span>
              </div>
              <div className="flex justify-between font-bold text-slate-900 pt-1 border-t border-slate-200">
                <span>Total Net Demand and Time Liabilities (NDTL):</span>
                <span className="font-mono text-emerald-800">₹5,12,90,00,00,000.00</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: FIU-IND Reports */}
      {activeTab === 'fiu-reports' && (
        <div className="bg-white border border-slate-200 rounded p-5 space-y-4 text-xs">
          <div className="flex justify-between items-start pb-3 border-b border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-sm">
                Financial Intelligence Unit - India (FIU-IND) Compliance Submissions
              </h3>
              <p className="text-slate-500 mt-0.5">
                Reporting Entity (RE) ID: RE-SCB-CRVI-00428 • Portal: FINnet 2.0 Gateway
              </p>
            </div>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExport('FINnet 2.0 Upload Batch')}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              Export FINnet File
            </Button>
          </div>

          <div className="space-y-3">
            <div className="border border-slate-200 rounded p-3 bg-slate-50/50 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900">Cash Transaction Report (CTR) — August 2026</div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  14 transactions aggregating &gt; ₹10,00,000 across current and bullion trading accounts.
                </div>
              </div>
              <Badge variant="success" size="sm">Transmitted & Acknowledged</Badge>
            </div>

            <div className="border border-slate-200 rounded p-3 bg-slate-50/50 flex items-center justify-between">
              <div>
                <div className="font-semibold text-slate-900">Suspicious Transaction Report (STR) — Ref: STR-2026-088</div>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Entity: Deccan Agro Exports LLP (CIF-1192834) • Inward overseas remittance from high-risk jurisdiction.
                </div>
              </div>
              <Badge variant="warning" size="sm">Under PMLA Review</Badge>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
