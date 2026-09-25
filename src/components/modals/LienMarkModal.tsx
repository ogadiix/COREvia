import React, { useState } from 'react';
import { BankAccount } from '../../types';
import { Modal } from '../common/Modal';
import { Button } from '../common/Button';
import { formatINR } from '../../data/mockIndianBankingData';
import { ShieldAlert } from 'lucide-react';

interface LienMarkModalProps {
  account: BankAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onSubmitLien: (account: BankAccount, lienAmount: number, reason: string) => void;
}

export const LienMarkModal: React.FC<LienMarkModalProps> = ({
  account,
  isOpen,
  onClose,
  onSubmitLien,
}) => {
  const [lienAmountInput, setLienAmountInput] = useState<string>('2500000');
  const [lienReason, setLienReason] = useState<string>('Cash margin collateral for inland Letter of Credit issuance');
  const [error, setError] = useState<string | null>(null);

  if (!account) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseFloat(lienAmountInput) || 0;
    if (parsed < 0) {
      setError('Lien amount cannot be negative.');
      return;
    }
    if (parsed > account.availableBalance) {
      setError(`Lien amount exceeds current available balance (${formatINR(account.availableBalance)}).`);
      return;
    }
    if (!lienReason.trim()) {
      setError('A mandatory legal / audit justification reason is required.');
      return;
    }

    setError(null);
    onSubmitLien(account, parsed, lienReason);
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Mark / Modify Account Lien — ${account.accountNumber}`}
      subtitle={`Customer: ${account.customerName}`}
      referenceId={account.accountNumber}
      maxWidth="md"
      footerActions={
        <>
          <Button variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleSubmit}
            icon={<ShieldAlert className="w-3.5 h-3.5" />}
          >
            Escalate to Checker for Authorization
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs">
        {error && (
          <div className="bg-rose-50 border border-rose-300 text-rose-800 p-2.5 rounded">
            {error}
          </div>
        )}

        <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-1">
          <div className="flex justify-between">
            <span className="text-slate-500">Available Balance:</span>
            <span className="font-mono font-bold text-slate-900">{formatINR(account.availableBalance)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Existing Marked Lien:</span>
            <span className="font-mono font-semibold text-amber-800">{formatINR(account.lienAmount)}</span>
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-800 mb-1">
            New Lien Amount (INR)
          </label>
          <input
            type="number"
            value={lienAmountInput}
            onChange={(e) => setLienAmountInput(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded font-mono text-xs font-semibold focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
          />
          <div className="mt-0.5 text-[11px] text-slate-500 font-mono">
            Value: {formatINR(parseFloat(lienAmountInput) || 0)}
          </div>
        </div>

        <div>
          <label className="block font-semibold text-slate-800 mb-1">
            Statutory / Trade Lien Justification <span className="text-rose-600">*</span>
          </label>
          <textarea
            rows={3}
            value={lienReason}
            onChange={(e) => setLienReason(e.target.value)}
            className="w-full p-2 bg-slate-50 border border-slate-300 rounded text-xs focus:bg-white focus:outline-none focus:ring-1 focus:ring-slate-400"
            placeholder="Specify reason (e.g. 100% margin for Bank Guarantee, court attachment, recovery)"
          />
        </div>
      </form>
    </Modal>
  );
};
