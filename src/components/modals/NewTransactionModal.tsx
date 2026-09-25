import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { BankAccount, PaymentRail, BiometricVerificationPayload } from '../../types';
import { formatINR } from '../../data/mockIndianBankingData';
import { BiometricAuthModal } from './BiometricAuthModal';
import { Send, AlertTriangle, ShieldCheck, Fingerprint, ShieldAlert, Lock } from 'lucide-react';

interface NewTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  accounts: BankAccount[];
  onSubmitTransaction: (data: {
    sourceAccount: string;
    rail: PaymentRail;
    destAccount: string;
    destName: string;
    destBankIfsc: string;
    amount: number;
    narration: string;
    biometricVerification?: BiometricVerificationPayload;
  }) => void;
  officerName?: string;
  officerEmployeeId?: string;
  terminalId?: string;
}

export const NewTransactionModal: React.FC<NewTransactionModalProps> = ({
  isOpen,
  onClose,
  accounts,
  onSubmitTransaction,
  officerName = 'Deepak Nambiar',
  officerEmployeeId = 'EMP-401928',
  terminalId = 'TER-MUM-0104-D',
}) => {
  const [sourceAccount, setSourceAccount] = useState<string>(
    accounts[0]?.accountNumber || ''
  );
  const [rail, setRail] = useState<PaymentRail>('RTGS');
  const [destAccount, setDestAccount] = useState<string>('00020100492810');
  const [destName, setDestName] = useState<string>('Larsen & Toubro Heavy Infrastructure');
  const [destBankIfsc, setDestBankIfsc] = useState<string>('HDFC0000060');
  const [amountInput, setAmountInput] = useState<string>('65000000'); // Default ₹6.50 Cr to showcase Biometric Step-Up
  const [narration, setNarration] = useState<string>('Vendor payment for turbine casing forging');
  const [formError, setFormError] = useState<string | null>(null);

  // Biometric Step-Up State
  const [isBiometricModalOpen, setIsBiometricModalOpen] = useState<boolean>(false);
  const [pendingTxnPayload, setPendingTxnPayload] = useState<{
    sourceAccount: string;
    rail: PaymentRail;
    destAccount: string;
    destName: string;
    destBankIfsc: string;
    amount: number;
    narration: string;
  } | null>(null);

  const selectedAcc = accounts.find((a) => a.accountNumber === sourceAccount);
  const parsedAmount = parseFloat(amountInput) || 0;

  // Thresholds
  const DUAL_CONTROL_THRESHOLD = 10000000; // ₹1.00 Crore
  const BIOMETRIC_STEP_UP_THRESHOLD = 50000000; // ₹5.00 Crore (User requirement)

  const isDualControl = parsedAmount >= DUAL_CONTROL_THRESHOLD;
  const requiresBiometric = parsedAmount >= BIOMETRIC_STEP_UP_THRESHOLD;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAcc) {
      setFormError('Please select a valid remitting account.');
      return;
    }
    if (parsedAmount <= 0) {
      setFormError('Please enter a valid amount greater than 0.');
      return;
    }
    if (parsedAmount > selectedAcc.availableBalance) {
      setFormError(`Insufficient available balance in account (${formatINR(selectedAcc.availableBalance)}).`);
      return;
    }
    if (!destAccount.trim() || !destName.trim() || !destBankIfsc.trim()) {
      setFormError('Please fill in all beneficiary details.');
      return;
    }

    setFormError(null);

    const payload = {
      sourceAccount,
      rail,
      destAccount,
      destName,
      destBankIfsc,
      amount: parsedAmount,
      narration,
    };

    // If transaction is >= ₹5 Crore, trigger biometric step-up before queueing
    if (requiresBiometric) {
      setPendingTxnPayload(payload);
      setIsBiometricModalOpen(true);
      return;
    }

    // Otherwise submit directly
    onSubmitTransaction(payload);
    onClose();
  };

  const handleBiometricVerified = (bioPayload: BiometricVerificationPayload) => {
    if (!pendingTxnPayload) return;

    onSubmitTransaction({
      ...pendingTxnPayload,
      biometricVerification: bioPayload,
    });

    setIsBiometricModalOpen(false);
    setPendingTxnPayload(null);
    onClose();
  };

  return (
    <>
      <Modal
        isOpen={isOpen && !isBiometricModalOpen}
        onClose={onClose}
        title="Initiate Inter-Bank Transfer / Clearing Voucher"
        subtitle="Outward settlement via RBI RTGS / NEFT / IMPS National Switch"
        maxWidth="xl"
        footerActions={
          <>
            <Button variant="outline" size="sm" onClick={onClose}>
              Cancel Voucher
            </Button>
            <Button
              variant={requiresBiometric ? 'danger' : 'primary'}
              size="sm"
              onClick={handleSubmit}
              icon={
                requiresBiometric ? (
                  <Fingerprint className="w-3.5 h-3.5" />
                ) : (
                  <Send className="w-3.5 h-3.5" />
                )
              }
            >
              {requiresBiometric
                ? 'Verify Biometrics & Submit to Queue (> ₹5 Cr)'
                : isDualControl
                ? 'Submit to Maker-Checker Queue'
                : 'Transmit & Settle Immediately'}
            </Button>
          </>
        }
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {formError && (
            <div className="bg-rose-50 border border-rose-300 text-rose-800 p-2.5 rounded text-xs">
              {formError}
            </div>
          )}

          {/* High-Value Security Alerts */}
          {requiresBiometric ? (
            <div className="bg-rose-50 border border-rose-300 text-rose-900 p-3 rounded text-xs flex items-start gap-2.5 shadow-xs">
              <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <span>Mandatory Officer Biometric Re-Authentication Required:</span>
                  <span className="bg-rose-200 text-rose-800 text-[10px] px-1.5 py-0.2 rounded font-mono font-bold">
                    &gt; ₹5.00 Crore Threshold
                  </span>
                </div>
                <p className="text-rose-800 leading-relaxed text-[11px]">
                  Outward debits of <strong>{formatINR(parsedAmount)}</strong> exceed the ₹5.00 Crore high-value limit pursuant to RBI Master Direction – Digital Payment Security Controls (Section 4.3). A physical biometric signature (UIDAI STQC L1 Fingerprint or TrueDepth FaceID) is required to authenticate the initiating officer before this voucher enters the Maker-Checker queue.
                </p>
              </div>
            </div>
          ) : isDualControl ? (
            <div className="bg-amber-50 border border-amber-300 text-amber-900 p-2.5 rounded text-xs flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Four-Eyes Dual Control Threshold Exceeded:</span>
                <p className="mt-0.5 text-amber-800">
                  Debits of {formatINR(parsedAmount)} exceed the single-maker limit (₹1.00 Cr). This transaction will require Level-3 Checker sign-off before dispatch.
                </p>
              </div>
            </div>
          ) : null}

          {/* Source Account Selection */}
          <div>
            <label className="block font-semibold text-slate-800 mb-1">
              Remitter (Source CASA Account)
            </label>
            <select
              value={sourceAccount}
              onChange={(e) => setSourceAccount(e.target.value)}
              className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-400"
            >
              {accounts
                .filter((a) => a.accountType === 'CURRENT' || a.accountType === 'SAVINGS')
                .map((acc) => (
                  <option key={acc.accountNumber} value={acc.accountNumber}>
                    {acc.accountNumber} — {acc.customerName} ({formatINR(acc.availableBalance)} avail)
                  </option>
                ))}
            </select>
            {selectedAcc && (
              <div className="mt-1 text-[11px] text-slate-500 font-mono">
                Available: {formatINR(selectedAcc.availableBalance)} • Status: {selectedAcc.status} • Branch: {selectedAcc.branchName}
              </div>
            )}
          </div>

          {/* Payment Rail & Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Payment Rail / Clearing Channel
              </label>
              <select
                value={rail}
                onChange={(e) => setRail(e.target.value as PaymentRail)}
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-400"
              >
                <option value="RTGS">RTGS (High Value Real-Time Gross)</option>
                <option value="NEFT">NEFT (National Electronic Fund Transfer)</option>
                <option value="IMPS">IMPS (Immediate Payment 24x7)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-800 mb-1">
                Amount (INR)
              </label>
              <input
                type="number"
                value={amountInput}
                onChange={(e) => setAmountInput(e.target.value)}
                placeholder="e.g. 65000000"
                className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono text-xs focus:bg-white focus:outline-hidden focus:ring-1 focus:ring-slate-400 font-semibold"
              />
              <div className="mt-0.5 text-[11px] text-slate-500 font-mono flex items-center justify-between">
                <span>In words: {formatINR(parsedAmount)}</span>
                {requiresBiometric && (
                  <span className="text-rose-700 font-semibold flex items-center gap-0.5">
                    <Lock className="w-3 h-3" /> Biometric Step-Up Active
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Amount Testing Presets */}
          <div className="flex flex-wrap items-center gap-1.5 pt-0.5 bg-slate-50 p-2 rounded border border-slate-200">
            <span className="text-[10px] font-semibold text-slate-500">Security Test Presets:</span>
            {[
              { label: '₹50 Lakhs (Standard)', val: 5000000 },
              { label: '₹1.50 Cr (Dual Control)', val: 15000000 },
              { label: '₹6.50 Cr (Biometric Step-Up)', val: 65000000 },
              { label: '₹15.00 Cr (High-Value)', val: 150000000 },
            ].map((preset) => (
              <button
                key={preset.val}
                type="button"
                onClick={() => setAmountInput(String(preset.val))}
                className={`px-2 py-0.5 text-[10px] font-mono rounded border transition-colors cursor-pointer ${
                  parsedAmount === preset.val
                    ? 'border-slate-900 bg-slate-900 text-white font-bold'
                    : 'border-slate-300 bg-white text-slate-700 hover:bg-slate-100'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>

          {/* Beneficiary Details */}
          <div className="border border-slate-200 rounded p-3 bg-slate-50/50 space-y-2.5">
            <div className="font-semibold text-slate-800 uppercase text-[10px] tracking-wider">
              Beneficiary (Destination) Specifications
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">Beneficiary Name</label>
                <input
                  type="text"
                  value={destName}
                  onChange={(e) => setDestName(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">Beneficiary Account Number</label>
                <input
                  type="text"
                  value={destAccount}
                  onChange={(e) => setDestAccount(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded font-mono text-xs"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">Destination Bank IFSC Code</label>
                <input
                  type="text"
                  value={destBankIfsc}
                  onChange={(e) => setDestBankIfsc(e.target.value.toUpperCase())}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded font-mono text-xs uppercase"
                />
              </div>
              <div>
                <label className="block text-[11px] text-slate-600 mb-0.5">Payment Narration / Purpose</label>
                <input
                  type="text"
                  value={narration}
                  onChange={(e) => setNarration(e.target.value)}
                  className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                />
              </div>
            </div>
          </div>
        </form>
      </Modal>

      {/* Biometric Re-Authentication Modal for High-Value Transactions */}
      {isBiometricModalOpen && pendingTxnPayload && (
        <BiometricAuthModal
          isOpen={isBiometricModalOpen}
          onClose={() => {
            setIsBiometricModalOpen(false);
            setPendingTxnPayload(null);
          }}
          amount={pendingTxnPayload.amount}
          sourceAccount={pendingTxnPayload.sourceAccount}
          destName={pendingTxnPayload.destName}
          rail={pendingTxnPayload.rail}
          officerName={officerName}
          officerEmployeeId={officerEmployeeId}
          terminalId={terminalId}
          onVerified={handleBiometricVerified}
        />
      )}
    </>
  );
};
