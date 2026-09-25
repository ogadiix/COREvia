import React, { useState, useMemo } from 'react';
import { PaymentTransaction, PaymentRail, TransactionStatus } from '../../types';
import { Table, Column } from '../common/Table';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { StatCard } from '../common/StatCard';
import { Modal } from '../common/Modal';
import { formatINR } from '../../data/mockIndianBankingData';
import {
  ArrowLeftRight,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  Eye,
  FileCheck,
  Send,
  Building2,
  RefreshCw,
  Printer,
  FileText,
} from 'lucide-react';
import { TransactionReceiptModal } from '../modals/TransactionReceiptModal';

interface PaymentsSwitchModuleProps {
  payments: PaymentTransaction[];
  onOpenNewTransaction: () => void;
  onNavigateToMakerChecker: () => void;
}

export const PaymentsSwitchModule: React.FC<PaymentsSwitchModuleProps> = ({
  payments,
  onOpenNewTransaction,
  onNavigateToMakerChecker,
}) => {
  const [selectedRail, setSelectedRail] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [activePayment, setActivePayment] = useState<PaymentTransaction | null>(null);
  const [receiptPayment, setReceiptPayment] = useState<PaymentTransaction | null>(null);

  const filteredPayments = useMemo(() => {
    return payments.filter((p) => {
      const matchRail = selectedRail === 'ALL' || p.rail === selectedRail;
      const matchStatus = selectedStatus === 'ALL' || p.status === selectedStatus;
      const matchSearch =
        searchTerm === '' ||
        p.utrNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.transactionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sourceName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.destName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sourceAccount.includes(searchTerm) ||
        p.destAccount.includes(searchTerm);
      return matchRail && matchStatus && matchSearch;
    });
  }, [payments, selectedRail, selectedStatus, searchTerm]);

  // Aggregates
  const totalSettledTurnover = useMemo(() => {
    return payments
      .filter((p) => p.status === 'SETTLED')
      .reduce((sum, p) => sum + p.amount, 0);
  }, [payments]);

  const heldTransactionsCount = useMemo(() => {
    return payments.filter((p) => p.status === 'HELD_FOR_VERIFICATION').length;
  }, [payments]);

  const ctsClearingCount = useMemo(() => {
    return payments.filter((p) => p.rail === 'CTS_CHEQUE').length;
  }, [payments]);

  const columns: Column<PaymentTransaction>[] = [
    {
      key: 'utrNumber',
      header: 'UTR / Unique Reference',
      mono: true,
      render: (p) => (
        <div>
          <span className="font-mono font-semibold text-slate-900">{p.utrNumber}</span>
          <div className="text-[10px] text-slate-500 font-mono">
            {p.transactionId} • {p.timestamp}
          </div>
        </div>
      ),
    },
    {
      key: 'rail',
      header: 'Rail & Clearing Hub',
      render: (p) => {
        const railStyles: Record<PaymentRail, { label: string; badge: string }> = {
          RTGS: { label: 'RTGS (Gross)', badge: 'bg-indigo-50 text-indigo-800 border-indigo-200' },
          NEFT: { label: 'NEFT (Batch)', badge: 'bg-blue-50 text-blue-800 border-blue-200' },
          IMPS: { label: 'IMPS (Instant)', badge: 'bg-emerald-50 text-emerald-800 border-emerald-200' },
          UPI: { label: 'UPI Switch', badge: 'bg-sky-50 text-sky-800 border-sky-200' },
          CTS_CHEQUE: { label: 'CTS-2010 Cheque', badge: 'bg-amber-50 text-amber-800 border-amber-200' },
        };
        const config = railStyles[p.rail];
        return (
          <span className={`inline-flex px-1.5 py-0.5 text-[11px] font-medium border rounded-xs ${config.badge}`}>
            {config.label}
          </span>
        );
      },
    },
    {
      key: 'sourceName',
      header: 'Remitter → Beneficiary',
      render: (p) => (
        <div className="max-w-[240px]">
          <div className="font-medium text-slate-900 truncate">
            {p.sourceName} <span className="text-slate-400 font-normal text-[10px]">({p.sourceBankIfsc})</span>
          </div>
          <div className="text-[11px] text-slate-500 truncate">
            → {p.destName} <span className="font-mono text-[10px]">({p.destBankIfsc})</span>
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
        <span className="font-mono font-bold text-slate-900">
          {formatINR(p.amount)}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Settlement Status',
      align: 'center',
      render: (p) => {
        if (p.status === 'SETTLED') {
          return <Badge variant="success" size="sm">Settled</Badge>;
        }
        if (p.status === 'PENDING_CLEARING') {
          return <Badge variant="warning" size="sm">In Clearing</Badge>;
        }
        if (p.status === 'HELD_FOR_VERIFICATION') {
          return <Badge variant="danger" size="sm">Verification Hold</Badge>;
        }
        return <Badge variant="neutral" size="sm">{p.status}</Badge>;
      },
    },
    {
      key: 'actions',
      header: 'Actions',
      align: 'right',
      render: (p) => (
        <div className="flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
          {p.status === 'SETTLED' && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setReceiptPayment(p)}
              icon={<Printer className="w-3 h-3 text-amber-600" />}
              className="text-amber-900 border-amber-300 hover:bg-amber-50 hover:border-amber-400"
              title="View & print official formatted transaction receipt"
            >
              Receipt
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => setActivePayment(p)}
            icon={<Eye className="w-3 h-3 text-slate-500" />}
          >
            Voucher
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5">
      {/* Switch Gateway Status */}
      <div className="bg-slate-900 text-white rounded p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping"></span>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              National Payment Infrastructure Switch Status
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Connected to RBI Clearing House (Fort MUM), NPCI Central Switch, and CTS Western Grid.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="outline"
            className="text-slate-900 bg-white hover:bg-slate-100"
            onClick={onOpenNewTransaction}
            icon={<Send className="w-3.5 h-3.5" />}
          >
            Transmit Payment Order
          </Button>
        </div>
      </div>

      {/* Aggregate Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          label="Today's Settled Turnover"
          value={formatINR(totalSettledTurnover, { compact: true })}
          code="NPCI/RBI-NET"
          subtext="Gross Settlement Total"
        />

        <StatCard
          label="RTGS High Value Window"
          value="OPERATIONAL"
          code="RBI-RTGS"
          subtext="Next Window Cut-off 16:30 IST"
          regulatoryBadge={{
            text: 'Cut-off in 4h 45m',
            status: 'compliant',
          }}
        />

        <StatCard
          label="CTS-2010 Cheque Batches"
          value={`${ctsClearingCount} Batches`}
          code="NPCI-CTS-WEST"
          subtext="MICR City Code 400"
        />

        <StatCard
          label="Verification Holds (>₹1 Cr)"
          value={`${heldTransactionsCount}`}
          code="FOUR-EYES-GATEWAY"
          subtext="Awaiting Checker Approval"
          regulatoryBadge={
            heldTransactionsCount > 0
              ? { text: `${heldTransactionsCount} In Queue`, status: 'warning' }
              : { text: 'Queue Clear', status: 'compliant' }
          }
        />
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded p-3.5 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ArrowLeftRight className="w-4 h-4 text-slate-700" />
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-800">
              Payments Journal & Settlement Inward/Outward Log
            </h2>
            <span className="font-mono text-xs px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
              {filteredPayments.length} entries
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-2 border-t border-slate-100">
          <div className="sm:col-span-6 relative">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by UTR Number, Txn ID, Remitter, Beneficiary, or Account..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-300 rounded font-mono focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            />
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedRail}
              onChange={(e) => setSelectedRail(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="ALL">All Payment Rails</option>
              <option value="RTGS">RTGS (High Value Gross)</option>
              <option value="NEFT">NEFT (Batch Settlement)</option>
              <option value="IMPS">IMPS (Immediate Payment)</option>
              <option value="UPI">UPI (Unified Payments)</option>
              <option value="CTS_CHEQUE">CTS-2010 Cheque Clearing</option>
            </select>
          </div>

          <div className="sm:col-span-3">
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full py-1.5 px-2.5 text-xs bg-slate-50 border border-slate-300 rounded focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            >
              <option value="ALL">All Clearing Statuses</option>
              <option value="SETTLED">Settled Only</option>
              <option value="PENDING_CLEARING">Pending Inward/Outward</option>
              <option value="HELD_FOR_VERIFICATION">Held for Verification</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <Table
        columns={columns}
        data={filteredPayments}
        keyExtractor={(p) => p.transactionId}
        onRowClick={(p) => setActivePayment(p)}
      />

      {/* Transaction Voucher Inspection Modal */}
      {activePayment && (
        <Modal
          isOpen={!!activePayment}
          onClose={() => setActivePayment(null)}
          title={`Settlement Voucher — ${activePayment.rail}`}
          subtitle={`RBI Clearing Ref: ${activePayment.utrNumber}`}
          referenceId={activePayment.transactionId}
          maxWidth="xl"
          footerActions={
            <>
              {activePayment.status === 'SETTLED' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    const toPrint = activePayment;
                    setActivePayment(null);
                    setReceiptPayment(toPrint);
                  }}
                  icon={<Printer className="w-3.5 h-3.5" />}
                  className="bg-amber-600 hover:bg-amber-500 text-white"
                >
                  View & Print Official Receipt
                </Button>
              )}
              {activePayment.status === 'HELD_FOR_VERIFICATION' && (
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => {
                    setActivePayment(null);
                    onNavigateToMakerChecker();
                  }}
                >
                  Review in Maker-Checker Queue
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setActivePayment(null)}
              >
                Close Voucher
              </Button>
            </>
          }
        >
          <div className="space-y-4 text-xs">
            {/* Header Amount Banner */}
            <div className="bg-slate-50 border border-slate-200 rounded p-3 text-center">
              <span className="text-slate-500 uppercase tracking-wide text-[10px]">
                Transacted Principal Amount
              </span>
              <div className="font-mono text-xl font-bold text-slate-900 mt-0.5">
                {formatINR(activePayment.amount)}
              </div>
              <div className="mt-1 flex items-center justify-center gap-2">
                <Badge
                  variant={
                    activePayment.status === 'SETTLED'
                      ? 'success'
                      : activePayment.status === 'PENDING_CLEARING'
                      ? 'warning'
                      : 'danger'
                  }
                  size="sm"
                >
                  {activePayment.status.replace(/_/g, ' ')}
                </Badge>
                <span className="text-slate-500 font-mono text-[11px]">{activePayment.timestamp}</span>
              </div>
            </div>

            {/* Remitter & Beneficiary Box */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="border border-slate-200 rounded p-3 bg-white space-y-1.5">
                <div className="font-semibold text-slate-800 text-[11px] uppercase tracking-wide border-b border-slate-100 pb-1">
                  Remitter (Source)
                </div>
                <div className="font-semibold text-slate-900">{activePayment.sourceName}</div>
                <div className="font-mono text-slate-600">A/c: {activePayment.sourceAccount}</div>
                <div className="font-mono text-slate-500 text-[11px]">IFSC: {activePayment.sourceBankIfsc}</div>
              </div>

              <div className="border border-slate-200 rounded p-3 bg-white space-y-1.5">
                <div className="font-semibold text-slate-800 text-[11px] uppercase tracking-wide border-b border-slate-100 pb-1">
                  Beneficiary (Destination)
                </div>
                <div className="font-semibold text-slate-900">{activePayment.destName}</div>
                <div className="font-mono text-slate-600">A/c: {activePayment.destAccount}</div>
                <div className="font-mono text-slate-500 text-[11px]">IFSC: {activePayment.destBankIfsc}</div>
              </div>
            </div>

            {/* Narration & Technical IDs */}
            <div className="border border-slate-200 rounded p-3 bg-white space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Narration / Purpose:</span>
                <span className="font-medium text-slate-900 text-right max-w-[280px]">
                  {activePayment.narration}
                </span>
              </div>
              {activePayment.batchNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-500">NEFT Batch Number:</span>
                  <span className="font-mono text-slate-800">{activePayment.batchNumber}</span>
                </div>
              )}
              {activePayment.chequeNumber && (
                <div className="flex justify-between">
                  <span className="text-slate-500">CTS Cheque Serial:</span>
                  <span className="font-mono text-slate-800">{activePayment.chequeNumber}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-slate-500">Host Terminal:</span>
                <span className="font-mono text-slate-700">TER-MUM-0104-A</span>
              </div>
            </div>
          </div>
        </Modal>
      )}

      {/* Official Formatted Printable Transaction Receipt Modal */}
      {receiptPayment && (
        <TransactionReceiptModal
          isOpen={!!receiptPayment}
          onClose={() => setReceiptPayment(null)}
          transaction={receiptPayment}
        />
      )}
    </div>
  );
};
