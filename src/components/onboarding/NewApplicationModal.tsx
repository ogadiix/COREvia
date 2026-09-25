import React, { useState } from 'react';
import { X, UserCheck, Building2, Plus, Trash2 } from 'lucide-react';
import { bankingApi } from '../../lib/api';

interface NewApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdApp: any) => void;
}

export const NewApplicationModal: React.FC<NewApplicationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [customerType, setCustomerType] = useState<'INDIVIDUAL' | 'BUSINESS'>('INDIVIDUAL');
  const [applicantName, setApplicantName] = useState<string>('');
  const [onboardingType, setOnboardingType] = useState<string>('NEW_ACCOUNT');
  const [branchCode, setBranchCode] = useState<string>('BR-0104');
  const [branchName, setBranchName] = useState<string>('Fort, Mumbai Main Branch');
  const [priority, setPriority] = useState<'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'>('MEDIUM');
  const [notes, setNotes] = useState<string>('');

  // Selected products
  const [products, setProducts] = useState<
    Array<{
      productName: string;
      productCode: string;
      category: string;
      initialDepositAmount: number;
    }>
  >([
    {
      productName: 'Premium Commercial Current Account',
      productCode: 'PRD-CASA-002',
      category: 'CASA',
      initialDepositAmount: 50000,
    },
  ]);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddProduct = () => {
    setProducts([
      ...products,
      {
        productName: 'Corporate Fixed Deposit 1Y',
        productCode: 'PRD-TD-003',
        category: 'TERM_DEPOSIT',
        initialDepositAmount: 100000,
      },
    ]);
  };

  const handleRemoveProduct = (index: number) => {
    setProducts(products.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!applicantName.trim()) {
      setError('Applicant name is mandatory.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const created = await bankingApi.createOnboardingApplication({
        applicantName,
        customerType,
        onboardingType,
        branchCode,
        branchName,
        priority,
        notes,
        products,
      });
      onSuccess(created);
    } catch (err: any) {
      setError(err?.message || 'Failed to create onboarding application');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
      <div className="w-full max-w-2xl bg-white rounded-lg shadow-xl border border-slate-200 overflow-hidden">
        {/* Modal Header */}
        <div className="px-5 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Initiate Onboarding Application</h3>
            <p className="text-xs text-slate-500">Create a new customer or business dossier for KYC intake</p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 text-xs">
          {error && (
            <div className="p-2.5 bg-red-50 border border-red-200 text-red-700 rounded text-xs font-medium">
              {error}
            </div>
          )}

          {/* Customer Entity Type */}
          <div>
            <label className="block font-medium text-slate-700 mb-1.5">Account &amp; Entity Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setCustomerType('INDIVIDUAL')}
                className={`p-3 rounded border text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
                  customerType === 'INDIVIDUAL'
                    ? 'border-blue-900 bg-blue-50/50 text-blue-900 font-semibold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <UserCheck className="w-4 h-4 text-blue-900" />
                <div>
                  <div className="text-xs">Individual Applicant</div>
                  <div className="text-[10px] text-slate-400 font-normal">Retail, NRI, or HNI Banking</div>
                </div>
              </button>

              <button
                type="button"
                onClick={() => setCustomerType('BUSINESS')}
                className={`p-3 rounded border text-left flex items-center gap-2.5 transition-colors cursor-pointer ${
                  customerType === 'BUSINESS'
                    ? 'border-blue-900 bg-blue-50/50 text-blue-900 font-semibold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-4 h-4 text-indigo-900" />
                <div>
                  <div className="text-xs">Corporate / Entity</div>
                  <div className="text-[10px] text-slate-400 font-normal">Pvt Ltd, LLP, Partnership, MSME</div>
                </div>
              </button>
            </div>
          </div>

          {/* Applicant Name & Onboarding Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">
                {customerType === 'BUSINESS' ? 'Legal Entity Name' : 'Full Name (as per PAN)'} *
              </label>
              <input
                type="text"
                required
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                placeholder={customerType === 'BUSINESS' ? 'e.g. Apex Biotech India Pvt Ltd' : 'e.g. Rajesh S. Kulkarni'}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:ring-1 focus:ring-blue-900 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Workflow Track</label>
              <select
                value={onboardingType}
                onChange={(e) => setOnboardingType(e.target.value)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:ring-1 focus:ring-blue-900 focus:outline-hidden"
              >
                <option value="NEW_ACCOUNT">New Customer Onboarding (Fresh KYC)</option>
                <option value="PRODUCT_EXPANSION">Product Line Expansion (Existing KYC)</option>
                <option value="RE_KYC_PERIODIC">Periodic Re-KYC Update</option>
                <option value="DEAL_CONVERSION">Opportunity Pipeline Conversion</option>
              </select>
            </div>
          </div>

          {/* Branch & Priority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-medium text-slate-700 mb-1">Booking Branch</label>
              <select
                value={branchCode}
                onChange={(e) => {
                  setBranchCode(e.target.value);
                  setBranchName(e.target.value === 'BR-0104' ? 'Fort, Mumbai Main Branch' : 'BKC Corporate Banking Hub');
                }}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:ring-1 focus:ring-blue-900 focus:outline-hidden"
              >
                <option value="BR-0104">Fort, Mumbai Main Branch (BR-0104)</option>
                <option value="BR-0105">BKC Corporate Banking Hub (BR-0105)</option>
                <option value="BR-0201">Connaught Place, New Delhi (BR-0201)</option>
                <option value="BR-0501">MG Road, Bengaluru (BR-0501)</option>
              </select>
            </div>

            <div>
              <label className="block font-medium text-slate-700 mb-1">Triage Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:ring-1 focus:ring-blue-900 focus:outline-hidden"
              >
                <option value="LOW">Low (SLA 72 Hours)</option>
                <option value="MEDIUM">Medium (SLA 48 Hours - Standard)</option>
                <option value="HIGH">High (SLA 24 Hours - Commercial)</option>
                <option value="URGENT">Urgent (SLA 12 Hours - Institutional)</option>
              </select>
            </div>
          </div>

          {/* Requested Products */}
          <div className="border border-slate-200 rounded p-3 space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-slate-800">Initial Banking Products</span>
              <button
                type="button"
                onClick={handleAddProduct}
                className="text-blue-700 hover:underline font-medium text-xs flex items-center gap-1 cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Add Product
              </button>
            </div>

            <div className="space-y-2">
              {products.map((prod, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-slate-50 p-2 rounded border border-slate-200">
                  <input
                    type="text"
                    value={prod.productName}
                    onChange={(e) => {
                      const updated = [...products];
                      updated[idx].productName = e.target.value;
                      setProducts(updated);
                    }}
                    placeholder="Product Name"
                    className="flex-1 p-1.5 bg-white border border-slate-200 rounded text-xs"
                  />
                  <div className="flex items-center gap-1">
                    <span className="text-slate-400">₹</span>
                    <input
                      type="number"
                      value={prod.initialDepositAmount}
                      onChange={(e) => {
                        const updated = [...products];
                        updated[idx].initialDepositAmount = Number(e.target.value);
                        setProducts(updated);
                      }}
                      placeholder="Initial Deposit"
                      className="w-28 p-1.5 bg-white border border-slate-200 rounded text-xs font-mono"
                    />
                  </div>
                  {products.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveProduct(idx)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block font-medium text-slate-700 mb-1">Diligence &amp; Ingestion Remarks</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter customer sourcing channel, initial risk observations, or relationship context..."
              rows={2}
              className="w-full p-2 bg-slate-50 border border-slate-200 rounded text-xs focus:bg-white focus:ring-1 focus:ring-blue-900 focus:outline-hidden"
            />
          </div>

          {/* Modal Footer */}
          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white border border-slate-300 text-slate-700 rounded text-xs font-medium hover:bg-slate-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded text-xs font-medium shadow-xs cursor-pointer"
            >
              {loading ? 'Submitting Dossier...' : 'Submit Onboarding Application'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
