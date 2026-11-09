import React, { useState } from 'react';
import { Dialog } from '../common/Dialog';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { useToast } from '../common/Toast';
import { bankingApi } from '../../lib/api';
import { Package, CheckCircle2, WalletCards } from 'lucide-react';

interface EnrollProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: any;
  availableProducts: any[];
  linkedAccounts?: any[];
  onEnrolledSuccess: () => void;
}

export const EnrollProductModal: React.FC<EnrollProductModalProps> = ({
  isOpen,
  onClose,
  customer,
  availableProducts,
  linkedAccounts = [],
  onEnrolledSuccess,
}) => {
  const toast = useToast();
  const [selectedProductId, setSelectedProductId] = useState<number | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const handleEnroll = async () => {
    if (!customer?.cifNumber || !selectedProductId) {
      toast.error('Please select a product scheme to enroll.');
      return;
    }

    setSubmitting(true);
    try {
      await bankingApi.enrollCustomerProduct(
        customer.cifNumber,
        selectedProductId,
        selectedAccountId || undefined
      );

      toast.success('Customer enrolled in product scheme successfully.');
      setSelectedProductId(null);
      setSelectedAccountId(null);
      onEnrolledSuccess();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to enroll customer in banking product.');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProduct = availableProducts.find((p) => p.id === selectedProductId);

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-[#168C83] dark:text-[#1B9D92]" />
          <span>Enroll in Institutional Banking Product</span>
        </div>
      }
      subtitle={`Customer: ${customer?.name} (${customer?.cifNumber})`}
      size="lg"
      footerActions={
        <div className="flex items-center justify-end gap-2 w-full">
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={handleEnroll}
            disabled={submitting || !selectedProductId}
          >
            {submitting ? 'Enrolling in Scheme...' : 'Confirm Enrollment'}
          </Button>
        </div>
      }
    >
      <div className="space-y-4 text-xs">
        <div>
          <label className="block text-slate-700 dark:text-[#E8EEF5] font-semibold mb-1.5">
            Select Product Scheme from Master Catalog
          </label>
          <div className="max-h-56 overflow-y-auto space-y-2 border border-slate-200 dark:border-[#33485D] rounded p-2 bg-slate-50 dark:bg-[#101C2A]">
            {availableProducts.map((p) => {
              const isSelected = selectedProductId === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => setSelectedProductId(p.id)}
                  className={`p-2.5 rounded cursor-pointer border transition-all flex items-center justify-between ${
                    isSelected
                      ? 'bg-emerald-50/50 dark:bg-[#162638] border-[#168C83] dark:border-[#1B9D92] ring-1 ring-[#168C83]'
                      : 'bg-white dark:bg-[#162638] border-slate-200 dark:border-[#33485D] hover:border-slate-300 dark:hover:border-[#435e7a]'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-900 dark:text-[#E8EEF5]">
                        {p.name || p.schemeName}
                      </span>
                      <span className="font-mono text-[10px] text-slate-500 dark:text-[#8194A8]">
                        {p.productCode}
                      </span>
                    </div>
                    {p.description && (
                      <p className="text-[11px] text-slate-500 dark:text-[#8194A8] mt-0.5">
                        {p.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        p.category === 'CASA'
                          ? 'info'
                          : p.category === 'TERM_DEPOSIT'
                          ? 'neutral'
                          : p.category === 'LOANS'
                          ? 'warning'
                          : 'success'
                      }
                      size="sm"
                    >
                      {p.category}
                    </Badge>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-[#168C83] dark:text-[#1B9D92]" />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Optional Account Linking */}
        {linkedAccounts.length > 0 && (
          <div>
            <label className="block text-slate-700 dark:text-[#E8EEF5] font-semibold mb-1">
              Link Settlement / Servicing Account (Optional)
            </label>
            <select
              value={selectedAccountId || ''}
              onChange={(e) => setSelectedAccountId(e.target.value ? Number(e.target.value) : null)}
              className="w-full p-2 bg-slate-50 dark:bg-[#101C2A] border border-slate-300 dark:border-[#33485D] rounded text-slate-900 dark:text-[#E8EEF5] focus:outline-none focus:ring-1 focus:ring-[#168C83]"
            >
              <option value="">No linked account (Direct facility)</option>
              {linkedAccounts.map((acc: any) => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountNumber} — {acc.accountType} ({acc.schemeName || 'CASA'})
                </option>
              ))}
            </select>
          </div>
        )}

        {selectedProduct && (
          <div className="p-3 bg-slate-100 dark:bg-[#192B3D] border border-slate-200 dark:border-[#33485D] rounded text-[11px] space-y-1">
            <span className="font-semibold text-slate-800 dark:text-[#E8EEF5] block">
              Enrollment Summary
            </span>
            <div className="text-slate-600 dark:text-[#A9BACB]">
              Customer will be enrolled in scheme <strong>{selectedProduct.name}</strong> under CIF {customer.cifNumber}. All interest calculation and automated servicing will take effect immediately upon maker-checker confirmation.
            </div>
          </div>
        )}
      </div>
    </Dialog>
  );
};

