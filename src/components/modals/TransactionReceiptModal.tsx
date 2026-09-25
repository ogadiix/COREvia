import React, { useState, useRef } from 'react';
import {
  Printer,
  Download,
  Copy,
  Check,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Fingerprint,
  FileText,
  X,
  ExternalLink,
  Lock,
  ArrowRight,
  Landmark,
} from 'lucide-react';
import { PaymentTransaction } from '../../types';
import { BANK_META, formatINR } from '../../data/mockIndianBankingData';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

export interface TransactionReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: PaymentTransaction | null;
  signatories?: {
    makerName?: string;
    makerEmployeeId?: string;
    makerRole?: string;
    makerTimestamp?: string;
    makerBiometricVerified?: boolean;
    makerBiometricMethod?: string;
    checkerName?: string;
    checkerEmployeeId?: string;
    checkerRole?: string;
    checkerTimestamp?: string;
    checkerRemarks?: string;
  };
}

/**
 * Converts a numeric amount to Indian Currency Words (Lakhs and Crores).
 */
export function amountInWordsINR(amount: number): string {
  if (!amount || amount === 0) return 'Zero Rupees Only';

  const ones = [
    '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
    'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen',
    'Seventeen', 'Eighteen', 'Nineteen',
  ];
  const tens = [
    '', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety',
  ];

  function convertGroup(n: number): string {
    let str = '';
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + ' Hundred ';
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + ones[n % 10] : '');
    } else if (n > 0) {
      str += ones[n];
    }
    return str.trim();
  }

  const intPart = Math.floor(amount);
  const paise = Math.round((amount - intPart) * 100);

  let num = intPart;
  let words = '';

  const crore = Math.floor(num / 10000000);
  num %= 10000000;

  const lakh = Math.floor(num / 100000);
  num %= 100000;

  const thousand = Math.floor(num / 1000);
  num %= 1000;

  const remainder = num;

  if (crore > 0) {
    const croreText = crore < 100 ? convertGroup(crore) : amountInWordsINR(crore).replace('Indian Rupees ', '').replace(' Only', '');
    words += `${croreText} Crore${crore > 1 ? 's' : ''} `;
  }
  if (lakh > 0) {
    words += `${convertGroup(lakh)} Lakh${lakh > 1 ? 's' : ''} `;
  }
  if (thousand > 0) {
    words += `${convertGroup(thousand)} Thousand `;
  }
  if (remainder > 0) {
    words += `${convertGroup(remainder)} `;
  }

  words = words.trim();
  if (paise > 0) {
    return `Indian Rupees ${words} and ${convertGroup(paise)} Paise Only`;
  }
  return `Indian Rupees ${words} Only`;
}

