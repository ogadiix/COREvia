import React, { useState } from 'react';
import { BankAccount, AccountStatus } from '../../types';
import { Modal } from '../common/Modal';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { formatINR } from '../../data/mockIndianBankingData';
import {
  CreditCard,
  Lock,
  Unlock,
  ShieldAlert,
  FileText,
  UserCheck,
  CheckCircle2,
  AlertCircle,
  Building,
} from 'lucide-react';

interface AccountDetailModalProps {
  account: BankAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onRequestStatusChange: (account: BankAccount, newStatus: AccountStatus) => void;
  onRequestLienChange: (account: BankAccount) => void;
}

export const AccountDetailModal: React.FC<AccountDetailModalProps> = ({
  account,
  isOpen,
  onClose,
  onRequestStatusChange,
  onRequestLienChange,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'statement' | 'nomination'>('overview');

  if (!account) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Account Master Inquire — ${account.customerName}`}
      subtitle={`${account.schemeName} (${account.schemeCode})`}
      referenceId={account.accountNumber}
      maxWidth="2xl"
      footerActions={
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2">
            {account.status === 'ACTIVE' ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onRequestStatusChange(account, 'DEBIT_FREEZE');
                  onClose();
                }}
                icon={<Lock className="w-3 h-3 text-amber-700" />}
              >
                Mark Debit Freeze
              </Button>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  onRequestStatusChange(account, 'ACTIVE');
                  onClose();
                }}
                icon={<Unlock className="w-3 h-3 text-emerald-700" />}
              >
                Remove Freeze (Maker-Checker)
              </Button>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onRequestLienChange(account);
                onClose();
              }}
              icon={<ShieldAlert className="w-3 h-3 text-slate-600" />}
            >
              Modify Lien
            </Button>
          </div>

          <Button variant="primary" size="sm" onClick={onClose}>
            Close Inquire
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        {/* Navigation Tabs within Modal */}
        <div className="flex border-b border-slate-200">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-1.5 px-3 font-medium cursor-pointer border-b-2 transition-colors ${
              activeTab === 'overview'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Balances & Parameters
          </button>
          <button
            onClick={() => setActiveTab('statement')}
            className={`py-1.5 px-3 font-medium cursor-pointer border-b-2 transition-colors ${
              activeTab === 'statement'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Recent Statement
          </button>
          <button
            onClick={() => setActiveTab('nomination')}
            className={`py-1.5 px-3 font-medium cursor-pointer border-b-2 transition-colors ${
              activeTab === 'nomination'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Nomination (Form DA-1)
          </button>
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-3">
            {/* Balance Card */}
            <div className="bg-slate-50 border border-slate-200 rounded p-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <span className="text-slate-500">Available Balance</span>
                <div className="font-mono text-base font-bold text-slate-900 mt-0.5">
                  {formatINR(account.availableBalance)}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Ledger Balance</span>
                <div className="font-mono text-base font-medium text-slate-700 mt-0.5">
                  {formatINR(account.ledgerBalance)}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Lien Marked</span>
                <div className={`font-mono text-base font-bold mt-0.5 ${account.lienAmount > 0 ? 'text-amber-800' : 'text-slate-500'}`}>
                  {formatINR(account.lienAmount)}
                </div>
              </div>
              <div>
                <span className="text-slate-500">Operational Status</span>
                <div className="mt-1">
                  <Badge
                    variant={
                      account.status === 'ACTIVE'
                        ? 'success'
                        : account.status === 'DEBIT_FREEZE'
                        ? 'warning'
                        : 'danger'
                    }
                    size="sm"
                  >
                    {account.status.replace('_', ' ')}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Scheme & Technical specifications */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="border border-slate-200 rounded p-3 bg-white space-y-1.5">
                <div className="font-semibold text-slate-900 uppercase text-[11px] border-b border-slate-100 pb-1">
                  Scheme & Ledger Attributes
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Account Type:</span>
                  <span className="font-medium text-slate-800">{account.accountType}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scheme Code:</span>
                  <span className="font-mono text-slate-800">{account.schemeCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Interest Rate:</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {(Number(account?.interestRate) || 0) > 0 ? `${(Number(account.interestRate)).toFixed(2)}% p.a.` : 'Nil (Current A/c)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Open Date:</span>
                  <span className="font-mono text-slate-800">{account.openDate}</span>
                </div>
              </div>

              <div className="border border-slate-200 rounded p-3 bg-white space-y-1.5">
                <div className="font-semibold text-slate-900 uppercase text-[11px] border-b border-slate-100 pb-1">
                  Customer & Branch Mapping
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Customer CIF:</span>
                  <span className="font-mono text-slate-800">{account.cifNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Permanent A/c No (PAN):</span>
                  <span className="font-mono font-semibold text-slate-800">{account.panNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Branch Name:</span>
                  <span className="text-slate-800">{account.branchName} ({account.branchCode})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Branch IFSC:</span>
                  <span className="font-mono text-slate-800">{account.ifscCode}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'statement' && (
          <div className="border border-slate-200 rounded overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100 text-slate-700 font-semibold border-b border-slate-200 text-[11px]">
                  <th className="py-2 px-3">Date</th>
                  <th className="py-2 px-3">Narration</th>
                  <th className="py-2 px-3 text-right">Debit (INR)</th>
                  <th className="py-2 px-3 text-right">Credit (INR)</th>
                  <th className="py-2 px-3 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                <tr>
                  <td className="py-2 px-3 text-slate-500">09-SEP-2026</td>
                  <td className="py-2 px-3 font-sans text-slate-800">RTGS Outward PO-49201 UTR: CRVIAR52026090900049281</td>
                  <td className="py-2 px-3 text-right text-rose-700 font-semibold">₹1,45,00,000.00</td>
                  <td className="py-2 px-3 text-right text-slate-400">—</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">{formatINR(account.availableBalance)}</td>
                </tr>
                <tr className="bg-slate-50/50">
                  <td className="py-2 px-3 text-slate-500">08-SEP-2026</td>
                  <td className="py-2 px-3 font-sans text-slate-800">Inward RTGS Cleared from JSW Steel Client A/c</td>
                  <td className="py-2 px-3 text-right text-slate-400">—</td>
                  <td className="py-2 px-3 text-right text-emerald-700 font-semibold">₹2,80,00,000.00</td>
                  <td className="py-2 px-3 text-right font-bold text-slate-900">{formatINR(account.availableBalance + 14500000)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'nomination' && (
          <div className="border border-slate-200 rounded p-4 bg-white space-y-2">
            <div className="font-semibold text-slate-900 uppercase text-[11px] border-b border-slate-100 pb-1">
              Statutory Nomination Record under Section 45ZA of Banking Regulation Act, 1949
            </div>
            {account.nomineeName ? (
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Nominee Legal Name:</span>
                  <span className="font-semibold text-slate-900">{account.nomineeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Relationship to Account Holder:</span>
                  <span className="text-slate-800">{account.nomineeRelation}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Form DA-1 Registration Serial:</span>
                  <span className="font-mono text-slate-700">DA1-0104-MUM-2024-8841</span>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-slate-500">
                Non-Individual / Corporate Account. Form DA-1 is not applicable for corporate legal entities.
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
};
