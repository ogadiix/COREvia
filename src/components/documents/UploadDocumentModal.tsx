import React, { useState, useEffect } from 'react';
import {
  X,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle2,
  Building2,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { DocumentCategory, DocumentType } from '../../types';
import { bankingApi } from '../../lib/api';

interface UploadDocumentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  preselectedCustomerId?: number;
  preselectedCustomerName?: string;
  preselectedEntityType?: string;
  preselectedEntityId?: string;
  preselectedRequirementId?: number;
}

export const UploadDocumentModal: React.FC<UploadDocumentModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preselectedCustomerId,
  preselectedCustomerName,
  preselectedEntityType,
  preselectedEntityId,
  preselectedRequirementId,
}) => {
  const [customers, setCustomers] = useState<Array<{ id: number; name: string; customerCode: string }>>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | ''>(preselectedCustomerId || '');
  const [customerSearch, setCustomerSearch] = useState(preselectedCustomerName || '');
  
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<DocumentCategory>('KYC');
  const [documentType, setDocumentType] = useState<DocumentType>('PAN');
  const [documentNumber, setDocumentNumber] = useState('');
  const [issuingAuthority, setIssuingAuthority] = useState('Income Tax Department of India');
  const [expiryDate, setExpiryDate] = useState('');
  const [relatedEntityType, setRelatedEntityType] = useState(preselectedEntityType || 'CUSTOMER');
  const [relatedEntityId, setRelatedEntityId] = useState(preselectedEntityId || '');
  const [notes, setNotes] = useState('');
  
  const [uploadMode, setUploadMode] = useState<'SYNTHETIC' | 'FILE'>('SYNTHETIC');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Load customers list for dropdown
      bankingApi.getCustomers({ limit: 50 })
        .then((data: any) => {
          const list = data?.data || data?.items || (Array.isArray(data) ? data : []);
          if (Array.isArray(list) && list.length > 0) {
            setCustomers(list);
            if (preselectedCustomerId) {
              setSelectedCustomerId(preselectedCustomerId);
            } else {
              setSelectedCustomerId(list[0].id);
            }
          }
        })
        .catch(() => {});
    }
  }, [isOpen, preselectedCustomerId]);

  // Update default issuing authority and title based on document type
  useEffect(() => {
    switch (documentType) {
      case 'PAN':
        setTitle('Permanent Account Number Card');
        setCategory('KYC');
        setIssuingAuthority('Income Tax Department of India');
        break;
      case 'Aadhaar Card':
        setTitle('UIDAI Aadhaar Electronic Verification');
        setCategory('KYC');
        setIssuingAuthority('Unique Identification Authority of India');
        break;
      case 'Passport':
        setTitle('Indian Republic Passport (Pages 1-36)');
        setCategory('KYC');
        setIssuingAuthority('Ministry of External Affairs');
        break;
      case 'Income Tax Returns':
        setTitle('ITR-V Assessment Verification (AY 2025-26)');
        setCategory('FINANCIAL');
        setIssuingAuthority('Central Board of Direct Taxes (CBDT)');
        break;
      case 'Audited Balance Sheet':
        setTitle('Statutory Audited Financial Statements & Balance Sheet');
        setCategory('FINANCIAL');
        setIssuingAuthority('Chartered Accountants of India (ICAI)');
        break;
      case 'Salary Slip':
        setTitle('Certified Salary & Remuneration Slip (Recent)');
        setCategory('FINANCIAL');
        setIssuingAuthority('Corporate Employer HR Department');
        break;
      case 'Board Resolution':
        setTitle('Certified Extract of Board Resolution for Borrowing Power');
        setCategory('LEGAL');
        setIssuingAuthority('Company Secretarial Department');
        break;
      case 'Utility Bill':
        setTitle('Electricity / Piped Gas Utility Bill for Address Verification');
        setCategory('KYC');
        setIssuingAuthority('Municipal Utility Undertaking');
        break;
      case 'Bank Statement':
        setTitle('6-Month Bank Account Operational Statement');
        setCategory('FINANCIAL');
        setIssuingAuthority('Scheduled Commercial Bank');
        break;
      case 'GST Registration Certificate':
        setTitle('Form GST REG-06 Registration Certificate');
        setCategory('COMPLIANCE');
        setIssuingAuthority('Goods and Services Tax Network (GSTN)');
        break;
      case 'Loan Agreement':
        setTitle('Sanctioned Credit Facility Agreement');
        setCategory('LEGAL');
        setIssuingAuthority('COREvia Bank Credit Underwriting');
        break;
      default:
        setTitle(`${documentType} Verification Record`);
        break;
    }
  }, [documentType]);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 15 * 1024 * 1024) {
        setErrorMessage('File size exceeds maximum allowable limit of 15MB.');
        return;
      }
      setSelectedFile(file);
      setErrorMessage(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      setErrorMessage('Please select a customer for this document.');
      return;
    }
    if (!title.trim()) {
      setErrorMessage('Please provide a document title.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      let filePayload: any = {};

      if (uploadMode === 'FILE' && selectedFile) {
        // Read file as base64
        const reader = new FileReader();
        const filePromise = new Promise<{ base64: string; mime: string }>((resolve, reject) => {
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1] || result;
            resolve({ base64, mime: selectedFile.type || 'application/pdf' });
          };
          reader.onerror = reject;
        });
        reader.readAsDataURL(selectedFile);
        const { base64, mime } = await filePromise;

        filePayload = {
          fileBase64: base64,
          fileName: selectedFile.name,
          mimeType: mime,
          fileSize: selectedFile.size,
        };
      }

      const body = {
        customerId: Number(selectedCustomerId),
        title,
        documentType,
        category,
        documentNumber: documentNumber || undefined,
        issuingAuthority: issuingAuthority || undefined,
        expiryDate: expiryDate || undefined,
        relatedEntityType: relatedEntityType || undefined,
        relatedEntityId: relatedEntityId || undefined,
        requirementId: preselectedRequirementId || undefined,
        notes: notes || undefined,
        ...filePayload,
      };

      await bankingApi.uploadDocument(body);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'An error occurred during upload.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-white rounded-lg shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <Upload className="w-4 h-4 text-amber-400" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-slate-900">Upload & Vault Document</h2>
              <p className="text-xs text-slate-500 font-mono">COREvia Synthetic Document Registry</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-md hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md flex items-start gap-2.5 text-xs text-rose-700">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Customer Selection */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Customer Entity <span className="text-rose-500">*</span>
            </label>
            {preselectedCustomerId && preselectedCustomerName ? (
              <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-md text-sm font-medium text-slate-900 flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-500" />
                <span>{preselectedCustomerName}</span>
                <span className="text-xs text-slate-500 font-mono ml-auto">CID #{preselectedCustomerId}</span>
              </div>
            ) : (
              <select
                value={selectedCustomerId}
                onChange={(e) => setSelectedCustomerId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
                required
              >
                <option value="">-- Select Customer --</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.customerCode})
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Document Type & Category */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Document Type <span className="text-rose-500">*</span>
              </label>
              <select
                value={documentType}
                onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              >
                <option value="PAN">PAN (Permanent Account Number)</option>
                <option value="Aadhaar Card">Aadhaar Card (UIDAI)</option>
                <option value="Passport">Passport</option>
                <option value="Voter ID">Voter ID (EPIC)</option>
                <option value="Driving License">Driving License</option>
                <option value="Salary Slip">Salary Slip (Recent 3 Months)</option>
                <option value="Bank Statement">Bank Statement (6 Months)</option>
                <option value="Income Tax Returns">Income Tax Returns (ITR-V)</option>
                <option value="Audited Balance Sheet">Audited Balance Sheet & P&L</option>
                <option value="Form 16">Form 16 / TDS Certificate</option>
                <option value="Board Resolution">Board Resolution</option>
                <option value="Certificate of Incorporation">Certificate of Incorporation</option>
                <option value="GST Registration Certificate">GST Registration Certificate</option>
                <option value="Utility Bill">Utility Bill (Address Proof)</option>
                <option value="Loan Agreement">Loan Agreement / Facility Sanction</option>
                <option value="Property Title Deed">Property Title Deed / Valuation</option>
                <option value="Other">Other Bank Document</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Category
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as DocumentCategory)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              >
                <option value="KYC">KYC & Identity</option>
                <option value="FINANCIAL">Financial & Underwriting</option>
                <option value="COLLATERAL">Collateral & Asset</option>
                <option value="COMPLIANCE">Compliance & Statutory</option>
                <option value="LEGAL">Legal & Agreements</option>
                <option value="OPERATIONAL">Operational & Service</option>
              </select>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Document Display Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Rahul Sharma PAN Card Verification Copy"
              className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              required
            />
          </div>

          {/* Document Reference & Issuing Authority */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Document Number / ID
              </label>
              <input
                type="text"
                value={documentNumber}
                onChange={(e) => setDocumentNumber(e.target.value)}
                placeholder="e.g. ABCDE1234F or 987654321012"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white text-slate-900 font-mono focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Issuing Authority
              </label>
              <input
                type="text"
                value={issuingAuthority}
                onChange={(e) => setIssuingAuthority(e.target.value)}
                placeholder="e.g. Income Tax Department, UIDAI"
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>
          </div>

          {/* Expiry Date & Related Entity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Expiry Date (If Applicable)
              </label>
              <input
                type="date"
                value={expiryDate}
                onChange={(e) => setExpiryDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Association Context
              </label>
              <select
                value={relatedEntityType}
                onChange={(e) => setRelatedEntityType(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md text-sm bg-white text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-slate-900"
              >
                <option value="CUSTOMER">Customer Profile (General)</option>
                <option value="ONBOARDING">Onboarding Application</option>
                <option value="LOAN">Credit / Loan Facility</option>
                <option value="CASE">Service Desk Case / Dispute</option>
                <option value="ACCOUNT">Deposit / CASA Account</option>
              </select>
            </div>
          </div>

          {/* Upload Method Toggle: Synthetic Document vs Physical/Digital File */}
          <div className="pt-2 border-t border-slate-200">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                Document File Payload
              </label>
              <div className="flex bg-slate-100 p-0.5 rounded-md border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => setUploadMode('SYNTHETIC')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    uploadMode === 'SYNTHETIC'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Synthetic Document Engine
                </button>
                <button
                  type="button"
                  onClick={() => setUploadMode('FILE')}
                  className={`px-2.5 py-1 rounded font-medium transition-colors ${
                    uploadMode === 'FILE'
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Upload File (.pdf/.jpg)
                </button>
              </div>
            </div>

            {uploadMode === 'SYNTHETIC' ? (
              <div className="p-3.5 bg-amber-50/50 border border-amber-200/80 rounded-md text-xs text-slate-700 space-y-1.5">
                <div className="flex items-center gap-2 text-amber-900 font-semibold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                  <span>COREvia Synthetic Banking Artifact</span>
                </div>
                <p className="text-slate-600 leading-relaxed">
                  In compliance with enterprise banking simulation standards, a certified synthetic PDF artifact will be generated with SHA-256 integrity checksums, watermarking, and OCR metadata for <span className="font-semibold text-slate-800">{documentType}</span>.
                </p>
              </div>
            ) : (
              <div className="border-2 border-dashed border-slate-300 rounded-md p-4 text-center hover:border-slate-400 transition-colors">
                <input
                  type="file"
                  id="document-file-upload"
                  className="hidden"
                  accept=".pdf,.png,.jpg,.jpeg"
                  onChange={handleFileChange}
                />
                <label
                  htmlFor="document-file-upload"
                  className="cursor-pointer flex flex-col items-center justify-center space-y-1.5"
                >
                  <Upload className="w-6 h-6 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-700">
                    {selectedFile ? selectedFile.name : 'Click or drag file to upload'}
                  </span>
                  <span className="text-[11px] text-slate-500">
                    PDF, PNG, JPG up to 15MB · Magic byte integrity verified
                  </span>
                </label>
              </div>
            )}
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <span>Vaulting Document...</span>
              ) : (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />
                  <span>Confirm & Index Document</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