export const TransactionReceiptModal: React.FC<TransactionReceiptModalProps> = ({
  isOpen,
  onClose,
  transaction,
  signatories,
}) => {
  const [copiedUTR, setCopiedUTR] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  if (!isOpen || !transaction) return null;

  const isHighValue = transaction.amount >= 10000000; // >= ₹1 Cr
  const isBiometricEligible = transaction.amount >= 50000000; // >= ₹5 Cr

  // Formatted Timestamps
  const txTimestamp = transaction.timestamp || `${BANK_META.activeBusinessDate} 11:42:18 IST`;
  const hostTimestamp = txTimestamp.replace(/IST/, 'CBS-HOST-OK');
  const valueDate = BANK_META.activeBusinessDate;

  // Signatory details with institutional fallbacks
  const makerName = signatories?.makerName || 'Deepak Nambiar';
  const makerEmpId = signatories?.makerEmployeeId || 'EMP-401928';
  const makerRole = signatories?.makerRole || 'Clearing Desk Officer (Level-1 Maker)';
  const makerBiometric = signatories?.makerBiometricVerified ?? isBiometricEligible;
  const makerBioMethod = signatories?.makerBiometricMethod || 'UIDAI STQC Level-1 Optical Fingerprint (FIDO2)';

  const checkerName = signatories?.checkerName || 'Rajeshwari Iyer';
  const checkerEmpId = signatories?.checkerEmployeeId || 'EMP-109284';
  const checkerRole = signatories?.checkerRole || 'Chief Manager & Authorizer (Level-3 Checker)';
  const checkerRemarks =
    signatories?.checkerRemarks ||
    (isHighValue
      ? 'Mandate, balance adequacy, and outward RTGS clearing window validated. Dispatched under dual-control.'
      : 'Auto-authorized under standard STP parameters.');

  const handleCopyUTR = () => {
    navigator.clipboard.writeText(transaction.utrNumber);
    setCopiedUTR(true);
    setTimeout(() => setCopiedUTR(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTextAdvice = () => {
    const textAdvice = `
================================================================================
                    COREvia INSTITUTIONAL BANK OF INDIA
        (Scheduled Commercial Bank | Licensed under BR Act, 1949)
             Fort Commercial Branch, Mumbai | IFSC: CRVI0000104
================================================================================
            OFFICIAL INTERBANK SETTLEMENT ADVICE & TRANSACTION RECEIPT
                      FORM 24-B (RBI PSS ACT, 2007)
--------------------------------------------------------------------------------
UTR NUMBER               : ${transaction.utrNumber}
TRANSACTION ID           : ${transaction.transactionId}
SETTLEMENT STATUS        : ${transaction.status} (RBI CLEARING CONFIRMED)
PAYMENT RAIL             : ${transaction.rail} (Real-Time Settlement)
VALUE DATE               : ${valueDate}
TRANSACTION TIMESTAMP    : ${txTimestamp}
HOST REFERENCE           : HOST-PROD-MUM-${transaction.transactionId}
--------------------------------------------------------------------------------
REMITTER (DEBITED)
  Account Name           : ${transaction.sourceName}
  Account Number         : ${transaction.sourceAccount}
  Bank / Branch          : COREvia Bank - Fort Commercial Branch, Mumbai
  IFSC                   : ${transaction.sourceBankIfsc || BANK_META.currentBranch.ifsc}

BENEFICIARY (CREDITED)
  Account Name           : ${transaction.destName}
  Account Number         : ${transaction.destAccount}
  Beneficiary Bank IFSC  : ${transaction.destBankIfsc}
--------------------------------------------------------------------------------
SETTLEMENT FINANCIAL BREAKDOWN
  Transacted Amount      : INR ${transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
  Amount in Words        : ${amountInWordsINR(transaction.amount)}
  Clearing Handling Fee  : INR 0.00 (Exempted)
  GST (CGST + SGST)      : INR 0.00
  Net Settled Amount     : INR ${transaction.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
  Narration / Purpose    : ${transaction.narration}
--------------------------------------------------------------------------------
AUTHORIZED SIGNATORIES & AUDIT VERIFICATION
  Initiating Maker       : ${makerName} (${makerEmpId})
  Designation            : ${makerRole}
  Digital Token          : DSC-SHA256-IN-49219
  Biometric Step-Up      : ${makerBiometric ? `VERIFIED [${makerBioMethod}]` : 'STANDARD STP SIGNATURE'}

  Authorizing Checker    : ${checkerName} (${checkerEmpId})
  Designation            : ${checkerRole}
  Supervisory Remark     : ${checkerRemarks}
  HSM Certificate        : CCA-INDIA-COREVIA-9941A
--------------------------------------------------------------------------------
Notice: Authenticated electronic settlement advice generated under Section 4 of 
the Payment and Settlement Systems Act, 2007. Valid without physical signature.
================================================================================
`.trim();

    const blob = new Blob([textAdvice], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Settlement_Advice_${transaction.utrNumber}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6 overflow-y-auto bg-slate-950/75 backdrop-blur-xs print:p-0 print:bg-white print:static">
      {/* Container Card */}
      <div className="relative w-full max-w-4xl bg-white border border-slate-300 rounded-lg shadow-2xl overflow-hidden my-auto flex flex-col max-h-[96vh] print:max-h-none print:border-none print:shadow-none print:m-0 print:rounded-none">
        
        {/* Modal Top Control Bar (Hidden on Print) */}
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-slate-900 text-white border-b border-slate-800 shrink-0 print:hidden">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400 shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3 className="font-semibold text-xs sm:text-sm tracking-tight text-white flex items-center gap-2 truncate">
                <span>Official Settlement Advice & Tax Receipt</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 hidden sm:inline">
                  {transaction.rail}
                </span>
              </h3>
              <p className="text-[11px] text-slate-400 font-mono truncate">
                UTR: {transaction.utrNumber}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopyUTR}
              icon={copiedUTR ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white text-xs"
              title="Copy UTR Number"
            >
              <span className="hidden sm:inline">{copiedUTR ? 'Copied UTR!' : 'Copy UTR'}</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadTextAdvice}
              icon={copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Download className="w-3.5 h-3.5" />}
              className="bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700 hover:text-white text-xs"
              title="Download ASCII Advice (.txt)"
            >
              <span className="hidden sm:inline">{copiedAll ? 'Downloaded' : 'Download Advice'}</span>
            </Button>

            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              icon={<Printer className="w-3.5 h-3.5 text-white" />}
              className="bg-amber-600 hover:bg-amber-500 text-white font-medium text-xs shadow-xs"
              title="Print Receipt or Save as PDF"
            >
              <span>Print / PDF</span>
            </Button>

            <button
              onClick={onClose}
              className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition-colors ml-1"
              title="Close modal (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas Area */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 md:p-8 bg-slate-100/70 print:p-0 print:bg-white print:overflow-visible">
          <div
            id="printable-transaction-receipt"
            ref={receiptRef}
            className="w-full max-w-3xl mx-auto bg-white border border-slate-300 rounded-sm shadow-sm p-4 sm:p-7 md:p-9 text-slate-900 font-sans relative print:border-none print:shadow-none print:p-4 print:max-w-none print:w-full"
          >
            {/* Watermark for Authentic Copy */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center select-none overflow-hidden opacity-[0.03] print:opacity-[0.04]">
              <div className="text-slate-900 text-6xl md:text-8xl font-black uppercase tracking-widest -rotate-45 font-mono">
                ORIGINAL CBS COPY
              </div>
            </div>

            {/* Official Header & Letterhead */}
            <div className="border-b-2 border-slate-900 pb-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded bg-slate-900 text-amber-400 flex items-center justify-center font-bold text-xl border border-slate-700 shrink-0 print:border-black print:text-black print:bg-slate-100">
                    <Building2 className="w-7 h-7" />
                  </div>
                  <div>
                    <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-950 uppercase">
                      COREvia Institutional Bank of India
                    </h1>
                    <p className="text-[11px] text-slate-600 font-medium">
                      A Scheduled Commercial Bank Licensed Under Section 22 of the Banking Regulation Act, 1949
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                      Fort Commercial Branch, Mumbai (0104) &bull; IFSC: <strong className="text-slate-800">CRVI0000104</strong> &bull; MICR: 400240012
                    </p>
                  </div>
                </div>

                <div className="text-left sm:text-right text-[11px] font-mono shrink-0 sm:border-l sm:border-slate-200 sm:pl-4">
                  <div className="inline-flex items-center gap-1 font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-300 print:border-black print:bg-white print:text-black">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 print:hidden" />
                    <span>SETTLED & CLEARED</span>
                  </div>
                  <div className="text-slate-500 text-[10px] mt-1">RBI Clearing Window: RTGS-0104</div>
                  <div className="text-slate-500 text-[10px]">CIN: U65191MH2014PLC258901</div>
                </div>
              </div>

              {/* Document Banner */}
              <div className="mt-4 pt-2.5 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs uppercase font-bold tracking-wider text-slate-900 flex items-center gap-2">
                  <span className="px-1.5 py-0.5 bg-slate-900 text-white rounded text-[10px] font-mono print:bg-black">
                    FORM 24-B
                  </span>
                  <span>Interbank Settlement Advice & Official Payment Receipt</span>
                </div>
                <div className="text-[11px] font-mono text-slate-600">
                  Ref No: <strong className="text-slate-950">{transaction.transactionId}</strong>
                </div>
              </div>
            </div>

            {/* Core Identifiers & Key Metadata Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3 py-3 border-b border-slate-200 bg-slate-50/80 -mx-4 sm:-mx-7 md:-mx-9 px-4 sm:px-7 md:px-9 text-xs print:bg-white print:border-slate-400">
              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block">
                  Unique Txn Ref (UTR)
                </span>
                <span className="font-mono font-bold text-slate-950 text-xs sm:text-[13px] break-all">
                  {transaction.utrNumber}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block">
                  Clearing Rail / Mode
                </span>
                <span className="font-bold text-slate-900 text-xs sm:text-[13px]">
                  {transaction.rail} Transfer
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block">
                  Transaction Date & Time
                </span>
                <span className="font-mono text-slate-800 text-xs sm:text-[12px] block">
                  {txTimestamp}
                </span>
              </div>

              <div>
                <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider block">
                  Value Date / Cycle
                </span>
                <span className="font-mono text-slate-800 text-xs sm:text-[12px] block">
                  {valueDate} &bull; Cycle #14
                </span>
              </div>
            </div>

            {/* Remitter vs. Beneficiary Dual-Column Layout (Responsive stacked on small screens) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 py-4 border-b border-slate-200">
              {/* Remitter Box */}
              <div className="border border-slate-200 rounded p-3 sm:p-3.5 bg-slate-50/40 print:bg-white print:border-slate-400">
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-slate-900 print:bg-black"></span>
                    Remitter (Debited Entity)
                  </span>
                  <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-slate-200/70 text-slate-700">
                    CASA / DEBIT
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Account Holder / Entity:</span>
                    <strong className="text-slate-900 text-sm font-semibold block">{transaction.sourceName}</strong>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Debited Account #:</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">{transaction.sourceAccount}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Remitter IFSC:</span>
                      <span className="font-mono font-medium text-slate-800 text-xs">{transaction.sourceBankIfsc || BANK_META.currentBranch.ifsc}</span>
                    </div>
                  </div>

                  <div className="pt-1 text-[11px] text-slate-600">
                    <span className="text-slate-500 text-[10px] block">Debited Institution:</span>
                    COREvia Bank, Fort Commercial Branch, Mumbai
                  </div>
                </div>
              </div>

              {/* Beneficiary Box */}
              <div className="border border-slate-200 rounded p-3 sm:p-3.5 bg-slate-50/40 print:bg-white print:border-slate-400">
                <div className="flex items-center justify-between pb-1.5 mb-2 border-b border-slate-200">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 print:bg-black"></span>
                    Beneficiary (Credited Entity)
                  </span>
                  <span className="text-[10px] font-mono px-1 py-0.5 rounded bg-emerald-100 text-emerald-800 print:bg-white print:border print:border-black">
                    INTERBANK CREDIT
                  </span>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div>
                    <span className="text-slate-500 text-[11px] block">Beneficiary Entity:</span>
                    <strong className="text-slate-900 text-sm font-semibold block">{transaction.destName}</strong>
                  </div>

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <div>
                      <span className="text-slate-500 text-[10px] block">Credited Account #:</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">{transaction.destAccount}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 text-[10px] block">Beneficiary IFSC:</span>
                      <span className="font-mono font-bold text-slate-900 text-xs">{transaction.destBankIfsc}</span>
                    </div>
                  </div>

                  <div className="pt-1 text-[11px] text-slate-600">
                    <span className="text-slate-500 text-[10px] block">Clearing Routing:</span>
                    Central Real-Time RTGS/NEFT National Switch Credit
                  </div>
                </div>
              </div>
            </div>

            {/* Financial Settlement Breakdown Banner */}
            <div className="py-4 border-b border-slate-200">
              <div className="bg-slate-900 text-white rounded p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 print:bg-slate-100 print:text-black print:border print:border-black">
                <div>
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 font-semibold block print:text-slate-700">
                    Total Settled Principal Amount
                  </span>
                  <div className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight mt-0.5 print:text-black">
                    {formatINR(transaction.amount)}
                  </div>
                </div>

                <div className="sm:text-right border-t sm:border-t-0 sm:border-l border-slate-700 sm:pl-4 pt-2 sm:pt-0 print:border-slate-300">
                  <span className="text-[10px] uppercase tracking-wider text-slate-400 block print:text-slate-700">
                    Statutory Clearing Charges & Taxes
                  </span>
                  <div className="font-mono text-xs text-emerald-400 font-medium mt-0.5 print:text-black">
                    Fee: ₹0.00 &bull; GST (CGST/SGST): ₹0.00
                  </div>
                  <span className="text-[10px] text-slate-400 print:text-slate-600 block">
                    Zero RTGS Surcharge Applied
                  </span>
                </div>
              </div>

              {/* Amount in Words */}
              <div className="mt-3 p-2.5 bg-slate-50 border border-slate-200 rounded text-xs print:bg-white print:border-slate-300">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block">
                  Settlement Amount in Words (Indian Currency Standard)
                </span>
                <p className="font-semibold text-slate-900 italic mt-0.5">
                  "{amountInWordsINR(transaction.amount)}"
                </p>
              </div>

              {/* Narration */}
              {transaction.narration && (
                <div className="mt-2 text-xs flex items-baseline gap-2">
                  <span className="text-slate-500 font-medium shrink-0">Remittance Narration:</span>
                  <span className="font-mono text-slate-800 font-medium">{transaction.narration}</span>
                </div>
              )}
            </div>

            {/* Authorized Signatories & Cryptographic Verification Section */}
            <div className="py-4 border-b border-slate-200">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-700 print:hidden" />
                  <span>Statutory Dual-Control Verification & Authorized Signatories</span>
                </div>
                <span className="text-[10px] font-mono text-slate-500">
                  ISO 20022 / RBI Sec 4 Compliant
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Maker Signature Block */}
                <div className="border border-slate-300 rounded p-3 bg-white text-xs space-y-2 relative">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Initiating Maker Officer
                    </span>
                    <Badge variant="neutral" size="sm">LEVEL-1 MAKER</Badge>
                  </div>

                  <div>
                    <strong className="text-slate-900 text-sm block font-semibold">{makerName}</strong>
                    <div className="text-[11px] text-slate-500 font-mono">
                      EMP ID: <strong className="text-slate-800">{makerEmpId}</strong> &bull; {makerRole}
                    </div>
                  </div>

                  {/* Stamp Graphic */}
                  <div className="p-2 border border-dashed border-slate-300 rounded bg-slate-50/50 space-y-1 font-mono text-[10px] print:bg-white">
                    <div className="flex items-center justify-between text-slate-700">
                      <span>SIGNATURE STATUS:</span>
                      <span className="font-bold text-emerald-800">CRYPTOGRAPHIC DSC</span>
                    </div>
                    <div className="text-slate-500 truncate">
                      Token: DSC-SHA256-IN-49219-MAKER-CBS
                    </div>
                    <div className="text-slate-500">
                      Signed At: {txTimestamp}
                    </div>

                    {makerBiometric && (
                      <div className="pt-1 border-t border-slate-200 flex items-center gap-1 text-emerald-800 font-sans font-semibold">
                        <Fingerprint className="w-3 h-3 text-emerald-600 shrink-0" />
                        <span>Biometric FIDO2 / UIDAI STQC-L1 Match Confirmed</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Checker Signature Block */}
                <div className="border border-slate-300 rounded p-3 bg-white text-xs space-y-2 relative">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">
                      Authorizing Checker Officer
                    </span>
                    <Badge variant="success" size="sm">LEVEL-3 CHECKER</Badge>
                  </div>

                  <div>
                    <strong className="text-slate-900 text-sm block font-semibold">{checkerName}</strong>
                    <div className="text-[11px] text-slate-500 font-mono">
                      EMP ID: <strong className="text-slate-800">{checkerEmpId}</strong> &bull; {checkerRole}
                    </div>
                  </div>

                  {/* Stamp Graphic */}
                  <div className="p-2 border border-dashed border-slate-300 rounded bg-slate-50/50 space-y-1 font-mono text-[10px] print:bg-white">
                    <div className="flex items-center justify-between text-slate-700">
                      <span>AUTHORIZATION STATUS:</span>
                      <span className="font-bold text-emerald-800">DISPATCHED & SIGNED</span>
                    </div>
                    <div className="text-slate-500 truncate">
                      HSM Cert: CCA-INDIA-COREVIA-9941A
                    </div>
                    <div className="text-slate-600 font-sans italic line-clamp-1" title={checkerRemarks}>
                      "{checkerRemarks}"
                    </div>
                  </div>
                </div>
              </div>

              {/* Official Bank Round Seal Simulation */}
              <div className="mt-3 flex flex-col sm:flex-row items-center justify-between gap-3 p-2.5 bg-slate-50 border border-slate-200 rounded print:bg-white print:border-slate-300">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border-2 border-slate-800 border-dashed flex items-center justify-center text-slate-800 font-mono font-bold text-[8px] text-center leading-none p-1 shrink-0">
                    OFFICIAL SEAL
                  </div>
                  <div className="text-[11px] text-slate-600">
                    <strong className="text-slate-900 block font-semibold">Fort Commercial Branch &bull; Clearing Operations Desk</strong>
                    Electronic clearance validated under National Payments Corporation of India (NPCI) & RBI Clearing Switch.
                  </div>
                </div>

                <div className="text-right text-[10px] font-mono text-slate-500 shrink-0">
                  Host Seal: CBS-MUM-HSM-{transaction.utrNumber.slice(-6)}
                </div>
              </div>
            </div>

            {/* QR Code & Barcode Verification Footer */}
            <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
              <div className="flex items-center gap-3">
                {/* Stylized QR Code Graphic */}
                <div className="w-16 h-16 bg-slate-900 text-white p-1.5 rounded flex flex-col items-center justify-center shrink-0 print:border print:border-black print:text-black print:bg-white">
                  <div className="grid grid-cols-4 gap-0.5 w-full h-full p-0.5 bg-white">
                    <div className="bg-slate-900 rounded-2xs"></div>
                    <div className="bg-slate-900 rounded-2xs"></div>
                    <div className="bg-white"></div>
                    <div className="bg-slate-900 rounded-2xs"></div>
                    <div className="bg-white"></div>
                    <div className="bg-slate-900 rounded-2xs"></div>
                    <div className="bg-slate-900 rounded-2xs"></div>
                    <div className="bg-white"></div>
                    <div className="bg-slate-900 rounded-2xs"></div>
                    <div className="bg-white"></div>
                    <div className="bg-slate-900 rounded-2xs"></div>
                    <div className="bg-slate-900 rounded-2xs"></div>
                    <div className="bg-slate-900 rounded-2xs"></div>
                    <div className="bg-slate-900 rounded-2xs"></div>
                    <div className="bg-white"></div>
                    <div className="bg-slate-900 rounded-2xs"></div>
                  </div>
                </div>

                <div>
                  <div className="font-semibold text-slate-900 text-[11px]">
                    Cryptographic Digital Verification Code
                  </div>
                  <p className="text-[10px] text-slate-500 leading-tight mt-0.5">
                    Scan with RBI CTS / Corevia Mobile Authenticator to verify digital receipt on central ledger.
                  </p>
                  <div className="font-mono text-[9px] text-slate-400 mt-0.5">
                    Hash: SHA256:{transaction.utrNumber}-{transaction.transactionId.slice(-4)}
                  </div>
                </div>
              </div>

              {/* Statutory Legal Disclaimer */}
              <div className="text-[10px] text-slate-500 sm:text-right max-w-sm leading-tight border-t sm:border-t-0 pt-2 sm:pt-0">
                This document is an authenticated computer-generated payment advice under Section 4 of the Payment and Settlement Systems Act, 2007 (Act 51 of 2007) and the Information Technology Act, 2000. Valid without physical handwritten signature.
              </div>
            </div>

          </div>
        </div>

        {/* Modal Bottom Footer Actions (Hidden on Print) */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0 print:hidden">
          <div className="text-xs text-slate-500 font-mono flex items-center gap-1.5">
            <Lock className="w-3.5 h-3.5 text-slate-400" />
            <span>Encrypted CBS Form Form-24B (A4 Print Ready)</span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
            >
              Close Receipt
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handlePrint}
              icon={<Printer className="w-3.5 h-3.5" />}
              className="bg-[#0b1626] hover:bg-[#162740] text-white text-xs"
            >
              Print Document
            </Button>
          </div>
        </div>

      </div>

      {/* Print Specific CSS Style Rules */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-transaction-receipt,
          #printable-transaction-receipt * {
            visibility: visible;
          }
          #printable-transaction-receipt {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            margin: 0 !important;
            padding: 12mm !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
            color: black !important;
          }
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
};
