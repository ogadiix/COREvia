import React, { useState, useEffect } from 'react';
import {
  X,
  FileText,
  Download,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  History,
  Sparkles,
  Shield,
  Layers,
  ArrowRight,
  User,
  Building,
  Calendar,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { DocumentCategory, DocumentStatus, DocumentReviewStatus } from '../../types';
import { bankingApi } from '../../lib/api';

interface DocumentDetailDrawerProps {
  documentId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}

export const DocumentDetailDrawer: React.FC<DocumentDetailDrawerProps> = ({
  documentId,
  isOpen,
  onClose,
  onRefresh,
}) => {
  const [doc, setDoc] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'OVERVIEW' | 'VERSIONS' | 'REVIEW' | 'EXTRACTIONS'>('OVERVIEW');
  const [isProcessingAction, setIsProcessingAction] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);

  // Review action modal state
  const [reviewAction, setReviewAction] = useState<'VERIFY' | 'REJECT' | 'REPLACE' | null>(null);
  const [reviewComments, setReviewComments] = useState('');
  const [rejectionReason, setRejectionReason] = useState('UNREADABLE_IMAGE');
  const [replacementDueDate, setReplacementDueDate] = useState('');

  // Replace version state
  const [isReplacingVersion, setIsReplacingVersion] = useState(false);
  const [replaceReason, setReplaceReason] = useState('');

  const loadDocumentDetails = async (id: number) => {
    setIsLoading(true);
    try {
      const data = await bankingApi.getDocumentById(id);
      setDoc(data);
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && documentId) {
      loadDocumentDetails(documentId);
    } else {
      setDoc(null);
      setActiveTab('OVERVIEW');
      setReviewAction(null);
    }
  }, [isOpen, documentId]);

  if (!isOpen) return null;

  const handleVerify = async () => {
    if (!doc) return;
    setIsProcessingAction(true);
    setActionError(null);
    try {
      await bankingApi.verifyDocument(doc.id, reviewComments || 'Verified by compliance officer');
      setReviewAction(null);
      setReviewComments('');
      await loadDocumentDetails(doc.id);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleReject = async () => {
    if (!doc) return;
    if (!reviewComments.trim()) {
      setActionError('Please provide detailed rejection remarks.');
      return;
    }
    setIsProcessingAction(true);
    setActionError(null);
    try {
      await bankingApi.rejectDocument(doc.id, {
        reason: reviewComments,
        createTask: true,
      });
      setReviewAction(null);
      setReviewComments('');
      await loadDocumentDetails(doc.id);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleRequestReplacement = async () => {
    if (!doc) return;
    if (!reviewComments.trim()) {
      setActionError('Please provide a reason for requesting a replacement document.');
      return;
    }
    setIsProcessingAction(true);
    setActionError(null);
    try {
      await bankingApi.requestDocumentReplacement(doc.id, {
        reason: reviewComments,
        requestedDocType: doc.documentType,
        dueDate: replacementDueDate || new Date(Date.now() + 7 * 86400000).toISOString().split('T')[0],
      });
      setReviewAction(null);
      setReviewComments('');
      await loadDocumentDetails(doc.id);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleTriggerExtraction = async () => {
    if (!doc) return;
    setIsProcessingAction(true);
    try {
      await bankingApi.triggerDocumentExtraction(doc.id);
      await loadDocumentDetails(doc.id);
      onRefresh();
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const handleVerifyExtractionField = async (extractionId: number, status: 'HUMAN_VERIFIED' | 'REJECTED') => {
    try {
      await bankingApi.verifyDocumentExtraction(extractionId, status);
      if (doc) {
        await loadDocumentDetails(doc.id);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleReplaceVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!doc) return;
    setIsProcessingAction(true);
    setActionError(null);
    try {
      await bankingApi.replaceDocument(doc.id, {
        changeReason: replaceReason || 'Updated copy provided by customer',
      });
      setIsReplacingVersion(false);
      setReplaceReason('');
      await loadDocumentDetails(doc.id);
      onRefresh();
    } catch (err: any) {
      setActionError(err.message);
    } finally {
      setIsProcessingAction(false);
    }
  };

  const getStatusBadge = (status: DocumentStatus) => {
    switch (status) {
      case 'VERIFIED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">VERIFIED</span>;
      case 'UNDER_REVIEW':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-sky-50 text-sky-800 border border-sky-200">UNDER REVIEW</span>;
      case 'REJECTED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-rose-50 text-rose-800 border border-rose-200">REJECTED</span>;
      case 'REPLACEMENT_REQUIRED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-amber-50 text-amber-900 border border-amber-300">REPLACEMENT REQUIRED</span>;
      case 'EXPIRED':
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-800 border border-slate-300">EXPIRED</span>;
      default:
        return <span className="px-2 py-0.5 text-xs font-semibold rounded-md bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/60 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Drawer Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-slate-900 text-white flex items-center justify-center">
              <FileText className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-700">{doc?.documentCode || 'Loading...'}</span>
                {doc && getStatusBadge(doc.status)}
                {doc && (
                  <span className="text-[11px] px-2 py-0.5 font-mono font-medium rounded bg-slate-200 text-slate-800">
                    v{doc.currentVersion}.0
                  </span>
                )}
              </div>
              <h2 className="text-sm font-semibold text-slate-900 truncate max-w-md">
                {doc?.title || 'Document Record'}
              </h2>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {doc && (
              <a
                href={`/api/documents/${doc.id}/download`}
                download
                className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-200/70 rounded-md transition-colors"
                title="Download Synthetic Artifact"
              >
                <Download className="w-4 h-4" />
              </a>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/70 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Drawer Tabs */}
        <div className="flex border-b border-slate-200 px-6 bg-white shrink-0">
          <button
            onClick={() => setActiveTab('OVERVIEW')}
            className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'OVERVIEW'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Overview & Metadata
          </button>
          <button
            onClick={() => setActiveTab('VERSIONS')}
            className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'VERSIONS'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Versions ({doc?.versions?.length || 1})
          </button>
          <button
            onClick={() => setActiveTab('REVIEW')}
            className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-colors ${
              activeTab === 'REVIEW'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Review & Audit ({doc?.reviews?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('EXTRACTIONS')}
            className={`py-2.5 px-3 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
              activeTab === 'EXTRACTIONS'
                ? 'border-slate-900 text-slate-900 font-semibold'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            <span>Document Intelligence ({doc?.extractions?.length || 0})</span>
          </button>
        </div>

        {/* Drawer Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-slate-400 text-xs">
              <RefreshCw className="w-5 h-5 animate-spin mr-2" />
              <span>Retrieving document vault record...</span>
            </div>
          ) : !doc ? (
            <div className="text-center py-20 text-xs text-slate-400">Document record not found.</div>
          ) : (
            <>
              {actionError && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0" />
                  <span>{actionError}</span>
                </div>
              )}

              {/* OVERVIEW TAB */}
              {activeTab === 'OVERVIEW' && (
                <div className="space-y-6">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                      <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Category</div>
                      <div className="text-xs font-semibold text-slate-800 mt-1">{doc.category}</div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                      <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Doc Type</div>
                      <div className="text-xs font-semibold text-slate-800 mt-1">{doc.documentType}</div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                      <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Review State</div>
                      <div className="text-xs font-semibold text-slate-800 mt-1">{doc.reviewStatus}</div>
                    </div>
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                      <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Expiry</div>
                      <div className="text-xs font-semibold text-slate-800 mt-1">{doc.expiryDate || 'N/A (No Expiry)'}</div>
                    </div>
                  </div>

                  {/* Customer and Association Details */}
                  <div className="p-4 border border-slate-200 rounded-md bg-white space-y-3">
                    <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                      Associated Entity
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-500 block">Customer Name:</span>
                        <span className="font-semibold text-slate-900">{doc.customer?.name || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Customer Code / CIF:</span>
                        <span className="font-mono text-slate-800">{doc.customer?.customerCode || 'N/A'}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Linked Relationship:</span>
                        <span className="font-medium text-slate-800">
                          {doc.relatedEntityType || 'CUSTOMER'} {doc.relatedEntityId ? `(${doc.relatedEntityId})` : ''}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Issuing Authority:</span>
                        <span className="text-slate-800">{doc.issuingAuthority || 'Not Specified'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Document Security & Integrity Specifications */}
                  <div className="p-4 border border-slate-200 rounded-md bg-slate-50/50 space-y-2.5">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-900">
                      <Shield className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Security & File Integrity Attributes</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-slate-500">File Name:</span>{' '}
                        <span className="font-mono text-slate-800">{doc.fileName}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">MIME Type:</span>{' '}
                        <span className="font-mono text-slate-800">{doc.mimeType}</span>
                      </div>
                      <div>
                        <span className="text-slate-500">File Size:</span>{' '}
                        <span className="font-mono text-slate-800">{Math.round(doc.fileSize / 1024)} KB</span>
                      </div>
                      <div>
                        <span className="text-slate-500">Uploaded By:</span>{' '}
                        <span className="text-slate-800">{doc.uploadedBy?.name || 'Operations Officer'}</span>
                      </div>
                      <div className="sm:col-span-2">
                        <span className="text-slate-500">SHA-256 Checksum:</span>{' '}
                        <span className="font-mono text-[11px] text-slate-600 break-all">{doc.fileHash}</span>
                      </div>
                    </div>
                  </div>

                  {/* Rejection / Replacement Notice if applicable */}
                  {doc.rejectionReason && (
                    <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-md space-y-1">
                      <div className="text-xs font-semibold text-rose-800 flex items-center gap-1.5">
                        <XCircle className="w-4 h-4 text-rose-600" />
                        <span>Rejection Remarks</span>
                      </div>
                      <p className="text-xs text-rose-700 leading-relaxed">{doc.rejectionReason}</p>
                    </div>
                  )}

                  {/* Actions Bar */}
                  <div className="p-4 border border-slate-200 rounded-md bg-white space-y-3">
                    <div className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                      Maker-Checker Review Actions
                    </div>
                    <div className="flex flex-wrap gap-2.5">
                      <button
                        onClick={() => setReviewAction('VERIFY')}
                        className="px-3 py-2 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-md shadow-xs flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Verify & Approve</span>
                      </button>
                      <button
                        onClick={() => setReviewAction('REJECT')}
                        className="px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-300 hover:bg-rose-100 rounded-md flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject Document</span>
                      </button>
                      <button
                        onClick={() => setReviewAction('REPLACE')}
                        className="px-3 py-2 text-xs font-semibold text-amber-900 bg-amber-50 border border-amber-300 hover:bg-amber-100 rounded-md flex items-center gap-1.5"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        <span>Request Replacement</span>
                      </button>
                      <button
                        onClick={() => setIsReplacingVersion(true)}
                        className="px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-md flex items-center gap-1.5 ml-auto"
                      >
                        <Layers className="w-3.5 h-3.5 text-slate-500" />
                        <span>Upload New Version</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* VERSIONS TAB */}
              {activeTab === 'VERSIONS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                      Version Audit Trail
                    </h3>
                    <span className="text-xs text-slate-500">Current Active: v{doc.currentVersion}.0</span>
                  </div>

                  <div className="space-y-3">
                    {doc.versions?.map((v: any) => (
                      <div
                        key={v.id}
                        className={`p-3.5 border rounded-md transition-all ${
                          v.versionNumber === doc.currentVersion
                            ? 'border-slate-900 bg-slate-50/60 shadow-xs'
                            : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-slate-900">
                              v{v.versionNumber}.0
                            </span>
                            {v.versionNumber === doc.currentVersion && (
                              <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-slate-900 text-white uppercase">
                                Active
                              </span>
                            )}
                            <span className="text-xs text-slate-500 font-mono">{v.fileName}</span>
                          </div>
                          <span className="text-[11px] text-slate-400">
                            {new Date(v.createdAt).toLocaleDateString('en-IN', {
                              day: '2-digit',
                              month: 'short',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        {v.changeReason && (
                          <div className="text-xs text-slate-600 mt-2 bg-white p-2 rounded border border-slate-200">
                            <span className="font-semibold text-slate-700">Change Reason:</span> {v.changeReason}
                          </div>
                        )}

                        <div className="mt-2 text-[11px] text-slate-500 font-mono truncate">
                          SHA: {v.fileHash}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* REVIEW & AUDIT TAB */}
              {activeTab === 'REVIEW' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                      Compliance Review History
                    </h3>
                  </div>

                  {doc.reviews?.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-slate-200 rounded-md text-xs text-slate-400">
                      No formal review logs recorded yet. Use the review actions in Overview to verify or reject.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {doc.reviews?.map((r: any) => (
                        <div key={r.id} className="p-3.5 border border-slate-200 rounded-md bg-white space-y-1.5">
                          <div className="flex items-center justify-between text-xs">
                            <span className="font-semibold text-slate-900">
                              {r.decision} by {r.reviewer?.name || 'Officer'} ({r.reviewerRole})
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {new Date(r.reviewedAt).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                          </div>
                          {r.comments && (
                            <p className="text-xs text-slate-600 italic bg-slate-50 p-2 rounded border border-slate-200">
                              "{r.comments}"
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* EXTRACTIONS & INTELLIGENCE TAB */}
              {activeTab === 'EXTRACTIONS' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-semibold text-slate-900 uppercase tracking-wider">
                        Extracted Fields & Signals
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Synthetic OCR & deterministic banking entity recognition
                      </p>
                    </div>
                    <button
                      onClick={handleTriggerExtraction}
                      disabled={isProcessingAction}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                      <span>Re-run Extraction</span>
                    </button>
                  </div>

                  {doc.extractions?.length === 0 ? (
                    <div className="p-8 text-center border border-dashed border-slate-200 rounded-md text-xs text-slate-400 space-y-2">
                      <p>No structured data extracted from this document yet.</p>
                      <button
                        onClick={handleTriggerExtraction}
                        className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-md"
                      >
                        Extract Fields Now
                      </button>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-md overflow-hidden">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                          <tr>
                            <th className="px-3 py-2">Field</th>
                            <th className="px-3 py-2">Extracted Value</th>
                            <th className="px-3 py-2">Confidence</th>
                            <th className="px-3 py-2">Status</th>
                            <th className="px-3 py-2 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                          {doc.extractions?.map((ex: any) => (
                            <tr key={ex.id} className="hover:bg-slate-50/80">
                              <td className="px-3 py-2.5 font-medium text-slate-800">{ex.fieldName}</td>
                              <td className="px-3 py-2.5 font-mono text-slate-900 font-semibold">{ex.fieldValue}</td>
                              <td className="px-3 py-2.5">
                                <div className="flex items-center gap-1.5">
                                  <div className="w-12 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                    <div
                                      className="h-full bg-emerald-500 rounded-full"
                                      style={{ width: `${Math.round(ex.confidence * 100)}%` }}
                                    />
                                  </div>
                                  <span className="font-mono text-[10px] text-slate-600">
                                    {Math.round(ex.confidence * 100)}%
                                  </span>
                                </div>
                              </td>
                              <td className="px-3 py-2.5">
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                    ex.verificationStatus === 'HUMAN_VERIFIED'
                                      ? 'bg-emerald-50 text-emerald-800'
                                      : ex.verificationStatus === 'REJECTED'
                                      ? 'bg-rose-50 text-rose-800'
                                      : 'bg-amber-50 text-amber-800'
                                  }`}
                                >
                                  {ex.verificationStatus}
                                </span>
                              </td>
                              <td className="px-3 py-2.5 text-right space-x-1">
                                {ex.verificationStatus !== 'HUMAN_VERIFIED' && (
                                  <button
                                    onClick={() => handleVerifyExtractionField(ex.id, 'HUMAN_VERIFIED')}
                                    className="px-2 py-1 text-[10px] font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded border border-emerald-200"
                                    title="Verify extracted value"
                                  >
                                    Accept
                                  </button>
                                )}
                                {ex.verificationStatus !== 'REJECTED' && (
                                  <button
                                    onClick={() => handleVerifyExtractionField(ex.id, 'REJECTED')}
                                    className="px-2 py-1 text-[10px] font-semibold text-rose-800 bg-rose-50 hover:bg-rose-100 rounded border border-rose-200"
                                    title="Reject extracted value"
                                  >
                                    Reject
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Action Dialog Modal Overlays */}
        {reviewAction && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70">
            <div className="w-full max-w-md bg-white rounded-lg shadow-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-semibold text-slate-900">
                  {reviewAction === 'VERIFY' && 'Verify & Approve Document'}
                  {reviewAction === 'REJECT' && 'Reject Document with Deficiency Notice'}
                  {reviewAction === 'REPLACE' && 'Request Document Replacement'}
                </h3>
                <button onClick={() => setReviewAction(null)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {reviewAction === 'REJECT' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Rejection Classification</label>
                  <select
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white text-slate-900"
                  >
                    <option value="UNREADABLE_IMAGE">Blurry, cropped, or illegible image</option>
                    <option value="EXPIRED_DOCUMENT">Document has expired past statutory threshold</option>
                    <option value="NAME_MISMATCH">Customer name mismatch against Core Banking Record</option>
                    <option value="INCORRECT_TYPE">Incorrect document category submitted</option>
                    <option value="UNAUTHORIZED_AUTHORITY">Issuing authority not recognized or uncertified</option>
                  </select>
                </div>
              )}

              {reviewAction === 'REPLACE' && (
                <div className="space-y-1.5">
                  <label className="block text-xs font-semibold text-slate-700">Replacement Due Date</label>
                  <input
                    type="date"
                    value={replacementDueDate}
                    onChange={(e) => setReplacementDueDate(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white text-slate-900"
                  />
                </div>
              )}

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  {reviewAction === 'VERIFY' ? 'Review Comments (Optional)' : 'Remarks & Guidance for RM / Customer *'}
                </label>
                <textarea
                  rows={3}
                  value={reviewComments}
                  onChange={(e) => setReviewComments(e.target.value)}
                  placeholder={
                    reviewAction === 'VERIFY'
                      ? 'Verified against statutory parameters...'
                      : 'Provide explicit reasons and remediation guidance...'
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white text-slate-900"
                  required={reviewAction !== 'VERIFY'}
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  onClick={() => setReviewAction(null)}
                  className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                  disabled={isProcessingAction}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    if (reviewAction === 'VERIFY') handleVerify();
                    else if (reviewAction === 'REJECT') handleReject();
                    else if (reviewAction === 'REPLACE') handleRequestReplacement();
                  }}
                  disabled={isProcessingAction}
                  className={`px-3 py-1.5 text-xs font-semibold text-white rounded-md shadow-xs ${
                    reviewAction === 'VERIFY'
                      ? 'bg-emerald-700 hover:bg-emerald-800'
                      : reviewAction === 'REJECT'
                      ? 'bg-rose-700 hover:bg-rose-800'
                      : 'bg-amber-800 hover:bg-amber-900'
                  } disabled:opacity-50`}
                >
                  {isProcessingAction ? 'Processing...' : 'Confirm Action'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Upload New Version Overlay */}
        {isReplacingVersion && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-slate-950/70">
            <form onSubmit={handleReplaceVersion} className="w-full max-w-md bg-white rounded-lg shadow-2xl border border-slate-200 p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <h3 className="text-sm font-semibold text-slate-900">Upload New Version (v{doc.currentVersion + 1}.0)</h3>
                <button type="button" onClick={() => setIsReplacingVersion(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-900">
                A new version will be archived. Prior version v{doc.currentVersion}.0 remains permanently accessible in the historical audit chain.
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">Reason for Version Update *</label>
                <input
                  type="text"
                  value={replaceReason}
                  onChange={(e) => setReplaceReason(e.target.value)}
                  placeholder="e.g. Updated annual filing received from customer"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md text-xs bg-white text-slate-900"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsReplacingVersion(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                  disabled={isProcessingAction}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessingAction}
                  className="px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md disabled:opacity-50"
                >
                  {isProcessingAction ? 'Indexing...' : 'Commit Version'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
