import React, { useState, useEffect } from 'react';
import {
  FileText,
  Upload,
  CheckCircle2,
  AlertTriangle,
  Clock,
  XCircle,
  Eye,
  Download,
  Sparkles,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react';
import { UploadDocumentModal } from './UploadDocumentModal';
import { DocumentDetailDrawer } from './DocumentDetailDrawer';
import { DocumentStatus } from '../../types';
import { bankingApi } from '../../lib/api';

interface CustomerDocumentsTabProps {
  customerId: number;
  customerName?: string;
  customerCode?: string;
}

export const CustomerDocumentsTab: React.FC<CustomerDocumentsTabProps> = ({
  customerId,
  customerName,
  customerCode,
}) => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [requirementsData, setRequirementsData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDocId, setSelectedDocId] = useState<number | null>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [preselectedReqId, setPreselectedReqId] = useState<number | undefined>(undefined);

  const loadCustomerDocumentData = async () => {
    setIsLoading(true);
    try {
      const [docsData, reqs] = await Promise.all([
        bankingApi.getDocuments({ customerId, limit: 50 }),
        bankingApi.getCustomerDocumentRequirements(customerId),
      ]);

      setDocuments(docsData?.items || docsData?.data || (Array.isArray(docsData) ? docsData : []));
      setRequirementsData(reqs);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (customerId) {
      loadCustomerDocumentData();
    }
  }, [customerId]);

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'VERIFIED':
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-emerald-50 text-emerald-800 border border-emerald-200">VERIFIED</span>;
      case 'UNDER_REVIEW':
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-sky-50 text-sky-800 border border-sky-200">UNDER REVIEW</span>;
      case 'REJECTED':
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-rose-50 text-rose-800 border border-rose-200">REJECTED</span>;
      case 'REPLACEMENT_REQUIRED':
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-amber-50 text-amber-900 border border-amber-300">REPLACEMENT REQ.</span>;
      case 'EXPIRED':
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-100 text-slate-700 border border-slate-300">EXPIRED</span>;
      default:
        return <span className="px-2 py-0.5 text-[11px] font-semibold rounded bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Requirement Compliance Summary */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50 p-4 rounded-lg border border-slate-200">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-500" />
            <span>Customer Document Vault & Compliance Radar</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Institutional document records, statutory KYC, and credit verification files
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadCustomerDocumentData}
            className="p-1.5 text-slate-500 hover:text-slate-800 rounded hover:bg-slate-200/60"
            title="Refresh documents"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <button
            onClick={() => {
              setPreselectedReqId(undefined);
              setIsUploadModalOpen(true);
            }}
            className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs flex items-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5 text-amber-400" />
            <span>Upload Document</span>
          </button>
        </div>
      </div>

      {/* Requirements Radar Bar */}
      {requirementsData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded-md shadow-2xs">
            <div className="text-[11px] text-slate-500 dark:text-[#A9BACB] font-medium">Compliance Progress</div>
            <div className="text-base font-bold text-slate-900 dark:text-[#E8EEF5] mt-0.5">
              {requirementsData.summary.compliancePercentage}%
            </div>
            <div className="w-full h-1.5 bg-slate-100 dark:bg-[#101C2A] rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-emerald-600 rounded-full"
                style={{ width: `${requirementsData.summary.compliancePercentage}%` }}
              />
            </div>
          </div>
          <div className="p-3 bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded-md shadow-2xs">
            <div className="text-[11px] text-slate-500 dark:text-[#A9BACB] font-medium">Verified Required Docs</div>
            <div className="text-base font-bold text-emerald-700 dark:text-emerald-400 mt-0.5">
              {requirementsData.summary.satisfiedCount} / {requirementsData.summary.totalRequired}
            </div>
          </div>
          <div className="p-3 bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded-md shadow-2xs">
            <div className="text-[11px] text-slate-500 dark:text-[#A9BACB] font-medium">Missing Requirements</div>
            <div className={`text-base font-bold mt-0.5 ${requirementsData.summary.missingCount > 0 ? 'text-amber-700 dark:text-amber-400' : 'text-slate-700 dark:text-[#A9BACB]'}`}>
              {requirementsData.summary.missingCount}
            </div>
          </div>
          <div className="p-3 bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded-md shadow-2xs">
            <div className="text-[11px] text-slate-500 dark:text-[#A9BACB] font-medium">Expired / Obsolete</div>
            <div className={`text-base font-bold mt-0.5 ${requirementsData.summary.expiredCount > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-slate-700 dark:text-[#A9BACB]'}`}>
              {requirementsData.summary.expiredCount}
            </div>
          </div>
        </div>
      )}

      {/* Mandatory Requirements Checklist */}
      {requirementsData && requirementsData.requirements?.length > 0 && (
        <div className="p-4 bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-slate-900 dark:text-[#E8EEF5] uppercase tracking-wider">
              Statutory & Credit Requirements Checklist
            </h4>
            <span className="text-xs text-slate-500 dark:text-[#A9BACB]">
              Entity Class: {requirementsData.customer?.entityType || 'INDIVIDUAL'}
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-[#33485D]/60">
            {requirementsData.requirements.map((req: any) => {
              const isFulfilled = req.status === 'SATISFIED' && req.activeDocument?.status === 'VERIFIED';
              const isPending = req.status === 'SATISFIED' && req.activeDocument?.status !== 'VERIFIED';
              const isExpired = req.status === 'EXPIRED';

              return (
                <div key={req.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2.5">
                    {isFulfilled ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    ) : isExpired ? (
                      <XCircle className="w-4 h-4 text-rose-500 shrink-0" />
                    ) : isPending ? (
                      <Clock className="w-4 h-4 text-sky-500 shrink-0" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-amber-500 shrink-0" />
                    )}
                    <div>
                      <div className="font-semibold text-slate-900 dark:text-[#E8EEF5] flex items-center gap-2">
                        <span>{req.title}</span>
                        {req.isMandatory && (
                          <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-50 dark:bg-rose-950/50 text-rose-700 dark:text-rose-300 font-bold border border-rose-200 dark:border-rose-900/50">
                            MANDATORY
                          </span>
                        )}
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 dark:bg-[#101C2A] text-slate-600 dark:text-[#A9BACB] border border-slate-200 dark:border-[#33485D]">
                          {req.category}
                        </span>
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-[#A9BACB]">
                        Required Type: <span className="font-medium text-slate-700 dark:text-[#E8EEF5]">{req.documentType}</span>
                        {req.activeDocument && (
                          <span className="ml-2 font-mono text-slate-600 dark:text-slate-400">
                            (Indexed: {req.activeDocument.documentCode})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div>
                    {req.activeDocument ? (
                      <button
                        onClick={() => setSelectedDocId(req.activeDocument.id)}
                        className="px-2.5 py-1 text-xs font-medium text-slate-700 dark:text-[#A9BACB] bg-slate-100 dark:bg-[#101C2A] hover:bg-slate-200 dark:hover:bg-[#192B3D] border border-slate-200 dark:border-[#33485D] rounded flex items-center gap-1 cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Inspect</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setPreselectedReqId(req.id);
                          setIsUploadModalOpen(true);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-amber-900 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/40 rounded border border-amber-300 dark:border-amber-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload</span>
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Customer Document Vault Table */}
      <div className="border border-slate-200 dark:border-[#33485D] rounded-lg overflow-hidden bg-white dark:bg-[#162638]">
        <div className="px-4 py-3 border-b border-slate-200 dark:border-[#33485D] bg-slate-50/70 dark:bg-[#101C2A] flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-900 dark:text-[#E8EEF5] uppercase tracking-wider">
            Indexed Documents ({documents.length})
          </div>
        </div>

        {isLoading ? (
          <div className="p-8 text-center text-xs text-slate-400 dark:text-[#A9BACB]">Loading vault documents...</div>
        ) : documents.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 dark:text-[#A9BACB] space-y-2">
            <p>No documents uploaded for this customer yet.</p>
            <button
              onClick={() => setIsUploadModalOpen(true)}
              className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 dark:bg-cyan-600 dark:hover:bg-cyan-500 rounded-md cursor-pointer"
            >
              Upload First Document
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-[#101C2A] border-b border-slate-200 dark:border-[#33485D] text-slate-600 dark:text-[#A9BACB] font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-3 py-2.5">Code</th>
                  <th className="px-3 py-2.5">Document Title</th>
                  <th className="px-3 py-2.5">Type & Category</th>
                  <th className="px-3 py-2.5">Version</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Expiry</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-[#33485D]">
                {documents.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50/80 dark:hover:bg-[#101C2A]/70 transition-colors">
                    <td className="px-3 py-2.5 font-mono text-slate-900 dark:text-[#E8EEF5] font-semibold">{d.documentCode}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-semibold text-slate-900 dark:text-[#E8EEF5]">{d.title}</div>
                      <div className="text-[11px] text-slate-500 dark:text-[#A9BACB] font-mono">{d.fileName}</div>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className="font-medium text-slate-800 dark:text-[#E8EEF5]">{d.documentType}</span>
                      <span className="text-[10px] text-slate-500 dark:text-[#A9BACB] block">{d.category}</span>
                    </td>
                    <td className="px-3 py-2.5 font-mono text-slate-700 dark:text-[#A9BACB]">v{d.currentVersion}.0</td>
                    <td className="px-3 py-2.5">{getStatusBadge(d.status)}</td>
                    <td className="px-3 py-2.5 text-slate-600 dark:text-[#A9BACB] font-mono text-[11px]">{d.expiryDate || 'N/A'}</td>
                    <td className="px-3 py-2.5 text-right space-x-1.5">
                      <button
                        onClick={() => setSelectedDocId(d.id)}
                        className="p-1 text-slate-600 dark:text-[#A9BACB] hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-[#101C2A] cursor-pointer"
                        title="View details & verify"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <a
                        href={`/api/documents/${d.id}/download`}
                        download
                        className="p-1 text-slate-600 dark:text-[#A9BACB] hover:text-slate-900 dark:hover:text-white rounded hover:bg-slate-100 dark:hover:bg-[#101C2A] inline-block cursor-pointer"
                        title="Download artifact"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Upload Modal */}
      <UploadDocumentModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onSuccess={loadCustomerDocumentData}
        preselectedCustomerId={customerId}
        preselectedCustomerName={customerName}
        preselectedRequirementId={preselectedReqId}
      />

      {/* Document Detail Drawer */}
      <DocumentDetailDrawer
        documentId={selectedDocId}
        isOpen={selectedDocId !== null}
        onClose={() => setSelectedDocId(null)}
        onRefresh={loadCustomerDocumentData}
      />
    </div>
  );
};
