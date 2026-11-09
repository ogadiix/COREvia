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
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';

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
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/50 backdrop-blur-2xs transition-opacity">
      <div className="w-full max-w-4xl bg-white dark:bg-[#162638] h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-[#33485D]">
        {/* Drawer Header */}
        <div className="p-4 bg-slate-50 dark:bg-[#101C2A] border-b border-slate-200 dark:border-[#33485D]">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold px-2 py-0.5 bg-[#142C45] dark:bg-[#1B9D92] text-white rounded">
                  {application.applicationNumber}
                </span>
                <span className="px-2 py-0.5 bg-slate-100 dark:bg-[#192B3D] text-slate-700 dark:text-[#A9BACB] border border-slate-200 dark:border-[#33485D] rounded text-xs font-medium">
                  {application.customerType === 'BUSINESS' ? 'Corporate' : 'Individual'}
                </span>
                <span
                  className={`px-2 py-0.5 rounded text-xs font-semibold border ${
                    application.priority === 'URGENT'
                      ? 'bg-rose-50 dark:bg-rose-950/60 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900'
                      : application.priority === 'HIGH'
                      ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900'
                      : 'bg-slate-100 dark:bg-[#192B3D] text-slate-700 dark:text-[#A9BACB] border-slate-200 dark:border-[#33485D]'
                  }`}
                >
                  {application.priority} PRIORITY
                </span>
              </div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-[#E8EEF5] mt-1">{application.applicantName}</h2>
              <div className="text-xs text-slate-500 dark:text-[#8194A8] flex items-center gap-3 mt-0.5">
                <span>Branch: {application.branchName}</span>
                <span>•</span>
                <span>Assigned RM: {application.assignedRmName || 'Unassigned'}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                size="xs"
                variant="outline"
                onClick={() => onReassign(application)}
                icon={<UserPlus className="w-3.5 h-3.5" />}
              >
                Reassign
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => onRaiseException(application)}
                className="text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800"
                icon={<AlertTriangle className="w-3.5 h-3.5" />}
              >
                Raise Exception
              </Button>
              <button
                onClick={onClose}
                className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-md hover:bg-slate-100 dark:hover:bg-[#192B3D] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Action Error Display */}
          {actionError && (
            <div className="mt-3 p-2.5 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-900 rounded text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
              <AlertOctagon className="w-4 h-4 shrink-0" />
              <span>{actionError}</span>
            </div>
          )}

          {/* Workflow Action Bar */}
          <div className="mt-3 pt-3 border-t border-slate-200 dark:border-[#1F334A] flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <span className="text-xs font-medium text-slate-500 dark:text-[#8194A8]">Current Status:</span>
              <span className="font-semibold text-xs text-[#168C83] dark:text-[#1B9D92] bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-200 dark:border-emerald-800">
                {application.status.replace(/_/g, ' ')}
              </span>
            </div>

            <div className="flex items-center gap-2">
              {application.status === 'SUBMITTED' && (
                <Button
                  size="xs"
                  variant="primary"
                  disabled={actionLoading}
                  onClick={() => handleAdvanceStatus('DOCUMENT_REVIEW')}
                >
                  Start Document Review &rarr;
                </Button>
              )}

              {application.status === 'DOCUMENT_REVIEW' && (
                <Button
                  size="xs"
                  variant="primary"
                  disabled={actionLoading}
                  onClick={() => handleAdvanceStatus('KYC_REVIEW')}
                >
                  Send to KYC Review &rarr;
                </Button>
              )}

              {application.status === 'KYC_REVIEW' && (
                <Button
                  size="xs"
                  variant="primary"
                  disabled={actionLoading}
                  onClick={() => handleAdvanceStatus('COMPLIANCE_REVIEW')}
                >
                  Send to Compliance Review &rarr;
                </Button>
              )}

              {application.status === 'COMPLIANCE_REVIEW' && (
                <Button
                  size="xs"
                  variant="primary"
                  disabled={actionLoading}
                  onClick={handleApproveApplication}
                  icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                >
                  Approve Application
                </Button>
              )}

              {application.status === 'APPROVED' && (
                <Button
                  size="xs"
                  variant="primary"
                  disabled={actionLoading}
                  onClick={handleCompleteOnboarding}
                  icon={<Check className="w-3.5 h-3.5" />}
                >
                  Complete Account Provisioning
                </Button>
              )}

              {!['APPROVED', 'COMPLETED', 'REJECTED', 'WITHDRAWN'].includes(application.status) && (
                <Button
                  size="xs"
                  variant="outline"
                  disabled={actionLoading}
                  onClick={() => setShowRejectBox(!showRejectBox)}
                  className="text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800"
                >
                  Decline / Reject
                </Button>
              )}
            </div>
          </div>

          {/* Rejection input box */}
          {showRejectBox && (
            <div className="mt-3 p-3 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 rounded text-xs space-y-2">
              <div className="font-semibold text-rose-900 dark:text-rose-200">Confirm Application Rejection</div>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Enter regulatory rejection reason (e.g. Incomplete proof of address, PAN mismatch, Sanctions check match)..."
                rows={2}
                className="w-full p-2 bg-white dark:bg-[#162638] border border-rose-300 dark:border-rose-800 rounded text-xs text-slate-800 dark:text-[#E8EEF5] focus:outline-none focus:ring-1 focus:ring-rose-500"
              />
              <div className="flex justify-end gap-2">
                <Button size="xs" variant="outline" onClick={() => setShowRejectBox(false)}>
                  Cancel
                </Button>
                <Button
                  size="xs"
                  variant="primary"
                  onClick={handleRejectApplication}
                  disabled={actionLoading}
                  className="bg-rose-700 hover:bg-rose-800"
                >
                  Confirm Rejection
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="border-b border-slate-200 dark:border-[#33485D] px-4 bg-white dark:bg-[#162638] flex gap-2 overflow-x-auto text-xs">
          {[
            { id: 'overview', label: 'Overview & Products' },
            { id: 'kyc-kyb', label: 'KYC / KYB Verification' },
            { id: 'documents', label: `Documents & Evidence (${application.documents?.length || 0})` },
            { id: 'exceptions', label: `Exceptions (${application.exceptions?.length || 0})` },
            { id: 'timeline', label: 'Audit Timeline & Events' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as DrawerTab)}
              className={`py-3 px-2 font-medium border-b-2 transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === tab.id
                  ? 'border-[#168C83] text-[#142C45] dark:text-[#1B9D92] font-bold'
                  : 'border-transparent text-slate-500 dark:text-[#8194A8] hover:text-slate-800 dark:hover:text-[#E8EEF5]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-5 text-xs">
          {activeTab === 'overview' && (
            <div className="space-y-4">
              {/* Application Details Grid */}
              <div className="bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded p-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-900 dark:text-[#E8EEF5] uppercase tracking-wider">
                  Dossier Information
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-400 dark:text-[#8194A8]">Onboarding Type:</span>
                    <div className="font-semibold text-slate-800 dark:text-[#E8EEF5] mt-0.5">
                      {application.onboardingType.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-[#8194A8]">Customer Linkage:</span>
                    <div className="font-semibold text-slate-800 dark:text-[#E8EEF5] mt-0.5 flex items-center gap-1.5">
                      {application.customerCode ? (
                        <>
                          <span className="font-mono">{application.customerCode}</span>
                          {onNavigateToCustomer && (
                            <button
                              onClick={() => onNavigateToCustomer(application.customerCode!)}
                              className="text-[#168C83] dark:text-[#1B9D92] hover:underline inline-flex items-center gap-0.5 text-[11px]"
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
                    <span className="text-slate-400 dark:text-[#8194A8]">Origination Pipeline:</span>
                    <div className="font-semibold text-slate-800 dark:text-[#E8EEF5] mt-0.5">
                      {application.opportunityTitle || 'Direct Ingestion'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-[#8194A8]">Branch Location:</span>
                    <div className="font-semibold text-slate-800 dark:text-[#E8EEF5] mt-0.5">
                      {application.branchName} ({application.branchCode})
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-[#8194A8]">SLA Commitment:</span>
                    <div className="font-semibold text-slate-800 dark:text-[#E8EEF5] mt-0.5">
                      {application.slaHoursTotal} hours ({application.slaHoursRemaining}h remaining)
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 dark:text-[#8194A8]">Submitted Timestamp:</span>
                    <div className="font-semibold text-slate-800 dark:text-[#E8EEF5] mt-0.5">
                      {application.submittedDate
                        ? new Date(application.submittedDate).toLocaleString('en-IN')
                        : 'Draft'}
                    </div>
                  </div>
                </div>
              </div>

              {/* Requested Products */}
              <div className="border border-slate-200 dark:border-[#33485D] rounded p-4 space-y-3 bg-white dark:bg-[#162638]">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-[#E8EEF5] uppercase tracking-wider">
                    Requested Banking Products &amp; Services
                  </h4>
                  <span className="text-xs font-medium text-slate-500 dark:text-[#8194A8]">
                    {application.products?.length || 0} Products Selected
                  </span>
                </div>

                {application.products && application.products.length > 0 ? (
                  <div className="space-y-2">
                    {application.products.map((p) => (
                      <div
                        key={p.id}
                        className="p-3 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded flex items-center justify-between text-xs"
                      >
                        <div>
                          <div className="font-bold text-slate-900 dark:text-[#E8EEF5]">{p.productName}</div>
                          <div className="text-slate-400 dark:text-[#8194A8] font-mono text-[11px]">
                            {p.productCode} • {p.category}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-mono font-bold text-slate-800 dark:text-[#E8EEF5]">
                            ₹{Number(p.initialDepositAmount || 0).toLocaleString('en-IN')}
                          </div>
                          <span className="inline-block px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded text-[10px] font-semibold uppercase mt-0.5">
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
            </div>
          )}

          {activeTab === 'kyc-kyb' && (
            <div className="space-y-4">
              {/* Synthetic Verification Notice */}
              <div className="p-3 bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded text-xs text-amber-800 dark:text-amber-200 flex items-start gap-2">
                <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold">Synthetic Banking Simulation Environment</div>
                  <div className="text-[11px] text-amber-700 dark:text-amber-300 mt-0.5">
                    NSDL PAN verification, UIDAI Aadhaar e-KYC, CKYCR registry, and OFAC/UN sanctions screening are simulated for demonstration purposes.
                  </div>
                </div>
              </div>

              {/* Individual KYC Section */}
              {application.kycReview && (
                <div className="border border-slate-200 dark:border-[#33485D] rounded p-4 space-y-4 bg-white dark:bg-[#162638]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-[#E8EEF5]">
                        Individual KYC Verification Checklist
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-[#8194A8]">
                        Status: <span className="font-bold text-[#168C83] dark:text-[#1B9D92]">{application.kycReview.status}</span>
                      </p>
                    </div>

                    <Button
                      size="xs"
                      variant="primary"
                      onClick={handleVerifyKycAll}
                      disabled={kycUpdating}
                      icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    >
                      Verify All Checkpoints
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded space-y-1">
                      <div className="font-medium text-slate-500 dark:text-[#8194A8]">PAN Verification (NSDL Simulated)</div>
                      <div className="font-mono font-bold text-slate-900 dark:text-[#E8EEF5] text-sm">
                        {application.kycReview.panNumber || 'ABCDE1234F'}
                      </div>
                      <span className="inline-block px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded text-[10px] font-bold">
                        {application.kycReview.panVerificationStatus}
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded space-y-1">
                      <div className="font-medium text-slate-500 dark:text-[#8194A8]">CKYC Registry Status</div>
                      <div className="font-mono font-bold text-slate-900 dark:text-[#E8EEF5] text-sm">
                        {application.kycReview.ckycNumber || 'CKYC-2026-904128'}
                      </div>
                      <span className="inline-block px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded text-[10px] font-bold">
                        REGISTRY_ACTIVE
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded space-y-1">
                      <div className="font-medium text-slate-500 dark:text-[#8194A8]">PEP (Politically Exposed Persons)</div>
                      <div className="font-bold text-slate-800 dark:text-[#E8EEF5]">{application.kycReview.pepStatus}</div>
                      <span className="text-[10px] text-slate-400">Zero global matches detected</span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded space-y-1">
                      <div className="font-medium text-slate-500 dark:text-[#8194A8]">AML Sanctions Screening</div>
                      <div className="font-bold text-emerald-700 dark:text-emerald-400">{application.kycReview.sanctionsCheckStatus}</div>
                      <span className="text-[10px] text-slate-400">OFAC / UN / RBI watchlist clear</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Corporate KYB Section */}
              {application.customerType === 'BUSINESS' && application.kybReview && (
                <div className="border border-slate-200 dark:border-[#33485D] rounded p-4 space-y-4 bg-white dark:bg-[#162638]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-[#E8EEF5]">
                        Corporate KYB &amp; Entity Diligence
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-[#8194A8]">
                        Legal Entity: <span className="font-semibold">{application.kybReview.legalEntityName}</span>
                      </p>
                    </div>

                    <Button
                      size="xs"
                      variant="primary"
                      onClick={handleVerifyKybAll}
                      disabled={kycUpdating}
                      icon={<CheckCircle2 className="w-3.5 h-3.5" />}
                    >
                      Verify Entity &amp; UBO
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded space-y-1">
                      <div className="font-medium text-slate-500 dark:text-[#8194A8]">Entity Type &amp; CIN</div>
                      <div className="font-bold text-slate-800 dark:text-[#E8EEF5]">{application.kybReview.entityType}</div>
                      <div className="font-mono text-slate-600 dark:text-[#A9BACB] text-[11px]">
                        {application.kybReview.cinOrRegistrationNumber || 'U27100MH2012PTC234567'}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded space-y-1">
                      <div className="font-medium text-slate-500 dark:text-[#8194A8]">GSTIN Registration</div>
                      <div className="font-mono font-bold text-slate-800 dark:text-[#E8EEF5]">
                        {application.kybReview.gstin || '27AABCK1234M1Z5'}
                      </div>
                      <span className="inline-block px-1.5 py-0.5 bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded text-[10px] font-bold">
                        ACTIVE_FILER
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded space-y-1">
                      <div className="font-medium text-slate-500 dark:text-[#8194A8]">UBO Check</div>
                      <div className="font-bold text-slate-800 dark:text-[#E8EEF5]">
                        {application.kybReview.uboVerificationStatus}
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-[#8194A8]">
                        {application.kybReview.uboCount} UBO identified &gt; 10% equity threshold
                      </span>
                    </div>

                    <div className="p-3 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded space-y-1">
                      <div className="font-medium text-slate-500 dark:text-[#8194A8]">Board Resolution</div>
                      <div className="font-bold text-slate-800 dark:text-[#E8EEF5]">
                        {application.kybReview.boardResolutionStatus}
                      </div>
                      <span className="text-[10px] text-slate-500 dark:text-[#8194A8]">Signed with company seal</span>
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
                  <h4 className="text-sm font-bold text-slate-900 dark:text-[#E8EEF5]">Document Management &amp; Review</h4>
                  <p className="text-xs text-slate-500 dark:text-[#8194A8]">
                    Verify, reject or request replacements with mandatory audit trails.
                  </p>
                </div>

                <Button
                  size="xs"
                  variant="primary"
                  onClick={() => setShowUploadForm(!showUploadForm)}
                  icon={<Upload className="w-3.5 h-3.5" />}
                >
                  Upload Document
                </Button>
              </div>

              {/* Upload form */}
              {showUploadForm && (
                <form
                  onSubmit={handleUploadDocument}
                  className="p-4 bg-slate-50 dark:bg-[#101C2A] border border-slate-200 dark:border-[#33485D] rounded space-y-3 text-xs"
                >
                  <div className="font-semibold text-slate-900 dark:text-[#E8EEF5]">Upload New Document</div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-slate-600 dark:text-[#A9BACB] mb-1">Document Type</label>
                      <select
                        value={uploadDocType}
                        onChange={(e) => setUploadDocType(e.target.value)}
                        className="w-full p-1.5 bg-white dark:bg-[#162638] border border-slate-300 dark:border-[#33485D] rounded text-slate-900 dark:text-[#E8EEF5] text-xs"
                      >
                        <option value="IDENTITY_PROOF">Identity Proof (Aadhaar / Passport / Voter ID)</option>
                        <option value="PAN_CARD">Permanent Account Number (PAN Card)</option>
                        <option value="ADDRESS_PROOF">Address Proof (Utility / Lease)</option>
                        <option value="BUSINESS_REGISTRATION">Certificate of Incorporation / GST</option>
                        <option value="MOA_AOA">MOA &amp; AOA / Partnership Deed</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-slate-600 dark:text-[#A9BACB] mb-1">Document Title</label>
                      <input
                        type="text"
                        value={uploadTitle}
                        onChange={(e) => setUploadTitle(e.target.value)}
                        placeholder="e.g. Director Aadhaar Card"
                        required
                        className="w-full p-1.5 bg-white dark:bg-[#162638] border border-slate-300 dark:border-[#33485D] rounded text-slate-900 dark:text-[#E8EEF5] text-xs"
                      />
                    </div>

                    <div>
                      <label className="block text-slate-600 dark:text-[#A9BACB] mb-1">File Name</label>
                      <input
                        type="text"
                        value={uploadFileName}
                        onChange={(e) => setUploadFileName(e.target.value)}
                        placeholder="e.g. director_aadhaar_scan.pdf"
                        required
                        className="w-full p-1.5 bg-white dark:bg-[#162638] border border-slate-300 dark:border-[#33485D] rounded text-slate-900 dark:text-[#E8EEF5] text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <Button size="xs" variant="outline" type="button" onClick={() => setShowUploadForm(false)}>
                      Cancel
                    </Button>
                    <Button size="xs" variant="primary" type="submit" disabled={uploadLoading}>
                      {uploadLoading ? 'Uploading...' : 'Confirm Upload'}
                    </Button>
                  </div>
                </form>
              )}

              {/* Documents List */}
              {application.documents && application.documents.length > 0 ? (
                <div className="space-y-2.5">
                  {application.documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="p-3.5 bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded hover:border-slate-300 dark:hover:border-[#435e7a] transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded bg-emerald-50 dark:bg-emerald-950/60 text-[#168C83] dark:text-[#1B9D92] border border-emerald-200 dark:border-emerald-800 flex items-center justify-center shrink-0 mt-0.5">
                          <FileText className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-[#E8EEF5] flex items-center gap-2">
                            <span>{doc.title}</span>
                            <span className="font-mono text-[10px] text-slate-400">
                              v{doc.version}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-[#8194A8] font-mono mt-0.5">
                            {doc.fileName} • {doc.fileSize} • Code: {doc.documentCode}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Badge
                          variant={
                            doc.status === 'VERIFIED'
                              ? 'success'
                              : doc.status === 'REJECTED'
                              ? 'danger'
                              : doc.status === 'REPLACEMENT_REQUIRED'
                              ? 'warning'
                              : 'neutral'
                          }
                          size="sm"
                        >
                          {doc.status.replace(/_/g, ' ')}
                        </Badge>

                        <Button size="xs" variant="outline" onClick={() => onReviewDoc(doc)}>
                          Review &amp; Verify
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-[#33485D] rounded">
                  No documents uploaded yet.
                </div>
              )}
            </div>
          )}

          {activeTab === 'exceptions' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-[#E8EEF5]">
                    Onboarding Exceptions &amp; Blockers
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-[#8194A8]">
                    Resolution and waiver management with maker/checker compliance.
                  </p>
                </div>

                <Button
                  size="xs"
                  variant="primary"
                  onClick={() => onRaiseException(application)}
                  className="bg-rose-700 hover:bg-rose-800"
                  icon={<AlertTriangle className="w-3.5 h-3.5" />}
                >
                  Raise Exception
                </Button>
              </div>

              {application.exceptions && application.exceptions.length > 0 ? (
                <div className="space-y-3">
                  {application.exceptions.map((exc) => (
                    <div
                      key={exc.id}
                      className="p-4 bg-white dark:bg-[#162638] border border-slate-200 dark:border-[#33485D] rounded text-xs space-y-2"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={exc.severity === 'CRITICAL' ? 'danger' : 'warning'}
                              size="sm"
                            >
                              {exc.severity}
                            </Badge>
                            <span className="font-mono text-slate-400 text-[11px]">
                              {exc.exceptionCode}
                            </span>
                            <span className="font-bold text-slate-900 dark:text-[#E8EEF5]">{exc.title}</span>
                          </div>
                          <p className="text-slate-600 dark:text-[#A9BACB] mt-1">{exc.description}</p>
                        </div>

                        <Badge
                          variant={
                            exc.status === 'RESOLVED'
                              ? 'success'
                              : exc.status === 'WAIVED'
                              ? 'neutral'
                              : 'danger'
                          }
                          size="sm"
                        >
                          {exc.status}
                        </Badge>
                      </div>

                      {exc.status === 'OPEN' && (
                        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-[#1F334A]">
                          <Button size="xs" variant="primary" onClick={() => onResolveException(exc)}>
                            Resolve Exception
                          </Button>
                          <Button size="xs" variant="outline" onClick={() => onWaiveException(exc)}>
                            Waive (Compliance)
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 dark:border-[#33485D] rounded">
                  No active exceptions recorded on this application.
                </div>
              )}
            </div>
          )}

          {activeTab === 'timeline' && (
            <div className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-[#E8EEF5]">Statutory Audit Trail &amp; Events</h4>

              {application.events && application.events.length > 0 ? (
                <div className="relative border-l-2 border-slate-200 dark:border-[#33485D] ml-3 space-y-4 pl-4 text-xs">
                  {application.events.map((evt) => (
                    <div key={evt.id} className="relative">
                      <div className="w-2.5 h-2.5 bg-[#168C83] rounded-full absolute -left-[21px] top-1.5 border-2 border-white dark:border-[#162638]"></div>
                      <div className="font-bold text-slate-900 dark:text-[#E8EEF5]">{evt.title}</div>
                      <p className="text-slate-600 dark:text-[#A9BACB] mt-0.5">{evt.description}</p>
                      <div className="text-[10px] text-slate-400 dark:text-[#8194A8] font-mono mt-1">
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
