import React, { useState } from 'react';
import {
  OnboardingApplicationItem,
  OnboardingDocumentItem,
  OnboardingExceptionItem,
  OnboardingStatus,
  KycStatus,
  KybStatus,
} from '../../types';
import { bankingApi } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import {
  X,
  UserCheck,
  Building2,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Upload,
  AlertOctagon,
  ExternalLink,
  ShieldCheck,
  ArrowRight,
  Send,
  UserPlus,
  RefreshCw,
  Eye,
  FileCheck2,
  FileX,
  FileQuestion,
  HelpCircle,
  Check,
} from 'lucide-react';

interface OnboardingDetailDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  application: OnboardingApplicationItem | null;
  onRefreshApp: () => void;
  onNavigateToCustomer?: (customerCode: string) => void;
  onReviewDoc: (doc: OnboardingDocumentItem) => void;
  onRaiseException: (app: OnboardingApplicationItem) => void;
  onResolveException: (exc: OnboardingExceptionItem) => void;
  onWaiveException: (exc: OnboardingExceptionItem) => void;
  onReassign: (app: OnboardingApplicationItem) => void;
}

type DrawerTab = 'overview' | 'kyc-kyb' | 'documents' | 'exceptions' | 'timeline';

export const OnboardingDetailDrawer: React.FC<OnboardingDetailDrawerProps> = ({
  isOpen,
  onClose,
  application,
  onRefreshApp,
  onNavigateToCustomer,
  onReviewDoc,
  onRaiseException,
  onResolveException,
  onWaiveException,
  onReassign,
}) => {
  const { user, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<DrawerTab>('overview');

  // Status Action State
  const [actionLoading, setActionLoading] = useState<boolean>(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState<string>('');
  const [showRejectBox, setShowRejectBox] = useState<boolean>(false);

  // Upload document form in drawer
  const [showUploadForm, setShowUploadForm] = useState<boolean>(false);
  const [uploadDocType, setUploadDocType] = useState<string>('IDENTITY_PROOF');
  const [uploadTitle, setUploadTitle] = useState<string>('');
  const [uploadFileName, setUploadFileName] = useState<string>('');
  const [uploadLoading, setUploadLoading] = useState<boolean>(false);

  // KYC Quick Update State
  const [kycUpdating, setKycUpdating] = useState<boolean>(false);

  if (!isOpen || !application) return null;

  const handleAdvanceStatus = async (targetStatus: OnboardingStatus) => {
    setActionLoading(true);
    setActionError(null);
    try {
      await bankingApi.updateOnboardingStatus(application.id, targetStatus);
      onRefreshApp();
    } catch (err: any) {
      setActionError(err?.message || `Failed to update status to ${targetStatus}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectApplication = async () => {
    if (!rejectReason.trim()) {
      setActionError('Please specify a valid rejection reason.');
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      await bankingApi.updateOnboardingStatus(application.id, 'REJECTED', rejectReason);
      setShowRejectBox(false);
      setRejectReason('');
      onRefreshApp();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to reject application');
    } finally {
      setActionLoading(false);
    }
  };

  const handleApproveApplication = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await bankingApi.updateOnboardingStatus(application.id, 'APPROVED');
      onRefreshApp();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to approve application');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await bankingApi.updateOnboardingStatus(application.id, 'COMPLETED');
      onRefreshApp();
    } catch (err: any) {
      setActionError(err?.message || 'Failed to complete onboarding');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerifyKycAll = async () => {
    setKycUpdating(true);
    try {
      await bankingApi.updateKycReview(application.id, {
        status: 'VERIFIED',
        identityStatus: 'VERIFIED',
        addressStatus: 'VERIFIED',
        contactStatus: 'VERIFIED',
        panVerificationStatus: 'SIMULATED_VERIFIED',
        pepStatus: 'NO_MATCH',
        sanctionsCheckStatus: 'PASSED_SIMULATED',
        adverseMediaStatus: 'CLEAR',
        riskCategory: 'LOW',
        reviewSummary: 'All synthetic checks validated and verified.',
      });
      onRefreshApp();
    } catch (err: any) {
      console.error('Failed to update KYC:', err);
    } finally {
      setKycUpdating(false);
    }
  };

  const handleVerifyKybAll = async () => {
    setKycUpdating(true);
    try {
      await bankingApi.updateKybReview(application.id, {
        status: 'VERIFIED',
        uboVerificationStatus: 'VERIFIED',
        boardResolutionStatus: 'VERIFIED',
        authorizedSignatoriesStatus: 'VERIFIED',
      });
      onRefreshApp();
    } catch (err: any) {
      console.error('Failed to update KYB:', err);
    } finally {
      setKycUpdating(false);
    }
  };

  const handleUploadDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadFileName.trim()) return;
    setUploadLoading(true);
    try {
      await bankingApi.uploadOnboardingDocument(application.id, {
        documentType: uploadDocType,
        title: uploadTitle,
        fileName: uploadFileName,
        fileSize: '1.4 MB',
        mimeType: 'application/pdf',
      });
      setUploadTitle('');
      setUploadFileName('');
      setShowUploadForm(false);
      onRefreshApp();
    } catch (err: any) {
      console.error('Failed to upload document:', err);
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/40 backdrop-blur-2xs transition-opacity">
      <div className="w-full max-w-4xl bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Drawer Header */}
        <div className="p-4 bg-slate-50 border-b border-slate-200">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-blue-900 text-white rounded">
                  {application.applicationNumber}
                </span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-700 border border-slate-200 rounded text-xs font-medium">
                  {application.customerType === 'BUSINESS' ? 'Corporate' : 'Individual'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                    application.priority === 'URGENT'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : application.priority === 'HIGH'
                      ? 'bg-orange-50 text-orange-700 border-orange-200'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}
                >
                  {application.priority} PRIORITY
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-1">{application.applicantName}</h2>
              <div className="text-xs text-slate-500 flex items-center gap-3 mt-0.5">
                <span>Branch: {application.branchName}</span>
                <span>•</span>
                <span>Assigned RM: {application.assignedRmName || 'Unassigned'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => onReassign(application)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-medium shadow-xs flex items-center gap-1 cursor-pointer"
                title="Reassign Officer / RM"
              >
                <UserPlus className="w-3.5 h-3.5" />
                Reassign
              </button>
              <button
                onClick={() => onRaiseException(application)}
                className="px-2.5 py-1.5 bg-white border border-red-300 hover:bg-red-50 text-red-700 rounded text-xs font-medium shadow-xs flex items-center gap-1 cursor-pointer"
                title="Log Exception or Discrepancy"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                Raise Exception
              </button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Action Ribbon & Error Display */}
          {actionError && (
            <div className="mt-3 p-2.5 bg-red-50 border border-red-200 rounded text-xs text-red-700 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Workflow Action Bar */}
          <div className="mt-3 pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500">Current Status:</span>
              <span className="font-semibold text-xs text-blue-900 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {application.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {application.status === 'SUBMITTED' && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleAdvanceStatus('DOCUMENT_REVIEW')}
                  className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded text-xs font-medium shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  Start Document Review &rarr;
                </button>
              )}

              {application.status === 'DOCUMENT_REVIEW' && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleAdvanceStatus('KYC_REVIEW')}
                  className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded text-xs font-medium shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  Send to KYC Review &rarr;
                </button>
              )}

              {application.status === 'KYC_REVIEW' && (
                <button
                  disabled={actionLoading}
                  onClick={() => handleAdvanceStatus('COMPLIANCE_REVIEW')}
                  className="px-3 py-1.5 bg-purple-900 hover:bg-purple-800 text-white rounded text-xs font-medium shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  Send to Compliance Review &rarr;
                </button>
              )}

              {application.status === 'COMPLIANCE_REVIEW' && (
                <button
                  disabled={actionLoading}
                  onClick={handleApproveApplication}
                  className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-medium shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Approve Application
                </button>
              )}

              {application.status === 'APPROVED' && (
                <button
                  disabled={actionLoading}
                  onClick={handleCompleteOnboarding}
                  className="px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded text-xs font-medium shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <Check className="w-3.5 h-3.5" />
                  Complete Account Provisioning
                </button>
              )}

              {!['APPROVED', 'COMPLETED', 'REJECTED', 'WITHDRAWN'].includes(application.status) && (
                <button
                  disabled={actionLoading}
                  onClick={() => setShowRejectBox(!showRejectBox)}
                  className="px-3 py-1.5 bg-white border border-red-200 text-red-700 hover:bg-red-50 rounded text-xs font-medium cursor-pointer"
                >
                  Decline / Reject
                </button>
              )}
            </div>
          </div>

          {/* Rejection input dropdown */}
          {showRejectBox && (
            <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded-md text-xs space-y-2">
              <div className="font-semibold text-red-900">Confirm Application Rejection</div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter regulatory rejection reason (e.g. Incomplete proof of address, PAN mismatch, Sanctions check match)..."
                rows={2}
                className="w-full p-2 bg-white border border-red-300 rounded text-xs text-slate-800 focus:outline-hidden focus:ring-1 focus:ring-red-600"
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowRejectBox(false)}
                  className="px-2.5 py-1 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-100 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRejectApplication}
                  disabled={actionLoading}
                  className="px-3 py-1 bg-red-700 text-white rounded hover:bg-red-800 cursor-pointer font-medium"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 px-4 bg-white flex gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`py-3 px-2 text-xs font-medium border-b-2 cursor-pointer ${
              activeTab === 'overview'
                ? 'border-blue-900 text-blue-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview &amp; Products
          </button>
          <button
            onClick={() => setActiveTab('kyc-kyb')}
            className={`py-3 px-2 text-xs font-medium border-b-2 cursor-pointer ${
              activeTab === 'kyc-kyb'
                ? 'border-blue-900 text-blue-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            KYC / KYB Verification
          </button>
          <button
            onClick={() => setActiveTab('documents')}
            className={`py-3 px-2 text-xs font-medium border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'documents'
                ? 'border-blue-900 text-blue-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Documents &amp; Evidence ({application.documents?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab('exceptions')}
            className={`py-3 px-2 text-xs font-medium border-b-2 cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'exceptions'
                ? 'border-blue-900 text-blue-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Exceptions ({application.exceptions?.length || 0})
            {application.exceptionCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-red-600 animate-pulse"></span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('timeline')}
            className={`py-3 px-2 text-xs font-medium border-b-2 cursor-pointer ${
              activeTab === 'timeline'
                ? 'border-blue-900 text-blue-900 font-bold'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Audit Timeline &amp; Events
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5">
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* Application Details Grid */}
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Dossier Information
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400">Onboarding Type:</span>
                    <div className="font-semibold text-slate-800 mt-0.5">
                      {application.onboardingType.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Customer Linkage:</span>
                    <div className="font-semibold text-slate-800 mt-0.5 flex items-center gap-1.5">
                      {application.customerCode ? (
                        <>
                          <span className="font-mono">{application.customerCode}</span>
                          {onNavigateToCustomer && (
                            <button
                              onClick={() => onNavigateToCustomer(application.customerCode!)}
                              className="text-blue-700 hover:underline inline-flex items-center gap-0.5 text-[11px]"
                            >
                              Customer 360 <ExternalLink className="w-3 h-3" />
                            </button>
                          )}
                        </>
                      ) : (
                        <span className="text-slate-500 italic">New Client Prospect</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Origination Pipeline:</span>
                    <div className="font-semibold text-slate-800 mt-0.5">
                      {application.opportunityTitle || 'Direct Ingestion'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Branch Location:</span>
                    <div className="font-semibold text-slate-800 mt-0.5">
                      {application.branchName} ({application.branchCode})
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">SLA Commitment:</span>
                    <div className="font-semibold text-slate-800 mt-0.5">
                      {application.slaHoursTotal} hours ({application.slaHoursRemaining}h remaining)
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Submitted Timestamp:</span>
                    <div className="font-semibold text-slate-800 mt-0.5">
                      {application.submittedDate
                        ? new Date(application.submittedDate).toLocaleString('en-IN')
                        : 'Draft'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Requested Products */}
              <div className="border border-slate-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Requested Banking Products &amp; Services
                  </h4>
                  <span className="text-xs font-medium text-slate-500">
                    {application.products?.length || 0} Products Selected
                  </span>
                </div>

                {application.products && application.products.length > 0 ? (
                  <div className="space-y-2">
                    {application.products.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900">{p.productName}</div>
                          <div className="text-slate-400 font-mono text-[11px]">
                            {p.productCode} • {p.category}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-slate-800">
                            ₹{Number(p.initialDepositAmount || 0).toLocaleString('en-IN')}
                          </div>
                          <span className="inline-block px-1.5 py-0.5 bg-blue-50 text-blue-800 border border-blue-200 rounded text-[10px] font-semibold uppercase mt-0.5">
                            {p.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 text-center text-slate-400 text-xs">
                    No products enrolled in this application.
                  </div>
                )}
              </div>

              {/* Compliance & Notes */}
              {application.notes && (
                <div className="border border-slate-200 rounded-lg p-4 space-y-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Application Notes &amp; Observations
                  </h4>
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded border border-slate-200 leading-relaxed whitespace-pre-wrap">
                    {application.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'kyc-kyb' && (
            <div className="space-y-5">
              {/* Synthetic Verification Notice */}
              <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-md text-xs text-amber-800 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Synthetic Banking Simulation Environment</div>
                  <div className="text-[11px] text-amber-700 mt-0.5">
                    NSDL PAN verification, UIDAI Aadhaar e-KYC, CKYCR registry, and OFAC/UN sanctions screening are simulated for demonstration and evaluation purposes.
                  </div>
                </div>
              </div>

              {/* Individual KYC Section */}
              {application.kycReview && (
                <div className="border border-slate-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Individual KYC Verification Checklist
                      </h4>
                      <p className="text-xs text-slate-500">
                        Status: <span className="font-bold text-blue-900">{application.kycReview.status}</span>
                      </p>
                    </div>

                    <button
                      onClick={handleVerifyKycAll}
                      disabled={kycUpdating}
                      className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-medium shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verify All Checkpoints
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                      <div className="font-medium text-slate-500">PAN Verification (NSDL Simulated)</div>
                      <div className="font-mono font-bold text-slate-900 text-sm">
                        {application.kycReview.panNumber || 'ABCDE1234F'}
                      </div>
                      <span className="inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                        {application.kycReview.panVerificationStatus}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                      <div className="font-medium text-slate-500">CKYC Registry Status</div>
                      <div className="font-mono font-bold text-slate-900 text-sm">
                        {application.kycReview.ckycNumber || 'CKYC-2026-904128'}
                      </div>
                      <span className="inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                        REGISTRY_ACTIVE
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                      <div className="font-medium text-slate-500">PEP (Politically Exposed Persons)</div>
                      <div className="font-bold text-slate-800">{application.kycReview.pepStatus}</div>
                      <span className="text-[10px] text-slate-400">Zero global matches detected</span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                      <div className="font-medium text-slate-500">AML Sanctions Screening</div>
                      <div className="font-bold text-emerald-700">{application.kycReview.sanctionsCheckStatus}</div>
                      <span className="text-[10px] text-slate-400">OFAC / UN / RBI watchlist clear</span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                      <div className="font-medium text-slate-500">Adverse Media Screening</div>
                      <div className="font-bold text-emerald-700">{application.kycReview.adverseMediaStatus}</div>
                      <span className="text-[10px] text-slate-400">No negative news or litigations</span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                      <div className="font-medium text-slate-500">Assigned Risk Category</div>
                      <div className="font-bold text-blue-900">{application.kycReview.riskCategory} RISK</div>
                      <span className="text-[10px] text-slate-400">2-year periodic review cycle</span>
                    </div>
                  </div>

                  {application.kycReview.reviewSummary && (
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded text-xs text-slate-700">
                      <span className="font-semibold text-slate-900">Review Summary:</span>{' '}
                      {application.kycReview.reviewSummary}
                    </div>
                  )}
                </div>
              )}

              {/* Corporate KYB Section */}
              {application.customerType === 'BUSINESS' && application.kybReview && (
                <div className="border border-slate-200 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        Corporate KYB &amp; Entity Diligence
                      </h4>
                      <p className="text-xs text-slate-500">
                        Legal Entity: <span className="font-semibold">{application.kybReview.legalEntityName}</span>
                      </p>
                    </div>

                    <button
                      onClick={handleVerifyKybAll}
                      disabled={kycUpdating}
                      className="px-3 py-1.5 bg-indigo-700 hover:bg-indigo-800 text-white rounded text-xs font-medium shadow-xs flex items-center gap-1.5 cursor-pointer"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Verify Entity &amp; UBO
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                      <div className="font-medium text-slate-500">Entity Type &amp; CIN</div>
                      <div className="font-bold text-slate-800">{application.kybReview.entityType}</div>
                      <div className="font-mono text-slate-600 text-[11px]">
                        {application.kybReview.cinOrRegistrationNumber || 'U27100MH2012PTC234567'}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                      <div className="font-medium text-slate-500">GSTIN Registration</div>
                      <div className="font-mono font-bold text-slate-800">
                        {application.kybReview.gstin || '27AABCK1234M1Z5'}
                      </div>
                      <span className="inline-block px-1.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold">
                        ACTIVE_FILER
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                      <div className="font-medium text-slate-500">UBO (Ultimate Beneficial Owner) Check</div>
                      <div className="font-bold text-slate-800">
                        {application.kybReview.uboVerificationStatus}
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {application.kybReview.uboCount} UBO identified &gt; 10% equity threshold
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 border border-slate-200 rounded space-y-1">
                      <div className="font-medium text-slate-500">Board Resolution &amp; Power of Attorney</div>
                      <div className="font-bold text-slate-800">
                        {application.kybReview.boardResolutionStatus}
                      </div>
                      <span className="text-[10px] text-slate-500">Signed with company seal</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">Document Management &amp; Review</h4>
                  <p className="text-xs text-slate-500">
                    Verify, reject or request replacements with mandatory audit trails.
                  </p>
                </div>

                <button
                  onClick={() => setShowUploadForm(!showUploadForm)}
                  className="px-3 py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded text-xs font-medium shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload Document
                </button>
              </div>

              {/* Upload form */}
              {showUploadForm && (
                <form
                  onSubmit={handleUploadDocument}
                  className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-3 text-xs"
                >
                  <div className="font-semibold text-slate-900">Upload New Document</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1">Document Type</label>
                      <select
                        value={uploadDocType}
                        onChange={(e) => setUploadDocType(e.target.value)}
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      >
                        <option value="IDENTITY_PROOF">Identity Proof (Aadhaar / Passport / Voter ID)</option>
                        <option value="PAN_CARD">Permanent Account Number (PAN Card)</option>
                        <option value="ADDRESS_PROOF">Address Proof (Utility / Lease)</option>
                        <option value="BUSINESS_REGISTRATION">Certificate of Incorporation / GST</option>
                        <option value="MOA_AOA">MOA &amp; AOA / Partnership Deed</option>
                        <option value="BOARD_RESOLUTION">Board Resolution / Authorised Signatories</option>
                        <option value="BANK_STATEMENT">Bank Account Statements (6 Months)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1">Document Title</label>
                      <input
                        type="text"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        placeholder="e.g. Director Aadhaar Card"
                        required
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 mb-1">File Name</label>
                      <input
                        type="text"
                        value={uploadFileName}
                        onChange={(e) => setUploadFileName(e.target.value)}
                        placeholder="e.g. director_aadhaar_scan.pdf"
                        required
                        className="w-full p-1.5 bg-white border border-slate-300 rounded text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setShowUploadForm(false)}
                      className="px-3 py-1 bg-white border border-slate-300 text-slate-700 rounded hover:bg-slate-100 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploadLoading}
                      className="px-3 py-1 bg-blue-900 text-white rounded hover:bg-blue-800 font-medium cursor-pointer"
                    >
                      {uploadLoading ? 'Uploading...' : 'Confirm Upload'}
                    </button>
                  </div>
                </form>
              )}

              {/* Documents List */}
              {application.documents && application.documents.length > 0 ? (
                <div className="space-y-2.5">
                  {application.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded bg-blue-50 text-blue-900 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 flex items-center gap-2">
                            <span>{doc.title}</span>
                            <span className="font-mono text-[10px] text-slate-400">
                              v{doc.version}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                            {doc.fileName} • {doc.fileSize} • Code: {doc.documentCode}
                          </div>
                          {doc.rejectionReason && (
                            <div className="mt-1 text-red-600 font-medium text-[11px]">
                              Rejection: {doc.rejectionReason}
                            </div>
                          )}
                          {doc.replacementReason && (
                            <div className="mt-1 text-orange-700 font-medium text-[11px]">
                              Replacement requested: {doc.replacementReason}{' '}
                              {doc.replacementDueDate && `(Due: ${doc.replacementDueDate})`}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-medium border ${
                            doc.status === 'VERIFIED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : doc.status === 'REJECTED'
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : doc.status === 'REPLACEMENT_REQUIRED'
                              ? 'bg-orange-50 text-orange-700 border-orange-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}
                        >
                          {doc.status.replace(/_/g, ' ')}
                        </span>

                        <button
                          onClick={() => onReviewDoc(doc)}
                          className="px-2.5 py-1 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded text-xs font-medium shadow-2xs cursor-pointer"
                        >
                          Review &amp; Verify
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                  No documents uploaded yet. Use the upload button above to ingest proofs.
                </div>
              )}
            </div>
          )}

          {activeTab === 'exceptions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900">
                    Onboarding Exceptions &amp; Blockers
                  </h4>
                  <p className="text-xs text-slate-500">
                    Resolution and waiver management with maker/checker compliance.
                  </p>
                </div>

                <button
                  onClick={() => onRaiseException(application)}
                  className="px-3 py-1.5 bg-red-700 hover:bg-red-800 text-white rounded text-xs font-medium shadow-xs flex items-center gap-1 cursor-pointer"
                >
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Raise Exception
                </button>
              </div>

              {application.exceptions && application.exceptions.length > 0 ? (
                <div className="space-y-3">
                  {application.exceptions.map((exc) => (
                    <div
                      key={exc.id}
                      className="p-4 bg-white border border-slate-200 rounded-lg text-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                                exc.severity === 'CRITICAL'
                                  ? 'bg-red-100 text-red-800 border-red-300'
                                  : exc.severity === 'HIGH'
                                  ? 'bg-orange-50 text-orange-800 border-orange-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                              }`}
                            >
                              {exc.severity}
                            </span>
                            <span className="font-mono text-slate-400 text-[11px]">
                              {exc.exceptionCode}
                            </span>
                            <span className="font-bold text-slate-900">{exc.title}</span>
                          </div>
                          <p className="text-slate-600 mt-1">{exc.description}</p>
                        </div>

                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold border shrink-0 ${
                            exc.status === 'RESOLVED'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                              : exc.status === 'WAIVED'
                              ? 'bg-purple-50 text-purple-700 border-purple-200'
                              : 'bg-red-50 text-red-700 border-red-200'
                          }`}
                        >
                          {exc.status}
                        </span>
                      </div>

                      {exc.resolution && (
                        <div className="p-2 bg-emerald-50/50 border border-emerald-100 rounded text-[11px] text-emerald-900">
                          <span className="font-bold">Resolution:</span> {exc.resolution}
                        </div>
                      )}

                      {exc.waiveReason && (
                        <div className="p-2 bg-purple-50/50 border border-purple-100 rounded text-[11px] text-purple-900">
                          <span className="font-bold">Waiver Justification:</span> {exc.waiveReason}
                        </div>
                      )}

                      {exc.status === 'OPEN' && (
                        <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
                          <button
                            onClick={() => onResolveException(exc)}
                            className="px-2.5 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-medium cursor-pointer"
                          >
                            Resolve Exception
                          </button>
                          <button
                            onClick={() => onWaiveException(exc)}
                            className="px-2.5 py-1 bg-white border border-purple-300 text-purple-800 hover:bg-purple-50 rounded text-xs font-medium cursor-pointer"
                          >
                            Waive (Compliance / BM)
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-lg">
                  No active exceptions recorded on this application.
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900">Statutory Audit Trail &amp; Events</h4>

              {application.events && application.events.length > 0 ? (
                <div className="relative border-l-2 border-slate-200 ml-3 space-y-4 pl-4 text-xs">
                  {application.events.map((evt) => (
                    <div key={evt.id} className="relative">
                      <div className="w-2.5 h-2.5 bg-blue-900 rounded-full absolute -left-[21px] top-1.5 border-2 border-white"></div>
                      <div className="font-bold text-slate-900">{evt.title}</div>
                      <p className="text-slate-600 mt-0.5">{evt.description}</p>
                      <div className="text-[10px] text-slate-400 font-mono mt-1">
                        By {evt.actorName} ({evt.actorRole.replace(/_/g, ' ')}) •{' '}
                        {new Date(evt.createdAt).toLocaleString('en-IN')}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs">No events logged yet.</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
